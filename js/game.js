/* =========================================================
 * game.js —— 游戏剧情与闯关逻辑
 * 主线：收集 数学/语文/科学 三枚智慧徽章 → 打开后山石门
 *       → 通过神秘老人的最终试炼 → 通关（冒险仍将继续）
 * 全部剧情用 async/await 脚本编写，仿 RPG Maker 事件指令。
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.Game = (function () {

  const SAVE_KEY = 'campus_adventure_save_v1';

  // 初始旗标（也是旧存档升级时合并的默认值）
  const blankFlags = () => ({
    metPrincipal: false, gotBread: false, breadShared: false,
    gotHairpin: false, hairpinReturned: false,
    gotComic: false, comicReturned: false,
    heardHairpin: false, heardComic: false,
    touredTown: false, touredCampus: false, touredSettle: false, touredTeacher: false,
    gateOpen: false, finalPassed: false, starCharm: false,
    gold: 0, mapPieces: 0, caveOpen: false, bell: false,
    gotMinerPiece: false, liuWin: false, zhaoWin: false,
    chests: { chestA: false, chestB: false, chestC: false },
    // —— 第二章 · 月光学院 ——
    letterGot: false, house: '', cup: 0,
    cFlight: false, cPotion: false, cCharm: false, cAstro: false, classesDone: false,
    libClue: false, dogSleep: false,
    t1: false, t2: false, t3: false, t4: false, shadowDown: false, houseCup: false, topGift: false,
    // —— 大扩充：四幕 / 考试 / 乌云帮 / 埋宝 / 三章 ——
    act: 1,
    weekDone: -1, mExam: false, midterm: false, studyBuff: false, examQuote: false,
    wuyunB1: false, wuyunB2: false, wuyunB3: false, wuyunGang: false,
    wuyunStudy: false, wuyunPass: false, dazhuangDone: false, xiaoyingDone: false,
    sportsDone: false, albumGot: false, gearGot: false, e0open: false, introDone: false,
    senseiWin: false, arenaDay: 0, mockDay: 0, picnicWeek: 0, fireflyNight: 0, forage: {}, fish: {},
    keeperHist: false, clubFlagDone: false, era1Puzzle: false, era2Letter: false, era3Note: false,
    freeLabDay: 0, rackDay: 0, menuDay: 0, menuStreak: 0, stoveDay: 0, stovePts: 0, lostDay: 0, lostCount: 0,
    wordDay: 0, wordStreak: 0, letterStage: 0, shootBest: 0, trophyIdx: 0, scaleDay: 0, height: 142,
    gradQuote: null, mirrorAnswers: null,
    // —— 交互深化 ——
    party: '', hang: {}, tutor: {}, plant: {}, dogFed: 0, dogPal: false, birdDay: 0,
    hist: {}, sheKey: false, spirits: {}, sakura: false, boar: false, lantern: false,
    e5: false, momAlum: false, classDay: 0, catchDay: 0, challengeDay: 0, mingComic: false, gangDuel: false, yingFix: false,
    dig: {}, e1: false, e2: false, e3: false, e4: false, shadowWin: false, ch3Done: false, fourSeasons: false,
    yalbum: 0, gotLunch: false,
    mineDepth: 0, mineRecord: 0, mineOre: {},           // 矿道：当前层 / 最深纪录 / 今日已敲矿脉
    goldDay: -1,                                        // 睡前结算单基准（-1 = 尚无基准，当日不显示收支）
    excerpts: {}, diary: [], diaryStars: 0, today: [], read: {},
    libQuest: false, libDone: false, stallQuest: false, stallDone: false, clubDone: false,
    farmQuest: false, farmDone: false, catches: 0,
    radioDay: 0, radioCount: 0, toy: {}, cardWins: 0,
    sportsDay: 0, sportsMedal: 0, sportsGold: false, sportsChamp: false, jumpBest: 0, gymWeek: 0,
    melonBest: 0, bugWins: 0,                           // 西瓜割最多连斩 / 斗虫擂台胜场
    hotbarIdx: 0,                                       // 工具热键栏当前槽位（0 = 手部）
    base: 0, basePartyDay: 0,                           // 秘密基地等级(0-3) / 基地聚会日期
    // —— 武林秘诀 & 魔法学习 ——
    martial: { sweep: false, tie: false, listen: false, steps: false, heart: false, palm: false, leg: false, qi: false, peak: false, lvl: 0 },
    martialWeek: 0, steleWeek: 0,                       // 刘老师武术课 / 武学问碑 本周已用（周锁）
    spells: { bolt: false, guard: false, bind: false, dawn: false },
    // —— 后徽章时代（P0/P1/P2） ——
    quests: { day: 0, list: [] }, rumorTruth: false,
    photoStreetQuest: false, photoStreetDone: false, photoRuralDone: false,
    barberDay: 0, marketCharmDay: 0, marketCharmUsed: 0,
    clockDay: 0, clockWins: 0, tailorQuest: false, tailorDone: false,
    comicCornerDone: false, snackNestDone: false, runSlopeDone: false, singBridgeDone: false,
    pengFieldDone: false, momoCornerDone: false, duckPondDay: 0, windmillDay: 0,
    oldHouseHint: false, oldHouseDone: false,
    dogLove: 0, dogDay: 0,
    club: '', clubLv: 0, clubWeek: 0,
    arenaBest: 0, tourneyWeek: 0,
    recipes: {}, graduated: false, endingType: '', ngplus: false,
    items: {}, col: {},
    badges: { math: false, chinese: false, science: false, english: false },
    // —— 体验收束（一）：系统开张导览（一天只开张一家） / 结算单每日快照 ——
    tour: {}, daySnap: null,
    // —— P-B 期（剧情与游戏性二期） ——
    dawnAltar: false,                                  // 四季花园晨曦祭坛已唤醒（圣物伏笔回收）
    lufeiChain: 0, rainChain: 0, recordChain: 0,       // 微剧情二号线进度（0 未开始 1-2 中段 3 完成）
    ngMeet: {},                                        // NG+ 重逢过场登记（每人一次）
    rushBest: 0, rushDay: 0,                           // 挑战榜连战最远纪录 / 今日是否已连战
    // —— 驯兽三期 + 周末补全 ——
    bugKing: false, bugCupDay: 0,                      // 斗虫大会冠军 / 参赛日
    contestDay: 0, contestBest: 0,                     // 周日钓鱼大赛参赛日 / 最佳磅数
    // —— 星露谷分期 s5-s8 ——
    cow: false, cowLove: 0, milkReady: 0,              // 牛棚：入住 / 喂养好感 / 待挤奶数
    sheep: false, sheepLove: 0, woolReady: 0, woolTick: 0,  // 羊圈：入住 / 好感 / 待剪毛数 / 三日计
    helpPts: 0, helpDone: {},                          // 帮助板：累计完成数 / 当日完成登记
    fest: {},                                          // 节日联动：当日活动参与登记
    heartReady: {}, heartDone: {},                     // 心级事件：待触发 / 已触发
    buddyBoost: null                                   // 驯兽导师「进化催化」：随行伙伴力/速 +1
  });

  const state = {
    hero: 'hero_boy',
    busy: false,
    flags: blankFlags(),
    friends: {}          // npcId -> { love: 0..100, stage: 0..3 }
  };

  /* ==================== 题库 ====================
   * 每科 6 题，试炼时随机抽 3 题；最终试炼 8 题随机抽 6 题
   */
  const QUIZ = {
    math: [
      { q: '【第1题】7 × 8 = ?', opts: ['54', '64', '56'], a: 2 },
      { q: '【第2题】三角形的内角和是多少度？', opts: ['180°', '90°', '360°'], a: 0 },
      { q: '【第3题】计算：2 + 2 × 2 = ?', opts: ['8', '4', '6'], a: 2 },
      { q: '【第4题】1 小时等于多少分钟？', opts: ['30 分钟', '60 分钟', '100 分钟'], a: 1 },
      { q: '【第5题】最小的质数是？', opts: ['0', '1', '2'], a: 2 },
      { q: '【第6题】圆的周长大约是直径的多少倍？', opts: ['3 倍多（π 倍）', '2 倍', '5 倍'], a: 0 }
    ],
    chinese: [
      { q: '【第1题】"床前明月光"的下一句是？', opts: ['低头思故乡', '疑是地上霜', '举头望明月'], a: 1 },
      { q: '【第2题】《西游记》的作者是谁？', opts: ['吴承恩', '曹雪芹', '罗贯中'], a: 0 },
      { q: '【第3题】"欲穷千里目"的下一句是？', opts: ['一览众山小', '白云深处有人家', '更上一层楼'], a: 2 },
      { q: '【第4题】"春眠不觉晓"的下一句是？', opts: ['花落知多少', '处处闻啼鸟', '夜来风雨声'], a: 1 },
      { q: '【第5题】"谁知盘中餐"的下一句是？', opts: ['粒粒皆辛苦', '汗滴禾下土', '更上一层楼'], a: 0 },
      { q: '【第6题】《水浒传》的作者是谁？', opts: ['施耐庵', '罗贯中', '吴承恩'], a: 0 }
    ],
    science: [
      { q: '【第1题】水的化学式是什么？', opts: ['CO₂', 'H₂O', 'O₂'], a: 1 },
      { q: '【第2题】植物进行光合作用时，吸收的气体是？', opts: ['氧气', '氮气', '二氧化碳'], a: 2 },
      { q: '【第3题】彩虹通常被描述为几种颜色？', opts: ['5 种', '7 种', '9 种'], a: 1 },
      { q: '【第4题】太阳系中最大的行星是？', opts: ['地球', '木星', '土星'], a: 1 },
      { q: '【第5题】人体最大的器官是？', opts: ['心脏', '皮肤', '肝脏'], a: 1 },
      { q: '【第6题】磁铁相同的两极靠近时，会怎样？', opts: ['相互吸引', '相互排斥', '没有反应'], a: 1 }
    ],
    english: [
      { q: '【第1题】"apple" 的意思是？', opts: ['苹果', '椅子', '书本'], a: 0 },
      { q: '【第2题】英文字母一共有多少个？', opts: ['24 个', '25 个', '26 个'], a: 2 },
      { q: '【第3题】"How are you?" 的合适回答是？', opts: ["I'm fine, thank you.", 'My name is Tom.', 'Goodbye!'], a: 0 },
      { q: '【第4题】"红色"的英文单词是？', opts: ['blue', 'red', 'green'], a: 1 },
      { q: '【第5题】"我是一名学生"应该怎么说？', opts: ['I am a student.', 'I is a student.', 'I are a student.'], a: 0 },
      { q: '【第6题】"book" 的复数形式是？', opts: ['bookes', 'book', 'books'], a: 2 },
      { q: '【第7题】"cat" 的意思是？', opts: ['狗', '猫', '鸟'], a: 1 },
      { q: '【第8题】"Good morning" 的意思是？', opts: ['晚上好', '下午好', '早上好'], a: 2 },
      { q: '【第9题】"三个"用英语说是？', opts: ['tree', 'three', 'third'], a: 1 },
      { q: '【第10题】"Thank you" 的意思是？', opts: ['谢谢你', '对不起', '没关系'], a: 0 },
      { q: '【第11题】"dog" 的复数形式是？', opts: ['doges', 'dogses', 'dogs'], a: 2 },
      { q: '【第12题】"再见"用英语怎么说？', opts: ['Hello', 'Goodbye', 'Please'], a: 1 }
    ],
    final: [
      { q: '【最终试炼】一年大约有多少天？', opts: ['365 天', '300 天', '400 天'], a: 0 },
      { q: '【最终试炼】《静夜思》的作者是谁？', opts: ['杜甫', '白居易', '李白'], a: 2 },
      { q: '【最终试炼】声音在哪种介质中传播最快？', opts: ['空气', '钢铁', '水'], a: 1 },
      { q: '【最终试炼】9 × 6 = ?', opts: ['54', '56', '45'], a: 0 },
      { q: '【最终试炼】地球上最大的海洋是？', opts: ['大西洋', '印度洋', '太平洋'], a: 2 },
      { q: '【最终试炼】"谢谢"用英语怎么说？', opts: ['Sorry', 'Thank you', 'Hello'], a: 1 },
      { q: '【最终试炼】太阳从哪个方向升起？', opts: ['东方', '西方', '北方'], a: 0 },
      { q: '【最终试炼】最小的质数是？', opts: ['0', '1', '2'], a: 2 }
    ]
  };

  /* ==================== 剧本辅助 ==================== */
  const UI = () => ADV.UI;
  const say = o => UI().say(o);
  // 工具热键栏快捷执行：quickPick 非空时，脚本里的 choose 直接返回该索引（跳过菜单）。
  // 手部槽位（0）时恒为 null，交互走原菜单——冒烟测试与老习惯完全不受影响。
  let quickPick = null;
  const choose = (opts, opt) => {
    if (quickPick != null) { const v = quickPick; quickPick = null; return Promise.resolve(v); }
    return UI().choose(opts, opt);
  };
  const E = () => ADV.Engine;
  const F = () => state.flags;

  /* ==================== 工具热键栏（星露谷式 10 格） ==================== */
  // 槽位 0 = 手部（空手，走菜单）；1-9 对应数字键 1-9，0 键切回手部
  const HOTBAR_SLOTS = [null, 'hoe', 'wateringCan', 'scythe', 'pickaxe', 'axe', 'shovel', 'fishingRod', 'bugNet', 'basket'];
  function hotbarCur() { return state.flags.hotbarIdx || 0; }
  function hotbarSelect(i) {
    i = i | 0;
    if (i < 0 || i >= HOTBAR_SLOTS.length) i = 0;
    state.flags.hotbarIdx = i;
    save();
    return i;
  }
  // 地块当前状态（未开垦时按荒草算）
  function plotOf(o) {
    if (!o || o.kind !== 'plot') return null;
    const fm = state.flags.farm;
    return (fm && fm[o.pid]) || { st: 0, wd: 0, crop: '' };
  }
  // 工具与目标匹配表：匹配且已持有时，Z 键跳过菜单直接执行第一项
  const HOTBAR_MATCH = {
    hoe:         o => { const p = plotOf(o); return !!p && p.st === 0; },                                   // 荒草 → 翻土
    wateringCan: o => { const p = plotOf(o); return !!p && p.st >= 1 && p.st < 3 && !!p.crop && p.wd !== ADV.Cal.day; },   // 作物未浇 → 浇水
    scythe:      () => false,                                 // 预留：杂草丛（农场扩容）
    pickaxe:     o => o.kind === 'ore',                       // 矿脉 → 敲矿
    axe:         () => false,                                 // 预留：枯木（农场扩容）
    shovel:      () => false,                                 // 挖宝本就直达，无需加速
    fishingRod:  o => o.kind === 'fishSpot',
    bugNet:      o => o.kind === 'buzz',                      // 虫鸣草丛 → 挥网
    basket:      o => o.kind === 'critter'                    // 窝点 → 下笼
  };
  function hotbarToolMatch(tool, o) {
    if (!tool || !o) return false;
    if (!ADV.Collect || !ADV.Collect.count(tool)) return false;   // 未持有 → 不快捷执行
    const fn = HOTBAR_MATCH[tool];
    try { return !!(fn && fn(o)); } catch (e) { return false; }
  }

  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(([, v]) => v);
  // 确定性洗牌（每日作业用：同一题目种子 → 同一天题目固定，跨天轮换不重复感）
  function seededShuffle(a, seed) {
    let s = (seed | 0) % 2147483647;
    if (s <= 0) s += 2147483646;
    const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
    return a.map(v => [rnd(), v]).sort((x, y) => x[0] - y[0]).map(([, v]) => v);
  }

  // 金币与宝藏图
  function addGold(n) {
    state.flags.gold = (state.flags.gold || 0) + n;
    UI().toast(` 金币 +${n}（现有 ${state.flags.gold}） `);
    save();
  }
  function gainPiece() {
    const f = state.flags;
    f.mapPieces = (f.mapPieces || 0) + 1;
    if (f.mapPieces >= 3 && !f.caveOpen) {
      f.caveOpen = true;
      ADV.Audio.sfx('open');
      UI().toast(' 东郊的岩壁轰然洞开——藏宝洞窟开启了！ ');
    } else {
      UI().toast(` 宝藏图碎片 ${f.mapPieces} / 3 `);
    }
    save();
  }

  /* ==================== 友谊系统 ====================
   * 每位 NPC：好感 0~100，厌恶事件会扣分；
   * 好感达到 15 / 40 / 70 依次解锁三段专属故事（下次对话时娓娓道来），
   * 讲完第三段会收到 TA 的礼物。F 键打开友谊手册查看进度。
   */
  const BOND = {
    principal: { name: '校长', stages: [
      { need: 15, text: '【校长的心事】\n「其实我年轻时也挑战过石门——\n差一枚科学徽章，唉，怕化学啊。」\n他自嘲地笑了笑。' },
      { need: 40, text: '【晨曦女士】\n「建校的晨曦女士是我老师。\n她常说：校园的白天属于知识，\n夜晚属于奇迹。」' },
      { need: 70, text: '【传承】\n校长把一枚旧校徽放进你手心：\n「她若见到你，一定会骄傲的。」', gift: ['gold', 30] }] },
    xiaoming: { name: '小明', stages: [
      { need: 15, text: '【漫画梦】\n「我以后要当漫画家！\n《冒险王》的作者就是我的偶像！」' },
      { need: 40, text: '【早餐店】\n「我家开早餐店，我每天五点起床帮忙，\n所以上课总犯困……嘿嘿。」' },
      { need: 70, text: '【主角是你】\n小明神神秘秘掏出画本——\n新漫画的主角，是你！\n「书名就叫《校园大冒险》！」', gift: ['gold', 20] }] },
    xiaohong: { name: '小红', stages: [
      { need: 15, text: '【奔跑的理由】\n「妈妈身体不好，医生说要多运动。\n我带着她那份一起跑。」' },
      { need: 40, text: '【两难】\n「体育老师说我是跑步的料，\n可我更想靠成绩考进好学校。」' },
      { need: 70, text: '【幸运发绳】\n她解下一根发绳塞给你：\n「戴着它，你就是跑得最快的人！」', gift: ['cup', 5] }] },
    xiaogang: { name: '小刚', stages: [
      { need: 15, text: '【哥哥】\n「我哥样样比我强……\n所以我才什么都想争第一！」' },
      { need: 40, text: '【秘密】\n「别告诉别人——其实我会拉小提琴，\n赵老师夸我有天分呢。」' },
      { need: 70, text: '【小夜曲】\n小刚别扭地递来一张琴谱：\n「给你写的……曲名叫《第一名的朋友》。」', gift: ['cup', 5] }] },
    xiaopang: { name: '小胖', stages: [
      { need: 15, text: '【舌头】\n「我的舌头超厉害！\n食堂菜谱我一口就能尝出做法！」' },
      { need: 40, text: '【美食家】\n「我想当美食家，给全城写食评，\n第一篇就从咱食堂开始！」' },
      { need: 70, text: '【独家小灶】\n小胖从书包里端出一盒点心：\n「跟阿姨学的，只给你留！」', gift: ['gold', 20] }] },
    aunt: { name: '食堂阿姨', stages: [
      { need: 15, text: '【面包秘方】\n「芝麻面包的秘方？嘿嘿，\n芝麻要烤两遍才香！」' },
      { need: 40, text: '【远航】\n「阿姨年轻时可是远洋货轮的大厨，\n风浪里颠勺，稳得很！」' },
      { need: 70, text: '【菜谱】\n她递来一本手抄菜谱：\n「第一页写着你的名字。\n想家的时候，就做顿热乎的。」', gift: ['gold', 25] }] },
    cat: { name: '小猫', stages: [
      { need: 15, text: '【耳缺】\n它歪着头让你看左耳的缺口，\n又立刻装作若无其事舔毛。\n（好像有一段威风的往事）' },
      { need: 40, text: '【听得懂】\n「喵。」（你突然有种感觉——\n它完全听得懂你在说什么）' },
      { need: 70, text: '【引路】\n它轻轻咬住你的裤脚，\n往喷泉的方向拽了拽。\n（它想给你看点什么……）', gift: ['cup', 3] }] },
    keeper: { name: '神秘老人', stages: [
      { need: 15, text: '【年轻的冒险】\n「一百年前？不，守门是一百年，\n冒险是更早以前的事咯。」' },
      { need: 40, text: '【约定】\n「我与晨曦女士约定守此门。\n她把星光留给孙女，把门留给我。」' },
      { need: 70, text: '【星之家族】\n「等一切都结束，告诉你个秘密——\n月光学院的首任守门人，也是我。」', gift: ['cup', 8] }] },
    star: { name: '星儿', stages: [
      { need: 15, text: '【会说话的星星】\n「庭园的星星会说话哦，\n只是它们声音很小很小。」' },
      { need: 40, text: '【愿望】\n「我想去人类的学校上学，\n交很多朋友，考试，罚站，都好。」' },
      { need: 70, text: '【星砂】\n她摊开手心，一撮发光的星砂：\n「这是我能送出的、最亮的东西了。」', gift: ['cup', 8] }] },
    miner: { name: '老矿工', stages: [
      { need: 15, text: '【手绘地图】\n「洞窟那张地图是我画的，\n年轻时的笔头，利索着呢！」' },
      { need: 40, text: '【找的不是金子】\n「别人以为我寻宝为金子。\n其实我找一张老照片，掉在深处了。」' },
      { need: 70, text: '【矿灯】\n「照片早找到啦，是我和晨曦女士的合影。\n这盏矿灯送你——照亮你自己的路。」', gift: ['gold', 25] }] },
    teacherLiu: { name: '刘老师', stages: [
      { need: 15, text: '【省队】\n「我？省队主力控卫！\n一场能砍四十分！」' },
      { need: 40, text: '【伤退】\n「膝盖废了那年，哭过一整晚。\n后来想通了——投篮的手，还能执教鞭。」' },
      { need: 70, text: '【必进球姿势】\n他扶着你的手肘调了半寸：\n「记住这个角度，必进。」', gift: ['cup', 5] }] },
    teacherZhao: { name: '赵老师', stages: [
      { need: 15, text: '【舞台】\n「我登过金色的舞台，\n聚光灯下，琴声像会发光。」' },
      { need: 40, text: '【幕布之后】\n「可我最怕的也是舞台。\n是音乐教室的孩子们，把我拉了回来。」' },
      { need: 70, text: '【四手联弹】\n「下学期音乐会，我们四手联弹？\n就我们俩。」', gift: ['cup', 5] }] },
    teacherMath: { name: '王老师', stages: [
      { need: 15, text: '【竞赛之夜】\n「小时候数学竞赛，我紧张到写错名字。\n从此我懂了——心态也是实力。」' },
      { need: 40, text: '【一题多解】\n「数学最美的不是答案，\n是通往答案的一百条路。」' },
      { need: 70, text: '【错题本】\n他送你一本崭新的错题本：\n「把跌倒的地方，变成台阶。」', gift: ['cup', 5] }] },
    teacherCn: { name: '李老师', stages: [
      { need: 15, text: '【书架的秘密】\n「图书馆每一个书架的位置，\n我都闭着眼画得出来。」' },
      { need: 40, text: '【最爱的一本】\n「《城南旧事》。英子的骆驼铃一响，\n我就回到十二岁。」' },
      { need: 70, text: '【批注】\n她在你的书页边写下蝇头小楷：\n「愿你出走半生，归来仍有诗。」', gift: ['cup', 5] }] },
    teacherSci: { name: '陈老师', stages: [
      { need: 15, text: '【第一次实验】\n「我第一次做实验，烧穿了三张桌子。\n老师说我有『热情』。」' },
      { need: 40, text: '【白大褂】\n「穿白大褂不是为了帅——\n是为了提醒自己：敬畏每一次称量。」\n他从培养皿旁抓来一小包种子：\n「月光草，我培育的稀罕玩意。\n夜里会发光——种下去试试？」', gift: [['item', 'moonSeed', 3]] },
      { need: 70, text: '【放大镜】\n他送你一枚黄铜放大镜：\n「去看看世界藏起来的细节。」', gift: ['cup', 5] }] },
    teacherEn: { name: '吴老师', stages: [
      { need: 15, text: '【留学趣事】\n「我留学时把『chicken』说成『kitchen』，\n房东笑了整整一学期。」' },
      { need: 40, text: '【口音】\n「别怕口音！语言是桥，不是考试。\n敢说的人先过河。」' },
      { need: 70, text: '【英文书】\n她送你一本《The Little Prince》：\n「读完它，你的英语就毕业了。」', gift: ['cup', 5] }] },
    studentLib: { name: '图书馆学生', stages: [
      { need: 15, text: '【小王子】\n「真正重要的东西，\n用眼睛是看不见的。」他轻声念。' },
      { need: 40, text: '【书山】\n「我一年读一百二十本书。\n每本都记在这本小册子里。」' },
      { need: 70, text: '【荐书】\n他在你手心写下一个书名：\n「下下雨天，就读它。」', gift: ['cup', 3] }] },
    studentClass: { name: '教室同学', stages: [
      { need: 15, text: '【瞌睡虫】\n「我不是故意睡的！\n是数学太催眠了……」' },
      { need: 40, text: '【及格万岁】\n「我数学常年六十一分，\n多一分浪费，少一分遭殃。」' },
      { need: 70, text: '【笔记】\n他递来工整的错题本：\n「我整理的，借你抄！」', gift: ['cup', 3] }] },
    studentCanteen: { name: '食堂同学', stages: [
      { need: 15, text: '【干饭哲学】\n「干饭不积极，思想有问题！」' },
      { need: 40, text: '【菜谱排名】\n「糖醋排骨第一！红烧肉第二！\n这是美食界的公理。」' },
      { need: 70, text: '【占座】\n「以后中午，我给你占座！」', gift: ['gold', 10] }] },
    studentEn: { name: '英语课代表', stages: [
      { need: 15, text: '【口音】\n「My English 好 to listen 吧？\n中英混搭，才叫 international！」' },
      { need: 40, text: '【单词卡片】\n「我做了三百张单词卡，\n你要考哪张随便抽！」' },
      { need: 70, text: '【 penfriend 】\n「我有个伦敦笔友！\n他问我要了中国邮票……」', gift: ['cup', 3] }] },
    studentGym: { name: '体育馆同学', stages: [
      { need: 15, text: '【三分雨】\n「刘老师说我三分有天分，\n就是天分它今天老下雨。」' },
      { need: 40, text: '【偶像】\n「刘老师年轻时一場四十分！\n我要是有一半就够了。」' },
      { need: 70, text: '【传接】\n「以后咱俩组队打二对二，\n队名就叫『阳光双枪』！」', gift: ['cup', 3] }] },
    studentMusic: { name: '音乐教室同学', stages: [
      { need: 15, text: '【练习曲】\n「我每天练琴两小时，\n手指头疼，心里不疼。」' },
      { need: 40, text: '【胆小】\n「我在人前弹琴会抖……\n所以总等没人的时候来。」' },
      { need: 70, text: '【听众】\n「下次我练新曲子，\n你能来当第一个听众吗？」', gift: ['cup', 3] }] },
    yuejian: { name: '月见校长', stages: [
      { need: 15, text: '【月光学院】\n「一百年里，只有少数孩子\n推开过那道水帘。」' },
      { need: 40, text: '【宝石的真相】\n「晨曦宝石不是宝物，是契约——\n它记住每个为别人点灯的人。」' },
      { need: 70, text: '【传人】\n「我守了一辈子秘。\n现在，轮到你们守护它了。」\n他从袖中取出两枚花瓣，七种颜色\n在指间缓缓流转：「四季的守护灵\n托我谢你——拿去，山里那位会懂的。」', gift: [['cup', 10], ['item', 'sevenFlower', 2]] }] },
    jinpeng: { name: '金鹏', stages: [
      { need: 15, text: '【家规】\n「金家的继承人不需要朋友——\n需要胜利。」他别过脸去。' },
      { need: 40, text: '【羡慕】\n「你摔倒了有人扶，答错了有人帮……\n我摔倒了，只有家教在计时。」' },
      { need: 70, text: '【道歉】\n他站得笔直，耳根通红：\n「之前……多有得罪。\n骑士金鹏，愿为你执缰。」', gift: ['cup', 8] }] },
    momo: { name: '墨墨', stages: [
      { need: 15, text: '【八百度】\n「我近视八百度。\n但化学式，我看得比谁都清楚。」' },
      { need: 40, text: '【鼻子】\n「我能闻出试剂的纯度，\n老师说我这鼻子是稀有器材。」' },
      { need: 70, text: '【友谊药剂】\n她递来一瓶淡紫色的药剂：\n「喝了它，吵架的人会和好。\n——我们用不着，对吧？」', gift: ['gold', 15] }] },
    owl: { name: '团子', stages: [
      { need: 15, text: '【航线】\n「咕。」（它骄傲地拍拍翅膀——\n它的送信航线横跨整个校园）' },
      { need: 40, text: '【怕黑】\n「咕呜……」（它把脸埋进翅膀。\n原来猫头鹰团子，居然怕黑）' },
      { need: 70, text: '【夜航勋章】\n它叼来一枚羽毛勋章：\n为了你，它敢在深夜飞行了。', gift: ['cup', 3] }] },
    grey: { name: '灰先生', stages: [
      { need: 15, text: '【擦书】\n他总在擦同一排书架：\n「灰是擦不完的，可总得有人擦。」' },
      { need: 40, text: '【她的图书馆】\n「亡妻生前是这里的管理员。\n她走后，我就再没离开过书架。」' },
      { need: 70, text: '【晨光】\n「谢谢你。那一晚之后，\n我第一次在书里看见了晨光。」', gift: ['cup', 8] }] },
    lufei: { name: '陆飞', stages: [
      { need: 15, text: '【十圈是热身】\n「十圈？那是我热身的量。\n风吹过耳朵的时候，全世界都是我的！」' },
      { need: 40, text: '【跑鞋】\n「这双鞋陪我跑了三千公里。\n鞋底磨平了，路却越跑越长。」' },
      { need: 70, text: '【终点线】\n他把自己磨旧的号码布递给你：\n「等我跑进省队那天——\n你来给我挂奖牌，好不好？」', gift: ['gold', 20] }] },
    linxiaoyu: { name: '林小雨', stages: [
      { need: 15, text: '【新同学】\n「我、我叫林小雨……\n从山那边的学校转来的。\n（她攥着衣角，声音越来越小）」' },
      { need: 40, text: '【雨天的伞】\n「转学那天一直下雨，\n是教室的读书角让我安下心来……\n书里的人都好勇敢。」' },
      { need: 70, text: '【小小的勇气】\n她把一枚枫叶书签放进你手心，\n耳朵红红的：\n「谢谢你……总是先跟我打招呼。」', gift: ['cup', 5] }] }
  };

  const STAGE_NAMES = ['初识', '相识', '知己', '挚友'];

  function friend(id) {
    const seed = { love: 0, stage: 0, talkDay: -1, talkCount: 0, talkTotal: 0 };
    const f = state.friends[id] || (state.friends[id] = { ...seed });
    for (const k in seed) if (f[k] === undefined) f[k] = seed[k];
    return f;
  }
  // 好感增减（厌恶事件传负数）
  function gainBond(id, d) {
    const b = BOND[id];
    if (!b || !d) return;
    const f = friend(id);
    f.love = Math.max(0, Math.min(100, f.love + d));
    const icon = d >= 0 ? '♥' : '♡';
    UI().toast(` ${icon} ${b.name} 好感 ${d >= 0 ? '+' : ''}${d}（${f.love}）`);
    const next = b.stages[f.stage];
    if (next && f.love >= next.need) UI().toast(` ✦ 与${b.name}的故事翻开了新的一页 `);
    save();
  }
  // 日常闲聊的好感更克制：每天第一次有效，初识阶段 +2，后续改为 +1。
  function chatBondDelta(id) {
    const f = friend(id);
    const day = ADV.Cal ? ADV.Cal.day : 0;
    if (f.talkDay !== day) {
      f.talkDay = day;
      f.talkCount = 0;
    }
const cap = ADV.Skills ? ADV.Skills.chatCap() : 1;    // 社交技能：每日聊天上限 1→2
if (f.talkCount >= cap) return 0;
const first = f.talkCount === 0;
f.talkCount += 1;
f.talkTotal += 1;
if (!first) return 1;                                  // 第二聊固定 +1（好感不通胀）
if (ADV.Skills) ADV.Skills.add('social', 2, '闲聊');
return (f.stage === 0 ? 2 : 1) + (ADV.Skills ? ADV.Skills.chatBonus() : 0);   // 社交技能：首聊额外 +1
  }
  // 故事演出：对话开头自动娓娓道来（可连跨多段）
  async function storyBeat(id) {
    const b = BOND[id];
    if (!b) return;
    const f = friend(id);
    while (f.stage < b.stages.length && f.love >= b.stages[f.stage].need) {
      await say({ name: b.name, text: b.stages[f.stage].text });
      f.stage += 1;
      const gift = b.stages[f.stage - 1].gift;
      if (gift) {
        for (const g of (Array.isArray(gift[0]) ? gift : [gift])) {
          if (g[0] === 'gold') { state.flags.gold = (state.flags.gold || 0) + g[1]; UI().toast(` 💰 获得礼物：金币 +${g[1]} `); }
          else if (g[0] === 'item') { const n = g[2] || 1; ADV.Collect.addItem(g[1], n); UI().toast(` 🎁 获得礼物：${ADV.Collect.itemInfo(g[1]).name} ×${n} `); }
          else { state.flags.cup = (state.flags.cup || 0) + g[1]; UI().toast(` 🏆 学院分 +${g[1]} `); }
        }
        save();
      }
    }
  }
  // 挚友满阶日常：通用台词池（BOND[k].mate 可选专属池覆盖，按日期轮换，确定性）
  const MATE_LINES = [
    '又见面啦。总觉得，有你在的校园，\n连走廊都亮堂了一些。',
    '喏，听说……算了，\n等你也成为「老同学」那天再讲给你听。',
    '今天风不错。\n要是哪天毕了业，可别忘了这会儿。',
    '我把最想去的三个地方写在纸条上——\n第一张就是你我都去过的那个地方。',
    '别人问我们怎么这么熟？\n「一起翻过后山墙的交情」，我这么说。',
    '毕业册第一页我想好了：\n就画你刚入学那天的样子，傻乎乎的。'
  ];
  // 对话包装：生日祝福 → 挚友日常 → 故事 → 原脚本 → 日常闲聊好感（每天首次有效）
  function bondify(ids) {
    for (const k of ids) {
      const fn = S[k];
      if (!fn) continue;
      S[k] = async ent => {
        // 生日祝福：当天第一次对话送出专属台词（好感 +5，送礼双倍另算）
        const bf = friend(k), BC = ADV.Cal;
        if (BOND[k] && BOND_META[k] && BOND_META[k].bday === BC.day && bf.bdayTalkDay !== BC.day) {
          bf.bdayTalkDay = BC.day;
          ADV.Audio.sfx('emote');
          await say({ name: BOND[k].name, text: `今天……居然是我的生日，\n你是第一个来祝贺的人！\n（收到你的祝福，比什么礼物都开心）` });
          gainBond(k, 5);
          save();
        }
        // 挚友满阶日常：stage3 后每天第一次见面有专属台词；每 3 天塞一份小谢礼（确定性轮换）
        if (BOND[k] && bf.stage >= 3 && bf.mateDay !== BC.day) {
          bf.mateDay = BC.day;
          const pool = BOND[k].mate || MATE_LINES;
          await say({ name: BOND[k].name, text: pool[BC.day % pool.length] });
          if (BC.day % 3 === 0) {
            const g = 4 + (BC.day % 5);
            state.flags.gold = (state.flags.gold || 0) + g;
            UI().toast(` 💰 ${BOND[k].name}硬塞给你一份小心意：+${g} `);
            save();
          }
        }
        // 猫的礼物：满阶后每天首次对话判定一次，40% 概率从墙缝叼来稀有小物（giftDay 登记防重入）
        if (k === 'cat' && bf.stage >= 3 && bf.giftDay !== BC.day) {
          bf.giftDay = BC.day;
          if (Math.random() < .4) {
            const pool = ['fish', 'ancientCoin', 'moonCrystal'];
            const id = pool[(Math.random() * pool.length) | 0];
            ADV.Collect.addItem(id, 1);
            ADV.Audio.sfx('emote');
            await say({ name: '小猫', text: `喵呜！（它钻进墙缝一阵刨挖，\n叼出来一样亮晶晶的东西——\n获得「${ADV.Collect.itemInfo(id).name}」×1）` });
            save();
          }
        }
        await storyBeat(k);
        await fn(ent);
        gainBond(k, chatBondDelta(k));
      };
    }
  }

  // 单题闯关：问题与选项同屏显示，答错给提示再答，直到答对
  async function ask(teacherName, item, wrongs, npc, subject) {
    const P = () => E().player;
    const order = shuffle(item.opts.map((_, i) => i));               // 选项洗牌：正确项位置随机
    const q2 = { q: item.q, opts: order.map(i => item.opts[i]), a: order.indexOf(item.a) };
    while (true) {
      const i = await choose(q2.opts, { cancelIndex: -1, caption: { name: teacherName, text: item.q } });
      if (ADV.Mistake) ADV.Mistake.answer(subject || '综合', q2, i);   // 学习闭环：统计+错题入本
      if (i === q2.a) {
        ADV.Audio.sfx('correct');
        E().playAction(P(), 'laugh', 1.0);                       // 玩家开心欢呼
        await say({ name: teacherName, text: ['完全正确！', '漂亮，答对了！', '太棒了，就是这样！'][(Math.random() * 3) | 0] });
        return;
      }
      wrongs.n++;
      ADV.Audio.sfx('wrong');
      E().playAction(P(), 'sad', 1.2);                           // 玩家委屈抹泪
      E().playAction(npc, 'doubt', 1.2);                         // 老师扶额困惑
      await say({ name: teacherName, text: ['嗯……再仔细想一想！', '差一点点，别灰心！', '提示：相信你的第一直觉～'][(Math.random() * 3) | 0] });
    }
  }

  // 固定谜题洗牌：仅打乱选项顺序并同步正确项下标（题面不变）
  const mixQ = r => { const order = shuffle(r.opts.map((_, i) => i)); return { opts: order.map(i => r.opts[i]), a: order.indexOf(r.a) }; };

  // 学科试炼通用流程
  async function trial(opts) {
    const { teacher, intro, subject, badge, gemColor } = opts;
    const npc = opts.npcId ? E().getNpc(opts.npcId) : null;
    if (F().finalPassed) { await say({ name: teacher, text: opts.after || '你的传说我已经听说了。继续向前吧，孩子！' }); return; }
    if (F().badges[subject]) {
      /* —— 每日作业：徽章在手也能天天来练。
       * 题目按日期种子轮换（同一天固定、跨天不同），全对奖励轮换：
       * 课外书 → 昆虫图册 → 小动物图册，另加金币与学院分。 —— */
      const day = ADV.Cal.day;
      F().homeworkDay = F().homeworkDay || {};
      if (F().homeworkDay[subject] === day) {
        await say({ name: teacher, text: opts.hwDone || '今天的作业已经完成得很漂亮，回去好好休息吧，明天再来！' });
        return;
      }
      E().playAction(npc, 'read', 1.6);
      await say({ name: teacher, text: opts.hw || '徽章已经是你的了，但学问是一天天练出来的。\n今天也留了三道作业题，全对有奖励哦！' });
      const go = await choose(['做今日作业！', '今天先告辞……'], { caption: { name: teacher, text: '怎么样，来练练手？' } });
      if (go === 1) { await say({ name: teacher, text: '好吧，功课可别落下太久哦。' }); return; }
      const wrongs = { n: 0 };
      const qs = seededShuffle(QUIZ[subject], day * 31 + subject.length * 7 + subject.charCodeAt(0)).slice(0, 3);
      for (let i = 0; i < qs.length; i++) await ask(teacher, qs[i], wrongs, npc, subject);
      if (wrongs.n === 0) {
        F().homeworkDay[subject] = day;
        F().gold = (F().gold || 0) + 8;
        addCup(1);
        // 奖励按日期轮换：书 → 昆虫图册 → 小动物图册
        const kind = day % 3;
        if (kind === 0 && ADV.Books && ADV.Books.LIST.length) {
          const unread = ADV.Books.LIST.filter(b => !(ADV.Collect.has('books', b.id)));
          const pool = unread.length ? unread : ADV.Books.LIST;
          const pick = pool[day % pool.length];
          ADV.Collect.gain('books', pick.id);                    // 首次入藏自动提示，集齐一类另有大奖
          await UI().itemGet('作业奖励·' + pick.name, '#8fd0ff');
        } else {
          const itemId = kind === 2 ? 'albumCritter' : 'albumBug';
          ADV.Collect.addItem(itemId);
          const it = ADV.Collect.itemInfo(itemId);
          await UI().itemGet('作业奖励·' + it.name, kind === 2 ? '#a8e063' : '#c8f078');
        }
        E().playAction(npc, 'laugh', 1.4);
        await say({ name: teacher, text: opts.hwGreat || '全对！功课做得漂亮，这份奖励拿好。\n金币 +8 · 学院分 +1，明天还有新题目！' });
        logEvent(`完成了${teacher}布置的今日作业`);
        save();
      } else {
        await say({ name: teacher, text: `错了 ${wrongs.n} 次。没关系，功课就是越练越熟的，明天再来挑战吧！` });
      }
      return;
    }

    E().playAction(npc, 'read', 1.6);                            // 老师翻着讲义
    await say({ name: teacher, text: intro[0] });
    await say({ name: teacher, text: intro[1] });
    // 难度分级：普通 / 困难（困难双倍学院分，AI 出难题）
    const hard = (await choose(['普通难度', '困难模式（学院分 ×2）'], { caption: { name: teacher, text: '选择试炼难度：' } })) === 1;
    const go = await choose(['接受试炼！', '我再准备一下……'], { caption: { name: teacher, text: '怎么样，你准备好了吗？' } });
    if (go === 1) { await say({ name: teacher, text: '好的，我随时在这里等你。' }); return; }

    const wrongs = { n: 0 };
    const qs = shuffle(QUIZ[subject]).slice(0, 3);
    for (let i = 0; i < qs.length; i++) {
      let item = qs[i];
      // 第二题由大模型现场出（断网自动回退题库）
      if (i === 1 && window.ADV && ADV.AI && ADV.AI.available()) {
        const ai = await ADV.AI.question(subject, hard ? 'hard' : 'normal');
        if (ai && ai.q) item = { q: ai.q + (ai.ai ? ' ✦' : ''), opts: ai.opts, a: ai.a };
      }
      await ask(teacher, item, wrongs, npc, subject);
    }

    E().playAction(npc, 'laugh', 1.6);                           // 老师开怀大笑
    await say({
      name: teacher,
      text: wrongs.n === 0
        ? '三题全部一次答对！你是天生的学者！\n这枚徽章，你当之无愧！'
        : `虽然错了 ${wrongs.n} 次，但你坚持到了最后！\n这份不屈，正是求知的真谛！`
    });
    await UI().itemGet(badge + '徽章', gemColor);
    E().playAction(E().player, 'raise', 1.3);                    // 玩家高举徽章欢呼
    F().badges[subject] = true;
    F().badgeEver = F().badgeEver || { math: false, chinese: false, science: false, english: false };
    F().badgeEver[subject] = true;                               // 永久记录（石门主线不受每日重置影响）
    addGold(5);                                                  // 每日重新收集也有零花钱
    logEvent(`通过了${teacher}的试炼，拿到${badge}徽章`);
    gainBadge();
    await chapterMid(1);
  }

  function gainBadge() {
    const f = F();
    const b = f.badges;
    const n = (b.math ? 1 : 0) + (b.chinese ? 1 : 0) + (b.science ? 1 : 0) + (b.english ? 1 : 0);
    // 剧幕推进：两枚徽章 → 第二幕（乌云帮登场）
    if (n >= 2 && state.flags.act < 2) {
      state.flags.act = 2;
      UI().toast(' 第二幕·风起篇：听说天台来了三个新面孔…… ');
    }
    if (n >= 4 && state.flags.act < 4) state.flags.act = 4;
    // 石门主线：按"曾经拿到过"的永久记录判断（每日重置不影响剧情进度）
    const e = f.badgeEver || f.badges;
    if (e.math && e.chinese && e.science && e.english && !f.gateOpen) {
      UI().toast(' 远处的后山传来了石门开启的轰鸣…… ');
      ADV.Audio.sfx('open');
    }
    // 每日挑战：今天四枚全部收齐
    if (b.math && b.chinese && b.science && b.english && f.badgeBonusDay !== ADV.Cal.day) {
      f.badgeBonusDay = ADV.Cal.day;
      f.gold = (f.gold || 0) + 15;
      addCup(2);
      UI().toast(' ⭐ 今日四枚徽章全部收齐！金币 +15 · 学院分 +2 ');
    } else {
      UI().toast(' 已自动保存 ');
    }
    save();
  }

  /* ==================== 达人徽章（每日收集） ====================
   * 体育（体育馆赢挑战）/ 音乐（琴键记忆）/ 劳动（家里做家务）/ 阅读（读书摘抄）
   * 每天刷新，四枚集齐有额外奖励 */
  const TALENT_CN = { sports: '体育', music: '音乐', labor: '劳动', read: '阅读' };
  function grantTalent(k) {
    const f = F();
    f.talent = f.talent || { sports: false, music: false, labor: false, read: false };
    if (f.talent[k]) return;
    f.talent[k] = true;
    ADV.Audio.sfx('item');
    UI().toast(` 🎖 获得「${TALENT_CN[k]}达人徽章」！ `);
    const t = f.talent;
    if (t.sports && t.music && t.labor && t.read && f.talentBonusDay !== ADV.Cal.day) {
      f.talentBonusDay = ADV.Cal.day;
      f.gold = (f.gold || 0) + 10;
      addCup(1);
      UI().toast(' 🏅 今日达人徽章集齐！金币 +10 · 学院分 +1 ');
    }
    save();
  }

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
  S.teacherMath = ent => trial({
    teacher: '王老师', npcId: 'teacher_math',
    intro: ['同学你好，我是数学王老师。\n想要数学徽章？先通过我的试炼！',
            '三道题，答对才能获得徽章。\n深呼吸，我们开始吧！'],
    subject: 'math', badge: '数学', gemColor: '#5a8aff',
    again: '数学之美在于思考。徽章已是你的了，去帮助别的同学吧！'
  });

  S.teacherCn = ent => trial({
    teacher: '李老师', npcId: 'teacher_cn',
    intro: ['嘘——图书馆要安静。\n我是李老师，守着语文徽章的人。',
            '答对三道语文题，徽章便归于你。\n请开始你的背诵与赏析。'],
    subject: 'chinese', badge: '语文', gemColor: '#ff6a7a',
    again: '腹有诗书气自华。徽章已是你的了，多来读书哦。'
  });

  S.teacherSci = ent => trial({
    teacher: '陈老师', npcId: 'teacher_sci',
    intro: ['欢迎来到实验室！我是陈老师。\n科学徽章？哈哈，有胆量来试炼！',
            '观察、思考、验证——\n三道科学题，开始！'],
    subject: 'science', badge: '科学', gemColor: '#4ae86c',
    again: '保持好奇心！科学徽章已是你的了。'
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
    after: '你的冒险故事，用英语说就是——Amazing！\n继续向前吧，孩子！'
  });

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
        await say({ name: '蒲老师', text: `今天的作业：再收录一种新生物！\n（图鉴进度 ${caught()} / 42，收录后回来找我领奖励）` });
        return;
      }
      f.hwNat.taskDay = day;
      f.hwNat.base = caught();
      await say({ name: '蒲老师', text: `今日作业：收录一种新的生物到图鉴！\n（图鉴进度 ${caught()} / 42）\n对着虫鸣的草丛挥网、在水边下笼——\n完成后来找我，捉虫网、草编笼、鱼竿都可能送哦！` });
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
        await say({ name: '吴老师', text: '「成了——杖尖的星光，它也看得见了。\n以后宠物战的菜单里会多一项『支援』：\n星之盾、晨光治愈、缚影咒、月光弹，\n每场战斗各能支援一次。」' });
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
  S.topScope = async () => { await say({ text: '整片星空涌入镜筒——\n银河像一条发光的河，从天这头流到那头。' }); };
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
  // 请教影响出题难度
  const _examAskRaw = examAsk;

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
                   text: stage === 3 ? '它把下巴搁在你的鞋面上，\n尾巴摇成了小风扇。'
                       : stage === 2 ? '它绕着你的脚踝转圈，\n时不时抬头看你一眼。'
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
  // 渔获表：[鱼, 权重]；挂蚯蚓后稀有鱼权重翻倍
  const FISH_TABLE = [['f1', 26], ['f2', 18], ['f3', 14], ['f4', 12], ['f5', 10], ['f6', 8], ['f8', 8], ['f7', 3]];
  function rollFish(bait, rain) {
    const ex = ADV.Skills ? ADV.Skills.fishBoost() : 0;   // 知性/渔汛技能：稀有鱼权重再放大
    const boost = (bait ? 1 : 0) + (rain ? 1 : 0) + ex;
    const golden = ADV.Skills && ADV.Skills.goldenFish(); // 金鳞传说：金色鱼权重翻倍
    const table = FISH_TABLE.map(([id, w], i) => {
      let ww = i >= 4 ? w * (1 + boost) : w;
      if (id === 'f7' && golden) ww *= 2;
      return [id, ww];
    });
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
await say({ text: `浮漂一沉——就是现在！\n（今日第 ${slot.n}/${rodCap} 竿${bait ? ' · 挂着蚯蚓' : ''}${rainy ? ' · 雨天鱼正活跃' : ''}）` });
const win = await new Promise(res => ADV.Mini.start('fish', res, { easy: bait || rainy || !!(ADV.Skills && ADV.Skills.fishEasy()) }));
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
  const FISH_SCORE = { f1: 10, f2: 14, f3: 18, f4: 22, f5: 26, f6: 30, f8: 30, f7: 50 };
  S.fishContest = async () => {
    const f = F(), C = ADV.Cal;
    if (C.day % 7 !== 0) { await say({ text: '（河畔的石阶空荡荡的。\n【周日钓鱼大赛】只在周日白天开赛）' }); return; }
    if (C.period < 1 || C.period > 3) { await say({ text: '（大赛只在白天举行——\n清晨练竿，傍晚颁奖，现在不开赛）' }); return; }
    if (f.contestDay === C.day) { await say({ text: '（你今天已经比过了。\n裁判冲你举了举茶缸：「下周日再来！」）' }); return; }
    if (!ADV.Collect.count('fishingRod')) { await say({ name: '裁判', text: '想参赛？先有鱼竿——\n礼品店有售，报名免费。' }); return; }
    const i = await choose(['报名开赛！', '先看看热闹'], { caption: { name: '周日钓鱼大赛', text: '【每周日 · 河畔三竿赛】\n三竿之内，钓得的鱼按市价折成磅数——\n磅数 ≥60 夺冠，≥40 拿亚军！报名免费。' } });
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
      // 当季种子摊：种后院田地靠他进货（冬天休耕不卖）；s5 畜牧：小牛犊 / 小羊羔
      const seeds = seasonSeeds();
      const stock = [];
      if (seeds.length) stock.push('买点种子');
      if (!f.cow) stock.push('抱只小牛犊（💰120）');
      if (!f.sheep) stock.push('抱只小羊羔（💰100）');
      stock.push('请教种田门道');
      const pick = await choose(stock, {
        caption: { name: '田伯', text: seeds.length
          ? '后院的地翻好了？来，\n我这儿有当季的好种子——还有牲口。'
          : '冬天地要歇着，种子开春才卖。\n要抱只牲口回去养吗？' }
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
    let myHp = (startHp == null ? me.pow * 6 + 20 : startHp) + (SK ? SK.duelHp() : 0), foeHp = foe.pow * 6 + 20;
    const lines = [];
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
      const a = await choose(['买补给', '珍稀精灵架', '收购台', '驯兽讨教', '先逛逛'], { caption: { name: '阿橘',
        text: `欢迎光临精灵小筑～\n你的图鉴收录了 ${prog.got}/${prog.total} 种。\n口粮和宠物球，都是草丛探险的好帮手！` } });
      if (a === 0) { await shop(['critBall', 'goodBall', 'ultraBall', 'petFood', 'bait'], '精灵小筑 · 阿橘'); continue; }
      if (a === 1) {                                   // 珍稀精灵架：每日三格，隔天换货
        const shelf = CO.petShelf();
        if (!shelf.length) { await say({ name: '阿橘', text: '今天的好货都被人抱走啦，\n明天再来看看吧！' }); continue; }
        const opts = shelf.map(id => {
          const cr = CO.critter(id), e = CO.critterEntry(id);
          const tag = e ? (e.gone ? '（可接回家）' : '（已住你家）') : '';
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
          return `${h.cr.name}${h.shiny ? '✨' : ''}${f.buddy && f.buddy.id === h.id ? '（随行中）' : ''} → 💰${p}`;
        }).concat(['还是不卖了']);
        const i = await choose(opts, { caption: { name: '阿橘', text: '图鉴收录过的可以寄养到我这，\n按稀有度给收购价——异色翻三倍！' } });
        if (i < 0 || i >= held.length) continue;
        const h = held[i];
        const sure = await choose(['卖给阿橘', '再想想'], { caption: { name: '阿橘',
          text: `${h.cr.name}会找到好好待它的新主人。\n（图鉴收录保留，随时可以再来接回家）` } });
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
      return;
    }
  };

  /* —— 三期C 后山隐藏驯兽导师：山隐婆婆（扫地僧定位）。克制环出师后石屋的门才会开——
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
    await say({ text: `锅铲翻飞，香气出锅——\n《${r.name}》×1 入背包！（战斗大补 + 高级礼物）` });
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
    f.gold = (f.gold || 0) + 200;
    addCup(10);
    UI().toast(` 🎓 毕业结局达成【${f.endingType}】（之后可继续自由游玩 / NG+）`);
    await say({ text: '（标题画面新增「新的学期（NG+）」——\n带着友谊与图鉴，题目更难地再来一年！）' });
    save();
    return true;
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
      ['珍稀架收藏家', f.legendTrio, '集齐传说三只（月光凤蝶 · 锦鲤苗 · 山神小狐狸）'],
      ['早睡早起', f.graduated && ADV.Cal.sleepDebt === 0, '零睡眠债迎来毕业'],
      ['毕业快乐', f.graduated, '迎来毕业结局'],
      // —— P-B 期 / 驯兽三期 / s5-s8 成就 ——
      ['晨曦的祝福', f.dawnAltar, '唤醒四季花园的晨曦祭坛（圣物伏笔回收）'],
      ['心满益善', HEART_IDS.every(k => f.heartDone[k]), '听完六位挚友的心里话'],
      ['不败之壁', (f.rushBest || 0) >= 6, '挑战榜极限连战六连胜'],
      ['连战入门', (f.rushBest || 0) >= 3, '挑战榜极限连战三连胜'],
      ['斗虫大会冠军', f.bugKing, '斗虫大会三连胜夺杯'],
      ['钓鱼大赛冠军', (f.contestChamp || 0) >= 1, '周日钓鱼大赛夺魁'],
      ['牧场主', f.cow && f.sheep, '牛棚羊圈双全（挤奶与剪毛都上手）'],
      ['小镇之光', (f.helpPts || 0) >= 12, '帮助板声望 12：全镇的感谢都归你'],
      ['驯兽宗师', !!f.buddyBoost, '接受山隐婆婆的进化催化']
    ];
    return A.map(([name, done, desc]) => ({ name, done: !!done, desc }));
  }

  // —— NG+：带着友谊与图鉴重新开学 ——
  function ngStart() {
    const keep = { friends: JSON.parse(JSON.stringify(state.friends)), col: JSON.parse(JSON.stringify(F().col || {})), items: JSON.parse(JSON.stringify(F().items || {})), ngplus: true };
    state.flags = blankFlags();
    state.flags.col = keep.col;
    state.flags.items = keep.items;
    state.flags.ngplus = keep.ngplus;
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
    await say({ name: '孙阳', text: '「今天投了两百个球。\n明天，投两百零一个。」' });
    if ((F().shootBest || 0) >= 5) { gainBond('sunyang', 3); await say({ name: '孙阳', text: `「你那${F().shootBest}连进我看到了。\n……队里的位置，给你留着。」` }); }
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
await say({ text: '你抡起小锄头，把土翻得松软。\n（去田伯那儿买当季种子吧）' });
      syncPlot(o); save();
      return;
    }
    // —— 土垄（未播种）：挑当季种子种下 ——
    if (!p.crop) {
      const seeds = seasonSeeds();
      if (!seeds.length) {
        await say({ text: '冬天土面冻得梆硬。\n田伯说：地也要歇一歇，\n开春再来种吧。' });
        return;
      }
      const opts = seeds.map(s => {
        const own = ADV.Collect.count(s.seed);
        return `${s.name}种子（有 ${own} · 田伯有售）`;
      }).concat(['先不种', '放置洒水器', '撒肥料']);
      const i = await choose(opts, { caption: { text: `松软的土垄，正适合播种。\n现在是${C.season()}。` } });
      if (i === seeds.length) return;
      if (i === seeds.length + 1) return placeSprinkler(p, o);
      if (i === seeds.length + 2) return addFertilizer(p, o);
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
      await say({ text: `你把${s.name}种子埋进土里。\n记得每天浇水——三天就能收获！🌱` });
      if (ADV.Skills) ADV.Skills.add('farm', 4, '播种');
      syncPlot(o); save();
      return;
    }
    // —— 已播种：浇水（一天一次，浇了次日才长） ——
    const info = ADV.Collect.itemInfo(p.crop);
    if (p.wd === C.day) {
      await say({ text: `（${info.name}苗今天喝饱了，\n${p.st >= 2 ? '都开始挂果了！' : '叶子舒展着，晒着太阳'}）` });
      return;
    }
    const go = await choose(['浇水（精力 -1）', '先不了', '放置洒水器', '撒肥料'], { caption: { text: `${info.name}苗（第 ${p.st} 天）\n土面有点发白。` } });
    if (go === 2) return placeSprinkler(p, o);
    if (go === 3) return addFertilizer(p, o);
    if (go !== 0) return;
    C.costEnergy(1);
    p.wd = C.day;
    ADV.Audio.sfx('water');
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
      if (p.crop && p.st >= 1 && p.st < 3 && (p.spk || p.wd === C.day - 1)) p.st += 1;  // 昨天浇过水（或洒水器值班）→ 长一截
      // 新的一天：水干了；但雨天老天爷帮忙、洒水器勤恳值班，正在生长的地块自动盖好水
      p.wd = ((rainy || p.spk) && p.crop && p.st >= 1 && p.st < 3) ? C.day : 0;
    }
    // 乌鸦事件：每隔几天的清晨溜进没看管的田里偷嘴（翻新稻草人后绝迹）
    if (f.farm && !f.scarecrowFixed) for (const k in f.farm) {
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
      if (ADV.Growth) { ADV.Growth.addXP(diff === 'hard' ? 6 : diff === 'normal' ? 4 : 2, '答题'); ADV.Growth.addDim('knowledge', 1); }
      return true;
    }
    ADV.Audio.sfx('wrong');
    if (wrongBag) wrongBag.push(q);
    return false;
  }
  /* 多题考试：同一题答错现场重答（直至答对） */
  async function examAsk(label, subject, diff, seed) {
    while (true) {
      if (await examOnce(label, subject, diff, seed)) return true;
      await say({ name: label, text: '再想想～答错不扣分，但要重答哦。' });
    }
  }
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
    if (C.period >= 4 && f.dinnerDay !== C.day) opts.push('吃妈妈做的晚饭');
    const i = await choose(opts, { caption: { name: '饭桌', text: known.length ? '妈妈留了字条：想做就自己做哦～' : '饭桌收拾得干干净净。' } });
    if (opts[i] === '自己做顿饭') {
      await cookAtHome();
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
  async function readBook(bookId) {
    const f = F();
    const bk = ADV.Books && ADV.Books.DB[bookId];
    if (!bk) { await say({ text: '（这本书暂时读不出什么名堂）' }); return; }
    await say({ text: `📖 ${bk.name}\n${bk.intro}` });
    await new Promise(res => ADV.Books.start(bookId, res));       // 阅读器接管主循环
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

  // 教室讲台：课本
  /* —— 上课：每日一课（白天 · 校历有课 · 当天未上）。主科 = 抢答小游戏 + 两道随堂题，
        副科（体育/音乐/美术/阅读/社团）= 动手环节 + 一道综合题；答对自动得知识点 —— */
  async function takeClass() {
    const f = F(), C = ADV.Cal, M = ADV.Mistake;
    const subs = C.today();
    if (!subs.length) { await say({ text: '（今天是休息日，教室空荡荡的。\n周日不上课——去外面冒险吧！）' }); return; }
    if (C.isNight()) { await say({ text: '（天色已晚，教室锁门了。\n上课要趁白天来～）' }); return; }
    if (f.classDay === C.day) { await say({ text: '（今天的课已经上完啦。\n消化一下知识，明天再来！）' }); return; }
    const MAJOR = { '数学': 'math', '语文': 'chinese', '英语': 'english', '科学': 'science' };
    const cn = subs[(C.day - 1) % subs.length];          // 按日子轮换今天重点节次
    const en = MAJOR[cn] || 'final';
    f.classDay = C.day;
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
    const gained = M.kp(en) - kp0;
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
      return;
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
      return;
    }
    await say({ name: '秦墨', text: `读完 ${n} / 3 本。\n书架在那边，自己去拿吧。` });
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
    // 半价旧书摊
    const list = ADV.Books.byWhere('shop');
    const opts = list.map(b => `${b.name} 💰${Math.ceil(b.price / 2)}${ADV.Collect.has('books', b.id) ? '（已有）' : ''}`);
    opts.push('就这样吧');
    const i = await choose(opts, { caption: { name: '旧书摊', text: `💰${f.gold}　摘抄 ${ex}/10 句\n旧书半价，随便翻。` } });
    if (i < 0 || i >= list.length) return;
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
  S.giftShop = () => shop(['bait', 'bugNet', 'fineNet', 'goldNet', 'basket', 'bigCage', 'colorCage', 'wheat', 'flower', 'poem', 'ballcard', 'ribbon', 'pencil', 'sketch', 'coffee', 'hoe', 'wateringCan', 'scythe', 'pickaxe', 'axe', 'shovel', 'fishingRod', 'camera', 'sprinkler', 'fertilizer', 'scarecrowKit'], '礼品店');
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
      { caption: { name: '跳蚤市场 · 拍卖', text: `${gd.name}\n行价自己算：${a} × ${b} = ?\n（谁出得准归谁——多付的可不退！）` } });
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
    if (f.arenaDay !== ADV.Cal.day) {
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
      f.arenaDay = ADV.Cal.day;
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

  /* ==================== 存档 ==================== */
  let _hasSave = null;               // hasSave 结果缓存（save / 导入后失效）
  let _storageOk = null;             // localStorage 可用性探测（缓存）
  let _saveWarned = false;           // 存储失败只提醒一次，别每步都弹

  function storageOk() {             // 隐私模式等场景 localStorage 会直接抛错
    if (_storageOk !== null) return _storageOk;
    try { localStorage.setItem('__adv_probe', '1'); localStorage.removeItem('__adv_probe'); _storageOk = true; }
    catch (e) { _storageOk = false; }
    return _storageOk;
  }

  /* 存档语义校验：JSON 合法 ≠ 档案可用（防损坏档把游戏带崩） */
  function validSave(d) {
    return !!(d && typeof d === 'object'
      && (d.v === 1 || !d.v)
      && (!d.map || typeof d.map === 'string')
      && d.flags && typeof d.flags === 'object'
      && (!d.friends || typeof d.friends === 'object'));
  }

  function save() {
    try {
      const p = ADV.Engine.player;
      const data = {
        v: 1, hero: state.hero,
        map: ADV.Engine.map ? ADV.Engine.map.id : 'campus',
        x: p ? p.x : 22, y: p ? p.y : 30, dir: p ? p.dir : 'up',
        flags: state.flags,
        friends: state.friends,
        cal: ADV.Cal ? ADV.Cal.dump() : null,
growth: ADV.Growth ? ADV.Growth.dump() : null,
skills: ADV.Skills ? ADV.Skills.dump() : null
};
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      _hasSave = true;
    } catch (e) {
      // 存储失败（隐私模式/配额满）不再静默：提示一次 + 指路手动备份
      if (!_saveWarned) {
        _saveWarned = true;
        try { UI().toast(' ⚠ 进度无法保存（浏览器存储不可用），可在标题页「导出存档」手动备份 '); } catch (e2) {}
      }
    }
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!validSave(d)) return null;
      // 旧档升级：合并全部默认旗标，保证新增字段存在
      if (d && d.flags) d.flags = { ...blankFlags(), ...d.flags, badges: { ...blankFlags().badges, ...d.flags.badges } };
      return d;
    } catch (e) { return null; }
  }
  function hasSave() {
    if (_hasSave === null) _hasSave = !!load();      // 标题页每帧都问，缓存避免反复解析大 JSON
    return _hasSave;
  }

  /* —— 存档导出 / 导入（Base64 文本，可粘贴备份 / 换设备） —— */
  function exportSave() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) throw new Error('还没有存档');
    return btoa(unescape(encodeURIComponent(raw)));
  }
  function importSave(code) {
    try {
      const raw = decodeURIComponent(escape(atob(String(code).trim())));
      const d = JSON.parse(raw);
      if (!validSave(d)) return false;
      localStorage.setItem(SAVE_KEY, JSON.stringify(d));
      _hasSave = null;                                // 缓存失效
      return true;
    } catch (e) { return false; }
  }

  function newGame(hero, withIntro) {
    state.hero = hero;
    state.flags = blankFlags();
    state.friends = {};
    if (ADV.Skills) ADV.Skills.reset();                  // 五系技能从零开始
    ADV.Cal.load({ day: 1, period: 0, weather: '晴', checkedIn: false, streak: 0 });
    ADV.Engine.loadMap('homeIn', 18, 11, 'up');          // 一切从家开始
    if (withIntro) setTimeout(() => { S._intro(); }, 80); // 序章（浏览器）
  }
  function continueGame() {
    const d = load();
    if (!d) return false;
    state.hero = d.hero || 'hero_boy';
    state.flags = d.flags;
    state.friends = d.friends || {};
    if (ADV.Cal && d.cal) ADV.Cal.load(d.cal);
    if (ADV.Growth && d.growth) ADV.Growth.load(d.growth);
    if (ADV.Skills && d.skills) ADV.Skills.load(d.skills);
    try {
      ADV.Engine.loadMap(d.map, d.x, d.y, d.dir);
    } catch (e) {                                        // 旧档地图已不存在：落回家，不再崩溃
      ADV.Engine.loadMap('homeIn', 18, 11, 'up');
      try { UI().toast(' ⚠ 存档地图缺失，已送回家中 '); } catch (e2) {}
    }
    return true;
  }

  // 对话包装：故事 → 原脚本 → 日常好感 +2（teachers/学生/新伙伴全部纳入）
  bondify(['principal', 'xiaoming', 'xiaohong', 'xiaogang', 'xiaopang', 'aunt', 'cat',
    'keeper', 'star', 'miner', 'teacherLiu', 'teacherZhao', 'teacherMath', 'teacherCn', 'teacherSci', 'teacherEn',
    'studentLib', 'studentClass', 'studentCanteen', 'studentEn', 'studentGym', 'studentMusic',
    'yuejian', 'jinpeng', 'momo', 'owl', 'grey',
    'mom', 'dad', 'flower', 'wuyun', 'dazhuang', 'xiaoying', 'dojomaster', 'doctor', 'shopgirl', 'bookman', 'artChief',
    'librarian', 'oldbook', 'buddy', 'farmer', 'cardman', 'lufei', 'linxiaoyu', 'grandpa',
    'wangmei', 'laozhang', 'tuxiao', 'xiaohua', 'sunyang', 'datou', 'zhaoling', 'huangyu', 'lao_li', 'baiyun', 'tiezhu', 'qianqian']);

  /* ---------- 闲话池：让每天的同一个人都不太一样 ---------- */
  const CHAT = {
    principal: ['「今天的喷泉，格外精神。」', '「教育就是把一颗石头，也捂出温度。」', '「看到你们跑过走廊，我就放心了。」'],
    xiaoming: ['「最新一话的战斗分镜绝了！」', '课间十分钟，能看三页漫画。', '我给食堂阿姨也画了角色设定！'],
    xiaohong: ['「今天风不错，适合破纪录。」', '跑步的时候背古诗，两不耽误！', '发卡又歪了……不许笑。'],
    xiaogang: ['「哼，今天手感不错。」', '（他在哼一首小提琴曲）', '下一个目标：赢过昨天的自己。'],
    xiaopang: ['「新菜谱出炉，就在今天中午。」', '饭后一支……香蕉，赛过活神仙。', '我在写《食堂百强榜》，你排第几？'],
    aunt: ['「今天加菜，多盛一勺！」', '「长身体的年纪，别怕吃。」', '「谁剩饭，我跟谁急。」'],
    cat: ['喵～♪（尾巴指了指食堂方向）', '喵呜。（它眯眼晒太阳）', '喵！（毛上沾了一片樱花）'],
    keeper: ['「星光今晚很守时。」', '「老人我呀，见过四种月亮。」', '「门后的风，今天很温柔。」'],
    star: ['「星星在唱歌，你听见了吗？」', '阿星今天追了自己的尾巴三次。', '爷爷的胡子又长长了一点。'],
    miner: ['「洞里的水晶又亮了些。」', '「矿工的眼泪？那是石头里的水。」', '「年轻真好，膝盖也好。」'],
    teacherLiu: ['「运动改变大脑！」', '今天也要出汗才像话！', '投不进没关系，姿势先赢。'],
    teacherZhao: ['「听，风穿过琴房的声音。」', '错音也是音乐的一部分呀。', '今天的你，是哪个音符？'],
    mom: ['「晚饭想吃什么？妈妈给你做。」', '「在学校交到朋友了吗？」', '「累了就早点睡，别硬撑。」'],
    flower: ['「花跟人一样，天天要照看。」', '「公园的长椅，坐坐不要钱。」', '（她哼着一首很老的花歌）'],
    dad: ['「报纸看完，记得放回原处。」', '（他假装看报，其实在打瞌睡）', '「椅子坐得舒服，家就坐得舒服。」', '「学校的石门？爸爸年轻时也听说过传说。」'],
    wuyun: ['「这学校的每条路我都会背。」', '（他在偷偷看单词本）', '「拳头解决不了的事，好像越来越多了。」'],
    dazhuang: ['「齿轮转起来的时候最解压。」', '我爸说：零件和题一样，得一步步装。', '今天搬了几十箱货，小意思。'],
    xiaoying: ['（她在画你，别回头）', '光和影，今天配合得不错。', '转学生的第六感：今天有好事。'],
    momo: ['「坩埚今天的心情是……微酸。」', '（她在闻一种新的试剂）', '化学反应，和友谊一样需要条件。'],
    jinpeng: ['「金家继承人不需要……那个，谢谢。」', '哼，你的进度我都知道。', '飞行课，下次我赢。'],
    yuejian: ['「月光今天很温柔。」', '「宝石在安静地呼吸。」', '「孩子们的笑声，是最好的咒语。」'],
    lufei: ['（他跑过你身边，逆着风比了个大拇指）', '「今天的配速，能进校队前十！」', '「体育节见！我可是报了三个项目！」'],
    linxiaoyu: ['（她朝你小小地挥了下手，又飞快低下头）', '「那、那个……图书角又进新书了……」', '「（她小声哼着不知名的歌，很好听）」']
  };
  for (const k in CHAT) if (BOND[k]) BOND[k].chat = CHAT[k];

  /* ==================== NPC 对话大脑（星露谷式条件台词） ====================
   * 台词不再纯随机：按 记忆引用 > 天气 > 季节 > 好感阶段 > 进度吐槽 优先级
   * 选取，同一 NPC 每天在不同条件下说不同的话。
   */
  const WEATHER_LINES = {
    小雨: ['「下雨了，跑慢点，别摔。」', '「这雨，听着像薯片袋子响。」', '「带伞了吗？……算了，我背你。」'],
    暴雨: ['「雷这么响，教室的灯都在抖！」', '「这种天还来上学，是真爱啊。」', '「雨神今天格外敬业。」'],
    雪: ['「下雪了！放学去堆雪人吗？」', '「手好冷——借我捂一下？」', '「雪天的操场，安静得像另一个世界。」'],
    雾: ['「这雾……侦探小说的开头。」', '「五米之外人畜不分，别走丢哦。」', '「雾里藏着今天的运气。」'],
    星空: ['「今晚的星星，多得数不过来。」', '「天台见？就现在。」', '「这种夜晚，适合说心里话。」'],
    晴: ['「阳光正好，操场走一圈？」', '「这种天气不跑步可惜了！」', '「晒得暖洋洋的，想睡觉……」'],
    多云: ['「云像棉花糖……饿了。」', '「今天云很多，心事也很多。」', '「阴阴阳阳的天气，随它去吧。」']
  };
  const SEASON_LINES = {
    春: ['「樱花开了，要抓紧看。」', '「春天连风都是甜的。」', '「新学期，新气象！」'],
    夏: ['「蝉叫得人心痒痒。」', '「来根冰棍怎么样？」', '「夏天的傍晚最长了，真好。」'],
    秋: ['「落叶踩起来咔嚓咔嚓的。」', '「秋天适合读诗。」', '「桂花香起来了。」'],
    冬: ['「呼——白气！看！」', '「冬天的被窝是敌人。」', '「手套借你一只，别嫌弃。」']
  };
  const STAGE_LINES = [
    null,                                                    // stage 0
    ['「说起来，你现在也算半个熟人了。」', '「跟你聊天，比想象中舒服。」'],  // stage 1 相识
    ['「有烦心事的话，随时找我。」', '「你最近好像成长了不少？」'],          // stage 2 知己
    ['「别的不说——你的事，就是我的事。」', '「认识你，是这一年最赚的事。」']   // stage 3 挚友
  ];
  // 时段 + 地点闲话：让 NPC 在放学和傍晚更像真的在过一天。
  const PERIOD_SCENE_LINES = {
    xiaoming: {
      campus: { 3: ['「放学后喷泉边最好画人了。\n大家都像刚从故事里跑出来。」'], 4: ['「傍晚的光线最适合画封面，\n你先别动，我记一下。」'] },
      town: { 3: ['「书店门口人一多，我就忍不住想象每个人都在赶下一章。」'] },
      oldstreet: { 3: ['「这条巷子最适合交换漫画。\n每个人都像带着自己的番外篇。」'], 4: ['「老街一到傍晚就像旧画册翻到最后几页，\n颜色会慢慢沉下来。」'] }
    },
    xiaohong: {
      campus: { 3: ['「放学这会儿最适合跑圈！\n风还热乎着呢。」'], 4: ['「傍晚操场舒服得很，跑完一身汗，心情也跟着亮了。」'] },
      hillside: { 0: ['「天刚亮的时候上坡，腿最先醒过来。」'], 1: ['「晨跑坡的风比操场直，跑完一圈整个人都清了。」'], 4: ['「傍晚再来一趟，今天就算认真收尾啦。」'] }
    },
    xiaogang: { campus: { 3: ['「放学后的操场才像真的赛场。\n现在输赢都算数。」'], 4: ['「天快黑的时候再冲一圈，成绩最容易往前蹿。」'] } },
    xiaopang: {
      campus: { 3: ['「放学后的食堂香得最厉害。\n认真学习的人，就该认真加餐。」'], 4: ['「阿姨傍晚那锅汤最稳，来晚了可就没啦。」'] },
      town: { 3: ['「小吃摊一到放学就排队。\n这才叫校园生活嘛。」'] },
      oldstreet: { 2: ['「我跟你说，老街这边藏零食最方便。\n墙角一压，放学来拿，刚刚好。」'], 3: ['「放学以后来老街翻吃的，\n有种偷到额外一顿的快乐。」'], 4: ['「天一黑，辣条和面包都变得更香了。\n这不科学，但很真实。」'] }
    },
    lufei: { campus: { 3: ['「放学跑圈的人最多，刚好能顺便给大家打气！」'], 4: ['「傍晚风最顺，跑起来像有人在后面推我。」'] } },
    linxiaoyu: { library: { 3: ['「放学后图书馆最安静……\n翻页声会变得特别清楚。」'], 4: ['「傍晚坐窗边看书，太阳会慢慢从书页上退下去。」'] } },
    wangmei: {
      campus: { 3: ['「放学后的广播最难念，\n因为大家都已经开始想着晚上的事了。」'], 4: ['「傍晚试音时，操场和食堂的声音会一起飘过来。」'] },
      riverbay: { 4: ['「桥洞会把声音送得很远。\n在这儿练一遍，心就不那么慌了。」'], 5: ['「晚一点来河湾，唱出来的每个字都像被水面接住。」'] }
    },
    xiaohua: { campus: { 3: ['「花坛到放学后会更香一点。\n可能是白天攒够了阳光。」'], 4: ['「傍晚给花浇水最好，叶子会把光慢慢还给夜色。」'] } },
    sunyang: { campus: { 3: ['「放学后的球场不缺人，\n就缺一个敢喊开始的。」'], 4: ['「傍晚热身最舒服，膝盖都不跟我闹脾气。」'] } },
    datou: {
      campus: { 3: ['「放学第一件事不是回家，\n是先看看食堂今天还剩啥！」'], 4: ['「傍晚还能捞到最后一勺热菜，\n这叫真正的运气。」'] },
      orchard: { 2: ['「果园这边中午风一吹，闻着就像点心铺后厨。」'], 3: ['「鸭塘看久了会饿，果子看久了更饿。\n这地方对我不太友好。」'], 4: ['「傍晚来这儿摘点果子回去，\n总觉得晚饭都提前赢了一半。」'] }
    },
    laozhang: { campus: { 3: ['「放学时我最忙。\n得一边看校门，一边看你们谁忘了打卡。」'], 4: ['「傍晚一安静下来，连广播杆都像在打哈欠。」'] } },
    lao_li: { town: { 3: ['「放学后这条街最像条河，\n孩子们一路从学校流回来。」'], 4: ['「傍晚的街面最有人味，买东西的、聊天的、发呆的都有。」'] } },
    baiyun: { town: { 3: ['「放学以后花卖得最快。\n大家都想带点好看的东西回家。」'], 4: ['「傍晚风一吹，花香会顺着整条街跑。」'] } },
    momo: { cultureHub: { 2: ['「少年宫后头这块角落安静，\n刚好够我把新想法写完一半。」'], 3: ['「放学后来这儿试配方，\n比在教室偷偷记公式自在多了。」'], 4: ['「傍晚的玻璃瓶会把天光留下来一点，\n所以这时候最适合做记录。」'] } },
    jinpeng: { cultureHub: { 3: ['「这块场地空出来以后，\n一脚把球送到边线外都没人管。」'], 4: ['「傍晚练冲刺最见真章。\n腿累的时候，心反而会更稳。」'] } },
    // 夜里陆续收摊：摊位状态靠台词交代，白天再来才是热闹的市集
    grandpa: {
      town: {
        4: ['「天黑前最后两拨人了，\n要淘东西就趁现在，落子儿还能商量。」'],
        5: ['「收摊喽，摊子上的东西都装筐了。\n明儿早点来，好东西都在早上。」']
      }
    },
    oldbook: {
      town: {
        4: ['「天色一暗，书页就看不清字了。\n我留一盏灯，等最后一个翻书的人。」'],
        5: ['「今天到这儿吧——\n书摊收起来，故事明天接着讲。」']
      }
    },
    cardman: {
      town: { 5: ['「小卖部打烊啦。\n童年集换卡明天再拿出来，别急。」'] }
    }
  };
  const WEEKDAY_SCENE_LINES = {
    xiaoming: { 2: ['「周二的音乐课最容易让人想画分镜。\n节奏会自己跑进格子里。」'], 6: ['「周六最适合蹲书店门口，\n因为大家都没那么赶。」'] },
    xiaohong: { 5: ['「周五一到，操场的风都更像在催人开跑。」'] },
    xiaogang: { 5: ['「周五输给谁都行，体育节不行。」'] },
    xiaopang: { 6: ['「周六的点心最好卖。\n大家一放松，肚子也跟着放松。」'] },
    wangmei: { 1: ['「周一开口播第一句最难，\n因为全校都还没睡醒。」'], 5: ['「周五的广播稿最容易写成加油词。」'] },
    linxiaoyu: { 6: ['「周六图书馆的椅子都比较松弛……\n书页也翻得慢一点。」'] },
    lao_li: { 6: ['「周六街上最像节日。\n买东西的人，脚步都轻一点。」'] },
    baiyun: { 7: ['「周日的花最安静，\n好像也知道今天该慢一点开。」'] }
  };
  const PROGRESS_LINES = [
    { when: f => f.gateOpen, lines: ['「石门开了之后，我做梦都在想里面。」', '「你可是开过石门的人了！」'] },
    { when: f => f.houseCup, lines: ['「月光学院的事，全校都传遍了。」', '「学院杯冠军，厉害啊。」'] },
    { when: f => (f.arenaBest || 0) >= 5, lines: ['「竞技场连胜纪录这么高？！教教我！」', '「答题机器说的就是你吧。」'] },
    { when: f => f.dogPal, lines: ['「煤球只认你，它给我脸色看！」', '「一人一狗，全校最强搭档。」'] },
    { when: f => f.club, lines: ['「社团活动见！」'] }
  ];
  // 记忆引用：NPC 提起你最近干的事（来自 deeds 日志）
  function memoryLine(name) {
    const f = F();
    const deeds = (f.deeds || []).filter(d => ADV.Cal.day - d.day <= 3);
    if (!deeds.length) return null;
    const d = deeds[(Math.random() * deeds.length) | 0];
    return `「听说你${d.text}——${['干得漂亮！', '可以啊你。', '不愧是你。'][(Math.random() * 3) | 0]}」`;
  }
  // 闲话系统：送礼会传开（星露谷 gossip）
  function gossipLine(npcId) {
    const f = F();
    const g = (f.gossip || []).find(g2 => g2.to !== npcId && ADV.Cal.day - g2.day <= 2);
    if (!g) return null;
    const who = BOND[g.to] ? BOND[g.to].name : '有人';
    const what = ADV.Collect.itemInfo(g.item);
    return `「诶，听说你送了${who}${what ? what.name : '礼物'}？\n（消息传得比风还快）」`;
  }
  function periodSceneLine(npcId) {
    const c = ADV.Cal, m = ADV.Engine && ADV.Engine.map ? ADV.Engine.map.id : '';
    if (!c || !m) return null;
    const byNpc = PERIOD_SCENE_LINES[npcId];
    const byMap = byNpc && byNpc[m];
    const lines = byMap && byMap[c.period];
    return lines && lines.length ? pick(lines) : null;
  }
  function weekdaySceneLine(npcId) {
    const c = ADV.Cal;
    if (!c || !c.weekday) return null;
    const lines = WEEKDAY_SCENE_LINES[npcId] && WEEKDAY_SCENE_LINES[npcId][c.weekday()];
    return lines && lines.length ? pick(lines) : null;
  }
  // 主入口：给 NPC 挑一句"此刻"的台词
  /* —— P-B4 NG+ 差异化②：随身宠物 / 图鉴完成度的新话题（玩6） —— */
  const BUDDY_TALK = [
    b => `你身边那只${b}，毛色真亮——你把它养得很好。`,
    b => `${b}刚才一直盯着你看。它比谁都信任你。`,
    b => `（${b}在你脚边打了个滚）\n「哈哈，它这是把你当全家了。」`,
    b => `草丛那边危险吗？……有${b}在，你一定没事的。`,
  ];
  const DEX_TALK = [
    '「你的图鉴我都翻过——快集满了吧？\n你眼睛里装着整个校园的四季。」',
    '「图鉴那么厚……每一页都是一段路吧。\n羡慕你，一直都在认真生活。」',
  ];
  /* —— s8 好感心级解锁事件：好感 ≥90 时，六位挚友各有一段「心里话」过场（每人一次） ——
   *    六段全收集 → 回忆照片「心语纪念册」+ 成就「心满益善」 —— */
  const HEART_EVENTS = {
    xiaohong: async () => {
      await say({ name: '小红', text: '「跟你说个秘密——那枚发卡丢了以后，\n我哭了一晚上。后来你把它找回来，\n我就想：这个朋友，我要交一辈子。」' });
      await say({ text: '她把一条备用的幸运发绳塞给你。' });
      ADV.Collect.addItem('ribbon', 1);
    },
    xiaoming: async () => {
      await say({ name: '小明', text: '「我的漫画第一话，画的是个转学生。\n所有人都说画的是冒险王——\n其实画的是你。」' });
      await say({ text: '他红着耳朵递来一本册子。' });
      ADV.Collect.addItem('comic', 1);
    },
    wuyun: async () => {
      await say({ name: '乌云', text: '「留级那年我以为这辈子就这样了。\n是你让我知道，\n输得起的人，才配赢。」' });
      await say({ text: '他难得地伸手，拍了拍你的肩。' });
      F().gold = (F().gold || 0) + 20;
    },
    dazhuang: async () => {
      await say({ name: '大壮', text: '「我爸工具箱有个夹层，\n放着爷爷留下的扳手。他跟我说：\n传给最信得过的兄弟。」\n「——我第一个想到你。」' });
      await say({ text: '他把两瓶汽水拍在你手里。' });
      ADV.Collect.addItem('juice', 2);
    },
    xiaoying: async () => {
      await say({ name: '小影', text: '「我不太会说话，都画在画里了。\n这本册子的每一页角落，\n都站着同一个身影——你去发现吧。」' });
      await say({ text: '她飞快地移开视线，耳朵通红。' });
      ADV.Collect.addItem('sketch', 1);
    },
    lufei: async () => {
      await say({ name: '陆飞', text: '「第十圈的风，和第一圈不一样。\n第一圈的风是兴奋，第十圈的风——\n是有人陪着你跑完的踏实。」\n「谢谢你陪我跑。」' });
      await say({ text: '他用力和你击了个掌，声音清脆。' });
      ADV.Collect.addItem('juice', 1);
    },
  };
  const HEART_IDS = Object.keys(HEART_EVENTS);
  // 在对话包装器里调用：好感满阶（≥90）且未触发过 → 播一段心里话
  async function maybeHeartEvent(id) {
    const f = F();
    if (!HEART_EVENTS[id] || f.heartDone[id] || ((state.friends[id] && state.friends[id].love) || 0) < 90) return false;
    f.heartDone[id] = true;
    ADV.Audio.sfx('emote');
    const np = E().getNpc(id); if (np) E().playAction(np, 'shy', 1.6);
    await HEART_EVENTS[id]();
    gainBond(id, 3);
    addCup(10);
    save();
    UI().toast(` 💗 ${BOND[id] ? BOND[id].name : id}的心里话（${Object.keys(f.heartDone).filter(k => HEART_EVENTS[k]).length}/${HEART_IDS.length}）· 学院分 +10 `);
    if (HEART_IDS.every(k => f.heartDone[k])) {
      ADV.Collect.gain('photos', 'p_hearts');
      addCup(20);
      UI().toast(' 📖 心语纪念册集齐！全员大合影入册，学院分 +20 ');
      logEvent('听完了六位挚友的心里话');
    }
    return true;
  }
  function npcMindLine(npcId) {
    const f = F(), fr = friend(npcId);
    const pools = [];
    const mem = memoryLine(); if (mem) pools.push([mem, 3]);
    const gos = gossipLine(npcId); if (gos) pools.push([gos, 2]);
    const scene = periodSceneLine(npcId); if (scene) pools.push([scene, 3]);
    const week = weekdaySceneLine(npcId); if (week) pools.push([week, 2]);
    // 随身宠物：带着随行伙伴时，NPC 们会聊起它
    if (f.buddy && ADV.Collect && ADV.Collect.critter(f.buddy.id))
      pools.push([pick(BUDDY_TALK)(ADV.Collect.critter(f.buddy.id).name), 2]);
    // NG+：图鉴接近完成的新话题（只在新学期出现，老朋友会提起你的收藏）
    if (f.ngplus && ADV.Collect) {
      const pr = ADV.Collect.progress();
      if (pr.total > 0 && pr.got >= pr.total * .8) pools.push([pick(DEX_TALK), 2]);
    }
    if (WEATHER_LINES[ADV.Cal.weather]) pools.push([pick(WEATHER_LINES[ADV.Cal.weather]), 2]);
    pools.push([pick(SEASON_LINES[ADV.Cal.season()] || SEASON_LINES.春), 1]);
    if (fr.stage >= 1 && STAGE_LINES[fr.stage]) pools.push([pick(STAGE_LINES[fr.stage]), 2]);
    for (const p of PROGRESS_LINES) if (p.when(f)) pools.push([pick(p.lines), 1]);
    if (BOND[npcId] && BOND[npcId].chat) pools.push([pick(BOND[npcId].chat), 1]);
    // 加权随机
    let total = pools.reduce((s, [, w]) => s + w, 0), r = Math.random() * total;
    for (const [line, w] of pools) { r -= w; if (r <= 0) return line; }
    return pools[0][0];
  }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }

  // 二次包装：对话大脑接管闲话（45% 概率，条件台词替代纯随机）
  const CHAT_IDS = Object.keys(CHAT).concat(['mom', 'wuyun', 'dazhuang', 'xiaoying', 'momo', 'jinpeng', 'yuejian', 'doctor', 'shopgirl', 'bookman', 'artChief']);
  for (const k of [...new Set(CHAT_IDS)]) {
    const fn = S[k];
    if (!fn || fn.__mindWrapped) continue;
    const wrapped = async ent => {
      await fn(ent);
      // s8 心级事件：好感 ≥90 的心里话过场（每人一次，优先于日常闲话）
      if (BOND[k] && await maybeHeartEvent(k)) return;
      const fr = friend(k);
      // 45% 概率触发闲话；好感 +1 每日至多一次（mindDay 登记，防反复对话刷好感）
      if (BOND[k] && fr.mindDay !== ADV.Cal.day && Math.random() < .45) {
        fr.mindDay = ADV.Cal.day;
        await say({ name: BOND[k].name, text: npcMindLine(k) });
        gainBond(k, 1);
      }
    };
    wrapped.__mindWrapped = true;
    S[k] = wrapped;
  }

  /* ==================== 偏好 / 生日 / 新角色故事 ==================== */
  BOND.librarian = { name: '秦墨', stages: [
    { need: 15, text: '【编号学】\n「每本书都有自己的编号和位置。\n书放错了，就像人站错了队。」' },
    { need: 40, text: '【旧借书卡】\n「这张卡是二十年前的学生留下的。\n她毕业走了，卡还在这儿。」' },
    { need: 70, text: '【守书人】\n秦墨把一枚旧印章放进你手心：\n「图书馆的门，也为你留着。」', gift: ['gold', 25] }] };

  /* ==================== NPC 大扩充：12 位新角色 · 每章不同故事 ====================
   * 每位 NPC 的故事随章节推进（chapter gate），不是一次性讲完。
   */
  // 王美：广播站播音员——第一章：怯场；第二章：月光学院播音；第三章：毕业广播
  BOND.wangmei = { name: '王美', stages: [
    { need: 15, text: '【第一章·怯场】\n「每次开广播，手心全是汗……\n但我真的真的热爱这件事。」' },
    { need: 40, text: '【第二章·声音的魔法】\n「月光学院的钟声，和我念的新闻，\n居然是同一种频率的魔法。」' },
    { need: 70, text: '【第三章·最后广播】\n「毕业那天的广播，我想好了——\n念你的名字，和这一年的故事。」', gift: ['cup', 8] }] };
  // 张叔：校门口保安（保安大爷的老同事）——一章：钥匙；二章：扫帚剑法回忆；三章：守门百年
  BOND.laozhang = { name: '张叔', stages: [
    { need: 15, text: '【第一章·万能钥匙】\n「学校的每把锁我都认识。\n它们心情不好，我就上点油。」' },
    { need: 40, text: '【第二章·老伙计】\n「保安大爷那把扫帚？\n三十年前我们俩一人一把——他留下来了，我去开了门。」' },
    { need: 70, text: '【第三章·守门人】\n「守一扇门不难。\n难的是守一辈子，还笑得出来。」', gift: ['gold', 30] }] };
  // 兔潇：永远在找东西的马虎蛋——一章丢三落四；二章月光学院失物；三章找回最重要的
  BOND.tuxiao = { name: '兔潇', stages: [
    { need: 15, text: '【第一章·又丢了】\n「橡皮！我的橡皮又不见了！\n……啊，在手里。」' },
    { need: 40, text: '【第二章·失物招领】\n「月光学院的失物会发光耶！\n在黑暗里找东西，反而容易。」' },
    { need: 70, text: '【第三章·最重要的】\n「我什么都丢，\n但你们这些朋友，我从来弄丢过。」', gift: ['cup', 5] }] };
  // 小花：园艺部部长——一章种花；二章月光花；三章四季轮转
  BOND.xiaohua = { name: '小花', stages: [
    { need: 15, text: '【第一章·花语】\n「每朵花都有话要说。\n你听——这朵在说加油。」' },
    { need: 40, text: '【第二章·月光花】\n「月光学院有种花只在夜里开。\n它的花语是：秘密。」' },
    { need: 70, text: '【第三章·四季】\n「花开四季，人走一年。\n明年花还开，你要回来。」', gift: ['gold', 25] }] };
  // 孙阳：篮球队队长——一章替补；二章月光学院飞天赛；三章告别赛
  BOND.sunyang = { name: '孙阳', stages: [
    { need: 15, text: '【第一章·替补席】\n「坐了两年替补……\n但每天最后一个走的，也是我。」' },
    { need: 40, text: '【第二章·飞天】\n「骑扫帚打篮球？！\n这才是真正的天空赛场啊！」' },
    { need: 70, text: '【第三章·告别】\n「最后一场，我上了。\n输了，但全场为我鼓掌。」', gift: ['cup', 8] }] };
  // 大头：食堂干饭王
  BOND.datou = { name: '大头', stages: [
    { need: 15, text: '【第一章·干饭哲学】\n「干饭不积极，脑子有问题。」' },
    { need: 40, text: '【第二章·月光食堂】\n「月光学院的菜会发光——\n但没阿姨的锅气！」' },
    { need: 70, text: '【第三章·最后一餐】\n「毕业餐我吃哭了。\n不是伤心，是太好吃了。」', gift: ['gold', 20] }] };
  // 赵大姐：食堂帮厨
  BOND.zhaoling = { name: '赵大姐', stages: [
    { need: 15, text: '【第一章·汤的秘诀】\n「好汤要慢火——\n跟学好功课一个道理。」' },
    { need: 40, text: '【第二章·月光食谱】\n「月见校长的私房菜谱借我看了！\n哎呀，跟我想的一样！」' },
    { need: 70, text: '【第三章·传人】\n「你这孩子，学厨有天赋。\n食谱，传你。」', gift: ['gold', 25] }] };
  // 黄宇：图书馆学霸
  BOND.huangyu = { name: '黄宇', stages: [
    { need: 15, text: '【第一章·第一名】\n「我考了第一名。\n但没人为我高兴……」' },
    { need: 40, text: '【第二章·月光书库】\n「月光学院的书，会自己翻页。\n原来被阅读是这么温暖的事。」' },
    { need: 70, text: '【第三章·朋友】\n「你第一次问我『一起看书吗』。\n那天比第一名亮多了。」', gift: ['cup', 8] }] };
  // 老李：小镇杂货翁
  BOND.lao_li = { name: '老李', stages: [
    { need: 15, text: '【第一章·杂货铺】\n「别看铺子小，\n三十年，全镇人都来过。」' },
    { need: 40, text: '【第二章·月光硬币】\n「月光学院的硬币，夜里会发亮。\n我收藏了满满一罐。」' },
    { need: 70, text: '【第三章·传家】\n「铺子要关了。\n但只要你还记得来过，它就还开着。」', gift: ['gold', 30] }] };
  // 白云：花店少女
  BOND.baiyun = { name: '白云', stages: [
    { need: 15, text: '【第一章·花香】\n「每束花，我都留一枝给自己。\n要记得先爱自己呀。」' },
    { need: 40, text: '【第二章·月光花语】\n「月光下的花，说的话不一样。\n……你要听听吗？」' },
    { need: 70, text: '【第三章·送你】\n她递来一小束干花：\n「毕业快乐。花会枯，心意不会。」', gift: ['cup', 5] }] };
  // 铁柱：门卫徒弟
  BOND.tiezhu = { name: '铁柱', stages: [
    { need: 15, text: '【第一章·学扫帚】\n「师傅说我握扫帚像握烧火棍。\n……有道理，我不反驳。」' },
    { need: 40, text: '【第二章·第一次守夜】\n「昨晚第一次值夜班——\n月光学院的钟声，真的会敲十三下！」' },
    { need: 70, text: '【第三章·出师】\n「师傅说他可以放心退休了。\n我哭了，他笑了。」', gift: ['cup', 8] }] };
  // 倩倩：月光学院的"幽灵同学"（第二章登场，第三章揭示）
  BOND.qianqian = { name: '倩倩', stages: [
    { need: 15, text: '【第二章·新同学】\n「我是……新来的。\n大家好像看不见我，真奇怪。」' },
    { need: 40, text: '【第二章·半透明】\n「我的手会穿过课桌。\n但你的目光，穿不过我——谢谢。」' },
    { need: 70, text: '【第三章·毕业了】\n「原来我是晨曦女士第一届的学生。\n守了一百年，今天……可以毕业了。」', gift: ['cup', 12] }] };
  BOND.oldbook = { name: '旧书翁', stages: [
    { need: 15, text: '【书摊来历】\n「这些书，都是人家读完不要的。\n我一本本捡回来，擦干净。」' },
    { need: 40, text: '【一句话】\n「人这一辈子记住一句话，\n就能少走一段弯路。」' },
    { need: 70, text: '【赠书】\n他从箱底翻出一本旧书：\n「送你了。书到爱它的人手里，才算活着。」', gift: ['gold', 20] }] };
  BOND.buddy = { name: '小卷', stages: [
    { need: 15, text: '【书友会】\n「我们每周都在图书馆角落读书，\n念出声的那种！」' },
    { need: 40, text: '【怕忘】\n「我记性差，所以什么都抄下来。\n抄着抄着，就成了自己的。」' },
    { need: 70, text: '【一起读】\n小卷把书往你这边推了推：\n「下次，我们读同一本吧。」', gift: ['cup', 4] }] };
  BOND.farmer = { name: '田伯', stages: [
    { need: 15, text: '【四时】\n「春种秋收，急不得。\n庄稼教我的第一件事，就是等。」' },
    { need: 40, text: '【老伙计】\n「河对岸那个老伙计，\n我们钓了四十年鱼，从没钓腻过。」' },
    { need: 70, text: '【稻花香】\n田伯从谷仓里捧出一小袋新米：\n「尝尝。这是今年的头一批。」', gift: ['gold', 20] }] };
  BOND.mom = { name: '妈妈', stages: [
    { need: 15, text: '【便当】\n「今天的便当多加了一个蛋。\n上课别分神，饿了就吃。」' },
    { need: 40, text: '【唠叨】\n「妈妈知道你嫌我唠叨……\n可你小时候，一步都离不开我呀。」' },
    { need: 70, text: '【长大】\n她看着你的徽章，眼眶红了：\n「我们家孩子，真的长大了。」', gift: ['gold', 30] }] };
  BOND.dad = { name: '爸爸', stages: [
    { need: 15, text: '【报纸角】\n「你上校报了，虽然只有半行。\n爸爸把它剪下来，夹在这一页。」' },
    { need: 40, text: '【旧地图】\n「我年轻时也想环游世界。\n后来发现，家就是目的地。」' },
    { need: 70, text: '【书签】\n他把一枚旧书签放进你手心：\n「路走得再远，记得回家的门朝哪开。」', gift: ['gold', 30] }] };
  BOND.flower = { name: '花婆婆', stages: [
    { need: 15, text: '【第一棵树】\n「公园里最老的那棵树，\n是我当学徒时栽下的第一棵。」' },
    { need: 40, text: '【花语】\n「每种花都有自己的话。\n你听得越久，听得越多。」' },
    { need: 70, text: '【接棒】\n她把小水壶擦了又擦：\n「以后这片花圃，就拜托你常来看看啦。」', gift: ['cup', 4] }] };
  BOND.wuyun = { name: '乌云', stages: [
    { need: 15, text: '【及格卷】\n「小学三年级，我数学考过一次 61 分。\n那张卷子……我一直留着。」' },
    { need: 40, text: '【留级】\n「留级不是笨。是那年家里出了事，\n我一节课都没听进去。」' },
    { need: 70, text: '【活地图】\n「我留级一年，把这学校每个角落都背下来了。\n——这张埋宝图残页，给你。」', gift: ['cup', 8] }] };
  BOND.dazhuang = { name: '大壮', stages: [
    { need: 15, text: '【修车铺】\n「我爸的修车铺，我能听声辨故障。\n就是数学卷子上的应用题……唉。」' },
    { need: 40, text: '【空间感】\n「老师说我空间感好。\n零件怎么装，我看一眼就懂。」' },
    { need: 70, text: '【力气用来守护】\n「以前用拳头说话。\n现在想用拳头……护着朋友。」', gift: ['cup', 8] }] };
  BOND.xiaoying = { name: '小影', stages: [
    { need: 15, text: '【转学】\n「第三次转学了。反正待不久，\n干嘛交朋友。」' },
    { need: 40, text: '【画册】\n「我画的全是这个学校的人。\n……记下来，走的时候才不亏。」' },
    { need: 70, text: '【想留下】\n「这次，我想留下来。\n因为——终于有人肯看我的画了。」', gift: ['cup', 8] }] };
  BOND.dojomaster = { name: '道场师傅', stages: [
    { need: 15, text: '【扫帚剑法】\n「老朽年轻时，用扫帚赢过刀。\n兵器不重要，心才重要。」' },
    { need: 40, text: '【保安大爷】\n「隔壁保安大爷？\n他是我的师弟，别去惹他。」' },
    { need: 70, text: '【传承】\n「武之一道，不在胜人，而在自胜。\n这句话，送你了。」', gift: ['cup', 8] }] };
  BOND.doctor = { name: '校医', stages: [
    { need: 15, text: '【绷带】\n「战斗输了就来找我。\n绷带和鼓励，都是免费的。」' },
    { need: 40, text: '【夜班】\n「值夜班的时候，\n能听见整个学校的梦话。」' },
    { need: 70, text: '【药草园】\n「后面的药草园随你看。\n说不定能挖到宝贝。」', gift: ['gold', 15] }] };
  BOND.shopgirl = { name: '礼品店员', stages: [
    { need: 15, text: '【新到货】\n「礼物嘛，重要的是心意——\n不过包装也要好看！」' },
    { need: 40, text: '【人气王】\n「你是本周光顾最多的客人，\n下次给你留新款～」' },
    { need: 70, text: '【老主顾】\n「这个花束送你，交个朋友！」', gift: ['cup', 3] }] };
  BOND.bookman = { name: '书店老板', stages: [
    { need: 15, text: '【进书】\n「想看什么书？说出来，\n下周就给你进货。」' },
    { need: 40, text: '【年轻时候】\n「我年轻时也想写书。\n后来发现，卖书也挺幸福。」' },
    { need: 70, text: '【绝版书】\n「这本市面上找不到了——\n放你那儿，才算物尽其用。」', gift: ['cup', 3] }] };
  BOND.artChief = { name: '美术部长', stages: [
    { need: 15, text: '【社团招新】\n「想学画画吗？\n我们美术社，就缺你这样的新人。」' },
    { need: 40, text: '【灵感】\n「小影的画有灵气。\n你的冒险，也是好题材。」' },
    { need: 70, text: '【合作】\n「文化祭的画展，\n咱俩合作一幅怎么样？」', gift: ['cup', 5] }] };
  BOND.cardman = { name: '王叔', stages: [
    { need: 15, text: '【小卖部】\n「这铺子开了二十年。\n你们这拨孩子，是第三代咯。」' },
    { need: 40, text: '【集卡热潮】\n「当年一张闪卡能换三根冰棍，\n现在……你们玩得比我们那会儿野多了。」' },
    { need: 70, text: '【传家卡】\n他从铁盒底摸出一张磨旧的卡：\n「收好。老板也曾经是小孩。」', gift: ['gold', 20] }] };
  BOND.grandpa = { name: '摊主爷爷', stages: [
    { need: 15, text: '【生意经】\n「跳蚤市场三条规矩：\n货真、价实、笑脸相迎。」' },
    { need: 40, text: '【老算盘】\n「我这算盘打了五十年。\n现在闭着眼都能报出菜价。」' },
    { need: 70, text: '【小徒弟】\n他把一枚旧算珠塞给你：\n「会算账的孩子，饿不着。收好！」', gift: ['gold', 25] }] };

  // 偏好 / 生日表（送礼判定用；bday = 游戏日 1~30）
  const META_RAW = {
    principal: { likes: ['coffee', 'poem'], hate: ['snack'], bday: 9 },
    xiaoming:  { likes: ['comic', 'bread'], hate: ['poem'], bday: 12 },
    xiaohong:  { likes: ['ribbon', 'juice'], hate: ['snack'], bday: 7 },
    xiaogang:  { likes: ['ballcard', 'juice'], hate: ['flower'], bday: 18 },
    xiaopang:  { likes: ['bread', 'snack', 'r1', 'r2'], hate: ['pencil'], bday: 21 },
    aunt:      { likes: ['flower', 'coffee', 'r1', 'r2'], hate: ['snack'], bday: 25 },
    cat:       { likes: ['bread', 'juice'], hate: [], bday: 3 },
    keeper:    { likes: ['coffee', 'poem', 'r6'], hate: ['snack'], bday: 1 },
    star:      { likes: ['flower', 'poem', 'r3'], hate: ['snack'], bday: 15 },
    miner:     { likes: ['coffee', 'bread', 'r5', 'r9'], hate: ['flower'], bday: 6 },
    teacherLiu:   { likes: ['juice', 'ballcard'], hate: ['coffee'], bday: 14 },
    teacherZhao:  { likes: ['flower', 'poem'], hate: ['snack'], bday: 23 },
    teacherMath:  { likes: ['pencil', 'coffee'], hate: ['flower'], bday: 11 },
    teacherCn:    { likes: ['poem', 'flower'], hate: ['snack'], bday: 27 },
    teacherSci:   { likes: ['pencil', 'juice'], hate: ['snack'], bday: 17 },
    teacherEn:    { likes: ['poem', 'pencil'], hate: ['snack'], bday: 29 },
    studentLib:   { likes: ['poem'], hate: ['snack'], bday: 20 },
    studentClass: { likes: ['snack', 'pencil'], hate: [], bday: 24 },
    studentCanteen: { likes: ['snack', 'bread'], hate: [], bday: 26 },
    studentEn:  { likes: ['pencil', 'coffee'], hate: [], bday: 28 },
    studentGym: { likes: ['juice', 'ballcard'], hate: ['poem'], bday: 16 },
    studentMusic: { likes: ['flower', 'poem'], hate: ['snack'], bday: 22 },
    yuejian:  { likes: ['flower', 'coffee', 'r4'], hate: ['snack'], bday: 5 },
    jinpeng:  { likes: ['ballcard', 'coffee'], hate: ['snack'], bday: 10 },
    momo:     { likes: ['pencil', 'coffee'], hate: ['snack'], bday: 19 },
    owl:      { likes: ['bread'], hate: [], bday: 2 },
    grey:     { likes: ['coffee'], hate: ['snack'], bday: 8 },
    librarian: { likes: ['coffee', 'poem'], hate: ['snack'], bday: 12 },
    oldbook:   { likes: ['coffee'], hate: [], bday: 21 },
    buddy:     { likes: ['sketch', 'poem'], hate: ['juice'], bday: 6 },
    farmer:    { likes: ['bread', 'juice', 'r7', 'r8'], hate: ['coffee'], bday: 24 },
    mom:      { likes: ['flower', 'coffee', 'r7'], hate: [], bday: 13 },
    dad:      { likes: ['coffee', 'fish'], hate: ['flower'], bday: 11 },
    flower:   { likes: ['flower', 'juice'], hate: ['snack'], bday: 3 },
    wuyun:    { likes: ['snack', 'ballcard', 'r9'], hate: ['poem'], bday: 30 },
    dazhuang: { likes: ['bread', 'juice', 'r5'], hate: ['poem'], bday: 4 },
    xiaoying: { likes: ['sketch', 'flower'], hate: ['ballcard'], bday: 31 % 30 },
    dojomaster: { likes: ['coffee'], hate: ['snack'], bday: 4 },
    doctor:   { likes: ['coffee', 'flower'], hate: [], bday: 26 },
    shopgirl: { likes: ['flower'], hate: [], bday: 17 },
    bookman:  { likes: ['coffee', 'poem'], hate: ['juice'], bday: 8 },
    artChief: { likes: ['sketch', 'flower'], hate: [], bday: 22 },
    cardman:  { likes: ['ballcard', 'snack'], hate: ['coffee'], bday: 15 },
    grandpa:  { likes: ['coffee', 'fish'], hate: ['flower'], bday: 20 },
    lufei:    { likes: ['juice', 'ballcard'], hate: ['poem'], bday: 16 },
    linxiaoyu: { likes: ['flower', 'poem'], hate: ['snack'], bday: 29 },
    // —— NPC 大扩充：偏好与生日 ——
    wangmei:  { likes: ['poem', 'coffee'], hate: ['snack'], bday: 11 },
    laozhang: { likes: ['coffee', 'bread'], hate: ['flower'], bday: 5 },
    tuxiao:   { likes: ['pencil', 'snack'], hate: [], bday: 19 },
    xiaohua:  { likes: ['flower', 'sketch'], hate: ['snack'], bday: 8 },
    sunyang:  { likes: ['juice', 'ballcard'], hate: ['poem'], bday: 14 },
    datou:    { likes: ['bread', 'snack'], hate: ['pencil'], bday: 22 },
    zhaoling: { likes: ['flower', 'coffee'], hate: [], bday: 27 },
    huangyu:  { likes: ['poem', 'pencil'], hate: ['juice'], bday: 13 },
    lao_li:   { likes: ['coffee', 'fish'], hate: ['flower'], bday: 3 },
    baiyun:   { likes: ['flower', 'sketch'], hate: [], bday: 25 },
    tiezhu:   { likes: ['bread', 'juice'], hate: ['poem'], bday: 7 },
    qianqian: { likes: ['flower', 'poem'], hate: ['snack'], bday: 30 }
  };
  const BOND_META = META_RAW;

  /* ==================== 每日见闻（每天一个小故事，随季节/天气/昼夜变化） ====================
   * 进入校园/小镇/田野/公园/月光大厅当天首次触发；条件不满足的故事不会出现 */
  const DAILY_TALES = [
    { who: '老槐树', text: '校园的老槐树沙沙作响，\n好像在讲一个很老很老的故事。' },
    { who: null, text: '喷泉池底闪着一点银光——\n是哪位同学许愿时投的硬币？' },
    { who: '小猫', text: '喵！（它踩着晨光走过花坛，\n尾巴上沾了一粒蒲公英。）' },
    { who: '保安大爷', text: '「昨晚月亮圆得很，\n操场上的影子都比平时精神。」' },
    { who: '食堂阿姨', text: '「今天的汤，多炖了半个钟头。」' },
    { who: '校长', text: '「孩子，今天也要把日子过得亮堂。」' },
    { who: null, text: '黑板报换新了，\n插画里的小人，画得有点像你。' },
    { who: '小狗煤球', text: '汪！（它叼来一根树枝，\n邀你进行一场友谊拔河。）' },
    { s: '春', who: null, text: '樱花树的花瓣飘进教室，\n同桌小心地把它们夹进课本。' },
    { s: '春', who: null, text: '操场的风筝越飞越高，\n线的那头连着整个春天。' },
    { s: '夏', who: null, text: '蝉声把整个下午拉得很长很长。' },
    { s: '夏', who: null, text: '冰棍儿化的比吃得快，\n夏天就是这样甜又着急。' },
    { s: '秋', who: null, text: '一片落叶恰好落在你肩上，\n像一封秋天的来信。' },
    { s: '秋', who: '田伯', text: '「秋收秋收，大地在发红包哩。」' },
    { s: '冬', who: null, text: '呵出的白气在空气里画圈，\n冬天把校园变得安静又干净。' },
    { s: '冬', who: null, text: '屋檐下挂起了亮晶晶的冰凌，\n像一排倒着长的水晶。' },
    { w: '雨', who: null, text: '蚂蚁们排着队搬家，\n队伍比升旗仪式还整齐。' },
    { w: '雨', who: '食堂阿姨', text: '「下雨天，汤免费续碗！」' },
    { w: '雨', who: null, text: '雨点敲着教室的窗，\n老师的声音也变得温柔。' },
    { w: '雪', who: null, text: '操场上的雪地干干净净，\n第一串脚印会属于谁呢？' },
    { w: '雾', who: '保安大爷', text: '「大雾天慢点走——\n雾里的校园，像另一所学校。」' },
    { night: true, who: null, text: '晚风把教学楼的灯吹得一闪一闪，\n像星星提前来上班了。' },
    { night: true, who: null, text: '萤火虫在草丛里提着灯笼巡逻，\n和天上的星星对上了暗号。' },
    { night: true, who: '猫头鹰', text: '咕——（它驮着信，剪开了夜幕。）' },
    { night: true, s: '夏', who: null, text: '池塘边的青蛙合唱团开演了，\n主唱跑调跑得理直气壮。' },
    { night: true, s: '秋', who: null, text: '秋夜的虫鸣一阵一阵，\n像谁在给月亮打拍子。' },
    { wd: 1, who: null, text: '周一的校园还带着一点刚收起周末的慵懒，\n连风都像在慢慢醒来。' },
    { wd: 5, who: '看台角落', text: '「今天周五啦——放学后操场见！」\n不知是谁先喊了一嗓子，整片操场都跟着热闹了。' },
    { wd: 6, who: null, text: '周六的校园松快了许多，\n脚步声都比平时更散更轻。' },
    { fest: '读书日', who: '图书馆门口的小牌子', text: '「今天是读书日，借书台旁多放了一筐旧书签。」' },
    { fest: '艺术节', who: null, text: '走廊里的作品板被擦得干干净净，\n连胶带边都贴得格外整齐。' },
    { fest: '友谊日', who: '广播站', text: '「今天记得和喜欢的人多说两句话。」\n喇叭里传来的提醒，难得温柔。' },
    // —— 后半周期新节日（day31-59） ——
    { fest: '冬日祭', who: '食堂阿姨', text: '「冬日祭特供：关东煮续汤不要钱！」\n热气把玻璃窗糊成了一片白。' },
    { fest: '观星夜', who: '天文台小黑板', text: '「今晚云量低，宜许愿。」\n（记得晚上抬头看看天）' },
    { fest: '年货街', who: null, text: '小镇主街挂满了红灯笼，\n空气里全是糖炒栗子的香味。' },
    { fest: '迎春运动会', who: '广播站', text: '「各就位——预备！」\n发令枪的回声在操场上空转了三圈。' },
    { fest: '踏青节', who: null, text: '后山的小路被人踩得发亮，\n每个人书包里都露出一角野餐布。' },
    { fest: '泡泡日', who: null, text: '低年级在操场吹泡泡，\n整个校园都泡在彩虹里。' },
    { fest: '纳凉晚会', who: '看台角落', text: '竹席、蒲扇和冰镇酸梅汤都就位了，\n就等太阳下班。' },
    { fest: '收获祭', who: '田伯', text: '「收获祭咯！园子里最沉的那串果子，\n留给最勤快的人。」' },
    { fest: '毕业预演', who: null, text: '礼堂门口在排练毕业歌，\n跑调的句子听着也让人鼻酸。' }
  ];
  function todayTale() {
    const c = ADV.Cal;
    if (!c) return null;
    const season = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }[c.seasonEn()];
    const day = c.day || 1;
    const fest = c.festival ? c.festival() : '';
    const pool = DAILY_TALES.filter(t =>
      (!t.s || t.s === season) &&
      (!t.w || (c.weather || '').indexOf(t.w) >= 0) &&
      (!t.wd || t.wd === c.weekday()) &&
      (!t.fest || t.fest === fest) &&
      (t.night === undefined || t.night === c.isNight()));
    if (!pool.length) return null;
    return pool[(day * 11 + 5) % pool.length];
  }
  function guideLine(mapId) {
    const f = F(), c = ADV.Cal;
    if (!f || !c || !f.introDone) return null;
    const stage = guideStage();
    if (mapId === 'town' && stage === 'arrival' && !f.touredTown) {
      return { flag: 'touredTown', mode: 'toast', text: ' 🧭 沿主街一直往东走，就能到学校 ' };
    }
    if (mapId === 'campus' && stage === 'arrival' && !f.touredCampus) {
      return {
        flag: 'touredCampus',
        mode: 'say',
        text: '穿过校门，喷泉就在校园中央。\n先去找校长报到吧。\n西门旁那块校务板，放学前记得回来打卡。'
      };
    }
    if (mapId === 'campus' && stage === 'settle' && !f.touredSettle) {
      return {
        flag: 'touredSettle',
        mode: 'say',
        text: '第一天不用赶进度。\n北边几栋楼里有老师，西门旁能打卡，\n先认认路，再决定今天想先做什么。'
      };
    }
    if (['classroom', 'library', 'lab', 'english'].includes(mapId) && stage === 'settle' && badgeCount() === 0 && !f.touredTeacher) {
      const tip = {
        classroom: '这里是王老师的教室，数学徽章很适合作为第一枚。',
        library: '这里是李老师常待的图书馆，语文徽章也很适合先来试试。',
        lab: '这里是陈老师的实验室，喜欢动手的话可以先拿科学徽章。',
        english: '这里是吴老师的外语楼，想轻快一点也能先试英语徽章。'
      }[mapId];
      return { flag: 'touredTeacher', mode: 'toast', text: ' 🎓 ' + tip + ' ' };
    }
    return null;
  }
  function chapterSceneLine(mapId) {
    const f = F();
    if (!f || !f.introDone) return null;
    const ch = chapterState();
    const scene = {
      ch1_badges: {
        campus: ' 🎒 第一章进行中：白天去教学楼拿徽章，放学后再把同学和小镇慢慢认识起来 ',
        town: ' 🏘 第一章里，小镇更像你每天往返学校的暑假走廊；放学后在这里最容易长出支线 '
      },
      ch1_gate: {
        campus: ' 🌲 石门已开后，校园不再只是校园了；最东侧的风已经和前几天不一样 ',
        backhill: ' 🗿 第一章尾声：后山的空气明显沉了下来，像在等你认真走近 '
      },
      ch2_letter: {
        campus: ' 🌙 第二章前夜：喷泉、夜色和钟声都在悄悄改变，记得多在晚上回校园看看 '
      },
      ch2_moon: {
        campus: ' 🌗 现在的校园有了双重面貌：白天是学校，夜里通往月光学院 ',
        moonhall: ' 🕯 第二章核心区域：分院、课程、暗门和回廊都会在这里慢慢展开 '
      },
      ch3_collect: {
        campus: ' 📷 第三章开始后，很多地方都更值得回头看一眼；照片和回忆就是主线的一部分 ',
        town: ' 🧺 回忆搜集阶段的小镇更重要了，别只盯着主线入口，旧照片和人情都藏在回头路上 ',
        homeYard: ' 🪴 庭院旧相册是钟楼钥匙的一半，回家别忘了在院子里多翻翻 '
      },
      ch3_timehall: {
        northyard: ' 🕰 钟楼已经不是装饰了；从这里往下走，学校真正的过去会一层层打开 ',
        timehall: ' ⏳ 第三章核心区域：每走过一个时代，你对这所学校的理解都会变一次 '
      },
      ch3_grad: {
        campus: ' 🎓 毕业礼前，校园里很多熟悉的地方都会像在和你轻轻告别 ',
        gradhall: ' 🎐 最后的仪式快到了，这里已经开始有那种郑重又柔软的气氛 '
      },
      epilogue: {
        campus: ' 🌻 主线结束后，这所学校更像一整个暑假生活场；很多补完内容正适合现在慢慢做 '
      }
    }[ch.id];
    return scene ? scene[mapId] || null : null;
  }
  function guideSoon(mapId) {
    if (['campus', 'town', 'classroom', 'library', 'lab', 'english'].indexOf(mapId) < 0) return;
    let tries = 0;
    (function attempt() {
      setTimeout(() => {
        const f = F(), c = ADV.Cal;
        if (!f || !c || !f.introDone) return;
        if (!ADV.Engine.map || ADV.Engine.map.id !== mapId) return;
        if (ADV.Game.busy || ADV.UI.busy || (ADV.Battle && ADV.Battle.active) || (ADV.Mini && ADV.Mini.active) || (ADV.Books && ADV.Books.active)) {
          if (++tries < 6) attempt();
          return;
        }
        const line = guideLine(mapId);
        if (!line) return;
        f[line.flag] = true;
        const p = line.mode === 'say' ? say({ text: line.text }) : Promise.resolve(UI().toast(line.text));
        p.then(() => save());
      }, 900);
    })();
  }
  function lifeBuzzLine(mapId) {
    const f = F(), c = ADV.Cal;
    if (!f || !c || !f.introDone) return null;
    const chapterScene = chapterSceneLine(mapId);
    if (chapterScene && c.period === 3) return chapterScene;
    const weekCN = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][c.weekday() - 1];
    const lesson = (c.today && c.today().length) ? c.today().join(' / ') : '今天没课';
    const fest = c.festival ? c.festival() : '';
    if (mapId === 'campus' && c.period === 3 && c.isFriday())
      return ' 🏃 今天是周五，操场和看台都比平时更兴奋；放学后的校园像在等一场正式开场 ';
    if (mapId === 'campus' && c.period === 3 && fest)
      return ` 🎊 今天是${fest}，校园里比平时更有节日气；去升旗台、教室和图书馆转转，常能看到不一样的小布置 `;
    if (mapId === 'campus' && c.period === 3 && c.weekday() <= 5)
      return ` 📚 ${weekCN}的课程刚刚结束：今天上的是 ${lesson}；这会儿的校园最像一天真正松下来的时候 `;
    if (mapId === 'town' && c.period >= 3 && c.weekday() >= 6)
      return ` 🛍 ${weekCN}的小镇比平日更慢也更满，店门口和河边都有人停下来过周末 `;
    const buzz = {
      campus: {
        3: ' 🌇 放学后的校园热闹起来了：操场有人跑圈，广播站在试音，现在最适合逛一圈或约同学同行 ',
        4: ' 🌆 傍晚的校园慢了下来：花坛边和食堂口都有人，西门附近也正适合打卡后再散散步 ',
        5: ' 🌙 夜里的校园安静了，多数同学回家了；想继续串门或闲逛，可以去小镇和栖霞小区 '
      },
      town: {
        3: ' 🏘 放学后的街区正热闹：书店、小吃摊和礼品店都开着，河边也很适合和朋友走走 ',
        4: ' 🍡 傍晚的小镇最有生活气：有人买点心，有人逛书店，秋千和长椅这会儿刚刚好 ',
        5: ' 🛋 夜里店铺陆续收摊了，河边和小区的灯倒是更暖了 '
      },
      estate: {
        4: ' 🏠 栖霞小区的灯慢慢亮了。和同学熟一点后，这会儿正适合去串门 ',
        5: ' 🪟 楼道里飘出晚饭香，很多故事都在这时候回到家里继续 '
      },
      oldstreet: {
        3: ' 📚 放学后的老街开始活起来了：漫画角、钟表铺门口和里巷拐角都容易碰见熟人 ',
        4: ' 🧵 傍晚的老街最像生活本身：窗里亮灯，巷口留香，慢慢走最容易撞见故事 ',
        5: ' 🌙 夜里的老街安静了些，但灯下和窗边还留着一点没散完的人气 '
      },
      riverbay: {
        4: ' 🌉 傍晚的河湾正适合停一会儿：桥边能听见练声，埠头和长椅也比白天更有人味 ',
        5: ' 🎐 夜色落到河面以后，灯串和水声会把这里变得特别慢，像专门留给散步和发呆 '
      },
      cultureHub: {
        2: ' 🧪 中午到放学前的活动带最适合闲逛：流通站、球场边和墙角小桌都开始有人停留 ',
        3: ' 🏃 放学后的活动带最有劲头：有人加练，有人写东西，整片区域像刚刚开始一天的第二场 ',
        4: ' 🎨 傍晚的活动带会慢下来一点，但人还没散，正适合去找熟人聊两句 '
      },
      orchard: {
        2: ' 🍐 中午的果园最亮，鸭塘和果树边都容易碰见来透气的人 ',
        3: ' 🌾 放学后的果园更像郊外秘密基地：风车田、鸭塘和小路上都藏着顺手可停的去处 ',
        4: ' 🌇 傍晚的果园开始收声了，只剩风和果香在慢慢把白天往下按 '
      },
      hillside: {
        0: ' 🌄 清晨的山脚最先醒：跑坡、竹影和微亮的灯，会让这片地方比别处更早有呼吸 ',
        1: ' 🍃 上午的山脚还带着凉意，适合慢慢走，也适合去晨跑坡碰碰运气 ',
        4: ' ✨ 傍晚之后山脚开始换一种安静，神龛、坡道和萤火谷像在等夜色自己落下来 '
      },
      transportHub: {
        3: ' 🚏 放学后的旧车站人最多：背着书包的、拎着菜的，都在等同一班车 ',
        4: ' 🚌 傍晚的站台开始报末班车的地名，铁轨边的风也凉了下来 ',
        5: ' 🌙 夜深了，旧车站只剩站牌灯还亮着，长椅上一片安静 '
      },
      seasonPlaza: {
        2: ' 🎪 中午的广场空得很，晒谷和影幕都摊在光里，正适合随便走走 ',
        3: ' 🎬 放学后的广场最热闹：庙会的摊子、影幕前的位置，都开始有人占 ',
        4: ' 🏮 傍晚一到，广场的灯就一串串亮起来；庙会和露天电影这会儿最像样 '
      },
      farmstead: {
        0: ' 🐓 清晨的农舍刚醒：鸡叫、灶烟和菜畦上的露水，都是最早的那一批 ',
        2: ' 🌾 正午的农舍晒得很暖，檐下和菜棚边都适合坐一会儿 ',
        4: ' 🍲 傍晚的农舍开始生火，院里飘出的味道能一路跟到田埂上 '
      }
    }[mapId];
    return buzz ? buzz[c.period] : null;
  }
  function lifeBuzzSoon(mapId) {
    if (['campus', 'town', 'estate', 'oldstreet', 'riverbay', 'cultureHub', 'orchard', 'hillside', 'transportHub', 'seasonPlaza', 'farmstead'].indexOf(mapId) < 0) return;
    let tries = 0;
    (function attempt() {
      setTimeout(() => {
        const f = F(), c = ADV.Cal;
        if (!f || !c || !f.introDone) return;
        if (!ADV.Engine.map || ADV.Engine.map.id !== mapId) return;
        if (ADV.Game.busy || ADV.UI.busy || (ADV.Battle && ADV.Battle.active) || (ADV.Mini && ADV.Mini.active) || (ADV.Books && ADV.Books.active)) {
          if (++tries < 6) attempt();
          return;
        }
        const line = lifeBuzzLine(mapId);
        if (!line) return;
        const slot = daySlot('lifeBuzz');
        const key = mapId + '_' + c.period;
        if (slot[key]) return;
        slot[key] = true;
        UI().toast(line);
        save();
      }, 900);
    })();
  }
  function chapterPulseSoon(mapId) {
    if (['campus', 'town', 'backhill', 'moonhall', 'northyard', 'timehall', 'homeYard', 'gradhall'].indexOf(mapId) < 0) return;
    let tries = 0;
    (function attempt() {
      setTimeout(() => {
        const f = F(), c = ADV.Cal;
        if (!f || !c || !f.introDone) return;
        if (!ADV.Engine.map || ADV.Engine.map.id !== mapId) return;
        if (ADV.Game.busy || ADV.UI.busy || (ADV.Battle && ADV.Battle.active) || (ADV.Mini && ADV.Mini.active) || (ADV.Books && ADV.Books.active)) {
          if (++tries < 6) attempt();
          return;
        }
        const line = chapterSceneLine(mapId);
        if (!line) return;
        const ch = chapterState();
        const slot = daySlot('chapterPulse');
        const key = ch.id + '_' + mapId;
        if (slot[key]) return;
        slot[key] = true;
        UI().toast(line);
        save();
      }, 700);
    })();
  }
  function taleSoon(mapId) {
    if (['campus', 'town', 'fields', 'park', 'moonhall'].indexOf(mapId) < 0) return;
    let tries = 0;
    (function attempt() {
      setTimeout(() => {
        const f = F(), c = ADV.Cal;
        if (!f || !c || !f.introDone || f.dailyTaleDay === c.day) return;
        if (!ADV.Engine.map || ADV.Engine.map.id !== mapId) return;
        if (ADV.Game.busy || ADV.UI.busy || (ADV.Battle && ADV.Battle.active) || (ADV.Mini && ADV.Mini.active) || (ADV.Books && ADV.Books.active)) {
          if (++tries < 6) attempt();               // 等对话/战斗结束再讲
          return;
        }
        const tale = todayTale();
        if (!tale) return;
        f.dailyTaleDay = c.day;
        const p = say(tale.who ? { name: tale.who, text: tale.text } : { text: tale.text });
        p.then(() => {
          if (tale.gold) { f.gold = (f.gold || 0) + tale.gold; UI().toast(' 💰 零花钱 +' + tale.gold + ' '); }
          logEvent('今日见闻：' + (tale.who || '校园一角'));
          save();
        });
      }, 900);
    })();
  }
  if (ADV.Engine && ADV.Engine.loadMap && !ADV.Engine.loadMap.__taleHook) {
    const realLoadMap = ADV.Engine.loadMap;
    ADV.Engine.loadMap = function (id, x, y, dir) {
      const r = realLoadMap.call(this, id, x, y, dir);
      try { guideSoon(id); } catch (e) {}
      try { chapterPulseSoon(id); } catch (e) {}
      try { lifeBuzzSoon(id); } catch (e) {}
      try { taleSoon(id); } catch (e) {}
      return r;
    };
    ADV.Engine.loadMap.__taleHook = true;
  }

  return {
    S, QUIZ, RIDDLES, MECHANISMS, BOND, BOND_META, STAGE_NAMES, SPELLS, save, load, hasSave, newGame, continueGame, gainBond, friend,
    exportSave, importSave, storageOk, validSave,        // 存档备份 / 存储探测 / 语义校验（供测试）
    nextGoal, questList, logEvent, npcMindLine, guideStage, chapterState,
    themeWeek, upcomingEvents, achievements, ngStart, CLUBS, RECIPES, QUEST_POOL, RUMORS,
    farmTick,                                             // 后院农场每日结算（睡觉时调用 / 供测试）
    HOTBAR_SLOTS, hotbarCur, hotbarSelect, hotbarToolMatch,   // 工具热键栏（星露谷式快捷执行）
    systemTour, sysToured, totalKp, contestRank,          // 体验收束导览 / 结算单 / 钓鱼大赛评分（供测试）
    FESTIVAL_LINKS, HELP_POOL, HEART_EVENTS,              // s6/s7/s8 数据表（供测试）
    get quickPick() { return quickPick; },
    set quickPick(v) { quickPick = v; },
    get flags() { return state.flags; },
    get friends() { return state.friends; },
    get hero() { return state.hero; },
    set hero(h) { state.hero = h; },
    get busy() { return state.busy; },
    set busy(v) { state.busy = v; }
  };
})();
