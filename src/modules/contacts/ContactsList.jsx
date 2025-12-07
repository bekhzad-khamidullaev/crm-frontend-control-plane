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
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getContacts, deleteContact } from '../../lib/api/client';

const { Title } = Typography;

function ContactsList() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchContacts = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await getContacts({
        page,
        page_size: pagination.pageSize,
        search,
      });
      setContacts(response.results || []);
      setPagination({
        ...pagination,
        current: page,
        total: response.count || 0,
      });
    } catch (error) {
      message.error('Ошибка загрузки контактов');
      // Mock data for demo
      setContacts([
        {
          id: 1,
          first_name: 'Анна',
          last_name: 'Смирнова',
          email: 'anna@example.com',
          phone: '+7 999 111-22-33',
          company: 'ООО "Альфа"',
          position: 'Менеджер',
          type: 'client',
          created_at: '2024-01-20',
        },
        {
          id: 2,
          first_name: 'Дмитрий',
          last_name: 'Козлов',
          email: 'dmitry@example.com',
          phone: '+7 999 222-33-44',
          company: 'ИП Козлов',
          position: 'Директор',
          type: 'partner',
          created_at: '2024-01-19',
        },
        {
          id: 3,
          first_name: 'Елена',
          last_name: 'Волкова',
          email: 'elena@example.com',
          phone: '+7 999 333-44-55',
          company: 'АО "Бета"',
          position: 'Главный специалист',
          type: 'client',
          created_at: '2024-01-18',
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
    fetchContacts(1, searchText);
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    fetchContacts(1, value);
  };

  const handleDelete = async (id) => {
    try {
      await deleteContact(id);
      message.success('Контакт удален');
      fetchContacts(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка удаления контакта');
    }
  };

  const handleTableChange = (newPagination) => {
    fetchContacts(newPagination.current, searchText);
  };

  const typeConfig = {
    client: { color: 'blue', text: 'Клиент' },
    partner: { color: 'green', text: 'Партнер' },
    supplier: { color: 'orange', text: 'Поставщик' },
    employee: { color: 'purple', text: 'Сотрудник' },
  };

  const columns = [
    {
      title: 'Контакт',
      key: 'contact',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.first_name} {record.last_name}
            </div>
            {record.position && (
              <div style={{ fontSize: 12, color: '#999' }}>{record.position}</div>
            )}
          </div>
        </Space>
      ),
      sorter: (a, b) => a.first_name.localeCompare(b.first_name),
    },
    {
      title: 'Контактная информация',
      key: 'info',
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
        </Space>
      ),
    },
    {
      title: 'Компания',
      dataIndex: 'company',
      key: 'company',
      sorter: (a, b) => (a.company || '').localeCompare(b.company || ''),
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
            onClick={() => navigate(`/contacts/${record.id}`)}
          >
            Просмотр
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/contacts/${record.id}/edit`)}
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Удалить этот контакт?"
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
        <Title level={2}>Контакты</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/contacts/new')}
        >
          Создать контакт
        </Button>
      </div>

      <Card>
        <Input.Search
          placeholder="Поиск по имени, email, телефону, компании..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={contacts}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}

export default ContactsList;
