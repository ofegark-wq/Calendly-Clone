export type Window = { start: string; end: string }

// Windows use "HH:MM" strings (what <input type="time"> gives us), which
// compare correctly with plain string comparison since they're always
// zero-padded and represent times within the same day.

export function validateWindow(window: Window): string | null {
  if (!window.start || !window.end) {
    return 'Both a start and end time are required.'
  }
  if (window.end <= window.start) {
    return 'End time must be after start time.'
  }
  return null
}

export function findOverlap(windows: Window[]): number[] {
  const overlapping = new Set<number>()
  for (let i = 0; i < windows.length; i++) {
    for (let j = i + 1; j < windows.length; j++) {
      const a = windows[i]
      const b = windows[j]
      if (a.start < b.end && b.start < a.end) {
        overlapping.add(i)
        overlapping.add(j)
      }
    }
  }
  return [...overlapping]
}
