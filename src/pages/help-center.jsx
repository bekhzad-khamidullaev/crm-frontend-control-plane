import React from 'react';
import { Alert, Tabs } from 'antd';
import CrudPage from '../components/CrudPage.jsx';
import { getHelpPages, getHelpPage, getHelpParagraphs, getHelpParagraph } from '../lib/api/help.js';

export default function HelpCenterPage() {
  const tabs = [
    {
      key: 'pages',
      label: 'Страницы',
      children: (
        <CrudPage
          title="Страницы справки"
          api={{ list: getHelpPages, retrieve: getHelpPage }}
          columns={[
            { title: 'Заголовок', dataIndex: 'title', key: 'title' },
            { title: 'Язык', dataIndex: 'language_code', key: 'language_code', width: 120 },
          ]}
          fields={[]}
          readOnly
        />
      ),
    },
    {
      key: 'paragraphs',
      label: 'Параграфы',
      children: (
        <CrudPage
          title="Параграфы справки"
          api={{ list: getHelpParagraphs, retrieve: getHelpParagraph }}
          columns={[
            { title: 'Заголовок', dataIndex: 'title', key: 'title' },
            { title: 'Язык', dataIndex: 'language_code', key: 'language_code', width: 120 },
            { title: 'Индекс', dataIndex: 'index_number', key: 'index_number', width: 100 },
          ]}
          fields={[]}
          readOnly
        />
      ),
    },
  ];

  return (
    <>
      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 16 }}
        message="Справка"
        description="Раздел с инструкциями и подсказками для пользователей CRM. Здесь хранится только справочный контент, а не справочные данные системы."
      />
      <Tabs items={tabs} />
    </>
  );
}
