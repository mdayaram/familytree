import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkExtendedEdge, ElkNode, ElkPort } from 'elkjs/lib/elk-api';
import type { FamilyData } from '../data/types';

export const PERSON_W = 120;
export const PERSON_H = 56;
export const UNION_SIZE = 8;
/** Horizontal gap between partners; the union dot sits in the middle of it. */
export const COUPLE_GAP = 36;

export interface Point {
  x: number;
  y: number;
}

/** Top-left positions keyed by person/union id, and orthogonal routes keyed by `${unionId}->${childId}`. */
export interface Layout {
  positions: Map<string, Point>;
  routes: Map<string, Point[]>;
}

const elk = new ELK();

const LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.mergeEdges': 'true',
  // Keep siblings and households in families.txt order; more passes cut child-to-parent distance ~30%.
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  'elk.layered.thoroughness': '50',
  'elk.spacing.nodeNode': '24',
  'elk.spacing.edgeEdge': '8',
  'elk.layered.spacing.nodeNodeBetweenLayers': '56',
  'elk.layered.spacing.edgeNodeBetweenLayers': '16',
};

/**
 * Groups of people joined by marriage, each in left-to-right order.
 * A group is a connected component of the partner relation (usually a couple;
 * someone married twice sits between both spouses). Unmarried people are singletons.
 */
function partnerGroups(data: FamilyData): string[][] {
  const adj = new Map<string, string[]>();
  for (const id of data.people.keys()) adj.set(id, []);
  for (const u of data.unions) {
    const [a, b] = u.partners;
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }
  const seen = new Set<string>();
  const groups: string[][] = [];
  for (const start of data.people.keys()) {
    if (seen.has(start)) continue;
    // Collect the component, then walk it from an end so chains come out in order.
    const comp: string[] = [];
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const x = stack.pop()!;
      comp.push(x);
      for (const y of adj.get(x)!) if (!seen.has(y)) (seen.add(y), stack.push(y));
    }
    const end = comp.find((x) => adj.get(x)!.length <= 1) ?? comp[0];
    const order: string[] = [];
    const placed = new Set<string>();
    const walk = (x: string) => {
      placed.add(x);
      order.push(x);
      for (const y of adj.get(x)!) if (!placed.has(y)) walk(y);
    };
    walk(end);
    groups.push(order);
  }
  return groups;
}

const memberX = (i: number) => i * (PERSON_W + COUPLE_GAP);

export async function layoutFamily(data: FamilyData): Promise<Layout> {
  const groups = partnerGroups(data);
  const groupOf = new Map<string, { id: string; index: number }>();
  groups.forEach((g, gi) => g.forEach((pid, index) => groupOf.set(pid, { id: `group:${gi}`, index })));

  // Union dot centre, relative to its group: midway between its two partners, on their row.
  const unionOffset = new Map<string, Point>();
  for (const u of data.unions) {
    const [ia, ib] = u.partners.map((p) => groupOf.get(p)!.index);
    const cx = (memberX(Math.min(ia, ib)) + PERSON_W + memberX(Math.max(ia, ib))) / 2;
    unionOffset.set(u.id, { x: cx, y: PERSON_H / 2 });
  }
  const unionsByGroup = new Map<string, string[]>();
  for (const u of data.unions) {
    const gid = groupOf.get(u.partners[0])!.id;
    unionsByGroup.set(gid, [...(unionsByGroup.get(gid) ?? []), u.id]);
  }

  const children: ElkNode[] = groups.map((members, gi) => {
    const id = `group:${gi}`;
    const ports: ElkPort[] = [
      ...members.map((pid, i) => ({
        id: `${pid}:in`,
        x: memberX(i) + PERSON_W / 2,
        y: 0,
        width: 0,
        height: 0,
        layoutOptions: { 'elk.port.side': 'NORTH' },
      })),
      ...(unionsByGroup.get(id) ?? []).map((uid) => ({
        id: `${uid}:out`,
        x: unionOffset.get(uid)!.x,
        y: PERSON_H,
        width: 0,
        height: 0,
        layoutOptions: { 'elk.port.side': 'SOUTH' },
      })),
    ];
    return {
      id,
      width: memberX(members.length - 1) + PERSON_W,
      height: PERSON_H,
      ports,
      layoutOptions: { 'elk.portConstraints': 'FIXED_POS' },
    };
  });

  const edges: ElkExtendedEdge[] = data.unions.flatMap((u) =>
    u.children.map((c) => ({ id: `${u.id}->${c}`, sources: [`${u.id}:out`], targets: [`${c}:in`] })),
  );

  const result = await elk.layout({ id: 'root', layoutOptions: LAYOUT_OPTIONS, children, edges });

  const positions = new Map<string, Point>();
  const groupPos = new Map((result.children ?? []).map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]));
  groups.forEach((members, gi) => {
    const g = groupPos.get(`group:${gi}`)!;
    members.forEach((pid, i) => positions.set(pid, { x: g.x + memberX(i), y: g.y }));
  });
  for (const u of data.unions) {
    const g = groupPos.get(groupOf.get(u.partners[0])!.id)!;
    const o = unionOffset.get(u.id)!;
    positions.set(u.id, { x: g.x + o.x - UNION_SIZE / 2, y: g.y + o.y - UNION_SIZE / 2 });
  }

  const routes = new Map<string, Point[]>();
  for (const e of result.edges ?? []) {
    const s = e.sections?.[0];
    if (s) routes.set(e.id, [s.startPoint, ...(s.bendPoints ?? []), s.endPoint]);
  }
  return { positions, routes };
}
