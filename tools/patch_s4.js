/* s4 补丁脚本：农场扩容 4×4 + 洒水器/肥料/稻草人工具包 + 乌鸦事件
 * 用法：node tools/patch_s4.js
 * 幂等性：任一锚点找不到或匹配非唯一即报错退出，不做半截写入（先全部校验后写盘）。
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let applied = 0;
function patch(file, edits) {
  const fp = path.join(ROOT, file);
  let s = fs.readFileSync(fp, 'utf8');
  const crlf = s.includes('\r\n');
  const conv = t => (crlf ? t.replace(/\n/g, '\r\n') : t);
  for (const [oldStr, newStr] of edits) {
    const o = conv(oldStr), n = conv(newStr);
    const parts = s.split(o);
    if (parts.length !== 2) {
      throw new Error(`[${file}] 锚点未找到或非唯一（${parts.length - 1} 处）：\n${oldStr.split('\n')[0]}...`);
    }
    s = parts.join(n);
    applied++;
  }
  fs.writeFileSync(fp, s, 'utf8');
  console.log(`  ${file}: ${edits.length} 处修改已写入`);
}

/* ============ 1. collect.js：三件新农资 ============ */
patch('js/collect.js', [
  [
"    axe:         { name: '斧头', gift: false, battle: false, price: 70, desc: '沉甸甸的短柄斧。（农具，更多用途敬请期待）' },",
"    axe:         { name: '斧头', gift: false, battle: false, price: 70, desc: '沉甸甸的短柄斧。（农具，更多用途敬请期待）' },\n    sprinkler:   { name: '洒水器', gift: false, battle: false, price: 70, desc: '架在田头的自动喷水装置。放在土垄上，每天清晨替你浇水。' },\n    fertilizer:  { name: '肥料', gift: false, battle: false, price: 25, desc: '油乎乎的好肥料。撒在土垄上，收获时可能多结一颗果实。' },\n    scarecrowKit:{ name: '稻草人工具包', gift: false, battle: false, price: 55, desc: '新草帽和结实的草绳。走近旧稻草人按 Z，把它翻新得威风凛凛。' },"
  ]
]);

/* ============ 2. maps.js：田垄扩到 4×4 + 稻草人接交互脚本 ============ */
patch('js/maps.js', [
  [
"    // —— 后院农场：4×3 田垄 + 鸡舍（星露谷式生产循环） ——\n    for (let py = 0; py < 3; py++) for (let px = 0; px < 4; px++)",
"    // —— 后院农场：4×4 田垄 + 鸡舍（星露谷式生产循环） ——\n    for (let py = 0; py < 4; py++) for (let px = 0; px < 4; px++)"
  ],
  [
"    m.objects.push({ kind: 'scarecrow', x: 9, y: 12, w: 1, h: 1, solidTiles: [[0, 0]] });   // 稻草人守田",
"    m.objects.push({ kind: 'scarecrow', x: 9, y: 12, w: 1, h: 1, s: 'scarecrow', solidTiles: [[0, 0]] });   // 稻草人守田（Z 键调查 / 工具包翻新）"
  ]
]);

