import { ReactFlowProvider } from '@xyflow/react';
import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PATH_FROM_ID } from './config';
import { loadFamilies } from './data/loadFamilies';
import type { FamilyData } from './data/types';
import { displayName, findPath } from './graph/familyGraph';
import { pathSubgraph } from './graph/pathSubgraph';
import { layoutFamily, type Layout } from './layout/layoutFamily';
import { FamilyMap, type Focus } from './map/FamilyMap';
import { toFlow } from './map/toFlow';
import { IssuesBanner, IssuesPage, issueText } from './panel/IssuesBanner';
import { SearchBox } from './panel/SearchBox';
import { SidePanel } from './panel/SidePanel';

const NO_PATH = new Set<string>();

export function App() {
  const { data, graph, issues } = useMemo(loadFamilies, []);
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const [layout, setLayout] = useState<Layout | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pathFromId, setPathFromId] = useState(DEFAULT_PATH_FROM_ID);
  const [focus, setFocus] = useState<Focus | null>(null);
  /** Where the whole tree re-opens after leaving path view: the last person selected. */
  const [treeCenterId, setTreeCenterId] = useState(DEFAULT_PATH_FROM_ID);
  const [pathView, setPathView] = useState<{ key: string; data: FamilyData; layout: Layout } | null>(null);

  useEffect(() => {
    errors.forEach((i) => console.error(issueText(i)));
    warnings.forEach((i) => console.warn(issueText(i)));
    // Log once per load of families.txt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues]);

  useEffect(() => {
    if (errors.length) return;
    let cancelled = false;
    layoutFamily(data).then((l) => !cancelled && setLayout(l));
    return () => {
      cancelled = true;
    };
  }, [data, errors.length]);

  // A path needs two different people; selecting the path-from person shows no path.
  const path = useMemo(() => {
    const p = selectedId ? findPath(graph, pathFromId, selectedId) : null;
    return p && p.length > 1 ? p : null;
  }, [graph, pathFromId, selectedId]);
  const pathKey = path?.join('|') ?? null;

  // Path view: lay out just the people on the path (plus the other partner of each couple on it).
  useEffect(() => {
    if (!path || !pathKey) return;
    const sub = pathSubgraph(data, path);
    let cancelled = false;
    layoutFamily(sub).then((l) => !cancelled && setPathView({ key: pathKey, data: sub, layout: l }));
    return () => {
      cancelled = true;
    };
    // `path` is derived from pathKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, pathKey]);

  const flow = useMemo(() => {
    if (path) {
      if (pathView?.key !== pathKey) return null;
      return toFlow(pathView.data, pathView.layout, { nodeIds: new Set(path), selectedId });
    }
    return layout ? toFlow(data, layout, { nodeIds: NO_PATH, selectedId }) : null;
  }, [data, layout, path, pathKey, pathView, selectedId]);

  // Select someone (map click, search result or panel link). With a path this switches to
  // path view; without one (they are the path-from person) the whole tree flies to them.
  const goTo = (id: string) => {
    setSelectedId(id);
    setTreeCenterId(id);
    const p = findPath(graph, pathFromId, id);
    if (!p || p.length < 2) setFocus((f) => ({ id, seq: (f?.seq ?? 0) + 1 }));
  };

  const clearSelection = () => setSelectedId(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Esc in a search box with text clears that search instead.
      if (e.target instanceof HTMLInputElement && e.target.value) return;
      setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (errors.length) return <IssuesPage issues={errors} />;

  const name = (id: string) => {
    const p = data.people.get(id);
    return p ? displayName(p) : id;
  };

  return (
    <div className="app">
      <main className="map">
        {flow ? (
          // Each view gets a fresh map so it opens fitted (path) or centred (tree).
          <ReactFlowProvider key={path ? `path:${pathKey}` : 'tree'}>
            <FamilyMap
              nodes={flow.nodes}
              edges={flow.edges}
              onSelect={goTo}
              onClear={clearSelection}
              focus={path ? null : focus}
              initialView={path ? { fit: true } : { centerId: treeCenterId }}
            />
          </ReactFlowProvider>
        ) : (
          <p className="loading">Laying out the tree…</p>
        )}
        <div className="map-overlay">
          <SearchBox graph={graph} onPick={goTo} className="map-search" />
          {path && (
            <div className="path-bar">
              <span>
                {name(path[0])} → {name(path[path.length - 1])}
              </span>
              <button type="button" className="path-exit" onClick={clearSelection}>
                Show whole tree
              </button>
            </div>
          )}
          <IssuesBanner issues={warnings} />
        </div>
      </main>
      <SidePanel
        graph={graph}
        selectedId={selectedId}
        pathFromId={pathFromId}
        onSelect={goTo}
        onPathFromChange={setPathFromId}
        onClear={clearSelection}
      />
    </div>
  );
}
