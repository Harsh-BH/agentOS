# AgentOS

AI Workflow & Skill Studio — a SaaS platform for building, managing, and running AI agent workflows.

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, React Flow, Zustand
- **Backend**: Go 1.22, Fiber v2, pgx/v5
- **Database**: Supabase (Postgres with RLS)
- **AI**: Anthropic Claude API with SSE streaming

## Getting started

```bash
cp .env.example backend/.env
cp .env.example frontend/.env.local
docker compose up
```

Or run individually:

```bash
cd backend && air          # Go with live reload on :8080
cd frontend && npm run dev # Next.js on :3000
```

## Project structure

```
agentOS/
├── backend/     # Go API server (Fiber + pgx)
├── frontend/    # Next.js App Router
├── .claude/     # Claude Code context files
└── docker-compose.yml
```
