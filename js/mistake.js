/* =========================================================
 * mistake.js —— 错题本 + 间隔重复 + 知识树
 * 学习闭环：答错的题自动入本，按 1/3/7/15 天记忆盒安排重现，
 * 答对推进盒子（过第四盒即「掌握毕业」），答错重置回第一盒。
 * 答对题得知识点（KP），攒够点亮知识树节点 → 战斗属性/技能加成。
 * ADV.Mistake.answer(subject, q, my)  答题统一入口（统计 + 入本 + KP）
 * ADV.Mistake.dueList()               今日到期错题 id 列表
 * ADV.Mistake.review(id, right)       复习判定：推进 / 重置 / 毕业
 * ADV.Mistake.kp(subject) / unlocked(subject) / totalNodes()
 *                                     知识点数 / 已解锁节点 / 全科总节点
 * ADV.Mistake.stats() / quizStats()   错题与近 7 天答题统计
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.Mistake = (function () {
  const IVAL = [1, 3, 7, 15];            // 记忆盒间隔：答对后 N 天再考

  /* —— 知识树：每科 5 个节点，NEED 是累计知识点解锁门槛 —— */
  const CN2EN = { '数学': 'math', '语文': 'chinese', '英语': 'english', '科学': 'science', '综合': 'final' };
  const EN2CN = { math: '数学', chinese: '语文', english: '英语', science: '科学', final: '综合' };
  const TREE = {
    math:    ['数感', '分数', '方程', '几何', '数学之心'],
    chinese: ['识字', '诗词', '阅读', '作文', '文心'],
    english: ['字母', '单词', '句型', '口语', '语感'],
    science: ['观察', '实验', '生命', '天地', '好奇心'],
    final:   ['记忆', '逻辑', '专注', '应变', '智慧']
  };
  const NEED = [4, 6, 8, 10, 12];        // 累计 KP 门槛：4 点开第 1 节点……

  function F() { return ADV.Game.flags; }

  function kp(subject) {                  // 某科知识点数（可传中/英文名）
    const f = F();
    if (!f.kp) return 0;
    const en = CN2EN[subject] || subject;
    return f.kp[en] || 0;
  }
  function gain(subject, n) {             // 内部：得知识点
    const f = F();
    f.kp = f.kp || {};
    const en = CN2EN[subject] || subject || 'final';
    f.kp[en] = (f.kp[en] || 0) + (n || 1);
    return f.kp[en];
  }
  function unlocked(subject) {
    const k = kp(subject);
    return NEED.filter(n => k >= n).length;
  }
  function totalNodes() {
    return Object.keys(TREE).reduce((s, s2) => s + unlocked(s2), 0);
  }

  /* 答题统一入口：q = { q, opts, a }，my = 所选下标（答对答错都计入统计） */
  function answer(subject, q, my) {
    if (!q || !q.opts) return;
    const f = F();
    // —— 每日答题统计（保留近 30 天） ——
    f.quizLog = f.quizLog || {};
    const day = ADV.Cal.day;
    const rec = f.quizLog[day] || (f.quizLog[day] = { n: 0, ok: 0 });
    rec.n++;
    if (my === q.a) {
      rec.ok++;
      gain(subject, 1);                   // 答对得 1 个知识点
      trimLog(f);
      return;
    }
    // —— 答错入本：同题只记一条，次数累加、盒子归零 ——
    f.wrong = f.wrong || {};
    const id = subject + '#' + q.q;
    const w = f.wrong[id] || (f.wrong[id] = { subject: subject || '综合', q: q.q, opts: q.opts, a: q.a, day, n: 0, box: 0 });
    w.n++;
    w.box = 0;
    w.due = day + IVAL[0];
    trimLog(f);
  }
  function trimLog(f) {
    const keys = Object.keys(f.quizLog);
    if (keys.length > 36)
      keys.sort((a, b) => a - b).slice(0, keys.length - 30).forEach(k => delete f.quizLog[k]);
  }

  function all() { return F().wrong || {}; }
  function dueList() {
    const w = all(), day = ADV.Cal.day;
    return Object.keys(w).filter(k => w[k].due <= day);
  }

  /* 复习一题：答对进下一盒（过第四盒 = 掌握，移出错题本并得知识点），答错回第一盒 */
  function review(id, right) {
    const w = all()[id];
    if (!w) return 'none';
    if (right) {
      w.box++;
      if (w.box >= IVAL.length) { delete F().wrong[id]; gain(w.subject, 1); return 'mastered'; }
      w.due = ADV.Cal.day + IVAL[w.box];
      return 'ok';
    }
    w.n++;
    w.box = 0;
    w.due = ADV.Cal.day + IVAL[0];
    return 'again';
  }

  function stats() {
    return { total: Object.keys(all()).length, due: dueList().length };
  }
  /* 最近 7 天答题统计 */
  function quizStats() {
    const log = F().quizLog || {}, day = ADV.Cal.day;
    let n = 0, ok = 0, days = 0;
    for (let d = Math.max(1, day - 6); d <= day; d++) {
      const r = log[d]; if (!r) continue;
      days++; n += r.n; ok += r.ok;
    }
    return { n, ok, days, rate: n ? Math.floor(ok / n * 100) : 0 };
  }

  return { IVAL, CN2EN, EN2CN, TREE, NEED, answer, all, dueList, review, stats, quizStats,
           gain, kp, unlocked, totalNodes };
})();
