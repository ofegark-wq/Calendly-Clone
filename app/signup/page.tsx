import { SignupForm } from './signup-form'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 font-sans dark:bg-black">
      <h1 className="text-2xl font-semibold">Create your host account</h1>
      <SignupForm />
    </div>
  )
}
