import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证 token
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// 召唤师相关 API
export const summonerAPI = {
  // 获取召唤师列表
  getSummoners: (params = {}) => {
    return api.get('/summoner', { params });
  },
  
  // 根据ID获取召唤师详情
  getSummonerById: (summonerId) => {
    return api.get(`/summoner/${summonerId}`);
  },
  
  // 搜索召唤师
  searchSummoner: (name) => {
    return api.get(`/summoner/search/${encodeURIComponent(name)}`);
  },
  
  // 创建或更新召唤师
  createOrUpdateSummoner: (data) => {
    return api.post('/summoner', data);
  },
  
  // 更新召唤师信息
  updateSummoner: (summonerId, data) => {
    return api.put(`/summoner/${summonerId}`, data);
  },
  
  // 删除召唤师
  deleteSummoner: (summonerId) => {
    return api.delete(`/summoner/${summonerId}`);
  },
  
  // 获取排行榜
  getLeaderboard: (tier, limit = 50) => {
    return api.get(`/summoner/leaderboard/${tier}`, { params: { limit } });
  }
};

// 比赛相关 API
export const matchAPI = {
  // 获取召唤师的比赛记录
  getSummonerMatches: (summonerId, params = {}) => {
    return api.get(`/matches/summoner/${summonerId}`, { params });
  },
  
  // 获取比赛详情
  getMatchDetail: (matchId) => {
    return api.get(`/matches/${matchId}`);
  },
  
  // 保存比赛记录
  saveMatch: (data) => {
    return api.post('/matches', data);
  },
  
  // 获取召唤师统计数据
  getSummonerStats: (summonerId, days = 30) => {
    return api.get(`/matches/stats/${summonerId}`, { params: { days } });
  },
  
  // 获取最近比赛
  getRecentMatches: (limit = 10) => {
    return api.get(`/matches/recent/${limit}`);
  }
};

// 爬虫相关 API
export const crawlerAPI = {
  // 抓取单个召唤师
  crawlSummoner: (summonerName, region = 'HN1') => {
    return api.post('/crawler/summoner', { summonerName, region });
  },
  
  // 批量抓取召唤师
  crawlSummoners: (summonerNames, region = 'HN1') => {
    return api.post('/crawler/summoners/batch', { summonerNames, region });
  },
  
  // 获取爬虫状态
  getCrawlerStatus: () => {
    return api.get('/crawler/status');
  },
  
  // 停止爬虫
  stopCrawler: () => {
    return api.post('/crawler/stop');
  },
  
  // 重启爬虫
  restartCrawler: () => {
    return api.post('/crawler/restart');
  }
};

// 系统相关 API
export const systemAPI = {
  // 健康检查
  healthCheck: () => {
    return api.get('/health');
  },
  
  // 获取系统信息
  getSystemInfo: () => {
    return api.get('/');
  }
};

export default api;
