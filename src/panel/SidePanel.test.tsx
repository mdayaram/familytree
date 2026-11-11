import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildGraph } from '../graph/familyGraph';
import { realFamilies } from '../test/realData';
import { SidePanel } from './SidePanel';

const graph = buildGraph(realFamilies().data);
const noop = () => {};

describe('SidePanel', () => {
  it('shows the selected person and their family as links, without listing the path', () => {
    const onSelect = vi.fn();
    render(<SidePanel graph={graph} selectedId="prem_chandiramani_grenada" pathFromId="ManojDayaram" onSelect={onSelect} onPathFromChange={noop} onClear={noop} />);
    expect(screen.getByRole('heading', { name: 'Prem Chandiramani' })).toBeInTheDocument();
    expect(screen.getByText('Married to')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pushpa Chandiramani' }));
    expect(onSelect).toHaveBeenCalledWith('PushpaChandiramani');
    expect(screen.queryByText(/path to/i)).not.toBeInTheDocument();
  });

  it('clears the selection, including when the selected person is the path-from person', () => {
    const onClear = vi.fn();
    render(<SidePanel graph={graph} selectedId="ManojDayaram" pathFromId="ManojDayaram" onSelect={noop} onPathFromChange={noop} onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('shows who the path is drawn from', () => {
    render(<SidePanel graph={graph} selectedId="prem_chandiramani_grenada" pathFromId="ManojDayaram" onSelect={noop} onPathFromChange={noop} onClear={noop} />);
    expect(screen.getByText('Manoj Dayaram')).toBeInTheDocument();
  });

  it('hides empty relationship rows', () => {
    render(<SidePanel graph={graph} selectedId="Prem" pathFromId="ManojDayaram" onSelect={noop} onPathFromChange={noop} onClear={noop} />);
    expect(screen.getByText('Parents')).toBeInTheDocument();
    expect(screen.queryByText('Married to')).not.toBeInTheDocument();
    expect(screen.queryByText('Children')).not.toBeInTheDocument();
  });

  it('shows a prompt when nobody is selected', () => {
    render(<SidePanel graph={graph} selectedId={null} pathFromId="ManojDayaram" onSelect={noop} onPathFromChange={noop} onClear={noop} />);
    expect(screen.getByText('Search or click someone on the map')).toBeInTheDocument();
  });

  it('renders when the selected person is the path-from person', () => {
    render(<SidePanel graph={graph} selectedId="ManojDayaram" pathFromId="ManojDayaram" onSelect={noop} onPathFromChange={noop} onClear={noop} />);
    expect(screen.getByRole('heading', { name: 'Manoj Dayaram' })).toBeInTheDocument();
  });

  it('collapses to just the name and expands again (the phone sheet handle)', () => {
    render(<SidePanel graph={graph} selectedId="prem_chandiramani_grenada" pathFromId="ManojDayaram" onSelect={noop} onPathFromChange={noop} onClear={noop} />);
    const panel = screen.getByRole('complementary');
    fireEvent.click(screen.getByRole('button', { name: 'Hide details' }));
    expect(panel).toHaveClass('collapsed');
    expect(screen.getByRole('heading', { name: 'Prem Chandiramani' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show details' }));
    expect(panel).not.toHaveClass('collapsed');
  });
});