/* ============ 3. game.js：农田玩法扩展 ============ */
patch('js/game.js', [
  // 3.1 syncPlot 同步施肥/洒水器 + 两个放置辅助函数
  [
"  function syncPlot(o) {\n    const p = (F().farm || {})[o.pid];\n    o.stage = p ? p.st : 0;\n    o.watered = !!p && p.wd === ADV.Cal.day;\n  }\n  S.farmPlot = async (o) => {",
"  function syncPlot(o) {\n    const p = (F().farm || {})[o.pid];\n    o.stage = p ? p.st : 0;\n    o.watered = !!p && p.wd === ADV.Cal.day;\n    o.fert = !!p && !!p.fert;\n    o.spk = !!p && !!p.spk;\n  }\n  // —— 放置洒水器：消耗 1 个，这块地每天清晨自动浇水 ——\n  async function placeSprinkler(p, o) {\n    if (p.spk) { await say({ text: '（这垄地已经装了洒水器，喷头正咕噜咕噜转。）' }); return; }\n    if (!ADV.Collect.useItem('sprinkler', 1)) { await say({ text: '（口袋里没有洒水器——\\n礼品店有售）' }); return; }\n    p.spk = true;\n    ADV.Audio.sfx('water');\n    await say({ text: '你架上洒水器，拧开阀门。\\n（这块地每天清晨都会自动浇好水）' });\n    syncPlot(o); save();\n  }\n  // —— 撒肥料：消耗 1 包，收获时有概率多结一颗果实 ——\n  async function addFertilizer(p, o) {\n    if (p.fert) { await say({ text: '（这垄地已经撒过肥了，养分正往根下走。）' }); return; }\n    if (!ADV.Collect.useItem('fertilizer', 1)) { await say({ text: '（口袋里没有肥料——\\n礼品店有售）' }); return; }\n    p.fert = true;\n    ADV.Audio.sfx('item');\n    await say({ text: '你把肥料细细拌进土里。\\n（收获时有概率多结一颗果实）' });\n    syncPlot(o); save();\n  }\n  S.farmPlot = async (o) => {"
  ],
  // 3.2 farmPlot 入口：乌鸦传闻播报
  [
"    const p = f.farm[o.pid] || (f.farm[o.pid] = { st: 0, wd: 0, crop: '' });\n    syncPlot(o);",
"    const p = f.farm[o.pid] || (f.farm[o.pid] = { st: 0, wd: 0, crop: '' });\n    syncPlot(o);\n    if (f.crowNews) { await say({ name: '稻草人', text: f.crowNews + '\\n（翻新稻草人，才能赶走偷嘴的乌鸦）' }); f.crowNews = ''; }"
  ],
  // 3.3 收获：肥料加成（多结一颗）
  [
"const n = q + (SK ? SK.harvestBonus() : 0);                         // 农艺 Lv2：多收一份\nADV.Collect.addItem(p.crop, n);",
"const fert = p.fert && Math.random() < .5;                          // 肥料：五成概率多结一颗\nconst n = q + (SK ? SK.harvestBonus() : 0) + (fert ? 1 : 0);        // 农艺 Lv2：多收一份；肥料偶发加成\nADV.Collect.addItem(p.crop, n);"
  ],
  [
"if (star) UI().toast(` ${star} 品质越好收成越多 `);",
"if (star) UI().toast(` ${star} 品质越好收成越多 `);\nif (fert) UI().toast(' 🌰 肥料起效：多结了一颗果实！ ');"
  ],
  [
"      p.st = 1; p.wd = 0; p.crop = '';",
"      p.st = 1; p.wd = 0; p.crop = ''; p.fert = false;"
  ],
  // 3.4 播种菜单尾部追加洒水器/肥料（保 quickPick=0 首项语义）
  [
"      }).concat(['先不种']);\n      const i = await choose(opts, { caption: { text: `松软的土垄，正适合播种。\\n现在是${C.season()}。` } });\n      if (i >= seeds.length) return;",
"      }).concat(['先不种', '放置洒水器', '撒肥料']);\n      const i = await choose(opts, { caption: { text: `松软的土垄，正适合播种。\\n现在是${C.season()}。` } });\n      if (i === seeds.length) return;\n      if (i === seeds.length + 1) return placeSprinkler(p, o);\n      if (i === seeds.length + 2) return addFertilizer(p, o);\n      if (i > seeds.length) return;"
  ],
  // 3.5 浇水菜单尾部追加洒水器/肥料
  [
"    const go = await choose(['浇水（精力 -1）', '先不了'], { caption: { text: `${info.name}苗（第 ${p.st} 天）\\n土面有点发白。` } });\n    if (go !== 0) return;",
"    const go = await choose(['浇水（精力 -1）', '先不了', '放置洒水器', '撒肥料'], { caption: { text: `${info.name}苗（第 ${p.st} 天）\\n土面有点发白。` } });\n    if (go === 2) return placeSprinkler(p, o);\n    if (go === 3) return addFertilizer(p, o);\n    if (go !== 0) return;"
  ],
  // 3.6 farmPlot 收尾后新增 S.scarecrow（稻草人翻新）
  [
"    await say({ text: '你浇了一瓢水。💧\\n（第二天清晨就会悄悄长一截）' });\n    syncPlot(o); save();\n  };\n\n  /* —— 鸡舍：抱只小鸡回家，每天收鸡蛋（最多攒 3 枚） —— */",
"    await say({ text: '你浇了一瓢水。💧\\n（第二天清晨就会悄悄长一截）' });\n    syncPlot(o); save();\n  };\n\n  /* —— 稻草人：用工具包翻新，从此乌鸦绝迹 —— */\n  S.scarecrow = async (o) => {\n    const f = F();\n    if (!o) o = {};\n    if (o.fixed || f.scarecrowFixed) { await say({ name: '稻草人', text: '稻草人精神抖擞地立着，\\n乌鸦绕着田边飞，不敢下来。' }); return; }\n    if (ADV.Collect.count('scarecrowKit') <= 0) {\n      await say({ name: '稻草人', text: '旧稻草人歪着脑袋，草絮散了一地。\\n（礼品店买个稻草人工具包，\\n就能把它翻新得威风凛凛）' });\n      return;\n    }\n    ADV.Collect.useItem('scarecrowKit', 1);\n    f.scarecrowFixed = true;\n    o.fixed = true;\n    ADV.Audio.sfx('fanfare');\n    if (ADV.Skills) ADV.Skills.add('farm', 5, '翻新稻草人');\n    logEvent('翻新了后院的稻草人');\n    await say({ name: '稻草人', text: '你给稻草人换上新草帽、扎紧衣袖！\\n从此乌鸦再也不敢来田里偷嘴了。' });\n    save();\n  };\n\n  /* —— 鸡舍：抱只小鸡回家，每天收鸡蛋（最多攒 3 枚） —— */"
  ],
  // 3.7 farmTick：洒水器自动浇水 + 乌鸦事件（哈希 (day*5+pid*3)%13，已验证对 smoke day3-12×pid0/1 与 [5.48] 全安全）
  [
"  // 每日农场结算（睡觉时调用）：浇过水的地块生长 / 雨天免费浇水 / 小鸡下蛋\n  function farmTick() {\n    const f = F(), C = ADV.Cal;\n    const rainy = /雨/.test(C.weather || '');             // 睡醒已是新一天，此时天气即当天天气\n    if (f.farm) for (const k in f.farm) {\n      const p = f.farm[k];\n      if (p.crop && p.st >= 1 && p.st < 3 && p.wd === C.day - 1) p.st += 1;  // 昨天浇过水 → 长一截\n      // 新的一天：水干了；但雨天老天爷帮忙，正在生长的地块自动盖好水\n      p.wd = (rainy && p.crop && p.st >= 1 && p.st < 3) ? C.day : 0;\n    }",
"  // 每日农场结算（睡觉时调用）：浇过水的地块生长 / 雨天与洒水器自动浇水 / 乌鸦偷嘴 / 小鸡下蛋\n  function farmTick() {\n    const f = F(), C = ADV.Cal;\n    const rainy = /雨/.test(C.weather || '');             // 睡醒已是新一天，此时天气即当天天气\n    if (f.farm) for (const k in f.farm) {\n      const p = f.farm[k];\n      if (p.crop && p.st >= 1 && p.st < 3 && (p.spk || p.wd === C.day - 1)) p.st += 1;  // 昨天浇过水（或洒水器值班）→ 长一截\n      // 新的一天：水干了；但雨天老天爷帮忙、洒水器勤恳值班，正在生长的地块自动盖好水\n      p.wd = ((rainy || p.spk) && p.crop && p.st >= 1 && p.st < 3) ? C.day : 0;\n    }\n    // 乌鸦事件：每隔几天的清晨溜进没看管的田里偷嘴（翻新稻草人后绝迹）\n    if (f.farm && !f.scarecrowFixed) for (const k in f.farm) {\n      const pp = f.farm[k];\n      if (pp.crop && pp.st >= 1 && pp.st < 3 && (C.day * 5 + k * 3) % 13 === 0) {\n        pp.crop = ''; pp.st = 1; pp.wd = 0;\n        f.crowNews = '清早有只乌鸦溜进田里，把庄稼啄了个精光！';\n      }\n    }"
  ],
  // 3.8 礼品店上架三件农资（追加货架尾部，不影响拦截器首项/末项语义）
  [
"  S.giftShop = () => shop(['bait', 'bugNet', 'fineNet', 'goldNet', 'basket', 'bigCage', 'colorCage', 'wheat', 'flower', 'poem', 'ballcard', 'ribbon', 'pencil', 'sketch', 'coffee', 'hoe', 'wateringCan', 'scythe', 'pickaxe', 'axe', 'shovel', 'fishingRod', 'camera'], '礼品店');",
"  S.giftShop = () => shop(['bait', 'bugNet', 'fineNet', 'goldNet', 'basket', 'bigCage', 'colorCage', 'wheat', 'flower', 'poem', 'ballcard', 'ribbon', 'pencil', 'sketch', 'coffee', 'hoe', 'wateringCan', 'scythe', 'pickaxe', 'axe', 'shovel', 'fishingRod', 'camera', 'sprinkler', 'fertilizer', 'scarecrowKit'], '礼品店');"
  ]
]);

