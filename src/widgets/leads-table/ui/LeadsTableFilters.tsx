import React from 'react';
import { Input, Row, Col } from 'antd';
import {
  LeadSourceSelect,
  UserSelect,
  CountrySelect,
  CompanySelect
} from '@/features/reference';
import { LeadListParams } from '@/entities/lead';

interface LeadsTableFiltersProps {
  filters: LeadListParams;
  onChange: (filters: LeadListParams) => void;
}

export const LeadsTableFilters: React.FC<LeadsTableFiltersProps> = ({
  filters,
  onChange,
}) => {
  const handleFilterChange = (key: keyof LeadListParams, value: any) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Input.Search
          placeholder="Поиск..."
          onSearch={(val) => handleFilterChange('search', val)}
          allowClear
        />
      </Col>
      <Col span={4}>
         <LeadSourceSelect
           placeholder="Источник"
           value={filters.leadSource}
           onChange={(val) => handleFilterChange('leadSource', val)}
           allowClear
           style={{ width: '100%' }}
         />
      </Col>
      <Col span={4}>
         <UserSelect
           placeholder="Ответственный"
           value={filters.owner}
           onChange={(val) => handleFilterChange('owner', val)}
           allowClear
           style={{ width: '100%' }}
         />
      </Col>
      <Col span={4}>
        <CountrySelect
          placeholder="Страна"
          value={filters.country}
          onChange={(val) => handleFilterChange('country', val)}
          allowClear
          style={{ width: '100%' }}
        />
      </Col>
       <Col span={4}>
        <CompanySelect
          placeholder="Компания"
          value={filters.company}
          onChange={(val) => handleFilterChange('company', val)}
          allowClear
          style={{ width: '100%' }}
        />
      </Col>
    </Row>
  );
};
