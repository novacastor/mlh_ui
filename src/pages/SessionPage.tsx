import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AppShell } from '../components/layout/AppShell'
import { SessionHeader } from '../components/layout/SessionHeader'
import { ExpandedNodePanel } from '../components/graph/ExpandedNodePanel'
import { GraphCanvas } from '../components/graph/GraphCanvas'
import { ProgressOverlay } from '../components/graph/ProgressOverlay'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../auth/useAuth'
import {
  useEvaluation,
  useLesson,
  useNextAction,
  useProgress,
  useQuiz,
  useWorkflow,
} from '../hooks/useLearningQueries'
import { useSessionStream } from '../hooks/useSessionStream'
import * as learningApi from '../lib/api/learning'
import {
  ApiError,
  type ContinueRequest,
  type CurrentPhase,
  type LearningSessionStatus,
  type LearningStatusResponse,
  type NextActionResponse,
  type WorkflowResponse,
} from '../lib/api/types'
import {
  buildLearningGraphModel,
  type GraphEdgeModel,
  type GraphNodeModel,
  type LearningGraphModel,
} from '../lib/learningGraph'
import { learningKeys } from '../lib/queryKeys'

type LocalGraphNode = {
  id: string
  parentId: string | null
  lane: number
}

function normalizeStatus(value: string | undefined): LearningSessionStatus {
  const statuses: LearningSessionStatus[] = [
    'initializing',
    'running',
    'ready',
    'evaluating',
    'completed',
    'error',
    'archived',
  ]
  if (value && statuses.includes(value as LearningSessionStatus)) {
    return value as LearningSessionStatus
  }
  return 'running'
}

function inferRequiredInput(action: string, waitingOn: string[]): string | null {
  if (action === 'take_quiz' || action === 'submit_quiz' || waitingOn.includes('evaluator')) {
    return 'answers'
  }
  if (action === 'choose_branch' || waitingOn.includes('next')) {
    return 'selected_node'
  }
  return null
}

function deriveStatus(workflow: WorkflowResponse | undefined): LearningStatusResponse | undefined {
  if (!workflow) return undefined

  return {
    session_id: workflow.session_id,
    topic: workflow.topic,
    status: normalizeStatus(workflow.status),
    current_phase: (workflow.current_phase ?? null) as CurrentPhase | null,
    error_message: null,
  }
}

function deriveNextAction(workflow: WorkflowResponse | undefined): NextActionResponse | undefined {
  if (!workflow) return undefined

  const action = (workflow.next_action ?? 'wait').toLowerCase()
  const waitingOn = workflow.waiting_on ?? []

  return {
    session_id: workflow.session_id,
    action,
    status: workflow.status,
    message: workflow.next_action ?? '',
    current_node: workflow.current_node,
    waiting_on: waitingOn,
    options: workflow.options ?? [],
    traversal_mode: workflow.traversal_mode ?? 'dfs',
    journey_mode: workflow.journey_mode ?? 'learn',
    can_go_back: false,
    previous_node: null,
    recommended_node: workflow.recommended_node,
    recommendation_reason: workflow.recommendation_reason ?? null,
    recommendation_factors: workflow.recommendation_factors ?? null,
    required_input: inferRequiredInput(action, waitingOn),
  }
}

function makeUniqueNodeName(base: string, existingIds: Set<string>): string {
  const normalized = base.trim().replace(/\s+/g, ' ')
  if (!existingIds.has(normalized)) return normalized

  let index = 2
  while (existingIds.has(`${normalized} (${index})`)) {
    index += 1
  }
  return `${normalized} (${index})`
}

