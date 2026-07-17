# AgentOS — AI Workflow & Skill Studio

SaaS platform for building and running AI agent workflows — Next.js + Go/Fiber + Supabase + Claude API

## Overview

AgentOS is a SaaS studio for designing, managing, and running AI agent workflows. Users organize work into projects, then either build workflows by hand on a visual React Flow canvas or import a GitHub repository and let Claude analyze the code to auto-generate reusable skills and workflows. A Go/Fiber backend handles authentication, persistence, GitHub import, and the Claude-powered analysis pipelines, while a Next.js frontend provides the canvas, dashboard, and AI panel. All data is stored in Supabase Postgres with row-level security.

> Note: the repository's source lives in a nested `agentOS/` directory (`agentOS/agentOS/…`). Run the commands below from that inner directory.

## Features

- **Project management** — create projects (blank or from a GitHub repo) with full CRUD; skills and workflows are scoped per project.
- **Visual workflow canvas** — build and edit workflows on a React Flow canvas with typed nodes: Skill, Subagent, Router, Plan, Loop, Validate, and IO. Workflows are versioned and persisted as JSON (nodes + edges).
- **GitHub repo import** — the backend fetches a repository via the GitHub REST API, sends the code to Claude, and saves the returned skills and workflows as database rows.
- **CLAUDE.md generator** — a six-stage pipeline (`internal/claudemd/`) that turns any GitHub repo into a high-quality `CLAUDE.md`: repo fetch, two-pass file filtering, tier-based classification, language-aware skeleton extraction, PageRank ranking over an import dependency graph, and a token-budgeted prompt to Claude.
- **Skill types** — skills are typed as `prompt`, `tool`, or `agent`, with flexible JSONB config.
- **Authentication** — Supabase Auth (email/password plus OAuth) on the frontend; the Go backend verifies the Supabase JWT in middleware and derives the user ID from the token.
- **AI panel** — an in-app chat panel in the workflow/project UI.
- **REST API** — Fiber HTTP API under `/api` with a health check, CORS, request logging, and graceful shutdown.
- **Row-level security** — every table enforces per-user isolation via Postgres RLS.

## Tech Stack

**Frontend** (`agentOS/frontend/package.json`)
- Next.js 16 (App Router), React 19, TypeScript 5
- Tailwind CSS v4
- React Flow (`reactflow` 11) for the workflow canvas
- Zustand 5 for state, `ky` 2 for HTTP
- `@supabase/ssr` and `@supabase/supabase-js` for auth and data
- `react-hook-form` 7 with `zod` 4 for forms and validation
- ESLint 9, Prettier

**Backend** (`agentOS/backend/go.mod`)
- Go (module targets `go 1.25`; Docker image builds on `golang:1.22-alpine`)
- Fiber v2 web framework
- `pgx/v5` connection pool (Postgres, no ORM)
- `golang-jwt/jwt/v5` for JWT verification
- `go-playground/validator/v10`, `google/uuid`, `joho/godotenv`

**Database & AI**
- Supabase Postgres with row-level security; JSONB for skill configs and workflow nodes/edges
- Anthropic Claude API (`claude-sonnet-4-20250514`) via direct HTTP calls to `/v1/messages`

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Go 1.22+ (for running the backend outside Docker)
- A Supabase project (URL, anon key, service role key)
- An Anthropic API key
- Docker and Docker Compose (optional, for the containerized setup)
- [`air`](https://github.com/air-verse/air) (optional, for Go live reload)

### Installation

```bash
git clone https://github.com/Harsh-BH/agentOS.git
cd agentOS/agentOS        # source lives in the nested directory

# Configure environment variables (fill in real values)
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

Set up the database by running the migration SQL in the Supabase SQL editor (or via `psql`):

```
backend/migrations/001_init.sql
backend/migrations/002_add_repo_url.sql
```

### Running

With Docker Compose (backend on `:8080`, frontend on `:3000`):

```bash
docker compose up
```

Or run each service individually:

```bash
# Backend (Go / Fiber)
cd backend
air                 # live reload, or:
go run ./cmd/server

# Frontend (Next.js)
cd frontend
npm install
npm run dev
```

Frontend scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.

## Project Structure

```
agentOS/                     # repository root wrapper
└── agentOS/                 # project (monorepo)
    ├── backend/             # Go API server (Fiber + pgx)
    │   ├── cmd/server/      # main entrypoint
    │   ├── internal/
    │   │   ├── config/      # environment loading
    │   │   ├── db/          # pgx connection pool
    │   │   ├── middleware/  # Supabase JWT auth
    │   │   ├── models/      # Project, Skill, Workflow types
    │   │   ├── handlers/    # HTTP handlers (projects, skills, workflows, import, ai)
    │   │   ├── services/    # business logic (project, skill, workflow, github, ai)
    │   │   ├── router/      # route registration
    │   │   └── claudemd/    # six-stage CLAUDE.md generator pipeline
    │   └── migrations/      # Supabase SQL migrations
    ├── frontend/            # Next.js App Router app
    │   └── src/
    │       ├── app/         # routes (landing, auth, dashboard, projects)
    │       ├── components/  # landing/, dashboard/, canvas/, ai-panel/
    │       ├── hooks/       # useProjects, useSkills, useWorkflows
    │       ├── lib/         # api client, Supabase clients
    │       ├── providers/   # AuthProvider
    │       ├── stores/      # Zustand workflow store
    │       └── types/       # shared TypeScript types
    ├── .agents/             # bundled agent skills (Supabase)
    ├── .claude/             # Claude Code context files
    └── docker-compose.yml
```
