import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { deleteEventTypeAction } from '@/lib/actions/event-types'
import { CopyLinkButton } from './copy-link-button'
import { DeleteButton } from './delete-button'

const ERROR_MESSAGES: Record<string, string> = {
  'has-bookings':
    'That type has existing bookings, so it can only be deactivated, not deleted.',
  'delete-failed': 'Something went wrong deleting that type. Please try again.',
}

export default async function EventTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user!.id)
    .single()

  const { data: eventTypes } = await supabase
    .from('event_types')
    .select('id, title, slug, duration_minutes, is_active')
    .eq('host_id', user!.id)
    .order('created_at', { ascending: true })

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12 font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Appointment types</h1>
        <Link
          href="/dashboard/event-types/new"
          className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
        >
          New event type
        </Link>
      </div>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      {(!eventTypes || eventTypes.length === 0) && (
        <p className="text-sm text-zinc-500">
          No appointment types yet. Create your first one.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {eventTypes?.map((eventType) => (
          <li
            key={eventType.id}
            className="flex items-center justify-between gap-4 rounded border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div>
              <p className="font-medium">
                {eventType.title}{' '}
                {!eventType.is_active && (
                  <span className="ml-2 rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Inactive
                  </span>
                )}
              </p>
              <p className="text-sm text-zinc-500">
                {eventType.duration_minutes} minutes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CopyLinkButton path={`/${profile?.username}/${eventType.slug}`} />
              <Link
                href={`/dashboard/event-types/${eventType.id}/edit`}
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
              >
                Edit
              </Link>
              <DeleteButton id={eventType.id} action={deleteEventTypeAction} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
