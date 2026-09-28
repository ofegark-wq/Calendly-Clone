import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '@/lib/actions/auth'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // proxy.ts already redirects any signed-out request away from
  // /dashboard, so a user is expected to exist by the time we get here.
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user!.id)
    .single()

  const publicPath = `/${profile?.username}`

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 font-sans dark:bg-black">
      <h1 className="text-2xl font-semibold">Hi {profile?.username}</h1>
      <p className="text-sm text-zinc-500">
        Your public booking page:{' '}
        <Link href={publicPath} className="underline">
          {publicPath}
        </Link>
      </p>
      <Link href="/dashboard/event-types" className="underline">
        Manage appointment types
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-700"
        >
          Log out
        </button>
      </form>
    </div>
  )
}
