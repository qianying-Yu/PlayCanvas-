# 如何在开发中使用 PlayCanvas
- 介绍一下我在开发中使用 PlayCanvas 嵌入进页面的经验，上线网站 [iQOO 15 Ultra](https://www.vivo.com.cn/vivo/iqoo15ultra/) 等机型。

## 开发流程

### 一、如何在 PlayCanvas 进行开发

#### 1. 项目规划与团队协作

在开始 PlayCanvas 开发前，明确项目需求至关重要。对于需要复杂3D模型的商业项目（如手机展示页面），通常需要跨部门协作：

- **产品/设计团队**：提供交互原型和视觉设计规范
- **3D美术团队**：负责建模、UV展开、材质制作和基础动画
- **前端开发团队**：负责场景搭建、交互逻辑和页面集成

建议在项目初期建立清晰的资产交付规范，包括模型格式（推荐glTF 2.0）、纹理尺寸限制、多边形数量预算等。

#### 2. 3D资产准备与导入

PlayCanvas 支持多种3D格式，但为了获得最佳性能和兼容性，建议：

1. **模型优化**：
   - 使用Blender、Maya或3ds Max进行建模
   - 确保模型面数合理（移动端建议5万面以内）
   - 合并相同材质的网格以减少draw call

2. **材质与纹理**：
   - 创建PBR（物理渲染）材质工作流
   - 纹理尺寸遵循2的幂次方（512×512, 1024×1024等）
   - 使用压缩纹理格式（如KTX2）减少加载时间

3. **导入到PlayCanvas**：
   - 通过编辑器拖拽上传或使用CLI工具批量导入
   - 检查导入后的材质映射是否正确
   - 调整模型比例和初始位置

#### 3 场景搭建与相机设置

在PlayCanvas编辑器中搭建场景时，注意以下要点：

- **层级结构**：合理组织Entity层级，便于脚本控制和动画管理
- **相机配置**：
  ```javascript
  // 示例：相机初始化脚本
  var CameraController = pc.createScript('cameraController');
  
  CameraController.prototype.initialize = function() {
      // 设置相机初始位置和旋转
      this.entity.setLocalPosition(0, 2, 5);
      this.entity.setLocalEulerAngles(-15, 0, 0);
      
      // 配置相机参数
      this.entity.camera.nearClip = 0.1;
      this.entity.camera.farClip = 1000;
      this.entity.camera.fov = 60;
  };
  ```

- **光照设置**：
  - 使用HDR环境贴图实现真实光照
  - 合理布置方向光、点光源和聚光灯
  - 启用阴影并根据性能需求调整阴影质量

#### 4. 脚本开发与事件绑定

PlayCanvas使用基于Entity-Component-System的架构，脚本开发流程如下：

1. **创建脚本文件**：
   - 在编辑器的"Assets"面板中右键创建JavaScript文件
   - 或通过本地开发后上传

2. **脚本结构示例**：
   ```javascript
   // PhoneModelController.js - 手机模型控制器
   var PhoneModelController = pc.createScript('phoneModelController');
   
   // 定义脚本属性（可在编辑器内调整）
   PhoneModelController.attributes.add('rotationSpeed', {
       type: 'number',
       default: 1.0,
       title: 'Rotation Speed',
       description: '模型旋转速度系数'
   });
   
   PhoneModelController.attributes.add('autoRotate', {
       type: 'boolean',
       default: true,
       title: 'Auto Rotate',
       description: '是否自动旋转'
   });
   
   // 初始化
   PhoneModelController.prototype.initialize = function() {
       this.rotationAngle = 0;
       this.isDragging = false;
       this.lastMouseX = 0;
       
       // 绑定鼠标事件
       this.app.mouse.on('mousedown', this.onMouseDown, this);
       this.app.mouse.on('mousemove', this.onMouseMove, this);
       this.app.mouse.on('mouseup', this.onMouseUp, this);
       
       // 绑定触摸事件（移动端）
       if (this.app.touch) {
           this.app.touch.on('touchstart', this.onTouchStart, this);
       }
   };
   
   // 更新循环
   PhoneModelController.prototype.update = function(dt) {
       if (this.autoRotate && !this.isDragging) {
           this.rotationAngle += dt * this.rotationSpeed;
           this.entity.setLocalEulerAngles(0, this.rotationAngle, 0);
       }
   };
   
   // 鼠标事件处理
   PhoneModelController.prototype.onMouseDown = function(event) {
       this.isDragging = true;
       this.lastMouseX = event.x;
   };
   
   PhoneModelController.prototype.onMouseMove = function(event) {
       if (!this.isDragging) return;
       
       var deltaX = event.x - this.lastMouseX;
       this.entity.rotateLocal(0, -deltaX * 0.5, 0);
       this.lastMouseX = event.x;
   };
   
   PhoneModelController.prototype.onMouseUp = function(event) {
       this.isDragging = false;
   };
   
   // 公开方法供其他脚本调用
   PhoneModelController.prototype.resetRotation = function() {
       this.entity.setLocalEulerAngles(0, 0, 0);
       this.rotationAngle = 0;
   };
   ```

3. **事件绑定流程**：
   - 在编辑器中选中目标Entity
   - 在"Inspector"面板点击"Add Component" → "Script"
   - 选择已上传的脚本文件
   - 调整脚本属性参数
   - 绑定自定义事件（如点击、悬停等）

#### 5. 动画系统使用

PlayCanvas提供强大的动画系统，支持两种主要方式：

1. **关键帧动画**（通过编辑器制作）：
   - 创建动画资产
   - 在时间轴上添加关键帧
   - 绑定到Entity的变换或材质属性

2. **程序化动画**（通过脚本控制）：
   ```javascript
   // 模型入场动画示例
   PhoneModelController.prototype.playEntranceAnimation = function() {
       // 初始状态：缩小并透明
       this.entity.setLocalScale(0.5, 0.5, 0.5);
       
       // 创建补间动画
       this.entity.tween(this.entity.getLocalScale())
           .to(new pc.Vec3(1, 1, 1), 1.0, pc.SineOut)
           .on('update', function(scale) {
               this.entity.setLocalScale(scale);
           }.bind(this))
           .start();
   };
   ```

#### 6. 性能优化技巧

1. **渲染优化**：
   - 使用实例化渲染重复物体
   - 启用Frustum Culling（视锥剔除）
   - 合理设置LOD（多层次细节）

2. **加载优化**：
   - 使用Bundle系统分包加载
   - 实现渐进式加载（先显示低模，后加载高模）
   - 压缩纹理和几何数据

3. **内存管理**：
   - 及时销毁不再使用的Entity
   - 复用材质和纹理
   - 监控WebGL内存使用

### 二、嵌入到网页的集成方案

#### 1. 基础嵌入方法

PlayCanvas提供多种嵌入方式，最常用的是iframe嵌入和脚本直接嵌入：

```html
<!-- 方法1：iframe嵌入（简单但功能受限） -->
<iframe 
    src="https://playcanv.as/p/YOUR_PROJECT/" 
    width="100%" 
    height="600" 
    frameborder="0" 
    scrolling="no"
></iframe>

<!-- 方法2：脚本嵌入（推荐，完全控制） -->
<div id="playcanvas-container" style="width: 100%; height: 600px;"></div>

<script src="https://code.playcanvas.com/playcanvas-stable.min.js"></script>
<script>
    // 配置选项
    var canvas = document.getElementById('playcanvas-container');
    
    var options = {
        element: canvas,
        config: {
            graphicsDeviceOptions: {
                alpha: true,          // 透明背景
                antialias: true,      // 抗锯齿
                powerPreference: 'high-performance'
            },
            loadingScreen: {
                enabled: false        // 禁用默认加载界面
            }
        }
    };
    
    // 创建应用实例
    var app = new pc.Application(canvas, options);
    
    // 配置资源路径
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    
    // 加载并启动项目
    app.configure('config.json', function() {
        app.preload(function() {
            app.start();
            
            // 自定义加载完成回调
            console.log('PlayCanvas应用已启动');
            
            // 与页面其他部分交互
            document.dispatchEvent(new CustomEvent('playcanvas-ready'));
        });
    });
</script>
```

#### 2. 与页面通信

实现PlayCanvas场景与宿主页面的双向通信：

```javascript
// 在PlayCanvas脚本中
PhoneModelController.prototype.setupCommunication = function() {
    // 监听来自页面的消息
    window.addEventListener('message', function(event) {
        if (event.data.type === 'changeColor') {
            this.changeModelColor(event.data.color);
        }
        if (event.data.type === 'resetView') {
            this.resetCamera();
        }
    }.bind(this));
    
    // 向页面发送消息
    this.sendToPage = function(data) {
        window.parent.postMessage(data, '*');
    };
};

// 在页面JavaScript中
function changeModelColor(color) {
    var iframe = document.querySelector('iframe');
    iframe.contentWindow.postMessage({
        type: 'changeColor',
        color: color
    }, '*');
}

// 监听来自PlayCanvas的消息
window.addEventListener('message', function(event) {
    if (event.data.type === 'modelClicked') {
        showProductDetails(event.data.productId);
    }
});
```

#### 3. 响应式设计适配

确保PlayCanvas场景在不同设备上正常显示：

```javascript
// 响应式适配脚本
var ResponsiveAdapter = pc.createScript('responsiveAdapter');

ResponsiveAdapter.prototype.initialize = function() {
    this.updateViewport();
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.updateViewport.bind(this));
    
    // 监听设备方向变化（移动端）
    window.addEventListener('orientationchange', this.updateViewport.bind(this));
};

ResponsiveAdapter.prototype.updateViewport = function() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    
    // 更新canvas尺寸
    this.app.graphicsDevice.canvas.width = width;
    this.app.graphicsDevice.canvas.height = height;
    
    // 更新相机纵横比
    var camera = this.app.root.findByName('MainCamera');
    if (camera && camera.camera) {
        camera.camera.aspectRatio = width / height;
        camera.camera.projectionMatrix = null; // 触发重新计算
    }
    
    // 根据屏幕尺寸调整UI
    this.adjustUIForScreenSize(width, height);
};
```

#### 4. 性能监控与调试

```javascript
// 性能监控脚本
var PerformanceMonitor = pc.createScript('performanceMonitor');

PerformanceMonitor.prototype.postInitialize = function() {
    // 创建性能显示面板
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb
    document.body.appendChild(this.stats.dom);
    
    // 监控帧率
    this.fpsHistory = [];
    this.maxHistoryLength = 60;
};

PerformanceMonitor.prototype.update = function(dt) {
    this.stats.begin();
    
    // 记录帧率
    var fps = Math.round(1 / dt);
    this.fpsHistory.push(fps);
    
    if (this.fpsHistory.length > this.maxHistoryLength) {
        this.fpsHistory.shift();
    }
    
    // 低帧率警告
    if (fps < 30 && this.app.time > 5000) {
        console.warn('低帧率警告：' + fps + ' FPS');
        this.triggerPerformanceWarning();
    }
    
    this.stats.end();
};

// 在控制台输出性能摘要
PerformanceMonitor.prototype.logPerformanceSummary = function() {
    var avgFps = this.fpsHistory.reduce(function(a, b) { return a + b; }, 0) / this.fpsHistory.length;
    console.log('性能摘要：');
    console.log('- 平均FPS：' + avgFps.toFixed(1));
    console.log('- 绘制调用：' + this.app.drawCalls);
    console.log('- 三角形数量：' + this.app.triangles);
};
```

### 三、实际项目经验分享（iQOO 15 Ultra案例）

#### 1. 项目需求分析

iQOO 15 Ultra产品展示页需要实现：
- 360度可交互手机模型展示
- 材质切换（不同颜色版本）
- 部件拆解动画
- 性能参数可视化对比
- 移动端触控优化

#### 2. 技术方案选型

经过评估，我们选择PlayCanvas因为：
- **WebGL 2.0支持**：更好的图形性能
- **编辑器协作**：美术和开发可以并行工作
- **发布流程简单**：一键部署到PlayCanvas服务器或自托管
- **社区活跃**：遇到问题容易找到解决方案

#### 3. 开发中的挑战与解决方案

**挑战1：高精度模型性能问题**
- **问题**：原始模型面数过高（20万+），在移动端卡顿
- **解决方案**：
  1. 制作3个LOD级别（高：10万面，中：5万面，低：1万面）
  2. 根据相机距离自动切换LOD
  3. 使用压缩纹理减少内存占用

**挑战2：触控交互不流畅**
- **问题**：移动端旋转模型时有延迟和卡顿
- **解决方案**：
  1. 实现触摸事件防抖和节流
  2. 使用惯性旋转效果
  3. 针对低端设备降低渲染质量

**挑战3：加载时间过长**
- **问题**：首次加载需要下载10MB+资源
- **解决方案**：
  1. 实现渐进式加载（先显示占位图）
  2. 使用HTTP/2服务器推送
  3. 配置CDN加速资源加载

#### 4. 优化成果

经过优化后：
- 页面加载时间从8s减少到2.5s
- 移动端帧率稳定在50-60 FPS
- 内存占用减少40%
- 用户交互满意度提升35%

### 四、最佳实践总结

1. **开发流程标准化**
   - 建立统一的资产命名规范
   - 使用Git进行版本控制（包括PlayCanvas项目）
   - 编写自动化测试脚本

2. **性能优先原则**
   - 始终在目标设备上测试性能
   - 使用PlayCanvas的性能分析工具
   - 定期进行代码和资产优化

3. **用户体验考虑**
   - 提供清晰的加载状态提示
   - 实现平滑的过渡动画
   - 确保无障碍访问支持

4. **团队协作建议**
   - 定期同步美术和开发进度
   - 建立资产审核流程
   - 使用PlayCanvas的评论和标注功能

通过遵循这些开发流程和最佳实践，你可以高效地在PlayCanvas中开发高质量的3D Web应用，并顺利集成到现有网站中。
