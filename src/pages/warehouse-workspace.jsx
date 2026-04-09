import { Alert, App, Space, Table, Tabs, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import EditableCell from '@/components/editable-cell';
import { getProducts, patchProduct } from '../lib/api/products.js';
import { getShipments, patchShipment } from '../lib/api/shipments.js';
import { getOutputs, patchOutput } from '../lib/api/outputs.js';
import { BusinessEntityListShell } from '../components/business/BusinessEntityListShell';
import { EntityListToolbar } from '../shared/ui/EntityListToolbar';
import { WorkspaceSummaryStrip, WorkspaceTabsShell } from '../shared/ui/WorkspaceRhythm';
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
  const { message } = App.useApp();
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
  const summaryItems = useMemo(
    () => [
      { key: 'sku', label: 'SKU в каталоге', value: filteredProducts.length },
      { key: 'transit', label: 'В пути', value: inTransitCount },
      { key: 'docs', label: 'Складские документы', value: filteredDocuments.length },
      {
        key: 'stockValue',
        label: 'Оценка остатка',
        value: stockValue.toFixed(2),
        hint: 'Суммарная стоимость по текущей выборке',
      },
    ],
    [filteredProducts.length, inTransitCount, filteredDocuments.length, stockValue],
  );

  const shipmentStatusOptions = useMemo(
    () => [
      { value: 'pending', label: 'Ожидает' },
      { value: 'in_transit', label: 'В пути' },
      { value: 'delivered', label: 'Доставлено' },
      { value: 'cancelled', label: 'Отменено' },
    ],
    [],
  );

  const handleInlineSave = async (entity, record, dataIndex, value) => {
    const prevProducts = products;
    const prevShipments = shipments;
    const prevDocuments = documents;

    let normalizedValue = value;
    if ((dataIndex === 'price' || dataIndex === 'stock_quantity' || dataIndex === 'amount') && value !== '' && value !== null && value !== undefined) {
      normalizedValue = Number(value);
    }
    if ((dataIndex === 'shipped_date' || dataIndex === 'estimated_delivery' || dataIndex === 'date') && value?.format) {
      normalizedValue = value.format('YYYY-MM-DD');
    }

    const patch = { [dataIndex]: normalizedValue };
    if (entity === 'product') {
      setProducts((prev) => prev.map((row) => (row.id === record.id ? { ...row, ...patch } : row)));
    }
    if (entity === 'shipment') {
      setShipments((prev) => prev.map((row) => (row.id === record.id ? { ...row, ...patch } : row)));
    }
    if (entity === 'document') {
      setDocuments((prev) => prev.map((row) => (row.id === record.id ? { ...row, ...patch } : row)));
    }

    try {
      if (entity === 'product') await patchProduct(record.id, patch);
      if (entity === 'shipment') await patchShipment(record.id, patch);
      if (entity === 'document') await patchOutput(record.id, patch);
      message.success('Изменения сохранены');
    } catch (saveError) {
      setProducts(prevProducts);
      setShipments(prevShipments);
      setDocuments(prevDocuments);
      message.error('Не удалось сохранить изменения');
      throw saveError;
    }
  };

  return (
    <BusinessEntityListShell
      title="Склад"
      subtitle="Остатки, номенклатура, журнал движений и складские документы."
    >
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
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
      <WorkspaceSummaryStrip items={summaryItems} />

      <WorkspaceTabsShell>
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
                      render: (_, record) => (
                        <EditableCell
                          value={record.stock_quantity || record.quantity || 0}
                          record={record}
                          dataIndex="stock_quantity"
                          type="number"
                          onSave={(r, key, nextValue) => handleInlineSave('product', r, key, nextValue)}
                          renderView={(val) => toNumberSafe(val || 0)}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
                    {
                      title: 'Цена',
                      dataIndex: 'price',
                      key: 'price',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="price"
                          type="number"
                          onSave={(r, key, nextValue) => handleInlineSave('product', r, key, nextValue)}
                          renderView={(val) => {
                            const currencyCode = record.currency_code || record.currency_name;
                            return currencyCode ? formatCurrency(val, currencyCode) : '-';
                          }}
                          style={{ paddingInline: 0 }}
                        />
                      ),
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
                    {
                      title: 'Перевозчик',
                      dataIndex: 'carrier',
                      key: 'carrier',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="carrier"
                          onSave={(r, key, nextValue) => handleInlineSave('shipment', r, key, nextValue)}
                          placeholder="Перевозчик"
                        />
                      ),
                    },
                    { title: 'Сделка', dataIndex: 'deal_name', key: 'deal_name', render: (value) => value || '-' },
                    {
                      title: 'Статус',
                      dataIndex: 'status',
                      key: 'status',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="status"
                          type="select"
                          options={shipmentStatusOptions}
                          saveOnBlur={false}
                          onSave={(r, key, nextValue) => handleInlineSave('shipment', r, key, nextValue)}
                          renderView={(val) => statusTag(val)}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
                    {
                      title: 'Отгрузка',
                      dataIndex: 'shipped_date',
                      key: 'shipped_date',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="shipped_date"
                          type="date"
                          onSave={(r, key, nextValue) => handleInlineSave('shipment', r, key, nextValue)}
                          renderView={(viewDate) => formatDateSafe(viewDate)}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
                    {
                      title: 'Доставка',
                      dataIndex: 'estimated_delivery',
                      key: 'estimated_delivery',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="estimated_delivery"
                          type="date"
                          onSave={(r, key, nextValue) => handleInlineSave('shipment', r, key, nextValue)}
                          renderView={(viewDate) => formatDateSafe(viewDate)}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
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
                    {
                      title: 'Категория',
                      dataIndex: 'category',
                      key: 'category',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="category"
                          onSave={(r, key, nextValue) => handleInlineSave('document', r, key, nextValue)}
                          placeholder="Категория"
                        />
                      ),
                    },
                    { title: 'Номер', dataIndex: 'receipt_number', key: 'receipt_number', render: (value) => value || '-' },
                    {
                      title: 'Сумма',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="amount"
                          type="number"
                          onSave={(r, key, nextValue) => handleInlineSave('document', r, key, nextValue)}
                          renderView={(val) => {
                            const currencyCode = record.currency_code || record.currency_name;
                            return currencyCode ? formatCurrency(val, currencyCode) : '-';
                          }}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
                    {
                      title: 'Дата',
                      dataIndex: 'date',
                      key: 'date',
                      render: (value, record) => (
                        <EditableCell
                          value={value}
                          record={record}
                          dataIndex="date"
                          type="date"
                          onSave={(r, key, nextValue) => handleInlineSave('document', r, key, nextValue)}
                          renderView={(viewDate) => formatDateSafe(viewDate)}
                          style={{ paddingInline: 0 }}
                        />
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </WorkspaceTabsShell>
      </Space>
    </BusinessEntityListShell>
  );
}
