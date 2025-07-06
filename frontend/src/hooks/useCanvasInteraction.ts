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
    
    const currentCropArea = currentImage.cropArea || createDefaultCropArea(canvas.width, canvas.height);
    const cornerNames = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const;
    
    const updatedCropArea: CropArea = {
      ...currentCropArea,
      [cornerNames[cornerIndex]]: constrainedPoint
    };

    updateImage(currentImage.id, { cropArea: updatedCropArea });
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

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mousePos = { x: event.clientX, y: event.clientY };

    if (viewState.selectedCorner !== null) {
      // Dragging a corner
      const canvasPos = screenToCanvas(mousePos, rect, viewState.zoom, viewState.offset);
      updateCropAreaPoint(viewState.selectedCorner, canvasPos);
    } else {
      // Panning
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
    };
  }, [canvasRef, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);

  return {
    updateCropAreaPoint,
    getCropAreaPoints
  };
}
