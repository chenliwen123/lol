const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
require('dotenv').config();

// 导入数据模型
const Summoner = require('../server/models/Summoner');
const Match = require('../server/models/Match');

class SimpleCrawler {
  constructor() {
    this.baseUrl = process.env.ZHANGMENG_BASE_URL || 'https://lol.qq.com';
    this.delay = parseInt(process.env.CRAWLER_DELAY) || 1000;
    this.requestHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  async init() {
    console.log('🚀 初始化简单爬虫...');
    
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lol-stats');
    console.log('✅ 数据库连接成功');
  }

  // 生成模拟召唤师数据（用于演示）
  async createMockSummoner(summonerName, region = 'HN1') {
    try {
      console.log(`🎭 创建模拟召唤师数据: ${summonerName} (${region})`);

      // 为特定召唤师创建更真实的数据
      let mockData;
      if (summonerName === 'love丶小文') {
        mockData = {
          summonerName: summonerName,
          summonerId: `${region}_${summonerName}_${Date.now()}`,
          summonerLevel: 156, // 比较真实的等级
          region: region,
          profileIcon: {
            iconId: 4568,
            iconUrl: `https://ddragon.leagueoflegends.com/cdn/13.18.1/img/profileicon/4568.png`
          },
          rankInfo: {
            soloRank: {
              tier: 'GOLD',
              rank: 'III',
              leaguePoints: 67,
              wins: 89,
              losses: 76,
              winRate: 54
            },
            flexRank: {
              tier: 'SILVER',
              rank: 'I',
              leaguePoints: 23,
              wins: 34,
              losses: 28,
              winRate: 55
            }
          },
          stats: {
            totalGames: 165,
            totalWins: 89,
            totalLosses: 76
          },
          dataSource: 'mock',
          lastUpdated: new Date()
        };
      } else {
        // 通用模拟数据
        mockData = {
          summonerName: summonerName,
          summonerId: `${region}_${summonerName}_${Date.now()}`,
          summonerLevel: Math.floor(Math.random() * 200) + 30,
          region: region,
          profileIcon: {
            iconId: Math.floor(Math.random() * 100) + 1,
            iconUrl: `https://ddragon.leagueoflegends.com/cdn/13.18.1/img/profileicon/${Math.floor(Math.random() * 100) + 1}.png`
          },
          rankInfo: {
            soloRank: {
              tier: this.getRandomTier(),
              rank: this.getRandomRank(),
              leaguePoints: Math.floor(Math.random() * 100),
              wins: Math.floor(Math.random() * 100) + 20,
              losses: Math.floor(Math.random() * 80) + 10
            }
          },
          stats: {
            totalGames: 0,
            totalWins: 0,
            totalLosses: 0
          },
          dataSource: 'mock',
          lastUpdated: new Date()
        };
      }

      // 计算胜率
      const totalGames = mockData.rankInfo.soloRank.wins + mockData.rankInfo.soloRank.losses;
      mockData.rankInfo.soloRank.winRate = totalGames > 0 ? 
        Math.round((mockData.rankInfo.soloRank.wins / totalGames) * 100) : 0;

      // 保存到数据库
      const summoner = await this.saveSummonerData(mockData);
      
      // 生成一些模拟比赛记录
      await this.createMockMatches(summoner.summonerId, region, 10);
      
      console.log('✅ 模拟召唤师数据创建成功');
      return summoner;
    } catch (error) {
      console.error(`❌ 创建模拟召唤师失败:`, error);
      throw error;
    }
  }

  // 生成模拟比赛数据
  async createMockMatches(summonerId, region, count = 10) {
    // 为love丶小文创建更真实的英雄池
    const champions = summonerId.includes('love丶小文') ? [
      'Jinx', 'Caitlyn', 'Ezreal', 'Ashe', 'Vayne', // ADC主力
      'Thresh', 'Lulu', 'Morgana', // 偶尔辅助
      'Ahri', 'Lux', 'Yasuo' // 偶尔中单
    ] : [
      'Ahri', 'Yasuo', 'Zed', 'Jinx', 'Thresh', 'Lee Sin',
      'Garen', 'Lux', 'Ezreal', 'Ashe', 'Katarina', 'Darius',
      'Vayne', 'Riven', 'Blitzcrank', 'Morgana', 'Jhin', 'Caitlyn'
    ];

    const lanes = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
    const gameModes = ['CLASSIC', 'ARAM'];

    // 为love丶小文设置更真实的胜率和表现
    const isLoveXiaowen = summonerId.includes('love丶小文');
    
    for (let i = 0; i < count; i++) {
      const gameMode = gameModes[Math.floor(Math.random() * gameModes.length)];

      // 为love丶小文设置更真实的数据
      let win, kills, deaths, assists, championName, lane;

      if (isLoveXiaowen) {
        win = Math.random() > 0.46; // 54% 胜率，符合黄金段位
        // ADC位置为主
        lane = Math.random() > 0.8 ? lanes[Math.floor(Math.random() * lanes.length)] : 'BOTTOM';
        championName = lane === 'BOTTOM' ?
          champions.slice(0, 5)[Math.floor(Math.random() * 5)] : // ADC英雄
          champions[Math.floor(Math.random() * champions.length)];

        // ADC的KDA特点
        if (lane === 'BOTTOM') {
          kills = Math.floor(Math.random() * 15) + 3; // 3-18
          deaths = Math.floor(Math.random() * 8) + 2; // 2-10
          assists = Math.floor(Math.random() * 20) + 5; // 5-25
        } else {
          kills = Math.floor(Math.random() * 12) + 2;
          deaths = Math.floor(Math.random() * 10) + 3;
          assists = Math.floor(Math.random() * 15) + 3;
        }
      } else {
        win = Math.random() > 0.4; // 60% 胜率
        kills = Math.floor(Math.random() * 20);
        deaths = Math.floor(Math.random() * 12);
        assists = Math.floor(Math.random() * 25);
        championName = champions[Math.floor(Math.random() * champions.length)];
        lane = lanes[Math.floor(Math.random() * lanes.length)];
      }
      
      const matchData = {
        matchId: `${region}_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        gameId: `${Date.now()}${i}`,
        gameMode: gameMode,
        gameType: 'MATCHED_GAME',
        queueId: gameMode === 'CLASSIC' ? 420 : 450,
        gameCreation: new Date(Date.now() - (i * 24 * 60 * 60 * 1000) - Math.random() * 12 * 60 * 60 * 1000),
        gameDuration: Math.floor(Math.random() * 1800) + 900, // 15-45分钟
        mapId: gameMode === 'CLASSIC' ? 11 : 12,
        participants: [{
          summonerId: summonerId,
          summonerName: isLoveXiaowen ? 'love丶小文' : 'MockPlayer',
          teamId: 100,
          championId: Math.floor(Math.random() * 150) + 1,
          championName: championName,
          championLevel: Math.floor(Math.random() * 18) + 1,
          lane: lane,
          win: win,
          kills: kills,
          deaths: deaths,
          assists: assists,
          totalDamageDealtToChampions: Math.floor(Math.random() * 50000) + 10000,
          goldEarned: Math.floor(Math.random() * 20000) + 8000,
          totalMinionsKilled: Math.floor(Math.random() * 300) + 50,
          visionScore: Math.floor(Math.random() * 100) + 10,
          items: Array.from({length: 6}, () => ({
            itemId: Math.floor(Math.random() * 3000) + 1000,
            itemName: 'MockItem'
          })),
          spell1Id: Math.floor(Math.random() * 20) + 1,
          spell2Id: Math.floor(Math.random() * 20) + 1
        }],
        teams: [{
          teamId: 100,
          win: win,
          baronKills: Math.floor(Math.random() * 3),
          dragonKills: Math.floor(Math.random() * 5),
          towerKills: Math.floor(Math.random() * 11),
          firstBaron: Math.random() > 0.7,
          firstDragon: Math.random() > 0.5,
          firstTower: Math.random() > 0.5
        }],
        dataSource: 'mock',
        lastUpdated: new Date()
      };

      await this.saveMatchData(matchData);
    }
    
    console.log(`✅ 生成了 ${count} 场模拟比赛记录`);
  }

  getRandomTier() {
    const tiers = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
    const weights = [5, 15, 25, 30, 15, 8, 1.5, 0.4, 0.1]; // 权重分布
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (let i = 0; i < tiers.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return tiers[i];
      }
    }
    
    return 'SILVER'; // 默认
  }

  getRandomRank() {
    const ranks = ['IV', 'III', 'II', 'I'];
    return ranks[Math.floor(Math.random() * ranks.length)];
  }

  async saveSummonerData(data) {
    try {
      const summoner = await Summoner.findOneAndUpdate(
        { summonerId: data.summonerId },
        data,
        { upsert: true, new: true, runValidators: true }
      );
      return summoner;
    } catch (error) {
      console.error('❌ 保存召唤师数据失败:', error);
      throw error;
    }
  }

  async saveMatchData(data) {
    try {
      const match = await Match.findOneAndUpdate(
        { matchId: data.matchId },
        data,
        { upsert: true, new: true, runValidators: true }
      );
      return match;
    } catch (error) {
      console.error('❌ 保存比赛数据失败:', error);
      throw error;
    }
  }

  async close() {
    await mongoose.disconnect();
    console.log('🔒 数据库连接已关闭');
  }
}

// 主函数
async function main() {
  const crawler = new SimpleCrawler();
  
  try {
    await crawler.init();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'mock';
    
    switch (command) {
      case 'mock':
        const summonerName = args[1] || 'TestPlayer';
        const region = args[2] || 'HN1';
        await crawler.createMockSummoner(summonerName, region);
        break;
        
      case 'batch':
        const names = args.slice(1);
        if (names.length === 0) {
          names.push('Player1', 'Player2', 'Player3');
        }
        
        for (const name of names) {
          await crawler.createMockSummoner(name, 'HN1');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        break;
        
      default:
        console.log('使用方法:');
        console.log('  node crawler/simple-crawler.js mock [召唤师名称] [区域]');
        console.log('  node crawler/simple-crawler.js batch [召唤师1] [召唤师2] ...');
    }
    
  } catch (error) {
    console.error('❌ 爬虫运行失败:', error);
  } finally {
    await crawler.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleCrawler;
