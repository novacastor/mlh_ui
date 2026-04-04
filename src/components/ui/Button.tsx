import { forwardRef, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

const variants = {
  primary:
    'bg-primary text-primary-foreground shadow-[var(--shadow-soft)] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-primary/50',
  secondary:
    'bg-card-elevated text-foreground border border-border hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-primary/30',
  ghost: 'text-muted hover:text-foreground hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-primary/30',
  danger: 'bg-danger/90 text-white hover:bg-danger focus-visible:ring-2 focus-visible:ring-danger/50',
}

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children?: ReactNode
  variant?: keyof typeof variants
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = '', variant = 'primary', isLoading, disabled, children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium
        transition-colors duration-200 disabled:pointer-events-none disabled:opacity-45
        ${variants[variant]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </motion.button>
  )
})
