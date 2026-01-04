import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Space,
  App,
  Avatar,
  Modal,
  Form,
} from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import { navigate } from '../../router';
import { getContacts, deleteContact, getCompanies, patchContact } from '../../lib/api';
import CallButton from '../../components/CallButton';
import ClickToCall from '../../components/ui-ClickToCall.jsx';
import BulkActions from '../../components/ui-BulkActions.jsx';
import BulkSMSModal from '../../components/BulkSMSModal';
import ReferenceSelect from '../../components/ui-ReferenceSelect';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import TableToolbar from '../../components/ui-TableToolbar.jsx';
import QuickActions from '../../components/QuickActions.jsx';
import EditableCell from '../../components/ui-EditableCell';
import { exportToCSV, exportToExcel } from '../../lib/utils/export';

function ContactsList() {
  const { message } = App.useApp();
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkSMSModalVisible, setBulkSMSModalVisible] = useState(false);
  const [bulkTagModalVisible, setBulkTagModalVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const isMountedRef = useRef(false);
  const activeContactsRequestRef = useRef(null);
  const activeCompaniesRequestRef = useRef(null);

  useEffect(() => {
    // React 18 StrictMode runs effects twice (setup -> cleanup -> setup)
    // so we must reset the mounted flag on each setup.
    isMountedRef.current = true;

    const contactsAbort = new AbortController();
    const companiesAbort = new AbortController();

    // Abort any in-flight requests from previous effect runs
    activeContactsRequestRef.current?.abort?.();
    activeCompaniesRequestRef.current?.abort?.();
    activeContactsRequestRef.current = contactsAbort;
    activeCompaniesRequestRef.current = companiesAbort;

    fetchContacts(1, searchText, pagination.pageSize, contactsAbort.signal);
    loadCompanies(companiesAbort.signal);

    return () => {
      isMountedRef.current = false;
      contactsAbort.abort();
      companiesAbort.abort();
    };
  }, []);

  const loadCompanies = async (signal) => {
    try {
      const response = await getCompanies({ page_size: 200 }, signal ? { signal } : undefined);
      if (!isMountedRef.current) return;
      setCompanies(response?.results || response || []);
    } catch (error) {
      // Abort is expected when navigating away / StrictMode cleanup
      if (error?.name === 'AbortError') return;
      console.error('Error loading companies:', error);
      if (!isMountedRef.current) return;
      setCompanies([]);
    }
  };

  const fetchContacts = async (page = 1, search = '', pageSize = pagination.pageSize, signal) => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getContacts(
        {
          page,
          page_size: pageSize,
          search: search || undefined,
        },
        signal ? { signal } : undefined
      );

      if (!isMountedRef.current) return;

      const results = response?.results || response || [];
      setContacts(results);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total: response?.count || results.length,
      }));
    } catch (error) {
      // Abort is expected when navigating away / StrictMode cleanup
      if (error?.name === 'AbortError') return;
      if (!isMountedRef.current) return;

      setContacts([]);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: 0,
      }));
      const errorMessage = error?.details?.detail || error?.message || 'Не удалось загрузить контакты';
      setError(errorMessage);
      message.error('Не удалось загрузить контакты');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const companyNameById = useMemo(() => {
    return companies.reduce((acc, company) => {
      acc[company.id] = company.full_name || company.name || `#${company.id}`;
      return acc;
    }, {});
  }, [companies]);

  const handleSearch = (value) => {
    setSearchText(value);
    const abort = new AbortController();
    activeContactsRequestRef.current?.abort?.();
    activeContactsRequestRef.current = abort;
    fetchContacts(1, value, pagination.pageSize, abort.signal);
  };

  const handleDelete = async (id) => {
    try {
      await deleteContact(id);
      message.success('Контакт удален');

      const abort = new AbortController();
      activeContactsRequestRef.current?.abort?.();
      activeContactsRequestRef.current = abort;
      fetchContacts(pagination.current, searchText, pagination.pageSize, abort.signal);
    } catch (error) {
      message.error('Ошибка удаления контакта');
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
    const abort = new AbortController();
    activeContactsRequestRef.current?.abort?.();
    activeContactsRequestRef.current = abort;
    fetchContacts(newPagination.current, searchText, newPagination.pageSize, abort.signal);
  };

  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map((contactId) => deleteContact(contactId)));
      message.success(`Удалено ${ids.length} контактов`);
      setSelectedRowKeys([]);

      const abort = new AbortController();
      activeContactsRequestRef.current?.abort?.();
      activeContactsRequestRef.current = abort;
      fetchContacts(pagination.current, searchText, pagination.pageSize, abort.signal);
    } catch (error) {
      message.error('Ошибка массового удаления');
    }
  };

  const handleBulkSMS = () => {
    const recipients = contacts
      .filter((contact) => selectedRowKeys.includes(contact.id))
      .map((contact) => ({
        id: contact.id,
        name: contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        phone: contact.phone,
      }));

    if (recipients.some((r) => !r.phone)) {
      message.warning('У некоторых выбранных контактов отсутствует номер телефона');
    }

    setBulkSMSModalVisible(true);
  };

  const exportColumns = [
    { key: 'first_name', label: 'Имя' },
    { key: 'last_name', label: 'Фамилия' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Телефон' },
    { key: 'company_name', label: 'Компания' },
    { key: 'position', label: 'Должность' },
    { key: 'owner_name', label: 'Ответственный' },
  ];

  const buildExportRows = (ids = []) => {
    const source = ids.length ? contacts.filter((contact) => ids.includes(contact.id)) : contacts;
    return source;
  };

  const performExport = (format, ids = []) => {
    const rows = buildExportRows(ids);
    if (!rows.length) {
      message.warning('Нет данных для экспорта');
      return;
    }
    const ext = format === 'excel' ? 'xlsx' : 'csv';
    const filename = `contacts_${new Date().toISOString().split('T')[0]}.${ext}`;
    if (format === 'excel') {
      exportToExcel(rows, exportColumns, filename);
    } else {
      exportToCSV(rows, exportColumns, filename);
    }
    message.success('Данные экспортированы');
  };

  const handleBulkExport = (ids) => {
    performExport('csv', ids);
  };

  const handleCellSave = async (id, field, value) => {
    try {
      await patchContact(id, { [field]: value });
      message.success('Изменения сохранены');
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === id ? { ...contact, [field]: value } : contact
        )
      );
    } catch (error) {
      const errorMessage = error?.details?.detail || error?.message || 'Ошибка сохранения';
      message.error(errorMessage);
      throw error;
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
      await Promise.all(
        selectedRowKeys.map((contactId) => patchContact(contactId, { tags: selectedTags }))
      );
      message.success(`Теги применены к ${selectedRowKeys.length} контактам`);
      setSelectedRowKeys([]);
      setBulkTagModalVisible(false);
      setSelectedTags([]);

      const abort = new AbortController();
      activeContactsRequestRef.current?.abort?.();
      activeContactsRequestRef.current = abort;
      fetchContacts(pagination.current, searchText, pagination.pageSize, abort.signal);
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

  const handleSendSMS = (record) => {
    if (!record.phone) {
      message.warning('У контакта отсутствует номер телефона');
      return;
    }
    setSelectedRowKeys([record.id]);
    setBulkSMSModalVisible(true);
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
              {record.full_name || `${record.first_name || ''} ${record.last_name || ''}`.trim()}
            </div>
            <EditableCell
              value={record.title}
              onSave={(value) => handleCellSave(record.id, 'title', value)}
              placeholder="Должность"
              renderView={(value) =>
                value ? (
                  <div style={{ fontSize: 12, color: '#999' }}>{value}</div>
                ) : (
                  <div style={{ fontSize: 12, color: '#ccc' }}>Добавить должность</div>
                )
              }
            />
          </div>
        </Space>
      ),
      sorter: (a, b) => (a.full_name || a.first_name || '').localeCompare(b.full_name || b.first_name || ''),
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
          renderView={(value) =>
            value ? (
              <Space size="small">
                <MailOutlined style={{ color: '#999' }} />
                <a href={`mailto:${value}`}>{value}</a>
              </Space>
            ) : (
              '-'
            )
          }
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
          renderView={(value) =>
            value ? (
              <ClickToCall
                phoneNumber={value}
                contactName={record.full_name || `${record.first_name || ''} ${record.last_name || ''}`.trim()}
                contactId={record.id}
                entityType="contact"
                size="small"
                type="link"
              />
            ) : (
              '-'
            )
          }
        />
      ),
    },
    {
      title: 'Компания',
      dataIndex: 'company',
      key: 'company',
      width: 180,
      render: (companyId) => {
        if (!companyId) return '-';
        return companyNameById[companyId] || `#${companyId}`;
      },
    },
    {
      title: 'Дата создания',
      dataIndex: 'creation_date',
      key: 'creation_date',
      width: 130,
      sorter: (a, b) => new Date(a.creation_date) - new Date(b.creation_date),
      render: (date) => (date ? new Date(date).toLocaleDateString('ru-RU') : '-'),
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
              name={record.full_name || `${record.first_name || ''} ${record.last_name || ''}`.trim()}
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
          />
        </Space>
      ),
    },
  ];

  const handleExport = (format) => {
    performExport(format, selectedRowKeys);
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
        onRefresh={() => {
          const abort = new AbortController();
          activeContactsRequestRef.current?.abort?.();
          activeContactsRequestRef.current = abort;
          fetchContacts(pagination.current, searchText, pagination.pageSize, abort.signal);
        }}
        createButtonText="Создать контакт"
        showViewModeSwitch={false}
      />

      {error && (
        <Alert
          type="error"
          message="Ошибка загрузки контактов"
          description={error}
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

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
        onExport={handleBulkExport}
        onSendSMS={handleBulkSMS}
        onBulkTag={handleBulkTag}
        entityName="контактов"
      />

      <BulkSMSModal
        visible={bulkSMSModalVisible}
        onClose={() => setBulkSMSModalVisible(false)}
        recipients={contacts
          .filter((contact) => selectedRowKeys.includes(contact.id))
          .map((contact) => ({
            id: contact.id,
            name: contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
            phone: contact.phone,
          }))}
      />

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
