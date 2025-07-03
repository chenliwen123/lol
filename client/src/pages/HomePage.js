import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Typography, Button, Space, Alert } from 'antd';
import {
  UserOutlined,
  TrophyOutlined,
  BarChartOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { systemAPI, summonerAPI, matchAPI } from '../services/api';

const { Title, Paragraph } = Typography;

function HomePage() {
  const navigate = useNavigate();
  const [systemInfo, setSystemInfo] = useState(null);
  const [stats, setStats] = useState({
    totalSummoners: 0,
    totalMatches: 0,
    recentMatches: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 获取系统信息
      const sysInfo = await systemAPI.getSystemInfo();
      setSystemInfo(sysInfo.data || sysInfo);

      // 获取统计数据
      try {
        const summoners = await summonerAPI.getSummoners({ limit: 1 });
        const matches = await matchAPI.getRecentMatches(5);
        
        setStats({
          totalSummoners: summoners.pagination?.total || 0,
          totalMatches: matches.data?.length || 0,
          recentMatches: matches.data || []
        });
      } catch (error) {
        console.log('统计数据加载失败:', error.message);
      }
    } catch (error) {
      console.error('数据加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          🎮 掌盟战绩数据系统
        </Title>
        <Paragraph>
          欢迎使用掌盟战绩数据系统！这是一个完整的英雄联盟战绩数据抓取、存储和展示平台。
        </Paragraph>
      </div>

      {/* 系统状态 */}
      <Card 
        title="系统状态" 
        style={{ marginBottom: '24px' }}
        loading={loading}
      >
        {systemInfo ? (
          <Alert
            message={`系统运行正常 - ${systemInfo.message || '掌盟战绩数据系统 API'}`}
            description={`版本: ${systemInfo.version || '1.0.0'} | 环境: ${systemInfo.environment || 'development'} | 状态: ${systemInfo.status || 'running'}`}
            type="success"
            showIcon
          />
        ) : (
          <Alert
            message="系统状态检查中..."
            type="info"
            showIcon
          />
        )}
      </Card>

      {/* 统计数据 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="召唤师总数"
              value={stats.totalSummoners}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="比赛记录"
              value={stats.totalMatches}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="数据源"
              value="掌盟"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="系统状态"
              value="运行中"
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 功能介绍 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="🔍 数据抓取" hoverable>
            <Paragraph>
              支持从掌盟抓取召唤师战绩数据，包括排位信息、比赛记录、英雄统计等。
            </Paragraph>
            <Space>
              <Button type="primary" onClick={() => navigate('/crawler')}>
                开始抓取
              </Button>
              <Button onClick={() => navigate('/summoners')}>
                查看召唤师
              </Button>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="📊 数据分析" hoverable>
            <Paragraph>
              提供详细的战绩分析，包括胜率统计、英雄偏好、KDA分析等数据可视化。
            </Paragraph>
            <Space>
              <Button type="primary" onClick={() => navigate('/stats')}>
                查看统计
              </Button>
              <Button onClick={() => navigate('/matches')}>
                比赛记录
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 最近比赛 */}
      {stats.recentMatches.length > 0 && (
        <Card 
          title="最近比赛" 
          style={{ marginTop: '24px' }}
          extra={<Button type="link" onClick={() => navigate('/matches')}>查看更多</Button>}
        >
          <Row gutter={[16, 16]}>
            {stats.recentMatches.map((match, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <Card size="small" hoverable>
                  <div>
                    <strong>{match.gameMode}</strong>
                    <br />
                    <small>
                      {match.participants?.[0]?.summonerName || '未知玩家'} - 
                      {match.participants?.[0]?.championName || '未知英雄'}
                    </small>
                    <br />
                    <small style={{ color: '#666' }}>
                      {new Date(match.gameCreation).toLocaleDateString()}
                    </small>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 使用说明 */}
      <Card title="📖 使用说明" style={{ marginTop: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div>
              <Title level={4}>1. 数据抓取</Title>
              <Paragraph>
                在"数据抓取"页面输入召唤师名称，系统会自动抓取相关战绩数据。
              </Paragraph>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div>
              <Title level={4}>2. 数据查看</Title>
              <Paragraph>
                在"召唤师"和"比赛记录"页面可以查看已抓取的数据和详细信息。
              </Paragraph>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div>
              <Title level={4}>3. 数据分析</Title>
              <Paragraph>
                在"数据统计"页面可以查看各种图表和分析结果。
              </Paragraph>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default HomePage;
