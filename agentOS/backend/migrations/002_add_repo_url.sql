-- Add repo_url to projects
alter table projects add column if not exists repo_url text not null default '';
