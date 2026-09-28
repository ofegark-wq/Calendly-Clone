'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type CreateBookingInput = {
  eventTypeId: string
  startAt: string
  name: string
  email: string
  username: string
  slug: string
  eventTypeTitle: string
}

export type CreateBookingResult = { error: string | null }

const ERROR_MESSAGES: Record<string, string> = {
  slot_taken: 'Sorry, that time was just booked. Please pick another.',
  outside_availability:
    "That time is outside the host's available hours. Please pick another.",
  time_in_past: 'That time has already passed. Please pick another.',
  invalid_name: 'Please enter your name.',
  invalid_email: 'Please enter a valid email address.',
  event_type_not_found: 'This appointment type is no longer available.',
}

export async function createBookingAction(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('create_booking', {
    p_event_type_id: input.eventTypeId,
    p_start_at: input.startAt,
    p_name: input.name,
    p_email: input.email,
  })

  if (error) {
    return { error: ERROR_MESSAGES[error.message] ?? 'Something went wrong. Please try again.' }
  }

  const params = new URLSearchParams({
    start: input.startAt,
    title: input.eventTypeTitle,
  })

  redirect(`/${input.username}/${input.slug}/confirmed?${params.toString()}`)
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('host_id', user!.id)

  revalidatePath('/dashboard/bookings')
  revalidatePath('/dashboard')
  redirect('/dashboard/bookings')
}
