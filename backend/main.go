package main

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"pollwave/internal/auth"
	"pollwave/internal/config"
	"pollwave/internal/db"
	"pollwave/internal/handlers"
	"pollwave/internal/middleware"
)

func main() {
	cfg := config.Load()

	auth.Init(cfg.JWTSecret)
	db.ConnectMongo(cfg.MongoURI, cfg.MongoDB)
	db.ConnectRedis(cfg.RedisURL)

	r := gin.Default()

	origins := strings.Split(cfg.AllowedOrigin, ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}
	r.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		api.POST("/auth/signup", handlers.Signup)
		api.POST("/auth/login", handlers.Login)

		// public: anyone with the link
		api.GET("/polls/:slug", handlers.GetPoll)
		api.POST("/polls/:slug/vote", handlers.Vote)
		api.GET("/polls/:slug/stream", handlers.Stream)

		// protected: real auth check before creating or managing a poll
		p := api.Group("")
		p.Use(middleware.RequireAuth())
		{
			p.GET("/auth/me", handlers.Me)
			p.POST("/polls", handlers.CreatePoll)
			p.GET("/polls", handlers.MyPolls)
			p.PATCH("/polls/:slug/close", handlers.ClosePoll)
		}
	}

	log.Printf("listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
