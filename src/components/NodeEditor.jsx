import React, { useState, useEffect } from 'react';

const NodeEditor = ({ node, onUpdateNode, onClose }) => {
  const [title, setTitle] = useState(node.title);

  useEffect(() => {
    setTitle(node.title);
  }, [node]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateNode({ ...node, title });
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: '20px',
        top: '80px',
        width: '300px',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
      }}
    >
      <h3>Editar Nodo</h3>
      <form onSubmit={handleSubmit}>
        <label>
          Título:
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', marginTop: '8px', marginBottom: '12px' }}
          />
        </label>
        <button type="submit">Guardar</button>
        <button type="button" onClick={onClose} style={{ marginLeft: '10px' }}>
          Cancelar
        </button>
      </form>
    </div>
  );
};

export default NodeEditor;
