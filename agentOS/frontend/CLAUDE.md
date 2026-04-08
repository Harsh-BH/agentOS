# AgentOS Frontend — Next.js

## Core rules
- **API calls**: always through `src/lib/api.ts` (ky v2 wrapper) — never raw fetch
- **Types**: always import from `src/types/index.ts` — never declare inline
- **Canvas state**: lives in `src/stores/workflowStore.ts` (Zustand)
- **Styling**: Tailwind CSS v4 only — no CSS modules, no styled-components
- **Type safety**: no `any` — use `unknown` and narrow
- **UI aesthetic**: sharp corners, border-[#e2e2e2] dividers, #9d66ff purple accent, grid patterns

## Architecture
```
src/
├── app/
│   ├── page.tsx                        # landing page (composites from components/landing/)
│   ├── (auth)/login/page.tsx           # email/password + OAuth login
│   ├── (auth)/signup/page.tsx          # registration + email confirmation
│   ├── auth/callback/route.ts          # OAuth redirect handler (server route)
│   ├── dashboard/
│   │   ├── layout.tsx                  # wraps all dashboard pages in DashboardShell (sidebar)
│   │   ├── page.tsx                    # projects list + create/import modal
│   │   ├── skills/page.tsx             # cross-project skills view
│   │   └── settings/page.tsx           # account settings
│   └── projects/[id]/
│       ├── page.tsx                    # project detail (skills + workflows + import)
│       ├── skills/page.tsx             # project skills (stub)
│       └── workflows/[workflowId]/page.tsx  # workflow editor (stub)
├── components/
│   ├── landing/                        # 11 sections: Header, Hero, ClickClickDone, etc.
│   ├── dashboard/Sidebar.tsx           # sidebar nav (Projects, Skills, Activity, Settings)
│   ├── dashboard/DashboardShell.tsx    # sidebar + main content layout
│   ├── canvas/WorkflowCanvas.tsx       # React Flow wrapper
│   ├── canvas/nodes/SkillNode.tsx      # custom skill node
│   ├── canvas/nodes/IONode.tsx         # custom IO node
│   └── ai-panel/ChatPanel.tsx          # AI chat sidebar
├── hooks/
│   ├── useProjects.ts                  # CRUD hooks for projects (GET/POST/PATCH/DELETE)
│   ├── useSkills.ts                    # CRUD hooks for skills
│   └── useWorkflows.ts                 # CRUD hooks for workflows
├── lib/
│   ├── api.ts                          # ky v2 instance, auth header injection, typed helpers
│   ├── supabase.ts                     # browser client (@supabase/ssr)
│   ├── supabase-server.ts             # server component client (cookie-based)
│   └── supabase-middleware.ts         # middleware client (token refresh + redirects)
├── providers/AuthProvider.tsx          # React context: user, session, loading, signOut
├── stores/workflowStore.ts            # Zustand: nodes, edges, loadWorkflow, saveWorkflow
└── types/index.ts                     # Project, Skill, Workflow, FlowNode, FlowEdge, ApiError
middleware.ts                           # Next.js middleware (auth protection)
```

## Auth flow
1. `middleware.ts` runs on every request via `supabase-middleware.ts`
2. Unauthenticated users redirected to `/login` (except `/`, `/login`, `/signup`, `/auth/callback`)
3. Authenticated users on `/login` or `/signup` redirected to `/dashboard`
4. OAuth callback at `/auth/callback` exchanges code for session
5. `AuthProvider` wraps the app — provides `useAuth()` hook with user/session/signOut

## Key data flow
- Dashboard loads projects via `useProjects()` → `GET /api/projects`
- Create project: `POST /api/projects` with name + description
- Import from GitHub: `POST /api/projects/:id/import` with repo_url → backend fetches + analyzes → returns created skills/workflows
- Project detail uses `useSkills(projectId)` and `useWorkflows(projectId)` hooks
- All hooks use `get/post/patch/del` from `api.ts` which auto-attaches Supabase session token

## Design system
- Colors: #0d0d0d (primary), #4d4d4d (secondary text), #999 (muted), #e2e2e2 (borders)
- Purple accent: #9d66ff (primary), #7b3aed (dark), #c084fc (light), #f0e6ff (bg), #e6daff (bg alt)
- Blue accent: #38bdf8, #0ea5e9, #c5ebff (used for workflows/stats)
- Typography: tracking-tight headings, tracking-[0.16px] body, uppercase tracking-[0.5px] labels
- No border-radius on primary UI — everything is sharp/square
- Grid backgrounds: `repeating-linear-gradient` purple grid pattern on auth pages + empty states

## Dependencies
- next 16.2.2, react 19, reactflow 11, zustand 5, ky 2
- @supabase/supabase-js 2, @supabase/ssr
- react-hook-form, zod, @hookform/resolvers
- tailwindcss v4, prettier + prettier-plugin-tailwindcss

## Gotchas
- ky v2: `prefix` not `prefixUrl`; hooks receive `{ request }` object
- `@supabase/ssr` createBrowserClient crashes at build with empty env → guarded with placeholder
- React Flow `Node.type` is `string | undefined` — FlowNode.type must be optional
- Next.js 16 Turbopack: workspace root inferred from lockfile; causes warning (harmless)
- Async `never` return must be typed `Promise<never>` in strict mode
- `del` from api.ts wraps `ky.delete` — the name avoids shadowing the `delete` keyword

## Recent decisions
- Import flow is synchronous (blocks until Claude responds) — no SSE progress yet
- Dashboard shows "Blank Project" and "Import from GitHub" as tabs in create modal
- Project detail page has inline import button if no repo_url is set
- Hooks use useState + useEffect (not React Query) — keeps deps minimal for now
