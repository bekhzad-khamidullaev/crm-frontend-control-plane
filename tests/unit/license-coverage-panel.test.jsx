import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('antd', () => {
  const Alert = ({ message, description }) => (
    <div>
      <div>{message}</div>
      <div>{description}</div>
    </div>
  );
  const Card = ({ title, children, extra }) => (
    <section>
      <h2>{title}</h2>
      {extra}
      {children}
    </section>
  );
  const Col = ({ children }) => <div>{children}</div>;
  const Empty = ({ description }) => <div>{description}</div>;
  Empty.PRESENTED_IMAGE_SIMPLE = null;
  const Row = ({ children }) => <div>{children}</div>;
  const Space = ({ children }) => <div>{children}</div>;
  const Table = ({ dataSource = [], columns = [], rowKey }) => (
    <div>
      {dataSource.map((row, index) => (
        <div key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey] || index}>
          {columns.map((column) => (
            <div key={column.key || column.dataIndex || column.title}>
              {column.render ? column.render(row[column.dataIndex], row) : row[column.dataIndex]}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
  const Tag = ({ children }) => <span>{children}</span>;
  const Typography = {
    Text: ({ children }) => <span>{children}</span>,
  };

  return { Alert, Card, Col, Empty, Row, Space, Table, Tag, Typography };
});

vi.mock('../../src/shared/ui', () => ({
  KpiStatCard: ({ title, value }) => (
    <div>
      <span>{title}</span>
      <span>{value}</span>
    </div>
  ),
}));

import LicenseCoveragePanel from '../../src/components/license-coverage-panel/LicenseCoveragePanel';

describe('LicenseCoveragePanel', () => {
  it('renders healthy coverage summary', () => {
    render(
      <LicenseCoveragePanel
        summary={{
          generated_at: '2026-04-03T12:00:00Z',
          totals: {
            total: 82,
            covered: 81,
            exempt: 1,
            missing_permission: 0,
            missing_feature: 0,
            mismatched_feature: 0,
          },
          entries: [
            {
              basename: 'user',
              prefix: 'users',
              viewset: 'UserViewSet',
              status: 'covered',
              feature: 'users.core',
              middleware_feature: 'users.core',
            },
          ],
        }}
      />
    );

    expect(screen.getByText('License coverage health')).toBeInTheDocument();
    expect(screen.getByText('All authenticated router endpoints are explicitly covered')).toBeInTheDocument();
    expect(screen.getByText('Router endpoints')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
  });

  it('renders drift table when uncovered endpoints exist', () => {
    render(
      <LicenseCoveragePanel
        summary={{
          totals: {
            total: 82,
            covered: 79,
            exempt: 1,
            missing_permission: 1,
            missing_feature: 0,
            mismatched_feature: 1,
          },
          entries: [
            {
              basename: 'api-keys',
              prefix: 'settings/api-keys',
              viewset: 'APIKeyViewSet',
              status: 'missing_permission',
              feature: 'integrations.core',
              middleware_feature: 'integrations.core',
              reason: 'LicenseFeaturePermission is not configured on the viewset.',
            },
          ],
        }}
      />
    );

    expect(screen.getByText('Router license coverage drift detected')).toBeInTheDocument();
    expect(screen.getByText('api-keys')).toBeInTheDocument();
    expect(screen.getByText('missing_permission')).toBeInTheDocument();
    expect(screen.getAllByText('integrations.core').length).toBeGreaterThan(0);
  });
});
