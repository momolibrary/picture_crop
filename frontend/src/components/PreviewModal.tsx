import { useEffect, useState } from 'react';
import { X, Download, RotateCw, Share2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../services/api';
import type { ProcessedImage } from '../types';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: ProcessedImage | null;
}

export function PreviewModal({ isOpen, onClose, image }: PreviewModalProps) {
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { setError } = useAppStore();

  useEffect(() => {
    if (!isOpen || !image || !image.cropArea) {
      setProcessedImageUrl(null);
      return;
    }

    const processImage = async () => {
      setIsProcessing(true);
      setProcessingProgress(0);
      
      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setProcessingProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const result = await apiService.processImage({
          imageId: image.id,
          cropArea: image.cropArea,
          outputFormat: 'jpeg',
          quality: 0.9
        });

        clearInterval(progressInterval);
        setProcessingProgress(100);
        
        if (result.success && result.processedImageUrl) {
          setProcessedImageUrl(result.processedImageUrl);
        } else {
          throw new Error(result.message || 'Processing failed');
        }
      } catch (error) {
        console.error('Image processing failed:', error);
        setError(error instanceof Error ? error.message : 'Image processing failed');
      } finally {
        setIsProcessing(false);
      }
    };

    processImage();
  }, [isOpen, image, setError]);

  const handleDownload = async () => {
    if (!processedImageUrl || !image) return;

    try {
      const response = await fetch(processedImageUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${image.originalName.split('.')[0]}_cropped.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download image');
    }
  };

  const handleShare = async () => {
    if (!processedImageUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Processed Image',
          text: 'Check out this processed image',
          url: processedImageUrl,
        });
      } else {
        // Fallback to copying URL to clipboard
        await navigator.clipboard.writeText(processedImageUrl);
        // You could show a toast notification here
        console.log('URL copied to clipboard');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Preview Processed Image</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {isProcessing ? (
            <div className="processing-state">
              <div className="processing-spinner">
                <RotateCw className="spin" size={48} />
              </div>
              <h3>Processing Image...</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p>{processingProgress}% complete</p>
            </div>
          ) : processedImageUrl ? (
            <div className="preview-content">
              <div className="image-comparison">
                <div className="comparison-item">
                  <h4>Original</h4>
                  <img 
                    src={image?.originalUrl} 
                    alt="Original" 
                    className="comparison-image"
                  />
                </div>
                <div className="comparison-item">
                  <h4>Processed</h4>
                  <img 
                    src={processedImageUrl} 
                    alt="Processed" 
                    className="comparison-image"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="error-state">
              <p>Failed to process image. Please try again.</p>
            </div>
          )}
        </div>

        {processedImageUrl && !isProcessing && (
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
            <button className="btn-secondary" onClick={handleShare}>
              <Share2 size={16} />
              Share
            </button>
            <button className="btn-primary" onClick={handleDownload}>
              <Download size={16} />
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
