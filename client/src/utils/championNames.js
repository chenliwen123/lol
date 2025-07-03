// 中文英雄名到英文名的映射（用于获取头像）
const championNameMapReverse = {
  // A
  '暗裔剑魔': 'Aatrox',
  '九尾妖狐': 'Ahri',
  '离群之刺': 'Akali',
  '哨兵之殇': 'Akshan',
  '牛头酋长': 'Alistar',
  '殇之木乃伊': 'Ammu',
  '冰晶凤凰': 'Anivia',
  '黑暗之女': 'Annie',
  '残月之肃': 'Aphelios',
  '寒冰射手': 'Ashe',
  '铸星龙王': 'AurelionSol',
  '沙漠皇帝': 'Azir',

  // B
  '星界游神': 'Bard',
  '虚空女皇': 'Belveth',
  '蒸汽机器人': 'Blitzcrank',
  '复仇焰魂': 'Brand',
  '弗雷尔卓德之心': 'Braum',
  '血棘': 'Briar',

  // C
  '皮城女警': 'Caitlyn',
  '青钢影': 'Camille',
  '魔蛇之拥': 'Cassiopeia',
  '虚空恐惧': 'Chogath',
  '英勇投弹手': 'Corki',

  // D
  '诺克萨斯之手': 'Darius',
  '皎月女神': 'Diana',
  '荣耀行刑官': 'Draven',
  '祖安狂人': 'DrMundo',

  // E
  '时间刺客': 'Ekko',
  '蜘蛛女皇': 'Elise',
  '痛苦之拥': 'Evelynn',
  '探险家': 'Ezreal',

  // F
  '恐惧稻草人': 'Fiddlesticks',
  '无双剑姬': 'Fiora',
  '潮汐海灵': 'Fizz',

  // G
  '正义巨像': 'Galio',
  '海洋之灾': 'Gangplank',
  '德玛西亚之力': 'Garen',
  '迷失之牙': 'Gnar',
  '酒桶': 'Gragas',
  '法外狂徒': 'Graves',
  '灵罗娃娃': 'Gwen',

  // H
  '战争之影': 'Hecarim',
  '大发明家': 'Heimerdinger',

  // I
  '海兽祭司': 'Illaoi',
  '刀锋舞者': 'Irelia',
  '翠神': 'Ivern',

  // J
  '风暴之怒': 'Janna',
  '德玛西亚皇子': 'JarvanIV',
  '武器大师': 'Jax',
  '未来守护者': 'Jayce',
  '戏命师': 'Jhin',
  '暴走萝莉': 'Jinx',

  // K
  '虚空之女': 'Kaisa',
  '复仇之矛': 'Kalista',
  '天启者': 'Karma',
  '死亡颂唱者': 'Karthus',
  '虚空行者': 'Kassadin',
  '不祥之刃': 'Katarina',
  '正义天使': 'Kayle',
  '影流之镰': 'Kayn',
  '狂暴之心': 'Kennen',
  '虚空掠夺者': 'Khazix',
  '永猎双子': 'Kindred',
  '暴怒骑士': 'Kled',
  '深渊巨口': 'KogMaw',

  // L
  '诡术妖姬': 'Leblanc',
  '盲僧': 'LeeSin',
  '曙光女神': 'Leona',
  '含羞蓓蕾': 'Lillia',
  '冰霜女巫': 'Lissandra',
  '圣枪游侠': 'Lucian',
  '仙灵女巫': 'Lulu',
  '光辉女郎': 'Lux',

  // M
  '熔岩巨兽': 'Malphite',
  '虚空先知': 'Malzahar',
  '扭曲树精': 'Maokai',
  '无极剑圣': 'MasterYi',
  '赏金猎人': 'MissFortune',
  '铁铠冥魂': 'Mordekaiser',
  '堕落天使': 'Morgana',

  // N
  '唤潮鲛姬': 'Nami',
  '沙漠死神': 'Nasus',
  '深海泰坦': 'Nautilus',
  '万花通灵': 'Neeko',
  '狂野女猎手': 'Nidalee',
  '欢愉之刃': 'Nilah',
  '永恒梦魇': 'Nocturne',
  '雪原双子': 'Nunu',

  // O
  '狂战士': 'Olaf',
  '发条魔灵': 'Orianna',
  '山隐之焰': 'Ornn',

  // P
  '不屈之枪': 'Pantheon',
  '圣锤之毅': 'Poppy',
  '血港鬼影': 'Pyke',

  // Q
  '元素女皇': 'Qiyana',
  '德玛西亚之翼': 'Quinn',

  // R
  '幻翎': 'Rakan',
  '披甲龙龟': 'Rammus',
  '虚空遁地兽': 'RekSai',
  '腕豪': 'Rell',
  '炼金男爵': 'Renata',
  '荒漠屠夫': 'Renekton',
  '傲之追猎者': 'Rengar',
  '放逐之刃': 'Riven',
  '机械公敌': 'Rumble',
  '流浪法师': 'Ryze',

  // S
  '沙漠玫瑰': 'Samira',
  '北地之怒': 'Sejuani',
  '涤魂圣枪': 'Senna',
  '星籁歌姬': 'Seraphine',
  '恶魔小丑': 'Shaco',
  '暮光之眼': 'Shen',
  '龙血武姬': 'Shyvana',
  '炼金术士': 'Singed',
  '不死战神': 'Sion',
  '战争女神': 'Sivir',
  '水晶先锋': 'Skarner',
  '琴瑟仙女': 'Sona',
  '众星之子': 'Soraka',
  '诺克萨斯统领': 'Swain',
  '解脱者': 'Sylas',
  '暗黑元首': 'Syndra',

  // T
  '河流之王': 'TahmKench',
  '岩雀': 'Taliyah',
  '刀锋之影': 'Talon',
  '瓦洛兰之盾': 'Taric',
  '迅捷斥候': 'Teemo',
  '魂锁典狱长': 'Thresh',
  '麦林炮手': 'Tristana',
  '巨魔之王': 'Trundle',
  '蛮族之王': 'Tryndamere',
  '卡牌大师': 'TwistedFate',
  '瘟疫之源': 'Twitch',

  // U
  '兽灵行者': 'Udyr',
  '无畏战车': 'Urgot',

  // V
  '惩戒之箭': 'Varus',
  '暗夜猎手': 'Vayne',
  '邪恶小法师': 'Veigar',
  '虚空之眼': 'Velkoz',
  '愁云使者': 'Vex',
  '皮城执法官': 'Vi',
  '破败之王': 'Viego',
  '机械先驱': 'Viktor',
  '猩红收割者': 'Vladimir',
  '雷霆咆哮': 'Volibear',

  // W
  '祖安怒兽': 'Warwick',

  // X
  '逆羽': 'Xayah',
  '远古巫灵': 'Xerath',
  '德邦总管': 'XinZhao',

  // Y
  '疾风剑豪': 'Yasuo',
  '封魔剑魂': 'Yone',
  '牧魂人': 'Yorick',
  '魔法猫咪': 'Yuumi',

  // Z
  '生化魔人': 'Zac',
  '影流之主': 'Zed',
  '祖安花火': 'Zeri',
  '爆破鬼才': 'Ziggs',
  '时光守护者': 'Zilean',
  '暮光星灵': 'Zoe',
  '荆棘之兴': 'Zyra'
};

// 获取英雄头像URL
export function getChampionAvatarUrl(chineseName) {
  const englishName = championNameMapReverse[chineseName] || chineseName;
  return `https://ddragon.leagueoflegends.com/cdn/13.18.1/img/champion/${englishName}.png`;
}

// 获取英文名（用于API调用）
export function getEnglishChampionName(chineseName) {
  return championNameMapReverse[chineseName] || chineseName;
}

export default championNameMapReverse;
