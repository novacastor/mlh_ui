import { motion } from 'framer-motion'
import { Card } from '../ui/Card'

type ProcessingBannerProps = {
  title: string
  description: string
  mode?: 'graph' | 'eval'
}

export function ProcessingBanner({ title, description, mode = 'graph' }: ProcessingBannerProps) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/20 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-6 py-10 text-center md:py-14">
        <div className="relative size-16">
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          <motion.span
            className="absolute inset-2 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-primary">
            {mode === 'eval' ? '✓' : '◆'}
          </span>
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm leading-relaxed text-muted">{description}</p>
        </div>
        <p className="text-xs text-muted" aria-live="polite">
          This usually takes a few seconds…
        </p>
      </div>
    </Card>
  )
}
