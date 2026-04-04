import { ApiError } from './types'

const TOKEN_KEY = 'cognimap_token'

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (!base) {
    console.warn('VITE_API_BASE_URL is not set')
    return ''
  }
  return base.replace(/\/$/, '')
}

/**
 * WebSocket URL for the learning stream. Supports absolute API origins and
 * relative bases (e.g. `/api` with Vite dev proxy).
 */
export function getLearningStreamUrl(sessionId: string, token: string): string {
  const base = getApiBaseUrl()
  const path = `/learning/${encodeURIComponent(sessionId)}/stream`
  const qs = `token=${encodeURIComponent(token)}`

  if (base.startsWith('http://') || base.startsWith('https://')) {
    const u = new URL(base)
    const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProto}//${u.host}${path}?${qs}`
  }

  // Relative base e.g. `/api` — connect through the same host as the page (Vite proxy handles WS).
  if (typeof window === 'undefined') {
    return `ws://localhost${base}${path}?${qs}`
  }
  const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const prefix = base.startsWith('/') ? base : `/${base}`
  return `${wsProto}//${window.location.host}${prefix}${path}?${qs}`
}

type FetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  token?: string | null
  skipAuth?: boolean
}

function isRawBody(value: unknown): value is BodyInit {
  if (value == null) return false
  if (typeof value === 'string') return true
  if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) return true
  if (typeof FormData !== 'undefined' && value instanceof FormData) return true
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) return true
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(value)) return true
  return false
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, token, skipAuth, headers: initHeaders, ...rest } = options
  const base = getApiBaseUrl()
  if (!path.startsWith('http') && !base) {
    throw new ApiError(
      'VITE_API_BASE_URL is not set. Add it to .env (e.g. VITE_API_BASE_URL=/api for local dev).',
      0,
    )
  }
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`

  const headers = new Headers(initHeaders)
  const rawBody = isRawBody(body)
  if (body !== undefined && !rawBody) {
    headers.set('Content-Type', 'application/json')
  }
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
    headers.set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8')
  }

  if (!skipAuth) {
    const authToken = token ?? getStoredToken()
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`)
    }
  }

  let res: Response
  try {
    res = await fetch(url, {
      ...rest,
      headers,
      body: body === undefined ? undefined : rawBody ? body : JSON.stringify(body),
    })
  } catch (e) {
    const msg =
      e instanceof TypeError
        ? `Network error (${url}). If the API is on another port, set VITE_API_BASE_URL=/api and run Vite with the dev proxy, or enable CORS on the server.`
        : 'Network request failed'
    throw new ApiError(msg, 0, e)
  }

  const contentType = res.headers.get('content-type')
  const isJson = contentType?.includes('application/json')

  if (!res.ok) {
    let detail: unknown
    if (isJson) {
      try {
        detail = await res.json()
      } catch {
        detail = undefined
      }
    }
    const message = (extractErrorMessage(detail) ?? res.statusText) || 'Request failed'
    throw new ApiError(message, res.status, detail)
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }

  if (isJson) {
    return (await res.json()) as T
  }

  return (await res.text()) as unknown as T
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const d = 'detail' in payload ? (payload as { detail: unknown }).detail : payload
  if (typeof d === 'string') return d
  if (d && typeof d === 'object' && 'message' in d) {
    return String((d as { message: string }).message)
  }
  return null
}
