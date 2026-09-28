import { EventTypeForm } from '../event-type-form'
import { createEventTypeAction } from '@/lib/actions/event-types'

export default function NewEventTypePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12 font-sans">
      <h1 className="text-2xl font-semibold">New appointment type</h1>
      <EventTypeForm action={createEventTypeAction} />
    </div>
  )
}
