import React from 'react';
import { Tabs } from 'antd';
import CrudPage from '../components/CrudPage.jsx';
import {
  getEmailAccounts,
  getEmailAccount,
  createEmailAccount,
  updateEmailAccount,
  deleteEmailAccount,
  getMailings,
  getMailing,
  getMessages,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
  getSignatures,
  getSignature,
  createSignature,
  updateSignature,
  deleteSignature,
} from '../lib/api/massmail.js';
import { getUsers, getUser } from '../lib/api/client.js';

const emailAccountFields = [
  { name: 'name', label: 'Название', type: 'text', required: true },
  { name: 'email_host_user', label: 'Email Host User', type: 'text', required: true },
  { name: 'email_host', label: 'SMTP Host', type: 'text', required: true },
  { name: 'imap_host', label: 'IMAP Host', type: 'text' },
  { name: 'from_email', label: 'From Email', type: 'text', required: true },
  { name: 'main', label: 'Основной', type: 'switch' },
  { name: 'massmail', label: 'Разрешить рассылки', type: 'switch' },
  { name: 'do_import', label: 'Импортировать письма', type: 'switch' },
  {
    name: 'owner',
    label: 'Владелец',
    type: 'entity',
    fetchList: getUsers,
    fetchById: getUser,
  },
];

const messageFields = [
  { name: 'subject', label: 'Тема', type: 'text', required: true },
  { name: 'content', label: 'Текст', type: 'textarea', rows: 6, required: true },
  {
    name: 'owner',
    label: 'Владелец',
    type: 'entity',
    fetchList: getUsers,
    fetchById: getUser,
  },
];

const signatureFields = [
  { name: 'name', label: 'Название', type: 'text', required: true },
  { name: 'content', label: 'HTML контент', type: 'textarea', rows: 6, required: true },
  {
    name: 'owner',
    label: 'Владелец',
    type: 'entity',
    fetchList: getUsers,
    fetchById: getUser,
  },
];

export default function MassmailPage() {
  const tabs = [
    {
      key: 'accounts',
      label: 'Email аккаунты',
      children: (
        <CrudPage
          title="Email аккаунты"
          api={{
            list: getEmailAccounts,
            retrieve: getEmailAccount,
            create: createEmailAccount,
            update: updateEmailAccount,
            remove: deleteEmailAccount,
          }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            { title: 'Email Host User', dataIndex: 'email_host_user', key: 'email_host_user' },
            { title: 'From Email', dataIndex: 'from_email', key: 'from_email' },
            { title: 'Основной', dataIndex: 'main', key: 'main', render: (value) => value ? 'Да' : 'Нет' },
            { title: 'Massmail', dataIndex: 'massmail', key: 'massmail', render: (value) => value ? 'Да' : 'Нет' },
            { title: 'Владелец', dataIndex: 'owner_name', key: 'owner_name' },
          ]}
          fields={emailAccountFields}
        />
      ),
    },
    {
      key: 'messages',
      label: 'Сообщения',
      children: (
        <CrudPage
          title="Сообщения"
          api={{
            list: getMessages,
            retrieve: getMessage,
            create: createMessage,
            update: updateMessage,
            remove: deleteMessage,
          }}
          columns={[
            { title: 'Тема', dataIndex: 'subject', key: 'subject' },
            { title: 'Владелец', dataIndex: 'owner_name', key: 'owner_name' },
            { title: 'Обновлено', dataIndex: 'update_date', key: 'update_date', width: 180 },
          ]}
          fields={messageFields}
        />
      ),
    },
    {
      key: 'mailings',
      label: 'Рассылки',
      children: (
        <CrudPage
          title="Рассылки"
          api={{ list: getMailings, retrieve: getMailing }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            { title: 'Сообщение', dataIndex: 'message_name', key: 'message_name' },
            { title: 'Статус', dataIndex: 'status', key: 'status', width: 100 },
            { title: 'Дата отправки', dataIndex: 'sending_date', key: 'sending_date', width: 140 },
            { title: 'Получателей', dataIndex: 'recipients_number', key: 'recipients_number', width: 120 },
          ]}
          fields={[]}
          readOnly
        />
      ),
    },
    {
      key: 'signatures',
      label: 'Подписи',
      children: (
        <CrudPage
          title="Подписи"
          api={{
            list: getSignatures,
            retrieve: getSignature,
            create: createSignature,
            update: updateSignature,
            remove: deleteSignature,
          }}
          columns={[
            { title: 'Название', dataIndex: 'name', key: 'name' },
            { title: 'Владелец', dataIndex: 'owner_name', key: 'owner_name' },
          ]}
          fields={signatureFields}
        />
      ),
    },
  ];

  return <Tabs items={tabs} />;
}
