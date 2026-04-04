import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('antd', () => {
  const Input = ({ placeholder, defaultValue, onChange, allowClear, ...props }) => (
    <input
      aria-label={placeholder}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={onChange}
      {...props}
    />
  );
  Input.Search = ({ placeholder, defaultValue, onSearch, allowClear, ...props }) => (
    <input
      aria-label={placeholder}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onSearch?.(event.currentTarget.value);
        }
      }}
      onChange={props.onChange}
      {...props}
    />
  );

  const Select = ({ value, options = [], onChange, style, 'aria-label': ariaLabel }) => (
    <select
      aria-label={ariaLabel || (style?.width === 180 ? 'Action Filter' : style?.width === 260 ? 'Code Filter' : 'Method Filter')}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  const Space = ({ children }) => <div>{children}</div>;
  const Table = () => <div data-testid="audit-table" />;
  const Tag = ({ children }) => <span>{children}</span>;
  const Typography = {
    Text: ({ children }) => <span>{children}</span>,
  };
  const message = { error: vi.fn() };

  return { Input, Select, Space, Table, Tag, Typography, message };
});

vi.mock('../../src/lib/api/licenseControl.js', () => ({
  getCpLicenseAudit: vi.fn(),
}));

import AuditSection from '../../src/pages/control-plane-admin/sections/AuditSection.jsx';
import { getCpLicenseAudit } from '../../src/lib/api/licenseControl.js';

describe('AuditSection filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCpLicenseAudit.mockResolvedValue({ count: 0, results: [] });
  });

  it('passes action, code, correlation id, and surface filters to the audit api', async () => {
    render(<AuditSection />);

    await waitFor(() => {
      expect(getCpLicenseAudit).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText('Action Filter'), { target: { value: 'deny' } });

    await waitFor(() => {
      expect(getCpLicenseAudit).toHaveBeenLastCalledWith(
        expect.objectContaining({ action: 'deny' }),
      );
    });

    fireEvent.change(screen.getByLabelText('Code Filter'), {
      target: { value: 'LICENSE_FEATURE_DISABLED' },
    });

    await waitFor(() => {
      expect(getCpLicenseAudit).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: 'deny',
          code: 'LICENSE_FEATURE_DISABLED',
        }),
      );
    });

    const correlationSearch = screen.getByPlaceholderText('Correlation ID');
    fireEvent.change(correlationSearch, { target: { value: 'corr-audit-1' } });
    fireEvent.keyDown(correlationSearch, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(getCpLicenseAudit).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: 'deny',
          code: 'LICENSE_FEATURE_DISABLED',
          correlation_id: 'corr-audit-1',
        }),
      );
    });

    fireEvent.change(screen.getByLabelText('Surface Type Filter'), {
      target: { value: 'task' },
    });

    await waitFor(() => {
      expect(getCpLicenseAudit).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: 'deny',
          code: 'LICENSE_FEATURE_DISABLED',
          correlation_id: 'corr-audit-1',
          surface_type: 'task',
        }),
      );
    });

    const surfaceNameSearch = screen.getByPlaceholderText('Surface name');
    fireEvent.change(surfaceNameSearch, { target: { value: 'send_sms_task' } });
    fireEvent.keyDown(surfaceNameSearch, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(getCpLicenseAudit).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: 'deny',
          code: 'LICENSE_FEATURE_DISABLED',
          correlation_id: 'corr-audit-1',
          surface_type: 'task',
          surface_name: 'send_sms_task',
        }),
      );
    });
  });

  it('applies preset drill-down filters from operations panel', async () => {
    const { rerender } = render(<AuditSection />);

    await waitFor(() => {
      expect(getCpLicenseAudit).toHaveBeenCalledTimes(1);
    });

    rerender(
      <AuditSection
        presetFilters={{
          action: 'deny',
          code: 'LICENSE_FEATURE_DISABLED',
          correlationId: 'corr-audit-drill-1',
          feature: 'crm.leads',
          path: '/api/leads/',
          method: 'GET',
          surfaceType: 'http',
          surfaceName: '/api/leads/',
          token: 1,
        }}
      />
    );

    await waitFor(() => {
      expect(getCpLicenseAudit).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: 'deny',
          code: 'LICENSE_FEATURE_DISABLED',
          correlation_id: 'corr-audit-drill-1',
          feature: 'crm.leads',
          path: '/api/leads/',
          method: 'GET',
          surface_type: 'http',
          surface_name: '/api/leads/',
        }),
      );
    });
  });
});
