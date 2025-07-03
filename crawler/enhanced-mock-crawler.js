const mongoose = require('mongoose');
require('dotenv').config();

// 导入数据模型
const Summoner = require('../server/models/Summoner');
const Match = require('../server/models/Match');
const { getChineseChampionName } = require('../server/utils/championNames');
const { inferLane } = require('../server/utils/laneTranslator');

class EnhancedMockCrawler {
  constructor() {
    this.realPlayerProfiles = {
      love丶小文: {
        level: 156,
        mainRole: 'ADC',
        favoriteChampions: [
          '暴走萝莉',
          '皮城女警',
          '探险家',
          '寒冰射手',
          '暗夜猎手',
        ],
        secondaryChampions: [
          '魂锁典狱长',
          '仙灵女巫',
          '堕落天使',
          '九尾妖狐',
          '光辉女郎',
        ],
        soloRank: { tier: 'GOLD', rank: 'III', lp: 67, wins: 89, losses: 76 },
        flexRank: { tier: 'SILVER', rank: 'I', lp: 23, wins: 34, losses: 28 },
        playStyle: 'aggressive', // aggressive, defensive, balanced
        skillLevel: 'intermediate', // beginner, intermediate, advanced
      },
      // 可以添加更多真实玩家档案
      默认玩家: {
        level: Math.floor(Math.random() * 200) + 30,
        mainRole: ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'][
          Math.floor(Math.random() * 5)
        ],
        favoriteChampions: this.getRandomChampions(5),
        secondaryChampions: this.getRandomChampions(5),
        soloRank: this.generateRandomRank(),
        flexRank: this.generateRandomRank(),
        playStyle: ['aggressive', 'defensive', 'balanced'][
          Math.floor(Math.random() * 3)
        ],
        skillLevel: ['beginner', 'intermediate', 'advanced'][
          Math.floor(Math.random() * 3)
        ],
      },
    };
  }

  async init() {
    console.log('🚀 初始化增强模拟数据爬虫...');
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/lol-stats'
    );
    console.log('✅ 数据库连接成功');
  }

  // 生成基于真实玩家档案的数据
  async crawlSummoner(summonerName, region = 'WT1') {
    try {
      console.log(`🎭 为 ${summonerName} 生成增强真实风格数据...`);

      // 获取玩家档案
      const profile =
        this.realPlayerProfiles[summonerName] ||
        this.realPlayerProfiles['默认玩家'];

      // 生成召唤师数据
      const summonerData = this.generateSummonerData(
        summonerName,
        region,
        profile
      );

      // 保存召唤师数据
      const savedSummoner = await this.saveSummonerData(summonerData);

      // 生成比赛记录
      const matches = await this.generateMatchHistory(
        savedSummoner.summonerId,
        region,
        profile,
        30
      );

      // 分析近30天战绩
      const recentStats = await this.analyzeRecentMatches(
        savedSummoner.summonerId,
        matches
      );

      // 更新召唤师数据包含战绩分析
      savedSummoner.recentStats = { last30Days: recentStats };
      await this.saveSummonerData(savedSummoner);

      console.log('✅ 增强模拟数据生成完成');
      console.log('📊 近30天战绩分析:');
      console.log(
        `   总场次: ${recentStats.totalGames}, 胜率: ${recentStats.winRate}%`
      );
      console.log(
        `   最常用英雄: ${recentStats.mostPlayedChampions
          .slice(0, 3)
          .map((c) => `${c.championName}(${c.games}场)`)
          .join(', ')}`
      );
      console.log(
        `   表现最佳英雄: ${recentStats.bestPerformingChampions
          .slice(0, 3)
          .map((c) => `${c.championName}(${c.winRate}%胜率)`)
          .join(', ')}`
      );

      return savedSummoner;
    } catch (error) {
      console.error(`❌ 生成数据失败:`, error.message);
      throw error;
    }
  }

  // 生成召唤师数据
  generateSummonerData(summonerName, region, profile) {
    return {
      summonerName: summonerName,
      summonerId: `${region}_${summonerName}_enhanced_${Date.now()}`,
      summonerLevel: profile.level,
      region: region,
      profileIcon: {
        iconId: Math.floor(Math.random() * 100) + 1,
        iconUrl: `https://ddragon.leagueoflegends.com/cdn/13.18.1/img/profileicon/${
          Math.floor(Math.random() * 100) + 1
        }.png`,
      },
      rankInfo: {
        soloRank: profile.soloRank
          ? {
              tier: profile.soloRank.tier,
              rank: profile.soloRank.rank,
              leaguePoints: profile.soloRank.lp,
              wins: profile.soloRank.wins,
              losses: profile.soloRank.losses,
              winRate: Math.round(
                (profile.soloRank.wins /
                  (profile.soloRank.wins + profile.soloRank.losses)) *
                  100
              ),
            }
          : null,
        flexRank: profile.flexRank
          ? {
              tier: profile.flexRank.tier,
              rank: profile.flexRank.rank,
              leaguePoints: profile.flexRank.lp,
              wins: profile.flexRank.wins,
              losses: profile.flexRank.losses,
              winRate: Math.round(
                (profile.flexRank.wins /
                  (profile.flexRank.wins + profile.flexRank.losses)) *
                  100
              ),
            }
          : null,
      },
      stats: {
        totalGames:
          profile.soloRank.wins +
          profile.soloRank.losses +
          (profile.flexRank?.wins || 0) +
          (profile.flexRank?.losses || 0),
        totalWins: profile.soloRank.wins + (profile.flexRank?.wins || 0),
        totalLosses: profile.soloRank.losses + (profile.flexRank?.losses || 0),
      },
      recentStats: {
        last30Days: {
          totalGames: 0,
          totalWins: 0,
          totalLosses: 0,
          winRate: 0,
          mostPlayedChampions: [],
          bestPerformingChampions: [],
          averageKDA: { kills: 0, deaths: 0, assists: 0 },
          roleDistribution: {},
          lastUpdated: new Date(),
        },
      },
      dataSource: 'enhanced_mock',
      lastUpdated: new Date(),
    };
  }

  // 生成比赛历史
  async generateMatchHistory(summonerId, region, profile, count) {
    console.log(`🎮 生成 ${count} 场真实风格比赛记录...`);

    const matches = [];
    for (let i = 0; i < count; i++) {
      const match = this.generateRealisticMatch(summonerId, region, profile, i);
      await this.saveMatchData(match);
      matches.push(match);
    }

    return matches;
  }

  // 生成真实风格的比赛
  generateRealisticMatch(summonerId, region, profile, index) {
    // 根据玩家档案调整胜率
    let baseWinRate = 0.5;
    if (profile.skillLevel === 'advanced') baseWinRate = 0.65;
    else if (profile.skillLevel === 'intermediate') baseWinRate = 0.54;
    else baseWinRate = 0.45;

    const win = Math.random() < baseWinRate;

    // 选择英雄（80%概率选择主力英雄）
    const championPool =
      Math.random() < 0.8
        ? profile.favoriteChampions
        : profile.secondaryChampions;
    const championName =
      championPool[Math.floor(Math.random() * championPool.length)];

    // 根据主要位置生成数据，优先使用英雄推断路线
    let lane = inferLane(championName, profile.mainRole);

    // 30%概率使用其他路线（模拟位置变化）
    if (Math.random() < 0.3) {
      lane = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'][
        Math.floor(Math.random() * 5)
      ];
    }

    // 根据位置和英雄生成KDA
    const kda = this.generateRealisticKDA(lane, championName, win, profile);

    // 生成游戏时长（15-45分钟）
    const gameDuration = Math.floor(Math.random() * 1800) + 900;

    // 生成游戏创建时间（最近30天内）
    const gameCreation = new Date(
      Date.now() -
        index * 24 * 60 * 60 * 1000 -
        Math.random() * 12 * 60 * 60 * 1000
    );

    return {
      matchId: `enhanced_${region}_${Date.now()}_${index}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      gameId: `${Date.now()}${index}`,
      gameMode: Math.random() > 0.85 ? 'ARAM' : 'CLASSIC',
      gameType: 'MATCHED_GAME',
      queueId: Math.random() > 0.85 ? 450 : 420,
      gameCreation: gameCreation,
      gameDuration: gameDuration,
      mapId: Math.random() > 0.85 ? 12 : 11,
      participants: [
        {
          summonerId: summonerId,
          summonerName: profile.summonerName || 'Player',
          teamId: 100,
          championId: Math.floor(Math.random() * 150) + 1,
          championName: championName,
          championLevel: Math.floor(Math.random() * 18) + 1,
          lane: lane,
          win: win,
          kills: kda.kills,
          deaths: kda.deaths,
          assists: kda.assists,
          totalDamageDealtToChampions: this.generateDamage(
            lane,
            gameDuration,
            win
          ),
          goldEarned: this.generateGold(lane, gameDuration, win),
          totalMinionsKilled: this.generateCS(lane, gameDuration),
          visionScore: this.generateVisionScore(lane, gameDuration),
          items: this.generateItems(lane, championName, win),
          summoner1Id: this.generateSummonerSpell(lane, true),
          summoner2Id: this.generateSummonerSpell(lane, false),
          runes: this.generateRunes(lane, championName),
          perks: this.generatePerks(lane, championName),
        },
      ],
      teams: this.generateTeamStats(win),
      dataSource: 'enhanced_mock',
      lastUpdated: new Date(),
    };
  }

  // 生成真实的KDA数据
  generateRealisticKDA(lane, championName, win, profile) {
    let baseKills, baseDeaths, baseAssists;

    // 根据位置调整基础数值
    switch (lane) {
      case 'BOTTOM': // ADC
        baseKills = win ? [8, 15] : [4, 10];
        baseDeaths = win ? [2, 6] : [4, 9];
        baseAssists = [6, 20];
        break;
      case 'MIDDLE':
        baseKills = win ? [7, 14] : [3, 9];
        baseDeaths = win ? [2, 7] : [4, 10];
        baseAssists = [4, 15];
        break;
      case 'TOP':
        baseKills = win ? [5, 12] : [2, 7];
        baseDeaths = win ? [2, 6] : [3, 8];
        baseAssists = [3, 12];
        break;
      case 'JUNGLE':
        baseKills = win ? [6, 13] : [3, 8];
        baseDeaths = win ? [3, 7] : [4, 9];
        baseAssists = [8, 18];
        break;
      case 'UTILITY': // 辅助
        baseKills = win ? [1, 5] : [0, 3];
        baseDeaths = win ? [2, 6] : [3, 8];
        baseAssists = [10, 25];
        break;
      default:
        baseKills = [3, 10];
        baseDeaths = [3, 8];
        baseAssists = [5, 15];
    }

    // 根据玩家风格调整
    if (profile.playStyle === 'aggressive') {
      baseKills[0] += 2;
      baseKills[1] += 3;
      baseDeaths[0] += 1;
      baseDeaths[1] += 2;
    } else if (profile.playStyle === 'defensive') {
      baseKills[0] -= 1;
      baseKills[1] -= 2;
      baseDeaths[0] -= 1;
      baseDeaths[1] -= 2;
      baseAssists[0] += 2;
      baseAssists[1] += 3;
    }

    return {
      kills: Math.max(
        0,
        Math.floor(Math.random() * (baseKills[1] - baseKills[0] + 1)) +
          baseKills[0]
      ),
      deaths: Math.max(
        0,
        Math.floor(Math.random() * (baseDeaths[1] - baseDeaths[0] + 1)) +
          baseDeaths[0]
      ),
      assists: Math.max(
        0,
        Math.floor(Math.random() * (baseAssists[1] - baseAssists[0] + 1)) +
          baseAssists[0]
      ),
    };
  }

  // 分析近30天战绩
  async analyzeRecentMatches(summonerId, matches) {
    console.log('📊 分析近30天战绩数据...');

    // 过滤近30天的比赛
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentMatches = matches.filter(
      (match) => new Date(match.gameCreation) >= thirtyDaysAgo
    );

    if (recentMatches.length === 0) {
      return this.getEmptyStats();
    }

    // 统计基础数据
    const totalGames = recentMatches.length;
    const totalWins = recentMatches.filter(
      (match) => match.participants[0].win
    ).length;
    const totalLosses = totalGames - totalWins;
    const winRate =
      totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

    // 英雄使用统计
    const championStats = {};
    const roleStats = {};
    let totalKills = 0,
      totalDeaths = 0,
      totalAssists = 0;

    recentMatches.forEach((match) => {
      const participant = match.participants[0];
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
          totalDamage: 0,
          winRate: 0,
          avgKDA: 0,
        };
      }

      const champStat = championStats[championName];
      champStat.games++;
      if (win) champStat.wins++;
      else champStat.losses++;
      champStat.kills += participant.kills;
      champStat.deaths += participant.deaths;
      champStat.assists += participant.assists;
      champStat.totalDamage += participant.totalDamageDealtToChampions || 0;

      // 统计位置数据
      roleStats[lane] = (roleStats[lane] || 0) + 1;

      // 累计KDA
      totalKills += participant.kills;
      totalDeaths += participant.deaths;
      totalAssists += participant.assists;
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
      stat.avgDamage = Math.round(stat.totalDamage / stat.games);
    });

    // 最常使用的英雄（按游戏场次排序）
    const mostPlayedChampions = Object.values(championStats)
      .sort((a, b) => b.games - a.games)
      .slice(0, 5);

    // 表现最佳的英雄（按胜率和KDA综合排序，至少3场游戏）
    const bestPerformingChampions = Object.values(championStats)
      .filter((stat) => stat.games >= 3)
      .sort((a, b) => {
        // 综合评分：胜率权重60%，KDA权重40%
        const scoreA = a.winRate * 0.6 + Math.min(a.avgKDA * 10, 40) * 0.4;
        const scoreB = b.winRate * 0.6 + Math.min(b.avgKDA * 10, 40) * 0.4;
        return scoreB - scoreA;
      })
      .slice(0, 5);

    // 如果没有足够的数据，按胜率排序
    if (bestPerformingChampions.length === 0) {
      bestPerformingChampions.push(
        ...Object.values(championStats)
          .sort((a, b) => b.winRate - a.winRate)
          .slice(0, 3)
      );
    }

    return {
      totalGames,
      totalWins,
      totalLosses,
      winRate,
      mostPlayedChampions,
      bestPerformingChampions,
      averageKDA: {
        kills: Number((totalKills / totalGames).toFixed(1)),
        deaths: Number((totalDeaths / totalGames).toFixed(1)),
        assists: Number((totalAssists / totalGames).toFixed(1)),
        ratio:
          totalDeaths > 0
            ? Number(((totalKills + totalAssists) / totalDeaths).toFixed(2))
            : totalKills + totalAssists,
      },
      roleDistribution: roleStats,
      championStats: Object.values(championStats),
      lastUpdated: new Date(),
    };
  }

  // 获取空统计数据
  getEmptyStats() {
    return {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      winRate: 0,
      mostPlayedChampions: [],
      bestPerformingChampions: [],
      averageKDA: { kills: 0, deaths: 0, assists: 0, ratio: 0 },
      roleDistribution: {},
      championStats: [],
      lastUpdated: new Date(),
    };
  }

  // 其他辅助方法
  getRoleToLane(role) {
    const roleMap = {
      TOP: 'TOP',
      JUNGLE: 'JUNGLE',
      MIDDLE: 'MIDDLE',
      ADC: 'BOTTOM',
      SUPPORT: 'UTILITY',
    };
    return roleMap[role] || 'MIDDLE';
  }

  generateDamage(lane, duration, win) {
    const base = lane === 'BOTTOM' || lane === 'MIDDLE' ? 25000 : 18000;
    const modifier = win ? 1.2 : 0.8;
    const timeModifier = duration / 1800; // 30分钟基准
    return Math.floor(base * modifier * timeModifier + Math.random() * 10000);
  }

  generateGold(lane, duration, win) {
    const base = 12000;
    const modifier = win ? 1.15 : 0.85;
    const timeModifier = duration / 1800;
    return Math.floor(base * modifier * timeModifier + Math.random() * 5000);
  }

  generateCS(lane, duration) {
    if (lane === 'UTILITY') return Math.floor(Math.random() * 30) + 10;
    const base = lane === 'JUNGLE' ? 120 : 160;
    const timeModifier = duration / 1800;
    return Math.floor(base * timeModifier + Math.random() * 50);
  }

  generateVisionScore(lane, duration) {
    const base = lane === 'UTILITY' ? 80 : lane === 'JUNGLE' ? 60 : 30;
    const timeModifier = duration / 1800;
    return Math.floor(base * timeModifier + Math.random() * 20);
  }

  // 生成装备
  generateItems(lane, championName, win) {
    const itemSets = {
      BOTTOM: {
        // ADC装备
        core: [3006, 3031, 3094, 3072, 3036], // 狂战士胫甲、无尽之刃、疾射火炮、血渴者、最后的轻语
        situational: [3026, 3156, 3139, 3033, 3046], // 守护天使、魔切、水银弯刀、魔抗斗篷、幻影之舞
        boots: [3006, 3047], // 狂战士胫甲、忍者足具
        starter: [1055, 2003], // 多兰之刃、生命药水
      },
      MIDDLE: {
        // 中单装备
        core: [3020, 3089, 3135, 3157, 3116], // 法师之靴、拉巴顿的死亡之帽、虚空之杖、中娅沙漏、瑞莱的冰晶节杖
        situational: [3102, 3165, 3151, 3003, 3041], // 班西的面纱、莫雷洛秘典、利安德里的痛苦、大天使之杖、梅贾的窃魂卷
        boots: [3020, 3111], // 法师之靴、水银之靴
        starter: [1056, 2003], // 多兰之戒、生命药水
      },
      TOP: {
        // 上单装备
        core: [3047, 3071, 3053, 3065, 3742], // 忍者足具、黑色切割者、狂徒铠甲、振奋铠甲、死亡之舞
        situational: [3026, 3143, 3075, 3068, 3083], // 守护天使、兰德里的折磨、荆棘之甲、日炎斗篷、暖钢护手
        boots: [3047, 3111], // 忍者足具、水银之靴
        starter: [1054, 2003], // 多兰之盾、生命药水
      },
      JUNGLE: {
        // 打野装备
        core: [1400, 3047, 3071, 3053, 3065], // 打野刀、忍者足具、黑色切割者、狂徒铠甲、振奋铠甲
        situational: [3026, 3143, 3075, 3068, 3083], // 守护天使、兰德里的折磨、荆棘之甲、日炎斗篷、暖钢护手
        boots: [3047, 3111], // 忍者足具、水银之靴
        starter: [1039, 2003], // 猎人的护身符、生命药水
      },
      UTILITY: {
        // 辅助装备
        core: [3117, 3107, 3190, 3222, 3504], // 辅助装备、救赎、钢铁烈阳之匣、米凯尔的坩埚、阿德拉的残骸
        situational: [3109, 3105, 3193, 3050, 3001], // 骑士之誓、军团圣盾、石像鬼石板甲、冰霜之心、深渊面具
        boots: [3117, 3111], // 机动之靴、水银之靴
        starter: [3850, 2003], // 圣物之盾、生命药水
      },
    };

    const laneItems = itemSets[lane] || itemSets['MIDDLE'];
    const items = [];

    // 根据游戏结果和时长决定装备完成度
    const itemCount = win
      ? Math.floor(Math.random() * 2) + 5
      : Math.floor(Math.random() * 2) + 4; // 4-6件装备

    // 添加核心装备
    const coreItems = [...laneItems.core]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    items.push(...coreItems);

    // 添加情况装备
    const situationalItems = [...laneItems.situational]
      .sort(() => 0.5 - Math.random())
      .slice(0, itemCount - 3);
    items.push(...situationalItems);

    // 确保有6个装备槽
    while (items.length < 6) {
      items.push(0); // 空装备槽
    }

    return items.slice(0, 6).map((itemId, index) => ({
      slot: index,
      itemId: itemId,
      itemName: this.getItemName(itemId),
    }));
  }

  // 生成召唤师技能
  generateSummonerSpell(lane, isFirst) {
    const spellSets = {
      BOTTOM: isFirst ? [4, 7] : [4, 7], // 闪现、治疗
      MIDDLE: isFirst ? [4, 14] : [4, 21], // 闪现、点燃/传送
      TOP: isFirst ? [4, 12] : [4, 21], // 闪现、传送/点燃
      JUNGLE: isFirst ? [4, 11] : [4, 11], // 闪现、惩戒
      UTILITY: isFirst ? [4, 3] : [4, 3], // 闪现、虚弱
    };

    const spells = spellSets[lane] || [4, 14];
    return spells[isFirst ? 0 : Math.floor(Math.random() * spells.length)];
  }

  // 生成符文
  generateRunes(lane, championName) {
    const runeSets = {
      BOTTOM: {
        primary: 'Precision', // 精密系
        primaryRunes: [8005, 9111, 9103, 8014], // 强攻、凯旋、传说：欢欣、致命一击
        secondary: 'Inspiration', // 启迪系
        secondaryRunes: [8304, 8347], // 神奇之鞋、饼干配送
        statRunes: [5008, 5008, 5002], // 攻击速度、攻击速度、护甲
      },
      MIDDLE: {
        primary: 'Domination', // 主宰系
        primaryRunes: [8112, 8139, 8138, 8135], // 电刑、血之滋味、眼球收集器、无情猎手
        secondary: 'Precision', // 精密系
        secondaryRunes: [9111, 8014], // 凯旋、致命一击
        statRunes: [5008, 5008, 5002], // 法术强度、法术强度、护甲
      },
      TOP: {
        primary: 'Resolve', // 坚决系
        primaryRunes: [8465, 8463, 8473, 8451], // 余震、护盾猛击、骸骨镀层、过度生长
        secondary: 'Precision', // 精密系
        secondaryRunes: [9111, 8014], // 凯旋、致命一击
        statRunes: [5008, 5008, 5002], // 攻击速度、护甲、护甲
      },
      JUNGLE: {
        primary: 'Precision', // 精密系
        primaryRunes: [8021, 9111, 9103, 8017], // 征服者、凯旋、传说：欢欣、坚毅不倒
        secondary: 'Domination', // 主宰系
        secondaryRunes: [8139, 8135], // 血之滋味、无情猎手
        statRunes: [5008, 5008, 5002], // 攻击速度、攻击速度、护甲
      },
      UTILITY: {
        primary: 'Resolve', // 坚决系
        primaryRunes: [8465, 8463, 8473, 8451], // 余震、护盾猛击、骸骨镀层、过度生长
        secondary: 'Inspiration', // 启迪系
        secondaryRunes: [8304, 8347], // 神奇之鞋、饼干配送
        statRunes: [5008, 5008, 5002], // 护甲、魔抗、生命值
      },
    };

    return runeSets[lane] || runeSets['MIDDLE'];
  }

  // 生成天赋
  generatePerks(lane, championName) {
    // 这里可以根据英雄和位置生成更详细的天赋配置
    return {
      perkIds: [8005, 9111, 9103, 8014, 8304, 8347], // 主要符文ID
      perkStyle: 8000, // 精密系
      perkSubStyle: 8300, // 启迪系
    };
  }

  // 获取装备名称
  getItemName(itemId) {
    const itemNames = {
      0: '空',
      1055: '多兰之刃',
      1056: '多兰之戒',
      1054: '多兰之盾',
      2003: '生命药水',
      3006: '狂战士胫甲',
      3020: '法师之靴',
      3047: '忍者足具',
      3111: '水银之靴',
      3117: '机动之靴',
      3031: '无尽之刃',
      3089: '拉巴顿的死亡之帽',
      3071: '黑色切割者',
      3094: '疾射火炮',
      3135: '虚空之杖',
      3157: '中娅沙漏',
      3026: '守护天使',
      3053: '狂徒铠甲',
      3065: '振奋铠甲',
      3072: '血渴者',
      3036: '最后的轻语',
      3156: '魔切',
      3139: '水银弯刀',
      3116: '瑞莱的冰晶节杖',
      3190: '钢铁烈阳之匣',
      3222: '米凯尔的坩埚',
    };

    return itemNames[itemId] || `装备${itemId}`;
  }

  generateTeamStats(win) {
    return [
      {
        teamId: 100,
        win: win,
        baronKills: win
          ? Math.floor(Math.random() * 3)
          : Math.floor(Math.random() * 2),
        dragonKills: win
          ? Math.floor(Math.random() * 4) + 1
          : Math.floor(Math.random() * 3),
        towerKills: win
          ? Math.floor(Math.random() * 8) + 3
          : Math.floor(Math.random() * 5),
        firstBaron: win ? Math.random() > 0.3 : Math.random() > 0.7,
        firstDragon: win ? Math.random() > 0.4 : Math.random() > 0.6,
        firstTower: win ? Math.random() > 0.4 : Math.random() > 0.6,
      },
      {
        teamId: 200,
        win: !win,
        baronKills: !win
          ? Math.floor(Math.random() * 3)
          : Math.floor(Math.random() * 2),
        dragonKills: !win
          ? Math.floor(Math.random() * 4) + 1
          : Math.floor(Math.random() * 3),
        towerKills: !win
          ? Math.floor(Math.random() * 8) + 3
          : Math.floor(Math.random() * 5),
        firstBaron: !win ? Math.random() > 0.3 : Math.random() > 0.7,
        firstDragon: !win ? Math.random() > 0.4 : Math.random() > 0.6,
        firstTower: !win ? Math.random() > 0.4 : Math.random() > 0.6,
      },
    ];
  }

  getRandomChampions(count) {
    const champions = [
      '九尾妖狐',
      '疾风剑豪',
      '影流之主',
      '暴走萝莉',
      '魂锁典狱长',
      '盲僧',
      '德玛西亚之力',
      '光辉女郎',
      '探险家',
      '寒冰射手',
      '不祥之刃',
      '诺克萨斯之手',
      '暗夜猎手',
      '放逐之刃',
      '蒸汽机器人',
      '堕落天使',
      '戏命师',
      '皮城女警',
      '圣枪游侠',
      '虚空之女',
      '逆羽',
      '荣耀行刑官',
    ];
    return champions.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  generateRandomRank() {
    const tiers = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
    const ranks = ['IV', 'III', 'II', 'I'];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const wins = Math.floor(Math.random() * 100) + 20;
    const losses = Math.floor(Math.random() * 80) + 10;

    return {
      tier: tier,
      rank: rank,
      lp: Math.floor(Math.random() * 100),
      wins: wins,
      losses: losses,
    };
  }

  async saveSummonerData(data) {
    try {
      // 检查是否已存在召唤师
      const existingSummoner = await Summoner.findOne({
        $or: [
          { summonerId: data.summonerId },
          { summonerName: data.summonerName, region: data.region },
        ],
      });

      let summoner;
      if (existingSummoner) {
        console.log(`🔄 更新现有召唤师: ${data.summonerName}`);

        // 智能合并数据
        const mergedData = this.mergeExistingData(existingSummoner, data);

        summoner = await Summoner.findOneAndUpdate(
          { _id: existingSummoner._id },
          mergedData,
          { new: true, runValidators: true }
        );

        console.log(`✅ 召唤师数据更新成功: ${data.summonerName}`);
      } else {
        console.log(`➕ 创建新召唤师: ${data.summonerName}`);
        summoner = await Summoner.create({
          ...data,
          lastUpdated: new Date(),
          createdAt: new Date(),
        });
        console.log(`✅ 召唤师数据保存成功: ${data.summonerName}`);
      }

      return summoner;
    } catch (error) {
      console.error('❌ 保存召唤师数据失败:', error);
      throw error;
    }
  }

  // 智能合并现有数据和新数据
  mergeExistingData(existing, newData) {
    const merged = { ...newData };

    // 保留更高的等级
    if (
      existing.summonerLevel &&
      existing.summonerLevel > (newData.summonerLevel || 0)
    ) {
      merged.summonerLevel = existing.summonerLevel;
    }

    // 合并排位信息（保留更高的排位）
    if (existing.rankInfo) {
      merged.rankInfo = merged.rankInfo || {};

      // 单排排位
      if (
        existing.rankInfo.soloRank &&
        (!merged.rankInfo.soloRank ||
          this.compareRank(
            existing.rankInfo.soloRank,
            merged.rankInfo.soloRank
          ) > 0)
      ) {
        merged.rankInfo.soloRank = existing.rankInfo.soloRank;
      }

      // 灵活排位
      if (
        existing.rankInfo.flexRank &&
        (!merged.rankInfo.flexRank ||
          this.compareRank(
            existing.rankInfo.flexRank,
            merged.rankInfo.flexRank
          ) > 0)
      ) {
        merged.rankInfo.flexRank = existing.rankInfo.flexRank;
      }
    }

    // 合并统计数据（取最大值，避免数据倒退）
    if (existing.stats && newData.stats) {
      merged.stats = {
        totalGames: Math.max(
          existing.stats.totalGames || 0,
          newData.stats.totalGames || 0
        ),
        totalWins: Math.max(
          existing.stats.totalWins || 0,
          newData.stats.totalWins || 0
        ),
        totalLosses: Math.max(
          existing.stats.totalLosses || 0,
          newData.stats.totalLosses || 0
        ),
        overallWinRate:
          newData.stats.overallWinRate || existing.stats.overallWinRate,
      };
    } else if (existing.stats && !newData.stats) {
      merged.stats = existing.stats;
    }

    // 保留现有的头像（如果新数据没有）
    if (!merged.profileIcon && existing.profileIcon) {
      merged.profileIcon = existing.profileIcon;
    }

    // 保留创建时间，更新修改时间
    merged.createdAt = existing.createdAt;
    merged.lastUpdated = new Date();
    merged.updatedAt = new Date();

    // 合并数据来源信息
    if (existing.dataSource !== newData.dataSource) {
      merged.dataSourceHistory = existing.dataSourceHistory || [];
      if (!merged.dataSourceHistory.includes(existing.dataSource)) {
        merged.dataSourceHistory.push(existing.dataSource);
      }
    }

    return merged;
  }

  // 比较排位高低 (返回 1 表示 rank1 更高, -1 表示 rank2 更高, 0 表示相等)
  compareRank(rank1, rank2) {
    const tierOrder = {
      IRON: 1,
      BRONZE: 2,
      SILVER: 3,
      GOLD: 4,
      PLATINUM: 5,
      DIAMOND: 6,
      MASTER: 7,
      GRANDMASTER: 8,
      CHALLENGER: 9,
    };

    const rankOrder = { IV: 1, III: 2, II: 3, I: 4 };

    const tier1 = tierOrder[rank1.tier] || 0;
    const tier2 = tierOrder[rank2.tier] || 0;

    if (tier1 !== tier2) {
      return tier1 - tier2;
    }

    const rankNum1 = rankOrder[rank1.rank] || 0;
    const rankNum2 = rankOrder[rank2.rank] || 0;

    if (rankNum1 !== rankNum2) {
      return rankNum1 - rankNum2;
    }

    return (rank1.leaguePoints || 0) - (rank2.leaguePoints || 0);
  }

  async saveMatchData(data) {
    try {
      const match = await Match.findOneAndUpdate(
        { matchId: data.matchId },
        { ...data, lastUpdated: new Date() },
        { upsert: true, new: true, runValidators: true }
      );
      return match;
    } catch (error) {
      console.error('❌ 保存比赛数据失败:', error);
    }
  }

  async close() {
    await mongoose.disconnect();
    console.log('🔒 数据库连接已关闭');
  }
}

// 主程序入口
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const summonerName = args[1] || 'love丶小文';
  const region = args[2] || 'WT1';

  const crawler = new EnhancedMockCrawler();

  try {
    await crawler.init();

    switch (command) {
      case 'single':
        console.log(`🎯 生成召唤师增强数据: ${summonerName} (${region})`);
        const result = await crawler.crawlSummoner(summonerName, region);
        console.log('✅ 增强数据生成完成:', result.summonerName);
        break;

      default:
        console.log('使用方法:');
        console.log(
          '  node crawler/enhanced-mock-crawler.js single "召唤师名称" "区域"'
        );
        console.log('');
        console.log('示例:');
        console.log(
          '  node crawler/enhanced-mock-crawler.js single "love丶小文" WT1'
        );
    }
  } catch (error) {
    console.error('❌ 增强模拟爬虫运行失败:', error);
  } finally {
    await crawler.close();
  }
}

// 如果直接运行此文件，执行主程序
if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnhancedMockCrawler;
