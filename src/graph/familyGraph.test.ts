import { describe, expect, it } from 'vitest';
import { parseFamilies } from '../data/parseFamilies';
import { realFamilies } from '../test/realData';
import { buildGraph, describePerson, findPath, relatives } from './familyGraph';

const real = () => buildGraph(realFamilies().data);
const fixture = (text: string) => buildGraph(parseFamilies(text).data);

describe('findPath', () => {
  it('finds Manoj to Prem Chandiramani through the shared parents union', () => {
    const g = real();
    const path = findPath(g, 'ManojDayaram', 'prem_chandiramani_grenada')!;
    // Compare people only: union ids are numbered by file position and shift when households are added.
    expect(path.filter((id) => !id.startsWith('union:'))).toEqual([
      'ManojDayaram', 'VeenaDayaram', 'Nani', 'PushpaChandiramani', 'prem_chandiramani_grenada',
    ]);
    // Nani and Pushpa connect through their parents' union (Muli + Boolchand), not through Muli.
    const parents = g.data.unions.find((u) => u.children.includes('Nani') && u.children.includes('PushpaChandiramani'))!;
    expect(parents.partners).toContain('MuliMohinani');
    expect(path).toContain(parents.id);
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
    const r = relatives(real(), 'PushpaChandiramani');
    expect([...r.parents].sort()).toEqual(['BoolchandMohinani', 'MuliMohinani']);
    expect(r.spouses).toEqual(['prem_chandiramani_grenada']);
    expect(r.children).toEqual(['RaniManghnani', 'RekhaMahtani']);
  });
});

describe('describePerson', () => {
  it('names the parents when there is no spouse', () => {
    expect(describePerson(real(), 'Prem')).toBe('child of Ruki & Jiwatram');
  });

  it('skips an unknown spouse in favour of named parents', () => {
    const g = fixture('X (id=h, M)\nKiran (F)\n\tKid (F)\n\nP One (M)\nP Two (F)\n\tKiran\n');
    expect(describePerson(g, 'Kiran')).toBe('child of P One & P Two');
  });

  it('leaves out unknown parents and gives no hint when every relative is unknown', () => {
    expect(describePerson(fixture('Dad (M)\nX (id=m, F)\n\tKid (F)\n'), 'Kid')).toBe('child of Dad');
    expect(describePerson(fixture('X (id=a, M)\nX (id=b, F)\n\tSolo (F)\n'), 'Solo')).toBe('');
  });

  it('names the spouse first', () => {
    expect(describePerson(real(), 'prem_chandiramani_grenada')).toBe('spouse of Pushpa Chandiramani');
  });
});
