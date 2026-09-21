/* =========================================================
 * ui.js —— RPG Maker MZ 风格 UI
 * 消息窗口（打字机效果+姓名牌+说话人像素头像）、选项窗口、
 * 道具获得、徽章 HUD（含天气图标）、小提示 toast 队列
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.UI = (function () {
  const W = 960, H = 640;
  const FONT = (s, w) => `${w || 'bold'} ${s}px "Microsoft YaHei", "PingFang SC", sans-serif`;

  let active = null;      // 当前激活窗口 {type:...}
  const toasts = [];      // [{text, t}] 小提示队列，最多 3 条堆叠
  let itemAnim = null;

  /* ---------- 触屏安全区（与 css/style.css 的虚拟按键尺寸保持一致） ----------
   * 手机横屏时画面铺满整屏，底部方向盘/动作键会压住对话框，
   * 因此把对话框与选项窗向中间让出 safePad（画布逻辑像素）。
   * 尺寸常量同 css：#dpad 3×46+2×4=146，#abtns 2×56+10=122，贴边 8px。 */
  const CTL = { edge: 8, dpad: 146, btns: 122, gap: 12, maxPad: 280 };
  let safePad = 60;                        // 默认 60（=原对话框左右留白）
  let touchUI = false;                     // 触屏模式（main.js 按媒体查询设置）
  function setSafePad(v) { safePad = Math.max(60, Math.min(CTL.maxPad, Math.round(v) || 60)); return safePad; }
  function getSafePad() { return safePad; }
  function setTouch(v) { touchUI = !!v; return touchUI; }

  /* 画布在窗口中的位置 + 触控安全内边距（纯函数，便于测试与复用）
   * touchy=true 时：仅当虚拟按键与对话框在竖直方向重叠才让位。
   * ctl 为实测按键位置（屏幕坐标 {ctlTop, ctlLeft, ctlRight}，来自 getBoundingClientRect，
   * 可自动兼容刘海屏 safe-area）；不传则用 CTL 常量估算。 */
  function layout(iw, ih, touchy, ctl) {
    const r = Math.min(iw / W, ih / H);
    const cw = Math.floor(W * r), ch = Math.floor(H * r);
    const cx = Math.floor((iw - cw) / 2), cy = Math.floor((ih - ch) / 2);
    let pad = 60;
    if (touchy) {
      const m = ctl || {                                   // 兜底估算（按键未显示/未实测）
        ctlTop: ih - CTL.edge - CTL.dpad,
        ctlLeft: CTL.edge + CTL.dpad,
        ctlRight: iw - CTL.edge - CTL.btns
      };
      if (cy + ch > m.ctlTop) {                            // 竖直方向会重叠 → 横向让位
        const needL = (m.ctlLeft + CTL.gap - cx) / r;      // 左侧按键右缘所需留白（逻辑像素）
        const needR = (cx + cw + CTL.gap - m.ctlRight) / r;// 右侧按键左缘所需留白（逻辑像素）
        pad = Math.max(60, Math.ceil(Math.max(0, needL, needR)));
      }
    }
    pad = Math.max(60, Math.min(CTL.maxPad, pad));
    return { r, cw, ch, cx, cy, pad };
  }

  /* ---------- 小地图（Tab 开关；静态层按地图离屏缓存） ---------- */
  let minimapOn = true, miniCv = null, miniKey = '', miniSc = 2;
  function toggleMinimap() { minimapOn = !minimapOn; return minimapOn; }
  function buildMini(m) {
    const sc = Math.min(140 / m.w, 110 / m.h);
    const mw = Math.round(m.w * sc), mh = Math.round(m.h * sc);
    const c = document.createElement('canvas'); c.width = mw; c.height = mh;
    const g2 = c.getContext('2d');
    g2.fillStyle = 'rgba(24,32,80,.95)'; g2.fillRect(0, 0, mw, mh);
    g2.fillStyle = '#4a5590';
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++)
      if (ADV.Maps.SOLID.has(m.g[y][x])) g2.fillRect(Math.floor(x * sc), Math.floor(y * sc), Math.ceil(sc), Math.ceil(sc));
    g2.fillStyle = '#ffd94c';                                  // 门：金色点
    for (const d of m.doors) g2.fillRect(Math.floor(d.x * sc) - 1, Math.floor(d.y * sc) - 1, 3, 3);
    miniCv = c; miniSc = sc;
  }

  /* ---------- 通用窗口绘制（RMZ 蓝金风） ---------- */
  function drawWindow(g, x, y, w, h) {
    const grad = g.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, 'rgba(28, 38, 96, .93)');
    grad.addColorStop(1, 'rgba(14, 20, 60, .95)');
    g.fillStyle = grad;
    if (g.roundRect) { g.beginPath(); g.roundRect(x, y, w, h, 10); g.fill(); }
    else g.fillRect(x, y, w, h);
    g.strokeStyle = '#d8c078'; g.lineWidth = 3;
    if (g.roundRect) { g.beginPath(); g.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, 9); g.stroke(); }
    else g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1;
    if (g.roundRect) { g.beginPath(); g.roundRect(x + 5, y + 5, w - 10, h - 10, 6); g.stroke(); }
    else g.strokeRect(x + 5, y + 5, w - 10, h - 10);
  }
  function text(g, s, x, y, size, color, align, weight) {
    g.font = FONT(size, weight);
    g.textAlign = align || 'left'; g.textBaseline = 'top';
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillText(s, x + 1, y + 1);
    g.fillStyle = color || '#fff'; g.fillText(s, x, y);
  }

  /* ---------- 文本自动换行 ---------- */
  function wrap(g, s, maxW, size) {
    g.font = FONT(size);
    const out = [];
    for (const seg of String(s).split('\n')) {
      let line = '';
      for (const ch of seg) {
        if (g.measureText(line + ch).width > maxW) { out.push(line); line = ch; }
        else line += ch;
      }
      out.push(line);
    }
    return out;
  }

  /* ---------- 说话人像素头像（消息窗左侧，带金边底框） ----------
   * 返回头像占用的总宽度（无头像返回 0），供正文起点右移 */
  function drawPortrait(g, spec, x, y) {
    if (!spec || !ADV.Sprites || !ADV.Sprites.getPortrait) return 0;
    const img = ADV.Sprites.getPortrait(spec);
    const w = 52;
    const ih = Math.round(w * img.height / img.width);
    const yo = Math.max(0, Math.round((72 - ih) / 2));   // 以人形高度为基线垂直居中
    g.fillStyle = 'rgba(255,255,255,.10)';
    if (g.roundRect) { g.beginPath(); g.roundRect(x - 5, y + yo - 5, w + 10, ih + 10, 8); g.fill(); }
    else g.fillRect(x - 5, y + yo - 5, w + 10, ih + 10);
    g.drawImage(img, x, y + yo, w, ih);
    g.strokeStyle = '#d8c078'; g.lineWidth = 2;
    g.strokeRect(x - 4, y + yo - 4, w + 8, ih + 8);
    return w + 10;
  }

  /* ---------- 对话 ---------- */
  const msgX = () => safePad;                          // 对话框左边（触屏时让开虚拟按键）
  const msgW = () => W - safePad * 2;
  const msgTextW = pv => msgW() - 60 - (pv ? 62 : 0);  // 正文可用宽度（扣内边距与头像位）
  function say(opt) {
    return new Promise(res => {
      const name = opt.name || '';
      const pv = (name && ADV.Maps && ADV.Maps.portraitOf) ? ADV.Maps.portraitOf(name) : null;
      active = {
        type: 'say', res,
        name,
        pv,                   // 说话人头像规格（可空）
        lines: [], pages: [], page: 0,
        shown: 0, done: false, t: 0
      };
      const g = ctx2d;
      const lines = wrap(g, opt.text, msgTextW(pv), 21);
      // 每页最多 3 行
      for (let i = 0; i < lines.length; i += 3) active.pages.push(lines.slice(i, i + 3));
      pushHistory(name, opt.text);        // 进对话历史，供 L 键回看
    });
  }

  /* ---------- 选项（可附带说明文字，仿 RMZ 选择+消息并存）
   * 说明文字分页展示（每页 3 行，不再截断）；选项超过 6 条时窗口内滚动 ---------- */
  const CHOOSE_VIEW = 6;                  // 选项窗最多同时显示的行数
  function choose(options, opt) {
    opt = opt || {};
    return new Promise(res => {
      active = {
        type: 'choose', res,
        options: options.slice(),
        index: opt.defaultIndex || 0,
        cancelIndex: opt.cancelIndex != null ? opt.cancelIndex : -1,
        caption: opt.caption || null,
        capPages: [], capPage: 0, capDone: !opt.caption, capPv: null,
        sc: 0, t: 0,
        w: 0
      };
      const g = ctx2d;
      let maxW = 60;
      g.font = FONT(20);
      options.forEach(o => maxW = Math.max(maxW, g.measureText(o).width));
      active.w = Math.min(maxW + 90, W - (safePad + 10) - 24);
      if (active.caption) {
        const cn = active.caption.name || '';
        pushHistory(cn, active.caption.text);
        active.capPv = (cn && ADV.Maps && ADV.Maps.portraitOf) ? ADV.Maps.portraitOf(cn) : null;
        const lines = wrap(g, active.caption.text, msgW() - 60 - (active.capPv ? 62 : 0), 21);
        for (let i = 0; i < lines.length; i += 3) active.capPages.push(lines.slice(i, i + 3));
      }
    });
  }
  /* 光标移动后把滚动起点 sc 夹回可视窗口 */
  function clampChooseScroll(a) {
    const view = Math.min(a.options.length, CHOOSE_VIEW);
    a.sc = Math.max(0, Math.min(a.sc, a.options.length - view));
    if (a.index < a.sc) a.sc = a.index;
    if (a.index >= a.sc + view) a.sc = a.index - view + 1;
  }
  /* 选项窗几何（渲染与触屏命中共用同一套计算） */
  function chooseGeom(a) {
    const view = Math.min(a.options.length, CHOOSE_VIEW);
    const w = a.w, h = view * 40 + 26;
    const x = W - w - (safePad + 10), y = H - 200 - h;
    return { x, y, w, h, view };
  }

  /* ---------- 道具 / 徽章获得 ---------- */
  function itemGet(name, gemColor) {
    ADV.Audio.sfx('item');
    return new Promise(res => { itemAnim = { type: 'item', name, gemColor, t: 0, res }; });
  }

  function toast(t) {
    // 时长随文本长度伸缩（读得完再消失），队列上限放宽到 5 条
    toasts.push({ text: t, t: 0, dur: 2.2 + Math.min(2.2, String(t).length / 14) });
    if (toasts.length > 5) toasts.shift();   // 超过 5 条时挤掉最旧的
  }

  /* ---------- 对话历史（L 键回看） ---------- */
  const msgHistory = [];              // [{name, text}] 最多 60 条
  let logOpen = false, logScroll = 0;
  function pushHistory(name, text) {
    msgHistory.push({ name: name || '', text: String(text || '') });
    if (msgHistory.length > 60) msgHistory.shift();
  }
  function toggleLog(force) {
    logOpen = force != null ? !!force : !logOpen;
    if (logOpen) logScroll = 0;
    if (ADV.Audio && ADV.Audio.sfx) ADV.Audio.sfx(logOpen ? 'ok' : 'cancel');
    return logOpen;
  }

  /* ---------- 输入处理（由主循环转发） ---------- */
  function handleInput(press) {
    if (logOpen) {                                        // 回看模式：冻结其它输入，↑↓ 翻阅
      if (press.up) logScroll += 3;
      if (press.down) logScroll = Math.max(0, logScroll - 3);
      if (press.ok || press.cancel) toggleLog(false);
      return;
    }
    if (active && active.type === 'say') {
      if (press.ok) {
        ADV.Audio.sfx('ok');
        if (!active.done) { active.shown = 999; active.done = true; }
        else {
          active.page++;
          if (active.page >= active.pages.length) { const r = active.res; active = null; r(); }
          else { active.shown = 0; active.done = false; }
        }
      }
    } else if (active && active.type === 'choose') {
      if (!active.capDone) {                              // 说明文字分页中：Z 翻页，X/Esc 直接跳到选项
        if (press.ok || press.cancel) {
          if (press.cancel || active.capPage >= active.capPages.length - 1) active.capDone = true;
          else active.capPage++;
          ADV.Audio.sfx('ok');
        }
        return;
      }
      const n = active.options.length;
      if (press.up) { active.index = (active.index + n - 1) % n; clampChooseScroll(active); ADV.Audio.sfx('cursor'); }
      if (press.down) { active.index = (active.index + 1) % n; clampChooseScroll(active); ADV.Audio.sfx('cursor'); }
      if (press.pageup) { active.index = Math.max(0, active.index - CHOOSE_VIEW); clampChooseScroll(active); ADV.Audio.sfx('cursor'); }
      if (press.pagedown) { active.index = Math.min(n - 1, active.index + CHOOSE_VIEW); clampChooseScroll(active); ADV.Audio.sfx('cursor'); }
      if (press.ok) { const i = active.index; const r = active.res; active = null; ADV.Audio.sfx('ok'); r(i); }
      else if (press.cancel && active.cancelIndex >= 0) {
        const r = active.res; const i = active.cancelIndex; active = null; ADV.Audio.sfx('cancel'); r(i);
      }
    } else if (itemAnim) {
      if (press.ok && itemAnim.t > .5) { const r = itemAnim.res; itemAnim = null; ADV.Audio.sfx('ok'); r(); }
    }
  }

  function update(dt, press, held) {
    for (let i = toasts.length - 1; i >= 0; i--) {
      toasts[i].t += dt;
      if (toasts[i].t > toasts[i].dur) toasts.splice(i, 1);
    }
    if (itemAnim) itemAnim.t += dt;
    if (active && active.type === 'say') {
      active.t += dt;
      const total = active.pages[active.page].join('').length;
      if (!active.done) {
        active.shown += dt * (held && held.ok ? 220 : 36);   // 按住 Z/空格：打字机 6 倍速快进
        if (active.shown >= total) { active.shown = total; active.done = true; }
      }
    }
    if (active && active.type === 'choose') active.t += dt;   // 供说明文字▼闪烁
    handleInput(press);
  }

  /* ---------- 渲染 ---------- */
  let ctx2d = null;
  function setCtx(c) { ctx2d = c; }

  function render(g) {
    if (!ctx2d) return;

    // 消息窗口
    if (active && active.type === 'say') {
      const x = msgX(), y = H - 172, w = msgW(), h = 140;
      drawWindow(g, x, y, w, h);
      if (active.name) {
        const nw = active.name.length * 22 + 30;
        drawWindow(g, x + 14, y - 20, nw, 36);
        text(g, active.name, x + 14 + nw / 2, y - 12, 19, '#ffe9a8', 'center');
      }
      const lines = active.pages[active.page];
      let tx = x + 30;
      if (active.pv) tx = x + 22 + drawPortrait(g, active.pv, x + 22, y + 20) + 6;
      let count = Math.floor(active.shown);
      for (let i = 0; i < lines.length; i++) {
        const ln = lines[i].slice(0, Math.max(0, count));
        count -= lines[i].length;
        text(g, ln, tx, y + 22 + i * 36, 21);
      }
      if (active.done && Math.floor(active.t * 2.4) % 2 === 0)
        text(g, '▼', x + w - 38, y + h - 30, 17, '#ffe9a8', 'center');
    }

    // 选项窗口（若带 caption，则先绘制消息窗；说明文字分页，不截断）
    if (active && active.type === 'choose') {
      if (active.caption) {
        const cx = msgX(), cy = H - 172, cw = msgW(), ch = 140;
        drawWindow(g, cx, cy, cw, ch);
        let tx = cx + 30;
        if (active.caption.name) {
          const nw = active.caption.name.length * 22 + 30;
          drawWindow(g, cx + 14, cy - 20, nw, 36);
          text(g, active.caption.name, cx + 14 + nw / 2, cy - 12, 19, '#ffe9a8', 'center');
          if (active.capPv) tx = cx + 22 + drawPortrait(g, active.capPv, cx + 22, cy + 20) + 6;
        }
        const lines = active.capPages[active.capPage] || [];
        lines.forEach((ln, i) => text(g, ln, tx, cy + 22 + i * 36, 21));
        if (!active.capDone && Math.floor(active.t * 2.4) % 2 === 0)
          text(g, '▼', cx + cw - 38, cy + ch - 30, 17, '#ffe9a8', 'center');
        if (!active.capDone && active.capPages.length > 1)
          text(g, `${active.capPage + 1}/${active.capPages.length}`, cx + cw - 20, cy + 10, 12, '#8a94c0', 'right', 'normal');
      }
      const gm = chooseGeom(active);
      drawWindow(g, gm.x, gm.y, gm.w, gm.h);
      if (active.sc > 0) text(g, '▲', gm.x + gm.w - 26, gm.y + 6, 14, '#ffe9a8', 'center', 'normal');
      if (active.sc + gm.view < active.options.length) text(g, '▼', gm.x + gm.w - 26, gm.y + gm.h - 22, 14, '#ffe9a8', 'center', 'normal');
      for (let vi = 0; vi < gm.view; vi++) {
        const i = active.sc + vi, o = active.options[i];
        const oy = gm.y + 16 + vi * 40;
        if (i === active.index) {
          g.fillStyle = 'rgba(120,150,255,.25)';
          g.fillRect(gm.x + 10, oy - 4, gm.w - 20, 36);
          text(g, '▶', gm.x + 24, oy, 19, '#ffe9a8');
        }
        text(g, o, gm.x + 52, oy, 20, i === active.index ? '#ffe9a8' : '#fff');
      }
    }

    // 道具获得
    if (itemAnim) {
      const t = itemAnim.t;
      const a = Math.min(1, t / .3) * (t > 2.2 ? Math.max(0, 1 - (t - 2.2) / .3) : 1);
      g.save(); g.globalAlpha = a;
      const w = 520, h = 130, x = (W - w) / 2, y = H / 2 - 200 + Math.sin(Math.min(t / .3, 1) * Math.PI / 2) * 14;
      drawWindow(g, x, y, w, h);
      ADV.Sprites.drawGem(g, x + 70, y + h / 2, itemAnim.gemColor, true, 18);
      text(g, '获得了【' + itemAnim.name + '】！', x + w / 2 + 20, y + h / 2 - 24, 24, '#ffe9a8', 'center');
      text(g, '按 Z / 空格 继续', x + w / 2, y + h / 2 + 14, 15, '#aab4d4', 'center', 'normal');
      g.restore();
    }
  }

  /* ---------- toast 渲染（独立于 render，由主循环画在最上层，避免被窗口盖住） ---------- */
  function renderToasts(g) {
    if (!ctx2d || !toasts.length) return;
    const y0 = hudMode === 'full' ? 240 : 86;       // 完整 HUD 展开时下移，避开左侧面板与小地图
    toasts.forEach((tm, i) => {
      const a = tm.t < .2 ? tm.t / .2 : (tm.t > tm.dur - .5 ? Math.max(0, 1 - (tm.t - (tm.dur - .5)) / .5) : 1);
      g.save(); g.globalAlpha = a;
      g.font = FONT(16);
      const w = g.measureText(tm.text).width + 50;
      const ty = y0 + i * 46;
      drawWindow(g, (W - w) / 2, ty, w, 38);
      text(g, tm.text, W / 2, ty + 10, 16, '#ffe9a8', 'center');
      g.restore();
    });
  }

  /* ---------- 对话回看浮层（L 键；由主循环画在所有层之上） ---------- */
  function renderLog(g) {
    if (!logOpen || !ctx2d) return;
    g.fillStyle = 'rgba(6,8,24,.78)'; g.fillRect(0, 0, W, H);
    const w = 720, h = 540, x = (W - w) / 2, y = (H - h) / 2;
    drawWindow(g, x, y, w, h);
    text(g, '📜 对话回看', x + 28, y + 16, 18, '#ffe9a8');
    text(g, `共 ${msgHistory.length} 条 · ↑↓ 翻阅 · L / Z 关闭`, x + w - 28, y + 22, 13, '#8a94c0', 'right', 'normal');
    const lh = 24, maxLines = Math.floor((h - 70) / lh);
    const rows = [];
    for (const m of msgHistory) {
      const lines = wrap(g, m.text, w - 90, 15);
      lines.forEach((ln, i) => rows.push({ name: i === 0 ? m.name : '', s: ln }));
    }
    logScroll = Math.max(0, Math.min(logScroll, Math.max(0, rows.length - maxLines)));
    const start = Math.max(0, rows.length - maxLines - logScroll);
    g.save(); g.beginPath(); g.rect(x + 16, y + 44, w - 32, h - 60); g.clip();
    for (let vi = 0; vi < maxLines; vi++) {
      const r = rows[start + vi];
      if (!r) continue;
      const ry = y + 52 + vi * lh;
      let tx = x + 28;
      if (r.name) { text(g, r.name + '：', tx, ry, 14, '#ffe9a8', undefined, 'left'); tx += g.measureText(r.name + '：').width; }
      text(g, r.s, tx, ry, 15, '#e8ecff', undefined, 'left');
    }
    g.restore();
    if (start > 0) text(g, '▲', x + w / 2, y + 44, 13, '#ffe9a8', 'center', 'normal');
    if (start + maxLines < rows.length) text(g, '▼', x + w / 2, y + h - 22, 13, '#ffe9a8', 'center', 'normal');
  }

  /* ---------- 触屏/鼠标点按命中（px,py 为画布逻辑坐标；由 main.js 换算后调用）
   * 返回 true 表示这次点按被 UI 接管（对话推进/选项/回看/拾取动画） ---------- */
  function tapAt(px, py) {
    if (logOpen) { toggleLog(false); return true; }
    if (itemAnim) {
      if (itemAnim.t > .5) { const r = itemAnim.res; itemAnim = null; ADV.Audio.sfx('ok'); r(); }
      return true;
    }
    if (active && active.type === 'say') { handleInput({ ok: true }); return true; }
    if (active && active.type === 'choose') {
      if (!active.capDone) { handleInput({ ok: true }); return true; }   // 点任意处 = 翻说明页
      const gm = chooseGeom(active);
      const inWin = px >= gm.x && px <= gm.x + gm.w && py >= gm.y && py <= gm.y + gm.h;
      if (!inWin) {                                                      // 窗外 = 取消（若有取消位）
        if (active.cancelIndex >= 0) { const r = active.res; const i = active.cancelIndex; active = null; ADV.Audio.sfx('cancel'); r(i); }
        return true;
      }
      if (py <= gm.y + 28 && active.sc > 0) { active.sc--; ADV.Audio.sfx('cursor'); return true; }                                       // ▲
      if (py >= gm.y + gm.h - 28 && active.sc + gm.view < active.options.length) { active.sc++; ADV.Audio.sfx('cursor'); return true; }  // ▼
      const vi = Math.floor((py - (gm.y + 12)) / 40);
      if (vi >= 0 && vi < gm.view) {
        const i = active.sc + vi;
        if (i === active.index) handleInput({ ok: true });
        else { active.index = i; clampChooseScroll(active); ADV.Audio.sfx('cursor'); }
      }
      return true;
    }
    return false;   // 无窗口接管：调用方可继续处理场景点击
  }

  /* ---------- 手册点按命中（与 renderJournal 几何一致；动作由 main.js 应用） ---------- */
  function journalHit(tab, px, py) {
    tab = Math.max(0, Math.min(TAB_META.length - 1, tab || 0));
    const w = 720, h = 540, x = (W - w) / 2, y = (H - h) / 2;
    if (px < x || px > x + w || py < y || py > y + h) return { t: 'close' };
    let gi = JOURNAL_GROUPS.findIndex(gr => gr.tabs.indexOf(tab) >= 0);
    if (gi < 0) gi = 0;
    for (let i = 0; i < JOURNAL_GROUPS.length; i++) {
      const gx = x + 28 + i * 86, gy = y + 14;
      if (px >= gx - 8 && px <= gx + 66 && py >= gy && py <= gy + 24) return { t: 'group', gi: i, tab: JOURNAL_GROUPS[i].tabs[0] };
    }
    const gr = JOURNAL_GROUPS[gi];
    for (let si = 0; si < gr.tabs.length; si++) {
      const tx = x + 444 + si * 70, ty = y + 18;
      if (px >= tx - 8 && px <= tx + 58 && py >= ty - 4 && py <= ty + 20) return { t: 'tab', ti: gr.tabs[si] };
    }
    if (tab === 0) {                                                     // 好友页滚动箭头
      const cy2 = y + 70, ch2 = h - 84;
      if (px >= x + w - 50 && px <= x + w - 18) {
        if (py >= cy2 + 70 && py <= cy2 + 104) return { t: 'fup' };
        if (py >= cy2 + ch2 - 62 && py <= cy2 + ch2 - 28) return { t: 'fdown' };
      }
    }
    return null;   // 窗口内非可点区域：不动作
  }

  /* ---------- 手册（F 键） ----------
   * 分组 + 子页：顶栏左边是五个组（关系/生活/收藏/学习/成长），
   * 右边只列当前组的子页，内容区不再被 9 个页签挤乱。
   * ↑ ↓ 切组、← → 组内切页（journalMove 为纯函数，便于测试）。 */
  const JOURNAL_GROUPS = [
    { name: '关系', tabs: [0] },
    { name: '生活', tabs: [1, 2] },
    { name: '收藏', tabs: [3, 4, 5, 6] },
    { name: '学习', tabs: [7, 8] },
    { name: '成长', tabs: [9, 10, 11] }
  ];
  const TAB_META = [
    { label: '好友', group: '关系', hint: '认识的人与故事' },
    { label: '任务', group: '生活', hint: '今天最该做的事' },
    { label: '日历', group: '生活', hint: '这周会发生什么' },
    { label: '图鉴', group: '收藏', hint: '小镇的风物收集' },
    { label: '生物', group: '收藏', hint: '虫·水·兽 三系图鉴' },
    { label: '背包', group: '收藏', hint: '身上带着什么' },
    { label: '摘抄', group: '收藏', hint: '抄下来的句子与心情' },
    { label: '课堂', group: '学习', hint: '课程表与答题成绩' },
    { label: '研习', group: '学习', hint: '知识树与错题本' },
    { label: '成就', group: '成长', hint: '一路上完成的大事' },
    { label: '成长', group: '成长', hint: '等级、五维与大事记' },
    { label: '技能', group: '成长', hint: '五系技能与专精加成' }
  ];
  const GROUP_COLOR = { '关系': '#ff9ec2', '生活': '#ffd36f', '收藏': '#8fe3c8', '学习': '#8ab4ff', '成长': '#c8a6ff' };
  function journalMove(tab, key) {
    let gi = JOURNAL_GROUPS.findIndex(gr => gr.tabs.indexOf(tab) >= 0);
    if (gi < 0) gi = 0;
    const gr = JOURNAL_GROUPS[gi], at = gr.tabs.indexOf(tab);
    if (key === 'right') return gr.tabs[Math.min(gr.tabs.length - 1, at + 1)];
    if (key === 'left') return gr.tabs[Math.max(0, at - 1)];
    if (key === 'down') return JOURNAL_GROUPS[Math.min(JOURNAL_GROUPS.length - 1, gi + 1)].tabs[0];
    if (key === 'up') return JOURNAL_GROUPS[Math.max(0, gi - 1)].tabs[0];
    return tab;
  }

  /* ---------- 手册页内滚动（好友页 / 任务·背包等长列表共用 PgUp/PgDn） ---------- */
  const FRIEND_ROWS = 7;                  // 好友页一屏可显示的行数（双列 → 14 人）
  const LIST_STEP = 7;                    // 任务/背包列表每次滚动的行数
  let friendScroll = 0;
  let listScroll = 0;                     // 任务/背包等列表页的页内滚动行
  function journalPage(dir, tab) {        // dir: +1 下翻 / -1 上翻；tab=0 好友页，其余滚动通用列表
    if (tab === 0) friendScroll = Math.max(0, friendScroll + dir * FRIEND_ROWS);
    else listScroll = Math.max(0, listScroll + dir * LIST_STEP);
    return tab === 0 ? friendScroll : listScroll;
  }
  function resetJournalScroll() { friendScroll = 0; listScroll = 0; }
  function journalPageMax(rows) { return Math.max(0, rows - FRIEND_ROWS); }
  function renderJournal(g, friends, BOND, tab, ctx2) {
    tab = Math.max(0, Math.min(TAB_META.length - 1, tab || 0));
    let gi = JOURNAL_GROUPS.findIndex(gr => gr.tabs.indexOf(tab) >= 0);
    if (gi < 0) gi = 0;
    const picked = TAB_META[tab];
    g.fillStyle = 'rgba(6,8,24,.72)'; g.fillRect(0, 0, W, H);
    const w = 720, h = 540, x = (W - w) / 2, y = (H - h) / 2;
    drawWindow(g, x, y, w, h);
    const cy = y + 70, ch = h - 84;
    // 顶栏：组片（左） + 当前组子页（右）
    JOURNAL_GROUPS.forEach((gr, i) => {
      const gx = x + 28 + i * 86;
      const on = i === gi;
      if (on) { g.fillStyle = 'rgba(120,150,255,.2)'; g.fillRect(gx - 8, y + 14, 74, 24); }
      text(g, gr.name, gx, y + 18, 15, on ? '#ffe9a8' : GROUP_COLOR[gr.name]);
    });
    text(g, '▸', x + 434, y + 18, 15, '#8a94c0');
    JOURNAL_GROUPS[gi].tabs.forEach((ti, si) => {
      const tx = x + 444 + si * 70, ty = y + 18;
      if (ti === tab) { g.fillStyle = 'rgba(120,150,255,.24)'; g.fillRect(tx - 8, ty - 4, 66, 24); }
      text(g, (ti === tab ? '▶ ' : '') + TAB_META[ti].label, tx, ty, 16, ti === tab ? '#ffe9a8' : GROUP_COLOR[picked.group]);
    });
    text(g, picked.hint, x + w - 26, y + 46, 13, GROUP_COLOR[picked.group], 'right', 'normal');
    text(g, '← → 切页 · ↑ ↓ 切组' + (tab === 0 ? ' · PgUp/PgDn 翻好友' : '') + ' · F 关闭', x + w - 26, y + h - 26, 13, '#8a94c0', 'right', 'normal');
    if (tab === 0) renderFriends(g, friends, BOND, x, cy, w, ch);
    else if (tab === 1 && ADV.Game && ADV.Game.questList) renderQuests(g, x, cy, w, ch);
    else if (tab === 2 && ADV.Game && ADV.Game.upcomingEvents) renderCalendar(g, x, cy + 60, w, ch - 80);
    else if (tab === 3 && ADV.Collect) renderCollect(g, x, cy, w, ch);
    else if (tab === 4 && ADV.Collect) renderCritters(g, x, cy, w, ch);
    else if (tab === 5 && ADV.Collect) renderBag(g, x, cy, w, ch);
    else if (tab === 6) renderExcerpts(g, x, cy, w, ch);
    else if (tab === 7) renderClass(g, x, cy, w, ch);
    else if (tab === 8) renderTree(g, x, cy, w, ch);
    else if (tab === 9 && ADV.Game && ADV.Game.achievements) renderAchv(g, x, cy + 60, w, ch - 80);
    else if (tab === 10 && ADV.Growth) renderGrowth(g, x, cy + 60, w, ch - 80);
    else if (tab === 11 && ADV.Skills) renderSkills(g, x, cy, w, ch);
  }
  /* ---------- 成长页：五维雷达 + 等级称号 + 大事记 ---------- */
  function renderGrowth(g, x, y, w, h) {
    const G = ADV.Growth, ag = G.aggregate();
    const dims = G.DIMS;
    // 等级条
    text(g, `Lv.${G.lv} 「${G.title()}」`, x + 40, y, 22, '#ffe9a8', undefined, 'left');
    const bw = 260, bx = x + 250;
    g.fillStyle = '#1a1c30'; g.fillRect(bx, y + 6, bw, 14);
    g.fillStyle = '#7ab0ff'; g.fillRect(bx, y + 6, bw * Math.min(1, G.xp / G.nextLv()), 14);
    g.strokeStyle = '#d8c078'; g.lineWidth = 2; g.strokeRect(bx - 2, y + 4, bw + 4, 18);
    text(g, `XP ${G.xp}/${G.nextLv()}`, bx + bw + 12, y + 4, 13, '#cfe0ff', undefined, 'normal');
    // 五维雷达（左半）
    const cx = x + 170, cy = y + 190, R = 105, N = dims.length;
    for (let ring = 1; ring <= 4; ring++) {
      g.strokeStyle = 'rgba(216,192,120,.25)'; g.lineWidth = 1;
      g.beginPath();
      for (let i = 0; i <= N; i++) {
        const a = -Math.PI / 2 + i * 2 * Math.PI / N, r = R * ring / 4;
        const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
        i === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
      }
      g.stroke();
    }
    g.beginPath();
    for (let i = 0; i <= N; i++) {
      const d = dims[i % N][0], v = Math.max(4, ag[d]);
      const a = -Math.PI / 2 + (i % N) * 2 * Math.PI / N, r = R * v / 100;
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      i === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.closePath();
    g.fillStyle = 'rgba(122,176,255,.4)'; g.fill();
    g.strokeStyle = '#7ab0ff'; g.lineWidth = 2; g.stroke();
    dims.forEach(([k, cn, icon], i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / N;
      const lx = cx + Math.cos(a) * (R + 24), ly = cy + Math.sin(a) * (R + 18);
      text(g, `${icon}${cn} ${ag[k]}`, lx, ly - 8, 13, '#e8ecff', 'center', 'normal');
    });
    // 大事记（右半）
    text(g, '🌱 成长大事记', x + 380, y + 34, 17, '#ffe9a8', undefined, 'left');
    const log = G.log.slice(0, 11);
    if (!log.length) text(g, '你的故事，从今天开始……', x + 380, y + 64, 14, '#9aa0c0', undefined, 'normal');
    log.forEach((m, i) => {
      text(g, `第${m.day}天`, x + 380, y + 64 + i * 32, 12, '#8a94c0', undefined, 'normal');
      text(g, m.text.slice(0, 20), x + 424, y + 64 + i * 32, 13, '#e8ecff', undefined, 'normal');
    });
    text(g, '答题/战斗/剧情/收集都会成长 · 五维解锁场景互动', x + w / 2, y + h - 12, 12, '#8a94c0', 'center', 'normal');
  }
  /* ---------- 技能页：农/矿/渔/战/交 五系专精（星露谷式） ---------- */
  function renderSkills(g, x, y, w, h) {
    const SK = ADV.Skills;
    text(g, '🛠 校园生活技能', x + 40, y + 4, 20, '#ffe9a8', undefined, 'left');
    text(g, '日常劳作皆学问——坚持做，就会专精', x + w - 40, y + 8, 13, '#8a94c0', 'right', 'normal');
    SK.BRANCHES.forEach(([k, cn, icon], i) => {
      const col = i % 2, row = (i / 2) | 0;
      const bx = x + 40 + col * 340, by = y + 44 + row * 130;
      const lv = SK.lv(k), xpv = SK.xp(k), need = SK.need(k), maxed = lv >= 5;
      // 底板
      g.fillStyle = 'rgba(120,150,255,.08)'; g.fillRect(bx - 12, by - 8, 320, 116);
      g.strokeStyle = 'rgba(216,192,120,.3)'; g.lineWidth = 1; g.strokeRect(bx - 12, by - 8, 320, 116);
      // 标题 + 等级
      text(g, `${icon} ${cn}`, bx, by, 17, '#ffe9a8', undefined, 'left');
      text(g, maxed ? 'Lv.MAX' : `Lv.${lv}`, bx + 90, by + 2, 15, maxed ? '#ffd36f' : '#cfe0ff', undefined, 'normal');
      // 经验条
      const bw = 120;
      g.fillStyle = '#1a1c30'; g.fillRect(bx + 140, by + 4, bw, 12);
      g.fillStyle = maxed ? '#ffd36f' : '#7ab0ff';
      g.fillRect(bx + 140, by + 4, bw * (maxed ? 1 : Math.min(1, xpv / Math.max(1, need))), 12);
      g.strokeStyle = '#d8c078'; g.strokeRect(bx + 139, by + 3, bw + 2, 14);
      text(g, maxed ? '满级' : `${xpv}/${need}`, bx + 266, by + 2, 12, '#8a94c0', undefined, 'normal');
      // 下一级预告 / 满级寄语
      if (!maxed) text(g, `下一级：${SK.PERKS[k][lv]}`, bx, by + 26, 13, '#ffd36f', undefined, 'normal');
      else text(g, '专精已成——加成长久生效', bx, by + 26, 13, '#ffd36f', undefined, 'normal');
      // 已解锁加成
      SK.PERKS[k].slice(0, lv).forEach((p, j) => {
        text(g, `✓ Lv${j + 1} ${p}`, bx, by + 50 + j * 16, 12, '#9fe3b8', undefined, 'normal');
      });
    });
    // 第六格：专精总览
    const bx = x + 380, by = y + 44 + 2 * 130;
    const total = SK.BRANCHES.reduce((s, b) => s + SK.lv(b[0]), 0);
    text(g, '🏆 专精总览', bx, by, 15, '#ffe9a8', undefined, 'left');
    text(g, `五系合计 Lv.${total}/25`, bx, by + 26, 14, '#cfe0ff', undefined, 'normal');
    text(g, '农艺：后院耕作 · 采矿：矿道敲矿\n钓鱼：河边甩竿 · 战斗：武术课与擂台\n社交：闲聊与送礼', bx, by + 52, 12, '#8a94c0', undefined, 'normal');
  }
  /* ---------- 日历页：专题周 + 未来七天事件 ---------- */
  function renderCalendar(g, x, y, w, h) {
    const up = ADV.Game.upcomingEvents();
    text(g, '📅 ' + up.theme + '（当周学科打卡双倍）', x + 40, y, 19, '#ffe9a8', undefined, 'left');
    up.rows.forEach((r, i) => {
      const cy = y + 36 + i * 52;
      text(g, r.tag, x + 40, cy, 16, r.evs.length ? '#ffe9a8' : '#8a94c0');
      if (!r.evs.length) text(g, '（平平常常的一天）', x + 110, cy, 14, '#9aa0c0', undefined, 'normal');
      r.evs.slice(0, 3).forEach((e, j) => text(g, e, x + 110, cy + j * 17, 13, '#e8ecff', undefined, 'normal'));
    });
    text(g, '睡一觉推进一天 · 事件都在路上', x + w / 2, y + h - 14, 13, '#8a94c0', 'center', 'normal');
  }
  /* ---------- 成就页 ---------- */
  function renderAchv(g, x, y, w, h) {
    const list = ADV.Game.achievements();
    const done = list.filter(a => a.done).length;
    text(g, `🏆 成就 ${done}/${list.length}`, x + 40, y, 19, '#ffe9a8', undefined, 'left');
    list.forEach((a, i) => {
      const cx = x + 40 + (i % 2) * 330, cy = y + 34 + ((i / 2) | 0) * 30;
      g.globalAlpha = a.done ? 1 : .65;    // 未达成也保持可读（原 .4 近乎隐形，P2-22）
      text(g, (a.done ? '★ ' : '☆ ') + a.name, cx, cy, 15, a.done ? '#ffe9a8' : '#8890b0', undefined, 'left');
      text(g, a.desc, cx + 150, cy, 12, '#8a94c0', undefined, 'normal');
      g.globalAlpha = 1;
    });
  }
  /* ---------- 学习报告页（课程表 / 知识树 / 答题统计 / 错题本 / 阅读写作） ---------- */
  /* ---------- 学习组·课堂页：今日课程 / 近 7 天答题 / 阅读写作 ---------- */
  function renderClass(g, x, y, w, h) {
    const C = ADV.Cal, M = ADV.Mistake, f = ADV.Game.flags;
    if (C && C.today) {
      const wd = ['一', '二', '三', '四', '五', '六', '日'][C.weekday() - 1];
      const list = C.today();
      const fest = C.festival ? C.festival() : '';
      text(g, `📅 星期${wd} · 今日课程${fest ? ' · 🎉 ' + fest : ''}`, x + 40, y + 40, 17, '#ffe9a8', undefined, 'left');
      text(g, list.length ? list.map(s => '「' + s + '」').join(' ') : '（休息日，自由活动！）', x + 40, y + 66, 16, '#e8ecff', undefined, 'left');
    }
    if (M) {
      const q = M.quizStats();
      text(g, '📊 近 7 天答题', x + 40, y + 128, 17, '#ffe9a8', undefined, 'left');
      text(g, `共 ${q.n} 题 · 正确率 ${q.rate}% · 活跃 ${q.days} 天`, x + 40, y + 154, 15, '#e8ecff', undefined, 'left');
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 40, y + 176, w - 80, 6);
      g.fillStyle = q.rate >= 80 ? '#4ae86c' : q.rate >= 50 ? '#ffd94c' : '#ff8a6a';
      g.fillRect(x + 40, y + 176, (w - 80) * q.rate / 100, 6);
    }
    const read = f.read ? Object.keys(f.read).filter(k => f.read[k] && f.read[k].done).length : 0;
    const dia = (f.diary || []).length;
    text(g, '📚 阅读与写作', x + 40, y + 216, 17, '#ffe9a8', undefined, 'left');
    text(g, `读完 ${read} 册 · 日记 ${dia} 篇${f.diaryStars ? ` · 写作星 ${f.diaryStars} 颗（每 3 篇一颗）` : ''}`, x + 40, y + 242, 15, '#e8ecff', undefined, 'left');
    text(g, '上课 / 每日一题 / 考试答对都得知识点；错题与知识树见「研习」页', x + w / 2, y + h - 30, 13, '#8a94c0', 'center', 'normal');
  }
  /* ---------- 学习组·研习页：知识树 / 错题本 ---------- */
  function renderTree(g, x, y, w, h) {
    const M = ADV.Mistake;
    if (M && M.TREE) {
      text(g, '🌱 知识树 · 答对题点亮（战斗联动）', x + 40, y + 40, 17, '#ffe9a8', undefined, 'left');
      const subs = [['math', '数学'], ['chinese', '语文'], ['english', '英语'], ['science', '科学'], ['final', '综合']];
      const colW = (w - 80) / 2;
      subs.forEach(([en, cn], i) => {
        const cx = x + 40 + (i % 2) * colW, cy2 = y + 72 + ((i / 2) | 0) * 32;
        const k = M.kp(en), u = M.unlocked(en);
        const dots = M.TREE[en].map((nm2, j) => j < u ? '●' : '○').join('');
        const nx = M.TREE[en][u];
        const tip = nx ? ` · 下一点「${nx}」差 ${Math.max(1, M.NEED[u] - k)} 点` : ' · 圆满！';
        text(g, `${cn} ${dots} ${k}点${tip}`, cx, cy2, 14, u ? '#b8e8ff' : '#8a94c0', undefined, 'left');
      });
      const tot = M.totalNodes(), all = Object.keys(M.TREE).length * 5;
      text(g, `已点亮 ${tot}/${all} 节点 · 战斗：攻击 +${Math.min(10, (tot / 2) | 0)} · 血量 +${tot * 2} · 学科技能随节点升威力`, x + 40, y + 178, 13, '#8a94c0', undefined, 'left');
    }
    if (M) {
      const s = M.stats();
      text(g, '📖 错题本（间隔重复）', x + 40, y + 232, 17, '#ffe9a8', undefined, 'left');
      text(g, `在册 ${s.total} 题 · 今日待复习 ${s.due} 题（夜晚书桌可复习）`, x + 40, y + 258, 15, s.due ? '#ffb0a0' : '#e8ecff', undefined, 'left');
    }
    text(g, '答题点亮知识树，战斗更轻松；错题隔天复习记得更牢', x + w / 2, y + h - 30, 13, '#8a94c0', 'center', 'normal');
  }
  function renderQuests(g, x, y, w, h) {
    const list = ADV.Game.questList();
    const stage = ADV.Game.guideStage ? ADV.Game.guideStage() : 'full';
    const chapter = ADV.Game.chapterState ? ADV.Game.chapterState() : null;
    if (chapter) {
      text(g, chapter.title, x + 44, y + 36, 20, '#ffe9a8', undefined, 'left');
      text(g, chapter.short, x + 44, y + 60, 13, '#aab4d4', undefined, 'left');
      text(g, `章节重心：${chapter.focus}`, x + 44, y + 82, 13, '#8a94c0', undefined, 'left');
    }
    if (stage !== 'full')
      text(g, '先把学校过熟，再慢慢把冒险铺开。', x + w / 2, y + 110, 14, '#aab4d4', 'center', 'normal');
    if (stage === 'arrival')
      text(g, '推荐路线：家 -> 小镇东口 -> 校园喷泉', x + w / 2, y + 132, 13, '#8a94c0', 'center', 'normal');
    else if (stage === 'settle')
      text(g, '推荐路线：喷泉 -> 教学楼/图书馆 -> 校务板 -> 回家', x + w / 2, y + 132, 13, '#8a94c0', 'center', 'normal');
    const vis = 14;                                        // 页内滚动（P2-23：不再静默截断）
    listScroll = Math.max(0, Math.min(listScroll, Math.max(0, list.length - vis)));
    const start = listScroll;
    const oy = stage === 'full' ? 112 : 156;
    list.slice(start, start + vis).forEach((s, i) => {
      const main = s.startsWith('【主线】');
      const chapterLine = s.startsWith('【章节】');
      text(g, s, x + 44, y + oy + i * 30, chapterLine ? 17 : (main ? 19 : 16), chapterLine ? '#7ab0ff' : (main ? '#ffe9a8' : '#e8ecff'), undefined, 'left');
    });
    if (list.length > vis)
      text(g, `${start + 1}-${Math.min(start + vis, list.length)}/${list.length} 项 · PgUp/PgDn 翻看`, x + w - 44, y + h - 30, 12, '#8a94c0', 'right', 'normal');
    text(g, stage === 'full' ? '睡一觉后，会提示今日目标' : '第一天不用赶进度，先熟悉校园和人', x + w / 2, y + h - 30, 13, '#8a94c0', 'center');
  }
  function renderFriends(g, friends, BOND, x, y, w, h) {
    text(g, '每天第一次正式聊天更有效；做对选择、同行、送礼会更快增进好感', x + w / 2, y + 54, 14, '#aab4d4', 'center');
    const ids = Object.keys(friends);
    if (!ids.length) { text(g, '还没有认识的朋友，去校园里走走吧～', x + w / 2, y + 130, 18, '#8890b0', 'center'); return; }
    const rows = Math.ceil(ids.length / 2);
    friendScroll = Math.max(0, Math.min(friendScroll, journalPageMax(rows)));
    const colW = (w - 60) / 2;
    g.save(); g.beginPath(); g.rect(x + 16, y + 76, w - 32, h - 88); g.clip();
    ids.forEach((id, i) => {
      const b = BOND && BOND[id];
      if (!b) return;
      const f = friends[id];
      const row = (i / 2) | 0;
      const cy = y + 88 + row * 62 - friendScroll * 62;
      if (cy < y + 60 || cy > y + h - 30) return;          // 视口外的行不画
      const cx = x + 30 + (i % 2) * colW;
      text(g, b.name, cx, cy, 18, '#fff');
      const hearts = Math.round(f.love / 10);
      text(g, '♥'.repeat(Math.max(0, hearts)) + '♡'.repeat(Math.max(0, 10 - hearts)), cx + 96, cy + 1, 15, hearts >= 7 ? '#ff8ab0' : '#d8c078');
      const meta = (ADV.Game.BOND_META || {})[id];
      const bdayTag = meta ? ` · 生日第${meta.bday}天` : '';
      const stage = ['初识', '相识', '知己', '挚友'][Math.min(3, f.stage)] || '初识';
      text(g, `${stage} · 故事 ${f.stage}/${b.stages.length} · 好感 ${f.love}${bdayTag}`, cx, cy + 26, 12, '#8a94c0');
    });
    g.restore();
    if (rows > FRIEND_ROWS) {                              // 滚动指示 + 行号
      const max = journalPageMax(rows);
      text(g, '▲', x + w - 34, y + 82, 15, friendScroll > 0 ? '#ffe9a8' : '#5a6288', 'center');
      text(g, '▼', x + w - 34, y + h - 50, 15, friendScroll < max ? '#ffe9a8' : '#5a6288', 'center');
      text(g, `${friendScroll + 1}-${Math.min(rows, friendScroll + FRIEND_ROWS)}/${rows} 行 · PgUp/PgDn`, x + w - 48, y + h - 26, 11, '#8a94c0', 'right', 'normal');
    }
  }
  function renderCollect(g, x, y, w, h) {
    // 顶部：总收集进度条 + 百分比（页签栏下方，分类列表上方）
    const pg = ADV.Collect.progress ? ADV.Collect.progress() : { got: 0, total: 0 };
    const pct = pg.total ? Math.floor(pg.got / pg.total * 100) : 0;
    const bx = x + 40, bw = w - 80;
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(bx, y + 48, bw, 5);
    g.fillStyle = pct >= 100 ? '#4ae86c' : '#ffd94c'; g.fillRect(bx, y + 48, bw * Math.min(pct, 100) / 100, 5);
    text(g, `收集进度 ${pct}%（${pg.got}/${pg.total}）`, x + 40, y + 57, 13, pct >= 100 ? '#4ae86c' : '#8a94c0', undefined, 'left');
    const mCnt = Object.values(ADV.Game.flags.martial || {}).filter(Boolean).length;
    const sCnt = Object.values(ADV.Game.flags.spells || {}).filter(Boolean).length;
    text(g, `⚔ 武学 ${mCnt}/5（第 ${(ADV.Game.flags.martial || {}).lvl || 0} 重） · ✦ 魔法 ${sCnt}/4 · 埋宝 ${Object.keys(ADV.Game.flags.dig || {}).length}/8`,
      x + w - 40, y + 57, 13, '#8a94c0', 'right', 'normal');
    const nCat = ADV.Collect.CATS.length;
    const many = nCat > 6;                          // 7 类时压缩行距
    const tight = nCat > 7;                         // 8 类时再压缩一档
    const rowH = tight ? 50 : many ? 60 : 82;
    ADV.Collect.CATS.forEach(([cat, label, icon], ci) => {
      const cy = y + 74 + ci * rowH;
      const n = ADV.Collect.catCount(cat), total = ADV.Collect.totalOf(cat);
      const all = ADV.Collect.DB[cat].length;
      // 超过 10 项只展示前 10 个名字——头部标注收录总数，不再无提示截断（P2-23）
      text(g, `${icon} ${label}  ${n}/${total}${all > 10 ? `（收录 ${all} 种，列前 10）` : ''}`, x + 40, cy, tight ? 16 : many ? 17 : 20, n >= total ? '#4ae86c' : '#ffe9a8');
      const list = ADV.Collect.DB[cat].slice(0, 10);
      list.forEach((it, i) => {
        const got = ADV.Collect.has(cat, it.id);
        g.globalAlpha = got ? 1 : .35;
        const oy = tight ? 20 : many ? 23 : 30;
        text(g, got ? it.name : '？？？', x + 44 + (i % 5) * 128, cy + oy + ((i / 5) | 0) * 16, tight ? 11 : many ? 12 : 13, got ? '#fff' : '#9aa0c0', undefined, 'left');
        g.globalAlpha = 1;
      });
    });
  }
  /* ---------- 生物图鉴页：宝可梦式收集（42 种 = 虫18 + 水12 + 兽12）
   * 未收显示剪影 + 出没线索；传说系未达进度显示 🔒；已收显示三维，金色异色高亮 ---------- */
  function renderCritters(g, x, y, w, h) {
    const co = ADV.Collect;
    const got = co.catCount('critters'), total = co.totalOf('critters');
    text(g, `🐾 生物图鉴  ${got}/${total}`, x + 40, y + 12, 20, got >= total ? '#4ae86c' : '#ffe9a8');
    text(g, `✨ 金色异色 ${co.shinyCount()}`, x + w - 40, y + 16, 14, '#ffd94c', 'right', 'normal');
    text(g, '野外窝点：仔细观察 → 投它爱吃的 → 挥网/下笼', x + w - 40, y + 34, 12, '#8a94c0', 'right', 'normal');
    const fams = [['虫', '🐛 虫系', '#8fe3c8'], ['水', '💧 水系', '#8ab4ff'], ['兽', '🐾 走兽系', '#ffd36f']];
    let fy = y + 46;
    fams.forEach(([fam, label, fcolor]) => {
      const list = co.critterList(fam);
      const n = list.filter(c => co.has('critters', c.id)).length;
      text(g, `${label}  ${n}/${list.length}`, x + 40, fy, 15, fcolor, undefined, 'left');
      fy += 20;
      list.forEach((cr, i) => {
        const cx = x + 40 + (i % 3) * 214, cy2 = fy + ((i / 3) | 0) * 23;
        let s, color, alpha = 1;
        if (!co.needOk(cr)) { s = `🔒 攒${cr.need}种现身`; color = '#5f6690'; alpha = .9; }
        else if (!co.has('critters', cr.id)) { s = `？？？ ${cr.hint.slice(0, 8)}`; color = '#6a739c'; alpha = .8; }
        else {
          const shiny = co.isShiny('critters', cr.id);
          const rearing = cr.evolve ? co.critterRearing(cr.id, ADV.Cal.day) : -1;
          s = `${cr.name}${shiny ? ' ✨' : ''}${rearing >= 0 ? ` 剩${rearing}天` : ''}  力${cr.pow} 速${cr.spd} 命${cr.hp}`;
          color = shiny ? '#ffd94c' : cr.rar === 3 ? '#c8a6ff' : '#fff';
        }
        g.globalAlpha = alpha;
        text(g, s, cx, cy2, 12, color, undefined, 'left');
        g.globalAlpha = 1;
      });
      fy += Math.ceil(list.length / 3) * 23 + 6;
    });
    // 称号里程碑进度（10/20/30/40 只 + 传说三只）
    const F = ADV.Game.flags;
    const miles = [[10, '初级观察员'], [20, '田野研究员'], [30, '生态学者'], [40, '图鉴大师']]
      .map(([n, t]) => `${got >= n ? '✔' : n} ${t}`).join('  ');
    const trio = ['i18', 'c12', 'm12'].map(id => co.has('critters', id) ? '✔' : '·').join('');
    text(g, `🏅 称号：${miles}  ｜  传说研究员 ${F.legendTrio ? '✔ 已获得' : trio + ' 三传说'}`, x + 40, fy + 2, 12, '#c8b6ff', undefined, 'left');
    text(g, '🫙 水缸饲养：毛毛虫·蝌蚪养在院子里，几天后会悄悄变化', x + 40, fy + 20, 12, '#8a94c0', undefined, 'left');
    text(g, '🏠 精灵小筑：小镇南街买球和口粮，珍稀架每日换新，草丛遭遇即开画布对战', x + 40, fy + 38, 12, '#8a94c0', undefined, 'left');
  }
  function renderBag(g, x, y, w, h) {
    text(g, '💰 金币：' + (ADV.Game.flags.gold || 0), x + 40, y + 70, 20, '#ffd94c');
    const list = ADV.Collect.bagList();
    if (!list.length) { text(g, '背包空空～小镇礼品店逛逛？', x + w / 2, y + 140, 16, '#8890b0', 'center'); return; }
    const vis = 12;                                        // 页内滚动（P2-23：不再静默截断）
    listScroll = Math.max(0, Math.min(listScroll, Math.max(0, list.length - vis)));
    const start = listScroll;
    list.slice(start, start + vis).forEach((it, i) => {
      const cx = x + 40 + (i % 2) * 330, cy = y + 106 + ((i / 2) | 0) * 30;
      text(g, `${it.gift ? '🎁' : '·'} ${it.name} ×${it.n}`, cx, cy, 16, '#fff', undefined, 'left');
    });
    if (list.length > vis)
      text(g, `${start + 1}-${Math.min(start + vis, list.length)}/${list.length} 件 · PgUp/PgDn 翻看`, x + w - 44, y + h - 30, 12, '#8a94c0', 'right', 'normal');
    text(g, 'G 键面向 NPC 送礼（生日当天翻倍）', x + w / 2, y + h - 30, 14, '#8a94c0', 'center');
  }

  /* ---------- 摘抄本页签：已摘句子（名句 / 书中句子）+ 日记统计 ---------- */
  function renderExcerpts(g, x, y, w, h) {
    const f = ADV.Game.flags;
    const ex = f.excerpts || {}, ids = Object.keys(ex);
    text(g, `✍ 摘抄本   ${ids.length} 句`, x + 40, y + 70, 21, ids.length ? '#ffe9a8' : '#8a94c0');
    if (!ids.length) {
      text(g, '本子还是空白的。', x + w / 2, y + 146, 18, '#8890b0', 'center');
      text(g, '图书馆书架 / 教室讲台 / 小镇书店 / 家里书柜 ——', x + w / 2, y + 180, 15, '#8a94c0', 'center');
      text(g, '翻开书，用 Z 键把喜欢的句子抄下来', x + w / 2, y + 204, 15, '#8a94c0', 'center');
    }
    ids.slice(-6).forEach((key, i) => {
      const e = ex[key] || {};
      let line = e.text, meta = e.note || '';
      if (!line) {
        const q = ADV.Collect.info('quotes', key);
        if (!q) return;
        line = q.name; meta = q.desc;
      }
      const cy = y + 104 + i * 44;
      text(g, `「${line}」`, x + 44, cy, 15, '#fff', undefined, 'left');
      text(g, `${meta.slice(0, 34)}　·　第 ${e.day || '?'} 天 · ${e.from || '途中'}`, x + 52, cy + 21, 13, '#8ab4ff', undefined, 'left');
    });
    if (ids.length > 6) text(g, `…… 还有 ${ids.length - 6} 句`, x + 52, y + 104 + 6 * 44, 14, '#8a94c0', undefined, 'left');
    const dn = (f.diary || []).length;
    text(g, `📔 日记 ${dn} 篇　·　写作星 ${f.diaryStars || 0} 颗`, x + 44, y + h - 64, 16, '#ffd94c', undefined, 'left');
    text(g, '夜晚在家书桌写日记 · 日记可引用你的摘抄，并算作复习', x + w / 2, y + h - 30, 14, '#8a94c0', 'center');
  }

  /* ---------- 游戏内 HUD（徽章进度 / 地点名 / 操作提示） ---------- */
  /* ---------- HUD：Q 键三态循环——完整面板 → 迷你条 → 完全隐藏 → 完整面板 ---------- */
  let hudMode = 'mini';                   // 'full' | 'mini' | 'hidden'
  function toggleHud() {
    hudMode = hudMode === 'full' ? 'mini' : hudMode === 'mini' ? 'hidden' : 'full';
    try { localStorage.setItem('campus_hud', hudMode); } catch (e) {}
    return hudMode;
  }
  function loadHudPref() {
    try {
      const v = localStorage.getItem('campus_hud');
      if (v === 'full' || v === 'mini' || v === 'hidden') hudMode = v;
      else if (localStorage.getItem('campus_hud_mini') === '0') hudMode = 'full';   // 旧偏好迁移
    } catch (e) {}
  }

  function renderHUD(g, flags, mapName, muted) {
    if (hudMode === 'hidden') return;     // 完全隐藏（Q 恢复）
    const gems = [
      ['数学', flags.badges.math, '#5a8aff'],
      ['语文', flags.badges.chinese, '#ff6a7a'],
      ['科学', flags.badges.science, '#4ae86c'],
      ['英语', flags.badges.english, '#ffd94c']
    ];

    if (hudMode === 'mini') {
      // —— 迷你条：徽章点 + 金币 + 宝藏图 + 日期天气，一行搞定 ——
      g.font = FONT(13);
      const cal = ADV.Cal ? ADV.Cal.label() : '';
      const goldT = '💰' + (flags.gold || 0);
      const mapT = '🗺' + (flags.mapPieces || 0) + '/3';
      const calT = cal.replace('｜未打卡', '') + (ADV.Cal && !ADV.Cal.checkedIn ? ' !' : '');
      const w0 = 14                                     // 左内边
        + 4 * 18 + 6                                    // 四枚迷你宝石
        + g.measureText(goldT).width + 14
        + g.measureText(mapT).width + 14
        + g.measureText(calT).width + 18                // 内容 + 右侧 Q 提示
        + 44;
      drawWindow(g, 16, 14, w0, 30);
      gems.forEach(([n, got, c], i) => {
        const gx = 30 + i * 18;
        g.globalAlpha = got ? 1 : .35;
        ADV.Sprites.drawGem(g, gx, 29, c, got, 6);
        g.globalAlpha = 1;
        text(g, n[0], gx, 30, 8, got ? '#101430' : '#c8cfec', 'center', 'normal');   // 首字冗余：不依赖颜色区分（P2-22）
      });
      let tx = 30 + 4 * 18 + 8;
      g.font = FONT(13);
      text(g, goldT, tx, 21, 13, '#ffd94c', undefined, 'normal'); tx += g.measureText(goldT).width + 12;
      text(g, mapT, tx, 21, 13, '#cfe0ff', undefined, 'normal'); tx += g.measureText(mapT).width + 12;
      const warn = ADV.Cal && !ADV.Cal.checkedIn;
      text(g, calT, tx, 21, 13, warn ? '#ffb0a0' : '#b8e8c0', undefined, 'normal');
      text(g, 'Q', 16 + w0 - 16, 21, 12, '#8a94c0', 'center', 'normal');
      return;
    }

    // —— 完整面板（Q 展开） ——
    drawWindow(g, 16, 14, 322, 106);
    text(g, '智慧徽章', 32, 24, 16, '#ffe9a8');
    gems.forEach(([n, got, c], i) => {
      const gx = 56 + i * 78;
      ADV.Sprites.drawGem(g, gx, 60, c, got, 9);
      text(g, n, gx, 66, 13, got ? '#fff' : '#8890b0', 'center', 'normal');
    });
    // 达人徽章行（体育/音乐/劳动/阅读，每日刷新）
    const tal = flags.talent || {};
    const tals = [
      ['体', tal.sports, '#ff8a5a'],
      ['音', tal.music, '#b98af5'],
      ['劳', tal.labor, '#7ad06a'],
      ['阅', tal.read, '#5ac8e8']
    ];
    text(g, '达人徽章', 32, 92, 13, '#cfe0ff', undefined, 'normal');
    tals.forEach(([n, got, c], i) => {
      const gx = 100 + i * 58;
      g.globalAlpha = got ? 1 : .35;
      g.fillStyle = got ? c : '#2c3252';
      if (g.roundRect) { g.beginPath(); g.roundRect(gx - 13, 86, 26, 22, 7); g.fill(); }
      else g.fillRect(gx - 13, 86, 26, 22);
      g.globalAlpha = 1;
      g.strokeStyle = got ? 'rgba(255,255,255,.7)' : 'rgba(120,130,180,.4)';
      g.lineWidth = 1.5;
      g.strokeRect(gx - 13, 86, 26, 22);
      text(g, n, gx, 91, 12, got ? '#fff' : '#666e96', 'center', 'normal');
    });

    // 金币与宝藏图（徽章面板下方）
    drawWindow(g, 16, 126, 322, 34);
    text(g, '💰 ' + (flags.gold || 0), 36, 135, 14, '#ffd94c');
    text(g, '宝藏图 ' + (flags.mapPieces || 0) + '/3', 150, 135, 14, '#cfe0ff', undefined, 'normal');

    // 日历 / 天气行（天气前缀像素图标）
    if (ADV.Cal) {
      g.font = FONT(13);
      const lab = ADV.Cal.label();
      const icon = (ADV.Sprites && ADV.Sprites.getIcon) ? ADV.Sprites.getIcon(ADV.Cal.weather) : null;
      const iw = icon ? 24 : 0;
      const w2 = g.measureText(lab).width + 28 + iw;
      drawWindow(g, 16, 164, w2, 30);
      if (icon) g.drawImage(icon, 26, 167, 22, 22);
      text(g, lab, 30 + iw, 172, 13, ADV.Cal.checkedIn ? '#b8e8c0' : '#ffb0a0', undefined, 'normal');
      // 今日课程行（课程表，休息日不显示）
      if (ADV.Cal.today) {
        const list = ADV.Cal.today();
        if (list.length) {
          const lab2 = '课表：' + list.join(' · ');
          g.font = FONT(12);
          const w3 = g.measureText(lab2).width + 24;
          drawWindow(g, 16, 198, w3, 24);
          text(g, lab2, 28, 204, 12, '#aab4d4', undefined, 'normal');
        }
      }
    }
    text(g, 'Q 收起', 16 + 322 - 8, 14, 12, '#8a94c0', 'right', 'normal');

    // 地点名（右上）
    g.font = FONT(16);
    const mw = g.measureText(mapName).width + 44;
    drawWindow(g, W - mw - 16, 14, mw, 36);
    text(g, mapName, W - 16 - mw / 2 - 22 + 22, 23, 16, '#cfe0ff', 'center');

    // 小地图（右上 · 地点名下方；静态层离屏缓存，NPC/玩家动态画）
    if (minimapOn && ADV.Engine && ADV.Engine.map && ADV.Engine.player && ADV.Maps) {
      const m = ADV.Engine.map;
      if (miniKey !== m.id) { buildMini(m); miniKey = m.id; }
      const mw = miniCv.width, mh = miniCv.height;
      const mx = W - mw - 20, my = 58;
      drawWindow(g, mx - 5, my - 5, mw + 10, mh + 10);
      g.drawImage(miniCv, mx, my);
      for (const n of m.npcs) {                       // NPC：青色圆点（门保持金色方点——形状+颜色双编码）
        g.fillStyle = '#6ee8ff';
        g.beginPath();
        g.arc(mx + n.x * miniSc + .5, my + n.y * miniSc + .5, 1.8, 0, Math.PI * 2);
        g.fill();
      }
      const pl = ADV.Engine.player;                   // 玩家：白色脉动点
      const pa = .55 + .45 * Math.sin(performance.now() / 180);
      g.fillStyle = `rgba(255,255,255,${pa.toFixed(2)})`;
      g.fillRect(mx + pl.x * miniSc - 1.5, my + pl.y * miniSc - 1.5, 4, 4);
    }

    // 操作提示（右下 · 触屏模式下虚拟按键自带语义，不再挤占画面）
    if (!touchUI) {
      g.save(); g.globalAlpha = .55;
      text(g, '方向键/WASD 移动 · Z/空格 确认 · C 招手 · G 送礼 · H 邀同学 · Tab 小地图 · Shift 加速' + (muted ? ' · 已静音(M)' : ''), W - 20, H - 30, 14, '#cdd6f0', 'right', 'normal');
      g.restore();
    }
  }

  /* ---------- 工具热键栏（星露谷式 10 格 · 屏幕底部居中） ---------- */
  let hotbarOn = true;
  function toggleHotbar() {
    hotbarOn = !hotbarOn;
    try { localStorage.setItem('campus_hotbar', hotbarOn ? '1' : '0'); } catch (e) {}
    return hotbarOn;
  }
  try { if (localStorage.getItem('campus_hotbar') === '0') hotbarOn = false; } catch (e) {}

  function renderHotbar(g) {
    if (!hotbarOn) return;
    const G = ADV.Game, EN = ADV.Engine;
    if (!G || !G.HOTBAR_SLOTS || !EN || !EN.map) return;
    if (active || itemAnim) return;                       // 对话/菜单/拾取动画时让位给界面
    const slots = G.HOTBAR_SLOTS;
    const cur = G.hotbarCur ? G.hotbarCur() : 0;
    const S = 38, GAP = 4, N = slots.length;
    const w = N * S + (N - 1) * GAP + 12;
    const x = Math.round((W - w) / 2), y = H - S - 16;
    drawWindow(g, x, y, w, S + 12);
    for (let i = 0; i < N; i++) {
      const sx = x + 6 + i * (S + GAP), sy = y + 6;
      const sel = i === cur;
      if (sel) { g.fillStyle = 'rgba(255,217,76,.20)'; g.fillRect(sx - 1, sy - 1, S + 2, S + 2); }
      g.strokeStyle = sel ? '#ffd94c' : 'rgba(120,130,180,.45)';
      g.lineWidth = sel ? 2 : 1;
      g.strokeRect(sx - .5, sy - .5, S - 1, S - 1);
      // 槽位号（手部画 ✋，其余 1-9 / 0 为切回手部的键）
      text(g, i === 0 ? '✋' : (i === 9 ? '0' : String(i)), sx + 4, sy + 3, 10, sel ? '#ffd94c' : '#8a94c0', 'left', 'normal');
      const id = slots[i];
      if (!id) continue;
      const own = ADV.Collect && ADV.Collect.count ? ADV.Collect.count(id) > 0 : false;
      g.globalAlpha = own ? 1 : .3;                       // 未持有的工具画淡
      if (ADV.Sprites && ADV.Sprites.drawToolIcon) ADV.Sprites.drawToolIcon(g, id, sx + S / 2, sy + S / 2 + 3, 24);
      g.globalAlpha = 1;
    }
  }

  return {
    TAB_META,
    say, choose, itemGet, toast, update, render, renderHUD, renderJournal, renderCollect, journalMove, setCtx, drawWindow, text,
    toggleMinimap, layout, setSafePad, getSafePad, setTouch, CTL, toggleHud, loadHudPref,
    renderHotbar, toggleHotbar,
    renderToasts, renderLog, toggleLog, tapAt, journalHit, journalPage, resetJournalScroll, pushHistory,
    get hotbarOn() { return hotbarOn; },
    get hudMode() { return hudMode; },            // 'full' | 'mini' | 'hidden'（主循环据此跳过渲染）
    get busy() { return !!(active || itemAnim); },
    get activeInfo() { return active ? { type: active.type, index: active.index, n: active.options ? active.options.length : undefined, ci: active.cancelIndex } : (itemAnim ? { type: 'anim' } : null); },   // 供 e2e 诊断：当前窗口类型/选项数/高亮/取消位
    get toastCount() { return toasts.length; },   // 供冒烟测试断言队列
    get minimapOn() { return minimapOn; },        // 供冒烟测试断言开关
    get safePad() { return safePad; },            // 供冒烟测试断言安全区
    get touchUI() { return touchUI; },
    get logOpen() { return logOpen; },            // 对话回看开合（主循环据此冻结移动）
    get historyCount() { return msgHistory.length; },
    get friendScroll() { return friendScroll; },
    get msgRect() { return { x: msgX(), y: H - 192, w: msgW(), h: 160 }; }   // 含姓名牌（供布局测试）
  };
})();
