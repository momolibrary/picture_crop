import { create } from 'zustand';
import type { Point, ProcessedImage, AppSettings, ViewState } from '../types';

interface AppState {
  // Current image state
  currentImage: ProcessedImage | null;
  images: ProcessedImage[];
  
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

export const useAppStore = create<AppState>((set) => ({
  currentImage: null,
  images: [],
  viewState: defaultViewState,
  settings: defaultSettings,
  isLoading: false,
  error: null,

  setCurrentImage: (image) => set({ currentImage: image }),
  
  addImage: (image) => set((state) => ({ 
    images: [...state.images, image],
    currentImage: image 
  })),
  
  removeImage: (id) => set((state) => ({
    images: state.images.filter(img => img.id !== id),
    currentImage: state.currentImage?.id === id ? null : state.currentImage
  })),
  
  updateImage: (id, updates) => set((state) => ({
    images: state.images.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ),
    currentImage: state.currentImage?.id === id 
      ? { ...state.currentImage, ...updates } 
      : state.currentImage
  })),

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
    viewState: defaultViewState,
    error: null,
  }),
}));
