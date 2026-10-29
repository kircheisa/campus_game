#!/usr/bin/env node
'use strict';
/* =========================================================================
 * econ.js — 经济曲线数值模型工具（批次六十四 · 清单 O2「经济曲线数值工具化」）
 *
 * 把 docs/经济曲线观察.md §1/§2 的入水口/大件表抽成**可调参数模型**：
 *   - 每个日收入源 = { 每日上限区间 cap, 典型达成率 take, 开放日 start }；
 *   - 「典型日入」= Σ cap 中值 × take —— take 是假设参数，实机体感若与模型
 *     出入，先调 take（肝度）再谈改价；
 *   - 敏感性复核：鱼价 / 办公时薪 / 擂台连胜封顶 / 肝度等参数变动对
 *     「大件池回收天数」的贡献度排名，产出**调参建议**而非直接改数——
 *     改不改游戏内数值永远等实机体感（本工具零改游戏源）。
 *
 * 关键数值与游戏源码的对应（tools/smoke.js [5.119] 源断言钉住，防漂移）：
 *   - 鲜鱼参考价 8            → js/collect.js ITEMS.fish.price
 *   - 擂台再战 min(60, 20+连胜×10) → js/game-retro.js arenaLadder
 *   - 温室 300 / 基地 50+120+250   → js/game-quest.js / js/game-retro.js
 *   - 帮助板 3 单/日 ×12~24     → js/game-scene.js S.helpBoard
 *
 * 用法：node tools/econ.js        （打印复核报告；纯确定性输出，无随机）
 *       const E = require('./econ.js')   （供冒烟 [5.119] 行为断言消费）
 * ========================================================================= */

/* —— §1 日收入源（口径：docs/经济曲线观察.md §1 表；take 为典型达成率假设）—— */
const INCOME = [
  { id: 'toys',    name: '童年小游戏（5 项常态）', cap: [24, 34], take: 0.70, start: 1, note: '每日每项首胜 +6~10（game-retro toyPlay）' },
  { id: 'ladder',  name: '擂台再战（连胜递增）',   cap: [40, 60], take: 0.50, start: 1, note: '+20+连胜×10，封顶 60，失败清零' },
  { id: 'help',    name: '帮助板委托（3 单/日）',  cap: [36, 45], take: 0.65, start: 1, note: '按日抽 3 单 ×12~24（S.helpBoard）' },
  { id: 'fish',    name: '钓鱼（3 竿 × 鲜鱼 8）',  cap: [19, 29], take: 0.75, start: 2, note: '市场 0.8-1.2× 浮动；f7/f10 彩蛋 EV 不计' },
  { id: 'homework',name: '作业/讨教（办公 ×2 时薪）', cap: [8, 16], take: 0.70, start: 1, note: 'C4 办公时段 8→16 文' },
  { id: 'farm',    name: '农场（6 垄轮作）',       cap: [20, 30], take: 0.80, start: 4, note: '种子 4-10 → 果实 10-30，三日熟' },
  { id: 'orchard', name: '百果园（当季 2 棵）',    cap: [18, 36], take: 0.60, start: 1, note: '每棵日锁 9~18，非当季不结果' },
  { id: 'ranch',   name: '畜牧（蛋/奶/毛）',       cap: [8, 16],  take: 0.80, start: 6, note: '金蛋 60 属稀有，不计入典型' },
  { id: 'wish',    name: '许愿池 EV',              cap: [1, 1],   take: 1.00, start: 1, note: '-5 → 40% +15（20% 心性另计）' },
];

/* —— 一次性/周锁收入（不进日模型，单独记账）—— */
const LUMPS = [
  { id: 'ladderTier', name: '擂台阶梯 8+15+40', gold: 63, when: '一次性' },
  { id: 'renown',     name: '声望里程碑（helpPts=7）', gold: 50, when: '一次性' },
];

/* —— §2 大件池（回收目标；日用 3~70/件不计）—— */
const BIG = [
  { id: 'tools',      name: '工具线全套 II 级',  gold: 630 },
  { id: 'greenhouse', name: '温室（田伯）',      gold: 300 },
  { id: 'base',       name: '秘密基地三级',      gold: 420 },
  { id: 'fund',       name: '全校众筹两工程',    gold: 250 },
];

/* 场景倍率：休闲（半肝）/ 标准（假设 take）/ 上限（全源拉满 capHigh=肝度天花板） */
const SCENES = { casual: 0.5, standard: 1.0 };

const mid = ([lo, hi]) => (lo + hi) / 2;

/* 擂台再战单场金币（赌连胜专项：连胜 s → min(60, 20+10s)） */
function ladderAt(streak) { return Math.min(60, 20 + streak * 10); }

/* 某场景下的典型日入（start 门槛在「中期」视角下全开放，只按 take 折算） */
function dailyAt(scene) {
  const m = SCENES[scene] != null ? SCENES[scene] : scene;   // 允许直接传倍率
  return INCOME.reduce((s, r) => s + mid(r.cap) * r.take * m, 0);
}

/* 全源上限（肝度天花板：每源吃满 capHigh——检验「无通胀爆点」口径） */
function ceiling() { return INCOME.reduce((s, r) => s + r.cap[1], 0); }

