import React, { useState, useEffect, useMemo } from 'react';
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
import { getIndustries, getClientTypes } from '../../lib/api/reference';
import CallButton from '../../components/CallButton';

const { Title } = Typography;

function CompaniesList() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [industries, setIndustries] = useState([]);
  const [clientTypes, setClientTypes] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchCompanies(1, searchText);
    loadReferenceData();
  }, []);

  const fetchCompanies = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await getCompanies({
        page,
        page_size: pagination.pageSize,
        search,
      });
      setCompanies(response.results || []);
      setPagination((prev) => ({
        ...prev,
        current: page,
        total: response.count || 0,
      }));
    } catch (error) {
      message.error('Ошибка загрузки компаний');
      setCompanies([]);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: 0,
      }));
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [industriesResponse, clientTypesResponse] = await Promise.all([
        getIndustries({ page_size: 200 }),
        getClientTypes({ page_size: 200 }),
      ]);
      setIndustries(industriesResponse.results || industriesResponse || []);
      setClientTypes(clientTypesResponse.results || clientTypesResponse || []);
    } catch (error) {
      console.error('Error loading company reference data:', error);
      setIndustries([]);
      setClientTypes([]);
    }
  };

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

  const industryMap = useMemo(() => {
    return industries.reduce((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});
  }, [industries]);

  const clientTypeMap = useMemo(() => {
    return clientTypes.reduce((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});
  }, [clientTypes]);

  const columns = [
    {
      title: 'Компания',
      key: 'company',
      render: (_, record) => (
        <Space>
          <Avatar icon={<ShopOutlined />} style={{ backgroundColor: '#52c41a' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.full_name || record.name}</div>
            {Array.isArray(record.industry) && record.industry.length > 0 && (
              <div style={{ fontSize: 12, color: '#999' }}>
                {record.industry
                  .map((id) => industryMap[id])
                  .filter(Boolean)
                  .join(', ') || '-'}
              </div>
            )}
          </div>
        </Space>
      ),
      sorter: (a, b) => (a.full_name || a.name || '').localeCompare(b.full_name || b.name || ''),
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
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        if (!type) return '-';
        const label = clientTypeMap[type] || `Тип #${type}`;
        return <Tag color="blue">{label}</Tag>;
      },
    },
    {
      title: 'Дата создания',
      dataIndex: 'creation_date',
      key: 'creation_date',
      sorter: (a, b) => new Date(a.creation_date) - new Date(b.creation_date),
      render: (date) => (date ? new Date(date).toLocaleDateString('ru-RU') : '-'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          <CallButton
            phone={record.phone}
            name={record.name}
            entityType="company"
            entityId={record.id}
            size="small"
            type="primary"
          />
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
