import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Card,
  App,
  Popconfirm,
  Typography,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { getProducts, deleteProduct, getProductCategories } from '../../lib/api/products';
import { navigate } from '../../router';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

function ProductsList() {
  const { message } = App.useApp();
  const [products, setProducts] = useState([]);
  const [allProductsCache, setAllProductsCache] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getProductCategories();
      setCategories(data.results || data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const loadProducts = async (page = 1, search = searchText, category = selectedCategory, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const params = {
        page,
      };

      if (pageSize) {
        params.page_size = pageSize;
      }

      if (search) {
        params.search = search;
      }

      if (category) {
        params.product_category = category;
      }

      const response = await getProducts(params);

      const results = response?.results || response || [];
      const total = typeof response?.count === 'number' ? response.count : results.length;
      if (results.length > pageSize && results.length === total) {
        console.warn('⚠️ ProductsList: Caching all data');
        setAllProductsCache(results);
        const startIndex = (page - 1) * pageSize;
        setProducts(results.slice(startIndex, startIndex + pageSize));
      } else {
        setAllProductsCache(null);
        setProducts(results);
      }
      
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total,
      }));
    } catch (error) {
      message.error('Ошибка загрузки продуктов');
      console.error('Error loading products:', error);
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
    } catch (error) {
      message.error('Ошибка удаления продукта');
      console.error('Error deleting product:', error);
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/products/${record.id}`)}>{text}</a>
      ),
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
      render: (price, record) => (
        <span>
          {Number(price || 0).toLocaleString('ru-RU')} {record.currency_name || '₽'}
        </span>
      ),
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Tag color={type === 'S' ? 'blue' : 'green'}>
          {type === 'S' ? 'Услуга' : type === 'G' ? 'Товар' : '-'}
        </Tag>
      ),
    },
    {
      title: 'В продаже',
      dataIndex: 'on_sale',
      key: 'on_sale',
      width: 120,
      render: (onSale) => (
        <Tag color={onSale ? 'green' : 'default'}>
          {onSale ? 'Да' : 'Нет'}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/products/${record.id}/edit`)}
          />
          <Popconfirm
            title="Удалить продукт?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>Каталог продуктов</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/products/new')}
        >
          Добавить продукт
        </Button>
      </div>

      <Card>
        <Space style={{ marginBottom: 16, width: '100%' }} direction="vertical" size="middle">
          <Space wrap>
            <Search
              placeholder="Поиск по названию"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
            <Select
              placeholder="Все категории"
              style={{ width: 200 }}
              allowClear
              onChange={handleCategoryChange}
              value={selectedCategory}
            >
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
            <Button onClick={() => loadProducts(1)}>Обновить</Button>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  );
}

export default ProductsList;
