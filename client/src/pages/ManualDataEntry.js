import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Button, 
  Row, 
  Col, 
  message,
  Divider,
  Space
} from 'antd';
import { PlusOutlined, SaveOutlined } from '@ant-design/icons';

const { Option } = Select;

function ManualDataEntry() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // 构建数据结构
      const summonerData = {
        summonerName: values.summonerName,
        summonerId: `${values.region}_${values.summonerName}_manual_${Date.now()}`,
        summonerLevel: values.summonerLevel,
        region: values.region,
        profileIcon: {
          iconId: values.profileIconId || 1,
          iconUrl: `https://ddragon.leagueoflegends.com/cdn/13.18.1/img/profileicon/${values.profileIconId || 1}.png`
        },
        rankInfo: {
          soloRank: values.soloTier ? {
            tier: values.soloTier,
            rank: values.soloRank,
            leaguePoints: values.soloLP,
            wins: values.soloWins,
            losses: values.soloLosses,
            winRate: values.soloWins && values.soloLosses ? 
              Math.round((values.soloWins / (values.soloWins + values.soloLosses)) * 100) : 0
          } : null,
          flexRank: values.flexTier ? {
            tier: values.flexTier,
            rank: values.flexRank,
            leaguePoints: values.flexLP,
            wins: values.flexWins,
            losses: values.flexLosses,
            winRate: values.flexWins && values.flexLosses ? 
              Math.round((values.flexWins / (values.flexWins + values.flexLosses)) * 100) : 0
          } : null
        },
        dataSource: 'manual',
        lastUpdated: new Date()
      };

      // 发送到后端
      const response = await fetch('/api/summoners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(summonerData)
      });

      if (response.ok) {
        message.success('召唤师数据录入成功！');
        form.resetFields();
      } else {
        throw new Error('录入失败');
      }

    } catch (error) {
      message.error('录入失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const tierOptions = [
    'IRON', 'BRONZE', 'SILVER', 'GOLD', 
    'PLATINUM', 'DIAMOND', 'MASTER', 
    'GRANDMASTER', 'CHALLENGER'
  ];

  const rankOptions = ['IV', 'III', 'II', 'I'];

  const regionOptions = [
    { value: 'HN1', label: '艾欧尼亚' },
    { value: 'HN2', label: '祖安' },
    { value: 'WT1', label: '比尔吉沃特' },
    { value: 'WT2', label: '德玛西亚' },
    { value: 'WT3', label: '弗雷尔卓德' }
  ];

  return (
    <div>
      <Card title="手动录入真实数据" extra={<PlusOutlined />}>
        <p style={{ marginBottom: '24px', color: '#666' }}>
          由于掌盟反爬虫限制，您可以手动录入真实的游戏数据。
          请从游戏客户端或掌盟网站查看您的真实数据，然后在此录入。
        </p>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            region: 'WT1',
            summonerLevel: 30,
            profileIconId: 1
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="召唤师名称"
                name="summonerName"
                rules={[{ required: true, message: '请输入召唤师名称' }]}
              >
                <Input placeholder="例如：love丶小文" />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                label="服务器区域"
                name="region"
                rules={[{ required: true, message: '请选择服务器区域' }]}
              >
                <Select placeholder="选择服务器">
                  {regionOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="召唤师等级"
                name="summonerLevel"
                rules={[{ required: true, message: '请输入召唤师等级' }]}
              >
                <InputNumber min={1} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="头像ID"
                name="profileIconId"
              >
                <InputNumber min={1} max={5000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>单双排位信息</Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item label="段位" name="soloTier">
                <Select placeholder="选择段位" allowClear>
                  {tierOptions.map(tier => (
                    <Option key={tier} value={tier}>{tier}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="等级" name="soloRank">
                <Select placeholder="选择等级" allowClear>
                  {rankOptions.map(rank => (
                    <Option key={rank} value={rank}>{rank}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="胜点" name="soloLP">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="胜场" name="soloWins">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="负场" name="soloLosses">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>灵活排位信息（可选）</Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item label="段位" name="flexTier">
                <Select placeholder="选择段位" allowClear>
                  {tierOptions.map(tier => (
                    <Option key={tier} value={tier}>{tier}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="等级" name="flexRank">
                <Select placeholder="选择等级" allowClear>
                  {rankOptions.map(rank => (
                    <Option key={rank} value={rank}>{rank}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="胜点" name="flexLP">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="胜场" name="flexWins">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="负场" name="flexLosses">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
              >
                保存数据
              </Button>
              <Button onClick={() => form.resetFields()}>
                重置表单
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="使用说明" style={{ marginTop: '16px' }}>
        <ol>
          <li>打开英雄联盟客户端或访问掌盟网站</li>
          <li>查看您的真实召唤师信息和排位数据</li>
          <li>在上面的表单中如实填写这些数据</li>
          <li>点击"保存数据"完成录入</li>
          <li>录入后可以在召唤师页面查看和管理数据</li>
        </ol>
      </Card>
    </div>
  );
}

export default ManualDataEntry;
