package claudemd

import (
	"math"
	"path/filepath"
	"regexp"
	"strings"
)


// RankedFile holds a file path and its PageRank score.
type RankedFile struct {
	Path  string
	Score float64
}

// BuildDependencyGraphAndRank parses import statements from fetched files,
// builds a directed graph, and runs PageRank to rank files by importance.
// For repos with too few files or no edges, falls back to heuristic scoring
// based on file size and path depth (deeper = more specific = higher value).
func BuildDependencyGraphAndRank(files []FetchedFile, allPaths []string) []RankedFile {
	pathIndex := buildPathIndex(allPaths)
	graph := make(map[string][]string) // file → files it imports
	edgeCount := 0
	for _, f := range files {
		imports := extractImports(f.Content, f.Path)
		for _, imp := range imports {
			target := resolveImport(imp, f.Path, pathIndex)
			if target != "" && target != f.Path {
				graph[f.Path] = append(graph[f.Path], target)
				edgeCount++
			}
		}
	}

	// If graph is too sparse (fewer than 3 edges or fewer than 5 files),
	// PageRank won't produce meaningful results — use heuristic scoring.
	if edgeCount < 3 || len(allPaths) < 5 {
		return heuristicRank(files)
	}

	scores := pagerank(allPaths, graph, 0.85, 30)

	ranked := make([]RankedFile, 0, len(scores))
	for path, score := range scores {
		ranked = append(ranked, RankedFile{Path: path, Score: score})
	}

	// Sort by score descending
	sortRanked(ranked)
	return ranked
}

// heuristicRank scores files by a combination of:
// - File size (larger files tend to have more logic)
// - Path depth (deeper files tend to be more specific/important)
// - Name priority (index/main/app files score higher)
func heuristicRank(files []FetchedFile) []RankedFile {
	ranked := make([]RankedFile, 0, len(files))
	for _, f := range files {
		score := 0.0
		// Base score from content size (log scale to avoid huge files dominating)
		if len(f.Content) > 0 {
			score = math.Log2(float64(len(f.Content)) + 1)
		}
		// Depth bonus: deeper files are usually more specific
		depth := float64(strings.Count(f.Path, "/"))
		score += depth * 0.5
		// Name priority bonus for entrypoints
		base := strings.ToLower(filepath.Base(f.Path))
		nameNoExt := strings.TrimSuffix(base, filepath.Ext(base))
		switch nameNoExt {
		case "main", "index", "app", "server", "mod", "lib":
			score += 3.0
		case "config", "setup", "init", "routes", "router":
			score += 2.0
		}
		ranked = append(ranked, RankedFile{Path: f.Path, Score: score})
	}
	sortRanked(ranked)
	return ranked
}

// --- Import extraction ---

var importPatterns = []*regexp.Regexp{
	// JS/TS: import ... from "path" / require("path")
	regexp.MustCompile(`(?:import|export)\s+.*?from\s+['"]([^'"]+)['"]`),
	regexp.MustCompile(`require\s*\(\s*['"]([^'"]+)['"]\s*\)`),
	// Python: from X import / import X
	regexp.MustCompile(`(?:from|import)\s+([\w.]+)`),
	// Go: "path/to/pkg"
	regexp.MustCompile(`"([\w./-]+)"`),
	// Rust: use crate::path / mod name
	regexp.MustCompile(`use\s+(?:crate::)?([\w:]+)`),
	// Java/Kotlin: import package.Class
	regexp.MustCompile(`import\s+([\w.]+)`),
	// Ruby: require "path" / require_relative "path"
	regexp.MustCompile(`require(?:_relative)?\s+['"]([^'"]+)['"]`),
	// C/C++: #include "path"
	regexp.MustCompile(`#include\s+"([^"]+)"`),
	// PHP: use Namespace\Class
	regexp.MustCompile(`use\s+([\w\\]+)`),
	// Elixir: alias/import/use Module
	regexp.MustCompile(`(?:alias|import|use)\s+([\w.]+)`),
}

