'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validateWindow, findOverlap, type Window } from '@/lib/availability-validation'

export type DayInput = { weekday: number; windows: Window[] }
export type SaveAvailabilityResult = { error: string | null }

export async function saveAvailabilityAction(
  days: DayInput[]
): Promise<SaveAvailabilityResult> {
  // Re-validate everything server-side - this action is called directly
  // from client code, not just through a form, so the client-side checks
  // are for a responsive UI, not the actual safety net.
  for (const day of days) {
    if (day.weekday < 0 || day.weekday > 6) {
      return { error: 'Invalid weekday.' }
    }
    for (const window of day.windows) {
      const windowError = validateWindow(window)
      if (windowError) {
        return { error: windowError }
      }
    }
    if (findOverlap(day.windows).length > 0) {
      return {
        error: 'Some windows on the same day overlap. Please fix them before saving.',
      }
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error: deleteError } = await supabase
    .from('availability')
    .delete()
    .eq('host_id', user!.id)

  if (deleteError) {
    return { error: deleteError.message }
  }

  const rows = days.flatMap((day) =>
    day.windows.map((window) => ({
      host_id: user!.id,
      weekday: day.weekday,
      start_time: window.start,
      end_time: window.end,
    }))
  )

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('availability').insert(rows)
    if (insertError) {
      return { error: insertError.message }
    }
  }

  revalidatePath('/dashboard/availability')
  return { error: null }
}
