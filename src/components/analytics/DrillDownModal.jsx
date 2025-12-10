import React, { useState, useEffect } from 'react';
import { Modal, Table, Tag, Spin, Empty, Typography, Space, Button } from 'antd';
import { CloseOutlined, FilterOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * DrillDownModal - модальное окно для детального просмотра данных при клике на сегмент графика
 * 
 * @param {boolean} visible - показывать модалку
 * @param {Function} onClose - callback закрытия
 * @param {string} title - заголовок модалки
 * @param {Array} data - данные для отображения
 * @param {Array} columns - колонки таблицы
 * @param {string} segmentLabel - название выбранного сегмента
 * @param {Object} filters - примененные фильтры
 * @param {Function} onItemClick - callback при клике на элемент
 * @param {boolean} loading - состояние загрузки
 */
function DrillDownModal({
  visible,
  onClose,
  title = 'Детальная информация',
  data = [],
  columns = [],
  segmentLabel,
  filters = {},
  onItemClick,
  loading = false,
}) {
  const [localData, setLocalData] = useState(data);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: data.length,
  });

  useEffect(() => {
    setLocalData(data);
    setPagination(prev => ({ ...prev, total: data.length }));
  }, [data]);

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const handleRowClick = (record) => {
    if (onItemClick) {
      onItemClick(record);
    }
  };

  const getFilterTags = () => {
    return Object.entries(filters)
      .filter(([key, value]) => value)
      .map(([key, value]) => (
        <Tag key={key} color="blue">
          {key}: {value}
        </Tag>
      ));
  };

  return (
    <Modal
      title={
        <Space direction="vertical" size={4}>
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
          {segmentLabel && (
            <Text type="secondary" style={{ fontSize: 14 }}>
              Фильтр: <Tag color="blue">{segmentLabel}</Tag>
            </Text>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} icon={<CloseOutlined />}>
          Закрыть
        </Button>
      ]}
      width={900}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
    >
      {/* Активные фильтры */}
      {Object.keys(filters).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <FilterOutlined />
            <Text strong>Активные фильтры:</Text>
            {getFilterTags()}
          </Space>
        </div>
      )}

      {/* Статистика */}
      <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
        <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
          <Text>
            <strong>Всего записей:</strong> {data.length}
          </Text>
          <Text>
            <strong>Показано:</strong> {Math.min(pagination.pageSize, data.length)}
          </Text>
        </Space>
      </div>

      {/* Таблица данных */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" tip="Загрузка данных..." />
        </div>
      ) : data.length === 0 ? (
        <Empty description="Нет данных для отображения" />
      ) : (
        <Table
          columns={columns}
          dataSource={localData}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: onItemClick ? 'pointer' : 'default' },
          })}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      )}
    </Modal>
  );
}

export default DrillDownModal;
