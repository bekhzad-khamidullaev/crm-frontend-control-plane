import { useState } from 'react';
import { Modal, Upload, Steps, Table, Select, Button, Space, Alert, Progress, message } from 'antd';
import { InboxOutlined, UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { 
  readFileAsText, 
  parseCSV, 
  csvToObjects, 
  validateImportData, 
  transformImportData,
  autoDetectMapping,
  transformers 
} from '../lib/utils/import';

const { Dragger } = Upload;
const { Step } = Steps;

/**
 * ImportModal component for bulk data import from CSV/Excel
 */
export default function ImportModal({
  open,
  onCancel,
  onImport,
  fields = [], // [{ name, label, required, type }]
  entityName = 'records',
  validationRules = [],
  dataTransformers = {},
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [validationResult, setValidationResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const handleFileUpload = async (file) => {
    try {
      const content = await readFileAsText(file);
      const rows = parseCSV(content);
      
      if (rows.length < 2) {
        message.error('File must contain at least a header row and one data row');
        return false;
      }

      setFile(file);
      setHeaders(rows[0]);
      setParsedData(rows);
      
      // Auto-detect column mapping
      const autoMapping = autoDetectMapping(rows[0], fields);
      setColumnMapping(autoMapping);
      
      setCurrentStep(1);
      return false; // Prevent auto upload
    } catch (error) {
      message.error('Failed to parse file');
      console.error(error);
      return false;
    }
  };

  const handleMappingComplete = () => {
    try {
      // Convert CSV to objects
      const objects = csvToObjects(parsedData, columnMapping);
      
      // Validate data
      const validation = validateImportData(objects, validationRules);
      setValidationResult(validation);
      
      setCurrentStep(2);
    } catch (error) {
      message.error('Failed to process data');
      console.error(error);
    }
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      setImportProgress(0);

      const objects = csvToObjects(parsedData, columnMapping);
      const transformed = transformImportData(objects, {
        ...transformers,
        ...dataTransformers,
      });

      // Import in batches
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < transformed.length; i += batchSize) {
        batches.push(transformed.slice(i, i + batchSize));
      }

      let imported = 0;
      for (const batch of batches) {
        await onImport(batch);
        imported += batch.length;
        setImportProgress((imported / transformed.length) * 100);
      }

      message.success(`Successfully imported ${imported} ${entityName}`);
      handleClose();
    } catch (error) {
      message.error('Failed to import data');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setColumnMapping({});
    setValidationResult(null);
    setImporting(false);
    setImportProgress(0);
    onCancel();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Dragger
            accept=".csv"
            beforeUpload={handleFileUpload}
            maxCount={1}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to upload</p>
            <p className="ant-upload-hint">
              Support for CSV files. Maximum file size: 10MB
            </p>
          </Dragger>
        );

      case 1:
        return (
          <div>
            <Alert
              message="Map CSV columns to fields"
              description="Select the corresponding field for each column in your CSV file."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Table
              dataSource={headers.map((header, index) => ({
                key: index,
                column: header,
                preview: parsedData[1]?.[index] || '-',
              }))}
              columns={[
                {
                  title: 'CSV Column',
                  dataIndex: 'column',
                  key: 'column',
                },
                {
                  title: 'Preview',
                  dataIndex: 'preview',
                  key: 'preview',
                  render: (text) => <span style={{ color: '#888' }}>{text}</span>,
                },
                {
                  title: 'Map to Field',
                  key: 'mapping',
                  render: (_, record) => (
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Select field"
                      value={columnMapping[record.column]}
                      onChange={(value) => {
                        setColumnMapping({
                          ...columnMapping,
                          [record.column]: value,
                        });
                      }}
                      allowClear
                    >
                      {fields.map(field => (
                        <Select.Option key={field.name} value={field.name}>
                          {field.label || field.name}
                          {field.required && <span style={{ color: 'red' }}> *</span>}
                        </Select.Option>
                      ))}
                    </Select>
                  ),
                },
              ]}
              pagination={false}
              size="small"
            />

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>Back</Button>
                <Button type="primary" onClick={handleMappingComplete}>
                  Continue
                </Button>
              </Space>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            {validationResult && (
              <>
                <Alert
                  message={`Found ${parsedData.length - 1} rows`}
                  description={
                    validationResult.valid
                      ? 'All data is valid and ready to import'
                      : `Found ${validationResult.errors.length} errors and ${validationResult.warnings.length} warnings`
                  }
                  type={validationResult.valid ? 'success' : 'warning'}
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                {validationResult.errors.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4>Errors (must fix before importing):</h4>
                    <div style={{ maxHeight: 200, overflow: 'auto', background: '#fff1f0', padding: 8, borderRadius: 4 }}>
                      {validationResult.errors.slice(0, 10).map((error, index) => (
                        <div key={index} style={{ marginBottom: 4 }}>
                          Row {error.row}: {error.message}
                        </div>
                      ))}
                      {validationResult.errors.length > 10 && (
                        <div style={{ color: '#888', marginTop: 8 }}>
                          ... and {validationResult.errors.length - 10} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {validationResult.warnings.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4>Warnings (can proceed with caution):</h4>
                    <div style={{ maxHeight: 150, overflow: 'auto', background: '#fffbe6', padding: 8, borderRadius: 4 }}>
                      {validationResult.warnings.slice(0, 5).map((warning, index) => (
                        <div key={index} style={{ marginBottom: 4 }}>
                          Row {warning.row}: {warning.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importing && (
                  <Progress percent={Math.round(importProgress)} status="active" />
                )}

                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => setCurrentStep(1)} disabled={importing}>
                      Back
                    </Button>
                    <Button
                      type="primary"
                      onClick={handleImport}
                      disabled={!validationResult.valid || importing}
                      loading={importing}
                      icon={<CheckCircleOutlined />}
                    >
                      Import {parsedData.length - 1} Records
                    </Button>
                  </Space>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={`Import ${entityName}`}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="Upload File" icon={<UploadOutlined />} />
        <Step title="Map Columns" />
        <Step title="Review & Import" />
      </Steps>

      {renderStepContent()}
    </Modal>
  );
}
