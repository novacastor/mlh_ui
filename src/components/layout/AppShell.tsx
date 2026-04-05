import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../ui/Button'

type AppShellProps = {
  children: ReactNode
  title?: string
  actions?: ReactNode
  fullBleed?: boolean
}

export function AppShell({ children, title, actions, fullBleed = false }: AppShellProps) {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-40 border-b border-border/80 bg-[linear-gradient(180deg,oklch(0.14_0.03_270_/_0.95),oklch(0.13_0.02_270_/_0.86))] backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 md:px-8">
          <Link to="/" className="group flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 text-sm font-bold text-foreground shadow-[var(--shadow-soft)] ring-1 ring-white/10 transition group-hover:ring-primary/40">
              C
            </span>
            <span className="text-sm font-semibold tracking-tight">Cognimap</span>
          </Link>
          <div className="flex items-center gap-3">
            {title ? (
              <span className="hidden text-sm text-muted sm:inline">{title}</span>
            ) : null}
            {actions}
            {isAuthenticated && user ? (
              <>
                <span className="hidden text-sm text-muted md:inline">{user.username ?? user.email}</span>
                <Button variant="ghost" className="!px-3 !py-2 text-xs" onClick={() => logout()}>
                  Sign out
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="secondary" className="!px-4 !py-2 text-xs">
                  Sign in
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.header>
      <main
        className={
          fullBleed
            ? 'w-full flex-1 px-0 py-0'
            : 'mx-auto w-full max-w-[1200px] flex-1 px-6 py-10 md:px-8'
        }
      >
        {children}
      </main>
    </div>
  )
}
