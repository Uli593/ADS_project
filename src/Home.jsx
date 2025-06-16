import React, { useState, useCallback, useRef, useContext } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Toolbar from './components/Toolbar';
import { AuthContext } from './auth/AuthContext';

const initialNodes = [
  {
    id: '1',
    type: 'default',
    position: { x: 100, y: 100 },
    data: { label: 'Nodo 1' },
  },
  {
    id: '2',
    type: 'default',
    position: { x: 300, y: 100 },
    data: { label: 'Nodo 2' },
  },
];

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const addNode = () => {
    const newNode = {
      id: `${nodes.length + 1}`,
      position: {
        x: Math.random() * 500,
        y: Math.random() * 500,
      },
      data: { label: `Nodo ${nodes.length + 1}` },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const deleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode && e.target !== selectedNode));
    setSelectedNode(null);
  };

  const onNodeClick = (event, node) => {
    setSelectedNode(node.id);
  };

  const updateNodeLabel = (newLabel) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode) {
          return {
            ...node,
            data: { ...node.data, label: newLabel },
          };
        }
        return node;
      })
    );
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }} ref={reactFlowWrapper}>
      {user && (
        <div style={{ 
          position: 'absolute', 
          top: 20, 
          right: 20, 
          zIndex: 1000,
          backgroundColor: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <span style={{ marginRight: '10px' }}>Hola, {user.name}</span>
          <button 
            onClick={logout} 
            style={{ 
              padding: '5px 10px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
      
      <ReactFlowProvider>
        <Toolbar 
          onAddNode={addNode} 
          onDeleteNode={deleteNode} 
          hasSelectedNode={!!selectedNode}
          onUpdateLabel={updateNodeLabel}
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          reactFlowWrapper={reactFlowWrapper}
        />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default Home;