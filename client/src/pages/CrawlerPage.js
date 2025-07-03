import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Space, 
  message, 
  Alert,
  Divider,
  List,
  Tag,
  Row,
  Col,
  Statistic,
  Progress
} from 'antd';
import { 
  PlayCircleOutlined, 
  StopOutlined, 
  ReloadOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { crawlerAPI } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

function CrawlerPage() {
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [crawlerStatus, setCrawlerStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [crawlResults, setCrawlResults] = useState([]);

  useEffect(() => {
    checkCrawlerStatus();
  }, []);

  const checkCrawlerStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await crawlerAPI.getCrawlerStatus();
      if (response.success) {
        setCrawlerStatus(response.data);
      }
    } catch (error) {
      console.log('获取爬虫状态失败:', error.message);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSingleCrawl = async (values) => {
    try {
      setLoading(true);
      const response = await crawlerAPI.crawlSummoner(values.summonerName, values.region);
      
      if (response.success) {
        message.success('召唤师数据抓取成功！');
        setCrawlResults(prev => [{
          type: 'single',
          summonerName: values.summonerName,
          region: values.region,
          success: true,
          data: response.data,
          timestamp: new Date()
        }, ...prev]);
        form.resetFields();
      }
    } catch (error) {
      message.error('抓取失败: ' + error.message);
      setCrawlResults(prev => [{
        type: 'single',
        summonerName: values.summonerName,
        region: values.region,
        success: false,
        error: error.message,
        timestamp: new Date()
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchCrawl = async (values) => {
    try {
      setLoading(true);
      const summonerNames = values.summonerNames
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      if (summonerNames.length === 0) {
        message.warning('请输入至少一个召唤师名称');
        return;
      }

      if (summonerNames.length > 10) {
        message.warning('批量抓取最多支持10个召唤师');
        return;
      }

      const response = await crawlerAPI.crawlSummoners(summonerNames, values.region);
      
      if (response.success) {
        message.success(response.message || '批量抓取完成！');
        setCrawlResults(prev => [{
          type: 'batch',
          region: values.region,
          success: true,
          data: response.data,
          timestamp: new Date()
        }, ...prev]);
        batchForm.resetFields();
      }
    } catch (error) {
      message.error('批量抓取失败: ' + error.message);
      setCrawlResults(prev => [{
        type: 'batch',
        region: values.region,
        success: false,
        error: error.message,
        timestamp: new Date()
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const handleStopCrawler = async () => {
    try {
      const response = await crawlerAPI.stopCrawler();
      if (response.success) {
        message.success('爬虫已停止');
        checkCrawlerStatus();
      }
    } catch (error) {
      message.error('停止爬虫失败: ' + error.message);
    }
  };

  const handleRestartCrawler = async () => {
    try {
      const response = await crawlerAPI.restartCrawler();
      if (response.success) {
        message.success('爬虫已重启');
        checkCrawlerStatus();
      }
    } catch (error) {
      message.error('重启爬虫失败: ' + error.message);
    }
  };

  const regionOptions = [
    // 电信区
    { value: 'HN1', label: '艾欧尼亚 (电信一区)' },
    { value: 'HN2', label: '祖安 (电信二区)' },
    { value: 'HN3', label: '诺克萨斯 (电信三区)' },
    { value: 'HN4', label: '班德尔城 (电信四区)' },
    { value: 'HN5', label: '皮尔特沃夫 (电信五区)' },
    { value: 'HN6', label: '战争学院 (电信六区)' },
    { value: 'HN7', label: '巨神峰 (电信七区)' },
    { value: 'HN8', label: '雷瑟守备 (电信八区)' },
    { value: 'HN9', label: '裁决之地 (电信九区)' },
    { value: 'HN10', label: '黑色玫瑰 (电信十区)' },
    { value: 'HN11', label: '暗影岛 (电信十一区)' },
    { value: 'HN12', label: '钢铁烈阳 (电信十二区)' },
    { value: 'HN13', label: '水晶之痕 (电信十三区)' },
    { value: 'HN14', label: '均衡教派 (电信十四区)' },
    { value: 'HN15', label: '影流 (电信十五区)' },
    { value: 'HN16', label: '守望之海 (电信十六区)' },
    { value: 'HN17', label: '征服之海 (电信十七区)' },
    { value: 'HN18', label: '卡拉曼达 (电信十八区)' },
    { value: 'HN19', label: '皮城警备 (电信十九区)' },

    // 网通区
    { value: 'WT1', label: '比尔吉沃特 (网通一区)' },
    { value: 'WT2', label: '德玛西亚 (网通二区)' },
    { value: 'WT3', label: '弗雷尔卓德 (网通三区)' },
    { value: 'WT4', label: '无畏先锋 (网通四区)' },
    { value: 'WT5', label: '恕瑞玛 (网通五区)' },
    { value: 'WT6', label: '扭曲丛林 (网通六区)' },
    { value: 'WT7', label: '巨龙之巢 (网通七区)' },

    // 教育网区
    { value: 'EDU1', label: '教育网专区' }
  ];

  return (
    <div>
      {/* 爬虫状态 */}
      <Card title="爬虫状态" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Statistic
              title="状态"
              value={crawlerStatus?.status || '未知'}
              prefix={
                crawlerStatus?.crawlerInitialized ? 
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
              }
              valueStyle={{ 
                color: crawlerStatus?.crawlerInitialized ? '#52c41a' : '#ff4d4f' 
              }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="初始化状态"
              value={crawlerStatus?.crawlerInitialized ? '已初始化' : '未初始化'}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={checkCrawlerStatus}
                loading={statusLoading}
              >
                刷新状态
              </Button>
              <Button 
                icon={<StopOutlined />}
                onClick={handleStopCrawler}
                danger
              >
                停止爬虫
              </Button>
              <Button 
                icon={<PlayCircleOutlined />}
                onClick={handleRestartCrawler}
                type="primary"
              >
                重启爬虫
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 单个抓取 */}
        <Col xs={24} lg={12}>
          <Card title="单个召唤师抓取" extra={<UserAddOutlined />}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSingleCrawl}
              initialValues={{ region: 'HN1' }}
            >
              <Form.Item
                label="召唤师名称"
                name="summonerName"
                rules={[
                  { required: true, message: '请输入召唤师名称' },
                  { max: 16, message: '召唤师名称不能超过16个字符' }
                ]}
              >
                <Input placeholder="请输入召唤师名称" />
              </Form.Item>

              <Form.Item
                label="服务器区域"
                name="region"
                rules={[{ required: true, message: '请选择服务器区域' }]}
              >
                <Select placeholder="选择服务器区域">
                  {regionOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<PlayCircleOutlined />}
                  block
                >
                  开始抓取
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 批量抓取 */}
        <Col xs={24} lg={12}>
          <Card title="批量召唤师抓取" extra={<UsergroupAddOutlined />}>
            <Form
              form={batchForm}
              layout="vertical"
              onFinish={handleBatchCrawl}
              initialValues={{ region: 'HN1' }}
            >
              <Form.Item
                label="召唤师名称列表"
                name="summonerNames"
                rules={[{ required: true, message: '请输入召唤师名称列表' }]}
                extra="每行一个召唤师名称，最多10个"
              >
                <TextArea 
                  rows={6}
                  placeholder="请输入召唤师名称，每行一个&#10;例如：&#10;Faker&#10;Uzi&#10;TheShy"
                />
              </Form.Item>

              <Form.Item
                label="服务器区域"
                name="region"
                rules={[{ required: true, message: '请选择服务器区域' }]}
              >
                <Select placeholder="选择服务器区域">
                  {regionOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<PlayCircleOutlined />}
                  block
                >
                  批量抓取
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* 使用说明 */}
      <Card title="使用说明" style={{ marginTop: '16px' }}>
        <Alert
          message="注意事项"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>请确保输入的召唤师名称准确无误</li>
              <li>抓取过程可能需要一些时间，请耐心等待</li>
              <li>批量抓取建议一次不超过10个召唤师</li>
              <li>如果抓取失败，请检查网络连接和召唤师名称</li>
              <li>系统会自动去重，重复抓取会更新现有数据</li>
            </ul>
          }
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: '16px' }}
        />
      </Card>

      {/* 抓取结果 */}
      {crawlResults.length > 0 && (
        <Card title="抓取结果" style={{ marginTop: '16px' }}>
          <List
            dataSource={crawlResults.slice(0, 10)}
            renderItem={(result, index) => (
              <List.Item key={index}>
                <List.Item.Meta
                  avatar={
                    result.success ? 
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} /> :
                    <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
                  }
                  title={
                    <Space>
                      <Tag color={result.type === 'single' ? 'blue' : 'green'}>
                        {result.type === 'single' ? '单个抓取' : '批量抓取'}
                      </Tag>
                      {result.type === 'single' ? 
                        `${result.summonerName} (${result.region})` :
                        `${result.region} 区域`
                      }
                      <span style={{ color: '#666', fontSize: '12px' }}>
                        {result.timestamp.toLocaleString()}
                      </span>
                    </Space>
                  }
                  description={
                    result.success ? 
                      (result.type === 'single' ? 
                        '抓取成功' : 
                        `批量抓取完成，成功 ${result.data?.filter(r => r.success).length || 0} 个`
                      ) :
                      `失败: ${result.error}`
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}

export default CrawlerPage;
