-- Run this once in the Supabase project's SQL Editor (Database -> SQL Editor -> New query).
-- Sets up per-user subscription tier + monthly usage quota tracking for the
-- rate-limited endpoints (/api/places, /api/recommendations).

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free',
  created_at timestamptz not null default now()
);

create table if not exists usage_periods (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  search_count int not null default 0,
  primary key (user_id, period_start)
);

-- Creates a profile row automatically whenever a new user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Atomically increments this month's search count and returns the new total,
-- so the server can enforce quotas without a check-then-write race condition
-- (two concurrent requests both reading count=N before either writes N+1).
create or replace function increment_usage(p_user_id uuid)
returns int
language plpgsql
security definer set search_path = public
as $$
declare
  v_period date := date_trunc('month', now())::date;
  v_count int;
begin
  insert into usage_periods (user_id, period_start, search_count)
  values (p_user_id, v_period, 1)
  on conflict (user_id, period_start)
  do update set search_count = usage_periods.search_count + 1
  returning search_count into v_count;
  return v_count;
end;
$$;

alter table profiles enable row level security;
alter table usage_periods enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can view own usage" on usage_periods
  for select using (auth.uid() = user_id);
