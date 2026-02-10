import React from 'react';
import { Input, Select, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import {
  CountrySelect,
  UserSelect
} from '@/features/reference';
import { useCompanies } from '@/entities/company/api/queries';

interface FiltersProps {
  onFilterChange: (filters: Record<string, unknown>) => void;
  loading?: boolean;
}

export const ContactsTableFilters: React.FC<FiltersProps> = ({ onFilterChange, loading }) => {
  const { data: companies } = useCompanies({ page: 1, page_size: 100 }); // Simplified for now

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} md={6}>
        <Input
          placeholder="Поиск..."
          prefix={<SearchOutlined />}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          allowClear
        />
      </Col>
      <Col xs={24} md={6}>
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
      <Col xs={24} md={6}>
        <UserSelect
          placeholder="Ответственный"
          style={{ width: '100%' }}
          onChange={(val) => onFilterChange({ owner: val })}
        />
      </Col>
      <Col xs={24} md={6}>
        <CountrySelect
           placeholder="Страна"
           style={{ width: '100%' }}
           onChange={(val) => onFilterChange({ country: val })}
        />
      </Col>
    </Row>
  );
};
