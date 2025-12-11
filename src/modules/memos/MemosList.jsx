import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, message, Modal, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, FileTextOutlined, InboxOutlined } from '@ant-design/icons';
import { getMemos, deleteMemo, updateMemo } from '../../lib/api/memos';
import { navigate } from '../../router';
import dayjs from 'dayjs';

const { Search } = Input;

export default function MemosList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [draftFilter, setDraftFilter] = useState(null);
  const [entityFilter, setEntityFilter] = useState(null);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchText, draftFilter, entityFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
        draft: draftFilter,
      };
      const res = await getMemos(params);
      const results = res.results || [];
      setData(results);
      setPagination((prev) => ({ ...prev, total: res.count || results.length }));
    } catch (error) {
      message.error('Failed to fetch memos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Memo',
      content: 'Are you sure you want to delete this memo?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteMemo(id);
          message.success('Memo deleted successfully');
          fetchData();
        } catch (error) {
          message.error('Failed to delete memo');
        }
      },
    });
  };

  const handleArchive = async (id, currentArchived) => {
    try {
      await updateMemo(id, { archived: !currentArchived });
      message.success(`Memo ${!currentArchived ? 'archived' : 'unarchived'}`);
      fetchData();
    } catch (error) {
      message.error('Failed to update memo');
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const getRelatedEntity = (record) => {
    if (record.deal) return { type: 'Deal', name: record.deal.title || record.deal.id };
    if (record.project) return { type: 'Project', name: record.project.name || record.project.id };
    if (record.contact) return { type: 'Contact', name: record.contact.name || record.contact.id };
    return null;
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title) => <strong>{title}</strong>,
    },
    {
      title: 'Status',
      dataIndex: 'draft',
      key: 'draft',
      render: (draft, record) => (
        <Space>
          <Tag color={draft ? 'orange' : 'green'}>
            {draft ? 'DRAFT' : 'PUBLISHED'}
          </Tag>
          {record.archived && <Tag color="default">ARCHIVED</Tag>}
        </Space>
      ),
    },
    {
      title: 'Related Entity',
      key: 'related',
      render: (_, record) => {
        const entity = getRelatedEntity(record);
        if (!entity) return '-';
        return (
          <Space direction="vertical" size="small">
            <Tag color="blue">{entity.type}</Tag>
            <span>{entity.name}</span>
          </Space>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? dayjs(date).format('DD MMM YYYY HH:mm') : '-',
      sorter: true,
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      render: (owner) => owner?.username || owner?.email || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 220,
      render: (_, record) => (
        <Space size="small" direction="vertical">
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/memos/${record.id}`)}
            >
              View
            </Button>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/memos/${record.id}/edit`)}
            />
          </Space>
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<InboxOutlined />}
              onClick={() => handleArchive(record.id, record.archived)}
            >
              {record.archived ? 'Unarchive' : 'Archive'}
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Space>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span>Memos</span>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/memos/new')}
        >
          New Memo
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Search
            placeholder="Search memos..."
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={setSearchText}
          />
          <Select
            placeholder="Filter by Status"
            style={{ width: 150 }}
            allowClear
            onChange={setDraftFilter}
            value={draftFilter}
          >
            <Select.Option value={true}>Draft</Select.Option>
            <Select.Option value={false}>Published</Select.Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Space>
    </Card>
  );
}
