const mongoose = require('mongoose');

// 召唤师信息模型
const summonerSchema = new mongoose.Schema(
  {
    // 基本信息
    summonerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    summonerName: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
    },

    // 等级和经验
    summonerLevel: {
      type: Number,
      default: 1,
    },

    // 排位信息
    rankInfo: {
      // 单双排位
      soloRank: {
        tier: String, // 段位 (IRON, BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER, GRANDMASTER, CHALLENGER)
        rank: String, // 等级 (I, II, III, IV)
        leaguePoints: Number, // LP
        wins: Number, // 胜场
        losses: Number, // 负场
        winRate: Number, // 胜率
      },
      // 灵活排位
      flexRank: {
        tier: String,
        rank: String,
        leaguePoints: Number,
        wins: Number,
        losses: Number,
        winRate: Number,
      },
    },

    // 头像和图标
    profileIcon: {
      iconId: Number,
      iconUrl: String,
    },

    // 服务器区域
    region: {
      type: String,
      default: 'CN',
    },

    // 最近活跃时间
    lastActiveTime: {
      type: Date,
      default: Date.now,
    },

    // 统计信息
    stats: {
      totalGames: {
        type: Number,
        default: 0,
      },
      totalWins: {
        type: Number,
        default: 0,
      },
      totalLosses: {
        type: Number,
        default: 0,
      },
      overallWinRate: {
        type: Number,
        default: 0,
      },
      favoriteChampions: [
        {
          championId: Number,
          championName: String,
          gamesPlayed: Number,
          winRate: Number,
        },
      ],
    },

    // 数据更新时间
    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    // 数据来源
    dataSource: {
      type: String,
      enum: [
        'zhangmeng',
        'riot_api',
        'manual',
        'mock',
        'test',
        'enhanced_mock',
        'lcu',
        'opgg',
        'wegame',
      ],
      default: 'zhangmeng',
    },

    // 数据来源历史（记录所有曾经使用过的数据源）
    dataSourceHistory: [
      {
        type: String,
        enum: [
          'zhangmeng',
          'riot_api',
          'manual',
          'mock',
          'test',
          'enhanced_mock',
          'lcu',
          'opgg',
          'wegame',
        ],
      },
    ],
  },
  {
    timestamps: true,
    collection: 'summoners',
  }
);

// 索引
summonerSchema.index({ summonerName: 1 });
summonerSchema.index({ 'rankInfo.soloRank.tier': 1 });
summonerSchema.index({ lastUpdated: -1 });

// 虚拟字段：总胜率
summonerSchema.virtual('totalWinRate').get(function () {
  const totalGames = this.stats.totalWins + this.stats.totalLosses;
  return totalGames > 0
    ? ((this.stats.totalWins / totalGames) * 100).toFixed(2)
    : 0;
});

// 实例方法：更新统计信息
summonerSchema.methods.updateStats = function () {
  this.stats.totalGames = this.stats.totalWins + this.stats.totalLosses;
  this.stats.overallWinRate = this.totalWinRate;
  this.lastUpdated = new Date();
};

// 静态方法：根据召唤师名称查找
summonerSchema.statics.findBySummonerName = function (name) {
  return this.findOne({
    summonerName: new RegExp(name, 'i'),
  });
};

module.exports = mongoose.model('Summoner', summonerSchema);
