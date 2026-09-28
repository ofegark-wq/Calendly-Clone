-- Fix: Postgres requires two separate layers of permission on a table -
-- a table-level GRANT ("can this role touch this table at all?") and,
-- independently, our Row Level Security policies ("which rows, and
-- under what condition?"). Phase 1 set up the RLS policies but never
-- granted table-level access to the anon/authenticated roles, which is
-- why reads failed with "permission denied for table profiles" even
-- though the matching RLS policy allowed it. RLS only ever narrows
-- access that the GRANT already allows - it can't grant access on its
-- own.

grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant insert, update, delete on public.profiles to authenticated;

grant select on public.event_types to anon, authenticated;
grant insert, update, delete on public.event_types to authenticated;

grant select on public.availability to anon, authenticated;
grant insert, update, delete on public.availability to authenticated;

-- No insert grant here: bookings are only ever created through the
-- create_booking() database function we add in Phase 6, which runs
-- with the owning role's own privileges regardless of this grant.
grant select, update on public.bookings to authenticated;
