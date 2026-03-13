import React from 'react';
import { Tabs } from 'antd';
import CrudPage from '../components/CrudPage.jsx';
import { t } from '../lib/i18n/index.js';
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
    { name: 'description', label: t('operationsPage.fields.description'), type: 'textarea', rows: 4 },
    { name: 'first_name', label: t('operationsPage.fields.firstName'), type: 'text', required: true },
    { name: 'middle_name', label: t('operationsPage.fields.middleName'), type: 'text' },
    { name: 'last_name', label: t('operationsPage.fields.lastName'), type: 'text' },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'phone', label: t('operationsPage.fields.phone'), type: 'text' },
    { name: 'country', label: t('operationsPage.fields.country'), type: 'reference', referenceType: 'countries' },
    { name: 'city', label: t('operationsPage.fields.city'), type: 'reference', referenceType: 'cities' },
    {
      name: 'owner',
      label: t('operationsPage.fields.owner'),
      type: 'entity',
      fetchList: getUsers,
      fetchById: getUser,
    },
    {
      name: 'company',
      label: t('operationsPage.fields.company'),
      type: 'entity',
      fetchList: getCompanies,
      fetchById: getCompany,
    },
    {
      name: 'contact',
      label: t('operationsPage.fields.contact'),
      type: 'entity',
      fetchList: getContacts,
      fetchById: getContact,
    },
    {
      name: 'lead',
      label: t('operationsPage.fields.lead'),
      type: 'entity',
      fetchList: getLeads,
      fetchById: getLead,
    },
  ];

  const outputFields = [
    {
      name: 'deal',
      label: t('operationsPage.fields.deal'),
      type: 'entity',
      fetchList: getDeals,
      fetchById: getDeal,
      required: true,
    },
    {
      name: 'product',
      label: t('operationsPage.fields.product'),
      type: 'entity',
      fetchList: getProducts,
      fetchById: getProduct,
      required: true,
    },
    { name: 'quantity', label: t('operationsPage.fields.quantity'), type: 'number' },
    { name: 'amount', label: t('operationsPage.fields.amount'), type: 'number' },
    { name: 'currency', label: t('operationsPage.fields.currency'), type: 'reference', referenceType: 'currencies' },
    { name: 'shipping_date', label: t('operationsPage.fields.shippingDate'), type: 'date' },
    { name: 'planned_shipping_date', label: t('operationsPage.fields.plannedShippingDate'), type: 'date' },
    { name: 'actual_shipping_date', label: t('operationsPage.fields.actualShippingDate'), type: 'date' },
    { name: 'product_is_shipped', label: t('operationsPage.fields.shipped'), type: 'switch' },
    { name: 'serial_number', label: t('operationsPage.fields.serialNumber'), type: 'text' },
  ];

  const outputColumns = [
    { title: t('operationsPage.columns.deal'), dataIndex: 'deal_name', key: 'deal_name' },
    { title: t('operationsPage.columns.product'), dataIndex: 'product_name', key: 'product_name' },
    { title: t('operationsPage.columns.quantity'), dataIndex: 'quantity', key: 'quantity', width: 120 },
    { title: t('operationsPage.columns.amount'), dataIndex: 'amount', key: 'amount', width: 120 },
    { title: t('operationsPage.columns.currency'), dataIndex: 'currency_name', key: 'currency_name', width: 120 },
    { title: t('operationsPage.columns.shipped'), dataIndex: 'product_is_shipped', key: 'product_is_shipped', render: (value) => value ? t('operationsPage.common.yes') : t('operationsPage.common.no') },
  ];

  const tabs = [
    {
      key: 'requests',
      label: t('operationsPage.tabs.requests'),
      children: (
        <CrudPage
          title={t('operationsPage.tabs.requests')}
          api={{
            list: getRequests,
            retrieve: getRequest,
            create: createRequest,
            update: updateRequest,
            remove: deleteRequest,
          }}
          columns={[
            { title: t('operationsPage.columns.ticket'), dataIndex: 'ticket', key: 'ticket', width: 120 },
            { title: t('operationsPage.columns.firstName'), dataIndex: 'first_name', key: 'first_name' },
            { title: t('operationsPage.columns.lastName'), dataIndex: 'last_name', key: 'last_name' },
            { title: 'Email', dataIndex: 'email', key: 'email' },
            { title: t('operationsPage.columns.phone'), dataIndex: 'phone', key: 'phone' },
            { title: t('operationsPage.columns.company'), dataIndex: 'company_name', key: 'company_name' },
            { title: t('operationsPage.columns.contact'), dataIndex: 'contact_name', key: 'contact_name' },
            { title: t('operationsPage.columns.lead'), dataIndex: 'lead_name', key: 'lead_name' },
          ]}
          fields={requestFields}
        />
      ),
    },
    {
      key: 'outputs',
      label: t('operationsPage.tabs.outputs'),
      children: (
        <CrudPage
          title={t('operationsPage.tabs.outputs')}
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
      label: t('operationsPage.tabs.shipments'),
      children: (
        <CrudPage
          title={t('operationsPage.tabs.shipments')}
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
