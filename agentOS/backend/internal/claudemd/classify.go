package claudemd

import (
	"path/filepath"
	"strings"
)

// FileTier determines how a file's content should be processed.
type FileTier int

const (
	Tier1Full     FileTier = 1 // Full content (README, manifests, CI, Dockerfiles)
	Tier2Skeleton FileTier = 2 // Source code → skeleton extraction
	Tier3Config   FileTier = 3 // Small config/schema files → full content
)

// ClassifyFile determines which tier a filtered file belongs to.
func ClassifyFile(path string, includeTests bool) FileTier {
	lower := strings.ToLower(path)
	base := strings.ToLower(filepath.Base(path))
	ext := strings.ToLower(filepath.Ext(path))

	// Skip test files if not included
	if !includeTests && isTestFile(lower) {
		return Tier2Skeleton // still extract skeleton, just lower priority later
	}

	// Tier 1: Always full content
	if isTier1(lower, base) {
		return Tier1Full
	}

	// Tier 2: Source code → skeleton
	if isSourceCode(ext) {
		return Tier2Skeleton
	}

	// Tier 3: Config/schema/data files → full content
	return Tier3Config
}

func isTier1(lower, base string) bool {
	// README
	if strings.HasPrefix(base, "readme") {
		return true
	}

	// Root-level manifests
	tier1Names := map[string]bool{
		"package.json": true, "tsconfig.json": true,
		"pyproject.toml": true, "setup.py": true, "setup.cfg": true,
		"requirements.txt": true, "pipfile": true,
		"cargo.toml": true, "go.mod": true,
		"pom.xml": true, "build.gradle": true, "build.gradle.kts": true,
		"gemfile": true, "mix.exs": true,
		"cmakelists.txt": true, "makefile": true,
		".env.example": true, ".env.sample": true,
		"docker-compose.yml": true, "docker-compose.yaml": true,
		"dockerfile": true,
		"claude.md": true,
	}
	if tier1Names[base] {
		return true
	}

	// CI/CD
	if strings.Contains(lower, ".github/workflows/") {
		return true
	}
	if strings.Contains(lower, ".gitlab-ci") {
		return true
	}

	// Design docs and agent definitions (.md files in known doc locations)
	if strings.HasSuffix(lower, ".md") {
		// Root-level markdown files (architecture docs, plans, specs)
		if !strings.Contains(lower, "/") {
			return true
		}
		// Agent/prompt definitions
		if strings.Contains(lower, ".github/agents/") ||
			strings.Contains(lower, ".github/prompts/") ||
			strings.Contains(lower, ".github/instructions/") {
			return true
		}
		// Common doc directories
		dir := filepath.Dir(lower)
		docDirs := []string{"docs", "doc", "design", "specs", "architecture", "adr"}
		for _, d := range docDirs {
			if dir == d || strings.HasPrefix(dir, d+"/") {
				return true
			}
		}
	}

	return false
}

var sourceExts = map[string]bool{
	// JavaScript / TypeScript
	".js": true, ".jsx": true, ".ts": true, ".tsx": true, ".mjs": true, ".cjs": true,
	// Python
	".py": true, ".pyi": true,
	// Go
	".go": true,
	// Rust
	".rs": true,
	// Java / Kotlin
	".java": true, ".kt": true, ".kts": true, ".scala": true,
	// C / C++
	".c": true, ".h": true, ".cpp": true, ".hpp": true, ".cc": true, ".hh": true, ".cxx": true,
	// C#
	".cs": true,
	// Ruby
	".rb": true,
	// PHP
	".php": true,
	// Swift
	".swift": true,
	// Elixir / Erlang
	".ex": true, ".exs": true, ".erl": true,
	// Dart
	".dart": true,
	// Lua
	".lua": true,
	// Haskell
	".hs": true,
	// Shell
	".sh": true, ".bash": true, ".zsh": true,
	// R
	".r": true,
}

func isSourceCode(ext string) bool {
	return sourceExts[ext]
}

func isTestFile(path string) bool {
	lower := strings.ToLower(path)
	if strings.Contains(lower, "_test.") || strings.Contains(lower, ".test.") {
		return true
	}
	if strings.Contains(lower, "_spec.") || strings.Contains(lower, ".spec.") {
		return true
	}
	if strings.Contains(lower, "/test/") || strings.Contains(lower, "/tests/") {
		return true
	}
	if strings.Contains(lower, "/__tests__/") {
		return true
	}
	return false
}

// DetectStack infers the tech stack from manifest files present in the tree.
// Also detects monorepo sub-projects and returns them as annotations.
func DetectStack(entries []TreeEntry) []string {
	var stack []string
	has := map[string]bool{}
	var subprojects []string

	for _, e := range entries {
		base := strings.ToLower(filepath.Base(e.Path))
		dir := filepath.Dir(e.Path)

		switch {
		case base == "package.json":
			has["Node.js"] = true
			if dir != "." {
				subprojects = append(subprojects, dir+" (Node.js)")
			}
		case base == "tsconfig.json":
			has["TypeScript"] = true
		case base == "go.mod":
			has["Go"] = true
			if dir != "." {
				subprojects = append(subprojects, dir+" (Go)")
			}
		case base == "cargo.toml":
			has["Rust"] = true
			if dir != "." {
				subprojects = append(subprojects, dir+" (Rust)")
			}
		case base == "pyproject.toml" || base == "requirements.txt" || base == "setup.py" || base == "pipfile":
			has["Python"] = true
			if dir != "." {
				subprojects = append(subprojects, dir+" (Python)")
			}
		case base == "gemfile":
			has["Ruby"] = true
		case base == "pom.xml" || base == "build.gradle" || base == "build.gradle.kts":
			has["Java/Kotlin"] = true
		case base == "mix.exs":
			has["Elixir"] = true
		case base == "pubspec.yaml":
			has["Dart/Flutter"] = true
		case strings.HasSuffix(base, ".csproj") || strings.HasSuffix(base, ".sln"):
			has["C#/.NET"] = true
		case base == "dockerfile" || base == "docker-compose.yml" || base == "docker-compose.yaml":
			has["Docker"] = true
		}

		// Framework detection from common paths
		path := strings.ToLower(e.Path)
		if strings.Contains(path, "next.config") {
			has["Next.js"] = true
		}
		if strings.Contains(path, "nuxt.config") {
			has["Nuxt.js"] = true
		}
		if strings.Contains(path, "angular.json") {
			has["Angular"] = true
		}
		if strings.Contains(path, "vite.config") {
			has["Vite"] = true
		}
	}

	for k := range has {
		stack = append(stack, k)
	}

	// Annotate monorepo structure
	if len(subprojects) > 1 {
		stack = append(stack, "Monorepo")
		for _, sp := range subprojects {
			stack = append(stack, "  sub: "+sp)
		}
	}

	return stack
}
