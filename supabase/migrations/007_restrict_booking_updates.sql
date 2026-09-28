-- Security review fix: the RLS policy letting a host update their own
-- bookings (added so they can cancel one) technically allowed changing
-- ANY column via a direct API call - not just status - since RLS
-- policies don't restrict which columns a query is allowed to touch.
-- Replacing that broad policy with a single-purpose function that can
-- only ever do one thing: flip a host's own confirmed booking to
-- cancelled. Nothing else about a booking can be changed by anyone,
-- ever, after it's created.

drop policy "hosts update their own bookings" on public.bookings;
revoke update on public.bookings from authenticated;

create function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings
  set status = 'cancelled'
  where id = p_booking_id
    and host_id = auth.uid()
    and status = 'confirmed';

  if not found then
    raise exception 'booking_not_found';
  end if;
end;
$$;

grant execute on function public.cancel_booking(uuid) to authenticated;
