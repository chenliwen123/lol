import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  Statistic,
  Button,
  Spin,
  message,
  Tabs,
  Table,
  Progress,
  Space,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  TrophyOutlined,
  BarChartOutlined,
  FireOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { getChampionAvatarUrl } from '../utils/championNames';

// 路线翻译
const laneTranslations = {
  TOP: '上路',
  JUNGLE: '打野',
  MIDDLE: '中路',
  BOTTOM: '下路',
  UTILITY: '辅助',
  SUPPORT: '辅助',
  NONE: '未知',
};

const getLaneIcon = (lane) => {
  const icons = {
    TOP: '🛡️',
    JUNGLE: '🌲',
    MIDDLE: '⚡',
    BOTTOM: '🏹',
    UTILITY: '💚',
    SUPPORT: '💚',
    NONE: '❓',
  };
  return icons[lane] || icons['NONE'];
};

const getChineseLane = (lane) => {
  return laneTranslations[lane] || lane || '未知';
};
import { summonerAPI, matchAPI } from '../services/api';

const { TabPane } = Tabs;

function SummonerDetail() {
  const { summonerId } = useParams();
  const navigate = useNavigate();
  const [summoner, setSummoner] = useState(null);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (summonerId) {
      loadSummonerDetail();
    }
  }, [summonerId]);

  const loadSummonerDetail = async () => {
    try {
      setLoading(true);

      // 加载召唤师基本信息
      const summonerResponse = await summonerAPI.getSummonerById(summonerId);
      if (summonerResponse.success) {
        setSummoner(summonerResponse.data);
      }

      // 加载比赛记录
      try {
        const matchesResponse = await matchAPI.getSummonerMatches(summonerId, {
          limit: 20,
        });
        if (matchesResponse.success) {
          setMatches(matchesResponse.data || []);
        }
      } catch (error) {
        console.log('比赛记录加载失败:', error.message);
      }

      // 加载统计数据
      try {
        const statsResponse = await matchAPI.getSummonerStats(summonerId, 30);
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      } catch (error) {
        console.log('统计数据加载失败:', error.message);
      }
    } catch (error) {
      message.error('加载召唤师详情失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSummonerData = async (forceUpdate = false) => {
    try {
      setUpdating(true);

      const response = await fetch(`/api/summoners/${summonerId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceUpdate }),
      });

      const result = await response.json();

      if (result.success) {
        message.success(result.message);

        // 如果数据有更新，重新加载页面数据
        if (result.data.summoner) {
          setSummoner(result.data.summoner);
          // 重新加载比赛数据
          try {
            const matchesResponse = await matchAPI.getSummonerMatches(
              summonerId,
              {
                limit: 20,
              }
            );
            if (matchesResponse.success) {
              setMatches(matchesResponse.data || []);
            }
          } catch (error) {
            console.log('重新加载比赛记录失败:', error.message);
          }
        }
      } else {
        message.error(result.error || '更新失败');
      }
    } catch (error) {
      message.error('更新数据失败');
    } finally {
      setUpdating(false);
    }
  };

  const getRankColor = (tier) => {
    const colors = {
      IRON: '#8B4513',
      BRONZE: '#CD7F32',
      SILVER: '#C0C0C0',
      GOLD: '#FFD700',
      PLATINUM: '#00CED1',
      DIAMOND: '#B9F2FF',
      MASTER: '#9932CC',
      GRANDMASTER: '#FF4500',
      CHALLENGER: '#F0E68C',
    };
    return colors[tier] || '#666';
  };

  const matchColumns = [
    {
      title: '游戏模式',
      dataIndex: 'gameMode',
      key: 'gameMode',
      render: (mode) => <Tag>{mode}</Tag>,
    },
    {
      title: '英雄',
      dataIndex: 'playerData',
      key: 'champion',
      render: (playerData) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={getChampionAvatarUrl(playerData?.championName || '未知')}
            size="small"
            style={{ marginRight: 8 }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div>
            <strong>{playerData?.championName || '未知'}</strong>
            <br />
            <small>等级 {playerData?.championLevel || 1}</small>
          </div>
        </div>
      ),
    },
    {
      title: '位置',
      dataIndex: 'playerData',
      key: 'lane',
      render: (playerData) => {
        const lane = playerData?.lane;
        if (!lane || lane === 'NONE')
          return <span style={{ color: '#999' }}>未知</span>;

        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 4 }}>{getLaneIcon(lane)}</span>
            <span>{getChineseLane(lane)}</span>
          </div>
        );
      },
    },
    {
      title: 'KDA',
      dataIndex: 'playerData',
      key: 'kda',
      render: (playerData) => {
        if (!playerData) return '-';
        const { kills = 0, deaths = 0, assists = 0 } = playerData;
        const kda =
          deaths > 0
            ? ((kills + assists) / deaths).toFixed(2)
            : (kills + assists).toFixed(2);

        return (
          <div>
            <span style={{ fontWeight: 'bold' }}>
              {kills}/{deaths}/{assists}
            </span>
            <br />
            <small>KDA: {kda}</small>
          </div>
        );
      },
    },
    {
      title: '结果',
      dataIndex: 'playerData',
      key: 'result',
      render: (playerData) => (
        <Tag color={playerData?.win ? 'success' : 'error'}>
          {playerData?.win ? '胜利' : '失败'}
        </Tag>
      ),
    },
    {
      title: '时间',
      dataIndex: 'gameCreation',
      key: 'time',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/match/${record.matchId}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!summoner) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>召唤师不存在</p>
          <Button onClick={() => navigate('/summoners')}>返回召唤师列表</Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <div
          style={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/summoners')}
          >
            返回列表
          </Button>

          <Space>
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              onClick={() => navigate(`/summoner/${summonerId}/stats`)}
            >
              战绩分析
            </Button>

            <Button
              type="primary"
              danger
              icon={<FireOutlined />}
              onClick={() => navigate(`/summoner/${summonerId}/score`)}
            >
              战力评分
            </Button>

            <Button
              icon={<ReloadOutlined />}
              loading={updating}
              onClick={() => updateSummonerData(false)}
              title="更新召唤师数据"
            >
              {updating ? '更新中...' : '更新数据'}
            </Button>
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={120}
                src={summoner.profileIcon?.iconUrl}
                icon={<UserOutlined />}
              />
              <h2 style={{ marginTop: '16px', marginBottom: '8px' }}>
                {summoner.summonerName}
              </h2>
              <p style={{ color: '#666' }}>
                等级 {summoner.summonerLevel || 1} | {summoner.region || 'CN'}
              </p>
            </div>
          </Col>

          <Col xs={24} md={16}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Card size="small" title="单双排位">
                  {summoner.rankInfo?.soloRank ? (
                    <div>
                      <Tag
                        color={getRankColor(summoner.rankInfo.soloRank.tier)}
                        style={{ fontSize: '14px', padding: '4px 8px' }}
                      >
                        {summoner.rankInfo.soloRank.tier}{' '}
                        {summoner.rankInfo.soloRank.rank}
                      </Tag>
                      <p style={{ margin: '8px 0' }}>
                        {summoner.rankInfo.soloRank.leaguePoints || 0} LP
                      </p>
                      {summoner.rankInfo.soloRank.wins && (
                        <p
                          style={{ margin: 0, fontSize: '12px', color: '#666' }}
                        >
                          {summoner.rankInfo.soloRank.wins}胜{' '}
                          {summoner.rankInfo.soloRank.losses}负 (
                          {summoner.rankInfo.soloRank.winRate || 0}%)
                        </p>
                      )}
                    </div>
                  ) : (
                    <Tag color="default">未定级</Tag>
                  )}
                </Card>
              </Col>

              <Col xs={24} sm={12}>
                <Card size="small" title="灵活排位">
                  {summoner.rankInfo?.flexRank ? (
                    <div>
                      <Tag
                        color={getRankColor(summoner.rankInfo.flexRank.tier)}
                        style={{ fontSize: '14px', padding: '4px 8px' }}
                      >
                        {summoner.rankInfo.flexRank.tier}{' '}
                        {summoner.rankInfo.flexRank.rank}
                      </Tag>
                      <p style={{ margin: '8px 0' }}>
                        {summoner.rankInfo.flexRank.leaguePoints || 0} LP
                      </p>
                    </div>
                  ) : (
                    <Tag color="default">未定级</Tag>
                  )}
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="matches">
        <TabPane tab="比赛记录" key="matches">
          <Card>
            <Table
              columns={matchColumns}
              dataSource={matches}
              rowKey="matchId"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 600 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="数据统计" key="stats">
          <Card>
            {stats ? (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="总场次"
                    value={stats.totalGames}
                    prefix={<TrophyOutlined />}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="胜率"
                    value={stats.winRate}
                    suffix="%"
                    valueStyle={{
                      color:
                        stats.winRate >= 60
                          ? '#52c41a'
                          : stats.winRate >= 50
                          ? '#1890ff'
                          : '#ff4d4f',
                    }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="平均KDA"
                    value={stats.avgKDA}
                    precision={2}
                  />
                </Col>

                <Col xs={24}>
                  <h4>英雄统计</h4>
                  {stats.championStats && stats.championStats.length > 0 ? (
                    stats.championStats.slice(0, 5).map((champion, index) => (
                      <div key={index} style={{ marginBottom: '12px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '4px',
                          }}
                        >
                          <span>{champion.championName}</span>
                          <span>
                            {champion.games}场 ({champion.winRate}%)
                          </span>
                        </div>
                        <Progress
                          percent={parseFloat(champion.winRate)}
                          size="small"
                          strokeColor={
                            champion.winRate >= 60 ? '#52c41a' : '#1890ff'
                          }
                        />
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#666' }}>暂无英雄统计数据</p>
                  )}
                </Col>
              </Row>
            ) : (
              <p style={{ textAlign: 'center', color: '#666' }}>暂无统计数据</p>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}

export default SummonerDetail;
