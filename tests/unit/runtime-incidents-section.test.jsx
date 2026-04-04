import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('antd', () => {
  const Alert = ({ message, description }) => (
    <div>
      <div>{message}</div>
      <div>{description}</div>
    </div>
  );
  const Button = ({ children, onClick, disabled, loading }) => (
    <button type="button" onClick={onClick} disabled={disabled || loading}>
      {children}
    </button>
  );
  const Input = ({ placeholder, defaultValue, onChange, ...props }) => (
    <input
      aria-label={placeholder}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={onChange}
      {...props}
    />
  );
  Input.Search = ({ placeholder, defaultValue, onSearch, onChange, ...props }) => (
    <input
      aria-label={placeholder}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={onChange}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onSearch?.(event.currentTarget.value);
        }
      }}
      {...props}
    />
  );
  const Select = ({ value, options = [], onChange, 'aria-label': ariaLabel }) => (
    <select aria-label={ariaLabel} value={value} onChange={(event) => onChange?.(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
  const Space = ({ children }) => <div>{children}</div>;
  const Table = () => <div data-testid="runtime-incidents-table" />;
  const Tag = ({ children }) => <span>{children}</span>;
  const Typography = {
    Text: ({ children }) => <span>{children}</span>,
  };
  const message = { error: vi.fn() };
  message.success = vi.fn();
  message.warning = vi.fn();

  return { Alert, Button, Input, Select, Space, Table, Tag, Typography, message };
});

vi.mock('../../src/lib/api/licenseControl.js', () => ({
  getLicenseIncidents: vi.fn(),
  getLicenseObservabilityExport: vi.fn(),
}));

vi.mock('../../src/lib/utils/export.js', () => ({
  exportToCSV: vi.fn(),
  generateFilename: vi.fn((prefix, extension) => `${prefix}.${extension}`),
}));

import RuntimeIncidentsSection from '../../src/pages/control-plane-admin/sections/RuntimeIncidentsSection.jsx';
import { getLicenseIncidents, getLicenseObservabilityExport } from '../../src/lib/api/licenseControl.js';
import { exportToCSV } from '../../src/lib/utils/export.js';

describe('RuntimeIncidentsSection filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLicenseIncidents.mockResolvedValue({ count: 0, results: [] });
    getLicenseObservabilityExport.mockResolvedValue({ metrics: {}, trace_exemplars: [] });
    global.URL.createObjectURL = vi.fn(() => 'blob:runtime');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('passes window, code, correlation id, and surface filters to the runtime incidents api', async () => {
    render(<RuntimeIncidentsSection />);

    await waitFor(() => {
      expect(getLicenseIncidents).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText('Window Filter'), { target: { value: '72' } });

    await waitFor(() => {
      expect(getLicenseIncidents).toHaveBeenLastCalledWith(
        expect.objectContaining({ hours: '72' })
      );
    });

    fireEvent.change(screen.getByLabelText('Incident Code Filter'), {
      target: { value: 'LICENSE_FEATURE_DISABLED' },
    });

    await waitFor(() => {
      expect(getLicenseIncidents).toHaveBeenLastCalledWith(
        expect.objectContaining({
          hours: '72',
          code: 'LICENSE_FEATURE_DISABLED',
        })
      );
    });

    const correlationSearch = screen.getByPlaceholderText('Correlation ID');
    fireEvent.change(correlationSearch, { target: { value: 'corr-runtime-1' } });
    fireEvent.keyDown(correlationSearch, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(getLicenseIncidents).toHaveBeenLastCalledWith(
        expect.objectContaining({
          hours: '72',
          code: 'LICENSE_FEATURE_DISABLED',
          correlation_id: 'corr-runtime-1',
        })
      );
    });

    fireEvent.change(screen.getByLabelText('Incident Surface Type Filter'), {
      target: { value: 'task' },
    });

    await waitFor(() => {
      expect(getLicenseIncidents).toHaveBeenLastCalledWith(
        expect.objectContaining({
          hours: '72',
          code: 'LICENSE_FEATURE_DISABLED',
          correlation_id: 'corr-runtime-1',
          surface_type: 'task',
        })
      );
    });

    const surfaceNameSearch = screen.getByPlaceholderText('Surface name');
    fireEvent.change(surfaceNameSearch, { target: { value: 'send_sms_task' } });
    fireEvent.keyDown(surfaceNameSearch, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(getLicenseIncidents).toHaveBeenLastCalledWith(
        expect.objectContaining({
          hours: '72',
          code: 'LICENSE_FEATURE_DISABLED',
          correlation_id: 'corr-runtime-1',
          surface_type: 'task',
          surface_name: 'send_sms_task',
        })
      );
    });
  });

  it('applies preset drill-down filters from operations panel', async () => {
    const { rerender } = render(<RuntimeIncidentsSection />);

    await waitFor(() => {
      expect(getLicenseIncidents).toHaveBeenCalledTimes(1);
    });

    rerender(
      <RuntimeIncidentsSection
        presetFilters={{
          windowHours: 24,
          code: 'LICENSE_FEATURE_DISABLED',
          correlationId: 'corr-runtime-drill-1',
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
      expect(getLicenseIncidents).toHaveBeenLastCalledWith(
        expect.objectContaining({
          hours: '24',
          code: 'LICENSE_FEATURE_DISABLED',
          correlation_id: 'corr-runtime-drill-1',
          feature: 'crm.leads',
          path: '/api/leads/',
          method: 'GET',
          surface_type: 'http',
          surface_name: '/api/leads/',
        })
      );
    });
  });

  it('exports csv and backend observability payloads', async () => {
    getLicenseIncidents.mockResolvedValue({
      count: 1,
      results: [
        {
          id: 1,
          created_at: '2026-04-03T10:00:00Z',
          event_type: 'license_denied',
          severity: 'error',
          code: 'LICENSE_FEATURE_DISABLED',
          correlation_id: 'corr-export-ui-1',
          feature: 'crm.leads',
          surface_type: 'http',
          surface_name: '/api/leads/',
          method: 'GET',
          path: '/api/leads/',
          message: 'Lead denied',
        },
      ],
    });
    getLicenseObservabilityExport
      .mockResolvedValueOnce({ metrics: { total_denials: 1 }, trace_exemplars: [] })
      .mockResolvedValueOnce('crm_license_total_denials 1\n');

    render(<RuntimeIncidentsSection />);
    const originalCreateElement = document.createElement.bind(document);
    const anchor = { click: vi.fn() };
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      if (String(tagName).toLowerCase() === 'a') {
        return anchor;
      }
      return originalCreateElement(tagName, options);
    });

    await waitFor(() => {
      expect(getLicenseIncidents).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByText('Export CSV'));
    expect(exportToCSV).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ code: 'LICENSE_FEATURE_DISABLED' }),
      ]),
      expect.any(Array),
      'license_runtime_incidents.csv'
    );

    fireEvent.click(screen.getByText('Export JSON'));
    await waitFor(() => {
      expect(getLicenseObservabilityExport).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ hours: '24', export_format: 'json' })
      );
    });

    fireEvent.click(screen.getByText('Export metrics'));
    await waitFor(() => {
      expect(getLicenseObservabilityExport).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ hours: '24', export_format: 'prometheus' }),
        'text'
      );
    });
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
