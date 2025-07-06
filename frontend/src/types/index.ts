export interface Point {
  x: number;
  y: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CropArea {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export interface ProcessedImage {
  id: string;
  originalName: string;
  originalUrl: string;
  thumbnailUrl?: string;
  processedUrl?: string;
  cropArea?: CropArea;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface AppSettings {
  autoNext: boolean;
  zoomStep: number;
  showGrid: boolean;
  snapToGrid: boolean;
}

export interface ViewState {
  zoom: number;
  offset: Point;
  isDragging: boolean;
  selectedCorner: number | null;
  isEditing: boolean;
}
