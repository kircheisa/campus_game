/* =========================================================
 * game-scene.js —— 游戏剧情拆分段 3/8
 * 呼吸感彩蛋 · 教学区 · 村民帮助板 · 四季节庆 · 寻宝迷宫 · 第二章
 * 必须按 core → event → scene → quest → retro → town → life → save 顺序加载。
 * ========================================================= */
  /* ==================== C组 · 呼吸感（回访彩蛋） ==================== */
  S.boardCountdown = async () => {
    const C = ADV.Cal;
    const ch = chapterState();
    const left = Math.max(0, 30 - ADV.Cal.day);
    const weekCN = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][C.weekday() - 1];
    const lesson = (C.today && C.today().length) ? C.today().slice(0, Math.min(3, C.today().length)).join(' / ') : '休息日';
    const fest = C.festival ? C.festival() : '';
    await say({ text: `黑板右上角的粉笔字：\n「距离假期还有 ${left} 天」\n今天是${weekCN}：${lesson}${fest ? `\n角落还加写了一行：「${fest}快乐」` : ''}\n值日生还在下面补了一句：\n「本周章节：${ch.title}」\n（每天都有人认真擦掉重写）` });
  };
  S.seasonDeco = async () => {
    const s = ADV.Cal.season();
    const deco = { 春: '门框上挂着一枝樱花，\n花瓣偶尔飘进教室。', 夏: '门框垂下小风扇挂饰，\n呼啦呼啦转。', 秋: '一束金黄麦穗斜插在门侧，\n饱满得像要掉粒。', 冬: '门框缠着一圈棉花雪饰，\n暖乎乎的。' }[s];
    await say({ text: deco + `\n（${s}天的教室门口）` });
  };
  S.posterWall = async () => {
    const f = F(), week = Math.floor((ADV.Cal.day - 1) / 7) + 1;
    const posters = [
      '本周海报：运动会报名！\n（角落画着一只奔跑的猫）',
      '本周海报：图书角新书到馆～\n（署名：李老师）',
      '本周海报：合唱比赛招募！\n（赵老师的字，像音符）',
      '本周海报：科学社实验展示周！\n（边角有一颗手绘原子）'
    ];
    await say({ text: posters[(week - 1) % posters.length] + `\n（第 ${week} 周 · 小影的海报越画越好了）` });
  };
  // 夜晚教学楼氛围（走廊灯闪）
  S.nightLamp = async () => {
    if (!ADV.Cal.isNight()) { await say({ text: '（走廊的灯安安静静）' }); return; }
    await say({ text: '夜里的走廊灯忽明忽暗——' });
    await say({ text: '……原来是煤球趴在开关上睡觉，\n尾巴一下一下扫着它。' });
    if (ADV.Growth) ADV.Growth.addDim('mind', 1, '夜里的小温馨');
  };

  // —— 出口路牌 ——
  S.exitSign = async (o) => { await say({ text: `（路牌：「${o.text}」）` }); };

  /* ==================== A组 · 教学区激活（17 个交互点） ==================== */

  // —— 实验室 ——
  S.freeLab = async () => {
    const f = F(), C = ADV.Cal;
    if (f.freeLabDay === C.day) { await say({ text: '（今天的自由实验做过了——\n坩埚还留着余温）' }); return; }
    const targets = ['紫色', '橙色', '绿色'];
    const t = targets[(C.day) % 3];
    await say({ text: `自由实验时间！\n今日目标：调配出【${t}】试剂。` });
    const mix = [['红+蓝', 'purple'], ['红+黄', 'orange'], ['蓝+黄', 'green']];
    const i = await choose(mix.map(m => m[0]).concat('随便倒'), { caption: { name: '实验台', text: `红色、蓝色、黄色三瓶基础试剂。\n要配出${t}，应该——` } });
    const right = mix.find(m => m[1] === { 紫色: 'purple', 橙色: 'orange', 绿色: 'green' }[t]);
    f.freeLabDay = C.day;
    if (mix[i] === right) {
      ADV.Audio.sfx('correct');
      ADV.Collect.addItem('bread', 0); // noop 保底
      f.gold = (f.gold || 0) + 6;
      if (ADV.Growth) { ADV.Growth.addXP(5, '实验成功'); ADV.Growth.addDim('knowledge', 1, '亲手验证'); }
      await say({ text: `试管里泛起${t}的光——成功！\n陈老师点头：💰+6（实验津贴）` });
    } else if (i >= mix.length) {
      await say({ text: '噗——冒了个大黑泡。\n（陈老师扶额：胆子可嘉，下不为例）' });
    } else {
      await say({ text: `颜色不对……变成了可疑的灰色。\n（正确思路：${right[0].replace('+', ' 加 ')}）` });
    }
    save();
  };
  S.reagentRack = async () => {
    const f = F(), C = ADV.Cal;
    if (f.rackDay === C.day) { await say({ text: '（墙架今天翻过了，\n试剂瓶都摆得整整齐齐）' }); return; }
    f.rackDay = C.day;
    const r = Math.random();
    ADV.Audio.sfx('dig');
    if (r < .55) { f.gold = (f.gold || 0) + 5; await say({ text: '翻到半瓶没用完的试剂——\n折价卖给实验室 💰+5' }); }
    else if (r < .85) { await say({ text: '砰！彩烟炸开，你变成了小花猫。\n（同学们笑作一团）' }); if (ADV.Cal.costEnergy) ADV.Cal.costEnergy(5); }
    else { ADV.Collect.addItem('flower', 1); await say({ text: '角落里竟藏着一瓶「变色龙试剂」——\n在光下会变色的稀罕物。（礼物+1）' }); }
    save();
  };
  S.microscope = async () => {
    const un = ADV.Collect.DB.insects.filter(x => !ADV.Collect.has('insects', x.id));
    if (!un.length) { await say({ text: '（昆虫图鉴已齐——\n显微镜成了你的荣誉展台）' }); return; }
    const it = un[(Math.random() * un.length) | 0];
    await say({ text: `你把样本放上载物台——\n镜头里，${it.desc}\n「它的习性是……」（记录了一条线索）` });
    if (ADV.Growth) ADV.Growth.addDim('knowledge', 1, '观察');
    await say({ text: `线索指向【${it.name}】的出没地。\n（${it.id === 'i6' ? '夏夜河畔' : it.id === 'i5' ? '秋夜草丛' : '白天的花丛水边'}……）` });
  };
  S.fumeHood = async () => {
    if (!ADV.Cal.isNight()) { await say({ text: '（通风橱嗡嗡作响，\n白天看不出什么异样）' }); return; }
    await say({ text: '深夜的通风橱里，\n传出缓慢的、绵长的呼吸声……' });
    await say({ text: '——你壮着胆子拉开柜门：\n一摞待修的古籍，和灰先生的老花镜。\n（原来他夜里在这里修书）' });
    if (ADV.Growth) ADV.Growth.addDim('mind', 2, '深夜怪谈的勇气');
    await say({ text: '你轻轻合上柜门。\n有些秘密，看见了就替人守着吧。' });
  };

  // —— 食堂 ——
  const WEEK_MENU = ['糖醋排骨', '炸酱面', '红烧鱼', '咖喱饭', '饺子', '火锅', '扬州炒饭'];
  S.todayMenu = async () => {
    const f = F(), C = ADV.Cal;
    const today = WEEK_MENU[(C.day - 1) % 7];
    const tomorrow = WEEK_MENU[C.day % 7];
    await say({ text: `今日菜单：${today} 🍚\n（阿姨的手写板，字有点歪但很香）` });
    if (f.menuDay === C.day) { await say({ text: '（明天的菜已经猜过啦）' }); return; }
    const opts = shuffle([tomorrow, WEEK_MENU[(C.day + 2) % 7], WEEK_MENU[(C.day + 4) % 7]]);
    const pick = opts[await choose(opts, { caption: { name: '竞猜', text: '猜猜明天吃什么？\n（阿姨：猜中连续三天有惊喜！）' } })];
    f.menuDay = C.day;
    if (pick === tomorrow) {
      f.menuStreak = (f.menuStreak || 0) + 1;
      f.gold = (f.gold || 0) + 8;
      await say({ name: '食堂阿姨', text: `猜对啦！明天正是${tomorrow}！💰+8\n（连对 ${f.menuStreak} 天）` });
      if (f.menuStreak >= 3) { f.menuStreak = 0; ADV.Collect.addItem('r2', 1); await say({ name: '食堂阿姨', text: '连对三天！\n「阿姨特供」糖醋排骨饭，收好！' }); }
    } else {
      f.menuStreak = 0;
      await say({ name: '食堂阿姨', text: `可惜～明天是${tomorrow}。\n（明天再来猜！）` });
    }
    save();
  };
  S.stoveHelp = async () => {
    const f = F(), C = ADV.Cal;
    if (f.stoveDay === C.day) { await say({ text: '（灶台今天帮过了，\n阿姨赶你去洗手）' }); return; }
    await say({ text: '帮阿姨打下手——颠勺三连！' });
    f.stoveDay = C.day;
    const w = await new Promise(res => ADV.Mini.start('ball', res));
    if (w) {
      f.stovePts = (f.stovePts || 0) + 1;
      if (ADV.Growth) { ADV.Growth.addXP(4, '帮工'); ADV.Growth.addDim('art', 1, '灶台功夫'); }
      await say({ name: '食堂阿姨', text: `好勺法！\n（帮工 ${f.stovePts}/3 → 教你一道菜）` });
      if (f.stovePts >= 3) { f.stovePts = 0; await teachRecipe('aunt'); }
    } else await say({ name: '食堂阿姨', text: '火候差点，汤洒了些。\n（下次注意节奏！）' });
    save();
  };
  const LOST_ITEMS = [
    { id: 'scarf', name: '红领巾', to: 'xiaogang', line: '小刚别扭地系上：\n「……居然被你捡到。」' },
    { id: 'card', name: '饭卡', to: 'xiaopang', line: '小胖感动到语无伦次：\n「你救了我的胃！」' },
    { id: 'band', name: '头绳', to: 'xiaohong', line: '小红接过头绳笑了：\n「正找它呢！」' },
    { id: 'pen', name: '钢笔', to: 'principal', line: '校长抚着钢笔感慨：\n「这支笔，比你入学还年长。」' }
  ];
  S.lostFound = async () => {
    const f = F(), C = ADV.Cal;
    if (f.lostDay === C.day) { await say({ text: '（3 号桌今天干干净净）' }); return; }
    f.lostDay = C.day;
    const it = LOST_ITEMS[(C.day) % LOST_ITEMS.length];
    await say({ text: `3 号桌的角落里——\n一件被遗忘的${it.name}。` });
    const go = await choose(['物归原主', '放回原处'], { caption: { text: '要送还吗？' } });
    if (go === 1) { await say({ text: '你把它摆到桌面显眼处。\n（失主应该能看到吧）' }); return; }
    f.lostCount = (f.lostCount || 0) + 1;
    gainBond(it.to, 3);
    await say({ text: it.line });
    await say({ text: `（拾金不昧 ${f.lostCount}/10）` });
    if (f.lostCount >= 10) UI().toast(' 🏅 成就进度「拾金不昧」10/10：同学们都信任你 ');
    if (ADV.Growth) ADV.Growth.addDim('bond', 1, '物归原主');
    save();
  };

  // —— 食堂订单板（每日一单）：料理/鲜鱼的变现出口 ——
  // 池子随学习进度成长：一道菜没学时固定收鲜鱼，学会越多订单越值钱（收菜做特供）
  function orderBoardItem() {
    const f = F(), C = ADV.Cal;
    if (f.orderDay === C.day && f.orderItem) return f.orderItem;   // 今日已生成
    const pool = Object.keys(f.recipes || {}).concat(['fish']);
    f.orderItem = pool[(Math.random() * pool.length) | 0];
    f.orderDay = C.day; f.orderDone = false;
    return f.orderItem;
  }
  function orderPrice(id) {
    if (id === 'fish') return 24;                    // 比直接卖食堂（20）略高，激励接单
    const it = ADV.Collect.itemInfo(id);
    return 18 + ((it && it.heal) || 30);             // 料理按回复力定价（原本 price:0 不可卖）
  }
  S.orderBoard = async () => {
    const f = F(), C = ADV.Cal;
    const id = orderBoardItem();
    const it = ADV.Collect.itemInfo(id);
    const price = orderPrice(id);
    if (f.orderDone) { await say({ text: '（今日订单已交付，\n黑板擦得干干净净）' }); return; }
    await say({ text: `【今日订单】\n阿姨想收：${it.name} ×1 → 💰${price}\n（收菜做特供，欢迎投稿！）` });
    const has = ADV.Collect.count(id);
    if (has <= 0) { await say({ name: '食堂阿姨', text: `还没有${it.name}呀？\n（做饭桌、去河边、逛商店，总有来路）` }); return; }
    const i = await choose([`交给她（${it.name} ×1 → 💰${price}）`, '再想想'], { caption: { name: '食堂阿姨', text: `哟，有货？\n（你身上有 ${has} 份）` } });
    if (i !== 0) return;
    ADV.Collect.useItem(id, 1);
    f.orderDone = true;
    f.gold = (f.gold || 0) + price;
    ADV.Audio.sfx('save');
    gainBond('aunt', 4);
    await say({ name: '食堂阿姨', text: `成交！这道我改良改良，\n明天写进特供栏！💰+${price}` });
    save();
  };

  // —— 周日专属活动：跳蚤集市 + 周日电影夜（day%7===0 开放；选品/遇友用 day 驱动，保证确定性） ——
  const FLEA_POOL = ['ballcard', 'coffee', 'flower', 'snack', 'juice', 'poem', 'ribbon', 'pencil', 'sketch', 'bread'];
  // s15 集市扩容：进度解锁的摊位货（石门开后矿工的矿石周日流进集市，期中过后连金矿都有）
  const FLEA_EXTRA = [['gateOpen', ['copperOre', 'ironOre']], ['midterm', ['goldOre']]];
  function fleaPool(f) {
    const pool = FLEA_POOL.slice();
    for (const [key, ids] of FLEA_EXTRA) if (f[key]) pool.push(...ids);
    return pool;
  }
  S.fleaMarket = async () => {
    const f = F(), C = ADV.Cal;
    if (C.day % 7 !== 0) { await say({ text: '（空地上只铺着几块旧垫布。\n摊主们说：周日开市！）' }); return; }
    if (f.fleaDay === C.day) { await say({ text: '（今天的集市已经逛过一轮啦）' }); return; }
    f.fleaDay = C.day;
    f.fleaVisits = (f.fleaVisits || 0) + 1;          // 成就「集市常客」计数
    // 3 件八折货：day 做种子确定性选品（同一天所有人看到同一批货）；
    // 头牌保持家常货池，扩容货只上 2、3 号摊（兼容旧档选品记忆）
    const items = [0, 1, 2].map(i => {
      const pool = i === 0 ? FLEA_POOL : fleaPool(f);
      const id = pool[(C.day * 3 + i * 7) % pool.length];
      const it = ADV.Collect.itemInfo(id);
      return { id, it, price: Math.max(1, Math.round((it.price || 5) * .8)) };
    });
    await say({ name: '集市摊主', text: '周日大集！旧货新货都有——\n今天一律八折，随便看！' });
    const i = await choose([...items.map(x => `${x.it.name}（八折 💰${x.price}）`), '不买了'], { caption: { name: '跳蚤集市', text: `（你带 💰${f.gold || 0}）` } });
    if (i >= 3) { await say({ name: '集市摊主', text: '下个周日再来逛！' }); return; }
    const x = items[i];
    if ((f.gold || 0) < x.price) { await say({ name: '集市摊主', text: '钱不够呀。\n（回去攒攒，下个周日还开）' }); return; }
    f.gold -= x.price;
    ADV.Collect.addItem(x.id, 1);
    ADV.Audio.sfx('save');
    await say({ name: '集市摊主', text: `好眼光！${x.it.name}拿好——\n下个周日再来！` });
    save();
  };
  S.movieNight = async () => {
    const f = F(), C = ADV.Cal;
    if (C.day % 7 !== 0) { await say({ text: '（影幕还没挂起来。\n【周日电影夜】傍晚开演）' }); return; }
    if (f.movieSeen === C.day) { await say({ text: '（今晚的电影已经看过啦）' }); return; }
    const i = await choose(['买票入场（💰10）', '下次再来'], { caption: { name: '周日电影夜', text: '【周末特别场】\n全镇的同学都来了！' } });
    if (i !== 0) return;
    if ((f.gold || 0) < 10) { await say({ name: '检票员', text: '票钱不够呀。\n（在广场边看看热闹也挺好）' }); return; }
    f.gold -= 10;
    f.movieSeen = C.day;
    f.movieNights = (f.movieNights || 0) + 1;        // 纪念票根计数（收藏向）
    ADV.Collect.gain('photos', 'p_ticket');          // 票根入册（回忆照片类，gain 自带去重）
    // 片单：六人组保底 + 剧情同伴友谊二阶入列（处熟了才会约你一起看电影）
    const mates = ['xiaoming', 'xiaohong', 'xiaopang', 'xiaogang', 'dazhuang', 'wuyun']
      .concat(['xiaoying', 'momo', 'jinpeng', 'lufei', 'linxiaoyu', 'yuejian']
        .filter(id => ((state.friends[id] && state.friends[id].stage) || 0) >= 2));
    const mate = mates[C.day % mates.length];        // day 确定性挑一位同学偶遇，好感 +2
    gainBond(mate, 2);
    ADV.Audio.sfx('emote');
    await say({ text: '灯光暗下，光束打在幕布上——\n你和大家一起笑、一起喊。\n（纪念票根已收好 🎫）' });
    UI().toast(` 🎬 电影夜纪念：和${(BOND[mate] && BOND[mate].name) || mate}多了些共同话题 +2 `);
    save();
  };

  /* ==================== s6 村民帮助板（小镇 · 周日集市旁） ====================
   * 居民们的委托每日刷新（day 做种子，同一天所有人看到同一批）；
   * 交货得酬金 + 帮助板声望——声望里程碑有学院分与成就 */
  const HELP_POOL = [
    { id: 'bait',  npc: '田伯',   item: 'bait',   n: 2, gold: 15, bond: 'farmer',   text: '「老伙计又空钩了——两条蚯蚓就行。」' },
    { id: 'fish',  npc: '食堂阿姨', item: 'fish',  n: 1, gold: 20, bond: 'aunt',     text: '「今天的菜缺条鲜鱼，客人等着呢。」' },
    { id: 'wheat', npc: '鸡舍咕咕', item: 'wheat', n: 2, gold: 12,                   text: '「鸡舍的小家伙们馋小麦了。」' },
    { id: 'flower', npc: '花婆婆', item: 'flower', n: 1, gold: 14, bond: 'flower',  text: '「桌上的花蔫了，换一枝新鲜的吧。」' },
    { id: 'strawberry', npc: '小胖', item: 'strawberry', n: 2, gold: 18, bond: 'xiaopang', seasons: ['spring'], text: '「草莓上市了！我要吃两盒！」' },
    { id: 'watermelon', npc: '王美', item: 'watermelon', n: 1, gold: 18, bond: 'wangmei', seasons: ['summer'], text: '「广播站热成蒸笼——来个冰镇西瓜！」' },
    { id: 'sweetpotato', npc: '大头', item: 'sweetpotato', n: 2, gold: 18, bond: 'datou', seasons: ['autumn'], text: '「烤红薯！烤红薯！两根起步！」' },
    { id: 'pomelo', npc: '倩倩',  item: 'pomelo', n: 1, gold: 20, bond: 'qianqian', seasons: ['winter'], text: '（她指了指柚子，比了个「甜甜的」手势）' },
    { id: 'peach', npc: '陆飞',   item: 'peach',  n: 1, gold: 15, bond: 'lufei',   seasons: ['summer'], text: '「跑完十公里，就缺一口桃子。」' },
    { id: 'milk',  npc: '妈妈',   item: 'milk',   n: 1, gold: 16, bond: 'mom', need: 'cow',   text: '「今晚想给全家人做牛奶炖蛋——家里有牛吗？」' },
    { id: 'wool',  npc: '裁缝阿姨', item: 'wool', n: 2, gold: 24, need: 'sheep',    text: '「给你织副手套的料——先赊两团羊毛。」' },
  ];
  S.helpBoard = async () => {
    const f = F(), C = ADV.Cal, CO = ADV.Collect;
    if (!f.helpIntro) {
      f.helpIntro = true;
      await say({ name: '帮助板', text: '钉满字条的旧木板——\n「镇上谁家缺什么，都写在这块板上。\n帮一把，酬金当面点清。」' });
      UI().toast(' 📋 村民帮助板：委托每日更新 ');
      save();
    }
    for (;;) {
      const eligible = HELP_POOL.filter(r =>
        (!r.seasons || r.seasons.includes(C.seasonEn()))
        && (!r.need || f[r.need]));
      const reqs = seededShuffle(eligible, C.day * 7 + 3).slice(0, 3);
      const opts = reqs.map(r => {
        const done = f.helpDone[r.id] === C.day;
        return `${r.npc}：${ADV.Collect.itemInfo(r.item).name} ×${r.n}（💰${r.gold}）${done ? ' ✔已帮' : ''}`;
      }).concat(['离开帮助板']);
      const i = await choose(opts, { caption: { name: '帮助板', text: `今日委托（声望 ${f.helpPts || 0}）：\n${reqs[0] ? reqs[0].text : '「今天都齐了，明儿再来看！」'}` } });
      if (i < 0 || i >= reqs.length) return;
      const r = reqs[i];
      if (f.helpDone[r.id] === C.day) { await say({ text: '（这一单今天已经交过了）' }); continue; }
      if (CO.count(r.item) < r.n) { await say({ name: '帮助板', text: `（还差 ${r.n - CO.count(r.item)} 份${ADV.Collect.itemInfo(r.item).name}——\n凑齐了再来交）` }); continue; }
      const sure = await choose([`交给${r.npc}（成交）`, '先不交'], { caption: { name: '帮助板', text: `${r.npc}的委托：${r.text}\n（酬金 💰${r.gold}）` } });
      if (sure !== 0) continue;
      CO.useItem(r.item, r.n);
      f.gold = (f.gold || 0) + r.gold;
      f.helpDone[r.id] = C.day;
      f.helpPts = (f.helpPts || 0) + 1;
      if (r.bond && BOND[r.bond]) gainBond(r.bond, 2);
      ADV.Audio.sfx('save');
      UI().toast(` 📋 帮上忙了！金币 +${r.gold} · 帮助板声望 ${f.helpPts} `);
      // 声望里程碑
      if (f.helpPts === 3) { addCup(4); UI().toast(' 🏆 声望里程碑：小镇熟面孔（学院分 +4） '); }
      if (f.helpPts === 7) { f.gold += 50; UI().toast(' 🏆 声望里程碑：热心肠（金币 +50） '); }
      if (f.helpPts === 12) { addCup(8); UI().toast(' 🏆 声望里程碑：小镇之光（学院分 +8） '); }
      logEvent(`帮${r.npc}完成了帮助板委托`);
      save();
    }
  };
  /* 今日剩余委托数（B20「今日未完成」聚合行消费；与 helpBoard 同一套资格+按日洗牌口径） */
  S.helpBoardLeft = () => {
    const f = F(), C = ADV.Cal;
    if (!C || !f.helpIntro) return 0;
    const eligible = HELP_POOL.filter(r =>
      (!r.seasons || r.seasons.includes(C.seasonEn()))
      && (!r.need || f[r.need]));
    return seededShuffle(eligible, C.day * 7 + 3).filter(r => f.helpDone[r.id] !== C.day).length;
  };

  /* —— 教室 · 班务角（C7 班委竞选）：凭帮助板声望竞聘委员，就任后每周一份职责小任务 —— */
  const CLASS_ROLES = {
    study: { name: '学习委员', duty: '辅导同学解题', line: '「我想让每次考试后，\n错题都能变成全班的台阶。」\n——掌声比粉笔灰落得还密。' },
    pe:    { name: '体育委员', duty: '带全班领操',   line: '「运动会入场式，\n今年咱们班要走最齐的方阵！」\n——全班的手都拍红了。' },
    arts:  { name: '文艺委员', duty: '出一期黑板报', line: '「黑板报不该只是通知栏——\n该是全班每个月的画展。」\n——连王老师都回头看了一眼。' }
  };
  S.classCommittee = async () => {
    const f = F(), C = ADV.Cal;
    if (!f.classRole) {
      // 竞聘门槛：帮助板声望 ≥ 8（在镇上帮过忙，同学才投你的票）
      if ((f.helpPts || 0) < 8) {
        await say({ name: '王老师', text: `后黑板上贴着「班委竞聘」的红纸。\n「想为班里做事是好事。\n不过班委得先有口碑——去镇上帮助板帮帮忙，\n声望 ${f.helpPts || 0}/8，同学们才好把票投给你。」` });
        return;
      }
      if (C.energy < 3) {                              // 竞选演说也是体力活（批次二十八补守卫）
        await say({ name: '王老师', text: '「竞选演说可是体力活。\n先回去歇会儿，精神饱满再来——\n红纸一直贴到学期末，不急。」\n（精力不足）' });
        return;
      }
      const go = await choose(['竞聘学习委员', '竞聘体育委员', '竞聘文艺委员', '这学期先算了'],
        { caption: { name: '班务角', text: `班会时间，王老师把红纸抚平。\n「你的帮助板声望：${f.helpPts}——够格。\n说说吧，你想为班里做点什么？」\n（发表竞选演说 · 精力 -3 · 每学期一任）` } });
      if (go < 0 || go > 2) { await say({ text: '「红纸一直贴到学期末，\n想好了随时来。」' }); return; }
      const key = ['study', 'pe', 'arts'][go], r = CLASS_ROLES[key];
      C.costEnergy(3);
      f.classRole = key;
      ADV.Audio.sfx('fanfare');
      gainBond('studentClass', 2);
      await say({ name: '王老师', text: `你站上讲台——\n${r.line}\n「好，这学期的${r.name}就是你了。\n每周来班务角领一份职责。」` });
      UI().toast(` 📋 当选${r.name}！每周职责小任务 · 班务角领取 `);
      logEvent(`当选${r.name}`);
      save();
      return;
    }
    // 已就任：每周职责小任务（weekIndex 周锁）
    const r = CLASS_ROLES[f.classRole];
    if (f.committeeWeek === C.weekIndex()) {
      await say({ name: '班务角', text: `班务栏上钉着你的本周称职记录 ✓\n（${r.name} · 本周的「${r.duty}」已完成，\n下周再来领新差事）` });
      return;
    }
    let done = true, note = '';
    if (f.classRole === 'study') {
      await say({ text: '午后的教室，几个同学抱着习题册围过来。\n你拿起粉笔转过身——当一回小老师！\n（讲对 2/3 题算称职，讲砸了随时可以重来）' });
      let hit = 0;
      for (let k = 0; k < 3; k++) if (await examOnce('班委职责 · 辅导同学', 'math', 'easy', C.day * 5 + k)) hit++;
      done = hit >= 2;
      note = `讲完最后一题，粉笔灰落满袖口。（答对 ${hit}/3）`;
      if (!done) { await say({ text: `${note}\n同学们似懂非懂地「哦」了一声……\n（这周先算练手，班务角随时可以再讲）` }); return; }
    } else if (f.classRole === 'pe') {
      if (C.energy < 5) { await say({ name: '班务角', text: '「领操要喊得动口哨。\n先去歇会儿，攒够精神再来。」\n（精力不足）' }); return; }
      C.costEnergy(4);
      if (ADV.Growth) ADV.Growth.addDim('body', 3, '领操');
      note = '口哨一响，全班的手臂抬得整整齐齐。\n太阳把队列的影子钉在操场上。（精力 -4 · 体魄 +3）';
    } else {
      if (C.energy < 4) { await say({ name: '班务角', text: '「画黑板报可是细活。\n先去歇会儿，攒够精神再来。」\n（精力不足）' }); return; }
      C.costEnergy(3);
      if (ADV.Growth) ADV.Growth.addDim('art', 2, '黑板报');
      note = '彩色粉笔在黑板上一格格铺开——\n放学时连路过的别班都停下看。（精力 -3 · 技艺 +2）';
    }
    f.committeeWeek = C.weekIndex();
    f.gold = (f.gold || 0) + 15;
    addCup(1);
    gainBond('studentClass', 1);
    ADV.Audio.sfx('save');
    await say({ text: `${note}\n班费给你报销了一瓶汽水。\n（委员津贴 💰+15 · 学院分 +1 · 同学好感 +1）` });
    UI().toast(` 📋 ${r.name}称职 ✓ 津贴 💰+15 · 学院分 +1 `);
    logEvent(`完成本周班委职责（${r.duty}）`);
    save();
  };

  /* —— 校园 · 全校众筹建设（S7）：🚧 围挡处捐矿石/作物/金币，修好天文角与游泳池 —— */
  const BUILD_JOBS = {
    astro: {
      key: 'astro', name: '天文角', flag: 'buildAstro', spot: { kind: 'sign', x: 49, y: 12, w: 1, h: 1, text: '🔭', solidTiles: [[0, 0]], s: 'astroCorner' },
      needs: [['copperOre', 4], ['ironOre', 3], ['GOLD', 150]],
      done: '旧天文角擦亮了——\n望远镜擦到能数清月亮的环形山，\n支架重新校准，正对着傍晚的金星。'
    },
    pool: {
      key: 'pool', name: '游泳池', flag: 'buildPool', spot: { kind: 'sign', x: 44, y: 18, w: 1, h: 1, text: '🏊', solidTiles: [[0, 0]], s: 'swimPool' },
      needs: [['wheat', 4], ['strawberry', 4], ['GOLD', 100]],
      done: '淤泥清走，池壁重新刷了蓝漆——\n水管开闸，泳池注满了清水，\n水面晃着一整片天。'
    }
  };
  S.buildSite = async (ent) => {
    const f = F(), C = ADV.Cal, CO = ADV.Collect;
    const job = BUILD_JOBS[(ent && ent.site) || 'astro'];
    if (!job || f[job.flag]) { await say({ text: '（工棚已经拆了——这里修好啦。）' }); return; }
    const fund = f.buildFund[job.key] = f.buildFund[job.key] || {};
    const got = id => id === 'GOLD' ? (fund.gold || 0) : (fund[id] || 0);
    for (;;) {
      const opts = job.needs.map(([id, n]) => {
        const nm = id === 'GOLD' ? '金币（💰50 一笔）' : `${CO.itemInfo(id).name}`;
        return `捐 ${nm}（${got(id)}/${n}）`;
      }).concat(['先去凑凑材料']);
      const i = await choose(opts, { caption: { name: `修缮 · ${job.name}`, text: `围挡上钉着施工单：\n「全校众筹，量力捐助——\n矿石作物照价折算，金币当场点清。」\n（身上 💰${f.gold}）` } });
      if (i < 0 || i >= job.needs.length) { await say({ text: '「材料不齐不开工，\n攒够了随时回来。」' }); return; }
      const [id, n] = job.needs[i];
      if (id === 'GOLD') {
        if ((f.gold || 0) < 50) { await say({ text: '（口袋翻了翻——不够 50 文。\n先把矿石作物凑一凑？）' }); continue; }
        f.gold -= 50; fund.gold = (fund.gold || 0) + 50;
        UI().toast(` 💰 捐了 50 文（${job.name}众筹 ${fund.gold}/${n}） `);
      } else {
        if (CO.count(id) < 1) { await say({ text: `（身上没有${CO.itemInfo(id).name}。\n矿石去矿道敲，作物去田里收。）` }); continue; }
        CO.useItem(id, 1); fund[id] = (fund[id] || 0) + 1;
        UI().toast(` 📦 捐了${CO.itemInfo(id).name}（${job.name}众筹 ${fund[id]}/${n}） `);
      }
      ADV.Audio.sfx('save');
      // 全部凑齐 → 落成（当场换牌，回访地图条件建造同口径）
      if (job.needs.every(([id2, n2]) => got(id2) >= n2)) {
        f[job.flag] = true;
        ADV.Audio.sfx('fanfare');
        addCup(2);
        try {                                           // 当前正好在校园：围挡当场换新（hedge 同款 splice）
          const mp = ADV.Engine && ADV.Engine.map;
          if (mp && mp.id === 'campus') {
            mp.objects = mp.objects.filter(o => !(o.s === 'buildSite' && o.site === job.key));
            mp.objects.push(Object.assign({}, job.spot));
          }
        } catch (e) {}
        await say({ name: '施工队', text: `最后一车材料卸下——${job.name}，修好了！\n${job.done}\n（全校筹办 · 你的名字写上了红纸：学院分 +2）` });
        UI().toast(` 🏗 ${job.name}落成！校园新互动点开放 `);
        logEvent(`为全校众筹修好了${job.name}`);
        save();
        return;
      }
      save();
    }
  };
  /* —— 校园 · 天文角（S7 落成后）：夜晚观星（心性 +2 · 学院分 +1，每日一次） —— */
  const STAR_NOTES = [
    '「那是天鹅座——\n翅膀尖上那颗叫辇道增七，一颗星，两副脸色。」',
    '「仙后座像个歪掉的 W，\n秋天整夜挂在北天，比北斗还好认。」',
    '「金星最亮的时候白天都找得到——\n古人叫它长庚，也叫启明，其实是一颗。」',
    '「月亮今天缺了一角，\n缺口那边其实也在——只是太阳没照到。」'
  ];
  S.astroCorner = async () => {
    const f = F(), C = ADV.Cal;
    if (!C.isNight()) { await say({ text: '白天的望远镜罩着镜罩。\n铭牌上刻着：「日落后来观星。」' }); return; }
    if (f.astroDay === C.day) { await say({ text: '你眯眼看了很久，星群在镜筒里轻轻晃。\n（今晚看得够多了，明天再来）' }); return; }
    f.astroDay = C.day;
    if (ADV.Growth) ADV.Growth.addDim('mind', 2, '观星');
    addCup(1);
    ADV.Audio.sfx('save');
    // 批次四十八：3D 星空台——成功则先环视夜空（Z 返回后继续走下方心得与提示），
    // 失败（无 THREE / 无 WebGL，含冒烟环境）静默跳过直接看原文案；奖励与日锁口径不变。
    if (ADV.Sky3D) await ADV.Sky3D.viewPromise('astro', C.day % STAR_NOTES.length, C.day % 8);
    await say({ text: `你凑上目镜——夜空哗地铺开。\n${STAR_NOTES[C.day % STAR_NOTES.length]}\n（心性 +2 · 学院分 +1）` });
    UI().toast(' 🔭 天文角观星：心性 +2 · 学院分 +1 ');
    logEvent('在天文角看了一晚星星');
    save();
  };
  /* —— 校园 · 游泳池（S7 落成后）：白天游泳（精力 -5 · 体魄 +3，每日一次）——
     S7 余量收口：泳池 = 节日场地——节日当天池边办「水上运动会」（节目按日轮换，胜负日种子确定性） —— */
  S.swimPool = async () => {
    const f = F(), C = ADV.Cal;
    if (C.isNight()) { await say({ text: '夜里的泳池锁着门，水面一片黑。\n救生圈整整齐齐挂在栏杆上睡着了。' }); return; }
    const fest = C.festival();
    if (fest && f.poolFestDay !== C.day && C.energy >= 4) {
      const go = await choose([`报名水上运动会（${fest}限定）`, '不了，自己游就好'],
        { caption: { name: '游泳池', text: `池水蓝得晃眼——今天池边在办\n「${fest}」水上运动会！` } });
      if (go === 0) {
        f.poolFestDay = C.day;
        const PROGRAMS = [
          ['憋气比拼', '你憋红着脸沉到池底，数到四十七才冒头——\n池边掌声一片！'],
          ['池底摸硬币', '你一个猛子扎下去，摸上来五枚亮闪闪的硬币——\n裁判当场验收：全是真的！'],
          ['水上拔河', '两队在池里拉锯，你这边喊着号子——\n哗啦一声把对面全拽下了水！']
        ];
        const [pname, pline] = PROGRAMS[C.day % PROGRAMS.length];
        C.costEnergy(3);
        const win = (C.day * 7 + 3) % 10 < 6;
        if (win) {
          f.gold = (f.gold || 0) + 15;
          addCup(1);
          ADV.Audio.sfx('fanfare');
          await say({ text: `【${pname}】\n${pline}\n（拿到「水中蛟龙」小奖状！金币 +15 · 学院分 +1 · 精力 -3）` });
          logEvent(`在${fest}的水上运动会${pname}里夺魁`);
        } else {
          f.gold = (f.gold || 0) + 5;
          ADV.Audio.sfx('emote');
          await say({ text: `【${pname}】\n你使出了吃奶的劲儿，还是差了半口气——\n裁判塞给你 5 文安慰奖。（金币 +5 · 精力 -3）` });
          logEvent(`参加了${fest}的水上运动会${pname}`);
        }
        UI().toast(` 🏊 水上运动会（${fest}）：金币 +${win ? 15 : 5} `);
        save();
        return;
      }
    }
    if (f.swimDay === C.day) { await say({ text: '今天已经游过啦——泳镜还在滴水。\n（明天再来）' }); return; }
    if (C.energy < 6) { await say({ text: '胳膊都抬不起来了，下水要抽筋的。\n（精力不足）' }); return; }
    const go = await choose(['扑通跳进去！', '岸上坐坐就好'],
      { caption: { name: '游泳池', text: '池水蓝得晃眼，浅水区冒着泡。\n（畅游一趟：精力 -5 · 体魄 +3）' } });
    if (go !== 0) { await say({ text: '你把脚丫晃了晃池水，凉丝丝的。\n（下次带泳镜来）' }); return; }
    f.swimDay = C.day;
    C.costEnergy(5);
    if (ADV.Growth) ADV.Growth.addDim('body', 3, '游泳');
    ADV.Audio.sfx('emote');
    await say({ text: '扑通——！水花溅了半池。\n你从这头游到那头，又折回来，\n爬上岸时手指肚都起了皱。（精力 -5 · 体魄 +3）' });
    UI().toast(' 🏊 畅游一趟：体魄 +3 · 精力 -5 ');
    logEvent('在游泳池畅游了一趟');
    save();
  };

  /* ==================== s7 四季 × 节日联动 ====================
   * cal.js 的节日不再只是横幅——当天到校务板「打卡处」可以参加节日小活动，
   * 每个节日一段小场景 + 应景奖励，参与登记在 f.fest[day] */
  const FESTIVAL_LINKS = [
    { day: 5, name: '植树节', act: async () => {
      await say({ text: '校工在花坛边分发的树苗——\n你领了一株，种在操场东角，浇透了水。' });
      if (ADV.Skills) ADV.Skills.add('farm', 4, '植树');
      addCup(2);
      UI().toast(' 🌳 植树节：树苗种好了！学院分 +2 · 农艺经验 ');
    } },
    { day: 8, name: '读书日', act: async () => {
      const pool = ADV.Collect.DB.quotes.filter(q => !ADV.Collect.has('quotes', q.id));
      if (pool.length) {
        const q = pool[(ADV.Cal.day * 3) % pool.length];
        ADV.Collect.gain('quotes', q.id);
        await say({ text: `旧书摊前的抄书角——\n你抄下了一句好话：「${q.name}」。\n（名句入册！）` });
      } else {
        f.gold = (f.gold || 0) + 15;
        await say({ text: '你在抄书角坐了一下午。\n（老板看你的字漂亮，塞给你 15 文「稿费」）' });
      }
    } },
    { day: 18, name: '风筝节', act: async () => {
      await say({ text: '操场上空全是风筝——\n你也放起一架燕子风筝，正巧穿过两个呼啦圈！' });
      const w = await new Promise(res => ADV.Mini.start('plane', res));
      if (w) { f.gold = (f.gold || 0) + 12; addCup(2); UI().toast(' 🪁 风筝节：飞得最高！金币 +12 · 学院分 +2 '); }
      else UI().toast(' 🪁 风筝挂在树上了……明年再战 ');
    } },
    { day: 31, name: '冬日祭', act: async () => {
      await say({ text: '冬日祭的小摊冒着白汽——\n你捧起一碗热汤，从喉咙一路暖到脚尖。' });
      ADV.Collect.addItem('snack', 1);
      Object.keys(state.friends).slice(0, 5).forEach(id => gainBond(id, 1));
      UI().toast(' 🍲 冬日祭：热汤下肚，好友好感 +1 · 关东煮 ×1 ');
    } },
    { day: 45, name: '踏青节', act: async () => {
      await say({ text: '全班去后山踏青——\n你一路走一路捡，收获不小。' });
      const pool = ADV.Collect.DB.leaves.filter(l => !ADV.Collect.has('leaves', l.id));
      if (pool.length) { ADV.Collect.gain('leaves', pool[0].id); }
      ADV.Collect.addItem('flower', 1);
      UI().toast(' 🌸 踏青节：落叶与野花都进了口袋 ');
    } },
    { day: 53, name: '纳凉晚会', act: async () => {
      await say({ text: '河边亮起了一串小灯——\n晚风吹着，同学们围坐一圈数星星。' });
      Object.keys(state.friends).slice(0, 5).forEach(id => gainBond(id, 1));
      f.gold = (f.gold || 0) + 10;
      UI().toast(' 🎑 纳凉晚会：好友好感 +1 · 金币 +10 ');
    } },
    { day: 57, name: '收获祭', act: async () => {
      const crops = ['strawberry', 'pea', 'watermelon', 'tomato', 'sweetpotato', 'pumpkin'].filter(c => ADV.Collect.count(c) > 0);
      if (crops.length) {
        const it = crops[0];
        ADV.Collect.useItem(it, 1);
        f.gold = (f.gold || 0) + (ADV.Collect.itemInfo(it).price || 5) * 3;
        await say({ text: `你把最好的「${ADV.Collect.itemInfo(it).name}」摆上祭台——\n评了个头名！奖金三倍市价！` });
        addCup(3);
      } else {
        f.gold = (f.gold || 0) + 8;
        await say({ text: '你帮着搬了一下午南瓜。\n（主办方塞给你 8 文辛苦钱）' });
      }
      UI().toast(' 🎃 收获祭：丰年的味道 ');
    } },
  ];
  // 校务板挂钩：打卡完成后，若今天是节日且未参加 → 询问是否参加
  async function festivalLink() {
    const f = F(), C = ADV.Cal;
    const name = C.festival();
    if (!name || f.fest[C.day]) return false;
    const link = FESTIVAL_LINKS.find(x => x.day === C.day);
    if (!link) return false;
    f.fest[C.day] = true;
    const go = await choose([`参加「${name}」活动`, '今天不参加了'], { caption: { name: '广播', text: `【今日${name}】\n活动就在校园里——去看看吧！` } });
    if (go !== 0) { save(); return true; }
    ADV.Audio.sfx('fanfare');
    await link.act();
    logEvent(`参加了${name}活动`);
    save();
    return true;
  }

  // —— 英语教室 ——
  S.wordCard = async () => {
    const f = F(), C = ADV.Cal;
    if (f.wordDay === C.day) { await say({ text: '（今日单词已学——\n海报冲你眨了眨眼）' }); return; }
    const words = [['apple 苹果', '桌子'], ['spring 春天', '春天'], ['blue 蓝色', '蓝色'], ['run 跑', '跑'], ['water 水', '水']];
    const w = words[C.day % words.length];
    f.wordDay = C.day;
    await say({ text: `ABC 海报闪了闪——今日单词卡：\n「${w[0]}」` });
    const i = await choose(['苹果', w[1], w[1] === '春天' ? '冬天' : '春天'], { caption: { name: '单词卡', text: `${w[0].split(' ')[0]} 是什么意思？` } });
    if (i === 1) {
      f.wordStreak = (f.wordStreak || 0) + 1;
      if (ADV.Growth) { ADV.Growth.addXP(3, '单词'); ADV.Growth.addDim('knowledge', 1, '每日一词'); }
      await say({ text: `✔ 正确！连对 ${f.wordStreak} 天。${f.wordStreak >= 5 ? '\n获得「单词本」：英语题难度永久下降一档！' : '（连对 5 天有奖品）'}` });
      if (f.wordStreak === 5) f.wordBook = true;
    } else { f.wordStreak = 0; await say({ text: '✘ 再想想～明天继续！' }); }
    save();
  };
  S.radioListen = async () => {
    const sounds = [['汪汪！', '小狗 dog'], ['喵～', '小猫 cat'], ['嗡嗡…', '蜜蜂 bee'], '嘎嘎！', '鸭子 duck'];
    const s2 = Array.isArray(sounds[ADV.Cal.day % 4]) ? sounds[ADV.Cal.day % 4] : ['嘎嘎！', '鸭子 duck'];
    await say({ text: `录音机沙沙响起——\n「${s2[0]}」` });
    const i = await choose([s2[1], '小猫 cat', '小鸟 bird'], { caption: { name: '听力题', text: '这是什么动物的叫声？' } });
    if (i === 0) {
      if (ADV.Growth) { ADV.Growth.addXP(4, '听力'); ADV.Growth.addDim('knowledge', 1, '磨耳朵'); }
      await say({ text: `✔ 没错，${s2[1]}！\n耳朵很灵嘛。` });
    } else await say({ text: '✘ 是别的动物哦～（音量调大再听听）' });
  };
  S.loveLetter = async () => {
    const f = F();
    if (f.letterStage === 3) { await say({ text: '（信的秘密已了然于心——\n你决定替金鹏保守）' }); return; }
    f.letterStage = (f.letterStage || 0) + 1;
    const parts = [
      '课桌抽屉深处，一封信。\n封皮英文："To the one who shines\non the playground…"（致操场上发光的那个人）',
      '信纸第二段露出半截：\n"…I will win, then I will tell her."\n（……我会赢，然后告诉她。）',
      '你想起金鹏总在操场加练——\n跑步、投篮、还有那场文武战。\n收信人是谁，答案早已写在操场上。'
    ];
    await say({ text: parts[f.letterStage - 1] });
    if (f.letterStage === 3) { gainBond('jinpeng', 5); UI().toast(' 💌 隐藏线索完成：操场上发光的人 '); }
    save();
  };

  // —— 体育馆 ——
  S.freeShoot = async () => {
    const f = F();
    await say({ text: `自由投篮训练！\n（当前连进纪录：${f.shootBest || 0} 球）` });
    const w = await new Promise(res => ADV.Mini.start('ball', res));
    if (w) {
      f.shootBest = (f.shootBest || 0) + 1;
      if (ADV.Growth) { ADV.Growth.addXP(3, '投篮'); ADV.Growth.addDim('body', 1, '球感'); }
      await say({ text: `唰——空心入网！\n连进纪录 → ${f.shootBest}` });
      if (f.shootBest === 5) { gainBond('teacherLiu', 5); await say({ name: '刘老师', text: '（不知何时站在场边）\n好球感！校队考虑一下？' }); }
    } else await say({ text: '铁了……捡球，再来。' });
    save();
  };
  S.equipWin = async () => {
    await say({ text: '器材室的小窗敞着——\n沙包、跳绳、羽毛球拍……' });
    /* —— P-B2 微剧情二号线 ③中段：借秒表（小刚的纪录线） —— */
    if (F().recordChain === 1) {
      const i = await choose(['借秒表（帮小刚计时）', '借别的道具'], { caption: { name: '器材窗', text: '「秒表？要拿去干什么——\n哦——小刚要冲纪录啊，拿去拿去！」' } });
      if (i === 0) {
        F().recordChain = 2;
        ADV.Audio.sfx('item');
        await say({ text: '你接过秒表，挂绳还带着阳光的味道。\n（去操场把好消息告诉小刚吧）' });
        save();
        UI().toast(' ⏱ 借到了秒表——去找小刚吧 ');
        return;
      }
    }
    const i = await choose(['借沙包（投准游戏）', '借跳绳（节奏游戏）', '不借了'], { caption: { name: '器材窗', text: '训练道具随便借！' } });
    if (i === 2) return;
    const w = await new Promise(res => ADV.Mini.start(i === 0 ? 'ball' : 'music', res));
    if (w) {
      F().gold = (F().gold || 0) + 6;
      if (ADV.Growth) { ADV.Growth.addXP(3, '器材训练'); ADV.Growth.addDim('body', 1, '多练一样'); }
      await say({ text: '练得酣畅淋漓！💰+6（体育特长生补贴）' });
    } else await say({ text: '今天状态一般，明天再练！' });
    save();
  };
  S.trophyCase = async () => {
    const f = F();
    const history = [
      '【1998 年】田径团体冠军——\n领队：还是体育老师的刘老师。',
      '【2005 年】篮球联赛亚军。\nMVP：一个扫地的少年。',
      '【2011 年】拔河三连冠！\n绳子现在还供在柜顶。',
      '【2019 年】广播体操特等奖。\n照片里全员八颗牙微笑。'
    ];
    const idx = f.trophyIdx || 0;
    if (idx >= history.length) { await say({ text: '（奖杯柜的故事都读完了——\n每一座都沉甸甸的）' }); return; }
    f.trophyIdx = idx + 1;
    await say({ text: history[idx] });
    if (idx === 1) await say({ text: '……等等，MVP 照片上的少年，\n怎么越看越像保安大爷？' });
    if (f.trophyIdx >= history.length) { if (ADV.Growth) ADV.Growth.addDim('mind', 2, '读懂了奖杯的重量'); UI().toast(' 🏆 校史小达人：奖杯柜故事读罢 '); }
    save();
  };

  // —— 医务室 ——
  S.heightScale = async () => {
    const f = F(), C = ADV.Cal;
    if (C.day - (f.scaleDay || 0) < 5) { await say({ text: `（上次测量：第 ${f.scaleDay || 0} 天，\n身高 ${f.height || 142}cm——\n长大这种事，急不来）` }); return; }
    f.scaleDay = C.day;
    f.height = Math.min(160, 142 + Math.floor(C.day / 5));
    const cm = f.height, kg = (28 + Math.floor(C.day / 5) * 0.8).toFixed(1);
    const word = cm >= 150 ? '蹭蹭往上蹿！' : cm >= 146 ? '稳步长高～' : '悄悄拔节中。';
    await say({ name: '校医', text: `站直——\n身高 ${cm}cm，体重 ${kg}kg。${word}` });
    if (ADV.Growth) ADV.Growth.addDim('body', 1, '又长高了');
    save();
  };
  S.medCab = async () => {
    const i = await choose(['创可贴（回15 · 💰5）', '冰袋（解眩晕 · 💰12）', '维生素（精力+20 · 💰20）', '不买了'], { caption: { name: '药柜', text: `💰${F().gold} ｜ 校医的百宝柜：` } });
    if (i === 3) return;
    const price = [5, 12, 20][i];
    if (F().gold < price) { await say({ name: '校医', text: '零花钱不够啦～先赊着？\n（校医笑了：逗你的，下次带够）' }); return; }
    F().gold -= price;
    if (i === 0) ADV.Collect.addItem('bread', 0), F().medPlaster = (F().medPlaster || 0) + 1;
    if (i === 1) F().medIce = (F().medIce || 0) + 1;
    if (i === 2) { if (ADV.Cal.energy != null) ADV.Cal.energy = Math.min(100, ADV.Cal.energy + 20); }
    ADV.Audio.sfx('item');
    await say({ text: ['创可贴入包（战斗中回 15）', '冰袋入包（解除战斗眩晕）', '维生素下肚——精力 +20！'][i] });
    save();
  };
  S.restBed = async () => {
    await say({ text: '躺一会儿吗？\n（恢复体力，但时间会流逝）' });
    const i = await choose(['小憩一会', '不了'], { caption: { text: '病床洁白干净，阳光正好。' } });
    if (i === 1) return;
    ADV.Cal.advance(1);
    if (ADV.Cal.energy != null) ADV.Cal.energy = Math.min(100, (ADV.Cal.energy || 50) + 30);
    await say({ text: '你在消毒水味里睡了十分钟——\n精神好多了。（时段 +1，精力 +30）' });
    save();
  };

  S.deskComic = async (o) => {
    if (F().comicReturned) { await say({ text: '课桌抽屉整整齐齐。\n（这里已经什么也没有了）' }); return; }
    if (F().gotComic) { await say({ text: '你翻开课桌——里面已经空了。' }); return; }
    if (o) o.sparkle = false;                          // 拾取后星光熄灭
    await say({ text: '你拉开课桌抽屉——\n里面躺着一本《冒险王》第 12 卷！' });
    await ADV.UI.itemGet('漫画书', '#5a9ae8');
    F().gotComic = true;
    save();
    UI().toast(' 似乎是小明落下的……回去还给他吧 ');
  };

  // —— 后山深处 · 星之庭园 ——
  S.star = async (ent) => {
    await teachRecipe('star');                                    // 星儿的星星曲奇
    if (!F().starCharm) {
      E().emote(ent, '♪');
      E().playAction(ent, 'wave', 1.4);
      await say({ name: '星儿', text: '欢迎来到星之庭园，\n让祭坛重新亮起来的孩子。' });
      await say({ name: '星儿', text: '这只小猫叫阿星，是庭园的守护猫。\n它说，是你一步一步把它引上来的哦。' });
      await say({ name: '星儿', text: '那位守门人，其实是我爷爷。\n他守了一百年，终于等到了你。' });
      await ADV.UI.itemGet('星之护符', '#8ad0ff');
      F().starCharm = true;
      save();
      UI().toast(' 获得信物：星之护符 ');
      await say({ name: '星儿', text: '这是庭园的谢礼。\n愿星光与智慧，永远陪着你冒险。' });
      return;
    }
    await say({ name: '星儿', text: '阿星最近总在泉边打盹，\n梦里好像在追星星呢。' });
  };
  S.starSpring = async () => { await say({ text: '星之泉汩汩涌动，\n泉水里倒映着整片星空。' }); };
  S.deepSign = async () => { await say({ name: '木牌', text: '「星之庭园」\n—— 星光落在后山最深处，\n只有心怀智慧的人才能望见。' }); };

  // —— 体育馆：投篮挑战 ——
  S.teacherLiu = async (ent) => {
    E().emote(ent, '!');
    E().playAction(ent, 'wave', 1.2);
    if (!F().liuWin) {
      await say({ name: '刘老师', text: '欢迎来到体育馆！我是体育刘老师！' });
      await say({ name: '刘老师', text: '学习要动脑，运动要流汗！\n来场投篮挑战怎么样？' });
      const go = await choose(['来一场！', '先学武术课', '改天再来'], { caption: { name: '刘老师', text: '三次投篮，进两球就算赢！\n赢了我这里有宝贝给你！（也可以先来学两招）' } });
      if (go === 2) { await say({ name: '刘老师', text: '哈！运动之门永远敞开，随时来！' }); return; }
      if (go === 1) { await S.martialLesson(ent); return; }
      const win = await new Promise(res => ADV.Mini.start('ball', res));
      if (win) {
        F().liuWin = true;
        grantTalent('sports');
        E().playAction(ent, 'laugh', 1.8);
        await say({ name: '刘老师', text: '好球！好球！运动神经一流啊！\n来，这是我珍藏的宝贝！' });
        await ADV.UI.itemGet('宝藏图碎片', '#d9873a');
        gainPiece();
        await say({ name: '刘老师', text: '一张泛黄的图纸？我年轻时在东边\n洞口捡到的——听说一共有三张！' });
        addGold(20);
      } else {
        await say({ name: '刘老师', text: '差一点点！热身完了再来，随时奉陪！' });
      }
    } else {
      const go = await choose(['再来一局！', '体能训练（每周一次）', '武术课（刘家拳）', '不了'],
        { caption: { name: '刘老师', text: '投篮赢金币！体能课稳住周测，\n武术课——刘家拳三套招式教你真功夫！' } });
      if (go === 0) {
        const win = await new Promise(res => ADV.Mini.start('ball', res));
        if (win) { addGold(20); grantTalent('sports'); await say({ name: '刘老师', text: '漂亮！金币 +20，拿去！' }); }
        else await say({ name: '刘老师', text: '哈哈，今天手感一般，下次必进！' });
      } else if (go === 1) {
        await S.gymTrain(ent);
      } else if (go === 2) {
        await S.martialLesson(ent);
      }
    }
  };
  // 体能课：每周一次，练完本周 studyBuff（周测/月考降一档难度）
  S.gymTrain = async (ent) => {
    const f = F(), C = ADV.Cal;
    if (f.gymWeek === C.weekIndex()) {
      await say({ name: '刘老师', text: '这周的体能课已经上过啦——\n酸胀的肌肉正在悄悄变强！' });
      return;
    }
    await say({ name: '刘老师', text: '好！今天的体能课——跟刘老师拔河！\n把我拔过线，就算这节课毕业！' });
    const win = await new Promise(res => ADV.Mini.start('tug', res));
    f.gymWeek = C.weekIndex();
    f.studyBuff = true;
    if (win) {
      E().playAction(ent, 'laugh', 1.6);
      addGold(5);
      await say({ name: '刘老师', text: '好家伙，把我这省队出身都拔动了！\n加餐——金币 +5！' });
      logEvent('体能课拔赢了刘老师');
    } else {
      await say({ name: '刘老师', text: '输了也别灰心——\n出过汗就是赢！下周再来！' });
      logEvent('在体育馆上了一节体能课');
    }
    await say({ name: '刘老师', text: '一身透汗，浑身舒坦！\n（本周学习状态上升：考试题目会稳一档）' });
    save();
  };
  // —— 武术课：刘家拳三套招式，每周一课，按序传功（战斗技） ——
  const LIU_KUNGS = [
    { key: 'palm', name: '崩山掌', manual: '武林秘诀·崩山掌', col: '#e07a5a',
      tip: '「力从地起，掌走直线——跟投篮出手一个道理，干脆！」' },
    { key: 'leg', name: '旋风连环腿', manual: '武林秘诀·旋风连环腿', col: '#f0b45a',
      tip: '「腰马合一，转体发力——别光用蛮劲！」' },
    { key: 'qi', name: '云手气功', manual: '武林秘诀·云手气功', col: '#7af0a8',
      tip: '「气沉丹田，云手化劲——呼吸和运球节奏是一样的！」' }
  ];
  S.martialLesson = async (ent) => {
    const f = F(), M = f.martial, C = ADV.Cal;
    if (f.martialWeek === C.weekIndex()) {
      await say({ name: '刘老师', text: '今天教过了——拳要天天打，\n功要日日练！下周再来上新课！' });
      return;
    }
    const next = LIU_KUNGS.find(k => !M[k.key]);
    if (!next) {
      // 三套拳脚学全：每周复训一场，赢了有加餐
      f.martialWeek = C.weekIndex();
      await say({ name: '刘老师', text: '三套刘家拳你都吃透了？好！\n陪我打一遍木人桩——全套复训开始！' });
      const win = await new Promise(res => ADV.Battle.start('dummy', {}, res));
      if (win) { addGold(10); logEvent('刘老师武术课复训通过'); await say({ name: '刘老师', text: '招式越打越顺了！\n复训加餐——金币 +10！' }); }
      else await say({ name: '刘老师', text: '木人桩都替你着急！\n不过练过就是收获，下周再来！' });
      save();
      return;
    }
    await say({ name: '刘老师', text: `今天教刘家拳——${next.name}！\n${next.tip}` });
    await say({ name: '刘老师', text: '先对木人桩打一轮，让我看看你的架子！' });
    const win = await new Promise(res => ADV.Battle.start('dummy', {}, res));
    M[next.key] = true;
    f.martialWeek = C.weekIndex();
    ADV.Audio.sfx('item');
    if (ADV.Skills) ADV.Skills.add('battle', 8, '武术课');
    await ADV.UI.itemGet(next.manual, next.col);
    UI().toast(` ⚔ 学会武功：${next.name}（战斗技） `);
    logEvent(`在刘老师的武术课上学会了${next.name}`);
    if (win) { addGold(8); await say({ name: '刘老师', text: '架势漂亮，这一课出师了！\n（加餐金币 +8）' }); }
    else await say({ name: '刘老师', text: '输给木人桩不丢人——\n招式你已经记下了，回去多练几遍就算出师！' });
    const left = LIU_KUNGS.filter(k => !M[k.key]).length;
    if (left) await say({ name: '刘老师', text: `还剩 ${left} 套拳脚，\n每周来上一课，我接着教你！` });
    else await say({ name: '刘老师', text: '三套刘家拳齐了！你这身架子——\n可以去山顶演武台，会一会碑上的高人功夫！' });
    save();
  };
  S.studentGym = async (ent) => {
    E().emote(ent, '♪');
    await say({ name: '同学', text: '刘老师年轻时可是省队的主力！\n不过他说学习比篮球还重要哦。' });
  };

  // —— 音乐教室：琴键记忆 ——
  S.teacherZhao = async (ent) => {
    E().emote(ent, '♪');
    E().playAction(ent, 'wave', 1.2);
    if (!F().zhaoWin) {
      await say({ name: '赵老师', text: '欢迎来到音乐教室，我是赵老师。\n听，风都在跟着琴声唱歌呢。' });
      await say({ name: '赵老师', text: '来玩「琴键记忆」吧——\n琴键唱一句，你跟一句。' });
      const go = await choose(['试一试！', '先听我弹会儿'], { caption: { name: '赵老师', text: '四块琴键，一段旋律。\n全部复述正确，就有礼物哦。' } });
      if (go === 1) { await say({ name: '赵老师', text: '好呀，琴键永远为你亮着。' }); return; }
      const win = await new Promise(res => ADV.Mini.start('music', res));
      if (win) {
        F().zhaoWin = true;
        grantTalent('music');
        E().playAction(ent, 'laugh', 1.8);
        await say({ name: '赵老师', text: '完美的音准！你心里住着旋律呢。' });
        await ADV.UI.itemGet('宝藏图碎片', '#d9873a');
        gainPiece();
        await say({ name: '赵老师', text: '这张图纸夹在琴谱里很多年了——\n据说另外两张，在运动和大地之中。' });
        addGold(20);
      } else {
        await say({ name: '赵老师', text: '走音啦～不过没关系，音乐在于开心。' });
      }
    } else {
      const go = await choose(['再来一曲！', '不了'], { caption: { name: '赵老师', text: '赢了有金币奖励！' } });
      if (go === 0) {
        const win = await new Promise(res => ADV.Mini.start('music', res));
        if (win) { addGold(20); grantTalent('music'); await say({ name: '赵老师', text: '余音绕梁！金币 +20，请收下。' }); }
        else await say({ name: '赵老师', text: '这段旋律有点调皮呢，再试一次吧。' });
      }
    }
  };
  S.studentMusic = async (ent) => {
    E().emote(ent, '♪');
    await say({ name: '同学', text: '赵老师弹琴的时候， whole world 都安静了……\n啊说漏嘴了，是「全世界」！' });
  };

  // —— 钢琴（自由弹奏） ——
  S.piano = async () => {
    await say({ text: '黑白琴键泛着温润的光。' });
    [0, 1, 2, 3, 2, 1, 0].forEach((n, i) => setTimeout(() => ADV.Audio.note(n), i * 140));
    await say({ text: '你随手弹了一段，叮叮咚咚～' });
  };

  // —— 藏宝洞窟 ——
  S.caveSign = async () => { await say({ name: '木牌', text: '「藏宝洞窟」\n—— 三图合一，石开宝藏现。\n（洞口就在东侧岩壁）' }); };
  S.caveEntrance = async () => {
    if (F().caveOpen) { await say({ text: '洞窟敞开着，里面传来叮咚的水声……\n（走上前去即可进入）' }); return; }
    await say({ text: '巨大的岩壁封住了洞口，\n上面刻着三个菱形凹槽……' });
    await say({ text: `（宝藏图碎片：${F().mapPieces || 0} / 3）\n听说体育老师、音乐老师和洞口的老矿工\n手里各有一张。` });
  };
  /* —— S1 工具锻造：矿石找老矿工升级农具/钓竿（存档只增：f.toolLv 0/1/2） ——
   * 一级：宽口锄＝翻土顺带翻好十字邻格；三嘴壶＝浇水一次浇左右三格；硬调竿＝搏鱼网口加宽。
   * 二级：开垄锄＝整行翻土；五嘴壶＝整行浇水；龙骨大物竿＝网口再加宽。 —— */
  const FORGES = [
    { key: 'hoe', name: '宽口锄', tool: '锄头', ores: { copperOre: 3 }, gold: 30,
      desc: '十字耕地——翻这一格，顺带把邻格也翻好',
      next: { name: '开垄锄', ores: { ironOre: 4, copperOre: 2 }, gold: 120,
        desc: '整垄耕地——一行四格，一锄到底' } },
    { key: 'can', name: '三嘴壶', tool: '水壶', ores: { ironOre: 3 }, gold: 50,
      desc: '一次浇三格——左右田垄一起喝饱',
      next: { name: '五嘴壶', ores: { goldOre: 1, ironOre: 3 }, gold: 150,
        desc: '整垄浇灌——一行四格一起喝饱' } },
    { key: 'rod', name: '硬调竿', tool: '鱼竿', ores: { goldOre: 2, gemStone: 1 }, gold: 80,
      desc: '硬调大物竿——搏鱼时网口大一圈',
      next: { name: '龙骨大物竿', ores: { gemStone: 2, goldOre: 3 }, gold: 200,
        desc: '搏鱼网口再加宽——大物也难脱身' } }
  ];
  async function forgeMenu(ent) {
    const f = F();
    f.toolLv = f.toolLv || {};
    const rows = [];
    FORGES.forEach(x => {
      const lv = f.toolLv[x.key] || 0;
      if (lv === 0) rows.push({ key: x.key, tier: 1, label: `${x.tool} → ${x.name}`, ores: x.ores, gold: x.gold, desc: x.desc });
      else if (lv === 1 && x.next) rows.push({ key: x.key, tier: 2, label: `${x.tool} II → ${x.next.name}`, ores: x.next.ores, gold: x.next.gold, desc: x.next.desc });
    });
    if (!rows.length) { await say({ name: '老矿工', text: '你手上的家伙什，\n已经锻到我手艺的顶了——没啥可锻的喽。' }); return; }
    const opts = rows.map(x => {
      const oreTxt = Object.keys(x.ores).map(id => `${ADV.Collect.itemInfo(id).name}×${x.ores[id]}`).join('+');
      return `${x.label}（${oreTxt} + 💰${x.gold}）`;
    }).concat(['今天不锻']);
    const i = await choose(opts, { caption: { name: '老矿工', text: '矿石别只顾着卖——\n好钢，得用在刀刃上。\n要锻哪件？' } });
    if (i < 0 || i >= rows.length) return;
    const x = rows[i];
    const lack = Object.keys(x.ores).find(id => ADV.Collect.count(id) < x.ores[id]);
    if (lack) { await say({ name: '老矿工', text: `${ADV.Collect.itemInfo(lack).name}不够——凑齐再来。\n矿道越深，矿石越好。` }); return; }
    if ((f.gold || 0) < x.gold) { await say({ name: '老矿工', text: `工钱 💰${x.gold}……先去攒攒。` }); return; }
    Object.keys(x.ores).forEach(id => ADV.Collect.useItem(id, x.ores[id]));
    f.gold -= x.gold;
    f.toolLv[x.key] = x.tier;
    ADV.Audio.sfx('item');
    E().playAction(ent, 'laugh', 1.6);
    await say({ name: '老矿工', text: `好嘞——「${x.label.split('→ ')[1]}」锻好了！\n${x.desc}。` });
    await ADV.UI.itemGet(x.label.split('→ ')[1], '#d9873a');
    logEvent(`请老矿工把${x.tool}${x.tier === 2 ? '升到 II 级' : '锻成了' + x.label.split('→ ')[1]}`);
    save();
  }

  S.miner = async (ent) => {
    await teachRecipe('miner');                                   // 老矿工的炖菜
    E().emote(ent, '?');
    if (!F().gotMinerPiece) {
      await say({ name: '老矿工', text: '哟，稀客！这洞口封了三十年，\n你这娃身上有股寻宝人的味道。' });
      await say({ name: '老矿工', text: '我年轻时凑过一张藏宝图，\n另外两张听说在体育老师和音乐老师手里。' });
      await ADV.UI.itemGet('宝藏图碎片', '#d9873a');
      F().gotMinerPiece = true;
      gainPiece();
      await say({ name: '老矿工', text: '凑齐三张，东郊的洞口就会开。\n洞里三只箱子——最大那只，可别错过。' });
    } else if (F().bell) {
      await say({ name: '老矿工', text: '这铃铛……是我当年送给山里一只猫的！\n原来它一直在等寻宝人啊。' });
    } else if (F().finalPassed && !F().sheKey) {
      F().sheKey = true;
      ADV.Collect.addItem('sheKey', 1);
      ADV.Audio.sfx('item');
      await say({ name: '老矿工', text: '对了——这把旧钥匙你拿去。\n当年「探险社」社办的箱子，\n就藏在洞窟深处。' });
      await say({ name: '老矿工', text: '我们那时候啊，二十个人，一面旗，\n把整个后山都跑了个遍……' });
      UI().toast(' 取得：社团旧钥匙（去洞窟开旧箱） ');
      save();
    } else if (ADV.Collect.count('clubFlag') && !F().clubFlagDone) {
      F().clubFlagDone = true;
      E().playAction(ent, 'cry', 2);
      await say({ name: '老矿工', text: '……社旗。\n你从箱子里把它找回来了。' });
      await say({ name: '老矿工', text: '四十年的灰，一抖就掉。\n谢了，孩子。这箱「社费」，你留着。' });
      F().gold = (F().gold || 0) + 80;
      gainBond('miner', 15);
      addCup(6);
      save();
    } else if ((F().mineRecord || 0) >= 5 && !ADV.Collect.count('torch')) {
      // —— P6 秘传技：下过第五层的娃，才配得上这把旧手电筒（深层照明省精力） ——
      ADV.Collect.addItem('torch', 1);
      ADV.Audio.sfx('item');
      E().playAction(ent, 'wave', 2);
      await say({ name: '老矿工', text: '听说你下到过第五层？好样的。\n这把手电筒跟了我半辈子——\n深层的矿光看得真，脚下也省劲。' });
      UI().toast(' 🔦 取得：手电筒（第 5 层以下 · 敲矿/探缝精力 -1） ');
      logEvent('老矿工把手电筒托付给了你');
      save();
    } else {
      // 矿石捐献：矿石此前只能卖钱，这里给一条更有叙事感的出口——给矿小的孩子们做标本
      const ores = ['copperOre', 'ironOre', 'goldOre', 'gemStone'];
      const have = ores.filter(id => ADV.Collect.count(id) > 0);
      if (have.length) {
        const pick = await choose(['捐矿石', '就聊聊天'], { caption: { name: '老矿工', text: '哟，娃又来啦。\n矿小的孩子们想要些矿石做标本，\n你矿筐里要有富余……' } });
        if (pick === 0) {
          let got = 0, gold = 0;
          for (const id of have) {
            const n = ADV.Collect.count(id);
            ADV.Collect.useItem(id, n);
            got += n; gold += ADV.Collect.itemInfo(id).price * n;
          }
          F().gold = (F().gold || 0) + gold;
          gainBond('miner', Math.min(6, got));
          if (!F().oreDonated) {
            F().oreDonated = true; addCup(4);
            await say({ name: '老矿工', text: '愿意把亮晶晶分给别人的娃，\n才是真矿工！\n这枚学院杯，有你一半功劳。' });
          } else {
            await say({ name: '老矿工', text: '孩子们又有新标本啦，\n谢谢你还惦记着。' });
          }
          UI().toast(` ⛏ 捐出矿石 ×${got} · 金币 +${gold} `);
          logEvent('给老矿工捐了矿石');
          save();
        } else {
          await say({ name: '老矿工', text: '洞里石头滑，走慢点。\n见到黄金小猫像，替我瞅一眼。' });
        }
      } else {
        await say({ name: '老矿工', text: '洞里石头滑，走慢点。\n见到黄金小猫像，替我瞅一眼。' });
      }
      // 锻造台：带着矿石（或已锻过）才开炉，平时不打扰
      const tl = F().toolLv || {};
      if (FORGES.some(x => tl[x.key]) || ['copperOre', 'ironOre', 'goldOre', 'gemStone'].some(id => ADV.Collect.count(id) > 0)) {
        await forgeMenu(ent);
      }
    }
  };
  async function openChest(id, name, color, gold, line) {
    const o = E().findObject(id);
    if (F().chests[id]) { await say({ text: '箱子已经空空如也……' }); return; }
    ADV.Audio.sfx('item');
    if (o) o.open = true;
    F().chests[id] = true;
    if (gold) { state.flags.gold = (state.flags.gold || 0) + gold; }
    await say({ text: line });
    await ADV.UI.itemGet(name, color);
    if (gold) UI().toast(` 金币 +${gold}（现有 ${state.flags.gold}） `);
    save();
  }
  S.chestA = () => openChest('chestA', '亮闪闪的金币', '#ffd94c', 30, '箱盖吱呀一声打开——\n满满一箱金币在黑暗里发光！');
  S.chestB = async () => {
    await openChest('chestB', '猫铃铛', '#ff8ab0', 0, '箱子里躺着一枚小小的铃铛……\n（好像在哪只猫的脖子上见过同款）');
    F().bell = true;
    save();
  };
  S.chestC = async () => {
    await openChest('chestC', '黄金小猫像', '#ffe9a8', 100, '最深处的宝箱里，\n一尊黄金小猫像熠熠生辉！\n——这就是传说中的大宝藏！');
    ADV.Audio.sfx('fanfare');
    UI().toast(' 大宝藏达成！校园传说又添一笔 ');
  };

  /* ==================== 寻宝迷宫（洞窟二层 · 符文迷宫） ====================
   * 流程：1F铜祭坛答题→铜钥匙开暗道 → 2F银/金祭坛→三钥嵌入符文石门→连答三问开门 → 深处大宝箱
   * 题库 TREASURE_QUIZ 挂到 QUIZ 上，smoke 拦截器按题干自动选对
   */
  const TREASURE_QUIZ = {
    copper: [
      { q: '【铜之问】一年之中，白天最长的是哪个节气？', opts: ['冬至', '夏至', '春分'], a: 1 },
      { q: '【铜之问】指南针静止时，磁针指向前方的那头指向哪边？', opts: ['北方', '南方', '东方'], a: 0 },
      { q: '【铜之问】「宝」字用部首查字法，应查什么部首？', opts: ['玉', '艹（草字头）', '宀（宝盖头）'], a: 2 }
    ],
    silver: [
      { q: '【银之问】月光从月亮到地球，大约要走多久？', opts: ['一瞬间', '约 1.3 秒', '约 13 秒'], a: 1 },
      { q: '【银之问】洞顶垂下来的钟乳石，是往哪边长的？', opts: ['往下长', '往上长', '横着长'], a: 0 },
      { q: '【银之问】「回」字一共有几种写法？', opts: ['一种', '两种', '四种'], a: 2 }
    ],
    gold: [
      { q: '【金之问】黄金的化学元素符号是？', opts: ['Au（金）', 'Ag（银）', 'Fe（铁）'], a: 0 },
      { q: '【金之问】藏宝图上，通常用什么符号标记宝藏的位置？', opts: ['○', '△', '×'], a: 2 },
      { q: '【金之问】古时常说「一金几银」，正常年景大约是？', opts: ['二两', '十两', '一百两'], a: 1 }
    ],
    gate: [
      { q: '【符文第一问】铜、银、金三把钥匙，按试炼先后排序是？', opts: ['金→银→铜', '铜→银→金', '银→铜→金'], a: 1 },
      { q: '【符文第二问】洞窟水晶微微发光，是因为蕴藏着？', opts: ['月光的月力', '萤火虫', '雷电'], a: 0 },
      { q: '【符文第三问】打开这扇门，最好的办法是？', opts: ['用头撞开', '等它自己开', '唤醒沉睡的符文'], a: 2 }
    ]
  };
  Object.assign(QUIZ, { tCopper: TREASURE_QUIZ.copper, tSilver: TREASURE_QUIZ.silver, tGold: TREASURE_QUIZ.gold, tGate: TREASURE_QUIZ.gate });

  /* —— 山顶武学问碑：武学三问 → 秘籍《青峰诀》；每周可复考换盘缠 —— */
  const MARTIAL_QUIZ = [
    { q: '【武学问碑】「练武不练功，到老一场空」——练武之外，还要练什么？', opts: ['内功心法', '兵器打造', '轻功飞行'], a: 0 },
    { q: '【武学问碑】太极讲究「以柔克刚」，四两拨千斤靠的是？', opts: ['蛮力', '巧劲与借力', '嗓门'], a: 1 },
    { q: '【武学问碑】扎马步最主要锻炼的是？', opts: ['下盘稳定', '嗓门洪亮', '眼疾手快'], a: 0 },
    { q: '【武学问碑】武侠世界里「闭关」通常是为了？', opts: ['睡大觉', '潜心修炼求突破', '躲避值日'], a: 1 },
    { q: '【武学问碑】「气沉丹田」，丹田大致在身体哪一处？', opts: ['头顶', '小腹', '脚跟'], a: 1 },
    { q: '【武学问碑】想出拳更有力，正确的发力顺序是？', opts: ['只用手臂', '蹬地—转腰—出拳', '先喊再打'], a: 1 },
    { q: '【武学问碑】「站如松」形容的是武者的什么？', opts: ['站姿挺拔', '头发像松针', '爱吃松子'], a: 0 },
    { q: '【武学问碑】运动之前做热身，最重要的目的是？', opts: ['摆造型', '防止受伤', '拖延时间'], a: 1 }
  ];
  Object.assign(QUIZ, { martialStele: MARTIAL_QUIZ });
  /* 碑前一问：答错现场重问（直至答对），保证前进不卡死 */
  async function steleAsk(q) {
    while (true) {
      const i = await choose(q.opts, { cancelIndex: -1, caption: { name: '武学问碑', text: q.q } });
      if (i === q.a) {
        ADV.Audio.sfx('correct');
        if (ADV.Growth) { ADV.Growth.addXP(4, '答题'); ADV.Growth.addDim('knowledge', 1); }
        return;
      }
      ADV.Audio.sfx('wrong');
      await say({ name: '武学问碑', text: '碑纹黯了一瞬……\n拳谱就刻在崖风里，再想想。' });
    }
  }
  S.martialStele = async () => {
    const f = F(), M = f.martial, C = ADV.Cal;
    await say({ name: '武学问碑', text: '青峰崖顶的古碑刻满拳谱，\n碑心一行小字：「以武学叩碑，诀自传。」' });
    if (!M.peak) {
      await say({ name: '武学问碑', text: '碑文浮现三问——\n全数答对，便传你碑底秘籍！' });
      for (const q of shuffle(MARTIAL_QUIZ).slice(0, 3)) await steleAsk(q);
      M.peak = true;
      ADV.Audio.sfx('fanfare');
      await say({ name: '武学问碑', text: '碑心石匣「咔」地弹开——\n一本泛蓝的册子静静躺在里面。' });
      await ADV.UI.itemGet('武林秘籍·青峰诀', '#7ab8f0');
      UI().toast(' ⚔ 学会秘籍：青峰诀（战斗技） ');
      addCup(4);
      logEvent('通过武学问碑三问，习得秘籍《青峰诀》');
      save();
      return;
    }
    if (f.steleWeek === C.weekIndex()) {
      await say({ name: '武学问碑', text: '碑文安静了下来。\n（本周的复考已经通过，下周再来）' });
      return;
    }
    await say({ name: '武学问碑', text: '「温故而知新——再考你一问，\n答对便赠盘缠。」' });
    await steleAsk(MARTIAL_QUIZ[(C.day + 3) % MARTIAL_QUIZ.length]);
    f.steleWeek = C.weekIndex();
    addGold(10);
    await say({ name: '武学问碑', text: '碑文微微一亮：\n「可造之材。」——金币 +10。' });
    save();
  };

  /* 祭坛一问：答错现场重问（直至答对），保证前进不卡死 */
  async function altarAsk(label, pool, idx) {
    while (true) {
      const q = pool[idx % pool.length];
      const i = await choose(q.opts, { cancelIndex: -1, caption: { name: label, text: q.q } });
      if (i === q.a) {
        ADV.Audio.sfx('correct');
        if (ADV.Growth) { ADV.Growth.addXP(4, '答题'); ADV.Growth.addDim('knowledge', 1); }
        return;
      }
      ADV.Audio.sfx('wrong');
      await say({ name: label, text: '符文黯淡了一瞬……\n别急，再想想。' });
    }
  }
  /* 三档祭坛通用：答对点亮 + 发钥匙 + 谢礼 */
  const ALTAR_META = [
    { flag: 'treasureCopper', label: '铜之祭坛', pool: 'copper', key: '铜钥匙', color: '#c98d5a', gift: ['seasonSeed', '四时花种', '#8ad0ff'], line: '铜纹次第亮起——一枚古朴的铜钥匙浮现在你面前！' },
    { flag: 'treasureSilver', label: '银之祭坛', pool: 'silver', key: '银钥匙', color: '#c0cad8', gold: 50, line: '银纹流转，寒光一闪——银钥匙到手！' },
    { flag: 'treasureGold', label: '金之祭坛', pool: 'gold', key: '金钥匙', color: '#e0b84c', gift: ['moonCrystal', '月光结晶', '#b98af5'], line: '金光大盛——传说中的金钥匙出现了！' }
  ];
  async function altarQuiz(o, tier) {
    const meta = ALTAR_META[tier], f = F(), C = ADV.Cal;
    if (f[meta.flag]) { await say({ name: meta.label, text: '符文安静地亮着。\n（你已经通过了这个试炼）' }); return; }
    await say({ name: meta.label, text: '宝石里映出古老的文字：\n「以智慧叩门者，钥自现。」' });
    const pool = TREASURE_QUIZ[meta.pool];
    await altarAsk(meta.label, pool, (C.day + tier * 2) % pool.length);
    f[meta.flag] = true;
    o.lit = true;
    ADV.Audio.sfx('fanfare');
    await say({ text: meta.line });
    if (meta.gold) { f.gold = (f.gold || 0) + meta.gold; UI().toast(` 金币 +${meta.gold} `); }
    if (meta.gift) { ADV.Collect.addItem(meta.gift[0], 1); await ADV.UI.itemGet(`${meta.gift[1]}（${meta.gift[0] === 'seasonSeed' ? '可种植' : '稀有道具'}）`, meta.gift[2]); }
    await ADV.UI.itemGet(meta.key + '（寻宝关键道具）', meta.color);
    UI().toast(` 🔑 取得${meta.key} `);
    logEvent(`通过了${meta.label}的试炼，取得${meta.key}`);
    save();
  }
  S.quizAltarA = (o) => altarQuiz(o, 0);
  S.quizAltarB = (o) => altarQuiz(o, 1);
  S.quizAltarC = (o) => altarQuiz(o, 2);
  /* 符文石门：三钥齐备后连答三问开启 */
  S.sealGate = async (o) => {
    const f = F();
    if (o.open || f.treasureGate) { await say({ text: '石门敞开着，符文的微光像在道谢。' }); return; }
    const KEYS = [['treasureCopper', '铜'], ['treasureSilver', '银'], ['treasureGold', '金']];
    const lack = KEYS.filter(([k]) => !f[k]).map(([, n]) => n);
    if (lack.length) {
      await say({ name: '符文石门', text: '石门上有三个钥匙凹槽——铜、银、金。\n（还缺：' + lack.join('、') + '钥匙）' });
      return;
    }
    await say({ name: '符文石门', text: '三把钥匙严丝合缝地嵌了进去！\n石门深处传来三声古老的提问——' });
    const pool = TREASURE_QUIZ.gate;
    for (let i = 0; i < pool.length; i++) await altarAsk('符文石门', pool, i);
    f.treasureGate = true;
    o.open = true;
    E().setObjectOpen('sealGate', true);
    ADV.Audio.sfx('fanfare');
    await say({ text: '「轰隆——」石门缓缓沉入地下，\n月光般的气息从门后涌出。' });
    UI().toast(' 🚪 符文石门开启！深处还有最后一个宝箱 ');
    logEvent('唤醒符文，打开了洞窟二层的石门');
    save();
  };
  /* 宝箱：chestE 残页 / chestF 古币 / chestG 罗盘 / bossChest 终极奖励 */
  S.chestE = async () => {
    if (F().chests.chestE) { await say({ text: '箱子已经空空如也……' }); return; }
    await openChest('chestE', '洞窟残页', '#c0cad8', 0, '西北角落的旧木箱——\n一页泛黄的地图残片躺在里面，\n画的好像是二层迷宫的西北角！');
    ADV.Collect.addItem('mapFrag', 1);
    save();
  };
  S.chestF = async () => {
    if (F().chests.chestF) { await say({ text: '箱子已经空空如也……' }); return; }
    await openChest('chestF', '古代钱币 ×2', '#e0b84c', 20, '箱子里整整齐齐码着一小堆古币！');
    ADV.Collect.addItem('ancientCoin', 2);
    save();
  };
  // chestG：罗盘是实物道具，openChest 只做 UI 演出，需单独入包
  S.chestG = async () => {
    if (F().chests.chestG) { await say({ text: '箱子已经空空如也……' }); return; }
    await openChest('chestG', '寻宝罗盘', '#8af0e8', 0, '丝绒衬布上躺着一枚黄铜罗盘，\n指针轻轻一颤，\n指向了还没开过的宝箱。');
    ADV.Collect.addItem('treasureCompass', 1);
    save();
  };
  S.bossChest = async (o) => {
    const f = F();
    if (f.chests.bossChest) { await say({ text: '大宝箱敞着盖，月光色的衬布空空的。' }); return; }
    ADV.Audio.sfx('item');
    if (o) o.open = true;
    f.chests.bossChest = true;
    f.gold = (f.gold || 0) + 300;
    ADV.Collect.addItem('ancientCoin', 2);
    ADV.Collect.addItem('mapFrag', 1);
    await say({ text: '箱盖开启的瞬间，一缕银光冲上洞顶——\n四壁的水晶齐齐亮起，像一场小小的极光！' });
    await ADV.UI.itemGet('金币 ×300', '#ffd94c');
    await ADV.UI.itemGet('古代钱币 ×2', '#e0b84c');
    await ADV.UI.itemGet('洞窟残页', '#c0cad8');
    ADV.Audio.sfx('fanfare');
    UI().toast(' 🗿 符文迷宫制霸！校园传说又添一笔 ');
    logEvent('打开了洞窟深处的大宝箱');
    save();
  };
  /* 提示牌与神秘老人 */
  S.treasureHint = async () => {
    await say({ name: '石碑', text: '「智慧即钥匙——答对祭坛之问，\n铜钥自现，暗道自开。」' });
  };
  S.treasureHint2 = async () => {
    await say({ name: '旧木牌', text: '「西翼藏银，东翼藏金；\n三钥归一，符文开门。」' });
  };
  S.treasureKeeper = async (ent) => {
    const f = F();
    if (f.chests && f.chests.bossChest) { await say({ name: '神秘老人', text: '晨曦的月光又回到校园了……\n孩子，你比当年的我们走得都远。' }); return; }
    if (f.treasureGate) { await say({ name: '神秘老人', text: '门后的月光等了一百年。\n去吧，把它带回来。' }); return; }
    if (f.treasureCopper && f.treasureSilver && f.treasureGold) { await say({ name: '神秘老人', text: '三把钥匙都齐了……\n中央走廊尽头的石门，正等你唤醒符文。' }); return; }
    if (!f.treasureCopper) { await say({ name: '神秘老人', text: '这洞窟是我们探险社的起点。\n西南角的铜之祭坛，只认用脑子开门的人。' }); return; }
    if (!f.treasureSilver) { await say({ name: '神秘老人', text: '上二层了？好快的脚步。\n西翼的银祭坛在闪——它讨厌蛮干的人。' }); return; }
    await say({ name: '神秘老人', text: '还差金钥匙。\n东翼的最深处，金之祭坛守着最后一段路。' });
  };

  /* ==================== 第二章 · 月光学院与晨曦宝石 ====================
   * 谜题表（smoke 拦截器按 caption 匹配自动选正确项）
   */
  const RIDDLES = [
    { q: '魔鬼藤最怕什么？', opts: ['光与火的咒语', '冰冷的水', '甜美的歌'], a: 0 },
    { q: '七瓶魔药的诗：「前进之火在瓶中，巨人与侏儒皆不通；荨麻苦而毒芹凶，两杯净水分其中」。穿过后方黑色火焰该喝？', opts: ['最小的圆瓶', '最方的瓶子', '最大的瓶子'], a: 0 },
    { q: '心愿之镜前，你如何回应贪影的诱惑？', opts: ['「我用宝石许愿，要无尽的力量！」', '「我拥有的已经足够——朋友、知识与勇气。」', '「把宝石给我，我要卖掉它！」'], a: 1 }
  ];
  /* A3 机关化题组：魔药课「月露调配」两步 + 咒语课「三烛辉映」三步
   * 形状与 RIDDLES 一致（q/opts/a），同样走 smoke 拦截器自动作答；
   * 正确项刻意放在非 0 位，玩家不能无脑选第一项 */
  const MECHANISMS = [
    { q: '月露调配·第一步主料', opts: ['月光三滴', '泉水三滴', '泪水三滴'], a: 0 },
    { q: '月露调配·第二步药引', opts: ['泥土一撮', '星尘一撮', '花瓣一撮'], a: 1 },
    { q: '三烛辉映·第一座烛台', opts: ['银烛（月升）', '金烛（月悬）', '蓝烛（月落）'], a: 1 },
    { q: '三烛辉映·第二座烛台', opts: ['银烛（月升）', '金烛（月悬）', '蓝烛（月落）'], a: 2 },
    { q: '三烛辉映·第三座烛台', opts: ['银烛（月升）', '金烛（月悬）', '蓝烛（月落）'], a: 0 },
  ];

  function addCup(n) {
    state.flags.cup = (state.flags.cup || 0) + n;
    UI().toast(` 🏆 学院分 +${n}（${state.flags.house || '未分院'}：${state.flags.cup}）`);
    save();
  }
  // 学院分消耗出口（与 addCup 对称）：不足时返回 false，不生效
  function spendCup(n) {
    if ((state.flags.cup || 0) < n) return false;
    state.flags.cup -= n;
    UI().toast(` 🏆 学院分 -${n}（剩余 ${state.flags.cup}）`);
    save();
    return true;
  }

  // —— 猫头鹰团子：月光信笺 ——
  S.owl = async (ent) => {
    E().emote(ent, '♪');
    if (!F().finalPassed) { await say({ name: '团子', text: '咕？（它歪着头看你，\n好像在等某个重要的时刻）' }); return; }
    if (F().letterGot) { await say({ name: '团子', text: '咕咕！（它用翅膀指了指喷泉，\n又指了指月亮的方向）' }); return; }
    // A3：送信剧情约定「月圆之夜」——只在傍晚/夜晚发生，白天团子在打盹（已拿信的喷泉提示不受限）
    if (!ADV.Cal.isNight()) { await say({ name: '团子', text: '咕噜……（它把头埋进翅膀打盹。\n猫头鹰只在夜晚清醒——\n等天色暗了再来吧）' }); return; }
    ADV.Audio.sfx('item');
    await say({ text: '月圆之夜，校园的旧钟敲了十三声。\n一只雪白的猫头鹰落在你面前——' });
    await say({ text: '它腿上绑着一封泛着微光的信：' });
    await say({ name: '星儿', text: '「阳光中学有一个隐藏了一百年的名字：月光学院。\n初代校长晨曦女士把一件圣物藏在了学校最深处，\n用来庇护校园的四季与晨昏。\n现在，有『影子』在夜里寻找它。\n——月圆之夜，喷泉见。」' });
    await ADV.UI.itemGet('月光信笺', '#8ad0ff');
    F().letterGot = true;
    save();
    await say({ text: '（调查中央广场的喷泉，\n水帘之后似乎藏着什么……）' });
    UI().toast(' 第二章开启：月光学院与晨曦宝石 ');
  };

  // —— 喷泉：月光门 ——
  S.moonDoor = async () => {
    if (!F().letterGot) {
      await say({ text: '喷泉哗哗地唱着歌。\n（水帘后好像有什么，但此刻纹丝不动）' });
      return;
    }
    await say({ text: '月光落在水面——\n水帘无声地向两边分开，露出银色的阶梯！' });
    ADV.Audio.sfx('door');
    ADV.Game.busy = true;
    await new Promise(res => ADV.Engine.fadeTo(1, .5, res));
    ADV.Engine.loadMap('moonhall', 15, 17, 'up');
    await new Promise(res => ADV.Engine.fadeTo(0, .5, res));
    ADV.Game.busy = false;
    if (!F().house) UI().toast(' 找到归类帽，参加分院仪式！ ');
  };

  // —— 归类帽：分院 ——
  S.sortHat = async () => {
    if (F().house) {
      await say({ name: '归类帽', text: `（它打着哈欠）\n${F().house}的孩子啊……帽子从不看错人。` });
      return;
    }
    await say({ name: '归类帽', text: '哦豁——又一颗崭新的脑袋！\n让我瞧瞧，你心里装着什么……' });
    await say({ name: '归类帽', text: '勇气、智慧、仁慈、疾风……\n都在这儿呢。孩子，你自己想去哪？' });
    const h = await choose(['星辰社（求知若渴）', '晨曦社（温暖坚定）', '藤蔓社（仁厚坚韧）', '疾风社（勇往直前）'], { caption: { name: '归类帽', text: '选吧！选定即是归属。' } });
    F().house = ['星辰社', '晨曦社', '藤蔓社', '疾风社'][h];
    ADV.Audio.sfx('fanfare');
    await say({ name: '归类帽', text: `「${F().house}！」\n哈哈哈哈——好眼光，帽子批准了！` });
    addCup(10);
    save();
    UI().toast(` 你被分入了 ${F().house}！ `);
    await say({ text: '（大厅四面响起掌声——\n月见校长朝你微微颔首）' });
  };

  // —— 学院杯榜：查看 + 积分兑换（学院分的消耗出口） ——
  S.cupBoard = async () => {
    const f = F();
    if ((f.cup || 0) < 10) {
      await say({ name: '学院杯榜', text: `本学期学院分：\n${f.house || '（未分院）'}：${f.cup || 0} 分\n（魔法课、试炼、友谊的故事都会加分）` });
      return;
    }
    const pick = await choose(
      ['兑换零花钱（10 分 → 💰30）', '兑换月光结晶（20 分 → ×1）', '只看看榜'],
      { caption: { name: '学院杯榜', text: `${f.house || '（未分院）'}：${f.cup} 分\n（教务处为踊跃争分的同学备了小谢礼）` } });
    if (pick === 0) {
      // 经济调平：10 分兑换 50 → 30（杯分来源广，防「第二铸币厂」）
      if (spendCup(10)) { f.gold = (f.gold || 0) + 30; UI().toast(' 💰 金币 +30 '); await say({ name: '学院杯榜', text: '「为学院争光，学院也不亏待你。」' }); }
    } else if (pick === 1) {
      if (spendCup(20)) { ADV.Collect.addItem('moonCrystal', 1); ADV.Audio.sfx('item'); await ADV.UI.itemGet('月光结晶', '#8ad0ff'); }
    }
  };

  // —— 月见校长：章节引导 / 学院杯典礼 ——
  S.yuejian = async () => {
    const f = F();
    await teachRecipe('yuejian');                                // 月光羹
    if (!f.house) { await say({ name: '月见校长', text: '欢迎来到月光学院，孩子。\n先去和归类帽聊聊吧——它等这一天很久了。' }); return; }
    if (f.shadowDown && !f.houseCup) {
      // —— 学院杯典礼 ——
      const friendsPts = Object.values(state.friends).reduce((s, r) => s + r.stage * 3, 0);
      const total = (f.cup || 0) + friendsPts;
      ADV.Audio.sfx('fanfare');
      await say({ name: '月见校长', text: '今夜，月光学院为大礼堂亮起所有的灯——\n为欢迎它的拯救者。' });
      await say({ name: '月见校长', text: '本学期学院杯：\n' + `${f.house}：${total} 分！` });
      await say({ name: '月见校长', text: '分数会褪色，奖杯会蒙尘。\n但今晚你们守护的东西——不会。' });
      await say({ text: '（金鹏远远地举起了杯子，\n小明和小红与你重重击掌）' });
      f.houseCup = true;
      save();
      UI().toast(' 第二章通关！天文台顶层已开放 ');
      await say({ name: '月见校长', text: '对了——天文台的顶层向你敞开了。\n那里是离星星最近的地方。' });
      return;
    }
    // —— 传功终章：《晨曦心法》（通关 + 学院杯后回访） ——
    if (f.houseCup && !f.martial.heart && f.spells.dawn) {
      f.martial.heart = true;
      ADV.Audio.sfx('fanfare');
      await say({ name: '月见校长', text: '魔法练到深处是心法，武功练到深处也是心法。\n晨曦女士留下的最后一页——交给你了。' });
      await ADV.UI.itemGet('武林秘诀·晨曦心法', '#7af0e8');
      UI().toast(' ⚔ 学会终极心法：晨曦心法（大幅回复体力） ');
      save();
      return;
    }
    if (f.houseCup) { await say({ name: '月见校长', text: '晨曦宝石已重新安眠。\n去天文台顶层看看吧——星儿的信里，好像提到了你。' }); return; }
    if (f.shadowDown) { await say({ name: '月见校长', text: '去大厅中央吧，孩子。\n今晚有个小小的仪式。' }); return; }
    if (!f.classesDone) {
      const c = [f.cFlight, f.cPotion, f.cCharm, f.cAstro];
      await say({ name: '月见校长', text: `魔法课程：飞行（${c[0] ? '✔' : '✘'}）魔药（${c[1] ? '✔' : '✘'}）\n咒语（${c[2] ? '✔' : '✘'}）天文（${c[3] ? '✔' : '✘'}）\n——四门齐修，图书馆的暗门自会为你开启。` });
      return;
    }
    await say({ name: '月见校长', text: '图书馆禁书区的暗门开了。\n旧书的尘埃之下，是通往地下的走廊。\n小心那三颗脑袋的看守者。' });
  };

  // —— 金鹏：对手 → 朋友 ——
  S.jinpeng = async (ent) => {
    E().emote(ent, '!');
    if (F().shadowDown) {
      if (friend('jinpeng').stage >= 3) { await say({ name: '金鹏', text: '喂——下次回廊试炼，\n我要跟你比谁先到镜子那儿。' }); return; }
      await say({ name: '金鹏', text: '那晚在镜子里……我看见自己孤零零的。\n你选了朋友。我记住了。' });
      return;
    }
    if (friend('jinpeng').love < 15) {
      const t = await choose(['「一起玩吗？」', '「走开，碍事」'], { caption: { name: '金鹏', text: '哼，普通班的也能进月光学院？\n一定是分院帽老了眼昏了头。' } });
      if (t === 1) { E().playAction(ent, 'cry', 1.2); await say({ name: '金鹏', text: '你……你无礼！' }); gainBond('jinpeng', -5); return; }
      E().playAction(ent, 'doubt', 1.2);
      await say({ name: '金鹏', text: '跟、跟你玩？金家继承人从不跟人「玩」！\n……飞行课你要是能赢我，再提这两个字。' });
      gainBond('jinpeng', 3);
      return;
    }
    await say({ name: '金鹏', text: '夜里别一个人去旧图书馆。\n……我说完了，别问我为什么关心你。' });
  };

  // —— 四门魔法课 ——
  S.broomStand = async () => {
    if (!F().house) { await say({ text: '（先去分院，才能上魔法课）' }); return; }
    if (F().cFlight) {
      const go = await choose(['再飞一次（刷学院分）', '收起扫帚'], { caption: { text: '扫帚安静地悬在架子上。' } });
      if (go === 0) {
        const win = await new Promise(res => ADV.Mini.start('broom', res));
        if (win) { addCup(3); await say({ name: '金鹏', text: '……飞得不赖。\n就、就是不赖而已！' }); }
        else await say({ text: '你从扫帚上滚了下来，灰头土脸。' });
      }
      return;
    }
    await say({ text: '你握住扫帚——它轻轻颤了一下，\n像一匹认得主人的马。' });
    await say({ name: '金鹏', text: '第一次骑扫帚？看好——\n身体前倾，风会接住你。哼。' });
    const win = await new Promise(res => ADV.Mini.start('broom', res));
    if (win) {
      F().cFlight = true; addCup(5); save(); await checkClasses();
      await say({ text: '金翼球在你掌心发出嗡嗡的暖光——\n飞行课，通过了！' });
    } else await say({ text: '（再练练……金翼球跑得比想象的快）' });
  };

  S.momo = async (ent) => {
    if (!F().house) { await say({ name: '墨墨', text: '呃、你好……\n（她推了推眼镜，好像还没下课）' }); return; }
    if (!F().cPotion) {
      await say({ name: '墨墨', text: '魔药课……要亲手调配「月露」。\n两步：先下主料，再下药引——按诗来。' });
      let ok = true;
      for (let s = 0; s < 2; s++) {
        const st = MECHANISMS[s];
        const i = await choose(st.opts, { cancelIndex: -1, caption: { name: '魔药课', text: st.q } });
        if (i !== st.a) { ok = false; break; }
        await say({ name: '墨墨', text: s === 0
          ? '月色沉进锅底——对，就是这个底色。\n接下来，药引。'
          : '星尘一撒——银光涌起来了！' });
      }
      if (ok) {
        ADV.Audio.sfx('correct');
        await say({ name: '墨墨', text: '月露成了……！\n锅里的药变成银色的了。' });
        F().cPotion = true; addCup(5); save(); await checkClasses();
      } else {
        ADV.Audio.sfx('wrong');
        await say({ name: '墨墨', text: '唔……锅冒黑烟了。\n这一步不对——从头再配一遍吧。' });
      }
      return;
    }
    await say({ name: '墨墨', text: '月露要在满月夜装进水晶瓶，\n不然月光会漏掉……大概。' });
    // 画与药：墨墨×小影 双人社线
    if (friend('xiaoying').stage >= 1 && !F().yingFix) {
      F().yingFix = true;
      await say({ text: '小影抱着一本褪色的旧画册路过，\n墨墨叫住了她：「显影药水，交给我。」' });
      const i = await choose(['先加月光粉', '先加晨露', '直接搅拌'], { cancelIndex: -1, caption: { name: '墨墨', text: '「褪色的画，第一步应该——」' } });
      await say({ text: i === 1 ? '药水泛起微光——成功！' : '墨墨及时扶住了你的手：\n「第一步，是晨露哦。」（重来了，但成功了）' });
      await say({ text: '旧画缓缓显影——\n画角落浮现一行以前看不见的小字：\n「谢谢一直看我画的人。」' });
      gainBond('momo', 10); gainBond('xiaoying', 10);
      addCup(4);
      save();
    }
  };

  /* —— 魔法研习：四门战斗咒语，逐阶学习（谜题用 AI/题库） —— */
  const SPELLS = [
    { key: 'bolt', name: '月光弹', cost: 30, prev: null, flavor: '「以月之名，聚光成矢。」',
      q: '月光弹的咒语读音是？', opts: ['Luna-Volt（月之矢）', 'Lumo-Nox（暗影灭）', 'Volt-Stella（星之雷）'], a: 0,
      ok: '杖尖凝聚出一轮小小的满月——\n掷出！月光弹学会了！' },
    { key: 'guard', name: '星之盾', cost: 50, prev: 'bolt', flavor: '「星星不会拒绝守护。」',
      q: '星之盾最强的时刻是？', opts: ['正午烈日下', '星光璀璨的夜晚', '阴雨的白天'], a: 1,
      ok: '一面缀满星点的光盾展开——\n星之盾学会了！' },
    { key: 'bind', name: '缚影咒', cost: 80, prev: 'guard', flavor: '「缚住影子，便缚住了脚步。」',
      q: '缚影咒瞄准的是敌人的什么？', opts: ['敌人的心脏', '敌人的武器', '敌人的影子'], a: 2,
      ok: '黑色的锁链从杖尖垂落——\n缚影咒学会了！' },
    { key: 'dawn', name: '晨光治愈', cost: 120, prev: 'bind', flavor: '「最深的夜，也挡不住第一缕晨光。」',
      q: '晨光治愈最需要的材料是？', opts: ['龙鳞粉', '黎明前的露水', '夜枭羽毛'], a: 1,
      ok: '温暖的光芒包裹全身——\n晨光治愈学会了！这是吴老师的压轴绝学。' }
  ];

  S.charmBoard = async () => {
    const f = F();
    if (!f.house) { await say({ text: '（黑板上的咒语在跳舞，但你还没分院）' }); return; }
    // —— 咒语课小测（一次性） ——
    if (!f.cCharm) {
      await say({ text: '黑板旁立着三座烛台——银、金、蓝。\n咒语课小测：按铜牌口诀，依次点亮它们！' });
      await say({ text: '铜牌刻着：「金轮当空先开口，\n蓝月西沉第二盏，银月初升收了尾。」' });
      let ok = true;
      for (let s = 0; s < 3; s++) {
        const st = MECHANISMS[2 + s];
        const i = await choose(st.opts, { cancelIndex: -1, caption: { name: '三烛辉映', text: st.q } });
        if (i !== st.a) { ok = false; break; }
        await say({ text: ['金烛「轰」地亮起——暖光铺满讲台！', '蓝烛的冷焰摇曳着加入——两色光缠在一起！', '银烛最后醒来——三色光辉映如昼！'][s] });
      }
      if (ok) {
        ADV.Audio.sfx('correct');
        await say({ text: '三烛辉映——杖尖绽出一朵星光！\n咒语课，通过了！' });
        f.cCharm = true; addCup(5); save(); await checkClasses();
      } else {
        ADV.Audio.sfx('wrong');
        await say({ text: '点错了……烛火齐齐熄灭。\n（对照铜牌口诀，再试一次）' });
      }
      return;
    }
    // —— 魔法研习（重复玩法：学金战斗咒语） ——
    const next = SPELLS.find(s => !f.spells[s.key]);
    const knows = Object.values(f.spells || {}).some(Boolean);
    const opts3 = ['魔法研习（学战斗咒语）'];
    if (knows && !(f.tame && f.tame.wu)) opts3.push('精灵支援特训（💰100）');
    opts3.push('随便看看');
    const go = await choose(opts3, { caption: { name: '咒语教室', text: next ? `下一课：${next.name}（💰${next.cost}）\n要继续深造吗？` : '四门咒语你已全部掌握！' } });
    if (go === opts3.length - 1 || (!next && go === 0)) {
      if (!next) await say({ text: '黑板向你行了个礼——\n「青出于蓝，学生。」' });
      return;
    }
    // —— 三期A 精灵支援特训：教你的小伙伴听懂咒语——宠物战中可用「支援」指令 ——
    if (opts3[go] === '精灵支援特训（💰100）') {
      if ((f.gold || 0) < 100) { await say({ name: '吴老师', text: '「学费 100 文——先去攒攒吧。」' }); return; }
      f.gold -= 100;
      const qz = seededShuffle(TAMING_QUIZ, ADV.Cal.day * 17 + 5)[0];
      const wrongs = { n: 0 };
      await ask('吴老师', qz, wrongs, null, 'science');
      if (wrongs.n === 0) {
        f.tame = f.tame || {};
        f.tame.wu = true;
        ADV.Audio.sfx('fanfare');
        await say({ name: '吴老师', text: '「成了——杖尖的星光，它也看得见了。\n以后宠物战的菜单里会多一项『支援』：\n星之盾、晨光治愈、缚影咒、月光弹，\n每场战斗各能支援一次。\n（小提醒：新项插在道具后面——『逃跑』挪到了最后一格，\n按惯了老位置的手，别一急把支援点出去）' });
        logEvent('跟吴老师学会了精灵支援特训');
        save();
        UI().toast(' ✦ 精灵支援开张：宠物战菜单新增「支援」 ');
      } else {
        f.gold += 100;                               // 答错退学费（同阿橘讨教惯例）
        await say({ name: '吴老师', text: '「咒语是严谨的语言。学费先还你——\n想清楚了再来。」' });
      }
      return;
    }
    if (go !== 0) return;
    if (next.prev && !f.spells[next.prev]) { await say({ text: '（要先学会上一阶咒语）' }); return; }
    if (f.gold < next.cost) { await say({ name: '吴老师', text: `学费 💰${next.cost}……先去攒攒吧。\n（陪练、钓鱼、挖宝都来钱）` }); return; }
    await say({ name: '吴老师', text: next.flavor });
    // 理论题：优先大模型现场出，失败回退内置谜语
    const ai = await ADV.AI.question('final', 'normal');
    let pass;
    if (ai.ai) {
      await say({ name: '吴老师', text: '「今日题目是校长刚送来的新题——」' });
      pass = (await choose(ai.opts, { cancelIndex: -1, caption: { name: '魔法理论', text: ai.q } })) === ai.a;
    } else {
      pass = (await choose(next.opts, { cancelIndex: -1, caption: { name: '咒语研习', text: next.q } })) === next.a;
    }
    if (!pass) { ADV.Audio.sfx('wrong'); await say({ name: '吴老师', text: '「咒语是严谨的语言。\n回去把讲义再读一遍。」' }); return; }
    ADV.Audio.sfx('fanfare');
    f.gold -= next.cost;
    f.spells[next.key] = true;
    await say({ text: next.ok });
    UI().toast(` ✦ 学会魔法：${next.name}（战斗技） `);
    addCup(3);
    save();
  };

  S.telescope = async () => {
    if (!F().house) { await say({ text: '（望远镜蒙着布——还没到观测时间）' }); return; }
    if (F().cAstro) { await say({ text: '镜筒里，猎户的腰带闪着淡蓝的光。' }); return; }
    await say({ text: '你贴上目镜——\n星星们开始依次眨眼，等你记住它们。' });
    const win = await new Promise(res => ADV.Mini.start('stars', res));
    if (win) {
      F().cAstro = true; addCup(5); save();
      await say({ text: '四颗星连成了小小的冠冕——\n天文课，通过了！' });
      await checkClasses();
    } else await say({ text: '（星星的顺序记岔了……再试一次）' });
  };

  async function checkClasses() {
    const f = F();
    if (f.cFlight && f.cPotion && f.cCharm && f.cAstro && !f.classesDone) {
      f.classesDone = true;
      ADV.Audio.sfx('open');
      UI().toast(' 四门魔法课齐修——图书馆禁书区暗门开启！ ');
      save();
    }
    await chapterMid(2);
  }

  // —— 禁书区 ——
  S.grey = async (ent) => {
    if (F().shadowDown) { await say({ name: '灰先生', text: '那天夜里的事……谢谢你。\n她生前最爱的图书馆，我会一直守着。' }); return; }
    await say({ name: '灰先生', text: '……图书馆闭馆了。\n（他擦书的手停了半拍）' });
    await say({ text: '（他的影子在灯下晃了晃——\n好像比正常的影子，浓了一点）' });
  };
  S.libBook = async () => {
    if (F().libClue) { await say({ text: '线索书翻在那一页：\n『回廊五关，唯乐声可安三首之犬。』' }); return; }
    await say({ text: '你抽出一本落满灰的书——\n《晨曦女士手记》！' });
    await say({ name: '手记', text: '『……宝石藏于旧图书馆地下。\n守门者为吾之旺福，三首而一心。\n唯晨光之摇篮曲可令其眠。』' });
    await say({ name: '手记', text: '『回廊五关：藤怕光、钥在飞、\n棋行骑士步、药读诗、镜照心。』' });
    F().libClue = true;
    save();
    UI().toast(' 取得线索：回廊五关与摇篮曲 ');
  };

  // —— 三首犬旺福 ——
  S.dog = async () => {
    if (F().dogSleep) { await say({ text: '旺福的三个脑袋一起打着呼噜，\n尾巴还轻轻摇着。' }); return; }
    await say({ text: '三首犬旺福挡在活板门前——\n六只眼睛齐刷刷盯着你！' });
    await say({ text: '（手记说：唯晨光之摇篮曲可令其眠。\n那段旋律……你在音乐教室练过！）' });
    const win = await new Promise(res => ADV.Mini.start('music', res));
    if (win) {
      F().dogSleep = true;
      const d = E().findObject('dog');
      if (d) d.sleep = true;
      ADV.Audio.sfx('save');
      save();
      await say({ text: '琴声落下——三个脑袋一个接一个\n沉沉睡去，呼噜声像远处的雷。' });
      UI().toast(' 旺福睡着了！活板门可以打开了 ');
    } else {
      await say({ text: '弹错了半个音——\n旺福的六只眼睛瞪得更圆了！\n（再试一次，稳住手）' });
    }
  };
  S.trapLook = async () => {
    if (F().dogSleep) { await say({ text: '活板门虚掩着，\n往下一跃便是回廊五关。' }); return; }
    await say({ text: '活板门被旺福的爪子护在身下，\n纹丝不动。' });
  };

  // —— 回廊五关 ——
  async function openGate(n) {
    F()['t' + n] = true;
    const g = E().findObject('gate' + n);
    if (g) g.solidTiles = [];
    ADV.Audio.sfx('open');
    addCup(6);
    save();
    await say({ text: '轰隆——石闸缓缓升起！' });
  }
  S.t1Vine = async () => {
    if (F().t1) { await say({ text: '魔鬼藤蜷成小小一团，睡着了。' }); return; }
    await say({ text: '魔鬼藤堵住了走廊——\n藤蔓上开着警惕的紫色花。' });
    const q1 = mixQ(RIDDLES[0]);
    const i = await choose(q1.opts, { cancelIndex: -1, caption: { name: '魔鬼藤', text: RIDDLES[0].q } });
    if (i === q1.a) {
      ADV.Audio.sfx('correct');
      await say({ text: '你念出光之咒——藤蔓像怕痒似的\n缩回了石缝里！' });
      await openGate(1);
    } else { ADV.Audio.sfx('wrong'); await say({ text: '藤蔓抖了抖，缠得更紧了。\n（想想它是什么植物……）' }); }
  };
  S.t2Keys = async () => {
    if (F().t2) { await say({ text: '门上的钥匙孔闪着微光。' }); return; }
    await say({ text: '满屋的钥匙扇着翅膀乱飞——\n门上刻着谜语，只有一把钥匙能开门。' });
    const win = await new Promise(res => ADV.Mini.start('keys', res));
    if (win) { await say({ text: '正确的钥匙插进锁孔，\n咔哒——门开了！' }); await openGate(2); }
    else await say({ text: '钥匙们哄一声散开又聚拢。\n（看准翅膀的颜色和钥匙上的宝石）' });
  };
  S.t3Chess = async () => {
    if (F().t3) { await say({ text: '棋盘安安静静，白马朝你点点头。' }); return; }
    await say({ text: '巨大的棋盘横在面前——\n白色的骑士棋子朝你屈膝致意。' });
    await say({ name: '白骑士', text: '旅人啊，以骑士之道踏过光格，\n石闸自会为你让路。' });
    const win = await new Promise(res => ADV.Mini.start('chess', res));
    if (win) { await say({ text: '最后一块光格亮起——\n白骑士向你敬了个标准的骑士礼！' }); await openGate(3); }
    else await say({ text: '棋子轻轻摇头。\n（马走「日」字，规划好路线再跳）' });
  };
  S.t4Potion = async () => {
    if (F().t4) { await say({ text: '黑色的火焰安静地烧着，\n像一幅挂毯。' }); return; }
    await say({ text: '一排魔药瓶立在黑色火焰前，\n瓶下压着一首诗。' });
    const i = await choose(RIDDLES[1].opts, { cancelIndex: -1, caption: { name: '魔药诗', text: RIDDLES[1].q } });
    if (i === RIDDLES[1].a) {
      ADV.Audio.sfx('correct');
      await say({ text: '你喝下最小圆瓶里的药剂——\n穿过黑火，浑身清凉！' });
      await openGate(4);
    } else { ADV.Audio.sfx('wrong'); await say({ text: '火焰猛地窜高！\n（再读一遍诗：巨人与侏儒皆不通……）' }); }
  };

  // —— 第五关：心愿之镜 ——
  S.t5Mirror = async () => {
    if (F().shadowDown) { await say({ text: '镜面平静如水，\n只照出你微笑的脸。' }); return; }
    await say({ text: '穹顶大厅的中央立着一面华丽的金镜，\n镜框上刻着：\n「厄里斯 · 斯特拉 · 噢 · 鲁比 · 咳呢」' });
    const fr = Object.values(state.friends).reduce((s, r) => s + r.love, 0);
    await say({ text: '你在镜中看见——\n' + (fr > 200 ? '同学们围着你大笑，喷泉的水花映着彩虹。' : '自己捧着四枚徽章，站在石门前意气风发。') });
    await say({ text: '镜前站着灰先生。\n可他的影子，正在从他脚下立起来——\n那影子的轮廓，像一团贪婪的黑雾。' });
    await say({ name: '贪影', text: '看到了吗？镜子会给你一切。\n把晨曦宝石交出来——\n我可以让你「心想事成」。' });
    const i = await choose(RIDDLES[2].opts, { cancelIndex: -1, caption: { name: '贪影', text: RIDDLES[2].q } });
    if (i !== RIDDLES[2].a) {
      ADV.Audio.sfx('wrong');
      await say({ name: '贪影', text: '哈哈哈哈——欲望的味道，真香啊。\n（镜子里的画面开始扭曲……快醒醒！）' });
      return;
    }
    ADV.Audio.sfx('fanfare');
    await say({ text: '你大声说：\n「我拥有的已经足够——\n朋友、知识与勇气，都长在我自己身上！」' });
    await say({ text: '镜面泛起涟漪——\n贪影发出刺耳的尖啸，\n被一步步拖回了镜中！' });
    await say({ name: '灰先生', text: '……我？我做了什么？\n（他茫然四顾，随即老泪纵横）\n谢谢你，孩子。是那道影子……霸占我太久了。' });
    await say({ name: '灰先生', text: '「它缠着我时，说过梦话——\n它来自一个谁也不记得的地方。\n孩子，如果哪天你遇见更浓的黑雾，\n替我，把名字还给它。」' });
    await ADV.UI.itemGet('晨曦宝石', '#ffe9a8');
    F().shadowDown = true;
    addCup(15);
    save();
    await say({ text: '（把宝石带回月光大厅，交给月见校长吧。\n出口在镜子身后。）' });
    UI().toast(' 贪影被封印！带着宝石回大厅 ');
  };

  // —— 天文台顶层 ——
  S.topScope = async () => {
    // 批次四十八：顶层望远镜升维 3D 银河（无 THREE/WebGL 自动回退原文案）
    if (ADV.Sky3D && await ADV.Sky3D.viewPromise('galaxy')) return;
    await say({ text: '整片星空涌入镜筒——\n银河像一条发光的河，从天这头流到那头。' });
  };
  S.topSign = async () => { await say({ name: '木牌', text: '「星之誓约」\n—— 凡在顶层许下的心愿，\n星星都会记得。' }); };
  S.chestTop = async () => {
    if (F().topGift) { await say({ text: '箱子里只剩一张星图，\n上面画着你们的冒险路线。' }); return; }
    const o = E().findObject('chestTop');
    if (o) o.open = true;
    F().topGift = true;
    state.flags.gold = (state.flags.gold || 0) + 200;
    ADV.Audio.sfx('item');
    await say({ text: '晨曦女士留下的谢礼箱——\n里面是给「点灯人」的金币！' });
    await ADV.UI.itemGet('星之谢礼', '#ffd94c');
    UI().toast(' 💰 金币 +200 ');
    save();
  };

