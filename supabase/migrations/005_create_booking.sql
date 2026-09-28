-- Phase 6: the only way a booking ever gets created. Never a direct
-- insert from the app - this function does its own validation, then
-- attempts the insert, and the Phase 1 exclusion constraint is what
-- actually guarantees no overlap: even if two people submit the exact
-- same slot at the same instant, only one insert here can win. The
-- checks below (past time, name/email, inside availability) are for
-- friendliness - clear error messages - not the safety net itself.
create function public.create_booking(
  p_event_type_id uuid,
  p_start_at timestamptz,
  p_name text,
  p_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id uuid;
  v_duration integer;
  v_end_at timestamptz;
  v_weekday smallint;
  v_start_time time;
  v_end_time time;
  v_fits boolean;
  v_booking_id uuid;
begin
  select host_id, duration_minutes
    into v_host_id, v_duration
  from public.event_types
  where id = p_event_type_id
    and is_active = true;

  if v_host_id is null then
    raise exception 'event_type_not_found';
  end if;

  v_end_at := p_start_at + (v_duration || ' minutes')::interval;

  if p_start_at <= now() then
    raise exception 'time_in_past';
  end if;

  if length(trim(p_name)) < 1 or length(trim(p_name)) > 100 then
    raise exception 'invalid_name';
  end if;

  if p_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid_email';
  end if;

  -- The slot must fit entirely inside one of the host's availability
  -- windows for that weekday, reading the timestamp as Africa/Lagos
  -- local time (weekday convention: 0 = Sunday ... 6 = Saturday, same
  -- as everywhere else in this app).
  v_weekday := extract(dow from (p_start_at at time zone 'Africa/Lagos'));
  v_start_time := (p_start_at at time zone 'Africa/Lagos')::time;
  v_end_time := (v_end_at at time zone 'Africa/Lagos')::time;

  select exists (
    select 1
    from public.availability
    where host_id = v_host_id
      and weekday = v_weekday
      and start_time <= v_start_time
      and end_time >= v_end_time
  ) into v_fits;

  if not v_fits then
    raise exception 'outside_availability';
  end if;

  begin
    insert into public.bookings (event_type_id, host_id, start_at, end_at, invitee_name, invitee_email)
    values (p_event_type_id, v_host_id, p_start_at, v_end_at, trim(p_name), lower(trim(p_email)))
    returning id into v_booking_id;
  exception
    when exclusion_violation then
      raise exception 'slot_taken';
  end;

  return v_booking_id;
end;
$$;

grant execute on function public.create_booking(uuid, timestamptz, text, text)
  to anon, authenticated;
