import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IssuesBanner } from './IssuesBanner';

describe('IssuesBanner', () => {
  it('renders nothing without issues', () => {
    const { container } = render(<IssuesBanner issues={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('collapses warnings into a count that expands to file:line details', () => {
    render(<IssuesBanner issues={[{ severity: 'warning', line: 12, message: 'Something odd' }]} />);
    expect(screen.queryByText(/families\.txt:12/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /1 data warning$/ }));
    expect(screen.getByText(/families\.txt:12/)).toBeInTheDocument();
    expect(screen.getByText(/Something odd/)).toBeInTheDocument();
  });

  it('pluralises the count', () => {
    render(
      <IssuesBanner
        issues={[
          { severity: 'warning', line: 1, message: 'a' },
          { severity: 'warning', line: 2, message: 'b' },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: /2 data warnings/ })).toBeInTheDocument();
  });
});
