import { useCompanies } from '@/entities/company/api/queries';
import {
    CountrySelect,
    UserSelect
} from '@/features/reference';
import { SearchOutlined } from '@ant-design/icons';
import { Col, Input, Row, Select } from 'antd';
import React from 'react';

interface FiltersProps {
  onFilterChange: (filters: Record<string, unknown>) => void;
  loading?: boolean;
}

export const ContactsTableFilters: React.FC<FiltersProps> = ({ onFilterChange, loading }) => {
  const { data: companies } = useCompanies({ page: 1, pageSize: 100 }); // Simplified for now

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} lg={6}>
        <Input
          placeholder="Поиск..."
          prefix={<SearchOutlined />}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          allowClear
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Select
          style={{ width: '100%' }}
          placeholder="Компания"
          allowClear
          showSearch
          optionFilterProp="children"
          onChange={(val) => onFilterChange({ company: val })}
          loading={loading}
        >
          {companies?.results?.map((c: any) => (
            <Select.Option key={c.id} value={c.id}>{c.full_name || c.name}</Select.Option>
          ))}
        </Select>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <UserSelect
          placeholder="Ответственный"
          style={{ width: '100%' }}
          onChange={(val) => onFilterChange({ owner: val })}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <CountrySelect
           placeholder="Страна"
           style={{ width: '100%' }}
           onChange={(val) => onFilterChange({ country: val })}
        />
      </Col>
    </Row>
  );
};
