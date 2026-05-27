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
    <div className="app-shell min-h-screen px-4 py-5 text-ink-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col justify-center gap-6 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-8">
        <section className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sea-700">Local-first broker PoC</p>
          <div className="space-y-2">
            <h1 className="max-w-xl text-[2.45rem] font-semibold tracking-[-0.04em] text-ink-950 sm:text-[3.3rem]">
              Turn calls into reviewed calendar events.
            </h1>
            <p className="max-w-lg text-sm leading-6 text-ink-600 sm:text-[0.98rem]">
            Record or upload a call, extract draft follow-ups, review the proposed actions on mobile, and only then persist the final calendar event.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-ink-600 sm:grid-cols-2">
            <div className="app-surface-muted rounded-[1.4rem] px-4 py-4">Mobile-first review flow for brokers.</div>
            <div className="app-surface-muted rounded-[1.4rem] px-4 py-4">SQLite and local audio storage by default.</div>
          </div>
        </section>

        <section className="app-surface w-full max-w-lg rounded-[1.8rem] p-5 sm:p-6">
          <div className="flex rounded-full bg-[#f2eee6] p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-full px-4 py-2 transition ${mode === 'register' ? 'bg-[linear-gradient(180deg,#3b9f96_0%,#2f8f86_100%)] text-white shadow-[0_8px_18px_rgba(47,143,134,0.18)]' : 'text-ink-600'}`}
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-full px-4 py-2 transition ${mode === 'login' ? 'bg-[linear-gradient(180deg,#3b9f96_0%,#2f8f86_100%)] text-white shadow-[0_8px_18px_rgba(47,143,134,0.18)]' : 'text-ink-600'}`}
            >
              Sign in
            </button>
          </div>

          <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink-700">Full name</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="app-input"
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
                className="app-input"
                placeholder="broker@example.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="app-input"
                placeholder="Enter your password"
              />
            </label>

            {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="app-button-primary w-full px-4 py-3 text-base disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
