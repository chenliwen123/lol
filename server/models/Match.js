const mongoose = require('mongoose');

// 比赛记录模型
const matchSchema = new mongoose.Schema({
  // 比赛基本信息
  matchId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  gameId: {
    type: String,
    required: true
  },
  
  // 游戏模式和类型
  gameMode: {
    type: String,
    enum: ['CLASSIC', 'ARAM', 'URF', 'NEXUS_BLITZ', 'TUTORIAL', 'CUSTOM'],
    required: true
  },
  gameType: {
    type: String,
    enum: ['MATCHED_GAME', 'CUSTOM_GAME', 'TUTORIAL_GAME'],
    required: true
  },
  queueId: {
    type: Number,
    required: true
  },
  
  // 时间信息
  gameCreation: {
    type: Date,
    required: true
  },
  gameDuration: {
    type: Number, // 游戏时长（秒）
    required: true
  },
  gameEndTimestamp: {
    type: Date
  },
  
  // 地图信息
  mapId: {
    type: Number,
    required: true
  },
  
  // 参与者信息
  participants: [{
    // 召唤师信息
    summonerId: String,
    summonerName: String,
    summonerLevel: Number,
    
    // 队伍信息
    teamId: {
      type: Number,
      enum: [100, 200] // 蓝方100，红方200
    },
    
    // 英雄信息
    championId: Number,
    championName: String,
    championLevel: Number,
    
    // 位置信息
    lane: {
      type: String,
      enum: ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY', 'NONE']
    },
    role: {
      type: String,
      enum: ['SOLO', 'CARRY', 'SUPPORT', 'NONE']
    },
    
    // 游戏结果
    win: Boolean,
    
    // KDA 数据
    kills: {
      type: Number,
      default: 0
    },
    deaths: {
      type: Number,
      default: 0
    },
    assists: {
      type: Number,
      default: 0
    },
    
    // 伤害数据
    totalDamageDealt: Number,
    totalDamageDealtToChampions: Number,
    totalDamageTaken: Number,
    
    // 经济数据
    goldEarned: Number,
    totalMinionsKilled: Number,
    neutralMinionsKilled: Number,
    
    // 装备信息
    items: [{
      itemId: Number,
      itemName: String
    }],
    
    // 召唤师技能
    spell1Id: Number,
    spell2Id: Number,
    
    // 符文信息
    primaryRune: {
      runeId: Number,
      runeName: String
    },
    secondaryRune: {
      runeId: Number,
      runeName: String
    },
    
    // 其他统计
    visionScore: Number,
    wardsPlaced: Number,
    wardsKilled: Number,
    firstBloodKill: Boolean,
    firstTowerKill: Boolean
  }],
  
  // 队伍信息
  teams: [{
    teamId: {
      type: Number,
      enum: [100, 200]
    },
    win: Boolean,
    
    // 队伍统计
    baronKills: Number,
    dragonKills: Number,
    towerKills: Number,
    inhibitorKills: Number,
    riftHeraldKills: Number,
    
    // 首杀信息
    firstBaron: Boolean,
    firstDragon: Boolean,
    firstInhibitor: Boolean,
    firstTower: Boolean,
    firstBlood: Boolean
  }],
  
  // 数据来源和更新时间
  dataSource: {
    type: String,
    enum: ['zhangmeng', 'riot_api', 'manual', 'mock', 'test', 'enhanced_mock', 'lcu', 'opgg', 'wegame'],
    default: 'zhangmeng'
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'matches'
});

// 索引
matchSchema.index({ 'participants.summonerId': 1 });
matchSchema.index({ 'participants.summonerName': 1 });
matchSchema.index({ gameCreation: -1 });
matchSchema.index({ gameMode: 1, queueId: 1 });

// 虚拟字段：比赛时长（分钟）
matchSchema.virtual('gameDurationMinutes').get(function() {
  return Math.round(this.gameDuration / 60);
});

// 实例方法：获取指定召唤师的参与信息
matchSchema.methods.getParticipantBySummoner = function(summonerId) {
  return this.participants.find(p => p.summonerId === summonerId);
};

// 静态方法：获取召唤师的比赛记录
matchSchema.statics.findBySummoner = function(summonerId, limit = 20) {
  return this.find({
    'participants.summonerId': summonerId
  })
  .sort({ gameCreation: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Match', matchSchema);
