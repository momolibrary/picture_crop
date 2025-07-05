"""
HTML模板生成模块
包含网页界面的HTML模板生成功能
"""


def generate_index_html(files, processed_files):
    """
    生成首页HTML模板
    
    Args:
        files: 待处理文件列表
        processed_files: 已处理文件列表
    
    Returns:
        html: 生成的HTML字符串
    """
    # 统计信息
    total_files = len(files) + len(processed_files)
    completion_rate = (len(processed_files) / total_files * 100) if total_files > 0 else 100
    
    html = f"""
    <html>
    <head>
    <title>图片梯形裁剪校正</title>
    <link rel="stylesheet" href="/static/style.css">
    <style>
        .progress-bar {{
            width: 100%;
            height: 20px;
            background-color: #f0f0f0;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }}
        .progress-fill {{
            height: 100%;
            background-color: #27ae60;
            width: {completion_rate}%;
            transition: width 0.3s ease;
        }}
        .stats {{
            background: #e8f5e8;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }}
        .upload-section {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin: 20px 0;
        }}
        .file-list {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .file-item {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }}
        .file-item:last-child {{
            border-bottom: none;
        }}
        .file-name {{
            font-weight: bold;
            flex-grow: 1;
        }}
        .file-actions {{
            display: flex;
            gap: 10px;
        }}
        .btn {{
            padding: 5px 15px;
            text-decoration: none;
            border-radius: 3px;
            font-size: 14px;
        }}
        .btn-edit {{
            background: #3498db;
            color: white;
        }}
        .btn-edit:hover {{
            background: #2980b9;
        }}
        .empty-state {{
            text-align: center;
            padding: 40px;
            color: #7f8c8d;
        }}
        .completion-message {{
            text-align: center;
            padding: 30px;
            background: #d5f4e6;
            border-radius: 10px;
            color: #27ae60;
            font-size: 18px;
            font-weight: bold;
        }}
    </style>
    </head>
    <body>
    <h1>图片梯形裁剪校正工具</h1>
    
    <div class="stats">
        <h3>处理进度</h3>
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        <p><strong>总计：</strong> {total_files} 张图片 | 
           <strong>待处理：</strong> {len(files)} 张 | 
           <strong>已完成：</strong> {len(processed_files)} 张 | 
           <strong>完成率：</strong> {completion_rate:.1f}%</p>
    </div>
    
    <div class="upload-section">
        <h3>上传新图片</h3>
        <form id="uploadForm" enctype="multipart/form-data" method="post" action="/upload">
            <input type="file" name="file" accept="image/*" multiple>
            <button type="submit">上传图片</button>
        </form>
    </div>
    """
    
    if len(files) == 0:
        if total_files > 0:
            html += """
            <div class="completion-message">
                🎉 所有图片已处理完成！
            </div>
            """
        else:
            html += """
            <div class="empty-state">
                <h3>暂无待处理图片</h3>
                <p>请上传图片开始处理</p>
            </div>
            """
    else:
        html += f"""
        <div class="file-list">
            <h3>待处理图片 ({len(files)} 张)</h3>
        """
        
        for f in files:
            html += f"""
            <div class="file-item">
                <div class="file-name">{f}</div>
                <div class="file-actions">
                    <a href="/edit/{f}" class="btn btn-edit">编辑裁剪</a>
                </div>
            </div>
            """
        
        html += "</div>"
    
    html += """
    </body>
    </html>
    """
    return html


def generate_edit_html(filename):
    """
    生成编辑页面HTML模板
    
    Args:
        filename: 要编辑的文件名
    
    Returns:
        html: 生成的HTML字符串
    """
    return f"""
    <html>
    <head>
    <title>裁剪 - {filename}</title>
    <link rel="stylesheet" href="/static/style.css">
    <style>
        {get_edit_page_styles()}
    </style>
    </head>
    <body>
    <div class="back-link">
        <a href="/">&larr; 返回首页</a>
    </div>
    <h2>裁剪图片: {filename}</h2>
    
    <div class="instructions">
        <h3>操作说明：</h3>
        <ul>
            <li><strong>🤖 自动检测角点</strong>：智能识别PPT的四个角点，基于边缘检测和轮廓分析</li>
            <li><strong>红色圆点（1,2,3,4）</strong>：四个角点，可自由拖拽调整位置</li>
            <li><strong>蓝色菱形（上/右/下/左）</strong>：边的中点控制器，可沿垂直于边的方向拖动，实现整条边的平行移动</li>
            <li><strong>绿色线条和半透明区域</strong>：裁剪区域边界和预览</li>
            <li><strong>瞄准镜放大镜</strong>：拖拽角点时自动显示高倍放大窗口，帮助精确定位</li>
            <li><strong>缩放控制</strong>：使用放大/缩小按钮或<strong>鼠标滚轮</strong>调整图片显示大小，便于精确操作</li>
            <li><strong>画布平移</strong>：在空白区域拖拽可平移画布，用于查看和调整移出视口的角点</li>
            <li><strong>智能缩放</strong>：鼠标滚轮缩放时会以鼠标位置为中心进行缩放，按钮缩放以画布中心为基准</li>
            <li><strong>操作技巧</strong>：推荐先点击"自动检测角点"，然后根据需要手动微调，最后用边控制器进行精确调整</li>
        </ul>
    </div>
    
    <div class="canvas-container">
        <div class="zoom-info">缩放: <span id="zoomLevel">100%</span></div>
        <canvas id="canvas" width="900" height="700"></canvas>
        <!-- 瞄准镜放大窗口 -->
        <div id="magnifier" class="magnifier">
            <canvas id="magnifierCanvas" class="magnifier-canvas" width="200" height="200"></canvas>
            <div class="magnifier-crosshair"></div>
        </div>
    </div>
    
    <div class="controls">
        <div class="control-group">
            <h4>视图控制</h4>
            <button class="zoom-in zoom-btn" onclick="zoomIn()">放大 +</button>
            <button class="zoom-out zoom-btn" onclick="zoomOut()">缩小 −</button>
            <button class="zoom-reset zoom-btn" onclick="resetZoom()">重置</button>
        </div>
        <div class="control-group">
            <h4>编辑操作</h4>
            <button class="auto-detect" onclick="autoDetectCorners()">🤖 自动检测角点</button>
            <button class="reset" onclick="resetPoints()">重置四角点</button>
            <button class="zoom-btn" onclick="showPreview()" style="background: linear-gradient(135deg, #f39c12, #e67e22); color: white;">裁剪预览</button>
            <button class="crop" onclick="cropImage()">确认裁剪并移至已处理</button>
        </div>
    </div>
    <div id="status"></div>
    
    <!-- 预览模态框 -->
    <div id="previewModal" class="preview-modal">
        <div class="preview-content">
            <span class="preview-close" onclick="closePreview()">&times;</span>
            <h3 class="preview-title">裁剪预览</h3>
            <div id="previewContainer">
                <div class="preview-loading">正在生成预览...</div>
            </div>
            <div class="preview-actions">
                <button class="preview-btn preview-btn-close" onclick="closePreview()">关闭预览</button>
                <button class="preview-btn preview-btn-crop" onclick="closePreview(); cropImage();">确认裁剪</button>
            </div>
        </div>
    </div>
    
    <script>
        {get_edit_page_javascript(filename)}
    </script>
    </body>
    </html>
    """


