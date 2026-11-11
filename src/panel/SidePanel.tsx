import { useState } from 'react';
import { displayName, relatives, type FamilyGraph } from '../graph/familyGraph';
import { SearchBox } from './SearchBox';

export interface SidePanelProps {
  graph: FamilyGraph;
  selectedId: string | null;
  pathFromId: string;
  onSelect(id: string): void;
  onPathFromChange(id: string): void;
  /** Deselect, which also leaves path view. */
  onClear(): void;
}

export function SidePanel({ graph, selectedId, pathFromId, onSelect, onPathFromChange, onClear }: SidePanelProps) {
  const name = (id: string) => {
    const p = graph.data.people.get(id);
    return p ? displayName(p) : id;
  };
  const person = selectedId ? graph.data.people.get(selectedId) : undefined;
  /** Phones only (the handle is hidden on wider screens): shrink the sheet to just the name. */
  const [collapsed, setCollapsed] = useState(false);

  if (!person) {
    return (
      <aside className="panel empty">
        <p className="panel-empty">Search or click someone on the map</p>
      </aside>
    );
  }

  const r = relatives(graph, person.id);
  const rows: [string, string[]][] = [
    ['Married to', r.spouses],
    ['Parents', r.parents],
    ['Children', r.children],
  ];

  return (
    <aside className={collapsed ? 'panel collapsed' : 'panel'}>
      <button
        type="button"
        className="panel-handle"
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Show details' : 'Hide details'}
        onClick={() => setCollapsed((c) => !c)}
      />
      <button type="button" className="link panel-clear" onClick={onClear}>
        Clear selection
      </button>
      <div className="panel-photo" aria-hidden />
      <h2>
        {displayName(person)}
        {person.deceased && <span className="deceased"> †</span>}
      </h2>
      <dl className="relatives">
        {rows
          .filter(([, ids]) => ids.length > 0)
          .map(([label, ids]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                {ids.map((id) => (
                  <button key={id} type="button" className="link" onClick={() => onSelect(id)}>
                    {name(id)}
                  </button>
                ))}
              </dd>
            </div>
          ))}
      </dl>
      <div className="path-from">
        <div className="path-from-label">
          Show path from: <strong>{name(pathFromId)}</strong>
        </div>
        <SearchBox graph={graph} onPick={onPathFromChange} placeholder="Change who the path starts from…" className="compact" />
      </div>
    </aside>
  );
}
