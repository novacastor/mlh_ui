import { motion } from 'framer-motion'
import type { LearningStatusResponse, NextActionResponse, ProgressResponse } from '../../lib/api/types'
import { Button } from '../ui/Button'

type ProgressOverlayProps = {
  progress: ProgressResponse | undefined
  status: LearningStatusResponse | undefined
  nextAction: NextActionResponse | undefined
  isMutating: boolean
  onOpenRequiredInputPanel: () => void
  onContinue: () => void
  onTakeRecommended: () => void
}

function actionLabel(nextAction: NextActionResponse | undefined): string {
  if (!nextAction) return 'Continue'
  if (nextAction.required_input === 'answers') return 'Open quiz'
  if (nextAction.required_input === 'selected_node') return 'Choose branch'
  if (nextAction.required_input === 'selected_node' && nextAction.recommended_node) {
    return `Take ${nextAction.recommended_node}`
  }
  if (nextAction.action === 'wait') return 'Waiting for backend'
  return 'Continue'
}

export function ProgressOverlay({
  progress,
  status,
  nextAction,
  isMutating,
  onOpenRequiredInputPanel,
  onContinue,
  onTakeRecommended,
}: ProgressOverlayProps) {
  const progressPct = Math.round((progress?.overall_progress ?? 0) * 100)
  const processing =
    status?.status === 'initializing' || status?.status === 'running' || status?.status === 'evaluating'
  const shouldTakeRecommended =
    nextAction?.required_input === 'selected_node' && !!nextAction.recommended_node
  const requiresPanelInput =
    nextAction?.required_input === 'answers' || nextAction?.required_input === 'selected_node'

  const handlePrimaryAction = () => {
    if (requiresPanelInput) {
      onOpenRequiredInputPanel()
      return
    }
    if (shouldTakeRecommended) {
      onTakeRecommended()
      return
    }
    onContinue()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="pointer-events-none absolute left-1/2 top-3 z-20 w-[calc(100%-1rem)] -translate-x-1/2 md:left-4 md:top-4 md:w-[min(460px,calc(100%-1.75rem))] md:translate-x-0"
    >
      <div className="pointer-events-auto rounded-xl border border-border/80 bg-background/75 p-3 shadow-[var(--shadow-soft)] backdrop-blur-xl md:rounded-2xl md:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Journey</p>
            <h2 className="mt-1 text-sm font-semibold text-foreground md:text-base">
              {progress?.topic ?? 'Learning graph'}
            </h2>
            <p className="mt-1 hidden text-xs text-muted md:block">
              {status?.status ?? 'loading'} {status?.current_phase ? `• ${status.current_phase}` : ''}
            </p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-xs font-medium">
            {progressPct}%
          </span>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-success transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className="mt-2 hidden text-sm text-foreground/90 md:block">
          {nextAction?.message ?? 'Syncing session intent...'}
        </p>
        {nextAction?.can_go_back && nextAction.previous_node ? (
          <p className="mt-2 hidden text-xs text-muted md:block">
            Backtrack available: <span className="text-foreground">{nextAction.previous_node}</span>
          </p>
        ) : null}

        <div className="mt-3 flex justify-end md:mt-4">
          <Button
            variant="primary"
            disabled={processing}
            isLoading={isMutating}
            className="w-full md:w-auto"
            onClick={handlePrimaryAction}
          >
            {processing ? 'Processing...' : actionLabel(nextAction)}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
