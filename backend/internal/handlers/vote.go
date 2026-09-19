package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"

	"pollwave/internal/db"
	"pollwave/internal/models"
)

type voteReq struct {
	OptionID string `json:"optionId"`
	VoterID  string `json:"voterId"` // anonymous browser id, generated client-side
}

// Vote is public (anyone with the link votes) but heavily validated.
func Vote(c *gin.Context) {
	var req voteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "malformed body"})
		return
	}

	poll, err := findBySlug(c.Param("slug"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "poll not found"})
		return
	}
	if poll.Closed {
		c.JSON(http.StatusConflict, gin.H{"error": "this poll is closed"})
		return
	}

	// the option must actually belong to THIS poll - never trust the client's id
	valid := false
	for _, o := range poll.Options {
		if o.ID == req.OptionID {
			valid = true
			break
		}
	}
	if !valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "that option does not belong to this poll"})
		return
	}

	voter := strings.TrimSpace(req.VoterID)
	if len(voter) < 8 || len(voter) > 64 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid voter id"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pollID := poll.ID.Hex()

	// Redis SET NX is the fast gate: first writer wins, everyone else is a repeat voter.
	first, err := db.RDB.SetNX(ctx, db.VoterKey(pollID, voter), req.OptionID, 30*24*time.Hour).Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not record vote"})
		return
	}
	if !first {
		c.JSON(http.StatusConflict, gin.H{"error": "you have already voted on this poll"})
		return
	}

	// Mongo is the durable record. The unique index is the real safety net.
	_, err = db.Votes.InsertOne(ctx, models.Vote{
		PollID:    poll.ID,
		OptionID:  req.OptionID,
		VoterID:   voter,
		CreatedAt: time.Now(),
	})
	if err != nil {
		// roll the Redis gate back so a transient failure doesn't lock the voter out
		db.RDB.Del(ctx, db.VoterKey(pollID, voter))
		if mongo.IsDuplicateKeyError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "you have already voted on this poll"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not record vote"})
		return
	}

	// bump the live counter and fan the new totals out to every open stream
	db.RDB.HIncrBy(ctx, db.CountsKey(pollID), req.OptionID, 1)
	counts, total := ReadCounts(poll)
	payload, _ := json.Marshal(models.ResultsPayload{Counts: counts, Total: total, Closed: false})
	db.RDB.Publish(ctx, db.Channel(pollID), payload)

	c.JSON(http.StatusOK, gin.H{"ok": true, "optionId": req.OptionID})
}

// ReadCounts returns live counts from Redis, rebuilding from Mongo if Redis is cold.
// This is what makes Redis a real cache layer rather than a single point of failure.
func ReadCounts(poll *models.Poll) (map[string]int64, int64) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pollID := poll.ID.Hex()
	counts := map[string]int64{}
	for _, o := range poll.Options {
		counts[o.ID] = 0
	}

	raw, err := db.RDB.HGetAll(ctx, db.CountsKey(pollID)).Result()
	if err != nil || len(raw) == 0 {
		return rebuildFromMongo(ctx, poll, counts)
	}

	var total int64
	for id := range counts {
		if v, ok := raw[id]; ok {
			var n int64
			_, _ = fmtSscan(v, &n)
			counts[id] = n
			total += n
		}
	}
	return counts, total
}

func rebuildFromMongo(ctx context.Context, poll *models.Poll, counts map[string]int64) (map[string]int64, int64) {
	cur, err := db.Votes.Find(ctx, bson.M{"pollId": poll.ID})
	if err != nil {
		return counts, 0
	}
	defer cur.Close(ctx)

	var votes []models.Vote
	if err := cur.All(ctx, &votes); err != nil {
		return counts, 0
	}

	var total int64
	pairs := make([]interface{}, 0, len(counts)*2)
	for _, vote := range votes {
		if _, ok := counts[vote.OptionID]; ok {
			counts[vote.OptionID]++
			total++
		}
	}
	for id, n := range counts {
		pairs = append(pairs, id, n)
	}
	db.RDB.HSet(ctx, db.CountsKey(poll.ID.Hex()), pairs...) // warm the cache back up
	return counts, total
}