func extractImports(content, path string) []string {
	var imports []string
	seen := map[string]bool{}
	for _, p := range importPatterns {
		matches := p.FindAllStringSubmatch(content, -1)
		for _, m := range matches {
			if len(m) > 1 && !seen[m[1]] {
				seen[m[1]] = true
				imports = append(imports, m[1])
			}
		}
	}
	return imports
}

// --- Import resolution ---

func buildPathIndex(paths []string) map[string]string {
	index := make(map[string]string)
	for _, p := range paths {
		// Index by full path
		index[p] = p
		// Index by basename without extension
		base := strings.TrimSuffix(filepath.Base(p), filepath.Ext(p))
		index[base] = p
		// Index by path without extension
		noExt := strings.TrimSuffix(p, filepath.Ext(p))
		index[noExt] = p
		// Index by relative-style paths (./dir/file → dir/file)
		index[strings.TrimPrefix(p, "./")] = p
	}
	return index
}

func resolveImport(imp, fromPath string, index map[string]string) string {
	// Direct match
	if target, ok := index[imp]; ok {
		return target
	}

	// Relative import
	if strings.HasPrefix(imp, "./") || strings.HasPrefix(imp, "../") {
		dir := filepath.Dir(fromPath)
		resolved := filepath.Join(dir, imp)
		resolved = filepath.Clean(resolved)
		if target, ok := index[resolved]; ok {
			return target
		}
		// Try with common extensions
		for _, ext := range []string{".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs"} {
			if target, ok := index[resolved+ext]; ok {
				return target
			}
		}
		// Try /index pattern
		for _, ext := range []string{".ts", ".tsx", ".js", ".jsx"} {
			if target, ok := index[resolved+"/index"+ext]; ok {
				return target
			}
		}
	}

	// Module path segments
	parts := strings.Split(imp, "/")
	last := parts[len(parts)-1]
	if target, ok := index[last]; ok {
		return target
	}

	// Python dot notation
	dotPath := strings.ReplaceAll(imp, ".", "/")
	if target, ok := index[dotPath]; ok {
		return target
	}
	if target, ok := index[dotPath+".py"]; ok {
		return target
	}

	// Rust :: notation
	colonPath := strings.ReplaceAll(imp, "::", "/")
	if target, ok := index[colonPath]; ok {
		return target
	}

	return ""
}

// --- PageRank (power iteration) ---

func pagerank(nodes []string, graph map[string][]string, damping float64, iterations int) map[string]float64 {
	n := len(nodes)
	if n == 0 {
		return nil
	}

	// Build reverse graph (who links TO this node)
	inbound := make(map[string][]string)
	outCount := make(map[string]int)
	for _, node := range nodes {
		if _, ok := inbound[node]; !ok {
			inbound[node] = nil
		}
	}
	for src, targets := range graph {
		outCount[src] = len(targets)
		for _, tgt := range targets {
			inbound[tgt] = append(inbound[tgt], src)
		}
	}

	// Initialize scores
	scores := make(map[string]float64, n)
	initial := 1.0 / float64(n)
	for _, node := range nodes {
		scores[node] = initial
	}

	// Power iteration
	base := (1.0 - damping) / float64(n)
	for iter := 0; iter < iterations; iter++ {
		newScores := make(map[string]float64, n)
		for _, node := range nodes {
			sum := 0.0
			for _, src := range inbound[node] {
				if outCount[src] > 0 {
					sum += scores[src] / float64(outCount[src])
				}
			}
			newScores[node] = base + damping*sum
		}
		scores = newScores
	}

	return scores
}

// sortRanked sorts by score descending using simple insertion sort (good enough for file counts).
func sortRanked(ranked []RankedFile) {
	for i := 1; i < len(ranked); i++ {
		key := ranked[i]
		j := i - 1
		for j >= 0 && ranked[j].Score < key.Score {
			ranked[j+1] = ranked[j]
			j--
		}
		ranked[j+1] = key
	}
}

// NormalizeScores normalizes PageRank scores to 0-100 scale.
func NormalizeScores(ranked []RankedFile) {
	if len(ranked) == 0 {
		return
	}
	maxScore := ranked[0].Score
	if maxScore == 0 {
		return
	}
	for i := range ranked {
		ranked[i].Score = math.Round(ranked[i].Score / maxScore * 100)
	}
}
