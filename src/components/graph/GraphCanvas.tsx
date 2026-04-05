import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { GraphEdgeModel, GraphNodeModel } from '../../lib/learningGraph'
import { EdgeRenderer } from './EdgeRenderer'
import { NodeCard } from './NodeCard'

type GraphCanvasProps = {
  nodes: GraphNodeModel[]
  edges: GraphEdgeModel[]
  selectedNodeId: string | null
  onSelectNode: (nodeId: string) => void
  onDeleteNode?: (nodeId: string) => void
  onHoverNode?: (nodeId: string | null) => void
  className?: string
}

const nodeTypes = {
  learningNode: NodeCard,
}

const edgeTypes = {
  premium: EdgeRenderer,
}

function GraphCanvasInner({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onDeleteNode,
  onHoverNode,
  className,
}: GraphCanvasProps) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const positionScale = isMobile ? 0.62 : 1

  const derivedNodes = useMemo<Array<Node>>(
    () =>
      nodes.map((node) => ({
        id: node.id,
        type: 'learningNode',
        position: {
          x: node.position.x * positionScale,
          y: node.position.y * positionScale,
        },
        data: {
          ...node,
          onOpenNode: onSelectNode,
          onDeleteNode,
        } as Record<string, unknown>,
        draggable: true,
        selectable: true,
        selected: selectedNodeId === node.id,
      })),
    [nodes, onDeleteNode, onSelectNode, positionScale, selectedNodeId],
  )

  const derivedEdges = useMemo<Array<Edge>>(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'premium',
        data: { isHighlighted: edge.isHighlighted } as Record<string, unknown>,
      })),
    [edges],
  )

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([])
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    setRfNodes((prev) => {
      const prevById = new Map(prev.map((node) => [node.id, node]))
      return derivedNodes.map((nextNode) => {
        const existing = prevById.get(nextNode.id)
        if (!existing) return nextNode
        return {
          ...nextNode,
          position: existing.position,
        }
      })
    })
  }, [derivedNodes, setRfNodes])

  useEffect(() => {
    setRfEdges(derivedEdges)
  }, [derivedEdges, setRfEdges])

  return (
    <div
      className={`h-[72vh] min-h-[560px] w-full rounded-3xl border border-border/70 bg-card/35 ${className ?? ''}`}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onNodeMouseEnter={onHoverNode ? (_, node) => onHoverNode(node.id) : undefined}
        onNodeMouseLeave={onHoverNode ? () => onHoverNode(null) : undefined}
        fitView
        fitViewOptions={{
          padding: isMobile ? 0.08 : 0.2,
          minZoom: isMobile ? 0.6 : 0.55,
          maxZoom: isMobile ? 1.2 : 1.25,
        }}
        minZoom={isMobile ? 0.5 : 0.35}
        maxZoom={1.8}
        panOnScroll
        panOnDrag
        nodesDraggable
        selectionOnDrag={false}
        zoomOnPinch
        proOptions={{ hideAttribution: true }}
      >
        <Background
          gap={26}
          size={1.2}
          color="oklch(1 0 0 / 0.08)"
          style={{ backgroundColor: 'transparent' }}
        />
        <MiniMap
          className="!hidden md:!block"
          zoomable
          pannable
          nodeStrokeColor="oklch(1 0 0 / 0.28)"
          nodeColor="oklch(0.25 0.03 265 / 0.8)"
          maskColor="oklch(0.13 0.02 270 / 0.75)"
          style={{
            backgroundColor: 'oklch(0.14 0.02 270 / 0.7)',
            border: '1px solid oklch(1 0 0 / 0.12)',
          }}
        />
        <Controls
          className="!bottom-3 !left-3 !right-auto md:!bottom-4 md:!left-4"
          showInteractive={false}
          style={{
            backgroundColor: 'oklch(0.14 0.02 270 / 0.7)',
            border: '1px solid oklch(1 0 0 / 0.16)',
            borderRadius: 12,
          }}
        />
      </ReactFlow>
    </div>
  )
}

export function GraphCanvas(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
