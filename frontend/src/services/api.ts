/**
 * API 服务模块
 * 提供与后端 API 的通信功能
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 类型定义
export interface ImageInfo {
  filename: string;
  width: number;
  height: number;
  file_size?: number;
  created_time?: string;
  has_thumbnail?: boolean;
  thumbnail_url?: string;
}

export interface PaginatedFileListResponse {
  pending_files: ImageInfo[];
  processed_files: string[];
  total_files: number;
  completion_rate: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface FileListResponse {
  pending_files: ImageInfo[];
  processed_files: string[];
  total_files: number;
  completion_rate: number;
}

export interface CropRequest {
  points: number[][]; // [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
}

export interface CropResponse {
  success: boolean;
  filename?: string;
  message: string;
  processed_filename?: string;
  error?: string;
}

export interface AutoDetectResponse {
  success: boolean;
  corners?: number[][];
  confidence: number;
  message: string;
  error?: string;
}

export interface NextFileResponse {
  success: boolean;
  next_filename?: string;
  remaining_count: number;
  message: string;
}

export interface UploadResponse {
  uploaded_files: string[];
  errors: string[];
  success: boolean;
}

// 处理图片的请求和响应类型
export interface ProcessImageRequest {
  imageId: string;
  cropArea: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
  };
  outputFormat?: string;
  quality?: number;
}

export interface ProcessImageResponse {
  success: boolean;
  processedImageUrl?: string;
  filename?: string;
  message: string;
  error?: string;
}

// API 错误处理
class ApiError extends Error {
  public status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// 通用请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new ApiError(response.status, errorData || response.statusText);
  }

  // 如果响应是图片类型，返回 blob
  if (response.headers.get('content-type')?.startsWith('image/')) {
    return response.blob() as T;
  }

  return response.json();
}

// API 服务函数
export const apiService = {
  // 获取文件列表
  async getFiles(): Promise<FileListResponse> {
    return apiRequest<FileListResponse>('/api/files');
  },

  // 上传文件
  async uploadFiles(files: FileList): Promise<UploadResponse> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new ApiError(response.status, errorData || response.statusText);
    }

    return response.json();
  },

  // 获取图片
  async getImage(filename: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/image/${encodeURIComponent(filename)}`);
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  // 获取图片信息
  async getImageInfo(filename: string): Promise<ImageInfo> {
    return apiRequest<ImageInfo>(`/api/image-info/${encodeURIComponent(filename)}`);
  },

  // 自动检测角点
  async autoDetectCorners(filename: string): Promise<AutoDetectResponse> {
    return apiRequest<AutoDetectResponse>(`/api/auto-detect/${encodeURIComponent(filename)}`, {
      method: 'POST',
    });
  },

  // 生成预览
  async generatePreview(filename: string, points: number[][]): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/preview/${encodeURIComponent(filename)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ points }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new ApiError(response.status, errorData || response.statusText);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  // 执行裁剪
  async cropImage(filename: string, points: number[][]): Promise<CropResponse> {
    return apiRequest<CropResponse>(`/api/crop/${encodeURIComponent(filename)}`, {
      method: 'POST',
      body: JSON.stringify({ points }),
    });
  },

  // 下载处理结果
  async downloadResult(filename: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/download/${encodeURIComponent(filename)}`);
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  // 获取下一个文件
  async getNextFile(currentFilename: string): Promise<NextFileResponse> {
    return apiRequest<NextFileResponse>(`/api/next-file/${encodeURIComponent(currentFilename)}`);
  },

  // 健康检查
  async healthCheck(): Promise<{ status: string; timestamp: number; directories: Record<string, boolean> }> {
    return apiRequest('/api/health');
  },

  // 处理图片（新的统一处理方法）
  async processImage(request: ProcessImageRequest): Promise<ProcessImageResponse> {
    const points = [
      [request.cropArea.topLeft.x, request.cropArea.topLeft.y],
      [request.cropArea.topRight.x, request.cropArea.topRight.y],
      [request.cropArea.bottomRight.x, request.cropArea.bottomRight.y],
      [request.cropArea.bottomLeft.x, request.cropArea.bottomLeft.y],
    ];

    try {
      // 假设我们通过imageId可以获取到文件名
      // 在实际应用中，你可能需要维护一个imageId到filename的映射
      const filename = request.imageId; 
      
      const cropResponse = await this.cropImage(filename, points);
      
      if (cropResponse.success && cropResponse.processed_filename) {
        const processedImageUrl = await this.downloadResult(cropResponse.processed_filename);
        return {
          success: true,
          processedImageUrl,
          filename: cropResponse.processed_filename,
          message: 'Image processed successfully'
        };
      } else {
        return {
          success: false,
          message: cropResponse.message || 'Processing failed',
          error: cropResponse.error
        };
      }
    } catch (error) {
      console.error('Process image error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // 获取分页文件列表
  async getFilesPaginated(page = 1, pageSize = 20): Promise<PaginatedFileListResponse> {
    return apiRequest<PaginatedFileListResponse>(`/api/files/paginated?page=${page}&page_size=${pageSize}`);
  },

  // 获取缩略图URL
  getThumbnailUrl(filename: string): string {
    return `${API_BASE_URL}/api/thumbnail/${encodeURIComponent(filename)}`;
  },
};

export default apiService;
