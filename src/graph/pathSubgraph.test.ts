import { describe, expect, it } from 'vitest';
import { parseFamilies } from '../data/parseFamilies';
import { realFamilies } from '../test/realData';
import { buildGraph, findPath } from './familyGraph';
import { pathSubgraph } from './pathSubgraph';

describe('pathSubgraph', () => {
  it('keeps the path people, both partners of each couple on it, and only path children', () => {
    const { data } = realFamilies();
    const path = findPath(buildGraph(data), 'ManojDayaram', 'prem_chandiramani_grenada')!;
    const sub = pathSubgraph(data, path);

    expect([...sub.people.keys()].sort()).toEqual(
      ['BoolchandMohinani', 'GulDayaram', 'ManojDayaram', 'MuliMohinani', 'Nani', 'prem_chandiramani_grenada', 'PushpaChandiramani', 'VeenaDayaram', 'nani_husband'].sort(),
    );
    // Same union ids as the full tree, children cut down to path members.
    expect(sub.unions.map((u) => u.id).sort()).toEqual(path.filter((id) => id.startsWith('union:')).sort());
    const muli = sub.unions.find((u) => u.partners.includes('MuliMohinani'))!;
    expect(muli.children.sort()).toEqual(['Nani', 'PushpaChandiramani']);
    for (const u of sub.unions) for (const c of u.children) expect(path).toContain(c);
  });

  it('keeps the separated flag of a couple on the path', () => {
    const { data } = parseFamilies('A (M)\nB (F)\nS\n\tC (F)\n\tD (M)\n');
    const sub = pathSubgraph(data, ['C', 'union:0', 'A']);
    expect(sub.unions[0]).toMatchObject({ separated: true, partners: ['A', 'B'], children: ['C'] });
    expect([...sub.people.keys()].sort()).toEqual(['A', 'B', 'C']);
  });
});