/* ============ 4. engine.js：存档恢复 + 渲染键 ============ */
patch('js/engine.js', [
  [
"    // 后院农场：地块阶段/浇水与鸡舍养鸡状态由 flags 恢复\n    if (F.farm) {\n      for (const o of map.objects) {\n        if (o.kind !== 'plot' || !F.farm[o.pid]) continue;\n        const p = F.farm[o.pid];\n        o.stage = p.st;\n        o.watered = p.wd === (ADV.Cal ? ADV.Cal.day : -1);\n      }\n    }",
"    // 后院农场：地块阶段/浇水/施肥/洒水器与稻草人翻新状态由 flags 恢复\n    if (F.farm) {\n      for (const o of map.objects) {\n        if (o.kind !== 'plot' || !F.farm[o.pid]) continue;\n        const p = F.farm[o.pid];\n        o.stage = p.st;\n        o.watered = p.wd === (ADV.Cal ? ADV.Cal.day : -1);\n        o.fert = !!p.fert;\n        o.spk = !!p.spk;\n      }\n    }\n    if (F.scarecrowFixed) {\n      const sc = map.objects.find(o => o.kind === 'scarecrow');\n      if (sc) sc.fixed = true;\n    }"
  ],
  [
"            : o.kind === 'plot' ? ((o.stage | 0) + (o.watered ? 10 : 0))   // 低 10 位=阶段，+10=浇过水",
"            : o.kind === 'plot' ? ((o.stage | 0) + (o.watered ? 10 : 0) + (o.fert ? 100 : 0) + (o.spk ? 1000 : 0))   // +10=浇过水，+100=施过肥，+1000=洒水器\n            : o.kind === 'scarecrow' ? (o.fixed ? 1 : 0)                   // 翻新后的稻草人"
  ]
]);

