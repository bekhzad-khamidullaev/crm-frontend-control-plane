import { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Space, Tag, message, Modal, Spin, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined, FileTextOutlined, InboxOutlined, CheckOutlined } from '@ant-design/icons';
import { getMemo, deleteMemo, updateMemo } from '../../lib/api/memos';
import { navigate } from '../../router';
import dayjs from 'dayjs';

const { Paragraph } = Typography;

export default function MemoDetail({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMemo(id);
      setData(res);
    } catch (error) {
      message.error('Failed to fetch memo details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Memo',
      content: 'Are you sure you want to delete this memo?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteMemo(id);
          message.success('Memo deleted successfully');
          navigate('/memos');
        } catch (error) {
          message.error('Failed to delete memo');
        }
      },
    });
  };

  const handleArchive = async () => {
    try {
      await updateMemo(id, { archived: !data.archived });
      message.success(`Memo ${!data.archived ? 'archived' : 'unarchived'}`);
      fetchData();
    } catch (error) {
      message.error('Failed to update memo');
    }
  };

  const handlePublish = async () => {
    try {
      await updateMemo(id, { draft: false });
      message.success('Memo published successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to publish memo');
    }
  };

  const getRelatedEntity = () => {
    if (data.deal) return { type: 'Deal', id: data.deal.id, title: data.deal.title };
    if (data.project) return { type: 'Project', id: data.project.id, title: data.project.name };
    if (data.contact) return { type: 'Contact', id: data.contact.id, title: data.contact.name };
    return null;
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          Memo not found
        </div>
      </Card>
    );
  }

  const entity = getRelatedEntity();

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Memo Details</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/memos')}
            >
              Back
            </Button>
            {data.draft && (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handlePublish}
              >
                Publish
              </Button>
            )}
            <Button
              icon={<InboxOutlined />}
              onClick={handleArchive}
            >
              {data.archived ? 'Unarchive' : 'Archive'}
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/memos/${id}/edit`)}
            >
              Edit
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Title" span={2}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {data.title}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Status">
            <Space>
              <Tag color={data.draft ? 'orange' : 'green'}>
                {data.draft ? 'DRAFT' : 'PUBLISHED'}
              </Tag>
              {data.archived && <Tag color="default">ARCHIVED</Tag>}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Category">
            {data.category || '-'}
          </Descriptions.Item>

          {entity && (
            <>
              <Descriptions.Item label="Related Entity Type">
                <Tag color="blue">{entity.type}</Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Related Entity">
                <Button
                  type="link"
                  onClick={() => navigate(`/${entity.type.toLowerCase()}s/${entity.id}`)}
                  style={{ padding: 0 }}
                >
                  {entity.title || `${entity.type} #${entity.id}`}
                </Button>
              </Descriptions.Item>
            </>
          )}

          <Descriptions.Item label="Owner">
            {data.owner?.username || data.owner?.email || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Created By">
            {data.created_by?.username || data.created_by?.email || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Created At">
            {data.created_at ? dayjs(data.created_at).format('DD MMM YYYY HH:mm') : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Updated At">
            {data.updated_at ? dayjs(data.updated_at).format('DD MMM YYYY HH:mm') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Content">
        <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
          {data.content || 'No content available'}
        </Paragraph>
      </Card>
    </Space>
  );
}
