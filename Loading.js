pc.script.createLoadingScreen(function (app) {
    const description = '屏幕上轻点并转动<br>查看 iqoo 15t';
    let currentProgress = 0;

    // 判断是否为PC
    const isPC = () => {
        const ua = navigator.userAgent;
        const mobileAgents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
        return !mobileAgents.some(agent => ua.indexOf(agent) > -1);
    };

    // 检查不支持的浏览器
    const notSupportPlaycanvas = () => {
        const ua = navigator.userAgent.toLowerCase();
        const isIE = !!window.ActiveXObject || "ActiveXObject" in window || ua.indexOf("edge") > -1;
        const isQQBrowser = (ua.includes("mqqbrowser") || ua.includes("qqbrowser")) && !ua.includes("micromessenger");
        const vivoUnSupport = ua.includes("vivo y53") || ua.includes("vivo y23l");
        const matchAndroid = ua.match(/android\s+([\d.]+)/i);
        const androidVer = matchAndroid ? parseFloat(matchAndroid[1]) : 0;
        const isAndroid5 = Math.floor(androidVer) === 5;
        const isUC = /ucbrowser|ucweb/i.test(ua);
        return isIE || isQQBrowser || vivoUnSupport || (isAndroid5 && isUC);
    };

    // 显示不支持提示
    const showUnsupportTip = () => {
        const html = `
        <style>
        .unsupport-tip-wrap{position:absolute;top:0;left:0;height:100%;width:100%;background:#fff}
        .unsupport-tip-wrap .tip-detail-wrap{position:relative;top:50%;width:100%;transform:translateY(-50%);text-align:center}
        .unsupport-tip-wrap .tip-detail-wrap .logo{display:block;margin:0 auto;width:128px;height:35px;margin-bottom:15px}
        .unsupport-tip-wrap .tip-detail-wrap .logo img{width:100%}
        .unsupport-tip-wrap .tip-detail-wrap .tip-text{width:185px;height:32px;font-size:12px;line-height:16px;display:inline-block;color:#575c66}
        @media screen and (max-width:768px){
            .unsupport-tip-wrap .tip-detail-wrap .logo{width:113px;height:31px;margin-bottom:14px}
            .unsupport-tip-wrap .tip-detail-wrap .tip-text{font-size:12px;line-height:16px}
        }
        </style>
        <div class="unsupport-tip-wrap">
            <div class="tip-detail-wrap">
                <div class="logo">
                    <img src="https://zhanstatic.vivo.com.cn/wukong-zhan/img/debcb269-fc5b-4e94-90d1-2749cbee296fnwebp_compress.png"/>
                </div>
                <div class="tip-text">抱歉，当前浏览环境不支持3D体验，请升级系统或浏览器版本后重试</div>
            </div>
        </div>`;
        const wrap = document.querySelector('.vivo-container') || document.body;
        const canvas = document.querySelector('#application-canvas');
        if (canvas) canvas.style.display = 'none';
        wrap.innerHTML = html;
    };

    // 初始化加载画面
    const showSplash = () => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('loading-parent');
        wrapper.innerHTML = `
            <div class="loading-wrap">
                <div class="logo"></div>
                <div class="des"></div>
                <div class="loadingp-wrap">
                    <div class="loading-progress">
                        <div class="loading-bar-bg">
                            <div class="loading-bar"></div>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(wrapper);
        wrapper.style.display = 'none';
        fakeLoading();

        const logoContainer = wrapper.querySelector('.logo');
        wrapper.querySelector('.des').innerHTML = description;

        const logo = document.createElement('img');
        logoContainer.appendChild(logo);

        wrapper.style.display = 'block';
        const canvas = document.querySelector('#application-canvas');
        if (canvas) {
            canvas.style.opacity = 1;
            canvas.style.visibility = 'unset';
        }
    };

    // 阶段1：模拟 0–60%
    const fakeLoading = () => {
        const target = 60;
        const step = () => {
            if (currentProgress < target) {
                currentProgress += 0.5;
                updateProgress(currentProgress);
                requestAnimationFrame(step);
            }
        };
        step();
    };

    // 更新 DOM 进度条
    const updateProgress = (value) => {
        if (value > 100) value = 100;
        const bar = document.querySelector('.loading-bar');
        if (bar) bar.style.width = value + '%';
    };

    // 阶段2：真实进度
    const setProgress = (value) => {
        const percent = Math.floor(value * 100);
        if (percent < currentProgress) return;
        currentProgress = percent;
        updateProgress(currentProgress);
    };

    // 隐藏加载画面
    const hideSplash = () => {
        currentProgress = 100;
        updateProgress(currentProgress);

        if (!isPC()) {
            const canvas = document.querySelector('#application-canvas');
            if (canvas) {
                canvas.width = document.body.offsetWidth * window.devicePixelRatio;
                canvas.height = document.body.offsetHeight * window.devicePixelRatio;
            }
        }

        setTimeout(() => {
            const splash = document.querySelector('.loading-parent');
            if (splash && splash.parentElement) {
                splash.parentElement.removeChild(splash);
            }
            try {
                window.parent && window.parent.postMessage({ msg: 'loaded' }, '*');
            } catch (err) {
                console.warn('PostMessage failed:', err);
            }
        }, 300);
    };

    // 注入 CSS
    const createCss = () => {
        const css = [
            '.loading-parent{position:absolute;top:0;left:0;height:100%;width:100%;background:#fff;font-family:VIVO-FONT-WEB-BOLD,VIVO-FONT-NAV-BOLD,sans-serif;}',
            '.loading-parent .loading-wrap{width:100%;height:auto;top:50%;transform:translateY(-50%);position:relative;text-align:center;font-size:0}',
            '.loading-parent .loading-wrap .logo{display:inline-block;margin-bottom:9px;}',
            '.loading-parent .loading-wrap .logo img{height:29px;}',
            '.loading-parent .loading-wrap .des{font-size:28px;margin-bottom:30px;line-height:1.4;color:#898F99;}',
            '.loading-parent .loading-wrap .loadingp-wrap{width:auto;display:inline-block;text-align:center;}',
            '.loading-parent .loading-wrap .loadingp-wrap .loading-progress{width:210px;height:8px;margin:0 auto 10px;position:relative;}',
            '.loading-parent .loading-wrap .loadingp-wrap .loading-progress .loading-bar-bg{height:100%;width:100%;background:#DCE1EA;overflow:hidden;border-radius:4px;}',
            '.loading-parent .loading-wrap .loadingp-wrap .loading-progress .loading-bar{height:100%;width:0%;background:#898F99;border-radius:4px;transition:width 0.3s ease;}',
            '@media screen and (max-width:768px){.loading-parent .loading-wrap .des{height:16px;font-size:14px;margin-bottom:16px}.loading-parent .loading-wrap .loadingp-wrap .loading-progress{width:160px;height:6px}}'
        ].join('\n');

        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    };

    // 主逻辑入口
    if (notSupportPlaycanvas()) {
        showUnsupportTip();
        app.destroy(); // v2.12.4 仍支持
        return;
    }

    createCss();
    showSplash();

    // PlayCanvas v2.x 的事件系统仍兼容旧写法
    app.on('preload:start', () => {});
    app.on('preload:progress', setProgress);
    app.on('preload:end', () => app.off('preload:progress'));
    app.on('start', hideSplash);
});
