import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '../ui/Button'
import type {
  EvaluationResponse,
  LearningStatusResponse,
  LessonResponse,
  NextActionResponse,
  ProgressResponse,
  QuizResponse,
} from '../../lib/api/types'
import type { GraphNodeModel } from '../../lib/learningGraph'
import { QuizComponent } from './QuizComponent'

type ExpandedNodePanelProps = {
  node: GraphNodeModel | null
  lesson: LessonResponse | undefined
  progress: ProgressResponse | undefined
  quiz: QuizResponse | undefined
  evaluation: EvaluationResponse | undefined
  status: LearningStatusResponse | undefined
  nextAction: NextActionResponse | undefined
  isSubmitting: boolean
  onClose: () => void
  onContinue: () => void
  onSubmitQuiz: (answers: number[]) => void
  onChooseBranch: (payload: { selected_node?: string; traversal_mode?: string }) => void
}

type PanelArticle = {
  title: string
  url: string
  description?: string
}

type PanelVideo = {
  title?: string
  url: string
  description?: string
}

type PanelLesson = {
  source: 'live' | 'history'
  learningObjective: string
  explanation: string
  examples: string[]
  commonMisconception: string
  practiceTask: string
  codeSnippet?: string
  articles: PanelArticle[]
  videos: PanelVideo[]
  references: string[]
}

type PanelEvaluation = {
  score: number | null
  feedback: string
  passed: boolean | null
  weakAreas: string[]
}

function pillTone(state: GraphNodeModel['visualState']): string {
  if (state === 'active') return 'border-primary/50 bg-primary/18 text-primary'
  if (state === 'completed') return 'border-success/45 bg-success/15 text-success'
  if (state === 'available') return 'border-accent/45 bg-accent/15 text-accent'
  return 'border-border/70 bg-white/[0.03] text-muted'
}

function isQuizPhase(nextAction: NextActionResponse | undefined): boolean {
  if (!nextAction) return false
  const action = nextAction.action.toLowerCase()
  return (
    nextAction.required_input === 'answers' ||
    nextAction.waiting_on.includes('evaluator') ||
    action === 'take_quiz' ||
    action === 'submit_quiz'
  )
}

function isBranchPhase(nextAction: NextActionResponse | undefined): boolean {
  if (!nextAction) return false
  const action = nextAction.action.toLowerCase()
  return nextAction.required_input === 'selected_node' || action === 'choose_branch'
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
}

function asNumber(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return value
}

function resolveLessonFromHistory(progress: ProgressResponse | undefined, nodeId: string): PanelLesson | null {
  if (!progress) return null

  const entry = progress.history.find((item) => item.type === 'lesson' && item.subtopic === nodeId)
  if (!entry) return null

  const lessonObj = asObject(entry.lesson)
  if (!lessonObj) return null

  const tutorObj = asObject(lessonObj.tutor_content) ?? lessonObj
  const curatorObj = asObject(lessonObj.curator_content)

  const articlesRaw = Array.isArray(curatorObj?.articles) ? curatorObj?.articles : []
  const videosRaw = Array.isArray(curatorObj?.videos) ? curatorObj?.videos : []

  const articles = articlesRaw.reduce<PanelArticle[]>((acc, item) => {
      const obj = asObject(item)
      if (!obj) return acc
      const url = asString(obj.url)
      const title = asString(obj.title) ?? url
      if (!url || !title) return acc
      acc.push({
        title,
        url,
        description: asString(obj.description),
      })
      return acc
    }, [])

  const videos = videosRaw.reduce<PanelVideo[]>((acc, item) => {
      const obj = asObject(item)
      if (!obj) return acc
      const url = asString(obj.url)
      if (!url) return acc
      acc.push({
        title: asString(obj.title),
        url,
        description: asString(obj.description),
      })
      return acc
    }, [])

  return {
    source: 'history',
    learningObjective:
      asString(tutorObj.learning_objective) ?? 'Review the objective from this completed node.',
    explanation: asString(tutorObj.explanation) ?? 'No explanation was cached for this node yet.',
    examples: asStringArray(tutorObj.examples),
    commonMisconception:
      asString(tutorObj.common_misconception) ?? 'No misconception note available in history.',
    practiceTask: asString(tutorObj.practice_task) ?? 'No practice task cached yet.',
    codeSnippet: asString(tutorObj.code_snippet),
    articles,
    videos,
    references: asStringArray(curatorObj?.references),
  }
}

