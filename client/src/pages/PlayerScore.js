import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Progress,
  Button,
  Spin,
  Alert,
  Typography,
  Space,
  Tag,
  Statistic,
  Avatar,
  message,
  Modal,
  Input,
} from 'antd';
import {
  ArrowLeftOutlined,
  TrophyOutlined,
  CopyOutlined,
  SendOutlined,
  FireOutlined,
  EyeOutlined,
  DollarOutlined,
  AimOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function PlayerScore() {
  const { summonerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [gameStatus, setGameStatus] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchPlayerScore();
    fetchGameStatus();
  }, [summonerId]);

  const fetchPlayerScore = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/summoners/${summonerId}/score`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('获取评分数据失败');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        message.success('已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败');
      });
  };

  const fetchGameStatus = async () => {
    try {
      const response = await fetch('/api/summoners/game-status');
      const result = await response.json();
      if (result.success) {
        setGameStatus(result.data);
      }
    } catch (err) {
      console.warn('获取游戏状态失败:', err);
    }
  };

  const sendToGame = async (autoSend = false) => {
    try {
      setSendingMessage(true);
      const response = await fetch(`/api/summoners/${summonerId}/send-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ autoSend }),
      });

      const result = await response.json();

      if (result.success) {
        message.success(result.message);
      } else {
        message.error(result.message || '发送失败');
      }
    } catch (err) {
      message.error('发送失败，请检查游戏客户端是否启动');
    } finally {
      setSendingMessage(false);
    }
  };

  const showChatModal = () => {
    setChatModalVisible(true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>正在计算战力评分...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert
        message="加载失败"
        description={error || '获取评分数据失败'}
        type="error"
        showIcon
      />
    );
  }

  const { summoner, score, chatMessage } = data;

  // 获取评分颜色
  const getScoreColor = (scoreValue) => {
    if (scoreValue >= 80) return '#52c41a';
    if (scoreValue >= 60) return '#1890ff';
    if (scoreValue >= 40) return '#faad14';
    return '#ff4d4f';
  };

  // 详细指标数据
  const detailMetrics = [
    { key: 'winRate', title: '胜率', icon: <TrophyOutlined />, suffix: '%' },
    { key: 'kda', title: 'KDA', icon: <FireOutlined /> },
    { key: 'damage', title: '伤害', icon: <AimOutlined /> },
    { key: 'vision', title: '视野', icon: <EyeOutlined /> },
    { key: 'cs', title: '补刀', icon: <AimOutlined /> },
    { key: 'gold', title: '经济', icon: <DollarOutlined /> },
    { key: 'consistency', title: '稳定性', icon: <TrophyOutlined /> },
  ];

  return (
    <div>
      {/* 返回按钮 */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: '16px' }}
      >
        返回
      </Button>

      {/* 召唤师基本信息 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <Avatar src={summoner.profileIcon?.iconUrl} size={64} />
              <div>
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
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={sendingMessage}
                onClick={() => sendToGame(false)}
                disabled={!gameStatus?.canSendMessage}
              >
                {gameStatus?.canSendMessage ? '立即发送到游戏' : '游戏未启动'}
              </Button>

              <Button
                type="default"
                icon={<SendOutlined />}
                loading={sendingMessage}
                onClick={() => sendToGame(true)}
              >
                自动发送
              </Button>

              <Button
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(chatMessage)}
              >
                复制消息
              </Button>

              <Button type="link" onClick={showChatModal}>
                预览消息
              </Button>
            </Space>

            {gameStatus && (
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  游戏状态: {gameStatus.description}
                </Text>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* 综合评分 */}
      <Card title="综合战力评分" style={{ marginBottom: '16px' }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Progress
                type="circle"
                percent={score.totalScore}
                size={120}
                strokeColor={score.color}
                format={() => (
                  <div>
                    <div
                      style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: score.color,
                      }}
                    >
                      {score.rank}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {score.totalScore}分
                    </div>
                  </div>
                )}
              />
            </div>
            <div style={{ marginTop: '16px' }}>
              <Tag
                color={score.color}
                style={{ fontSize: '14px', padding: '4px 12px' }}
              >
                {score.description}
              </Tag>
            </div>
          </Col>

          <Col xs={24} md={16}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ fontSize: '16px' }}>
                评分说明
              </Text>
            </div>
            <Paragraph>
              基于最近 <Text strong>{score.matchCount}</Text>{' '}
              场比赛的综合表现评估， 评分范围0-100分，等级从F到S+。
            </Paragraph>
            <div style={{ marginTop: '16px' }}>
              <Text strong>建议：</Text>
              <Text style={{ marginLeft: '8px' }}>{score.recommendation}</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 详细指标 */}
      <Card title="详细指标分析">
        <Row gutter={[16, 16]}>
          {detailMetrics.map((metric) => {
            const detail = score.details[metric.key];
            if (!detail) return null;

            return (
              <Col xs={12} sm={8} md={6} lg={6} xl={3} key={metric.key}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '8px' }}>
                    {metric.icon}
                    <Text strong style={{ marginLeft: '4px' }}>
                      {metric.title}
                    </Text>
                  </div>

                  <Progress
                    percent={detail.score}
                    size="small"
                    strokeColor={getScoreColor(detail.score)}
                    showInfo={false}
                    style={{ marginBottom: '8px' }}
                  />

                  <div>
                    <Text strong style={{ color: getScoreColor(detail.score) }}>
                      {detail.display}
                      {metric.suffix || ''}
                    </Text>
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {detail.score}分
                    </Text>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* 聊天框消息预览模态框 */}
      <Modal
        title="发送到聊天框"
        open={chatModalVisible}
        onCancel={() => setChatModalVisible(false)}
        footer={[
          <Button
            key="copy"
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(chatMessage)}
          >
            复制
          </Button>,
          <Button key="close" onClick={() => setChatModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary">复制以下内容到游戏聊天框中发送给队友：</Text>
        </div>

        <TextArea
          value={chatMessage}
          rows={12}
          readOnly
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            backgroundColor: '#f5f5f5',
          }}
        />

        <div style={{ marginTop: '16px' }}>
          <Alert
            message="使用说明"
            description={
              <div>
                <p>
                  <strong>自动发送：</strong>
                  点击"自动发送"后，系统会监听游戏状态，在下次进入选英雄阶段时自动发送评分到聊天框。
                </p>
                <p>
                  <strong>立即发送：</strong>
                  需要在选英雄阶段或游戏中使用，直接发送到当前聊天框。
                </p>
                <p>
                  <strong>手动发送：</strong>
                  复制消息内容，在游戏中按Enter打开聊天框，粘贴后按Enter发送。
                </p>
              </div>
            }
            type="info"
            showIcon
          />
        </div>
      </Modal>
    </div>
  );
}

export default PlayerScore;
