/* =========================================================
 * cal.js —— 日历 / 时段 / 天气 / 季节
 * 一天六时段：清晨/上午/午休/放学/傍晚/夜晚
 * 季节按天轮转（每 10 天一季）：春夏秋冬
 * 天气每天随机：晴/多云/小雨/暴雨/雾/雪/星空(夜)
 * 提供打卡(streak)与睡觉(过日)接口
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.Cal = (function () {

  const PERIODS = ['清晨', '上午', '午休', '放学', '傍晚', '夜晚'];
  const SEASONS = ['春', '夏', '秋', '冬'];
  const SEASON_FULL = { 春: '春', 夏: '夏', 秋: '秋', 冬: '冬' };
  const WEATHERS = ['晴', '多云', '小雨', '暴雨', '雾', '雪', '星空'];
  // 权重表（雪/星空低概率；剧情可强制）
  const WPOOL = ['晴', '晴', '晴', '多云', '多云', '小雨', '小雨', '暴雨', '雾', '雪'];

  const st = {
    day: 1, period: 3,          // 从第 1 天「放学」开始（放学后自由活动是主玩法时段）
    weather: '晴',
    checkedIn: false, streak: 0, bestStreak: 0,
    sleepDebt: 0,               // 熬夜惩罚计数
    energy: 100,                // 精力：睡觉回满，上课/复习消耗（不设硬门槛，只做提示）
    energyMax: 100,             // 精力上限：吃星之果实永久提升（最高 150）
    weatherTomorrow: ''         // 明日天气预告（睡前预报 → newDay 采用，保证「预报必准」）
  };

  function season() { return SEASONS[Math.floor((st.day - 1) / 10) % 4]; }
  function seasonEn() { return ['spring', 'summer', 'autumn', 'winter'][Math.floor((st.day - 1) / 10) % 4]; }
  function periodName() { return PERIODS[st.period]; }
  function isNight() { return st.period >= 4; }
  function weekIndex() { return Math.floor((st.day - 1) / 7) + 1; }
  function isFriday() { return st.day % 7 === 5; }
  function isWeekend() { const d = st.day % 7; return d === 6 || d === 0; }

  /* —— 课程表（weekday 1-7 = 周一至周日；周五下午体育节前两节文化课） —— */
  const TABLE = {
    1: ['数学', '语文', '英语', '科学', '体育'],
    2: ['语文', '数学', '音乐', '英语', '科学'],
    3: ['英语', '科学', '数学', '语文', '美术'],
    4: ['科学', '英语', '语文', '数学', '音乐'],
    5: ['数学', '体育', '科学', '语文', '英语'],
    6: ['阅读', '社团'],
    7: []
  };
  function weekday() { return (st.day - 1) % 7 + 1; }
  function today() { return TABLE[weekday()] || []; }

  /* —— 节日表（纯氛围 + 少量彩蛋，避开期中考试周与月考提示日 day%10===4） ——
     前半周期 day2-29 + 后半周期 day31-59（按 10 天一季排布，覆盖冬/春/夏/秋第二轮） */
  const FESTIVALS = {
    2: '开学礼', 5: '植树节', 8: '读书日', 11: '春游日', 15: '艺术节',
    18: '风筝节', 22: '感恩日', 26: '儿童节', 29: '友谊日',
    31: '冬日祭', 33: '观星夜', 37: '年货街', 41: '迎春运动会', 45: '踏青节',
    48: '泡泡日', 53: '纳凉晚会', 57: '收获祭', 59: '毕业预演'
  };
  function festival() { return FESTIVALS[st.day] || ''; }

  /* —— 精力：消耗型正反馈，低了只提醒不拦截 —— */
  function costEnergy(n) {
    st.energy = Math.max(0, st.energy - (n || 0));
    return st.energy;
  }
  // 恢复精力（吃饭/小憩等），上限 energyMax（energy 对外只读，恢复必须走这里）
  function gainEnergy(n) {
    st.energy = Math.min(st.energyMax, st.energy + (n || 0));
    return st.energy;
  }
  // 永久提升精力上限（星之果实），封顶 150；顺带把当前精力抬到新上限
  function raiseMax(n) {
    st.energyMax = Math.min(150, st.energyMax + (n || 0));
    st.energy = Math.min(st.energyMax, st.energy + (n || 0));
    return st.energyMax;
  }

  function rollWeather() {
    st.weather = WPOOL[(Math.random() * WPOOL.length) | 0];
    if (st.period >= 5 && Math.random() < .5) st.weather = '星空';
    return st.weather;
  }
  function force(weather) { st.weather = weather; }
  // 预定明日天气（睡前「结算单」调用）：预 roll 暂存，newDay 直接采用 → 预报必准
  function forecastTomorrow() {
    st.weatherTomorrow = WPOOL[(Math.random() * WPOOL.length) | 0];
    return st.weatherTomorrow;
  }

  // 耗时行动推进时段（学习/社团/战斗/考试等调用）
  function advance(n) {
    st.period += (n || 1);
    if (st.period > 5) st.period = 5;   // 夜晚封底，睡觉才进新一天
    if (st.weather === '星空' && st.period < 5) rollWeather();
  }

  // 每日打卡完成
  function checkIn() {
    st.checkedIn = true;
    st.streak += 1;
    st.bestStreak = Math.max(st.bestStreak, st.streak);
    return st.streak;
  }

  function todayBirthdays() {
    const meta = ADV.Game && ADV.Game.BOND_META || {};
    return Object.keys(meta).filter(id => meta[id].bday === st.day);
  }

  // 睡觉 → 新的一天。返回今天发生的事件列表（供 toast/剧情用）
  function newDay() {
    const events = [];
    st.day += 1;
    // 饲养进化检查：毛毛虫/蝌蚪养够天数 → 化蝶/变蛙（异色继承）
    if (ADV.Collect && ADV.Collect.applyEvolve) {
      ADV.Collect.applyEvolve(st.day).forEach(t => events.push({ type: 'evolve', text: t }));
    }
    st.period = 0;
    st.checkedIn = false;
    // 睡眠债：欠债时次日精力上限临时削减（每笔 -10，最多 3 笔，game.js 睡前结算）；不低于 50 保底
    st.energy = Math.max(50, st.energyMax - st.sleepDebt * 10);
    if (st.sleepDebt > 0) events.push({ type: 'debt', text: `睡眠债 ×${st.sleepDebt}：今天精力上限 -${st.sleepDebt * 10}（早睡可还债）` });
    // 昨晚预报过的天气直接采用（预报必准）；没预报过（如直接 newDay）才现场 roll
    if (st.weatherTomorrow) { st.weather = st.weatherTomorrow; st.weatherTomorrow = ''; }
    else rollWeather();
    const sIdxOld = Math.floor((st.day - 2) / 10) % 4;
    const oldSeason = SEASONS[sIdxOld];
    const newSeason = season();
    if (oldSeason !== newSeason) {
      events.push({ type: 'season', text: `季节更替 —— ${newSeason}天来了` });
      const fromEn = ['spring', 'summer', 'autumn', 'winter'][sIdxOld];
      const toEn = seasonEn();
      if (ADV.Engine && ADV.Engine.startSeasonTransition) {
        try { ADV.Engine.startSeasonTransition(fromEn, toEn); } catch (e) { /* 冒烟测试无 canvas 静默 */ }
      }
    }
    const bd = todayBirthdays();
    bd.forEach(id => {
      const b = ADV.Game.BOND[id];
      events.push({ type: 'birthday', id, text: `今天是${b ? b.name : id}的生日！送礼好感翻倍` });
    });
    const fest = festival();
    if (fest) events.push({ type: 'festival', text: `今天是「${fest}」！` });
    if (isFriday()) events.push({ type: 'exam', text: '今天是周五 —— 别忘了周测！' });
    if (st.day % 10 === 4) events.push({ type: 'month', text: '月考临近，记得复习！' });
    return events;
  }

  function label() {
    return `第${st.day}天·${season()}·${periodName()}｜${st.weather}` +
      (st.checkedIn ? '' : '｜未打卡');
  }

  function load(d) {
    if (!d) return;
    st.day = d.day || 1;
    st.period = Math.min(5, Math.max(0, d.period != null ? d.period : 3));
    st.weather = d.weather || '晴';
    st.checkedIn = !!d.checkedIn;
    st.streak = d.streak || 0;
    st.bestStreak = d.bestStreak || st.streak;
    st.sleepDebt = d.sleepDebt || 0;
    st.energy = d.energy != null ? d.energy : 100;
    st.energyMax = d.energyMax || 100;
    st.weatherTomorrow = d.weatherTomorrow || '';
  }
  function dump() {
    return { day: st.day, period: st.period, weather: st.weather, checkedIn: st.checkedIn,
             streak: st.streak, bestStreak: st.bestStreak, sleepDebt: st.sleepDebt,
             energy: st.energy, energyMax: st.energyMax, weatherTomorrow: st.weatherTomorrow };
  }

  return {
    PERIODS, WEATHERS, TABLE, FESTIVALS,
    season, seasonEn, periodName, isNight, isFriday, isWeekend, weekIndex,
    weekday, today, festival, costEnergy, gainEnergy, raiseMax,
    rollWeather, force, forecastTomorrow, advance, checkIn, newDay, label, load, dump,
    get day() { return st.day; },
    get period() { return st.period; },
    get weather() { return st.weather; },
    get checkedIn() { return st.checkedIn; },
    get streak() { return st.streak; },
    get energy() { return st.energy; },
    get energyMax() { return st.energyMax; },
    get sleepDebt() { return st.sleepDebt; },
    set sleepDebt(n) { st.sleepDebt = Math.max(0, Math.min(3, n || 0)); }
  };
})();
