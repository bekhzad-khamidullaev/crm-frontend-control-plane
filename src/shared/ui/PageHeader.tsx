/**
 * PageHeader component - standardized page header with breadcrumbs and actions
 * Used at the top of all pages for consistent navigation
 */

import React from 'react';
import { Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { title: string; href?: string }[];
  extra?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  extra,
  children,
}) => {
  return (
    <div className="page-header" style={{ marginBottom: 24 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item href="/#/dashboard">
            <HomeOutlined />
          </Breadcrumb.Item>
          {breadcrumbs.map((item, index) => (
            <Breadcrumb.Item key={index} href={item.href}>
              {item.title}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{title}</h1>
          {subtitle && (
            <div style={{ color: '#666', marginTop: 4 }}>{subtitle}</div>
          )}
        </div>
        {extra && <div>{extra}</div>}
      </div>

      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
};
