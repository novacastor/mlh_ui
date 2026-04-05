import { apiFetch } from './client'
import type {
  ArchiveSessionResponse,
  ChoicesResponse,
  ContinueRequest,
  ContinueResponse,
  EvaluationResponse,
  LessonResponse,
  LearningStatusResponse,
  NextActionResponse,
  ProgressResponse,
  QuizResponse,
  SessionsListResponse,
  StartLearningRequest,
  StartLearningResponse,
  WorkflowResponse,
} from './types'

export async function listSessions(limit = 20, offset = 0): Promise<SessionsListResponse> {
  const q = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  return apiFetch<SessionsListResponse>(`/learning/sessions?${q}`)
}

export async function startLearning(body: StartLearningRequest): Promise<StartLearningResponse> {
  return apiFetch<StartLearningResponse>('/learning/start', {
    method: 'POST',
    body,
  })
}

export async function archiveSession(sessionId: string): Promise<ArchiveSessionResponse> {
  return apiFetch<ArchiveSessionResponse>(`/learning/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  })
}

export async function getStatus(sessionId: string): Promise<LearningStatusResponse> {
  return apiFetch<LearningStatusResponse>(`/learning/${encodeURIComponent(sessionId)}/status`)
}

export async function getLesson(sessionId: string, nodeId?: string): Promise<LessonResponse> {
  const q = nodeId ? `?${new URLSearchParams({ node_id: nodeId }).toString()}` : ''
  return apiFetch<LessonResponse>(`/learning/${encodeURIComponent(sessionId)}/lesson${q}`)
}

export async function getQuiz(sessionId: string): Promise<QuizResponse> {
  return apiFetch<QuizResponse>(`/learning/${encodeURIComponent(sessionId)}/quiz`)
}

export async function getEvaluation(sessionId: string): Promise<EvaluationResponse> {
  return apiFetch<EvaluationResponse>(`/learning/${encodeURIComponent(sessionId)}/evaluation`)
}

export async function getNextAction(sessionId: string): Promise<NextActionResponse> {
  return apiFetch<NextActionResponse>(`/learning/${encodeURIComponent(sessionId)}/next-action`)
}

export async function getChoices(sessionId: string): Promise<ChoicesResponse> {
  return apiFetch<ChoicesResponse>(`/learning/${encodeURIComponent(sessionId)}/choices`)
}

export async function getWorkflow(sessionId: string): Promise<WorkflowResponse> {
  return apiFetch<WorkflowResponse>(`/learning/${encodeURIComponent(sessionId)}/workflow`)
}

export async function postContinue(
  sessionId: string,
  body: ContinueRequest = {},
): Promise<ContinueResponse> {
  return apiFetch<ContinueResponse>(`/learning/${encodeURIComponent(sessionId)}/continue`, {
    method: 'POST',
    body,
  })
}

export async function getProgress(sessionId: string): Promise<ProgressResponse> {
  return apiFetch<ProgressResponse>(`/learning/${encodeURIComponent(sessionId)}/progress`)
}
