import { useRef, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Grid3X3 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { loadImage, drawCropArea } from '../utils/imageProcessing';
import { createDefaultCropArea } from '../utils/geometry';
import { Magnifier } from './Magnifier';

interface CanvasProps {
  className?: string;
  onCanvasResize?: (width: number, height: number) => void;
}

export function Canvas({ className, onCanvasResize }: CanvasProps) {
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
    // 只要有currentImage就应该尝试渲染，canvasRef会在组件挂载后变为可用
    const result = !!currentImage;
    console.log('shouldRender calculation:', { 
      hasCanvas: !!canvasRef.current, 
      hasCurrentImage: !!currentImage, 
      result 
    });
    return result;
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

  // Initialize canvas dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const initializeCanvasDimensions = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      // 只有在尺寸变化时才更新
      if (canvas.width !== containerWidth || canvas.height !== containerHeight) {
        console.log('Updating canvas dimensions:', { 
          from: { width: canvas.width, height: canvas.height },
          to: { width: containerWidth, height: containerHeight }
        });
        
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        
        // 通知父组件Canvas尺寸变化
        onCanvasResize?.(containerWidth, containerHeight);
      }
    };
    
    // 初始化
    initializeCanvasDimensions();
    
    // 监听窗口大小变化
    const handleResize = () => {
      initializeCanvasDimensions();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onCanvasResize]);

  // Initialize crop area when image loads
  useEffect(() => {
    console.log('Crop area initialization useEffect triggered, currentImage:', currentImage);
    
    if (!currentImage) {
      console.log('No current image, skipping crop area initialization');
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas ref not available for crop area initialization');
      return;
    }

    // 只有在没有cropArea时才创建默认的
    if (!currentImage.cropArea) {
      console.log('Creating default crop area for canvas size:', canvas.width, 'x', canvas.height);
      const cropArea = createDefaultCropArea(canvas.width, canvas.height);
      console.log('Created default crop area:', cropArea);
      
      updateImage(currentImage.id, { 
        cropArea,
        status: 'pending' // 保持为 pending，让用户可以编辑
      });
    } else {
      console.log('Image already has crop area:', currentImage.cropArea);
    }
  }, [currentImage, updateImage]);

  // Render canvas content with optimized rendering
  useEffect(() => {
    console.log('=== Canvas render effect triggered ===', new Date().toLocaleTimeString());
    console.log('shouldRender:', shouldRender, 'currentImage:', currentImage?.originalName || 'none');
    
    if (!shouldRender) {
      console.log('Not rendering canvas - shouldRender is false');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas ref not available yet');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('No canvas context available');
      return;
    }

    const render = async () => {
      try {
        console.log('=== Starting render for image:', currentImage!.originalUrl, 'at', new Date().toLocaleTimeString());
        
        // 获取显示尺寸
        const displayWidth = canvas.width;
        const displayHeight = canvas.height;
        
        console.log('Canvas dimensions for rendering:', { displayWidth, displayHeight });
        
        // Clear canvas with proper dimensions
        ctx.clearRect(0, 0, displayWidth, displayHeight);
        console.log('Canvas cleared');
        
        // Draw background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        console.log('Background drawn');
        
        // Load and draw image
        let img: HTMLImageElement;
        const imageUrl = currentImage!.originalUrl;
        console.log('=== IMAGE LOADING START ===');
        console.log('Loading image URL:', imageUrl);
        console.log('Image cache has this URL:', imageCache.current.has(imageUrl));
        
        try {
          if (imageCache.current.has(imageUrl)) {
            img = imageCache.current.get(imageUrl)!;
            console.log('Using cached image, complete:', img.complete, 'naturalWidth:', img.naturalWidth);
          } else {
            console.log('Loading new image from URL:', imageUrl);
            // 清理缓存中可能的坏图片
            imageCache.current.clear();
            img = await loadImage(imageUrl);
            imageCache.current.set(imageUrl, img);
            console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
            console.log('Image complete:', img.complete, 'naturalWidth:', img.naturalWidth, 'naturalHeight:', img.naturalHeight);
          }
          
          // 验证图片是否真的加载成功
          if (!img.complete || img.naturalWidth === 0) {
            throw new Error(`Image not properly loaded: complete=${img.complete}, naturalWidth=${img.naturalWidth}`);
          }
          
          console.log('=== IMAGE LOADING SUCCESS ===');
          
        } catch (error) {
          console.error('=== IMAGE LOADING FAILED ===');
          console.error('Failed to load image, drawing placeholder:', error);
          // 如果图片加载失败，绘制一个占位符
          ctx.fillStyle = '#cccccc';
          ctx.fillRect(100, 100, displayWidth - 200, displayHeight - 200);
          ctx.fillStyle = '#666666';
          ctx.font = '20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Image Load Failed', displayWidth / 2, displayHeight / 2);
          ctx.fillText(error instanceof Error ? error.message : 'Unknown error', displayWidth / 2, displayHeight / 2 + 30);
          return; // 提前返回
        }
        
        // Ensure canvas has proper dimensions
        if (canvas.width === 0 || canvas.height === 0) {
          console.warn('Canvas has zero dimensions, skipping render');
          return;
        }
        
        // Calculate image position and size to fit within display area
        const scale = Math.min(
          displayWidth / img.width,
          displayHeight / img.height
        );
        
        const imgWidth = img.width * scale;
        const imgHeight = img.height * scale;
        const imgX = (displayWidth - imgWidth) / 2;
        const imgY = (displayHeight - imgHeight) / 2;
        
        console.log('Image display info:', { 
          originalSize: { width: img.width, height: img.height },
          scale, 
          displaySize: { width: imgWidth, height: imgHeight },
          position: { x: imgX, y: imgY }
        });
        
        // 在绘制图片前先绘制一个明显的背景框
        ctx.fillStyle = '#ffcccc';
        ctx.fillRect(imgX - 2, imgY - 2, imgWidth + 4, imgHeight + 4);
        console.log('Image background frame drawn');
        
        // Apply zoom and offset
        ctx.save();
        
        // 应用视图变换
        console.log('Current viewState:', viewState);
        ctx.translate(viewState.offset.x, viewState.offset.y);
        ctx.scale(viewState.zoom, viewState.zoom);
        
        // Draw image
        console.log('About to draw image with parameters:', {
          img: img.src,
          imgComplete: img.complete,
          imgNaturalWidth: img.naturalWidth,
          imgNaturalHeight: img.naturalHeight,
          drawX: imgX,
          drawY: imgY,
          drawWidth: imgWidth,
          drawHeight: imgHeight
        });
        
        ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
        
        console.log('=== drawImage call completed ===');
        
        ctx.restore();
        
        console.log('Image drawn successfully');
        
        // 添加一个简单的标记确认渲染完成
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(displayWidth - 60, 10, 50, 20);
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.fillText('IMG OK', displayWidth - 55, 24);
        
        // Draw crop area if it exists
        if (currentImage!.cropArea) {
          console.log('Drawing crop area:', currentImage!.cropArea);
          drawCropArea(
            ctx,
            currentImage!.cropArea,
            viewState.zoom,
            viewState.offset,
            viewState.selectedCorner
          );
        } else {
          console.log('No crop area defined for current image yet');
        }
        
        console.log('Canvas render completed successfully');
        
      } catch (error) {
        console.error('Failed to render canvas:', error);
        console.error('Current image:', currentImage);
        console.error('Image URL:', currentImage?.originalUrl);
        
        // 获取显示尺寸用于错误显示
        const errorDisplayWidth = canvas.width;
        const errorDisplayHeight = canvas.height;
        
        // Draw error state
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(0, 0, errorDisplayWidth, errorDisplayHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          'Error loading image',
          errorDisplayWidth / 2,
          errorDisplayHeight / 2
        );
        
        ctx.font = '12px Arial';
        ctx.fillText(
          error instanceof Error ? error.message : 'Unknown error',
          errorDisplayWidth / 2,
          errorDisplayHeight / 2 + 20
        );
        
        // 如果是网络错误，显示图片 URL
        if (currentImage?.originalUrl) {
          ctx.font = '10px Arial';
          ctx.fillText(
            `URL: ${currentImage.originalUrl}`,
            errorDisplayWidth / 2,
            errorDisplayHeight / 2 + 40
          );
        }
      }
    };

    // 使用防抖机制避免过于频繁的重绘
    const timeoutId = setTimeout(() => {
      console.log('Executing render after debounce delay');
      // 直接调用render，不使用调度机制
      render();
    }, 50); // 50ms防抖
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [shouldRender, currentImage, viewState, scheduledRender]);

  // Handle window resize to adjust canvas size
  useEffect(() => {
    const cache = imageCache.current;
    
    const handleResize = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      // 更新 Canvas 实际分辨率
      canvas.width = containerWidth;
      canvas.height = containerHeight;
      
      console.log('Canvas resized:', {
        displayWidth: containerWidth,
        displayHeight: containerHeight,
        actualWidth: canvas.width,
        actualHeight: canvas.height
      });
      
      // 触发重新渲染
      onCanvasResize?.(containerWidth, containerHeight);
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
  }, [onCanvasResize]);

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
      
      {/* Debug info - remove in production */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        pointerEvents: 'none',
        zIndex: 1000
      }}>
        Canvas: {canvasRef.current?.width || 0}x{canvasRef.current?.height || 0} | 
        Ratio: {canvasRef.current?.width && canvasRef.current?.height ? 
          (canvasRef.current.width / canvasRef.current.height).toFixed(2) : 'N/A'} | 
        Image: {currentImage?.originalName || 'None'}
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
