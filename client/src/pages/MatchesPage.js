import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Select,
  Row,
  Col,
  Statistic,
  Avatar
} from 'antd';
import { TrophyOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import { matchAPI } from '../services/api';

const { Option } = Select;

function MatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    gameMode: '',
    queueId: ''
  });
  const [stats, setStats] = useState({
    totalMatches: 0,
    classicMatches: 0,
    aramMatches: 0
  });

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await matchAPI.getRecentMatches(50);
      
      if (response.success) {
        const matchData = response.data || [];
        setMatches(matchData);
        
        // 计算统计数据
        const totalMatches = matchData.length;
        const classicMatches = matchData.filter(m => m.gameMode === 'CLASSIC').length;
        const aramMatches = matchData.filter(m => m.gameMode === 'ARAM').length;
        
        setStats({
          totalMatches,
          classicMatches,
          aramMatches
        });
      }
    } catch (error) {
      message.error('加载比赛记录失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getFilteredMatches = () => {
    return matches.filter(match => {
      if (filters.gameMode && match.gameMode !== filters.gameMode) {
        return false;
      }
      if (filters.queueId && match.queueId !== parseInt(filters.queueId)) {
        return false;
      }
      return true;
    });
  };

  const columns = [
    {
      title: '游戏模式',
      dataIndex: 'gameMode',
      key: 'gameMode',
      render: (mode) => {
        const modeMap = {
          'CLASSIC': { text: '经典模式', color: 'blue' },
          'ARAM': { text: '大乱斗', color: 'green' },
          'URF': { text: '无限火力', color: 'orange' }
        };
        const modeInfo = modeMap[mode] || { text: mode, color: 'default' };
        return <Tag color={modeInfo.color}>{modeInfo.text}</Tag>;
      },
      filters: [
        { text: '经典模式', value: 'CLASSIC' },
        { text: '大乱斗', value: 'ARAM' },
        { text: '无限火力', value: 'URF' }
      ],
      onFilter: (value, record) => record.gameMode === value,
    },
    {
      title: '参与者',
      dataIndex: 'participants',
      key: 'participants',
      render: (participants) => {
        if (!participants || participants.length === 0) {
          return <span style={{ color: '#666' }}>无数据</span>;
        }
        
        const player = participants[0];
        return (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <div>
              <div style={{ fontWeight: 'bold' }}>{player.summonerName || '未知玩家'}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {player.championName || '未知英雄'}
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'KDA',
      dataIndex: 'participants',
      key: 'kda',
      render: (participants) => {
        if (!participants || participants.length === 0) {
          return '-';
        }
        
        const player = participants[0];
        const { kills = 0, deaths = 0, assists = 0 } = player;
        const kda = deaths > 0 ? ((kills + assists) / deaths).toFixed(2) : (kills + assists).toFixed(2);
        
        return (
          <div>
            <span style={{ fontWeight: 'bold' }}>
              {kills}/{deaths}/{assists}
            </span>
            <br />
            <small style={{ color: '#666' }}>KDA: {kda}</small>
          </div>
        );
      },
    },
    {
      title: '结果',
      dataIndex: 'participants',
      key: 'result',
      render: (participants) => {
        if (!participants || participants.length === 0) {
          return '-';
        }
        
        const player = participants[0];
        return (
          <Tag color={player.win ? 'success' : 'error'}>
            {player.win ? '胜利' : '失败'}
          </Tag>
        );
      },
      filters: [
        { text: '胜利', value: true },
        { text: '失败', value: false }
      ],
      onFilter: (value, record) => {
        const player = record.participants?.[0];
        return player?.win === value;
      },
    },
    {
      title: '游戏时长',
      dataIndex: 'gameDuration',
      key: 'duration',
      render: (duration) => {
        if (!duration) return '-';
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      },
      sorter: (a, b) => (a.gameDuration || 0) - (b.gameDuration || 0),
    },
    {
      title: '游戏时间',
      dataIndex: 'gameCreation',
      key: 'gameCreation',
      render: (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString();
      },
      sorter: (a, b) => new Date(a.gameCreation || 0) - new Date(b.gameCreation || 0),
      defaultSortOrder: 'descend',
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

  const filteredMatches = getFilteredMatches();

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="总比赛数"
              value={stats.totalMatches}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="经典模式"
              value={stats.classicMatches}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="大乱斗"
              value={stats.aramMatches}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card title="比赛记录">
        {/* 筛选器 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="选择游戏模式"
              allowClear
              style={{ width: '100%' }}
              value={filters.gameMode}
              onChange={(value) => handleFilterChange('gameMode', value)}
            >
              <Option value="CLASSIC">经典模式</Option>
              <Option value="ARAM">大乱斗</Option>
              <Option value="URF">无限火力</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="选择队列类型"
              allowClear
              style={{ width: '100%' }}
              value={filters.queueId}
              onChange={(value) => handleFilterChange('queueId', value)}
            >
              <Option value="420">单双排位</Option>
              <Option value="440">灵活排位</Option>
              <Option value="450">大乱斗</Option>
              <Option value="400">匹配模式</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={12}>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={loadMatches}
                loading={loading}
              >
                刷新
              </Button>
              <span style={{ color: '#666' }}>
                显示 {filteredMatches.length} / {matches.length} 场比赛
              </span>
            </Space>
          </Col>
        </Row>

        {/* 比赛表格 */}
        <Table
          columns={columns}
          dataSource={filteredMatches}
          rowKey="matchId"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}

export default MatchesPage;
