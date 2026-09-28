'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUpAction } from '@/lib/actions/auth'
import { initialAuthState } from '@/lib/actions/auth-state'

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialAuthState)

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          pattern="[a-z0-9-]+"
          minLength={3}
          maxLength={30}
          placeholder="jane-doe"
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
        <p className="text-xs text-zinc-500">
          Lowercase letters, numbers, and hyphens only. This becomes your public link:
          yoursite.com/username.
        </p>
      </div>

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
          minLength={6}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-black"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.message && <p className="text-sm text-emerald-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? 'Creating account...' : 'Sign up'}
      </button>

      <p className="text-sm text-zinc-500">
        Already have an account?{' '}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </form>
  )
}
