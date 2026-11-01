import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { parseFamilies } from './data/parseFamilies';
import { buildGraph } from './graph/familyGraph';

vi.mock('./data/loadFamilies', () => {
  const { data } = parseFamilies('A (M)\nB (F)\n\tNoGender\n');
  return {
    loadFamilies: () => ({
      data,
      graph: buildGraph(data),
      issues: [{ severity: 'error', line: 3, message: '"NoGender" has no gender — add (M) or (F)' }],
    }),
  };
});

const { App } = await import('./App');

describe('App', () => {
  it('shows the data errors instead of the map when families.txt has errors', () => {
    const { container } = render(<App />);
    expect(screen.getByText(/families\.txt:3/)).toBeInTheDocument();
    expect(screen.getByText(/has no gender/)).toBeInTheDocument();
    expect(container.querySelector('.react-flow')).toBeNull();
  });
});
