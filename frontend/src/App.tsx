import { useAppStore } from './store/useAppStore';
import { Canvas } from './components/Canvas';
import { ImageUpload, ImageList } from './components/ImageUpload';
import { Toolbar } from './components/Toolbar';
import './App.css';

function App() {
  const { currentImage, error, setError } = useAppStore();

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
          </aside>

          {/* Main content */}
          <div className="main-content">
            <Toolbar className="toolbar-section" />
            <div className="canvas-section">
              {currentImage ? (
                <Canvas className="main-canvas" />
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
