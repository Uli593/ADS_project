// MindMapApp.js
import React, { useState, useCallback } from 'react';
import MindMap from './components/MindMap';
import { ReactFlowProvider } from 'reactflow';

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Idea Principal', files: [] }, type: 'default', draggable: true, selectable: true },
  { id: '2', position: { x: 200, y: 100 }, data: { label: 'Idea Secundaria', files: [] }, type: 'default', draggable: true, selectable: true },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', label: 'relación' },
];

const generateNodeId = (nodes) => {
  const ids = nodes.map((n) => parseInt(n.id));
  const maxId = ids.length ? Math.max(...ids) : 0;
  return (maxId + 1).toString();
};

const MindMapApp = () => {
  const [selectedElement, setSelectedElement] = useState(null);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const handleSelectNode = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    setSelectedElement(node ? { type: 'node', data: node } : null);
  };

  const handleSelectEdge = (edgeId) => {
    const edge = edges.find(e => e.id === edgeId);
    setSelectedElement(edge ? { type: 'edge', data: edge } : null);
  };

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) =>
        nds.map((node) => {
          const change = changes.find((c) => c.id === node.id);
          if (change?.type === 'position') {
            return { ...node, position: change.position };
          }
          if (change?.type === 'remove') return null;
          return node;
        }).filter(Boolean)
      );

      changes.forEach(change => {
        if (change.type === 'remove' && selectedElement?.type === 'node' && change.id === selectedElement.data.id) {
          setSelectedElement(null);
        }
      });
    },
    [selectedElement]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) =>
        eds.map((edge) => {
          const change = changes.find((c) => c.id === edge.id);
          if (change?.type === 'remove') return null;
          return edge;
        }).filter(Boolean)
      );

      changes.forEach(change => {
        if (change.type === 'remove' && selectedElement?.type === 'edge' && change.id === selectedElement.data.id) {
          setSelectedElement(null);
        }
      });
    },
    [selectedElement]
  );

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => [...eds, { ...params, id: `e${params.source}-${params.target}`, label: 'relación' }]);
    },
    []
  );

  const handleAddNode = () => {
    const newId = generateNodeId(nodes);
    const newNode = {
      id: newId,
      position: { x: 100, y: 100 },
      data: { label: `Nueva Idea ${newId}`, files: [] },
      type: 'default',
      draggable: true,
      selectable: true,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleDeleteSelected = () => {
    if (!selectedElement) return alert('Selecciona un nodo o relación para eliminar');
    if (selectedElement.type === 'node') {
      const nodeId = selectedElement.data.id;
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    } else if (selectedElement.type === 'edge') {
      const edgeId = selectedElement.data.id;
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    }
    setSelectedElement(null);
  };

  const handleLabelChange = (event) => {
    const newLabel = event.target.value;
    if (!selectedElement) return;

    if (selectedElement.type === 'node') {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedElement.data.id
            ? { ...node, data: { ...node.data, label: newLabel } }
            : node
        )
      );
      // Actualizar el elemento seleccionado
      setSelectedElement(prev => ({
        ...prev,
        data: {
          ...prev.data,
          data: { ...prev.data.data, label: newLabel }
        }
      }));
    } else if (selectedElement.type === 'edge') {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === selectedElement.data.id ? { ...edge, label: newLabel } : edge
        )
      );
      // Actualizar el elemento seleccionado
      setSelectedElement(prev => ({
        ...prev,
        data: {
          ...prev.data,
          label: newLabel
        }
      }));
    }
  };

  return (
    <div className="app-container" style={{ padding: 20 }}>
      <h1>Mi Aplicación de Mapas Mentales</h1>

      <div style={{ marginBottom: 10 }}>
        <button onClick={handleAddNode} style={{ marginRight: 10 }}>
          Agregar Nodo
        </button>
        <button onClick={handleDeleteSelected} disabled={!selectedElement}>
          Eliminar Seleccionado
        </button>
      </div>

      {selectedElement && (
        <div style={{ marginBottom: 20 }}>
          <label>
            Editar texto {selectedElement.type === 'node' ? 'Nodo' : 'Relación'}:
            <input
              type="text"
              value={selectedElement.type === 'node' ? selectedElement.data.data.label : selectedElement.data.label}
              onChange={handleLabelChange}
              style={{ marginLeft: 10, width: 300 }}
            />
          </label>
        </div>
      )}

      <ReactFlowProvider>
        <MindMap
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectNode={handleSelectNode}
          onSelectEdge={handleSelectEdge}
          selectedElement={selectedElement}
        />
      </ReactFlowProvider>
    </div>
  );
}

export default MindMapApp;