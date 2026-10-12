/* =========================================================
 * game-core.js —— 游戏剧情与闯关逻辑（批次十二拆分 1/8）
 * 状态与旗标 · 题库 · 剧本辅助 · 工具热键栏 · 友谊系统 · 学科奥赛 · 达人徽章
 * 原 js/game.js 剥离 IIFE 后按分节横幅切成连续 8 段：
 *   core → event → scene → quest → retro → town → life → save
 * 加载顺序即语义（顶层初始化保持原 monolith 顺序），
 * 八段共享全局词法作用域；导出面在末段 game-save.js 回填 ADV.Game。
 * ========================================================= */
window.ADV = window.ADV || {};
/* —— 批次十二：导出面在 game-save.js 末段以 `ADV.Game = { ... }` 回填 —— */
/* =========================================================
 * game.js —— 游戏剧情与闯关逻辑
 * 主线：收集 数学/语文/科学 三枚智慧徽章 → 打开后山石门
 *       → 通过神秘老人的最终试炼 → 通关（冒险仍将继续）
 * 全部剧情用 async/await 脚本编写，仿 RPG Maker 事件指令。
 * ========================================================= */
window.ADV = window.ADV || {};

  const SAVE_KEY = 'campus_adventure_save_v1';

  // 初始旗标（也是旧存档升级时合并的默认值）
  const blankFlags = () => ({
    name: '',                                           // 主角名字（开局自定义；空 = 用默认名「小智/小樱」）
    cheatDay: 0, cheatGold: 0,                          // 金钥匙彩蛋：已领的日额记录（cheatDay = 领取时的游戏日）
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
    buddyBoost: null,                                  // 驯兽导师「进化催化」：随行伙伴力/速 +1
    // —— 四师签名挑战 ——
    tgame: {},                                         // 各科签名挑战进度 { 科目: { lv: 1-4 } }（4 = 大师毕业）
    tkind: {},                                         // 各科玩法打卡 { 科目: { trial/hw/olymp/mini: true } }
    // —— 六挚友隐藏线（批次十一）——
    htale: {},                                         // 各挚友隐藏剧情已看段数 { id: 0-3 }
    htaleDay: {},                                      // 各挚友上一段隐藏剧情的游戏日（段间隔 2 天）
    capsuleDone: false,                                // 时光胶囊终章是否已播放
    // —— 时段自习（批次十四）——
    morningReadDay: 0, nightStudyDay: 0,               // 晨读 / 晚自习：上次完成的游戏日（当日 buff 判定）
    // —— 学业光荣榜（批次十五）——
    acadFirst: false, acadTopWeek: -1,                 // 是否登顶过（成就「全校第一」）/ 上次领登顶奖学金的周
    // —— 道德抉择事件池（批次十六）——
    moral: {},                                         // 本周目已做过的抉择 { 事件id: 'a'/'b' }
    moralPrev: {},                                     // 「上一个你」的抉择留底（NG+ 跨周目累积，事件重演时引用）
    // —— 温室（批次十九 · s2）——
    greenhouse: false,                                 // 温室已建成（田伯处高价购买；四季任意作物 + 喷淋自动浇水 + 乌鸦进不去）
    // —— 牧场盒孵蛋（批次二十 · P3）——
    ranch: {},                                         // 牧场盒寄存的同系对 { a: 图鉴id, b: 图鉴id }
    ranchEgg: null,                                    // 盒中的蛋 { fam, shiny, day }（shiny=异色亲本遗传位）
    eggSteps: 0,                                       // 带蛋散步步数计数（走满 300 步破壳）
    hatchedSpecies: {},                                // 孵化过的物种（首次邀请随行发「亲人加成」，一种一次）
    // —— NG+ 馆主再战（批次二十四 · P5）——
    badgeGold: {},                                     // 镀金徽章 { 科目: true }（强化试炼得胜；NG+ 每周目重收）
    badgeGoldAll: false,                               // 四科镀金集齐「全科宗师」（每周目一次）
    rematchDay: {},                                    // 各科强化试炼上次挑战的游戏日（败北当日锁重试）
    // —— 秘传技开近路（批次二十五 · P6）——
    hedgeCut: false                                    // 院墙灌木已剪开（修枝剪；小镇东北近路永久开通）
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

  /* 奥赛专项题库（C1 深化）：每科一组比日常题更有区分度的题——
   * 奥赛五题 = 主池抽 3 + 专项抽 2（都按当日种子轮换），专项题只进赛场不进课堂。 */
  const OLYMP_QUIZ = {
    math: [
      { q: '【奥赛专项】按规律填数：1、2、4、8、16、？', opts: ['24', '32', '20'], a: 1 },
      { q: '【奥赛专项】鸡兔同笼：3 个头、8 只脚，兔子有几只？', opts: ['1 只', '2 只', '3 只'], a: 0 },
      { q: '【奥赛专项】小明把糖分给 3 位同学每人 4 颗，还剩 2 颗——原来有几颗？', opts: ['12 颗', '14 颗', '10 颗'], a: 1 },
      { q: '【奥赛专项】时钟 3 点整，时针与分针的夹角是多少度？', opts: ['90°', '80°', '100°'], a: 0 },
      { q: '【奥赛专项】一根木头锯成 4 段要锯几次？', opts: ['3 次', '4 次', '5 次'], a: 0 }
    ],
    chinese: [
      { q: '【奥赛专项】"欲把西湖比西子"的下一句是？', opts: ['淡妆浓抹总相宜', '山色空蒙雨亦奇', '水光潋滟晴方好'], a: 0 },
      { q: '【奥赛专项】"但愿人长久"的下一句是？', opts: ['千里共婵娟', '天涯共此时', '月有阴晴圆缺'], a: 0 },
      { q: '【奥赛专项】"春风又绿江南岸"中"绿"字好在哪里？', opts: ['把春风写活了，像有动作', '只是说了颜色', '读起来顺口而已'], a: 0 },
      { q: '【奥赛专项】对对子："绿水"对哪一项最工整？', opts: ['青山', '蓝天', '操场'], a: 0 },
      { q: '【奥赛专项】"三顾茅庐"请出的贤才是？', opts: ['诸葛亮', '周瑜', '庞统'], a: 0 }
    ],
    science: [
      { q: '【奥赛专项】一天中影子最短的时刻大约是？', opts: ['正午', '清晨', '傍晚'], a: 0 },
      { q: '【奥赛专项】光在镜面上反射时，入射角与反射角的关系是？', opts: ['相等', '入射角更大', '反射角更大'], a: 0 },
      { q: '【奥赛专项】发生月食时，地球处在什么位置？', opts: ['太阳和月亮之间', '月亮和太阳的同一侧', '月亮的正后方'], a: 0 },
      { q: '【奥赛专项】铁生锈属于哪一种变化？', opts: ['化学变化', '物理变化', '没有变化'], a: 0 },
      { q: '【奥赛专项】离地面越高，大气压强会怎样？', opts: ['越小', '越大', '不变'], a: 0 }
    ],
    english: [
      { q: '【奥赛专项】"library" 的意思是？', opts: ['图书馆', '实验室', '医院'], a: 0 },
      { q: '【奥赛专项】He ___ to school by bus.（第三人称单数）', opts: ['goes', 'go', 'going'], a: 0 },
      { q: '【奥赛专项】There ___ a book on the desk.', opts: ['is', 'are', 'be'], a: 0 },
      { q: '【奥赛专项】"How many" 后面应该接？', opts: ['可数名词复数', '不可数名词', '动词原形'], a: 0 },
      { q: '【奥赛专项】Which one is a subject（科目）?', opts: ['science', 'banana', 'Sunday'], a: 0 }
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

  /* ==================== C1 学科奥赛线 ====================
   * 每季一场奥赛（科目按季轮换）：季节第 1-3 天在教室「奥赛公告栏」报名 →
   * 第 4-7 天备战期（讨教/作业/试炼里答对本科题攒备战度，满 3 点首错不计）→
   * 第 8 天开考：五题连答按错误数定名次。状态 f.olymp[seasonEn] = { reg, prep, rank } 只增不改。 */
  const OLYMP = {
    spring: { en: 'math',    cn: '数学', teacher: '王老师' },
    summer: { en: 'science', cn: '科学', teacher: '陈老师' },
    autumn: { en: 'chinese', cn: '语文', teacher: '李老师' },
    winter: { en: 'english', cn: '英语', teacher: '吴老师' }
  };
  const OLYMP_SEASONS = ['spring', 'summer', 'autumn', 'winter'];
  const OLYMP_RANK_CN = { 4: '冠军 🥇', 3: '亚军 🥈', 2: '季军 🥉', 1: '优秀奖' };
  function olympState() {
    const f = F(), C = ADV.Cal;
    const se = C.seasonEn();
    f.olymp = f.olymp || {};
    return { f, C, se, cfg: OLYMP[se], sd: ((C.day - 1) % 10) + 1, st: f.olymp[se] || null };
  }
  // 备战度：备战期（第 4-7 天）答对本科题 +1（ask() 统一挂接）
  function olympPrepTick(subject, correct) {
    if (!correct || !subject) return;
    const o = olympState();
    if (!o.st || !o.st.reg || o.st.rank != null) return;
    if (o.sd < 4 || o.sd > 7) return;
    if (o.cfg && o.cfg.en === subject) {
      o.st.prep = (o.st.prep || 0) + 1;
      if (o.st.prep % 3 === 0) UI().toast(` 🏆 奥赛备战：${o.cfg.cn}专项答对（备战度 ${o.st.prep}）`);
    }
  }
  // 开考：五题连答（备战满 3 点首错不计），错误数定名次
  async function olympContest() {
    const o = olympState(), f = o.f, cfg = o.cfg, stt = o.st;
    stt.rank = 0;                                                // 先占位防重入
    await say({ name: cfg.teacher, text: `【${o.C.season()}季 · ${cfg.cn}奥赛】现在开考！\n五道题连答——错得越少，名次越高。` });
    const wrongs = { n: 0 };
    let forgiven = (stt.prep || 0) >= 3;                         // 备战充分：首错当面划掉
    // 五题 = 主池抽 3 + 奥赛专项抽 2（各按当日种子轮换；专项库缺科时优雅降级为主池 5 题）
    const OQ = OLYMP_QUIZ[cfg.en] || [];
    const qs = seededShuffle(QUIZ[cfg.en], o.C.day * 17 + cfg.en.length).slice(0, 3)
      .concat(OQ.length ? seededShuffle(OQ, o.C.day * 23 + cfg.en.charCodeAt(0)).slice(0, 2) : []);
    const qs2 = seededShuffle(qs, o.C.day * 31 + cfg.en.length * 7);     // 专项位次也按日轮换
    await say({ name: cfg.teacher, text: `【${o.C.season()}季 · ${cfg.cn}奥赛】现在开考！\n五道题连答${OQ.length ? '（含两道奥赛专项）' : ''}——错得越少，名次越高。` });
    for (let i = 0; i < qs2.length; i++) {
      await ask(cfg.teacher, qs2[i], wrongs, null, cfg.en);
      if (forgiven && wrongs.n > 0) {
        forgiven = false; wrongs.n = 0;
        await say({ name: cfg.teacher, text: '备战期的努力我看见了——\n这题当我没看见，稳住！' });
      }
    }
    const rank = wrongs.n === 0 ? 4 : wrongs.n <= 1 ? 3 : wrongs.n <= 2 ? 2 : 1;
    stt.rank = rank;
    markTkind(cfg.en, 'olymp');                                  // 玩法打卡：学科奥赛
    const RW = { 4: [60, 6], 3: [30, 3], 2: [15, 1], 1: [5, 0] };
    const [g, cup] = RW[rank];
    f.gold = (f.gold || 0) + g;
    if (cup) addCup(cup);
    ADV.Audio.sfx(rank >= 3 ? 'fanfare' : 'correct');
    await say({ name: cfg.teacher, text: `成绩公布——${OLYMP_RANK_CN[rank]}！\n（奖金 💰 +${g}${cup ? ` · 学院分 +${cup}` : ''}）` });
    if (rank === 4) {
      f.olympGold = (f.olympGold || 0) + 1;
      f.olympWins = f.olympWins || {};
      f.olympWins[cfg.en] = true;
      if (!ADV.Collect.has('photos', 'p_olymp')) {
        ADV.Collect.gain('photos', 'p_olymp');
        await ADV.UI.itemGet('回忆照片 · 奥赛领奖台', '#ffd94c');
      }
      logEvent(`夺得${o.C.season()}季${cfg.cn}奥赛冠军`);
    } else {
      logEvent(`参加了${o.C.season()}季${cfg.cn}奥赛（${OLYMP_RANK_CN[rank]}）`);
    }
    save();
  }

  // 单题闯关：问题与选项同屏显示，答错给提示再答，直到答对
  async function ask(teacherName, item, wrongs, npc, subject) {
    const P = () => E().player;
    const order = shuffle(item.opts.map((_, i) => i));               // 选项洗牌：正确项位置随机
    const q2 = { q: item.q, opts: order.map(i => item.opts[i]), a: order.indexOf(item.a) };
    while (true) {
      const i = await choose(q2.opts, { cancelIndex: -1, caption: { name: teacherName, text: item.q } });
      if (ADV.Mistake) ADV.Mistake.answer(subject || '综合', q2, i);   // 学习闭环：统计+错题入本
      olympPrepTick(subject, i === q2.a);                            // 奥赛备战：备战期答对本科题攒备战度
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
    const office = ADV.Cal.period === 2;                         // 午休＝老师办公时间：答疑加成
    if (F().finalPassed) { await say({ name: teacher, text: opts.after || '你的传说我已经听说了。继续向前吧，孩子！' }); return; }
    if (F().badges[subject]) {
      /* —— 每日作业：徽章在手也能天天来练。
       * 题目按日期种子轮换（同一天固定、跨天不同），全对奖励轮换：
       * 课外书 → 昆虫图册 → 小动物图册，另加金币与学院分。 —— */
      const day = ADV.Cal.day;
      F().homeworkDay = F().homeworkDay || {};
      // —— NG+ 馆主再战（P5）：新学期重新拿到徽章、镀金徽章还没到手时，
      //    老师会先递上强化试炼的战书（五题 = 奥赛专项 3 + 主池 2）。 ——
      if (F().ngplus && !(F().badgeGold && F().badgeGold[subject]) && (F().rematchDay || {})[subject] !== day) {
        E().playAction(npc, 'read', 1.6);
        await say({ name: teacher, text: opts.rematch || '你身上有股老毕业生的气味……\n正好，我出了五道更难的题，敢不敢试试？' });
        const c = await choose(['接受强化试炼！', '先做今日作业', '今天先告辞……'], { caption: { name: teacher, text: '强化试炼，来吗？' } });
        if (c === 0) { await trialGold(opts, npc); return; }
        if (c === 2) { await say({ name: teacher, text: '好吧，这份战书随时为你留着。' }); return; }
        // 选「先做今日作业」→ 继续走下方日常作业流程
      }
      if (F().homeworkDay[subject] === day) {
        await say({ name: teacher, text: opts.hwDone || '今天的作业已经完成得很漂亮，回去好好休息吧，明天再来！' });
        return;
      }
      E().playAction(npc, 'read', 1.6);
      await say({ name: teacher, text: office
        ? (opts.hwOffice || '现在是午休办公时间，来答疑正合适。\n今天也留了三道作业题，全对奖励翻倍哦！')
        : (opts.hw || '徽章已经是你的了，但学问是一天天练出来的。\n今天也留了三道作业题，全对有奖励哦！') });
      const go = await choose(['做今日作业！', '今天先告辞……'], { caption: { name: teacher, text: '怎么样，来练练手？' } });
      if (go === 1) { await say({ name: teacher, text: '好吧，功课可别落下太久哦。' }); return; }
      const wrongs = { n: 0 };
      const qs = seededShuffle(QUIZ[subject], day * 31 + subject.length * 7 + subject.charCodeAt(0)).slice(0, 3);
      for (let i = 0; i < qs.length; i++) await ask(teacher, qs[i], wrongs, npc, subject);
      if (wrongs.n === 0) {
        F().homeworkDay[subject] = day;
        markTkind(subject, 'hw');                                // 玩法打卡：今日作业
        F().gold = (F().gold || 0) + (office ? 16 : 8);          // 办公时间作业：奖励翻倍
        addCup(office ? 2 : 1);
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
        await say({ name: teacher, text: office
          ? (opts.hwGreatOffice || '全对！趁着午休来答疑的孩子最出色。\n办公时间作业：金币 +16 · 学院分 +2，双倍拿好！')
          : (opts.hwGreat || '全对！功课做得漂亮，这份奖励拿好。\n金币 +8 · 学院分 +1，明天还有新题目！') });
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

    if (office) await say({ name: teacher, text: opts.officeIntro || '午休正好是我的办公时间——答错了也不要紧，我当面给你再讲一遍。' });
    const wrongs = { n: 0 };
    let forgiven = false;                                        // 办公时间：首错当面重讲、既往不咎
    const qs = shuffle(QUIZ[subject]).slice(0, 3);
    for (let i = 0; i < qs.length; i++) {
      let item = qs[i];
      // 第二题由大模型现场出（断网自动回退题库）
      if (i === 1 && window.ADV && ADV.AI && ADV.AI.available()) {
        const ai = await ADV.AI.question(subject, hard ? 'hard' : 'normal');
        if (ai && ai.q) item = { q: ai.q + (ai.ai ? ' ✦' : ''), opts: ai.opts, a: ai.a };
      }
      await ask(teacher, item, wrongs, npc, subject);
      if (office && !forgiven && wrongs.n > 0) {
        forgiven = true;
        wrongs.n = 0;                                            // 当面重讲一遍，这次的错不记账
        await say({ name: teacher, text: '办公时间就是用来答疑的——这题我重新讲了一遍，别再错啦。' });
      }
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
    markTkind(subject, 'trial');                                 // 玩法打卡：学科试炼
    F().badgeEver = F().badgeEver || { math: false, chinese: false, science: false, english: false };
    F().badgeEver[subject] = true;                               // 永久记录（石门主线不受每日重置影响）
    addGold(5);                                                  // 每日重新收集也有零花钱
    logEvent(`通过了${teacher}的试炼，拿到${badge}徽章`);
    gainBadge();
    await chapterMid(1);
  }

  /* ==================== NG+ 馆主再战：强化试炼（批次二十四 · P5） ====================
   * 新学期重新拿到徽章后，老师以「老对手」身份发起五题强化试炼：
   * 题组 = 奥赛专项 3 + 主池 2（比奥赛主池3+专项2更狠），按当日种子轮换；
   * 全对完胜（金币+30 学院分+3），错 1 题险胜（+15/+2），错 2+ 惜败（当日锁重试）。
   * 得胜徽章镀金（HUD 宝石描金框 + 石门宝石金圈）+ 授「X·宗师」称号；
   * 四科镀金集齐加冕「全科宗师」（金币+50 学院分+4，每周目一次）。 */
  const GOLD_TITLE = { math: '数学·宗师', chinese: '语文·宗师', science: '科学·宗师', english: '英语·宗师' };
  async function trialGold(opts, npc) {
    const { teacher, subject, badge } = opts;
    const f = F();
    f.rematchDay = f.rematchDay || {};
    f.rematchDay[subject] = ADV.Cal.day;
    E().playAction(npc, 'read', 1.6);
    await say({ name: teacher, text: opts.goldGo
      || '【强化试炼】五题连答——\n全对是完胜，错一题算险胜，再多就回去再练一年。' });
    const wrongs = { n: 0 };
    const OQ = OLYMP_QUIZ[subject] || [];
    const qs = OQ.length >= 3
      ? seededShuffle(OQ, ADV.Cal.day * 13 + subject.charCodeAt(0)).slice(0, 3)
          .concat(seededShuffle(QUIZ[subject], ADV.Cal.day * 7 + subject.length * 3).slice(0, 2))
      : shuffle(QUIZ[subject]).slice(0, 5);            // 专项库缺科 → 主池降级
    for (let i = 0; i < qs.length; i++) await ask(teacher, qs[i], wrongs, npc, subject);
    if (wrongs.n > 1) {
      E().playAction(npc, 'laugh', 1.4);
      await say({ name: teacher, text: opts.goldLose
        || `错了 ${wrongs.n} 次——这就是强化试炼的分量。\n回去再练练，明天再来找回场子。` });
      logEvent(`再战${teacher}的强化试炼，惜败（错 ${wrongs.n} 题）`);
      save();
      return;
    }
    const perfect = wrongs.n === 0;
    f.badgeGold = f.badgeGold || {};                   // 老档兜底（blankFlags 只增补空）
    f.badgeGold[subject] = true;
    ADV.Audio.sfx('fanfare');
    E().playAction(E().player, 'raise', 1.4);          // 玩家高举镀金徽章
    const title = GOLD_TITLE[subject] || badge + '·宗师';
    f.gold = (f.gold || 0) + (perfect ? 30 : 15);
    addCup(perfect ? 3 : 2);
    await UI().itemGet(badge + '徽章 · 镀金', '#ffd94c');
    await say({ name: teacher, text: perfect
      ? (opts.goldGreat || '五题全对……完美无瑕！\n这枚镀金徽章，你受之无愧！')
      : (opts.goldWin || '虽然手滑了一下，但这份实力做不了假。\n镀金徽章拿好——这就是我认可你的方式。') });
    UI().toast(` 🏅 强化试炼得胜！获得称号「${title}」· ${badge}徽章镀金 `);
    if (ADV.Growth) ADV.Growth.milestone(`🏅 再战${teacher}得胜，获得称号「${title}」`);
    logEvent(`再战${teacher}的强化试炼，赢得镀金${badge}徽章${perfect ? '（完胜）' : ''}`);
    // 四科镀金集齐 → 「全科宗师」大礼（每周目一次）
    const bg = f.badgeGold;
    if (bg.math && bg.chinese && bg.science && bg.english && !f.badgeGoldAll) {
      f.badgeGoldAll = true;
      f.gold = (f.gold || 0) + 50;
      addCup(4);
      UI().toast(' 👑 四科镀金徽章集齐！获得称号「全科宗师」· 金币 +50 · 学院分 +4 ');
      if (ADV.Growth) ADV.Growth.milestone('👑 四科镀金徽章集齐，获得称号「全科宗师」');
      logEvent('集齐四科镀金徽章，加冕「全科宗师」');
    }
    save();
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

