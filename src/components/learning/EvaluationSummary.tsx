import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import type { EvaluationResponse } from '../../lib/api/types'

type EvaluationSummaryProps = {
  evaluation: EvaluationResponse
  onContinue: () => void
  isContinuing: boolean
}

export function EvaluationSummary({ evaluation, onContinue, isContinuing }: EvaluationSummaryProps) {
  const pct = Math.round(evaluation.score * 100)

  return (
    <div className="space-y-6">
      <Card glow>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted">Results</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{pct}%</p>
            <p className="mt-1 text-sm text-muted">{evaluation.feedback}</p>
          </div>
          <Badge tone={evaluation.passed ? 'success' : 'warning'}>
            {evaluation.passed ? 'Passed' : 'Keep practicing'}
          </Badge>
        </div>
        {evaluation.weak_areas?.length ? (
          <div className="mt-6">
            <p className="text-xs font-medium text-muted">Focus areas</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {evaluation.weak_areas.map((w) => (
                <li key={w}>
                  <Badge tone="default">{w}</Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-6 flex justify-end">
          <motion.button
            type="button"
            disabled={isContinuing}
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:brightness-110 disabled:opacity-50"
            whileTap={{ scale: isContinuing ? 1 : 0.98 }}
          >
            {isContinuing ? (
              <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            Continue
          </motion.button>
        </div>
      </Card>

      <Card>
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Question review</p>
        <ul className="mt-4 space-y-4">
          {evaluation.question_results.map((qr) => (
            <li
              key={qr.question_id}
              className="rounded-xl border border-border/60 bg-white/[0.03] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{qr.question}</p>
                <Badge tone={qr.is_correct ? 'success' : 'warning'}>
                  {qr.is_correct ? 'Correct' : 'Incorrect'}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted">
                Your answer: {qr.options[qr.user_index] ?? '—'} · Correct:{' '}
                {qr.options[qr.correct_index]}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
