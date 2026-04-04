import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from './auth/useAuth'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { SessionPage } from './pages/SessionPage'
import { SessionsPage } from './pages/SessionsPage'

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<SessionsPage />} />
          <Route path="/sessions/:sessionId" element={<SessionPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          classNames: {
            toast: 'bg-card border border-border text-foreground',
          },
        }}
      />
    </>
  )
}
