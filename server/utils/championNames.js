// 英雄名称映射表 - 英文名到中文名
const championNameMap = {
  // A
  'Aatrox': '暗裔剑魔',
  'Ahri': '九尾妖狐',
  'Akali': '离群之刺',
  'Akshan': '哨兵之殇',
  'Alistar': '牛头酋长',
  'Amumu': '殇之木乃伊',
  'Anivia': '冰晶凤凰',
  'Annie': '黑暗之女',
  'Aphelios': '残月之肃',
  'Ashe': '寒冰射手',
  'AurelionSol': '铸星龙王',
  'Azir': '沙漠皇帝',

  // B
  'Bard': '星界游神',
  'Belveth': '虚空女皇',
  'Blitzcrank': '蒸汽机器人',
  'Brand': '复仇焰魂',
  'Braum': '弗雷尔卓德之心',
  'Briar': '血棘',

  // C
  'Caitlyn': '皮城女警',
  'Camille': '青钢影',
  'Cassiopeia': '魔蛇之拥',
  'Chogath': '虚空恐惧',
  'Corki': '英勇投弹手',

  // D
  'Darius': '诺克萨斯之手',
  'Diana': '皎月女神',
  'Draven': '荣耀行刑官',
  'DrMundo': '祖安狂人',

  // E
  'Ekko': '时间刺客',
  'Elise': '蜘蛛女皇',
  'Evelynn': '痛苦之拥',
  'Ezreal': '探险家',

  // F
  'Fiddlesticks': '恐惧稻草人',
  'Fiora': '无双剑姬',
  'Fizz': '潮汐海灵',

  // G
  'Galio': '正义巨像',
  'Gangplank': '海洋之灾',
  'Garen': '德玛西亚之力',
  'Gnar': '迷失之牙',
  'Gragas': '酒桶',
  'Graves': '法外狂徒',
  'Gwen': '灵罗娃娃',

  // H
  'Hecarim': '战争之影',
  'Heimerdinger': '大发明家',

  // I
  'Illaoi': '海兽祭司',
  'Irelia': '刀锋舞者',
  'Ivern': '翠神',

  // J
  'Janna': '风暴之怒',
  'JarvanIV': '德玛西亚皇子',
  'Jax': '武器大师',
  'Jayce': '未来守护者',
  'Jhin': '戏命师',
  'Jinx': '暴走萝莉',

  // K
  'Kaisa': '虚空之女',
  'Kalista': '复仇之矛',
  'Karma': '天启者',
  'Karthus': '死亡颂唱者',
  'Kassadin': '虚空行者',
  'Katarina': '不祥之刃',
  'Kayle': '正义天使',
  'Kayn': '影流之镰',
  'Kennen': '狂暴之心',
  'Khazix': '虚空掠夺者',
  'Kindred': '永猎双子',
  'Kled': '暴怒骑士',
  'KogMaw': '深渊巨口',

  // L
  'Leblanc': '诡术妖姬',
  'LeeSin': '盲僧',
  'Leona': '曙光女神',
  'Lillia': '含羞蓓蕾',
  'Lissandra': '冰霜女巫',
  'Lucian': '圣枪游侠',
  'Lulu': '仙灵女巫',
  'Lux': '光辉女郎',

  // M
  'Malphite': '熔岩巨兽',
  'Malzahar': '虚空先知',
  'Maokai': '扭曲树精',
  'MasterYi': '无极剑圣',
  'MissFortune': '赏金猎人',
  'Mordekaiser': '铁铠冥魂',
  'Morgana': '堕落天使',

  // N
  'Nami': '唤潮鲛姬',
  'Nasus': '沙漠死神',
  'Nautilus': '深海泰坦',
  'Neeko': '万花通灵',
  'Nidalee': '狂野女猎手',
  'Nilah': '欢愉之刃',
  'Nocturne': '永恒梦魇',
  'Nunu': '雪原双子',

  // O
  'Olaf': '狂战士',
  'Orianna': '发条魔灵',
  'Ornn': '山隐之焰',

  // P
  'Pantheon': '不屈之枪',
  'Poppy': '圣锤之毅',
  'Pyke': '血港鬼影',

  // Q
  'Qiyana': '元素女皇',
  'Quinn': '德玛西亚之翼',

  // R
  'Rakan': '幻翎',
  'Rammus': '披甲龙龟',
  'RekSai': '虚空遁地兽',
  'Rell': '腕豪',
  'Renata': '炼金男爵',
  'Renekton': '荒漠屠夫',
  'Rengar': '傲之追猎者',
  'Riven': '放逐之刃',
  'Rumble': '机械公敌',
  'Ryze': '流浪法师',

  // S
  'Samira': '沙漠玫瑰',
  'Sejuani': '北地之怒',
  'Senna': '涤魂圣枪',
  'Seraphine': '星籁歌姬',
  'Sett': '腕豪',
  'Shaco': '恶魔小丑',
  'Shen': '暮光之眼',
  'Shyvana': '龙血武姬',
  'Singed': '炼金术士',
  'Sion': '不死战神',
  'Sivir': '战争女神',
  'Skarner': '水晶先锋',
  'Sona': '琴瑟仙女',
  'Soraka': '众星之子',
  'Swain': '诺克萨斯统领',
  'Sylas': '解脱者',
  'Syndra': '暗黑元首',

  // T
  'TahmKench': '河流之王',
  'Taliyah': '岩雀',
  'Talon': '刀锋之影',
  'Taric': '瓦洛兰之盾',
  'Teemo': '迅捷斥候',
  'Thresh': '魂锁典狱长',
  'Tristana': '麦林炮手',
  'Trundle': '巨魔之王',
  'Tryndamere': '蛮族之王',
  'TwistedFate': '卡牌大师',
  'Twitch': '瘟疫之源',

  // U
  'Udyr': '兽灵行者',
  'Urgot': '无畏战车',

  // V
  'Varus': '惩戒之箭',
  'Vayne': '暗夜猎手',
  'Veigar': '邪恶小法师',
  'Velkoz': '虚空之眼',
  'Vex': '愁云使者',
  'Vi': '皮城执法官',
  'Viego': '破败之王',
  'Viktor': '机械先驱',
  'Vladimir': '猩红收割者',
  'Volibear': '雷霆咆哮',

  // W
  'Warwick': '祖安怒兽',

  // X
  'Xayah': '逆羽',
  'Xerath': '远古巫灵',
  'XinZhao': '德邦总管',

  // Y
  'Yasuo': '疾风剑豪',
  'Yone': '封魔剑魂',
  'Yorick': '牧魂人',
  'Yuumi': '魔法猫咪',

  // Z
  'Zac': '生化魔人',
  'Zed': '影流之主',
  'Zeri': '祖安花火',
  'Ziggs': '爆破鬼才',
  'Zilean': '时光守护者',
  'Zoe': '暮光星灵',
  'Zyra': '荆棘之兴'
};

// 中文名到英文名的反向映射
const championNameMapReverse = {};
Object.entries(championNameMap).forEach(([english, chinese]) => {
  championNameMapReverse[chinese] = english;
});

// 获取中文英雄名
function getChineseChampionName(englishName) {
  return championNameMap[englishName] || englishName;
}

// 获取英文英雄名
function getEnglishChampionName(chineseName) {
  return championNameMapReverse[chineseName] || chineseName;
}

// 获取所有英雄名称列表
function getAllChampions() {
  return {
    english: Object.keys(championNameMap),
    chinese: Object.values(championNameMap)
  };
}

// 搜索英雄（支持中英文模糊搜索）
function searchChampion(query) {
  const lowerQuery = query.toLowerCase();
  const results = [];
  
  Object.entries(championNameMap).forEach(([english, chinese]) => {
    if (english.toLowerCase().includes(lowerQuery) || chinese.includes(query)) {
      results.push({
        english: english,
        chinese: chinese
      });
    }
  });
  
  return results;
}

module.exports = {
  championNameMap,
  championNameMapReverse,
  getChineseChampionName,
  getEnglishChampionName,
  getAllChampions,
  searchChampion
};
