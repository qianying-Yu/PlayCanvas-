// 模型入场动画
var PhoneModelRotate = pc.createScript('PhoneModelRotate');

PhoneModelRotate.prototype.initialize = function () {

    // ---------- 参数 ----------
    this.tiltAngle = -15;     // 仰视角
    this.phase1Time = 1.3;      // 第一段时长
    this.pauseTime  = 0.2;    // 停顿时间
    this.phase2Time = .7;      // 第二段时长

    // ---------- 状态 ----------
    this.phase = 0;
    this.time = 0;

    // ---------- 第一段 ----------
    this.p1FromX = 0;
    this.p1FromY = 180;

    this.p1ToX = this.tiltAngle;
    this.p1ToY = 180 + 210;

    // ---------- 第二段 ----------
    this.p2FromX = this.p1ToX;
    this.p2FromY = this.p1ToY;

    this.p2ToX = 0;
    this.p2ToY = this.p2FromY - 75;

    // 初始姿态
    this.entity.setEulerAngles(this.p1FromX, this.p1FromY, 0);

    this.isRotating = true;

    // ease-in-out 函数
    this.easeInOut = function(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    };
};

PhoneModelRotate.prototype.update = function (dt) {

    if (!this.isRotating) return;

    this.time += dt;

    let t, easedT, x, y;

    // ---------- 第一段：右转 + 仰视 ----------
    if (this.phase === 0) {

        t = Math.min(this.time / this.phase1Time, 1);
        easedT = this.easeInOut(t);

        x = pc.math.lerp(this.p1FromX, this.p1ToX, easedT);
        y = pc.math.lerp(this.p1FromY, this.p1ToY, easedT);

        this.entity.setEulerAngles(x, y, 0);

        if (t >= 1) {
            this.phase = 1;   // 进入停顿
            this.time = 0;
        }

        return;
    }

    // ---------- 停顿 ----------
    if (this.phase === 1) {

        if (this.time >= this.pauseTime) {
            this.phase = 2;
            this.time = 0;
        }

        return;
    }

    // ---------- 第二段：左转 + 去仰视 ----------
    t = Math.min(this.time / this.phase2Time, 1);
    easedT = this.easeInOut(t);

    x = pc.math.lerp(this.p2FromX, this.p2ToX, easedT);
    y = pc.math.lerp(this.p2FromY, this.p2ToY, easedT);

    this.entity.setEulerAngles(x, y, 0);

    if (t >= 1) {
        this.isRotating = false;
    }
};
