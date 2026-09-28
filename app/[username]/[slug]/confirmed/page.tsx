import { notFound } from 'next/navigation'

export default async function ConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; slug: string }>
  searchParams: Promise<{ start?: string; title?: string }>
}) {
  const { username } = await params
  const { start, title } = await searchParams

  if (!start) {
    notFound()
  }

  const date = new Date(start)
  const formattedDate = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Africa/Lagos',
  })
  const formattedTime = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  })

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-3 px-4 text-center font-sans">
      <h1 className="text-2xl font-semibold">You&apos;re booked!</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        {title ?? 'Appointment'} with {username}
      </p>
      <p className="text-zinc-600 dark:text-zinc-400">
        {formattedDate} at {formattedTime} (Africa/Lagos)
      </p>
    </div>
  )
}
