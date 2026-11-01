import { describe, expect, it } from 'vitest';
import { parseFamilies } from '../data/parseFamilies';
import { PERSON_H, PERSON_W, UNION_SIZE, type Layout } from '../layout/layoutFamily';
import { toFlow } from './toFlow';

const { data } = parseFamilies('A (M)\nB (F)\n\tC (F)\n');
const layout: Layout = { positions: new Map(), routes: new Map() };

describe('toFlow', () => {
  it('gives every node its fixed size so the mini-map can draw it', () => {
    const { nodes } = toFlow(data, layout, { nodeIds: new Set(), selectedId: null });
    for (const n of nodes) {
      const [w, h] = n.type === 'person' ? [PERSON_W, PERSON_H] : [UNION_SIZE, UNION_SIZE];
      expect([n.width, n.height], n.id).toEqual([w, h]);
    }
  });

  it('marks path nodes and edges and fades the rest', () => {
    const { nodes, edges } = toFlow(data, layout, { nodeIds: new Set(['A', 'union:0', 'C']), selectedId: 'C' });
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(byId.get('A')!.data.onPath).toBe(true);
    expect(byId.get('B')!.data.faded).toBe(true);
    expect(edges.find((e) => e.id === 'union:0->C')!.data!.onPath).toBe(true);
    expect(edges.find((e) => e.id === 'B->union:0')!.data!.onPath).toBe(false);
  });
});
