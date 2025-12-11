import React, { useState } from 'react';
import { Table, Empty, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * EnhancedTable - Универсальный компонент таблицы с расширенными возможностями
 * @param {Object} props
 * @param {Array} props.columns - Колонки таблицы
 * @param {Array} props.dataSource - Данные для отображения
 * @param {boolean} props.loading - Состояние загрузки
 * @param {Object} props.pagination - Конфигурация пагинации
 * @param {Function} props.onChange - Callback для изменения таблицы (пагинация, сортировка, фильтры)
 * @param {Object|boolean} props.rowSelection - Конфигурация выбора строк
 * @param {Function} props.onRow - Callback для событий строки
 * @param {string} props.rowKey - Ключ для идентификации строк
 * @param {Object} props.scroll - Конфигурация прокрутки
 * @param {string} props.size - Размер таблицы ('small' | 'middle' | 'large')
 * @param {boolean} props.bordered - Отображать границы
 * @param {string} props.emptyText - Текст для пустой таблицы
 * @param {React.ReactNode} props.emptyDescription - Описание для пустой таблицы
 * @param {boolean} props.showTotal - Показывать общее количество записей
 * @param {boolean} props.showSizeChanger - Показывать переключатель размера страницы
 * @param {boolean} props.showQuickJumper - Показывать быструю навигацию
 * @param {Array} props.pageSizeOptions - Опции размера страницы
 * @param {Function} props.rowClassName - Функция для добавления className к строке
 * @param {Object} props.expandable - Конфигурация для раскрывающихся строк
 * @param {React.ReactNode} props.title - Заголовок таблицы
 * @param {React.ReactNode} props.footer - Футер таблицы
 * @param {boolean} props.sticky - Фиксированный header
 * @param {Object} props.summary - Summary row конфигурация
 */
export default function EnhancedTable({
  columns = [],
  dataSource = [],
  loading = false,
  pagination = {},
  onChange,
  rowSelection,
  onRow,
  rowKey = 'id',
  scroll = { x: 'max-content' },
  size = 'middle',
  bordered = false,
  emptyText = 'Нет данных',
  emptyDescription = 'Попробуйте изменить параметры поиска или создать новую запись',
  showTotal = true,
  showSizeChanger = true,
  showQuickJumper = true,
  pageSizeOptions = ['10', '20', '50', '100'],
  rowClassName,
  expandable,
  title,
  footer,
  sticky = false,
  summary,
  ...restProps
}) {
  // Конфигурация пагинации по умолчанию
  const defaultPagination = {
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger,
    showQuickJumper,
    pageSizeOptions,
    showTotal: showTotal
      ? (total, range) => (
          <Text type="secondary">
            Показаны {range[0]}-{range[1]} из {total}
          </Text>
        )
      : undefined,
    position: ['bottomCenter'],
    ...pagination,
  };

  // Отключить пагинацию если явно передан false
  const finalPagination = pagination === false ? false : defaultPagination;

  // Custom empty state
  const emptyState = (
    <Empty
      image={<InboxOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />}
      description={
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            {emptyText}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {emptyDescription}
          </Text>
        </div>
      }
    />
  );

  // Обработка изменений таблицы
  const handleTableChange = (newPagination, filters, sorter, extra) => {
    if (onChange) {
      onChange(newPagination, filters, sorter, extra);
    }
  };

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey={rowKey}
      loading={loading}
      pagination={finalPagination}
      onChange={handleTableChange}
      rowSelection={rowSelection}
      onRow={onRow}
      scroll={scroll}
      size={size}
      bordered={bordered}
      locale={{ emptyText: emptyState }}
      rowClassName={rowClassName}
      expandable={expandable}
      title={title}
      footer={footer}
      sticky={sticky}
      summary={summary}
      {...restProps}
    />
  );
}

/**
 * Утилита для создания колонки с быстрыми действиями
 * @param {Object} config
 * @param {React.Component} config.component - Компонент для отображения (например, QuickActions)
 * @param {number} config.width - Ширина колонки
 * @param {boolean} config.fixed - Фиксированная колонка
 */
export function createActionsColumn(config = {}) {
  const {
    component: ActionsComponent,
    width = 80,
    fixed = 'right',
    ...restConfig
  } = config;

  return {
    title: 'Действия',
    key: 'actions',
    width,
    fixed,
    align: 'center',
    render: (_, record) => ActionsComponent ? <ActionsComponent record={record} /> : null,
    ...restConfig,
  };
}

/**
 * Утилита для создания колонки с тегами
 * @param {Object} config
 */
export function createTagColumn(config = {}) {
  const { dataIndex, title, colors = {}, ...restConfig } = config;

  return {
    title,
    dataIndex,
    key: dataIndex,
    render: (value) => {
      if (!value) return '-';
      const { Tag } = require('antd');
      const color = colors[value] || 'default';
      return <Tag color={color}>{value}</Tag>;
    },
    ...restConfig,
  };
}

/**
 * Утилита для создания колонки с аватаром и именем
 * @param {Object} config
 */
export function createAvatarColumn(config = {}) {
  const {
    dataIndex,
    title,
    nameKey = 'name',
    avatarKey = 'avatar',
    ...restConfig
  } = config;

  return {
    title,
    dataIndex,
    key: dataIndex || nameKey,
    render: (_, record) => {
      const { Avatar, Space } = require('antd');
      const { UserOutlined } = require('@ant-design/icons');
      const name = record[nameKey];
      const avatar = record[avatarKey];

      return (
        <Space>
          <Avatar src={avatar} icon={!avatar && <UserOutlined />} size="small" />
          <span>{name || '-'}</span>
        </Space>
      );
    },
    ...restConfig,
  };
}

/**
 * Утилита для создания колонки с датой
 * @param {Object} config
 */
export function createDateColumn(config = {}) {
  const { dataIndex, title, format = 'DD.MM.YYYY HH:mm', ...restConfig } = config;
  
  return {
    title,
    dataIndex,
    key: dataIndex,
    render: (value) => {
      if (!value) return '-';
      const dayjs = require('dayjs');
      return dayjs(value).format(format);
    },
    ...restConfig,
  };
}
