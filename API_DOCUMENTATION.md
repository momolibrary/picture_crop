# 图片梯形裁剪校正 API 文档

## 概述

这是一个纯 API 后端服务，为图片梯形裁剪校正工具提供完整的 REST API 接口。基于 FastAPI 构建，提供自动文档生成和类型验证。

## 基本信息

- **服务地址**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs (Swagger UI)
- **备用文档**: http://localhost:8000/redoc (ReDoc)
- **版本**: 2.0.0

## API 端点

### 1. 系统信息

#### `GET /` - 根路径
获取 API 基本信息
- **响应**: 
```json
{
  "message": "图片梯形裁剪校正 API",
  "version": "2.0.0",
  "docs": "/docs",
  "redoc": "/redoc",
  "status": "active"
}
```

#### `GET /api/health` - 健康检查
检查系统状态和目录是否正常
- **响应**: 
```json
{
  "status": "healthy",
  "timestamp": 1704556800.0,
  "directories": {
    "source": true,
    "output": true,
    "processed": true
  }
}
```

### 2. 文件管理

#### `GET /api/files` - 获取文件列表
获取待处理和已处理的文件列表以及统计信息
- **响应模型**: `FileListResponse`
```json
{
  "pending_files": [
    {
      "filename": "test.jpg",
      "width": 1920,
      "height": 1080,
      "file_size": 245760,
      "created_time": "Mon Jan 01 12:00:00 2024"
    }
  ],
  "processed_files": ["processed_file.jpg"],
  "total_files": 2,
  "completion_rate": 50.0
}
```

#### `POST /api/upload` - 上传文件
上传一个或多个图片文件
- **请求**: 多个文件上传 (multipart/form-data)
- **响应**: 
```json
{
  "uploaded_files": ["file1.jpg", "file2.png"],
  "errors": [],
  "success": true
}
```

#### `GET /api/image/{filename}` - 获取图片
获取源图片文件
- **参数**: `filename` - 文件名
- **响应**: 图片文件 (image/jpeg, image/png, etc.)

#### `GET /api/download/{filename}` - 下载结果
下载处理后的图片
- **参数**: `filename` - 文件名
- **响应**: 处理后的图片文件

### 3. 图片信息

#### `GET /api/image-info/{filename}` - 获取图片信息
获取图片的详细信息
- **参数**: `filename` - 文件名
- **响应模型**: `ImageInfo`
```json
{
  "filename": "test.jpg",
  "width": 1920,
  "height": 1080,
  "file_size": 245760,
  "created_time": "Mon Jan 01 12:00:00 2024"
}
```

### 4. 图片处理

#### `POST /api/auto-detect/{filename}` - 自动检测角点
自动检测图片的四个角点
- **参数**: `filename` - 文件名
- **响应模型**: `AutoDetectResponse`
```json
{
  "success": true,
  "corners": [[100, 200], [800, 220], [750, 600], [150, 580]],
  "confidence": 0.85,
  "message": "自动检测完成，置信度: 85.0%",
  "error": null
}
```

#### `POST /api/preview/{filename}` - 生成预览
根据角点生成裁剪预览
- **参数**: `filename` - 文件名
- **请求体**: `CropRequest`
```json
{
  "points": [[100, 200], [800, 220], [750, 600], [150, 580]]
}
```
- **响应**: 预览图片 (image/jpeg)

#### `POST /api/crop/{filename}` - 执行裁剪
执行图片裁剪并保存结果
- **参数**: `filename` - 文件名
- **请求体**: `CropRequest`
```json
{
  "points": [[100, 200], [800, 220], [750, 600], [150, 580]]
}
```
- **响应模型**: `CropResponse`
```json
{
  "success": true,
  "filename": "test_cropped.jpg",
  "message": "文件已处理完成并移动到processed文件夹",
  "processed_filename": "test.jpg",
  "error": null
}
```

### 5. 工作流管理

#### `GET /api/next-file/{current_filename}` - 获取下一个文件
获取下一个待处理的文件
- **参数**: `current_filename` - 当前文件名
- **响应模型**: `NextFileResponse`
```json
{
  "success": true,
  "next_filename": "next_file.jpg",
  "remaining_count": 5,
  "message": "获取下一个文件成功"
}
```

## 数据模型

### ImageInfo
```typescript
{
  filename: string
  width: number
  height: number
  file_size?: number
  created_time?: string
}
```

### CropRequest
```typescript
{
  points: number[][]  // [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
}
```

### CropResponse
```typescript
{
  success: boolean
  filename?: string
  message: string
  processed_filename?: string
  error?: string
}
```

### AutoDetectResponse
```typescript
{
  success: boolean
  corners?: number[][]
  confidence: number
  message: string
  error?: string
}
```

### NextFileResponse
```typescript
{
  success: boolean
  next_filename?: string
  remaining_count: number
  message: string
}
```

### FileListResponse
```typescript
{
  pending_files: ImageInfo[]
  processed_files: string[]
  total_files: number
  completion_rate: number
}
```

## 向后兼容

为了保持向后兼容性，保留了以下端点：
- `GET /image/{filename}` - 重定向到 `/api/image/{filename}`

## CORS 配置

API 支持跨域请求，允许以下来源：
- `http://localhost:5173` (Vite 开发服务器)
- `http://localhost:3000` (React 开发服务器)
- 其他所有来源 (开发模式)

## 错误处理

所有端点都会返回适当的 HTTP 状态码：
- `200` - 成功
- `400` - 请求错误
- `404` - 文件不存在
- `500` - 服务器内部错误

错误响应格式：
```json
{
  "detail": "错误描述信息"
}
```

## 使用示例

### JavaScript/TypeScript

```javascript
// 获取文件列表
const response = await fetch('/api/files');
const data = await response.json();

// 上传文件
const formData = new FormData();
formData.append('files', file);
await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

// 裁剪图片
await fetch(`/api/crop/${filename}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    points: [[100, 200], [800, 220], [750, 600], [150, 580]]
  })
});
```

### Python

```python
import requests

# 获取文件列表
response = requests.get('http://localhost:8000/api/files')
data = response.json()

# 裁剪图片
crop_data = {
    "points": [[100, 200], [800, 220], [750, 600], [150, 580]]
}
response = requests.post(
    f'http://localhost:8000/api/crop/{filename}',
    json=crop_data
)
```

## 部署说明

1. 确保安装了所有依赖：
   ```bash
   pip install -r requirements.txt
   ```

2. 启动服务：
   ```bash
   python main.py
   ```
   或使用 uvicorn：
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. 访问 API 文档：
   - http://localhost:8000/docs
   - http://localhost:8000/redoc
