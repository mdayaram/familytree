import { Handle, Position, useStore, type NodeProps } from '@xyflow/react';
import { displayName } from '../graph/familyGraph';
import type { PersonFlowNode } from './toFlow';

/** Below this zoom, names are unreadable, so cards collapse to coloured marks. */
export const NAME_ZOOM = 0.35;

export function PersonNode({ data }: NodeProps<PersonFlowNode>) {
  const { person, onPath, faded, selected } = data;
  const compact = useStore((s) => s.transform[2] < NAME_ZOOM);
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
