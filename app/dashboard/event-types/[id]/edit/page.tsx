import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EventTypeForm } from '../../event-type-form'
import { updateEventTypeAction } from '@/lib/actions/event-types'

export default async function EditEventTypePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: eventType } = await supabase
    .from('event_types')
    .select('id, title, slug, duration_minutes, description, is_active')
    .eq('id', id)
    .eq('host_id', user!.id)
    .single()

  if (!eventType) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12 font-sans">
      <h1 className="text-2xl font-semibold">Edit appointment type</h1>
      <EventTypeForm action={updateEventTypeAction} defaultValues={eventType} />
    </div>
  )
}
