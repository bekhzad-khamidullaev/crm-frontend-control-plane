import { Alert, Card, Space, Table, Tabs, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getMemos } from '../lib/api/memos.js';
import { getOutputs } from '../lib/api/outputs.js';
import { getShipments } from '../lib/api/shipments.js';
import { formatCurrency } from '../lib/utils/format.js';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { PageHeader } from '../shared/ui/PageHeader';
import { containsText, formatDateSafe, toResults } from './workspace-utils.js';

export default function DocumentsWorkspacePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [memos, setMemos] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [shipments, setShipments] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const [memosRes, outputsRes, shipmentsRes] = await Promise.allSettled([
      getMemos({ page_size: 300, ordering: '-update_date' }),
      getOutputs({ page_size: 300, ordering: '-date' }),
      getShipments({ page_size: 300, ordering: '-update_date' }),
    ]);

    setMemos(memosRes.status === 'fulfilled' ? toResults(memosRes.value) : []);
    setOutputs(outputsRes.status === 'fulfilled' ? toResults(outputsRes.value) : []);
    setShipments(shipmentsRes.status === 'fulfilled' ? toResults(shipmentsRes.value) : []);

    const hasFailure = [memosRes, outputsRes, shipmentsRes].some((result) => result.status === 'rejected');
    if (hasFailure) {
      setError('Часть документов недоступна. Показаны доступные записи.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMemos = useMemo(
    () => memos.filter((item) => containsText(item.subject || item.title, search) || containsText(item.text || item.description, search)),
    [memos, search],
  );
  const filteredOutputs = useMemo(
    () => outputs.filter((item) => containsText(item.title, search) || containsText(item.receipt_number, search) || containsText(item.category, search)),
    [outputs, search],
  );
  const filteredShipments = useMemo(
    () => shipments.filter((item) => containsText(item.tracking_number, search) || containsText(item.carrier, search) || containsText(item.status, search)),
    [shipments, search],
  );

  const activeFilters = search
    ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }]
    : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="Документы"
        subtitle="Централизованный реестр внутренних документов, платежных документов и документов отгрузки."
      />
      <EntityListToolbar
        searchValue={search}
        searchPlaceholder="Поиск по документам"
        onSearchChange={setSearch}
        onRefresh={loadData}
        onReset={() => setSearch('')}
        activeFilters={activeFilters}
        loading={loading}
        resultSummary={`Внутренние: ${filteredMemos.length} | Финансовые: ${filteredOutputs.length} | Логистические: ${filteredShipments.length}`}
      />
      {error ? <Alert type="warning" showIcon message={error} /> : null}

      <Card>
        <Tabs
          items={[
            {
              key: 'internal',
              label: 'Внутренние',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredMemos}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Документ', dataIndex: 'subject', key: 'subject', render: (value, record) => value || record.title || `#${record.id}` },
                    { title: 'Стадия', dataIndex: 'stage', key: 'stage', render: (value) => value ? <Tag>{value}</Tag> : '-' },
                    { title: 'Обновлено', dataIndex: 'update_date', key: 'update_date', render: (value) => formatDateSafe(value) },
                  ]}
                />
              ),
            },
            {
              key: 'financial',
              label: 'Финансовые',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredOutputs}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Документ', dataIndex: 'title', key: 'title', render: (value) => value || '-' },
                    { title: 'Категория', dataIndex: 'category', key: 'category', render: (value) => value || '-' },
                    { title: 'Номер', dataIndex: 'receipt_number', key: 'receipt_number', render: (value) => value || '-' },
                    {
                      title: 'Сумма',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (value, record) => {
                        const currencyCode = record.currency_code || record.currency_name;
                        return currencyCode ? formatCurrency(value, currencyCode) : '-';
                      },
                    },
                    { title: 'Дата', dataIndex: 'date', key: 'date', render: (value) => formatDateSafe(value) },
                  ]}
                />
              ),
            },
            {
              key: 'logistics',
              label: 'Логистические',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredShipments}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Трек-номер', dataIndex: 'tracking_number', key: 'tracking_number', render: (value) => value || '-' },
                    { title: 'Перевозчик', dataIndex: 'carrier', key: 'carrier', render: (value) => value || '-' },
                    { title: 'Сделка', dataIndex: 'deal_name', key: 'deal_name', render: (value) => value || '-' },
                    { title: 'Статус', dataIndex: 'status', key: 'status', render: (value) => value ? <Tag>{value}</Tag> : '-' },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
