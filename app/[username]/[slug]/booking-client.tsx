'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Slot } from '@/lib/slots'
import { createBookingAction } from '@/lib/actions/bookings'

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Lagos',
  })
}

function formatTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  })
}

function dateKey(iso: string): string {
  // Group by the Lagos calendar date, not whichever date the visitor's
  // own browser/timezone would otherwise assume.
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
}

export function BookingClient({
  username,
  slug,
  eventTypeId,
  eventTypeTitle,
  eventTypeDescription,
  slots,
}: {
  username: string
  slug: string
  eventTypeId: string
  eventTypeTitle: string
  eventTypeDescription: string | null
  slots: Slot[]
}) {
  const router = useRouter()

  const days = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const slot of slots) {
      const key = dateKey(slot.startAt)
      const existing = map.get(key) ?? []
      existing.push(slot)
      map.set(key, existing)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [slots])

  const [selectedDay, setSelectedDay] = useState<string | null>(days[0]?.[0] ?? null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const selectedDaySlots = days.find(([key]) => key === selectedDay)?.[1] ?? []

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedSlot) return

    setError(null)
    setSubmitting(true)
    try {
      const result = await createBookingAction({
        eventTypeId,
        startAt: selectedSlot.startAt,
        name,
        email,
        username,
        slug,
        eventTypeTitle,
      })
      if (result?.error) {
        setError(result.error)
        setSelectedSlot(null)
        router.refresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-12 font-sans">
      <div>
        <h1 className="text-2xl font-semibold">{eventTypeTitle}</h1>
        {eventTypeDescription && (
          <p className="mt-1 text-sm text-zinc-500">{eventTypeDescription}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {days.length === 0 ? (
        <p className="text-sm text-zinc-500">No open times in the next two weeks.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {days.map(([key, daySlots]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedDay(key)
                  setSelectedSlot(null)
                }}
                className={`rounded border px-3 py-1.5 text-sm ${
                  key === selectedDay
                    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                    : 'border-zinc-300 dark:border-zinc-700'
                }`}
              >
                {formatDateLabel(daySlots[0].startAt)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedDaySlots.map((slot) => (
              <button
                key={slot.startAt}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`rounded border px-3 py-1.5 text-sm ${
                  slot.startAt === selectedSlot?.startAt
                    ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                    : 'border-zinc-300 dark:border-zinc-700'
                }`}
              >
                {formatTimeLabel(slot.startAt)}
              </button>
            ))}
          </div>

          {selectedSlot && (
            <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
              <p className="text-sm text-zinc-500">
                {formatDateLabel(selectedSlot.startAt)} at{' '}
                {formatTimeLabel(selectedSlot.startAt)} (Africa/Lagos)
              </p>
              <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {submitting ? 'Booking...' : 'Book'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )
}
