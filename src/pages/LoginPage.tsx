import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../lib/api/types'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login({ email, password })
      toast.success('Welcome back')
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Sign in failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-md"
      >
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border/70 bg-[linear-gradient(140deg,oklch(0.24_0.08_265_/_0.45),oklch(0.2_0.05_175_/_0.25))] px-6 py-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Welcome back</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-foreground/85">Pick up right where your adaptive path left off.</p>
          </div>
          <div className="px-6 py-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" isLoading={loading}>
              Continue
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            No account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
          </div>
        </Card>
      </motion.div>
    </AppShell>
  )
}
