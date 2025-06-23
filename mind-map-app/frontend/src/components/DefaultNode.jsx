import React from 'react';
import { Handle, Position } from 'reactflow';

const DefaultNode = ({ data, selected }) => {
  return (
    <div style={{
      padding: '10px',
      border: `2px solid ${selected ? '#6366f1' : '#ddd'}`,
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Handles de conexión */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />

      {data.label}
    </div>
  );
};

export default DefaultNode;