import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { UnionFlowNode } from './toFlow';

export function UnionNode({ data }: NodeProps<UnionFlowNode>) {
  const classes = ['union', data.onPath && 'on-path', data.faded && 'faded'].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <Handle id="l" type="target" position={Position.Left} isConnectable={false} />
      <Handle id="r" type="target" position={Position.Right} isConnectable={false} />
      <Handle id="bottom" type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}
