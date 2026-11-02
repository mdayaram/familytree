import type { FamilyData, Person } from '../data/types';

/** Bipartite graph: person ids and union ids, partner<->union and union<->child. */
export interface FamilyGraph {
  data: FamilyData;
  adj: Map<string, string[]>;
}

export function buildGraph(data: FamilyData): FamilyGraph {
  const adj = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  };
  for (const id of data.people.keys()) adj.set(id, []);
  for (const u of data.unions) {
    for (const p of u.partners) link(p, u.id);
    for (const c of u.children) link(u.id, c);
  }
  return { data, adj };
}

/** Shortest path of alternating person/union ids, inclusive. Null when unknown or unreachable. */
export function findPath(g: FamilyGraph, fromId: string, toId: string): string[] | null {
  if (!g.data.people.has(fromId) || !g.data.people.has(toId)) return null;
  const prev = new Map<string, string | null>([[fromId, null]]);
  const queue = [fromId];
  for (let i = 0; i < queue.length && !prev.has(toId); i++) {
    for (const next of g.adj.get(queue[i]) ?? []) {
      if (prev.has(next)) continue;
      prev.set(next, queue[i]);
      queue.push(next);
    }
  }
  if (!prev.has(toId)) return null;
  const path: string[] = [];
  for (let cur: string | null = toId; cur !== null; cur = prev.get(cur) ?? null) path.push(cur);
  return path.reverse();
}

export function displayName(p: Person): string {
  return p.name === 'X' ? 'Unknown' : p.name;
}

export function relatives(g: FamilyGraph, id: string): { parents: string[]; spouses: string[]; children: string[] } {
  const parents: string[] = [];
  const spouses: string[] = [];
  const children: string[] = [];
  for (const u of g.data.unions) {
    if (u.children.includes(id)) parents.push(...u.partners);
    if (u.partners.includes(id)) {
      spouses.push(...u.partners.filter((p) => p !== id));
      children.push(...u.children);
    }
  }
  return { parents, spouses, children };
}

/** Short hint to tell same-named people apart, e.g. in search results. */
export function describePerson(g: FamilyGraph, id: string): string {
  const name = (pid: string) => {
    const p = g.data.people.get(pid);
    return p ? displayName(p) : pid;
  };
  // Unknown (X) relatives tell same-named people apart no better than nothing, so skip them.
  const known = (ids: string[]) => ids.filter((pid) => g.data.people.get(pid)?.name !== 'X');
  const r = relatives(g, id);
  const spouses = known(r.spouses);
  const parents = known(r.parents);
  if (spouses.length) return `spouse of ${name(spouses[0])}`;
  if (parents.length) return `child of ${parents.map(name).join(' & ')}`;
  return '';
}
