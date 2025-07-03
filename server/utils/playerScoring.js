// 玩家评分系统
class PlayerScoring {
  constructor() {
    // 评分权重配置
    this.weights = {
      winRate: 0.25,        // 胜率权重 25%
      kda: 0.20,           // KDA权重 20%
      damage: 0.15,        // 伤害权重 15%
      vision: 0.10,        // 视野权重 10%
      cs: 0.10,            // 补刀权重 10%
      gold: 0.10,          // 经济权重 10%
      consistency: 0.10    // 稳定性权重 10%
    };

    // 评分等级
    this.scoreRanks = [
      { min: 90, max: 100, rank: 'S+', color: '#ff6b6b', description: '超神' },
      { min: 80, max: 89, rank: 'S', color: '#ff8787', description: '优秀' },
      { min: 70, max: 79, rank: 'A+', color: '#ffa726', description: '良好' },
      { min: 60, max: 69, rank: 'A', color: '#ffcc02', description: '不错' },
      { min: 50, max: 59, rank: 'B+', color: '#66bb6a', description: '一般' },
      { min: 40, max: 49, rank: 'B', color: '#42a5f5', description: '偏弱' },
      { min: 30, max: 39, rank: 'C+', color: '#ab47bc', description: '较差' },
      { min: 20, max: 29, rank: 'C', color: '#8d6e63', description: '很差' },
      { min: 10, max: 19, rank: 'D', color: '#78909c', description: '极差' },
      { min: 0, max: 9, rank: 'F', color: '#546e7a', description: '坑' }
    ];
  }

  // 计算玩家综合评分
  calculatePlayerScore(matches, summonerData) {
    if (!matches || matches.length === 0) {
      return {
        totalScore: 50,
        rank: 'B+',
        color: '#66bb6a',
        description: '一般',
        details: {
          winRate: { score: 50, value: 0 },
          kda: { score: 50, value: 0 },
          damage: { score: 50, value: 0 },
          vision: { score: 50, value: 0 },
          cs: { score: 50, value: 0 },
          gold: { score: 50, value: 0 },
          consistency: { score: 50, value: 0 }
        },
        matchCount: 0,
        recommendation: '暂无数据，建议多打几场排位'
      };
    }

    // 获取最近20场比赛
    const recentMatches = matches.slice(0, 20);
    const playerMatches = this.extractPlayerMatches(recentMatches, summonerData.summonerId);

    if (playerMatches.length === 0) {
      return this.getDefaultScore();
    }

    // 计算各项指标
    const winRateScore = this.calculateWinRateScore(playerMatches);
    const kdaScore = this.calculateKDAScore(playerMatches);
    const damageScore = this.calculateDamageScore(playerMatches);
    const visionScore = this.calculateVisionScore(playerMatches);
    const csScore = this.calculateCSScore(playerMatches);
    const goldScore = this.calculateGoldScore(playerMatches);
    const consistencyScore = this.calculateConsistencyScore(playerMatches);

    // 计算总分
    const totalScore = Math.round(
      winRateScore.score * this.weights.winRate +
      kdaScore.score * this.weights.kda +
      damageScore.score * this.weights.damage +
      visionScore.score * this.weights.vision +
      csScore.score * this.weights.cs +
      goldScore.score * this.weights.gold +
      consistencyScore.score * this.weights.consistency
    );

    const rank = this.getScoreRank(totalScore);
    const recommendation = this.generateRecommendation(totalScore, {
      winRate: winRateScore,
      kda: kdaScore,
      damage: damageScore,
      vision: visionScore,
      cs: csScore,
      gold: goldScore,
      consistency: consistencyScore
    });

    return {
      totalScore,
      rank: rank.rank,
      color: rank.color,
      description: rank.description,
      details: {
        winRate: winRateScore,
        kda: kdaScore,
        damage: damageScore,
        vision: visionScore,
        cs: csScore,
        gold: goldScore,
        consistency: consistencyScore
      },
      matchCount: playerMatches.length,
      recommendation
    };
  }

