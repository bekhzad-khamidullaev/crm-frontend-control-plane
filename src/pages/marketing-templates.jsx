import React from 'react';
import { Space } from 'antd';
import CrudPage from '../components/CrudPage.jsx';
import { getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate } from '../lib/api/marketing.js';

const channelOptions = [
  { label: 'SMS', value: 'sms' },
  { label: 'Telegram', value: 'tg' },
  { label: 'Instagram', value: 'ig' },
  { label: 'Email', value: 'email' },
];

export default function MarketingTemplatesPage({ embedded = false }) {
  return (
    <Space direction="vertical" size={embedded ? 10 : 16} style={{ width: '100%' }}>
      <CrudPage
        title={embedded ? 'Шаблоны сообщений' : 'Шаблоны сообщений'}
        description={embedded ? 'Управление шаблонами для каналов коммуникаций.' : 'Шаблоны для рассылок и автоматических сообщений.'}
        api={{
          list: getTemplates,
          retrieve: getTemplate,
          create: createTemplate,
          update: updateTemplate,
          remove: deleteTemplate,
        }}
        columns={[
          { title: 'Название', dataIndex: 'name', key: 'name' },
          { title: 'Канал', dataIndex: 'channel', key: 'channel', width: 120 },
          { title: 'Язык', dataIndex: 'locale', key: 'locale', width: 120 },
          { title: 'Тема', dataIndex: 'subject', key: 'subject' },
          { title: 'Версия', dataIndex: 'version', key: 'version', width: 100 },
          { title: 'Обновлено', dataIndex: 'updated_at', key: 'updated_at', width: 180 },
        ]}
        fields={[
          { name: 'name', label: 'Название', type: 'text', required: true },
          { name: 'channel', label: 'Канал', type: 'select', options: channelOptions, required: true },
          { name: 'locale', label: 'Язык', type: 'text', placeholder: 'ru, en, uz' },
          { name: 'subject', label: 'Тема', type: 'text' },
          { name: 'body', label: 'Текст', type: 'textarea', rows: 6, required: true },
        ]}
      />
    </Space>
  );
}
