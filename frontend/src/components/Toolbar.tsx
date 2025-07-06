import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Crop,
  Grid3X3,
  Settings
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface ToolbarProps {
  className?: string;
}

export function Toolbar({ className }: ToolbarProps) {
  const {
    currentImage,
    viewState,
    settings,
    setZoom,
    resetView,
    updateSettings,
    setError
  } = useAppStore();

  const handleZoomIn = () => {
    const newZoom = Math.min(5, viewState.zoom + settings.zoomStep);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, viewState.zoom - settings.zoomStep);
    setZoom(newZoom);
  };

  const handleReset = () => {
    resetView();
  };

  const handleDownload = async () => {
    if (!currentImage || !currentImage.cropArea) {
      setError('No image or crop area selected');
      return;
    }

    try {
      // This would typically send the crop area to the backend
      // For now, we'll just show a placeholder
      console.log('Downloading cropped image:', {
        imageId: currentImage.id,
        cropArea: currentImage.cropArea
      });
      
      // Placeholder: In a real app, you'd send this to your FastAPI backend
      setError('Download functionality would be implemented with FastAPI backend');
    } catch (error) {
      setError('Failed to download image');
      console.error('Download error:', error);
    }
  };

  const toggleGrid = () => {
    updateSettings({ showGrid: !settings.showGrid });
  };

  return (
    <div className={`toolbar ${className || ''}`}>
      {/* Zoom controls */}
      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onClick={handleZoomOut}
          disabled={viewState.zoom <= 0.1}
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        
        <span className="zoom-display">
          {Math.round(viewState.zoom * 100)}%
        </span>
        
        <button
          className="toolbar-button"
          onClick={handleZoomIn}
          disabled={viewState.zoom >= 5}
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
      </div>

      {/* View controls */}
      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onClick={handleReset}
          title="Reset View"
        >
          <RotateCcw size={18} />
        </button>
        
        <button
          className={`toolbar-button ${settings.showGrid ? 'active' : ''}`}
          onClick={toggleGrid}
          title="Toggle Grid"
        >
          <Grid3X3 size={18} />
        </button>
      </div>

      {/* Crop controls */}
      <div className="toolbar-group">
        <button
          className="toolbar-button"
          disabled={!currentImage?.cropArea}
          title="Crop Mode"
        >
          <Crop size={18} />
        </button>
        
        <button
          className="toolbar-button primary"
          onClick={handleDownload}
          disabled={!currentImage?.cropArea}
          title="Download Cropped Image"
        >
          <Download size={18} />
          <span>Download</span>
        </button>
      </div>

      {/* Settings */}
      <div className="toolbar-group">
        <button
          className="toolbar-button"
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