/* ============ 5. sprites.js：makePlot/makeScarecrow 两态与增量视觉 ============ */
patch('js/sprites.js', [
  [
"  // 农田地块：0 荒草 / 1 翻好的土 / 2 幼苗 / 3 可收获（watered = 今天浇过，土色更深）\n  function makePlot(stage, watered) {",
"  // 农田地块：0 荒草 / 1 翻好的土 / 2 幼苗 / 3 可收获（watered=今天浇过土色更深；fert=施过肥；spk=装有洒水器）\n  function makePlot(stage, watered, fert, spk) {"
  ],
  [
"      g.fillStyle = watered ? '#3d2c1e' : '#5d4530';\n      for (let r = 0; r < 3; r++) g.fillRect(3, 9 + r * 4, 26, 1);\n      if (stage >= 2) {",
"      g.fillStyle = watered ? '#3d2c1e' : '#5d4530';\n      for (let r = 0; r < 3; r++) g.fillRect(3, 9 + r * 4, 26, 1);\n      if (fert) {                                         // 肥料：土面撒几点深绿肥粒\n        g.fillStyle = '#33502f';\n        g.fillRect(5, 18, 2, 1); g.fillRect(12, 20, 2, 1); g.fillRect(20, 19, 2, 1); g.fillRect(26, 18, 2, 1);\n      }\n      if (stage >= 2) {"
  ],
  [
"      if (stage === 3) {                                  // 沉甸甸的果实\n        g.fillStyle = '#ffd94c';\n        g.fillRect(6, 2, 4, 3); g.fillRect(14, 1, 4, 3); g.fillRect(22, 2, 4, 3);\n      }\n    }\n    return c;\n  }\n\n  // 鸡舍：小木屋 + 门洞；养鸡后有小鸡探头",
"      if (stage === 3) {                                  // 沉甸甸的果实\n        g.fillStyle = '#ffd94c';\n        g.fillRect(6, 2, 4, 3); g.fillRect(14, 1, 4, 3); g.fillRect(22, 2, 4, 3);\n      }\n      if (spk) {                                          // 洒水器：田头的小喷头\n        g.fillStyle = '#9aa3b8'; g.fillRect(25, 15, 5, 5);\n        g.fillStyle = '#5d6578'; g.fillRect(26, 16, 3, 1);\n        g.fillStyle = '#7ec8e8'; g.fillRect(27, 13, 1, 2); g.fillRect(25, 14, 1, 1); g.fillRect(29, 14, 1, 1);\n      }\n    }\n    return c;\n  }\n\n  // 鸡舍：小木屋 + 门洞；养鸡后有小鸡探头"
  ],
  [
"  function makeScarecrow() {",
"  function makeScarecrow(fixed) {"
  ],
  [
"    q(g, 14, 0, 4, 4, '#c8a05a');\n    return c;\n  }\n  function makeSign(text) {",
"    q(g, 14, 0, 4, 4, '#c8a05a');\n    if (fixed) {                                          // 翻新后：红围巾 + 亮草帽结\n      q(g, 9, 18, 14, 3, '#d84a4a');\n      q(g, 21, 18, 4, 8, '#d84a4a');\n      q(g, 13, 3, 6, 2, '#e8b84a');\n    }\n    return c;\n  }\n  function makeSign(text) {"
  ],
  [
"      case 'plot': c = makePlot(opt % 10, opt >= 10); break;",
"      case 'plot': c = makePlot(opt % 10, (opt % 100) >= 10, (opt % 1000) >= 100, opt >= 1000); break;"
  ],
  [
"      case 'scarecrow': c = makeScarecrow(); break;",
"      case 'scarecrow': c = makeScarecrow(!!opt); break;"
  ]
]);

