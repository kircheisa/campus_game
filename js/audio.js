/* =========================================================
 * audio.js —— WebAudio 程序化芯片音乐
 * 16 首曲目：校园四季变奏 / 小镇 / 家 / 夜 / 考试 / 战斗×2 /
 * 乌云帮 / 感化 / 时光回廊 / 毕业礼 / 室内 / 秘境
 * 剧情节点直接 ADV.Audio.playBgm('battle') 即可切换
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.Audio = (function () {
  let ctx = null, master = null, bgmBus = null;
  let volMode = 0;               // 音量三档：0 全开 / 1 仅音效 / 2 静音（M 键循环）
  let bgmName = null, bgmTimer = null, step = 0, nextT = 0;

  // 每步为 8 分音符，数字为 MIDI 音高，0 为休止
  const BGM = {
    campusSpring: { bpm: 132, leadType: 'square',
      lead: [72, 0, 76, 79, 76, 0, 72, 0, 74, 77, 74, 71, 72, 0, 0, 0,
             72, 0, 76, 79, 81, 0, 79, 76, 77, 74, 71, 74, 72, 0, 0, 0],
      bass:  [48, 55, 48, 55, 45, 52, 45, 52, 43, 50, 43, 50, 48, 55, 48, 55,
              48, 55, 48, 55, 45, 52, 45, 52, 41, 48, 41, 48, 43, 47, 48, 0] },
    campusSummer: { bpm: 144, leadType: 'square',
      lead: [74, 0, 78, 81, 78, 0, 74, 0, 76, 79, 76, 73, 74, 0, 0, 0,
             79, 0, 81, 83, 84, 0, 83, 81, 79, 76, 74, 76, 78, 0, 0, 0],
      bass:  [50, 57, 50, 57, 47, 54, 47, 54, 45, 52, 45, 52, 50, 57, 50, 57,
              50, 57, 50, 57, 47, 54, 47, 54, 43, 50, 43, 50, 45, 49, 50, 0] },
    campusAutumn: { bpm: 108, leadType: 'triangle',
      lead: [69, 0, 72, 74, 76, 0, 74, 72, 69, 0, 67, 0, 69, 0, 0, 0,
             64, 0, 67, 69, 71, 0, 69, 67, 64, 0, 62, 0, 64, 0, 0, 0],
      bass:  [45, 0, 52, 0, 41, 0, 48, 0, 45, 0, 40, 0, 45, 0, 52, 0,
              40, 0, 47, 0, 43, 0, 50, 0, 45, 0, 38, 0, 40, 0, 45, 0] },
    campusWinter: { bpm: 92, leadType: 'triangle',
      lead: [67, 0, 71, 74, 71, 0, 67, 0, 69, 0, 72, 69, 67, 0, 0, 0,
             65, 0, 67, 69, 71, 0, 69, 67, 64, 0, 67, 0, 67, 0, 0, 0],
      bass:  [43, 0, 50, 0, 39, 0, 46, 0, 43, 0, 38, 0, 43, 0, 50, 0,
              41, 0, 48, 0, 43, 0, 50, 0, 39, 0, 46, 0, 43, 0, 43, 0] },
    street: { bpm: 120, leadType: 'square',
      lead: [64, 64, 67, 69, 71, 0, 69, 67, 69, 0, 72, 0, 71, 69, 67, 0,
             64, 64, 67, 69, 71, 0, 74, 72, 71, 0, 69, 0, 64, 0, 0, 0],
      bass:  [40, 47, 40, 47, 45, 52, 45, 52, 43, 50, 43, 50, 41, 48, 41, 48,
              40, 47, 40, 47, 45, 52, 45, 52, 38, 45, 38, 45, 40, 44, 40, 0] },
    home: { bpm: 88, leadType: 'triangle',
      lead: [60, 0, 64, 67, 64, 0, 60, 0, 62, 0, 65, 62, 60, 0, 0, 0,
             57, 0, 60, 64, 60, 0, 57, 0, 59, 0, 62, 59, 60, 0, 0, 0],
      bass:  [36, 43, 36, 43, 33, 40, 33, 40, 38, 45, 38, 45, 36, 43, 36, 43,
              33, 40, 33, 40, 35, 42, 35, 42, 31, 38, 31, 38, 36, 40, 36, 0] },
    night: { bpm: 72, leadType: 'sine',
      lead: [69, 0, 0, 0, 72, 0, 0, 0, 71, 0, 0, 0, 67, 0, 0, 0,
             64, 0, 0, 0, 67, 0, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0],
      bass:  [45, 0, 0, 0, 40, 0, 0, 0, 43, 0, 0, 0, 36, 0, 0, 0,
              33, 0, 0, 0, 40, 0, 0, 0, 45, 0, 0, 0, 38, 0, 0, 0] },
    exam: { bpm: 150, leadType: 'square',
      lead: [62, 62, 0, 62, 65, 0, 64, 0, 62, 0, 60, 0, 62, 0, 0, 0,
             62, 62, 0, 62, 67, 0, 65, 0, 64, 0, 62, 0, 64, 0, 0, 0],
      bass:  [38, 38, 45, 38, 41, 41, 48, 41, 36, 36, 43, 36, 38, 38, 45, 38,
              38, 38, 45, 38, 43, 43, 50, 43, 36, 36, 43, 36, 41, 45, 38, 0] },
    battle: { bpm: 160, leadType: 'sawtooth',
      lead: [57, 0, 60, 62, 64, 64, 62, 60, 57, 0, 60, 62, 65, 0, 64, 62,
             60, 0, 62, 64, 65, 65, 64, 62, 60, 62, 60, 57, 59, 0, 0, 0],
      bass:  [33, 33, 40, 33, 33, 33, 40, 33, 36, 36, 43, 36, 32, 32, 39, 32,
              33, 33, 40, 33, 33, 33, 40, 33, 28, 28, 35, 28, 31, 35, 33, 0] },
    boss: { bpm: 168, leadType: 'sawtooth',
      lead: [55, 0, 58, 61, 62, 61, 58, 55, 54, 0, 57, 60, 61, 60, 57, 54,
             55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 0, 0, 0],
      bass:  [31, 31, 31, 38, 30, 30, 30, 37, 29, 29, 29, 36, 31, 31, 38, 31,
              31, 31, 31, 38, 30, 30, 30, 37, 26, 26, 33, 26, 31, 31, 31, 0] },
    wuyun: { bpm: 116, leadType: 'square',
      lead: [59, 0, 58, 59, 62, 0, 59, 0, 58, 0, 56, 58, 59, 0, 0, 0,
             64, 0, 63, 64, 66, 0, 64, 0, 62, 0, 61, 62, 64, 0, 0, 0],
      bass:  [35, 35, 42, 35, 34, 34, 41, 34, 32, 32, 39, 32, 35, 35, 42, 35,
              35, 35, 42, 35, 38, 38, 45, 38, 30, 30, 37, 30, 35, 35, 35, 0] },
    tender: { bpm: 84, leadType: 'triangle',
      lead: [65, 0, 69, 72, 69, 0, 65, 0, 67, 0, 71, 74, 71, 0, 0, 0,
             64, 0, 67, 71, 67, 0, 64, 0, 65, 0, 69, 72, 72, 0, 0, 0],
      bass:  [41, 0, 48, 0, 37, 0, 44, 0, 43, 0, 50, 0, 41, 0, 48, 0,
              40, 0, 47, 0, 43, 0, 50, 0, 41, 0, 48, 0, 41, 45, 48, 0] },
    timecorr: { bpm: 96, leadType: 'triangle',
      lead: [62, 0, 65, 69, 0, 65, 62, 0, 60, 0, 64, 67, 0, 64, 60, 0,
             58, 0, 62, 65, 0, 62, 58, 0, 57, 0, 61, 64, 0, 61, 57, 0],
      bass:  [38, 0, 45, 0, 38, 0, 45, 0, 36, 0, 43, 0, 36, 0, 43, 0,
              34, 0, 41, 0, 34, 0, 41, 0, 33, 0, 40, 0, 33, 40, 45, 0] },
    grad: { bpm: 104, leadType: 'square',
      lead: [60, 0, 64, 67, 72, 0, 71, 69, 67, 0, 71, 74, 72, 0, 0, 0,
             65, 0, 69, 72, 77, 0, 76, 74, 72, 0, 71, 69, 67, 0, 0, 0],
      bass:  [36, 43, 36, 43, 41, 48, 41, 48, 43, 50, 43, 50, 36, 43, 36, 43,
              41, 48, 41, 48, 43, 50, 43, 50, 31, 38, 31, 38, 36, 40, 43, 0] },
    indoor: { bpm: 96, leadType: 'triangle',
      lead: [69, 0, 72, 0, 76, 0, 74, 72, 74, 0, 71, 0, 69, 0, 0, 0,
             65, 0, 69, 0, 72, 0, 76, 74, 71, 0, 68, 0, 69, 0, 0, 0],
      bass:  [45, 0, 52, 0, 41, 0, 48, 0, 43, 0, 50, 0, 45, 0, 52, 0,
              41, 0, 48, 0, 45, 0, 52, 0, 43, 0, 50, 0, 45, 0, 52, 0] },
    mystery: { bpm: 88, leadType: 'triangle',
      lead: [62, 0, 65, 67, 69, 0, 67, 65, 62, 0, 61, 0, 62, 0, 0, 0,
             58, 0, 62, 65, 69, 0, 72, 69, 65, 64, 62, 64, 62, 0, 0, 0],
      bass:  [38, 0, 45, 0, 38, 0, 45, 0, 41, 0, 48, 0, 43, 0, 50, 0,
              38, 0, 45, 0, 38, 0, 45, 0, 41, 0, 48, 0, 43, 0, 50, 0] }
  };

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volMode === 2 ? 0 : 0.9;
    master.connect(ctx.destination);
    bgmBus = ctx.createGain();                          // BGM/环境音独立总线：可单独压低
    bgmBus.gain.value = volMode === 1 ? 0 : 1;
    bgmBus.connect(master);
    // 切到后台标签页时挂起声音（回来自动恢复），避免后台 BGM 卡顿
    if (typeof document !== 'undefined' && document.addEventListener)
      document.addEventListener('visibilitychange', () => {
        if (!ctx) return;
        if (document.hidden) ctx.suspend(); else ctx.resume();
      });
  }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  const mf = m => 440 * Math.pow(2, (m - 69) / 12);

  function tone(freq, t, dur, type, vol, dest) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || master);
    o.start(t); o.stop(t + dur + 0.03);
  }

  function sfx(name, arg) {
    init(); resume(); if (!ctx) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'ok':      tone(880, t, .07, 'square', .05); break;
      case 'cursor':  tone(660, t, .05, 'square', .04); break;
      case 'cancel':  tone(392, t, .08, 'square', .05); tone(311, t + .06, .1, 'square', .05); break;
      case 'correct': [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .09, .12, 'square', .05)); break;
      case 'wrong':   tone(196, t, .18, 'sawtooth', .05); tone(185, t + .12, .2, 'sawtooth', .05); break;
      case 'item':    [659, 784, 988, 1319].forEach((f, i) => tone(f, t + i * .08, .14, 'triangle', .08)); break;
      case 'door':    tone(147, t, .1, 'square', .06); tone(110, t + .09, .14, 'square', .06); break;
      case 'emote':   tone(988, t, .06, 'triangle', .06); tone(1319, t + .05, .08, 'triangle', .06); break;
      case 'save':    tone(784, t, .06, 'triangle', .05); tone(1047, t + .07, .09, 'triangle', .05); break;
      case 'open':    [131, 131, 156, 175, 196].forEach((f, i) => tone(f, t + i * .1, .16, 'sawtooth', .045)); break;
      case 'fanfare': [523, 523, 659, 784, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * .11, .16, 'square', .055)); break;
      case 'cat':     tone(740, t, .22, 'sine', .08); tone(932, t + .18, .28, 'sine', .08); break;
      case 'start':   [523, 659, 784].forEach((f, i) => tone(f, t + i * .07, .12, 'square', .06)); break;
      case 'dig':     tone(180, t, .08, 'square', .07); tone(140, t + .1, .12, 'sawtooth', .06); break;
      case 'photo':   tone(1200, t, .04, 'square', .06); tone(900, t + .05, .06, 'square', .05); tone(1500, t + .1, .05, 'square', .05); break;
      case 'step':    // 脚步声（arg: grass 草地软 / floor 硬地板脆 / cave 洞穴带回声）
        if (arg === 'grass') tone(140, t, .05, 'triangle', .02);
        else {
          tone(230, t, .03, 'triangle', .022);
          tone(115, t + .012, .04, 'square', .01);
          if (arg === 'cave') tone(190, t + .1, .06, 'triangle', .012);   // 洞穴里的回响
        }
        break;
    }
  }

  function playBgm(name) {
    init(); resume();
    if (bgmName === name) return;
    stopBgm();
    bgmName = name;
    if (!ctx || !name || !BGM[name]) return;
    const bgm = BGM[name];
    const stepDur = 30 / bgm.bpm;
    step = 0; nextT = ctx.currentTime + 0.08;
    bgmTimer = setInterval(() => {
      while (nextT < ctx.currentTime + 0.2) {
        const i = step % bgm.lead.length;
        if (bgm.lead[i]) tone(mf(bgm.lead[i]), nextT, stepDur * .9, bgm.leadType || 'square', .032, bgmBus);
        if (bgm.bass[i])  tone(mf(bgm.bass[i]),  nextT, stepDur * 1.7, 'triangle', .05, bgmBus);
        nextT += stepDur; step++;
      }
    }, 60);
  }

  function stopBgm() {
    if (bgmTimer) clearInterval(bgmTimer);
    bgmTimer = null; bgmName = null;
  }

  /* ---------- 音量三档（M 键循环：全开 → 仅音效 → 静音） ---------- */
  function applyVolume() {
    if (master) master.gain.value = volMode === 2 ? 0 : 0.9;
    if (bgmBus) bgmBus.gain.value = volMode === 1 ? 0 : 1;
  }
  function cycleVolume() { volMode = (volMode + 1) % 3; applyVolume(); return volMode; }
  function toggleMute() {                               // 兼容旧调用：静音 ↔ 恢复
    volMode = volMode === 2 ? 0 : 2;
    applyVolume();
    return volMode === 2;
  }

  // 琴键音符（小游戏 / 自由演奏用）
  function note(i) {
    init(); resume(); if (!ctx) return;
    tone([392, 523, 659, 784][((i % 4) + 4) % 4], ctx.currentTime, .28, 'triangle', .07);
  }

  /* =========== 环境音（声景）引擎 ===========
   * 依据 天气 × 季节 × 昼夜 × 地图 × 玩家位置 组合出声层，
   * 层与层独立淡入淡出；全部程序化（噪声滤波 + 振荡器滑音）：
   *   rain/storm 雨·暴雨(雷) · snow/winterWind/autumnWind 风 ·
   *   bird 鸟啭 · cicada 蝉鸣 · cricket 蟋蟀 · frog 蛙声 ·
   *   splash 鱼跃拍水 · drip 洞穴滴水 · sports 操场哨声呼喊拍球 */
  let ambBus = null, ambSig = null, noiseBuf = null, ambWanted = [];
  const ambLayers = {};
  const AMB_OUTDOOR = ['campus', 'backhill', 'backhillDeep', 'town', 'fields', 'homeYard', 'northyard', 'rooftop', 'astroTop', 'seasonGarden'];
  const AMB_WATER = ['town', 'fields', 'seasonGarden'];
  const AMB_CAVE = ['cave', 'backhillDeep', 'timehall', 'era1', 'era2', 'era3', 'era4', 'corridor', 'oldlib'];

  // 纯函数：环境 → 声层名列表（可在无音频环境下测试）
  function ambienceFor(e) {
    e = e || {};
    const out = [];
    const id = e.mapId || '';
    const outdoor = AMB_OUTDOOR.includes(id);
    const water = AMB_WATER.includes(id);
    const cave = AMB_CAVE.includes(id);
    const w = e.weather || '晴', s = e.season || 'spring', night = !!e.night;
    const raining = w === '小雨' || w === '暴雨';
    if (w === '暴雨') out.push('storm');            // 雷雨（室内也能听见闷响）
    else if (w === '小雨') out.push('rain');
    if (w === '雪' && outdoor) out.push('snow');
    if (outdoor && !raining) {                       // 季节风声（户外；冬日风雪交加）
      if (s === 'autumn' && w !== '雪') out.push('autumnWind');
      if (s === 'winter') out.push('winterWind');
    }
    if (outdoor && !raining) {                      // 生物声（户外、无雨）
      if (!night && (w === '晴' || w === '多云') && s !== 'winter') out.push('bird');
      if (!night && s === 'summer' && w !== '雾') out.push('cicada');
      if (night && s !== 'winter' && w !== '暴雨') out.push('cricket');
      if (night && s === 'summer' && water) out.push('frog');
    }
    if (water && !raining) out.push('splash');      // 鱼儿不时拍打水面
    if (cave) out.push('drip');                     // 洞穴/回廊滴水回声
    // 操场活力：campus 南部操场区（py 已布尔化：y≥20 为 1）、白天、非雨雪
    if (id === 'campus' && !night && !raining && w !== '雪' && e.py) out.push('sports');
    return out;
  }

  function ensureAmb() {
    init(); resume();
    if (!ctx) return false;
    if (!ambBus) { ambBus = ctx.createGain(); ambBus.gain.value = .85; ambBus.connect(bgmBus || master); }
    return true;
  }
  function getNoise() {                             // 2 秒白噪声缓存（循环播放）
    if (!noiseBuf) {
      const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      noiseBuf = buf;
    }
    return noiseBuf;
  }
  // 循环滤波噪声底床（可带音量慢起伏 LFO——风声/人群嘈杂）
  function ambNoise(type, freq, q, vol, lfoHz, lfoDepth) {
    const src = ctx.createBufferSource(); src.buffer = getNoise(); src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(f); f.connect(g); g.connect(ambBus); src.start();
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.5);   // 淡入
    let lfo = null, lg = null;
    if (lfoHz) {
      lfo = ctx.createOscillator(); lfo.frequency.value = lfoHz;
      lg = ctx.createGain(); lg.gain.value = vol * lfoDepth;
      lfo.connect(lg); lg.connect(g.gain); lfo.start();
    }
    return {
      stop() {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + .8);
        setTimeout(() => { try { src.stop(); if (lfo) lfo.stop(); } catch (e) {} }, 900);
      }
    };
  }
  // 环境短音（可滑音、可延迟）
  function atone(f0, dur, type, vol, f1, delay) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + dur * .25);
    g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
    o.connect(g); g.connect(ambBus);
    o.start(t0); o.stop(t0 + dur + .05);
  }
  // 短噪声爆发（拍水 / 雷 / 落叶）
  function aburst(dur, type, freq, vol, delay) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const src = ctx.createBufferSource(); src.buffer = getNoise();
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + dur * .15);
    g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(ambBus);
    src.start(t0); src.stop(t0 + dur + .05);
  }
  // 随机间隔事件源（声层的心跳）
  function ambEvents(fn, minS, maxS) {
    let alive = true;
    (function loop() {
      if (!alive) return;
      try { fn(); } catch (e) {}
      setTimeout(loop, (minS + Math.random() * (maxS - minS)) * 1000);
    })();
    return { stop() { alive = false; } };
  }

  /* ---- 各声源 ---- */
  const birdChirp = () => {                          // 春晨鸟啭：2-4 声上扬滑音
    const base = 2100 + Math.random() * 1500, n = 2 + (Math.random() * 3 | 0);
    for (let i = 0; i < n; i++) atone(base + Math.random() * 500, .08 + Math.random() * .05, 'sine', .05, base * 1.35, i * .11);
  };
  const cicadaBurst = () => {                        // 夏日蝉鸣：高频方波 + 36Hz 颤音
    if (!ctx) return;
    const dur = 1.8 + Math.random() * 2.4, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 4300 + Math.random() * 900;
    const am = ctx.createGain(); am.gain.value = .55;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 36 + Math.random() * 10;
    const lg = ctx.createGain(); lg.gain.value = .45;
    lfo.connect(lg); lg.connect(am.gain);
    const g = ctx.createGain(); g.gain.value = 0;
    o.connect(am); am.connect(g); g.connect(ambBus);
    g.gain.linearRampToValueAtTime(.024, t + .35);
    g.gain.setValueAtTime(.024, t + dur - .5);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.start(); lfo.start(); o.stop(t + dur + .1); lfo.stop(t + dur + .1);
  };
  const cricketChirp = () => {                       // 夜蟋蟀：三连高频脉冲
    for (let i = 0; i < 3; i++) atone(4400 + Math.random() * 300, .045, 'sine', .035, 4000, i * .085);
  };
  const frogCroak = () => {                          // 夏夜蛙鸣：低频双声
    atone(165, .16, 'sawtooth', .05, 120);
    atone(150, .13, 'sawtooth', .045, 110, .22);
  };
  const fishSplash = () => {                         // 鱼跃拍水：噪声爆发 + 水珠上扬
    aburst(.22, 'highpass', 1800, .1);
    atone(800, .12, 'sine', .05, 1500, .1);
  };
  const thunder = () => {                            // 雷声：低频轰隆双峰
    aburst(1.6, 'lowpass', 140, .22);
    aburst(1.1, 'lowpass', 90, .16, .25);
  };
  const whistle = () => {                            // 裁判哨：双响
    atone(2350, .32, 'square', .038, 2280);
    atone(2350, .26, 'square', .036, 2280, .45);
  };
  const crowdCheer = () => {                         // 运动呼喊：3-5 声元音滑音（“加油——！”）
    const n = 3 + (Math.random() * 3 | 0);
    for (let i = 0; i < n; i++) atone(480 + Math.random() * 260, .16, 'sawtooth', .035, 720 + Math.random() * 420, i * (.14 + Math.random() * .1));
  };
  const ballBounce = () => atone(95, .08, 'sine', .1, 60);          // 拍球闷响
  const dripDrop = () => {                           // 洞穴滴水（带一点回声感）
    atone(1300 + Math.random() * 700, .07, 'sine', .05, 850);
    atone(1000, .05, 'sine', .02, 700, .18);
  };
  const leafRustle = () => aburst(.6, 'bandpass', 2600, .05);       // 秋叶沙沙

  function buildLayer(name) {
    const parts = [];
    const add = p => parts.push(p);
    switch (name) {
      case 'rain':
        add(ambNoise('highpass', 1600, .7, .05));
        add(ambEvents(() => aburst(.05, 'highpass', 3200, .05), .25, 1.2));   // 雨滴点
        break;
      case 'storm':
        add(ambNoise('highpass', 1000, .6, .07));
        add(ambNoise('lowpass', 280, .5, .06));
        add(ambEvents(thunder, 6, 16));
        break;
      case 'snow':       add(ambNoise('lowpass', 500, .4, .045, .09, .5)); break;
      case 'winterWind': add(ambNoise('lowpass', 380, .3, .05, .07, .6)); break;
      case 'autumnWind':
        add(ambNoise('lowpass', 460, .35, .04, .11, .5));
        add(ambEvents(leafRustle, 2.5, 7));
        break;
      case 'bird':    add(ambEvents(birdChirp, 2.2, 6.5)); break;
      case 'cicada':  add(ambEvents(cicadaBurst, 2.5, 6)); break;
      case 'cricket': add(ambEvents(cricketChirp, 1.2, 3.8)); break;
      case 'frog':    add(ambEvents(frogCroak, 2.5, 7)); break;
      case 'splash':  add(ambEvents(fishSplash, 4, 12)); break;
      case 'drip':    add(ambEvents(dripDrop, 1.5, 5)); break;
      case 'sports':
        add(ambNoise('bandpass', 520, .8, .03, .16, .35));                   // 人群嘈杂底
        add(ambEvents(crowdCheer, 3, 8));
        add(ambEvents(whistle, 6, 14));
        add(ambEvents(ballBounce, 1.5, 4));
        break;
    }
    return { stop() { parts.forEach(p => p.stop && p.stop()); } };
  }

  // 主入口：主循环低频调用（签名不变则零开销）
  function updateAmbience(env) {
    const sig = JSON.stringify(env || {});
    if (sig === ambSig) return;
    ambSig = sig;
    const want = ambienceFor(env || {});
    ambWanted = want;
    for (const k of Object.keys(ambLayers))
      if (!want.includes(k)) { ambLayers[k].stop(); delete ambLayers[k]; }
    if (!want.length || !ensureAmb()) return;
    for (const k of want) if (!ambLayers[k]) ambLayers[k] = buildLayer(k);
  }

  return { init, resume, sfx, playBgm, stopBgm, toggleMute, cycleVolume, note, BGM,
           updateAmbience, ambienceFor, ambientList: () => ambWanted.slice(),
           get muted() { return volMode === 2; }, get volMode() { return volMode; }, get bgm() { return bgmName; } };
})();
