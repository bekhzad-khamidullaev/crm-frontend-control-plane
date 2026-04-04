import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('antd', () => {
  const Button = ({ children, onClick, disabled }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
  const Alert = ({ message, action, description }) => (
    <div>
      <div>{message}</div>
      <div>{description}</div>
      {action}
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
  const Progress = ({ percent }) => <div>{percent}</div>;
  const Row = ({ children }) => <div>{children}</div>;
  const Segmented = ({ options = [], value, onChange }) => (
    <select aria-label="Breakdown Mode" value={value} onChange={(event) => onChange?.(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
  const Space = ({ children }) => <div>{children}</div>;
  const Table = ({ dataSource = [], columns = [], rowKey }) => (
    <div>
      {dataSource.map((row, index) => (
        <div key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey] || index}>
          {columns.map((column) => (
            <div key={column.key || column.dataIndex || column.title}>
              {column.render
                ? column.render(row[column.dataIndex], row)
                : row[column.dataIndex]}
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

  return { Alert, Button, Card, Col, Empty, Progress, Row, Segmented, Space, Table, Tag, Typography };
});

vi.mock('../../src/shared/ui', () => ({
  KpiStatCard: ({ title, value }) => (
    <div>
      <span>{title}</span>
      <span>{value}</span>
    </div>
  ),
}));

import LicenseOperationsPanel from '../../src/components/license-operations-panel/LicenseOperationsPanel';

describe('LicenseOperationsPanel', () => {
  it('opens audit drill-down with feature and endpoint filters', () => {
    const onOpenAudit = vi.fn();

    render(
      <LicenseOperationsPanel
        onOpenAudit={onOpenAudit}
        summary={{
          window_hours: 24,
          generated_at: '2026-04-03T12:00:00Z',
          totals: {
            total_denials: 5,
            unique_codes: 2,
            unique_features: 2,
            unique_correlations: 3,
          },
          alerts: [
            {
              code: 'feature_deny_spike',
              severity: 'warning',
              title: 'Feature hotspot detected',
              description: 'One feature is responsible for the majority of runtime denials.',
              feature: 'crm.leads',
              related_code: 'LICENSE_FEATURE_DISABLED',
            },
          ],
          by_code: [{ code: 'LICENSE_FEATURE_DISABLED', count: 4 }],
          by_feature: [
            { feature: 'crm.leads', count: 4, top_code: 'LICENSE_FEATURE_DISABLED' },
          ],
          by_endpoint: [
            {
              path: '/api/leads/',
              method: 'GET',
              count: 4,
              top_code: 'LICENSE_FEATURE_DISABLED',
            },
          ],
          by_surface: [
            { surface_type: 'http', count: 4, top_code: 'LICENSE_FEATURE_DISABLED' },
            { surface_type: 'task', count: 2, top_code: 'LICENSE_FEATURE_DISABLED' },
          ],
          by_runtime_surface: [
            {
              surface_type: 'task',
              surface_name: 'send_sms_task',
              count: 2,
              top_code: 'LICENSE_FEATURE_DISABLED',
            },
          ],
          trend: [
            {
              bucket_start: '2026-04-03T11:00:00Z',
              total: 4,
              top_code: 'LICENSE_FEATURE_DISABLED',
            },
          ],
        }}
      />
    );

    fireEvent.click(screen.getByText('Open audit'));
    expect(onOpenAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'deny',
        code: 'LICENSE_FEATURE_DISABLED',
        feature: 'crm.leads',
      })
    );

    const auditButtons = screen.getAllByText('Audit');
    fireEvent.click(auditButtons[auditButtons.length - 1]);
    expect(onOpenAudit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'deny',
        code: 'LICENSE_FEATURE_DISABLED',
        path: '/api/leads/',
        method: 'GET',
        surfaceType: 'http',
        surfaceName: '/api/leads/',
      })
    );

    fireEvent.change(screen.getByLabelText('Breakdown Mode'), {
      target: { value: 'runtime_surface' },
    });
    fireEvent.click(screen.getAllByText('Audit').at(-1));
    expect(onOpenAudit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'deny',
        code: 'LICENSE_FEATURE_DISABLED',
        surfaceType: 'task',
        surfaceName: 'send_sms_task',
      })
    );
  });
});
