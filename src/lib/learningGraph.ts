import type {
  LessonResponse,
  NextActionResponse,
  ProgressNodeCatalogItem,
  ProgressResponse,
  ProgressSubtopic,
  QuizResponse,
} from './api/types'

export type GraphNodeVisualState = 'locked' | 'available' | 'active' | 'completed'

export interface GraphNodeModel {
  id: string
  parentId: string | null
  depth: number
  nodeKind: string
  score: number | null
  attempts: number
  progressValue: number
  visualState: GraphNodeVisualState
  isCurrentPath: boolean
  isFrontier: boolean
  isRecommended: boolean
  isCurrent: boolean
  learningSnippet: string
  quizLabel: string
  pathFromRoot: string[]
  position: { x: number; y: number }
}

export interface GraphEdgeModel {
  id: string
  source: string
  target: string
  isHighlighted: boolean
}

export interface LearningGraphModel {
  nodes: GraphNodeModel[]
  edges: GraphEdgeModel[]
  currentNodeId: string | null
}

type InternalNode = {
  id: string
  parentId: string | null
  depth?: number
  nodeKind?: string
  pathFromRoot?: string[]
  status?: string
  score?: number | null
  attempts?: number
}

const COMPLETED_STATUSES = new Set(['mastered', 'completed', 'passed'])
const AVAILABLE_STATUSES = new Set(['active', 'unlocked', 'available'])
const LOCKED_STATUSES = new Set(['locked'])

function toNodeFromCatalog(item: ProgressNodeCatalogItem): InternalNode {
  return {
    id: item.node_id,
    parentId: item.parent_node_id,
    depth: item.depth,
    nodeKind: item.node_kind,
    pathFromRoot: item.path_from_root,
    status: item.status,
    score: item.score,
    attempts: item.attempts,
  }
}

function toNodeFromSubtopic(item: ProgressSubtopic): InternalNode {
  return {
    id: item.name,
    parentId: item.parent_node_id ?? null,
    depth: item.depth,
    nodeKind: item.node_kind,
    pathFromRoot: item.path_from_root,
    status: item.status,
    score: item.score,
    attempts: item.attempts,
  }
}

function normalizeNodes(progress: ProgressResponse): Map<string, InternalNode> {
  const map = new Map<string, InternalNode>()

  for (const item of progress.node_catalog ?? []) {
    map.set(item.node_id, toNodeFromCatalog(item))
  }

  for (const item of progress.subtopics) {
    const existing = map.get(item.name)
    const merged = { ...existing, ...toNodeFromSubtopic(item), id: item.name }
    map.set(item.name, merged)
  }

  if (progress.current_node && !map.has(progress.current_node)) {
    map.set(progress.current_node, {
      id: progress.current_node,
      parentId: null,
      depth: 0,
      nodeKind: 'concept',
      status: 'active',
      score: null,
      attempts: 0,
      pathFromRoot: [progress.current_node],
    })
  }

  return map
}

function buildChildrenMap(
  progress: ProgressResponse,
  nodes: Map<string, InternalNode>,
): Map<string, string[]> {
  const map = new Map<string, string[]>()

  for (const [parent, children] of Object.entries(progress.children_map ?? {})) {
    map.set(parent, [...children])
  }

  for (const node of nodes.values()) {
    if (!node.parentId) continue
    const siblings = map.get(node.parentId) ?? []
    if (!siblings.includes(node.id)) siblings.push(node.id)
    map.set(node.parentId, siblings)
  }

  return map
}

function resolveDepth(nodeId: string, nodes: Map<string, InternalNode>, stack: Set<string>): number {
  const node = nodes.get(nodeId)
  if (!node) return 0
  if (typeof node.depth === 'number') return node.depth

  if (!node.parentId) {
    node.depth = 0
    return 0
  }

  if (stack.has(nodeId)) {
    node.depth = 0
    return 0
  }

  stack.add(nodeId)
  const parentDepth = resolveDepth(node.parentId, nodes, stack)
  stack.delete(nodeId)
  node.depth = parentDepth + 1
  return node.depth
}

function inferPath(nodeId: string, nodes: Map<string, InternalNode>): string[] {
  const path: string[] = []
  let cursor: string | null = nodeId
  let guard = 0

  while (cursor && guard < 100) {
    path.unshift(cursor)
    cursor = nodes.get(cursor)?.parentId ?? null
    guard += 1
  }

  return path
}

function resolveVisualState(
  status: string | undefined,
  isCurrent: boolean,
  isFrontier: boolean,
): GraphNodeVisualState {
  if (isCurrent) return 'active'
  const normalized = status?.toLowerCase()
  if (normalized && COMPLETED_STATUSES.has(normalized)) return 'completed'
  if (normalized && LOCKED_STATUSES.has(normalized)) return 'locked'
  if (normalized && AVAILABLE_STATUSES.has(normalized)) return 'available'
  if (isFrontier) return 'available'
  return 'locked'
}

