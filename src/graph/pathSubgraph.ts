import type { FamilyData, Person } from '../data/types';

/**
 * The slice of the family shown in path view: everyone on the path, plus both partners
 * of each couple the path passes through (so a couple point never stands alone).
 * Union ids match the full tree; each union keeps only the children on the path.
 */
export function pathSubgraph(data: FamilyData, path: string[]): FamilyData {
  const onPath = new Set(path);
  const unions = data.unions
    .filter((u) => onPath.has(u.id))
    .map((u) => ({ ...u, children: u.children.filter((c) => onPath.has(c)) }));

  const ids = new Set(path.filter((id) => data.people.has(id)));
  for (const u of unions) u.partners.forEach((p) => ids.add(p));

  const people = new Map<string, Person>();
  for (const [id, p] of data.people) if (ids.has(id)) people.set(id, p);
  return { people, unions };
}
