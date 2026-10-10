/* =========================================================
 * game-save.js —— 拆分段 8/8：存档 · NG+ · 心级 · 隐藏线 · 闲聊 · 导出面
 * 存档 · NG+ 重逢 · 心级事件 · 隐藏线/时光胶囊 · 闲聊系统 · 导出面
 * 末尾 `ADV.Game = { ... }` 回填完整导出面（含 flags/friends/busy/quickPick 存取器）。
 * ========================================================= */
  /* ==================== 存档 ==================== */
  let _hasSave = null;               // hasSave 结果缓存（save / 导入后失效）
  let _storageOk = null;             // localStorage 可用性探测（缓存）
  let _saveWarned = false;           // 存储失败只提醒一次，别每步都弹
  // 双槽影子存档（P2-7 遗留）：主档之外每次交替写 a/b，永远保留上一代进度；
  // 主档缺失或损坏时 load() 自动回退到影子槽，不再一坏就丢档
  const SAVE_SLOTS = [SAVE_KEY + '_a', SAVE_KEY + '_b'];
  let _slotFlip = false;             // 下一次影子写进哪个槽（false=a，true=b）

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
      try {                                                    // 影子槽写失败不影响主档（配额紧张时退化为单槽）
        localStorage.setItem(SAVE_SLOTS[_slotFlip ? 1 : 0], JSON.stringify(data));
        _slotFlip = !_slotFlip;
      } catch (e1) {}
      _hasSave = true;
    } catch (e) {
      // 存储失败（隐私模式/配额满）不再静默：提示一次 + 指路手动备份
      if (!_saveWarned) {
        _saveWarned = true;
        try { UI().toast(' ⚠ 进度无法保存（浏览器存储不可用），可在标题页「导出存档」手动备份 '); } catch (e2) {}
      }
    }
  }
  /* 读单个槽位：JSON 解析 + 语义校验 + 旧档升级，任何一步失败都视为槽位不可用 */
  function readSlot(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!validSave(d)) return null;
      // 旧档升级：合并全部默认旗标，保证新增字段存在
      if (d && d.flags) d.flags = { ...blankFlags(), ...d.flags, badges: { ...blankFlags().badges, ...d.flags.badges } };
      return d;
    } catch (e) { return null; }
  }
  function load() {
    const d = readSlot(SAVE_KEY);
    if (d) return d;
    for (const k of SAVE_SLOTS) {          // 主档缺失/损坏 → 影子槽自动回退
      const sd = readSlot(k);
      if (sd) {
        try { UI().toast(' ⚠ 主存档读取失败，已从备用槽恢复上一份进度 '); } catch (e) {}
        return sd;
      }
    }
    return null;
  }
  function hasSave() {
    if (_hasSave === null) _hasSave = !!load();      // 标题页每帧都问，缓存避免反复解析大 JSON
    return _hasSave;
  }

  /* —— 存档导出 / 导入（Base64 文本，可粘贴备份 / 换设备） —— */
  function exportSave() {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) for (const k of SAVE_SLOTS) {              // 主档缺失时退而导出影子槽
      raw = localStorage.getItem(k);
      if (raw) break;
    }
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

  /* —— 主角名字：开局可自定义（8 字内）；空串回落默认名（选人画面同款） —— */
  const HERO_NAMES = { hero_boy: '小智', hero_girl: '小樱' };
  function sanitizeName(n) {
    return String(n == null ? '' : n).trim().slice(0, 8);
  }
  function playerName() {
    return (state.flags && state.flags.name) ? state.flags.name : (HERO_NAMES[state.hero] || '小勇');
  }

  /* —— 金钥匙：口令换金币的彩蛋（工具条 🔑 → prompt 输入口令）——
     每次转动 +1000 金，同一游戏日累计上限 3000；跨天自动重置额度。口令大小写/首尾空白宽容。 —— */
  const KEY_GRANT = 1000, KEY_DAILY = 3000;
  function goldenKey(raw) {
    const code = String(raw == null ? '' : raw).trim().toLowerCase();
    if (code !== 'givememoney') return { ok: false, msg: ' ⚠ 口令不识别，金钥匙纹丝不动 ' };
    const f = F(), day = (ADV.Cal && ADV.Cal.day) || 0;
    if (f.cheatDay !== day) { f.cheatDay = day; f.cheatGold = 0; }     // 跨天 → 额度清零重来
    if (f.cheatGold >= KEY_DAILY) return { ok: false, msg: ' ⚠ 今日金钥匙已领满（上限 3000 金），明天再来吧 ' };
    f.cheatGold += KEY_GRANT;
    f.gold += KEY_GRANT;
    save();                                             // 立刻落盘，白来的金币不放手滑丢
    return { ok: true, gained: KEY_GRANT, left: KEY_DAILY - f.cheatGold };
  }

  function newGame(hero, withIntro, name) {
    state.hero = hero;
    state.flags = blankFlags();
    state.flags.name = sanitizeName(name);               // 开局命名（第三参，可省略）
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
  /* —— 体验批次十一：六挚友隐藏线（心里话后解锁）——
   * 每位挚友在听完心里话（heartDone）后开启 3 段隐藏剧情：第一段下次对话即可触发，
   * 之后每段间隔 2 个游戏日；各线第三段把「一封信」投进时光胶囊；
   * 六封信集齐 → 与任一挚友对话触发时光胶囊终章（六人齐聚老樟树，埋胶囊、读信、合影）；
   * NG+ 终章走「重新挖开去年那颗胶囊」变体。 */
  const HIDDEN_TALES = {
    xiaohong: [
      { pages: [
        { name: '小红', text: '「跟你说个只有你知道的事——\n每次比赛前，我手心全是汗。」\n她摊开手心，又飞快握住。' },
        { name: '小红', text: '「发卡其实是心理安慰。\n真正让我安心的，是起跑前回头——\n总能看见你站在跑道边。」' },
      ] },
      { pages: [
        { name: '小红', text: '「四年级运动会，我扭了脚，\n躲在器材室哭。有个人递给我一瓶水，\n什么都没问就走了。」' },
        { name: '小红', text: '「我一直想再说声谢谢。\n后来你转学过来，我第一眼就觉得——\n原来我们早就见过啦。」' },
      ] },
      { pages: [
        { name: '小红', text: '「给一年后的我写封信吧，你说写什么好？」\n她没等回答，笑着写下第一行。' },
        { name: '小红', text: '「——希望我还在跑。\n还在和你们，一起跑。」\n她把信折成纸飞机的形状，投进了胶囊。' },
      ] },
    ],
    xiaoming: [
      { pages: [
        { name: '小明', text: '「我的投稿被拒了！理由是——\n『主角太普通，没有记忆点』。」' },
        { name: '小明', text: '「可是普通人才会去冒险啊！\n……诶，你刚才皱眉的样子——\n就是分镜里缺的那格！借我画一下！」' },
      ] },
      { pages: [
        { name: '小明', text: '他带你溜上教学楼天台的角落：\n「我的秘密基地。从这儿能看见全校。」' },
        { name: '小明', text: '「下一话，我不想画冒险王一个人了。\n想画我们六个人，把日常画成大冒险——\n你已经出现在第三格了，别乱动！」' },
      ] },
      { pages: [
        { name: '小明', text: '「最终话的结局，我写好了。」\n他把信封捂在胸口，一脸郑重。' },
        { name: '小明', text: '「先封印进时光胶囊！等打开那天——\n我们一起验证，冒险王的结局\n是不是和现实一样热血！」' },
      ] },
    ],
    wuyun: [
      { pages: [
        { name: '乌云', text: '清晨的道场，他一个人在擦木人桩。\n桩身一道旧裂痕，被摩挲得发亮。' },
        { name: '乌云', text: '「留级那年打裂的。师傅说要给我换新的。\n我没换——裂痕也是练过的证据。」' },
      ] },
      { pages: [
        { name: '乌云', text: '「旧学校寄来一封信，说要『再分高下』。」\n他捏着信纸，半天没说话。' },
        { name: '乌云', text: '「你陪我写封回信吧。\n就写——这次不用分高下，\n我来把当年没打完的招呼打完。」' },
      ] },
      { pages: [
        { name: '乌云', text: '「我的信，只有一句话。」\n他写完折好，动作难得地轻。' },
        { name: '乌云', text: '「——输赢写不完的，\n都写在朋友里了。」' },
      ] },
    ],
    dazhuang: [
      { pages: [
        { name: '大壮', text: '「广播站那只老喇叭，其实是我修好的。」\n他挠挠头，「但我跟张叔说是他修的。」' },
        { name: '大壮', text: '「张叔快退休啦。\n人老了，就想再多被需要一阵子。」\n他笑得憨憨的，「这事儿你知我知。」' },
      ] },
      { pages: [
        { name: '大壮', text: '「跟你说个丢人的——我怕黑。\n小时候被反锁在储藏室，一下午。」' },
        { name: '大壮', text: '你陪他把储藏室的灯换成了暖色。\n他按了三次开关，最后一次笑了：\n「……嗯，现在里面住着太阳了。」' },
      ] },
      { pages: [
        { name: '大壮', text: '他给时光胶囊配了一把小锁，\n用爷爷的扳手一点一点拧紧。' },
        { name: '大壮', text: '「爷爷说，扳手要传给最信得过的兄弟。\n锁也是——六把『钥匙』，\n就是咱们六个人，缺一个都打不开。」' },
      ] },
    ],
    xiaoying: [
      { pages: [
        { name: '小影', text: '「我偷偷投稿了市里的绘画比赛。\n主题是『看不见的人』。」' },
        { name: '小影', text: '「我画的是每天清晨扫操场的那个人。\n……别告诉别人，我还挺怕输的。」\n她把画册往怀里抱紧了一点。' },
      ] },
      { pages: [
        { name: '小影', text: '「其实我分不太清红色和绿色。」\n她说得很轻，「颜料都是靠贴标签记的。」' },
        { name: '小影', text: '你陪她把颜料管重新标了一遍。\n「所以我的画里，人是用形状记住的——\n你就是那种，一眼就认得出的形状。」' },
      ] },
      { pages: [
        { name: '小影', text: '她的信封比别人的厚——\n里面是一张小小的画。' },
        { name: '小影', text: '「画放进胶囊会褪色吧？没关系。\n颜色我记住了，\n闭上眼睛也都在。」' },
      ] },
    ],
    lufei: [
      { pages: [
        { name: '陆飞', text: '「告诉你个秘密——我起跑超烂的。\n全队倒数那种。全靠后程追。」' },
        { name: '陆飞', text: '「所以别怕开头慢。\n人生这条道长着呢，\n风都在后半程等你。」' },
      ] },
      { pages: [
        { name: '陆飞', text: '他翻开手机里的计时 App：\n每个人的成绩都记着，一页一页。' },
        { name: '陆飞', text: '「你的第一条——八分半，跑一半就喘。」\n他笑得特别得意，「我都留着。\n人要记得自己从哪儿开始跑的。」' },
      ] },
      { pages: [
        { name: '陆飞', text: '他的信封里是一张空白的计时纸条。' },
        { name: '陆飞', text: '「等打开胶囊那天，我们再跑一次——\n把新成绩写上去。\n这叫……和过去的自己同场竞技！」' },
      ] },
    ],
  };
  // 在对话包装器里调用：心里话之后逐段解锁隐藏剧情（第一段即刻，之后每段间隔 2 天）
  async function maybeHiddenTale(id) {
    const f = F();
    const tale = HIDDEN_TALES[id];
    if (!tale || !f.heartDone[id] || f.capsuleDone) return false;
    const done = f.htale[id] || 0;
    if (done >= tale.length) return false;
    if (done > 0 && ADV.Cal.day - (f.htaleDay[id] || 0) < 2) return false;
    f.htale[id] = done + 1;
    f.htaleDay[id] = ADV.Cal.day;
    ADV.Audio.sfx('emote');
    const np = E().getNpc(id); if (np) E().playAction(np, 'shy', 1.4);
    for (const p of tale[done].pages) await say(p);
    gainBond(id, 2);
    addCup(2);
    save();
    if (done === tale.length - 1) {
      const letters = HEART_IDS.filter(k => (f.htale[k] || 0) >= HIDDEN_TALES[k].length).length;
      UI().toast(` 🫙 ${BOND[id] ? BOND[id].name : id}把信投进了时光胶囊（${letters}/${HEART_IDS.length}）`);
      if (letters >= HEART_IDS.length) UI().toast(' 📮 六封信都齐了——放学后的老樟树下，好像有人在等你 ');
    } else {
      UI().toast(` 🌙 ${BOND[id] ? BOND[id].name : id}的隐藏剧情 ${done + 1}/${tale.length} · 好感 +2 `);
    }
    return true;
  }
  // 时光胶囊终章：六条隐藏线全部完成后，与任一挚友对话触发（NG+ 走重挖变体）
  async function capsuleFinale(id) {
    const f = F();
    if (!HIDDEN_TALES[id] || f.capsuleDone) return false;
    if (!HEART_IDS.every(k => (f.htale[k] || 0) >= HIDDEN_TALES[k].length)) return false;
    f.capsuleDone = true;
    ADV.Audio.sfx('emote');
    if (f.ngplus) {
      await say({ text: '放学前，五个人不约而同把你拉到操场东边的老樟树下。\n树底下有个浅浅的旧坑——去年埋胶囊的地方。' });
      await say({ name: '大壮', text: '「坑还在！胶囊……咦，胶囊不见了？」' });
      await say({ name: '小红', text: '「张叔！」——正在巡逻的张叔从口袋里\n掏出那把小锁的胶囊：「就知道你们会回来。\n去年就等着看你们挖坑的样子呢。」' });
      await say({ name: '乌云', text: '「……连信都没受潮。开锁吧，六把『钥匙』都到齐了。」' });
      await say({ text: '六封信读到最后，胶囊底部还压着第七封——\n没有署名，字迹却眼熟：' });
      await say({ text: '『致又一年夏天：学校记得每一个认真跑过操场的孩子。\n——你们的老朋友』' });
      await say({ name: '小影', text: '（她在速写本上飞快地画：六个读信的人，\n和一棵把影子借给所有人的老樟树。）' });
      await say({ name: '陆飞', text: '「新学期第一条纪录，从现在开始计时——\n目标：把这年也跑成值得埋起来的样子！」' });
    } else {
      await say({ text: '放学前，五个人不约而同把你拉到操场东边的老樟树下。\n大壮扛着铁锹，小明抱着画板，乌云拎着那只上锁的胶囊。' });
      await say({ name: '大壮', text: '「坑我挖好了！按规矩——\n六封信一起放，锁一起上。」' });
      await say({ text: '就在胶囊落进坑里的时候——' });
      await say({ name: '乌云', text: '「……我说，等什么一年。\n信都写了，现在就想听。」' });
      await say({ name: '小明', text: '「有道理！堆沙漏不如现在读——」\n「那是成语都让你说串了，但同意！」' });
      await say({ text: '于是六个人围着小坑坐成一圈，把胶囊又挖了出来。\n大壮的锁拧开，六封信一人一封，谁也没先偷看别人的。' });
      await say({ text: '读信声、笑声，还有小影偷偷抹眼睛的吸鼻子声，\n混在傍晚的风里。' });
      await say({ name: '小红', text: '「重新埋回去之前——来拍照！\n一年后的我们，要对着照片来对暗号！」' });
      await say({ text: '快门按下：六个人、一棵树、一坑黄昏。\n这就是你们和这所学校的约定。' });
    }
    HEART_IDS.forEach(k => gainBond(k, 3));
    addCup(30);
    ADV.Collect.gain('photos', 'p_capsule');
    save();
    logEvent(f.ngplus ? '在新学期重新打开了时光胶囊' : '埋下并打开了时光胶囊，读完六封给彼此的信');
    UI().toast(f.ngplus
      ? ' ⏳ 时光胶囊·新学期 · 全员好感 +3 · 学院分 +30 '
      : ' ⏳ 时光胶囊终章 · 全员好感 +3 · 学院分 +30 ');
    return true;
  }
  S._htale = id => maybeHiddenTale(id);          // 测试钩子：隐藏剧情逐段推进
  S._capsule = () => capsuleFinale('xiaohong');  // 测试钩子：终章直达（条件仍需满足）
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
      // 批次十一：时光胶囊终章（六线全完）→ 六挚友隐藏线（心里话后逐段解锁）
      if (BOND[k] && await capsuleFinale(k)) return;
      if (BOND[k] && await maybeHiddenTale(k)) return;
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

ADV.Game = {
    S, QUIZ, RIDDLES, MECHANISMS, BOND, BOND_META, STAGE_NAMES, SPELLS, save, load, hasSave, newGame, continueGame, gainBond, friend,
    exportSave, importSave, storageOk, validSave,        // 存档备份 / 存储探测 / 语义校验（供测试）
    playerName, HERO_NAMES,                              // 主角名（开局自定义；HUD/序章消费，供测试）
    goldenKey,                                           // 金钥匙彩蛋（口令 → +1000 金，游戏日限 3000）
    nextGoal, questList, logEvent, npcMindLine, guideStage, chapterState,
    themeWeek, upcomingEvents, achievements, growthReport, ngStart, OLYMP, OLYMP_QUIZ, OFFICE_LINES, FORGES, CLUBS, RECIPES, QUEST_POOL, RUMORS, DISH_BUFF, BUFF_META, buffActive, olympPrepTick, classicReadTick,
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
