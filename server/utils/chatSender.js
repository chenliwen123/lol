const axios = require('axios');
const https = require('https');
const { exec } = require('child_process');

class ChatSender {
  constructor() {
    this.lcuPort = null;
    this.lcuToken = null;
    this.baseUrl = null;
    this.axiosInstance = null;
  }

  // 获取LCU连接信息
  async getLCUConnectionInfo() {
    try {
      console.log('🔍 查找LOL客户端进程...');
      
      const command = 'wmic PROCESS WHERE name="LeagueClientUx.exe" GET commandline';
      
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(new Error('LOL客户端未启动'));
            return;
          }
          
          const lines = stdout.split('\n');
          for (const line of lines) {
            if (line.includes('--app-port=') && line.includes('--remoting-auth-token=')) {
              const portMatch = line.match(/--app-port=(\d+)/);
              const tokenMatch = line.match(/--remoting-auth-token=([\w-]+)/);
              
              if (portMatch && tokenMatch) {
                this.lcuPort = portMatch[1];
                this.lcuToken = tokenMatch[1];
                this.baseUrl = `https://127.0.0.1:${this.lcuPort}`;
                
                this.setupAxiosInstance();
                console.log(`✅ LCU连接成功: 端口=${this.lcuPort}`);
                resolve(true);
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
      timeout: 5000
    });
  }

  // 检查是否在游戏中
  async isInGame() {
    try {
      const response = await this.axiosInstance.get('/lol-gameflow/v1/gameflow-phase');
      const phase = response.data;
      
      // 游戏阶段：ChampSelect, InProgress, Lobby 等
      return ['ChampSelect', 'InProgress'].includes(phase);
    } catch (error) {
      console.warn('检查游戏状态失败:', error.message);
      return false;
    }
  }

  // 发送聊天消息
  async sendChatMessage(message) {
    try {
      // 首先检查LCU连接
      if (!this.axiosInstance) {
        await this.getLCUConnectionInfo();
      }

      // 检查是否在游戏中
      const inGame = await this.isInGame();
      if (!inGame) {
        throw new Error('当前不在游戏中，无法发送消息');
      }

      // 发送消息到聊天
      const response = await this.axiosInstance.post('/lol-chat/v1/conversations/championselect/messages', {
        body: message,
        type: 'chat'
      });

      console.log('✅ 消息发送成功');
      return { success: true, message: '消息已发送到游戏聊天' };

    } catch (error) {
      console.error('❌ 发送消息失败:', error.message);
      
      if (error.message.includes('LOL客户端未启动')) {
        return { success: false, error: '请先启动英雄联盟客户端' };
      } else if (error.message.includes('当前不在游戏中')) {
        return { success: false, error: '请在选英雄阶段或游戏中使用此功能' };
      } else {
        return { success: false, error: '发送失败，请手动复制消息到聊天框' };
      }
    }
  }

  // 自动发送评分消息
  async sendScoreMessage(scoreData, summonerName) {
    try {
      const { totalScore, rank, description, details, matchCount, recommendation } = scoreData;
      
      // 生成简化的聊天消息（适合游戏内发送）
      const shortMessage = [
        `${summonerName} 战力: ${totalScore}分(${rank}级)`,
        `胜率${details.winRate?.display} KDA${details.kda?.display}`,
        `基于${matchCount}场数据 ${description}`
      ].join(' | ');

      return await this.sendChatMessage(shortMessage);

    } catch (error) {
      console.error('发送评分消息失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 监听游戏状态变化，自动发送消息
  async autoSendOnGameStart(scoreData, summonerName) {
    try {
      await this.getLCUConnectionInfo();
      
      console.log('🎮 开始监听游戏状态...');
      
      let lastPhase = null;
      const checkInterval = setInterval(async () => {
        try {
          const response = await this.axiosInstance.get('/lol-gameflow/v1/gameflow-phase');
          const currentPhase = response.data;
          
          // 当进入选英雄阶段时发送消息
          if (currentPhase === 'ChampSelect' && lastPhase !== 'ChampSelect') {
            console.log('🎯 检测到进入选英雄阶段，发送评分消息...');
            
            const result = await this.sendScoreMessage(scoreData, summonerName);
            if (result.success) {
              console.log('✅ 自动发送成功');
              clearInterval(checkInterval); // 发送成功后停止监听
            }
          }
          
          lastPhase = currentPhase;
          
        } catch (error) {
          console.warn('监听游戏状态失败:', error.message);
        }
      }, 3000); // 每3秒检查一次
      
      // 30分钟后停止监听
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('⏰ 监听超时，停止自动发送');
      }, 30 * 60 * 1000);
      
      return { success: true, message: '已开始监听游戏状态，将在下次进入选英雄阶段时自动发送' };
      
    } catch (error) {
      console.error('启动自动发送失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取当前游戏状态
  async getGameStatus() {
    try {
      if (!this.axiosInstance) {
        await this.getLCUConnectionInfo();
      }

      const response = await this.axiosInstance.get('/lol-gameflow/v1/gameflow-phase');
      const phase = response.data;
      
      const statusMap = {
        'None': '未在游戏中',
        'Lobby': '在大厅',
        'Matchmaking': '匹配中',
        'CheckedIntoTournament': '已进入锦标赛',
        'ReadyCheck': '准备检查',
        'ChampSelect': '选英雄阶段',
        'GameStart': '游戏开始',
        'InProgress': '游戏进行中',
        'Reconnect': '重连中',
        'WaitingForStats': '等待统计',
        'PreEndOfGame': '游戏即将结束',
        'EndOfGame': '游戏结束',
        'TerminatedInError': '游戏异常终止'
      };

      return {
        phase: phase,
        description: statusMap[phase] || phase,
        canSendMessage: ['ChampSelect', 'InProgress'].includes(phase)
      };

    } catch (error) {
      return {
        phase: 'Unknown',
        description: '无法获取游戏状态',
        canSendMessage: false,
        error: error.message
      };
    }
  }
}

module.exports = ChatSender;
