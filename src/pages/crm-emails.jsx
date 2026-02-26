import React from 'react';
import CrudPage from '../components/CrudPage.jsx';
import {
  getCrmEmails,
  getCrmEmail,
  createCrmEmail,
  updateCrmEmail,
  deleteCrmEmail,
} from '../lib/api/emails.js';
import { getCompanies, getCompany, getContacts, getContact, getDeals, getDeal, getLeads, getLead } from '../lib/api/client.js';
import { getRequests, getRequest } from '../lib/api/requests.js';
import { getUsers, getUser } from '../lib/api/client.js';

export default function CrmEmailsPage() {
  return (
    <CrudPage
      title="CRM Emails"
      description="Переписка с клиентами (не массовые рассылки)."
      api={{
        list: getCrmEmails,
        retrieve: getCrmEmail,
        create: createCrmEmail,
        update: updateCrmEmail,
        remove: deleteCrmEmail,
      }}
      columns={[
        { title: 'Тема', dataIndex: 'subject', key: 'subject' },
        { title: 'От', dataIndex: 'from_field', key: 'from_field' },
        { title: 'Кому', dataIndex: 'to', key: 'to' },
        { title: 'Входящее', dataIndex: 'incoming', key: 'incoming', render: (value) => value ? 'Да' : 'Нет' },
        { title: 'Отправлено', dataIndex: 'sent', key: 'sent', render: (value) => value ? 'Да' : 'Нет' },
        { title: 'Контакт', dataIndex: 'contact_name', key: 'contact_name' },
        { title: 'Компания', dataIndex: 'company_name', key: 'company_name' },
        { title: 'Создано', dataIndex: 'creation_date', key: 'creation_date', width: 180 },
      ]}
      fields={[
        { name: 'subject', label: 'Тема', type: 'text', required: true },
        { name: 'content', label: 'Текст', type: 'textarea', rows: 6, required: true },
        { name: 'from_field', label: 'From', type: 'text' },
        { name: 'to', label: 'To', type: 'text' },
        { name: 'incoming', label: 'Входящее', type: 'switch' },
        { name: 'sent', label: 'Отправлено', type: 'switch' },
        {
          name: 'owner',
          label: 'Владелец',
          type: 'entity',
          fetchList: getUsers,
          fetchById: getUser,
        },
        {
          name: 'company',
          label: 'Компания',
          type: 'entity',
          fetchList: getCompanies,
          fetchById: getCompany,
        },
        {
          name: 'contact',
          label: 'Контакт',
          type: 'entity',
          fetchList: getContacts,
          fetchById: getContact,
        },
        {
          name: 'deal',
          label: 'Сделка',
          type: 'entity',
          fetchList: getDeals,
          fetchById: getDeal,
        },
        {
          name: 'lead',
          label: 'Лид',
          type: 'entity',
          fetchList: getLeads,
          fetchById: getLead,
        },
        {
          name: 'request',
          label: 'Запрос',
          type: 'entity',
          fetchList: getRequests,
          fetchById: getRequest,
        },
      ]}
    />
  );
}
