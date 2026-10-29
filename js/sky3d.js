/* =====================================================================
 * sky3d.js —— 3D 星空台（批次六十 · 共享 js/vendor/three.min.js r159 UMD）
 *
 * 天文角观星 / 天文台顶层看银河的升维场景：点云星空 + 银河带 + 星座连线
 * + 中文标牌，方向键环视，Z/X 离开。奖励、日锁、星座心得文案仍全部由
 * game-scene 原链路执行——本模块只负责「看」，不碰任何数值与存档。
 *
 * 约束（与全项目一致）：
 *  - 顶层零 THREE / 零 DOM 触碰：冒烟 vm 装载安全；THREE 缺失或 WebGL
 *    初始化失败时 open() 返回 false，调用方静默回退原文案（双守卫）；
 *  - 经典 <script defer>、无 module、无本地 fetch——星点、标牌、月相
 *    全部运行时 CanvasTexture / 程序化生成；
 *  - 渲染接管沿用 Battle/Books/Mini 的 active + 主循环分支模式，
 *    期间世界更新暂停（观星不烧时间）。
 * ===================================================================== */
ADV.Sky3D = (function () {
  'use strict';

  let act = false, done = null;                    // done：viewPromise 的 resolve
  let renderer = null, scene = null, camera = null, cv = null;
  let mode = 'astro', hi = -1, moonPhase = 0;
  let yaw = 0, pitch = 0, t = 0;
  let twA = null, twB = null, bandMat = null;      // 闪烁层 ×2 + 银河带材质
  let hiStars = null, hiLines = null;              // 今日高亮星座的脉冲材质
  const D2R = Math.PI / 180;

  /* —— 星座定义：az/el 为天球方位角/仰角（度），stars 为 [dAz,dEl] 偏移 ——
   * 文案口径与 game-scene.js STAR_NOTES 一一对应（索引即 day % 4 的轮换）。 */
  const CONSTS = [
    { name: '天鹅座', az: -38, el: 30,
      stars: [[0, 12], [0, 0], [4, -20], [-12, 2], [11, 4]],   // 北十字：天津四—天津一—辇道增七 + 双翼
      lines: [[0, 1], [1, 2], [1, 3], [1, 4]] },
    { name: '仙后座', az: 58, el: 22,
      stars: [[-16, -3], [-8, 4], [0, -3], [8, 5], [16, -4]],  // 歪掉的 W
      lines: [[0, 1], [1, 2], [2, 3], [3, 4]] },
    { name: '金星', az: -105, el: 10, stars: [], lines: [], bright: true },
    { name: '月', az: 138, el: 42, stars: [], lines: [], moon: true }
  ];

  /* —— 球面坐标：方位角/仰角（度）→ 半径 r 的三维点 —— */
  function sph(az, el, r) {
    const a = az * D2R, e = el * D2R;
    return new THREE.Vector3(
      Math.cos(e) * Math.sin(a), Math.sin(e), -Math.cos(e) * Math.cos(a)
    ).multiplyScalar(r);
  }

  /* —— 文字标牌：CanvasTexture Sprite（运行时生成，无外部资源） —— */
  function textSprite(text, col, w, wide) {
    const c = document.createElement('canvas');
    c.width = wide ? 512 : 256; c.height = 64;
    const g = c.getContext('2d');
    g.font = '26px "Zpix","SimSun",monospace';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = col; g.shadowBlur = 10;
    g.fillStyle = col;
    g.fillText(text, c.width / 2, 34);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false
    }));
    s.scale.set(w || 14, (w || 14) / 4, 1);
    return s;
  }

  /* —— 月相盘：明亮面比例随调用方传入的天数相位走（0 新月 → 4 满月） —— */
  function moonSprite(isHi) {
    const S = 128, R = 44;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    const ph = ((moonPhase % 8) + 8) % 8;
    const f = (1 - Math.cos(Math.PI * ph / 4)) / 2;           // 照亮比例
    g.beginPath(); g.arc(S / 2, S / 2, R, 0, Math.PI * 2);
    g.fillStyle = isHi ? '#fff6d8' : '#e8e2c8'; g.fill();
    g.save();
    g.beginPath(); g.arc(S / 2, S / 2, R, 0, Math.PI * 2); g.clip();
    g.beginPath();
    g.arc(S / 2 + 2 * R * f * (ph <= 4 ? 1 : -1), S / 2, R, 0, Math.PI * 2);
    g.fillStyle = 'rgba(8,10,20,.92)'; g.fill();
    g.restore();
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false
    }));
    s.scale.set(11, 11, 1);
    return s;
  }

  function disposeScene() {
    if (!scene) return;
    scene.traverse(o => {
      if (o.geometry && o.geometry.dispose) o.geometry.dispose();
      if (o.material) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach(m => { if (m.map && m.map.dispose) m.map.dispose(); if (m.dispose) m.dispose(); });
      }
    });
    scene = null; twA = twB = bandMat = hiStars = hiLines = null;
  }

  function build() {
    disposeScene();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(72, 960 / 640, .1, 600);
    scene.add(camera);

    /* 背景天幕：大球内壁顶点色渐变（地平暗紫 → 天顶夜蓝） */
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(300, 24, 16),
      new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false })
    );
    const pos = sky.geometry.attributes.position, n = pos.count;
    const cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const k = Math.max(0, Math.min(1, (pos.getY(i) / 300 + .25) / .9));
      cols[i * 3] = .04 + .02 * k;
      cols[i * 3 + 1] = .05 + .05 * k;
      cols[i * 3 + 2] = .10 + .18 * k;
    }
    sky.geometry.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    scene.add(sky);

    /* 双层闪烁星点（球壳随机分布，两层反相呼吸） */
    function starLayer(n2, rMin, rMax, size, col, op) {
      const arr = new Float32Array(n2 * 3);
      for (let i = 0; i < n2; i++) {
        const u = Math.random() * 2 - 1, ph = Math.random() * Math.PI * 2;
        const s = Math.sqrt(1 - u * u), r = rMin + Math.random() * (rMax - rMin);
        arr[i * 3] = s * Math.cos(ph) * r; arr[i * 3 + 1] = u * r; arr[i * 3 + 2] = s * Math.sin(ph) * r;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      const mat = new THREE.PointsMaterial({
        color: col, size, sizeAttenuation: true, transparent: true, opacity: op, depthWrite: false
      });
      scene.add(new THREE.Points(geo, mat));
      return mat;
    }
    twA = starLayer(mode === 'galaxy' ? 1100 : 850, 90, 210, 1.7, 0xdfe8ff, .85);
    twB = starLayer(mode === 'galaxy' ? 900 : 650, 90, 210, 1.2, 0xffeecf, .8);

    /* 银河带：随机方向压向倾斜银道面的密点带（galaxy 模式加倍） */
    {
      const n2 = mode === 'galaxy' ? 1500 : 700;
      const arr = new Float32Array(n2 * 3);
      const nrm = new THREE.Vector3(.45, .68, .58).normalize();
      const v = new THREE.Vector3();
      for (let i = 0; i < n2; i++) {
        v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
        v.addScaledVector(nrm, -v.dot(nrm) * (.8 + Math.random() * .16));
        v.normalize().multiplyScalar(130 + Math.random() * 90);
        arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      bandMat = new THREE.PointsMaterial({
        color: 0xbcd0ff, size: 1.5, sizeAttenuation: true, transparent: true, opacity: .38, depthWrite: false
      });
      scene.add(new THREE.Points(geo, bandMat));
    }

    /* 星座组：星点 + 连线 + 标牌；hi 索引的组做暖色脉冲高亮 */
    CONSTS.forEach((C, ci) => {
      const isHi = ci === hi;
      const grp = new THREE.Group();
      if (C.moon) {
        const m = moonSprite(isHi);
        m.position.copy(sph(C.az, C.el, 160));
        grp.add(m);
      } else if (C.bright) {
        const geo = new THREE.BufferGeometry();
        const p = sph(C.az, C.el, 160);
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([p.x, p.y, p.z]), 3));
        const mat = new THREE.PointsMaterial({
          color: isHi ? 0xffe9a8 : 0xffe2b0, size: isHi ? 9 : 7,
          sizeAttenuation: true, transparent: true, opacity: 1, depthWrite: false
        });
        grp.add(new THREE.Points(geo, mat));
        if (isHi) hiStars = mat;
      } else if (C.stars.length) {
        const arr = new Float32Array(C.stars.length * 3);
        C.stars.forEach((s, i) => {
          const p = sph(C.az + s[0], C.el + s[1], 160);
          arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z;
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        const mat = new THREE.PointsMaterial({
          color: isHi ? 0xfff3b0 : 0xcfe0ff, size: isHi ? 4.2 : 3,
          sizeAttenuation: true, transparent: true, opacity: 1, depthWrite: false
        });
        grp.add(new THREE.Points(geo, mat));
        if (isHi) hiStars = mat;
        if (C.lines.length) {
          const lp = new Float32Array(C.lines.length * 6);
          C.lines.forEach((L, i) => {
            const a = sph(C.az + C.stars[L[0]][0], C.el + C.stars[L[0]][1], 160);
            const b = sph(C.az + C.stars[L[1]][0], C.el + C.stars[L[1]][1], 160);
            lp.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
          });
          const lgeo = new THREE.BufferGeometry();
          lgeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
          const lmat = new THREE.LineBasicMaterial({
            color: isHi ? 0xffe27a : 0x9fb6e8, transparent: true, opacity: isHi ? .9 : .4
          });
          grp.add(new THREE.LineSegments(lgeo, lmat));
          if (isHi) hiLines = lmat;
        }
      }
      const label = textSprite(C.name, isHi ? '#ffe27a' : '#aebfe0', C.moon || C.bright ? 10 : 12);
      label.position.copy(sph(C.az, C.el + (C.el > 30 ? -14 : -10), 150));
      grp.add(label);
      scene.add(grp);
    });

    /* 标题与操作提示：挂在相机上（始终可见，不随环视飘走） */
    const title = textSprite(mode === 'galaxy' ? '🔭 天文台顶层 · 银河' : '🔭 天文角 · 校园夜空', '#dfe8ff', 17, true);
    title.position.set(0, 5.6, -30);
    camera.add(title);
    const hint = textSprite('←→↑↓ 环视 · Z 离开', '#9fb6e8', 13, true);
    hint.position.set(0, -6.2, -30);
    camera.add(hint);
  }

  function open(m, h, phase) {
    if (act) return true;
    if (typeof THREE === 'undefined') return false;        // 守卫一：库未加载（含冒烟 vm）→ 回退
    try {
      cv = document.getElementById('gl');
      if (!cv) return false;
      if (!renderer) {
        renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
        renderer.setSize(960, 640, false);
      }
    } catch (e) { renderer = null; return false; }         // 守卫二：WebGL 不可用 → 回退
    mode = (m === 'galaxy') ? 'galaxy' : 'astro';
    hi = (typeof h === 'number') ? h : -1;
    moonPhase = (typeof phase === 'number') ? phase : 0;
    build();
    yaw = 0; pitch = .18; t = 0;
    if (hi >= 0 && hi < CONSTS.length) {                   // 开场正对今日星座
      yaw = -CONSTS[hi].az * D2R;
      pitch = CONSTS[hi].el * D2R * .8;
    }
    try { cv.style.display = 'block'; } catch (e2) {}
    act = true;
    return true;
  }

  /* —— 供场景 async 调用：打开成功 → resolve(true) 于玩家离开时；失败 → 立即 resolve(false) —— */
  function viewPromise(m, h, phase) {
    return new Promise(res => {
      if (!open(m, h, phase)) { res(false); return; }
      done = res;
    });
  }

  function close() {
    if (!act) return;
    act = false;
    try { if (cv) cv.style.display = 'none'; } catch (e) {}
    if (done) { const f = done; done = null; f(true); }
  }

  function update(dt, p, held) {
    if (!act || !camera) return;
    t += dt;
    const L = held || {};
    let moved = false;
    const spd = 55 * D2R * dt;
    if (L.left)  { yaw += spd; moved = true; }
    if (L.right) { yaw -= spd; moved = true; }
    if (L.up)    { pitch = Math.min(1.15, pitch + spd * .8); moved = true; }
    if (L.down)  { pitch = Math.max(-.5, pitch - spd * .8); moved = true; }
    if (!moved) {                                          // 闲置缓漂：星空自己活着
      yaw += (.012 + Math.sin(t * .13) * .028) * dt;
      pitch += Math.sin(t * .09) * .005 * dt;
    }
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    twA.opacity = .62 + .25 * Math.sin(t * 2.1);           // 两层反相闪烁
    twB.opacity = .6 + .28 * Math.sin(t * 2.9 + 2.2);
    bandMat.opacity = .3 + .12 * Math.sin(t * .7);
    if (hiStars) hiStars.size = (mode === 'galaxy' ? 7 : 4.2) + .9 * Math.sin(t * 3);
    if (hiLines) hiLines.opacity = .55 + .4 * (.5 + .5 * Math.sin(t * 3));
    if (p && (p.ok || p.cancel)) close();
  }

  function render() {
    if (!act || !renderer || !scene) return;
    renderer.render(scene, camera);
  }

  return {
    open, close, update, render, viewPromise,
    get active() { return act; },
    get dbg() { return { mode, hi, yaw, pitch }; }         // 供冒烟/调试读取内部状态
  };
})();
