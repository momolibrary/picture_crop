import type { Point, CropArea } from '../types';

/**
 * Calculate the distance between two points
 */
export function calculateDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Check if a point is near another point within a threshold
 */
export function isPointNear(p1: Point, p2: Point, threshold: number = 10): boolean {
  return calculateDistance(p1, p2) <= threshold;
}

/**
 * Convert screen coordinates to canvas coordinates
 */
export function screenToCanvas(
  screenPoint: Point, 
  canvasRect: DOMRect, 
  zoom: number, 
  offset: Point
): Point {
  return {
    x: (screenPoint.x - canvasRect.left - offset.x) / zoom,
    y: (screenPoint.y - canvasRect.top - offset.y) / zoom
  };
}

/**
 * Convert canvas coordinates to screen coordinates
 */
export function canvasToScreen(
  canvasPoint: Point, 
  canvasRect: DOMRect, 
  zoom: number, 
  offset: Point
): Point {
  return {
    x: canvasPoint.x * zoom + offset.x + canvasRect.left,
    y: canvasPoint.y * zoom + offset.y + canvasRect.top
  };
}

/**
 * Constrain a point within given bounds
 */
export function constrainPoint(point: Point, width: number, height: number): Point {
  return {
    x: Math.max(0, Math.min(width, point.x)),
    y: Math.max(0, Math.min(height, point.y))
  };
}

/**
 * Get the center point of a crop area
 */
export function getCropAreaCenter(cropArea: CropArea): Point {
  const x = (cropArea.topLeft.x + cropArea.topRight.x + cropArea.bottomRight.x + cropArea.bottomLeft.x) / 4;
  const y = (cropArea.topLeft.y + cropArea.topRight.y + cropArea.bottomRight.y + cropArea.bottomLeft.y) / 4;
  return { x, y };
}

/**
 * Create a default crop area for an image
 */
export function createDefaultCropArea(width: number, height: number): CropArea {
  const margin = Math.min(width, height) * 0.1;
  return {
    topLeft: { x: margin, y: margin },
    topRight: { x: width - margin, y: margin },
    bottomRight: { x: width - margin, y: height - margin },
    bottomLeft: { x: margin, y: height - margin }
  };
}

/**
 * Check if a crop area is valid (points form a proper quadrilateral)
 */
export function isValidCropArea(cropArea: CropArea): boolean {
  const points = [cropArea.topLeft, cropArea.topRight, cropArea.bottomRight, cropArea.bottomLeft];
  
  // Check if any points are the same
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].x === points[j].x && points[i].y === points[j].y) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
