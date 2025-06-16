import React, { useState, useRef } from 'react';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const Toolbar = ({
  onAddNode,
  onDeleteNode,
  hasSelectedNode,
  onUpdateLabel,
  nodes,
  edges,
  setNodes,
  setEdges,
  reactFlowWrapper
}) => {
  const [label, setLabel] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef(null);

  const captureMap = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    const canvas = await html2canvas(reactFlowWrapper.current, {
      ignoreElements: (element) => element.classList?.contains('toolbar')
    });
    setIsExporting(false);
    return canvas;
  };

  const saveAsJSON = () => {
    const mapData = { nodes, edges };
    const blob = new Blob([JSON.stringify(mapData, null, 2)], {
      type: 'application/json',
    });
    saveAs(blob, 'mapa-mental.json');
  };

  const saveAsPDF = async () => {
    if (!reactFlowWrapper?.current) return;

    try {
      const canvas = await captureMap();
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('mapa-mental.pdf');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setIsExporting(false);
    }
  };

  const saveAsImage = async (format) => {
    if (!reactFlowWrapper?.current) return;

    try {
      const canvas = await captureMap();
      canvas.toBlob((blob) => {
        if (blob) saveAs(blob, `mapa-mental.${format}`);
      }, `image/${format}`, 1);
    } catch (error) {
      console.error(`Error al generar ${format}:`, error);
      setIsExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const mapData = JSON.parse(event.target.result);
        if (mapData.nodes && mapData.edges) {
          setNodes(mapData.nodes);
          setEdges(mapData.edges);
        } else {
          throw new Error('El archivo no tiene la estructura correcta');
        }
      } catch (error) {
        console.error('Error al cargar el archivo:', error);
        alert('Archivo inválido. Por favor carga un archivo JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`toolbar ${isExporting ? 'hidden' : ''}`}>
      <div className="toolbar-group-title">Nodos</div>
      <button
        className="toolbar-button"
        onClick={onAddNode}
      >
        Añadir Nodo
      </button>
      <button
        className="toolbar-button"
        onClick={onDeleteNode}
        disabled={!hasSelectedNode}
      >
        Eliminar Nodo
      </button>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group-title">Exportar</div>
      <button className="toolbar-button" onClick={saveAsJSON}>
        Guardar como JSON
      </button>
      <button className="toolbar-button" onClick={saveAsPDF}>
        Exportar a PDF
      </button>
      <button className="toolbar-button" onClick={() => saveAsImage('png')}>
        Exportar a PNG
      </button>
      <button className="toolbar-button" onClick={() => saveAsImage('jpeg')}>
        Exportar a JPG
      </button>
      <button className="toolbar-button" onClick={triggerFileInput}>
        Cargar Mapa
      </button>
      <input
        type="file"
        className="file-input"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
      />

      {hasSelectedNode && (
        <div className="toolbar-input-group">
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
    </div>
  );
};

export default Toolbar;