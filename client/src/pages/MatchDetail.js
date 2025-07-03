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
  Divider,
  Typography,
  Space,
  Tooltip,
  Progress
} from 'antd';
import {
  ArrowLeftOutlined,
  TrophyOutlined,
  FireOutlined,
  EyeOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { getChampionAvatarUrl, getEnglishChampionName } from '../utils/championNames';

const { Title, Text } = Typography;

function MatchDetail() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatchDetail();
  }, [matchId]);

  const fetchMatchDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/matches/${matchId}`);
      const result = await response.json();
      
      if (result.success) {
        setMatch(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('获取比赛详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>正在加载比赛详情...</p>
      </div>
    );
  }

  if (error || !match) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>{error || '比赛不存在'}</p>
          <Button onClick={() => navigate(-1)}>
            返回
          </Button>
        </div>
      </Card>
    );
  }

  const participant = match.participants[0]; // 主要参与者
  const gameDate = new Date(match.gameCreation);
  const gameDurationMinutes = Math.floor(match.gameDuration / 60);
  const gameDurationSeconds = match.gameDuration % 60;

  // 计算KDA
  const kda = participant.deaths > 0 ? 
    ((participant.kills + participant.assists) / participant.deaths).toFixed(2) : 
    (participant.kills + participant.assists).toFixed(2);

  // 获取召唤师技能名称
  const getSummonerSpellName = (spellId) => {
    const spells = {
      1: '净化', 3: '虚弱', 4: '闪现', 6: '幽灵疾步', 7: '治疗',
      11: '惩戒', 12: '传送', 13: '澄澈', 14: '点燃', 21: '屏障'
    };
    return spells[spellId] || `技能${spellId}`;
  };

  // 获取符文系名称
  const getRuneTreeName = (primary) => {
    const trees = {
      'Precision': '精密',
      'Domination': '主宰', 
      'Sorcery': '巫术',
      'Resolve': '坚决',
      'Inspiration': '启迪'
    };
    return trees[primary] || primary;
  };

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

      {/* 比赛基本信息 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <div>
                <Title level={3} style={{ margin: 0, color: participant.win ? '#52c41a' : '#ff4d4f' }}>
                  {participant.win ? '胜利' : '失败'}
                </Title>
                <Text type="secondary">
                  {match.gameMode === 'ARAM' ? '极地大乱斗' : '召唤师峡谷'} • 
                  {gameDurationMinutes}分{gameDurationSeconds}秒
                </Text>
              </div>
              
              <Divider type="vertical" style={{ height: '40px' }} />
              
              <div style={{ textAlign: 'center' }}>
                <Avatar
                  src={getChampionAvatarUrl(participant.championName)}
                  size={64}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div style={{ marginTop: '8px' }}>
                  <Text strong>{participant.championName}</Text>
                  <br />
                  <Text type="secondary">等级 {participant.championLevel}</Text>
                </div>
              </div>
            </Space>
          </Col>
          
          <Col>
            <Text type="secondary">
              {gameDate.toLocaleDateString()} {gameDate.toLocaleTimeString()}
            </Text>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 战绩统计 */}
        <Col xs={24} lg={12}>
          <Card title="战绩统计" size="small">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="KDA"
                  value={`${participant.kills}/${participant.deaths}/${participant.assists}`}
                  prefix={<TrophyOutlined />}
                />
                <div style={{ marginTop: '8px' }}>
                  <Tag color={kda >= 2 ? 'green' : kda >= 1.5 ? 'blue' : 'red'}>
                    KDA: {kda}
                  </Tag>
                </div>
              </Col>
              
              <Col span={8}>
                <Statistic
                  title="伤害"
                  value={participant.totalDamageDealtToChampions}
                  prefix={<FireOutlined />}
                  formatter={(value) => `${Math.round(value / 1000)}K`}
                />
              </Col>
              
              <Col span={8}>
                <Statistic
                  title="视野"
                  value={participant.visionScore}
                  prefix={<EyeOutlined />}
                />
              </Col>
              
              <Col span={8}>
                <Statistic
                  title="金币"
                  value={participant.goldEarned}
                  prefix={<DollarOutlined />}
                  formatter={(value) => `${Math.round(value / 1000)}K`}
                />
              </Col>
              
              <Col span={8}>
                <Statistic
                  title="补刀"
                  value={participant.totalMinionsKilled}
                />
              </Col>
              
              <Col span={8}>
                <Statistic
                  title="位置"
                  value={participant.lane}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 装备 */}
        <Col xs={24} lg={12}>
          <Card title="装备" size="small">
            <Row gutter={[8, 8]}>
              {participant.items && participant.items.map((item, index) => (
                <Col span={4} key={index}>
                  <Tooltip title={item.itemName}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: item.itemId === 0 ? '#f5f5f5' : '#fff'
                    }}>
                      {item.itemId !== 0 ? (
                        <img 
                          src={`https://ddragon.leagueoflegends.com/cdn/13.18.1/img/item/${item.itemId}.png`}
                          alt={item.itemName}
                          style={{ width: '32px', height: '32px' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#999',
                        display: item.itemId === 0 ? 'block' : 'none'
                      }}>
                        空
                      </span>
                    </div>
                  </Tooltip>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* 召唤师技能 */}
        <Col xs={24} lg={12}>
          <Card title="召唤师技能" size="small">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/13.18.1/img/spell/Summoner${getSummonerSpellName(participant.summoner1Id)}.png`}
                    alt={getSummonerSpellName(participant.summoner1Id)}
                    style={{ width: '32px', height: '32px', marginRight: '8px' }}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  <Text>{getSummonerSpellName(participant.summoner1Id)}</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/13.18.1/img/spell/Summoner${getSummonerSpellName(participant.summoner2Id)}.png`}
                    alt={getSummonerSpellName(participant.summoner2Id)}
                    style={{ width: '32px', height: '32px', marginRight: '8px' }}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  <Text>{getSummonerSpellName(participant.summoner2Id)}</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 符文配置 */}
        <Col xs={24} lg={12}>
          <Card title="符文配置" size="small">
            {participant.runes ? (
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>主系：{getRuneTreeName(participant.runes.primary)}</Text>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>副系：{getRuneTreeName(participant.runes.secondary)}</Text>
                </div>
                <div>
                  <Text type="secondary">
                    符文详情：{participant.runes.primaryRunes?.join(', ') || '未知'}
                  </Text>
                </div>
              </div>
            ) : (
              <Text type="secondary">符文信息不可用</Text>
            )}
          </Card>
        </Col>

        {/* 团队统计 */}
        {match.teams && (
          <Col span={24}>
            <Card title="团队统计" size="small">
              <Row gutter={[16, 16]}>
                {match.teams.map((team, index) => (
                  <Col xs={24} md={12} key={team.teamId}>
                    <Card 
                      size="small" 
                      title={
                        <span style={{ color: team.win ? '#52c41a' : '#ff4d4f' }}>
                          {team.teamId === 100 ? '蓝色方' : '红色方'} 
                          {team.win ? ' (胜利)' : ' (失败)'}
                        </span>
                      }
                    >
                      <Row gutter={[8, 8]}>
                        <Col span={8}>
                          <Statistic
                            title="击杀大龙"
                            value={team.baronKills}
                            size="small"
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="击杀小龙"
                            value={team.dragonKills}
                            size="small"
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="摧毁防御塔"
                            value={team.towerKills}
                            size="small"
                          />
                        </Col>
                      </Row>
                      
                      <div style={{ marginTop: '12px' }}>
                        <Space>
                          {team.firstBaron && <Tag color="purple">首杀大龙</Tag>}
                          {team.firstDragon && <Tag color="red">首杀小龙</Tag>}
                          {team.firstTower && <Tag color="blue">首摧防御塔</Tag>}
                        </Space>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
}

export default MatchDetail;
