package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	MongoURI      string
	MongoDB       string
	RedisURL      string
	JWTSecret     string
	AllowedOrigin string
}

func Load() *Config {
	_ = godotenv.Load() // fine if missing in production

	c := &Config{
		Port:          get("PORT", "8080"),
		MongoURI:      get("MONGO_URI", ""),
		MongoDB:       get("MONGO_DB", "pollwave"),
		RedisURL:      get("REDIS_URL", ""),
		JWTSecret:     get("JWT_SECRET", ""),
		AllowedOrigin: get("ALLOWED_ORIGIN", "http://localhost:5173"),
	}

	if c.MongoURI == "" || c.RedisURL == "" || c.JWTSecret == "" {
		log.Fatal("MONGO_URI, REDIS_URL and JWT_SECRET are required")
	}
	return c
}

func get(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
