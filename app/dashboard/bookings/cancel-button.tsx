'use client'

export function CancelButton({
  id,
  action,
}: {
  id: string
  action: (formData: FormData) => void | Promise<void>
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm('Cancel this booking? This frees the slot back up.')) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 dark:border-red-800 dark:text-red-400"
      >
        Cancel
      </button>
    </form>
  )
}
