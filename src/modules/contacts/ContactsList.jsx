import React, { useState, useEffect } from 'react';
import {
  Button,
  Space,
  Tag,
  message,
  Avatar,
  Modal,
  Select,
  Form,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getContacts, deleteContact, contactsApi } from '../../lib/api/client';
import CallButton from '../../components/CallButton';
import ClickToCall from '../../components/ui-ClickToCall.jsx';
import BulkActions from '../../components/ui-BulkActions.jsx';
import BulkSMSModal from '../../components/BulkSMSModal';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';
import QuickActions from '../../components/QuickActions.jsx';
import EditableCell from '../../components/ui-EditableCell';
import { exportAndDownload } from '../../lib/api/export';
import { createTagColumn, createDateColumn } from '../../lib/utils/table-columns.jsx';

function ContactsList() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
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
      console.error('Error fetching contacts:', error);
      // Mock data for demo when API is unavailable
      setContacts([
        {
          id: 1,
          first_name: 'Анна',
          last_name: 'Васильева',
          email: 'anna.vasilyeva@example.com',
          phone: '+7 999 777-88-99',
          company: 'ООО "Медиа Групп"',
          position: 'Директор по маркетингу',
          type: 'client',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          first_name: 'Сергей',
          last_name: 'Николаев',
          email: 'sergey.nikolaev@example.com',
          phone: '+7 999 888-99-00',
          company: 'АО "Промтех"',
          position: 'Генеральный директор',
          type: 'partner',
          created_at: '2024-01-12T14:30:00Z',
        },
        {
          id: 3,
          first_name: 'Ольга',
          last_name: 'Морозова',
          email: 'olga.morozova@example.com',
          phone: '+7 999 000-11-22',
          company: 'ИП Морозова',
          position: 'Владелец',
          type: 'supplier',
          created_at: '2024-01-08T09:15:00Z',
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

  // Bulk actions handlers
  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map(id => deleteContact(id)));
      message.success(`Удалено ${ids.length} контактов`);
      setSelectedRowKeys([]);
      fetchContacts(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка массового удаления');
    }
  };

  const handleBulkSMS = () => {
    const recipients = contacts
      .filter(contact => selectedRowKeys.includes(contact.id))
      .map(contact => ({
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`,
        phone: contact.phone,
      }));
    
    if (recipients.some(r => !r.phone)) {
      message.warning('У некоторых выбранных контактов отсутствует номер телефона');
    }
    
    setBulkSMSModalVisible(true);
  };

  const handleBulkEmail = () => {
    const recipients = contacts
      .filter(contact => selectedRowKeys.includes(contact.id))
      .filter(contact => contact.email);
    
    if (recipients.length === 0) {
      message.warning('У выбранных контактов нет email адресов');
      return;
    }
    
    message.info('Функция массовой отправки email в разработке');
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
          api.patch(`/api/contacts/${id}/`, { type: bulkStatus })
        )
      );
      message.success(`Тип изменен для ${selectedRowKeys.length} контактов`);
      setSelectedRowKeys([]);
      setStatusChangeModalVisible(false);
      setBulkStatus('');
      fetchContacts(pagination.current, searchText);
    } catch (error) {
      message.error('Ошибка изменения типа');
    }
  };

  const handleBulkExport = async () => {
    try {
      await exportAndDownload('contacts', {
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
      await contactsApi.patch(id, { [field]: value });
      message.success('Изменения сохранены');
      // Update local state
      setContacts(contacts.map(contact => 
        contact.id === id ? { ...contact, [field]: value } : contact
      ));
    } catch (error) {
      const errorMessage = error?.details?.detail || error?.message || 'Ошибка сохранения';
      message.error(errorMessage);
      throw error; // Re-throw to revert EditableCell changes
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
      // Contacts API doesn't have bulk_tag endpoint, so we update individually
      await Promise.all(
        selectedRowKeys.map(id =>
          contactsApi.patch(id, { tags: selectedTags })
        )
      );
      message.success(`Теги применены к ${selectedRowKeys.length} контактам`);
      setSelectedRowKeys([]);
      setBulkTagModalVisible(false);
      setSelectedTags([]);
      fetchContacts(pagination.current, searchText);
    } catch (error) {
      const errorMessage = error?.details?.detail || error?.message || 'Ошибка применения тегов';
      message.error(errorMessage);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const typeConfig = {
    client: { color: 'blue', text: 'Клиент' },
    partner: { color: 'green', text: 'Партнер' },
    supplier: { color: 'orange', text: 'Поставщик' },
    employee: { color: 'purple', text: 'Сотрудник' },
  };

  // Обработчики для QuickActions
  const handleSendSMS = (record) => {
    if (!record.phone) {
      message.warning('У контакта отсутствует номер телефона');
      return;
    }
    setSelectedRowKeys([record.id]);
    setBulkSMSModalVisible(true);
  };

  const handleSendEmail = (record) => {
    if (!record.email) {
      message.warning('У контакта отсутствует email');
      return;
    }
    window.location.href = `mailto:${record.email}`;
  };

  const columns = [
    {
      title: 'Контакт',
      key: 'contact',
      width: 250,
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.first_name} {record.last_name}
            </div>
            <EditableCell
              value={record.position}
              onSave={(value) => handleCellSave(record.id, 'position', value)}
              placeholder="Должность"
              renderView={(value) => value ? (
                <div style={{ fontSize: 12, color: '#999' }}>{value}</div>
              ) : (
                <div style={{ fontSize: 12, color: '#ccc' }}>Добавить должность</div>
              )}
            />
          </div>
        </Space>
      ),
      sorter: (a, b) => a.first_name.localeCompare(b.first_name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      render: (email, record) => (
        <EditableCell
          value={email}
          onSave={(value) => handleCellSave(record.id, 'email', value)}
          type="email"
          placeholder="email@example.com"
          renderView={(value) => value ? (
            <Space size="small">
              <MailOutlined style={{ color: '#999' }} />
              <a href={`mailto:${value}`}>{value}</a>
            </Space>
          ) : '-'}
        />
      ),
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      width: 180,
      render: (phone, record) => (
        <EditableCell
          value={phone}
          onSave={(value) => handleCellSave(record.id, 'phone', value)}
          placeholder="+7 999 123-45-67"
          renderView={(value) => value ? (
            <ClickToCall 
              phoneNumber={value}
              contactName={`${record.first_name} ${record.last_name}`}
              contactId={record.id}
              entityType="contact"
              size="small"
              type="link"
            />
          ) : '-'}
        />
      ),
    },
    {
      title: 'Компания',
      dataIndex: 'company',
      key: 'company',
      width: 180,
      render: (company, record) => (
        <EditableCell
          value={company}
          onSave={(value) => handleCellSave(record.id, 'company', value)}
          placeholder="Название компании"
        />
      ),
      sorter: (a, b) => (a.company || '').localeCompare(b.company || ''),
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 120,
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
      width: 130,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => new Date(date).toLocaleDateString('ru-RU'),
    },
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
              entityType="contact"
              entityId={record.id}
              size="small"
            />
          )}
          <QuickActions
            record={record}
            onView={(r) => navigate(`/contacts/${r.id}`)}
            onEdit={(r) => navigate(`/contacts/${r.id}/edit`)}
            onDelete={(r) => handleDelete(r.id)}
            onCall={record.phone ? (r) => window.open(`tel:${r.phone}`) : null}
            onSMS={record.phone ? handleSendSMS : null}
            onEmail={record.email ? handleSendEmail : null}
          />
        </Space>
      ),
    },
  ];

  const handleExport = async (format) => {
    try {
      await exportAndDownload('contacts', {
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
        title="Контакты"
        total={pagination.total}
        loading={loading}
        searchPlaceholder="Поиск по имени, email, телефону, компании..."
        onSearch={handleSearch}
        onCreate={() => navigate('/contacts/new')}
        onExport={handleExport}
        onRefresh={() => fetchContacts(pagination.current, searchText)}
        createButtonText="Создать контакт"
        showViewModeSwitch={false}
      />

      <EnhancedTable
        columns={columns}
        dataSource={contacts}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowSelection={rowSelection}
        scroll={{ x: 1400 }}
        showTotal={true}
        showSizeChanger={true}
        showQuickJumper={true}
        emptyText="Нет контактов"
        emptyDescription="Создайте первый контакт или измените параметры поиска"
      />

      <BulkActions
        selectedRowKeys={selectedRowKeys}
        onClearSelection={() => setSelectedRowKeys([])}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatusChange}
        onExport={handleBulkExport}
        onSendEmail={handleBulkEmail}
        onSendSMS={handleBulkSMS}
        onBulkTag={handleBulkTag}
        entityName="контактов"
      />

      <BulkSMSModal
        visible={bulkSMSModalVisible}
        onClose={() => setBulkSMSModalVisible(false)}
        recipients={contacts
          .filter(contact => selectedRowKeys.includes(contact.id))
          .map(contact => ({
            id: contact.id,
            name: `${contact.first_name} ${contact.last_name}`,
            phone: contact.phone,
          }))}
      />

      <Modal
        title="Изменить тип контактов"
        open={statusChangeModalVisible}
        onCancel={() => setStatusChangeModalVisible(false)}
        onOk={handleStatusChangeConfirm}
        okText="Применить"
        cancelText="Отмена"
      >
        <p>Изменить тип для {selectedRowKeys.length} выбранных контактов</p>
        <Select
          style={{ width: '100%' }}
          placeholder="Выберите тип"
          value={bulkStatus}
          onChange={setBulkStatus}
        >
          {Object.keys(typeConfig).map(key => (
            <Select.Option key={key} value={key}>
              {typeConfig[key].text}
            </Select.Option>
          ))}
        </Select>
      </Modal>

      <Modal
        title="Добавить теги к контактам"
        open={bulkTagModalVisible}
        onCancel={() => {
          setBulkTagModalVisible(false);
          setSelectedTags([]);
        }}
        onOk={handleBulkTagConfirm}
        okText="Применить"
        cancelText="Отмена"
      >
        <p>Добавить теги к {selectedRowKeys.length} выбранным контактам</p>
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

export default ContactsList;
