import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider'

export function LoginPage() {
  const { login, register, broker } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (broker) {
    const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/recordings/new'
    void navigate(redirectTo, { replace: true })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        await login({ email, password })
      } else {
        await register({ full_name: fullName, email, password })
      }
      const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/recordings/new'
      navigate(redirectTo, { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_30%),linear-gradient(180deg,#09111f_0%,#102030_48%,#f7f4ee_48%,#f7f4ee_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center gap-8 lg:flex-row lg:items-center">
        <section className="max-w-xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sea-400">Local-first broker PoC</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Turn calls into reviewed calendar actions.</h1>
          <p className="max-w-lg text-sm leading-6 text-sand-100/90 sm:text-base">
            Record or upload a call, extract draft follow-ups, review the proposed actions on mobile, and only then persist the final calendar event.
          </p>
          <div className="grid gap-3 text-sm text-sand-100/90 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">Mobile-first review flow for brokers.</div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">SQLite and local audio storage by default.</div>
          </div>
        </section>

        <section className="w-full max-w-lg rounded-[2rem] border border-black/5 bg-sand-50 p-6 text-ink-900 shadow-soft sm:p-8">
          <div className="flex rounded-full bg-sand-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-full px-4 py-2 ${mode === 'register' ? 'bg-ink-950 text-white' : 'text-ink-700'}`}
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-full px-4 py-2 ${mode === 'login' ? 'bg-ink-950 text-white' : 'text-ink-700'}`}
            >
              Sign in
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink-700">Full name</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink-900 outline-none ring-0 transition focus:border-sea-500"
                  placeholder="Alya Khan"
                />
              </label>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink-900 outline-none ring-0 transition focus:border-sea-500"
                placeholder="broker@example.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink-900 outline-none ring-0 transition focus:border-sea-500"
                placeholder="Enter your password"
              />
            </label>

            {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-ink-950 px-4 py-3 text-base font-medium text-white transition hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
