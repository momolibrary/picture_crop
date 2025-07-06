/**
 * 坐标转换工具函数
 * 用于Canvas坐标和图片原始坐标之间的转换
 */

export interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropArea {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
}

/**
 * 将Canvas坐标转换为图片原始坐标
 * @param canvasCoords Canvas中的坐标点 
 * @param canvasWidth Canvas的显示宽度
 * @param canvasHeight Canvas的显示高度
 * @param imageWidth 原始图片宽度
 * @param imageHeight 原始图片高度
 */
export function convertCanvasToImageCoordinates(
  canvasCoords: CropArea,
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number
): number[][] {
  // 计算缩放比例
  const scaleX = imageWidth / canvasWidth;
  const scaleY = imageHeight / canvasHeight;
  
  // 转换四个角点
  const points = [
    canvasCoords.topLeft,
    canvasCoords.topRight,
    canvasCoords.bottomRight,
    canvasCoords.bottomLeft
  ];
  
  return points.map(point => [
    Math.round(point.x * scaleX),
    Math.round(point.y * scaleY)
  ]);
}

/**
 * 将选择区域从Canvas坐标转换为图片坐标
 */
export function convertSelectionToImageCoordinates(
  selection: SelectionArea,
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  const scaleX = imageWidth / canvasWidth;
  const scaleY = imageHeight / canvasHeight;
  
  return {
    x: Math.round(selection.x * scaleX),
    y: Math.round(selection.y * scaleY),
    width: Math.round(selection.width * scaleX),
    height: Math.round(selection.height * scaleY)
  };
}

/**
 * 验证坐标是否在有效范围内
 */
export function validateCoordinates(
  points: number[][],
  imageWidth: number,
  imageHeight: number
): boolean {
  return points.every(([x, y]) => 
    x >= 0 && x <= imageWidth && y >= 0 && y <= imageHeight
  );
}

/**
 * 计算图片在Canvas中的实际显示区域
 */
export function calculateImageDisplayBounds(
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number; scale: number } {
  // 计算适应Canvas的缩放比例
  const scaleX = canvasWidth / imageWidth;
  const scaleY = canvasHeight / imageHeight;
  const scale = Math.min(scaleX, scaleY);
  
  // 计算显示尺寸
  const displayWidth = imageWidth * scale;
  const displayHeight = imageHeight * scale;
  
  // 计算居中位置
  const x = (canvasWidth - displayWidth) / 2;
  const y = (canvasHeight - displayHeight) / 2;
  
  return { x, y, width: displayWidth, height: displayHeight, scale };
}
