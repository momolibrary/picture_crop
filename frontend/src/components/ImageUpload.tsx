import { useRef, useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { isValidImageFile } from '../utils/imageProcessing';
import { ProgressBar } from './ProgressBar';

interface ImageUploadProps {
  className?: string;
}

export function ImageUpload({ className }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const { setError, refreshFromServer } = useAppStore();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    setUploadStatus('uploading');
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate files first
    Array.from(files).forEach(file => {
      if (!isValidImageFile(file)) {
        errors.push(`无效的文件类型: ${file.name}`);
      } else if (file.size > 10 * 1024 * 1024) { // 10MB limit
        errors.push(`文件过大: ${file.name} (最大 10MB)`);
      } else {
        validFiles.push(file);
      }
    });

    // Show errors if any
    if (errors.length > 0) {
      setError(errors.join(', '));
      setUploadStatus('error');
      return;
    }

    try {
      // Upload files to server
      const fileList = new DataTransfer();
      validFiles.forEach(file => fileList.items.add(file));
      
      // Use the API service to upload files
      const { apiService } = await import('../services/api');
      const uploadResult = await apiService.uploadFiles(fileList.files);
      
      if (uploadResult.success) {
        // Refresh the image list from server
        await refreshFromServer();
        
        setUploadStatus('success');
        
        // Reset status after 2 seconds
        setTimeout(() => setUploadStatus('idle'), 2000);
      } else {
        setError(uploadResult.errors.join(', '));
        setUploadStatus('error');
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Failed to upload files to server');
      setUploadStatus('error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    if (uploadStatus === 'uploading') return;
    fileInputRef.current?.click();
  };

  const getUploadIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Upload className="animate-pulse" size={48} />;
      case 'success':
        return <Check size={48} />;
      case 'error':
        return <AlertCircle size={48} />;
      default:
        return <Upload size={48} />;
    }
  };

  const getUploadText = () => {
    switch (uploadStatus) {
      case 'uploading':
        return '上传中...';
      case 'success':
        return '上传成功！';
      case 'error':
        return '上传失败';
      default:
        return '上传图像';
    }
  };

  return (
    <div className={`image-upload ${className || ''}`}>
      <div
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${uploadStatus}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploadStatus === 'uploading'}
        />
        
        <div className="upload-content">
          <div className={`upload-icon ${uploadStatus}`}>
            {getUploadIcon()}
          </div>
          <h3>{getUploadText()}</h3>
          {uploadStatus === 'idle' && (
            <>
              <p>拖拽图像到此处，或点击选择文件</p>
              <p className="upload-hint">
                支持 JPG、PNG、GIF 和其他图像格式（每个文件最大 10MB）
              </p>
            </>
          )}
          {uploadStatus === 'success' && (
            <p className="success-message">文件上传成功！</p>
          )}
          {uploadStatus === 'error' && (
            <p className="error-message">请重试或检查文件格式</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ImageListProps {
  className?: string;
}

export function ImageList({ className }: ImageListProps) {
  const { 
    images, 
    processedImages,
    currentImage, 
    setCurrentImage, 
    removeImage, 
    refreshFromServer,
    loadPage,
    isLoading, 
    paginatedData,
    currentPage,
    processingImages,
    errorImages
  } = useAppStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load images from server on component mount
  useEffect(() => {
    refreshFromServer();
  }, [refreshFromServer]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFromServer();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePageChange = async (page: number) => {
    await loadPage(page);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check size={16} className="text-green-500" />;
      case 'processing':
        return <Upload size={16} className="text-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Upload size={16} className="text-gray-500" />;
    }
  };

  // Display pending images by default
  const displayImages = images;
  const totalImages = images.length + processedImages.length;

  if (isLoading && totalImages === 0) {
    return (
      <div className={`image-list-empty ${className || ''}`}>
        <Upload size={32} className="animate-pulse" />
        <p>Loading images...</p>
        <p className="text-sm text-gray-500">Fetching images from server</p>
      </div>
    );
  }

  if (totalImages === 0) {
    return (
      <div className={`image-list-empty ${className || ''}`}>
        <ImageIcon size={32} />
        <p>No images uploaded</p>
        <p className="text-sm text-gray-500">Upload images to get started</p>
        <button 
          onClick={handleRefresh}
          className="refresh-button"
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className={`image-list ${className || ''}`}>
      <div className="list-header">
        <div className="list-title">
          <h3>图像 ({paginatedData?.total_files || totalImages})</h3>
          
          {/* 添加进度条 */}
          {(paginatedData || totalImages > 0) && (
            <ProgressBar
              value={paginatedData?.completion_rate || (processedImages.length / totalImages * 100)}
              totalFiles={paginatedData?.total_files || totalImages}
              completedFiles={processedImages.length}
              processingFiles={processingImages.size}
              errorFiles={errorImages.size}
              showDetails={true}
              theme={
                (paginatedData?.completion_rate || (processedImages.length / totalImages * 100)) === 100 
                  ? 'success' 
                  : errorImages.size > 0
                  ? 'error'
                  : processingImages.size > 0
                  ? 'warning'
                  : 'default'
              }
            />
          )}

        </div>       
        
      </div>
      
      {/* Pagination controls */}
      {paginatedData && paginatedData.total_pages > 1 && (
        <div className="pagination-controls">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!paginatedData.has_prev || isLoading}
            className="pagination-btn"
          >
            上一页
          </button>
          <span className="pagination-info">
            第 {currentPage} 页，共 {paginatedData.total_pages} 页
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!paginatedData.has_next || isLoading}
            className="pagination-btn"
          >
            下一页
          </button>
        </div>
      )}
      
      <div className="image-grid">
        {displayImages.map((image) => (
          <div
            key={image.id}
            className={`image-item ${currentImage?.id === image.id ? 'active' : ''} status-${image.status}`}
            onClick={() => {
              console.log('Image clicked:', image);
              console.log('Setting as current image');
              setCurrentImage(image);
            }}
          >
            <div className="image-thumbnail-container">
              <img
                src={image.thumbnailUrl || image.originalUrl}
                alt={image.originalName}
                className="image-thumbnail"
                loading="lazy"
                onError={(e) => {
                  // Fallback to original image if thumbnail fails
                  const target = e.target as HTMLImageElement;
                  if (target.src !== image.originalUrl) {
                    target.src = image.originalUrl;
                  }
                }}
              />
              {image.status === 'processing' && (
                <div className="processing-overlay">
                  <Upload className="animate-pulse" size={20} />
                </div>
              )}
            </div>
            
            <div className="image-info">
              <div className="image-name" title={image.originalName}>
                {image.originalName.length > 20 
                  ? `${image.originalName.substring(0, 17)}...` 
                  : image.originalName
                }
              </div>
              <div className="image-status">
                {getStatusIcon(image.status)}
                <span className={`status-text status-${image.status}`}>
                  {image.status}
                </span>
              </div>
            </div>
            
            <button
              className="remove-button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`删除 "${image.originalName}"？`)) {
                  removeImage(image.id);
                }
              }}
              title="删除图像"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
