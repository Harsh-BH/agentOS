# AgentOS — Claude Code context

## Project overview
AI Workflow & Skill Studio SaaS. Users import GitHub repos, Claude
analyzes the code, and auto-generates reusable skills (prompt/tool/agent)
and visual workflows. Users can also build workflows manually on a
React Flow canvas and manage everything per-project.

## Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, React Flow 11, Zustand 5, ky 2
- **Backend**: Go 1.22+, Fiber v2, pgx/v5 pool, golang-jwt
- **Database**: Supabase Postgres, RLS on all tables, JSONB for configs/nodes/edges
- **Auth**: Supabase Auth (email/password + GitHub/Google OAuth), JWT verified in Go middleware
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514), direct HTTP calls
- **Deploy**: Vercel (frontend), Railway (backend)

## Core flow
1. User signs up via Supabase Auth → redirected to `/dashboard`
2. Creates a project (blank or imports a GitHub repo URL)
3. On import: backend fetches repo via GitHub REST API → sends code to Claude → saves generated skills + workflows
4. User views/edits skills and workflows in the project detail page
5. Workflow canvas (React Flow) for visual editing

## Key architecture decisions
- Workflows stored as React Flow JSON (nodes + edges) in Postgres JSONB
- Skills follow AFlow operator schema: type, model, system_prompt, tools, goal
- GitHub import fetches up to 80 source files, skips binaries/locks/vendor
- Claude analysis returns structured JSON → parsed and saved as real DB rows
- Auth: Supabase JWT verified in Go middleware; user_id from `sub` claim
- DB: pgx pool directly (no ORM), RLS enforces user isolation
- All queries filter by user_id — never trust request body for identity

## API endpoints (all under /api, auth required except /health)
```
GET    /health
GET    /api/projects              # list user's projects
POST   /api/projects              # create project
GET    /api/projects/:id          # get project
PATCH  /api/projects/:id          # update project
DELETE /api/projects/:id          # delete project (cascades)
POST   /api/projects/:id/import              # import GitHub repo + Claude analysis
POST   /api/projects/:id/generate-claude-md # generate CLAUDE.md via 6-stage pipeline
GET    /api/projects/:id/skills   # list skills
POST   /api/projects/:id/skills   # create skill
PATCH  /api/skills/:id            # update skill
DELETE /api/skills/:id            # delete skill
GET    /api/projects/:id/workflows # list workflows
POST   /api/projects/:id/workflows # create workflow
GET    /api/workflows/:id         # get workflow
PATCH  /api/workflows/:id         # update workflow (bumps version)
POST   /api/ai/generate           # (stub) AI generation
POST   /api/ai/suggest            # (stub) AI suggestions
POST   /api/ai/skill              # (stub) AI skill generation
```

## Running locally
```bash
# 1. Set up Supabase: create project, run migrations/001_init.sql + 002_add_repo_url.sql
# 2. Copy env vars:
cp .env.example backend/.env       # fill in real values
cp .env.example frontend/.env.local # fill in NEXT_PUBLIC_ values

# 3. Start:
cd backend && air          # Go on :8080
cd frontend && npm run dev # Next.js on :3000
```

## Monorepo layout
```
agentOS/
├── backend/
│   ├── cmd/server/main.go           # entrypoint
│   ├── internal/config/             # env loading
│   ├── internal/db/                 # pgxpool
│   ├── internal/middleware/auth.go  # JWT verification
│   ├── internal/models/             # Project, Skill, Workflow + input types
│   ├── internal/handlers/           # HTTP handlers (projects, skills, workflows, import, ai)
│   ├── internal/services/           # business logic (project, skill, workflow, github, ai)
│   ├── internal/router/             # route registration
│   ├── migrations/                  # SQL files for Supabase
│   └── Dockerfile
├── frontend/
│   ├── src/app/                     # pages (landing, auth, dashboard, projects)
│   ├── src/components/              # landing/, dashboard/, canvas/, ai-panel/
│   ├── src/hooks/                   # useProjects, useSkills, useWorkflows
│   ├── src/lib/                     # api.ts, supabase.ts, supabase-server.ts
│   ├── src/providers/               # AuthProvider
│   ├── src/stores/                  # workflowStore (Zustand)
│   ├── src/types/                   # all TypeScript interfaces
│   ├── middleware.ts                # Next.js middleware (auth redirect)
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Conventions
- **Go**: handlers parse → services query → models define. Errors: `fmt.Errorf("Svc.Method: %w", err)`
- **TS**: types from `src/types/`, API via `src/lib/api.ts`, no `any`, Tailwind only
- **DB**: pgx positional params ($1, $2), RLS on all tables, JSONB for flexible fields
- **UI**: sharp corners (no border-radius), border-[#e2e2e2] dividers, #9d66ff purple accent

## CLAUDE.md Generator Pipeline (internal/claudemd/)
Six-stage pipeline that generates high-quality CLAUDE.md from any GitHub repo:
1. **Repo Fetch** — GitHub REST API for tree + file contents, supports GITHUB_TOKEN for private repos
2. **Two-Pass Filter** — hardcoded exclusions (node_modules, binaries, locks) + .gitignore parsing
3. **File Classification** — Tier 1 (full: README, manifests, CI), Tier 2 (skeleton: source code), Tier 3 (full: configs)
4. **Skeleton Extraction** — regex-based AST skeleton for 15+ languages (keeps signatures, strips bodies)
5. **PageRank Ranking** — builds import dependency graph, power iteration PageRank, ranks files by centrality
6. **Token-Budgeted Prompt** — assembles payload within 80K token budget, sends to Claude

## Gotchas
- ky v2: `prefix` not `prefixUrl`; hooks receive `{ request }` not bare Request
- `@supabase/ssr` createBrowserClient throws at build time with empty env → guarded with placeholder
- React Flow `Node.type` is `string | undefined` — FlowNode.type must be optional
- GitHub API rate limits: 60 req/hr unauthenticated. For heavy use, add a token.
- Claude API: response may wrap JSON in markdown fences → `extractJSON()` strips them
