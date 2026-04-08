package claudemd

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
)

// Config controls the extraction pipeline.
type Config struct {
	TokenBudget  int
	TargetBranch string
	IncludeTests bool
}

func DefaultConfig() Config {
	budget := 80000
	if v := os.Getenv("TOKEN_BUDGET"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			budget = n
		}
	}
	return Config{
		TokenBudget:  budget,
		TargetBranch: os.Getenv("TARGET_BRANCH"),
		IncludeTests: os.Getenv("INCLUDE_TESTS") == "true",
	}
}

// skeletonFile holds a source file's extracted skeleton or full content.
type skeletonFile struct {
	Path     string
	Skeleton string
	Lines    int
	IsFull   bool // true when full source is included instead of skeleton
}

// RepoContext is the structured output of stages 1-5.
// It's serializable and saved to project.context for reuse.
type RepoContext struct {
	RepoURL      string   `json:"repo_url"`
	Owner        string   `json:"owner"`
	Repo         string   `json:"repo"`
	Branch       string   `json:"branch"`
	Description  string   `json:"description"`
	CommitSHA    string   `json:"commit_sha"`
	CommitMsg    string   `json:"commit_msg"`
	Stack        []string `json:"stack"`
	FilesScanned int      `json:"files_scanned"`
	FilesRanked  int      `json:"files_ranked"`
	TokensUsed   int      `json:"tokens_used"`
	// The assembled, token-budgeted prompt text ready for any Claude consumer
	Prompt string `json:"prompt"`
}

// Pipeline orchestrates repo context extraction and Claude generation.
type Pipeline struct {
	fetcher    *RepoFetcher
	apiKey     string
	httpClient *http.Client
}

func NewPipeline(apiKey string) *Pipeline {
	return &Pipeline{
		fetcher:    NewRepoFetcher(),
		apiKey:     apiKey,
		httpClient: &http.Client{},
	}
}

// ============================================================
// ExtractContext — Stages 1-5
// Fetches repo, filters, classifies, extracts skeletons,
// ranks by PageRank, and builds a token-budgeted prompt.
// Returns a RepoContext that can be saved and reused.
// ============================================================

func (p *Pipeline) ExtractContext(ctx context.Context, owner, repo string, cfg Config) (*RepoContext, error) {
	branch := cfg.TargetBranch

	// Stage 1: Metadata
	log.Printf("[context] fetching metadata for %s/%s", owner, repo)
	meta, err := p.fetcher.FetchMeta(ctx, owner, repo, branch)
	if err != nil {
		return nil, fmt.Errorf("stage1 meta: %w", err)
	}
	if branch == "" {
		branch = meta.DefaultBranch
	}

	// Stage 1: Tree
	log.Printf("[context] fetching tree for branch %s", branch)
	rawTree, err := p.fetcher.FetchTree(ctx, owner, repo, branch)
	if err != nil {
		return nil, fmt.Errorf("stage1 tree: %w", err)
	}

	// Stage 2: Filter
	gitignore := p.fetcher.FetchGitignore(ctx, owner, repo)
	filtered := FilterTree(rawTree, gitignore)
	log.Printf("[context] %d files after filtering (from %d raw)", len(filtered), len(rawTree))

	// Stage 3: Classify
	var tier1Entries, tier2Entries, tier3Entries []TreeEntry
	for _, e := range filtered {
		switch ClassifyFile(e.Path, cfg.IncludeTests) {
		case Tier1Full:
			tier1Entries = append(tier1Entries, e)
		case Tier2Skeleton:
			tier2Entries = append(tier2Entries, e)
		case Tier3Config:
			tier3Entries = append(tier3Entries, e)
		}
	}
	log.Printf("[context] tier1=%d tier2=%d tier3=%d", len(tier1Entries), len(tier2Entries), len(tier3Entries))

	stack := DetectStack(rawTree)

	// Stage 3: Fetch file contents
	tier1Files := p.fetchFiles(ctx, owner, repo, tier1Entries, 50000)
	tier2Files := p.fetchFiles(ctx, owner, repo, tier2Entries, 30000)
	tier3Files := p.fetchFiles(ctx, owner, repo, tier3Entries, 15000)

	// Stage 3: Extract skeletons (keep full source for small files)
	const smallFileThreshold = 100 // lines — files this small are included in full
	var skeletons []skeletonFile
	for _, f := range tier2Files {
		lines := strings.Count(f.Content, "\n") + 1
		if lines <= smallFileThreshold {
			// Small files: include full source, skeleton loses too much context
			skeletons = append(skeletons, skeletonFile{
				Path:     f.Path,
				Skeleton: f.Content,
				Lines:    lines,
				IsFull:   true,
			})
		} else {
			sk := ExtractSkeleton(f.Content, f.Path)
			if strings.TrimSpace(sk) != "" {
				skeletons = append(skeletons, skeletonFile{
					Path:     f.Path,
					Skeleton: sk,
					Lines:    lines,
				})
			}
		}
	}

	// Stage 4: Dependency graph + PageRank
	allPaths := make([]string, 0, len(tier2Files))
	for _, f := range tier2Files {
		allPaths = append(allPaths, f.Path)
	}
	ranked := BuildDependencyGraphAndRank(tier2Files, allPaths)
	NormalizeScores(ranked)

	scoreMap := make(map[string]float64)
	for _, r := range ranked {
		scoreMap[r.Path] = r.Score
	}
	sort.Slice(skeletons, func(i, j int) bool {
		return scoreMap[skeletons[i].Path] > scoreMap[skeletons[j].Path]
	})

	// Stage 5: Build token-budgeted prompt
	prompt := buildPrompt(meta, filtered, tier1Files, skeletons, tier2Files, tier3Files, scoreMap, stack, cfg.TokenBudget)
	tokensUsed := estimateTokens(prompt)
	log.Printf("[context] prompt built: ~%d tokens, %d skeletons ranked", tokensUsed, len(ranked))

	return &RepoContext{
		RepoURL:      fmt.Sprintf("https://github.com/%s/%s", owner, repo),
		Owner:        owner,
		Repo:         repo,
		Branch:       branch,
		Description:  meta.Description,
		CommitSHA:    meta.LastCommitSHA,
		CommitMsg:    meta.LastCommitMsg,
		Stack:        stack,
		FilesScanned: len(filtered),
		FilesRanked:  len(ranked),
		TokensUsed:   tokensUsed,
		Prompt:       prompt,
	}, nil
}

