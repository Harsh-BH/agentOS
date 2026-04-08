package claudemd

import (
	"path/filepath"
	"strings"
)

// FilterTree applies two-pass filtering on the raw tree entries.
// Pass 1: hardcoded path-based exclusions.
// Pass 2: .gitignore pattern matching.
// Returns only blobs (files) that survive both passes.
func FilterTree(entries []TreeEntry, gitignoreContent string) []TreeEntry {
	gitignorePatterns := parseGitignore(gitignoreContent)

	var result []TreeEntry
	for _, e := range entries {
		if e.Type != "blob" {
			continue
		}
		if pass1Excluded(e.Path) {
			continue
		}
		if pass2Excluded(e.Path, gitignorePatterns) {
			continue
		}
		result = append(result, e)
	}
	return result
}

// --- Pass 1: Hardcoded exclusions ---

var excludedDirs = []string{
	"node_modules/", "vendor/", ".venv/", "venv/", "__pycache__/",
	".gradle/", "bower_components/", ".tox/", ".mypy_cache/",
	"dist/", "build/", "out/", ".next/", "target/", "bin/", "obj/",
	".git/", ".svn/", ".hg/",
	"coverage/", ".nyc_output/", ".pytest_cache/",
	".terraform/", ".serverless/",
}

var excludedExts = map[string]bool{
	// Lock files
	".lock": true,
	// Binary / compiled
	".exe": true, ".dll": true, ".so": true, ".dylib": true,
	".class": true, ".jar": true, ".war": true, ".pyc": true, ".pyo": true,
	".o": true, ".a": true, ".lib": true, ".wasm": true,
	// Images
	".png": true, ".jpg": true, ".jpeg": true, ".gif": true, ".bmp": true,
	".ico": true, ".webp": true, ".svg": true, ".tiff": true, ".tif": true,
	// Fonts
	".woff": true, ".woff2": true, ".ttf": true, ".eot": true, ".otf": true,
	// Video / audio
	".mp4": true, ".mp3": true, ".avi": true, ".mov": true, ".wav": true, ".flac": true,
	// Archives
	".zip": true, ".tar": true, ".gz": true, ".bz2": true, ".xz": true, ".7z": true, ".rar": true,
	// Source maps
	".map": true,
	// Minified
	".min.js": true, ".min.css": true,
	// Database
	".sqlite": true, ".db": true,
}

var excludedFiles = map[string]bool{
	"package-lock.json": true, "yarn.lock": true, "pnpm-lock.yaml": true,
	"pipfile.lock": true, "poetry.lock": true, "cargo.lock": true,
	"composer.lock": true, "gemfile.lock": true, "go.sum": true,
	".ds_store": true, "thumbs.db": true, ".eslintcache": true,
}

func pass1Excluded(path string) bool {
	lower := strings.ToLower(path)

	for _, dir := range excludedDirs {
		if strings.Contains(lower, dir) {
			return true
		}
	}

	ext := strings.ToLower(filepath.Ext(path))
	if excludedExts[ext] {
		return true
	}

	// Check .min.js / .min.css
	if strings.HasSuffix(lower, ".min.js") || strings.HasSuffix(lower, ".min.css") {
		return true
	}

	base := strings.ToLower(filepath.Base(path))
	if excludedFiles[base] {
		return true
	}

	return false
}

// --- Pass 2: Gitignore pattern matching ---

type gitignoreRule struct {
	pattern  string
	negated  bool
	dirOnly  bool
	anchored bool // contains / before the last char → match from root
}

func parseGitignore(content string) []gitignoreRule {
	if content == "" {
		return nil
	}
	var rules []gitignoreRule
	for _, line := range strings.Split(content, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		rule := gitignoreRule{}
		if strings.HasPrefix(line, "!") {
			rule.negated = true
			line = line[1:]
		}
		if strings.HasSuffix(line, "/") {
			rule.dirOnly = true
			line = strings.TrimSuffix(line, "/")
		}
		// If the pattern contains a slash (other than trailing), it's anchored
		if strings.Contains(line, "/") {
			rule.anchored = true
			line = strings.TrimPrefix(line, "/")
		}
		rule.pattern = line
		rules = append(rules, rule)
	}
	return rules
}

func pass2Excluded(path string, rules []gitignoreRule) bool {
	if len(rules) == 0 {
		return false
	}

	excluded := false
	for _, rule := range rules {
		matched := matchGitignore(path, rule)
		if matched {
			excluded = !rule.negated
		}
	}
	return excluded
}

func matchGitignore(path string, rule gitignoreRule) bool {
	pattern := rule.pattern

	if rule.anchored {
		// Match from root
		ok, _ := filepath.Match(pattern, path)
		if ok {
			return true
		}
		// Also try prefix match for directories
		if strings.HasPrefix(path, pattern+"/") {
			return true
		}
		return false
	}

	// Unanchored: match basename or any path segment
	base := filepath.Base(path)
	if ok, _ := filepath.Match(pattern, base); ok {
		return true
	}

	// Try matching against each segment of the path
	parts := strings.Split(path, "/")
	for i := range parts {
		segment := strings.Join(parts[i:], "/")
		if ok, _ := filepath.Match(pattern, segment); ok {
			return true
		}
	}

	// Try as glob against full path
	if ok, _ := filepath.Match(pattern, path); ok {
		return true
	}

	return false
}
