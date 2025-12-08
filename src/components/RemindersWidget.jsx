/**
 * Reminders Widget
 * Виджет с ближайшими напоминаниями для дашборда
 */

import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Empty, Spin, Space, Badge, Tooltip } from 'antd';
import {
  BellOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  SnoozeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  getUpcomingReminders,
  markReminderCompleted,
  snoozeReminder,
} from '../lib/api/reminders';
import { navigate } from '../router';

const RemindersWidget = ({ maxItems = 5 }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const response = await getUpcomingReminders({ page_size: maxItems });
      setReminders(response.results || response || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await markReminderCompleted(id);
      loadReminders();
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  const handleSnooze = async (id) => {
    try {
      await snoozeReminder(id, 30); // Отложить на 30 минут
      loadReminders();
    } catch (error) {
      console.error('Error snoozing reminder:', error);
    }
  };

  const getTimeColor = (remindAt) => {
    const now = new Date();
    const reminderTime = new Date(remindAt);
    const diffMinutes = (reminderTime - now) / (1000 * 60);

    if (diffMinutes < 0) return 'red'; // Просрочено
    if (diffMinutes < 60) return 'orange'; // Меньше часа
    return 'blue'; // Больше часа
  };

  const formatTime = (remindAt) => {
    const now = new Date();
    const reminderTime = new Date(remindAt);
    const diffMinutes = Math.floor((reminderTime - now) / (1000 * 60));

    if (diffMinutes < 0) {
      return `Просрочено на ${Math.abs(diffMinutes)} мин`;
    }
    if (diffMinutes < 60) {
      return `Через ${diffMinutes} мин`;
    }
    if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `Через ${hours} ч`;
    }
    const days = Math.floor(diffMinutes / 1440);
    return `Через ${days} д`;
  };

  if (loading) {
    return (
      <Card
        title={
          <Space>
            <BellOutlined />
            <span>Напоминания</span>
          </Space>
        }
        style={{ height: '100%' }}
      >
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <Badge count={reminders.length} showZero>
            <BellOutlined />
          </Badge>
          <span>Напоминания</span>
        </Space>
      }
      extra={
        <Button
          type="link"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => navigate('/reminders/new')}
        >
          Добавить
        </Button>
      }
      style={{ height: '100%' }}
    >
      {reminders.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Нет активных напоминаний"
        />
      ) : (
        <List
          dataSource={reminders}
          renderItem={(reminder) => (
            <List.Item
              key={reminder.id}
              actions={[
                <Tooltip title="Отложить">
                  <Button
                    type="text"
                    size="small"
                    icon={<SnoozeOutlined />}
                    onClick={() => handleSnooze(reminder.id)}
                  />
                </Tooltip>,
                <Tooltip title="Завершить">
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => handleComplete(reminder.id)}
                  />
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{reminder.title}</span>
                    <Tag
                      color={getTimeColor(reminder.remind_at)}
                      icon={<ClockCircleOutlined />}
                    >
                      {formatTime(reminder.remind_at)}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    {reminder.description && (
                      <div style={{ marginBottom: 4 }}>
                        {reminder.description.length > 60
                          ? `${reminder.description.substring(0, 60)}...`
                          : reminder.description}
                      </div>
                    )}
                    <small style={{ color: '#999' }}>
                      {new Date(reminder.remind_at).toLocaleString('ru')}
                    </small>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
      
      {reminders.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="link" onClick={() => navigate('/reminders')}>
            Смотреть все
          </Button>
        </div>
      )}
    </Card>
  );
};

export default RemindersWidget;
