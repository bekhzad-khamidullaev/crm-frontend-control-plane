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
  Typography,
  message,
  Tooltip,
  Statistic,
  Row,
  Col,
  Empty,
  Modal,
} from 'antd';
import {
  PhoneOutlined,
  SearchOutlined,
  FilterOutlined,
  PhoneFilled,
  ClockCircleOutlined,
  UserOutlined,
  ReloadOutlined,
  PhoneTwoTone,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  AudioOutlined,
} from '@ant-design/icons';
import { getCallLogs, getCallStatistics } from '../../lib/api/calls.js';
import CallButton from '../../components/CallButton.jsx';
import AudioPlayer from '../../components/AudioPlayer.jsx';
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

  const fetchCalls = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pagination.pageSize,
        search: searchText,
        ordering: '-started_at',
      };

      if (filters.direction) params.direction = filters.direction;
      if (filters.status) params.status = filters.status;
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.started_at__gte = filters.dateRange[0].format('YYYY-MM-DD');
        params.started_at__lte = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await getCallLogs(params);
      setCalls(response.results || []);
      setPagination({
        ...pagination,
        current: page,
        total: response.count || 0,
      });
    } catch (error) {
      console.error('Error fetching calls:', error);
      message.error('Ошибка загрузки истории звонков');
      
      // Mock data for demo
      const mockCalls = [
        {
          id: 1,
          phone_number: '+7 999 123-45-67',
          direction: 'outbound',
          status: 'completed',
          started_at: '2024-01-20T10:30:00Z',
          ended_at: '2024-01-20T10:35:00Z',
          duration: 300,
          notes: 'Обсудили детали сделки',
        },
        {
          id: 2,
          phone_number: '+7 999 234-56-78',
          direction: 'inbound',
          status: 'completed',
          started_at: '2024-01-20T09:15:00Z',
          ended_at: '2024-01-20T09:20:00Z',
          duration: 300,
          notes: 'Клиент интересовался услугами',
        },
        {
          id: 3,
          phone_number: '+7 999 345-67-89',
          direction: 'outbound',
          status: 'missed',
          started_at: '2024-01-19T16:45:00Z',
          ended_at: null,
          duration: 0,
          notes: null,
        },
      ];
      
      // Add mock recording URLs to some calls
      mockCalls[0].recording_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      
      setCalls(mockCalls);
      setPagination({
        ...pagination,
        current: 1,
        total: mockCalls.length,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = {};
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.started_at__gte = filters.dateRange[0].format('YYYY-MM-DD');
        params.started_at__lte = filters.dateRange[1].format('YYYY-MM-DD');
      }
      
      const stats = await getCallStatistics(params);
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Mock statistics
      setStatistics({
        total: 150,
        inbound: 80,
        outbound: 70,
        completed: 120,
        missed: 20,
        totalDuration: 18000,
        averageDuration: 120,
      });
    }
  };

  useEffect(() => {
    fetchCalls(1);
    fetchStatistics();
  }, [searchText, filters]);

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
    fetchCalls(newPagination.current);
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

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const statusConfig = {
    completed: { color: 'success', text: 'Завершен', icon: <CheckCircleOutlined /> },
    missed: { color: 'error', text: 'Пропущен', icon: <CloseCircleOutlined /> },
    busy: { color: 'warning', text: 'Занято', icon: <CloseCircleOutlined /> },
    failed: { color: 'error', text: 'Ошибка', icon: <CloseCircleOutlined /> },
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
      render: (phone) => (
        <Space>
          <PhoneOutlined />
          <a href={`tel:${phone}`}>{phone}</a>
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
      render: (date) => dayjs(date).format('DD.MM.YYYY HH:mm'),
      sorter: (a, b) => new Date(a.started_at) - new Date(b.started_at),
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
      render: (notes) => notes || <Text type="secondary">-</Text>,
    },
    {
      title: 'Запись',
      dataIndex: 'recording_url',
      key: 'recording',
      width: 100,
      align: 'center',
      render: (recording_url) => {
        if (recording_url) {
          return (
            <Tooltip title="Прослушать запись">
              <Button
                type="link"
                icon={<AudioOutlined />}
                size="small"
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
          <CallButton
            phone={record.phone_number}
            name={record.phone_number}
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

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>История звонков</Title>
        <Button icon={<ReloadOutlined />} onClick={() => { fetchCalls(1); fetchStatistics(); }}>
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
                value={statistics.total}
                prefix={<PhoneOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Входящие"
                value={statistics.inbound}
                prefix={<PhoneTwoTone twoToneColor="#52c41a" />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Исходящие"
                value={statistics.outbound}
                prefix={<PhoneTwoTone twoToneColor="#1890ff" />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Средняя длительность"
                value={formatDuration(Math.round(statistics.averageDuration))}
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
            <Option value="completed">Завершен</Option>
            <Option value="missed">Пропущен</Option>
            <Option value="busy">Занято</Option>
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
                <Text>{selectedRecording.phone_number}</Text>
                <Text strong>Дата и время:</Text>
                <Text>{dayjs(selectedRecording.started_at).format('DD.MM.YYYY HH:mm:ss')}</Text>
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
              filename={`call_${selectedRecording.id}_${selectedRecording.phone_number}.webm`}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CallsList;
