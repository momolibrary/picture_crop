import { useState } from 'react';
import { Settings, X, Grid3X3, Zap, Download } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, updateSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings = {
      autoNext: false,
      zoomStep: 0.25,
      showGrid: false,
      snapToGrid: false,
    };
    setLocalSettings(defaultSettings);
    updateSettings(defaultSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Settings size={20} />
            Settings
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body settings-body">
          <div className="settings-section">
            <h3>
              <Zap size={16} />
              Workflow
            </h3>
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={localSettings.autoNext}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    autoNext: e.target.checked
                  })}
                />
                <span className="checkmark"></span>
                Auto advance to next image after processing
              </label>
              <p className="setting-description">
                Automatically select the next image in the list after successfully processing the current one.
              </p>
            </div>
          </div>

          <div className="settings-section">
            <h3>
              <Grid3X3 size={16} />
              Display
            </h3>
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={localSettings.showGrid}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    showGrid: e.target.checked
                  })}
                />
                <span className="checkmark"></span>
                Show grid overlay
              </label>
              <p className="setting-description">
                Display a grid overlay on the canvas to help with alignment.
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={localSettings.snapToGrid}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    snapToGrid: e.target.checked
                  })}
                />
                <span className="checkmark"></span>
                Snap to grid
              </label>
              <p className="setting-description">
                Automatically snap corner points to grid intersections when enabled.
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                Zoom step size
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={localSettings.zoomStep}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    zoomStep: Number(e.target.value)
                  })}
                  className="slider"
                />
                <span className="slider-value">{(localSettings.zoomStep * 100).toFixed(0)}%</span>
              </div>
              <p className="setting-description">
                Controls how much the view zooms in or out with each zoom action.
              </p>
            </div>
          </div>

          <div className="settings-section">
            <h3>
              <Download size={16} />
              Export
            </h3>
            <div className="setting-item">
              <label className="setting-label">
                Default output format
              </label>
              <select
                className="setting-select"
                value="jpeg"
                onChange={() => {}} // Placeholder for future implementation
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
              <p className="setting-description">
                Choose the default format for exported images.
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                Image quality
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value="0.9"
                  onChange={() => {}} // Placeholder for future implementation
                  className="slider"
                />
                <span className="slider-value">90%</span>
              </div>
              <p className="setting-description">
                Higher quality produces larger files but better image quality.
              </p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleReset}>
            Reset to Defaults
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
