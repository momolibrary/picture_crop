"""
图片梯形裁剪校正工具 - 主应用文件
基于 FastAPI 的图像处理服务，支持梯形图片的透视校正和裁剪
"""
import os
import cv2
import shutil
import time
import uvicorn
from typing import List
from fastapi import FastAPI, UploadFile, Request, HTTPException
from fastapi.responses import HTMLResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# 导入自定义模块
from image_processor import (
    four_point_transform, 
    validate_and_correct_points, 
    resize_image_for_preview, 
    encode_image_to_jpeg,
    auto_detect_corners
)
from html_templates import (
    generate_index_html, 
    generate_edit_html, 
    generate_batch_process_html
)

# 创建 FastAPI 应用
app = FastAPI(title="图片梯形裁剪校正工具", version="1.0.0")

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置文件夹
SOURCE_DIR = "source_images"
OUTPUT_DIR = "output_images"
PROCESSED_DIR = "processed"

# 确保目录存在
os.makedirs(SOURCE_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# 挂载静态文件
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/image/{filename}")
async def get_image(filename: str):
    """提供源图片文件访问"""
    path = os.path.join(SOURCE_DIR, filename)
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


@app.get("/", response_class=HTMLResponse)
async def index():
    """首页 - 显示待处理和已处理的图片列表"""
    files = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
    processed_files = [f for f in os.listdir(PROCESSED_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
    
    return generate_index_html(files, processed_files)


@app.post("/upload")
async def upload(files: List[UploadFile]):
    """上传图片文件"""
    for file in files:
        content = await file.read()
        with open(os.path.join(SOURCE_DIR, file.filename), "wb") as f:
            f.write(content)
    return {"status": "ok"}


@app.get("/edit/{filename}", response_class=HTMLResponse)
async def edit(filename: str):
    """图片编辑页面"""
    print(f"接收到的filename参数: '{filename}'")
    path = os.path.join(SOURCE_DIR, filename)
    print(f"构造的文件路径: '{path}'")
    print(f"文件是否存在: {os.path.exists(path)}")
    
    if not os.path.exists(path):
        print(f"文件不存在，列出SOURCE_DIR中的文件:")
        try:
            files = os.listdir(SOURCE_DIR)
            for f in files[:5]:  # 只显示前5个文件
                print(f"  {f}")
        except Exception as e:
            print(f"无法列出文件: {e}")
        return HTMLResponse(f"文件不存在: {filename}", status_code=404)
    
    try:
        # 简单验证文件是否可读
        img = cv2.imread(path)
        if img is None:
            return HTMLResponse("无法读取图片文件", status_code=400)
        
        print(f"验证图片: {filename}, 尺寸: {img.shape}")
    except Exception as e:
        print(f"处理图片时出错: {str(e)}")
        return HTMLResponse(f"处理图片时出错: {str(e)}", status_code=500)
    
    return generate_edit_html(filename)
@app.post("/preview/{filename}")
async def preview_crop(filename: str, request: Request):
    """生成裁剪预览"""
    source_path = os.path.join(SOURCE_DIR, filename)
    if not os.path.exists(source_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    data = await request.json()
    points = data.get("points")
    
    if not points or len(points) != 4:
        raise HTTPException(status_code=400, detail="需要4个角点")
    
    try:
        img = cv2.imread(source_path)
        if img is None:
            raise HTTPException(status_code=400, detail="无法读取图片文件")
        
        height, width = img.shape[:2]
        print(f"生成预览: {filename}, 尺寸: {width}x{height}")
        print(f"角点坐标: {points}")
        
        # 验证并修正角点坐标
        corrected_points = validate_and_correct_points(points, width, height)
        
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


@app.post("/crop/{filename}")
async def crop(filename: str, request: Request):
    """执行图片裁剪并移动文件"""
    source_path = os.path.join(SOURCE_DIR, filename)
    if not os.path.exists(source_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    data = await request.json()
    points = data.get("points")
    
    if not points or len(points) != 4:
        return {"success": False, "error": "需要4个角点"}
    
    try:
        img = cv2.imread(source_path)
        if img is None:
            return {"success": False, "error": "无法读取图片文件"}
        
        height, width = img.shape[:2]
        print(f"处理图片: {filename}, 尺寸: {width}x{height}")
        print(f"接收到的角点坐标: {points}")
        
        # 验证并修正角点坐标
        corrected_points = validate_and_correct_points(points, width, height)
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
        
        return {
            "success": True, 
            "filename": output_filename,
            "message": "文件已处理完成并移动到processed文件夹",
            "processed_filename": os.path.basename(processed_path)
        }
    except (IOError, ValueError, RuntimeError) as e:
        return {"success": False, "error": str(e)}


@app.get("/download/{filename}")
async def download(filename: str):
    """下载处理后的图片"""
    path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    return FileResponse(path, filename=filename)


@app.get("/batch_process", response_class=HTMLResponse)
async def batch_process():
    """批量处理页面（已禁用，引导用户手动处理）"""
    return generate_batch_process_html()


@app.get("/image_info/{filename}")
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
        return {
            "width": int(width),
            "height": int(height),
            "filename": filename
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取图片信息时出错: {str(e)}")


@app.post("/auto_detect/{filename}")
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
        
        return {
            "success": True,
            "corners": corners,
            "confidence": float(confidence),
            "message": f"自动检测完成，置信度: {confidence:.1%}" if confidence > 0.3 else "检测置信度较低，建议手动调整"
        }
        
    except Exception as e:
        print(f"自动检测失败: {str(e)}")
        return {
            "success": False, 
            "error": f"自动检测失败: {str(e)}",
            "corners": None,
            "confidence": 0.0
        }


@app.get("/next_file/{current_filename}")
async def get_next_file(current_filename: str):
    """获取下一个待处理的图片文件名"""
    try:
        files = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
        
        if not files:
            return {"success": False, "message": "没有待处理的文件"}
        
        # 如果当前文件还在列表中（这种情况不应该发生，因为裁剪后文件已移动）
        if current_filename in files:
            files.remove(current_filename)
        
        if not files:
            return {"success": False, "message": "所有文件已处理完成"}
        
        # 返回第一个文件（按字母顺序）
        next_file = sorted(files)[0]
        return {
            "success": True, 
            "next_filename": next_file,
            "remaining_count": len(files)
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)