package handlers

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"pollwave/internal/db"
	"pollwave/internal/models"
)

const slugAlphabet = "abcdefghijkmnpqrstuvwxyz23456789" // no look-alike chars

func newSlug(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	for i := range b {
		b[i] = slugAlphabet[int(b[i])%len(slugAlphabet)]
	}
	return string(b)
}

type createPollReq struct {
	Question string   `json:"question"`
	Options  []string `json:"options"`
}

// CreatePoll is auth-protected. Validation happens here, before Mongo sees anything.
func CreatePoll(c *gin.Context) {
	var req createPollReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "malformed body"})
		return
	}

	req.Question = strings.TrimSpace(req.Question)
	if len(req.Question) < 5 || len(req.Question) > 200 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "question must be 5-200 characters"})
		return
	}

	// clean the options: trim, drop blanks, reject duplicates
	seen := map[string]bool{}
	opts := make([]models.Option, 0, len(req.Options))
	for i, raw := range req.Options {
		t := strings.TrimSpace(raw)
		if t == "" {
			continue
		}
		if len(t) > 100 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "each option must be 100 characters or fewer"})
			return
		}
		key := strings.ToLower(t)
		if seen[key] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "options must be unique"})
			return
		}
		seen[key] = true
		opts = append(opts, models.Option{ID: "opt" + string(rune('a'+i)), Text: t})
	}
	if len(opts) < 2 || len(opts) > 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "provide between 2 and 6 options"})
		return
	}

	ownerID, err := primitive.ObjectIDFromHex(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}

	poll := models.Poll{
		Slug:      newSlug(7),
		Question:  req.Question,
		Options:   opts,
		OwnerID:   ownerID,
		OwnerName: c.GetString("userName"),
		CreatedAt: time.Now(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	res, err := db.Polls.InsertOne(ctx, poll)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create poll"})
		return
	}
	poll.ID = res.InsertedID.(primitive.ObjectID)

	// seed every option at zero so the first render shows all bars
	pairs := make([]interface{}, 0, len(opts)*2)
	for _, o := range opts {
		pairs = append(pairs, o.ID, 0)
	}
	db.RDB.HSet(ctx, db.CountsKey(poll.ID.Hex()), pairs...)

	c.JSON(http.StatusCreated, poll)
}

// GetPoll is public: anyone with the link can load it.
func GetPoll(c *gin.Context) {
	poll, err := findBySlug(c.Param("slug"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "poll not found"})
		return
	}
	counts, total := ReadCounts(poll)
	c.JSON(http.StatusOK, gin.H{
		"poll":    poll,
		"results": models.ResultsPayload{Counts: counts, Total: total, Closed: poll.Closed},
	})
}

// MyPolls lists the polls the logged-in user owns.
func MyPolls(c *gin.Context) {
	ownerID, err := primitive.ObjectIDFromHex(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid session"})
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cur, err := db.Polls.Find(ctx, bson.M{"ownerId": ownerID},
		options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(50))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load polls"})
		return
	}
	var polls []models.Poll
	if err := cur.All(ctx, &polls); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load polls"})
		return
	}
	if polls == nil {
		polls = []models.Poll{}
	}

	out := make([]gin.H, 0, len(polls))
	for _, p := range polls {
		counts := make(map[string]int64, len(p.Options))
		for _, option := range p.Options {
			counts[option.ID] = 0
		}
		counts, total := rebuildFromMongo(ctx, &p, counts)
		out = append(out, gin.H{"poll": p, "counts": counts, "total": total})
	}
	c.JSON(http.StatusOK, out)
}

// ClosePoll lets only the owner stop further voting.
func ClosePoll(c *gin.Context) {
	poll, err := findBySlug(c.Param("slug"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "poll not found"})
		return
	}
	if poll.OwnerID.Hex() != c.GetString("userID") {
		c.JSON(http.StatusForbidden, gin.H{"error": "only the poll owner can close it"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if _, err := db.Polls.UpdateByID(ctx, poll.ID, bson.M{"$set": bson.M{"closed": true}}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not close poll"})
		return
	}
	poll.Closed = true

	// tell every connected viewer immediately
	counts, total := ReadCounts(poll)
	payload, _ := json.Marshal(models.ResultsPayload{Counts: counts, Total: total, Closed: true})
	db.RDB.Publish(ctx, db.Channel(poll.ID.Hex()), payload)

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func findBySlug(slug string) (*models.Poll, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var poll models.Poll
	err := db.Polls.FindOne(ctx, bson.M{"slug": slug}).Decode(&poll)
	return &poll, err
}
