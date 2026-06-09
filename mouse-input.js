
var MouseInput = pc.createScript('mouseInput');

MouseInput.attributes.add('orbitSensitivity', {
    type: 'number',
    default: 0.3,
    title: 'Orbit Sensitivity',
    description: 'How fast the camera moves around the orbit. Higher is faster'
});

MouseInput.attributes.add('distanceSensitivity', {
    type: 'number',
    default: 0.15,
    title: 'Distance Sensitivity',
    description: 'How fast the camera moves in and out. Higher is faster'
});

// 初始化
MouseInput.prototype.initialize = function () {
    this.orbitCamera = this.entity.script.orbitCamera;

    if (this.orbitCamera) {
        const self = this;

        // ✅ PlayCanvas v2.x 鼠标事件对象封装更严格，不推荐直接 window.addEventListener
        this._onMouseOut = (e) => self.onMouseOut(e);

        this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
        this.app.mouse.on(pc.EVENT_MOUSEUP, this.onMouseUp, this);
        this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
        // this.app.mouse.on(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);

        // ✅ 用 document 替代 window 更安全（v2.12.4 推荐）
        document.addEventListener('mouseout', this._onMouseOut, false);

        // 监听销毁
        this.on('destroy', () => {
            this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
            this.app.mouse.off(pc.EVENT_MOUSEUP, this.onMouseUp, this);
            this.app.mouse.off(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
            // this.app.mouse.off(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);

            document.removeEventListener('mouseout', this._onMouseOut, false);
        });
    }

    // 禁用右键菜单
    this.app.mouse.disableContextMenu();

    this.lookButtonDown = false;
    this.panButtonDown = false;
    this.lastPoint = new pc.Vec2();
};

// 静态变量
MouseInput.fromWorldPoint = new pc.Vec3();
MouseInput.toWorldPoint = new pc.Vec3();
MouseInput.worldDiff = new pc.Vec3();

// 平移逻辑
MouseInput.prototype.pan = function (screenPoint) {
    const fromWorldPoint = MouseInput.fromWorldPoint;
    const toWorldPoint = MouseInput.toWorldPoint;
    const worldDiff = MouseInput.worldDiff;

    const camera = this.entity.camera;
    const distance = this.orbitCamera.distance;

    // v2.12.4 的 screenToWorld 保持兼容
    camera.screenToWorld(screenPoint.x, screenPoint.y, distance, fromWorldPoint);
    camera.screenToWorld(this.lastPoint.x, this.lastPoint.y, distance, toWorldPoint);

    worldDiff.sub2(toWorldPoint, fromWorldPoint);
    this.orbitCamera.pivotPoint.add(worldDiff);
};

// 鼠标按下
MouseInput.prototype.onMouseDown = function (event) {
    switch (event.button) {
        case pc.MOUSEBUTTON_LEFT:
            this.lookButtonDown = true;
            break;

        case pc.MOUSEBUTTON_MIDDLE:
        // case pc.MOUSEBUTTON_RIGHT:
            // this.panButtonDown = true;
            break;
    }
};

// 鼠标抬起
MouseInput.prototype.onMouseUp = function (event) {
    switch (event.button) {
        case pc.MOUSEBUTTON_LEFT:
            this.lookButtonDown = false;
            break;

        case pc.MOUSEBUTTON_MIDDLE:
        // case pc.MOUSEBUTTON_RIGHT:
            // this.panButtonDown = false;
            break;
    }
};

// 鼠标移动
MouseInput.prototype.onMouseMove = function (event) {
    // 不建议使用 pc.app（已移除），改用 this.app
    if (this.lookButtonDown) {
        this.orbitCamera.pitch -= event.dy * this.orbitSensitivity;
        this.orbitCamera.yaw -= event.dx * this.orbitSensitivity;
    } else if (this.panButtonDown) {
        this.pan(event);
    }

    this.lastPoint.set(event.x, event.y);
};

// 鼠标滚轮
MouseInput.prototype.onMouseWheel = function (event) {
    // v2.x 鼠标滚轮事件属性不同，统一用 event.deltaY
    const wheel = event.wheel !== undefined ? event.wheel : event.deltaY * 0.1;
    this.orbitCamera.distance -= wheel * this.distanceSensitivity * (this.orbitCamera.distance * 0.1);
    event.event.preventDefault();
};

// 鼠标移出窗口
MouseInput.prototype.onMouseOut = function () {
    this.lookButtonDown = false;
    this.panButtonDown = false;
};
