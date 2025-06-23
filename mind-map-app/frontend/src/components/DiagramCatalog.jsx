import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import './DiagramCatalog.css';

const DiagramCatalog = () => {
  const [diagrams, setDiagrams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteStatus, setDeleteStatus] = useState({ id: null, deleting: false });
  const navigate = useNavigate();

  const parseDiagramData = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      return {
        nodesCount: data.nodes?.length || 0,
        edgesCount: data.edges?.length || 0,
      };
    } catch (e) {
      console.error('Error parsing diagram JSON:', e);
      return { nodesCount: 0, edgesCount: 0 };
    }
  };

  const handleNewDiagram = () => {
    // Limpiar cualquier diagrama guardado en localStorage
    localStorage.removeItem('currentEditingDiagram');
    // Redirigir a la página principal
    navigate('/');
  };

  const handleEdit = (diagram) => {
    try {
      localStorage.setItem('currentEditingDiagram', JSON.stringify({
        id: diagram.id,
        titulo: diagram.name,
        datos_json: diagram.rawData.datos_json,
        ultima_modificacion: diagram.rawData.ultima_modificacion,
        usuario_id: diagram.rawData.usuario_id
      }));
      navigate('/');
    } catch (e) {
      console.error('Error al guardar diagrama para edición:', e);
      setError('Error al preparar el diagrama para edición');
    }
  };

  useEffect(() => {
    const fetchDiagrams = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('mindmap_jwt');
        if (!token) {
          throw new Error('No se encontró el token de autenticación');
        }

        const response = await api.get('/mindmaps/all', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.data || !response.data.mapas) {
          throw new Error('Formato de respuesta inesperado del servidor');
        }

        const formattedDiagrams = response.data.mapas.map(diagram => {
          const { nodesCount, edgesCount } = parseDiagramData(diagram.datos_json);
          
          return {
            id: diagram.id,
            name: diagram.titulo,
            lastModified: new Date(diagram.ultima_modificacion).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }),
            nodes: nodesCount,
            edges: edgesCount,
            thumbnail: ['db-model', 'sales-system', 'social-network'][Math.abs(diagram.titulo.hashCode()) % 3],
            rawData: diagram
          };
        });

        setDiagrams(formattedDiagrams);
      } catch (err) {
        console.error('Error al obtener diagramas:', err);
        setError(err.response?.data?.message || err.message || 'Error al cargar los diagramas');
      } finally {
        setLoading(false);
      }
    };

    String.prototype.hashCode = function() {
      let hash = 0;
      for (let i = 0; i < this.length; i++) {
        hash = ((hash << 5) - hash) + this.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    };

    fetchDiagrams();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este diagrama? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setDeleteStatus({ id, deleting: true });
      
      const token = localStorage.getItem('mindmap_jwt');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      await api.delete(`/mindmaps/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setDiagrams(diagrams.filter(diagram => diagram.id !== id));
      
      const localDiagrams = JSON.parse(localStorage.getItem('dbDiagrams') || '{}');
      if (localDiagrams[id]) {
        delete localDiagrams[id];
        localStorage.setItem('dbDiagrams', JSON.stringify(localDiagrams));
      }

      const currentEditing = JSON.parse(localStorage.getItem('currentEditingDiagram') || 'null');
      if (currentEditing && currentEditing.id === id) {
        localStorage.removeItem('currentEditingDiagram');
      }

    } catch (err) {
      console.error('Error al eliminar diagrama:', err);
      setError(err.response?.data?.message || err.message || 'Error al eliminar el diagrama');
    } finally {
      setDeleteStatus({ id: null, deleting: false });
    }
  };

  const filteredDiagrams = diagrams.filter(diagram =>
    diagram.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="diagram-catalog loading">
        <div className="spinner"></div>
        <p>Cargando diagramas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diagram-catalog error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="diagram-catalog">
      <div className="catalog-header">
        <Link to="/" className="back-button" onClick={handleNewDiagram}>
          <span className="arrow-icon">←</span> Volver al Editor
        </Link>
        <h1>Mis Diagramas ER</h1>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Buscar diagramas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="diagram-grid">
        <div className="diagram-card new-diagram">
          <button className="new-card-content" onClick={handleNewDiagram}>
            <span className="plus-icon">+</span>
            <span>Crear Nuevo Diagrama</span>
          </button>
        </div>

        {filteredDiagrams.map(diagram => (
          <div key={diagram.id} className="diagram-card">
            <div className={`diagram-thumbnail ${diagram.thumbnail}`}>
              <div className="thumbnail-nodes">
                {diagram.nodes > 0 && <span className="node-dot"></span>}
                {diagram.edges > 0 && <span className="edge-line"></span>}
              </div>
            </div>
            <div className="diagram-info">
              <h3>{diagram.name}</h3>
              <p>Modificado: {diagram.lastModified}</p>
              <p>{diagram.nodes} entidades · {diagram.edges} relaciones</p>
            </div>
            <div className="diagram-actions">
              <button
                className="edit-btn"
                onClick={() => handleEdit(diagram)}
                disabled={deleteStatus.deleting}
              >
                <span className="edit-icon">✏️</span> Editar
              </button>
              <button 
                className="delete-btn"
                onClick={() => handleDelete(diagram.id)}
                disabled={deleteStatus.deleting && deleteStatus.id === diagram.id}
              >
                {deleteStatus.deleting && deleteStatus.id === diagram.id ? (
                  <>
                    <span className="spinner mini-spinner"></span> Eliminando...
                  </>
                ) : (
                  <>
                    <span className="delete-icon">🗑️</span> Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiagramCatalog;