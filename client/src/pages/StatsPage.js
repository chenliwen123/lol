import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Table,
  Select,
  message,
  Empty,
  Spin
} from 'antd';
import { 
  TrophyOutlined, 
  UserOutlined, 
  BarChartOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from 'recharts';
import { summonerAPI, matchAPI } from '../services/api';

const { Option } = Select;

function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [summoners, setSummoners] = useState([]);
  const [selectedSummoner, setSelectedSummoner] = useState(null);
  const [stats, setStats] = useState(null);
  const [globalStats, setGlobalStats] = useState({
    totalSummoners: 0,
    totalMatches: 0,
    avgWinRate: 0,
    rankDistribution: []
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSummoner) {
      loadSummonerStats(selectedSummoner);
    }
  }, [selectedSummoner]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // 加载召唤师列表
      const summonersResponse = await summonerAPI.getSummoners({ limit: 100 });
      if (summonersResponse.success) {
        const summonerData = summonersResponse.data || [];
        setSummoners(summonerData);
        
        // 计算全局统计
        calculateGlobalStats(summonerData);
        
        // 默认选择第一个召唤师
        if (summonerData.length > 0) {
          setSelectedSummoner(summonerData[0].summonerId);
        }
      }
    } catch (error) {
      message.error('加载数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateGlobalStats = (summonerData) => {
    const totalSummoners = summonerData.length;
    let totalWins = 0;
    let totalGames = 0;
    const rankCount = {};

    summonerData.forEach(summoner => {
      const soloRank = summoner.rankInfo?.soloRank;
      if (soloRank) {
        totalWins += soloRank.wins || 0;
        totalGames += (soloRank.wins || 0) + (soloRank.losses || 0);
        
        const tier = soloRank.tier || 'UNRANKED';
        rankCount[tier] = (rankCount[tier] || 0) + 1;
      }
    });

    const avgWinRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
    
    const rankDistribution = Object.entries(rankCount).map(([tier, count]) => ({
      tier,
      count,
      percentage: Math.round((count / totalSummoners) * 100)
    }));

    setGlobalStats({
      totalSummoners,
      totalMatches: totalGames,
      avgWinRate,
      rankDistribution
    });
  };

  const loadSummonerStats = async (summonerId) => {
    try {
      const response = await matchAPI.getSummonerStats(summonerId, 30);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.log('加载召唤师统计失败:', error.message);
      setStats(null);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  const rankColors = {
    'IRON': '#8B4513',
    'BRONZE': '#CD7F32',
    'SILVER': '#C0C0C0', 
    'GOLD': '#FFD700',
    'PLATINUM': '#00CED1',
    'DIAMOND': '#B9F2FF',
    'MASTER': '#9932CC',
    'GRANDMASTER': '#FF4500',
    'CHALLENGER': '#F0E68C',
    'UNRANKED': '#666666'
  };

  const championColumns = [
    {
      title: '英雄',
      dataIndex: 'championName',
      key: 'championName',
    },
    {
      title: '场次',
      dataIndex: 'games',
      key: 'games',
      sorter: (a, b) => a.games - b.games,
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      render: (winRate) => (
        <div>
          <Progress 
            percent={parseFloat(winRate)} 
            size="small"
            strokeColor={winRate >= 60 ? '#52c41a' : winRate >= 50 ? '#1890ff' : '#ff4d4f'}
          />
          <span style={{ marginLeft: '8px' }}>{winRate}%</span>
        </div>
      ),
      sorter: (a, b) => parseFloat(a.winRate) - parseFloat(b.winRate),
    },
    {
      title: '平均KDA',
      dataIndex: 'avgKDA',
      key: 'avgKDA',
      render: (kda) => (
        <span style={{ 
          color: kda >= 2 ? '#52c41a' : kda >= 1.5 ? '#1890ff' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {kda}
        </span>
      ),
      sorter: (a, b) => parseFloat(a.avgKDA) - parseFloat(b.avgKDA),
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* 全局统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总召唤师数"
              value={globalStats.totalSummoners}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总比赛数"
              value={globalStats.totalMatches}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="平均胜率"
              value={globalStats.avgWinRate}
              suffix="%"
              prefix={globalStats.avgWinRate >= 50 ? <RiseOutlined /> : <FallOutlined />}
              valueStyle={{ 
                color: globalStats.avgWinRate >= 50 ? '#52c41a' : '#ff4d4f' 
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="数据来源"
              value="掌盟"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 段位分布 */}
        <Col xs={24} lg={12}>
          <Card title="段位分布">
            {globalStats.rankDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={globalStats.rankDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ tier, percentage }) => `${tier} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {globalStats.rankDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={rankColors[entry.tier] || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无段位数据" />
            )}
          </Card>
        </Col>

        {/* 召唤师选择和个人统计 */}
        <Col xs={24} lg={12}>
          <Card title="个人统计">
            <div style={{ marginBottom: '16px' }}>
              <Select
                placeholder="选择召唤师"
                style={{ width: '100%' }}
                value={selectedSummoner}
                onChange={setSelectedSummoner}
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {summoners.map(summoner => (
                  <Option key={summoner.summonerId} value={summoner.summonerId}>
                    {summoner.summonerName}
                  </Option>
                ))}
              </Select>
            </div>

            {stats ? (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                  <Col span={8}>
                    <Statistic
                      title="总场次"
                      value={stats.totalGames}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="胜率"
                      value={stats.winRate}
                      suffix="%"
                      valueStyle={{ 
                        fontSize: '16px',
                        color: stats.winRate >= 60 ? '#52c41a' : 
                               stats.winRate >= 50 ? '#1890ff' : '#ff4d4f' 
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="平均KDA"
                      value={stats.avgKDA}
                      precision={2}
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                </Row>

                <div>
                  <h4>近期表现</h4>
                  <Row gutter={[8, 8]}>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                          {stats.avgKills}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>平均击杀</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>
                          {stats.avgDeaths}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>平均死亡</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                          {stats.avgAssists}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>平均助攻</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            ) : (
              <Empty description="请选择召唤师查看统计数据" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 英雄统计 */}
      {stats && stats.championStats && stats.championStats.length > 0 && (
        <Card title="英雄统计" style={{ marginTop: '16px' }}>
          <Table
            columns={championColumns}
            dataSource={stats.championStats}
            rowKey="championName"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      )}
    </div>
  );
}

export default StatsPage;
