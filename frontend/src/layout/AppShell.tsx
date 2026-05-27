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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_33%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.10),_transparent_26%),linear-gradient(180deg,#f7f4ee_0%,#f1ebe2_100%)] text-ink-900">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-sand-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sea-600">Property Voice Agent</p>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-full border border-black/5 bg-white px-4 py-2 text-sm text-ink-700 shadow-sm">
              {broker?.full_name ?? 'Signed in broker'}
            </div>
            <button
              type="button"
              onClick={() => {
                void logout()
              }}
              className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6 lg:px-8 md:pb-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-sand-50/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] font-medium leading-tight transition',
                  isActive ? 'bg-ink-950 text-white shadow-soft' : 'text-ink-700 hover:bg-white',
                ].join(' ')
              }
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <aside className="fixed right-6 top-28 hidden w-44 rounded-3xl border border-black/5 bg-white/85 p-3 shadow-soft backdrop-blur md:block lg:right-8">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'block rounded-2xl px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-sea-500 text-white' : 'text-ink-700 hover:bg-sand-100',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              void logout()
            }}
            className="mt-2 w-full rounded-2xl bg-ink-950 px-3 py-2 text-left text-sm font-medium text-white transition hover:bg-ink-900"
          >
            Sign out
          </button>
        </div>
      </aside>
    </div>
  )
}
