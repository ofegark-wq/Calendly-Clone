'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signInAction } from '@/lib/actions/auth'
import { initialAuthState } from '@/lib/actions/auth-state'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialAuthState)

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
      </div>

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
        {pending ? 'Logging in...' : 'Log in'}
      </button>

      <p className="text-sm text-zinc-500">
        Need an account?{' '}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </form>
  )
}
