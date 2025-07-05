"""
图像处理模块
包含透视变换、四点变换等核心图像处理功能
"""
import cv2
import numpy as np


def order_points(pts):
    """
    按照左上、右上、右下、左下的顺序排列四个点
    """
    pts = np.array(pts)
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # top-left
    rect[2] = pts[np.argmax(s)]  # bottom-right
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # top-right
    rect[3] = pts[np.argmax(diff)]  # bottom-left
    return rect


def four_point_transform(image, pts):
    """
    执行四点透视变换，将梯形区域校正为矩形
    
    Args:
        image: 输入图像
        pts: 四个角点坐标
    
    Returns:
        warped: 变换后的图像
    """
    rect = order_points(pts)
    (tl, tr, br, bl) = rect
    
    # 计算新图像的宽度和高度
    widthA = np.linalg.norm(br - bl)
    widthB = np.linalg.norm(tr - tl)
    maxWidth = int(max(widthA, widthB))
    
    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxHeight = int(max(heightA, heightB))
    
    # 定义目标矩形的四个角点
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype="float32")
    
    # 计算透视变换矩阵并应用
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    
    return warped


def validate_and_correct_points(points, width, height):
    """
    验证并修正角点坐标，确保在图片范围内
    
    Args:
        points: 四个角点坐标列表
        width: 图片宽度
        height: 图片高度
    
    Returns:
        corrected_points: 修正后的角点坐标
    """
    corrected_points = []
    for i, point in enumerate(points):
        x, y = point
        # 确保坐标在有效范围内
        x = max(0, min(width, x))
        y = max(0, min(height, y))
        corrected_points.append([x, y])
        
        # 记录修正信息
        if x != point[0] or y != point[1]:
            print(f"角点{i+1} 坐标被修正: ({point[0]:.1f}, {point[1]:.1f}) -> ({x:.1f}, {y:.1f})")
    
    return corrected_points


def resize_image_for_preview(image, max_size=800):
    """
    调整图片大小以便预览显示
    
    Args:
        image: 输入图像
        max_size: 最大尺寸
    
    Returns:
        resized_image: 调整后的图像
    """
    height, width = image.shape[:2]
    
    if width > max_size or height > max_size:
        if width > height:
            new_width = max_size
            new_height = int(height * max_size / width)
        else:
            new_height = max_size
            new_width = int(width * max_size / height)
        
        resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
        print(f"预览图片已缩放至: {new_width}x{new_height}")
        return resized
    
    return image


def encode_image_to_jpeg(image, quality=85):
    """
    将图像编码为JPEG格式
    
    Args:
        image: 输入图像
        quality: JPEG质量 (1-100)
    
    Returns:
        success: 编码是否成功
        buffer: 编码后的字节数据
    """
    return cv2.imencode('.jpg', image, [cv2.IMWRITE_JPEG_QUALITY, quality])

