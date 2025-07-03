import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Avatar,
  Spin,
  Alert,
  Divider,
  Typography,
} from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  AimOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { getChampionAvatarUrl } from '../utils/championNames';

const { Title, Text } = Typography;

function SummonerStats() {
  const { summonerId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummonerStats();
  }, [summonerId]);

  const fetchSummonerStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/summoners/${summonerId}/stats`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>正在加载战绩分析...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert message="加载失败" description={error} type="error" showIcon />
    );
  }

  if (!data) {
    return (
      <Alert
        message="暂无数据"
        description="该召唤师暂无战绩数据"
        type="info"
        showIcon
      />
    );
  }

  const { summoner, recentStats } = data;

  // 最常用英雄表格列
  const mostPlayedColumns = [
    {
      title: '英雄',
      dataIndex: 'championName',
      key: 'championName',
      render: (name) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={getChampionAvatarUrl(name)}
            size="small"
            style={{ marginRight: 8 }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span>{name}</span>
        </div>
      ),
    },
    {
      title: '场次',
      dataIndex: 'games',
      key: 'games',
      sorter: (a, b) => b.games - a.games,
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      render: (winRate) => (
        <span
          style={{
            color:
              winRate >= 60 ? '#52c41a' : winRate >= 50 ? '#1890ff' : '#ff4d4f',
          }}
        >
          {winRate}%
        </span>
      ),
      sorter: (a, b) => b.winRate - a.winRate,
    },
    {
      title: 'KDA',
      key: 'kda',
      render: (_, record) => (
        <span>
          {record.avgKills}/{record.avgDeaths}/{record.avgAssists}
        </span>
      ),
    },
    {
      title: 'KDA比',
      dataIndex: 'avgKDA',
      key: 'avgKDA',
      render: (kda) => (
        <Tag color={kda >= 2 ? 'green' : kda >= 1.5 ? 'blue' : 'red'}>
          {kda}
        </Tag>
      ),
      sorter: (a, b) => b.avgKDA - a.avgKDA,
    },
  ];

  // 表现最佳英雄表格列
  const bestPerformingColumns = [
    {
      title: '英雄',
      dataIndex: 'championName',
      key: 'championName',
      render: (name) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={getChampionAvatarUrl(name)}
            size="small"
            style={{ marginRight: 8 }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span>{name}</span>
        </div>
      ),
    },
    {
      title: '场次',
      dataIndex: 'games',
      key: 'games',
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      render: (winRate) => (
        <Progress
          percent={winRate}
          size="small"
          strokeColor={
            winRate >= 60 ? '#52c41a' : winRate >= 50 ? '#1890ff' : '#ff4d4f'
          }
        />
      ),
    },
    {
      title: 'KDA比',
      dataIndex: 'avgKDA',
      key: 'avgKDA',
      render: (kda) => (
        <Tag color={kda >= 2 ? 'green' : kda >= 1.5 ? 'blue' : 'red'}>
          {kda}
        </Tag>
      ),
    },
  ];

  // 位置分布数据
  const roleData = Object.entries(recentStats.roleDistribution || {}).map(
    ([role, count]) => ({
      role: role,
      count: count,
      percentage: Math.round((count / recentStats.totalGames) * 100),
    })
  );

  const getRoleDisplayName = (role) => {
    const roleMap = {
      TOP: '上单',
      JUNGLE: '打野',
      MIDDLE: '中单',
      BOTTOM: 'ADC',
      UTILITY: '辅助',
    };
    return roleMap[role] || role;
  };

  return (
    <div>
      {/* 召唤师基本信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Row align="middle">
          <Col>
            <Avatar
              src={summoner.profileIcon?.iconUrl}
              size={64}
              style={{ marginRight: 16 }}
            />
          </Col>
          <Col flex="auto">
            <Title level={2} style={{ margin: 0 }}>
              {summoner.summonerName}
            </Title>
            <Text type="secondary">
              等级 {summoner.summonerLevel} • {summoner.region}
            </Text>
            {summoner.rankInfo?.soloRank && (
              <div style={{ marginTop: 8 }}>
                <Tag color="gold">
                  {summoner.rankInfo.soloRank.tier}{' '}
                  {summoner.rankInfo.soloRank.rank}
                  {summoner.rankInfo.soloRank.leaguePoints}点
                </Tag>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* 近30天战绩概览 */}
      <Card title="近30天战绩概览" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="总场次"
              value={recentStats.totalGames}
              prefix={<AimOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="胜率"
              value={recentStats.winRate}
              suffix="%"
              prefix={
                recentStats.winRate >= 50 ? <RiseOutlined /> : <FallOutlined />
              }
              valueStyle={{
                color:
                  recentStats.winRate >= 60
                    ? '#3f8600'
                    : recentStats.winRate >= 50
                    ? '#1890ff'
                    : '#cf1322',
              }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="胜场"
              value={recentStats.totalWins}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="平均KDA"
              value={recentStats.averageKDA?.ratio || 0}
              precision={2}
              prefix={<FireOutlined />}
              valueStyle={{
                color:
                  recentStats.averageKDA?.ratio >= 2
                    ? '#3f8600'
                    : recentStats.averageKDA?.ratio >= 1.5
                    ? '#1890ff'
                    : '#cf1322',
              }}
            />
          </Col>
        </Row>

        <Divider />

        <Row>
          <Col span={24}>
            <Text strong>平均KDA详情: </Text>
            <Text>
              {recentStats.averageKDA?.kills || 0} /{' '}
              {recentStats.averageKDA?.deaths || 0} /{' '}
              {recentStats.averageKDA?.assists || 0}
            </Text>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 最常使用英雄 */}
        <Col xs={24} lg={12}>
          <Card title="最常使用英雄" size="small">
            <Table
              dataSource={recentStats.mostPlayedChampions || []}
              columns={mostPlayedColumns}
              pagination={false}
              size="small"
              rowKey="championName"
            />
          </Card>
        </Col>

        {/* 表现最佳英雄 */}
        <Col xs={24} lg={12}>
          <Card title="表现最佳英雄" size="small">
            <Table
              dataSource={recentStats.bestPerformingChampions || []}
              columns={bestPerformingColumns}
              pagination={false}
              size="small"
              rowKey="championName"
            />
          </Card>
        </Col>

        {/* 位置分布 */}
        <Col xs={24} lg={12}>
          <Card title="位置分布" size="small">
            {roleData.map((item) => (
              <div key={item.role} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <span>{getRoleDisplayName(item.role)}</span>
                  <span>
                    {item.count}场 ({item.percentage}%)
                  </span>
                </div>
                <Progress
                  percent={item.percentage}
                  showInfo={false}
                  size="small"
                />
              </div>
            ))}
          </Card>
        </Col>

        {/* 胜率趋势 */}
        <Col xs={24} lg={12}>
          <Card title="战绩总结" size="small">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress
                type="circle"
                percent={recentStats.winRate}
                format={(percent) => `${percent}%`}
                strokeColor={
                  recentStats.winRate >= 60
                    ? '#52c41a'
                    : recentStats.winRate >= 50
                    ? '#1890ff'
                    : '#ff4d4f'
                }
              />
              <div style={{ marginTop: 16 }}>
                <Text strong>
                  {recentStats.totalWins}胜 {recentStats.totalLosses}负
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default SummonerStats;
