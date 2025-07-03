const express = require('express');
const router = express.Router();
const { Summoner, Match } = require('../models');
const rateLimiters = require('../middleware/rateLimiter');
const {
  validateSummonerId,
  validateSummonerName,
  validatePagination,
  validateSummonerData,
} = require('../middleware/validator');
const PlayerScoring = require('../utils/playerScoring');
const ChatSender = require('../utils/chatSender');
const { getChineseLane, getLaneInfo } = require('../utils/laneTranslator');
const SummonerDeduplicator = require('../utils/summonerDeduplicator');

// 获取所有召唤师列表
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, tier, region } = req.query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const query = {};
    if (tier) {
      query['rankInfo.soloRank.tier'] = tier.toUpperCase();
    }
    if (region) {
      query.region = region.toUpperCase();
    }

    const summoners = await Summoner.find(query)
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Summoner.countDocuments(query);

    res.json({
      success: true,
      data: summoners,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取召唤师列表失败',
      message: error.message,
    });
  }
});

// 根据召唤师ID获取详细信息
router.get('/:summonerId', validateSummonerId, async (req, res) => {
  try {
    const { summonerId } = req.params;

    const summoner = await Summoner.findOne({ summonerId }).select('-__v');

    if (!summoner) {
      return res.status(404).json({
        success: false,
        error: '召唤师不存在',
      });
    }

    res.json({
      success: true,
      data: summoner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取召唤师信息失败',
      message: error.message,
    });
  }
});

// 根据召唤师名称搜索
router.get(
  '/search/:name',
  rateLimiters.search,
  validateSummonerName,
  async (req, res) => {
    try {
      const { name } = req.params;

      const summoners = await Summoner.find({
        summonerName: new RegExp(name, 'i'),
      })
        .limit(10)
        .select(
          'summonerId summonerName summonerLevel rankInfo.soloRank profileIcon'
        );

      res.json({
        success: true,
        data: summoners,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '搜索召唤师失败',
        message: error.message,
      });
    }
  }
);

