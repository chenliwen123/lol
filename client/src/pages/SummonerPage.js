import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Input, 
  Button, 
  Space, 
  Tag, 
  Avatar, 
  message,
  Pagination,
  Select,
  Row,
  Col
} from 'antd';
import { SearchOutlined, UserOutlined, TrophyOutlined } from '@ant-design/icons';
import { summonerAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;
const { Option } = Select;

function SummonerPage() {
  const [summoners, setSummoners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    tier: '',
    region: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    loadSummoners();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadSummoners = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };
      
      const response = await summonerAPI.getSummoners(params);
      
      if (response.success) {
        setSummoners(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('加载召唤师列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value) => {
    if (!value.trim()) {
      message.warning('请输入召唤师名称');
      return;
    }

    try {
      setSearchLoading(true);
      const response = await summonerAPI.searchSummoner(value.trim());
      
      if (response.success && response.data.length > 0) {
        setSummoners(response.data);
        setPagination(prev => ({
          ...prev,
          current: 1,
          total: response.data.length
        }));
        message.success(`找到 ${response.data.length} 个匹配的召唤师`);
      } else {
        message.info('未找到匹配的召唤师');
        setSummoners([]);
      }
    } catch (error) {
      message.error('搜索失败: ' + error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  };

  const getRankColor = (tier) => {
    const colors = {
      'IRON': '#8B4513',
      'BRONZE': '#CD7F32',
      'SILVER': '#C0C0C0',
      'GOLD': '#FFD700',
      'PLATINUM': '#00CED1',
      'DIAMOND': '#B9F2FF',
      'MASTER': '#9932CC',
      'GRANDMASTER': '#FF4500',
      'CHALLENGER': '#F0E68C'
    };
    return colors[tier] || '#666';
  };

  const columns = [
    {
      title: '召唤师',
      dataIndex: 'summonerName',
      key: 'summonerName',
      render: (text, record) => (
        <Space>
          <Avatar 
            src={record.profileIcon?.iconUrl} 
            icon={<UserOutlined />}
            size="large"
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{text}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              等级 {record.summonerLevel || 1}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '排位',
      dataIndex: ['rankInfo', 'soloRank'],
      key: 'rank',
      render: (rank) => {
        if (!rank || !rank.tier) {
          return <Tag color="default">未定级</Tag>;
        }
        
        return (
          <div>
            <Tag 
              color={getRankColor(rank.tier)}
              style={{ marginBottom: '4px' }}
            >
              {rank.tier} {rank.rank}
            </Tag>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {rank.leaguePoints || 0} LP
            </div>
            {rank.wins && rank.losses && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                {rank.wins}胜 {rank.losses}负 ({rank.winRate || 0}%)
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '区域',
      dataIndex: 'region',
      key: 'region',
      render: (region) => <Tag>{region || 'CN'}</Tag>,
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            onClick={() => navigate(`/summoner/${record.summonerId}`)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="召唤师管理" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索召唤师名称"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              loading={searchLoading}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="选择段位"
              allowClear
              style={{ width: '100%' }}
              value={filters.tier}
              onChange={(value) => handleFilterChange('tier', value)}
            >
              <Option value="IRON">黑铁</Option>
              <Option value="BRONZE">青铜</Option>
              <Option value="SILVER">白银</Option>
              <Option value="GOLD">黄金</Option>
              <Option value="PLATINUM">白金</Option>
              <Option value="DIAMOND">钻石</Option>
              <Option value="MASTER">大师</Option>
              <Option value="GRANDMASTER">宗师</Option>
              <Option value="CHALLENGER">王者</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="选择区域"
              allowClear
              style={{ width: '100%' }}
              value={filters.region}
              onChange={(value) => handleFilterChange('region', value)}
            >
              <Option value="HN1">艾欧尼亚</Option>
              <Option value="HN2">祖安</Option>
              <Option value="HN3">诺克萨斯</Option>
              <Option value="HN4">班德尔城</Option>
              <Option value="HN5">皮尔特沃夫</Option>
              <Option value="WT1">比尔吉沃特</Option>
              <Option value="WT2">德玛西亚</Option>
              <Option value="WT3">弗雷尔卓德</Option>
              <Option value="WT4">无畏先锋</Option>
              <Option value="WT5">恕瑞玛</Option>
              <Option value="EDU1">教育网专区</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Space>
              <Button onClick={loadSummoners}>
                刷新
              </Button>
              <Button 
                type="primary" 
                icon={<TrophyOutlined />}
                onClick={() => navigate('/crawler')}
              >
                抓取新数据
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={summoners}
          rowKey="summonerId"
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
        />

        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }
            onChange={(page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize
              }));
            }}
          />
        </div>
      </Card>
    </div>
  );
}

export default SummonerPage;
