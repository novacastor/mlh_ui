import type { LearningStatusResponse, NextActionResponse } from './api/types'

export type SessionView =
  | 'error'
  | 'processing_graph'
  | 'processing_eval'
  | 'complete'
  | 'quiz'
  | 'branch'
  | 'evaluation'
  | 'lesson'

export function resolveSessionView(
  status: LearningStatusResponse | undefined,
  nextAction: NextActionResponse | undefined,
  options: {
    hasEvaluation: boolean
  },
): SessionView {
  if (!status) return 'processing_graph'

  if (status.status === 'error') return 'error'
  if (status.status === 'completed') return 'complete'

  if (status.status === 'initializing' || status.status === 'running') {
    return 'processing_graph'
  }

  if (status.status === 'evaluating') {
    return 'processing_eval'
  }

  if (status.status !== 'ready') {
    return 'processing_graph'
  }

  const na = nextAction
  const action = (na?.action ?? '').toLowerCase()
  const req = na?.required_input

  // Study the lesson first; avoid matching substrings like "…quiz…" in other action names.
  if (status.current_phase === 'lesson' || status.current_phase === 'root') {
    return 'lesson'
  }

  const waitingEval = na?.waiting_on?.includes('evaluator')
  const quizReady =
    req === 'answers' || waitingEval || action === 'take_quiz' || action === 'submit_quiz'
  if (quizReady) {
    return 'quiz'
  }

  const branchReady = req === 'selected_node' || action === 'choose_branch'
  if (branchReady) {
    return 'branch'
  }

  if (
    options.hasEvaluation &&
    (action.includes('eval') ||
      action.includes('result') ||
      action === 'review' ||
      na?.waiting_on?.includes('evaluator'))
  ) {
    return 'evaluation'
  }

  if (options.hasEvaluation && na?.message?.toLowerCase().includes('evaluation')) {
    return 'evaluation'
  }

  return 'lesson'
}
