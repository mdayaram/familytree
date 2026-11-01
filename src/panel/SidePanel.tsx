import { displayName, relatives, type FamilyGraph } from '../graph/familyGraph';
import { SearchBox } from './SearchBox';

export interface SidePanelProps {
  graph: FamilyGraph;
  selectedId: string | null;
  pathFromId: string;
  onSelect(id: string): void;
  onPathFromChange(id: string): void;
}

export function SidePanel({ graph, selectedId, pathFromId, onSelect, onPathFromChange }: SidePanelProps) {
  const name = (id: string) => {
    const p = graph.data.people.get(id);
    return p ? displayName(p) : id;
  };
  const person = selectedId ? graph.data.people.get(selectedId) : undefined;

  if (!person) {
    return (
      <aside className="panel">
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
    <aside className="panel">
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
