import React from 'react';
import CrudPage from '../components/CrudPage.jsx';
import { getSegments, getSegment, createSegment, updateSegment, deleteSegment } from '../lib/api/marketing.js';

export default function MarketingSegmentsPage() {
  return (
    <CrudPage
      title="Маркетинговые сегменты"
      description="Сегменты аудитории для рассылок и кампаний."
      api={{
        list: getSegments,
        retrieve: getSegment,
        create: createSegment,
        update: updateSegment,
        remove: deleteSegment,
      }}
      columns={[
        { title: 'Название', dataIndex: 'name', key: 'name' },
        { title: 'Размер', dataIndex: 'size_cache', key: 'size_cache', width: 120 },
        { title: 'Обновлено', dataIndex: 'updated_at', key: 'updated_at', width: 180 },
      ]}
      fields={[
        { name: 'name', label: 'Название', type: 'text', required: true },
        { name: 'description', label: 'Описание', type: 'textarea' },
        { name: 'rules', label: 'Правила (JSON)', type: 'json', rows: 6 },
      ]}
    />
  );
}
