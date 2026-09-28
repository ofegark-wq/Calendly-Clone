import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cancelBookingAction } from '@/lib/actions/bookings'
import { CancelButton } from './cancel-button'

export const dynamic = 'force-dynamic'

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  const datePart = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  })
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  })
  return `${datePart} at ${timePart}`
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = tab === 'past' ? 'past' : 'upcoming'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, event_type_id, start_at, end_at, invitee_name, invitee_email, status')
    .eq('host_id', user!.id)
    .order('start_at', { ascending: true })

  const { data: eventTypes } = await supabase
    .from('event_types')
    .select('id, title')
    .eq('host_id', user!.id)

  const titleById = new Map(
    (eventTypes ?? []).map((eventType) => [eventType.id, eventType.title])
  )

  const now = new Date().getTime()
  const upcoming = (bookings ?? []).filter(
    (booking) => new Date(booking.start_at).getTime() > now
  )
  const past = (bookings ?? [])
    .filter((booking) => new Date(booking.start_at).getTime() <= now)
    .reverse()

  const rows = activeTab === 'upcoming' ? upcoming : past

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12 font-sans">
      <h1 className="text-2xl font-semibold">Bookings</h1>

      <div className="flex gap-2">
        <Link
          href="/dashboard/bookings"
          className={`rounded border px-3 py-1.5 text-sm ${
            activeTab === 'upcoming'
              ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
              : 'border-zinc-300 dark:border-zinc-700'
          }`}
        >
          Upcoming
        </Link>
        <Link
          href="/dashboard/bookings?tab=past"
          className={`rounded border px-3 py-1.5 text-sm ${
            activeTab === 'past'
              ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
              : 'border-zinc-300 dark:border-zinc-700'
          }`}
        >
          Past
        </Link>
      </div>

      {rows.length === 0 && (
        <p className="text-sm text-zinc-500">
          No {activeTab === 'upcoming' ? 'upcoming' : 'past'} bookings.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {rows.map((booking) => (
          <li
            key={booking.id}
            className="flex items-center justify-between gap-4 rounded border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div>
              <p className="font-medium">
                {formatDateTime(booking.start_at)}{' '}
                <span className="ml-2 rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {booking.status}
                </span>
              </p>
              <p className="text-sm text-zinc-500">
                {titleById.get(booking.event_type_id) ?? 'Appointment'}
              </p>
              <p className="text-sm text-zinc-500">
                {booking.invitee_name} &middot; {booking.invitee_email}
              </p>
            </div>
            {activeTab === 'upcoming' && booking.status === 'confirmed' && (
              <CancelButton id={booking.id} action={cancelBookingAction} />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
