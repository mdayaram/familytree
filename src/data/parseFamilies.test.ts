import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFamilies } from './parseFamilies';

const realText = () => readFileSync(resolve(__dirname, '../../families.txt'), 'utf8');

describe('parseFamilies', () => {
  it('parses partners, separated flag and children', () => {
    const { data } = parseFamilies('A B (M)\nC D (F)\nS\n\tE F (F)\n');
    expect(data.unions[0]).toMatchObject({
      id: 'union:0',
      partners: ['AB', 'CD'],
      separated: true,
      children: ['EF'],
    });
    expect(data.people.get('EF')?.gender).toBe('F');
  });

  it('reuses a person across households by id', () => {
    const { data } = parseFamilies('P (M)\nQ (F)\n\tKid One (F)\n\nKid One\nSpouse (M)\n\tGrand (M)\n');
    const kid = data.people.get('KidOne');
    expect([...data.people.keys()].filter((k) => k === 'KidOne')).toHaveLength(1);
    expect(kid?.mentions.map((m) => m.role)).toEqual(['child', 'partner']);
  });

  it('first mention wins', () => {
    const { data } = parseFamilies('X (id=a, F, deathday=x)\nB (M)\n\nX (id=a, F)\nC (M)\n');
    expect(data.people.get('a')?.deceased).toBe(true);
  });

  it('strips spaces and hyphens to make the default id', () => {
    const { data } = parseFamilies('Mary-Jane Doe (F)\nJohn Doe (M)\n');
    expect(data.people.has('MaryJaneDoe')).toBe(true);
  });

  it('ignores comments and accepts CRLF and mixed indentation', () => {
    const clean = 'A (M)\nB (F)\n\tC (F)\n\nC\nD (M)\n\tE (M)\n';
    const messy =
      '# comment\r\nA (M)\r\nB (F)\r\n\tC (F)\r\n\r\n\r\n# another\r\nC\r\nD (M)\r\n  E (M)\r\n';
    const a = parseFamilies(clean).data;
    const b = parseFamilies(messy).data;
    const shape = (d: typeof a) => ({
      unions: d.unions.map(({ partners, children, separated }) => ({ partners, children, separated })),
      people: [...d.people.values()].map(({ id, name, gender, deceased }) => ({ id, name, gender, deceased })),
    });
    expect(shape(b)).toEqual(shape(a));
  });

  it('two marriages make two unions', () => {
    const { data } = parseFamilies('P (M)\nQ (F)\n\tC1 (M)\n\nP\nR (F)\n\tC2 (F)\n');
    expect(data.unions).toHaveLength(2);
    expect(data.unions.every((u) => u.partners.includes('P'))).toBe(true);
    expect(data.unions[0].children).toEqual(['C1']);
    expect(data.unions[1].children).toEqual(['C2']);
  });

  it('parses the real families.txt', () => {
    const { data, issues } = parseFamilies(realText());
    expect(issues.filter((i) => i.severity === 'error')).toEqual([]);
    // Floors, not exact counts: the family grows and CI must not block on ordinary edits.
    expect(data.people.size).toBeGreaterThanOrEqual(246);
    expect(data.unions.length).toBeGreaterThanOrEqual(78);
    const has = (a: string, b: string) =>
      data.unions.find((u) => u.partners.includes(a) && u.partners.includes(b));
    expect(has('PushpaGrenada', 'PremGrenada')).toBeDefined();
    expect(has('Ruki', 'Jiwatram')?.children).toContain('Prem');
  });
});
