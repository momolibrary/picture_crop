import { create } from 'zustand';
import type { Point, ProcessedImage, AppSettings, ViewState } from '../types';
import { apiService, type FileListResponse, type PaginatedFileListResponse } from '../services/api';

interface AppState {
  // Current image state
  currentImage: ProcessedImage | null;
  images: ProcessedImage[]; // Pending images from source_images
  processedImages: ProcessedImage[]; // Completed images from processed folder
  
  // Server state
  serverImages: FileListResponse | null;
  paginatedData: PaginatedFileListResponse | null;
  currentPage: number;
  pageSize: number;
  lastRefresh: number | null;
  
  // View and interaction state
  viewState: ViewState;
  settings: AppSettings;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentImage: (image: ProcessedImage | null) => void;
  addImage: (image: ProcessedImage) => void;
  removeImage: (id: string) => void;
  updateImage: (id: string, updates: Partial<ProcessedImage>) => void;
  
  // Server actions
  refreshFromServer: () => Promise<void>;
  loadPage: (page: number) => Promise<void>;
  loadImageFromServer: (filename: string) => Promise<void>;
  
  // View actions
  setZoom: (zoom: number) => void;
  setOffset: (offset: Point) => void;
  setSelectedCorner: (corner: number | null) => void;
  setIsEditing: (editing: boolean) => void;
  setIsDragging: (dragging: boolean) => void;
  
  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Reset functions
  resetView: () => void;
  clearAll: () => void;
  
  // Navigation functions
  getNextImage: (currentImageId?: string) => ProcessedImage | null;
  moveToNextImage: (currentImageId?: string) => void;
}

const defaultViewState: ViewState = {
  zoom: 1,
  offset: { x: 0, y: 0 },
  isDragging: false,
  selectedCorner: null,
  isEditing: false,
};

