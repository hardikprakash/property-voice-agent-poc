import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { apiFetch, ApiError } from '../lib/api'
import type { AuthSession, BrokerRead } from '../types'

type Credentials = {
  email: string
  password: string
}

type RegisterPayload = Credentials & {
  full_name: string
}

type AuthContextValue = {
  broker: BrokerRead | null
  token: string | null
  isHydrating: boolean
  login: (credentials: Credentials) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
}

const TOKEN_KEY = 'pva_token'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function submitAuth(path: '/api/auth/login' | '/api/auth/register', body: Credentials | RegisterPayload): Promise<AuthSession> {
  return apiFetch<AuthSession>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [broker, setBroker] = useState<BrokerRead | null>(null)
  const [isHydrating, setIsHydrating] = useState(true)

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = window.localStorage.getItem(TOKEN_KEY)
      if (!storedToken) {
        setIsHydrating(false)
        return
      }

      window.localStorage.setItem(TOKEN_KEY, storedToken)
      setToken(storedToken)

      try {
        const me = await apiFetch<BrokerRead>('/api/auth/me')
        setBroker(me)
      } catch (error) {
        window.localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setBroker(null)
        if (error instanceof ApiError && error.status !== 401) {
          console.error(error)
        }
      } finally {
        setIsHydrating(false)
      }
    }

    void bootstrap()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      broker,
      token,
      isHydrating,
      login: async (credentials) => {
        const session = await submitAuth('/api/auth/login', credentials)
        window.localStorage.setItem(TOKEN_KEY, session.access_token)
        setToken(session.access_token)
        setBroker(session.broker)
      },
      register: async (payload) => {
        const session = await submitAuth('/api/auth/register', payload)
        window.localStorage.setItem(TOKEN_KEY, session.access_token)
        setToken(session.access_token)
        setBroker(session.broker)
      },
      logout: async () => {
        try {
          await apiFetch('/api/auth/logout', { method: 'POST' })
        } finally {
          window.localStorage.removeItem(TOKEN_KEY)
          setToken(null)
          setBroker(null)
        }
      },
    }),
    [broker, isHydrating, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
