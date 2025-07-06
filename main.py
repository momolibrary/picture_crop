"""
图片梯形裁剪校正工具 - API 服务
基于 FastAPI 的纯 API 图像处理服务，支持梯形图片的透视校正和裁剪
为现代前端应用提供完整的 REST API 接口
"""
import os
import cv2
import shutil
import time
import uvicorn
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, HTTPException, File
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware

# 导入自定义模块
from image_processor import (
    four_point_transform, 
    validate_and_correct_points, 
    resize_image_for_preview, 
    encode_image_to_jpeg,
    auto_detect_corners,
    generate_thumbnail,
    get_thumbnail_path
)

# 创建 FastAPI 应用
app = FastAPI(
    title="图片梯形裁剪校正 API",
    description="为图片梯形裁剪校正工具提供的完整 REST API 接口",
    version="2.0.0"
)

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],  # 允许前端开发服务器
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置文件夹
SOURCE_DIR = "source_images"
OUTPUT_DIR = "output_images"
PROCESSED_DIR = "processed"
THUMBNAIL_DIR = "thumbnails"

# 确保目录存在
os.makedirs(SOURCE_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(THUMBNAIL_DIR, exist_ok=True)

# API 数据模型定义
class ImageInfo(BaseModel):
    """图片信息模型"""
    filename: str
    width: int
    height: int
    file_size: Optional[int] = None
    created_time: Optional[str] = None
    has_thumbnail: bool = False
    thumbnail_url: Optional[str] = None

class PaginatedFileListResponse(BaseModel):
    """分页文件列表响应模型"""
    pending_files: List[ImageInfo]
    processed_files: List[str]
    total_files: int
    completion_rate: float
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

class FileListResponse(BaseModel):
    """文件列表响应模型 - 保持向后兼容"""
    pending_files: List[ImageInfo]
    processed_files: List[str]
    total_files: int
    completion_rate: float

class CropRequest(BaseModel):
    """裁剪请求模型"""
    points: List[List[float]]  # 四个角点坐标 [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]

class CropResponse(BaseModel):
    """裁剪响应模型"""
    success: bool
    filename: Optional[str] = None
    message: str
    processed_filename: Optional[str] = None
    error: Optional[str] = None

class AutoDetectResponse(BaseModel):
    """自动检测响应模型"""
    success: bool
    corners: Optional[List[List[float]]] = None
    confidence: float
    message: str
    error: Optional[str] = None

class NextFileResponse(BaseModel):
    """下一个文件响应模型"""
    success: bool
    next_filename: Optional[str] = None
    remaining_count: int
    message: str

@app.get("/")
async def root():
    """根路径 - 重定向到 API 文档"""
    return {
        "message": "图片梯形裁剪校正 API",
        "version": "2.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "status": "active"
    }

@app.get("/api/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "directories": {
            "source": os.path.exists(SOURCE_DIR),
            "output": os.path.exists(OUTPUT_DIR),
            "processed": os.path.exists(PROCESSED_DIR)
        }
    }

# 辅助函数
def generate_thumbnail_if_needed(image_path: str, filename: str) -> tuple[bool, str]:
    """
    如果需要，生成缩略图
    
    Returns:
        tuple: (has_thumbnail, thumbnail_url)
    """
    thumbnail_path = get_thumbnail_path(filename, THUMBNAIL_DIR)
    
    # 检查缩略图是否已存在且比原图新
    if os.path.exists(thumbnail_path):
        thumb_mtime = os.path.getmtime(thumbnail_path)
        img_mtime = os.path.getmtime(image_path)
        if thumb_mtime >= img_mtime:
            return True, f"/api/thumbnail/{filename}"
    
    # 生成缩略图
    if generate_thumbnail(image_path, thumbnail_path):
        return True, f"/api/thumbnail/{filename}"
    
    return False, ""

