import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Grid3X3,
  Settings,
  Eye,
  Wand2,
  Square
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PreviewModal } from './PreviewModal';
import { SettingsPanel } from './SettingsPanel';
import { apiService } from '../services/api';

interface ToolbarProps {
  className?: string;
}

export function Toolbar({ className }: ToolbarProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const {
    currentImage,
    viewState,
    settings,
    setZoom,
    resetView,
    updateSettings,
    updateImage,
    setError
  } = useAppStore();

  const handleZoomIn = () => {
    const newZoom = Math.min(5, viewState.zoom + 0.25);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, viewState.zoom - 0.25);
    setZoom(newZoom);
  };

  const handleReset = () => {
    resetView();
  };

  const handleAutoDetect = async () => {
    if (!currentImage) {
      setError('No image selected');
      return;
    }

    setIsAutoDetecting(true);
    try {
      const result = await apiService.autoDetectCorners(currentImage.id);
      
      if (result.success && result.corners) {
        const cropArea = {
          topLeft: { x: result.corners[0][0], y: result.corners[0][1] },
          topRight: { x: result.corners[1][0], y: result.corners[1][1] },
          bottomRight: { x: result.corners[2][0], y: result.corners[2][1] },
          bottomLeft: { x: result.corners[3][0], y: result.corners[3][1] },
        };
        
        updateImage(currentImage.id, { cropArea });
      } else {
        setError(result.message || 'Auto detection failed');
      }
    } catch (error) {
      console.error('Auto detect failed:', error);
      setError('Auto detection failed');
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const handlePreview = () => {
    if (!currentImage || !currentImage.cropArea) {
      setError('Please define a crop area first');
      return;
    }
    setShowPreview(true);
  };

  const handleResetCrop = () => {
    if (!currentImage) return;
    
    // Create a default crop area
    const defaultCropArea = {
      topLeft: { x: 50, y: 50 },
      topRight: { x: 350, y: 50 },
      bottomRight: { x: 350, y: 250 },
      bottomLeft: { x: 50, y: 250 },
    };
    
    updateImage(currentImage.id, { cropArea: defaultCropArea });
  };

  const handleDownload = async () => {
    if (!currentImage || !currentImage.cropArea) {
      setError('No image or crop area selected');
      return;
    }

    try {
      // This would typically process and download the image
      console.log('Downloading cropped image:', {
        imageId: currentImage.id,
        cropArea: currentImage.cropArea
      });
      
      // For now, just show the preview modal
      setShowPreview(true);
    } catch (error) {
      setError('Failed to download image');
      console.error('Download error:', error);
    }
  };

  const toggleGrid = () => {
    updateSettings({ showGrid: !settings.showGrid });
  };

  return (
    <>
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
            onClick={handleAutoDetect}
            disabled={!currentImage || isAutoDetecting}
            title="Auto Detect Corners"
          >
            {isAutoDetecting ? (
              <Settings className="spin" size={18} />
            ) : (
              <Wand2 size={18} />
            )}
          </button>
          
          <button
            className="toolbar-button"
            onClick={handleResetCrop}
            disabled={!currentImage}
            title="Reset Crop Area"
          >
            <Square size={18} />
          </button>
        </div>

        {/* Action controls */}
        <div className="toolbar-group">
          <button
            className="toolbar-button"
            onClick={handlePreview}
            disabled={!currentImage || !currentImage.cropArea}
            title="Preview Result"
          >
            <Eye size={18} />
          </button>
          
          <button
            className="toolbar-button"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Settings size={18} />
          </button>
          
          <button
            className="toolbar-button primary"
            onClick={handleDownload}
            disabled={!currentImage || !currentImage.cropArea}
            title="Download Cropped Image"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        image={currentImage}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
