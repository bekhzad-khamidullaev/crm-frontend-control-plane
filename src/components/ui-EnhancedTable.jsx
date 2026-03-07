/**
 * EnhancedTable - Wrapper around Ant Design Table
 * Provides additional features and consistent API
 */

import React from 'react';
import { Table, Empty } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

export default function EnhancedTable({
  columns = [],
  dataSource = [],
  loading = false,
  pagination = true,
  onChange,
  rowKey = 'id',
  rowSelection,
  expandable,
  scroll,
  size = 'small',
  bordered = false,
  showHeader = true,
  sticky = false,
  emptyText = 'Нет данных',
  emptyDescription = 'Создайте первую запись',
  showTotal = false,
  showSizeChanger = false,
  showQuickJumper = false,
  locale,
  ...rest
}) {
  const emptyLocale = {
    emptyText: (
      <Empty
        image={<InboxOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />}
        description={
          <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 15, color: '#18181b' }}>
              {emptyText}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: '#71717a', maxWidth: 320, margin: '0 auto' }}>
              {emptyDescription}
            </div>
          </div>
        }
      />
    ),
  };

  // Enhanced pagination with showTotal, showSizeChanger, showQuickJumper
  const enhancedPagination = React.useMemo(() => {
    if (pagination === false || pagination === null) {
      return false;
    }
    
    const paginationObj = typeof pagination === 'object' ? pagination : {};
    
    // Calculate the actual maximum page number to prevent showing non-existent pages
    let maxPage = 1;
    if (paginationObj.total && paginationObj.pageSize) {
      maxPage = Math.ceil(paginationObj.total / paginationObj.pageSize);
    }
    
    // Ensure current page doesn't exceed max page
    const safeCurrent = paginationObj.current ? Math.min(paginationObj.current, maxPage) : 1;
    
    return {
      ...paginationObj,
      current: safeCurrent,
      showTotal: showTotal ? (total, range) => `${range[0]}-${range[1]} из ${total}` : undefined,
      showSizeChanger: showSizeChanger,
      showQuickJumper: showQuickJumper,
      pageSizeOptions: ['10', '20', '50', '100'],
      hideOnSinglePage: true,
    };
  }, [pagination, showTotal, showSizeChanger, showQuickJumper]);

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      pagination={enhancedPagination}
      onChange={onChange}
      rowKey={rowKey}
      rowSelection={rowSelection}
      expandable={expandable}
      scroll={scroll}
      size={size}
      bordered={bordered}
      showHeader={showHeader}
      sticky={sticky}
      locale={locale || emptyLocale}
      style={{ borderRadius: 16, overflow: 'hidden' }}
      {...rest}
    />
  );
}
