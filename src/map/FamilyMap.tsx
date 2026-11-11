import { MiniMap, ReactFlow, useReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useRef } from 'react';
import { PERSON_H, PERSON_W } from '../layout/layoutFamily';
import { PersonNode } from './PersonNode';
import { RoutedEdge } from './RoutedEdge';
import { PATH_COLOR, type FamilyEdgeData, type FamilyFlowNode } from './toFlow';
import { UnionNode } from './UnionNode';
import { MOBILE_QUERY, useMediaQuery } from '../useMediaQuery';

const nodeTypes = { person: PersonNode, union: UnionNode };
const edgeTypes = { routed: RoutedEdge };

const FLY_MS = 600;
/** A wide strip, matching the tree's very wide shape. */
const MINIMAP_SIZE = { width: 520, height: 56 };
const MINIMAP_SIZE_MOBILE = { width: 200, height: 32 };

/** Who to fly to; `seq` changes on every request so re-picking the same person flies again. */
export interface Focus {
  id: string;
  seq: number;
}

/** Where a freshly mounted map starts: fitted to everything (path view) or centred on a person. */
export type InitialView = { fit: true } | { centerId: string };

export interface FamilyMapProps {
  nodes: FamilyFlowNode[];
  edges: Edge<FamilyEdgeData>[];
  onSelect(id: string): void;
  /** Clicking empty map space. */
  onClear(): void;
  focus: Focus | null;
  initialView: InitialView;
}

function miniMapColor(node: Node): string {
  const n = node as FamilyFlowNode;
  if (n.data.onPath) return PATH_COLOR;
  return n.type === 'union' ? 'transparent' : n.data.faded ? '#d5d9de' : '#6b7480';
}

export function FamilyMap({ nodes, edges, onSelect, onClear, focus, initialView }: FamilyMapProps) {
  const rf = useReactFlow();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const centerOn = (id: string, zoom: number, duration: number) => {
    const n = nodesRef.current.find((x) => x.id === id);
    if (n) void rf.setCenter(n.position.x + PERSON_W / 2, n.position.y + PERSON_H / 2, { zoom, duration });
  };

  // A remounted map starts from `initialView`; only later focus requests fly.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (focus) centerOn(focus.id, Math.max(rf.getZoom(), 1), FLY_MS);
    // Fly only when a new focus is requested, not when nodes restyle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

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
      onInit={() => {
        if ('fit' in initialView) void rf.fitView({ padding: 0.15, maxZoom: 1 });
        else centerOn(initialView.centerId, 1, 0);
      }}
      onNodeClick={(_, node) => {
        if (node.type === 'person') onSelect(node.id);
      }}
      onPaneClick={onClear}
    >
      <MiniMap
        pannable
        zoomable
        // Clicking jumps there; dragging pans.
        onClick={(_, pos) => void rf.setCenter(pos.x, pos.y, { zoom: rf.getZoom(), duration: FLY_MS })}
        position="bottom-right" nodeColor={miniMapColor} nodeStrokeWidth={0} nodeBorderRadius={0} maskColor="rgba(240, 240, 240, 0.55)" maskStrokeColor="#6b7480" maskStrokeWidth={1.5} ariaLabel="Whole family tree" style={mobile ? MINIMAP_SIZE_MOBILE : MINIMAP_SIZE} />
    </ReactFlow>
  );
}
