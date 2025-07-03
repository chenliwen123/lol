const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// 导入数据模型
const Summoner = require('../server/models/Summoner');
const Match = require('../server/models/Match');

class OPGGCrawler {
  constructor() {
    this.baseUrl = 'https://www.op.gg/api/v1.0/internal/bypass';
    this.requestHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': 'https://www.op.gg/',
      'Origin': 'https://www.op.gg'
    };
  }

  async init() {
    console.log('🚀 初始化OP.GG爬虫...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lol-stats');
    console.log('✅ 数据库连接成功');
  }

  // 获取召唤师信息
  async getSummonerInfo(summonerName, region = 'kr') {
    try {
      console.log(`🔍 从OP.GG查询召唤师: ${summonerName} (${region})`);
      
      const url = `${this.baseUrl}/summoners/${region}/${encodeURIComponent(summonerName)}`;
      console.log(`📍 访问URL: ${url}`);
      
      const response = await axios.get(url, {
        headers: this.requestHeaders,
        timeout: 15000
      });
      
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      throw new Error('未找到召唤师数据');
      
    } catch (error) {
      console.error(`❌ OP.GG查询失败:`, error.message);
      throw error;
    }
  }

  // 获取排位信息
  async getRankInfo(summonerName, region = 'kr') {
    try {
      const url = `${this.baseUrl}/summoners/${region}/${encodeURIComponent(summonerName)}/league-stats`;
      
      const response = await axios.get(url, {
        headers: this.requestHeaders,
        timeout: 15000
      });
      
      return response.data?.data || [];
      
    } catch (error) {
      console.warn('获取排位信息失败:', error.message);
      return [];
    }
  }

  // 获取比赛记录
  async getMatchHistory(summonerName, region = 'kr', limit = 20) {
    try {
      const url = `${this.baseUrl}/summoners/${region}/${encodeURIComponent(summonerName)}/matches`;
      
      const response = await axios.get(url, {
        headers: this.requestHeaders,
        params: {
          limit: limit,
          hl: 'zh_CN'
        },
        timeout: 15000
      });
      
      return response.data?.data || [];
      
    } catch (error) {
      console.warn('获取比赛记录失败:', error.message);
      return [];
    }
  }

  // 抓取完整的召唤师数据
  async crawlSummoner(summonerName, region = 'kr') {
    try {
      console.log(`🎯 开始抓取召唤师: ${summonerName} (${region})`);
      
      // 1. 获取基本信息
      const summonerData = await this.getSummonerInfo(summonerName, region);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 限制请求频率
      
      // 2. 获取排位信息
      const rankData = await this.getRankInfo(summonerName, region);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. 获取比赛记录
      const matchData = await this.getMatchHistory(summonerName, region, 10);
      
      // 4. 处理数据
      const processedData = this.processSummonerData(summonerData, rankData, matchData, region);
      
      // 5. 保存数据
      const savedSummoner = await this.saveSummonerData(processedData);
      
      // 6. 保存比赛记录
      for (const match of matchData) {
        const processedMatch = this.processMatchData(match, summonerName);
        await this.saveMatchData(processedMatch);
      }
      
      console.log('✅ OP.GG数据抓取完成');
      return savedSummoner;
      
    } catch (error) {
      console.error(`❌ OP.GG抓取失败:`, error.message);
      throw error;
    }
  }

  // 处理召唤师数据
  processSummonerData(summonerData, rankData, matchData, region) {
    const soloRank = rankData.find(rank => rank.queue_info?.game_type === 'SOLORANKED');
    const flexRank = rankData.find(rank => rank.queue_info?.game_type === 'FLEXRANKED');
    
    return {
      summonerName: summonerData.name,
      summonerId: `${region}_${summonerData.internal_name}_opgg`,
      summonerLevel: summonerData.level,
      region: region,
      profileIcon: {
        iconId: summonerData.profile_image_url?.match(/(\d+)\.png/)?.[1] || 1,
        iconUrl: summonerData.profile_image_url
      },
      rankInfo: {
        soloRank: soloRank ? {
          tier: soloRank.tier_info?.tier || 'UNRANKED',
          rank: soloRank.tier_info?.division || 'I',
          leaguePoints: soloRank.tier_info?.lp || 0,
          wins: soloRank.win || 0,
          losses: soloRank.lose || 0,
          winRate: soloRank.win && soloRank.lose ? 
            Math.round((soloRank.win / (soloRank.win + soloRank.lose)) * 100) : 0
        } : null,
        flexRank: flexRank ? {
          tier: flexRank.tier_info?.tier || 'UNRANKED',
          rank: flexRank.tier_info?.division || 'I',
          leaguePoints: flexRank.tier_info?.lp || 0,
          wins: flexRank.win || 0,
          losses: flexRank.lose || 0,
          winRate: flexRank.win && flexRank.lose ? 
            Math.round((flexRank.win / (flexRank.win + flexRank.lose)) * 100) : 0
        } : null
      },
      dataSource: 'opgg',
      lastUpdated: new Date()
    };
  }

  // 处理比赛数据
  processMatchData(matchData, summonerName) {
    const participant = matchData.participants?.find(p => 
      p.summoner?.name?.toLowerCase() === summonerName.toLowerCase()
    );
    
    if (!participant) return null;
    
    return {
      matchId: `opgg_${matchData.id}`,
      gameId: matchData.id,
      gameMode: matchData.queue_info?.game_type || 'CLASSIC',
      gameType: 'MATCHED_GAME',
      queueId: matchData.queue_info?.queue_id || 420,
      gameCreation: new Date(matchData.created_ts * 1000),
      gameDuration: matchData.game_length_second,
      mapId: matchData.map_info?.map_id || 11,
      participants: [{
        summonerId: participant.summoner?.internal_name,
        summonerName: participant.summoner?.name,
        teamId: participant.team_key === 'RED' ? 200 : 100,
        championId: participant.champion?.id,
        championName: participant.champion?.display_name,
        championLevel: participant.stats?.champion_level,
        lane: participant.position,
        win: participant.stats?.result === 'WIN',
        kills: participant.stats?.kill,
        deaths: participant.stats?.death,
        assists: participant.stats?.assist,
        totalDamageDealtToChampions: participant.stats?.total_damage_dealt_to_champions,
        goldEarned: participant.stats?.gold_earned,
        totalMinionsKilled: participant.stats?.minion_kill,
        visionScore: participant.stats?.vision_score
      }],
      dataSource: 'opgg',
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

module.exports = OPGGCrawler;
