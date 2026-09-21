/* =========================================================
 * minigame.js —— 小游戏
 * ADV.Mini.start(kind, onDone) 启动；结束后回调 onDone(win)
 *   ball   投篮：光标停在绿色区域按 Z，三投两中胜
 *   music  琴键记忆：复述琴键闪亮顺序（←↑↓→）
 *   stars  星座观测：同琴键玩法的星空版（✦ 四色星）
 *   broom  扫帚飞行：追捕金翼球，躲开游走球，限时抓 3 次
 *   keys   飞钥匙：按谜语选中正确的那把钥匙，共 2 轮
 *   chess  骑士之旅：马步跳上全部发光格，共 2 关
 * —— 童年怀旧玩法包 ——
 *   hopscotch 跳房子：沙包进绿区按 Z，8 跳中 6 跳获胜
 *   marbles   弹珠：←→ 瞄角度，Z 出手，把弹珠滚进雪圈（3 投 2 中）
 *   cradle    翻花绳：记住手指翻转顺序并复述（5 步）
 *   plane     纸飞机：Z 蓄力再 Z 放手，穿过 2 个呼啦圈
 *   cards     翻卡配对：18 次翻牌内配齐 6 对童年卡
 *   snowfight 打雪仗：5 条雪道，←→ 躲雪球、Z 还手，先砸中 6 下
 * —— 体育比赛包 ——
 *   longjump  沙坑跳远：助跑条冲进绿区按 Z 起跳，3 跳取最远破 4 米
 *   tug       拔河：连按 Z 与渐强的对手拉锯，红标先过 ±0.8 线定胜负
 *   relay     班级接力：节奏条绿区按 Z 迈步，4 棒 × 3 步抢先冲线
 * X / Esc 随时退出（视为未获胜）
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.Mini = (function () {
  const W = 960, H = 640;
  let act = null;
  const FONT = (s, w) => `${w || 'bold'} ${s}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  const PADCOL = ['#4a9ae8', '#4ae86c', '#ffd94c', '#e85a5a'];
  const PADGLYPH = ['←', '↑', '↓', '→'];
  const STARGLYPH = ['✦', '✧', '★', '✶'];
  const KEY2PAD = { left: 0, up: 1, down: 2, right: 3 };
  const WINGCOL = ['银色', '金色', '绯红', '墨绿'];
  const WINGHEX = ['#c8d0dc', '#ffd94c', '#e85a5a', '#3a7a4a'];
  const GEMCOL = ['蓝宝石', '红宝石', '翡翠', '紫水晶'];
  const GEMHEX = ['#4a6ae8', '#e84a6a', '#4ae86c', '#8a5ad9'];
  const CRAGLYPH = ['翻', '挑', '勾', '转'];           // 翻花绳四式（对应 ←↑↓→）
  const CARDGLYPH = ['陀', '珠', '蛙', '绳', '机', '包', '蜻', '镜', '弓', '画', '雪', '章'];
  const CARDHEX = ['#e8746a', '#5aa8e8', '#6ac86a', '#d9a05a', '#8a7ad9', '#c86ab4',
    '#5ad4c8', '#e8c85a', '#a8e85a', '#e88ac8', '#7ab0ff', '#ffd0a0'];

  function text(g, s, x, y, size, color, align) {
    g.font = FONT(size); g.textAlign = align || 'center'; g.textBaseline = 'top';
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillText(s, x + 2, y + 2);
    g.fillStyle = color; g.fillText(s, x, y);
  }

  function start(kind, onDone, opt) {
    if (act) return;
    if (kind === 'ball') {
      const easy = !!(opt && opt.easy);
      act = {
        kind, onDone, phase: 'aim', marker: 0, dir: 1, speed: 1.15,
        tries: 0, hits: 0, ballT: 0, hit: false, easy,
        zoneL: easy ? .36 : .44, zoneR: easy ? .70 : .60,
        msg: '光标停在绿色区域时，按 Z / 空格 投篮！'
      };
    } else if (kind === 'music' || kind === 'stars') {
      act = {
        kind, onDone, phase: 'show', t: 1.1, idx: 0, flash: -1,
        seq: Array.from({ length: 4 }, () => (Math.random() * 4) | 0),
        msg: kind === 'stars' ? '看好了！记住星星点亮的顺序……' : '看好了！记住琴键闪亮的顺序……'
      };
    } else if (kind === 'fish') {
      // 垂钓搏鱼：等咬 → 提竿 → 按住收线把鱼控制在网里，充满进度条
      const easy = !!(opt && opt.easy);
      const wide = !!(opt && opt.wide);                        // 硬调竿：网口更宽（S1 工具升级）
      const big = Math.random() < (easy ? .18 : .35);          // 大鱼：冲得更凶
      act = {
        kind, onDone, phase: 'wait', easy, big,
        waitT: easy ? 1 + Math.random() : 1.3 + Math.random() * 1.4,
        biteT: easy ? .95 : .7,
        fishY: .5, fishV: 0, dartT: 0, zoneC: 160,
        ZH: easy ? 112 : (wide ? 110 : 92), fishSpd: (easy ? 150 : 185) * (big ? 1.2 : 1),
        zoneSpd: easy ? 320 : 330, gain: easy ? .3 : .25,
        prog: .35, t: 25, ripple: 0, outT: 0,
        msg: '耐心等鱼上钩……浮漂下沉时，马上按 Z / ● 提竿！'
      };
    } else if (kind === 'broom') {
      act = {
        kind, onDone, phase: 'go', t: 40, got: 0,
        px: W / 2, py: 380, vx: 0, vy: 0, stun: 0,
        bx: 300, by: 200, bvx: 170, bvy: 120,          // 金翼球
        kx: 600, ky: 140,                              // 游走球
        msg: '方向键骑扫帚，抓到金翼球 3 次！小心黑色游走球！'
      };
    } else if (kind === 'keys') {
      const mk = () => ({ wing: (Math.random() * 4) | 0, gem: (Math.random() * 4) | 0 });
      const gen = () => {
        const ks = Array.from({ length: 5 }, mk);
        const target = ks[(Math.random() * 5) | 0];
        return { ks, target };
      };
      act = { kind, onDone, phase: 'go', round: 1, sel: 0, t: 30, wrong: 0, gen, cur: gen(), msg: '听好谜语，抓住正确的那把钥匙！' };
    } else if (kind === 'chess') {
      const lv = () => {
        const tg = new Set();
        while (tg.size < 4) tg.add(((Math.random() * 25) | 0));
        return { tg: [...tg], cur: 0, moves: 14 };
      };
      act = { kind, onDone, phase: 'go', lv: 1, pos: 0, data: lv(), cursel: 0, msg: '用「日」字马步，跳上全部发光的格子！' };
    } else if (kind === 'hopscotch') {
      const z = hopZone(0);
      act = {
        kind, onDone, phase: 'aim', marker: 0, dir: 1, speed: 1.05,
        hop: 0, hits: 0, hist: [], hit: false, hopT: 0, zoneL: z.l, zoneR: z.r,
        msg: '沙包落在绿格里时按 Z，单脚跳进房子！'
      };
    } else if (kind === 'marbles') {
      act = {
        kind, onDone, phase: 'aim', angle: 55 * Math.PI / 180, power: 0, pdir: 1,
        tries: 0, hits: 0, hole: mkHole(), t: 0, mx: 160, my: 380, dist: 0,
        msg: '← → 调角度，Z 蓄力出手，把弹珠滚进雪圈！'
      };
    } else if (kind === 'cradle') {
      act = {
        kind, onDone, phase: 'show', t: 1.1, idx: 0, flash: -1,
        seq: Array.from({ length: 5 }, () => (Math.random() * 4) | 0),
        msg: '看好了！记住手指翻转的顺序……'
      };
    } else if (kind === 'plane') {
      act = {
        kind, onDone, phase: 'ready', power: 0, pdir: 1, shots: 3, passed: 0,
        wind: (Math.random() * 2 - 1) * 60, px: 150, py: 330, vx: 320, vy: 0, t: 0,
        rings: [{ x: 430, y: 307, done: false }, { x: 580, y: 225, done: false }, { x: 720, y: 330, done: false }],
        msg: '按 Z 蓄力，再按 Z 放手，穿过 2 个呼啦圈！'
      };
    } else if (kind === 'cards') {
      const shuffle = arr => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = (Math.random() * (i + 1)) | 0, tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return arr;
      };
      const pool = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).slice(0, 6);
      const deck = shuffle(pool.concat(pool));
      act = {
        kind, onDone, grid: deck, cur: 0, open: [], matched: new Set(),
        flips: 18, lock: 0, msg: '18 次翻牌内配齐 6 对童年卡！'
      };
    } else if (kind === 'snowfight') {
      act = {
        kind, onDone, t: 30, lane: 2, hits: 0, hurt: 0,
        foes: [], balls: [], eballs: [], spawnT: .8,
        msg: '← → 换雪道，Z 丢雪球！先砸中对面的雪人 6 下！'
      };
    } else if (kind === 'longjump') {
      act = {
        kind, onDone, phase: 'run', marker: 0, dir: 1, speed: 1.0,
        tries: 0, best: 0, dist: 0, flyT: 0, power: 0, bonus: false,
        zoneL: .78, zoneR: .95,
        msg: '助跑条冲进绿区时按 Z 起跳！3 跳取最远，破 4 米获胜！'
      };
    } else if (kind === 'tug') {
      act = {
        kind, onDone, pos: 0, t: 0, helper: !!(opt && opt.helper),
        msg: '连按 Z 拔河！把红标拔过左侧白线！对面越拖越猛……'
      };
    } else if (kind === 'relay') {
      const z = relayZone();
      act = {
        kind, onDone, leg: 1, marker: 0, dir: 1, speed: .95,
        zoneL: z.l, zoneR: z.r, good: 0, miss: 0, ot: 0,
        msg: '接力节奏跑：光标进绿区按 Z 迈步！4 棒 × 3 步抢先冲线'
      };
    } else if (kind === 'melon') {
      // 西瓜割：木刀光标来回瞄准，绿区落刀；5 刀切中 3 刀开瓜（每中一刀加速）
      act = {
        kind, onDone, phase: 'aim', marker: 0, dir: 1, speed: .9,
        swings: 0, hits: 0, chT: 0, lastHit: false,
        zoneL: .74, zoneR: .92,
        msg: '木刀来回瞄准——红心处按 Z 落刀！切中 3 刀开瓜（共 5 刀）'
      };
    }
    ADV.Audio.sfx('start');
  }

  function finish(win) {
    const cb = act.onDone, stats = act;
    act = null;
    ADV.Audio.sfx(win ? 'fanfare' : 'cancel');
    if (cb) cb(!!win, stats);      // 第二参数带出成绩（如跳远最远距离）
  }

  /* ---------- 骑士步辅助 ---------- */
  const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  const kx = i => i % 5, ky = i => (i / 5) | 0;

  /* ---------- 童年玩法辅助 ---------- */
  // 跳房子：第 hop 跳的绿区（越跳越窄）
  function hopZone(hop) {
    const w = Math.max(.14, .34 - hop * .025);
    const l = .06 + Math.random() * Math.max(.02, .88 - w);
    return { l, r: l + w };
  }
  // 弹珠：在出手点 (160,380) 前上方随机生成一个雪圈（保证落在场地内）
  function mkHole() {
    let hx, hy;
    do {
      const d = 160 + Math.random() * 240;
      const a = (15 + Math.random() * 60) * Math.PI / 180;
      hx = 160 + Math.cos(a) * d;
      hy = 380 - Math.sin(a) * d;
    } while (hy < 175 || hx > 560);
    return { x: hx, y: hy };
  }
  // 打雪仗：5 条雪道的横坐标
  const laneX = l => W / 2 + (l - 2) * 150;
  // 接力：每一步的绿区位置（随机漂移）
  function relayZone() {
    const w = .2, l = .04 + Math.random() * .72;
    return { l, r: l + w };
  }

  function update(dt, p, held) {
    if (!act) return;
    if (p.cancel) { finish(false); return; }
    if (act.kind === 'fish') {
      const TRACK = 320;                                   // 渔道像素高
      if (act.phase === 'wait') {
        act.waitT -= dt;
        act.ripple += dt;
        if (act.waitT <= 0) { act.phase = 'bite'; ADV.Audio.sfx('emote'); }
      } else if (act.phase === 'bite') {
        act.biteT -= dt;
        if (p.ok) {                                        // 提竿刺鱼成功
          ADV.Audio.sfx('correct');
          act.phase = 'fight'; act.prog = .35; act.t = 22; act.dartT = 0;
          act.msg = '咬钩了！按住 Z / ● 上提渔网，别让鱼跑出网外！';
          return;
        }
        if (act.biteT <= 0) { act.msg = '慢了一步……鱼儿吐钩跑了。'; finish(false); return; }
      } else if (act.phase === 'fight') {
        act.t -= dt;
        const fishPx = act.fishY * TRACK;
        const half = act.ZH / 2;
        const inside = Math.abs(fishPx - act.zoneC) <= half + 10;
        // 鱼的游动：频繁小幅变向 + 偶尔朝网外挣扎
        act.dartT -= dt;
        if (act.dartT <= 0) {
          act.dartT = .35 + Math.random() * .55;
          act.fishV = (Math.random() * 2 - 1) * act.fishSpd;
        }
        if (inside && Math.random() < dt * (act.easy ? .5 : .7)) {
          act.fishV = (fishPx >= act.zoneC ? 1 : -1) * act.fishSpd * 1.15;   // 挣扎出网
        }
        act.fishY += (act.fishV / TRACK) * dt;   // fishV 是像素速度，fishY 是 0~1 归一化坐标
        if (act.fishY < 0) { act.fishY = 0; act.fishV = Math.abs(act.fishV) * .7; }
        if (act.fishY > 1) { act.fishY = 1; act.fishV = -Math.abs(act.fishV) * .7; }
        // 渔网：按住上提，松手缓慢下沉
        const holding = !!(held && held.ok);
        act.zoneC += (holding ? -act.zoneSpd : act.zoneSpd * .75) * dt;
        act.zoneC = Math.max(half, Math.min(TRACK - half, act.zoneC));
        // 鱼离网的累计时间越长，挣扎越猛（衰减上限提升）——挂机必输
        if (!inside) act.outT += dt;
        const decay = .16 + .07 * Math.min(2, act.outT);
        act.prog += dt * (inside ? act.gain : -decay);
        if (act.prog >= 1) { act.msg = '钓上来了！'; finish(true); return; }
        if (act.prog <= 0) { act.msg = '鱼儿挣脱了……'; finish(false); return; }
        if (act.t <= 0) { act.msg = '鱼儿挣脱了……'; finish(false); return; }
      }
      return;
    }
    if (act.kind === 'ball') {
      if (act.phase === 'aim') {
        act.marker += act.dir * act.speed * dt;
        if (act.marker > 1) { act.marker = 1; act.dir = -1; }
        if (act.marker < 0) { act.marker = 0; act.dir = 1; }
        if (p.ok) {
          act.hit = act.marker >= act.zoneL && act.marker <= act.zoneR;
          act.phase = 'fly'; act.ballT = 0;
          ADV.Audio.sfx(act.hit ? 'correct' : 'wrong');
        }
      } else {
        act.ballT += dt;
        if (act.ballT > .9) {
          act.tries += 1;
          act.hits += act.hit ? 1 : 0;
          if (act.tries >= 3) { finish(act.hits >= 2); return; }
          act.zoneL = .25 + Math.random() * .45;
          act.zoneR = act.zoneL + (act.easy ? .26 : .16);
          act.phase = 'aim';
          act.msg = (act.hit ? '好球！' : '差一点！') + '还有 ' + (3 - act.tries) + ' 次机会！';
        }
      }
    } else if (act.kind === 'music' || act.kind === 'stars' || act.kind === 'cradle') {
      if (act.phase === 'show') {
        act.t -= dt;
        if (act.t <= 0) {
          if (act.idx < act.seq.length) {
            act.flash = act.seq[act.idx];
            ADV.Audio.note(act.flash);
            act.t = .5; act.idx += 1;
          } else {
            act.flash = -1; act.phase = 'input'; act.idx = 0;
            act.msg = act.kind === 'stars' ? '轮到你！复述星星的顺序！'
              : act.kind === 'cradle' ? '轮到你！按方向键复述翻转的顺序！'
              : '该你了！用方向键复述刚才的顺序！';
          }
        } else if (act.t < .18) act.flash = -1;
      } else {
        let press = -1;
        if (p.left) press = 0; else if (p.up) press = 1;
        else if (p.down) press = 2; else if (p.right) press = 3;
        if (press >= 0) {
          ADV.Audio.note(press);
          act.flash = press;
          if (press === act.seq[act.idx]) {
            act.idx += 1;
              if (act.idx >= act.seq.length) {
                act.msg = act.kind === 'stars' ? '星座连成了！'
                  : act.kind === 'cradle' ? '花绳翻成了小降落伞！' : '完美演奏！';
                finish(true); return;
              }
            } else {
              act.msg = act.kind === 'stars' ? '啊，星星暗掉了……'
                : act.kind === 'cradle' ? '哎呀，绳子打结了……' : '啊，走音了……';
              finish(false); return;
            }
        } else act.flash = -1;
      }
    } else if (act.kind === 'broom') {
      act.t -= dt;
      if (act.t <= 0) { act.msg = '时间到！'; finish(act.got >= 3); return; }
      const SP = 520;
      if (act.stun > 0) act.stun -= dt;
      else {
        act.vx = p.left ? -SP : p.right ? SP : 0;
        act.vy = p.up ? -SP : p.down ? SP : 0;
        act.px += act.vx * dt; act.py += act.vy * dt;
      }
      act.px = Math.max(140, Math.min(W - 140, act.px));
      act.py = Math.max(170, Math.min(H - 120, act.py));
      // 金翼球游走（碰壁反弹，偶而变向；速度随捕捉进度提升）
      if (Math.random() < dt * 1.2) { act.bvx = (Math.random() - .5) * (420 + act.got * 120); act.bvy = (Math.random() - .5) * (360 + act.got * 100); }
      act.bx += act.bvx * dt; act.by += act.bvy * dt;
      if (act.bx < 150 || act.bx > W - 150) { act.bvx *= -1; act.bx = Math.max(150, Math.min(W - 150, act.bx)); }
      if (act.by < 180 || act.by > H - 130) { act.bvy *= -1; act.by = Math.max(180, Math.min(H - 130, act.by)); }
      // 游走球缓慢追踪
      const dx = act.px - act.kx, dy = act.py - act.ky, dd = Math.hypot(dx, dy) || 1;
      act.kx += dx / dd * 120 * dt; act.ky += dy / dd * 120 * dt;
      // 碰撞判定
      if (Math.hypot(act.bx - act.px, act.by - act.py) < 34) {
        act.got += 1; ADV.Audio.sfx('correct');
        act.bx = 150 + Math.random() * (W - 300); act.by = 180 + Math.random() * (H - 310);
        if (act.got >= 3) { act.msg = '抓到啦！'; finish(true); return; }
        act.msg = '抓到 ' + act.got + ' / 3 只金翼球！';
      }
      if (act.stun <= 0 && Math.hypot(act.kx - act.px, act.ky - act.py) < 30) {
        act.stun = 1.1; ADV.Audio.sfx('wrong');
        act.msg = '被游走球撞晕了！';
      }
    } else if (act.kind === 'keys') {
      act.t -= dt; act.wrong = Math.max(0, act.wrong - dt);
      if (act.t <= 0) { act.msg = '钥匙全飞走了……'; finish(false); return; }
      if (p.left || p.up) { act.sel = (act.sel + 4) % 5; ADV.Audio.sfx('cursor'); }
      if (p.right || p.down) { act.sel = (act.sel + 1) % 5; ADV.Audio.sfx('cursor'); }
      if (p.ok && act.wrong <= 0) {
        const k = act.cur.ks[act.sel];
        if (k === act.cur.target) {
          ADV.Audio.sfx('correct');
          if (act.round >= 2) { act.msg = '抓住了！'; finish(true); return; }
          act.round += 1; act.cur = act.gen();
          act.msg = '第 2 把！再听谜语！';
        } else {
          act.wrong = .5; act.t -= 5; ADV.Audio.sfx('wrong');
          act.msg = '不对！门锁纹丝不动（-5 秒）';
        }
      }
    } else if (act.kind === 'chess') {
      const d = act.data;
      const targets = KNIGHT
        .map(([mx, my], i) => ({ i, x: kx(act.pos) + mx, y: ky(act.pos) + my }))
        .filter(t => t.x >= 0 && t.x < 5 && t.y >= 0 && t.y < 5)
        .map(t => ({ ...t, cell: t.y * 5 + t.x }));
      if (p.left || p.up) { act.cursel = (act.cursel + targets.length - 1) % targets.length; ADV.Audio.sfx('cursor'); }
      if (p.right || p.down) { act.cursel = (act.cursel + 1) % targets.length; ADV.Audio.sfx('cursor'); }
      if (p.ok && targets.length) {
        const t = targets[act.cursel % targets.length];
        act.pos = t.cell; d.moves -= 1; ADV.Audio.note(d.tg.indexOf(t.cell) >= 0 ? 3 : 0);
        if (d.tg.indexOf(t.cell) >= 0 && !d.done) d.tg = d.tg.filter(c => c !== t.cell);
        if (!d.tg.length) {
          if (act.lv >= 2) { act.msg = '全部踏破！'; finish(true); return; }
          act.lv += 1; act.data = { tg: (() => { const s = new Set(); while (s.size < 5) s.add((Math.random() * 25) | 0); return [...s]; })(), moves: 16 };
          act.pos = 0; act.msg = '第 2 关：五个光格！';
        } else if (d.moves <= 0) { act.msg = '步数用尽……'; finish(false); return; }
      }
    } else if (act.kind === 'hopscotch') {
      if (act.phase === 'aim') {
        act.marker += act.dir * act.speed * dt;
        if (act.marker > 1) { act.marker = 1; act.dir = -1; }
        if (act.marker < 0) { act.marker = 0; act.dir = 1; }
        if (p.ok) {
          act.hit = act.marker >= act.zoneL && act.marker <= act.zoneR;
          act.phase = 'jump'; act.hopT = 0;
          ADV.Audio.sfx(act.hit ? 'correct' : 'wrong');
        }
      } else {
        act.hopT += dt;
        if (act.hopT > .55) {
          act.hop += 1; act.hits += act.hit ? 1 : 0; act.hist.push(act.hit);
          if (act.hop >= 8) {
            act.msg = act.hits >= 6 ? '一口气跳到了房顶！' : '踩线太多次啦……';
            finish(act.hits >= 6); return;
          }
          const z = hopZone(act.hop);
          act.zoneL = z.l; act.zoneR = z.r;
          act.phase = 'aim';
          act.msg = (act.hit ? '稳稳落进格子里！' : '沙包出线了！') + '（已中 ' + act.hits + '/6）';
        }
      }
    } else if (act.kind === 'marbles') {
      if (act.phase === 'aim') {
        if (p.left) { act.angle = Math.max(10 * Math.PI / 180, act.angle - 6 * Math.PI / 180); ADV.Audio.sfx('cursor'); }
        if (p.right) { act.angle = Math.min(80 * Math.PI / 180, act.angle + 6 * Math.PI / 180); ADV.Audio.sfx('cursor'); }
        if (p.ok) { act.phase = 'power'; act.power = 0; act.pdir = 1; }
      } else if (act.phase === 'power') {
        act.power += act.pdir * 1.05 * dt;
        if (act.power > 1) { act.power = 1; act.pdir = -1; }
        if (act.power < 0) { act.power = 0; act.pdir = 1; }
        if (p.ok) {
          act.phase = 'roll'; act.t = 0;
          act.dist = (260 + 620 * act.power) / 2;   // 摩擦衰减下的总滚程
          act.mx = 160; act.my = 380;
          ADV.Audio.sfx('cursor');
        }
      } else {
        act.t += dt;
        const prog = 1 - Math.exp(-2 * act.t);
        act.mx = 160 + Math.cos(act.angle) * act.dist * prog;
        act.my = 380 - Math.sin(act.angle) * act.dist * prog;
        if (act.t > 2.2) {
          const inHole = Math.hypot(act.mx - act.hole.x, act.my - act.hole.y) < 30;
          act.tries += 1; act.hits += inHole ? 1 : 0;
          ADV.Audio.sfx(inHole ? 'correct' : 'wrong');
          if (act.tries >= 3) {
            act.msg = act.hits >= 2 ? '叮！弹珠落进雪圈啦！' : '雪圈太远了……';
            finish(act.hits >= 2); return;
          }
          act.hole = mkHole(); act.phase = 'aim';
          act.msg = (inHole ? '进圈！' : '偏了！') + '还剩 ' + (3 - act.tries) + ' 投（已中 ' + act.hits + '）';
        }
      }
    } else if (act.kind === 'plane') {
      if (act.phase === 'ready') {
        if (p.ok) { act.phase = 'charge'; act.power = 0; act.pdir = 1; }
      } else if (act.phase === 'charge') {
        act.power += act.pdir * 1.1 * dt;
        if (act.power > 1) { act.power = 1; act.pdir = -1; }
        if (act.power < 0) { act.power = 0; act.pdir = 1; }
        if (p.ok) {
          act.phase = 'fly'; act.t = 0;
          act.px = 150; act.py = 330;
          act.vx = 320; act.vy = -(30 + 190 * act.power);
          ADV.Audio.sfx('cursor');
        }
      } else {
        const prevX = act.px;
        act.t += dt;
        act.vy += (140 + act.wind) * dt;
        act.px += act.vx * dt; act.py += act.vy * dt;
        for (const r of act.rings) {
          if (!r.done && prevX < r.x && act.px >= r.x && Math.abs(act.py - r.y) < 44) {
            r.done = true; act.passed += 1;
            ADV.Audio.sfx('correct');
            act.msg = '穿圈！已穿 ' + act.passed + ' / 2！';
          }
        }
        if (act.px > 880 || act.py > 545 || act.py < 90) {
          act.shots -= 1;
          if (act.passed >= 2) { act.msg = '纸飞机划出了漂亮的弧线！'; finish(true); return; }
          if (act.shots <= 0) { act.msg = '呼啦圈太调皮了……'; finish(false); return; }
          act.phase = 'ready';
          act.msg = '还剩 ' + act.shots + ' 架纸飞机，再穿 ' + (2 - act.passed) + ' 个圈！';
        }
      }
    } else if (act.kind === 'cards') {
      if (act.lock > 0) {
        act.lock -= dt;
        if (act.lock <= 0) act.open = [];
        return;
      }
      if (p.left && act.cur % 4 > 0) { act.cur -= 1; ADV.Audio.sfx('cursor'); }
      if (p.right && act.cur % 4 < 3) { act.cur += 1; ADV.Audio.sfx('cursor'); }
      if (p.up && act.cur >= 4) { act.cur -= 4; ADV.Audio.sfx('cursor'); }
      if (p.down && act.cur < 8) { act.cur += 4; ADV.Audio.sfx('cursor'); }
      if (p.ok && !act.matched.has(act.cur) && !act.open.includes(act.cur)) {
        act.open.push(act.cur); act.flips -= 1;
        ADV.Audio.sfx('cursor');
        if (act.open.length >= 2) {
          const [a, b] = act.open;
          if (act.grid[a] === act.grid[b]) {
            act.matched.add(a); act.matched.add(b); act.open = [];
            ADV.Audio.sfx('correct');
            if (act.matched.size >= 12) { act.msg = '全部配对完成！'; finish(true); return; }
            act.msg = '配对成功！还剩 ' + (6 - act.matched.size / 2) + ' 对';
          } else {
            act.lock = .6; ADV.Audio.sfx('wrong');
            act.msg = '不是一对……记住它们的位置！';
            if (act.flips <= 0) { act.msg = '翻牌次数用完了……'; finish(false); return; }
          }
        } else if (act.flips <= 0) {
          act.msg = '剩下的翻牌次数凑不成一对了……'; finish(false); return;
        }
      }
      if (act.flips <= 0 && act.open.length === 0 && act.matched.size < 12) {
        act.msg = '翻牌次数用完了……'; finish(false); return;
      }
    } else if (act.kind === 'snowfight') {
      act.t -= dt;
      if (act.t <= 0) { act.msg = '时间到，雪仗收场……'; finish(false); return; }
      if (p.left && act.lane > 0) { act.lane -= 1; ADV.Audio.sfx('cursor'); }
      if (p.right && act.lane < 4) { act.lane += 1; ADV.Audio.sfx('cursor'); }
      if (p.ok && act.balls.length < 2) {
        act.balls.push({ lane: act.lane, y: 450, dead: false });
        ADV.Audio.sfx('cursor');
      }
      act.spawnT -= dt;
      if (act.spawnT <= 0 && act.foes.length < 3) {
        act.foes.push({
          lane: (Math.random() * 5) | 0, y: 150 + Math.random() * 60,
          life: 2.6, ft: 0, throwAt: .9 + Math.random() * .6, threw: false
        });
        act.spawnT = 1 + Math.random() * .8;
      }
      for (const fo of act.foes) {
        fo.ft += dt; fo.life -= dt;
        if (!fo.threw && fo.ft >= fo.throwAt) {
          fo.threw = true;
          act.eballs.push({ lane: fo.lane, x: laneX(fo.lane), y: fo.y + 26, dead: false });
          ADV.Audio.sfx('wrong');
        }
      }
      act.foes = act.foes.filter(fo => fo.life > 0);
      for (const b of act.balls) {
        b.y -= 600 * dt;
        const fo = act.foes.find(f => f.lane === b.lane && Math.abs(b.y - f.y) < 26);
        if (fo) {
          b.dead = true; fo.life = 0;
          act.hits += 1; ADV.Audio.sfx('correct');
          act.msg = '正中雪人脑袋！已砸中 ' + act.hits + ' / 6';
          if (act.hits >= 6) { act.msg = '对面的雪人军团溃败啦！'; finish(true); return; }
        }
        if (b.y < 115) b.dead = true;
      }
      act.balls = act.balls.filter(b => !b.dead);
      for (const b of act.eballs) {
        b.y += 330 * dt;
        if (b.y >= 452) {
          b.dead = true;
          if (b.lane === act.lane) {
            act.hurt += 1; ADV.Audio.sfx('wrong');
            act.msg = '被雪球糊了一脸！（' + act.hurt + ' / 3）';
            if (act.hurt >= 3) { act.msg = '被糊得睁不开眼，撤退……'; finish(false); return; }
          }
        }
      }
      act.eballs = act.eballs.filter(b => !b.dead);
    } else if (act.kind === 'longjump') {
      if (act.phase === 'run') {                        // 助跑：光标在速度条上摆动
        act.marker += act.dir * act.speed * dt;
        if (act.marker > 1) { act.marker = 1; act.dir = -1; }
        if (act.marker < 0) { act.marker = 0; act.dir = 1; }
        if (p.ok) {
          act.power = act.marker;
          act.bonus = act.marker >= act.zoneL && act.marker <= act.zoneR;   // 踏板绿区 = 完美起跳
          act.dist = 1.4 + 3.0 * act.power + (act.bonus ? .5 : 0);
          act.best = Math.max(act.best, act.dist);
          act.phase = 'fly'; act.flyT = 0;
          ADV.Audio.sfx(act.bonus ? 'correct' : 'cursor');
        }
      } else {                                          // 腾空 → 落沙坑
        act.flyT += dt;
        if (act.flyT > 1.05) {
          act.tries += 1;
          if (act.tries >= 3) {
            act.msg = act.best >= 4 ? '漂亮！最远 ' + act.best.toFixed(1) + ' 米！' : '最远 ' + act.best.toFixed(1) + ' 米，没破 4 米……';
            finish(act.best >= 4); return;
          }
          act.phase = 'run'; act.marker = 0; act.dir = 1;
          act.msg = (act.bonus ? '踏板完美加分！' : '起跳一般。') + '最远 ' + act.best.toFixed(1) + ' 米，还剩 ' + (3 - act.tries) + ' 跳';
        }
      }
    } else if (act.kind === 'tug') {
      act.t += dt;
      act.pos -= (.34 + act.t * .1) * dt;               // 对手拉力随时间越来越猛
      if (act.helper) act.pos += .05 * dt;              // 好友场边帮拉
      if (p.ok) { act.pos += .07; ADV.Audio.sfx('cursor'); }
      if (act.pos >= .8) { act.msg = '红标过线！这一局是我们班的！'; finish(true); return; }
      if (act.pos <= -.8) { act.msg = '脚下一滑，被对面拔了过去……'; finish(false); return; }
    } else if (act.kind === 'relay') {
      act.ot += .038 * dt;                              // 对手队伍匀速推进
      if (act.ot >= 1) { act.msg = '隔壁三班先冲线了……'; finish(false); return; }
      act.marker += act.dir * act.speed * dt;
      if (act.marker > 1) { act.marker = 1; act.dir = -1; }
      if (act.marker < 0) { act.marker = 0; act.dir = 1; }
      if (p.ok) {
        const hit = act.marker >= act.zoneL && act.marker <= act.zoneR;
        if (hit) {
          act.good += 1; ADV.Audio.sfx('correct');
          if (act.good >= 12) { act.msg = '最后一棒冲线！全班冠军！'; finish(true); return; }
          if (act.good % 3 === 0) { act.leg += 1; act.msg = '交棒干净利落！第 ' + act.leg + ' 棒起跑！'; }
          else act.msg = '步点漂亮，又快又稳！';
          const z = relayZone(); act.zoneL = z.l; act.zoneR = z.r;
        } else {
          act.miss += 1; act.ot += .04; ADV.Audio.sfx('wrong');
          act.msg = '步点乱了，被三班拉开了一点！';
        }
      }
    } else if (act.kind === 'melon') {
      if (act.phase === 'aim') {                        // 瞄准：光标在刀条上往返，越切越快
        act.marker += act.dir * act.speed * dt;
        if (act.marker > 1) { act.marker = 1; act.dir = -1; }
        if (act.marker < 0) { act.marker = 0; act.dir = 1; }
        if (p.ok) {
          act.swings += 1;
          act.lastHit = act.marker >= act.zoneL && act.marker <= act.zoneR;   // 绿区 = 一刀两断
          if (act.lastHit) { act.hits += 1; act.speed = Math.min(1.8, act.speed + .18); ADV.Audio.sfx('dig'); }
          else ADV.Audio.sfx('wrong');
          act.chT = .5; act.phase = 'chop';             // 落刀动画
        }
      } else {                                          // chop：刀劈下 → 结算或回位
        act.chT -= dt;
        if (act.chT <= 0) {
          if (act.swings >= 5) {
            act.msg = act.hits >= 3 ? '咔嚓——西瓜应声裂成两半，红瓤黑籽！' : '刀刀劈空……瓜皮都懒得裂。';
            finish(act.hits >= 3); return;
          }
          act.phase = 'aim'; act.marker = 0; act.dir = 1;
          act.msg = (act.lastHit ? '好刀法！' : '劈偏了……') + '切中 ' + act.hits + ' 刀，还剩 ' + (5 - act.swings) + ' 刀';
        }
      }
    }
  }

  /* ---------- 绘制 ---------- */
  function drawFrame(g, title) {
    g.fillStyle = 'rgba(6,8,24,.72)'; g.fillRect(0, 0, W, H);
    const w = 740, h = 440, x = (W - w) / 2, y = (H - h) / 2;
    ADV.UI.drawWindow(g, x, y, w, h);
    text(g, title, W / 2, y + 22, 30, '#ffe9a8');
    return { x, y, w, h };
  }

  function drawKeyIcon(g, x, y, k, big) {
    const s = big ? 1.25 : 1;
    g.save(); g.translate(x, y); g.scale(s, s);
    // 翅膀
    g.fillStyle = WINGHEX[k.wing];
    g.beginPath(); g.ellipse(-14, -6, 12, 5, -.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(14, -6, 12, 5, .5, 0, Math.PI * 2); g.fill();
    // 钥匙身
    g.fillStyle = '#e8d05a';
    g.beginPath(); g.arc(0, 0, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = GEMHEX[k.gem];
    g.beginPath(); g.arc(0, 0, 4.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e8d05a'; g.fillRect(-2, 6, 4, 14);
    g.fillRect(-2, 16, 8, 3); g.fillRect(-2, 20, 6, 3);
    g.restore();
  }

  function render(g) {
    if (!act) return;
    if (act.kind === 'fish') {
      const f = drawFrame(g, '🎣 垂钓搏鱼');
      const TRACK = 320, tx = f.x + 520, ty = f.y + 76;
      // 水面
      g.fillStyle = '#1c3a66'; g.fillRect(f.x + 40, f.y + 76, 400, 320);
      g.fillStyle = 'rgba(255,255,255,.08)';
      for (let i = 0; i < 5; i++) g.fillRect(f.x + 48 + (i * 37) % 360, f.y + 100 + i * 56, 90, 3);
      text(g, act.phase === 'fight' ? '把鱼控制在网里！' : '水面波光粼粼……', f.x + 240, f.y + 84, 15, '#9ac8f0', undefined, 'normal');
      // 渔道（右侧竖条）
      g.fillStyle = '#182448'; g.fillRect(tx, ty, 74, TRACK);
      // 渔网区域
      const half = act.ZH / 2;
      const zy = ty + act.zoneC - half;
      g.fillStyle = 'rgba(90,220,140,.35)';
      g.fillRect(tx, zy, 74, act.ZH);
      g.strokeStyle = 'rgba(140,240,180,.9)'; g.lineWidth = 2;
      g.strokeRect(tx + 1, zy, 72, act.ZH);
      // 进度条
      const pbg = f.x + 620, pw = 22;
      g.fillStyle = '#22243a'; g.fillRect(pbg, ty, pw, TRACK);
      g.fillStyle = act.prog > .5 ? '#4ae86c' : '#ffd94c';
      g.fillRect(pbg, ty + TRACK * (1 - act.prog), pw, TRACK * act.prog);
      g.strokeStyle = '#d8c078'; g.lineWidth = 2; g.strokeRect(pbg, ty, pw, TRACK);
      text(g, '渔获', pbg + pw / 2, ty - 22, 14, '#cfe0ff', undefined, 'normal');
      // 鱼（橙色鲤鱼剪影，在渔道内游动）
      const fy = ty + act.fishY * TRACK;
      const wig = Math.sin(performance.now() / 90) * 5;
      g.fillStyle = act.big ? '#ff9a4a' : '#e8963a';
      g.beginPath(); g.ellipse(tx + 37, fy, 24, 11, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(tx + 58, fy);
      g.lineTo(tx + 74, fy - 8 + wig); g.lineTo(tx + 74, fy + 8 + wig); g.closePath(); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(tx + 26, fy - 3, 3, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#222'; g.beginPath(); g.arc(tx + 27, fy - 3, 1.5, 0, Math.PI * 2); g.fill();
      // 鱼线
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(f.x + 40, f.y + 40); g.lineTo(tx + 37, fy); g.stroke();
      // 阶段性元素
      if (act.phase !== 'fight') {
        // 浮漂
        const bx = f.x + 240, bob = Math.sin(performance.now() / 220) * 4;
        const by = f.y + 250 + (act.phase === 'bite' ? 10 : 0) + bob;
        g.fillStyle = '#e85a5a'; g.beginPath(); g.arc(bx, by, 10, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff'; g.fillRect(bx - 2, by - 16, 4, 12);
        g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2;
        for (let i = 1; i <= 2; i++) { g.beginPath(); g.arc(bx, by, 12 + i * 9 + (act.ripple % 1) * 8, 0, Math.PI * 2); g.stroke(); }
        if (act.phase === 'bite') {
          text(g, '！', bx, by - 66, 46, '#ff5a5a');
          text(g, '咬钩了！快提竿！', f.x + 240, f.y + 300, 18, '#ffe9a8');
        }
      }
      text(g, act.msg, f.x + f.w / 2, f.y + f.h - 40, 16, '#e8f0ff');
      text(g, act.phase === 'fight' ? '按住 Z / ● 上提 · 松手下沉 · 进度条满即成功' : '看准浮漂，按下 Z / ● 提竿', W / 2, f.y + f.h - 14, 13, '#8a94c0', undefined, 'normal');
      return;
    }
    if (act.kind === 'ball') {
      const f = drawFrame(g, '🏀 投篮挑战');
      for (let i = 0; i < 3; i++) {
        g.fillStyle = i < act.tries ? (i < act.hits ? '#4ae86c' : '#e85a5a') : '#3a3f66';
        g.beginPath(); g.arc(W / 2 - 34 + i * 34, f.y + 74, 9, 0, Math.PI * 2); g.fill();
      }
      g.drawImage(ADV.Sprites.getObject('hoop', null), W / 2 - 16, f.y + 96);
      const bt = act.phase === 'fly' ? Math.min(1, act.ballT / .7) : 0;
      const sx = W / 2, sy = f.y + 330;
      const tx = act.hit ? W / 2 + 2 : W / 2 - 120, ty = act.hit ? f.y + 148 : f.y + 240;
      const bx = sx + (tx - sx) * bt, by = sy + (ty - sy) * bt - Math.sin(bt * Math.PI) * 80;
      g.fillStyle = '#e8963a'; g.beginPath(); g.arc(bx, by, 14, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#a85a1a'; g.lineWidth = 2;
      g.beginPath(); g.arc(bx, by, 14, 0, Math.PI * 2); g.stroke();
      const bw = 560, bx0 = W / 2 - bw / 2, by0 = f.y + 356;
      g.fillStyle = '#22243a'; g.fillRect(bx0, by0, bw, 26);
      g.fillStyle = 'rgba(80,220,120,.85)';
      g.fillRect(bx0 + act.zoneL * bw, by0, (act.zoneR - act.zoneL) * bw, 26);
      g.fillStyle = '#ffe9a8'; g.fillRect(bx0 + act.marker * bw - 3, by0 - 5, 6, 36);
      text(g, act.msg, W / 2, f.y + f.h - 50, 20, '#fff');
      text(g, 'X / Esc 退出挑战', W / 2, f.y + f.h - 24, 15, '#aab4d4');
    } else if (act.kind === 'music' || act.kind === 'stars' || act.kind === 'cradle') {
      const star = act.kind === 'stars';
      const crad = act.kind === 'cradle';
      const f = drawFrame(g, crad ? '🧶 翻花绳' : star ? '🔭 星座观测' : '🎹 琴键记忆');
      text(g, act.phase === 'show' ? '看好了……' : '轮到你了！', W / 2, f.y + 70, 19, '#cfe0ff');
      const s = 116, gap = 18, row = 4 * s + 3 * gap, x0 = W / 2 - row / 2, y0 = f.y + 120;
      const glyph = crad ? CRAGLYPH : star ? STARGLYPH : PADGLYPH;
      for (let i = 0; i < 4; i++) {
        const px = x0 + i * (s + gap);
        g.fillStyle = act.flash === i ? '#ffffff' : PADCOL[i];
        if (star) {
          g.beginPath(); g.arc(px + s / 2, y0 + s / 2, s / 2 - 6, 0, Math.PI * 2); g.fill();
          g.strokeStyle = 'rgba(216,192,120,.7)'; g.lineWidth = 3;
          g.beginPath(); g.arc(px + s / 2, y0 + s / 2, s / 2 - 6, 0, Math.PI * 2); g.stroke();
        } else g.fillRect(px, y0, s, s);
        if (!star) {
          g.strokeStyle = '#d8c078'; g.lineWidth = 3; g.strokeRect(px, y0, s, s);
        }
        text(g, glyph[i], px + s / 2, y0 + s / 2 - 16, 40, act.flash === i ? '#2a2a3a' : 'rgba(255,255,255,.9)');
      }
      if (crad) text(g, '← 翻绳 · ↑ 挑线 · ↓ 勾线 · → 转腕', W / 2, y0 + s + 16, 15, '#cfe0ff');
      text(g, act.msg, W / 2, f.y + f.h - 50, 20, '#fff');
      text(g, 'X / Esc 退出', W / 2, f.y + f.h - 24, 15, '#aab4d4');
    } else if (act.kind === 'broom') {
      const f = drawFrame(g, '🧹 扫帚飞行课');
      // 计时条
      const bw = 560, bx0 = W / 2 - bw / 2;
      g.fillStyle = '#22243a'; g.fillRect(bx0, f.y + 66, bw, 14);
      g.fillStyle = act.t > 10 ? '#4ae86c' : '#e85a5a';
      g.fillRect(bx0, f.y + 66, bw * Math.max(0, act.t) / 40, 14);
      text(g, act.got + ' / 3', W / 2 + bw / 2 + 46, f.y + 62, 22, '#ffd94c');
      // 金翼球（金色 + 小翅膀）
      drawKeyIcon(g, act.bx, act.by, { wing: 1, gem: 1 });
      g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(act.bx, act.by, 9, 0, Math.PI * 2); g.fill();
      // 游走球（黑色铁球）
      g.fillStyle = '#1a1a22'; g.beginPath(); g.arc(act.kx, act.ky, 14, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#44445a'; g.lineWidth = 2;
      g.beginPath(); g.arc(act.kx, act.ky, 14, 0, Math.PI * 2); g.stroke();
      // 扫帚 + 骑手
      g.save(); g.translate(act.px, act.py);
      if (act.stun > 0) g.rotate(Math.sin(act.stun * 30) * .2);
      g.fillStyle = '#a06c3a'; g.fillRect(-24, 4, 48, 6);
      g.fillStyle = '#d9b96a'; g.fillRect(-34, 6, 14, 12);
      const sheet = ADV.Sprites.makeCharSheet(ADV.Sprites.PALETTES[ADV.Game.hero]);
      g.drawImage(sheet, 0, 0, 32, 44, -16, -34, 32, 44);
      g.restore();
      text(g, act.msg, W / 2, f.y + f.h - 50, 20, '#fff');
      text(g, 'X / Esc 退出', W / 2, f.y + f.h - 24, 15, '#aab4d4');
    } else if (act.kind === 'keys') {
      const f = drawFrame(g, '🗝 飞钥匙之室（第 ' + act.round + '/2 轮）');
      const t = act.cur.target;
      text(g, `谜语：「${WINGCOL[t.wing]}的翅膀，${GEMCOL[t.gem]}的眼」`, W / 2, f.y + 66, 22, '#ffe9a8');
      text(g, '← → 选择，Z 抓住！', W / 2, f.y + 96, 15, '#aab4d4');
      const n = 5, gap = 128, x0 = W / 2 - (n - 1) * gap / 2, y0 = f.y + 210;
      const fl = Math.sin(performance.now() / 300) * 10;
      for (let i = 0; i < n; i++) {
        const k = act.cur.ks[i];
        drawKeyIcon(g, x0 + i * gap, y0 + fl * (i % 2 ? 1 : -1), k, i === act.sel);
        if (i === act.sel) {
          g.strokeStyle = '#ffe9a8'; g.lineWidth = 3;
          g.strokeRect(x0 + i * gap - 44, y0 + fl * (i % 2 ? 1 : -1) - 44, 88, 88);
        }
      }
      const bw = 560, bx0 = W / 2 - bw / 2;
      g.fillStyle = '#22243a'; g.fillRect(bx0, f.y + 320, bw, 14);
      g.fillStyle = act.t > 10 ? '#4ae86c' : '#e85a5a';
      g.fillRect(bx0, f.y + 320, bw * Math.max(0, act.t) / 30, 14);
      text(g, act.msg, W / 2, f.y + f.h - 50, 20, '#fff');
      text(g, 'X / Esc 退出', W / 2, f.y + f.h - 24, 15, '#aab4d4');
    } else if (act.kind === 'chess') {
      const f = drawFrame(g, '♞ 骑士之旅（第 ' + act.lv + '/2 关）');
      const s = 84, gap = 10, x0 = W / 2 - (5 * s + 4 * gap) / 2, y0 = f.y + 90;
      const d = act.data;
      const targets = KNIGHT
        .map(([mx, my]) => ({ x: kx(act.pos) + mx, y: ky(act.pos) + my }))
        .filter(t => t.x >= 0 && t.x < 5 && t.y >= 0 && t.y < 5)
        .map(t => t.y * 5 + t.x);
      for (let cy = 0; cy < 5; cy++) for (let cx = 0; cx < 5; cx++) {
        const cell = cy * 5 + cx, px = x0 + cx * (s + gap), py = y0 + cy * (s + gap);
        g.fillStyle = (cx + cy) % 2 ? '#3a3a5e' : '#2e2e50';
        g.fillRect(px, py, s, s);
        if (d.tg.includes(cell)) { g.fillStyle = 'rgba(255,217,76,.4)'; g.fillRect(px, py, s, s); }
        if (targets.includes(cell)) { g.strokeStyle = 'rgba(138,208,255,.9)'; g.lineWidth = 3; g.strokeRect(px + 3, py + 3, s - 6, s - 6); }
        if (cell === act.pos) { g.fillStyle = '#ffe9a8'; g.font = FONT(52); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♞', px + s / 2, py + s / 2 + 4); }
      }
      text(g, '剩余步数 ' + d.moves + ' · 剩余光格 ' + d.tg.length, W / 2, f.y + 40, 17, '#cfe0ff');
      text(g, act.msg, W / 2, f.y + f.h - 50, 20, '#fff');
      text(g, '← → 选落点，Z 起跳 · X 退出', W / 2, f.y + f.h - 24, 15, '#aab4d4');
    } else if (act.kind === 'hopscotch') {
      const f = drawFrame(g, '🦶 跳房子');
      text(g, '8 跳中 6 · 已中 ' + act.hits, W / 2, f.y + 56, 17, '#cfe0ff');
      const s = 74, gap = 12, x0 = W / 2 - (4 * s + 3 * gap) / 2, y0 = f.y + 96;
      for (let i = 0; i < 8; i++) {
        const px = x0 + (i % 4) * (s + gap), py = y0 + ((i / 4) | 0) * (s + gap);
        g.fillStyle = ((i % 4) + ((i / 4) | 0)) % 2 ? '#3a4266' : '#2e3454';
        g.fillRect(px, py, s, s);
        if (i < act.hist.length) {
          g.fillStyle = act.hist[i] ? 'rgba(74,232,108,.45)' : 'rgba(232,90,90,.4)';
          g.fillRect(px, py, s, s);
        }
        g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3;
        g.strokeRect(px, py, s, s);
        text(g, String(i + 1), px + s / 2, py + 22, 26, 'rgba(255,255,255,.85)');
        if (i === act.hop && act.phase === 'aim') {
          g.strokeStyle = '#ffe9a8'; g.lineWidth = 3;
          g.strokeRect(px + 3, py + 3, s - 6, s - 6);
        }
      }
      // 沙包条
      const bw = 560, bx0 = W / 2 - bw / 2, by0 = f.y + 340;
      g.fillStyle = '#22243a'; g.fillRect(bx0, by0, bw, 26);
      g.fillStyle = 'rgba(80,220,120,.85)';
      g.fillRect(bx0 + act.zoneL * bw, by0, (act.zoneR - act.zoneL) * bw, 26);
      g.fillStyle = '#ffd94c'; g.fillRect(bx0 + act.marker * bw - 3, by0 - 5, 6, 36);
      text(g, act.msg, W / 2, f.y + f.h - 50, 20, '#fff');
      text(g, 'Z 掷沙包 · X 退出', W / 2, f.y + f.h - 24, 15, '#aab4d4');
    } else if (act.kind === 'marbles') {
      const f = drawFrame(g, '⚪ 弹珠进圈（' + act.hits + ' / ' + act.tries + '）');
      // 沙地
      g.fillStyle = '#d9c49a'; g.fillRect(f.x + 16, f.y + 44, f.w - 32, f.h - 118);
      g.strokeStyle = '#b09a6a'; g.lineWidth = 3;
      g.strokeRect(f.x + 16, f.y + 44, f.w - 32, f.h - 118);
      // 雪圈
      g.fillStyle = 'rgba(255,255,255,.3)';
      g.beginPath(); g.arc(act.hole.x, act.hole.y, 24, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 5;
      g.beginPath(); g.arc(act.hole.x, act.hole.y, 24, 0, Math.PI * 2); g.stroke();
      // 瞄准虚线（aim 阶段）
      if (act.phase === 'aim') {
        g.fillStyle = 'rgba(255,255,255,.55)';
        for (let i = 1; i <= 7; i++)
          g.fillRect(160 + Math.cos(act.angle) * i * 36 - 2, 380 - Math.sin(act.angle) * i * 36 - 2, 4, 4);
      }
      // 弹珠
      const mx = act.phase === 'roll' ? act.mx : 160, my = act.phase === 'roll' ? act.my : 380;
      g.fillStyle = '#9adcf0'; g.beginPath(); g.arc(mx, my, 10, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#5aa8c8'; g.lineWidth = 2;
      g.beginPath(); g.arc(mx, my, 10, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(mx - 3, my - 3, 3, 0, Math.PI * 2); g.fill();
      // 力度条
      if (act.phase === 'power') {
        const bw = 300, bx0 = W / 2 - bw / 2, by0 = f.y + f.h - 96;
        g.fillStyle = '#22243a'; g.fillRect(bx0, by0, bw, 22);
        g.fillStyle = '#ffd94c'; g.fillRect(bx0, by0, bw * act.power, 22);
        text(g, '再按 Z 出手！', W / 2, by0 + 30, 16, '#ffe9a8');
      }
      // 尝试点
      for (let i = 0; i < 3; i++) {
        g.fillStyle = i < act.tries ? (i < act.hits ? '#4ae86c' : '#e85a5a') : '#3a3f66';
        g.beginPath(); g.arc(W / 2 - 28 + i * 28, f.y + 64, 9, 0, Math.PI * 2); g.fill();
      }
      text(g, act.msg, W / 2, f.y + f.h - 50, 20, '#fff');
      text(g, '← → 调角度 · Z 蓄力 · X 退出', W / 2, f.y + f.h - 24, 15, '#aab4d4');
    } else if (act.kind === 'plane') {
      const f = drawFrame(g, '🛩 纸飞机穿圈（剩 ' + act.shots + ' 架）');
      // 天空与地面
      g.fillStyle = '#a8cdf0'; g.fillRect(f.x + 14, f.y + 50, f.w - 28, f.h - 118);
      g.fillStyle = '#7aa860'; g.fillRect(f.x + 14, f.y + f.h - 68, f.w - 28, 18);
      // 云朵
      g.fillStyle = 'rgba(255,255,255,.75)';
      [[260, 190, 42], [640, 168, 34], [770, 268, 28]].forEach(([cx, cy, r]) => {
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      });
      // 呼啦圈
      for (const r of act.rings) {
        g.strokeStyle = r.done ? '#4ae86c' : '#e85a5a'; g.lineWidth = 7;
        g.beginPath(); g.ellipse(r.x, r.y, 14, 46, 0, 0, Math.PI * 2); g.stroke();
      }
      // 风向
      const wtxt = act.wind > 8 ? '↓ 下沉气流' : act.wind < -8 ? '↑ 托举气流' : '— 平稳';
      text(g, '风：' + wtxt + '（' + Math.abs(Math.round(act.wind)) + '）', W / 2, f.y + 56, 16, '#3a5a7a');
      // 发射台与纸飞机
      g.fillStyle = '#a06c3a'; g.fillRect(136, 322, 30, 12);
      const flying = act.phase === 'fly';
      const ppx = flying ? act.px : 150, ppy = flying ? act.py : 316;
      g.save(); g.translate(ppx, ppy);
      if (flying) g.rotate(Math.atan2(act.vy, act.vx) * .5);
      g.fillStyle = '#f5f5f5';
      g.beginPath(); g.moveTo(22, 0); g.lineTo(-16, -10); g.lineTo(-8, 0); g.lineTo(-16, 10); g.closePath(); g.fill();
      g.strokeStyle = '#b0b0c0'; g.lineWidth = 2; g.stroke();
      g.restore();
      // 蓄力条 / 提示
      if (act.phase === 'charge') {
        const bw = 300, bx0 = W / 2 - bw / 2, by0 = f.y + f.h - 92;
        g.fillStyle = '#22243a'; g.fillRect(bx0, by0, bw, 22);
        g.fillStyle = '#ffd94c'; g.fillRect(bx0, by0, bw * act.power, 22);
        text(g, '再按 Z 放手！', W / 2, by0 + 28, 16, '#ffe9a8');
      } else if (act.phase === 'ready') {
        text(g, '按 Z 开始蓄力', W / 2, f.y + f.h - 84, 17, '#ffe9a8');
      }
      text(g, act.msg, W / 2, f.y + f.h - 50, 20, '#fff');
      text(g, '已穿 ' + act.passed + ' / 2 · X 退出', W / 2, f.y + f.h - 24, 15, '#aab4d4');
    } else if (act.kind === 'cards') {
      const f = drawFrame(g, '🎴 翻卡配对（剩 ' + act.flips + ' 翻）');
      text(g, '已配对 ' + (act.matched.size / 2) + ' / 6', W / 2, f.y + 48, 17, '#cfe0ff');
      const cw = 130, ch = 84, gx = 44, gy = 18, x0 = f.x + gx, y0 = f.y + 76;
      for (let i = 0; i < 12; i++) {
        const px = x0 + (i % 4) * (cw + gx), py = y0 + ((i / 4) | 0) * (ch + gy);
        const isOpen = act.open.includes(i), isM = act.matched.has(i);
        g.fillStyle = isM ? 'rgba(74,232,108,.25)' : isOpen ? '#f0e6cc' : '#3a4a8a';
        g.fillRect(px, py, cw, ch);
        g.strokeStyle = isM ? '#4ae86c' : isOpen ? '#c8b088' : '#2a3a7a'; g.lineWidth = 3;
        g.strokeRect(px, py, cw, ch);
        if (isOpen || isM) text(g, CARDGLYPH[act.grid[i]], px + cw / 2, py + 16, 38, CARDHEX[act.grid[i]]);
        else text(g, '🎴', px + cw / 2, py + 22, 30, 'rgba(255,255,255,.5)');
        if (i === act.cur) {
          g.strokeStyle = '#ffe9a8'; g.lineWidth = 4;
          g.strokeRect(px - 2, py - 2, cw + 4, ch + 4);
        }
      }
      text(g, act.msg, W / 2, f.y + f.h - 50, 20, '#fff');
      text(g, '方向键移动 · Z 翻牌 · X 退出', W / 2, f.y + f.h - 24, 15, '#aab4d4');
    } else if (act.kind === 'snowfight') {
      const f = drawFrame(g, '⛄ 打雪仗（' + act.hits + ' / 6）');
      // 雪原
      g.fillStyle = '#e6eef8'; g.fillRect(f.x + 12, f.y + 50, f.w - 24, f.h - 116);
      // 敌方雪堆
      for (let l = 0; l < 5; l++) {
        g.fillStyle = '#cdd9ea';
        g.beginPath(); g.arc(laneX(l), 236, 42, Math.PI, 0); g.fill();
      }
      // 敌方雪人（探出头）
      for (const fo of act.foes) {
        const rise = Math.min(1, fo.ft / .25);
        const fy = fo.y + (1 - rise) * 26;
        g.fillStyle = '#ffffff';
        g.beginPath(); g.arc(laneX(fo.lane), fy, 17, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#b8c8dd'; g.lineWidth = 2;
        g.beginPath(); g.arc(laneX(fo.lane), fy, 17, 0, Math.PI * 2); g.stroke();
        g.fillStyle = '#222';
        g.fillRect(laneX(fo.lane) - 6, fy - 4, 3, 4); g.fillRect(laneX(fo.lane) + 3, fy - 4, 3, 4);
        g.fillStyle = '#e8963a'; g.fillRect(laneX(fo.lane) - 2, fy + 1, 4, 3);
      }
      // 我方掩体
      for (let l = 0; l < 5; l++) {
        g.fillStyle = '#dfe9f5';
        g.beginPath(); g.arc(laneX(l), 468, 38, Math.PI, 0); g.fill();
      }
      // 玩家
      const sheet = ADV.Sprites.makeCharSheet(ADV.Sprites.PALETTES[ADV.Game.hero]);
      g.drawImage(sheet, 0, 0, 32, 44, laneX(act.lane) - 16, 414, 32, 44);
      // 雪球
      for (const b of act.balls) {
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(laneX(b.lane), b.y, 8, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#a8c0dd'; g.lineWidth = 2;
        g.beginPath(); g.arc(laneX(b.lane), b.y, 8, 0, Math.PI * 2); g.stroke();
      }
      for (const b of act.eballs) {
        g.fillStyle = '#cfe0f5'; g.beginPath(); g.arc(b.x, b.y, 9, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#8ab0e0'; g.lineWidth = 2;
        g.beginPath(); g.arc(b.x, b.y, 9, 0, Math.PI * 2); g.stroke();
      }
      // 计时与被糊次数
      const bw = 300, bx0 = W / 2 - bw / 2, by0 = f.y + 56;
      g.fillStyle = '#22243a'; g.fillRect(bx0, by0, bw, 12);
      g.fillStyle = act.t > 10 ? '#4ae86c' : '#e85a5a';
      g.fillRect(bx0, by0, bw * Math.max(0, act.t) / 30, 12);
      text(g, '被糊 ' + act.hurt + ' / 3', W / 2, f.y + 74, 16, '#5a4a6a');
      text(g, act.msg, W / 2, f.y + f.h - 50, 20, '#fff');
      text(g, '← → 换道 · Z 丢雪球 · X 退出', W / 2, f.y + f.h - 24, 15, '#aab4d4');
    } else if (act.kind === 'longjump') {
      const f = drawFrame(g, '🦵 沙坑跳远（' + act.tries + '/3 · 最远 ' + act.best.toFixed(1) + 'm）');
      // 草地与沙坑（刻度 1~5 米，4 米线即及格线）
      const gx = f.x + 60, gw = f.w - 120, gy = f.y + 300;
      g.fillStyle = '#7aa860'; g.fillRect(f.x + 14, f.y + 50, f.w - 28, gy - f.y - 34);
      g.fillStyle = '#e8d5a8'; g.fillRect(gx, gy, gw, 64);
      g.strokeStyle = '#c8b078'; g.lineWidth = 3; g.strokeRect(gx, gy, gw, 64);
      for (let m = 1; m <= 5; m++) {
        const mx = gx + m / 5.5 * gw;
        g.fillStyle = m >= 4 ? '#4ae86c' : 'rgba(0,0,0,.22)';
        g.fillRect(mx, gy, 3, 64);
        text(g, m + 'm', mx + 2, gy + 66, 13, m >= 4 ? '#2a7a3a' : '#8a7a5a');
      }
      g.fillStyle = '#d8d8e8'; g.fillRect(gx - 16, gy, 12, 64);       // 起跳板
      // 最远成绩小红旗
      if (act.best > 0) {
        const bx = gx + Math.min(act.best, 5.3) / 5.5 * gw;
        g.fillStyle = '#e85a5a'; g.fillRect(bx - 1, gy - 26, 2, 26);
        g.beginPath(); g.moveTo(bx + 1, gy - 26); g.lineTo(bx + 17, gy - 21); g.lineTo(bx + 1, gy - 16); g.closePath(); g.fill();
      }
      // 运动员：助跑小碎步 / 腾空抛物线
      const sheet = ADV.Sprites.makeCharSheet(ADV.Sprites.PALETTES[ADV.Game.hero]);
      const landX = gx + Math.min(act.dist || 0, 5.3) / 5.5 * gw;
      let cx, cy;
      if (act.phase === 'run') { cx = gx - 70 + act.marker * 46; cy = gy + 44; }
      else {
        const pr = Math.min(1, act.flyT / .9);
        cx = gx - 40 + (landX - gx + 40) * pr;
        cy = gy + 44 - Math.sin(pr * Math.PI) * (36 + 70 * act.power);
      }
      g.drawImage(sheet, 32, 88, 32, 44, cx - 16, cy - 34, 32, 44);   // 右向奔跑帧
      // 助跑速度条 / 成绩
      if (act.phase === 'run') {
        const bw = 560, bx0 = W / 2 - bw / 2, by0 = f.y + f.h - 100;
        g.fillStyle = '#22243a'; g.fillRect(bx0, by0, bw, 26);
        g.fillStyle = 'rgba(80,220,120,.85)';
        g.fillRect(bx0 + act.zoneL * bw, by0, (act.zoneR - act.zoneL) * bw, 26);
        g.fillStyle = '#ffd94c'; g.fillRect(bx0 + act.marker * bw - 3, by0 - 5, 6, 36);
      } else {
        text(g, act.flyT > .9 ? '落地：' + act.dist.toFixed(1) + ' 米！' + (act.bonus ? '（踏板完美 +0.5）' : '') : '腾空中……',
          W / 2, f.y + f.h - 100, 24, '#ffe9a8');
      }
      text(g, act.msg, W / 2, f.y + f.h - 50, 20, '#fff');
      text(g, 'Z 起跳 · 破 4 米过关 · X 退出', W / 2, f.y + f.h - 24, 15, '#aab4d4');
    } else if (act.kind === 'melon') {
      const f = drawFrame(g, '🍉 西瓜割（第 ' + Math.min(act.swings + (act.phase === 'chop' ? 0 : 1), 5) + '/5 刀 · 切中 ' + act.hits + '）');
      // 夏日后院：草地 + 木台 + 滚圆大西瓜
      g.fillStyle = '#7aa860'; g.fillRect(f.x + 14, f.y + 50, f.w - 28, 210);
      g.fillStyle = '#c8a06a'; g.fillRect(f.x + 60, f.y + 218, f.w - 120, 40);
      g.fillStyle = '#b8905a';
      for (let i = 0; i < 3; i++) g.fillRect(f.x + 60, f.y + 226 + i * 10, f.w - 120, 2);
      const mx = f.x + f.w / 2, my = f.y + 214, mr = 64;
      g.fillStyle = '#2e8a3e'; g.beginPath(); g.ellipse(mx, my, mr, mr * .8, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#1d6630'; g.lineWidth = 5;
      for (let i = -2; i <= 2; i++) {                     // 墨绿条纹
        g.beginPath(); g.ellipse(mx + i * 22, my, 11, mr * .78, 0, 0, Math.PI * 2); g.stroke();
      }
      if (act.swings >= 5 && act.hits >= 3) {             // 胜利：瓜缝里露出红瓤黑籽
        g.fillStyle = '#e8506a'; g.fillRect(mx - mr + 8, my - 5, mr * 2 - 16, 12);
        g.fillStyle = '#301820'; g.fillRect(mx - 34, my - 3, 4, 4); g.fillRect(mx + 20, my - 4, 4, 4); g.fillRect(mx - 4, my - 2, 4, 4);
      }
      // 木刀：瞄准时随光标左右悬停，落刀时劈下
      const bw = 560, bx0 = W / 2 - bw / 2, by0 = f.y + f.h - 104;
      const knifeX = bx0 + act.marker * bw;
      const knifeY = act.phase === 'chop' ? my - 40 : my - 130;
      g.save(); g.translate(knifeX, knifeY); g.rotate(act.phase === 'chop' ? .55 : -.35);
      g.fillStyle = '#d8d8e0'; g.fillRect(-4, -52, 8, 62);
      g.fillStyle = '#8a6a42'; g.fillRect(-5, 10, 10, 30);
      g.restore();
      // 瞄准条（红区 = 断面，切中给一声脆响）
      if (act.phase === 'aim') {
        g.fillStyle = '#22243a'; g.fillRect(bx0, by0, bw, 26);
        g.fillStyle = 'rgba(240,90,110,.85)'; g.fillRect(bx0 + act.zoneL * bw, by0, (act.zoneR - act.zoneL) * bw, 26);
        g.fillStyle = '#ffd94c'; g.fillRect(bx0 + act.marker * bw - 3, by0 - 5, 6, 36);
      }
      text(g, act.msg, W / 2, f.y + f.h - 50, 20, '#fff');
      text(g, 'Z 落刀 · 切中 3 刀开瓜 · X 退出', W / 2, f.y + f.h - 24, 15, '#aab4d4');
    } else if (act.kind === 'tug') {
      const f = drawFrame(g, act.helper ? '🪢 拔河大战（陆飞场边助阵！）' : '🪢 拔河大战');
      // 泥地赛场
      g.fillStyle = '#b8a878'; g.fillRect(f.x + 14, f.y + 50, f.w - 28, f.h - 118);
      g.fillStyle = '#a89868';
      for (let i = 0; i < 14; i++) g.fillRect(f.x + 30 + i * 50, f.y + 300 + (i % 3) * 6, 22, 4);
      const cy = f.y + 216, cx0 = W / 2;
      // 中线（白）与胜负线（红）
      g.strokeStyle = '#ffffff'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(cx0, f.y + 92); g.lineTo(cx0, f.y + 320); g.stroke();
      g.strokeStyle = '#e85a5a'; g.lineWidth = 3;
      [cx0 - .8 * 260, cx0 + .8 * 260].forEach(x => {
        g.beginPath(); g.moveTo(x, f.y + 92); g.lineTo(x, f.y + 320); g.stroke();
      });
      // 粗麻绳 + 中心红标
      const wig = Math.sin(act.t * 14) * 2;
      g.fillStyle = '#a06c3a'; g.fillRect(cx0 - 300, cy - 5 + wig, 600, 10);
      g.fillStyle = '#8a5a2a'; g.fillRect(cx0 - 300, cy + 1 + wig, 600, 4);
      const mx = cx0 + act.pos * 260;
      g.fillStyle = '#e85a5a'; g.fillRect(mx - 4, cy - 13, 8, 26);
      // 我方（左，面朝右）与对手（右，面朝左），整体随 pos 平移
      const heroPal = ADV.Sprites.PALETTES[(ADV.Game && ADV.Game.hero)] || ADV.Sprites.PALETTES.hero_boy;
      const others = [ADV.Sprites.PALETTES.xiaoming, ADV.Sprites.PALETTES.xiaohong, ADV.Sprites.PALETTES.xiaopang];
      const foes = [ADV.Sprites.PALETTES.studentB, ADV.Sprites.PALETTES.studentC, ADV.Sprites.PALETTES.wuyun];
      const leftEnd = cx0 - 268 + act.pos * 260, rightEnd = cx0 + 268 + act.pos * 260;
      const lean = Math.min(8, 2 + act.t);
      g.save(); g.translate(0, 0);
      [heroPal, ...others].forEach((pal, i) => {
        const s = ADV.Sprites.makeCharSheet(pal);
        g.save(); g.translate(leftEnd - 26 - i * 34, cy + 8 + (i % 2) * 4); g.rotate(.16 + lean * .004);
        g.drawImage(s, 32, 88, 32, 44, -16, -34, 32, 44); g.restore();
      });
      if (act.helper) {                                 // 好友陆飞在队尾压阵
        const s = ADV.Sprites.makeCharSheet(ADV.Sprites.PALETTES.lufei);
        g.save(); g.translate(leftEnd - 26 - 3 * 34 - 6, cy + 10); g.rotate(.2);
        g.drawImage(s, 32, 88, 32, 44, -16, -34, 32, 44); g.restore();
      }
      foes.forEach((pal, i) => {
        const s = ADV.Sprites.makeCharSheet(pal);
        g.save(); g.translate(rightEnd + 26 + i * 34, cy + 8 + (i % 2) * 4); g.rotate(-.16 - lean * .004);
        g.drawImage(s, 0, 44, 32, 44, -16, -34, 32, 44); g.restore();
      });
      g.restore();
      // 力量拉锯条（-1 我方败 … +1 我方胜）
      const bw = 560, bx0 = W / 2 - bw / 2, by0 = f.y + f.h - 96;
      g.fillStyle = '#22243a'; g.fillRect(bx0, by0, bw, 24);
      g.fillStyle = 'rgba(80,220,120,.8)'; g.fillRect(bx0, by0, bw / 2, 24);
      g.fillStyle = 'rgba(232,90,90,.8)'; g.fillRect(bx0 + bw / 2, by0, bw / 2, 24);
      g.fillStyle = '#ffffff'; g.fillRect(bx0 + bw / 2 - 1, by0 - 4, 2, 32);
      g.fillStyle = '#ffd94c'; g.fillRect(bx0 + (act.pos + 1) / 2 * bw - 3, by0 - 6, 6, 36);
      text(g, act.msg, W / 2, f.y + f.h - 50, 20, '#fff');
      text(g, '连按 Z 拔河 · X 退出', W / 2, f.y + f.h - 24, 15, '#aab4d4');
    } else if (act.kind === 'relay') {
      const f = drawFrame(g, '🏃 班级接力（第 ' + act.leg + '/4 棒）');
      // 双赛道：我班 vs 三班
      const rw = f.w - 150, rx = f.x + 88, rowY = [f.y + 84, f.y + 140];
      const labels = ['我班', '三班'], cols = ['#ff8a6a', '#7aa8ff'];
      const progs = [act.good / 12, Math.min(1, act.ot)];
      const hero = ADV.Sprites.makeCharSheet(ADV.Sprites.PALETTES[ADV.Game.hero]);
      for (let i = 0; i < 2; i++) {
        g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(rx, rowY[i], rw, 38);
        g.globalAlpha = .45; g.fillStyle = cols[i]; g.fillRect(rx, rowY[i], rw * progs[i], 38); g.globalAlpha = 1;
        g.strokeStyle = cols[i]; g.lineWidth = 2; g.strokeRect(rx, rowY[i], rw, 38);
        text(g, labels[i], rx - 44, rowY[i] + 8, 17, cols[i]);
        const s = i === 0 ? hero : ADV.Sprites.makeCharSheet(ADV.Sprites.PALETTES.studentB);
        g.drawImage(s, 32, 88, 32, 44, rx + rw * progs[i] - 16, rowY[i] - 14, 32, 44);
      }
      // 终点线（黑白格）
      for (let j = 0; j < 5; j++) for (let k = 0; k < 2; k++) {
        g.fillStyle = (j + k) % 2 ? '#ffffff' : '#2a2a3a';
        g.fillRect(rx + rw - 6 + k * 6, rowY[0] + j * 16 - 8, 6, 16);
      }
      // 节奏条（绿区 = 步点）
      const bw = 560, bx0 = W / 2 - bw / 2, by0 = f.y + 232;
      g.fillStyle = '#22243a'; g.fillRect(bx0, by0, bw, 26);
      g.fillStyle = 'rgba(80,220,120,.85)';
      g.fillRect(bx0 + act.zoneL * bw, by0, (act.zoneR - act.zoneL) * bw, 26);
      g.fillStyle = '#ffd94c'; g.fillRect(bx0 + act.marker * bw - 3, by0 - 5, 6, 36);
      // 本棒步点点数（3 步一棒）
      const done = act.good === 0 ? 0 : ((act.good - 1) % 3) + 1;
      for (let i = 0; i < 3; i++) {
        g.fillStyle = i < done ? '#4ae86c' : '#3a3f66';
        g.beginPath(); g.arc(W / 2 - 30 + i * 30, by0 + 56, 9, 0, Math.PI * 2); g.fill();
      }
      text(g, act.msg, W / 2, f.y + f.h - 50, 20, '#fff');
      text(g, '绿区按 Z 迈步 · 12 步冲线 · X 退出', W / 2, f.y + f.h - 24, 15, '#aab4d4');
    }
  }

  return {
    start, update, render,
    get active() { return !!act; },
    get dbg() { return act; }      // 供冒烟测试读取内部状态（脚本化通关）
  };
})();
