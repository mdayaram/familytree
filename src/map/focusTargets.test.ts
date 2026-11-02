import { describe, expect, it } from 'vitest';
import { focusTargets } from './focusTargets';

describe('focusTargets', () => {
  it('fits the whole path when there is one', () => {
    expect(focusTargets(['A', 'union:0', 'B', 'union:1', 'C'], 'C')).toEqual(['A', 'union:0', 'B', 'union:1', 'C']);
  });

  it('focuses only the selected person when there is no path', () => {
    expect(focusTargets(null, 'C')).toEqual(['C']);
  });

  it('focuses only the selected person when they are the path-from person', () => {
    expect(focusTargets(['C'], 'C')).toEqual(['C']);
  });
});