const defaultSettings: AppSettings = {
  autoNext: true,
  zoomStep: 0.1,
  showGrid: false,
  snapToGrid: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  currentImage: null,
  images: [],
  processedImages: [],
  serverImages: null,
  paginatedData: null,
  currentPage: 1,
  pageSize: 20,
  lastRefresh: null,
  viewState: defaultViewState,
  settings: defaultSettings,
  isLoading: false,
  error: null,

  setCurrentImage: (image) => {
    console.log('Setting current image:', image);
    set({ currentImage: image });
  },
  
  addImage: (image) => set((state) => ({ 
    images: [...state.images, image],
    currentImage: image 
  })),
  
  removeImage: (id) => set((state) => ({
    images: state.images.filter(img => img.id !== id),
    currentImage: state.currentImage?.id === id ? null : state.currentImage
  })),
  
  updateImage: (id, updates) => set((state) => {
    // Find the image in pending list
    const pendingIndex = state.images.findIndex(img => img.id === id);
    
    if (pendingIndex !== -1) {
      const updatedImage = { ...state.images[pendingIndex], ...updates };
      
      // If the image status is changed to completed, move it to processedImages
      if (updates.status === 'completed') {
        return {
          images: state.images.filter(img => img.id !== id),
          processedImages: [...state.processedImages, updatedImage],
          currentImage: state.currentImage?.id === id ? null : state.currentImage
        };
      } else {
        // Otherwise, just update the image in place
        return {
          images: state.images.map(img => 
            img.id === id ? updatedImage : img
          ),
          currentImage: state.currentImage?.id === id 
            ? updatedImage 
            : state.currentImage
        };
      }
    }
    
    // If not found in pending, check processed images
    const processedIndex = state.processedImages.findIndex(img => img.id === id);
    if (processedIndex !== -1) {
      return {
        processedImages: state.processedImages.map(img => 
          img.id === id ? { ...img, ...updates } : img
        ),
        currentImage: state.currentImage?.id === id 
          ? { ...state.currentImage, ...updates } 
          : state.currentImage
      };
    }
    
    // Image not found, return unchanged state
    return state;
  }),

  refreshFromServer: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // 使用分页API加载第一页
      const paginatedData = await apiService.getFilesPaginated(1, get().pageSize);
      
      // Convert pending files to ProcessedImage format with thumbnail URLs
      const pendingImages: ProcessedImage[] = paginatedData.pending_files.map(fileInfo => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const originalUrl = `${baseUrl}/api/image/${encodeURIComponent(fileInfo.filename)}`;
        const thumbnailUrl = fileInfo.has_thumbnail ? 
          `${baseUrl}${fileInfo.thumbnail_url}` : 
          undefined;
        
        console.log('Creating image entry:', {
          filename: fileInfo.filename,
          baseUrl,
          originalUrl,
          thumbnailUrl,
          env: import.meta.env.VITE_API_BASE_URL
        });
        
        return {
          id: fileInfo.filename,
          originalName: fileInfo.filename,
          originalUrl,
          thumbnailUrl,
          timestamp: Date.now(),
          status: 'pending' as const
        };
      });

      // Convert processed files to ProcessedImage format
      const completedImages: ProcessedImage[] = paginatedData.processed_files.map(filename => ({
        id: `processed_${filename}`,
        originalName: filename,
        originalUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/image/${encodeURIComponent(filename)}`,
        thumbnailUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/thumbnail/${encodeURIComponent(filename)}`,
        timestamp: Date.now(),
        status: 'completed' as const
      }));

      set({ 
        paginatedData, 
        images: pendingImages, 
        processedImages: completedImages,
        currentPage: 1,
        lastRefresh: Date.now(),
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to refresh from server:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load images from server',
        isLoading: false 
      });
    }
  },

  loadPage: async (page: number) => {
    try {
      set({ isLoading: true, error: null });
      
      const paginatedData = await apiService.getFilesPaginated(page, get().pageSize);
      
      // Convert pending files to ProcessedImage format with thumbnail URLs
      const pendingImages: ProcessedImage[] = paginatedData.pending_files.map(fileInfo => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const originalUrl = `${baseUrl}/api/image/${encodeURIComponent(fileInfo.filename)}`;
        const thumbnailUrl = fileInfo.has_thumbnail ? 
          `${baseUrl}${fileInfo.thumbnail_url}` : 
          undefined;
        
        console.log('Creating image entry for page:', {
          filename: fileInfo.filename,
          baseUrl,
          originalUrl,
          thumbnailUrl,
          env: import.meta.env.VITE_API_BASE_URL
        });
        
        return {
          id: fileInfo.filename,
          originalName: fileInfo.filename,
          originalUrl,
          thumbnailUrl,
          timestamp: Date.now(),
          status: 'pending' as const
        };
      });

      set({ 
        paginatedData, 
        images: pendingImages,
        currentPage: page,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to load page from server:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load page',
        isLoading: false 
      });
    }
  },

  loadImageFromServer: async (filename: string) => {
    try {
      const imageUrl = await apiService.getImage(filename);
      const existingImage = get().images.find(img => img.originalName === filename);
      
      if (existingImage) {
        // Update existing image
        get().updateImage(existingImage.id, { originalUrl: imageUrl });
      } else {
        // Add new image
        const newImage: ProcessedImage = {
          id: filename,
          originalName: filename,
          originalUrl: imageUrl,
          timestamp: Date.now(),
          status: 'pending'
        };
        get().addImage(newImage);
      }
    } catch (error) {
      console.error('Failed to load image from server:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to load image' });
    }
  },

  setZoom: (zoom) => set((state) => ({
    viewState: { ...state.viewState, zoom }
  })),
  
  setOffset: (offset) => set((state) => ({
    viewState: { ...state.viewState, offset }
  })),
  
  setSelectedCorner: (selectedCorner) => set((state) => ({
    viewState: { ...state.viewState, selectedCorner }
  })),
  
  setIsEditing: (isEditing) => set((state) => ({
    viewState: { ...state.viewState, isEditing }
  })),
  
  setIsDragging: (isDragging) => set((state) => ({
    viewState: { ...state.viewState, isDragging }
  })),

  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  resetView: () => set({ viewState: defaultViewState }),
  
  clearAll: () => set({
    currentImage: null,
    images: [],
    processedImages: [],
    viewState: defaultViewState,
    error: null,
  }),

  // Helper function to get next image
  getNextImage: (currentImageId?: string) => {
    const state = get();
    const imageId = currentImageId || state.currentImage?.id;
    if (!imageId) return null;
    
    // Find current image index in the pending images list
    const currentIndex = state.images.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return null;
    
    // Get next pending image
    for (let i = currentIndex + 1; i < state.images.length; i++) {
      if (state.images[i].status === 'pending') {
        return state.images[i];
      }
    }
    
    // If no next image found, return the first pending image
    return state.images.find(img => img.status === 'pending') || null;
  },

  // Move to next image automatically
  moveToNextImage: (currentImageId?: string) => {
    const state = get();
    if (!state.settings.autoNext) return;
    
    const nextImage = get().getNextImage(currentImageId);
    if (nextImage) {
      set({ currentImage: nextImage });
      // Reset view when switching images
      get().resetView();
    }
  },
}));
