/* =========================================================
 * main.js —— 主程序
 * 输入系统、标题画面、主角选择、游戏主循环、结局画面
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.Main = (function () {
  const W = 960, H = 640;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const FONT = (s, w) => `${w || 'bold'} ${s}px "Microsoft YaHei", "PingFang SC", sans-serif`;

  /* ==================== 输入系统 ==================== */
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'ok', Enter: 'ok', Space: 'ok',
    KeyX: 'cancel', Escape: 'cancel',
    KeyC: 'pose', KeyG: 'gift', KeyH: 'hangout',
    PageUp: 'pageup', PageDown: 'pagedown',
    ShiftLeft: 'dash', ShiftRight: 'dash'
  };
  const held = { up: false, down: false, left: false, right: false, ok: false, cancel: false, dash: false, pose: false };
  const pressed = {};
  const virtual = {};

  /* —— 神秘密码（彩蛋）：游玩中依次输入 J I N B I（「金币」拼音）→ 零花钱 +1000 —— */
  let cheatBuf = '';
  const CHEAT_WORD = 'JINBI';

  window.addEventListener('keydown', e => {
    const k = KEYMAP[e.code];
    if (k) {
      e.preventDefault();
      if (!held[k]) pressed[k] = true;
      held[k] = true;
    }
    // 彩蛋：字母键依次拼成 JINBI（不占用任何功能键，随时可输）
    if (/^Key[A-Z]$/.test(e.code)) {
      cheatBuf = (cheatBuf + e.code.slice(3)).slice(-CHEAT_WORD.length);
      if (state === 'play' && cheatBuf === CHEAT_WORD) {
        cheatBuf = '';
        if (ADV.Game && ADV.Game.flags) {
          ADV.Game.flags.gold = (ADV.Game.flags.gold || 0) + 1000;
          ADV.Audio.sfx('fanfare');
          ADV.UI.toast(' 🎁 神秘密码「JINBI」生效：零花钱 +1000！ ');
          ADV.Game.save();
        }
      }
    }
    if (e.code === 'KeyM') {                                                   // M：音量三档循环（全开→仅音效→静音）
      const m = ADV.Audio.cycleVolume();
      ADV.UI.toast(m === 0 ? ' 🔊 音量：全开 ' : m === 1 ? ' 🎵 仅音效（音乐静音） ' : ' 🔇 已静音 ');
    }
    if (e.code === 'KeyV') {                                                  // V：虚拟按键开关
      const hidden = document.body.classList.toggle('hidepad');
      try { localStorage.setItem('campus_pad_hidden', hidden ? '1' : '0'); } catch (err) {}
      ADV.UI.toast(hidden ? ' 🎮 虚拟按键：隐藏（画面更大） ' : ' 🎮 虚拟按键：显示 ');
      fit();
    }
    if (e.code === 'KeyQ') {                                                  // Q：HUD 折叠/展开
      const mini = ADV.UI.toggleHud();
      ADV.UI.toast(mini ? ' 📋 HUD：折叠为迷你条（Q 展开） ' : ' 📋 HUD：展开完整面板 ');
    }
    if (e.code === 'KeyF' && state === 'play') toggleJournal();             // F：生活手册
    if (e.code === 'KeyL' && state === 'play' && !journalOpen) ADV.UI.toggleLog();   // L：对话回看
    if (e.code === 'Tab' && state === 'play') {                             // Tab：小地图开关
      e.preventDefault();
      const on = ADV.UI.toggleMinimap();
      ADV.UI.toast(on ? ' 小地图：开 ' : ' 小地图：关 ');
    }
    if (state === 'play' && /^Digit[0-9]$/.test(e.code)) {                  // 数字键：工具热键栏
      e.preventDefault();
      const G = ADV.Game;
      if (G && G.HOTBAR_SLOTS && G.hotbarSelect) {
        const i = e.code === 'Digit0' ? 0 : +e.code.slice(5);
        const next = i === G.hotbarCur() ? 0 : i;                           // 再按同键 → 切回手部
        G.hotbarSelect(next);
        const id = G.HOTBAR_SLOTS[next];
        ADV.UI.toast(next === 0 ? ' ✋ 空手（按 Z 走菜单交互） '
          : ` 🛠 装备：${(ADV.Collect.itemInfo(id) || {}).name || id}（对面前的目标按 Z 直接种/浇/敲） `);
      }
    }
  });
  window.addEventListener('keyup', e => {
    const k = KEYMAP[e.code];
    if (k) { e.preventDefault(); held[k] = false; }
  });
  window.addEventListener('blur', () => { for (const k in held) held[k] = false; });

  // 触屏虚拟按键
  document.querySelectorAll('#touch-ui .tk').forEach(btn => {
    const k = btn.dataset.k;
    const down = e => { e.preventDefault(); if (!held[k]) pressed[k] = true; held[k] = true; ADV.Audio.init(); ADV.Audio.resume(); };
    const up = e => { e.preventDefault(); held[k] = false; };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
  });

  // 触屏工具条（手册 / 小地图 / 音量三档 / 全屏）
  document.querySelectorAll('#toolbar .tb').forEach(btn => {
    btn.addEventListener('pointerdown', e => {
      e.preventDefault(); ADV.Audio.init(); ADV.Audio.resume();
      const t = btn.dataset.t;
      if (t === 'journal') { if (state === 'play') toggleJournal(); }
      else if (t === 'map') { ADV.UI.toast(ADV.UI.toggleMinimap() ? ' 小地图：开 ' : ' 小地图：关 '); }
      else if (t === 'hotbar') { ADV.UI.toast(ADV.UI.toggleHotbar() ? ' 🛠 工具栏：开（点数字槽切换工具） ' : ' 🛠 工具栏：关 '); }
      else if (t === 'vol') {
        const m = ADV.Audio.cycleVolume();
        ADV.UI.toast(m === 0 ? ' 🔊 音量：全开 ' : m === 1 ? ' 🎵 仅音效（音乐静音） ' : ' 🔇 已静音 ');
      }
      else if (t === 'fs') toggleFullscreen();
    });
  });

  /* 全屏切换（含 webkit 前缀兜底；失败时给出提示而非静默） */
  function toggleFullscreen() {
    try {
      const root = document.documentElement;
      const isFs = document.fullscreenElement || document.webkitFullscreenElement;
      if (!isFs) {
        const fn = root.requestFullscreen || root.webkitRequestFullscreen;
        if (!fn) { ADV.UI.toast(' ⛶ 当前环境不支持全屏 '); return; }
        const p = fn.call(root);
        if (p && p.catch) p.catch(() => ADV.UI.toast(' ⛶ 无法进入全屏（浏览器拒绝了请求） '));
      } else {
        const fn = document.exitFullscreen || document.webkitExitFullscreen;
        if (fn) { const p = fn.call(document); if (p && p.catch) p.catch(() => {}); }
      }
    } catch (e) { ADV.UI.toast(' ⛶ 当前环境不支持全屏 '); }
    setTimeout(fit, 350);                       // 全屏后画面尺寸变化，重算自适应
  }

  function consume() { for (const k in pressed) pressed[k] = false; }

  /* ==================== 状态 ==================== */
  let state = 'title';          // title | heroSelect | play | help | ending
  let titleIdx = 0;
  let heroIdx = 0;
  let helpFrom = 'title';
  let ending = { t: 0 };
  let titleT = 0;
  let journalOpen = false;      // F：生活手册
  let journalTab = 0;           // 0 好友 / 1 任务 / 2 日历 / 3 收藏 ...
  function defaultJournalTab() {
    try {
      const stage = ADV.Game && ADV.Game.guideStage ? ADV.Game.guideStage() : 'full';
      return stage === 'full' ? journalTab : 1;       // 新生阶段先落到「任务」
    } catch (e) { return journalTab; }
  }
  function toggleJournal() {
    const opening = !journalOpen;
    if (opening && ADV.UI.busy) return;        // 对话/选项/拾取动画中不开手册，避免输入串扰
    journalOpen = opening;
    if (opening) { journalTab = defaultJournalTab(); ADV.UI.resetJournalScroll(); }
    else ADV.UI.toggleLog(false);              // 关手册时顺带收起回看浮层
  }
  const clouds = Array.from({ length: 5 }, (_, i) => ({ x: Math.random() * W, y: 40 + i * 55, s: .4 + Math.random() * .8 }));
  const stars = Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + .4, ph: Math.random() * 6.28 }));

  /* ==================== 画面：绘制辅助 ==================== */
  function text(s, x, y, size, color, align, weight) {
    ctx.font = FONT(size, weight);
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(10,10,25,.55)'; ctx.fillText(s, x + 2, y + 2);
    ctx.fillStyle = color || '#fff'; ctx.fillText(s, x, y);
  }
  function bigTitle(s, x, y, size, color) {
    ctx.font = FONT(size);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.lineWidth = Math.max(4, size / 9); ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(30,20,60,.85)'; ctx.strokeText(s, x, y);
    const grad = ctx.createLinearGradient(0, y, 0, y + size);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(.55, color); grad.addColorStop(1, '#b45a2a');
    ctx.fillStyle = grad; ctx.fillText(s, x, y);
  }

  /* ==================== 标题画面 ==================== */
  function drawSchoolSilhouette(yBase) {
    // 背景建筑剪影
    ctx.fillStyle = '#7a94c4';
    ctx.fillRect(60, yBase - 120, 180, 120);
    ctx.fillRect(280, yBase - 170, 400, 170);
    ctx.fillRect(720, yBase - 110, 180, 110);
    ctx.fillStyle = '#5f78a8';
    ctx.beginPath(); ctx.moveTo(260, yBase - 120); ctx.lineTo(380, yBase - 190); ctx.lineTo(500, yBase - 120); ctx.fill();
    ctx.beginPath(); ctx.moveTo(460, yBase - 170); ctx.lineTo(580, yBase - 240); ctx.lineTo(700, yBase - 170); ctx.fill();
    // 屋顶
    ctx.fillStyle = '#8a4a3a';
    ctx.fillRect(280, yBase - 185, 400, 18);
    ctx.beginPath(); ctx.moveTo(270, yBase - 178); ctx.lineTo(580, yBase - 252); ctx.lineTo(890, yBase - 178); ctx.fill();
    // 旗帜
    ctx.fillStyle = '#d8d8e8'; ctx.fillRect(577, yBase - 305, 5, 55);
    ctx.fillStyle = '#e85a5a';
    ctx.beginPath(); ctx.moveTo(582, yBase - 303); ctx.lineTo(632, yBase - 290); ctx.lineTo(582, yBase - 277); ctx.fill();
    // 窗户
    ctx.fillStyle = '#ffe9a8';
    for (let i = 0; i < 6; i++) { ctx.fillRect(305 + i * 62, yBase - 150, 30, 34); ctx.fillRect(318 + i * 62, yBase - 100, 22, 26); }
    // 草地
    ctx.fillStyle = '#4d9a41'; ctx.fillRect(0, yBase, W, H - yBase);
    ctx.fillStyle = '#58ab4a'; ctx.fillRect(0, yBase, W, 8);
  }

  function updateTitle(dt) {
    titleT += dt;
    clouds.forEach(c => { c.x += c.s * 24 * dt; if (c.x > W + 90) c.x = -90; });
    const items = titleItems();
    if (pressed.up) { titleIdx = (titleIdx + items.length - 1) % items.length; ADV.Audio.sfx('cursor'); }
    if (pressed.down) { titleIdx = (titleIdx + 1) % items.length; ADV.Audio.sfx('cursor'); }
    if (pressed.ok) {
      ADV.Audio.init(); ADV.Audio.resume(); ADV.Audio.sfx('start');
      const it = items[titleIdx];
      if (it === '开始新冒险') {
        if (ADV.Game.hasSave()) { state = 'confirmNew'; titleIdx = 0; }
        else { state = 'heroSelect'; }
      } else if (it === '继续冒险') {
        if (ADV.Game.continueGame()) { ADV.UI.toast(' 已读取存档 '); state = 'play'; }
      } else if (it === '新的学期（NG+）') {
        state = 'ngRelic'; titleIdx = 0;                     // 先选成长信物，再开学
      } else if (it === '操作说明') { helpFrom = 'title'; state = 'help'; }
      else if (it === '导出存档') { exportSaveUI(); }
      else if (it === '导入存档') { importSaveUI(); }
    }
  }

  function titleItems() {
    const arr = ['开始新冒险'];
    if (ADV.Game.hasSave()) arr.push('继续冒险');
    if (ADV.Game.flags && ADV.Game.flags.graduated) arr.push('新的学期（NG+）');
    arr.push('操作说明', '导入存档');
    if (ADV.Game.hasSave()) arr.push('导出存档');
    return arr;
  }

  /* —— 存档导出 / 导入（换设备、备份用；配合浏览器存储失败时的自救） —— */
  function exportSaveUI() {
    try {
      const code = ADV.Game.exportSave();
      const copied = () => ADV.UI.toast(' 📤 存档代码已复制到剪贴板，妥善保存它 ');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(copied, () => {
          window.prompt('自动复制失败，请手动复制存档代码（Ctrl+C）：', code);
          ADV.UI.toast(' 📤 已弹出存档代码，请手动复制 ');
        });
      } else {
        window.prompt('请手动复制存档代码（Ctrl+C）：', code);
        ADV.UI.toast(' 📤 已弹出存档代码，请手动复制 ');
      }
    } catch (e) { ADV.UI.toast(' ⚠ 导出失败：' + (e && e.message ? e.message : e)); }
  }
  function importSaveUI() {
    const code = window.prompt('粘贴存档代码：');
    if (!code) return;
    if (ADV.Game.importSave(code) && ADV.Game.continueGame()) { ADV.Audio.sfx('start'); ADV.UI.toast(' 📥 存档导入成功，欢迎回来！ '); state = 'play'; }
    else ADV.UI.toast(' ⚠ 存档代码无效或已损坏，导入失败 ');
  }

  function drawTitleBg() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#5aa8e8'); grad.addColorStop(.6, '#a8d8f5'); grad.addColorStop(1, '#d8f0ff');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    // 太阳
    ctx.fillStyle = '#fff4c8';
    ctx.beginPath(); ctx.arc(830, 90, 42, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = .3;
    ctx.beginPath(); ctx.arc(830, 90, 58, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // 云
    clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      [[0, 0, 34], [30, 6, 26], [-30, 8, 24], [8, -12, 22]].forEach(([dx, dy, r]) => {
        ctx.beginPath(); ctx.arc(c.x + dx, c.y + dy, r, 0, Math.PI * 2); ctx.fill();
      });
    });
    drawSchoolSilhouette(430);
  }

  function renderTitle() {
    drawTitleBg();
    bigTitle('校园大冒险', W / 2, 68, 88, '#ffb43a');
    text('—— 模仿 RPG Maker MZ 风格的 2D 学习冒险 ——', W / 2, 185, 20, '#ffffff', 'center');
    text('CAMPUS ADVENTURE', W / 2, 214, 15, 'rgba(255,255,255,.85)', 'center', 'normal');

    // 主角小人站在草地上
    const bobY = Math.sin(titleT * 2.4) * 3;
    const boySheet = ADV.Sprites.makeCharSheet(ADV.Sprites.PALETTES.hero_boy);
    const girlSheet = ADV.Sprites.makeCharSheet(ADV.Sprites.PALETTES.hero_girl);
    const frame = Math.floor(titleT * 3) % 3;
    ctx.drawImage(boySheet, frame * 32, 0, 32, 44, W / 2 - 100, 396 + bobY, 64, 88);
    ctx.drawImage(girlSheet, frame * 32, 0, 32, 44, W / 2 + 36, 396 - bobY, 64, 88);

    // 菜单（触屏模式在窗内附一行操作提示；底边固定留 24px，防止 3 项时溢出画面）
    const items = titleItems();
    const touch = ADV.UI.touchUI;
    const mw = 300, mh = items.length * 52 + 30 + (touch ? 24 : 0);
    const mx = (W - mw) / 2, my = H - 24 - mh;
    ADV.UI.drawWindow(ctx, mx, my, mw, mh);
    items.forEach((it, i) => {
      const y = my + 20 + i * 52;
      if (i === titleIdx) {
        ctx.fillStyle = 'rgba(120,150,255,.3)';
        ctx.fillRect(mx + 12, y - 6, mw - 24, 44);
        text('▶', mx + 26, y, 22, '#ffe9a8');
      }
      text(it, mx + mw / 2 + 8, y, 24, i === titleIdx ? '#ffe9a8' : '#fff', 'center');
    });
    if (touch) text('▲▼ 选择 · ● 确定', mx + mw / 2, my + items.length * 52 + 16, 15, '#aab4d4', 'center', 'normal');
    text('© 2026 阳光中学 · 纯 Canvas 手作游戏', W / 2, H - 34, 14, 'rgba(255,255,255,.7)', 'center', 'normal');
    if (ADV.Audio.muted) text('🔇 已静音（M）', 20, H - 34, 14, 'rgba(255,255,255,.7)', undefined, 'normal');
    if (ADV.Game.storageOk && !ADV.Game.storageOk())                       // 隐私模式等场景提前告知
      text('⚠ 浏览器存储不可用：进度无法自动保存，建议用「导出存档」备份', W / 2, H - 58, 15, '#ffb0a0', 'center', 'normal');
  }

  /* ==================== 覆盖确认（新游戏覆盖存档） ==================== */
  function updateConfirmNew() {
    if (pressed.left || pressed.right) { titleIdx = 1 - titleIdx; ADV.Audio.sfx('cursor'); }
    if (pressed.ok) {
      if (titleIdx === 0) { state = 'heroSelect'; ADV.Audio.sfx('ok'); }
      else { state = 'title'; titleIdx = 0; ADV.Audio.sfx('cancel'); }
    }
    if (pressed.cancel) { state = 'title'; titleIdx = 0; ADV.Audio.sfx('cancel'); }
  }
  function renderConfirmNew() {
    renderTitle();
    ctx.fillStyle = 'rgba(8,8,20,.55)'; ctx.fillRect(0, 0, W, H);
    const w = 480, h = 190, x = (W - w) / 2, y = H / 2 - 95;
    ADV.UI.drawWindow(ctx, x, y, w, h);
    text('已有存档，要重新开始吗？', W / 2, y + 26, 22, '#fff', 'center');
    text('（原存档将被覆盖）', W / 2, y + 58, 16, '#aab4d4', 'center', 'normal');
    ['重新开始', '返回'].forEach((s, i) => {
      const ox = W / 2 - 180 + i * 220;
      if (i === titleIdx) text('▶', ox - 40, y + 110, 22, '#ffe9a8');
      text(s, ox, y + 110, 22, i === titleIdx ? '#ffe9a8' : '#fff');
    });
  }

  /* ==================== NG+ 信物三选一 ==================== */
  const RELICS = [
    ['notebook', '先辈笔记本', '📖', '学识 +10 起步（知识树/答题成长更快）'],
    ['bandage', '旧绷带', '🩹', '体魄 +10 起步（战斗底子更硬）'],
    ['photo', '毕业照', '🖼', '人缘 +10 起步（开场好感更热）']
  ];
  function updateNgRelic() {
    if (pressed.left || pressed.right) { titleIdx = (titleIdx + 2) % 3; ADV.Audio.sfx('cursor'); }
    if (pressed.ok) {
      const r = RELICS[titleIdx][0];
      ADV.Game.state = ADV.Game.state || {};
      ADV.Game.ngRelic = r;
      ADV.Game.ngStart();
      ADV.UI.toast(` 🔄 新学期：携带「${RELICS[titleIdx][1]}」${RELICS[titleIdx][3]}`);
      state = 'play';
    }
    if (pressed.cancel) { state = 'title'; titleIdx = 0; }
  }
  function renderNgRelic() {
    renderTitle();
    ctx.fillStyle = 'rgba(8,8,20,.6)'; ctx.fillRect(0, 0, W, H);
    text('选择新学期的信物', W / 2, 120, 34, '#ffe9a8', 'center');
    RELICS.forEach(([id, name, icon, desc], i) => {
      const cx = W / 2 - 300 + i * 300, cy = 260;
      const sel = i === titleIdx;
      ADV.UI.drawWindow(ctx, cx - 130, cy - 90, 260, 230);
      if (sel) { ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 4; ctx.strokeRect(cx - 138, cy - 98, 276, 246); }
      ctx.font = FONT(52); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(icon, cx, cy - 70);
      text(name, cx, cy + 8, 24, sel ? '#ffe9a8' : '#fff', 'center');
      text(desc.slice(0, 12), cx, cy + 50, 13, '#cfe0ff', 'center', 'normal');
      text(desc.slice(12), cx, cy + 70, 13, '#cfe0ff', 'center', 'normal');
    });
    text('Z 确定 · X 返回', W / 2, 560, 16, '#aab4d4', 'center', 'normal');
  }

  /* ==================== 主角选择 ==================== */
  function updateHeroSelect() {
    if (pressed.left || pressed.right) { heroIdx = 1 - heroIdx; ADV.Audio.sfx('cursor'); }
    if (pressed.ok) {
      ADV.Audio.sfx('start');
      ADV.Game.newGame(heroIdx === 0 ? 'hero_boy' : 'hero_girl', true);   // true = 播放序章
      ADV.UI.toast(' 🌤 新生活开始了，先去学校报到吧 ');
      state = 'play';
    }
    if (pressed.cancel) { state = 'title'; ADV.Audio.sfx('cancel'); }
  }
  function renderHeroSelect() {
    drawTitleBg();
    text('选择你的主角', W / 2, 60, 40, '#fff', 'center');
    const names = ['小智', '小樱'];
    const pals = ['hero_boy', 'hero_girl'];
    pals.forEach((p, i) => {
      const cx = W / 2 + (i === 0 ? -190 : 190), cy = 300;
      const sel = i === heroIdx;
      ADV.UI.drawWindow(ctx, cx - 130, cy - 130, 260, 300);
      if (sel) {
        ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 4;
        ctx.strokeRect(cx - 138, cy - 138, 276, 316);
      }
      const sheet = ADV.Sprites.makeCharSheet(ADV.Sprites.PALETTES[p]);
      const frame = Math.floor(titleT * 3) % 3;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sheet, frame * 32, 0, 32, 44, cx - 56, cy - 90, 112, 154);
      ctx.restore();
      text(names[i], cx, cy + 90, 28, sel ? '#ffe9a8' : '#fff', 'center');
      if (sel) text('◀ 选择 ▶', cx, cy + 132, 18, '#cfe0ff', 'center', 'normal');
    });
    text(ADV.UI.touchUI ? '◀▶ 选择 · ● 确定 · ✕ 返回' : 'Z / 空格 确定 · X 返回', W / 2, H - 60, 16, 'rgba(255,255,255,.85)', 'center', 'normal');
  }

  /* ==================== 操作说明 ==================== */
  function updateHelp() {
    if (pressed.ok || pressed.cancel) { ADV.Audio.sfx('cancel'); state = helpFrom; }
  }
  function renderHelp() {
    drawTitleBg();
    ctx.fillStyle = 'rgba(8,10,30,.6)'; ctx.fillRect(0, 0, W, H);
    const w = 620, h = 520, x = (W - w) / 2, y = 70;
    ADV.UI.drawWindow(ctx, x, y, w, h);
    text('操 作 说 明', W / 2, y + 26, 30, '#ffe9a8', 'center');
    const rows = [
      ['方向键 / WASD', '四处走动（Shift 加速）'],
      ['Z / 回车 / 空格', '对话 · 调查 · 确认'],
      ['X / Esc', '取消 · 关闭'],
      ['C', '挥手打招呼（NPC 会回应你）'],
      ['G', '面向 NPC 送礼（投其所好！）'],
      ['H', '放学后邀同学同行（地图 ♥ 处有双人事件）'],
      ['M', '静音开关'],
      ['F', '手册（↑ ↓ 切组 · ← → 切页：关系/生活/收藏/学习/成长）'],
      ['', ''],
      ['【生活】', ''],
      ['· 每天到校园"打卡处"答题', '难度渐涨，错题重做后算打卡'],
      ['· 周五有周测，月中有月考', '夜晚在家复习会更简单'],
      ['· 礼品店买礼物、G 键送礼', '记住每个人的偏好！'],
      ['· 家里饭桌旁帮忙做家务', '每天一次，赚零花钱'],
      ['· 挖宝要铲子+乌云的残页', '全校埋着 8 处宝藏'],
      ['', ''],
      ['【玩法】', ''],
      ['· 与老师对话，接受学科试炼', '答对题目获得智慧徽章'],
      ['· 集齐 数学/语文/科学/英语 四枚徽章', '打开后山的古老石门'],
      ['· 穿过后山秘境的最终试炼', '点亮祭坛，见证结局！'],
      ['· 体育馆与音乐教室藏着小游戏', '赢取宝藏图碎片'],
      ['· 集齐三张宝藏图', '打开东郊的藏宝洞窟！'],
      ['· 和同学们聊聊天', '他们个个能说会道哦']
    ];
    rows.forEach((r, i) => {
      if (r[0]) {
        text(r[0], x + 50, y + 80 + i * 34, 18, '#8ab4ff');
        text(r[1], x + 250, y + 80 + i * 34, 18, '#fff', undefined, 'normal');
      }
    });
    text(ADV.UI.touchUI ? '按 ● / ✕ 返回' : '按 Z / X 返回', W / 2, y + h - 46, 17, '#aab4d4', 'center', 'normal');
  }

  /* ==================== 结局画面 ==================== */
  function startEnding() {
    ADV.Game.busy = true;
    state = 'ending';
    ending = { t: 0 };
    ADV.Audio.playBgm('mystery');
  }
  function updateEnding(dt) {
    ending.t += dt;
    if (ending.t > 2 && pressed.ok) {
      ADV.Audio.sfx('ok');
      state = 'play';
      ADV.Game.busy = false;
      ADV.Game.save();
    }
  }
  function renderEnding() {
    const t = ending.t;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0a2a'); grad.addColorStop(1, '#1c1a40');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    stars.forEach(s => {
      const a = .3 + .6 * Math.abs(Math.sin(s.ph + t * 1.4));
      ctx.fillStyle = `rgba(255,250,220,${a.toFixed(2)})`;
      ctx.fillRect(s.x, s.y, s.r * 2, s.r * 2);
    });
    const pages = [
      [1.0, '恭喜你，通过了全部试炼！'],
      [2.2, '四枚智慧徽章与智慧之心在星光中汇聚……'],
      [3.4, '沉睡的祭坛苏醒了，'],
      [4.6, '而后山的深处，一条星光小路悄然浮现——'],
      [6.0, '新的地图「星之庭园」，正在等待着你。']
    ];
    pages.forEach(([st, s], idx) => {
      if (t > st) {
        const a = Math.min(1, (t - st) / .6);
        ctx.globalAlpha = a;
        text(s, W / 2, 130 + idx * 50, 26, '#ffe9a8', 'center');
        ctx.globalAlpha = 1;
      }
    });
    if (t > 7.4) {
      bigTitle('校园大冒险 · 未完待续', W / 2, 440, 44, '#ffb43a');
      if (Math.floor(t * 2) % 2 === 0)
        text(ADV.UI.touchUI ? '按 ● 继续探索校园' : '按 Z / 空格 继续探索校园', W / 2, 540, 20, '#cfe0ff', 'center', 'normal');
    }
  }

  /* ==================== 游戏主循环 ==================== */
  ADV.UI.setCtx(ctx);
  if (ADV.UI.loadHudPref) ADV.UI.loadHudPref();      // 读取 HUD 折叠偏好

  let last = performance.now();
  let ambClock = 0;                                  // 环境音评估节流（0.5 秒一次）
  let splashEl = document.getElementById('splash');  // 启动画面（脚本 defer 加载完首帧后移除）
  function loop(now) {
    try {
      const dt = Math.min(.05, (now - last) / 1000);
      last = now;
      if (splashEl) {                                  // 首帧渲染成功 → 撤掉“加载中”启动画面
        try { if (splashEl.remove) splashEl.remove(); else splashEl.style.display = 'none'; } catch (e0) {}
        splashEl = null;
      }

      // 只在正式游玩时显示虚拟按键（标题/结局画面不需要，避免遮挡画面）；
      // 按键显隐会改变实测位置，因此切换时重新计算安全区
      if (document.body && document.body.classList) {
        const playing = state === 'play';
        if (document.body.classList.contains('playing') !== playing) {
          document.body.classList.toggle('playing', playing);
          fit();
        }
        // 战斗/小游戏/阅读器接管画面时收起顶部工具条（避免压住战斗血条与标题）
        const modal = playing && ((ADV.Battle && ADV.Battle.active) || (ADV.Mini && ADV.Mini.active) ||
                                  (ADV.Books && ADV.Books.active));
        if (document.body.classList.contains('modal') !== !!modal)
          document.body.classList.toggle('modal', !!modal);
      }

      switch (state) {
        case 'title': updateTitle(dt); renderTitle(); ADV.UI.renderToasts(ctx); break;
        case 'confirmNew': updateConfirmNew(); renderConfirmNew(); break;
        case 'ngRelic': updateNgRelic(); renderNgRelic(); break;
        case 'heroSelect': titleT += dt; updateHeroSelect(); renderHeroSelect(); break;
        case 'help': updateHelp(); renderHelp(); break;
        case 'ending': updateEnding(dt); renderEnding(); break;
        case 'play':
          if (ADV.Books && ADV.Books.active) {            // 阅读器接管画面与输入
            ADV.Books.update(dt, pressed);
            ADV.Books.render(ctx);
            break;
          }
          if (ADV.Battle && ADV.Battle.active) {            // 战斗接管画面与输入
            ADV.Battle.update(dt, pressed);
            ADV.Battle.render(ctx);
            break;
          }
          if (ADV.Mini && ADV.Mini.active) {              // 小游戏接管画面与输入
            ADV.Mini.update(dt, pressed, held);           // held：搏鱼等"按住"类小游戏需要
            ADV.Mini.render(ctx);
            break;
          }
          if (journalOpen) {                              // 手册：暂停世界；← → 切组内页，↑ ↓ 切组
            if (pressed.left) { journalTab = ADV.UI.journalMove(journalTab, 'left'); ADV.Audio.sfx('cursor'); }
            if (pressed.right) { journalTab = ADV.UI.journalMove(journalTab, 'right'); ADV.Audio.sfx('cursor'); }
            if (pressed.up) { journalTab = ADV.UI.journalMove(journalTab, 'up'); ADV.Audio.sfx('cursor'); }
            if (pressed.down) { journalTab = ADV.UI.journalMove(journalTab, 'down'); ADV.Audio.sfx('cursor'); }
            if (pressed.pageup) ADV.UI.journalPage(-1);   // 好友页翻页
            if (pressed.pagedown) ADV.UI.journalPage(1);
            if (pressed.cancel) { journalOpen = false; ADV.Audio.sfx('cancel'); }
            ADV.Engine.update(dt, { held: {} });
            ADV.UI.update(dt, pressed);                   // 手册期间 toast 仍正常消退
            ADV.Engine.render(ctx);
            ADV.UI.render(ctx);
            ADV.UI.renderHUD(ctx, ADV.Game.flags, ADV.Engine.map ? ADV.Engine.map.name : '', ADV.Audio.muted);
            ADV.UI.renderJournal(ctx, ADV.Game.friends, ADV.Game.BOND, journalTab);
            ADV.UI.renderToasts(ctx);
            break;
          }
          if (!ADV.Game.busy && !ADV.UI.busy && !ADV.UI.logOpen) {
            // 先清 pressed 再派发：否则同一个 ok 会渗透到本帧稍后的 UI.update，
            // 刚弹出的对话/菜单被立即选中第 0 项（Z 打开选项却"收不起来"的元凶）
            if (pressed.ok) { pressed.ok = false; ADV.Engine.interact(); }
            if (pressed.pose) { pressed.pose = false; ADV.Engine.playerAction(); }     // C 键：挥手打招呼
            if (pressed.gift) { pressed.gift = false; ADV.Engine.giftAction(); }       // G 键：送礼
            if (pressed.hangout) { pressed.hangout = false; ADV.Engine.hangoutAction(); } // H 键：邀同学同行
          }
          ADV.Engine.update(dt, ADV.UI.logOpen ? { held: {} } : { held });   // 回看时冻结移动
          ADV.UI.update(dt, pressed, held);               // held.ok → 对话打字机快进
          ADV.Engine.render(ctx);
          ADV.UI.render(ctx);
          ADV.UI.renderHUD(ctx, ADV.Game.flags, ADV.Engine.map ? ADV.Engine.map.name : '', ADV.Audio.muted);
          ADV.UI.renderHotbar(ctx);                       // 工具热键栏（底部居中，对话时自动让位）
          ADV.UI.renderToasts(ctx);                       // toast 画在最上层，不再被窗口盖住
          ADV.UI.renderLog(ctx);                          // 对话回看浮层（最顶层）
          ambClock += dt;                                  // 环境音：0.5 秒评估一次场景组合
          if (ambClock > .5) {
            ambClock = 0;
            ADV.Audio.updateAmbience({
              weather: ADV.Cal.weather,
              season: ADV.Cal.seasonEn(),
              night: ADV.Cal.isNight(),
              mapId: ADV.Engine.map ? ADV.Engine.map.id : '',
              py: ADV.Engine.player && ADV.Engine.player.y >= 20 ? 1 : 0   // 操场在校园图南部
            });
          }
          break;
      }
    } catch (err) {
      showFatal(err);          // 单帧异常不再杀死整个 rAF 循环（白屏假死）
    } finally {
      consume();
      requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);

  /* 画布自适应（含触屏安全区）
   * 虚拟按键显示时（游玩中且未按 V 隐藏），按触屏布局为按键留边 */
  const mqTouch = window.matchMedia ? window.matchMedia('(hover: none) and (pointer: coarse)') : null;
  const isTouch = () => !!(mqTouch && mqTouch.matches);
  /* 触屏设备全程显示虚拟按键（body.touch）：标题/选人/说明/结局画面没有键盘，
   * 菜单也必须靠方向盘和 ●/✕ 操作，否则手机上无法开始游戏 */
  document.body.classList.toggle('touch', isTouch());
  if (mqTouch && mqTouch.addEventListener) mqTouch.addEventListener('change', e => {
    document.body.classList.toggle('touch', e.matches);
    fit();
  });
  const padVisible = () => state === 'play' && !document.body.classList.contains('hidepad');
  /* 实测虚拟按键在屏幕上的位置（自动兼容刘海/圆角安全区）；未显示时返回 null 走估算 */
  function measureControls() {
    try {
      const dp = document.getElementById('dpad'), ab = document.getElementById('abtns');
      if (!dp || !ab || !dp.getBoundingClientRect) return null;
      const d = dp.getBoundingClientRect(), a = ab.getBoundingClientRect();
      if (!d.width || !a.width) return null;
      return { ctlTop: Math.min(d.top, a.top), ctlLeft: d.right, ctlRight: a.left };
    } catch (e) { return null; }
  }
  function fit() {
    const touchy = isTouch() || padVisible();
    const L = ADV.UI.layout(innerWidth, innerHeight, touchy, touchy ? measureControls() : null);
    canvas.style.width = L.cw + 'px';
    canvas.style.height = L.ch + 'px';
    ADV.UI.setTouch(touchy);
    ADV.UI.setSafePad(L.pad);                                   // 对话框/选项窗避开虚拟按键
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 150));
  try { if (localStorage.getItem('campus_pad_hidden') === '1') document.body.classList.add('hidepad'); } catch (e) {}
  fit();

  /* ==================== 触屏/鼠标点按（换算成画布逻辑坐标后分发） ==================== */
  function canvasPoint(ev) {
    const r = canvas.getBoundingClientRect();
    const sx = W / (r.width || W), sy = H / (r.height || H);
    return {
      x: Math.round(((ev.clientX || 0) - (r.left || 0)) * sx),
      y: Math.round(((ev.clientY || 0) - (r.top || 0)) * sy)
    };
  }
  function hitRect(px, py, x, y, w, h) { return px >= x && px <= x + w && py >= y && py <= y + h; }
  /* 点菜单行：首击选中，同格再击确认（触屏上代替 Z） */
  function tapMenuRow(px, py, items, rowH, geom) {
    for (let i = 0; i < items.length; i++) {
      const y = geom.my + geom.padTop + i * rowH;
      if (hitRect(px, py, geom.mx + 12, y - 6, geom.mw - 24, rowH - 8)) {
        if (titleIdx === i) { pressed.ok = true; }
        else { titleIdx = i; ADV.Audio.sfx('cursor'); }
        return true;
      }
    }
    return false;
  }
  canvas.addEventListener('pointerdown', ev => {
    ADV.Audio.init(); ADV.Audio.resume();          // 触屏首点：解锁音频上下文
    const p = canvasPoint(ev);
    if (state === 'title') {                        // 标题菜单（几何与 renderTitle 一致）
      const items = titleItems();
      const touch = ADV.UI.touchUI;
      const mw = 300, mh = items.length * 52 + 30 + (touch ? 24 : 0);
      if (tapMenuRow(p.x, p.y, items, 52, { mx: (W - mw) / 2, mw, padTop: 20, my: H - 24 - mh })) return;
      return;
    }
    if (state === 'confirmNew') {                   // 覆盖确认双按钮
      const w = 480, x = (W - w) / 2, y = H / 2 - 95;
      for (let i = 0; i < 2; i++) {
        const ox = W / 2 - 180 + i * 220;
        if (hitRect(p.x, p.y, ox - 90, y + 96, 180, 40)) { titleIdx = i; pressed.ok = true; return; }
      }
      pressed.cancel = true; return;
    }
    if (state === 'ngRelic') {                      // NG+ 信物三选一
      for (let i = 0; i < 3; i++) {
        const cx = W / 2 - 300 + i * 300, cy = 260;
        if (hitRect(p.x, p.y, cx - 130, cy - 90, 260, 230)) {
          if (titleIdx === i) pressed.ok = true;
          else { titleIdx = i; ADV.Audio.sfx('cursor'); }
          return;
        }
      }
      return;
    }
    if (state === 'heroSelect') {                   // 主角选择双卡
      for (let i = 0; i < 2; i++) {
        const cx = W / 2 + (i === 0 ? -190 : 190), cy = 300;
        if (hitRect(p.x, p.y, cx - 130, cy - 130, 260, 300)) {
          if (heroIdx === i) pressed.ok = true;
          else { heroIdx = i; ADV.Audio.sfx('cursor'); }
          return;
        }
      }
      return;
    }
    if (state === 'help') { pressed.cancel = true; return; }        // 点任意处返回
    if (state === 'ending') { if (ending.t > 2) pressed.ok = true; return; }
    if (state === 'play') {
      if (journalOpen) {                            // 手册：组片/子页/滚动箭头/窗外关闭
        const hit = ADV.UI.journalHit(journalTab, p.x, p.y);
        if (!hit) return;
        if (hit.t === 'close') { journalOpen = false; ADV.Audio.sfx('cancel'); }
        else if (hit.t === 'group') { journalTab = hit.tab; ADV.Audio.sfx('cursor'); }
        else if (hit.t === 'tab') { journalTab = hit.ti; ADV.Audio.sfx('cursor'); }
        else if (hit.t === 'fup') ADV.UI.journalPage(-1);
        else if (hit.t === 'fdown') ADV.UI.journalPage(1);
        return;
      }
      ADV.UI.tapAt(p.x, p.y);                       // 对话推进/选项/回看/拾取动画
    }
  });

  /* ==================== 错误提示（errbox 单例复用，不刷屏） ==================== */
  let errBoxEl = null;
  function showFatal(msg) {
    try { console.error('[CampusAdv]', msg); } catch (e0) {}
    try {
      if (!errBoxEl) {
        errBoxEl = document.createElement('div');
        errBoxEl.id = 'errbox';
        document.body.appendChild(errBoxEl);
      }
      errBoxEl.textContent = '运行错误: ' + (msg && msg.message ? msg.message : msg);
    } catch (e1) {}
  }
  window.addEventListener('error', e => {
    showFatal((e.message || '未知错误') + ' @ ' + (e.lineno || '?'));
  });
  window.addEventListener('unhandledrejection', e => {          // 异步任务（AI 出题等）失败兜底
    try { console.error('[CampusAdv] Promise', e.reason); } catch (e0) {}
    if (ADV.UI && ADV.UI.toast) ADV.UI.toast(' ⚠ 后台任务出了点小问题，游戏继续 ');
  });

  return { startEnding };
})();
