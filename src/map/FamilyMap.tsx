import { MiniMap, ReactFlow, useReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useRef } from 'react';
import { DEFAULT_PATH_FROM_ID } from '../config';
import { PERSON_H, PERSON_W } from '../layout/layoutFamily';
import { PersonNode } from './PersonNode';
import { RoutedEdge } from './RoutedEdge';
import { PATH_COLOR, type FamilyEdgeData, type FamilyFlowNode } from './toFlow';
import { UnionNode } from './UnionNode';

const nodeTypes = { person: PersonNode, union: UnionNode };
const edgeTypes = { routed: RoutedEdge };

const FLY_MS = 600;
/** A wide strip, matching the tree's very wide shape. */
const MINIMAP_SIZE = { width: 520, height: 56 };

export interface FamilyMapProps {
  nodes: FamilyFlowNode[];
  edges: Edge<FamilyEdgeData>[];
  onSelect(id: string): void;
  focusId: string | null;
}

function miniMapColor(node: Node): string {
  const n = node as FamilyFlowNode;
  if (n.data.onPath) return PATH_COLOR;
  return n.type === 'union' ? 'transparent' : n.data.faded ? '#d5d9de' : '#6b7480';
}

export function FamilyMap({ nodes, edges, onSelect, focusId }: FamilyMapProps) {
  const rf = useReactFlow();
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const centerOn = (id: string, zoom: number, duration: number) => {
    const n = nodesRef.current.find((x) => x.id === id);
    if (n) void rf.setCenter(n.position.x + PERSON_W / 2, n.position.y + PERSON_H / 2, { zoom, duration });
  };

  useEffect(() => {
    if (focusId) centerOn(focusId, Math.max(rf.getZoom(), 1), FLY_MS);
    // Fly only when the focus changes, not when nodes restyle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      minZoom={0.05}
      maxZoom={2.5}
      onInit={() => centerOn(DEFAULT_PATH_FROM_ID, 1, 0)}
      onNodeClick={(_, node) => {
        if (node.type === 'person') onSelect(node.id);
      }}
    >
      <MiniMap pannable zoomable position="bottom-right" nodeColor={miniMapColor} nodeStrokeWidth={0} nodeBorderRadius={0} maskColor="rgba(240, 240, 240, 0.55)" maskStrokeColor="#6b7480" maskStrokeWidth={1.5} ariaLabel="Whole family tree" style={MINIMAP_SIZE} />
    </ReactFlow>
  );
}
