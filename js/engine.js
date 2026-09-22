/* =========================================================
 * engine.js —— 游戏引擎
 * RPG Maker 式：网格步进移动、深度排序渲染、镜头跟随、
 * 场景淡出淡入切换、NPC 随机漫步、事件交互、粒子效果
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.Engine = (function () {
  const T = 32;
  const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
  const OPP = { down: 'up', up: 'down', left: 'right', right: 'left' };
  const W = 960, H = 640;

  let map = null, staticCv = null;
  let player = null;
  let npcs = [];
  let cam = { x: 0, y: 0 };
  let particles = [];
  let weatherPts = [];             // 天气/季节粒子（屏幕空间）
  let splashPts = [];              // 夏季溅水粒子（屏幕空间）
  let fade = { a: 0, target: 0, speed: 3, cb: null };
  let time = 0;
  let mapTitle = { name: '', t: 99 };   // 进场地图名大字（2.2 秒淡入淡出）

  // 季节过渡状态：1.5s 的 HSV 渐变遮罩，防止换季瞬间跳变
  let seasonTrans = {
    active: false, t: 0, dur: 1.5,
    fromSeason: 'spring', toSeason: 'spring',
    tintFrom: null, tintTo: null
  };
  // 静态画布上次使用的季节签名（用于决定是否需要增量重建）
  let staticSig = null;
  // 夜晚街区层离屏缓存：结果只随 map.id + 时段变化（P2-17，避免每帧全图扫描 + 重建门灯渐变）
  let nightCv = null, nightSig = null;
  const glowGrads = new Map();          // 灯光光晕渐变对象缓存（同坐标复用，键 x|y|r）
  // 星空坐标预计算（原式确定性：i*197%W, i*131%(H/2)），绘制时只改 globalAlpha，不再每帧拼 40 个 rgba 字符串
  const STARS = [];
  for (let i = 0; i < 40; i++) STARS.push([(i * 197) % W, (i * 131) % (H / 2)]);
  const fogGrads = {}, coldGrads = {};          // 天气渐变缓存（键：浓度档，仅两三档参数）

  // 季节内进度：每 10 天一季，返回 0~1；换季时自动触发过渡动画
  function seasonProgress() {
    if (!ADV.Cal) return 0;
    const p = ((ADV.Cal.day - 1) % 10) / 9;
    return Math.max(0, Math.min(1, p));
  }
  // 季节 4 档主色调遮罩（供过渡动画插值用）
  const SEASON_TINTS = {
    spring: [255, 240, 245, 0.00],
    summer: [255, 245, 200, 0.04],
    autumn: [255, 170, 80, 0.10],
    winter: [180, 210, 255, 0.14]
  };
  // 当前季节签名：拼接 season + progressBin + weather，用于缓存比较
  function currentSig() {
    if (!ADV.Cal) return 'spring_0_fine';
    const s = ADV.Cal.seasonEn();
    const pgBin = Math.max(0, Math.min(3, Math.floor(seasonProgress() * 4)));
    const w = ADV.Cal.weather;
    const wBin = (w === '小雨' || w === '暴雨') ? 'rain' : (w === '雪' ? 'snow' : 'fine');
    return s + '_' + pgBin + '_' + wBin;
  }

  function cnv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- 加载地图 ---------- */
  function loadMap(id, x, y, dir) {
    map = ADV.Maps.get(id);
    buildStatic();
    nightCv = null; nightSig = null;      // 夜景层按新图重建（P2-17 缓存失效）
    glowGrads.clear();                    // 灯光渐变按新图坐标重建

    player = {
      x, y, px: x * T, py: y * T, dir: dir || 'down', mv: null,
      pal: ADV.Game.hero,                  // 调色板键（动作姿势图需要）
      sheet: ADV.Sprites.makeCharSheet(ADV.Sprites.PALETTES[ADV.Game.hero]),
      pose: null, poseT: 0,
      balloon: null
    };
    npcs = map.npcs.map(n => ({
      ...n, px: n.x * T, py: n.y * T, mv: null,
      homeX0: n.x, homeY0: n.y,
      wait: 1 + Math.random() * 2, balloon: null, balloonT: -1,
      pose: null, poseT: 0, speech: null, goal: null, followT: 0, lastBrain: null,
      sheet: n.cat ? ADV.Sprites.makeCatSheet(n.cat) : ADV.Sprites.makeCharSheet(ADV.Sprites.PALETTES[n.pal])
    }));
    particles = [];
    if (map.particles === 'fountain') {
      for (let i = 0; i < 26; i++) particles.push(newDrop(true));
    } else if (map.particles === 'firefly' || map.particles === 'dragonfly') {
      const n = map.particles === 'dragonfly' ? 14 : 18;
      for (let i = 0; i < n; i++) particles.push(newFly(true));
    }
    weatherPts = [];
    // 应用持久状态（石门开启 / 祭坛发光 / 石闸 / 旺福 / 已收集闪光点隐藏）
    applyFlags();
    applySchedule(true);
    spawnBuddy();                                        // 随行伙伴：跟着玩家进新地图
    centerCam();
    mapTitle = { name: map.name, t: 0 };                 // 进场地图名大字
    // 季节/场景 BGM：校园四变奏 + 家的夜曲
    let bgm = map.bgm;
    if (bgm === 'campus' && !map.indoor) {
      const cap = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' }[ADV.Cal ? ADV.Cal.seasonEn() : 'spring'];
      bgm = 'campus' + cap;
    }
    if (bgm === 'home' && ADV.Cal && ADV.Cal.isNight()) bgm = 'night';
    map.bgmCur = bgm;
    if (bgm) ADV.Audio.playBgm(bgm);
  }

  /* ---------- 随行伙伴：跨地图跟随的小家伙 ---------- */
  function getBuddy() { return npcs.find(n => n.buddy && !n.hidden); }
  function spawnBuddy() {
    npcs = npcs.filter(n => !n.buddy);                   // 防重复生成
    const b = ADV.Game.flags && ADV.Game.flags.buddy;
    const cr = b && ADV.Collect && ADV.Collect.critter(b.id);
    if (!b || !cr) return;
    // 落在玩家脚边一格空位（上下左右 → 斜角）
    const spot = [[0, 1], [0, -1], [-1, 0], [1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]
      .map(([dx, dy]) => [player.x + dx, player.y + dy])
      .find(([x, y]) => x >= 0 && y >= 0 && x < map.w && y < map.h && !solidAt(x, y) && !entAt(x, y, null));
    const e = {
      id: '_buddy', buddy: true, name: cr.name, hidden: false,
      x: spot ? spot[0] : player.x, y: spot ? spot[1] : player.y,
      dir: 'down', mv: null, wander: 0, wait: 0,
      balloon: null, balloonT: -1, pose: null, poseT: 0, speech: null,
      goal: null, followT: 1e9, lastBrain: null,
      shiny: !!b.shiny,
      sheet: ADV.Sprites.makeBuddySheet(cr, !!b.shiny),
      s: '_buddy'                                        // Z 键互动脚本
    };
    e.px = e.x * T; e.py = e.y * T;
    npcs.push(e);
  }

  function applyFlags() {
    const F = ADV.Game.flags;
    if (F.gateOpen) setObjectOpen('stoneDoor', true);
    if (F.finalPassed) setObjectOpen('altar', true, 'glow');
    if (F.dawnAltar) setObjectOpen('dawnAltar', true, 'glow');
    for (const o of map.objects)
      if (o.kind === 'chest' && F.chests && F.chests[o.id]) o.open = true;
    // 寻宝迷宫持久状态：钥匙点亮对应祭坛 / 石门开启 / 大宝箱开启
    const TIER_KEY = ['treasureCopper', 'treasureSilver', 'treasureGold'];
    for (const o of map.objects) {
      if (o.kind === 'quizAltar') o.lit = !!F[TIER_KEY[o.tier | 0]];
      else if (o.kind === 'sealGate' && F.treasureGate) { o.open = true; o.solidTiles = []; }
      else if (o.kind === 'bossChest' && F.chests && F.chests[o.id]) o.open = true;
    }
    // 第二章持久状态：石闸升起 / 旺福入睡
    const gates = { t1: 'gate1', t2: 'gate2', t3: 'gate3', t4: 'gate4' };
    for (const t in gates) {
      const g = findObject(gates[t]);
      if (g && F[t]) g.solidTiles = [];
    }
    const dog = findObject('dog');
    if (dog && F.dogSleep) dog.sleep = true;
    // 已收集的闪光点不再绘制/交互；漫画书/画册拿到后星光熄灭
    if (ADV.Collect) {
      for (const o of map.objects)
        if (o.s === 'pick' && o.cid) o.taken = ADV.Collect.has('leaves', o.cid) || ADV.Collect.has('insects', o.cid);
    }
    // 星之果实：按 flags 恢复已摘取状态
    if (F.starFruit) {
      for (const o of map.objects)
        if (o.kind === 'starFruit' && F.starFruit[o.sid]) o.taken = true;
    }
    // 后院农场：地块阶段/浇水/施肥/洒水器与稻草人翻新状态由 flags 恢复
    if (F.farm) {
      for (const o of map.objects) {
        if (o.kind !== 'plot' || !F.farm[o.pid]) continue;
        const p = F.farm[o.pid];
        o.stage = p.st;
        o.watered = p.wd === (ADV.Cal ? ADV.Cal.day : -1);
        o.fert = !!p.fert;
        o.spk = !!p.spk;
      }
    }
    if (F.scarecrowFixed) {
      const sc = map.objects.find(o => o.kind === 'scarecrow');
      if (sc) sc.fixed = true;
    }
    const coopObj = map.objects.find(o => o.kind === 'coop');
    if (coopObj) coopObj.hasChicken = !!F.chicken;
    const cowObj = map.objects.find(o => o.kind === 'cowShed');
    if (cowObj) cowObj.hasCow = !!F.cow;
    const penObj = map.objects.find(o => o.kind === 'sheepPen');
    if (penObj) penObj.hasSheep = !!F.sheep;
    if (F.gotComic) {
      const cd = findObject('comicDesk'); if (cd) cd.sparkle = false;
      const ab = findObject('albumBox'); if (ab) ab.sparkle = false;
    }
  }

  function findObject(id) { return map.objects.find(o => o.id === id); }

  function isNight() { return !!(ADV.Cal && ADV.Cal.isNight()); }

  /* ---------- 夜晚街区层（窗灯 / 店门面 / 灯光光晕） ----------
   * 沿街住户窗子亮灯 + 店铺门面随深夜打烊，让同一张地图在时段里“换一次脸”。
   * 层内容只随地图与时段变化 → 画进离屏画布缓存，每帧只做一次 drawImage（P2-17） */
  function drawNightStreet(g) {
    const sig = map.id + '_' + ADV.Cal.period;
    if (!nightCv || nightSig !== sig) {
      nightCv = cnv(map.w * T, map.h * T);
      paintNightStreet(nightCv.getContext('2d'), ADV.Cal.period);
      nightSig = sig;
    }
    g.drawImage(nightCv, 0, 0);
  }
  function paintNightStreet(g, p) {
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const t = map.g[y][x];
      if (t === 'wallWin' || t === 'aptWin') {
        if ((x * 37 + y * 17) % 5 === 0) continue;        // 约两成窗子黑着，更像真街区
        g.globalAlpha = 0.34 + 0.16 * ((x * 13 + y * 7) % 3);
        g.fillStyle = t === 'wallWin' ? '#ffd489' : '#ffe0a0';
        if (t === 'wallWin') g.fillRect(x * T, y * T, T, T);
        else g.fillRect(x * T + 3, y * T + 3, T - 6, T - 8);
        g.globalAlpha = 1;
      } else if (t === 'doorWood' && map.g[y - 1] && String(map.g[y - 1][x]).indexOf('plaque:') === 0) {
        const cx = x * T + 16, cy = y * T + 16, closed = p === 5;
        const r = closed ? 20 : 42;
        const gr = g.createRadialGradient(cx, cy, 2, cx, cy, r);
        gr.addColorStop(0, closed ? 'rgba(150,170,205,.16)' : 'rgba(255,198,112,.42)');
        gr.addColorStop(1, 'rgba(255,198,112,0)');
        g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2);
        if (closed) {                                     // 深夜：门板压暗 + 挂上打烊木牌
          g.fillStyle = 'rgba(22,24,38,.42)'; g.fillRect(x * T + 3, y * T + 4, T - 6, T - 6);
          g.fillStyle = 'rgba(255,236,196,.85)';
          g.fillRect(x * T + 10, y * T + 13, 12, 2); g.fillRect(x * T + 10, y * T + 17, 12, 4);
        }
      }
    }
  }

  // 灯光光晕：路灯与夜里点亮的物件在脚下投一圈暖光（渐变对象按坐标缓存复用）
  function drawGlow(g, x, y, r) {
    const key = x + '|' + y + '|' + r;
    let gr = glowGrads.get(key);
    if (!gr) {
      gr = g.createRadialGradient(x, y, 2, x, y, r);
      gr.addColorStop(0, 'rgba(255,206,120,.40)');
      gr.addColorStop(1, 'rgba(255,206,120,0)');
      glowGrads.set(key, gr);
    }
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function setObjectOpen(id, open, propName) {
    const o = findObject(id);
    if (!o) return;
    if (propName === 'glow') o.glow = open;
    else o.open = open;
    if (id === 'stoneDoor') {
      o.solidTiles = open
        ? [[0, 0], [0, 1], [1, 0], [1, 1]]
        : [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]];
    }
    if (id === 'sealGate') {                 // 符文石门：开启后可穿行
      o.solidTiles = open ? [] : [[0, 0], [1, 0], [0, 1], [1, 1]];
    }
  }

  function buildStatic() {
    const season = ADV.Cal ? ADV.Cal.seasonEn() : 'spring';
    const pg = seasonProgress();
    const weather = ADV.Cal ? ADV.Cal.weather : '晴';
    staticCv = cnv(map.w * T, map.h * T);
    const g = staticCv.getContext('2d');
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const v = (x * 7 + y * 13 + ((x * y) & 3)) % 3;
      g.drawImage(ADV.Sprites.getTile(map.g[y][x], v, season, pg, weather), x * T, y * T);
    }
    staticSig = currentSig() + '_' + map.id;
  }
  // 按需重建静态画布：仅当季节签名变化（季节内进度跨分档/天气改变）时触发，避免每帧重绘
  function rebuildStaticIfNeeded() {
    if (!map) return;
    const sig = currentSig() + '_' + map.id;
    if (sig !== staticSig) buildStatic();
  }

  /* ---------- 碰撞与占位 ---------- */
  // 时段陈设：带 periods 的物件只在列出的时段摆出来（集市摊位 / 晒谷 / 影幕等），
  // 非该时段既不显示、也不挡路、也不可交互，同一张地图随一天推进换脸
  function objVisible(o) {
    if (!o.periods || !ADV.Cal) return true;
    return o.periods.indexOf(ADV.Cal.period) >= 0;
  }

  function solidAt(x, y) {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return true;
    if (ADV.Maps.SOLID.has(map.g[y][x])) return true;
    for (const o of map.objects) {
      if (!objVisible(o)) continue;
      if (o.solidTiles && o.solidTiles.some(([dx, dy]) => o.x + dx === x && o.y + dy === y)) return true;
    }
    return false;
  }
  function entAt(x, y, self) {
    if (player && player !== self && player.x === x && player.y === y) return player;
    for (const n of npcs) {
      if (n.hidden || n === self || n.x !== x || n.y !== y) continue;
      if (n.buddy) continue;                            // 随行小伙伴不挡路（可穿行）
      return n;
    }
    return null;
  }
  function passable(x, y, self) { return !solidAt(x, y) && !entAt(x, y, self); }

  /* ---------- 实体移动 ---------- */
  function startMove(e, dir, dur) {
    const [dx, dy] = DIRV[dir];
    e.dir = dir;
    if (!passable(e.x + dx, e.y + dy, e)) return false;
    e.mv = { fx: e.x, fy: e.y, t: 0, dur };
    e.x += dx; e.y += dy;
    return true;
  }
  function stepEntity(e, dt) {
    if (!e.mv) return false;
    e.mv.t += dt / e.mv.dur;
    if (e.mv.t >= 1) {
      e.px = e.x * T; e.py = e.y * T; e.mv = null;
      return true;   // 到达
    }
    e.px = (e.mv.fx + (e.x - e.mv.fx) * e.mv.t) * T;
    e.py = (e.mv.fy + (e.y - e.mv.fy) * e.mv.t) * T;
    return false;
  }

  /* ---------- 玩家更新 ---------- */
  function updatePlayer(dt, input) {
    if (player.mv) {
      if (stepEntity(player, dt)) onArrive();
      return;
    }
    const dirs = ['up', 'down', 'left', 'right'].filter(d => input.held[d]);
    if (!dirs.length) return;
    // 👟 健步如飞（料理 buff）：当天走路步频加快；冲刺键不变
    let dur = .22;
    try { const b = ADV.Game.flags.buff; if (b && b.swift === ADV.Cal.day) dur = .18; } catch (e) {}
    if (input.held.dash) dur = .13;
    // 贴墙滑动：同时按住多个方向时逐个尝试（斜推遇墙会沿墙走，不再原地卡死）
    let moved = false;
    for (const dir of dirs) {
      if (startMove(player, dir, dur)) { moved = true; break; }
    }
    if (!moved) { player.dir = dirs[0]; return; }   // 四面全被挡：至少面朝第一个按住的方向
    // 脚步声：按脚下材质分三种（草地软 / 硬地板脆 / 洞穴带回声）
    const tile = map.g[player.y] && map.g[player.y][player.x] || '';
    const surface = /^cave/.test(tile) ? 'cave' : map.indoor ? 'floor' : 'grass';
    ADV.Audio.sfx('step', surface);
    // 跑步扬尘：脚下冒两粒小灰点
    if (input.held.dash) for (let i = 0; i < 2; i++) particles.push(newDust());
  }

  function onArrive() {
    const d = map.doors.find(d => d.x === player.x && d.y === player.y && (!d.need || ADV.Game.flags[d.need]));
    if (d) doTransfer(d);
    // 随行伙伴亲密度：同行漫步（距离 ≤ 2）每 30 步 +1，每日至多 +4
    const B = ADV.Game.flags;
    if (B && B.buddy && ADV.Cal) {
      const bd = getBuddy();
      if (bd && Math.abs(bd.x - player.x) + Math.abs(bd.y - player.y) <= 2) {
        B.buddySteps = (B.buddySteps || 0) + 1;
        if (B.buddySteps % 30 === 0) {
          const rec = B.buddyWalkDay && B.buddyWalkDay.day === ADV.Cal.day ? B.buddyWalkDay.n : 0;
          if (rec < 4) { B.buddyBond = Math.min(100, (B.buddyBond || 0) + 1); B.buddyWalkDay = { day: ADV.Cal.day, n: rec + 1 }; }
        }
      }
    }
    // 野外高草：走进草丛有几率惊动野生小伙伴（入丛 3 步后开始判定，11%/步，14 步保底）
    if (map.grass && ADV.Game.S && ADV.Game.S.wildBattle) {
      const z = map.grass.find(z => player.x >= z.x && player.x < z.x + z.w && player.y >= z.y && player.y < z.y + z.h);
      if (z) {
        B.wildSteps = (B.wildSteps || 0) + 1;
        if (B.wildSteps >= 3 && (Math.random() < .11 || B.wildSteps >= 14)) {
          B.wildSteps = 0;
          runScript('wildBattle', Object.assign({}, z, { map: map.id }));
        }
      } else B.wildSteps = 0;
    }
  }

  /* ---------- 场景切换 ---------- */
  function doTransfer(d) {
    if (ADV.Game.flags && ADV.Game.flags.party) {          // 换图与同伴道别
      ADV.Game.flags.party = '';
      ADV.UI.toast(' 与同伴挥手道别 ');
    }
    ADV.Game.busy = true;
    ADV.Audio.sfx('door');
    fadeTo(1, .32, () => {
      loadMap(d.to[0], d.to[1], d.to[2], d.to[3]);
      // 存档延后一拍：避免把 JSON.stringify 排进淡入首帧造成过图瞬间微卡顿
      fadeTo(0, .4, () => {
        ADV.Game.busy = false;
        setTimeout(() => { try { ADV.Game.save(); } catch (e) {} }, 0);
      });
    });
  }
  function fadeTo(target, timeSec, cb) { fade.target = target; fade.speed = 1 / timeSec; fade.cb = cb; }

  /* ---------- NPC 随机漫步 + 日常动作 ---------- */
  // 朝目标格走一步（主轴优先，被挡则试副轴/绕行，全挡则放弃）
  function stepToward(n, tx, ty, speed) {
    const dx = tx - n.x, dy = ty - n.y;
    const h = dx === 0 ? null : (dx > 0 ? 'right' : 'left');
    const v = dy === 0 ? null : (dy > 0 ? 'down' : 'up');
    const dirs = [];
    if (Math.abs(dx) >= Math.abs(dy)) { if (h) dirs.push(h); if (v) dirs.push(v); }
    else { if (v) dirs.push(v); if (h) dirs.push(h); }
    if (h) dirs.push(h === 'left' ? 'right' : 'left');
    if (v) dirs.push(v === 'up' ? 'down' : 'up');
    for (const d of dirs) if (startMove(n, d, speed || .24)) return true;
    return false;
  }
  function goTo(n, tx, ty) {
    if (!map || !n) return false;
    tx = Math.max(0, Math.min(map.w - 1, tx | 0));
    ty = Math.max(0, Math.min(map.h - 1, ty | 0));
    if (solidAt(tx, ty) || entAt(tx, ty, n)) return false;
    n.goal = { x: tx, y: ty };
    n.followT = 0;
    return true;
  }
  // 自主喊话：NPC 头顶显示一句短文本
  function speak(ent, text) {
    if (ent) ent.speech = { text: String(text).slice(0, 26), t: 0 };
  }
  function updateNpcs(dt) {
    for (const n of npcs) {
      if (n.mv) { stepEntity(n, dt); continue; }
      if (n.pose) continue;                             // 做动作时保持不动
      if (n.followT > 0) {                              // 自主行为：跟随玩家
        n.followT -= dt;
        if (player && Math.abs(player.x - n.x) + Math.abs(player.y - n.y) > 1)
          stepToward(n, player.x, player.y, n.buddy ? .16 : undefined);   // 小短腿跑得欢
        else if (n.buddy && player && !n.mv) {          // 贴身小动作：面向主人 / 偶尔冒个心情
          if (n.x === player.x && n.y === player.y) {   // 被主人踩到重叠 → 立刻挪到旁边空位
            for (const d of ['down', 'left', 'right', 'up']) if (startMove(n, d, .16)) break;
          } else {
            const dx = player.x - n.x, dy = player.y - n.y;
            n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
            if (Math.random() < dt * .07) { n.balloon = ['♪', '…', '♥'][(Math.random() * 3) | 0]; n.balloonT = 0; }
          }
        }
        continue;
      }
      if (n.goal) {                                     // 自主行为：走向目标格
        if (n.x === n.goal.x && n.y === n.goal.y) n.goal = null;
        else if (!stepToward(n, n.goal.x, n.goal.y)) n.goal = null;
        continue;
      }
      if (n.route && n.route.length) {                  // 巡逻路线：沿路点循环行进（操场跑圈等）
        if (n.wait > 0) { n.wait -= dt; continue; }      // 堵路冷却倒计时（本块 continue 会跳过下方公共 wait 递减）
        const rp = n.route[n.ri || 0];
        if (n.x === rp[0] && n.y === rp[1]) { n.ri = ((n.ri || 0) + 1) % n.route.length; continue; }
        const dx = rp[0] - n.x, dy = rp[1] - n.y;
        const cand = [];                                // 主轴优先，副轴绕行，不后退（避免抖动）
        if (Math.abs(dx) >= Math.abs(dy)) {
          if (dx) cand.push(dx > 0 ? 'right' : 'left');
          if (dy) cand.push(dy > 0 ? 'down' : 'up');
          else cand.push('down', 'up');                 // 纯水平路径被堵 → 垂直绕行一格
        } else {
          if (dy) cand.push(dy > 0 ? 'down' : 'up');
          if (dx) cand.push(dx > 0 ? 'right' : 'left');
          else cand.push('right', 'left');              // 纯垂直路径被堵 → 水平绕行一格
        }
        let ok = false;
        for (const d of cand) {
          const [ddx, ddy] = DIRV[d];
          if (passable(n.x + ddx, n.y + ddy, n)) { startMove(n, d, n.runner ? .13 : .28); ok = true; break; }
        }
        if (!ok) n.wait = .4;                           // 被玩家/障碍挡住就稍等片刻
        continue;
      }
      n.wait -= dt;
      // 偶尔冒个表情
      if (n.mood && Math.random() < dt * .02) { n.balloon = n.mood; n.balloonT = 0; }
      if (n.wait > 0) continue;
      n.wait = 1.2 + Math.random() * 2.2;
      // 日常动作：看书 / 打哈欠 / 思考 / 猫舔毛……（acts 定义见 maps.js）
      if (n.acts && n.acts.length && Math.random() < .45) {
        n.pose = n.acts[(Math.random() * n.acts.length) | 0];
        n.poseT = 1.6 + Math.random() * 1.8;
        continue;
      }
      if (!n.wander || Math.random() < .35) continue; // 有时原地休息
      const dirs = ['down', 'left', 'right', 'up'];
      const dir = dirs[(Math.random() * 4) | 0];
      const [dx, dy] = DIRV[dir];
      const nx = n.x + dx, ny = n.y + dy;
      if (Math.abs(nx - n.homeX0) <= n.wander && Math.abs(ny - n.homeY0) <= n.wander &&
          passable(nx, ny, n)) startMove(n, dir, n.runner ? .13 : .3);
    }
  }

  /* ---------- 动作播放（剧情编排 / 玩家挥手用） ---------- */
  function playAction(ent, pose, dur) {
    if (!ent || !ADV.Sprites.POSE_LIST.includes(pose) && !ADV.Sprites.CAT_POSES.includes(pose)) return;
    ent.pose = pose;
    ent.poseT = dur || 1.4;
    if (ent.mv) ent.mv = null;                          // 立即站定做动作
  }

  // 玩家主动挥手：周围 NPC 转身回应
  function playerAction() {
    if (ADV.Game.busy || ADV.UI.busy || player.pose || player.mv) return;
    playAction(player, 'wave', .9);
    ADV.Audio.sfx('emote');
    for (const n of npcs) {
      if (Math.abs(n.x - player.x) + Math.abs(n.y - player.y) > 3) continue;
      const dx = player.x - n.x, dy = player.y - n.y;
      n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      if (n.cat) { n.balloon = '♪'; n.balloonT = 0; ADV.Audio.sfx('cat'); }
      else if (Math.random() < .6) { n.balloon = '♥'; n.balloonT = 0; n.pose = null; playAction(n, 'wave', 1.1); }
      else { n.balloon = '!'; n.balloonT = 0; }
    }
  }

  // H 键：邀请面前的同学放学同行（或与同伴道别）
  function hangoutAction() {
    if (ADV.Game.busy || ADV.UI.busy) return;
    const [dx, dy] = DIRV[player.dir];
    const fx = player.x + dx, fy = player.y + dy;
    const npc = npcs.find(n => n.x === fx && n.y === fy) ||
                npcs.find(n => Math.abs(n.x - player.x) + Math.abs(n.y - player.y) <= 1);
    if (npc && ADV.Game.BOND_META && ADV.Game.BOND_META[npc.id]) { runScript('_hangout', npc); return; }
    if (ADV.Game.flags.party) {
      const mate = getNpc(ADV.Game.flags.party);
      if (mate) { mate.followT = 0; }
      ADV.Game.flags.party = '';
      ADV.UI.toast(' 与同伴道别啦 ');
    } else {
      ADV.UI.toast(' 面前没有可以邀请的同学（放学/傍晚按 H 组队）');
    }
  }

  // G 键：面向 NPC 送礼
  function giftAction() {
    if (ADV.Game.busy || ADV.UI.busy) return;
    const [dx, dy] = DIRV[player.dir];
    const fx = player.x + dx, fy = player.y + dy;
    const npc = npcs.find(n => n.x === fx && n.y === fy) ||
                npcs.find(n => Math.abs(n.x - player.x) + Math.abs(n.y - player.y) <= 1);
    if (!npc) { ADV.UI.toast(' 面前没有可以送礼的人 '); return; }
    if (!ADV.Game.BOND_META || !ADV.Game.BOND_META[npc.id]) { ADV.UI.toast(` ${npc.name}：心意收到了～ `); return; }
    runScript('_gift', npc);
  }

  /* ---------- 交互（Z 键） ---------- */
  /* ---------- 交互目标查找（interact 与头顶提示共用） ---------- */
  function findTarget(forHint) {
    if (!player || !map) return null;
    const [dx, dy] = DIRV[player.dir];
    return computeTarget(player.x + dx, player.y + dy, !!forHint);
  }
  function computeTarget(fx, fy, forHint) {
    // forHint：提示层专用。随行小伙伴几乎永远贴在玩家身边，若参与提示判定，
    // 名牌 + Z 气泡会常驻屏幕——提示层跳过它（脚下重叠兜底除外），Z 键交互不受影响
    let npc = npcs.find(n => !n.hidden && n.x === fx && n.y === fy && !(forHint && n.buddy));
    let ex = fx, ey = fy;

    // 柜台后的人物也可对话（RPG Maker 经典处理）；越界格（如门口朝外看）直接跳过
    if (!npc && fx >= 0 && fy >= 0 && fx < map.w && fy < map.h &&
        solidAt(fx, fy) && ADV.Maps.COUNTER.has(map.g[fy][fx])) {
      const bx = fx + dx, by = fy + dy;
      const back = npcs.find(n => n.x === bx && n.y === by);
      if (back) { npc = back; ex = bx; ey = by; }
    }
    if (npc) return { kind: 'npc', npc, x: ex, y: ey };
    // 伙伴被踩到重叠在脚下时，面前格子没有目标 → 兜底命中伙伴（Z 键永远叫得动它）
    if (!npc) {
      const bud = npcs.find(n => n.buddy && !n.hidden && n.x === player.x && n.y === player.y);
      if (bud) { npc = bud; return { kind: 'npc', npc, x: npc.x, y: npc.y }; }
    }
    // 物件事件（石门 / 祭坛 / 木牌）。注意：solidTiles 为空数组 = 非实体标记物，
    // 应按坐标命中（漫画书 / 画册 / 出口牌 / 翻找点等全靠它）
    for (const o of map.objects) {
      if (!o.s || !objVisible(o)) continue;
      if (o.s === 'pick' && o.taken) continue;          // 已收集的闪光点
      if (o.kind === 'starFruit' && o.taken) continue;  // 已摘取的星之果实
      const hit = o.solidTiles && o.solidTiles.length
        ? o.solidTiles.some(([ox, oy]) => o.x + ox === fx && o.y + oy === fy)
        : (o.x === fx && o.y === fy);
      if (hit) return { kind: 'obj', obj: o, x: o.x, y: o.y };
    }
    // 地面调查点
    const it = map.inters.find(i => i.x === fx && i.y === fy);
    if (it) return { kind: 'inter', inter: it, x: it.x, y: it.y };
    // 门（走上去传送；按 Z 显示去向）
    const dr = map.doors.find(d => d.x === fx && d.y === fy && (!d.need || ADV.Game.flags[d.need]));
    if (dr) return { kind: 'door', door: dr, x: dr.x, y: dr.y };
    // 相邻四格 NPC 兜底：奔跑/游走型 NPC（如山道上的小红）常与玩家错开一格，
    // 面向格落空时改抓贴身邻居，保证 Z 键一定能叫住人（与 G 键送礼同一判定尺度）
    const near = npcs.find(n => !n.hidden && !(forHint && n.buddy) &&
      Math.abs(n.x - player.x) + Math.abs(n.y - player.y) === 1);
    if (near) return { kind: 'npc', npc: near, x: near.x, y: near.y };
    return null;
  }

  // 门去向地名（按目标地图缓存，避免每帧重建地图）
  const doorLabelCache = {};
  function doorLabel(d) {
    if (!d || !d.to) return '';
    if (!(d.to[0] in doorLabelCache)) {
      try { doorLabelCache[d.to[0]] = (ADV.Maps.get(d.to[0]) || {}).name || ''; }
      catch (e) { doorLabelCache[d.to[0]] = ''; }
    }
    return doorLabelCache[d.to[0]];
  }

  function interact() {
    const t = findTarget();
    if (!t) return;
    if (t.kind === 'npc') {
      const npc = t.npc;
      npc.dir = OPP[player.dir];
      npc.balloon = '!'; npc.balloonT = 0;
      npc.pose = null;                                  // 打断日常动作，转身应对
      if (npc.cat) ADV.Audio.sfx('cat'); else ADV.Audio.sfx('emote');
      runScript(npc.s, npc);
      return;
    }
    if (t.kind === 'obj') {
      // 工具热键栏：当前槽位工具已持有且与目标匹配 → 跳过菜单直接执行第一项
      const G = ADV.Game;
      if (G && G.HOTBAR_SLOTS && G.hotbarCur && G.hotbarToolMatch) {
        const tool = G.HOTBAR_SLOTS[G.hotbarCur()];
        if (tool && G.hotbarToolMatch(tool, t.obj)) G.quickPick = 0;
      }
      runScript(t.obj.s, t.obj).finally(() => { if (ADV.Game) ADV.Game.quickPick = null; });
      return;
    }
    if (t.kind === 'inter') { runScript(t.inter.s, { name: t.inter.name }); return; }
    if (t.kind === 'door') {                            // 站在门口按 Z：提示去向
      const lab = doorLabel(t.door);
      ADV.UI.toast(lab ? ` → ${lab} ` : ' → 迈步向前 ');
    }
  }

  async function runScript(id, ent) {
    ADV.Game.busy = true;
    try {
      const fn = ADV.Game.S[id];
      if (fn) await fn(ent);
      else ADV.UI.toast('……（这里什么也没有）');
    } finally {
      ADV.Game.busy = false;
    }
  }

  /* ---------- 镜头 ---------- */
  function centerCam() {
    const mw = map.w * T, mh = map.h * T;
    let cx = player.px + T / 2 - W / 2, cy = player.py + T / 2 - H / 2;
    cam.x = mw <= W ? (mw - W) / 2 : Math.max(0, Math.min(mw - W, cx));
    cam.y = mh <= H ? (mh - H) / 2 : Math.max(0, Math.min(mh - H, cy));
  }

  /* ---------- 粒子 ---------- */
  function newDrop(anywhere) {
    return {
      kind: 'drop',
      x: 21 * T + 14 + Math.random() * 36, y: 16 * T + 6,
      vx: (Math.random() - .5) * 46, vy: anywhere ? (Math.random() * -30) : -55 - Math.random() * 30,
      life: .55 + Math.random() * .3, t: anywhere ? Math.random() * .4 : 0
    };
  }
  function newFly(anywhere) {
    return {
      kind: 'fly',
      x: Math.random() * map.w * T, y: Math.random() * map.h * T,
      vx: 0, vy: 0, life: 3, t: anywhere ? Math.random() * 3 : 0,
      ph: Math.random() * 6.28
    };
  }
  // 跑步扬尘（灰白小点，从脚边升起渐隐）
  function newDust() {
    return {
      kind: 'dust',
      x: player.px + 8 + Math.random() * 16, y: player.py + 26 + Math.random() * 4,
      vx: (Math.random() - .5) * 18, vy: -14 - Math.random() * 12,
      life: .38 + Math.random() * .18, t: 0
    };
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      if (p.kind === 'drop') {
        p.vy += 190 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.t > p.life) { if (map.particles === 'fountain') particles[i] = newDrop(false); else particles.splice(i, 1); }
      } else if (p.kind === 'dust') {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 26 * dt;
        if (p.t > p.life) particles.splice(i, 1);
      } else {
        if (Math.random() < dt * 1.5) { p.vx = (Math.random() - .5) * 26; p.vy = (Math.random() - .5) * 26; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.t > p.life) { if (map.particles === 'firefly' || map.particles === 'dragonfly') particles[i] = newFly(false); else particles.splice(i, 1); }
      }
    }
  }

  // NPC 日程：按时段把校园同学挪到该去的位置
  let lastPeriod = -1;
  function applySchedule(force) {
    if (!ADV.Cal || !map) return;
    const p = ADV.Cal.period;
    if (!force && p === lastPeriod) return;
    lastPeriod = p;
    const sched = ADV.Maps.SCHED && ADV.Maps.SCHED[map.id];
    if (!sched) return;
    for (const n of npcs) {
      const slot = sched[n.id] && sched[n.id][p];
      if (n.mv) continue;
      if (slot === null) {                              // null = 该时段离场（回家/打烊）
        n.hidden = true;
        continue;
      }
      n.hidden = false;
      if (!slot) continue;
      n.x = slot[0]; n.y = slot[1];
      n.px = n.x * T; n.py = n.y * T;
      n.homeX0 = n.x; n.homeY0 = n.y;
      n.goal = null; n.followT = 0;
    }
  }

  /* ---------- 天气/季节粒子 + 时段/季节色调 ---------- */
  function updateWeather(dt) {
    if (!ADV.Cal || map.indoor) return;
    const w = ADV.Cal.weather, season = ADV.Cal.seasonEn();
    const pg = seasonProgress();
    const SCALE = W < 800 ? 0.6 : 1;
    let want = 0, kind = null;
    if (w === '小雨') { want = Math.round(90 * SCALE); kind = 'rain'; }
    else if (w === '暴雨') { want = Math.round(180 * SCALE); kind = 'rain'; }
    else if (w === '雪') { want = Math.round(80 * SCALE); kind = 'snow'; }
    else if (season === 'winter' && w !== '晴') { want = Math.round(35 * SCALE); kind = 'snow'; }
    else if (season === 'spring' && (w === '晴' || w === '多云')) { want = Math.round((16 + pg * 18) * SCALE); kind = 'petal'; }
    else if (season === 'autumn' && (w === '晴' || w === '多云')) { want = Math.round((10 + pg * 22) * SCALE); kind = 'leaf'; }
    while (weatherPts.length < want) weatherPts.push({
      x: Math.random() * W, y: Math.random() * H,
      v: .5 + Math.random(), ph: Math.random() * 6.28,
      col: 0, size: 1 + Math.random() * 2
    });
    if (weatherPts.length > want) weatherPts.length = want;
    weatherPts.kind = kind;
    for (const p of weatherPts) {
      if (kind === 'rain') {
        const sp = w === '暴雨' ? 1.8 : 1;
        p.x += 70 * p.v * dt * 3 * sp; p.y += 700 * p.v * dt * sp;
        if (w === '暴雨' && p.y > H - 20 && Math.random() < dt * 14) {
          splashPts.push({ x: p.x, y: H - 4, t: 0, life: 0.28 });
          if (splashPts.length > 120) splashPts.shift();
        }
      } else if (kind === 'snow') {
        const sp = w === '雪' ? 1 : 0.6;
        p.ph += dt;
        p.x += Math.sin(p.ph) * 36 * dt + 10 * dt;
        p.y += (32 + p.v * 18) * dt * sp;
      } else if (kind === 'petal') {
        p.ph += dt * (1.2 + p.v * 0.8);
        p.x += Math.sin(p.ph) * 22 * dt + 18 * dt;
        p.y += (22 + p.v * 20) * dt;
      } else if (kind === 'leaf') {
        p.ph += dt * (1.0 + p.v * 0.8);
        p.x += Math.sin(p.ph) * 30 * dt + 16 * dt;
        p.y += (28 + p.v * 16) * dt;
      }
      if (p.y > H + 8) { p.y = -8; p.x = Math.random() * W; }
      if (p.x > W + 8) p.x = -8;
      if (p.x < -8) p.x = W + 8;
    }
    for (let i = splashPts.length - 1; i >= 0; i--) {
      const s = splashPts[i]; s.t += dt;
      if (s.t > s.life) splashPts.splice(i, 1);
    }
  }
  function drawWeatherAndTint(g) {
    if (!ADV.Cal) return;
    const outdoor = map && !map.indoor;
    if (outdoor) {
      const p = ADV.Cal.period;
      const tint = ['rgba(255,200,100,.10)', null, null, 'rgba(255,170,90,.08)', 'rgba(255,120,60,.16)', 'rgba(16,26,80,.36)'][p];
      if (tint) { g.fillStyle = tint; g.fillRect(0, 0, W, H); }
      if (ADV.Cal.weather === '星空' && p >= 4) {
        g.fillStyle = 'rgba(8,10,40,.30)'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#fffadc';
        for (let i = 0; i < STARS.length; i++) {
          g.globalAlpha = .4 + .4 * Math.sin(time * 2 + i);
          g.fillRect(STARS[i][0], STARS[i][1], 2, 2);
        }
        g.globalAlpha = 1;
      }
      const season = ADV.Cal.seasonEn();
      const pg = seasonProgress();
      const w = ADV.Cal.weather;
      let st;
      if (season === 'summer') st = (w === '小雨' || w === '暴雨') ? 'rgba(80,100,140,.12)' : 'rgba(255,230,100,.05)';
      else if (season === 'autumn') st = `rgba(255,${140 - pg * 30 | 0},${40 + pg * 10 | 0},${(0.08 + pg * 0.04).toFixed(2)})`;
      else if (season === 'winter') st = w === '雪' ? 'rgba(140,180,255,.20)' : 'rgba(120,160,255,.14)';
      else st = null;
      if (st) { g.fillStyle = st; g.fillRect(0, 0, W, H); }

      // 夏季雨雾全屏遮罩（渐变按浓度档缓存，只有两档）
      if (season === 'summer' && (w === '小雨' || w === '暴雨')) {
        const fogA = w === '暴雨' ? 0.22 : 0.10;
        let grd = fogGrads[fogA];
        if (!grd) {
          grd = g.createLinearGradient(0, 0, 0, H);
          grd.addColorStop(0, `rgba(170,195,230,${(fogA * 0.7).toFixed(2)})`);
          grd.addColorStop(0.5, `rgba(150,185,225,${fogA.toFixed(2)})`);
          grd.addColorStop(1, `rgba(130,170,220,${(fogA * 1.15).toFixed(2)})`);
          fogGrads[fogA] = grd;
        }
        g.fillStyle = grd; g.fillRect(0, 0, W, H);
        if (w === '暴雨') {
          g.globalAlpha = 0.18;
          g.fillStyle = '#a0c0e0';
          for (let i = 0; i < 16; i++) {
            const y0 = ((time * 520 + i * 83) % (H + 40)) - 20;
            g.fillRect((i * 67 + time * 220) % W, y0, 2, 56);
          }
          g.globalAlpha = 1;
        }
      }
      // 冬季寒冷强化：边缘蓝色渐晕（渐变按浓度档缓存）
      if (season === 'winter') {
        const coldA = w === '雪' ? 0.22 : 0.13;
        let vg = coldGrads[coldA];
        if (!vg) {
          vg = g.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, Math.max(W, H) * 0.72);
          vg.addColorStop(0, 'rgba(160,200,255,0)');
          vg.addColorStop(1, `rgba(120,160,230,${coldA.toFixed(2)})`);
          coldGrads[coldA] = vg;
        }
        g.fillStyle = vg; g.fillRect(0, 0, W, H);
      }

      const k = weatherPts.kind;
      if (k === 'rain') {
        const isStorm = w === '暴雨';
        // 同一样式的雨滴合并为一条 path，一次 stroke（原来每滴 beginPath/stroke）
        g.strokeStyle = isStorm ? 'rgba(190,220,255,.65)' : 'rgba(170,200,240,.55)';
        g.lineWidth = isStorm ? 1.5 : 1;
        g.beginPath();
        for (const p of weatherPts) {
          g.moveTo(p.x, p.y); g.lineTo(p.x - (isStorm ? 5 : 3), p.y - (isStorm ? 16 : 12));
        }
        g.stroke();
        for (const s of splashPts) {
          const a = Math.max(0, 1 - s.t / s.life);
          const r = 1 + s.t * 22;
          g.strokeStyle = `rgba(200,225,255,${(a * 0.75).toFixed(2)})`;
          g.lineWidth = 1;
          g.beginPath(); g.arc(s.x, s.y, r, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
          g.fillStyle = `rgba(220,240,255,${(a * 0.8).toFixed(2)})`;
          g.fillRect(s.x - 1, s.y - 2, 2, 2);
        }
      } else if (k === 'snow') {
        const big = w === '雪';
        for (const p of weatherPts) {
          const sz = (big ? 3 : 2) + (p.size > 1.5 ? 1 : 0);
          g.fillStyle = p.size > 1.5 ? 'rgba(255,255,255,.92)' : 'rgba(230,245,255,.8)';
          g.fillRect(p.x, p.y, sz, sz);
          if (big && p.size > 1.7) {
            g.fillStyle = 'rgba(220,235,255,.28)';
            g.fillRect(p.x - 1, p.y - 1, sz + 2, sz + 2);
          }
        }
      } else if (k === 'petal') {
        const cols = ['rgba(255,182,208,.85)', 'rgba(255,228,120,.85)', 'rgba(200,170,245,.80)', 'rgba(255,255,255,.82)'];
        for (let i = 0; i < weatherPts.length; i++) {
          const p = weatherPts[i];
          g.fillStyle = cols[i % cols.length];
          g.fillRect(p.x, p.y, 4, 3);
          g.fillStyle = 'rgba(255,255,255,.35)';
          g.fillRect(p.x + 1, p.y, 2, 1);
        }
      } else if (k === 'leaf') {
        const cols = pg < 0.4
          ? ['rgba(220,200,80,.85)', 'rgba(230,170,60,.85)', 'rgba(180,140,50,.82)', 'rgba(160,120,60,.80)']
          : ['rgba(230,160,60,.85)', 'rgba(220,110,50,.85)', 'rgba(200,80,50,.85)', 'rgba(160,80,40,.82)'];
        for (let i = 0; i < weatherPts.length; i++) {
          const p = weatherPts[i];
          g.fillStyle = cols[i % cols.length];
          g.fillRect(p.x, p.y, 3, 4);
          g.fillRect(p.x + 1, p.y - 1, 2, 2);
          g.fillStyle = 'rgba(90,50,20,.5)';
          g.fillRect(p.x + 1, p.y + 1, 1, 2);
        }
      }
    }
  }

  // 季节过渡绘制：在黑幕 fade 之上额外绘制一层彩色渐变遮罩
  function drawSeasonTransition(g) {
    if (!seasonTrans.active) return;
    const tt = Math.min(1, seasonTrans.t / seasonTrans.dur);
    const eased = 1 - Math.pow(1 - tt, 3);
    const a = Math.sin(eased * Math.PI);
    const f = SEASON_TINTS[seasonTrans.fromSeason] || SEASON_TINTS.spring;
    const to = SEASON_TINTS[seasonTrans.toSeason] || SEASON_TINTS.spring;
    const r = (f[0] + (to[0] - f[0]) * eased) | 0;
    const gg = (f[1] + (to[1] - f[1]) * eased) | 0;
    const b = (f[2] + (to[2] - f[2]) * eased) | 0;
    const aa = Math.max(f[3], to[3]) + a * 0.22;
    g.fillStyle = `rgba(${r},${gg},${b},${aa.toFixed(3)})`;
    g.fillRect(0, 0, W, H);
    if (tt > 0.25 && tt < 0.75) {
      const ca = Math.sin((tt - 0.25) / 0.5 * Math.PI) * 0.16;
      const rg = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * 0.7);
      rg.addColorStop(0, `rgba(255,250,235,${ca.toFixed(2)})`);
      rg.addColorStop(1, 'rgba(255,250,235,0)');
      g.fillStyle = rg; g.fillRect(0, 0, W, H);
    }
  }

  /* ---------- 更新总入口 ---------- */
  function update(dt, input) {
    time += dt;
    if (mapTitle.t < 2.2) mapTitle.t += dt;
    // 淡入淡出
    if (fade.a !== fade.target) {
      const before = fade.a;
      fade.a += Math.sign(fade.target - before) * fade.speed * dt;
      // 判断是否到达或越过目标（比较跨越前后的差值符号）
      if ((fade.target - before) * (fade.target - fade.a) <= 0) {
        fade.a = fade.target;
        if (fade.cb) { const cb = fade.cb; fade.cb = null; cb(); }
      }
    }
    updateParticles(dt);
    updateWeather(dt);
    // 季节过渡时间推进：在 easeOutCubic 到达 ~0.5 时重建静态画布，被彩色遮罩挡着不会跳变
    if (seasonTrans.active) {
      const before = seasonTrans.t;
      seasonTrans.t += dt;
      const ttBefore = before / seasonTrans.dur;
      const ttAfter = seasonTrans.t / seasonTrans.dur;
      if (ttBefore < 0.5 && ttAfter >= 0.5) rebuildStaticIfNeeded();
      if (seasonTrans.t >= seasonTrans.dur) {
        seasonTrans.active = false;
        rebuildStaticIfNeeded();
      }
    } else {
      rebuildStaticIfNeeded();
    }
    // 气泡 / 动作姿势计时（对话期间也要继续播放）
    if (player.balloon) { player.balloonT += dt; if (player.balloonT > 1.35) player.balloon = null; }
    for (const n of npcs) if (n.balloon) { n.balloonT += dt; if (n.balloonT > 1.35) n.balloon = null; }
    if (player.pose) { player.poseT -= dt; if (player.poseT <= 0) player.pose = null; }
    for (const n of npcs) if (n.pose) { n.poseT -= dt; if (n.poseT <= 0) n.pose = null; }
    if (player.speech) { player.speech.t += dt; if (player.speech.t > 3.4) player.speech = null; }
    for (const n of npcs) if (n.speech) { n.speech.t += dt; if (n.speech.t > 3.4) n.speech = null; }

    if (ADV.Game.busy) { centerCam(); return; }   // 对话/切换中冻结
    updatePlayer(dt, input);
    updateNpcs(dt);
    centerCam();
  }

  /* ---------- 渲染 ---------- */
  function frameOf(e) {
    // 动作姿势：按时间循环播放 3 帧（原地也能挥动手臂）
    if (e.pose) return [0, 1, 2, 1][Math.floor(time * 3) % 4];
    // 行走动画：站立/迈步A/站立/迈步B 循环
    if (!e.mv) return 0;
    const t = e.mv.t;
    return (t < .25 ? 1 : t < .5 ? 0 : t < .75 ? 2 : 0);
  }

  /* ---------- 单实体绘制（render 排序列表回调；不用闭包，降低每帧堆分配） ---------- */
  // 物件：缓存键编码 + 夜灯先铺光 + 本体 + 石门宝石
  function drawObj(g, o, meta, night) {
    const key = o.kind === 'fountain' ? 'fountain' + (Math.floor(time * 2.2) % 2)
      : o.kind === 'stoneDoor' ? 'stoneDoor'
      : o.kind === 'altar' ? 'altar'
      : o.kind === 'dog' ? 'dog'
      : o.kind === 'sign' ? 'sign' : o.kind;
    const opt = o.kind === 'sign' ? o.text
      : o.kind === 'stoneDoor' ? o.open
      : o.kind === 'altar' ? o.glow
      : o.kind === 'chest' ? o.open
      : o.kind === 'quizAltar' ? (o.tier * 2 + (o.lit ? 1 : 0))
      : o.kind === 'sealGate' ? o.open
      : o.kind === 'bossChest' ? o.open
      : o.kind === 'dog' ? o.sleep
      : o.kind === 'lamp' ? (night ? 1 : 0)
      : o.kind === 'tree' ? o.v
      : o.kind === 'plot' ? ((o.stage | 0) + (o.watered ? 10 : 0) + (o.fert ? 100 : 0) + (o.spk ? 1000 : 0))   // +10=浇过水，+100=施过肥，+1000=洒水器
      : o.kind === 'scarecrow' ? (o.fixed ? 1 : 0)                   // 翻新后的稻草人
      : o.kind === 'coop' ? o.hasChicken
      : o.kind === 'cowShed' ? o.hasCow
      : o.kind === 'sheepPen' ? o.hasSheep
      : o.kind === 'buzz' ? ((ADV.Game.flags.buzzCaught || {})[o.bid] === (ADV.Cal ? ADV.Cal.day : 0))  // 今日捕过 → 虫子躲起来
      : o.kind === 'critter' ? ((ADV.Game.flags.critterDay || {})[o.pid] === (ADV.Cal ? ADV.Cal.day : 0)) // 今日惊扰 → 窝点安静
      : o.kind === 'ore' ? (o.tier | 0)                    // 矿石：档次编码进缓存键
      : null;
    // 季节性物件（tree/fruitTree/flowerbed）传季节参数，走多维缓存；其余物件保持旧签名
    const seasonForObj = ADV.Cal ? ADV.Cal.seasonEn() : 'spring';
    const pgForObj = seasonProgress();
    const wForObj = ADV.Cal ? ADV.Cal.weather : '晴';
    const c = (o.kind === 'tree' || o.kind === 'fruitTree' || o.kind === 'flowerbed')
      ? ADV.Sprites.getObject(key, opt, seasonForObj, pgForObj, wForObj)
      : ADV.Sprites.getObject(key, opt);
    // 夜里点亮的灯 / 灯串：先铺一层暖光，再画本体
    if (night && o.kind === 'lamp') drawGlow(g, o.x * T + 16, o.y * T + 8, 46);
    else if (night && o.nightGlow) drawGlow(g, o.x * T + 16, o.y * T + 14, 34);
    g.drawImage(c, o.x * T, o.y * T - (c.height - meta.h / T * T));
    if (o.id === 'stoneDoor' && !o.open) drawDoorGems(g, o);
  }
  // 石门宝石（按收集进度点亮：数学/语文/科学/英语）
  function drawDoorGems(g, o) {
    const F = ADV.Game.flags;
    const gems = [[24, 42, F.badges.math, '#5a8aff'], [40, 42, F.badges.chinese, '#ff6a7a'],
                  [24, 60, F.badges.science, '#4ae86c'], [40, 60, F.badges.english, '#ffd94c']];
    for (const [gx, gy, got, col] of gems) {
      if (!got) continue;
      const x = o.x * T + gx, y = o.y * T + gy;
      g.fillStyle = col;
      g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.8)';
      g.fillRect(x - 1, y - 3, 2, 2);
    }
  }
  // 角色：姿势图按实体 memo（避免每帧展开 palette 对象 + sprites 内 JSON.stringify 重建键）
  function drawChar(g, e) {
    let sh;
    if (e.pose) {
      if (e._poseKey !== e.pose) {
        e._poseKey = e.pose;
        e._poseSheet = e.cat ? ADV.Sprites.makeCatSheet(Object.assign({}, e.cat, { pose: e.pose }))
                             : ADV.Sprites.makePoseSheet(ADV.Sprites.PALETTES[e.pal], e.pose);
      }
      sh = e._poseSheet;
    } else sh = e.sheet;
    const fh = sh.height / 4;
    const row = { down: 0, left: 1, right: 2, up: 3 }[e.dir];
    // 阴影
    g.fillStyle = 'rgba(0,0,0,.25)';
    g.beginPath(); g.ellipse(e.px + 16, e.py + 30, 10, 4, 0, 0, Math.PI * 2); g.fill();
    g.drawImage(sh, frameOf(e) * 32, row * fh, 32, fh, e.px, e.py + T - fh, 32, fh);
  }

  function render(g) {
    if (!map) return;
    const night = isNight();
    g.fillStyle = map.indoor ? '#1c1a28' : '#0e1a10';
    g.fillRect(0, 0, W, H);
    g.save();
    g.translate(-Math.round(cam.x), -Math.round(cam.y));
    g.drawImage(staticCv, 0, 0);
    if (night && !map.indoor) drawNightStreet(g);

    // 深度排序：物件按底边 y，角色按脚底 y（视口裁剪 + 扁平条目，见 drawObj/drawChar）
    const items = [];
    const vx0 = cam.x - 192, vx1 = cam.x + W + 192, vy0 = cam.y - 160, vy1 = cam.y + H + 160;
    for (const o of map.objects) {
      if (!objVisible(o)) continue;
      if (o.kind === 'starFruit' && o.taken) continue;  // 已摘取的星之果实不再绘制
      const meta = OBJ_META[o.kind];
      if (!meta) continue;
      const ox = o.x * T, oy = o.y * T;
      if (ox > vx1 || oy > vy1 || ox + 192 < vx0 || oy + 160 < vy0) continue;   // 视口外（含余量）不进列表
      items.push({ y: (o.y + meta.h / T - 1) * T + T, o, meta });
    }
    items.push({ y: player.py + T, e: player });
    for (const n of npcs) {
      if (n.hidden) continue;
      if (n.py + T < vy0 - 96 || n.py > vy1 + 96) continue;      // 竖向远离视口的角色不画
      items.push({ y: n.py + T, e: n });
    }

    items.sort((a, b) => a.y - b.y);
    for (const it of items) { if (it.e) drawChar(g, it.e); else drawObj(g, it.o, it.meta, night); }

    // 粒子
    for (const p of particles) {
      if (p.kind === 'drop') {
        g.fillStyle = 'rgba(230,245,255,.85)';
        g.fillRect(p.x, p.y, 2, 2);
      } else if (p.kind === 'dust') {
        const a = Math.max(0, 1 - p.t / p.life) * .55;
        g.fillStyle = `rgba(210,205,190,${a.toFixed(2)})`;
        g.fillRect(p.x, p.y, 3, 3);
      } else {
        const a = .35 + .35 * Math.sin(p.ph + time * 3);
        g.fillStyle = map.particles === 'dragonfly' ? `rgba(150,220,255,${a.toFixed(2)})` : `rgba(255,240,150,${a.toFixed(2)})`;
        g.fillRect(p.x, p.y, 3, 3);
      }
    }

    // 头顶气泡
    const balloonOf = (e, h) => {
      if (e.balloon) ADV.Sprites.drawBalloon(g, e.px + 16, e.py + T - h, e.balloon, e.balloonT);
    };
    for (const n of npcs) balloonOf(n, n.buddy ? 30 : n.cat ? 28 : 44);
    balloonOf(player, 44);

    // 自主喊话气泡
    for (const n of npcs) if (n.speech) drawSpeechBubble(g, n);
    if (player.speech) drawSpeechBubble(g, player);

    // 交互提示：面前有可交互目标 → 浮动 Z 气泡 / NPC 名牌 / 门去向
    // （提示属于锦上添花，任何异常都不允许打断主循环）
    if (!ADV.Game.busy && !(ADV.UI && ADV.UI.busy)) {
      try {
        const tgt = findTarget(true);
        if (tgt) drawHint(g, tgt);
      } catch (e) { /* 忽略提示层异常 */ }
    }

    g.restore();

    // 天气粒子 / 时段与季节色调（屏幕空间，室内不显示）
    drawWeatherAndTint(g);
    // 季节过渡彩色渐变遮罩（上层覆盖，1.5s 换季瞬间防止跳变）
    drawSeasonTransition(g);

    // 闪光标记点（可拾取物 / 关键剧情物，未处理时脉动星光；视口外的跳过）
    for (const o of map.objects) {
      if (!o.sparkle || o.taken) continue;
      const x = o.x * T + 16 - Math.round(cam.x), y = o.y * T + 14 - Math.round(cam.y);
      if (x < -12 || x > W + 12 || y < -12 || y > H + 12) continue;
      const a = .5 + .5 * Math.sin(time * 4);
      g.fillStyle = `rgba(255,240,150,${a.toFixed(2)})`;
      g.fillRect(x - 2, y - 8, 4, 4); g.fillRect(x - 2, y + 4, 4, 4);
      g.fillRect(x - 8, y - 2, 4, 4); g.fillRect(x + 4, y - 2, 4, 4);
      g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(x - 1, y - 1, 3, 3);
    }

    // 进场地图名大字（淡入 → 停留 → 淡出）
    if (mapTitle.t < 2.2 && mapTitle.name) {
      const t = mapTitle.t;
      const a = t < .35 ? t / .35 : t > 1.7 ? Math.max(0, (2.2 - t) / .5) : 1;
      const yy = 148 - (1 - Math.min(1, t / .35)) * 14;   // 上滑入场
      g.save(); g.globalAlpha = a;
      g.font = 'bold 34px "Microsoft YaHei", "PingFang SC", sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'top';
      const tw = g.measureText(mapTitle.name).width;
      g.fillStyle = 'rgba(10,12,30,.55)';
      g.fillText(mapTitle.name, W / 2 + 2, yy + 2);
      g.fillStyle = '#ffe9a8';
      g.fillText(mapTitle.name, W / 2, yy);
      // 两侧装饰线
      g.fillStyle = 'rgba(216,192,120,.85)';
      g.fillRect(W / 2 - tw / 2 - 86, yy + 17, 64, 2);
      g.fillRect(W / 2 + tw / 2 + 22, yy + 17, 64, 2);
      g.fillStyle = '#d8c078';
      g.fillRect(W / 2 - tw / 2 - 16, yy + 16, 4, 4);
      g.fillRect(W / 2 + tw / 2 + 12, yy + 16, 4, 4);
      g.restore();
    }

    // 场景切换黑幕
    if (fade.a > 0) {
      g.fillStyle = `rgba(8,8,16,${fade.a.toFixed(3)})`;
      g.fillRect(0, 0, W, H);
    }
  }

  // 物件元数据：像素高（用于锚点与深度；缺失的物件不会被渲染！）
  const OBJ_META = {
    tree: { h: 64 }, lamp: { h: 60 }, bench: { h: 30 },
    fountain: { h: 64 }, stoneDoor: { h: 96 }, altar: { h: 64 },
    plant: { h: 40 }, rock: { h: 36 }, stump: { h: 34 }, sign: { h: 44 }, scarecrow: { h: 56 },
    hoop: { h: 56 }, piano: { h: 44 }, chest: { h: 30 }, caveMouth: { h: 48 },
    quizAltar: { h: 44 }, sealGate: { h: 80 }, bossChest: { h: 40 },   // 寻宝迷宫
    sortingHat: { h: 26 }, telescope: { h: 46 }, dog: { h: 44 }, broom: { h: 40 },
    cauldron: { h: 30 }, mirror: { h: 76 }, trapdoor: { h: 32 },
    // 家具（床/书桌/书柜/饭桌）与校园设施（值 = 精灵画布高）
    bed: { h: 40 }, desk2: { h: 30 }, shelf2: { h: 40 }, goban: { h: 30 },
    dig: { h: 24 }, dummy: { h: 52 }, easel: { h: 46 },
    goal: { h: 44 }, bleachers: { h: 46 }, flagpole: { h: 62 }, flowerbed: { h: 36 },
    board: { h: 44 }, sandpit: { h: 32 }, flags: { h: 30 },
    // P1 软装 + P2 街景
    bookStack: { h: 26 }, plantRack: { h: 40 }, wallClock: { h: 24 }, curtain: { h: 40 },
    bbNews: { h: 26 }, coatHook: { h: 20 }, stove2: { h: 30 }, trophyFrame: { h: 24 },
    catBed: { h: 18 }, chair2: { h: 34 }, wallArt: { h: 24 }, mailbox2: { h: 34 },
    newsstand: { h: 40 }, swing: { h: 44 }, clothesline: { h: 36 }, bannerFlag: { h: 44 },
    starFruit: { h: 30 },                                             // 星之果实（精力上限）
    plot: { h: 24 }, coop: { h: 40 },                                 // 后院农场：田垄 + 鸡舍
    cowShed: { h: 40 }, sheepPen: { h: 34 },                          // 牧场扩展（s5）：牛棚 + 羊圈
    buzz: { h: 30 },                                                  // 虫鸣点：捕虫草丛
    critter: { h: 30 },                                               // 生物窝点：小兽洞口
    photoSpot: { h: 40 }, dateSpot: { h: 40 }, mysterySpot: { h: 44 },// 交互点专属立牌
    pickupSpot: { h: 26 }, busStop: { h: 44 }, bikeRack: { h: 30 },
    ore: { h: 36 }, crack: { h: 34 }, rope: { h: 44 },                // 矿道：矿石/裂缝/绳索
    elevator: { h: 44 }                                               // 矿道：运矿电梯
  };

  /* ---------- 供 game.js / ai.js 调用的辅助 ---------- */
  function emote(ent, icon) { ent.balloon = icon; ent.balloonT = 0; ADV.Audio.sfx('emote'); }
  function getNpc(id) { return npcs.find(n => n.id === id); }

  // 头顶喊话气泡（多行自动换行）
  function drawSpeechBubble(g, e) {
    const s = e.speech;
    g.font = '13px "Microsoft YaHei", "PingFang SC", sans-serif';
    const lines = [];
    let line = '';
    for (const ch of s.text) {
      if (g.measureText(line + ch).width > 132) { lines.push(line); line = ch; }
      else line += ch;
    }
    if (line) lines.push(line);
    const w = Math.min(150, Math.max(...lines.map(l => g.measureText(l).width)) + 16);
    const lh = 17, bh = lines.length * lh + 10;
    const cx = e.px + 16, y = e.py - bh - 16;
    g.save();
    g.fillStyle = 'rgba(255,255,255,.96)'; g.strokeStyle = '#2a2a3a'; g.lineWidth = 2;
    g.beginPath();
    if (g.roundRect) g.roundRect(cx - w / 2, y, w, bh, 7); else g.rect(cx - w / 2, y, w, bh);
    g.fill(); g.stroke();
    g.beginPath(); g.moveTo(cx - 5, y + bh - 1); g.lineTo(cx, y + bh + 7); g.lineTo(cx + 5, y + bh - 1);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#2a2a3a'; g.textAlign = 'center'; g.textBaseline = 'top';
    lines.forEach((l, i) => g.fillText(l, cx, y + 6 + i * lh));
    g.restore();
  }

  // 交互提示：目标头顶浮动 Z 气泡；NPC 附名牌（含好感心）；门显示去向
  function drawHint(g, t) {
    const bob = Math.sin(time * 3) * 2.5;
    const hx = t.x * T + 16, hy = t.y * T + bob;
    g.save();
    g.font = 'bold 12px "Microsoft YaHei", "PingFang SC", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'top';
    if (t.kind === 'npc') {
      const n = t.npc;
      const fr = (ADV.Game.friends || {})[n.id];
      // 随行伙伴：按亲密度画心
      const bb = n.buddy ? (ADV.Game.flags.buddyBond || 0) : 0;
      const bstage = bb >= 60 ? 3 : bb >= 30 ? 2 : bb >= 1 ? 1 : 0;
      const hearts = (fr && fr.stage ? ' ♥'.repeat(fr.stage) : '') || (bstage ? ' ♥'.repeat(bstage) : '');
      const label = (n.name || '') + (n.buddy && n.shiny ? ' ✨' : '') + hearts;
      const lw = g.measureText(label).width + 12;
      g.fillStyle = 'rgba(12,16,40,.78)';
      if (g.roundRect) { g.beginPath(); g.roundRect(hx - lw / 2, hy - 46, lw, 18, 4); g.fill(); }
      else g.fillRect(hx - lw / 2, hy - 46, lw, 18);
      g.fillStyle = hearts ? '#ffd7e2' : '#e8ecff';
      g.fillText(label, hx, hy - 43);
      // H 气泡：放学/傍晚面对可邀约的同学 → 提示按 H 同行；面对当前同伴 → 提示按 H 道别
      if (ADV.Game.BOND_META && ADV.Game.BOND_META[n.id]) {
        const party = ADV.Game.flags ? ADV.Game.flags.party : '';
        const invite = !party && ADV.Cal && (ADV.Cal.period === 3 || ADV.Cal.period === 4) &&
                       ((fr && fr.stage >= 1) || (fr && fr.love >= 10));
        if (invite || party === n.id) {
          const bx = hx + 37, by = hy - 66;
          g.fillStyle = 'rgba(12,16,40,.85)';
          g.beginPath(); g.arc(bx, by, 9, 0, Math.PI * 2); g.fill();
          g.strokeStyle = '#ff9ec2'; g.lineWidth = 1.5; g.stroke();
          g.fillStyle = '#ffd7e2';
          g.textBaseline = 'middle';
          g.fillText('H', bx, by + 1);
        }
      }
    } else if (t.kind === 'door') {
      const label = '→ ' + (doorLabel(t.door) || '迈步向前');
      const lw = g.measureText(label).width + 12;
      g.fillStyle = 'rgba(12,16,40,.78)';
      if (g.roundRect) { g.beginPath(); g.roundRect(hx - lw / 2, hy - 40, lw, 18, 4); g.fill(); }
      else g.fillRect(hx - lw / 2, hy - 40, lw, 18);
      g.fillStyle = '#ffe9a8';
      g.fillText(label, hx, hy - 37);
      g.restore();
      return;
    }
    // Z 气泡（NPC / 物件 / 调查点）
    const bx = hx + 15, by = hy - (t.kind === 'npc' ? 66 : 26);
    g.fillStyle = 'rgba(12,16,40,.85)';
    g.beginPath(); g.arc(bx, by, 9, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#d8c078'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = '#ffe9a8';
    g.textBaseline = 'middle';
    g.fillText('Z', bx, by + 1);
    g.restore();
  }

  // 启动季节过渡：由 cal.js 在换季时调用（先启动 1.5s 彩色遮罩，在遮罩中段重建静态画布）
  function startSeasonTransition(fromSeason, toSeason) {
    seasonTrans.active = true;
    seasonTrans.t = 0;
    seasonTrans.fromSeason = fromSeason;
    seasonTrans.toSeason = toSeason;
    // 清空缓存键，强制在下一次 rebuildStaticIfNeeded 时重建
    staticSig = null;
    // 天气粒子池清空，让新季节粒子重新生成（避免雪花与花瓣在过渡帧混在一起）
    weatherPts.length = 0;
    splashPts.length = 0;
  }

  return {
    loadMap, update, render, interact, fadeTo, findTarget,
    emote, getNpc, setObjectOpen, playAction, playerAction, giftAction, hangoutAction, findObject, applySchedule,
    objVisible,
    goTo, speak, startSeasonTransition,
    spawnBuddy, getBuddy,
    get map() { return map; },
    get player() { return player; },
    get npcs() { return npcs; }
  };
})();
