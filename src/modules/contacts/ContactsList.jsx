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
import { getContacts, deleteContact, api } from '../../lib/api/client';
import CallButton from '../../components/CallButton';
import ClickToCall from '../../components/ui-ClickToCall.jsx';
import BulkActions from '../../components/ui-BulkActions.jsx';
import BulkSMSModal from '../../components/BulkSMSModal';
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
  const [statusChangeModalVisible, setStatusChangeModalVisible] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');

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
          {record.phone && (
            <ClickToCall 
              phoneNumber={record.phone}
              contactName={`${record.first_name} ${record.last_name}`}
              contactId={record.id}
              entityType="contact"
              size="small"
              type="link"
            />
          )}
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
    </div>
  );
}

export default ContactsList;
