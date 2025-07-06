import type { ProcessedImage, CropArea } from '../types';
import { generateId } from './geometry';

/**
 * Create a ProcessedImage from a File
 */
export function createImageFromFile(file: File): ProcessedImage {
  return {
    id: generateId(),
    originalName: file.name,
    originalUrl: URL.createObjectURL(file),
    status: 'pending',
    timestamp: Date.now()
  };
}

/**
 * Load an image and return its dimensions
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Resize image to fit within max dimensions while maintaining aspect ratio
 */
export function calculateImageDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return { width, height };
}

/**
 * Draw image on canvas with optional scaling
 */
export function drawImageOnCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  scale: number = 1
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const { width, height } = calculateImageDimensions(
    image.width,
    image.height,
    canvas.width / scale,
    canvas.height / scale
  );
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Center the image
  const x = (canvas.width - width * scale) / 2;
  const y = (canvas.height - height * scale) / 2;
  
  ctx.drawImage(image, x, y, width * scale, height * scale);
}

/**
 * Draw crop area overlay on canvas
 */
export function drawCropArea(
  ctx: CanvasRenderingContext2D,
  cropArea: CropArea,
  zoom: number,
  offset: { x: number; y: number },
  selectedCorner?: number | null
): void {
  const points = [
    cropArea.topLeft,
    cropArea.topRight,
    cropArea.bottomRight,
    cropArea.bottomLeft
  ];
  
  // Transform points with zoom and offset
  const transformedPoints = points.map(point => ({
    x: point.x * zoom + offset.x,
    y: point.y * zoom + offset.y
  }));
  
  // Draw crop area outline
  ctx.save();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  
  ctx.beginPath();
  ctx.moveTo(transformedPoints[0].x, transformedPoints[0].y);
  for (let i = 1; i < transformedPoints.length; i++) {
    ctx.lineTo(transformedPoints[i].x, transformedPoints[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  
  // Draw corner handles
  transformedPoints.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
    
    if (selectedCorner === index) {
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#dc2626';
    } else {
      ctx.fillStyle = '#3b82f6';
      ctx.strokeStyle = '#2563eb';
    }
    
    ctx.fill();
    ctx.stroke();
  });
  
  // Draw semi-transparent overlay outside crop area
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Cut out the crop area
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(transformedPoints[0].x, transformedPoints[0].y);
  for (let i = 1; i < transformedPoints.length; i++) {
    ctx.lineTo(transformedPoints[i].x, transformedPoints[i].y);
  }
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

/**
 * Check if file is a valid image
 */
export function isValidImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Convert canvas to blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement, quality: number = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}
