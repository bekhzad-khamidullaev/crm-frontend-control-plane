import React from 'react';
import { Tabs } from 'antd';
import CrudPage from '../components/CrudPage.jsx';
import {
  getRequests,
  getRequest,
  createRequest,
  updateRequest,
  deleteRequest,
} from '../lib/api/requests.js';
import {
  getOutputs,
  getOutput,
  createOutput,
  updateOutput,
  deleteOutput,
} from '../lib/api/outputs.js';
import {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
} from '../lib/api/shipments.js';
import { getCompanies, getCompany, getContacts, getContact, getLeads, getLead, getDeals, getDeal, getUsers, getUser } from '../lib/api/client.js';
import { getProducts, getProduct } from '../lib/api/products.js';

export default function OperationsPage() {
  const requestFields = [
    { name: 'description', label: 'Описание', type: 'textarea', rows: 4 },
    { name: 'first_name', label: 'Имя', type: 'text', required: true },
    { name: 'middle_name', label: 'Отчество', type: 'text' },
    { name: 'last_name', label: 'Фамилия', type: 'text' },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'phone', label: 'Телефон', type: 'text' },
    { name: 'country', label: 'Страна', type: 'reference', referenceType: 'countries' },
    { name: 'city', label: 'Город', type: 'reference', referenceType: 'cities' },
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
      name: 'lead',
      label: 'Лид',
      type: 'entity',
      fetchList: getLeads,
      fetchById: getLead,
    },
  ];

  const outputFields = [
    {
      name: 'deal',
      label: 'Сделка',
      type: 'entity',
      fetchList: getDeals,
      fetchById: getDeal,
      required: true,
    },
    {
      name: 'product',
      label: 'Продукт',
      type: 'entity',
      fetchList: getProducts,
      fetchById: getProduct,
      required: true,
    },
    { name: 'quantity', label: 'Количество', type: 'number' },
    { name: 'amount', label: 'Сумма', type: 'number' },
    { name: 'currency', label: 'Валюта', type: 'reference', referenceType: 'currencies' },
    { name: 'shipping_date', label: 'Дата отгрузки', type: 'date' },
    { name: 'planned_shipping_date', label: 'Плановая дата', type: 'date' },
    { name: 'actual_shipping_date', label: 'Фактическая дата', type: 'date' },
    { name: 'product_is_shipped', label: 'Отгружено', type: 'switch' },
    { name: 'serial_number', label: 'Серийный номер', type: 'text' },
  ];

  const outputColumns = [
    { title: 'Сделка', dataIndex: 'deal_name', key: 'deal_name' },
    { title: 'Продукт', dataIndex: 'product_name', key: 'product_name' },
    { title: 'Количество', dataIndex: 'quantity', key: 'quantity', width: 120 },
    { title: 'Сумма', dataIndex: 'amount', key: 'amount', width: 120 },
    { title: 'Валюта', dataIndex: 'currency_name', key: 'currency_name', width: 120 },
    { title: 'Отгружено', dataIndex: 'product_is_shipped', key: 'product_is_shipped', render: (value) => value ? 'Да' : 'Нет' },
  ];

  const tabs = [
    {
      key: 'requests',
      label: 'Запросы',
      children: (
        <CrudPage
          title="Запросы"
          api={{
            list: getRequests,
            retrieve: getRequest,
            create: createRequest,
            update: updateRequest,
            remove: deleteRequest,
          }}
          columns={[
            { title: 'Тикет', dataIndex: 'ticket', key: 'ticket', width: 120 },
            { title: 'Имя', dataIndex: 'first_name', key: 'first_name' },
            { title: 'Фамилия', dataIndex: 'last_name', key: 'last_name' },
            { title: 'Email', dataIndex: 'email', key: 'email' },
            { title: 'Телефон', dataIndex: 'phone', key: 'phone' },
            { title: 'Компания', dataIndex: 'company_name', key: 'company_name' },
            { title: 'Контакт', dataIndex: 'contact_name', key: 'contact_name' },
            { title: 'Лид', dataIndex: 'lead_name', key: 'lead_name' },
          ]}
          fields={requestFields}
        />
      ),
    },
    {
      key: 'outputs',
      label: 'Отгрузки (Outputs)',
      children: (
        <CrudPage
          title="Отгрузки (Outputs)"
          api={{
            list: getOutputs,
            retrieve: getOutput,
            create: createOutput,
            update: updateOutput,
            remove: deleteOutput,
          }}
          columns={outputColumns}
          fields={outputFields}
        />
      ),
    },
    {
      key: 'shipments',
      label: 'Поставки',
      children: (
        <CrudPage
          title="Поставки (Shipments)"
          api={{
            list: getShipments,
            retrieve: getShipment,
            create: createShipment,
            update: updateShipment,
            remove: deleteShipment,
          }}
          columns={outputColumns}
          fields={outputFields}
        />
      ),
    },
  ];

  return <Tabs items={tabs} />;
}
