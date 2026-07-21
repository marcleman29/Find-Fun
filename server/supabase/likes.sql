-- Run this once in the Supabase project's SQL Editor, after schema.sql.
-- Community "likes" per place — separate from the personal, device-local
-- favorites list. Powers the Trending sort.

create table if not exists place_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

alter table place_likes enable row level security;

-- The server aggregates counts using the service-role key (bypasses RLS),
-- so these policies only matter for direct client access with the anon
-- key + a user's own JWT — a real path via Supabase's REST API, not just
-- defense in depth.
create policy "Users can view own likes" on place_likes
  for select using (auth.uid() = user_id);

create policy "Users can like on their own behalf" on place_likes
  for insert with check (auth.uid() = user_id);

create policy "Users can unlike their own likes" on place_likes
  for delete using (auth.uid() = user_id);
