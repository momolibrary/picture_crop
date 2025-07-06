#!/usr/bin/env python3
"""
坐标转换测试工具
用于验证前端传递的坐标是否正确映射到图片原始坐标
"""

def test_coordinate_conversion():
    """测试坐标转换逻辑"""
    
    # 模拟数据
    canvas_width = 800
    canvas_height = 600
    image_width = 1920
    image_height = 1080
    
    # 模拟Canvas中的裁剪区域坐标（假设这是前端传递的坐标）
    crop_points = [
        [100, 80],   # topLeft
        [700, 100],  # topRight  
        [680, 520],  # bottomRight
        [120, 500]   # bottomLeft
    ]
    
    print("=== 坐标转换测试 ===")
    print(f"Canvas尺寸: {canvas_width} x {canvas_height}")
    print(f"图片原始尺寸: {image_width} x {image_height}")
    print(f"Canvas中的裁剪坐标: {crop_points}")
    print()
    
    # 计算图片在Canvas中的显示信息
    scale = min(canvas_width / image_width, canvas_height / image_height)
    display_width = image_width * scale
    display_height = image_height * scale
    display_x = (canvas_width - display_width) / 2
    display_y = (canvas_height - display_height) / 2
    
    print("=== 图片显示信息 ===")
    print(f"缩放比例: {scale:.4f}")
    print(f"显示尺寸: {display_width:.1f} x {display_height:.1f}")
    print(f"显示位置: ({display_x:.1f}, {display_y:.1f})")
    print()
    
    # 转换为图片原始坐标
    image_coordinates = []
    print("=== 坐标转换过程 ===")
    for i, (canvas_x, canvas_y) in enumerate(crop_points):
        # 转换为相对于图片显示区域的坐标
        relative_x = canvas_x - display_x
        relative_y = canvas_y - display_y
        
        # 转换为原始图片坐标
        image_x = (relative_x / display_width) * image_width
        image_y = (relative_y / display_height) * image_height
        
        # 确保坐标在有效范围内
        final_x = max(0, min(image_width, round(image_x)))
        final_y = max(0, min(image_height, round(image_y)))
        
        image_coordinates.append([final_x, final_y])
        
        print(f"点{i+1}: Canvas({canvas_x}, {canvas_y}) -> 相对({relative_x:.1f}, {relative_y:.1f}) -> 图片({image_x:.1f}, {image_y:.1f}) -> 最终({final_x}, {final_y})")
    
    print()
    print(f"最终图片坐标: {image_coordinates}")
    
    # 验证：将图片坐标转换回Canvas坐标
    print()
    print("=== 反向验证 ===")
    for i, (img_x, img_y) in enumerate(image_coordinates):
        # 转换为相对比例
        relative_x_ratio = img_x / image_width
        relative_y_ratio = img_y / image_height
        
        # 转换为Canvas坐标
        canvas_x = display_x + relative_x_ratio * display_width
        canvas_y = display_y + relative_y_ratio * display_height
        
        original_canvas = crop_points[i]
        print(f"点{i+1}: 图片({img_x}, {img_y}) -> Canvas({canvas_x:.1f}, {canvas_y:.1f}) | 原始Canvas{original_canvas} | 差值({canvas_x-original_canvas[0]:.1f}, {canvas_y-original_canvas[1]:.1f})")

if __name__ == "__main__":
    test_coordinate_conversion()
