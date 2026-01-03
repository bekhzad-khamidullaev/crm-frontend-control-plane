import React, { useEffect, useState } from 'react';
import { Button, Space, Tag, message } from 'antd';
import { navigate } from '../../router';
import { getCampaigns, deleteCampaign, patchCampaign } from '../../lib/api/marketing';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';
import QuickActions from '../../components/QuickActions.jsx';

function CampaignsList() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchCampaigns(1, searchText);
  }, []);

  const fetchCampaigns = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await getCampaigns({
        page,
        page_size: pagination.pageSize,
        search,
      });
      setCampaigns(response.results || []);
      setPagination((prev) => ({
        ...prev,
        current: page,
        total: response.count || 0,
      }));
    } catch (error) {
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
    } catch (error) {
      message.error('Ошибка удаления кампании');
    }
  };

  const handleToggleActive = async (record) => {
    try {
      await patchCampaign(record.id, { is_active: !record.is_active });
      message.success('Статус обновлен');
      fetchCampaigns(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка обновления статуса');
    }
  };

  const handleTableChange = (newPagination) => {
    fetchCampaigns(newPagination.current, searchText);
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <a onClick={() => navigate(`/campaigns/${record.id}`)}>{name}</a>
      ),
    },
    {
      title: 'Сегмент',
      dataIndex: 'segment_name',
      key: 'segment_name',
      render: (value, record) => value || (record.segment ? `#${record.segment}` : '-'),
    },
    {
      title: 'Шаблон',
      dataIndex: 'template_name',
      key: 'template_name',
      render: (value, record) => value || (record.template ? `#${record.template}` : '-'),
    },
    {
      title: 'Дата старта',
      dataIndex: 'start_at',
      key: 'start_at',
      render: (value) => (value ? new Date(value).toLocaleString('ru-RU') : '-'),
    },
    {
      title: 'Статус',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Активна' : 'Неактивна'}
        </Tag>
      ),
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
    <div>
      <TableToolbar
        title="Кампании"
        total={pagination.total}
        loading={loading}
        searchPlaceholder="Поиск по названию..."
        onSearch={handleSearch}
        onCreate={() => navigate('/campaigns/new')}
        onRefresh={() => fetchCampaigns(pagination.current, searchText)}
        createButtonText="Создать кампанию"
        showViewModeSwitch={false}
      />

      <EnhancedTable
        columns={columns}
        dataSource={campaigns}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
        showTotal={true}
        showSizeChanger={true}
        emptyText="Нет кампаний"
        emptyDescription="Создайте первую кампанию"
      />
    </div>
  );
}

export default CampaignsList;
