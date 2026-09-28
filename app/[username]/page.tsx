import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HostPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .eq('username', username)
    .single()

  if (!profile) {
    notFound()
  }

  const { data: eventTypes } = await supabase
    .from('event_types')
    .select('slug, title, duration_minutes, description')
    .eq('host_id', profile.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-12 font-sans">
      <h1 className="text-2xl font-semibold">{profile.full_name ?? profile.username}</h1>

      {(!eventTypes || eventTypes.length === 0) && (
        <p className="text-sm text-zinc-500">No appointment types available yet.</p>
      )}

      <ul className="flex flex-col gap-3">
        {eventTypes?.map((eventType) => (
          <li key={eventType.slug}>
            <Link
              href={`/${username}/${eventType.slug}`}
              className="block rounded border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <p className="font-medium">{eventType.title}</p>
              <p className="text-sm text-zinc-500">{eventType.duration_minutes} minutes</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
