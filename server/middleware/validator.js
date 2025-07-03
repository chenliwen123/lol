// 数据验证中间件

// 验证召唤师ID
const validateSummonerId = (req, res, next) => {
  const { summonerId } = req.params;
  
  if (!summonerId || summonerId.trim() === '') {
    return res.status(400).json({
      success: false,
      error: '召唤师ID不能为空'
    });
  }
  
  // 简单的ID格式验证
  if (summonerId.length > 100) {
    return res.status(400).json({
      success: false,
      error: '召唤师ID格式无效'
    });
  }
  
  next();
};

// 验证召唤师名称（URL参数）
const validateSummonerName = (req, res, next) => {
  const { name } = req.params;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: '召唤师名称不能为空'
    });
  }

  // 验证名称长度和字符
  if (name.length > 16 || name.length < 1) {
    return res.status(400).json({
      success: false,
      error: '召唤师名称长度必须在1-16个字符之间'
    });
  }

  next();
};

// 验证召唤师名称（请求体）
const validateSummonerNameBody = (req, res, next) => {
  const { summonerName } = req.body;

  if (!summonerName || summonerName.trim() === '') {
    return res.status(400).json({
      success: false,
      error: '召唤师名称不能为空'
    });
  }

  // 验证名称长度（放宽到20个字符，支持特殊字符）
  if (summonerName.length > 20 || summonerName.length < 1) {
    return res.status(400).json({
      success: false,
      error: '召唤师名称长度必须在1-20个字符之间'
    });
  }

  next();
};

// 验证分页参数
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      success: false,
      error: '页码必须是大于0的整数'
    });
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      error: '每页数量必须是1-100之间的整数'
    });
  }
  
  req.pagination = {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum
  };
  
  next();
};

// 验证比赛ID
const validateMatchId = (req, res, next) => {
  const { matchId } = req.params;
  
  if (!matchId || matchId.trim() === '') {
    return res.status(400).json({
      success: false,
      error: '比赛ID不能为空'
    });
  }
  
  next();
};

// 验证召唤师数据
const validateSummonerData = (req, res, next) => {
  const { summonerId, summonerName } = req.body;
  
  if (!summonerId || !summonerName) {
    return res.status(400).json({
      success: false,
      error: '召唤师ID和名称是必需字段'
    });
  }
  
  if (typeof summonerName !== 'string' || summonerName.trim() === '') {
    return res.status(400).json({
      success: false,
      error: '召唤师名称必须是非空字符串'
    });
  }
  
  if (summonerName.length > 16) {
    return res.status(400).json({
      success: false,
      error: '召唤师名称不能超过16个字符'
    });
  }
  
  next();
};

// 验证比赛数据
const validateMatchData = (req, res, next) => {
  const { matchId, participants } = req.body;
  
  if (!matchId) {
    return res.status(400).json({
      success: false,
      error: '比赛ID是必需字段'
    });
  }
  
  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({
      success: false,
      error: '参与者信息是必需字段且不能为空'
    });
  }
  
  // 验证参与者数量
  if (participants.length > 10) {
    return res.status(400).json({
      success: false,
      error: '参与者数量不能超过10个'
    });
  }
  
  next();
};

module.exports = {
  validateSummonerId,
  validateSummonerName,
  validateSummonerNameBody,
  validatePagination,
  validateMatchId,
  validateSummonerData,
  validateMatchData
};
