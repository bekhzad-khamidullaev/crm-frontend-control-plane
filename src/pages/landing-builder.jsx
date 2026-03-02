import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { landingsApi } from '../lib/api/client';
import brandLogo from '../assets/brand/logo.svg';

const { Title, Text } = Typography;

function safeParseJson(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function pretty(value) {
  return JSON.stringify(value ?? {}, null, 2);
}

function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatNumber(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return '0';
  return String(num);
}

function formatPercent(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return '0.00%';
  return `${num.toFixed(2)}%`;
}

function toSafeFilePart(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 40);
}

async function svgUrlToPngDataUrl(url, width = 90, height = 22) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context is not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load logo image'));
    img.src = url;
  });
}

export default function LandingBuilderPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [landings, setLandings] = useState([]);
  const [lookups, setLookups] = useState({ stages: [], lead_sources: [], users: [], departments: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [selectedLanding, setSelectedLanding] = useState(null);
  const [draftText, setDraftText] = useState(pretty({ schema_version: 1, craft: {}, page: {} }));
  const [bindingsText, setBindingsText] = useState(pretty([]));
  const [revisions, setRevisions] = useState([]);
  const [previewToken, setPreviewToken] = useState('');
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    date_from: null,
    date_to: null,
    form_key: '',
    utm_campaign: '',
  });
  const [createForm] = Form.useForm();

  const selectedLandingItem = useMemo(
    () => landings.find((item) => item.id === selectedId) || null,
    [landings, selectedId],
  );

  const loadLandings = async () => {
    setLoading(true);
    try {
      const data = await landingsApi.list();
      const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      setLandings(items);

      if (!selectedId && items.length > 0) {
        setSelectedId(items[0].id);
      }
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось загрузить лендинги');
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const data = await landingsApi.lookups();
      setLookups(data || { stages: [], lead_sources: [], users: [], departments: [] });
    } catch {
      // non-blocking
    }
  };

  const loadLandingDetails = async (landingId) => {
    if (!landingId) return;
    try {
      const [landing, draft, bindings, revisionsData, tokenData] = await Promise.all([
        landingsApi.retrieve(landingId),
        landingsApi.getDraft(landingId),
        landingsApi.getBindings(landingId),
        landingsApi.revisions(landingId),
        landingsApi.previewToken(landingId),
      ]);
      setSelectedLanding(landing);
      setDraftText(pretty(draft?.draft_schema || {}));
      setBindingsText(pretty(bindings || []));
      setRevisions(Array.isArray(revisionsData) ? revisionsData : []);
      setPreviewToken(tokenData?.token || '');
      setReport(null);
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось загрузить данные лендинга');
    }
  };

  useEffect(() => {
    loadLandings();
    loadLookups();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadLandingDetails(selectedId);
    }
  }, [selectedId]);

  const handleCreateLanding = async () => {
    try {
      const values = await createForm.validateFields();
      const payload = {
        title: values.title,
        slug: values.slug,
        is_active: values.is_active !== false,
        department: values.department,
        lead_source: values.lead_source,
      };
      await landingsApi.create(payload);
      createForm.resetFields();
      message.success('Лендинг создан');
      await loadLandings();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.details?.detail || 'Не удалось создать лендинг');
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedId) return;
    const schema = safeParseJson(draftText, null);
    if (!schema || typeof schema !== 'object') {
      message.error('Draft schema должен быть валидным JSON объектом');
      return;
    }

    setSaving(true);
    try {
      await landingsApi.putDraft(selectedId, schema);
      const parsedBindings = safeParseJson(bindingsText, null);
      if (!Array.isArray(parsedBindings)) {
        throw new Error('Bindings должен быть JSON массивом');
      }
      await landingsApi.putBindings(selectedId, parsedBindings);
      message.success('Черновик и биндинги сохранены');
      await loadLandingDetails(selectedId);
    } catch (err) {
      message.error(err?.details?.detail || err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedId) return;
    setPublishing(true);
    try {
      await landingsApi.publish(selectedId);
      message.success('Лендинг опубликован');
      await loadLandingDetails(selectedId);
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось опубликовать лендинг');
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleActive = async (checked) => {
    if (!selectedId) return;
    try {
      await landingsApi.patch(selectedId, { is_active: checked });
      message.success(checked ? 'Лендинг активирован' : 'Лендинг деактивирован');
      await loadLandings();
      await loadLandingDetails(selectedId);
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось обновить статус');
    }
  };

  const handleLoadReport = async () => {
    if (!selectedId) return;
    setReportLoading(true);
    try {
      const params = {};
      if (reportFilters.date_from) params.date_from = reportFilters.date_from;
      if (reportFilters.date_to) params.date_to = reportFilters.date_to;
      if (reportFilters.form_key) params.form_key = reportFilters.form_key;
      if (reportFilters.utm_campaign) params.utm_campaign = reportFilters.utm_campaign;
      const data = await landingsApi.report(selectedId, params);
      setReport(data || null);
    } catch (err) {
      message.error(err?.details?.detail || 'Не удалось загрузить отчет');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!report || !selectedLandingItem) return;
    const suffix = [
      toSafeFilePart(reportFilters.date_from),
      toSafeFilePart(reportFilters.date_to),
      toSafeFilePart(reportFilters.form_key),
      toSafeFilePart(reportFilters.utm_campaign),
    ]
      .filter(Boolean)
      .join('_');
    const rows = [
      ['metric', 'value'],
      ['filter_date_from', report?.filters?.date_from || ''],
      ['filter_date_to', report?.filters?.date_to || ''],
      ['filter_form_key', report?.filters?.form_key || ''],
      ['filter_utm_campaign', report?.filters?.utm_campaign || ''],
      ['landing_view', report?.metrics?.landing_view || 0],
      ['form_start', report?.metrics?.form_start || 0],
      ['form_submit', report?.metrics?.form_submit || 0],
      ['lead_created', report?.metrics?.lead_created || 0],
      ['deal_created', report?.metrics?.deal_created || 0],
      ['dedup_hit', report?.metrics?.dedup_hit || 0],
      ['sla_breached', report?.metrics?.sla_breached || 0],
      ['view_to_start_pct', report?.conversions?.view_to_start_pct || 0],
      ['start_to_submit_pct', report?.conversions?.start_to_submit_pct || 0],
      ['submit_to_lead_pct', report?.conversions?.submit_to_lead_pct || 0],
      ['lead_to_deal_pct', report?.conversions?.lead_to_deal_pct || 0],
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const filename = suffix
      ? `landing-funnel-${selectedLandingItem.slug}-${suffix}.csv`
      : `landing-funnel-${selectedLandingItem.slug}.csv`;
    downloadTextFile(filename, csv, 'text/csv;charset=utf-8;');
  };

  const handleExportPdf = async () => {
    if (!report || !selectedLandingItem) return;
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      const rowHeight = 8;
      let y = 20;

      const headerTitle = 'Landing Funnel Report';
      const subtitle = selectedLandingItem.title;
      const generatedAt = new Date().toLocaleString();

      const ensureSpace = (needed = rowHeight) => {
        if (y + needed <= pageHeight - 14) return;
        doc.addPage();
        y = 20;
      };

      const drawHeader = () => {
        doc.setFillColor(24, 24, 27);
        doc.rect(0, 0, pageWidth, 16, 'F');
        try {
          // Render local SVG logo as PNG for stable jsPDF embedding.
          // eslint-disable-next-line no-use-before-define
          if (logoPngDataUrl) {
            doc.addImage(logoPngDataUrl, 'PNG', margin, 3.5, 30, 8);
          }
        } catch {
          // Non-blocking; text header still renders.
        }
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(headerTitle, margin + 34, 10.5);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(generatedAt, pageWidth - margin, 10.5, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      };

      const drawKeyValue = (label, value) => {
        ensureSpace();
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), margin + 55, y);
        y += rowHeight;
      };

      const drawTable = (title, rows) => {
        ensureSpace(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(title, margin, y);
        y += 4;

        // table header
        ensureSpace(10);
        doc.setFillColor(244, 244, 245);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Metric', margin + 2, y + 5.5);
        doc.text('Value', margin + contentWidth - 2, y + 5.5, { align: 'right' });
        y += rowHeight;

        doc.setFont('helvetica', 'normal');
        rows.forEach((row, index) => {
          ensureSpace(10);
          if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, y, contentWidth, rowHeight, 'F');
          }
          doc.text(String(row.label), margin + 2, y + 5.5);
          doc.text(String(row.value), margin + contentWidth - 2, y + 5.5, { align: 'right' });
          y += rowHeight;
        });

        y += 4;
      };

      const logoPngDataUrl = await svgUrlToPngDataUrl(brandLogo).catch(() => '');
      drawHeader();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(subtitle, margin, y);
      y += 9;
      doc.setFontSize(10);
      drawKeyValue('Slug', selectedLandingItem.slug);
      drawKeyValue('Date From', report?.filters?.date_from || '-');
      drawKeyValue('Date To', report?.filters?.date_to || '-');
      drawKeyValue('Form Key', report?.filters?.form_key || '-');
      drawKeyValue('UTM Campaign', report?.filters?.utm_campaign || '-');
      y += 2;

      drawTable('Funnel Metrics', [
        { label: 'Landing Views', value: formatNumber(report?.metrics?.landing_view) },
        { label: 'Form Start', value: formatNumber(report?.metrics?.form_start) },
        { label: 'Form Submit', value: formatNumber(report?.metrics?.form_submit) },
        { label: 'Lead Created', value: formatNumber(report?.metrics?.lead_created) },
        { label: 'Deal Created', value: formatNumber(report?.metrics?.deal_created) },
        { label: 'Dedup Hit', value: formatNumber(report?.metrics?.dedup_hit) },
        { label: 'SLA Breached', value: formatNumber(report?.metrics?.sla_breached) },
      ]);

      drawTable('Step Conversion', [
        { label: 'View -> Start', value: formatPercent(report?.conversions?.view_to_start_pct) },
        { label: 'Start -> Submit', value: formatPercent(report?.conversions?.start_to_submit_pct) },
        { label: 'Submit -> Lead', value: formatPercent(report?.conversions?.submit_to_lead_pct) },
        { label: 'Lead -> Deal', value: formatPercent(report?.conversions?.lead_to_deal_pct) },
      ]);

      // footer page numbers
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i += 1) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      }

      const suffix = [
        toSafeFilePart(reportFilters.date_from),
        toSafeFilePart(reportFilters.date_to),
        toSafeFilePart(reportFilters.form_key),
        toSafeFilePart(reportFilters.utm_campaign),
      ]
        .filter(Boolean)
        .join('_');
      const filename = suffix
        ? `landing-funnel-${selectedLandingItem.slug}-${suffix}.pdf`
        : `landing-funnel-${selectedLandingItem.slug}.pdf`;
      doc.save(filename);
    } catch (err) {
      message.error(err?.message || 'Не удалось экспортировать PDF');
    }
  };

  const previewUrl = selectedLandingItem
    ? `${window.location.origin}/api/public/landings/${selectedLandingItem.slug}/preview/?token=${previewToken}`
    : '';
  const publicUrl = selectedLandingItem
    ? `${window.location.origin}/api/public/landings/${selectedLandingItem.slug}/`
    : '';

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={3} style={{ margin: 0 }}>
          Landing Builder
        </Title>

        <Card title="Новый лендинг">
          <Form layout="vertical" form={createForm}>
            <Row gutter={12}>
              <Col xs={24} md={6}>
                <Form.Item name="title" label="Title" rules={[{ required: true }]}> 
                  <Input placeholder="Summer Campaign" />
                </Form.Item>
              </Col>
              <Col xs={24} md={5}>
                <Form.Item name="slug" label="Slug" rules={[{ required: true }]}> 
                  <Input placeholder="summer-campaign" />
                </Form.Item>
              </Col>
              <Col xs={24} md={5}>
                <Form.Item name="department" label="Department">
                  <Select allowClear options={lookups.departments.map((d) => ({ value: d.id, label: d.name }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={5}>
                <Form.Item name="lead_source" label="Lead Source">
                  <Select allowClear options={lookups.lead_sources.map((s) => ({ value: s.id, label: s.name }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={3}>
                <Form.Item name="is_active" label="Active" valuePropName="checked" initialValue>
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" onClick={handleCreateLanding}>
              Создать
            </Button>
          </Form>
        </Card>

        <Card title="Редактор">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Выберите лендинг"
                  loading={loading}
                  value={selectedId}
                  onChange={setSelectedId}
                  options={landings.map((l) => ({
                    value: l.id,
                    label: `${l.title} (${l.slug})`,
                  }))}
                />
              </Col>
              <Col xs={24} md={8}>
                <Space>
                  <Text type="secondary">Active</Text>
                  <Switch checked={selectedLanding?.is_active} onChange={handleToggleActive} disabled={!selectedLanding} />
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space>
                  <DatePicker
                    placeholder="Date from"
                    format="YYYY-MM-DD"
                    onChange={(_, dateString) =>
                      setReportFilters((prev) => ({ ...prev, date_from: dateString || null }))
                    }
                  />
                  <DatePicker
                    placeholder="Date to"
                    format="YYYY-MM-DD"
                    onChange={(_, dateString) =>
                      setReportFilters((prev) => ({ ...prev, date_to: dateString || null }))
                    }
                  />
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space>
                  <Input
                    placeholder="form_key"
                    value={reportFilters.form_key}
                    onChange={(e) => setReportFilters((prev) => ({ ...prev, form_key: e.target.value }))}
                    style={{ width: 130 }}
                  />
                  <Input
                    placeholder="utm_campaign"
                    value={reportFilters.utm_campaign}
                    onChange={(e) => setReportFilters((prev) => ({ ...prev, utm_campaign: e.target.value }))}
                    style={{ width: 150 }}
                  />
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space>
                  <Button onClick={handleSaveDraft} loading={saving} disabled={!selectedId}>
                    Сохранить draft+bindings
                  </Button>
                  <Button type="primary" onClick={handlePublish} loading={publishing} disabled={!selectedId}>
                    Publish
                  </Button>
                  <Button onClick={handleLoadReport} loading={reportLoading} disabled={!selectedId}>
                    Conversion report
                  </Button>
                </Space>
              </Col>
            </Row>

            {selectedLandingItem && (
              <Alert
                type="info"
                showIcon
                message={`Public: ${publicUrl}`}
                description={`Preview: ${previewUrl}`}
              />
            )}

            <Row gutter={12}>
              <Col xs={24} lg={12}>
                <Text strong>Draft Schema JSON</Text>
                <Input.TextArea rows={20} value={draftText} onChange={(e) => setDraftText(e.target.value)} />
              </Col>
              <Col xs={24} lg={12}>
                <Text strong>Bindings JSON (array)</Text>
                <Input.TextArea rows={20} value={bindingsText} onChange={(e) => setBindingsText(e.target.value)} />
              </Col>
            </Row>
          </Space>
        </Card>

        <Card title="Revisions">
          <Table
            rowKey="id"
            size="small"
            dataSource={revisions}
            pagination={false}
            columns={[
              { title: 'ID', dataIndex: 'id', width: 80 },
              { title: 'Kind', dataIndex: 'kind', render: (v) => <Tag>{v}</Tag> },
              { title: 'Schema Version', dataIndex: 'schema_version' },
              { title: 'Created By', dataIndex: 'created_by_name' },
              { title: 'Created', dataIndex: 'created_at' },
              {
                title: 'Action',
                render: (_, record) => (
                  <Button
                    size="small"
                    disabled={!selectedId}
                    onClick={async () => {
                      try {
                        await landingsApi.rollback(selectedId, record.id);
                        message.success('Rollback выполнен');
                        await loadLandingDetails(selectedId);
                      } catch (err) {
                        message.error(err?.details?.detail || 'Rollback failed');
                      }
                    }}
                  >
                    Rollback
                  </Button>
                ),
              },
            ]}
          />
        </Card>

        {report && (
          <Card title="Funnel Report">
            <Space style={{ marginBottom: 12 }}>
              <Button onClick={handleExportCsv}>Export CSV</Button>
              <Button onClick={handleExportPdf}>Export PDF</Button>
            </Space>
            <Row gutter={12}>
              <Col xs={12} md={6}><Statistic title="Views" value={report?.metrics?.landing_view || 0} /></Col>
              <Col xs={12} md={6}><Statistic title="Form start" value={report?.metrics?.form_start || 0} /></Col>
              <Col xs={12} md={6}><Statistic title="Submit" value={report?.metrics?.form_submit || 0} /></Col>
              <Col xs={12} md={6}><Statistic title="Leads" value={report?.metrics?.lead_created || 0} /></Col>
            </Row>
            <Row gutter={12} style={{ marginTop: 12 }}>
              <Col xs={12} md={6}><Statistic title="Deals" value={report?.metrics?.deal_created || 0} /></Col>
              <Col xs={12} md={6}><Statistic title="Dedup hit" value={report?.metrics?.dedup_hit || 0} /></Col>
              <Col xs={12} md={6}><Statistic title="SLA breached" value={report?.metrics?.sla_breached || 0} /></Col>
              <Col xs={12} md={6}><Statistic title="Submit->Lead %" value={report?.conversions?.submit_to_lead_pct || 0} /></Col>
            </Row>
          </Card>
        )}
      </Space>
    </div>
  );
}
