const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// 导入数据模型
const Summoner = require('../server/models/Summoner');
const Match = require('../server/models/Match');

class WeGameCrawler {
  constructor() {
    this.baseUrl = 'https://www.wegame.com.cn/api/v1/lol';
    this.requestHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': 'https://www.wegame.com.cn/',
      'Origin': 'https://www.wegame.com.cn'
    };
  }

  async init() {
    console.log('🚀 初始化WeGame爬虫...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lol-stats');
    console.log('✅ 数据库连接成功');
  }

  // 搜索召唤师
  async searchSummoner(summonerName, region = 'HN1') {
    try {
      console.log(`🔍 从WeGame搜索召唤师: ${summonerName} (${region})`);
      
      const url = `${this.baseUrl}/summoner/search`;
      
      const response = await axios.get(url, {
        headers: this.requestHeaders,
        params: {
          name: summonerName,
          region: region
        },
        timeout: 15000
      });
      
      if (response.data && response.data.code === 0) {
        return response.data.data;
      }
      
      throw new Error('WeGame搜索失败');
      
    } catch (error) {
      console.error(`❌ WeGame搜索失败:`, error.message);
      throw error;
    }
  }

  // 获取召唤师详细信息
  async getSummonerDetail(summonerId, region = 'HN1') {
    try {
      const url = `${this.baseUrl}/summoner/detail`;
      
      const response = await axios.get(url, {
        headers: this.requestHeaders,
        params: {
          summonerId: summonerId,
          region: region
        },
        timeout: 15000
      });
      
      if (response.data && response.data.code === 0) {
        return response.data.data;
      }
      
      throw new Error('获取召唤师详情失败');
      
    } catch (error) {
      console.warn('获取召唤师详情失败:', error.message);
      return null;
    }
  }

  // 获取排位信息
  async getRankInfo(summonerId, region = 'HN1') {
    try {
      const url = `${this.baseUrl}/summoner/rank`;
      
      const response = await axios.get(url, {
        headers: this.requestHeaders,
        params: {
          summonerId: summonerId,
          region: region
        },
        timeout: 15000
      });
      
      if (response.data && response.data.code === 0) {
        return response.data.data;
      }
      
      return [];
      
    } catch (error) {
      console.warn('获取排位信息失败:', error.message);
      return [];
    }
  }

  // 获取比赛记录
  async getMatchHistory(summonerId, region = 'HN1', limit = 20) {
    try {
      const url = `${this.baseUrl}/summoner/matches`;
      
      const response = await axios.get(url, {
        headers: this.requestHeaders,
        params: {
          summonerId: summonerId,
          region: region,
          limit: limit
        },
        timeout: 15000
      });
      
      if (response.data && response.data.code === 0) {
        return response.data.data;
      }
      
      return [];
      
    } catch (error) {
      console.warn('获取比赛记录失败:', error.message);
      return [];
    }
  }

  // 抓取完整的召唤师数据
  async crawlSummoner(summonerName, region = 'HN1') {
    try {
      console.log(`🎯 开始抓取召唤师: ${summonerName} (${region})`);
      
      // 1. 搜索召唤师
      const searchResult = await this.searchSummoner(summonerName, region);
      if (!searchResult || !searchResult.summonerId) {
        throw new Error('未找到召唤师');
      }
      
      const summonerId = searchResult.summonerId;
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 2. 获取详细信息
      const summonerDetail = await this.getSummonerDetail(summonerId, region);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. 获取排位信息
      const rankData = await this.getRankInfo(summonerId, region);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 4. 获取比赛记录
      const matchData = await this.getMatchHistory(summonerId, region, 10);
      
      // 5. 处理数据
      const processedData = this.processSummonerData(
        { ...searchResult, ...summonerDetail }, 
        rankData, 
        matchData, 
        region
      );
      
      // 6. 保存数据
      const savedSummoner = await this.saveSummonerData(processedData);
      
      // 7. 保存比赛记录
      for (const match of matchData) {
        const processedMatch = this.processMatchData(match, summonerName);
        await this.saveMatchData(processedMatch);
      }
      
      console.log('✅ WeGame数据抓取完成');
      return savedSummoner;
      
    } catch (error) {
      console.error(`❌ WeGame抓取失败:`, error.message);
      throw error;
    }
  }

  // 处理召唤师数据
  processSummonerData(summonerData, rankData, matchData, region) {
    const soloRank = rankData.find(rank => rank.queueType === 'RANKED_SOLO_5x5');
    const flexRank = rankData.find(rank => rank.queueType === 'RANKED_FLEX_SR');
    
    return {
      summonerName: summonerData.name || summonerData.summonerName,
      summonerId: `${region}_${summonerData.summonerId}_wegame`,
      summonerLevel: summonerData.level || summonerData.summonerLevel,
      region: region,
      profileIcon: {
        iconId: summonerData.profileIconId || 1,
        iconUrl: summonerData.profileIconUrl || 
          `https://ddragon.leagueoflegends.com/cdn/13.18.1/img/profileicon/${summonerData.profileIconId || 1}.png`
      },
      rankInfo: {
        soloRank: soloRank ? {
          tier: soloRank.tier || 'UNRANKED',
          rank: soloRank.rank || 'I',
          leaguePoints: soloRank.leaguePoints || 0,
          wins: soloRank.wins || 0,
          losses: soloRank.losses || 0,
          winRate: soloRank.wins && soloRank.losses ? 
            Math.round((soloRank.wins / (soloRank.wins + soloRank.losses)) * 100) : 0
        } : null,
        flexRank: flexRank ? {
          tier: flexRank.tier || 'UNRANKED',
          rank: flexRank.rank || 'I',
          leaguePoints: flexRank.leaguePoints || 0,
          wins: flexRank.wins || 0,
          losses: flexRank.losses || 0,
          winRate: flexRank.wins && flexRank.losses ? 
            Math.round((flexRank.wins / (flexRank.wins + flexRank.losses)) * 100) : 0
        } : null
      },
      dataSource: 'wegame',
      lastUpdated: new Date()
    };
  }

  // 处理比赛数据
  processMatchData(matchData, summonerName) {
    const participant = matchData.participants?.find(p => 
      p.summonerName?.toLowerCase() === summonerName.toLowerCase()
    );
    
    if (!participant) return null;
    
    return {
      matchId: `wegame_${matchData.gameId}`,
      gameId: matchData.gameId,
      gameMode: matchData.gameMode || 'CLASSIC',
      gameType: matchData.gameType || 'MATCHED_GAME',
      queueId: matchData.queueId || 420,
      gameCreation: new Date(matchData.gameCreation),
      gameDuration: matchData.gameDuration,
      mapId: matchData.mapId || 11,
      participants: [{
        summonerId: participant.summonerId,
        summonerName: participant.summonerName,
        teamId: participant.teamId,
        championId: participant.championId,
        championName: participant.championName,
        championLevel: participant.champLevel,
        lane: participant.lane,
        win: participant.stats?.win,
        kills: participant.stats?.kills,
        deaths: participant.stats?.deaths,
        assists: participant.stats?.assists,
        totalDamageDealtToChampions: participant.stats?.totalDamageDealtToChampions,
        goldEarned: participant.stats?.goldEarned,
        totalMinionsKilled: participant.stats?.totalMinionsKilled,
        visionScore: participant.stats?.visionScore
      }],
      dataSource: 'wegame',
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

module.exports = WeGameCrawler;