def auto_detect_corners(image_path, debug=False):
    """
    自动检测PPT角点
    基于优化的技术方案：缩小到400px -> 预处理 -> 粗定位 -> 精定位 -> 映射回原尺寸
    
    Args:
        image_path: 图像文件路径
        debug: 是否输出调试信息
    
    Returns:
        corners: 检测到的四个角点坐标 [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                 按照左上、右上、右下、左下的顺序
        confidence: 检测置信度 (0-1)
    """
    try:
        # 读取图像
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"无法读取图像: {image_path}")
        
        original_height, original_width = image.shape[:2]
        if debug:
            print(f"原始图像尺寸: {original_width} x {original_height}")
        
        # 1. 预处理：将图像缩小到400px最大边长进行检测
        max_detection_size = 400
        if max(original_width, original_height) > max_detection_size:
            if original_width > original_height:
                new_width = max_detection_size
                new_height = int(original_height * max_detection_size / original_width)
            else:
                new_height = max_detection_size
                new_width = int(original_width * max_detection_size / original_height)
        else:
            new_width = original_width
            new_height = original_height
        
        # 计算缩放比例用于后续映射
        scale_x = original_width / new_width
        scale_y = original_height / new_height
        
        small_image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
        
        # 转换为灰度图
        gray_small = cv2.cvtColor(small_image, cv2.COLOR_BGR2GRAY)
        
        # 自适应直方图均衡化，增强对比度
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        gray_small = clahe.apply(gray_small)
        
        # 高斯模糊减少噪声
        blurred = cv2.GaussianBlur(gray_small, (5, 5), 0)
        
        # Canny边缘检测 - 针对缩小后的图像优化参数
        # 使用自适应阈值获得更好的边缘检测效果
        low_threshold = 50
        high_threshold = 150
        edges = cv2.Canny(blurred, low_threshold, high_threshold, apertureSize=3)
        
        # 形态学操作，连接断开的边缘
        kernel = np.ones((3,3), np.uint8)
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=1)
        
        if debug:
            print(f"检测用图像尺寸: {new_width} x {new_height}, 缩放比例: {scale_x:.2f} x {scale_y:.2f}")
            print(f"边缘检测参数: 低阈值={low_threshold}, 高阈值={high_threshold}")
        
        # 2. 粗定位：使用轮廓检测找到候选区域
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # 筛选轮廓：按面积排序，找到可能的矩形区域
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        
        best_corners = None
        best_confidence = 0
        
        for contour in contours[:10]:  # 检查前10个最大的轮廓
            # 近似轮廓为多边形
            epsilon = 0.02 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            
            # 寻找四边形
            if len(approx) == 4:
                # 计算轮廓面积比例
                area = cv2.contourArea(approx)
                area_ratio = area / (new_width * new_height)
                
                if debug:
                    print(f"找到四边形，面积比例: {area_ratio:.3f}")
                
                # 面积应该占图像的合理比例 (5%-80%)
                if 0.05 < area_ratio < 0.8:
                    # 计算角点坐标（映射回原图）
                    corners = []
                    for point in approx.reshape(-1, 2):
                        x = point[0] * scale_x
                        y = point[1] * scale_y
                        corners.append([float(x), float(y)])
                    
                    # 对角点进行排序（左上、右上、右下、左下）
                    corners = order_points(np.array(corners)).tolist()
                    
                    # 计算置信度：基于面积比例和角点分布
                    confidence = calculate_corner_confidence(corners, original_width, original_height)
                    
                    if confidence > best_confidence:
                        best_corners = corners
                        best_confidence = confidence
                        
                        if debug:
                            print(f"更新最佳角点，置信度: {confidence:.3f}")
        
        # 3. 精定位：如果找到了候选角点，进行精细化处理
        if best_corners is not None and best_confidence > 0.3:
            if debug:
                print(f"开始精细化处理，当前置信度: {best_confidence:.3f}")
            refined_corners = refine_corners_subpixel(image, best_corners, debug)
            if refined_corners is not None:
                best_corners = refined_corners
                best_confidence = min(best_confidence + 0.1, 1.0)  # 稍微提升置信度
                if debug:
                    print(f"精细化完成，置信度提升至: {best_confidence:.3f}")
        
        # 4. 后备方案：如果自动检测失败，使用智能默认角点
        if best_corners is None or best_confidence < 0.2:
            if debug:
                print("自动检测失败，使用智能默认角点")
            best_corners = get_smart_default_corners(original_width, original_height)
            best_confidence = 0.1  # 低置信度表示这是默认值
        
        # 验证和修正角点
        best_corners = validate_and_correct_points(best_corners, original_width, original_height)
        
        if debug:
            print(f"检测完成 - 最终角点: {[[int(c[0]), int(c[1])] for c in best_corners]}")
            print(f"最终置信度: {best_confidence:.3f}")
            print(f"检测方法: {'轮廓检测' if best_confidence > 0.2 else '默认角点'}")
        
        return best_corners, best_confidence
        
    except Exception as e:
        if debug:
            print(f"自动检测出错: {e}")
        # 返回默认角点
        return get_smart_default_corners(1920, 1080), 0.0


