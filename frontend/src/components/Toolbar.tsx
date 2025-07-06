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
  canvasWidth?: number;
  canvasHeight?: number;
}

export function Toolbar({ className, canvasWidth = 800, canvasHeight = 600 }: ToolbarProps) {
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
      setError('未选择图像');
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
        setError(result.message || '自动检测失败');
      }
    } catch (error) {
      console.error('Auto detect failed:', error);
      setError('自动检测失败');
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const handlePreview = () => {
    if (!currentImage || !currentImage.cropArea) {
      setError('请先定义裁剪区域');
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
      setError('未选择图像或裁剪区域');
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
      setError('下载图像失败');
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
            title="缩小"
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
            title="放大"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        {/* View controls */}
        <div className="toolbar-group">
          <button
            className="toolbar-button"
            onClick={handleReset}
            title="重置视图"
          >
            <RotateCcw size={18} />
          </button>
          
          <button
            className={`toolbar-button ${settings.showGrid ? 'active' : ''}`}
            onClick={toggleGrid}
            title="切换网格"
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
            title="自动检测角点"
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
            title="重置裁剪区域"
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
            title="预览结果"
          >
            <Eye size={18} />
          </button>
          
          <button
            className="toolbar-button"
            onClick={() => setShowSettings(true)}
            title="设置"
          >
            <Settings size={18} />
          </button>
          
          <button
            className="toolbar-button primary"
            onClick={handleDownload}
            disabled={!currentImage || !currentImage.cropArea}
            title="下载裁剪图像"
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
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        viewState={viewState}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
