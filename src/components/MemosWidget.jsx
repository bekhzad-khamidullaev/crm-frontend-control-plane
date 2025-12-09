import { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Space, Empty, Spin } from 'antd';
import { FileTextOutlined, EyeOutlined, InboxOutlined } from '@ant-design/icons';
import { getMemos, updateMemo } from '../lib/api/memos';
import { navigate } from '../router';
import dayjs from 'dayjs';

export default function MemosWidget() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMemos({ page_size: 5, ordering: '-created_at' });
      setData(res.results || []);
    } catch (error) {
      console.error('Failed to fetch memos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id, currentArchived) => {
    try {
      await updateMemo(id, { archived: !currentArchived });
      fetchData();
    } catch (error) {
      console.error('Failed to archive memo:', error);
    }
  };

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span>Recent Memos</span>
        </Space>
      }
      extra={
        <Button type="link" onClick={() => navigate('/memos')}>
          View All
        </Button>
      }
      styles={{ body: { padding: 0 } }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin />
        </div>
      ) : data.length === 0 ? (
        <Empty
          description="No memos yet"
          style={{ padding: '40px' }}
        />
      ) : (
        <List
          dataSource={data}
          renderItem={(item) => (
            <List.Item
              style={{ padding: '12px 24px' }}
              actions={[
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/memos/${item.id}`)}
                >
                  View
                </Button>,
                <Button
                  type="link"
                  size="small"
                  icon={<InboxOutlined />}
                  onClick={() => handleArchive(item.id, item.archived)}
                >
                  {item.archived ? 'Unarchive' : 'Archive'}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{item.title}</span>
                    <Tag color={item.draft ? 'orange' : 'green'}>
                      {item.draft ? 'Draft' : 'Published'}
                    </Tag>
                    {item.archived && <Tag>Archived</Tag>}
                  </Space>
                }
                description={
                  <Space size="small">
                    <span>{dayjs(item.created_at).format('DD MMM YYYY')}</span>
                    {item.owner && <span>• {item.owner.username || item.owner.email}</span>}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
