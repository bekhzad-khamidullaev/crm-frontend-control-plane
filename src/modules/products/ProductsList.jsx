import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { deleteProduct, getProductCategories, getProducts } from '../../lib/api/products';
import { canWrite } from '../../lib/rbac.js';
import { formatCurrencyForRecord } from '../../lib/utils/format';
import { navigate } from '../../router';
import { EntityListToolbar } from '../../shared/ui/EntityListToolbar';
import { PageHeader } from '../../shared/ui/PageHeader';

const { Option } = Select;
const { Text } = Typography;

const normalizeOptionValue = (value, options = []) => {
  const matched = options.find((option) => String(option?.value) === String(value));
  return matched ? matched.value : value;
};

function ProductsList() {
  const { message } = App.useApp();
  const canManage = canWrite('crm.change_product');
  const [products, setProducts] = useState([]);
  const [allProductsCache, setAllProductsCache] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    loadProducts();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getProductCategories();
      setCategories(data.results || data || []);
    } catch (e) {
      console.error('Error loading categories:', e);
      setCategories([]);
    }
  };

  const loadProducts = async (page = 1, search = searchText, category = selectedCategory, pageSize = pagination.pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (pageSize) params.page_size = pageSize;
      if (search) params.search = search;
      if (category) params.product_category = category;

      const response = await getProducts(params);
      const results = response?.results || response || [];
      const total = typeof response?.count === 'number' ? response.count : results.length;

      if (results.length > pageSize && results.length === total) {
        setAllProductsCache(results);
        const startIndex = (page - 1) * pageSize;
        setProducts(results.slice(startIndex, startIndex + pageSize));
      } else {
        setAllProductsCache(null);
        setProducts(results);
      }

      setPagination((prev) => ({ ...prev, current: page, pageSize, total }));
    } catch (e) {
      setError(e?.message || 'Не удалось загрузить каталог продуктов');
      message.error('Ошибка загрузки продуктов');
      console.error('Error loading products:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    loadProducts(1, value, selectedCategory);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    loadProducts(1, searchText, value);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setSelectedCategory(null);
    loadProducts(1, '', null);
  };

  const handleTableChange = (newPagination) => {
    const nextPage = newPagination?.current || 1;
    const nextPageSize = newPagination?.pageSize || pagination.pageSize;
    const totalCount = typeof pagination.total === 'number' ? pagination.total : 0;
    const maxPage = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / nextPageSize)) : 1;
    const safePage = Math.min(nextPage, maxPage);

    if (nextPageSize !== pagination.pageSize) {
      setPagination((prev) => ({ ...prev, pageSize: nextPageSize }));
      setAllProductsCache(null);
      loadProducts(safePage, searchText, selectedCategory, nextPageSize);
      return;
    }

    if (allProductsCache && allProductsCache.length > 0) {
      const startIndex = (safePage - 1) * nextPageSize;
      setProducts(allProductsCache.slice(startIndex, startIndex + nextPageSize));
      setPagination((prev) => ({ ...prev, current: safePage }));
    } else {
      loadProducts(safePage, searchText, selectedCategory, nextPageSize);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      message.success('Продукт удален');
      loadProducts(pagination.current);
    } catch (e) {
      message.error('Ошибка удаления продукта');
      console.error('Error deleting product:', e);
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => <a onClick={() => navigate(`/products/${record.id}`)}>{text}</a>,
    },
    {
      title: 'Категория',
      dataIndex: 'category_name',
      key: 'category',
      width: 180,
      render: (value) => value || '-',
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      render: (price, record) => <span>{formatCurrencyForRecord(price, record)}</span>,
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => <Tag color={type === 'S' ? 'blue' : 'green'}>{type === 'S' ? 'Услуга' : type === 'G' ? 'Товар' : '-'}</Tag>,
    },
    {
      title: 'В продаже',
      dataIndex: 'on_sale',
      key: 'on_sale',
      width: 120,
      render: (onSale) => <Tag color={onSale ? 'green' : 'default'}>{onSale ? 'Да' : 'Нет'}</Tag>,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          {canManage ? (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                aria-label="Редактировать продукт"
                onClick={() => navigate(`/products/${record.id}/edit`)}
              />
              <Popconfirm title="Удалить продукт?" description="Это действие нельзя отменить" onConfirm={() => handleDelete(record.id)} okText="Да" cancelText="Нет">
                <Button type="link" size="small" danger icon={<DeleteOutlined />} aria-label="Удалить продукт" />
              </Popconfirm>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  const categoryOptions = categories.map((cat) => ({ value: cat.id, label: cat.name }));
  const normalizedSelectedCategory = normalizeOptionValue(selectedCategory, categoryOptions);
  const selectedCategoryLabel = categories.find((cat) => String(cat.id) === String(normalizedSelectedCategory))?.name;
  const activeFilters = [];
  if (searchText) {
    activeFilters.push({
      key: 'search',
      label: 'Поиск',
      value: searchText,
      onClear: () => {
        setSearchText('');
        loadProducts(1, '', selectedCategory);
      },
    });
  }
  if (selectedCategoryLabel) {
    activeFilters.push({
      key: 'category',
      label: 'Категория',
      value: selectedCategoryLabel,
      onClear: () => handleCategoryChange(null),
    });
  }

  return (
    <>
      <PageHeader
        title="Каталог продуктов"
        subtitle="Единый список продуктов с поиском и фильтрацией"
        extra={
          canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>Добавить продукт</Button>
          ) : null
        }
      />
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>

          <EntityListToolbar
            searchValue={searchText}
            searchPlaceholder="Поиск по названию"
            onSearchChange={handleSearch}
            filters={(
              <Select
                placeholder="Все категории"
                style={{ width: 220 }}
                allowClear
                onChange={handleCategoryChange}
                value={normalizedSelectedCategory}
              >
                {categories.map((cat) => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Option>
                ))}
              </Select>
            )}
            onRefresh={() => loadProducts(1, searchText, selectedCategory)}
            onReset={handleResetFilters}
            loading={loading}
            resultSummary={`Всего: ${pagination.total}`}
            activeFilters={activeFilters}
          />

          {error ? <Text type="danger">{error}</Text> : null}

          <Table
            columns={columns}
            dataSource={products}
            rowKey="id"
            loading={loading}
            pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `Всего: ${total}` }}
            onChange={handleTableChange}
            scroll={{ x: 1100 }}
          />
        </Space>
      </Card>
    </>
  );
}

export default ProductsList;
