import React, { useEffect, useState } from 'react';
import { Card, Tabs, Form, Input, Button, Space, message, Table, Alert, Upload, Tag } from 'antd';
import { SettingOutlined, MailOutlined, BellOutlined, GlobalOutlined, ReloadOutlined, DatabaseOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import settingsApi from '../lib/api/settings.js';
import { exportCrmDataExcel, importCrmDataExcel } from '../lib/api/crmData.js';
import {
  getComplianceReport,
  getDsrRequests,
  executeDsrRequest,
  getRetentionPolicies,
  runRetentionPolicies,
} from '../lib/api/compliance.js';

const { TextArea } = Input;

function SettingsPage() {
  const [massmailForm] = Form.useForm();
  const [remindersForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [domains, setDomains] = useState([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [dataExchangeLoading, setDataExchangeLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceReport, setComplianceReport] = useState(null);
  const [dsrItems, setDsrItems] = useState([]);
  const [retentionItems, setRetentionItems] = useState([]);

  useEffect(() => {
    loadMassmailSettings();
    loadReminderSettings();
    loadPublicDomains();
    loadComplianceData();
  }, []);

  const loadMassmailSettings = async () => {
    try {
      const data = await settingsApi.massmail();
      massmailForm.setFieldsValue({ payload: JSON.stringify(data ?? {}, null, 2) });
    } catch (error) {
      console.error('Error loading massmail settings:', error);
      message.error('Не удалось загрузить настройки рассылок');
    }
  };

  const loadReminderSettings = async () => {
    try {
      const data = await settingsApi.reminders();
      remindersForm.setFieldsValue({ payload: JSON.stringify(data ?? {}, null, 2) });
    } catch (error) {
      console.error('Error loading reminder settings:', error);
      message.error('Не удалось загрузить настройки напоминаний');
    }
  };

  const loadPublicDomains = async () => {
    setDomainsLoading(true);
    try {
      const data = await settingsApi.publicEmailDomains();
      const list = data?.results || data || [];
      setDomains(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error loading public domains:', error);
      message.error('Не удалось загрузить список доменов');
      setDomains([]);
    } finally {
      setDomainsLoading(false);
    }
  };

  const normalizeList = (response) => {
    if (Array.isArray(response)) return response;
    return Array.isArray(response?.results) ? response.results : [];
  };

  const loadComplianceData = async () => {
    setComplianceLoading(true);
    try {
      const [reportResp, dsrResp, retentionResp] = await Promise.all([
        getComplianceReport(),
        getDsrRequests({ page_size: 50 }),
        getRetentionPolicies({ page_size: 50 }),
      ]);
      setComplianceReport(reportResp || null);
      setDsrItems(normalizeList(dsrResp));
      setRetentionItems(normalizeList(retentionResp));
    } catch (error) {
      console.error('Error loading compliance data:', error);
      message.error('Не удалось загрузить compliance данные');
    } finally {
      setComplianceLoading(false);
    }
  };

  const handleExecuteDsr = async (record) => {
    try {
      await executeDsrRequest(record.id);
      message.success('DSR выполнен');
      loadComplianceData();
    } catch (error) {
      console.error('Error executing DSR:', error);
      message.error('Не удалось выполнить DSR');
    }
  };

  const handleRunRetention = async () => {
    try {
      setComplianceLoading(true);
      const result = await runRetentionPolicies();
      message.success(`Retention выполнен: ${result?.count || 0} политик`);
      await loadComplianceData();
    } catch (error) {
      console.error('Error running retention:', error);
      message.error('Не удалось выполнить retention политики');
    } finally {
      setComplianceLoading(false);
    }
  };

  const handleSaveMassmail = async (values) => {
    setLoading(true);
    try {
      const payload = JSON.parse(values.payload || '{}');
      await settingsApi.updateMassmail(payload);
      message.success('Настройки рассылок сохранены');
      await loadMassmailSettings();
    } catch (error) {
      console.error('Error saving massmail settings:', error);
      message.error('Ошибка сохранения настроек рассылок');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReminders = async (values) => {
    setLoading(true);
    try {
      const payload = JSON.parse(values.payload || '{}');
      await settingsApi.updateReminders(payload);
      message.success('Настройки напоминаний сохранены');
      await loadReminderSettings();
    } catch (error) {
      console.error('Error saving reminders settings:', error);
      message.error('Ошибка сохранения настроек напоминаний');
    } finally {
      setLoading(false);
    }
  };

  const domainColumns = [
    {
      title: 'Домен',
      dataIndex: 'domain',
      key: 'domain',
      render: (value, record) => value || record,
    },
  ];

  const tabItems = [
    {
      key: 'massmail',
      label: (
        <span>
          <MailOutlined />
          Рассылки
        </span>
      ),
      children: (
        <Card>
          <Alert
            message="Настройки массовых рассылок"
            description="Формат данных определяется сервером. Здесь можно редактировать настройки в JSON."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form form={massmailForm} layout="vertical" onFinish={handleSaveMassmail}>
            <Form.Item
              name="payload"
              label="Параметры (JSON)"
              rules={[{ required: true, message: 'Введите JSON' }]}
            >
              <TextArea rows={12} />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Сохранить
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadMassmailSettings}>
                Обновить
              </Button>
            </Space>
          </Form>
        </Card>
      ),
    },
    {
      key: 'reminders',
      label: (
        <span>
          <BellOutlined />
          Напоминания
        </span>
      ),
      children: (
        <Card>
          <Alert
            message="Настройки напоминаний"
            description="Формат данных определяется сервером. Отредактируйте JSON и сохраните."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form form={remindersForm} layout="vertical" onFinish={handleSaveReminders}>
            <Form.Item
              name="payload"
              label="Параметры (JSON)"
              rules={[{ required: true, message: 'Введите JSON' }]}
            >
              <TextArea rows={12} />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Сохранить
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadReminderSettings}>
                Обновить
              </Button>
            </Space>
          </Form>
        </Card>
      ),
    },
    {
      key: 'crm-data',
      label: (
        <span>
          <DatabaseOutlined />
          Данные CRM
        </span>
      ),
      children: (
        <Card title="Импорт/Экспорт всех данных CRM">
          <Alert
            message="Экспорт и импорт полного Excel-файла CRM"
            description="Экспорт формирует форматированный Excel с листами по всем сущностям CRM. Для импорта загрузите этот же файл после редактирования."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={dataExchangeLoading}
              onClick={async () => {
                try {
                  setDataExchangeLoading(true);
                  const blob = await exportCrmDataExcel();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `crm_full_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  message.success('Экспорт CRM завершён');
                } catch (error) {
                  console.error('Error exporting CRM data:', error);
                  message.error('Не удалось экспортировать данные CRM');
                } finally {
                  setDataExchangeLoading(false);
                }
              }}
            >
              Экспортировать в Excel
            </Button>

            <Space>
              <Upload
                maxCount={1}
                beforeUpload={(file) => {
                  setImportFile(file);
                  return false;
                }}
                onRemove={() => {
                  setImportFile(null);
                }}
                accept=".xlsx"
              >
                <Button icon={<UploadOutlined />}>Выбрать Excel файл</Button>
              </Upload>
              <Button
                type="primary"
                loading={dataExchangeLoading}
                disabled={!importFile}
                onClick={async () => {
                  if (!importFile) return;
                  try {
                    setDataExchangeLoading(true);
                    const result = await importCrmDataExcel(importFile);
                    setImportResult(result);
                    message.success('Импорт CRM завершён');
                  } catch (error) {
                    console.error('Error importing CRM data:', error);
                    message.error('Ошибка импорта CRM данных');
                  } finally {
                    setDataExchangeLoading(false);
                  }
                }}
              >
                Импортировать из Excel
              </Button>
            </Space>

            {importResult && (
              <Alert
                type="success"
                showIcon
                message={`Импорт завершён: создано ${importResult.created || 0}, обновлено ${importResult.updated || 0}, ошибок ${importResult.errors || 0}`}
                description={<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(importResult.sheets || {}, null, 2)}</pre>}
              />
            )}
          </Space>
        </Card>
      ),
    },
    {
      key: 'domains',
      label: (
        <span>
          <GlobalOutlined />
          Домены
        </span>
      ),
      children: (
        <Card
          title="Публичные домены email"
          extra={
            <Button icon={<ReloadOutlined />} onClick={loadPublicDomains}>
              Обновить
            </Button>
          }
        >
          <Table
            columns={domainColumns}
            dataSource={domains}
            rowKey={(record) => record.domain || record}
            loading={domainsLoading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'compliance',
      label: (
        <span>
          <SettingOutlined />
          Compliance
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card
            title="Compliance Report"
            extra={
              <Button icon={<ReloadOutlined />} onClick={loadComplianceData} loading={complianceLoading}>
                Обновить
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                message="Сводка по согласию, DSR и retention"
                description="Данные формируются из /api/settings/compliance/audit/report/"
              />
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(complianceReport || {}, null, 2)}
              </pre>
            </Space>
          </Card>

          <Card
            title="DSR Requests"
            extra={
              <Button icon={<ReloadOutlined />} onClick={loadComplianceData} loading={complianceLoading}>
                Обновить
              </Button>
            }
          >
            <Table
              rowKey={(record) => record.id}
              loading={complianceLoading}
              dataSource={dsrItems}
              pagination={false}
              columns={[
                { title: 'ID', dataIndex: 'id', key: 'id', width: 220 },
                { title: 'Тип', dataIndex: 'request_type', key: 'request_type' },
                {
                  title: 'Статус',
                  dataIndex: 'status',
                  key: 'status',
                  render: (value) => {
                    const color = value === 'completed' ? 'green' : value === 'failed' ? 'red' : 'blue';
                    return <Tag color={color}>{value}</Tag>;
                  },
                },
                { title: 'Причина', dataIndex: 'reason', key: 'reason' },
                {
                  title: 'Действия',
                  key: 'actions',
                  render: (_, record) => (
                    <Button
                      type="link"
                      disabled={record.status === 'completed' || record.status === 'in_progress'}
                      onClick={() => handleExecuteDsr(record)}
                    >
                      Выполнить
                    </Button>
                  ),
                },
              ]}
            />
          </Card>

          <Card
            title="Retention Policies"
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={loadComplianceData} loading={complianceLoading}>
                  Обновить
                </Button>
                <Button type="primary" onClick={handleRunRetention} loading={complianceLoading}>
                  Run Retention
                </Button>
              </Space>
            }
          >
            <Table
              rowKey={(record) => record.id}
              loading={complianceLoading}
              dataSource={retentionItems}
              pagination={false}
              columns={[
                { title: 'Название', dataIndex: 'name', key: 'name' },
                { title: 'Entity', dataIndex: 'entity', key: 'entity' },
                { title: 'Action', dataIndex: 'action', key: 'action' },
                { title: 'Retention (days)', dataIndex: 'retention_days', key: 'retention_days' },
                {
                  title: 'Активность',
                  dataIndex: 'is_active',
                  key: 'is_active',
                  render: (value) => (value ? <Tag color="green">active</Tag> : <Tag>inactive</Tag>),
                },
                { title: 'Last run', dataIndex: 'last_run_at', key: 'last_run_at' },
              ]}
            />
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title={<><SettingOutlined /> Настройки системы</>}>
        <Tabs defaultActiveKey="massmail" items={tabItems} />
      </Card>
    </div>
  );
}

export default SettingsPage;
