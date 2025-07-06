import { useAppStore } from '../store/useAppStore';

/**
 * 进度演示工具
 * 用于模拟文件处理进度和状态变化
 */
export class ProgressDemo {
  private store = useAppStore.getState();
  
  /**
   * 模拟处理单个文件
   */
  async simulateFileProcessing(filename: string, duration: number = 3000): Promise<void> {
    const { setProcessingStatus } = this.store;
    
    // 开始处理
    setProcessingStatus(filename, 'processing');
    
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // 随机决定成功或失败 (90% 成功率)
    const success = Math.random() > 0.1;
    
    if (success) {
      setProcessingStatus(filename, 'completed');
    } else {
      setProcessingStatus(filename, 'error', '处理失败：模拟错误');
    }
  }

  /**
   * 模拟批量处理文件
   */
  async simulateBatchProcessing(filenames: string[], concurrency: number = 3): Promise<void> {
    const chunks = this.chunkArray(filenames, concurrency);
    
    for (const chunk of chunks) {
      // 并行处理当前批次
      const promises = chunk.map(filename => 
        this.simulateFileProcessing(filename, Math.random() * 4000 + 1000)
      );
      
      await Promise.all(promises);
      
      // 批次之间稍作停顿
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * 模拟处理所有待处理文件
   */
  async simulateProcessAll(): Promise<void> {
    const { images } = useAppStore.getState();
    const pendingFiles = images
      .filter(img => img.status === 'pending')
      .map(img => img.originalName);
    
    if (pendingFiles.length === 0) {
      console.log('没有待处理的文件');
      return;
    }

    console.log(`开始模拟处理 ${pendingFiles.length} 个文件...`);
    await this.simulateBatchProcessing(pendingFiles, 2);
    console.log('批量处理完成');
  }

  /**
   * 重置所有处理状态
   */
  resetAllStatus(): void {
    const { images, clearProcessingStatus } = this.store;
    
    images.forEach(img => {
      clearProcessingStatus(img.originalName);
    });
  }

  /**
   * 获取当前处理统计
   */
  getCurrentStats() {
    const { getProcessingStats } = this.store;
    return getProcessingStats();
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// 创建全局实例
export const progressDemo = new ProgressDemo();

// 在开发环境下暴露到窗口对象，方便调试
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as typeof window & { progressDemo: ProgressDemo }).progressDemo = progressDemo;
  console.log('Progress demo available as window.progressDemo');
  console.log('Try: progressDemo.simulateProcessAll()');
}
