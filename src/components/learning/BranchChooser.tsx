import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { NextActionResponse } from '../../lib/api/types'

type BranchChooserProps = {
  nextAction: NextActionResponse
  onChoose: (payload: { selected_node?: string; traversal_mode?: string }) => void
  isSubmitting: boolean
}

export function BranchChooser({ nextAction, onChoose, isSubmitting }: BranchChooserProps) {
  const [mode, setMode] = useState(nextAction.traversal_mode || 'bfs')
  const [selected, setSelected] = useState<string | null>(nextAction.recommended_node ?? null)

  const options = nextAction.options ?? []

  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-widest text-muted">Choose your path</p>
      <p className="mt-2 text-sm text-muted">{nextAction.message}</p>

      {nextAction.recommendation_reason ? (
        <div className="mt-4 rounded-xl border border-accent/25 bg-accent-muted px-4 py-3 text-sm text-foreground">
          <span className="font-medium text-accent">Recommended: </span>
          {nextAction.recommended_node ?? 'Auto'}
          <span className="mt-1 block text-xs text-muted">{nextAction.recommendation_reason}</span>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {(['bfs', 'dfs'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`
              rounded-lg px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition
              ${
                mode === m
                  ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                  : 'bg-white/5 text-muted hover:text-foreground'
              }
            `}
          >
            {m}
          </button>
        ))}
      </div>

      <ul className="mt-6 space-y-2">
        {options.map((opt) => (
          <motion.li key={opt} layout>
            <button
              type="button"
              onClick={() => setSelected(opt)}
              className={`
                flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition
                ${
                  selected === opt
                    ? 'border-primary bg-primary/15 shadow-[var(--shadow-glow)]'
                    : 'border-border bg-white/[0.03] hover:border-primary/35'
                }
              `}
            >
              {opt}
              {nextAction.recommended_node === opt ? (
                <span className="text-xs text-accent">Suggested</span>
              ) : null}
            </button>
          </motion.li>
        ))}
      </ul>

      {nextAction.can_go_back && nextAction.previous_node ? (
        <p className="mt-4 text-xs text-muted">
          Previous: <span className="text-foreground">{nextAction.previous_node}</span>
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-end gap-2">
        <Button
          variant="secondary"
          disabled={isSubmitting}
          onClick={() => onChoose({ traversal_mode: mode })}
        >
          Use recommended
        </Button>
        <Button
          disabled={isSubmitting || !selected}
          isLoading={isSubmitting}
          onClick={() => selected && onChoose({ selected_node: selected, traversal_mode: mode })}
        >
          Continue
        </Button>
      </div>
    </Card>
  )
}
