import type { Edge, Node } from '@xyflow/react';
import type { FamilyData, Person } from '../data/types';
import { PERSON_H, PERSON_W, UNION_SIZE, type Layout, type Point } from '../layout/layoutFamily';

/** Ids on the current path (empty = no path), plus the selected person. */
export interface Highlight {
  nodeIds: Set<string>;
  selectedId: string | null;
}

export interface PersonNodeData extends Record<string, unknown> {
  person: Person;
  onPath: boolean;
  faded: boolean;
  selected: boolean;
}

export interface UnionNodeData extends Record<string, unknown> {
  onPath: boolean;
  faded: boolean;
  separated: boolean;
}

export type PersonFlowNode = Node<PersonNodeData, 'person'>;
export type UnionFlowNode = Node<UnionNodeData, 'union'>;
export type FamilyFlowNode = PersonFlowNode | UnionFlowNode;

export interface FamilyEdgeData extends Record<string, unknown> {
  onPath: boolean;
  /** Orthogonal route from the layout, for union->child edges. */
  points?: Point[];
}

export const PATH_COLOR = '#d33';

export function toFlow(data: FamilyData, layout: Layout, h: Highlight): { nodes: FamilyFlowNode[]; edges: Edge<FamilyEdgeData>[] } {
  const showingPath = h.nodeIds.size > 0;
  const on = (id: string) => h.nodeIds.has(id);
  const pos = (id: string) => layout.positions.get(id) ?? { x: 0, y: 0 };

  const nodes: FamilyFlowNode[] = [
    ...[...data.people.values()].map((person): PersonFlowNode => ({
      id: person.id,
      type: 'person',
      position: pos(person.id),
      // Fixed sizes: React Flow (and its mini-map) can use them without measuring.
      width: PERSON_W,
      height: PERSON_H,
      data: { person, onPath: on(person.id), faded: showingPath && !on(person.id), selected: h.selectedId === person.id },
    })),
    ...data.unions.map((u): UnionFlowNode => ({
      id: u.id,
      type: 'union',
      position: pos(u.id),
      width: UNION_SIZE,
      height: UNION_SIZE,
      data: { onPath: on(u.id), faded: showingPath && !on(u.id), separated: u.separated },
    })),
  ];

  // On a shortest path, two adjacent graph nodes that are both on the path are always
  // consecutive on it (otherwise the path would have a shortcut), so set membership suffices.
  const style = (onPath: boolean, dashed: boolean) => ({
    stroke: onPath ? PATH_COLOR : '#9aa3ad',
    strokeWidth: onPath ? 3 : 1.25,
    strokeDasharray: dashed ? '5 4' : undefined,
    opacity: showingPath && !onPath ? 0.2 : 1,
  });

  const edges: Edge<FamilyEdgeData>[] = data.unions.flatMap((u) => {
    const ux = pos(u.id).x;
    // Couple links are short horizontal lines from each partner's facing side into the union dot.
    const partnerEdges = u.partners.map((p): Edge<FamilyEdgeData> => {
      const onPath = on(p) && on(u.id);
      const leftOfUnion = pos(p).x < ux;
      return {
        id: `${p}->${u.id}`,
        source: p,
        sourceHandle: leftOfUnion ? 'right' : 'left',
        target: u.id,
        targetHandle: leftOfUnion ? 'l' : 'r',
        type: 'straight',
        data: { onPath },
        style: style(onPath, u.separated),
        zIndex: onPath ? 1 : 0,
      };
    });
    const childEdges = u.children.map((c): Edge<FamilyEdgeData> => {
      const id = `${u.id}->${c}`;
      const onPath = on(u.id) && on(c);
      return {
        id,
        source: u.id,
        sourceHandle: 'bottom',
        target: c,
        targetHandle: 'top',
        type: 'routed',
        data: { onPath, points: layout.routes.get(id) },
        style: style(onPath, false),
        zIndex: onPath ? 1 : 0,
      };
    });
    return [...partnerEdges, ...childEdges];
  });

  return { nodes, edges };
}
