import { describe, expect, it } from 'vitest'
import { generateSlots } from './slots'

const LAGOS_OFFSET_MS = 60 * 60 * 1000

function lagosWeekdayOf(date: Date): number {
  return new Date(date.getTime() + LAGOS_OFFSET_MS).getUTCDay()
}

describe('generateSlots', () => {
  it('includes a slot ending exactly at the window end time, and excludes one that would run past it', () => {
    const now = new Date('2026-01-05T06:00:00Z') // 07:00 Lagos time, well before the window
    const weekday = lagosWeekdayOf(now)

    const slots = generateSlots([{ weekday, start: '09:00', end: '10:00' }], 30, [], now, 1)

    // 09:00-09:30 and 09:30-10:00 fit exactly inside the window; a third
    // 30-minute slot would run to 10:30, past the window's 10:00 end.
    expect(slots).toHaveLength(2)
    expect(slots[0].startAt).toContain('T09:00:00')
    expect(slots[1].startAt).toContain('T09:30:00')
    expect(slots[1].endAt).toContain('T10:00:00')
  })

  it('excludes slots that have already passed', () => {
    const now = new Date('2026-01-05T09:15:00+01:00') // 09:15 Lagos time
    const weekday = lagosWeekdayOf(now)

    const slots = generateSlots([{ weekday, start: '09:00', end: '10:00' }], 30, [], now, 1)

    expect(slots).toHaveLength(1)
    expect(slots[0].startAt).toContain('T09:30:00')
  })

  it('excludes slots that overlap an existing confirmed booking', () => {
    const now = new Date('2026-01-05T06:00:00Z')
    const weekday = lagosWeekdayOf(now)
    const dateYMD = new Date(now.getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10)

    const slots = generateSlots(
      [{ weekday, start: '09:00', end: '10:00' }],
      30,
      [{ start_at: `${dateYMD}T09:00:00+01:00`, end_at: `${dateYMD}T09:30:00+01:00` }],
      now,
      1
    )

    expect(slots).toHaveLength(1)
    expect(slots[0].startAt).toContain('T09:30:00')
  })

  it('leaves no slots in the gap between two windows on the same day', () => {
    const now = new Date('2026-01-05T06:00:00Z')
    const weekday = lagosWeekdayOf(now)

    const slots = generateSlots(
      [
        { weekday, start: '09:00', end: '12:00' },
        { weekday, start: '14:00', end: '17:00' },
      ],
      30,
      [],
      now,
      1
    )

    expect(slots.length).toBeGreaterThan(0)
    expect(
      slots.every((slot) => {
        const time = slot.startAt.slice(11, 16)
        return time < '12:00' || time >= '14:00'
      })
    ).toBe(true)
  })
})
