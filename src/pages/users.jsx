import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, Card, Button, Table, message, Space, Empty, Row, Col, Statistic, Tag, Descriptions } from 'antd';
import CrudPage from '../components/CrudPage.jsx';
import { getUsers, getUser } from '../lib/api/client.js';
import { getProfiles, getProfileByUser, getUserSessions, revokeAllSessions, get2FAStatus } from '../lib/api/user.js';
import { formatValueForUi } from '../lib/utils/value-display.js';

function SecurityTab() {
  const [sessions, setSessions] = useState([]);
  const [twoFA, setTwoFA] = useState(null);
  const twoFaEntries = useMemo(() => {
    if (!twoFA || typeof twoFA !== 'object') return [];
    return Object.entries(twoFA);
  }, [twoFA]);

  const load = async () => {
    try {
      const [sessionsRes, twoFaRes] = await Promise.all([
        getUserSessions(),
        get2FAStatus(),
      ]);
      setSessions(sessionsRes?.results || sessionsRes || []);
      setTwoFA(twoFaRes);
    } catch (error) {
      message.error('Не удалось загрузить данные безопасности');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRevoke = async () => {
    try {
      await revokeAllSessions();
      message.success('Все сессии отозваны');
      load();
    } catch (error) {
      message.error('Не удалось отозвать сессии');
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card title="2FA статус" extra={<Button onClick={load}>Обновить</Button>}>
        {!twoFaEntries.length ? (
          <Empty description="Нет данных по 2FA" />
        ) : (
          <Row gutter={[16, 16]}>
            {twoFaEntries.map(([key, value]) => (
              <Col xs={24} md={8} key={key}>
                <Card size="small">
                  {(() => {
                    const title = key.replace(/_/g, ' ');
                    const formatted = formatValueForUi(value, { key });
                    if (formatted.kind === 'number') {
                      return <Statistic title={title} value={formatted.number} />;
                    }
                    if (formatted.text === 'Да' || formatted.text === 'Нет') {
                      return (
                        <>
                          <div style={{ marginBottom: 8, color: '#71717a' }}>{title}</div>
                          <Tag color={formatted.text === 'Да' ? 'green' : 'default'}>{formatted.text}</Tag>
                        </>
                      );
                    }
                    return (
                      <Descriptions size="small" column={1}>
                        <Descriptions.Item label={title}>
                          {formatted.kind === 'complex' ? JSON.stringify(formatted.value) : formatted.text}
                        </Descriptions.Item>
                      </Descriptions>
                    );
                  })()}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
      <Card title="Сессии" extra={<Button danger onClick={handleRevoke}>Отозвать все</Button>}>
        <Table
          dataSource={sessions}
          rowKey={(record) => record.id || record.session_key || `${record.ip_address || 'ip'}-${record.created_at || record.user_agent || 'session'}`}
          columns={[
            { title: 'IP', dataIndex: 'ip_address', key: 'ip_address' },
            { title: 'User Agent', dataIndex: 'user_agent', key: 'user_agent' },
            { title: 'Создано', dataIndex: 'created_at', key: 'created_at' },
            { title: 'Активна', dataIndex: 'is_active', key: 'is_active', render: (value) => value ? 'Да' : 'Нет' },
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </Space>
  );
}

export default function UsersPage() {
  const tabs = [
    {
      key: 'users',
      label: 'Пользователи',
      children: (
        <CrudPage
          title="Пользователи"
          api={{ list: getUsers, retrieve: getUser }}
          columns={[
            { title: 'Username', dataIndex: 'username', key: 'username' },
            { title: 'Имя', dataIndex: 'first_name', key: 'first_name' },
            { title: 'Фамилия', dataIndex: 'last_name', key: 'last_name' },
            { title: 'Email', dataIndex: 'email', key: 'email' },
          ]}
          fields={[]}
          readOnly
        />
      ),
    },
    {
      key: 'profiles',
      label: 'Профили',
      children: (
        <CrudPage
          title="Профили"
          api={{ list: getProfiles, retrieve: getProfileByUser }}
          columns={[
            { title: 'User', dataIndex: 'username', key: 'username' },
            { title: 'Email', dataIndex: 'email', key: 'email' },
            { title: 'Полное имя', dataIndex: 'full_name', key: 'full_name' },
            { title: 'PBX', dataIndex: 'pbx_number', key: 'pbx_number' },
            { title: 'Timezone', dataIndex: 'utc_timezone', key: 'utc_timezone' },
          ]}
          fields={[]}
          readOnly
        />
      ),
    },
    {
      key: 'security',
      label: 'Безопасность',
      children: <SecurityTab />,
    },
  ];

  return <Tabs items={tabs} />;
}
