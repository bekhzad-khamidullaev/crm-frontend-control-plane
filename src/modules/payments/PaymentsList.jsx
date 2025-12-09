import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, message, Modal, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, DollarOutlined, UploadOutlined } from '@ant-design/icons';
import { getPayments, deletePayment, updatePayment } from '../../lib/api/payments';
import { navigate } from '../../router';
import dayjs from 'dayjs';
// Temporarily commented to debug white screen
// import { ExportButton, ImportModal, BulkActions } from '../../components';
// import { formatters } from '../../lib/utils/export';
import BulkActions from '../../components/ui-BulkActions.jsx';

const { Search } = Input;

export default function PaymentsList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [importModalVisible, setImportModalVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchText, currencyFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        search: searchText || undefined,
        currency: currencyFilter || undefined,
        status: statusFilter || undefined,
      };
      const res = await getPayments(params);
      setData(res.results || []);
      setPagination((prev) => ({ ...prev, total: res.count || 0 }));
    } catch (error) {
      message.error('Failed to fetch payments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Payment',
      content: 'Are you sure you want to delete this payment?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deletePayment(id);
          message.success('Payment deleted successfully');
          fetchData();
        } catch (error) {
          message.error('Failed to delete payment');
        }
      },
    });
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  // Bulk operations
  const handleBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map(id => deletePayment(id)));
      message.success(`Deleted ${ids.length} payments`);
      setSelectedRowKeys([]);
      fetchData();
    } catch (error) {
      message.error('Failed to delete payments');
      throw error;
    }
  };

  const handleBulkStatusChange = (ids) => {
    Modal.confirm({
      title: 'Change Status',
      content: (
        <Select
          id="bulk-status-select"
          style={{ width: '100%', marginTop: 16 }}
          placeholder="Select new status"
        >
          <Select.Option value="pending">Pending</Select.Option>
          <Select.Option value="completed">Completed</Select.Option>
          <Select.Option value="failed">Failed</Select.Option>
          <Select.Option value="cancelled">Cancelled</Select.Option>
        </Select>
      ),
      onOk: async () => {
        const newStatus = document.getElementById('bulk-status-select').value;
        if (!newStatus) {
          message.warning('Please select a status');
          return;
        }
        try {
          await Promise.all(ids.map(id => updatePayment(id, { status: newStatus })));
          message.success(`Updated ${ids.length} payments`);
          setSelectedRowKeys([]);
          fetchData();
        } catch (error) {
          message.error('Failed to update payments');
        }
      },
    });
  };

  const handleBulkExport = (ids) => {
    return data.filter(item => ids.includes(item.id));
  };

  // Import functionality
  const handleImport = async (importedData) => {
    console.log('Importing payments:', importedData);
    message.success(`Would import ${importedData.length} payments`);
    fetchData();
  };

  const importFields = [
    { name: 'amount', label: 'Amount', type: 'number', required: true },
    { name: 'currency', label: 'Currency', required: true },
    { name: 'status', label: 'Status', required: false },
    { name: 'payment_date', label: 'Payment Date', type: 'date', required: false },
    { name: 'method', label: 'Method', required: false },
    { name: 'notes', label: 'Notes', required: false },
  ];

  const importValidationRules = [
    { field: 'amount', required: true, type: 'number', label: 'Amount' },
    { field: 'currency', required: true, label: 'Currency' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      completed: 'green',
      failed: 'red',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <span style={{ fontWeight: 'bold' }}>
          {record.currency || '$'} {parseFloat(amount).toFixed(2)}
        </span>
      ),
      sorter: true,
    },
    {
      title: 'Deal',
      dataIndex: 'deal',
      key: 'deal',
      render: (deal) => deal?.title || '-',
    },
    {
      title: 'Invoice',
      dataIndex: 'invoice',
      key: 'invoice',
      render: (invoice) => invoice?.number || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status ? status.toUpperCase() : 'UNKNOWN'}
        </Tag>
      ),
    },
    {
      title: 'Payment Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) => date ? dayjs(date).format('DD MMM YYYY') : '-',
      sorter: true,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (method) => method || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/payments/${record.id}`)}
          >
            View
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/payments/${record.id}/edit`)}
          />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  // Export columns configuration
  // Temporarily commented out
  /*
  const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'amount', label: 'Amount', format: formatters.number },
    { key: 'currency', label: 'Currency' },
    { key: 'status', label: 'Status' },
    { key: 'payment_date', label: 'Payment Date', format: formatters.date },
    { key: 'method', label: 'Method' },
    { key: 'deal.title', label: 'Deal' },
    { key: 'invoice.number', label: 'Invoice' },
    { key: 'created_at', label: 'Created', format: formatters.datetime },
  ];
  */

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  return (
    <Card
      title={
        <Space>
          <DollarOutlined />
          <span>Payments</span>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/payments/new')}
        >
          New Payment
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <Search
            placeholder="Search payments..."
            allowClear
            enterButton={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={setSearchText}
          />
          <Select
            placeholder="Filter by Currency"
            style={{ width: 150 }}
            allowClear
            onChange={setCurrencyFilter}
            value={currencyFilter}
          >
            <Select.Option value="USD">USD</Select.Option>
            <Select.Option value="EUR">EUR</Select.Option>
            <Select.Option value="GBP">GBP</Select.Option>
            <Select.Option value="UZS">UZS</Select.Option>
          </Select>
          <Select
            placeholder="Filter by Status"
            style={{ width: 150 }}
            allowClear
            onChange={setStatusFilter}
            value={statusFilter}
          >
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="completed">Completed</Select.Option>
            <Select.Option value="failed">Failed</Select.Option>
            <Select.Option value="cancelled">Cancelled</Select.Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          rowSelection={rowSelection}
        />
      </Space>

      <BulkActions
        selectedRowKeys={selectedRowKeys}
        onClearSelection={() => setSelectedRowKeys([])}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatusChange}
        entityName="payments"
      />
    </Card>
  );
}
