import { useAppStore } from './store/useAppStore';
import { Canvas } from './components/Canvas';
import { ImageUpload, ImageList } from './components/ImageUpload';
import { Toolbar } from './components/Toolbar';
import { DevTools } from './components/DevTools';
import { useState, useCallback } from 'react';
import './App.css';

// 导入进度演示工具 (仅在开发环境)
if (import.meta.env.DEV) {
  import('./utils/progressDemo');
}

function App() {
  const { currentImage, error, setError } = useAppStore();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const handleCanvasResize = useCallback((width: number, height: number) => {
    setCanvasSize({ width, height });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Image Processing Tool</h1>
        <p>Trapezoidal cropping and perspective correction</p>
      </header>

      <main className="app-main">
        {/* Error display */}
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="app-layout">
          {/* Sidebar */}
          <aside className="sidebar">
            <ImageUpload className="upload-section" />
            <ImageList className="image-list-section" />
            <DevTools className="dev-tools-section" />
          </aside>

          {/* Main content */}
          <div className="main-content">
            <Toolbar 
              className="toolbar-section" 
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
            />
            <div className="canvas-section">
              {currentImage ? (
                <Canvas 
                  className="main-canvas" 
                  onCanvasResize={handleCanvasResize}
                />
              ) : (
                <div className="empty-state">
                  <h2>Welcome to Image Processing Tool</h2>
                  <p>Upload an image to get started with trapezoidal cropping</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
