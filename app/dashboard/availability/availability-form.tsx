'use client'

import { useState } from 'react'
import { saveAvailabilityAction } from '@/lib/actions/availability'
import { validateWindow, findOverlap, type Window } from '@/lib/availability-validation'

export type DayState = {
  weekday: number
  enabled: boolean
  windows: Window[]
}

const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  0: 'Sunday',
}

function sortWindows(windows: Window[]): Window[] {
  return [...windows].sort((a, b) => a.start.localeCompare(b.start))
}

export function AvailabilityForm({ initialDays }: { initialDays: DayState[] }) {
  const [days, setDays] = useState<DayState[]>(initialDays)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  function updateDay(weekday: number, updater: (day: DayState) => DayState) {
    setDays((prev) => prev.map((day) => (day.weekday === weekday ? updater(day) : day)))
  }

  function toggleDay(weekday: number, enabled: boolean) {
    updateDay(weekday, (day) => ({ ...day, enabled, windows: enabled ? day.windows : [] }))
  }

  function addWindow(weekday: number) {
    updateDay(weekday, (day) => ({
      ...day,
      windows: [...day.windows, { start: '09:00', end: '17:00' }],
    }))
  }

  function removeWindow(weekday: number, index: number) {
    updateDay(weekday, (day) => ({
      ...day,
      windows: day.windows.filter((_, i) => i !== index),
    }))
  }

  function updateWindow(weekday: number, index: number, field: 'start' | 'end', value: string) {
    updateDay(weekday, (day) => ({
      ...day,
      windows: day.windows.map((window, i) =>
        i === index ? { ...window, [field]: value } : window
      ),
    }))
  }

  function windowError(day: DayState, index: number): string | null {
    const window = day.windows[index]
    const basicError = validateWindow(window)
    if (basicError) return basicError
    const overlapping = findOverlap(day.windows)
    if (overlapping.includes(index)) {
      return 'Overlaps another window on this day.'
    }
    return null
  }

  async function handleSave() {
    setError(null)
    setSavedAt(null)

    for (const day of days) {
      for (let i = 0; i < day.windows.length; i++) {
        const message = windowError(day, i)
        if (message) {
          setError(`${WEEKDAY_LABELS[day.weekday]}: ${message}`)
          return
        }
      }
    }

    setSaving(true)
    try {
      const result = await saveAvailabilityAction(
        days.map((day) => ({ weekday: day.weekday, windows: sortWindows(day.windows) }))
      )
      if (result.error) {
        setError(result.error)
      } else {
        setSavedAt(Date.now())
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {days.map((day) => (
        <div
          key={day.weekday}
          className="rounded border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={day.enabled}
              onChange={(event) => toggleDay(day.weekday, event.target.checked)}
            />
            {WEEKDAY_LABELS[day.weekday]}
          </label>

          {day.enabled && (
            <div className="mt-3 flex flex-col gap-2">
              {sortWindows(day.windows).map((window) => {
                const index = day.windows.indexOf(window)
                const message = windowError(day, index)
                return (
                  <div key={index} className="flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      step={1800}
                      value={window.start}
                      onChange={(event) =>
                        updateWindow(day.weekday, index, 'start', event.target.value)
                      }
                      className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-black"
                    />
                    <span>to</span>
                    <input
                      type="time"
                      step={1800}
                      value={window.end}
                      onChange={(event) =>
                        updateWindow(day.weekday, index, 'end', event.target.value)
                      }
                      className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-black"
                    />
                    <button
                      type="button"
                      onClick={() => removeWindow(day.weekday, index)}
                      className="text-sm text-red-600 dark:text-red-400"
                    >
                      Remove
                    </button>
                    {message && (
                      <span className="text-xs text-red-600" role="alert">
                        {message}
                      </span>
                    )}
                  </div>
                )
              })}
              <button
                type="button"
                onClick={() => addWindow(day.weekday)}
                className="self-start text-sm underline"
              >
                + Add window
              </button>
            </div>
          )}
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {savedAt && <p className="text-sm text-emerald-600">Saved.</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}