# API 实现部分
@app.get("/api/files/paginated", response_model=PaginatedFileListResponse)
async def get_files_paginated(page: int = 1, page_size: int = 20):
    """获取分页文件列表 - 优化性能的新接口"""
    try:
        # 获取待处理文件
        all_files = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
        all_files.sort(key=lambda f: os.path.getctime(os.path.join(SOURCE_DIR, f)), reverse=True)
        
        # 计算分页
        total_files = len(all_files)
        total_pages = (total_files + page_size - 1) // page_size
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_files = all_files[start_idx:end_idx]
        
        pending_files = []
        
        for filename in page_files:
            path = os.path.join(SOURCE_DIR, filename)
            if os.path.exists(path):
                try:
                    img = cv2.imread(path)
                    if img is not None:
                        height, width = img.shape[:2]
                        file_size = os.path.getsize(path)
                        created_time = time.ctime(os.path.getctime(path))
                        
                        # 生成缩略图
                        has_thumbnail, thumbnail_url = generate_thumbnail_if_needed(path, filename)
                        
                        pending_files.append(ImageInfo(
                            filename=filename,
                            width=int(width),
                            height=int(height),
                            file_size=file_size,
                            created_time=created_time,
                            has_thumbnail=has_thumbnail,
                            thumbnail_url=thumbnail_url
                        ))
                except Exception as e:
                    print(f"Error processing file {filename}: {e}")
                    continue
        
        # 获取已处理文件
        processed_files = [f for f in os.listdir(PROCESSED_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
        
        # 计算统计信息
        total_all_files = len(all_files) + len(processed_files)
        completion_rate = (len(processed_files) / total_all_files * 100) if total_all_files > 0 else 100
        
        return PaginatedFileListResponse(
            pending_files=pending_files,
            processed_files=processed_files,
            total_files=total_all_files,
            completion_rate=completion_rate,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取文件列表失败: {str(e)}")

@app.get("/api/files", response_model=FileListResponse)
async def get_files():
    """获取文件列表 - 兼容旧接口，但优化为只返回文件名"""
    try:
        # 获取待处理文件（只获取基本信息，不生成缩略图）
        files = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
        pending_files = []
        
        for filename in files:
            path = os.path.join(SOURCE_DIR, filename)
            if os.path.exists(path):
                try:
                    # 使用更快的方法获取图片尺寸
                    img = cv2.imread(path)
                    if img is not None:
                        height, width = img.shape[:2]
                        file_size = os.path.getsize(path)
                        created_time = time.ctime(os.path.getctime(path))
                        
                        pending_files.append(ImageInfo(
                            filename=filename,
                            width=int(width),
                            height=int(height),
                            file_size=file_size,
                            created_time=created_time,
                            has_thumbnail=False,
                            thumbnail_url=None
                        ))
                except Exception as e:
                    print(f"Error processing file {filename}: {e}")
                    continue
        
        # 获取已处理文件
        processed_files = [f for f in os.listdir(PROCESSED_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
        
        # 计算统计信息
        total_files = len(pending_files) + len(processed_files)
        completion_rate = (len(processed_files) / total_files * 100) if total_files > 0 else 100
        
        return FileListResponse(
            pending_files=pending_files,
            processed_files=processed_files,
            total_files=total_files,
            completion_rate=completion_rate
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取文件列表失败: {str(e)}")

@app.get("/api/thumbnail/{filename}")
async def get_thumbnail(filename: str):
    """获取图片缩略图"""
    thumbnail_path = get_thumbnail_path(filename, THUMBNAIL_DIR)
    
    if not os.path.exists(thumbnail_path):
        # 如果缩略图不存在，尝试生成
        source_path = os.path.join(SOURCE_DIR, filename)
        if not os.path.exists(source_path):
            source_path = os.path.join(PROCESSED_DIR, filename)
        
        if os.path.exists(source_path):
            if not generate_thumbnail(source_path, thumbnail_path):
                raise HTTPException(status_code=404, detail="无法生成缩略图")
        else:
            raise HTTPException(status_code=404, detail="原图文件不存在")
    
    return FileResponse(thumbnail_path, media_type="image/jpeg", headers={"Cache-Control": "max-age=3600"})


@app.post("/api/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """上传图片文件"""
    uploaded_files = []
    errors = []
    
    for file in files:
        try:
            # 验证文件类型
            if not file.content_type or not file.content_type.startswith('image/'):
                errors.append(f"{file.filename}: 不是有效的图片文件")
                continue
            
            # 保存文件
            content = await file.read()
            file_path = os.path.join(SOURCE_DIR, file.filename)
            
            with open(file_path, "wb") as f:
                f.write(content)
            
            uploaded_files.append(file.filename)
            
        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")
    
    return {
        "uploaded_files": uploaded_files,
        "errors": errors,
        "success": len(uploaded_files) > 0
    }


@app.get("/api/image/{filename}")
async def get_image(filename: str):
    """提供源图片文件访问"""
    # 首先尝试从源文件夹查找
    path = os.path.join(SOURCE_DIR, filename)
    if not os.path.exists(path):
        # 如果源文件夹没有，尝试从处理文件夹查找
        path = os.path.join(PROCESSED_DIR, filename)
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="图片文件不存在")
    
    # 检测文件类型
    file_extension = filename.lower().split('.')[-1]
    media_type_map = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg', 
        'png': 'image/png',
        'bmp': 'image/bmp',
        'gif': 'image/gif'
    }
    media_type = media_type_map.get(file_extension, 'image/jpeg')
    
    return FileResponse(path, media_type=media_type, headers={"Cache-Control": "no-cache"})
@app.post("/api/preview/{filename}")
async def preview_crop(filename: str, request: CropRequest):
    """生成裁剪预览"""
    source_path = os.path.join(SOURCE_DIR, filename)
    if not os.path.exists(source_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    if not request.points or len(request.points) != 4:
        raise HTTPException(status_code=400, detail="需要4个角点")
    
    try:
        img = cv2.imread(source_path)
        if img is None:
            raise HTTPException(status_code=400, detail="无法读取图片文件")
        
        height, width = img.shape[:2]
        print(f"生成预览: {filename}, 尺寸: {width}x{height}")
        print(f"角点坐标: {request.points}")
        
        # 验证并修正角点坐标
        corrected_points = validate_and_correct_points(request.points, width, height)
        
        # 执行透视变换
        warped = four_point_transform(img, corrected_points)
        
        # 如果预览图片太大，适当缩小以便在网页中显示
        warped = resize_image_for_preview(warped)
        
        # 编码为JPEG并返回
        success, buf = encode_image_to_jpeg(warped, 90)
        if not success:
            raise HTTPException(status_code=500, detail="预览图片编码失败")
        
        return Response(content=buf.tobytes(), media_type="image/jpeg")
    
    except Exception as e:
        print(f"生成预览时出错: {str(e)}")
        raise HTTPException(status_code=500, detail=f"生成预览时出错: {str(e)}")


@app.post("/api/crop/{filename}", response_model=CropResponse)
async def crop(filename: str, request: CropRequest):
    """执行图片裁剪并移动文件"""
    source_path = os.path.join(SOURCE_DIR, filename)
    if not os.path.exists(source_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    if not request.points or len(request.points) != 4:
        return CropResponse(success=False, message="需要4个角点", error="Invalid points")
    
    try:
        img = cv2.imread(source_path)
        if img is None:
            return CropResponse(success=False, message="无法读取图片文件", error="Cannot read image")
        
        height, width = img.shape[:2]
        print(f"处理图片: {filename}, 尺寸: {width}x{height}")
        print(f"接收到的角点坐标: {request.points}")
        
        # 验证并修正角点坐标
        corrected_points = validate_and_correct_points(request.points, width, height)
        print(f"修正后的角点坐标: {corrected_points}")
        
        # 执行透视变换
        warped = four_point_transform(img, corrected_points)
        
        # 生成输出文件名
        name_without_ext = os.path.splitext(filename)[0]
        output_filename = f"{name_without_ext}_cropped.jpg"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # 保存裁剪结果
        cv2.imwrite(output_path, warped)
        print(f"裁剪结果已保存到: {output_path}")
        
        # 移动原文件到processed文件夹
        processed_path = os.path.join(PROCESSED_DIR, filename)
        
        # 如果processed文件夹中已存在同名文件，添加时间戳
        if os.path.exists(processed_path):
            timestamp = int(time.time())
            name_part, ext_part = os.path.splitext(filename)
            processed_filename = f"{name_part}_{timestamp}{ext_part}"
            processed_path = os.path.join(PROCESSED_DIR, processed_filename)
        
        # 移动文件
        shutil.move(source_path, processed_path)
        
        return CropResponse(
            success=True,
            filename=output_filename,
            message="文件已处理完成并移动到processed文件夹",
            processed_filename=os.path.basename(processed_path)
        )
    except (IOError, ValueError, RuntimeError) as e:
        return CropResponse(success=False, message=f"处理失败: {str(e)}", error=str(e))


@app.get("/api/download/{filename}")
async def download(filename: str):
    """下载处理后的图片"""
    path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    return FileResponse(path, filename=filename)


@app.get("/api/image-info/{filename}", response_model=ImageInfo)
async def get_image_info(filename: str):
    """返回图片的尺寸信息"""
    path = os.path.join(SOURCE_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    try:
        img = cv2.imread(path)
        if img is None:
            raise HTTPException(status_code=400, detail="无法读取图片文件")
        
        height, width = img.shape[:2]
        file_size = os.path.getsize(path)
        created_time = time.ctime(os.path.getctime(path))
        
        return ImageInfo(
            filename=filename,
            width=int(width),
            height=int(height),
            file_size=file_size,
            created_time=created_time
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取图片信息时出错: {str(e)}")


@app.post("/api/auto-detect/{filename}", response_model=AutoDetectResponse)
async def auto_detect_corners_api(filename: str):
    """自动检测图片的四个角点"""
    path = os.path.join(SOURCE_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    try:
        print(f"开始自动检测角点: {filename}")
        
        # 调用自动检测函数
        corners, confidence = auto_detect_corners(path, debug=True)
        
        print(f"自动检测完成 - 角点: {corners}, 置信度: {confidence}")
        
        return AutoDetectResponse(
            success=True,
            corners=corners,
            confidence=float(confidence),
            message=f"自动检测完成，置信度: {confidence:.1%}" if confidence > 0.3 else "检测置信度较低，建议手动调整"
        )
        
    except Exception as e:
        print(f"自动检测失败: {str(e)}")
        return AutoDetectResponse(
            success=False,
            corners=None,
            confidence=0.0,
            message="自动检测失败",
            error=str(e)
        )


@app.get("/api/next-file/{current_filename}", response_model=NextFileResponse)
async def get_next_file(current_filename: str):
    """获取下一个待处理的图片文件名"""
    try:
        files = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
        
        if not files:
            return NextFileResponse(
                success=False,
                next_filename=None,
                remaining_count=0,
                message="没有待处理的文件"
            )
        
        # 如果当前文件还在列表中（这种情况不应该发生，因为裁剪后文件已移动）
        if current_filename in files:
            files.remove(current_filename)
        
        if not files:
            return NextFileResponse(
                success=False,
                next_filename=None,
                remaining_count=0,
                message="所有文件已处理完成"
            )
        
        # 返回第一个文件（按字母顺序）
        next_file = sorted(files)[0]
        return NextFileResponse(
            success=True,
            next_filename=next_file,
            remaining_count=len(files),
            message="获取下一个文件成功"
        )
        
    except Exception as e:
        return NextFileResponse(
            success=False,
            next_filename=None,
            remaining_count=0,
            message=f"获取下一个文件失败: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)