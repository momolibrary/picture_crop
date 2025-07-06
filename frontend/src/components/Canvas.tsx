import { useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { loadImage, drawCropArea } from '../utils/imageProcessing';
import { createDefaultCropArea } from '../utils/geometry';

interface CanvasProps {
  className?: string;
}

export function Canvas({ className }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentImage, viewState, updateImage } = useAppStore();
  
  useCanvasInteraction(canvasRef);

  // Initialize crop area when image loads
  useEffect(() => {
    if (!currentImage || !canvasRef.current || currentImage.cropArea) return;

    const initializeCropArea = async () => {
      try {
        const img = await loadImage(currentImage.originalUrl);
        const canvas = canvasRef.current!;
        
        // Set canvas size to image size or container size
        const maxWidth = canvas.parentElement?.clientWidth || 800;
        const maxHeight = canvas.parentElement?.clientHeight || 600;
        
        canvas.width = Math.min(img.width, maxWidth);
        canvas.height = Math.min(img.height, maxHeight);
        
        // Create default crop area
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

  // Render canvas content
  useEffect(() => {
    if (!canvasRef.current || !currentImage) return;

    const canvas = canvasRef.current;
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
        const img = await loadImage(currentImage.originalUrl);
        
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
        if (currentImage.cropArea) {
          drawCropArea(
            ctx,
            currentImage.cropArea,
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

    render();
  }, [currentImage, viewState]);

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
      
      {/* Zoom controls */}
      <div className="canvas-controls">
        <div className="zoom-info">
          {Math.round(viewState.zoom * 100)}%
        </div>
      </div>
    </div>
  );
}
