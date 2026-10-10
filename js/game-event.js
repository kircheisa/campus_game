/* =========================================================
 * game-event.js —— 游戏剧情拆分段 2/8
 * 主线事件脚本（S）· 四师签名挑战
 * 必须按 core → event → scene → quest → retro → town → life → save 顺序加载。
 * ========================================================= */
  /* ==================== 事件脚本（NPC / 调查点） ==================== */
  const S = {};

  // —— 校长：主线介绍 ——
  /* —— P-B4 NG+ 差异化①：老朋友的重逢（玩6）。NG+ 开学后与关键 NPC 的第一段对话
   *    换成「他们都记得你」的专属过场——每人一次，登记在 f.ngMeet —— */
  const NG_REUNION = {
    principal: async () => {
      await say({ name: '校长', text: '「欢迎回来——哦不，对你来说，是欢迎来到。」\n他眨了眨眼，像在分享一个只有你们知道的笑话。' });
      await say({ name: '校长', text: '「上一次，你把整所学校都点亮了。\n这一次，慢慢来——学校哪儿都不会跑。」' });
      gainBond('principal', 5);
    },
    xiaoming: async () => {
      const np = E().getNpc('xiaoming'); if (np) E().playAction(np, 'laugh', 1.6);
      await say({ name: '小明', text: '「咦？！你身上有一种……老朋友的感觉！」\n他挠挠头，「奇怪，我们才第一次见面吧？」' });
      await say({ name: '小明', text: '「直觉告诉我：这一年会很热闹。\n毕竟——冒险王也是这么开头的！」' });
      gainBond('xiaoming', 5);
    },
    xiaohong: async () => {
      const np = E().getNpc('xiaohong'); if (np) E().emote(np, '♥');
      await say({ name: '小红', text: '「我们……在哪儿见过吗？」\n她歪着头想了想，然后笑了：「算啦，反正从今天起就认识了！」' });
      await say({ name: '小红', text: '「操场十条跑道，随便挑一条，\n我陪你跑到认识为止！」' });
      gainBond('xiaohong', 5);
    },
    wuyun: async () => {
      await say({ name: '乌云', text: '他盯着你看了三秒，忽然抱起手臂笑了：\n「……有意思。你这种眼神，我在哪儿见过。」' });
      await say({ name: '乌云', text: '「道场见。别让我等太久——\n这次我不会留级了。」' });
      gainBond('wuyun', 5);
    },
    dazhuang: async () => {
      const np = E().getNpc('dazhuang'); if (np) E().playAction(np, 'laugh', 1.6);
      await say({ name: '大壮', text: '「新同学！你这手……握过扳手吧？」\n他用力握了握你的手，「握过扳手的人，靠得住。」' });
      await say({ name: '大壮', text: '「工具箱在修理部，渴了自取汽水——\n对谁都一样，对老朋友……也一样！」' });
      gainBond('dazhuang', 5);
    },
    xiaoying: async () => {
      const np = E().getNpc('xiaoying'); if (np) E().emote(np, '♪');
      await say({ name: '小影', text: '她安静地看了你三秒，翻开画册的一角：\n「这里……总觉得画过你。」' });
      await say({ name: '小影', text: '「……可能是我画谁都像你吧。\n（她合上册子，耳朵有点红）」' });
      gainBond('xiaoying', 5);
    },
    lufei: async () => {
      const np = E().getNpc('lufei'); if (np) E().playAction(np, 'wave', 1.4);
      await say({ name: '陆飞', text: '「咦，你的跑步姿势——好像在哪见过！」\n他绕着你看了半圈，「校运会传说级别的既视感！」' });
      await say({ name: '陆飞', text: '「放学操场比一场？放心，\n老朋友之间——我只让你半圈！」' });
      gainBond('lufei', 5);
    },
  };
  async function ngReunion(id) {
    const f = F();
    if (!f.ngplus || f.ngMeet[id] || !NG_REUNION[id]) return false;
    f.ngMeet[id] = true;
    ADV.Audio.sfx('emote');
    await NG_REUNION[id]();
    save();
    UI().toast(' 🔄 新学期：老朋友的感觉…… ');
    return true;
  }

  S.principal = async () => {
    const f = F();
    if (await ngReunion('principal')) return;
    if (f.finalPassed) {
      await say({ name: '校长', text: '听说后山的秘境被你点亮了……\n孩子，你的传说才刚刚开始。' });      return;
    }
    if (f.gateOpen) {
      await say({ name: '校长', text: '石门已经打开，后山秘境在等你。\n记住：真正的智慧，是永不停止的脚步。' });
      return;
    }
    if (!f.metPrincipal) {
      f.metPrincipal = true;
      E().playAction(E().getNpc('principal'), 'wave', 1.4);      // 校长挥手欢迎
      await say({ name: '校长', text: '欢迎来到阳光中学，新同学！\n我是这所学校的校长。' });
      await say({ name: '校长', text: '告诉你一个秘密——\n我们学校的后山，有一扇古老的石门。' });
      await say({ name: '校长', text: '传说中，只有集齐四枚「智慧徽章」的人，\n才能打开它，见到门后的世界。' });
      await say({ name: '校长', text: '数学王老师在教室、语文李老师在图书馆、\n科学陈老师在实验室、英语吴老师在外语楼。' });
      await say({ name: '校长', text: '不用急着一口气做完所有事。\n先在校园里认认路，挑一位老师聊聊就很好。' });
      ADV.Audio.sfx('save');
      UI().toast(' 📘 手册记下了新的校园目标 ');
      save();
    } else {
      const n = badgeCount();
      await say({ name: '校长', text: `徽章收集进度：${n} / 4。\n${n < 4 ? '继续加油，老师们的教室就在北边那几栋楼里。' : '不可思议……石门定会为你敞开！'}` });
    }
  };

  // —— 三位老师的试炼 ——
  /* —— C2 办公时间专属台词：四位老师各三段（作业开场 / 全对夸奖 / 首错宽慰），
   * 午休（period 2）在 trial() 里自动生效；提为数据表便于校对与测试。 —— */
  const OFFICE_LINES = {
    math: {
      hwOffice: '午休跑来问题目？好学的孩子。\n数学办公室随时开放——今日三题，全对双倍奖励！',
      hwGreatOffice: '全对！中午来攻关的孩子最有数学家潜质。\n办公时间作业：金币 +16 · 学院分 +2，双倍收好！',
      officeIntro: '午休是我的办公时间——答错了没关系，\n我当面给你画张图，把它讲透。'
    },
    chinese: {
      hwOffice: '午休的图书馆正安静，正适合答疑。\n今日三道语文题，全对奖励翻倍。',
      hwGreatOffice: '全对——腹有诗书气自华。\n办公时间作业：金币 +16 · 学院分 +2，请收好。',
      officeIntro: '午休正好是我的办公时间。\n答错了也不打紧——我把那一句，慢慢讲给你听。'
    },
    science: {
      hwOffice: '哈哈，午休跑实验室来答疑！有精神！\n今天也留了三道科学题，全对双倍奖励！',
      hwGreatOffice: '漂亮！这就是科学精神！\n办公时间作业：金币 +16 · 学院分 +2，双倍到手！',
      officeIntro: '现在是办公时间——大胆试，大胆错！\n实验失败不可怕，我陪你重新验证一遍。'
    },
    english: {
      hwOffice: 'Office hour! 午休来练英语，very good!\n今日作业三道题，全对奖励翻倍哦！',
      hwGreatOffice: 'Perfect score! 全对！\n办公时间作业：金币 +16 · 学院分 +2，双倍拿好！',
      officeIntro: "It's my office hour——\n错了也没关系，我再讲一遍给你听。 See you!"
    }
  };

  S.teacherMath = ent => trial({
    teacher: '王老师', npcId: 'teacher_math',
    intro: ['同学你好，我是数学王老师。\n想要数学徽章？先通过我的试炼！',
            '三道题，答对才能获得徽章。\n深呼吸，我们开始吧！'],
    subject: 'math', badge: '数学', gemColor: '#5a8aff',
    again: '数学之美在于思考。徽章已是你的了，去帮助别的同学吧！',
    ...OFFICE_LINES.math
  });

  S.teacherCn = ent => trial({
    teacher: '李老师', npcId: 'teacher_cn',
    intro: ['嘘——图书馆要安静。\n我是李老师，守着语文徽章的人。',
            '答对三道语文题，徽章便归于你。\n请开始你的背诵与赏析。'],
    subject: 'chinese', badge: '语文', gemColor: '#ff6a7a',
    again: '腹有诗书气自华。徽章已是你的了，多来读书哦。',
    ...OFFICE_LINES.chinese
  });

  S.teacherSci = ent => trial({
    teacher: '陈老师', npcId: 'teacher_sci',
    intro: ['欢迎来到实验室！我是陈老师。\n科学徽章？哈哈，有胆量来试炼！',
            '观察、思考、验证——\n三道科学题，开始！'],
    subject: 'science', badge: '科学', gemColor: '#4ae86c',
    again: '保持好奇心！科学徽章已是你的了。',
    ...OFFICE_LINES.science
  });

  S.teacherEn = ent => trial({
    teacher: '吴老师', npcId: 'teacher_en',
    intro: ['Hello! 我是英语吴老师。\n欢迎来到外语楼的世界！',
            '答对三道英语题，英语徽章就是你的啦。\nReady? Go!'],
    subject: 'english', badge: '英语', gemColor: '#ffd94c',
    again: 'Wonderful! 英语徽章已是你的了，\nKeep going，保持热爱！',
    hw: 'Practice makes perfect!\n今日作业三道题，全对有惊喜哦！',
    hwDone: 'Well done! 今天的作业完成啦，See you tomorrow!',
    hwGreat: 'Perfect! 全对！这份奖励送给你，\nKeep it up!',
    after: '你的冒险故事，用英语说就是——Amazing！\n继续向前吧，孩子！',
    ...OFFICE_LINES.english
  });

  /* ==================== 四师签名挑战 ====================
   * 每科一款专属 canvas 小游戏（王老师·速算天平 / 李老师·飞花令 /
   * 陈老师·电路连通 / 吴老师·单词街机），三关递进：
   * 过 1/2 关 +5 金，第三关通关授「大师奖章」（+15 金 +3 学院分）；
   * 毕业后每天可打一局「复健局」（+6 金 +1 学院分）。
   * 试炼 / 作业 / 奥赛 / 签名挑战四玩法在 f.tkind 打卡，
   * 单科集齐 4 种发奖学金，四科全齐解锁成就「文理四通」。 */
  const TGAME = {
    math: {
      kind: 'balance', cn: '速算天平', teacher: '王老师', npcId: 'teacher_math',
      medal: '天平大师奖章', medalColor: '#5a8aff',
      prompt: '来一盘速算天平吗？',
      intro: ['看到讲台边的老天平了吗？\n放对砝码，算式才能成立。\n第一关是加减法，试试手！',
              '第二轮要用乘法口诀了——\n口诀背得熟，天平才听话。',
              '最后一关是两步混合运算。\n先乘后加，沉住气——\n你有数学家的脑子！'],
      clear: ['手感不错！下一关乘法等你来。', '口诀这么熟？最后一关混合运算，敢应战吗？'],
      finish: '三关全破——这座小天平送你！\n从今天起，你就是「天平大师」！',
      fail: ['天平歪了不要紧，数学就是试出来的。', '口诀再背一背，我随时等你。', '混合运算要多想一步——深呼吸，再来！'],
      bye: '好，天平我先收着，随时光临。',
      gradReplay: '大师也要天天练手——\n今日复健局，来一盘？',
      gradDone: '今天已经练过啦，让天平也歇歇。明天见！',
      gradWin: '宝刀未老！这份复健奖励拿好。',
      gradLose: '偶失一局而已，大师也会手生嘛。'
    },
    chinese: {
      kind: 'flower', cn: '飞花令', teacher: '李老师', npcId: 'teacher_cn',
      medal: '飞花令金牌', medalColor: '#ff6a7a',
      prompt: '要不要来玩一局飞花令？',
      intro: ['古人以诗会友，行令赋诗。\n第一关诗句缺一字——\n接住飘落的花瓣，把字补上。',
              '第二关换七言，花瓣也落得急了。\n稳住手，心里默念那句诗。',
              '终局是「飞花令」本令——主题字「月」。\n缺字在何处不可知，\n唯月字必在其中。'],
      clear: ['好接！下一局七言，更难些。', '接得漂亮——敢不敢赴「月」字之局？'],
      finish: '月字令成，花瓣满篮。\n这块「飞花令金牌」，非你莫属！',
      fail: ['接漏了也不要紧，诗句多念几遍就熟了。', '七言长，花瓣急——再试一回。', '月字难寻，诗人也是找了一生的。再来。'],
      bye: '去吧，书页间的风会替我等你。',
      gradReplay: '旧令重开，温故知新——\n今日再行一局？',
      gradDone: '今日花令已毕，明日再会。',
      gradWin: '诗心不减当年。这份彩头收好。',
      gradLose: '心不静则令不成。喝口茶，再来。'
    },
    science: {
      kind: 'circuit', cn: '电路连通', teacher: '陈老师', npcId: 'teacher_sci',
      medal: '电路大师铭牌', medalColor: '#4ae86c',
      prompt: '来接一块电路板吗？',
      intro: ['这块电路板还没接通！\n转动接头，把电池和灯泡连起来。\n第一块板很简单，热热身！',
              '第二块板拐了两个弯——\n接口有限，先想好再动手！',
              '终极大板：十二个接头全要用上！\n每转一次都算数——稳住！'],
      clear: ['有点电工的样子了！下一块板拐弯更多。', '漂亮！终极电路板在向你放电——上！'],
      finish: '灯亮了！十二个接头一个没浪费！\n「电路大师铭牌」归你了！',
      fail: ['接头拧错很正常，爱迪生也试了上千次。', '接口省着点用——先想清楚再拧！', '差一点点就亮了！再来，我有的是电路板。'],
      bye: '电路板我留着，随时来电。',
      gradReplay: '大师复审——今天的电路有点意思，接吗？',
      gradDone: '今天复审过了，让灯泡也休息休息。',
      gradWin: '手艺没生疏！这点材料费收好。',
      gradLose: '今天的电路闹脾气，不怪你。明天再战！'
    },
    english: {
      kind: 'arcade', cn: '单词街机', teacher: '吴老师', npcId: 'teacher_en',
      medal: '单词街机奖券', medalColor: '#ffd94c',
      prompt: 'Play a game? 来一局单词街机？',
      intro: ['这台街机是我的宝贝！\n地鼠举着字母，按顺序敲出单词。\n三个字母，小意思！',
              'Level 2! 四个字母的单词——\n地鼠也变快了，Watch out!',
              'Final round! 五个字母大单词——\n敲错一次扣四秒，Be quick!'],
      clear: ['Nice! 升级！下局四个字母！', 'Excellent! 最后一局，五个字母等着你！'],
      finish: 'GAME CLEAR! 全部打通！\n这张「单词街机奖券」送你——You did it!',
      fail: ["Don't worry! 三个字母多敲几遍就熟啦。", 'So close! 四个字母的词多拼几次！', 'Time is up! 五个字母要更专注哦，再来！'],
      bye: 'See you! 街机随时开着。',
      gradReplay: 'Daily practice! 每日一局，保持手感？',
      gradDone: "That's enough for today! 明天再来！",
      gradWin: 'Perfect! 手感还在！奖励拿好！',
      gradLose: "It's OK! 失误是学习的一部分！"
    }
  };
  const TGAME_KIND_CN = { trial: '试炼', hw: '作业', olymp: '奥赛', mini: '签名挑战' };

  // 玩法打卡：单科四玩法（试炼/作业/奥赛/签名挑战）集齐发奖学金
  function markTkind(subj, kind) {
    const f = F();
    f.tkind = f.tkind || {};
    f.tkind[subj] = f.tkind[subj] || {};
    if (f.tkind[subj][kind]) return;
    f.tkind[subj][kind] = true;
    const cfg = TGAME[subj];
    if (Object.keys(f.tkind[subj]).length >= 4) {
      f.gold = (f.gold || 0) + 20;
      UI().toast(` 🎓 ${cfg.teacher}看见你玩遍${cfg.cn}——奖学金 +20 金！ `);
      logEvent(`集齐${cfg.teacher}的四种${cfg.cn}玩法记录`);
    } else {
      UI().toast(` 📔 ${cfg.cn}玩法打卡：${TGAME_KIND_CN[kind]}（${Object.keys(f.tkind[subj]).length}/4） `);
    }
  }

  // 签名挑战主流程：三关递进 → 大师毕业 → 每日复健局
  async function tgameFlow(subj) {
    const cfg = TGAME[subj], f = F();
    f.tgame = f.tgame || {};
    f.tgame[subj] = f.tgame[subj] || { lv: 1 };
    const st = f.tgame[subj], npc = E().getNpc(cfg.npcId);
    if ((st.lv || 1) >= 4) {                                     // 已毕业：每日一局复健
      const ds = daySlot('tgameDay');
      if (ds[subj]) { await say({ name: cfg.teacher, text: cfg.gradDone }); return; }
      await say({ name: cfg.teacher, text: cfg.gradReplay });
      const go = await choose(['来一盘！', '今天先走啦……'], { caption: { name: cfg.teacher, text: cfg.prompt } });
      if (go === 1) { await say({ name: cfg.teacher, text: cfg.bye }); return; }
      const win = await new Promise(res => ADV.Mini.start(cfg.kind, res, { lv: 3 }));
      if (win) {
        ds[subj] = true;
        f.gold = (f.gold || 0) + 6;
        addCup(1);
        markTkind(subj, 'mini');
        E().playAction(npc, 'laugh', 1.2);
        await say({ name: cfg.teacher, text: cfg.gradWin });
        logEvent(`完成${cfg.teacher}的每日复健挑战`);
        save();
      } else {
        E().playAction(npc, 'doubt', 1.2);
        await say({ name: cfg.teacher, text: cfg.gradLose });
      }
      return;
    }
    const lv = st.lv || 1;
    E().playAction(npc, 'wave', 1.4);
    await say({ name: cfg.teacher, text: cfg.intro[lv - 1] });
    const go = await choose(['来一局！', '今天先告辞……'], { caption: { name: cfg.teacher, text: cfg.prompt } });
    if (go === 1) { await say({ name: cfg.teacher, text: cfg.bye }); return; }
    const win = await new Promise(res => ADV.Mini.start(cfg.kind, res, { lv }));
    if (win) {
      markTkind(subj, 'mini');
      E().playAction(npc, 'laugh', 1.4);
      if (lv >= 3) {
        st.lv = 4;                                               // 4 = 大师毕业，此后走每日复健
        addGold(15);
        addCup(3);
        await UI().itemGet(cfg.medal, cfg.medalColor);
        await say({ name: cfg.teacher, text: cfg.finish });
        logEvent(`拿下${cfg.teacher}的「${cfg.cn}」大师奖章`);
      } else {
        st.lv = lv + 1;
        addGold(5);
        await say({ name: cfg.teacher, text: cfg.clear[lv - 1] });
        logEvent(`通过${cfg.teacher}的${cfg.cn}第 ${lv} 关`);
      }
      save();
    } else {
      E().playAction(npc, 'doubt', 1.2);
      await say({ name: cfg.teacher, text: cfg.fail[lv - 1] });
    }
  }

  S.tgameMath = () => tgameFlow('math');
  S.tgameCn = () => tgameFlow('chinese');
  S.tgameSci = () => tgameFlow('science');
  S.tgameEn = () => tgameFlow('english');

  /* —— 自然魔法课 · 蒲老师：动物学/昆虫学教学 + 每日问答 + 捕捉作业 —— */
  const NATURAL_QUIZ = [
    { q: '【自然课】蜜蜂靠什么告诉同伴花蜜在哪里？', opts: ['跳"8 字舞"', '大声鸣叫', '留下脚印'], a: 0 },
    { q: '【自然课】萤火虫为什么会发光？', opts: ['体内荧光素的化学反应', '尾巴里有小灯泡', '反射月光'], a: 0 },
    { q: '【自然课】蜘蛛是昆虫吗？', opts: ['是，都会结网', '不是，蜘蛛有 8 条腿', '幼年是，长大后是'], a: 1 },
    { q: '【自然课】蝉的"耳朵"长在哪里？', opts: ['头顶', '腹部', '翅膀上'], a: 1 },
    { q: '【自然课】壁虎遇到危险时断尾，是为了？', opts: ['减轻体重', '迷惑敌人趁机逃跑', '换个新尾巴更好看'], a: 1 },
    { q: '【自然课】猫头鹰白天呼呼大睡，因为它是？', opts: ['夜行性动物', '太懒了', '怕黑'], a: 0 },
    { q: '【自然课】蚂蚁找到食物后，靠什么给同伴指路？', opts: ['留下的气味（信息素）', '用触角画地图', '一路喊过去'], a: 0 },
    { q: '【自然课】蝴蝶翅膀上滑滑的"粉"其实是？', opts: ['花粉', '细小的鳞片', '露水'], a: 1 },
    { q: '【自然课】蜻蜓的幼虫（水虿）生活在哪里？', opts: ['水里', '树上', '土里'], a: 0 },
    { q: '【自然课】松鼠把坚果埋进土里，是为了？', opts: ['种树绿化校园', '储备过冬的粮食', '磨牙玩'], a: 1 },
    { q: '【自然课】青蛙的幼年叫什么？', opts: ['毛毛虫', '蝌蚪', '雏鸟'], a: 1 },
    { q: '【自然课】狗夏天吐着舌头喘气，是因为？', opts: ['散热（皮肤不会出汗）', '表演杂技', '舌头痒'], a: 0 }
  ];
  const NATURAL_TIPS = [
    '蝴蝶的味觉长在脚上——它们是用「脚」品尝花蜜的。',
    '蜻蜓一生大部分时间都活在水中，我们看到的飞舞，只是它生命的最后一章。',
    '猫的呼噜声频率能促进骨骼愈合——它们在给自己做魔法治疗。',
    '蚂蚁从高处落下不会摔伤，空气阻力对它们来说就像一张柔软的大网。',
    '萤火虫的光是「冷光」，几乎不发热，效率是灯泡的几十倍。',
    '松鼠埋下的坚果有一半会被遗忘，于是长成了新的树——它们是森林的园丁。',
    '螳螂的前足像两把镰刀，捕猎只要 0.05 秒——比眨眼快十倍。',
    '蜜蜂一公斤蜂蜜，要飞大约十万公里才能酿成，相当于绕地球两圈半。'
  ];
  S.teacherPu = async ent => {
    const f = F();
    const day = ADV.Cal.day;
    f.hwNat = f.hwNat || {};
    const Col = ADV.Collect;
    const caught = () => Col.catCount('critters');
    // —— 初见：介绍自然魔法课，送捉虫网 ——
    if (!f.metPu) {
      f.metPu = true;
      E().playAction(ent, 'wave', 1.4);
      await say({ name: '蒲老师', text: '欢迎来到自然魔法课！我是蒲老师。\n动物和昆虫，是世界上最了不起的魔法师。' });
      await say({ name: '蒲老师', text: '草丛里的虫鸣、水边的动静——那就是活的咒语书。\n带上工具，把它们收录进你的生物图鉴吧！' });
      if (!Col.count('bugNet')) {
        Col.addItem('bugNet');
        await UI().itemGet('捉虫网', '#a8e063');
        await say({ name: '蒲老师', text: '这把捉虫网送你。对着有虫鸣的草丛挥网——\n水边和小兽的窝点，以后可以用草编笼下套。' });
      }
      UI().toast(' ✨ 自然魔法课开课！按 F 打开手册 → 收藏页查看生物图鉴 ');
      ADV.Audio.sfx('save');
      save();
      return;
    }
    // —— 捕捉作业完成结算（先进菜单前结算） ——
    if (f.hwNat.taskDay === day && caught() > (f.hwNat.base || 0)) {
      f.hwNat.taskDay = 0;
      // 奖励分两档：基础三件（网/笼/钓竿）没集齐先补基础，集齐后进阶好网/宝网/大笼/彩笼
      const base = ['bugNet', 'basket', 'fishingRod'].filter(r => !Col.count(r));
      const adv = ['fineNet', 'bigCage', 'goldNet', 'colorCage'].filter(r => !Col.count(r));
      const pool = base.length ? base : adv;
      const rid = pool.length ? pool[day % pool.length] : 'bait';
      Col.addItem(rid, rid === 'bait' ? 3 : 1);
      const it = Col.itemInfo(rid);
      await UI().itemGet('作业奖励·' + it.name + (rid === 'bait' ? ' ×3' : ''), '#a8e063');
      f.gold = (f.gold || 0) + 10;
      addCup(1);
      E().playAction(ent, 'laugh', 1.4);
      await say({ name: '蒲老师', text: '新记录收到！观察力满分！\n这是你的奖励——金币 +10 · 学院分 +1。' });
      logEvent('完成了蒲老师的捕捉作业');
      save();
    }
    // —— 主菜单 ——
    const quizDone = f.hwNat.quizDay === day;
    const taskTaken = f.hwNat.taskDay === day;
    f.tame = f.tame || {};
    const pick = await choose([
      quizDone ? '自然问答（今日已完成）' : '自然问答（每日三题）',
      taskTaken ? `捕捉作业（进行中 ${caught()}/42）` : '捕捉作业（每日一捕）',
      '听一课（动物学·昆虫学）',
      f.tame.chart ? '克制环讲堂（出师·温习）' : '克制环讲堂（讲一节）', '先告辞'
    ], { caption: { name: '蒲老师', text: '想学点自然魔法吗？' } });
    if (pick === 0) {
      if (quizDone) { await say({ name: '蒲老师', text: '今天的问答已经完成，明天会有新题目！' }); return; }
      const wrongs = { n: 0 };
      const qs = seededShuffle(NATURAL_QUIZ, day * 17 + 5).slice(0, 3);
      for (let i = 0; i < qs.length; i++) await ask('蒲老师', qs[i], wrongs, ent, 'science');
      if (wrongs.n === 0) {
        f.hwNat.quizDay = day;
        f.gold = (f.gold || 0) + 8;
        addCup(1);
        Col.addItem('bait', 2);
        const it = Col.itemInfo('bait');
        await UI().itemGet('奖励·' + it.name + ' ×2', '#c8a06a');
        await say({ name: '蒲老师', text: '全对！你对自然的感悟很敏锐。\n这几条蚯蚓送你，钓鱼时用得上。明天还有新题目！' });
        logEvent('通过了蒲老师的自然问答');
        save();
      } else {
        await say({ name: '蒲老师', text: `错了 ${wrongs.n} 次。自然的奥秘要用脚步去丈量，\n明天再来挑战吧！` });
      }
      return;
    }
    if (pick === 1) {
      if (taskTaken) {
        await say({ name: '蒲老师', text: `今天的作业：再收录一种新生物！\n（图鉴进度 ${caught()} / ${Col.totalOf('critters')}，收录后回来找我领奖励）` });
        return;
      }
      f.hwNat.taskDay = day;
      f.hwNat.base = caught();
      await say({ name: '蒲老师', text: `今日作业：收录一种新的生物到图鉴！\n（图鉴进度 ${caught()} / ${Col.totalOf('critters')}）\n对着虫鸣的草丛挥网、在水边下笼——\n完成后来找我，捉虫网、草编笼、鱼竿都可能送哦！` });
      save();
      return;
    }
    if (pick === 2) {
      E().playAction(ent, 'read', 1.6);
      await say({ name: '蒲老师', text: NATURAL_TIPS[day % NATURAL_TIPS.length] });
      return;
    }
    if (pick === 3) {                                  // 克制环讲堂（s12.1）：讲三系相克，随堂三问出师
      E().playAction(ent, 'read', 1.6);
      if (f.tame.chart) {
        await say({ name: '蒲老师', text: '相克环温习——' + NATURAL_TIPS[day % NATURAL_TIPS.length] });
        return;
      }
      await say({ name: '蒲老师', text: '自然魔法的第一课，是「属性相克」——\n虫克水、水克兽、兽克虫，环环相扣。' });
      await say({ name: '蒲老师', text: '克制打出去是 ×1.5 的「效果绝佳」，\n被克制就只剩 ×0.75——选对对手，事半功倍。' });
      await say({ name: '蒲老师', text: '把相克环记进心里，战斗时我教的口诀\n会一直亮在画面上。来，随堂三问！' });
      const wrongs = { n: 0 };
      const qs = seededShuffle(TAMING_QUIZ.filter(q => q.chart), day * 29 + 7).slice(0, 3);
      for (let i = 0; i < qs.length; i++) await ask('蒲老师', qs[i], wrongs, ent, 'science');
      if (wrongs.n === 0) {
        f.tame.chart = true;
        f.gold = (f.gold || 0) + 8; addCup(1);
        ADV.Audio.sfx('quest');
        UI().toast(' ✨ 学会「克制直觉」——宠物战中常显属性优劣 ');
        await say({ name: '蒲老师', text: '全对！从今往后，相克环就是你的直觉了。\n（宠物战中常显本场优劣，好好用它！）' });
        logEvent('听完蒲老师的克制环讲堂');
        save();
      } else {
        await say({ name: '蒲老师', text: `错了 ${wrongs.n} 次。相克环要背到滚瓜烂熟，\n明天再来听一节吧！` });
      }
      return;
    }
  };

  // —— 同学们 ——
  S.xiaoming = async (ent) => {
    E().emote(ent, '?');
    if (await ngReunion('xiaoming')) return;
    if (F().finalPassed) { await say({ name: '小明', text: '你去了后山？！还去了更深处？！\n下次一定要带上我！' }); return; }
    if (F().gotComic && !F().comicReturned) {
      E().playAction(ent, 'laugh', 1.6);                          // 小明破涕为笑
      await say({ name: '小明', text: '哇！我的《冒险王》第 12 卷！！\n你居然在课桌里找到了，太感谢啦！' });
      F().comicReturned = true;
      save();
      UI().toast(' 支线完成：小明的漫画书 ');
      await say({ name: '小明', text: '告诉你个秘密——我看见那只小猫\n老往后山的方向跑，好像在等你跟着它！' });
      return;
    }
    if (!F().gotComic && !F().comicReturned) {
      F().heardComic = true;
      await say({ name: '小明', text: '呜呜……我把最爱的《冒险王》第 12 卷\n落在教室的课桌里了——靠窗第二排、\n发着光的那个抽屉！你帮我找找好吗？' });
    }
    const b = F().badges;
    if (!b.math) await say({ name: '小明', text: '王老师的数学题可有点难度……\n不过我相信你可以的！教室就在北边的教学楼。' });
    else if (!b.chinese) await say({ name: '小明', text: '你已经拿到数学徽章了？！\n快去图书馆找李老师吧，她的语文题我最怕了。' });
    else if (!b.science) await say({ name: '小明', text: '只剩科学徽章了！\n实验楼在西北边，陈老师人很好的。' });
    else if (!b.english) await say({ name: '小明', text: '就差英语徽章了！\n外语楼在池塘北边，吴老师的单词题不难的！' });
    else await say({ name: '小明', text: '四枚徽章都齐了？！\n后山的石门……会有什么在等你呢？' });
  };

  S.xiaohong = async (ent) => {
    E().emote(ent, '♥');
    if (await ngReunion('xiaohong')) return;
    if (F().finalPassed) { await say({ name: '小红', text: '听说后山更深处有个星空庭园！\n小猫也在那里？真想去看一眼……' }); return; }
    if (F().gotHairpin && !F().hairpinReturned) {
      E().playAction(ent, 'laugh', 1.6);                          // 小红喜笑颜开
      await say({ name: '小红', text: '呀！这不是我的发卡吗！！\n你在池塘边找到的？太谢谢你了！' });
      F().hairpinReturned = true;
      save();
      UI().toast(' 支线完成：小红的发卡 ');
      await say({ name: '小红', text: '对了，外语楼的吴老师人特别好，\n她的英语试炼……多背单词准没错！' });
      await say({ name: '小红', text: '操场的小刚才还念叨着要和你较量呢，\n小心他哦～' });
      return;
    }
    if (!F().hairpinReturned) {
      F().heardHairpin = true;
      await say({ name: '小红', text: '呜……今天跑步的时候，\n我最喜欢的发卡不见了。' });
      await say({ name: '小红', text: '食堂的小胖整天在食堂晃悠，\n他眼睛最尖了，说不定看见了呢！' });
      return;
    }
    await say({ name: '小红', text: '我在操场上跑了十圈啦！\n学习也要像跑步一样，每天坚持哦。' });
  };

  S.xiaogang = async (ent) => {
    const f = F();
    E().emote(ent, '!');
    // 厌恶感：说话不分场合会让小刚生气
    if (friend('xiaogang').love < 15) {
      const t = await choose(['安慰他', '「跑步有什么用」'], { caption: { name: '小刚', text: '哼……又要加练了。\n哥的纪录，还差两秒。' } });
      if (t === 1) {
        E().playAction(ent, 'cry', 1.4);
        await say({ name: '小刚', text: '你、你懂什么！！\n（他气得跑走了……好像真的伤心了）' });
        gainBond('xiaogang', -5);
        return;
      }
      await say({ name: '小刚', text: '哼，用不着你安慰！\n……不过，谢了。' });
      gainBond('xiaogang', 3);
      return;
    }
    if (F().finalPassed) {
      await say({ name: '小刚', text: '后山发光的那晚，我看见一道影子溜上去——\n是那只小猫！它还好吗？' });
      return;
    }
    if (!F().hairpinReturned) {
      await say({ name: '小刚', text: '小红姐今天跑着跑着突然停下来了，\n好像是丢了什么东西……你去看看她吧！' });
      return;
    }
    /* —— P-B2 微剧情二号线 ③：给爸爸的纪录（三段：心愿 → 器材室借秒表 → 破纪录） —— */
    if (f.recordChain === 1) {
      await say({ name: '小刚', text: '秒表！体育馆器材室肯定有——\n叔叔借东西一直很痛快。拜托了！' });
      return;
    }
    if (f.recordChain === 2) {
      f.recordChain = 3;
      E().playAction(ent, 'cheer', 1.8);
      ADV.Audio.sfx('fanfare');
      await say({ text: '你举起秒表站在终点——\n发令的声音是 wind，不是枪，但一样响。' });
      await say({ text: '他冲线的瞬间，你按下按钮。\n——比他爸的旧纪录快了 0.4 秒。' });
      await say({ name: '小刚', text: '几秒？！快了 0.4？！\n哈……哈哈！爸！看到了吗！！' });
      await say({ text: '他冲着天空喊完，有点不好意思地挠头。\n你把秒表和这一秒的欢呼都拍了下来。' });
      ADV.Collect.gain('photos', 'p_record');            // 回忆照片：打破纪录的秒表
      f.gold = (f.gold || 0) + 8;
      gainBond('xiaogang', 10);
      addCup(5);
      logEvent('帮小刚计时，他打破了爸爸的旧纪录');
      save();
      UI().toast(' ⏱ 微剧情完成：给爸爸的纪录 ');
      return;
    }
    if (!f.recordChain) {
      const g = await choose(['「包在我身上」', '「你自己不行吗」'], { caption: { name: '小刚', text: '……我说个事儿，你别笑。\n我爸在外地修高铁，走之前说：\n「下回来，我要看你破我的纪录。」\n可是没人给我计时……' } });
      if (g === 0) {
        f.recordChain = 1;
        await say({ name: '小刚', text: '真的？！那——帮我去借块秒表！\n（体育馆的器材室，就那个小窗口）' });
        logEvent('小刚想打破爸爸的旧纪录，差一块秒表');
        save();
      } else {
        E().playAction(ent, 'cry', 1.2);
        await say({ name: '小刚', text: '哼！我自己……也不是不行！\n（他嘴硬着，耳朵红了）' });
      }
      return;
    }
    await say({ name: '小刚', text: '哼哼，跑步我还是不会输的！\n……不过英语单词我是真背不下来，外语楼就拜托你了！' });
  };

  S.xiaopang = async (ent) => {
    if (!F().gotBread) {
      E().emote(ent, '…');
      await say({ name: '小胖', text: '面包……面包……\n阿姨的芝麻面包，全被预定完啦……' });
      await say({ name: '小胖', text: '（他看起来饿得不行。\n先去柜台找阿姨聊聊吧？）' });
      return;
    }
    if (!F().breadShared) {
      E().emote(ent, '♥');
      await say({ name: '小胖', text: '好香！是新出炉的芝麻面包！\n……可、可以分我一半吗？' });
      F().breadShared = true;
      save();
      UI().toast(' 你把面包分给了小胖 ');
      E().playAction(ent, 'laugh', 1.4);
      await say({ name: '小胖', text: '嗷呜太好吃了！谢谢你！\n报答你——告诉你一个秘密！' });
      await say({ name: '小胖', text: '昨天我在喷泉东北边的池塘边，\n看见水草里有什么东西亮晶晶的！' });
      return;
    }
    await say({ name: '小胖', text: '嗝——谢谢上次的面包！\n你真是个大好人！' });
  };

  S.cat = async (ent) => {
    const f = F();
    E().emote(ent, '♥');
    E().playAction(ent, ['sleep', 'groom', 'play'][(Math.random() * 3) | 0], 2);   // 摆个猫姿势
    if (F().bell) {
      // 铃铛分支：分级互动菜单（仿煤球形态）——好感越高解锁越多动作
      const b = friend('cat');
      const lvl = b.love >= 70 ? 3 : b.love >= 40 ? 2 : b.love >= 15 ? 1 : 0;
      await say({ name: (ent && ent.name) || '小猫', text: '喵！！（它盯着你包里的猫铃铛，\n两眼放光，尾巴摇成了风车）' });
      const acts = ['摸摸毛（亲密度 +3）'];
      if (lvl >= 1) acts.push('玩逗猫（表演翻跟头）');
      if (lvl >= 2) acts.push('跟着它走（捡小礼物）');
      if (lvl >= 3) acts.push('喵语心声（问问近况）');
      const i = await choose(acts.concat('下次再玩'), { caption: { name: '小猫', text: `喵～（亲密度 ${b.love}/100 · Lv.${lvl}${lvl < 3 ? `，${[15, 40, 70][lvl]} 解锁更多互动` : '·完全信任你'}）` } });
      const act = acts[i];
      if (!act) return;
      if (act.startsWith('摸摸毛')) {
        if (f.catDay === ADV.Cal.day) { E().emote(ent, '♥'); await say({ name: '小猫', text: '呼噜呼噜……（它今天被摸得很满足，明天再来）' }); return; }
        f.catDay = ADV.Cal.day;
        gainBond('cat', 3);
        await say({ name: '小猫', text: '呼噜呼噜～♪（它把下巴搁在你手心）' });
      } else if (act.startsWith('玩逗猫')) {
        if (f.catDay === ADV.Cal.day) { E().emote(ent, '♥'); await say({ name: '小猫', text: '（它翻了个身晒肚皮，\n今天玩够啦，明天再来）' }); return; }
        f.catDay = ADV.Cal.day;
        gainBond('cat', 2);
        E().playAction(ent, 'play', 1.6);
        const g = 3 + ((Math.random() * 6) | 0);
        f.gold = (f.gold || 0) + g;
        await say({ name: '小猫', text: `喵呜！（一个漂亮的翻跟头——\n围观同学纷纷打赏。💰 +${g}）` });
      } else if (act.startsWith('跟着它走')) {
        // 每日一次：随机小礼——金币 / 鲜鱼 / 未收集的落叶（与落叶册收集线呼应）
        if (f.catWalkDay === ADV.Cal.day) { await say({ name: '小猫', text: '（它打了个哈欠，今天带的路够多了）' }); return; }
        f.catWalkDay = ADV.Cal.day;
        E().playAction(ent, 'play', 1.8);
        const un = ADV.Collect.DB.leaves.filter(x => !ADV.Collect.has('leaves', x.id));
        const r = Math.random();
        if (r < .4) {
          const g = 10 + ((Math.random() * 7) | 0);
          f.gold = (f.gold || 0) + g;
          await say({ name: '小猫', text: `它领着你刨开落叶堆——\n里面躺着几枚硬币！💰 +${g}` });
        } else if (r < .75 || !un.length) {
          ADV.Collect.addItem('fish', 1);
          await say({ name: '小猫', text: '它蹲在水边一动不动，\n忽然一爪子拍出一条鱼！\n（鲜鱼 ×1 入背包——真·猫式钓鱼）' });
        } else {
          const leaf = un[(Math.random() * un.length) | 0];
          ADV.Collect.gain('leaves', leaf.id);
          await say({ name: '小猫', text: `它把一片完好的${leaf.name}推到你脚边，\n喵了一声，像是说「拿去吧」。` });
        }
      } else {
        // 喵语心声：今日/明日大事播报；没有大事就提示一处未完成的收藏
        const evs = upcomingEvents().rows[0].evs.concat(upcomingEvents().rows[1].evs);
        if (evs.length) {
          await say({ name: '小猫', text: `喵——！（它盯着校门的方向）\n（${evs[0]}……它好像在提醒你）` });
        } else {
          const un2 = ADV.Collect.DB.leaves.filter(x => !ADV.Collect.has('leaves', x.id));
          await say({ name: '小猫', text: un2.length
            ? `它拍拍你的落叶册，又望向校园深处——\n（好像还有「${un2[0].name}」没集齐）`
            : '喵～♪（它眯起眼睛，\n一副「一切都安排好了」的表情）' });
        }
      }
      save();
      return;
    }
    if (ADV.Collect.count('fish') > 0) {
      const ci = await choose(['把鲜鱼分它一半', '自己留着'], { caption: { name: '小猫', text: '它盯着你手里的鱼，\n尾巴摇得像拨浪鼓。' } });
      if (ci === 0) {
        ADV.Collect.useItem('fish', 1);
        gainBond('cat', 8);
        ADV.Audio.sfx('cat');
        await say({ name: '小猫', text: '喵呜——！\n（它叼着鱼飞快跑开，又回头叫了一声）' });
        logEvent('把钓到的鱼分给了小猫');
        save();
        return;
      }
    }
    const lines = [
      '喵～♪（它蹭了蹭你的裤脚）',
      '喵呜……（它打了个哈欠）',
      '喵！（它追着自己的尾巴转圈圈）'
    ];
    await say({ name: (ent && ent.name) || '小猫', text: lines[(Math.random() * lines.length) | 0] });
  };

  // —— 食堂阿姨 ——
  S.aunt = async () => {
    E().playAction(E().getNpc('aunt'), 'laugh', 1.6);            // 阿姨热情大笑
    await teachRecipe('aunt');                                    // 料理教学（好感达标自动教）
    // —— 钓到的鱼：做菜 / 卖给食堂 ——
    if (ADV.Collect.count('fish') > 0) {
      const fi = await choose(['交给阿姨做菜（红烧鱼）', '把鱼卖给食堂（每条 20 金）', '先不吃'], {
        caption: { name: '食堂阿姨', text: `哟，拎着鲜鱼来啦？\n（身上有 ${ADV.Collect.count('fish')} 条）` }
      });
      if (fi === 0) {
        ADV.Collect.useItem('fish', 1);
        ADV.Collect.addItem('grilledFish', 1);
        ADV.Audio.sfx('item');
        gainBond('aunt', 3);
        await ADV.UI.itemGet('红烧鱼（战斗中回复 40）', '#ff9a5a');
        await say({ name: '食堂阿姨', text: '下锅前先用姜片擦一遍锅，\n鱼皮才不会破——记着点！' });
        save();
        return;
      }
      if (fi === 1) {
        ADV.Collect.useItem('fish', 1);
        F().gold = (F().gold || 0) + 20;
        ADV.Audio.sfx('save');
        await say({ name: '食堂阿姨', text: '食堂正缺鱼呢，\n一条按 20 金收，公道吧？' });
        save();
        return;
      }
    }
    if (!F().gotBread) {
      await say({ name: '食堂阿姨', text: '哎呀，是新同学！\n来来来，刚出炉的芝麻面包！' });
      await ADV.UI.itemGet('热乎乎的面包', '#ffb84a');
      F().gotBread = true;
      save();
      await say({ name: '食堂阿姨', text: '吃饱了才有力气冒险！\n今天的菜谱：红烧肉、糖醋排骨、清炒时蔬～' });
    } else {
      await say({ name: '食堂阿姨', text: '还想吃呀？\n冒险家也不能贪吃哦，哈哈！' });
    }
  };

  // —— 石门 ——
  S.stoneDoor = async () => {
    const f = F();
    if (f.gateOpen) {
      await say({ text: '石门敞开着，门内传来神秘的微风……\n（走上前去即可进入后山秘境）' });
      return;
    }
    const b = f.badgeEver || f.badges;   // 按"曾经拿到过"判断，每日重置不影响主线
    if (b.math && b.chinese && b.science && b.english) {
      ADV.Audio.sfx('open');
      // 黑屏期间替换石门贴图再淡入；脚本内等待淡入淡出，保证时序确定
      await new Promise(res => ADV.Engine.fadeTo(1, .6, res));
      f.gateOpen = true;
      ADV.Engine.setObjectOpen('stoneDoor', true);
      await new Promise(res => ADV.Engine.fadeTo(0, .6, res));
      await say({ text: '隆隆隆——！\n四枚徽章在石门上闪耀，古老的石门缓缓开启！' });
      UI().toast(' 后山秘境已开启！ ');
      save();
    } else {
      await say({ text: '石门纹丝不动。\n门上刻着四个凹槽，似乎在等待四枚智慧徽章……' });
      const n = (b.math ? 1 : 0) + (b.chinese ? 1 : 0) + (b.science ? 1 : 0) + (b.english ? 1 : 0);
      await say({ text: `（徽章收集进度：${n} / 4）` });
    }
  };

  // —— 后山守门人：最终试炼 ——
  S.keeper = async (ent) => {
    const f = F();
    if (f.finalPassed) {
      E().emote(ent, '★');
      if (f.hist && f.hist[1] && f.hist[2] && f.hist[3] && !f.keeperHist) {
        f.keeperHist = true;
        await say({ name: '神秘老人', text: '……你把缺页都找到了。\n那我说给你听：她是我们班的班长，我留级那年，\n是她每天陪我补课。' });
        await say({ name: '神秘老人', text: '毕业那天，她把「门」交给我——\n说等一个集齐徽章的孩子。\n我等了一百年，等到了你们。' });
        gainBond('keeper', 10);
        addCup(6);
        save();
        return;
      }
      await say({ name: '神秘老人', text: '祭坛已经苏醒，新的道路在星光中延伸……\n我的孙女星儿就在庭园深处等你。' });
      return;
    }
    if (!f.gateOpen) return;
    const kn = ent && ent.id === 'keeper' ? ent : E().getNpc('keeper');
    E().playAction(kn, 'think', 1.8);                            // 老人捋须沉思
    await say({ name: '神秘老人', text: '……你终于来了，持有四枚徽章的孩子。' });
    await say({ name: '神秘老人', text: '我是这座秘境的守门人。\n想点亮祭坛、开启新的道路，需通过最终试炼。' });
    const go = await choose(['接受最终试炼！', '让我再想想'], { caption: { name: '神秘老人', text: '六道题，横跨数学、语文、英语与科学。\n——你，准备好了吗？' } });
    if (go === 1) { await say({ name: '神秘老人', text: '祭坛不会消失，我在此等你。' }); return; }

    const wrongs = { n: 0 };
    for (const item of shuffle(QUIZ.final).slice(0, 6)) await ask('神秘老人', item, wrongs, kn, '综合');

    ADV.Audio.sfx('fanfare');
    E().playAction(kn, 'laugh', 1.8);                            // 老人大笑
    E().playAction(E().player, 'raise', 1.4);                    // 玩家高举双手
    await say({
      name: '神秘老人',
      text: wrongs.n === 0 ? '完美无瑕……！我等待百年，终于等到了你。' : '历经波折而不屈——这才是真正的智慧。'
    });
    await ADV.UI.itemGet('智慧之心', '#ffd94c');
    f.finalPassed = true;
    ADV.Engine.setObjectOpen('altar', true, 'glow');
    save();
    await say({ name: '神秘老人', text: '去吧，触碰祭坛，见证属于你的时刻。' });
  };

  // —— 祭坛（通关触发点） ——
  S.altar = async () => {
    if (!F().finalPassed) {
      await say({ text: '古老的祭坛沉睡着。\n中央的水晶暗淡无光……似乎需要「智慧之心」来唤醒。' });
      return;
    }
    ADV.Audio.sfx('fanfare');
    await say({ text: '你将智慧之心放上祭坛——\n水晶绽放出耀眼的光芒！' });
    ADV.Main.startEnding();
  };

  // —— 告示牌 / 木牌 ——
  S.board = async () => {
    const b = F().badges, stage = guideStage();
    if (stage !== 'full') {
      await say({
        name: '校务板',
        text: `【新生提示】每天放学前来这里打一题卡，\n晚上才能安心睡觉。\n今天先熟悉校园，挑一位老师聊聊就很好。`
      });
    } else {
      await say({
        name: '校务板',
        text: `【本学期大事件】智慧徽章挑战赛！\n数学（${b.math ? '✔' : '✘'}） 语文（${b.chinese ? '✔' : '✘'}）\n科学（${b.science ? '✔' : '✘'}） 英语（${b.english ? '✔' : '✘'}）\n集齐四枚徽章者，可开启后山石门。`
      });
    }
    await S.boardCheck();   // 每日一题打卡 / 周测 / 月考 / 校园大事件都在这块板上
  };
  S.welcome = async () => {
    if (guideStage() === 'arrival') {
      await say({ name: '木牌', text: '「阳光中学」\n喷泉在中央，校长常在那儿等新同学。' });
      return;
    }
    await say({ name: '木牌', text: '「阳光中学」\n—— 今天也要开心地学习和冒险！' });
  };
  S.hillSign = async () => { await say({ name: '木牌', text: '「后山秘境 · 闲人免进」\n（下面还有一行小字：持徽章者除外）' }); };
  // —— 自然魔法角指路牌：生物收集触发引导（虫鸣点 / 窝点在哪、用什么工具） ——
  S.natureSign = async () => {
    const Col = ADV.Collect;
    await say({
      name: '自然魔法角 · 观察手记',
      text: `【生物收集指南】\n① 虫鸣的草丛（后山 ×2 · 河湾 ×1）：${Col.count('bugNet') ? '挥捉虫网！' : '需要捉虫网'}\n② 灌木水边窝点（小镇各处）：${Col.count('basket') ? '下草编笼！' : '需要草编笼'}\n③ 时段/季节/天气不同，出没的生物也不同。\n进度见 F 手册 → 收藏页；蒲老师每天有捕捉作业。`
    });
  };
  // 校车站牌：家 ↔ 学校 快速通勤（免费环线）
  S.busStop = async () => {
    const toSchool = ADV.Engine.map.id === 'homeYard';
    const dest = toSchool
      ? { id: 'campus', x: 2, y: 15, dir: 'down', name: '阳光中学 · 西门' }
      : { id: 'homeYard', x: 13, y: 9, dir: 'down', name: '家 · 院子' };
    const go = await choose([`乘车去「${dest.name}」`, '等下一班'],
      { caption: { name: '🚌 校车站牌', text: '「校车环线 · 全天免费」\n下一站：' + dest.name } });
    if (go === 1) { await say({ text: '你决定再待一会儿。\n校车缓缓驶走了。' }); return; }
    await say({ text: '校车「哐当」一声停稳，\n你跳了上去……' });
    ADV.Game.busy = true;
    ADV.Audio.sfx('save');
    await new Promise(res => ADV.Engine.fadeTo(1, .6, res));
    ADV.Engine.loadMap(dest.id, dest.x, dest.y, dest.dir);
    await new Promise(res => ADV.Engine.fadeTo(0, .6, res));
    ADV.Game.busy = false;
    UI().toast(' 🚌 「' + dest.name + '」到了 ');
    save();
  };
  S.gate = async () => { await say({ text: '校门紧闭。\n广播里传来声音：「冒险尚未完成，请同学们继续探索校园！」' }); };
  S.shelfPeek = async () => { await say({ name: '书架', text: '一排排书脊整齐排列……\n《海底两万里》《昆虫记》《小王子》……真想都读一遍。' }); };

  // —— 学生们（有日常动作的背景人物） ——
  S.studentLib = async (ent) => {
    if (ent && ent.pose === 'sleep') { E().emote(ent, '♪'); await say({ name: '学生', text: 'Zzz……（他抱着书睡着了，\n嘴里还嘟囔着“床前明月光……”）' }); return; }
    E().emote(ent, '♪');
    await say({ name: '学生', text: '嘘——我在看《小王子》呢。\n“真正重要的东西，用眼睛是看不见的。”' });
  };
  S.studentClass = async (ent) => {
    E().emote(ent, '?');
    if (ent && ent.pose === 'sleep') { await say({ name: '同学', text: 'Zzz……（上课睡着了吧！\n口水都快流到课本上了……）' }); return; }
    await say({ name: '同学', text: '王老师的数学课有点难……\n不过答错也没关系，可以一直重试的！' });
  };
  S.studentCanteen = async (ent) => {
    E().emote(ent, '♥');
    await say({ name: '同学', text: '吃饱了吃饱了～\n阿姨打菜从不手抖，这就是传说中的干饭人幸福！' });
  };
  S.studentEn = async (ent) => {
    E().emote(ent, '♪');
    await say({ name: '同学', text: 'How are you? —— I am fine!\n吴老师的单词卡片可有趣啦！' });
  };

  // —— 支线调查点 ——
  S.pond = async () => {
    if (F().gotHairpin || F().hairpinReturned) {
      await say({ text: '水面上映着你的影子。\n（这里已经什么也没有了）' });
      return;
    }
    if (F().breadShared) {
      await say({ text: '你蹲在池塘边仔细搜寻——\n水草间有什么东西闪闪发亮！' });
      await ADV.UI.itemGet('小红的发卡', '#ff8ab0');
      F().gotHairpin = true;
      save();
      UI().toast(' 似乎是……小红的发卡？ ');
      return;
    }
    await say({ text: '一只青蛙扑通跳进水里，漾起圈圈涟漪。\n（好像缺了点寻找的契机……）' });
  };

