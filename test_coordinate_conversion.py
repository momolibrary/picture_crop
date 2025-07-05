#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试裁剪功能的坐标转换问题
"""

import os
import cv2
import numpy as np

def test_coordinate_conversion():
    """测试坐标转换逻辑"""
    
    # 模拟图片尺寸
    img_width = 1920
    img_height = 1080
    
    # 模拟canvas尺寸
    canvas_width = 1200
    canvas_height = 800
    
    # 计算基础缩放比例
    max_canvas_width = canvas_width - 40
    max_canvas_height = canvas_height - 40
    base_scale = min(max_canvas_width / img_width, max_canvas_height / img_height)
    
    print(f"图片尺寸: {img_width}x{img_height}")
    print(f"Canvas尺寸: {canvas_width}x{canvas_height}")
    print(f"基础缩放比例: {base_scale:.4f}")
    
    # 模拟用户缩放
    zoom_factor = 1.5
    scale = base_scale * zoom_factor
    
    # 计算偏移（图片居中显示）
    offset_x = (canvas_width - img_width * scale) / 2
    offset_y = (canvas_height - img_height * scale) / 2
    
    print(f"实际缩放比例: {scale:.4f}")
    print(f"偏移量: ({offset_x:.1f}, {offset_y:.1f})")
    
    # 模拟用户在屏幕上选择的角点（canvas坐标）
    canvas_points = [
        [offset_x + img_width * scale * 0.1, offset_y + img_height * scale * 0.1],  # 左上
        [offset_x + img_width * scale * 0.9, offset_y + img_height * scale * 0.1],  # 右上
        [offset_x + img_width * scale * 0.9, offset_y + img_height * scale * 0.9],  # 右下
        [offset_x + img_width * scale * 0.1, offset_y + img_height * scale * 0.9]   # 左下
    ]
    
    print("\n屏幕坐标（canvas坐标）:")
    for i, point in enumerate(canvas_points):
        print(f"  角点{i+1}: ({point[0]:.1f}, {point[1]:.1f})")
    
    # 转换回原始图片坐标
    original_points = []
    for point in canvas_points:
        img_x = (point[0] - offset_x) / scale
        img_y = (point[1] - offset_y) / scale
        original_points.append([img_x, img_y])
    
    print("\n转换后的图片坐标:")
    for i, point in enumerate(original_points):
        print(f"  角点{i+1}: ({point[0]:.1f}, {point[1]:.1f})")
    
    # 验证转换的正确性
    expected_points = [
        [img_width * 0.1, img_height * 0.1],  # 左上
        [img_width * 0.9, img_height * 0.1],  # 右上
        [img_width * 0.9, img_height * 0.9],  # 右下
        [img_width * 0.1, img_height * 0.9]   # 左下
    ]
    
    print("\n期望的图片坐标:")
    for i, point in enumerate(expected_points):
        print(f"  角点{i+1}: ({point[0]:.1f}, {point[1]:.1f})")
    
    print("\n坐标转换误差:")
    max_error = 0
    for i, (actual, expected) in enumerate(zip(original_points, expected_points)):
        error_x = abs(actual[0] - expected[0])
        error_y = abs(actual[1] - expected[1])
        error = max(error_x, error_y)
        max_error = max(max_error, error)
        print(f"  角点{i+1}: 误差 {error:.6f} 像素")
    
    print(f"\n最大误差: {max_error:.6f} 像素")
    
    if max_error < 0.001:
        print("✓ 坐标转换测试通过！")
        return True
    else:
        print("✗ 坐标转换存在误差！")
        return False

if __name__ == "__main__":
    test_coordinate_conversion()
