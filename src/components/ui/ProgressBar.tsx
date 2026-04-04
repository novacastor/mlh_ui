import { motion } from 'framer-motion'

type ProgressBarProps = {
  value: number
  className?: string
  'aria-label'?: string
}

export function ProgressBar({ value, className = '', ...props }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value * 100))
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-white/10 ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
