import React from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Input,
  Progress,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
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
import { createDealServiceTicket, getDealOpsChain } from '../lib/api/deals.js';

const { Search } = Input;
const { Text } = Typography;

function paymentStatusTag(statusCode) {
  if (statusCode === 'received') return <Tag color="success">Received</Tag>;
  if (statusCode === 'guaranteed') return <Tag color="processing">Guaranteed</Tag>;
  if (statusCode === 'high_probability') return <Tag color="warning">High probability</Tag>;
  if (statusCode === 'low_probability') return <Tag color="default">Low probability</Tag>;
  if (statusCode === 'none') return <Tag>No payments</Tag>;
  return <Tag>{statusCode || 'unknown'}</Tag>;
}

export function OpsChainPanel() {
  const { message } = App.useApp();
  const [loading, setLoading] = React.useState(true);
  const [submittingDealId, setSubmittingDealId] = React.useState(null);
  const [errorState, setErrorState] = React.useState('');
  const [rows, setRows] = React.useState([]);
  const [summary, setSummary] = React.useState(null);
  const [search, setSearch] = React.useState('');

  const loadChain = React.useCallback(async (query = '') => {
    setLoading(true);
    setErrorState('');
    try {
      const response = await getDealOpsChain({ limit: 50, search: query || undefined });
      setRows(Array.isArray(response?.results) ? response.results : []);
      setSummary(response?.summary || null);
    } catch (error) {
      setRows([]);
      setSummary(null);
      setErrorState(error?.details?.message || error?.details?.detail || error?.message || 'Failed to load ops chain.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadChain();
  }, [loadChain]);

  const handleCreateTicket = async (dealId) => {
    setSubmittingDealId(dealId);
    try {
      const response = await createDealServiceTicket(dealId, {});
      if (response?.created) {
        message.success('Service ticket created');
      } else {
        message.info('Existing open service ticket is already linked');
      }
      await loadChain(search);
    } catch (error) {
      message.error(error?.details?.message || error?.details?.detail || error?.message || 'Failed to create service ticket.');
    } finally {
      setSubmittingDealId(null);
    }
  };

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Card size="small">
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
            <Search
              allowClear
              placeholder="Search deal or ticket"
              onSearch={(value) => {
                const next = String(value || '').trim();
                setSearch(next);
                loadChain(next);
              }}
              style={{ maxWidth: 360 }}
            />
            <Button onClick={() => loadChain(search)} loading={loading}>
              Refresh
            </Button>
          </Space>
          {summary && (
            <Space wrap size={16}>
              <Text>Deals: <b>{summary.deals || 0}</b></Text>
              <Text>With invoice: <b>{summary.with_invoice || 0}</b></Text>
              <Text>With payment: <b>{summary.with_received_payment || 0}</b></Text>
              <Text>With service ticket: <b>{summary.with_service_ticket || 0}</b></Text>
              <Text>With fulfillment: <b>{summary.with_fulfillment || 0}</b></Text>
              <Text>With docs template: <b>{summary.with_document_template || 0}</b></Text>
            </Space>
          )}
          <Alert
            type="info"
            showIcon
            message="ERP-adjacent chain"
            description="lead/deal -> invoice -> payment status -> fulfillment -> service ticket -> document template readiness."
          />
        </Space>
      </Card>

      {errorState ? (
        <Alert type="error" showIcon message="Ops chain unavailable" description={errorState} />
      ) : rows.length === 0 && !loading ? (
        <Card size="small">
          <Empty description="No deals in ops chain." />
        </Card>
      ) : (
        <Table
          size="small"
          rowKey="deal_id"
          loading={loading}
          dataSource={rows}
          scroll={{ x: 980 }}
          pagination={false}
          columns={[
            {
              title: 'Deal',
              dataIndex: 'deal_name',
              key: 'deal_name',
              render: (_value, row) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{row.deal_name}</Text>
                  <Text type="secondary">#{row.deal_id} • {row.deal_ticket || 'no ticket'}</Text>
                </Space>
              ),
            },
            {
              title: 'Invoice',
              key: 'invoice',
              render: (_value, row) => (
                row.invoice_numbers?.length
                  ? <Space wrap>{row.invoice_numbers.map((invoice) => <Tag key={invoice}>{invoice}</Tag>)}</Space>
                  : <Text type="secondary">Not issued</Text>
              ),
            },
            {
              title: 'Payment',
              key: 'payment',
              render: (_value, row) => (
                <Space direction="vertical" size={4}>
                  {paymentStatusTag(row.latest_payment_status?.code)}
                  <Progress percent={Number(row.payment_progress_percent || 0)} size="small" />
                </Space>
              ),
            },
            {
              title: 'Service ticket',
              key: 'service_ticket',
              render: (_value, row) => (
                row.service_ticket
                  ? (
                    <Space direction="vertical" size={0}>
                      <Tag color={row.service_ticket.pending ? 'processing' : 'default'}>
                        {row.service_ticket.pending ? 'Open' : 'Closed'}
                      </Tag>
                      <Text>{row.service_ticket.ticket}</Text>
                    </Space>
                  )
                  : <Text type="secondary">Missing</Text>
              ),
            },
            {
              title: 'Fulfillment',
              key: 'fulfillment',
              render: (_value, row) => {
                const status = row?.fulfillment?.status || 'not_started';
                const color = status === 'shipped' ? 'success' : status === 'planned' ? 'processing' : 'default';
                return (
                  <Space direction="vertical" size={0}>
                    <Tag color={color}>{status}</Tag>
                    <Text type="secondary">
                      {row?.fulfillment?.outputs_shipped || 0}/{row?.fulfillment?.outputs_total || 0} shipped
                    </Text>
                  </Space>
                );
              },
            },
            {
              title: 'Document',
              key: 'document',
              render: (_value, row) => (
                (row?.document?.template_ready)
                  ? <Tag color="success">{row?.document?.template_code || 'ready'}</Tag>
                  : <Tag>not ready</Tag>
              ),
            },
            {
              title: 'Action',
              key: 'actions',
              width: 180,
              render: (_value, row) => (
                <Button
                  type="primary"
                  size="small"
                  loading={submittingDealId === row.deal_id}
                  disabled={Boolean(row.service_ticket)}
                  onClick={() => handleCreateTicket(row.deal_id)}
                >
                  Create ticket
                </Button>
              ),
            },
          ]}
        />
      )}
    </Space>
  );
}

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
    {
      key: 'ops-chain',
      label: 'Ops chain',
      children: <OpsChainPanel />,
    },
  ];

  return <Tabs items={tabs} />;
}
