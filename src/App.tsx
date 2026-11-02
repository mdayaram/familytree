import { ReactFlowProvider } from '@xyflow/react';
import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PATH_FROM_ID } from './config';
import { loadFamilies } from './data/loadFamilies';
import { findPath } from './graph/familyGraph';
import { layoutFamily, type Layout } from './layout/layoutFamily';
import { FamilyMap, type Focus } from './map/FamilyMap';
import { focusTargets } from './map/focusTargets';
import { toFlow } from './map/toFlow';
import { IssuesBanner, IssuesPage, issueText } from './panel/IssuesBanner';
import { SearchBox } from './panel/SearchBox';
import { SidePanel } from './panel/SidePanel';

export function App() {
  const { data, graph, issues } = useMemo(loadFamilies, []);
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const [layout, setLayout] = useState<Layout | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pathFromId, setPathFromId] = useState(DEFAULT_PATH_FROM_ID);
  const [focus, setFocus] = useState<Focus | null>(null);

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

  // Bring the selected person, or their whole path from `fromId`, into view.
  const refocus = (id: string, fromId: string) =>
    setFocus((f) => ({ ids: focusTargets(findPath(graph, fromId, id), id), seq: (f?.seq ?? 0) + 1 }));

  // Select someone and fly the map to them (map clicks, search results and panel links).
  const goTo = (id: string) => {
    setSelectedId(id);
    refocus(id, pathFromId);
  };

  const changePathFrom = (id: string) => {
    setPathFromId(id);
    if (selectedId) refocus(selectedId, id);
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

  if (errors.length) return <IssuesPage issues={errors} />;

  return (
    <div className="app">
      <main className="map">
        {flow ? (
          <ReactFlowProvider>
            <FamilyMap nodes={flow.nodes} edges={flow.edges} onSelect={goTo} focus={focus} />
          </ReactFlowProvider>
        ) : (
          <p className="loading">Laying out the tree…</p>
        )}
        <div className="map-overlay">
          <SearchBox graph={graph} onPick={goTo} className="map-search" />
          <IssuesBanner issues={warnings} />
        </div>
      </main>
      <SidePanel graph={graph} selectedId={selectedId} pathFromId={pathFromId} onSelect={goTo} onPathFromChange={changePathFrom} />
    </div>
  );
}
