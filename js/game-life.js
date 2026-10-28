/* =========================================================
 * game-life.js —— 游戏剧情拆分段 7/8
 * 信箱 · 阅读摘抄 · 书的守护者 · 跳蚤市场
 * 必须按 core → event → scene → quest → retro → town → life → save 顺序加载。
 * ========================================================= */
  /* ==================== 信箱 + 清晨拜访（星露谷 mail / 难忘的暑假拜访） ==================== */
  function genMail() {
    const f = F(), C = ADV.Cal;
    f.mail = f.mail || [];
    const letters = [];
    // 1) 老师评语（考试后）
    if (f.mExam && !f.mailTeacherNote && C.day >= 16) {
      f.mailTeacherNote = true;
      letters.push({ from: '王老师', title: '月考评语', text: '这次月考的卷面比上次工整。\n错题都在错题本里了——\n下次，让它们毕业。' });
    }
    // 2) 生日邀请（任意好友 3 天内过生日）
    const bds = Object.keys(BOND_META).filter(id => {
      const d = BOND_META[id].bday - C.day;
      return d > 0 && d <= 3 && friend(id).stage >= 1;
    });
    if (bds.length && Math.random() < .8) {
      const id = bds[0];
      letters.push({ from: BOND[id].name, title: '生日邀请', text: `我的生日是第 ${BOND_META[id].bday} 天。\n要是能收到你的礼物，\n会是最好的一年。` });
    }
    // 3) 同伴随机问候（好感 ≥ 知己）
    const close = Object.keys(state.friends).filter(id => state.friends[id].stage >= 2 && BOND[id]);
    if (close.length && Math.random() < .6) {
      const id = close[(Math.random() * close.length) | 0];
      const lines = {
        xiaohong: '明天操场见？我跑慢点等你。',
        xiaoming: '最新一话的草稿画完了！\n第一个给你看。',
        wuyun: '无大事。就是问问你，还活着吗。',
        mom: '冰箱里有西瓜。放学回来吃。',
        jinpeng: '下次比武，我不会手下留情。\n……注意休息。'
      };
      letters.push({ from: BOND[id].name, title: '问候', text: lines[id] || '最近好吗？\n有空来找我说说话。' });
    }
    // 4) 学院快报（月度）
    if (C.day % 10 === 1) {
      letters.push({ from: '学院快报', title: `第 ${Math.ceil(C.day / 10)} 期`, text: `本月学院分：${f.cup || 0}\n竞技场纪录：${f.arenaBest || 0} 连\n${nextGoal()}` });
    }
    for (const l of letters) { l.day = C.day; l.read = false; f.mail.unshift(l); }
    if (f.mail.length > 10) f.mail.length = 10;
    if (letters.length) events2.push('📬 门口信箱有 ' + letters.length + ' 封新信');
  }
  const events2 = [];                                    // genMail 事件缓冲（sleepCommon toast 用）——简单起见直接 toast
  S.mailbox = async () => {
    const f = F();
    if (!f.mail || !f.mail.length) { await say({ text: '（信箱空空的。\n谁会给我写信呢……）' }); return; }
    const unread = f.mail.filter(l => !l.read);
    if (!unread.length) { await say({ text: '（信都读过了，\n纸香还在）' }); return; }
    for (const l of unread.slice(0, 3)) {
      l.read = true;
      await say({ name: `📬 ${l.from} · ${l.title}`, text: l.text });
    }
    const left = f.mail.filter(l => !l.read).length;
    if (left) await say({ text: `（还有 ${left} 封未读）` });
    else UI().toast(' 📬 信件全部读罢 ');
    save();
  };

  function genVisitor() {
    const f = F();
    f.visitor = '';
    // 25% 概率：一位知己级同伴清晨来家门口找你
    const close = Object.keys(state.friends).filter(id => state.friends[id].stage >= 2 && BOND[id] && ['xiaoming', 'xiaohong', 'xiaogang', 'xiaopang', 'wuyun', 'momo', 'jinpeng'].includes(id));
    if (close.length && Math.random() < .25) {
      f.visitor = close[(Math.random() * close.length) | 0];
      UI().toast(` 🚪 ${BOND[f.visitor].name}一大早就在门口等你！`);
    }
  }
  const VISITOR_LINES = {
    xiaoming: ['我带了新出的漫画！一起看！', '走，书店新品到了！'],
    xiaohong: ['晨跑搭档，就缺你了。', '今天教你怎么呼吸跑！'],
    xiaogang: ['……路过。顺便。找你玩。', '天台，就现在。'],
    xiaopang: ['阿姨做了新的点心，快！', '陪我吃早饭去～'],
    wuyun: ['带你去个只有我知道的地方。', '晨练吗？我让你一只手。'],
    momo: ['实验室今早有新试剂……', '一起去做自由实验？'],
    jinpeng: ['晨间训练，敢来吗？', '今天要赢过你。']
  };
  // —— P0：栖霞小区 8 间同学家的独家拜访事件 ——
  const HOME_EVENTS = {
    xmHome: async () => {
      await say({ name: '小明', text: '欢迎来到我的漫画基地！\n（整面墙都是原稿）' });
      if (ADV.Growth) ADV.Growth.addDim('art', 2, '参观漫画墙');
      await say({ text: '他翻出最新一话与你分享。\n（技艺 +2 · 心情大好）' });
    },
    xhHome: async () => {
      await say({ name: '小红', text: '轻点走……妈妈刚睡下。' });
      await say({ text: '你看见奖牌墙旁挂着\n一张「加油！妈妈」的手绘卡片。\n（心性 +2 · 更懂她了）' });
      if (ADV.Growth) ADV.Growth.addDim('mind', 2, '读懂了小红');
    },
    xgHome: async () => {
      await say({ text: '小刚慌忙把琴塞回柜子，\n但琴声还飘在空气里。' });
      await say({ name: '小刚', text: '「刚、刚才那是……空气吉他！对！」' });
      gainBond('xiaogang', 2);
    },
    xpHome: async () => {
      if (ADV.Collect.count('bread') < 2) { await say({ name: '小胖', text: '「我家冰箱永远欢迎你——\n不过你得先有面包才能换我的秘制酱料！」' }); return; }
      ADV.Collect.useItem('bread', 2);
      ADV.Collect.addItem('snack', 3);
      ADV.Audio.sfx('item');
      await say({ name: '小胖', text: '「两片面包换三包零食！\n这就是胖氏经济学！」零食 ×3 入包' });
    },
    wyHome: async () => {
      await say({ text: '乌云的房间出乎意料整齐——\n单词本按字母排序，奖状压在箱底。' });
      await say({ name: '乌云', text: '「……别看箱底。」\n（你瞥见一张 61 分的卷子，\n被塑封得仔仔细细）' });
      gainBond('wuyun', 2);
    },
    mmHome: async () => {
      await say({ text: '墨墨的迷你实验角——\n她送你一小瓶亲手调的试剂。' });
      ADV.Collect.addItem('juice', 2);
      ADV.Audio.sfx('item');
      await say({ text: '「特调汽水，喝不坏的。」\n运动饮料 ×2 入包' });
      gainBond('momo', 2);
    },
    jpHome: async () => {
      await say({ text: '满墙的书，正中一座奖杯——\n铭牌写着「父：金鹏·武术组」。\n（原来是爸爸的）' });
      await say({ name: '金鹏', text: '「我爸说，想超越他……\n就得先读赢他书架上的书。」' });
      if (ADV.Growth) ADV.Growth.addDim('knowledge', 2, '金家的书架');
    },
    wmHome: async () => {
      await say({ text: '王美对着镜子练习明天的广播——\n声音一遍比一遍稳。' });
      await say({ name: '王美', text: '「啊！你都听到了？\n……帮我想个开头吧！」\n（她记下了你的建议）' });
      gainBond('wangmei', 3);
    }
  };
  // 拜访门禁：敲门 → 时段/好感检查 → 进屋触发独家事件
  const HOME_HOSTS = {
    xmHome: ['xiaoming', '小明', [3, 4, 5]], xhHome: ['xiaohong', '小红', [3, 4, 5]],
    xgHome: ['xiaogang', '小刚', [4, 5]], xpHome: ['xiaopang', '小胖', [1, 2, 3, 4, 5]],
    wyHome: ['wuyun', '乌云', [4, 5]], mmHome: ['momo', '墨墨', [4, 5]],
    jpHome: ['jinpeng', '金鹏', [3, 4, 5]], wmHome: ['wangmei', '王美', [4, 5]]
  };
  for (const [hid, [hostId, hostName, periods]] of Object.entries(HOME_HOSTS)) {
    S['knock_' + hid] = async () => {
      const p = ADV.Cal.period;
      if (!periods.includes(p)) {
        await say({ text: `你敲了敲门——没有回应。\n（${hostName}现在不在家：\n开放时段 ${periods.map(x => ADV.Cal.PERIODS[x]).join('/')}）` });
        return;
      }
      const fr = friend(hostId);
      if (fr.love < 10) { await say({ text: `你敲了敲门。\n「哪位？」——门没开。\n（和${hostName}还不太熟……）` }); return; }
      ADV.Engine.loadMap(hid, 7, 9, 'up');   // 玄关地垫上落位（16x12 新户型）
      if (HOME_EVENTS[hid]) await HOME_EVENTS[hid]();
    };
  }

  /* —— P1 家庭生活：物件氛围池（同学家里每样东西都有回应） —— */
  const HOME_PROPS = {
    ftable: async () => { await say({ text: '饭桌上还摆着没收的碗筷，\n椅垫上留着浅浅的坐痕。\n（是一家人刚吃过饭的样子）' }); },
    comicTower: async () => { await say({ text: '漫画塔摇摇欲坠……\n最上面一本下面，\n压着一张《作业未完成检讨书》。' }); },
    comicWall: async () => { await say({ text: '墙上贴满了漫画分镜草稿，\n角落签着潦草的「小明」。\n画得还挺像回事。' }); },
    xmTV: async () => { await say({ text: '电视停在动漫频道，\n遥控器藏在坐垫底下——\n标准的「防妈藏匿位」。' }); },
    xhMedal: async () => { await say({ text: '一排奖牌擦得锃亮。\n最新那枚是校运会的，\n最旧那枚刻着省运会的年份。' }); },
    xhBedSide: async () => { await say({ text: '藤椅扶手都磨亮了，\n旁边小凳上放着一副护膝。\n（是妈妈等小红放学的地方）' }); },
    xhTalk: async () => { await say({ text: '墙上贴着一张马拉松赛程表，\n某几个日期被红笔圈了出来，\n旁边写着「和囡囡一起」。' }); },
    xhFamily: async () => { await say({ text: '相框里，年轻的妈妈冲过终点线，\n爸爸抱着扎羊角辫的小红。\n玻璃擦得一尘不染。' }); },
    xgViolin: async () => { await say({ text: '书柜最里侧藏着一把琴，\n琴弦是新换的，\n琴盒上却落了灰。' }); },
    xgTalk: async () => { await say({ text: '谱架上夹着抄写的乐谱，\n页边空白写满了指法笔记。\n落款是个小小的「刚」字。' }); },
    xgPiano: async () => { await say({ text: '一架旧钢琴，漆面温润。\n琴键中区的两个键略有凹陷——\n是被岁月和练习一起按出来的。' }); },
    xpSnacks: async () => { const f = F(); if (!f.xpSnack) { f.xpSnack = 1; ADV.Collect.addItem('snack', 1); save(); await say({ text: '零食山的缝隙里滚出一包没拆的点心！\n点心 ×1 入包\n（奶奶的心意，见者有份）' }); } else await say({ text: '零食山纹丝不动——\n每一包都有它的位置。\n（再拿要被奶奶发现了）' }); },
    wyBooks: async () => { await say({ text: '一摞单词本按日期排好，\n每本的封面都写着同一句话：\n「早起背完再说话」。' }); },
    wyTalk: async () => { await say({ text: '墙上贴着一张星空图，\n猎户座的位置被描了又描。\n（沉默的人也有想去的远方）' }); },
    wyLamp: async () => { await say({ text: '一盏旧台灯，灯罩上贴着便利贴：\n「爸，下了夜班早点睡」。\n字迹硬邦邦的，是乌云写的。' }); },
    mmLab: async () => { await say({ text: '迷你实验角冒着淡淡的泡泡，\n标签写着「可饮用·第41版」。\n……第40版经历了什么？' }); },
    mmShelf: async () => { await say({ text: '书架上《昆虫记》挨着《时间简史》，\n中间夹着一张手绘的\n「墨墨十岁前要完成的实验清单」。' }); },
    mmTalk: async () => { await say({ text: '元素周期表海报上，\n几种稀有元素被画了小表情。\n氦气那个画着笑脸。' }); },
    mmPapers: async () => { await say({ text: '论文山岌岌可危。\n最顶上一篇标题是\n《论家庭实验的安全边界（修订稿）》。' }); },
    jpBook: async () => { await say({ text: '顶天立地的大书架。\n一半是武功典籍，一半是文史名著，\n书脊按「读完时间」排列。' }); },
    jpTrophy: async () => { await say({ text: '奖杯铭牌：「金鹏·武术组」。\n杯底压着一张字条：\n「给下一个金家的冠军」。' }); },
    jpTalk: async () => { await say({ text: '一张泛黄的武侠海报，\n角落有人用毛笔批了四个字：\n「侠之大者」。' }); },
    jpDummy: async () => { await say({ text: '木人桩的臂弯磨得发亮，\n桩身贴着一张便利贴：\n「金鹏练：第 3000 天」。' }); },
    wmMirror: async () => { await say({ text: '镜子边框贴着播音稿，\n上面用红笔标满了换气记号，\n还画了一只加油的小兔子。' }); },
    wmRadio: async () => { await say({ text: '一台老收音机，音量旋钮很松。\n调频指示停在「城市之声·早间节目」。' }); }
  };
  for (const [sid, fn] of Object.entries(HOME_PROPS)) S[sid] = fn;

  /* —— P1 玄关鞋柜：每日一次的小彩蛋 —— */
  S.shoeHome = async () => {
    const f = F();
    if (f.shoeDay === ADV.Cal.day) { await say({ text: '鞋柜已经翻过了。\n鞋子们摆得整整齐齐。' }); return; }
    f.shoeDay = ADV.Cal.day;
    const roll = (ADV.Cal.day * 7 + 3) % 3;
    if (roll === 0) { addGold(1); await say({ text: '翻鞋柜时，一张硬币从雨靴里掉出来！\n（大概是谁忘记的零钱）' }); }
    else if (roll === 1) { await say({ text: '鞋柜里摆着一大一小两双运动鞋，\n鞋带都提前松好了。\n（将心比心的温柔）' }); }
    else await say({ text: '门口的拖鞋按人数摆好，\n你的那双——居然也备了一双。\n（被人当家人招待的感觉）' });
    save();
  };

  /* —— P1 家庭故事推进器：fam_<key> 记录阶段，每段只演一次，末段循环为日常 —— */
  async function famStory(key, stages, doneLine) {
    const f = F(), k = 'fam_' + key;
    const st = f[k] || 0;
    if (st >= stages.length) { await doneLine(); return; }
    await stages[st]();
    f[k] = st + 1;
    save();
  }

  /* —— P1 八位家人：两段剧情 + 日常收尾 —— */
  S.fam_xmHome = () => famStory('xm', [
    async () => {
      await say({ name: '小明妈', text: '「你看那漫画塔！又堆到饭桌上了！\n你帮我劝劝他……」' });
      await say({ name: '小明妈', text: '「……算了算了，\n他自己会收拾的。大概。」' });
    },
    async () => {
      await say({ name: '小明妈', text: '「跟你说个秘密——\n我年轻时也躲被窝里看漫画。\n所以那塔啊，我下不去手拆。」' });
      ADV.Collect.addItem('comic', 1); ADV.Audio.sfx('item');
      await say({ text: '「这本送你，我当年的珍藏。」\n漫画 ×1 入包' });
    }
  ], async () => say({ name: '小明妈', text: '「这孩子画的画，其实……\n挺好看的。就是别耽误考试！」' }));

  S.fam_xhHome = () => famStory('xh', [
    async () => {
      await say({ name: '小红妈', text: '「这些奖牌，省队时候拿的。\n差 0.1 秒，没进国家队。」' });
      await say({ name: '小红妈', text: '「不过啊，奖牌会旧，\n日子是新的。」' });
    },
    async () => {
      await say({ name: '小红妈', text: '「她最近老一个人去操场跑步。\n你陪陪她吧——\n跑步有人伴，就不觉得长。」' });
      gainBond('xiaohong', 3);
      await say({ text: '（把这个消息带给小红吧）' });
    }
  ], async () => say({ name: '小红妈', text: '「那 0.1 秒，输给了现在\n每天笑呵呵的日子。不亏。」' }));

  S.fam_xgHome = () => famStory('xg', [
    async () => {
      await say({ name: '小刚妈', text: '「他最近老晚归，说是补课……」\n（她擦着琴盖，轻轻叹气）' });
    },
    async () => {
      await say({ name: '小刚妈', text: '「其实我知道他在琴房练琴。\n琴弦松了，\n我每次都偷偷给他调好。」' });
      await say({ name: '小刚妈', text: '「妈妈装不知道，\n他就还能多练一会儿。」' });
      gainBond('xiaogang', 3);
    }
  ], async () => say({ name: '小刚妈', text: '「下次音乐会，\n我要坐第一排。」' }));

  S.fam_xpHome = () => famStory('xp', [
    async () => {
      await say({ name: '小胖奶奶', text: '「哎哟！乖孙的同学来啦！\n吃点心吃点心！」' });
      ADV.Collect.addItem('snack', 1); ADV.Audio.sfx('item');
      await say({ text: '奶奶硬塞过来一把点心。\n点心 ×1 入包' });
    },
    async () => {
      await say({ name: '小胖奶奶', text: '「教你个口诀：\n小火慢炖，心急吃不了热豆腐。」' });
      await say({ name: '小胖奶奶', text: '「以后自己开火做饭，\n想起来奶奶这句话，\n就饿不着。」' });
    }
  ], async () => say({ name: '小胖奶奶', text: '「小胖小时候呀，\n胖是胖，跑起来比狗还快！」' }));

  S.fam_wyHome = () => famStory('wy', [
    async () => {
      await say({ name: '乌云爸', text: '「（压低声音）轻点……\n那孩子白天在睡觉。」' });
      await say({ name: '乌云爸', text: '「他怕吵着我，\n其实我怕吵着他。」' });
    },
    async () => {
      await say({ name: '乌云爸', text: '「把这杯咖啡带给他，\n……别说是我买的。」' });
      ADV.Collect.addItem('coffee', 1); ADV.Audio.sfx('item');
      gainBond('wuyun', 3);
      await say({ text: '浓咖啡 ×1 入包\n（一份嘴硬心软的父爱）' });
    }
  ], async () => say({ name: '乌云爸', text: '「下了夜班回来，\n全城的灯都灭了，\n就我家那盏亮着。」' }));

  S.fam_mmHome = () => famStory('mm', [
    async () => {
      await say({ name: '墨墨妈', text: '「哦呀，实验又炸了。」\n「科学就是爆炸的艺术——\n不过地板是无辜的。」' });
    },
    async () => {
      await say({ text: '你帮她收拾了论文山。\n（作为谢礼……）' });
      ADV.Collect.addItem('poem', 1); ADV.Audio.sfx('item');
      if (ADV.Growth) ADV.Growth.addDim('knowledge', 2, '墨墨妈的书房');
      await say({ text: '「这本《宇宙简史（少儿版）》送你。」\n诗集 ×1 入包 · 求知 +2' });
    }
  ], async () => say({ name: '墨墨妈', text: '「你问墨墨像谁？\n她呀——比我疯。」' }));

  S.fam_jpHome = () => famStory('jp', [
    async () => {
      await say({ name: '金鹏爸', text: '「想超越我？\n先读赢我书架上的书。」' });
      await say({ name: '金鹏爸', text: '「……或者，\n先接住我的沙包。」\n（你明智地选择了读书）' });
    },
    async () => {
      await say({ name: '金鹏爸', text: '「这本书借你。\n还的时候，\n要告诉我你读懂了什么。」' });
      ADV.Collect.addItem('poem', 1); ADV.Audio.sfx('item');
      await say({ text: '泛黄的书页里夹着一张\n揉皱又展平的满分卷子。\n诗集 ×1 入包' });
    }
  ], async () => say({ name: '金鹏爸', text: '「奖杯是我的，\n路，是他自己的。」' }));

  S.fam_wmHome = () => famStory('wm', [
    async () => {
      await say({ name: '王美姐', text: '「来得正好！帮我听听这个开头——」\n「『清晨的校园，书声琅琅……』」' });
      const c = await choose(['换个活泼的开头！', '就这样很好听！'], { caption: { name: '王美姐', text: '（她认真地等着你的评价）' } });
      await say({ name: '王美姐', text: c === 0 ? '「活泼一点？\n『叮咚——您的校园广播已上线！』……这样？」' : '「真的吗！\n那我就放心念了！」' });
    },
    async () => {
      await say({ name: '王美姐', text: '「电台实习通过啦！\n第一个想告诉的就是你们！」' });
      ADV.Collect.addItem('ribbon', 1); ADV.Audio.sfx('item');
      gainBond('wangmei', 3);
      await say({ text: '「这个发带送你，我的幸运物。」\n发带 ×1 入包' });
    }
  ], async () => say({ name: '王美姐', text: '「明天早间节目，\n会放小虎队的歌哦。」' }));

  /* —— P1 同学居家对话：在自家里，话匣子会打开（按好感三档） —— */
  S.host_xmHome = async () => {
    const lv = friend('xiaoming').love;
    if (lv >= 60) await say({ name: '小明', text: '「等毕了业，我想去画真正的漫画。\n……你听到就行，别外传。」' });
    else if (lv >= 30) await say({ name: '小明', text: '「新刊预告！这次主角会瞬移！\n借你先看——别折角。」' });
    else await say({ name: '小明', text: '「嘘——我正在画同人志。\n漫画塔的事，别告诉我妈！」' });
  };
  S.host_xhHome = async () => {
    const lv = friend('xiaohong').love;
    if (lv >= 60) await say({ name: '小红', text: '「妈妈以前是省队的，好厉害吧。\n我想跑得比她快——\n不为奖牌，就想让她多笑笑。」' });
    else if (lv >= 30) await say({ name: '小红', text: '「在客厅小声点，\n妈妈在看马拉松录像回放。」' });
    else await say({ name: '小红', text: '「你怎么在我家？\n……哦，来找我妈聊天的吧。」' });
  };
  S.host_xgHome = async () => {
    const lv = friend('xiaogang').love;
    if (lv >= 60) await say({ name: '小刚', text: '「琴弦又松了……\n咦，调好了？\n……是不是我妈干的。」' });
    else if (lv >= 30) await say({ name: '小刚', text: '「那架钢琴比我年纪都大。\n我小时候以为里面住着精灵。」' });
    else await say({ name: '小刚', text: '「我在写作业。\n……好吧，在偷偷记指法。」' });
  };
  S.host_xpHome = async () => {
    const lv = friend('xiaopang').love;
    if (lv >= 60) await say({ name: '小胖', text: '「奶奶的手艺，天下第一！\n等她教完我，请你吃满汉全席——\n的家庭简化版。」' });
    else if (lv >= 30) await say({ name: '小胖', text: '「零食山第三层藏着辣条，\n这是我最后的防线。」' });
    else await say({ name: '小胖', text: '「嘘！别踩到地板，\n零食山会塌！」' });
  };
  S.host_wyHome = async () => {
    const lv = friend('wuyun').love;
    if (lv >= 60) await say({ name: '乌云', text: '「别开大灯。\n坐会儿就行……\n有你在这，夜班好像也没那么冷。」' });
    else if (lv >= 30) await say({ name: '乌云', text: '「台灯的光够用了。\n……两个人一起背单词，快一点。」' });
    else await say({ name: '乌云', text: '「小声点。\n我爸下了夜班刚睡下。」' });
  };
  S.host_mmHome = async () => {
    const lv = friend('momo').love;
    if (lv >= 60) await say({ name: '墨墨', text: '「第42版试剂，成功了一半！」\n「……另一半，\n以肉眼可见的方式失败了。」' });
    else if (lv >= 30) await say({ name: '墨墨', text: '「我妈说，敢在家做实验的孩子\n都有科学家潜质。」\n「我觉得主要是敢收拾。」' });
    else await say({ name: '墨墨', text: '「欢迎参观家庭实验室！\n请签署这份……口头免责协议。」' });
  };
  S.host_jpHome = async () => {
    const lv = friend('jinpeng').love;
    if (lv >= 60) await say({ name: '金鹏', text: '「我爸的书我读了三成。\n他说等读完，就教我那招绝活。」\n「……有点想快点，又有点不想。」' });
    else if (lv >= 30) await say({ name: '金鹏', text: '「别碰那个木人桩——\n上个月它赢了我。」' });
    else await say({ name: '金鹏', text: '「我家规矩：进门先看书名。\n你看，随便挑一本聊。」' });
  };
  S.host_wmHome = async () => {
    const lv = friend('wangmei').love;
    if (lv >= 60) await say({ name: '王美', text: '「姐姐说，等我声音稳了，\n就让我在她的节目里说一句\n『校园之声，与你同在』！」' });
    else if (lv >= 30) await say({ name: '王美', text: '「小声点——\n我姐在里屋练稿子。\n不过偷偷说，她练得卡壳了。」' });
    else await say({ name: '王美', text: '「我家 RADIO 不外借，\n但可以一起听五分钟。」' });
  };

  S.morningVisit = async (ent) => {
    const f = F();
    if (!f.visitor) { await say({ text: '（门口空无一人，\n只有晨光）' }); return; }
    const id = f.visitor;
    f.visitor = '';
    E().playAction(ent, 'wave', 1.4);
    await say({ name: BOND[id].name, text: VISITOR_LINES[id] ? pick(VISITOR_LINES[id]) : '早上好！今天也一起玩吧！' });
    gainBond(id, 3);
    if (ADV.Growth) ADV.Growth.addDim('bond', 1, '清晨的邀约');
    const go = await choose(['一起出门！', '今天想自己走走'], { caption: { name: BOND[id].name, text: '（TA 期待地看着你）' } });
    if (go === 0) {
      f.party = id; ent.followT = 99999; ent.pose = null; ent.goal = null;
      UI().toast(` 🤝 ${BOND[id].name}与你同行今日！`);
    } else await say({ name: BOND[id].name, text: '好吧！那我在学校等你～' });
    save();
  };

  S.myBed = () => sleepCommon(true);      // 自家床：醒来有爸妈问候
  S.dormBed = () => sleepCommon(false);
  /* —— 错题复习（间隔重复：到期错题重练，答对推进记忆盒，无到期题则安抚） —— */
  async function reviewWrong() {
    const f = F(), M = ADV.Mistake;
    if (!M) { await say({ text: '（错题本不知去向……）' }); return; }
    const due = M.dueList();
    const st = M.stats();
    if (!due.length) {
      await say({
        text: st.total
          ? `错题本里还有 ${st.total} 道题在记忆盒里沉淀，\n今天没有到期的复习任务。\n（答对过的题会在 1/3/7/15 天后重现）`
          : '错题本干干净净——\n一个错题都没有，继续保持！'
      });
      return;
    }
    await say({ text: `错题本里有 ${Math.min(due.length, 5)} 道到期错题，\n翻开重练吧！（答对加深记忆，答错重新计时）` });
    ADV.Cal.costEnergy(5);                               // 复习消耗精力（只提示不拦截）
    if (ADV.Cal.energy < 30) UI().toast(' 😪 精力不多了，复习完早点睡 ');
    let done = 0, right = 0;
    for (const id of due.slice(0, 5)) {
      const w = M.all()[id]; if (!w) continue;
      const i = await choose(w.opts, { caption: { name: '📖 错题本 · ' + w.subject, text: w.q + `\n（之前答错过 ${w.n || 1} 次）` } });
      const hit = i === w.a;
      const r = M.review(id, hit);
      if (hit) { right++; ADV.Audio.sfx('correct'); } else ADV.Audio.sfx('wrong');
      done++;
      await say({
        text: r === 'mastered' ? '✅ 完全掌握！这题从错题本里毕业了。'
          : hit ? `✅ 答对了！记忆加深，${M.IVAL[w.box]} 天后再见。`
          : '❌ 又错了……回到第一天，明天再来攻克它。'
      });
    }
    const gold = right * 3 + (done ? 2 : 0);
    f.gold = (f.gold || 0) + gold;
    UI().toast(` 📖 错题复习：${right}/${done} 答对 · 💰 +${gold} `);
    save();
  }
  S.myDesk = async () => {
    const C = ADV.Cal, f = F();
    if (C.isNight()) {
      const mi = await choose(['复习课本', '写今天的日记', '错题复习', '翻看日记本', '合上本子'],
        { caption: { name: '书桌 · 台灯下', text: '夜晚最静，正好整理今天。' } });
      if (mi === 0) {
        await say({ text: '你在台灯下摊开课本……\n（夜晚学习，明天考试更有底气）' });
        f.studyBuff = true;
        C.advance(1);
        ADV.Collect.gain('quotes', ['q2', 'q5', 'q12'][(C.day % 3) | 0]);
        await say({ text: '合上书时，窗外月光正好。\n（复习完成：下次考试题目变简单）' });
        save();
      } else if (mi === 1) await diaryWrite();
      else if (mi === 2) await reviewWrong();
      else if (mi === 3) await diaryRead();
      return;
    }
    await say({ text: '书桌上摊着课本和台灯。\n（傍晚以后才能静下心学习）\n' + C.label() });
  };
  // 收藏柜：分门别类展示九大收集册的进度（数据实时来自 Collect）
  S.myShelf = async () => {
    const Col = ADV.Collect;
    const rows = Col.CATS.map(([cat, label, icon]) =>
      `${icon} ${label}　${Col.catCount(cat)}/${Col.totalOf(cat)}`).join('\n');
    const p = Col.progress();
    await say({ text: `你的收藏柜——\n${rows}\n────────\n一共收集了 ${p.got}/${p.total} 件宝物，\n每一件都是这个夏天的证据。` });
    const i = await choose(['看看收藏', '关闭'], { caption: { text: p.got >= p.total ? '（图鉴大满贯！你就是这个夏天的收藏家）' : '（按 F 可随时打开手册）' } });
    if (i === 0) UI().toast(' 按 F 打开友谊手册，← → 切换页签 ');
  };
  // 章节海报：卧室墙上的画随主线推进悄悄更换
  const POSTERS = {
    ch1_arrival:  ['入学通知单', '画的是校门口的梧桐树，\n背面写着你的名字。'],
    ch1_badges:   ['四枚徽章的涂鸦', '四座小房子歪歪扭扭排成一行，\n每一座都还没被打勾。'],
    ch1_gate:     ['一扇石门的蜡笔画', '门缝里透出光，\n你画它的时候，手还有点抖。'],
    ch2_letter:   ['一张月光信笺', '月亮被钉在正中央，\n边角还留着 owl 的爪印。'],
    ch2_moon:     ['月光学院的校徽', '白天看是银色，\n天黑后再看，像在发亮。'],
    ch3_collect:  ['回忆照片拼贴', '照片越贴越多，\n快盖住墙上原来的日历了。'],
    ch3_timehall: ['时光回廊的草图', '四个时代画成四扇门，\n你在最前面那扇里。'],
    ch3_grad:     ['毕业礼的邀请函', '被你贴得端端正正，\n旁边画了一个小小的你。'],
    epilogue:     ['全班合影', '毕业那天的照片，\n每个人笑得都很大声。'],
    after_grad:   ['新学期的课程表', '空的——\n等你用自己的故事填满。']
  };
  S.myPoster = async () => {
    const ch = chapterState();
    const [name, line] = POSTERS[ch.id] || POSTERS.ch1_arrival;
    await say({ text: `墙上贴着《${name}》。\n${line}\n（当前章节：${ch.title}）` });
  };
  S.yardPhoto = async () => {
    const f = F();
    if (f.yalbum >= 5) { await say({ text: '院子里的旧照片都找齐了。\n（第三章的钥匙之一）' }); return; }
    f.yalbum += 1;
    ADV.Audio.sfx('photo');
    await say({ text: `你在花坛下翻出一张旧照片……\n（庭院旧相册 ${f.yalbum} / 5）\n照片里是年轻时的——爸爸妈妈？！` });
    save();
  };

  /* ==================== 阅读 · 摘抄 · 日记 ==================== */

  // 记录“今天发生的事”，夜晚写日记时挑选（睡一觉清零）；同时写入 deeds 日志供 NPC 记忆引用
  function logEvent(text) {
    const f = F();
    if (!f.today) f.today = [];
    if (f.today.indexOf(text) < 0 && f.today.length < 8) f.today.push(text);
    f.deeds = f.deeds || [];
    const short = text.replace(/^在|^通过了|^把/, '').slice(0, 14);
    if (!f.deeds.some(d => d.text === short && d.day === ADV.Cal.day)) {
      f.deeds.push({ day: ADV.Cal.day, text: short });
      if (f.deeds.length > 12) f.deeds.shift();
    }
  }

  // 翻开一本书：交给阅读器（↑↓选句 / ←→翻页 / Z 摘抄 / X 合上）→ 读后思考题
  // C3 经典借阅 buff：借阅期内的经典古籍（cat=classic），每天首读一遍「读有所悟」——学院分 +1。
  // 课本的 buff 是上课 +50% 知识点（BOOK_SUBJECT），经典的 buff 在阅读本身——两条口径互补。
  function classicReadTick(bookId) {
    const f = F(), C = ADV.Cal, bk = ADV.Books && ADV.Books.DB[bookId], br = f.borrow;
    if (!bk || bk.cat !== 'classic' || !br || br.id !== bookId) return false;
    if (!C || C.day > br.due || f.classicReadDay === C.day) return false;
    f.classicReadDay = C.day;
    addCup(1);
    UI().toast(' 📜 读有所悟 · 学院分 +1（借阅经典当日首读） ');
    return true;
  }

  async function readBook(bookId) {
    const f = F();
    const bk = ADV.Books && ADV.Books.DB[bookId];
    if (!bk) { await say({ text: '（这本书暂时读不出什么名堂）' }); return; }
    await say({ text: `📖 ${bk.name}\n${bk.intro}` });
    await new Promise(res => ADV.Books.start(bookId, res));       // 阅读器接管主循环
    classicReadTick(bookId);                                      // 经典借阅 buff：当日首读结算
    const marks = ((f.read || {})[bookId] || {}).marks || [];
    if (marks.length >= 1) grantTalent('read');                   // 阅读达人：摘抄至少一句
    if (!ADV.Collect.has('books', bookId)) ADV.Collect.gain('books', bookId);
    await say({ text: marks.length
      ? `你合上书，本子上多了 ${marks.length} 句子。\n（本书已收入你的阅读记录）`
      : '你翻了一遍，这次一句也没抄下来。\n（看书时按 Z 就能把喜欢的句子抄走）' });
    if (bk.think) {
      let ok = false;
      while (!ok) {
        const i = await choose(bk.think.opts, { cancelIndex: -1, caption: { name: '读后思考', text: bk.think.q } });
        if (i === bk.think.a) {
          ok = true;
          ADV.Audio.sfx('correct');
          E().playAction(E().player, 'raise', 1.2);
          await say({ text: bk.think.ok });
        } else {
          ADV.Audio.sfx('wrong');
          E().playAction(E().player, 'doubt', 1.2);
          await say({ text: bk.think.hint || '再想想——作者到底想说什么？' });
        }
      }
    }
    logEvent(`读完了${bk.name}`);
    save();
  }

  // 家里书柜：重读已拥有的书
  S.bookcase = async () => {
    const owned = ADV.Collect.ids('books');
    if (!owned.length) { await say({ text: '书柜还空着。\n（小镇书店有售，旧书摊更便宜）' }); return; }
    const rd = (F().read || {});
    const opts = owned.map(id => {
      const m = ((rd[id] || {}).marks || []).length;
      const total = (ADV.Books.DB[id] || { lines: [] }).lines.length;
      return ADV.Books.DB[id].name + (m ? `（已摘 ${m}/${total} 句）` : '');
    });
    opts.push('离开');
    const i = await choose(opts, { caption: { name: '我的书柜', text: '抽出一本，翻翻——' } });
    if (i >= 0 && i < owned.length) await readBook(owned[i]);
  };

  // 图书馆书架：全馆藏随便读
  S.libraryShelf = async () => {
    const list = ADV.Books.byWhere('library');
    const opts = list.map(b => b.name + (ADV.Collect.has('books', b.id) ? ' ✔' : '')).concat(['离开']);
    const i = await choose(opts, { caption: { name: '图书馆 · 书架', text: `馆藏 ${list.length} 册，想看哪一本？\n（在这里读免费；想收藏就去书店）` } });
    if (i >= 0 && i < list.length) await readBook(list[i].id);
  };

  /* —— 晨读角：清晨早到教室读一局书，达成后当天答题知识点 +1（game-town.js examOnce 消费） —— */
  S.morningRead = async () => {
    const f = F(), C = ADV.Cal;
    if (C.period !== 0) { await say({ text: '（墙上贴着「晨读时间 · 清晨」的告示。\n现在不是清晨——晨读角安安静静的。）' }); return; }
    if (f.morningReadDay === C.day) { await say({ text: '（今天已经大声晨读过啦，嗓子清亮亮的。\n明天清晨再来吧！）' }); return; }
    const subject = ['chinese', 'math', 'english'][C.day % 3];
    const cn = { chinese: '语文', math: '数学', english: '英语' }[subject];
    await say({ text: `清晨的教室真安静——\n你摊开${cn}课本，大声读了起来！\n（读完一局小练习：今日答题知识点 +1、精力 +10）` });
    let hit = 0;
    for (let k = 0; k < 3; k++) if (await examAsk(`晨读 · ${cn}小练习`, subject, 'easy', C.day * 3 + k)) hit++;
    f.morningReadDay = C.day;                            // 先落 buff：今天剩下的题都算晨读加成
    C.gainEnergy(10);
    f.gold = (f.gold || 0) + 8;
    addCup(1);
    logEvent(`完成了清晨晨读（${cn}，答对 ${hit}/3）`);
    ADV.Audio.sfx('save');
    await say({ text: `读完合上书，脑子清醒极了！（答对 ${hit}/3）\n精力 +10 · 金币 +8 · 学院分 +1\n今天答题的知识点都会额外 +1！` });
    save();
  };

  /* —— 晚自习座位：夜晚留馆刷题，当晚答题经验 +50%（examOnce 消费）；代价是夜里过不去别处了 —— */
  S.nightStudy = async () => {
    const f = F(), C = ADV.Cal;
    if (!C.isNight()) { await say({ text: '（座位上摆着一盏台灯和一沓习题纸。\n牌子上写：「晚自习 · 天黑开灯」。\n白天就先去上课吧～）' }); return; }
    if (f.nightStudyDay !== C.day) {
      const go = await choose(['留下来刷题', '先回去'], { caption: { name: '晚自习', text: `天黑了（${C.periodName()}），图书馆还亮着一盏灯。\n留下来刷题：今晚答题经验 +50%。\n（但整晚都耗在书桌前——夜里别的事就赶不上了）` } });
      if (go !== 0) return;
      f.nightStudyDay = C.day;
      C.costEnergy(5);
      C.advance(1);                                      // 留馆刷题消耗时段（夜晚则原地不动）
      await say({ text: '你坐进台灯的光圈里，摊开习题纸。\n笔尖沙沙——今晚刷题经验 +50%！（精力 -5）' });
    } else {
      await say({ text: '（台灯还亮着，习题纸摊在桌上。\n今晚的 +50% 经验还在生效，继续刷！）' });
    }
    const subject = ['math', 'chinese', 'science', 'english'][C.day % 4];
    const cn = { math: '数学', chinese: '语文', science: '科学', english: '英语' }[subject];
    let hit = 0;
    for (let k = 0; k < 3; k++) if (await examOnce(`晚自习 · ${cn}刷题`, subject, 'normal', C.day * 10 + k)) hit++;
    logEvent(`在图书馆上晚自习（${cn}，答对 ${hit}/3）`);
    if (hit === 3) { addCup(1); UI().toast(' ✨ 刷题全对 · 学院分 +1 '); }
    ADV.Audio.sfx('save');
    await say({ text: `夜更深了，你合上习题册。（答对 ${hit}/3）\n今晚在台灯下做的题，经验都算 +50%。` });
    save();
  };

  /* —— 学业光荣榜（C5）：知识点 × 学识 × 知识树的每周虚拟榜——同学分数按周种子刷新，登顶拿成就 —— */
  const ACAD_RIVALS = [
    { name: '程学霸', base: 300, grow: 40 },   // 常年霸榜的传说级对手
    { name: '小红',   base: 240, grow: 30 },
    { name: '黄宇',   base: 180, grow: 24 },
    { name: '小明',   base: 150, grow: 20 },
    { name: '小影',   base: 120, grow: 18 },
    { name: '陆飞',   base: 90,  grow: 14 },
    { name: '林小雨', base: 70,  grow: 12 },
    { name: '大壮',   base: 50,  grow: 10 }
  ];
  function acadHash(n) { const h = Math.sin(n * 12.9898) * 43758.5453; return h - Math.floor(h); }  // 稳定伪随机（周种子）
  S.academicBoard = async () => {
    const f = F(), C = ADV.Cal, M = ADV.Mistake, G = ADV.Growth;
    const week = C.weekIndex();
    const kpSum = Object.values(f.kp || {}).reduce((s, n) => s + (n | 0), 0);
    const myScore = kpSum * 4 + (G ? G.dump().dim.knowledge : 0) * 2 + (M ? M.totalNodes() : 0) * 5;
    const rows = ACAD_RIVALS.map((r, i) => ({ name: r.name, score: r.base + week * r.grow + ((acadHash(week * 17 + i + 3) * 30) | 0) }));
    rows.push({ name: (f.name || '你') + '（你）', score: myScore, me: true });
    rows.sort((a, b) => b.score - a.score);
    const myRank = rows.findIndex(r => r.me) + 1;
    const board = rows.slice(0, 5).map((r, i) => `${i + 1}.${i + 1 > 3 ? ' ' : ''}${r.name}　${r.score} 分`).join('\n');
    await say({ name: '学业光荣榜', text: `📢 第 ${week} 周 · 全校学业综合分\n（全科知识点 + 学识 + 知识树，每周一刷新）\n\n${board}\n─────────────\n你的名次：第 ${myRank} 名（${myScore} 分）` });
    if (myRank !== 1) {
      await say({ name: '学业光荣榜', text: '（榜首的位置还被人占着。\n多上课、多答题、多读几本书，下周再来！）' });
      return;
    }
    logEvent('登上了学业光荣榜榜首');
    if (!f.acadFirst) {
      f.acadFirst = true;
      addCup(2);
      await say({ name: '学业光荣榜', text: `🏆 榜首写着你的名字！（${f.name || '你'} · ${myScore} 分）\n全校第一！同学们都看呆了。\n学院分 +2 · 成就「全校第一」点亮` });
      ADV.Audio.sfx('photo');
    }
    if (f.acadTopWeek !== week) {
      f.acadTopWeek = week;
      f.gold = (f.gold || 0) + 10;
      UI().toast(' 🏆 每周登顶奖学金 · 金币 +10 ');
    }
    save();
  };

  // 教室讲台：课本
  /* —— 上课：每日一课（白天 · 校历有课 · 当天未上）。主科 = 抢答小游戏 + 两道随堂题，
        副科（体育/音乐/美术/阅读/社团）= 动手环节 + 一道综合题；答对自动得知识点 —— */
  async function takeClass() {
    const f = F(), C = ADV.Cal, M = ADV.Mistake;
    const subs = C.today();
    if (!subs.length) { await say({ text: '（今天是休息日，教室空荡荡的。\n周日不上课——去外面冒险吧！）' }); return; }
    if (C.isNight()) { await say({ text: '（天色已晚，教室锁门了。\n上课要趁白天来～）' }); return; }
    if (f.lessonDay === C.day) { await say({ text: '（今天的课已经上完啦。\n消化一下知识，明天再来！）' }); return; }   // lessonDay：上课专用（classDay 留给班会/大扫除）
    const MAJOR = { '数学': 'math', '语文': 'chinese', '英语': 'english', '科学': 'science' };
    const cn = subs[(C.day - 1) % subs.length];          // 按日子轮换今天重点节次
    const en = MAJOR[cn] || 'final';
    f.lessonDay = C.day;
    C.costEnergy(10);                                    // 上课消耗精力（只提示不拦截）
    if (C.energy < 30) UI().toast(' 😪 精力有点低，上课直打瞌睡…… ');
    await say({ text: `上课铃响——这节是${cn}课。\n（认真听讲 + 随堂练习，答对得知识点！）` });
    const kp0 = M.kp(en);
    if (en) {
      const up = await new Promise(res => ADV.Mini.start('ball', res, {}));   // 随堂抢答：抓准举手时机
      await say({ text: up ? '🙋 你抓准时机举手，答得又快又好！' : '（这回没抢到……认真听下一题）' });
      await examAsk(`${cn}课 · 随堂练习`, en, 'easy');
      await examAsk(`${cn}课 · 随堂练习`, en, 'normal');
    } else {
      const up = await new Promise(res => ADV.Mini.start('ball', res, { easy: true }));   // 副科动手环节
      await say({ text: up ? `${cn}课上你完成得特别出色，老师竖起大拇指！` : `（${cn}课玩得很开心，下次做得更好～）` });
      await examAsk(`${cn}课 · 小知识`, 'final', 'easy');
    }
    let gained = M.kp(en) - kp0;
    const br = f.borrow, bk = br && ADV.Books ? ADV.Books.DB[br.id] : null;
    if (bk && C.day <= br.due && gained > 0 && BOOK_SUBJECT[bk.id] === en) {
      const bonus = Math.ceil(gained / 2);                     // 借书 buff：带着对应课本上课 +50%
      if (M.gain) M.gain(en, bonus);
      gained += bonus;
      UI().toast(` 📚 《${bk.name}》派上用场 · 额外知识点 +${bonus} `);
    }
    const gold = 4 + gained * 2;
    f.gold = (f.gold || 0) + gold;
    logEvent(`上了${cn}课（随堂答题知识点 +${gained}）`);
    UI().toast(` 🏫 ${cn}课结束 · 知识点 +${gained} · 💰 +${gold} `);
    if (C.energy < 30) UI().toast(' 😪 有点累了——今晚早点睡，精力回满 ');
    save();
  }

  S.classBooks = async () => {
    const list = ADV.Books.byWhere('class');
    const opts = ['上课（今日一课 · 得知识点）'].concat(list.map(b => b.name + (ADV.Collect.has('books', b.id) ? ' ✔' : ''))).concat(['离开']);
    const i = await choose(opts, { caption: { name: '课桌 · 课本', text: '课本摊在桌上——\n（上课得知识点，读课本让对应考试更简单）' } });
    if (i === 0) { await takeClass(); return; }
    if (i > 0 && i <= list.length) await readBook(list[i - 1].id);
  };

  // —— C1 学科奥赛：教室公告栏（报名 / 备战进度 / 开赛 / 荣誉回眸） ——
  S.olympBoard = async () => {
    const o = olympState();
    const cfg = o.cfg, stt = o.st;
    const nextSe = OLYMP_SEASONS[(OLYMP_SEASONS.indexOf(o.se) + 1) % 4];
    if (stt && stt.rank) {                                       // 本季已完赛：荣誉栏
      await say({ name: '🏆 奥赛公告栏', text: `【${o.C.season()}季 · ${cfg.cn}奥赛】\n荣誉栏上钉着你的名字：${OLYMP_RANK_CN[stt.rank]}！\n（下一季：${OLYMP[nextSe].cn}奥赛）` });
      return;
    }
    if (!stt || !stt.reg) {
      if (o.sd <= 3) {                                           // 报名窗口（每季头 3 天）
        const go = await choose([`报名${cfg.cn}奥赛！`, '先不报'], { caption: { name: '🏆 奥赛公告栏', text: `【每季一场 · 学科奥赛】\n本季：${cfg.cn}（主考 ${cfg.teacher}）\n第 8 天在这里开考——报名免费！` } });
        if (go !== 0) return;
        o.f.olymp[o.se] = { reg: true, prep: 0 };
        ADV.Audio.sfx('item');
        await say({ name: '🏆 奥赛公告栏', text: `报名成功！\n备战期（第 4-7 天）多答${cfg.cn}题攒备战度——\n攒满 3 点，赛场上首错不计！` });
        logEvent(`报名了${o.C.season()}季${cfg.cn}奥赛`);
        save();
        return;
      }
      await say({ name: '🏆 奥赛公告栏', text: `本季${cfg.cn}奥赛报名已截止。\n下一季：【${OLYMP[nextSe].cn}奥赛】——\n季初头 3 天来报名！` });
      return;
    }
    if (o.sd <= 3) {                                             // 已报名，还没开备战
      await say({ name: '🏆 奥赛公告栏', text: `已报名${cfg.cn}奥赛 ✓\n备战期第 4 天开始——\n到时候找${cfg.teacher}老师多练题吧。` });
      return;
    }
    if (o.sd <= 7) {                                             // 备战期：看进度 + 指路
      const have = stt.prep || 0, need = Math.max(0, 3 - have);
      const go = await choose(['知道了，这就去练', '先这样'], { caption: { name: '🏆 奥赛公告栏', text: `【备战期 · ${cfg.cn}】\n备战度 ${have} / 3${need ? `（再答对 ${need} 道${cfg.cn}题即满）` : '（已满：赛场上首错不计！）'}` } });
      if (go !== 0) return;
      await say({ name: '🏆 奥赛公告栏', text: `找${cfg.teacher}老师讨教、做今日作业、\n闯一场正式试炼——答对${cfg.cn}题都算备战！` });
      return;
    }
    if (o.sd === 8) {                                            // 比赛日
      const go = await choose(['开始比赛！', '今天先算了'], { caption: { name: '🏆 奥赛公告栏', text: `【比赛日 · ${cfg.cn}奥赛】\n五题连答，${cfg.teacher}老师主考。\n备战度 ${stt.prep || 0}${(stt.prep || 0) >= 3 ? '（首错不计）' : ''}` } });
      if (go !== 0) return;
      await olympContest();
      return;
    }
    await say({ name: '🏆 奥赛公告栏', text: `第 8 天的比赛日你没来……\n${cfg.teacher}老师叹了口气：\n「下次可别错过了。」` });
  };

  /* —— 图书借阅：在秦墨处借书，借期 3 天。课本借期内带去上课，知识点收益 +50%（BOOK_SUBJECT）；
        经典古籍借期内每天首读一遍「读有所悟」学院分 +1（classicReadTick）；
        按时归还另有小奖励，超期会被罚金收书。 —— */
  const BOOK_SUBJECT = { tb_chinese: 'chinese', tb_math: 'math', tb_science: 'science', tb_english: 'english' };
  const SUB_CN = { chinese: '语文', math: '数学', science: '科学', english: '英语' };

  async function libMenu(ent) {
    const f = F(), C = ADV.Cal;
    if (f.borrow && C.day > f.borrow.due) {                      // 逾期结算：罚金收书
      const bk = ADV.Books.DB[f.borrow.id];
      const fine = Math.min(f.gold || 0, 10);
      E().playAction(ent, 'doubt', 1.6);
      await say({ name: '秦墨', text: `《${bk.name}》超期 ${C.day - f.borrow.due} 天了。\n按规矩，罚金 ${fine} 文——书我先收回架子。` });
      f.gold = (f.gold || 0) - fine;
      f.borrow = null;
      logEvent('借的书超期，被秦墨收回并罚了款');
      save();
      UI().toast(` ⏰ 借书超期 · 罚金 -${fine} 文 `);
    }
    if (f.borrow) {
      const bk = ADV.Books.DB[f.borrow.id];
      const sub = BOOK_SUBJECT[f.borrow.id];
      const perk = sub
        ? `\n（带着它上${SUB_CN[sub]}课，知识点 +50%）`
        : (bk.cat === 'classic' ? '\n（经典古籍：借期内每天首读一遍，学院分 +1）' : '');
      const left = f.borrow.due - C.day;
      const i = await choose(['归还这本书', '继续带着'], {
        caption: { name: '秦墨', text: `借阅中：《${bk.name}》· 还期剩 ${left} 天${perk}` }
      });
      if (i !== 0) { await say({ name: '秦墨', text: left <= 1 ? '明天就到期了，别忘了。' : '好书不厌百回读，拿稳了。' }); return; }
      f.borrow = null;
      f.gold = (f.gold || 0) + 6;
      ADV.Audio.sfx('item');
      if (sub && ADV.Mistake && ADV.Mistake.gain) ADV.Mistake.gain(sub, 2);   // 按时归还：对应科目小幅巩固
      E().playAction(ent, 'laugh', 1.6);
      await say({ name: '秦墨', text: '按期归还，不错。\n这是图书馆的守信奖励，收好。' });
      logEvent(`按期归还了《${bk.name}》`);
      save();
      UI().toast(' 📚 按期还书 · 💰 +6 ');
      return;
    }
    const i = await choose(['借阅一本', '就这样吧'], { caption: { name: '秦墨', text: '想借书？规矩只有一条——\n借期三天，按时归还。' } });
    if (i !== 0) return;
    const list = ADV.Books.byWhere('library');
    const j = await choose(list.map(b => b.name), { caption: { name: '秦墨', text: '随便挑——课本、闲书都行。\n借期三天。' } });
    if (j < 0 || j >= list.length) return;
    const bk = list[j];
    f.borrow = { id: bk.id, due: C.day + 3 };
    ADV.Audio.sfx('item');
    UI().toast(` 📚 借到《${bk.name}》· 三天内记得还 `);
    logEvent(`向秦墨借了《${bk.name}》`);
    save();
    await say({ name: '秦墨', text: `《${bk.name}》登记在你名下了。\n三天后来还——读完了，它才真正是你的。` });
  }

  /* ==================== 书的守护者们（新人物 + 任务） ==================== */

  // 图书馆管理员 · 秦墨：读书任务
  S.librarian = async (ent) => {
    const f = F();
    const n = ADV.Collect.ids('books').length;
    /* —— P-B2 微剧情二号线 ②中段：修书秘方（林小雨线） —— */
    if (f.rainChain === 1) {
      f.rainChain = 2;
      E().playAction(ent, 'think', 1.6);
      await say({ name: '秦墨', text: '淋皱的书页？常见。\n吸水纸夹进皱页，合上厚书压一夜——\n平了。别用熨斗，学生会烫出焦边的。' });
      await say({ name: '秦墨', text: '（他递来几张雪白的吸水纸）\n「替我带句话：书不怕旧，\n就怕没人想把它修好。」' });
      gainBond('librarian', 3);
      save();
      UI().toast(' 📜 拿到了修书秘方——回去告诉林小雨吧 ');
      return;
    }
    if (!f.libQuest) {
      f.libQuest = true;
      E().playAction(ent, 'read', 1.6);
      await say({ name: '秦墨', text: '欢迎来到图书馆，我是管理员秦墨。' });
      await say({ name: '秦墨', text: '这里的书随便读。但有个规矩——\n读完的书，要留下点什么。' });
      await say({ name: '秦墨', text: '哪怕只有一句话，抄在自己的本子上。\n那才叫「读过」。' });
      UI().toast(' 📚 秦墨的任务：读完 3 本书（任意地点） ');
      save();
      return;
    }
    if (f.libDone) {
      await say({ name: '秦墨', text: '书架上又多了几本被读过的书。\n你的摘抄我看了，写得不错。' });
      return libMenu(ent);                                     // 任务完成后：常设借阅台
    }
    if (n >= 3) {
      f.libDone = true;
      ADV.Audio.sfx('fanfare');
      E().playAction(ent, 'laugh', 1.6);
      await say({ name: '秦墨', text: `已经读完 ${n} 本了……\n比我预想的快。` });
      await say({ name: '秦墨', text: '这是给你的——\n书里最好的位置，我替你留着。' });
      f.gold = (f.gold || 0) + 40;
      ADV.Collect.addItem('coffee', 2);
      await ADV.UI.itemGet('书院特调咖啡 ×2', '#8a5ad9');
      UI().toast(' 💰 读书奖励 +40 ');
      logEvent('完成了秦墨的读书任务');
      save();
      return libMenu(ent);                                     // 领完奖顺势开放借阅台
    }
    await say({ name: '秦墨', text: `读完 ${n} / 3 本。\n书架在那边，自己去拿吧。` });
    return libMenu(ent);                                       // 任务中也能先借书
  };

  // 小镇旧书摊 · 旧书翁：收摘抄 + 半价旧书
  S.bookstall = async () => {
    await say({ name: '旧书摊', text: '木牌上写着：\n「旧书半价，读完再卖回来也行。」' });
  };
  S.oldbook = async (ent) => {
    const f = F();
    const ex = Object.keys(f.excerpts || {}).length;
    if (!f.stallQuest) {
      f.stallQuest = true;
      E().playAction(ent, 'think', 1.6);
      await say({ name: '旧书翁', text: '哟，年轻人。这些旧书都是别人\n读过、留下来的。' });
      await say({ name: '旧书翁', text: '书不怕旧，怕的是没人读。\n你要是有摘抄，拿来给我看看？' });
      UI().toast(' 📜 旧书翁的请求：摘抄满 10 句 ');
      save();
      return;
    }
    if (!f.stallDone && ex >= 10) {
      f.stallDone = true;
      ADV.Audio.sfx('fanfare');
      E().playAction(ent, 'laugh', 1.6);
      await say({ name: '旧书翁', text: `抄了 ${ex} 句？……嗯，字里有劲儿。` });
      await say({ name: '旧书翁', text: '送你一句话，比书值钱：\n「问渠那得清如许？为有源头活水来。」' });
      ADV.Collect.gain('quotes', 'q20');
      f.excerpts = f.excerpts || {};
      f.excerpts['q20'] = { day: ADV.Cal.day, from: '旧书翁的赠言' };
      await ADV.UI.itemGet('旧书翁的赠言', '#8af0e8');
      logEvent('把摘抄本给旧书翁看过');
      save();
      return;
    }
    // 半价旧书摊 + 周日故事会（day%7===0 限定；故事按周数轮换，确定性）
    const list = ADV.Books.byWhere('shop');
    const isSunday = ADV.Cal.day % 7 === 0 && f.storyDay !== ADV.Cal.day;
    const STORIES = [
      ['石桥的来历', '「镇口那座石桥，比你爷爷年纪还大。\n当年没有桥，娃娃们上学要蹚水——\n是全镇人你一块我一块，把桥背过了河。」'],
      ['老校钟', '「校门口那口钟，原是老祠堂的。\n敲了六十年敲哑了嗓子，也没换新的——\n挂在那儿，提醒娃娃们别迟到。」'],
      ['第一辆自行车', '「全镇头一辆自行车是邮递员骑来的。\n那时候娃娃们追着车跑二里地，\n就为了听那一串叮铃铃。」'],
      ['露天放映队', '「早年间放映队一年来一回。\n幕布往晒谷场一挂，全镇自带板凳——\n演什么都好看，因为一年就这一场。」']
    ];
    const opts = list.map(b => `${b.name} 💰${Math.ceil(b.price / 2)}${ADV.Collect.has('books', b.id) ? '（已有）' : ''}`);
    if (isSunday) opts.push('听段故事会（周日限定）');
    opts.push('就这样吧');
    const i = await choose(opts, { caption: { name: '旧书摊', text: `💰${f.gold}　摘抄 ${ex}/10 句\n旧书半价，随便翻。${isSunday ? '\n（今天书摊前有故事会）' : ''}` } });
    if (i < 0 || i === opts.length - 1) return;
    if (isSunday && i === list.length) {
      const [title, line] = STORIES[Math.floor(ADV.Cal.day / 7) % STORIES.length];
      f.storyDay = ADV.Cal.day;
      E().playAction(ent, 'think', 1.8);
      await say({ name: '旧书翁', text: `【${title}】\n${line}` });
      if (ADV.Growth) ADV.Growth.addDim('mind', 2, '旧书翁的故事会');
      UI().toast(' 📖 故事会：心性 +2（下周日还有新故事） ');
      logEvent(`在旧书摊听了《${title}》的故事`);
      save();
      return;
    }
    const bk = list[i], price = Math.ceil(bk.price / 2);
    if (ADV.Collect.has('books', bk.id)) { await say({ name: '旧书翁', text: '这本你已经有了。\n书不怕重，可家里也得放得下。' }); return; }
    if (f.gold < price) { ADV.Audio.sfx('wrong'); await say({ name: '旧书翁', text: '钱不够？先记着，书我不卖给别人。' }); return; }
    f.gold -= price;
    ADV.Collect.gain('books', bk.id);
    ADV.Audio.sfx('item');
    await say({ name: '旧书翁', text: `${bk.name} 拿好。\n读过之后，它才算真正属于你。` });
    const j = await choose(['现在就翻开读', '收进书柜'], { caption: { name: '旧书翁', text: '要现在读两页吗？' } });
    if (j === 0) await readBook(bk.id);
    save();
  };

  // 书友会 · 小卷：读书交流与读书会
  S.buddy = async (ent) => {
    const f = F();
    const n = ADV.Collect.ids('books').length, ex = Object.keys(f.excerpts || {}).length;
    E().playAction(ent, 'read', 1.6);
    if (f.clubDone) {
      await say({ name: '小卷', text: '下次读书会我讲《大学》——\n“苟日新，日日新，又日新”嘛。' });
      return;
    }
    if (n >= 5 && ex >= 15) {
      f.clubDone = true;
      ADV.Audio.sfx('fanfare');
      E().playAction(ent, 'laugh', 1.6);
      await say({ name: '小卷', text: `读完 ${n} 本、摘抄 ${ex} 句……\n你够格当读书会的主讲人了！` });
      await say({ name: '小卷', text: '分享一句你最喜欢的话吧——\n我先说：「三人行，必有我师焉。」' });
      f.gold = (f.gold || 0) + 50;
      ADV.Collect.addItem('poem', 1);
      await ADV.UI.itemGet('读书会的纪念诗集', '#ff6a7a');
      logEvent('在小卷的读书会上分享了摘抄');
      save();
      return;
    }
    const pool = [
      '我在读《昆虫记》——法布尔太有意思了。',
      '书要读出声音才记得住哦，试试念出来。',
      '我记性差，所以什么都抄下来。\n抄着抄着，就成了自己的。'
    ];
    await say({ name: '小卷', text: `${pool[(n + ex) % pool.length]}\n（进度：读完 ${n} 本 / 摘抄 ${ex} 句）` });
  };

  // 日记模板（轮换，避免千篇一律）
  const DIARY_TPL = [
    d => `${d.event}。\n书上说：「${d.quote}」\n${d.from}\n合上本子，好像又明白了一点点。`,
    d => `${d.event}。\n忽然想起一句话——「${d.quote}」\n${d.from}\n把它抄进本子，也抄进心里。`,
    d => `${d.event}。\n「${d.quote}」\n${d.from}\n今天的我，比昨天多懂了一点点。`
  ];

  // 夜晚写日记：选今天的一件事 + 引用一句摘抄过的名句
  async function diaryWrite() {
    const f = F(), C = ADV.Cal;
    f.excerpts = f.excerpts || {};
    f.diary = f.diary || [];
    const evs = (f.today || []).slice(0, 8);
    if (!evs.length) evs.push('平平淡淡的一天，也有它自己的好');
    evs.push('心情有点复杂，写不太清');
    const ei = await choose(evs, {
      caption: { name: '📔 写日记', text: `第 ${C.day} 天 · ${C.season()}季 · ${C.weather}\n今天最想记下的一件事是——` }
    });
    if (ei < 0) return;
    const event = evs[ei];
    const ex = Object.keys(f.excerpts);
    let quote = '', from = '';
    if (ex.length) {
      const recent = ex.slice(-8);
      // 摘抄本里既有“名句”(q1..)，也有“书中句子”(bookId#句号)：统一取文案
      const pick = key => {
        const e = f.excerpts[key] || {};
        const q = ADV.Collect.info('quotes', key);
        return e.text ? { quote: e.text, from: '—— ' + (e.from || '') }
                      : { quote: (q && q.name) || '（？）', from: (q && q.desc) || '' };
      };
      const qopts = recent.map(key => pick(key).quote).concat(['（今天不引用）']);
      const qi = await choose(qopts, { caption: { name: '📔 写日记', text: '想在本子上用上一句读过的话吗？' } });
      if (qi >= 0 && qi < recent.length) {
        const sel = pick(recent[qi]);
        quote = sel.quote;
        from = sel.from;
      }
    }
    const head = `${C.season()}季，第 ${C.day} 天，${C.weather}。`;
    const body = quote
      ? DIARY_TPL[f.diary.length % DIARY_TPL.length]({ event, quote, from })
      : `${event}。\n（今天没有引用句子，就写写自己的心情吧。）`;
    f.diary.push({ day: C.day, season: C.season(), weather: C.weather, event, quote, from, text: head + '\n' + body });
    if (f.diary.length > 60) f.diary.shift();      // 手账只留最近 60 篇（C18）：常年游玩不再把存档无限撑大；星数另计不受影响
    f.diaryStars = (f.diaryStars || 0) + 1;
    f.studyBuff = true;                            // 写日记 = 复盘，等同复习
    await say({ name: '日记', text: head + '\n' + body });
    if (f.diaryStars === 1 && !ADV.Collect.has('quotes', 'q16')) {
      ADV.Collect.gain('quotes', 'q16');
      f.excerpts['q16'] = { day: C.day, from: '写日记时的领悟' };
      await say({ text: '写着写着，你忽然懂了——\n「学而不思则罔，思而不学则殆。」\n（靠自己悟到的第一句话，也抄进本子）' });
    }
    if (f.diaryStars % 3 === 0) { f.gold = (f.gold || 0) + 20; UI().toast(' 📔 坚持写日记：金币 +20 '); }
    ADV.Audio.sfx('save');
    save();
  }

  // 翻看往期日记
  async function diaryRead() {
    const f = F(), list = f.diary || [];
    if (!list.length) { await say({ text: '日记本还是崭新的。\n（夜晚写一篇吧）' }); return; }
    for (const d of list.slice(-5)) await say({ name: `📔 第 ${d.day} 天`, text: d.text });
    if (list.length > 5) await say({ text: `……前面还有 ${list.length - 5} 篇。` });
    await say({ text: `共 ${list.length} 篇日记 · 写作星 ${f.diaryStars || 0} 颗` });
  }

  /* ---------- 商店（列表显示已持有；选中后可买 1 或一次买到金币上限） ---------- */
  async function shop(stock, name) {
    const list = stock.slice();
    while (true) {
      const i = await choose(list.map(id => {
        const info = ADV.Collect.itemInfo(id);
        const own = ADV.Collect.count(id);
        return `${info.name}  💰${info.price}${own ? `（已有 ×${own}）` : ''}`;
      }).concat(['离开']),
        { caption: { name, text: `金币：${F().gold}\n要买点什么？` } });
      if (i >= list.length) return;
      const id = list[i], info = ADV.Collect.itemInfo(id);
      const own = ADV.Collect.count(id);
      const afford = Math.max(0, Math.floor(F().gold / info.price));   // 金币买得起的最大数量
      const opts = [`买 1（💰${info.price}）`];
      if (afford > 1) opts.push(`买 ${afford} 个（💰${afford * info.price}，买到上限）`);
      opts.push('返回');
      const j = await choose(opts, { caption: { name, text: `${info.name}（已有 ×${own}）\n身上金币 💰${F().gold}` } });
      if (j >= opts.length - 1) continue;
      const n = j === 0 ? 1 : afford;
      if (n < 1 || F().gold < info.price * n) { ADV.Audio.sfx('wrong'); await say({ name, text: '金币不够啦～' }); continue; }
      F().gold -= info.price * n;
      ADV.Collect.addItem(id, n);
      ADV.Audio.sfx('item');
      UI().toast(` 买入 ${info.name} ×${n}（余 💰${F().gold}）`);
      save();
    }
  }
  S.giftShop = () => shop(['bait', 'bugNet', 'fineNet', 'goldNet', 'basket', 'bigCage', 'colorCage', 'wheat', 'flower', 'poem', 'ballcard', 'ribbon', 'pencil', 'sketch', 'coffee', 'hoe', 'wateringCan', 'scythe', 'pickaxe', 'axe', 'shovel', 'fishingRod', 'shears', 'camera', 'sprinkler', 'fertilizer', 'scarecrowKit'], '礼品店');
  S.foodShop = () => shop(['bread', 'juice', 'snack'], '小吃摊');

  /* ==================== 跳蚤市场（交易 + 算术 + 记账） ==================== */
  function ledgerAdd(txt, d) {               // 记一笔流水（保留近 30 条）
    const f = F();
    f.ledger = f.ledger || [];
    f.ledger.push({ day: ADV.Cal.day, txt, d });
    while (f.ledger.length > 30) f.ledger.shift();
  }
  function sellable() {                      // 可摆摊的闲置（有参考价且身上有货）
    return ADV.Collect.bagList().filter(x => x.price > 0 && x.n > 0);
  }

  // —— 摆摊卖货：顾客出价 → 心算还价提价 ——
  async function marketSell() {
    const f = F();
    const goods = sellable();
    if (!goods.length) { await say({ name: '摊主爷爷', text: '身上没有能卖的闲置呀。\n（零食、礼物、小鱼干都能拿来摆）' }); return; }
    const opts = goods.map(g => `${g.name} ×${g.n}（参考 💰${g.price}）`).concat(['收摊']);
    const i = await choose(opts, { caption: { name: '跳蚤市场 · 摆摊', text: '把闲置摆上摊布——\n顾客来了，价钱可以谈！' } });
    if (i < 0 || i === goods.length) return;
    const g = goods[i];
    let offer = Math.max(1, Math.round(g.price * (0.8 + Math.random() * 0.4)));
    const styleBuff = f.marketCharmDay === ADV.Cal.day && f.marketCharmUsed !== ADV.Cal.day;
    if (styleBuff) offer = Math.max(1, Math.round(offer * 1.25));
    const cust = ['同学小卷', '路过的阿姨', '隔壁班的小虎', '王叔', '林小雨'][(Math.random() * 5) | 0];
    await say({ name: cust, text: `这个${g.name}，多少钱卖呀？\n（顾客出价 💰${offer}${styleBuff ? ' · 理发店精神头加成' : ''}）` });
    const j = await choose(['成交！', '「再高一点嘛」（心算提价）', '不卖了'], { caption: { name: '跳蚤市场 · 还价', text: `顾客出价 💰${offer}（参考价 💰${g.price}）` } });
    if (j === 2) { await say({ name: '摊主爷爷', text: '不急不急，好货总有人识。' }); return; }
    let tag = '';
    if (j === 1) {                            // 还价：答对一道数学题，提价五成
      const q = await ADV.AI.question('math', 'easy');
      const k = await choose(q.opts, { caption: { name: '还价心算', text: q.q + '\n（答对提价五成，答错按原价）' } });
      if (ADV.Mistake) ADV.Mistake.answer('数学', q, k);
      if (k === q.a) {
        offer = Math.round(offer * 1.5);
        tag = '（还价成功）';
        ADV.Audio.sfx('fanfare');
        await say({ name: cust, text: `哎哟，会算账！\n好吧好吧，💰${offer} 成交！` });
      } else {
        ADV.Audio.sfx('wrong');
        await say({ name: cust, text: `咦，这笔账不对哦。\n那还是按 💰${offer} 来。\n（心算再练练，能卖更贵！）` });
      }
    }
    ADV.Collect.useItem(g.id, 1);
    f.gold = (f.gold || 0) + offer;
    if (styleBuff) { f.marketCharmUsed = ADV.Cal.day; tag += '（造型加成）'; }
    ledgerAdd(`卖出${g.name}${tag}`, offer);
    ADV.Audio.sfx('save');
    save();
  }

  // —— 以物易物：掂量双方价值再拍板 ——
  async function marketBarter() {
    const IT = ADV.Collect.ITEMS;
    const mine = sellable();
    if (!mine.length) { await say({ name: '摊主爷爷', text: '没带能换的东西呀。\n（带点零食或小玩意来）' }); return; }
    const hisPool = ['juice', 'flower', 'pencil', 'snack', 'ballcard', 'sketch', 'coffee', 'poem'];
    const hisId = hisPool[(Math.random() * hisPool.length) | 0];
    const his = IT[hisId];
    await say({ name: '摊主爷爷', text: `我这有个${his.name}（参考 💰${his.price}），\n你拿一样东西来换。` });
    const opts = mine.map(g => `${g.name} ×${g.n}（参考 💰${g.price}）`).concat(['不换了']);
    const i = await choose(opts, { caption: { name: '跳蚤市场 · 以物易物', text: '换值了还是亏了？\n自己掂量～' } });
    if (i < 0 || i === mine.length) return;
    const g = mine[i];
    ADV.Collect.useItem(g.id, 1);
    ADV.Collect.addItem(hisId, 1);
    const diff = his.price - g.price;
    ledgerAdd(`${g.name} 换 ${his.name}`, diff);
    await say({
      name: '摊主爷爷',
      text: diff >= 5 ? '哈哈，你小子会挑！这波你赚了。'
        : diff > -5 ? '公道公道，童叟无欺。'
        : '哟，亏了一点点——\n不过喜欢就是值！'
    });
    if (his.gift) UI().toast(` 🎁 ${his.name}可以送给喜欢它的伙伴 `);
    save();
  }

  // —— 拍卖会（每日一场）：心算行价，出准价最划算 ——
  async function marketAuction() {
    const f = F(), C = ADV.Cal, IT = ADV.Collect.ITEMS;
    if (f.auctionDay === C.day) { await say({ name: '摊主爷爷', text: '今天的拍卖会散场喽，\n明天赶早！' }); return; }
    f.auctionDay = C.day;
    const a = 3 + ((Math.random() * 8) | 0), b = 3 + ((Math.random() * 8) | 0);
    const fair = a * b;                       // 行价 = 顾客自己心算的乘积
    const goodsPool = ['comic', 'ballcard', 'sketch', 'poem'];
    const gid = goodsPool[(Math.random() * goodsPool.length) | 0];
    const gd = IT[gid];
    await say({ name: '摊主爷爷', text: `压轴拍卖——${gd.name}！\n行价嘛……老规矩自己算：${a} × ${b} 是多少？` });
    const hi = fair + 6 + ((Math.random() * 6) | 0), lo = fair - 6 - ((Math.random() * 6) | 0);
    const prices = [fair, hi, lo].sort((x, y) => y - x);   // 三档价，位置不打表
    const i = await choose(prices.map(p => `出价 💰${Math.max(1, p)}`).concat(['放弃竞拍']),
      { caption: { name: '跳蚤市场 · 拍卖', text: `${gd.name}\n行价自己算：${a} × ${b} = ?\n（礼品店参考 💰${gd.price}——多付的可不退！）` } });
    if (i < 0 || i === prices.length) { await say({ name: '摊主爷爷', text: '不举牌也行，看看热闹。' }); return; }
    const bid = prices[i];
    if (f.gold < bid) { await say({ name: '摊主爷爷', text: '口袋里的钱不够呀。\n（先去挣点零花钱再来）' }); return; }
    if (bid === fair) {
      f.gold -= fair;
      ADV.Collect.addItem(gid, 1);
      ledgerAdd(`拍卖准价拿下${gd.name}`, -fair);
      ADV.Audio.sfx('fanfare');
      await say({ name: '摊主爷爷', text: `分毫不差！${gd.name} 归你——\n准价拿下，是个行家！` });
    } else if (bid > fair) {
      f.gold -= bid;
      ADV.Collect.addItem(gid, 1);
      ledgerAdd(`拍卖拍下${gd.name}（出高了）`, -bid);
      await say({ name: '摊主爷爷', text: `${gd.name} 归你。\n（多掏了 💰${bid - fair}——心算再练练）` });
    } else {
      await say({ name: '摊主爷爷', text: `出低喽，被别人抢走啦！\n（行价其实是 💰${fair}）` });
    }
    save();
  }

  // —— 账本：流水与盈亏 ——
  async function marketLedger() {
    const led = F().ledger || [];
    if (!led.length) { await say({ name: '账本', text: '账本还是空白的。\n（做几笔买卖再来对账）' }); return; }
    const lines = led.slice(-6).map(e => `第${e.day}天 ${e.txt} ${e.d >= 0 ? '+' : ''}${e.d}`);
    const sum = led.reduce((s, e) => s + e.d, 0);
    await say({ name: '账本', text: lines.join('\n') + `\n——\n累计：${sum >= 0 ? '赚' : '亏'} 💰${Math.abs(sum)}（易物按差价折算）` });
  }

  S.market = async (ent) => {
    const f = F();
    if (!f.marketMet) {
      f.marketMet = true;
      E().playAction(ent, 'laugh', 1.6);
      await say({ name: '摊主爷爷', text: '哟，小朋友也来跳蚤市场？' });
      await say({ name: '摊主爷爷', text: '摆摊卖闲置、以物易物、拍卖会——\n练的全是算账的本事！' });
      await say({ name: '摊主爷爷', text: '挣了花了，我这账本都给你记着。\n会算的孩子，走到哪都不吃亏。' });
    }
    while (true) {
      const i = await choose(['摆摊卖货（还价）', '以物易物', '拍卖会（每日一场）', '看看账本', '离开'],
        { caption: { name: '跳蚤市场', text: `💰${f.gold}\n旧物新缘，好价靠自己谈！` } });
      if (i === 0) await marketSell();
      else if (i === 1) await marketBarter();
      else if (i === 2) await marketAuction();
      else if (i === 3) await marketLedger();
      else return;
    }
  };
  S.marketBoard = async () => {
    if (periodScene('marketBoard', [5])) {
      await say({ name: '木牌', text: '深夜的集市已经收了摊，\n木牌歪歪地插在空场中间。\n旁边留着几片踩瘪的纸箱角，和一盏没来得及拎走的马灯。' });
      logEvent('深夜看过收了摊的跳蚤市场');
      save();
      return;
    }
    await say({ name: '木牌', text: '【跳蚤市场】\n摆摊 · 易物 · 拍卖\n（和摊主爷爷聊聊就能开张）' });
  };

  S.bookShop = async () => {
    const f = F();
    const list = ADV.Books.byWhere('shop');
    let page = 0;
    const per = 6;
    while (true) {
      const maxPage = Math.max(0, Math.ceil(list.length / per) - 1);
      page = Math.min(page, maxPage);
      const slice = list.slice(page * per, page * per + per);
      const opts = slice.map(b => `${b.name} 💰${b.price}${ADV.Collect.has('books', b.id) ? '（已购）' : ''}`);
      opts.push(page < maxPage ? '下一页 ▶' : '回到第一页');
      opts.push('离开');
      const i = await choose(opts, { caption: { name: '书店', text: `💰${f.gold}　第 ${page + 1}/${maxPage + 1} 页\n买下的书可以在家书柜重读` } });
      if (i === opts.length - 1) return;
      if (i === slice.length) { page = page < maxPage ? page + 1 : 0; continue; }
      const bk = slice[i];
      if (ADV.Collect.has('books', bk.id)) { await say({ name: '书店老板', text: '这本你已经有了，\n回家书柜里躺着呢。' }); continue; }
      if (f.gold < bk.price) { ADV.Audio.sfx('wrong'); await say({ name: '书店老板', text: '金币不够～' }); continue; }
      f.gold -= bk.price;
      ADV.Collect.gain('books', bk.id);
      ADV.Audio.sfx('item');
      logEvent(`在书店买下了${bk.name}`);
      save();
      const j = await choose(['现在就翻开读', '回家再读'], { caption: { name: '书店老板', text: '买书不读，等于白买哦～' } });
      if (j === 0) await readBook(bk.id);
    }
  };
  S.repairSign = async () => { await say({ name: '木牌', text: '「大壮家 · 修车铺」\n（周末敲敲打打，整天叮叮当当）' }); };
  S.repairSpot = async () => {
    if (F().gearGot) { await say({ text: '工作台上摆着各式齿轮。\n（大壮说送你一个当纪念）' }); return; }
    F().gearGot = true;
    ADV.Collect.addItem('gear', 1);
    ADV.Audio.sfx('item');
    await say({ text: '你在工作台角落捡到一枚\n亮晶晶的自行车齿轮。' });
    await ADV.UI.itemGet('自行车齿轮', '#c8d0dc');
    save();
  };
  S.clinicSign = async () => { await say({ name: '木牌', text: '「医务室」\n—— 战斗输了免费包扎 ' }); };
  S.roofStairs = async () => { await say({ text: '一道铁梯通向教学楼天台。\n（听说乌云帮把那里当基地……）' }); };
  S.dinnerTable2 = S.dinnerTable;

  S.albumSpot = async () => {
    if (ADV.Collect.count('album') || F().xiaoyingDone) { await say({ text: '柜子里整整齐齐。\n（画册的事已经办完了）' }); return; }
    ADV.Collect.addItem('album', 1);
    ADV.Audio.sfx('item');
    await say({ text: '讲台柜子里放着一本画册——\n封皮上画满了校园里的人。' });
    await ADV.UI.itemGet('被没收的画册', '#b98af5');
    UI().toast(' 似乎是天台上某个人的…… ');
  };

  /* ---------- 道场 / 乌云帮 ---------- */
  S.dummy = async () => {
    await say({ text: '木人桩安静地立着。\n（练练手？）' });
    const w = await new Promise(res => ADV.Battle.start('dummy', {}, res));
    if (w) UI().toast(' 木人桩：又赢了它，它依然爱你 ');
  };
  S.challengeBoard = async () => {
    const f = F();
    if (await tourney()) return;                        // 周末武斗大会优先
    if (f.act < 2) { await say({ name: '挑战榜', text: '（道场暂时不对外开放）\n据说在等一支名叫「乌云帮」的队伍……' }); return; }
    if (!f.wuyunB1) {
      await say({ name: '挑战榜', text: '「乌云帮」占据榜首！\n第一战：大壮！' });
      const w = await new Promise(res => ADV.Battle.start('dazhuang', {}, res));
      if (w) { f.wuyunB1 = true; addCup(4); save(); await say({ text: '大壮一屁股坐在地上：\n「行啊你……乌云在楼上等你。」' }); }
      else await say({ text: '大壮挠挠头：\n「承让承让——去医务室看看吧。」' });
      return;
    }
    if (!f.wuyunB2) {
      await say({ name: '挑战榜', text: '第二战：小影！' });
      const w = await new Promise(res => ADV.Battle.start('xiaoying', {}, res));
      if (w) { f.wuyunB2 = true; addCup(4); save(); await say({ text: '小影收起漫画本，\n第一次正眼看你：「……有点意思。」' }); }
      else await say({ text: '「就这？」她翻了个白眼。' });
      return;
    }
    if (!f.wuyunB3) {
      await say({ name: '挑战榜', text: '最终战：乌云帮老大 —— 乌云！' });
      const w = await new Promise(res => ADV.Battle.start('wuyun', {}, res));
      if (w) {
        f.wuyunB3 = true; addCup(6); save();
        await say({ text: '乌云抹了把汗，忽然笑了：\n「痛快！好久没这么痛快了！」' });
        if (f.act < 3) { f.act = 3; save(); UI().toast(' 第三幕·寻宝篇：乌云帮心服了！去天台找他们聊聊吧 '); }
      } else await say({ text: '「回去多练练！」乌云抱着手臂。' });
      return;
    }
    // —— 金鹏文武战（好感入门后） ——
    if (friend('jinpeng').love >= 10 && !f.gangDuel) {
      f.gangDuel = true;
      await say({ text: '道场来了位不速之客——金鹏。\n「乌云帮的三连战我也看了。\n和我打一场，文武各半！」' });
      await new Promise(res => ADV.Battle.start('rival', {}, res));
      await say({ text: '武试结束（不论胜负，金鹏都皱着眉认了）。\n「文试——三题，敢吗？」' });
      for (const s of ['chinese', 'math', 'english']) await examAsk('金鹏的文试', s, 'normal');
      await say({ name: '金鹏', text: '……可恶。全都，是我输。\n「朋友」这个词，我记下了。' });
      gainBond('jinpeng', 15);
      addCup(6);
      save();
      return;
    }
    // —— 隐藏 BOSS：保安大爷（第四章后） ——
    if (f.act >= 4 && !f.senseiWin) {
      await say({ name: '挑战榜', text: '榜单最下方有一行小字：\n「想试试真正的对手？——扫帚即剑的老者」' });
      const g = await choose(['挑战传说中的大爷！', '还是算了'], { caption: { name: '？？？', text: '一位穿着制服的大爷正在门口扫落叶，\n扫帚挥动如行云流水……' } });
      if (g === 1) return;
      const w = await new Promise(res => ADV.Battle.start('sensei', {}, res));
      if (w) {
        f.senseiWin = true;
        F().gold = (F().gold || 0) + 100;
        F().martial.listen = true;                      // 传功四：《听风辨位》
        ADV.Collect.gain('quotes', 'q9');
        addCup(10);
        save();
        await say({ name: '保安大爷', text: '哈哈——多少年没人接得住我的扫帚了。\n这枚「扫地僧徽章」……啊不，是心意，收下！' });
        await say({ name: '保安大爷', text: '再教你师兄的压箱底功夫——\n《听风辨位》：风声一动，身形已闪。' });
        await ADV.UI.itemGet('武林秘诀·听风辨位', '#d8c078');
        UI().toast(' ⚔ 学会武功：听风辨位（战斗技·会心） ');
        UI().toast(' 🏆 隐藏BOSS击败：获得称号「扫帚剑圣认可」 ');
      } else await say({ name: '保安大爷', text: '回去多读书，多锻炼！\n（扫地僧的认可不是那么好拿的）' });
      return;
    }
    // —— P-B5 强度墙：极限连战入口挂在陪练菜单里（玩4。扫地僧认可或毕业后开放） ——
    async function rushMode() {
      const f = F();
      if (f.rushDay === ADV.Cal.day) {
        await say({ name: '挑战榜', text: `今日连战已结束——最远纪录 ${f.rushBest} 连胜。\n（道场师傅在给你的旧伤涂药酒）` });
        return;
      }
      const seq = ['dazhuang', 'xiaoying', 'wuyun', 'rival', 'jinpeng', 'sensei'];
      const NAMEMAP = { dazhuang: '大壮', xiaoying: '小影', wuyun: '乌云', rival: '对手班主力', jinpeng: '金鹏', sensei: '保安大爷' };
      f.rushDay = ADV.Cal.day;
      let wins = 0;
      for (let i = 0; i < seq.length; i++) {
        const tier = i + 1;
        await say({ name: '挑战榜', text: `第 ${tier} 关：${NAMEMAP[seq[i]]}${tier > 1 ? '（强化 ' + tier + ' 级）' : ''}！` });
        const w = await new Promise(res => ADV.Battle.start(seq[i], { tier, tierTag: ' ·劲敌' }, res));
        if (!w) {
          await say({ text: `第 ${tier} 关止步。\n道场师傅递来一条毛巾：「能站到这儿，已经很强了。」` });
          break;
        }
        wins++;
        const gg = 15 * tier;
        f.gold = (f.gold || 0) + gg;
        UI().toast(` ⚔ 第 ${tier} 关突破！金币 +${gg} `);
      }
      if (wins > (f.rushBest || 0)) {
        f.rushBest = wins;
        if (wins >= 3) { addCup(6); UI().toast(' 🏆 连战纪录更新：3 连胜！学院分 +6 '); }
        if (wins >= 5) { addCup(8); UI().toast(' 🏆 5 连胜——道场挂出了你的照片！学院分 +8 '); }
        if (wins >= 6) { addCup(12); gainBond('dojomaster', 10); UI().toast(' 👑 巅峰六连！「不败之壁」实至名归！学院分 +12 '); }
        logEvent(`极限连战打出 ${wins} 连胜`);
      }
      save();
    }
    // —— 每日陪练（拿零花钱） ——
    if (f.sparDay !== ADV.Cal.day) {                     // sparDay：陪练专用日锁（勿用 arenaDay，那是极限连战削峰锁）
      const rushOn = f.senseiWin || f.graduated;
      const opts = rushOn ? ['来场陪练（每日一次）', '发起极限连战！', '改天再说']
                          : ['来场陪练（每日一次）', '改天再说'];
      const g = await choose(opts, { caption: { name: '挑战榜', text: rushOn
        ? `【每日陪练】赢了有零花钱。\n【极限连战】六关难度递增，中途不歇——\n目前最远纪录：${f.rushBest || 0} 连胜。` 
        : '今日陪练开放！赢了有零花钱。' } });
      if (g === 1 && rushOn) return rushMode();
      if (g !== 0) return;
      const foes = ['dazhuang', 'xiaoying', 'wuyun', 'rival'];
      const foe = foes[(ADV.Cal.day) % foes.length];
      const w = await new Promise(res => ADV.Battle.start(foe, {}, res));
      f.sparDay = ADV.Cal.day;
      if (w) {
        const gg = 15 + ((Math.random() * 15) | 0);
        F().gold = (F().gold || 0) + gg;
        await say({ text: `陪练获胜！对手请你喝了汽水。💰 +${gg}` });
      } else await say({ text: '虽败犹荣——明天再来！' });
      save();
      return;
    }
    await say({ name: '挑战榜', text: '榜首：你 💪\n（道场师傅若有所思地点头）' });
  };
  S.wuyun = async (ent) => {
    const f = F();
    if (await ngReunion('wuyun')) return;
    // —— 传功三：《乌云十八步》（挚友后） ——
    if (f.wuyunGang && friend('wuyun').stage >= 3 && !(f.martial || {}).steps) {
      f.martial.steps = true;
      E().playAction(ent, 'laugh', 1.6);
      ADV.Audio.sfx('item');
      await say({ name: '乌云', text: '留级一年，别人以为我废了——\n我就在操场上把十八步走了一万遍。' });
      await ADV.UI.itemGet('武林秘诀·乌云十八步', '#8a94c0');
      UI().toast(' ⚔ 学会轻功：乌云十八步（速度+1 战斗技） ');
      save();
      return;
    }
    if (f.wuyunGang) { await say({ name: '乌云', text: f.wuyunPass ? '62 分……我自己都裱起来了。' : '有什么埋宝点，尽管问！' }); return; }
    if (f.wuyunB3 && !f.wuyunPass) {
      if (!f.wuyunStudy) {
        await say({ name: '乌云', text: '月考快到了……\n你要是能陪我复习，我就把埋宝图给你。' });
        const g = await choose(['陪你复习！', '下次吧'], { caption: { name: '乌云', text: '三道题，答对两道算你行。' } });
        if (g === 1) return;
        let ok = 0;
        for (const s of ['math', 'math', 'chinese']) if (await examAsk('一起复习', s, 'easy')) ok++;
        if (ok >= 2) {
          f.wuyunStudy = true;
          await say({ name: '乌云', text: '……好像，也没那么难。\n月考，我跟兄弟们试试。' });
          save();
        } else await say({ name: '乌云', text: '呃，你自己都答不对还教我？\n（再来一次！）' });
        return;
      }
      await say({ name: '乌云', text: '等月考放榜吧。\n62 分，我说到做到。' });
      return;
    }
    await say({ name: '乌云', text: '……来天台干嘛，看风景啊。' });
  };
  S.dazhuang = async (ent) => {
    const f = F();
    // —— 传功二：《铁臂功》（挚友后） ——
    if (f.dazhuangDone && friend('dazhuang').stage >= 3 && !(f.martial || {}).tie) {
      f.martial.tie = true;
      E().playAction(ent, 'laugh', 1.6);
      ADV.Audio.sfx('item');
      await say({ name: '大壮', text: '教你个硬功——铁臂功！\n我爸说：胳膊是修车人的第二双眼。' });
      await ADV.UI.itemGet('武林秘诀·铁臂功', '#e8a03a');
      UI().toast(' ⚔ 学会武功：铁臂功（攻击+1 防御+1） ');
      save();
      return;
    }
    if (f.dazhuangDone) { await say({ name: '大壮', text: '车修好啦，骑得可顺了！' }); return; }
    if (f.wuyunB3 && !f.dazhuangDone) {
      if (!ADV.Collect.count('gear')) { await say({ name: '大壮', text: '我爸修车铺缺个齿轮……\n（小镇东边的修车铺工作台上好像有）' }); return; }
      await say({ name: '大壮', text: '齿轮！你哪来的——\n行，装回去试试！' });
      const w = await new Promise(res => ADV.Mini.start('chess', res));   // 空间谜题=骑士棋
      if (w) {
        ADV.Collect.useItem('gear');
        f.dazhuangDone = true; addCup(4);
        ADV.Collect.gain('wishes', 'w6');               // 心愿集：大壮「把爸的修车铺开成连锁」
        save();
        E().playAction(ent, 'laugh', 1.6);
        await say({ name: '大壮', text: '转动如飞！\n你这空间感，跟我有一拼！' });
      } else await say({ name: '大壮', text: '差一步……再试试？' });
      return;
    }
    await say({ name: '大壮', text: '（他正对着一本习题册叹气）' });
  };
  S.xiaoying = async (ent) => {
    const f = F();
    if (f.xiaoyingDone) { await say({ name: '小影', text: '画册我又画满了三页。\n主角是你，别骄傲。' }); return; }
    if (f.wuyunB3 && !f.xiaoyingDone) {
      if (!ADV.Collect.count('album')) { await say({ name: '小影', text: '……画册被教务处没收了。\n（教室讲台的柜子里，她说）' }); return; }
      if (!ADV.Cal.isNight()) { await say({ name: '小影', text: '傍晚再来。日落前的天台最好看。', }); return; }
      ADV.Collect.useItem('album');
      f.xiaoyingDone = true; addCup(4);
      ADV.Collect.gain('wishes', 'w7');                 // 心愿集：小影「这次的画册，画满再走」
      save();
      E().playAction(ent, 'laugh', 1.6);
      await say({ text: '你把画册递还给她。\n夕阳把两个人的影子拉得很长。' });
      await say({ name: '小影', text: '……每一页，都是这里的人。\n我怕转学走的时候，什么都带不走。' });
      await say({ name: '小影', text: '现在不怕了。\n这本，送你的第一页——是你。' });
      return;
    }
    await say({ name: '小影', text: '（她头也不抬地画着什么）' });
  };
  // 三人齐 → 入伙
  // —— 社团 & 道场小玩法 ——
  S.gobanPlay = S.chessClub = async () => {
    await say({ text: '围棋社的棋盘泛着木光。\n（来一局骑士巡棋？）' });
    const w = await new Promise(res => ADV.Mini.start('chess', res));
    if (w) { addCup(3 + (F().club === '棋艺社' ? 1 : 0)); if (Math.random() < .5) ADV.Collect.gain('books', ['b3', 'b5'][(ADV.Cal.day % 2) | 0]); }
    else await say({ text: '社长微笑着复盘：「马走日，再看一步。」' });
  };
  S.artClub = async () => {
    await say({ text: '美术社的画架上是一幅未完成的校园。\n（补一笔？）' });
    ADV.Audio.sfx('photo');
    await say({ text: '你添上了喷泉边的一只小猫。\n部长说：有灵气！' });
    addCup(2);
  };
  S.sciClub = async () => {
    await say({ text: '科学社的坩埚咕嘟作响。\n（小心配制）' });
    const i = await choose(['先加月光石粉', '先搅拌三圈', '直接加热'], { cancelIndex: -1, caption: { name: '实验笔记', text: '「溶剂沸腾前，应先——」' } });
    if (i === 1) { ADV.Audio.sfx('correct'); addCup(3); await say({ text: '液体泛起清亮的蓝光——成功！' }); }
    else { ADV.Audio.sfx('wrong'); await say({ text: '噗——冒了个大黑泡。（答案：先搅拌三圈）' }); }
  };
  S.yingEasel = async () => { await say({ text: '天台的画架上夹着一幅速写：\n三个少年背对夕阳，中间留着空位。' }); };
  S.dojomaster = async (ent) => {
    const f = F(), M = f.martial;
    // —— 传功一：《扫帚剑法》（三连战后） ——
    if (f.wuyunB3 && !M.sweep) {
      await say({ name: '道场师傅', text: '后生，你在挑战榜上那一手……\n有点我年轻时的影子。' });
      await say({ name: '道场师傅', text: '老朽无儿无女，只有一门\n《扫帚剑法》——今日传你。' });
      M.sweep = true;
      ADV.Audio.sfx('item');
      await ADV.UI.itemGet('武林秘诀·扫帚剑法', '#c98d5a');
      UI().toast(' ⚔ 学会武功：扫帚剑法（战斗技） ');
      save();
      return;
    }
    // —— 修炼：提升武学修为（上限三重） ——
    if (M.sweep && (M.lvl || 0) < 3) {
      const g = await choose(['与师傅过招（修炼）', '请教心法'], { caption: { name: '道场师傅', text: `武学修为：第 ${M.lvl || 0} 重（上限三重）\n每突破一重，攻击 +2。今日要练吗？` } });
      if (g === 1) {
        await say({ name: '道场师傅', text: '「练武不练功，到老一场空。\n功课和拳脚，是同一个道理。」' });
        gainBond('dojomaster', 2);
        return;
      }
      const w = await new Promise(res => ADV.Battle.start('sensei', {}, res));
      if (w) {
        M.lvl = Math.min(3, (M.lvl || 0) + 1);
        addCup(2);
        save();
        await say({ name: '道场师傅', text: `好！武学修为突破——第 ${M.lvl} 重！\n（攻击永久 +2）` });
      } else await say({ name: '道场师傅', text: '败给老朽不丢人。回去把字条上的口诀再默一遍。' });
      return;
    }
    await say({ name: '道场师傅', text: '胜负乃兵家常事。\n要打，就去挑战榜；要悟，就去学知识。' });
  };
  S.doctor = async () => {
    await say({ name: '校医', text: '哪里不舒服？\n……哦，战斗的伤？绷带管够。' });
    F().gold = (F().gold || 0) + 0;
    await say({ text: '（校医给你贴了创可贴，精神多了）\n（战斗体力已恢复）' });
  };

  /* ---------- 第三章 · 时光回廊 ---------- */
  S.bellTower = async () => {
    const f = F();
    if (f.ch3Done) { await say({ name: '钟楼', text: '钟声悠远。\n（时光回廊静静运转着）' }); return; }
    if (!f.houseCup) { await say({ name: '钟楼', text: '古老的钟楼大门紧闭。\n（门缝里透出微光——似乎在等待什么）' }); return; }
    const photos = ADV.Collect.catCount('photos');
    const yalbumOk = f.yalbum >= 5;
    if (!f.e0open) {
      await say({ name: '钟楼', text: `钟门缓缓开启……\n【时光回廊条件】学院杯 ✔ ／ 回忆照片 ${photos}/10 ／ 庭院旧相册 ${f.yalbum}/5` });
      if (photos >= 10 && yalbumOk) {
        f.e0open = true; save();
        ADV.Audio.sfx('open');
        await say({ text: '钟锤无风自动，敲了十三下——\n地底传来齿轮转动的轰鸣。' });
        await say({ name: '???', text: '「欢迎，收藏回忆的人。\n回廊的四个时代，等你走过。」' });
      } else {
        await say({ name: '钟楼', text: '（回忆的分量还不够。\n多拍照，多找找院子的旧相册）' });
      }
      return;
    }
    await say({ name: '钟楼', text: '（时光回廊已开启，\n北新区钟楼下方即是入口）' });
  };
  const eraDone = async (f, flag, _unused, npcName, lines, photoId, quoteId) => {
    if (f[flag]) { await say({ name: npcName, text: lines[lines.length - 1] }); return; }
    for (const l of lines) await say({ name: npcName, text: l });
    f[flag] = true;
    addCup(6);
    if (photoId) ADV.Collect.gain('photos', photoId);
    if (quoteId) ADV.Collect.gain('quotes', quoteId);
    save();
    UI().toast(' 一段时代记忆被点亮 ');
    await chapterMid(3);
  };
  S.era1npc = () => eraDone(F(), 'e1', null, '年轻的晨曦女士', [
    '「你好呀，未来的孩子。\n这里是阳光中学的第一间教室。」',
    '「我把一件东西藏进了学校的深处——\n不是宝物，是一份约定。」',
    '「等它再被需要的那天，\n会有像你这样的人来取。去吧。」'
  ], null, 'q4');
  // —— B组·era1 谜题：布置教室（五件家具归位） ——
  S.era1desk = async () => {
    const f = F();
    if (f.era1Puzzle) { await say({ text: '崭新的讲台上放着一页手记：\n「愿此地的孩子，眼中有光。」' }); return; }
    f.era1Puzzle = true;
    await say({ text: '晨曦女士的教室空荡荡——\n五件家具等着归位，她在一旁轻声提示：' });
    await say({ name: '年轻的晨曦女士', text: '「孩子们要看得见窗外——\n所以地图不该挡住光。」' });
    const steps = [];
    // 三步选位（简化为三题）
    for (const [item, a, b, c, right, hint] of [
      ['世界地图', '挂东墙（迎光）', '挂西墙（背光）', '挂门后', 0, '光从东窗来，地图该迎着光'],
      ['座钟', '讲台上', '门边', '窗台', 1, '钟声不能吵到读书人——离书远些'],
      ['花盆', '讲台角', '窗台外沿', '储物柜顶', 0, '要老师每天都能看见它']
    ]) {
      const i = await choose([a, b, c], { cancelIndex: -1, caption: { name: '布置教室', text: `${item} 放哪里？` } });
      steps.push(i === right);
      if (i !== right) await say({ name: '年轻的晨曦女士', text: `「嗯……${hint}」` });
    }
    const okN = steps.filter(Boolean).length;
    if (okN >= 2) {
      addCup(4);
      if (ADV.Growth) ADV.Growth.addDim('mind', 2, '读懂了她的心思');
      await say({ text: '教室豁然开朗——\n每一件家具都在正确的位置呼吸。' });
      await say({ name: '年轻的晨曦女士', text: '谢谢你……其实，\n我怕极了。一个人办学校。\n（她递出手记的一页——软肋第一次可见）' });
      await say({ text: '手记那页写着：\n「怕的话，就把教室布置好。\n教室好了，心就定了。」' });
    } else {
      await say({ text: '摆得不太对……她笑了笑，亲手调整。\n（可以再来一次，听清她的提示）' });
      f.era1Puzzle = false;
    }
    save();
  };
  S.era2npc = () => eraDone(F(), 'e2', null, '少年的校长', [
    '「化、化学方程式配不平啊……\n啊！你是谁？！」',
    '「失败没什么可怕的。\n——你这么一说，好像也是哦。」',
    '「那我以后当老师的时候，\n也要这样告诉学生。」'
  ], null, 'q8');
  S.era2bench = async () => {
    const f = F();
    const i = await choose(['2H₂ + O₂ = 2H₂O', 'H₂ + O₂ = H₂O', '2H₂ + 2O₂ = 2H₂O'], { cancelIndex: -1, caption: { name: '配平练习', text: '帮少年配平：氢气燃烧生成水' } });
    if (i === 0) {
      ADV.Audio.sfx('correct'); addCup(3);
      await say({ text: '少年恍然大悟：\n「原来系数要这样配！」' });
      if (!f.era2Letter) {
        f.era2Letter = true;
        await say({ text: '反应成功了——\n他松了口气，从口袋掏出一张没寄出的信纸：' });
        await say({ text: '「晨曦同学：\n炸掉的反应我很抱歉，\n赔你的笔记本下周一定还。——F」\n（三章里，他终于能笑着提起这事）' });
        if (ADV.Growth) ADV.Growth.milestone('读到校长少年时的道歉信');
      }
    } else await say({ text: '少年挠头：「再想想……」' });
  };
  S.era3npc = () => eraDone(F(), 'e3', null, '年轻的管理员', [
    '「嘘——这本书的借书卡上，\n有他的名字哦。」',
    '「他说等书架摆满，就娶我。\n结果一摆，就是一辈子。」',
    '「替我谢谢那个还在擦书架的老家伙。\n就说……书的暗号，我一直记得。」'
  ], null, 'q11');
  S.era3cart = async () => {
    const f = F();
    const i = await choose(['《静夜思》', '《小王子》', '《西游记》'], { cancelIndex: -1, caption: { name: '书架暗号', text: '「初见之书，首字为『床』——是哪本？」' } });
    if (i === 0) {
      ADV.Audio.sfx('correct'); addCup(3);
      await say({ text: '书架轻响，弹出一枚旧书签。' });
      if (!f.era3Note) {
        f.era3Note = true;
        await say({ text: '书页边角一行娟秀小字：\n「借书人：灰。还书人：永远是我。」' });
        await say({ text: '你把书签放回原处。\n有些约定，比书还重。' });
        if (ADV.Growth) ADV.Growth.addDim('mind', 2, '守住了别人的约定');
      }
    } else await say({ text: '（好像不对……想想哪本书以「床」开头）' });
  };
  S.era4npc = () => eraDone(F(), 'e4', null, '少年的爸爸', [
    '「这张纸条……我攥了一节课，\n就是不敢递过去。」',
    '「你说……她会笑话我吗？」',
    '「好！放学我就给她！\n——谢谢你，神秘的同学！」'
  ], null, 'q7');
  S.era4desk = async () => {
    const w = await new Promise(res => ADV.Mini.start('broom', res));   // 传纸条=竞速+视线判定
    if (w) {
      addCup(3);
      await say({ text: '老师第三次转头的瞬间——\n你压低身形，把纸条精准送达！\n历史成功交付！' });
      await say({ text: '纸条上只有五个字：\n「放学，一起走吗？」\n——正是你在院子里挖到的那张旧照片背面的字。\n（时空闭环，悄悄合上。）' });
      if (ADV.Growth) ADV.Growth.milestone('帮爸爸送出了那张纸条');
    } else await say({ text: '被老师逮个正着，罚站一节课。\n（再试一次改变历史？）' });
  };
  S.bossMirror = async () => {
    const f = F();
    if (f.shadowWin) { await say({ text: '镜面澄澈。\n所有的回忆都安然无恙。' }); return; }
    const photos = ADV.Collect.ids('photos');
    if (f.e4 && !f.shadowWin) {
      await say({ text: '镜中之雾凝聚成形——\n遗忘之雾，张开无边的幕。' });
      await say({ name: '遗忘之雾', text: '……那道镜中的贪影？\n是从我身上逃走的一角。它去找宝石，\n是想记起自己的名字——可名字太轻了。' });
      await say({ name: '遗忘之雾', text: '我想要更重的东西。\n把照片交出来……\n让一切回忆，都归于安静的白……' });
      const stages = Object.values(state.friends).reduce((s, r) => s + (r.stage || 0), 0);
      if (stages < 6) {
        await say({ text: `雾太浓了……\n（回忆之力不足：友谊故事总进度 ${stages}，需要 6）\n（去点亮更多朋友的故事再回来）` });
        return;
      }
      // —— 记忆三问：选择影响 BOSS 台词与战斗低语 ——
      await say({ text: '镜面泛起涟漪——\n战前，它想先读懂你。' });
      const q1 = await choose(['石门开启的雷光', '食堂的炊烟', '同学的笑容', '妈妈留的灯'], { caption: { name: '镜之间', text: '「这一年，最亮的光是？」' } });
      const q2 = await choose(['上课的钟声', '赵老师的琴声', '操场的加油声', '妈妈的晚安'], { caption: { name: '镜之间', text: '「最想留住的声音是？」' } });
      const q3 = await choose(['四枚徽章', '一叠照片', '朋友们', '回忆本身'], { caption: { name: '镜之间', text: '「如果只能带走一样？」' } });
      f.mirrorAnswers = [q1, q2, q3];
      await say({ name: '遗忘之雾', text: `「${['雷光', '炊烟', '笑容', '灯'][q1]}……\n那就先吹灭它——」` });
      const w = await new Promise(res => ADV.Battle.start('shadowM', { photoMode: true }, res));
      if (w) {
        f.shadowWin = true; addCup(20); save();
        ADV.Audio.playBgm('tender');
        await say({ text: '最后一张照片亮起——\n毕业礼的大合影，在雾中灼灼发光。' });
        await say({ name: '遗忘之雾', text: '这样温暖的……回忆……\n我，也想被这样记住啊……' });
        await say({ text: '雾散了。\n镜子里，映出礼堂的方向。' });
        UI().toast(' 遗忘之雾消散——毕业礼堂开启（回廊深处北门） ');
      } else {
        await say({ text: '雾暂时吞没了照片的光……\n（按 C 打出回忆能造成大伤害并回血！）' });
      }
      return;
    }
    await say({ text: '镜子沉睡着。\n（先走完四个时代）' });
  };
  S.gradScene = async () => {
    const f = F();
    if (f.ch3Done) { await say({ name: '所有人', text: '毕业快乐——！！' }); return; }
    if (!f.shadowWin) { await say({ text: '礼堂的大门虚掩着。\n（镜中之雾尚未散去——先完成回廊深处的试炼）' }); return; }
    f.ch3Done = true;
    ADV.Audio.playBgm('grad');
    ADV.Collect.gain('photos', 'p_grad');
    await say({ text: '礼堂的灯一盏盏亮起。\n所有人都来了——一个不少。' });
    await say({ name: '校长', text: '这一年，谢谢你们。\n把相机架好了——来，看镜头！' });
    ADV.Audio.sfx('photo');
    await say({ text: '咔嚓。\n时间在这一格，永远停住了。' });
    await ADV.UI.itemGet('毕业证书', '#ffd94c');
    addCup(30); F().gold = (F().gold || 0) + 200;
    UI().toast(' 第三章通关！四季花园已开启（星之庭园南侧） ');
    f.fourSeasons = true;
    save();
  };
  // —— B组·毕业赠言集：毕业后逐个邀 12 人合影 ——
  const GRAD_QUOTES = [
    ['xiaoming', '小明', '下一部漫画的主角，\n还是你。'],
    ['xiaohong', '小红', '你追上我的那次，\n其实我开心了一整天。'],
    ['xiaogang', '小刚', '下次比武，\n我不会再输了。……大概。'],
    ['xiaopang', '小胖', '毕业宴我请！\n阿姨已经答应了！'],
    ['wuyun', '乌云', '62 分，\n是我这辈子最骄傲的数字。'],
    ['mom', '妈妈', '长大了，\n也要记得回家吃饭。'],
    ['teacherLiu', '刘老师', '校队的大门\n永远为你开着！'],
    ['teacherZhao', '赵老师', '愿你的人生，\n永远有音乐。'],
    ['momo', '墨墨', '我配不出「离别」的药。\n因为根本不需要。'],
    ['jinpeng', '金鹏', '下次的对决，\n我全力以赴。'],
    ['star', '星儿', '星星会记得，\n来过这里的你。'],
    ['doctor', '校医', '健健康康的，\n就别再来医务室了。']
  ];
  S.gradPhoto = async () => {
    const f = F();
    if (!f.ch3Done) { await say({ text: '（礼堂还空着——\n毕业礼之后，这里会热闹起来）' }); return; }
    f.gradQuote = f.gradQuote || [];
    const left = GRAD_QUOTES.filter(([id]) => !f.gradQuote.includes(id));
    if (!left.length) {
      await say({ text: '所有合影都挂上了墙——\n十二张笑脸，一个不少。' });
      await say({ text: '「毕业赠言集」已完整。\n（这一面墙，就是你的整个冒险。）' });
      return;
    }
    const [id, name, quote] = left[0];
    await say({ text: `你举起相机——\n「${name}，来张合影！」` });
    ADV.Audio.sfx('photo');
    await say({ name, text: quote });
    f.gradQuote.push(id);
    gainBond(id, 3);
    if (ADV.Growth) ADV.Growth.addDim('bond', 1, '毕业合影');
    await say({ text: `（毕业赠言 ${f.gradQuote.length}/12）` });
    if (f.gradQuote.length >= 12) {
      ADV.Collect.gain('photos', 'p_grad');
      addCup(8);
      UI().toast(' 📷 「毕业赠言集」集齐：全员拍立得入手 ');
    }
    save();
  };
  S.gradSign = async () => { await say({ name: '横幅', text: '「毕业快乐 ——\n冒险永远没有终点」' }); };

  /* ---------- 番外 · 四季花园 ---------- */
  S.springSpot = async () => {
    await spirit('春', '春之守护灵', '「花儿收到你的心意啦～」')();
    ADV.Collect.addItem('flower', 1);
    await say({ text: '春之园的花开得正好。\n你摘了一束。（礼物 ×1）' });
  };
  S.summerSpot = async () => {
    await spirit('夏', '夏之守护灵', '「今晚的萤火，分你一半！」')();
    if (ADV.Collect.gain('insects', 'i6')) await say({ text: '夏夜的小径上，\n一只萤火虫落在你指尖，又飞进图鉴。' });
    else await say({ text: '萤火虫提着灯笼，\n在草丛里找朋友。' });
  };
  S.autumnSpot = async () => {
    await spirit('秋', '秋之守护灵', '「落叶是秋天写的信哦。」')();
    if (ADV.Collect.gain('leaves', 'l2')) await say({ text: '秋之园的红枫落下最后一片——\n正好接住。' });
    else await say({ text: '满地红叶，像着了火的信纸。' });
  };
  S.winterSpot = async () => {
    await spirit('冬', '冬之守护灵', '「雪，是天空盖的被子。」')();
    if (ADV.Collect.gain('quotes', 'q12')) await say({ text: '雪人插着的树枝上，\n挂着一句写给未来的话。' });
    else await say({ text: '雪人安静地站着，\n围巾是你送的那条颜色。' });
  };

  /* —— P-B1 晨曦祭坛（情5 伏笔回收）：二章提到「晨曦女士把一件圣物藏在学校最深处，
   *    庇护校园的四季与晨昏」——四季花园就是那件圣物本身。四灵苏醒后，祭坛可以唤醒 —— */
  S.dawnAltar = async () => {
    const f = F();
    if (f.dawnAltar) {
      await say({ name: '晨曦祭坛', text: '祭坛的光很安静，像谁的呼吸。\n（四季与晨昏都被好好照看着）' });
      return;
    }
    const awake = Object.keys(f.spirits || {}).length;
    if (awake < 4) {
      await say({ name: '晨曦祭坛', text: `古老的石坛沉睡着，\n四道凹槽里只有 ${awake} 道亮着微光。\n（照料四位季节守护灵，它们会带你到这里）` });
      return;
    }
    ADV.Audio.playBgm('mystery');
    await say({ text: '四道光从花园四角同时亮起——\n顺着草叶间的露水流向石坛。' });
    await say({ text: '祭坛中央浮现出一位白衣女士的幻影，\n眉眼和你见过的所有老照片都有点像。' });
    await say({ name: '晨曦女士', text: '「一百年了，终于有人把四季都照料了一遍。\n孩子，你找到答案了吗？」' });
    const i = await choose(['这花园就是圣物', '圣物是晨曦宝石', '我不知道'], {
      caption: { name: '晨曦女士', text: '「他们说我把一件圣物藏在了学校最深处，\n用来庇护四季与晨昏。——你猜，是什么？」' } });
    await say({ name: '晨曦女士', text: i === 0
      ? '「答对了。圣物不是一块石头——\n是有人愿意日复一日照看它们的心意。\n石头会碎，心意不会。」'
      : i === 1
        ? '「宝石只是钥匙。真正的圣物啊，\n是这座被无数双手养活的花园。\n宝石会丢，花园不会。」'
        : '「没关系，答案自己会长出来。\n你照料春的芽、夏的萤、秋的叶、冬的雪——\n这本身，就已经是圣物了。」' });
    ADV.Audio.sfx('fanfare');
    f.dawnAltar = true;
    ADV.Engine.setObjectOpen('dawnAltar', true, 'glow');
    ADV.Collect.gain('photos', 'p_dawn');              // 回忆照片：晨曦祭坛之光
    ADV.Cal.raiseMax(10);                              // 「庇护」的回礼：精力上限 +10
    addCup(10);
    gainBond('yuejian', 8);
    logEvent('唤醒了四季花园的晨曦祭坛');
    save();
    UI().toast(' 🌟 圣物伏笔回收：晨曦祭坛醒了！精力上限 +10 ');
    await say({ name: '晨曦女士', text: '「收下这份庇护吧——\n往后你每一个清晨，都会比昨天更精神一点。」\n（幻影化作光点，落进四季的土壤里）' });
    try { const m = ADV.Engine.map; if (m && m.bgmCur) ADV.Audio.playBgm(m.bgmCur); } catch (e) {}
  };

