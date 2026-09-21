/* =========================================================
 * battle.js —— 回合制对抗（GBA 式攻防博弈）
 * ADV.Battle.start(enemyKey, opts, onDone)
 *   普通战：onDone(true 胜 / false 负·逃)
 *   宠物战 opts.petMode：野生小伙伴画布对战，
 *     onDone({ outcome:'caught'|'win'|'lose'|'fled', myHp, foeHp })
 * 菜单：攻击（武术/咒语两栏）/ 防御（武防·魔防博弈）/ 道具 / 逃跑
 *   —— 武术招吃 def，咒语招吃 mdef=def×0.5；PP 制替换旧冷却
 *   —— 敌方会读招：残血或我方上回合大威力后，按我方出招倾向猜拳防御
 * 失败不 Game Over：HP 归 1 结束，剧情自行处理
 * BOSS「遗忘之雾」专用：可打出收藏的照片（回忆攻击，C 键）
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.Battle = (function () {
  const W = 960, H = 640;
  const FONT = (s, w) => `${w || 'bold'} ${s}px "Microsoft YaHei", "PingFang SC", sans-serif`;

  /* ---------- 敌人图鉴（HP 上调 20%，金币 +25%；mag=魔攻倾向 0 武 1 魔） ---------- */
  const ENEMIES = {
    dummy:    { name: '木人桩', hp: 36, atk: 6, def: 1, spd: 2, mag: 0, pal: 'studentC', intro: '道场的木人桩，练手专用。', drop: { gold: 6 } },
    dazhuang: { name: '大壮', hp: 72, atk: 10, def: 5, spd: 3, mag: 0, pal: 'xiaopang', intro: '乌云帮打手——块头大，出拳沉。', drop: { gold: 25 } },
    xiaoying: { name: '小影', hp: 55, atk: 13, def: 2, spd: 9, mag: 1, pal: 'studentA', intro: '乌云军师，出手快如影子。', drop: { gold: 25 } },
    wuyun:    { name: '乌云', hp: 94, atk: 12, def: 3, spd: 5, mag: 1, pal: 'xiaogang', intro: '乌云帮老大——留级一年，只为等一个对手。', drop: { gold: 50 } },
    rival:    { name: '对手班主力', hp: 77, atk: 11, def: 3, spd: 5, mag: 0, pal: 'studentB', intro: '运动会的宿敌班。', drop: { gold: 31 } },
    jinpeng:  { name: '金鹏', hp: 100, atk: 12, def: 4, spd: 7, mag: 0, pal: 'jinpeng', intro: '篮球队王牌——球场上没输过，不想在你这儿破例。', drop: { gold: 40 } },
    sensei:   { name: '保安大爷', hp: 144, atk: 14, def: 6, spd: 6, mag: 1, pal: 'keeper', intro: '传说中退役的武林高手……扫帚即是剑。', drop: { gold: 100 } },
    shadowM:  { name: '遗忘之雾', hp: 180, atk: 13, def: 4, spd: 6, mag: 1, pal: 'grey', boss: true,
                intro: '由被遗忘的记忆凝成——唯有回忆能伤害它。', drop: { gold: 125 } }
  };

  /* ---------- 招式注册表（数据驱动：cat 武术wu/咒语mo，kind 见各分支） ---------- */
  const nd = s => (ADV.Mistake ? ADV.Mistake.unlocked(s) : 0);
  const frHas = (id, st) => { const r = ADV.Game.friends[id]; return r && r.stage >= st; };
  const ML = f => (f.martial && f.martial.lvl) || 0;
  const MOVES = [
    // —— 保底体术：常驻不限 PP，解决「没学技能就没得选」的空窗 ——
    { key: 'strike', name: '体术', cat: 'wu', kind: 'atk', pow: 10, pp: 99, col: '#e8ecff', base: true },
    // —— 武术 · 武林秘诀 ——
    { key: 'sweep', name: '扫帚剑法', cat: 'wu', kind: 'atk', pow: 13, pp: 6, col: '#c98d5a', need: f => f.martial && f.martial.sweep, powAdd: f => ML(f) * 4 },
    { key: 'steps', name: '乌云十八步', cat: 'wu', kind: 'boost', pp: 3, col: '#8a94c0', need: f => f.martial && f.martial.steps },
    { key: 'tie', name: '铁臂功', cat: 'wu', kind: 'shield', pow: 3, pp: 3, col: '#e8a03a', need: f => f.martial && f.martial.tie },
    { key: 'listen', name: '听风辨位', cat: 'wu', kind: 'crit', pp: 3, col: '#d8c078', need: f => f.martial && f.martial.listen },
    { key: 'heart', name: '晨曦心法', cat: 'wu', kind: 'heal', pow: 30, pp: 5, col: '#7af0e8', need: f => f.martial && f.martial.heart },
    // —— 武术 · 刘家拳武术课 ——
    { key: 'palm', name: '崩山掌', cat: 'wu', kind: 'atk', pow: 14, pp: 5, col: '#e07a5a', need: f => f.martial && f.martial.palm, powAdd: f => ML(f) * 3 },
    { key: 'leg', name: '旋风连环腿', cat: 'wu', kind: 'atk', pow: 11, pp: 5, col: '#f0b45a', need: f => f.martial && f.martial.leg, powAdd: f => ML(f) * 2 },
    { key: 'qi', name: '云手气功', cat: 'wu', kind: 'heal', pow: 20, pp: 4, col: '#7af0a8', need: f => f.martial && f.martial.qi },
    { key: 'peak', name: '青峰诀', cat: 'wu', kind: 'atk', pow: 22, pp: 3, col: '#7ab8f0', need: f => f.martial && f.martial.peak },
    // —— 咒语 · 徽章技（学科技能借知识点升威力） ——
    { key: 'math', name: '数学光波', cat: 'mo', kind: 'atk', pow: 16, pp: 6, col: '#5a8aff', need: f => f.badges && f.badges.math, powAdd: f => nd('math') },
    { key: 'cn', name: '诗词剑气', cat: 'mo', kind: 'atk', pow: 19, pp: 4, col: '#ff6a7a', need: f => f.badges && f.badges.chinese, powAdd: f => nd('chinese') },
    { key: 'sci', name: '科学护盾', cat: 'mo', kind: 'shield', pp: 3, col: '#4ae86c', need: f => f.badges && f.badges.science },
    { key: 'en', name: '英语咒语', cat: 'mo', kind: 'weaken', pow: 3, pp: 3, col: '#ffd94c', need: f => f.badges && f.badges.english },
    // —— 咒语 · 挚友技 ——
    { key: 'hong', name: '小红的加油', cat: 'mo', kind: 'heal', pow: 16, pp: 3, col: '#ff8ab0', need: () => frHas('xiaohong', 2) },
    { key: 'zhuang', name: '大壮的铁壁', cat: 'wu', kind: 'shield', pow: 2, pp: 3, col: '#e8a03a', need: () => frHas('dazhuang', 2) },
    { key: 'yun', name: '乌云的看破', cat: 'mo', kind: 'boost', pp: 4, col: '#8a94c0', need: () => frHas('wuyun', 2) },
    { key: 'ying', name: '小影的会心', cat: 'mo', kind: 'crit', pp: 4, col: '#b98af5', need: () => frHas('xiaoying', 2) },
    // —— 咒语 · 魔法 ——
    { key: 'bolt', name: '月光弹', cat: 'mo', kind: 'atk', pow: 18, pp: 4, col: '#8ad0ff', need: f => f.spells && f.spells.bolt },
    { key: 'guardS', name: '星之盾', cat: 'mo', kind: 'shield', pow: 3, pp: 3, col: '#d8c078', need: f => f.spells && f.spells.guard },
    { key: 'bind', name: '缚影咒', cat: 'mo', kind: 'weaken', pow: 4, pp: 3, col: '#5a4ae0', need: f => f.spells && f.spells.bind },
    { key: 'dawn', name: '晨光治愈', cat: 'mo', kind: 'heal', pow: 26, pp: 4, col: '#b6f0d0', need: f => f.spells && f.spells.dawn },
  ];
  const CAT_LABEL = { wu: '武术', mo: '咒语' };

  /* ---------- 宠物招式表（petMode） ---------- */
  const FAM_MOVE = { 虫: ['虫鸣乱舞', '#a8e88a'], 水: ['水花射击', '#8ad0ff'], 兽: ['猛扑', '#f0b45a'] };
  function petMoves(fam) {
    return [
      { key: 'tackle', name: '冲撞', kind: 'atk', pow: 8, pp: 99, col: '#e8ecff', base: true },
      { key: 'famAtk', name: (FAM_MOVE[fam] || ['猛扑'])[0], col: (FAM_MOVE[fam] || [0, '#f0b45a'])[1], kind: 'atk', pow: 10, pp: 4 },
      { key: 'cheer', name: '鼓劲', kind: 'cheer', pp: 2, col: '#ff8ab0' }
    ];
  }
  /* 三系克制：虫克水 → 水克兽 → 兽克虫（循环 ×1.5，被克 0.75，同系 1） */
  const FAM_ADV = { '虫水': 1.5, '水兽': 1.5, '兽虫': 1.5 };
  const famAdv = (a, b) => a === b ? 1 : (FAM_ADV[a + b] || .75);

  let act = null;

  function text(g, s, x, y, size, color, align) {
    g.font = FONT(size); g.textAlign = align || 'center'; g.textBaseline = 'top';
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillText(s, x + 2, y + 2);
    g.fillStyle = color; g.fillText(s, x, y);
  }

  function playerStats() {
    const F = ADV.Game.flags;
    const stages = Object.values(ADV.Game.friends || {}).reduce((s, r) => s + (r.stage || 0), 0);
    let atk = 10 + Object.values(F.badges).filter(Boolean).length * 2 + Math.floor((F.cup || 0) / 15);
    if (F.party) atk += 2;            // 同伴同行：气势加成
    if (F.dogPal) atk += 2;           // 煤球：忠犬加成
    // 知识树加成：点亮的节点越多底气越足（攻击最多 +10，血量 +2/节点）
    const nodes = ADV.Mistake ? ADV.Mistake.totalNodes() : 0;
    atk += Math.min(10, Math.floor(nodes / 2));
    const martial = F.martial || {};
    atk += (martial.lvl || 0) * 2;                       // 武学修为：道场修炼
    if (martial.tie) atk += 1;                           // 铁臂功：筋骨强化
    return {
      hp: 46 + Object.values(F.badges).filter(Boolean).length * 10 + stages * 3 + nodes * 2,
      atk, def: 2 + Math.floor(stages / 3) + (martial.tie ? 1 : 0), spd: 5 + (martial.steps ? 1 : 0)
    };
  }
  /* 可用招式：MOVES 注册表按 need 过滤（体术 base 常驻）；
   * pow 加算 powAdd（武学修为/知识点）。供战斗内与冒烟测试使用 */
  function skillList() {
    const F = ADV.Game.flags;
    return MOVES.filter(m => !m.need || m.need(F))
      .map(m => ({ key: m.key, name: m.name, cat: m.cat, kind: m.kind, col: m.col, base: !!m.base,
                   pow: (m.pow || 0) + (m.powAdd ? m.powAdd(F) : 0), pp: m.pp }));
  }

  /* ---------- 纯函数公式（导出供测试） ---------- */
  /* 伤害：武术吃满 def，咒语吃 mdef=ceil(def*0.5)；基础 = atk*pow/12 - 防 */
  function calcDamage(atk, pow, def, cat) {
    const guard = cat === 'mo' ? Math.ceil(def * .5) : def;
    return Math.max(1, Math.round(atk * pow / 12 - guard));
  }
  /* 逃跑：速度差 ×5%，尝试次数 +15%，上限 95% */
  function fleeChance(mySpd, foeSpd, tries) {
    return Math.min(.95, .35 + (mySpd - foeSpd) * .05 + .15 * (tries || 0));
  }
  /* 捕捉（GBA 思想移植）：HP 磨得越白越好抓；M=目标满血 H=当前血
   * tame：阿橘「轻声细语」驯兽技巧的固定加成（s12.3），进乘区、同受 .92 封顶 */
  const BALL_BONUS = [1.25, 1.6, 2.2];                   // 树叶/藤编/月光
  function catchChance(hpRatio, ballTier, weary, fed, tame) {
    const H = Math.min(1, Math.max(0, hpRatio));
    const ball = BALL_BONUS[ballTier] || 1.25;
    return Math.min(.92, (3 - 2 * H) / 3 * .6 * ball * (1 + (weary ? .5 : 0) + Math.min(fed || 0, 2) * .1 + (tame || 0)));
  }
  /* 宠物战伤害：力差主导 + 招式威力，克制乘区 */
  function petDamage(myPow, movePow, foePow, eff, rnd) {
    return Math.max(1, Math.round((myPow * 3 + movePow - foePow * 2) * eff * (.9 + (rnd == null ? Math.random() : rnd) * .2)));
  }
  /* 知识树 × 宠物战（s13.1）：课堂知识是锦上添花，三维数值仍是主导
   * nodes = 各科已点亮节点数（Mistake.unlocked）；返回战斗内消费的四项加成 */
  function petBonus(nodes) {
    const n = nodes || {};
    return {
      spdAdd: Math.min(3, n.english || 0),                       // 英语：先攻
      critCh: Math.min(.15, .05 + .02 * (n.math || 0)),          // 数学：会心（×1.5）
      cheerMul: 1.35 + .03 * (n.chinese || 0),                   // 语文：鼓劲更痛
      guardFac: Math.max(.35, .5 - .03 * (n.science || 0)),      // 科学：守护减伤更强
    };
  }
  /* 驯兽导师「进化催化」（三期C）：山隐婆婆为随行伙伴点开的潜力——力/速各 +1 */
  function buddyBoost() {
    const b = ADV.Game.flags && ADV.Game.flags.buddyBoost;
    return b ? { pow: b.pow || 0, spd: b.spd || 0 } : { pow: 0, spd: 0 };
  }
  /* 武馆 × 宠物战交叉（玩2/P-B3）：随行小伙伴的援护技——你濒危时它扑出来咬一口
   * 纯函数：援护伤害 = max(3, round(伙伴力 ×2.5))；每场一次、体力过三成才敢上场 */
  function assistPower(buddyPow) { return Math.max(3, Math.round((buddyPow || 0) * 2.5)); }
  /* 吴老师 petMode 支援指令（三期A）：学过咒语且上过「支援特训」——
   * 星之盾/晨光治愈/缚影咒/月光弹可在宠物战各用一次 */
  function petSupport() {
    const f = ADV.Game.flags || {};
    if (!(f.tame && f.tame.wu)) return [];
    const out = [];
    if (f.spells && f.spells.guard) out.push({ key: 'guardS', name: '星之盾（守护架势）', col: '#d8c078' });
    if (f.spells && f.spells.dawn) out.push({ key: 'dawn', name: '晨光治愈（回三成体力）', col: '#b6f0d0' });
    if (f.spells && f.spells.bind) out.push({ key: 'bind', name: '缚影咒（敌方乏力）', col: '#5a4ae0' });
    if (f.spells && f.spells.bolt) out.push({ key: 'bolt', name: '月光弹（魔法一击）', col: '#8ad0ff' });
    return out;
  }

  function start(enemyKey, opts, onDone) {
    if (act) return;
    opts = opts || {};
    if (opts.petMode) {                                  // —— 宠物战：野生小伙伴画布对战 ——
      const cr = ADV.Collect ? ADV.Collect.critter(enemyKey) : null;
      if (!cr) { if (onDone) onDone(false); return; }
      const SK = ADV.Skills;
      const bud = opts.buddy;
      const myCr = bud ? ADV.Collect.critter(bud.id) : null;
      const foeMax = cr.hp * 6 + 20;
      if (!myCr) {                                         // 没伙伴助战：仍可进场丢球 / 喂诱饵（野生侧不攻击）
        act = {
          petMode: true, onDone, opts: { ...opts, noBuddy: true },
          e: { name: cr.name, fam: cr.fam, hp: foeMax, hpMax: foeMax, pow: cr.pow, spd: cr.spd, bait: cr.bait || [], intro: `${cr.fam}系 · 稀有${'★'.repeat(cr.rar || 1)}` },
          me: { name: '——', fam: null, hp: 0, hpMax: 0, pow: 0, spd: 0, shiny: false, out: true },
          skills: [], mode: 'menu', sel: 0, catSel: 0, log: [`野生的${cr.name}跳了出来！`],
          pps: {}, fed: 0, weary: false, cheer: false, petGuard: false, tries: 0,
          flash: 0, shake: 0, pops: [], turn: 1
        };
        ADV.Audio.playBgm('battle'); ADV.Audio.sfx('start');
        return;
      }
      const myMax = myCr.pow * 6 + 20 + (SK ? SK.duelHp() : 0);
      const nd = s => (ADV.Mistake ? ADV.Mistake.unlocked(s) : 0);
      const edu = petBonus({ english: nd('english'), chinese: nd('chinese'), math: nd('math'), science: nd('science') });
      /* A2 亲密度对战化：buddyBond 进战斗——≥30 每回合回 1 体力；≥60 首次被击倒稳住剩 1HP */
      const bb = (ADV.Game && ADV.Game.flags && ADV.Game.flags.buddyBond) || 0;
      edu.bond = bb >= 60 ? 2 : bb >= 30 ? 1 : 0;
      const bst = buddyBoost();
      const hasSup = petSupport().length > 0;
      act = {
        petMode: true, onDone, opts,
        e: { name: cr.name, fam: cr.fam, hp: foeMax, hpMax: foeMax, pow: cr.pow, spd: cr.spd, bait: cr.bait || [], intro: `${cr.fam}系 · 稀有${'★'.repeat(cr.rar || 1)}` },
        me: { name: myCr.name, fam: myCr.fam, hp: Math.min(myMax, Math.max(0, bud.hp == null ? myMax : bud.hp)), hpMax: myMax,
              pow: myCr.pow + bst.pow, spd: myCr.spd + bst.spd + (SK ? SK.duelSpd() : 0) + edu.spdAdd, shiny: !!bud.shiny },
        skills: petMoves(myCr.fam),
        mode: 'menu', sel: 0, catSel: 0, log: [`野生的${cr.name}跳了出来！`],
        pps: {}, fed: 0, weary: false, cheer: false, petGuard: false, tries: 0,
        flash: 0, shake: 0, pops: [], turn: 1, edu, bondUsed: false,
        foeWeak: false, sups: {}, boosted: !!(bst.pow || bst.spd)
      };
      for (const m of act.skills) act.pps[m.key] = m.pp;
      petSupport().forEach(s => { act.sups[s.key] = 1; });      // 支援咒语每场各一次
      const eduTips = [];
      if (edu.spdAdd) eduTips.push('英语+速度');
      if (edu.critCh > .05) eduTips.push('数学+会心');
      if (edu.cheerMul > 1.35) eduTips.push('语文+鼓劲');
      if (edu.guardFac < .5) eduTips.push('科学+守护');
      if (edu.bond >= 1) eduTips.push(`亲密度${bb}：每回合回一口气`);
      if (edu.bond >= 2) eduTips.push('倒下前稳住一次');
      if (hasSup) eduTips.push('吴老师支援咒语已备好（菜单·支援）');
      if (act.boosted) eduTips.push('进化催化之力涌动着');
      if (eduTips.length) act.log.unshift(`📖 课堂知识在支持着${myCr.name}！（${eduTips.join(' / ')}）`);
      ADV.Audio.playBgm('battle'); ADV.Audio.sfx('start');
      return;
    }
    const e0 = ENEMIES[enemyKey];
    if (!e0) { if (onDone) onDone(false); return; }
    const ps = playerStats();
    /* P-B5 强度墙：连战模式 opts.tier——每级敌血 +35%、攻 +18%，金币按同档放大 */
    let e = e0;
    if (opts.tier > 1) {
      const t = opts.tier;
      e = { ...e0,
        hp: Math.round(e0.hp * (1 + .35 * (t - 1))),
        atk: Math.round(e0.atk * (1 + .18 * (t - 1))),
        name: e0.name + (opts.tierTag || '') };
      if (e.drop && e.drop.gold) e.drop = { ...e.drop, gold: Math.round(e.drop.gold * (1 + .25 * (t - 1))) };
    }
    act = {
      e: { ...e, hpMax: e.hp, hp: e.hp, atkBuff: 0 }, opts, onDone,
      php: ps.hpMax || ps.hp, phpMax: Math.max(ps.php || ps.hp, ps.hp),
      patk: ps.atk, pdef: ps.def, pspd: ps.spd,
      mode: 'menu', sel: 0, catSel: 0, log: [e.intro],
      skills: skillList(), pps: {}, guard: null, shield: 0, boost: 0, crit: 0,
      tries: 0, wuCount: 0, moCount: 0, lastPow: 0,
      turn: 1, photos: (opts.photoMode ? (ADV.Collect ? ADV.Collect.ids('photos') : []) : null),
      photoIdx: 0, flash: 0, shake: 0, pops: []          // pops：伤害/治疗飘字
    };
    for (const m of act.skills) act.pps[m.key] = m.pp;
    if (!act.phpMax) act.phpMax = act.php;
    /* P-B3 援护技：带着随行伙伴（且它体力还过三成）上场，濒危时它会扑出来咬一口——每场一次 */
    const bf = ADV.Game.flags, budE = bf && bf.buddy ? ADV.Collect.critter(bf.buddy.id) : null;
    if (budE) {
      const full = budE.pow * 6 + 20, cur = bf.wildHp == null ? full : bf.wildHp;
      if (cur > full * .3) act.aid = { used: false, pow: budE.pow + buddyBoost().pow, name: budE.name };
    }
    ADV.Audio.playBgm(e.boss ? 'boss' : 'battle');
    ADV.Audio.sfx('start');
    // 煤球开场偷袭
    if (ADV.Game.flags.dogPal) {
      act.e.hp -= 8;
      act.log.unshift('🐕 煤球冲上去咬了对方一口！（-8）');
    }
  }

  /* 结局：win 胜 / lose 负 / fled 溜走 / caught 收服 */
  function finish(outcome) {
    const cb = act.onDone, e = act.e;
    const petMode = act.petMode, myHp = petMode ? act.me.hp : act.php;
    const foeHp = e.hp;
    act = null;
    const win = outcome === 'win' || outcome === 'caught';
    ADV.Audio.sfx(win ? 'fanfare' : 'cancel');
    const F = ADV.Game.flags;
    if (petMode) {                                       // 宠物战不进成长结算
      try { const m = ADV.Engine.map; if (m && m.bgmCur) ADV.Audio.playBgm(m.bgmCur); else if (m && m.bgm) ADV.Audio.playBgm(m.bgm); } catch (err) {}
      if (cb) cb({ outcome, myHp: Math.max(0, myHp), foeHp: Math.max(0, foeHp) });
      return;
    }
    const drop = e.drop || {};
    if (outcome === 'win' && drop.gold) { F.gold = (F.gold || 0) + drop.gold; ADV.UI.toast(` 💰 战斗胜利！金币 +${drop.gold} `); }
    if (outcome === 'win' && drop.cup) { F.cup = (F.cup || 0) + drop.cup; }
    if (outcome === 'fled') ADV.UI.toast(' 🏃 成功溜走了！');
    if (ADV.Growth) {
      if (outcome === 'win') { ADV.Growth.addXP(e.boss ? 25 : 10, '战斗胜利'); ADV.Growth.addDim('body', 2, '战斗磨砺'); }
      else if (outcome === 'lose') ADV.Growth.addXP(3, '虽败犹荣');
      // fled：全身而退不加经验，也不算败
    }
    ADV.Game.save();
    // 恢复场景音乐
    try { const m = ADV.Engine.map; if (m && m.bgmCur) ADV.Audio.playBgm(m.bgmCur); else if (m && m.bgm) ADV.Audio.playBgm(m.bgm); } catch (err) {}
    if (cb) cb(outcome === 'win');
  }

  // 伤害/治疗飘字（t 秒内上飘渐隐）
  function pop(txt, col, x, y) { act.pops.push({ txt, col, x, y, t: 0 }); }

  /* ---------- 敌方读招 AI：残血或我方上回合大威力后，按出招倾向猜拳防御 ---------- */
  function enemyIntent() {
    const a = act, e = a.e;
    const lowHp = e.hp < e.hpMax * .4;
    if ((lowHp || a.lastPow >= 16) && Math.random() < .6) {
      const guessWu = a.wuCount >= a.moCount;            // 我常用武术招 → 猜武术（60% 猜对路径）
      return Math.random() < .6
        ? (guessWu ? 'defWu' : 'defMo')
        : (guessWu ? 'defMo' : 'defWu');
    }
    return 'atk';
  }
  /* 防御减伤：同系 70%，错配 20%；武防反震 / 魔防吸星 25% */
  function guardFactor(guardCat, atkCat) { return guardCat === atkCat ? .3 : .8; }

  function playerAttackMove(sk) {
    const a = act, e = a.e;
    a.pps[sk.key]--;
    let d = calcDamage(a.patk, sk.pow, e.def, sk.cat);
    d *= .85 + Math.random() * .3;                       // ±15% 浮动
    if (sk.cat === 'wu') a.wuCount++; else a.moCount++;  // 读招倾向计数
    a.lastPow = sk.pow;
    let crit = a.crit > 0 || Math.random() < 1 / 16;
    if (a.crit > 0) a.crit--;
    if (crit) d *= 1.8;
    if (a.boost > 0) { d *= 1.35; a.boost--; }
    if (ADV.Skills) d *= ADV.Skills.duelDmg();           // 战斗系 Lv2/Lv4 各 ×1.1
    if (e.guard) {                                       // 敌方防御姿态：同系大减
      const f = guardFactor(e.guard, sk.cat);
      const cut = d; d *= f;
      if (f < .5) a.log.unshift(`${e.name}看穿了你的${CAT_LABEL[sk.cat]}——伤害大幅减少！`);
      if (e.guard === 'wu') { const r = Math.ceil(cut * .25 * (1 - f)); e.hp -= r; pop('-' + r, '#e8a03a', W / 2 + 40, 150); a.log.unshift('反震！它被自己的架势震伤了。'); }
      e.guard = null;
    }
    d = Math.max(1, Math.round(d));
    e.hp -= d; a.flash = .3; a.shake = .3;
    pop('-' + d, crit ? '#ffd94c' : sk.col, W / 2 + 40, 150);
    a.log.unshift(`${crit ? '会心一击！' : ''}✦ ${sk.name}！对${e.name}造成 ${d} 点伤害！`);
  }

  function playerAct(i, sub) {
    const a = act, e = a.e;
    if (i === 'move') {
      const sk = a.skills[sub];
      if (!sk) return false;
      if ((a.pps[sk.key] || 0) <= 0) { a.log.unshift(`${sk.name}的 PP 耗尽了……`); return false; }
      if (sk.kind === 'atk') { playerAttackMove(sk); return true; }
      a.pps[sk.key]--;
      if (sk.cat === 'wu') a.wuCount++; else a.moCount++;
      a.lastPow = 0;
      if (sk.kind === 'heal') { a.php = Math.min(a.phpMax, a.php + sk.pow); a.log.unshift(`✦ ${sk.name}！回复了 ${sk.pow} 点体力！`); pop('+' + sk.pow, '#4ae86c', 150, 500); }
      else if (sk.kind === 'shield') { a.shield = 2 + (sk.pow > 2 ? 1 : 0); a.log.unshift(`✦ ${sk.name}！护盾！接下来 ${a.shield} 回合受伤减半。`); pop('护盾!', '#8ad0ff', 150, 500); }
      else if (sk.kind === 'weaken') { e.atkBuff = -(sk.pow || 3); a.log.unshift(`✦ ${sk.name}！${e.name}的攻击力下降了。`); pop('攻击↓', '#b98af5', W / 2 + 40, 150); }
      else if (sk.kind === 'boost') { a.boost = 3; a.log.unshift(`✦ ${sk.name}！你看见了破绽，攻击力上升！`); pop('攻击↑', '#ffd94c', 150, 500); }
      else if (sk.kind === 'crit') { a.crit = 3; a.log.unshift(`✦ ${sk.name}！接下来更容易会心一击！`); pop('会心↑', '#ffd94c', 150, 500); }
      return true;
    }
    if (i === 'defend') {                                // 武/魔博弈：本回合防御姿态
      a.guard = sub === 'wu' ? 'wu' : 'mo';
      a.lastPow = 0;
      a.log.unshift(sub === 'wu' ? '你摆开武术防御的架势——以刚克刚！' : '你结起魔法防御的屏障——以柔化劲！');
      pop(sub === 'wu' ? '武防!' : '魔防!', '#8ad0ff', 150, 500);
      return true;
    }
    if (i === 'item') {
      const it = a.items[sub];
      if (!it) { a.log.unshift('没有可用的道具……'); return false; }
      ADV.Collect.useItem(it.id);
      a.php = Math.min(a.phpMax, a.php + (it.heal || 16));
      a.log.unshift(`你吃掉了${it.name}，回复了体力！`);
      pop('+' + (it.heal || 16), '#4ae86c', 150, 500);
      return true;
    }
    return false;
  }

  function photoStrike() {
    const a = act;
    if (!a.photos || a.photoIdx >= a.photos.length) return false;
    const pid = a.photos[a.photoIdx++];
    const info = ADV.Collect ? ADV.Collect.info('photos', pid) : null;
    const nm = info ? info.name : '回忆';
    const d = 22 + ((Math.random() * 10) | 0);
    a.e.hp -= d;
    a.php = Math.min(a.phpMax, a.php + 8);
    a.flash = .5; a.shake = .5;
    pop('-' + d, '#8ad0ff', W / 2 + 40, 150);
    pop('+8', '#4ae86c', 150, 500);
    a.log.unshift(`📷 打出回忆「${nm}」！\n温暖的记忆化作光芒，造成 ${d} 点伤害，回复 8 点体力！`);
    return true;
  }

  /* ---------- 敌方行动（普通战）：atk 攻击 / defX 防御（防御落空=白摆架势） ---------- */
  function enemyTurn(intent) {
    const a = act, e = a.e;
    if (e.hp <= 0) return;
    if (intent === 'defWu' || intent === 'defMo') {
      if (a.playerAttacked) { e.guard = null; return; }  // 减伤已在玩家攻击时结算
      e.guard = intent === 'defWu' ? 'wu' : 'mo';
      a.log.unshift(`${e.name}摆出了${intent === 'defWu' ? '武术' : '魔法'}防御——但你没上当！`);
      return;
    }
    const cat = e.mag ? 'mo' : 'wu';
    let atk = Math.max(1, e.atk + (e.atkBuff || 0));
    let d = calcDamage(atk, 10, a.pdef, cat);
    d *= .85 + Math.random() * .3;
    if (e.atkBuff < 0) d *= .75;                         // 被削弱：输出 ×0.75
    let crit = Math.random() < 1 / 16;
    if (crit) d *= 1.8;
    d = Math.max(1, Math.round(d));
    if (a.guard) {                                       // 我方防御：同系减 70% + 反震/吸星
      const f = guardFactor(a.guard, cat);
      const cut = d; d = Math.max(1, Math.round(d * f));
      if (f < .5) {
        a.log.unshift(`你看穿了它的${cat === 'wu' ? '武术' : '魔法'}招！伤害大幅减少。`);
        if (a.guard === 'wu') { const r = Math.ceil(cut * .25 * (1 - f)); e.hp -= r; pop('-' + r, '#e8a03a', W / 2 + 40, 150); a.log.unshift(`反震！${e.name}受到 ${r} 点反伤！`); }
        else { const h = Math.ceil(cut * .25 * (1 - f)); a.php = Math.min(a.phpMax, a.php + h); pop('+' + h, '#4ae86c', 150, 500); a.log.unshift(`吸星！回复了 ${h} 点体力。`); }
      }
      a.guard = null;
    }
    if (a.shield > 0) { d = Math.ceil(d / 2); a.shield--; }
    a.php -= d;
    pop('-' + d, '#ff5a5a', 150, 500);
    a.log.unshift(`${e.name}的${cat === 'mo' ? '魔法' : '攻击'}！你受到 ${d} 点伤害。${crit ? '（会心！）' : ''}`);
    tryAssist();
    // 高速敌人概率二连
    const twice = e.spd >= 8 && Math.random() < .3;
    if (twice) { let d2 = Math.ceil(calcDamage(atk, 10, a.pdef, cat) / 2); if (a.shield > 0) { d2 = Math.ceil(d2 / 2); a.shield--; } a.php -= d2; pop('-' + d2, '#ff5a5a', 190, 520); a.log.unshift('它的速度太快，又补了一击！'); tryAssist(); }
    a.shake = .4;
  }
  /* P-B3 援护技：体力过四成且随行伙伴在场时，第一次被打到濒危线，它扑出来咬一口 + 帮你回一口气 */
  function tryAssist() {
    const a = act;
    if (!a || a.petMode || !a.aid || a.aid.used) return;
    if (a.php <= 0 || a.php > a.phpMax * .4) return;
    a.aid.used = true;
    const d = assistPower(a.aid.pow);
    a.e.hp -= d;
    const h = 6;
    a.php = Math.min(a.phpMax, a.php + h);
    a.flash = .4; a.shake = .4;
    pop('-' + d, '#f0b45a', W / 2 + 40, 150);
    pop('+' + h, '#4ae86c', 150, 500);
    a.log.unshift(`🐾 千钧一发——${a.aid.name}从你身后扑了出来！${e2name()}受到 ${d} 点伤害，还替你挡下了心慌（+${h}）。`);
  }
  function e2name() { return act ? act.e.name : ''; }

  /* ---------- 宠物战：双方按速度定序各行动一击 ---------- */
  function petRound(myAction) {
    const a = act, me = a.me, e = a.e;
    if (a.opts.noBuddy) return;                          // 无伙伴战：野生侧不攻击（只剩丢球 / 喂食 / 溜走）
    const foeMove = { name: '冲撞', pow: a.foeWeak ? 5 : 8 };
    let myAct = myAction;                                // {type:'move',sk} / {type:'support',key} / {type:'item'} / {type:'flee'} 已在别处处理
    const myFirst = me.spd >= e.spd;
    const seq = myFirst ? ['me', 'foe'] : ['foe', 'me'];
    // 敌方行动
    const foeStrike = () => {
      if (e.hp <= 0 || me.hp <= 0) return;
      const eff = famAdv(e.fam, me.fam);
      let d = petDamage(e.pow, foeMove.pow, me.pow, eff);
      if (a.petGuard) { d = Math.max(1, Math.ceil(d * (a.edu ? a.edu.guardFac : .5))); a.log.unshift(`${me.name}鼓劲蓄力，稳稳架住了这一击！（伤害减半）`); }
      me.hp -= d;
      pop('-' + d, '#ff5a5a', 150, 500);
      a.log.unshift(`野生的${e.name}使出冲撞！${me.name}受到 ${d} 点伤害。${eff > 1 ? '（被克制…）' : ''}`);
      a.shake = .35;
    };
    const myStrike = sk => {
      if (e.hp <= 0 || me.hp <= 0) return;
      const eff = famAdv(me.fam, e.fam);
      let d = petDamage(me.pow, sk.pow, e.pow, eff);
      if (a.cheer) { d = Math.round(d * (a.edu ? a.edu.cheerMul : 1.35)); }
      const crit = !!(a.edu && a.edu.critCh > 0 && Math.random() < a.edu.critCh);   // 数学节点：会心 ×1.5
      if (crit) d = Math.max(1, Math.round(d * 1.5));
      e.hp -= d;
      a.flash = .35;
      pop('-' + d, sk.col || '#ffd94c', W / 2 + 40, 150);
      a.log.unshift(`${me.name}使出${sk.name}！${e.name}受到 ${d} 点伤害！${crit ? '（会心一击！）' : ''}${eff > 1 ? '（属性相克，效果绝佳！）' : eff < 1 ? '（被克制，效果不佳…）' : ''}`);
    };
    /* 吴老师支援指令（三期A）：咒语从观众席飞进赛场——各一次，耗掉玩家本回合 */
    const doSupport = key => {
      a.sups[key] = 0;
      if (key === 'guardS') { a.petGuard = true; a.log.unshift('✦ 星之盾！星光落在' + me.name + '身上，架势稳了。（本回合守护）'); pop('守护!', '#d8c078', 150, 500); }
      else if (key === 'dawn') {
        const h = Math.ceil(me.hpMax * .3);
        me.hp = Math.min(me.hpMax, me.hp + h);
        a.log.unshift(`✦ 晨光治愈！暖光裹住${me.name}——体力 +${h}。`); pop('+' + h, '#4ae86c', 150, 500);
      } else if (key === 'bind') { a.foeWeak = true; a.log.unshift('✦ 缚影咒！黑链缠住对手的影子——它的冲撞乏力了。'); pop('攻击↓', '#5a4ae0', W / 2 + 40, 150); }
      else if (key === 'bolt') {
        const d = Math.max(6, Math.round(10 + me.pow * 1.2));
        e.hp -= d; a.flash = .4;
        pop('-' + d, '#8ad0ff', W / 2 + 40, 150);
        a.log.unshift(`✦ 月光弹！一轮小满月掷向${e.name}——${d} 点伤害！`);
      }
    };
    a.playerAttacked = false;
    for (const who of seq) {
      if (who === 'me') {
        if (!myAct) continue;
        if (myAct.type === 'support') { doSupport(myAct.key); }
        else {
          const sk = myAct.sk;
          a.pps[sk.key]--;
          if (sk.kind === 'cheer') {
            a.petGuard = true; a.cheer = true;
            a.log.unshift(`${me.name}鼓足了劲——下回合的攻击会更痛！（本回合防御提升）`);
            pop('鼓劲!', '#ff8ab0', 150, 500);
          } else {
            a.playerAttacked = true;
            myStrike(sk);
            a.cheer = false;
          }
        }
        myAct = null;
      } else foeStrike();
      if (e.hp <= 0 || me.hp <= 0) break;
    }
    /* 亲密度 ≥30：回合末只要双方都还站着，悄悄回 1 体力 */
    if (a.edu && a.edu.bond && me.hp > 0 && e.hp > 0 && me.hp < me.hpMax) {
      me.hp += 1;
      a.log.unshift(`亲密度在发光——${me.name}悄悄回了一口气（+1）。`);
    }
    if (e.hp > 0 && e.hp <= e.hpMax * .3 && !a.weary) {
      a.weary = true;
      a.log.unshift(`它喘着粗气，没了战意——正是丢球的好时机！`);
    }
  }

  function endCheck() {
    const a = act;
    if (a.petMode) {
      if (a.e.hp <= 0) { a.log.unshift(`${a.e.name}逃回了草丛深处！`); finish('win'); return true; }
      if (a.me.hp <= 0) {
        /* 亲密度 ≥60：首次被击倒时羁绊稳住它，剩 1HP（整场一次） */
        if (a.edu && a.edu.bond >= 2 && !a.bondUsed) {
          a.bondUsed = true; a.me.hp = 1;
          a.log.unshift(`${a.me.name}眼里映着你的影子——羁绊让它稳住了！（这次没有倒下）`);
          return false;
        }
        a.log.unshift(`${a.me.name}累趴下了……`); finish('lose'); return true;
      }
      return false;
    }
    if (a.e.hp <= 0) { a.log.unshift(`${a.e.name}倒下了！`); finish('win'); return true; }
    if (a.php <= 0) { a.php = 1; a.log.unshift('你体力不支倒下……（没有输掉什么，休息一下再来！）'); finish('lose'); return true; }
    return false;
  }

  /* petMode 菜单用道具列表：球 + 口粮 + 诱饵 */
  function petItems() {
    const CO = ADV.Collect;
    if (!CO) return [];
    const balls = ['critBall', 'goodBall', 'ultraBall'].filter(b => CO.count(b) > 0)
      .map(b => ({ id: b, kind: 'ball', tier: ['critBall', 'goodBall', 'ultraBall'].indexOf(b), name: CO.itemInfo(b).name }));
    const food = !act.opts.noBuddy && CO.count('petFood') > 0 ? [{ id: 'petFood', kind: 'food', name: CO.itemInfo('petFood').name }] : [];
    const baits = (act.e.bait || []).filter(b => CO.count(b) > 0 && CO.itemInfo(b))
      .map(b => ({ id: b, kind: 'bait', name: CO.itemInfo(b).name }));
    return balls.concat(food, baits);
  }

  function update(dt, p) {
    if (!act) return;
    const a = act;
    if (a.flash > 0) a.flash -= dt;
    if (a.shake > 0) a.shake -= dt;
    for (let i = a.pops.length - 1; i >= 0; i--) {       // 飘字：1.05 秒上飘渐隐
      a.pops[i].t += dt;
      if (a.pops[i].t > 1.05) a.pops.splice(i, 1);
    }
    if (p.cancel) { finish(a.petMode ? 'fled' : 'lose'); return; }

    const items = a.petMode ? petItems()
      : (ADV.Collect ? ADV.Collect.giftables().filter(it => it.battle && !it.pet) : []);
    const supList = a.petMode ? petSupport().filter(s => a.sups[s.key]) : [];
    const skillsOf = () => a.petMode ? a.skills : a.skills.filter(s => s.cat === (a.catSel ? 'mo' : 'wu'));
    const nSub = a.mode === 'skill' ? skillsOf().length
      : a.mode === 'item' ? items.length
      : a.mode === 'defend' ? 2
      : a.mode === 'cat' ? 2
      : a.mode === 'support' ? supList.length
      : a.petMode ? (supList.length ? 4 : 3) : 4;
    if (p.up) { a.sel = (a.sel + nSub - 1) % Math.max(1, nSub); ADV.Audio.sfx('cursor'); }
    if (p.down) { a.sel = (a.sel + 1) % Math.max(1, nSub); ADV.Audio.sfx('cursor'); }
    if (a.mode === 'cat' && (p.left || p.right)) { a.catSel = 1 - a.catSel; ADV.Audio.sfx('cursor'); }

    const afterPlayer = () => {                          // 玩家结算 → 敌方 → 回合推进（普通战）
      if (endCheck()) return true;
      enemyTurn(a.enemyIntentDone ? null : a.eIntent);
      a.eIntent = null; a.enemyIntentDone = false; a.playerAttacked = false;
      if (endCheck()) return true;
      a.turn++;
      return false;
    };

    if (a.mode === 'menu') {
      // BOSS 回忆攻击（C 键 pose）
      if (a.photos && a.photoIdx < a.photos.length && p.pose) {
        if (photoStrike()) { if (endCheck()) return; enemyTurn('atk'); if (endCheck()) return; a.turn++; }
        return;
      }
      if (p.ok) {
        ADV.Audio.sfx('ok');
        if (a.petMode) {
          if (a.sel === 0) {                             // 招式
            if (a.opts.noBuddy) { a.log.unshift('（你还没有能出战的伙伴——只能丢球 / 喂食 / 溜走）'); return; }
            a.mode = 'skill'; a.sel = 0;
          } else if (a.sel === 1) {
            if (!items.length) { a.log.unshift('背包里没有可用的道具。'); return; }
            a.mode = 'item'; a.sel = 0;
          } else if (a.sel === 2 && supList.length) {    // 支援（吴老师的咒语，每场各一次）
            a.mode = 'support'; a.sel = 0;
          } else {                                       // 逃跑
            a.tries++;
            if (Math.random() < fleeChance(a.me.spd, a.e.spd, a.tries - 1)) { finish('fled'); return; }
            a.log.unshift('没能溜掉！');
            petRound(null); if (endCheck()) return; a.turn++;
            a.mode = 'menu';
          }
          return;
        }
        if (a.sel === 0) {                               // 攻击 → 武/魔两栏
          a.mode = 'cat'; a.sel = 0; a.catSel = a.catSel || 0;
        } else if (a.sel === 1) {                        // 防御 → 武防/魔防
          a.mode = 'defend'; a.sel = 0;
        } else if (a.sel === 2) {                        // 道具
          if (!items.length) { a.log.unshift('背包里没有战斗道具。'); return; }
          a.mode = 'item'; a.sel = 0;
        } else {                                         // 逃跑
          if (a.opts.noFlee) { a.log.unshift('对手挡住了去路，逃不掉！'); return; }
          a.tries++;
          if (Math.random() < fleeChance(a.pspd, a.e.spd, a.tries - 1)) { finish('fled'); return; }
          a.log.unshift('没能溜掉！');
          a.eIntent = enemyIntent(); a.enemyIntentDone = true;
          if (afterPlayer()) return;
          a.mode = 'menu';
        }
      }
    } else if (a.mode === 'cat') {
      if (p.cancel) { a.mode = 'menu'; a.sel = 0; return; }
      if (p.ok) {
        ADV.Audio.sfx('ok');
        a.mode = 'skill'; a.sel = 0;
      }
    } else if (a.mode === 'defend') {
      if (p.cancel) { a.mode = 'menu'; a.sel = 0; return; }
      if (p.ok) {
        ADV.Audio.sfx('ok');
        a.eIntent = enemyIntent();                       // 同时读招：敌先暗选，再结算我方
        a.enemyIntentDone = false;
        playerAct('defend', a.sel === 0 ? 'wu' : 'mo');
        if (afterPlayer()) return;
        a.mode = 'menu'; a.sel = 0;
      }
    } else if (a.mode === 'skill') {
      if (p.cancel) { a.mode = a.petMode ? 'menu' : 'cat'; a.sel = 0; return; }
      if (p.ok) {
        const sk = skillsOf()[a.sel];
        if (!sk) return;
        if (!a.petMode && (a.pps[sk.key] || 0) <= 0) { a.log.unshift(`${sk.name}的 PP 耗尽了……`); return; }
        ADV.Audio.sfx('ok');
        if (a.petMode) {
          petRound({ sk });
          if (endCheck()) return;
          a.turn++;
          a.mode = 'menu'; a.sel = 0;
          return;
        }
        a.eIntent = enemyIntent(); a.enemyIntentDone = false; a.playerAttacked = false;
        playerAct('move', a.skills.indexOf(sk));
        if (afterPlayer()) return;
        a.mode = 'menu'; a.sel = 0;
      }
    } else if (a.mode === 'support') {                     // 吴老师支援指令（petMode 专属）
      if (p.cancel) { a.mode = 'menu'; a.sel = 0; return; }
      if (p.ok) {
        const sup = supList[a.sel];
        if (!sup) return;
        ADV.Audio.sfx('ok');
        petRound({ type: 'support', key: sup.key });
        if (endCheck()) return;
        a.turn++;
        a.mode = 'menu'; a.sel = 0;
      }
    } else if (a.mode === 'item') {
      if (p.cancel) { a.mode = 'menu'; a.sel = 0; return; }
      if (p.ok) {
        const it = items[a.sel];
        if (!it) return;
        ADV.Audio.sfx('ok');
        if (a.petMode) {
          if (it.kind === 'ball') {
            ADV.Collect.useItem(it.id);
            ADV.Audio.sfx('water');
            const tame = (ADV.Game.flags.tame && ADV.Game.flags.tame.soft) ? .1 : 0;   // 阿橘「轻声细语」：捕捉 +10%
            const chance = catchChance(a.e.hp / a.e.hpMax, it.tier, a.weary, a.fed, tame);
            if (Math.random() < chance) { a.log.unshift(`球口「咔哒」收紧——收服成功！`); finish('caught'); return; }
            a.log.unshift(`${it.name}被弹开了！差一点！`);
            if (a.opts.noBuddy) {                          // 没伙伴镇场：野生随时可能直接跑掉
              if (Math.random() < .35) { a.log.unshift('趁你弯腰捡球的工夫，它一溜烟钻回了深草！'); finish('fled'); return; }
            } else { petRound(null); if (endCheck()) return; a.turn++; }
          } else if (it.kind === 'food') {
            if (a.opts.noBuddy) { a.log.unshift('（口粮是喂自家伙伴的——你还没有能出战的伙伴。）'); return; }
            ADV.Collect.useItem(it.id);
            a.me.hp = a.me.hpMax;
            a.log.unshift(`${a.me.name}大口吃下${it.name}——体力全满了！`);
            pop('HP满!', '#4ae86c', 150, 500);
            petRound(null); if (endCheck()) return; a.turn++;
          } else {                                       // 诱饵：不耗回合的分散注意
            if (a.fed >= 2) { a.log.unshift('（它已经吃得很专心了——趁现在丢球！）'); return; }
            ADV.Collect.useItem(it.id);
            a.fed++;
            a.log.unshift(a.fed === 1 ? `${a.e.name}嗅了嗅，埋头啃了起来。（收服率 +10%）`
                                      : `${a.e.name}吃得头都不抬了——就是现在！（再 +10%）`);
            return;                                      // 喂诱饵不耗回合
          }
          a.mode = 'menu'; a.sel = 0;
          return;
        }
        a.items = items;                                 // playerAct('item') 按索引取道具
        playerAct('item', a.items.indexOf(it));
        if (endCheck()) return;
        enemyTurn('atk');
        if (endCheck()) return;
        a.turn++;
        a.mode = 'menu'; a.sel = 0;
      }
    }
    a.log = a.log.slice(0, 4);
  }

  function bar(g, x, y, w, h, r, max, col) {
    g.fillStyle = '#1a1c30'; g.fillRect(x - 2, y - 2, w + 4, h + 4);
    g.fillStyle = col; g.fillRect(x, y, Math.max(0, w * Math.max(0, r) / max), h);
    g.strokeStyle = '#d8c078'; g.lineWidth = 2; g.strokeRect(x - 2, y - 2, w + 4, h + 4);
  }

  /* 圆滚滚小伙伴放大绘制（petMode 双方立绘） */
  function drawCritter(g, cr, shiny, cx, cy, scale) {
    const sheet = ADV.Sprites.makeBuddySheet(cr, shiny);
    const fw = 32 * scale, fh = 28 * scale;
    g.imageSmoothingEnabled = false;
    g.drawImage(sheet, 0, 0, 32, 28, cx - fw / 2, cy - fh / 2, fw, fh);
  }

  function render(g) {
    if (!act) return;
    const a = act, e = a.e;
    g.fillStyle = 'rgba(10,8,26,.82)'; g.fillRect(0, 0, W, H);
    const sh = a.shake > 0 ? Math.sin(a.shake * 40) * 4 : 0;
    g.save(); g.translate(sh, 0);
    const bob = Math.sin(performance.now() / 400) * 4;
    if (a.petMode) {
      // 敌方：野生小伙伴（放大 + 呼吸）
      drawCritter(g, e, false, W / 2, 210 + bob, 5);
      // 我方：随行伙伴（左下；无伙伴战只画野生侧）
      if (!a.me.out) drawCritter(g, a.me, a.me.shiny, 170, 350 - bob * .6, 4);
      if (a.flash > 0) { g.globalAlpha = a.flash; g.fillStyle = '#fff'; g.fillRect(W / 2 - 110, 150, 220, 160); g.globalAlpha = 1; }
    } else {
      // 敌人立绘（放大行走图）
      const pal = ADV.Sprites.PALETTES[e.pal] || ADV.Sprites.PALETTES.studentC;
      const sheet = ADV.Sprites.makeCharSheet(pal);
      g.imageSmoothingEnabled = false;
      g.drawImage(sheet, 32, 0, 32, 44, W / 2 - 96, 130 + bob, 192, 264);
      if (a.flash > 0) { g.globalAlpha = a.flash; g.fillStyle = '#fff'; g.fillRect(W / 2 - 120, 110, 240, 300); g.globalAlpha = 1; }
    }
    g.restore();
    // 敌人信息
    if (a.petMode) {
      text(g, `野生的${e.name}`, W / 2, 60, 28, '#ffe9a8');
      text(g, e.intro, W / 2, 92, 14, '#8a94c0');
      bar(g, W / 2 - 160, 112, 320, 16, e.hp, e.hpMax, '#ff8a3a');
      text(g, `${Math.max(0, e.hp)}/${e.hpMax}`, W / 2 + 210, 110, 15, '#cfe0ff', 'left');
      if (a.weary) text(g, '😳 喘着粗气', W / 2 - 210, 110, 14, '#ffd94c', 'right');
      // 克制直觉（蒲老师·克制环讲堂）：常显本场属性优劣
      const tame = ADV.Game.flags.tame || {};
      if (tame.chart) {
        const CNT = { 水: '虫', 兽: '水', 虫: '兽' }, VIC = { 虫: '水', 水: '兽', 兽: '虫' };
        const eff = (a.me.fam ? famAdv(a.me.fam, e.fam) : 1);
        const col = eff > 1 ? '#4ae86c' : eff < 1 ? '#ff8a6a' : '#8a94c0';
        const word = eff > 1 ? '我方正处克制位！' : eff < 1 ? '小心——我方被它克制…' : '势均力敌。';
        text(g, `它怕${CNT[e.fam]}系 · 克${VIC[e.fam]}系 —— ${word}`, W / 2, 136, 14, col);
      }
    } else {
      text(g, e.name + (e.boss ? '  ☠ BOSS' : ''), W / 2, 60, 30, e.boss ? '#ff8a6a' : '#ffe9a8');
      bar(g, W / 2 - 160, 100, 320, 16, e.hp, e.hpMax, e.boss ? '#e85a5a' : '#ff8a3a');
      text(g, `${Math.max(0, e.hp)}/${e.hpMax}`, W / 2 + 210, 98, 15, '#cfe0ff', 'left');
    }
    // 我方信息（置于日志窗上方；触屏时左缘与对话框同一安全值，避开虚拟方向盘）
    const P = (ADV.UI.getSafePad ? ADV.UI.getSafePad() : 60);
    const lx = P;                                        // 左下信息/日志左缘（与对话框对齐，天然避开按键）
    const lw = Math.max(150, 320 - lx);                  // 左栏可用宽度（右缘不超过菜单起点）
    if (a.petMode) {
      if (a.me.out) {
        text(g, '（还没有能出战的伙伴）', lx, 382, 15, '#8a94c0', 'left');
        text(g, '可以直接丢球 / 喂诱饵试试运气', lx, 404, 13, '#667', 'left');
      } else {
        text(g, a.me.name + (a.me.shiny ? ' ✨' : ''), lx, 382, 20, '#fff', 'left');
        bar(g, lx, 408, Math.min(200, lw), 14, a.me.hp, a.me.hpMax, '#4ae86c');
        text(g, `体力 ${Math.max(0, a.me.hp)}/${a.me.hpMax}`, lx, 428, 14, '#8a94c0', 'left');
      }
    } else {
      text(g, '你', lx, 392, 22, '#fff', 'left');
      bar(g, lx, 420, Math.min(200, lw), 14, a.php, a.phpMax, '#4ae86c');
      text(g, `体力 ${Math.max(0, a.php)}/${a.phpMax}`, lx, 440, 14, '#8a94c0', 'left');
    }
    text(g, `回合 ${a.turn}`, lx, 458, 13, '#8a94c0', 'left');
    // 菜单 / 日志
    const mx = 330, my = 440, mw = Math.max(320, 960 - P - 10 - mx), mh = 170;
    ADV.UI.drawWindow(g, mx, my, mw, mh);
    if (a.mode === 'menu') {
      const supN = petSupport().filter(s => a.sups[s.key]).length;
      const labels = a.petMode ? (supN ? ['招式', '道具', '支援', '逃跑'] : ['招式', '道具', '逃跑']) : ['攻击', '防御', '道具', '逃跑'];
      labels.forEach((s, i) => {
        const cx = mx + 40 + (i % 2) * 270, cy = my + 16 + ((i / 2) | 0) * 44;
        const dim = a.petMode && i === 0 && a.opts.noBuddy;
        if (i === a.sel) text(g, '▶', cx - 22, cy, 19, '#ffe9a8');
        text(g, s, cx, cy, 21, i === a.sel ? '#ffe9a8' : dim ? '#667' : '#fff', 'left');
      });
      if (a.petMode && ADV.Game.flags.tame && ADV.Game.flags.tame.eye)
        text(g, '（察言观色：道具栏里选中球，可看估算捕捉率）', mx + 40, my + 104, 14, '#8ad0ff', 'left');
      if (a.photos && a.photoIdx < a.photos.length)
        text(g, 'C：打出回忆 📷（' + (a.photos.length - a.photoIdx) + ' 张）', mx + mw - 16, my + mh - 30, 14, '#8ad0ff', 'right');
      text(g, a.opts.noFlee ? 'X 认输退场' : 'X 溜走退场', mx + mw - 16, my + 6, 13, '#8a94c0', 'right');
    } else if (a.mode === 'cat') {
      ['武术', '咒语'].forEach((s, i) => {
        const cx = mx + 60 + i * 220;
        if (i === a.catSel) text(g, '▶', cx - 24, my + 20, 20, '#ffe9a8');
        text(g, `【${s}】`, cx, my + 20, 22, i === a.catSel ? '#ffe9a8' : '#8a94c0', 'left');
      });
      const n = a.skills.filter(s => s.cat === (a.catSel ? 'mo' : 'wu')).length;
      text(g, n ? `${n} 个招式 · Z 查看 · X 返回` : '（这一栏还没学会招式）', mx + 40, my + 70, 15, '#cfe0ff', 'left');
      text(g, '←→ 切换', mx + mw - 16, my + mh - 24, 13, '#8a94c0', 'right');
    } else if (a.mode === 'defend') {
      ['武术防御（克武术 · 反震）', '魔法防御（克咒语 · 吸星）'].forEach((s, i) => {
        const cy = my + 16 + i * 40;
        if (i === a.sel) text(g, '▶', mx + 16, cy, 17, '#ffe9a8');
        text(g, s, mx + 40, cy, 18, i === a.sel ? '#ffe9a8' : '#fff', 'left');
      });
      text(g, '同系减伤 70% · 错配 20%', mx + mw - 16, my + mh - 24, 13, '#8a94c0', 'right');
    } else if (a.mode === 'skill') {
      const list = a.petMode ? a.skills : a.skills.filter(s => s.cat === (a.catSel ? 'mo' : 'wu'));
      list.slice(0, 6).forEach((sk, i) => {
        const cy = my + 12 + i * 25;
        const pp = a.pps[sk.key] || 0;
        const dim = pp <= 0;
        if (i === a.sel) text(g, '▶', mx + 16, cy, 16, '#ffe9a8');
        const mark = a.petMode && sk.kind === 'atk' ? (famAdv(a.me.fam, e.fam) > 1 ? ' ↑' : famAdv(a.me.fam, e.fam) < 1 ? ' ↓' : ' －') : '';
        text(g, `${sk.name}${sk.kind === 'atk' && sk.pow ? ' 威力' + sk.pow : ''}${mark}（PP ${pp}${sk.pp >= 99 ? '+' : '/ ' + sk.pp}）`,
          mx + 40, cy, 17, dim ? '#667' : '#fff', 'left');
      });
      text(g, a.petMode ? 'Z 使用 · X 返回' : 'Z 使用 · X 返回招式栏', mx + mw - 16, my + mh - 24, 13, '#8a94c0', 'right');
    } else if (a.mode === 'support') {
      const sup = petSupport().filter(s => a.sups[s.key]);
      sup.slice(0, 6).forEach((s, i) => {
        const cy = my + 12 + i * 25;
        if (i === a.sel) text(g, '▶', mx + 16, cy, 16, '#ffe9a8');
        text(g, `${s.name}（本场 ×1）`, mx + 40, cy, 17, '#fff', 'left');
      });
      text(g, '吴老师的支援咒语 · Z 使用 · X 返回', mx + mw - 16, my + mh - 24, 13, '#8ad0ff', 'right');
    } else if (a.mode === 'item') {
      const items2 = a.petMode ? petItems()
        : (ADV.Collect ? ADV.Collect.giftables().filter(it => it.battle && !it.pet) : []);
      items2.slice(0, 6).forEach((it, i) => {
        const cy = my + 12 + i * 25;
        if (i === a.sel) text(g, '▶', mx + 16, cy, 16, '#ffe9a8');
        let extra = a.petMode && it.kind === 'ball' ? '（丢！）' : '';
        if (a.petMode && it.kind === 'ball' && ADV.Game.flags.tame && ADV.Game.flags.tame.eye) {
          const tame = ADV.Game.flags.tame.soft ? .1 : 0;    // 察言观色：选中球时估算捕捉率
          const ch = catchChance(e.hp / e.hpMax, it.tier, a.weary, a.fed, tame);
          extra = `（捕捉率约 ${Math.round(ch * 100)}%）`;
        }
        text(g, `${it.name} ×${ADV.Collect.count(it.id)}${extra}`, mx + 40, cy, 17, '#fff', 'left');
      });
      text(g, 'Z 使用 · X 返回', mx + mw - 16, my + mh - 24, 13, '#8a94c0', 'right');
    }
    // 战斗日志（窗宽随安全区调整；窄屏时缩短每行字符数避免溢出）
    const logLen = Math.max(10, Math.min(16, Math.floor((lw - 18) / 13)));
    ADV.UI.drawWindow(g, lx, 476, lw, 150);
    a.log.forEach((l, i) => {
      g.globalAlpha = i === 0 ? 1 : .55 - i * .1;
      l.split('\n').forEach((line, j) => text(g, line.slice(0, logLen), lx + 16, 490 + i * 30 + j * 15, 13, '#e8ecff', 'left'));
    });
    g.globalAlpha = 1;
    // 伤害/治疗飘字（前 0.12 秒弹跳放大，随后上飘渐隐）
    for (const p of a.pops) {
      const t = p.t;
      const sc = t < .12 ? 1 + (1 - t / .12) * .6 : 1;
      const a2 = t < .75 ? 1 : Math.max(0, 1 - (t - .75) / .3);
      g.save();
      g.globalAlpha = a2;
      g.translate(p.x, p.y - Math.max(0, t - .12) * 44);
      g.scale(sc, sc);
      g.font = 'bold 24px "Microsoft YaHei", "PingFang SC", sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 4; g.lineJoin = 'round';
      g.strokeStyle = 'rgba(20,10,30,.85)';
      g.strokeText(p.txt, 0, 0);
      g.fillStyle = p.col;
      g.fillText(p.txt, 0, 0);
      g.restore();
    }
  }

  /* 当前安全区下的底部 UI 矩形（画布逻辑坐标）：供冒烟测试验证不压虚拟按键 */
  function layoutRects() {
    const P = (ADV.UI.getSafePad ? ADV.UI.getSafePad() : 60);
    const lx = P, lw = Math.max(150, 320 - lx);
    const mw = Math.max(320, 960 - P - 10 - 330);
    return {
      status: { x: lx, y: 392, w: lw, h: 78 },
      log:    { x: lx, y: 476, w: lw, h: 150 },
      menu:   { x: 330, y: 440, w: mw, h: 170 }
    };
  }

  return {
    start, update, render, ENEMIES, MOVES, petMoves, layoutRects, skillList,
    calcDamage, fleeChance, catchChance, petDamage, famAdv, petBonus,
    petSupport, assistPower, buddyBoost,
    get active() { return !!act; },
    get act() { return act; }      // 供测试观察内部状态（飘字等）
  };
})();
