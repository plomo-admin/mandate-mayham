-- Mandate Mayhem — leaderboard schema
-- Run this in your Supabase SQL editor

create table if not exists leaderboard_entries (
  id                       uuid primary key default gen_random_uuid(),
  nickname                 text not null,
  task_prompt              text not null,
  constraints              jsonb not null,
  answer                   text not null,
  short_display_answer     text not null default '',
  overall_score            integer not null check (overall_score between 0 and 100),
  professionalism          integer not null check (professionalism between 0 and 100),
  diplomacy                integer not null check (diplomacy between 0 and 100),
  clarity                  integer not null check (clarity between 0 and 100),
  constraint_adherence     integer not null check (constraint_adherence between 0 and 100),
  passive_aggression_control integer not null check (passive_aggression_control between 0 and 100),
  label                    text not null,
  verdict                  text not null,
  one_line_roast           text not null,
  improvement_tip          text not null,
  created_at               timestamptz not null default now()
);

-- Index for leaderboard queries (sorted by score desc)
create index if not exists idx_leaderboard_score
  on leaderboard_entries (overall_score desc, created_at asc);

-- Optional: enable Row Level Security but allow anonymous reads and inserts
alter table leaderboard_entries enable row level security;

-- Allow anyone to read (public leaderboard)
create policy "allow public reads"
  on leaderboard_entries for select
  using (true);

-- Allow anyone to insert (no auth required)
create policy "allow public inserts"
  on leaderboard_entries for insert
  
  with check (true);
