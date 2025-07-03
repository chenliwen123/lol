import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  TrophyOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import HomePage from './pages/HomePage';
import SummonerPage from './pages/SummonerPage';
import SummonerDetail from './pages/SummonerDetail';
import SummonerStats from './pages/SummonerStats';
import PlayerScore from './pages/PlayerScore';
import MatchesPage from './pages/MatchesPage';
import MatchDetail from './pages/MatchDetail';
import StatsPage from './pages/StatsPage';
import CrawlerPage from './pages/CrawlerPage';
import AdminPage from './pages/AdminPage';

const { Header, Content } = Layout;

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/summoners',
      icon: <UserOutlined />,
      label: '召唤师',
    },
    {
      key: '/matches',
      icon: <TrophyOutlined />,
      label: '比赛记录',
    },
    {
      key: '/stats',
      icon: <BarChartOutlined />,
      label: '数据统计',
    },
    {
      key: '/crawler',
      icon: <SettingOutlined />,
      label: '数据抓取',
    },
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: '系统管理',
    },
  ];

  const handleMenuClick = (e) => {
    console.log('Menu clicked:', e.key);
    navigate(e.key);
  };

  return (
    <Layout className="app">
      <Header className="app-header">
        <div
          className="app-logo"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          🎮 掌盟战绩系统
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="app-nav"
          style={{ lineHeight: '64px' }}
          onClick={handleMenuClick}
        />
      </Header>

      <Content className="content-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/summoners" element={<SummonerPage />} />
          <Route path="/summoner/:summonerId" element={<SummonerDetail />} />
          <Route
            path="/summoner/:summonerId/stats"
            element={<SummonerStats />}
          />
          <Route path="/summoner/:summonerId/score" element={<PlayerScore />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/match/:matchId" element={<MatchDetail />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/crawler" element={<CrawlerPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Content>
    </Layout>
  );
}

export default App;
