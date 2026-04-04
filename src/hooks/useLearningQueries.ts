import { useQuery } from '@tanstack/react-query'
import * as learning from '../lib/api/learning'
import type { LearningSessionStatus } from '../lib/api/types'
import { learningKeys } from '../lib/queryKeys'

function shouldPollStatus(status: LearningSessionStatus | undefined): boolean {
  if (!status) return true
  return ['initializing', 'running', 'evaluating'].includes(status)
}

export function useLearningStatus(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionId ? learningKeys.status(sessionId) : ['learning', 'status', 'noop'],
    queryFn: () => learning.getStatus(sessionId!),
    enabled: !!sessionId,
    refetchInterval: (q) => {
      const s = q.state.data?.status
      return shouldPollStatus(s) ? 2800 : false
    },
  })
}

export function useNextAction(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: sessionId ? learningKeys.nextAction(sessionId) : ['learning', 'nextAction', 'noop'],
    queryFn: () => learning.getNextAction(sessionId!),
    enabled: !!sessionId && enabled,
  })
}

export function useChoices(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: sessionId ? learningKeys.choices(sessionId) : ['learning', 'choices', 'noop'],
    queryFn: () => learning.getChoices(sessionId!),
    enabled: !!sessionId && enabled,
  })
}

export function useWorkflow(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: sessionId ? learningKeys.workflow(sessionId) : ['learning', 'workflow', 'noop'],
    queryFn: () => learning.getWorkflow(sessionId!),
    enabled: !!sessionId && enabled,
  })
}

export function useLesson(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: sessionId ? learningKeys.lesson(sessionId) : ['learning', 'lesson', 'noop'],
    queryFn: () => learning.getLesson(sessionId!),
    enabled: !!sessionId && enabled,
  })
}

export function useQuiz(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: sessionId ? learningKeys.quiz(sessionId) : ['learning', 'quiz', 'noop'],
    queryFn: () => learning.getQuiz(sessionId!),
    enabled: !!sessionId && enabled,
  })
}

export function useEvaluation(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: sessionId ? learningKeys.evaluation(sessionId) : ['learning', 'evaluation', 'noop'],
    queryFn: () => learning.getEvaluation(sessionId!),
    enabled: !!sessionId && enabled,
    retry: false,
  })
}

export function useProgress(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: sessionId ? learningKeys.progress(sessionId) : ['learning', 'progress', 'noop'],
    queryFn: () => learning.getProgress(sessionId!),
    enabled: !!sessionId && enabled,
  })
}

export function useSessionsList(enabled = true) {
  return useQuery({
    queryKey: learningKeys.sessions(),
    queryFn: () => learning.listSessions(),
    enabled,
  })
}
