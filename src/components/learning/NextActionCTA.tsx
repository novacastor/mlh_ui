import { motion } from 'framer-motion'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { NextActionResponse } from '../../lib/api/types'

type NextActionCTAProps = {
  nextAction: NextActionResponse | undefined
  onContinueLesson: () => void
  isLoading: boolean
}

/** Secondary context strip for the current backend-driven action. */
export function NextActionCTA({ nextAction, onContinueLesson, isLoading }: NextActionCTAProps) {
  if (!nextAction) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="border-primary/20 bg-primary/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary">Next step</p>
            <p className="mt-1 text-sm text-foreground">{nextAction.message}</p>
            {nextAction.current_node ? (
              <p className="mt-1 text-xs text-muted">Node: {nextAction.current_node}</p>
            ) : null}
          </div>
          <Button variant="primary" isLoading={isLoading} onClick={onContinueLesson}>
            Continue
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
