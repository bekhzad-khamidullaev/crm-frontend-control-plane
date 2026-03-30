import { Alert, Card, Space, Table, Tabs, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getProducts } from '../lib/api/products.js';
import { getShipments } from '../lib/api/shipments.js';
import { getOutputs } from '../lib/api/outputs.js';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { PageHeader } from '../shared/ui/PageHeader';
import { containsText, formatDateSafe, toNumberSafe, toResults } from './workspace-utils.js';
import { formatCurrency } from '../lib/utils/format.js';

const statusTag = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'delivered') return <Tag color="success">Доставлено</Tag>;
  if (normalized === 'in_transit') return <Tag color="processing">В пути</Tag>;
  if (normalized === 'pending') return <Tag color="warning">Ожидает</Tag>;
  if (normalized === 'cancelled') return <Tag>Отменено</Tag>;
  return <Tag>{status || '-'}</Tag>;
};

export default function WarehouseWorkspacePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [documents, setDocuments] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const [productsRes, shipmentsRes, outputsRes] = await Promise.allSettled([
      getProducts({ page_size: 300, ordering: '-update_date' }),
      getShipments({ page_size: 300, ordering: '-shipped_date' }),
      getOutputs({ page_size: 300, ordering: '-date' }),
    ]);

    setProducts(productsRes.status === 'fulfilled' ? toResults(productsRes.value) : []);
    setShipments(shipmentsRes.status === 'fulfilled' ? toResults(shipmentsRes.value) : []);
    setDocuments(outputsRes.status === 'fulfilled' ? toResults(outputsRes.value) : []);

    const hasFailure = [productsRes, shipmentsRes, outputsRes].some((result) => result.status === 'rejected');
    if (hasFailure) {
      setError('Часть данных по складу недоступна. Показаны актуальные доступные данные.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProducts = useMemo(
    () => products.filter((item) => containsText(item.name, search) || containsText(item.sku, search) || containsText(item.category_name, search)),
    [products, search],
  );

  const filteredShipments = useMemo(
    () => shipments.filter((item) => containsText(item.tracking_number, search) || containsText(item.carrier, search) || containsText(item.status, search)),
    [shipments, search],
  );

  const filteredDocuments = useMemo(
    () => documents.filter((item) => containsText(item.title, search) || containsText(item.receipt_number, search) || containsText(item.category, search)),
    [documents, search],
  );

  const inTransitCount = useMemo(
    () => filteredShipments.filter((shipment) => String(shipment.status || '').toLowerCase() === 'in_transit').length,
    [filteredShipments],
  );

  const stockValue = useMemo(
    () => filteredProducts.reduce((sum, item) => sum + toNumberSafe(item.price) * Math.max(1, toNumberSafe(item.stock_quantity || item.quantity || 1)), 0),
    [filteredProducts],
  );

  const activeFilters = search
    ? [{ key: 'search', label: 'Поиск', value: search, onClear: () => setSearch('') }]
    : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeader
        title="Склад"
        subtitle="Остатки, номенклатура, журнал движений и складские документы."
      />
      <EntityListToolbar
        searchValue={search}
        searchPlaceholder="Поиск по товарам, отгрузкам и документам"
        onSearchChange={setSearch}
        onRefresh={loadData}
        onReset={() => setSearch('')}
        activeFilters={activeFilters}
        loading={loading}
        resultSummary={`Товары: ${filteredProducts.length} | Отгрузки: ${filteredShipments.length} | Документы: ${filteredDocuments.length}`}
      />
      {error ? <Alert type="warning" showIcon message={error} /> : null}

      <Card>
        <Tabs
          items={[
            {
              key: 'stocks',
              label: 'Остатки',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredProducts}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  columns={[
                    { title: 'Товар', dataIndex: 'name', key: 'name', render: (value) => value || '-' },
                    { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (value) => value || '-' },
                    { title: 'Категория', dataIndex: 'category_name', key: 'category_name', render: (value) => value || '-' },
                    {
                      title: 'Количество',
                      key: 'stock',
                      render: (_, record) => toNumberSafe(record.stock_quantity || record.quantity || 0),
                    },
                    {
                      title: 'Цена',
                      dataIndex: 'price',
                      key: 'price',
                      render: (value, record) => {
                        const currencyCode = record.currency_code || record.currency_name;
                        return currencyCode ? formatCurrency(value, currencyCode) : '-';
                      },
                    },
                  ]}
                />
              ),
            },
            {
              key: 'shipments',
              label: 'Журнал движений',
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
                    {
                      title: 'Статус',
                      dataIndex: 'status',
                      key: 'status',
                      render: (value) => statusTag(value),
                    },
                    { title: 'Отгрузка', dataIndex: 'shipped_date', key: 'shipped_date', render: (value) => formatDateSafe(value) },
                    { title: 'Доставка', dataIndex: 'estimated_delivery', key: 'estimated_delivery', render: (value) => formatDateSafe(value) },
                  ]}
                />
              ),
            },
            {
              key: 'documents',
              label: 'Документы / ревизии',
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredDocuments}
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
          ]}
        />
      </Card>
    </Space>
  );
}
