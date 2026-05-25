import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from './AuthProvider'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { broker, isHydrating } = useAuth()
  const location = useLocation()

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50 px-6 text-ink-900">
        <div className="rounded-3xl border border-black/5 bg-white px-6 py-5 text-sm shadow-soft">
          Restoring broker session...
        </div>
      </div>
    )
  }

  if (!broker) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