def calculate_corner_confidence(corners, width, height):
    """
    计算角点检测的置信度
    
    Args:
        corners: 四个角点坐标
        width: 图像宽度
        height: 图像高度
    
    Returns:
        confidence: 置信度 (0-1)
    """
    try:
        corners = np.array(corners)
        
        # 1. 检查角点是否形成合理的矩形
        # 计算对角线长度比
        diag1 = np.linalg.norm(corners[2] - corners[0])  # 左上到右下
        diag2 = np.linalg.norm(corners[3] - corners[1])  # 右上到左下
        diag_ratio = min(diag1, diag2) / max(diag1, diag2) if max(diag1, diag2) > 0 else 0
        
        # 2. 检查角点分布是否合理
        center_x, center_y = width / 2, height / 2
        center_distance = np.mean([np.linalg.norm([center_x - c[0], center_y - c[1]]) for c in corners])
        max_distance = np.sqrt(width**2 + height**2) / 2
        center_score = 1 - (center_distance / max_distance)
        
        # 3. 检查面积比例
        area = cv2.contourArea(corners.astype(np.float32))
        area_ratio = area / (width * height)
        area_score = 1 if 0.1 < area_ratio < 0.9 else max(0, 1 - abs(area_ratio - 0.5) * 2)
        
        # 综合置信度
        confidence = (diag_ratio * 0.4 + center_score * 0.3 + area_score * 0.3)
        
        return max(0, min(1, confidence))
        
    except:
        return 0.0


def refine_corners_subpixel(image, corners, debug=False):
    """
    使用亚像素精度优化角点位置
    
    Args:
        image: 原始图像
        corners: 粗定位的角点
        debug: 调试模式
    
    Returns:
        refined_corners: 精化后的角点
    """
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        corners_np = np.array(corners, dtype=np.float32)
        
        # 使用角点亚像素优化
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.1)
        
        refined_corners_list = []
        
        for corner in corners_np:
            # 在角点周围提取小区域进行精化
            x, y = int(corner[0]), int(corner[1])
            window_size = 15
            
            # 确保窗口在图像范围内
            x1 = max(0, x - window_size)
            y1 = max(0, y - window_size)
            x2 = min(gray.shape[1], x + window_size)
            y2 = min(gray.shape[0], y + window_size)
            
            if x2 - x1 > 10 and y2 - y1 > 10:  # 确保窗口足够大
                # 调整相对坐标
                corner_in_window = np.array([[corner[0] - x1, corner[1] - y1]], dtype=np.float32)
                
                # 亚像素角点检测
                refined_corner = cv2.cornerSubPix(
                    gray[y1:y2, x1:x2], 
                    corner_in_window, 
                    (5, 5), 
                    (-1, -1), 
                    criteria
                )
                
                # 转换回全局坐标
                global_corner = [refined_corner[0][0] + x1, refined_corner[0][1] + y1]
                refined_corners_list.append(global_corner)
            else:
                refined_corners_list.append(corner.tolist())
        
        if debug:
            print("亚像素精化完成")
        
        return refined_corners_list
        
    except Exception as e:
        if debug:
            print(f"亚像素精化失败: {e}")
        return corners


def get_smart_default_corners(width, height):
    """
    获取智能默认角点
    基于常见的PPT投影比例和位置
    
    Args:
        width: 图像宽度
        height: 图像高度
    
    Returns:
        corners: 默认角点坐标
    """
    # 考虑PPT通常会有一定的边距
    margin_x = width * 0.08  # 水平边距8%
    margin_y = height * 0.12  # 垂直边距12%（上下通常更多）
    
    # 稍微内缩，避免边缘干扰
    return [
        [margin_x, margin_y],                           # 左上
        [width - margin_x, margin_y],                   # 右上
        [width - margin_x, height - margin_y],          # 右下
        [margin_x, height - margin_y]                   # 左下
    ]
