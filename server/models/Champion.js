const mongoose = require('mongoose');

// 英雄信息模型
const championSchema = new mongoose.Schema({
  // 英雄基本信息
  championId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  
  // 英雄描述
  blurb: String,
  lore: String,
  
  // 英雄标签
  tags: [{
    type: String,
    enum: ['Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank']
  }],
  
  // 英雄属性
  info: {
    attack: {
      type: Number,
      min: 0,
      max: 10
    },
    defense: {
      type: Number,
      min: 0,
      max: 10
    },
    magic: {
      type: Number,
      min: 0,
      max: 10
    },
    difficulty: {
      type: Number,
      min: 0,
      max: 10
    }
  },
  
  // 英雄图片
  image: {
    full: String,
    sprite: String,
    group: String,
    x: Number,
    y: Number,
    w: Number,
    h: Number
  },
  
  // 英雄技能
  spells: [{
    id: String,
    name: String,
    description: String,
    tooltip: String,
    cooldown: [Number],
    cost: [Number],
    range: [Number],
    image: {
      full: String,
      sprite: String,
      group: String
    }
  }],
  
  // 被动技能
  passive: {
    name: String,
    description: String,
    image: {
      full: String,
      sprite: String,
      group: String
    }
  },
  
  // 英雄统计数据
  stats: {
    hp: Number,
    hpperlevel: Number,
    mp: Number,
    mpperlevel: Number,
    movespeed: Number,
    armor: Number,
    armorperlevel: Number,
    spellblock: Number,
    spellblockperlevel: Number,
    attackrange: Number,
    hpregen: Number,
    hpregenperlevel: Number,
    mpregen: Number,
    mpregenperlevel: Number,
    crit: Number,
    critperlevel: Number,
    attackdamage: Number,
    attackdamageperlevel: Number,
    attackspeedperlevel: Number,
    attackspeed: Number
  },
  
  // 皮肤信息
  skins: [{
    id: Number,
    num: Number,
    name: String,
    chromas: Boolean
  }],
  
  // 推荐装备
  recommendedItems: [{
    mode: String,
    title: String,
    map: String,
    type: String,
    blocks: [{
      type: String,
      recMath: Boolean,
      items: [{
        id: Number,
        count: Number
      }]
    }]
  }],
  
  // 数据版本和更新时间
  version: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'champions'
});

// 索引
championSchema.index({ name: 1 });
championSchema.index({ tags: 1 });
championSchema.index({ 'info.difficulty': 1 });

// 虚拟字段：英雄头像URL
championSchema.virtual('avatarUrl').get(function() {
  return `https://ddragon.leagueoflegends.com/cdn/13.18.1/img/champion/${this.image.full}`;
});

// 静态方法：根据位置获取英雄
championSchema.statics.findByRole = function(role) {
  return this.find({ tags: role });
};

// 静态方法：根据难度获取英雄
championSchema.statics.findByDifficulty = function(minDiff, maxDiff) {
  return this.find({
    'info.difficulty': {
      $gte: minDiff,
      $lte: maxDiff
    }
  });
};

module.exports = mongoose.model('Champion', championSchema);
