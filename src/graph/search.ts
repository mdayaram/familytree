import { describePerson, displayName, type FamilyGraph } from './familyGraph';

export interface SearchResult {
  id: string;
  name: string;
  hint: string;
}

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
const words = (s: string) => fold(s).split(/\s+/).filter(Boolean);

/** Every query word must start some word of the name. Unknown (X) people are excluded. */
export function searchPeople(g: FamilyGraph, query: string, limit = 10): SearchResult[] {
  const q = words(query);
  if (!q.length) return [];
  const fullQuery = q.join(' ');

  const scored: { r: SearchResult; rank: number }[] = [];
  for (const p of g.data.people.values()) {
    if (p.name === 'X') continue;
    const nameWords = words(p.name);
    if (!q.every((qw) => nameWords.some((nw) => nw.startsWith(qw)))) continue;
    // 0 exact full name, 1 every query word is a whole word of the name, 2 prefix match.
    const rank = nameWords.join(' ') === fullQuery ? 0 : q.every((qw) => nameWords.includes(qw)) ? 1 : 2;
    scored.push({ r: { id: p.id, name: displayName(p), hint: describePerson(g, p.id) }, rank });
  }
  scored.sort((a, b) => a.rank - b.rank || a.r.name.localeCompare(b.r.name));
  return scored.slice(0, limit).map((s) => s.r);
}
