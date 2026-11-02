import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildGraph } from '../graph/familyGraph';
import { realFamilies } from '../test/realData';
import { SearchBox } from './SearchBox';

const graph = buildGraph(realFamilies().data);

describe('SearchBox', () => {
  it('lists every Prem with a hint while typing', () => {
    render(<SearchBox graph={graph} onPick={() => {}} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'prem' } });
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(screen.getByText('spouse of Pushpa Grenada')).toBeInTheDocument();
    expect(screen.getByText('child of Ruki & Jiwatram')).toBeInTheDocument();
  });

  it('picks the highlighted result on Enter, and arrows move the highlight', () => {
    const onPick = vi.fn();
    render(<SearchBox graph={graph} onPick={onPick} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'prem' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onPick).toHaveBeenLastCalledWith('Prem');

    fireEvent.change(input, { target: { value: 'prem' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onPick).toHaveBeenCalledTimes(2);
    expect(onPick.mock.calls[1][0]).not.toBe('Prem');
  });

  it('clears on Escape', () => {
    render(<SearchBox graph={graph} onPick={() => {}} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'prem' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });
});
