import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import {
  AudioOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FormOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  PhoneTwoTone,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';

import AudioPlayer from '../../components/AudioPlayer.jsx';
import CallButton from '../../components/CallButton.jsx';
import { addCallNote, getCallStatistics, getVoipCallLog, getVoipCallLogs } from '../../lib/api/calls.js';

const { RangePicker } = DatePicker;
const { Search } = Input;
const { Text, Title } = Typography;

function CallsList() {
  const { message } = App.useApp();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [recordingModalVisible, setRecordingModalVisible] = useState(false);
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
      const params = { limit: 500 };
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
      setPagination((prev) => ({ ...prev, current: 1, total: filtered.length }));
    } catch (error) {
      console.error('Error fetching calls:', error);
      message.error('Ошибка загрузки истории звонков');
      setCalls([]);
      setPagination((prev) => ({ ...prev, current: 1, total: 0 }));
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
    } catch {
      setStatistics(null);
    }
  };

  useEffect(() => {
    fetchCalls();
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, filters]);

  const handlePlayRecording = (call) => {
    setSelectedRecording(call);
    setRecordingModalVisible(true);
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
      if (!error?.errorFields) {
        message.error('Ошибка добавления заметки');
      }
    } finally {
      setNoteSaving(false);
    }
  };

  const handleViewDetails = async (record) => {
    setDetailModal({ open: true, loading: true, data: null });
    try {
      const data = await getVoipCallLog(record.id);
      setDetailModal({ open: true, loading: false, data });
    } catch {
      message.error('Ошибка загрузки деталей звонка');
      setDetailModal({ open: true, loading: false, data: null });
    }
  };

  const statusConfig = {
    answered: { color: 'success', text: 'Отвечен' },
    completed: { color: 'success', text: 'Завершен' },
    missed: { color: 'error', text: 'Пропущен' },
    no_answer: { color: 'error', text: 'Нет ответа' },
    busy: { color: 'warning', text: 'Занято' },
    failed: { color: 'error', text: 'Ошибка' },
    ringing: { color: 'processing', text: 'Звонит' },
  };

  const columns = [
    {
      title: 'Направление',
      dataIndex: 'direction',
      key: 'direction',
      width: 140,
      render: (direction) => (
        <Space>
          <PhoneTwoTone twoToneColor={direction === 'inbound' ? '#52c41a' : '#1890ff'} />
          <Text>{direction === 'inbound' ? 'Входящий' : 'Исходящий'}</Text>
        </Space>
      ),
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
        return <Tag color={config.color}>{config.text}</Tag>;
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
      render: (duration) => {
        const sec = duration || 0;
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return (
          <Space>
            <ClockCircleOutlined />
            {`${mins}:${secs.toString().padStart(2, '0')}`}
          </Space>
        );
      },
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
      width: 120,
      align: 'center',
      render: (recordingUrl, record) =>
        recordingUrl ? (
          <Button type="link" icon={<AudioOutlined />} size="small" onClick={() => handlePlayRecording(record)}>
            Запись
          </Button>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 240,
      render: (_, record) => (
        <Space>
          {record.recording_url ? (
            <Button type="link" icon={<PlayCircleOutlined />} size="small" onClick={() => handlePlayRecording(record)}>
              Прослушать
            </Button>
          ) : null}
          <Button type="link" icon={<FormOutlined />} size="small" onClick={() => handleOpenNoteModal(record)}>
            Заметка
          </Button>
          <Button type="link" icon={<InfoCircleOutlined />} size="small" onClick={() => handleViewDetails(record)}>
            Детали
          </Button>
          <CallButton
            phone={record.phone_number || record.number}
            name={record.phone_number || record.number}
            entityType={record.related_lead ? 'lead' : 'contact'}
            entityId={record.related_lead || record.related_contact}
            size="small"
            type="link"
            icon
          />
        </Space>
      ),
    },
  ];

  const stats = useMemo(() => {
    if (!statistics || typeof statistics !== 'object') return null;
    return {
      total: statistics.total || statistics.count || calls.length,
      answered: statistics.answered || 0,
      missed: statistics.missed || 0,
      duration: statistics.total_duration || 0,
    };
  }, [statistics, calls.length]);

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>История звонков</Title>
            <Text type="secondary">VoIP-журнал и аналитика</Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchCalls} loading={loading}>Обновить</Button>
        </Space>

        {stats ? (
          <Space wrap>
            <Card size="small"><Statistic title="Всего" value={stats.total} /></Card>
            <Card size="small"><Statistic title="Отвечено" value={stats.answered} /></Card>
            <Card size="small"><Statistic title="Пропущено" value={stats.missed} /></Card>
            <Card size="small"><Statistic title="Длит., сек" value={stats.duration} /></Card>
          </Space>
        ) : null}

        <Space wrap>
          <Search
            placeholder="Поиск по номеру"
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={setSearchText}
            style={{ minWidth: 260 }}
          />
          <Select
            allowClear
            placeholder="Направление"
            style={{ minWidth: 150 }}
            value={filters.direction}
            options={[
              { value: 'inbound', label: 'Входящий' },
              { value: 'outbound', label: 'Исходящий' },
            ]}
            onChange={(v) => setFilters((prev) => ({ ...prev, direction: v ?? null }))}
          />
          <Select
            allowClear
            placeholder="Статус"
            style={{ minWidth: 150 }}
            value={filters.status}
            options={Object.entries(statusConfig).map(([value, meta]) => ({ value, label: meta.text }))}
            onChange={(v) => setFilters((prev) => ({ ...prev, status: v ?? null }))}
          />
          <RangePicker
            format="DD.MM.YYYY"
            value={filters.dateRange}
            onChange={(vals) => setFilters((prev) => ({ ...prev, dateRange: vals || null }))}
          />
          <Button onClick={() => setFilters({ direction: null, status: null, dateRange: null })}>Сбросить</Button>
        </Space>

        <Table
          rowKey={(record, index) => record.id || record.call_id || `${record.phone_number || 'call'}-${index}`}
          columns={columns}
          dataSource={calls}
          loading={loading}
          pagination={{ ...pagination, showSizeChanger: true, onChange: (page, pageSize) => setPagination((prev) => ({ ...prev, current: page, pageSize })) }}
        />
      </Space>

      <Modal
        title="Прослушивание записи"
        open={recordingModalVisible}
        onCancel={() => {
          setRecordingModalVisible(false);
          setSelectedRecording(null);
        }}
        footer={null}
      >
        {selectedRecording?.recording_url ? (
          <AudioPlayer src={selectedRecording.recording_url} />
        ) : (
          <Text type="secondary">Запись не найдена</Text>
        )}
      </Modal>

      <Modal
        title="Заметка к звонку"
        open={noteModalOpen}
        onCancel={() => {
          setNoteModalOpen(false);
          setNoteTarget(null);
          noteForm.resetFields();
        }}
        onOk={handleSaveNote}
        confirmLoading={noteSaving}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={noteForm} layout="vertical">
          <Form.Item
            label="Заметка"
            name="note"
            rules={[{ required: true, message: 'Добавьте текст заметки' }]}
          >
            <Input.TextArea rows={4} placeholder="Введите заметку" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Детали звонка"
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, loading: false, data: null })}
        footer={null}
      >
        {detailModal.loading ? (
          'Загрузка...'
        ) : !detailModal.data ? (
          <Text type="secondary">Данные недоступны</Text>
        ) : (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {Object.entries(detailModal.data).map(([key, value]) => (
              <div key={key}>
                <Text strong>{key}: </Text>
                <Text>{String(value ?? '-')}</Text>
              </div>
            ))}
          </Space>
        )}
      </Modal>
    </Card>
  );
}

export default CallsList;
