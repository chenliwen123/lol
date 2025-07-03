const express = require('express');
const router = express.Router();
const { Match, Summoner } = require('../models');

// 验证中间件
const validateMatchId = (req, res, next) => {
  const { matchId } = req.params;
  if (!matchId || matchId.trim() === '') {
    return res.status(400).json({
      success: false,
      error: '比赛ID不能为空',
    });
  }
  next();
};

// 获取召唤师的比赛记录
router.get('/summoner/:summonerId', async (req, res) => {
  try {
    const { summonerId } = req.params;
    const { page = 1, limit = 20, gameMode, queueId } = req.query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const query = {
      'participants.summonerId': summonerId,
    };

    if (gameMode) {
      query.gameMode = gameMode.toUpperCase();
    }

    if (queueId) {
      query.queueId = parseInt(queueId);
    }

    const matches = await Match.find(query)
      .sort({ gameCreation: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Match.countDocuments(query);

    // 为每场比赛添加该召唤师的详细信息
    const matchesWithPlayerData = matches.map((match) => {
      const participant = match.participants.find(
        (p) => p.summonerId === summonerId
      );
      return {
        ...match.toObject(),
        playerData: participant,
      };
    });

    res.json({
      success: true,
      data: matchesWithPlayerData,
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
      error: '获取比赛记录失败',
      message: error.message,
    });
  }
});

// 获取单场比赛详情
router.get('/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findOne({ matchId }).select('-__v');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: '比赛记录不存在',
      });
    }

    res.json({
      success: true,
      data: match,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取比赛详情失败',
      message: error.message,
    });
  }
});

// 获取比赛详细信息（包含所有参与者）
router.get('/:matchId/detail', validateMatchId, async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findOne({ matchId }).select('-__v');

    if (!match) {
      return res.status(404).json({
        success: false,
        error: '比赛不存在',
      });
    }

    // 如果需要，可以在这里添加更多的数据处理
    // 比如获取所有参与者的详细信息等

    res.json({
      success: true,
      data: {
        ...match.toObject(),
        // 可以添加计算出的统计数据
        totalKills: match.participants.reduce(
          (sum, p) => sum + (p.kills || 0),
          0
        ),
        totalDeaths: match.participants.reduce(
          (sum, p) => sum + (p.deaths || 0),
          0
        ),
        totalAssists: match.participants.reduce(
          (sum, p) => sum + (p.assists || 0),
          0
        ),
        totalDamage: match.participants.reduce(
          (sum, p) => sum + (p.totalDamageDealtToChampions || 0),
          0
        ),
        totalGold: match.participants.reduce(
          (sum, p) => sum + (p.goldEarned || 0),
          0
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取比赛详情失败',
      message: error.message,
    });
  }
});

// 保存比赛记录
router.post('/', async (req, res) => {
  try {
    const matchData = req.body;

    // 验证必需字段
    if (!matchData.matchId || !matchData.participants) {
      return res.status(400).json({
        success: false,
        error: '缺少必需字段: matchId 和 participants',
      });
    }

    // 使用 upsert 避免重复保存
    const match = await Match.findOneAndUpdate(
      { matchId: matchData.matchId },
      { ...matchData, lastUpdated: new Date() },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(201).json({
      success: true,
      data: match,
      message: '比赛记录保存成功',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: '保存比赛记录失败',
      message: error.message,
    });
  }
});

// 获取召唤师的统计数据
router.get('/stats/:summonerId', async (req, res) => {
  try {
    const { summonerId } = req.params;
    const { days = 30 } = req.query;

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));

    const matches = await Match.find({
      'participants.summonerId': summonerId,
      gameCreation: { $gte: dateLimit },
    });

    // 计算统计数据
    let totalGames = 0;
    let wins = 0;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let championStats = {};

    matches.forEach((match) => {
      const participant = match.participants.find(
        (p) => p.summonerId === summonerId
      );
      if (participant) {
        totalGames++;
        if (participant.win) wins++;

        totalKills += participant.kills || 0;
        totalDeaths += participant.deaths || 0;
        totalAssists += participant.assists || 0;

        // 英雄统计
        const championName = participant.championName;
        if (!championStats[championName]) {
          championStats[championName] = {
            games: 0,
            wins: 0,
            kills: 0,
            deaths: 0,
            assists: 0,
          };
        }

        championStats[championName].games++;
        if (participant.win) championStats[championName].wins++;
        championStats[championName].kills += participant.kills || 0;
        championStats[championName].deaths += participant.deaths || 0;
        championStats[championName].assists += participant.assists || 0;
      }
    });

    // 计算平均值和胜率
    const avgKDA =
      totalDeaths > 0
        ? ((totalKills + totalAssists) / totalDeaths).toFixed(2)
        : (totalKills + totalAssists).toFixed(2);

    const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(2) : 0;

    // 处理英雄统计
    const championStatsArray = Object.entries(championStats)
      .map(([name, stats]) => ({
        championName: name,
        ...stats,
        winRate:
          stats.games > 0 ? ((stats.wins / stats.games) * 100).toFixed(2) : 0,
        avgKDA:
          stats.deaths > 0
            ? ((stats.kills + stats.assists) / stats.deaths).toFixed(2)
            : (stats.kills + stats.assists).toFixed(2),
      }))
      .sort((a, b) => b.games - a.games);

    res.json({
      success: true,
      data: {
        period: `${days} 天`,
        totalGames,
        wins,
        losses: totalGames - wins,
        winRate: parseFloat(winRate),
        avgKills: totalGames > 0 ? (totalKills / totalGames).toFixed(1) : 0,
        avgDeaths: totalGames > 0 ? (totalDeaths / totalGames).toFixed(1) : 0,
        avgAssists: totalGames > 0 ? (totalAssists / totalGames).toFixed(1) : 0,
        avgKDA: parseFloat(avgKDA),
        championStats: championStatsArray,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取统计数据失败',
      message: error.message,
    });
  }
});

// 获取最近比赛
router.get('/recent/:limit?', async (req, res) => {
  try {
    const { limit = 10 } = req.params;

    const matches = await Match.find()
      .sort({ gameCreation: -1 })
      .limit(parseInt(limit))
      .select(
        'matchId gameMode gameDuration participants.summonerName participants.championName participants.win gameCreation'
      );

    res.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取最近比赛失败',
      message: error.message,
    });
  }
});

module.exports = router;