def generate_batch_process_html():
    """
    生成批量处理页面HTML模板
    """
    return """
    <html>
    <head>
    <title>批量处理</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .back-link { margin: 20px 0; }
        .info { background: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #ffeaa7; }
    </style>
    </head>
    <body>
    <div class="back-link">
        <a href="/">&larr; 返回首页</a>
    </div>
    <h2>批量处理</h2>
    
    <div class="info">
        <h3>提示</h3>
        <p>为了获得更好的裁剪效果，我们建议使用手动交互式处理方式。</p>
        <p>请从首页选择图片，逐一进行手动裁剪调整。</p>
    </div>
    </body>
    </html>
    """


def get_edit_page_styles():
    """
    获取编辑页面的CSS样式
    """
    return """
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        canvas { 
            border: 3px solid #ccc; 
            cursor: crosshair; 
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            background-color: white;
        }
        .controls { 
            margin: 20px 0; 
            text-align: center;
        }
        .control-group {
            display: inline-block;
            margin: 10px 20px;
            vertical-align: top;
        }
        .control-group h4 {
            margin: 0 0 10px 0;
            color: #2c3e50;
            font-size: 14px;
        }
        button { 
            padding: 12px 24px; 
            margin: 4px; 
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .zoom-btn {
            padding: 8px 16px;
            font-size: 14px;
            min-width: 60px;
        }
        .back-link { 
            margin: 20px 0; 
            font-size: 16px;
        }
        .back-link a {
            color: #3498db;
            text-decoration: none;
            font-weight: bold;
        }
        .back-link a:hover {
            color: #2980b9;
            text-decoration: underline;
        }
        .canvas-container { 
            position: relative;
            text-align: center; 
            margin: 20px 0; 
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .instructions { 
            background: linear-gradient(135deg, #f0f8ff, #e6f3ff); 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px; 
            border-left: 4px solid #3498db;
        }
        .instructions h3 {
            margin-top: 0;
            color: #2c3e50;
        }
        .instructions ul {
            margin: 10px 0;
        }
        .instructions li {
            margin: 8px 0;
            line-height: 1.5;
        }
        .auto-detect {
            background: linear-gradient(135deg, #9b59b6, #8e44ad);
            color: white;
        }
        .auto-detect:hover {
            background: linear-gradient(135deg, #8e44ad, #7d3c98);
            transform: translateY(-2px);
        }
        .reset { 
            background: linear-gradient(135deg, #e74c3c, #c0392b); 
            color: white;
        }
        .reset:hover { 
            background: linear-gradient(135deg, #c0392b, #a93226); 
            transform: translateY(-2px);
        }
        .crop { 
            background: linear-gradient(135deg, #27ae60, #229954); 
            color: white;
        }
        .crop:hover { 
            background: linear-gradient(135deg, #229954, #1e8449); 
            transform: translateY(-2px);
        }
        .zoom-in {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
        }
        .zoom-in:hover {
            background: linear-gradient(135deg, #2980b9, #1f618d);
            transform: translateY(-2px);
        }
        .zoom-out {
            background: linear-gradient(135deg, #9b59b6, #8e44ad);
            color: white;
        }
        .zoom-out:hover {
            background: linear-gradient(135deg, #8e44ad, #7d3c98);
            transform: translateY(-2px);
        }
        .zoom-reset {
            background: linear-gradient(135deg, #f39c12, #e67e22);
            color: white;
        }
        .zoom-reset:hover {
            background: linear-gradient(135deg, #e67e22, #d35400);
            transform: translateY(-2px);
        }
        #status {
            margin: 20px 0;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            font-weight: bold;
        }
        h2 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
        }
        .zoom-info {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 10;
        }
        /* 瞄准镜放大窗口 */
        .magnifier {
            position: absolute;
            width: 200px;
            height: 200px;
            border: 3px solid #ff0000;
            border-radius: 50%;
            background: white;
            display: none;
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
            overflow: hidden;
        }
        .magnifier-canvas {
            position: absolute;
            top: 0;
            left: 0;
        }
        .magnifier-crosshair {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            margin: -10px 0 0 -10px;
            border: 2px solid #ff0000;
            border-radius: 50%;
            background: rgba(255,0,0,0.1);
        }
        .magnifier-crosshair::before,
        .magnifier-crosshair::after {
            content: '';
            position: absolute;
            background: #ff0000;
        }
        .magnifier-crosshair::before {
            top: 50%;
            left: 8px;
            right: 8px;
            height: 1px;
            margin-top: -0.5px;
        }
        .magnifier-crosshair::after {
            left: 50%;
            top: 8px;
            bottom: 8px;
            width: 1px;
            margin-left: -0.5px;
        }
        
        /* 预览模态框样式 */
        .preview-modal {
            display: none;
            position: fixed;
            z-index: 2000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
            backdrop-filter: blur(5px);
        }
        
        .preview-content {
            position: relative;
            margin: 2% auto;
            padding: 20px;
            width: 90%;
            max-width: 1000px;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            text-align: center;
        }
        
        .preview-close {
            position: absolute;
            top: 10px;
            right: 20px;
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            z-index: 2001;
        }
        
        .preview-close:hover,
        .preview-close:focus {
            color: #000;
            text-decoration: none;
        }
        
        .preview-image {
            max-width: 100%;
            max-height: 70vh;
            border: 2px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .preview-title {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 24px;
        }
        
        .preview-actions {
            margin-top: 20px;
            display: flex;
            justify-content: center;
            gap: 15px;
        }
        
        .preview-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .preview-btn-close {
            background: linear-gradient(135deg, #95a5a6, #7f8c8d);
            color: white;
        }
        
        .preview-btn-close:hover {
            background: linear-gradient(135deg, #7f8c8d, #6c7b7d);
            transform: translateY(-2px);
        }
        
        .preview-btn-crop {
            background: linear-gradient(135deg, #27ae60, #229954);
            color: white;
        }
        
        .preview-btn-crop:hover {
            background: linear-gradient(135deg, #229954, #1e8449);
            transform: translateY(-2px);
        }
        
        .preview-loading {
            color: #3498db;
            font-size: 18px;
            margin: 40px 0;
        }
        
        .preview-error {
            color: #e74c3c;
            font-size: 16px;
            margin: 40px 0;
        }
    """


