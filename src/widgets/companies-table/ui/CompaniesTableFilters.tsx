import React from 'react';
import { Form } from 'antd';
import { IndustrySelect } from '@/features/reference';
import { ClientTypeSelect } from '@/features/reference';
import { useDebounce } from '@/shared/hooks';
import { Button, Card, Col, Flex, Input, Row, Space, Tag, theme } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';

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
  const { token } = theme.useToken();

  React.useEffect(() => {
    form.setFieldsValue({
      search: filters?.search ?? '',
      industry: filters?.industry,
      type: filters?.type,
    });
  }, [filters, form]);

  const handleValuesChange = (changedValues: any, allValues: any) => {
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
    lastPayloadRef.current = '';
    onFilterChange({});
  };

  const surfaceStyle: React.CSSProperties = {
    marginBottom: 16,
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgElevated,
    boxShadow: token.boxShadowTertiary,
  };
  const chipStyle: React.CSSProperties = {
    marginInlineEnd: 0,
    borderRadius: token.borderRadiusSM,
    borderColor: token.colorBorderSecondary,
    background: token.colorFillQuaternary,
    color: token.colorTextSecondary,
  };

  return (
    <Card
      variant="borderless"
      style={surfaceStyle}
      styles={{
        body: {
          padding: 16,
        },
      }}
    >
      <Flex vertical gap={12}>
        <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={10} lg={8}>
              <Input
                value={searchValue}
                allowClear
                placeholder="По названию, email, телефону..."
                prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
                onChange={(event) => form.setFieldValue('search', event.target.value)}
              />
            </Col>
            <Col xs={24} md={7} lg={6}>
              <Form.Item name="industry" style={{ marginBottom: 0 }}>
                <IndustrySelect placeholder="Индустрия" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={7} lg={6}>
              <Form.Item name="type" style={{ marginBottom: 0 }}>
                <ClientTypeSelect placeholder="Тип клиента" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={4}>
              <Space wrap>
                <Button onClick={handleReset}>Сбросить</Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={onRefresh}
                  loading={loading}
                  aria-label="Обновить список"
                />
              </Space>
            </Col>
          </Row>
        </Form>

        <Space size={[8, 8]} wrap>
          {String(filters?.search || '').trim() ? (
            <Tag
              closable
              style={chipStyle}
              onClose={() => {
                form.setFieldValue('search', '');
                onFilterChange({ ...filters, search: undefined });
              }}
            >
              Поиск: {String(filters?.search)}
            </Tag>
          ) : null}
          {filters?.industry ? (
            <Tag
              closable
              style={chipStyle}
              onClose={() => onFilterChange({ ...filters, industry: undefined })}
            >
              Индустрия
            </Tag>
          ) : null}
          {filters?.type ? (
            <Tag
              closable
              style={chipStyle}
              onClose={() => onFilterChange({ ...filters, type: undefined })}
            >
              Тип клиента
            </Tag>
          ) : null}
        </Space>
      </Flex>
    </Card>
  );
};
