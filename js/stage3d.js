/* =========================================================
 * stage3d.js —— 立体演出层（three.js r159 UMD，本地 js/vendor/）
 * 只服务「关键节点演出」，不碰日常 2D 循环：
 *   1) warp()            时光回廊跃迁隧道（全屏覆盖画布，随用随建、用毕即毁）
 *   2) titleBackground() 标题画面低多边形校园（离屏渲染后 drawImage 合成进 2D 主画布）
 * 约束：经典 script / file:// 双击即玩——three r160 起只发 ES module（file:// 下被
 * CORS 拦截不可用），故锁定 r159 最后一个 UMD 构建；WebGL 不可用（旧设备 / 冒烟
 * Node 环境）时所有接口同步返回 false，调用方走原有 2D 路径，绝不悬挂回调。
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.Stage3D = (function () {
  const W = 960, H = 640;

  let dead = false;            // 渲染一旦抛错/环境探测失败：本会话永久回退 2D（不反复重试）
  let probed = false, probeOk = false;
  let titleR = null;           // 标题背景离屏渲染器（常驻一个；preserveDrawingBuffer 供 drawImage）
  let titleScene = null, titleCam = null, clockHands = null, flagMesh = null;
  let warpActive = false;

  function lib() { return window.THREE || null; }

  function probe() {
    if (probed) return probeOk;
    probed = true;
    const T = lib();
    if (!T || !T.WebGLRenderer) { probeOk = false; return false; }
    try {
      const r = new T.WebGLRenderer({ canvas: document.createElement('canvas'), alpha: true });
      r.dispose();                                   // 只探测能否创建上下文，不留
      probeOk = true;
    } catch (e) { probeOk = false; dead = true; }
    return probeOk;
  }

  /* ==================== 标题背景：低多边形校园 ====================
   * 透明背景渲染，合成在 2D 天空渐变/太阳/云之下层——云仍在楼前飘，画风连续。
   * 全部几何程序化生成（延续「零素材」哲学）；慢速环绕 + 钟楼指针缓走（三章时光主题）。 */
  function buildTitle(T) {
    const s = new T.Scene();
    s.fog = new T.Fog(0xa8d8f5, 70, 150);            // 雾色对齐 2D 天空中段：地平线自然消隐
    s.add(new T.HemisphereLight(0xbfd9ff, 0x6a8f5a, .95));
    const sun = new T.DirectionalLight(0xfff2cc, .8);
    sun.position.set(40, 60, 20); s.add(sun);
    const lam = c => new T.MeshLambertMaterial({ color: c });
    const add = (geo, mat, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); s.add(m); return m; };

    const ground = new T.Mesh(new T.CircleGeometry(95, 48), lam(0x4d9a41));
    ground.rotation.x = -Math.PI / 2; s.add(ground); // 草地色与原 2D 剪影同源（#4d9a41）
    add(new T.BoxGeometry(4.5, .3, 24), lam(0xcbbf9a), 0, .15, 16);
    const ring = new T.Mesh(new T.TorusGeometry(8, .35, 8, 36), lam(0xd8d0b8));
    ring.rotation.x = -Math.PI / 2; ring.position.set(17, .2, 12); s.add(ring);

    // 主楼：墙体 + 四棱锥屋顶 + 窗阵 + 木门
    add(new T.BoxGeometry(30, 9, 12), lam(0xe7dcc3), -2, 4.5, 0);
    const roof = add(new T.ConeGeometry(20.5, 6, 4), lam(0xa04a38), -2, 12, 0);
    roof.rotation.y = Math.PI / 4;
    const winMat = new T.MeshBasicMaterial({ color: 0xffe9a8 });
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++)
      add(new T.PlaneGeometry(1.6, 2.1), winMat, -14.5 + i * 5, 2.8 + j * 3.6, 6.05);
    add(new T.BoxGeometry(3, 4.4, .5), lam(0x8a5a3a), -2, 2.2, 6.1);
    // 侧翼两栋（教学楼 / 体育馆气质）
    add(new T.BoxGeometry(11, 6, 8), lam(0xded2b8), -25, 3, 3);
    const r2 = add(new T.ConeGeometry(8, 4, 4), lam(0xa04a38), -25, 8, 3); r2.rotation.y = Math.PI / 4;
    add(new T.BoxGeometry(11, 6, 8), lam(0xded2b8), 21, 3, 5);
    const r3 = add(new T.ConeGeometry(8, 4, 4), lam(0x8fa8c8), 21, 8, 5); r3.rotation.y = Math.PI / 4;
    // 钟楼（三章之钥）：表盘 + 指针（几何下移使转轴在针根）
    add(new T.BoxGeometry(5.5, 21, 5.5), lam(0xd9cdb0), 12, 10.5, -9);
    const r4 = add(new T.ConeGeometry(4.4, 3.6, 4), lam(0x8a4a3a), 12, 22.8, -9); r4.rotation.y = Math.PI / 4;
    const face = new T.Mesh(new T.CircleGeometry(1.9, 24), new T.MeshBasicMaterial({ color: 0xfff8e0 }));
    face.position.set(12, 16.5, -6.2); s.add(face);
    const handMat = new T.MeshBasicMaterial({ color: 0x333333 });
    const hg = new T.PlaneGeometry(.22, 1); hg.translate(0, .5, 0);
    const mg = new T.PlaneGeometry(.16, 1.45); mg.translate(0, .725, 0);
    const hour = new T.Mesh(hg, handMat); hour.position.set(12, 16.5, -6.18);
    const min = new T.Mesh(mg, handMat); min.position.set(12, 16.5, -6.16);
    s.add(hour); s.add(min);
    clockHands = { hour, min };
    // 旗杆 + 红旗（轻摆）
    add(new T.CylinderGeometry(.22, .22, 15, 8), lam(0xd8d8e8), -2, 7.5, 10);
    flagMesh = new T.Mesh(new T.PlaneGeometry(4, 2.6, 6, 1),
      new T.MeshLambertMaterial({ color: 0xe85a5a, side: T.DoubleSide }));
    flagMesh.position.set(.2, 13.6, 10); s.add(flagMesh);
    // 树环（固定坐标，无随机：可复现）
    const trunk = lam(0x7a5a3a);
    [[-38, 14], [-30, -12], [-14, -18], [8, -16], [26, -10], [34, 12], [30, 24], [-34, 26], [-12, 22], [22, 20]]
      .forEach(([x, z], i) => {
        add(new T.CylinderGeometry(.5, .6, 2.4, 6), trunk, x, 1.2, z);
        add(new T.ConeGeometry(2.3, 4.6, 6), lam(i % 2 ? 0x3f8f3f : 0x58ab4a), x, 4.4, z);
      });
    return s;
  }

  /* 每帧由标题画面绘制路径调用；返回 false = WebGL 不可用（调用方画原 2D 剪影） */
  function titleBackground(g, t) {
    if (dead || !probe()) return false;
    const T = lib();
    try {
      if (!titleR) {
        titleR = new T.WebGLRenderer({ canvas: document.createElement('canvas'), alpha: true, antialias: true, preserveDrawingBuffer: true });
        titleR.setSize(W, H, false);
        titleScene = buildTitle(T);
        titleCam = new T.PerspectiveCamera(50, W / H, .1, 400);
      }
      const a = t * .07 + .6;                        // 慢速环绕（约 90 秒一圈，气口极缓）
      titleCam.position.set(Math.sin(a) * 52, 15 + Math.sin(t * .11) * 1.6, Math.cos(a) * 52);
      titleCam.lookAt(0, 4, 0);
      if (clockHands) {
        clockHands.min.rotation.z = -t * .1;         // 指针缓走：时光回廊的暗示
        clockHands.hour.rotation.z = -t * .008 - 2.1;
      }
      if (flagMesh) flagMesh.rotation.y = Math.sin(t * 2.2) * .18;
      titleR.render(titleScene, titleCam);
      g.drawImage(titleR.domElement, 0, 0, W, H);
      return true;
    } catch (e) {
      dead = true;                                   // 中途异常：本会话回退 2D 剪影
      try { if (titleR) titleR.dispose(); } catch (e1) {}
      titleR = null;
      return false;
    }
  }

  /* ==================== 时光回廊跃迁隧道 ====================
   * 覆盖画布贴着 #game 实际位置摆放；自带 rAF 与兜底定时器，保证 onMid/onDone 必达；
   * Z/X/Esc/回车/空格可跳过（跳到淡出段）；结束即销毁画布、几何、材质与 WebGL 上下文。 */
  function warp(opt) {
    if (dead || warpActive || !probe()) return false;
    const T = lib();
    const gameCv = document.getElementById && document.getElementById('game');
    if (!gameCv || !gameCv.getBoundingClientRect) return false;
    let cv = null, r = null, raf = 0, guard = 0;
    let midDone = false, doneFired = false, t0 = performance.now(), last = performance.now();
    const dur = Math.max(1600, (opt && opt.ms) || 2800);
    let fit = null, skip = null, finish = null, step = null;

    finish = () => {
      if (doneFired) return;
      doneFired = true;
      cancelAnimationFrame(raf);
      clearTimeout(guard);
      window.removeEventListener('resize', fit);
      window.removeEventListener('keydown', skip, true);
      try { if (cv && cv.parentNode) cv.parentNode.removeChild(cv); } catch (e0) {}
      // 兜底路径（rAF 被后台页冻结，由 guard 定时器收尾）也要保证换图发生，
      // 否则门被消耗而玩家仍留在原地——宁可瞬切也不吞传送
      if (!midDone) { midDone = true; if (opt && opt.onMid) { try { opt.onMid(); } catch (em) {} } }
      try {
        scene.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
        r.dispose();
        if (r.forceContextLoss) r.forceContextLoss();
      } catch (e1) {}
      warpActive = false;
      if (opt && opt.onDone) { try { opt.onDone(); } catch (e2) {} }
    };
    skip = e => {                                      // 跳过 = 直落淡出段（仍有 0.5s 收尾，不闪断）
      const c = e && e.code;
      if (c === 'KeyZ' || c === 'KeyX' || c === 'Enter' || c === 'Escape' || c === 'Space')
        t0 = Math.min(t0, performance.now() - (dur - 520));
    };

    let scene = null;
    try {
      cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const st = cv.style;
      st.position = 'fixed'; st.pointerEvents = 'none'; st.zIndex = '150'; st.opacity = '0';
      fit = () => {
        const b = gameCv.getBoundingClientRect();
        st.left = b.left + 'px'; st.top = b.top + 'px';
        st.width = b.width + 'px'; st.height = b.height + 'px';
      };
      fit();
      document.body.appendChild(cv);
      window.addEventListener('resize', fit);

      r = new T.WebGLRenderer({ canvas: cv, alpha: false, antialias: true });
      r.setSize(W, H, false);
      r.setClearColor(0x05051a, 1);

      scene = new T.Scene();
      scene.fog = new T.Fog(0x05051a, 30, 175);
      const cam = new T.PerspectiveCamera(58, W / H, .1, 500);
      const movers = [];

      const tube = new T.Mesh(
        new T.CylinderGeometry(10, 10, 420, 20, 44, true),
        new T.MeshBasicMaterial({ color: 0x27358f, wireframe: true, transparent: true, opacity: .3 }));
      tube.rotation.x = Math.PI / 2;                  // 圆柱 Y 轴 → Z 轴隧道
      tube.position.z = -190;
      scene.add(tube);

      const ringCols = [0xffd47a, 0x9a7aff, 0x6ad2ff];   // 金 / 紫 / 蓝——星月学院配色
      for (let i = 0; i < 22; i++) {
        const m = new T.Mesh(new T.TorusGeometry(10, .22, 8, 44),
          new T.MeshBasicMaterial({ color: ringCols[i % 3], transparent: true, opacity: .85, blending: T.AdditiveBlending }));
        m.position.z = -5 - i * 19;
        scene.add(m);
        movers.push({ o: m, span: 22 * 19 });
      }
      const starPos = new Float32Array(700 * 3);
      for (let i = 0; i < 700; i++) {
        const a = Math.random() * Math.PI * 2, rr = 2.5 + Math.random() * 7;
        starPos[i * 3] = Math.cos(a) * rr;
        starPos[i * 3 + 1] = Math.sin(a) * rr;
        starPos[i * 3 + 2] = -Math.random() * 400;
      }
      const sg = new T.BufferGeometry();
      sg.setAttribute('position', new T.BufferAttribute(starPos, 3));
      const stars = new T.Points(sg,
        new T.PointsMaterial({ color: 0xffffff, size: 1.05, transparent: true, opacity: .95, blending: T.AdditiveBlending }));
      scene.add(stars);
      movers.push({ o: stars, span: 406 });

      step = now => {
        if (doneFired) return;
        const dt = Math.min(.05, (now - last) / 1000);
        last = now;
        const t = now - t0;
        const k = t < 500 ? t / 500 : (t > dur - 900 ? Math.max(.1, (dur - t) / 900) : 1);
        const dz = 135 * k * dt;
        for (let i = 0; i < movers.length; i++) {
          const mv = movers[i];
          mv.o.position.z += dz;
          if (mv.o.position.z > 6) mv.o.position.z -= mv.span;
        }
        cam.position.set(Math.sin(t * .0008) * 1.6, Math.cos(t * .001) * 1.1, 0);
        cam.lookAt(cam.position.x * .35, cam.position.y * .35, -24);
        cam.rotateZ(Math.sin(t * .0011) * .14);       // 缓慢侧滚：穿梭的失重感
        const fadeIn = Math.max(0, Math.min(1, t / 450));
        const fadeOut = Math.max(0, Math.min(1, (dur - t) / 550));
        cv.style.opacity = (fadeIn * fadeOut).toFixed(3);
        if (!midDone && t >= dur * .55) {             // 隧道最深处换图（画面被完全遮住）
          midDone = true;
          if (opt && opt.onMid) { try { opt.onMid(); } catch (e0) {} }
        }
        if (t >= dur) { finish(); return; }
        r.render(scene, cam);
        raf = requestAnimationFrame(step);
      };

      window.addEventListener('keydown', skip, true);
      warpActive = true;
      raf = requestAnimationFrame(step);
      guard = setTimeout(finish, dur + 900);          // 兜底：rAF 被节流/切后台也保证收尾回调
      return true;
    } catch (e) {
      dead = true;
      try { if (cv && cv.parentNode) cv.parentNode.removeChild(cv); } catch (e0) {}
      try { if (r) r.dispose(); } catch (e1) {}
      warpActive = false;
      return false;
    }
  }

  return {
    available: () => !dead && probe(),
    titleBackground,
    warp
  };
})();
