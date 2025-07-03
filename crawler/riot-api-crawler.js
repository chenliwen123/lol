const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// 导入数据模型
const Summoner = require('../server/models/Summoner');
const Match = require('../server/models/Match');

class RiotAPICrawler {
  constructor() {
    this.apiKey = process.env.RIOT_API_KEY;
    this.baseUrl = 'https://kr.api.riotgames.com'; // 韩服API，国服可能需要不同的endpoint
    this.delay = 1200; // API限制，每秒最多1次请求
  }

  async init() {
    console.log('🚀 初始化Riot API爬虫...');
    
    if (!this.apiKey) {
      throw new Error('请在.env文件中设置RIOT_API_KEY');
    }
    
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lol-stats');
    console.log('✅ 数据库连接成功');
    console.log('✅ Riot API爬虫初始化完成');
  }

  // 根据召唤师名称获取基本信息
  async getSummonerByName(summonerName, region = 'kr') {
    try {
      console.log(`🔍 查询召唤师: ${summonerName}`);
      
      const url = `${this.baseUrl}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`;
      const response = await axios.get(url, {
        headers: {
          'X-Riot-Token': this.apiKey
        }
      });
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`召唤师 "${summonerName}" 不存在`);
      } else if (error.response?.status === 403) {
        throw new Error('API Key无效或已过期');
      } else if (error.response?.status === 429) {
        throw new Error('API请求频率过高，请稍后重试');
      }
      throw error;
    }
  }

  // 获取召唤师排位信息
  async getSummonerRank(summonerId) {
    try {
      const url = `${this.baseUrl}/lol/league/v4/entries/by-summoner/${summonerId}`;
      const response = await axios.get(url, {
        headers: {
          'X-Riot-Token': this.apiKey
        }
      });
      
      return response.data;
    } catch (error) {
      console.warn('获取排位信息失败:', error.message);
      return [];
    }
  }

  // 获取召唤师比赛记录
  async getSummonerMatches(puuid, count = 20) {
    try {
      // 获取比赛ID列表
      const matchListUrl = `${this.baseUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`;
      const matchListResponse = await axios.get(matchListUrl, {
        headers: {
          'X-Riot-Token': this.apiKey
        }
      });
      
      const matchIds = matchListResponse.data;
      const matches = [];
      
      // 获取每场比赛的详细信息
      for (const matchId of matchIds.slice(0, 5)) { // 限制为5场，避免API限制
        try {
          await new Promise(resolve => setTimeout(resolve, this.delay)); // 限制请求频率
          
          const matchUrl = `${this.baseUrl}/lol/match/v5/matches/${matchId}`;
          const matchResponse = await axios.get(matchUrl, {
            headers: {
              'X-Riot-Token': this.apiKey
            }
          });
          
          matches.push(matchResponse.data);
        } catch (error) {
          console.warn(`获取比赛 ${matchId} 详情失败:`, error.message);
        }
      }
      
      return matches;
    } catch (error) {
      console.warn('获取比赛记录失败:', error.message);
      return [];
    }
  }

  // 抓取召唤师完整数据
  async crawlSummoner(summonerName, region = 'kr') {
    try {
      console.log(`🎯 开始抓取召唤师: ${summonerName} (${region})`);
      
      // 1. 获取基本信息
      const summonerData = await this.getSummonerByName(summonerName, region);
      await new Promise(resolve => setTimeout(resolve, this.delay));
      
      // 2. 获取排位信息
      const rankData = await this.getSummonerRank(summonerData.id);
      await new Promise(resolve => setTimeout(resolve, this.delay));
      
      // 3. 获取比赛记录
      const matchData = await this.getSummonerMatches(summonerData.puuid);
      
      // 4. 整理数据
      const processedData = this.processSummonerData(summonerData, rankData, matchData, region);
      
      // 5. 保存到数据库
      const savedSummoner = await this.saveSummonerData(processedData);
      
      // 6. 保存比赛记录
      for (const match of matchData) {
        const processedMatch = this.processMatchData(match, summonerData.puuid);
        await this.saveMatchData(processedMatch);
      }
      
      console.log('✅ 召唤师数据抓取完成');
      return savedSummoner;
      
    } catch (error) {
      console.error(`❌ 抓取召唤师失败:`, error.message);
      throw error;
    }
  }

  // 处理召唤师数据
  processSummonerData(summonerData, rankData, matchData, region) {
    const soloRank = rankData.find(rank => rank.queueType === 'RANKED_SOLO_5x5');
    const flexRank = rankData.find(rank => rank.queueType === 'RANKED_FLEX_SR');
    
    return {
      summonerName: summonerData.name,
      summonerId: `${region}_${summonerData.id}`,
      summonerLevel: summonerData.summonerLevel,
      region: region,
      profileIcon: {
        iconId: summonerData.profileIconId,
        iconUrl: `https://ddragon.leagueoflegends.com/cdn/13.18.1/img/profileicon/${summonerData.profileIconId}.png`
      },
      rankInfo: {
        soloRank: soloRank ? {
          tier: soloRank.tier,
          rank: soloRank.rank,
          leaguePoints: soloRank.leaguePoints,
          wins: soloRank.wins,
          losses: soloRank.losses,
          winRate: Math.round((soloRank.wins / (soloRank.wins + soloRank.losses)) * 100)
        } : null,
        flexRank: flexRank ? {
          tier: flexRank.tier,
          rank: flexRank.rank,
          leaguePoints: flexRank.leaguePoints,
          wins: flexRank.wins,
          losses: flexRank.losses,
          winRate: Math.round((flexRank.wins / (flexRank.wins + flexRank.losses)) * 100)
        } : null
      },
      riotData: {
        id: summonerData.id,
        accountId: summonerData.accountId,
        puuid: summonerData.puuid
      },
      dataSource: 'riot_api',
      lastUpdated: new Date()
    };
  }

  // 处理比赛数据
  processMatchData(matchData, puuid) {
    const participant = matchData.info.participants.find(p => p.puuid === puuid);
    
    return {
      matchId: matchData.metadata.matchId,
      gameId: matchData.info.gameId,
      gameMode: matchData.info.gameMode,
      gameType: matchData.info.gameType,
      queueId: matchData.info.queueId,
      gameCreation: new Date(matchData.info.gameCreation),
      gameDuration: matchData.info.gameDuration,
      mapId: matchData.info.mapId,
      participants: [{
        summonerId: participant.summonerId,
        summonerName: participant.summonerName,
        teamId: participant.teamId,
        championId: participant.championId,
        championName: participant.championName,
        championLevel: participant.champLevel,
        lane: participant.lane,
        win: participant.win,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
        goldEarned: participant.goldEarned,
        totalMinionsKilled: participant.totalMinionsKilled,
        visionScore: participant.visionScore,
        items: [
          { itemId: participant.item0, itemName: 'Item' },
          { itemId: participant.item1, itemName: 'Item' },
          { itemId: participant.item2, itemName: 'Item' },
          { itemId: participant.item3, itemName: 'Item' },
          { itemId: participant.item4, itemName: 'Item' },
          { itemId: participant.item5, itemName: 'Item' },
          { itemId: participant.item6, itemName: 'Item' }
        ],
        spell1Id: participant.summoner1Id,
        spell2Id: participant.summoner2Id
      }],
      teams: matchData.info.teams.map(team => ({
        teamId: team.teamId,
        win: team.win,
        baronKills: team.objectives?.baron?.kills || 0,
        dragonKills: team.objectives?.dragon?.kills || 0,
        towerKills: team.objectives?.tower?.kills || 0,
        firstBaron: team.objectives?.baron?.first || false,
        firstDragon: team.objectives?.dragon?.first || false,
        firstTower: team.objectives?.tower?.first || false
      })),
      dataSource: 'riot_api',
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

module.exports = RiotAPICrawler;