// ============================================================
// GenerateClaudeMD — Stage 6a
// Takes a RepoContext and generates a CLAUDE.md file.
// ============================================================

type ClaudeMDResult struct {
	ClaudeMD string `json:"claude_md"`
}

func (p *Pipeline) GenerateClaudeMD(ctx context.Context, repoCtx *RepoContext) (*ClaudeMDResult, error) {
	systemPrompt := `You generate CLAUDE.md files — the context file loaded into every Claude Code session. Every line competes permanently for Claude's attention budget. The guiding test for every line: "Would removing this cause Claude to make a mistake?" If no, cut it.

## HARD CONSTRAINTS

- Target 60-100 lines. Absolute maximum 200 lines. Shorter is better.
- Never include things Claude can infer by reading the code (language, framework versions, obvious patterns).
- Never include generic best practices ("write clean code", "handle errors"). Claude already knows these.
- Never include code formatting rules — those belong in linter configs, not CLAUDE.md.
- Never include things that should be enforced deterministically (hooks, settings.json), not requested.
- Every convention listed must be one Claude would get WRONG without being told.
- Every gotcha must be triggered by a real pattern in the code, not hypothetical.

## REQUIRED SECTIONS (in this exact order)

### 1. Project Identity (2-3 lines max)
One sharp sentence: what this is, what stack, what it does. No paragraphs. No business context.
Example: "SaaS document automation platform. TypeScript monorepo: backend (Express), frontend (React/Gatsby)."

### 2. Commands
Only commands Claude cannot infer from project structure. Exact strings, with comments for non-obvious ones. Skip obvious ones like "npm install" or "git status". Include: build, test, dev server, lint — but only the project-specific invocations.

### 3. Directory Structure
NOT a full file tree. Only key directories that aren't self-explanatory, annotated with what lives there and why. Focus on directories where Claude would look in the wrong place without guidance.

### 4. Conventions (non-default patterns ONLY)
The most over-written section. ONLY include patterns that differ from what Claude would do by default. Test each one: "If I deleted this line, would Claude do the wrong thing?" If Claude would naturally do it right, delete the line.

Examples of what belongs: "Use Zustand for state, never Redux", "All API responses use { success, data, error } shape", "Database queries always use pgx positional params ($1, $2), never ?"
Examples of what does NOT belong: "Use TypeScript" (it can see that), "Write tests" (generic), "Handle errors" (obvious)

### 5. Gotchas
Highest-signal section. Codebase-specific traps Claude cannot infer from reading the code. Non-obvious failure modes. Anti-patterns specific to this project. Things that would cause a real bug if Claude didn't know about them. Derive these from the actual code patterns you observe.

### 6. Reference Documents (progressive disclosure)
Point to detailed docs with "read when" triggers instead of inlining content:
- "@docs/api-architecture.md — Read when adding or modifying endpoints"
- "@docs/database-schema.md — Read when touching models or migrations"
Only include references for files that actually exist in the repo.

## WHAT TO CUT

If you find yourself writing any of these, delete them:
- Descriptions of what standard libraries do
- Instructions to "follow best practices"
- Architecture explanations that restate what the code structure already shows
- Version numbers Claude can read from package.json/go.mod
- Instructions about code formatting, indentation, naming conventions (use linters)
- Anything a senior engineer would already know about the stack

## OUTPUT

Output ONLY the CLAUDE.md content. No preamble, no explanation, no wrapping. Start with "# " and the project name.`

	text, err := p.callClaude(ctx, systemPrompt, "Generate a CLAUDE.md for this repository. Be ruthlessly concise — only what Claude would get wrong without being told:\n\n"+repoCtx.Prompt, 4096)
	if err != nil {
		return nil, fmt.Errorf("GenerateClaudeMD: %w", err)
	}
	return &ClaudeMDResult{ClaudeMD: text}, nil
}

