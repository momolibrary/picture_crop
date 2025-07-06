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
    
    // 添加超时机制
    const timeout = setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, 10000); // 10秒超时
    
    img.onload = () => {
      clearTimeout(timeout);
      console.log('Image loaded successfully:', src, 'Size:', img.width, 'x', img.height);
      console.log('Image properties:', {
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        width: img.width,
        height: img.height
      });
      
      // 验证图片确实加载成功
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new Error('Image loaded but has zero dimensions'));
        return;
      }
      
      resolve(img);
    };
    
    img.onerror = (error) => {
      clearTimeout(timeout);
      console.error('Failed to load image:', src, error);
      console.error('Error event details:', {
        type: 'error',
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete
      });
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    // 设置 crossOrigin 以避免 Canvas 污染问题
    img.crossOrigin = 'anonymous';
    
    // 添加额外的调试信息
    console.log('Started loading image:', src);
    console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
    
    // 设置 src 最后，确保事件监听器已经绑定
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
  
  console.log('Drawing crop area with points:', points);
  console.log('Canvas size:', ctx.canvas.width, 'x', ctx.canvas.height);
  console.log('Zoom:', zoom, 'Offset:', offset);
  
  // Transform points with zoom and offset
  const transformedPoints = points.map(point => ({
    x: point.x * zoom + offset.x,
    y: point.y * zoom + offset.y
  }));
  
  console.log('Transformed points:', transformedPoints);
  
  // 使用 save/restore 来避免状态污染
  ctx.save();
  
  // Draw semi-transparent overlay outside crop area first
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
  
  // Reset composite operation for drawing outline and handles
  ctx.globalCompositeOperation = 'source-over';
  
  // Draw crop area outline with bright green color
  ctx.strokeStyle = '#00ff00'; // 亮绿色
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  
  ctx.beginPath();
  ctx.moveTo(transformedPoints[0].x, transformedPoints[0].y);
  for (let i = 1; i < transformedPoints.length; i++) {
    ctx.lineTo(transformedPoints[i].x, transformedPoints[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  
  console.log('Crop area outline drawn');
  
  // Draw corner handles - 批量绘制以提高性能
  transformedPoints.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
    
    if (selectedCorner === index) {
      ctx.fillStyle = '#ff0000'; // 选中时红色
      ctx.strokeStyle = '#cc0000';
    } else {
      ctx.fillStyle = '#00ff00'; // 亮绿色
      ctx.strokeStyle = '#00cc00';
    }
    
    ctx.fill();
    ctx.stroke();
  });
  
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
