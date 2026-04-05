import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import type { GraphNodeModel } from '../../lib/learningGraph'

export type LearningNodeData = GraphNodeModel & {
  [key: string]: unknown
  onOpenNode: (nodeId: string) => void
  onDeleteNode?: (nodeId: string) => void
}

function stateLabel(state: GraphNodeModel['visualState']): string {
  if (state === 'active') return 'Active'
  if (state === 'completed') return 'Completed'
  if (state === 'available') return 'Available'
  return 'Locked'
}

function stateClasses(state: GraphNodeModel['visualState']): string {
  if (state === 'active') {
    return 'border-primary/55 bg-[linear-gradient(165deg,oklch(0.24_0.05_262),oklch(0.17_0.03_262))] shadow-[0_0_0_1px_oklch(0.72_0.17_265_/_0.5),0_0_42px_-8px_oklch(0.72_0.17_265_/_0.42)]'
  }
  if (state === 'completed') {
    return 'border-success/35 bg-[linear-gradient(165deg,oklch(0.23_0.04_170),oklch(0.16_0.03_200))]'
  }
  if (state === 'available') {
    return 'border-border/80 bg-[linear-gradient(165deg,oklch(0.21_0.03_260),oklch(0.16_0.02_260))]'
  }
  return 'border-border/45 bg-card/45 opacity-65 saturate-50'
}

export const NodeCard = memo(function NodeCard({ data, selected }: NodeProps) {
  const nodeData = data as LearningNodeData
  const progressPercent = Math.round(nodeData.progressValue * 100)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`
        group relative w-[min(84vw,320px)] rounded-2xl border p-3.5 text-left backdrop-blur-md transition sm:w-[320px] sm:p-4
        ${stateClasses(nodeData.visualState)}
        ${selected ? 'ring-2 ring-accent/55' : ''}
      `}
      onClick={() => nodeData.onOpenNode(nodeData.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          nodeData.onOpenNode(nodeData.id)
        }
      }}
    >
        <Handle
        type="target"
        id={`${nodeData.id}-in`}
        position={Position.Left}
        className="!size-2.5 !border-border !bg-card-elevated"
      />
      <Handle
        type="source"
        id={`${nodeData.id}-out`}
        position={Position.Right}
        className="!size-2.5 !border-border !bg-card-elevated"
      />

      {nodeData.isRecommended ? (
        <span className="absolute -right-2 -top-2 rounded-full border border-accent/55 bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
          Recommended
        </span>
      ) : null}

      {nodeData.onDeleteNode ? (
        <button
          type="button"
          className="absolute right-2 top-2 rounded-md border border-danger/35 bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-danger opacity-0 transition hover:bg-danger/20 group-hover:opacity-100"
          onClick={(event) => {
            event.stopPropagation()
            nodeData.onDeleteNode?.(nodeData.id)
          }}
          onKeyDown={(event) => event.stopPropagation()}
          aria-label={`Delete ${nodeData.id}`}
        >
          Delete
        </button>
      ) : null}

      {nodeData.isFrontier ? (
        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-accent/40 graph-pulse" />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{nodeData.nodeKind}</p>
          <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-tight text-foreground">
            {nodeData.id}
          </h3>
        </div>
        <span className="rounded-full border border-white/12 bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
          {stateLabel(nodeData.visualState)}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted">Learning</p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-foreground/85">
            {nodeData.learningSnippet}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.1em] text-muted">Quiz</p>
          <p className="mt-1 text-xs text-foreground/80">{nodeData.quizLabel}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>Progress</span>
          <span className="font-medium text-foreground/90">{progressPercent}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/85 via-accent/80 to-success/85 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </motion.div>
  )
})
