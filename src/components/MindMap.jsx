import React, { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

const MindMap = ({ nodes, edges, setNodes, onConnect, setSelectedNode }) => {
  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) =>
        nds.map((node) => {
          const change = changes.find((c) => c.id === node.id);
          if (!change) return node;

          if (change.type === 'position') {
            return { ...node, position: change.position };
          }
          if (change.type === 'select') {
            setSelectedNode(change.id);
          }
          return node;
        })
      );
    },
    [setNodes, setSelectedNode]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default MindMap;