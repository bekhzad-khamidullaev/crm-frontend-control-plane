import React from 'react';
import { Form, Input, Card, Row, Col, Button } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { IndustrySelect } from '@/features/reference';
import { ClientTypeSelect } from '@/features/reference';
// import { useDebounce } from '@/shared/hooks';

export interface CompaniesTableFiltersProps {
  onFilterChange: (filters: Record<string, unknown>) => void;
  loading?: boolean;
}

export const CompaniesTableFilters: React.FC<CompaniesTableFiltersProps> = ({
  onFilterChange,
  loading,
}) => {
  const [form] = Form.useForm();

  // Debounce search input
  const handleValuesChange = (changedValues: any, allValues: any) => {
    // If search changed, don't trigger immediately (handled by search input)
    // If select changed, trigger filter

    if ('industry' in changedValues || 'type' in changedValues) {
      onFilterChange(allValues);
    }
  };

  const handleSearch = (value: string) => {
    const values = form.getFieldsValue();
    onFilterChange({ ...values, search: value });
  };

  const handleReset = () => {
    form.resetFields();
    onFilterChange({});
  };

  return (
    <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px 24px' }}>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={24} md={8} lg={8} xl={6}>
            <Form.Item name="search" label="Поиск" style={{ marginBottom: 0 }}>
              <Input.Search
                placeholder="По названию, email, телефону..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6} lg={5} xl={4}>
            <Form.Item name="industry" label="Индустрия" style={{ marginBottom: 0 }}>
              <IndustrySelect style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6} lg={5} xl={4}>
            <Form.Item name="type" label="Тип клиента" style={{ marginBottom: 0 }}>
              <ClientTypeSelect style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={24} md={4} lg={6} xl={10} style={{ textAlign: 'right' }}>
            <Button icon={<ClearOutlined />} onClick={handleReset} disabled={loading}>
              Сбросить
            </Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};
