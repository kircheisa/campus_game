/* =========================================================
 * skills.js —— 生活技能层（星露谷式五系专精）
 * 农艺 🌾 / 采矿 ⛏ / 钓鱼 🎣 / 战斗 ⚔ / 社交 💬
 * 不新增任何日常作业：全部由既有行为涓滴汇入。
 *   ADV.Skills.add(branch, n, why) -> 动作给技能经验（升级自动广播+存档）
 *   ADV.Skills.lv(branch)          -> 当前等级（0-5）
 *   ADV.Skills.xp(branch)/need(branch) -> 经验进度（满级 need=0）
 *   ADV.Skills.dump()/load()/reset()   -> 存档序列化
 *   各系加成以纯函数钩子暴露，供 game.js 动作点直接取用。
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.Skills = (function () {

  const BRANCHES = [
    ['farm', '农艺', '🌾'], ['mine', '采矿', '⛏'], ['fish', '钓鱼', '🎣'],
    ['battle', '战斗', '⚔'], ['social', '社交', '💬']
  ];
  const LV_NEED = [20, 40, 70, 110, 160];              // 升到下一级所需（满级 5）
  const PERKS = {
    farm: ['省种：播种时 20% 概率不消耗种子', '丰收：收获时额外 +1 份', '精耕：金星/银星品质概率提升',
           '催苗：浇水有 25% 概率多长一截', '沃土：收获保底银星品质'],
    mine: ['识矿：敲出双矿几率 +10%', '巧力：敲矿精力消耗 -1', '碎屑：15% 概率额外掉一块矿',
           '轻步：下探裂缝精力消耗 -1', '矿脉直觉：双矿几率再 +10%'],
    fish: ['知性：稀有鱼出现率提升', '耐性：每日可钓竿数 +1', '手感：搏鱼更容易（等同挂饵）',
           '渔汛：稀有鱼出现率再提升', '金鳞传说：金色鱼出现率翻倍'],
    battle: ['体术：对决 HP +10', '发力：对决伤害 +10%', '预判：对手更难闪开你的攻击',
             '巧劲：对决伤害再 +10%', '身法：对决先手判定 +5 速'],
    social: ['开场白：每日闲聊好感 +1', '会挑礼物：送礼好感 +1', '话匣子：每日可聊第二次（好感 +1）',
             '投其所好：送礼好感再 +1', '人缘爆棚：好感正增长时 30% 概率再 +1']
  };

  const st = { xp: {}, lv: {} };
  for (const [k] of BRANCHES) { st.xp[k] = 0; st.lv[k] = 0; }

  function save() { try { ADV.Game.save(); } catch (e) {} }

  /* ---------- 经验与升级 ---------- */
  function add(branch, n, why) {
    if (!(branch in st.xp) || !n) return 0;
    if (st.lv[branch] >= 5) return 0;                  // 满级不再吞经验
    st.xp[branch] += n;
    let ups = 0;
    while (st.lv[branch] < 5 && st.xp[branch] >= LV_NEED[st.lv[branch]]) {
      st.xp[branch] -= LV_NEED[st.lv[branch]]; st.lv[branch]++; ups++;
    }
    if (st.lv[branch] >= 5) st.xp[branch] = 0;         // 满级封顶：经验条清零，不再累积
    if (ups > 0) {
      const b = BRANCHES.find(x => x[0] === branch);
      if (ADV.UI && ADV.UI.toast) ADV.UI.toast(` 🛠 ${b[2]} ${b[1]}技能 Lv.${st.lv[branch]}！解锁：${PERKS[branch][st.lv[branch] - 1].split('：')[0]} `);
      if (ADV.Growth) ADV.Growth.milestone(`${b[2]} ${b[1]}技能升到 Lv.${st.lv[branch]}${why ? '（' + why + '）' : ''}`);
    }
    save();
    return ups;
  }

  const lv = k => st.lv[k] | 0;
  const xp = k => st.xp[k] | 0;
  const need = k => (st.lv[k] >= 5) ? 0 : LV_NEED[st.lv[k]];

  /* ---------- 各系加成钩子（纯函数，便于测试） ---------- */
  const H = {
    // 农艺
    seedSave: () => lv('farm') >= 1 && Math.random() < .2,
    harvestBonus: () => lv('farm') >= 2 ? 1 : 0,
    qualityRoll: r => lv('farm') >= 3 ? (r < .12 ? 3 : r < .38 ? 2 : 1) : (r < .05 ? 3 : r < .25 ? 2 : 1),
    silverFloor: () => lv('farm') >= 5,
    waterBoost: () => lv('farm') >= 4 ? .25 : 0,
    // 采矿
    oreDbl: tier => (tier >= 2 ? .3 : .15) + (lv('mine') >= 1 ? .1 : 0) + (lv('mine') >= 5 ? .1 : 0),
    oreEnergy: () => lv('mine') >= 2 ? 1 : 2,
    oreShard: () => lv('mine') >= 3 && Math.random() < .15,
    crackEnergy: () => lv('mine') >= 4 ? 1 : 2,
    // 钓鱼
    fishRods: () => 3 + (lv('fish') >= 2 ? 1 : 0),
    fishBoost: () => (lv('fish') >= 1 ? 1 : 0) + (lv('fish') >= 4 ? 1 : 0),
    fishEasy: () => lv('fish') >= 3,
    goldenFish: () => lv('fish') >= 5,
    // 战斗
    duelHp: () => lv('battle') >= 1 ? 10 : 0,
    duelDmg: () => 1 + (lv('battle') >= 2 ? .1 : 0) + (lv('battle') >= 4 ? .1 : 0),
    duelFocus: () => lv('battle') >= 3 ? .02 : 0,
    duelSpd: () => lv('battle') >= 5 ? 5 : 0,
    // 社交
    chatBonus: () => lv('social') >= 1 ? 1 : 0,
    chatCap: () => lv('social') >= 3 ? 2 : 1,
    giftBonus: () => (lv('social') >= 2 ? 1 : 0) + (lv('social') >= 4 ? 1 : 0),
    charmLuck: () => lv('social') >= 5 && Math.random() < .3
  };

  function dump() { return JSON.parse(JSON.stringify(st)); }
  function load(d) {
    if (!d) return;
    for (const [k] of BRANCHES) {
      st.xp[k] = (d.xp && d.xp[k]) | 0;
      st.lv[k] = Math.min(5, (d.lv && d.lv[k]) | 0);
    }
  }
  function reset() { for (const [k] of BRANCHES) { st.xp[k] = 0; st.lv[k] = 0; } }

  return { BRANCHES, PERKS, LV_NEED, add, lv, xp, need, dump, load, reset, ...H };
})();
