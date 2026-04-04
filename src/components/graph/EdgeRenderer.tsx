import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'

export function EdgeRenderer({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
}: EdgeProps) {
  const edgeData = data as { isHighlighted?: boolean } | undefined
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.42,
  })

  const stroke = edgeData?.isHighlighted ? 'oklch(0.78 0.14 175 / 0.65)' : 'oklch(1 0 0 / 0.2)'

  return (
    <>
      <BaseEdge
        id={String(id)}
        path={path}
        style={{ stroke, strokeWidth: edgeData?.isHighlighted ? 2 : 1.2 }}
      />
      {edgeData?.isHighlighted ? (
        <path
          d={path}
          className="graph-edge-flow"
          style={{
            fill: 'none',
            stroke: 'oklch(0.72 0.17 265 / 0.75)',
            strokeWidth: 1.6,
            strokeLinecap: 'round',
          }}
        />
      ) : null}
    </>
  )
}
