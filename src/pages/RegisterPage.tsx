import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../lib/api/types'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register({
        email,
        password,
        username: username.trim() || undefined,
      })
      toast.success('Account ready')
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed'
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
          <div className="border-b border-border/70 bg-[linear-gradient(140deg,oklch(0.24_0.08_175_/_0.35),oklch(0.19_0.05_265_/_0.35))] px-6 py-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Get started</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create account</h1>
            <p className="mt-1 text-sm text-foreground/85">Spin up your first learning graph in under a minute.</p>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Username (optional)"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button type="submit" className="w-full" isLoading={loading}>
              Register
            </Button>
          </form>
          <div className="mt-5 rounded-xl border border-border/70 bg-card/45 p-3 text-xs text-muted">
            `username` is optional.
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
          </div>
        </Card>
      </motion.div>
    </AppShell>
  )
}
