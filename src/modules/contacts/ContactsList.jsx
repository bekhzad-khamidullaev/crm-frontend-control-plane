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
  Modal,
  Select,
  Form,
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
  BarChartOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getContacts, deleteContact, contactsApi } from '../../lib/api/client';
import CallButton from '../../components/CallButton';
import ClickToCall from '../../components/ui-ClickToCall.jsx';
import BulkActions from '../../components/ui-BulkActions.jsx';
import BulkSMSModal from '../../components/BulkSMSModal';
import EditableCell from '../../components/ui-EditableCell';
import ContactsKPI from './ContactsKPI.jsx';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import { exportAndDownload } from '../../lib/api/export';

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
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkSMSModalVisible, setBulkSMSModalVisible] = useState(false);
  const [showKPI, setShowKPI] = useState(true);
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
      const errorMessage = error?.details?.detail || error?.message || 'Ошибка загрузки контактов';
      message.error(errorMessage);
      setContacts([]);
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
        <Space size="small" wrap>
          <CallButton
            phone={record.phone}
            name={`${record.first_name} ${record.last_name}`}
            entityType="contact"
            entityId={record.id}
            size="small"
            type="primary"
          />
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
            onClick={() => navigate('/contacts/new')}
          >
            Создать контакт
          </Button>
        </Space>
      </div>

      {showKPI && <ContactsKPI contacts={contacts} />}

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
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Всего ${total} контактов`,
          }}
          onChange={handleTableChange}
          rowSelection={rowSelection}
          scroll={{ x: 1200 }}
        />
      </Card>

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
