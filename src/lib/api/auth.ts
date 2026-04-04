import { apiFetch } from './client'
import type {
  LoginFormRequest,
  LoginRequest,
  LoginResponse,
  PatchProfileRequest,
  RegisterRequest,
  UserProfile,
} from './types'

export async function loginJson(body: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login/json', {
    method: 'POST',
    body,
    skipAuth: true,
  })
}

/** Legacy OAuth2 form endpoint compatibility. */
export async function loginForm(body: LoginFormRequest): Promise<LoginResponse> {
  const form = new URLSearchParams()
  form.set('username', body.username)
  form.set('password', body.password)
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: form,
    skipAuth: true,
  })
}

export async function register(body: RegisterRequest): Promise<UserProfile> {
  return apiFetch<UserProfile>('/auth/register', {
    method: 'POST',
    body,
    skipAuth: true,
  })
}

export async function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/auth/profile')
}

/** Deprecated legacy alias. Prefer getProfile(). */
export async function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/auth/me')
}

export async function patchProfile(body: PatchProfileRequest): Promise<UserProfile> {
  return apiFetch<UserProfile>('/auth/profile', {
    method: 'PATCH',
    body,
  })
}

export async function changeUsername(username: string): Promise<UserProfile> {
  return patchProfile({ username })
}
