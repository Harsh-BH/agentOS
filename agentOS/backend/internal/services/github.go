package services

import (
	"fmt"
	"strings"
)

// RepoInfo holds parsed owner/repo from a GitHub URL.
type RepoInfo struct {
	Owner string
	Repo  string
}

// ParseRepoURL extracts owner and repo from a GitHub URL.
// Accepts: https://github.com/owner/repo, github.com/owner/repo, owner/repo
func ParseRepoURL(rawURL string) (RepoInfo, error) {
	s := strings.TrimSpace(rawURL)
	s = strings.TrimSuffix(s, ".git")
	s = strings.TrimPrefix(s, "https://")
	s = strings.TrimPrefix(s, "http://")
	s = strings.TrimPrefix(s, "github.com/")
	s = strings.Trim(s, "/")

	parts := strings.SplitN(s, "/", 3)
	if len(parts) < 2 || parts[0] == "" || parts[1] == "" {
		return RepoInfo{}, fmt.Errorf("invalid GitHub repo URL: %s", rawURL)
	}
	return RepoInfo{Owner: parts[0], Repo: parts[1]}, nil
}