// ============================================================
// GenerateSkillsWorkflows — Stage 6b
// Takes a RepoContext and generates structured skills + workflows.
// ============================================================

type SkillsWorkflowsResult struct {
	Summary   string              `json:"summary"`
	Skills    []GeneratedSkill    `json:"skills"`
	Workflows []GeneratedWorkflow `json:"workflows"`
}

type GeneratedSkill struct {
	Name        string          `json:"name"`
	Type        string          `json:"type"`
	Description string          `json:"description"`
	Config      json.RawMessage `json:"config"`
}

type GeneratedWorkflow struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Nodes       json.RawMessage `json:"nodes"`
	Edges       json.RawMessage `json:"edges"`
}

func (p *Pipeline) GenerateSkillsWorkflows(ctx context.Context, repoCtx *RepoContext) (*SkillsWorkflowsResult, error) {
	systemPrompt := `You are AgentOS, an AI workflow architect. You analyze codebases and generate reusable skills and workflows following rigorous design principles.

You receive a structured repository snapshot: file tree, manifests, and source code skeletons ranked by architectural centrality (PageRank).

## SKILL DESIGN

A skill is a context contract. Each defines: WHEN to activate (trigger), WHAT to produce (goal), and codebase-specific gotchas.

Trigger field: write as "When [specific situation], use this skill." — this is a routing condition, not a summary.

Degree of freedom: "low" for fragile ops (migrations, deploy), "medium" for standard dev, "high" for creative/exploratory.

Gotchas: 2-5 edge cases, anti-patterns, or non-obvious failures specific to THIS codebase. Highest-signal content.

References: 2-5 file paths from the repo loaded on demand when skill is invoked.

Stay under 2,000 tokens per skill. Only include what Claude doesn't already know.

## WORKFLOW DESIGN

Workflows are feedback loops: Research → Plan → Execute → Validate → Ship.

Every workflow MUST have a planNode before code-writing skillNodes, and a validateNode that loops back on failure.

Use subagentNode for steps that require reading many files (isolated context, returns summary only).

Max 7-8 nodes. Simple loops beat complex chains.

## NODE TYPES

- "ioNode": { "label": "...", "direction": "input"|"output" }
- "planNode": { "label": "...", "plan_prompt": "...", "requires_approval": true }
- "skillNode": { "skillName": "...", "skillType": "prompt|tool|agent" }
- "validateNode": { "label": "...", "validation_criteria": "...", "max_retries": 3 }
- "routerNode": { "label": "...", "conditions": [{"match": "...", "target_handle": "..."}] }
- "subagentNode": { "label": "...", "agent_goal": "...", "tools": [...], "summary_format": "..." }

## EDGES

Default: { "id": "e1", "source": "n1", "target": "n2" }
Pass: { "id": "e2", "source": "n3", "target": "n4", "sourceHandle": "pass", "data": {"condition": "pass"} }
Fail: { "id": "e3", "source": "n3", "target": "n2", "sourceHandle": "fail", "data": {"condition": "fail"} }

Layout: y starts at 0, +150 per row. x=0 main, x=300 branches.

## SKILL CONFIG SCHEMA

{
  "type": "<prompt|tool|agent>",
  "model": "claude-sonnet-4-20250514",
  "trigger": "When [situation], use this skill.",
  "system_prompt": "<calibrated to degree_of_freedom>",
  "goal": "<what this produces>",
  "tools": ["<relevant tools>"],
  "degree_of_freedom": "<low|medium|high>",
  "gotchas": ["<codebase-specific>"],
  "references": ["<file paths>"],
  "input_schema": {},
  "output_schema": {},
  "max_tokens": 2000
}

## RESPONSE

Valid JSON only:
{
  "summary": "<2-3 sentences>",
  "skills": [{ "name": "<snake_case>", "type": "<prompt|tool|agent>", "description": "<one line>", "config": {<full config>} }],
  "workflows": [{ "name": "<readable>", "description": "<one line>", "nodes": [...], "edges": [...] }]
}

Generate 4-8 skills and 1-3 workflows. Every workflow uses plan-validate pattern. Every skill has trigger, gotchas, references from actual repo files.`

	// Truncate prompt if needed to stay within rate/token limits.
	// System prompt ~3K tokens + user prompt should stay under model input limits.
	userPrompt := repoCtx.Prompt
	maxPromptTokens := 60000 // conservative limit
	if estimateTokens(userPrompt) > maxPromptTokens {
		// Truncate to budget, cutting from the end (tier 3 / lower-ranked files)
		targetChars := maxPromptTokens * 4
		userPrompt = userPrompt[:targetChars] + "\n\n[... truncated for token budget]\n"
		log.Printf("[generate] prompt truncated from ~%d to ~%d tokens", estimateTokens(repoCtx.Prompt), estimateTokens(userPrompt))
	}

	text, err := p.callClaude(ctx, systemPrompt, "Analyze this codebase and generate skills and workflows:\n\n"+userPrompt, 16384)
	if err != nil {
		return nil, fmt.Errorf("GenerateSkillsWorkflows: %w", err)
	}

	jsonStr := extractJSON(text)
	var result SkillsWorkflowsResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return nil, fmt.Errorf("GenerateSkillsWorkflows parse (raw: %s): %w", text[:minInt(200, len(text))], err)
	}
	return &result, nil
}

