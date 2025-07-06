#!/usr/bin/env python3
"""
带zoom和offset的坐标转换测试工具
"""

def test_coordinate_conversion_with_transform():
    """测试包含zoom和offset的坐标转换逻辑"""
    
    # 模拟数据
    canvas_width = 800
    canvas_height = 600
    image_width = 1920
    image_height = 1080
    zoom = 1.5
    offset_x = 50
    offset_y = 30
    
    # 模拟存储在cropArea中的坐标（这些是逆变换后的坐标）
    stored_crop_points = [
        [100, 80],   # topLeft
        [700, 100],  # topRight  
        [680, 520],  # bottomRight
        [120, 500]   # bottomLeft
    ]
    
    print("=== 带变换的坐标转换测试 ===")
    print(f"Canvas尺寸: {canvas_width} x {canvas_height}")
    print(f"图片原始尺寸: {image_width} x {image_height}")
    print(f"Zoom: {zoom}, Offset: ({offset_x}, {offset_y})")
    print(f"存储的裁剪坐标（逆变换后）: {stored_crop_points}")
    print()
    
    # 计算图片在无变换状态下的基础显示信息
    base_scale = min(canvas_width / image_width, canvas_height / image_height)
    base_display_width = image_width * base_scale
    base_display_height = image_height * base_scale
    base_display_x = (canvas_width - base_display_width) / 2
    base_display_y = (canvas_height - base_display_height) / 2
    
    # 应用当前的zoom和offset变换
    actual_scale = base_scale * zoom
    actual_display_width = image_width * actual_scale
    actual_display_height = image_height * actual_scale
    actual_display_x = base_display_x * zoom + offset_x
    actual_display_y = base_display_y * zoom + offset_y
    
    print("=== 图片显示信息 ===")
    print(f"基础缩放比例: {base_scale:.4f}")
    print(f"基础显示尺寸: {base_display_width:.1f} x {base_display_height:.1f}")
    print(f"基础显示位置: ({base_display_x:.1f}, {base_display_y:.1f})")
    print(f"实际缩放比例: {actual_scale:.4f}")
    print(f"实际显示尺寸: {actual_display_width:.1f} x {actual_display_height:.1f}")
    print(f"实际显示位置: ({actual_display_x:.1f}, {actual_display_y:.1f})")
    print()
    
    # 转换为图片原始坐标
    image_coordinates = []
    print("=== 坐标转换过程 ===")
    for i, (stored_x, stored_y) in enumerate(stored_crop_points):
        # cropArea中的坐标是逆变换后的坐标，需要先应用变换得到实际Canvas坐标
        actual_canvas_x = stored_x * zoom + offset_x
        actual_canvas_y = stored_y * zoom + offset_y
        
        # 转换为相对于图片显示区域的坐标
        relative_x = actual_canvas_x - actual_display_x
        relative_y = actual_canvas_y - actual_display_y
        
        # 转换为原始图片坐标
        image_x = (relative_x / actual_display_width) * image_width
        image_y = (relative_y / actual_display_height) * image_height
        
        # 确保坐标在有效范围内
        final_x = max(0, min(image_width, round(image_x)))
        final_y = max(0, min(image_height, round(image_y)))
        
        image_coordinates.append([final_x, final_y])
        
        print(f"点{i+1}: 存储({stored_x}, {stored_y}) -> 实际Canvas({actual_canvas_x:.1f}, {actual_canvas_y:.1f}) -> 相对({relative_x:.1f}, {relative_y:.1f}) -> 图片({image_x:.1f}, {image_y:.1f}) -> 最终({final_x}, {final_y})")
    
    print()
    print(f"最终图片坐标: {image_coordinates}")

if __name__ == "__main__":
    test_coordinate_conversion_with_transform()
