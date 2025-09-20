
-- Enable pgcrypto for gen_random_uuid if needed
create extension if not exists pgcrypto;

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  candidate_name text,
  image_url text,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_code text not null,
  score numeric not null check (score >= 0 and score <= 10),
  role text not null check (role in ('judge','public')),
  created_at timestamptz not null default now(),
  unique (poll_id, user_code)
);

create table if not exists public.poll_judges (
  id bigserial primary key,
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id text not null
);

-- Indexes
create index if not exists idx_votes_poll on public.votes(poll_id);
create index if not exists idx_poll_judges_poll on public.poll_judges(poll_id);

-- RLS (demo: permissive for anon)
alter table public.polls enable row level security;
alter table public.votes enable row level security;
alter table public.poll_judges enable row level security;

-- Policies (WARNING: open policies for demo purposes)
create policy "polls_read" on public.polls for select using (true);
create policy "polls_insert" on public.polls for insert with check (true);
create policy "polls_update" on public.polls for update using (true);
create policy "polls_delete" on public.polls for delete using (true);

create policy "votes_read" on public.votes for select using (true);
create policy "votes_insert" on public.votes for insert with check (true);
create policy "votes_update" on public.votes for update using (true);
create policy "votes_delete" on public.votes for delete using (true);

create policy "pj_read" on public.poll_judges for select using (true);
create policy "pj_insert" on public.poll_judges for insert with check (true);
create policy "pj_update" on public.poll_judges for update using (true);
create policy "pj_delete" on public.poll_judges for delete using (true);

-- Realtime
-- In Supabase Dashboard -> Database -> Replication -> Add
-- Supabase Realtime must be enabled for tables polls and votes.
