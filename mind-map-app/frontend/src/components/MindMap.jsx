import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import Toolbar from './Toolbar';
import ImageNode from './ImageNode';
import DefaultNode from './DefaultNode';

const nodeTypes = { 
  imageNode: ImageNode,
  default: DefaultNode
};

const initialNodes = [
  {
    id: '1',
    type: 'default',
    position: { x: 100, y: 100 },
    data: { label: 'Nodo Normal' }
  },
  {
    id: '2',
    type: 'imageNode',
    position: { x: 300, y: 100 },
    data: { 
      label: 'Nodo con Imagen',
      imageUrl: 'https://via.placeholder.com/150' 
    }
  }
];

const initialEdges = [];

const MindMap = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(
      { 
        ...params,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        },
        style: {
          strokeWidth: 2,
          stroke: '#6366f1',
        }
      }, 
      eds
    )),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node.id);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }} ref={reactFlowWrapper}>
      <ReactFlowProvider>
        <Toolbar
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          reactFlowWrapper={reactFlowWrapper}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
        />
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          connectionMode="strict"
          snapToGrid={true}
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'default',
            style: {
              stroke: '#6366f1',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#6366f1',
            },
          }}
          connectionRadius={20}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default MindMap;