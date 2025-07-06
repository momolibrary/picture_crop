import { useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Point, CropArea } from '../types';
import { 
  screenToCanvas, 
  isPointNear, 
  constrainPoint, 
  createDefaultCropArea 
} from '../utils/geometry';

export function useCanvasInteraction(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const {
    currentImage,
    viewState,
    setSelectedCorner,
    setIsDragging,
    setOffset,
    updateImage
  } = useAppStore();
  
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef<Point>({ x: 0, y: 0 });
  const dragStartOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);
  const pendingUpdateRef = useRef<{
    cornerIndex: number;
    newPoint: Point;
  } | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const THROTTLE_MS = 32; // 限制为30fps，减少闪烁

  const getCropAreaPoints = useCallback((): Point[] => {
    if (!currentImage?.cropArea) return [];
    return [
      currentImage.cropArea.topLeft,
      currentImage.cropArea.topRight,
      currentImage.cropArea.bottomRight,
      currentImage.cropArea.bottomLeft
    ];
  }, [currentImage?.cropArea]);

  const updateCropAreaPoint = useCallback((cornerIndex: number, newPoint: Point) => {
    if (!currentImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const constrainedPoint = constrainPoint(newPoint, canvas.width, canvas.height);
    
    // 使用更严格的节流控制，减少不必要的状态更新
    const now = Date.now();
    
    // 总是存储最新的待更新数据
    pendingUpdateRef.current = { cornerIndex, newPoint: constrainedPoint };
    
    // 如果距离上次更新时间太短，延迟更新
    if (now - lastUpdateTimeRef.current < THROTTLE_MS) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        const pending = pendingUpdateRef.current;
        if (!pending || !currentImage) return;
        
        const currentCropArea = currentImage.cropArea || createDefaultCropArea(canvas.width, canvas.height);
        const cornerNames = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const;
        
        const updatedCropArea: CropArea = {
          ...currentCropArea,
          [cornerNames[pending.cornerIndex]]: pending.newPoint
        };

        updateImage(currentImage.id, { cropArea: updatedCropArea });
        pendingUpdateRef.current = null;
        lastUpdateTimeRef.current = Date.now();
      });
      return;
    }
    
    // 直接更新（第一次拖拽或间隔足够长时）
    const currentCropArea = currentImage.cropArea || createDefaultCropArea(canvas.width, canvas.height);
    const cornerNames = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const;
    
    const updatedCropArea: CropArea = {
      ...currentCropArea,
      [cornerNames[cornerIndex]]: constrainedPoint
    };

    updateImage(currentImage.id, { cropArea: updatedCropArea });
    lastUpdateTimeRef.current = now;
    pendingUpdateRef.current = null; // 清空pending
  }, [currentImage, updateImage, canvasRef]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!canvasRef.current || !currentImage) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mousePos = { x: event.clientX, y: event.clientY };
    const canvasPos = screenToCanvas(mousePos, rect, viewState.zoom, viewState.offset);
    
    // Check if clicking on a corner handle
    const points = getCropAreaPoints();
    let cornerIndex = -1;
    
    for (let i = 0; i < points.length; i++) {
      if (isPointNear(canvasPos, points[i], 15 / viewState.zoom)) {
        cornerIndex = i;
        break;
      }
    }

    if (cornerIndex !== -1) {
      // Start dragging a corner
      setSelectedCorner(cornerIndex);
      setIsDragging(true);
      isDraggingRef.current = true;
      lastMousePosRef.current = canvasPos;
    } else {
      // Start panning
      setSelectedCorner(null);
      setIsDragging(true);
      isDraggingRef.current = true;
      lastMousePosRef.current = mousePos;
      dragStartOffsetRef.current = viewState.offset;
    }
  }, [
    canvasRef,
    currentImage,
    viewState,
    getCropAreaPoints,
    setSelectedCorner,
    setIsDragging
  ]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDraggingRef.current || !canvasRef.current) return;

    // 防止默认行为，提高性能
    event.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mousePos = { x: event.clientX, y: event.clientY };

    if (viewState.selectedCorner !== null) {
      // Dragging a corner - 使用节流处理，并添加距离阈值
      const canvasPos = screenToCanvas(mousePos, rect, viewState.zoom, viewState.offset);
      
      // 只有当鼠标移动距离超过阈值时才更新，减少微小移动导致的重绘
      const lastPos = lastMousePosRef.current;
      const distance = Math.sqrt(
        Math.pow(canvasPos.x - lastPos.x, 2) + Math.pow(canvasPos.y - lastPos.y, 2)
      );
      
      if (distance > 1) { // 移动距离阈值，单位为像素
        updateCropAreaPoint(viewState.selectedCorner, canvasPos);
        lastMousePosRef.current = canvasPos;
      }
    } else {
      // Panning - 直接更新offset，无需节流
      const deltaX = mousePos.x - lastMousePosRef.current.x;
      const deltaY = mousePos.y - lastMousePosRef.current.y;
      
      setOffset({
        x: dragStartOffsetRef.current.x + deltaX,
        y: dragStartOffsetRef.current.y + deltaY
      });
    }
  }, [
    viewState.selectedCorner,
    viewState.zoom,
    viewState.offset,
    updateCropAreaPoint,
    setOffset,
    canvasRef
  ]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      setIsDragging(false);
      setSelectedCorner(null);
      isDraggingRef.current = false;
      
      // 清理动画帧
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }
    }
  }, [setIsDragging, setSelectedCorner]);

  const handleWheel = useCallback((event: WheelEvent) => {
    if (!canvasRef.current) return;
    
    event.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mousePos = { x: event.clientX, y: event.clientY };
    
    // Zoom in/out
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, viewState.zoom * zoomFactor));
    
    // Adjust offset to zoom towards mouse position
    const zoomRatio = newZoom / viewState.zoom;
    const newOffset = {
      x: mousePos.x - rect.left - (mousePos.x - rect.left - viewState.offset.x) * zoomRatio,
      y: mousePos.y - rect.top - (mousePos.y - rect.top - viewState.offset.y) * zoomRatio
    };
    
    useAppStore.getState().setZoom(newZoom);
    setOffset(newOffset);
  }, [canvasRef, viewState, setOffset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('wheel', handleWheel);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // 清理动画帧
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasRef, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);

  return {
    updateCropAreaPoint,
    getCropAreaPoints
  };
}