def get_edit_page_javascript(filename):
    """
    获取编辑页面的JavaScript代码
    """
    return f"""
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const magnifier = document.getElementById('magnifier');
        const magnifierCanvas = document.getElementById('magnifierCanvas');
        const magnifierCtx = magnifierCanvas.getContext('2d');
        const img = new Image();
        
        // 控制点类型
        const CORNER_POINT = 'corner';
        const EDGE_POINT = 'edge';
        
        // 初始化四角点（顺序：左上、右上、右下、左下）
        let cornerPoints = [];
        let edgePoints = [];  // 边的中点
        
        let isDragging = false;
        let dragIndex = -1;
        let dragType = null;
        let scale = 1;
        let baseScale = 1; // 基础缩放比例
        let zoomFactor = 1; // 用户缩放因子
        let offsetX = 0;
        let offsetY = 0;
        let baseOffsetX = 0; // 基础偏移
        let baseOffsetY = 0; // 基础偏移
        
        // 画布平移相关变量
        let isPanning = false;
        let panStartX = 0;
        let panStartY = 0;
        let panOffsetX = 0; // 用户拖拽产生的额外偏移
        let panOffsetY = 0;
        
        // 瞄准镜设置
        const magnifierSize = 200;
        const magnifierZoom = 4; // 放大倍数
        
        img.onload = function() {{
            console.log('图片加载成功:', img.width, 'x', img.height);
            if (img.width === 0 || img.height === 0) {{
                console.error('图片尺寸无效');
                alert('图片尺寸无效，无法处理');
                return;
            }}
            
            // 验证图片尺寸与服务器上的原始图片尺寸是否一致
            fetch('/image_info/{filename}')
                .then(response => response.json())
                .then(imageInfo => {{
                    console.log('服务器图片信息:', imageInfo);
                    console.log('前端图片尺寸:', img.width, 'x', img.height);
                    
                    if (img.width !== imageInfo.width || img.height !== imageInfo.height) {{
                        console.warn('前端图片尺寸与服务器不一致！可能影响坐标计算');
                        console.warn('前端:', img.width, 'x', img.height, '服务器:', imageInfo.width, 'x', imageInfo.height);
                    }}
                }})
                .catch(e => console.warn('无法获取图片信息:', e));
            
            // 计算基础缩放比例以适应画布
            const maxWidth = canvas.width - 40;
            const maxHeight = canvas.height - 40;
            baseScale = Math.min(maxWidth / img.width, maxHeight / img.height);
            console.log('计算的基础缩放比例:', baseScale);
            
            // 先初始化缩放和偏移，再设置角点
            zoomFactor = 1;
            updateScale();
            
            // 确保图片加载完成后立即绘制
            console.log('图片加载完成，开始绘制');
            draw();
            
            // 自动调用角点检测
            setTimeout(() => {{
                console.log('开始自动检测角点');
                autoDetectCorners();
            }}, 300);
            
            // 设置定时器确保绘制成功
            setTimeout(() => {{
                console.log('延时绘制1');
                draw();
            }}, 50);
            setTimeout(() => {{
                console.log('延时绘制2');
                draw();
            }}, 200);
        }};
        
        img.onerror = function(e) {{
            console.error('图片加载失败:', e);
            alert('图片加载失败，请检查文件格式');
        }};
        
        console.log('开始从API加载图片');
        
        // 初始显示加载中状态
        console.log('调用初始draw函数显示加载状态');
        draw();
        
        console.log('设置图片源开始加载');
        // 添加时间戳避免缓存问题，并确保文件名正确编码
        img.src = '/image/' + encodeURIComponent('{filename}') + '?' + new Date().getTime();
        
        // 添加一个备用的初始化检查，确保页面完全加载后再次尝试
        setTimeout(() => {{
            if (img.complete && img.naturalWidth > 0 && cornerPoints.length === 0) {{
                console.log('备用初始化检查：重新自动检测角点');
                zoomFactor = 1;
                updateScale();
                autoDetectCorners();
            }}
        }}, 1000);
        
        function updateScale() {{
            const oldScale = scale;
            const oldOffsetX = offsetX;
            const oldOffsetY = offsetY;
            
            scale = baseScale * zoomFactor;
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            
            // 计算基础偏移（图片在canvas中居中）
            baseOffsetX = (canvas.width - img.width * baseScale) / 2;
            baseOffsetY = (canvas.height - img.height * baseScale) / 2;
            
            // 当缩放时，图片应该以canvas中心为基准进行缩放
            // 而不是以图片的左上角为基准
            const canvasCenterX = canvas.width / 2;
            const canvasCenterY = canvas.height / 2;
            
            // 计算图片在基础缩放下的中心点
            const baseCenterX = baseOffsetX + (img.width * baseScale) / 2;
            const baseCenterY = baseOffsetY + (img.height * baseScale) / 2;
            
            // 缩放后的图片中心点应该保持在canvas中心
            offsetX = canvasCenterX - (img.width * scale) / 2 + panOffsetX;
            offsetY = canvasCenterY - (img.height * scale) / 2 + panOffsetY;
            
            document.getElementById('zoomLevel').textContent = Math.round(zoomFactor * 100) + '%';
            
            // 如果已有角点且缩放发生了变化，调整角点位置
            if (cornerPoints.length === 4 && oldScale !== 0 && oldScale !== scale) {{
                adjustPointsForScale(oldScale, oldOffsetX, oldOffsetY);
            }}
        }}
        
        function adjustPointsForScale(oldScale, oldOffsetX, oldOffsetY) {{
            // 将角点从旧的屏幕坐标转换为图片坐标，再转换为新的屏幕坐标
            for (let i = 0; i < cornerPoints.length; i++) {{
                // 转换为图片坐标（相对于图片左上角的坐标）
                const imgX = (cornerPoints[i][0] - oldOffsetX) / oldScale;
                const imgY = (cornerPoints[i][1] - oldOffsetY) / oldScale;
                
                // 转换为新的屏幕坐标
                cornerPoints[i][0] = imgX * scale + offsetX;
                cornerPoints[i][1] = imgY * scale + offsetY;
            }}
            
            console.log('调整角点位置完成 - 旧缩放:', oldScale, '新缩放:', scale);
            console.log('调整后的角点:', cornerPoints);
        }}
        
        function zoomIn() {{
            zoomAtCenter(zoomFactor * 1.25);
        }}
        
        function zoomOut() {{
            zoomAtCenter(zoomFactor / 1.25);
        }}
        
        function resetZoom() {{
            zoomFactor = 1;
            panOffsetX = 0;
            panOffsetY = 0;
            
            const oldScale = scale;
            const oldOffsetX = offsetX;
            const oldOffsetY = offsetY;
            
            updateScale();
            
            // 同步调整角点位置
            if (cornerPoints && cornerPoints.length === 4 && oldScale !== 0 && oldScale !== scale) {{
                adjustPointsForScale(oldScale, oldOffsetX, oldOffsetY);
            }}
            
            updateEdgePoints();
            draw();
        }}
        
        function resetPoints() {{
            if (!img.complete || img.width === 0 || img.height === 0) {{
                console.log('图片未加载，无法重置点位');
                return;
            }}
            
            // 确保有有效的缩放和偏移值
            if (scale <= 0 || isNaN(offsetX) || isNaN(offsetY)) {{
                console.log('缩放或偏移值无效，重新计算');
                updateScale();
            }}
            
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            
            console.log('重置角点 - 图片尺寸:', img.width, 'x', img.height, '缩放后:', scaledWidth, 'x', scaledHeight, '偏移:', offsetX, offsetY);
            
            cornerPoints = [
                [offsetX + scaledWidth * 0.1, offsetY + scaledHeight * 0.1],           // 左上
                [offsetX + scaledWidth * 0.9, offsetY + scaledHeight * 0.1],           // 右上
                [offsetX + scaledWidth * 0.9, offsetY + scaledHeight * 0.9],           // 右下
                [offsetX + scaledWidth * 0.1, offsetY + scaledHeight * 0.9]            // 左下
            ];
            
            updateEdgePoints();
            console.log('角点重置完成:', cornerPoints);
            draw();
        }}
        
        function autoDetectCorners() {{
            if (!img.complete || img.width === 0 || img.height === 0) {{
                alert('图片未加载完成，请稍后重试');
                return;
            }}
            
            // 显示检测中状态
            document.getElementById('status').innerHTML = '<p style="color: blue;">🤖 正在自动检测角点...</p>';
            
            fetch('/auto_detect/{filename}', {{
                method: 'POST',
                headers: {{
                    'Content-Type': 'application/json'
                }}
            }})
            .then(response => response.json())
            .then(data => {{
                if (data.success && data.corners) {{
                    console.log('自动检测成功:', data.corners, '置信度:', data.confidence);
                    
                    // 将检测到的角点坐标从原图坐标转换为画布坐标
                    const detectedCorners = data.corners.map(corner => {{
                        const canvasX = corner[0] * scale + offsetX;
                        const canvasY = corner[1] * scale + offsetY;
                        return [canvasX, canvasY];
                    }});
                    
                    // 更新角点
                    cornerPoints = detectedCorners;
                    updateEdgePoints();
                    draw();
                    
                    // 显示检测结果
                    const confidenceText = data.confidence > 0.7 ? '检测质量：优秀' :
                                          data.confidence > 0.5 ? '检测质量：良好' :
                                          data.confidence > 0.3 ? '检测质量：一般' : '检测质量：较差';
                    
                    const statusColor = data.confidence > 0.5 ? 'green' : 'orange';
                    
                    document.getElementById('status').innerHTML = 
                        `<p style="color: ${{statusColor}};">✓ 自动检测完成！${{confidenceText}}（置信度: ${{(data.confidence * 100).toFixed(1)}}%）<br>` +
                        `请检查角点位置，如需要可手动调整。</p>`;
                    
                    // 如果置信度较低，提示用户
                    if (data.confidence < 0.5) {{
                        setTimeout(() => {{
                            document.getElementById('status').innerHTML += 
                                '<p style="color: #f39c12; font-size: 14px;">💡 检测置信度较低，建议手动微调角点位置以获得更好效果</p>';
                        }}, 2000);
                    }}
                    
                }} else {{
                    console.error('自动检测失败:', data.error || '未知错误');
                    document.getElementById('status').innerHTML = 
                        '<p style="color: red;">✗ 自动检测失败：' + (data.error || '未知错误') + 
                        '<br>已使用默认角点，请手动调整。</p>';
                    
                    // 使用默认角点
                    resetPoints();
                }}
            }})
            .catch(error => {{
                console.error('自动检测请求失败:', error);
                document.getElementById('status').innerHTML = 
                    '<p style="color: red;">✗ 自动检测请求失败：' + error + 
                    '<br>已使用默认角点，请手动调整。</p>';
                
                // 使用默认角点
                resetPoints();
            }});
        }}
        
        function updateEdgePoints() {{
            // 计算四条边的中点
            edgePoints = [
                // 上边中点
                [(cornerPoints[0][0] + cornerPoints[1][0]) / 2, (cornerPoints[0][1] + cornerPoints[1][1]) / 2],
                // 右边中点
                [(cornerPoints[1][0] + cornerPoints[2][0]) / 2, (cornerPoints[1][1] + cornerPoints[2][1]) / 2],
                // 下边中点
                [(cornerPoints[2][0] + cornerPoints[3][0]) / 2, (cornerPoints[2][1] + cornerPoints[3][1]) / 2],
                // 左边中点
                [(cornerPoints[3][0] + cornerPoints[0][0]) / 2, (cornerPoints[3][1] + cornerPoints[0][1]) / 2]
            ];
        }}
        
        function updateMagnifier(mouseX, mouseY) {{
            if (!isDragging || dragType !== CORNER_POINT) {{
                magnifier.style.display = 'none';
                return;
            }}
            
            // 显示瞄准镜
            magnifier.style.display = 'block';
            
            // 瞄准镜位置（避免遮挡鼠标）
            let magnifierX = mouseX + 30;
            let magnifierY = mouseY - magnifierSize - 30;
            
            // 边界检查
            if (magnifierX + magnifierSize > window.innerWidth) {{
                magnifierX = mouseX - magnifierSize - 30;
            }}
            if (magnifierY < 0) {{
                magnifierY = mouseY + 30;
            }}
            
            magnifier.style.left = magnifierX + 'px';
            magnifier.style.top = magnifierY + 'px';
            
            // 清除瞄准镜画布
            magnifierCtx.clearRect(0, 0, magnifierSize, magnifierSize);
            
            // 计算在原图上的位置
            const rect = canvas.getBoundingClientRect();
            const canvasX = mouseX - rect.left;
            const canvasY = mouseY - rect.top;
            
            // 转换为图片坐标
            const imgX = (canvasX - offsetX) / scale;
            const imgY = (canvasY - offsetY) / scale;
            
            // 计算放大区域的范围
            const zoomRadius = magnifierSize / (2 * magnifierZoom);
            const sourceX = Math.max(0, imgX - zoomRadius);
            const sourceY = Math.max(0, imgY - zoomRadius);
            const sourceWidth = Math.min(img.width - sourceX, zoomRadius * 2);
            const sourceHeight = Math.min(img.height - sourceY, zoomRadius * 2);
            
            // 在瞄准镜中绘制放大的图片区域
            if (sourceWidth > 0 && sourceHeight > 0) {{
                // 创建临时画布来绘制原图的一部分
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = sourceWidth;
                tempCanvas.height = sourceHeight;
                
                // 绘制原图的对应区域到临时画布
                tempCtx.drawImage(
                    img,
                    sourceX, sourceY, sourceWidth, sourceHeight,
                    0, 0, sourceWidth, sourceHeight
                );
                
                // 将临时画布内容放大绘制到瞄准镜
                magnifierCtx.imageSmoothingEnabled = false; // 保持像素清晰
                magnifierCtx.drawImage(
                    tempCanvas,
                    0, 0, sourceWidth, sourceHeight,
                    0, 0, magnifierSize, magnifierSize
                );
            }}
            
            // 在瞄准镜中绘制当前拖拽的角点
            const pointImgX = (cornerPoints[dragIndex][0] - offsetX) / scale;
            const pointImgY = (cornerPoints[dragIndex][1] - offsetY) / scale;
            
            if (pointImgX >= sourceX && pointImgX <= sourceX + sourceWidth &&
                pointImgY >= sourceY && pointImgY <= sourceY + sourceHeight) {{
                const pointMagnifierX = ((pointImgX - sourceX) / sourceWidth) * magnifierSize;
                const pointMagnifierY = ((pointImgY - sourceY) / sourceHeight) * magnifierSize;
                
                magnifierCtx.fillStyle = '#ff0000';
                magnifierCtx.strokeStyle = '#ffffff';
                magnifierCtx.lineWidth = 2;
                magnifierCtx.beginPath();
                magnifierCtx.arc(pointMagnifierX, pointMagnifierY, 6, 0, 2 * Math.PI);
                magnifierCtx.fill();
                magnifierCtx.stroke();
                
                // 标注角点编号
                magnifierCtx.fillStyle = '#ffffff';
                magnifierCtx.font = 'bold 12px Arial';
                magnifierCtx.textAlign = 'center';
                magnifierCtx.fillText((dragIndex + 1).toString(), pointMagnifierX, pointMagnifierY + 4);
            }}
        }}
        
        function draw() {{
            console.log('draw函数被调用');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 更强制的图片检查
            console.log('检查图片状态 - complete:', img.complete, 'width:', img.width, 'height:', img.height, 'naturalWidth:', img.naturalWidth);
            
            if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {{
                console.log('图片未加载完成，显示加载提示');
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#999';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('图片加载中...', canvas.width / 2, canvas.height / 2);
                return;
            }}
            
            console.log('开始绘制图片，尺寸:', img.width, 'x', img.height, '缩放:', scale, '偏移:', offsetX, offsetY);
            
            // 确保有有效的缩放和偏移值
            if (scale <= 0 || isNaN(offsetX) || isNaN(offsetY)) {{
                console.log('缩放或偏移值无效，重新计算');
                updateScale();
            }}
            
            // 绘制图片
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            
            try {{
                ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
                console.log('图片绘制完成');
            }} catch (e) {{
                console.error('绘制图片时出错:', e);
                ctx.fillStyle = '#ffcccc';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#cc0000';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('图片显示出错', canvas.width / 2, canvas.height / 2);
                return;
            }}
            
            // 只有在有角点的情况下才绘制控制点
            if (cornerPoints && cornerPoints.length === 4) {{
                // 绘制四边形
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(cornerPoints[0][0], cornerPoints[0][1]);
                for (let i = 1; i < 4; i++) {{
                    ctx.lineTo(cornerPoints[i][0], cornerPoints[i][1]);
                }}
                ctx.closePath();
                ctx.stroke();
                
                // 绘制半透明填充，便于查看裁剪区域
                ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                ctx.beginPath();
                ctx.moveTo(cornerPoints[0][0], cornerPoints[0][1]);
                for (let i = 1; i < 4; i++) {{
                    ctx.lineTo(cornerPoints[i][0], cornerPoints[i][1]);
                }}
                ctx.closePath();
                ctx.fill();
                
                // 绘制角点（红色圆点，更大更明显）
                ctx.fillStyle = '#ff0000';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                for (let i = 0; i < 4; i++) {{
                    ctx.beginPath();
                    ctx.arc(cornerPoints[i][0], cornerPoints[i][1], 10, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                    
                    // 标注角点编号
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText((i + 1).toString(), cornerPoints[i][0], cornerPoints[i][1] + 5);
                    ctx.fillStyle = '#ff0000';
                }}
                
                // 绘制边的中点（蓝色菱形，更醒目）
                if (edgePoints && edgePoints.length === 4) {{
                    ctx.fillStyle = '#0066ff';
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    const edgeLabels = ['上', '右', '下', '左'];
                    for (let i = 0; i < 4; i++) {{
                        const x = edgePoints[i][0];
                        const y = edgePoints[i][1];
                        
                        // 绘制菱形
                        ctx.beginPath();
                        ctx.moveTo(x, y - 8);
                        ctx.lineTo(x + 8, y);
                        ctx.lineTo(x, y + 8);
                        ctx.lineTo(x - 8, y);
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                        
                        // 标注边点标签
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 12px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(edgeLabels[i], x, y + 4);
                        ctx.fillStyle = '#0066ff';
                    }}
                }}
            }}
            
            // 如果正在拖拽，显示辅助信息
            if (isDragging) {{
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(10, 10, 280, 80);
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px Arial';
                ctx.textAlign = 'left';
                if (dragType === CORNER_POINT) {{
                    ctx.fillText(`正在调整角点 ${{dragIndex + 1}}`, 15, 30);
                    ctx.fillText('拖动以移动角点位置', 15, 50);
                    ctx.fillText('右侧显示高倍放大镜辅助定位', 15, 70);
                }} else if (dragType === EDGE_POINT) {{
                    const edgeNames = ['上边', '右边', '下边', '左边'];
                    ctx.fillText(`正在调整${{edgeNames[dragIndex]}}`, 15, 30);
                    ctx.fillText('拖动以平行移动整条边', 15, 50);
                }}
            }} else if (isPanning) {{
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(10, 10, 200, 60);
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('正在平移画布', 15, 30);
                ctx.fillText('拖动以调整视图位置', 15, 50);
            }}
            
            // 检查是否有角点在画布外，显示提示
            let hasOutOfBoundsPoint = false;
            if (cornerPoints && cornerPoints.length === 4) {{
                for (let i = 0; i < 4; i++) {{
                    const x = cornerPoints[i][0];
                    const y = cornerPoints[i][1];
                    if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) {{
                        hasOutOfBoundsPoint = true;
                        break;
                    }}
                }}
            }}
            
            if (hasOutOfBoundsPoint && !isDragging && !isPanning) {{
                ctx.fillStyle = 'rgba(255, 165, 0, 0.9)';
                ctx.fillRect(10, canvas.height - 90, 300, 80);
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('⚠️ 部分角点在画布外', 15, canvas.height - 70);
                ctx.fillText('在空白区域拖拽可平移画布', 15, canvas.height - 50);
                ctx.fillText('使用鼠标滚轮可快速缩放', 15, canvas.height - 30);
            }} else if (!isDragging && !isPanning && cornerPoints && cornerPoints.length === 4) {{
                // 显示操作提示
                ctx.fillStyle = 'rgba(52, 152, 219, 0.8)';
                ctx.fillRect(10, canvas.height - 50, 280, 40);
                ctx.fillStyle = '#ffffff';
                ctx.font = '13px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('💡 提示：使用鼠标滚轮缩放 | 空白区域拖拽平移', 15, canvas.height - 25);
            }}
        }}
        
        canvas.addEventListener('mousedown', function(e) {{
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 检查是否点击了角点（优先级更高）
            for (let i = 0; i < 4; i++) {{
                const dx = x - cornerPoints[i][0];
                const dy = y - cornerPoints[i][1];
                if (Math.sqrt(dx*dx + dy*dy) < 15) {{
                    isDragging = true;
                    dragIndex = i;
                    dragType = CORNER_POINT;
                    canvas.style.cursor = 'move';
                    updateMagnifier(e.clientX, e.clientY);
                    return;
                }}
            }}
            
            // 检查是否点击了边的中点（增大检测范围）
            for (let i = 0; i < 4; i++) {{
                const dx = x - edgePoints[i][0];
                const dy = y - edgePoints[i][1];
                if (Math.sqrt(dx*dx + dy*dy) < 15) {{
                    isDragging = true;
                    dragIndex = i;
                    dragType = EDGE_POINT;
                    canvas.style.cursor = 'grab';
                    return;
                }}
            }}
            
            // 如果没有点击控制点，开始画布平移
            isPanning = true;
            panStartX = x;
            panStartY = y;
            canvas.style.cursor = 'grabbing';
        }});
        
        canvas.addEventListener('mousemove', function(e) {{
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (!isDragging && !isPanning) {{
                // 更新鼠标指针样式
                let overControl = false;
                
                // 检查是否悬停在角点上
                for (let i = 0; i < 4; i++) {{
                    const dx = x - cornerPoints[i][0];
                    const dy = y - cornerPoints[i][1];
                    if (Math.sqrt(dx*dx + dy*dy) < 15) {{
                        canvas.style.cursor = 'move';
                        overControl = true;
                        break;
                    }}
                }}
                
                // 检查是否悬停在边控制点上
                if (!overControl) {{
                    for (let i = 0; i < 4; i++) {{
                        const dx = x - edgePoints[i][0];
                        const dy = y - edgePoints[i][1];
                        if (Math.sqrt(dx*dx + dy*dy) < 15) {{
                            canvas.style.cursor = 'grab';
                            overControl = true;
                            break;
                        }}
                    }}
                }}
                
                if (!overControl) {{
                    canvas.style.cursor = 'crosshair';
                }}
                return;
            }}
            
            // 处理画布平移
            if (isPanning) {{
                const deltaX = x - panStartX;
                const deltaY = y - panStartY;
                
                // 直接更新平移偏移量
                panOffsetX += deltaX;
                panOffsetY += deltaY;
                
                // 更新图片显示位置和所有控制点
                updateScale();
                
                // 角点会随图片一起移动，需要同步更新
                if (cornerPoints && cornerPoints.length === 4) {{
                    for (let i = 0; i < cornerPoints.length; i++) {{
                        cornerPoints[i][0] += deltaX;
                        cornerPoints[i][1] += deltaY;
                    }}
                }}
                
                panStartX = x;
                panStartY = y;
                
                // 更新边点并重绘
                updateEdgePoints();
                draw();
                return;
            }}
            
            // 更新瞄准镜
            if (dragType === CORNER_POINT) {{
                updateMagnifier(e.clientX, e.clientY);
            }}
            
            if (dragType === CORNER_POINT) {{
                // 移动角点
                cornerPoints[dragIndex] = [x, y];
                updateEdgePoints();
            }} else if (dragType === EDGE_POINT) {{
                // 移动边的中点（平行于边）
                moveEdgePoint(dragIndex, x, y);
            }}
            
            draw();
        }});
        
        canvas.addEventListener('mouseup', function() {{
            if (isDragging) {{
                isDragging = false;
                dragIndex = -1;
                dragType = null;
                canvas.style.cursor = 'crosshair';
                magnifier.style.display = 'none';
            }}
            if (isPanning) {{
                isPanning = false;
                canvas.style.cursor = 'crosshair';
            }}
        }});
        
        // 全局鼠标事件，确保瞄准镜能正确隐藏
        document.addEventListener('mouseup', function() {{
            if (isDragging) {{
                isDragging = false;
                dragIndex = -1;
                dragType = null;
                canvas.style.cursor = 'crosshair';
                magnifier.style.display = 'none';
            }}
            if (isPanning) {{
                isPanning = false;
                canvas.style.cursor = 'crosshair';
            }}
        }});
        
        // 鼠标滚轮缩放支持
        canvas.addEventListener('wheel', function(e) {{
            e.preventDefault(); // 防止页面滚动
            
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // 保存当前缩放状态
            const oldScale = scale;
            const oldOffsetX = offsetX;
            const oldOffsetY = offsetY;
            const oldZoomFactor = zoomFactor;
            
            // 计算缩放方向和幅度（修正方向：向下滚动放大，向上滚动缩小）
            const delta = e.deltaY < 0 ? 1 : -1; // 修正：deltaY < 0 表示向上滚动（缩小），deltaY > 0 表示向下滚动（放大）
            const zoomStep = 1.3; // 增加缩放步长，提供更明显的缩放效果
            const newZoomFactor = delta > 0 ? 
                Math.min(oldZoomFactor * zoomStep, 5) : 
                Math.max(oldZoomFactor / zoomStep, 0.2);
            
            // 如果缩放没有变化，直接返回
            if (newZoomFactor === oldZoomFactor) {{
                return;
            }}
            
            // 计算鼠标在原图上的位置（相对于图片左上角）
            const imgMouseX = (mouseX - oldOffsetX) / oldScale;
            const imgMouseY = (mouseY - oldOffsetY) / oldScale;
            
            // 更新缩放因子和缩放值
            zoomFactor = newZoomFactor;
            scale = baseScale * zoomFactor;
            
            // 计算新的图片尺寸
            const newScaledWidth = img.width * scale;
            const newScaledHeight = img.height * scale;
            
            // 计算鼠标在新缩放下的图片坐标
            const newImageMouseX = imgMouseX * scale;
            const newImageMouseY = imgMouseY * scale;
            
            // 计算新的偏移，保持鼠标位置在图片上的相对位置不变
            const newOffsetX = mouseX - newImageMouseX;
            const newOffsetY = mouseY - newImageMouseY;
            
            // 计算基础居中偏移
            const baseCenterOffsetX = (canvas.width - newScaledWidth) / 2;
            const baseCenterOffsetY = (canvas.height - newScaledHeight) / 2;
            
            // 更新panOffset，这是相对于居中位置的额外偏移
            panOffsetX = newOffsetX - baseCenterOffsetX;
            panOffsetY = newOffsetY - baseCenterOffsetY;
            
            // 更新所有坐标系统
            updateScale();
            
            // 同步调整角点位置
            if (cornerPoints && cornerPoints.length === 4 && oldScale !== scale) {{
                adjustPointsForScale(oldScale, oldOffsetX, oldOffsetY);
            }}
            
            updateEdgePoints();
            draw();
        }});
        
        // 改进的缩放功能：以canvas中心为基准
        function zoomAtCenter(newZoomFactor) {{
            if (newZoomFactor < 0.2 || newZoomFactor > 5) {{
                return; // 限制缩放范围
            }}
            
            const oldScale = scale;
            const oldOffsetX = offsetX;
            const oldOffsetY = offsetY;
            
            zoomFactor = newZoomFactor;
            updateScale();
            
            // 同步调整角点位置
            if (cornerPoints && cornerPoints.length === 4 && oldScale !== 0 && oldScale !== scale) {{
                adjustPointsForScale(oldScale, oldOffsetX, oldOffsetY);
            }}
            
            updateEdgePoints();
            draw();
        }}
        
        function moveEdgePoint(edgeIndex, newX, newY) {{
            // 改进的边移动逻辑：真正沿着边的方向平行移动
            switch(edgeIndex) {{
                case 0: // 上边：沿着上边方向平行移动
                    {{
                        const edge = [cornerPoints[1][0] - cornerPoints[0][0], cornerPoints[1][1] - cornerPoints[0][1]];
                        const edgeLength = Math.sqrt(edge[0] * edge[0] + edge[1] * edge[1]);
                        const edgeNormal = [-edge[1] / edgeLength, edge[0] / edgeLength]; // 垂直向量
                        
                        // 计算当前中点到新位置的向量
                        const currentMid = edgePoints[0];
                        const offset = [(newX - currentMid[0]), (newY - currentMid[1])];
                        
                        // 投影到法向量上，得到沿边垂直方向的偏移
                        const normalOffset = offset[0] * edgeNormal[0] + offset[1] * edgeNormal[1];
                        
                        // 移动整条边
                        cornerPoints[0][0] += normalOffset * edgeNormal[0];
                        cornerPoints[0][1] += normalOffset * edgeNormal[1];
                        cornerPoints[1][0] += normalOffset * edgeNormal[0];
                        cornerPoints[1][1] += normalOffset * edgeNormal[1];
                    }}
                    break;
                    
                case 1: // 右边：沿着右边方向平行移动
                    {{
                        const edge = [cornerPoints[2][0] - cornerPoints[1][0], cornerPoints[2][1] - cornerPoints[1][1]];
                        const edgeLength = Math.sqrt(edge[0] * edge[0] + edge[1] * edge[1]);
                        const edgeNormal = [-edge[1] / edgeLength, edge[0] / edgeLength];
                        
                        const currentMid = edgePoints[1];
                        const offset = [(newX - currentMid[0]), (newY - currentMid[1])];
                        const normalOffset = offset[0] * edgeNormal[0] + offset[1] * edgeNormal[1];
                        
                        cornerPoints[1][0] += normalOffset * edgeNormal[0];
                        cornerPoints[1][1] += normalOffset * edgeNormal[1];
                        cornerPoints[2][0] += normalOffset * edgeNormal[0];
                        cornerPoints[2][1] += normalOffset * edgeNormal[1];
                    }}
                    break;
                    
                case 2: // 下边：沿着下边方向平行移动
                    {{
                        const edge = [cornerPoints[3][0] - cornerPoints[2][0], cornerPoints[3][1] - cornerPoints[2][1]];
                        const edgeLength = Math.sqrt(edge[0] * edge[0] + edge[1] * edge[1]);
                        const edgeNormal = [-edge[1] / edgeLength, edge[0] / edgeLength];
                        
                        const currentMid = edgePoints[2];
                        const offset = [(newX - currentMid[0]), (newY - currentMid[1])];
                        const normalOffset = offset[0] * edgeNormal[0] + offset[1] * edgeNormal[1];
                        
                        cornerPoints[2][0] += normalOffset * edgeNormal[0];
                        cornerPoints[2][1] += normalOffset * edgeNormal[1];
                        cornerPoints[3][0] += normalOffset * edgeNormal[0];
                        cornerPoints[3][1] += normalOffset * edgeNormal[1];
                    }}
                    break;
                    
                case 3: // 左边：沿着左边方向平行移动
                    {{
                        const edge = [cornerPoints[0][0] - cornerPoints[3][0], cornerPoints[0][1] - cornerPoints[3][1]];
                        const edgeLength = Math.sqrt(edge[0] * edge[0] + edge[1] * edge[1]);
                        const edgeNormal = [-edge[1] / edgeLength, edge[0] / edgeLength];
                        
                        const currentMid = edgePoints[3];
                        const offset = [(newX - currentMid[0]), (newY - currentMid[1])];
                        const normalOffset = offset[0] * edgeNormal[0] + offset[1] * edgeNormal[1];
                        
                        cornerPoints[3][0] += normalOffset * edgeNormal[0];
                        cornerPoints[3][1] += normalOffset * edgeNormal[1];
                        cornerPoints[0][0] += normalOffset * edgeNormal[0];
                        cornerPoints[0][1] += normalOffset * edgeNormal[1];
                    }}
                    break;
            }}
            
            updateEdgePoints();
        }}
        
        function showPreview() {{
            if (!cornerPoints || cornerPoints.length !== 4) {{
                alert('请先设置四个角点');
                return;
            }}
            
            // 显示预览模态框
            const modal = document.getElementById('previewModal');
            const container = document.getElementById('previewContainer');
            
            modal.style.display = 'block';
            container.innerHTML = '<div class="preview-loading">正在生成预览...</div>';
            
            // 转换坐标到原始图片坐标系
            const originalPoints = cornerPoints.map((p, index) => {{
                const imgX = (p[0] - offsetX) / scale;
                const imgY = (p[1] - offsetY) / scale;
                
                // 确保坐标在有效范围内
                const clampedX = Math.max(0, Math.min(img.width, imgX));
                const clampedY = Math.max(0, Math.min(img.height, imgY));
                
                return [clampedX, clampedY];
            }});
            
            console.log('生成预览，角点坐标:', originalPoints);
            
            // 请求预览图片
            fetch('/preview/{filename}', {{
                method: 'POST',
                headers: {{
                    'Content-Type': 'application/json'
                }},
                body: JSON.stringify({{points: originalPoints}})
            }})
            .then(response => {{
                if (!response.ok) {{
                    throw new Error(`HTTP error! status: ${{response.status}}`);
                }}
                return response.blob();
            }})
            .then(blob => {{
                const imageUrl = URL.createObjectURL(blob);
                container.innerHTML = `
                    <img src="${{imageUrl}}" alt="裁剪预览" class="preview-image" onload="URL.revokeObjectURL(this.src)">
                    <p style="color: #7f8c8d; margin-top: 15px; font-size: 14px;">这是根据当前角点位置生成的裁剪预览效果</p>
                `;
            }})
            .catch(error => {{
                console.error('预览生成失败:', error);
                container.innerHTML = `
                    <div class="preview-error">预览生成失败：${{error.message}}</div>
                    <p style="color: #7f8c8d; margin-top: 10px;">请检查角点位置是否正确</p>
                `;
            }});
        }}
        
        function closePreview() {{
            const modal = document.getElementById('previewModal');
            modal.style.display = 'none';
        }}
        
        // 点击模态框外部关闭预览
        window.onclick = function(event) {{
            const modal = document.getElementById('previewModal');
            if (event.target === modal) {{
                closePreview();
            }}
        }}
        
        // ESC键关闭预览
        document.addEventListener('keydown', function(event) {{
            if (event.key === 'Escape') {{
                closePreview();
            }}
        }});
        
        function cropImage() {{
            if (!cornerPoints || cornerPoints.length !== 4) {{
                alert('请先设置四个角点');
                return;
            }}
            
            // 转换回原始图片坐标
            // 这里需要考虑所有的缩放和偏移因素
            const originalPoints = cornerPoints.map((p, index) => {{
                // 从屏幕坐标转换为图片坐标
                const imgX = (p[0] - offsetX) / scale;
                const imgY = (p[1] - offsetY) / scale;
                
                console.log(`角点${{index + 1}} 转换: 屏幕坐标(${{p[0].toFixed(1)}}, ${{p[1].toFixed(1)}}) -> 图片坐标(${{imgX.toFixed(1)}}, ${{imgY.toFixed(1)}})`);
                
                // 确保坐标在有效范围内
                const clampedX = Math.max(0, Math.min(img.width, imgX));
                const clampedY = Math.max(0, Math.min(img.height, imgY));
                
                if (clampedX !== imgX || clampedY !== imgY) {{
                    console.warn(`角点${{index + 1}} 坐标被截断: (${{imgX.toFixed(1)}}, ${{imgY.toFixed(1)}}) -> (${{clampedX.toFixed(1)}}, ${{clampedY.toFixed(1)}})`);
                }}
                
                return [clampedX, clampedY];
            }});
            
            console.log('转换后的原始图片坐标:', originalPoints);
            console.log('当前缩放参数 - scale:', scale, 'offsetX:', offsetX, 'offsetY:', offsetY);
            console.log('图片尺寸 - width:', img.width, 'height:', img.height);
            
            // 验证转换后的坐标是否合理
            const allPointsValid = originalPoints.every(p => 
                p[0] >= 0 && p[0] <= img.width && p[1] >= 0 && p[1] <= img.height
            );
            
            if (!allPointsValid) {{
                console.error('部分角点坐标超出图片范围');
                alert('部分角点位置无效，请重新调整角点位置');
                return;
            }}
            
            // 显示处理中状态
            document.getElementById('status').innerHTML = '<p style="color: blue;">正在处理...</p>';
            
            fetch('/crop/{filename}', {{
                method: 'POST',
                headers: {{
                    'Content-Type': 'application/json'
                }},
                body: JSON.stringify({{points: originalPoints}})
            }})
            .then(response => response.json())
            .then(data => {{
                if (data.success) {{
                    document.getElementById('status').innerHTML = 
                        '<p style="color: green;">✓ 裁剪完成并已移至processed文件夹！<br><a href="/download/' + data.filename + '">下载处理结果</a><br><a href="/">返回首页</a></p>';
                }} else {{
                    document.getElementById('status').innerHTML = 
                        '<p style="color: red;">✗ 裁剪失败：' + data.error + '</p>';
                }}
            }})
            .catch(error => {{
                document.getElementById('status').innerHTML = 
                    '<p style="color: red;">✗ 网络错误：' + error + '</p>';
            }});
        }}
    """
