import type { Point, CropArea } from '../types';

/**
 * 坐标转换工具函数
 * 处理Canvas坐标系统和图片原始坐标系统之间的转换
 */

export interface ImageDisplayInfo {
  // 图片在canvas中的显示位置和尺寸
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number; // 图片缩放比例
}

/**
 * 计算图片在Canvas中的显示信息
 */
export function calculateImageDisplayInfo(
  canvas: HTMLCanvasElement,
  imageWidth: number,
  imageHeight: number,
  zoom: number = 1,
  offset: Point = { x: 0, y: 0 }
): ImageDisplayInfo {
  // 计算基础缩放比例（适应Canvas尺寸）
  const baseScale = Math.min(
    canvas.width / imageWidth,
    canvas.height / imageHeight
  );
  
  // 应用用户缩放
  const actualScale = baseScale * zoom;
  
  // 计算显示尺寸
  const displayWidth = imageWidth * actualScale;
  const displayHeight = imageHeight * actualScale;
  
  // 计算居中位置
  const x = (canvas.width - displayWidth) / 2 + offset.x;
  const y = (canvas.height - displayHeight) / 2 + offset.y;
  
  return {
    x,
    y,
    width: displayWidth,
    height: displayHeight,
    scale: actualScale
  };
}

/**
 * 将Canvas坐标转换为图片原始坐标
 */
export function canvasToImageCoordinates(
  canvasPoint: Point,
  imageDisplayInfo: ImageDisplayInfo,
  originalImageWidth: number,
  originalImageHeight: number
): Point {
  // 转换为图片显示区域内的相对坐标
  const relativeX = canvasPoint.x - imageDisplayInfo.x;
  const relativeY = canvasPoint.y - imageDisplayInfo.y;
  
  // 转换为原始图片坐标
  const imageX = (relativeX / imageDisplayInfo.width) * originalImageWidth;
  const imageY = (relativeY / imageDisplayInfo.height) * originalImageHeight;
  
  // 确保坐标在有效范围内
  return {
    x: Math.max(0, Math.min(originalImageWidth, imageX)),
    y: Math.max(0, Math.min(originalImageHeight, imageY))
  };
}

/**
 * 将图片原始坐标转换为Canvas坐标
 */
export function imageToCanvasCoordinates(
  imagePoint: Point,
  imageDisplayInfo: ImageDisplayInfo,
  originalImageWidth: number,
  originalImageHeight: number
): Point {
  // 转换为相对比例
  const relativeX = imagePoint.x / originalImageWidth;
  const relativeY = imagePoint.y / originalImageHeight;
  
  // 转换为Canvas坐标
  const canvasX = imageDisplayInfo.x + relativeX * imageDisplayInfo.width;
  const canvasY = imageDisplayInfo.y + relativeY * imageDisplayInfo.height;
  
  return { x: canvasX, y: canvasY };
}

/**
 * 将裁剪区域从Canvas坐标转换为图片原始坐标
 */
export function convertCropAreaToImageCoordinates(
  cropArea: CropArea,
  imageDisplayInfo: ImageDisplayInfo,
  originalImageWidth: number,
  originalImageHeight: number
): number[][] {
  const points = [
    cropArea.topLeft,
    cropArea.topRight,
    cropArea.bottomRight,
    cropArea.bottomLeft
  ];
  
  return points.map(point => {
    const imageCoord = canvasToImageCoordinates(
      point,
      imageDisplayInfo,
      originalImageWidth,
      originalImageHeight
    );
    return [imageCoord.x, imageCoord.y];
  });
}

/**
 * 将图片原始坐标点转换为裁剪区域（Canvas坐标）
 */
export function convertImageCoordinatesToCropArea(
  imagePoints: number[][],
  imageDisplayInfo: ImageDisplayInfo,
  originalImageWidth: number,
  originalImageHeight: number
): CropArea {
  const canvasPoints = imagePoints.map(([x, y]) => 
    imageToCanvasCoordinates(
      { x, y },
      imageDisplayInfo,
      originalImageWidth,
      originalImageHeight
    )
  );
  
  return {
    topLeft: canvasPoints[0],
    topRight: canvasPoints[1],
    bottomRight: canvasPoints[2],
    bottomLeft: canvasPoints[3]
  };
}

/**
 * 验证坐标转换的正确性（用于调试）
 */
export function validateCoordinateTransform(
  originalPoint: Point,
  imageDisplayInfo: ImageDisplayInfo,
  originalImageWidth: number,
  originalImageHeight: number
): boolean {
  // Canvas -> Image -> Canvas 转换应该得到相同的结果
  const imageCoord = canvasToImageCoordinates(
    originalPoint,
    imageDisplayInfo,
    originalImageWidth,
    originalImageHeight
  );
  
  const backToCanvas = imageToCanvasCoordinates(
    imageCoord,
    imageDisplayInfo,
    originalImageWidth,
    originalImageHeight
  );
  
  const tolerance = 1; // 1像素的容差
  return (
    Math.abs(backToCanvas.x - originalPoint.x) < tolerance &&
    Math.abs(backToCanvas.y - originalPoint.y) < tolerance
  );
}
