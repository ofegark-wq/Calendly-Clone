'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { slugify, validateSlug } from '@/lib/slug'
import type { EventTypeFormState } from '@/lib/actions/event-type-state'

const DURATIONS = [15, 30, 45, 60]

function parseEventTypeFields(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const slugInput = String(formData.get('slug') ?? '').trim().toLowerCase()
  const slug = slugInput || slugify(title)
  const durationMinutes = Number(formData.get('duration_minutes'))
  const description = String(formData.get('description') ?? '').trim() || null
  const isActive = formData.get('is_active') === 'on'
  return { title, slug, durationMinutes, description, isActive }
}

export async function createEventTypeAction(
  _prevState: EventTypeFormState,
  formData: FormData
): Promise<EventTypeFormState> {
  const { title, slug, durationMinutes, description, isActive } = parseEventTypeFields(formData)

  if (!title) {
    return { error: 'Title is required.' }
  }
  const slugError = validateSlug(slug)
  if (slugError) {
    return { error: slugError }
  }
  if (!DURATIONS.includes(durationMinutes)) {
    return { error: 'Duration must be 15, 30, 45, or 60 minutes.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('event_types').insert({
    host_id: user!.id,
    title,
    slug,
    duration_minutes: durationMinutes,
    description,
    is_active: isActive,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'You already have an appointment type with that slug.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard/event-types')
  redirect('/dashboard/event-types')
}

export async function updateEventTypeAction(
  _prevState: EventTypeFormState,
  formData: FormData
): Promise<EventTypeFormState> {
  const id = String(formData.get('id') ?? '')
  const { title, slug, durationMinutes, description, isActive } = parseEventTypeFields(formData)

  if (!title) {
    return { error: 'Title is required.' }
  }
  const slugError = validateSlug(slug)
  if (slugError) {
    return { error: slugError }
  }
  if (!DURATIONS.includes(durationMinutes)) {
    return { error: 'Duration must be 15, 30, 45, or 60 minutes.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('event_types')
    .update({
      title,
      slug,
      duration_minutes: durationMinutes,
      description,
      is_active: isActive,
    })
    .eq('id', id)
    .eq('host_id', user!.id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'You already have an appointment type with that slug.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard/event-types')
  redirect('/dashboard/event-types')
}

export async function deleteEventTypeAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('event_types')
    .delete()
    .eq('id', id)
    .eq('host_id', user!.id)

  if (error) {
    if (error.code === '23503') {
      redirect('/dashboard/event-types?error=has-bookings')
    }
    redirect('/dashboard/event-types?error=delete-failed')
  }

  revalidatePath('/dashboard/event-types')
  redirect('/dashboard/event-types')
}
