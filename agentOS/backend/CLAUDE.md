# AgentOS Backend — Go API

## Architecture
```
cmd/server/main.go          → loads config, connects DB, wires services/handlers, starts Fiber
internal/config/config.go   → reads env vars via godotenv, fail-fast on missing
internal/db/postgres.go     → creates pgxpool, pings on init
internal/middleware/auth.go → extracts Bearer JWT, verifies HMAC, sets userID in Locals
internal/router/router.go  → registers all routes, applies auth middleware
internal/models/            → Project, Skill, Workflow structs + input types
internal/handlers/          → parse request → call service → return JSON
internal/services/          → business logic + DB queries + external API calls
migrations/                 → SQL files to run in Supabase SQL Editor
```

## Services

### ProjectService (project.go)
- CRUD with pgx queries, all filtered by user_id
- `scanProject()` helper to DRY column scanning
- `SetRepoURL()` for import flow

### SkillService (skill.go)
- CRUD scoped to user_id + project_id
- Supports partial updates via pointer fields in UpdateSkillInput

### WorkflowService (workflow.go)
- CRUD scoped to user_id + project_id
- Update bumps `version = version + 1` atomically

### GitHubService (github.go)
- `ParseRepoURL()` — accepts github.com/owner/repo, https URLs, owner/repo
- `FetchRepoFiles()` — fetches recursive tree via GitHub API, reads up to 80 files (30KB each max)
- Skips: node_modules, vendor, .git, binaries, lock files, images
- Prioritizes: README, package.json, go.mod, Dockerfile, etc.

### AIService (ai.go)
- `AnalyzeCode()` — sends repo files to Claude API, gets structured JSON back
- Uses claude-sonnet-4-20250514, max_tokens 8192
- Truncates input at 180KB to stay within token limits
- `extractJSON()` strips markdown fences from Claude response
- Returns `AnalysisResult` with skills + workflows ready to save

### ImportHandler (handlers/import.go)
- Orchestrates: validate project → parse URL → fetch files → Claude analysis → save skills + workflows + context
- Single endpoint: `POST /api/projects/:id/import`

## Error conventions
```go
fmt.Errorf("ServiceName.MethodName: %w", err)
```
Sentinel errors: `ErrNotImplemented`, `ErrNotFound` in services/ai.go

## Auth
- Supabase JWT verified via golang-jwt HMAC with SUPABASE_SERVICE_ROLE_KEY
- user_id from `sub` claim → `c.Locals("userID")`
- Never trust request body for identity

## Database
- pgxpool (not pgx.Connect) — pool created once in main
- Positional params: $1, $2 (not ?)
- JSONB fields: skills.config, workflows.nodes, workflows.edges
- RLS enabled on all tables — backend queries also filter by user_id as defense-in-depth

## Environment variables (backend/.env)
```
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL           # Supabase Postgres connection string
ANTHROPIC_API_KEY      # required for import/analyze flow
PORT (default 8080), ENV, FRONTEND_URL
```

## Running
```bash
air                        # live reload
go build ./cmd/server      # manual build
go build ./...             # check all packages compile
```

## Gotchas
- go.mod has `go 1.25.0` directive — works with Go 1.22+ (forward compat)
- GitHub API: 60 req/hr unauthenticated. Add token header if rate-limited.
- Claude response may be wrapped in ```json fences — extractJSON() handles this
- Config.Load() requires DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY or it exits

## Recent decisions
- GitHub import uses REST API (not git clone) for simplicity and no disk I/O
- Claude analysis is synchronous (not SSE) — import endpoint blocks until done
- Skills/workflows from analysis saved individually; failures logged but don't abort
