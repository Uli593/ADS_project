import React from 'react';
import { Handle, Position } from 'reactflow';

const ImageNode = ({ data, selected }) => {
  return (
    <div style={{ 
      padding: '10px',
      minWidth: '120px',
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

      {data.label && (
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
          {data.label}
        </div>
      )}

      {data.imageUrl && (
        <div style={{ marginTop: '8px', borderRadius: '4px', overflow: 'hidden' }}>
          <img 
            src={data.imageUrl} 
            alt="Node content" 
            style={{ 
              maxWidth: '100%',
              maxHeight: '150px',
              display: 'block'
            }} 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = '<div style="padding: 20px; color: #666; text-align: center;">Imagen no disponible</div>';
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageNode;