import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Tag,
  Popconfirm,
  message,
  Card,
  Typography,
  Progress,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  DollarOutlined,
  UserOutlined,
  ShopOutlined,
  PhoneOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getDeals, deleteDeal } from '../../lib/api/client';
import CallButton from '../../components/CallButton';
import DealsKPI from './DealsKPI.jsx';

const { Title, Text } = Typography;

function DealsList() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showKPI, setShowKPI] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchDeals = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await getDeals({
        page,
        page_size: pagination.pageSize,
        search,
      });
      setDeals(response.results || []);
      setPagination({
        ...pagination,
        current: page,
        total: response.count || 0,
      });
    } catch (error) {
      message.error('Ошибка загрузки сделок');
      // Mock data for demo
      setDeals([
        {
          id: 1,
          title: 'Поставка оборудования',
          amount: 1500000,
          stage: 'negotiation',
          probability: 70,
          expected_close_date: '2024-03-15',
          contact: 'Иван Петров',
          contact_phone: '+7 999 111-22-33',
          company: 'ООО "ТехноПром"',
          owner: 'Алексей Иванов',
          created_at: '2024-01-20',
        },
        {
          id: 2,
          title: 'Внедрение CRM системы',
          amount: 850000,
          stage: 'proposal',
          probability: 50,
          expected_close_date: '2024-03-30',
          contact: 'Мария Сидорова',
          contact_phone: '+7 999 222-33-44',
          company: 'АО "Инновации"',
          owner: 'Елена Смирнова',
          created_at: '2024-01-18',
        },
        {
          id: 3,
          title: 'Консалтинговые услуги',
          amount: 450000,
          stage: 'closed_won',
          probability: 100,
          expected_close_date: '2024-02-28',
          contact: 'Дмитрий Козлов',
          company: 'ИП Козлов',
          owner: 'Алексей Иванов',
          created_at: '2024-01-15',
        },
      ]);
      setPagination({
        ...pagination,
        current: 1,
        total: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals(1, searchText);
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    fetchDeals(1, value);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDeal(id);
      message.success('Сделка удалена');
      fetchDeals(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка удаления сделки');
    }
  };

  const handleTableChange = (newPagination) => {
    fetchDeals(newPagination.current, searchText);
  };

  const stageConfig = {
    lead: { color: 'default', text: 'Лид' },
    qualification: { color: 'blue', text: 'Квалификация' },
    meeting: { color: 'cyan', text: 'Встреча' },
    proposal: { color: 'orange', text: 'Предложение' },
    negotiation: { color: 'gold', text: 'Переговоры' },
    closed_won: { color: 'green', text: 'Выиграна' },
    closed_lost: { color: 'red', text: 'Проиграна' },
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{title}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.company}
          </Text>
        </div>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <Text strong>{amount.toLocaleString('ru-RU')} ₽</Text>
        </Space>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Стадия',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage) => {
        const config = stageConfig[stage] || stageConfig.lead;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: Object.keys(stageConfig).map((key) => ({
        text: stageConfig[key].text,
        value: key,
      })),
      onFilter: (value, record) => record.stage === value,
    },
    {
      title: 'Вероятность',
      dataIndex: 'probability',
      key: 'probability',
      render: (probability) => (
        <div style={{ width: 100 }}>
          <Progress
            percent={probability}
            size="small"
            status={probability >= 70 ? 'success' : probability >= 40 ? 'normal' : 'exception'}
          />
        </div>
      ),
      sorter: (a, b) => a.probability - b.probability,
    },
    {
      title: 'Контакт',
      key: 'contact',
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{record.contact}</Text>
          {record.contact_phone && (
            <CallButton
              phone={record.contact_phone}
              name={record.contact}
              entityType="deal"
              entityId={record.id}
              size="small"
              type="link"
              icon={true}
            />
          )}
        </Space>
      ),
    },
    {
      title: 'Ответственный',
      dataIndex: 'owner',
      key: 'owner',
      sorter: (a, b) => a.owner.localeCompare(b.owner),
    },
    {
      title: 'Закрытие',
      dataIndex: 'expected_close_date',
      key: 'expected_close_date',
      render: (date) => {
        const closeDate = new Date(date);
        const today = new Date();
        const daysLeft = Math.ceil((closeDate - today) / (1000 * 60 * 60 * 24));
        
        return (
          <div>
            <div>{closeDate.toLocaleDateString('ru-RU')}</div>
            {daysLeft > 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                через {daysLeft} дн.
              </Text>
            )}
            {daysLeft < 0 && (
              <Text type="danger" style={{ fontSize: 12 }}>
                просрочено
              </Text>
            )}
          </div>
        );
      },
      sorter: (a, b) => new Date(a.expected_close_date) - new Date(b.expected_close_date),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/deals/${record.id}`)}
          >
            Просмотр
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/deals/${record.id}/edit`)}
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Удалить эту сделку?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={2}>Сделки</Title>
        <Space>
          <Button
            icon={<BarChartOutlined />}
            onClick={() => setShowKPI(!showKPI)}
          >
            {showKPI ? 'Скрыть статистику' : 'Показать статистику'}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/deals/new')}
          >
            Создать сделку
          </Button>
        </Space>
      </div>

      {showKPI && <DealsKPI deals={deals} />}

      <Card>
        <Input.Search
          placeholder="Поиск по названию, компании, контакту..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={deals}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  );
}

export default DealsList;
