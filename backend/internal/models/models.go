package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email        string             `bson:"email" json:"email"`
	Name         string             `bson:"name" json:"name"`
	PasswordHash string             `bson:"passwordHash" json:"-"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
}

type Option struct {
	ID   string `bson:"id" json:"id"`
	Text string `bson:"text" json:"text"`
}

type Poll struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Slug      string             `bson:"slug" json:"slug"`
	Question  string             `bson:"question" json:"question"`
	Options   []Option           `bson:"options" json:"options"`
	OwnerID   primitive.ObjectID `bson:"ownerId" json:"ownerId"`
	OwnerName string             `bson:"ownerName" json:"ownerName"`
	Closed    bool               `bson:"closed" json:"closed"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}

type Vote struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PollID    primitive.ObjectID `bson:"pollId" json:"pollId"`
	OptionID  string             `bson:"optionId" json:"optionId"`
	VoterID   string             `bson:"voterId" json:"voterId"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}

// ResultsPayload is what gets pushed over SSE.
type ResultsPayload struct {
	Counts map[string]int64 `json:"counts"`
	Total  int64            `json:"total"`
	Closed bool             `json:"closed"`
}
