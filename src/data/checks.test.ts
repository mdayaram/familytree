import { describe, expect, it } from 'vitest';
import { realFamilies } from '../test/realData';
import { checkFamilies } from './checks';
import { parseFamilies } from './parseFamilies';

const check = (text: string) => checkFamilies(parseFamilies(text).data);
const matching = (issues: ReturnType<typeof check>, re: RegExp) => issues.filter((i) => re.test(i.message));

describe('checkFamilies', () => {
  it('reports a person with no gender as an error on their line', () => {
    const issues = check('A (M)\nB (F)\n\tNoGender\n');
    const errors = issues.filter((i) => i.severity === 'error');
    expect(errors).toHaveLength(1);
    expect(errors[0].line).toBe(3);
  });

  it('warns about a child listed twice in one household', () => {
    const issues = check('A (M)\nB (F)\n\tX (id=k, M)\n\tX (id=k, M)\n');
    expect(matching(issues, /listed twice/)).toHaveLength(1);
  });

  it('warns when a later mention disagrees about being deceased', () => {
    const issues = check('X (id=a, F, deathday=x)\nB (M)\n\nX (id=a, F)\nC (M)\n');
    expect(matching(issues, /conflicts/)).toHaveLength(1);
  });

  it('warns about a possible merge when a name is defined twice', () => {
    const merged = check('Pushpa (F)\nPrem (M)\n\nRuki (F)\nJiwatram (M)\n\tPrem (M)\n');
    expect(matching(merged, /two different people/)).toHaveLength(1);
    const reference = check('Pushpa (F)\nPrem (M)\n\nRuki (F)\nJiwatram (M)\n\tPrem\n');
    expect(matching(reference, /two different people/)).toHaveLength(0);
  });

  it('does not flag two people who share a name but have different ids', () => {
    const issues = check('Sita (F)\nPrem Chandiramani (M)\n\nPushpa (F)\nPrem Chandiramani (id=prem_2, M)\n');
    expect(issues).toEqual([]);
  });

  it('warns when someone is a child in two households', () => {
    const issues = check('A (M)\nB (F)\n\tK (M)\n\nC (M)\nD (F)\n\tK\n');
    expect(matching(issues, /two sets of parents/)).toHaveLength(1);
  });

  it('finds no errors in the real data', () => {
    // The deploy gate: errors would replace the map. Warnings don't block.
    expect(checkFamilies(realFamilies().data).filter((i) => i.severity === 'error')).toEqual([]);
  });
});
