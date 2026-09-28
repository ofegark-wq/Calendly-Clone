// Africa/Lagos is UTC+1 all year round (no daylight saving), so every
// slot's wall-clock time is written with a fixed "+01:00" offset - no
// time-zone conversion library is needed anywhere in this file.
const LAGOS_OFFSET_MINUTES = 60

export type AvailabilityWindow = { weekday: number; start: string; end: string }
export type BusyTime = { start_at: string; end_at: string }
export type Slot = { startAt: string; endAt: string }

function toLagosDate(date: Date): Date {
  return new Date(date.getTime() + LAGOS_OFFSET_MINUTES * 60 * 1000)
}

function formatDateYMD(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(totalMinutes: number): string {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
  const minutes = String(totalMinutes % 60).padStart(2, '0')
  return `${hours}:${minutes}`
}

function toLagosIso(dateYMD: string, time: string): string {
  return `${dateYMD}T${time}:00+01:00`
}

export function generateSlots(
  availability: AvailabilityWindow[],
  durationMinutes: number,
  busyTimes: BusyTime[],
  now: Date,
  days = 14
): Slot[] {
  const slots: Slot[] = []
  const nowLagos = toLagosDate(now)

  const busyRanges = busyTimes.map((busy) => ({
    start: new Date(busy.start_at).getTime(),
    end: new Date(busy.end_at).getTime(),
  }))

  for (let offset = 0; offset < days; offset++) {
    const dayLagos = new Date(nowLagos.getTime() + offset * 24 * 60 * 60 * 1000)
    const dateYMD = formatDateYMD(dayLagos)
    const weekday = dayLagos.getUTCDay()

    const dayWindows = availability.filter((window) => window.weekday === weekday)

    for (const window of dayWindows) {
      const windowStart = timeToMinutes(window.start)
      const windowEnd = timeToMinutes(window.end)

      for (
        let slotStart = windowStart;
        slotStart + durationMinutes <= windowEnd;
        slotStart += durationMinutes
      ) {
        const slotEnd = slotStart + durationMinutes
        const startIso = toLagosIso(dateYMD, minutesToTime(slotStart))
        const endIso = toLagosIso(dateYMD, minutesToTime(slotEnd))
        const startMs = new Date(startIso).getTime()
        const endMs = new Date(endIso).getTime()

        if (startMs <= now.getTime()) {
          continue
        }

        const overlapsBusy = busyRanges.some(
          (busy) => startMs < busy.end && busy.start < endMs
        )
        if (overlapsBusy) {
          continue
        }

        slots.push({ startAt: startIso, endAt: endIso })
      }
    }
  }

  return slots
}
