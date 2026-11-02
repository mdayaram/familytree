import { Handle, Position, useStore, type NodeProps } from '@xyflow/react';
import { displayName } from '../graph/familyGraph';
import type { PersonFlowNode } from './toFlow';

/** Below this zoom, names are unreadable, so cards collapse to coloured marks. */
export const NAME_ZOOM = 0.35;

export function PersonNode({ data }: NodeProps<PersonFlowNode>) {
  const { person, onPath, faded, selected } = data;
  const compact = useStore((s) => s.transform[2] < NAME_ZOOM);
  // Only path cards track the exact zoom (to counter-scale their label); others re-render just at the threshold.
  const zoom = useStore((s) => (onPath ? s.transform[2] : 1));
  const classes = [
    'person',
    compact && 'compact',
    onPath && 'on-path',
    faded && 'faded',
    selected && 'selected',
    person.name === 'X' && 'unknown',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} data-gender={person.gender ?? undefined} title={displayName(person)}>
      <Handle id="top" type="target" position={Position.Top} isConnectable={false} />
      <Handle id="left" type="source" position={Position.Left} isConnectable={false} />
      <Handle id="right" type="source" position={Position.Right} isConnectable={false} />
      {compact && onPath && (
        // Zoomed out to fit a long path: keep the people on it labelled at a readable size.
        <div className="path-label" style={{ transform: `translateX(-50%) scale(${1 / zoom})` }}>
          {displayName(person)}
        </div>
      )}
      {!compact && (
        <>
          <div className="photo" aria-hidden />
          <div className="name">
            {displayName(person)}
            {person.deceased && <span className="deceased"> †</span>}
          </div>
        </>
      )}
    </div>
  );
}
