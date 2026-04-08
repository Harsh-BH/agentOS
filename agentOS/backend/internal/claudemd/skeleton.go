package claudemd

import (
	"path/filepath"
	"regexp"
	"strings"
)

// ExtractSkeleton strips implementation bodies from source code,
// keeping only structural declarations: imports, class/struct/interface
// definitions, function/method signatures, type definitions, and
// leading comments/docstrings.
func ExtractSkeleton(content, path string) string {
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".py", ".pyi":
		return extractPython(content)
	case ".go":
		return extractGo(content)
	case ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs":
		return extractJSTS(content)
	case ".java", ".kt", ".kts", ".scala":
		return extractJavaLike(content)
	case ".rs":
		return extractRust(content)
	case ".rb":
		return extractRuby(content)
	case ".cs":
		return extractCSharp(content)
	case ".php":
		return extractPHP(content)
	case ".c", ".h", ".cpp", ".hpp", ".cc", ".cxx":
		return extractCpp(content)
	case ".swift":
		return extractSwift(content)
	case ".ex", ".exs":
		return extractElixir(content)
	default:
		return extractGeneric(content)
	}
}

// --- Language-specific extractors ---

var pyPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?m)^(from\s+\S+\s+import\s+.+|import\s+.+)$`),
	regexp.MustCompile(`(?m)^(class\s+\w+.*?:)`),
	regexp.MustCompile(`(?m)^(\s*def\s+\w+\s*\(.*?\).*?:)`),
	regexp.MustCompile(`(?m)^(\s*async\s+def\s+\w+\s*\(.*?\).*?:)`),
	regexp.MustCompile(`(?m)^(\s*@\w+.*?)$`), // decorators
}

func extractPython(content string) string {
	return extractWithPatterns(content, pyPatterns, "#", `"""`, `"""`)
}

var goPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?m)^(package\s+\w+)`),
	regexp.MustCompile(`(?m)^(import\s+.*)$`),
	regexp.MustCompile(`(?m)^(type\s+\w+\s+(?:struct|interface)\s*\{)`),
	regexp.MustCompile(`(?m)^(type\s+\w+\s+.+)$`),
	regexp.MustCompile(`(?m)^(func\s+(?:\(\w+\s+\*?\w+\)\s+)?\w+\s*\(.*?\).*?\{?)$`),
	regexp.MustCompile(`(?m)^(var\s+\w+\s+.+)$`),
	regexp.MustCompile(`(?m)^(const\s+.*)$`),
}

func extractGo(content string) string {
	return extractWithPatterns(content, goPatterns, "//", "/*", "*/")
}

var jstsPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?m)^(import\s+.+)$`),
	regexp.MustCompile(`(?m)^(export\s+(?:default\s+)?(?:class|interface|type|enum|function|const|let|var|abstract)\s+.+)`),
	regexp.MustCompile(`(?m)^((?:export\s+)?class\s+\w+.+\{?)`),
	regexp.MustCompile(`(?m)^((?:export\s+)?interface\s+\w+.+\{?)`),
	regexp.MustCompile(`(?m)^((?:export\s+)?type\s+\w+.+)`),
	regexp.MustCompile(`(?m)^((?:export\s+)?(?:async\s+)?function\s+\w+\s*(?:<.*?>)?\s*\(.*?\).*)`),
	regexp.MustCompile(`(?m)^(\s*(?:public|private|protected|static|async|readonly)\s+\w+.*)`),
	regexp.MustCompile(`(?m)^((?:export\s+)?const\s+\w+\s*[=:].*)$`),
}

func extractJSTS(content string) string {
	return extractWithPatterns(content, jstsPatterns, "//", "/*", "*/")
}

var javaPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?m)^(package\s+.+;)`),
	regexp.MustCompile(`(?m)^(import\s+.+;)`),
	regexp.MustCompile(`(?m)^(\s*(?:public|private|protected|abstract|final|static)*\s*(?:class|interface|enum|record|abstract\s+class)\s+\w+.*\{?)`),
	regexp.MustCompile(`(?m)^(\s*(?:public|private|protected|static|abstract|final|override|suspend)*\s*(?:fun\s+)?\w+\s*(?:<.*?>)?\s*\(.*?\).*)`),
	regexp.MustCompile(`(?m)^(\s*@\w+.*)$`),
}

func extractJavaLike(content string) string {
	return extractWithPatterns(content, javaPatterns, "//", "/*", "*/")
}

var rustPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?m)^(use\s+.+;)`),
	regexp.MustCompile(`(?m)^(mod\s+\w+;?)`),
	regexp.MustCompile(`(?m)^(pub\s+)?(?:struct|enum|trait|impl|type)\s+.+`),
	regexp.MustCompile(`(?m)^(\s*(?:pub\s+)?(?:async\s+)?fn\s+\w+.*)`),
	regexp.MustCompile(`(?m)^(#\[.*\])$`),
}

func extractRust(content string) string {
	return extractWithPatterns(content, rustPatterns, "//", "/*", "*/")
}

var rubyPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?m)^(require\s+.+)$`),
	regexp.MustCompile(`(?m)^(require_relative\s+.+)$`),
	regexp.MustCompile(`(?m)^(\s*(?:class|module)\s+\w+.*)$`),
	regexp.MustCompile(`(?m)^(\s*def\s+\w+.*)$`),
	regexp.MustCompile(`(?m)^(\s*attr_(?:accessor|reader|writer)\s+.+)$`),
}

func extractRuby(content string) string {
	return extractWithPatterns(content, rubyPatterns, "#", "=begin", "=end")
}

var csharpPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?m)^(using\s+.+;)`),
	regexp.MustCompile(`(?m)^(namespace\s+.+)`),
	regexp.MustCompile(`(?m)^(\s*(?:public|private|protected|internal|abstract|sealed|static|partial)*\s*class\s+\w+.+)`),
	regexp.MustCompile(`(?m)^(\s*(?:public|private|protected|internal|abstract|sealed|static|virtual|override|async)*\s*\w+\s+\w+\s*\(.*?\).*)`),
	regexp.MustCompile(`(?m)^(\s*\[.*\])$`),
}

func extractCSharp(content string) string {
	return extractWithPatterns(content, csharpPatterns, "//", "/*", "*/")
}

var phpPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?m)^(namespace\s+.+;)`),
	regexp.MustCompile(`(?m)^(use\s+.+;)`),
	regexp.MustCompile(`(?m)^(\s*(?:abstract\s+|final\s+)?class\s+\w+.+)`),
	regexp.MustCompile(`(?m)^(\s*(?:public|private|protected|static)\s+function\s+\w+.+)`),
	regexp.MustCompile(`(?m)^(\s*interface\s+\w+.+)`),
}

func extractPHP(content string) string {
	return extractWithPatterns(content, phpPatterns, "//", "/*", "*/")
}

var cppPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?m)^(#include\s+.+)$`),
	regexp.MustCompile(`(?m)^(#define\s+.+)$`),
	regexp.MustCompile(`(?m)^((?:class|struct|enum|union|namespace)\s+\w+.+)`),
	regexp.MustCompile(`(?m)^(\s*(?:virtual\s+|static\s+|inline\s+|explicit\s+)?[\w:*&<>]+\s+\w+\s*\(.*?\).*)`),
	regexp.MustCompile(`(?m)^(typedef\s+.+;)`),
	regexp.MustCompile(`(?m)^(using\s+.+;)`),
}

func extractCpp(content string) string {
	return extractWithPatterns(content, cppPatterns, "//", "/*", "*/")
}

var swiftPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?m)^(import\s+.+)$`),
	regexp.MustCompile(`(?m)^(\s*(?:public|private|internal|open|fileprivate)?\s*(?:class|struct|enum|protocol|extension|actor)\s+\w+.+)`),
	regexp.MustCompile(`(?m)^(\s*(?:public|private|internal|open|fileprivate)?\s*(?:static\s+)?(?:override\s+)?func\s+\w+.+)`),
	regexp.MustCompile(`(?m)^(\s*@\w+.*)$`),
}

func extractSwift(content string) string {
	return extractWithPatterns(content, swiftPatterns, "//", "/*", "*/")
}

var elixirPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?m)^(defmodule\s+\w+.+)`),
	regexp.MustCompile(`(?m)^(\s*(?:def|defp|defmacro|defguard)\s+\w+.+)`),
	regexp.MustCompile(`(?m)^(\s*use\s+.+)$`),
	regexp.MustCompile(`(?m)^(\s*import\s+.+)$`),
	regexp.MustCompile(`(?m)^(\s*alias\s+.+)$`),
	regexp.MustCompile(`(?m)^(\s*@\w+\s+.+)$`),
}

func extractElixir(content string) string {
	return extractWithPatterns(content, elixirPatterns, "#", "", "")
}

var genericPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?m)^((?:import|require|include|use)\s+.+)$`),
	regexp.MustCompile(`(?m)^(\s*(?:class|struct|interface|enum|module|type|trait)\s+\w+.+)`),
	regexp.MustCompile(`(?m)^(\s*(?:function|func|def|fn|sub|proc|method)\s+\w+.+)`),
	regexp.MustCompile(`(?m)^(\s*(?:export|public|private)\s+.+)`),
}

func extractGeneric(content string) string {
	return extractWithPatterns(content, genericPatterns, "//", "/*", "*/")
}

// extractWithPatterns is the core engine. It scans lines, keeping:
// - Lines matching any pattern
// - Comment blocks (line comments before a match, block comments)
// - Import blocks
func extractWithPatterns(content string, patterns []*regexp.Regexp, lineComment, blockStart, blockEnd string) string {
	lines := strings.Split(content, "\n")
	var out []string
	var pendingComments []string
	inBlockComment := false

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Track block comments
		if blockStart != "" && strings.Contains(trimmed, blockStart) {
			inBlockComment = true
		}
		if inBlockComment {
			pendingComments = append(pendingComments, line)
			if blockEnd != "" && strings.Contains(trimmed, blockEnd) {
				inBlockComment = false
			}
			continue
		}

		// Track line comments (accumulate them for the next match)
		if lineComment != "" && strings.HasPrefix(trimmed, lineComment) {
			pendingComments = append(pendingComments, line)
			continue
		}

		// Check if line matches any structural pattern
		matched := false
		for _, p := range patterns {
			if p.MatchString(line) {
				matched = true
				break
			}
		}

		if matched {
			// Flush pending comments before this declaration
			out = append(out, pendingComments...)
			out = append(out, line)
			pendingComments = nil
		} else {
			// Non-matching, non-comment line → discard pending comments
			pendingComments = nil
		}
	}

	return strings.Join(out, "\n")
}
