import { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Space, Empty, Spin } from 'antd';
import { FileTextOutlined, EyeOutlined, CheckOutlined } from '@ant-design/icons';
import { getMemos, markMemoReviewed } from '../lib/api/memos';
import { canWrite } from '../lib/rbac.js';
import { navigate } from '../router';
import dayjs from 'dayjs';

export default function MemosWidget() {
  const canManage = canWrite('tasks.change_memo');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMemos({ page_size: 5, ordering: '-update_date' });
      setData(res.results || []);
    } catch (error) {
      console.error('Failed to fetch memos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewed = async (id) => {
    try {
      await markMemoReviewed(id);
      fetchData();
    } catch (error) {
      console.error('Failed to update memo:', error);
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
                ...(canManage
                  ? [
                      <Button
                        type="link"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => handleReviewed(item.id)}
                      >
                        Отметить
                      </Button>,
                    ]
                  : []),
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{item.name}</span>
                    <Tag color={item.stage === 'rev' ? 'green' : item.stage === 'pos' ? 'orange' : 'blue'}>
                      {item.stage === 'rev' ? 'Рассмотрено' : item.stage === 'pos' ? 'Отложено' : 'В ожидании'}
                    </Tag>
                    {item.draft && <Tag color="gold">Черновик</Tag>}
                  </Space>
                }
                description={
                  <Space size="small">
                    <span>{dayjs(item.update_date || item.creation_date).format('DD MMM YYYY')}</span>
                    {item.owner_name && <span>• {item.owner_name}</span>}
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
