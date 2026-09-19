package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"pollwave/internal/auth"
)

// RequireAuth blocks the request unless a valid Bearer token is present.
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}
		claims, err := auth.Parse(strings.TrimPrefix(header, "Bearer "))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}
		c.Set("userID", claims.UserID)
		c.Set("userName", claims.Name)
		c.Next()
	}
}