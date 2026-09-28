import { createClient } from '@/lib/supabase/server'
import { AvailabilityForm, type DayState } from './availability-form'

export const dynamic = 'force-dynamic'

// Display order is Monday -> Sunday, but the stored weekday values follow
// JS Date.getDay()'s convention (0 = Sunday, 1 = Monday, ...), so Phase 5's
// slot generation can look up a day's rows without any remapping.
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export default async function AvailabilityPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: rows } = await supabase
    .from('availability')
    .select('weekday, start_time, end_time')
    .eq('host_id', user!.id)
    .order('start_time', { ascending: true })

  const hasAnyRows = (rows?.length ?? 0) > 0

  const initialDays: DayState[] = WEEKDAY_ORDER.map((weekday) => {
    const dayRows = rows?.filter((row) => row.weekday === weekday) ?? []

    if (hasAnyRows) {
      return {
        weekday,
        enabled: dayRows.length > 0,
        windows: dayRows.map((row) => ({
          start: row.start_time.slice(0, 5),
          end: row.end_time.slice(0, 5),
        })),
      }
    }

    // First visit ever, nothing saved yet: default to Mon-Fri 09:00-17:00,
    // weekends off.
    const isWeekday = weekday >= 1 && weekday <= 5
    return {
      weekday,
      enabled: isWeekday,
      windows: isWeekday ? [{ start: '09:00', end: '17:00' }] : [],
    }
  })

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12 font-sans">
      <h1 className="text-2xl font-semibold">Weekly availability</h1>
      <AvailabilityForm initialDays={initialDays} />
    </div>
  )
}
