import React, { useState, useEffect } from 'react';
import { Layout, Card, Tabs, Typography, Spin, Alert } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { LeadAnalyticsCard, ContactAnalyticsCard, DealAnalyticsCard, AnalyticsWrapper } from '../components/analytics';
import { getLeads, getContacts, getDeals } from '../lib/api/client';
import { navigate } from '../router';

const { Content } = Layout;
const { Title } = Typography;

/**
 * AnalyticsPage - отдельная страница аналитики с табами
 * Объединяет всю аналитику из leads, contacts, deals
 */
function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('leads');
  
  // Состояния для лидов
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState(null);
  const [leadsLastUpdate, setLeadsLastUpdate] = useState(null);
  
  // Состояния для контактов
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState(null);
  const [contactsLastUpdate, setContactsLastUpdate] = useState(null);
  
  // Состояния для сделок
  const [deals, setDeals] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [dealsError, setDealsError] = useState(null);
  const [dealsLastUpdate, setDealsLastUpdate] = useState(null);

  // Загрузка данных для лидов
  const loadLeads = async () => {
    setLoadingLeads(true);
    setLeadsError(null);
    try {
      const res = await getLeads();
      setLeads(res?.results || []);
      setLeadsLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading leads:', error);
      setLeadsError(error);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Загрузка данных для контактов
  const loadContacts = async () => {
    setLoadingContacts(true);
    setContactsError(null);
    try {
      const res = await getContacts();
      setContacts(res?.results || []);
      setContactsLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContactsError(error);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Загрузка данных для сделок
  const loadDeals = async () => {
    setLoadingDeals(true);
    setDealsError(null);
    try {
      const res = await getDeals();
      setDeals(res?.results || []);
      setDealsLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading deals:', error);
      setDealsError(error);
    } finally {
      setLoadingDeals(false);
    }
  };

  // Загрузка всех данных
  const loadAllData = () => {
    loadLeads();
    loadContacts();
    loadDeals();
  };

  // Начальная загрузка
  useEffect(() => {
    loadAllData();
  }, []);

  // Элементы табов
  const tabItems = [
    {
      key: 'leads',
      label: (
        <span>
          <UserOutlined />
          Лиды
        </span>
      ),
      children: (
        <AnalyticsWrapper
          title=""
          onPeriodChange={(period, customRange) => {
            console.log('Period changed:', period, customRange);
            // Здесь можно добавить фильтрацию по периоду
          }}
          onRefresh={loadLeads}
          exportData={leads.map(l => ({
            Статус: l.status,
            Имя: l.name,
            Email: l.email,
            Телефон: l.phone,
            Источник: l.source,
            Создан: l.created_at,
          }))}
          loading={loadingLeads}
          showFilters={true}
          showExport={true}
          enableRealTime={true}
          realTimeInterval={30000}
          lastUpdate={leadsLastUpdate}
        >
          {leadsError ? (
            <Alert
              message="Ошибка загрузки"
              description="Не удалось загрузить данные о лидах"
              type="error"
              showIcon
            />
          ) : (
            <LeadAnalyticsCard 
              leads={leads}
              showStatistics={true}
              showStatusChart={true}
              showSourceChart={true}
              showFunnelChart={true}
              size="small"
              chartHeight={320}
              enableDrillDown={true}
              onLeadClick={(lead) => {
                navigate(`/leads/${lead.id}`);
              }}
            />
          )}
        </AnalyticsWrapper>
      ),
    },
    {
      key: 'contacts',
      label: (
        <span>
          <TeamOutlined />
          Контакты
        </span>
      ),
      children: (
        <AnalyticsWrapper
          title=""
          onPeriodChange={(period, customRange) => {
            console.log('Period changed:', period, customRange);
          }}
          onRefresh={loadContacts}
          exportData={contacts.map(c => ({
            Имя: c.name,
            Email: c.email,
            Телефон: c.phone,
            Компания: c.company,
            Тип: c.type,
            Создан: c.created_at,
          }))}
          loading={loadingContacts}
          showFilters={true}
          showExport={true}
          enableRealTime={true}
          realTimeInterval={30000}
          lastUpdate={contactsLastUpdate}
        >
          {contactsError ? (
            <Alert
              message="Ошибка загрузки"
              description="Не удалось загрузить данные о контактах"
              type="error"
              showIcon
            />
          ) : (
            <ContactAnalyticsCard 
              contacts={contacts}
              showStatistics={true}
              showTypeChart={true}
              showSourceChart={true}
              showActivityChart={true}
              size="small"
              chartHeight={320}
            />
          )}
        </AnalyticsWrapper>
      ),
    },
    {
      key: 'deals',
      label: (
        <span>
          <TrophyOutlined />
          Сделки
        </span>
      ),
      children: (
        <AnalyticsWrapper
          title=""
          onPeriodChange={(period, customRange) => {
            console.log('Period changed:', period, customRange);
          }}
          onRefresh={loadDeals}
          exportData={deals.map(d => ({
            Название: d.title,
            Сумма: d.amount,
            Стадия: d.stage,
            Контакт: d.contact,
            Компания: d.company,
            Ответственный: d.owner,
            Создан: d.created_at,
          }))}
          loading={loadingDeals}
          showFilters={true}
          showExport={true}
          enableRealTime={true}
          realTimeInterval={30000}
          lastUpdate={dealsLastUpdate}
        >
          {dealsError ? (
            <Alert
              message="Ошибка загрузки"
              description="Не удалось загрузить данные о сделках"
              type="error"
              showIcon
            />
          ) : (
            <DealAnalyticsCard 
              deals={deals}
              showStatistics={true}
              showStageChart={true}
              showManagerChart={true}
              showSourceChart={true}
              size="small"
              chartHeight={320}
            />
          )}
        </AnalyticsWrapper>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>
            <BarChartOutlined /> Аналитика
          </Title>
        </div>

        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            className="analytics-tabs"
          />
        </Card>
      </Content>
    </Layout>
  );
}

export default AnalyticsPage;