function resolveEvaluationFromHistory(
  progress: ProgressResponse | undefined,
  nodeId: string,
): PanelEvaluation | null {
  if (!progress) return null

  const entry = progress.history.find((item) => item.type === 'evaluation' && item.subtopic === nodeId)
  if (!entry) return null

  const score = asNumber(entry.score)
  return {
    score,
    feedback: asString(entry.feedback) ?? 'Evaluation completed for this node.',
    passed: typeof entry.passed === 'boolean' ? entry.passed : null,
    weakAreas: asStringArray(entry.weak_areas),
  }
}

function resolveLiveLesson(lesson: LessonResponse | undefined, nodeId: string): PanelLesson | null {
  if (!lesson || lesson.node_id !== nodeId) return null

  return {
    source: 'live',
    learningObjective: lesson.tutor_content.learning_objective,
    explanation: lesson.tutor_content.explanation,
    examples: lesson.tutor_content.examples,
    commonMisconception: lesson.tutor_content.common_misconception,
    practiceTask: lesson.tutor_content.practice_task,
    codeSnippet: lesson.tutor_content.code_snippet,
    articles: lesson.curator_content.articles,
    videos: lesson.curator_content.videos,
    references: lesson.curator_content.references ?? [],
  }
}

export function ExpandedNodePanel({
  node,
  lesson,
  progress,
  quiz,
  evaluation,
  status,
  nextAction,
  isSubmitting,
  onClose,
  onContinue,
  onSubmitQuiz,
  onChooseBranch,
}: ExpandedNodePanelProps) {
  const showQuiz = !!node && !!quiz && quiz.node_id === node.id && isQuizPhase(nextAction)
  const showBranch = !!node && node.isCurrent && isBranchPhase(nextAction) && !!nextAction?.options.length

  const scorePct = node?.score != null ? Math.round(node.score * 100) : null

  const panelLesson = useMemo(() => {
    if (!node) return null
    return resolveLiveLesson(lesson, node.id) ?? resolveLessonFromHistory(progress, node.id)
  }, [lesson, node, progress])

  const panelEvaluation = useMemo<PanelEvaluation | null>(() => {
    if (!node) return null

    if (node.isCurrent && evaluation) {
      return {
        score: evaluation.score,
        feedback: evaluation.feedback,
        passed: evaluation.passed,
        weakAreas: evaluation.weak_areas,
      }
    }

    return resolveEvaluationFromHistory(progress, node.id)
  }, [evaluation, node, progress])

  const showEvaluation = !!panelEvaluation && !showQuiz

  return (
    <AnimatePresence>
      {node ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-background/92 p-0 backdrop-blur-md md:p-6"
        >
          <motion.section
            initial={{ opacity: 0, scale: 0.985, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: 10 }}
            transition={{ duration: 0.24 }}
            className="mx-auto flex h-full w-full max-w-[1460px] flex-col overflow-hidden rounded-none border border-border/70 bg-background/95 md:rounded-3xl"
          >
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-4 py-3 md:px-7 md:py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Focused Node</p>
                <h2 className="mt-1 text-xl font-semibold leading-tight md:text-3xl">{node.id}</h2>
                <p className="mt-1 text-xs text-muted">Depth {node.depth} • {node.nodeKind}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted transition hover:border-primary/50 hover:text-foreground"
              >
                Close
              </button>
            </header>

            <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="overflow-y-auto px-4 py-4 md:px-7 md:py-5">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-2 py-1 text-xs font-medium ${pillTone(node.visualState)}`}>
                    {node.visualState}
                  </span>
                  {node.isRecommended ? (
                    <span className="rounded-full border border-accent/45 bg-accent/15 px-2 py-1 text-xs font-medium text-accent">
                      recommended
                    </span>
                  ) : null}
                  {panelLesson?.source === 'history' ? (
                    <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-xs text-muted">
                      loaded from history
                    </span>
                  ) : null}
                  {scorePct !== null ? (
                    <span className="rounded-full border border-border/70 bg-white/[0.03] px-2 py-1 text-xs text-muted">
                      score {scorePct}%
                    </span>
                  ) : null}
                  <span className="rounded-full border border-border/70 bg-white/[0.03] px-2 py-1 text-xs text-muted">
                    attempts {node.attempts}
                  </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-success transition-all duration-500"
                    style={{ width: `${Math.round(node.progressValue * 100)}%` }}
                  />
                </div>

                <div className="mt-6 space-y-5 pb-2">
                  {panelLesson ? (
                    <section className="space-y-4 rounded-2xl border border-border/70 bg-white/[0.02] p-4">
                      <h3 className="text-sm font-semibold">Learning Content</h3>
                      <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
                        <p className="font-medium text-foreground">{panelLesson.learningObjective}</p>
                        <p>{panelLesson.explanation}</p>
                        {panelLesson.examples.length ? (
                          <ul className="space-y-1 text-sm text-foreground/85">
                            {panelLesson.examples.map((example) => (
                              <li key={example}>• {example}</li>
                            ))}
                          </ul>
                        ) : null}
                        <div className="rounded-xl border border-border/70 bg-card/50 p-3">
                          <p className="text-xs uppercase tracking-[0.1em] text-muted">Common misconception</p>
                          <p className="mt-1">{panelLesson.commonMisconception}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.1em] text-muted">Practice task</p>
                          <p className="mt-1">{panelLesson.practiceTask}</p>
                        </div>
                        {panelLesson.codeSnippet ? (
                          <pre className="overflow-x-auto rounded-xl border border-border/70 bg-black/45 p-3 text-xs text-foreground/90">
                            <code>{panelLesson.codeSnippet}</code>
                          </pre>
                        ) : null}
                      </div>
                    </section>
                  ) : (
                    <section className="rounded-2xl border border-border/70 bg-white/[0.02] p-4">
                      <h3 className="text-sm font-semibold">Learning Content</h3>
                      <p className="mt-2 text-sm text-muted">
                        Content for this node is not available yet. The backend currently serves full lesson payload for the active node, and completed-node content appears when it exists in session history.
                      </p>
                    </section>
                  )}

                  {showQuiz && quiz ? (
                    <QuizComponent
                      key={`${quiz.node_id}-${quiz.questions.length}`}
                      quiz={quiz}
                      evaluation={evaluation}
                      isSubmitting={isSubmitting}
                      isContinuing={isSubmitting}
                      onSubmit={onSubmitQuiz}
                      onContinue={onContinue}
                    />
                  ) : null}

                  {showEvaluation && panelEvaluation ? (
                    <section className="space-y-2 rounded-2xl border border-success/40 bg-success/10 p-4">
                      <h3 className="text-sm font-semibold">Evaluation</h3>
                      <p className="text-sm text-foreground/90">{panelEvaluation.feedback}</p>
                      {panelEvaluation.score !== null ? (
                        <p className="text-xs text-muted">
                          Score {Math.round(panelEvaluation.score * 100)}% {panelEvaluation.passed !== null ? `• ${panelEvaluation.passed ? 'Passed' : 'Needs remediation'}` : ''}
                        </p>
                      ) : null}
                      {panelEvaluation.weakAreas.length ? (
                        <div className="flex flex-wrap gap-2">
                          {panelEvaluation.weakAreas.map((area) => (
                            <span
                              key={area}
                              className="rounded-full border border-border/70 bg-white/[0.04] px-2 py-1 text-xs text-muted"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </section>
                  ) : null}

                  {panelLesson && (panelLesson.articles.length || panelLesson.videos.length || panelLesson.references.length) ? (
                    <section className="space-y-3 rounded-2xl border border-border/70 bg-white/[0.02] p-4">
                      <h3 className="text-sm font-semibold">Resources</h3>
                      <div className="space-y-2">
                        {panelLesson.articles.map((article) => (
                          <a
                            key={article.url}
                            href={article.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-lg border border-border/60 bg-white/[0.03] px-3 py-2 text-sm transition hover:border-primary/35"
                          >
                            <p className="font-medium text-foreground">{article.title}</p>
                            <p className="truncate text-xs text-muted">{article.url}</p>
                          </a>
                        ))}
                        {panelLesson.videos.map((video) => (
                          <a
                            key={video.url}
                            href={video.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-lg border border-border/60 bg-white/[0.03] px-3 py-2 text-sm transition hover:border-primary/35"
                          >
                            <p className="font-medium text-foreground">{video.title ?? 'Video'}</p>
                            <p className="truncate text-xs text-muted">{video.url}</p>
                          </a>
                        ))}
                        {panelLesson.references.map((reference) => (
                          <p key={reference} className="text-sm text-muted">
                            {reference}
                          </p>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>

              <aside className="border-t border-border/70 p-4 pb-6 lg:border-l lg:border-t-0 lg:p-5">
                <div className="space-y-3 rounded-2xl border border-border/70 bg-card/40 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">Session Intent</p>
                  <p className="text-sm text-foreground/90">{nextAction?.message ?? 'Syncing backend state...'}</p>
                  <p className="text-xs text-muted">
                    status: {status?.status ?? 'loading'} {status?.current_phase ? `• ${status.current_phase}` : ''}
                  </p>
                </div>

                {showBranch && nextAction ? (
                  <div className="mt-4">
                    <BranchSelector
                      key={`${nextAction.current_node ?? 'none'}-${nextAction.recommended_node ?? 'none'}-${nextAction.traversal_mode}-${nextAction.options.join('|')}`}
                      options={nextAction.options}
                      recommendedNode={nextAction.recommended_node}
                      initialTraversalMode={nextAction.traversal_mode === 'bfs' ? 'bfs' : 'dfs'}
                      isSubmitting={isSubmitting}
                      onChooseBranch={onChooseBranch}
                    />
                  </div>
                ) : null}

                {node.isCurrent && status?.status === 'ready' ? (
                  <div className="mt-4 border-t border-border/70 pt-4">
                    <Button
                      className="w-full"
                      isLoading={isSubmitting}
                      onClick={onContinue}
                    >
                      {isQuizPhase(nextAction)
                        ? 'Continue (Quiz Input Needed)'
                        : isBranchPhase(nextAction)
                          ? 'Continue (Auto Pick Recommended)'
                          : 'Continue'}
                    </Button>
                  </div>
                ) : null}
              </aside>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

type BranchSelectorProps = {
  options: string[]
  recommendedNode: string | null
  initialTraversalMode: 'dfs' | 'bfs'
  isSubmitting: boolean
  onChooseBranch: (payload: { selected_node?: string; traversal_mode?: string }) => void
}

function BranchSelector({
  options,
  recommendedNode,
  initialTraversalMode,
  isSubmitting,
  onChooseBranch,
}: BranchSelectorProps) {
  const [traversalMode, setTraversalMode] = useState<'dfs' | 'bfs'>(initialTraversalMode)
  const [selectedBranch, setSelectedBranch] = useState<string | null>(recommendedNode)

  return (
    <section className="space-y-3 rounded-2xl border border-border/70 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Choose Next Branch</h3>
        <div className="flex gap-2">
          {(['dfs', 'bfs'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTraversalMode(mode)}
              className={`rounded-md px-2 py-1 text-xs uppercase tracking-wide transition ${
                traversalMode === mode
                  ? 'bg-primary/20 text-primary ring-1 ring-primary/45'
                  : 'bg-white/5 text-muted hover:text-foreground'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setSelectedBranch(option)}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
              selectedBranch === option
                ? 'border-primary/55 bg-primary/14'
                : 'border-border/60 bg-white/[0.02] hover:border-primary/35'
            }`}
          >
            <span>{option}</span>
            {recommendedNode === option ? <span className="text-xs text-accent">suggested</span> : null}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          disabled={isSubmitting}
          onClick={() => onChooseBranch({ traversal_mode: traversalMode })}
        >
          Auto pick
        </Button>
        <Button
          isLoading={isSubmitting}
          disabled={!selectedBranch}
          onClick={() =>
            selectedBranch &&
            onChooseBranch({
              selected_node: selectedBranch,
              traversal_mode: traversalMode,
            })
          }
        >
          Continue
        </Button>
      </div>
    </section>
  )
}
