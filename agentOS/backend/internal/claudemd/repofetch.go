package claudemd

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

// RepoMeta holds top-level repository metadata.
type RepoMeta struct {
	Owner         string `json:"owner"`
	Repo          string `json:"repo"`
	DefaultBranch string `json:"default_branch"`
	Description   string `json:"description"`
	LastCommitSHA string `json:"last_commit_sha"`
	LastCommitMsg string `json:"last_commit_msg"`
}

// TreeEntry is a single entry from the Git tree API.
type TreeEntry struct {
	Path string `json:"path"`
	Type string `json:"type"` // "blob" or "tree"
	Size int    `json:"size"`
	SHA  string `json:"sha"`
}

// FetchedFile holds the path and decoded content of a fetched file.
type FetchedFile struct {
	Path    string
	Content string
	Size    int
}

type repoResponse struct {
	DefaultBranch string `json:"default_branch"`
	Description   string `json:"description"`
}

type commitResponse struct {
	SHA    string `json:"sha"`
	Commit struct {
		Message string `json:"message"`
	} `json:"commit"`
}

type treeAPIResponse struct {
	Tree      []TreeEntry `json:"tree"`
	Truncated bool        `json:"truncated"`
}

type contentAPIResponse struct {
	Content  string `json:"content"`
	Encoding string `json:"encoding"`
	Size     int    `json:"size"`
}

// RepoFetcher handles all GitHub API interactions.
type RepoFetcher struct {
	client *http.Client
	token  string
}

func NewRepoFetcher() *RepoFetcher {
	return &RepoFetcher{
		client: &http.Client{},
		token:  os.Getenv("GITHUB_TOKEN"),
	}
}

// FetchMeta gets repo metadata and latest commit info.
func (r *RepoFetcher) FetchMeta(ctx context.Context, owner, repo, branch string) (*RepoMeta, error) {
	meta := &RepoMeta{Owner: owner, Repo: repo}

	// Get repo info (default branch, description)
	body, err := r.apiGet(ctx, fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repo))
	if err != nil {
		return nil, fmt.Errorf("FetchMeta repo: %w", err)
	}
	var rr repoResponse
	if err := json.Unmarshal(body, &rr); err != nil {
		return nil, fmt.Errorf("FetchMeta parse: %w", err)
	}
	meta.DefaultBranch = rr.DefaultBranch
	meta.Description = rr.Description

	if branch == "" {
		branch = meta.DefaultBranch
	}

	// Get latest commit
	commitBody, err := r.apiGet(ctx, fmt.Sprintf("https://api.github.com/repos/%s/%s/commits/%s", owner, repo, branch))
	if err == nil {
		var cr commitResponse
		if json.Unmarshal(commitBody, &cr) == nil {
			meta.LastCommitSHA = cr.SHA
			meta.LastCommitMsg = firstLine(cr.Commit.Message)
		}
	}

	return meta, nil
}

// FetchTree returns the full recursive file tree for a branch.
func (r *RepoFetcher) FetchTree(ctx context.Context, owner, repo, branch string) ([]TreeEntry, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/git/trees/%s?recursive=1", owner, repo, branch)
	body, err := r.apiGet(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("FetchTree: %w", err)
	}
	var tr treeAPIResponse
	if err := json.Unmarshal(body, &tr); err != nil {
		return nil, fmt.Errorf("FetchTree parse: %w", err)
	}
	return tr.Tree, nil
}

// FetchFileContent retrieves the decoded content of a single file.
func (r *RepoFetcher) FetchFileContent(ctx context.Context, owner, repo, path string) (string, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s", owner, repo, path)
	body, err := r.apiGet(ctx, url)
	if err != nil {
		return "", err
	}
	var cr contentAPIResponse
	if err := json.Unmarshal(body, &cr); err != nil {
		return "", err
	}
	if cr.Encoding == "base64" {
		decoded, err := base64.StdEncoding.DecodeString(strings.ReplaceAll(cr.Content, "\n", ""))
		if err != nil {
			return "", err
		}
		return string(decoded), nil
	}
	return cr.Content, nil
}

// FetchGitignore fetches .gitignore content if it exists. Returns empty string if not found.
func (r *RepoFetcher) FetchGitignore(ctx context.Context, owner, repo string) string {
	content, err := r.FetchFileContent(ctx, owner, repo, ".gitignore")
	if err != nil {
		return ""
	}
	return content
}

func (r *RepoFetcher) apiGet(ctx context.Context, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "AgentOS-ClaudeMD/1.0")
	if r.token != "" {
		req.Header.Set("Authorization", "Bearer "+r.token)
	}

	resp, err := r.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 403 || resp.StatusCode == 429 {
		return nil, fmt.Errorf("GitHub API rate limited (status %d)", resp.StatusCode)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned %d for %s", resp.StatusCode, url)
	}
	return io.ReadAll(resp.Body)
}

func firstLine(s string) string {
	if i := strings.IndexByte(s, '\n'); i != -1 {
		return s[:i]
	}
	return s
}
