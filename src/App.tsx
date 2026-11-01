import { ReactFlowProvider } from '@xyflow/react';
import { useEffect, useMemo, useState } from 'react';
import { loadFamilies } from './data/loadFamilies';
import { layoutFamily, type Layout } from './layout/layoutFamily';
import { FamilyMap } from './map/FamilyMap';
import { toFlow } from './map/toFlow';

export function App() {
  const { data } = useMemo(loadFamilies, []);
  const [layout, setLayout] = useState<Layout | null>(null);

  useEffect(() => {
    let cancelled = false;
    layoutFamily(data).then((l) => !cancelled && setLayout(l));
    return () => {
      cancelled = true;
    };
  }, [data]);

  const flow = useMemo(
    () => (layout ? toFlow(data, layout, { nodeIds: new Set(), selectedId: null }) : null),
    [data, layout],
  );

  return (
    <div className="app">
      <main className="map">
        {flow ? (
          <ReactFlowProvider>
            <FamilyMap nodes={flow.nodes} edges={flow.edges} onSelect={() => {}} focusId={null} />
          </ReactFlowProvider>
        ) : (
          <p className="loading">Laying out the tree…</p>
        )}
      </main>
    </div>
  );
}
