/* =========================================================
 * game-retro.js —— 游戏剧情拆分段 5/8
 * 童年怀旧玩法包 · 委托/专题周 · 怪谈/竞技场 · 社团/料理/武斗
 * 必须按 core → event → scene → quest → retro → town → life → save 顺序加载。
 * ========================================================= */
  /* ==================== 童年怀旧玩法包 ====================
   * 操场跳房子/弹珠/雪仗、教室翻花绳、天台纸飞机
   * 每个玩法：每日首胜给金币，一生首胜送指定童年卡（集图鉴） */
  const TOYS = {
    hopscotch: { name: '跳房子', where: '操场', kind: 'hopscotch', gold: 6, card: 'c6',
      intro: '粉笔画的格子还在——\n把沙包扔进格子，单脚跳过去！' },
    marbles:   { name: '弹珠', where: '操场', kind: 'marbles', gold: 6, card: 'c2',
      intro: '地上用树枝画了个“雪圈”。\n把弹珠滚进圈里就算赢！' },
    cradle:    { name: '翻花绳', where: '教室', kind: 'cradle', gold: 6, card: 'c4',
      intro: '同桌朝你晃了晃花绳：\n「看好了，翻个新花样——记住哦！」' },
    plane:     { name: '纸飞机', where: '天台', kind: 'plane', gold: 8, card: 'c5',
      intro: '天台风大，正适合放纸飞机。\n穿过两个呼啦圈就算赢！' },
    snowfight: { name: '打雪仗', where: '操场', kind: 'snowfight', gold: 10, card: 'c11',
      intro: '雪地里冒出一排雪人，\n正朝你挤眉弄眼——开战！' },
    longjump:  { name: '沙坑跳远', where: '操场', kind: 'longjump', gold: 8, card: 'c8',
      intro: '沙坑边的起跳板磨得发亮——\n助跑、起跳、腾空，破 4 米就算赢！' },
    melonchop: { name: '西瓜割', where: '后院', kind: 'melon', gold: 8, card: 'c7',
      intro: '井水里镇了一晌午的大西瓜刚捞上来——\n一刀下去，听得见瓜皮裂开的脆响！' }
  };
  async function toyPlay(key) {
    const t = TOYS[key], f = F();
    // 打雪仗：冬季或雪天限定
    if (key === 'snowfight' && ADV.Cal.seasonEn() !== 'winter' && ADV.Cal.weather !== '雪') {
      await say({ text: '（雪仗要等冬天、或者下雪的天，\n现在这里只有一块光秃秃的空地）' });
      return;
    }
    // 西瓜割：夏季限定（井水镇瓜是夏天的仪式）
    if (key === 'melonchop' && ADV.Cal.seasonEn() !== 'summer') {
      await say({ text: '（井台边光溜溜的——\n夏天才有镇在井水里的大西瓜）' });
      return;
    }
    await say({ text: t.intro });
    const res = await new Promise(r => ADV.Mini.start(t.kind, (w, s) => r({ w, s })));
    const win = res.w;
    if (win) {
      E().playAction(E().player, 'laugh', 1.6);
      if (key === 'longjump') f.jumpBest = Math.max(f.jumpBest || 0, res.s ? res.s.best || 0 : 0);   // 记录跳远纪录
      if (key === 'melonchop') f.melonBest = Math.max(f.melonBest || 0, res.s ? res.s.hits || 0 : 0); // 记录最多连斩
      const first = !(f.toy || {})[key];
      (f.toy || (f.toy = {}))[key] = true;
      await say({ text: first ? '「厉害呀！」围观的同学把手都拍红了。' : '「又是这一手！」同学们见怪不怪地喝彩。' });
      const slot = daySlot('toyGold');               // 每日首胜金币（与一生首胜标记 f.toy 分开存）
      if (!slot[key]) {                                  // 每日首胜：金币
        slot[key] = true;
        f.gold = (f.gold || 0) + t.gold;
        UI().toast(` 💰 ${t.name}获胜，金币 +${t.gold} `);
      }
      if (first) {                                       // 一生首胜：送童年卡
        const ci = ADV.Collect.info('cards', t.card);
        if (ci && ADV.Collect.gain('cards', t.card))
          await say({ text: `有人把一张卡片塞进你手心：\n「赢家的彩头——「${ci.name}」${'★'.repeat(ci.star || 1)}！」` });
      }
      logEvent(`在${t.where}玩${t.name}赢了同学`);
    } else {
      E().playAction(E().player, 'sad', 1.4);
      await say({ text: '「差一点点，再来一把！」\n（练练手，下次一定）' });
    }
    save();
  }
  S.hopscotch = () => toyPlay('hopscotch');
  S.marbles = () => toyPlay('marbles');
  S.cradle = () => toyPlay('cradle');
  S.plane = () => toyPlay('plane');
  S.snowfight = () => toyPlay('snowfight');
  S.sandpit = async () => {
    const before = F().jumpBest || 0;
    await toyPlay('longjump');
    if (F().jumpBest > before) {
      await say({ text: `沙坑边的小黑板擦了重写：\n「本班最远纪录 —— ${F().jumpBest.toFixed(1)} 米！」` });
      logEvent(`沙坑跳远刷新个人纪录：${F().jumpBest.toFixed(1)} 米`);
    }
  };
  S.melonChop = async () => {
    const before = F().melonBest || 0;
    await toyPlay('melonchop');
    if (F().melonBest > before) {
      await say({ text: `井台边的小黑板擦了重写：\n「本夏最爽快纪录 —— 一口气切中 ${F().melonBest} 刀！」` });
      logEvent(`西瓜割刷新纪录：切中 ${F().melonBest} 刀`);
    }
  };

  /* —— 三系克制：虫克水（水边虫称王）→ 水克兽（柔水克刚兽）→ 兽克虫（走兽捕虫）—— */
  const FAM_ADV = { '虫水': 1.5, '水兽': 1.5, '兽虫': 1.5 };
  const famAdv = (a, b) => a === b ? 1 : (FAM_ADV[a + b] || .75);
  /* 石墩对决回合演算：HP=力×6+20；速高者先手；伤害=力+浮动再乘克制倍率，凭速可闪避。
   * startHp 供连续作战续航（不传则满血开局，训练家阶梯即每场满血）。返回 {win,draw,myHp,body} */
  function duelRounds(me, foe, startHp) {
    const SK = ADV.Skills;
    /* 三期C 催化进石墩战：出战者正是随行伙伴时，享受雾隐婆婆的力/速加成（与画布战同源） */
    const flg = ADV.Game.flags, bst = (flg && flg.buddy && flg.buddy.id === me.id && flg.buddyBoost)
      ? { pow: flg.buddyBoost.pow || 0, spd: flg.buddyBoost.spd || 0 } : { pow: 0, spd: 0 };
    if (bst.pow || bst.spd) me = Object.assign({}, me, { pow: me.pow + bst.pow, spd: me.spd + bst.spd });
    let myHp = (startHp == null ? me.pow * 6 + 20 : startHp) + (SK ? SK.duelHp() : 0), foeHp = foe.pow * 6 + 20;
    const lines = [];
    if (bst.pow || bst.spd) lines.push(`· ${me.name}浑身一亮——骨子里涌着催化后的力气！`);
    const strike = (att, def, isMe) => {
      const dodge = Math.max(0, def.spd * .04 - (isMe && SK ? SK.duelFocus() : 0));   // 预判技能：对手更难闪开
      if (Math.random() < dodge) { lines.push(`· ${def.name}侧身一闪，${att.name}扑了个空！`); return; }
      const eff = famAdv(att.fam, def.fam);
      const dmg = Math.max(1, Math.round((att.pow + ((Math.random() * 3) | 0)) * eff * (isMe && SK ? SK.duelDmg() : 1)));   // 发力/巧劲技能：伤害 +10%/+10%
      if (isMe) foeHp -= dmg; else myHp -= dmg;
      lines.push(`· ${att.name}一个猛冲，${def.name} -${dmg}！${eff > 1 ? '（属性相克，威力加倍！）' : eff < 1 ? '（被克制，效果不佳…）' : ''}`);
    };
    const mySpd = me.spd + (SK ? SK.duelSpd() : 0);       // 身法技能：先手判定 +5 速
    for (let r = 1; r <= 10 && myHp > 0 && foeHp > 0; r++)
      for (const [a, d, im] of (mySpd >= foe.spd ? [[me, foe, true], [foe, me, false]] : [[foe, me, false], [me, foe, true]])) {
        if (myHp <= 0 || foeHp <= 0) break;
        strike(a, d, im);
      }
    const body = (lines.length > 9 ? lines.slice(0, 3).concat(['……'], lines.slice(-5)) : lines).join('\n');
    return { win: foeHp <= 0 && myHp > 0, draw: foeHp <= 0 && myHp <= 0, myHp: Math.max(0, myHp), body };
  }
  /* —— 训练家三阶梯：小石头（1 只）→ 芦花姐（2 只）→ 冠军蝉鸣大爷（3 只·王牌山神小狐狸）—— */
  const LADDER = [
    { name: '新手·小石头', gold: 8, team: ['i1'],
      intro: '别看我个子小，我的七星瓢虫\n可是全巷子最快的！来比比！',
      cheer: '呜哇，输啦……你养的小家伙真厉害！' },
    { name: '老练·芦花姐', gold: 15, team: ['c5', 'm9'],
      intro: '河边长大的孩子，螃蟹和三花猫\n都是从小一起混的老搭档。放马过来！',
      cheer: '行啊你！这只小家伙有点东西，回去我再练练。' },
    { name: '擂台冠军·蝉鸣大爷', gold: 40, team: ['i13', 'c6', 'm12'],
      intro: '小伙子，我在这石墩上蝉鸣了六个夏天，\n还没人能从我这三只手上赢走一局。',
      cheer: '哈……哈……好！\n这个夏天，石墩归你了！' },
  ];
  async function arenaLadder(f, CO, me) {
    const tier = Math.min(2, f.ladderTier || 0);
    if ((f.ladderTier || 0) >= 3) {
      // —— 全通后每日再战：阵容按日轮换，连胜金币递增（失败清零） ——
      const slot = daySlot('ladderRematch');
      if (slot.done) { await say({ name: '蝉鸣大爷', text: '今天已经交过手啦，明天再来——\n擂台不打疲劳战。' }); return; }
      const streak = f.ladderStreak || 0;
      const gold = Math.min(60, 20 + streak * 10);
      const team = seededShuffle(CO.critterList(), ADV.Cal.day * 31 + 7).slice(0, 3);   // 同一天阵容固定，跨天轮换
      const intro = `三关你都闯完啦——敢不敢天天来？\n今日我的阵是「${team.map(c => c.name).join('」「')}」，\n连胜 ${streak} 场，赢了金币 +${gold}！`;
      const go = await choose(['应战！', '先退一步'], { caption: { name: '蝉鸣大爷', text: intro + '\n（连闯全队才获胜——每场满血开打，比的是硬实力）' } });
      if (go !== 0) return;
      slot.done = true;
      let cleared = true;
      for (let i = 0; i < team.length; i++) {
        const foe = team[i];
        await say({ text: i === 0 ? `蝉鸣大爷缓缓放出今日头阵——「${foe.name}」！`
                                  : `蝉鸣大爷又放出——「${foe.name}」！（你的${me.name}满血再战）` });
        const d = duelRounds(me, foe);
        if (!d.win) {
          cleared = false;
          E().playAction(E().player, 'sad', 1.6);
          await say({ text: d.body + `\n\n「${foe.name}」守住了台子——连胜断了。` });
          break;
        }
        await say({ text: d.body + `\n\n🏆「${foe.name}」败下阵来！` });
      }
      if (cleared) {
        f.ladderStreak = streak + 1;
        f.ladderBest = Math.max(f.ladderBest || 0, f.ladderStreak);
        f.gold = (f.gold || 0) + gold;
        if (ADV.Skills) ADV.Skills.add('battle', 12, '擂台再战');
        E().playAction(E().player, 'laugh', 1.6);
        UI().toast(` 🏅 再战连胜 ${f.ladderStreak}，金币 +${gold} `);
        logEvent(`擂台再战连胜${f.ladderStreak}场`);
        await say({ name: '蝉鸣大爷', text: `哈……好！连胜 ${f.ladderStreak} 场——\n明天我的阵会更难缠！（历史最高连胜 ${f.ladderBest}）` });
      } else {
        f.ladderStreak = 0;
        await say({ name: '蝉鸣大爷', text: '胜负乃兵家常事——\n回去养精蓄锐，明天从头再来！' });
      }
      save();
      return;
    }
    const T = LADDER[tier];
    const slot = daySlot('ladder' + tier);
    if (slot.done) { await say({ name: T.name, text: '今天已经交过手啦，明天再来——\n擂台不打疲劳战。' }); return; }
    const go = await choose(['应战！', '先退一步'], { caption: { name: T.name, text: T.intro + '\n（连闯全队才获胜——每场满血开打，比的是硬实力）' } });
    if (go !== 0) return;
    slot.done = true;                                   // 应战即消耗当日机会（胜负皆然）
    let cleared = true;
    for (let i = 0; i < T.team.length; i++) {
      const foe = CO.critter(T.team[i]);
      await say({ text: foe.rar === 3
        ? `${T.name}缓缓放出王牌——全场倒吸一口凉气：\n「${foe.name}」！${foe.desc}`
        : i === 0 ? `${T.name}亮出头一只——「${foe.name}」！`
                  : `${T.name}又放出——「${foe.name}」！（你的${me.name}满血再战）` });
      const d = duelRounds(me, foe);
      if (!d.win) {
        cleared = false;
        E().playAction(E().player, 'sad', 1.6);
        await say({ text: d.body + `\n\n「${foe.name}」守住了台子——挑战止步于${T.name}。` });
        break;
      }
      await say({ text: d.body + `\n\n🏆「${foe.name}」败下阵来！` });
    }
    if (cleared) {
f.ladderTier = Math.max(f.ladderTier || 0, tier + 1);
f.gold = (f.gold || 0) + T.gold;
if (ADV.Skills) ADV.Skills.add('battle', 10, '擂台挑战');
E().playAction(E().player, 'laugh', 1.6);
      UI().toast(` 🏅 战胜${T.name}，金币 +${T.gold} `);
      logEvent(`在河湾擂台战胜了${T.name}`);
      await say({ name: T.name, text: T.cheer + (tier === 2 ? '\n（「擂台冠军」的称号，从此是你的了）' : `\n（下一关：${LADDER[tier + 1].name}——明天来挑战吧）`) });
    }
    save();
  }
  S._famAdv = famAdv;                                   // 供冒烟测试验证克制表
  S._duel = duelRounds;

  /* —— 三系擂台：42 种小伙伴全可上场（虫/水/走兽），属性相克 + 训练家阶梯 —— */
  S.bugArena = async () => {
    const f = F(), CO = ADV.Collect, C = ADV.Cal;
    const mine = CO.DB.critters.filter(x => CO.has('critters', x.id));
    if (!mine.length) {
      await say({ text: '擂台石墩边围了一圈小孩。\n「虫、水、走兽——带哪系的小伙伴都行！\n河湾草丛里窸窸窣窣的，捉一只来！」' });
      return;
    }
    /* —— 三期B 校园斗虫大会：每月一赛（逢 9 的日子：第 9/19/29… 天），虫系专属三连战 —— */
    const cupDay = C.day % 10 === 9;
    const acts = cupDay ? ['🏆 斗虫大会（今日开赛！）', '上擂台斗虫', '挑战擂台训练家', '先不比了']
                        : ['上擂台斗虫', '挑战擂台训练家', '先不比了'];
    const act = await choose(acts, { caption: { name: cupDay ? '斗虫大会' : '三系擂台', text: cupDay
      ? '石墩披了红布，蒲老师抱着奖杯站在一边：\n「一年一度的斗虫大会！\n只限虫系参赛，三连胜夺杯——今天错过等十天！」'
      : '石墩就是擂台，小孩们敲着巴掌起哄：\n「属性相克——虫克水、水克兽、兽克虫！」' } });
    if (act < 0 || act >= acts.length - 1) return;
    if (cupDay && act === 0) {
      const bugs = mine.filter(x => x.fam === '虫');
      if (!bugs.length) { await say({ name: '蒲老师', text: '大会只限虫系参赛。\n先去捉一只虫系小伙伴再来吧！' }); return; }
      if (f.bugCupDay === C.day) { await say({ name: '蒲老师', text: '今天已经比过了。\n名次以首战为准——下次大会是第 ' + (C.day + 10) + ' 天。' }); return; }
      const pick = await choose(
        bugs.map(x => `${x.name}（力${x.pow}/速${x.spd}）`).concat(['弃权']),
        { caption: { text: '选你的参赛选手！\n三场连胜，每场都满血开打。' } });
      if (pick < 0 || pick >= bugs.length) return;
      const me = bugs[pick];
      const foes = seededShuffle(CO.DB.critters.filter(x => x.fam === '虫' && x.id !== me.id), C.day * 13 + 1).slice(0, 3);
      f.bugCupDay = C.day;
      let round = 0;
      for (const foe of foes) {
        round++;
        await say({ text: `第 ${round} 轮——对手是「${foe.name}」！\n（看台上的小孩喊得脸都红了）` });
        const d = duelRounds(me, foe);
        await say({ text: d.body + (d.win ? `\n\n🏆「${me.name}」赢了第 ${round} 轮！` : d.draw ? '\n\n两败俱伤——大会规则：平局即淘汰。' : `\n\n「${foe.name}」占了上风……止步第 ${round} 轮。`) });
        if (!d.win) {
          E().playAction(E().player, 'sad', 1.6);
          await say({ name: '蒲老师', text: round === 1 ? '「胜负是常事。回去把相克环再背一遍——\n下个大会我等你。」' : '「差一点就捧杯了！下次一定。」' });
          save(); return;
        }
      }
      // —— 三连胜夺冠 ——
      f.bugKing = true;
      ADV.Audio.sfx('fanfare');
      E().playAction(E().player, 'laugh', 2);
      f.gold = (f.gold || 0) + 50;
      addCup(10);
      logEvent('斗虫大会三连胜夺冠');
      save();
      UI().toast(' 🏆 斗虫大会冠军！金币 +50 · 学院分 +10 ');
      await say({ name: '蒲老师', text: `「冠军——${me.name}和它的搭档！\n这只奖杯放在教室展示柜，名字刻你的。」\n（阿橘在人群里使劲鼓掌）` });
      return;
    }
    const actOld = cupDay ? act - 1 : act;             // 老菜单下标平移
    const pick = await choose(
      mine.map(x => `${x.name}（${x.fam}系 力${x.pow}/速${x.spd}）`).concat(['还是算了']),
      { caption: { text: actOld === 0 ? '上虫——比比谁的更威风！' : '训练家战要一口气连闯，\n选你最可靠的一只小伙伴！' } });
    if (pick < 0 || pick >= mine.length) return;
    const me = mine[pick];
    if (actOld === 1) return arenaLadder(f, CO, me);
    const cand = CO.DB.critters.filter(x => x.id !== me.id && CO.whenOk(x.id));   // 对手从当季小伙伴里抽
    const foe = cand.length ? cand[(Math.random() * cand.length) | 0]
                            : CO.DB.critters.find(x => x.id !== me.id);
    await say({ text: `你把「${me.name}」放上石墩，\n对面亮出「${foe.name}」（${foe.fam}系）——两侧齐声起哄！` });
    const d = duelRounds(me, foe);
    E().playAction(E().player, d.win ? 'laugh' : 'sad', 1.6);
    await say({ text: d.body + (d.win ? `\n\n🏆「${me.name}」把对手拱下了石墩！`
      : d.draw ? '\n\n两败俱伤——两只小伙伴同时滚下石墩，算平！'
      : `\n\n「${foe.name}」占了上风，你的小伙伴败下阵来。`) });
    if (d.win) {
      f.bugWins = (f.bugWins || 0) + 1;
      const slot = daySlot('bugGold');                    // 每日首胜 12 文，当日再胜 5 文
      const g = slot.on ? 5 : (slot.on = true, 12);
      f.gold = (f.gold || 0) + g;
      UI().toast(` 🪲 擂台获胜，金币 +${g} `);
      logEvent(`在河湾三系擂台用${me.name}赢了对决`);
    }
    save();
  };

  /* —— 野外草丛遭遇战：走进高草惊动野生小伙伴 → 画布宠物战（s11）
   *   招式磨血 / 丢球收服 / 喂诱饵 / 逃跑全在画布里完成，出画后只做簿记 —— */
  const BALLS = ['critBall', 'goodBall', 'ultraBall'];
  S.wildBattle = async (zone) => {
    const f = F(), C = ADV.Cal, CO = ADV.Collect;
    // 出没池：本图出没 + 时段/季节/天气吻合 + 非传说（传说只留给窝点的仪式感）；tier1 深草易出稀有
    const pool = CO.critterList().filter(c => c.where === zone.map && CO.whenOk(c.id) && c.rar < 3);
    const hi = pool.filter(c => c.rar === 2), lo = pool.filter(c => c.rar === 1);
    if (!lo.length && !hi.length) return;
    const wantHi = zone.tier ? Math.random() < .6 : Math.random() < .2;
    const cr = (wantHi && hi.length) ? hi[(Math.random() * hi.length) | 0]
             : lo.length ? lo[(Math.random() * lo.length) | 0] : hi[(Math.random() * hi.length) | 0];
    // 伙伴体力续航：跨天回满，战斗间保留（精灵口粮 / 面对伙伴按 Z 喂吃的可回满）
    const budCr = f.buddy ? CO.critter(f.buddy.id) : null;
    const fullHp = budCr ? budCr.pow * 6 + 20 : 0;
    if ((f.wildHpDay || 0) !== C.day) { f.wildHpDay = C.day; f.wildHp = null; }
    if (f.wildHp == null) f.wildHp = fullHp;
    ADV.Audio.sfx('start');
    await say({ text: `草丛哗啦一响——\n野生的「${cr.name}」（${cr.fam}系）跳了出来！` });
    // —— 画布宠物战：胜/负/溜/收服四出口（旧存档布尔桩 true=收服 / false=溜走） ——
    const res = await new Promise(done =>
      ADV.Battle.start(cr.id, { petMode: true, buddy: f.buddy ? { id: f.buddy.id, shiny: f.buddy.shiny, hp: f.wildHp } : null }, done));
    const outcome = (res && typeof res === 'object') ? res.outcome : (res ? 'caught' : 'fled');
    if (res && typeof res === 'object') f.wildHp = Math.max(0, res.myHp);   // 战斗间保留伙伴体力
    if (f.tame && f.tame.aid && f.wildHp > 0 && fullHp > 0) {               // 阿橘「战后急救」：自行恢复三成
      f.wildHp = Math.min(fullHp, f.wildHp + Math.ceil(fullHp * .3));
      UI().toast(` 🩹 战后急救——${budCr.name}的体力恢复到了 ${f.wildHp}/${fullHp} `);
    }
    if (outcome === 'caught') {                        // 收服簿记：已入册放归 +3 文；新种入册可邀随行
      f.catchTotal = (f.catchTotal || 0) + 1;          // 成就「捕虫高手」累计（球收，含重复收服）
      ADV.Audio.sfx('ok');
      await say({ text: `球在草叶间「咔哒」一收紧——\n收服成功！${cr.name}安安稳稳住了进去。` });
      if (CO.has('critters', cr.id)) {
        f.gold = (f.gold || 0) + 3;
        UI().toast(` 🎉 收服成功！图鉴已有它——放归草丛，金币 +3 `);
        logEvent(`草丛遭遇中收服了${cr.name}（已入册，放归）`);
      } else {
        const shiny = CO.rollShiny(CO.shinyMult());
        CO.gainCritter(cr.id, shiny);
        logEvent(`草丛遭遇中收服了${cr.name}${shiny ? '（金色异色！）' : ''}`);
        if (!f.buddy) {                                // 身边没伙伴：新收服的可邀随行
          const inv = await choose([`让${cr.name}跟着你走`, '放它回草丛深处'],
            { caption: { name: `野生的${cr.name}`, text: '球里的小家伙探出脑袋望着你——\n要邀它结伴同行吗？' } });
          if (inv === 0) {
            f.buddy = { id: cr.id, shiny: shiny ? 1 : 0 };
            f.wildHp = CO.critter(cr.id).pow * 6 + 20; f.wildHpDay = C.day;
            ADV.Engine.spawnBuddy();
            UI().toast(` ${cr.name} 成了你的随行伙伴！按 Z 可以和它互动 `);
            logEvent(`${cr.name} 成了随行伙伴`);
          }
        }
      }
      save(); return;
    }
    if (outcome === 'win') {                           // 打跑了它：不算输也没有收成
      E().playAction(E().player, 'laugh', 1.6);
      await say({ text: `「${cr.name}」败下阵来，\n一溜烟钻回了深草深处。` });
    } else if (outcome === 'lose') {
      E().playAction(E().player, 'sad', 1.6);
      await say({ text: `「${budCr ? budCr.name : '伙伴'}」累趴下了……\n（精灵口粮或面对伙伴按 Z 喂吃的，\n　回满体力再来！）` });
    } else {                                           // fled：全身而退
      await say({ text: `你屏住呼吸退出草丛——\n「${cr.name}」抖抖毛，继续觅食去了。` });
    }
    save();
  };

  /* —— 比赛场场务·石头伯：卖宠物球 + 讲草丛遭遇的门道 —— */
  S.arenaKeeper = async () => {
    const f = F(), CO = ADV.Collect;
    while (true) {
      const a = await choose(['买宠物球', '打听门道', '先逛逛'], { caption: { name: '石头伯',
        text: '后生，来看比赛？\n我这柜台卖草丛里用得上的宝贝——\n树叶球 20 文、藤编好球 60 文、月光宝球 150 文。' } });
      if (a !== 0) {
        if (a === 1) await say({ name: '石头伯', text: '河湾、后山、麦田、山脚的高草丛里，\n野生的虫虫兽兽可不少——走进去三步\n就要留神脚下。\n先把自家小伙伴喂饱（按 Z 喂吃的回体力），\n打赢了再丢球，一丢一个准！' });
        return;
      }
      const bi = await choose(BALLS.map(id => { const it = CO.itemInfo(id); return `${it.name}（${it.price} 文）`; }).concat(['不买了']),
        { caption: { name: '石头伯', text: '球越贵勒得越紧——\n深草里的稀客，可别用便宜球糟蹋了机会。' } });
      if (bi < 0 || bi >= BALLS.length) continue;
      const id = BALLS[bi], it = CO.itemInfo(id);
      if ((f.gold || 0) < it.price) { await say({ name: '石头伯', text: `（金币不够——${it.name}要 ${it.price} 文）` }); continue; }
      f.gold -= it.price;
      CO.addItem(id);
      ADV.Audio.sfx('item');
      UI().toast(` 买到${it.name}，金币 -${it.price} `);
      save();
    }
  };

  /* —— 比赛场看热闹的小孩 —— */
  S.arenaKid = async (ent) => {
    E().playAction(ent, 'cheer', 1.2);
    await say({ text: ['「上局蝉鸣大爷的王牌一出手就定了胜负，太帅了！」',
                       '「石头伯的月光宝球我摸过一次——凉凉的，还发光！」',
                       '「深草里的野生小伙伴会打架，打赢了再丢球才收得住！」'][(Math.random() * 3) | 0] });
  };

  /* —— 驯兽知识题库（s12）：讲堂与讨教共用；chart:true 的题供克制环讲堂随堂抽 —— */
  const TAMING_QUIZ = [
    { chart: true, q: '【驯兽】三系相克环是？', opts: ['虫克水，水克兽，兽克虫', '水克虫，虫克兽，兽克水', '三系互相都不克制'], a: 0 },
    { chart: true, q: '【驯兽】水系招式打在虫系小伙伴身上会？', opts: ['效果绝佳，伤害 ×1.5', '效果不佳，伤害 ×0.75', '不痛不痒'], a: 0 },
    { chart: true, q: '【驯兽】兽系小伙伴最怕面对哪一系对手？', opts: ['同类', '水系', '虫系'], a: 1 },
    { chart: true, q: '【驯兽】被对手克制时，更聪明的做法是？', opts: ['先鼓劲守住，再找机会磨血丢球', '不管不顾硬碰硬', '立刻关游戏'], a: 0 },
    { chart: true, q: '【驯兽】克制标记「↑」出现在招式列表里代表？', opts: ['这一击效果绝佳', '这一击会被弹开', '这一击不耗 PP'], a: 0 },
    { q: '【驯兽】什么时候丢球最容易收服？', opts: ['对方血量越低、越疲惫时', '开战第一回合', '自己快输的时候'], a: 0 },
    { q: '【驯兽】精灵口粮是干什么用的？', opts: ['喂自己的伙伴，回满体力', '扔向对手逗它笑', '摆在家里当装饰'], a: 0 },
    { q: '【驯兽】喂诱饵之后会发生什么？', opts: ['对方埋头大吃，收服率上升', '对方会生气跑掉', '天上下雨'], a: 0 },
    { q: '【驯兽】月光宝球比树叶球好在哪？', opts: ['捕捉加成更高', '花纹更好看', '价格更便宜'], a: 0 },
    { q: '【驯兽】小伙伴的体力上限由什么决定？', opts: ['力量——力越高血越厚', '个子高矮', '毛色深浅'], a: 1 },
    { q: '【驯兽】对方「喘着粗气」的提示意味着？', opts: ['它没了战意，正是丢球好时机', '它马上要进化了', '它想跟你回家写作业'], a: 0 },
    { q: '【驯兽】金色异色小伙伴怎么辨认？', opts: ['通体金色，图鉴带 ✨ 标记', '会开口说话', '走路一蹦三跳'], a: 0 },
    { q: '【驯兽】逃跑成功率主要看什么？', opts: ['双方速度差与尝试次数', '纯粹看脸', '背包里球的数量'], a: 0 },
  ];
  /* —— 阿橘驯兽讨教（s12.2）：付费+理论题学技巧，答错学费退还 —— */
  const TAME_LESSONS = [
    { key: 'soft', name: '轻声细语', cost: 60, prev: null,
      tip: '收服率 +10%——走近时放轻脚步、压低声音，\n球出手前小家伙就不会被吓跑。',
      q: '【讨教】「轻声细语」的要领是？', opts: ['放轻脚步压低声音，别吓到它', '大喊大叫震住它', '闭着眼睛丢球'], a: 0 },
    { key: 'eye', name: '察言观色', cost: 100, prev: 'soft',
      tip: '选中球时能看到估算捕捉率——\n耳朵尖眼睛亮，什么时候丢球心里就有数。',
      q: '【讨教】「察言观色」帮你做到什么？', opts: ['丢球前估算成功率，心里有数', '听懂小动物说话', '看出对方几岁了'], a: 0 },
    { key: 'aid', name: '战后急救', cost: 160, prev: 'eye',
      tip: '战斗结束后帮伙伴包扎调息，\n体力能自行恢复三成，不用每次都回满血硬撑。',
      q: '【讨教】「战后急救」能恢复伙伴多少体力？', opts: ['战后自行恢复约三成', '瞬间满血', '越打越多'], a: 0 },
  ];

  /* —— 精灵小筑·阿橘（s9）：补给柜台 / 每日珍稀精灵架 / 收购台 / 驯兽讨教（s12）——
   * 买卖只在图鉴条目上打 gone 标记：收录、进度、任务需求全都不受影响 */
  S.petShop = async () => {
    const f = F(), CO = ADV.Collect;
    while (true) {
      const prog = CO.progress();
      const a = await choose(['买补给', '珍稀精灵架', '收购台', '驯兽讨教', '图鉴交换', '先逛逛'], { caption: { name: '阿橘',
        text: `欢迎光临精灵小筑～\n你的图鉴收录了 ${prog.got}/${prog.total} 种。\n口粮和宠物球，都是草丛探险的好帮手！` } });
      if (a === 0) { await shop(['critBall', 'goodBall', 'ultraBall', 'petFood', 'bait'], '精灵小筑 · 阿橘'); continue; }
      if (a === 1) {                                   // 珍稀精灵架：每日三格，隔天换货
        const shelf = CO.petShelf();
        if (!shelf.length) { await say({ name: '阿橘', text: '今天的好货都被人抱走啦，\n明天再来看看吧！' }); continue; }
        const opts = shelf.map(id => {
          const cr = CO.critter(id), e = CO.critterEntry(id);
          const boxed = e && e.gone && f.ranch && (f.ranch.a === id || f.ranch.b === id);
          const tag = e ? (e.gone ? (boxed ? '（🥚 牧场盒）' : '（可接回家）') : '（已住你家）') : '';
          return `${cr.name}（${cr.fam}系·${'★'.repeat(cr.rar)}）💰${CO.critterPrice(cr)}${tag}`;
        }).concat(['不买了']);
        const i = await choose(opts, { caption: { name: '阿橘', text: `今天的珍稀架！就这三格，\n明天就换新伙伴咯～（金币：${f.gold}）` } });
        if (i < 0 || i >= shelf.length) continue;
        const r = CO.buyCritter(shelf[i]);
        ADV.Audio.sfx(r.ok ? 'item' : 'wrong');
        await say({ name: '阿橘', text: r.msg });
        continue;
      }
      if (a === 2) {                                   // 收购台：收录过的小伙伴按稀有度折现（异色 ×3）
        const held = CO.heldCritters().filter(h => !h.gone);
        if (!held.length) { await say({ name: '阿橘', text: '你手上还没有能寄养的小伙伴呀。\n（草丛里收服过的都会记在图鉴上）' }); continue; }
        const opts = held.map(h => {
          const p = CO.sellPrice(h.cr, h.shiny);
          const rear = CO.critterRearing(h.id, ADV.Cal.day);   // 饲养倒计时：防止手滑卖掉临进化的幼体
          return `${h.cr.name}${h.shiny ? '✨' : ''}${rear >= 0 ? ` 🫙剩${rear}天` : ''}${f.buddy && f.buddy.id === h.id ? '（随行中）' : ''} → 💰${p}`;
        }).concat(['还是不卖了']);
        const i = await choose(opts, { caption: { name: '阿橘', text: '图鉴收录过的可以寄养到我这，\n按稀有度给收购价——异色翻三倍！' } });
        if (i < 0 || i >= held.length) continue;
        const h = held[i];
        const rearH = CO.critterRearing(h.id, ADV.Cal.day);
        const sure = await choose(['卖给阿橘', '再想想'], { caption: { name: '阿橘',
          text: `${h.cr.name}会找到好好待它的新主人。` + (rearH >= 0 ? '\n（它好像快要变化了——卖前再想想）' : '') + '\n（图鉴收录保留，随时可以再来接回家）' } });
        if (sure !== 0) continue;
        const r = CO.sellCritter(h.id);
        ADV.Audio.sfx(r.ok ? 'save' : 'wrong');
        await say({ name: '阿橘', text: r.msg });
        continue;
      }
      if (a === 3) {                                   // 驯兽讨教（s12.2）：付费+理论题学技巧，答错退学费
        f.tame = f.tame || {};
        const les = TAME_LESSONS.find(t => !f.tame[t.key]) || TAME_LESSONS[TAME_LESSONS.length - 1];
        if (!f.tame[les.key]) {
          const sure = await choose([`讨教「${les.name}」（💰${les.cost}）`, '先不了'],
            { caption: { name: '阿橘', text: f.tame[les.prev] || !les.prev
              ? `${les.name}可是驯兽的看家本领——\n${les.tip}\n学会它，我只收你 ${les.cost} 文学费！`
              : `想学「${les.name}」？先把「${TAME_LESSONS.find(t => t.key === les.prev).name}」学会了再来～` } });
          if (sure !== 0) continue;
          if (!(f.tame[les.prev] || !les.prev)) { await say({ name: '阿橘', text: '（基础还没打好，循序渐进步步来～）' }); continue; }
          f.gold = (f.gold || 0) - les.cost;
          const wrongs = { n: 0 };
          const qz = seededShuffle(TAMING_QUIZ.filter(q => !q.chart), ADV.Cal.day * 13 + TAME_LESSONS.indexOf(les))[0];
          await ask('阿橘', qz, wrongs, null, 'science');
          if (wrongs.n === 0) {
            f.tame[les.key] = true;
            ADV.Audio.sfx('quest');
            await say({ name: '阿橘', text: `学得真快！「${les.name}」从今天起就是你的了——\n${les.tip}` });
            logEvent(`向阿橘学会了驯兽技巧「${les.name}」`);
            save();
          } else {
            f.gold = (f.gold || 0) + les.cost;         // 答错退学费：焦点在知识，不罚钱
            await say({ name: '阿橘', text: '唔——要领还没抓住。学费先还你，\n想清楚了随时再来讨教！' });
          }
          continue;
        }
        await say({ name: '阿橘', text: `「${les.name}」你已经出师啦！\n${les.tip}` });
        continue;
      }
      if (a === 4) { await S.exchange(); continue; }   // P4 图鉴交换所：重复伙伴 + 换资 → 未得图鉴
      return;
    }
  };

  /* —— P4 图鉴交换所（阿橘柜台）：定向交换（指定目标：你的重复伙伴 + 换资）与
   *    每日免费交换请求（日期种子确定性生成，一换一、稀有度只升不降）。
   *    异色个体与随行伙伴不参与交换；换出个体图鉴收录保留（gone=1，可再接回）。 —— */
  S.exchange = async () => {
    const f = F(), CO = ADV.Collect;
    while (true) {
      const off = CO.dailyOffer();
      const done71 = f.dailyDone && f.dailyDone.day === ADV.Cal.day &&
                     off && f.dailyDone.want === off.want;   // 今日请求已成交（不刷新新单）
      const opts = ['定向交换（指定想要的目标）'];
      if (off) opts.push(done71
        ? `今日请求：${CO.critter(off.give).name} ⇄ ${CO.critter(off.want).name}（已成交 ✓）`
        : `今日请求：${CO.critter(off.give).name} ⇄ ${CO.critter(off.want).name}（免费）`);
      opts.push('回柜台');
      const a = await choose(opts, { caption: { name: '阿橘',
        text: `图鉴交换所开张啦——重复的小伙伴别闲着，\n换个新面孔给图鉴添一页！\n（金币：${f.gold}）` } });
      if (opts[a] === '回柜台') return;
      if (off && a === 1) {                            // 每日请求：免费一换一
        if (done71) { await say({ name: '阿橘', text: '今天的免费请求已经成交啦——\n明天再来，阿橘给你换新鲜货！' }); continue; }
        const sure = await choose(['成交！', '再看看'], { caption: { name: '阿橘',
          text: `今天我正想要一只${CO.critter(off.give).name}——\n作为回礼，${CO.critter(off.want).name}（${'★'.repeat(CO.critter(off.want).rar)}）跟你回家，分文不取！` } });
        if (sure !== 0) continue;
        const r = CO.doDailyOffer();
        ADV.Audio.sfx(r.ok ? 'item' : 'wrong');
        await say({ name: '阿橘', text: r.msg });
        continue;
      }
      // 定向交换：先挑目标 → 再挑换出的伙伴 → 确认
      const missing = CO.critterList().filter(c => !CO.has('critters', c.id)).sort((x, y) => (x.rar || 0) - (y.rar || 0));
      if (!missing.length) { await say({ name: '阿橘', text: '图鉴都集齐了？！那你可是传说级收藏家，\n没什么好交换的啦！' }); continue; }
      const topts = missing.map(c => `${c.name}（${c.fam}系·${'★'.repeat(c.rar)}）💰${CO.EX_COST[c.rar || 0]}`).concat(['先不换了']);
      const ti = await choose(topts, { caption: { name: '阿橘', text: '想要哪一页图鉴？选好目标，\n再挑一只你的小伙伴 + 换资来换——' } });
      if (ti < 0 || ti >= missing.length) continue;
      const target = missing[ti];
      const held = CO.heldCritters().filter(h => !h.gone && !h.shiny && !(f.buddy && f.buddy.id === h.id));
      if (!held.length) { await say({ name: '阿橘', text: '你手上没有能换出去的小伙伴——\n（异色和随行伙伴不收哦，去草丛再认识几只吧）' }); continue; }
      const gopts = held.map(h => {
        const rear = CO.critterRearing(h.id, ADV.Cal.day);   // 饲养倒计时：防止手滑换掉临进化的幼体
        return `${h.cr.name}（${'★'.repeat(h.cr.rar)}）${rear >= 0 ? ` 🫙剩${rear}天` : ''}`;
      }).concat(['取消']);
      const gi = await choose(gopts, { caption: { name: '阿橘',
        text: `换「${target.name}」的话，你想用哪只来换？\n（另付换资 💰${CO.EX_COST[target.rar || 0]}）` } });
      if (gi < 0 || gi >= held.length) continue;
      const give = held[gi];
      const rearG = CO.critterRearing(give.id, ADV.Cal.day);
      const sure = await choose(['换定！', '再想想'], { caption: { name: '阿橘',
        text: `${give.cr.name}换「${target.name}」，另付 💰${CO.EX_COST[target.rar || 0]}。` + (rearG >= 0 ? '\n（它好像快要变化了——换前再想想）' : '') + `\n（${give.cr.name}会住进新家，你的图鉴收录保留）` } });
      if (sure !== 0) continue;
      const r = CO.exchangeCritter(give.id, target.id);
      ADV.Audio.sfx(r.ok ? 'item' : 'wrong');
      await say({ name: '阿橘', text: r.msg });
    }
  };

  /* —— 三期C 后山隐藏驯兽导师：雾隐婆婆（扫地僧定位）。克制环出师后石屋的门才会开——
   *    图鉴 ≥20 种、带着随行伙伴、200 文学费 + 一道驯兽难题，学成「进化催化」：
   *    随行伙伴力/速永久 +1（battle.js 与 wildBattle 的满血公式自动消费） —— */
  S.hermitHut = async () => {
    const f = F(), CO = ADV.Collect;
    if (!(f.tame && f.tame.chart)) {
      await say({ text: '山径深处的石屋，门虚掩着。\n屋里飘出草药的苦香……但没有人应声。\n（或许要先弄懂「相克环」的道理——\n蒲老师的讲堂也许是个开始）' });
      return;
    }
    if (f.buddyBoost) {
      await say({ name: '雾隐婆婆', text: '「催化只有一次，贪多会折寿数。\n去吧，好好待它。」\n（石屋的灯又暗了下去）' });
      return;
    }
    if (CO.catCount('critters') < 20) {
      await say({ name: '雾隐婆婆', text: `「门是为懂相克的孩子留的。\n但催化要见过 20 种生灵才使得——\n你的图鉴，还差得远。（${CO.catCount('critters')}/20）」` });
      return;
    }
    if (!f.buddy) {
      await say({ name: '雾隐婆婆', text: '「催化要施在身边的孩子身上。\n空着手来，我给谁催化呢？」\n（先把随行伙伴带在身边吧）' });
      return;
    }
    if ((f.gold || 0) < 200) {
      await say({ name: '雾隐婆婆', text: '「学费 200 文——不是我要，\n是要你知道，潜力有价。」' });
      return;
    }
    await say({ name: '雾隐婆婆', text: `「哦……${CO.critter(f.buddy.id).name}？」\n她眯着眼打量你身边的伙伴，\n「骨相不错。要唤醒它沉睡的那份力吗？200 文。」` });
    const go = await choose(['接受催化（💰200）', '告辞'], { caption: { name: '雾隐婆婆', text: '「催化之前，先答我一个问题。\n答错不收钱，但今晚就不试了。」' } });
    if (go !== 0) return;
    f.gold -= 200;
    const qz = seededShuffle(TAMING_QUIZ.filter(q => q.chart), ADV.Cal.day * 23 + 11)[0];
    const wrongs = { n: 0 };
    await ask('雾隐婆婆', qz, wrongs, null, 'science');
    if (wrongs.n > 0) {
      f.gold += 200;
      await say({ name: '雾隐婆婆', text: '「今天不行了。回去把相克环再想想——\n钱还你，路留着。」' });
      return;
    }
    ADV.Audio.sfx('fanfare');
    f.buddyBoost = { pow: 1, spd: 1 };
    const bn = CO.critter(f.buddy.id).name;
    await say({ text: `婆婆把一撮发光的草灰敷在${bn}额头——\n它浑身一亮，骨架里像多了一口气。` });
    await say({ name: '雾隐婆婆', text: '「从今往后，它的力与速都多一分。\n记住：催化催化的是身体，\n养出这份力的，是你。」' });
    logEvent('接受了雾隐婆婆的进化催化');
    save();
    UI().toast(` ✨ 进化催化完成：${bn} 力/速 +1 `);
  };

  /* —— 操场新伙伴：陆飞（跑步达人）/ 林小雨（害羞转学生） —— */
  S.lufei = async (ent) => {
    const f = F(), C = ADV.Cal;
    E().playAction(ent, 'cheer', 1.4);
    if (!f.metLufei) {
      f.metLufei = true;
      await say({ name: '陆飞', text: '呼——呼——三十九、四十！\n哟，同学你也来操场？' });
      await say({ name: '陆飞', text: '我叫陆飞，陆地的陆，飞翔的飞！\n爸爸说这名字就是要我跑起来！' });
      await say({ name: '陆飞', text: '每天绕跑道十圈，风雨无阻。\n（他说这话时，眼睛亮得像两颗星星）' });
      save();
      return;
    }
    const slot = daySlot('lufeiRun');
    if (!slot.done) {
      const go = await choose(['陪你跑两圈！', '先聊聊天'], { caption: { name: '陆飞', text: `今天第 ${((C.day * 3) % 7 + 4)} 圈！\n要一起跑吗？带风的那种！` } });
      if (go === 0) {
        slot.done = true;
        await say({ text: '你跟着陆飞跑了两圈——\n风从耳边呼呼刮过，心跳得像敲鼓！' });
        E().playAction(ent, 'cheer', 1.6);
        E().playAction(E().player, 'cheer', 1.6);
        f.gold = (f.gold || 0) + 3;
        UI().toast(' 💰 挥汗如雨，陆飞塞给你买水的 3 金币 ');
        logEvent('陪陆飞在操场跑了两大圈');
        save();
        return;
      }
    }
    /* —— P-B2 微剧情二号线 ①：幸运腕带（三段：发现 → 看台寻回 → 归还） —— */
    if (f.lufeiChain === 1) {
      await say({ name: '陆飞', text: '腕带还是没影……肯定掉在看台了。\n那可是我从小学戴到现在的幸运物！' });
      return;
    }
    if (f.lufeiChain === 2) {
      f.lufeiChain = 3;
      E().playAction(ent, 'laugh', 1.8);
      ADV.Audio.sfx('fanfare');
      await say({ name: '陆飞', text: '我的腕带！！你从看台缝里抠出来的？\n太够意思了吧！' });
      await say({ name: '陆飞', text: '下周体育节我一定跑出最好成绩——\n到时候全场都会知道咱俩是朋友！' });
      ADV.Collect.gain('photos', 'p_run');              // 回忆照片：跑道边的击掌
      f.gold = (f.gold || 0) + 10;
      gainBond('lufei', 10);
      addCup(5);
      logEvent('帮陆飞找回了幸运腕带');
      save();
      UI().toast(' 🎽 微剧情完成：风一样的少年 ');
      return;
    }
    if (!f.lufeiChain && f.metPrincipal) {
      const g = await choose(['「腕带？怎么了？」', '「加油，先跑了再说」'], { caption: { name: '陆飞', text: '唉……我的幸运腕带刚才起跑时崩断了，\n弹没影了。八成掉在看台哪条缝里。\n没有它我总感觉脚下发飘……' } });
      if (g === 0) {
        f.lufeiChain = 1;
        await say({ name: '陆飞', text: '你帮我留意一眼呗？\n（操场西边的看台，座椅底下的缝）' });
        logEvent('陆飞的幸运腕带丢在了看台');
        save();
      } else {
        E().playAction(ent, 'cheer', 1.4);
        await say({ name: '陆飞', text: '说得对！风不会等我——\n跑起来就什么都顺了！' });
      }
      return;
    }
    await say({ name: '陆飞', text: ['呼吸和步子要合上拍——两步一吸，两步一呼！', '（他原地小碎步，一刻也停不下来）', '体育节周五就到了，我报了三个项目！'][((C.day % 3) | 0)] });
  };

  /* —— P-B2 微剧情二号线 ①中段：看台座椅缝里的幸运腕带 —— */
  S.grandstandStrap = async () => {
    const f = F();
    if (f.lufeiChain === 1) {
      f.lufeiChain = 2;
      ADV.Audio.sfx('item');
      await say({ text: '你蹲下来，把手伸进座椅底下的缝——\n指尖碰到一圈软软的织带。\n是陆飞的幸运腕带！' });
      save();
      UI().toast(' 🎽 找到了幸运腕带——拿去还给陆飞吧 ');
      return;
    }
    if (f.lufeiChain === 3) await say({ text: '看台被风吹得干干净净。\n（座椅缝里再也不会漏掉谁的幸运物了）' });
    else await say({ text: '看台的座椅被太阳晒得暖烘烘。\n（缝里只有几片落叶和半截粉笔）' });
  };

  S.linxiaoyu = async (ent) => {
    const f = F(), C = ADV.Cal;
    if (!f.metYu) {
      f.metYu = true;
      E().playAction(ent, 'shy', 1.6);
      await say({ name: '林小雨', text: '呀……你、你好。\n（她抱紧课本，往墙边缩了缩）' });
      await say({ name: '林小雨', text: '我叫林小雨……上周刚转来。\n还、还认不全班里的同学。' });
      await say({ text: '（她的桌角摆着一枚小小的枫叶书签，\n翻旧的书页里夹着好几张借书卡）' });
      save();
      return;
    }
    const slot = daySlot('yuyuTalk');
    if (!slot.done) {
      slot.done = true;
      const pick = await choose(['跟她打招呼', '聊聊书里的故事', '安静地陪坐一会儿'], { caption: { name: '林小雨', text: '那、那个……\n（她欲言又止地看了你一眼）' } });
      if (pick === 0) {
        await say({ text: '「早、早上好！」\n她愣了一下，然后抿嘴笑了——\n今天第一次有人先跟她说话。' });
        E().playAction(ent, 'laugh', 1.4);
      } else if (pick === 1) {
        await say({ text: '「《绿山墙的安妮》你读过吗？\n安妮说，把普通的日子想过成诗……」\n她讲到书，声音一下子清亮起来。' });
      } else {
        await say({ text: '你们安静地各看各的书。\n阳光挪过半张课桌，她悄悄放松了肩膀。' });
        E().playAction(ent, 'shy', 1.4);
      }
      save();
      return;
    }
    /* —— P-B2 微剧情二号线 ②：淋湿的《绿山墙的安妮》（三段：求助 → 秦墨支招 → 修好归还） —— */
    if (f.rainChain === 1) {
      await say({ name: '林小雨', text: '（她把书页压在字典下面，\n一页一页地抚平……效果不太好）\n「图书馆的秦老师……会不会懂这个？」' });
      return;
    }
    if (f.rainChain === 2) {
      f.rainChain = 3;
      E().playAction(ent, 'laugh', 1.8);
      ADV.Audio.sfx('fanfare');
      await say({ text: '按秦墨教的方法，吸水纸夹页、\n厚书压上一整夜——第二天，\n书页平得像什么都没发生过。' });
      await say({ name: '林小雨', text: '修、修好了！一点痕迹都没有！\n我可以自己去还书了……我决定，今天就还！' });
      await say({ text: '她把一枚枫叶书签塞进你手心，\n转身跑向图书馆，又回头小小地挥了挥手。' });
      ADV.Collect.gain('photos', 'p_rain');              // 回忆照片：屋檐下的共读
      gainBond('linxiaoyu', 10);
      gainBond('librarian', 5);
      addCup(5);
      logEvent('帮林小雨修好了淋湿的书');
      save();
      UI().toast(' 📖 微剧情完成：屋檐下的共读 ');
      return;
    }
    if (!f.rainChain && f.metYu && f.metPrincipal) {
      const g = await choose(['「书怎么了？」', '「我帮你想想办法」'], { caption: { name: '林小雨', text: '那个……上周五下雨，\n我把《绿山墙的安妮》落在室外长椅上了。\n书角全皱了……这么旧的书，\n还回去，秦老师会不会生气……' } });
      if (g === 1 || g === 0) {
        f.rainChain = 1;
        await say({ text: '（帮她想个修书的办法吧——\n图书馆的秦墨天天和旧书打交道，\n他一定有办法。）' });
        logEvent('林小雨的书被雨淋湿了');
        save();
      }
      return;
    }
    await say({ name: '林小雨', text: ['「今天……也请多指教。」', '（她在给枫叶书签换新的塑封）', '「图书角那本《海蒂》，好看……」'][((C.day % 3) | 0)] });
  };

  /* —— 午休广播体操（大课间，复用姿势系统） —— */
  S.radio = async () => {
    const f = F(), C = ADV.Cal;
    if (C.isNight()) { await say({ text: '（广播喇叭安静地立着。\n白天的大课间它才会响）' }); return; }
    if (f.radioDay === C.day) { await say({ text: '（今天的广播体操已经做过了，\n喇叭里的老师嗓子都哑了）' }); return; }
    f.radioDay = C.day;
    ADV.Audio.playBgm('tender');
    await say({ text: '♪～ 大课间广播准时响起：\n「第三套全国小学生广播体操，\n《时代在召唤》——现在开始！」' });
    const P = E().player;
    const around = ['xiaoming', 'xiaohong', 'xiaogang', 'xiaopang'].map(id => E().getNpc(id)).filter(Boolean);
    for (const [label, pose] of [['伸展运动', 'raise'], ['扩胸运动', 'wave'], ['踢腿运动', 'yawn'], ['跳跃运动', 'laugh']]) {
      await say({ text: `「${label}——\n二、三、四，再来——」` });
      E().playAction(P, pose, 1.5);
      around.forEach(n => E().playAction(n, pose, 1.5));
    }
    const ids = Object.keys(state.friends);
    ids.forEach(id => gainBond(id, 1));
    f.gold = (f.gold || 0) + 10;
    f.radioCount = (f.radioCount || 0) + 1;
    await say({ text: `「……本套广播体操到此结束。」\n浑身发热，精神百倍！（💰 +10${ids.length ? '，好友好感 +1' : ''}）` });
    if (f.radioCount >= 3 && !ADV.Collect.has('cards', 'c12')) {
      ADV.Collect.gain('cards', 'c12');
      await say({ text: '广播站的大哥哥跑过来，\n递给你一枚亮闪闪的徽章：\n「广播体操全勤奖——收好！」' });
      logEvent('拿到了广播体操满勤徽章');
    }
    logEvent('跟着大课间广播做了一套体操');
    save();
    try { const m = ADV.Engine.map; if (m && m.bgmCur) ADV.Audio.playBgm(m.bgmCur); } catch (e) {}
  };

  /* —— 周五体育节：主席台三连赛（跳远 / 拔河 / 接力） —— */
  const MEDALS = ['无', '铜牌', '银牌', '金牌'];
  S.sportsDay = async () => {
    const f = F(), C = ADV.Cal;
    if (C.isNight()) { await say({ text: '（主席台的幕布已经收起来了。\n体育节只在白天举行）' }); return; }
    if (!C.isFriday()) {
      await say({ name: '主席台', text: `【每周五 · 阳光体育节】\n今日三赛：沙坑跳远 · 班级拔河 · 四棒接力\n—— 今天是${['周一', '周二', '周三', '周四', '周五', '周六', '周日'][(C.day - 1) % 7]}，周五再来！` });
      return;
    }
    if (f.sportsDay === C.day) {
      await say({ name: '主席台', text: `今天的三赛已经结束。\n（本届成绩：${MEDALS[f.sportsMedal || 0]}${f.sportsChamp ? ' · 卫冕之王' : ''}）\n下一届体育节，下周五见！` });
      return;
    }
    await say({ name: '主席台', text: '广播响起：\n「阳光体育节——现在开始！\n第一项，沙坑跳远！」' });
    await say({ text: '看台上坐满了同学，\n小红和小刚在场边朝你挥拳头！' });
    const events = [
      { name: '沙坑跳远', kind: 'longjump', intro: '「助跑——起跳——！」\n全场屏住呼吸。' },
      { name: '班级拔河', kind: 'tug', intro: friend('lufei').love >= 30 ? '陆飞撸起袖子站到你身边：\n「放心拔，我给你压阵！」' : '绳子绷得像根铁棍——\n对面的三班人高马大！' },
      { name: '四棒接力', kind: 'relay', intro: '接力棒递到手心，还带着上一棒的体温。\n「各就各位——预备——」' }
    ];
    let wins = 0;
    const crowd = ['xiaohong', 'xiaogang', 'xiaopang', 'lufei'].map(id => E().getNpc(id)).filter(Boolean);
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      await say({ text: ev.intro });
      const win = await new Promise(res => ADV.Mini.start(ev.kind, res, { helper: friend('lufei').love >= 30 }));
      if (win) {
        wins += 1;
        crowd.forEach(n => E().playAction(n, 'cheer', 1.6));
        E().playAction(E().player, 'cheer', 1.6);
        await say({ text: `「好——！」看台炸开了锅，\n彩旗哗啦啦地摇。【${ev.name} · 胜】` });
      } else {
        crowd.forEach(n => E().playAction(n, 'doubt', 1.4));
        await say({ text: `差一口气……同学们还是使劲鼓着掌。\n【${ev.name} · 负】` });
      }
    }
    const medal = wins >= 3 ? 3 : wins === 2 ? 2 : 1;
    f.sportsDay = C.day;
    f.sportsMedal = Math.max(f.sportsMedal || 0, medal);
    ADV.Audio.sfx(wins >= 2 ? 'fanfare' : 'cancel');
    if (wins >= 3) {
      f.sportsChamp = true;
      if (!f.sportsGold) {
        f.sportsGold = true;
        await ADV.UI.itemGet('纯金小奖杯', '#ffd94c');
      }
      await say({ name: '刘老师', text: '三战全胜！\n本周「体育之星」——就是你！' });
      addGold(30);
      await say({ text: '看台上的欢呼掀翻了屋顶：\n「卫——冕——之——王——！」' });
      logEvent('体育节三连胜，夺得金牌');
    } else if (wins === 2) {
      await say({ name: '刘老师', text: '两胜一负，银牌到手！\n差一点点就是全胜咯！' });
      addGold(15);
      logEvent('体育节拿下两胜，摘得银牌');
    } else {
      await say({ name: '刘老师', text: '重在参与！铜牌也是牌——\n下周五四连赛，等着你雪耻！' });
      addGold(5);
      logEvent('体育节收获一枚铜牌');
    }
    gainBond('lufei', 3);
    save();
  };

  /* —— 操场与广场的新物件 —— */
  S.bleachers = async () => {
    const C = ADV.Cal;
    const lines = [
      '看台的水泥台阶被太阳晒得暖烘烘。\n（坐上来正好能看见整个操场）',
      '彩旗在风里啪啪作响，\n看台上还留着上届体育节的加油横幅。',
      '（看台角落有人用粉笔写着：\n「周五体育节 · 三连赛 · 金牌 30 金」）'
    ];
    await say({ name: '看台', text: lines[C.isFriday() ? 2 : (C.day % 2)] });
  };
  S.goalKick = async () => {
    await say({ text: '足球门的网兜破了个小洞，\n像咧着嘴等你来一脚。\n（体育节的拔河绳就挂在门柱上）' });
  };
  S.flowerbed = async () => {
    const C = ADV.Cal;
    const f = { spring: '花坛里的二月兰开成一小片紫雾，\n蜜蜂嗡嗡地忙着点名。', summer: '向日葵齐刷刷朝着太阳，\n像一群站得笔直的小学生。', autumn: '菊花挤挤挨挨地开了，\n风一吹，满花坛都是金色。', winter: '花坛盖上了松枝和积雪，\n（明年春天见，小花们）' }[C.seasonEn()];
    await say({ name: '花坛', text: f });
  };
  S.flagpole = async () => {
    const C = ADV.Cal;
    const fest = C.festival ? C.festival() : '';
    await say({ name: '升旗台', text: C.isFriday()
      ? '旗杆上的红旗展得笔直。\n（周五的旗，升得格外高）'
      : fest
        ? `银色的旗杆擦得锃亮，\n台阶边还多摆了一块手写牌：\n「今天是${fest}」`
        : '银色的旗杆擦得锃亮，\n映着头顶飘过的一小朵云。' });
  };
  S.honorBoard = async () => {
    const f = F();
    const ch = chapterState();
    const lines = ['【阳光中学 · 光荣榜】'];
    lines.push(`· 当前篇章：${ch.title}`);
    const b = f.badges, bn = ['math', 'chinese', 'science', 'english'].filter(k => b[k]).length;
    lines.push(bn >= 4 ? '★ 智慧徽章 · 大满贯！' : `□ 智慧徽章挑战：${bn}/4 枚`);
    if (f.sportsMedal) lines.push(`★ 体育节最好成绩：${MEDALS[f.sportsMedal]}${f.sportsChamp ? '（卫冕之王）' : ''}`);
    if (f.jumpBest) lines.push(`★ 沙坑跳远班级纪录：${f.jumpBest.toFixed(1)} 米`);
    if (f.radioCount) lines.push(`★ 广播体操坚持：${f.radioCount} 次`);
    if (f.cardWins) lines.push(`★ 翻卡对战：${f.cardWins} 连胜`);
    const toys = Object.keys(f.toy || {}).length;
    if (toys) lines.push(`★ 童年玩法会玩：${toys} 种`);
    if (f.finalPassed) lines.push('★ 后山石门 · 见证者');
    if (lines.length === 1) lines.push('（虚位以待——\n下一个名字，就是你！）');
    await say({ name: '光荣榜', text: lines.join('\n') });
  };

  /* —— 校园公告栏（每日刷新：课表 / 天气 / 失物招领 / 社团 / 食堂菜单） —— */
  S.campusBoard = async () => {
    const C = ADV.Cal, f = F();
    const notices = [
      `【今日课表】${['语文 · 数学 · 体育', '数学 · 英语 · 美术', '科学 · 音乐 · 班会', '语文 · 英语 · 实验', '数学 · 语文 · 周测'][C.day % 5]}`,
      `【天气台】今天${C.weather}，${C.weather.includes('雨') ? '记得带伞，别踩水坑……算了，踩一下吧。' : '适合去操场撒点野。'}`,
      `【失物招领】捡到红色发卡一枚（已有人认领）；\n橡皮擦半块，形状像月亮。`,
      `【社团招新】${['自然社：本周捕捉网九折', '棋社：招募敢和校长下棋的人', '合唱团：跑调也欢迎，我们缺低音'][C.day % 3]}`,
      `【食堂菜单】今日：${['糖醋排骨 · 冬瓜汤', '番茄炒蛋 · 绿豆汤', '大鸡腿 · 凉拌黄瓜', '红烧狮子头 · 酸梅汤'][C.day % 4]}\n（阿姨手不抖，真的）`,
      `【光荣事务】下周值日表已贴出，\n请各位对号入座。`,
      `【自然魔法课】蒲老师开课啦！\n后山虫鸣草丛挥网、河湾水边下笼——\n把野生小家伙收进生物图鉴吧（F 手册 → 收藏页）。`,
      `【生物图鉴速报】有人在后山高草听见虫鸣，\n还在河湾灌木看见发亮的小眼睛。\n（捉虫网和草编笼，礼品店都有售）`,
      `【温馨提示】后山石门附近请勿逗留。\n——教务处（字迹有些犹豫）`
    ];
    // 按天数做种子轮换，每天固定抽 3 条，像真的有人每天来换告示
    const pick = [0, 1, 2].map(i => notices[(C.day * 3 + i * 2 + (f.graduated ? 1 : 0)) % notices.length]);
    await say({ name: '校园公告栏', text: pick.join('\n────────\n') });
  };

  /* —— 教室 · 图书角：免费翻书，每天随机一句摘抄入册 —— */
  S.bookCorner = async () => {
    const f = F(), C = ADV.Cal;
    if (f.bookCornerDay === C.day) { await say({ text: '图书角的书被翻得整整齐齐，\n明天会换一批新书哦。' }); return; }
    f.bookCornerDay = C.day;
    const pool = ADV.Collect.DB.quotes.map(q => q.id).filter(id => !ADV.Collect.has('quotes', id));
    const qid = pool.length ? pool[(Math.random() * pool.length) | 0] : ['q1', 'q4', 'q13'][C.day % 3];
    ADV.Collect.gain('quotes', qid);
    ADV.Audio.sfx('item');
    const q = ADV.Collect.DB.quotes.find(x => x.id === qid);
    await say({ text: `你在图书角抽出一本薄薄的诗集，\n里面夹着一张借书卡，最后一个名字是你。\n「${q.name}」${q.desc}\n（摘抄已收入册）` });
    grantTalent('read');
    logEvent('在图书角读了会儿书');
    save();
  };

  /* —— 教室 · 卫生角：放学值日（劳务达人 + 零花钱 + 同学好感） —— */
  S.cleanDuty = async () => {
    const f = F(), C = ADV.Cal;
    if (f.cleanDay === C.day) { await say({ text: '卫生角干干净净，拖把拧得干干的。\n（今天已经值过日啦）' }); return; }
    if (C.period < 2) { await say({ text: '清扫工具排得整整齐齐。\n（放学后来帮忙吧，现在还没到打扫时间）' }); return; }
    const go = await choose(['留下来值日', '今天先算了'],
      { caption: { name: '卫生角', text: '值日表上今天空着两个名字。\n黑板没擦，地也没扫……要帮忙吗？' } });
    if (go !== 0) { await say({ text: '你悄悄背起书包溜了。\n（值日表还在等你）' }); return; }
    f.cleanDay = C.day;
    f.gold = (f.gold || 0) + 8;
    ADV.Audio.sfx('item');
    grantTalent('labor');
    gainBond('studentClass', 2);
    await say({ text: '扫地、擦黑板、给绿萝浇水……\n夕阳从窗户斜进来，灰尘在光里跳舞。\n王老师路过，冲你点了点头。\n（零花钱 +8，劳务达人 +1）' });
    if (f.classRole) {                                     // 班委以身作则（C7）：值日额外 +1 学院分
      addCup(1);
      UI().toast(` 📋 ${ { study: '学习委员', pe: '体育委员', arts: '文艺委员' }[f.classRole] || '班委' }以身作则 · 学院分 +1 `);
    }
    logEvent('放学后留下来值日');
    save();
  };

  /* —— 教室 · 自己的课桌抽屉 —— */
  S.myDrawer = async () => {
    const f = F(), C = ADV.Cal;
    if (!f.drawerOpened) {
      f.drawerOpened = true;
      ADV.Collect.addItem('pencil', 1);
      ADV.Audio.sfx('item');
      await say({ text: '你拉开自己课桌的抽屉——\n开学那天放进去的铅笔还在，\n旁边压着一张纸条：「加油！」\n（是你自己写的，字迹有点抖）\n获得：铅笔 ×1' });
      save();
      return;
    }
    if (f.drawerDay !== C.day) {
      f.drawerDay = C.day;
      const finds = [
        '半块月亮形状的橡皮——\n你想起公告栏上的失物招领。',
        '一张揉皱的草稿纸，\n背面画着后山石门的样子。',
        '昨天掉进去的一颗弹珠，\n滚到角落，像找到了藏身处。',
        '上课传的小纸条，\n你把它展平又叠好，没舍得扔。'
      ];
      await say({ text: `你翻了翻抽屉。\n${finds[C.day % finds.length]}` });
      return;
    }
    await say({ text: '抽屉里安安静静的。\n课本、橡皮、小纸条——都是你的秘密。' });
  };

  /* —— 教室 · 同学的课桌抽屉（每天一次的小窥探，纯风味） —— */
  S.deskDrawer = async () => {
    const f = F(), C = ADV.Cal;
    if (f.peerDrawerDay === C.day) { await say({ text: '还是那张课桌。\n（总翻别人的抽屉不太礼貌哦）' }); return; }
    f.peerDrawerDay = C.day;
    const peeks = [
      '课桌里塞着一本卷了角的漫画，\n扉页写着「小明专供，概不外借」。',
      '抽屉深处藏着一包没吃完的零食，\n包装袋鼓鼓的，像在憋笑。',
      '一本《体育画报》，\n某一页的球员被画上了皇冠。',
      '叠成方块的手工纸鹤，\n翅膀上写着很小的「加油」。',
      '一沓错题整理卡，工工整整——\n原来同桌的秘诀在这儿。'
    ];
    await say({ text: `你轻轻拉开一张课桌的抽屉。\n${peeks[(C.day * 5 + 2) % peeks.length]}\n（你悄悄推了回去，什么也没动）` });
    logEvent('偷看了同学的抽屉');
    save();
  };

  /* —— 小卖部（童年集换卡） —— */
  S.cardStand = async () => {
    if (periodScene('cardStand', [5])) {
      await say({ name: '木牌', text: '末班车开走以后，小铺的灯还亮着。\n老板把没卖完的卡一沓沓码进铁盒，\n铁盒合上时「咔」了一声，像给这一天收了个尾。' });
      logEvent('深夜在旧车站看小铺收摊');
      save();
      return;
    }
    await say({ name: '木牌', text: '「阳光小卖部」\n童年集换卡 · 五毛一包\n—— 老板王叔：什么都收，就是不打折' });
  };
  function randomNewCard() {          // 抽一张还没收集到的卡
    const pool = ADV.Collect.DB.cards.filter(c => !ADV.Collect.has('cards', c.id));
    return pool.length ? pool[(Math.random() * pool.length) | 0] : null;
  }
  S.cardman = async (ent) => {
    const f = F();
    while (true) {
      const n = ADV.Collect.catCount('cards'), total = ADV.Collect.totalOf('cards');
      const i = await choose([`买一包童年卡 💰5（卡册 ${n}/${total}）`, '翻卡对战（赢了 +8 金 + 随机卡）', '看看卡册', '离开'],
        { caption: { name: '王叔', text: '「来啦？新到的卡。\n闪卡嘛……说不定就藏在这包里。」' } });
      if (i === 0) {
        if (f.gold < 5) { ADV.Audio.sfx('wrong'); await say({ name: '王叔', text: '「五毛……啊不，五金币。\n孩子，钱不够咯。」' }); continue; }
        f.gold -= 5;
        const c = randomNewCard();
        if (!c) { f.gold += 5; await say({ name: '王叔', text: '「你都集齐啦！\n这包不能卖你——老板要破产。」' }); continue; }
        ADV.Collect.gain('cards', c.id);
        ADV.Audio.sfx('item');
        E().playAction(ent, 'laugh', 1.2);
        await say({ name: '王叔', text: `「撕——开！」\n是「${c.name}」${'★'.repeat(c.star || 1)}！` });
        logEvent(`在小卖部抽到「${c.name}」`);
        save();
      } else if (i === 1) {
        // 经济削峰：翻卡对战每日限一次，防止反复刷 +8
        if (f.cardDay === ADV.Cal.day) { await say({ name: '王叔', text: '「今天卡都被你翻熟啦，\n明天再来跟我过招。」' }); continue; }
        await say({ name: '王叔', text: '「翻卡对战——一人一沓，\n先配齐六对的赢！」' });
        const win = await new Promise(res => ADV.Mini.start('cards', res));
        if (win) {
          f.cardDay = ADV.Cal.day;
          f.cardWins = (f.cardWins || 0) + 1;
          f.gold = (f.gold || 0) + 8;
          E().playAction(ent, 'laugh', 1.6);
          await say({ name: '王叔', text: '「后生可畏！（💰 +8）' });
          const c = randomNewCard();
          if (c) {
            ADV.Collect.gain('cards', c.id);
            await say({ name: '王叔', text: `「愿赌服输——这张「${c.name}」归你！」` });
          }
          logEvent('在翻卡对战里赢了王叔');
        } else {
          E().playAction(ent, 'laugh', 1.4);
          await say({ name: '王叔', text: '「老板我宝刀未老！\n（回去练练再来～」' });
        }
        save();
      } else if (i === 2) {
        for (let pg = 0; pg < 2; pg++) {
          const lines = ADV.Collect.DB.cards.slice(pg * 6, pg * 6 + 6)
            .map(c => `${ADV.Collect.has('cards', c.id) ? '◆' : '◇'}${c.name} ${'★'.repeat(c.star || 1)}`);
          await say({ name: '卡册', text: lines.join('\n') + `\n（${pg === 0 ? '翻页' : '完'}）` });
        }
      } else return;
    }
  };
  S.picnic = async () => {
    const f = F(), C = ADV.Cal;
    if (!C.isWeekend()) { await say({ text: '长椅空着，阳光正好。\n（周末来这儿野餐吧）' }); return; }
    if (f.picnicWeek === C.weekIndex()) { await say({ text: '这周的野餐办过啦——\n肚子还是圆的。' }); return; }
    f.picnicWeek = C.weekIndex();
    ADV.Audio.playBgm('tender');
    await say({ text: '周末的河畔——\n你把便当摊开，同学们围了过来！' });
    const ids = Object.keys(state.friends);
    ids.forEach(id => gainBond(id, 1));
    E().playAction(E().player, 'laugh', 1.6);
    await say({ text: `大家聊了一下午。${ids.length ? '（在场好友好感 +1）' : '（下次带上朋友来！）'}` });
    F().gold = (F().gold || 0) + 5;
    save();
    try { const m = ADV.Engine.map; if (m && m.bgmCur) ADV.Audio.playBgm(m.bgmCur); } catch (e) {}
  };
  S.firefly = async () => {
    const f = F(), C = ADV.Cal;
    if (!C.isNight()) { await say({ text: '白天的草丛静悄悄。\n（萤火虫要等夜幕降临）' }); return; }
    if (f.fireflyNight === C.day) { await say({ text: '今晚的萤火虫都躲起来了。\n（明晚再来）' }); return; }
    f.fireflyNight = C.day;
    ADV.Audio.sfx('emote');
    if (!ADV.Collect.has('insects', 'i6')) {
      ADV.Collect.gain('insects', 'i6');
      await say({ text: '一点、两点、满河的星光……\n一只萤火虫落进你的图鉴。' });
    } else {
      F().gold = (F().gold || 0) + 10;
      await say({ text: '你陪萤火虫坐了一会儿。\n心情变好了（💰+10）。' });
    }
    save();
  };
  // —— 夏夜河湾·萤火虫夜：比后山更盛大的满河星光（夏季夜晚限定，每日一场） ——
  S.fireflyBay = async () => {
    const f = F(), C = ADV.Cal;
    if (!C.isNight()) { await say({ text: '河水在太阳底下亮得晃眼。\n（萤火虫要等夜幕降临）' }); return; }
    if (C.seasonEn() !== 'summer') { await say({ text: '老桥下只有几粒零星的光。\n（盛夏的夜里，这场灯会才点得起来）' }); return; }
    if (f.bayFireflyDay === C.day) { await say({ text: '今晚的河面已经亮过一轮了。\n（明晚再来赴约）' }); return; }
    f.bayFireflyDay = C.day;
    ADV.Audio.sfx('emote');
    // 借用引擎粒子：把河湾的蜻蜓暂时换成满河金色萤火，剧情结束后还原
    const m = ADV.Engine.map;
    const oldP = m && m.particles;
    if (m) m.particles = 'firefly';
    if (!ADV.Collect.has('insects', 'i6')) {
      ADV.Collect.gain('insects', 'i6');
      await say({ text: '老桥下的河面忽然亮了——\n一点、两点、千百点，\n像谁把银河倒进了南湾。\n一只萤火虫停在你的掌心，又飞进图鉴。' });
    } else {
      f.gold = (f.gold || 0) + 15;
      await say({ text: '满河的灯笼次第亮起，\n桥影、灯串、萤火连成一片。\n你把这个夏夜悄悄收好（💰+15）。' });
      logEvent('夏夜河湾看了一场萤火虫灯会');
    }
    if (m) m.particles = oldP || 'dragonfly';
    save();
  };

  // —— C1 秘密基地：三阶段建造（星露谷式：攒钱 → 动工 → 小窝落成） ——
  const BASE_STAGES = [
    { gold: 50,  name: '木板小据点', desc: '一只木墩、一张旧书桌——据点算是立起来了！' },
    { gold: 120, name: '秘密基地',   desc: '彩旗一挂、灯一点，这里成了只有我们知道的地方。' },
    { gold: 250, name: '梦想小窝',   desc: '画架、猫窝、宝贝箱子——全世界最好的角落！' }
  ];
  S.baseBuild = async () => {
    const f = F();
    if ((f.base || 0) >= 3) return S.baseClub();       // 满级后，告示牌变成聚会入口
    const nxt = BASE_STAGES[f.base];
    const i = await choose([`开工建造（💰${nxt.gold}）`, '再攒攒'],
      { caption: { name: '基地告示', text: `在这里搭个秘密基地——「${nxt.name}」要 💰${nxt.gold}。\n（现有 💰${f.gold || 0}）` } });
    if (i !== 0) { await say({ text: '你用粉笔在地上画了个框。\n（等钱攒够了就动工）' }); return; }
    if ((f.gold || 0) < nxt.gold) { await say({ text: '口袋翻了个遍，还差一点……\n（先去攒攒钱吧）' }); return; }
    f.gold -= nxt.gold;
    f.base = (f.base || 0) + 1;
    ADV.Audio.sfx('fanfare');
    await say({ text: `${nxt.desc}\n「${nxt.name}」落成！（进度 ${f.base}/3）` });
    logEvent(`把秘密基地建到了「${nxt.name}」`);
    try {                                              // 重载院子，让新陈设立刻出现
      const p = E().player;
      ADV.Engine.loadMap('homeYard', p.x, p.y, p.dir);
    } catch (e) {}
    save();
  };
  // —— 基地聚会：满级后每日一次，召集好友开小会（在场好友好感 +1） ——
  S.baseClub = async () => {
    const f = F(), C = ADV.Cal;
    if (f.basePartyDay === C.day) { await say({ text: '基地里还散落着昨天的零食袋。\n（明天再开小会吧）' }); return; }
    const i = await choose(['喊暗号，召集大家！', '自己坐一会儿'],
      { caption: { name: '秘密基地', text: '你的地盘你做主：' } });
    if (i !== 0) { await say({ text: '你靠着木墩发了一会儿呆。\n——这里真好。' }); return; }
    f.basePartyDay = C.day;
    ADV.Audio.playBgm('tender');
    await say({ text: '暗号一喊，大家从各个角落钻了出来！\n木墩不够坐，就挤一挤。' });
    const ids = Object.keys(state.friends);
    ids.forEach(id => gainBond(id, 1));
    if (ADV.Growth) ADV.Growth.addDim('bond', 2, '基地聚会');   // 五维无 social，人缘维度名是 bond
    F().gold = (F().gold || 0) + 10;
    E().playAction(E().player, 'laugh', 1.6);
    await say({ text: `一下午都在笑。${ids.length ? '（在场好友好感 +1，💰+10）' : '（下次带上朋友来！）'}` });
    logEvent('在秘密基地开了一场小会');
    save();
    try { const m = ADV.Engine.map; if (m && m.bgmCur) ADV.Audio.playBgm(m.bgmCur); } catch (e) {}
  };

  /* ==================== 后徽章时代 · P0：委托 / 日历 / 专题周 ==================== */

  // —— 每日委托板（校园公告栏旁） ——
  const QUEST_POOL = [
    { id: 'q_book', name: '图书角补书', text: '帮图书馆把散落的书归架。', fn: async () => { await say({ text: '你把三本放反的书转正、归位。\n书脊排成了一条整齐的线。' }); return 10; } },
    { id: 'q_lunch', name: '替阿姨送餐', text: '把两份加急的午餐送去宿舍。', fn: async () => { await say({ text: '你拎着饭盒一路小跑——\n宿舍的同学连声道谢。' }); return 12; } },
    { id: 'q_ball', name: '找煤球的球', text: '煤球的网球滚进花坛了。', fn: async () => { await say({ text: '你趴在花坛边捞了半天——\n球到手，一手花香。' }); const f = F(); f.dogLove = Math.min(100, (f.dogLove || 0) + 8); UI().toast(' 🐕 煤球亲密度 +8'); return 8; } },
    { id: 'q_water', name: '给花坛浇水', text: '校工爷爷腰不好，拜托你浇花。', fn: async () => { await say({ text: '水壶很沉，花很渴。\n浇完，整条路都是青草味。' }); return 9; } },
    { id: 'q_mail', name: '送一封信', text: '把教务处的信送到办公室（就在隔壁）。', fn: async () => { await say({ text: '王老师接过信，愣了一下：\n「……是我大学同学寄来的。」' }); return 10; } },
    { id: 'q_clean', name: '擦黑板', text: '值日生请假了，黑板归你。', fn: async () => { await say({ text: '板擦起落，粉尘在夕阳里飞。\n干净得都不忍心写题。' }); return 8; } }
  ];
  S.quests = async () => {
    const f = F(), C = ADV.Cal;
    if (f.quests.day !== C.day) {                       // 每日刷新 3 单
      const pool = [...QUEST_POOL].sort(() => Math.random() - .5);
      f.quests = { day: C.day, list: pool.slice(0, 3).map(q => q.id) };
      save();
    }
    const done = f.quests.done || (f.quests.done = []);
    const open = f.quests.list.filter(id => !done.includes(id));
    if (!open.length) { await say({ name: '委托板', text: '今天的委托全部完成！\n明天再来。' }); return; }
    const meta = id => QUEST_POOL.find(q => q.id === id);
    const i = await choose(open.map(id => meta(id).name).concat(['先不接']), { caption: { name: '委托板', text: `今日委托（${3 - open.length}/3 已完成）：\n${open.map(id => '·' + meta(id).name + '——' + meta(id).text).join('\n')}` } });
    if (i >= open.length) return;
    const q = meta(open[i]);
    const gold = await q.fn();
    f.gold = (f.gold || 0) + gold;
    done.push(q.id);
    ADV.Audio.sfx('item');
    await say({ text: `委托完成！💰 +${gold}` });
    if (done.length >= 3) { addCup(2); UI().toast(' 🌟 今日委托全部完成：学院分 +2 '); }
    save();
  };

  // —— 专题周（当周学科，打卡双倍） ——
  function themeWeek() {
    const t = ['数学周', '语文周', '科学周', '英语周'][Math.floor((ADV.Cal.day - 1) / 7) % 4];
    return t;
  }

  // —— 事件日历（手册「日历」页数据） ——
  function upcomingEvents() {
    const f = F(), C = ADV.Cal, out = [];
    for (let d = 0; d <= 7; d++) {
      const day = C.day + d, tag = d === 0 ? '今天' : d === 1 ? '明天' : `第${day}天`;
      const evs = [];
      const wd = day % 7;
      if (wd === 5) evs.push('📝 周五周测');
      if (wd === 6 || wd === 0) evs.push('🏃 周末（野餐 · 武斗大会 · 社团活动）');
      if (day >= 8 && day <= 10 && !f.sakura) evs.push('🌸 樱花祭');
      if (day === 11) evs.push('🍂 季节更替');
      if (day >= 15 && !f.mExam) evs.push('📑 月考' + (f.wuyunStudy ? '（乌云帮补考之战！）' : ''));
      if (day >= 17 && f.act >= 3 && !f.boar) evs.push('🐗 期中风波');
      if (f.act >= 3 && !f.sportsDone) evs.push('🏅 运动会（校务板报名）');
      if (wd === 6 && d === 0 && f.weekDone !== C.weekIndex()) evs.push('📖 周测补办（限今日）');
      if (day >= 21 && f.act >= 4 && !f.midterm) evs.push('🎓 期中大考');
      if (day >= 24 && !f.lantern) evs.push('🏮 萤火晚会（夜晚·河边）');
      if (day === 21) evs.push('❄️ 季节更替');
      if (day >= 30 && !f.graduated) evs.push('🎓🎓 毕业季（多结局）');
      const bds = Object.keys(BOND_META).filter(id => BOND_META[id].bday === day)
        .map(id => '🎂 ' + (BOND[id] ? BOND[id].name : id) + '的生日');
      out.push({ day, tag, evs: [...evs, ...bds] });
    }
    return { theme: themeWeek(), rows: out };
  }

  /* ==================== P1：怪谈 · 拍照 · 竞技场 · 煤球 ==================== */

  // —— 校园七大怪谈 ——
  const RUMORS = {
    1: { name: '会自己转身的雕像', text: '广场的雕像，昨夜明明朝着喷泉——\n今早却望着教学楼。\n（基座上有一圈新鲜的擦痕）' },
    2: { name: '池塘里的第二个倒影', text: '无风的午后，池塘里你的倒影\n比你慢了半拍才眨眼。\n（水草间沉着半块旧校牌）' },
    3: { name: '柳树下的白影', text: '傍晚河畔的柳树下，总站着\n一个白色的影子。\n（走近了，只有一件挂着的旧校服）' },
    4: { name: '修车铺深夜的灯', text: '修车铺半夜亮着一盏灯，\n叮叮当当响到天明。\n（大壮说：那是他爸给早班司机免费检修）' },
    5: { name: '书架间的低语', text: '图书馆最深处的书架间，\n有人在小声念诗。\n（其实是李老师在给旧书除尘，边扫边背）' },
    6: { name: '午夜琴声', text: '音乐教室半夜会自己响起琴声，\n只有三个音，do—mi—so。\n（赵老师说：那是她留给夜班保安的晚安曲）' },
    7: { name: '镜中的自己', text: '旧图书馆的镜子里，\n你的嘴角比你先扬起来。\n（镜面内侧贴着一张笑脸贴纸——有人怕照镜子的孩子害怕）' }
  };
  S.rumor = async (o) => {
    const f = F();
    if (f.rumor && f.rumor[o.rid]) { await say({ text: `（怪谈《${RUMORS[o.rid].name}》——已记录在册）` }); return; }
    f.rumor = f.rumor || {};
    f.rumor[o.rid] = true;
    ADV.Audio.sfx('emote');
    await say({ text: `【校园怪谈 · 七】\n《${RUMORS[o.rid].name}》\n${RUMORS[o.rid].text}` });
    const n = Object.keys(f.rumor).length;
    if (n >= 7 && !f.rumorTruth) {
      f.rumorTruth = true;
      await say({ text: '七则怪谈全部集齐——\n你翻来覆去地读，忽然明白了：\n每一则「灵异」，都是有人在偷偷守护谁。' });
      await say({ text: '校长在远处朝你眨了眨眼：\n「看穿怪谈的孩子，最适合当学生会长。」' });
      addCup(8);
      ADV.Collect.gain('quotes', 'q11');
      UI().toast(' 📕 暗线完成《校园七大怪谈》：真相是温柔 ');
    } else UI().toast(` 📕 怪谈收集 ${n}/7 `);
    save();
  };

  // —— 风景拍照（需照相机） ——
  S.photoSpot = async (o) => {
    if (!ADV.Collect.count('camera')) { await say({ text: '（这个角度太好了……\n可惜没有相机。小镇礼品店有售）' }); return; }
    if (ADV.Collect.has('scenes', o.cid)) { await say({ text: '（这张已经拍过了——\n仍是你最爱的机位之一）' }); return; }
    ADV.Audio.sfx('photo');
    const info = ADV.Collect.info('scenes', o.cid);
    await say({ text: `咔嚓——\n《${info.name}》，收进风景相册。` });
    ADV.Collect.gain('scenes', o.cid);
    if (F().club === '美术社') { F().gold = (F().gold || 0) + 4; UI().toast(' 🎨 美术社员加成：💰+4 '); }
    const n = ADV.Collect.catCount('scenes');
    if (n >= ADV.Collect.totalOf('scenes')) { addCup(6); UI().toast(' 📸 风景相册集齐！学校的一草一木都认得你了 '); }
    save();
  };
  // —— C2 写生簿：持画画本在取景框前画下风景（终身一幅，同入风景相册） ——
  S.sketchSpot = async (o) => {
    if (!ADV.Collect.count('sketch')) { await say({ text: '（取景框里的一切都在喊「画我」——\n可惜没带画画本。文具店有售）' }); return; }
    if (ADV.Collect.has('scenes', o.cid)) { await say({ text: '（这幅已经画过，就夹在写生簿里）' }); return; }
    ADV.Audio.sfx('emote');
    const info = ADV.Collect.info('scenes', o.cid);
    await say({ text: `笔尖沙沙——\n《${info.name}》画进写生簿，也收进了风景相册。` });
    ADV.Collect.gain('scenes', o.cid);
    if (F().club === '美术社') { F().gold = (F().gold || 0) + 6; UI().toast(' 🎨 美术社员加成：💰+6 '); }
    const n = ADV.Collect.catCount('scenes');
    if (n >= ADV.Collect.totalOf('scenes')) { addCup(6); UI().toast(' 📸 风景相册集齐！学校的一草一木都认得你了 '); }
    save();
  };

  const STREET_SCENES = ['s13', 's14', 's15', 's16', 's17'];
  const RURAL_SCENES = ['s18', 's19', 's20'];
  const ownedCount = (cat, ids) => ids.filter(id => ADV.Collect.has(cat, id)).length;

  S.photolady = async (ent) => {
    const f = F();
    const streetN = ownedCount('scenes', STREET_SCENES);
    const ruralN = ownedCount('scenes', RURAL_SCENES);
    if (!f.photoStreetQuest) {
      f.photoStreetQuest = true;
      E().playAction(ent, 'wave', 1.5);
      await say({ name: '照相师', text: '你来得正好。我想做一本「小镇生活册」，\n缺的不是人，是会走路的眼睛。' });
      await say({ name: '照相师', text: '先去把东南街区最有味道的 3 处拍回来：\n照相馆橱窗、老桥河湾、老街巷口、旧车站、四时广场，任拍 3 处都算。' });
      UI().toast(' 📷 照相馆委托：街区风景 3/5 取 3 ');
      save();
      return;
    }
    if (!f.photoStreetDone && streetN >= 3) {
      f.photoStreetDone = true;
      ADV.Audio.sfx('fanfare');
      ADV.Collect.gain('photos', 'p_townlife');
      ADV.Collect.addItem('sketch', 1);
      addGold(35);
      await say({ name: '照相师', text: '就是这种感觉。桥灯、巷子、站台，全是会呼吸的日子。' });
      await say({ name: '照相师', text: '这本「东南街区拼贴」送你。\n再往郊外拍 2 处回来，我给你做第二册。' });
      logEvent('把街区风景交给了照相馆');
      save();
      return;
    }
    if (f.photoStreetDone && !f.photoRuralDone && ruralN >= 2) {
      f.photoRuralDone = true;
      ADV.Audio.sfx('fanfare');
      ADV.Collect.gain('photos', 'p_rural');
      ADV.Collect.addItem('coffee', 1);
      addGold(40);
      await say({ name: '照相师', text: '风车田、萤火谷、旧宅外墙……郊外被你拍得像一段冒险。' });
      await say({ name: '照相师', text: '第二册也成了。\n以后再有新地方，记得第一个拿来给我看。' });
      logEvent('把郊外风景交给了照相馆');
      save();
      return;
    }
    if (!ADV.Collect.count('camera')) {
      await say({ name: '照相师', text: '空着手可拍不回光。\n先去礼品店买台相机吧，我等你。' });
      return;
    }
    if (!sceneSeen('photoladyCrit')) {
      await say({ name: '照相师', text: !f.photoStreetDone
        ? `街区风景拍到 ${streetN}/3 了。\n别只拍招牌，记得把人会停下来的地方也拍进去。`
        : `郊外风景拍到 ${ruralN}/2 了。\n风里会动的地方，最容易出好照片。`
      });
      return;
    }
    await say({ name: '照相师', text: '镜头不是拿来证明你到过哪，\n是拿来证明你看见了什么。' });
  };

  S.barber = async (ent) => {
    const f = F();
    const i = await choose(['来个精神头造型', '聊聊街坊', '先算了'],
      { caption: { name: '理发师', text: f.barberDay === ADV.Cal.day
        ? '今天已经给你修过一轮啦。\n精神头还热乎着呢。'
        : '头发一修，人就像刚从清晨里走出来。\n今天要不要顺手理一理？' } });
    if (i === 2) return;
    if (i === 1) {
      await say({ name: '理发师', text: '市场那边看的是眼缘。\n你精神，价钱就能多谈半成。' });
      return;
    }
    if (f.barberDay === ADV.Cal.day) {
      await say({ name: '理发师', text: '今天已经很利落了。\n明天再来，我给你换个更神气的。' });
      return;
    }
    f.barberDay = ADV.Cal.day;
    f.marketCharmDay = ADV.Cal.day;
    f.marketCharmUsed = 0;
    f.studyBuff = true;
    E().playAction(ent, 'wave', 1.4);
    await say({ name: '理发师', text: '喀嚓喀嚓——好了！\n今天去跳蚤市场摆摊，第一笔价会更好谈。' });
    UI().toast(' 💈 今日理发加成：市场第一笔卖价提升 ');
    logEvent('在理发店把自己收拾得很精神');
    save();
  };

  S.clockman = async (ent) => {
    const f = F();
    if (f.clockDay === ADV.Cal.day) { await say({ name: '钟表匠', text: '今天的报时题做过啦。\n钟表的耐心，要一点一点攒。' }); return; }
    const h = ((ADV.Cal.day * 2) % 12) + 1;
    const m = [0, 15, 30, 45][ADV.Cal.day % 4];
    const add = [10, 20, 30, 40][(ADV.Cal.day + 1) % 4];
    const total = ((h % 12) * 60 + m + add);
    const ah = (Math.floor(total / 60) % 12) || 12;
    const am = total % 60;
    const fmt = (hh, mm) => `${hh}:${String(mm).padStart(2, '0')}`;
    const right = fmt(ah, am);
    const opts = [right, fmt(((ah + 1) % 12) || 12, am), fmt(ah, (am + 15) % 60)];
    const order = opts.map((v, idx) => ({ v, idx })).sort(() => Math.random() - .5);
    const ans = await choose(order.map(x => x.v).concat('先不算了'),
      { caption: { name: '钟表匠', text: `表盘上现在指着 ${fmt(h, m)}。\n再过 ${add} 分钟，会走到哪一格？` } });
    if (ans >= order.length) return;
    f.clockDay = ADV.Cal.day;
    if (order[ans].idx === 0) {
      f.clockWins = (f.clockWins || 0) + 1;
      ADV.Audio.sfx('correct');
      addGold(12);
      await say({ name: '钟表匠', text: '分针走得准，心也静。\n你这孩子，算起时间来像在听钟。' });
      if (f.clockWins >= 3 && !ADV.Collect.has('quotes', 'q12')) {
        ADV.Collect.gain('quotes', 'q12');
        await say({ text: '他把一张旧纸片塞给你：\n「给，送你一句老行话——一寸光阴一寸金。」' });
      }
      logEvent('在钟表铺做对了一道报时题');
    } else {
      ADV.Audio.sfx('wrong');
      await say({ name: '钟表匠', text: `差一点，正确的是 ${right}。\n再过一天，分针还会回来。` });
    }
    save();
  };

  S.tailor = async (ent) => {
    const f = F();
    if (!f.tailorQuest) {
      f.tailorQuest = true;
      E().playAction(ent, 'wave', 1.4);
      await say({ name: '裁缝阿姨', text: '我想给街坊做一串小布旗，挂到老街口去。\n还差一束花和一根发绳配色。' });
      UI().toast(' 🧵 裁缝阿姨的请求：花束 + 幸运发绳 ');
      save();
      return;
    }
    if (!f.tailorDone && ADV.Collect.count('flower') > 0 && ADV.Collect.count('ribbon') > 0) {
      f.tailorDone = true;
      ADV.Collect.useItem('flower', 1);
      ADV.Collect.useItem('ribbon', 1);
      ADV.Collect.addItem('poem', 1);
      addGold(18);
      ADV.Audio.sfx('fanfare');
      await say({ name: '裁缝阿姨', text: '好，颜色齐了。等我缝好，整条老街都会亮一点。' });
      await say({ name: '裁缝阿姨', text: '这本小诗集给你。\n能替人把日子缝在一起的，不只针线。' });
      logEvent('帮裁缝阿姨凑齐了布旗材料');
      save();
      return;
    }
    await say({ name: '裁缝阿姨', text: `我等的是一束花和一根发绳。\n${ADV.Collect.count('flower') > 0 ? '花有了，' : '花还没来，'}${ADV.Collect.count('ribbon') > 0 ? '发绳也有了。' : '发绳还差一根。'}` });
  };

  S.comicCorner = async () => {
    const f = F();
    if (!f.comicCornerDone) {
      if (!ADV.Collect.count('comic')) { await say({ text: '角落里压着几张漫画草稿。\n（小明要是有一本新漫画，能在这儿蹲一下午）' }); return; }
      const i = await choose(['把漫画留在这儿', '还是自己留着'], { caption: { name: '漫画角', text: '小明最爱的连载角落。\n要不要把手上的漫画放在这里给他看？' } });
      if (i === 1) return;
      ADV.Collect.useItem('comic', 1);
      f.comicCornerDone = true;
      gainBond('xiaoming', 8);
      ADV.Collect.gain('wishes', 'w1');
      if (!ADV.Collect.has('cards', 'c10')) ADV.Collect.gain('cards', 'c10');
      addGold(18);
      await say({ text: '第二天来时，漫画已经被翻得起了卷。\n角落里留着小明写的纸条：\n「超神！下次我也给你看我的！」' });
      logEvent('把漫画留在了老街漫画角');
      save();
      return;
    }
    if (periodScene('comicCorner', [3])) {
      gainBond('xiaoming', 1);
      await say({ text: '放学铃一响，小明就蹲到了漫画角，\n膝盖上摊着半本翻旧的书，头也不抬。' });
      logEvent('放学后在老街漫画角撞见小明');
      save();
      return;
    }
    await say({ text: sceneSeen('comicCorner') ? '漫画角静静的，只剩翻旧纸页的味道。' : '小明显然又来过，最喜欢的那一页被折了角。' });
  };

  S.snackNest = async () => {
    const f = F();
    const item = ADV.Collect.count('snack') > 0 ? 'snack' : ADV.Collect.count('bread') > 0 ? 'bread' : '';
    if (!f.snackNestDone) {
      if (!item) { await say({ text: '墙角藏着一个零食窝。\n（带点辣条或面包来，这里才会热闹起来）' }); return; }
      const nm = ADV.Collect.itemInfo(item).name;
      const i = await choose([`把${nm}放在这里`, '改天再说'], { caption: { name: '零食窝', text: '这明显是小胖的秘密根据地。\n要不要留点吃的？' } });
      if (i === 1) return;
      ADV.Collect.useItem(item, 1);
      f.snackNestDone = true;
      gainBond('xiaopang', 8);
      ADV.Collect.gain('wishes', 'w4');
      ADV.Collect.addItem('juice', 1);
      await say({ text: '傍晚再来时，角落里只剩包装纸和一张潦草留言：\n「谁放的？救大命了，超好吃！」' });
      logEvent('在老街给小胖留了零食');
      save();
      return;
    }
    if (periodScene('snackNest', [2])) {
      gainBond('xiaopang', 1);
      await say({ text: '午休的巷子安静得只剩咀嚼声——\n小胖正蹲在墙角，飞快地解决一包辣条。' });
      logEvent('午休时在老街逮到小胖补零食');
      save();
      return;
    }
    await say({ text: sceneSeen('snackNest') ? '零食窝今天已经被扫荡干净了。' : '砖缝里还卡着一张辣条包装，看起来很满足。' });
  };

  S.runSlope = async () => {
    const f = F();
    if (!f.runSlopeDone) {
      if (!ADV.Collect.count('juice')) { await say({ text: '坡道有点陡，风却很好。\n（要是带瓶运动饮料来，小红肯定会喜欢）' }); return; }
      const i = await choose(['把饮料放在坡顶', '先自己留着'], { caption: { name: '晨跑坡', text: '这里像是小红跑完会停一会儿的地方。' } });
      if (i === 1) return;
      ADV.Collect.useItem('juice', 1);
      f.runSlopeDone = true;
      gainBond('xiaohong', 8);
      ADV.Collect.gain('wishes', 'w2');
      addCup(2);
      await say({ text: '第二天坡顶多了一根扎得整齐的发绳，旁边压着字条：\n「谢谢。下次我请你一起跑。」' });
      logEvent('在晨跑坡给小红留了一瓶饮料');
      save();
      return;
    }
    if (periodScene('runSlope', [0])) {
      await say({ text: '清晨的坡道还蒙着雾，脚下的白线一直伸进雾里。\n空气凉得像刚洗过。' });
      logEvent('清晨在晨跑坡起跑');
      save();
      return;
    }
    await say({ text: sceneSeen('runSlope') ? '坡道今天还湿着晨雾。' : '风顺着坡往下走，像有人刚跑过去。' });
  };

  // —— 山顶演武台：木牌与问碑指引 ——
  S.summitSign = async () => {
    const M = F().martial;
    if (!M.peak) await say({ name: '木牌', text: '「演武台」\n—— 木人桩任你练手，古碑以武学传诀。\n（拳脚想深造？体育馆刘老师的武术课每周开讲）' });
    else await say({ name: '木牌', text: '「演武台」\n—— 崖风猎猎，适合把新学的招式打上一百遍。' });
  };

  S.singBridge = async () => {
    const f = F();
    if (!f.singBridgeDone) {
      f.singBridgeDone = true;
      gainBond('xiaogang', 6);
      ADV.Collect.gain('wishes', 'w3');
      await say({ text: '桥边的回声刚刚好，像是专门拿来试音。\n你站着听了一会儿，觉得小刚一定很喜欢这里。' });
      logEvent('在老桥边听见了一段练声的回音');
      save();
      return;
    }
    if (periodScene('singBridge', [5])) {
      gainBond('xiaogang', 1);
      await say({ text: '夜里的桥洞把水声收得很低，\n中间夹着一段很轻的练声，像怕吵醒河面。' });
      logEvent('深夜在老桥边听见一段很轻的练声');
      save();
      return;
    }
    await say({ text: sceneSeen('singBridge') ? '今晚桥下只有水声。' : '桥洞里把一句哼唱托得很远，又轻轻送回来。' });
  };

  S.pengField = async () => {
    const f = F();
    if (!f.pengFieldDone) {
      f.pengFieldDone = true;
      gainBond('jinpeng', 6);
      ADV.Collect.gain('wishes', 'w8');
      addCup(1);
      await say({ text: '跑道边摆着一双擦得发亮的钉鞋。\n你忽然明白，这地方大概是金鹏最想靠自己赢一次的地方。' });
      logEvent('在鹏场见到金鹏留下的训练痕迹');
      save();
      return;
    }
    if (periodScene('pengField', [4])) {
      gainBond('jinpeng', 1);
      await say({ text: '天色压下来，跑道上只剩一个人影。\n金鹏把最后一组冲刺跑完，才撑着膝盖喘气。' });
      logEvent('傍晚在鹏场看金鹏加练');
      save();
      return;
    }
    await say({ text: sceneSeen('pengField') ? '跑道上只剩风在掠过终点线。' : '白线笔直地伸出去，像一句没说出口的较劲。' });
  };

  S.momoCorner = async () => {
    const f = F();
    const item = ADV.Collect.count('coffee') > 0 ? 'coffee' : ADV.Collect.count('flower') > 0 ? 'flower' : '';
    if (!f.momoCornerDone) {
      if (!item) { await say({ text: '角落里摆着几只写满字的小瓶。\n（带杯热咖啡或一束花来，也许会有人喜欢）' }); return; }
      const nm = ADV.Collect.itemInfo(item).name;
      const i = await choose([`把${nm}放在实验角`, '还是算了'], { caption: { name: '墨角', text: '瓶瓶罐罐之间，留着一小块最安静的地方。' } });
      if (i === 1) return;
      ADV.Collect.useItem(item, 1);
      f.momoCornerDone = true;
      gainBond('momo', 7);
      ADV.Collect.gain('wishes', 'w9');
      ADV.Collect.addItem('pencil', 1);
      await say({ text: '第二天你看见瓶底压着一张配方纸：\n「谢谢。热的时候更适合思考。」' });
      logEvent('在墨角留下了一份小礼物');
      save();
      return;
    }
    if (periodScene('momoCorner', [5])) {
      await say({ text: '人都走光了，实验角还留着一盏小灯。\n纸上写了一半的式子，笔尖停在最后一个等号上。' });
      logEvent('深夜看见墨角还留着没算完的式子');
      save();
      return;
    }
    await say({ text: sceneSeen('momoCorner') ? '试剂瓶今天摆得整整齐齐。' : '桌角多了一张小纸条，上面写着几行新公式。' });
  };

  S.duckPond = async () => {
    const f = F();
    if (periodScene('duckPond', [4])) {
      ADV.Collect.addItem('bait', 1);
      await say({ text: '天快黑时，鸭子一只只回到塘边挤成一排。\n你在浅水里摸到一条蚯蚓。' });
      logEvent('傍晚在鸭塘边看鸭子归塘');
      save();
      return;
    }
    const i = await choose(['喂鸭子', '在塘边钓鱼', '看看水面'], { caption: { name: '鸭塘', text: '鸭子排成一串，水波轻轻推着它们。' } });
    if (i === 1) { await S.fish(); return; }
    if (i === 2) { await say({ text: '鸭群一拐弯，水面就碎成一片片小月亮。' }); return; }
    if (!ADV.Collect.count('bread')) { await say({ text: '鸭子很期待地望着你。\n（要是有面包就好了）' }); return; }
    if (f.duckPondDay === ADV.Cal.day) { await say({ text: '鸭子们今天已经吃得很满足了。' }); return; }
    f.duckPondDay = ADV.Cal.day;
    ADV.Collect.useItem('bread', 1);
    ADV.Collect.addItem('bait', 2);
    await say({ text: '鸭子们扑腾着围过来，塘边也翻出两条蚯蚓。\n你顺手捡起来了。' });
    logEvent('在鸭塘喂了一群鸭子');
    save();
  };

  S.windmillField = async () => {
    const f = F();
    if (periodScene('windmillField', [4])) {
      await say({ text: '夕阳把风车叶片染成一格一格的橘色，\n影子顺着田埂一遍遍扫过去。' });
      logEvent('傍晚在风车田看落日');
      save();
      return;
    }
    if (f.windmillDay === ADV.Cal.day) { await say({ text: '风车今天转得和刚才一样慢，像在午睡。' }); return; }
    f.windmillDay = ADV.Cal.day;
    if (!ADV.Collect.has('leaves', 'l8')) ADV.Collect.gain('leaves', 'l8');
    addGold(6);
    await say({ text: '风一来，风车和田埂一起响。\n你在脚边拾到一片竹叶，还捡到几枚被风吹出来的硬币。' });
    logEvent('在风车田里站了一会儿');
    save();
  };

  S.oldHouse = async () => {
    const f = F();
    if (!f.oldHouseHint) {
      f.oldHouseHint = true;
      await say({ text: '旧宅窗框上的齿轮早就锈死了。\n门边留着一道很新的刮痕，像是谁差一点就把它修好。' });
      save();
      return;
    }
    if (f.oldHouseDone) { await say({ text: '窗子已经被修好了一条缝。\n风从里面吹出来，带着旧纸和木头味。' }); return; }
    if (periodScene('oldHouse', [5])) {
      await say({ text: '夜里走近旧宅，破窗里透出一点很淡的光。\n你再看一眼，光就没了。' });
      logEvent('深夜在旧宅窗外看见一点光');
      save();
      return;
    }
    if (!ADV.Collect.count('gear')) {
      await say({ text: '要是有个合适的齿轮，说不定真能把这扇窗拨开。' });
      return;
    }
    const i = await choose(['把齿轮装上去', '再看看'], { caption: { name: '旧宅', text: '锈住的机关就在眼前。\n要不要试着修一修？' } });
    if (i === 1) return;
    ADV.Collect.useItem('gear', 1);
    f.oldHouseDone = true;
    if (!ADV.Collect.has('quotes', 'q18')) ADV.Collect.gain('quotes', 'q18');
    addGold(45);
    addCup(2);
    ADV.Audio.sfx('open');
    await say({ text: '齿轮“咔哒”一声咬合，窗子终于让开了一条缝。\n里面掉出一页旧笔记，还有一小袋早年藏下的硬币。' });
    logEvent('修好了旧宅窗上的机关');
    save();
  };

  S.openAirFilm = async () => {
    if (periodScene('openAirFilm', [4])) {
      await say({ text: '天色一暗，幕布就被扯得笔直。\n有人搬来小板凳，有人干脆坐在石阶上，\n片子还没开始，广场已经先热闹起来了。' });
      logEvent('傍晚在四时广场看了一场露天电影');
      save();
      return;
    }
    if (ADV.Cal && ADV.Cal.period < 4) { await say({ text: '幕布还卷在竹竿上，要等天黑透了才支起来。' }); return; }
    await say({ text: '片子放完了，幕布上的光一点点收回去。\n地上还留着几张没带走的报纸当坐垫。' });
  };

  S.farmKitchen = async () => {
    if (periodScene('farmKitchen', [0])) {
      await say({ text: '天刚亮，灶膛里的火已经烧起来了。\n炊烟从瓦缝里慢慢爬出去，\n把整个院子熏成一层温温的米汤味。' });
      logEvent('清晨在小农舍闻到灶烟');
      save();
      return;
    }
    const i = await choose(['添把柴', '揭开锅盖看看', '先不打扰'], { caption: { name: '灶台', text: '灶台还是温的，锅盖边沿冒着一点白气。' } });
    if (i === 2) return;
    if (i === 0) { await say({ text: '你往里塞了两根干柴，火苗重新旺起来。\n农舍阿姨在屋里喊了一声：「谢谢啦——」' }); return; }
    await say({ text: '锅里煮着一锅稠稠的南瓜粥。\n你盖回去，没敢多看一眼。' });
  };

  // —— 无尽答题竞技场（道场） ——
  S.endlessArena = async () => {
    const f = F();
    const go = await choose([`开始挑战（纪录 ${f.arenaBest} 连胜）`, '离开'], { caption: { name: '无尽竞技场', text: '四科混题 · 3 条命 · 连击加倍！' } });
    if (go === 1) return;
    let combo = 0, best = 0, lives = 3;
    const subs = ['math', 'chinese', 'science', 'english'];
    while (lives > 0) {
      const sub = subs[(Math.random() * 4) | 0];
      const diff = combo >= 5 ? 'hard' : combo >= 2 ? 'normal' : 'easy';
      const q = await ADV.AI.question(sub, diff);
      const i = await choose(q.opts, { cancelIndex: -1, caption: { name: `第 ${combo + 1} 连 · ${diff === 'hard' ? '困难' : diff === 'normal' ? '普通' : '简单'} · ❤${lives}`, text: q.q } });
      if (ADV.Mistake) ADV.Mistake.answer(SUBJ_CN[sub] || sub, q, i);   // 科目转中文，与考试线错题本口径一致
      if (i === q.a) { combo++; ADV.Audio.sfx('correct'); }
      else { lives--; combo = 0; ADV.Audio.sfx('wrong'); await say({ text: '答错了——损失一条命！\n（正确答案已进错题本）' }); }
      best = Math.max(best, combo);
      if (combo > 0 && combo % 5 === 0) await say({ text: `${combo} 连击！全场喝彩！` });
    }
    // 经济削峰：每日首次全额；当日再战奖励减半且无十连奖（防止无上限刷钱）
    const first = f.arenaDay !== ADV.Cal.day;
    const gold = best * (first ? 8 : 4) + (first && best >= 10 ? 50 : 0);
    f.arenaDay = ADV.Cal.day;
    f.gold = (f.gold || 0) + gold;
    if (best > (f.arenaBest || 0)) { f.arenaBest = best; UI().toast(` 🏆 竞技场新纪录：${best} 连胜！`); }
    addCup(Math.min(6, Math.floor(best / 3)));
    await say({ text: `挑战结束！最高 ${best} 连击。\n💰 +${gold}${first ? (best >= 10 ? '\n（十连以上额外 +50！）' : '') : '\n（今日已挑战过，奖励减半）'}` });
    save();
  };

  // —— 煤球养成（亲密度三阶） ——
  S.dog2 = async (ent) => {
    const f = F();
    // —— 喂面包（成为战斗伙伴的老链路 + 亲密度） ——
    const lvl = f.dogLove >= 60 ? 3 : f.dogLove >= 30 ? 2 : f.dogLove >= 10 ? 1 : 0;
    const acts = ['摸摸头'];
    if (ADV.Collect.count('bread')) acts.push('喂面包（亲密度 +8）');
    if (lvl >= 1) acts.push('出去玩（捡零花钱）');
    if (lvl >= 2) acts.push('嗅宝点（埋宝提示）');
    const i = await choose(acts.concat('离开'), { caption: { name: '煤球', text: `汪！（亲密度 ${f.dogLove}/100 · Lv.${lvl}${lvl < 3 ? `，${[10, 30, 60][lvl]} 升下一阶` : '·满级忠诚'}）` } });
    if (i === 0) {
      if (f.dogDay === ADV.Cal.day) { E().emote(ent, '♥'); await say({ name: '煤球', text: '呼噜……（它今天被摸得很满足，明天再来）' }); return; }
      f.dogDay = ADV.Cal.day; f.dogLove = Math.min(100, f.dogLove + 5);
      E().emote(ent, '♥'); E().playAction(ent, 'play', 1.4);
      await say({ name: '煤球', text: `汪呜～（它把下巴搁在你手心）\n亲密度 +5（${f.dogLove}/100）` });
      save();
      return;
    }
    const which = acts[i];
    if (which && which.startsWith('喂面包')) {          // 喂食：亲密度 + 伙伴链路
      ADV.Collect.useItem('bread');
      f.dogFed = (f.dogFed || 0) + 1;
      f.dogLove = Math.min(100, f.dogLove + 8);
      E().emote(ent, '♥');
      await say({ name: '煤球', text: `汪呜！！（面包一秒消失）\n亲密度 +8（${f.dogLove}/100 · 累计喂食 ${f.dogFed} 次）` });
      if (f.dogFed >= 3 && !f.dogPal) {
        f.dogPal = true;
        ADV.Audio.sfx('fanfare');
        await say({ text: '煤球蹭了蹭你的腿，郑重地把脖子上的旧木牌\n给你看：「探险社·一号」。\n它决定在战斗里帮你咬敌人一口！' });
        UI().toast(' 🐕 煤球成为伙伴：战斗开场咬击 +2 攻击 ');
      }
      save();
      return;
    }
    if (which && which.startsWith('出去玩')) {          // Lv1：捡零花钱
      const g = 5 + ((Math.random() * 6) | 0);
      f.gold = (f.gold || 0) + g;
      await say({ text: `煤球从花坛里刨出一枚硬币，\n骄傲地放在你脚边。💰 +${g}` });
      save();
      return;
    }
    if (which && which.startsWith('嗅宝点')) {          // Lv2：嗅宝点
      const left = 8 - Object.keys(f.dig || {}).length;
      await say({ name: '煤球', text: `嗅嗅……汪！（它朝${left > 0 ? `还有 ${left} 处埋宝的方向甩了甩尾巴` : '埋宝全部挖完的方向摇了摇头'}）` });
      return;
    }
  };

