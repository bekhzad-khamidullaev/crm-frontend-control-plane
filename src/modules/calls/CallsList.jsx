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
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  theme as antdTheme,
} from 'antd';

import AudioPlayer from '../../components/AudioPlayer.jsx';
import CallButton from '../../components/CallButton.jsx';
import ChannelBrandIcon from '../../components/channel/ChannelBrandIcon.jsx';
import { t } from '../../lib/i18n';
import { addCallNote, getCallStatistics, getVoipCallLog, getVoipCallLogs } from '../../lib/api/calls.js';
import { KpiStatCard } from '../../shared/ui';

const { RangePicker } = DatePicker;
const { Search } = Input;
const { Text, Title } = Typography;

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const str = String(value).trim();
    if (str) return str;
  }
  return '';
}

function resolveRecordingUrl(call = {}) {
  return firstNonEmpty(
    call.recording_url,
    call.recordingUrl,
    call.recording_file,
    call.recordingFile,
    call.audio_url,
    call.audioUrl,
    call.media_url,
    call.mediaUrl,
    call.technical_payload?.recording_url,
    call.technical_payload?.recording_file
  );
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = dayjs(value);
  if (!date.isValid()) return String(value);
  return date.format('DD.MM.YYYY HH:mm:ss');
}

function formatDuration(value) {
  const sec = Number(value);
  if (!Number.isFinite(sec) || sec < 0) return '-';
  const hours = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = Math.floor(sec % 60);
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

function CallsList() {
  const { message } = App.useApp();
  const { token } = antdTheme.useToken();
  const tr = (key, fallback, vars = {}) => {
    const localized = t(key, vars);
    return localized === key ? fallback : localized;
  };
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
      message.error(tr('callsList.messages.loadError', 'Failed to load call history'));
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
    const recordingUrl = resolveRecordingUrl(call);
    if (!recordingUrl) return;
    setSelectedRecording({ ...call, recording_url: recordingUrl });
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
      message.success(tr('callsList.messages.noteAdded', 'Note added'));
      setNoteModalOpen(false);
      setNoteTarget(null);
      noteForm.resetFields();
      fetchCalls();
    } catch (error) {
      if (!error?.errorFields) {
        message.error(tr('callsList.messages.noteAddError', 'Failed to add note'));
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
      message.error(tr('callsList.messages.detailsError', 'Failed to load call details'));
      setDetailModal({ open: true, loading: false, data: null });
    }
  };

  const statusConfig = {
    answered: { color: 'success', text: tr('callsList.status.answered', 'Answered') },
    completed: { color: 'success', text: tr('callsList.status.completed', 'Completed') },
    missed: { color: 'error', text: tr('callsList.status.missed', 'Missed') },
    no_answer: { color: 'error', text: tr('callsList.status.noAnswer', 'No answer') },
    busy: { color: 'warning', text: tr('callsList.status.busy', 'Busy') },
    failed: { color: 'error', text: tr('callsList.status.failed', 'Failed') },
    ringing: { color: 'processing', text: tr('callsList.status.ringing', 'Ringing') },
  };

  const renderHumanCallDetails = (call) => {
    const directionRaw = String(call?.direction || '').toLowerCase();
    const directionLabel =
      directionRaw === 'inbound'
        ? tr('callsList.direction.inbound', 'Inbound')
        : directionRaw === 'outbound'
          ? tr('callsList.direction.outbound', 'Outbound')
          : '-';
    const statusRaw = String(call?.status || '').toLowerCase();
    const statusLabel = statusConfig[statusRaw]?.text || firstNonEmpty(call?.status, '-');
    const phoneNumber = firstNonEmpty(
      call?.phone_number,
      call?.number,
      call?.caller_id,
      call?.called_number
    );
    const customerName = firstNonEmpty(
      call?.contact_name,
      call?.customer_name,
      call?.client_name,
      call?.contact,
      call?.related_contact_name,
      call?.related_lead_name
    );
    const agentName = firstNonEmpty(
      call?.agent_name,
      call?.user_agent,
      call?.operator_name,
      call?.user_name
    );
    const startedAt = firstNonEmpty(call?.started_at, call?.start_time, call?.timestamp);
    const answeredAt = firstNonEmpty(call?.answered_at, call?.answer_time);
    const endedAt = firstNonEmpty(call?.ended_at, call?.end_time);
    const queueWait = call?.queue_wait_time ?? call?.wait_time ?? null;
    const recordingUrl = resolveRecordingUrl(call);

    const summaryItems = [
      {
        key: 'customer',
        label: tr('callsList.modals.customer', 'Customer'),
        children: customerName || '-',
      },
      {
        key: 'phone',
        label: tr('callsList.modals.phoneNumber', 'Phone number'),
        children: phoneNumber || '-',
      },
      {
        key: 'direction',
        label: tr('callsList.modals.direction', 'Direction'),
        children: directionLabel,
      },
      {
        key: 'status',
        label: tr('callsList.modals.status', 'Status'),
        children: statusLabel,
      },
      {
        key: 'agent',
        label: tr('callsList.modals.agent', 'Agent'),
        children: agentName || '-',
      },
      {
        key: 'queue',
        label: tr('callsList.modals.queue', 'Queue/Group'),
        children: firstNonEmpty(call?.routed_to_group, call?.queue_name, call?.queue, '-') || '-',
      },
      {
        key: 'start',
        label: tr('callsList.modals.startedAt', 'Call started'),
        children: formatDateTime(startedAt),
      },
      {
        key: 'answer',
        label: tr('callsList.modals.answeredAt', 'Answered at'),
        children: formatDateTime(answeredAt),
      },
      {
        key: 'end',
        label: tr('callsList.modals.endedAt', 'Call ended'),
        children: formatDateTime(endedAt),
      },
      {
        key: 'duration',
        label: tr('callsList.modals.duration', 'Talk duration'),
        children: formatDuration(firstNonEmpty(call?.call_duration, call?.duration, call?.total_duration)),
      },
      {
        key: 'wait',
        label: tr('callsList.modals.waitTime', 'Queue wait'),
        children:
          queueWait === null || queueWait === undefined || queueWait === ''
            ? '-'
            : formatDuration(queueWait),
      },
      {
        key: 'session',
        label: tr('callsList.modals.callRef', 'Call reference'),
        children: firstNonEmpty(call?.session_id, call?.call_id, call?.id, '-') || '-',
      },
    ];

    return (
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Descriptions
          size="small"
          column={1}
          bordered
          items={summaryItems}
        />

        {recordingUrl ? (
          <Card
            size="small"
            title={tr('callsList.modals.recordingTitle', 'Recording playback')}
            styles={{ body: { paddingTop: 10, paddingBottom: 10 } }}
          >
            <AudioPlayer src={recordingUrl} />
          </Card>
        ) : (
          <Text type="secondary">
            {tr('callsList.modals.recordingNotFound', 'Recording not found')}
          </Text>
        )}

        {firstNonEmpty(call?.notes, call?.note) ? (
          <Card
            size="small"
            title={tr('callsList.modals.noteTitle', 'Call note')}
            styles={{ body: { paddingTop: 10, paddingBottom: 10 } }}
          >
            <Text>{firstNonEmpty(call?.notes, call?.note)}</Text>
          </Card>
        ) : null}
      </Space>
    );
  };

  const columns = [
    {
      title: tr('callsList.table.direction', 'Direction'),
      dataIndex: 'direction',
      key: 'direction',
      width: 140,
      render: (direction) => (
        <Space>
          <PhoneTwoTone
            twoToneColor={direction === 'inbound' ? token.colorSuccess : token.colorPrimary}
          />
          <Text>{direction === 'inbound' ? tr('callsList.direction.inbound', 'Inbound') : tr('callsList.direction.outbound', 'Outbound')}</Text>
        </Space>
      ),
    },
    {
      title: tr('callsList.table.phoneNumber', 'Phone number'),
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
      title: tr('callsList.table.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => {
        const config = statusConfig[status] || statusConfig.completed;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: tr('callsList.table.dateTime', 'Date and time'),
      dataIndex: 'started_at',
      key: 'started_at',
      width: 180,
      render: (date, record) => dayjs(date || record.timestamp).format('DD.MM.YYYY HH:mm'),
      sorter: (a, b) => new Date(a.started_at || a.timestamp) - new Date(b.started_at || b.timestamp),
    },
    {
      title: tr('callsList.table.duration', 'Duration'),
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
      title: tr('callsList.table.notes', 'Notes'),
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes, record) => notes || record.note || <Text type="secondary">-</Text>,
    },
    {
      title: tr('callsList.table.recording', 'Recording'),
      dataIndex: 'recording_url',
      key: 'recording',
      width: 120,
      align: 'center',
      render: (_, record) =>
        resolveRecordingUrl(record) ? (
          <Button type="link" icon={<AudioOutlined />} size="small" onClick={() => handlePlayRecording(record)}>
            {tr('callsList.actions.recording', 'Recording')}
          </Button>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: tr('callsList.table.actions', 'Actions'),
      key: 'actions',
      width: 240,
      render: (_, record) => (
        <Space>
          {resolveRecordingUrl(record) ? (
            <Button type="link" icon={<PlayCircleOutlined />} size="small" onClick={() => handlePlayRecording(record)}>
              {tr('callsList.actions.listen', 'Listen')}
            </Button>
          ) : null}
          <Button type="link" icon={<FormOutlined />} size="small" onClick={() => handleOpenNoteModal(record)}>
            {tr('callsList.actions.note', 'Note')}
          </Button>
          <Button type="link" icon={<InfoCircleOutlined />} size="small" onClick={() => handleViewDetails(record)}>
            {tr('callsList.actions.details', 'Details')}
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
    <Card size="small" bodyStyle={{ padding: 12 }}>
      <Space direction="vertical" size={8} style={{ width: '100%', maxWidth: 1320 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Space size={8} align="center" style={{ marginBottom: 2 }}>
              <ChannelBrandIcon channel="telephony" size={16} />
              <Title level={3} style={{ margin: 0, fontSize: 18, lineHeight: 1.2 }}>{tr('callsList.title', 'Call history')}</Title>
            </Space>
            <Text type="secondary" style={{ fontSize: 13 }}>{tr('callsList.subtitle', 'VoIP log and analytics')}</Text>
          </div>
          <Button size="small" icon={<ReloadOutlined />} onClick={fetchCalls} loading={loading}>{tr('actions.refresh', 'Refresh')}</Button>
        </Space>

        {stats ? (
          <Space wrap size={8}>
            <KpiStatCard title={tr('callsList.stats.total', 'Total')} value={stats.total} />
            <KpiStatCard title={tr('callsList.stats.answered', 'Answered')} value={stats.answered} />
            <KpiStatCard title={tr('callsList.stats.missed', 'Missed')} value={stats.missed} />
            <KpiStatCard title={tr('callsList.stats.durationSec', 'Duration, sec')} value={stats.duration} />
          </Space>
        ) : null}

        <Space wrap size={8}>
          <Search
            placeholder={tr('callsList.filters.searchByNumber', 'Search by number')}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={setSearchText}
            size="small"
            style={{ width: 220, minWidth: 200 }}
          />
          <Select
            allowClear
            placeholder={tr('callsList.filters.direction', 'Direction')}
            size="small"
            style={{ width: 150 }}
            value={filters.direction}
            options={[
              { value: 'inbound', label: tr('callsList.direction.inbound', 'Inbound') },
              { value: 'outbound', label: tr('callsList.direction.outbound', 'Outbound') },
            ]}
            onChange={(v) => setFilters((prev) => ({ ...prev, direction: v ?? null }))}
          />
          <Select
            allowClear
            placeholder={tr('callsList.filters.status', 'Status')}
            size="small"
            style={{ width: 150 }}
            value={filters.status}
            options={Object.entries(statusConfig).map(([value, meta]) => ({ value, label: meta.text }))}
            onChange={(v) => setFilters((prev) => ({ ...prev, status: v ?? null }))}
          />
          <RangePicker
            size="small"
            format="DD.MM.YYYY"
            style={{ width: 290 }}
            value={filters.dateRange}
            onChange={(vals) => setFilters((prev) => ({ ...prev, dateRange: vals || null }))}
          />
          <Button size="small" onClick={() => setFilters({ direction: null, status: null, dateRange: null })}>
            {tr('actions.reset', 'Reset')}
          </Button>
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
        title={tr('callsList.modals.recordingTitle', 'Recording playback')}
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
          <Text type="secondary">{tr('callsList.modals.recordingNotFound', 'Recording not found')}</Text>
        )}
      </Modal>

      <Modal
        title={tr('callsList.modals.noteTitle', 'Call note')}
        open={noteModalOpen}
        onCancel={() => {
          setNoteModalOpen(false);
          setNoteTarget(null);
          noteForm.resetFields();
        }}
        onOk={handleSaveNote}
        confirmLoading={noteSaving}
        okText={tr('actions.save', 'Save')}
        cancelText={tr('actions.cancel', 'Cancel')}
      >
        <Form form={noteForm} layout="vertical">
          <Form.Item
            label={tr('callsList.fields.note', 'Note')}
            name="note"
            rules={[{ required: true, message: tr('callsList.validation.noteRequired', 'Add note text') }]}
          >
            <Input.TextArea rows={4} placeholder={tr('callsList.placeholders.note', 'Enter note')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={tr('callsList.modals.detailsTitle', 'Call details')}
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, loading: false, data: null })}
        footer={null}
      >
        {detailModal.loading ? (
          tr('common.loading', 'Loading...')
        ) : !detailModal.data ? (
          <Text type="secondary">{tr('callsList.modals.detailsUnavailable', 'Data unavailable')}</Text>
        ) : (
          renderHumanCallDetails(detailModal.data)
        )}
      </Modal>
    </Card>
  );
}

export default CallsList;
