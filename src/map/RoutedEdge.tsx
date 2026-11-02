import { BaseEdge, getSmoothStepPath, type Edge, type EdgeProps } from '@xyflow/react';
import type { FamilyEdgeData } from './toFlow';

/** Draws the orthogonal route computed by ELK; falls back to a smooth step without one. */
export function RoutedEdge(props: EdgeProps<Edge<FamilyEdgeData, 'routed'>>) {
  const pts = props.data?.points;
  const path =
    pts && pts.length >= 2
      ? pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')
      : getSmoothStepPath(props)[0];
  return <BaseEdge id={props.id} path={path} style={props.style} />;
}
