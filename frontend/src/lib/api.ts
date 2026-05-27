const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function formatApiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') {
    return fallback
  }

  const candidate = (body as { detail?: unknown; message?: unknown }).detail ?? (body as { message?: unknown }).message
  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate
  }

  if (Array.isArray(candidate)) {
    const messages = candidate
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null
        }
        const entry = item as { loc?: unknown; msg?: unknown }
        const location = Array.isArray(entry.loc) ? entry.loc.slice(1).join('.') : ''
        const message = typeof entry.msg === 'string' ? entry.msg : ''
        if (!message) {
          return null
        }
        return location ? `${location}: ${message}` : message
      })
      .filter((message): message is string => Boolean(message))

    if (messages.length) {
      return messages.join('\n')
    }
  }

  return fallback
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = window.localStorage.getItem('pva_token')
  const headers = new Headers(init.headers)

  if (!(init.body instanceof FormData) && init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = response.statusText || 'Request failed'
    try {
      const body = await response.json()
      message = formatApiErrorMessage(body, message)
    } catch {
      const text = await response.text()
      if (text) {
        message = text
      }
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