  // 提取玩家的比赛数据
  extractPlayerMatches(matches, summonerId) {
    return matches.map(match => {
      const participant = match.participants.find(p => p.summonerId === summonerId);
      if (!participant) return null;

      return {
        matchId: match.matchId,
        gameCreation: match.gameCreation,
        gameDuration: match.gameDuration,
        gameMode: match.gameMode,
        win: participant.win,
        kills: participant.kills || 0,
        deaths: participant.deaths || 0,
        assists: participant.assists || 0,
        totalDamageDealtToChampions: participant.totalDamageDealtToChampions || 0,
        goldEarned: participant.goldEarned || 0,
        totalMinionsKilled: participant.totalMinionsKilled || 0,
        visionScore: participant.visionScore || 0,
        championName: participant.championName,
        lane: participant.lane
      };
    }).filter(match => match !== null);
  }

  // 计算胜率评分
  calculateWinRateScore(matches) {
    const wins = matches.filter(m => m.win).length;
    const winRate = (wins / matches.length) * 100;
    
    let score;
    if (winRate >= 70) score = 95;
    else if (winRate >= 60) score = 85;
    else if (winRate >= 55) score = 75;
    else if (winRate >= 50) score = 65;
    else if (winRate >= 45) score = 55;
    else if (winRate >= 40) score = 45;
    else if (winRate >= 35) score = 35;
    else score = 25;

    return { score, value: winRate, display: `${winRate.toFixed(1)}%` };
  }

  // 计算KDA评分
  calculateKDAScore(matches) {
    const totalKills = matches.reduce((sum, m) => sum + m.kills, 0);
    const totalDeaths = matches.reduce((sum, m) => sum + m.deaths, 0);
    const totalAssists = matches.reduce((sum, m) => sum + m.assists, 0);
    
    const avgKDA = totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : totalKills + totalAssists;
    
    let score;
    if (avgKDA >= 3.0) score = 95;
    else if (avgKDA >= 2.5) score = 85;
    else if (avgKDA >= 2.0) score = 75;
    else if (avgKDA >= 1.5) score = 65;
    else if (avgKDA >= 1.2) score = 55;
    else if (avgKDA >= 1.0) score = 45;
    else if (avgKDA >= 0.8) score = 35;
    else score = 25;

    return { score, value: avgKDA, display: avgKDA.toFixed(2) };
  }

  // 计算伤害评分
  calculateDamageScore(matches) {
    const avgDamage = matches.reduce((sum, m) => sum + m.totalDamageDealtToChampions, 0) / matches.length;
    
    let score;
    if (avgDamage >= 30000) score = 95;
    else if (avgDamage >= 25000) score = 85;
    else if (avgDamage >= 20000) score = 75;
    else if (avgDamage >= 15000) score = 65;
    else if (avgDamage >= 12000) score = 55;
    else if (avgDamage >= 10000) score = 45;
    else if (avgDamage >= 8000) score = 35;
    else score = 25;

    return { score, value: avgDamage, display: `${Math.round(avgDamage / 1000)}K` };
  }

  // 计算视野评分
  calculateVisionScore(matches) {
    const avgVision = matches.reduce((sum, m) => sum + m.visionScore, 0) / matches.length;
    
    let score;
    if (avgVision >= 60) score = 95;
    else if (avgVision >= 50) score = 85;
    else if (avgVision >= 40) score = 75;
    else if (avgVision >= 30) score = 65;
    else if (avgVision >= 25) score = 55;
    else if (avgVision >= 20) score = 45;
    else if (avgVision >= 15) score = 35;
    else score = 25;

    return { score, value: avgVision, display: Math.round(avgVision).toString() };
  }

  // 计算补刀评分
  calculateCSScore(matches) {
    const avgCS = matches.reduce((sum, m) => sum + m.totalMinionsKilled, 0) / matches.length;
    
    let score;
    if (avgCS >= 200) score = 95;
    else if (avgCS >= 180) score = 85;
    else if (avgCS >= 160) score = 75;
    else if (avgCS >= 140) score = 65;
    else if (avgCS >= 120) score = 55;
    else if (avgCS >= 100) score = 45;
    else if (avgCS >= 80) score = 35;
    else score = 25;

    return { score, value: avgCS, display: Math.round(avgCS).toString() };
  }

