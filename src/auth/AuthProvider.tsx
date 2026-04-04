import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as authApi from '../lib/api/auth'
import { clearStoredToken, getStoredToken, setStoredToken } from '../lib/api/client'
import type { LoginRequest, RegisterRequest } from '../lib/api/types'
import { ApiError } from '../lib/api/types'
import { authKeys } from '../lib/queryKeys'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => getStoredToken())

  const profileQuery = useQuery({
    queryKey: authKeys.profile,
    queryFn: () => authApi.getProfile(),
    enabled: !!token,
    retry: false,
  })

  useEffect(() => {
    if (!token) {
      queryClient.removeQueries({ queryKey: authKeys.profile })
    }
  }, [token, queryClient])

  useEffect(() => {
    const err = profileQuery.error
    if (err instanceof ApiError && err.status === 401 && token) {
      clearStoredToken()
      queryClient.clear()
      queueMicrotask(() => setToken(null))
    }
  }, [profileQuery.error, token, queryClient])

  const login = useCallback(
    async (req: LoginRequest) => {
      const res = await authApi.loginJson(req)
      setStoredToken(res.access_token)
      setToken(res.access_token)
      await queryClient.invalidateQueries({ queryKey: authKeys.profile })
    },
    [queryClient],
  )

  const register = useCallback(
    async (req: RegisterRequest) => {
      await authApi.register(req)
      await login({ email: req.email, password: req.password })
    },
    [login],
  )

  const changeUsername = useCallback(
    async (username: string) => {
      const updated = await authApi.changeUsername(username)
      queryClient.setQueryData(authKeys.profile, updated)
      return updated
    },
    [queryClient],
  )

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    queryClient.clear()
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user: profileQuery.data,
      isAuthenticated: !!token && !!profileQuery.isSuccess && !!profileQuery.data,
      isLoading: !!token && (profileQuery.isLoading || profileQuery.isFetching),
      login,
      register,
      changeUsername,
      logout,
    }),
    [
      token,
      profileQuery.data,
      profileQuery.isSuccess,
      profileQuery.isLoading,
      profileQuery.isFetching,
      login,
      register,
      changeUsername,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
