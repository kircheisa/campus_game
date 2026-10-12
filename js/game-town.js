/* =========================================================
 * game-town.js —— 游戏剧情拆分段 6/8
 * NPC 大扩充 · 新事物 · 后院农场 · 畜牧 · 公园农田
 * 必须按 core → event → scene → quest → retro → town → life → save 顺序加载。
 * ========================================================= */
  /* ==================== P2：社团 · 料理 · 武斗大会 ==================== */

  // —— 社团经营 ——
  const CLUBS = {
    '文学社': { perk: '周测语文奖励 +5', chief: '李老师' },
    '美术社': { perk: '拍照额外 +4 金币', chief: '美术部长' },
    '棋艺社': { perk: '骑士棋奖励 +1 学院分', chief: '道场师傅' },
    '科学社': { perk: '花盆浇水效率翻倍', chief: '陈老师' }
  };
  S.clubJoin = async () => {
    const f = F();
    if (f.club) {
      // —— 每周社团活动 ——
      if (f.clubWeek === ADV.Cal.weekIndex()) { await say({ name: '社团登记处', text: `本周「${f.club}」活动已参加。\n社团等级 Lv.${f.clubLv}/3。` }); return; }
      await say({ text: `「${f.club}」的每周活动日！\n部长带着大家练${f.club === '文学社' ? '飞花令' : f.club === '美术社' ? '速写' : f.club === '棋艺社' ? '残局' : '小实验'}。` });
      const w = await new Promise(res => ADV.Mini.start(f.club === '棋艺社' ? 'chess' : f.club === '美术社' ? 'ball' : 'music', res));
      f.clubWeek = ADV.Cal.weekIndex();
      if (w) {
        if (f.clubLv < 3) f.clubLv += 1;
        addCup(2 + f.clubLv);
        gainBond('artChief', 3);
        await say({ text: `活动圆满！社团等级 → Lv.${f.clubLv}/3。` });
      } else await say({ text: '虽然搞砸了，但大家笑作一团。\n（下周再来）' });
      save();
      return;
    }
    const names = Object.keys(CLUBS);
    const i = await choose(names.map(n => `${n}（${CLUBS[n].perk}）`).concat('再想想'), { caption: { name: '社团登记处', text: '选择你的社团（每周活动日升级社团）：' } });
    if (i >= names.length) return;
    f.club = names[i];
    addCup(3);
    ADV.Audio.sfx('fanfare');
    await say({ text: `欢迎加入「${f.club}」！\n社服已备好（穿在了心里）。\n福利：${CLUBS[f.club].perk}` });
    save();
  };

  // —— 料理（阿姨处学，家里做饭桌做） ——
  // r5 材料贴合矿工主题（矿洞炭火烤红薯）；r7-r9 缝合农场/鸡舍/钓鱼产出，形成「种→做→吃/送」闭环
  const RECIPES = [
    { id: 'r1', name: '阳光蛋包饭', mats: { bread: 1, flower: 1 }, from: 'aunt', need: 1 },
    { id: 'r2', name: '糖醋排骨饭', mats: { bread: 2, juice: 1 }, from: 'aunt', need: 2 },
    { id: 'r3', name: '星星曲奇', mats: { flower: 2 }, from: 'star', need: 1 },
    { id: 'r4', name: '月光羹', mats: { moonGrass: 1, juice: 1 }, from: 'yuejian', need: 1 },
    { id: 'r5', name: '矿工炖菜', mats: { bread: 1, sweetpotato: 1 }, from: 'miner', need: 2 },
    { id: 'r6', name: '四季春卷', mats: { flower: 1, juice: 1, bread: 1 }, from: 'aunt', need: 3 },
    { id: 'r7', name: '田园时蔬汤', mats: { tomato: 1, pea: 1, egg: 1 }, from: 'aunt', need: 3 },
    { id: 'r8', name: '丰收南瓜派', mats: { pumpkin: 1, wheat: 1 }, from: 'aunt', need: 2 },
    { id: 'r9', name: '炭火烤鱼', mats: { fish: 1, sweetpotato: 1 }, from: 'miner', need: 3 }
  ];
  function learnableRecipes(npcId) {
    return RECIPES.filter(r => r.from === npcId && friend(npcId).stage >= r.need && !F().recipes[r.id]);
  }
  async function teachRecipe(npcId) {
    const list = learnableRecipes(npcId);
    if (!list.length) return;
    for (const r of list) {
      F().recipes[r.id] = true;
      ADV.Audio.sfx('item');
      const mats = Object.entries(r.mats).map(([k, n]) => `${ADV.Collect.itemInfo(k).name}×${n}`).join(' + ');
      await say({ name: BOND[npcId] ? BOND[npcId].name : '???', text: `教你一道拿手菜——\n《${r.name}》（材料：${mats}）\n回家在饭桌上就能做啦！` });
    }
    save();
  }
  // —— 做饭核心（由饭桌菜单调用） ——
  async function cookAtHome() {
    const f = F();
    const known = RECIPES.filter(r => f.recipes[r.id]);
    if (!known.length) { await say({ text: '（还没学会任何菜谱。\n跟食堂阿姨、星儿她们多聊聊！）' }); return; }
    const i = await choose(known.map(r => `${r.name}（${Object.entries(r.mats).map(([k, n]) => `${ADV.Collect.itemInfo(k).name}×${n}`).join('+')}）`).concat('不做了'), { caption: { text: `💰${f.gold} ｜ 在家做饭：` } });
    if (i >= known.length) return;
    const r = known[i];
    for (const [k, n] of Object.entries(r.mats))
      if (ADV.Collect.count(k) < n) { ADV.Audio.sfx('wrong'); await say({ text: `缺材料：${ADV.Collect.itemInfo(k).name}×${n}\n（钓鱼/种花/采集都能凑）` }); return; }
    Object.entries(r.mats).forEach(([k, n]) => ADV.Collect.useItem(k, n));
    ADV.Collect.addItem(r.id, 1);
    ADV.Audio.sfx('item');
    await say({ text: `锅铲翻飞，香气出锅——\n《${r.name}》×1 入背包！（战斗大补 + 高级礼物 · 回家饭桌吃出当日加成）` });
    save();
  }

  // —— 料理 buff（S5）：吃下自制料理 → 当天一种临时加成（f.buff 只记日期，过夜自然失效） ——
  const DISH_BUFF = { r1: 'vig', r2: 'vig', r5: 'vig', r3: 'swift', r6: 'swift', r8: 'swift', r4: 'mem', r7: 'mem', r9: 'mem' };
  const BUFF_META = {
    mem:   { icon: '🧠', name: '好记性',   desc: '今天答对题额外 +1 知识点' },
    vig:   { icon: '🍖', name: '精力充沛', desc: '今天精力消耗打八折' },
    swift: { icon: '👟', name: '健步如飞', desc: '今天走路更快一点' },
  };
  function buffActive(k) { const b = F().buff; return !!(b && b[k] === ADV.Cal.day); }
  // 吃自家菜：饭桌菜单调用——同类 buff 不叠加，以最后一次吃的为准
  async function eatAtHome() {
    const f = F(), C = ADV.Cal, CO = ADV.Collect;
    const owned = Object.keys(DISH_BUFF).filter(id => CO.count(id) > 0);
    if (!owned.length) { await say({ text: '（背包里没有能吃的家常菜。\n在饭桌做几道，或去河边钓条鱼烤了！）' }); return; }
    const opts = owned.map(id => {
      const m = BUFF_META[DISH_BUFF[id]];
      return `${CO.itemInfo(id).name} ×${CO.count(id)}（${m.icon}${m.name}）`;
    }).concat('先不吃');
    const i = await choose(opts, { caption: { name: '饭桌', text: '热一热就能吃——每道菜一种当日加成，\n同类不叠加，选最需要的吃哦。' } });
    if (i < 0 || i >= owned.length) return;
    const id = owned[i], t = DISH_BUFF[id], m = BUFF_META[t];
    CO.useItem(id, 1);
    f.buff = f.buff || {};
    f.buff[t] = C.day;
    if (t === 'vig') C.gainEnergy(12);
    ADV.Audio.sfx('item');
    ADV.UI.toast(` ${m.icon} 《${CO.itemInfo(id).name}》下肚 ·「${m.name}」生效（${m.desc}） `);
    save();
  }

  // —— 武斗大会（周末 · 道场挑战榜前插入） ——
  async function tourney() {
    const f = F();
    if (ADV.Cal.day % 7 !== 6 || f.tourneyWeek === ADV.Cal.weekIndex()) return false;
    await say({ name: '武斗大会', text: '周末八强淘汰赛开擂！\n你连过三关，杀进决赛——' });
    const foes = ['dazhuang', 'xiaoying', 'rival'];
    for (const foe of foes) {
      const w = await new Promise(res => ADV.Battle.start(foe, {}, res));
      if (!w) { await say({ text: '惜败半决赛……\n（下周再战！）' }); f.tourneyWeek = ADV.Cal.weekIndex(); save(); return true; }
    }
    const w = await new Promise(res => ADV.Battle.start('wuyun', {}, res));
    f.tourneyWeek = ADV.Cal.weekIndex();
    if (w) {
      ADV.Collect.addItem('cape', 1);
      f.gold = (f.gold || 0) + 50;
      addCup(8);
      ADV.Audio.sfx('fanfare');
      await say({ text: '冠军！！校长亲自为你披上\n「武斗大会披风」（攻击 +3）！' });
    } else await say({ text: '决赛憾负——但全场为你起立。' });
    save();
    return true;
  }

  // —— 毕业多结局（第 30 天睡觉触发） ——
  async function graduationCheck() {
    const f = F();
    if (ADV.Cal.day < 30 || f.graduated) return false;
    f.graduated = true;
    ADV.Audio.playBgm('grad');
    const stages = Object.values(state.friends).reduce((s, r) => s + (r.stage || 0), 0);
    const nodes = ADV.Mistake ? ADV.Mistake.totalNodes() : 0;
    const hero = f.shadowWin && f.senseiWin && f.houseCup;
    const scholar = nodes >= 20;
    const bond = stages >= 30;
    const legend = hero && scholar && bond;
    f.endingType = legend ? '传奇' : scholar ? '学者' : hero ? '英雄' : bond ? '羁绊' : '成长';
    await say({ text: '—— 第 30 天 · 毕业季 ——\n这一年的阳光中学，到此告一段落。' });
    const tails = {
      传奇: '知识、勇气与友谊——你一样都没落下。\n校长在礼堂宣布：校史馆将单独立一页，\n页名就叫你的名字。',
      学者: '知识树的每一条枝桠都亮着。\n你被推选为「学生讲师」，\n明年，换你站上讲台。',
      英雄: '石门、秘境、遗忘之雾——\n学校深处的故事都记得你。\n保安大爷把自己的扫帚传给了你（象征性的）。',
      羁绊: '翻翻手册——满页都是♥。\n毕业那天，全班在樱花树下等你合影。\n你不是转学生了，你是这里的人。',
      成长: '第一天的你，连校门朝哪开都不知道。\n现在的你，能给新同学画一张藏宝图了。\n这就叫长大。'
    };
    await say({ text: tails[f.endingType] });
    const rep = growthReport(true);                              // 期末成长报告：四年数据一页看完（force 取新鲜值）
    await say({ name: '📋 期末成长报告', text: `—— 这一学期，你留下了这些脚印 ——\n${rep.rows.join('\n')}` });
    await say({ name: '✉️ 老师评语', text: rep.comment });
    logEvent('领取了学期成长报告');
    f.gold = (f.gold || 0) + 200;
    addCup(10);
    UI().toast(` 🎓 毕业结局达成【${f.endingType}】（之后可继续自由游玩 / NG+）`);
    await say({ text: '（标题画面新增「新的学期（NG+）」——\n带着友谊与图鉴，题目更难地再来一年！）' });
    save();
    return true;
  }

  // —— 期末成长报告：聚合一学期的学习/收集/社交/财务数据 + 五维之最 + 老师评语 ——
  // 手册成长页每帧调用——500ms TTL 备忘（毕业结算用 force 取新鲜值）。
  let repCache = null, repAt = 0;
  function growthReport(force) {
    const now = Date.now();
    if (!force && repCache && now - repAt < 500) return repCache;
    const f = F(), C = ADV.Cal, Cl = ADV.Collect;
    let qn = 0, qok = 0;                                         // 全学期答题聚合（quizLog 按日累计）
    Object.values(f.quizLog || {}).forEach(r => { qn += r.n; qok += r.ok; });
    const rate = qn ? Math.floor(qok / qn * 100) : 0;
    const stages = Object.values(state.friends).reduce((s, r) => s + (r.stage || 0), 0);
    let top = 'knowledge', topV = -1;                            // 五维之最（aggregate 含 flag 反推展示值）
    try {
      const agg = ADV.Growth.aggregate();
      Object.keys(agg).forEach(k => { if (agg[k] > topV) { topV = agg[k]; top = k; } });
    } catch (e) {}
    const DIM_CN = { knowledge: '学识', body: '体魄', mind: '心性', bond: '人缘', art: '技艺' };
    const rows = [
      `📖 知识点 ${totalKp()} · 答题 ${qn} 次 · 正确率 ${rate}%`,
      `🐾 图鉴 ${Cl.catCount('critters')}/${Cl.totalOf('critters')} · 累计收服 ${f.catchTotal || 0} 只`,
      `💗 好友进度 ${stages} · 帮助声望 ${f.helpPts || 0} · 连续打卡 ${C.dump().bestStreak} 天`,
      `🏆 学院分 ${f.cup || 0} · 零花钱 ${f.gold || 0} 文 · 五维之最：${DIM_CN[top] || top}`
    ];
    const comments = {
      knowledge: { by: '王老师', text: '课堂上你的眼睛是亮的。保持这份好奇心，它会带你走得很远。' },
      body: { by: '刘老师', text: '操场上总能看到你的身影。身体是本钱，你已经攒下了最厚的一页。' },
      mind: { by: '校长', text: '你学会了安静与思考。心里的秩序，是比分数更重要的收获。' },
      bond: { by: '同学们', text: '大家都说，有你在一间教室里，连放学都变得慢了些。' },
      art: { by: '美术老师', text: '你看世界的角度很特别。把这个角度留住，别让它被磨平。' }
    };
    const cm = comments[top] || comments.knowledge;
    if (!force) { repCache = { rows, comment: `「${cm.text}」——${cm.by}`, top }; repAt = now; }
    return { rows, comment: `「${cm.text}」——${cm.by}`, top };
  }

  // —— 成就墙（手册「成就」页数据） ——
  function achievements() {
    const f = F(), C = ADV.Collect;
    const st = Object.values(state.friends).reduce((s, r) => s + (r.stage || 0), 0);
    const A = [
      ['初来乍到', f.metPrincipal, '见过校长'],
      ['四星连珠', f.gateOpen || ['math', 'chinese', 'science', 'english'].every(k => (f.badgeEver || f.badges)[k]), '集齐四枚智慧徽章（曾拿过即可，不受每日重置影响）'],
      ['开山之门', f.gateOpen, '打开后山石门'],
      ['月光新生', f.houseCup, '赢下学院杯'],
      ['时光旅人', f.ch3Done, '完成时光回廊'],
      ['学习之星', ADV.Mistake && ADV.Mistake.totalNodes() >= 10, '知识树点亮 10 节点'],
      ['学者之心', ADV.Mistake && ADV.Mistake.totalNodes() >= 20, '知识树点亮 20 节点'],
      ['满勤之星', C.dump ? false : (ADV.Cal.dump().bestStreak >= 7), '连续打卡 7 天'],
      ['月考及格', f.mExam, '完成月考'],
      ['期中S级', f.midterm, '完成期中大考'],
      ['武林新秀', !!f.martial.sweep, '学会第一门武功'],
      ['一代宗师', ['sweep', 'tie', 'listen', 'steps', 'heart'].every(k => f.martial[k]), '集齐五本武林秘诀'],
      ['魔法学徒', Object.values(f.spells).some(Boolean), '学会第一门魔法'],
      ['大魔导师', Object.values(f.spells).every(Boolean), '集齐四门魔法'],
      ['竞技场之王', (f.arenaBest || 0) >= 10, '竞技场 10 连胜'],
      ['扫地僧认可', f.senseiWin, '击败保安大爷'],
      ['武斗冠军', ADV.Collect.count('cape') > 0, '武斗大会夺冠'],
      ['怪谈侦探', f.rumorTruth, '揭开校园七大怪谈'],
      ['风景摄影师', C.catCount('scenes') >= C.totalOf('scenes'), '拍遍 12 处风景'],
      ['书虫', C.catCount('books') >= C.totalOf('books'), '集齐全部书籍'],
      ['昆虫博士', C.catCount('insects') >= C.totalOf('insects'), '集齐昆虫图鉴'],
      ['拾秋', C.catCount('leaves') >= C.totalOf('leaves'), '集齐落叶图鉴'],
      ['寻宝猎人', Object.keys(f.dig || {}).length >= 8, '挖遍全部埋宝'],
      ['宝藏传说', f.chests && f.chests.chestC, '取得黄金小猫像'],
      ['人气王', st >= 20, '友谊故事总进度 20'],
      ['知心朋友', st >= 30, '友谊故事总进度 30'],
      ['煤球的家人', f.dogLove >= 60, '煤球亲密度满阶'],
      ['社团栋梁', f.clubLv >= 3, '社团升至 Lv.3'],
      ['小当家', Object.keys(f.recipes || {}).length >= 3, '学会 3 道料理'],
      // —— P2 新系统成就（系统收集闭环） ——
      ['落叶收藏家', f.leafMiles && f.leafMiles[8], '落叶里程碑集满 8 种'],
      ['满汉全席', Object.keys(f.recipes || {}).length >= 9, '学会全部 9 道料理'],
      ['猫语者', (state.friends.cat && state.friends.cat.stage) >= 3, '小猫亲密度满阶'],
      ['心想事成', C.catCount('wishes') >= C.totalOf('wishes'), '集齐全部心愿'],
      ['矿山赞助人', f.oreDonated, '向矿工捐献矿石'],
      // —— s13.3 驯兽线成就（生物课 × 精灵系统联动） ——
      ['生物课代表', !!(f.tame && f.tame.chart), '听完蒲老师的克制环讲堂'],
      ['驯兽学徒', !!(f.tame && f.tame.soft && f.tame.eye && f.tame.aid), '向阿橘学齐三招驯兽技巧'],
      ['知识驯兽师', !!(ADV.Mistake && ADV.Mistake.totalNodes() >= 15 && ADV.Collect.catCount('critters') >= 10), '知识树点亮 15 节点且收录 10 种生物'],
      // —— s15 周末打磨成就（电影夜 / 跳蚤集市 / 收服 / 传说三只） ——
      ['电影发烧友', (f.movieNights || 0) >= 5, '看满 5 场周日电影夜'],
      ['集市常客', (f.fleaVisits || 0) >= 3, '逛满 3 个周日跳蚤集市'],
      ['捕虫高手', (f.catchTotal || 0) >= 10, '累计收服 10 只小家伙（球/网/笼都算）'],
      ['金色传说', C.shinyCount() >= 3, '图鉴里集齐 3 只金色异色个体（高档工具更容易遇见）'],
      ['夜钓客', C.has('fish', 'f9'), '钓到只在夜晚咬钩的月光鱼'],
      ['雨夜传说', C.has('fish', 'f10'), '雨夜里钓到传说中的霓虹鲤'],
      ['奥赛金牌', (f.olympGold || 0) >= 1, '拿下一场学科奥赛冠军'],
      ['全能学霸', Object.keys(f.olympWins || {}).length >= 3, '三个学科的奥赛都拿过冠军'],
      ['珍稀架收藏家', f.legendTrio, '集齐传说三只（月光凤蝶 · 锦鲤苗 · 山神小狐狸）'],
      ['早睡早起', f.graduated && ADV.Cal.sleepDebt === 0, '零睡眠债迎来毕业'],
      ['毕业快乐', f.graduated, '迎来毕业结局'],
      // —— P-B 期 / 驯兽三期 / s5-s8 成就 ——
      ['晨曦的祝福', f.dawnAltar, '唤醒四季花园的晨曦祭坛（圣物伏笔回收）'],
      ['心满益善', HEART_IDS.every(k => f.heartDone[k]), '听完六位挚友的心里话'],
      ['时光信使', f.capsuleDone, '走完六挚友隐藏线，打开时光胶囊'],
      ['不败之壁', (f.rushBest || 0) >= 6, '挑战榜极限连战六连胜'],
      ['连战入门', (f.rushBest || 0) >= 3, '挑战榜极限连战三连胜'],
      ['斗虫大会冠军', f.bugKing, '斗虫大会三连胜夺杯'],
      ['钓鱼大赛冠军', (f.contestChamp || 0) >= 1, '周日钓鱼大赛夺魁'],
      ['牧场主', f.cow && f.sheep, '牛棚羊圈双全（挤奶与剪毛都上手）'],
      ['小镇之光', (f.helpPts || 0) >= 12, '帮助板声望 12：全镇的感谢都归你'],
      ['驯兽宗师', !!f.buddyBoost, '接受雾隐婆婆的进化催化'],
      // —— 四师签名挑战 ——
      ['文理四通', ['math', 'chinese', 'science', 'english'].every(s => Object.keys((f.tkind || {})[s] || {}).length >= 4), '每门学科的试炼 / 作业 / 奥赛 / 签名挑战都体验过'],
      // —— 时段自习 & 学业榜 ——
      ['全校第一', !!f.acadFirst, '登上学业光荣榜榜首（每周刷新的虚拟榜）']
    ];
    return A.map(([name, done, desc]) => ({ name, done: !!done, desc }));
  }

  // —— NG+：带着友谊与图鉴重新开学 ——
  function ngStart() {
    const keep = { friends: JSON.parse(JSON.stringify(state.friends)), col: JSON.parse(JSON.stringify(F().col || {})), items: JSON.parse(JSON.stringify(F().items || {})), name: F().name || '', ngplus: true,
                   moralPrev: Object.assign({}, F().moralPrev, F().moral) };   // 「上一个你」跨周目累积
    state.flags = blankFlags();
    state.flags.col = keep.col;
    state.flags.items = keep.items;
    state.flags.name = keep.name;                        // 新学期还是同一个人
    state.flags.ngplus = keep.ngplus;
    state.flags.moralPrev = keep.moralPrev;              // 抉择池重开，但旧选择都记得
    state.friends = keep.friends;
    ADV.Cal.load({ day: 1, period: 0, weather: '晴', checkedIn: false, streak: 0 });
    // NG+ 信物（成长系统三选一，由标题菜单进入时选择；默认笔记本）
    if (ADV.Growth) ADV.Growth.reset(state.ngRelic || 'notebook');
    ADV.Engine.loadMap('homeIn', 18, 11, 'up');
    setTimeout(() => { S._intro(); }, 80);
    save();
  }

  S._intro = async () => {
    if (F().introDone) return;
    ADV.Game.busy = true;
    try {
      if (F().ngplus) {                              // P-B4：NG+ 差异化序章——带着回忆重新开学
        await say({ text: '—— 春 · 清晨 · 阳光小镇 ——\n又是蝉鸣还未醒来的早晨。\n镜子里的自己，好像比记忆里精神了一点。' });
        await say({ text: '书包、便当、熟悉的街道。\n一切都和记忆里一样——\n又好像哪里都不一样了。' });
        await say({ name: '妈妈', text: '「今天精神这么好？\n新学期，也要交很多好朋友哦。」' });
        await say({ text: '【新的学期】\n老朋友们还会记得你吗？\n带着上一年攒下的图鉴和回忆，重新出发吧。' });
        F().introDone = true;
        save();
        UI().toast(' 🔄 新学期开始！老朋友在新校园等你 ');
        return;
      }
      await say({ text: '—— 春 · 清晨 · 阳光小镇 ——\n蝉鸣还未醒来的早晨，\n你背着崭新的书包，站在自己房间的镜子前。' });
      await say({ text: `对镜子练习了一遍自我介绍：\n「你好，我叫${playerName()}。」\n——嗯，报到的时候就这么说。` });
      await say({ text: '因为父母工作调动，这个春天\n你转学来到了阳光中学。\n一切都是新的：街道、同学、教室……\n以及，这所学校流传了百年的传说。' });
      const mom = E().getNpc('mom');
      if (mom) { mom.dir = 'right'; E().playAction(mom, 'wave', 1.4); }
      await say({ name: '妈妈', text: '快出门吧，第一天可别迟到！\n便当在包里，饿了记得吃。' });
      await say({ name: '妈妈', text: '听说这所学校的校长\n最喜欢和新同学聊天——去喷泉边找找他。' });
      await say({ text: '【开学第一天】\n先别急着把所有事都做完。\n今天先去学校报到、认认路，和几个人打个招呼。' });
      await say({ text: '（F 可以随时翻手册看目标。\n出门穿过小镇，往东走就是学校。）' });
      F().introDone = true;
      save();
      UI().toast(' 📌 今日目标：去学校找校长聊聊 ');
    } finally {
      ADV.Game.busy = false;
    }
  };

  /* ==================== NPC 大扩充：12 位新角色剧情脚本 ==================== */
  S.wangmei = async () => { await say({ name: '王美', text: '广播站见闻：\n「今日校园，一切安好。\n……这句话我练了四十遍。」' }); };
  S.laozhang = async () => {
    const f = F();
    if (f.gateOpen) { await say({ name: '张叔', text: '「石门开了，后山的风都变了味道。\n年轻人，替我们这些老门房多看看。」' }); return; }
    await say({ name: '张叔', text: '「校门我来开，心门你自己开。」\n（他擦了擦钥匙，挂回腰间）' });
  };
  S.tuxiao = async () => { await say({ name: '兔潇', text: '「找到了！我的……呃，这是什么来着？」\n（她举着一枚不知谁的发卡）' }); };
  S.xiaohua = async () => {
    const s = ADV.Cal.season();
    const fl = { 春: '樱花', 夏: '向日葵', 秋: '桂花', 冬: '水仙' }[s];
    await say({ name: '小花', text: `「这个季节，${fl}最漂亮了。\n要不要来园艺社帮忙？」` });
  };
  S.sunyang = async () => {
    const C = ADV.Cal, f = F();
    // s6 时刻表偶遇：清晨（period 0）操场相遇可跟跑两圈——体魄小委托（每日一次）
    if (C.period === 0 && f.jogDay !== C.day) {
      await say({ name: '孙阳', text: '「早！晨跑的两圈刚热完身。\n……怎么样，跟两圈？」' });
      const go = await choose(['跟跑两圈！', '下次吧'], { caption: { name: '晨跑小委托', text: '清晨限定 · 精力 -5 · 体魄成长' } });
      if (go === 0) {
        C.costEnergy(5);
        if (ADV.Growth) ADV.Growth.addDim('body', 3, '晨跑');
        gainBond('sunyang', 1);
        f.jogDay = C.day;
        ADV.Audio.sfx('emote');
        UI().toast(' 🏃 晨跑两圈——风都是清醒的味道（体魄 +3） ');
        save();
      } else await say({ name: '孙阳', text: '「行，跑步不催人。\n不过记住——操场不关门，机会也是。」' });
      return;
    }
    await say({ name: '孙阳', text: '「今天投了两百个球。\n明天，投两百零一个。」' });
    if ((F().shootBest || 0) >= 5) { gainBond('sunyang', 3); await say({ name: '孙阳', text: `「你那${F().shootBest}连进我看到了。\n……队里的位置，给你留着。」` }); }
  };
  /* s6 时刻表偶遇：傍晚（period 4）喷泉边散步的李老师——每日一道抽背小题 */
  S.teacherCnWalk = async () => {
    const C = ADV.Cal, f = F();
    if (f.walkQuizDay !== C.day) {
      await say({ name: '李老师', text: '「傍晚的风不读书可惜了。\n我沿喷泉走一圈，你陪背一句？」' });
      const go = await choose(['来一道！', '改天吧'], { caption: { name: '傍晚抽背', text: '每日一题 · 答对有零花钱' } });
      f.walkQuizDay = C.day;
      if (go === 0) {
        if (await examOnce('李老师抽背', 'chinese', 'easy', C.day)) {
          f.gold = (f.gold || 0) + 6;
          ADV.Audio.sfx('save');
          await say({ name: '李老师', text: '「一字不差——嘴上功夫也是真功夫。\n拿着，买支冰棍。」\n（零花钱 +6）' });
        } else {
          await say({ name: '李老师', text: '「唔，差一点点。听我念一遍。」\n她轻轻背完，晚风都慢了半拍。\n「明天再来。」' });
        }
        save();
      } else await say({ name: '李老师', text: '「好，书不怕晚。\n喷泉的水声，也当歇脚。」' });
      return;
    }
    await say({ name: '李老师', text: '（李老师绕着喷泉慢慢走，\n影子被夕阳拉得很长。）' });
  };
  S.datou = async () => { await say({ name: '大头', text: '「三碗！今天三碗！\n阿姨都说我是无底洞。」' }); };
  S.zhaoling = async () => { await say({ name: '赵大姐', text: '「今天的汤熬了四个钟头，\n喝完写作业都快些！」' }); };
  S.huangyu = async () => { await say({ name: '黄宇', text: '「……你也来看书？\n那，这个位子给你。」\n（他把书挪开半寸，像让出半壁江山）' }); };
  S.lao_li = async () => { await say({ name: '老李', text: '「要什么？没有我也能给你找来。\n——这是杂货铺的底气。」' }); };
  S.baiyun = async () => { await say({ name: '白云', text: '「今天进了一批新花——\n留了一枝最好看的，猜给谁？」' }); };
  S.tiezhu = async () => {
    const f = F();
    if (f.senseiWin) { await say({ name: '铁柱', text: '「师傅被你打败那天，笑得最大声。\n他说：长江后浪推前浪！」' }); return; }
    await say({ name: '铁柱', text: '「师傅的扫帚功，我学了三年。\n你……三天？！这不公平！」' });
  };
  S.qianqian = async () => {
    const f = F();
    if (f.ch3Done) { await say({ name: '倩倩', text: '「毕业了，我也该走了。\n谢谢你们，看见了我。」\n（她的身影在阳光里，一点点透明）' }); return; }
    await say({ name: '倩倩', text: '「只有你能看见我……\n为什么呢？」' });
  };

  /* ==================== 新事物：许愿池 / 单车棚 / 菜圃 / 广播站 ==================== */
  S.wishingWell = async () => {
    const f = F(), C = ADV.Cal;
    if (f.wishDay === C.day) { await say({ text: '（今天已经许过愿了——\n池水微微发亮，像在说"在办了"）' }); return; }
    if (f.gold < 5) { await say({ text: '（许愿池：投 5 金币许个愿）\n（零花钱不够……）' }); return; }
    f.gold -= 5; f.wishDay = C.day;
    const i = await choose(['学业顺利', '友谊长久', '宝藏滚滚', '明天晴天'], { caption: { name: '许愿池', text: '投下 5 金币，许个愿——' } });
    ADV.Audio.sfx('emote');
    const r = Math.random();
    if (r < .4) { f.gold += 15; await say({ text: '池水一闪——\n硬币变成三枚弹了回来！💰+10\n（许愿图个心安，偶尔的惊喜）' }); }
    else if (r < .6) { if (ADV.Growth) ADV.Growth.addDim('mind', 2, '许愿的安宁'); await say({ text: '池水轻轻荡漾。\n你心里忽然很安定。（心性 +2）' }); }
    else await say({ text: '「噗通」——\n愿望飞向了天空。明天见分晓。' });
    save();
  };
  S.bikeRack = async () => {
    const f = F();
    if (!f.bikeDay) f.bikeDay = 0;
    await say({ text: '火柴盒小车棚——\n大壮改装的"校园共享单车"。\n（骑去小镇只要一句话的功夫）' });
    const i = await choose(['骑去小镇', '骑去家', '走路吧'], { caption: { name: '单车棚', text: '单车站点：校园（免费）' } });
    if (i === 2) return;
    if (i === 0) {
      f.bikeDay = ADV.Cal.day;
      ADV.Game.busy = true;
      await new Promise(res => ADV.Engine.fadeTo(1, .4, res));
      ADV.Engine.loadMap('town', 30, 18, 'down');
      await new Promise(res => ADV.Engine.fadeTo(0, .4, res));
      ADV.Game.busy = false;
      await say({ text: '叮铃——到了小镇主街！' });
    } else {
      f.bikeDay = ADV.Cal.day;
      ADV.Game.busy = true;
      await new Promise(res => ADV.Engine.fadeTo(1, .4, res));
      ADV.Engine.loadMap('homeYard', 11, 9, 'up');
      await new Promise(res => ADV.Engine.fadeTo(0, .4, res));
      ADV.Game.busy = false;
      await say({ text: '叮铃——到家了！' });
    }
    save();
  };
  S.vegPlot = async () => {
    const f = F(), C = ADV.Cal;
    if (!f.veg) f.veg = { day: 0, water: 0, ready: false };
    if (f.veg.ready) {
      f.veg = { day: 0, water: 0, ready: false };
      ADV.Collect.addItem('juice', 2);
      ADV.Audio.sfx('item');
      await say({ text: '菜圃大丰收——\n水灵灵的蔬菜两篮！（蔬菜×2，可做菜/送礼）' });
      if (ADV.Growth) ADV.Growth.addDim('art', 2, '种菜收获');
      save();
      return;
    }
    if (f.veg.day === C.day) { await say({ text: '（菜苗今天浇过了，\n绿油油地站得笔直）' }); return; }
    f.veg.day = C.day; f.veg.water += 1;
    if (f.veg.water >= 4) f.veg.ready = true;
    await say({ text: `你给菜苗浇水。🌱（${f.veg.water}/4）\n${f.veg.ready ? '叶子沙沙作响——明天可以收获了！' : '（浇足 4 天水就能收获）'}` });
    save();
  };

  /* ==================== 后院农场（星露谷式生产循环） ====================
   * 4×3 田垄：荒草 →(翻土)→ 土垄 →(播种)→ 浇水 → 次日生长 → 成熟收获
   * 状态存 flags.farm[pid] = { st: 阶段0-3, wd: 最后浇水日, crop: 作物id }
   * 精力换收成：翻土 2 点 / 浇水 1 点，收获 1~3 份作物（银/金星品质更好） */
  const FARM_CROPS = {                                  // 季节 → 当季种子/作物
    spring: [{ seed: 'seedStraw', crop: 'strawberry', name: '草莓' },
             { seed: 'seedPea',   crop: 'pea',        name: '甜豌豆' }],
    summer: [{ seed: 'seedMelon',  crop: 'watermelon', name: '西瓜' },
             { seed: 'seedTomato', crop: 'tomato',     name: '番茄' }],
    autumn: [{ seed: 'seedPotato', crop: 'sweetpotato', name: '红薯' },
             { seed: 'seedPumpkin',crop: 'pumpkin',    name: '南瓜' }],
    winter: []                                            // 冬天休耕，田地歇一歇
  };
  const seasonSeeds = () => FARM_CROPS[ADV.Cal.seasonEn()] || [];
  const ALL_SEEDS = ['spring', 'summer', 'autumn'].reduce((a, s) => a.concat(FARM_CROPS[s]), []);   // 温室目录：四季种子全年有售
  // 同步地块物件到当前 flags 状态（交互后立刻刷新画面）
  function syncPlot(o) {
    const p = (F().farm || {})[o.pid];
    o.stage = p ? p.st : 0;
    o.watered = !!p && p.wd === ADV.Cal.day;
    o.fert = !!p && !!p.fert;
    o.spk = !!p && !!p.spk;
  }
  // —— 放置洒水器：消耗 1 个，这块地每天清晨自动浇水 ——
  async function placeSprinkler(p, o) {
    if (p.spk) { await say({ text: '（这垄地已经装了洒水器，喷头正咕噜咕噜转。）' }); return; }
    if (!ADV.Collect.useItem('sprinkler', 1)) { await say({ text: '（口袋里没有洒水器——\n礼品店有售）' }); return; }
    p.spk = true;
    ADV.Audio.sfx('water');
    await say({ text: '你架上洒水器，拧开阀门。\n（这块地每天清晨都会自动浇好水）' });
    syncPlot(o); save();
  }
  // —— 撒肥料：消耗 1 包，收获时有概率多结一颗果实 ——
  async function addFertilizer(p, o) {
    if (p.fert) { await say({ text: '（这垄地已经撒过肥了，养分正往根下走。）' }); return; }
    if (!ADV.Collect.useItem('fertilizer', 1)) { await say({ text: '（口袋里没有肥料——\n礼品店有售）' }); return; }
    p.fert = true;
    ADV.Audio.sfx('item');
    await say({ text: '你把肥料细细拌进土里。\n（收获时有概率多结一颗果实）' });
    syncPlot(o); save();
  }
  S.farmPlot = async (o) => {
    const f = F(), C = ADV.Cal;
    if (!f.farm) f.farm = {};
    const p = f.farm[o.pid] || (f.farm[o.pid] = { st: 0, wd: 0, crop: '' });
    const gh = o.pid >= 100;                              // 温室垄：四季任意作物、喷淋自动浇水、乌鸦进不去
    syncPlot(o);
    if (f.crowNews) { await say({ name: '稻草人', text: f.crowNews + '\n（翻新稻草人，才能赶走偷嘴的乌鸦）' }); f.crowNews = ''; }
    // —— 成熟：收获（作物回到土垄，可接着种下一茬） ——
    if (p.st >= 3) {
      const info = ADV.Collect.itemInfo(p.crop);
const r = Math.random();
const SK = ADV.Skills;
let q = SK ? SK.qualityRoll(r) : (r < .05 ? 3 : r < .25 ? 2 : 1);   // 农艺技能提升品质阈值
if (q === 1 && SK && SK.silverFloor()) q = 2;                       // 农艺满级：保底银星
const fert = p.fert && Math.random() < .5;                          // 肥料：五成概率多结一颗
const n = q + (SK ? SK.harvestBonus() : 0) + (fert ? 1 : 0);        // 农艺 Lv2：多收一份；肥料偶发加成
ADV.Collect.addItem(p.crop, n);
ADV.Audio.sfx('fanfare');
const star = q === 3 ? '🌟金星品质！' : q === 2 ? '✨银星品质！' : '';
const CN = ['一', '两', '三', '四', '五'];
await say({ text: `沉甸甸的——\n收走了${CN[n - 1] || n}份「${info.name}」！${star}\n（土地翻松了，还能接着种）` });
if (star) UI().toast(` ${star} 品质越好收成越多 `);
if (fert) UI().toast(' 🌰 肥料起效：多结了一颗果实！ ');
if (SK) SK.add('farm', 8, '丰收');
if (ADV.Growth) ADV.Growth.addDim('body', 2, '农场丰收');
      logEvent(`在后院收获了${info.name}`);
      p.st = 1; p.wd = 0; p.crop = ''; p.fert = false;
      syncPlot(o); save();
      return;
    }
    // —— 荒草：翻土开垦 ——
    if (p.st === 0) {
      const go = await choose([`翻土开垦（精力 -2）`, '先不了'], { caption: { text: '一垄荒草，土板得很。' } });
      if (go !== 0) return;
      C.costEnergy(2);
p.st = 1;
ADV.Audio.sfx('dig');
if (ADV.Skills) ADV.Skills.add('farm', 3, '翻土');
      const hoeLv = (f.toolLv && f.toolLv.hoe) || 0;
      if (hoeLv && !gh) {                                    // 宽口锄 I：十字耕地 / II 开垄锄：整垄翻土（温室垄不参与连耕）
        const col = o.pid % 4;
        const ids = hoeLv >= 2
          ? [0, 1, 2, 3].map(k => o.pid - col + k)
          : [col > 0 ? o.pid - 1 : -1, col < 3 ? o.pid + 1 : -1, o.pid >= 4 ? o.pid - 4 : -1, o.pid < 8 ? o.pid + 4 : -1];
        let extra = 0;
        ids.forEach(id => {
          if (id < 0 || id === o.pid) return;
          const q = f.farm[id] || (f.farm[id] = { st: 0, wd: 0, crop: '' });
          if (q.st === 0) { q.st = 1; extra++; }
        });
        if (extra) { C.costEnergy(extra); UI().toast(hoeLv >= 2 ? ` ⛏ 开垄锄整垄耕地：一行顺带翻好了 ${extra} 格 ` : ` ⛏ 宽口锄十字耕地：顺带翻好了 ${extra} 格 `); }
      }
await say({ text: '你抡起小锄头，把土翻得松软。\n（去田伯那儿买当季种子吧）' });
      syncPlot(o); save();
      return;
    }
    // —— 土垄（未播种）：挑种子种下（温室垄四季全目录，室外只认当季） ——
    if (!p.crop) {
      const seeds = gh ? ALL_SEEDS : seasonSeeds();
      if (!seeds.length) {
        await say({ text: '冬天土面冻得梆硬。\n田伯说：地也要歇一歇，\n开春再来种吧。' });
        return;
      }
      const opts = seeds.map(s => {
        const own = ADV.Collect.count(s.seed);
        return `${s.name}种子（有 ${own} · 田伯有售）`;
      }).concat(gh ? ['先不种', '撒肥料'] : ['先不种', '放置洒水器', '撒肥料']);
      const i = await choose(opts, { caption: { text: gh
        ? `温室里暖融融的，喷淋喷头闪着细光。\n四季的种子都种得活——现在是${C.season()}。`
        : `松软的土垄，正适合播种。\n现在是${C.season()}。` } });
      if (i === seeds.length) return;
      if (i === opts.length - 1) return addFertilizer(p, o);
      if (!gh && i === seeds.length + 1) return placeSprinkler(p, o);
      if (i > seeds.length) return;
      const s = seeds[i];
      const free = ADV.Skills && ADV.Skills.seedSave();   // 省种技能：20% 概率不消耗种子
      if (!free && !ADV.Collect.useItem(s.seed, 1)) {
        await say({ text: `（口袋里没有${s.name}种子——\n西郊的田伯那儿有卖）` });
        return;
      }
      p.crop = s.crop;
      ADV.Audio.sfx('item');
      if (free) UI().toast(' 🌾 省种手熟：这粒种子是从指缝里省下的！ ');
      await say({ text: gh
        ? `你把${s.name}种子埋进培养土。\n温室喷淋会替你浇水——等着收获就行！🌱`
        : `你把${s.name}种子埋进土里。\n记得每天浇水——三天就能收获！🌱` });
      if (gh) p.wd = C.day;                               // 喷淋立刻接管，种下当天就算浇过
      if (ADV.Skills) ADV.Skills.add('farm', 4, '播种');
      syncPlot(o); save();
      return;
    }
    // —— 已播种：浇水（一天一次，浇了次日才长） ——
    const info = ADV.Collect.itemInfo(p.crop);
    if (p.wd === C.day) {
      await say({ text: `（${info.name}苗今天喝饱了，\n${p.st >= 2 ? '都开始挂果了！' : gh ? '喷淋正下着细细的雨' : '叶子舒展着，晒着太阳'}）` });
      return;
    }
    const go = await choose(['浇水（精力 -1）', '先不了', '放置洒水器', '撒肥料'], { caption: { text: `${info.name}苗（第 ${p.st} 天）\n土面有点发白。` } });
    if (go === 2) return placeSprinkler(p, o);
    if (go === 3) return addFertilizer(p, o);
    if (go !== 0) return;
    C.costEnergy(1);
    p.wd = C.day;
    ADV.Audio.sfx('water');
    const canLv = (f.toolLv && f.toolLv.can) || 0;
    if (canLv && !gh) {                                      // 三嘴壶 I：左右田垄 / II 五嘴壶：整垄浇灌（温室垄自带喷淋，不参与连浇）
      const col = o.pid % 4;
      const ids = canLv >= 2 ? [0, 1, 2, 3].map(k => o.pid - col + k) : [col > 0 ? o.pid - 1 : -1, col < 3 ? o.pid + 1 : -1];
      let wet = 0;
      ids.forEach(id => {
        if (id < 0 || id === o.pid) return;
        const q = f.farm[id];
        if (q && q.crop && q.st >= 1 && q.st < 3 && q.wd !== C.day) { q.wd = C.day; wet++; }
      });
      if (wet) UI().toast(canLv >= 2 ? ` 🪣 五嘴壶整垄浇灌：一行 ${wet} 格也一起喝饱了 ` : ` 🪣 三嘴壶：左右 ${wet} 格也一起喝饱了 `);
    }
    let boosted = false;
    if ((F().badges.science || F().club === '科学社') && Math.random() < .5) {
      p.st += 1;                                        // 科学加成：多喝一口，快长一天
      UI().toast(' 🌱 科学加成：长势喜人！ '); boosted = true;
    }
    if (!boosted && ADV.Skills && ADV.Skills.waterBoost() && Math.random() < .25) {
      p.st += 1;                                        // 催苗技能：浇水手熟，多长一截
      UI().toast(' 🌾 催苗手熟：多长了一截！ ');
    }
    if (ADV.Skills) ADV.Skills.add('farm', 2, '浇水');
    await say({ text: '你浇了一瓢水。💧\n（第二天清晨就会悄悄长一截）' });
    syncPlot(o); save();
  };

  /* —— 稻草人：用工具包翻新，从此乌鸦绝迹 —— */
  S.scarecrow = async (o) => {
    const f = F();
    if (!o) o = {};
    if (o.fixed || f.scarecrowFixed) { await say({ name: '稻草人', text: '稻草人精神抖擞地立着，\n乌鸦绕着田边飞，不敢下来。' }); return; }
    if (ADV.Collect.count('scarecrowKit') <= 0) {
      await say({ name: '稻草人', text: '旧稻草人歪着脑袋，草絮散了一地。\n（礼品店买个稻草人工具包，\n就能把它翻新得威风凛凛）' });
      return;
    }
    ADV.Collect.useItem('scarecrowKit', 1);
    f.scarecrowFixed = true;
    o.fixed = true;
    ADV.Audio.sfx('fanfare');
    if (ADV.Skills) ADV.Skills.add('farm', 5, '翻新稻草人');
    logEvent('翻新了后院的稻草人');
    await say({ name: '稻草人', text: '你给稻草人换上新草帽、扎紧衣袖！\n从此乌鸦再也不敢来田里偷嘴了。' });
    save();
  };

  /* —— 鸡舍：抱只小鸡回家，每天收鸡蛋（最多攒 3 枚） —— */
  S.chickenCoop = async () => {
    const f = F();
    const coop = E().map.objects.find(o => o.kind === 'coop');
    if (!f.chicken) {
      const go = await choose(['抱小鸡回家（💰80）', '再想想'], {
        caption: { name: '鸡舍', text: '干干净净的小木屋，铺着稻草。\n「从田伯家抱只小鸡回来，\n它每天都会给你下蛋哦。」' }
      });
      if (go !== 0) return;
      if ((f.gold || 0) < 80) { await say({ text: '（零花钱不够——\n小鸡要 80 金币呢）' }); return; }
      f.gold -= 80;
      f.chicken = true; f.eggs = 0;
      if (coop) coop.hasChicken = true;
      ADV.Audio.sfx('fanfare');
      await say({ name: '咕咕', text: '叽叽！叽叽！\n（一团嫩黄的小绒球，\n在稻草里挪来挪去）' });
      UI().toast(' 🐤 养了小鸡！以后每天来收鸡蛋吧 ');
      logEvent('在后院养了一只小鸡');
      save();
      return;
    }
    // —— 已养鸡：收蛋（含金蛋）/ 喂小麦增进好感 ——
    const canFeed = ADV.Collect.count('wheat') > 0;
    if (f.eggs > 0 || (f.goldenEggs || 0) > 0) {
      const g = f.goldenEggs || 0;
      const opts = [`收鸡蛋 ×${f.eggs}` + (g ? ` + 金鸡蛋 ×${g}` : '')]
        .concat(canFeed ? ['喂把小麦（好感 +1）'] : []).concat(['让它继续焐着']);
      const i = await choose(opts, { caption: { name: '鸡舍', text: '稻草窝里躺着几枚蛋，\n还带着温度。' } });
      if (i === 0) {
        const n = f.eggs;
        ADV.Collect.addItem('egg', n);
        if (g) ADV.Collect.addItem('goldenEgg', g);      // 金蛋是稀罕货，能卖好价钱
        f.eggs = 0; f.goldenEggs = 0;
        ADV.Audio.sfx('item');
        await say({ text: g ? `轻轻捡起 ${n} 枚鸡蛋，\n还有 ${g} 枚沉甸甸的金鸡蛋！\n（咕咕在旁边踱步，非常得意）` : `轻轻捡起 ${n} 枚鸡蛋。\n（咕咕在旁边踱步，很得意）` });
        save();
        return;
      }
      if (canFeed && i === 1) { await feedChicken(f); return; }
      return;
    }
    if (canFeed) {
      const i = await choose(['喂把小麦（好感 +1）', '就摸摸它'], { caption: { name: '咕咕', text: '（它歪着头，盯着你鼓囊囊的口袋）' } });
      if (i === 0) { await feedChicken(f); return; }
    }
    await say({ name: '咕咕', text: ['叽叽——（歪头看你）', '（它正在稻草里打滚，\n羽毛蓬成一个球）', '咕咕咕（骄傲地挺起小胸脯）'][(Math.random() * 3) | 0] });
  };
  // 喂小麦：好感 +1（永久累积），喂到 3 次起咕咕有概率下金蛋
  async function feedChicken(f) {
    ADV.Collect.useItem('wheat', 1);
    f.chickenLove = (f.chickenLove || 0) + 1;
    ADV.Audio.sfx('item');
    const hint = f.chickenLove >= 3 ? '（它心满意足地眯起眼——\n感觉会下出不得了的东西……）' : '（再喂两次，它就会更亲近你）';
    await say({ name: '咕咕', text: `咕咕咕！（吃得津津有味）\n（好感 ${f.chickenLove}）\n${hint}` });
    save();
  }

  /* ==================== s5 畜牧扩展：牛棚挤奶 / 羊圈剪毛 ====================
   * 田伯处抱回小牛犊（120 文）/ 小羊羔（100 文）入住后院——
   * 牛每天可挤一次奶（喂熟后双份），羊每三天剪一次毛；都吃 farm 技能经验 */
  S.cowShed = async () => {
    const f = F(), CO = ADV.Collect;
    const shed = E().map.objects.find(o => o.kind === 'cowShed');
    if (!f.cow) {
      if (CO.count('calf') <= 0) {
        await say({ name: '牛棚', text: '干净的小棚，食槽还空着。\n「田伯家的小牛犊 120 文——\n抱回来每天都能挤到新鲜牛奶。」' });
        return;
      }
      CO.useItem('calf', 1);
      f.cow = true; f.milkReady = 0;
      if (shed) shed.hasCow = true;
      ADV.Audio.sfx('fanfare');
      await say({ name: '小黑白花', text: '哞——\n（它把脑袋搁上食槽，蹭了蹭你的手）' });
      UI().toast(' 🐄 小牛入住牛棚！以后每天来挤奶吧 ');
      logEvent('后院养了一头小牛');
      save();
      return;
    }
    if (f.milkReady > 0) {
      const n = (f.cowLove || 0) >= 3 ? 2 : 1;
      f.milkReady = 0;
      CO.addItem('milk', n);
      ADV.Audio.sfx('item');
      if (ADV.Skills) ADV.Skills.add('farm', 3, '挤奶');
      await say({ text: `挤了 ${n} 瓶还温热的鲜牛奶！${n > 1 ? '\n（喂熟的老牛，奶水就是足）' : ''}\n（鲜牛奶可以卖钱、送礼，\n也许妈妈和食堂阿姨都用得上）` });
      save();
      return;
    }
    if (CO.count('wheat') > 0) {
      const i = await choose(['喂把小麦（好感 +1）', '就拍拍它的头'], { caption: { name: '小黑白花', text: '（它慢悠悠地嚼着草，\n尾巴扫了扫你的袖口）' } });
      if (i === 0) {
        CO.useItem('wheat', 1);
        f.cowLove = (f.cowLove || 0) + 1;
        ADV.Audio.sfx('item');
        await say({ name: '小黑白花', text: `哞♪（好感 ${f.cowLove}${f.cowLove === 3 ? '\n（它开始主动把脑袋往你手里凑——\n明天的奶水会很足）' : '）'}` });
        save();
        return;
      }
    }
    await say({ name: '小黑白花', text: ['哞——（它今天挤过了）', '（它趴在草上晒太阳，尾巴一甩一甩）', '哞哞（它凑过来闻了闻你的口袋）'][((ADV.Cal.day % 3) | 0)] });
  };
  S.sheepPen = async () => {
    const f = F(), CO = ADV.Collect;
    const pen = E().map.objects.find(o => o.kind === 'sheepPen');
    if (!f.sheep) {
      if (CO.count('lamb') <= 0) {
        await say({ name: '羊圈', text: '栅栏里铺着软草。\n「田伯家的小羊羔 100 文——\n抱回来隔几天就能剪一次羊毛。」' });
        return;
      }
      CO.useItem('lamb', 1);
      f.sheep = true; f.woolReady = 0; f.woolTick = 0;
      if (pen) pen.hasSheep = true;
      ADV.Audio.sfx('fanfare');
      await say({ name: '小羊羔', text: '咩～\n（一团白云撞进栅栏，回头看你）' });
      UI().toast(' 🐑 小羊入住羊圈！三天后来剪第一次毛 ');
      logEvent('后院养了一只小羊');
      save();
      return;
    }
    if (f.woolReady > 0) {
      const go = await choose(['剪羊毛（精力 -1）', '让它再穿几天'], { caption: { name: '小羊', text: '咩咩！（它的毛已经拖到了草上，\n像个会走路的棉花糖）' } });
      if (go !== 0) return;
      ADV.Cal.costEnergy(1);
      f.woolReady = 0;
      const n = 1 + (Math.random() < .35 || (f.sheepLove || 0) >= 3 ? 1 : 0);
      CO.addItem('wool', n);
      ADV.Audio.sfx('item');
      if (ADV.Skills) ADV.Skills.add('farm', 3, '剪毛');
      await say({ text: `咔嚓咔嚓——剪下 ${n} 团蓬松的羊毛！${n > 1 ? '\n（喂熟的羊，毛量翻倍）' : ''}\n（裁缝阿姨见了眼睛会发亮）` });
      save();
      return;
    }
    if (CO.count('wheat') > 0) {
      const i = await choose(['喂把小麦（好感 +1）', '就隔着栅栏摸摸'], { caption: { name: '小羊', text: `咩？（它凑过来——\n距离下一次剪毛还有 ${3 - (f.woolTick || 0)} 天）` } });
      if (i === 0) {
        CO.useItem('wheat', 1);
        f.sheepLove = (f.sheepLove || 0) + 1;
        ADV.Audio.sfx('item');
        await say({ name: '小羊', text: `咩♪（好感 ${f.sheepLove}）` });
        save();
        return;
      }
    }
    await say({ name: '小羊', text: ['咩——（它在栅栏边打转）', '（它正对着水盆照自己）', '咩咩（它把草料拱成了小山）'][((ADV.Cal.day % 3) | 0)] });
  };
  // 每日农场结算（睡觉时调用）：浇过水的地块生长 / 雨天与洒水器自动浇水 / 乌鸦偷嘴 / 小鸡下蛋
  function farmTick() {
    const f = F(), C = ADV.Cal;
    const rainy = /雨/.test(C.weather || '');             // 睡醒已是新一天，此时天气即当天天气
    if (f.farm) for (const k in f.farm) {
      const p = f.farm[k];
      const gh = +k >= 100;                               // 温室垄：喷淋全天候值班，天天算浇过水
      if (p.crop && p.st >= 1 && p.st < 3 && (gh || p.spk || p.wd === C.day - 1)) p.st += 1;  // 昨天浇过水（或洒水器/喷淋值班）→ 长一截
      // 新的一天：水干了；但雨天老天爷帮忙、洒水器与温室喷淋勤恳值班，正在生长的地块自动盖好水
      p.wd = ((rainy || p.spk || gh) && p.crop && p.st >= 1 && p.st < 3) ? C.day : 0;
    }
    // 乌鸦事件：每隔几天的清晨溜进没看管的田里偷嘴（翻新稻草人后绝迹；温室隔着玻璃，乌鸦进不去）
    if (f.farm && !f.scarecrowFixed) for (const k in f.farm) {
      if (+k >= 100) continue;
      const pp = f.farm[k];
      if (pp.crop && pp.st >= 1 && pp.st < 3 && (C.day * 5 + k * 3) % 13 === 0) {
        pp.crop = ''; pp.st = 1; pp.wd = 0;
        f.crowNews = '清早有只乌鸦溜进田里，把庄稼啄了个精光！';
      }
    }
    if (f.chicken) {
      f.eggs = Math.min(3, (f.eggs || 0) + 1);            // 小鸡每天下一枚蛋，最多攒 3 枚
      // 喂过 3 次以上小麦 → 按好感度概率下金蛋（好感 3 → 35%，封顶 60%）
      if ((f.chickenLove || 0) >= 3 && Math.random() < Math.min(.6, .2 + f.chickenLove * .05))
        f.goldenEggs = Math.min(3, (f.goldenEggs || 0) + 1);
    }
    // —— s5 畜牧：牛每天产奶一次；羊每三天 woolReady（喂熟好感不影响周期，只加产量） ——
    if (f.cow) f.milkReady = 1;
    if (f.sheep) {
      f.woolTick = ((f.woolTick || 0) + 1) % 3;
      if (f.woolTick === 0) f.woolReady = 1;
    }
    // —— P3 牧场盒：住着一对同系伙伴 → 感情好了清晨产下一枚蛋（异色亲本把金色传给蛋） ——
    // 寄存本身打 gone=1（防误卖标记，批次二十二修正：别拿它当「被卖掉」判据——
    // 盒中个体被收购/交换列表过滤，f.ranch 引用的条目不可能被卖，查存在即可）
    if (f.ranch && f.ranch.a && f.ranch.b && !f.ranchEgg) {
      const ea = ADV.Collect.critterEntry(f.ranch.a), eb = ADV.Collect.critterEntry(f.ranch.b);
      if (ea && eb) {
        f.ranchEgg = { fam: ADV.Collect.critter(f.ranch.a).fam, shiny: !!(ea.s || eb.s), day: C.day };
      }
    }
  }
  S.radioStation = async () => {
    const f = F(), C = ADV.Cal;
    if (f.radioDay === C.day) { await say({ text: '（今天的点歌已经放过——\n旋律还在走廊里绕）' }); return; }
    f.radioDay = C.day;
    const songs = ['《晴天》', '《稻香》', '《童年》', '《夜空中最亮的星》', '《小星星》'];
    const i = await choose(songs.concat(['随便放']), { caption: { name: '校园广播', text: '王美：点一首歌送给全校吧！' } });
    const song = i < songs.length ? songs[i] : songs[(C.day) % songs.length];
    await say({ name: '王美', text: `「下面这首${song}，\n送给今天也在努力的你——」\n（广播声传遍校园）` });
    if (C.period >= 3 && !sceneSeen('radioWrap')) {
      const j = await choose(['帮她想一句收尾', '夸她播得真稳'], {
        caption: { name: '王美', text: '广播结束后，她还攥着稿纸。\n「最后一句……你觉得该怎么说比较好？」' }
      });
      if (j === 0) {
        await say({ name: '你', text: '「就说，愿今天的傍晚也照顾好每个人。」' });
        await say({ name: '王美', text: '她低头记下那句话，耳朵有点红。\n「嗯……这个结尾，我想留到明天用。」' });
      } else {
        await say({ name: '王美', text: '「真、真的吗？\n我刚才其实还在抖……但被你这么一说，\n好像真的稳下来了。」' });
      }
      gainBond('wangmei', 1);
      logEvent('在广播站陪王美练了一次收尾');
      save();
    }
    if (ADV.Growth) ADV.Growth.addDim('bond', 1, '全校共同的心情');
    gainBond('wangmei', 2);
    save();
  };
  S.windowSeat = async () => {
    const C = ADV.Cal;
    if (C.period < 3) { await say({ text: '窗边的位子还亮堂堂的。\n（放学后再来，这里会安静很多）' }); return; }
    if (sceneSeen('windowSeat')) { await say({ text: '窗边还留着翻过书页的暖意。\n风一吹，纸张轻轻响了一下。' }); return; }
    await say({ text: '窗边的阳光斜斜落在桌角。\n林小雨把书往里挪了半寸，像给你留了个位置。' });
    const i = await choose(['坐一会儿', '问她在看什么'], {
      caption: { name: '图书馆窗边', text: '书页、夕光和风都很轻。\n你想怎么打破这份安静？' }
    });
    if (i === 0) {
      await say({ name: '林小雨', text: '「……这样就很好。」\n她把书侧过来一点，让你也能看见那一页。' });
      gainBond('linxiaoyu', 2);
      if (friend('huangyu').love >= 10) {
        await say({ name: '黄宇', text: '「窗边这个位子，借你们半小时。\n……记得帮我把书签夹回去。」' });
        gainBond('huangyu', 1);
      }
    } else {
      await say({ name: '林小雨', text: '「是一本……讲夏天和河流的书。」\n她顿了顿，小声补了一句：\n「我觉得，你会喜欢。」' });
      gainBond('linxiaoyu', 3);
    }
    logEvent('放学后在图书馆窗边坐了一会儿');
    save();
  };
  S.swingTown = async () => {
    const C = ADV.Cal;
    if (C.period < 4) { await say({ text: '河边秋千轻轻晃着。\n（傍晚来坐，会更像暑假的小镇）' }); return; }
    if (sceneSeen('swingTown')) { await say({ text: '秋千绳上还留着一点晚风。\n河边的灯已经映进水里了。' }); return; }
    await say({ text: '河边秋千慢慢摇着。\n白云刚把花纸压好，老李端着茶缸站在一旁看街面。' });
    const i = await choose(['帮白云扶住花纸', '听老李讲街上的事'], {
      caption: { name: '河边秋千', text: '这一会儿的小镇，像把一天轻轻放慢了。' }
    });
    if (i === 0) {
      await say({ name: '白云', text: '「谢啦，不然风一大，今天新包的花束又要散开。」\n她挑了一小枝最清淡的花给你闻。' });
      gainBond('baiyun', 2);
    } else {
      await say({ name: '老李', text: '「放学以后最好看。\n有人拎着点心回家，有人故意绕远路。\n这条街，就是这么被走热的。」' });
      gainBond('lao_li', 2);
    }
    logEvent('在河边秋千旁磨蹭到天色变软');
    save();
  };
  S.swingPlay = async () => {
    const C = ADV.Cal, f = F();
    if (C.period < 4) { await say({ text: '小区秋千在白天晒得暖暖的。\n（傍晚再来，楼上的灯会一盏盏亮起来）' }); return; }
    if (sceneSeen('swingPlay')) { await say({ text: '秋千轻轻摇着，楼道里的晚饭香还没散。\n像有人刚在这里坐过。' }); return; }
    const homeBuddies = ['xiaoming', 'xiaohong', 'xiaogang', 'xiaopang', 'wuyun', 'momo', 'jinpeng', 'wangmei']
      .filter(id => friend(id).love >= 10);
    if (!homeBuddies.length) {
      await say({ text: '你在秋千上轻轻晃了两下。\n楼上的灯一点点亮起来，整个小区都慢慢回家了。' });
      logEvent('傍晚在小区秋千上发了会儿呆');
      save();
      return;
    }
    const picks = homeBuddies.sort((a, b) => friend(b).love - friend(a).love).slice(0, 3);
    const opts = picks.map(id => `等${BOND[id].name}探头打招呼`).concat(['就自己坐坐']);
    const i = await choose(opts, { caption: { name: '小区秋千', text: '楼上有人拉开了窗。\n你想朝谁挥挥手？' } });
    if (i >= picks.length) {
      await say({ text: '你靠着秋千看了一会儿天色。\n楼里偶尔传来笑声，像暑假慢慢沉进了晚上。' });
      logEvent('傍晚在小区秋千上听了一会儿楼道回声');
      save();
      return;
    }
    const id = picks[i];
    const scene = {
      xiaoming: '「你等等，我给你看新分镜！」\n他把本子举到窗边，人物果然又长得像你。',
      xiaohong: '「等我把头发擦干就下来跑两步！」\n她笑着把毛巾搭在肩上，连语气都带风。',
      xiaogang: '「……我不是特意看见你的。」\n说完这句，他还是把窗开得更大了一点。',
      xiaopang: '「等着，我妈刚蒸了红糖馒头！」\n楼道里很快就飘来了甜味。',
      wuyun: '「楼下风大，别着凉。」\n他说完又别开脸，像这句关心只是顺口。',
      momo: '「今天的汽水配方成功了！」\n她晃了晃杯子，气泡在窗边亮晶晶地炸开。',
      jinpeng: '「……你今天也挺准时。」\n他把这句话说得像一次很郑重的招呼。',
      wangmei: '「嘘，我刚练完明天的开场。」\n她朝你做了个噤声手势，又偷偷笑了。'
    }[id];
    await say({ name: BOND[id].name, text: scene });
    gainBond(id, 2);
    logEvent(`傍晚在小区秋千边和${BOND[id].name}打了招呼`);
    save();
  };

  // —— G 键送礼 ——
  S._gift = async (npc) => {
    const list = ADV.Collect.giftables();
    if (!list.length) { await say({ text: '（背包里没有可送的礼物。\n小镇礼品店可以买到～）' }); return; }
    const i = await choose(list.map(it => `${it.name} ×${ADV.Collect.count(it.id)}`).concat(['算了']),
      { caption: { name: npc.name, text: '要把什么送给 TA？' } });
    if (i >= list.length) return;
    const r = ADV.Collect.give(npc.id, list[i].id);
    npc.dir = 'down';
    if (r.delta > 0) {
      E().playAction(npc, r.delta >= 12 ? 'laugh' : 'wave', 1.6); ADV.Audio.sfx('item');
      const SK = ADV.Skills;
      // 社交技能：会挑礼物 / 投其所好 → 追加好感
      if (SK && SK.giftBonus() > 0) gainBond(npc.id, SK.giftBonus());
      if (SK) SK.add('social', 5, '送礼');
      // 节日限定：送礼好感翻倍（给玩家一个「攒着节日再送」的小策略）
      const fest = ADV.Cal.festival ? ADV.Cal.festival() : '';
      if (fest) { gainBond(npc.id, r.delta); UI().toast(` 🎊 ${fest}加成：好感翻倍 +${r.delta} `); }
    }
    else { E().playAction(npc, 'cry', 1.4); ADV.Audio.sfx('wrong'); }
    await say({ name: npc.name, text: r.line });
  };

  // —— 收集闪光点 ——
  S.pick = async (o) => {
    const cat = ADV.Collect.DB.leaves.find(x => x.id === o.cid) ? 'leaves' : 'insects';
    if (ADV.Collect.gain(cat, o.cid)) {
      o.taken = true;
      ADV.Audio.sfx('item');
      const info = ADV.Collect.info(cat, o.cid);
      await say({ text: `你捡起了一片${info.name}，\n小心地夹进图鉴里。` });
    }
  };

  // —— 果园摘果：四棵果树各按季节结果，当季才熟，每棵每天摘一次 ——
  S.pickFruit = async (o) => {
    const f = F(), C = ADV.Cal;
    const fruit = ADV.Collect.DB.fruits.find(x => x.id === o.fid);
    if (!fruit) return;
    if (fruit.season !== C.seasonEn()) {
      const cn = { spring: '春天', summer: '夏天', autumn: '秋天', winter: '冬天' }[fruit.season];
      await say({ text: `枝头还只是青疙瘩。\n（${fruit.name}要等${cn}才熟）` });
      return;
    }
    if (f.fruitDay && f.fruitDay[o.fid] === C.day) { await say({ text: '今天能摘的都摘完了。\n（果树也要歇一晚）' }); return; }
    (f.fruitDay || (f.fruitDay = {}))[o.fid] = C.day;
    ADV.Audio.sfx('item');
    const n = 1 + ((Math.random() * 2) | 0);            // 摘到 1~2 个进背包
    ADV.Collect.addItem(fruit.item, n);
    const it = ADV.Collect.itemInfo(fruit.item);
    const first = ADV.Collect.gain('fruits', fruit.id); // 首次摘 → 敲开百果园图鉴
    await say({ text: first
      ? `踮脚摘下${fruit.name}，指头都染香了——\n「${it.name}」×${n} 进了背包，\n百果园图鉴也翻开新的一页！`
      : `摘下「${it.name}」×${n}，\n衣兜都装不下，甜味一路跟着你。` });
    const emoji = ({ f1: '🟡', f2: '🍒', f3: '🍑', f4: '🍇', f5: '🍐', f6: '🟠', f7: '🍊', f8: '🟤' })[o.fid] || '🍑';
    UI().toast(` ${emoji} ${it.name} ×${n} `);
    save();
  };

  // —— 星之果实：吃下永久 +10 精力上限（全图 5 颗，封顶 150） ——
  S.starFruit = async (o) => {
    if (o.taken) return;                        // 已摘过（引擎会隐藏，双保险）
    o.taken = true;
    const f = F();
    f.starFruit = f.starFruit || {};
    f.starFruit[o.sid] = true;
    ADV.Audio.sfx('item');
    const mx = ADV.Cal.raiseMax(10);
    await say({ text: '摘下一颗星之果实！\n果香在舌尖炸开，浑身一暖——\n精力上限 +10！' });
    const n = Object.keys(f.starFruit).length;
    logEvent(n === 5
      ? '集齐了五颗星之果实，浑身是劲'
      : `吃下星之果实（${n}/5），精力上限提升到 ${mx}`);
    UI().toast(` ⭐ 精力上限 ${mx} ｜ 果实 ${n}/5 `);
    save();
  };

  // —— 埋宝点 ——
  const DIG_LOOT = {
    d1: { gold: 40 }, d2: { item: 'ballcard' }, d3: { gold: 60 }, d4: { item: 'flower' },
    d5: { gold: 30 }, d6: { item: 'juice' }, d7: { gold: 80 }, d8: { quote: 'q12' }
  };
  S.dig = async (o) => {
    const f = F();
    if (f.dig[o.did]) { await say({ text: '这里已经挖过了，\n只剩一个小土坑。' }); return; }
    if (!f.wuyunGang) { await say({ text: '（土堆下面好像埋着什么。\n需要乌云的埋宝图残页才能确定位置……）' }); return; }
    if (!ADV.Collect.count('shovel')) { await say({ text: '（需要小铲子才能挖。\n小镇礼品店有卖～）' }); return; }
    ADV.Audio.sfx('dig');
    await say({ text: '你照着残页的标记开挖——\n哐当！铲子碰到了硬物！' });
    const loot = DIG_LOOT[o.did];
    f.dig[o.did] = true;
    if (loot.gold) { f.gold = (f.gold || 0) + loot.gold; await say({ text: `一小罐金币！💰 +${loot.gold}` }); }
    if (loot.item) { ADV.Collect.addItem(loot.item, 1); await ADV.UI.itemGet(ADV.Collect.itemInfo(loot.item).name, '#ffd94c'); }
    if (loot.quote && ADV.Collect.gain('quotes', loot.quote)) await say({ text: '罐子里还有一张字条，\n写着一句老话。' });
    const n = Object.keys(f.dig).length;
    UI().toast(` 🏺 埋宝 ${n} / 8 `);
    logEvent(`照着埋宝图挖出了第 ${n} 处宝藏`);
    save();
  };

  // —— P6 秘传技：灌木丛（修枝剪剪开 → 家园院墙 ⇄ 小镇东北近路永久开通） ——
  S.hedge = async (o) => {
    const f = F();
    if (f.hedgeCut) { await say({ text: '（剪过的灌木修剪得整整齐齐，\n正好给近道让了路）' }); return; }
    if (!ADV.Collect.count('shears')) {
      await say({ text: '（灌木丛长得又密又高，\n枝条扎手，徒手拨不开。\n——园艺用的修枝剪应该能行，\n小镇礼品店有卖）' });
      return;
    }
    ADV.Audio.sfx('dig');
    await say({ text: '咔嚓、咔嚓——\n修枝剪利落地开路，\n枝叶后面果然藏着一条能过人的缝！' });
    f.hedgeCut = true;
    const objs = E().map.objects;
    for (let i = objs.length - 1; i >= 0; i--) if (objs[i].kind === 'hedge') objs.splice(i, 1);
    logEvent('用修枝剪剪开了院墙边的灌木近道');
    UI().toast(' ✂ 灌木丛剪开了——家园 ⇄ 小镇近路开通！ ');
    save();
  };

  /* ---------- 考试系统（校务打卡板） ---------- */
  const SUBJ_CN = { math: '数学', chinese: '语文', science: '科学', english: '英语' };
  /* 单题一问：只答一遍，返回是否答对；传入 wrongBag 时把做错的题收进去（打卡错题重做用） */
  async function examOnce(label, subject, diff, seed, wrongBag) {
    const hadTutor = !!(F().tutor || {})[subject];
    if (hadTutor) {
      F().tutor[subject] = false;                      // 用后即焚
      diff = diff === 'hard' ? 'normal' : 'easy';
    }
    const q = await ADV.AI.question(subject, (F().studyBuff || hadTutor) && diff !== 'easy' ? 'easy' : diff, seed);
    const cap = (F().studyBuff || hadTutor) ? q.q + '\n（老师指点过：这题稳了！）' : q.q;
    const i = await choose(q.opts, { cancelIndex: -1, caption: { name: label, text: cap } });
    const hit = i === q.a;
    if (ADV.Mistake) ADV.Mistake.answer(SUBJ_CN[subject] || subject, q, i);   // 学习闭环：统计+错题入本
    if (hit) {
      ADV.Audio.sfx('correct');
      const C = ADV.Cal, f = F();
      let xp = diff === 'hard' ? 6 : diff === 'normal' ? 4 : 2;
      if (f.nightStudyDay === C.day) xp = Math.ceil(xp * 1.5);   // 晚自习 buff：当晚刷题经验 +50%
      if (ADV.Growth) { ADV.Growth.addXP(xp, '答题'); ADV.Growth.addDim('knowledge', f.morningReadDay === C.day ? 2 : 1); }  // 晨读 buff：当日知识点 +1
      return true;
    }
    ADV.Audio.sfx('wrong');
    if (wrongBag) wrongBag.push(q);
    return false;
  }
  /* 多题考试：同一题答错现场重答（直至答对） */
  async function examAsk(label, subject, diff, seed) {
    while (true) {
      if (await examOnce(label, subject, diff, seed)) {
        olympPrepTick(subject, true);                       // 随堂练习整卷通过也攒奥赛备战度（口径：一次练习 +1）
        return true;
      }
      await say({ name: label, text: '再想想～答错不扣分，但要重答哦。' });
    }
  }
  S._examAsk = examAsk;                                    // 测试钩子（同 S._petGift 惯例）
  /* —— 学业奖励汇入精灵线（s13.2）：考试好成绩，老师和阿橘送驯兽好礼 —— */
  async function petExamGift(tier) {
    const CO = ADV.Collect;
    if (tier === 'week') {                               // 周测满分：阿橘赞助高级球
      CO.addItem('goodBall', 1);
      await ADV.UI.itemGet('阿橘赞助 · 高级球', '#8ab4ff');
      return;
    }
    if (tier === 'month') {                              // 月考满分：蒲老师的口粮礼包
      CO.addItem('petFood', 2);
      await ADV.UI.itemGet('蒲老师 · 精灵口粮 ×2', '#a8e063');
      return;
    }
    // 期中 S 级：异色赠礼——从未收录的 rar≤2 里按当日种子挑一只；全收录折现 +100 金
    const pool = CO.critterList().filter(c => c.rar <= 2 && !CO.has('critters', c.id));
    if (!pool.length) { F().gold = (F().gold || 0) + 100; return; }
    const pick = seededShuffle(pool, ADV.Cal.day * 41 + 3)[0];
    CO.gainCritter(pick.id, true);
  }
  S._petGift = petExamGift;                              // 测试钩子（同 S._famAdv 惯例）
  /* —— 道德抉择事件池（C8）：8 枚两难小事件，影响声望/好感/钱包；选择入档，NG+ 重演时「上一个你」回响 ——
   * 效果字段：help 声望 / gold 金币 / cup 学院分 / energy 精力 / bond {id,n} 好感（helpPts 夹 0 下限） */
  const MORAL_EVENTS = [
    { id: 'wallet', title: '走廊里的钱包',
      setup: '走廊拐角，一个鼓鼓的钱包躺在地上。\n四周一个人影都没有。',
      a: { t: '交给老师', help: 2, cup: 1,
           text: '你把钱包送到了教务处。\n失主是食堂张叔——他连声道谢。\n（帮助板声望 +2 · 学院分 +1）' },
      b: { t: '悄悄收起来', gold: 30, help: -2,
           text: '你左右看看，把它塞进了书包。\n钱包里 30 文钱……沉甸甸的。\n（金币 +30 · 心里有点过意不去：声望 -2）' } },
    { id: 'cheat', title: '邻座的纸条',
      setup: '随堂测验，邻座同学悄悄捅了捅你：\n「第五题……给我瞄一眼嘛。」',
      a: { t: '小声给他讲思路', bond: { id: 'dazhuang', n: 2 }, kp: 1,
           text: '你没给他看答案，但把思路讲了一遍。\n「……哦——原来是这样！」他眼睛亮了。\n（大壮好感 +2 · 知识点 +1：讲一遍记得更牢）' },
      b: { t: '把卷子挪过去', bond: { id: 'dazhuang', n: 1 }, help: -1,
           text: '你把卷子挪了挪。他飞快抄完，冲你比了个大拇指。\n监考老师似乎没发现……但你心里毛毛的。\n（大壮好感 +1 · 声望 -1）' } },
    { id: 'blame', title: '碎掉的玻璃',
      setup: '操场边「哗啦」一声——大壮踢球砸碎了窗。\n他脸都白了：「千万别说是我……」\n这时老师正朝这边走来。',
      a: { t: '替大壮认下来', bond: { id: 'dazhuang', n: 3 }, help: -1,
           text: '「是我不小心。」你说。\n老师批评了你。大壮低下头，攥紧了拳头。\n（大壮好感 +3 · 声望 -1）' },
      b: { t: '说出真相', bond: { id: 'dazhuang', n: -1 }, help: 2,
           text: '「是大壮踢的。」你如实说。\n大壮挨了批评，气鼓鼓地瞪了你一眼——\n但放学时他小声说了句「……其实该谢谢你」。\n（声望 +2 · 大壮好感 -1）' } },
    { id: 'change', title: '多找的五文钱',
      setup: '食堂结账，阿姨手一抖，多找了 5 文钱。\n她已经转身去忙下一单了。',
      a: { t: '退回去', help: 1, text: '「阿姨，多找了五文！」\n她笑着直夸你实在。（声望 +1）' },
      b: { t: '收下', gold: 5, text: '你默默把五文钱收进兜里。\n（金币 +5。好像也没人知道……）' } },
    { id: 'catfish', title: '偷鱼的猫',
      setup: '食堂后门，一只小猫叼着条鱼——\n被帮工阿姨当场逮住。猫委屈地「喵」了一声。',
      a: { t: '替猫赔鱼钱', gold: -3, bond: { id: 'cat', n: 2 },
           text: '你掏出 3 文替小猫埋了单。\n小猫蹭了蹭你的裤脚，叼着鱼跑了。\n（金币 -3 · 小猫好感 +2）' },
      b: { t: '说这只猫不认识', help: -1, text: '你摇摇头走开了。\n身后传来猫的叫声，你没回头。\n（声望 -1……总觉得欠了点什么）' } },
    { id: 'tornpage', title: '被撕的书页',
      setup: '图书馆还书时，你发现书里有一页\n被前一位读者撕走了。没人注意到。',
      a: { t: '主动告诉秦墨', help: 1, cup: 1,
           text: '你把缺页的事告诉了秦墨。\n他愣了一下，轻声道谢，补记了书目。\n（声望 +1 · 学院分 +1）' },
      b: { t: '装作没看见', text: '你把书塞回还书箱，快步走开。\n（就当……没看见吧。）' } },
    { id: 'votes', title: '多出来的三票',
      setup: '班委计票结束——你比林小雨多三票。\n可你瞥见唱票时有一列被念重了。\n说实话，那三票……不该算你的。',
      a: { t: '当场提出来', bond: { id: 'linxiaoyu', n: 2 }, help: 2, cup: 1,
           text: '「等等——有一列念重了。」\n全班安静了两秒，随后为你鼓掌。\n林小雨看你的眼神都变了。\n（声望 +2 · 林小雨好感 +2 · 学院分 +1）' },
      b: { t: '沉默接过班委', gold: 20, help: -2,
           text: '你什么也没说，接过了班委的牌子。\n（班委补贴 +20 文 · 声望 -2：总有人看出了破绽）' } },
    { id: 'umbrella', title: '暴雨的校门口',
      setup: '放学暴雨。校门口，小影没带伞，\n抱着书包发呆。你家就在隔壁街。',
      a: { t: '送小影回家', energy: 5, bond: { id: 'xiaoying', n: 2 },
           text: '你把伞塞给小影，两人挤着走了一路。\n淋湿了半边肩膀，但聊得很开心。\n（精力 -5 · 小影好感 +2）' },
      b: { t: '自己先走', text: '你撑着伞小跑回家。\n透过雨幕，好像看见小影还在屋檐下。\n（……明天带两块糖赔个罪吧。）' } }
  ];
  async function moralEvent() {
    const f = F(), C = ADV.Cal;
    const ev = MORAL_EVENTS.find(e => !f.moral[e.id]);
    if (!ev) return false;                               // 全池放完收口
    const prev = (f.moralPrev || {})[ev.id];
    await say({ name: '抉择', text: (prev ? '（恍惚间想起——上一个「你」，也在这里犹豫过。）\n' : '') + ev.setup });
    const i = await choose([ev.a.t, ev.b.t], { caption: { name: ev.title, text: '怎么选，都会成为你的一部分。' } });
    const pick = i === 0 ? ev.a : ev.b;
    f.moral[ev.id] = i === 0 ? 'a' : 'b';
    if (pick.help) f.helpPts = Math.max(0, (f.helpPts || 0) + pick.help);
    if (pick.gold) f.gold = Math.max(0, (f.gold || 0) + pick.gold);
    if (pick.cup) addCup(pick.cup);
    if (pick.energy) C.costEnergy(pick.energy);
    if (pick.kp && ADV.Mistake) ADV.Mistake.gain('final', pick.kp);
    if (pick.bond) gainBond(pick.bond.id, pick.bond.n);
    let tail = '';
    if (prev) tail = prev === f.moral[ev.id] ? '\n（和上一个你，选了同一条路。）' : '\n（这一次，你走了另一条路。）';
    await say({ name: ev.title, text: pick.text + tail });
    logEvent(`「${ev.title}」你选择了：${pick.t}`);
    save();
    return true;
  }
  /* —— 抉择心迹（批次十七）：钟楼边回想点——把这一路做过的两难选择翻出来重看；NG+ 有上一世对照 —— */
  S.reminisce = async () => {
    const f = F();
    const done = MORAL_EVENTS.filter(e => f.moral[e.id]);
    await say({ name: '钟楼边', text: '钟楼的长椅被太阳晒得暖暖的。\n你坐下来，翻看这段时间留在心里的抉择。' });
    if (!done.length) {
      await say({ name: '心迹', text: '……还是白纸。\n有些选择，要等日子把它们送到你面前。' });
      return;
    }
    const lines = done.map(e => {
      const pick = f.moral[e.id] === 'a' ? e.a : e.b;
      const prev = (f.moralPrev || {})[e.id];
      const echo = prev ? (prev === f.moral[e.id] ? '（和上一个你一样）' : '（上一个你选了另一边）') : '';
      return `「${e.title}」你选了：${pick.t}${echo}`;
    });
    for (let i = 0; i < lines.length; i += 4) await say({ name: '心迹', text: lines.slice(i, i + 4).join('\n') });
    const rest = MORAL_EVENTS.length - done.length;
    await say({ name: '心迹', text: (rest ? `还有 ${rest} 枚抉择，在往后的日子里等你。\n` : '八枚抉择，你都面对过了。\n') + '怎么选，都会成为你的一部分。' });
  };
  S.boardCheck = async () => {
    const f = F(), C = ADV.Cal;
    // —— 每日一题打卡（难度随天数加强；答错的题要重做，做对才能完成打卡） ——
    if (!C.checkedIn) {
      const diff = C.day <= 5 ? 'easy' : C.day <= 15 ? 'normal' : 'hard';
      const diffCN = { easy: '简单', normal: '普通', hard: '困难' }[diff];
      await say({ name: '校务板', text: `【每日一题】第 ${C.day} 天 · ${diffCN}难度\n连续打卡 ${C.streak} 天（最佳 ${ADV.Cal.dump().bestStreak}）` });
      const subjects = ['math', 'chinese', 'science', 'english'];
      const subject = subjects[(C.day * 7) % 4];
      const wrongs = [];                                    // 今天答错的题
      await examOnce('每日一题', subject, diff, C.day, wrongs);   // 天数作种子：每天题目不同
      if (wrongs.length) {
        await say({ name: '校务板', text: `答错了 ${wrongs.length} 题——错题重做时间！\n把错题全部做对，才算完成今天的打卡。` });
        while (wrongs.length) {
          const q = wrongs.shift();
          let done = false;
          while (!done) {
            const i = await choose(q.opts, { cancelIndex: -1, caption: { name: '错题重做 · 做对才能打卡', text: q.q } });
            const hit = i === q.a;
            if (ADV.Mistake) ADV.Mistake.answer(SUBJ_CN[subject] || subject, q, i);
            if (hit) { ADV.Audio.sfx('correct'); done = true; }
            else { ADV.Audio.sfx('wrong'); await say({ name: '校务板', text: '还不对——再想一遍，做对才能完成打卡！' }); }
          }
        }
        await say({ name: '校务板', text: '错题全部做对，了不起！今天的打卡完成～' });
      }
      const streak = C.checkIn();
      logEvent('在校务板完成了每日打卡');
      // 专题周：当周学科打卡双倍奖励
      const themeSub = { 数学周: 'math', 语文周: 'chinese', 科学周: 'science', 英语周: 'english' }[themeWeek()];
      const bonus = themeSub === subject ? 5 : 0;
      f.gold = (f.gold || 0) + 5 + bonus;
      ADV.Audio.sfx('save');
      await say({ name: '校务板', text: `打卡成功！连续 ${streak} 天 💪\n零花钱 +${5 + bonus}${bonus ? `（${themeWeek()}双倍！）` : '（今日已可在床铺睡觉过日）'}` });
      if (streak % 3 === 0) { f.gold = (f.gold || 0) + 10; UI().toast(' 🔥 连续打卡奖励：金币 +10 '); }
      if (streak % 7 === 0) { addCup(2); UI().toast(' 🔥 连续打卡 7 天：学院分 +2 '); }
      save();
      return;
    }
    // —— 樱花祭（第 8-10 天） ——
    if (C.day >= 8 && C.day <= 10 && !f.sakura) {
      await say({ name: '广播', text: '【大事件】樱花祭开幕！\n摊位、合影、还有满树的花！' });
      const go = await choose(['去逛逛！', '今天没空'], { caption: { name: '樱花祭', text: '就在校园樱花树一带～' } });
      if (go === 1) return;
      f.sakura = true;
      ADV.Audio.playBgm('tender');
      await say({ text: '樱花树下摆满了小摊——\n捞金鱼、套圈、猜谜……人声鼎沸。' });
      await say({ text: '班长把全班召集到树下——\n「来来来，合影啦！」' });
      ADV.Audio.sfx('photo');
      ADV.Collect.gain('photos', 'p_sakura');
      await say({ text: '咔嚓。\n花瓣落在每个人的肩上。' });
      Object.keys(state.friends).forEach(id => gainBond(id, 2));
      f.gold = (f.gold || 0) + 30;
      addCup(5);
      try { const m = ADV.Engine.map; if (m && m.bgmCur) ADV.Audio.playBgm(m.bgmCur); } catch (e) {}
      save();
      return;
    }
    // —— s7 节日联动：植树节/读书日/风筝节……当日小活动（打卡后触发） ——
    if (await festivalLink()) return;
    // —— 道德抉择事件池（C8）：day≥3 起隔天一枚（全池放完收口；节日/大事件优先） ——
    if (C.day >= 3 && C.day % 2 === 1 && await moralEvent()) return;
    // —— 期中风波（第三幕后） ——
    if (f.act >= 3 && C.day >= 17 && !f.boar) {
      await say({ name: '广播', text: '【紧急】校园花坛一夜之间被毁！\n有人指认……乌云帮三人昨夜出现在现场。' });
      const go = await choose(['去调查真相', '先看看再说'], { caption: { name: '期中风波', text: '乌云帮昨晚确实不在宿舍……' } });
      if (go === 1) return;
      await say({ text: '花坛一片狼藉。你蹲下细看——\n泥土上是蹄印，不是鞋印。' });
      await say({ text: '走访保安：\n「后半夜？听见哼哧哼哧的声音，\n还以为是打雷呢。」' });
      await say({ text: '围墙根有一撮硬鬃毛，\n和半截啃剩的红薯。' });
      const i = await choose(['是野猪干的！', '就是乌云帮干的', '是金鹏搞的鬼'], { caption: { name: '推理', text: '证据都指向——' } });
      if (i === 0) {
        f.boar = true;
        ADV.Audio.sfx('fanfare');
        await say({ text: '蹄印、鬃毛、红薯——真凶是\n夜里下山觅食的野猪！\n保安大爷连夜加固了围墙。' });
        await say({ text: '广播里播报了真相。\n乌云帮三人在走廊上等你，\n别别扭扭地站成一排。' });
        await say({ name: '乌云', text: '……就冲你今天这个忙，\n以后你的事，就是乌云帮的事。' });
        gainBond('wuyun', 10); gainBond('dazhuang', 8); gainBond('xiaoying', 8);
        addCup(5);
        save();
      } else {
        await say({ text: '（不对……证据明明指向别处。\n再想想：蹄印、鬃毛、红薯）' });
      }
      return;
    }
    // —— 班级周事件已移至低优先级（见模拟考之后） ——
    // —— 运动会（第三幕事件） ——
    if (f.act >= 3 && !f.sportsDone) {
      await say({ name: '广播', text: '【大事件】阳光中学运动会今日举行！\n班级接力、投篮决赛、对抗赛等你出战！' });
      const go = await choose(['出赛！', '再准备准备'], { caption: { name: '运动会', text: '三项赛事，赢两场就有大奖！' } });
      if (go === 1) return;
      let wins = 0;
      const race = await new Promise(res => ADV.Mini.start('broom', res));   // 接力竞速（扫帚引擎复用）
      if (race) { wins++; await say({ text: '最后一棒反超！全班沸腾了！' }); } else await say({ text: '差半个身位……没关系！' });
      const ball = await new Promise(res => ADV.Mini.start('ball', res));
      if (ball) { wins++; await say({ text: '压哨三分！你在人群里找到了刘老师含泪的笑。' }); } else await say({ text: '投篮憾负。' });
      const fight = await new Promise(res => ADV.Battle.start('rival', {}, res));
      if (fight) { wins++; await say({ text: '对抗赛获胜！乌云帮在场边喊得比谁都大声。' }); } else await say({ text: '对抗赛惜败，医务室的绷带免费。' });
      f.sportsDone = true;
      if (wins >= 2) {
        addCup(10); f.gold = (f.gold || 0) + 60;
        ADV.Collect.gain('photos', 'p_sports');
        await say({ text: '运动会总分第一！\n班主任举着相机冲过来——咔嚓！' });
        await ADV.UI.itemGet('回忆照片·运动会合影', '#ffd94c');
      } else { f.gold = (f.gold || 0) + 20; await say({ text: '名次一般，但快乐是真的。' }); }
      save();
      return;
    }
    // —— 周测（周五；周六可补办一次，错过周五不再永久跳过） ——
    const isSat = C.day % 7 === 6;
    if ((C.isFriday() || isSat) && f.weekDone !== C.weekIndex()) {
      await say({ name: '校务板', text: isSat ? '【周测·补办】昨天错过周测？\n王老师特意给你留了补考名额！' : '【周测】三道题，本周学习成果大检验！' });
      let wrong = 0;
      for (const s of ['math', 'chinese', 'english']) if (!(await examAsk('周测', s, 'normal'))) wrong++;
      f.weekDone = C.weekIndex();
      const reward = wrong === 0 ? (isSat ? 15 : 25) : 10;   // 补办满分奖励略减
      f.gold = (f.gold || 0) + reward;
      await say({ name: '校务板', text: wrong === 0 ? `全对！零花钱 +${reward}！${isSat ? '\n（补办奖励略减，下周五别忘了哦）' : ''}` : `错 ${wrong} 题，零花钱 +10。\n（在家复习可以让考试变简单）` });
      if (wrong === 0 && !isSat) await petExamGift('week');  // s13.2：满分加赠阿橘赞助的高级球
      save();
      return;
    }
    // —— 月考（第 15 天后） ——
    if (C.day >= 15 && !f.mExam) {
      await say({ name: '校务板', text: '【月考】全科六题。\n成绩会贴上光荣榜！' });
      let wrong = 0;
      for (const s of ['math', 'chinese', 'science', 'english', 'chinese', 'math'])
        if (!(await examAsk('月考', s, F().studyBuff ? 'easy' : 'normal'))) wrong++;
      f.mExam = true; f.studyBuff = false;
      // 乌云帮补课线：一起复习过 → 及格
      if (f.wuyunStudy && !f.wuyunPass) {
        f.wuyunPass = true;
        await say({ text: '放榜了——\n乌云帮三人全部及格！！\n乌云盯着 62 分看了很久，抿住了嘴。' });
        ADV.Collect.gain('wishes', 'w5');               // 心愿集：乌云「堂堂正正地再喊一次及格」
        E2();
      }
      if (wrong === 0) { f.gold = (f.gold || 0) + 80; addCup(6); await say({ name: '光荣榜', text: '满分！全校通报表扬！💰+80' }); await petExamGift('month'); }
      else if (wrong <= 2) { f.gold = (f.gold || 0) + 40; await say({ name: '光荣榜', text: `优秀！💰+40` }); }
      else await say({ name: '光荣榜', text: `错了 ${wrong} 题，下次复习再来！💰+10` });
      f.gold = (f.gold || 0) + 10;
      save();
      return;
    }
    // —— 期中（第四幕；与日历预告口径一致：act≥4 且第 21 天起） ——
    if (f.act >= 4 && ADV.Cal.day >= 21 && !f.midterm) {
      await say({ name: '校务板', text: '【期中大考】全科八题，\n评级 S 有神秘奖品！' });
      let wrong = 0;
      for (let i = 0; i < 8; i++) {
        const s = ['math', 'chinese', 'science', 'english'][i % 4];
        if (!(await examAsk('期中大考', s, F().studyBuff ? 'normal' : 'hard'))) wrong++;
      }
      f.midterm = true; f.studyBuff = false;
      if (wrong === 0) {
        f.gold = (f.gold || 0) + 150; addCup(10);
        ADV.Collect.addItem('watch', 1);
        await say({ name: '光荣榜', text: 'S 级！校长亲自颁奖——\n一块古朴的「学者的旧怀表」。' });
        await ADV.UI.itemGet('学者的旧怀表', '#d8c078');
        ADV.Collect.gain('quotes', 'q1');
        await say({ name: '光荣榜', text: '还有一份转交礼——\n「蒲老师听说你的成绩，托我把她挑的\n小伙伴送来。是金色的哦！」' });
        await petExamGift('midterm');                    // s13.2：异色小伙伴赠礼
      } else if (wrong <= 2) { f.gold = (f.gold || 0) + 60; await say({ name: '光荣榜', text: `A 级！错 ${wrong} 题。💰+60` }); }
      else if (wrong <= 4) { f.gold = (f.gold || 0) + 30; await say({ name: '光荣榜', text: `B 级。💰+30` }); }
      else await say({ name: '光荣榜', text: `C 级……假期作业有点多。` });
      save();
      return;
    }
    // —— 班级周事件（最低优先级：周一班会 / 周三大扫除） ——
    if (C.day % 7 === 1 && f.classDay !== C.day) {
      f.classDay = C.day;
      await say({ name: '班会', text: `本周之星评选——\n连续打卡 ${C.streak} 天的你${C.streak >= 3 ? '，全票通过！' : '，获得提名！'}` });
      Object.keys(state.friends).forEach(id => gainBond(id, 1));
      save();
      return;
    }
    if (C.day % 7 === 3 && f.classDay !== C.day) {
      f.classDay = C.day;
      const g = await choose(['认真打扫', '划水摸鱼'], { caption: { name: '大扫除', text: '走廊、窗户、花坛……' } });
      if (g === 0) {
        Object.keys(state.friends).forEach(id => gainBond(id, 2));
        gainBond('aunt', 1);
        await say({ text: '窗明几净。班主任在墙上\n给你贴了一朵小红花。' });
      } else await say({ text: '你躲在图书角看了一下午书。\n（没人发现……大概）' });
      save();
      return;
    }
    // —— 模拟考（期中后每日一次，刷金币学院分） ——
    if (f.midterm && f.mockDay !== C.day) {
      const g = await choose(['来一场模拟考', '先不了'], { caption: { name: '校务板', text: '【模拟考】四题，答得好有零花钱～' } });
      if (g === 1) { await say({ name: '校务板', text: `${C.label()}\n打卡 ✔（连续 ${C.streak} 天）` }); return; }
      let wrong = 0;
      for (let i = 0; i < 4; i++) {
        const s = ['math', 'chinese', 'science', 'english'][i % 4];
        if (!(await examAsk('模拟考', s, F().studyBuff ? 'easy' : 'normal'))) wrong++;
      }
      f.mockDay = C.day; f.studyBuff = false;
      const gg = wrong === 0 ? 40 : wrong <= 2 ? 20 : 8;
      f.gold = (f.gold || 0) + gg;
      if (wrong === 0) addCup(2);
      C.advance(1);
      await say({ name: '校务板', text: wrong === 0 ? `全对！💰 +${gg}` : `错 ${wrong} 题。💰 +${gg}\n（晚上复习会更简单）` });
      save();
      return;
    }
    await say({ name: '校务板', text: `${ADV.Cal.label()}\n打卡 ✔（连续 ${C.streak} 天）\n${f.act >= 3 ? '运动会' : C.isFriday() ? '周测' : C.day >= 15 ? '月考' : '一切正常'}；F 查手册，G 送礼` });
  };
  function E2() {
    const f = F();
    // 三条感化线全部完成 → 乌云帮正式入伙
    if (f.wuyunPass && f.dazhuangDone && f.xiaoyingDone && !f.wuyunGang) {
      f.wuyunGang = true;
      ADV.Collect.addItem('scrap', 1);
      ADV.Audio.sfx('fanfare');
      UI().toast(' 乌云帮正式入伙！全校埋宝点已解锁（8 处） ');
    } else {
      ADV.Audio.sfx('fanfare');
      UI().toast(' 乌云帮的乌云散了一半——继续感化！ ');
    }
  }

  /* ==================== 公园 · 农田 · 魔法晨课 ==================== */

  // —— 花婆婆（公园）与浇水故事线 ——
  S.flowerLady = async (ent) => {
    const f = F();
    if (!f.metFlower) {
      f.metFlower = true;
      await say({ name: '花婆婆', text: '哟，小朋友来公园啦。\n婆婆这花圃，种了三十年花喽。' });
      await say({ name: '花婆婆', text: '最近天旱虫又多，\n你要是得空，帮我浇浇花呗。' });
      gainBond('flower', 2);
      save();
      return;
    }
    if ((f.parkWater || 0) >= 3 && !f.parkStory1) {
      f.parkStory1 = true;
      await say({ name: '花婆婆', text: '开花啦！你瞧瞧——\n这些花，多少年没开得这么好了。' });
      await say({ name: '花婆婆', text: '这包四季花种送你，\n种在你家院子里，一年四季都有花看。' });
      await ADV.UI.itemGet('四季花种', '#ff8ab0');
      ADV.Collect.addItem('flowerSeed', 1);
      gainBond('flower', 10);
      addCup(3);
      save();
      return;
    }
    if ((f.parkWater || 0) >= 7 && !f.parkStory2) {
      f.parkStory2 = true;
      await say({ name: '花婆婆', text: '跟你说个秘密——\n公园最老的树下，婆婆埋了个铁盒。' });
      await say({ name: '花婆婆', text: '盒子里是年轻时的照片。\n人老了就爱念旧，你替我收着吧。' });
      f.gold = (f.gold || 0) + 30;
      gainBond('flower', 15);
      addCup(3);
      UI().toast(' 🌸 公园故事线完成！金币 +30 ');
      save();
      return;
    }
    if (f.flowerWaterDay !== ADV.Cal.day) {
      await say({ name: '花婆婆', text: '花圃又渴啦，去浇浇水吧——\n（浇水后记得回来找婆婆）' });
      return;
    }
    await say({ name: '花婆婆', text: ['今天的花开得精神！', '浇水要浇根，做人要真心。', '婆婆年轻时，可是镇上的花匠呢。'][(Math.random() * 3) | 0] });
  };
  S.flowerBedSign = async () => { await say({ name: '木牌', text: '「花婆婆的花圃」\n—— 花儿一天不浇，就蔫一天。' }); };
  S.waterFlowers = async () => {
    const f = F();
    if (f.flowerWaterDay === ADV.Cal.day) { await say({ text: '（今天的花浇过水了，\n浇太多会烂根哦）' }); return; }
    f.flowerWaterDay = ADV.Cal.day;
    f.parkWater = (f.parkWater || 0) + 1;
    ADV.Audio.sfx('item');
    await say({ text: '你提着小水壶，把花圃浇了个透。\n叶子舒展开，花儿点点头。' });
    f.gold = (f.gold || 0) + 8;
    UI().toast(` 💧 浇水成功！零花钱 +8（累计 ${f.parkWater} 天） `);
    gainBond('flower', 1);
    logEvent('在公园帮花婆婆浇了花');
    save();
  };
  // 公园传说（三段小故事）
  S.parkTale = async () => {
    const f = F();
    const n = f.parkTaleN || 0;
    const tales = [
      '很多年前，这里是一片荒地。\n一位老园丁种下第一棵树，\n大家伙儿一起，种出了这座公园。',
      '传说月圆之夜，池塘里\n会映出两轮月亮——\n一轮在天上，一轮在心里。',
      '公园最老的树下埋着个铁盒，\n装着建园人的合影。\n找到它的人，会得到整座公园的祝福。'
    ];
    await say({ name: '公园传说', text: tales[n % tales.length] });
    if (n === 0 && !f.parkTale1) { f.parkTale1 = true; UI().toast(' 📖 公园传说 1/3 '); }
    else if (n === 1 && !f.parkTale2) { f.parkTale2 = true; UI().toast(' 📖 公园传说 2/3 '); }
    else if (n === 2 && !f.parkTale3) {
      f.parkTale3 = true;
      await say({ text: '你抬头看向那棵最老的树——\n咦，好像有人影一闪而过？\n（公园的传说是真的……吗？）' });
      UI().toast(' 📖 公园传说 3/3 · 完成！ ');
      addCup(2);
    }
    f.parkTaleN = n + 1;
    save();
  };

  // —— 农田：稻田除虫（田伯故事线，连续三天） ——
  S.farmHelp = async () => {
    const f = F();
    if (!f.farmDone) { await say({ name: '稻田', text: '（稻子刚抽穗。\n先去找田伯聊聊吧）' }); return; }
    if (f.farmHelpDay === ADV.Cal.day) { await say({ text: '（今天的虫捉完了，\n稻子轻轻点头道谢）' }); return; }
    f.farmHelpDay = ADV.Cal.day;
    f.farmHelpN = (f.farmHelpN || 0) + 1;
    ADV.Audio.sfx('item');
    await say({ text: '你弯着腰在稻叶间找虫。\n一条、两条……害虫全捉进了罐子！' });
    f.gold = (f.gold || 0) + 6;
    gainBond('farmer', 1);
    if (f.farmHelpN === 3) {
      await say({ name: '田伯', text: '三天了，你天天来！\n你瞧这稻穗——沉甸甸的，是大地的谢礼！' });
      f.gold = (f.gold || 0) + 40;
      addCup(2);
      await say({ text: '金灿灿的稻浪翻滚。\n（丰收达成！零花钱 +40 · 学院分 +2）' });
      logEvent('帮田伯守住了稻田，迎来丰收');
    } else {
      UI().toast(` 🌾 稻田除虫 ${f.farmHelpN}/3 天 · 零花钱 +6 `);
    }
    save();
  };

  // —— 月光学院 · 魔法晨课（每日一题，学魔法知识） ——
  const MOON_QUIZ = [
    { q: '飞行课里追的"金翼球"，有什么特点？', opts: ['飞得极快，眨眼就没影', '比乌龟还慢', '根本不会飞'], a: 0, note: '知识卡：金翼球是月光学院最快的飞行器，只有骑稳扫帚才追得上。' },
    { q: '月露魔药的正确配方是？', opts: ['月光三滴＋星尘一撮', '露水三滴＋泥巴一撮', '雨水三滴＋糖一勺'], a: 0, note: '知识卡：月露要在满月下采集——晒过月亮的露水才有魔力。' },
    { q: '咒语"星火微光"的作用是？', opts: ['指尖亮起一颗小星星', '召唤倾盆大雨', '让房子飞起来'], a: 0, note: '知识卡：星火微光（Lumos-Stella）是最基础的照明咒，念太快会打嗝冒火星。' },
    { q: '天文课找"晨曦星"，望远镜应对准哪里？', opts: ['黎明前的东方天际', '脚底下', '教室天花板'], a: 0, note: '知识卡：晨曦星只在黎明前的东方出现一分钟，传说是晨曦女士的化身。' },
    { q: '归类帽根据什么把学生分进学院？', opts: ['内心的品质与选择', '身高', '头发颜色'], a: 0, note: '知识卡：归类帽会读心，但它最看重的，是你自己心里的选择。' },
    { q: '禁书区的书为什么不能随便翻？', opts: ['有的书脾气很大，会咬人', '只是怕弄皱', '书都在睡觉'], a: 0, note: '知识卡：翻禁书区的书前，要轻轻敲三下封面，这是和书的礼节。' },
    { q: '三首犬旺福睡着的原因是？', opts: ['听完了完整的摇篮曲', '吃得太饱', '运动会累的'], a: 0, note: '知识卡：摇篮曲中途停下，旺福会睁开一只眼——那眼神很失望。' },
    { q: '魔药课的坩埚是用什么做的？', opts: ['月亮石', '普通铁', '巧克力'], a: 0, note: '知识卡：月亮石坩埚受热会泛银光，顺便提醒你火别开太大。' },
    { q: '学院杯的积分不包括哪一项？', opts: ['零花钱数量', '课堂表现', '友谊互助'], a: 0, note: '知识卡：学院杯看的是成长，不是钱包——月见校长的原话。' },
    { q: '扫帚起飞的口令是？', opts: ['起！', '坐！', '等等！'], a: 0, note: '知识卡：口令要干脆。你犹豫，扫帚也犹豫。' },
    { q: '月光大厅的水帘门后面通向哪里？', opts: ['月光学院', '食堂', '操场'], a: 0, note: '知识卡：穿过喷泉水帘就到月光学院——记得别穿新鞋。' },
    { q: '晨曦女士留下的话是？', opts: ['"学校会一直亮着"', '"下课了"', '"记得带伞"'], a: 0, note: '知识卡：校史馆墙上刻着这句话——那盏灯，确实一直亮到今天。' }
  ];
  S.magicClass = async () => {
    const f = F(), C = ADV.Cal;
    if (f.magicClassDay === C.day) { await say({ name: '晨课铃', text: '今天的晨课结束了。\n（明天再来学新的魔法知识）' }); return; }
    f.magicClassDay = C.day;
    const q = MOON_QUIZ[(C.day * 5 + 2) % MOON_QUIZ.length];
    await say({ name: '晨课铃', text: '叮铃铃——魔法晨课开始！\n今日课题，请听题：' });
    const i = await choose(q.opts, { cancelIndex: -1, caption: { name: '魔法晨课', text: q.q } });
    if (i === q.a) {
      ADV.Audio.sfx('correct');
      addCup(2);
      if (f.magicClassAll) f.gold = (f.gold || 0) + 5;   // 连续答对的小奖学金
      f.magicClassAll = true;
      await say({ name: '晨课铃', text: '答对了！学院分 +2！\n' + q.note });
    } else {
      ADV.Audio.sfx('wrong');
      f.magicClassAll = false;
      await say({ name: '晨课铃', text: '答错啦，不过学到了就是赚——\n' + q.note });
    }
    logEvent('上了魔法晨课');
    save();
  };

  /* ---------- 家 ---------- */
  S.mom = async () => {
    const C = ADV.Cal;
    const f = F();
    if (f.yalbum >= 5 && !f.momAlum) {
      f.momAlum = true;
      await say({ text: '你把五张旧照片摆在饭桌上。\n妈妈的手停在了半空。' });
      await say({ name: '妈妈', text: '……你都找到啦。\n对，妈妈就是这所学校毕业的。' });
      await say({ name: '妈妈', text: '那时候的校长还是个年轻人，\n总在喷泉边讲些了不起的话。\n没想到，他现在还讲给你听。' });
      await say({ name: '妈妈', text: '真好啊……我的学校，也成了你的学校。' });
      ADV.Collect.gain('wishes', 'w10');                  // 心愿集：妈妈的愿望在此收进
      gainBond('mom', 15);
      addCup(6);
      UI().toast(' 暗线完成《妈妈的校友证》 ');
      save();
      return;
    }
    if (!F().gotLunch) {
      F().gotLunch = true;
      ADV.Collect.addItem('bread', 1);
      await say({ name: '妈妈', text: '回来啦！\n妈妈包里给你装了甜面包。' });
      await say({ name: '妈妈', text: C.label() + '\n（记得去校务板打卡，\n晚上才能睡个好觉哦）' });
      save();
      return;
    }
    await say({ name: '妈妈', text: ['今天也要加油呀。', '书桌收拾一下再睡。', '妈妈永远给你留灯。'][(Math.random() * 3) | 0] });
  };
  // 家务：每天在饭桌旁帮妈妈做一件家务，赚零花钱
  const CHORES = [
    ['洗碗', '哗啦哗啦……碗碟洗得闪闪发光！'],
    ['扫地', '唰唰唰……地板亮得能照出人影！'],
    ['倒垃圾', '拎着垃圾袋一路小跑，干净又清爽！'],
    ['擦窗户', '抹布飞舞——窗户亮得像没有玻璃！'],
    ['整理书架', '课本按大小排好队，找书再也不费劲！']
  ];
  S.dinnerTable = async () => {
    const f = F(), C = ADV.Cal;
    if (f.houseworkDay !== C.day) {
      const [name, line] = CHORES[C.day % CHORES.length];
      const go = await choose([`帮忙${name}（赚零花钱）`, '今天先算了'],
        { caption: { name: '家务 · 饭桌旁', text: '妈妈在收拾，要搭把手吗？\n（每天一次，有零花钱哦）' } });
      if (go === 0) {
        f.houseworkDay = C.day;
        f.gold = (f.gold || 0) + 10;
        ADV.Audio.sfx('item');
        grantTalent('labor');
        await say({ name: '妈妈', text: `${line}\n真是妈妈的好帮手！（零花钱 +10）` });
        gainBond('mom', 1);
        if (f.metDad && Math.random() < .5) await say({ name: '爸爸', text: '（爸爸放下报纸）干得不错，明天继续啊。' });
        logEvent('帮家里做了家务');
        save();
        return;
      }
      await say({ text: '你悄悄溜开了。\n（明天再来帮忙也可以）' });
      return;
    }
    await say({ text: '家务都做完了，桌面干干净净。\n（明天妈妈还会需要帮手哦）' });
  };
  // 做饭：在家开火（学过菜谱后可用）；傍晚/夜晚还能吃妈妈做的晚饭（回复精力，每天一次）
  const _dinnerChore = S.dinnerTable;
  S.dinnerTable = async function () {
    const f = F(), C = ADV.Cal;
    const known = RECIPES.filter(r => f.recipes && f.recipes[r.id]);
    const opts = ['帮忙家务'];
    if (known.length) opts.push('自己做顿饭');
    if (Object.keys(DISH_BUFF).some(id => ADV.Collect.count(id) > 0)) opts.push('吃点自己做的小菜');
    if (Object.keys(DISH_BUFF).some(id => ADV.Collect.count(id) > 0) && f.familyDishDay !== C.day) opts.push('给家人尝尝手艺');
    if (C.period >= 4 && f.dinnerDay !== C.day) opts.push('吃妈妈做的晚饭');
    const i = await choose(opts, { caption: { name: '饭桌', text: known.length ? '妈妈留了字条：想做就自己做哦～' : '饭桌收拾得干干净净。' } });
    if (opts[i] === '自己做顿饭') {
      await cookAtHome();
      return;
    }
    if (opts[i] === '吃点自己做的小菜') {
      await eatAtHome();
      return;
    }
    if (opts[i] === '给家人尝尝手艺') {
      // 料理社交深化：把亲手做的菜端上家里饭桌——家人共食（每天一顿，妈妈好感 +3）
      const owned = Object.keys(DISH_BUFF).filter(id => ADV.Collect.count(id) > 0);
      const j = await choose(owned.map(id => `${ADV.Collect.itemInfo(id).name} ×${ADV.Collect.count(id)}`).concat('还是算了'),
        { caption: { name: '饭桌', text: '端一道拿手菜上桌——\n今天这顿，吃你做的！（每天一顿）' } });
      if (j < 0 || j >= owned.length) return;
      const dishName = ADV.Collect.itemInfo(owned[j]).name;
      ADV.Collect.useItem(owned[j], 1);
      f.familyDishDay = C.day;
      ADV.Audio.sfx('item');
      await say({ name: '妈妈', text: `哟——这是你做的《${dishName}》？\n有模有样的嘛，妈妈尝尝……\n嗯！不比食堂阿姨差！（妈妈好感 +3）` });
      if (f.metDad) await say({ name: '爸爸', text: '（爸爸默默夹了第二筷）\n行啊——家里出了个小厨子。' });
      gainBond('mom', 3);
      logEvent(`把亲手做的${dishName}端上了家里的饭桌`);
      save();
      return;
    }
    if (opts[i] === '吃妈妈做的晚饭') {
      f.dinnerDay = C.day;
      C.gainEnergy(30);
      ADV.Audio.sfx('item');
      await say({ name: '妈妈', text: '多吃点，看你今天跑了一天。\n热汤要趁热喝哦。\n（妈妈的味道：精力 +30）' });
      gainBond('mom', 2);
      logEvent('吃了妈妈做的晚饭');
      save();
      return;
    }
    await _dinnerChore();
  };
  S.dad = async () => {
    const C = ADV.Cal, f = F();
    if (!f.metDad) {
      f.metDad = true;
      await say({ name: '爸爸', text: '回来啦？爸爸正看校园版——\n这上面说，最近有位小冒险家在全校挺出名。' });
      await say({ name: '爸爸', text: '去闯你的冒险吧，家里有我们。\n（爸爸记住了你的事）' });
      save();
      return;
    }
    if (f.dadCoin !== C.day) {
      f.dadCoin = C.day;
      f.gold = (f.gold || 0) + 5;
      await say({ name: '爸爸', text: '零花钱拿好，省着点花。\n（爸爸塞给你 5 金币）' });
      save();
      return;
    }
    await say({ name: '爸爸', text: ['椅子坐得稳，书才看得香。', '报纸上说，今晚有星星。', '妈妈做的饭，永远是最好吃的。', '缺什么跟爸爸说，别客气。'][(Math.random() * 4) | 0] });
  };
  // 睡觉公共流程；atHome = 是否睡在自己家（醒来有爸妈的清晨问候）
  async function sleepCommon(atHome) {
    const C = ADV.Cal, f = F();
    if (!C.checkedIn) { await say({ text: `（今天还没在校务板打卡。\n不打完题，睡不着觉——校规如此！）\n${C.label()}` }); return; }
    // —— 毕业季检查（第 30 天，睡觉时触发多结局） ——
    await graduationCheck();
    // —— 睡前结算单（星露谷式）：当日收支 + 今日大事记 + 一日收获 + 明日天气预告 ——
    {
      const gold0 = f.goldDay >= 0 ? f.goldDay : f.gold;
      const delta = (f.gold || 0) - gold0;
      f.goldDay = f.gold;                            // 明日收支以今晚结余为基准
      const tw = C.forecastTomorrow();               // 预 roll 明日天气 → newDay 直接采用（预报必准）
      const acts = (f.today || []).slice(0, 3);      // 今日日记素材前 3 条当「大事记」
      const money = delta > 0 ? `💰 今日进账 ${delta} 文` : delta < 0 ? `💰 今日花销 ${-delta} 文` : '💰 今日收支两讫';
      const lines = acts.length ? acts.map(t => ' · ' + t).join('\n') : ' · 平平常常的一天';
      // 体验收束（二）：把散落全天的收获语言收束成一句「今日收获」——图鉴 +N / 知识点 +N
      let harvest = '';
      if (f.daySnap) {
        const colNow = ADV.Collect ? ADV.Collect.progress().got : 0;
        const kpNow = totalKp();
        const dCol = colNow - (f.daySnap.col || 0), dKp = kpNow - (f.daySnap.kp || 0);
        if (dCol > 0 || dKp > 0) {
          harvest = `\n\n🌟 今日收获：`
            + (dCol > 0 ? ` 图鉴 +${dCol}` : '')
            + (dCol > 0 && dKp > 0 ? ' ·' : '')
            + (dKp > 0 ? ` 知识点 +${dKp}` : '');
        }
      }
      // 情节连续性：睡前预告明日大事（复用事件日历，大事件不再藏在二次交互里被错过）
      const tmr = upcomingEvents().rows[1].evs;
      const fc = tmr.length ? `\n\n📌 明日大事：\n${tmr.map(t => ' · ' + t).join('\n')}` : '';
      await say({ name: '今日结算单', text: `${money}\n${lines}${harvest}\n\n🌤 明日预报：${tw}${fc}\n（预报保证准，睡个好觉吧）` });
      f.daySnap = { col: ADV.Collect ? ADV.Collect.progress().got : 0, kp: totalKp() };   // 明日快照基准
    }
    // —— 睡眠债：精疲力尽地睡 = 欠债（次日精力上限临时削减）；精神饱满地睡 = 还债 ——
    {
      if (C.energy <= C.energyMax * 0.3) {
        const before = C.sleepDebt;
        C.sleepDebt = Math.min(3, before + 1);
        if (C.sleepDebt > before) UI().toast(' 😴 你精疲力尽地睡去……（睡眠债 +1，明天会更累）');
      } else if (C.energy >= C.energyMax * 0.6 && C.sleepDebt > 0) {
        C.sleepDebt--;
        UI().toast(' 😊 精神饱满地睡了一觉，还清一笔睡眠债');
      }
    }
    await say({ text: '你钻进被窝……' });
    ADV.Game.busy = true;
    await new Promise(res => ADV.Engine.fadeTo(1, .6, res));
    const events = C.newDay();
    f.gotLunch = false;
    f.today = [];                                  // 新的一天，日记素材清零
    // 每日徽章重置：新的一天，四枚智慧徽章与四枚达人徽章都可以重新收集
    f.badges = { math: false, chinese: false, science: false, english: false };
    f.talent = { sports: false, music: false, labor: false, read: false };
    // 同伴道别 & 清晨小鸟
    if (f.party) { const mate = E().getNpc(f.party); if (mate) mate.followT = 0; f.party = ''; }
    if (f.birdDay === C.day - 1) { f.gold = (f.gold || 0) + 5; events.push({ text: '清晨小鸟叫你起床，零花钱 +5' }); }
    // —— 信箱：新的一天生成信件（星露谷式 mail） ——
    genMail();
    // —— 清晨随机拜访（难忘的暑假式：同伴来找你玩） ——
    genVisitor();
    // —— 后院农场结算：浇过水的田长一截 / 小鸡下一枚蛋 ——
    farmTick();
    // 生日提醒等事件
    for (const ev of events) UI().toast(' ' + ev.text + ' ');
    // 情节连续性：晨间播报今日大事件（校务板上的大事件不再靠玩家自己撞见）
    for (const t of upcomingEvents().rows[0].evs) UI().toast(' 📌 今日：' + t + ' ');
    // 体验收束（一）：系统开张导览——一天最多开张一家，新玩法逐日登场
    const tourTip = systemTour();
    if (tourTip) UI().toast(' ' + tourTip + ' ');
    // 新生阶段只给最关键的提醒，先让玩家把学校过熟。
    if (guideStage() === 'full') {
      const fortunes = ['大吉：今天适合挖宝', '中吉：考试运不错', '小吉：和朋友多聊聊', '平：稳稳的一天', '末吉：今晚早点睡'];
      UI().toast(' 🔮 ' + fortunes[(Math.random() * fortunes.length) | 0] + ' ');
    }
    UI().toast((guideStage() === 'full' ? ' 📌 今日目标：' : ' 🌤 今天先做这几件事：') + nextGoal() + ' ');
    await new Promise(res => ADV.Engine.fadeTo(0, .6, res));
    // 清晨问候：在自己家醒来，爸妈的一句早安（星露谷式的家庭温度）
    if (atHome) {
      const MORN = [
        ['妈妈', '早饭在桌上！鸡蛋要趁热吃。\n（妈妈系着围裙，厨房飘着香气）'],
        ['爸爸', '报纸我先看完了，\n校园版今天也有你的消息。'],
        ['妈妈', '红领巾昨天洗好晾在阳台了。\n书包也要自己检查哦。'],
        ['爸爸', '出门前把水壶灌满——\n夏天的太阳不讲情面。']
      ];
      const [who, line] = MORN[(C.day * 3 + 1) % MORN.length];
      await say({ name: who, text: line });
    }
    ADV.Game.busy = false;
    ADV.Audio.sfx('save');
    UI().toast(` ☀ 第 ${C.day} 天 · ${C.season()} · ${C.weather} `);
    save();
  }
