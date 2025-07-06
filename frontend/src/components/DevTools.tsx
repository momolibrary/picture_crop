import { useState } from 'react';
import { Play, RotateCcw, Activity } from 'lucide-react';
import { progressDemo } from '../utils/progressDemo';
import { useAppStore } from '../store/useAppStore';

interface DevToolsProps {
  className?: string;
}

export function DevTools({ className = '' }: DevToolsProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const { images, getProcessingStats } = useAppStore();
  const stats = getProcessingStats();

  const handleSimulateAll = async () => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    try {
      await progressDemo.simulateProcessAll();
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    progressDemo.resetAllStatus();
  };

  const handleSimulateSingle = async () => {
    const pendingImages = images.filter(img => img.status === 'pending');
    if (pendingImages.length === 0) return;
    
    const randomImage = pendingImages[Math.floor(Math.random() * pendingImages.length)];
    await progressDemo.simulateFileProcessing(randomImage.originalName);
  };

  // 只在开发环境显示
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className={`dev-tools ${className}`}>
      <div className="dev-tools-header">
        <Activity size={16} />
        <h4>开发工具 - 进度演示</h4>
      </div>
      
      <div className="dev-tools-stats">
        <div className="stat">
          待处理: {images.filter(img => img.status === 'pending').length}
        </div>
        <div className="stat">
          处理中: {stats.processing}
        </div>
        <div className="stat">
          错误: {stats.errors}
        </div>
      </div>

      <div className="dev-tools-actions">
        <button
          onClick={handleSimulateAll}
          disabled={isSimulating || images.length === 0}
          className="dev-btn dev-btn-primary"
          title="模拟处理所有文件"
        >
          <Play size={14} />
          {isSimulating ? '处理中...' : '模拟全部处理'}
        </button>

        <button
          onClick={handleSimulateSingle}
          disabled={isSimulating || images.filter(img => img.status === 'pending').length === 0}
          className="dev-btn dev-btn-secondary"
          title="模拟处理单个文件"
        >
          <Play size={14} />
          处理单个
        </button>

        <button
          onClick={handleReset}
          disabled={isSimulating}
          className="dev-btn dev-btn-warning"
          title="重置所有状态"
        >
          <RotateCcw size={14} />
          重置状态
        </button>
      </div>

      <div className="dev-tools-note">
        <small>
          💡 提示：也可以在浏览器控制台使用 <code>window.progressDemo</code>
        </small>
      </div>
    </div>
  );
}
