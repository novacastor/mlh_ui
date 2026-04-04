import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

type CardProps = HTMLMotionProps<'div'> & {
  children: ReactNode
  glow?: boolean
}

export function Card({ className = '', children, glow, ...props }: CardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`
        rounded-2xl border border-border bg-card/80 p-6 shadow-[var(--shadow-soft)] backdrop-blur-md
        ${glow ? 'shadow-[var(--shadow-glow)]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
}