function mergeGraphModel(
  base: LearningGraphModel,
  localNodes: LocalGraphNode[],
  deletedNodeIds: Set<string>,
): LearningGraphModel {
  const visibleBaseNodes = base.nodes.filter((node) => !deletedNodeIds.has(node.id))
  const visibleBaseEdges = base.edges.filter(
    (edge) => !deletedNodeIds.has(edge.source) && !deletedNodeIds.has(edge.target),
  )
  const nodeMap = new Map<string, GraphNodeModel>(visibleBaseNodes.map((node) => [node.id, node]))
  const mergedNodes = [...visibleBaseNodes]
  const localEdges: GraphEdgeModel[] = []

  for (const localNode of localNodes) {
    if (deletedNodeIds.has(localNode.id)) continue
    if (localNode.parentId && !nodeMap.has(localNode.parentId)) continue

    const parent = localNode.parentId ? nodeMap.get(localNode.parentId) ?? null : null
    const yOffset = (localNode.lane % 3) * 130 - 130 + Math.floor(localNode.lane / 3) * 45
    const createdNode: GraphNodeModel = {
      id: localNode.id,
      parentId: localNode.parentId,
      depth: parent ? parent.depth + 1 : 0,
      nodeKind: 'custom',
      score: null,
      attempts: 0,
      progressValue: 0.08,
      visualState: 'available',
      isCurrentPath: false,
      isFrontier: false,
      isRecommended: false,
      isCurrent: false,
      learningSnippet: 'Custom frontend node. Use this as a scratch branch while planning.',
      quizLabel: 'No quiz (frontend-only node)',
      pathFromRoot: parent ? [...parent.pathFromRoot, localNode.id] : [localNode.id],
      position: parent
        ? { x: parent.position.x + 320, y: parent.position.y + yOffset }
        : { x: 0, y: yOffset },
    }
    mergedNodes.push(createdNode)
    nodeMap.set(createdNode.id, createdNode)

    if (localNode.parentId) {
      localEdges.push({
        id: `edge:${localNode.parentId}->${localNode.id}`,
        source: localNode.parentId,
        target: localNode.id,
        isHighlighted: false,
      })
    }
  }

  return {
    nodes: mergedNodes,
    edges: [...visibleBaseEdges, ...localEdges],
    currentNodeId: base.currentNodeId && !deletedNodeIds.has(base.currentNodeId) ? base.currentNodeId : null,
  }
}

