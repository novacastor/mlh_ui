import { createContext } from 'react'
import type { LoginRequest, RegisterRequest, UserProfile } from '../lib/api/types'

export type AuthContextValue = {
  token: string | null
  user: UserProfile | undefined
  isAuthenticated: boolean
  isLoading: boolean
  login: (req: LoginRequest) => Promise<void>
  register: (req: RegisterRequest) => Promise<void>
  changeUsername: (username: string) => Promise<UserProfile>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
