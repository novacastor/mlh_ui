import type { HTMLAttributes } from 'react'

export function Skeleton({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/5 ${className}`}
      role="presentation"
      {...props}
    />
  )
}
