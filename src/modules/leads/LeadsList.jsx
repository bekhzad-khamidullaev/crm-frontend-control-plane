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
  Segmented,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  TableOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getLeads, deleteLead } from '../../lib/api/client';
import LeadsKanban from './LeadsKanban';
import CallButton from '../../components/CallButton';

const { Title } = Typography;

function LeadsList() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchLeads = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await getLeads({
        page,
        page_size: pagination.pageSize,
        search,
      });
      setLeads(response.results || []);
      setPagination({
        ...pagination,
        current: page,
        total: response.count || 0,
      });
    } catch (error) {
      message.error('Ошибка загрузки лидов');
      // Mock data for demo
      setLeads([
        {
          id: 1,
          first_name: 'Иван',
          last_name: 'Иванов',
          email: 'ivan@example.com',
          phone: '+7 999 123-45-67',
          company: 'ООО "Технологии"',
          status: 'new',
          source: 'website',
          created_at: '2024-01-15',
        },
        {
          id: 2,
          first_name: 'Мария',
          last_name: 'Петрова',
          email: 'maria@example.com',
          phone: '+7 999 234-56-78',
          company: 'АО "Инновации"',
          status: 'contacted',
          source: 'referral',
          created_at: '2024-01-14',
        },
        {
          id: 3,
          first_name: 'Алексей',
          last_name: 'Сидоров',
          email: 'alexey@example.com',
          phone: '+7 999 345-67-89',
          company: 'ИП Сидоров',
          status: 'qualified',
          source: 'email',
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
    fetchLeads(1, searchText);
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    fetchLeads(1, value);
  };

  const handleDelete = async (id) => {
    try {
      await deleteLead(id);
      message.success('Лид удален');
      fetchLeads(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка удаления лида');
    }
  };

  const handleTableChange = (newPagination) => {
    fetchLeads(newPagination.current, searchText);
  };

  const statusConfig = {
    new: { color: 'blue', text: 'Новый' },
    contacted: { color: 'orange', text: 'Связались' },
    qualified: { color: 'green', text: 'Квалифицирован' },
    converted: { color: 'cyan', text: 'Конвертирован' },
    lost: { color: 'red', text: 'Потерян' },
  };

  const columns = [
    {
      title: 'Имя',
      key: 'name',
      render: (_, record) => `${record.first_name} ${record.last_name}`,
      sorter: (a, b) => a.first_name.localeCompare(b.first_name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Компания',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = statusConfig[status] || statusConfig.new;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      filters: Object.keys(statusConfig).map((key) => ({
        text: statusConfig[key].text,
        value: key,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Дата создания',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          <CallButton
            phone={record.phone}
            name={`${record.first_name} ${record.last_name}`}
            entityType="lead"
            entityId={record.id}
            size="small"
            type="primary"
          />
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/leads/${record.id}`)}
          >
            Просмотр
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/leads/${record.id}/edit`)}
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Удалить этот лид?"
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>Лиды</Title>
        <Space>
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              {
                label: 'Таблица',
                value: 'table',
                icon: <TableOutlined />,
              },
              {
                label: 'Канбан',
                value: 'kanban',
                icon: <AppstoreOutlined />,
              },
            ]}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/leads/new')}
          >
            Создать лид
          </Button>
        </Space>
      </div>

      {viewMode === 'table' ? (
        <Card>
          <Input.Search
            placeholder="Поиск по имени, email, телефону..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            style={{ marginBottom: 16 }}
          />

          <Table
            columns={columns}
            dataSource={leads}
            rowKey="id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
          />
        </Card>
      ) : (
        <LeadsKanban />
      )}
    </div>
  );
}

export default LeadsList;
