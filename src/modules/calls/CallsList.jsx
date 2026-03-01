/**
 * CallsList Component
 * Displays list of call logs with filtering and statistics
 */

import dayjs from 'dayjs';
import { Clock, Phone, PhoneCall, RefreshCcw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  AudioOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FormOutlined,
  InfoCircleOutlined,
  PhoneFilled,
  PhoneOutlined,
  PhoneTwoTone,
  PlayCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Form, Space, Tag, Tooltip } from 'antd';
import { DatePicker } from '../../components/ui-DatePicker.jsx';
import EnhancedTable from '../../components/ui-EnhancedTable.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs.jsx';
import { toast } from '../../components/ui/use-toast.js';
// replaced Ant Design icons with lucide-react above
import AudioPlayer from '../../components/AudioPlayer.jsx';
import CallButton from '../../components/CallButton.jsx';
import CrudPage from '../../components/CrudPage.jsx';
import { getContact, getContacts } from '../../lib/api';
import {
  addCallNote,
  createCallLog,
  deleteCallLog,
  getCallLog,
  getCallLogs,
  getCallStatistics,
  getVoipCallLog,
  getVoipCallLogs,
  updateCallLog,
} from '../../lib/api/calls.js';
const Title = ({ children }) => <h2 className="text-xl font-semibold">{children}</h2>;
const Text = ({ children, secondary }) => (
  <span className={secondary ? 'text-muted-foreground' : undefined}>{children}</span>
);
const RangePicker = DatePicker.RangePicker;

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
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: filtered.length,
      }));
    } catch (error) {
      console.error('Error fetching calls:', error);
      toast({ title: 'Ошибка', description: 'Ошибка загрузки истории звонков', variant: 'destructive' });
      setCalls([]);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: 0,
      }));
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
    setPagination((prev) => ({ 
      ...prev, 
      current: newPagination.current,
      pageSize: newPagination.pageSize 
    }));
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
      toast({ title: 'Заметка добавлена', description: 'Сохранено' });
      setNoteModalOpen(false);
      setNoteTarget(null);
      noteForm.resetFields();
      fetchCalls();
    } catch (error) {
      if (error?.errorFields) return;
      toast({ title: 'Ошибка', description: 'Ошибка добавления заметки', variant: 'destructive' });
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
      toast({ title: 'Ошибка', description: 'Ошибка загрузки деталей звонка', variant: 'destructive' });
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
              <span>
                <Button
                  type="link"
                  icon={<AudioOutlined />}
                  size="small"
                  onClick={() => handlePlayRecording(record)}
                >
                  Запись
                </Button>
              </span>
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
      render: (value) => value || '-',
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
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="rounded-md bg-muted p-2"><Phone className="h-4 w-4" /></div>
              <div>
                <div className="text-xs text-muted-foreground">Всего звонков</div>
                <div className="text-lg font-semibold">{statistics.total ?? statistics.total_calls ?? 0}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="rounded-md bg-emerald-100 p-2 text-emerald-700"><PhoneCall className="h-4 w-4" /></div>
              <div>
                <div className="text-xs text-muted-foreground">Входящие</div>
                <div className="text-lg font-semibold">{statistics.inbound ?? statistics.incoming ?? statistics.incoming_calls ?? 0}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="rounded-md bg-sky-100 p-2 text-sky-700"><PhoneCall className="h-4 w-4" /></div>
              <div>
                <div className="text-xs text-muted-foreground">Исходящие</div>
                <div className="text-lg font-semibold">{statistics.outbound ?? statistics.outgoing ?? statistics.outgoing_calls ?? 0}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="rounded-md bg-muted p-2"><Clock className="h-4 w-4" /></div>
              <div>
                <div className="text-xs text-muted-foreground">Средняя длительность</div>
                <div className="text-lg font-semibold">{formatDuration(Math.round(statistics.averageDuration || statistics.average_duration || 0))}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="flex w-full flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по номеру телефона..."
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)}
              className="pl-9"
            />
          </div>
          <select
            className="h-9 w-[150px] rounded-md border border-border bg-background px-2 text-sm"
            value={filters.direction || ''}
            onChange={(e) => handleFilterChange('direction', e.target.value || null)}
          >
            <option value="">Направление</option>
            <option value="inbound">Входящие</option>
            <option value="outbound">Исходящие</option>
          </select>
          <select
            className="h-9 w-[150px] rounded-md border border-border bg-background px-2 text-sm"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || null)}
          >
            <option value="">Статус</option>
            <option value="answered">Отвечен</option>
            <option value="ringing">Звонит</option>
            <option value="busy">Занято</option>
            <option value="no_answer">Нет ответа</option>
            <option value="failed">Ошибка</option>
          </select>
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => handleFilterChange('dateRange', dates)}
            format="DD.MM.YYYY"
          />
          {(filters.direction || filters.status || filters.dateRange || searchText) && (
            <Button variant="outline" onClick={handleClearFilters}>
              Сбросить фильтры
            </Button>
          )}
          <Button variant="outline" onClick={() => { fetchCalls(); fetchStatistics(); }}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
        </div>
      </Card>

      {/* Calls Table */}
      <Card className="p-0">
        <EnhancedTable
          columns={columns}
          dataSource={calls}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          emptyText="Звонков не найдено"
        />
      </Card>

      {/* Recording Player Modal */}
      {recordingModalVisible && selectedRecording && (
        <div className="mt-4 space-y-3 rounded-md border border-border p-4">
          <div className="text-sm font-semibold">Запись звонка</div>
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <div className="text-muted-foreground">Номер телефона</div>
              <div>{selectedRecording.phone_number || selectedRecording.number}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Дата и время</div>
              <div>{dayjs(selectedRecording.started_at || selectedRecording.timestamp).format('DD.MM.YYYY HH:mm:ss')}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Длительность</div>
              <div>{formatDuration(selectedRecording.duration)}</div>
            </div>
            {selectedRecording.notes && (
              <div className="sm:col-span-2">
                <div className="text-muted-foreground">Заметки</div>
                <div>{selectedRecording.notes}</div>
              </div>
            )}
          </div>
          <AudioPlayer
            src={selectedRecording.recording_url}
            filename={`call_${selectedRecording.id}_${selectedRecording.phone_number || selectedRecording.number}.webm`}
          />
          <div className="text-right">
            <Button variant="outline" onClick={handleCloseRecordingModal}>Закрыть</Button>
          </div>
        </div>
      )}
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="voip">VoIP</TabsTrigger>
          <TabsTrigger value="crm">CRM логи</TabsTrigger>
        </TabsList>
        <TabsContent value="voip">{voipTabContent}</TabsContent>
        <TabsContent value="crm">{crmTabContent}</TabsContent>
      </Tabs>

      {noteModalOpen && (
        <div className="mt-4 rounded-md border border-border p-4">
          <div className="text-sm font-semibold">Добавить заметку</div>
          <textarea
            className="mt-2 w-full rounded-md border border-border p-2 text-sm"
            rows={4}
            placeholder="Описание звонка"
            defaultValue={noteForm.getFieldValue('note')}
            onChange={(e) => noteForm.setFieldsValue({ note: e.target.value })}
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseNoteModal}>Отмена</Button>
            <Button onClick={handleSaveNote} loading={noteSaving}>Сохранить</Button>
          </div>
        </div>
      )}

      {detailModal.open && (
        <div className="mt-4 rounded-md border border-border p-4">
          <div className="text-sm font-semibold">Детали звонка</div>
          {detailModal.loading ? (
            <div>Загрузка...</div>
          ) : (
            <pre className="whitespace-pre-wrap">
              {detailModal.data ? JSON.stringify(detailModal.data, null, 2) : 'Нет данных'}
            </pre>
          )}
          <div className="text-right">
            <Button variant="outline" onClick={handleCloseDetailModal}>Закрыть</Button>
          </div>
        </div>
      )}
    </>
  );
}

export default CallsList;
