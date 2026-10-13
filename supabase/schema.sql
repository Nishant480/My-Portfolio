-- Run once in the Supabase SQL editor.
create table if not exists public.site_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Lock the table down: only the server (service role key) can read or write it.
alter table public.site_content enable row level security;

-- Public bucket for images and the resume PDF. Uploads go through the
-- server with the service role key, so no public insert policy is needed.
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;
