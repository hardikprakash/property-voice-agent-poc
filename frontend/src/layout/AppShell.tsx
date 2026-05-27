import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../auth/AuthProvider'

const navItems = [
  { to: '/recordings/new', label: 'Record', icon: RecordIcon },
  { to: '/calendar', label: 'Events', icon: EventsIcon },
  { to: '/crm', label: 'Resources', icon: CrmIcon },
]

function RecordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
      <path d="M18 10v1a6 6 0 0 1-12 0v-1" />
      <path d="M12 17v4" />
    </svg>
  )
}

function EventsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3v3" />
      <path d="M17 3v3" />
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16" />
    </svg>
  )
}

function CrmIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V8a2 2 0 0 1 2-2h7v13" />
      <path d="M13 19V5h5a2 2 0 0 1 2 2v12" />
      <path d="M8 10h1" />
      <path d="M8 13h1" />
      <path d="M16 10h1" />
      <path d="M16 13h1" />
    </svg>
  )
}

export function AppShell() {
  const { broker, logout } = useAuth()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const initials = (broker?.full_name ?? broker?.email ?? 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  useEffect(() => {
    if (!isUserMenuOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isUserMenuOpen])

  return (
    <div className="app-shell min-h-screen text-ink-900">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[rgba(246,243,237,0.8)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <p className="app-product-wordmark text-[1.18rem] text-ink-950 sm:text-[1.32rem]">Property Voice Agent</p>
          </div>
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((current) => !current)}
              className="app-user-menu-surface flex cursor-pointer items-center gap-3 rounded-full px-2 py-2 text-left text-sm text-ink-700"
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              aria-label="Open account menu"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(47,143,134,0.14)] text-sm text-sea-700">{initials}</span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm text-ink-900">{broker?.full_name ?? 'Guest'}</span>
                <span className="block truncate text-xs text-ink-500">{broker ? 'Signed in' : 'Signed out'}</span>
              </span>
              <svg
                viewBox="0 0 24 24"
                className={[
                  'h-4 w-4 text-ink-500 transition',
                  isUserMenuOpen ? 'rotate-180' : '',
                ].join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {isUserMenuOpen ? (
              <div className="app-user-menu-panel absolute right-0 top-[calc(100%+0.7rem)] w-72 rounded-[1.25rem] p-4 shadow-[0_18px_40px_rgba(24,48,58,0.1)]" role="menu">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(47,143,134,0.14)] text-sm text-sea-700">{initials}</span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sea-600">{broker ? 'Signed in' : 'Signed out'}</p>
                    <p className="truncate text-sm text-ink-950">{broker?.full_name ?? 'No active broker'}</p>
                    <p className="truncate text-xs text-ink-500">{broker?.email ?? 'Sign in required'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false)
                    void logout()
                  }}
                  className="app-button-primary mt-4 w-full px-4 py-2.5"
                >
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6 sm:pt-5 lg:px-8 md:pb-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-[rgba(246,243,237,0.92)] px-2 py-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex min-h-[4rem] flex-col items-center justify-center gap-1 rounded-[1.15rem] px-2 py-2 text-center text-[11px] font-medium leading-tight transition',
                  isActive ? 'bg-[linear-gradient(180deg,#3b9f96_0%,#2f8f86_100%)] text-white shadow-[0_10px_24px_rgba(47,143,134,0.22)]' : 'text-ink-600 hover:bg-white/80',
                ].join(' ')
              }
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <aside className="app-surface fixed right-6 top-24 hidden w-48 rounded-[1.6rem] p-3 md:block lg:right-8">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'block rounded-2xl px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-[linear-gradient(180deg,#3b9f96_0%,#2f8f86_100%)] text-white' : 'text-ink-700 hover:bg-sand-100',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </aside>
    </div>
  )
}