// 创建或更新召唤师信息
router.post('/', rateLimiters.write, validateSummonerData, async (req, res) => {
  try {
    const summonerData = req.body;

    // 验证必需字段
    if (!summonerData.summonerId || !summonerData.summonerName) {
      return res.status(400).json({
        success: false,
        error: '缺少必需字段: summonerId 和 summonerName',
      });
    }

    // 使用 upsert 创建或更新
    const summoner = await Summoner.findOneAndUpdate(
      { summonerId: summonerData.summonerId },
      { ...summonerData, lastUpdated: new Date() },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(201).json({
      success: true,
      data: summoner,
      message: '召唤师信息保存成功',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: '保存召唤师信息失败',
      message: error.message,
    });
  }
});

// 更新召唤师信息
router.put('/:summonerId', async (req, res) => {
  try {
    const { summonerId } = req.params;
    const updateData = req.body;

    const summoner = await Summoner.findOneAndUpdate(
      { summonerId },
      { ...updateData, lastUpdated: new Date() },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!summoner) {
      return res.status(404).json({
        success: false,
        error: '召唤师不存在',
      });
    }

    res.json({
      success: true,
      data: summoner,
      message: '召唤师信息更新成功',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: '更新召唤师信息失败',
      message: error.message,
    });
  }
});

// 删除召唤师
router.delete('/:summonerId', async (req, res) => {
  try {
    const { summonerId } = req.params;

    const summoner = await Summoner.findOneAndDelete({ summonerId });

    if (!summoner) {
      return res.status(404).json({
        success: false,
        error: '召唤师不存在',
      });
    }

    res.json({
      success: true,
      message: '召唤师删除成功',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '删除召唤师失败',
      message: error.message,
    });
  }
});

// 获取召唤师战绩分析
router.get('/:summonerId/stats', validateSummonerId, async (req, res) => {
  try {
    const { summonerId } = req.params;
    const { days = 30 } = req.query;

    const summoner = await Summoner.findOne({ summonerId });
    if (!summoner) {
      return res.status(404).json({
        success: false,
        error: '召唤师不存在',
      });
    }

    // 如果召唤师已有分析数据，直接返回
    if (summoner.recentStats && summoner.recentStats.last30Days) {
      return res.json({
        success: true,
        data: {
          summoner: {
            summonerName: summoner.summonerName,
            summonerLevel: summoner.summonerLevel,
            region: summoner.region,
            rankInfo: summoner.rankInfo,
            profileIcon: summoner.profileIcon,
          },
          recentStats: summoner.recentStats.last30Days,
        },
      });
    }

    // 如果没有分析数据，获取比赛记录进行分析
    const { Match } = require('../models');
    const daysAgo = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const recentMatches = await Match.find({
      'participants.summonerId': summoner.summonerId,
      gameCreation: { $gte: daysAgo },
    }).sort({ gameCreation: -1 });

    // 基础统计
    const totalGames = recentMatches.length;
    const wins = recentMatches.filter((match) => {
      const participant = match.participants.find(
        (p) => p.summonerId === summoner.summonerId
      );
      return participant && participant.win;
    }).length;

    // 英雄统计
    const championStats = {};
    const roleStats = {};
    let totalKills = 0,
      totalDeaths = 0,
      totalAssists = 0;

    recentMatches.forEach((match) => {
      const participant = match.participants.find(
        (p) => p.summonerId === summoner.summonerId
      );
      if (!participant) return;

      const championName = participant.championName;
      const lane = participant.lane;
      const win = participant.win;

      // 统计英雄数据
      if (!championStats[championName]) {
        championStats[championName] = {
          championName,
          games: 0,
          wins: 0,
          losses: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          winRate: 0,
          avgKDA: 0,
        };
      }

      const champStat = championStats[championName];
      champStat.games++;
      if (win) champStat.wins++;
      else champStat.losses++;
      champStat.kills += participant.kills || 0;
      champStat.deaths += participant.deaths || 0;
      champStat.assists += participant.assists || 0;

      // 统计位置数据
      roleStats[lane] = (roleStats[lane] || 0) + 1;

      // 累计KDA
      totalKills += participant.kills || 0;
      totalDeaths += participant.deaths || 0;
      totalAssists += participant.assists || 0;
    });

    // 计算英雄统计
    Object.values(championStats).forEach((stat) => {
      stat.winRate =
        stat.games > 0 ? Math.round((stat.wins / stat.games) * 100) : 0;
      stat.avgKDA =
        stat.deaths > 0
          ? Number(((stat.kills + stat.assists) / stat.deaths).toFixed(2))
          : stat.kills + stat.assists;
      stat.avgKills = Number((stat.kills / stat.games).toFixed(1));
      stat.avgDeaths = Number((stat.deaths / stat.games).toFixed(1));
      stat.avgAssists = Number((stat.assists / stat.games).toFixed(1));
    });

    // 最常使用的英雄
    const mostPlayedChampions = Object.values(championStats)
      .sort((a, b) => b.games - a.games)
      .slice(0, 5);

    // 表现最佳的英雄
    const bestPerformingChampions = Object.values(championStats)
      .filter((stat) => stat.games >= 3)
      .sort((a, b) => {
        const scoreA = a.winRate * 0.6 + Math.min(a.avgKDA * 10, 40) * 0.4;
        const scoreB = b.winRate * 0.6 + Math.min(b.avgKDA * 10, 40) * 0.4;
        return scoreB - scoreA;
      })
      .slice(0, 5);

    const recentStats = {
      totalGames,
      totalWins: wins,
      totalLosses: totalGames - wins,
      winRate: totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0,
      mostPlayedChampions,
      bestPerformingChampions,
      averageKDA: {
        kills:
          totalGames > 0 ? Number((totalKills / totalGames).toFixed(1)) : 0,
        deaths:
          totalGames > 0 ? Number((totalDeaths / totalGames).toFixed(1)) : 0,
        assists:
          totalGames > 0 ? Number((totalAssists / totalGames).toFixed(1)) : 0,
        ratio:
          totalDeaths > 0
            ? Number(((totalKills + totalAssists) / totalDeaths).toFixed(2))
            : totalKills + totalAssists,
      },
      roleDistribution: roleStats,
      championStats: Object.values(championStats),
      lastUpdated: new Date(),
    };

    res.json({
      success: true,
      data: {
        summoner: {
          summonerName: summoner.summonerName,
          summonerLevel: summoner.summonerLevel,
          region: summoner.region,
          rankInfo: summoner.rankInfo,
          profileIcon: summoner.profileIcon,
        },
        recentStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取战绩分析失败',
      message: error.message,
    });
  }
});

// 获取召唤师评分
router.get('/:summonerId/score', validateSummonerId, async (req, res) => {
  try {
    const { summonerId } = req.params;

    const summoner = await Summoner.findOne({ summonerId });
    if (!summoner) {
      return res.status(404).json({
        success: false,
        error: '召唤师不存在',
      });
    }

    // 获取最近20场比赛
    const recentMatches = await Match.find({
      'participants.summonerId': summoner.summonerId,
    })
      .sort({ gameCreation: -1 })
      .limit(20);

    // 计算评分
    const playerScoring = new PlayerScoring();
    const scoreData = playerScoring.calculatePlayerScore(
      recentMatches,
      summoner
    );

    // 生成聊天框消息
    const chatMessage = playerScoring.generateChatMessage(
      scoreData,
      summoner.summonerName
    );

    res.json({
      success: true,
      data: {
        summoner: {
          summonerName: summoner.summonerName,
          summonerLevel: summoner.summonerLevel,
          region: summoner.region,
          rankInfo: summoner.rankInfo,
        },
        score: scoreData,
        chatMessage: chatMessage,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取评分失败',
      message: error.message,
    });
  }
});

// 发送评分到游戏聊天
router.post('/:summonerId/send-score', validateSummonerId, async (req, res) => {
  try {
    const { summonerId } = req.params;
    const { autoSend = false } = req.body;

    const summoner = await Summoner.findOne({ summonerId });
    if (!summoner) {
      return res.status(404).json({
        success: false,
        error: '召唤师不存在',
      });
    }

    // 获取最近20场比赛
    const recentMatches = await Match.find({
      'participants.summonerId': summoner.summonerId,
    })
      .sort({ gameCreation: -1 })
      .limit(20);

    // 计算评分
    const playerScoring = new PlayerScoring();
    const scoreData = playerScoring.calculatePlayerScore(
      recentMatches,
      summoner
    );

    // 发送到聊天
    const chatSender = new ChatSender();
    let result;

    if (autoSend) {
      // 自动监听游戏状态并发送
      result = await chatSender.autoSendOnGameStart(
        scoreData,
        summoner.summonerName
      );
    } else {
      // 立即发送
      result = await chatSender.sendScoreMessage(
        scoreData,
        summoner.summonerName
      );
    }

    res.json({
      success: result.success,
      message: result.success ? result.message : result.error,
      data: result.success
        ? {
            scoreData,
            sentMessage: true,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '发送失败',
      message: error.message,
    });
  }
});

// 获取游戏状态
router.get('/game-status', async (req, res) => {
  try {
    const chatSender = new ChatSender();
    const status = await chatSender.getGameStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取游戏状态失败',
      message: error.message,
    });
  }
});

// 获取召唤师排行榜
router.get('/leaderboard/:tier', async (req, res) => {
  try {
    const { tier } = req.params;
    const { limit = 50 } = req.query;

    const summoners = await Summoner.find({
      'rankInfo.soloRank.tier': tier.toUpperCase(),
    })
      .sort({ 'rankInfo.soloRank.leaguePoints': -1 })
      .limit(parseInt(limit))
      .select('summonerName rankInfo.soloRank profileIcon');

    res.json({
      success: true,
      data: summoners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取排行榜失败',
      message: error.message,
    });
  }
});

// 召唤师去重
router.post('/deduplicate', async (req, res) => {
  try {
    const deduplicator = new SummonerDeduplicator();

    // 生成去重前的报告
    const beforeReport = await deduplicator.generateReport();

    // 执行去重
    const result = await deduplicator.mergeDuplicates();

    // 清理孤立的比赛记录
    const cleanupResult = await deduplicator.cleanupOrphanedMatches();

    // 生成去重后的报告
    const afterReport = await deduplicator.generateReport();

    res.json({
      success: true,
      message: '召唤师去重完成',
      data: {
        before: beforeReport.summary,
        after: afterReport.summary,
        merged: result,
        cleanup: cleanupResult,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '去重失败',
      message: error.message,
    });
  }
});

// 获取重复召唤师报告
router.get('/duplicates', async (req, res) => {
  try {
    const deduplicator = new SummonerDeduplicator();
    const report = await deduplicator.generateReport();

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取重复报告失败',
      message: error.message,
    });
  }
});

// 路线翻译工具API
router.get('/lanes', async (req, res) => {
  try {
    const { getAllLanes } = require('../utils/laneTranslator');
    const lanes = getAllLanes();

    res.json({
      success: true,
      data: lanes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取路线信息失败',
      message: error.message,
    });
  }
});

// 更新召唤师数据
router.put('/:summonerId/update', validateSummonerId, async (req, res) => {
  try {
    const { summonerId } = req.params;
    const { forceUpdate = false } = req.body;

    const summoner = await Summoner.findOne({ summonerId });
    if (!summoner) {
      return res.status(404).json({
        success: false,
        error: '召唤师不存在',
      });
    }

    // 检查是否需要更新（避免频繁更新）
    const lastUpdated = new Date(
      summoner.lastUpdated || summoner.updatedAt || 0
    );
    const now = new Date();
    const timeDiff = now - lastUpdated;
    const hoursSinceUpdate = timeDiff / (1000 * 60 * 60);

    if (!forceUpdate && hoursSinceUpdate < 1) {
      return res.json({
        success: true,
        message: '数据较新，无需更新',
        data: {
          summoner,
          lastUpdated: summoner.lastUpdated,
          hoursSinceUpdate: Math.round(hoursSinceUpdate * 100) / 100,
        },
      });
    }

    // 这里可以调用不同的数据源进行更新
    // 目前使用增强模拟数据作为示例
    const EnhancedMockCrawler = require('../../crawler/enhanced-mock-crawler');
    const crawler = new EnhancedMockCrawler();

    console.log(`🔄 开始更新召唤师数据: ${summoner.summonerName}`);

    // 重新生成数据（这里可以替换为真实的API调用）
    await crawler.crawlSummoner(summoner.summonerName, summoner.region);

    // 获取更新后的数据
    const updatedSummoner = await Summoner.findOne({ summonerId });

    res.json({
      success: true,
      message: '召唤师数据更新成功',
      data: {
        summoner: updatedSummoner,
        updateInfo: {
          previousUpdate: summoner.lastUpdated,
          currentUpdate: updatedSummoner.lastUpdated,
          dataSource: updatedSummoner.dataSource,
          dataSourceHistory: updatedSummoner.dataSourceHistory,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '更新召唤师数据失败',
      message: error.message,
    });
  }
});

// 批量更新召唤师数据
router.post('/batch-update', async (req, res) => {
  try {
    const { summonerIds = [], forceUpdate = false, maxAge = 24 } = req.body;

    let query = {};
    if (summonerIds.length > 0) {
      query.summonerId = { $in: summonerIds };
    }

    // 如果不是强制更新，只更新过期的数据
    if (!forceUpdate) {
      const cutoffTime = new Date(Date.now() - maxAge * 60 * 60 * 1000);
      query.$or = [
        { lastUpdated: { $lt: cutoffTime } },
        { lastUpdated: { $exists: false } },
      ];
    }

    const summonersToUpdate = await Summoner.find(query).limit(10); // 限制批量更新数量

    if (summonersToUpdate.length === 0) {
      return res.json({
        success: true,
        message: '没有需要更新的召唤师',
        data: { updatedCount: 0 },
      });
    }

    const EnhancedMockCrawler = require('../../crawler/enhanced-mock-crawler');
    const crawler = new EnhancedMockCrawler();

    let updatedCount = 0;
    const results = [];

    for (const summoner of summonersToUpdate) {
      try {
        console.log(`🔄 批量更新: ${summoner.summonerName}`);
        await crawler.crawlSummoner(summoner.summonerName, summoner.region);
        updatedCount++;
        results.push({
          summonerName: summoner.summonerName,
          status: 'success',
        });
      } catch (error) {
        console.error(`❌ 更新失败: ${summoner.summonerName}`, error.message);
        results.push({
          summonerName: summoner.summonerName,
          status: 'failed',
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `批量更新完成，成功更新 ${updatedCount}/${summonersToUpdate.length} 个召唤师`,
      data: {
        updatedCount,
        totalCount: summonersToUpdate.length,
        results,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '批量更新失败',
      message: error.message,
    });
  }
});

module.exports = router;
