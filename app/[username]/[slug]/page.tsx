import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateSlots } from '@/lib/slots'
import { BookingClient } from './booking-client'

export const dynamic = 'force-dynamic'

export default async function BookingPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>
}) {
  const { username, slug } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .single()

  if (!profile) {
    notFound()
  }

  const { data: eventType } = await supabase
    .from('event_types')
    .select('id, title, duration_minutes, description')
    .eq('host_id', profile.id)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!eventType) {
    notFound()
  }

  const { data: availability } = await supabase
    .from('availability')
    .select('weekday, start_time, end_time')
    .eq('host_id', profile.id)

  const now = new Date()
  const rangeEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const { data: busyTimes } = await supabase.rpc('get_busy_times', {
    p_host_id: profile.id,
    p_from: now.toISOString(),
    p_to: rangeEnd.toISOString(),
  })

  const slots = generateSlots(
    (availability ?? []).map((row) => ({
      weekday: row.weekday,
      start: row.start_time.slice(0, 5),
      end: row.end_time.slice(0, 5),
    })),
    eventType.duration_minutes,
    busyTimes ?? [],
    now
  )

  return (
    <BookingClient
      eventTypeTitle={eventType.title}
      eventTypeDescription={eventType.description}
      slots={slots}
    />
  )
}
