import React, { useState, useCallback, useRef, useContext, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import Toolbar from './components/Toolbar';
import ImageNode from './components/ImageNode';
import DefaultNode from './components/DefaultNode';
import { AuthContext } from './auth/AuthContext';
import api from './api';

const nodeTypes = {
  imageNode: ImageNode,
  default: DefaultNode
};

const initialNodes = [
  {
    id: '1',
    type: 'default',
    position: { x: 100, y: 100 },
    data: { label: 'Nodo 1' },
    sourcePosition: 'right',
    targetPosition: 'left'
  },
  {
    id: '2',
    type: 'default',
    position: { x: 300, y: 100 },
    data: { label: 'Nodo 2' },
    sourcePosition: 'right',
    targetPosition: 'left'
  },
];

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [label, setLabel] = useState('');
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDiagramId, setCurrentDiagramId] = useState(null);
  const [title, setTitle] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSavedData, setLastSavedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const checkForChanges = useCallback((currentNodes, currentEdges) => {
    if (!lastSavedData) return true;
    
    const savedNodes = lastSavedData.nodes || [];
    const savedEdges = lastSavedData.edges || [];
    
    const nodesChanged = JSON.stringify(currentNodes) !== JSON.stringify(savedNodes);
    const edgesChanged = JSON.stringify(currentEdges) !== JSON.stringify(savedEdges);
    
    return nodesChanged || edgesChanged;
  }, [lastSavedData]);

  useEffect(() => {
    setHasChanges(checkForChanges(nodes, edges));
  }, [nodes, edges, checkForChanges]);

  const saveCurrentDiagram = useCallback(async () => {
    if (!hasChanges && lastSavedData) return;

    const diagramData = {
      id: currentDiagramId,
      datos_json: JSON.stringify({ nodes, edges }),
      titulo: title || `Diagrama sin guardar - ${new Date().toLocaleString()}`,
      fecha_creacion: new Date().toISOString(),
      usuario_id: user?.id || null,
      source: currentDiagramId ? 'db_modified' : 'unsaved',
      lastModified: Date.now()
    };

    try {
      localStorage.setItem('currentEditingDiagram', JSON.stringify(diagramData));
      
      if (currentDiagramId) {
        const allDiagrams = JSON.parse(localStorage.getItem('dbDiagrams') || {});
        allDiagrams[currentDiagramId] = diagramData;
        localStorage.setItem('dbDiagrams', JSON.stringify(allDiagrams));
      }
      
      setLastSavedData({ nodes: [...nodes], edges: [...edges] });
      setHasChanges(false);
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
      if (error.name === 'QuotaExceededError') {
        alert('El almacenamiento local está lleno. Por favor guarda tu diagrama en la base de datos.');
      }
    }
  }, [nodes, edges, currentDiagramId, user, title, hasChanges, lastSavedData]);

  useEffect(() => {
    const loadDiagram = async () => {
      setIsLoading(true);
      
      try {
        const savedDiagram = localStorage.getItem('currentEditingDiagram');
        
        if (savedDiagram) {
          const parsedDiagram = JSON.parse(savedDiagram);
          const diagramData = JSON.parse(parsedDiagram.datos_json);

          if (diagramData.nodes && diagramData.edges) {
            setNodes(diagramData.nodes);
            setEdges(diagramData.edges);
            
            if (parsedDiagram.id) {
              try {
                const response = await api.get(`/mindmaps/${parsedDiagram.id}`);
                if (response.status === 200) {
                  setIsEditing(true);
                  setCurrentDiagramId(parsedDiagram.id);
                  setTitle(response.data.titulo);
                  setLastSavedData({
                    nodes: JSON.parse(response.data.datos_json).nodes,
                    edges: JSON.parse(response.data.datos_json).edges
                  });
                }
              } catch (error) {
                console.warn('El diagrama no existe en la base de datos, continuando con versión local');
                setTitle(parsedDiagram.titulo || '');
              }
            } else {
              setTitle(parsedDiagram.titulo || '');
            }
          }
        } else {
          setNodes(initialNodes);
          setEdges([]);
          setLastSavedData({ nodes: initialNodes, edges: [] });
        }
      } catch (error) {
        console.error('Error al cargar diagrama:', error);
        setNodes(initialNodes);
        setEdges([]);
      } finally {
        setIsLoading(false);
        setHasLoadedFromStorage(true);
      }
    };

    if (!hasLoadedFromStorage) {
      loadDiagram();
    }
  }, [hasLoadedFromStorage]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        saveCurrentDiagram();
        e.preventDefault();
        e.returnValue = 'Tienes cambios no guardados. ¿Estás seguro de querer salir?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      if (hasChanges) {
        saveCurrentDiagram();
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges, saveCurrentDiagram]);

  const navigateWithSave = useCallback(async (path) => {
    if (!hasChanges) {
      window.location.href = path;
      return;
    }

    const confirm = window.confirm(
      'Tienes cambios no guardados. ¿Quieres guardar antes de ir al catálogo?'
    );

    if (confirm) {
      try {
        await saveCurrentDiagram();
        window.location.href = path;
      } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar. Los cambios no se perderán pero no se guardaron en la base de datos.');
      }
    } else {
      window.location.href = path;
    }
  }, [hasChanges, saveCurrentDiagram]);

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

  const isValidImageUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const addNode = () => {
    const newNode = {
      id: `${Date.now()}`,
      type: 'default',
      position: {
        x: Math.random() * 500,
        y: Math.random() * 500,
      },
      data: { label: label || `Nodo ${nodes.length + 1}` },
      sourcePosition: 'right',
      targetPosition: 'left'
    };
    setNodes((nds) => [...nds, newNode]);
    setLabel('');
  };

  const addImageNode = () => {
    if (!imageUrl.trim() || !isValidImageUrl(imageUrl)) {
      alert('Por favor ingresa una URL de imagen válida');
      return;
    }

    const newNode = {
      id: `${Date.now()}`,
      type: 'imageNode',
      position: {
        x: Math.random() * 500,
        y: Math.random() * 500,
      },
      data: {
        label: label || `Nodo con imagen ${nodes.length + 1}`,
        imageUrl: imageUrl
      },
      sourcePosition: 'right',
      targetPosition: 'left'
    };
    setNodes((nds) => [...nds, newNode]);
    setImageUrl('');
    setLabel('');
  };

  const deleteNode = () => {
    if (!selectedNode) return;

    const newNodes = nodes.filter((n) => n.id !== selectedNode);
    const newEdges = edges.filter((e) => e.source !== selectedNode && e.target !== selectedNode);

    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNode(null);
  };

  const onNodeClick = (event, node) => {
    setSelectedNode(node.id);
  };

  const updateNodeLabel = (newLabel) => {
    if (!selectedNode || !newLabel.trim()) return;
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
    setLabel('');
  };

  const addImageToSelectedNode = () => {
    if (!selectedNode || !imageUrl.trim() || !isValidImageUrl(imageUrl)) {
      alert('Por favor ingresa una URL de imagen válida y selecciona un nodo');
      return;
    }

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode) {
          return {
            ...node,
            type: 'imageNode',
            data: {
              ...node.data,
              imageUrl: imageUrl
            },
          };
        }
        return node;
      })
    );
    setImageUrl('');
  };

  const handleLogout = async () => {
    try {
      await saveCurrentDiagram();
      await api.post('/logout');
      setNodes(initialNodes);
      setEdges([]);
      setSelectedNode(null);
      setImageUrl('');
      setLabel('');
      setTitle('');
      setIsEditing(false);
      setCurrentDiagramId(null);
      localStorage.removeItem('currentEditingDiagram');
      logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      logout();
    }
  };

  const handleSaveToDatabase = async () => {
    if (!user) {
      alert('Debes iniciar sesión para guardar mapas');
      return;
    }

    if (!title.trim()) {
      alert('El título es requerido');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const requestData = {
        titulo: title,
        datos_json: JSON.stringify({ nodes, edges }),
        ...(isEditing && currentDiagramId && { id: currentDiagramId })
      };

      let response;
      
      if (isEditing && currentDiagramId) {
        response = await api.put('/mindmaps', requestData);
        
        if (response.status === 200) {
          setLastSavedData({ nodes: [...nodes], edges: [...edges] });
          setHasChanges(false);
          
          const dbDiagrams = JSON.parse(localStorage.getItem('dbDiagrams') || {});
          delete dbDiagrams[currentDiagramId];
          localStorage.setItem('dbDiagrams', JSON.stringify(dbDiagrams));
          
          alert(`Mapa "${title}" actualizado exitosamente`);
        }
      } else {
        response = await api.post('/mindmaps', requestData);
        
        if (response.status === 201) {
          setLastSavedData({ nodes: [...nodes], edges: [...edges] });
          setHasChanges(false);
          
          setCurrentDiagramId(response.data.id);
          setIsEditing(true);
          alert(`Mapa "${title}" guardado exitosamente con ID: ${response.data.id}`);
        }
      }

      setTitle('');
    } catch (error) {
      console.error('Error al guardar el mapa:', error);
      let errorMessage = 'Error al guardar el mapa';
      
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 500) {
          errorMessage = 'Error interno del servidor. Verifica los logs del servidor.';
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f2f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Cargando tu diagrama...</h2>
          <p>Por favor espera mientras recuperamos tu trabajo anterior.</p>
        </div>
      </div>
    );
  }

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
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ marginRight: '10px' }}>Hola, {user.name}</span>
          <button
            onClick={handleLogout}
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
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          addImageNode={addImageNode}
          addImageToSelectedNode={addImageToSelectedNode}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          label={label}
          setLabel={setLabel}
          user={user}
          isEditing={isEditing}
          currentDiagramId={currentDiagramId}
          setIsEditing={setIsEditing}
          setCurrentDiagramId={setCurrentDiagramId}
          saveCurrentDiagram={saveCurrentDiagram}
          title={title}
          setTitle={setTitle}
          handleSaveToDatabase={handleSaveToDatabase}
          hasChanges={hasChanges}
          navigateWithSave={navigateWithSave}
          isSaving={isSaving}
          saveError={saveError}
          setSaveError={setSaveError}
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

export default Home;