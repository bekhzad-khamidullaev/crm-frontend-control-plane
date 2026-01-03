/**
 * CallsList Component
 * Displays list of call logs with filtering and statistics
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Space,
  Tag,
  Button,
  Input,
  DatePicker,
  Select,
  Form,
  Typography,
  message,
  Tooltip,
  Statistic,
  Row,
  Col,
  Empty,
  Modal,
  Tabs,
} from 'antd';
import {
  PhoneOutlined,
  SearchOutlined,
  PhoneFilled,
  ClockCircleOutlined,
  ReloadOutlined,
  PhoneTwoTone,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  AudioOutlined,
  FormOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  getVoipCallLogs,
  getVoipCallLog,
  getCallStatistics,
  getCallLogs,
  getCallLog,
  createCallLog,
  updateCallLog,
  deleteCallLog,
  addCallNote,
} from '../../lib/api/calls.js';
import { getContacts, getContact } from '../../lib/api/client.js';
import CallButton from '../../components/CallButton.jsx';
import AudioPlayer from '../../components/AudioPlayer.jsx';
import CrudPage from '../../components/CrudPage.jsx';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

function CallsList() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [recordingModalVisible, setRecordingModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('voip');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState(null);
  const [noteSaving, setNoteSaving] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, loading: false, data: null });
  const [noteForm] = Form.useForm();
  const [filters, setFilters] = useState({
    direction: null,
    status: null,
    dateRange: null,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 500,
      };

      if (filters.direction) params.direction = filters.direction;
      if (filters.status) params.status = filters.status;
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.date_from = filters.dateRange[0].format('YYYY-MM-DD');
        params.date_to = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await getVoipCallLogs(params);
      const results = response?.results || response || [];
      const filtered = searchText
        ? results.filter((item) => `${item.phone_number || item.number || ''}`.includes(searchText))
        : results;

      setCalls(filtered);
      setPagination({
        ...pagination,
        current: 1,
        total: filtered.length,
      });
    } catch (error) {
      console.error('Error fetching calls:', error);
      message.error('Ошибка загрузки истории звонков');
      setCalls([]);
      setPagination({
        ...pagination,
        current: 1,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = {};
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.date_from = filters.dateRange[0].format('YYYY-MM-DD');
        params.date_to = filters.dateRange[1].format('YYYY-MM-DD');
      }
      
      const stats = await getCallStatistics(params);
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStatistics(null);
    }
  };

  useEffect(() => {
    if (activeTab !== 'voip') return;
    fetchCalls();
    fetchStatistics();
  }, [searchText, filters, activeTab]);

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  const handleClearFilters = () => {
    setFilters({
      direction: null,
      status: null,
      dateRange: null,
    });
    setSearchText('');
  };

  const handleTableChange = (newPagination) => {
    setPagination((prev) => ({ ...prev, current: newPagination.current }));
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handlePlayRecording = (call) => {
    setSelectedRecording(call);
    setRecordingModalVisible(true);
  };

  const handleCloseRecordingModal = () => {
    setRecordingModalVisible(false);
    setSelectedRecording(null);
  };

  const handleOpenNoteModal = (record) => {
    setNoteTarget(record);
    noteForm.setFieldsValue({ note: record?.notes || record?.note || '' });
    setNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteTarget) return;
    try {
      const values = await noteForm.validateFields();
      setNoteSaving(true);
      await addCallNote(noteTarget.id, { note: values.note });
      message.success('Заметка добавлена');
      setNoteModalOpen(false);
      setNoteTarget(null);
      noteForm.resetFields();
      fetchCalls();
    } catch (error) {
      if (error?.errorFields) return;
      message.error('Ошибка добавления заметки');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleCloseNoteModal = () => {
    setNoteModalOpen(false);
    setNoteTarget(null);
    noteForm.resetFields();
  };

  const handleViewDetails = async (record) => {
    setDetailModal({ open: true, loading: true, data: null });
    try {
      const data = await getVoipCallLog(record.id);
      setDetailModal({ open: true, loading: false, data });
    } catch (error) {
      console.error('Error loading call details:', error);
      message.error('Ошибка загрузки деталей звонка');
      setDetailModal({ open: true, loading: false, data: null });
    }
  };

  const handleCloseDetailModal = () => {
    setDetailModal({ open: false, loading: false, data: null });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const statusConfig = {
    answered: { color: 'success', text: 'Отвечен', icon: <CheckCircleOutlined /> },
    completed: { color: 'success', text: 'Завершен', icon: <CheckCircleOutlined /> },
    missed: { color: 'error', text: 'Пропущен', icon: <CloseCircleOutlined /> },
    no_answer: { color: 'error', text: 'Нет ответа', icon: <CloseCircleOutlined /> },
    busy: { color: 'warning', text: 'Занято', icon: <CloseCircleOutlined /> },
    failed: { color: 'error', text: 'Ошибка', icon: <CloseCircleOutlined /> },
    ringing: { color: 'processing', text: 'Звонит', icon: <PhoneFilled /> },
  };

  const columns = [
    {
      title: 'Направление',
      dataIndex: 'direction',
      key: 'direction',
      width: 120,
      render: (direction) => (
        <Space>
          <PhoneTwoTone twoToneColor={direction === 'inbound' ? '#52c41a' : '#1890ff'} />
          <Text>{direction === 'inbound' ? 'Входящий' : 'Исходящий'}</Text>
        </Space>
      ),
      filters: [
        { text: 'Входящие', value: 'inbound' },
        { text: 'Исходящие', value: 'outbound' },
      ],
      onFilter: (value, record) => record.direction === value,
    },
    {
      title: 'Номер телефона',
      dataIndex: 'phone_number',
      key: 'phone_number',
      render: (phone, record) => (
        <Space>
          <PhoneOutlined />
          <a href={`tel:${phone || record.number}`}>{phone || record.number}</a>
        </Space>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => {
        const config = statusConfig[status] || statusConfig.completed;
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Дата и время',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 180,
      render: (date, record) => dayjs(date || record.timestamp).format('DD.MM.YYYY HH:mm'),
      sorter: (a, b) => new Date(a.started_at || a.timestamp) - new Date(b.started_at || b.timestamp),
    },
    {
      title: 'Длительность',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      render: (duration) => (
        <Space>
          <ClockCircleOutlined />
          {formatDuration(duration)}
        </Space>
      ),
      sorter: (a, b) => (a.duration || 0) - (b.duration || 0),
    },
    {
      title: 'Заметки',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes, record) => notes || record.note || <Text type="secondary">-</Text>,
    },
    {
      title: 'Запись',
      dataIndex: 'recording_url',
      key: 'recording',
      width: 100,
      align: 'center',
      render: (recording_url, record) => {
        if (recording_url) {
          return (
            <Tooltip title="Прослушать запись">
              <Button
                type="link"
                icon={<AudioOutlined />}
                size="small"
                onClick={() => handlePlayRecording(record)}
              >
                Запись
              </Button>
            </Tooltip>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          {record.recording_url && (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              size="small"
              onClick={() => handlePlayRecording(record)}
            >
              Прослушать
            </Button>
          )}
          <Button
            type="link"
            icon={<FormOutlined />}
            size="small"
            onClick={() => handleOpenNoteModal(record)}
          >
            Заметка
          </Button>
          <Button
            type="link"
            icon={<InfoCircleOutlined />}
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            Детали
          </Button>
          <CallButton
            phone={record.phone_number || record.number}
            name={record.phone_number || record.number}
            entityType={record.related_lead ? 'lead' : 'contact'}
            entityId={record.related_lead || record.related_contact}
            size="small"
            type="link"
            icon={true}
          />
        </Space>
      ),
    },
  ];

  const crmDirectionOptions = [
    { label: 'Входящий', value: 'inbound' },
    { label: 'Исходящий', value: 'outbound' },
  ];

  const crmColumns = [
    {
      title: 'Номер',
      dataIndex: 'number',
      key: 'number',
      render: (value) => value || '-',
    },
    {
      title: 'Направление',
      dataIndex: 'direction',
      key: 'direction',
      render: (direction) => (direction === 'inbound' ? 'Входящий' : 'Исходящий'),
      width: 140,
    },
    {
      title: 'Контакт',
      dataIndex: 'contact_name',
      key: 'contact_name',
      render: (value, record) => value || (record.contact ? `#${record.contact}` : '-'),
    },
    {
      title: 'Длительность',
      dataIndex: 'duration',
      key: 'duration',
      width: 140,
      render: (value) => formatDuration(value || 0),
    },
    {
      title: 'Дата',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (value) => (value ? dayjs(value).format('DD.MM.YYYY HH:mm') : '-'),
    },
    {
      title: 'VoIP ID',
      dataIndex: 'voip_call_id',
      key: 'voip_call_id',
      width: 160,
      render: (value) => value || '-',
    },
  ];

  const crmFields = [
    {
      name: 'direction',
      label: 'Направление',
      type: 'select',
      required: true,
      options: crmDirectionOptions,
      placeholder: 'Выберите направление',
    },
    {
      name: 'number',
      label: 'Номер',
      type: 'text',
      required: true,
      placeholder: 'Номер телефона',
    },
    {
      name: 'duration',
      label: 'Длительность (сек)',
      type: 'number',
      min: 0,
    },
    {
      name: 'contact',
      label: 'Контакт',
      type: 'entity',
      fetchList: getContacts,
      fetchById: getContact,
    },
    {
      name: 'voip_call_id',
      label: 'VoIP Call ID',
      type: 'text',
    },
  ];

  const voipTabContent = (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>История звонков</Title>
        <Button icon={<ReloadOutlined />} onClick={() => { fetchCalls(); fetchStatistics(); }}>
          Обновить
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Всего звонков"
                value={statistics.total ?? statistics.total_calls ?? 0}
                prefix={<PhoneOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Входящие"
                value={statistics.inbound ?? statistics.incoming ?? statistics.incoming_calls ?? 0}
                prefix={<PhoneTwoTone twoToneColor="#52c41a" />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Исходящие"
                value={statistics.outbound ?? statistics.outgoing ?? statistics.outgoing_calls ?? 0}
                prefix={<PhoneTwoTone twoToneColor="#1890ff" />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Средняя длительность"
                value={formatDuration(Math.round(statistics.averageDuration || statistics.average_duration || 0))}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%' }}>
          <Input.Search
            placeholder="Поиск по номеру телефона..."
            allowClear
            style={{ width: 300 }}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
          <Select
            placeholder="Направление"
            allowClear
            style={{ width: 150 }}
            value={filters.direction}
            onChange={(value) => handleFilterChange('direction', value)}
          >
            <Option value="inbound">Входящие</Option>
            <Option value="outbound">Исходящие</Option>
          </Select>
          <Select
            placeholder="Статус"
            allowClear
            style={{ width: 150 }}
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
          >
            <Option value="answered">Отвечен</Option>
            <Option value="ringing">Звонит</Option>
            <Option value="busy">Занято</Option>
            <Option value="no_answer">Нет ответа</Option>
            <Option value="failed">Ошибка</Option>
          </Select>
          <RangePicker
            style={{ width: 280 }}
            value={filters.dateRange}
            onChange={(dates) => handleFilterChange('dateRange', dates)}
            format="DD.MM.YYYY"
            placeholder={['Дата от', 'Дата до']}
          />
          {(filters.direction || filters.status || filters.dateRange || searchText) && (
            <Button onClick={handleClearFilters}>
              Сбросить фильтры
            </Button>
          )}
        </Space>
      </Card>

      {/* Calls Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={calls}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                description="Звонков не найдено"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

      {/* Recording Player Modal */}
      <Modal
        title={
          <Space>
            <AudioOutlined />
            Запись звонка
          </Space>
        }
        open={recordingModalVisible}
        onCancel={handleCloseRecordingModal}
        footer={null}
        width={700}
      >
        {selectedRecording && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space direction="vertical" size="small">
                <Text strong>Номер телефона:</Text>
                <Text>{selectedRecording.phone_number || selectedRecording.number}</Text>
                <Text strong>Дата и время:</Text>
                <Text>
                  {dayjs(selectedRecording.started_at || selectedRecording.timestamp).format('DD.MM.YYYY HH:mm:ss')}
                </Text>
                <Text strong>Длительность:</Text>
                <Text>{formatDuration(selectedRecording.duration)}</Text>
                {selectedRecording.notes && (
                  <>
                    <Text strong>Заметки:</Text>
                    <Text>{selectedRecording.notes}</Text>
                  </>
                )}
              </Space>
            </div>
            <AudioPlayer
              src={selectedRecording.recording_url}
              filename={`call_${selectedRecording.id}_${selectedRecording.phone_number || selectedRecording.number}.webm`}
            />
          </div>
        )}
      </Modal>
    </div>
  );

  const crmTabContent = (
    <CrudPage
      title="CRM логи звонков"
      api={{
        list: getCallLogs,
        retrieve: getCallLog,
        create: createCallLog,
        update: updateCallLog,
        remove: deleteCallLog,
      }}
      columns={crmColumns}
      fields={crmFields}
    />
  );

  return (
    <>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'voip', label: 'VoIP', children: voipTabContent },
          { key: 'crm', label: 'CRM логи', children: crmTabContent },
        ]}
        destroyInactiveTabPane={false}
      />

      <Modal
        title="Добавить заметку"
        open={noteModalOpen}
        onCancel={handleCloseNoteModal}
        onOk={handleSaveNote}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={noteSaving}
      >
        <Form form={noteForm} layout="vertical">
          <Form.Item
            name="note"
            label="Заметка"
            rules={[{ required: true, message: 'Введите заметку' }]}
          >
            <Input.TextArea rows={4} placeholder="Описание звонка" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Детали звонка"
        open={detailModal.open}
        onCancel={handleCloseDetailModal}
        footer={null}
        width={640}
      >
        {detailModal.loading ? (
          <div>Загрузка...</div>
        ) : (
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {detailModal.data ? JSON.stringify(detailModal.data, null, 2) : 'Нет данных'}
          </pre>
        )}
      </Modal>
    </>
  );
}

export default CallsList;
