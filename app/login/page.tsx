import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 font-sans dark:bg-black">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <LoginForm />
    </div>
  )
}
