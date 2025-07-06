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
      autoNext: true,
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
            设置
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body settings-body">
          <div className="settings-section">
            <h3>
              <Zap size={16} />
              工作流程
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
                处理后自动切换到下一张图像
              </label>
              <p className="setting-description">
                成功处理当前图像后自动选择列表中的下一张图像。
              </p>
            </div>
          </div>

          <div className="settings-section">
            <h3>
              <Grid3X3 size={16} />
              显示
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
                显示网格覆盖层
              </label>
              <p className="setting-description">
                在画布上显示网格覆盖层以帮助对齐。
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
                吸附到网格
              </label>
              <p className="setting-description">
                启用时自动将角点吸附到网格交叉点。
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                缩放步长
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
                控制每次缩放操作的缩放幅度。
              </p>
            </div>
          </div>

          <div className="settings-section">
            <h3>
              <Download size={16} />
              导出
            </h3>
            <div className="setting-item">
              <label className="setting-label">
                默认输出格式
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
                选择导出图像的默认格式。
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                图像质量
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
                更高的质量会产生更大的文件，但图像质量更好。
              </p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleReset}>
            重置为默认值
          </button>
          <button className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSave}>
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}