const poolTotal = () => BIG.reduce((s, b) => s + b.gold, 0);   // §2 表合计 1600
const lumpTotal = () => LUMPS.reduce((s, l) => s + l.gold, 0); // 一次性合计 113

/* —— 敏感性复核：参数变体 → 新典型日入 → 大件池回收天数变化 —— */
function sensitivity() {
  const pool = poolTotal();
  const base = dailyAt('standard');
  const baseDays = pool / base;
  const V = [
    { label: '鱼价 8→12（+50%）',        mod: r => r.id === 'fish'     ? { cap: [28.5, 43.5] } : null },
    { label: '办公时薪 16→24（×1.5）',   mod: r => r.id === 'homework' ? { cap: [12, 24] } : null },
    { label: '擂台封顶 60→120（假设翻倍）', mod: r => r.id === 'ladder'   ? { cap: [40, 120] } : null },
    { label: '赌连胜更肝（take .5→.75）',  mod: r => r.id === 'ladder'   ? { take: 0.75 } : null },
    { label: '帮助板单价 ×1.5',          mod: r => r.id === 'help'     ? { cap: [54, 67.5] } : null },
    { label: '全源肝度 take +0.1',        mod: r => ({ take: Math.min(1, r.take + 0.1) }) },
  ];
  return V.map(v => {
    const d = INCOME.reduce((s, r) => {
      const o = Object.assign({}, r, v.mod(r) || {});
      return s + mid(o.cap) * o.take;
    }, 0);
    const days = pool / d;
    return { label: v.label, dailyAfter: +d.toFixed(1), days: +days.toFixed(1), dDays: +(days - baseDays).toFixed(2) };
  }).sort((a, b) => Math.abs(b.dDays) - Math.abs(a.dDays))
    .map((v, i) => Object.assign(v, { rank: i + 1 }));
}

/* —— 汇总复核（claims 与 docs/经济曲线观察.md 的三条结论一一对应）—— */
function analyze() {
  const casual = +dailyAt('casual').toFixed(1);
  const standard = +dailyAt('standard').toFixed(1);
  const ceil = +ceiling().toFixed(1);
  const pool = poolTotal();
  const daysStandard = +(pool / standard).toFixed(1);
  const daysCasual = +(pool / casual).toFixed(1);
  const shares = INCOME.map(r => ({ id: r.id, pct: +(mid(r.cap) * r.take / standard * 100).toFixed(1) }))
    .sort((a, b) => b.pct - a.pct);
  const claims = {
    midInRange: casual >= 60 && casual <= 150 && standard >= 60 && standard <= 150,  // 「中期日入 ≈60-150」
    noRunaway: ceil < 300 && shares[0].pct < 25,                                     // 「无单口爆点」
    twoWeeks: daysStandard >= 10 && daysStandard <= 20,                              // 「全内容回收约两周」
  };
  return {
    daily: { casual, standard, ceiling: ceil },
    shares,
    recycle: { pool, lumpTotal: lumpTotal(), daysStandard, daysCasual },
    claims,
    sens: sensitivity(),
  };
}

/* —— CLI 报告（纯确定性）—— */
function report() {
  const a = analyze();
  const L = [];
  L.push('== 经济曲线数值模型复核（tools/econ.js · 批次六十四）==');
  L.push('');
  L.push('§A 典型日入（take 达成率假设，参数见源码 INCOME 表）');
  L.push(`  休闲（take×0.5）：${a.daily.casual} 文/日`);
  L.push(`  标准（假设 take）：${a.daily.standard} 文/日`);
  L.push(`  肝度天花板（全源吃满 cap）：${a.daily.ceiling} 文/日`);
  L.push(`  单源占比第一：${a.shares[0].id}（${a.shares[0].pct}%）`);
  L.push('');
  L.push('§B 大件池回收（§2 表合计 ' + a.recycle.pool + ' 文；一次性收入另 +' + a.recycle.lumpTotal + '）');
  L.push(`  标准节奏：${a.recycle.daysStandard} 天回满  ·  休闲节奏：${a.recycle.daysCasual} 天`);
  L.push('');
  L.push('§C 敏感性排名（对回收天数贡献度，|Δ| 降序）');
  a.sens.forEach(v => L.push(`  #${v.rank} ${v.label} → 日入 ${v.dailyAfter}，回收 ${v.days} 天（Δ${v.dDays}）`));
  L.push('');
  L.push('§D 口径核对（对照 docs/经济曲线观察.md 结论）');
  L.push(`  中期日入 60-150 区间：${a.claims.midInRange ? '✅' : '❌'}  无单口爆点（ceiling<300 且单源<25%）：${a.claims.noRunaway ? '✅' : '❌'}  两周回收口径：${a.claims.twoWeeks ? '✅' : '❌'}`);
  L.push('');
  L.push('调参建议：' + (
    a.sens[0].label.includes('肝度') || a.sens[0].label.includes('封顶')
      ? '敏感性由「肝度/封顶类」参数主导，单价类（鱼价/时薪）垫底——若实机体感通胀，先收日锁达成率与连胜封顶，动单价基本无效。'
      : '首位敏感参数：' + a.sens[0].label));
  return L.join('\n');
}

module.exports = { INCOME, LUMPS, BIG, SCENES, ladderAt, dailyAt, ceiling, poolTotal, lumpTotal, sensitivity, analyze, report };

if (require.main === module) console.log(report());
