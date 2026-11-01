import { describe, expect, it } from 'vitest';
import { parseFamilies } from '../data/parseFamilies';
import { realFamilies } from '../test/realData';
import { buildGraph, describePerson, findPath, relatives } from './familyGraph';

const real = () => buildGraph(realFamilies().data);
const fixture = (text: string) => buildGraph(parseFamilies(text).data);

describe('findPath', () => {
  it('finds Manoj to Prem Grenada through the shared parents union', () => {
    expect(findPath(real(), 'ManojDayaram', 'PremGrenada')).toEqual([
      'ManojDayaram', 'union:45', 'VeenaDayaram', 'union:42', 'Nani',
      'union:4', 'PushpaGrenada', 'union:27', 'PremGrenada',
    ]);
  });

  it('returns just the person when from and to are the same', () => {
    expect(findPath(real(), 'ManojDayaram', 'ManojDayaram')).toEqual(['ManojDayaram']);
  });

  it('returns null for an unknown id', () => {
    expect(findPath(real(), 'ManojDayaram', 'Nobody')).toBeNull();
  });

  it('returns null when the person is unreachable', () => {
    const g = fixture('A (M)\nB (F)\n\nC (M)\nD (F)\n');
    expect(findPath(g, 'A', 'C')).toBeNull();
  });

  it('goes through the right union for a second marriage', () => {
    const g = fixture('P (M)\nQ (F)\n\tC1 (M)\n\nP\nR (F)\n\tC2 (F)\n');
    expect(findPath(g, 'C2', 'R')).toEqual(['C2', 'union:1', 'R']);
  });
});

describe('relatives', () => {
  it('lists parents, spouses and children', () => {
    const r = relatives(real(), 'PushpaGrenada');
    expect([...r.parents].sort()).toEqual(['BoolchandMohinani', 'MuliMohinani']);
    expect(r.spouses).toEqual(['PremGrenada']);
    expect(r.children).toEqual(['RaniManghnani', 'RekhaMahtani']);
  });
});

describe('describePerson', () => {
  it('names the parents when there is no spouse', () => {
    expect(describePerson(real(), 'Prem')).toBe('child of Ruki & Jiwatram');
  });

  it('names the spouse first', () => {
    expect(describePerson(real(), 'PremGrenada')).toBe('spouse of Pushpa Grenada');
  });
});
