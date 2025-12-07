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
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ShopOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getCompanies, deleteCompany } from '../../lib/api/client';

const { Title } = Typography;

function CompaniesList() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchCompanies = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await getCompanies({
        page,
        page_size: pagination.pageSize,
        search,
      });
      setCompanies(response.results || []);
      setPagination({
        ...pagination,
        current: page,
        total: response.count || 0,
      });
    } catch (error) {
      message.error('Ошибка загрузки компаний');
      // Mock data for demo
      setCompanies([
        {
          id: 1,
          name: 'ООО "ТехноПром"',
          email: 'info@technoprom.ru',
          phone: '+7 495 123-45-67',
          website: 'https://technoprom.ru',
          industry: 'Производство',
          employees_count: 150,
          annual_revenue: 50000000,
          type: 'client',
          created_at: '2024-01-15',
        },
        {
          id: 2,
          name: 'АО "Инновации"',
          email: 'contact@innovations.ru',
          phone: '+7 495 234-56-78',
          website: 'https://innovations.ru',
          industry: 'IT',
          employees_count: 75,
          annual_revenue: 30000000,
          type: 'partner',
          created_at: '2024-01-14',
        },
        {
          id: 3,
          name: 'ИП Сидоров А.В.',
          email: 'sidorov@example.ru',
          phone: '+7 495 345-67-89',
          website: 'https://sidorov-business.ru',
          industry: 'Торговля',
          employees_count: 10,
          annual_revenue: 5000000,
          type: 'supplier',
          created_at: '2024-01-13',
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
    fetchCompanies(1, searchText);
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    fetchCompanies(1, value);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCompany(id);
      message.success('Компания удалена');
      fetchCompanies(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка удаления компании');
    }
  };

  const handleTableChange = (newPagination) => {
    fetchCompanies(newPagination.current, searchText);
  };

  const typeConfig = {
    client: { color: 'blue', text: 'Клиент' },
    partner: { color: 'green', text: 'Партнер' },
    supplier: { color: 'orange', text: 'Поставщик' },
    competitor: { color: 'red', text: 'Конкурент' },
  };

  const columns = [
    {
      title: 'Компания',
      key: 'company',
      render: (_, record) => (
        <Space>
          <Avatar icon={<ShopOutlined />} style={{ backgroundColor: '#52c41a' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            {record.industry && (
              <div style={{ fontSize: 12, color: '#999' }}>{record.industry}</div>
            )}
          </div>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Контакты',
      key: 'contacts',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space size="small">
            <MailOutlined style={{ color: '#999' }} />
            <a href={`mailto:${record.email}`}>{record.email}</a>
          </Space>
          <Space size="small">
            <PhoneOutlined style={{ color: '#999' }} />
            <a href={`tel:${record.phone}`}>{record.phone}</a>
          </Space>
          {record.website && (
            <Space size="small">
              <GlobalOutlined style={{ color: '#999' }} />
              <a href={record.website} target="_blank" rel="noopener noreferrer">
                Сайт
              </a>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: 'Сотрудников',
      dataIndex: 'employees_count',
      key: 'employees_count',
      sorter: (a, b) => a.employees_count - b.employees_count,
      render: (count) => (count ? `${count} чел.` : '-'),
    },
    {
      title: 'Годовой доход',
      dataIndex: 'annual_revenue',
      key: 'annual_revenue',
      sorter: (a, b) => a.annual_revenue - b.annual_revenue,
      render: (revenue) =>
        revenue ? `${(revenue / 1000000).toFixed(1)} млн ₽` : '-',
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const config = typeConfig[type] || typeConfig.client;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: Object.keys(typeConfig).map((key) => ({
        text: typeConfig[key].text,
        value: key,
      })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Дата создания',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => new Date(date).toLocaleDateString('ru-RU'),
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
            onClick={() => navigate(`/companies/${record.id}`)}
          >
            Просмотр
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/companies/${record.id}/edit`)}
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Удалить эту компанию?"
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
        <Title level={2}>Компании</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/companies/new')}
        >
          Создать компанию
        </Button>
      </div>

      <Card>
        <Input.Search
          placeholder="Поиск по названию, email, телефону..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={companies}
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

export default CompaniesList;
