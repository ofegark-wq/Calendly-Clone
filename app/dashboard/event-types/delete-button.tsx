'use client'

export function DeleteButton({
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
        if (!confirm('Delete this appointment type? This cannot be undone.')) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 dark:border-red-800 dark:text-red-400"
      >
        Delete
      </button>
    </form>
  )
}
