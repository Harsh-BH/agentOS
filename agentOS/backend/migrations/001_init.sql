-- AgentOS initial schema
-- Run this in the Supabase SQL Editor (or via psql)

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROJECTS
-- ============================================================
create table if not exists projects (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null,
  name        text not null,
  description text not null default '',
  context     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_projects_user_id on projects(user_id);

-- ============================================================
-- SKILLS
-- ============================================================
create type skill_type as enum ('prompt', 'tool', 'agent');

create table if not exists skills (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references projects(id) on delete cascade,
  user_id     uuid not null,
  name        text not null,
  type        skill_type not null default 'prompt',
  config      jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_skills_project_id on skills(project_id);
create index if not exists idx_skills_user_id on skills(user_id);

-- ============================================================
-- WORKFLOWS
-- ============================================================
create table if not exists workflows (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references projects(id) on delete cascade,
  user_id     uuid not null,
  name        text not null,
  nodes       jsonb not null default '[]',
  edges       jsonb not null default '[]',
  version     integer not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_workflows_project_id on workflows(project_id);
create index if not exists idx_workflows_user_id on workflows(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Projects RLS
alter table projects enable row level security;

create policy "Users can view own projects"
  on projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on projects for delete
  using (auth.uid() = user_id);

-- Skills RLS
alter table skills enable row level security;

create policy "Users can view own skills"
  on skills for select
  using (auth.uid() = user_id);

create policy "Users can insert own skills"
  on skills for insert
  with check (auth.uid() = user_id);

create policy "Users can update own skills"
  on skills for update
  using (auth.uid() = user_id);

create policy "Users can delete own skills"
  on skills for delete
  using (auth.uid() = user_id);

-- Workflows RLS
alter table workflows enable row level security;

create policy "Users can view own workflows"
  on workflows for select
  using (auth.uid() = user_id);

create policy "Users can insert own workflows"
  on workflows for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workflows"
  on workflows for update
  using (auth.uid() = user_id);

create policy "Users can delete own workflows"
  on workflows for delete
  using (auth.uid() = user_id);

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create trigger set_skills_updated_at
  before update on skills
  for each row execute function update_updated_at();

create trigger set_workflows_updated_at
  before update on workflows
  for each row execute function update_updated_at();
