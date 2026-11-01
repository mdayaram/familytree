import { Handle, Position, type NodeProps } from '@xyflow/react';
import { displayName } from '../graph/familyGraph';
import type { PersonFlowNode } from './toFlow';

export function PersonNode({ data }: NodeProps<PersonFlowNode>) {
  const { person, onPath, faded, selected } = data;
  const classes = ['person', onPath && 'on-path', faded && 'faded', selected && 'selected', person.name === 'X' && 'unknown']
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} data-gender={person.gender ?? undefined} title={displayName(person)}>
      <Handle id="top" type="target" position={Position.Top} isConnectable={false} />
      <Handle id="left" type="source" position={Position.Left} isConnectable={false} />
      <Handle id="right" type="source" position={Position.Right} isConnectable={false} />
      <div className="photo" aria-hidden />
      <div className="name">
        {displayName(person)}
        {person.deceased && <span className="deceased"> †</span>}
      </div>
    </div>
  );
}
