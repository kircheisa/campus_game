/* =========================================================
 * game-quest.js —— 游戏剧情拆分段 4/8
 * 任务清单 · 系统导览 · 组队双人事件
 * 必须按 core → event → scene → quest → retro → town → life → save 顺序加载。
 * ========================================================= */
  /* ==================== 任务清单（手册第四页 + 每日目标） ==================== */
  function badgeCount() {
    const b = F().badges || {};
    return (b.math ? 1 : 0) + (b.chinese ? 1 : 0) + (b.science ? 1 : 0) + (b.english ? 1 : 0);
  }
  // 新生阶段做轻量引导：先报到、再熟悉校园，之后再放开完整任务池。
  function guideStage() {
    const f = F(), C = ADV.Cal;
    if (!f.introDone || !f.metPrincipal) return 'arrival';
    if (!f.gateOpen && !f.finalPassed && C && C.day <= 2 && badgeCount() <= 1) return 'settle';
    return 'full';
  }
  /* ==================== 系统开张导览（体验收束·一） ====================
   * 前 30 分钟只让玩家稳稳体验走路/对话/打卡/睡觉——其余玩法按进度「一天开张一家」，
   * 每天清晨最多广播一条开张提示，避免开局玩法清单式轰炸。旗标 f.tour[key]=day 已播过 */
  const SYSTEM_TOUR = [
    { key: 'greet', name: '打招呼', when: f => f.introDone,
      tip: '👋 开张：按 C 朝同学挥挥手，他们会回应你' },
    { key: 'gift', name: '送礼', when: f => f.metPrincipal,
      tip: '🎁 开张：面向 NPC 按 G 送礼——投其所好，生日当天翻倍（手册好友页记着偏好）' },
    { key: 'mini', name: '课余玩法', when: f => badgeCount() >= 1,
      tip: '🪀 开张：操场的跳房子/弹珠、教室翻花绳……课余玩法赢金币和童年卡' },
    { key: 'fish', name: '河边垂钓', when: f => f.introDone && ADV.Cal.day >= 3,
      tip: '🎣 开张：礼品店买鱼竿，西郊田野挖蚯蚓当饵，河边每日三竿' },
    { key: 'pet', name: '精灵小筑', when: f => ADV.Cal.day >= 4,
      tip: '🐾 开张：小镇主街南段的精灵小筑——阿橘卖宠物球和口粮，草丛里能遇到野生小伙伴' },
    { key: 'farm', name: '后院农场', when: f => ADV.Cal.day >= 5,
      tip: '🌱 开张：自家后院能翻土播种了——浇好水，三天一茬（工具栏按数字键切换）' },
    { key: 'dojou', name: '道场比武', when: f => f.act >= 2,
      tip: '🥊 开张：道场挑战榜可以应战了——赢了有零花钱，还有隐藏高手等你' },
    { key: 'bug', name: '三系擂台', when: f => f.catchTotal >= 1,
      tip: '🪲 开张：河湾石墩三系擂台——带上收服过的小伙伴去比试' },
  ];
  // 清晨调用：最多放播一条「今日开张」。返回播报文案（供测试）
  function systemTour() {
    const f = F();
    for (const s of SYSTEM_TOUR) {
      if (f.tour[s.key]) continue;
      let on = false;
      try { on = s.when(f); } catch (e) { on = false; }
      if (!on) continue;
      f.tour[s.key] = ADV.Cal.day;
      return s.tip;
    }
    return '';
  }
  function sysToured(key) { return !!(F().tour || {})[key]; }
  // 章节态：把主线节点收束成玩家能感知到的阶段名、摘要和场景重心。
  function chapterState() {
    const f = F();
    if (!f.introDone || !f.metPrincipal) {
      return { id: 'ch1_arrival', title: '第一章 · 新生报到', short: '先住进这所学校，再慢慢打开暑假的冒险。', focus: '家 / 小镇 / 校园喷泉', goal: '找到校长，完成报到', phase: 1 };
    }
    if (!f.gateOpen) {
      return { id: 'ch1_badges', title: '第一章 · 四枚徽章', short: '白天上课、放学闲逛、从老师那里拿到第一轮认可。', focus: '教学楼 / 图书馆 / 实验楼 / 外语楼', goal: '集齐四枚智慧徽章', phase: 1 };
    }
    if (!f.finalPassed) {
      return { id: 'ch1_gate', title: '第一章 · 后山石门', short: '校园尽头的奇异入口终于松动，真正的冒险开始抬头。', focus: '后山 / 石门 / 祭坛', goal: '通过守门人的最终试炼', phase: 1 };
    }
    if (!f.letterGot) {
      return { id: 'ch2_letter', title: '第二章 · 月光来信', short: '通关后的校园开始变得陌生又温柔，月亮正把另一扇门慢慢照亮。', focus: '喷泉 / 夜晚校园 / 猫头鹰', goal: '等待并取得月光信笺', phase: 2 };
    }
    if (!f.houseCup) {
      return { id: 'ch2_moon', title: '第二章 · 月光学院', short: '白天还是校园，夜里已经通向另一所古老学院。', focus: '喷泉 / 月光大厅 / 禁书区 / 回廊', goal: '完成四门魔法课与回廊五关', phase: 2 };
    }
    if (!f.e0open) {
      return { id: 'ch3_collect', title: '第三章 · 回忆在发光', short: '真正的终局不在战斗里，而在你一路收下的照片、相册和旧时光里。', focus: '校园角落 / 庭院 / 照片点 / 钟楼', goal: '收集回忆照片与庭院旧相册，开启钟楼', phase: 3 };
    }
    if (!f.shadowWin) {
      return { id: 'ch3_timehall', title: '第三章 · 时光回廊', short: '你开始走进学校更久远的过去，冒险和成长第一次真正合在一起。', focus: '钟楼 / 时光回廊 / 四个时代', goal: '通过时光回廊，击败遗忘之雾', phase: 3 };
    }
    if (!f.ch3Done) {
      return { id: 'ch3_grad', title: '第三章 · 毕业礼前夜', short: '故事已接近尾声，但校园里的每个人都还在等你回头看看。', focus: '毕业礼堂 / 天文台 / 校园回访', goal: '参加毕业礼', phase: 3 };
    }
    if (!f.graduated) {
      return { id: 'epilogue', title: '终章 · 盛夏未完', short: '主线已圆满，校园生活和暑假冒险还在继续发酵。', focus: '四季花园 / 小镇 / 栖霞小区', goal: '自由冒险，补完图鉴与羁绊', phase: 4 };
    }
    return { id: 'after_grad', title: '毕业以后 · 新的学期', short: '你已经见过这所学校最深处的光，现在可以慢慢把剩下的故事过完。', focus: '全地图', goal: '继续自由游玩或开启 NG+', phase: 4 };
  }
  function nextGoal() {
    const f = F();
    if (!f.introDone) return '和妈妈聊聊，然后出发去学校';
    if (!f.metPrincipal) return '找到校长（校园中央广场喷泉边）';
    if (guideStage() === 'settle') {
      if (!(ADV.Cal && ADV.Cal.checkedIn)) return '先熟悉校园，找一位老师聊聊，放学前记得去校务板打卡';
      return '和同学们多聊聊，慢慢认熟这所学校';
    }
    // 石门一旦开启，徽章变为「每日挑战」玩法，不再作为主线目标
    if (f.gateOpen || f.finalPassed) {
      if (!f.gateOpen) return '调查后山石门（最东侧）';
      if (!f.finalPassed) return '通过守门人的最终试炼';
      if (!f.letterGot) return '等待月圆之夜的猫头鹰来信';
      if (!f.houseCup) return '月光学院：四门魔法课 + 回廊五关';
      if (!f.e0open) return `收集回忆照片(≥10，现${ADV.Collect ? ADV.Collect.catCount('photos') : 0})与庭院旧相册(5)，开启钟楼`;
      if (!f.shadowWin) return '回廊深处：击败遗忘之雾';
      if (!f.ch3Done) return '参加毕业礼';
      return '自由冒险：图鉴·埋宝·友谊·四季花园';
    }
    const n = badgeCount();
    if (n < 4) return `收集智慧徽章（${n}/4）：${f.badges.math ? '' : '数学 '}${f.badges.chinese ? '' : '语文 '}${f.badges.science ? '' : '科学 '}${f.badges.english ? '' : '英语'}`;
    return '调查后山石门（最东侧）';
  }
  /* —— 章节中点过场（改进方案 A4）：每章 50% 处一个 30 秒的转折，一次性旗标 —— */
  async function chapterMid(n) {
    const f = F(), key = 'midCh' + n;
    if (f[key]) return;
    if (n === 1) {
      const b = f.badges, cnt = (b.math ? 1 : 0) + (b.chinese ? 1 : 0) + (b.science ? 1 : 0) + (b.english ? 1 : 0);
      if (cnt < 2) return;
      f[key] = true; save();
      ADV.Audio.sfx('item');
      await say({ text: '傍晚，一只雪白的鸟影掠过操场——\n落在你的肩头，轻轻啄了啄你的耳朵。' });
      await say({ text: '它朝后山的方向偏了偏头。\n（石门方向，隐约传来一下心跳般的闷响）' });
      UI().toast(' 【第一章 · 中章】门后有心跳的声音…… ');
    } else if (n === 2) {
      if ([f.cFlight, f.cPotion, f.cCharm, f.cAstro].filter(Boolean).length < 2) return;
      f[key] = true; save();
      ADV.Audio.sfx('item');
      await say({ text: '夜里的图书馆灯闪了一下——\n一个白发的女孩坐在窗台上，脚边悬着一封信。' });
      await say({ name: '星儿', text: '「感觉到了吗？影子在长夜里变浓了。\n别怕——你修的每一门课，都是攒下的光。」' });
      UI().toast(' 【第二章 · 中章】影子在长夜里变浓了…… ');
    } else if (n === 3) {
      if (!f.e2) return;
      f[key] = true; save();
      ADV.Audio.sfx('item');
      await say({ text: '回廊的镜面一闪——\n镜子里的你身后，多了一道淡淡的人影。' });
      await say({ text: '（耳边响起灰先生的话：\n「替我，把名字还给它。」）' });
      UI().toast(' 【第三章 · 中章】镜子里的影子多了一个…… ');
    }
  }
  function questList() {
    const f = F(), chapter = chapterState(), out = ['【章节】' + chapter.title, '【主线】' + nextGoal()];
    const add = (cond, s) => { if (cond) out.push(s); };
    const stage = guideStage();
    if (stage === 'arrival') {
      add(true, '🌤 章节气氛：这是你的入学日，先记住从家到学校的路');
      add(true, '🏠 和妈妈聊聊，带着便当出门');
      add(true, '🧭 穿过小镇向东走，去学校找校长报到');
      add(true, '📖 F 打开手册，目标都会记在里面');
      return out;
    }
    if (stage === 'settle') {
      add(true, '🪴 章节气氛：先把学校过熟，再把奇遇和挑战慢慢打开');
      add(true, '👋 和 3 位同学打个招呼，先认认人');
      add(true, '🏫 去北边几栋教学楼逛逛，熟悉校园布局');
      add(!(ADV.Cal && ADV.Cal.checkedIn), '📝 放学前记得去校务板打卡，晚上才能安心睡觉');
      add(badgeCount() === 0, '🎓 先挑一位老师聊聊，试试第一枚智慧徽章');
      add(f.heardHairpin && !f.hairpinReturned, '🎀 小红丢了发卡（先找小胖聊聊）');
      add(f.heardComic && !f.comicReturned, '📚 小明的漫画书落在教室课桌');
      return out;
    }
    if (chapter.id === 'ch1_badges') {
      add(true, '🎓 章节推进：白天去老师那里挑战，放学后再把校园和同学串起来');
      add(badgeCount() < 2, '🧭 推荐先拿 1-2 枚徽章，把校园几栋楼走熟');
    }
    if (chapter.id === 'ch1_gate') {
      add(true, '🌲 章节推进：石门已开，校园的重心开始从日常转向后山');
      add(true, '🗺 出发前可以在校园和小镇再补一点准备与关系');
    }
    if (chapter.id === 'ch2_letter') {
      add(true, '🌙 章节推进：留意夜色、喷泉和那只雪白的猫头鹰');
      add(true, '📸 主线暂缓时，适合继续补图鉴、友谊和支线');
    }
    if (chapter.id === 'ch2_moon') {
      add(true, '✨ 章节推进：白天是校园，夜里是学院；两种生活会在这章交织');
      add(!f.house, '🎩 先去月光大厅完成分院');
      add(f.house && !f.classesDone, '📚 四门魔法课都完成后，禁书区暗门会打开');
      add(f.classesDone && !f.shadowDown, '🕯 顺着禁书区线索往地下走，回廊五关在等你');
    }
    if (chapter.id === 'ch3_collect') {
      add(true, '📷 章节推进：现在的任务不是赢，而是把一路上的回忆收回来');
      add((ADV.Collect ? ADV.Collect.catCount('photos') : 0) < 10, `📸 回忆照片 ${(ADV.Collect ? ADV.Collect.catCount('photos') : 0)}/10`);
      add((f.yalbum || 0) < 5, `🖼 庭院旧相册 ${f.yalbum || 0}/5`);
    }
    if (chapter.id === 'ch3_timehall') {
      add(true, '🕰 章节推进：每过一个时代，校园都会更像一所真正有历史的学校');
      add(!f.e1, '1️⃣ 时代一：第一间教室');
      add(f.e1 && !f.e2, '2️⃣ 时代二：少年校长的道歉信');
      add(f.e2 && !f.e3, '3️⃣ 时代三：图书馆的暗号');
      add(f.e3 && !f.e4, '4️⃣ 时代四：爸爸的纸条');
      add(f.e1 && f.e2 && f.e3 && f.e4 && !f.shadowWin, '🌫 回廊尽头：面对遗忘之雾');
    }
    if (chapter.id === 'ch3_grad') {
      add(true, '🎓 章节推进：先回校园走一圈，再去迎接毕业礼');
      add(true, '💌 适合补毕业赠言、照片和未说完的话');
    }
    if (chapter.phase >= 4) {
      add(true, '🌻 终章状态：主线完成，适合专心补图鉴、友谊、社团、武林与四季花园');
    }
    add(f.heardHairpin && !f.hairpinReturned, '🎀 小红丢了发卡（先找小胖聊聊）');
    add(f.heardComic && !f.comicReturned, '📚 小明的漫画书落在教室课桌');
    add(f.mapPieces > 0 && !f.caveOpen, `🗺 宝藏图碎片 ${f.mapPieces}/3`);
    add(f.caveOpen && !f.chests.chestC, '🗝 藏宝洞窟：三只宝箱');
    add(f.act >= 2 && !f.wuyunB3, '🥊 道场：乌云帮三连战');
    add(f.wuyunB3 && !f.wuyunGang, '🤝 感化乌云帮（大壮/小影/乌云）');
    add(f.wuyunGang && Object.keys(f.dig || {}).length < 8, `🏺 埋宝 ${Object.keys(f.dig || {}).length}/8（铲子+残页）`);
    add(f.act >= 3 && !f.sportsDone, '🏃 校务板：运动会三连');
    add(f.act >= 4 && !f.midterm, '📝 校务板：期中大考（S 级有惊喜）');
    add(f.photoStreetQuest && !f.photoStreetDone, `📷 照相馆：街区风景 ${ownedCount('scenes', STREET_SCENES)}/3`);
    add(f.photoStreetDone && !f.photoRuralDone, `🌾 照相馆：郊外风景 ${ownedCount('scenes', RURAL_SCENES)}/2`);
    add(f.tailorQuest && !f.tailorDone, '🧵 裁缝阿姨：花束 + 幸运发绳');
    add((f.clockWins || 0) < 3, `⏰ 钟表铺：报时练习 ${f.clockWins || 0}/3`);
    add(f.marketCharmDay === ADV.Cal.day && f.marketCharmUsed !== ADV.Cal.day, '💈 今日理发加成还没用：去跳蚤市场卖一件东西');
    add(!f.comicCornerDone, '📚 老街漫画角：给小明留一本到手的漫画');
    add(!f.snackNestDone, '🌶 老街零食窝：给小胖留点辣条或面包');
    add(!f.runSlopeDone, '🏃 晨跑坡：给小红留一瓶运动饮料');
    add(!f.momoCornerDone, '🧪 墨角：放一杯咖啡或一束花');
    add(!f.oldHouseDone, '🏚 旧宅：想办法找个齿轮修好窗上的机关');
    // 图鉴进度只在完整阶段列出——新生阶段手册只给当下该做的事（体验收束·一）
    if (guideStage() === 'full' && ADV.Collect) ADV.Collect.CATS.forEach(([cat, label, icon]) => {
      const n = ADV.Collect.catCount(cat), t = ADV.Collect.totalOf(cat);
      if (n < t) out.push(`${icon} ${label}图鉴 ${n}/${t}`);
    });
    // —— P-B / 三期 / s5-s8 新内容 discoverability ——
    const g4 = chapter.phase >= 4;
    add(g4 && !f.dawnAltar && Object.keys(f.spirits || {}).length >= 2, '🌟 四季花园正中的古老祭坛，似乎在等四位守护灵都苏醒');
    add(g4 && Object.keys(f.spirits || {}).length >= 4 && !f.dawnAltar, '🌟 四灵已醒——去花园深处的晨曦祭坛看看');
    add(f.catchTotal >= 1 && !f.bugKing, '🏆 河湾擂台：逢 9 的日子（第9/19/29天…）有斗虫大会');
    add(f.tame && f.tame.chart && !f.buddyBoost, '🏔 后山东北角有间石屋，门缝里飘出草药味……');
    add(f.rushBest >= 3 || f.senseiWin, '⚔ 挑战榜：极限连战开放——看你能连过几关');
    add(f.cow || f.sheep, '🐄 后院牲口：别忘了一天一次的挤奶/剪毛');
    add(f.helpPts === 0, '📋 小镇帮助板：居民们的委托每日更新，帮帮忙吧');
    return out;
  }

  /* ==================== 交互深化：组队 / 双人事件 ==================== */
  S._hangout = async (npc) => {
    const f = F(), C = ADV.Cal;
    const fr = friend(npc.id);
    if (f.party === npc.id) {
      const g = await choose(['道别', '继续同行'], { caption: { name: npc.name, text: '（要在这里分开吗？）' } });
      if (g === 0) { npc.followT = 0; f.party = ''; ADV.Audio.sfx('cancel'); UI().toast(` 与${npc.name}道别 `); }
      return;
    }
    if (f.party) { await say({ name: npc.name, text: '（你已经有同伴啦——先去道别吧）' }); return; }
    if (!(C.period === 3 || C.period === 4)) { await say({ name: npc.name, text: '（放学或傍晚才能约同学一起走走哦）' }); return; }
    if (fr.stage < 1 && fr.love < 10) { await say({ name: npc.name, text: '（还不太熟……先多聊聊吧）' }); return; }
    const g = await choose(['放学了，一起走走？', '没事'], { caption: { name: npc.name, text: '（TA 看起来正有空）' } });
    if (g === 1) return;
    f.party = npc.id;
    npc.followT = 99999;
    npc.pose = null; npc.goal = null;
    E().playAction(npc, 'laugh', 1.2);
    ADV.Audio.sfx('emote');
    UI().toast(` 🤝 ${npc.name}加入了同行！（地图上有 ♥ 的地方有双人事件）`);
    save();
  };

  const HANG_NPC = { hong: 'xiaohong', ming: 'xiaoming', pang: 'xiaopang', gang: 'xiaogang', ying: 'xiaoying', star: null };
  S.hangSpot = async (o) => {
    const f = F();
    if (!f.party) { await say({ text: '（这里适合和朋友一起来……\n放学后按 H 邀请同学同行）' }); return; }
    const need = HANG_NPC[o.h];
    const mate = E().getNpc(f.party);
    const mateName = (ADV.Game.BOND[f.party] || {}).name || '同伴';
    if (need && f.party !== need) {
      const nm = (ADV.Game.BOND[need] || {}).name;
      await say({ text: `（这里是最适合和${nm}来的地方……）` });
      return;
    }
    if (f.hang[o.h]) { await say({ text: '（你们相视一笑——这里的回忆已经很多了）' }); return; }
    f.hang[o.h] = true;
    gainBond(f.party, 12);
    switch (o.h) {
      case 'hong': {
        await say({ text: '夕阳把跑道染成蜜色。\n小红活动了一下脚踝：「敢不敢比一圈？」' });
        const w = await new Promise(res => ADV.Mini.start('broom', res));
        await say({ text: w ? '你险胜半步！她扶着膝盖大笑。\n「下次……我肯定赢回来。」' : '她赢了，笑得像拿到了金牌。\n「跑步的秘密——妈妈教的。」' });
        if (friend('xiaohong').love < 40) gainBond('xiaohong', 4);
        break;
      }
      case 'ming': {
        await say({ text: '书店门口，小明盯着橱窗里的画册出神。' });
        await say({ name: '小明', text: '「总有一天，我的书也会摆在那儿。」\n他掏出速写本——主角果然是你。' });
        gainBond('xiaoming', 4);
        break;
      }
      case 'pang': {
        await say({ text: '小吃摊前，小胖深吸一口气：\n「三连试吃！猜中阿姨的招牌，我请客！」' });
        for (let i = 0; i < 3; i++) {
          const c = await choose(['糖醋排骨', '芝麻面包', '红烧肉'], { caption: { name: '试吃 ' + (i + 1) + '/3', text: '咬一口——这道是招牌！' } });
          await say({ text: c === 1 ? '对啦！酥得掉渣！' : '小胖摇头：「差一点～」' });
        }
        gainBond('xiaopang', 4);
        break;
      }
      case 'gang': {
        await say({ text: '天台的风很轻。\n小刚忽然从书包里拿出一把折叠小提琴。' });
        await say({ name: '小刚', text: '「……只拉给你一个人听。」\n琴声有点抖，但很干净。' });
        if (!ADV.Collect.has('quotes', 'q10')) ADV.Collect.gain('quotes', 'q10');
        gainBond('xiaogang', 4);
        break;
      }
      case 'ying': {
        await say({ text: '池塘边，小影翻开画册的最后一页。' });
        await say({ name: '小影', text: '「留白的部分……画你，还是画水？」\n（不管选哪个，她都会画得很好）' });
        gainBond('xiaoying', 4);
        break;
      }
      case 'star': {
        if (!ADV.Cal.isNight()) { f.hang[o.h] = false; gainBond(f.party, -0); await say({ text: '（星空要等夜晚——傍晚后再来）' }); return; }
        await say({ text: '目镜里，星星密得像撒了一把糖。\n两个人轮流看，谁也不说话。' });
        await say({ name: mateName, text: '「……真好看。」' });
        gainBond(f.party, 6);
        break;
      }
    }
    if (mate) E().playAction(mate, 'laugh', 1.6);
    save();
  };

  /* ---------- 三条双人社线 ---------- */
  S.sakuraTree = async () => {
    const f = F();
    if (f.mingComic) { await say({ text: '樱花树沙沙作响。\n树洞里放着小明画的新封面——\n跑道上的小红，正冲向终点。' }); return; }
    if (friend('xiaoming').stage < 1 || friend('xiaohong').stage < 1) {
      await say({ text: '老樱花树亭亭如盖。\n（等和小明、小红都更熟一点，\n这里似乎会有故事发生……）' });
      return;
    }
    f.mingComic = true;
    await say({ text: '樱花树下，小明拦住了路过的\n小红：「教教我跑步的画法吧！」' });
    await say({ name: '小红', text: '「跑步啊——肩膀要放松，\n眼睛看着最远处。」' });
    await say({ text: '小明飞快地画着。\n花瓣落在速写本上，他没有拂开。\n《漫画与跑道》，开始了。' });
    gainBond('xiaoming', 8); gainBond('xiaohong', 8);
    addCup(4);
    save();
  };
  S.gangDuel = async () => {   // 由小刚好感≥2后的对话提示触发（道场挑战榜特殊场）
    const f = F();
    if (f.gangDuel) return;
    f.gangDuel = true;
    await say({ text: '道场来了位不速之客——金鹏。\n「乌云帮的三连战我也看了。\n和我打一场，文武各半！」' });
    const w1 = await new Promise(res => ADV.Battle.start('jinpeng', { }, res)).catch(() => true);
    await say({ text: '武试结束（不论胜负，金鹏都皱着眉认了）。\n「文试——三题，敢吗？」' });
    for (const s of ['chinese', 'math', 'english']) await examAsk('金鹏的文试', s, 'normal');
    await say({ name: '金鹏', text: '……可恶。全都，是我输。\n「朋友」这个词，我记下了。' });
    gainBond('jinpeng', 15);
    addCup(6);
    save();
  };
  S.yingFix = async () => {    // 墨墨处触发（好感≥1）
    const f = F();
    if (f.yingFix) return;
    if (friend('momo').stage < 1 || friend('xiaoying').stage < 1) { await say({ text: '（等墨墨和小影都熟一点……）' }); return; }
    f.yingFix = true;
    await say({ text: '小影的旧画褪色得厉害。\n墨墨推了推眼镜：「显影药水，交给我。」' });
    const i = await choose(['先加月光粉', '先加晨露', '直接搅拌'], { cancelIndex: -1, caption: { name: '墨墨', text: '「褪色的画，第一步应该——」' } });
    await say({ text: i === 1 ? '药水泛起微光——成功！' : '墨墨及时扶住了你的手：\n「第一步，是晨露哦。」（重来了，但成功了）' });
    await say({ text: '旧画缓缓显影——\n画角落浮现一行以前看不见的小字：\n「谢谢一直看我画的人。」' });
    gainBond('momo', 10); gainBond('xiaoying', 10);
    addCup(4);
    save();
  };

  /* ---------- 办公室：请教 + 每日挑战题 ---------- */
  const TUTOR_AT = { tutorMath: ['王老师', [1, 2], 'math'], tutorCn: ['李老师', [2, 3], 'chinese'], tutorSci: ['陈老师', [3, 4], 'science'], tutorEn: ['吴老师', [0, 1], 'english'] };
  function makeTutor(key) {
    return async () => {
      const [name, periods, subject] = TUTOR_AT[key];
      if (!TUTOR_AT[key][1].includes(ADV.Cal.period)) {
        await say({ name, text: `（${name}不在——\nTA的办公时段：${periods.map(p => ADV.Cal.PERIODS[p]).join('、')}）` });
        return;
      }
      const f = F();
      f.tutor = f.tutor || {};
      if (f.tutor[subject]) { await say({ name, text: '「今天已经指点过你啦——\n下次考试稳住！」' }); return; }
      f.tutor[subject] = true;
      E2tutor(name);
      await say({ name, text: '「来，坐——这道题的关键是……」\n（下次该科考试题目难度下降！）' });
      save();
    };
  }
  function E2tutor(name) { ADV.Audio.sfx('save'); UI().toast(` 📖 ${name}的课后指点：对应科目考试变简单 `); }
  S.tutorMath = makeTutor('tutorMath');
  S.tutorCn = makeTutor('tutorCn');
  S.tutorSci = makeTutor('tutorSci');
  S.tutorEn = makeTutor('tutorEn');
  S.officeChallenge = async () => {
    const f = F();
    if (f.challengeDay === ADV.Cal.day) { await say({ text: '（今日挑战题已完成，明天刷新）' }); return; }
    const subs = ['math', 'chinese', 'science', 'english'];
    const sub = subs[ADV.Cal.day % 4];
    await say({ text: '黑板上的每日挑战题——\n答对有奖！' });
    const ok2 = await examAsk('课外挑战', sub, 'normal');
    f.challengeDay = ADV.Cal.day;
    if (ok2) { f.gold = (f.gold || 0) + 12; addCup(1); await say({ text: '答对啦！💰 +12' }); }
    save();
  };
  // 请教影响出题难度：已并入 examOnce 的 hadTutor 用后即焚逻辑（game-town.js）

  /* ---------- 种植 ---------- */
  S.pot = async (o) => {
    const f = F(), C = ADV.Cal;
    const pot = f.plant[o.pot];
    if (!pot) {
      const seeds = ['flowerSeed', 'moonSeed', 'seasonSeed'].filter(s => ADV.Collect.count(s) > 0);
      if (!seeds.length) { await say({ text: '（空花盆。需要种子——\n礼品店有花种子，陈老师那里可能有稀有的）' }); return; }
      const i = await choose(seeds.map(s => ADV.Collect.itemInfo(s).name).concat(['先不种']), { caption: { text: '种点什么？' } });
      if (i >= seeds.length) return;
      ADV.Collect.useItem(seeds[i]);
      f.plant[o.pot] = { seed: seeds[i], day: C.day, water: 0, last: 0 };
      await say({ text: '你把种子埋进土里，浇了第一瓢水。🌱' });
      save();
      return;
    }
    if (pot.last === C.day) { await say({ text: '（今天浇过水了——嫩芽精神得很）' }); return; }
    if (C.day - pot.day >= 3 && pot.water >= 2) {
      // 收获
      if (pot.seed === 'moonSeed') {
        ADV.Collect.addItem('moonGrass', 1);
        await say({ text: '月光草在夜里泛着银光——成熟了！' });
        await ADV.UI.itemGet('月光草（战斗回复）', '#b98af5');
      } else if (pot.seed === 'seasonSeed') {
        ADV.Collect.addItem('seasonFlower', 1);
        await say({ text: '花开的一瞬，花瓣从翠绿流到金黄，\n又凝成此刻季节的颜色——四时花开了！' });
        await ADV.UI.itemGet('四时花（随季节变色）', '#8af0e8');
      } else {
        ADV.Collect.addItem('flower', 2);
        await say({ text: '花开了！摘下两束。💐×2' });
      }
      f.plant[o.pot] = null;
      save();
      return;
    }
    pot.water += 1;
    pot.last = C.day;
    const boost = F().badges.science ? '（陈老师教过施肥窍门，长势喜人）' : '';
    await say({ text: `浇水 ✓（${pot.water}/2）${boost}\n（种下第 ${C.day - pot.day + 1} 天，3 天后收获）` });
    if ((F().badges.science || F().club === '科学社') && Math.random() < .5) { pot.water += 1; UI().toast(' 🌱 科学加成：多喝了一口水 '); }
    save();
  };

  /* ---------- 动物伙伴 ---------- */
  S.bird = async () => {
    const f = F();
    if (f.birdDay === ADV.Cal.day) { await say({ text: '（小鸟今天吃过了，\n正在窗台打瞌睡）' }); return; }
    if (!ADV.Collect.count('bread')) { await say({ text: '（窗台的小鸟歪着头。\n撒点面包屑吧——需要面包）' }); return; }
    ADV.Collect.useItem('bread');
    f.birdDay = ADV.Cal.day;
    await say({ text: '你撒了一把面包屑。\n明天清晨，小鸟会用歌声叫你起床。' });
    save();
  };
  S.catch = async () => {
    const f = F(), CO = ADV.Collect;
    if (f.catchDay === ADV.Cal.day) { await say({ text: '（这里的虫子今天警觉得很）' }); return; }
    f.catchDay = ADV.Cal.day;
    const nt = CO.netTier();                              // -1 徒手 / 0 捉虫网 / 1 好网 / 2 金网
    const hit = [.4, .7, .85, 1][nt + 1];                 // 网越高级越稳
    const r = Math.random();
    if (r < hit) {
      const pool = CO.DB.insects.filter(x => !CO.has('insects', x.id) && CO.whenOk(x.id));
      if (pool.length) {
        const it = pool[(Math.random() * pool.length) | 0];
        const shiny = CO.rollShiny(CO.shinyMult());
        CO.gainCritter(it.id, shiny);
        f.catchTotal = (f.catchTotal || 0) + 1;       // 成就「捕虫高手」累计（池塘网捞）
        await say({ text: `你屏住呼吸，慢慢靠近——\n${it.name}，入手！${shiny ? '\n✨ 居然是金色异色个体！' : ''}` });
      } else await say({ text: '（虫子们今天都躲起来了……\n换个时段/天气再来看看）' });
    } else if (r < .7) {
      if (ADV.Cal.weather === '小雨' || ADV.Cal.weather === '暴雨') {
        await say({ text: '雨里的池塘开音乐会——\n青蛙合唱团，呱呱呱！' });
      } else await say({ text: '一只青蛙扑通跳进水里，\n涟漪一圈一圈。' });
    } else await say({ text: '只有水草轻轻摇晃。' });
    logEvent('在池塘边蹲着看虫子');
    save();
  };

  /* —— 虫鸣点：对嗡嗡作响的草丛挥网（需要捉虫网；虫按季节/时段/天气出没） —— */
  S.buzzPoint = async (o) => {
    const f = F(), C = ADV.Cal, CO = ADV.Collect;
    if ((f.buzzCaught || {})[o.bid] === C.day) { await say({ text: '（草丛静悄悄的——\n虫子们今天被你捉怕了）' }); return; }
    const nt = CO.netTier();                              // -1 无网 / 0 捉虫网 / 1 好网 / 2 金网
    if (nt < 0) {
      await say({ text: '草丛里嗡嗡作响，\n虫影一闪就没了踪迹。\n（要是有捉虫网就好了……\n礼品店有卖）' });
      return;
    }
    const go = await choose(['挥网！（精力 -1）', '先观察一下'], { caption: { text: '草丛嗡嗡震颤，\n好几只虫影在其中起落。' } });
    if (go !== 0) return;
    C.costEnergy(1);
    f.buzzCaught = f.buzzCaught || {};
    f.buzzCaught[o.bid] = C.day;                          // 今日此点已捕（草丛变安静）
    ADV.Audio.sfx('water');                               // 挥网的"唰"声
    const pool = CO.DB.insects.filter(x => CO.whenOk(x.id));
    if (Math.random() < [.75, .9, 1][nt] && pool.length) {  // 网档命中：75% / 90% / 必中，优先收未图鉴的虫
      const unfound = pool.filter(x => !CO.has('insects', x.id));
      const src = unfound.length ? unfound : pool;
      const it = src[(Math.random() * src.length) | 0];
      const shiny = CO.rollShiny(CO.shinyMult());
      CO.gainCritter(it.id, shiny);
      f.catchTotal = (f.catchTotal || 0) + 1;         // 成就「捕虫高手」累计（草丛挥网）
      await say({ text: `你瞅准时机一挥网——\n「${it.name}」落进网兜！${shiny ? '\n✨ 竟是一道金色流光！' : ''}` });
      logEvent(`用捉虫网捕到了${it.name}${shiny ? '（金色异色！）' : ''}`);
      if (!f.tutCatch) { f.tutCatch = true; UI().toast(' 📖 已收录图鉴！按 F 打开手册 → 收藏页查看 '); }
    } else {
      await say({ text: '网兜扫过草尖——\n只兜住一缕风。\n（虫子受惊四散，明天再来吧）' });
    }
    save();
  };

  /* —— 生物窝点：宝可梦式捕捉（遭遇预览警觉 → 投喂正确诱饵削弱 → 网/笼捕捉 → 失败当日冷却）
   *   虫系用捉虫网，水/走兽用草编笼；捕捉 5% 概率金色异色个体 */
  /* —— 传说三只登场演出（rar 3：月光凤蝶 / 锦鲤苗 / 山神小狐狸） —— */
  const LEGEND_SHOW = {
    i18: { appear: '河风忽然停了——旧宅外墙上，\n一弯会飞的「月牙」缓缓张开翅膀。\n（传说中的生物现身了……）',
           catch: '月光顺着蝶翼淌下来，整条旧巷像落进了银河。\n你屏住呼吸，把它请进网中——\n虫系传说「月光凤蝶」，落笔了！' },
    c12: { appear: '老桥下的深水忽然一亮——\n一截红白相间的「霞」从桥影里游了出来。\n（传说中的生物现身了……）',
           catch: '锦鲤苗绕着你的指尖转了三圈，才恋恋不舍地游进笼中——\n雨点敲着桥面，像在替水系传说盖下印章。' },
    m12: { appear: '夜风里飘来一缕草木香——\n山径尽头，尾巴尖挑着一粒月光的小狐狸回头望你。\n（传说中的生物现身了……心跳如鼓）',
           catch: '它把尾巴上那粒月光轻轻碰了碰你的手心，\n才慢吞吞走进笼子里——山神收下了你这个朋友。' },
  };
  S.critterSpot = async (o) => {
    const f = F(), C = ADV.Cal, CO = ADV.Collect;
    if ((f.critterDay || {})[o.pid] === C.day) { await say({ text: '（这里的动静已经平息，\n小家伙们今天不敢再露面了）' }); return; }
    // 出没池：本图出没 + 时段/季节/天气吻合 + 传说图鉴进度达标 + 尚未登记
    const pool = CO.critterList().filter(c => c.where === o.map && CO.whenOk(c.id) && CO.needOk(c) && !CO.has('critters', c.id));
    if (!pool.length) {
      const anyHere = CO.critterList().some(c => c.where === o.map);
      await say({ text: anyHere ? '（这片地方的小家伙\n都已经住进你的图鉴啦）' : '（风吹草动，却一片安静。\n换个别的时间或天气再来吧）' });
      return;
    }
    const cr = pool[(Math.random() * pool.length) | 0];
    if (LEGEND_SHOW[cr.id]) await say({ text: LEGEND_SHOW[cr.id].appear });   // 传说登场演出
    // 工具链：虫系用网（捉虫网→好网→金网），水/走兽用笼（草编笼→大笼→彩笼），取持有最高档
    const chain = cr.fam === '虫' ? ['bugNet', 'fineNet', 'goldNet'] : ['basket', 'bigCage', 'colorCage'];
    const tier = chain.reduce((t, id, i) => CO.count(id) > 0 ? i : t, -1);
    if (tier < 0) {
      await say({ text: cr.fam === '虫' ? '叶影一闪，像有小翅膀掠过。\n（虫系生物要捉虫网才网得住——\n礼品店有卖）'
                              : `灌木窸窣作响，一双眼睛正望着你。\n（${cr.fam}系生物要草编笼才捉得住——\n礼品店有卖）` });
      return;
    }
    const toolName = CO.itemInfo(chain[tier]).name;
    let wary = cr.rar + 1;                          // 警觉度：稀有越高越难近身（投喂 -1）
    let fed = 0;
    const baitNames = () => cr.bait.map(b => (CO.itemInfo(b) || {}).name).join('、');
    while (true) {
      const face = wary >= 3 ? '它竖着耳朵，随时要逃' : wary === 2 ? '它盯着你，尾巴绷得笔直' : wary === 1 ? '它好奇地朝你挪近了些' : '它彻底放松了，在你脚边打转';
      const act = await choose(['出工具！（精力 -1）', '投喂诱饵', '仔细观察', '悄悄退开'],
        { caption: { name: `野生的${cr.name}`, text: `${cr.desc}\n警觉：${'！'.repeat(wary) || '——'}（${face}）` } });
      if (act === 3 || act === -1) return;
      if (act === 2) {
        await say({ text: `${cr.hint}\n（${cr.fam}系 · 稀有${'★'.repeat(cr.rar)} · 力${cr.pow} 速${cr.spd} 体${cr.hp}）\n（偏爱的诱饵：${baitNames()}）` });
        continue;
      }
      if (act === 1) {
        const have = cr.bait.filter(b => CO.count(b) > 0);
        if (!have.length) { await say({ text: `（翻遍口袋也没有它爱吃的——\n它喜欢：${baitNames()}）` }); continue; }
        const bi = await choose(have.map(b => `${CO.itemInfo(b).name}（有 ${CO.count(b)} 个）`), { caption: { text: '轻轻抛过去，别吓着它……' } });
        if (bi === -1) continue;
        CO.useItem(have[bi]);
        fed++; wary = Math.max(0, wary - 1);
        await say({ text: wary === 0 ? '它嗅了嗅，一口接住！\n耳朵耷下来，彻底放松了。' : '它警惕地叼走食物——\n但明显没那么紧张了。' });
        continue;
      }
      // act === 0：出手捕捉
      if (C.energy < 1) { await say({ text: '（累得抬不起手……\n先歇歇再来吧）' }); return; }
      C.costEnergy(1);
      f.critterDay = f.critterDay || {};
      f.critterDay[o.pid] = C.day;                    // 无论成败，今日此窝点冷却
      const rate = Math.min(.9, ({ 1: .55, 2: .4, 3: .3 })[cr.rar] + fed * .15 + tier * .10);  // 高档工具捕捉率 +10%/+20%
      ADV.Audio.sfx('water');                         // 收网/合笼的"唰"声
      if (Math.random() < rate) {
        const shiny = CO.rollShiny(CO.shinyMult());   // 5% 基础 · 高档工具最高 ×3 金色异色个体
        CO.gainCritter(cr.id, shiny);
        f.catchTotal = (f.catchTotal || 0) + 1;       // 成就「捕虫高手」累计（窝点笼捕）
        const lg = LEGEND_SHOW[cr.id];
        await say({ text: lg ? lg.catch
                        : shiny ? `一道金光闪过——${cr.name}\n居然是传说中的金色异色个体！\n轻手轻脚收进${toolName}，心脏咚咚跳！`
                                : `瞅准它低头的瞬间出手——\n${cr.name}稳稳收进${toolName}！` });
        logEvent(`捕捉到了${cr.name}${shiny ? '（金色异色！）' : ''}`);
        if (!f.tutCatch) { f.tutCatch = true; ADV.UI.toast(' 📖 已收录图鉴！按 F 打开手册 → 收藏页查看 '); }
        // 邀请随行：身边还没有伙伴时可以结伴
        if (!f.buddy) {
          const inv = await choose([`让${cr.name}跟着你走`, '放它回草丛深处'],
            { caption: { name: `野生的${cr.name}`, text: shiny ? '金色的绒毛在光里一闪一闪——\n它好像对你很感兴趣！'
                                                                : '它从指缝里探出小脑袋望着你——\n要和这个小家伙结伴同行吗？' } });
          if (inv === 0) {
            f.buddy = { id: cr.id, shiny: shiny ? 1 : 0 };
            ADV.Engine.spawnBuddy();
            ADV.UI.toast(` ${cr.name} 成了你的随行伙伴！按 Z 可以和它互动 `);
            logEvent(`${cr.name} 成了随行伙伴`);
          }
        } else {
          await say({ text: `（身边已经有随行伙伴啦。\n${cr.name}挥挥小爪子，自己往草丛深处跑去）` });
        }
      } else {
        await say({ text: '它猛地弹开，一溜烟不见了。\n（惊动了窝点，明天再来碰碰运气）' });
        logEvent(`想捕捉${cr.name}，但它逃走了`);
      }
      save();
      return;
    }
  };

  /* —— 随行伙伴互动（Z 键面对小伙伴）：摸头 / 喂食 / 悄悄话 / 道别 —— */
  S._buddy = async (ent) => {
    const f = F(), C = ADV.Cal, CO = ADV.Collect;
    while (true) {
      const cr = CO.critter(f.buddy.id);
      if (!cr) { f.buddy = null; return; }
      const bond = f.buddyBond || 0;
      const stage = bond >= 60 ? 3 : bond >= 30 ? 2 : bond >= 1 ? 1 : 0;
      const a = await choose(['摸摸头', '喂点吃的', '说说悄悄话', '道别（解除随行）', '就这样吧'], {
        cancelIndex: 4,                                     // X/ESC = 就这样吧，随时收起选项
        caption: { name: cr.name,
                   text: stage === 3 ? '它把下巴搁在你的鞋面上，\n尾巴摇成了小风扇。\n（亲密度加护全开：战中每回合回体力 · 濒死稳住一次）'
                       : stage === 2 ? '它绕着你的脚踝转圈，\n时不时抬头看你一眼。\n（亲密度加护：战中每回合回 1 体力）'
                       : stage === 1 ? '它蹲坐在你脚边，\n耳朵朝你的方向偏着。'
                       : `它安安静静待在你的影子里。\n亲密度 ${bond}/100` } });
      if (a === 4 || a === -1) return;
      if (a === 0) {                                      // 摸摸头：每日一次 +3
        if (f.buddyPetDay === C.day) { await say({ name: cr.name, text: '（它舒服地眯起眼睛，往旁边挪了半步——\n今天已经摸过头啦）' }); continue; }
        f.buddyPetDay = C.day;
        f.buddyBond = Math.min(100, bond + 3);
        ent.balloon = '♥'; ent.balloonT = 0;
        ADV.Audio.sfx('emote');
        await say({ name: cr.name, text: `你轻轻挠了挠它的下巴——\n它眯起眼睛，喉咙里发出呼噜呼噜的声音。\n（亲密度 +3，现在是 ${f.buddyBond}/100）` });
        continue;
      }
      if (a === 1) {                                      // 喂吃的：小零食 +2
        const gifts = CO.giftables();
        if (!gifts.length) { await say({ name: cr.name, text: '（口袋里没有它能吃的东西……\n面包、果子、小零食都行）' }); continue; }
        const gi = await choose(gifts.map(x => `${x.name}（有 ${x.n} 个）`).concat(['不喂了']), { cancelIndex: gifts.length, caption: { name: cr.name, text: '它的小鼻子先一步凑了过来……' } });
        if (gi < 0 || gi >= gifts.length) continue;
        CO.useItem(gifts[gi].id);
        f.buddyBond = Math.min(100, (f.buddyBond || 0) + 2);
        ent.balloon = '♪'; ent.balloonT = 0;
        ADV.Audio.sfx('emote');
        await say({ name: cr.name, text: `它捧着${gifts[gi].name}小口小口吃起来，\n腮帮子鼓鼓的。\n（亲密度 +2，现在是 ${f.buddyBond}/100）` });
        continue;
      }
      if (a === 2) {                                      // 悄悄话：随亲密度升温
        await say({ name: cr.name, text: stage === 3 ? '你还没说完，它已经把小爪子\n轻轻搭在了你的手心里。'
                                  : stage === 2 ? '它听完，用脑袋蹭了蹭你的手背。'
                                  : stage === 1 ? '它歪着小脑袋听完，\n尾巴啪嗒啪嗒拍了拍地面。'
                                  : '它歪着小脑袋听你说完，\n虽然好像没太懂，但听得很认真。' });
        continue;
      }
      // a === 3：道别解除随行
      const bye = await choose(['真的要道别', '再想想']);
      if (bye !== 0) continue;
      f.buddy = null;
      ent.hidden = true; ent.followT = 0;
      ADV.Audio.sfx('cancel');
      ADV.UI.toast(` 与${cr.name}挥手道别，它一溜烟跑远了 `);
      logEvent(`与随行伙伴${cr.name}道别`);
      return;
    }
  };

  /* —— P3 牧场盒孵蛋：铺着干草的小木盒（后院鸡舍旁）——
   * 同系的两只小伙伴住进去，睡一觉（farmTick）就会产下一枚蛋；
   * 揣着蛋走满 300 步破壳，孵出三系混血新种（异色亲本把金色传给蛋）。
   * 步数口径 300 与 engine onArrive 的破壳钩子保持一致。 */
  const EGG_STEPS = 300;
  const EGG_NEWBORN = { 虫: 'i19', 水: 'c13', 兽: 'm15' };   // 系别 → 混血新种
  S.ranchBox = async () => {
    const f = F(), CO = ADV.Collect;
    while (true) {
      f.ranch = f.ranch || {};
      const a = f.ranch.a, b = f.ranch.b;
      const nm = id => { const cr = CO.critter(id); return cr ? cr.name : id; };
      const cap = f.ranchEgg
        ? `干草窝里躺着一枚${f.ranchEgg.shiny ? '泛着淡淡金光的' : ''}${f.ranchEgg.fam}系蛋。🥚\n（揣着它走 ${Math.max(0, EGG_STEPS - (f.eggSteps || 0))} 步左右就能孵化）`
        : a && b ? `${nm(a)}和${nm(b)}挤在干草窝里，处得很好。\n（睡一觉说不定会有惊喜……）`
        : a || b ? `住着：${nm(a || b)}。\n（它还想找个同系的同伴才住得惯）`
        : '铺着软干草的小木盒，空空的。\n（听说同系的两只小伙伴住在一起，\n会有奇妙的事发生）';
      const opts = [];
      if (!f.ranchEgg && (!a || !b)) opts.push('寄存一只小伙伴');
      if (!f.ranchEgg && (a || b)) opts.push('接回小伙伴');
      opts.push('就这样吧');
      const i = await choose(opts, { cancelIndex: opts.length - 1, caption: { name: '牧场盒', text: cap } });
      if (i < 0 || i === opts.length - 1) return;
      if (opts[i] === '寄存一只小伙伴') {
        const held = CO.heldCritters().filter(h => !h.gone && h.id !== a && h.id !== b && !(f.buddy && f.buddy.id === h.id));
        if (!held.length) { await say({ name: '牧场盒', text: '（手上没有能寄存的小伙伴——\n先去草丛里认识几只吧）' }); continue; }
        const hi = await choose(held.map(h => `${h.cr.name}${h.shiny ? ' ✨' : ''}（${h.cr.fam}系）`),
          { caption: { name: '牧场盒', text: a ? `盒里已经住着${nm(a)}（${CO.critter(a).fam}系）——\n得找个同系的伙伴才住得惯。` : '轻轻把它放进干草窝……' } });
        if (hi < 0) continue;
        const pick = held[hi];
        if (a && CO.critter(a).fam !== pick.cr.fam) {
          await say({ name: '牧场盒', text: `${pick.cr.name}和${nm(a)}不住一块儿——\n（盒子里的两只得是同系才行）` });
          continue;
        }
        if (!a) f.ranch.a = pick.id; else f.ranch.b = pick.id;
        const e = CO.critterEntry(pick.id);
        if (e) e.gone = 1;                                // 住进牧场盒：图鉴收录保留，但不在手上（防误卖/误换）
        ADV.Audio.sfx('item');
        ADV.UI.toast(` ${pick.cr.name} 住进了牧场盒 `);
        save();
        continue;
      }
      // 接回小伙伴
      const ins = [a, b].filter(Boolean);
      const ti = await choose(ins.map(id => `${nm(id)}（${CO.critter(id).fam}系）`), { caption: { name: '牧场盒', text: '干草窝的门开着，随时欢迎回来住。' } });
      if (ti < 0 || ti >= ins.length) continue;
      const out = ins[ti];
      if (f.ranch.a === out) delete f.ranch.a; else delete f.ranch.b;
      const e = CO.critterEntry(out);
      if (e) e.gone = 0;                                  // 接回家：恢复「在手上」
      ADV.Audio.sfx('item');
      ADV.UI.toast(` 把${nm(out)}接回了家 `);
      save();
    }
  };

  /* —— 破壳时刻：engine onArrive 带蛋走满 300 步触发 ——
   * 按蛋的系别孵出混血新种；异色蛋孵出异色个体；
   * 首次孵出的孩子格外亲人——邀请随行时亲密度 +15（一种一次）。 */
  S.eggHatch = async () => {
    const f = F(), CO = ADV.Collect;
    const egg = f.ranchEgg;
    if (!egg) return;
    const id = EGG_NEWBORN[egg.fam] || 'i19';
    const cr = CO.critter(id);
    ADV.Audio.sfx('fanfare');
    await say({ text: '走了这么多路，怀里的蛋微微发烫——\n「咔」的一声，壳上裂出一道小缝！🥚' });
    await say({ text: egg.shiny
      ? `蛋壳轻轻散开，一道金光跳了出来——\n${cr.name}破壳而出，绒毛上闪着细细的金斑！✨`
      : `蛋壳簌簌剥落，一只湿漉漉的小家伙\n探出脑袋，打了个大大的喷嚏——\n${cr.name}破壳而出！🐣` });
    CO.hatchCritter(id, !!egg.shiny);
    const first = !f.hatchedSpecies[id];
    f.hatchedSpecies[id] = true;
    f.ranchEgg = null;                                    // 蛋已破壳，干草窝重新空出来
    [f.ranch.a, f.ranch.b].forEach(pid => {               // 爸爸妈妈功成身退：清寄存标记、回到你手上
      const e = pid && CO.critterEntry(pid);              // （批次二十二修正——之前 gone=1 挂着，
      if (e) e.gone = 0;                                  //   亲本既不能卖也不能再寄存，卡死在图鉴里）
    });
    f.ranch = {};                                         // 想再孵就再寄存一对
    logEvent(`牧场盒的蛋孵出了${cr.name}${egg.shiny ? '（金色异色！）' : ''}`);
    if (!f.buddy) {
      const inv = await choose([`让${cr.name}跟着你走`, '让它在盒里先睡一觉'],
        { caption: { name: `刚出生的${cr.name}`, text: '它睁开水汪汪的眼睛，\n把你当成了家里人——' } });
      if (inv === 0) {
        const e = CO.critterEntry(id);
        f.buddy = { id, shiny: e && e.s ? 1 : 0 };
        ADV.Engine.spawnBuddy();
        if (first) {
          f.buddyBond = Math.min(100, (f.buddyBond || 0) + 15);
          ADV.UI.toast(' 🐣 亲人加成：牧场出生的孩子格外黏人（亲密度 +15） ');
        }
        ADV.UI.toast(` ${cr.name} 成了你的随行伙伴！按 Z 可以和它互动 `);
        logEvent(`${cr.name} 成了随行伙伴`);
      }
    } else {
      await say({ text: `（身边已有随行伙伴。\n${cr.name}在干草窝里打了个滚，睡得香喷喷）` });
    }
    save();
  };

  /* —— 矿道：无限层下探（入口裂缝 / 下行裂缝 / 出口绳索 / 矿脉敲采） —— */
  async function mineJump() {                           // 矿道换层转场（淡出 → 载入对应层 → 淡入）
    ADV.Game.busy = true;
    ADV.Audio.sfx('door');
    await new Promise(res => ADV.Engine.fadeTo(1, .6, res));
    ADV.Engine.loadMap('mineShaft', 13, 5, 'up');
    await new Promise(res => ADV.Engine.fadeTo(0, .6, res));
    ADV.Game.busy = false;
  }
  S.mineEnter = async () => {                           // 藏宝洞窟壁根裂缝 → 钻进矿道（恢复记忆层数）
    const f = F();
    if (!f.mineDepth) f.mineDepth = 1;
    const go = await choose(['钻进裂缝', '还是算了'],
      { caption: { name: '矿道裂缝', text: `壁根下一道黑黢黢的缝，\n里面隐约传来金属的回响。${f.mineRecord ? `\n（你的纪录：第 ${f.mineRecord} 层）` : ''}` } });
    if (go !== 0) return;
    await mineJump();
    UI().toast(` ⛏ 矿道 · 第 ${f.mineDepth} 层 `);
    logEvent('钻进了矿道裂缝');
    save();
  };
  S.oreNode = async (o) => {                            // 矿脉：小铲子敲矿（档次随层数，当日采空）
    const f = F(), C = ADV.Cal;
    if (!ADV.Collect.count('shovel')) {
      await say({ text: '岩壁里嵌着一块矿石，\n闪着细碎的光。\n（徒手根本抠不动——\n礼品店的小铲子应该能行）' });
      return;
    }
    f.mineOre = f.mineOre || {};
    if (f.mineOre.day === C.day && f.mineOre.oids[o.oid]) { await say({ text: '（这簇矿脉已经被你\n敲得渣都不剩了）' }); return; }
const enNeed = ADV.Skills ? ADV.Skills.oreEnergy() : 2;
if (C.energy < enNeed + 1) { await say({ text: '（胳膊酸得抬不起来……\n先回上面歇歇吧）' }); return; }
const go = await choose([`敲下来！（精力 -${enNeed}）`, '再看看'], { caption: { text: '矿石上矿纹闪烁，\n说不定还连着更大的矿脉。' } });
if (go !== 0) return;
C.costEnergy(enNeed);
    f.mineOre.oids = f.mineOre.oids || {};
    f.mineOre.day = C.day; f.mineOre.oids[o.oid] = C.day;   // 今日此矿已采空
    ADV.Audio.sfx('dig');
    const ORES = ['copperOre', 'ironOre', 'goldOre', 'gemStone'];
    const it = ADV.Collect.itemInfo(ORES[o.tier | 0]);
const dbl = Math.random() < (ADV.Skills ? ADV.Skills.oreDbl(o.tier | 0) : (o.tier >= 2 ? .3 : .15));   // 采矿技能提升双矿率
ADV.Collect.addItem(ORES[o.tier | 0], dbl ? 2 : 1);
if (ADV.Skills && ADV.Skills.oreShard()) { ADV.Collect.addItem(ORES[o.tier | 0], 1); UI().toast(' ⛏ 巧手一敲——又崩下一块碎屑！ '); }
    ADV.UI.toast(` ⛏ 获得${it.name}×${dbl ? 2 : 1} `);
    await say({ text: dbl ? '「哐当」一声脆响——\n居然敲下来两块！' : '敲了几下，矿石\n「咔哒」落进了背包。' });
if (ADV.Skills) ADV.Skills.add('mine', 6, '敲矿');
if (ADV.Skills) ADV.Skills.add('mine', 6, '敲矿');
logEvent('在矿道里敲到了矿石');
    save();
  };
  S.crackDown = async () => {                           // 下行裂缝：层数 +1，刷新深度纪录
    const f = F(), C = ADV.Cal;
    const SK = ADV.Skills;
    const cost = SK ? SK.crackEnergy() : 2;              // 轻步技能：探缝精力消耗 -1
    const go = await choose([`顺着裂缝往下爬（精力 -${cost}）`, '退回去'], { caption: { name: '更深的裂缝', text: '缝隙里透出凉气，\n更深处隐约有矿光闪烁。' } });
    if (go !== 0) return;
    if (C.energy <= cost) { await say({ text: '（手脚都在发软……\n今天就别再往下去了）' }); return; }
    C.costEnergy(cost);
    f.mineDepth = (f.mineDepth || 1) + 1;
    const rec = f.mineDepth > (f.mineRecord || 0);
    if (rec) f.mineRecord = f.mineDepth;
    await mineJump();
    UI().toast(rec ? ` ⛏ 首次抵达第 ${f.mineDepth} 层！新纪录！ ` : ` ⛏ 矿道 · 第 ${f.mineDepth} 层 `);
    logEvent(`下探到矿道第${f.mineDepth}层`);
    if (SK) SK.add('mine', 3, '探层');
    save();
  };
  S.ropeUp = async () => {                              // 出口绳索：爬回藏宝洞窟（层进度保留）
    const go = await choose(['攀上绳索回洞窟', '再转一圈'], { caption: { name: '出口绳索', text: '洞顶垂下一根粗麻绳，\n上头透着亮堂堂的天光。' } });
    if (go !== 0) return;
    ADV.Game.busy = true;
    ADV.Audio.sfx('door');
    await new Promise(res => ADV.Engine.fadeTo(1, .6, res));
    ADV.Engine.loadMap('cave', 10, 16, 'up');           // 回到裂缝旁
    await new Promise(res => ADV.Engine.fadeTo(0, .6, res));
    ADV.Game.busy = false;
    UI().toast(' ⛏ 从矿道回到了藏宝洞窟 ');
    save();
  };
  S.elevator = async () => {                            // 矿道电梯：直达去过的整五层（星露谷式）
    const f = F();
    const floors = [5, 10, 15, 20, 25, 30].filter(n => n <= (f.mineRecord || 0));
    if (!floors.length) {
      await say({ text: '木架上的滑轮锈得吱呀响，\n吊板还悬在半空。\n（听说下到第 5 层，它就认得你了——\n以后可以直接送到到过的整五层）' });
      return;
    }
    const pick = await choose(floors.map(n => `直达第 ${n} 层`).concat(['不用了']),
      { caption: { name: '矿道电梯', text: `吱呀——老滑轮转了起来。\n（电梯只停你到过的整五层，\n当前纪录：第 ${f.mineRecord} 层）` } });
    if (pick < 0 || pick >= floors.length) return;
    f.mineDepth = floors[pick];
    await mineJump();
    UI().toast(` ⛏ 电梯直达 · 第 ${f.mineDepth} 层 `);
    save();
  };

  /* ---------- 暗线 ---------- */
  S.hist = async (o) => {
    const f = F();
    if (f.hist[o.h]) { await say({ text: '（这页校史已经读过了）' }); return; }
    f.hist[o.h] = true;
    const texts = {
      1: '泛黄的一页：\n「晨曦女士连任班长第三年，\n她把图书馆的钥匙交给了——一个总留级的少年。」',
      2: '残破的一页：\n「毕业典礼上，她对他说：\n『学校深处有一扇门，帮我看着它。』」',
      3: '最后一页，字迹娟秀：\n「他说：『我会守到下一个拿四枚徽章的孩子来。』\n——原来如此。」'
    };
    await say({ text: texts[o.h] });
    const n = Object.keys(f.hist).length;
    if (n >= 3) {
      await say({ text: '三页拼合——守门人与晨曦女士是同班同学。\n他留级、她催他补课；毕业那天，\n她把「门」托付给了他。' });
      addCup(8);
      UI().toast(' 暗线完成《校史的缺页》：三章守门人有新对话 ');
    } else UI().toast(` 校史缺页 ${n}/3 `);
    save();
  };
  S.chestD = async () => {
    const f = F();
    if (!f.sheKey) { await say({ text: '一只上锁的旧木箱，\n锁孔形状奇特。（需要一把社团旧钥匙）' }); return; }
    const o = E().findObject('chestD');
    if (f.chests.chestD) { await say({ text: '箱盖敞着，\n里面还留着社旗叠过的痕迹。' }); return; }
    f.chests.chestD = true;
    if (o) o.open = true;
    f.gold = (f.gold || 0) + 150;
    ADV.Collect.addItem('clubFlag', 1);
    ADV.Audio.sfx('item');
    await say({ text: '钥匙转动——探险社的社办旧箱！\n里面是叠得整整齐齐的社旗，\n和一罐老社员凑的「社费」。💰 +150' });
    await say({ text: '（把社旗带回去给老矿工看看吧）' });
    save();
  };

  /* ---------- 大型节点 ---------- */
  S.lantern = async () => {
    const f = F(), C = ADV.Cal;
    if (!C.isNight() || C.day < 24) { await say({ text: '河边的长椅空着。\n（学期末的夜晚，这里会有萤火晚会……）' }); return; }
    if (f.lantern) { await say({ text: '河灯顺流而下，\n像一条星子的项链。' }); return; }
    f.lantern = true;
    ADV.Audio.playBgm('tender');
    await say({ text: '学期末的夜晚——\n全班在河边放起了河灯。' });
    const ids = Object.keys(state.friends).filter(id => state.friends[id].stage >= 1);
    const wishPool = ADV.Collect.DB.wishes.filter(w => !ADV.Collect.has('wishes', w.id));
    let n = 0;
    for (const w of wishPool) {
      if (n >= 6) break;
      ADV.Collect.gain('wishes', w.id); n++;
    }
    await say({ text: `每个人把愿望写在了灯上。\n（心愿集 +${n}——F 手册收藏页可查看）\n灯一盏盏漂远，愿望留了下来。` });
    addCup(5);
    save();
    try { const m = ADV.Engine.map; if (m && m.bgmCur) ADV.Audio.playBgm(m.bgmCur); } catch (e) {}
  };
  S.door5 = async () => {
    const f = F();
    if (f.e5) { await say({ text: '纪念之门静静矗立，\n门里是你走过的整段时光。' }); return; }
    if (!f.ch3Done) { await say({ text: '一扇没有门把手的镜子门。\n（刻着：毕业之后，来此回望）' }); return; }
    f.e5 = true;
    ADV.Audio.playBgm('grad');
    const photos = ADV.Collect.catCount('photos');
    const wishes = ADV.Collect.catCount('wishes');
    await say({ text: '镜子门无声开启——\n门后不是房间，是这一年。' });
    await say({ text: `樱花树下第一次自我介绍；\n道场的三连战；雷雨夜的石门；\n摇篮曲里的旺福；心愿之镜前的选择……\n（回忆照片 ${photos}/13 · 心愿 ${wishes}/10）` });
    await say({ text: '最后一张照片慢慢亮起——\n毕业礼的大合影。所有人都在，一个不少。\n门轻轻合上，把光留在了你眼睛里。' });
    f.gold = (f.gold || 0) + 100;
    addCup(10);
    UI().toast(' 🚪 隐藏之门《你的这一年》：完成回望 ');
    save();
  };

  /* ---------- 四季守护灵 ---------- */
  function spirit(kind, name, line) {
    return async () => {
      const f = F();
      const match = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }[ADV.Cal.seasonEn()] === kind;
      if (f.spirits[kind]) { await say({ name, text: '（它冲你眨眨眼，很满足的样子）' }); return; }
      if (!match) { await say({ name, text: `（小守护灵在打盹——${kind}天再来照料它吧）` }); return; }
      f.spirits[kind] = true;
      await say({ name, text: line });
      gainBond('star', 3);
      addCup(3);
      const n = Object.keys(f.spirits).length;
      if (n >= 4) {
        ADV.Collect.addItem('sevenFlower', 1);
        ADV.Audio.sfx('fanfare');
        UI().toast(' 四季守护灵全部苏醒：获得「七色花」！ ');
      } else UI().toast(` 四季守护灵 ${n}/4 `);
      save();
    };
  }
  function daySlot(key) {          // 每日重置的 {day, ...} 结构
    const f = F();
    if (!f[key] || f[key].day !== ADV.Cal.day) f[key] = { day: ADV.Cal.day };
    return f[key];
  }
  // 全科知识点合计（结算单「今日收获」用）
  function totalKp() {
    const kp = F().kp || {};
    return Object.keys(kp).reduce((s, k) => s + (kp[k] || 0), 0);
  }
  // 一天只触发一次的小型生活事件，避免同一地点被来回刷收益。
  function sceneSeen(key) {
    const slot = daySlot('microScene');
    if (slot[key]) return true;
    slot[key] = true;
    return false;
  }
  // 时段限定小事件：只在指定时段里的那个地点触发，每个“地点+时段”每天各一次
  function periodScene(key, periods) {
    const c = ADV.Cal;
    if (!c || periods.indexOf(c.period) < 0) return false;
    const slot = daySlot('periodScene');
    const tag = key + '@' + c.period;
    if (slot[tag]) return false;
    slot[tag] = true;
    return true;
  }
  S.forage = async (o) => {
    const slot = daySlot('forage');
    if (slot[o.fid]) { await say({ text: '（这片草丛今天翻过了，\n明天再来碰碰运气）' }); return; }
    slot[o.fid] = true;
    const r = Math.random();
    ADV.Audio.sfx('dig');
    if (r < .45) {
      // 随机补图鉴（优先未拥有、且当前时段/季节/天气能遇见的）
      const pool = [].concat(
        ADV.Collect.DB.leaves.filter(x => !ADV.Collect.has('leaves', x.id)).map(x => ['leaves', x.id]),
        ADV.Collect.DB.insects.filter(x => !ADV.Collect.has('insects', x.id) && ADV.Collect.whenOk(x.id)).map(x => ['insects', x.id]));
      if (pool.length) {
        const [cat, id] = pool[(Math.random() * pool.length) | 0];
        ADV.Collect.gain(cat, id);
        await say({ text: '你翻开草叶仔细寻找——\n找到了新的图鉴收藏！' });
      } else { F().gold = (F().gold || 0) + 10; await say({ text: '翻出一些零碎，卖了 10 金币。' }); }
    } else if (r < .75) {
      const g = 8 + ((Math.random() * 8) | 0);
      F().gold = (F().gold || 0) + g;
      await say({ text: `草丛里滚出几枚硬币！💰 +${g}` });
    } else {
      await say({ text: '只有一只蚂蚁冲你挥了挥触角。\n（它入册了……在心里）' });
    }
    logEvent('在校园草丛里翻找了一通');
    save();
  };
  // 渔获表：[鱼, 权重]；挂蚯蚓后稀有鱼权重翻倍；夜钓/雨夜限定鱼按时段并入（S3）
  const FISH_TABLE = [['f1', 26], ['f2', 18], ['f3', 14], ['f4', 12], ['f5', 10], ['f6', 8], ['f8', 8], ['f7', 3]];
  const FISH_NIGHT = { f9: 4 };                    // 夜钓限定：月光鱼
  const FISH_RAINNIGHT = { f10: 2 };               // 雨夜双限定：霓虹鲤（传说）
  function rollFish(bait, rain) {
    const night = ADV.Cal.isNight();
    const ex = ADV.Skills ? ADV.Skills.fishBoost() : 0;   // 知性/渔汛技能：稀有鱼权重再放大
    const boost = (bait ? 1 : 0) + (rain ? 1 : 0) + ex;
    const golden = ADV.Skills && ADV.Skills.goldenFish(); // 金鳞传说：金色鱼权重翻倍
    const table = FISH_TABLE.map(([id, w], i) => {
      let ww = i >= 4 ? w * (1 + boost) : w;
      if (id === 'f7' && golden) ww *= 2;
      return [id, ww];
    });
    if (night) for (const id in FISH_NIGHT) table.push([id, FISH_NIGHT[id] * (1 + boost)]);
    if (night && rain) for (const id in FISH_RAINNIGHT) table.push([id, FISH_RAINNIGHT[id] * (1 + boost)]);
    const total = table.reduce((s2, x) => s2 + x[1], 0);
    let r = Math.random() * total;
    for (const [id, w] of table) { r -= w; if (r <= 0) return id; }
    return 'f1';
  }

  S.fish = async () => {
    const f = F();
    if (!ADV.Collect.count('fishingRod')) { await say({ text: '（需要鱼竿才能钓鱼。\n小镇礼品店有售～）' }); return; }
    const slot = daySlot('fish');
    slot.n = slot.n || 0;
const rodCap = ADV.Skills ? ADV.Skills.fishRods() : 3;
if (slot.n >= rodCap) { await say({ text: '（今天钓得够多了，\n鱼儿们要休息啦）' }); return; }
    // —— 挂饵？ ——
    let bait = false;
    if (ADV.Collect.count('bait') > 0) {
      const bi = await choose(['挂上蚯蚓 🪱（鱼更容易上钩）', `空钩试试（身上有 ${ADV.Collect.count('bait')} 条蚯蚓）`],
        { caption: { name: '河边', text: '要挂鱼饵吗？\n（西郊田野能挖到蚯蚓，礼品店也有卖）' } });
      if (bi === 0) { ADV.Collect.useItem('bait', 1); bait = true; }
    }
    slot.n += 1;
    const rainy = /雨/.test(ADV.Cal.weather);   // 雨天鱼儿活跃：搏鱼更轻松、稀有鱼更多
    const night = ADV.Cal.isNight();            // 夜钓：限定鱼种才肯咬钩（S3）
await say({ text: `浮漂一沉——就是现在！\n（今日第 ${slot.n}/${rodCap} 竿${bait ? ' · 挂着蚯蚓' : ''}${rainy ? ' · 雨天鱼正活跃' : ''}${night ? ' · 夜钓正当时' : ''}）` });
const win = await new Promise(res => ADV.Mini.start('fish', res, { easy: bait || rainy || !!(ADV.Skills && ADV.Skills.fishEasy()), wide: (f.toolLv && f.toolLv.rod) || 0 }));
    if (!win) {
      ADV.Audio.sfx('wrong');
      await say({ text: bait ? '噗通——鱼把蚯蚓叼走了，钩却空了！\n（下一次抓准时机）' : '噗通——鱼跑了！\n（时机再准一点，或者挂条蚯蚓？）' });
      save();
      return;
    }
ADV.Audio.sfx('item');
if (ADV.Skills) ADV.Skills.add('fish', 7, '钓鱼');
const sp = ADV.Collect.info('fish', rollFish(bait, rainy));
    ADV.Collect.addItem('fish', 1);
    const isNew = ADV.Collect.gain('fish', sp.id);
    f.catches = (f.catches || 0) + 1;
    if (sp.id === 'f7') {
      f.gold = (f.gold || 0) + 50;
      await say({ text: '水里金光一闪——\n你钓上了一条金色的鱼！\n（传说会有好运……卖了 💰 +50）' });
    } else if (sp.id === 'f9') {
      await say({ text: `${isNew ? '🆕 新品种！' : ''}月光鱼——银鳞在夜里泛着微光。\n（白天它从不咬钩，只有夜晚才现身）` });
    } else if (sp.id === 'f10') {
      f.gold = (f.gold || 0) + 80;
      logEvent('在雨夜钓到了传说中的霓虹鲤');
      await say({ text: `${isNew ? '🆕 新品种！' : ''}整条河安静了一瞬——\n雨夜传说·霓虹鲤上钩了！\n（围观的同学轰动了，奖金 💰 +80）` });
    } else {
      await say({ text: `${isNew ? '🆕 新品种！' : ''}${sp.name}，入手！\n（鲜鱼可以卖钱、喂猫，或交给食堂阿姨做菜）` });
    }
    if (Math.random() < .15 && !ADV.Collect.has('quotes', 'q9')) {
      ADV.Collect.gain('quotes', 'q9');
      await say({ text: '鱼肚子里还有个瓶塞，\n上面刻着一句名言。' });
    }
    logEvent(`在河边钓鱼（第 ${slot.n} 竿）`);
    save();
  };

  /* —— 周末补全：周日钓鱼大赛（河畔报到处，day%7===0 且白天开赛）。
   *    三竿计分：钓得的鱼按稀有度折「磅数」——合计 ≥60 冠军 / ≥40 亚军 / 其余重在参与 —— */
  function contestRank(v) { return v >= 60 ? 2 : v >= 40 ? 1 : 0; }
  const FISH_SCORE = { f1: 10, f2: 14, f3: 18, f4: 22, f5: 26, f6: 30, f8: 30, f7: 50, f9: 34, f10: 70 };
  S.fishContest = async () => {
    const f = F(), C = ADV.Cal;
    if (C.day % 7 !== 0) { await say({ text: '（河畔的石阶空荡荡的。\n【周日钓鱼大赛】只在周日白天开赛）' }); return; }
    if (C.period < 1 || C.period > 3) { await say({ text: '（大赛只在白天举行——\n清晨练竿，傍晚颁奖，现在不开赛）' }); return; }
    if (f.contestDay === C.day) { await say({ text: '（你今天已经比过了。\n裁判冲你举了举茶缸：「下周日再来！」）' }); return; }
    if (!ADV.Collect.count('fishingRod')) { await say({ name: '裁判', text: '想参赛？先有鱼竿——\n礼品店有售，报名免费。' }); return; }
    const i = await choose(['报名开赛！', '先看看热闹'], { caption: { name: '周日钓鱼大赛', text: '【每周日 · 河畔三竿赛】\n三竿之内，鱼越稀罕，磅数越足——\n磅数 ≥60 夺冠，≥40 拿亚军！报名免费。' } });
    if (i !== 0) return;
    f.contestDay = C.day;
    let score = 0;
    const caught = [];
    for (let n = 1; n <= 3; n++) {
      await say({ text: `第 ${n}/3 竿——\n（裁判敲了敲茶缸：「稳住，看漂！」）` });
      const bait = ADV.Collect.count('bait') > 0 && n === 2;   // 第二竿自动挂饵：略提稀有率
      if (bait) ADV.Collect.useItem('bait', 1);
      const rainy = /雨/.test(C.weather);
      const win = await new Promise(res => ADV.Mini.start('fish', res, { easy: bait || rainy }));
      if (!win) { await say({ text: '噗通——脱钩了！\n（裁判：「可惜！还有机会！」）' }); continue; }
      const sp = ADV.Collect.info('fish', rollFish(bait, rainy));
      score += FISH_SCORE[sp.id] || 10;
      caught.push(sp.name);
      ADV.Collect.addItem('fish', 1);
      await say({ text: `${sp.name}入手（磅数 +${FISH_SCORE[sp.id] || 10}）！当前磅数：${score}` });
    }
    const rank = contestRank(score);
    f.contestBest = Math.max(f.contestBest || 0, score);
    if (rank === 2) {
      ADV.Audio.sfx('fanfare');
      f.gold = (f.gold || 0) + 40;
      f.contestChamp = (f.contestChamp || 0) + 1;
      addCup(6);
      await say({ name: '裁判', text: `磅数 ${score}——冠军！\n（小镇的奖状 + 金币 40 文，\n名字写在河畔的小黑板上）` });
      logEvent('周日钓鱼大赛夺冠');
    } else if (rank === 1) {
      f.gold = (f.gold || 0) + 20;
      addCup(3);
      await say({ name: '裁判', text: `磅数 ${score}——亚军！金币 +20。\n「离冠军就一步，下周日再来！」` });
    } else {
      f.gold = (f.gold || 0) + 5;
      await say({ name: '裁判', text: `磅数 ${score}——重在参与，安慰奖金币 +5。\n（他递给你一杯凉茶）` });
    }
    if (caught.length) logEvent(`钓鱼大赛钓到了${caught.join('、')}`);
    save();
  };

  // —— 西郊田野：挖蚯蚓（作鱼饵） ——
  S.digWorm = async (o) => {
    const slot = daySlot('worm');
    if (slot[o.wid]) { await say({ text: '（这块土今天翻过了，\n蚯蚓都躲起来了）' }); return; }
    slot[o.wid] = true;
    ADV.Audio.sfx('dig');
    const r = Math.random();
    if (r < .6) {
      const n = 1 + ((Math.random() * 2) | 0);
      ADV.Collect.addItem('bait', n);
      await ADV.UI.itemGet(`蚯蚓 ×${n}`, '#d08a6a');
      await say({ name: '田野', text: '翻开湿土，几条蚯蚓扭来扭去。\n（钓鱼时挂上它们，鱼更容易上钩）' });
    } else if (r < .8) {
      ADV.Collect.addItem('bait', 1);
      const pool = ADV.Collect.DB.insects.filter(x => !ADV.Collect.has('insects', x.id) && ADV.Collect.whenOk(x.id));
      if (pool.length) ADV.Collect.gain('insects', pool[(Math.random() * pool.length) | 0].id);
      await say({ text: '挖出一条蚯蚓，\n还顺手记了一只小虫进昆虫图鉴。' });
    } else {
      await say({ text: '只有几块小石头。\n（换一块土试试）' });
    }
    logEvent('在西郊田野挖蚯蚓');
    save();
  };

  // —— 田伯：凑蚯蚓的请求（农事知识） ——
  S.farmer = async (ent) => {
    const f = F();
    const n = ADV.Collect.count('bait');
    if (!f.farmQuest) {
      f.farmQuest = true;
      E().playAction(ent, 'wave', 1.4);
      await say({ name: '田伯', text: '哟，城里的娃？\n这片田是我种的。' });
      await say({ name: '田伯', text: '想钓鱼啊？光有竿可不行——\n得先挖到蚯蚓。土松的地方最多。' });
      await say({ name: '田伯', text: '你要能凑 3 条蚯蚓送我老伙计，\n我把这田里的门道都告诉你。' });
      UI().toast(' 🪱 田伯的请求：凑 3 条蚯蚓 ');
      save();
      return;
    }
    if (!f.farmDone && n >= 3) {
      f.farmDone = true;
      ADV.Collect.useItem('bait', 3);
      ADV.Audio.sfx('fanfare');
      E().playAction(ent, 'laugh', 1.6);
      await say({ name: '田伯', text: '哈，还真让你挖着了！\n我那老伙计明天一早就去河边。' });
      await say({ name: '田伯', text: '教你个门道——\n雨后土松，蚯蚓都往上爬；\n日头毒的时候，得往阴湿的田埂下翻。' });
      ADV.Collect.addItem('fish', 2);
      f.gold = (f.gold || 0) + 30;
      await ADV.UI.itemGet('田伯送的鲜鱼 ×2', '#8ad0f0');
      logEvent('帮田伯凑齐了蚯蚓');
      save();
      return;
    }
    if (f.farmDone) {
      // 当季种子摊：种后院田地靠他进货（冬天休耕不卖；盖了温室则四季全目录）；s5 畜牧：小牛犊 / 小羊羔；s2 温室：高价代建
      const seeds = f.greenhouse ? ALL_SEEDS : seasonSeeds();
      const stock = [];
      if (seeds.length) stock.push('买点种子');
      if (!f.cow) stock.push('抱只小牛犊（💰120）');
      if (!f.sheep) stock.push('抱只小羊羔（💰100）');
      if (!f.greenhouse) stock.push('盖间温室（💰300）');
      stock.push('请教种田门道');
      const pick = await choose(stock, {
        caption: { name: '田伯', text: seeds.length
          ? (f.greenhouse ? '温室都盖起来了，四季的种子\n我这儿全年备着——还有牲口。'
                          : '后院的地翻好了？来，\n我这儿有当季的好种子——还有牲口。')
          : (f.greenhouse ? '冬天地要歇着，可你的温室不歇。\n四季的种子，我这儿都备着。'
                          : '冬天地要歇着，种子开春才卖。\n要抱只牲口回去养吗？还是……盖间温室？') }
      });
      const sel = stock[pick];
      if (sel === '买点种子') {
        for (;;) {                                          // 连续购买，直到选“不买了”
          const opts = seeds.map(s => `${ADV.Collect.ITEMS[s.seed].name}（💰${ADV.Collect.ITEMS[s.seed].price} · 有 ${ADV.Collect.count(s.seed)}）`).concat(['不买了']);
          const i = await choose(opts, { caption: { name: '田伯', text: `当季种子，个个饱满。\n（💰${f.gold || 0}）` } });
          if (i >= seeds.length) break;
          const s = seeds[i], price = ADV.Collect.ITEMS[s.seed].price;
          if ((f.gold || 0) < price) { await say({ name: '田伯', text: '钱不够啦，先去挣点零花钱。' }); break; }
          f.gold -= price;
          ADV.Collect.addItem(s.seed, 1);
          ADV.Audio.sfx('item');
          UI().toast(` 🌰 买下${ADV.Collect.ITEMS[s.seed].name} `);
          save();
        }
        await say({ name: '田伯', text: '种下去记得天天浇水，\n土干了苗可不等人。' });
        return;
      }
      if (sel === '盖间温室（💰300）') {
        if ((f.gold || 0) < 300) { await say({ name: '田伯', text: '温室要 300 文工钱——\n先去攒攒吧，材料我都给你记着账。' }); return; }
        f.gold -= 300;
        f.greenhouse = true;
        ADV.Audio.sfx('fanfare');
        await say({ name: '田伯', text: '好嘞，材料都是现成的——\n这就去你后院开工！' });
        await say({ text: '后院立起一间亮晶晶的玻璃温室：\n里面四垄培养土四季恒温，\n喷淋会自动浇水，乌鸦也飞不进去。🏠' });
        UI().toast(' 🏠 温室落成：四季都能种菜了！ ');
        logEvent('请田伯在后院盖起一间温室');
        save();
        return;
      }
      if (sel === '抱只小牛犊（💰120）' || sel === '抱只小羊羔（💰100）') {
        const isCow = sel.includes('牛');
        const price = isCow ? 120 : 100;
        if ((f.gold || 0) < price) { await say({ name: '田伯', text: `钱不够——${isCow ? '牛犊' : '羊羔'}要 ${price} 文呢。` }); return; }
        f.gold -= price;
        ADV.Collect.addItem(isCow ? 'calf' : 'lamb', 1);
        ADV.Audio.sfx('item');
        await say({ name: '田伯', text: `抱好咯——${isCow ? '牛犊' : '羊羔'}认生，\n回家先喂把小麦，它就跟你亲了。` });
        UI().toast(` ${isCow ? '🐄 小牛犊' : '🐑 小羊羔'}入手——回后院的${isCow ? '牛棚' : '羊圈'}安置吧 `);
        save();
        return;
      }
      const tips = ['「锄禾日当午」——中午锄草，草才晒得死。',
                    '稻子灌浆那几天，田里一天都不能断水。',
                    '青蛙是田里的好帮手，可别赶它走。',
                    '看云识天气：云往东，一场空；云往西，雨凄凄。'];
      await say({ name: '田伯', text: tips[ADV.Cal.day % tips.length] });
      return;
    }
    await say({ name: '田伯', text: `蚯蚓凑了 ${n} / 3 条。\n往土松的地方翻，快得很。` });
  };

