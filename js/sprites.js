/* =========================================================
 * sprites.js —— 程序化像素美术生成器
 * 图块(tile) 32×32、角色行走图(3帧×4向)、地图物件、气泡表情等
 * 全部用 Canvas 代码绘制，无需任何图片资源。
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.Sprites = (function () {
  const TS = 32, U = 2;                 // 图块尺寸 / 基本像素单元
  const cache = {};                     // 画布缓存

  function cnv(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  // 颜色加深工具
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) * k | 0)),
          g = Math.max(0, Math.min(255, ((n >> 8) & 255) * k | 0)),
          b = Math.max(0, Math.min(255, (n & 255) * k | 0));
    return `rgb(${r},${g},${b})`;
  }
  // HEX 颜色混合工具（用于季节渐变色过渡）
  function mixColor(c1, c2, t) {
    t = Math.max(0, Math.min(1, t));
    const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    const r = ((a >> 16) + ((b >> 16) - (a >> 16)) * t) | 0;
    const g = (((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t) | 0;
    const bl = ((a & 255) + ((b & 255) - (a & 255)) * t) | 0;
    return `rgb(${r},${g},${bl})`;
  }
  // 秋季叶色 4 档渐变：绿 → 黄 → 橙 → 红
  const AUTUMN_LEAF_PALETTE = [
    ['#2f7a33', '#3f9a3f', '#57b857'],   // 档 0：纯绿
    ['#8aaa3a', '#b8c84a', '#d4d85a'],   // 档 1：黄绿
    ['#e8a03a', '#f2b85a', '#f8d07a'],   // 档 2：橙黄
    ['#c84a3a', '#e06a5a', '#f08a7a']    // 档 3：红橙
  ];
  // 春季多品类花卉：樱花粉、迎春黄、二月兰紫、郁金香红
  const SPRING_FLOWER_TYPES = [
    { col: '#ffb8d0', name: '樱花' },
    { col: '#ffe05a', name: '迎春' },
    { col: '#b89af0', name: '二月兰' },
    { col: '#ff7a6a', name: '郁金香' }
  ];

  /* ==================== 图块定义 ====================
   * 每个图块: draw(g, v) 在 32×32 画布上绘制, v=0..2 变体
   * p() 坐标单位为 2px（即 16×16 网格）
   */
  const p = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x * U, y * U, w * U, h * U); };

  // 草地杂点预设（3 变体）
  const GRASS_SPK = [
    [[3, 3], [10, 5], [6, 11], [13, 12], [1, 9], [8, 1]],
    [[5, 2], [12, 6], [2, 12], [9, 9], [14, 2], [7, 14]],
    [[2, 5], [11, 3], [13, 10], [4, 13], [8, 7], [0, 11]]
  ];
  const FLOWER_SPK = [
    [['#ffffff', 4, 4], ['#ffd94c', 11, 6], ['#ff8ab0', 6, 12]],
    [['#ffd94c', 3, 10], ['#ff8ab0', 12, 4], ['#ffffff', 8, 13]],
    [['#ff8ab0', 4, 3], ['#ffffff', 12, 11], ['#ffd94c', 7, 8]]
  ];

  // drawGrass 扩展：season=spring/summer/autumn/winter，progress=0~1 季节内进度
  // 春季：多品类花簇随机生长；夏季：深绿；秋季：枯黄斑；冬季：薄雪覆盖
  function drawGrass(g, v, season, progress) {
    season = season || 'spring'; progress = progress || 0;
    // 基础底色随季节变化
    const basePal = {
      spring: ['#58ab4a', '#63bb53', '#4d9a41'],
      summer: ['#4a9a40', '#55aa4a', '#408a38'],
      autumn: [mixColor('#58ab4a', '#a89050', progress), mixColor('#63bb53', '#b8a060', progress), mixColor('#4d9a41', '#907840', progress)],
      winter: ['#a8c8e8', '#c8e0f0', '#90b0d8']
    };
    const pal = basePal[season] || basePal.spring;
    p(g, 0, 0, 16, 16, pal[0]);
    p(g, 0, 0, 16, 1, pal[1]); p(g, 0, 15, 16, 1, pal[2]);
    // 杂点随季节变色
    GRASS_SPK[v].forEach(([x, y]) => {
      let c;
      if (season === 'winter') c = (x + y) % 2 ? '#e0f0ff' : '#80a8d0';
      else if (season === 'autumn') c = (x + y) % 2 ? mixColor('#6dc45e', '#c8a860', progress) : mixColor('#4a9640', '#a08040', progress);
      else if (season === 'summer') c = (x + y) % 2 ? '#55aa4a' : '#388030';
      else c = (x + y) % 2 ? '#6dc45e' : '#4a9640';
      p(g, x, y, 1, 1, c);
    });
    // 春季：多品类花簇（不同大小，随季节进度逐步"绽放"）
    if (season === 'spring') {
      const bloom = Math.min(1, 0.2 + progress * 1.2);   // 进度越高越盛开
      // 随机在 3 个位置画不同品类的花（用变体 v 决定位置组合）
      const springSpots = [
        [[3, 3, 0], [10, 6, 1], [6, 12, 2]],
        [[5, 4, 1], [12, 10, 3], [2, 12, 0]],
        [[8, 7, 2], [11, 3, 0], [4, 11, 3]]
      ];
      springSpots[v].forEach(([x, y, ti]) => {
        if (Math.random() > bloom) return;   // 进度低时部分花还没开
        const t = SPRING_FLOWER_TYPES[ti];
        // 花瓣（3~4 像素簇 + 中心白）
        p(g, x, y, 1, 1, t.col); p(g, x + 1, y, 1, 1, t.col);
        p(g, x, y + 1, 1, 1, shade(t.col, .85)); p(g, x + 1, y + 1, 1, 1, shade(t.col, .85));
        if (bloom > 0.55) p(g, x, y, 1, 1, '#ffffff');   // 盛开花心
      });
    }
    // 秋季：加少量枯黄落叶点
    if (season === 'autumn' && progress > 0.3) {
      const leafN = Math.floor(progress * 4);
      const leafSpots = [[2, 5], [13, 8], [7, 14], [10, 2]];
      for (let i = 0; i < leafN; i++) {
        const [lx, ly] = leafSpots[(v + i) % 4];
        const lc = ['#e8a050', '#c86040', '#f0c070'][(v + i) % 3];
        p(g, lx, ly, 1, 1, lc);
      }
    }
    // 冬季：薄雪覆盖（不规则白斑）
    if (season === 'winter') {
      const snowSpots = [
        [[0, 1], [5, 2], [9, 5], [13, 1], [2, 10], [14, 13]],
        [[3, 0], [7, 3], [12, 6], [1, 8], [10, 11], [6, 14]],
        [[1, 3], [8, 1], [11, 7], [4, 9], [13, 12], [9, 15]]
      ];
      snowSpots[v].forEach(([x, y]) => {
        p(g, x, y, 1, 1, '#ffffff');
        if ((x + y) % 3 === 0) p(g, x + 1, y, 1, 1, '#f0f8ff');
      });
    }
  }

  const tiles = {
    // ---- 户外地面 ----
    grass:     { draw: drawGrass, seasonal: true },
    grassDark: { draw(g, v, s, pg) {
                  s = s || 'spring'; pg = pg || 0;
                  const base = s === 'winter' ? '#7090b8' : s === 'autumn' ? mixColor('#3d7a3a', '#786038', pg) : s === 'summer' ? '#306828' : '#3d7a3a';
                  const hi = s === 'winter' ? '#88a8d0' : s === 'autumn' ? mixColor('#468844', '#887048', pg) : s === 'summer' ? '#387830' : '#468844';
                  p(g, 0, 0, 16, 16, base); p(g, 0, 0, 16, 1, hi);
                  GRASS_SPK[v].forEach(([x, y]) => p(g, x, y, 1, 1, s === 'winter' ? '#6088b0' : shade(base, .75)));
                }, seasonal: true },
    grass2:    { draw(g, v, s, pg) {
                  drawGrass(g, v, s, pg);
                  if (s === 'winter' || s === 'autumn') return;
                  const bloom = s === 'spring' ? Math.min(1, 0.3 + (pg || 0) * 1.1) : 0.85;
                  if (Math.random() > bloom) return;
                  FLOWER_SPK[v].forEach(([c, x, y]) => {
                    const cc = s === 'summer' ? shade(c, 1.05) : c;
                    p(g, x, y, 1, 1, cc); p(g, x, y + 1, 1, 1, shade(c === '#ffffff' ? '#ffffff' : cc, .7));
                  });
                }, seasonal: true },
    tuft:      { draw(g, v) { drawGrass(g, v); p(g, 4, 6, 1, 3, '#3f8a3a'); p(g, 6, 5, 1, 4, '#3f8a3a'); p(g, 8, 7, 1, 2, '#3f8a3a'); } },
    glow:      { draw(g, v) { p(g, 0, 0, 16, 16, '#3d7a3a'); GRASS_SPK[v].forEach(([x, y]) => p(g, x, y, 1, 1, '#2f6a2f'));
                  p(g, 6, 9, 4, 1, '#b98af5'); p(g, 7, 7, 2, 2, '#8a5ad9'); p(g, 7, 6, 2, 1, '#d0b0ff'); } },
    path:      { draw(g, v, s, pg, weather) {
                  s = s || 'spring'; pg = pg || 0; weather = weather || '晴';
                  p(g, 0, 0, 16, 16, '#d9c49a');
                  p(g, (v * 3) % 12, (v * 5) % 12, 4, 3, '#cbb488'); p(g, (v * 7 + 6) % 11, (v * 3 + 8) % 11, 3, 2, '#c9b184');
                  p(g, 2, 14, 2, 1, '#b89a6e'); p(g, 13, 1, 2, 1, '#b89a6e'); p(g, 8, 8, 1, 1, '#e8dab5');
                  // 夏季雨天：路面小积水反光
                  if (s === 'summer' && (weather === '小雨' || weather === '暴雨')) {
                    const puddleN = weather === '暴雨' ? 3 : 1;
                    for (let i = 0; i < puddleN; i++) {
                      const px = (v * 5 + i * 7) % 12, py = (v * 3 + i * 5 + 2) % 13;
                      p(g, px, py, 3, 2, 'rgba(160,200,240,.55)');
                      p(g, px + 1, py, 1, 1, 'rgba(220,240,255,.8)');
                    }
                  }
                  // 冬季：路面薄雪（非雪天也留霜痕）
                  if (s === 'winter') {
                    const frostSpots = [[1, 0], [9, 2], [4, 11], [13, 13], [7, 6]];
                    frostSpots.slice(0, weather === '雪' ? 5 : 2).forEach(([x, y]) => {
                      p(g, x, y, 1, 1, '#f0f8ff');
                    });
                    if (weather === '雪') {
                      p(g, 0, 0, 16, 1, 'rgba(255,255,255,.4)');
                      p(g, 0, 15, 16, 1, 'rgba(255,255,255,.25)');
                    }
                  }
                }, seasonal: true },
    stone:     { draw(g, v, s, pg, weather) {
                  s = s || 'spring'; weather = weather || '晴';
                  p(g, 0, 0, 16, 16, '#b7bac8'); p(g, 0, 0, 16, 1, '#c8ccdb'); p(g, 0, 0, 1, 16, '#c8ccdb');
                  p(g, 0, 7, 16, 1, '#9ca0b2'); p(g, 0, 15, 16, 1, '#9ca0b2');
                  p(g, v % 2 ? 3 : 11, 3, 5, 1, '#9ca0b2'); p(g, v % 2 ? 11 : 2, 11, 4, 1, '#9ca0b2');
                  p(g, 6, 12, 1, 1, '#cfd3e0');
                  // 冬季石砖积雪覆盖缝隙
                  if (s === 'winter') {
                    p(g, 0, 0, 16, 1, 'rgba(255,255,255,.5)');
                    p(g, 0, 7, 16, 1, 'rgba(255,255,255,.35)');
                    if (weather === '雪') {
                      p(g, 0, 0, 1, 16, 'rgba(255,255,255,.4)');
                      p(g, 3, 3, 3, 1, '#f0f8ff'); p(g, 10, 10, 2, 1, '#f0f8ff');
                    }
                  }
                  // 夏季雨天：石砖湿色加深+反光
                  if (s === 'summer' && (weather === '小雨' || weather === '暴雨')) {
                    g.globalAlpha = weather === '暴雨' ? .35 : .2;
                    p(g, 0, 0, 16, 16, '#5a7090');
                    g.globalAlpha = 1;
                    p(g, (v * 4) % 10, (v * 6) % 10, 2, 1, 'rgba(220,240,255,.6)');
                  }
                }, seasonal: true },
    mossStone: { draw(g, v, s, pg, weather) {
                  s = s || 'spring'; weather = weather || '晴';
                  p(g, 0, 0, 16, 16, '#a2a8b0'); p(g, 0, 7, 16, 1, '#848a94');
                  p(g, 0, 15, 16, 1, '#848a94');
                  // 秋冬苔藓减少
                  const mossK = s === 'spring' ? 1 : s === 'summer' ? 1 : s === 'autumn' ? .6 : 0;
                  if (mossK > 0) {
                    p(g, 2 + v * 4, 3, Math.ceil(4 * mossK), 2, '#5f8a55');
                    p(g, 9, 10 + v, Math.ceil(5 * mossK), 2, '#5f8a55');
                  }
                  p(g, 4, 11, 1, 1, '#c2c8ce');
                  if (s === 'winter' && weather === '雪') {
                    p(g, 0, 0, 16, 1, 'rgba(255,255,255,.5)');
                    p(g, 0, 7, 16, 1, 'rgba(255,255,255,.3)');
                  }
                }, seasonal: true },
    /* —— 山体（T5）：阶梯山脉用岩壁；v%4 四种岩块棱线排布，冬季覆雪 —— */
    mountain:  { draw(g, v, s, pg, weather) {
                  s = s || 'spring'; weather = weather || '晴';
                  const base = s === 'winter' ? '#8a8a9a' : s === 'autumn' ? '#9a8474' : '#94836f';
                  const hi = s === 'winter' ? '#a2a2b2' : '#a89880';
                  const dk = s === 'winter' ? '#66667a' : '#6f5f4e';
                  p(g, 0, 0, 16, 16, base);
                  const m4 = v % 4;
                  if (m4 === 0) { p(g, 1, 2, 9, 5, hi); p(g, 1, 7, 9, 1, dk); p(g, 9, 9, 6, 5, hi); p(g, 9, 14, 6, 1, dk); }
                  else if (m4 === 1) { p(g, 4, 1, 8, 6, hi); p(g, 4, 7, 8, 1, dk); p(g, 0, 10, 6, 4, hi); p(g, 0, 14, 6, 1, dk); p(g, 10, 10, 5, 4, hi); p(g, 10, 14, 5, 1, dk); }
                  else if (m4 === 2) { p(g, 0, 3, 12, 4, hi); p(g, 0, 7, 12, 1, dk); p(g, 12, 3, 4, 8, dk); }
                  else { p(g, 3, 3, 10, 3, hi); p(g, 3, 6, 10, 1, dk); p(g, 1, 10, 4, 4, dk); p(g, 12, 11, 3, 3, dk); }
                  p(g, (v * 5 + 2) % 13, (v * 3 + 8) % 12, 1, 3, dk);
                  p(g, (v * 7 + 9) % 12, (v * 5 + 3) % 10, 1, 2, dk);
                  if (s === 'winter') {
                    p(g, 0, 0, 16, 2, '#eef4ff');
                    if (weather === '雪') { p(g, 0, 0, 16, 3, '#f8fbff'); p(g, 2, 4, 4, 1, '#f0f8ff'); p(g, 9, 8, 4, 1, '#f0f8ff'); }
                  }
                }, seasonal: true, solid: true },
    /* —— 雪线之上的山顶：常年积雪，偶有岩尖冒头 —— */
    snowPeak:  { draw(g, v, s, pg, weather) {
                  s = s || 'spring'; weather = weather || '晴';
                  p(g, 0, 0, 16, 16, '#f2f7ff');
                  p(g, 0, 0, 16, 1, '#ffffff');
                  const dk = '#c8d4ea';
                  const m4 = v % 4;
                  if (m4 === 0) { p(g, 2, 6, 5, 1, dk); p(g, 9, 11, 4, 1, dk); }
                  else if (m4 === 1) { p(g, 4, 4, 6, 1, dk); p(g, 1, 12, 5, 1, dk); }
                  else if (m4 === 2) { p(g, 3, 9, 8, 1, dk); }
                  else { p(g, 6, 3, 7, 1, dk); p(g, 2, 10, 4, 1, dk); }
                  p(g, (v * 3 + 5) % 14, (v * 7 + 6) % 14, 1, 1, '#dde6f8');
                  if (s !== 'winter' || v % 3 === 0) p(g, (v * 5) % 12 + 2, (v * 3) % 10 + 4, 2, 1, '#94836f');
                }, seasonal: true, solid: true },
    track:     { draw(g, v, s, pg, weather) {
                  s = s || 'spring'; weather = weather || '晴';
                  p(g, 0, 0, 16, 16, '#d97a52'); p(g, 0, 0, 16, 1, '#e8926a');
                  p(g, 1, 4, 4, 1, '#fff'); p(g, 8, 4, 4, 1, '#fff'); p(g, 1, 10, 4, 1, '#fff'); p(g, 8, 10, 4, 1, '#fff');
                  p(g, 13, 2, 2, 1, '#c4643e'); p(g, 2, 13, 2, 1, '#c4643e');
                  if (s === 'winter' && weather === '雪') {
                    p(g, 0, 0, 16, 2, 'rgba(255,255,255,.45)');
                    p(g, 5, 5, 2, 1, '#f0f8ff'); p(g, 10, 8, 2, 1, '#f0f8ff');
                  }
                }, seasonal: true },
    court:     { draw(g, v, s, pg, weather) {
                  s = s || 'spring'; weather = weather || '晴';
                  p(g, 0, 0, 16, 16, '#d9a25a'); p(g, 0, 0, 16, 1, '#e6b46e'); p(g, 0, 15, 16, 1, '#c08a46');
                  p(g, 7, 0, 1, 16, '#fff'); p(g, 3, 5, 1, 1, '#fff'); p(g, 11, 5, 1, 1, '#fff'); p(g, 3, 10, 1, 1, '#fff'); p(g, 11, 10, 1, 1, '#fff');
                  if (s === 'summer' && (weather === '小雨' || weather === '暴雨')) {
                    g.globalAlpha = weather === '暴雨' ? .28 : .15;
                    p(g, 0, 0, 16, 16, '#6a7a8a');
                    g.globalAlpha = 1;
                  }
                  if (s === 'winter' && weather === '雪') {
                    p(g, 0, 0, 16, 2, 'rgba(255,255,255,.45)');
                  }
                }, seasonal: true },
    water:     { solid: true, draw(g, v, s, pg, weather) {
                  s = s || 'spring'; weather = weather || '晴';
                  if (s === 'winter') {
                    // 冬季水面结冰：淡蓝色冰面 + 冰裂纹 + 反光
                    p(g, 0, 0, 16, 16, '#a8d0f0'); p(g, 0, 0, 16, 1, '#c8e4f8'); p(g, 0, 15, 16, 1, '#80a8d0');
                    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1;
                    g.beginPath(); g.moveTo(3, 5); g.lineTo(8, 9); g.lineTo(6, 13); g.stroke();
                    g.beginPath(); g.moveTo(11, 4); g.lineTo(13, 10); g.stroke();
                    p(g, 2, 2, 2, 1, '#ffffff'); p(g, 10, 7, 3, 1, 'rgba(255,255,255,.7)');
                    if (weather === '雪') {
                      p(g, 0, 0, 16, 1, 'rgba(255,255,255,.55)');
                      p(g, 4, 3, 2, 1, '#ffffff'); p(g, 12, 11, 2, 1, '#ffffff');
                    }
                  } else {
                    // 非冬季水面（颜色随季节微调：秋更沉，夏更亮）
                    const wc = s === 'summer' ? ['#4a8de0', '#5ba0f0', '#3a7bc8']
                             : s === 'autumn' ? ['#3a70b0', '#4a80c0', '#2a5a90']
                             : [ '#3f7fd9', '#4d8de6', '#3670c4' ];
                    p(g, 0, 0, 16, 16, wc[0]); p(g, 0, 0, 16, 1, wc[1]);
                    p(g, (v * 4) % 9, 3, 5, 1, wc[1]); p(g, (v * 6 + 5) % 9, 9, 5, 1, wc[1]);
                    p(g, 4, 13, 4, 1, wc[2]); p(g, 11, 6, 2, 1, '#cfe8ff'); p(g, 5, 7, 1, 1, '#cfe8ff');
                    // 雨天：多波纹
                    if (s === 'summer' && (weather === '小雨' || weather === '暴雨')) {
                      const extra = weather === '暴雨' ? [[2, 6], [13, 2], [8, 12]] : [[7, 11]];
                      extra.forEach(([x, y]) => {
                        g.strokeStyle = 'rgba(220,240,255,.6)'; g.lineWidth = 1;
                        g.beginPath(); g.arc(x * 2 + 1, y * 2 + 1, 3, 0, Math.PI * 2); g.stroke();
                      });
                    }
                  }
                }, seasonal: true },
    sand:      { draw(g, v, s, pg, weather) {
                  s = s || 'spring'; weather = weather || '晴';
                  p(g, 0, 0, 16, 16, '#e6d5a0'); GRASS_SPK[v].forEach(([x, y]) => p(g, x, y, 1, 1, '#d4c184')); p(g, 7, 3, 2, 1, '#f2e5bb');
                  if (s === 'winter') {
                    p(g, 0, 0, 16, 2, 'rgba(255,255,255,.35)');
                    p(g, (v * 5) % 14, (v * 3) % 12 + 3, 2, 1, '#f0f8ff');
                  }
                }, seasonal: true },

    // ---- 建筑外观 ----
    wall:    { solid: true, draw(g) { p(g, 0, 0, 16, 16, '#f0e4c2');
               for (let y = 3; y < 16; y += 4) p(g, 0, y, 16, 1, '#dccb9f');
               p(g, 0, 14, 16, 2, '#c9a87a'); p(g, 3, 15, 2, 1, '#b08e60'); p(g, 11, 15, 2, 1, '#b08e60'); } },
    wallWin: { solid: true, draw(g) { p(g, 0, 0, 16, 16, '#f0e4c2'); p(g, 0, 14, 16, 2, '#c9a87a');
               p(g, 4, 3, 8, 8, '#ffffff'); p(g, 5, 4, 6, 6, '#8ed2ee'); p(g, 7, 4, 1, 6, '#ffffff'); p(g, 5, 7, 6, 1, '#ffffff');
               p(g, 3, 11, 10, 1, '#d8c8a0'); p(g, 5, 12, 2, 1, '#e85a5a'); p(g, 9, 12, 2, 1, '#e8a05a'); } },
    // 爬山虎墙：教学楼立面藤蔓，四季变色（春嫩芽 / 夏浓绿 / 秋绯红 / 冬枯藤挂雪）
    ivyWall: { solid: true, seasonal: true, draw(g, v, s, pg) {
               s = s || 'spring';
               p(g, 0, 0, 16, 16, '#f0e4c2');
               for (let y = 3; y < 16; y += 4) p(g, 0, y, 16, 1, '#dccb9f');
               p(g, 0, 14, 16, 2, '#c9a87a');
               const leaf = s === 'spring' ? '#7ec850' : s === 'summer' ? '#3f8f3a' : s === 'autumn' ? '#c8603a' : '#8a7a5e';
               const leaf2 = s === 'spring' ? '#a8dc70' : s === 'summer' ? '#5aab50' : s === 'autumn' ? '#e08a4a' : '#a89878';
               const snow = s === 'winter';
               // 主藤茎：从墙脚向上攀爬的两条曲线
               g.strokeStyle = s === 'winter' ? '#7a6a50' : '#4a703a'; g.lineWidth = 1;
               g.beginPath(); g.moveTo(4 + v % 3, 15); g.quadraticCurveTo(7, 10, 5 + v % 2, 3); g.stroke();
               g.beginPath(); g.moveTo(11 - v % 2, 15); g.quadraticCurveTo(9, 11, 12 - v % 3, 6); g.stroke();
               // 叶片簇
               const VINES = [[3, 13], [6, 12], [5, 9], [8, 8], [4, 6], [10, 12], [12, 10], [9, 5], [11, 7]];
               VINES.forEach(([x, y], i) => {
                 if ((i + v) % 4 === 3) return;                    // 疏密有致
                 p(g, x, y, 2, 2, i % 2 ? leaf : leaf2);
                 p(g, x + (i % 2), y - 1, 1, 1, leaf2);
               });
               if (snow) { p(g, 0, 0, 16, 2, 'rgba(255,255,255,.4)'); VINES.forEach(([x, y], i) => { if (i % 2) p(g, x, y - 1, 2, 1, '#f0f8ff'); }); }
             } },
    roofR: { solid: true, seasonal: true, draw(g, v, s, pg, w) { roofDraw(g, '#d9534f', '#b03a3a', s, w); } },
    roofB: { solid: true, seasonal: true, draw(g, v, s, pg, w) { roofDraw(g, '#4f83d9', '#3361b0', s, w); } },
    roofT: { solid: true, seasonal: true, draw(g, v, s, pg, w) { roofDraw(g, '#3aa8a0', '#267f78', s, w); } },
    roofO: { solid: true, seasonal: true, draw(g, v, s, pg, w) { roofDraw(g, '#e0954a', '#b8712f', s, w); } },
    roofP: { solid: true, seasonal: true, draw(g, v, s, pg, w) { roofDraw(g, '#8a5ad9', '#6a3ab0', s, w); } },
    roofG: { solid: true, seasonal: true, draw(g, v, s, pg, w) { roofDraw(g, '#3aa84f', '#267f36', s, w); } },
    roofY: { solid: true, seasonal: true, draw(g, v, s, pg, w) { roofDraw(g, '#d9b83a', '#b0862a', s, w); } },
    doorWood: { draw(g) { p(g, 0, 0, 16, 16, '#f0e4c2'); p(g, 0, 14, 16, 2, '#c9a87a');
                 p(g, 2, 2, 12, 12, '#8a5a2e'); p(g, 3, 3, 10, 10, '#a06c3a'); p(g, 8, 3, 1, 10, '#8a5a2e');
                 p(g, 4, 5, 3, 3, '#8ed2ee'); p(g, 9, 5, 3, 3, '#8ed2ee');
                 p(g, 11, 9, 1, 2, '#ffd94c'); p(g, 0, 15, 16, 1, '#7a6a4a'); } },
    gateWall: { solid: true, draw(g) { p(g, 0, 0, 16, 16, '#b0b4c4'); p(g, 0, 0, 16, 2, '#c8ccdb');
                for (let y = 4; y < 16; y += 4) { p(g, 1, y, 6, 2, '#9ca0b2'); p(g, 9, y, 6, 2, '#9ca0b2'); }
                p(g, 3, 6, 10, 6, '#7a5a2e'); p(g, 4, 7, 8, 4, '#a06c3a'); } },
    gateBar: { solid: true, draw(g) { drawGrass(g, 0); p(g, 0, 2, 16, 2, '#5a5f6e'); p(g, 0, 10, 16, 2, '#5a5f6e');
               for (let x = 1; x < 16; x += 4) p(g, x, 0, 1, 16, '#787e92'); } },

    // ---- 住宅小区（栖霞小区 / 同学家） ----
    aptWall:  { solid: true, draw(g) { p(g, 0, 0, 16, 16, '#d8cdb8'); p(g, 0, 0, 16, 2, '#e6dcc8');
               for (let y = 4; y < 16; y += 5) p(g, 0, y, 16, 1, '#c4b8a0');
               p(g, 7, 0, 1, 16, '#c4b8a0'); } },
    aptWin:   { solid: true, draw(g) { p(g, 0, 0, 16, 16, '#d8cdb8'); p(g, 3, 3, 10, 8, '#a8d0e8');
               p(g, 3, 3, 10, 2, '#c8ecff'); p(g, 7, 3, 1, 8, '#d8cdb8'); p(g, 3, 7, 10, 1, '#d8cdb8');
               p(g, 4, 12, 3, 2, '#e8dcc8'); } },
    aptDoor:  { draw(g) { p(g, 0, 0, 16, 16, '#d8cdb8'); p(g, 3, 2, 10, 13, '#7a4a26');
               p(g, 4, 3, 8, 11, '#a06c3a'); p(g, 7, 3, 1, 11, '#7a4a26');
               p(g, 11, 8, 1, 2, '#ffd94c'); } },
    homeFloor:{ draw(g, v) { p(g, 0, 0, 16, 16, '#e0d4bc');
               p(g, 0, 5, 16, 1, '#d0c0a4'); p(g, 0, 11, 16, 1, '#d0c0a4');
               p(g, (v * 6) % 12, 0, 1, 5, '#d0c0a4'); p(g, (v * 9 + 6) % 12, 6, 1, 5, '#d0c0a4'); } },
    rugRound: { draw(g) { p(g, 0, 0, 16, 16, '#e0d4bc'); p(g, 2, 4, 12, 8, '#c87878');
               p(g, 3, 5, 10, 6, '#b86060'); p(g, 6, 6, 4, 1, '#ffd0d0'); } },

    crystal: { draw(g, v) { p(g, 0, 0, 16, 16, '#4a4552'); p(g, 0, 0, 16, 1, '#5a5562');
                  GRASS_SPK[v].forEach(([x, y]) => p(g, x, y, 1, 1, '#3e3946'));
                  p(g, 6 + v, 6, 3, 5, '#8a5ad9'); p(g, 7 + v, 4, 2, 2, '#b98af5'); p(g, 8 + v, 6, 1, 3, '#d0b0ff'); } },
    caveFloor: { draw(g, v) { p(g, 0, 0, 16, 16, '#4a4552'); p(g, 0, 0, 16, 1, '#565064');
                  p(g, 0, 15, 16, 1, '#3c3844'); p(g, 0, 8, 16, 1, '#403b48');
                  GRASS_SPK[v].forEach(([x, y]) => p(g, x, y, 1, 1, '#3e3946')); } },
    caveWall: { solid: true, draw(g, v) { p(g, 0, 0, 16, 16, '#2c2833'); p(g, 0, 0, 16, 2, '#3a3542');
                  p(g, (v * 5) % 10, 3, 4, 3, '#3a3542'); p(g, (v * 7 + 5) % 10, 9, 5, 3, '#332e3c');
                  p(g, 12, 13, 3, 2, '#3a3542'); p(g, 2, 14, 2, 1, '#4a4456'); } },
    moonFloor: { draw(g, v) { p(g, 0, 0, 16, 16, '#2a2a4e'); p(g, 0, 0, 16, 1, '#34345e');
                 p(g, 0, 15, 16, 1, '#22224a');
                 GRASS_SPK[v].forEach(([x, y]) => p(g, x, y, 1, 1, (x + y) % 2 ? '#3e3e6e' : '#40407a')); } },
    starWall: { solid: true, draw(g, v) { p(g, 0, 0, 16, 16, '#1a1a38'); p(g, 0, 0, 16, 2, '#24244a');
                 [[3, 4], [11, 3], [7, 9], [13, 12]].forEach(([x, y], i) => p(g, x + v % 2, y, 1, 1, i % 2 ? '#8ad0ff' : '#d8c078')); } },
    doorDark: { draw(g) { p(g, 0, 0, 16, 16, '#1c1a30'); p(g, 2, 2, 12, 12, '#0e0c1c');
                 p(g, 3, 3, 10, 10, '#141228'); p(g, 7, 3, 2, 10, '#242044');
                 p(g, 11, 8, 1, 2, '#8a5ad9'); p(g, 4, 6, 1, 1, '#b98af5'); } },
    shelfOld: { solid: true, draw(g, v) { p(g, 0, 0, 16, 16, '#241e2c'); p(g, 1, 1, 14, 14, '#332a3e');
                 const cols = ['#5a4a6a', '#6a5a4a', '#4a5a6a'];
                 for (let r = 0; r < 3; r++) { p(g, 1, 2 + r * 5, 14, 1, '#1e1826');
                   for (let i = 0; i < 5; i++) p(g, 2 + i * 2.6 | 0, 2 + r * 5 + 1, 2, 4, cols[(i + r + v) % 3]); } } },

    // ---- 室内 ----
    inWallTop: { solid: true, draw(g) { p(g, 0, 0, 16, 16, '#57493a'); p(g, 0, 0, 16, 2, '#67584a');
                 for (let i = 0; i < 8; i++) p(g, (i * 5 + 3) % 15, (i * 7 + 4) % 15, 1, 1, '#4a3d30'); } },
    inWall:    { solid: true, draw(g) { p(g, 0, 0, 16, 16, '#8a7a64'); p(g, 0, 0, 16, 2, '#9c8c74');
                 p(g, 0, 14, 16, 2, '#6a5a48'); p(g, 5, 0, 1, 14, '#7a6a56'); p(g, 11, 0, 1, 14, '#7a6a56'); } },
    inWallWin: { solid: true, draw(g) { p(g, 0, 0, 16, 16, '#8a7a64'); p(g, 0, 14, 16, 2, '#6a5a48');
                 p(g, 3, 3, 10, 9, '#e8e0d0'); p(g, 4, 4, 8, 7, '#a8d8f0'); p(g, 4, 4, 8, 2, '#c8ecff');
                 p(g, 7, 4, 1, 7, '#e8e0d0'); p(g, 4, 7, 8, 1, '#e8e0d0'); } },
    blackboard: { solid: true, draw(g) { p(g, 0, 0, 16, 16, '#7a5a2e'); p(g, 1, 1, 14, 12, '#2f5d46');
                 p(g, 2, 3, 5, 1, '#e8f0e8'); p(g, 3, 5, 4, 1, '#e8f0e8'); p(g, 9, 3, 4, 1, '#ffe9a8'); p(g, 10, 5, 3, 1, '#a8d8c0');
                 p(g, 1, 13, 14, 1, '#c9a87a'); p(g, 3, 14, 2, 1, '#fff'); p(g, 8, 14, 2, 1, '#fff'); } },
    abcBoard: { solid: true, draw(g) { p(g, 0, 0, 16, 16, '#8a7a64'); p(g, 0, 14, 16, 2, '#6a5a48');
                 p(g, 1, 3, 14, 10, '#274a8a'); p(g, 2, 4, 12, 8, '#3a5aa8');
                 g.fillStyle = '#ffe9a8'; g.font = 'bold 9px sans-serif';
                 g.textAlign = 'center'; g.textBaseline = 'middle';
                 g.fillText('A B C', 16, 9); } },
    floorWood: { draw(g, v) { p(g, 0, 0, 16, 16, '#c98d5a');
                 p(g, 0, 5, 16, 1, '#b0764a'); p(g, 0, 11, 16, 1, '#b0764a'); p(g, 0, 15, 16, 1, '#b0764a');
                 p(g, (v * 6 + 4) % 14, 0, 1, 5, '#b0764a'); p(g, (v * 9 + 2) % 14, 6, 1, 5, '#b0764a'); p(g, (v * 4 + 8) % 14, 12, 1, 4, '#b0764a');
                 p(g, 3, 2, 2, 1, '#d89e6a'); } },
    floorTile: { draw(g, v) { const off = v % 2;
                 for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
                   const dark = (x + y + off) % 2 === 0;
                   p(g, x * 8, y * 8, 8, 8, dark ? '#c6cbdd' : '#e6e9f2');
                   p(g, x * 8, y * 8, 8, 1, dark ? '#d4d9e8' : '#f2f4fa'); } } },
    floorCarpet: { draw(g) { p(g, 0, 0, 16, 16, '#c85a6a'); p(g, 1, 1, 14, 14, '#b84a5e');
                 p(g, 2, 2, 12, 1, '#d98a98'); p(g, 2, 13, 12, 1, '#d98a98'); p(g, 2, 2, 1, 12, '#d98a98'); p(g, 13, 2, 1, 12, '#d98a98');
                 p(g, 6, 5, 4, 1, '#ffd0d8'); p(g, 7, 8, 2, 2, '#ffd0d8'); } },
    desk: { solid: true, draw(g, v) { p(g, 0, 0, 16, 16, '#c98d5a'); p(g, 1, 4, 14, 6, '#b0764a'); p(g, 1, 4, 14, 1, '#c98d5a');
            p(g, 2, 10, 2, 4, '#8a5a2e'); p(g, 12, 10, 2, 4, '#8a5a2e');
            if (v === 0) { p(g, 4, 5, 4, 3, '#e8e8f0'); p(g, 4, 5, 4, 1, '#5a8ae8'); }
            else if (v === 1) { p(g, 9, 6, 3, 2, '#e85a5a'); } } },
    teacherDesk: { solid: true, counter: true, draw(g) { p(g, 0, 0, 16, 16, '#c98d5a'); p(g, 0, 3, 16, 7, '#a06c3a'); p(g, 0, 3, 16, 1, '#c98d5a');
            p(g, 1, 10, 2, 5, '#7a4a26'); p(g, 13, 10, 2, 5, '#7a4a26');
            p(g, 3, 4, 4, 3, '#e85a5a'); p(g, 4, 5, 2, 1, '#fff'); p(g, 9, 4, 3, 3, '#4a4a5a'); } },
    shelf: { solid: true, draw(g, v) { p(g, 0, 0, 16, 16, '#7a4a26'); p(g, 1, 1, 14, 14, '#a06c3a');
            const cols = ['#d9534f', '#4f83d9', '#ffd94c', '#4aa96c', '#b98af5', '#ff8ab0'];
            for (let r = 0; r < 3; r++) { p(g, 1, 2 + r * 5, 14, 1, '#8a5a2e');
              for (let i = 0; i < 5; i++) { const c = cols[(i + r * 2 + v) % cols.length]; p(g, 2 + i * 2.6 | 0, 2 + r * 5 + 1, 2, 4, c); } } } },
    wallShelf: { solid: true, draw(g, v) { p(g, 0, 0, 16, 16, '#8a7a64');
            const cols = ['#d9534f', '#4f83d9', '#ffd94c', '#4aa96c'];
            for (let i = 0; i < 6; i++) p(g, 1 + i * 2.5 | 0, 4, 2, 8, cols[(i + v) % 4]);
            p(g, 0, 3, 16, 1, '#5a4a3a'); p(g, 0, 12, 16, 2, '#5a4a3a'); } },
    tableRound: { solid: true, draw(g) { p(g, 0, 0, 16, 16, '#c98d5a');
            g.fillStyle = '#a06c3a'; g.beginPath(); g.arc(16, 16, 13, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#b88048'; g.beginPath(); g.arc(14, 14, 9, 0, Math.PI * 2); g.fill();
            p(g, 6, 6, 3, 1, '#c99a6a'); } },
    chair: { draw(g) { p(g, 0, 0, 16, 16, '#c98d5a'); p(g, 5, 3, 6, 6, '#c98d5a'); p(g, 5, 3, 6, 1, '#a06c3a');
             p(g, 6, 9, 4, 4, '#a06c3a'); p(g, 5, 13, 1, 2, '#7a4a26'); p(g, 10, 13, 1, 2, '#7a4a26'); } },
    labBench: { solid: true, counter: true, draw(g, v) { p(g, 0, 0, 16, 16, '#c6cbdd'); p(g, 0, 4, 16, 8, '#9aa2b5'); p(g, 0, 4, 16, 1, '#b4bcd0');
            p(g, 1, 12, 2, 3, '#6a7286'); p(g, 13, 12, 2, 3, '#6a7286');
            const liq = ['#4ae86c', '#b98af5', '#ff8ab0'][v % 3];
            p(g, 3, 1, 3, 3, liq); p(g, 3, 0, 1, 1, '#dfe8f8'); p(g, 4, 0, 1, 1, '#dfe8f8');
            p(g, 10, 2, 4, 2, '#dfe8f8'); p(g, 10, 2, 4, 1, '#ff5a5a'); p(g, 11, 4, 2, 2, '#dfe8f8'); } },
    pcDesk: { solid: true, draw(g, v) { p(g, 0, 0, 16, 16, '#c6cbdd'); p(g, 1, 4, 14, 7, '#a06c3a');
            p(g, 3, 1, 10, 6, '#3a3a44'); p(g, 4, 2, 8, 4, v % 2 ? '#7ad0e8' : '#7ae8a8');
            p(g, 7, 7, 2, 1, '#5a5a66'); p(g, 2, 12, 2, 3, '#6a7286'); p(g, 12, 12, 2, 3, '#6a7286'); } },
    counter: { solid: true, counter: true, draw(g, v) { p(g, 0, 0, 16, 16, '#a06c3a'); p(g, 0, 2, 16, 6, '#d9b98a'); p(g, 0, 2, 16, 1, '#e8d0a8');
            p(g, 0, 8, 16, 8, '#8a5a2e'); p(g, 2, 10, 5, 4, '#a06c3a'); p(g, 9, 10, 5, 4, '#a06c3a');
            if (v === 0) { p(g, 3, 0, 4, 2, '#fff'); p(g, 4, 0, 2, 1, '#e8a05a'); }
            else if (v === 1) { p(g, 4, 0, 4, 2, '#fff'); p(g, 5, 0, 2, 1, '#d9a05a'); }
            else { p(g, 10, 0, 4, 2, '#fff'); p(g, 11, 0, 2, 1, '#8ad9a0'); } } },
    stove: { solid: true, draw(g) { p(g, 0, 0, 16, 16, '#4a4a52'); p(g, 1, 2, 14, 12, '#5a5a64');
            g.fillStyle = '#2a2a32'; g.beginPath(); g.arc(6, 7, 3, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(12, 7, 3, 0, Math.PI * 2); g.fill();
            p(g, 3, 13, 2, 1, '#ff9a4a'); p(g, 8, 13, 2, 1, '#4ad9ff'); } },
    menuBoard: { solid: true, draw(g) { p(g, 0, 0, 16, 16, '#6a4a2a'); p(g, 1, 1, 14, 13, '#3a3a44');
            p(g, 3, 4, 8, 1, '#ffe9a8'); p(g, 3, 7, 6, 1, '#a8d8c0'); p(g, 3, 10, 7, 1, '#ff9aa8');
            p(g, 12, 4, 1, 1, '#ffd94c'); p(g, 10, 7, 1, 1, '#ffd94c'); } },
    // ---- 田野 ----
    soil:  { draw(g, v) { p(g, 0, 0, 16, 16, '#7a5a3a'); p(g, 0, 0, 16, 1, '#8a6a46');
              for (let y = 3; y < 16; y += 4) p(g, (v * 3) % 4, y, 14, 1, '#6a4a2e');
              p(g, 2, 12, 2, 1, '#8a6a46'); p(g, 11, 5, 2, 1, '#8a6a46'); } },
    crop:  { draw(g, v) { p(g, 0, 0, 16, 16, '#7a5a3a');
              for (let i = 0; i < 4; i++) { const x = 2 + i * 4 + ((v + i) % 2);
                p(g, x, 5, 1, 8, '#4d9a41'); p(g, x - 1, 7, 1, 3, '#5cae4d'); p(g, x + 1, 9, 1, 3, '#5cae4d'); }
              p(g, 0, 0, 16, 1, '#8a6a46'); } },
    paddy: { draw(g, v) { p(g, 0, 0, 16, 16, '#5a8a7a'); p(g, 0, 0, 16, 1, '#6a9a8a');
              for (let i = 0; i < 3; i++) { const x = 2 + i * 5;
                p(g, x, 4, 1, 6, '#3f8a3a'); p(g, x, 3, 1, 1, '#57b857'); }
              p(g, (v * 5) % 12, 12, 3, 1, '#8ab4c8'); } }
  };

  // roofDraw 扩展季节参数：冬季屋顶积雪覆盖
  function roofDraw(g, c1, c2, season, weather) {
    season = season || 'spring'; weather = weather || '晴';
    p(g, 0, 0, 16, 16, c1);
    for (let y = 0; y < 16; y += 4) {
      p(g, 0, y + 3, 16, 1, c2);
      p(g, (y / 4 % 2) ? 3 : 9, y, 1, 3, c2);
      p(g, (y / 4 % 2) ? 9 : 3, y + 1, 1, 2, shade(c1, 1.15));
    }
    p(g, 0, 15, 16, 1, shade(c2, .8));
    // 冬季屋顶积雪：从顶部 1~2 层向下堆积雪，雪天更厚
    if (season === 'winter') {
      const thick = weather === '雪' ? 3 : (weather === '多云' ? 2 : 1);
      // 顶部积雪条（像屋檐堆雪的弧形堆积效果）
      p(g, 0, 0, 16, thick, '#ffffff');
      p(g, 0, thick, 16, 1, 'rgba(240,248,255,.7)');
      // 错落的雪堆尖（像素阶梯状）
      for (let x = 0; x < 16; x += 3) {
        const bump = ((x * 13) % 3);
        if (thick >= 2) p(g, x, thick + bump, 2, 1, '#ffffff');
        if (thick >= 3 && bump < 2) p(g, x + 1, thick + 1 + bump, 1, 1, '#f0f8ff');
      }
      // 屋檐下垂的小冰柱（雪天特供）
      if (thick >= 2) {
        for (let x = 2; x < 16; x += 5) {
          p(g, x, 15, 1, 1, 'rgba(200,230,255,.9)');
        }
      }
    }
    // 夏季雨天：屋顶潮湿加深色
    if (season === 'summer' && (weather === '小雨' || weather === '暴雨')) {
      g.globalAlpha = weather === '暴雨' ? .22 : .12;
      p(g, 0, 0, 16, 16, '#2a4060');
      g.globalAlpha = 1;
    }
  }

  // 木牌图块（按文字缓存）
  function plaqueTile(text) {
    const key = 'plaque_' + text;
    if (cache[key]) return cache[key];
    const c = cnv(TS, TS), g = c.getContext('2d');
    tiles.wall.draw(g, 0);
    p(g, 2, 4, 12, 8, '#7a4a26'); p(g, 3, 5, 10, 6, '#a06c3a');
    g.fillStyle = '#ffe9a8'; g.font = `bold ${text.length > 3 ? 7 : 9}px "Microsoft YaHei", sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 16, 17);
    cache[key] = c; return c;
  }

  const SOLID = new Set(Object.keys(tiles).filter(k => tiles[k].solid));
  const COUNTER = new Set(Object.keys(tiles).filter(k => tiles[k].counter));

  // getTile 扩展：支持季节 season + 季节内进度 progress + 天气 weather
  // 普通（非 seasonal）图块保持旧行为直接缓存；seasonal 按 4 维度组合缓存
  function getTile(name, v, season, progress, weather) {
    if (name.startsWith('plaque:')) return plaqueTile(name.slice(7));
    season = season || 'spring'; progress = progress == null ? 0 : progress; weather = weather || '晴';
    const t = tiles[name];
    if (!t) {
      const c0 = cnv(TS, TS), g0 = c0.getContext('2d');
      p(g0, 0, 0, 16, 16, '#f0f'); return c0;
    }
    if (!t.seasonal) {
      const key = 't_' + name + '_' + v;
      if (cache[key]) return cache[key];
      const c = cnv(TS, TS), g = c.getContext('2d');
      t.draw(g, v || 0);
      cache[key] = c; return c;
    }
    // 季节性图块：按 season + 天气缓存（progress 取 0.25 间隔分档以避免缓存爆炸）
    const pgBin = Math.max(0, Math.min(3, Math.floor(progress * 4)));
    const wBin = (weather === '小雨' || weather === '暴雨') ? 'rain' : (weather === '雪' ? 'snow' : 'fine');
    const key = 't_' + name + '_' + v + '_' + season + '_' + pgBin + '_' + wBin;
    if (cache[key]) return cache[key];
    const c = cnv(TS, TS), g = c.getContext('2d');
    t.draw(g, v || 0, season, progress, weather);
    cache[key] = c; return c;
  }

  /* ==================== 角色行走图 ====================
   * 3 帧 × 4 向（下/左/右/上），帧尺寸 32×44（16×22 单位）
   * pose：可选动作姿势（挥手/捧书/大哭……），见 drawPoseOver
   */
  function drawCharFrame(g, ox, oy, dir, f, P, pose) {
    pose = POSE_LIST.includes(pose) ? pose : null;
    const A = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(ox + x * U, oy + y * U, w * U, h * U); };
    const MIR = dir === 'right';
    const X = (x, w) => MIR ? 16 - x - w : x;          // 右向 = 左向镜像
    const S = (x, y, w, h, c) => A(X(x, w), y, w, h, c);
    const side = dir === 'left' || dir === 'right';
    const bob = pose === 'sleep' ? 1 : (f === 0 ? 0 : -1);   // 行走起伏；瞌睡时头下垂
    const sw = pose ? 0 : (f === 1 ? 1 : f === 2 ? -1 : 0);  // 摆臂（姿势时手臂由姿势层绘制）
    const lf = pose ? 0 : f;                                 // 姿势时双腿并拢站立
    const hair = P.hair, skin = P.skin, shirt = P.shirt, shirt2 = P.shirt2 || shade(P.shirt, .8);
    const pants = P.pants, shoe = P.shoe || '#333', eye = '#26232a';
    const EYE_Y = 5 + bob;

    // —— 头部 ——
    if (dir === 'up') {                                 // 背面：头发覆盖
      A(3, 1 + bob, 10, 8, hair);
      A(3, 7 + bob, 10, 2, shade(hair, .85));
      if (P.style === 'long') { A(2, 3 + bob, 1, 8, hair); A(13, 3 + bob, 1, 8, hair); }
      if (P.style === 'buns') { A(1, 1 + bob, 2, 2, hair); A(13, 1 + bob, 2, 2, hair); }
      if (P.cap) { A(3, 1 + bob, 10, 3, P.cap); A(3, 3 + bob, 10, 1, shade(P.cap, .8)); }
    } else if (side) {
      S(3, 1 + bob, 10, 8, skin);
      S(3, 1 + bob, 10, 2, hair);                       // 刘海
      S(3, 3 + bob, 2, 1, hair);
      S(11, 2 + bob, 3, 5, hair);                       // 后脑勺
      if (P.style === 'long') S(13, 2 + bob, 1, 8, hair);
      if (P.style === 'buns') S(13, 0 + bob, 2, 2, hair);
      if (P.style === 'spiky') { S(4, 0 + bob, 1, 1, hair); S(7, 0 + bob, 1, 1, hair); S(10, 0 + bob, 1, 1, hair); }
      S(4, EYE_Y, 1, 2, eye); S(7, EYE_Y, 1, 2, eye);   // 侧向双眼（偏前）
      if (P.glasses) { S(3, EYE_Y - 1, 3, 1, '#2a2a3a'); S(6, EYE_Y - 1, 3, 1, '#2a2a3a'); S(6, EYE_Y, 1, 1, '#2a2a3a'); }
      if (P.beard) S(4, 7 + bob, 5, 3, '#e8e8e8');
      if (P.cap) { S(3, 1 + bob, 10, 2, P.cap); S(1, 3 + bob, 4, 1, shade(P.cap, .8)); }
    } else {                                            // 正面
      A(3, 1 + bob, 10, 8, skin);
      A(3, 1 + bob, 10, 2, hair);
      A(3, 3 + bob, 2, 1, hair); A(11, 3 + bob, 2, 1, hair);
      if (P.style === 'long') { A(2, 2 + bob, 1, 7, hair); A(13, 2 + bob, 1, 7, hair); }
      if (P.style === 'buns') { A(1, 1 + bob, 2, 2, hair); A(13, 1 + bob, 2, 2, hair); }
      if (P.style === 'spiky') { A(4, 0 + bob, 1, 1, hair); A(7, 0 + bob, 1, 1, hair); A(10, 0 + bob, 1, 1, hair); }
      A(5, EYE_Y, 1, 2, eye); A(10, EYE_Y, 1, 2, eye);
      if (P.glasses) { A(4, EYE_Y - 1, 3, 1, '#2a2a3a'); A(9, EYE_Y - 1, 3, 1, '#2a2a3a'); A(7, EYE_Y, 2, 1, '#2a2a3a'); }
      if (P.beard) { A(5, 7 + bob, 6, 3, '#e8e8e8'); A(7, 7 + bob, 2, 1, skin); }
      if (P.cap) { A(3, 1 + bob, 10, 2, P.cap); A(3, 3 + bob, 10, 1, shade(P.cap, .8)); }
    }

    // —— 躯干与四肢 ——
    if (side) {
      S(6, 9 + bob, 4, 1, skin);                        // 颈
      S(4, 10, 8, 5, shirt); S(4, 14, 8, 1, shirt2);
      if (P.coat) { S(3, 10, 10, 7, '#f2f5f9'); S(7, 10, 1, 6, '#d5dbe6'); S(9, 10, 4, 7, '#e6ebf2'); }
      const armY = 10 + (f === 1 ? -1 : f === 2 ? 1 : 0);
      if (!pose) { S(6, armY, 2, 4, P.coat ? '#f2f5f9' : shirt); S(6, armY + 4, 2, 1, skin); }
      if (P.skirt) {
        S(4, 15, 8, 3, P.skirtC || pants);
        S(5, 18, 2, 2, skin); S(9, 18, 2, 2, skin);
        S(5, 20, 2, 1, shoe); S(9, 20, 2, 1, shoe);
      } else {
        const dk = shade(pants, .8);
        if (lf === 0) { S(5, 15, 3, 4, pants); S(9, 15, 3, 4, dk); S(5, 19, 3, 2, shoe); S(9, 19, 3, 2, shoe); }
        else if (lf === 1) { S(4, 15, 3, 4, pants); S(9, 15, 3, 4, dk); S(4, 19, 3, 2, shoe); S(9, 19, 3, 2, shoe); }
        else { S(6, 15, 3, 4, pants); S(8, 15, 3, 4, dk); S(6, 19, 3, 2, shoe); S(8, 19, 3, 2, shoe); }
      }
    } else {
      A(6, 9 + bob, 4, 1, skin);                        // 颈
      A(4, 10, 8, 5, shirt); A(4, 14, 8, 1, shirt2);
      if (P.coat) { A(3, 10, 10, 7, '#f2f5f9'); A(7, 10, 2, 6, '#d5dbe6'); A(4, 10, 3, 6, '#e6ebf2'); A(9, 10, 3, 6, '#e6ebf2'); }
      if (P.apron) { A(5, 11, 6, 5, '#f8f8fa'); A(6, 10, 4, 1, '#f8f8fa'); }
      if (dir === 'up' && P.pack) A(5, 10, 6, 4, P.pack);   // 背影书包
      if (!pose) {
        A(2, 10 + sw, 2, 4, P.coat ? '#f2f5f9' : shirt);  A(2, 14 + sw, 2, 1, skin);
        A(12, 10 - sw, 2, 4, P.coat ? '#f2f5f9' : shirt); A(12, 14 - sw, 2, 1, skin);
      }
      if (P.skirt) {
        A(4, 15, 8, 3, P.skirtC || pants);
        A(5, 18, 2, 2, skin); A(9, 18, 2, 2, skin);
        A(5, 20, 2, 1, shoe); A(9, 20, 2, 1, shoe);
      } else {
        if (lf === 0) { A(5, 15, 3, 4, pants); A(9, 15, 3, 4, pants); A(5, 19, 3, 2, shoe); A(9, 19, 3, 2, shoe); }
        else if (lf === 1) { A(5, 15, 3, 3, pants); A(5, 18, 3, 2, shoe); A(9, 15, 3, 4, pants); A(9, 19, 3, 2, shoe); }
        else { A(9, 15, 3, 3, pants); A(9, 18, 3, 2, shoe); A(5, 15, 3, 4, pants); A(5, 19, 3, 2, shoe); }
      }
    }

    // —— 动作姿势层（手臂 / 手持物 / 表情 / 汗泪 Zzz） ——
    if (pose) drawPoseOver(g, ox, oy, dir, f, P, pose);
  }

  const DIRS = ['down', 'left', 'right', 'up'];
  function makeCharSheet(P) {
    const key = 'char_' + JSON.stringify(P);
    if (cache[key]) return cache[key];
    const c = cnv(96, 176), g = c.getContext('2d');
    DIRS.forEach((d, r) => { for (let f = 0; f < 3; f++) drawCharFrame(g, f * 32, r * 44, d, f, P); });
    cache[key] = c; return c;
  }

  /* ==================== 动作姿势层 ====================
   * 复刻“人物动作包”参考图：举手打招呼 / 挥手 / 捧书阅读 /
   * 捂脸大哭 / 委屈抹泪 / 开怀大笑 / 瞌睡Zzz / 打哈欠 / 困惑汗 / 思考
   * 在基础身体之上叠画：姿势手臂 + 手持物 + 表情 + 汗/泪/Z 标记
   */
  const POSE_LIST = ['wave', 'raise', 'read', 'cry', 'sad', 'laugh', 'sleep', 'yawn', 'doubt', 'think',
    'cheer', 'salute', 'dance', 'shy'];

  function drawPoseOver(g, ox, oy, dir, f, P, pose) {
    const A = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(ox + x * U, oy + y * U, w * U, h * U); };
    const MIR = dir === 'right';
    const X = (x, w) => MIR ? 16 - x - w : x;
    const S = (x, y, w, h, c) => A(X(x, w), y, w, h, c);
    const skin = P.skin, eye = '#26232a';
    const armC = P.coat ? '#f2f5f9' : P.shirt;
    const front = dir === 'down', side = dir === 'left' || dir === 'right';
    const bob = pose === 'sleep' ? 1 : (f === 0 ? 0 : -1);
    const EY = 5 + bob;
    const pink = '#ffb3ba', tearC = '#7ec8f0', mouthC = '#c46a6a';
    const miniZ = (x, y) => { A(x, y, 3, 1, '#dfe9ff'); A(x + 2, y + 1, 1, 1, '#dfe9ff'); A(x, y + 2, 3, 1, '#dfe9ff'); };
    const miniZS = (x, y) => { S(x, y, 3, 1, '#dfe9ff'); S(x + 2, y + 1, 1, 1, '#dfe9ff'); S(x, y + 2, 3, 1, '#dfe9ff'); };
    // —— 表情工具（正面/侧面，重画眼睛区域） ——
    const happyEyes = () => {
      if (front) {
        A(5, EY, 1, 2, skin); A(10, EY, 1, 2, skin);
        A(5, EY + 1, 1, 1, eye); A(10, EY + 1, 1, 1, eye);
        A(4, 6 + bob, 1, 1, pink); A(11, 6 + bob, 1, 1, pink);
      } else if (side) {
        S(4, EY, 1, 2, skin); S(7, EY, 1, 2, skin);
        S(4, EY + 1, 1, 1, eye); S(7, EY + 1, 1, 1, eye);
        S(3, 6 + bob, 1, 1, pink);
      }
    };
    const closedEyes = () => {
      const c = '#6a5a4a';
      if (front) { A(5, EY, 1, 2, skin); A(10, EY, 1, 2, skin); A(5, EY + 1, 1, 1, c); A(10, EY + 1, 1, 1, c); }
      else if (side) { S(4, EY, 1, 2, skin); S(7, EY, 1, 2, skin); S(4, EY + 1, 1, 1, c); S(7, EY + 1, 1, 1, c); }
    };
    const smile = () => front ? A(7, 7 + bob, 2, 1, mouthC) : S(6, 7 + bob, 2, 1, mouthC);
    const frown = () => {
      if (front) { A(6, 8 + bob, 1, 1, mouthC); A(7, 7 + bob, 2, 1, mouthC); A(9, 8 + bob, 1, 1, mouthC); }
      else if (side) { S(5, 8 + bob, 1, 1, mouthC); S(6, 7 + bob, 2, 1, mouthC); }
    };
    const tear = (x, y) => front ? A(x, y, 1, 2, tearC) : S(x, y, 1, 2, tearC);

    switch (pose) {
      case 'wave': {                                  // 挥手打招呼
        const wy = [4, 3, 4][f];
        if (side) { S(5, wy + 1, 2, 4, armC); S(5, wy, 2, 1, skin); }
        else { A(12, wy + 1, 2, 4, armC); A(12, wy, 2, 1, skin);
               if (front) { A(2, 10, 2, 4, armC); A(2, 14, 2, 1, skin); } }
        happyEyes(); smile();
        break;
      }
      case 'raise': {                                 // 举手（提问/欢呼）
        if (side) { S(5, 2, 2, 4, armC); S(5, 1, 2, 1, skin); }
        else { A(12, 2, 2, 4, armC); A(12, 1, 2, 1, skin);
               if (front) { A(2, 10, 2, 4, armC); A(2, 14, 2, 1, skin); } }
        if (front) A(7, 7 + bob, 2, 1, '#8a4a4a');
        happyEyes();
        break;
      }
      case 'read': {                                  // 捧书阅读
        if (side) {
          S(7, 11, 2, 3, armC); S(8, 11, 4, 5, '#b84a5a');
          S(9, 12, 3, 3, '#efe6c8'); S(9, 13, 3, 1, '#b89a78');
        } else {
          A(4, 12, 2, 2, armC); A(10, 12, 2, 2, armC);
          A(4, 14, 2, 1, skin); A(10, 14, 2, 1, skin);
          A(5, 11, 6, 5, '#b84a5a'); A(6, 12, 4, 3, '#efe6c8');
          A(6, 13, 4, 1, '#b89a78');
          closedEyes();                              // 低头垂目
        }
        smile();
        break;
      }
      case 'cry': {                                   // 捂脸大哭
        const ty = [7, 9, 8][f];
        if (side) {
          S(4, 5 + bob, 3, 3, skin); S(5, 6 + bob, 1, 1, shade(skin, .9));
          tear(2, ty); tear(13, ty + 1);
        } else {
          A(4, 5 + bob, 3, 3, skin); A(9, 5 + bob, 3, 3, skin);
          A(5, 6 + bob, 1, 1, shade(skin, .9)); A(10, 6 + bob, 1, 1, shade(skin, .9));
          if (front) { A(7, 8 + bob, 2, 2, '#7a2a2a'); tear(2, ty); tear(13, ty + 1); }
        }
        break;
      }
      case 'sad': {                                   // 委屈抹泪
        const hy = 6 + bob - (f === 1 ? 1 : 0);
        if (side) { S(6, hy, 2, 2, skin); tear(3, 8 + bob); }
        else {
          A(9, hy, 2, 2, skin);
          if (front) { A(2, 10, 2, 4, armC); A(2, 14, 2, 1, skin); }
          tear(4, 8 + bob);
        }
        closedEyes(); frown();
        break;
      }
      case 'laugh': {                                 // 开怀大笑
        if (side) { S(5, 7, 2, 3, armC); S(5, 6, 2, 1, skin); }
        else {
          A(2, 8, 2, 3, armC); A(2, 7, 2, 1, skin);
          A(12, 8, 2, 3, armC); A(12, 7, 2, 1, skin);
        }
        happyEyes();
        if (front) { A(6, 7 + bob, 4, 2, '#8a3a3a'); A(7, 8 + bob, 2, 1, '#e88a8a'); }
        else if (side) { S(5, 7 + bob, 3, 2, '#8a3a3a'); }
        break;
      }
      case 'sleep': {                                 // 瞌睡 Zzz
        closedEyes();
        if (front) { A(7, 8 + bob, 2, 1, mouthC); miniZ(13, 2 + bob); if (f) miniZ(13, 0); }
        else if (side) { S(7, 8 + bob, 1, 1, mouthC); miniZS(12, 2); if (f) miniZS(12, 0); }
        else { miniZ(13, 2); if (f) miniZ(13, 0); }
        break;
      }
      case 'yawn': {                                  // 打哈欠
        const hy = 6 + bob - (f === 1 ? 1 : 0);
        if (side) { S(6, hy, 2, 2, skin); S(5, 7 + bob, 3, 2, '#8a4a4a'); tear(4, 7 + bob); }
        else {
          A(9, hy, 2, 2, skin);
          if (front) { A(2, 10, 2, 4, armC); A(2, 14, 2, 1, skin); A(6, 7 + bob, 4, 2, '#8a4a4a'); tear(11, 7 + bob); }
        }
        closedEyes();
        break;
      }
      case 'doubt': {                                 // 困惑冒汗
        const sy = 3 + (f === 2 ? 2 : 0);
        if (side) { S(5, 5, 2, 3, armC); S(5, 4, 2, 1, skin); S(12, sy, 1, 2, tearC); }
        else {
          A(12, 6, 2, 3, armC); A(12, 5, 2, 1, skin);
          if (front) { A(2, 10, 2, 4, armC); A(2, 14, 2, 1, skin); A(13, sy, 1, 2, tearC); }
          else A(13, sy, 1, 2, tearC);
        }
        if (front) A(7, 8 + bob, 1, 1, mouthC);
        break;
      }
      case 'think': {                                 // 托腮思考
        if (side) { S(7, 8 + bob, 2, 2, skin); S(12, 1, 1, 1, '#e8e8f0'); S(13, 2, 1, 1, '#e8e8f0'); }
        else {
          A(9, 8 + bob, 2, 2, skin); A(10, 10, 2, 2, armC);
          // 眼睛看向斜上方
          if (front) { A(5, EY, 1, 2, skin); A(10, EY, 1, 2, skin); A(5, EY, 1, 1, eye); A(10, EY, 1, 1, eye); }
          const dots = [[12, 1], [13, 2], [14, 3]];
          A(dots[f][0], dots[f][1], 1, 1, '#e8e8f0');
          A(dots[(f + 1) % 3][0], dots[(f + 1) % 3][1], 1, 1, '#e8e8f0');
        }
        break;
      }
      case 'cheer': {                                 // 欢呼跳跃（双臂高举挥动）
        const jy = [0, -1, 0][f], hy = [3, 1, 3][f];
        if (side) {
          S(5, hy + 1, 2, 4, armC); S(5, hy, 2, 1, skin);
          S(12, hy + 2, 2, 3, armC); S(12, hy + 1, 2, 1, skin);
        } else {
          A(2, hy + 1, 2, 4, armC); A(2, hy, 2, 1, skin);
          A(12, hy + 1, 2, 4, armC); A(12, hy, 2, 1, skin);
        }
        // 小跳：脚下补一层阴影分离感
        A(4, 21 + jy, 8, 1, 'rgba(0,0,0,.18)');
        happyEyes();
        if (front) { A(6, 7 + bob, 4, 2, '#8a3a3a'); A(7, 8 + bob, 2, 1, '#e88a8a'); }
        break;
      }
      case 'salute': {                                // 立正敬礼（右手齐眉）
        if (side) {
          S(5, 3, 2, 2, armC); S(6, 4, 3, 2, armC); S(8, 3, 1, 1, skin);
          S(12, 10, 2, 4, armC); S(12, 14, 2, 1, skin);
        } else {
          A(12, 3, 2, 2, armC); A(10, 4, 3, 2, armC); A(10, 3, 1, 1, skin);
          if (front) { A(2, 10, 2, 4, armC); A(2, 14, 2, 1, skin); }
        }
        closedEyes();
        if (front) A(7, 8 + bob, 2, 1, mouthC);
        break;
      }
      case 'dance': {                                 // 摇摆舞步（手臂斜上斜下交替）
        const sw2 = f === 1 ? 1 : -1;
        if (side) {
          S(5, 8 - sw2, 2, 3, armC); S(5, 7 - sw2, 2, 1, skin);
          S(12, 8 + sw2, 2, 3, armC); S(12, 7 + sw2, 2, 1, skin);
        } else {
          A(2, 8 + sw2, 2, 3, armC); A(2, 7 + sw2, 2, 1, skin);
          A(12, 8 - sw2, 2, 3, armC); A(12, 7 - sw2, 2, 1, skin);
        }
        happyEyes(); smile();
        A(14, 3, 2, 1, '#cfa8ff'); A(15, 1, 2, 1, '#cfa8ff');   // 飘出的音符
        break;
      }
      case 'shy': {                                   // 害羞捂脸（低头泛红晕）
        if (side) {
          S(4, 5 + bob, 3, 3, skin); S(11, 5 + bob, 3, 3, skin);
          S(4, 6 + bob, 1, 1, shade(skin, .92)); S(11, 6 + bob, 1, 1, shade(skin, .92));
        } else {
          A(4, 5 + bob, 3, 3, skin); A(9, 5 + bob, 3, 3, skin);
          A(5, 6 + bob, 1, 1, shade(skin, .92)); A(10, 6 + bob, 1, 1, shade(skin, .92));
        }
        if (front) { A(4, 7 + bob, 1, 2, pink); A(11, 7 + bob, 1, 2, pink); }  // 红晕
        break;
      }
    }
  }

  function makePoseSheet(P, pose) {
    const key = 'pose_' + JSON.stringify(P) + '_' + pose;
    if (cache[key]) return cache[key];
    const c = cnv(96, 176), g = c.getContext('2d');
    DIRS.forEach((d, r) => { for (let f = 0; f < 3; f++) drawCharFrame(g, f * 32, r * 44, d, f, P, pose); });
    cache[key] = c; return c;
  }

  /* ==================== 小猫行走图 ====================
   * pose: sleep(蜷睡 Zzz) / groom(舔毛) / play(追尾巴)
   */
  const CAT_POSES = ['sleep', 'groom', 'play'];

  function drawCatPose(g, ox, oy, f, C) {
    const A = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(ox + x * U, oy + y * U, w * U, h * U); };
    const body = C.body, dark = shade(C.body, .8), pink = '#ff9ab0';
    const zz = (x, y) => { A(x, y, 2, 1, '#dfe9ff'); A(x, y + 1, 1, 1, '#dfe9ff'); A(x, y + 2, 2, 1, '#dfe9ff'); };
    if (C.pose === 'sleep') {                          // 蜷成一团睡觉
      A(3, 9, 10, 4, body); A(4, 12, 8, 1, dark);
      A(4, 7, 5, 3, body); A(4, 6, 2, 1, body); A(7, 6, 2, 1, body);
      A(4, 6, 1, 1, dark); A(7, 6, 1, 1, dark);
      A(5, 8, 1, 1, '#6a5a4a'); A(7, 8, 1, 1, '#6a5a4a');   // 闭眼
      A(12, 11, 2, 2, dark); A(13, 10, 1, 1, dark);          // 尾巴收拢
      zz(12, 2); if (f === 2) zz(13, 0);
    } else if (C.pose === 'groom') {                   // 低头舔毛
      const hy = f === 1 ? 1 : 0;
      A(3, 7, 10, 5, body); A(4, 11, 8, 1, dark);
      A(5, 6 + hy, 6, 4, body); A(5, 5 + hy, 2, 1, body); A(9, 5 + hy, 2, 1, body);
      A(6, 8 + hy, 1, 1, '#26232a');
      A(9, 10, 2, 2, body); A(10, 12, 1, 1, pink);            // 抬爪 + 舌头
      A(13, 8, 2, 2, dark);
    } else {                                           // play：伏低身子准备扑
      const wag = f === 1 ? 1 : 0;
      A(4, 10, 8, 4, body);
      A(4, 8, 5, 4, body); A(4, 7, 2, 1, body); A(7, 7, 2, 1, body);
      A(6, 9, 1, 1, '#26232a');
      A(11, 8, 4, 3, body);                                    // 翘起的屁股
      A(13, 5 + wag, 2, 3, dark); A(14, 4 + wag, 1, 1, dark);  // 摆动的尾巴
      A(5, 13, 2, 1, dark); A(10, 13, 2, 1, dark);
    }
  }

  function drawCatFrame(g, ox, oy, dir, f, C) {
    if (C.pose) { drawCatPose(g, ox, oy, f, C); return; }
    const A = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(ox + x * U, oy + y * U, w * U, h * U); };
    const MIR = dir === 'right', X = (x, w) => MIR ? 16 - x - w : x;
    const S = (x, y, w, h, c) => A(X(x, w), y, w, h, c);
    const body = C.body, dark = shade(C.body, .8), pink = '#ff9ab0';
    const tailY = [10, 8, 10][f];
    if (dir === 'down') {
      A(3, 7, 10, 5, body); A(4, 12, 8, 1, dark);
      A(5, 2, 6, 5, body); A(5, 1, 2, 2, body); A(9, 1, 2, 2, body);
      A(5, 1, 2, 1, dark); A(9, 1, 2, 1, dark);
      A(6, 4, 1, 1, '#26232a'); A(9, 4, 1, 1, '#26232a'); A(7, 5, 2, 1, pink);
      A(13, tailY, 2, 2, dark);
    } else if (dir === 'up') {
      A(3, 7, 10, 5, body); A(4, 12, 8, 1, dark);
      A(5, 4, 6, 5, body); A(5, 3, 2, 2, body); A(9, 3, 2, 2, body);
      A(5, 3, 2, 1, dark); A(9, 3, 2, 1, dark);
      A(13, tailY, 2, 2, dark);
    } else {
      S(3, 8, 10, 5, body); S(12, 9, 2, 2, dark);
      S(2, 3, 6, 5, body); S(2, 2, 2, 2, body); S(6, 2, 2, 2, body);
      S(2, 2, 2, 1, dark); S(6, 2, 2, 1, dark);
      S(3, 5, 1, 1, '#26232a');
      S(8, 6, 4, 1, dark); S(9, 7, 2, 1, dark);
      S(13, tailY, 2, 2, dark);
    }
  }
  function makeCatSheet(C) {
    const key = 'cat_' + C.body + (C.pose ? '_' + C.pose : '');
    if (cache[key]) return cache[key];
    const c = cnv(96, 112), g = c.getContext('2d');   // 3 帧 × 4 向，帧 32×28
    DIRS.forEach((d, r) => { for (let f = 0; f < 3; f++) drawCatFrame(g, f * 32, r * 28, d, f, C); });
    cache[key] = c; return c;
  }

  /* ==================== 随行伙伴小精灵（三系圆滚滚小生物） ==================== */
  // 3 帧 × 4 向，帧 32×28，与 makeCatSheet 同规格（drawChar 可直接绘制）
  function makeBuddySheet(cr, shiny) {
    const key = 'buddy_' + cr.fam + (shiny ? '_s' : '');
    if (cache[key]) return cache[key];
    const c = cnv(96, 112), g = c.getContext('2d');
    const pal = shiny
      ? { body: '#ffd94c', dark: '#c8a020', belly: '#fff4c8', acc: '#ffffff' }
      : {
          虫: { body: '#7ac878', dark: '#4c8a4a', belly: '#c8e8b8', acc: '#ffe08a' },
          水: { body: '#6aa8e8', dark: '#3a6ab0', belly: '#c8e8ff', acc: '#a8d8ff' },
          兽: { body: '#d8a860', dark: '#a87840', belly: '#f8e8c8', acc: '#ffb890' }
        }[cr.fam] || { body: '#9ab090', dark: '#6a8060', belly: '#d8e8c8', acc: '#ffe08a' };
    DIRS.forEach((d, r) => { for (let f = 0; f < 3; f++) drawBuddyFrame(g, f * 32, r * 28, d, f, pal, cr.fam); });
    cache[key] = c; return c;
  }
  function drawBuddyFrame(g, ox, oy, dir, f, pal, fam) {
    const E = (x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
    const cx = ox + 16;
    const bounce = f === 0 ? 0 : 1;                     // 走路帧小跳
    const bodyY = oy + 14 + bounce;                     // 身体中心
    // 影子（跳起时略小）
    E(cx, oy + 23.5, f === 0 ? 7 : 6, 2, 'rgba(0,0,0,.18)');
    // 系别特征（画在身体后面：虫翅 / 兽尾）
    if (fam === '虫') {                                  // 背上小翅膀
      g.fillStyle = 'rgba(255,255,255,.55)';
      if (dir === 'up' || dir === 'down') { E(cx - 7, bodyY - 3 + (f === 1 ? -1 : 0), 3, 4.5, 'rgba(255,255,255,.55)'); E(cx + 7, bodyY - 3 + (f === 2 ? -1 : 0), 3, 4.5, 'rgba(255,255,255,.55)'); }
      else { E(cx + (dir === 'left' ? 5 : -5), bodyY - 4 + (f === 1 ? -1 : 0), 3.5, 4.5, 'rgba(255,255,255,.55)'); }
    } else if (fam === '兽') {                            // 卷卷小尾巴
      g.strokeStyle = pal.dark; g.lineWidth = 2; g.beginPath();
      const tx = dir === 'left' ? cx + 6 : dir === 'right' ? cx - 6 : cx + (dir === 'up' ? 0 : 6);
      const tyw = dir === 'up' ? bodyY + 4 : bodyY + 1;
      g.moveTo(tx, tyw); g.quadraticCurveTo(tx + (dir === 'right' ? -5 : 5), tyw - 7, tx + (dir === 'right' ? -1 : 1), tyw - 8);
      g.stroke();
    }
    // 脚（f=0 并拢；f=1 左前；f=2 右前）
    const footY = bodyY + 8;
    const step = f === 0 ? 0 : f === 1 ? -1.5 : 1.5;
    if (dir === 'left' || dir === 'right') {
      E(cx + 2, footY, 2.4, 1.8, pal.dark); E(cx - 3, footY + (f === 0 ? 0 : .8), 2.4, 1.8, pal.dark);
    } else {
      E(cx - 3.5, footY - (f === 1 ? step : 0), 2.4, 1.8, pal.dark);
      E(cx + 3.5, footY - (f === 2 ? -step : 0), 2.4, 1.8, pal.dark);
    }
    // 圆滚滚身体
    E(cx, bodyY, 7, 6, pal.body);
    E(cx, bodyY + 2.5, 4.5, 3, pal.belly);              // 肚皮
    if (fam === '水') {                                   // 背上水光点
      E(cx - 2.5, bodyY - 3.5, 1.3, 1, pal.acc);
      E(cx + 3, bodyY - 2.5, 1, .8, pal.acc);
    }
    // 系别特征（身体上面：触角 / 耳朵 / 尾鳍）
    if (fam === '虫') {                                   // 两根小触角
      g.strokeStyle = pal.dark; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(cx - 2.5, bodyY - 5); g.lineTo(cx - 4, bodyY - 9); g.stroke();
      g.beginPath(); g.moveTo(cx + 2.5, bodyY - 5); g.lineTo(cx + 4, bodyY - 9); g.stroke();
      E(cx - 4.4, bodyY - 9.6, 1.4, 1.4, pal.acc); E(cx + 4.4, bodyY - 9.6, 1.4, 1.4, pal.acc);
    } else if (fam === '兽') {                            // 圆耳朵
      E(cx - 4.5, bodyY - 5, 2.4, 2.4, pal.body); E(cx + 4.5, bodyY - 5, 2.4, 2.4, pal.body);
      E(cx - 4.5, bodyY - 5, 1.2, 1.2, pal.acc); E(cx + 4.5, bodyY - 5, 1.2, 1.2, pal.acc);
    } else if (fam === '水' && dir === 'up') {            // 背面小尾鳍
      E(cx, bodyY - 6, 2, 2.6, pal.acc);
    }
    // 脸：down 双眼；left/right 单眼；up 无脸
    if (dir === 'down') {
      E(cx - 2.8, bodyY - 1.5, 1.2, 1.5, '#26232a'); E(cx + 2.8, bodyY - 1.5, 1.2, 1.5, '#26232a');
      E(cx - 2.4, bodyY - 2, .4, .4, '#fff'); E(cx + 3.2, bodyY - 2, .4, .4, '#fff');
      g.fillStyle = pal.dark; g.fillRect(cx - .7, bodyY + 1.5, 1.4, 1);   // 小嘴
    } else if (dir === 'left' || dir === 'right') {
      const ex = cx + (dir === 'left' ? -3.2 : 3.2);
      E(ex, bodyY - 1.5, 1.2, 1.5, '#26232a'); E(ex + (dir === 'left' ? .4 : -.4), bodyY - 2, .4, .4, '#fff');
    }
  }

  /* ==================== 地图物件（高于角色的立体物） ==================== */
  function q(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); } // 直接像素坐标

  // makeTree 扩展季节参数：
  // 春季：绿叶 + 粉/白/红花朵簇（开花果）
  // 夏季：深绿浓密叶（夏日茂盛感）
  // 秋季：叶色按 progress 渐变绿→黄→橙→红，且边缘有落叶缺口
  // 冬季：枯枝（叶稀少/无） + 枝头积雪 + 少量常绿树（v%3=0 保留绿色）
  function makeTree(v, season, progress, weather) {
    season = season || 'spring'; progress = progress == null ? 0 : progress; weather = weather || '晴';
    const c = cnv(32, 64), g = c.getContext('2d');
    // 树干（所有季节共用，冬季微加深）
    const trunkDark = season === 'winter' ? '#5e371c' : '#7a4a26';
    const trunkMid  = season === 'winter' ? '#6e4826' : '#8f5c30';
    q(g, 13, 40, 6, 22, trunkDark); q(g, 13, 40, 2, 22, trunkMid); q(g, 17, 46, 2, 3, '#5e371c');
    const blob = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
    // 冬季（非 v%3===0 的常绿树）：枯枝 + 枝头积雪
    if (season === 'winter' && v % 3 !== 0) {
      // 树枝（咖啡色枯枝线条）
      g.strokeStyle = '#6a4a2a'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(16, 42); g.lineTo(6, 20); g.stroke();
      g.beginPath(); g.moveTo(16, 42); g.lineTo(26, 20); g.stroke();
      g.beginPath(); g.moveTo(16, 36); g.lineTo(10, 14); g.stroke();
      g.beginPath(); g.moveTo(16, 36); g.lineTo(22, 14); g.stroke();
      g.strokeStyle = '#7a5a36'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(6, 20); g.lineTo(2, 10); g.stroke();
      g.beginPath(); g.moveTo(26, 20); g.lineTo(30, 10); g.stroke();
      g.beginPath(); g.moveTo(10, 14); g.lineTo(6, 6); g.stroke();
      g.beginPath(); g.moveTo(22, 14); g.lineTo(26, 6); g.stroke();
      // 枝头积雪（每个分枝端点堆雪）
      const snowNodes = [[6, 20], [26, 20], [10, 14], [22, 14], [2, 10], [30, 10], [6, 6], [26, 6], [16, 8]];
      snowNodes.forEach(([x, y]) => {
        g.fillStyle = '#ffffff';
        g.beginPath(); g.arc(x, y, weather === '雪' ? 3 : 2, 0, Math.PI * 2); g.fill();
      });
      // 雪天：整树再覆盖一层薄霜
      if (weather === '雪') {
        g.globalAlpha = .5;
        [[4, 16], [28, 18], [14, 4], [18, 12]].forEach(([x, y]) => {
          g.fillStyle = '#f0f8ff'; g.fillRect(x, y, 2, 2);
        });
        g.globalAlpha = 1;
      }
    } else {
      // 有叶树：按季节选 palette
      let leafPal;
      if (season === 'summer') leafPal = ['#2a6a2e', '#3a8a3e', '#4aa84e'];
      else if (season === 'autumn') {
        // 4 档插值：按 progress 在 AUTUMN_LEAF_PALETTE 相邻两档间混合
        const raw = progress * 3;                      // 0..3
        const idx0 = Math.max(0, Math.min(3, Math.floor(raw)));
        const idx1 = Math.min(3, idx0 + 1);
        const t = raw - idx0;
        leafPal = [0, 1, 2].map(layer => mixColor(AUTUMN_LEAF_PALETTE[idx0][layer], AUTUMN_LEAF_PALETTE[idx1][layer], t));
      }
      else if (season === 'winter' && v % 3 === 0) {
        // 常绿树（松）：深绿偏暗
        leafPal = ['#2a5a30', '#3a7040', '#4a8850'];
      }
      else leafPal = ['#2f7a33', '#3f9a3f', '#57b857'];   // spring 嫩绿
      // 画叶 blob（7 个主球）
      blob(16, 18, 14, leafPal[0]); blob(9, 24, 9, leafPal[0]); blob(23, 24, 9, leafPal[0]);
      blob(16, 15, 11, leafPal[1]); blob(10, 22, 6, leafPal[1]); blob(22, 22, 6, leafPal[1]);
      blob(13, 10, 4, leafPal[2]); blob(20, 16, 3, leafPal[2]);
      // 秋季：随 progress 在叶边缘挖"落叶缺口"（擦除部分像素，模拟叶子掉了）
      if (season === 'autumn' && progress > 0.25) {
        const holes = Math.floor(progress * 7);
        const holeSpots = [[6, 18], [26, 18], [12, 6], [22, 28], [4, 26], [28, 26], [16, 30]];
        g.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < holes; i++) {
          const [hx, hy] = holeSpots[i];
          g.fillStyle = 'rgba(0,0,0,1)';
          g.beginPath(); g.arc(hx, hy, 2 + (i % 2), 0, Math.PI * 2); g.fill();
        }
        g.globalCompositeOperation = 'source-over';
      }
      // 春季：花朵点缀（粉/红/白，多位置散布，随 progress 越开越多）
      if (season === 'spring') {
        const bloomN = 3 + Math.floor(progress * 6);   // 3~9 朵
        const bloomSpots = [
          [8, 14, '#ffb8d0'], [24, 20, '#ffd060'], [14, 8, '#ffffff'],
          [20, 28, '#ff8ab0'], [6, 22, '#ffe05a'], [28, 14, '#b89af0'],
          [12, 24, '#ffb8d0'], [22, 10, '#ff8ab0'], [18, 18, '#ffffff']
        ];
        for (let i = 0; i < bloomN; i++) {
          const [fx, fy, fc] = bloomSpots[i];
          q(g, fx, fy, 2, 2, fc);
          if (progress > 0.5) q(g, fx, fy, 1, 1, '#ffffff');
        }
        // 小颗樱桃花瓣像素点散落（樱花树常年飘）
        if (progress > 0.7 || v === 99) {
          [[10, 12], [26, 24], [14, 30], [4, 18]].forEach(([x, y]) => q(g, x, y, 1, 1, '#ffe0ec'));
        }
      }
      // 夏季：红果/深色果点缀（果实成熟）
      if (season === 'summer' && v % 3 === 0) {
        q(g, 8, 14, 2, 2, '#c8303a'); q(g, 22, 20, 2, 2, '#c8303a');
        q(g, 16, 28, 2, 2, '#a01828'); q(g, 12, 22, 1, 1, '#e05058');
      }
      // 冬季常绿树：枝头薄雪
      if (season === 'winter' && v % 3 === 0 && v !== 99) {
        const snowThick = weather === '雪' ? 3 : 1;
        // 顶部雪盖
        g.fillStyle = '#ffffff';
        g.beginPath(); g.arc(16, 6, 3 + snowThick, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(9, 18, 1 + snowThick, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(23, 18, 1 + snowThick, 0, Math.PI * 2); g.fill();
        if (snowThick >= 2) {
          g.fillStyle = '#f0f8ff';
          [[13, 10], [20, 14], [10, 26], [24, 26]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
        }
      }
    }
    return c;
  }
  // lit=true 夜晚点亮（暖黄灯芯 + 外扩光晕）；lit=false 白天熄灯（发白的玻璃罩）
  function makeLamp(lit) {
    const c = cnv(32, 60), g = c.getContext('2d');
    q(g, 14, 10, 4, 46, '#3a3a44'); q(g, 10, 54, 12, 4, '#2c2c34');
    q(g, 8, 2, 16, 10, '#2c2c34');
    if (lit) {
      q(g, 10, 4, 12, 6, '#ffd98a');
      g.globalAlpha = .3; q(g, 6, 0, 20, 14, '#ffe9a8'); g.globalAlpha = 1;
    } else {
      q(g, 10, 4, 12, 6, '#c9d2dc');
      g.globalAlpha = .35; q(g, 11, 5, 4, 4, '#e8eef5'); g.globalAlpha = 1;
    }
    q(g, 8, 12, 16, 2, '#4a4a56');
    return c;
  }
  function makeBench() {
    const c = cnv(32, 30), g = c.getContext('2d');
    q(g, 2, 10, 28, 6, '#a06c3a'); q(g, 2, 10, 28, 2, '#b88048');
    q(g, 2, 18, 28, 3, '#8a5a2e');
    q(g, 4, 16, 3, 10, '#6a4423'); q(g, 25, 16, 3, 10, '#6a4423');
    q(g, 2, 4, 28, 5, '#a06c3a'); q(g, 4, 4, 3, 5, '#8a5a2e'); q(g, 25, 4, 3, 5, '#8a5a2e');
    return c;
  }
  function makeFountainFrame(f) {
    const c = cnv(64, 64), g = c.getContext('2d');
    g.fillStyle = '#c9ccd9'; g.beginPath(); g.arc(32, 34, 29, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#a8acb8'; g.beginPath(); g.arc(32, 36, 25, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#4d8de6'; g.beginPath(); g.arc(32, 36, 21, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5b9ce8'; g.beginPath(); g.arc(28, 33, 13, 0, Math.PI * 2); g.fill();
    q(g, 28, 18, 8, 18, '#b9bcc9'); q(g, 24, 14, 16, 6, '#cfd3e0'); // 中柱与水盆
    const dy = f === 0 ? 0 : 3;
    q(g, 31, 10 - dy, 2, 5, '#cfe8ff');                        // 水柱
    const drops = f === 0 ? [[20, 30], [42, 30], [26, 40], [38, 40]] : [[18, 34], [44, 34], [30, 44], [36, 28]];
    drops.forEach(([x, y]) => q(g, x, y, 2, 2, '#e8f6ff'));
    q(g, 12, 30, 3, 2, '#dfe3ec'); q(g, 49, 36, 3, 2, '#dfe3ec');
    return c;
  }
  function makeStoneDoor(open) {
    const c = cnv(64, 96), g = c.getContext('2d');
    // 石门框
    q(g, 0, 8, 64, 88, '#8a8f9e');
    q(g, 4, 12, 56, 84, '#9aa0b0');
    for (let y = 12; y < 96; y += 14) q(g, 4, y, 56, 2, '#7d8290');
    for (let i = 0; i < 4; i++) { q(g, 10 + i * 3, 26, 2, 6, '#7d8290'); q(g, 12 + i * 3, 44, 2, 6, '#7d8290'); }
    q(g, 8, 0, 48, 10, '#a8adb8'); q(g, 12, 2, 40, 4, '#8a8f9e');
    // 门体
    if (open) {
      q(g, 14, 20, 36, 76, '#1a1a2e');
      q(g, 16, 22, 32, 72, '#26264a');
      q(g, 24, 40, 3, 3, '#8af0e8'); q(g, 38, 56, 3, 3, '#8af0e8'); q(g, 28, 70, 3, 3, '#8af0e8');
      q(g, 20, 90, 24, 4, '#3a3a5e');
    } else {
      q(g, 14, 20, 36, 76, '#7d8290'); q(g, 16, 22, 32, 72, '#8a8f9e');
      q(g, 30, 22, 4, 72, '#7d8290'); q(g, 16, 22, 32, 3, '#9aa5b2');
      // 四个徽章凹槽（engine 会按进度叠加宝石）
      [[24, 42], [40, 42], [24, 60], [40, 60]].forEach(([x, y]) => {
        g.fillStyle = '#3a3a4a'; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#565664'; g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
      });
      q(g, 26, 84, 12, 4, '#6a6f7d');
    }
    return c;
  }
  function makeAltar(glow) {
    const c = cnv(64, 64), g = c.getContext('2d');
    q(g, 8, 24, 48, 34, '#9aa0b0'); q(g, 12, 28, 40, 28, '#8a8f9e');
    q(g, 8, 24, 48, 4, '#b4b9c4'); q(g, 12, 56, 8, 6, '#6a6f7d'); q(g, 44, 56, 8, 6, '#6a6f7d');
    // 中央水晶
    const cc = glow ? '#7af0e8' : '#8899cc', ch = glow ? '#d0fffa' : '#a8b8e0';
    q(g, 28, 10, 8, 12, cc); q(g, 30, 6, 4, 6, cc); q(g, 30, 8, 2, 8, ch);
    if (glow) {
      g.globalAlpha = .35; q(g, 20, 2, 24, 22, cc); g.globalAlpha = 1;
      q(g, 26, 0, 2, 2, '#fff'); q(g, 38, 14, 2, 2, '#fff'); q(g, 22, 18, 2, 2, '#fff');
    }
    return c;
  }
  function makePlant() {
    const c = cnv(32, 40), g = c.getContext('2d');
    q(g, 10, 26, 12, 10, '#b06a3a'); q(g, 10, 26, 12, 3, '#c97e48'); q(g, 9, 36, 14, 2, '#8a4f28');
    q(g, 13, 8, 6, 18, '#3f9a3f');
    g.fillStyle = '#4fae4f'; g.beginPath(); g.arc(10, 10, 6, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(22, 10, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#57b857'; g.beginPath(); g.arc(16, 5, 6, 0, Math.PI * 2); g.fill();
    return c;
  }
  function makeRock() {
    const c = cnv(32, 36), g = c.getContext('2d');
    g.fillStyle = '#9ca0aa'; g.beginPath(); g.arc(16, 22, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#b0b4be'; g.beginPath(); g.arc(13, 18, 7, 0, Math.PI * 2); g.fill();
    q(g, 10, 26, 12, 3, '#84888f');
    return c;
  }
  function makeStump() {
    const c = cnv(32, 34), g = c.getContext('2d');
    q(g, 8, 14, 16, 14, '#7a4a26'); q(g, 8, 14, 16, 3, '#9c6a38');
    g.fillStyle = '#c9a87a'; g.beginPath(); g.arc(16, 15, 8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#9c6a38'; g.beginPath(); g.arc(16, 15, 4, 0, Math.PI * 2); g.stroke();
    return c;
  }
  /* 矿道：矿石（tier 0 铜 / 1 铁 / 2 金 / 3 宝石，矿脉颜色区分） */
  function makeOre(tier) {
    const c = cnv(32, 36), g = c.getContext('2d');
    g.fillStyle = '#8a8e98'; g.beginPath(); g.arc(16, 22, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#9da1ab'; g.beginPath(); g.arc(13, 18, 7, 0, Math.PI * 2); g.fill();
    const vein = [['#d8843c', '#f0a45c'], ['#aab4c4', '#d0dae8'], ['#e8c04c', '#f8dc80'], ['#7ce0d8', '#c0f4ee']][tier | 0] || ['#d8843c', '#f0a45c'];
    [[8, 16], [18, 20], [12, 26], [21, 13]].forEach(([x, y], i) => {
      g.fillStyle = i % 2 ? vein[1] : vein[0];
      g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill();
    });
    return c;
  }
  /* 矿道：下行裂缝（黑黢黢的深缝，深处透一点暖光） */
  function makeCrack() {
    const c = cnv(32, 34), g = c.getContext('2d');
    g.fillStyle = '#3c3630'; g.beginPath(); g.ellipse(16, 20, 13, 10, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#14100c'; g.beginPath(); g.ellipse(16, 21, 9, 6, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#6a5a3c'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(6, 24); g.lineTo(16, 16); g.lineTo(26, 24); g.stroke();
    g.fillStyle = 'rgba(255,220,140,.5)';
    g.fillRect(14, 17, 4, 2); g.fillRect(16, 20, 2, 2);
    return c;
  }
  /* 矿道：出口绳索（洞顶垂下的粗麻绳 + 木横档） */
  function makeRope() {
    const c = cnv(32, 44), g = c.getContext('2d');
    q(g, 14, 0, 4, 36, '#a8865a');
    q(g, 15, 0, 1, 36, '#c8a878');
    [6, 16, 26].forEach(y => q(g, 8, y, 16, 4, '#8a6a42'));
    q(g, 12, 34, 8, 8, '#6a5a3c');                        // 底部石礅
    return c;
  }
  /* 矿道：运矿电梯（木横梁 + 铁滑轮 + 双吊缆 + 踏板，板上散两块矿石） */
  function makeElevator() {
    const c = cnv(32, 44), g = c.getContext('2d');
    q(g, 3, 0, 26, 5, '#8a6a46');                         // 顶部横梁
    q(g, 3, 0, 26, 2, '#a8865a');
    g.fillStyle = '#5a4a38'; g.beginPath(); g.arc(16, 9, 5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#9a8a72'; g.beginPath(); g.arc(16, 9, 2, 0, Math.PI * 2); g.fill();
    q(g, 9, 12, 2, 14, '#c8a878'); q(g, 21, 12, 2, 14, '#c8a878');   // 双吊缆
    q(g, 5, 26, 22, 7, '#a8865a');                        // 踏板
    q(g, 5, 26, 22, 2, '#c8a878');
    q(g, 9, 21, 5, 4, '#7a8a9a'); q(g, 19, 22, 4, 3, '#b0a060');     // 板上矿石点缀
    return c;
  }
  function makeScarecrow(fixed) {
    const c = cnv(32, 56), g = c.getContext('2d');
    q(g, 15, 14, 2, 40, '#8a6a46');                       // 立杆
    q(g, 6, 21, 20, 2, '#8a6a46');                        // 横杆
    q(g, 10, 23, 12, 13, '#c8a06a');                      // 稻草身
    q(g, 10, 26, 12, 1, '#b08a54'); q(g, 10, 31, 12, 1, '#b08a54');
    q(g, 8, 36, 3, 12, '#c8a06a'); q(g, 21, 36, 3, 12, '#c8a06a');   // 稻草手
    g.fillStyle = '#e8c890'; g.beginPath(); g.arc(16, 13, 8, 0, 7); g.fill();  // 草脸
    q(g, 13, 11, 2, 2, '#4a3a2a'); q(g, 18, 11, 2, 2, '#4a3a2a');
    q(g, 13, 16, 6, 2, '#8a5a3a');
    q(g, 7, 4, 18, 4, '#d8c070'); q(g, 5, 8, 22, 3, '#c8a05a');      // 斗笠
    q(g, 14, 0, 4, 4, '#c8a05a');
    if (fixed) {                                          // 翻新后：红围巾 + 亮草帽结
      q(g, 9, 18, 14, 3, '#d84a4a');
      q(g, 21, 18, 4, 8, '#d84a4a');
      q(g, 13, 3, 6, 2, '#e8b84a');
    }
    return c;
  }
  function makeSign(text) {
    const c = cnv(32, 44), g = c.getContext('2d');
    q(g, 14, 20, 4, 22, '#7a4a26');
    q(g, 1, 2, 30, 20, '#8a5a2e'); q(g, 3, 4, 26, 16, '#a06c3a');
    g.fillStyle = '#ffe9a8'; g.font = 'bold 8px "Microsoft YaHei", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 16, 12, 28);
    return c;
  }

  /* —— 交互点专属立牌：让 📸♥❓✦🚌🚲 从「文字木牌」变成一眼看懂的物件 —— */
  // 拍照点：三脚架上的相机
  function makeCameraSpot() {
    const c = cnv(32, 40), g = c.getContext('2d');
    q(g, 10, 20, 2, 18, '#7a5230'); q(g, 20, 20, 2, 18, '#7a5230'); q(g, 15, 20, 2, 18, '#8a5f38');   // 三脚架
    q(g, 7, 4, 8, 5, '#3a3f52');                                                                       // 取景器凸起
    q(g, 5, 8, 22, 13, '#3a3f52'); q(g, 6, 9, 20, 4, '#4a5068');                                       // 机身
    g.fillStyle = '#8fd8ff'; g.strokeStyle = '#1d2233'; g.lineWidth = 2;                               // 镜头
    g.beginPath(); g.arc(16, 15, 5, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#e8f6ff'; g.beginPath(); g.arc(14.5, 13.5, 1.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffd94c'; g.fillRect(23, 10, 3, 2);                                                 // 快门灯
    return c;
  }
  // 约会点：粉色爱心立牌
  function makeHeartSpot() {
    const c = cnv(32, 40), g = c.getContext('2d');
    q(g, 14, 18, 4, 20, '#8a5a2e');                                                                    // 立柱
    g.fillStyle = '#ff8fb3'; g.strokeStyle = '#c2557e'; g.lineWidth = 1.5;
    g.beginPath();                                                                                     // 心形
    g.moveTo(16, 10);
    g.bezierCurveTo(16, 4, 5, 4, 5, 11); g.bezierCurveTo(5, 17, 12, 20, 16, 25);
    g.bezierCurveTo(20, 20, 27, 17, 27, 11); g.bezierCurveTo(27, 4, 16, 4, 16, 10);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ffd3e0'; g.beginPath(); g.arc(11, 9, 1.6, 0, Math.PI * 2); g.fill();               // 高光
    return c;
  }
  // 怪谈点：歪斜的神秘紫牌（夜色问号）
  function makeMysterySpot() {
    const c = cnv(32, 44), g = c.getContext('2d');
    g.save(); g.translate(16, 22); g.rotate(-.09); g.translate(-16, -22);
    q(g, 14, 20, 4, 22, '#6b4222');
    q(g, 2, 2, 28, 20, '#4a3a5e'); q(g, 4, 4, 24, 16, '#5d4a75');
    g.fillStyle = '#c9b6ff'; g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('?', 16, 12);
    g.restore();
    return c;
  }
  // 采集/捕捉点：闪着星光的草簇
  function makePickupSpot() {
    const c = cnv(32, 26), g = c.getContext('2d');
    g.fillStyle = '#6da84e';
    g.beginPath();
    g.moveTo(4, 24); g.quadraticCurveTo(6, 12, 10, 18); g.quadraticCurveTo(12, 8, 16, 16);
    g.quadraticCurveTo(20, 8, 22, 18); g.quadraticCurveTo(26, 12, 28, 24);
    g.closePath(); g.fill();
    g.fillStyle = '#8fce6a';
    g.beginPath();
    g.moveTo(8, 24); g.quadraticCurveTo(11, 16, 14, 20); g.quadraticCurveTo(18, 14, 24, 24);
    g.closePath(); g.fill();
    [[8, 8], [22, 6], [16, 3]].forEach(([x, y], i) => {                                                // 星光
      const r = i === 2 ? 1.6 : 2;
      g.fillStyle = '#fff8c0';
      g.beginPath(); g.moveTo(x, y - r * 2); g.lineTo(x + r * .7, y - r * .7); g.lineTo(x + r * 2, y);
      g.lineTo(x + r * .7, y + r * .7); g.lineTo(x, y + r * 2); g.lineTo(x - r * .7, y + r * .7);
      g.lineTo(x - r * 2, y); g.lineTo(x - r * .7, y - r * .7); g.closePath(); g.fill();
    });
    return c;
  }
  // 校车站：蓝站牌 + 白色巴士
  function makeBusStopSign() {
    const c = cnv(32, 44), g = c.getContext('2d');
    q(g, 14, 8, 4, 34, '#5d6a85');                                                                     // 站杆
    q(g, 3, 2, 26, 16, '#3d5a9e'); q(g, 4, 3, 24, 7, '#4d6cb8');                                       // 站牌
    g.fillStyle = '#fff'; g.fillRect(7, 6, 18, 6);                                                     // 车身
    g.fillStyle = '#ffe27a'; g.fillRect(7, 9, 18, 3);                                                  // 车窗带
    g.fillStyle = '#2a2a3a';
    g.beginPath(); g.arc(11, 14, 2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(21, 14, 2, 0, Math.PI * 2); g.fill();                                         // 车轮
    return c;
  }
  // 车棚：停着一辆小自行车
  function makeBikeRack() {
    const c = cnv(32, 30), g = c.getContext('2d');
    q(g, 2, 4, 28, 3, '#7a8296'); q(g, 2, 7, 3, 6, '#5d6a85'); q(g, 27, 7, 3, 6, '#5d6a85');           // 棚架
    g.strokeStyle = '#c8d2e8'; g.lineWidth = 1.5;                                                      // 车轮
    g.beginPath(); g.arc(9, 22, 5, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(23, 22, 5, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(9, 22); g.lineTo(13, 15); g.lineTo(21, 15); g.lineTo(23, 22);              // 车架
    g.moveTo(13, 15); g.lineTo(16, 22); g.lineTo(9, 22); g.stroke();
    g.fillStyle = '#ff8fb3'; g.fillRect(15, 12, 6, 3);                                                 // 车座
    return c;
  }

  // 星之果实：金色五角星果实，带光晕（吃下永久 +10 精力上限）
  function makeStarFruit() {
    const c = cnv(32, 30), g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 14, 2, 16, 14, 14);      // 柔光底晕
    gr.addColorStop(0, 'rgba(255,236,150,.8)');
    gr.addColorStop(1, 'rgba(255,236,150,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 30);
    g.fillStyle = '#ffd94c'; g.strokeStyle = '#a86f1e'; g.lineWidth = 1.5;
    g.beginPath();                                                  // 五角星主体
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 5.5 : 10.5, a = -Math.PI / 2 + i * Math.PI / 5;
      const x = 16 + Math.cos(a) * r, y = 14 + Math.sin(a) * r;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#fff8d0';                                        // 高光
    g.beginPath(); g.arc(13, 11, 1.8, 0, Math.PI * 2); g.fill();
    return c;
  }

  // 农田地块：0 荒草 / 1 翻好的土 / 2 幼苗 / 3 可收获（watered=今天浇过土色更深；fert=施过肥；spk=装有洒水器）
  function makePlot(stage, watered, fert, spk) {
    const c = cnv(32, 24), g = c.getContext('2d');
    if (stage === 0) {                                    // 荒地：杂草石子
      q(g, 2, 8, 28, 14, '#7d9b4e');
      q(g, 5, 12, 3, 2, '#6b854a'); q(g, 14, 15, 4, 2, '#6b854a'); q(g, 23, 11, 3, 2, '#6b854a');
      g.fillStyle = '#5d7a3f';
      g.fillRect(8, 5, 1, 5); g.fillRect(19, 3, 1, 6); g.fillRect(25, 7, 1, 4);
    } else {
      q(g, 1, 6, 30, 16, watered ? '#4a3626' : '#6e5238');  // 翻松的土垄
      g.fillStyle = watered ? '#3d2c1e' : '#5d4530';
      for (let r = 0; r < 3; r++) g.fillRect(3, 9 + r * 4, 26, 1);
      if (fert) {                                         // 肥料：土面撒几点深绿肥粒
        g.fillStyle = '#33502f';
        g.fillRect(5, 18, 2, 1); g.fillRect(12, 20, 2, 1); g.fillRect(20, 19, 2, 1); g.fillRect(26, 18, 2, 1);
      }
      if (stage >= 2) {                                   // 幼苗 / 成熟植株
        for (const cx of [8, 16, 24]) {
          g.fillStyle = '#3f8f3f';
          g.fillRect(cx - 1, stage === 2 ? 4 : 1, 2, stage === 2 ? 5 : 7);
          g.fillRect(cx - 3, stage === 2 ? 5 : 3, 6, 2);
        }
      }
      if (stage === 3) {                                  // 沉甸甸的果实
        g.fillStyle = '#ffd94c';
        g.fillRect(6, 2, 4, 3); g.fillRect(14, 1, 4, 3); g.fillRect(22, 2, 4, 3);
      }
      if (spk) {                                          // 洒水器：田头的小喷头
        g.fillStyle = '#9aa3b8'; g.fillRect(25, 15, 5, 5);
        g.fillStyle = '#5d6578'; g.fillRect(26, 16, 3, 1);
        g.fillStyle = '#7ec8e8'; g.fillRect(27, 13, 1, 2); g.fillRect(25, 14, 1, 1); g.fillRect(29, 14, 1, 1);
      }
    }
    return c;
  }

  // 鸡舍：小木屋 + 门洞；养鸡后有小鸡探头
  function makeCoop(has) {
    const c = cnv(32, 40), g = c.getContext('2d');
    q(g, 3, 14, 26, 20, '#a06c3a');
    g.fillStyle = '#8a5a2e';
    for (let r = 0; r < 4; r++) g.fillRect(3, 18 + r * 4, 26, 1);
    g.fillStyle = '#7a4a26';
    g.beginPath(); g.moveTo(0, 14); g.lineTo(16, 2); g.lineTo(32, 14); g.closePath(); g.fill();
    g.fillStyle = '#5d3a1c'; g.fillRect(12, 24, 8, 10);   // 门洞
    if (has) {                                            // 小鸡探头
      g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(16, 30, 3.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#e8a13a'; g.fillRect(19.5, 29, 3, 1.5);
      g.fillStyle = '#2a2a3a'; g.fillRect(14.5, 29, 1, 1);
    }
    return c;
  }

  /* —— 牧场小屋（s5 畜牧）：牛棚 / 羊圈。入住前空着，住进后牲口探头 —— */
  function makeCowShed(has) {
    const c = cnv(32, 40), g = c.getContext('2d');
    q(g, 2, 14, 28, 20, '#b8845a');                       // 木板墙
    g.fillStyle = '#a06c3a';
    for (let r = 0; r < 4; r++) g.fillRect(2, 18 + r * 4, 28, 1);
    g.fillStyle = '#8a5a2e';
    g.beginPath(); g.moveTo(0, 14); g.lineTo(16, 3); g.lineTo(32, 14); g.closePath(); g.fill();
    g.fillStyle = '#5d3a1c'; g.fillRect(6, 22, 9, 12);    // 大门
    g.fillStyle = '#e8dcc8'; g.fillRect(20, 22, 8, 9);    // 干草槽
    g.fillStyle = '#d8b86a'; for (let r = 0; r < 3; r++) g.fillRect(20, 23 + r * 3, 8, 2);
    if (has) {                                            // 奶牛探头（黑白花）
      g.fillStyle = '#f4f0e8'; g.beginPath(); g.arc(24, 33, 4.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3a3630'; g.fillRect(21, 30, 3, 2); g.fillRect(25, 34, 3, 2);
      g.fillStyle = '#f0b0b0'; g.fillRect(23, 35, 3, 2);  // 粉鼻
      g.fillStyle = '#2a2a3a'; g.fillRect(21.5, 31.5, 1, 1); g.fillRect(26, 31.5, 1, 1);
    }
    return c;
  }
  function makeSheepPen(has) {
    const c = cnv(32, 34), g = c.getContext('2d');
    g.fillStyle = '#9a7a4a';                              // 木栅栏
    for (const x of [2, 14, 27]) g.fillRect(x, 10, 3, 20);
    g.fillRect(2, 13, 28, 2); g.fillRect(2, 24, 28, 2);
    if (has) {                                            // 小羊（白云一团）
      g.fillStyle = '#f4f2ea';
      [[9, 26], [16, 27], [23, 26]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = '#3a3630'; g.fillRect(7.5, 25, 1, 1); g.fillRect(21.5, 25, 1, 1);
      g.fillStyle = '#d8d4c8'; g.fillRect(15, 29, 2, 3);  // 小尾巴腿
    } else {
      g.fillStyle = '#c8b88a'; g.fillRect(8, 24, 12, 4);  // 空圈的干草
    }
    return c;
  }

  // 虫鸣点：嗡嗡作响的高草丛；今日捕过后虫子躲起来（caught = 只剩草）
  function makeBuzz(caught) {
    const c = cnv(32, 30), g = c.getContext('2d');
    const blades = [[4, 12], [9, 17], [14, 11], [19, 16], [24, 12], [28, 9]];
    for (const [x, h] of blades) {                        // 高草丛（两色分层）
      g.fillStyle = '#5d8a3a'; g.fillRect(x, 30 - h, 2, h);
      g.fillStyle = '#6fa34a'; g.fillRect(x + 2, 30 - h + 3, 1, h - 3);
    }
    g.fillStyle = '#4c7430';
    g.fillRect(6, 26, 20, 2);                             // 草根阴影
    if (!caught) {                                        // 草尖上的七星瓢虫
      g.fillStyle = '#e84a4a';
      g.beginPath(); g.arc(15, 11, 3.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2a2a3a';
      g.fillRect(14.5, 8, 1, 6);                          // 翅缝
      g.fillRect(12, 10, 1.4, 1.4); g.fillRect(17, 12, 1.4, 1.4);
      g.fillRect(14.5, 7, 3, 1);                          // 头
    }
    return c;
  }

  // 生物窝点：有小脚印的小兽洞口，旁边草叶微动；今日惊扰后（quiet）脚印被踩平、草垂下来
  function makeCritterBurrow(quiet) {
    const c = cnv(32, 30), g = c.getContext('2d');
    g.fillStyle = '#4c7430'; g.fillRect(4, 26, 24, 2);      // 根部草地阴影
    const blades = [[3, 9], [7, 13], [25, 12], [28, 8]];    // 洞口两侧高草
    for (const [x, h] of blades) {
      g.fillStyle = quiet ? '#5d8a3a' : '#6fa34a'; g.fillRect(x, 30 - h, 2, h);
      g.fillStyle = quiet ? '#4c7430' : '#82b557'; g.fillRect(x + 2, 30 - h + 3, 1, h - 3);
    }
    // 洞口：黑黢黢的小土窝，边缘一圈新翻的土
    g.fillStyle = '#8a6b42'; g.beginPath(); g.ellipse(16, 24, 9, 5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2e2418'; g.beginPath(); g.ellipse(16, 24, 6.5, 3.4, 0, 0, Math.PI * 2); g.fill();
    if (!quiet) {
      g.fillStyle = 'rgba(255,255,255,.25)';                 // 洞口微光：里面有小家伙
      g.beginPath(); g.arc(14, 23, 1.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#a98d5f';                               // 门口两串小脚印
      for (const [px, py] of [[8, 20], [10.5, 18], [21, 20], [23.5, 18]]) {
        g.beginPath(); g.ellipse(px, py, 1.5, 1.1, 0, 0, Math.PI * 2); g.fill();
        g.fillRect(px - 1.2, py - 2.4, 1, 1); g.fillRect(px + .4, py - 2.4, 1, 1);
      }
      g.fillStyle = '#ffd94c';                               // 草尖上一点悬疑的亮
      g.fillRect(26, 9, 2, 2);
    }
    return c;
  }

  /* ==================== 体育与校园新物件 ==================== */
  function makeGoal() {                              // 足球门（2 格宽）
    const c = cnv(64, 44), g = c.getContext('2d');
    q(g, 2, 4, 4, 36, '#f2f5f9'); q(g, 58, 4, 4, 36, '#f2f5f9');
    q(g, 2, 2, 60, 4, '#f2f5f9'); q(g, 2, 2, 60, 1, '#d5dbe6');
    g.strokeStyle = 'rgba(240,240,250,.65)'; g.lineWidth = 1;   // 球网
    for (let i = 0; i < 11; i++) { g.beginPath(); g.moveTo(6 + i * 5, 6); g.lineTo(6 + i * 5, 39); g.stroke(); }
    for (let j = 0; j < 7; j++) { g.beginPath(); g.moveTo(4, 8 + j * 5); g.lineTo(60, 8 + j * 5); g.stroke(); }
    q(g, 28, 32, 8, 8, '#f8f8fc');                                // 足球
    g.strokeStyle = '#2a2a3a'; g.beginPath(); g.arc(32, 36, 4, 0, Math.PI * 2); g.stroke();
    q(g, 31, 35, 2, 2, '#2a2a3a');
    return c;
  }
  function makeBleachers() {                         // 看台（三级台阶 + 小旗）
    const c = cnv(64, 46), g = c.getContext('2d');
    const rows = [['#8a94b0', 30, 16], ['#9aa4c0', 16, 8], ['#aab4d0', 2, 0]];
    rows.forEach(([col, y]) => { q(g, 0, y, 64, 14, col); q(g, 0, y + 12, 64, 2, shade(col, .7)); });
    for (let i = 0; i < 4; i++) {                                 // 台面上的观众彩点
      q(g, 6 + i * 15, 24 + (i % 2) * 2, 6, 6, ['#e8963a', '#5ab87a', '#e85a7a', '#5a8aff'][i]);
      q(g, 7 + i * 15, 21 + (i % 2) * 2, 4, 4, '#ffd9b3');
    }
    [[4, '#e85a5a'], [32, '#ffd94c'], [56, '#5ab87a']].forEach(([x, col]) => {   // 插旗
      q(g, x, 2, 1, 10, '#6a4423');
      g.fillStyle = col; g.beginPath(); g.moveTo(x + 1, 2); g.lineTo(x + 9, 5); g.lineTo(x + 1, 8); g.closePath(); g.fill();
    });
    return c;
  }
  function makeFlagpole() {                          // 升旗台（旗杆 + 红旗）
    const c = cnv(32, 62), g = c.getContext('2d');
    q(g, 6, 46, 20, 14, '#c9ccd9'); q(g, 6, 46, 20, 3, '#dfe3ec'); q(g, 8, 44, 16, 2, '#a8acb8');
    q(g, 15, 2, 2, 44, '#d8dce8'); q(g, 14, 2, 4, 2, '#ffd94c');
    q(g, 17, 5, 12, 8, '#e83a4a'); q(g, 21, 7, 4, 4, '#ffd94c');
    return c;
  }
  // makeFlowerbed 扩展季节参数：
  // 春季：樱花+迎春+二月兰+郁金香等多品类组合，progress 控制生长阶段（花苞→半开→盛放）
  // 夏季：太阳花+矮牵牛+睡莲，花朵更大更艳
  // 秋季：菊花+金盏菊为主，偏橙黄红，部分开始枯萎
  // 冬季：保留少量耐寒羽衣甘蓝紫叶，其余雪覆盖花坛土面
  function makeFlowerbed(season, progress, weather) {
    season = season || 'spring'; progress = progress == null ? 0 : progress; weather = weather || '晴';
    const c = cnv(64, 36), g = c.getContext('2d');
    // 花坛砖沿（所有季节共用）
    q(g, 0, 12, 64, 22, '#8a5a2e'); q(g, 2, 14, 60, 18, '#5a3a1e');
    q(g, 0, 12, 64, 3, '#a06c3a');
    // 花坛土壤层（季节变化：冬有雪覆盖，秋偏干黄）
    let soilC = '#4a8a3a', soilHC = '#5aa048';
    if (season === 'autumn') { soilC = mixColor('#4a8a3a', '#8a6a3a', progress); soilHC = mixColor('#5aa048', '#a08048', progress); }
    if (season === 'winter') { soilC = '#d0d8e0'; soilHC = '#e0e8f0'; }
    q(g, 2, 10, 60, 4, soilC);
    // 生长阶段：0~0.3 花苞（矮+小圆），0.3~0.7 半开（中等花），0.7~1 盛放（大花+花心）
    const stage = progress < 0.3 ? 0 : (progress < 0.7 ? 1 : 2);
    // 按季节选花簇配色
    let seasonFlowers;
    if (season === 'spring') {
      seasonFlowers = [
        [8,  '#ffb8d0'],   // 樱花粉
        [20, '#ffe05a'],   // 迎春黄
        [32, '#b89af0'],   // 二月兰紫
        [44, '#ff7a6a'],   // 郁金香红
        [54, '#ffffff']    // 白铃兰
      ];
    } else if (season === 'summer') {
      seasonFlowers = [
        [8,  '#ffd050'],   // 太阳花
        [20, '#ff5a8a'],   // 矮牵牛粉
        [32, '#7ae0c8'],   // 睡莲青
        [44, '#ffa040'],   // 孔雀草橙
        [54, '#e05af0']    // 大丽花粉紫
      ];
    } else if (season === 'autumn') {
      seasonFlowers = [
        [8,  '#e8a030'],   // 金盏菊
        [20, '#c85030'],   // 菊花红
        [32, '#f0c060'],   // 黄菊
        [44, '#a870c0'],   // 紫菀
        [54, '#e06020']    // 硫华菊
      ];
    } else {  // winter
      seasonFlowers = [
        [8,  '#8060b0'],   // 羽衣甘蓝紫
        [20, '#70a0b0'],   // 蓝松
        [32, '#a0a0c0'],   // 银叶菊
        [44, '#9070b0'],   // 紫甘蓝
        [54, '#c0c0d0']    // 雪叶莲
      ];
    }
    // 绘制每一株花（按 stage 控制大小和花茎高度）
    seasonFlowers.forEach(([x, col], i) => {
      const yoff = (i % 2);
      const stemH = [4, 6, 7][stage];       // 花茎高度随生长阶段递增
      const fw = [3, 5, 6][stage];          // 花朵宽度：花苞→半开→盛放
      const fh = [2, 3, 4][stage];
      // 秋冬：部分花随 progress 枯萎（跳过绘制，模拟凋零）
      if (season === 'autumn' && progress > 0.5 && i % 2 === 0) return;
      if (season === 'winter' && weather !== '雪' && i % 3 !== 0) return;  // 冬季只保留耐寒品种
      // 花茎
      q(g, x, 4 + yoff + (7 - stemH), 2, stemH, season === 'winter' ? '#7088a0' : '#4a8a3a');
      // 花瓣
      q(g, x - Math.floor(fw / 2), 2 + yoff + (7 - stemH), fw, fh, col);
      // 盛放阶段加花心白 + 小叶子
      if (stage === 2) {
        q(g, x, 2 + yoff + (7 - stemH), 2, 2, '#fff');
        if (i % 2 === 0) q(g, x - 3, 5 + yoff + (7 - stemH), 2, 1, season === 'winter' ? '#80a0b0' : '#3f8030');
      }
    });
    // 冬季花坛表面：积雪覆盖（薄/中/厚按天气+progress）
    if (season === 'winter') {
      const snowT = weather === '雪' ? 3 : (progress > 0.5 ? 2 : 1);
      g.fillStyle = '#ffffff';
      g.fillRect(2, 10, 60, snowT);
      if (snowT >= 2) {
        g.fillStyle = '#f0f8ff';
        for (let i = 0; i < 6; i++) g.fillRect(4 + i * 10, 10 + snowT, 4, 1);
      }
    }
    return c;
  }
  function makeBoard() {                             // 宣传栏（光荣榜告示板）
    const c = cnv(64, 44), g = c.getContext('2d');
    q(g, 6, 36, 4, 6, '#6a4423'); q(g, 54, 36, 4, 6, '#6a4423');
    q(g, 0, 2, 64, 34, '#8a5a2e'); q(g, 4, 6, 56, 26, '#f4efe0');
    q(g, 4, 6, 56, 6, '#ffd94c'); q(g, 4, 11, 56, 1, '#c8a83a');
    g.fillStyle = '#8a5a2e'; g.font = 'bold 7px "Microsoft YaHei", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('光荣榜', 32, 9, 40);
    for (let i = 0; i < 3; i++) { q(g, 8, 16 + i * 5, 44, 2, i === 0 ? '#e85a5a' : '#b8b0a0'); }
    return c;
  }
  function makeSandpit() {                           // 跳远沙坑（耙痕 + 起跳板）
    const c = cnv(64, 32), g = c.getContext('2d');
    q(g, 0, 4, 64, 26, '#e8d8a8'); q(g, 0, 4, 64, 2, '#d8c088');
    q(g, 0, 4, 6, 26, '#c8783a'); q(g, 0, 4, 6, 2, '#a8602a');   // 起跳板
    for (let i = 0; i < 5; i++) q(g, 12 + i * 10, 8, 2, 18, '#dcc490');  // 耙痕
    return c;
  }
  function makeFlags() {                             // 一串三角彩旗（跨格装饰）
    const c = cnv(64, 30), g = c.getContext('2d');
    g.strokeStyle = '#d8dce8'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, 6); g.quadraticCurveTo(32, 14, 64, 6); g.stroke();
    const cols = ['#e85a5a', '#ffd94c', '#5ab87a', '#5a8aff', '#b98af5', '#ff8ab0'];
    cols.forEach((col, i) => {
      const x = 3 + i * 10, y = 6 + Math.sin((i / 5) * Math.PI) * 6;
      g.fillStyle = col;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y); g.lineTo(x + 4, y + 8); g.closePath(); g.fill();
    });
    return c;
  }

  function makeHoop() {
    const c = cnv(32, 56), g = c.getContext('2d');
    q(g, 14, 26, 4, 26, '#5a5f6e'); q(g, 8, 50, 16, 4, '#44495a');
    q(g, 4, 4, 24, 18, '#e8e8f0'); q(g, 6, 6, 20, 14, '#f8f8fc');
    q(g, 6, 12, 20, 2, '#e85a5a'); q(g, 14, 6, 2, 14, '#e85a5a');
    g.strokeStyle = '#e8963a'; g.lineWidth = 3;
    g.beginPath(); g.arc(16, 27, 9, 0, Math.PI); g.stroke();
    g.strokeStyle = 'rgba(240,240,250,.8)'; g.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      g.beginPath(); g.moveTo(9 + i * 5, 31); g.lineTo(11 + i * 4, 41); g.stroke();
    }
    return c;
  }
  function makePiano() {
    const c = cnv(64, 44), g = c.getContext('2d');
    q(g, 2, 6, 60, 32, '#26232e'); q(g, 4, 4, 56, 6, '#3a3644');
    q(g, 6, 26, 52, 10, '#f0ede4');
    for (let i = 1; i < 13; i++) q(g, 6 + i * 4, 26, 1, 10, '#b8b4ac');
    for (let i = 0; i < 5; i++) q(g, 10 + i * 11, 26, 3, 6, '#26232e');
    q(g, 2, 38, 60, 4, '#1a1820'); q(g, 58, 8, 4, 18, '#8a5ad9');
    return c;
  }
  function makeChest(open) {
    const c = cnv(32, 30), g = c.getContext('2d');
    if (open) {
      q(g, 4, 0, 24, 8, '#8a5a2e'); q(g, 4, 0, 24, 3, '#a06c3a');
      q(g, 6, 10, 20, 16, '#a06c3a'); q(g, 6, 10, 20, 2, '#c98d4e');
      q(g, 9, 12, 14, 6, '#ffd94c'); q(g, 12, 13, 3, 3, '#fff'); q(g, 18, 14, 2, 2, '#fff');
      q(g, 6, 24, 20, 2, '#7a4a26');
    } else {
      q(g, 4, 8, 24, 8, '#a06c3a'); q(g, 4, 8, 24, 3, '#c98d4e');
      q(g, 4, 16, 24, 10, '#8a5a2e'); q(g, 4, 16, 24, 2, '#a06c3a');
      q(g, 14, 12, 4, 8, '#ffd94c'); q(g, 15, 15, 2, 2, '#7a5a10');
      q(g, 6, 18, 2, 6, '#c98d4e'); q(g, 24, 18, 2, 6, '#c98d4e');
    }
    return c;
  }
  /* ---- 寻宝迷宫：答题祭坛 / 符文石门 / BOSS大宝箱 ---- */
  // code = tier*2 + lit（tier: 0铜/1银/2金；lit: 答题成功后点亮）
  function makeQuizAltar(code) {
    code = code | 0;
    const tier = code >> 1, lit = !!(code & 1);
    const c = cnv(32, 44), g = c.getContext('2d');
    const gem = [['#c98d5a', '#e8b88a'], ['#c0cad8', '#f0f6ff'], ['#e0b84c', '#ffe9a8']][tier] || ['#c98d5a', '#e8b88a'];
    // 石座
    q(g, 4, 24, 24, 14, '#7d8290'); q(g, 4, 24, 24, 3, '#9aa0b0');
    q(g, 8, 29, 16, 7, '#8a8f9e');
    q(g, 2, 38, 28, 4, '#6a6f7d');
    // 顶部宝石球（铜/银/金三档色调）
    g.fillStyle = gem[0]; g.beginPath(); g.arc(16, 15, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = gem[1]; g.beginPath(); g.arc(13, 12, 4, 0, Math.PI * 2); g.fill();
    q(g, 12, 22, 8, 3, '#5a5e6a');
    if (lit) {                                   // 点亮：柔光 + 星屑
      g.globalAlpha = .35; g.fillStyle = gem[1];
      g.beginPath(); g.arc(16, 15, 13, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
      q(g, 6, 8, 2, 2, '#fff'); q(g, 25, 12, 2, 2, '#fff'); q(g, 10, 3, 2, 2, '#fff');
    }
    return c;
  }
  function makeSealGate(open) {                  // 最深处符文石门（铜/银/金三枚钥匙凹槽）
    const c = cnv(64, 80), g = c.getContext('2d');
    q(g, 0, 4, 64, 76, '#6e7484'); q(g, 4, 8, 56, 72, '#7d8290');
    for (let y = 8; y < 80; y += 12) q(g, 4, y, 56, 2, '#6e7484');
    q(g, 6, 0, 52, 6, '#8a8f9e');
    if (open) {                                  // 开启：黑洞口 + 漂浮光点
      q(g, 12, 14, 40, 66, '#141222'); q(g, 16, 16, 32, 62, '#1e1c30');
      q(g, 22, 30, 3, 3, '#8af0e8'); q(g, 38, 44, 3, 3, '#8af0e8'); q(g, 28, 62, 3, 3, '#ffd94c');
      q(g, 18, 74, 28, 4, '#2a2842');
    } else {
      q(g, 12, 14, 40, 66, '#848a98'); q(g, 16, 16, 32, 62, '#8a8f9e');
      q(g, 28, 14, 8, 3, '#6e7484');
      // 三枚凹槽宝石：铜/银/金（对应三把钥匙）
      [[32, 33, '#c98d5a'], [32, 49, '#c0cad8'], [32, 65, '#e0b84c']].forEach(([x, y, col]) => {
        g.fillStyle = '#3a3e4a'; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill();
        g.fillStyle = col; g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
      });
    }
    return c;
  }
  function makeBossChest(open) {                 // 洞窟最深处的大宝箱（月光结晶锁）
    const c = cnv(48, 40), g = c.getContext('2d');
    if (open) {
      q(g, 4, 0, 40, 10, '#c9952e'); q(g, 4, 0, 40, 4, '#e8b84c');
      q(g, 6, 12, 36, 24, '#d9a83e'); q(g, 6, 12, 36, 3, '#f0cc60');
      q(g, 11, 15, 26, 10, '#fff3c0'); q(g, 15, 17, 5, 5, '#fff'); q(g, 27, 19, 4, 4, '#ffe9a8');
      q(g, 6, 34, 36, 3, '#a87a20');
      q(g, 22, 4, 4, 10, '#8af0e8');            // 浮起的月光结晶
    } else {
      q(g, 4, 6, 40, 12, '#d9a83e'); q(g, 4, 6, 40, 4, '#f0cc60');
      q(g, 4, 18, 40, 16, '#c9952e'); q(g, 4, 18, 40, 3, '#e8b84c');
      q(g, 8, 9, 4, 22, '#8a6a10'); q(g, 36, 9, 4, 22, '#8a6a10');
      q(g, 20, 10, 8, 12, '#8af0e8'); q(g, 22, 13, 2, 2, '#fff');   // 结晶锁
      q(g, 21, 22, 6, 2, '#7a5a10');
    }
    return c;
  }
  /* ---- P1/P2 软装与街景物件 ---- */
  function makeBookStack() {
    const c = cnv(24, 26), g = c.getContext('2d');
    q(g, 2, 18, 20, 5, '#8a5a2e'); q(g, 3, 19, 18, 3, '#d9534f');
    q(g, 4, 12, 15, 5, '#8a5a2e'); q(g, 5, 13, 13, 3, '#4f83d9');
    q(g, 7, 6, 12, 5, '#8a5a2e'); q(g, 8, 7, 10, 3, '#ffd94c');
    return c;
  }
  function makePlantRack() {
    const c = cnv(28, 40), g = c.getContext('2d');
    q(g, 2, 30, 24, 4, '#8a5a2e'); q(g, 4, 12, 20, 4, '#8a5a2e');
    q(g, 6, 16, 3, 14, '#7a4a26'); q(g, 19, 16, 3, 14, '#7a4a26');
    [[8, 4], [16, 3]].forEach(([x, y]) => {
      g.fillStyle = '#4fae4f'; g.beginPath(); g.arc(x + 3, y + 4, 5, 0, Math.PI * 2); g.fill();
    });
    g.fillStyle = '#57b857'; g.beginPath(); g.arc(13, 2, 6, 0, Math.PI * 2); g.fill();
    return c;
  }
  function makeWallClock() {
    const c = cnv(24, 24), g = c.getContext('2d');
    g.fillStyle = '#f0ede4'; g.beginPath(); g.arc(12, 12, 10, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#7a4a26'; g.lineWidth = 2; g.beginPath(); g.arc(12, 12, 10, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(12, 12); g.lineTo(12, 5); g.stroke();
    g.beginPath(); g.moveTo(12, 12); g.lineTo(17, 14); g.stroke();
    return c;
  }
  function makeCurtain() {
    const c = cnv(32, 40), g = c.getContext('2d');
    q(g, 0, 0, 32, 3, '#8a5a2e');
    for (let i = 0; i < 2; i++) {
      const x = i * 16;
      g.fillStyle = '#e8a8b8'; g.beginPath();
      g.moveTo(x + 1, 3); g.quadraticCurveTo(x + 8, 20, x + 2, 38); g.lineTo(x + 13, 38);
      g.quadraticCurveTo(x + 8, 20, x + 14, 3); g.fill();
    }
    return c;
  }
  function makeBlackboardNews() {
    const c = cnv(32, 26), g = c.getContext('2d');
    q(g, 1, 1, 30, 24, '#7a5a2e'); q(g, 3, 3, 26, 20, '#2f5d46');
    q(g, 5, 6, 16, 1, '#e8f0e8'); q(g, 5, 9, 12, 1, '#a8d8c0'); q(g, 5, 12, 18, 1, '#ffe9a8');
    return c;
  }
  function makeCoatHook() {
    const c = cnv(28, 20), g = c.getContext('2d');
    q(g, 0, 0, 28, 3, '#8a5a2e');
    [[6, '#e85a5a'], [14, '#4f83d9'], [22, '#ffd94c']].forEach(([x, col]) => {
      q(g, x - 1, 3, 2, 4, '#5a5f6e');
      g.fillStyle = col; g.beginPath(); g.arc(x, 11, 4, 0, Math.PI * 2); g.fill();
    });
    return c;
  }
  function makeStove2() {
    const c = cnv(28, 30), g = c.getContext('2d');
    q(g, 2, 4, 24, 22, '#6a4a3a'); q(g, 4, 6, 20, 8, '#8a6a5a');
    g.fillStyle = '#ff9a4a'; g.beginPath(); g.arc(10, 10, 3, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(18, 10, 2, 0, Math.PI * 2); g.fill();
    q(g, 4, 18, 20, 2, '#5a3a2a');
    return c;
  }
  function makeTrophyFrame() {
    const c = cnv(26, 24), g = c.getContext('2d');
    q(g, 0, 0, 26, 24, '#8a5a2e'); q(g, 2, 2, 22, 20, '#f0ede4');
    q(g, 10, 6, 6, 7, '#ffd94c'); q(g, 8, 8, 2, 3, '#ffd94c'); q(g, 16, 8, 2, 3, '#ffd94c');
    q(g, 11, 13, 4, 2, '#c8a028'); q(g, 9, 15, 8, 2, '#8a5a2e');
    return c;
  }
  function makeCatBed() {
    const c = cnv(28, 18), g = c.getContext('2d');
    g.fillStyle = '#e89a6a'; g.beginPath(); g.arc(14, 10, 11, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f8c8a0'; g.beginPath(); g.arc(14, 10, 8, 0, Math.PI * 2); g.fill();
    q(g, 10, 7, 3, 1, '#c46a6a'); q(g, 15, 7, 3, 1, '#c46a6a');
    return c;
  }
  function makeRattanChair() {
    const c = cnv(28, 34), g = c.getContext('2d');
    q(g, 4, 8, 20, 6, '#c9a06a'); q(g, 4, 8, 20, 2, '#dab87a');
    q(g, 4, 2, 4, 8, '#c9a06a'); q(g, 20, 2, 4, 8, '#c9a06a');
    g.strokeStyle = '#b8895a'; g.lineWidth = 1;
    for (let y = 12; y < 26; y += 4) { g.beginPath(); g.moveTo(6, y); g.lineTo(22, y); g.stroke(); }
    q(g, 5, 26, 3, 6, '#a87a4a'); q(g, 20, 26, 3, 6, '#a87a4a');
    return c;
  }
  function makeWallArt(g2) {
    const c = cnv(28, 24), g = c.getContext('2d');
    q(g, 0, 0, 28, 24, '#8a5a2e'); q(g, 2, 2, 24, 20, '#2a2a3e');
    g.fillStyle = '#ffd94c'; g.beginPath(); g.arc(9, 8, 3, 0, Math.PI * 2); g.fill();
    q(g, 14, 12, 8, 1, '#7ab0ff'); q(g, 16, 15, 6, 1, '#7ab0ff');
    q(g, 5, 18, 4, 1, '#4ae86c');
    return c;
  }
  function makeMailbox2() {
    const c = cnv(20, 34), g = c.getContext('2d');
    q(g, 8, 12, 4, 20, '#7a4a26');
    g.fillStyle = '#4a9ae8'; g.beginPath(); g.ellipse(10, 8, 9, 6, 0, 0, Math.PI * 2); g.fill();
    q(g, 10, 3, 6, 2, '#3a7ac8'); q(g, 16, 6, 2, 4, '#ffd94c');
    return c;
  }
  function makeNewsstand() {
    const c = cnv(32, 40), g = c.getContext('2d');
    q(g, 2, 18, 28, 20, '#c87838'); q(g, 2, 18, 28, 3, '#e09048');
    q(g, 0, 6, 32, 12, '#e8a05a');
    q(g, 4, 9, 10, 7, '#f0ede4'); q(g, 16, 9, 10, 7, '#f0ede4');
    q(g, 5, 11, 8, 1, '#333'); q(g, 17, 11, 8, 1, '#333');
    q(g, 4, 36, 4, 4, '#8a5a2e'); q(g, 24, 36, 4, 4, '#8a5a2e');
    return c;
  }
  function makeSwing() {
    const c = cnv(32, 44), g = c.getContext('2d');
    q(g, 2, 2, 28, 3, '#8a5a2e');
    q(g, 8, 5, 1, 26, '#5a5f6e'); q(g, 22, 5, 1, 26, '#5a5f6e');
    q(g, 7, 30, 16, 3, '#a06c3a');
    q(g, 4, 40, 4, 4, '#6a4a3a'); q(g, 24, 40, 4, 4, '#6a4a3a');
    return c;
  }
  function makeClothesline() {
    const c = cnv(64, 36), g = c.getContext('2d');
    q(g, 2, 2, 2, 32, '#7a4a26'); q(g, 60, 2, 2, 32, '#7a4a26');
    q(g, 4, 4, 56, 1, '#d8d8e0');
    [[10, '#e85a5a'], [22, '#4f83d9'], [34, '#ffd94c'], [46, '#4aa96c']].forEach(([x, col]) => {
      q(g, x, 5, 10, 12, col); q(g, x, 17, 10, 2, shade(col, .8));
    });
    return c;
  }
  function makeBannerFlag() {
    const c = cnv(24, 44), g = c.getContext('2d');
    q(g, 11, 0, 2, 44, '#8a5a2e');
    g.fillStyle = '#e85a5a'; g.beginPath();
    g.moveTo(13, 2); g.lineTo(23, 8); g.lineTo(13, 14); g.fill();
    g.fillStyle = '#ffd94c'; g.beginPath(); g.arc(17, 8, 2, 0, Math.PI * 2); g.fill();
    return c;
  }
  function makeCaveMouth() {
    const c = cnv(32, 48), g = c.getContext('2d');
    g.fillStyle = '#3a3542'; g.beginPath(); g.arc(16, 44, 18, Math.PI, 0); g.fill();
    g.fillStyle = '#4a4456'; g.beginPath(); g.arc(16, 44, 15, Math.PI, 0); g.fill();
    q(g, 5, 30, 22, 16, '#0e0c14');
    g.fillStyle = '#565064'; g.beginPath(); g.arc(8, 28, 4, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(24, 26, 5, 0, Math.PI * 2); g.fill();
    q(g, 2, 40, 5, 6, '#5f8a55'); q(g, 26, 42, 4, 4, '#5f8a55');
    return c;
  }
  function makeSortingHat() {
    const c = cnv(32, 26), g = c.getContext('2d');
    q(g, 8, 20, 16, 5, '#5a4028'); q(g, 8, 20, 16, 2, '#6e5236');      // 凳面
    g.fillStyle = '#3a2c1c';                                            // 帽冠（歪尖）
    g.beginPath(); g.moveTo(6, 20); g.lineTo(10, 10); g.lineTo(18, 4);
    g.lineTo(22, 12); g.lineTo(26, 20); g.closePath(); g.fill();
    g.fillStyle = '#4a3a26';
    g.beginPath(); g.moveTo(4, 20); g.lineTo(16, 16); g.lineTo(28, 20); g.closePath(); g.fill();  // 帽檐
    q(g, 14, 9, 4, 2, '#221a10'); q(g, 20, 13, 3, 2, '#221a10');        // 补丁“眼睛”
    return c;
  }
  function makeTelescope() {
    const c = cnv(32, 46), g = c.getContext('2d');
    q(g, 8, 38, 16, 4, '#3a3a52'); q(g, 13, 42, 6, 4, '#2a2a3e');       // 三脚架
    g.save(); g.translate(16, 38); g.rotate(-0.7);                      // 斜置镜筒
    g.fillStyle = '#8a8fa8'; g.fillRect(-4, -34, 8, 34);
    g.fillStyle = '#b8bccc'; g.fillRect(-4, -34, 8, 6);
    g.fillStyle = '#d8c078'; g.fillRect(-5, -22, 10, 3);
    g.restore();
    q(g, 20, 2, 2, 2, '#8ad0ff'); q(g, 24, 8, 1, 1, '#ffe9a8');
    return c;
  }
  function makeDog(sleep) {
    const c = cnv(64, 44), g = c.getContext('2d');
    const body = '#8a6a4a', dark = '#6e5236';
    q(g, 10, 26, 44, 14, body); q(g, 10, 26, 44, 4, '#a08262');          // 身体
    q(g, 12, 38, 6, 4, dark); q(g, 46, 38, 6, 4, dark);
    q(g, 56, 22, 8, 6, dark);                                             // 尾巴
    const head = (hx, hy) => {
      q(g, hx, hy, 18, 16, body); q(g, hx, hy, 18, 4, '#a08262');
      q(g, hx + 1, hy - 4, 5, 5, dark); q(g, hx + 12, hy - 4, 5, 5, dark); // 耳朵
      if (sleep) { q(g, hx + 3, hy + 7, 4, 1, '#2a1e14'); q(g, hx + 11, hy + 7, 4, 1, '#2a1e14'); }
      else { q(g, hx + 3, hy + 6, 3, 3, '#ffe94c'); q(g, hx + 11, hy + 6, 3, 3, '#ffe94c');
             q(g, hx + 3, hy + 6, 1, 1, '#000'); q(g, hx + 12, hy + 6, 1, 1, '#000'); }
      q(g, hx + 7, hy + 12, 4, 3, dark);                                  // 鼻吻
    };
    head(0, 8); head(23, 2); head(46, 8);
    if (sleep) { g.fillStyle = '#dfe9ff'; g.font = 'bold 10px sans-serif'; g.fillText('Z', 60, 6); }
    return c;
  }
  function makeBroom() {
    const c = cnv(32, 40), g = c.getContext('2d');
    q(g, 14, 2, 4, 24, '#a06c3a'); q(g, 14, 2, 2, 24, '#c98d5a');
    q(g, 10, 26, 12, 3, '#8a5a2e');
    g.fillStyle = '#d9b96a';
    for (let i = 0; i < 6; i++) g.fillRect(9 + i * 2.4, 29, 2, 9);
    q(g, 8, 36, 16, 2, '#b89a50');
    return c;
  }
  function makeCauldron() {
    const c = cnv(32, 30), g = c.getContext('2d');
    g.fillStyle = '#2a2a34';
    g.beginPath(); g.ellipse(16, 18, 12, 9, 0, 0, Math.PI * 2); g.fill();
    q(g, 4, 12, 24, 4, '#3a3a48');
    g.fillStyle = '#8a5ad9'; g.beginPath(); g.ellipse(16, 13, 10, 3, 0, 0, Math.PI * 2); g.fill();
    q(g, 6, 26, 4, 4, '#1e1e28'); q(g, 22, 26, 4, 4, '#1e1e28');
    q(g, 13, 4, 2, 8, '#d8c078');
    g.fillStyle = 'rgba(185,138,245,.5)';
    g.beginPath(); g.arc(14, 2, 2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(19, 5, 1.5, 0, Math.PI * 2); g.fill();
    return c;
  }
  function makeMirror() {
    const c = cnv(64, 76), g = c.getContext('2d');
    q(g, 24, 68, 16, 8, '#b89a50');                                      // 底座
    q(g, 6, 4, 52, 64, '#d8c078'); q(g, 10, 8, 44, 56, '#8a5ad9');       // 金框 + 镜面
    q(g, 12, 10, 40, 52, '#b98af5');
    g.fillStyle = 'rgba(255,255,255,.25)';                               // 光带
    g.beginPath(); g.moveTo(16, 58); g.lineTo(34, 12); g.lineTo(42, 12); g.lineTo(20, 62); g.closePath(); g.fill();
    q(g, 6, 4, 52, 3, '#f0dfae'); q(g, 6, 4, 3, 64, '#f0dfae');
    q(g, 28, 0, 8, 6, '#f0dfae');                                        // 顶饰
    g.fillStyle = '#fff';
    [[18, 20], [44, 30], [26, 44], [48, 52]].forEach(([x, y]) => { g.fillRect(x, y, 2, 2); });
    return c;
  }
  function makeTrapdoor() {
    const c = cnv(32, 32), g = c.getContext('2d');
    q(g, 2, 4, 28, 24, '#5a4028'); q(g, 4, 6, 24, 20, '#6e5236');
    q(g, 4, 12, 24, 2, '#4a3420'); q(g, 4, 20, 24, 2, '#4a3420');
    q(g, 14, 14, 4, 6, '#d8c078'); q(g, 15, 16, 2, 2, '#3a2c1c');
    return c;
  }
  function makeDummy() {                          // 武术木人桩
    const c = cnv(32, 52), g = c.getContext('2d');
    q(g, 10, 44, 12, 6, '#5a4a3a'); q(g, 12, 46, 8, 4, '#7a6a5a');
    q(g, 11, 14, 10, 30, '#c9a06a'); q(g, 11, 14, 10, 3, '#e0bc88');
    for (let y = 20; y < 42; y += 6) q(g, 11, y, 10, 2, '#a07848');
    q(g, 2, 18, 9, 5, '#c9a06a'); q(g, 21, 18, 9, 5, '#c9a06a');   // 双臂
    q(g, 13, 8, 6, 6, '#c9a06a'); q(g, 13, 8, 6, 2, '#e0bc88');     // 头
    q(g, 14, 10, 1, 1, '#3a2a1a'); q(g, 17, 10, 1, 1, '#3a2a1a');
    return c;
  }
  function makeGoban() {                          // 围棋盘
    const c = cnv(40, 30), g = c.getContext('2d');
    q(g, 2, 2, 36, 24, '#a06c3a'); q(g, 4, 4, 32, 20, '#d9b96a');
    g.strokeStyle = '#5a4028'; g.lineWidth = 1;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(6 + i * 7, 4); g.lineTo(6 + i * 7, 24); g.stroke();
      g.beginPath(); g.moveTo(4, 6 + i * 4.5); g.lineTo(36, 6 + i * 4.5); g.stroke(); }
    q(g, 8, 7, 3, 3, '#1a1a1a'); q(g, 24, 11, 3, 3, '#fff'); q(g, 15, 16, 3, 3, '#1a1a1a');
    return c;
  }
  function makeEasel() {                          // 画架
    const c = cnv(32, 46), g = c.getContext('2d');
    g.strokeStyle = '#8a5a2e'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(8, 44); g.lineTo(14, 10); g.stroke();
    g.beginPath(); g.moveTo(24, 44); g.lineTo(18, 10); g.stroke();
    g.beginPath(); g.moveTo(16, 26); g.lineTo(16, 40); g.stroke();
    q(g, 7, 8, 18, 16, '#f0ede4'); q(g, 7, 8, 18, 2, '#d8d4c8');
    q(g, 10, 12, 12, 8, '#8ad0ff');                    // 画中的天空
    q(g, 10, 17, 12, 3, '#58ab4a'); q(g, 14, 13, 3, 3, '#ffe94c'); // 太阳
    q(g, 6, 24, 20, 3, '#8a5a2e');
    return c;
  }
  function makeBed() {
    const c = cnv(32, 40), g = c.getContext('2d');
    q(g, 4, 4, 24, 32, '#8a5a2e'); q(g, 4, 4, 24, 2, '#a06c3a');
    q(g, 6, 14, 20, 20, '#f0ede4'); q(g, 6, 14, 20, 3, '#fff');
    q(g, 6, 6, 20, 8, '#5a8ad9'); q(g, 6, 6, 20, 2, '#7aa8e8');
    q(g, 5, 34, 3, 5, '#6e5236'); q(g, 24, 34, 3, 5, '#6e5236');
    return c;
  }
  function makeDesk2() {                          // 家用书桌（台灯）
    const c = cnv(32, 30), g = c.getContext('2d');
    q(g, 2, 10, 28, 6, '#a06c3a'); q(g, 2, 10, 28, 2, '#c98d5a');
    q(g, 4, 16, 3, 12, '#7a4a26'); q(g, 25, 16, 3, 12, '#7a4a26');
    q(g, 20, 2, 3, 8, '#5a5f6e'); q(g, 16, 0, 8, 4, '#ffd98a');        // 台灯
    g.globalAlpha = .25; q(g, 12, 4, 14, 6, '#ffe9a8'); g.globalAlpha = 1;
    q(g, 6, 5, 8, 5, '#e8e8f0'); q(g, 6, 5, 8, 2, '#d9534f');          // 书本
    return c;
  }
  function makeDig() {                            // 埋宝土堆
    const c = cnv(32, 24), g = c.getContext('2d');
    g.fillStyle = '#8a6a4a'; g.beginPath(); g.ellipse(16, 16, 12, 7, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#a08262'; g.beginPath(); g.ellipse(13, 13, 6, 4, 0, 0, Math.PI * 2); g.fill();
    q(g, 20, 10, 4, 3, '#6e5236'); q(g, 10, 18, 3, 2, '#6e5236');
    return c;
  }
  function makeShelf2() {                         // 家/书店书柜
    const c = cnv(32, 40), g = c.getContext('2d');
    q(g, 2, 2, 28, 36, '#7a4a26'); q(g, 4, 4, 24, 32, '#a06c3a');
    const cols = ['#d9534f', '#4f83d9', '#ffd94c', '#4aa96c', '#b98af5', '#ff8ab0', '#5ad9c0', '#e8963a'];
    for (let r = 0; r < 3; r++) {
      q(g, 4, 14 + r * 8, 24, 2, '#6e4a26');
      for (let i = 0; i < 5; i++) q(g, 5 + i * 4.5, 8 + r * 8, 4, 6, cols[(i + r * 3) % cols.length]);
    }
    return c;
  }

  // getObject 扩展：支持季节参数用于 tree / flowerbed 等季节性物件
  // 非季节性物件保持原 cache 行为；季节性物件按 season + progressBin + weatherBin 缓存
  function getObject(kind, opt, season, progress, weather) {
    season = season || 'spring'; progress = progress == null ? 0 : progress; weather = weather || '晴';
    const seasonal = (kind === 'tree' || kind === 'fruitTree' || kind === 'flowerbed');
    let key;
    if (seasonal) {
      const pgBin = Math.max(0, Math.min(3, Math.floor(progress * 4)));
      const wBin = (weather === '小雨' || weather === '暴雨') ? 'rain' : (weather === '雪' ? 'snow' : 'fine');
      key = kind + '_' + (opt != null ? opt : 'x') + '_' + season + '_' + pgBin + '_' + wBin;
    } else {
      key = kind + (opt != null ? '_' + opt : '');
    }
    if (cache[key]) return cache[key];
    let c;
    switch (kind) {
      case 'tree': c = makeTree(opt || 0, season, progress, weather); break;
      case 'lamp': c = makeLamp(!!opt); break;
      case 'bench': c = makeBench(); break;
      case 'fountain0': c = makeFountainFrame(0); break;
      case 'fountain1': c = makeFountainFrame(1); break;
      case 'stoneDoor': c = makeStoneDoor(!!opt); break;
      case 'altar': c = makeAltar(!!opt); break;
      case 'plant': c = makePlant(); break;
      case 'rock': c = makeRock(); break;
      case 'stump': c = makeStump(); break;
      case 'hoop': c = makeHoop(); break;
      case 'piano': c = makePiano(); break;
      case 'chest': c = makeChest(!!opt); break;
      case 'quizAltar': c = makeQuizAltar(opt | 0); break;
      case 'sealGate': c = makeSealGate(!!opt); break;
      case 'bossChest': c = makeBossChest(!!opt); break;
      case 'caveMouth': c = makeCaveMouth(); break;
      case 'bookStack': c = makeBookStack(); break;
      case 'plantRack': c = makePlantRack(); break;
      case 'wallClock': c = makeWallClock(); break;
      case 'curtain': c = makeCurtain(); break;
      case 'bbNews': c = makeBlackboardNews(); break;
      case 'coatHook': c = makeCoatHook(); break;
      case 'stove2': c = makeStove2(); break;
      case 'trophyFrame': c = makeTrophyFrame(); break;
      case 'catBed': c = makeCatBed(); break;
      case 'chair2': c = makeRattanChair(); break;
      case 'wallArt': c = makeWallArt(); break;
      case 'mailbox2': c = makeMailbox2(); break;
      case 'newsstand': c = makeNewsstand(); break;
      case 'swing': c = makeSwing(); break;
      case 'clothesline': c = makeClothesline(); break;
      case 'bannerFlag': c = makeBannerFlag(); break;
      case 'sortingHat': c = makeSortingHat(); break;
      case 'telescope': c = makeTelescope(); break;
      case 'dog': c = makeDog(!!opt); break;
      case 'broom': c = makeBroom(); break;
      case 'cauldron': c = makeCauldron(); break;
      case 'mirror': c = makeMirror(); break;
      case 'trapdoor': c = makeTrapdoor(); break;
      case 'dummy': c = makeDummy(); break;
      case 'goban': c = makeGoban(); break;
      case 'easel': c = makeEasel(); break;
      case 'bed': c = makeBed(); break;
      case 'desk2': c = makeDesk2(); break;
      case 'dig': c = makeDig(); break;
      case 'ore': c = makeOre(opt | 0); break;              // 矿石：opt=档次
      case 'crack': c = makeCrack(); break;                 // 下行裂缝
      case 'rope': c = makeRope(); break;                   // 出口绳索
      case 'elevator': c = makeElevator(); break;           // 矿道电梯
      case 'shelf2': c = makeShelf2(); break;
      case 'goal': c = makeGoal(); break;
      case 'bleachers': c = makeBleachers(); break;
      case 'flagpole': c = makeFlagpole(); break;
      case 'flowerbed': c = makeFlowerbed(season, progress, weather); break;
      case 'board': c = makeBoard(); break;
      case 'sandpit': c = makeSandpit(); break;
      case 'flags': c = makeFlags(); break;
      case 'sign': c = makeSign(String(opt)); break;
      /* 交互点专属立牌 */
      case 'photoSpot': c = makeCameraSpot(); break;
      case 'dateSpot': c = makeHeartSpot(); break;
      case 'mysterySpot': c = makeMysterySpot(); break;
      case 'pickupSpot': c = makePickupSpot(); break;
      case 'busStop': c = makeBusStopSign(); break;
      case 'bikeRack': c = makeBikeRack(); break;
      case 'starFruit': c = makeStarFruit(); break;
      case 'plot': c = makePlot(opt % 10, (opt % 100) >= 10, (opt % 1000) >= 100, opt >= 1000); break;
      case 'coop': c = makeCoop(!!opt); break;
      case 'cowShed': c = makeCowShed(!!opt); break;
      case 'sheepPen': c = makeSheepPen(!!opt); break;
      case 'buzz': c = makeBuzz(!!opt); break;
      case 'critter': c = makeCritterBurrow(!!opt); break;
      case 'scarecrow': c = makeScarecrow(!!opt); break;
      default: c = cnv(32, 32);
    }
    cache[key] = c; return c;
  }

  /* ==================== 气泡表情 & 图标 ==================== */
  function drawBalloon(g, cx, ty, icon, t) {
    const rise = Math.min(1, t / .25) * 6;
    const alpha = t > 1.0 ? Math.max(0, 1 - (t - 1.0) / .35) : 1;
    g.save(); g.globalAlpha = alpha;
    const x = cx - 13, y = ty - 26 - rise;
    g.fillStyle = '#ffffff'; g.strokeStyle = '#2a2a3a'; g.lineWidth = 2;
    g.beginPath(); g.roundRect ? g.roundRect(x, y, 26, 24, 6) : g.rect(x, y, 26, 24);
    g.fill(); g.stroke();
    g.beginPath(); g.moveTo(cx - 4, y + 23); g.lineTo(cx, y + 30); g.lineTo(cx + 4, y + 23);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#2a2a3a'; g.font = 'bold 14px "Microsoft YaHei", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(icon, cx, y + 13);
    g.restore();
  }

  // 徽章宝石图标（HUD / 获得道具用）
  function drawGem(g, x, y, color, on, r) {
    r = r || 9;
    g.save();
    if (!on) g.globalAlpha = .35;
    g.fillStyle = on ? color : '#666';
    g.beginPath();
    g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath();
    g.fill();
    if (on) {
      g.fillStyle = 'rgba(255,255,255,.75)';
      g.beginPath(); g.moveTo(x, y - r + 3); g.lineTo(x + 3, y - r + 6); g.lineTo(x - 2, y - r + 7); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.stroke();
    } else {
      g.strokeStyle = '#999'; g.stroke();
    }
    g.restore();
  }

  /* ==================== 天气图标 & 说话人头像 ==================== */
  // 16×16 程序化天气图标（HUD 日历行用），七种天气 + 兜底
  function getIcon(weather) {
    const key = 'icon_' + weather;
    if (cache[key]) return cache[key];
    const c = cnv(16, 16), g = c.getContext('2d');
    switch (weather) {
      case '晴':                                    // 太阳 + 八向光芒
        q(g, 5, 5, 6, 6, '#ffd94c'); q(g, 6, 4, 4, 8, '#ffd94c'); q(g, 4, 6, 8, 4, '#ffd94c');
        q(g, 7, 0, 2, 3, '#e8b83a'); q(g, 7, 13, 2, 3, '#e8b83a');
        q(g, 0, 7, 3, 2, '#e8b83a'); q(g, 13, 7, 3, 2, '#e8b83a');
        q(g, 2, 2, 2, 2, '#e8b83a'); q(g, 12, 2, 2, 2, '#e8b83a');
        q(g, 2, 12, 2, 2, '#e8b83a'); q(g, 12, 12, 2, 2, '#e8b83a');
        q(g, 6, 6, 2, 2, '#fff2b0');
        break;
      case '多云':                                  // 双层云
        q(g, 3, 6, 10, 5, '#dfe4ec'); q(g, 5, 4, 6, 4, '#eef1f6'); q(g, 8, 5, 4, 2, '#eef1f6');
        q(g, 2, 9, 12, 2, '#c3cad6');
        break;
      case '小雨':                                  // 云 + 三缕雨丝
        q(g, 3, 3, 9, 4, '#c3cad6'); q(g, 5, 2, 5, 3, '#dfe4ec');
        q(g, 4, 8, 1, 3, '#7ec8f0'); q(g, 7, 8, 1, 4, '#7ec8f0'); q(g, 10, 8, 1, 3, '#7ec8f0');
        break;
      case '暴雨':                                  // 乌云 + 大雨 + 闪电
        q(g, 2, 2, 11, 4, '#7a8496'); q(g, 4, 1, 7, 3, '#98a2b4');
        q(g, 3, 6, 1, 4, '#5aa8e0'); q(g, 6, 6, 1, 4, '#5aa8e0');
        q(g, 9, 6, 1, 5, '#5aa8e0'); q(g, 12, 6, 1, 4, '#5aa8e0');
        q(g, 7, 9, 2, 2, '#ffd94c'); q(g, 6, 11, 2, 2, '#ffd94c'); q(g, 8, 13, 1, 1, '#ffd94c');
        break;
      case '雾':                                    // 三条错位横带
        q(g, 2, 4, 12, 2, '#c8cdd8'); q(g, 4, 7, 10, 2, '#d8dde6'); q(g, 1, 10, 12, 2, '#c0c6d2');
        break;
      case '雪':                                    // 云 + 白色雪点
        q(g, 3, 2, 9, 4, '#dfe4ec'); q(g, 5, 1, 5, 3, '#eef1f6');
        q(g, 4, 8, 2, 2, '#ffffff'); q(g, 9, 9, 2, 2, '#ffffff'); q(g, 6, 12, 2, 2, '#ffffff');
        break;
      case '星空':                                  // 深蓝夜幕 + 月牙 + 星
        q(g, 0, 0, 16, 16, '#1a2246');
        q(g, 9, 2, 6, 6, '#ffe9a8'); q(g, 3, 3, 6, 6, '#1a2246');
        q(g, 2, 10, 1, 1, '#ffffff'); q(g, 5, 12, 1, 1, '#ffffff');
        q(g, 12, 11, 1, 1, '#ffffff'); q(g, 8, 8, 1, 1, '#ffffff');
        break;
      default: q(g, 4, 4, 8, 8, '#c8c8c8');
    }
    cache[key] = c; return c;
  }

  // 说话人头像：取调色板（或猫配色）down 方向静立帧放大 1.5 倍，加细描边
  function getPortrait(spec) {
    const key = 'port_' + JSON.stringify(spec);
    if (cache[key]) return cache[key];
    const isCat = !!spec.body;
    const sheet = isCat ? makeCatSheet(spec) : makeCharSheet(spec);
    const fh = isCat ? 28 : 44, SC = 1.5;
    const W = Math.round(32 * SC), H = Math.round(fh * SC);
    const c = cnv(W, H), g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(sheet, 0, 0, 32, fh, 0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1;
    g.strokeRect(.5, .5, W - 1, H - 1);
    cache[key] = c; return c;
  }

  /* ==================== 工具图标（热键栏） ==================== */
  // 16×16 程序化工具图标（星露谷式斜握视角），缓存与 getIcon 同表
  function drawToolIcon(g, id, cx, cy, size) {
    const key = 'tool_' + id;
    if (!cache[key]) {
      const c = cnv(16, 16), x = c.getContext('2d');
      const W1 = '#b9834f', W2 = '#8a5a2e', M1 = '#cdd3e0', M2 = '#8a90a8';
      const TE = '#57b8d8', TD = '#2e7a96', TN = '#d9b47f', TDk = '#a8834f';
      // 斜握木柄：从 (3,12) 到 (10,5) 的 2px 宽阶梯
      const grip = () => { for (let i = 0; i < 7; i++) { q(x, 4 + i, 11 - i, 2, 2, W1); q(x, 4 + i, 11 - i, 1, 1, W2); } };
      switch (id) {
        case 'hoe':                                     // 锄头：柄 + 横刃
          grip();
          q(x, 10, 3, 5, 2, M1); q(x, 10, 5, 2, 2, M2); q(x, 12, 5, 1, 1, M2);
          break;
        case 'wateringCan':                             // 洒水壶：壶身 + 壶嘴 + 提手 + 水滴
          q(x, 4, 6, 7, 7, TE); q(x, 4, 6, 7, 2, '#7ec8e0'); q(x, 4, 11, 7, 2, TD);
          q(x, 11, 7, 4, 2, TE); q(x, 14, 6, 1, 3, TD);
          q(x, 5, 4, 5, 2, TD); q(x, 4, 5, 1, 2, TD); q(x, 10, 5, 1, 1, TD);
          q(x, 2, 9, 2, 1, '#aee2f0');
          break;
        case 'scythe':                                  // 镰刀：柄 + 弯刃
          grip();
          q(x, 9, 2, 6, 2, M1); q(x, 8, 4, 2, 2, M1); q(x, 14, 4, 1, 2, M2); q(x, 7, 5, 1, 2, M2);
          break;
        case 'pickaxe':                                 // 镐头：柄 + 双尖镐
          grip();
          q(x, 4, 3, 3, 2, M1); q(x, 10, 3, 3, 2, M1); q(x, 7, 2, 3, 3, M1);
          q(x, 3, 4, 1, 2, M2); q(x, 13, 4, 1, 2, M2); q(x, 7, 5, 3, 1, M2);
          break;
        case 'axe':                                     // 斧头：柄 + 楔形刃
          grip();
          q(x, 9, 2, 5, 6, M1); q(x, 8, 3, 1, 4, M2); q(x, 13, 3, 1, 4, M1); q(x, 10, 2, 3, 1, M2);
          break;
        case 'shovel':                                  // 小铲子：柄 + 铲头
          grip();
          q(x, 2, 2, 5, 4, M1); q(x, 3, 6, 3, 2, M2); q(x, 2, 2, 5, 1, M2);
          break;
        case 'fishingRod':                              // 鱼竿：细竿 + 线 + 鱼钩
          for (let i = 0; i < 10; i++) q(x, 3 + i, 12 - i, 1, 2, W2);
          q(x, 12, 3, 1, 6, '#9aa2b4');
          q(x, 10, 9, 3, 1, M2); q(x, 10, 10, 1, 2, M2); q(x, 12, 10, 1, 1, M2);
          q(x, 6, 9, 2, 2, TD);                         // 卷线轮
          break;
        case 'bugNet':                                  // 捉虫网：网圈 + 网面 + 柄
          for (let i = 0; i < 8; i++) q(x, 4 + i, 2 + (i < 4 ? i : 6 - i), 1, 1, M1);
          q(x, 4, 3, 8, 1, M1); q(x, 4, 7, 8, 1, M1); q(x, 3, 4, 1, 3, M1); q(x, 12, 4, 1, 3, M1);
          q(x, 5, 4, 2, 1, 'rgba(255,255,255,.55)'); q(x, 8, 5, 3, 1, 'rgba(255,255,255,.55)'); q(x, 6, 6, 2, 1, 'rgba(255,255,255,.55)');
          for (let i = 0; i < 4; i++) q(x, 10 + i, 10 + i, 2, 2, W2);
          break;
        case 'basket':                                  // 草编笼：笼身 + 编织纹 + 提手
          q(x, 3, 7, 10, 7, TN); q(x, 3, 12, 10, 2, TDk);
          q(x, 5, 7, 1, 7, TDk); q(x, 8, 7, 1, 7, TDk); q(x, 11, 7, 1, 7, TDk);
          q(x, 3, 9, 10, 1, TDk); q(x, 3, 11, 10, 1, TDk);
          q(x, 5, 4, 6, 1, W2); q(x, 4, 5, 1, 2, W2); q(x, 11, 5, 1, 2, W2);
          break;
        default: q(x, 4, 4, 8, 8, '#c8c8c8');
      }
      cache[key] = c;
    }
    const s = size || 24;
    g.drawImage(cache[key], Math.round(cx - s / 2), Math.round(cy - s / 2), s, s);
  }

  // 角色调色板
  const PALETTES = {
    hero_boy:  { hair: '#6b4423', skin: '#ffd9b3', shirt: '#ff8c3a', shirt2: '#e06a1a', pants: '#3a5fc8', style: 'spiky' },
    hero_girl: { hair: '#5a3a1a', skin: '#ffd9b3', shirt: '#e85a7a', shirt2: '#c43a5a', pants: '#3a5fc8', skirt: true, skirtC: '#c8405f', style: 'long' },
    xiaoming:  { hair: '#22222a', skin: '#ffd9b3', shirt: '#3ab8b8', shirt2: '#2a9a9a', pants: '#4a4a5a', style: 'spiky' },
    xiaohong:  { hair: '#a03a3a', skin: '#ffd9b3', shirt: '#f7d94c', shirt2: '#d9b83a', pants: '#c8405f', skirt: true, skirtC: '#c8405f', style: 'buns' },
    principal: { hair: '#d8d8d8', skin: '#f0c8a0', shirt: '#444c66', shirt2: '#333a4e', pants: '#2a3040', style: 'flat', glasses: true },
    teacher_math: { hair: '#4a3020', skin: '#ffd9b3', shirt: '#4a6ae8', shirt2: '#3a56c0', pants: '#3a3a4a', style: 'flat', glasses: true },
    teacher_cn:   { hair: '#1a1a22', skin: '#ffdcb8', shirt: '#c8325a', shirt2: '#a02246', pants: '#8a1a3a', skirt: true, skirtC: '#8a1a3a', style: 'long' },
    teacher_sci:  { hair: '#cfcfcf', skin: '#ffd9b3', shirt: '#f2f5f9', shirt2: '#d5dbe6', pants: '#555560', coat: true, style: 'spiky' },
    aunt:     { hair: '#3a2a1a', skin: '#ffd9b3', shirt: '#f08aa0', shirt2: '#d96a84', pants: '#7a4a5a', skirt: true, skirtC: '#7a4a5a', apron: true, style: 'buns' },
    keeper:   { hair: '#e8e8e8', skin: '#e8c090', shirt: '#6a4ae0', shirt2: '#4a2ec0', pants: '#3a2a6a', style: 'long', beard: true },
    teacher_en: { hair: '#6a3a1a', skin: '#ffd9b3', shirt: '#3aa86a', shirt2: '#2a8850', pants: '#3a3a4a', style: 'buns' },
    teacher_pu: { hair: '#3a5a2a', skin: '#ffd9b3', shirt: '#5aa84a', shirt2: '#3a8830', pants: '#4a5a3a', style: 'long' },
    xiaopang: { hair: '#2a2a3a', skin: '#ffd9b3', shirt: '#e8a03a', shirt2: '#c87a2a', pants: '#4a4a5a', style: 'flat' },
    xiaogang: { hair: '#1a1a22', skin: '#f0c8a0', shirt: '#d94848', shirt2: '#b83232', pants: '#3a3a4a', cap: '#4a8ad9', style: 'spiky' },
    star:     { hair: '#8ad0ff', skin: '#ffe4d4', shirt: '#5a4ae0', shirt2: '#3a2ec0', pants: '#2a2a6a', style: 'long' },
    studentA: { hair: '#3a2a1a', skin: '#ffd9b3', shirt: '#8ad9a0', shirt2: '#6ab880', pants: '#4a4a6a', style: 'flat' },
    teacher_liu:  { hair: '#2a2a3a', skin: '#f0c8a0', shirt: '#e85a5a', shirt2: '#c43a3a', pants: '#3a3a4a', cap: '#3a5fc8', style: 'spiky' },
    teacher_zhao: { hair: '#6a4a8a', skin: '#ffd9b3', shirt: '#b88ae8', shirt2: '#986ac8', pants: '#8a5ab0', skirt: true, skirtC: '#8a5ab0', style: 'long' },
    miner:        { hair: '#c8c8c8', skin: '#e8b890', shirt: '#d9a83a', shirt2: '#b8862a', pants: '#5a4a3a', cap: '#ffd94c', style: 'flat', beard: true },
    yuejian:  { hair: '#e8e8f4', skin: '#f5d8c0', shirt: '#6a4ae0', shirt2: '#4a2ec0', pants: '#3a2a6a', style: 'long' },
    jinpeng:  { hair: '#e8d05a', skin: '#ffd9b3', shirt: '#2a7a4a', shirt2: '#1a5a36', pants: '#3a3a4a', style: 'spiky' },
    momo:     { hair: '#5a3a7a', skin: '#ffd9b3', shirt: '#9a7ae0', shirt2: '#7a5ac0', pants: '#4a3a5a', style: 'long', glasses: true },
    grey:     { hair: '#b0b0b0', skin: '#e0d0c0', shirt: '#8a8a92', shirt2: '#6a6a72', pants: '#4a4a52', style: 'flat', coat: true },
    mom:      { hair: '#5a3a1a', skin: '#ffd9b3', shirt: '#e88aa0', shirt2: '#c86a80', pants: '#8a5a6a', skirt: true, skirtC: '#8a5a6a', style: 'long' },
    wuyun:    { hair: '#2a2a3a', skin: '#e8c8a8', shirt: '#4a4a5a', shirt2: '#3a3a48', pants: '#2a2a38', style: 'spiky' },
    dazhuang: { hair: '#1a1a22', skin: '#f0c8a0', shirt: '#8a6a4a', shirt2: '#6a4a30', pants: '#4a3a2a', style: 'flat' },
    xiaoying: { hair: '#3a3a4a', skin: '#ffe4d4', shirt: '#5a5a72', shirt2: '#4a4a5e', pants: '#3a3a4a', style: 'long' },
    dojomaster: { hair: '#e8e8e8', skin: '#e8b890', shirt: '#3a3a52', shirt2: '#2a2a3e', pants: '#2a2a3a', style: 'flat', beard: true },
    doctor:   { hair: '#d8d8e8', skin: '#ffd9b3', shirt: '#f2f5f9', shirt2: '#d5dbe6', pants: '#8a94b0', coat: true, style: 'buns' },
    shopgirl: { hair: '#a03a3a', skin: '#ffd9b3', shirt: '#4ae8c0', shirt2: '#2ac0a0', pants: '#3a5a5a', skirt: true, skirtC: '#3a5a5a', style: 'buns' },
    bookman:  { hair: '#6a6a7a', skin: '#f0d0b0', shirt: '#c8a03a', shirt2: '#a8802a', pants: '#4a4a5a', glasses: true, style: 'flat' },
    younglady: { hair: '#8ad0ff', skin: '#ffe4d4', shirt: '#f2f5f9', shirt2: '#d5dbe6', pants: '#8a5ab0', skirt: true, skirtC: '#8a5ab0', style: 'long' },
    dad:      { hair: '#3a2a1a', skin: '#ffd9b3', shirt: '#5a8ad9', shirt2: '#3a6ab8', pants: '#3a3a4a', style: 'flat' },
    studentB: { hair: '#6a3a1a', skin: '#f5cfa0', shirt: '#d9a05a', shirt2: '#b8804a', pants: '#3a3a4a', cap: '#d9534f', style: 'flat' },
    studentC: { hair: '#2a2a3a', skin: '#ffd9b3', shirt: '#9a7ae0', shirt2: '#7a5ac0', pants: '#4a3a5a', style: 'spiky' },
    librarian: { hair: '#3a3a4a', skin: '#ffd9b3', shirt: '#6a7ae0', shirt2: '#4a5ac0', pants: '#2a2a3a', style: 'long', glasses: true },
    oldbook:   { hair: '#e0e0e0', skin: '#e8c090', shirt: '#7a6a4a', shirt2: '#5a4a2a', pants: '#4a3a2a', style: 'flat', beard: true, cap: '#8a7a5a' },
    buddy:     { hair: '#4a3020', skin: '#ffdcb8', shirt: '#d96a9a', shirt2: '#b84a7a', pants: '#4a4a6a', skirt: true, skirtC: '#b84a7a', style: 'buns', glasses: true },
    farmer:    { hair: '#5a5a5a', skin: '#d8a878', shirt: '#c8b090', shirt2: '#a89070', pants: '#5a4a3a', style: 'flat', cap: '#d8c070' },
    cardman:   { hair: '#3a3a3a', skin: '#f0c8a0', shirt: '#5ab87a', shirt2: '#3a9860', pants: '#4a4a5a', style: 'flat', cap: '#e8e8e8', beard: true },
    lufei:     { hair: '#2a1a0a', skin: '#e8b088', shirt: '#f2f5f9', shirt2: '#d5dbe6', pants: '#3a5fc8', style: 'spiky', cap: '#e85a5a' },
    linxiaoyu: { hair: '#3a2a4a', skin: '#ffe4d4', shirt: '#8ac8e8', shirt2: '#6aa8c8', pants: '#5a7a9a', skirt: true, skirtC: '#5a7a9a', style: 'long' },
    // —— NPC 大扩充：12 位新角色 ——
    wangmei:   { hair: '#4a3020', skin: '#ffd9b3', shirt: '#e8a8c8', shirt2: '#c888a8', pants: '#8a5a7a', skirt: true, skirtC: '#8a5a7a', style: 'buns' },
    laozhang:  { hair: '#888',    skin: '#d8b088', shirt: '#8a8a92', shirt2: '#6a6a72', pants: '#4a4a52', style: 'flat', cap: '#5a8ad9' },
    tuxiao:    { hair: '#1a1a22', skin: '#ffd9b3', shirt: '#5ad9a0', shirt2: '#3ab880', pants: '#2a3a4a', style: 'spiky', cap: '#3aa85f' },
    huangyu:   { hair: '#d8d8d8', skin: '#f0d0b0', shirt: '#d9c04a', shirt2: '#b8a02a', pants: '#6a5a2a', style: 'flat', glasses: true },
    xiaohua:   { hair: '#3a2a1a', skin: '#ffe4d4', shirt: '#ffb0c8', shirt2: '#e890a8', pants: '#c8a0b0', skirt: true, skirtC: '#c8a0b0', style: 'long' },
    lao_li:    { hair: '#c8c8c8', skin: '#e8c0a0', shirt: '#7a8a6a', shirt2: '#5a6a4a', pants: '#4a5a3a', style: 'flat', beard: true },
    sunyang:   { hair: '#2a2a3a', skin: '#ffd9b3', shirt: '#4a9ae8', shirt2: '#2a7ac8', pants: '#3a3a4a', style: 'flat' },
    zhaoling:  { hair: '#a03a3a', skin: '#ffe4d4', shirt: '#8ad0c8', shirt2: '#6ab0a8', pants: '#4a7a72', skirt: true, skirtC: '#4a7a72', style: 'buns' },
    qianqian:  { hair: '#6a4a8a', skin: '#ffd9b3', shirt: '#e8d04a', shirt2: '#c8b02a', pants: '#8a7a2a', style: 'long' },
    datou:     { hair: '#1a1a22', skin: '#f0c8a0', shirt: '#e8963a', shirt2: '#c8761a', pants: '#4a4a5a', style: 'spiky' },
    baiyun:    { hair: '#e8e8f4', skin: '#fff0e0', shirt: '#a8c8e8', shirt2: '#88a8c8', pants: '#6a8aaa', skirt: true, skirtC: '#6a8aaa', style: 'long' },
    tiezhu:    { hair: '#2a1a0a', skin: '#d8a878', shirt: '#8a6a4a', shirt2: '#6a4a2a', pants: '#3a3a2a', style: 'flat' }
  };

  return {
    TS, SOLID, COUNTER,
    getTile, getObject, makeCharSheet, makePoseSheet, makeCatSheet, makeBuddySheet,
    POSE_LIST, CAT_POSES,
    drawBalloon, drawGem, getIcon, getPortrait, drawToolIcon, PALETTES, shade
  };
})();