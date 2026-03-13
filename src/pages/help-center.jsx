import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Modal, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { getHelpPages, getHelpPage, getHelpParagraphs, getHelpParagraph } from '../lib/api/help.js';
import { getLocale, t } from '../lib/i18n/index.js';

const { Text } = Typography;

const SUPPORTED_LOCALES = ['ru', 'en', 'uz'];

function normalizeLocale(raw) {
  const normalized = String(raw || '').toLowerCase().trim();
  if (normalized.startsWith('uz')) return 'uz';
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('ru')) return 'ru';
  return 'ru';
}

function readAppLocale() {
  return normalizeLocale(localStorage.getItem('enterprise_crm_locale') || getLocale() || 'ru');
}

function unwrapResults(res) {
  if (Array.isArray(res)) return res;
  return Array.isArray(res?.results) ? res.results : [];
}

function stripHtml(input = '') {
  return String(input || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeHtml(input = '') {
  if (typeof window === 'undefined') return String(input || '');
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${input || ''}</div>`, 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach((el) => el.remove());
  doc.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value || '';
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }
      if ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(value)) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}

function getLanguageLabel(code) {
  if (code === 'ru') return 'RU';
  if (code === 'uz') return 'UZ';
  return 'EN';
}

export default function HelpCenterPage() {
  const [contentLocale, setContentLocale] = useState(readAppLocale);
  const [pages, setPages] = useState([]);
  const [paragraphs, setParagraphs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fallbackToEnglish, setFallbackToEnglish] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const onLocaleChanged = (event) => {
      const next = normalizeLocale(event?.detail);
      setContentLocale(next);
    };
    const onStorage = (event) => {
      if (event.key !== 'enterprise_crm_locale') return;
      const next = normalizeLocale(event.newValue);
      setContentLocale(next);
    };
    window.addEventListener('enterprise_crm:locale-change', onLocaleChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('enterprise_crm:locale-change', onLocaleChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const loadHelpData = useCallback(async (localeCode) => {
    setLoading(true);
    try {
      const [pagesPrimary, paragraphsPrimary] = await Promise.all([
        getHelpPages({ language_code: localeCode, page_size: 500 }),
        getHelpParagraphs({ language_code: localeCode, page_size: 500 }),
      ]);

      let pageItems = unwrapResults(pagesPrimary);
      let paragraphItems = unwrapResults(paragraphsPrimary);
      let fallback = false;

      if ((pageItems.length === 0 || paragraphItems.length === 0) && localeCode !== 'en') {
        const [pagesEn, paragraphsEn] = await Promise.all([
          getHelpPages({ language_code: 'en', page_size: 500 }),
          getHelpParagraphs({ language_code: 'en', page_size: 500 }),
        ]);
        pageItems = pageItems.length > 0 ? pageItems : unwrapResults(pagesEn);
        paragraphItems = paragraphItems.length > 0 ? paragraphItems : unwrapResults(paragraphsEn);
        fallback = true;
      }

      setPages(pageItems);
      setParagraphs(paragraphItems);
      setFallbackToEnglish(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHelpData(contentLocale);
  }, [contentLocale, loadHelpData]);

  const pageById = useMemo(() => {
    const map = new Map();
    pages.forEach((item) => map.set(item.id, item));
    return map;
  }, [pages]);

  const pageColumns = useMemo(
    () => [
      {
        title: t('helpCenterPage.columns.title') || 'Title',
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: t('helpCenterPage.columns.language') || 'Language',
        dataIndex: 'language_code',
        key: 'language_code',
        width: 120,
        render: (value) => <Tag>{getLanguageLabel(value)}</Tag>,
      },
      {
        title: t('helpCenterPage.columns.paragraphs') || 'Paragraphs',
        key: 'paragraphs',
        width: 140,
        render: (_, record) => record.paragraphs?.length || 0,
      },
      {
        title: t('helpCenterPage.columns.actions') || 'Actions',
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Button type="link" icon={<EyeOutlined />} onClick={async () => setPreview(await getHelpPage(record.id))}>
            {t('helpCenterPage.preview') || 'Preview'}
          </Button>
        ),
      },
    ],
    [contentLocale]
  );

  const paragraphColumns = useMemo(
    () => [
      {
        title: t('helpCenterPage.columns.page') || 'Page',
        key: 'page',
        render: (_, record) => record.document_title || pageById.get(record.document)?.title || `#${record.document || '-'}`,
      },
      {
        title: t('helpCenterPage.columns.title') || 'Title',
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: t('helpCenterPage.columns.index') || 'Index',
        dataIndex: 'index_number',
        key: 'index_number',
        width: 90,
      },
      {
        title: t('helpCenterPage.columns.language') || 'Language',
        dataIndex: 'language_code',
        key: 'language_code',
        width: 120,
        render: (value) => <Tag>{getLanguageLabel(value)}</Tag>,
      },
      {
        title: t('helpCenterPage.columns.preview') || 'Preview text',
        dataIndex: 'content',
        key: 'preview',
        render: (value) => <Text type="secondary">{stripHtml(value).slice(0, 130)}</Text>,
      },
      {
        title: t('helpCenterPage.columns.actions') || 'Actions',
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Button type="link" icon={<EyeOutlined />} onClick={async () => setPreview(await getHelpParagraph(record.id))}>
            {t('helpCenterPage.preview') || 'Preview'}
          </Button>
        ),
      },
    ],
    [pageById, contentLocale]
  );

  const tabs = [
    {
      key: 'pages',
      label: t('helpCenterPage.tabs.pages') || 'Pages',
      children: (
        <Card title={t('helpCenterPage.pagesTitle') || 'Help Pages'}>
          <Table
            rowKey="id"
            columns={pageColumns}
            dataSource={pages}
            loading={loading}
            pagination={{ pageSize: 15, hideOnSinglePage: true }}
            locale={{ emptyText: <Empty description={t('helpCenterPage.empty') || 'No help pages found'} /> }}
          />
        </Card>
      ),
    },
    {
      key: 'paragraphs',
      label: t('helpCenterPage.tabs.paragraphs') || 'Paragraphs',
      children: (
        <Card title={t('helpCenterPage.paragraphsTitle') || 'Help Paragraphs'}>
          <Table
            rowKey="id"
            columns={paragraphColumns}
            dataSource={paragraphs}
            loading={loading}
            pagination={{ pageSize: 15, hideOnSinglePage: true }}
            locale={{ emptyText: <Empty description={t('helpCenterPage.empty') || 'No help paragraphs found'} /> }}
          />
        </Card>
      ),
    },
  ];

  const previewTitle = preview?.title || t('helpCenterPage.preview') || 'Preview';
  const previewParagraphs = Array.isArray(preview?.paragraphs) ? preview.paragraphs : preview ? [preview] : [];

  return (
    <>
      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 16 }}
        message={t('helpCenterPage.alertTitle') || 'Help Center'}
        description={t('helpCenterPage.alertDescription') || 'User instructions, tips, and work scenarios for CRM modules.'}
      />

      <Space style={{ marginBottom: 16 }}>
        <Text strong>{t('helpCenterPage.languageFilter') || 'Content language'}:</Text>
        <Select
          value={contentLocale}
          onChange={setContentLocale}
          style={{ width: 160 }}
          options={[
            { value: 'ru', label: t('helpCenterPage.languages.ru') || 'Russian' },
            { value: 'en', label: t('helpCenterPage.languages.en') || 'English' },
            { value: 'uz', label: t('helpCenterPage.languages.uz') || 'Uzbek' },
          ]}
        />
      </Space>

      {fallbackToEnglish ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('helpCenterPage.fallback') || 'Some content is unavailable in the selected language. English fallback is shown.'}
        />
      ) : null}

      <Tabs items={tabs} />

      <Modal
        open={!!preview}
        title={previewTitle}
        width={900}
        onCancel={() => setPreview(null)}
        footer={[
          <Button key="close" onClick={() => setPreview(null)}>
            {t('actions.cancel') || 'Close'}
          </Button>,
        ]}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {previewParagraphs.map((item) => (
            <Card
              key={item.id || `${item.title}-${item.index_number}`}
              size="small"
              title={
                <Space>
                  <Text strong>{item.title || t('helpCenterPage.withoutTitle') || 'Untitled paragraph'}</Text>
                  <Tag>{getLanguageLabel(item.language_code || preview?.language_code)}</Tag>
                </Space>
              }
            >
              <div
                style={{ lineHeight: 1.65 }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content || '') }}
              />
            </Card>
          ))}
        </Space>
      </Modal>
    </>
  );
}
