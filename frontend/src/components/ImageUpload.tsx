import { useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { createImageFromFile, isValidImageFile } from '../utils/imageProcessing';

interface ImageUploadProps {
  className?: string;
}

export function ImageUpload({ className }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addImage, setError } = useAppStore();

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!isValidImageFile(file)) {
        setError(`Invalid file type: ${file.name}. Please select an image file.`);
        return;
      }

      const processedImage = createImageFromFile(file);
      addImage(processedImage);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`image-upload ${className || ''}`}>
      <div
        className="upload-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        
        <div className="upload-content">
          <div className="upload-icon">
            <Upload size={48} />
          </div>
          <h3>Upload Images</h3>
          <p>Drag and drop images here, or click to select files</p>
          <p className="upload-hint">
            Supports JPG, PNG, GIF, and other image formats
          </p>
        </div>
      </div>
    </div>
  );
}

interface ImageListProps {
  className?: string;
}

export function ImageList({ className }: ImageListProps) {
  const { images, currentImage, setCurrentImage, removeImage } = useAppStore();

  if (images.length === 0) {
    return (
      <div className={`image-list-empty ${className || ''}`}>
        <ImageIcon size={32} />
        <p>No images uploaded</p>
      </div>
    );
  }

  return (
    <div className={`image-list ${className || ''}`}>
      <h3>Images ({images.length})</h3>
      <div className="image-grid">
        {images.map((image) => (
          <div
            key={image.id}
            className={`image-item ${currentImage?.id === image.id ? 'active' : ''}`}
            onClick={() => setCurrentImage(image)}
          >
            <img
              src={image.originalUrl}
              alt={image.originalName}
              className="image-thumbnail"
            />
            <div className="image-info">
              <div className="image-name" title={image.originalName}>
                {image.originalName}
              </div>
              <div className="image-status">
                <span className={`status-badge ${image.status}`}>
                  {image.status}
                </span>
              </div>
            </div>
            <button
              className="remove-button"
              onClick={(e) => {
                e.stopPropagation();
                removeImage(image.id);
              }}
              title="Remove image"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
