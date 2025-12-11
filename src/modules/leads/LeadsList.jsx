import React, { useState, useEffect } from 'react';
import {
  Button,
  Space,
  Tag,
  message,
  Modal,
  Select,
  Form,
  Avatar,
  Alert,
} from 'antd';
import {
  SwapOutlined,
  StopOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getLeads, deleteLead, leadsApi } from '../../lib/api/client';
import LeadsKanban from './LeadsKanban.jsx';
import CallButton from '../../components/CallButton';
import ClickToCall from '../../components/ui-ClickToCall.jsx';
import BulkActions from '../../components/ui-BulkActions.jsx';
import BulkSMSModal from '../../components/BulkSMSModal';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';
import QuickActions from '../../components/QuickActions.jsx';
import { exportAndDownload } from '../../lib/api/export';
import {
  createTwoLineColumn,
  createTagColumn,
  createDateColumn,
  createEmailColumn,
  createPhoneColumn,
  createCompanyColumn,
} from '../../lib/utils/table-columns.jsx';

function LeadsList() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkSMSModalVisible, setBulkSMSModalVisible] = useState(false);
  const [statusChangeModalVisible, setStatusChangeModalVisible] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkTagModalVisible, setBulkTagModalVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  // Max retries to prevent infinite loops
  const MAX_RETRIES = 3;

  const fetchLeads = async (page = 1, search = '', isRetry = false) => {
    // Prevent infinite retry loop
    if (isRetry && retryCount >= MAX_RETRIES) {
      setError('Unable to connect to server. Please check your connection and try again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await getLeads({
        page,
        page_size: pagination.pageSize,
        search: search || undefined,
      });
      
      // Success - reset retry count and error
      setRetryCount(0);
      setError(null);
      setLeads(response.results || []);
      setPagination({
        ...pagination,
        current: page,
        total: response.count || 0,
      });
    } catch (err) {
      console.error('Error fetching leads:', err);
      
      // Increment retry count if this is a retry attempt
      if (isRetry) {
        setRetryCount(prev => prev + 1);
      }
      
      // Set error message
      const errorMessage = err.message || 'Failed to load leads';
      setError(errorMessage);
      
      // Show user-friendly message
      message.error('Failed to load leads. Please login or check your connection.');
      
      // Clear leads on error
      setLeads([]);
      setPagination({
        ...pagination,
        current: 1,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await fetchLeads(1, searchText, false);
      }
    };
    
    loadData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const handleSearch = (value) => {
    setSearchText(value);
    setRetryCount(0); // Reset retry count on new search
    fetchLeads(1, value, false);
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    fetchLeads(pagination.current, searchText, false);
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

  // Bulk actions handlers
  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map(id => deleteLead(id)));
      message.success(`Удалено ${ids.length} лидов`);
      setSelectedRowKeys([]);
      fetchLeads(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка массового удаления');
    }
  };

  const handleBulkSMS = () => {
    const recipients = leads
      .filter(lead => selectedRowKeys.includes(lead.id))
      .map(lead => ({
        id: lead.id,
        name: `${lead.first_name} ${lead.last_name}`,
        phone: lead.phone,
      }));
    
    if (recipients.some(r => !r.phone)) {
      message.warning('У некоторых выбранных лидов отсутствует номер телефона');
    }
    
    setBulkSMSModalVisible(true);
  };

  const handleBulkStatusChange = () => {
    setStatusChangeModalVisible(true);
  };

  const handleStatusChangeConfirm = async () => {
    if (!bulkStatus) {
      message.error('Выберите статус');
      return;
    }

    try {
      await Promise.all(
        selectedRowKeys.map(id =>
          leadsApi.patch(id, { status: bulkStatus })
        )
      );
      message.success(`Статус изменен для ${selectedRowKeys.length} лидов`);
      setSelectedRowKeys([]);
      setStatusChangeModalVisible(false);
      setBulkStatus('');
      fetchLeads(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка изменения статуса');
    }
  };

  const handleBulkTag = () => {
    setBulkTagModalVisible(true);
  };

  const handleBulkTagConfirm = async () => {
    if (!selectedTags.length) {
      message.error('Выберите хотя бы один тег');
      return;
    }

    try {
      await leadsApi.bulkTag({
        lead_ids: selectedRowKeys,
        tag_ids: selectedTags,
      });
      message.success(`Теги применены к ${selectedRowKeys.length} лидам`);
      setSelectedRowKeys([]);
      setBulkTagModalVisible(false);
      setSelectedTags([]);
      fetchLeads(pagination.current, searchText);
    } catch (error) {
      const errorMessage = error?.details?.detail || error?.message || 'Ошибка применения тегов';
      message.error(errorMessage);
    }
  };

  const handleBulkExport = async () => {
    try {
      await exportAndDownload('leads', {
        format: 'csv',
        filters: { id__in: selectedRowKeys.join(',') },
      });
      message.success('Данные экспортированы');
    } catch (error) {
      message.error('Ошибка экспорта данных');
    }
  };

  const handleCellSave = async (id, field, value) => {
    try {
      await leadsApi.patch(id, { [field]: value });
      message.success('Изменения сохранены');
      // Update local state
      setLeads(leads.map(lead => 
        lead.id === id ? { ...lead, [field]: value } : lead
      ));
    } catch (error) {
      const errorMessage = error?.details?.detail || error?.message || 'Ошибка сохранения';
      message.error(errorMessage);
      throw error; // Re-throw to revert EditableCell changes
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
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

  // Обработчики для QuickActions
  const handleConvert = async (record) => {
    try {
      await leadsApi.convert(record.id);
      message.success('Лид успешно конвертирован в сделку');
      fetchLeads(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка конвертации лида');
    }
  };

  const handleDisqualify = async (record) => {
    try {
      await leadsApi.disqualify(record.id);
      message.success('Лид дисквалифицирован');
      fetchLeads(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка дисквалификации лида');
    }
  };

  const handleSendSMS = (record) => {
    if (!record.phone) {
      message.warning('У лида отсутствует номер телефона');
      return;
    }
    setSelectedRowKeys([record.id]);
    setBulkSMSModalVisible(true);
  };

  const columns = [
    {
      title: 'Контакт',
      key: 'contact',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>
              {record.first_name} {record.last_name}
            </div>
            {record.company && (
              <div style={{ fontSize: 11, color: '#999' }}>
                <ShopOutlined /> {record.company}
              </div>
            )}
          </div>
        </Space>
      ),
      sorter: (a, b) => a.first_name.localeCompare(b.first_name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email) => {
        if (!email) return '-';
        return (
          <Space size="small">
            <MailOutlined style={{ color: '#999' }} />
            <a href={`mailto:${email}`} style={{ fontWeight: 500, fontSize: 13 }}>
              {email}
            </a>
          </Space>
        );
      },
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (phone, record) => {
        if (!phone) return '-';
        return (
          <ClickToCall 
            phoneNumber={phone}
            contactName={`${record.first_name} ${record.last_name}`}
            contactId={record.id}
            entityType="lead"
            size="small"
            type="link"
          />
        );
      },
    },
    createTagColumn({
      title: 'Статус',
      dataIndex: 'status',
      width: 140,
      colorMap: {
        new: 'blue',
        contacted: 'orange',
        qualified: 'green',
        converted: 'cyan',
        lost: 'red',
      },
      textMap: {
        new: 'Новый',
        contacted: 'Связались',
        qualified: 'Квалифицирован',
        converted: 'Конвертирован',
        lost: 'Потерян',
      },
    }),
    createDateColumn({
      title: 'Дата создания',
      dataIndex: 'created_at',
      width: 120,
      format: 'DD.MM.YYYY',
    }),
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          {record.phone && (
            <CallButton
              phone={record.phone}
              name={`${record.first_name} ${record.last_name}`}
              entityType="lead"
              entityId={record.id}
              size="small"
            />
          )}
          <QuickActions
            record={record}
            onView={(r) => navigate(`/leads/${r.id}`)}
            onEdit={(r) => navigate(`/leads/${r.id}/edit`)}
            onDelete={(r) => handleDelete(r.id)}
            onCall={record.phone ? (r) => window.open(`tel:${r.phone}`) : null}
            onSMS={record.phone ? handleSendSMS : null}
            onConvert={handleConvert}
            customActions={[
              {
                key: 'disqualify',
                label: 'Дисквалифицировать',
                icon: <StopOutlined />,
                onClick: () => handleDisqualify(record),
              },
            ]}
          />
        </Space>
      ),
    },
  ];

  const handleExport = async (format) => {
    try {
      await exportAndDownload('leads', {
        format: format === 'excel' ? 'xlsx' : 'csv',
        filters: selectedRowKeys.length > 0 ? { id__in: selectedRowKeys.join(',') } : {},
      });
      message.success(`Данные экспортированы в ${format.toUpperCase()}`);
    } catch (error) {
      message.error('Ошибка экспорта данных');
    }
  };

  return (
    <div>
      <TableToolbar
        title="Лиды"
        total={pagination.total}
        loading={loading}
        searchPlaceholder="Поиск по имени, email, телефону..."
        onSearch={handleSearch}
        onCreate={() => navigate('/leads/new')}
        onExport={handleExport}
        onRefresh={() => fetchLeads(pagination.current, searchText)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        viewModes={['table', 'kanban']}
        createButtonText="Создать лид"
        showViewModeSwitch={true}
      />

      {/* Error Banner with Retry */}
      {error && (
        <Alert
          message="Connection Error"
          description={
            <div>
              <p>{error}</p>
              <p style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                {retryCount > 0 && `Retry attempt ${retryCount} of ${MAX_RETRIES}`}
              </p>
            </div>
          }
          type="error"
          icon={<WarningOutlined />}
          showIcon
          closable
          onClose={() => setError(null)}
          action={
            <Button 
              size="small" 
              danger 
              icon={<ReloadOutlined />}
              onClick={handleRetry}
              disabled={loading}
            >
              Retry
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {viewMode === 'table' ? (
        <EnhancedTable
          columns={columns}
          dataSource={leads}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowSelection={rowSelection}
          scroll={{ x: 1400 }}
          showTotal={true}
          showSizeChanger={true}
          showQuickJumper={true}
          emptyText="Нет лидов"
          emptyDescription="Создайте первого лида или измените параметры поиска"
        />
      ) : (
        <LeadsKanban />
      )}

      <BulkActions
        selectedRowKeys={selectedRowKeys}
        onClearSelection={() => setSelectedRowKeys([])}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatusChange}
        onExport={handleBulkExport}
        onSendSMS={handleBulkSMS}
        onBulkTag={handleBulkTag}
        entityName="лидов"
      />

      <BulkSMSModal
        visible={bulkSMSModalVisible}
        onClose={() => setBulkSMSModalVisible(false)}
        recipients={leads
          .filter(lead => selectedRowKeys.includes(lead.id))
          .map(lead => ({
            id: lead.id,
            name: `${lead.first_name} ${lead.last_name}`,
            phone: lead.phone,
          }))}
      />

      <Modal
        title="Изменить статус лидов"
        open={statusChangeModalVisible}
        onCancel={() => setStatusChangeModalVisible(false)}
        onOk={handleStatusChangeConfirm}
        okText="Применить"
        cancelText="Отмена"
      >
        <p>Изменить статус для {selectedRowKeys.length} выбранных лидов</p>
        <Select
          style={{ width: '100%' }}
          placeholder="Выберите статус"
          value={bulkStatus}
          onChange={setBulkStatus}
        >
          {Object.keys(statusConfig).map(key => (
            <Select.Option key={key} value={key}>
              {statusConfig[key].text}
            </Select.Option>
          ))}
        </Select>
      </Modal>

      <Modal
        title="Добавить теги к лидам"
        open={bulkTagModalVisible}
        onCancel={() => {
          setBulkTagModalVisible(false);
          setSelectedTags([]);
        }}
        onOk={handleBulkTagConfirm}
        okText="Применить"
        cancelText="Отмена"
      >
        <p>Добавить теги к {selectedRowKeys.length} выбранным лидам</p>
        <Form.Item label="Теги">
          <ReferenceSelect
            type="crm-tags"
            mode="multiple"
            placeholder="Выберите теги"
            value={selectedTags}
            onChange={setSelectedTags}
          />
        </Form.Item>
      </Modal>
    </div>
  );
}

export default LeadsList;