// ============================================================
// Shared helpers
// ============================================================

func (p *Pipeline) fetchFiles(ctx context.Context, owner, repo string, entries []TreeEntry, maxSize int) []FetchedFile {
	var files []FetchedFile
	for _, e := range entries {
		if e.Size > maxSize {
			continue
		}
		content, err := p.fetcher.FetchFileContent(ctx, owner, repo, e.Path)
		if err != nil {
			log.Printf("[context] warning: failed to fetch %s: %v", e.Path, err)
			continue
		}
		files = append(files, FetchedFile{Path: e.Path, Content: content, Size: e.Size})
	}
	return files
}

func buildPrompt(
	meta *RepoMeta,
	tree []TreeEntry,
	tier1 []FetchedFile,
	skeletons []skeletonFile,
	tier2Full []FetchedFile,
	tier3 []FetchedFile,
	scores map[string]float64,
	stack []string,
	budget int,
) string {
	var b strings.Builder

	// [1] Repo metadata
	b.WriteString("=== REPOSITORY METADATA ===\n")
	b.WriteString(fmt.Sprintf("Name: %s/%s\n", meta.Owner, meta.Repo))
	if meta.Description != "" {
		b.WriteString(fmt.Sprintf("Description: %s\n", meta.Description))
	}
	b.WriteString(fmt.Sprintf("Default branch: %s\n", meta.DefaultBranch))
	if meta.LastCommitSHA != "" {
		sha := meta.LastCommitSHA
		if len(sha) > 8 {
			sha = sha[:8]
		}
		b.WriteString(fmt.Sprintf("Last commit: %s — %s\n", sha, meta.LastCommitMsg))
	}
	if len(stack) > 0 {
		b.WriteString(fmt.Sprintf("Detected stack: %s\n", strings.Join(stack, ", ")))
	}
	b.WriteString("\n")

	// [2] Directory tree
	b.WriteString("=== DIRECTORY TREE ===\n")
	for _, e := range tree {
		b.WriteString(e.Path)
		b.WriteString("\n")
	}
	b.WriteString("\n")

	// [3] Tier 1 full content
	b.WriteString("=== TIER 1: FULL CONTENT (README, manifests, CI, design docs) ===\n\n")
	for _, f := range tier1 {
		content := strings.TrimSpace(f.Content)
		if content == "" {
			continue // skip empty files
		}
		b.WriteString(fmt.Sprintf("--- %s ---\n%s\n\n", f.Path, content))
	}

	currentTokens := estimateTokens(b.String())
	remaining := budget - currentTokens - 3000

	// [4] Ranked source code (full for small files, skeletons for large ones)
	b.WriteString("=== TIER 2: SOURCE CODE (ranked by PageRank) ===\n\n")
	included := 0
	for _, sk := range skeletons {
		label := "skeleton"
		if sk.IsFull {
			label = "full"
		}
		entry := fmt.Sprintf("--- %s (lines: %d, rank: %.0f, %s) ---\n%s\n\n", sk.Path, sk.Lines, scores[sk.Path], label, sk.Skeleton)
		cost := estimateTokens(entry)
		if remaining-cost < 0 {
			break
		}
		b.WriteString(entry)
		remaining -= cost
		included++
	}

	// Second pass: if budget is abundant (>50% remaining), upgrade skeletons to full source
	// by appending full content for files that were skeleton-only
	if remaining > budget/2 {
		for i, sk := range skeletons {
			if i >= included || sk.IsFull {
				continue
			}
			// Find the full source for this skeleton file
			for _, f := range tier2Full {
				if f.Path == sk.Path {
					extra := fmt.Sprintf("--- %s (FULL SOURCE — budget surplus) ---\n%s\n\n", f.Path, f.Content)
					cost := estimateTokens(extra)
					if remaining-cost < 0 {
						break
					}
					b.WriteString(extra)
					remaining -= cost
					break
				}
			}
		}
	}
	log.Printf("[context] included %d/%d source files within budget", included, len(skeletons))

	// [5] Tier 3 config files
	if remaining > 500 {
		b.WriteString("=== TIER 3: CONFIG & SCHEMA FILES ===\n\n")
		for _, f := range tier3 {
			content := strings.TrimSpace(f.Content)
			if content == "" {
				continue // skip empty files
			}
			entry := fmt.Sprintf("--- %s ---\n%s\n\n", f.Path, content)
			cost := estimateTokens(entry)
			if remaining-cost < 0 {
				break
			}
			b.WriteString(entry)
			remaining -= cost
		}
	}

	return b.String()
}