function resolveProgressValue(
  visualState: GraphNodeVisualState,
  score: number | null | undefined,
  attempts: number | undefined,
): number {
  if (typeof score === 'number') return Math.max(0, Math.min(1, score))
  if (visualState === 'completed') return 1
  if (visualState === 'active') return 0.45
  if (visualState === 'available') return attempts && attempts > 0 ? 0.25 : 0.1
  return 0
}

function layoutNodes(nodes: GraphNodeModel[]): GraphNodeModel[] {
  const grouped = new Map<number, GraphNodeModel[]>()
  for (const node of nodes) {
    const list = grouped.get(node.depth) ?? []
    list.push(node)
    grouped.set(node.depth, list)
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1
      if (!a.isCurrent && b.isCurrent) return 1
      if (a.isCurrentPath && !b.isCurrentPath) return -1
      if (!a.isCurrentPath && b.isCurrentPath) return 1
      if (a.isFrontier && !b.isFrontier) return -1
      if (!a.isFrontier && b.isFrontier) return 1
      return a.id.localeCompare(b.id)
    })
  }

  const horizontalGap = 360
  const verticalGap = 220

  return nodes.map((node) => {
    const list = grouped.get(node.depth) ?? [node]
    const index = list.findIndex((item) => item.id === node.id)
    const centeredY = (index - (list.length - 1) / 2) * verticalGap
    return {
      ...node,
      position: {
        x: node.depth * horizontalGap,
        y: centeredY,
      },
    }
  })
}

export function buildLearningGraphModel(input: {
  progress: ProgressResponse | undefined
  lesson: LessonResponse | undefined
  quiz: QuizResponse | undefined
  nextAction: NextActionResponse | undefined
}): LearningGraphModel {
  const { progress, lesson, quiz, nextAction } = input
  if (!progress) {
    return { nodes: [], edges: [], currentNodeId: null }
  }

  const internalNodes = normalizeNodes(progress)
  const childrenMap = buildChildrenMap(progress, internalNodes)

  for (const id of internalNodes.keys()) {
    resolveDepth(id, internalNodes, new Set<string>())
  }

  const currentPathSet = new Set(progress.current_path ?? [])
  const frontierSet = new Set(progress.active_frontier ?? [])
  const recommendedId = nextAction?.recommended_node ?? null

  const nodes = layoutNodes(
    [...internalNodes.values()].map((node) => {
      const isCurrent = node.id === progress.current_node
      const isFrontier = frontierSet.has(node.id)
      const visualState = resolveVisualState(node.status, isCurrent, isFrontier)
      const lessonSnippet =
        lesson && lesson.node_id === node.id
          ? lesson.tutor_content.explanation.slice(0, 140)
          : 'Open this node to review objective, explanation, examples, and practice.'
      const quizLabel =
        quiz && quiz.node_id === node.id
          ? `${quiz.questions.length} adaptive MCQs ready`
          : 'Quiz unlocks when this node becomes active'

      return {
        id: node.id,
        parentId: node.parentId,
        depth: node.depth ?? 0,
        nodeKind: node.nodeKind ?? 'concept',
        score: node.score ?? null,
        attempts: node.attempts ?? 0,
        progressValue: resolveProgressValue(visualState, node.score, node.attempts),
        visualState,
        isCurrentPath: currentPathSet.has(node.id),
        isFrontier,
        isRecommended: recommendedId === node.id,
        isCurrent,
        learningSnippet: lessonSnippet,
        quizLabel,
        pathFromRoot: node.pathFromRoot ?? inferPath(node.id, internalNodes),
        position: { x: 0, y: 0 },
      }
    }),
  )

  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges: GraphEdgeModel[] = []
  for (const [source, targets] of childrenMap.entries()) {
    if (!nodeIds.has(source)) continue
    for (const target of targets) {
      if (!nodeIds.has(target)) continue
      edges.push({
        id: `edge:${source}->${target}`,
        source,
        target,
        isHighlighted:
          source === progress.current_node ||
          target === progress.current_node ||
          frontierSet.has(target) ||
          recommendedId === target,
      })
    }
  }

  if (edges.length === 0) {
    for (const node of nodes) {
      if (!node.parentId || !nodeIds.has(node.parentId)) continue
      edges.push({
        id: `edge:${node.parentId}->${node.id}`,
        source: node.parentId,
        target: node.id,
        isHighlighted:
          node.parentId === progress.current_node ||
          node.id === progress.current_node ||
          frontierSet.has(node.id) ||
          recommendedId === node.id,
      })
    }
  }

  return {
    nodes,
    edges,
    currentNodeId: progress.current_node,
  }
}
