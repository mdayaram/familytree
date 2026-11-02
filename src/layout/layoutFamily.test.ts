import { describe, expect, it } from 'vitest';
import { parseFamilies } from '../data/parseFamilies';
import { realFamilies } from '../test/realData';
import { layoutFamily, PERSON_W } from './layoutFamily';

describe('layoutFamily', () => {
  it('positions everyone, with couples side by side and children below', async () => {
    const { data } = realFamilies();
    const { positions } = await layoutFamily(data);

    for (const id of data.people.keys()) expect(positions.has(id), id).toBe(true);
    for (const u of data.unions) {
      const [a, b] = u.partners.map((p) => positions.get(p)!);
      const un = positions.get(u.id)!;
      expect(a.y, `${u.id} partners on one row`).toBe(b.y);
      const [left, right] = a.x < b.x ? [a, b] : [b, a];
      expect(un.x, `${u.id} union right of left partner`).toBeGreaterThan(left.x + PERSON_W - 1);
      expect(un.x, `${u.id} union left of right partner`).toBeLessThan(right.x);
      for (const c of u.children) expect(positions.get(c)!.y, `${c} below ${u.id}`).toBeGreaterThan(a.y);
    }
  }, 30_000);

  it('routes every union-to-child line', async () => {
    const { data } = realFamilies();
    const { routes } = await layoutFamily(data);
    for (const u of data.unions) {
      for (const c of u.children) expect(routes.get(`${u.id}->${c}`)?.length ?? 0, `${u.id}->${c}`).toBeGreaterThanOrEqual(2);
    }
  }, 30_000);

  it('keeps a person with two marriages in one row between both spouses', async () => {
    const { data } = parseFamilies('P (M)\nQ (F)\n\tC1 (M)\n\nP\nR (F)\n\tC2 (F)\n');
    const { positions } = await layoutFamily(data);
    const [q, p, r] = ['Q', 'P', 'R'].map((id) => positions.get(id)!);
    expect(new Set([q.y, p.y, r.y]).size).toBe(1);
    expect(Math.min(q.x, r.x)).toBeLessThan(p.x);
    expect(Math.max(q.x, r.x)).toBeGreaterThan(p.x);
  });
});
