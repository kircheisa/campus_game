/* =========================================================
 * collect.js —— 收藏 / 背包 / 礼物
 * 收藏五类：书籍 / 名句 / 落叶 / 昆虫 / 回忆照片
 * 背包：礼物与战斗道具（可送礼、可用）
 * 状态存于 ADV.Game.flags.col / .items（随存档保存）
 * ========================================================= */
window.ADV = window.ADV || {};
ADV.Collect = (function () {

  /* ---------- 收藏图鉴 ---------- */
  const DB = {
    books: (ADV.Books ? ADV.Books.LIST.map(b => ({ id: b.id, name: b.name, desc: b.intro })) : []),
    fish: [
      { id: 'f1', name: '鲫鱼', desc: '河里最常见，肉嫩刺多。' },
      { id: 'f2', name: '鲤鱼', desc: '跃出水面时鳞片闪金光。' },
      { id: 'f3', name: '草鱼', desc: '爱吃水草，长得飞快。' },
      { id: 'f4', name: '泥鳅', desc: '滑溜溜的，抓都抓不住。' },
      { id: 'f5', name: '小龙虾', desc: '举着钳子，很威风。' },
      { id: 'f6', name: '黑鱼', desc: '河里的猎手，牙齿锋利。' },
      { id: 'f7', name: '金色的鱼', desc: '传说钓到它的人会有好运。' },
      { id: 'f8', name: '河蚌', desc: '壳里也许藏着珍珠？' },
      /* —— 玩法批次二：时段限定渔获 —— */
      { id: 'f9', name: '月光鱼', desc: '银鳞映着月光——只在夜晚咬钩。' },
      { id: 'f10', name: '霓虹鲤', desc: '雨夜传说：它现身时，整条河都会安静。仅雨夜上钩。' }
    ],
    quotes: [
      { id: 'q1', name: '知识就是力量。', desc: '—— 培根' },
      { id: 'q2', name: '书山有路勤为径，学海无涯苦作舟。', desc: '—— 韩愈' },
      { id: 'q3', name: '欲穷千里目，更上一层楼。', desc: '—— 王之涣' },
      { id: 'q4', name: '真正重要的东西，用眼睛是看不见的。', desc: '—— 《小王子》' },
      { id: 'q5', name: '读书破万卷，下笔如有神。', desc: '—— 杜甫' },
      { id: 'q6', name: '天生我材必有用。', desc: '—— 李白' },
      { id: 'q7', name: '路漫漫其修远兮，吾将上下而求索。', desc: '—— 屈原' },
      { id: 'q8', name: '失败是成功之母。', desc: '—— 民间智慧' },
      { id: 'q9', name: '运动是一切生命的源泉。', desc: '—— 达·芬奇' },
      { id: 'q10', name: '音乐是心灵的语言。', desc: '—— 海顿' },
      { id: 'q11', name: '友谊使欢乐倍增，使痛苦减半。', desc: '—— 培根' },
      { id: 'q12', name: '一寸光阴一寸金。', desc: '—— 《增广贤文》' },
      { id: 'q13', name: '长风破浪会有时，直挂云帆济沧海。', desc: '—— 李白' },
      { id: 'q14', name: '海内存知己，天涯若比邻。', desc: '—— 王勃' },
      { id: 'q15', name: '纸上得来终觉浅，绝知此事要躬行。', desc: '—— 陆游' },
      { id: 'q16', name: '学而不思则罔，思而不学则殆。', desc: '—— 孔子《论语》' },
      { id: 'q17', name: '不积跬步，无以至千里。', desc: '—— 荀子' },
      { id: 'q18', name: '锲而不舍，金石可镂。', desc: '—— 荀子' },
      { id: 'q19', name: '会当凌绝顶，一览众山小。', desc: '—— 杜甫' },
      { id: 'q20', name: '问渠那得清如许？为有源头活水来。', desc: '—— 朱熹' }
    ],
    leaves: [
      { id: 'l1', name: '银杏叶', desc: '像一把小扇子。' },
      { id: 'l2', name: '枫叶', desc: '红得像火。' },
      { id: 'l3', name: '梧桐叶', desc: '比脸还大。' },
      { id: 'l4', name: '柳叶', desc: '河边垂下来的眉毛。' },
      { id: 'l5', name: '樟树叶', desc: '揉一揉有香气。' },
      { id: 'l6', name: '桦树叶', desc: '白色树干上的小三角。' },
      { id: 'l7', name: '榆树叶', desc: '锯齿边的小椭圆。' },
      { id: 'l8', name: '竹叶', desc: '风一吹就沙沙响。' }
    ],
    /* —— 生物图鉴：宝可梦式收集（42 种 = 虫 18 + 水 12 + 走兽 12）
     *   fam=系别（虫/水/兽，斗虫擂台循环克制） rar=稀有度1-3 hp/pow/spd=对战三维
     *   bait=诱饵偏好（背包物品 id） where=主要出没地图 hint=图鉴出没线索
     *   when={p:[时段0-5] se:[季节en] we:[天气]} 缺省=全天候  need=图鉴进度解锁
     *   evolve={to,days}=饲养进化（放院里水缸/罐中 N 天变化） —— 存储键沿用 col().insects */
    critters: [
      // —— 虫系（i1-i8 沿用旧图鉴：pow/spd 与斗虫擂台兼容）——
      { id: 'i1', name: '七星瓢虫', desc: '背上有七颗星。', fam: '虫', rar: 1, pow: 3, spd: 3, hp: 7, bait: ['cherry'], where: 'homeYard', when: { p: [0, 1, 2, 3] }, hint: '雨后的花丛边慢慢爬。' },
      { id: 'i2', name: '蝴蝶', desc: '春天的舞蹈家。', fam: '虫', rar: 1, pow: 2, spd: 5, hp: 6, bait: ['peach'], where: 'park', when: { p: [0, 1, 2, 3], se: ['spring', 'summer'] }, hint: '春夏的花园里起落。', evolve: { to: 'i2', from: 'i16', days: 5 } },
      { id: 'i3', name: '蜻蜓', desc: '河边的直升机。', fam: '虫', rar: 1, pow: 3, spd: 6, hp: 6, bait: ['bait'], where: 'riverbay', when: { p: [0, 1, 2, 3], we: ['小雨', '暴雨'] }, hint: '雨天的河面上低飞。' },
      { id: 'i4', name: '螳螂', desc: '举着大刀的武术家。', fam: '虫', rar: 2, pow: 6, spd: 4, hp: 9, bait: ['bait', 'peach'], where: 'backhill', when: { p: [0, 1, 2, 3], we: ['雾'] }, hint: '雾天的草叶上静候猎物。' },
      { id: 'i5', name: '蟋蟀', desc: '秋夜的琴师。', fam: '虫', rar: 1, pow: 5, spd: 3, hp: 7, bait: ['wheat'], where: 'fields', when: { p: [4, 5], se: ['autumn'] }, hint: '秋夜的田埂上拉琴。' },
      { id: 'i6', name: '萤火虫', desc: '提着灯笼找朋友。', fam: '虫', rar: 2, pow: 1, spd: 4, hp: 5, bait: ['peach'], where: 'riverbay', when: { p: [4, 5], se: ['summer'] }, hint: '夏夜的河湾亮起小灯。' },
      { id: 'i7', name: '天牛', desc: '触角比身体长。', fam: '虫', rar: 2, pow: 6, spd: 2, hp: 10, bait: ['peach'], where: 'backhill', when: { p: [0, 1, 2, 3], se: ['spring', 'summer'] }, hint: '春夏的树干上磨触角。' },
      { id: 'i8', name: '蚂蚁工兵', desc: '力气最大的小家伙。', fam: '虫', rar: 1, pow: 7, spd: 1, hp: 8, bait: ['cherry', 'sweetpotato'], where: 'homeYard', when: { p: [0, 1, 2, 3] }, hint: '墙根下排着队搬粮食。' },
      { id: 'i9', name: '蜜蜂', desc: '嗡嗡地踩着花心打转。', fam: '虫', rar: 1, pow: 3, spd: 5, hp: 7, bait: ['cherry', 'loquat'], where: 'orchard', when: { p: [0, 1, 2, 3], se: ['spring', 'summer'] }, hint: '果树开花时最忙。' },
      { id: 'i10', name: '蚱蜢', desc: '弹跳冠军，一蹦老远。', fam: '虫', rar: 1, pow: 4, spd: 6, hp: 7, bait: ['wheat'], where: 'fields', when: { p: [0, 1, 2, 3], se: ['summer'] }, hint: '夏天的麦茬地里弹射。' },
      { id: 'i11', name: '竹节虫', desc: '伪装成竹枝的隐身高手。', fam: '虫', rar: 2, pow: 4, spd: 2, hp: 9, bait: ['cherry'], where: 'hillside', when: { we: ['雾'] }, hint: '雾天的竹坡上，哪根竹枝会动？' },
      { id: 'i12', name: '蜗牛', desc: '背着小房子去旅行。', fam: '虫', rar: 1, pow: 1, spd: 1, hp: 8, bait: ['pea'], where: 'homeYard', when: { we: ['小雨', '暴雨'] }, hint: '雨后的墙角留下一道亮线。' },
      { id: 'i13', name: '独角仙', desc: '头顶长枪，甲壳发亮。', fam: '虫', rar: 2, pow: 7, spd: 3, hp: 11, bait: ['peach'], where: 'hillside', when: { p: [3, 4, 5], se: ['summer'] }, hint: '夏夜的树汁旁称王。' },
      { id: 'i14', name: '锹形虫', desc: '举着鹿角大夹的武士。', fam: '虫', rar: 2, pow: 6, spd: 4, hp: 10, bait: ['peach', 'grape'], where: 'hillside', when: { p: [3, 4, 5], se: ['summer'] }, hint: '和独角仙抢同一棵树。' },
      { id: 'i15', name: '纺织娘', desc: '夜里的纺织声沙沙作响。', fam: '虫', rar: 1, pow: 3, spd: 4, hp: 7, bait: ['wheat'], where: 'hillside', when: { p: [4, 5], se: ['autumn'] }, hint: '秋夜草坡上织月光。' },
      { id: 'i16', name: '毛毛虫', desc: '慢慢吃，慢慢长。', fam: '虫', rar: 1, pow: 1, spd: 1, hp: 6, bait: ['cherry'], where: 'orchard', when: { p: [0, 1, 2, 3], se: ['spring', 'summer'] }, hint: '果树叶子上啃出小月牙。', evolve: { to: 'i2', days: 5 } },
      { id: 'i17', name: '金龟子', desc: '绿甲壳在太阳下泛金属光。', fam: '虫', rar: 1, pow: 4, spd: 3, hp: 8, bait: ['peach', 'pear'], where: 'oldStreet', when: { p: [0, 1, 2, 3], se: ['summer'] }, hint: '老街的樟树上叮当作响。' },
      { id: 'i18', name: '月光凤蝶', desc: '翅膀上落着一弯月牙，见过的人很少。', fam: '虫', rar: 3, pow: 5, spd: 7, hp: 12, bait: ['moonGrass'], where: 'hiddenOutskirts', when: { p: [4, 5], we: ['小雨', '暴雨'] }, need: 25, hint: '雨夜的旧宅外墙，图鉴厚了它才肯现身。' },
      // —— 水系 ——
      { id: 'c1', name: '蝌蚪', desc: '圆脑袋小逗号，甩着尾巴。', fam: '水', rar: 1, pow: 1, spd: 3, hp: 5, bait: ['pea', 'bread'], where: 'park', when: { se: ['spring'] }, hint: '春天的池塘里成群游。', evolve: { to: 'c3', days: 7 } },
      { id: 'c2', name: '水黾', desc: '在水面上写滑冰舞步。', fam: '水', rar: 1, pow: 2, spd: 6, hp: 5, bait: ['bait'], where: 'park', when: { p: [0, 1, 2, 3], we: ['小雨', '暴雨'] }, hint: '雨点打皱的池塘面上滑行。' },
      { id: 'c3', name: '青蛙', desc: '呱呱呱，池塘合唱团主唱。', fam: '水', rar: 1, pow: 3, spd: 5, hp: 8, bait: ['bait'], where: 'park', when: {}, hint: '雨天的池塘总在开音乐会。' },
      { id: 'c4', name: '蟾蜍', desc: '疙疙瘩瘩，但眼神温柔。', fam: '水', rar: 1, pow: 3, spd: 2, hp: 9, bait: ['bait'], where: 'homeYard', when: { p: [4, 5] }, hint: '夜里的花园石阶下蹲着。' },
      { id: 'c5', name: '小螃蟹', desc: '横着走路，理直气壮。', fam: '水', rar: 1, pow: 4, spd: 4, hp: 8, bait: ['fish', 'bait'], where: 'riverbay', when: { p: [0, 1, 2, 3], se: ['summer'] }, hint: '夏天的河湾石滩吐泡泡。' },
      { id: 'c6', name: '乌龟', desc: '慢慢来，比较快。', fam: '水', rar: 2, pow: 3, spd: 1, hp: 12, bait: ['pea', 'bread'], where: 'riverbay', when: { we: ['晴'] }, hint: '晴天的钓台下晒背。' },
      { id: 'c7', name: '小虾', desc: '一弹一弹往后逃。', fam: '水', rar: 1, pow: 2, spd: 5, hp: 6, bait: ['bait'], where: 'riverbay', when: { se: ['summer'] }, hint: '夏天浅滩的水草间。' },
      { id: 'c8', name: '田螺', desc: '井台边的安静住户。', fam: '水', rar: 1, pow: 1, spd: 1, hp: 8, bait: ['pea'], where: 'homeYard', when: { we: ['小雨', '暴雨'] }, hint: '雨后的井台边冒头。' },
      { id: 'c9', name: '蝾螈', desc: '溪涧里的粉红小精灵。', fam: '水', rar: 2, pow: 4, spd: 4, hp: 9, bait: ['bait', 'egg'], where: 'hillside', when: { p: [4, 5] }, hint: '夜里的山涧石头缝。' },
      { id: 'c10', name: '小野鸭', desc: '排队跟在妈妈身后。', fam: '水', rar: 1, pow: 2, spd: 4, hp: 7, bait: ['bread'], where: 'riverbay', when: { se: ['autumn'] }, hint: '秋天的河湾一串小绒球。' },
      { id: 'c11', name: '水蜘蛛', desc: '带着气泡水底安家。', fam: '水', rar: 2, pow: 3, spd: 5, hp: 7, bait: ['bait'], where: 'park', when: { p: [4, 5] }, hint: '夜里池塘的水草间闪光。' },
      { id: 'c12', name: '锦鲤苗', desc: '红白花纹，像一截会游的霞。', fam: '水', rar: 3, pow: 4, spd: 5, hp: 12, bait: ['bread'], where: 'riverbay', when: { we: ['小雨', '暴雨'] }, need: 15, hint: '雨天老桥下的深水一闪——图鉴攒够 15 种再来。' },
      // —— 走兽系 ——
      { id: 'm1', name: '松鼠', desc: '尾巴比身子大，腮帮塞满果。', fam: '兽', rar: 1, pow: 3, spd: 6, hp: 8, bait: ['peach', 'cherry'], where: 'oldStreet', when: { p: [0, 1, 2, 3] }, hint: '老街樟树上蹿来蹿去。' },
      { id: 'm2', name: '野兔', desc: '耳朵一动，人就看不见它了。', fam: '兽', rar: 1, pow: 3, spd: 7, hp: 8, bait: ['wheat', 'pea'], where: 'fields', when: { p: [0] }, hint: '清晨的田垄间一闪而过。' },
      { id: 'm3', name: '田鼠', desc: '口袋里装满麦粒的小财迷。', fam: '兽', rar: 1, pow: 2, spd: 5, hp: 7, bait: ['wheat', 'sweetpotato'], where: 'farmstead', when: { p: [3] }, hint: '黄昏的晒谷场边打洞。' },
      { id: 'm4', name: '刺猬', desc: '一紧张就把自己变成球。', fam: '兽', rar: 2, pow: 4, spd: 2, hp: 11, bait: ['peach', 'strawberry'], where: 'orchard', when: { p: [4, 5] }, hint: '夜里溜进果园吃落果。' },
      { id: 'm5', name: '蝙蝠', desc: '倒挂着睡，倒挂着醒。', fam: '兽', rar: 1, pow: 3, spd: 6, hp: 6, bait: ['peach'], where: 'hillside', when: { p: [4, 5] }, hint: '夜里矿道口扑棱棱飞。' },
      { id: 'm6', name: '黄鼬', desc: '鸡舍旁的传说，偷蛋高手。', fam: '兽', rar: 2, pow: 5, spd: 6, hp: 9, bait: ['egg'], where: 'farmstead', when: { p: [4, 5] }, hint: '鸡舍丢了蛋的夜晚，就是它来过。' },
      { id: 'm7', name: '小麻雀', desc: '蹦蹦跳跳，叽叽喳喳。', fam: '兽', rar: 1, pow: 2, spd: 5, hp: 6, bait: ['bread'], where: 'seasonPlaza', when: { p: [0, 1, 2, 3] }, hint: '广场上蹦着啄食。' },
      { id: 'm8', name: '燕子', desc: '剪刀尾巴裁春风。', fam: '兽', rar: 1, pow: 2, spd: 7, hp: 6, bait: ['bread'], where: 'transportHub', when: { se: ['spring', 'summer'] }, hint: '春夏在站台屋檐下筑巢。' },
      { id: 'm9', name: '三花猫', desc: '后巷的女王，爱答不理。', fam: '兽', rar: 2, pow: 4, spd: 6, hp: 9, bait: ['fish'], where: 'oldStreet', when: { p: [4, 5] }, hint: '夜里商店街后巷巡领地。' },
      { id: 'm10', name: '幼鹿', desc: '梅花点点，眼睛像清晨。', fam: '兽', rar: 2, pow: 4, spd: 7, hp: 10, bait: ['peach', 'pear'], where: 'hillside', when: { p: [0] }, need: 20, hint: '清晨薄雾里的山脚——图鉴攒够 20 种才有缘。' },
      { id: 'm11', name: '白鼬', desc: '雪地上一道白影子。', fam: '兽', rar: 2, pow: 5, spd: 7, hp: 9, bait: ['egg'], where: 'hillside', when: { se: ['winter'] }, hint: '落雪后的山脚雪窝边。' },
      { id: 'm12', name: '山神小狐狸', desc: '尾巴尖挑着一粒月光，看见它的人会有好运。', fam: '兽', rar: 3, pow: 6, spd: 8, hp: 13, bait: ['sevenFlower'], where: 'hillside', when: { p: [5], we: ['晴'] }, need: 30, hint: '月圆深夜的山径尽头——图鉴攒够 30 种，七色花为礼。' }
    ],
    /* —— 百果园：果园四季果树（season=成熟季节，item=摘下进背包的物品） —— */
    fruits: [
      { id: 'f1', name: '枇杷', desc: '春天尾巴上的头一茬甜。', season: 'spring', item: 'loquat' },
      { id: 'f2', name: '樱桃', desc: '一掐一对小红灯笼。', season: 'spring', item: 'cherry' },
      { id: 'f3', name: '桃子', desc: '毛茸茸的，咬一口甜到耳朵尖。', season: 'summer', item: 'peach' },
      { id: 'f4', name: '葡萄', desc: '一串紫玛瑙。', season: 'summer', item: 'grape' },
      { id: 'f5', name: '梨', desc: '汁水顺着手腕流。', season: 'autumn', item: 'pear' },
      { id: 'f6', name: '柿子', desc: '树上挂满小太阳。', season: 'autumn', item: 'persimmon' },
      { id: 'f7', name: '柚子', desc: '抱在怀里像个小星球。', season: 'winter', item: 'pomelo' },
      { id: 'f8', name: '拐枣', desc: '霜打之后才甜的歪歪扭扭。', season: 'winter', item: 'raistree' }
    ],
    photos: [
      { id: 'p_sports', name: '运动会合影', desc: '乌云帮和你并肩冲刺。' },
      { id: 'p_wuyun', name: '天台的黄昏', desc: '四个人影和一片橘子色的天。' },
      { id: 'p_stone', name: '石门开启之夜', desc: '雷雨中，四枚徽章发光。' },
      { id: 'p_altar', name: '祭坛亮起', desc: '守门人第一次笑了。' },
      { id: 'p_star', name: '星儿与阿星', desc: '星之庭园的第一张照片。' },
      { id: 'p_sort', name: '分院那一刻', desc: '归类帽喊出了你的选择。' },
      { id: 'p_dog', name: '睡着的旺福', desc: '三个脑袋一起打呼噜。' },
      { id: 'p_mirror', name: '心愿之镜', desc: '镜子里是微笑的你。' },
      { id: 'p_cup', name: '学院杯之夜', desc: '大厅的灯全亮了。' },
      { id: 'p_dig', name: '挖到大宝藏', desc: '金灿灿的一箱。' },
      { id: 'p_bread', name: '分你一半', desc: '小胖流泪吃面包的样子。' },
      { id: 'p_ticket', name: '电影夜票根', desc: '周日傍晚，幕布亮起来时的那张纪念。' },
      { id: 'p_townlife', name: '东南街区拼贴', desc: '店招、桥灯、巷口和站台，被你拍成了一册生活相。' },
      { id: 'p_rural', name: '郊外探险册页', desc: '风车田、鸭塘、萤火谷和旧宅，把郊外装进了一页纸。' },
      { id: 'p_grad', name: '毕业礼大合影', desc: '所有人都在，一个不少。' },
      { id: 'p_sakura', name: '樱花下的班级', desc: '花瓣落在每个人的肩上。' },
      /* —— P-B 期新增：微剧情二号线 / 晨曦祭坛 / 心级事件 —— */
      { id: 'p_run', name: '跑道边的击掌', desc: '风一样的人也愿意为你慢下来。' },
      { id: 'p_rain', name: '屋檐下的共读', desc: '雨声、书页和一句很小声的谢谢。' },
      { id: 'p_record', name: '打破纪录的秒表', desc: '数字停下的那一秒，他喊得比谁都响。' },
      { id: 'p_dawn', name: '晨曦祭坛之光', desc: '圣物认出了你——四季与晨昏从此都有名字。' },
      { id: 'p_hearts', name: '心语纪念册', desc: '六页真心话，一张大合照。' },
      /* —— 玩法批次二：学科奥赛 —— */
      { id: 'p_olymp', name: '奥赛领奖台', desc: '聚光灯下的你——奖状比想象中沉。' }
    ],
    wishes: [
      { id: 'w1', name: '小明的愿望', desc: '「画一部让人哭着笑的漫画。」' },
      { id: 'w2', name: '小红的愿望', desc: '「妈妈的检查单上全是正常。」' },
      { id: 'w3', name: '小刚的愿望', desc: '「在琴声里赢哥哥一次。」' },
      { id: 'w4', name: '小胖的愿望', desc: '「写出全城最火的食评。」' },
      { id: 'w5', name: '乌云的愿望', desc: '「堂堂正正地，再喊一次及格。」' },
      { id: 'w6', name: '大壮的愿望', desc: '「把爸的修车铺开成连锁。」' },
      { id: 'w7', name: '小影的愿望', desc: '「这次的画册，画满再走。」' },
      { id: 'w8', name: '金鹏的愿望', desc: '「下一次，靠自己赢。」' },
      { id: 'w9', name: '墨墨的愿望', desc: '「调配出让人幸福的药。」' },
      { id: 'w10', name: '妈妈的愿望', desc: '「孩子平安，慢慢长大。」' }
    ],
    cards: [
      { id: 'c1', name: '陀螺王', desc: '一鞭子抽下去能转到放学。', star: 2 },
      { id: 'c2', name: '玻璃弹珠', desc: '阳光底下像一颗小星球。', star: 2 },
      { id: 'c3', name: '铁皮青蛙', desc: '拧紧发条就呱呱跳个不停。', star: 2 },
      { id: 'c4', name: '花绳·降落伞', desc: '两根手指翻出来的夏天。', star: 1 },
      { id: 'c5', name: '纸飞机·冲天猴', desc: '哈一口气，飞得更高。', star: 1 },
      { id: 'c6', name: '沙包', desc: '奶奶用碎布缝的，装着绿豆。', star: 1 },
      { id: 'c7', name: '竹蜻蜓', desc: '搓一搓就飞上屋顶，再也找不回来。', star: 1 },
      { id: 'c8', name: '万花筒', desc: '转一下，就是一朵新雪花。', star: 2 },
      { id: 'c9', name: '弹弓', desc: '瞄准的是树上的知了壳。', star: 2 },
      { id: 'c10', name: '洋画片', desc: '拍得手心通红才肯换一张。', star: 2 },
      { id: 'c11', name: '闪卡·雪怪', desc: '冬天限定的传说闪卡，会反光。', star: 3 },
      { id: 'c12', name: '满勤徽章', desc: '广播体操全勤的荣誉证明。', star: 3 }
    ],
    scenes: [
      { id: 's1', name: '喷泉晨光', desc: '水珠里藏着一道小彩虹。' },
      { id: 's2', name: '操场晚霞', desc: '跑道被染成了蜜色。' },
      { id: 's3', name: '钟楼一角', desc: '指针停在最好的下午。' },
      { id: 's4', name: '河畔柳影', desc: '柳条蘸着水面写字。' },
      { id: 's5', name: '商店街灯火', desc: '收摊前最暖的一盏灯。' },
      { id: 's6', name: '小镇黄昏', desc: '回家的人拖长影子。' },
      { id: 's7', name: '琴房的琴', desc: '黑白键上落了点夕阳。' },
      { id: 's8', name: '书架长廊', desc: '书脊排成一道彩虹。' },
      { id: 's9', name: '天台星空', desc: '整条银河横在头顶。' },
      { id: 's10', name: '镜筒里的月亮', desc: '环形山清晰可见。' },
      { id: 's11', name: '院子的花', desc: '妈妈种的那株开了。' },
      { id: 's12', name: '星之泉', desc: '泉水里泡着一整片天。' },
      { id: 's13', name: '照相馆橱窗', desc: '玻璃里映着整条东南街口。' },
      { id: 's14', name: '老桥河湾', desc: '桥影压在河心，灯串顺着晚风晃。' },
      { id: 's15', name: '老街巷口', desc: '店幌和晾衣绳把日子拉得很长。' },
      { id: 's16', name: '旧车站月台', desc: '风吹过长椅，像一班很慢的车。' },
      { id: 's17', name: '四时广场', desc: '庙会旗、谷场和影幕站在同一个季节里。' },
      { id: 's18', name: '风车田', desc: '田垄尽头，风一直推着风车走。' },
      { id: 's19', name: '萤火谷', desc: '一盏一盏小灯，在草坡下练习发光。' },
      { id: 's20', name: '旧宅外墙', desc: '褪色的墙皮像一页没念完的故事。' },
      { id: 's21', name: '竹坡新篁', desc: '坡上的竹子一天一个高度。' },
      { id: 's22', name: '老桥倒影', desc: '桥把自己画进河里，比你画得还像。' },
      { id: 's23', name: '果香满园', desc: '风一吹，整园子都是甜的。' },
      { id: 's24', name: '四时旗风', desc: '旗子换了四季，广场还是那个广场。' }
    ]
  };
  const CATS = [
    ['books', '书籍', '📖'], ['quotes', '名句', '📜'], ['leaves', '落叶', '🍂'],
    ['fruits', '百果园', '🍑'], ['fish', '渔获', '🐟'], ['photos', '回忆照片', '📷'], ['wishes', '心愿集', '🏮'],
    ['cards', '童年卡', '🎴'], ['scenes', '风景相册', '📸']
  ];
  /* 生物图鉴 42 种不在图鉴总览网格里铺开（太长），走手册独立「生物」页；
   * 存储键沿用 col().insects（旧存档/旧测试重置逻辑兼容），catKey 做映射 */
  DB.insects = DB.critters.filter(c => c.fam === '虫');       // 斗虫擂台沿用「虫系 18」池
  const CAT_MAP = { critters: 'insects' };                    // 图鉴键映射：critters 读写 insects 槽
  const catKey = c => CAT_MAP[c] || c;

  /* ---------- 物品（礼物 / 战斗道具 / 关键物） ---------- */
  const ITEMS = {
    bread:  { name: '甜面包', gift: true, battle: true, heal: 16, price: 15, desc: '香甜松软，小胖最爱。' },
    juice:  { name: '运动饮料', gift: true, battle: true, heal: 28, price: 12, desc: '跑完十圈来一瓶。' },
    snack:  { name: '辣条', gift: true, battle: false, price: 5, desc: '课间限定美味。' },
    flower: { name: '花束', gift: true, battle: false, price: 12, desc: '春天限定的浪漫。' },
    poem:   { name: '诗集', gift: true, battle: false, price: 25, desc: '文艺青年标配。' },
    comic:  { name: '《冒险王》', gift: true, battle: false, price: 30, desc: '小明的命根子。' },
    ballcard: { name: '球星卡', gift: true, battle: false, price: 20, desc: '限量绝版闪卡。' },
    ribbon: { name: '幸运发绳', gift: true, battle: false, price: 18, desc: '小红同款。' },
    pencil: { name: '自动铅笔', gift: true, battle: false, price: 8, desc: '考试利器。' },
    sketch: { name: '画画本', gift: true, battle: false, price: 22, desc: '小影看了会两眼放光。' },
    coffee: { name: '热咖啡', gift: true, battle: false, price: 16, desc: '给熬夜的大人。' },
    bait:   { name: '蚯蚓', gift: false, battle: false, price: 3, desc: '挖来的鱼饵，钓鱼时挂上它更容易上钩。' },
    fish:   { name: '鲜鱼', gift: true, battle: false, price: 0, desc: '刚钓上来的。可以卖钱、喂猫，或交给食堂阿姨。' },
    grilledFish: { name: '红烧鱼', gift: true, battle: true, heal: 40, price: 0, desc: '食堂阿姨的手艺，香气扑鼻。' },
    shovel: { name: '小铲子', gift: false, battle: false, price: 50, desc: '挖宝必备。' },
    bugNet: { name: '捉虫网', gift: false, battle: false, price: 45, desc: '竹柄纱网。对虫鸣的草丛挥网，捕虫又快又稳。' },
    fishingRod: { name: '鱼竿', gift: false, battle: false, price: 35, desc: '河边垂钓，每日三竿。' },
    /* —— 星露谷式农具（工具热键栏装备，对面前的目标按 Z 快捷执行） —— */
    hoe:         { name: '锄头', gift: false, battle: false, price: 40, desc: '开垦荒草地的家伙。装备后对着荒地按 Z，直接翻土。' },
    wateringCan: { name: '洒水壶', gift: false, battle: false, price: 40, desc: '浇灌作物的小水壶。装备后对着作物按 Z，直接浇水。' },
    scythe:      { name: '镰刀', gift: false, battle: false, price: 45, desc: '刃口锋利的小镰刀。（农具，更多用途敬请期待）' },
    pickaxe:     { name: '镐头', gift: false, battle: false, price: 60, desc: '敲矿脉更趁手。装备后对着矿脉按 Z，直接开采。' },
    axe:         { name: '斧头', gift: false, battle: false, price: 70, desc: '沉甸甸的短柄斧。（农具，更多用途敬请期待）' },
    sprinkler:   { name: '洒水器', gift: false, battle: false, price: 70, desc: '架在田头的自动喷水装置。放在土垄上，每天清晨替你浇水。' },
    fertilizer:  { name: '肥料', gift: false, battle: false, price: 25, desc: '油乎乎的好肥料。撒在土垄上，收获时可能多结一颗果实。' },
    scarecrowKit:{ name: '稻草人工具包', gift: false, battle: false, price: 55, desc: '新草帽和结实的草绳。走近旧稻草人按 Z，把它翻新得威风凛凛。' },
    flowerSeed: { name: '花种子', gift: false, battle: false, price: 8, desc: '种在花盆里，三天开花。' },
    moonSeed: { name: '月光草种子', gift: false, battle: false, price: 0, desc: '陈老师培育的稀有种子。' },
    moonGrass: { name: '月光草', gift: true, battle: true, heal: 34, price: 0, desc: '战斗中回复大量体力。' },
    sheKey: { name: '社团旧钥匙', gift: false, battle: false, price: 0, desc: '探险社社办的钥匙。' },
    clubFlag: { name: '探险社社旗', gift: false, battle: false, price: 0, desc: '褪色但依然挺括。' },
    sevenFlower: { name: '七色花', gift: true, battle: false, price: 0, desc: '四季守护灵的谢礼。' },
    watch:  { name: '学者的旧怀表', gift: true, battle: false, price: 0, desc: '滴答声里有故事。' },
    gear:   { name: '自行车齿轮', gift: false, battle: false, price: 0, desc: '大壮修车用的零件。' },
    album:  { name: '被没收的画册', gift: false, battle: false, price: 0, desc: '教务处保管的宝贝。' },
    scrap:  { name: '埋宝图残页', gift: false, battle: false, price: 0, desc: '乌云画的，标记了全校宝藏。' },
    camera: { name: '照相机', gift: false, battle: false, price: 60, desc: '记录校园的每个角落。' },
    cape: { name: '武斗大会披风', gift: false, battle: false, price: 0, desc: '冠军的证明，披上攻击+3。' },
    r1: { name: '阳光蛋包饭', gift: true, battle: true, heal: 32, price: 0, desc: '阿姨的招牌，金黄的一勺。（吃：🍖精力充沛）' },
    r2: { name: '糖醋排骨饭', gift: true, battle: true, heal: 36, price: 0, desc: '酸甜适口，干饭人狂喜。（吃：🍖精力充沛）' },
    r3: { name: '星星曲奇', gift: true, battle: true, heal: 28, price: 0, desc: '星儿烤的，咬开是星空。（吃：👟健步如飞）' },
    r4: { name: '月光羹', gift: true, battle: true, heal: 40, price: 0, desc: '月见校长的私房甜汤。（吃：🧠好记性）' },
    r5: { name: '矿工炖菜', gift: true, battle: true, heal: 44, price: 0, desc: '老矿工的硬核暖锅。（吃：🍖精力充沛）' },
    r6: { name: '四季春卷', gift: true, battle: true, heal: 50, price: 0, desc: '包住一年四季的滋味。（吃：👟健步如飞）' },
    r7: { name: '田园时蔬汤', gift: true, battle: true, heal: 46, price: 0, desc: '自家园子的菜一锅鲜，妈妈都夸好。（吃：🧠好记性）' },
    r8: { name: '丰收南瓜派', gift: true, battle: true, heal: 42, price: 0, desc: '金黄的派皮里包着整个秋天。（吃：👟健步如飞）' },
    r9: { name: '炭火烤鱼', gift: true, battle: true, heal: 48, price: 0, desc: '矿洞炭火烤的鱼，配烤红薯。（吃：🧠好记性）' },
    /* —— 寻宝迷宫奖励池 —— */
    mapFrag: { name: '洞窟残页', gift: false, battle: false, price: 0, desc: '古老藏宝图的一角，字迹已经模糊。' },
    moonCrystal: { name: '月光结晶', gift: true, battle: true, heal: 60, price: 0, desc: '黑暗中微微发光，蕴含月之力。' },
    ancientCoin: { name: '古代钱币', gift: false, battle: false, price: 80, desc: '洞窟深处的古币，能卖个好价钱。' },
    seasonSeed: { name: '四时花种', gift: false, battle: false, price: 0, desc: '会随季节变换颜色的神奇种子。' },
    seasonFlower: { name: '四时花', gift: true, battle: false, price: 0, desc: '春夏秋冬在同一朵花上流转。' },
    treasureCompass: { name: '寻宝罗盘', gift: false, battle: false, price: 0, desc: '指针似乎总指向还没打开的宝箱。' },
    /* —— 后院农场 —— */
    strawberry: { name: '草莓', gift: true, battle: true, heal: 12, price: 15, desc: '自己种的，甜过买的。' },
    pea: { name: '甜豌豆', gift: true, battle: true, heal: 10, price: 10, desc: '荚里排着小绿珠子。' },
    watermelon: { name: '西瓜', gift: true, battle: true, heal: 30, price: 30, desc: '夏天就该抱半个瓜用勺挖。' },
    tomato: { name: '番茄', gift: true, battle: true, heal: 14, price: 18, desc: '一掐就爆汁的熟番茄。' },
    sweetpotato: { name: '红薯', gift: true, battle: true, heal: 22, price: 20, desc: '埋在土里的甜心，烤着吃最香。' },
    pumpkin: { name: '南瓜', gift: true, battle: true, heal: 26, price: 25, desc: '圆滚滚的，妈妈能做一桌南瓜菜。' },
    egg: { name: '鸡蛋', gift: true, battle: true, heal: 10, price: 8, desc: '小鸡刚下的，还温着。' },
    goldenEgg: { name: '金鸡蛋', gift: true, battle: false, price: 60, desc: '金灿灿沉甸甸——咕咕对你的爱的证明。' },
    wheat: { name: '小麦', gift: false, battle: false, price: 5, desc: '一把金灿灿的麦穗，咕咕的最爱。' },
    /* —— 百果园 · 果园鲜果（可吃可送可卖，按季节在果园摘到） —— */
    loquat:    { name: '枇杷', gift: true, battle: true, heal: 10, price: 10, desc: '剥了皮就流蜜水。' },
    cherry:    { name: '樱桃', gift: true, battle: true, heal: 8,  price: 12, desc: '一对小红灯笼。' },
    peach:     { name: '桃子', gift: true, battle: true, heal: 16, price: 16, desc: '咬一口甜到耳朵尖。' },
    grape:     { name: '葡萄', gift: true, battle: true, heal: 12, price: 14, desc: '紫玛瑙一串，冰过更好吃。' },
    pear:      { name: '梨', gift: true, battle: true, heal: 15, price: 13, desc: '汁水顺着手腕流。' },
    persimmon: { name: '柿子', gift: true, battle: true, heal: 14, price: 12, desc: '软乎乎的小太阳。' },
    pomelo:    { name: '柚子', gift: true, battle: true, heal: 20, price: 18, desc: '厚皮大果，剥开满手清香。' },
    raistree:  { name: '拐枣', gift: true, battle: true, heal: 10, price: 9, desc: '霜打之后才甜的歪歪扭扭。' },
    /* —— 矿道矿石（越深越值钱，可以卖钱） —— */
    copperOre: { name: '铜矿石', gift: false, battle: false, price: 14, desc: '橙红色矿脉，敲下来还带着地心的温度。' },
    ironOre: { name: '铁矿石', gift: false, battle: false, price: 28, desc: '灰亮沉手的矿块，敲起来当当作响。' },
    goldOre: { name: '金矿石', gift: false, battle: false, price: 60, desc: '岩缝里漏出金光——发财了！' },
    gemStone: { name: '晶石', gift: true, battle: false, price: 120, desc: '通透的小晶体，光下一闪一闪。' },
    /* —— 后院农场 · 种子（按季节在田伯处购买） —— */
    seedStraw:  { name: '草莓种子',  gift: false, battle: false, price: 6,  desc: '春天种下，三天结果。' },
    seedPea:    { name: '甜豌豆种子', gift: false, battle: false, price: 4,  desc: '春天种下，藤蔓爬得快。' },
    seedMelon:  { name: '西瓜种子',  gift: false, battle: false, price: 10, desc: '夏天种下，能长出大西瓜。' },
    seedTomato: { name: '番茄种子',  gift: false, battle: false, price: 8,  desc: '夏天种下，一掐就爆汁。' },
    seedPotato: { name: '红薯种子',  gift: false, battle: false, price: 8,  desc: '秋天种下，埋土里的甜心。' },
    seedPumpkin:{ name: '南瓜种子',  gift: false, battle: false, price: 10, desc: '秋天种下，圆滚滚的大南瓜。' },
    /* —— 野外遭遇：宠物球（草丛惊动野生小伙伴后丢球收服） —— */
    critBall:  { name: '树叶球', gift: false, battle: false, price: 20,  desc: '阔叶卷成的小球，藤一勒就收紧。草丛遭遇时丢出去，运气好能收服野生小伙伴。' },
    goodBall:  { name: '藤编好球', gift: false, battle: false, price: 60,  desc: '双股藤编得密结实沉，勒得住大个头。（收服率 +15%）' },
    ultraBall: { name: '月光宝球', gift: false, battle: false, price: 150, desc: '球绳浸过月光草汁，夜里泛着微光。（收服率 +30%）' },
    petFood:   { name: '精灵口粮', gift: false, battle: false, pet: true, price: 25, desc: '营养均衡的香脆颗粒。宠物对战中喂给自己伙伴，体力全恢复。' },
    /* —— 生物收集：草编笼（水系/走兽用，虫用捉虫网） —— */
    basket: { name: '草编笼', gift: false, battle: false, price: 35, desc: '透气的小竹笼。对水边和小兽的窝点下笼，又轻又稳。' },
    /* —— 生物收集：捕捉工具升级链（网管虫鸣/虫系，笼管窝点水·兽；同链取最高档生效） —— */
    fineNet:   { name: '细纱好网', gift: false, battle: false, price: 150, desc: '网眼细得像晨雾，虫子再也钻不出去。（虫鸣命中 90% · 窝捕捉 +10% · 异色 ×2）' },
    goldNet:   { name: '金丝宝网', gift: false, battle: false, price: 500, desc: '网柄缠着金线的传说渔网，月光下微微发亮。（虫鸣必中 · 窝捕捉 +20% · 异色 ×3）' },
    bigCage:   { name: '双层大笼', gift: false, battle: false, price: 150, desc: '宽敞透气的双层竹笼，小家伙住得舒坦就不想逃。（捕捉率 +10% · 异色 ×2）' },
    colorCage: { name: '彩漆幸运笼', gift: false, battle: false, price: 500, desc: '涂了彩虹漆的幸运笼，据说会引来金色好运。（捕捉率 +20% · 异色 ×3）' },
    /* —— 老师作业奖励图册 —— */
    albumBug: { name: '昆虫图册', gift: true, battle: false, price: 0, desc: '陈老师手绘的虫类观察手册，翻开满是鳞粉与笔记。' },
    albumCritter: { name: '小动物图册', gift: true, battle: false, price: 0, desc: '贴满猫狗雀鼠照片的画册，每一页都毛茸茸的。' },
    /* —— s5 畜牧扩展：牲口与出产 —— */
    calf: { name: '小牛犊', gift: false, battle: false, price: 120, desc: '田伯家刚断奶的小黑白花。抱回后院牛棚，每天都能挤到新鲜牛奶。' },
    lamb: { name: '小羊羔', gift: false, battle: false, price: 100, desc: '咩咩叫着蹭你裤腿的小绒球。抱回后院羊圈，隔几天就能剪一次羊毛。' },
    milk: { name: '鲜牛奶', gift: true, battle: false, price: 18, desc: '还带着体温的牛奶，喝一口从喉咙暖到脚尖。妈妈和食堂阿姨都稀罕。' },
    wool: { name: '柔软羊毛', gift: false, battle: false, price: 26, desc: '刚剪下来的羊毛，蓬得像一朵云。裁缝阿姨见了眼睛发亮。' }
  };

  function col() { const F = ADV.Game.flags; return F.col || (F.col = {}); }
  function items() { const F = ADV.Game.flags; return F.items || (F.items = {}); }

  function has(cat, id) { const k = catKey(cat); const c = col()[k]; return !!(c && c[id]); }
  function gain(cat, id) {
    const k = catKey(cat);
    if (has(cat, id)) return false;
    const c = col(); (c[k] || (c[k] = {}))[id] = true;
    const info = DB[cat] && DB[cat].find(x => x.id === id);
    if (info) ADV.UI.toast(` 收藏入手：${info.name} `);
    checkFull(cat);
    if (cat === 'leaves') checkLeafMiles();
    ADV.Game.save();
    return true;
  }
  function checkFull(cat) {
    const k = catKey(cat);
    const list = DB[cat];
    const c = col()[k] || {};
    if (list.every(x => c[x.id])) {
      const F = ADV.Game.flags;
      const reward = { books: 50, quotes: 40, leaves: 30, fruits: 40, insects: 30, critters: 120, fish: 60, photos: 100, cards: 80, wishes: 120, scenes: 60 }[k] || 0;
      const label = k === 'insects' ? '虫系图鉴' : (CATS.find(c2 => c2[0] === cat) || [])[1] || '生物';
      F.gold = (F.gold || 0) + reward;
      ADV.UI.toast(` 🏆 「${label}」收集完成！金币 +${reward} `);
    }
  }
  function info(cat, id) { return DB[cat] && DB[cat].find(x => x.id === id); }
  function ids(cat) { const k = catKey(cat); const c = col()[k] || {}; return DB[cat].filter(x => c[x.id]).map(x => x.id); }
  function catCount(cat) { return ids(cat).length; }
  function totalOf(cat) { return DB[cat].length; }
  function progress() {   // 全收藏总进度（生物图鉴 42 种单独并入，虫系是它的子集不重复计）
    let got = 0, total = 0;
    CATS.forEach(c => { got += catCount(c[0]); total += totalOf(c[0]); });   // CATS 项为 [cat, label, icon]
    got += catCount('critters'); total += totalOf('critters');
    return { got, total };
  }

  /* ---------- 背包 ---------- */
  function addItem(id, n) { const it = items(); it[id] = (it[id] || 0) + (n || 1); ADV.Game.save(); }
  function useItem(id, n) { const it = items(); if (!it[id]) return false; it[id] -= (n || 1); if (it[id] <= 0) delete it[id]; ADV.Game.save(); return true; }
  function count(id) { return items()[id] || 0; }
  function giftables() { return Object.keys(ITEMS).filter(k => ITEMS[k].gift && count(k) > 0).map(k => ({ id: k, ...ITEMS[k] })); }
  function bagList() { return Object.keys(items()).filter(k => items()[k] > 0).map(k => ({ id: k, n: items()[k], ...ITEMS[k] })); }
  function itemInfo(id) { return ITEMS[id]; }

  /* ---------- 送礼（偏好判定在 game.js BOND_META.likes/hate） ---------- */
  const DISHES = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9'];   // 自制料理清单（家常心意加成判定用）
  function give(npcId, itemId) {
    const meta = (ADV.Game.BOND_META || {})[npcId];
    if (!meta) return 0;
    if (!useItem(itemId)) return 0;
    const it = ITEMS[itemId];
    let delta, line;
    const isBday = ADV.Cal && ADV.Game.BOND_META[npcId].bday === ADV.Cal.day;
    if ((meta.likes || []).includes(itemId)) {
      // 自制料理命中偏好 → 家常心意额外加成（16，生日 28）
      const dish = DISHES.includes(itemId);
      delta = isBday ? (dish ? 28 : 24) : (dish ? 16 : 12);
      line = `「${it.name}！你怎么知道我喜欢这个！」${dish ? '\n（亲手做的热乎菜，心意加倍！）' : ''}${isBday ? '\n（生日送礼，好感翻倍！）' : ''}`;
    } else if ((meta.hate || []).includes(itemId)) {
      delta = -8;
      line = `「……${it.name}？你对我有什么误会吗。」`;
    } else {
      delta = isBday ? 10 : 5;
      line = `「${it.name}？谢谢啦，还挺用心的。」`;
    }
    ADV.Game.gainBond(npcId, delta);
    // 闲话系统：送礼之事会传开（2 天内其他 NPC 可能提起）
    try {
      const F = ADV.Game.flags;
      if (delta > 0) {
        F.gossip = F.gossip || [];
        F.gossip.push({ day: ADV.Cal.day, to: npcId, item: itemId });
        if (F.gossip.length > 8) F.gossip.shift();
      }
    } catch (e) { /* 忽略 */ }
    return { delta, line };
  }

  /* ---------- 生物出现条件（时段/季节/天气） ----------
   * 42 种 critters 用 when:{p:[时段],se:[季节],we:[天气]}，缺省=全天候；
   * 旧 i1-i8 的 INSECT_WHEN 规则已并入 critters 表，仅作兜底 */
  const INSECT_WHEN = { i1: 'd', i2: 'sd', i3: 'rd', i4: 'fd', i5: 'an', i6: 'sn', i7: 'sd', i8: 'd' };
  function whenOk(id) {
    const c = ADV.Cal;
    if (!c) return true;
    const cr = DB.critters.find(x => x.id === id);
    if (cr) {
      const w = cr.when || {};
      if (w.p && !w.p.includes(c.period)) return false;
      if (w.se && !w.se.includes(c.seasonEn())) return false;
      if (w.we && !w.we.includes(c.weather)) return false;
      return true;
    }
    const w = c.weather, p = c.period, s = c.seasonEn();
    const day = p < 4, night = p >= 4;
    switch (INSECT_WHEN[id]) {
      case 'd': return day;
      case 'sd': return day && (s === 'spring' || s === 'summer');
      case 'rd': return day && (w === '小雨' || w === '暴雨');
      case 'fd': return day && w === '雾';
      case 'an': return night && s === 'autumn';
      case 'sn': return night && s === 'summer';
      default: return true;
    }
  }

  /* ---------- 生物图鉴专用 API ---------- */
  function critter(id) { return DB.critters.find(x => x.id === id); }
  function critterList(fam) { return fam ? DB.critters.filter(c => c.fam === fam) : DB.critters; }
  function needOk(cr) { return !cr.need || catCount('critters') >= cr.need; }   // 图鉴进度解锁（传说）
  /* 金色异色个体：基础 5% 概率，可被捕捉工具放大；登记条目为 {s:1}，普通为 true */
  const SHINY_RATE = 0.05;
  function rollShiny(mult) { return Math.random() < SHINY_RATE * (mult || 1); }
  /* —— 捕捉工具档位：网管虫鸣/虫系，笼管窝点；同链取最高档 —— */
  function netTier()  { return count('goldNet') ? 2 : count('fineNet') ? 1 : count('bugNet') ? 0 : -1; }
  function cageTier() { return count('colorCage') ? 2 : count('bigCage') ? 1 : count('basket') ? 0 : -1; }
  /* 异色倍率：网档 1/×2/×3，笼档 1/×2/×3，两链都持取更高者 */
  function shinyMult() {
    const n = netTier(), c = cageTier();
    const nm = n < 0 ? 1 : [1, 2, 3][n], cm = c < 0 ? 1 : [1, 2, 3][c];
    return Math.max(nm, cm);
  }
  function isShiny(cat, id) {
    const e = (col()[catKey(cat)] || {})[id];
    return !!e && typeof e === 'object' && !!e.s;
  }
  function gainCritter(id, shiny) {
    const k = col()['insects'] || (col()['insects'] = {});
    if (k[id]) return false;
    k[id] = { s: shiny ? 1 : 0, d: ADV.Cal ? ADV.Cal.day : 0 };   // s=异色位 d=入手日（饲养计时起点）
    const cr = critter(id);
    ADV.UI.toast(shiny ? ` ✨ 金色异色个体！${cr ? cr.name : id} 入手！ ` : ` 收藏入手：${cr ? cr.name : id} `);
    if (cr && cr.evolve) ADV.UI.toast(` （把它放进院子水缸养着，${cr.evolve.days} 天后也许会有变化……） `);
    checkCritterMiles();
    checkFull('critters');
    ADV.Game.save();
    return true;
  }
  /* —— 图鉴阶梯奖励闭环：收录数里程碑（10/20/30/40 只）发金币 + 称号，
   *    传说三只集齐另有大奖；称号同时记入成长大事记 —— */
  const CRIT_MILES = [
    [10, 20, '初级观察员'], [20, 30, '田野研究员'], [30, 40, '生态学者'], [40, 50, '图鉴大师'],
  ];
  function checkCritterMiles() {
    const F = ADV.Game.flags, n = catCount('critters');
    F.critMiles = F.critMiles || {};
    for (const [num, gold, title] of CRIT_MILES) {
      if (n >= num && !F.critMiles[num]) {
        F.critMiles[num] = true;
        F.gold = (F.gold || 0) + gold;
        ADV.UI.toast(` 📖 生物图鉴收录 ${num} 种！获得称号「${title}」· 金币 +${gold} `);
        if (ADV.Growth) ADV.Growth.milestone(`📖 图鉴收录 ${num} 种，获得称号「${title}」`);
      }
    }
    if (!F.legendTrio && ['i18', 'c12', 'm12'].every(id => has('critters', id))) {
      F.legendTrio = true;
      F.gold = (F.gold || 0) + 50;
      ADV.UI.toast(' 🌙 集齐传说三只！获得称号「传说研究员」· 金币 +50 ');
      if (ADV.Growth) ADV.Growth.milestone('🌙 集齐传说三只，获得称号「传说研究员」');
    }
  }
  /* 图鉴总数含异色位：42 常规 + 已收异色补充 */
  function shinyCount() { return DB.critters.filter(c => isShiny('critters', c.id)).length; }

  /* —— 落叶册阶梯奖励闭环（仿图鉴里程碑）：8 种叶子收集到 3/5/8 种时发金币 + 称号 —— */
  const LEAF_MILES = [[3, 15, '拾叶人'], [5, 25, '秋日诗人'], [8, 40, '落叶收藏家']];
  function checkLeafMiles() {
    const F = ADV.Game.flags, n = catCount('leaves');
    F.leafMiles = F.leafMiles || {};
    for (const [num, gold, title] of LEAF_MILES) {
      if (n >= num && !F.leafMiles[num]) {
        F.leafMiles[num] = true;
        F.gold = (F.gold || 0) + gold;
        ADV.UI.toast(` 🍂 落叶册已集 ${num} 种！获得称号「${title}」· 金币 +${gold} `);
        if (ADV.Growth) ADV.Growth.milestone(`🍂 落叶册集 ${num} 种，获得称号「${title}」`);
      }
    }
  }

  /* —— 饲养进化：换日检查（毛毛虫→蝴蝶 5 天 / 蝌蚪→青蛙 7 天，异色继承） ——
   * 返回变化描述数组（Cal.newDay 转成事件 toast）。成体未收则新入册，已收则仅继承异色位。 */
  function applyEvolve(day) {
    const out = [];
    const k = col()['insects'] || (col()['insects'] = {});
    DB.critters.forEach(cr => {
      const ev = cr.evolve;
      if (!ev) return;
      const e = k[cr.id];
      if (!e || typeof e !== 'object' || !e.d || day - e.d < ev.days) return;   // 旧档无日期不追溯
      const shinyInherit = !!e.s;
      const to = k[ev.to];
      const wasShiny = !!(to && typeof to === 'object' && to.s);
      k[ev.to] = { s: (wasShiny || shinyInherit) ? 1 : 0, d: day };
      delete e.d;                                            // 幼体图鉴记录保留，饲养计时清除防重复
      const target = critter(ev.to);
      out.push(`养了 ${ev.days} 天的${cr.name}悄悄发生了变化 —— ${target ? target.name : ev.to} 入手！` +
               (shinyInherit && !wasShiny ? '（居然还是金色的！）' : ''));
      ADV.Game.save();
    });
    return out;
  }
  /* 饲养中剩余天数（未饲养 / 非 evolve 个体返回 -1），图鉴页倒计时用 */
  function critterRearing(id, day) {
    const e = (col()['insects'] || {})[id];
    const cr = critter(id);
    if (!cr || !cr.evolve || !e || typeof e !== 'object' || !e.d || !day) return -1;
    return Math.max(0, cr.evolve.days - (day - e.d));
  }

  /* ---------- 精灵小筑：上架 / 收购（买卖都只在图鉴条目上打 gone 标记，
   * 图鉴收录、进度、任务需求、传说判定统统不受影响） ---------- */
  const PET_BUY  = [0, 40, 120, 300];                    // 按稀有度：购入价
  const PET_SELL = [0, 12, 30, 80];                      // 按稀有度：收购底价（异色 ×3）
  function critterPrice(cr) { return PET_BUY[cr.rar || 0] || 0; }
  function sellPrice(cr, shiny) { return (PET_SELL[cr.rar || 0] || 0) * (shiny ? 3 : 1); }
  function critterEntry(id) { return (col()['insects'] || {})[id] || null; }
  /* 手上有货的小家伙（含已放归/gone，界面自行过滤标注） */
  function heldCritters() {
    const k = col()['insects'] || {};
    return Object.keys(k).map(id => {
      const cr = critter(id);
      if (!cr) return null;
      const e = k[id];
      return { id, cr, shiny: !!(e && e.s), gone: !!(e && e.gone) };
    }).filter(Boolean);
  }
  /* 购入：金币不足拒绝；新种直接入册；已收录的等于「接回家」（清 gone，
   * 且非异色时按 2 倍概率补 roll 一次异色——买个体也可能淘到金色） */
  function buyCritter(id) {
    const cr = critter(id);
    if (!cr) return { ok: false, msg: '阿橘翻了翻货架：「好像没这一只诶。」' };
    const price = critterPrice(cr);
    const F = ADV.Game.flags;
    if ((F.gold || 0) < price) return { ok: false, msg: `金币不够（还差 ${price - (F.gold || 0)} 文）……阿橘惋惜地摆摆手。` };
    F.gold -= price;
    const k = col()['insects'] || (col()['insects'] = {});
    const e = k[id];
    let msg;
    if (!e) {
      k[id] = { s: rollShiny(1) ? 1 : 0, d: ADV.Cal ? ADV.Cal.day : 0 };
      ADV.UI.toast(` 收藏入手：${cr.name} `);
      checkCritterMiles(); checkFull('critters');
      msg = k[id].s ? `付了 ${price} 文，接回来的${cr.name}居然闪着金光！` : `付了 ${price} 文，${cr.name}住进了你家院子。`;
    } else {
      const wasShiny = !!e.s;
      e.gone = 0;
      if (!wasShiny && rollShiny(2)) { e.s = 1; msg = `付了 ${price} 文——接回来的${cr.name}居然闪着金光！`; }
      else msg = `付了 ${price} 文，${cr.name}又住回了你家院子。`;
    }
    ADV.Game.save();
    return { ok: true, msg };
  }
  /* 收购：当前出战伙伴拒卖；其余按稀有度（异色 ×3）折钱，条目打 gone 标记 */
  function sellCritter(id) {
    const F = ADV.Game.flags;
    const bud = F.buddy;
    if (bud && bud.id === id) return { ok: false, msg: '「这可是跟你出生入死的伙伴，卖掉它？」阿橘把话顶了回去。' };
    const e = critterEntry(id);
    const cr = critter(id);
    if (!e || !cr) return { ok: false, msg: '（手里没有这一只。）' };
    const gold = sellPrice(cr, !!e.s);
    e.gone = 1;
    F.gold = (F.gold || 0) + gold;
    ADV.Game.save();
    return { ok: true, msg: `阿橘数出 ${gold} 文：「${cr.name}会找到新主人的，放心。」` };
  }
  /* —— P4 图鉴交换所：重复个体 + 换资 → 指定未得图鉴；每日免费交换请求（日期种子确定性） ——
   * 换出个体 gone=1（图鉴收录保留，可再接回）；异色个体与随行伙伴不可交换。 */
  const EX_COST = [0, 30, 60, 100];                    // 定向交换换资：按目标稀有度
  function exchangeCritter(giveId, getId) {
    const F = ADV.Game.flags;
    const give = critterEntry(giveId), giveCr = critter(giveId), getCr = critter(getId);
    if (!giveCr || !getCr) return { ok: false, msg: '阿橘翻了翻账本：「这单换不了，图鉴上没这一只。」' };
    if (!give || give.gone) return { ok: false, msg: '（你手上没有能换出去的这一只。）' };
    if (give.s) return { ok: false, msg: '「金色的可遇不可求，可不能拿去换。」阿橘把话顶了回去。' };
    if (F.buddy && F.buddy.id === giveId) return { ok: false, msg: '「随行的伙伴先换下来，再谈交换。」' };
    if (has('critters', getId)) return { ok: false, msg: `你已经收录过${getCr.name}了，换只没见过的吧。` };
    const cost = EX_COST[getCr.rar || 0] || 0;
    if ((F.gold || 0) < cost) return { ok: false, msg: `换资不够（还差 ${cost - (F.gold || 0)} 文）……` };
    F.gold = (F.gold || 0) - cost;
    give.gone = 1;                                     // 换出的伙伴住进新家（你的图鉴收录保留）
    const k = col()['insects'] || (col()['insects'] = {});
    k[getId] = { s: rollShiny(1) ? 1 : 0, d: ADV.Cal ? ADV.Cal.day : 0 };
    ADV.UI.toast(` 收藏入手：${getCr.name} `);
    checkCritterMiles();
    checkFull('critters');
    ADV.Game.save();
    return { ok: true, msg: `一手交${giveCr.name}，一手付换资 💰${cost}——「${getCr.name}」住进了你家院子！` };
  }
  function dailyOffer() {                              // {give, want} 或 null：同一天内确定不变
    const day = ADV.Cal ? ADV.Cal.day : 0;
    if (!day) return null;
    const owned = heldCritters().filter(h => !h.gone && !h.shiny && !(ADV.Game.flags.buddy && ADV.Game.flags.buddy.id === h.id));
    const missing = DB.critters.filter(c => !has('critters', c.id));
    if (!owned.length || !missing.length) return null;
    let s = (day * 2246822519) >>> 0;                  // 线性同余伪随机：纯日期种子
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const give = owned[(rnd() * owned.length) | 0];
    const pool = missing.filter(c => (c.rar || 0) >= (give.cr.rar || 0));
    const bag = pool.length ? pool : missing;
    const want = bag[(rnd() * bag.length) | 0];
    return { give: give.id, want: want.id };
  }
  function doDailyOffer() {
    const off = dailyOffer();
    if (!off) return { ok: false, msg: '（暂时凑不出一单交换——先去草丛里认识新伙伴吧。）' };
    const e = critterEntry(off.give);
    if (!e || e.gone || e.s) return { ok: false, msg: '（要交换的小伙伴已经不在手上了，明天来看新请求吧。）' };
    const g0 = ADV.Game.flags.gold || 0;
    const r = exchangeCritter(off.give, off.want);
    if (r.ok) {
      ADV.Game.flags.gold = g0;                        // 每日请求免换资：定向交换扣掉的如数退回
      r.msg = `阿橘如愿抱走了${critter(off.give).name}——作为回礼，「${critter(off.want).name}」跟你回家！\n（每日免费请求，分文不取）`;
    }
    return r;
  }
  /* 每日珍稀精灵架：三格 = 稀有1 必上 + 稀有2 + 30% 概率换上传说（需图鉴解锁）
   * 以日期为种子确定性生成，同一天刷出来都一样 */
  function petShelf() {
    const F = ADV.Game.flags;
    const day = ADV.Cal ? ADV.Cal.day : 0;
    if (F.petShopDay === day && Array.isArray(F.petShopShelf) && F.petShopShelf.length) return F.petShopShelf;
    let s = (day * 2654435761) >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const pickFrom = list => list.length ? list[(rnd() * list.length) | 0].id : null;
    const r1 = DB.critters.filter(c => c.rar === 1);
    const r2 = DB.critters.filter(c => c.rar === 2);
    const r3 = DB.critters.filter(c => c.rar === 3 && needOk(c));
    const slots = [pickFrom(r1), pickFrom(r2), (rnd() < .3 && r3.length) ? pickFrom(r3) : pickFrom(r2)];
    F.petShopDay = day;
    F.petShopShelf = slots.filter((v, i) => v && slots.indexOf(v) === i);   // 去空去重
    ADV.Game.save();
    return F.petShopShelf;
  }

  return { DB, CATS, ITEMS, has, gain, info, ids, catCount, totalOf, progress, whenOk,
           critter, critterList, needOk, rollShiny, isShiny, gainCritter, shinyCount,
           netTier, cageTier, shinyMult,
           applyEvolve, critterRearing,
           critterPrice, sellPrice, critterEntry, heldCritters, buyCritter, sellCritter, petShelf,
           exchangeCritter, dailyOffer, doDailyOffer, EX_COST,
           addItem, useItem, count, giftables, bagList, itemInfo, give };
})();
