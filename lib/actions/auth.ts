'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateUsername } from '@/lib/usernames'
import type { AuthState } from '@/lib/actions/auth-state'

export async function signUpAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const username = String(formData.get('username') ?? '').trim().toLowerCase()

  const usernameError = validateUsername(username)
  if (usernameError) {
    return { error: usernameError }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    return { error: 'That username is already taken.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })

  if (error) {
    const message = error.message.toLowerCase()
    if (message.includes('already registered')) {
      return { error: 'An account with that email already exists.' }
    }
    if (message.includes('database error')) {
      return { error: 'That username was just taken. Please choose another.' }
    }
    return { error: error.message }
  }

  if (data.session) {
    redirect('/dashboard')
  }

  return {
    error: null,
    message: 'Account created. Check your email to confirm it, then log in.',
  }
}

export async function signInAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Incorrect email or password.' }
  }

  redirect('/dashboard')
}

export async function signOutAction(_formData: FormData): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
