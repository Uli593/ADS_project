import React, { useState, useRef } from 'react';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Link } from 'react-router-dom';

const Toolbar = ({
  onAddNode,
  onDeleteNode,
  hasSelectedNode,
  onUpdateLabel,
  nodes,
  edges,
  setNodes,
  setEdges,
  reactFlowWrapper,
  selectedNode,
  addImageNode,
  addImageToSelectedNode,
  imageUrl,
  setImageUrl,
  label,
  setLabel,
  user,
  isEditing,
  currentDiagramId,
  setIsEditing,
  setCurrentDiagramId,
  saveCurrentDiagram,
  title,
  setTitle,
  handleSaveToDatabase,
  hasChanges,
  navigateWithSave,
  isSaving,
  saveError,
  setSaveError
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('nodes');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const capturarDiagrama = async () => {
    if (!reactFlowWrapper.current) return null;
    const flowElement = reactFlowWrapper.current.querySelector('.react-flow');

    if (!flowElement) return null;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(flowElement, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        logging: true,
      });
      return canvas;
    } catch (error) {
      console.error('Error al capturar el diagrama:', error);
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  const guardarComoJSON = () => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, 'diagrama.json');
  };

  const guardarComoPDF = async () => {
    const canvas = await capturarDiagrama();
    if (!canvas) return;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = (pdfHeight - imgHeight * ratio) / 2;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save('diagrama.pdf');
  };

  const guardarComoImagen = async (tipo) => {
    const canvas = await capturarDiagrama();
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `diagrama.${tipo}`);
      }
    }, `image/${tipo}`, 1);
  };

  const manejarCambioArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
        }
      } catch (error) {
        console.error('Error al analizar el archivo JSON:', error);
        alert('Error al cargar el archivo. Asegúrate de que es un JSON válido.');
        setFileName('');
      }
    };
    reader.readAsText(file);
  };

  const activarInputArchivo = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`toolbar ${isExporting ? 'hidden' : ''}`}>
      <div className="toolbar-tabs">
        <button
          className={`toolbar-tab ${activeTab === 'nodes' ? 'active' : ''}`}
          onClick={() => setActiveTab('nodes')}
        >
          Nodos
        </button>
        <button
          className={`toolbar-tab ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          Imágenes
        </button>
        <button
          className={`toolbar-tab ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          Exportar
        </button>
        <button
          className={`toolbar-tab ${activeTab === 'save' ? 'active' : ''}`}
          onClick={() => setActiveTab('save')}
        >
          Guardar
        </button>
      </div>

      {activeTab === 'nodes' && (
        <>
          <div className="toolbar-group">
            <button
              className="toolbar-button"
              onClick={onAddNode}
            >
              ＋ Añadir Nodo
            </button>
            <button
              className="toolbar-button"
              onClick={onDeleteNode}
              disabled={!hasSelectedNode}
            >
              ✕ Eliminar Nodo
            </button>
          </div>

          {hasSelectedNode && (
            <div className="toolbar-group">
              <input
                type="text"
                className="toolbar-input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Nuevo nombre"
              />
              <button
                className="toolbar-button"
                onClick={() => {
                  if (label.trim()) {
                    onUpdateLabel(label);
                    setLabel('');
                  }
                }}
              >
                Actualizar
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'images' && (
        <>
          <div className="toolbar-group">
            <input
              type="text"
              className="toolbar-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL de la imagen"
            />
            <button
              className="toolbar-button"
              onClick={addImageNode}
              disabled={!imageUrl.trim()}
            >
              ＋ Nuevo Nodo con Imagen
            </button>
          </div>

          {hasSelectedNode && (
            <div className="toolbar-group">
              <button
                className="toolbar-button"
                onClick={addImageToSelectedNode}
                disabled={!imageUrl.trim()}
              >
                ⇄ Añadir Imagen al Nodo
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'export' && (
        <div className="toolbar-group">
          <button 
            className="toolbar-button" 
            onClick={() => navigateWithSave('/catalog')}
          >
            📂 Ver Mis Diagramas
          </button>
          <button className="toolbar-button" onClick={guardarComoJSON}>
            💾 Guardar JSON
          </button>
          <button className="toolbar-button" onClick={guardarComoPDF}>
            📄 Exportar PDF
          </button>
          <button className="toolbar-button" onClick={() => guardarComoImagen('png')}>
            🖼️ PNG
          </button>
          <button className="toolbar-button" onClick={() => guardarComoImagen('jpeg')}>
            🖼️ JPG
          </button>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="toolbar-button" onClick={activarInputArchivo}>
              📤 Cargar Mapa
            </button>
            {fileName && <span className="file-name">{fileName}</span>}
          </div>
          <input
            type="file"
            className="file-input"
            ref={fileInputRef}
            onChange={manejarCambioArchivo}
            accept=".json"
          />
        </div>
      )}

      {activeTab === 'save' && (
        <div className="save-form">
          <div className="form-group">
            <label>Título del Mapa:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Mi Proyecto de Vida"
              required
            />
          </div>
          <div className="save-actions">
            <button
              className="save-button"
              onClick={handleSaveToDatabase}
              disabled={!title.trim() || isSaving}
            >
              {isSaving ? 'Guardando...' : isEditing ? '🔄 Actualizar Mapa' : '💾 Guardar Mapa'}
            </button>
            <button
              className="save-button secondary"
              onClick={saveCurrentDiagram}
              disabled={!hasChanges || isSaving}
            >
              💾 Guardar Localmente
            </button>
            {isEditing && (
              <button
                className="save-button secondary"
                onClick={() => {
                  setIsEditing(false);
                  setCurrentDiagramId(null);
                  setTitle('');
                }}
                disabled={isSaving}
              >
                Cancelar Edición
              </button>
            )}
          </div>
          {saveError && (
            <div className="error-message">
              {saveError}
              <button onClick={() => setSaveError(null)}>×</button>
            </div>
          )}
          {hasChanges && (
            <div className="changes-indicator">
              Tienes cambios no guardados {isEditing ? 'en este mapa' : 'en el nuevo mapa'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Toolbar;