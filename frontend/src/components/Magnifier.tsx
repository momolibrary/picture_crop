import { useRef, useEffect } from 'react';
import type { Point, CropArea } from '../types';
import { loadImage } from '../utils/imageProcessing';

interface MagnifierProps {
  isVisible: boolean;
  mousePosition: Point;
  canvasPosition: Point;
  imageUrl: string;
  selectedCorner: number | null;
  cropArea?: CropArea;
  zoom: number;
  offset: Point;
  className?: string;
}

const MAGNIFIER_SIZE = 200;
const MAGNIFIER_ZOOM = 4;

export function Magnifier({
  isVisible,
  mousePosition,
  canvasPosition,
  imageUrl,
  selectedCorner,
  cropArea,
  zoom,
  offset,
  className
}: MagnifierProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderMagnifier = async () => {
      try {
        // 清除画布
        ctx.clearRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);

        // 加载图片
        let img: HTMLImageElement;
        if (imageCache.current.has(imageUrl)) {
          img = imageCache.current.get(imageUrl)!;
        } else {
          img = await loadImage(imageUrl);
          imageCache.current.set(imageUrl, img);
        }

        // 获取画布实际尺寸用于坐标转换
        const canvasElement = document.querySelector('canvas'); // 主画布
        if (!canvasElement) return;

        // 计算图片在主画布中的基础位置和尺寸（变换前）
        const baseScale = Math.min(
          canvasElement.width / img.width,
          canvasElement.height / img.height
        );
        
        const baseImgWidth = img.width * baseScale;
        const baseImgHeight = img.height * baseScale;
        const baseImgX = (canvasElement.width - baseImgWidth) / 2;
        const baseImgY = (canvasElement.height - baseImgHeight) / 2;

        // 应用当前的变换
        const actualScale = baseScale * zoom;
        const actualImgX = baseImgX * zoom + offset.x;
        const actualImgY = baseImgY * zoom + offset.y;

        // canvasPosition 是经过 screenToCanvas 转换的坐标
        // 它已经考虑了 zoom 和 offset 的逆变换
        // 但我们需要基于实际变换后的图片位置来计算
        
        // 计算鼠标在变换后图片中的相对位置
        const relativeX = (canvasPosition.x * zoom + offset.x) - actualImgX;
        const relativeY = (canvasPosition.y * zoom + offset.y) - actualImgY;
        
        // 转换为原始图片坐标
        const imgOriginalX = relativeX / actualScale;
        const imgOriginalY = relativeY / actualScale;

        // 计算放大区域的范围（在原始图片坐标系中）
        const zoomRadius = MAGNIFIER_SIZE / (2 * MAGNIFIER_ZOOM * baseScale);
        const sourceX = Math.max(0, Math.min(img.width - zoomRadius * 2, imgOriginalX - zoomRadius));
        const sourceY = Math.max(0, Math.min(img.height - zoomRadius * 2, imgOriginalY - zoomRadius));
        const sourceWidth = Math.min(img.width - sourceX, zoomRadius * 2);
        const sourceHeight = Math.min(img.height - sourceY, zoomRadius * 2);

        // 在瞄准镜中绘制放大的图片区域
        if (sourceWidth > 0 && sourceHeight > 0) {
          ctx.imageSmoothingEnabled = false; // 保持像素清晰
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE
          );
        }

        // 绘制当前拖拽的角点
        if (selectedCorner !== null && cropArea) {
          const corners = [
            cropArea.topLeft,
            cropArea.topRight,
            cropArea.bottomRight,
            cropArea.bottomLeft
          ];
          
          const corner = corners[selectedCorner];
          
          // 角点坐标是画布坐标系中的点，需要考虑当前的变换
          const cornerCanvasX = corner.x;
          const cornerCanvasY = corner.y;
          
          // 将角点坐标转换为变换后的实际画布位置
          const actualCornerX = cornerCanvasX * zoom + offset.x;
          const actualCornerY = cornerCanvasY * zoom + offset.y;
          
          // 计算角点在变换后图片中的相对位置
          const cornerRelativeX = actualCornerX - actualImgX;
          const cornerRelativeY = actualCornerY - actualImgY;
          
          // 转换为原始图片坐标
          const cornerImgX = cornerRelativeX / actualScale;
          const cornerImgY = cornerRelativeY / actualScale;

          // 检查角点是否在放大区域内
          if (cornerImgX >= sourceX && cornerImgX <= sourceX + sourceWidth &&
              cornerImgY >= sourceY && cornerImgY <= sourceY + sourceHeight) {
            const pointMagnifierX = ((cornerImgX - sourceX) / sourceWidth) * MAGNIFIER_SIZE;
            const pointMagnifierY = ((cornerImgY - sourceY) / sourceHeight) * MAGNIFIER_SIZE;

            // 绘制角点
            ctx.fillStyle = '#ff0000';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pointMagnifierX, pointMagnifierY, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // 标注角点编号
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText((selectedCorner + 1).toString(), pointMagnifierX, pointMagnifierY + 4);
          }
        }

      } catch (error) {
        console.error('Failed to render magnifier:', error);
      }
    };

    renderMagnifier();
  }, [isVisible, canvasPosition, imageUrl, selectedCorner, cropArea, zoom, offset]);

  if (!isVisible) {
    return null;
  }

  // 计算瞄准镜位置（避免遮挡鼠标）
  let magnifierX = mousePosition.x + 30;
  let magnifierY = mousePosition.y - MAGNIFIER_SIZE - 30;

  // 边界检查
  if (magnifierX + MAGNIFIER_SIZE > window.innerWidth) {
    magnifierX = mousePosition.x - MAGNIFIER_SIZE - 30;
  }
  if (magnifierY < 0) {
    magnifierY = mousePosition.y + 30;
  }

  return (
    <div
      className={`magnifier ${className || ''}`}
      style={{
        position: 'fixed',
        left: magnifierX,
        top: magnifierY,
        width: MAGNIFIER_SIZE,
        height: MAGNIFIER_SIZE,
        border: '3px solid #00ff00',
        borderRadius: '50%',
        zIndex: 1000,
        pointerEvents: 'none',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        background: '#ffffff'
      }}
    >
      <canvas
        ref={canvasRef}
        width={MAGNIFIER_SIZE}
        height={MAGNIFIER_SIZE}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
      {/* 十字瞄准线 */}
      <div
        className="magnifier-crosshair"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 20,
          height: 20,
          margin: '-10px 0 0 -10px',
          border: '2px solid #ff0000',
          borderRadius: '50%',
          background: 'rgba(255,0,0,0.1)',
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 8,
            right: 8,
            height: 1,
            marginTop: -0.5,
            background: '#ff0000'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 8,
            bottom: 8,
            width: 1,
            marginLeft: -0.5,
            background: '#ff0000'
          }}
        />
      </div>
    </div>
  );
}
