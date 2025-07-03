import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Statistic,
  Alert,
  message,
  Spin,
  Typography,
  Space,
  Tag,
  Divider,
  Modal,
  Progress,
} from 'antd';
import {
  DeleteOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [duplicateReport, setDuplicateReport] = useState(null);
  const [deduplicating, setDeduplicating] = useState(false);
  const [laneInfo, setLaneInfo] = useState([]);
  const [batchUpdating, setBatchUpdating] = useState(false);

  useEffect(() => {
    fetchDuplicateReport();
    fetchLaneInfo();
  }, []);

  const fetchDuplicateReport = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/summoners/duplicates');
      const result = await response.json();

      if (result.success) {
        setDuplicateReport(result.data);
      } else {
        message.error(result.error);
      }
    } catch (error) {
      message.error('获取重复报告失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchLaneInfo = async () => {
    try {
      const response = await fetch('/api/summoners/lanes');
      const result = await response.json();

      if (result.success) {
        setLaneInfo(result.data);
      }
    } catch (error) {
      console.warn('获取路线信息失败');
    }
  };

  const handleDeduplicate = async () => {
    Modal.confirm({
      title: '确认去重',
      content: `即将合并 ${
        duplicateReport?.summary?.duplicateSummoners || 0
      } 个重复的召唤师记录。此操作不可撤销，是否继续？`,
      icon: <WarningOutlined />,
      okText: '确认去重',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          setDeduplicating(true);
          const response = await fetch('/api/summoners/deduplicate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const result = await response.json();

          if (result.success) {
            message.success('去重完成！');

            // 显示去重结果
            Modal.info({
              title: '去重完成',
              content: (
                <div>
                  <p>
                    ✅ 合并了 {result.data.merged.mergedSummoners} 个重复召唤师
                  </p>
                  <p>
                    🧹 清理了 {result.data.cleanup.deletedMatches} 场孤立比赛
                  </p>
                  <p>📊 当前召唤师总数: {result.data.after.totalSummoners}</p>
                </div>
              ),
            });

            // 刷新报告
            fetchDuplicateReport();
          } else {
            message.error(result.error);
          }
        } catch (error) {
          message.error('去重失败');
        } finally {
          setDeduplicating(false);
        }
      },
    });
  };

  const handleBatchUpdate = async () => {
    Modal.confirm({
      title: '批量更新召唤师数据',
      content:
        '将更新所有超过24小时未更新的召唤师数据，此操作可能需要较长时间，是否继续？',
      icon: <InfoCircleOutlined />,
      okText: '开始更新',
      cancelText: '取消',
      onOk: async () => {
        try {
          setBatchUpdating(true);
          const response = await fetch('/api/summoners/batch-update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              forceUpdate: false,
              maxAge: 24, // 24小时
            }),
          });

          const result = await response.json();

          if (result.success) {
            message.success(
              `批量更新完成！成功更新 ${result.data.updatedCount} 个召唤师`
            );

            // 显示详细结果
            Modal.info({
              title: '批量更新结果',
              content: (
                <div>
                  <p>✅ 成功更新: {result.data.updatedCount} 个</p>
                  <p>📊 总计处理: {result.data.totalCount} 个</p>
                  {result.data.results.filter((r) => r.status === 'failed')
                    .length > 0 && (
                    <div>
                      <p>❌ 更新失败:</p>
                      <ul>
                        {result.data.results
                          .filter((r) => r.status === 'failed')
                          .slice(0, 5)
                          .map((r, i) => (
                            <li key={i}>
                              {r.summonerName}: {r.error}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              ),
              width: 600,
            });

            // 刷新报告
            fetchDuplicateReport();
          } else {
            message.error(result.error);
          }
        } catch (error) {
          message.error('批量更新失败');
        } finally {
          setBatchUpdating(false);
        }
      },
    });
  };

  const duplicateColumns = [
    {
      title: '召唤师名称',
      dataIndex: 'summonerName',
      key: 'summonerName',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: '重复数量',
      dataIndex: 'count',
      key: 'count',
      render: (count) => (
        <Tag color={count > 3 ? 'red' : count > 2 ? 'orange' : 'yellow'}>
          {count} 个
        </Tag>
      ),
    },
    {
      title: '数据来源',
      dataIndex: 'dataSources',
      key: 'dataSources',
      render: (sources) => (
        <div>
          {sources.map((source) => (
            <Tag key={source} size="small" style={{ marginBottom: 2 }}>
              {source}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: '召唤师ID',
      dataIndex: 'summonerIds',
      key: 'summonerIds',
      render: (ids) => (
        <div style={{ maxWidth: 200 }}>
          {ids.slice(0, 2).map((id) => (
            <div key={id} style={{ fontSize: '12px', color: '#666' }}>
              {id}
            </div>
          ))}
          {ids.length > 2 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              +{ids.length - 2} 更多...
            </Text>
          )}
        </div>
      ),
    },
  ];

  const laneColumns = [
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      render: (icon) => <span style={{ fontSize: '18px' }}>{icon}</span>,
    },
    {
      title: '中文名称',
      dataIndex: 'chinese',
      key: 'chinese',
    },
    {
      title: '英文名称',
      dataIndex: 'english',
      key: 'english',
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      render: (color) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: color,
              marginRight: 8,
              borderRadius: 4,
            }}
          />
          <Text code>{color}</Text>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>正在加载管理数据...</p>
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>系统管理</Title>

      {/* 快速操作 */}
      <Card title="快速操作" style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={batchUpdating}
            onClick={handleBatchUpdate}
          >
            {batchUpdating ? '批量更新中...' : '批量更新数据'}
          </Button>

          <Button icon={<ReloadOutlined />} onClick={fetchDuplicateReport}>
            刷新统计
          </Button>
        </Space>
      </Card>

      {/* 数据统计 */}
      <Card title="数据统计" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Statistic
              title="召唤师总数"
              value={duplicateReport?.summary?.totalSummoners || 0}
              prefix={<InfoCircleOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="比赛总数"
              value={duplicateReport?.summary?.totalMatches || 0}
              prefix={<InfoCircleOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="重复组数"
              value={duplicateReport?.summary?.duplicateGroups || 0}
              prefix={<WarningOutlined />}
              valueStyle={{
                color:
                  duplicateReport?.summary?.duplicateGroups > 0
                    ? '#ff4d4f'
                    : '#3f8600',
              }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="重复召唤师"
              value={duplicateReport?.summary?.duplicateSummoners || 0}
              prefix={<WarningOutlined />}
              valueStyle={{
                color:
                  duplicateReport?.summary?.duplicateSummoners > 0
                    ? '#ff4d4f'
                    : '#3f8600',
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* 去重操作 */}
      <Card title="数据去重" style={{ marginBottom: 16 }}>
        {duplicateReport?.summary?.duplicateSummoners > 0 ? (
          <Alert
            message="发现重复数据"
            description={`检测到 ${duplicateReport.summary.duplicateGroups} 组重复的召唤师，共 ${duplicateReport.summary.duplicateSummoners} 个重复记录。建议执行去重操作。`}
            type="warning"
            showIcon
            action={
              <Space>
                <Button size="small" onClick={fetchDuplicateReport}>
                  <ReloadOutlined /> 刷新
                </Button>
                <Button
                  type="primary"
                  danger
                  size="small"
                  loading={deduplicating}
                  onClick={handleDeduplicate}
                >
                  <DeleteOutlined /> 执行去重
                </Button>
              </Space>
            }
            style={{ marginBottom: 16 }}
          />
        ) : (
          <Alert
            message="数据正常"
            description="未发现重复的召唤师记录。"
            type="success"
            showIcon
            action={
              <Button size="small" onClick={fetchDuplicateReport}>
                <ReloadOutlined /> 刷新
              </Button>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        {duplicateReport?.duplicates?.length > 0 && (
          <Table
            columns={duplicateColumns}
            dataSource={duplicateReport.duplicates}
            rowKey="summonerName"
            size="small"
            pagination={{ pageSize: 10 }}
            title={() => '重复召唤师详情'}
          />
        )}
      </Card>

      {/* 路线信息 */}
      <Card title="路线翻译对照表">
        <Table
          columns={laneColumns}
          dataSource={laneInfo}
          rowKey="english"
          size="small"
          pagination={false}
        />
      </Card>
    </div>
  );
}

export default AdminPage;
