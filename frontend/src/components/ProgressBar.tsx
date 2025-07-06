import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ProgressBarProps {
  /** 当前进度值 (0-100) */
  value: number;
  /** 总文件数 */
  totalFiles: number;
  /** 已完成文件数 */
  completedFiles: number;
  /** 正在处理的文件数 */
  processingFiles?: number;
  /** 错误文件数 */
  errorFiles?: number;
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 进度条颜色主题 */
  theme?: 'default' | 'success' | 'warning' | 'error';
}

export function ProgressBar({
  value,
  totalFiles,
  completedFiles,
  processingFiles = 0,
  errorFiles = 0,
  showDetails = true,
  className = '',
  theme = 'default'
}: ProgressBarProps) {
  const pendingFiles = totalFiles - completedFiles - processingFiles - errorFiles;
  
  // 获取主题颜色
  const getThemeClasses = () => {
    switch (theme) {
      case 'success':
        return 'bg-green-200 before:bg-green-500';
      case 'warning':
        return 'bg-yellow-200 before:bg-yellow-500';
      case 'error':
        return 'bg-red-200 before:bg-red-500';
      default:
        return 'bg-blue-200 before:bg-blue-500';
    }
  };

  // 计算进度条宽度
  const progressWidth = Math.min(Math.max(value, 0), 100);
  
  // 获取状态文本
  const getStatusText = () => {
    if (totalFiles === 0) return '无文件';
    if (completedFiles === totalFiles) return '全部完成';
    if (processingFiles > 0) return '处理中...';
    return '等待处理';
  };

  return (
    <div className={`progress-bar-container ${className}`}>
      {/* 进度条 */}
      <div className="progress-bar-wrapper">
        <div 
          className={`progress-bar ${getThemeClasses()}`}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`处理进度 ${value.toFixed(1)}%`}
        >
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressWidth}%` }}
          />
          <div className="progress-bar-text">
            {value.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 详细信息 */}
      {showDetails && (
        <div className="progress-details">
          <div className="progress-stats">
            <div className="stat-item stat-total">
              <span className="stat-label">总计</span>
              <span className="stat-value">{totalFiles}</span>
            </div>
            
            <div className="stat-item stat-completed">
              <CheckCircle size={14} className="text-green-500" />
              <span className="stat-label">已完成</span>
              <span className="stat-value">{completedFiles}</span>
            </div>
            
            {processingFiles > 0 && (
              <div className="stat-item stat-processing">
                <Clock size={14} className="text-blue-500 animate-pulse" />
                <span className="stat-label">处理中</span>
                <span className="stat-value">{processingFiles}</span>
              </div>
            )}
            
            {errorFiles > 0 && (
              <div className="stat-item stat-error">
                <AlertCircle size={14} className="text-red-500" />
                <span className="stat-label">错误</span>
                <span className="stat-value">{errorFiles}</span>
              </div>
            )}
            
            <div className="stat-item stat-pending">
              <span className="stat-label">待处理</span>
              <span className="stat-value">{pendingFiles}</span>
            </div>
          </div>
          
          
        </div>
      )}
    </div>
  );
}
