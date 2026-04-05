import { Badge } from '../ui/Badge'
import type { LearningSessionStatus } from '../../lib/api/types'

const statusTone: Record<
  string,
  'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger'
> = {
  ready: 'success',
  running: 'warning',
  initializing: 'warning',
  evaluating: 'primary',
  completed: 'accent',
  error: 'danger',
  archived: 'default',
}

type SessionHeaderProps = {
  topic: string
  status: LearningSessionStatus
  phaseLabel?: string
}

export function SessionHeader({ topic, status, phaseLabel }: SessionHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Session</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{topic}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone[status] ?? 'default'}>{status.replace('_', ' ')}</Badge>
        {phaseLabel ? (
          <span className="text-sm text-muted" aria-live="polite">
            {phaseLabel}
          </span>
        ) : null}
      </div>
    </div>
  )
}
