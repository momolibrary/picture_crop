import { useEffect, useState } from 'react';
import { X, Download, RotateCw, Check, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../services/api';
import type { ProcessedImage } from '../types';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: ProcessedImage | null;
  canvasWidth?: number;
  canvasHeight?: number;
  viewState?: {
    zoom: number;
    offset: { x: number; y: number };
  };
}

export function PreviewModal({ 
  isOpen, 
  onClose, 
  image, 
  canvasWidth = 800, 
  canvasHeight = 600,
  viewState = { zoom: 1, offset: { x: 0, y: 0 } }
}: PreviewModalProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);
  const { setError, updateImage } = useAppStore();

  // 生成预览图片
  useEffect(() => {
    if (!isOpen || !image || !image.cropArea) {
      setPreviewImageUrl(null);
      setShowConfirmation(false);
      setImageInfo(null);
      return;
    }

    const generatePreview = async () => {
      setIsGeneratingPreview(true);
      
      try {
        // 获取图片信息
        const imgInfo = await apiService.getImageInfo(image.id);
        setImageInfo(imgInfo);
        
        console.log('图片信息:', imgInfo);
        console.log('Canvas尺寸:', { width: canvasWidth, height: canvasHeight });
        console.log('原始裁剪区域 (Canvas坐标):', image.cropArea);
        
        // 将Canvas坐标转换为图片原始坐标
        if (image.cropArea) {
          // 计算图片在无变换状态下的基础显示信息
          const baseScale = Math.min(
            canvasWidth / imgInfo.width,
            canvasHeight / imgInfo.height
          );
          
          const baseDisplayWidth = imgInfo.width * baseScale;
          const baseDisplayHeight = imgInfo.height * baseScale;
          const baseDisplayX = (canvasWidth - baseDisplayWidth) / 2;
          const baseDisplayY = (canvasHeight - baseDisplayHeight) / 2;
          
          // 应用当前的zoom和offset变换
          const actualScale = baseScale * viewState.zoom;
          const actualDisplayWidth = imgInfo.width * actualScale;
          const actualDisplayHeight = imgInfo.height * actualScale;
          const actualDisplayX = baseDisplayX * viewState.zoom + viewState.offset.x;
          const actualDisplayY = baseDisplayY * viewState.zoom + viewState.offset.y;
          
          console.log('图片显示信息:', {
            baseScale,
            baseDisplayWidth,
            baseDisplayHeight,
            baseDisplayX,
            baseDisplayY,
            zoom: viewState.zoom,
            offset: viewState.offset,
            actualScale,
            actualDisplayWidth,
            actualDisplayHeight,
            actualDisplayX,
            actualDisplayY
          });
          
          // 转换裁剪区域的四个角点
          const points = [
            image.cropArea.topLeft,
            image.cropArea.topRight,
            image.cropArea.bottomRight,
            image.cropArea.bottomLeft
          ];
          
          const imageCoordinates = points.map(point => {
            // cropArea中的坐标是逆变换后的坐标，需要先应用变换得到实际Canvas坐标
            const actualCanvasX = point.x * viewState.zoom + viewState.offset.x;
            const actualCanvasY = point.y * viewState.zoom + viewState.offset.y;
            
            // 转换为相对于图片显示区域的坐标
            const relativeX = actualCanvasX - actualDisplayX;
            const relativeY = actualCanvasY - actualDisplayY;
            
            // 转换为原始图片坐标
            const imageX = (relativeX / actualDisplayWidth) * imgInfo.width;
            const imageY = (relativeY / actualDisplayHeight) * imgInfo.height;
            
            // 确保坐标在有效范围内
            return [
              Math.max(0, Math.min(imgInfo.width, Math.round(imageX))),
              Math.max(0, Math.min(imgInfo.height, Math.round(imageY)))
            ];
          });
          
          console.log('转换后的图片坐标:', imageCoordinates);
          
          // 调用预览API（只生成预览，不执行实际裁剪）
          const previewUrl = await apiService.generatePreview(image.id, imageCoordinates);
          
          setPreviewImageUrl(previewUrl);
          setShowConfirmation(true);
        }
        
      } catch (error) {
        console.error('Preview generation failed:', error);
        setError('预览生成失败');
      } finally {
        setIsGeneratingPreview(false);
      }
    };

    generatePreview();
  }, [isOpen, image, canvasWidth, canvasHeight, viewState.zoom, viewState.offset, setError]);

  // 确认裁剪并执行实际的文件处理
  const handleConfirmCrop = async () => {
    if (!image || !image.cropArea || !imageInfo) return;
    
    setIsConfirming(true);
    
    try {
      console.log('确认裁剪，执行实际处理');
      
      if (image.cropArea && imageInfo) {
        // 使用相同的坐标转换逻辑
        const baseScale = Math.min(
          canvasWidth / imageInfo.width,
          canvasHeight / imageInfo.height
        );
        
        const baseDisplayWidth = imageInfo.width * baseScale;
        const baseDisplayHeight = imageInfo.height * baseScale;
        const baseDisplayX = (canvasWidth - baseDisplayWidth) / 2;
        const baseDisplayY = (canvasHeight - baseDisplayHeight) / 2;
        
        // 应用当前的zoom和offset变换
        const actualScale = baseScale * viewState.zoom;
        const actualDisplayWidth = imageInfo.width * actualScale;
        const actualDisplayHeight = imageInfo.height * actualScale;
        const actualDisplayX = baseDisplayX * viewState.zoom + viewState.offset.x;
        const actualDisplayY = baseDisplayY * viewState.zoom + viewState.offset.y;
        
        // 转换裁剪区域的四个角点
        const points = [
          image.cropArea.topLeft,
          image.cropArea.topRight,
          image.cropArea.bottomRight,
          image.cropArea.bottomLeft
        ];
        
        const imageCoordinates = points.map(point => {
          // cropArea中的坐标是逆变换后的坐标，需要先应用变换得到实际Canvas坐标
          const actualCanvasX = point.x * viewState.zoom + viewState.offset.x;
          const actualCanvasY = point.y * viewState.zoom + viewState.offset.y;
          
          // 转换为相对于图片显示区域的坐标
          const relativeX = actualCanvasX - actualDisplayX;
          const relativeY = actualCanvasY - actualDisplayY;
          
          // 转换为原始图片坐标
          const imageX = (relativeX / actualDisplayWidth) * imageInfo.width;
          const imageY = (relativeY / actualDisplayHeight) * imageInfo.height;
          
          // 确保坐标在有效范围内
          return [
            Math.max(0, Math.min(imageInfo.width, Math.round(imageX))),
            Math.max(0, Math.min(imageInfo.height, Math.round(imageY)))
          ];
        });
        
        console.log('确认裁剪使用的坐标:', imageCoordinates);
        
        // 执行实际裁剪和文件移动
        const result = await apiService.cropImage(image.id, imageCoordinates);
        
        if (result.success) {
          // 更新图片状态为已处理
          updateImage(image.id, { status: 'completed' });
          onClose();
          console.log('裁剪成功:', result);
        } else {
          setError(result.message || '裁剪失败');
        }
      }
      
    } catch (error) {
      console.error('Crop confirmation failed:', error);
      setError('裁剪确认失败');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDownload = async () => {
    if (!previewImageUrl || !image) return;

    try {
      const response = await fetch(previewImageUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${image.originalName?.split('.')[0] || 'cropped'}_preview.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      setError('下载失败');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{showConfirmation ? '确认裁剪结果' : '正在生成预览...'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {isGeneratingPreview ? (
            <div className="processing-state">
              <div className="processing-spinner">
                <RotateCw className="spin" size={48} />
              </div>
              <h3>正在生成预览图片...</h3>
              {imageInfo && (
                <div className="image-info">
                  <p>原图尺寸: {imageInfo.width} × {imageInfo.height}</p>
                  <p>Canvas尺寸: {canvasWidth} × {canvasHeight}</p>
                </div>
              )}
            </div>
          ) : showConfirmation && previewImageUrl ? (
            <div className="preview-content">
              <img
                src={previewImageUrl}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              
              <div className="confirmation-text">
                <p>这是裁剪后的预览图片。如果效果满意，请点击"确认裁剪"来完成处理。</p>
                <p className="warning">注意：确认后将执行实际裁剪并移动原文件到已处理目录。</p>
                {imageInfo && (
                  <div className="coordinate-info">
                    <p>原图: {imageInfo.width} × {imageInfo.height} 像素</p>
                    <p>Canvas: {canvasWidth} × {canvasHeight} 像素</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="error-state">
              <p>预览生成失败，请重试。</p>
            </div>
          )}
        </div>

        {showConfirmation && previewImageUrl && (
          <div className="modal-footer">
            <button
              className="button secondary"
              onClick={onClose}
              disabled={isConfirming}
            >
              <ArrowLeft size={16} />
              返回修改
            </button>
            
            <button
              className="button secondary"
              onClick={handleDownload}
              disabled={isConfirming}
            >
              <Download size={16} />
              下载预览
            </button>
            
            <button
              className="button primary"
              onClick={handleConfirmCrop}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <RotateCw className="spin" size={16} />
                  处理中...
                </>
              ) : (
                <>
                  <Check size={16} />
                  确认裁剪
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
