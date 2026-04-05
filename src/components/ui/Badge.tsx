import type { HTMLAttributes, ReactNode } from 'react'

const tones: Record<string, string> = {
  default: 'bg-white/5 text-muted border border-border',
  primary: 'bg-primary/15 text-primary border border-primary/25',
  accent: 'bg-accent-muted text-accent border border-accent/20',
  success: 'bg-success/15 text-success border border-success/25',
  warning: 'bg-amber-500/15 text-amber-200 border border-amber-500/25',
  danger: 'bg-danger/15 text-danger border border-danger/30',
}

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode
  tone?: keyof typeof tones
}

export function Badge({ className = '', children, tone = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
