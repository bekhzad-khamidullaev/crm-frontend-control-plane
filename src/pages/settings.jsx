import React, { useEffect, useState } from 'react';
import { Card, Tabs, Form, Input, Button, Space, message, Table, Alert, Upload } from 'antd';
import { SettingOutlined, MailOutlined, BellOutlined, GlobalOutlined, ReloadOutlined, DatabaseOutlined, UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import settingsApi from '../lib/api/settings.js';
import { exportCrmDataExcel, importCrmDataExcel } from '../lib/api/crmData.js';

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

  useEffect(() => {
    loadMassmailSettings();
    loadReminderSettings();
    loadPublicDomains();
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
