# 图片梯形裁剪校正应用 (重构版本 2.0)

这是一个现代化的图片梯形裁剪校正应用，采用前后端分离架构。后端使用 FastAPI 提供 REST API 服务，前端使用 React + TypeScript + Vite 构建现代化用户界面。

## 🚀 架构特点

- **前后端分离**：后端专注于 API 服务，前端提供现代化用户体验
- **纯 API 后端**：基于 FastAPI 的 REST API，支持自动文档生成
- **现代前端**：React + TypeScript + Vite，组件化开发
- **类型安全**：完整的 TypeScript 类型定义
- **开发友好**：热重载、自动文档、代码提示

## 📁 项目结构

```
├── 后端 (Python FastAPI)
│   ├── main.py              # API 服务主文件
│   ├── image_processor.py   # 图像处理核心模块
│   ├── html_templates.py    # 旧版 HTML 模板 (待删除)
│   ├── requirements.txt     # Python 依赖
│   ├── start_api.bat       # API 服务启动脚本
│   ├── API_DOCUMENTATION.md # API 文档
│   ├── source_images/      # 待处理图片目录
│   ├── processed/          # 已处理图片目录
│   └── output_images/      # 裁剪结果目录
│
├── 前端 (React + TypeScript)
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/  # React 组件
│   │   │   ├── hooks/       # 自定义 Hooks
│   │   │   ├── stores/      # Zustand 状态管理
│   │   │   ├── types/       # TypeScript 类型定义
│   │   │   ├── utils/       # 工具函数
│   │   │   └── App.tsx      # 主应用组件
│   │   ├── package.json     # 前端依赖
│   │   ├── vite.config.ts   # Vite 配置
│   │   └── tsconfig.json    # TypeScript 配置
│
└── 文档
    └── README.md           # 项目说明
```

## 🛠️ 技术栈

### 后端
- **FastAPI**: 现代 Python Web 框架
- **OpenCV**: 图像处理库
- **Pydantic**: 数据验证和序列化
- **Uvicorn**: ASGI 服务器

### 前端
- **React 18**: 用户界面库
- **TypeScript**: 类型安全的 JavaScript
- **Vite**: 快速构建工具
- **Zustand**: 轻量级状态管理
- **Tailwind CSS**: 实用优先的 CSS 框架

### 模块说明

- **main.py**: 包含FastAPI应用实例、路由定义和业务逻辑
- **image_processor.py**: 包含透视变换、四点变换等图像处理核心功能
- **html_templates.py**: 包含HTML页面模板生成函数，分离前端代码

## 系统要求

- Python 3.7 或更高版本
- Windows 操作系统

## 安装与运行

### 方法一：使用启动脚本（推荐）

1. 双击 `start.bat` 文件
2. 脚本会自动创建虚拟环境、安装依赖并启动服务
3. 在浏览器中访问 `http://localhost:8000`

### 方法二：手动安装

1. 打开命令提示符或PowerShell
2. 创建虚拟环境：
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```
3. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
4. 运行应用：
   ```bash
   python main.py
   ```
5. 在浏览器中访问 `http://localhost:8000`

## 🚀 快速开始

### 1. 启动后端 API 服务

```bash
# 方法一：使用启动脚本
./start_api.bat

# 方法二：直接运行 Python
python main.py

# 方法三：使用 uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API 服务将在 http://localhost:8000 启动

### 2. 启动前端开发服务器

```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:5173 启动

### 3. 访问应用

- **前端应用**: http://localhost:5173
- **API 文档**: http://localhost:8000/docs
- **备用文档**: http://localhost:8000/redoc

## 📖 API 文档

完整的 API 文档请查看：
- **在线文档**: http://localhost:8000/docs (启动服务后访问)
- **本地文档**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

主要 API 端点：
- `GET /api/files` - 获取文件列表
- `POST /api/upload` - 上传图片
- `GET /api/image/{filename}` - 获取图片
- `POST /api/auto-detect/{filename}` - 自动检测角点
- `POST /api/preview/{filename}` - 生成预览
- `POST /api/crop/{filename}` - 执行裁剪

## 🔧 开发说明

### 后端开发
1. 修改 `main.py` 添加新的 API 端点
2. 在 `image_processor.py` 中添加图像处理功能
3. 使用 `--reload` 参数自动重载代码更改

