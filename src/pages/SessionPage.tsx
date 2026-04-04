import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AppShell } from '../components/layout/AppShell'
import { SessionHeader } from '../components/layout/SessionHeader'
import { ExpandedNodePanel } from '../components/graph/ExpandedNodePanel'
import { GraphCanvas } from '../components/graph/GraphCanvas'
import { ProgressOverlay } from '../components/graph/ProgressOverlay'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../auth/useAuth'
import {
  useEvaluation,
  useLearningStatus,
  useLesson,
  useNextAction,
  useProgress,
  useQuiz,
} from '../hooks/useLearningQueries'
import { useSessionStream } from '../hooks/useSessionStream'
import * as learningApi from '../lib/api/learning'
import { ApiError } from '../lib/api/types'
import { buildLearningGraphModel } from '../lib/learningGraph'
import { learningKeys } from '../lib/queryKeys'

export function SessionPage() {
  const { sessionId = '' } = useParams<{ sessionId: string }>()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  useSessionStream(sessionId || undefined, token)

  const statusQuery = useLearningStatus(sessionId || undefined)
  const nextActionQuery = useNextAction(sessionId || undefined, !!sessionId)
  const progressQuery = useProgress(sessionId || undefined, !!sessionId)

  const status = statusQuery.data
  const nextAction = nextActionQuery.data
  const ready = status?.status === 'ready'

  const wantsQuiz = useMemo(() => {
    if (!nextAction || !status || status.status !== 'ready') return false

    const action = (nextAction.action ?? '').toLowerCase()
    return (
      nextAction.required_input === 'answers' ||
      nextAction.waiting_on.includes('evaluator') ||
      action === 'take_quiz' ||
      action === 'submit_quiz' ||
      action.includes('quiz')
    )
  }, [nextAction, status])

  const wantsBranch = useMemo(() => {
    if (!nextAction || !status || status.status !== 'ready') return false

    const action = (nextAction.action ?? '').toLowerCase()
    return (
      nextAction.required_input === 'selected_node' ||
      action === 'choose_branch' ||
      action.includes('branch')
    )
  }, [nextAction, status])

  const lessonQuery = useLesson(sessionId || undefined, ready)
  const quizQuery = useQuiz(sessionId || undefined, ready && wantsQuiz)
  const evaluationQuery = useEvaluation(sessionId || undefined, ready)

  const evaluationData = evaluationQuery.isSuccess ? evaluationQuery.data : undefined

  const graphModel = useMemo(
    () =>
      buildLearningGraphModel({
        progress: progressQuery.data,
        lesson: lessonQuery.data,
        quiz: quizQuery.data,
        nextAction,
      }),
    [progressQuery.data, lessonQuery.data, quizQuery.data, nextAction],
  )

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(true)

  const resolvedSelectedNodeId = useMemo(() => {
    if (!isPanelOpen) return null
    if (!graphModel.nodes.length) return null
    if (selectedNodeId && graphModel.nodes.some((node) => node.id === selectedNodeId)) {
      return selectedNodeId
    }
    return graphModel.currentNodeId ?? graphModel.nodes[0].id
  }, [graphModel.currentNodeId, graphModel.nodes, isPanelOpen, selectedNodeId])

  const selectedNode = useMemo(
    () => graphModel.nodes.find((node) => node.id === resolvedSelectedNodeId) ?? null,
    [graphModel.nodes, resolvedSelectedNodeId],
  )

  const invalidateSession = () =>
    void queryClient.invalidateQueries({ queryKey: learningKeys.session(sessionId) })

  const continueMutation = useMutation({
    mutationFn: (body: Parameters<typeof learningApi.postContinue>[1]) =>
      learningApi.postContinue(sessionId, body),
    onSuccess: (res) => {
      if (res.request_status === 'needs_input') {
        toast.message(res.message ?? 'More input needed')
        setIsPanelOpen(true)
        setSelectedNodeId(graphModel.currentNodeId ?? graphModel.nodes[0]?.id ?? null)
      }
      invalidateSession()
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'Request failed')
    },
  })

  const submitContinue = (body: Parameters<typeof learningApi.postContinue>[1] = {}) => {
    continueMutation.mutate({
      ...body,
      client_request_id: crypto.randomUUID(),
    })
  }

  const handleContinue = () => {
    setIsPanelOpen(true)
    setSelectedNodeId(graphModel.currentNodeId ?? graphModel.nodes[0]?.id ?? null)
    if (nextAction?.required_input === 'selected_node' && nextAction.recommended_node) {
      submitContinue({
        selected_node: nextAction.recommended_node,
        traversal_mode: nextAction.traversal_mode,
      })
      return
    }
    submitContinue()
  }

  const handleTakeRecommended = () => {
    setIsPanelOpen(true)
    setSelectedNodeId(graphModel.currentNodeId ?? graphModel.nodes[0]?.id ?? null)
    if (nextAction?.recommended_node) {
      submitContinue({
        selected_node: nextAction.recommended_node,
        traversal_mode: nextAction.traversal_mode,
      })
      return
    }
    submitContinue()
  }

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId)
    setIsPanelOpen(true)
  }

  const openCurrentNodePanel = () => {
    setSelectedNodeId(graphModel.currentNodeId ?? graphModel.nodes[0]?.id ?? null)
    setIsPanelOpen(true)
  }

  const phaseLabel = useMemo(() => {
    if (!status) return undefined
    if (status.status === 'evaluating') return 'Scoring your responses'
    if (status.status === 'running' || status.status === 'initializing') {
      return 'Building your learning graph'
    }
    return undefined
  }, [status])

  if (!sessionId) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm text-muted">Missing session id.</p>
          <Link to="/" className="mt-4 inline-block">
            <Button variant="secondary">Back to sessions</Button>
          </Link>
        </Card>
      </AppShell>
    )
  }

  if (statusQuery.isLoading || nextActionQuery.isLoading || progressQuery.isLoading) {
    return (
      <AppShell
        fullBleed
        actions={
          <Link to="/">
            <Button variant="ghost" className="!px-3 !py-2 text-xs">
              All sessions
            </Button>
          </Link>
        }
      >
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-[72vh] w-full" />
        </div>
      </AppShell>
    )
  }

  if (statusQuery.isError) {
    return (
      <AppShell fullBleed>
        <Card className="border-danger/30">
          <p className="text-sm">Could not load session status.</p>
          <Button variant="secondary" className="mt-4" onClick={() => void statusQuery.refetch()}>
            Retry
          </Button>
        </Card>
      </AppShell>
    )
  }

  if (status?.status === 'error') {
    return (
      <AppShell
        fullBleed
        title={status.topic}
        actions={
          <Link to="/">
            <Button variant="ghost" className="!px-3 !py-2 text-xs">
              All sessions
            </Button>
          </Link>
        }
      >
        <Card>
          <p className="text-sm text-muted">This session hit an error state. Try starting a new topic.</p>
        </Card>
      </AppShell>
    )
  }

  if (status?.status === 'completed') {
    return (
      <AppShell
        fullBleed
        title={status.topic}
        actions={
          <Link to="/">
            <Button variant="ghost" className="!px-3 !py-2 text-xs">
              All sessions
            </Button>
          </Link>
        }
      >
        <Card glow>
          <p className="text-lg font-semibold">Journey complete</p>
          <p className="mt-2 text-sm text-muted">You can revisit this graph from your sessions list at any time.</p>
          <Link to="/" className="mt-5 inline-block">
            <Button variant="primary">All sessions</Button>
          </Link>
        </Card>
      </AppShell>
    )
  }

  const isProcessing =
    status?.status === 'running' || status?.status === 'initializing' || status?.status === 'evaluating'

  return (
    <AppShell
      fullBleed
      title={status?.topic}
      actions={
        <Link to="/">
          <Button variant="ghost" className="!px-3 !py-2 text-xs">
            All sessions
          </Button>
        </Link>
      }
    >
      <div className="space-y-4 px-3 py-3 md:px-6 md:py-5">
        {status ? (
          <SessionHeader topic={status.topic} status={status.status} phaseLabel={phaseLabel} />
        ) : (
          <Skeleton className="h-16 w-full" />
        )}

        {graphModel.nodes.length ? (
          <div className="relative">
            <GraphCanvas
              nodes={graphModel.nodes}
              edges={graphModel.edges}
              selectedNodeId={resolvedSelectedNodeId}
              onSelectNode={handleSelectNode}
              className="h-[calc(100dvh-9.75rem)] min-h-[500px] md:h-[calc(100dvh-12.5rem)] md:min-h-[680px]"
            />

            <ProgressOverlay
              progress={progressQuery.data}
              status={status}
              nextAction={nextAction}
              isMutating={continueMutation.isPending}
              onOpenRequiredInputPanel={openCurrentNodePanel}
              onContinue={handleContinue}
              onTakeRecommended={handleTakeRecommended}
            />

            {isProcessing ? (
              <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-border/70 bg-card/85 px-4 py-2 shadow-[var(--shadow-soft)] backdrop-blur-md">
                <p className="text-xs font-medium text-foreground">{phaseLabel ?? 'Processing...'}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-muted">No graph nodes yet. Continue once backend publishes hierarchy data.</p>
            <Button className="mt-4" isLoading={continueMutation.isPending} onClick={handleContinue}>
              Continue
            </Button>
          </Card>
        )}
      </div>

      <ExpandedNodePanel
        node={selectedNode}
        lesson={lessonQuery.data}
        progress={progressQuery.data}
        quiz={quizQuery.data}
        evaluation={evaluationData}
        status={status}
        nextAction={nextAction}
        isSubmitting={continueMutation.isPending}
        onClose={() => {
          setSelectedNodeId(null)
          setIsPanelOpen(false)
        }}
        onContinue={handleContinue}
        onSubmitQuiz={(answers) => submitContinue({ answers })}
        onChooseBranch={(payload) => submitContinue(payload)}
      />

      {wantsBranch && !selectedNode ? (
        <div className="mt-4 text-sm text-muted">Select a node to choose your next branch.</div>
      ) : null}
    </AppShell>
  )
}