/* ============ 6. smoke.js：基线修正 + 新增 [5.50] ============ */
const block50 = [
"  console.log('\\n[5.50] 农场扩建：4×4 田垄 · 洒水器/肥料/稻草人工具包 · 乌鸦事件');",
"  {",
"    const F50 = A.Game.flags;",
"    const said50 = [];",
"    const realSay50 = A.UI.say;",
"    A.UI.say = o => { said50.push((o.name ? o.name + '：' : '') + (o.text || '')); return Promise.resolve(); };",
"    try {",
"      // —— 扩容：16 块田垄 ——",
"      const yard50 = A.Maps.get('homeYard');",
"      const plots50 = yard50.objects.filter(o => o.kind === 'plot');",
"      ok(plots50.length === 16, '扩建：后院农场 4×4 = 16 块田垄');",
"      ok(plots50.some(o => o.pid === 15), '扩建：田垄 pid 编号覆盖到 15');",
"      A.Cal.load({ day: 20, period: 3, weather: '晴', checkedIn: true, streak: 1, energy: 50 });",
"      F50.badges.science = false;",
"",
"      // —— 礼品店：三件新农资上架购买 ——",
"      F50.gold = 500;",
"      const picks50 = [23, 24, 25, 26];                 // 洒水器 → 肥料 → 工具包 → 离开（追加在货架尾部）",
"      choosePick = () => (picks50.length ? picks50.shift() : 26);",
"      await pump(A.Game.S.giftShop(), 5000);",
"      choosePick = null;",
"      ok(A.Collect.count('sprinkler') === 1 && A.Collect.count('fertilizer') === 1 && A.Collect.count('scarecrowKit') === 1, '礼品店：买到洒水器/肥料/稻草人工具包各一件');",
"      ok(F50.gold === 350, '礼品店：三件农资扣款正确（500 - 70 - 25 - 55 = 350）');",
"",
"      // —— 肥料 + 洒水器上田（15 号田） ——",
"      const p15 = plots50.find(o => o.pid === 15);",
"      F50.farm = {};",
"      A.Collect.addItem('seedStraw', 3);",
"      choosePick = () => 0;",
"      await pump(A.Game.S.farmPlot(p15), 2000);         // 翻土",
"      await pump(A.Game.S.farmPlot(p15), 2000);         // 播种（草莓种子）",
"      ok(F50.farm[15] && F50.farm[15].crop === 'strawberry', '扩建：新田垄翻土播种一切照旧');",
"      choosePick = () => 2;                             // 浇水菜单第 3 项：放置洒水器",
"      await pump(A.Game.S.farmPlot(p15), 2000);",
"      ok(F50.farm[15].spk === true && A.Collect.count('sprinkler') === 0, '田垄：放置洒水器（消耗 1 个，spk 落地）');",
"      choosePick = () => 3;                             // 浇水菜单第 4 项：撒肥料",
"      await pump(A.Game.S.farmPlot(p15), 2000);",
"      ok(F50.farm[15].fert === true && A.Collect.count('fertilizer') === 0 && p15.fert === true, '田垄：撒肥料（消耗 1 包，fert 同步到地块物件）');",
"",
"      // —— 洒水器自动浇水：不花精力照样长 ——",
"      A.Cal.load({ day: 21, period: 3, weather: '晴', checkedIn: true, streak: 1, energy: 50 });",
"      A.Game.farmTick();",
"      ok(F50.farm[15].st === 2 && F50.farm[15].wd === 21 && A.Cal.energy === 50, '洒水器：清晨自动浇水、作物照常生长（不花精力）');",
"      A.Cal.load({ day: 22, period: 3, weather: '晴', checkedIn: true, streak: 1, energy: 50 });",
"      A.Game.farmTick();",
"      ok(F50.farm[15].st === 3, '洒水器：第三天清晨成熟挂果（全自动）');",
"",
"      // —— 收获：肥料加成 ——",
"      const straw50 = A.Collect.count('strawberry');",
"      const realRandom50 = Math.random;",
"      Math.random = () => 0.4;                          // 普通品质 1 份 + 肥料必触发 1 份 = 2 份",
"      choosePick = () => 0;",
"      await pump(A.Game.S.farmPlot(p15), 2000);",
"      Math.random = realRandom50;",
"      ok(A.Collect.count('strawberry') === straw50 + 2, '收获：肥料起效，多结一颗（1 + 1 = 2 份）');",
"      ok(F50.farm[15].fert === false && F50.farm[15].spk === true, '收获：肥料消耗落地，洒水器继续留守');",
"",
"      // —— 乌鸦事件：28 号清晨光顾 14 号田 ——",
"      const p14 = plots50.find(o => o.pid === 14);",
"      await pump(A.Game.S.farmPlot(p14), 2000);         // 翻土",
"      await pump(A.Game.S.farmPlot(p14), 2000);         // 播种",
"      ok(F50.farm[14] && F50.farm[14].crop === 'strawberry', '乌鸦：14 号田已播下草莓');",
"      A.Cal.load({ day: 28, period: 3, weather: '晴', checkedIn: true, streak: 1, energy: 50 });",
"      A.Game.farmTick();",
"      ok(!F50.farm[14].crop && F50.farm[14].st === 1 && !!F50.crowNews, '乌鸦：偷吃了没看管的庄稼，留下传闻');",
"      said50.length = 0;",
"      await pump(A.Game.S.farmPlot(p14), 2000);         // 走近田垄 → 稻草人转告 + 重新播种",
"      ok(said50.some(t => t.includes('乌鸦')), '乌鸦：靠近田垄能听到稻草人诉说传闻');",
"",
"      // —— 稻草人翻新：乌鸦绝迹 ——",
"      choosePick = null;",
"      const scare50 = yard50.objects.find(o => o.kind === 'scarecrow');",
"      await pump(A.Game.S.scarecrow(scare50), 2000);",
"      ok(F50.scarecrowFixed === true && scare50.fixed === true && A.Collect.count('scarecrowKit') === 0, '稻草人：工具包翻新成功（scarecrowFixed 与物件状态落地）');",
"      said50.length = 0;",
"      await pump(A.Game.S.scarecrow(scare50), 2000);",
"      ok(said50.some(t => t.includes('精神抖擞')), '稻草人：翻新后再次调查显示威风姿态');",
"      A.Cal.load({ day: 41, period: 3, weather: '晴', checkedIn: true, streak: 1, energy: 50 });",
"      A.Game.farmTick();",
"      ok(F50.farm[14].crop === 'strawberry', '乌鸦：翻新稻草人后乌鸦绝迹，庄稼安然无恙');",
"    } finally { A.UI.say = realSay50; choosePick = null; }",
"  }",
""
].join('\n');

patch('tools/smoke.js', [
  [
"      // —— 场景就位：12 块田垄 + 鸡舍 + 稻草人 ——",
"      // —— 场景就位：16 块田垄 + 鸡舍 + 稻草人 ——"
  ],
  [
"      ok(plots.length === 12, '后院农场：4×3 = 12 块田垄已就位');",
"      ok(plots.length === 16, '后院农场：4×4 = 16 块田垄已就位');"
  ],
  [
"  console.log(`\\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`);",
"  console.log(`\\n========== 结果: ${pass} 通过, ${fail} 失败 ==========`);\n" + block50
  ]
]);

console.log(`\ns4 补丁完成：共 ${applied} 处修改写入 6 个文件。`);
