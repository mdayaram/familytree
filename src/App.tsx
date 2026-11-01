import { ReactFlowProvider } from '@xyflow/react';
import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PATH_FROM_ID } from './config';
import { loadFamilies } from './data/loadFamilies';
import { findPath } from './graph/familyGraph';
import { layoutFamily, type Layout } from './layout/layoutFamily';
import { FamilyMap, type Focus } from './map/FamilyMap';
import { toFlow } from './map/toFlow';
import { SearchBox } from './panel/SearchBox';
import { SidePanel } from './panel/SidePanel';

export function App() {
  const { data, graph } = useMemo(loadFamilies, []);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pathFromId, setPathFromId] = useState(DEFAULT_PATH_FROM_ID);
  const [focus, setFocus] = useState<Focus | null>(null);

  useEffect(() => {
    let cancelled = false;
    layoutFamily(data).then((l) => !cancelled && setLayout(l));
    return () => {
      cancelled = true;
    };
  }, [data]);

  // Select someone and fly the map to them (search results and panel links).
  const goTo = (id: string) => {
    setSelectedId(id);
    setFocus((f) => ({ id, seq: (f?.seq ?? 0) + 1 }));
  };

  const pathIds = useMemo(() => {
    const path = selectedId ? findPath(graph, pathFromId, selectedId) : null;
    // A one-person "path" (selected == path-from) highlights nothing.
    return new Set(path && path.length > 1 ? path : []);
  }, [graph, pathFromId, selectedId]);

  const flow = useMemo(
    () => (layout ? toFlow(data, layout, { nodeIds: pathIds, selectedId }) : null),
    [data, layout, pathIds, selectedId],
  );

  return (
    <div className="app">
      <main className="map">
        {flow ? (
          <ReactFlowProvider>
            <FamilyMap nodes={flow.nodes} edges={flow.edges} onSelect={setSelectedId} focus={focus} />
          </ReactFlowProvider>
        ) : (
          <p className="loading">Laying out the tree…</p>
        )}
        <SearchBox graph={graph} onPick={goTo} className="map-search" />
      </main>
      <SidePanel graph={graph} selectedId={selectedId} pathFromId={pathFromId} onSelect={goTo} onPathFromChange={setPathFromId} />
    </div>
  );
}
