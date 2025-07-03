// 路线翻译工具
const laneTranslations = {
  // 英文到中文
  'TOP': '上路',
  'JUNGLE': '打野',
  'MIDDLE': '中路',
  'BOTTOM': '下路',
  'UTILITY': '辅助',
  'SUPPORT': '辅助',
  'ADC': '下路',
  'MID': '中路',
  'JG': '打野',
  'NONE': '未知',
  
  // 角色翻译
  'SOLO': '单人路',
  'CARRY': '核心',
  'SUPPORT': '辅助',
  'DUO': '双人路',
  'DUO_CARRY': '下路核心',
  'DUO_SUPPORT': '下路辅助'
};

// 中文到英文的反向映射
const laneTranslationsReverse = {};
Object.entries(laneTranslations).forEach(([english, chinese]) => {
  laneTranslationsReverse[chinese] = english;
});

// 获取中文路线名
function getChineseLane(englishLane) {
  if (!englishLane) return '未知';
  return laneTranslations[englishLane.toUpperCase()] || englishLane;
}

// 获取英文路线名
function getEnglishLane(chineseLane) {
  if (!chineseLane) return 'NONE';
  return laneTranslationsReverse[chineseLane] || chineseLane;
}

// 获取路线图标
function getLaneIcon(lane) {
  const icons = {
    'TOP': '🛡️',
    'JUNGLE': '🌲',
    'MIDDLE': '⚡',
    'BOTTOM': '🏹',
    'UTILITY': '💚',
    'SUPPORT': '💚',
    'NONE': '❓'
  };
  
  const englishLane = typeof lane === 'string' ? getEnglishLane(lane) : lane;
  return icons[englishLane] || icons['NONE'];
}

// 获取路线颜色
function getLaneColor(lane) {
  const colors = {
    'TOP': '#FF6B6B',      // 红色 - 上路
    'JUNGLE': '#4ECDC4',   // 青色 - 打野
    'MIDDLE': '#45B7D1',   // 蓝色 - 中路
    'BOTTOM': '#96CEB4',   // 绿色 - 下路
    'UTILITY': '#FFEAA7',  // 黄色 - 辅助
    'SUPPORT': '#FFEAA7',  // 黄色 - 辅助
    'NONE': '#DDD'         // 灰色 - 未知
  };
  
  const englishLane = typeof lane === 'string' ? getEnglishLane(lane) : lane;
  return colors[englishLane] || colors['NONE'];
}

// 根据英雄和角色推断路线
function inferLane(championName, role) {
  // 常见ADC英雄
  const adcChampions = [
    '暴走萝莉', '皮城女警', '探险家', '寒冰射手', '暗夜猎手',
    '戏命师', '圣枪游侠', '虚空之女', '逆羽', '荣耀行刑官',
    '沙漠玫瑰', '赏金猎人', '麦林炮手', '瘟疫之源'
  ];
  
  // 常见辅助英雄
  const supportChampions = [
    '魂锁典狱长', '仙灵女巫', '堕落天使', '曙光女神', '风暴之怒',
    '众星之子', '琴瑟仙女', '星界游神', '幻翎', '深海泰坦',
    '弗雷尔卓德之心', '血港鬼影', '唤潮鲛姬'
  ];
  
  // 常见打野英雄
  const jungleChampions = [
    '盲僧', '虚空掠夺者', '影流之镰', '永猎双子', '祖安怒兽',
    '战争之影', '虚空遁地兽', '傲之追猎者', '兽灵行者'
  ];
  
  // 常见上路英雄
  const topChampions = [
    '德玛西亚之力', '诺克萨斯之手', '放逐之刃', '武器大师',
    '荒漠屠夫', '不死战神', '青钢影', '山隐之焰'
  ];
  
  if (adcChampions.includes(championName)) return 'BOTTOM';
  if (supportChampions.includes(championName)) return 'UTILITY';
  if (jungleChampions.includes(championName)) return 'JUNGLE';
  if (topChampions.includes(championName)) return 'TOP';
  
  // 根据角色推断
  if (role === 'CARRY') return 'BOTTOM';
  if (role === 'SUPPORT') return 'UTILITY';
  
  // 默认中路
  return 'MIDDLE';
}

// 获取路线的详细信息
function getLaneInfo(lane) {
  const englishLane = typeof lane === 'string' ? getEnglishLane(lane) : lane;
  
  return {
    english: englishLane,
    chinese: getChineseLane(englishLane),
    icon: getLaneIcon(englishLane),
    color: getLaneColor(englishLane)
  };
}

// 获取所有路线列表
function getAllLanes() {
  return [
    { english: 'TOP', chinese: '上路', icon: '🛡️', color: '#FF6B6B' },
    { english: 'JUNGLE', chinese: '打野', icon: '🌲', color: '#4ECDC4' },
    { english: 'MIDDLE', chinese: '中路', icon: '⚡', color: '#45B7D1' },
    { english: 'BOTTOM', chinese: '下路', icon: '🏹', color: '#96CEB4' },
    { english: 'UTILITY', chinese: '辅助', icon: '💚', color: '#FFEAA7' }
  ];
}

module.exports = {
  laneTranslations,
  laneTranslationsReverse,
  getChineseLane,
  getEnglishLane,
  getLaneIcon,
  getLaneColor,
  inferLane,
  getLaneInfo,
  getAllLanes
};
