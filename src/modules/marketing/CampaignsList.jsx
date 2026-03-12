import React, { useEffect, useState } from 'react';
import { Button, Card, Input, Space, Table, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { navigate } from '../../router';
import { getCampaigns, deleteCampaign, patchCampaign } from '../../lib/api/marketing';
import QuickActions from '../../components/QuickActions.jsx';

const { Search } = Input;
const { Text, Title } = Typography;

function CampaignsList() {
  const [campaigns, setCampaigns] = useState([]);
  const [allCampaignsCache, setAllCampaignsCache] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    fetchCampaigns(1, searchText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCampaigns = async (page = 1, search = '', pageSize = pagination.pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCampaigns({ page, page_size: pageSize, search });
      const results = response.results || [];
      const totalCount = response.count || 0;

      if (results.length > pageSize && results.length === totalCount) {
        setAllCampaignsCache(results);
        const startIndex = (page - 1) * pageSize;
        setCampaigns(results.slice(startIndex, startIndex + pageSize));
      } else {
        setAllCampaignsCache(null);
        setCampaigns(results);
      }

      setPagination((prev) => ({ ...prev, current: page, pageSize, total: totalCount }));
    } catch (e) {
      setError(e?.message || 'Не удалось загрузить кампании');
      message.error('Ошибка загрузки кампаний');
      setCampaigns([]);
      setPagination((prev) => ({ ...prev, current: 1, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchCampaigns(1, value);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCampaign(id);
      message.success('Кампания удалена');
      fetchCampaigns(pagination.current, searchText);
    } catch {
      message.error('Ошибка удаления кампании');
    }
  };

  const handleToggleActive = async (record) => {
    try {
      await patchCampaign(record.id, { is_active: !record.is_active });
      message.success('Статус обновлен');
      fetchCampaigns(pagination.current, searchText);
    } catch {
      message.error('Ошибка обновления статуса');
    }
  };

  const handleTableChange = (newPagination) => {
    const nextPage = newPagination?.current || 1;
    const nextPageSize = newPagination?.pageSize || pagination.pageSize;

    if (nextPageSize !== pagination.pageSize) {
      setPagination((p) => ({ ...p, pageSize: nextPageSize }));
      setAllCampaignsCache(null);
      fetchCampaigns(nextPage, searchText, nextPageSize);
      return;
    }

    if (allCampaignsCache && allCampaignsCache.length > 0) {
      const startIndex = (nextPage - 1) * nextPageSize;
      setCampaigns(allCampaignsCache.slice(startIndex, startIndex + nextPageSize));
      setPagination((p) => ({ ...p, current: nextPage }));
    } else {
      fetchCampaigns(nextPage, searchText, nextPageSize);
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => <a onClick={() => navigate(`/campaigns/${record.id}`)}>{name}</a>,
    },
    { title: 'Сегмент', dataIndex: 'segment_name', key: 'segment_name', render: (value) => value || '-' },
    { title: 'Шаблон', dataIndex: 'template_name', key: 'template_name', render: (value) => value || '-' },
    { title: 'Дата старта', dataIndex: 'start_at', key: 'start_at', render: (value) => (value ? new Date(value).toLocaleString('ru-RU') : '-') },
    {
      title: 'Статус',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => <Tag color={isActive ? 'green' : 'default'}>{isActive ? 'Активна' : 'Неактивна'}</Tag>,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <QuickActions
            record={record}
            onView={(r) => navigate(`/campaigns/${r.id}`)}
            onEdit={(r) => navigate(`/campaigns/${r.id}/edit`)}
            onDelete={(r) => handleDelete(r.id)}
            onArchive={() => handleToggleActive(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Кампании</Title>
            <Text type="secondary">Список маркетинговых кампаний</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/campaigns/new')}>Создать кампанию</Button>
        </Space>

        <Space wrap>
          <Search
            value={searchText}
            placeholder="Поиск по названию..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 320 }}
          />
          <Button onClick={() => fetchCampaigns(pagination.current, searchText)} loading={loading}>Обновить</Button>
        </Space>

        {error ? <Text type="danger">{error}</Text> : null}

        <Table
          columns={columns}
          dataSource={campaigns}
          loading={loading}
          rowKey="id"
          pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `Всего: ${total}` }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          locale={{ emptyText: 'Нет кампаний' }}
        />
      </Space>
    </Card>
  );
}

export default CampaignsList;
