# Image Processing Application - Frontend

A modern React TypeScript application for image processing with trapezoidal cropping and perspective correction features.

## Features

- **Interactive Image Cropping**: Click and drag corner handles to define trapezoidal crop areas
- **Perspective Correction**: Transform quadrilateral selections into rectangular outputs
- **Modern UI**: Clean, responsive interface built with React and TypeScript
- **Real-time Preview**: See changes instantly as you adjust crop corners
- **Zoom and Pan**: Navigate large images with mouse wheel zoom and drag to pan
- **Multiple Image Support**: Upload and process multiple images in sequence
- **State Management**: Powered by Zustand for efficient state management

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **State Management**: Zustand for lightweight, scalable state management
- **Icons**: Lucide React for modern iconography
- **Styling**: Modern CSS with CSS Grid and Flexbox

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. Clone the repository and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build production-ready application
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code quality checks

## Usage

1. **Upload Images**: Drag and drop image files or click the upload area to select images
2. **Select Image**: Click on an image thumbnail in the sidebar to open it in the editor
3. **Adjust Crop Area**: Click and drag the corner handles to define your trapezoidal crop area
4. **Zoom and Pan**: Use mouse wheel to zoom, drag to pan around the image
5. **Process**: Click the download button to process the image (requires backend integration)

## Project Structure

```
src/
├── components/          # React components
│   ├── Canvas.tsx      # Main canvas component for image editing
│   ├── ImageUpload.tsx # Image upload and list components
│   └── Toolbar.tsx     # Toolbar with controls and actions
├── hooks/              # Custom React hooks
│   └── useCanvasInteraction.ts  # Canvas interaction logic
├── store/              # Zustand state management
│   └── useAppStore.ts  # Main application store
├── types/              # TypeScript type definitions
│   └── index.ts        # Core type definitions
├── utils/              # Utility functions
│   ├── geometry.ts     # Geometric calculations and transformations
│   └── imageProcessing.ts  # Image processing utilities
└── App.tsx            # Main application component
```

## Architecture

### State Management
The application uses Zustand for state management, providing:
- Current image and image list management
- View state (zoom, offset, selected corners)
- Application settings and UI state
- Error handling and loading states

### Canvas Interaction
Custom hooks handle all canvas interactions:
- Mouse events for dragging corners and panning
- Zoom functionality with mouse wheel
- Coordinate transformations between screen and canvas space
- Real-time crop area updates

### Component Architecture
- **Modular Design**: Each component has a single responsibility
- **TypeScript First**: Comprehensive type safety throughout
- **Responsive**: Mobile-friendly responsive design
- **Accessible**: Proper ARIA labels and keyboard navigation

## Integration with Backend

This frontend is designed to work with a FastAPI backend that provides:
- Image upload endpoints
- Perspective correction processing
- Processed image delivery

The frontend sends crop area coordinates to the backend and receives processed images in return.

## Development

### Code Style
- Use TypeScript strict mode for type safety
- Follow React best practices and hooks patterns
- Implement responsive design principles
- Ensure accessibility compliance
- Write clean, maintainable code with proper documentation

### Adding Features
1. Define new types in `src/types/index.ts`
2. Add state management in `src/store/useAppStore.ts`
3. Create reusable components in `src/components/`
4. Implement utility functions in `src/utils/`
5. Add custom hooks for complex logic in `src/hooks/`

## Browser Support

- Modern browsers with ES2020+ support
- Chrome 91+
- Firefox 90+
- Safari 15+
- Edge 91+

## Contributing

1. Follow the existing code style and patterns
2. Write TypeScript with proper type definitions
3. Test thoroughly across supported browsers
4. Ensure responsive design works on all screen sizes
5. Add appropriate error handling and user feedback

## License

This project is part of a larger image processing application system.
