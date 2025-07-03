const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const mongoose = require('mongoose');
require('dotenv').config();

// 导入数据模型
const Summoner = require('../server/models/Summoner');
const Match = require('../server/models/Match');

class LCUCrawler {
  constructor() {
    this.lcuPort = null;
    this.lcuToken = null;
    this.lcuPassword = null;
    this.baseUrl = null;
    this.axiosInstance = null;
  }

  async init() {
    console.log('🚀 初始化LCU爬虫...');
    
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lol-stats');
    console.log('✅ 数据库连接成功');
    
    // 获取LCU连接信息
    await this.getLCUConnectionInfo();
    
    if (this.lcuPort && this.lcuToken) {
      this.setupAxiosInstance();
      console.log('✅ LCU连接成功');
    } else {
      throw new Error('无法连接到LOL客户端，请确保游戏客户端已启动');
    }
  }

  // 获取LCU连接信息
  async getLCUConnectionInfo() {
    try {
      console.log('🔍 查找LOL客户端进程...');
      
      // 查找LOL客户端进程
      const command = 'wmic PROCESS WHERE name="LeagueClientUx.exe" GET commandline';
      
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ 未找到LOL客户端进程');
            reject(new Error('LOL客户端未启动'));
            return;
          }
          
          // 解析命令行参数
          const lines = stdout.split('\n');
          for (const line of lines) {
            if (line.includes('--app-port=') && line.includes('--remoting-auth-token=')) {
              const portMatch = line.match(/--app-port=(\d+)/);
              const tokenMatch = line.match(/--remoting-auth-token=([\w-]+)/);
              
              if (portMatch && tokenMatch) {
                this.lcuPort = portMatch[1];
                this.lcuToken = tokenMatch[1];
                this.lcuPassword = 'riot:' + this.lcuToken;
                this.baseUrl = `https://127.0.0.1:${this.lcuPort}`;
                
                console.log(`✅ 找到LCU连接信息: 端口=${this.lcuPort}`);
                resolve();
                return;
              }
            }
          }
          
          reject(new Error('无法解析LCU连接信息'));
        });
      });
      
    } catch (error) {
      console.error('❌ 获取LCU连接信息失败:', error.message);
      throw error;
    }
  }

  // 设置Axios实例
  setupAxiosInstance() {
    // 创建忽略SSL证书的agent
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      httpsAgent: httpsAgent,
      auth: {
        username: 'riot',
        password: this.lcuToken
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
  }

  // 获取当前召唤师信息
  async getCurrentSummoner() {
    try {
      console.log('🔍 获取当前召唤师信息...');
      
      const response = await this.axiosInstance.get('/lol-summoner/v1/current-summoner');
      return response.data;
      
    } catch (error) {
      console.error('❌ 获取当前召唤师失败:', error.message);
      throw error;
    }
  }

  // 根据名称查询召唤师
  async getSummonerByName(summonerName) {
    try {
      console.log(`🔍 查询召唤师: ${summonerName}`);
      
      const response = await this.axiosInstance.get(`/lol-summoner/v1/summoners?name=${encodeURIComponent(summonerName)}`);
      
      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      
      throw new Error('未找到召唤师');
      
    } catch (error) {
      console.error(`❌ 查询召唤师失败:`, error.message);
      throw error;
    }
  }

  // 获取召唤师排位信息
  async getSummonerRankedStats(summonerId) {
    try {
      console.log('🔍 获取排位信息...');
      
      const response = await this.axiosInstance.get(`/lol-ranked/v1/ranked-stats/${summonerId}`);
      return response.data;
      
    } catch (error) {
      console.warn('获取排位信息失败:', error.message);
      return null;
    }
  }

  // 获取比赛历史
  async getMatchHistory(accountId, begIndex = 0, endIndex = 20) {
    try {
      console.log('🔍 获取比赛历史...');
      
      const response = await this.axiosInstance.get(
        `/lol-match-history/v1/products/lol/${accountId}/matches?begIndex=${begIndex}&endIndex=${endIndex}`
      );
      
      return response.data;
      
    } catch (error) {
      console.warn('获取比赛历史失败:', error.message);
      return { games: { games: [] } };
    }
  }

  // 获取比赛详情
  async getMatchDetail(gameId) {
    try {
      const response = await this.axiosInstance.get(`/lol-match-history/v1/games/${gameId}`);
      return response.data;
    } catch (error) {
      console.warn(`获取比赛 ${gameId} 详情失败:`, error.message);
      return null;
    }
  }

  // 抓取召唤师完整数据
  async crawlSummoner(summonerName) {
    try {
      console.log(`🎯 开始抓取召唤师: ${summonerName}`);
      
      // 1. 获取召唤师基本信息
      let summonerData;
      if (summonerName) {
        summonerData = await this.getSummonerByName(summonerName);
      } else {
        summonerData = await this.getCurrentSummoner();
      }
      
      // 2. 获取排位信息
      const rankedStats = await this.getSummonerRankedStats(summonerData.summonerId);
      
      // 3. 获取比赛历史
      const matchHistory = await this.getMatchHistory(summonerData.accountId, 0, 20);
      
      // 4. 处理数据
      const processedData = this.processSummonerData(summonerData, rankedStats, matchHistory);
      
      // 5. 保存数据
      const savedSummoner = await this.saveSummonerData(processedData);
      
      // 6. 保存比赛记录
      if (matchHistory.games && matchHistory.games.games) {
        for (const game of matchHistory.games.games.slice(0, 10)) {
          const processedMatch = this.processMatchData(game, summonerData);
          await this.saveMatchData(processedMatch);
        }
      }
      
      console.log('✅ LCU数据抓取完成');
      return savedSummoner;
      
    } catch (error) {
      console.error(`❌ LCU抓取失败:`, error.message);
      throw error;
    }
  }

  // 处理召唤师数据
  processSummonerData(summonerData, rankedStats, matchHistory) {
    const soloQueue = rankedStats?.queues?.find(q => q.queueType === 'RANKED_SOLO_5x5');
    const flexQueue = rankedStats?.queues?.find(q => q.queueType === 'RANKED_FLEX_SR');
    
    return {
      summonerName: summonerData.displayName,
      summonerId: `LCU_${summonerData.summonerId}`,
      summonerLevel: summonerData.summonerLevel,
      region: 'CN', // LCU API默认是当前客户端区域
      profileIcon: {
        iconId: summonerData.profileIconId,
        iconUrl: `https://ddragon.leagueoflegends.com/cdn/13.18.1/img/profileicon/${summonerData.profileIconId}.png`
      },
      rankInfo: {
        soloRank: soloQueue ? {
          tier: soloQueue.tier,
          rank: soloQueue.division,
          leaguePoints: soloQueue.leaguePoints,
          wins: soloQueue.wins,
          losses: soloQueue.losses,
          winRate: soloQueue.wins + soloQueue.losses > 0 ? 
            Math.round((soloQueue.wins / (soloQueue.wins + soloQueue.losses)) * 100) : 0
        } : null,
        flexRank: flexQueue ? {
          tier: flexQueue.tier,
          rank: flexQueue.division,
          leaguePoints: flexQueue.leaguePoints,
          wins: flexQueue.wins,
          losses: flexQueue.losses,
          winRate: flexQueue.wins + flexQueue.losses > 0 ? 
            Math.round((flexQueue.wins / (flexQueue.wins + flexQueue.losses)) * 100) : 0
        } : null
      },
      dataSource: 'lcu',
      lastUpdated: new Date()
    };
  }

  // 处理比赛数据
  processMatchData(gameData, summonerData) {
    const participant = gameData.participants?.find(p => 
      p.summonerId === summonerData.summonerId
    );
    
    if (!participant) return null;
    
    return {
      matchId: `lcu_${gameData.gameId}`,
      gameId: gameData.gameId,
      gameMode: gameData.gameMode,
      gameType: gameData.gameType,
      queueId: gameData.queueId,
      gameCreation: new Date(gameData.gameCreation),
      gameDuration: gameData.gameDuration,
      mapId: gameData.mapId,
      participants: [{
        summonerId: participant.summonerId,
        summonerName: participant.summonerName,
        teamId: participant.teamId,
        championId: participant.championId,
        championName: participant.championName,
        championLevel: participant.stats?.champLevel,
        lane: participant.timeline?.lane,
        win: participant.stats?.win,
        kills: participant.stats?.kills,
        deaths: participant.stats?.deaths,
        assists: participant.stats?.assists,
        totalDamageDealtToChampions: participant.stats?.totalDamageDealtToChampions,
        goldEarned: participant.stats?.goldEarned,
        totalMinionsKilled: participant.stats?.totalMinionsKilled,
        visionScore: participant.stats?.visionScore
      }],
      dataSource: 'lcu',
      lastUpdated: new Date()
    };
  }

  async saveSummonerData(data) {
    try {
      const summoner = await Summoner.findOneAndUpdate(
        { summonerId: data.summonerId },
        data,
        { upsert: true, new: true, runValidators: true }
      );
      console.log('✅ 召唤师数据保存成功');
      return summoner;
    } catch (error) {
      console.error('❌ 保存召唤师数据失败:', error);
      throw error;
    }
  }

  async saveMatchData(data) {
    if (!data) return;
    
    try {
      const match = await Match.findOneAndUpdate(
        { matchId: data.matchId },
        data,
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
  const summonerName = args[1];

  const crawler = new LCUCrawler();

  try {
    await crawler.init();

    switch (command) {
      case 'current':
        console.log('🎯 抓取当前登录的召唤师数据...');
        const currentResult = await crawler.crawlSummoner();
        console.log('✅ 当前召唤师数据抓取完成:', currentResult.summonerName);
        break;

      case 'single':
        if (!summonerName) {
          console.log('❌ 请提供召唤师名称');
          console.log('使用方法: npm run crawler-lcu single "召唤师名称"');
          break;
        }
        console.log(`🎯 抓取指定召唤师数据: ${summonerName}`);
        const singleResult = await crawler.crawlSummoner(summonerName);
        console.log('✅ 指定召唤师数据抓取完成:', singleResult.summonerName);
        break;

      case 'test':
        console.log('🧪 运行LCU连接测试...');
        const testSummoner = await crawler.getCurrentSummoner();
        console.log('✅ LCU连接测试成功:', testSummoner.displayName);
        break;

      default:
        console.log('使用方法:');
        console.log('  npm run crawler-lcu current              # 抓取当前登录召唤师');
        console.log('  npm run crawler-lcu single "召唤师名称"   # 抓取指定召唤师');
        console.log('  npm run crawler-lcu test                 # 测试LCU连接');
        console.log('');
        console.log('注意: 需要先启动英雄联盟客户端并登录账号');
    }

  } catch (error) {
    console.error('❌ LCU爬虫运行失败:', error.message);

    if (error.message.includes('LOL客户端未启动')) {
      console.log('\n💡 解决方案:');
      console.log('1. 启动英雄联盟客户端');
      console.log('2. 登录到游戏账号');
      console.log('3. 重新运行命令');
    }
  } finally {
    await crawler.close();
  }
}

// 如果直接运行此文件，执行主程序
if (require.main === module) {
  main().catch(console.error);
}

module.exports = LCUCrawler;
