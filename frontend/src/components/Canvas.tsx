import { useRef, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Grid3X3 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { loadImage, drawCropArea } from '../utils/imageProcessing';
import { createDefaultCropArea } from '../utils/geometry';
import { Magnifier } from './Magnifier';

interface CanvasProps {
  className?: string;
}

export function Canvas({ className }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderFrameRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const { 
    currentImage, 
    viewState, 
    settings,
    updateImage, 
    setZoom, 
    resetView,
    updateSettings
  } = useAppStore();
  
  const { 
    mousePosition, 
    canvasPosition, 
    isDraggingCorner 
  } = useCanvasInteraction(canvasRef as React.RefObject<HTMLCanvasElement>);

  // 使用useMemo优化渲染条件判断
  const shouldRender = useMemo(() => {
    return !!(canvasRef.current && currentImage);
  }, [currentImage]);

  // 优化的渲染函数，减少拖动时的闪烁
  const scheduledRender = useMemo(() => {
    let isScheduled = false;
    
    return (renderFn: () => void) => {
      if (isScheduled) return;
      
      isScheduled = true;
      renderFrameRef.current = requestAnimationFrame(() => {
        renderFn();
        isScheduled = false;
        lastRenderTimeRef.current = Date.now();
      });
    };
  }, []);

  // Initialize crop area when image loads
  useEffect(() => {
    if (!currentImage || !canvasRef.current || currentImage.cropArea) return;

    const initializeCropArea = async () => {
      try {
        const canvas = canvasRef.current!;
        
        // Set canvas size to fill the container (16:9 aspect ratio)
        const containerWidth = canvas.parentElement?.clientWidth || 800;
        const containerHeight = canvas.parentElement?.clientHeight || Math.round(containerWidth * 9 / 16);
        
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        
        // Create default crop area based on canvas size
        const cropArea = createDefaultCropArea(canvas.width, canvas.height);
        
        updateImage(currentImage.id, { 
          cropArea,
          status: 'completed'
        });
      } catch (error) {
        console.error('Failed to initialize crop area:', error);
        updateImage(currentImage.id, { status: 'error' });
      }
    };

    initializeCropArea();
  }, [currentImage, updateImage]);

  // Render canvas content with optimized rendering
  useEffect(() => {
    if (!shouldRender) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = async () => {
      try {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Load and draw image
        let img: HTMLImageElement;
        if (imageCache.current.has(currentImage!.originalUrl)) {
          img = imageCache.current.get(currentImage!.originalUrl)!;
        } else {
          img = await loadImage(currentImage!.originalUrl);
          imageCache.current.set(currentImage!.originalUrl, img);
        }
        
        // Calculate image position and size
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        
        const imgWidth = img.width * scale;
        const imgHeight = img.height * scale;
        const imgX = (canvas.width - imgWidth) / 2;
        const imgY = (canvas.height - imgHeight) / 2;
        
        // Apply zoom and offset
        ctx.save();
        ctx.translate(viewState.offset.x, viewState.offset.y);
        ctx.scale(viewState.zoom, viewState.zoom);
        
        // Draw image
        ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
        
        ctx.restore();
        
        // Draw crop area if it exists
        if (currentImage!.cropArea) {
          drawCropArea(
            ctx,
            currentImage!.cropArea,
            viewState.zoom,
            viewState.offset,
            viewState.selectedCorner
          );
        }
        
      } catch (error) {
        console.error('Failed to render canvas:', error);
        // Draw error state
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          'Error loading image',
          canvas.width / 2,
          canvas.height / 2
        );
      }
    };

    // 使用优化的渲染调度
    scheduledRender(render);
  }, [shouldRender, currentImage, viewState, scheduledRender]);

  // Handle window resize to adjust canvas size
  useEffect(() => {
    const cache = imageCache.current;
    
    const handleResize = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const containerWidth = canvas.parentElement?.clientWidth || 800;
      const containerHeight = canvas.parentElement?.clientHeight || Math.round(containerWidth * 9 / 16);
      
      canvas.width = containerWidth;
      canvas.height = containerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      // 清理动画帧
      if (renderFrameRef.current) {
        cancelAnimationFrame(renderFrameRef.current);
      }
      // 清理图像缓存
      cache.clear();
    };
  }, []);

  if (!currentImage) {
    return (
      <div className={`canvas-placeholder ${className || ''}`}>
        <div className="placeholder-content">
          <p>No image selected</p>
          <p className="text-sm text-gray-500">
            Upload an image to start cropping
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`canvas-container ${className || ''}`}>
      <canvas
        ref={canvasRef}
        className="canvas"
        style={{
          cursor: viewState.isDragging 
            ? 'grabbing' 
            : viewState.selectedCorner !== null 
              ? 'crosshair' 
              : 'grab'
        }}
      />
      
      {/* Canvas Controls */}
      <div className="canvas-controls">
        <div className="control-group">
          <button
            className="control-btn"
            onClick={() => setZoom(Math.min(5, viewState.zoom + 0.25))}
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <div className="zoom-info">
            {Math.round(viewState.zoom * 100)}%
          </div>
          <button
            className="control-btn"
            onClick={() => setZoom(Math.max(0.1, viewState.zoom - 0.25))}
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
        </div>
        
        <div className="control-group">
          <button
            className="control-btn"
            onClick={resetView}
            title="Reset View"
          >
            <RotateCcw size={16} />
          </button>
        </div>
        
        <div className="control-group">
          <button
            className={`control-btn ${settings.showGrid ? 'active' : ''}`}
            onClick={() => updateSettings({ showGrid: !settings.showGrid })}
            title="Toggle Grid"
          >
            <Grid3X3 size={16} />
          </button>
        </div>
      </div>
      
      {/* Corner Position Info */}
      {viewState.selectedCorner !== null && currentImage?.cropArea && (
        <div className="corner-info">
          <div className="info-item">
            <span>Corner {viewState.selectedCorner + 1}</span>
            <span>
              {(() => {
                const corners = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const;
                const corner = currentImage.cropArea[corners[viewState.selectedCorner]];
                return `(${Math.round(corner.x)}, ${Math.round(corner.y)})`;
              })()}
            </span>
          </div>
        </div>
      )}
      
      {/* 瞄准镜 */}
      <Magnifier
        isVisible={isDraggingCorner && viewState.selectedCorner !== null}
        mousePosition={mousePosition}
        canvasPosition={canvasPosition}
        imageUrl={currentImage.originalUrl}
        selectedCorner={viewState.selectedCorner}
        cropArea={currentImage.cropArea}
        zoom={viewState.zoom}
        offset={viewState.offset}
      />
    </div>
  );
}