export function SessionPage() {
  const { sessionId = '' } = useParams<{ sessionId: string }>()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  useSessionStream(sessionId || undefined, token)

  const workflowQuery = useWorkflow(sessionId || undefined, !!sessionId)
  const nextActionQuery = useNextAction(sessionId || undefined, !!sessionId)
  const progressQuery = useProgress(sessionId || undefined, !!sessionId)

  const workflow = workflowQuery.data
  const status = useMemo(() => deriveStatus(workflow), [workflow])
  const fallbackNextAction = useMemo(() => deriveNextAction(workflow), [workflow])
  const nextAction = nextActionQuery.data ?? fallbackNextAction
  const ready = status?.status === 'ready'

  const action = (nextAction?.action ?? '').toLowerCase()

  const wantsQuiz = useMemo(() => {
    if (!ready || !workflow || !nextAction) return false

    return (
      workflow.quiz_ready ||
      nextAction.required_input === 'answers' ||
      nextAction.waiting_on.includes('evaluator') ||
      action === 'take_quiz' ||
      action === 'submit_quiz' ||
      action.includes('quiz')
    )
  }, [action, nextAction, ready, workflow])

  const wantsBranch = useMemo(() => {
    if (!ready || !nextAction) return false

    return (
      nextAction.required_input === 'selected_node' ||
      action === 'choose_branch' ||
      action.includes('branch')
    )
  }, [action, nextAction, ready])

  const wantsEvaluation = useMemo(() => {
    if (!ready || !workflow) return false

    return workflow.evaluation_ready || action.includes('eval')
  }, [action, ready, workflow])

  const lessonQuery = useLesson(sessionId || undefined, ready && !!workflow?.lesson_ready)
  const quizQuery = useQuiz(sessionId || undefined, ready && wantsQuiz && !!workflow?.quiz_ready)
  const evaluationQuery = useEvaluation(sessionId || undefined, ready && wantsEvaluation)

  const evaluationData = evaluationQuery.isSuccess ? evaluationQuery.data : undefined

  const baseGraphModel = useMemo(
    () =>
      buildLearningGraphModel({
        progress: progressQuery.data,
        lesson: lessonQuery.data,
        quiz: quizQuery.data,
        nextAction,
      }),
    [progressQuery.data, lessonQuery.data, quizQuery.data, nextAction],
  )

  const [localGraphNodes, setLocalGraphNodes] = useState<LocalGraphNode[]>([])
  const [deletedNodeIds, setDeletedNodeIds] = useState<Set<string>>(() => new Set())
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false)
  const [newNodeName, setNewNodeName] = useState('')
  const [newNodeParentId, setNewNodeParentId] = useState('__current')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(true)

  const graphModel = useMemo(
    () => mergeGraphModel(baseGraphModel, localGraphNodes, deletedNodeIds),
    [baseGraphModel, deletedNodeIds, localGraphNodes],
  )

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

  const selectedLessonNodeId = useMemo(() => {
    if (!selectedNode) return undefined
    if (selectedNode.nodeKind === 'custom') return undefined
    if (selectedNode.id === graphModel.currentNodeId) return undefined
    return selectedNode.id
  }, [graphModel.currentNodeId, selectedNode])

  const selectedLessonQuery = useLesson(
    sessionId || undefined,
    ready && !!selectedLessonNodeId,
    selectedLessonNodeId,
  )

  const invalidateSession = () =>
    void queryClient.invalidateQueries({ queryKey: learningKeys.session(sessionId) })

  const continueMutation = useMutation({
    mutationFn: (body: ContinueRequest) => learningApi.postContinue(sessionId, body),
    onSuccess: (res) => {
      if (res.status === 'needs_input') {
        toast.message(res.message ?? 'More input needed')
        setIsPanelOpen(true)
        setSelectedNodeId(graphModel.currentNodeId ?? graphModel.nodes[0]?.id ?? null)
      }
      if (res.status === 'waiting') {
        toast.message(res.message ?? 'Session is still preparing. Please wait.')
      }
      if (res.status === 'processing' && res.request_status === 'accepted') {
        toast.message(res.message ?? 'Processing your request...')
      }
      if (res.request_status === 'duplicate') {
        toast.message('This continue request was already processed.')
      }
      if (res.request_status === 'in_progress') {
        toast.message('A continue request is already in progress. Syncing latest state...')
      }
      invalidateSession()
    },
    onError: (error: unknown) => {
      toast.error(error instanceof ApiError ? error.message : 'Request failed')
    },
  })

  const submitContinue = (body: ContinueRequest = {}) => {
    continueMutation.mutate({
      ...body,
      client_request_id: crypto.randomUUID(),
    })
  }

  const handleContinue = () => {
    const normalizedAction = (nextAction?.action ?? '').toLowerCase()
    if (normalizedAction === 'blocked') {
      toast.error(nextAction?.message ?? 'Session is blocked right now.')
      return
    }

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

  const addNodeParentOptions = useMemo(() => {
    const options = [
      { value: '__current', label: 'Current/selected node' },
      { value: '__none', label: 'No parent (root)' },
      ...graphModel.nodes.map((node) => ({
        value: node.id,
        label: `${node.id} (${node.nodeKind})`,
      })),
    ]
    return options
  }, [graphModel.nodes])

  const handleAddNode = () => {
    const trimmed = newNodeName.trim()
    if (!trimmed) {
      toast.error('Enter a node name first.')
      return
    }

    const existingIds = new Set(graphModel.nodes.map((node) => node.id))
    const nodeName = makeUniqueNodeName(trimmed, existingIds)
    const parentId =
      newNodeParentId === '__none'
        ? null
        : newNodeParentId === '__current'
          ? resolvedSelectedNodeId ?? graphModel.currentNodeId ?? null
          : newNodeParentId

    const siblingCount = graphModel.nodes.filter((node) => node.parentId === parentId).length
    setLocalGraphNodes((prev) => [...prev, { id: nodeName, parentId, lane: siblingCount }])
    setDeletedNodeIds((prev) => {
      const next = new Set(prev)
      next.delete(nodeName)
      return next
    })
    setSelectedNodeId(nodeName)
    setIsPanelOpen(true)
    setNewNodeName('')
    setIsAddNodeOpen(false)
    toast.success(`Added node "${nodeName}"`)
  }

  const handleDeleteNode = (nodeId?: string) => {
    const targetId = nodeId ?? resolvedSelectedNodeId
    if (!targetId) {
      toast.error('Select a node to delete.')
      return
    }

    const childrenByParent = new Map<string, string[]>()
    for (const edge of graphModel.edges) {
      const children = childrenByParent.get(edge.source) ?? []
      children.push(edge.target)
      childrenByParent.set(edge.source, children)
    }

    const toDelete = new Set<string>()
    const stack = [targetId]
    while (stack.length) {
      const currentId = stack.pop()
      if (!currentId || toDelete.has(currentId)) continue
      toDelete.add(currentId)
      const children = childrenByParent.get(currentId) ?? []
      for (const child of children) {
        stack.push(child)
      }
    }

    const childCount = Math.max(0, toDelete.size - 1)
    const confirmationMessage =
      childCount > 0
        ? `Delete "${targetId}" and ${childCount} child node${childCount === 1 ? '' : 's'}?`
        : `Delete "${targetId}"?`
    const confirmed =
      typeof window === 'undefined'
        ? true
        : window.confirm(`${confirmationMessage}\n\nThis action cannot be undone.`)

    if (!confirmed) return

    setLocalGraphNodes((prev) => prev.filter((node) => !toDelete.has(node.id)))
    setDeletedNodeIds((prev) => {
      const next = new Set(prev)
      toDelete.forEach((id) => next.add(id))
      return next
    })
    if (resolvedSelectedNodeId && toDelete.has(resolvedSelectedNodeId)) {
      setSelectedNodeId(null)
      setIsPanelOpen(false)
    }
    toast.success(toDelete.size > 1 ? `Deleted ${toDelete.size} nodes` : `Deleted node "${targetId}"`)
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

  if (workflowQuery.isLoading || progressQuery.isLoading) {
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

  if (workflowQuery.isError) {
    return (
      <AppShell fullBleed>
        <Card className="border-danger/30">
          <p className="text-sm">Could not load workflow state.</p>
          <Button variant="secondary" className="mt-4" onClick={() => void workflowQuery.refetch()}>
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

  if (status?.status === 'archived') {
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
          <p className="text-sm text-muted">This session is archived.</p>
          <Link to="/" className="mt-5 inline-block">
            <Button variant="primary">All sessions</Button>
          </Link>
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
      title={status?.topic ?? progressQuery.data?.topic}
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
          <SessionHeader
            topic={status.topic ?? progressQuery.data?.topic ?? 'Learning session'}
            status={normalizeStatus(status.status)}
            phaseLabel={phaseLabel}
          />
        ) : (
          <Skeleton className="h-16 w-full" />
        )}

        {workflow ? (
          <Card className="border-border/70 bg-card/35 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="primary">Action: {workflow.next_action ?? 'wait'}</Badge>
              <Badge tone="accent">Mode: {workflow.journey_mode}</Badge>
              <Badge tone="default">Traversal: {workflow.traversal_mode}</Badge>
              <Badge tone={workflow.lesson_ready ? 'success' : 'default'}>
                Lesson {workflow.lesson_ready ? 'ready' : 'pending'}
              </Badge>
              <Badge tone={workflow.quiz_ready ? 'success' : 'default'}>
                Quiz {workflow.quiz_ready ? 'ready' : 'pending'}
              </Badge>
              <Badge tone={workflow.evaluation_ready ? 'success' : 'default'}>
                Evaluation {workflow.evaluation_ready ? 'ready' : 'pending'}
              </Badge>
              {(workflow.waiting_on ?? []).map((waitKey) => (
                <Badge key={waitKey} tone="warning">
                  waiting_on: {waitKey}
                </Badge>
              ))}
            </div>
          </Card>
        ) : null}

        <Card className="border-border/70 bg-card/45 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Graph Tools</p>
              <p className="mt-1 text-sm text-foreground/90">
                Add scratch nodes for planning and remove nodes locally without mutating backend data.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setIsAddNodeOpen((prev) => !prev)}>
                {isAddNodeOpen ? 'Close add node' : 'Add node'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setLocalGraphNodes([])
                  setDeletedNodeIds(new Set())
                  setSelectedNodeId(baseGraphModel.currentNodeId ?? null)
                  toast.message('Reset graph edits.')
                }}
                disabled={localGraphNodes.length === 0 && deletedNodeIds.size === 0}
              >
                Reset graph edits
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeleteNode()}
                disabled={!resolvedSelectedNodeId}
              >
                Delete selected
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">Deleting a node also deletes all of its children.</p>

          {isAddNodeOpen ? (
            <div className="mt-4 grid gap-3 rounded-xl border border-border/70 bg-background/35 p-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] md:items-end">
              <Input
                label="Node name"
                value={newNodeName}
                onChange={(event) => setNewNodeName(event.target.value)}
                placeholder="e.g. Sorting intuition"
              />
              <Select
                label="Attach to"
                value={newNodeParentId}
                onChange={(event) => setNewNodeParentId(event.target.value)}
                options={addNodeParentOptions}
              />
              <Button onClick={handleAddNode} className="md:self-end">
                Add node
              </Button>
            </div>
          ) : null}
        </Card>

        {graphModel.nodes.length ? (
          <div className="relative">
            <GraphCanvas
              nodes={graphModel.nodes}
              edges={graphModel.edges}
              selectedNodeId={resolvedSelectedNodeId}
              onSelectNode={handleSelectNode}
              onDeleteNode={handleDeleteNode}
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
        lesson={selectedLessonQuery.data ?? lessonQuery.data}
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
