import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '@/lib/actions/auth'

export const dynamic = 'force-dynamic'

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  const datePart = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Lagos',
  })
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  })
  return `${datePart} at ${timePart}`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // proxy.ts already redirects any signed-out request away from
  // /dashboard, so a user is expected to exist by the time we get here.
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user!.id)
    .single()

  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select('id, event_type_id, start_at, invitee_name')
    .eq('host_id', user!.id)
    .eq('status', 'confirmed')
    .gt('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(5)

  const { data: eventTypes } = await supabase
    .from('event_types')
    .select('id, title')
    .eq('host_id', user!.id)

  const titleById = new Map(
    (eventTypes ?? []).map((eventType) => [eventType.id, eventType.title])
  )

  const publicPath = `/${profile?.username}`

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-12 font-sans">
      <h1 className="text-2xl font-semibold">Hi {profile?.username}</h1>
      <p className="text-sm text-zinc-500">
        Your public booking page:{' '}
        <Link href={publicPath} className="underline">
          {publicPath}
        </Link>
      </p>

      <div className="flex gap-4 text-sm">
        <Link href="/dashboard/event-types" className="underline">
          Event types
        </Link>
        <Link href="/dashboard/availability" className="underline">
          Availability
        </Link>
        <Link href="/dashboard/bookings" className="underline">
          Bookings
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-medium">Next 5 upcoming bookings</h2>
        {(!upcomingBookings || upcomingBookings.length === 0) && (
          <p className="mt-2 text-sm text-zinc-500">No upcoming bookings.</p>
        )}
        <ul className="mt-2 flex flex-col gap-2">
          {upcomingBookings?.map((booking) => (
            <li
              key={booking.id}
              className="rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800"
            >
              <p className="font-medium">{formatDateTime(booking.start_at)}</p>
              <p className="text-zinc-500">
                {titleById.get(booking.event_type_id) ?? 'Appointment'} with{' '}
                {booking.invitee_name}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-700"
        >
          Log out
        </button>
      </form>
    </div>
  )
}
