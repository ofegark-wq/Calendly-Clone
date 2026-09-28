'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { slugify } from '@/lib/slug'
import { initialEventTypeFormState } from '@/lib/actions/event-type-state'
import type { EventTypeFormState } from '@/lib/actions/event-type-state'

const DURATIONS = [15, 30, 45, 60]

type EventTypeFormProps = {
  action: (state: EventTypeFormState, formData: FormData) => Promise<EventTypeFormState>
  defaultValues?: {
    id?: string
    title?: string
    slug?: string
    duration_minutes?: number
    description?: string | null
    is_active?: boolean
  }
}

export function EventTypeForm({ action, defaultValues }: EventTypeFormProps) {
  const [state, formAction, pending] = useActionState(action, initialEventTypeFormState)
  const [title, setTitle] = useState(defaultValues?.title ?? '')
  const [slug, setSlug] = useState(defaultValues?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(Boolean(defaultValues?.slug))

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(event) => {
            const value = event.target.value
            setTitle(value)
            if (!slugEdited) {
              setSlug(slugify(value))
            }
          }}
          placeholder="30-min intro call"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="slug" className="text-sm font-medium">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          value={slug}
          onChange={(event) => {
            setSlugEdited(true)
            setSlug(event.target.value)
          }}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
        <p className="text-xs text-zinc-500">
          The last part of your public link for this type.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="duration_minutes" className="text-sm font-medium">
          Duration
        </label>
        <select
          id="duration_minutes"
          name="duration_minutes"
          defaultValue={defaultValues?.duration_minutes ?? 30}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        >
          {DURATIONS.map((duration) => (
            <option key={duration} value={duration}>
              {duration} minutes
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ''}
          rows={3}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={defaultValues?.is_active ?? true}
        />
        Active (visible on your public page)
      </label>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
