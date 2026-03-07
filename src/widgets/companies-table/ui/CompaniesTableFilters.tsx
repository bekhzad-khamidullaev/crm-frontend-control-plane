import React from 'react';
import { Form } from 'antd';
import { IndustrySelect } from '@/features/reference';
import { ClientTypeSelect } from '@/features/reference';
import { useDebounce } from '@/shared/hooks';
import { compactFilterChips, EntityListToolbar } from '@/shared/ui';

export interface CompaniesTableFiltersProps {
  filters?: Record<string, unknown>;
  onFilterChange: (filters: Record<string, unknown>) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const CompaniesTableFilters: React.FC<CompaniesTableFiltersProps> = ({
  filters,
  onFilterChange,
  onRefresh,
  loading,
}) => {
  const [form] = Form.useForm();
  const lastPayloadRef = React.useRef('');
  const searchValue = Form.useWatch('search', form) || '';
  const debouncedSearch = useDebounce(searchValue, 400);

  React.useEffect(() => {
    form.setFieldsValue({
      search: filters?.search ?? '',
      industry: filters?.industry,
      type: filters?.type,
    });
  }, [filters, form]);

  // Debounce search input
  const handleValuesChange = (changedValues: any, allValues: any) => {
    // If search changed, don't trigger immediately (handled by search input)
    // If select changed, trigger filter

    if ('industry' in changedValues || 'type' in changedValues) {
      onFilterChange(allValues);
    }
  };

  React.useEffect(() => {
    const values = form.getFieldsValue();
    const nextSearch = String(debouncedSearch || '').trim();
    const payload = { ...values, search: nextSearch || undefined };
    const signature = JSON.stringify(payload);
    if (signature === lastPayloadRef.current) return;
    lastPayloadRef.current = signature;
    onFilterChange(payload);
  }, [debouncedSearch, form, onFilterChange]);

  const handleReset = () => {
    form.resetFields();
    onFilterChange({});
  };

  const activeFilters = compactFilterChips([
    filters?.search
      ? {
          key: 'search',
          label: 'Поиск',
          value: String(filters.search),
          onClear: () => onFilterChange({ ...filters, search: undefined }),
        }
      : null,
    filters?.industry
      ? {
          key: 'industry',
          label: 'Индустрия',
          onClear: () => onFilterChange({ ...filters, industry: undefined }),
        }
      : null,
    filters?.type
      ? {
          key: 'type',
          label: 'Тип клиента',
          onClear: () => onFilterChange({ ...filters, type: undefined }),
        }
      : null,
  ]);

  return (
    <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
      <EntityListToolbar
        searchValue={searchValue}
        searchPlaceholder="По названию, email, телефону..."
        onSearchChange={(value) => form.setFieldValue('search', value)}
        onReset={handleReset}
        onRefresh={onRefresh}
        activeFilters={activeFilters}
        loading={loading}
        filters={
          <>
            <Form.Item name="industry" style={{ marginBottom: 0, minWidth: 220 }}>
              <IndustrySelect placeholder="Индустрия" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="type" style={{ marginBottom: 0, minWidth: 220 }}>
              <ClientTypeSelect placeholder="Тип клиента" style={{ width: '100%' }} />
            </Form.Item>
          </>
        }
      />
    </Form>
  );
};
