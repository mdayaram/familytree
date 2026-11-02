import { useId, useMemo, useState } from 'react';
import type { FamilyGraph } from '../graph/familyGraph';
import { searchPeople } from '../graph/search';

export interface SearchBoxProps {
  graph: FamilyGraph;
  onPick(id: string): void;
  placeholder?: string;
  className?: string;
}

/** Type-ahead person search: ↑/↓ to move, Enter to pick, Esc to clear. */
export function SearchBox({ graph, onPick, placeholder = 'Search for someone…', className }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const results = useMemo(() => searchPeople(graph, query, 10), [graph, query]);

  const pick = (id: string) => {
    onPick(id);
    setQuery('');
    setActive(0);
  };

  return (
    <div className={['search', className].filter(Boolean).join(' ')}>
      <input
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={listId}
        aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, results.length - 1));
          else if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0));
          else if (e.key === 'Enter' && results[active]) pick(results[active].id);
          else if (e.key === 'Escape') setQuery('');
          else return;
          e.preventDefault();
        }}
      />
      {results.length > 0 && (
        <ul id={listId} role="listbox">
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault(); // keep focus in the input
                pick(r.id);
              }}
            >
              <span className="result-name">{r.name}</span>
              {r.hint && <span className="result-hint">{r.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
