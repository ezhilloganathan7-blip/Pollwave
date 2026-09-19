package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"

	"pollwave/internal/auth"
	"pollwave/internal/db"
	"pollwave/internal/models"
)

type signupReq struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Signup(c *gin.Context) {
	var req signupReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "malformed body"})
		return
	}

	// --- server-side validation, never trust the client ---
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if len(req.Name) < 2 || len(req.Name) > 50 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name must be 2-50 characters"})
		return
	}
	if !strings.Contains(req.Email, "@") || len(req.Email) > 120 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "enter a valid email"})
		return
	}
	if len(req.Password) < 8 || len(req.Password) > 72 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password must be 8-72 characters"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create account"})
		return
	}

	user := models.User{
		Email:        req.Email,
		Name:         req.Name,
		PasswordHash: string(hash),
		CreatedAt:    time.Now(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	res, err := db.Users.InsertOne(ctx, user)
	if mongo.IsDuplicateKeyError(err) {
		c.JSON(http.StatusConflict, gin.H{"error": "an account with that email already exists"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create account"})
		return
	}

	id := res.InsertedID.(primitive.ObjectID).Hex()
	token, _ := auth.Generate(id, user.Name)
	c.JSON(http.StatusCreated, gin.H{"token": token, "user": gin.H{"id": id, "name": user.Name, "email": user.Email}})
}

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func Login(c *gin.Context) {
	var req loginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "malformed body"})
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user models.User
	err := db.Users.FindOne(ctx, bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		// same message either way, so we don't leak which emails exist
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	id := user.ID.Hex()
	token, _ := auth.Generate(id, user.Name)
	c.JSON(http.StatusOK, gin.H{"token": token, "user": gin.H{"id": id, "name": user.Name, "email": user.Email}})
}

func Me(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"id":   c.GetString("userID"),
		"name": c.GetString("userName"),
	})
}
