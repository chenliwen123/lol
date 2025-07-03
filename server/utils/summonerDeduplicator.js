const { Summoner, Match } = require('../models');

class SummonerDeduplicator {
  constructor() {
    this.duplicateCount = 0;
    this.mergedCount = 0;
  }

  // 查找重复的召唤师
  async findDuplicates() {
    console.log('🔍 查找重复的召唤师...');
    
    // 按召唤师名称分组，找出重复的
    const duplicates = await Summoner.aggregate([
      {
        $group: {
          _id: '$summonerName',
          count: { $sum: 1 },
          summoners: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log(`📊 找到 ${duplicates.length} 个重复的召唤师名称`);
    
    return duplicates;
  }

  // 合并重复的召唤师
  async mergeDuplicates() {
    const duplicates = await this.findDuplicates();
    
    for (const duplicate of duplicates) {
      await this.mergeSummonerGroup(duplicate);
    }

    console.log(`✅ 去重完成: 合并了 ${this.mergedCount} 个重复召唤师`);
    
    return {
      duplicateGroups: duplicates.length,
      mergedSummoners: this.mergedCount
    };
  }

  // 合并一组重复的召唤师
  async mergeSummonerGroup(duplicateGroup) {
    const { _id: summonerName, summoners } = duplicateGroup;
    
    console.log(`🔄 合并召唤师: ${summonerName} (${summoners.length}个重复)`);

    // 选择最佳的召唤师作为主记录
    const primarySummoner = this.selectPrimarySummoner(summoners);
    const duplicateSummoners = summoners.filter(s => s._id.toString() !== primarySummoner._id.toString());

    // 合并数据到主记录
    const mergedData = await this.mergeData(primarySummoner, duplicateSummoners);

    // 更新主记录
    await Summoner.findByIdAndUpdate(primarySummoner._id, mergedData);

    // 更新比赛记录中的召唤师ID引用
    for (const duplicate of duplicateSummoners) {
      await this.updateMatchReferences(duplicate.summonerId, primarySummoner.summonerId);
    }

    // 删除重复记录
    for (const duplicate of duplicateSummoners) {
      await Summoner.findByIdAndDelete(duplicate._id);
      console.log(`🗑️ 删除重复记录: ${duplicate.summonerId}`);
    }

    this.mergedCount += duplicateSummoners.length;
  }

  // 选择最佳的召唤师记录作为主记录
  selectPrimarySummoner(summoners) {
    // 优先级规则：
    // 1. 数据最完整的（有排位信息）
    // 2. 最近更新的
    // 3. 数据来源优先级：riot_api > enhanced_mock > zhangmeng > mock

    const dataSourcePriority = {
      'riot_api': 5,
      'enhanced_mock': 4,
      'lcu': 3,
      'zhangmeng': 2,
      'mock': 1,
      'test': 0
    };

    return summoners.sort((a, b) => {
      // 1. 排位信息完整性
      const aHasRank = a.rankInfo?.soloRank?.tier || a.rankInfo?.flexRank?.tier;
      const bHasRank = b.rankInfo?.soloRank?.tier || b.rankInfo?.flexRank?.tier;
      
      if (aHasRank && !bHasRank) return -1;
      if (!aHasRank && bHasRank) return 1;

      // 2. 数据来源优先级
      const aPriority = dataSourcePriority[a.dataSource] || 0;
      const bPriority = dataSourcePriority[b.dataSource] || 0;
      
      if (aPriority !== bPriority) return bPriority - aPriority;

      // 3. 最近更新时间
      const aTime = new Date(a.lastUpdated || a.updatedAt || 0);
      const bTime = new Date(b.lastUpdated || b.updatedAt || 0);
      
      return bTime - aTime;
    })[0];
  }

  // 合并召唤师数据
  async mergeData(primary, duplicates) {
    const merged = { ...primary };

    for (const duplicate of duplicates) {
      // 合并排位信息（选择更高的排位）
      if (duplicate.rankInfo?.soloRank?.tier && !merged.rankInfo?.soloRank?.tier) {
        merged.rankInfo = merged.rankInfo || {};
        merged.rankInfo.soloRank = duplicate.rankInfo.soloRank;
      }

      if (duplicate.rankInfo?.flexRank?.tier && !merged.rankInfo?.flexRank?.tier) {
        merged.rankInfo = merged.rankInfo || {};
        merged.rankInfo.flexRank = duplicate.rankInfo.flexRank;
      }

      // 合并统计信息（累加）
      if (duplicate.stats) {
        merged.stats = merged.stats || {};
        merged.stats.totalGames = (merged.stats.totalGames || 0) + (duplicate.stats.totalGames || 0);
        merged.stats.totalWins = (merged.stats.totalWins || 0) + (duplicate.stats.totalWins || 0);
        merged.stats.totalLosses = (merged.stats.totalLosses || 0) + (duplicate.stats.totalLosses || 0);
      }

      // 使用最新的头像
      if (duplicate.profileIcon && !merged.profileIcon) {
        merged.profileIcon = duplicate.profileIcon;
      }

      // 使用最高的等级
      if (duplicate.summonerLevel > (merged.summonerLevel || 0)) {
        merged.summonerLevel = duplicate.summonerLevel;
      }
    }

    // 重新计算胜率
    if (merged.stats && merged.stats.totalGames > 0) {
      merged.stats.overallWinRate = (merged.stats.totalWins / merged.stats.totalGames * 100).toFixed(2);
    }

    merged.lastUpdated = new Date();
    
    return merged;
  }

  // 更新比赛记录中的召唤师ID引用
  async updateMatchReferences(oldSummonerId, newSummonerId) {
    try {
      const result = await Match.updateMany(
        { 'participants.summonerId': oldSummonerId },
        { 
          $set: { 
            'participants.$.summonerId': newSummonerId,
            lastUpdated: new Date()
          }
        }
      );

      console.log(`📝 更新了 ${result.modifiedCount} 场比赛的召唤师ID引用`);
    } catch (error) {
      console.error(`❌ 更新比赛引用失败: ${error.message}`);
    }
  }

  // 清理孤立的比赛记录
  async cleanupOrphanedMatches() {
    console.log('🧹 清理孤立的比赛记录...');

    // 获取所有有效的召唤师ID
    const validSummonerIds = await Summoner.distinct('summonerId');
    
    // 查找包含无效召唤师ID的比赛
    const orphanedMatches = await Match.find({
      'participants.summonerId': { $nin: validSummonerIds }
    });

    console.log(`📊 找到 ${orphanedMatches.length} 场包含孤立召唤师的比赛`);

    // 删除完全孤立的比赛（所有参与者都无效）
    let deletedCount = 0;
    for (const match of orphanedMatches) {
      const validParticipants = match.participants.filter(p => 
        validSummonerIds.includes(p.summonerId)
      );

      if (validParticipants.length === 0) {
        await Match.findByIdAndDelete(match._id);
        deletedCount++;
      }
    }

    console.log(`🗑️ 删除了 ${deletedCount} 场完全孤立的比赛`);
    
    return {
      orphanedMatches: orphanedMatches.length,
      deletedMatches: deletedCount
    };
  }

  // 生成去重报告
  async generateReport() {
    const duplicates = await this.findDuplicates();
    const totalSummoners = await Summoner.countDocuments();
    const totalMatches = await Match.countDocuments();

    const report = {
      summary: {
        totalSummoners,
        totalMatches,
        duplicateGroups: duplicates.length,
        duplicateSummoners: duplicates.reduce((sum, group) => sum + group.count - 1, 0)
      },
      duplicates: duplicates.map(group => ({
        summonerName: group._id,
        count: group.count,
        summonerIds: group.summoners.map(s => s.summonerId),
        dataSources: [...new Set(group.summoners.map(s => s.dataSource))]
      }))
    };

    return report;
  }
}

module.exports = SummonerDeduplicator;
