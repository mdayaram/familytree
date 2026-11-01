import { ReactFlow, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PersonNode } from './PersonNode';
import { RoutedEdge } from './RoutedEdge';
import { UnionNode } from './UnionNode';
import type { FamilyEdgeData, FamilyFlowNode } from './toFlow';

const nodeTypes = { person: PersonNode, union: UnionNode };
const edgeTypes = { routed: RoutedEdge };

export interface FamilyMapProps {
  nodes: FamilyFlowNode[];
  edges: Edge<FamilyEdgeData>[];
  onSelect(id: string): void;
  focusId: string | null;
}

export function FamilyMap({ nodes, edges, onSelect }: FamilyMapProps) {
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
      fitView
      onNodeClick={(_, node) => {
        if (node.type === 'person') onSelect(node.id);
      }}
    />
  );
}
