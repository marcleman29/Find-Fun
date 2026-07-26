-- Run once in Supabase's SQL Editor, after schema.sql/grants.sql.
-- Changes increment_usage to accept an explicit period_start instead of
-- always assuming "this calendar month" — needed because Plus now resets
-- weekly (100/week) while Free still resets monthly (10/month), and the
-- server (not Postgres) decides which period applies based on the
-- caller's tier. Same usage_periods table and primary key, just a caller
-- supplied period_start instead of one computed inside the function.

drop function if exists increment_usage(uuid);

create or replace function increment_usage(p_user_id uuid, p_period_start date)
returns int
language plpgsql
security definer set search_path = public
as $$
declare
  v_count int;
begin
  insert into usage_periods (user_id, period_start, search_count)
  values (p_user_id, p_period_start, 1)
  on conflict (user_id, period_start)
  do update set search_count = usage_periods.search_count + 1
  returning search_count into v_count;
  return v_count;
end;
$$;

grant execute on function increment_usage(uuid, date) to service_role;
