/** API DTOs aligned with Cognimap backend */

export type LearningSessionStatus =
  | 'initializing'
  | 'running'
  | 'ready'
  | 'evaluating'
  | 'completed'
  | 'error'

export type CurrentPhase = 'root' | 'lesson' | 'evaluator' | 'advancing' | 'completed'

export interface LoginRequest {
  email: string
  password: string
}

/** OAuth2 form compatibility for /auth/login. */
export interface LoginFormRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface RegisterRequest {
  email: string
  password: string
  username?: string
}

export interface UserProfile {
  id: number
  email: string
  username: string
  created_at: string
}

export interface PatchProfileRequest {
  username: string
}

export interface StartLearningRequest {
  topic: string
  course_mode?: string
  traversal_mode?: 'dfs' | 'bfs'
}

export interface StartLearningResponse {
  session_id: string
  message: string
}

export interface SessionListItem {
  session_id: string
  topic: string
  status: string
  created_at: string
  overall_progress: number
}

export interface SessionsListResponse {
  total: number
  sessions: SessionListItem[]
}

export interface LearningStatusResponse {
  session_id: string
  topic: string
  status: LearningSessionStatus
  current_phase: CurrentPhase
}

export interface TutorContent {
  learning_objective: string
  explanation: string
  examples: string[]
  common_misconception: string
  practice_task: string
  code_snippet?: string
}

export interface CuratorArticle {
  title: string
  url: string
  description?: string
}

export interface CuratorVideo {
  title?: string
  url: string
  description?: string
}

export interface CuratorCourse {
  title?: string
  url?: string
  description?: string
}

export interface CuratorContent {
  articles: CuratorArticle[]
  videos: CuratorVideo[]
  courses?: CuratorCourse[]
  references?: string[]
}

export interface LessonResponse {
  session_id: string
  node_id: string
  is_remediation: boolean
  parent_node_id: string | null
  depth: number
  node_kind: string
  path_from_root: string[]
  is_math_heavy: boolean
  is_expanded: boolean
  tutor_content: TutorContent
  curator_content: CuratorContent
}

export interface QuizQuestion {
  question_id: string
  question: string
  options: string[]
}

export interface QuizResponse {
  session_id: string
  node_id: string
  question_count?: number
  numerical_target_ratio?: number
  actual_numerical_ratio?: number
  questions: QuizQuestion[]
}

export interface EvaluateRequest {
  answers: number[]
}

export interface EvaluateAckResponse {
  status: string
  message: string
}

export interface QuestionResult {
  question_id: string
  question: string
  options: string[]
  correct_index: number
  user_index: number
  is_correct: boolean
}

export type EvaluationNextAction = 'next_topic' | 'remediation' | 'completed'

export interface EvaluationResponse {
  score: number
  weak_areas: string[]
  feedback: string
  passed: boolean
  next_action: EvaluationNextAction
  question_count?: number
  numerical_target_ratio?: number
  actual_numerical_ratio?: number
  question_results: QuestionResult[]
}

export interface NodeHierarchyMeta {
  parent_node_id: string | null
  depth: number
  node_kind: string
  path_from_root: string[]
  is_math_heavy: boolean
  is_expanded: boolean
}

export interface NextActionResponse {
  session_id: string
  action: string
  status: string
  message: string
  current_node: string | null
  waiting_on: string[]
  options: string[]
  traversal_mode: 'bfs' | 'dfs' | string
  journey_mode: string
  can_go_back: boolean
  previous_node: string | null
  recommended_node: string | null
  recommendation_reason: string | null
  recommendation_factors: Record<string, number> | null
  required_input: string | null
  parent_node_id?: string | null
  depth?: number
  node_kind?: string
  path_from_root?: string[]
  is_math_heavy?: boolean
  is_expanded?: boolean
  option_metadata?: Record<string, NodeHierarchyMeta>
}

export interface ChoicesResponse {
  session_id: string
  current_node: string | null
  traversal_mode: string
  journey_mode: string
  can_go_back: boolean
  previous_node: string | null
  options: string[]
  waiting_on: string[]
  recommended_node: string | null
  recommendation_reason: string | null
  recommendation_factors: Record<string, number> | null
  parent_node_id?: string | null
  depth?: number
  node_kind?: string
  path_from_root?: string[]
  is_math_heavy?: boolean
  is_expanded?: boolean
}

export interface ContinueRequest {
  answers?: number[]
  selected_node?: string
  traversal_mode?: string
  client_request_id?: string
}

export type ContinueRequestStatus = 'accepted' | 'needs_input' | string

export interface ContinueResponse {
  session_id: string
  status: string
  action: string
  message: string
  enqueued: boolean
  options: string[]
  recommended_node: string | null
  recommendation_reason: string | null
  recommendation_factors: Record<string, number> | null
  request_status: ContinueRequestStatus
  request_id: string | null
  required_input: string | null
  parent_node_id?: string | null
  depth?: number
  node_kind?: string
  path_from_root?: string[]
  is_math_heavy?: boolean
  is_expanded?: boolean
  option_metadata?: Record<string, NodeHierarchyMeta>
}

export interface ProgressSubtopic {
  name: string
  status: string
  score: number | null
  attempts: number
  parent_node_id?: string | null
  depth?: number
  node_kind?: string
  path_from_root?: string[]
  is_math_heavy?: boolean
  is_expanded?: boolean
}

export interface ProgressNodeCatalogItem extends NodeHierarchyMeta {
  node_id: string
  status: string
  score: number | null
  attempts: number
}

export interface WorkflowNodeCatalogItem extends NodeHierarchyMeta {
  node_id: string
  status: string
  score: number | null
  attempts: number
}

export interface WorkflowResponse {
  session_id: string
  status: LearningSessionStatus | string
  current_phase: CurrentPhase | string
  topic: string
  current_node: string | null
  journey_mode: string
  traversal_mode: string
  waiting_on: string[]
  next_action: string
  options: string[]
  recommended_node: string | null
  recommendation_reason?: string | null
  recommendation_factors?: Record<string, number> | null
  lesson_ready: boolean
  quiz_ready: boolean
  evaluation_ready: boolean
  quiz_question_count?: number
  numerical_target_ratio?: number
  actual_numerical_ratio?: number
  active_frontier: string[]
  current_path: string[]
  children_map: Record<string, string[]>
  node_catalog: WorkflowNodeCatalogItem[]
}

export interface ProgressHistoryEntry {
  type: string
  subtopic?: string
  lesson?: unknown
  score?: number
  weak_areas?: string[]
  feedback?: string
  passed?: boolean
}

export interface ProgressResponse {
  session_id: string
  topic: string
  status: string
  current_node: string | null
  traversal_mode?: string
  overall_progress: number
  completed_count: number
  total_count: number
  subtopics: ProgressSubtopic[]
  active_frontier?: string[]
  current_path?: string[]
  children_map?: Record<string, string[]>
  node_catalog?: ProgressNodeCatalogItem[]
  history: ProgressHistoryEntry[]
}

export interface ArchiveSessionResponse {
  status: string
  session_id: string
}

export interface ApiErrorDetail {
  code?: string
  message?: string
  suggestions?: string[]
}

export class ApiError extends Error {
  status: number
  detail?: ApiErrorDetail | string | unknown

  constructor(message: string, status: number, detail?: ApiErrorDetail | string | unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export interface StreamMessage {
  type: string
  node?: string
  data?: unknown
}
