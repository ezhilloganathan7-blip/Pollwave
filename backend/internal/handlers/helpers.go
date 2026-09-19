package handlers

import "fmt"

// small wrapper so vote.go reads cleanly
func fmtSscan(s string, out *int64) (int, error) {
	return fmt.Sscan(s, out)
}
