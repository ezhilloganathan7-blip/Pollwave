package db

import (
	"context"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

var RDB *redis.Client

func ConnectRedis(url string) {
	opt, err := redis.ParseURL(url)
	if err != nil {
		log.Fatalf("redis url: %v", err)
	}
	RDB = redis.NewClient(opt)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := RDB.Ping(ctx).Err(); err != nil {
		log.Fatalf("redis ping: %v", err)
	}
	log.Println("redis connected")
}

// Key helpers keep the naming scheme in one place.
func CountsKey(pollID string) string       { return "poll:" + pollID + ":counts" }
func VoterKey(pollID, voter string) string { return "poll:" + pollID + ":voter:" + voter }
func Channel(pollID string) string         { return "poll:" + pollID }