func estimateTokens(s string) int {
	return len(s) / 4
}

func (p *Pipeline) callClaude(ctx context.Context, systemPrompt, userMessage string, maxTokens int) (string, error) {
	if p.apiKey == "" {
		return "", fmt.Errorf("ANTHROPIC_API_KEY is not set")
	}

	reqBody := map[string]interface{}{
		"model":      "claude-sonnet-4-20250514",
		"max_tokens": maxTokens,
		"system":     systemPrompt,
		"messages": []map[string]string{
			{"role": "user", "content": userMessage},
		},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.anthropic.com/v1/messages", bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", p.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		log.Printf("[claude] API error %d: %s", resp.StatusCode, string(respBody[:minInt(1000, len(respBody))]))
		return "", fmt.Errorf("Claude API %d: %s", resp.StatusCode, string(respBody[:minInt(500, len(respBody))]))
	}

	var result struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", err
	}
	if len(result.Content) == 0 {
		return "", fmt.Errorf("empty response from Claude")
	}
	return result.Content[0].Text, nil
}

func extractJSON(text string) string {
	if start := strings.Index(text, "```json"); start != -1 {
		start += len("```json")
		if end := strings.Index(text[start:], "```"); end != -1 {
			return strings.TrimSpace(text[start : start+end])
		}
	}
	if start := strings.Index(text, "```"); start != -1 {
		start += len("```")
		if end := strings.Index(text[start:], "```"); end != -1 {
			return strings.TrimSpace(text[start : start+end])
		}
	}
	return strings.TrimSpace(text)
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}