  // 计算经济评分
  calculateGoldScore(matches) {
    const avgGold = matches.reduce((sum, m) => sum + m.goldEarned, 0) / matches.length;
    
    let score;
    if (avgGold >= 18000) score = 95;
    else if (avgGold >= 16000) score = 85;
    else if (avgGold >= 14000) score = 75;
    else if (avgGold >= 12000) score = 65;
    else if (avgGold >= 10000) score = 55;
    else if (avgGold >= 8000) score = 45;
    else if (avgGold >= 6000) score = 35;
    else score = 25;

    return { score, value: avgGold, display: `${Math.round(avgGold / 1000)}K` };
  }

  // 计算稳定性评分
  calculateConsistencyScore(matches) {
    const kdas = matches.map(m => m.deaths > 0 ? (m.kills + m.assists) / m.deaths : m.kills + m.assists);
    const avgKDA = kdas.reduce((sum, kda) => sum + kda, 0) / kdas.length;
    
    // 计算标准差
    const variance = kdas.reduce((sum, kda) => sum + Math.pow(kda - avgKDA, 2), 0) / kdas.length;
    const stdDev = Math.sqrt(variance);
    
    // 稳定性评分：标准差越小，稳定性越高
    let score;
    if (stdDev <= 0.5) score = 95;
    else if (stdDev <= 0.8) score = 85;
    else if (stdDev <= 1.0) score = 75;
    else if (stdDev <= 1.3) score = 65;
    else if (stdDev <= 1.6) score = 55;
    else if (stdDev <= 2.0) score = 45;
    else if (stdDev <= 2.5) score = 35;
    else score = 25;

    return { score, value: stdDev, display: stdDev.toFixed(2) };
  }

  // 获取评分等级
  getScoreRank(score) {
    return this.scoreRanks.find(rank => score >= rank.min && score <= rank.max) || this.scoreRanks[this.scoreRanks.length - 1];
  }

  // 生成建议
  generateRecommendation(totalScore, details) {
    const weakestAspect = Object.entries(details)
      .sort((a, b) => a[1].score - b[1].score)[0];

    const recommendations = {
      winRate: '建议多练习基础操作，提高对线和团战能力',
      kda: '注意保护自己，减少不必要的死亡',
      damage: '提高输出效率，学习更好的技能连招',
      vision: '多买眼位，提高地图意识和视野控制',
      cs: '练习补刀，提高经济发育能力',
      gold: '优化装备选择，提高经济利用效率',
      consistency: '保持稳定发挥，避免大起大落'
    };

    if (totalScore >= 80) {
      return '表现优秀，继续保持！';
    } else if (totalScore >= 60) {
      return `表现不错，建议重点提升：${recommendations[weakestAspect[0]]}`;
    } else {
      return `需要加强练习，特别是：${recommendations[weakestAspect[0]]}`;
    }
  }

  // 生成聊天框消息
  generateChatMessage(scoreData, summonerName) {
    const { totalScore, rank, description, details, matchCount, recommendation } = scoreData;
    
    const message = [
      `=== ${summonerName} 战力评估 ===`,
      `综合评分: ${totalScore}分 (${rank}级 - ${description})`,
      `基于最近${matchCount}场比赛数据`,
      ``,
      `📊 详细数据:`,
      `胜率: ${details.winRate.display} | KDA: ${details.kda.display}`,
      `伤害: ${details.damage.display} | 视野: ${details.vision.display}`,
      `补刀: ${details.cs.display} | 经济: ${details.gold.display}`,
      ``,
      `💡 建议: ${recommendation}`,
      `=========================`
    ].join('\n');

    return message;
  }

  getDefaultScore() {
    return {
      totalScore: 50,
      rank: 'B+',
      color: '#66bb6a',
      description: '一般',
      details: {},
      matchCount: 0,
      recommendation: '暂无足够数据'
    };
  }
}

module.exports = PlayerScoring;