### 前端开发
1. 组件放在 `frontend/src/components/`
2. 状态管理使用 Zustand，存储在 `frontend/src/stores/`
3. 类型定义放在 `frontend/src/types/`
4. API 调用使用 TypeScript 类型安全的接口

## 🔄 版本对比

| 功能 | 旧版本 (1.0) | 新版本 (2.0) |
|------|-------------|-------------|
| 架构 | 单体应用 | 前后端分离 |
| 前端 | HTML 模板 | React + TypeScript |
| 后端 | FastAPI + HTML | 纯 API |
| 状态管理 | DOM 操作 | Zustand |
| 类型安全 | 无 | 完整 TypeScript |
| 开发体验 | 基础 | 热重载、自动文档 |
| 组件化 | 无 | 完全组件化 |
| 构建工具 | 无 | Vite |

## 📋 功能特点

### 核心功能
- ✅ **自动检测**：智能识别图片中的矩形角点
- ✅ **手动调整**：可拖拽四个角点进行精确定位
- ✅ **实时预览**：裁剪前预览效果
- ✅ **透视校正**：将梯形区域校正为标准矩形
- ✅ **批量上传**：支持同时上传多张图片
- ✅ **进度跟踪**：显示处理进度和完成状态

### 用户体验
- 🎨 **现代界面**：基于 React 的响应式用户界面
- 🖱️ **直观操作**：拖拽式角点调整
- 📱 **移动适配**：支持移动设备使用
- ⚡ **快速响应**：优化的性能和加载速度
- 🔄 **实时反馈**：操作结果即时显示

### 开发者友好
- 📝 **自动文档**：API 文档自动生成
- 🔧 **类型安全**：完整的 TypeScript 支持
- 🚀 **热重载**：开发时实时更新
- 📦 **模块化**：清晰的代码组织结构

## 使用方法

### 1. 上传图片
- 在首页点击"选择文件"按钮
- 选择要处理的图片（支持JPG、PNG、BMP格式）
- 点击"上传图片"按钮

### 2. 编辑图片
- 在文件列表中点击图片名称进入编辑页面
- 应用会自动检测图片中的矩形区域
- 可以拖拽红色圆点调整四个角点位置

### 3. 操作按钮
- **重置四角点**：将四个角点重置为图片的四个角
- **自动检测**：重新运行自动检测算法
- **裁剪图片**：执行透视校正并保存结果

### 4. 下载结果
- 裁剪完成后会显示下载链接
- 点击链接下载校正后的图片

## 文件夹结构

```
BOM会议/
├── main.py              # 主应用文件
├── requirements.txt     # Python依赖列表
├── start.bat           # Windows启动脚本
├── README.md           # 说明文档
├── static/             # 静态文件
│   └── style.css       # CSS样式文件
├── source_images/      # 原始图片文件夹
├── output_images/      # 输出图片文件夹
└── processed/          # 处理过程文件夹
```

## 技术栈

- **后端**：FastAPI - 现代、快速的Python Web框架
- **图像处理**：OpenCV - 计算机视觉库
- **前端**：HTML5 Canvas + JavaScript - 交互式图片编辑
- **服务器**：Uvicorn - ASGI服务器

## 算法说明

### 自动检测算法
1. 将图片转换为灰度
2. 应用高斯模糊减少噪声
3. 使用Canny边缘检测
4. 查找轮廓并筛选四边形
5. 选择面积最大的四边形作为候选区域

### 透视校正算法
1. 对四个角点进行排序（左上、右上、右下、左下）
2. 计算目标矩形的宽度和高度
3. 使用OpenCV的透视变换矩阵
4. 应用变换得到校正后的图片

## 常见问题

**Q: 自动检测失败怎么办？**
A: 可以手动拖拽四个红色圆点到正确位置，或者尝试使用对比度更高的图片。

**Q: 处理大图片很慢怎么办？**
A: 建议将图片缩小到合适的尺寸（如1920x1080）后再处理。

**Q: 支持哪些图片格式？**
A: 目前支持JPG、JPEG、PNG、BMP格式。

## 开发者信息

如需修改或扩展功能，请参考源代码中的注释。主要的图像处理函数：

- `find_largest_contour_rect()`: 自动检测四边形
- `order_points()`: 角点排序
- `four_point_transform()`: 透视变换

## 许可证

本项目仅供学习和个人使用。
