-- Run this once in the Supabase project's SQL Editor if the server ever
-- shows "permission denied for table X" — the service-role key it uses
-- should have full access to every table by default (it bypasses RLS),
-- but the underlying Postgres GRANTs can be missing depending on how/when
-- a table was created. This explicitly grants what the server needs.

grant usage on schema public to service_role;
grant all on public.profiles to service_role;
grant all on public.usage_periods to service_role;
grant all on public.place_likes to service_role;
grant execute on function public.increment_usage(uuid) to service_role;
