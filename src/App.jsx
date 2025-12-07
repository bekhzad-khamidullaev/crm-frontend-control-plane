import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  ShopOutlined,
  DollarOutlined,
  CheckSquareOutlined,
  FolderOutlined,
  MessageOutlined,
  PhoneOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { parseHash, navigate, onRouteChange } from './router';
import Dashboard from './pages/dashboard.jsx';
import LoginPage from './pages/login.jsx';
import LeadsList from './modules/leads/LeadsList.jsx';
import LeadForm from './modules/leads/LeadForm.jsx';
import LeadDetail from './modules/leads/LeadDetail.jsx';
import ContactsList from './modules/contacts/ContactsList.jsx';
import ContactForm from './modules/contacts/ContactForm.jsx';
import ContactDetail from './modules/contacts/ContactDetail.jsx';
import CompaniesList from './modules/companies/CompaniesList.jsx';
import CompanyForm from './modules/companies/CompanyForm.jsx';
import CompanyDetail from './modules/companies/CompanyDetail.jsx';
import DealsList from './modules/deals/DealsList.jsx';
import DealForm from './modules/deals/DealForm.jsx';
import DealDetail from './modules/deals/DealDetail.jsx';
import TasksList from './modules/tasks/TasksList.jsx';
import ProjectsList from './modules/projects/ProjectsList.jsx';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [route, setRoute] = useState(parseHash());
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('authToken');
    if (token) {
      setUser({ name: 'User', email: 'user@example.com' });
    }

    // Subscribe to route changes
    const unsubscribe = onRouteChange((newRoute) => {
      setRoute(newRoute);
    });

    return unsubscribe;
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Профиль',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: 'Настройки',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Выход',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'leads',
      icon: <UserOutlined />,
      label: 'Leads',
      onClick: () => navigate('/leads'),
    },
    {
      key: 'contacts',
      icon: <TeamOutlined />,
      label: 'Контакты',
      onClick: () => navigate('/contacts'),
    },
    {
      key: 'companies',
      icon: <ShopOutlined />,
      label: 'Компании',
      onClick: () => navigate('/companies'),
    },
    {
      key: 'deals',
      icon: <DollarOutlined />,
      label: 'Сделки',
      onClick: () => navigate('/deals'),
    },
    {
      key: 'tasks',
      icon: <CheckSquareOutlined />,
      label: 'Задачи',
      onClick: () => navigate('/tasks'),
    },
    {
      key: 'projects',
      icon: <FolderOutlined />,
      label: 'Проекты',
      onClick: () => navigate('/projects'),
    },
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: 'Чат',
      onClick: () => navigate('/chat'),
    },
    {
      key: 'calls',
      icon: <PhoneOutlined />,
      label: 'Звонки',
      onClick: () => navigate('/calls'),
    },
    {
      key: 'memos',
      icon: <FileTextOutlined />,
      label: 'Заметки',
      onClick: () => navigate('/memos'),
    },
  ];

  const getSelectedKey = () => {
    const name = route.name;
    if (name.startsWith('leads')) return 'leads';
    if (name.startsWith('contacts')) return 'contacts';
    if (name.startsWith('companies')) return 'companies';
    if (name.startsWith('deals')) return 'deals';
    if (name.startsWith('tasks')) return 'tasks';
    if (name.startsWith('projects')) return 'projects';
    if (name.startsWith('chat')) return 'chat';
    if (name.startsWith('calls')) return 'calls';
    if (name.startsWith('memos')) return 'memos';
    return name;
  };

  const renderContent = () => {
    if (!user && route.name !== 'login') {
      return <LoginPage onLogin={setUser} />;
    }

    switch (route.name) {
      case 'login':
        return <LoginPage onLogin={setUser} />;
      case 'dashboard':
        return <Dashboard />;
      case 'leads-list':
        return <LeadsList />;
      case 'leads-new':
        return <LeadForm />;
      case 'leads-edit':
        return <LeadForm id={route.params.id} />;
      case 'leads-detail':
        return <LeadDetail id={route.params.id} />;
      case 'contacts-list':
        return <ContactsList />;
      case 'contacts-new':
        return <ContactForm />;
      case 'contacts-edit':
        return <ContactForm id={route.params.id} />;
      case 'contacts-detail':
        return <ContactDetail id={route.params.id} />;
      case 'companies-list':
        return <CompaniesList />;
      case 'companies-new':
        return <CompanyForm />;
      case 'companies-edit':
        return <CompanyForm id={route.params.id} />;
      case 'companies-detail':
        return <CompanyDetail id={route.params.id} />;
      case 'deals-list':
        return <DealsList />;
      case 'deals-new':
        return <DealForm />;
      case 'deals-edit':
        return <DealForm id={route.params.id} />;
      case 'deals-detail':
        return <DealDetail id={route.params.id} />;
      case 'tasks-list':
        return <TasksList />;
      case 'projects-list':
        return <ProjectsList />;
      default:
        return <Dashboard />;
    }
  };

  if (!user && route.name === 'login') {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 20,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'CRM' : 'Enterprise CRM'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: () => setCollapsed(!collapsed),
            style: { fontSize: 18, cursor: 'pointer' },
          })}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <Text>{user?.name || 'Guest'}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: 8,
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
