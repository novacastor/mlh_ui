import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { Skeleton } from '../ui/Skeleton'
import type { ProgressResponse } from '../../lib/api/types'

function statusTone(s: string): 'default' | 'primary' | 'accent' | 'success' | 'warning' {
  if (s === 'mastered') return 'success'
  if (s === 'active') return 'primary'
  if (s === 'unlocked') return 'accent'
  return 'default'
}

type ProgressSyllabusProps = {
  data: ProgressResponse | undefined
  isLoading: boolean
}

export function ProgressSyllabus({ data, isLoading }: ProgressSyllabusProps) {
  if (isLoading || !data) {
    return (
      <Card className="h-fit p-5">
        <Skeleton className="mb-4 h-4 w-32" />
        <Skeleton className="mb-6 h-2 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="mt-2 h-10 w-full" />
      </Card>
    )
  }

  return (
    <Card className="h-fit p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">Journey</h3>
        <span className="text-xs text-muted">
          {Math.round(data.overall_progress * 100)}% overall
        </span>
      </div>
      <ProgressBar value={data.overall_progress} className="mb-6" aria-label="Overall progress" />
      <ul className="space-y-2">
        {data.subtopics.map((st, i) => (
          <motion.li
            key={`${st.name}-${i}`}
            layout
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-white/[0.03] px-3 py-2.5"
          >
            <span className="min-w-0 flex-1 truncate text-sm">{st.name}</span>
            <Badge tone={statusTone(st.status)}>{st.status}</Badge>
          </motion.li>
        ))}
      </ul>
    </Card>
  )
}
