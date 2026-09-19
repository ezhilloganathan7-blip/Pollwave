package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"pollwave/internal/db"
	"pollwave/internal/models"
)

// Stream is the live pipe. The browser opens it once with EventSource and
// receives a push every time anyone votes - no polling, no refresh.
func Stream(c *gin.Context) {
	poll, err := findBySlug(c.Param("slug"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "poll not found"})
		return
	}

	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no") // stops nginx-style proxies buffering us

	ctx := c.Request.Context()
	pollID := poll.ID.Hex()

	sub := db.RDB.Subscribe(ctx, db.Channel(pollID))
	defer sub.Close()
	msgs := sub.Channel()

	// send the current state right away so the page never starts blank
	counts, total := ReadCounts(poll)
	snapshot, _ := json.Marshal(models.ResultsPayload{Counts: counts, Total: total, Closed: poll.Closed})
	c.Writer.Write([]byte("event: results\ndata: " + string(snapshot) + "\n\n"))
	c.Writer.Flush()

	// heartbeat keeps the connection alive through idle-timeout proxies
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()

	c.Stream(func(w io.Writer) bool {
		select {
		case msg, ok := <-msgs:
			if !ok {
				return false
			}
			c.Writer.Write([]byte("event: results\ndata: " + msg.Payload + "\n\n"))
			c.Writer.Flush()
			return true
		case <-ticker.C:
			c.Writer.Write([]byte(": ping\n\n"))
			c.Writer.Flush()
			return true
		case <-ctx.Done():
			return false
		}
	})
}
