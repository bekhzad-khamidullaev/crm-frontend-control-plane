import { useState, useEffect } from 'react';
import { Timeline, Card, Select, DatePicker, Space, Empty, Spin, Tag, Avatar, Button } from 'antd';
import { UserOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { getEntityActivity } from '../lib/api/activity';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { RangePicker } = DatePicker;

/**
 * ActivityLog component - displays timeline of changes
 */
export default function ActivityLog({ 
  entityType, 
  entityId,
  showFilters = true,
  maxHeight = 500,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState(null);
  const [userFilter, setUserFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchData();
  }, [entityType, entityId, actionFilter, userFilter, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter) params.action = actionFilter;
      if (userFilter) params.user = userFilter;
      if (dateRange) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const res = await getEntityActivity(entityType, entityId, params);
      setData(res.results || []);
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      created: 'green',
      updated: 'blue',
      deleted: 'red',
      status_changed: 'orange',
      assigned: 'purple',
      commented: 'cyan',
    };
    return colors[action] || 'default';
  };

  const getActionIcon = (action) => {
    return action === 'created' ? 'clock-circle' : 'dot';
  };

  const formatChanges = (changes) => {
    if (!changes || typeof changes !== 'object') return null;

    return (
      <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
        {Object.entries(changes).map(([field, change]) => (
          <div key={field} style={{ marginBottom: 4 }}>
            <strong>{field}:</strong>{' '}
            {change.old !== undefined && (
              <>
                <span style={{ textDecoration: 'line-through', color: '#999' }}>
                  {String(change.old)}
                </span>
                {' → '}
              </>
            )}
            <span style={{ color: '#52c41a' }}>
              {String(change.new)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const timelineItems = data.map(item => ({
    dot: item.action === 'created' ? <ClockCircleOutlined /> : undefined,
    color: getActionColor(item.action),
    children: (
      <div>
        <Space style={{ marginBottom: 4 }}>
          <Avatar size="small" icon={<UserOutlined />} />
          <strong>{item.user?.username || item.user?.email || 'Unknown'}</strong>
          <Tag color={getActionColor(item.action)}>
            {item.action.replace('_', ' ')}
          </Tag>
          <span style={{ color: '#999', fontSize: '12px' }}>
            {dayjs(item.timestamp).fromNow()}
          </span>
        </Space>
        <div style={{ marginTop: 4 }}>
          {item.description}
        </div>
        {formatChanges(item.changes)}
        <div style={{ fontSize: '11px', color: '#ccc', marginTop: 4 }}>
          {dayjs(item.timestamp).format('DD MMM YYYY HH:mm:ss')}
        </div>
      </div>
    ),
  }));

  return (
    <Card
      title="Activity Log"
      extra={
        <Button 
          icon={<ReloadOutlined />} 
          size="small" 
          onClick={fetchData}
          loading={loading}
        >
          Refresh
        </Button>
      }
    >
      {showFilters && (
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            placeholder="Filter by action"
            style={{ width: 150 }}
            allowClear
            onChange={setActionFilter}
            value={actionFilter}
          >
            <Select.Option value="created">Created</Select.Option>
            <Select.Option value="updated">Updated</Select.Option>
            <Select.Option value="deleted">Deleted</Select.Option>
            <Select.Option value="status_changed">Status Changed</Select.Option>
            <Select.Option value="assigned">Assigned</Select.Option>
            <Select.Option value="commented">Commented</Select.Option>
          </Select>

          <RangePicker
            style={{ width: 250 }}
            onChange={setDateRange}
            value={dateRange}
            format="DD/MM/YYYY"
          />
        </Space>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin />
        </div>
      ) : data.length === 0 ? (
        <Empty description="No activity yet" />
      ) : (
        <div style={{ maxHeight, overflowY: 'auto' }}>
          <Timeline items={timelineItems} />
        </div>
      )}
    </Card>
  );
}
