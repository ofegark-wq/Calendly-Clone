-- Phase 5: lets anyone (including invitees, who are never logged in) find
-- out which time ranges are already booked for a host, WITHOUT being able
-- to see who booked them or any other detail. This is the only way busy
-- times are ever exposed publicly - a direct SELECT on bookings stays
-- blocked by RLS, as set up in Phase 1.
create function public.get_busy_times(
  p_host_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (start_at timestamptz, end_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select start_at, end_at
  from public.bookings
  where host_id = p_host_id
    and status = 'confirmed'
    and start_at < p_to
    and end_at > p_from;
$$;

grant execute on function public.get_busy_times(uuid, timestamptz, timestamptz)
  to anon, authenticated;
