/* =========================================================
 * maps.js —— 地图数据
 * 用建造函数程序化拼地图：校园 44×34、各室内场景 30×20、后山 30×20
 * events: npcs(NPC) / doors(传送门) / inters(调查事件) / objects(立体物件)
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.Maps = (function () {

  // —— 建造工具 ——
  function base(id, name, w, h, opt) {
    opt = opt || {};
    return {
      id, name, w, h,
      g: Array.from({ length: h }, () => Array(w).fill(opt.fill || 'grass')),
      objects: [], npcs: [], doors: [], inters: [],
      bgm: opt.bgm || 'campus',
      indoor: !!opt.indoor,
      particles: opt.particles || null,
      spawn: opt.spawn || null
    };
  }
  const set = (m, x, y, t) => { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.g[y][x] = t; };
  function rect(m, x, y, w, h, t) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(m, i, j, t);
  }
  // 矩形边框（跑道等）
  function ring(m, x, y, w, h, t) {
    for (let i = x; i < x + w; i++) { set(m, i, y, t); set(m, i, y + h - 1, t); }
    for (let j = y; j < y + h; j++) { set(m, x, j, t); set(m, x + w - 1, j, t); }
  }
  // 树木物件
  function tree(m, x, y, v) { m.objects.push({ kind: 'tree', x, y, w: 1, h: 2, v: v || ((x * 7 + y * 13) % 3), solidTiles: [[0, 1]] }); }
  function trees(m, list) { list.forEach(([x, y]) => tree(m, x, y)); }

  /* 建筑物：roof 2 行 + 墙体 + 门 + 门匾 + 窗
   * opts: { roof, name, to:[map,x,y,dir], ivy:true 爬山虎立面（季节变色，教学楼经典意象） }
   */
  function building(m, x, y, w, h, opts) {
    rect(m, x, y, w, 2, opts.roof);
    const cx = x + (w >> 1);
    const doorY = y + h - 1;
    for (let j = y + 2; j < doorY; j++) rect(m, x, j, w, 1, 'wall');
    rect(m, x, doorY, w, 1, 'wall');
    // 窗户：中间层
    for (let i = x + 1; i < x + w - 1; i += 2)
      if (Math.abs(i - cx) > 1) set(m, i, y + 2, 'wallWin');
    // 爬山虎：从墙脚向上攀爬，约半数墙面被藤蔓覆盖（避开窗与门匾行）
    if (opts.ivy) {
      for (let j = y + 2; j <= doorY - 2; j++)
        for (let i = x; i < x + w; i++) {
          if (m.g[j][i] !== 'wall') continue;
          if ((i * 31 + j * 17 + x * 7) % 10 < 5) set(m, i, j, 'ivyWall');
        }
    }
    // 门匾与门（to 为 null 时只画门不开门——装饰立面）
    set(m, cx, doorY - 1, 'plaque:' + opts.name);
    set(m, cx, doorY, 'doorWood');
    if (opts.to) m.doors.push({ x: cx, y: doorY, to: opts.to });
  }
  function apartmentBlock(m, x, y, w, h, opts) {
    opts = opts || {};
    const doors = opts.doors || [];
    rect(m, x, y, w, 2, opts.roof || 'roofB');
    for (let j = y + 2; j < y + h; j++) rect(m, x, j, w, 1, 'aptWall');
    // 两排窗户，避开门位和门牌
    [y + 2, y + 4].filter(row => row < y + h - 1).forEach(row => {
      for (let i = x + 1; i < x + w - 1; i += 2) {
        if (doors.some(d => Math.abs((x + d.dx) - i) <= 1)) continue;
        set(m, i, row, 'aptWin');
      }
    });
    const doorY = y + h - 1;
    doors.forEach(d => {
      const dx = x + d.dx;
      if (dx <= x || dx >= x + w - 1) return;
      set(m, dx, doorY - 1, 'plaque:' + d.name);
      set(m, dx, doorY, 'aptDoor');
      m.inters.push({ x: dx, y: doorY, s: d.s });
    });
  }

  /* ==================== 校园主地图 ==================== */
  function campus() {
    const m = base('campus', '阳光中学 · 校园', 54, 34, { fill: 'grass', bgm: 'campus', particles: 'fountain' });

    // —— 道路 ——
    rect(m, 21, 8, 2, 25, 'path');          // 主干道（南北）
    rect(m, 5, 7, 48, 2, 'path');           // 横干道（东西，直通石门）
    rect(m, 36, 9, 1, 21, 'path');          // 通往食堂
    set(m, 35, 29, 'path'); set(m, 37, 29, 'path'); set(m, 36, 29, 'path'); // 食堂门前
    rect(m, 48, 15, 1, 9, 'path');          // 通往音乐教室
    rect(m, 51, 8, 2, 12, 'path');          // 通往藏宝洞窟

    // —— 中央广场 ——
    rect(m, 16, 10, 12, 10, 'stone');
    m.objects.push({ kind: 'fountain', x: 21, y: 15, w: 2, h: 2, s: 'moonDoor', solidTiles: [[0, 0], [1, 0], [0, 1], [1, 1]] });
    [[18, 9], [25, 9], [18, 20], [25, 20]].forEach(([x, y]) => m.objects.push({ kind: 'lamp', x, y, w: 1, h: 2, solidTiles: [[0, 1]] }));
    [[17, 13], [26, 13], [17, 16], [26, 16]].forEach(([x, y]) => m.objects.push({ kind: 'bench', x, y, w: 1, h: 1, solidTiles: [[0, 0]] }));

    // —— 广场点缀：花坛 / 光荣榜 / 升旗台 ——
    m.objects.push({ kind: 'flowerbed', x: 16, y: 10, w: 2, h: 1, s: 'flowerbed', solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'flowerbed', x: 26, y: 10, w: 2, h: 1, s: 'flowerbed', solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'board', x: 24, y: 10, w: 2, h: 2, s: 'honorBoard', solidTiles: [[0, 1], [1, 1]] });
    m.objects.push({ kind: 'board', x: 19, y: 19, w: 2, h: 2, s: 'campusBoard', solidTiles: [[0, 1], [1, 1]] });  // 校园公告栏（每日刷新）
    m.objects.push({ kind: 'flagpole', x: 23, y: 8, w: 1, h: 2, s: 'flagpole', solidTiles: [[0, 0]] });

    // —— 五栋教学建筑 ——
    building(m, 4, 2, 11, 5, { roof: 'roofB', name: '实验楼', to: ['lab', 15, 18, 'up'] });
    building(m, 17, 2, 10, 6, { roof: 'roofR', name: '教学楼', to: ['classroom', 15, 18, 'up'], ivy: true });
    building(m, 29, 2, 9, 5, { roof: 'roofT', name: '图书馆', to: ['library', 15, 18, 'up'], ivy: true });
    building(m, 39, 2, 6, 5, { roof: 'roofP', name: '外语楼', to: ['english', 15, 18, 'up'], ivy: true });
    building(m, 31, 24, 10, 5, { roof: 'roofO', name: '食堂', to: ['canteen', 15, 18, 'up'] });
    building(m, 40, 9, 8, 6, { roof: 'roofG', name: '体育馆', to: ['gym', 15, 18, 'up'] });
    building(m, 44, 24, 8, 5, { roof: 'roofY', name: '音乐教室', to: ['music', 15, 18, 'up'] });

    // —— 操场（西南） ——
    ring(m, 3, 23, 12, 9, 'track');
    rect(m, 6, 25, 6, 4, 'court');
    // 体育设施：足球门（球场西侧）/ 看台 + 彩旗（北侧）/ 沙坑（跳远）
    m.objects.push({ kind: 'goal', x: 4, y: 26, w: 2, h: 2, s: 'goalKick', solidTiles: [[0, 1], [1, 1]] });
    m.objects.push({ kind: 'bleachers', x: 3, y: 21, w: 2, h: 2, s: 'bleachers', solidTiles: [[0, 1], [1, 1]] });
    m.inters.push({ x: 4, y: 23, s: 'grandstandStrap' });   // 看台座椅缝：陆飞微剧情的腕带落点
    m.objects.push({ kind: 'flags', x: 6, y: 21, w: 2, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'flags', x: 13, y: 21, w: 2, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'sandpit', x: 7, y: 29, w: 2, h: 1, s: 'sandpit', solidTiles: [[0, 0], [1, 0]] });
    // 体育节主席台（周五三连赛入口）
    m.objects.push({ kind: 'sign', x: 2, y: 21, w: 1, h: 2, text: '主席台', solidTiles: [[0, 1]], s: 'sportsDay' });
    // 童年玩法点位：跳房子粉笔格 / 弹珠圈 / 雪仗空地（冬季限定）
    m.objects.push({ kind: 'sign', x: 5, y: 29, w: 1, h: 1, text: '房子', solidTiles: [[0,0]], s: 'hopscotch' });
    m.objects.push({ kind: 'sign', x: 13, y: 24, w: 1, h: 1, text: '弹珠', solidTiles: [[0,0]], s: 'marbles' });
    m.objects.push({ kind: 'sign', x: 12, y: 29, w: 1, h: 1, text: '雪', solidTiles: [[0,0]], s: 'snowfight' });
    // 大课间广播喇叭（午休广播体操）
    m.objects.push({ kind: 'sign', x: 11, y: 22, w: 1, h: 2, text: '广播', solidTiles: [[0, 1]], s: 'radio' });

    // —— 东侧池塘（支线：小红的发卡） ——
    rect(m, 37, 15, 5, 5, 'sand');
    rect(m, 38, 16, 3, 3, 'water');
    m.inters.push({ x: 39, y: 16, s: 'pond' });
    set(m, 37, 14, 'grass2'); set(m, 42, 16, 'grass2'); set(m, 42, 19, 'grass2');

    // —— 校门（南侧） ——
    set(m, 19, 33, 'gateWall'); set(m, 26, 33, 'gateWall');
    for (let x = 20; x <= 25; x++) set(m, x, 33, 'gateBar');
    for (let x = 20; x <= 25; x++) m.inters.push({ x, y: 33, s: 'gate' });

    // —— 东侧：后山石门（已随校园扩建迁到最东边） ——
    rect(m, 51, 4, 2, 4, 'mossStone');
    m.objects.push({
      id: 'stoneDoor', kind: 'stoneDoor', x: 51, y: 1, w: 2, h: 3, open: false, s: 'stoneDoor',
      solidTiles: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]
    });
    m.doors.push({ x: 51, y: 3, to: ['backhill', 15, 17, 'up'], need: 'gateOpen' });
    m.doors.push({ x: 52, y: 3, to: ['backhill', 14, 17, 'up'], need: 'gateOpen' });

    // —— 东南：藏宝洞窟入口（老矿工常驻洞口，第三张碎片的来源；洞窟开启前他是唯一线索人） ——
    m.objects.push({ kind: 'caveMouth', x: 52, y: 16, w: 1, h: 2, s: 'caveEntrance', solidTiles: [[0, 0]] });
    m.doors.push({ x: 52, y: 18, to: ['cave', 17, 22, 'up'], need: 'caveOpen' });
    m.doors.push({ x: 52, y: 19, to: ['cave', 18, 22, 'up'], need: 'caveOpen' });
    m.npcs.push({ id: 'miner', x: 51, y: 17, dir: 'right', pal: 'miner', name: '老矿工', s: 'miner', acts: ['think', 'doubt'] });

    // —— 边界树林（北门/西门开口；树碰撞在下方一格，须让开西门门砖） ——
    for (let y = 0; y < 34; y++) { tree(m, 0, y); tree(m, 53, y); }
    for (let x = 1; x < 53; x++) { if ((x < 19 || x > 26) && x !== 45 && x !== 46) tree(m, x, 0); }
    for (let x = 1; x < 53; x++) if (x < 19 || x > 26) tree(m, x, 33);
    // 西门两侧让位（树(0,13)(0,14)会挡住门砖(0,14)(0,15)）
    m.objects = m.objects.filter(o => !(o.kind === 'tree' && o.x === 0 && (o.y === 13 || o.y === 14)));
    // 北门 → 校园北新区（放外语楼东侧空档；原(21,0)被教学楼顶压住无法通行）
    set(m, 45, 0, 'path'); set(m, 46, 0, 'path');
    m.doors.push({ x: 45, y: 0, to: ['northyard', 16, 20, 'up'] });
    m.doors.push({ x: 46, y: 0, to: ['northyard', 17, 20, 'up'] });
    // 西门 → 阳光小镇
    set(m, 0, 14, 'path'); set(m, 0, 15, 'path');
    m.doors.push({ x: 0, y: 14, to: ['town', 58, 18, 'left'] });
    m.doors.push({ x: 0, y: 15, to: ['town', 58, 19, 'left'] });
    m.objects.push({ kind: 'busStop', x: 2, y: 16, w: 1, h: 2, solidTiles: [[0, 1]], s: 'busStop' });   // 校车站牌（西门内）
    m.objects.push({ kind: 'sign', x: 4, y: 13, w: 1, h: 2, text: '打卡处', solidTiles: [[0, 1]], s: 'board' }); // 每日一题打卡处（西门旁，进门即见）

    // —— 花草点缀 ——
    [[6, 10], [13, 18], [28, 21], [30, 20], [17, 22], [26, 23], [7, 17], [12, 13], [28, 12], [34, 10], [5, 12], [39, 21]]
      .forEach(([x, y]) => set(m, x, y, 'grass2'));
    [[8, 12], [30, 14], [18, 25], [27, 27], [6, 21], [38, 12], [10, 20], [33, 17]]
      .forEach(([x, y]) => set(m, x, y, 'tuft'));

    // —— 收集闪光点（落叶/昆虫）与埋宝点 ——
    m.objects.push({ kind: 'dig', x: 33, y: 12, w: 1, h: 1, solidTiles: [], s: 'dig', did: 'd1' });
    m.objects.push({ kind: 'dig', x: 7, y: 29, w: 1, h: 1, solidTiles: [], s: 'dig', did: 'd2' });
    [[10, 9, 'l3'], [36, 20, 'l5'], [28, 30, 'l1']].forEach(([x, y, cid]) =>
      m.objects.push({ kind: 'pickupSpot', x, y, w: 1, h: 1, solidTiles: [], s: 'pick', cid, sparkle: true }));
    [[13, 10, 'i1'], [30, 12, 'i2'], [9, 22, 'i8']].forEach(([x, y, cid]) =>
      m.objects.push({ kind: 'pickupSpot', x, y, w: 1, h: 1, solidTiles: [], s: 'pick', cid, sparkle: true }));
    // 每日草丛翻找点
    [[12, 11], [30, 26]].forEach(([x, y], i) =>
      m.objects.push({ kind: 'pickupSpot', x, y, w: 1, h: 1, solidTiles: [], s: 'forage', fid: 'cf' + i, sparkle: true }));

    // —— 交互深化点位 ——
    set(m, 18, 7, 'doorWood');                                        // 教学楼办公室侧门
    m.doors.push({ x: 18, y: 7, to: ['office', 11, 12, 'up'] });
    m.objects.push({ kind: 'dateSpot', x: 9, y: 25, w: 1, h: 1, solidTiles: [], s: 'hangSpot', h: 'hong' });       // 操场·和小红
    m.objects.push({ kind: 'dateSpot', x: 39, y: 15, w: 1, h: 1, solidTiles: [], s: 'hangSpot', h: 'ying' });      // 池塘·和小影
    m.objects.push({ kind: 'tree', x: 10, y: 21, w: 1, h: 2, v: 99, solidTiles: [[0, 1]], s: 'sakuraTree' });   // 老樱花树（真树形·春日满树粉白）
    m.objects.push({ kind: 'stump', x: 12, y: 7, w: 1, h: 1, s: 'pot', pot: 'bio', solidTiles: [[0, 0]] });              // 生物角花盆
    m.objects.push({ kind: 'pickupSpot', x: 37, y: 17, w: 1, h: 1, solidTiles: [], s: 'catch', sparkle: true });    // 池塘捕捉点
    m.npcs.push({ id: 'dog2', x: 20, y: 31, dir: 'down', cat: { body: '#33333c' }, name: '煤球', s: 'dog2', wander: 2, mood: '…', acts: ['sleep'] }); // 流浪狗
    // —— NPC 大扩充（校园 6 人 + 新事物） ——
    m.npcs.push({ id: 'wangmei', x: 25, y: 21, dir: 'down', pal: 'wangmei', name: '王美', s: 'wangmei', wander: 2, mood: '♪', acts: ['read', 'think'] });
    m.npcs.push({ id: 'laozhang', x: 19, y: 31, dir: 'up', pal: 'laozhang', name: '张叔', s: 'laozhang', acts: ['think'] });
    m.npcs.push({ id: 'tuxiao', x: 10, y: 24, dir: 'down', pal: 'tuxiao', name: '兔潇', s: 'tuxiao', wander: 3, mood: '?', acts: ['doubt', 'yawn'] });
    m.npcs.push({ id: 'xiaohua', x: 30, y: 21, dir: 'left', pal: 'xiaohua', name: '小花', s: 'xiaohua', wander: 1, mood: '♥', acts: ['wave'] });
    m.npcs.push({ id: 'sunyang', x: 8, y: 9, dir: 'down', pal: 'sunyang', name: '孙阳', s: 'sunyang', wander: 2, acts: ['laugh', 'raise'] });
    m.npcs.push({ id: 'datou', x: 13, y: 29, dir: 'down', pal: 'datou', name: '大头', s: 'datou', wander: 2, acts: ['laugh', 'yawn'] });
    m.objects.push({ kind: 'sign', x: 20, y: 10, w: 1, h: 2, text: '许愿池', solidTiles: [[0, 1]], s: 'wishingWell' });
    m.objects.push({ kind: 'bikeRack', x: 35, y: 10, w: 1, h: 1, solidTiles: [], s: 'bikeRack' });
    m.objects.push({ kind: 'sign', x: 18, y: 8, w: 1, h: 2, text: '广播站', solidTiles: [[0, 1]], s: 'radioStation' });    // 校园广播站

    // —— 告示牌 / 木牌 ——
    m.objects.push({ kind: 'sign', x: 19, y: 9, w: 1, h: 2, text: '校务板', solidTiles: [[0, 1]], s: 'board' });
    m.objects.push({ kind: 'sign', x: 20, y: 9, w: 1, h: 2, text: '委托板', solidTiles: [[0, 1]], s: 'quests' });   // 每日委托
    // —— 拍照点（需照相机）与怪谈点 ——
    [[16, 11, 's1'], [10, 26, 's2'], [47, 7, 's3']].forEach(([x, y, cid]) =>
      m.objects.push({ kind: 'photoSpot', x, y, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid }));
    m.objects.push({ kind: 'mysterySpot', x: 24, y: 12, w: 1, h: 1, solidTiles: [], s: 'rumor', rid: 1 });   // 怪谈1：广场雕像
    m.objects.push({ kind: 'mysterySpot', x: 33, y: 17, w: 1, h: 1, solidTiles: [], s: 'rumor', rid: 2 });   // 怪谈2：池塘倒影
    m.objects.push({ kind: 'sign', x: 18, y: 30, w: 1, h: 2, text: '校门', solidTiles: [[0, 1]], s: 'welcome' });
    m.objects.push({ kind: 'sign', x: 49, y: 5, w: 1, h: 2, text: '后山秘境', solidTiles: [[0, 1]], s: 'hillSign' });
    m.objects.push({ kind: 'sign', x: 50, y: 13, w: 1, h: 2, text: '藏宝洞窟', solidTiles: [[0, 1]], s: 'caveSign' });

    // —— 第二章：通关后，调查喷泉可穿水帘进入月光学院（见 S.moonDoor）——
    if (ADV.Game.flags.finalPassed && !ADV.Game.flags.letterGot)
      m.npcs.push({ id: 'owl', x: 23, y: 13, dir: 'down', cat: { body: '#f4f4f8' }, name: '团子', s: 'owl', wander: 1, mood: '♪', acts: ['sleep', 'groom'] });

    // —— NPC ——
    m.npcs.push({ id: 'principal', x: 19, y: 12, dir: 'down', pal: 'principal', name: '校长', s: 'principal', wander: 1, acts: ['think', 'wave'] });
    m.npcs.push({ id: 'xiaoming', x: 24, y: 11, dir: 'down', pal: 'xiaoming', name: '小明', s: 'xiaoming', wander: 2, mood: '♪', acts: ['read', 'doubt'] });
    m.npcs.push({ id: 'xiaohong', x: 8, y: 26, dir: 'down', pal: 'xiaohong', name: '小红', s: 'xiaohong', wander: 3, mood: '♥', acts: ['wave', 'yawn'], runner: true });
    m.npcs.push({ id: 'xiaogang', x: 11, y: 27, dir: 'down', pal: 'xiaogang', name: '小刚', s: 'xiaogang', wander: 2, mood: '!', acts: ['laugh', 'yawn'], runner: true });
    // 陆飞：操场跑步达人，沿跑道巡环跑圈（route 路点循环）
    m.npcs.push({ id: 'lufei', x: 8, y: 24, dir: 'right', pal: 'lufei', name: '陆飞', s: 'lufei', runner: true, mood: '♪', route: [[3, 24], [14, 24], [14, 30], [3, 30]] });
    // 通关后，小猫会顺着星光前往后山深处的星之庭园
    if (!ADV.Game.flags.finalPassed)
      m.npcs.push({ id: 'cat', x: 25, y: 17, dir: 'down', cat: { body: '#e8964a' }, name: '小猫', s: 'cat', wander: 3, mood: '♪', acts: ['sleep', 'groom', 'play'] });

    m.spawn = { x: 22, y: 30, dir: 'up' };
    return m;
  }

  /* ==================== 室内公共骨架 ==================== */
  function room(id, name, floor, bgm) {
    const m = base(id, name, 30, 20, { fill: floor, bgm: bgm || 'indoor', indoor: true });
    rect(m, 0, 0, 30, 1, 'inWallTop');
    rect(m, 0, 1, 30, 1, 'inWall');
    rect(m, 0, 2, 1, 18, 'inWall');
    rect(m, 29, 2, 1, 18, 'inWall');
    rect(m, 0, 19, 30, 1, 'inWall');
    // 双开门（下方居中）
    set(m, 14, 19, 'doorWood'); set(m, 15, 19, 'doorWood');
    const back = { classroom: ['campus', 22, 8, 'down'], library: ['campus', 33, 7, 'down'], lab: ['campus', 9, 7, 'down'], canteen: ['campus', 36, 29, 'down'], english: ['campus', 42, 7, 'down'], gym: ['campus', 44, 15, 'down'], music: ['campus', 48, 29, 'down'] }[id];
    m.doors.push({ x: 14, y: 19, to: back });
    m.doors.push({ x: 15, y: 19, to: back });
    set(m, 14, 18, floor); set(m, 15, 18, floor);
    rect(m, 14, 17, 2, 1, 'floorCarpet');
    m.spawn = { x: 15, y: 18, dir: 'up' };
    return m;
  }
  const plant = (m, x, y) => m.objects.push({ kind: 'plant', x, y, w: 1, h: 1, solidTiles: [[0, 0]] });
  function shopRoom(id, name, back, floor) {
    const m = base(id, name, 24, 14, { fill: floor || 'floorWood', bgm: 'indoor', indoor: true });
    rect(m, 0, 0, 24, 1, 'inWallTop'); rect(m, 0, 1, 24, 1, 'inWall');
    rect(m, 0, 2, 1, 11, 'inWall'); rect(m, 23, 2, 1, 11, 'inWall'); rect(m, 0, 13, 24, 1, 'inWall');
    set(m, 11, 13, 'doorWood'); set(m, 12, 13, 'doorWood');
    m.doors.push({ x: 11, y: 13, to: back });
    m.doors.push({ x: 12, y: 13, to: back });
    set(m, 11, 12, floor || 'floorWood'); set(m, 12, 12, floor || 'floorWood');
    [3, 8, 15, 20].forEach(x => set(m, x, 1, 'inWallWin'));
    m.spawn = { x: 11, y: 11, dir: 'up' };
    return m;
  }

  /* —— 教室（数学试炼） —— */
  function classroom() {
    const m = room('classroom', '教学楼 · 教室', 'floorWood');
    rect(m, 12, 1, 6, 1, 'blackboard');
    [4, 8, 18, 22, 26].forEach(x => set(m, x, 1, 'inWallWin'));
    set(m, 14, 3, 'teacherDesk'); set(m, 15, 3, 'teacherDesk');
    [6, 9, 12].forEach(y => [5, 9, 14, 18].forEach(x => set(m, x, y, 'desk')));
    plant(m, 2, 2); plant(m, 27, 2); plant(m, 2, 17); plant(m, 27, 17);
    m.npcs.push({ id: 'teacher_math', x: 14, y: 2, dir: 'down', pal: 'teacher_math', name: '王老师', s: 'teacherMath', acts: ['think', 'read'] });
    m.npcs.push({ id: 'student_class', x: 10, y: 7, dir: 'down', pal: 'studentC', name: '同学', s: 'studentClass', acts: ['read', 'sleep', 'doubt'] });
    // 林小雨：害羞的转学生，坐在教室后排角落
    m.npcs.push({ id: 'linxiaoyu', x: 17, y: 8, dir: 'down', pal: 'linxiaoyu', name: '林小雨', s: 'linxiaoyu', wander: 1, acts: ['read', 'think'] });
    m.inters.push({ x: 14, y: 3, s: 'classBooks' });  // 讲台上的课本
    m.inters.push({ x: 15, y: 3, s: 'classBooks' });
    // 小明的漫画书：带星光标记的课桌（靠窗第二排），一眼可辨
    m.objects.push({ id: 'comicDesk', kind: 'sign', x: 9, y: 6, w: 1, h: 1, text: '✦', solidTiles: [], s: 'deskComic', sparkle: true });
    m.objects.push({ id: 'albumBox', kind: 'sign', x: 15, y: 4, w: 1, h: 1, text: '✦', solidTiles: [], s: 'albumSpot', sparkle: true });  // 教务处托管的画册（小影支线）
    m.objects.push({ kind: 'sign', x: 3, y: 4, w: 1, h: 1, text: '花绳', solidTiles: [[0,0]], s: 'cradle' });  // 课间翻花绳角
    m.objects.push({ kind: 'shelf2', x: 2, y: 14, w: 1, h: 1, s: 'bookCorner', solidTiles: [[0, 0]] });  // 图书角（免费翻书）
    m.objects.push({ kind: 'sign', x: 27, y: 15, w: 1, h: 1, text: '🧹', solidTiles: [], s: 'cleanDuty' });  // 卫生角（值日）
    m.inters.push({ x: 5, y: 12, s: 'myDrawer' });    // 自己的课桌抽屉
    m.inters.push({ x: 14, y: 9, s: 'deskDrawer' });  // 同学的课桌抽屉
    m.objects.push({ kind: 'bbNews', x: 19, y: 2, w: 1, h: 1, solidTiles: [] });      // 黑板报
    m.objects.push({ kind: 'trophyFrame', x: 24, y: 5, w: 1, h: 1, solidTiles: [] }); // 奖状框
    m.objects.push({ kind: 'coatHook', x: 12, y: 2, w: 1, h: 1, solidTiles: [] });    // 衣帽钩
    m.objects.push({ kind: 'sign', x: 16, y: 2, w: 1, h: 1, text: '🗓', solidTiles: [], s: 'boardCountdown' });
    m.objects.push({ kind: 'sign', x: 15, y: 18, w: 1, h: 1, text: '🌸', solidTiles: [], s: 'seasonDeco' });
    m.objects.push({ kind: 'sign', x: 13, y: 9, w: 1, h: 1, text: '🖼', solidTiles: [], s: 'posterWall' });
    return m;
  }

  /* —— 英语教室（英语试炼） —— */
  function english() {
    const m = room('english', '外语楼 · 英语教室', 'floorWood');
    rect(m, 12, 1, 6, 1, 'blackboard');
    [3, 6, 22, 25].forEach(x => set(m, x, 1, 'abcBoard'));
    [9, 18].forEach(x => set(m, x, 1, 'inWallWin'));
    set(m, 14, 3, 'teacherDesk'); set(m, 15, 3, 'teacherDesk');
    [6, 9, 12].forEach(y => [5, 9, 14, 18].forEach(x => set(m, x, y, 'desk')));
    plant(m, 2, 2); plant(m, 27, 2); plant(m, 2, 17); plant(m, 27, 17);
    m.npcs.push({ id: 'teacher_en', x: 14, y: 2, dir: 'down', pal: 'teacher_en', name: '吴老师', s: 'teacherEn', acts: ['wave', 'read'] });
    // —— A组·英语教室激活 ——
    m.objects.push({ kind: 'sign', x: 21, y: 2, w: 1, h: 1, text: '🔤', solidTiles: [], s: 'wordCard' });
    m.objects.push({ kind: 'sign', x: 25, y: 2, w: 1, h: 1, text: '📻', solidTiles: [], s: 'radioListen' });
    m.objects.push({ kind: 'sign', x: 9, y: 7, w: 1, h: 1, text: '💌', solidTiles: [], s: 'loveLetter' });
    m.npcs.push({ id: 'student_en', x: 18, y: 7, dir: 'left', pal: 'studentA', name: '同学', s: 'studentEn', acts: ['read', 'doubt'] });
    return m;
  }

  /* —— 图书馆（语文试炼） —— */
  function library() {
    const m = room('library', '图书馆', 'floorTile');
    [4, 8, 12, 16, 20, 24].forEach(x => set(m, x, 1, 'inWallWin'));
    rect(m, 10, 3, 10, 1, 'counter');
    [3, 6, 9].forEach(x => rect(m, x, 6, 1, 10, 'shelf'));
    [[16, 7], [21, 7], [16, 12], [21, 12]].forEach(([x, y]) => {
      set(m, x, y, 'tableRound');
      set(m, x - 1, y, 'chair'); set(m, x + 1, y, 'chair');
    });
    plant(m, 2, 2); plant(m, 27, 2); plant(m, 2, 17); plant(m, 27, 17);
    m.npcs.push({ id: 'teacher_cn', x: 14, y: 2, dir: 'down', pal: 'teacher_cn', name: '李老师', s: 'teacherCn', acts: ['read', 'think'] });
    m.npcs.push({ id: 'student_lib', x: 17, y: 7, dir: 'left', pal: 'studentA', name: '学生', s: 'studentLib', acts: ['read', 'sleep', 'yawn'] });
    m.npcs.push({ id: 'huangyu', x: 22, y: 7, dir: 'left', pal: 'huangyu', name: '黄宇', s: 'huangyu', acts: ['read', 'think'] });
    m.objects.push({ kind: 'photoSpot', x: 5, y: 5, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's8' });   // 书架长廊机位
    m.objects.push({ kind: 'bookStack', x: 12, y: 3, w: 1, h: 1, solidTiles: [] });   // 书堆塔
    m.objects.push({ kind: 'chair2', x: 26, y: 9, w: 1, h: 1, solidTiles: [[0, 0]] }); // 藤椅
    m.objects.push({ kind: 'wallClock', x: 24, y: 2, w: 1, h: 1, solidTiles: [] });    // 挂钟
    m.objects.push({ kind: 'catBed', x: 10, y: 15, w: 1, h: 1, s: 'libCatBed', solidTiles: [[0, 0]] }); // 猫窝
    m.objects.push({ kind: 'sign', x: 23, y: 6, w: 1, h: 1, text: '窗边', solidTiles: [], s: 'windowSeat' }); // 放学后的小窗边
    m.objects.push({ kind: 'mysterySpot', x: 8, y: 5, w: 1, h: 1, solidTiles: [], s: 'rumor', rid: 5 });  // 怪谈5：书架低语
    m.inters.push({ x: 3, y: 5, s: 'shelfPeek' });
    // 书架可读书 + 管理员 + 书友会同学
    m.inters.push({ x: 6, y: 8, s: 'libraryShelf' });
    m.inters.push({ x: 6, y: 13, s: 'libraryShelf' });
    m.inters.push({ x: 9, y: 10, s: 'libraryShelf' });
    m.npcs.push({ id: 'librarian', x: 11, y: 2, dir: 'down', pal: 'librarian', name: '秦墨', s: 'librarian', acts: ['read', 'think'] });
    m.npcs.push({ id: 'buddy', x: 22, y: 12, dir: 'left', pal: 'buddy', name: '小卷', s: 'buddy', acts: ['read', 'laugh'] });
    // 第二章：禁书区暗门（顶墙中央，集齐四门魔法课后开启）
    set(m, 15, 1, 'doorDark');
    m.doors.push({ x: 15, y: 1, to: ['oldlib', 15, 17, 'down'], need: 'classesDone' });
    return m;
  }

  /* —— 实验室（科学试炼） —— */
  function lab() {
    const m = room('lab', '实验楼 · 实验室', 'floorTile');
    rect(m, 2, 1, 7, 1, 'wallShelf');
    rect(m, 12, 1, 6, 1, 'blackboard');
    [20, 22, 24, 26].forEach(x => set(m, x, 1, 'inWallWin'));
    rect(m, 6, 5, 5, 2, 'labBench');
    rect(m, 6, 10, 5, 2, 'labBench');
    rect(m, 20, 5, 5, 2, 'pcDesk');
    rect(m, 20, 10, 5, 2, 'pcDesk');
    plant(m, 2, 17); plant(m, 27, 17);
    m.npcs.push({ id: 'teacher_sci', x: 14, y: 4, dir: 'down', pal: 'teacher_sci', name: '陈老师', s: 'teacherSci', acts: ['doubt', 'think'] });
    // —— A组·实验室激活 ——
    m.objects.push({ kind: 'cauldron', x: 8, y: 7, w: 1, h: 1, s: 'freeLab', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'shelfOld', x: 20, y: 6, w: 1, h: 2, s: 'reagentRack', solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'telescope', x: 24, y: 10, w: 1, h: 1, s: 'microscope', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'sign', x: 3, y: 13, w: 1, h: 1, text: '💨', solidTiles: [], s: 'fumeHood' });
    return m;
  }

  /* —— 食堂 —— */
  function canteen() {
    const m = room('canteen', '食堂', 'floorTile');
    rect(m, 3, 1, 5, 1, 'stove');
    rect(m, 12, 1, 6, 1, 'menuBoard');
    [20, 22, 24, 26].forEach(x => set(m, x, 1, 'inWallWin'));
    rect(m, 8, 4, 13, 1, 'counter');
    [7, 12, 17, 22].forEach(x => [8, 12].forEach(y => {
      set(m, x, y, 'tableRound');
      set(m, x - 1, y, 'chair'); set(m, x + 1, y, 'chair');
    }));
    plant(m, 2, 2); plant(m, 27, 2);
    m.npcs.push({ id: 'aunt', x: 14, y: 3, dir: 'down', pal: 'aunt', name: '食堂阿姨', s: 'aunt', acts: ['laugh', 'wave'] });
    // —— A组·食堂激活 ——
    m.objects.push({ kind: 'sign', x: 13, y: 2, w: 1, h: 1, text: '📋', solidTiles: [], s: 'todayMenu' });
    m.objects.push({ kind: 'sign', x: 4, y: 2, w: 1, h: 1, text: '🍳', solidTiles: [], s: 'stoveHelp' });
    m.objects.push({ kind: 'sign', x: 7, y: 12, w: 1, h: 1, text: '🎒', solidTiles: [], s: 'lostFound' });
    m.objects.push({ kind: 'sign', x: 25, y: 12, w: 1, h: 1, text: '📝', solidTiles: [], s: 'orderBoard' });
    m.npcs.push({ id: 'xiaopang', x: 15, y: 8, dir: 'right', pal: 'xiaopang', name: '小胖', s: 'xiaopang', acts: ['yawn', 'laugh'] });
    m.npcs.push({ id: 'zhaoling', x: 18, y: 10, dir: 'down', pal: 'zhaoling', name: '赵大姐', s: 'zhaoling', acts: ['wave', 'laugh'] });
    m.npcs.push({ id: 'student_canteen', x: 8, y: 8, dir: 'left', pal: 'studentB', name: '同学', s: 'studentCanteen', acts: ['laugh', 'yawn'] });
    return m;
  }

  /* —— 后山秘境（最终试炼） —— */
  function backhill() {
    const m = base('backhill', '后山秘境', 30, 20, { fill: 'grassDark', bgm: 'mystery', particles: 'firefly' });
    // 蜿蜒石径
    rect(m, 15, 8, 1, 10, 'mossStone');
    rect(m, 13, 8, 3, 1, 'mossStone');
    rect(m, 13, 3, 1, 6, 'mossStone');
    set(m, 14, 3, 'mossStone');
    // 出口传送
    set(m, 14, 18, 'mossStone'); set(m, 15, 18, 'mossStone');
    m.doors.push({ x: 14, y: 18, to: ['campus', 51, 4, 'down'] });   // 石门东移后的正确落点
    m.doors.push({ x: 15, y: 18, to: ['campus', 52, 4, 'down'] });
    // 祭坛后方的星光小路（通关后开放，通往星之庭园）
    set(m, 14, 0, 'mossStone'); set(m, 15, 0, 'mossStone');
    m.doors.push({ x: 14, y: 0, to: ['backhillDeep', 14, 18, 'up'], need: 'finalPassed' });
    m.doors.push({ x: 15, y: 0, to: ['backhillDeep', 15, 18, 'up'], need: 'finalPassed' });
    // 祭坛
    m.objects.push({
      id: 'altar', kind: 'altar', x: 13, y: 1, w: 2, h: 2, glow: false, s: 'altar',
      solidTiles: [[0, 0], [1, 0], [0, 1], [1, 1]]
    });
    // 树林边界
    for (let y = 0; y < 20; y++) { tree(m, 0, y); tree(m, 29, y); }
    for (let x = 1; x < 29; x++) if (x < 14 || x > 15) tree(m, x, 0);
    for (let x = 1; x < 29; x++) if (x < 13 || x > 16) tree(m, x, 19);
    // 散布树丛 / 岩石 / 树桩 / 发光蘑菇
    trees(m, [[5, 5], [8, 8], [10, 3], [18, 6], [20, 10], [6, 12], [11, 15], [19, 14], [22, 4], [25, 8], [24, 15], [8, 17], [20, 17], [26, 12], [4, 9], [17, 2], [3, 15], [27, 16]]);
    [[9, 5], [21, 12], [7, 10]].forEach(([x, y]) => m.objects.push({ kind: 'rock', x, y, w: 1, h: 1, solidTiles: [[0, 0]] }));
    [[12, 12], [23, 6], [5, 16]].forEach(([x, y]) => m.objects.push({ kind: 'stump', x, y, w: 1, h: 1, solidTiles: [[0, 0]] }));
    [[7, 7], [12, 10], [17, 9], [21, 13], [9, 14], [23, 6], [6, 16], [19, 16]].forEach(([x, y]) => set(m, x, y, 'glow'));
    // 埋宝点 + 落叶/昆虫闪光
    m.objects.push({ kind: 'dig', x: 5, y: 7, w: 1, h: 1, solidTiles: [], s: 'dig', did: 'd3' });
    m.objects.push({ kind: 'dig', x: 22, y: 14, w: 1, h: 1, solidTiles: [], s: 'dig', did: 'd4' });
    // 虫鸣点（捉虫网专属）：后山两处高草丛
    m.objects.push({ kind: 'buzz', x: 7, y: 13, w: 1, h: 1, bid: 'bh1', s: 'buzzPoint', solidTiles: [] });
    m.objects.push({ kind: 'buzz', x: 26, y: 5, w: 1, h: 1, bid: 'bh2', s: 'buzzPoint', solidTiles: [] });
    // —— 三期C 后山隐藏驯兽导师：山径深处的石屋（克制环出师后，门才会「恰好」开着） ——
    m.objects.push({ kind: 'mysterySpot', x: 24, y: 2, w: 1, h: 1, solidTiles: [], s: 'hermitHut', sparkle: true });
    // 生物窝点：雾日螳螂 / 春夏天牛出没
    m.objects.push({ kind: 'critter', x: 17, y: 12, w: 1, h: 1, pid: 'cb1', map: 'backhill', s: 'critterSpot', solidTiles: [] });
    [[8, 6, 'l2'], [24, 8, 'l6']].forEach(([x, y, cid]) =>
      m.objects.push({ kind: 'pickupSpot', x, y, w: 1, h: 1, solidTiles: [], s: 'pick', cid, sparkle: true }));
    [[10, 4, 'i4'], [18, 8, 'i7']].forEach(([x, y, cid]) =>
      m.objects.push({ kind: 'pickupSpot', x, y, w: 1, h: 1, solidTiles: [], s: 'pick', cid, sparkle: true }));
    m.objects.push({ kind: 'pickupSpot', x: 9, y: 10, w: 1, h: 1, solidTiles: [], s: 'forage', fid: 'bf0', sparkle: true });
    m.objects.push({ kind: 'sign', x: 3, y: 9, w: 1, h: 1, text: '✦', solidTiles: [], s: 'hist', h: 1, sparkle: true });   // 暗线·校史缺页1
    m.objects.push({ id: 'chestD', kind: 'chest', x: 23, y: 10, w: 1, h: 1, open: false, s: 'chestD', solidTiles: [[0, 0]] }); // 探险社旧箱
    m.npcs.push({ id: 'keeper', x: 15, y: 4, dir: 'down', pal: 'keeper', name: '神秘老人', s: 'keeper', acts: ['think'] });
    // —— 野外高草丛：后山林间深草（雾天螳螂/天牛出没，tier1 易出稀有） ——
    rect(m, 22, 8, 5, 4, 'grass2'); rect(m, 6, 14, 4, 3, 'grass2');
    m.grass = [
      { x: 22, y: 8, w: 5, h: 4, tier: 1 },   // 东林深草
      { x: 6, y: 14, w: 4, h: 3, tier: 1 },   // 南坡草窝
    ];
    m.spawn = { x: 15, y: 17, dir: 'up' };
    return m;
  }

  /* —— 后山深处 · 星之庭园（通关后开放） —— */
  function backhillDeep() {
    const m = base('backhillDeep', '后山深处 · 星之庭园', 30, 20, { fill: 'grassDark', bgm: 'mystery', particles: 'firefly' });
    // 入口（南）
    set(m, 14, 19, 'mossStone'); set(m, 15, 19, 'mossStone');
    m.doors.push({ x: 14, y: 19, to: ['backhill', 15, 1, 'up'] });
    m.doors.push({ x: 15, y: 19, to: ['backhill', 15, 1, 'up'] });
    // 星光小径
    rect(m, 14, 13, 2, 6, 'mossStone');
    rect(m, 12, 12, 6, 1, 'mossStone');
    rect(m, 14, 8, 2, 4, 'mossStone');
    // 星之泉（长明的发光祭坛）
    m.objects.push({ kind: 'altar', x: 13, y: 4, w: 2, h: 2, glow: true, s: 'starSpring',
                     solidTiles: [[0, 0], [1, 0], [0, 1], [1, 1]] });
    m.objects.push({ kind: 'photoSpot', x: 16, y: 7, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's12' });  // 星之泉机位
    // 木牌
    m.objects.push({ kind: 'sign', x: 19, y: 12, w: 1, h: 2, text: '星之庭园', solidTiles: [[0, 1]], s: 'deepSign' });
    // 树林边界
    for (let y = 0; y < 20; y++) { tree(m, 0, y); tree(m, 29, y); }
    for (let x = 1; x < 29; x++) if (x < 14 || x > 15) tree(m, x, 0);
    for (let x = 1; x < 29; x++) if (x < 14 || x > 15) tree(m, x, 19);
    // 树丛 / 岩石 / 树桩 / 发光蘑菇
    trees(m, [[5, 8], [8, 4], [11, 4], [19, 4], [22, 6], [25, 9], [4, 12], [21, 15], [25, 16], [7, 16], [18, 2], [24, 3], [3, 6], [26, 13]]);
    [[6, 10], [22, 11], [12, 5]].forEach(([x, y]) => m.objects.push({ kind: 'rock', x, y, w: 1, h: 1, solidTiles: [[0, 0]] }));
    [[19, 13], [5, 15]].forEach(([x, y]) => m.objects.push({ kind: 'stump', x, y, w: 1, h: 1, solidTiles: [[0, 0]] }));
    [[5, 4], [9, 6], [19, 6], [23, 8], [25, 12], [6, 14], [20, 16], [10, 17], [22, 3], [16, 16], [8, 10], [24, 17]]
      .forEach(([x, y]) => set(m, x, y, 'glow'));
    // 星儿与阿星
    m.npcs.push({ id: 'star', x: 17, y: 8, dir: 'left', pal: 'star', name: '星儿', s: 'star', acts: ['wave', 'think'] });
    m.npcs.push({ id: 'deepcat', x: 11, y: 9, dir: 'down', cat: { body: '#e8d8a8' }, name: '阿星', s: 'cat', acts: ['sleep', 'groom'] });
    // 星之果实 1/5（星之庭园）
    m.objects.push({ kind: 'starFruit', x: 8, y: 9, w: 1, h: 1, sid: 'sf1', s: 'starFruit', solidTiles: [], taken: false });
    m.spawn = { x: 15, y: 17, dir: 'up' };
    return m;
  }

  /* —— 体育馆（投篮挑战） —— */
  function gym() {
    const m = room('gym', '体育馆 · 篮球场', 'court', 'campus');
    m.objects.push({ kind: 'hoop', x: 6, y: 2, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'hoop', x: 22, y: 2, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.npcs.push({ id: 'teacher_liu', x: 14, y: 4, dir: 'down', pal: 'teacher_liu', name: '刘老师', s: 'teacherLiu', acts: ['laugh', 'wave'] });
    // —— A组·体育馆激活 ——
    m.objects.push({ kind: 'sign', x: 6, y: 4, w: 1, h: 1, text: '🏀', solidTiles: [], s: 'freeShoot' });
    m.objects.push({ kind: 'sign', x: 27, y: 4, w: 1, h: 1, text: '🥅', solidTiles: [], s: 'equipWin' });
    m.objects.push({ kind: 'sign', x: 10, y: 2, w: 1, h: 1, text: '🏆', solidTiles: [], s: 'trophyCase' });
    m.npcs.push({ id: 'student_gym', x: 10, y: 9, dir: 'right', pal: 'studentB', name: '同学', s: 'studentGym', acts: ['yawn', 'laugh'] });
    return m;
  }

  /* —— 音乐教室（琴键记忆） —— */
  function music() {
    const m = room('music', '音乐教室 · 音乐室', 'floorWood', 'indoor');
    [4, 24].forEach(x => set(m, x, 1, 'inWallWin'));
    rect(m, 8, 1, 8, 1, 'wallShelf');
    m.objects.push({ kind: 'piano', x: 13, y: 2, w: 2, h: 1, s: 'piano', solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'wallArt', x: 9, y: 2, w: 1, h: 1, solidTiles: [] });      // 音乐壁画
    m.objects.push({ kind: 'chair2', x: 25, y: 8, w: 1, h: 1, solidTiles: [[0, 0]] }); // 藤椅
    m.objects.push({ kind: 'photoSpot', x: 22, y: 3, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's7' });    // 琴房机位
    m.objects.push({ kind: 'mysterySpot', x: 24, y: 6, w: 1, h: 1, solidTiles: [], s: 'rumor', rid: 6 });   // 怪谈6：午夜琴声
    m.npcs.push({ id: 'teacher_zhao', x: 16, y: 3, dir: 'left', pal: 'teacher_zhao', name: '赵老师', s: 'teacherZhao', acts: ['wave', 'think'] });
    m.npcs.push({ id: 'student_music', x: 20, y: 9, dir: 'down', pal: 'studentA', name: '同学', s: 'studentMusic', acts: ['read', 'sleep'] });
    return m;
  }

  /* —— 藏宝洞窟（寻宝） —— */
  function cave() {
    const m = base('cave', '东郊 · 藏宝洞窟', 36, 24, { fill: 'caveFloor', bgm: 'mystery', indoor: true });
    rect(m, 0, 0, 36, 1, 'caveWall'); rect(m, 0, 23, 36, 1, 'caveWall');
    rect(m, 0, 1, 1, 22, 'caveWall'); rect(m, 35, 1, 1, 22, 'caveWall');
    // 出口
    set(m, 17, 23, 'caveFloor'); set(m, 18, 23, 'caveFloor');
    m.doors.push({ x: 17, y: 23, to: ['campus', 51, 19, 'up'] });
    m.doors.push({ x: 18, y: 23, to: ['campus', 51, 19, 'up'] });
    // 迷宫岩壁：上部回廊（A 组）+ 中部丁字墙（B 组）+ 南部横墙（C 组），中央留大厅
    rect(m, 4, 4, 10, 1, 'caveWall'); rect(m, 4, 5, 1, 5, 'caveWall'); rect(m, 13, 6, 1, 6, 'caveWall');
    rect(m, 19, 3, 1, 8, 'caveWall'); rect(m, 19, 10, 8, 1, 'caveWall'); rect(m, 25, 4, 1, 6, 'caveWall');
    rect(m, 29, 7, 1, 4, 'caveWall');
    rect(m, 7, 17, 9, 1, 'caveWall'); rect(m, 15, 13, 1, 4, 'caveWall');
    rect(m, 22, 15, 8, 1, 'caveWall'); rect(m, 22, 15, 1, 4, 'caveWall'); rect(m, 29, 15, 1, 4, 'caveWall');
    rect(m, 4, 20, 10, 1, 'caveWall'); rect(m, 24, 20, 7, 1, 'caveWall'); rect(m, 30, 16, 1, 4, 'caveWall');
    // 四只宝箱：西北死胡同 / 左上回廊 / 东北暗道前厅 / 东南竖廊
    m.objects.push({ id: 'chestE', kind: 'chest', x: 2, y: 2, w: 1, h: 1, open: false, s: 'chestE', solidTiles: [[0, 0]] });
    m.objects.push({ id: 'chestA', kind: 'chest', x: 5, y: 6, w: 1, h: 1, open: false, s: 'chestA', solidTiles: [[0, 0]] });
    m.objects.push({ id: 'chestB', kind: 'chest', x: 32, y: 3, w: 1, h: 1, open: false, s: 'chestB', solidTiles: [[0, 0]] });
    m.objects.push({ id: 'chestC', kind: 'chest', x: 32, y: 20, w: 1, h: 1, open: false, s: 'chestC', solidTiles: [[0, 0]] });
    // —— 寻宝迷宫一层：铜祭坛（趣味题 → 铜钥匙）/ 提示牌 / 通二层暗道 ——
    m.objects.push({ id: 'quizAltarA', kind: 'quizAltar', x: 3, y: 14, w: 1, h: 1, tier: 0, lit: false, s: 'quizAltarA', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'sign', x: 4, y: 14, w: 1, h: 1, text: '🔑', solidTiles: [], s: 'treasureHint' });
    // 暗道（铜钥匙开启）→ 山洞二层
    m.doors.push({ x: 34, y: 1, to: ['cave2F', 19, 24, 'up'], need: 'treasureCopper' });
    // 矿道裂缝（矿洞无限层入口，壁根下黑黢黢的一道缝）
    m.objects.push({ kind: 'crack', x: 10, y: 15, w: 1, h: 1, s: 'mineEnter', solidTiles: [] });
    // 岩石与水晶
    [[11, 3], [12, 13], [24, 17], [5, 9], [16, 15]].forEach(([x, y]) => m.objects.push({ kind: 'rock', x, y, w: 1, h: 1, solidTiles: [[0, 0]] }));
    [[6, 9], [11, 7], [15, 11], [21, 8], [8, 13], [17, 16], [24, 5], [2, 10], [27, 17], [33, 10]].forEach(([x, y]) => set(m, x, y, 'crystal'));
    m.spawn = { x: 17, y: 22, dir: 'up' };
    return m;
  }

  /* —— 洞窟二层 · 符文迷宫（银/金祭坛 + 符文石门 + 深处大宝箱） —— */
  function cave2F() {
    const m = base('cave2F', '洞窟二层 · 符文迷宫', 40, 28, { fill: 'caveFloor', bgm: 'mystery', indoor: true });
    // 外圈岩壁
    rect(m, 0, 0, 40, 1, 'caveWall'); rect(m, 0, 27, 40, 1, 'caveWall');
    rect(m, 0, 1, 1, 26, 'caveWall'); rect(m, 39, 1, 1, 26, 'caveWall');
    // BOSS 密室（上中）：西墙 x13 / 东墙 x26 / 南墙 y9（x19-20 留门洞给符文石门）
    rect(m, 13, 1, 1, 9, 'caveWall'); rect(m, 26, 1, 1, 9, 'caveWall');
    rect(m, 13, 9, 6, 1, 'caveWall'); rect(m, 21, 9, 6, 1, 'caveWall');
    // 中央竖廊三道错位横墙（S 形绕行至石门）
    rect(m, 16, 23, 8, 1, 'caveWall'); rect(m, 16, 20, 8, 1, 'caveWall'); rect(m, 21, 16, 6, 1, 'caveWall');
    // 西翼（银祭坛）与南厅的分隔墙（x3-4 留口）+ 翼内小迷宫
    rect(m, 1, 13, 12, 1, 'caveWall'); set(m, 3, 13, 'caveFloor'); set(m, 4, 13, 'caveFloor');
    rect(m, 5, 3, 1, 6, 'caveWall'); rect(m, 9, 6, 1, 6, 'caveWall');
    // 东翼（金祭坛）与南厅的分隔墙（x35-36 留口）+ 翼内小迷宫
    rect(m, 27, 13, 12, 1, 'caveWall'); set(m, 35, 13, 'caveFloor'); set(m, 36, 13, 'caveFloor');
    rect(m, 31, 4, 1, 6, 'caveWall'); rect(m, 35, 8, 1, 4, 'caveWall');
    // 南厅两道矮墙（错落岩垛）
    rect(m, 6, 19, 8, 1, 'caveWall'); rect(m, 26, 19, 8, 1, 'caveWall');
    // 入口 / 回一层
    set(m, 19, 27, 'caveFloor'); set(m, 20, 27, 'caveFloor');
    m.doors.push({ x: 19, y: 27, to: ['cave', 34, 2, 'down'] });
    m.doors.push({ x: 20, y: 27, to: ['cave', 34, 2, 'down'] });
    // 银祭坛（西北） / 金祭坛（东北） / 石门（密室门洞） / 大宝箱（密室深处）
    m.objects.push({ id: 'quizAltarB', kind: 'quizAltar', x: 2, y: 2, w: 1, h: 1, tier: 1, lit: false, s: 'quizAltarB', solidTiles: [[0, 0]] });
    m.objects.push({ id: 'quizAltarC', kind: 'quizAltar', x: 37, y: 2, w: 1, h: 1, tier: 2, lit: false, s: 'quizAltarC', solidTiles: [[0, 0]] });
    m.objects.push({ id: 'sealGate', kind: 'sealGate', x: 19, y: 9, w: 2, h: 2, open: false, s: 'sealGate', solidTiles: [[0, 0], [1, 0], [0, 1], [1, 1]] });
    m.objects.push({ id: 'bossChest', kind: 'bossChest', x: 19, y: 4, w: 1, h: 1, open: false, s: 'bossChest', solidTiles: [[0, 0]] });
    // 支线宝箱与提示牌
    m.objects.push({ id: 'chestF', kind: 'chest', x: 9, y: 2, w: 1, h: 1, open: false, s: 'chestF', solidTiles: [[0, 0]] });
    m.objects.push({ id: 'chestG', kind: 'chest', x: 28, y: 10, w: 1, h: 1, open: false, s: 'chestG', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'sign', x: 19, y: 25, w: 1, h: 1, text: '📜', solidTiles: [], s: 'treasureHint2' });
    // 神秘老人（解读符文来历）
    m.npcs.push({ id: 'treasureKeeper', x: 17, y: 18, dir: 'left', pal: 'keeper', name: '神秘老人', s: 'treasureKeeper', acts: ['think', 'wave'] });
    // 星之果实 2/5（二层西南角）
    m.objects.push({ kind: 'starFruit', x: 1, y: 26, w: 1, h: 1, sid: 'sf2', s: 'starFruit', solidTiles: [], taken: false });
    // 岩石与水晶点缀（密室水晶阵 / 各岔路角落）
    [[5, 15], [17, 7], [3, 6], [12, 15], [15, 6], [24, 6], [10, 22], [30, 22]].forEach(([x, y]) => m.objects.push({ kind: 'rock', x, y, w: 1, h: 1, solidTiles: [[0, 0]] }));
    [[2, 8], [10, 6], [14, 1], [19, 3], [25, 7], [6, 14], [20, 14], [25, 17], [11, 16], [33, 12], [1, 20]].forEach(([x, y]) => set(m, x, y, 'crystal'));
    m.spawn = { x: 19, y: 24, dir: 'up' };
    return m;
  }

  /* —— 矿道 · 无限层（程序化生成：flags.mineDepth 决定层数与矿石分布，同层布局固定） —— */
  function mineShaft() {
    const depth = Math.max(1, (ADV.Game.flags && ADV.Game.flags.mineDepth) || 1);
    const m = base('mineShaft', `矿道 · 第 ${depth} 层`, 26, 18, { fill: 'caveFloor', bgm: 'mystery', indoor: true });
    rect(m, 0, 0, 26, 1, 'caveWall'); rect(m, 0, 17, 26, 1, 'caveWall');
    rect(m, 0, 1, 1, 16, 'caveWall'); rect(m, 25, 1, 1, 16, 'caveWall');
    // 以层数为种子的线性同余伪随机（同层每次进入布局一致，越深矿越好）
    let seed = (depth * 2654435761 + 97) % 2147483647;
    const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    // 岩柱障眼（避开顶部绳索区与外圈）
    for (let i = 0; i < 7; i++) {
      const x = 2 + ((rnd() * 22) | 0), y = 6 + ((rnd() * 10) | 0);
      if (x >= 11 && x <= 15 && y <= 7) continue;
      if (rnd() < .5) rect(m, x, y, 1, 2, 'caveWall'); else set(m, x, y, 'caveWall');
    }
    // 出口绳索（顶部中央，爬回藏宝洞窟）+ 运矿电梯（整五层直达，星露谷式）
    m.objects.push({ kind: 'rope', x: 13, y: 3, w: 1, h: 1, s: 'ropeUp', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'elevator', x: 12, y: 3, w: 1, h: 1, s: 'elevator', solidTiles: [[0, 0]] });
    m.spawn = { x: 13, y: 5, dir: 'up' };
    // 矿脉：档次随深度提升（0 铜 → 1 铁 → 2 金 → 3 晶石），位置由种子决定
    const veinN = 5 + (depth % 3) + Math.min(4, (depth / 5) | 0);
    const rollTier = () => {
      const r = rnd();
      if (depth <= 3) return 0;
      if (depth <= 7) return r < .7 ? 0 : 1;
      if (depth <= 11) return r < .4 ? 0 : r < .85 ? 1 : 2;
      if (depth <= 15) return r < .45 ? 1 : r < .85 ? 2 : 3;
      return r < .3 ? 1 : r < .75 ? 2 : 3;
    };
    for (let i = 0; i < veinN; i++) {
      const x = 2 + ((rnd() * 22) | 0), y = 4 + ((rnd() * 12) | 0);
      if (x === 13 && y <= 5) continue;                     // 别堵绳索口
      m.objects.push({ kind: 'ore', x, y, w: 1, h: 1, tier: rollTier(), oid: `d${depth}_${i}`, s: 'oreNode', solidTiles: [[0, 0]] });
    }
    // 下行裂缝（放空地上：避开矿脉、岩柱）
    let cx = 3, cy = 12;
    for (let t = 0; t < 40; t++) {
      cx = 2 + ((rnd() * 22) | 0); cy = 11 + ((rnd() * 5) | 0);
      const nearOre = m.objects.some(o => o.kind === 'ore' && Math.abs(o.x - cx) + Math.abs(o.y - cy) <= 1);
      if (!nearOre && m.g[cy][cx] === 'caveFloor') break;
    }
    m.objects.push({ kind: 'crack', x: cx, y: cy, w: 1, h: 1, s: 'crackDown', solidTiles: [] });
    return m;
  }

  /* ==================== 第二章 · 月光学院 ==================== */

  /* —— 月光学院大厅（分院 / 学院杯 / 飞行课） —— */
  function moonhall() {
    const m = base('moonhall', '月光学院 · 大厅', 30, 20, { fill: 'moonFloor', bgm: 'mystery', indoor: true });
    rect(m, 0, 0, 30, 1, 'starWall'); rect(m, 0, 1, 30, 1, 'starWall');
    rect(m, 0, 2, 1, 17, 'starWall'); rect(m, 29, 2, 1, 17, 'starWall');
    rect(m, 0, 19, 30, 1, 'starWall');
    // 出口：南侧回校园（喷泉水帘）
    set(m, 14, 19, 'moonFloor'); set(m, 15, 19, 'moonFloor');
    m.doors.push({ x: 14, y: 19, to: ['campus', 21, 13, 'down'] });
    m.doors.push({ x: 15, y: 19, to: ['campus', 22, 13, 'down'] });
    m.objects.push({ kind: 'sign', x: 12, y: 18, w: 1, h: 1, text: '出口↓', solidTiles: [], s: 'exitSign' });   // 回校园
    m.objects.push({ kind: 'sign', x: 8, y: 18, w: 1, h: 2, text: '晨课铃', solidTiles: [[0, 1]], s: 'magicClass' }); // 魔法晨课（每日一题）
    m.objects.push({ kind: 'sign', x: 5, y: 11, w: 1, h: 1, text: '←魔法教室', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'wallArt', x: 3, y: 8, w: 1, h: 1, solidTiles: [] });      // 星图壁画
    m.objects.push({ kind: 'bannerFlag', x: 26, y: 8, w: 1, h: 1, solidTiles: [] });  // 学院旗
    m.objects.push({ kind: 'sign', x: 24, y: 11, w: 1, h: 1, text: '天文台→', solidTiles: [], s: 'exitSign' });
    // 西门 → 魔法教室区；东门 → 天文台
    set(m, 0, 10, 'doorDark'); set(m, 29, 10, 'doorDark');
    m.doors.push({ x: 0, y: 10, to: ['magic', 28, 10, 'left'] });
    m.doors.push({ x: 29, y: 10, to: ['astro', 1, 10, 'right'] });
    // 中央星纹与红毯
    rect(m, 13, 5, 4, 12, 'floorCarpet');
    // 归类帽（分院）
    m.objects.push({ kind: 'sortingHat', x: 14, y: 3, w: 1, h: 1, s: 'sortHat', solidTiles: [[0, 0]] });
    // 学院杯榜
    m.objects.push({ kind: 'sign', x: 5, y: 3, w: 1, h: 2, text: '学院杯', solidTiles: [[0, 1]], s: 'cupBoard' });
    // 飞行课扫帚架
    m.objects.push({ kind: 'broom', x: 24, y: 13, w: 1, h: 1, s: 'broomStand', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'broom', x: 25, y: 13, w: 1, h: 1, s: 'broomStand', solidTiles: [[0, 0]] });
    // 立柱（发光水晶点缀）
    [[3, 6], [26, 6], [3, 15], [26, 15]].forEach(([x, y]) => m.objects.push({ kind: 'lamp', x, y, w: 1, h: 2, solidTiles: [[0, 1]] }));
    [[6, 8], [23, 9], [7, 14], [22, 16], [10, 6], [19, 15]].forEach(([x, y]) => set(m, x, y, 'crystal'));
    // NPC：月见校长、金鹏
    m.npcs.push({ id: 'yuejian', x: 12, y: 6, dir: 'down', pal: 'yuejian', name: '月见校长', s: 'yuejian', wander: 1, acts: ['think', 'wave'] });
    m.npcs.push({ id: 'jinpeng', x: 19, y: 9, dir: 'left', pal: 'jinpeng', name: '金鹏', s: 'jinpeng', wander: 2, mood: '!', acts: ['doubt', 'think'] });
    if (ADV.Game.flags.letterGot) m.npcs.push({ id: 'qianqian', x: 25, y: 16, dir: 'up', pal: 'qianqian', name: '倩倩', s: 'qianqian', acts: ['read', 'think'] });
    m.spawn = { x: 15, y: 17, dir: 'up' };
    return m;
  }

  /* —— 魔法教室区（左魔药 / 右咒语） —— */
  function magic() {
    const m = base('magic', '月光学院 · 魔法教室', 30, 20, { fill: 'moonFloor', bgm: 'mystery', indoor: true });
    rect(m, 0, 0, 30, 1, 'starWall'); rect(m, 0, 1, 30, 1, 'starWall');
    rect(m, 0, 2, 1, 17, 'starWall'); rect(m, 29, 2, 1, 17, 'starWall');
    rect(m, 0, 19, 30, 1, 'starWall');
    rect(m, 15, 2, 1, 17, 'starWall');                                 // 中隔墙
    set(m, 15, 10, 'doorDark'); set(m, 16, 10, 'doorDark');            // 左右互通（双向）
    m.doors.push({ x: 15, y: 10, to: ['magic', 16, 10, 'right'] });
    m.doors.push({ x: 16, y: 10, to: ['magic', 15, 10, 'left'] });
    set(m, 29, 10, 'doorDark');
    m.doors.push({ x: 29, y: 10, to: ['moonhall', 28, 10, 'left'] });
    // —— 左：魔药教室 ——
    rect(m, 2, 3, 5, 1, 'shelfOld');
    m.objects.push({ kind: 'sign', x: 14, y: 11, w: 1, h: 1, text: '通路→', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'cauldron', x: 5, y: 8, w: 1, h: 1, s: 'cauldron', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'cauldron', x: 9, y: 11, w: 1, h: 1, s: 'cauldron', solidTiles: [[0, 0]] });
    [[3, 13], [11, 5]].forEach(([x, y]) => set(m, x, y, 'crystal'));
    m.npcs.push({ id: 'momo', x: 6, y: 10, dir: 'down', pal: 'momo', name: '墨墨', s: 'momo', wander: 1, acts: ['read', 'think'] });
    // —— 右：咒语教室 ——
    rect(m, 20, 3, 6, 1, 'blackboard');
    m.objects.push({ kind: 'sign', x: 18, y: 4, w: 1, h: 2, text: '咒语课', solidTiles: [[0, 1]], s: 'charmBoard' });
    m.objects.push({ kind: 'sign', x: 28, y: 8, w: 1, h: 1, text: '出口↑', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'sign', x: 17, y: 12, w: 1, h: 1, text: '回大厅←', solidTiles: [], s: 'exitSign' });
    [19, 22, 25].forEach(x => set(m, x, 8, 'desk'));
    [[21, 12], [25, 14]].forEach(([x, y]) => set(m, x, y, 'crystal'));
    // —— 自然魔法角（蒲老师：动物学/昆虫学教学 + 捕捉作业联动） ——
    rect(m, 26, 3, 2, 1, 'shelfOld');                                  // 生物标本架
    m.objects.push({ kind: 'sign', x: 28, y: 5, w: 1, h: 1, text: '观察', solidTiles: [], s: 'natureSign' });   // 收集指南指路牌
    m.npcs.push({ id: 'teacher_pu', x: 26, y: 6, dir: 'down', pal: 'teacher_pu', name: '蒲老师', s: 'teacherPu', wander: 1, acts: ['read', 'wave'] });
    m.spawn = { x: 27, y: 17, dir: 'up' };
    return m;
  }

  /* —— 天文台（星座课 / 顶层观星） —— */
  function astro() {
    const m = base('astro', '月光学院 · 天文台', 30, 20, { fill: 'moonFloor', bgm: 'mystery', indoor: true });
    rect(m, 0, 0, 30, 1, 'starWall'); rect(m, 0, 1, 30, 1, 'starWall');
    rect(m, 0, 2, 1, 17, 'starWall'); rect(m, 29, 2, 1, 17, 'starWall');
    rect(m, 0, 19, 30, 1, 'starWall');
    set(m, 0, 10, 'doorDark');
    m.doors.push({ x: 0, y: 10, to: ['moonhall', 1, 10, 'right'] });
    // 顶层门（学院杯后开放；双层墙需打通 y=0 与 y=1 两行）
    set(m, 14, 0, 'doorDark'); set(m, 15, 0, 'doorDark');
    set(m, 14, 1, 'moonFloor'); set(m, 15, 1, 'moonFloor');
    m.doors.push({ x: 14, y: 0, to: ['astroTop', 10, 12, 'up'], need: 'houseCup' });
    m.doors.push({ x: 15, y: 0, to: ['astroTop', 10, 12, 'up'], need: 'houseCup' });
    m.objects.push({ kind: 'telescope', x: 14, y: 5, w: 1, h: 1, s: 'telescope', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'telescope', x: 20, y: 12, w: 1, h: 1, s: 'telescope', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'dateSpot', x: 10, y: 8, w: 1, h: 1, solidTiles: [], s: 'hangSpot', h: 'star' });       // 星空夜·和任何人
    [[6, 6], [10, 12], [23, 5], [25, 15], [8, 16], [19, 16], [5, 10], [24, 9]].forEach(([x, y]) => set(m, x, y, 'crystal'));
    m.spawn = { x: 15, y: 17, dir: 'up' };
    return m;
  }

  /* —— 旧图书馆 · 禁书区 —— */
  function oldlib() {
    const m = base('oldlib', '旧图书馆 · 禁书区', 30, 20, { fill: 'moonFloor', bgm: 'mystery', indoor: true });
    rect(m, 0, 0, 30, 1, 'starWall'); rect(m, 0, 1, 30, 1, 'starWall');
    rect(m, 0, 2, 1, 17, 'starWall'); rect(m, 29, 2, 1, 17, 'starWall');
    rect(m, 0, 19, 30, 1, 'starWall');
    // 南门回图书馆
    set(m, 15, 19, 'doorDark');
    m.doors.push({ x: 15, y: 19, to: ['library', 15, 2, 'up'] });
    // 书架迷宫
    [3, 8, 13, 18, 23].forEach(x => rect(m, x, 4, 1, 8, 'shelfOld'));
    [5, 10, 15, 20, 25].forEach(x => rect(m, x, 12, 1, 5, 'shelfOld'));
    // 线索之书（发光书架）
    m.inters.push({ x: 13, y: 13, s: 'libBook' });
    // 北端暗门 → 地下走廊（取得线索后）
    set(m, 15, 1, 'doorDark');
    m.doors.push({ x: 15, y: 1, to: ['corridor', 15, 17, 'down'], need: 'libClue' });
    m.objects.push({ kind: 'sign', x: 9, y: 16, w: 1, h: 1, text: '✦', solidTiles: [], s: 'hist', h: 3, sparkle: true });  // 暗线·校史缺页3
    m.npcs.push({ id: 'grey', x: 20, y: 16, dir: 'left', pal: 'grey', name: '灰先生', s: 'grey', acts: ['think', 'read'] });
    m.objects.push({ kind: 'mysterySpot', x: 22, y: 16, w: 1, h: 1, solidTiles: [], s: 'rumor', rid: 7 });   // 怪谈7：镜中的自己
    [[7, 6], [16, 9], [22, 14], [11, 17]].forEach(([x, y]) => set(m, x, y, 'crystal'));
    m.spawn = { x: 15, y: 17, dir: 'up' };
    return m;
  }

  /* —— 地下走廊（三首犬旺福看守活板门） —— */
  function corridor() {
    const m = base('corridor', '地下走廊 · 三首犬的巢穴', 30, 20, { fill: 'caveFloor', bgm: 'mystery', indoor: true });
    rect(m, 0, 0, 30, 1, 'caveWall'); rect(m, 0, 1, 30, 1, 'caveWall');
    rect(m, 0, 2, 1, 17, 'caveWall'); rect(m, 29, 2, 1, 17, 'caveWall');
    rect(m, 0, 19, 30, 1, 'caveWall');
    // 南门回禁书区
    set(m, 15, 19, 'doorDark');
    m.doors.push({ x: 15, y: 19, to: ['oldlib', 15, 2, 'up'] });
    // 三首犬（2×2 挡住北通道）
    m.objects.push({
      id: 'dog', kind: 'dog', x: 14, y: 6, w: 2, h: 2, sleep: false, s: 'dog',
      solidTiles: [[0, 0], [1, 0], [0, 1], [1, 1]]
    });
    // 活板门（旺福睡后可过）
    m.objects.push({ kind: 'trapdoor', x: 14, y: 3, w: 2, h: 1, s: 'trapLook', solidTiles: [] });
    m.doors.push({ x: 14, y: 3, to: ['trials', 32, 17, 'down'], need: 'dogSleep' });
    m.doors.push({ x: 15, y: 3, to: ['trials', 32, 17, 'down'], need: 'dogSleep' });
    [[5, 6], [24, 8], [8, 14], [21, 15], [12, 11]].forEach(([x, y]) => set(m, x, y, 'crystal'));
    [[4, 9], [25, 13]].forEach(([x, y]) => m.objects.push({ kind: 'rock', x, y, w: 1, h: 1, solidTiles: [[0, 0]] }));
    m.spawn = { x: 15, y: 17, dir: 'up' };
    return m;
  }

  /* —— 回廊五关（东进西出：藤→钥→棋→药→镜） —— */
  function trials() {
    const m = base('trials', '回廊五关 · 晨曦之径', 34, 20, { fill: 'caveFloor', bgm: 'mystery', indoor: true });
    rect(m, 0, 0, 34, 1, 'caveWall'); rect(m, 0, 1, 34, 1, 'caveWall');
    rect(m, 0, 2, 1, 17, 'caveWall'); rect(m, 33, 2, 1, 17, 'caveWall');
    rect(m, 0, 19, 34, 1, 'caveWall');
    // 东入口（活板门落下）
    set(m, 32, 18, 'doorDark');
    m.doors.push({ x: 32, y: 18, to: ['corridor', 15, 4, 'down'] });
    // 四道全高石墙闸门（石闸 rock 挡住门洞，过关后升起）
    const gate = (x, id, flag) => {
      rect(m, x, 2, 1, 17, 'caveWall');
      set(m, x, 10, 'doorDark');
      m.objects.push({ id, kind: 'rock', x, y: 10, w: 1, h: 1, solidTiles: [[0, 0]] });
      m.doors.push({ x, y: 10, to: ['trials', x - 1, 10, 'left'], need: flag });
      m.doors.push({ x: x - 1, y: 10, to: ['trials', x + 1, 10, 'right'], need: flag });
    };
    gate(26, 'gate1', 't1');
    gate(19, 'gate2', 't2');
    gate(12, 'gate3', 't3');
    gate(5, 'gate4', 't4');
    // 五个挑战点（从东到西：藤/钥/棋/药/镜）
    m.inters.push({ x: 28, y: 8, s: 't1Vine' });     // 魔鬼藤
    m.inters.push({ x: 22, y: 12, s: 't2Keys' });    // 飞钥匙
    m.inters.push({ x: 15, y: 8, s: 't3Chess' });    // 巫师棋
    m.inters.push({ x: 8, y: 12, s: 't4Potion' });   // 魔药谜题
    m.objects.push({ kind: 'mirror', x: 2, y: 6, w: 2, h: 2, s: 't5Mirror', solidTiles: [[0, 0], [1, 0], [0, 1], [1, 1]] });
    // 通关出口（镜子后回月光大厅）
    set(m, 2, 18, 'doorDark'); set(m, 3, 18, 'doorDark');
    m.doors.push({ x: 2, y: 18, to: ['moonhall', 15, 5, 'down'], need: 'shadowDown' });
    m.doors.push({ x: 3, y: 18, to: ['moonhall', 15, 5, 'down'], need: 'shadowDown' });
    [[28, 14], [22, 6], [15, 14], [8, 6], [31, 8]].forEach(([x, y]) => set(m, x, y, 'crystal'));
    [[27, 6], [21, 14], [14, 6], [7, 14]].forEach(([x, y]) => m.objects.push({ kind: 'rock', x, y, w: 1, h: 1, solidTiles: [[0, 0]] }));
    m.spawn = { x: 32, y: 17, dir: 'up' };
    return m;
  }

  /* —— 天文台顶层（结局后观星圣地） —— */
  function astroTop() {
    const m = base('astroTop', '天文台 · 顶层', 20, 14, { fill: 'moonFloor', bgm: 'mystery', indoor: true });
    rect(m, 0, 0, 20, 1, 'starWall'); rect(m, 0, 1, 20, 1, 'starWall');
    rect(m, 0, 2, 1, 11, 'starWall'); rect(m, 19, 2, 1, 11, 'starWall');
    rect(m, 0, 13, 20, 1, 'starWall');
    set(m, 9, 13, 'doorDark'); set(m, 10, 13, 'doorDark');
    m.doors.push({ x: 9, y: 13, to: ['astro', 14, 2, 'down'] });
    m.doors.push({ x: 10, y: 13, to: ['astro', 15, 2, 'down'] });
    m.objects.push({ kind: 'telescope', x: 9, y: 4, w: 1, h: 1, s: 'topScope', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'photoSpot', x: 11, y: 5, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's10' });   // 镜筒里的月亮
    m.objects.push({ id: 'chestTop', kind: 'chest', x: 16, y: 3, w: 1, h: 1, open: false, s: 'chestTop', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'sign', x: 3, y: 8, w: 1, h: 2, text: '星之誓约', solidTiles: [[0, 1]], s: 'topSign' });
    [[4, 4], [15, 8], [6, 10], [13, 5], [17, 11]].forEach(([x, y]) => set(m, x, y, 'crystal'));
    m.npcs.push({ id: 'owl2', x: 5, y: 6, dir: 'down', cat: { body: '#f4f4f8' }, name: '团子', s: 'owl', acts: ['sleep'] });
    m.spawn = { x: 10, y: 11, dir: 'up' };
    return m;
  }

  /* ==================== 校园北新区 ==================== */
  function northyard() {
    const m = base('northyard', '校园 · 北新区', 34, 22, { fill: 'grass', bgm: 'campus', particles: null });
    rect(m, 14, 14, 4, 8, 'path');
    set(m, 16, 21, 'path'); set(m, 17, 21, 'path');
    m.doors.push({ x: 16, y: 21, to: ['campus', 45, 1, 'down'] });   // 校园北门移至 45/46 列
    m.doors.push({ x: 17, y: 21, to: ['campus', 46, 1, 'down'] });
    rect(m, 5, 10, 24, 2, 'path');
    // 钟楼（三章入口）
    m.objects.push({ kind: 'lamp', x: 15, y: 8, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'sign', x: 16, y: 9, w: 1, h: 1, text: '💡', solidTiles: [], s: 'nightLamp' });
    m.objects.push({ id: 'bell', kind: 'sign', x: 18, y: 8, w: 1, h: 2, text: '钟楼', solidTiles: [[0, 1]], s: 'bellTower' });
    // 道场 / 社团楼 / 宿舍 / 医务室
    building(m, 3, 2, 9, 5, { roof: 'roofR', name: '道场', to: ['dojo', 15, 16, 'up'] });
    building(m, 14, 2, 9, 5, { roof: 'roofB', name: '社团楼', to: ['club', 15, 16, 'up'] });
    building(m, 25, 2, 7, 5, { roof: 'roofT', name: '宿舍', to: ['dorm', 10, 12, 'up'] });
    m.objects.push({ kind: 'sign', x: 26, y: 8, w: 1, h: 2, text: '医务室', solidTiles: [], s: 'clinicSign' });
    m.npcs.push({ id: 'tiezhu', x: 20, y: 12, dir: 'down', pal: 'tiezhu', name: '铁柱', s: 'tiezhu', acts: ['think', 'doubt'] });
    set(m, 26, 10, 'doorWood');
    m.doors.push({ x: 26, y: 10, to: ['infirmary', 9, 10, 'up'] });
    // 天台楼梯（露天阶梯物）
    m.objects.push({ kind: 'caveMouth', x: 8, y: 10, w: 1, h: 2, s: 'roofStairs', solidTiles: [[0, 1]] });   // 基座(8,11)，避开天台回程落点(8,12)
    m.doors.push({ x: 8, y: 13, to: ['rooftop', 14, 14, 'up'] });
    // 埋宝点 & 收集闪光
    m.objects.push({ kind: 'dig', x: 30, y: 16, w: 1, h: 1, solidTiles: [], s: 'dig', did: 'd6' });
    m.objects.push({ kind: 'rock', x: 5, y: 17, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'pickupSpot', x: 11, y: 17, w: 1, h: 1, solidTiles: [], s: 'forage', fid: 'nf0', sparkle: true });
    [[6, 6], [29, 8], [12, 18]].forEach(([x, y]) => set(m, x, y, 'grass2'));
    m.spawn = { x: 17, y: 20, dir: 'up' };
    return m;
  }

  /* —— 比武道场 —— */
  function dojo() {
    const m = base('dojo', '北新区 · 比武道场', 30, 18, { fill: 'floorWood', bgm: 'wuyun', indoor: true });
    rect(m, 0, 0, 30, 1, 'inWallTop'); rect(m, 0, 1, 30, 1, 'inWall');
    rect(m, 0, 2, 1, 15, 'inWall'); rect(m, 29, 2, 1, 15, 'inWall'); rect(m, 0, 17, 30, 1, 'inWall');
    set(m, 15, 17, 'doorWood');
    m.doors.push({ x: 15, y: 17, to: ['northyard', 7, 7, 'down'] });
    m.objects.push({ kind: 'dummy', x: 6, y: 4, w: 1, h: 2, s: 'dummy', solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'dummy', x: 8, y: 4, w: 1, h: 2, s: 'dummy', solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'goban', x: 22, y: 12, w: 1, h: 1, s: 'gobanPlay', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'coatHook', x: 10, y: 3, w: 1, h: 1, solidTiles: [] });    // 武具钩
    m.objects.push({ kind: 'bannerFlag', x: 11, y: 3, w: 1, h: 1, solidTiles: [] });  // 道场锦旗
    m.npcs.push({ id: 'dojomaster', x: 15, y: 3, dir: 'down', pal: 'dojomaster', name: '道场师傅', s: 'dojomaster', acts: ['think', 'wave'] });
    m.objects.push({ kind: 'sign', x: 25, y: 3, w: 1, h: 2, text: '挑战榜', solidTiles: [[0, 1]], s: 'challengeBoard' });
    m.objects.push({ kind: 'sign', x: 27, y: 8, w: 1, h: 2, text: '竞技场', solidTiles: [[0, 1]], s: 'endlessArena' });      // 无尽答题竞技场
    m.spawn = { x: 15, y: 15, dir: 'up' };
    return m;
  }

  /* —— 社团楼 —— */
  function club() {
    const m = base('club', '北新区 · 社团楼', 30, 18, { fill: 'floorWood', bgm: 'indoor', indoor: true });
    rect(m, 0, 0, 30, 1, 'inWallTop'); rect(m, 0, 1, 30, 1, 'inWall');
    rect(m, 0, 2, 1, 15, 'inWall'); rect(m, 29, 2, 1, 15, 'inWall'); rect(m, 0, 17, 30, 1, 'inWall');
    set(m, 15, 17, 'doorWood');
    m.doors.push({ x: 15, y: 17, to: ['northyard', 18, 7, 'down'] });
    // 三大社团角
    m.objects.push({ kind: 'goban', x: 5, y: 5, w: 1, h: 1, s: 'chessClub', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'easel', x: 22, y: 4, w: 1, h: 1, s: 'artClub', solidTiles: [[0, 0]] });
    rect(m, 12, 3, 6, 1, 'wallShelf');
    m.objects.push({ kind: 'cauldron', x: 14, y: 8, w: 1, h: 1, s: 'sciClub', solidTiles: [[0, 0]] });
    m.npcs.push({ id: 'artChief', x: 20, y: 6, dir: 'down', pal: 'xiaoying', name: '美术部长', s: 'artChief', acts: ['read', 'think'] });
    m.objects.push({ kind: 'sign', x: 8, y: 13, w: 1, h: 2, text: '社团登记', solidTiles: [[0, 1]], s: 'clubJoin' });   // 社团经营
    m.spawn = { x: 15, y: 15, dir: 'up' };
    return m;
  }

  /* —— 宿舍 —— */
  function dorm() {
    const m = base('dorm', '北新区 · 学生宿舍', 20, 14, { fill: 'floorTile', bgm: 'indoor', indoor: true });
    rect(m, 0, 0, 20, 1, 'inWallTop'); rect(m, 0, 1, 20, 1, 'inWall');
    rect(m, 0, 2, 1, 11, 'inWall'); rect(m, 19, 2, 1, 11, 'inWall'); rect(m, 0, 13, 20, 1, 'inWall');
    set(m, 10, 13, 'doorWood');
    m.doors.push({ x: 10, y: 13, to: ['northyard', 28, 7, 'down'] });
    m.objects.push({ kind: 'bed', x: 3, y: 4, w: 1, h: 1, s: 'dormBed', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bed', x: 3, y: 8, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bed', x: 15, y: 4, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bed', x: 15, y: 8, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'shelf2', x: 9, y: 2, w: 1, h: 1, s: 'shelfPeek', solidTiles: [[0, 0]] });
    m.spawn = { x: 10, y: 11, dir: 'up' };
    return m;
  }

  /* —— 医务室 —— */
  function infirmary() {
    const m = base('infirmary', '北新区 · 医务室', 18, 12, { fill: 'floorTile', bgm: 'indoor', indoor: true });
    rect(m, 0, 0, 18, 1, 'inWallTop'); rect(m, 0, 1, 18, 1, 'inWall');
    rect(m, 0, 2, 1, 9, 'inWall'); rect(m, 17, 2, 1, 9, 'inWall'); rect(m, 0, 11, 18, 1, 'inWall');
    set(m, 9, 11, 'doorWood');
    m.doors.push({ x: 9, y: 11, to: ['northyard', 26, 11, 'down'] });
    m.objects.push({ kind: 'bed', x: 4, y: 4, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bed', x: 4, y: 7, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.npcs.push({ id: 'doctor', x: 12, y: 4, dir: 'down', pal: 'doctor', name: '校医', s: 'doctor', acts: ['think'] });
    // —— A组·医务室激活 ——
    m.objects.push({ kind: 'sign', x: 14, y: 4, w: 1, h: 1, text: '📏', solidTiles: [], s: 'heightScale' });
    m.objects.push({ kind: 'sign', x: 15, y: 8, w: 1, h: 1, text: '💊', solidTiles: [], s: 'medCab' });
    m.objects.push({ kind: 'sign', x: 4, y: 10, w: 1, h: 1, text: '🛏', solidTiles: [], s: 'restBed' });
    m.spawn = { x: 9, y: 9, dir: 'up' };
    return m;
  }

  /* —— 天台（乌云帮秘密基地） —— */
  function rooftop() {
    const m = base('rooftop', '教学楼 · 天台', 30, 16, { fill: 'stone', bgm: 'street', indoor: false });
    rect(m, 0, 0, 30, 2, 'inWallTop');
    rect(m, 0, 15, 30, 1, 'inWall');
    // 围栏
    for (let x = 0; x < 30; x++) if (x < 13 || x > 16) set(m, x, 14, 'gateWall');
    set(m, 14, 15, 'doorWood'); set(m, 15, 15, 'doorWood');
    m.doors.push({ x: 14, y: 15, to: ['northyard', 8, 12, 'down'] });
    m.doors.push({ x: 15, y: 15, to: ['northyard', 8, 12, 'down'] });
    m.objects.push({ kind: 'bench', x: 6, y: 6, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bench', x: 22, y: 6, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'easel', x: 20, y: 9, w: 1, h: 1, s: 'yingEasel', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'dateSpot', x: 20, y: 7, w: 1, h: 1, solidTiles: [], s: 'hangSpot', h: 'gang' });       // 天台·和小刚
    m.objects.push({ kind: 'sign', x: 5, y: 10, w: 1, h: 1, text: '飞机', solidTiles: [[0,0]], s: 'plane' });                 // 纸飞机放飞点
    m.objects.push({ kind: 'photoSpot', x: 26, y: 9, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's9' });        // 天台星空机位
    // 乌云帮三人（按剧情阶段出现）
    const F = ADV.Game.flags;
    const gangHere = !F.wuyunGang;
    if (gangHere) {
      m.npcs.push({ id: 'wuyun', x: 13, y: 6, dir: 'down', pal: 'wuyun', name: '乌云', s: 'wuyun', acts: ['doubt', 'think'] });
      m.npcs.push({ id: 'dazhuang', x: 16, y: 8, dir: 'left', pal: 'dazhuang', name: '大壮', s: 'dazhuang', acts: ['yawn'] });
      m.npcs.push({ id: 'xiaoying', x: 11, y: 9, dir: 'right', pal: 'xiaoying', name: '小影', s: 'xiaoying', acts: ['read'] });
    }
    m.spawn = { x: 14, y: 12, dir: 'up' };
    return m;
  }

  function giftShopIn() {
    const m = shopRoom('giftShopIn', '小镇 · 礼品店', ['town', 8, 14, 'down'], 'floorWood');
    rect(m, 3, 3, 18, 1, 'counter');
    rect(m, 2, 1, 5, 1, 'wallShelf');
    rect(m, 17, 1, 5, 1, 'wallShelf');
    m.npcs.push({ id: 'shopgirl', x: 12, y: 2, dir: 'down', pal: 'shopgirl', name: '礼品店员', s: 'giftShop', acts: ['wave', 'laugh'] });
    m.objects.push({ kind: 'plantRack', x: 3, y: 10, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'wallClock', x: 20, y: 2, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'coatHook', x: 6, y: 2, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'trophyFrame', x: 18, y: 2, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'bookStack', x: 6, y: 8, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bookStack', x: 17, y: 8, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'chair2', x: 12, y: 9, w: 1, h: 1, solidTiles: [[0, 0]] });
    return m;
  }

  function bookShopIn() {
    const m = shopRoom('bookShopIn', '小镇 · 书店', ['town', 18, 14, 'down'], 'floorTile');
    rect(m, 9, 3, 6, 1, 'counter');
    [3, 6, 17, 20].forEach(x => rect(m, x, 4, 1, 7, 'shelf'));
    set(m, 11, 8, 'tableRound');
    set(m, 10, 8, 'chair'); set(m, 12, 8, 'chair');
    m.npcs.push({ id: 'bookman', x: 12, y: 2, dir: 'down', pal: 'bookman', name: '书店老板', s: 'bookShop', acts: ['read', 'wave'] });
    m.objects.push({ kind: 'bookStack', x: 8, y: 2, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bookStack', x: 15, y: 2, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'plant', x: 2, y: 10, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'plant', x: 21, y: 10, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'wallClock', x: 18, y: 2, w: 1, h: 1, solidTiles: [] });
    return m;
  }

  function foodShopIn() {
    const m = shopRoom('foodShopIn', '小镇 · 小吃摊', ['town', 27, 14, 'down'], 'floorTile');
    rect(m, 3, 2, 4, 1, 'stove');
    rect(m, 8, 3, 10, 1, 'counter');
    set(m, 8, 8, 'tableRound'); set(m, 15, 8, 'tableRound');
    set(m, 7, 8, 'chair'); set(m, 9, 8, 'chair'); set(m, 14, 8, 'chair'); set(m, 16, 8, 'chair');
    m.npcs.push({ id: 'aunt2', x: 12, y: 2, dir: 'down', pal: 'aunt', name: '摊主', s: 'foodShop', acts: ['laugh', 'wave'] });
    m.objects.push({ kind: 'stove2', x: 5, y: 5, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'wallClock', x: 20, y: 2, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'chair2', x: 19, y: 9, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'plant', x: 21, y: 10, w: 1, h: 1, solidTiles: [[0, 0]] });
    return m;
  }

  /* —— 精灵小筑（s9 · 精灵对战方案）：阿橘的宠物商店 ——
   * 柜台三入口：日常补给（球·口粮·诱饵）/ 珍稀精灵架（每日三格）/ 收购台（图鉴换零钱） */
  function petShopIn() {
    const m = shopRoom('petShopIn', '小镇 · 精灵小筑', ['town', 34, 24, 'down'], 'floorWood');
    rect(m, 3, 3, 18, 1, 'counter');
    rect(m, 2, 1, 5, 1, 'wallShelf');                     // 货架：球与口粮
    rect(m, 17, 1, 5, 1, 'wallShelf');
    m.npcs.push({ id: 'aju', x: 12, y: 2, dir: 'down', pal: 'shopgirl', name: '阿橘', s: 'petShop', acts: ['wave', 'laugh'] });
    m.objects.push({ kind: 'bookStack', x: 3, y: 8, w: 1, h: 1, solidTiles: [[0, 0]] });   // 图鉴样册
    m.objects.push({ kind: 'bookStack', x: 20, y: 8, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'plant', x: 2, y: 10, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'plant', x: 21, y: 10, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'wallClock', x: 20, y: 2, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'chair2', x: 8, y: 9, w: 1, h: 1, solidTiles: [[0, 0]] });      // 挑选休息角
    return m;
  }

  /* ==================== 阳光小镇 ==================== */
  function town() {
    const m = base('town', '阳光小镇 · 街区', 60, 36, { fill: 'grass', bgm: 'street' });
    // 主街（东西向）
    rect(m, 2, 16, 56, 3, 'path');
    rect(m, 58, 14, 2, 7, 'path');
    // 东门回校园
    set(m, 59, 18, 'path'); set(m, 59, 19, 'path');
    m.doors.push({ x: 59, y: 18, to: ['campus', 1, 14, 'right'] });
    m.doors.push({ x: 59, y: 19, to: ['campus', 1, 15, 'right'] });
    // 小镇北出口 → 栖霞小区（回家方向路牌）
    set(m, 29, 1, 'path'); set(m, 30, 1, 'path');
    m.objects.push({ kind: 'sign', x: 31, y: 2, w: 1, h: 1, text: '栖霞小区↑', solidTiles: [], s: 'exitSign' });
    m.doors.push({ x: 29, y: 1, to: ['homeYard', 10, 12, 'up'] });
    m.doors.push({ x: 30, y: 1, to: ['homeYard', 11, 12, 'up'] });
    // 商店街（北侧一排店铺立面）
    // 商店建筑立面（与店员 NPC 柜台交互购买）
    building(m, 4, 8, 8, 5, { roof: 'roofO', name: '礼品店', to: ['giftShopIn', 11, 11, 'up'] });
    building(m, 14, 8, 8, 5, { roof: 'roofB', name: '书店', to: ['bookShopIn', 11, 11, 'up'] });
    building(m, 24, 8, 6, 5, { roof: 'roofT', name: '小吃摊', to: ['foodShopIn', 11, 11, 'up'] });
    // 商店街前缘：用浅石铺出连续步道，和主街区分层
    rect(m, 3, 13, 28, 2, 'stone');
    // 门口保留招呼用店员，兼容原有日程与交互习惯
    m.npcs.push({ id: 'shopgirl', x: 8, y: 14, dir: 'down', pal: 'shopgirl', name: '礼品店员', s: 'giftShop' });
    m.npcs.push({ id: 'bookman', x: 18, y: 14, dir: 'down', pal: 'bookman', name: '书店老板', s: 'bookShop' });
    m.npcs.push({ id: 'aunt2', x: 27, y: 14, dir: 'down', pal: 'aunt', name: '摊主', s: 'foodShop' });
    m.npcs.push({ id: 'lao_li', x: 44, y: 20, dir: 'down', pal: 'lao_li', name: '老李', s: 'lao_li', acts: ['think'] });
    m.npcs.push({ id: 'baiyun', x: 38, y: 22, dir: 'down', pal: 'baiyun', name: '白云', s: 'baiyun', wander: 1, mood: '♥', acts: ['wave'] });
    // 修车铺（大壮支线）
    m.objects.push({ kind: 'sign', x: 38, y: 13, w: 1, h: 2, text: '修车铺', solidTiles: [[0, 1]], s: 'repairSign' });
    m.inters.push({ x: 38, y: 14, s: 'repairSpot' });
    // 周日跳蚤集市摊位（脚本内判定周日开市；符号避开时段摊位专用的 🧺，防止时段枚举误收）
    m.objects.push({ kind: 'sign', x: 46, y: 15, w: 1, h: 1, text: '🎪', solidTiles: [], s: 'fleaMarket' });
    // —— s6 村民帮助板：小镇居民的需求都钉在这块板上（每日刷新，季节限定委托穿插） ——
    m.objects.push({ kind: 'sign', x: 48, y: 15, w: 1, h: 1, text: '📋', solidTiles: [], s: 'helpBoard' });
    // 小镇外部直接可见的公寓区
    apartmentBlock(m, 32, 5, 8, 7, {
      roof: 'roofT',
      doors: [
        { dx: 2, name: '小明', s: 'knock_xmHome' },
        { dx: 4, name: '小红', s: 'knock_xhHome' }
      ]
    });
    apartmentBlock(m, 41, 5, 8, 7, {
      roof: 'roofO',
      doors: [
        { dx: 2, name: '小刚', s: 'knock_xgHome' },
        { dx: 4, name: '小胖', s: 'knock_xpHome' }
      ]
    });
    apartmentBlock(m, 49, 5, 9, 7, {
      roof: 'roofB',
      doors: [
        { dx: 1, name: '乌云', s: 'knock_wyHome' },
        { dx: 3, name: '墨墨', s: 'knock_mmHome' },
        { dx: 5, name: '金鹏', s: 'knock_jpHome' },
        { dx: 7, name: '王美', s: 'knock_wmHome' }
      ]
    });
    // 商店街和公寓区之间做成一个连续口袋广场，避免两排建筑“硬贴”在一起
    rect(m, 31, 13, 27, 4, 'stone');
    [[34, 12], [36, 12], [43, 12], [45, 12], [50, 12], [52, 12], [54, 12], [56, 12]].forEach(([x, y]) => set(m, x, y, 'path'));
    rect(m, 34, 12, 23, 1, 'path');
    rect(m, 30, 13, 2, 6, 'path'); // 从旧书摊这侧自然接入公寓前场
    rect(m, 35, 12, 1, 5, 'path');
    rect(m, 44, 12, 1, 5, 'path');
    rect(m, 53, 12, 1, 5, 'path');
    m.objects.push({ kind: 'mailbox2', x: 31, y: 13, w: 1, h: 1, s: 'estateMail', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'swing', x: 56, y: 14, w: 1, h: 1, s: 'swingPlay', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bench', x: 52, y: 14, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'plantRack', x: 47, y: 14, w: 1, h: 1, s: 'estatePlant', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'flowerbed', x: 39, y: 14, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'flowerbed', x: 54, y: 14, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'lamp', x: 30, y: 13, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'lamp', x: 46, y: 13, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'lamp', x: 58, y: 13, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'bannerFlag', x: 34, y: 13, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'bannerFlag', x: 57, y: 13, w: 1, h: 1, solidTiles: [] });
    [[32, 17], [37, 17], [41, 17], [49, 17], [55, 17], [57, 16]].forEach(([x, y]) => set(m, x, y, 'grass2'));
    [[29, 14], [31, 17], [44, 17], [58, 16]].forEach(([x, y]) => set(m, x, y, 'tuft'));
    // 河边公园（南侧）
    rect(m, 6, 26, 16, 4, 'water');
    rect(m, 5, 25, 18, 1, 'sand'); rect(m, 5, 30, 18, 1, 'sand');
    // 河边步道与观景角：延续街区的石铺+灯+座椅语言
    rect(m, 5, 23, 18, 2, 'stone');
    rect(m, 18, 19, 2, 6, 'path');
    [[8, 24], [16, 24], [12, 31]].forEach(([x, y]) => tree(m, x, y));
    [[10, 24], [14, 31], [20, 27]].forEach(([x, y]) => set(m, x, y, 'grass2'));
    // 埋宝点 ×2 + 收集闪光 + 翻找/钓鱼/野餐/萤火
    m.objects.push({ kind: 'dig', x: 22, y: 32, w: 1, h: 1, solidTiles: [], s: 'dig', did: 'd7' });
    m.objects.push({ kind: 'dig', x: 45, y: 8, w: 1, h: 1, solidTiles: [], s: 'dig', did: 'd8' });
    [[13, 24, 'l4'], [46, 22, 'l7']].forEach(([x, y, cid]) =>
      m.objects.push({ kind: 'pickupSpot', x, y, w: 1, h: 1, solidTiles: [], s: 'pick', cid, sparkle: true }));
    [[19, 24], [47, 20]].forEach(([x, y], i) =>
      m.objects.push({ kind: 'pickupSpot', x, y, w: 1, h: 1, solidTiles: [], s: 'forage', fid: 'tf' + i, sparkle: true }));
    [[7, 25], [18, 25]].forEach(([x, y], i) =>
      m.objects.push({ kind: 'sign', x, y, w: 1, h: 1, text: '🎣', solidTiles: [], s: 'fish', fid: 'fs' + i }));
    // —— 周末补全：周日钓鱼大赛报到处（河畔石阶，白天开赛） ——
    m.objects.push({ kind: 'sign', x: 12, y: 25, w: 1, h: 1, text: '🏆', solidTiles: [], s: 'fishContest' });
    m.objects.push({ kind: 'sign', x: 12, y: 23, w: 1, h: 1, text: '✦', solidTiles: [], s: 'firefly', sparkle: true });
    m.objects.push({ kind: 'newsstand', x: 33, y: 14, w: 1, h: 1, s: 'newsstand2', solidTiles: [[0, 0]] });  // 报刊亭
    m.objects.push({ kind: 'mailbox2', x: 14, y: 17, w: 1, h: 1, solidTiles: [[0, 0]] });                    // 小镇邮筒
    m.objects.push({ kind: 'swing', x: 44, y: 24, w: 1, h: 1, s: 'swingTown', solidTiles: [[0, 0]] });       // 河畔秋千
    m.objects.push({ kind: 'clothesline', x: 50, y: 24, w: 1, h: 1, solidTiles: [] });                       // 晾衣绳
    m.objects.push({ kind: 'bannerFlag', x: 36, y: 13, w: 1, h: 1, solidTiles: [] });                        // 店铺旗
    m.objects.push({ kind: 'lamp', x: 6, y: 23, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'lamp', x: 21, y: 23, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'bench', x: 9, y: 24, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bench', x: 18, y: 24, w: 1, h: 1, solidTiles: [[0, 0]], s: 'picnic' });
    m.objects.push({ kind: 'flowerbed', x: 12, y: 23, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'flowerbed', x: 15, y: 23, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'dateSpot', x: 16, y: 15, w: 1, h: 1, solidTiles: [], s: 'hangSpot', h: 'ming' });      // 书店门口·和小明
    m.objects.push({ kind: 'dateSpot', x: 26, y: 15, w: 1, h: 1, solidTiles: [], s: 'hangSpot', h: 'pang' });     // 小吃摊·和小胖
    // 原先需切图进入的小区，现在直接并入小镇外景
    m.objects.push({ kind: 'sign', x: 39, y: 18, w: 1, h: 1, text: '公寓区↑', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'sign', x: 19, y: 28, w: 1, h: 1, text: '✦', solidTiles: [], s: 'hist', h: 2, sparkle: true }); // 暗线·校史缺页2
    [[10, 27, 's4'], [40, 14, 's5'], [30, 12, 's6']].forEach(([x, y, cid]) =>
      m.objects.push({ kind: 'photoSpot', x, y, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid }));
    m.objects.push({ kind: 'mysterySpot', x: 8, y: 28, w: 1, h: 1, solidTiles: [], s: 'rumor', rid: 3 });   // 怪谈3：柳树下的白影
    m.objects.push({ kind: 'mysterySpot', x: 38, y: 13, w: 1, h: 1, solidTiles: [], s: 'rumor', rid: 4 });  // 怪谈4：修车铺的灯
    // 边界树林（东门门砖(59,18)(59,19)上方的树会让位）
    for (let y = 0; y < 36; y++) { tree(m, 0, y); tree(m, 59, y); }
    for (let x = 1; x < 59; x++) if (x < 29 || x > 30) tree(m, x, 0);
    for (let x = 1; x < 59; x++) tree(m, x, 35);
    m.objects = m.objects.filter(o =>
      !(o.kind === 'tree' && o.x === 59 && (o.y === 17 || o.y === 18)) &&
      !(o.kind === 'tree' && o.y === 35 && (o.x === 24 || o.x === 25 || o.x === 52 || o.x === 53))
    );
    // 路灯与长椅（河边长椅可周末野餐）
    [[10, 15], [30, 20], [46, 15]].forEach(([x, y]) => m.objects.push({ kind: 'lamp', x, y, w: 1, h: 2, solidTiles: [[0, 1]] }));
    [[20, 13], [42, 21]].forEach(([x, y], i) => m.objects.push({ kind: 'bench', x, y, w: 1, h: 1, solidTiles: [[0, 0]], s: i === 0 ? 'picnic' : 'lantern', nightGlow: i === 1 }));
    // 西门 → 西郊田野
    set(m, 1, 16, 'path'); set(m, 1, 17, 'path'); set(m, 1, 18, 'path');
    m.doors.push({ x: 1, y: 17, to: ['fields', 42, 15, 'left'] });
    // 旧书摊（半价旧书 + 旧书翁）
    m.objects.push({ kind: 'sign', x: 33, y: 12, w: 1, h: 2, text: '旧书摊', solidTiles: [[0, 1]], s: 'bookstall' });
    m.npcs.push({ id: 'oldbook', x: 33, y: 14, dir: 'down', pal: 'oldbook', name: '旧书翁', s: 'oldbook', acts: ['read', 'think'] });
    // 小卖部（童年集换卡 · 王叔）
    m.objects.push({ kind: 'sign', x: 35, y: 12, w: 1, h: 2, text: '小卖部', solidTiles: [[0, 1]], s: 'cardStand' });
    m.npcs.push({ id: 'cardman', x: 35, y: 14, dir: 'down', pal: 'cardman', name: '王叔', s: 'cardman', acts: ['laugh', 'wave'] });
    // 跳蚤市场（东南空地：摆摊还价 / 以物易物 / 拍卖 · 摊主爷爷坐镇）
    rect(m, 46, 19, 3, 8, 'path');                        // 主街南下市场的鹅卵石小路
    rect(m, 44, 26, 12, 6, 'path');                       // 市场广场
    rect(m, 44, 21, 7, 4, 'stone');                       // 市场入口前场
    building(m, 39, 19, 6, 5, { roof: 'roofG', name: '理发店', to: ['barberIn', 11, 11, 'up'] });
    building(m, 50, 19, 8, 5, { roof: 'roofP', name: '照相馆', to: ['photoStudioIn', 11, 11, 'up'] });
    building(m, 31, 19, 6, 5, { roof: 'roofG', name: '精灵小筑', to: ['petShopIn', 11, 11, 'up'] });   // s9 · 阿橘的宠物商店
    rect(m, 39, 24, 19, 2, 'stone');
    m.objects.push({ kind: 'sign', x: 47, y: 25, w: 1, h: 2, text: '跳蚤市场', solidTiles: [[0, 1]], s: 'marketBoard' });
    m.npcs.push({ id: 'grandpa', x: 47, y: 28, dir: 'down', pal: 'oldbook', name: '摊主爷爷', s: 'market', acts: ['laugh', 'think'] });
    // 摊位随集市收摊：白天与傍晚摆着，深夜收走（摊主爷爷仍守着空场）
    [[45, 27], [50, 27], [54, 27]].forEach(([x, y]) =>
      m.objects.push({ kind: 'sign', x, y, w: 1, h: 1, text: '🧺', solidTiles: [[0, 0]], s: 'market', nightGlow: true, periods: [0, 1, 2, 3, 4] }));
    m.objects.push({ kind: 'lamp', x: 45, y: 22, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'lamp', x: 49, y: 22, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'bench', x: 47, y: 23, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'flowerbed', x: 45, y: 24, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'flowerbed', x: 48, y: 24, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'bannerFlag', x: 44, y: 22, w: 1, h: 1, solidTiles: [], nightGlow: true });
    m.objects.push({ kind: 'bannerFlag', x: 50, y: 22, w: 1, h: 1, solidTiles: [], nightGlow: true });
    m.objects.push({ kind: 'sign', x: 41, y: 24, w: 1, h: 1, text: '巷口', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'photoSpot', x: 54, y: 24, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's13' });
    m.objects.push({ kind: 'sign', x: 52, y: 28, w: 1, h: 1, text: '零食', solidTiles: [], s: 'exitSign' });
    // 南向扩展口：河湾与老街
    rect(m, 24, 30, 2, 6, 'path');
    rect(m, 52, 31, 2, 5, 'path');
    set(m, 24, 35, 'path'); set(m, 25, 35, 'path');
    set(m, 52, 35, 'path'); set(m, 53, 35, 'path');
    m.doors.push({ x: 24, y: 35, to: ['riverbay', 19, 1, 'up'] });
    m.doors.push({ x: 25, y: 35, to: ['riverbay', 20, 1, 'up'] });
    m.doors.push({ x: 52, y: 35, to: ['oldstreet', 5, 1, 'up'] });
    m.doors.push({ x: 53, y: 35, to: ['oldstreet', 6, 1, 'up'] });
    m.objects.push({ kind: 'sign', x: 26, y: 34, w: 1, h: 1, text: '河湾↓', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'sign', x: 54, y: 34, w: 1, h: 1, text: '老街↓', solidTiles: [], s: 'exitSign' });
    m.spawn = { x: 30, y: 20, dir: 'down' };
    return m;
  }

  /* —— 西郊田野（挖蚯蚓 · 钓鱼 · 农事） —— */
  function fields() {
    const m = base('fields', '西郊 · 田野', 44, 30, { fill: 'grass', bgm: 'street', particles: 'dragonfly' });
    // 东侧入口回小镇
    rect(m, 40, 14, 4, 3, 'path');
    set(m, 43, 15, 'path');
    m.doors.push({ x: 43, y: 15, to: ['town', 2, 17, 'left'] });
    // 向外扩展：果园 / 山脚 / 小农舍
    rect(m, 0, 10, 10, 2, 'path');
    rect(m, 18, 0, 2, 9, 'path');
    rect(m, 30, 21, 2, 9, 'path');
    set(m, 0, 10, 'path'); set(m, 0, 11, 'path');
    set(m, 18, 0, 'path'); set(m, 19, 0, 'path');
    set(m, 30, 29, 'path'); set(m, 31, 29, 'path');
    m.doors.push({ x: 1, y: 10, to: ['orchard', 35, 12, 'left'] });
    m.doors.push({ x: 1, y: 11, to: ['orchard', 35, 13, 'left'] });
    m.doors.push({ x: 18, y: 0, to: ['hillside', 44, 50, 'up'] });
    m.doors.push({ x: 19, y: 0, to: ['hillside', 45, 50, 'up'] });
    m.doors.push({ x: 30, y: 28, to: ['farmstead', 25, 9, 'left'] });
    m.doors.push({ x: 31, y: 28, to: ['farmstead', 25, 10, 'left'] });
    // 入口前场：乡间路口的小告示、歇脚凳和农具棚
    rect(m, 35, 13, 8, 4, 'stone');
    building(m, 35, 7, 6, 5, { roof: 'roofO', name: '农具棚', to: null });
    // 田埂小路
    rect(m, 10, 15, 30, 1, 'path');
    rect(m, 10, 8, 1, 8, 'path');
    rect(m, 22, 15, 1, 6, 'path');
    rect(m, 33, 9, 1, 7, 'path');
    // 菜畦：松土 + 庄稼
    [[4, 4], [12, 4], [20, 4], [28, 4]].forEach(([x, y]) => { rect(m, x, y, 6, 3, 'soil'); rect(m, x, y, 6, 1, 'crop'); });
    [[12, 9], [20, 9], [28, 9], [12, 12], [28, 12]].forEach(([x, y]) => rect(m, x, y, 6, 2, 'crop'));
    rect(m, 34, 4, 6, 3, 'paddy');                       // 秧田
    // 水渠（可钓鱼）
    rect(m, 2, 20, 40, 3, 'water');
    rect(m, 2, 19, 40, 1, 'sand');
    rect(m, 2, 23, 40, 1, 'sand');
    rect(m, 7, 7, 2, 12, 'water'); rect(m, 7, 6, 2, 1, 'sand'); rect(m, 7, 19, 2, 1, 'sand');
    rect(m, 7, 10, 2, 2, 'path');
    // 边界树林
    for (let y = 0; y < 30; y++) { tree(m, 0, y); tree(m, 43, y); }
    for (let x = 1; x < 43; x++) tree(m, x, 0);
    for (let x = 1; x < 43; x++) tree(m, x, 29);
    m.objects = m.objects.filter(o =>
      !(o.kind === 'tree' && o.x === 43 && o.y >= 14 && o.y <= 16) &&
      !(o.kind === 'tree' && o.x === 0 && (o.y === 10 || o.y === 11)) &&
      !(o.kind === 'tree' && o.y === 0 && (o.x === 18 || o.x === 19)) &&
      !(o.kind === 'tree' && o.y === 29 && (o.x === 30 || o.x === 31))
    );
    // 稻草人 / 树 / 石
    m.objects.push({ kind: 'scarecrow', x: 7, y: 6, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'scarecrow', x: 25, y: 6, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bench', x: 37, y: 14, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'board', x: 41, y: 13, w: 2, h: 2, solidTiles: [[0, 1], [1, 1]] });
    m.objects.push({ kind: 'bookStack', x: 36, y: 12, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bookStack', x: 39, y: 12, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'lamp', x: 35, y: 13, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'sign', x: 2, y: 9, w: 1, h: 1, text: '果园←', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'sign', x: 20, y: 1, w: 1, h: 1, text: '山脚↑', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'sign', x: 32, y: 28, w: 1, h: 1, text: '农舍↓', solidTiles: [], s: 'exitSign' });
    trees(m, [[3, 17], [16, 25], [30, 25], [6, 26], [36, 26], [38, 10]]);
    [[16, 6], [34, 13], [8, 25]].forEach(([x, y]) => m.objects.push({ kind: 'rock', x, y, w: 1, h: 1, solidTiles: [[0, 0]] }));
    [[26, 12], [5, 25]].forEach(([x, y]) => m.objects.push({ kind: 'stump', x, y, w: 1, h: 1, solidTiles: [[0, 0]] }));
    [[14, 18], [18, 18], [24, 18], [29, 18], [34, 18]].forEach(([x, y]) => set(m, x, y, 'grass2'));
    [[11, 17], [21, 17], [32, 17], [38, 18]].forEach(([x, y]) => set(m, x, y, 'tuft'));
    // 挖蚯蚓点（松土上）
    [[6, 5], [14, 5], [22, 5], [30, 5], [14, 10], [30, 10]].forEach(([x, y], i) =>
      m.inters.push({ x, y, s: 'digWorm', wid: 'w' + i }));
    // 钓点（水渠北岸）
    [[12, 19], [26, 19]].forEach(([x, y]) => m.inters.push({ x, y, s: 'fish' }));
    m.npcs.push({ id: 'farmer', x: 20, y: 17, dir: 'up', pal: 'farmer', name: '田伯', s: 'farmer', wander: 2, acts: ['think', 'wave'] });
    // —— 稻田（田伯故事线：连续三天除虫） ——
    rect(m, 33, 21, 7, 3, 'paddy');
    m.inters.push({ x: 36, y: 24, s: 'farmHelp' });
    // 生物窝点：秋夜蟋蟀 / 夏日蚱蜢 / 清晨野兔
    m.objects.push({ kind: 'critter', x: 25, y: 17, w: 1, h: 1, pid: 'cf1', map: 'fields', s: 'critterSpot', solidTiles: [] });
    m.objects.push({ kind: 'critter', x: 14, y: 24, w: 1, h: 1, pid: 'cf2', map: 'fields', s: 'critterSpot', solidTiles: [] });
    // —— 野外高草丛：田垄间两长条（蟋蟀/蚱蜢/野兔惊起） ——
    rect(m, 13, 17, 7, 3, 'grass2'); rect(m, 28, 17, 7, 3, 'grass2');
    m.grass = [
      { x: 13, y: 17, w: 7, h: 3, tier: 0 },  // 西田垄
      { x: 28, y: 17, w: 7, h: 3, tier: 0 },  // 东田垄
    ];
    m.spawn = { x: 40, y: 15, dir: 'left' };
    return m;
  }

  /* —— 家 · 院子 —— */
  function homeYard() {
    const m = base('homeYard', '家 · 院子', 22, 14, { fill: 'grass', bgm: 'home' });
    rect(m, 4, 4, 14, 1, 'path'); rect(m, 10, 4, 2, 2, 'path');
    set(m, 10, 5, 'doorWood'); set(m, 11, 5, 'doorWood');
    m.doors.push({ x: 10, y: 5, to: ['homeIn', 11, 12, 'up'] });
    m.doors.push({ x: 11, y: 5, to: ['homeIn', 11, 12, 'up'] });
    set(m, 10, 13, 'path'); set(m, 11, 13, 'path');
    m.doors.push({ x: 10, y: 13, to: ['town', 29, 2, 'down'] });
    m.doors.push({ x: 11, y: 13, to: ['town', 30, 2, 'down'] });
    tree(m, 4, 9); tree(m, 17, 8);
    m.objects.push({ kind: 'stump', x: 6, y: 6, w: 1, h: 1, s: 'pot', pot: 'yard', solidTiles: [[0, 0]] });   // 院子花盆
    m.objects.push({ kind: 'sign', x: 18, y: 6, w: 1, h: 1, text: '🥬', solidTiles: [], s: 'vegPlot' });        // 花坛菜圃（种菜）
    m.objects.push({ kind: 'photoSpot', x: 8, y: 8, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's11' });   // 院子的花机位
    m.objects.push({ kind: 'wallArt', x: 4, y: 4, w: 1, h: 1, s: 'familyPhoto', solidTiles: [] });  // 全家福壁画
    m.objects.push({ kind: 'chair2', x: 16, y: 10, w: 1, h: 1, solidTiles: [[0, 0]] });             // 妈妈的藤椅
    m.objects.push({ kind: 'wallClock', x: 20, y: 5, w: 1, h: 1, solidTiles: [] });                 // 挂钟
    m.objects.push({ kind: 'busStop', x: 13, y: 10, w: 1, h: 2, solidTiles: [[0, 1]], s: 'busStop' }); // 校车站牌（家门口）
    m.objects.push({ kind: 'dig', x: 16, y: 10, w: 1, h: 1, solidTiles: [], s: 'dig', did: 'd5' });
    m.inters.push({ x: 4, y: 10, s: 'yardPhoto' });   // 旧相册碎片
    m.objects.push({ kind: 'sign', x: 13, y: 7, w: 1, h: 1, text: '📬', solidTiles: [], s: 'mailbox' });  // 信箱（星露谷式）
    m.objects.push({ kind: 'sign', x: 15, y: 6, w: 1, h: 1, text: '🍉', solidTiles: [], s: 'melonChop' }); // 夏日井台·西瓜割（夏季限定）
    // —— 秘密基地角：随 f.base 三阶段长出来的陈设（0 空地 → 1 木板据点 → 2 秘密基地 → 3 梦想小窝） ——
    const fb = ADV.Game.flags.base || 0;
    m.objects.push({ kind: 'sign', x: 2, y: 12, w: 1, h: 1, text: fb >= 1 ? '🏕️' : '⛏️', solidTiles: [], s: 'baseBuild' });
    if (fb >= 1) {
      m.objects.push({ kind: 'stump', x: 1, y: 12, w: 1, h: 1, solidTiles: [[0, 0]] });          // 木墩凳
      m.objects.push({ kind: 'bookStack', x: 3, y: 12, w: 1, h: 1, solidTiles: [[0, 0]] });      // 旧书桌
    }
    if (fb >= 2) {
      m.objects.push({ kind: 'bannerFlag', x: 1, y: 11, w: 1, h: 1, solidTiles: [] });           // 基地彩旗
      m.objects.push({ kind: 'flowerbed', x: 2, y: 11, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] }); // 门口花坛
    }
    if (fb >= 3) {
      m.objects.push({ kind: 'easel', x: 1, y: 13, w: 1, h: 1, solidTiles: [[0, 0]] });          // 画架
      m.objects.push({ kind: 'chest', x: 2, y: 13, w: 1, h: 1, solidTiles: [[0, 0]] });          // 宝贝箱
      m.objects.push({ kind: 'catBed', x: 3, y: 13, w: 1, h: 1, solidTiles: [] });               // 猫窝
    }
    // —— 后院农场：4×4 田垄 + 鸡舍（星露谷式生产循环） ——
    for (let py = 0; py < 4; py++) for (let px = 0; px < 4; px++)
      m.objects.push({ kind: 'plot', x: 5 + px, y: 10 + py, w: 1, h: 1, pid: py * 4 + px,
                       stage: 0, watered: false, s: 'farmPlot', solidTiles: [] });
    m.objects.push({ kind: 'coop', x: 19, y: 9, w: 1, h: 1, s: 'chickenCoop', solidTiles: [[0, 0]] });
    // —— s5 畜牧扩展：牛棚 / 羊圈（田伯处把小牛小羊抱回来，每天挤奶剪毛） ——
    m.objects.push({ kind: 'cowShed', x: 21, y: 10, w: 1, h: 1, s: 'cowShed', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'sheepPen', x: 21, y: 12, w: 1, h: 1, s: 'sheepPen', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'scarecrow', x: 9, y: 12, w: 1, h: 1, s: 'scarecrow', solidTiles: [[0, 0]] });   // 稻草人守田（Z 键调查 / 工具包翻新）
    // 生物窝点：新手村窝点——瓢虫/蚂蚁/蜗牛/蟾蜍/田螺都在院子里
    m.objects.push({ kind: 'critter', x: 19, y: 12, w: 1, h: 1, pid: 'cy1', map: 'homeYard', s: 'critterSpot', solidTiles: [] });
    // 清晨随机拜访：同伴在家门口（难忘的暑假式）
    if (ADV.Game.flags.visitor) {
      const NAMES = { xiaoming: '小明', xiaohong: '小红', xiaogang: '小刚', xiaopang: '小胖', wuyun: '乌云', momo: '墨墨', jinpeng: '金鹏' };
      const PALS = { xiaoming: 'xiaoming', xiaohong: 'xiaohong', xiaogang: 'xiaogang', xiaopang: 'xiaopang', wuyun: 'wuyun', momo: 'momo', jinpeng: 'jinpeng' };
      const v = ADV.Game.flags.visitor;
      if (PALS[v]) m.npcs.push({ id: 'visitor', x: 12, y: 12, dir: 'up', pal: PALS[v], name: NAMES[v], s: 'morningVisit', wander: 0 });
    }
    [[5, 6], [18, 11]].forEach(([x, y]) => set(m, x, y, 'grass2'));
    m.spawn = { x: 11, y: 9, dir: 'up' };
    return m;
  }

  /* —— 家 · 室内 —— */
  function homeIn() {
    const m = base('homeIn', '家 · 客厅与卧室', 24, 14, { fill: 'floorWood', bgm: 'home', indoor: true });
    rect(m, 0, 0, 24, 1, 'inWallTop'); rect(m, 0, 1, 24, 1, 'inWall');
    rect(m, 0, 2, 1, 11, 'inWall'); rect(m, 23, 2, 1, 11, 'inWall'); rect(m, 0, 13, 24, 1, 'inWall');
    set(m, 11, 13, 'doorWood'); set(m, 12, 13, 'doorWood');
    m.doors.push({ x: 11, y: 13, to: ['homeYard', 10, 6, 'down'] });
    m.doors.push({ x: 12, y: 13, to: ['homeYard', 11, 6, 'down'] });
    [3, 8, 15, 20].forEach(x => set(m, x, 1, 'inWallWin'));
    m.objects.push({ kind: 'sign', x: 8, y: 1, w: 1, h: 1, text: '🐦', solidTiles: [], s: 'bird' });           // 窗台小鸟
    m.objects.push({ kind: 'bed', x: 19, y: 4, w: 1, h: 1, s: 'myBed', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'desk2', x: 19, y: 9, w: 1, h: 1, s: 'myDesk', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'shelf2', x: 16, y: 3, w: 1, h: 1, s: 'myShelf', solidTiles: [[0, 0]] });
    // 客厅区（左）：妈妈 + 爸爸 + 书柜 + 饭桌；卧室区（右）：床 + 课桌 + 收藏柜 + 图书架
    m.npcs.push({ id: 'mom', x: 6, y: 5, dir: 'down', pal: 'mom', name: '妈妈', s: 'mom', acts: ['wave', 'laugh'] });
    m.npcs.push({ id: 'dad', x: 4, y: 8, dir: 'down', pal: 'dad', name: '爸爸', s: 'dad', acts: ['read', 'think'] });
    m.objects.push({ kind: 'shelf2', x: 3, y: 3, w: 1, h: 1, s: 'bookcase', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'goban', x: 8, y: 9, w: 1, h: 1, s: 'dinnerTable', solidTiles: [[0, 0]] });
    rect(m, 17, 1, 3, 1, 'wallShelf');                 // 卧室墙书架（图书）
    m.objects.push({ kind: 'wallArt', x: 20, y: 1, w: 1, h: 1, s: 'myPoster', solidTiles: [] });  // 章节海报（随主线更替）
    set(m, 7, 9, 'chair'); set(m, 9, 9, 'chair');      // 饭桌两侧椅子
    set(m, 18, 9, 'chair');                            // 课桌旁椅子
    m.spawn = { x: 11, y: 11, dir: 'up' };
    return m;
  }

  /* —— 城东 · 沁园公园（花婆婆的花圃 / 池塘垂钓 / 公园传说） —— */
  function park() {
    const m = base('park', '城东 · 沁园公园', 32, 24, { fill: 'grass', bgm: 'home' });
    // 树墙边框（北门留豁口）
    for (let x = 0; x < 32; x++) { if (x !== 15 && x !== 16) tree(m, x, 0); tree(m, x, 23); }
    for (let y = 1; y < 23; y++) { tree(m, 0, y); tree(m, 31, y); }
    set(m, 15, 0, 'path'); set(m, 16, 0, 'path');
    m.doors.push({ x: 15, y: 0, to: ['town', 44, 34, 'down'] });
    m.doors.push({ x: 16, y: 0, to: ['town', 45, 34, 'down'] });
    // 主路 + 中心小广场
    rect(m, 15, 1, 2, 10, 'path');
    rect(m, 8, 12, 16, 2, 'path');
    rect(m, 13, 13, 6, 4, 'stone');
    // 东侧池塘（可垂钓）
    rect(m, 24, 14, 6, 5, 'water');
    rect(m, 23, 13, 8, 1, 'sand'); rect(m, 23, 19, 8, 1, 'sand');
    m.inters.push({ x: 25, y: 14, s: 'fish' });
    m.inters.push({ x: 28, y: 18, s: 'fish' });
    // 花婆婆的花圃（浇水故事线）
    [[5, 16], [8, 16], [11, 16]].forEach(([x, y]) =>
      m.objects.push({ kind: 'flowerbed', x, y, w: 2, h: 1, s: x === 5 ? 'waterFlowers' : null, solidTiles: [[0, 0], [1, 0]] }));
    m.objects.push({ kind: 'sign', x: 5, y: 15, w: 1, h: 1, text: '花圃', solidTiles: [], s: 'flowerBedSign' });
    m.npcs.push({ id: 'flower', x: 9, y: 14, dir: 'down', pal: 'aunt', name: '花婆婆', s: 'flowerLady', acts: ['wave', 'think'] });
    // 公园传说木牌（三段故事线）
    m.objects.push({ kind: 'sign', x: 13, y: 11, w: 1, h: 2, text: '公园传说', solidTiles: [[0, 1]], s: 'parkTale' });
    // 长椅与路灯
    [[12, 18], [18, 11], [22, 13]].forEach(([x, y]) => m.objects.push({ kind: 'bench', x, y, w: 1, h: 1, solidTiles: [[0, 0]] }));
    [[14, 12], [20, 12]].forEach(([x, y]) => m.objects.push({ kind: 'lamp', x, y, w: 1, h: 2, solidTiles: [[0, 1]] }));
    // 收集点：落叶 / 蝴蝶（春夏白天）/ 蜻蜓（雨天白天）
    [[10, 20, 'l8'], [22, 11, 'l6']].forEach(([x, y, cid]) =>
      m.objects.push({ kind: 'pickupSpot', x, y, w: 1, h: 1, solidTiles: [], s: 'pick', cid, sparkle: true }));
    [[18, 15, 'i2'], [6, 20, 'i3']].forEach(([x, y, cid]) =>
      m.objects.push({ kind: 'pickupSpot', x, y, w: 1, h: 1, solidTiles: [], s: 'pick', cid, sparkle: true }));
    [[7, 11], [24, 21]].forEach(([x, y]) => set(m, x, y, 'grass2'));
    // 生物窝点：池塘边——蝴蝶/蝌蚪/水黾/青蛙/水蜘蛛
    m.objects.push({ kind: 'critter', x: 21, y: 19, w: 1, h: 1, pid: 'cp1', map: 'park', s: 'critterSpot', solidTiles: [] });
    m.spawn = { x: 15, y: 3, dir: 'down' };
    return m;
  }

  /* ==================== 小镇生活圈扩展 ==================== */
  function photoStudioIn() {
    const m = shopRoom('photoStudioIn', '东南街角 · 照相馆', ['town', 54, 24, 'down'], 'floorTile');
    rect(m, 4, 3, 16, 1, 'counter');
    m.npcs.push({ id: 'photolady', x: 12, y: 2, dir: 'down', pal: 'shopgirl', name: '照相师', s: 'photolady', acts: ['wave', 'laugh'] });
    m.objects.push({ kind: 'wallArt', x: 4, y: 2, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'wallArt', x: 19, y: 2, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'curtain', x: 6, y: 5, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'curtain', x: 16, y: 5, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'chair2', x: 9, y: 9, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'chair2', x: 14, y: 9, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'photoSpot', x: 12, y: 7, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's13' });
    return m;
  }

  function barberIn() {
    const m = shopRoom('barberIn', '东南街角 · 理发店', ['town', 42, 24, 'down'], 'floorTile');
    rect(m, 4, 3, 16, 1, 'counter');
    m.npcs.push({ id: 'barber', x: 12, y: 2, dir: 'down', pal: 'cardman', name: '理发师', s: 'barber', acts: ['wave', 'think'] });
    m.objects.push({ kind: 'mirror', x: 5, y: 2, w: 2, h: 2, solidTiles: [[0, 0], [1, 0], [0, 1], [1, 1]] });
    m.objects.push({ kind: 'mirror', x: 17, y: 2, w: 2, h: 2, solidTiles: [[0, 0], [1, 0], [0, 1], [1, 1]] });
    m.objects.push({ kind: 'chair2', x: 7, y: 8, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'chair2', x: 16, y: 8, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'coatHook', x: 11, y: 2, w: 1, h: 1, solidTiles: [] });
    return m;
  }

  function clockShopIn() {
    const m = shopRoom('clockShopIn', '老街 · 钟表铺', ['oldstreet', 16, 10, 'down'], 'floorWood');
    rect(m, 4, 3, 16, 1, 'counter');
    m.npcs.push({ id: 'clockman', x: 12, y: 2, dir: 'down', pal: 'oldbook', name: '钟表匠', s: 'clockman', acts: ['think', 'wave'] });
    [5, 9, 15, 19].forEach(x => m.objects.push({ kind: 'wallClock', x, y: 2, w: 1, h: 1, solidTiles: [] }));
    m.objects.push({ kind: 'desk2', x: 12, y: 8, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bookStack', x: 7, y: 9, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bookStack', x: 17, y: 9, w: 1, h: 1, solidTiles: [[0, 0]] });
    return m;
  }

  function tailorShopIn() {
    const m = shopRoom('tailorShopIn', '老街 · 缝纫铺', ['oldstreet', 28, 10, 'down'], 'floorWood');
    rect(m, 4, 3, 16, 1, 'counter');
    m.npcs.push({ id: 'tailor', x: 12, y: 2, dir: 'down', pal: 'aunt', name: '裁缝阿姨', s: 'tailor', acts: ['wave', 'laugh'] });
    m.objects.push({ kind: 'curtain', x: 4, y: 2, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'curtain', x: 18, y: 2, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'coatHook', x: 9, y: 2, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'coatHook', x: 15, y: 2, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'chair2', x: 12, y: 8, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'plant', x: 20, y: 9, w: 1, h: 1, solidTiles: [[0, 0]] });
    return m;
  }

  function riverbay() {
    const m = base('riverbay', '南湾 · 老桥与河埠', 40, 24, { fill: 'grass', bgm: 'home', particles: 'dragonfly' });
    for (let x = 0; x < 40; x++) { if (x !== 19 && x !== 20) tree(m, x, 0); tree(m, x, 23); }
    for (let y = 1; y < 23; y++) { tree(m, 0, y); if (y !== 10 && y !== 11) tree(m, 39, y); }
    set(m, 19, 0, 'path'); set(m, 20, 0, 'path');
    set(m, 39, 10, 'path'); set(m, 39, 11, 'path');
    m.doors.push({ x: 19, y: 0, to: ['town', 24, 34, 'down'] });
    m.doors.push({ x: 20, y: 0, to: ['town', 25, 34, 'down'] });
    m.doors.push({ x: 38, y: 10, to: ['seasonPlaza', 2, 10, 'right'] });
    m.doors.push({ x: 38, y: 11, to: ['seasonPlaza', 2, 11, 'right'] });
    rect(m, 18, 0, 4, 13, 'path');
    rect(m, 14, 12, 12, 2, 'stone');
    rect(m, 2, 13, 19, 8, 'water');
    rect(m, 1, 12, 21, 1, 'sand'); rect(m, 1, 21, 21, 1, 'sand');
    rect(m, 13, 14, 6, 2, 'stone'); rect(m, 16, 14, 2, 8, 'stone');
    rect(m, 24, 10, 15, 2, 'path'); rect(m, 32, 10, 2, 10, 'path');
    m.objects.push({ kind: 'sign', x: 16, y: 13, w: 1, h: 2, text: '老桥', solidTiles: [[0, 1]], s: 'exitSign' });
    m.objects.push({ kind: 'sign', x: 11, y: 16, w: 1, h: 1, text: '⛵', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'sign', x: 8, y: 12, w: 1, h: 1, text: '钓台', solidTiles: [], s: 'fish' });
    m.objects.push({ kind: 'mysterySpot', x: 6, y: 20, w: 1, h: 1, solidTiles: [], s: 'rumor', rid: 4 });
    m.objects.push({ kind: 'lamp', x: 18, y: 4, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'lamp', x: 18, y: 18, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'bench', x: 25, y: 11, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bannerFlag', x: 14, y: 13, w: 1, h: 1, solidTiles: [], nightGlow: true });
    m.objects.push({ kind: 'bannerFlag', x: 25, y: 10, w: 1, h: 1, solidTiles: [], nightGlow: true });
    // 河边灯串：傍晚才一串串挂出来，白天收在埠头的木箱里
    m.objects.push({ kind: 'bannerFlag', x: 22, y: 10, w: 1, h: 1, solidTiles: [], nightGlow: true, periods: [4, 5] });
    m.objects.push({ kind: 'bannerFlag', x: 34, y: 10, w: 1, h: 1, solidTiles: [], nightGlow: true, periods: [4, 5] });
    m.objects.push({ kind: 'flowerbed', x: 27, y: 13, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'sign', x: 28, y: 9, w: 1, h: 1, text: '练声桥', solidTiles: [], s: 'singBridge' });
    m.objects.push({ kind: 'photoSpot', x: 15, y: 13, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's14' });
    m.objects.push({ kind: 'buzz', x: 30, y: 15, w: 1, h: 1, bid: 'rb1', s: 'buzzPoint', solidTiles: [] });   // 河湾草丛虫鸣点
    // 生物窝点：北岸滩涂（蜻蜓/萤火虫/螃蟹/乌龟/小虾/野鸭/锦鲤苗）
    m.objects.push({ kind: 'critter', x: 4, y: 8, w: 1, h: 1, pid: 'cr1', map: 'riverbay', s: 'critterSpot', solidTiles: [] });
    m.objects.push({ kind: 'critter', x: 35, y: 18, w: 1, h: 1, pid: 'cr2', map: 'riverbay', s: 'critterSpot', solidTiles: [] });
    m.objects.push({ kind: 'sign', x: 10, y: 21, w: 1, h: 1, text: '萤', solidTiles: [], s: 'fireflyBay' });  // 夏夜河湾·萤火虫夜（沙洲边）
    m.objects.push({ kind: 'sign', x: 17, y: 14, w: 1, h: 1, text: '🎨', solidTiles: [], s: 'sketchSpot', cid: 's22' });  // 写生簿·老桥倒影（桥墩石上）
    m.npcs.push({ id: 'wangmei_bay', x: 28, y: 10, dir: 'left', pal: 'wangmei', name: '王美', s: 'wangmei', acts: ['think', 'wave'] });
    // —— 野外高草丛：走进有几率惊动野生小伙伴（tier0 常见 / tier1 深草易出稀有） ——
    rect(m, 23, 5, 6, 4, 'grass2'); rect(m, 26, 15, 5, 3, 'grass2'); rect(m, 34, 19, 4, 2, 'grass2');
    m.grass = [
      { x: 23, y: 5, w: 6, h: 4, tier: 0 },   // 北岸草滩
      { x: 26, y: 15, w: 5, h: 3, tier: 1 },  // 南岸深草（虫鸣点旁）
      { x: 34, y: 19, w: 4, h: 2, tier: 0 },  // 比赛场屋后
    ];
    // 比赛场大房子：露天石墩擂台搬进了屋里（馆内有石墩擂台 + 观众席 + 场务卖宠物球）
    building(m, 30, 11, 7, 5, { roof: 'roofT', name: '比赛场', to: ['arenaHall', 12, 13, 'up'] });
    m.objects.push({ kind: 'bannerFlag', x: 31, y: 10, w: 1, h: 1, solidTiles: [], nightGlow: true });
    m.spawn = { x: 19, y: 3, dir: 'down' };
    return m;
  }

  /* —— 河湾比赛场 · 对战馆（石墩擂台搬进大房子：擂台 + 观众席 + 场务商店） —— */
  function arenaHall() {
    const m = base('arenaHall', '河湾比赛场 · 对战馆', 26, 16, { fill: 'floorWood', bgm: 'indoor', indoor: true });
    rect(m, 0, 0, 26, 1, 'inWallTop'); rect(m, 0, 1, 26, 1, 'inWall');
    rect(m, 0, 2, 1, 13, 'inWall'); rect(m, 25, 2, 1, 13, 'inWall'); rect(m, 0, 15, 26, 1, 'inWall');
    set(m, 12, 15, 'doorWood'); set(m, 13, 15, 'doorWood');
    m.doors.push({ x: 12, y: 15, to: ['riverbay', 33, 16, 'down'] });
    m.doors.push({ x: 13, y: 15, to: ['riverbay', 33, 16, 'down'] });
    [4, 9, 16, 21].forEach(x => set(m, x, 1, 'inWallWin'));
    // 中央擂台：石台上的老石墩（Z 互动开打——斗虫比试 / 训练家阶梯全在这）
    rect(m, 10, 6, 6, 3, 'stone');
    m.objects.push({ kind: 'stump', x: 12, y: 7, w: 1, h: 1, solidTiles: [[0, 0]], s: 'bugArena' });
    m.objects.push({ kind: 'bannerFlag', x: 9, y: 5, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bannerFlag', x: 16, y: 5, w: 1, h: 1, solidTiles: [[0, 0]] });
    // 观众席两排 + 看热闹的小孩
    [8, 10, 15, 17].forEach(x => m.objects.push({ kind: 'chair2', x, y: 5, w: 1, h: 1, solidTiles: [[0, 0]] }));
    [8, 10, 15, 17].forEach(x => m.objects.push({ kind: 'chair2', x, y: 10, w: 1, h: 1, solidTiles: [[0, 0]] }));
    m.npcs.push({ id: 'arenaKid1', x: 11, y: 11, dir: 'up', pal: 'xiaopang', name: '小胖', s: 'arenaKid', acts: ['wave', 'think'] });
    m.npcs.push({ id: 'arenaKid2', x: 16, y: 4, dir: 'down', pal: 'studentA', name: '同学', s: 'arenaKid', acts: ['wave', 'yawn'] });
    // 场务柜台：石头伯卖宠物球（草丛遭遇收服野生小伙伴的必需品）
    rect(m, 2, 5, 1, 2, 'desk');
    m.objects.push({ kind: 'bookStack', x: 2, y: 4, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.npcs.push({ id: 'arenaKeeper', x: 2, y: 3, dir: 'down', pal: 'farmer', name: '石头伯', s: 'arenaKeeper', acts: ['think', 'wave'] });
    m.objects.push({ kind: 'plant', x: 24, y: 2, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'plant', x: 1, y: 14, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.spawn = { x: 12, y: 13, dir: 'up' };
    return m;
  }

  function oldstreet() {
    const m = base('oldstreet', '东南老街 · 里巷', 40, 24, { fill: 'path', bgm: 'street' });
    for (let x = 0; x < 40; x++) { if (x !== 5 && x !== 6) tree(m, x, 0); tree(m, x, 23); }
    for (let y = 1; y < 23; y++) { tree(m, 0, y); if (y !== 11 && y !== 12) tree(m, 39, y); }
    set(m, 5, 0, 'path'); set(m, 6, 0, 'path');
    set(m, 39, 11, 'path'); set(m, 39, 12, 'path');
    m.doors.push({ x: 5, y: 0, to: ['town', 52, 34, 'down'] });
    m.doors.push({ x: 6, y: 0, to: ['town', 53, 34, 'down'] });
    m.doors.push({ x: 38, y: 11, to: ['transportHub', 2, 11, 'right'] });
    m.doors.push({ x: 38, y: 12, to: ['transportHub', 2, 12, 'right'] });
    rect(m, 5, 0, 2, 16, 'path');
    rect(m, 5, 10, 30, 2, 'stone');
    rect(m, 20, 10, 2, 12, 'path');
    rect(m, 10, 16, 20, 2, 'stone');
    building(m, 12, 5, 8, 5, { roof: 'roofB', name: '钟表铺', to: ['clockShopIn', 11, 11, 'up'] });
    building(m, 24, 5, 8, 5, { roof: 'roofP', name: '缝纫铺', to: ['tailorShopIn', 11, 11, 'up'] });
    apartmentBlock(m, 8, 14, 9, 7, { roof: 'roofT', doors: [{ dx: 2, name: '小院', s: 'exitSign' }, { dx: 6, name: '里巷', s: 'exitSign' }] });
    apartmentBlock(m, 23, 14, 10, 7, { roof: 'roofO', doors: [{ dx: 2, name: '花园', s: 'exitSign' }, { dx: 7, name: '童趣', s: 'exitSign' }] });
    m.objects.push({ kind: 'swing', x: 33, y: 16, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bench', x: 31, y: 17, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'clothesline', x: 10, y: 18, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'mailbox2', x: 18, y: 16, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'plantRack', x: 28, y: 17, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'sign', x: 9, y: 11, w: 1, h: 1, text: '漫画角', solidTiles: [], s: 'comicCorner' });
    m.objects.push({ kind: 'sign', x: 25, y: 17, w: 1, h: 1, text: '零食窝', solidTiles: [], s: 'snackNest' });
    m.objects.push({ kind: 'sign', x: 30, y: 11, w: 1, h: 1, text: '练声窗', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'photoSpot', x: 19, y: 11, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's15' });
    m.objects.push({ kind: 'lamp', x: 7, y: 10, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'lamp', x: 21, y: 10, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'lamp', x: 35, y: 10, w: 1, h: 2, solidTiles: [[0, 1]] });
    // 生物窝点：巷尾墙根——金龟子/松鼠/夜里的三花猫
    m.objects.push({ kind: 'critter', x: 35, y: 17, w: 1, h: 1, pid: 'co1', map: 'oldStreet', s: 'critterSpot', solidTiles: [] });
    m.objects.push({ kind: 'bannerFlag', x: 15, y: 10, w: 1, h: 1, solidTiles: [], nightGlow: true });
    m.objects.push({ kind: 'bannerFlag', x: 27, y: 10, w: 1, h: 1, solidTiles: [], nightGlow: true });
    m.npcs.push({ id: 'xm_comic', x: 10, y: 11, dir: 'left', pal: 'xiaoming', name: '小明', s: 'xiaoming', wander: 1, mood: '♪', acts: ['read', 'doubt'] });
    m.npcs.push({ id: 'xp_snack', x: 25, y: 16, dir: 'down', pal: 'xiaopang', name: '小胖', s: 'xiaopang', wander: 1, mood: '♥', acts: ['laugh', 'yawn'] });
    m.spawn = { x: 5, y: 3, dir: 'down' };
    return m;
  }

  function transportHub() {
    const m = base('transportHub', '镇外路口 · 旧车站', 36, 22, { fill: 'path', bgm: 'street' });
    for (let x = 0; x < 36; x++) { tree(m, x, 0); tree(m, x, 21); }
    for (let y = 1; y < 21; y++) { if (y !== 11 && y !== 12) tree(m, 0, y); if (y !== 11 && y !== 12) tree(m, 35, y); }
    set(m, 0, 11, 'path'); set(m, 0, 12, 'path'); set(m, 35, 11, 'path'); set(m, 35, 12, 'path');
    m.doors.push({ x: 1, y: 11, to: ['oldstreet', 37, 11, 'left'] });
    m.doors.push({ x: 1, y: 12, to: ['oldstreet', 37, 12, 'left'] });
    m.doors.push({ x: 34, y: 11, to: ['cultureHub', 2, 11, 'right'] });
    m.doors.push({ x: 34, y: 12, to: ['cultureHub', 2, 12, 'right'] });
    rect(m, 0, 10, 36, 3, 'stone');
    rect(m, 10, 4, 12, 5, 'stone');
    rect(m, 24, 7, 8, 3, 'stone');
    m.objects.push({ kind: 'busStop', x: 13, y: 8, w: 1, h: 2, solidTiles: [[0, 1]], s: 'busStop' });
    m.objects.push({ kind: 'newsstand', x: 24, y: 9, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'mailbox2', x: 30, y: 9, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bench', x: 12, y: 12, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bench', x: 18, y: 12, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bench', x: 27, y: 12, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'lamp', x: 7, y: 10, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'lamp', x: 22, y: 10, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'lamp', x: 33, y: 10, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'sign', x: 25, y: 6, w: 1, h: 1, text: '岔路', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'sign', x: 29, y: 6, w: 1, h: 1, text: '小铺', solidTiles: [], s: 'cardStand' });
    // 站前早点摊：只有赶早班车的那两个时段摆着，中午前就收了
    m.objects.push({ kind: 'sign', x: 9, y: 9, w: 1, h: 1, text: '🍠', solidTiles: [], periods: [0, 1] });
    m.objects.push({ kind: 'photoSpot', x: 17, y: 9, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's16' });
    // 生物窝点：站前草地——蹦蹦跳跳的小麻雀
    m.objects.push({ kind: 'critter', x: 5, y: 15, w: 1, h: 1, pid: 'ct1', map: 'transportHub', s: 'critterSpot', solidTiles: [] });
    m.spawn = { x: 3, y: 11, dir: 'right' };
    return m;
  }

  function cultureHub() {
    const m = base('cultureHub', '校外活动带 · 少年宫与文化馆', 38, 24, { fill: 'grass', bgm: 'street' });
    for (let x = 0; x < 38; x++) { tree(m, x, 0); if (x !== 19 && x !== 20) tree(m, x, 23); }
    for (let y = 1; y < 23; y++) { if (y !== 11 && y !== 12) tree(m, 0, y); tree(m, 37, y); }
    set(m, 0, 11, 'path'); set(m, 0, 12, 'path'); set(m, 19, 23, 'path'); set(m, 20, 23, 'path');
    m.doors.push({ x: 1, y: 11, to: ['transportHub', 32, 11, 'left'] });
    m.doors.push({ x: 1, y: 12, to: ['transportHub', 32, 12, 'left'] });
    m.doors.push({ x: 19, y: 22, to: ['seasonPlaza', 19, 2, 'up'] });
    m.doors.push({ x: 20, y: 22, to: ['seasonPlaza', 20, 2, 'up'] });
    rect(m, 0, 10, 20, 3, 'path');
    rect(m, 19, 12, 2, 12, 'path');
    building(m, 4, 5, 8, 5, { roof: 'roofP', name: '少年宫', to: null });
    building(m, 15, 5, 10, 5, { roof: 'roofB', name: '文化馆', to: null });
    rect(m, 27, 6, 8, 5, 'track');
    m.objects.push({ kind: 'goal', x: 27, y: 10, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'bleachers', x: 29, y: 4, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'flagpole', x: 33, y: 5, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'board', x: 6, y: 13, w: 2, h: 2, solidTiles: [[0, 1], [1, 1]] });
    m.objects.push({ kind: 'newsstand', x: 14, y: 14, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'sign', x: 14, y: 13, w: 1, h: 1, text: '流通站', solidTiles: [], s: 'bookstall' });
    m.objects.push({ kind: 'bench', x: 22, y: 16, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'flowerbed', x: 10, y: 12, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'flowerbed', x: 24, y: 12, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'sign', x: 30, y: 12, w: 1, h: 1, text: '鹏场', solidTiles: [], s: 'pengField' });
    m.objects.push({ kind: 'sign', x: 18, y: 14, w: 1, h: 1, text: '墨角', solidTiles: [], s: 'momoCorner' });
    m.npcs.push({ id: 'jinpeng_field', x: 30, y: 12, dir: 'left', pal: 'jinpeng', name: '金鹏', s: 'jinpeng', acts: ['think', 'wave'] });
    m.npcs.push({ id: 'momo_corner', x: 19, y: 14, dir: 'left', pal: 'momo', name: '墨墨', s: 'momo', acts: ['think', 'wave'] });
    m.spawn = { x: 3, y: 11, dir: 'right' };
    return m;
  }

  function seasonPlaza() {
    const m = base('seasonPlaza', '四时广场 · 庙会与露天电影', 38, 24, { fill: 'grass', bgm: 'home' });
    for (let x = 0; x < 38; x++) { tree(m, x, 0); tree(m, x, 23); }
    for (let y = 1; y < 23; y++) { if (y !== 10 && y !== 11) tree(m, 0, y); tree(m, 37, y); }
    set(m, 0, 10, 'path'); set(m, 0, 11, 'path'); set(m, 19, 0, 'path'); set(m, 20, 0, 'path');
    m.doors.push({ x: 1, y: 10, to: ['riverbay', 37, 10, 'left'] });
    m.doors.push({ x: 1, y: 11, to: ['riverbay', 37, 11, 'left'] });
    m.doors.push({ x: 19, y: 2, to: ['cultureHub', 19, 21, 'down'] });
    m.doors.push({ x: 20, y: 2, to: ['cultureHub', 20, 21, 'down'] });
    rect(m, 18, 0, 4, 8, 'path');
    rect(m, 8, 8, 22, 10, 'stone');
    rect(m, 4, 15, 10, 4, 'sand');
    rect(m, 29, 14, 6, 4, 'water');
    rect(m, 28, 13, 8, 1, 'sand'); rect(m, 28, 18, 8, 1, 'sand');
    // 广场陈设随时段换脸：放学后庙会彩旗挂起，傍晚才支起露天影幕
    m.objects.push({ kind: 'flags', x: 11, y: 8, w: 2, h: 1, solidTiles: [], periods: [3, 4] });
    m.objects.push({ kind: 'board', x: 17, y: 10, w: 2, h: 2, solidTiles: [[0, 1], [1, 1]], periods: [4, 5] });
    m.objects.push({ kind: 'bench', x: 14, y: 14, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bench', x: 22, y: 14, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'flowerbed', x: 10, y: 17, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'flowerbed', x: 24, y: 17, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'sign', x: 6, y: 14, w: 1, h: 1, text: '晒谷', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'sign', x: 31, y: 12, w: 1, h: 1, text: '冰河', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'sign', x: 18, y: 9, w: 1, h: 1, text: '影幕', solidTiles: [], s: 'openAirFilm' });
    m.objects.push({ kind: 'photoSpot', x: 19, y: 14, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's17' });
    m.objects.push({ kind: 'sign', x: 12, y: 12, w: 1, h: 1, text: '🎨', solidTiles: [], s: 'sketchSpot', cid: 's24' });  // 写生簿·四时旗风
    m.objects.push({ kind: 'sign', x: 25, y: 12, w: 1, h: 1, text: '🎬', solidTiles: [], s: 'movieNight' });  // 周日电影夜售票口
    m.objects.push({ kind: 'lamp', x: 9, y: 8, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'lamp', x: 28, y: 8, w: 1, h: 2, solidTiles: [[0, 1]] });
    // 生物窝点：广场北角草皮——啄食的小麻雀
    m.objects.push({ kind: 'critter', x: 5, y: 6, w: 1, h: 1, pid: 'cs1', map: 'seasonPlaza', s: 'critterSpot', solidTiles: [] });
    m.spawn = { x: 19, y: 3, dir: 'down' };
    return m;
  }

  function orchard() {
    const m = base('orchard', '西郊外缘 · 果园与鸭塘', 38, 24, { fill: 'grass', bgm: 'street', particles: 'dragonfly' });
    for (let x = 0; x < 38; x++) { tree(m, x, 0); tree(m, x, 23); }
    for (let y = 1; y < 23; y++) { tree(m, 0, y); if (y !== 12 && y !== 13) tree(m, 37, y); }
    set(m, 37, 12, 'path'); set(m, 37, 13, 'path'); set(m, 18, 23, 'path'); set(m, 19, 23, 'path');
    m.doors.push({ x: 36, y: 12, to: ['fields', 2, 10, 'right'] });
    m.doors.push({ x: 36, y: 13, to: ['fields', 2, 11, 'right'] });
    m.doors.push({ x: 18, y: 23, to: ['farmstead', 13, 1, 'up'] });
    m.doors.push({ x: 19, y: 23, to: ['farmstead', 14, 1, 'up'] });
    rect(m, 18, 10, 20, 2, 'path');
    rect(m, 18, 11, 2, 13, 'path');
    rect(m, 2, 5, 13, 7, 'grassDark');
    rect(m, 4, 15, 10, 4, 'water');
    rect(m, 3, 14, 12, 1, 'sand'); rect(m, 3, 19, 12, 1, 'sand');
    rect(m, 24, 4, 8, 6, 'crop');
    [[4, 6], [8, 6], [12, 6], [6, 10], [10, 10], [4, 9], [12, 9]].forEach(([x, y]) => tree(m, x, y));
    m.objects.push({ kind: 'sign', x: 7, y: 14, w: 1, h: 1, text: '鸭塘', solidTiles: [], s: 'duckPond' });
    m.objects.push({ kind: 'sign', x: 27, y: 3, w: 1, h: 1, text: '风田', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'pickupSpot', x: 11, y: 12, w: 1, h: 1, solidTiles: [], s: 'pick', cid: 'l8' });
    // 百果园八树：每棵每天一摘，当季才结果（春枇杷樱桃/夏桃葡萄/秋梨柿/冬柚拐枣）
    m.objects.push({ kind: 'sign', x: 3, y: 12, w: 1, h: 1, text: '🟡', solidTiles: [], s: 'pickFruit', fid: 'f1' });
    m.objects.push({ kind: 'sign', x: 4, y: 13, w: 1, h: 1, text: '🍒', solidTiles: [], s: 'pickFruit', fid: 'f2' });
    m.objects.push({ kind: 'sign', x: 13, y: 12, w: 1, h: 1, text: '🍑', solidTiles: [], s: 'pickFruit', fid: 'f3' });
    m.objects.push({ kind: 'sign', x: 10, y: 13, w: 1, h: 1, text: '🍇', solidTiles: [], s: 'pickFruit', fid: 'f4' });
    m.objects.push({ kind: 'sign', x: 6, y: 13, w: 1, h: 1, text: '🍐', solidTiles: [], s: 'pickFruit', fid: 'f5' });
    m.objects.push({ kind: 'sign', x: 8, y: 12, w: 1, h: 1, text: '🟠', solidTiles: [], s: 'pickFruit', fid: 'f6' });
    m.objects.push({ kind: 'sign', x: 26, y: 13, w: 1, h: 1, text: '🍊', solidTiles: [], s: 'pickFruit', fid: 'f7' });
    m.objects.push({ kind: 'sign', x: 11, y: 13, w: 1, h: 1, text: '🟤', solidTiles: [], s: 'pickFruit', fid: 'f8' });
    // 晒果摊：白天摊在草地上晾，傍晚就收进筐里背回去了
    m.objects.push({ kind: 'sign', x: 14, y: 10, w: 1, h: 1, text: '🧺', solidTiles: [], periods: [1, 2, 3] });
    m.objects.push({ kind: 'scarecrow', x: 28, y: 7, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'flagpole', x: 31, y: 5, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'bench', x: 20, y: 11, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'flowerbed', x: 21, y: 13, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'sign', x: 29, y: 10, w: 1, h: 1, text: '风车田', solidTiles: [], s: 'windmillField' });
    m.objects.push({ kind: 'photoSpot', x: 24, y: 10, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's18' });
    m.objects.push({ kind: 'sign', x: 15, y: 12, w: 1, h: 1, text: '🎨', solidTiles: [], s: 'sketchSpot', cid: 's23' });  // 写生簿·果香满园
    m.npcs.push({ id: 'datou_orchard', x: 22, y: 11, dir: 'left', pal: 'datou', name: '大头', s: 'datou', acts: ['laugh', 'yawn'] });
    // 星之果实 5/5（果园西北角）
    m.objects.push({ kind: 'starFruit', x: 2, y: 3, w: 1, h: 1, sid: 'sf5', s: 'starFruit', solidTiles: [], taken: false });
    // 生物窝点：林间空地——蜜蜂/毛毛虫，夜里刺猬溜进来吃落果
    m.objects.push({ kind: 'critter', x: 16, y: 8, w: 1, h: 1, pid: 'ch1', map: 'orchard', s: 'critterSpot', solidTiles: [] });
    m.objects.push({ kind: 'critter', x: 26, y: 17, w: 1, h: 1, pid: 'ch2', map: 'orchard', s: 'critterSpot', solidTiles: [] });
    m.spawn = { x: 34, y: 12, dir: 'left' };
    return m;
  }

  function farmstead() {
    const m = base('farmstead', '郊外 · 小农舍', 28, 18, { fill: 'grass', bgm: 'home' });
    for (let x = 0; x < 28; x++) { if (x !== 13 && x !== 14) tree(m, x, 0); tree(m, x, 17); }
    for (let y = 1; y < 17; y++) { tree(m, 0, y); if (y !== 9 && y !== 10) tree(m, 27, y); }
    set(m, 13, 0, 'path'); set(m, 14, 0, 'path'); set(m, 27, 9, 'path'); set(m, 27, 10, 'path');
    m.doors.push({ x: 13, y: 0, to: ['orchard', 18, 22, 'down'] });
    m.doors.push({ x: 14, y: 0, to: ['orchard', 19, 22, 'down'] });
    m.doors.push({ x: 26, y: 9, to: ['fields', 30, 27, 'right'] });
    m.doors.push({ x: 26, y: 10, to: ['fields', 31, 27, 'right'] });
    rect(m, 13, 0, 2, 10, 'path');
    rect(m, 13, 9, 15, 2, 'path');
    building(m, 5, 5, 8, 5, { roof: 'roofO', name: '小农舍', to: null });
    building(m, 16, 5, 6, 5, { roof: 'roofT', name: '谷仓', to: null });
    rect(m, 4, 12, 8, 3, 'soil'); rect(m, 4, 12, 8, 1, 'crop');
    m.objects.push({ kind: 'clothesline', x: 5, y: 10, w: 1, h: 1, solidTiles: [] });
    m.objects.push({ kind: 'mailbox2', x: 12, y: 9, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bench', x: 18, y: 10, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'plantRack', x: 9, y: 11, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'sign', x: 20, y: 4, w: 1, h: 1, text: '仓房', solidTiles: [], s: 'exitSign' });
    // 晒谷场：只摊在日头最足的那两个时段，日头一斜就扫回谷仓
    m.objects.push({ kind: 'sign', x: 17, y: 13, w: 1, h: 1, text: '🌾', solidTiles: [], periods: [1, 2] });
    m.objects.push({ kind: 'sign', x: 12, y: 10, w: 1, h: 1, text: '灶台', solidTiles: [], s: 'farmKitchen' });
    m.npcs.push({ id: 'farmerwife', x: 14, y: 9, dir: 'down', pal: 'aunt', name: '农舍阿姨', s: 'flowerLady', acts: ['wave'] });
    // 生物窝点：谷仓后与菜畦边——黄昏田鼠、偷蛋的夜行黄鼬
    m.objects.push({ kind: 'critter', x: 22, y: 14, w: 1, h: 1, pid: 'cm1', map: 'farmstead', s: 'critterSpot', solidTiles: [] });
    m.objects.push({ kind: 'critter', x: 4, y: 16, w: 1, h: 1, pid: 'cm2', map: 'farmstead', s: 'critterSpot', solidTiles: [] });
    m.spawn = { x: 24, y: 9, dir: 'left' };
    return m;
  }

  function hillside() {
    const m = base('hillside', '青峰雪山 · 连绵山道与演武台', 90, 52, { fill: 'grass', bgm: 'home', particles: 'firefly' });
    // —— 连绵雪山（T5 扩容 5 倍+）：山脊线程序生成，五峰并峙、雪线分层、风垭口谷道 ——
    // bumps: [峰心x, 峰幅, 展宽σ]；ridge[x] = 山体从北缘铺到第几行
    const bumps = [[10, 9, 7], [28, 12, 6], [48, 16, 7], [67, 12, 6], [84, 10, 7]];
    const ridge = [];
    for (let x = 1; x <= 88; x++) {
      let r = 25;
      for (const [cx, amp, sg] of bumps) r += amp * Math.exp(-((x - cx) ** 2) / (2 * sg * sg));
      ridge[x] = Math.round(Math.min(r, 34));
    }
    for (let x = 36; x <= 40; x++) ridge[x] = Math.min(ridge[x], 18);      // 风垭口：山脊凹出一条进山谷道
    for (let x = 1; x <= 88; x++) rect(m, x, 0, 1, ridge[x] + 1, 'mountain');
    // 雪线分层：主峰戴厚雪冠，东峰挂小雪帽，其余高岭只留霜线
    for (let x = 1; x <= 88; x++) {
      const snowRow = Math.round(2 + 6 * Math.exp(-((x - 48) ** 2) / 98) + 3 * Math.exp(-((x - 84) ** 2) / 72));
      for (let y = 0; y < Math.min(snowRow, ridge[x]); y++) if (m.g[y][x] === 'mountain') set(m, x, y, 'snowPeak');
    }
    // 山脚苔石棱线（只点在草地上，不挡路）
    for (let x = 1; x <= 88; x++) {
      if (x % 3 !== 0) continue;
      const y = ridge[x] + 1;
      if (y < 52 && m.g[y][x] === 'grass') set(m, x, y, 'mossStone');
    }
    // 远山剪影：南面一列断续黛色远山，拉开两层空间纵深
    for (let x = 4; x <= 84; x++) {
      if (x % 4 === 0 || x % 4 === 1) set(m, x, 40, 'mountain');
      if (x % 8 < 3) set(m, x, 39, 'mountain');
    }
    // —— 山道系统：神龛广场 → 风垭口谷道 → 石阶 → 崖壁栈道 → 主峰下演武台 ——
    rect(m, 40, 31, 12, 3, 'stone');                                     // 神龛广场（山脚石台）
    rect(m, 37, 19, 3, 15, 'path');                                      // 风垭口谷道
    rect(m, 38, 14, 2, 5, 'path');                                       // 谷道尽头石阶（双格宽，接通崖壁栈道）
    rect(m, 40, 14, 6, 2, 'path');                                       // 崖壁栈道（凿岩横道）
    rect(m, 46, 13, 12, 4, 'stone');                                     // 山顶演武台（主峰正下）
    rect(m, 46, 34, 3, 3, 'path');                                       // 广场北石阶（下山路）
    rect(m, 44, 37, 3, 14, 'path');                                      // 南下大道
    rect(m, 47, 46, 22, 2, 'path');                                      // 萤火谷东向小径
    rect(m, 80, 24, 9, 2, 'path');                                       // 东崖横道（通秘境小门）
    rect(m, 80, 26, 2, 10, 'path');                                      // 东崖下坡道
    // —— 边界树墙（北侧山体即是屏障，不种树；东门 y24/25 及树根上延 y22/23 留豁） ——
    for (let y = 1; y <= 50; y++) { tree(m, 0, y); }
    for (let y = 1; y <= 50; y++) { if (y < 22 || y > 25) tree(m, 89, y); }
    for (let x = 0; x <= 89; x++) { if (x !== 44 && x !== 45) tree(m, x, 51); }
    set(m, 44, 51, 'path'); set(m, 45, 51, 'path');
    set(m, 89, 24, 'path'); set(m, 89, 25, 'path');
    m.doors.push({ x: 44, y: 51, to: ['fields', 18, 1, 'up'] });
    m.doors.push({ x: 45, y: 51, to: ['fields', 19, 1, 'up'] });
    m.doors.push({ x: 89, y: 24, to: ['hiddenOutskirts', 2, 10, 'right'] });
    m.doors.push({ x: 89, y: 25, to: ['hiddenOutskirts', 2, 11, 'right'] });
    // —— 神龛广场陈设 ——
    m.objects.push({ kind: 'sign', x: 44, y: 31, w: 1, h: 2, text: '神龛', solidTiles: [[0, 1]], s: 'parkTale' });
    m.objects.push({ kind: 'bench', x: 41, y: 32, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'flowerbed', x: 40, y: 31, w: 2, h: 1, solidTiles: [[0, 0], [1, 0]] });
    m.objects.push({ kind: 'lamp', x: 49, y: 33, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'bannerFlag', x: 50, y: 31, w: 1, h: 1, solidTiles: [], nightGlow: true, periods: [4, 5] });   // 山脚夜灯
    // —— 山顶演武台：木人桩 + 武学问碑 ——
    m.objects.push({ kind: 'dummy', x: 50, y: 13, w: 1, h: 2, s: 'dummy', solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'lamp', x: 47, y: 13, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'sign', x: 55, y: 13, w: 1, h: 1, text: '⚔', solidTiles: [], s: 'summitSign' });
    m.inters.push({ x: 52, y: 13, s: 'martialStele' });                  // 武学问碑（答题换秘籍）
    // —— 山腰物候 ——
    m.objects.push({ kind: 'sign', x: 10, y: 36, w: 1, h: 1, text: '晨跑坡', solidTiles: [], s: 'runSlope' });
    m.objects.push({ kind: 'pickupSpot', x: 60, y: 38, w: 1, h: 1, solidTiles: [], s: 'forage', fid: 'hillHerb' });
    m.objects.push({ kind: 'sign', x: 16, y: 38, w: 1, h: 1, text: '🎨', solidTiles: [], s: 'sketchSpot', cid: 's21' });  // 写生簿·青峰雪岭
    m.objects.push({ kind: 'sign', x: 66, y: 46, w: 1, h: 1, text: '萤火谷', solidTiles: [], s: 'firefly', sparkle: true });
    m.objects.push({ kind: 'photoSpot', x: 64, y: 42, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's19' });
    m.objects.push({ kind: 'rock', x: 35, y: 37, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'rock', x: 22, y: 37, w: 1, h: 1, solidTiles: [[0, 0]] });
    trees(m, [[5, 38], [8, 40], [12, 39], [15, 41], [18, 43], [21, 45], [36, 38], [39, 36],
              [60, 41], [63, 45], [68, 43], [71, 44], [75, 45], [78, 47], [84, 44], [86, 46],
              [38, 44], [50, 44], [56, 44]]);
    m.npcs.push({ id: 'xiaohong_run', x: 45, y: 45, dir: 'up', pal: 'xiaohong', name: '小红', s: 'xiaohong', runner: true, mood: '♥', acts: ['wave', 'yawn'] });
    // 生物窝点：山顶石台/西坡草甸/萤火谷——竹节虫·独角仙·锹形虫·纺织娘·蝾螈·蝙蝠，清晨幼鹿，冬天白鼬，月夜山神小狐狸
    m.objects.push({ kind: 'critter', x: 52, y: 15, w: 1, h: 1, pid: 'cl1', map: 'hillside', s: 'critterSpot', solidTiles: [] });
    m.objects.push({ kind: 'critter', x: 12, y: 44, w: 1, h: 1, pid: 'cl2', map: 'hillside', s: 'critterSpot', solidTiles: [] });
    m.objects.push({ kind: 'critter', x: 72, y: 46, w: 1, h: 1, pid: 'cl3', map: 'hillside', s: 'critterSpot', solidTiles: [] });
    // —— 野外高草丛：山脚三片（东坡深草 tier1 易出独角仙/锹形虫） ——
    rect(m, 5, 42, 6, 3, 'grass2'); rect(m, 58, 44, 5, 2, 'grass2'); rect(m, 74, 43, 4, 2, 'grass2');
    m.grass = [
      { x: 5, y: 42, w: 6, h: 3, tier: 0 },    // 西坡草窝
      { x: 58, y: 44, w: 5, h: 2, tier: 0 },   // 萤火谷边
      { x: 74, y: 43, w: 4, h: 2, tier: 1 },   // 东坡深草
    ];
    m.spawn = { x: 44, y: 48, dir: 'up' };
    return m;
  }

  function hiddenOutskirts() {
    const m = base('hiddenOutskirts', '镇外秘境 · 排水道与旧宅', 34, 22, { fill: 'grassDark', bgm: 'street' });
    for (let x = 0; x < 34; x++) { tree(m, x, 0); tree(m, x, 21); }
    for (let y = 1; y < 21; y++) { if (y !== 10 && y !== 11) tree(m, 0, y); tree(m, 33, y); }
    set(m, 0, 10, 'path'); set(m, 0, 11, 'path');
    m.doors.push({ x: 1, y: 10, to: ['hillside', 88, 24, 'left'] });
    m.doors.push({ x: 1, y: 11, to: ['hillside', 88, 25, 'left'] });
    rect(m, 0, 9, 14, 3, 'path');
    rect(m, 13, 8, 2, 10, 'path');
    rect(m, 4, 14, 10, 4, 'water');
    rect(m, 3, 13, 12, 1, 'sand'); rect(m, 3, 18, 12, 1, 'sand');
    building(m, 22, 5, 8, 5, { roof: 'roofG', name: '旧宅', to: null });
    m.objects.push({ kind: 'caveMouth', x: 6, y: 10, w: 1, h: 2, solidTiles: [[0, 1]] });
    m.objects.push({ kind: 'board', x: 15, y: 8, w: 2, h: 2, solidTiles: [[0, 1], [1, 1]] });
    m.objects.push({ kind: 'rock', x: 18, y: 14, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'rock', x: 20, y: 15, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'stump', x: 24, y: 14, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'dig', x: 27, y: 12, w: 1, h: 1, solidTiles: [], s: 'dig', did: 'd9' });
    m.objects.push({ kind: 'mysterySpot', x: 7, y: 13, w: 1, h: 1, solidTiles: [], s: 'rumor', rid: 3 });
    m.objects.push({ kind: 'sign', x: 16, y: 7, w: 1, h: 1, text: '工地', solidTiles: [], s: 'exitSign' });
    m.objects.push({ kind: 'sign', x: 24, y: 11, w: 1, h: 1, text: '旧宅', solidTiles: [], s: 'oldHouse' });
    m.objects.push({ kind: 'photoSpot', x: 21, y: 10, w: 1, h: 1, solidTiles: [], s: 'photoSpot', cid: 's20' });
    // 星之果实 3/5（旧宅南侧草地）
    m.objects.push({ kind: 'starFruit', x: 30, y: 16, w: 1, h: 1, sid: 'sf3', s: 'starFruit', solidTiles: [], taken: false });
    // 生物窝点：旧宅外墙根——雨夜图鉴厚了才现身的月光凤蝶
    m.objects.push({ kind: 'critter', x: 18, y: 18, w: 1, h: 1, pid: 'cx1', map: 'hiddenOutskirts', s: 'critterSpot', solidTiles: [] });
    m.spawn = { x: 3, y: 10, dir: 'right' };
    return m;
  }

  /* ==================== 第三章 · 时光回廊 ==================== */
  function timehall() {
    const m = base('timehall', '钟楼地底 · 时光回廊', 28, 18, { fill: 'moonFloor', bgm: 'timecorr', indoor: true });
    rect(m, 0, 0, 28, 1, 'starWall'); rect(m, 0, 1, 28, 1, 'starWall');
    rect(m, 0, 2, 1, 15, 'starWall'); rect(m, 27, 2, 1, 15, 'starWall'); rect(m, 0, 17, 28, 1, 'starWall');
    // 中央传送阵回地面
    rect(m, 12, 12, 4, 3, 'floorCarpet');
    m.doors.push({ x: 13, y: 14, to: ['northyard', 16, 9, 'up'] });
    m.doors.push({ x: 14, y: 14, to: ['northyard', 16, 9, 'up'] });
    // 四扇时代之门（顺序开启）
    const gate = (x, id, flag, label) => {
      set(m, x, 1, 'doorDark');
      m.objects.push({ kind: 'sign', x, y: 0, w: 1, h: 1, text: label, solidTiles: [], s: 'eraSign' });
      m.doors.push({ x, y: 1, to: [id, 11, 11, 'up'], need: flag });
    };
    gate(5, 'era1', 'e0', '百年前');       // e0 恒真（第一章总是开启）
    gate(11, 'era2', 'e1', '四十年前');
    gate(17, 'era3', 'e2', '三十年前');
    gate(23, 'era4', 'e3', '二十年前');
    // 深处 BOSS 之门（双层墙，y=1 一并打通）
    set(m, 14, 0, 'doorDark'); set(m, 14, 1, 'moonFloor');
    m.doors.push({ x: 14, y: 0, to: ['bosshall', 13, 15, 'up'], need: 'e4' });
    // 纪念之门（毕业后的第五扇门）
    m.objects.push({ kind: 'mirror', x: 7, y: 4, w: 2, h: 2, s: 'door5', solidTiles: [[0, 0], [1, 0], [0, 1], [1, 1]] });
    [[4, 8], [24, 8], [8, 4], [20, 12]].forEach(([x, y]) => set(m, x, y, 'crystal'));
    m.spawn = { x: 13, y: 12, dir: 'up' };
    return m;
  }
  const eraRoom = (id, name, npcPal, npcName, npcS, extra) => () => {
    const m = base(id, name, 24, 14, { fill: 'moonFloor', bgm: 'timecorr', indoor: true });
    rect(m, 0, 0, 24, 1, 'starWall'); rect(m, 0, 1, 24, 1, 'starWall');
    rect(m, 0, 2, 1, 11, 'starWall'); rect(m, 23, 2, 1, 11, 'starWall'); rect(m, 0, 13, 24, 1, 'starWall');
    set(m, 11, 13, 'doorDark'); set(m, 12, 13, 'doorDark');
    m.doors.push({ x: 11, y: 13, to: ['timehall', 5, 2, 'down'] });
    m.doors.push({ x: 12, y: 13, to: ['timehall', 5, 2, 'down'] });
    if (npcPal) m.npcs.push({ id: npcS, x: 11, y: 5, dir: 'down', pal: npcPal, name: npcName, s: npcS, acts: ['wave', 'think'] });
    if (extra) extra(m);
    m.spawn = { x: 11, y: 11, dir: 'up' };
    return m;
  };
  const era1 = eraRoom('era1', '百年前 · 建校之春', 'younglady', '年轻的晨曦女士', 'era1npc', m => {
    m.objects.push({ kind: 'plant', x: 5, y: 5, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'plant', x: 17, y: 5, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'desk2', x: 8, y: 8, w: 1, h: 1, s: 'era1desk', solidTiles: [[0, 0]] });
  });
  const era2 = eraRoom('era2', '四十年前 · 实验室', 'studentC', '少年的校长', 'era2npc', m => {
    m.objects.push({ kind: 'cauldron', x: 8, y: 6, w: 1, h: 1, s: 'era2bench', solidTiles: [[0, 0]] });
    rect(m, 14, 3, 6, 1, 'blackboard');
  });
  const era3 = eraRoom('era3', '三十年前 · 图书馆', 'teacher_cn', '年轻的管理员', 'era3npc', m => {
    [4, 8, 12, 16, 20].forEach(x => rect(m, x, 3, 1, 5, 'shelfOld'));
    m.objects.push({ kind: 'goban', x: 14, y: 9, w: 1, h: 1, s: 'era3cart', solidTiles: [[0, 0]] });
  });
  const era4 = eraRoom('era4', '二十年前 · 教室', 'dad', '少年的爸爸', 'era4npc', m => {
    [6, 9, 12].forEach(y => [6, 10, 14].forEach(x => set(m, x, y, 'desk')));
    m.inters.push({ x: 18, y: 9, s: 'era4desk' });
  });

  function bosshall() {
    const m = base('bosshall', '回廊深处 · 遗忘之雾', 28, 18, { fill: 'moonFloor', bgm: 'boss', indoor: true });
    rect(m, 0, 0, 28, 1, 'starWall'); rect(m, 0, 1, 28, 1, 'starWall');
    rect(m, 0, 2, 1, 15, 'starWall'); rect(m, 27, 2, 1, 15, 'starWall'); rect(m, 0, 17, 28, 1, 'starWall');
    set(m, 13, 17, 'doorDark'); set(m, 14, 17, 'doorDark');
    m.doors.push({ x: 13, y: 17, to: ['timehall', 14, 2, 'down'] });   // 落点在墙内会卡死，改为门下地板
    m.doors.push({ x: 14, y: 17, to: ['timehall', 14, 2, 'down'] });
    m.objects.push({ kind: 'mirror', x: 12, y: 3, w: 2, h: 2, s: 'bossMirror', solidTiles: [[0, 0], [1, 0], [0, 1], [1, 1]] });
    [[5, 6], [22, 6], [8, 13], [19, 13]].forEach(([x, y]) => set(m, x, y, 'crystal'));
    m.spawn = { x: 13, y: 14, dir: 'up' };
    return m;
  }

  function gradhall() {
    const m = base('gradhall', '毕业礼 · 礼堂', 28, 16, { fill: 'moonFloor', bgm: 'grad', indoor: true });
    rect(m, 0, 0, 28, 1, 'starWall'); rect(m, 0, 1, 28, 1, 'starWall');
    rect(m, 0, 2, 1, 13, 'starWall'); rect(m, 27, 2, 1, 13, 'starWall'); rect(m, 0, 15, 28, 1, 'starWall');
    set(m, 13, 15, 'doorDark'); set(m, 14, 15, 'doorDark');
    m.doors.push({ x: 13, y: 15, to: ['timehall', 13, 12, 'down'] });
    m.doors.push({ x: 14, y: 15, to: ['timehall', 13, 12, 'down'] });
    rect(m, 11, 4, 6, 8, 'floorCarpet');
    m.objects.push({ kind: 'sign', x: 5, y: 4, w: 1, h: 2, text: '毕业快乐', solidTiles: [[0, 1]], s: 'gradSign' });
    m.objects.push({ kind: 'sign', x: 22, y: 5, w: 1, h: 1, text: '📷', solidTiles: [], s: 'gradPhoto' });   // B组：毕业合影
    m.npcs.push({ id: 'grad_all', x: 14, y: 5, dir: 'down', pal: 'yuejian', name: '所有人', s: 'gradScene', acts: ['wave', 'laugh'] });
    [[4, 12], [23, 12], [7, 6], [20, 8]].forEach(([x, y]) => set(m, x, y, 'crystal'));
    m.spawn = { x: 13, y: 12, dir: 'up' };
    return m;
  }

  /* —— 番外 · 四季花园 —— */
  function seasonGarden() {
    const m = base('seasonGarden', '星之庭园 · 四季花园', 30, 20, { fill: 'grassDark', bgm: 'tender', particles: 'firefly' });
    rect(m, 14, 16, 2, 4, 'mossStone');
    m.doors.push({ x: 14, y: 19, to: ['backhillDeep', 13, 10, 'down'] });
    m.doors.push({ x: 15, y: 19, to: ['backhillDeep', 13, 10, 'down'] });
    // 四象限
    m.inters.push({ x: 7, y: 5, s: 'springSpot' });
    m.inters.push({ x: 22, y: 5, s: 'summerSpot' });
    m.inters.push({ x: 7, y: 13, s: 'autumnSpot' });
    m.inters.push({ x: 22, y: 13, s: 'winterSpot' });
    [[6, 4], [9, 7], [21, 4], [24, 7], [6, 12], [9, 15], [21, 12], [24, 15]].forEach(([x, y]) => set(m, x, y, 'glow'));
    tree(m, 4, 3); tree(m, 25, 3); tree(m, 4, 15); tree(m, 25, 15);
    // —— P-B1 晨曦祭坛：花园正中的古老石坛——四位守护灵苏醒后可以唤醒它（回收二章圣物伏笔） ——
    m.objects.push({ id: 'dawnAltar', kind: 'altar', x: 14, y: 7, w: 2, h: 2, glow: false, s: 'dawnAltar',
                     solidTiles: [[0, 0], [1, 0], [0, 1], [1, 1]] });
    m.inters.push({ x: 14, y: 9, s: 'dawnAltar' });
    m.inters.push({ x: 15, y: 9, s: 'dawnAltar' });
    m.spawn = { x: 15, y: 15, dir: 'up' };
    return m;
  }

  /* —— 教师办公室 —— */
  function office() {
    const m = base('office', '教学楼 · 教师办公室', 24, 14, { fill: 'floorTile', bgm: 'indoor', indoor: true });
    rect(m, 0, 0, 24, 1, 'inWallTop'); rect(m, 0, 1, 24, 1, 'inWall');
    rect(m, 0, 2, 1, 11, 'inWall'); rect(m, 23, 2, 1, 11, 'inWall'); rect(m, 0, 13, 24, 1, 'inWall');
    set(m, 11, 13, 'doorWood'); set(m, 12, 13, 'doorWood');
    m.doors.push({ x: 11, y: 13, to: ['campus', 18, 8, 'down'] });
    m.doors.push({ x: 12, y: 13, to: ['campus', 18, 8, 'down'] });
    [3, 9, 15, 20].forEach(x => set(m, x, 1, 'inWallWin'));
    // 四位主科老师工位（按办公时段在岗）
    m.objects.push({ kind: 'sign', x: 4, y: 4, w: 1, h: 2, text: '王老师', solidTiles: [[0, 1]], s: 'tutorMath' });
    m.objects.push({ kind: 'sign', x: 9, y: 4, w: 1, h: 2, text: '李老师', solidTiles: [[0, 1]], s: 'tutorCn' });
    m.objects.push({ kind: 'sign', x: 14, y: 4, w: 1, h: 2, text: '陈老师', solidTiles: [[0, 1]], s: 'tutorSci' });
    m.objects.push({ kind: 'sign', x: 19, y: 4, w: 1, h: 2, text: '吴老师', solidTiles: [[0, 1]], s: 'tutorEn' });
    m.objects.push({ kind: 'sign', x: 20, y: 9, w: 1, h: 2, text: '挑战题', solidTiles: [[0, 1]], s: 'officeChallenge' });
    m.objects.push({ kind: 'plant', x: 2, y: 10, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'plant', x: 21, y: 10, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.spawn = { x: 11, y: 11, dir: 'up' };
    return m;
  }

  /* —— NPC 日程表（按时段在校园内换位） —— */
  const SCHED = {
    campus: {
      xiaoming:  { 0: [26, 25], 1: [24, 11], 2: [31, 26], 3: [24, 11], 4: [33, 8], 5: [19, 30] },
      xiaohong:  { 0: [8, 26], 1: [7, 26], 2: [33, 26], 3: [8, 26], 4: [9, 25], 5: [10, 20] },
      xiaogang:  { 0: [11, 27], 1: [10, 27], 2: [31, 26], 3: [11, 27], 4: [8, 26], 5: [11, 27] },
      xiaopang:  { 0: [21, 30], 1: [20, 30], 2: [36, 28], 3: [36, 28], 4: [20, 30], 5: [21, 30] },
      lufei:     { 0: [8, 24], 1: [8, 24], 2: [10, 26], 3: [8, 24], 4: [6, 23], 5: null },
      wangmei:   { 0: [18, 8], 1: [18, 8], 2: [24, 10], 3: [18, 8], 4: [25, 21], 5: null },
      laozhang:  { 0: [19, 31], 1: [19, 31], 2: [19, 31], 3: [4, 15], 4: [19, 31], 5: [19, 31] },
      tuxiao:    { 0: [10, 24], 1: [17, 14], 2: [24, 17], 3: [10, 24], 4: [19, 16], 5: null },
      xiaohua:   { 0: [16, 10], 1: [16, 10], 2: [26, 10], 3: [30, 21], 4: [17, 10], 5: null },
      sunyang:   { 0: [8, 9], 1: [8, 9], 2: [7, 22], 3: [5, 24], 4: [42, 14], 5: null },
      datou:     { 0: [13, 29], 1: [35, 28], 2: [36, 28], 3: [13, 29], 4: [36, 29], 5: null },
      cat:       { 0: [25, 17], 1: [25, 17], 2: [27, 18], 3: [25, 17], 4: [39, 16], 5: [25, 17] },
      dog2:      { 0: [20, 31], 1: [23, 13], 2: [18, 8], 3: [20, 31], 4: [20, 31], 5: [23, 13] },
      principal: { 0: [19, 12], 1: [19, 12], 2: [9, 7], 3: [19, 12], 4: [19, 12], 5: [19, 12] }
    },
    town: {
      shopgirl:  { 0: [8, 14], 1: [8, 14], 2: [8, 14], 3: [8, 14], 4: [10, 15], 5: null },
      bookman:   { 0: [18, 14], 1: [18, 14], 2: [18, 14], 3: [18, 14], 4: [16, 15], 5: null },
      aunt2:     { 0: [27, 14], 1: [27, 14], 2: [27, 14], 3: [27, 14], 4: [26, 15], 5: null },
      lao_li:    { 0: [44, 20], 1: [44, 20], 2: [44, 20], 3: [41, 20], 4: [42, 24], 5: null },
      baiyun:    { 0: [38, 22], 1: [38, 22], 2: [38, 22], 3: [38, 22], 4: [44, 24], 5: null }
    },
    riverbay: {
      wangmei_bay: { 0: null, 1: null, 2: null, 3: null, 4: [28, 10], 5: [25, 11] }
    },
    oldstreet: {
      xm_comic: { 0: null, 1: null, 2: null, 3: [10, 11], 4: [10, 17], 5: null },
      xp_snack: { 0: null, 1: null, 2: [25, 16], 3: [25, 16], 4: [26, 17], 5: null }
    },
    cultureHub: {
      jinpeng_field: { 0: null, 1: null, 2: null, 3: [30, 12], 4: [29, 12], 5: null },
      momo_corner: { 0: null, 1: null, 2: [19, 14], 3: [19, 14], 4: [18, 14], 5: null }
    },
    orchard: {
      datou_orchard: { 0: null, 1: null, 2: [22, 11], 3: [22, 11], 4: [20, 11], 5: null }
    },
    hillside: {
      xiaohong_run: { 0: [50, 46], 1: [58, 46], 2: null, 3: null, 4: [45, 45], 5: null }
    },
    library: {
      teacher_cn:  { 0: [14, 2], 1: [14, 2], 2: [14, 2], 3: [17, 7], 4: [3, 5], 5: null },
      student_lib: { 0: [17, 7], 1: [17, 7], 2: [17, 7], 3: [17, 7], 4: [17, 7], 5: null },
      linxiaoyu:   { 0: [17, 8], 1: [17, 8], 2: [14, 10], 3: [17, 8], 4: [23, 6], 5: null }
    },
    classroom: {
      teacher_math:  { 0: [14, 2], 1: [14, 2], 2: [14, 2], 3: [14, 2], 4: null, 5: null },
      student_class: { 0: [10, 7], 1: [10, 7], 2: [10, 7], 3: [10, 7], 4: [10, 7], 5: null }
    },
    canteen: {
      aunt:            { 0: [14, 3], 1: [14, 3], 2: [14, 3], 3: [14, 3], 4: [14, 3], 5: null },
      zhaoling:        { 0: [18, 10], 1: [18, 10], 2: [18, 10], 3: [18, 10], 4: [17, 8], 5: null },
      student_canteen: { 0: null, 1: null, 2: [8, 8], 3: [8, 8], 4: [12, 8], 5: null }
    }
  };

  /* ==================== P0 栖霞小区：住宿 + 拜访同学 ==================== */

  // 小区全景（南接小镇主街，北面三栋公寓）
  function estate() {
    const m = base('estate', '栖霞小区', 30, 22, { fill: 'path', bgm: 'home' });
    rect(m, 2, 2, 26, 3, 'grass');
    // 三栋公寓立面（老存档落进来时，也保持和小镇外景一致）
    apartmentBlock(m, 3, 5, 8, 7, {
      roof: 'roofT',
      doors: [
        { dx: 2, name: '小明', s: 'knock_xmHome' },
        { dx: 4, name: '小红', s: 'knock_xhHome' }
      ]
    });
    apartmentBlock(m, 12, 5, 8, 7, {
      roof: 'roofO',
      doors: [
        { dx: 2, name: '小刚', s: 'knock_xgHome' },
        { dx: 4, name: '小胖', s: 'knock_xpHome' }
      ]
    });
    apartmentBlock(m, 20, 5, 9, 7, {
      roof: 'roofB',
      doors: [
        { dx: 1, name: '乌云', s: 'knock_wyHome' },
        { dx: 3, name: '墨墨', s: 'knock_mmHome' },
        { dx: 5, name: '金鹏', s: 'knock_jpHome' },
        { dx: 7, name: '王美', s: 'knock_wmHome' }
      ]
    });
    // 南侧矮墙（回家方向）—— 落点避开设在 (31,19) 的精灵小筑立面
    set(m, 14, 21, 'path'); set(m, 15, 21, 'path');
    m.doors.push({ x: 14, y: 21, to: ['town', 37, 20, 'up'] });
    m.doors.push({ x: 15, y: 21, to: ['town', 37, 21, 'up'] });

    // 楼间小路
    rect(m, 5, 12, 22, 1, 'path');
    [[5, 10], [7, 10], [14, 10], [16, 10], [21, 10], [23, 10], [25, 10], [27, 10]].forEach(([x, y]) => set(m, x, y, 'path'));
    // 小区物件
    m.objects.push({ kind: 'sign', x: 10, y: 14, w: 1, h: 2, text: '栖霞小区', solidTiles: [[0, 1]], s: 'estateSign' });
    m.objects.push({ kind: 'swing', x: 5, y: 16, w: 1, h: 1, s: 'swingPlay', solidTiles: [[0, 0]] });       // 秋千（双人事件点）
    m.objects.push({ kind: 'mailbox2', x: 26, y: 15, w: 1, h: 1, s: 'estateMail', solidTiles: [[0, 0]] });  // 小区邮筒
    m.objects.push({ kind: 'plantRack', x: 12, y: 16, w: 1, h: 1, s: 'estatePlant', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'bench', x: 19, y: 16, w: 1, h: 1, solidTiles: [[0, 0]] });
    // 出口路牌（南门回小镇）
    m.objects.push({ kind: 'sign', x: 13, y: 20, w: 1, h: 1, text: '出口↓', solidTiles: [], s: 'exitSign' });
    // 路灯
    [[9, 13], [18, 13], [27, 13]].forEach(([x, y]) => m.objects.push({ kind: 'lamp', x, y, w: 1, h: 2, solidTiles: [[0, 1]] }));
    // 花坛
    [[4, 14], [11, 20], [21, 19]].forEach(([x, y]) => set(m, x, y, 'grass2'));
    m.spawn = { x: 15, y: 18, dir: 'up' };
    return m;
  }

  /* —— 同学家：16x12 两室小家（玄关 + 客厅 + 门帘后的里屋）+ 个性装饰 + 家人 NPC —— */
  function friendHome(id, name, floor, palKey, back, decor) {
    const m = base(id, name, 16, 12, { fill: 'homeFloor', bgm: 'home', indoor: true });
    rect(m, 0, 0, 16, 1, 'inWallTop'); rect(m, 0, 1, 16, 1, 'inWall');
    rect(m, 0, 2, 1, 9, 'inWall'); rect(m, 15, 2, 1, 9, 'inWall'); rect(m, 0, 11, 16, 1, 'inWall');
    set(m, 7, 11, 'aptDoor'); set(m, 8, 11, 'aptDoor');
    m.doors.push({ x: 7, y: 11, to: back });
    m.doors.push({ x: 8, y: 11, to: back });
    [2, 6, 9, 13].forEach(x => set(m, x, 1, 'inWallWin'));
    // 玄关：门口地垫 + 鞋柜（翻一翻的小彩蛋）
    rect(m, 7, 10, 2, 1, 'rugRound');
    m.objects.push({ kind: 'sign', x: 6, y: 10, w: 1, h: 1, text: '👟', solidTiles: [[0, 0]], s: 'shoeHome' });
    // 客厅（左侧）：小饭桌 + 藤椅 + 绿植 + 挂钟
    m.objects.push({ kind: 'desk2', x: 2, y: 5, w: 1, h: 1, s: 'ftable', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'chair2', x: 4, y: 5, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'plantRack', x: 1, y: 9, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'wallClock', x: 5, y: 1, w: 1, h: 1, solidTiles: [] });
    // 门帘：分隔客厅与里屋（上半挂帘，下半留通道）
    m.objects.push({ kind: 'curtain', x: 9, y: 2, w: 2, h: 2, solidTiles: [[0, 0], [1, 0], [0, 1], [1, 1]] });
    // 里屋（右上）：床 + 书桌（同学的私人领地）
    m.objects.push({ kind: 'bed', x: 13, y: 3, w: 1, h: 1, solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'desk2', x: 10, y: 2, w: 1, h: 1, solidTiles: [[0, 0]] });
    // 个性装饰（由 decor 回调注入）
    if (decor) decor(m);
    // 主人（坐在自己里屋）+ 家人（decor 里加，s: fam_<家>）
    m.npcs.push({ id: 'host_' + id, x: 12, y: 6, dir: 'down', pal: palKey, name: name.replace(/^.*· /, ''), s: 'host_' + id, acts: ['wave'] });
    m.spawn = { x: 7, y: 9, dir: 'up' };
    return m;
  }
  const xmHome = () => friendHome('xmHome', '小明家', 'floorWood', 'xiaoming', ['town', 34, 12, 'down'], m => {
    m.objects.push({ kind: 'bookStack', x: 3, y: 2, w: 1, h: 1, s: 'comicTower', solidTiles: [[0, 0]] });   // 漫画塔
    m.objects.push({ kind: 'wallArt', x: 7, y: 1, w: 1, h: 1, s: 'comicWall', solidTiles: [] });           // 漫画墙
    m.objects.push({ kind: 'sign', x: 9, y: 4, w: 1, h: 1, text: '📺', solidTiles: [], s: 'xmTV' });        // 一起看漫画
    m.npcs.push({ id: 'fam_xm', x: 3, y: 7, dir: 'down', pal: 'mom', name: '小明妈', s: 'fam_xmHome', acts: ['think'] });
  });
  const xhHome = () => friendHome('xhHome', '小红家', 'floorWood', 'xiaohong', ['town', 36, 12, 'down'], m => {
    m.objects.push({ kind: 'coatHook', x: 9, y: 1, w: 1, h: 1, s: 'xhMedal', solidTiles: [] });            // 奖牌墙
    m.objects.push({ kind: 'chair2', x: 3, y: 2, w: 1, h: 1, s: 'xhBedSide', solidTiles: [[0, 0]] });       // 妈妈的藤椅
    m.objects.push({ kind: 'sign', x: 5, y: 2, w: 1, h: 1, text: '🏃', solidTiles: [], s: 'xhTalk' });
    m.objects.push({ kind: 'wallArt', x: 13, y: 1, w: 1, h: 1, s: 'xhFamily', solidTiles: [] });           // 全家福
    m.npcs.push({ id: 'fam_xh', x: 4, y: 7, dir: 'down', pal: 'aunt', name: '小红妈', s: 'fam_xhHome', acts: ['wave'] });
  });
  const xgHome = () => friendHome('xgHome', '小刚家', 'floorWood', 'xiaogang', ['town', 43, 12, 'down'], m => {
    m.objects.push({ kind: 'shelf2', x: 2, y: 2, w: 1, h: 1, s: 'xgViolin', solidTiles: [[0, 0]] });        // 藏起来的琴
    m.objects.push({ kind: 'sign', x: 8, y: 2, w: 1, h: 1, text: '🎻', solidTiles: [], s: 'xgTalk' });
    m.objects.push({ kind: 'piano', x: 1, y: 7, w: 2, h: 1, s: 'xgPiano', solidTiles: [[0, 0], [1, 0]] });   // 妈妈的钢琴
    m.npcs.push({ id: 'fam_xg', x: 4, y: 7, dir: 'down', pal: 'mom', name: '小刚妈', s: 'fam_xgHome', acts: ['think'] });
  });
  const xpHome = () => friendHome('xpHome', '小胖家', 'rugRound', 'xiaopang', ['town', 45, 12, 'down'], m => {
    m.objects.push({ kind: 'sign', x: 9, y: 2, w: 1, h: 1, text: '🧊', solidTiles: [], s: 'xpFridge' });    // 冰箱（拿食材）
    m.objects.push({ kind: 'bookStack', x: 3, y: 2, w: 1, h: 1, s: 'xpSnacks', solidTiles: [[0, 0]] });     // 零食山
    m.objects.push({ kind: 'stove2', x: 1, y: 7, w: 1, h: 1, s: 'xpStove', solidTiles: [[0, 0]] });         // 奶奶的灶台
    m.npcs.push({ id: 'fam_xp', x: 3, y: 8, dir: 'down', pal: 'aunt', name: '小胖奶奶', s: 'fam_xpHome', acts: ['wave'] });
  });
  const wyHome = () => friendHome('wyHome', '乌云家', 'homeFloor', 'wuyun', ['town', 50, 12, 'down'], m => {
    m.objects.push({ kind: 'bookStack', x: 2, y: 2, w: 1, h: 1, s: 'wyBooks', solidTiles: [[0, 0]] });      // 单词本堆
    m.objects.push({ kind: 'sign', x: 8, y: 2, w: 1, h: 1, text: '🌙', solidTiles: [], s: 'wyTalk' });
    m.objects.push({ kind: 'sign', x: 2, y: 5, w: 1, h: 1, text: '🔅', solidTiles: [], s: 'wyLamp' });      // 夜班爸的台灯
    m.npcs.push({ id: 'fam_wy', x: 4, y: 7, dir: 'down', pal: 'dad', name: '乌云爸', s: 'fam_wyHome', acts: ['think'] });
  });
  const mmHome = () => friendHome('mmHome', '墨墨家', 'homeFloor', 'momo', ['town', 52, 12, 'down'], m => {
    m.objects.push({ kind: 'cauldron', x: 8, y: 2, w: 1, h: 1, s: 'mmLab', solidTiles: [[0, 0]] });         // 迷你实验角
    m.objects.push({ kind: 'shelf2', x: 3, y: 2, w: 1, h: 1, s: 'mmShelf', solidTiles: [[0, 0]] });
    m.objects.push({ kind: 'sign', x: 5, y: 2, w: 1, h: 1, text: '⚗', solidTiles: [], s: 'mmTalk' });
    m.objects.push({ kind: 'bookStack', x: 1, y: 7, w: 1, h: 1, s: 'mmPapers', solidTiles: [[0, 0]] });     // 论文山
    m.npcs.push({ id: 'fam_mm', x: 4, y: 8, dir: 'down', pal: 'librarian', name: '墨墨妈', s: 'fam_mmHome', acts: ['think'] });
  });
  const jpHome = () => friendHome('jpHome', '金鹏家', 'floorTile', 'jinpeng', ['town', 54, 12, 'down'], m => {
    m.objects.push({ kind: 'shelf2', x: 2, y: 2, w: 1, h: 1, s: 'jpBook', solidTiles: [[0, 0]] });          // 巨大书架
    m.objects.push({ kind: 'trophyFrame', x: 8, y: 1, w: 1, h: 1, s: 'jpTrophy', solidTiles: [] });         // 爸爸的奖杯
    m.objects.push({ kind: 'sign', x: 5, y: 2, w: 1, h: 1, text: '⚔', solidTiles: [], s: 'jpTalk' });
    m.objects.push({ kind: 'dummy', x: 1, y: 7, w: 1, h: 1, s: 'jpDummy', solidTiles: [[0, 0]] });          // 爸爸的木人桩
    m.npcs.push({ id: 'fam_jp', x: 4, y: 8, dir: 'down', pal: 'dad', name: '金鹏爸', s: 'fam_jpHome', acts: ['think'] });
  });
  const wmHome = () => friendHome('wmHome', '王美家', 'rugRound', 'wangmei', ['town', 56, 12, 'down'], m => {
    m.objects.push({ kind: 'sign', x: 8, y: 2, w: 1, h: 1, text: '🎙', solidTiles: [], s: 'wmMirror' });    // 对镜练广播
    m.objects.push({ kind: 'sign', x: 3, y: 2, w: 1, h: 1, text: '📻', solidTiles: [], s: 'wmRadio' });
    m.objects.push({ kind: 'plantRack', x: 1, y: 7, w: 1, h: 1, solidTiles: [[0, 0]] });                    // 姐姐的绿植角
    m.npcs.push({ id: 'fam_wm', x: 4, y: 8, dir: 'down', pal: 'shopgirl', name: '王美姐', s: 'fam_wmHome', acts: ['wave'] });
  });

  const builders = { campus, classroom, library, lab, canteen, english, gym, music, backhill, backhillDeep, cave, cave2F, mineShaft,
                     moonhall, magic, astro, oldlib, corridor, trials, astroTop,
                     northyard, dojo, club, dorm, infirmary, rooftop,
                     giftShopIn, bookShopIn, foodShopIn, petShopIn, photoStudioIn, barberIn, clockShopIn, tailorShopIn, arenaHall,
                     town, fields, homeYard, homeIn, park, riverbay, oldstreet, transportHub, cultureHub, seasonPlaza, orchard, farmstead, hillside, hiddenOutskirts,
                     timehall, era1, era2, era3, era4, bosshall, gradhall, seasonGarden, office,
                     estate, xmHome, xhHome, xgHome, xpHome, wyHome, mmHome, jpHome, wmHome };
  const ids = Object.keys(builders);

  function get(id) { return builders[id](); }   // 每次全新构建（保证事件状态干净）

  /* —— 说话人头像索引：显示名 → 调色板键（猫类用 # 开头的体色） —— */
  const PORTRAITS = {
    '校长': 'principal', '小明': 'xiaoming', '小红': 'xiaohong', '小刚': 'xiaogang', '陆飞': 'lufei', '林小雨': 'linxiaoyu',
    '王老师': 'teacher_math', '李老师': 'teacher_cn', '陈老师': 'teacher_sci', '吴老师': 'teacher_en',
    '赵老师': 'teacher_zhao', '刘老师': 'teacher_liu', '食堂阿姨': 'aunt', '摊主': 'aunt',
    '神秘老人': 'keeper', '星儿': 'star', '老矿工': 'miner', '月见校长': 'yuejian', '金鹏': 'jinpeng',
    '墨墨': 'momo', '灰先生': 'grey', '道场师傅': 'dojomaster', '美术部长': 'xiaoying', '校医': 'doctor',
    '乌云': 'wuyun', '大壮': 'dazhuang', '小影': 'xiaoying', '礼品店员': 'shopgirl', '书店老板': 'bookman', '阿橘': 'shopgirl',
    '旧书翁': 'oldbook', '王叔': 'cardman', '田伯': 'farmer', '妈妈': 'mom', '爸爸': 'dad', '花婆婆': 'aunt', '秦墨': 'librarian',
    '小卷': 'buddy', '小胖': 'xiaopang', '同学': 'studentA', '学生': 'studentA', '所有人': 'yuejian',
    '煤球': '#33333c', '团子': '#f4f4f8', '小猫': '#e8964a', '阿星': '#e8d8a8',
    // —— 同学家家人们（P1 家庭线） ——
    '小明妈': 'mom', '小红妈': 'aunt', '小刚妈': 'mom', '小胖奶奶': 'aunt',
    '乌云爸': 'dad', '墨墨妈': 'librarian', '金鹏爸': 'dad', '王美姐': 'shopgirl'
  };
  function portraitOf(name) {
    const v = PORTRAITS[name];
    if (v == null) return null;
    return v[0] === '#' ? { body: v } : ADV.Sprites.PALETTES[v] || null;
  }

  return { get, ids, SOLID: ADV.Sprites.SOLID, COUNTER: ADV.Sprites.COUNTER, SCHED, PORTRAITS, portraitOf };
})();
