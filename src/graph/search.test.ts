import { describe, expect, it } from 'vitest';
import { realFamilies } from '../test/realData';
import { buildGraph } from './familyGraph';
import { searchPeople } from './search';

const g = buildGraph(realFamilies().data);

describe('searchPeople', () => {
  it('lists every Prem with a hint', () => {
    const results = searchPeople(g, 'prem');
    expect(results.map((r) => r.id).sort()).toEqual(['Prem', 'PremChandiramani', 'prem_chandiramani_grenada']);
    expect(results.every((r) => r.hint.length > 0)).toBe(true);
  });

  it('tells apart two people with the same name and different ids by their hints', () => {
    const both = searchPeople(g, 'prem chandiramani');
    expect(both.map((r) => r.name)).toEqual(['Prem Chandiramani', 'Prem Chandiramani']);
    expect(both.map((r) => r.hint).sort()).toEqual(['spouse of Pushpa Chandiramani', 'spouse of Sita Chandiramani']);
  });

  it('matches multiple word prefixes, case-insensitively', () => {
    expect(searchPeople(g, 'PREM chand')[0].name).toBe('Prem Chandiramani');
  });

  it('never returns unknown X people', () => {
    expect(searchPeople(g, 'x').some((r) => r.name === 'X' || r.name === 'Unknown')).toBe(false);
  });

  it('returns nothing for an empty query', () => {
    expect(searchPeople(g, '')).toEqual([]);
    expect(searchPeople(g, '   ')).toEqual([]);
  });

  it('ranks an exact full-name match first', () => {
    expect(searchPeople(g, 'prem')[0].id).toBe('Prem');
  });

  it('ignores accents', () => {
    expect(searchPeople(g, 'prém chandiramani')[0].name).toBe('Prem Chandiramani');
  });
});
