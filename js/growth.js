/* =========================================================
 * growth.js —— 成长聚合层：五维属性 · 等级经验 · 称号 · 大事记
 * 不新增任何日常作业：全部由既有行为涓滴汇入（借鉴 P5 五维）。
 *   ADV.Growth.dim()            -> { knowledge, body, mind, bond, art }
 *   ADV.Growth.addXP(n, why)    -> 任意活动给经验（升级自动广播+存档）
 *   ADV.Growth.addDim(k, n)     -> 维度成长（知识/体魄/心性/人缘/技艺）
 *   ADV.Growth.lv() / title() / xp() / nextLv()
 *   ADV.Growth.milestone(text)  -> 记入成长大事记（时间线）
 *   ADV.Growth.unlockNeed(dim, n) -> 五维解锁钩子（场景交互直接调用）
 *   ADV.Growth.dump()/load()    -> 存档序列化
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.Growth = (function () {

  const DIMS = [
    ['knowledge', '学识', '📚'], ['body', '体魄', '💪'], ['mind', '心性', '🧘'],
    ['bond', '人缘', '💗'], ['art', '技艺', '🎨']
  ];
  const TITLES = [[1, '新生'], [5, '学员'], [10, '闯将'], [15, '学长'], [20, '明星'], [25, '传说'], [30, '阳光之星']];
  const LV_XP = lv => lv * 40 + 20;                    // 升到 lv+1 所需

  const st = { xp: 0, lv: 1, dim: { knowledge: 0, body: 0, mind: 0, bond: 0, art: 0 }, log: [], relic: '' };

  function save() { try { ADV.Game.save(); } catch (e) {} }

  /* ---------- 维度（上限 100，聚合已有行为） ---------- */
  function addDim(k, n, why) {
    if (!st.dim.hasOwnProperty(k)) return;
    const before = st.dim[k];
    st.dim[k] = Math.max(0, Math.min(100, st.dim[k] + n));
    if (why) milestone(`${DIMS.find(d => d[0] === k)[2]}${DIMS.find(d => d[0] === k)[1]} ${n > 0 ? '+' : ''}${n}${why ? '（' + why + '）' : ''}`);
    return st.dim[k] - before;
  }

  /* ---------- 经验与等级 ---------- */
  function addXP(n, why) {
    st.xp += n;
    let ups = 0;
    while (st.lv < 30 && st.xp >= LV_XP(st.lv)) { st.xp -= LV_XP(st.lv); st.lv++; ups++; }
    if (ups > 0) {
      const t = title();
      if (ADV.UI && ADV.UI.toast) ADV.UI.toast(` ✨ 升级！Lv.${st.lv}「${t}」 `);
      if (ups >= 2 && ADV.UI && ADV.UI.toast) ADV.UI.toast(' 📢 校长广播：又有同学进步啦！');
      milestone(`⭐ 升到 Lv.${st.lv}，称号「${t}」`);
      addDim('mind', 1, '成长的喜悦');
    }
    save();
    return ups;
  }

  function title() {
    let t = TITLES[0][1];
    for (const [lv, name] of TITLES) if (st.lv >= lv) t = name;
    return t;
  }

  /* ---------- 大事记 ---------- */
  function milestone(text) {
    const day = ADV.Cal ? ADV.Cal.day : 1;
    st.log.unshift({ day, text });
    if (st.log.length > 60) st.log.length = 60;
  }

  /* ---------- 五维解锁钩子 ---------- */
  function unlockNeed(dim, need) {
    if (!need) return true;
    return st.dim[dim] >= need;
  }

  /* ---------- 聚合刷新（毕业结局/手册页用：从既有 flag 反推展示值） ---------- */
  function aggregate() {
    const F = ADV.Game.flags, C = ADV.Collect, M = ADV.Mistake;
    const nodes = M ? M.totalNodes() : 0;
    const stages = Object.values((ADV.Game && ADV.Game.friends) || {}).reduce((s, r) => s + (r.stage || 0), 0);
    return {
      knowledge: Math.min(100, st.dim.knowledge + nodes * 3),
      body: Math.min(100, st.dim.body + ((F.martial || {}).lvl || 0) * 6 + (F.senseiWin ? 10 : 0)),
      mind: Math.min(100, st.dim.mind + ((F.diary || []).length) * 2 + (F.rumorTruth ? 8 : 0)),
      bond: Math.min(100, st.dim.bond + stages * 2 + (Object.keys(F.hang || {}).length) * 3),
      art: Math.min(100, st.dim.art + (C ? C.catCount('scenes') * 3 : 0) + (F.clubLv || 0) * 5 + Object.keys(F.recipes || {}).length * 4)
    };
  }

  function dump() { return JSON.parse(JSON.stringify(st)); }
  function load(d) {
    if (!d) return;
    st.xp = d.xp || 0; st.lv = Math.min(30, d.lv || 1);
    st.dim = { knowledge: 0, body: 0, mind: 0, bond: 0, art: 0, ...(d.dim || {}) };
    st.log = d.log || []; st.relic = d.relic || '';
  }
  function reset(relic) {
    st.xp = 0; st.lv = 1; st.log = [];
    st.dim = { knowledge: 0, body: 0, mind: 0, bond: 0, art: 0 };
    st.relic = relic || '';
    // NG+ 信物：三选一起步加成
    if (relic === 'notebook') st.dim.knowledge = 10;
    if (relic === 'bandage') st.dim.body = 10;
    if (relic === 'photo') st.dim.bond = 10;
    if (relic) milestone(`携带信物开启新学期：${{ notebook: '先辈笔记本', bandage: '旧绷带', photo: '毕业照' }[relic]}`);
  }

  return {
    DIMS, TITLES, addXP, addDim, milestone, unlockNeed, aggregate, dump, load, reset, title,
    get lv() { return st.lv; },
    get xp() { return st.xp; },
    nextLv: () => LV_XP(st.lv),
    get log() { return st.log; },
    get relic() { return st.relic; }
  };
})();
