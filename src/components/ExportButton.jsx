import { useState } from 'react';
import { Button, Dropdown, App } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FileTextOutlined, FilePdfOutlined } from '@ant-design/icons';
import { exportToCSV, exportToExcel, exportToPDF, generateFilename } from '../lib/utils/export';

/**
 * Reusable ExportButton component with dropdown menu for different export formats
 * @param {Object} props
 * @param {Array} props.data - Data to export
 * @param {Array} props.columns - Column configuration [{ key, label, format }]
 * @param {string} props.filename - Base filename (without extension)
 * @param {string} props.title - Title for PDF export
 * @param {Function} props.onExport - Callback before export (can return filtered data)
 */
export default function ExportButton({
  data = [],
  columns = [],
  filename = 'export',
  title = 'Export',
  onExport,
  ...buttonProps
}) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const handleExport = async (format) => {
    setLoading(true);

    try {
      // Allow parent to modify data before export
      let exportData = data;
      if (onExport && typeof onExport === 'function') {
        exportData = await onExport(data, format);
      }

      if (!exportData || exportData.length === 0) {
        message.warning('Нет данных для экспорта');
        return;
      }

      const fname = generateFilename(filename, format === 'pdf' ? 'pdf' : 'csv');

      switch (format) {
        case 'csv':
          exportToCSV(exportData, columns, fname);
          message.success(`Экспортировано ${exportData.length} записей в CSV`);
          break;
        case 'excel':
          exportToExcel(exportData, columns, fname);
          message.success(`Экспортировано ${exportData.length} записей в Excel`);
          break;
        case 'pdf':
          exportToPDF(exportData, columns, fname, { title });
          message.success(`Экспортировано ${exportData.length} записей в PDF`);
          break;
        default:
          message.error('Неизвестный формат экспорта');
      }
    } catch (error) {
      console.error('Export error:', error);
      message.error('Ошибка экспорта данных');
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: 'csv',
      label: 'Export to CSV',
      icon: <FileTextOutlined />,
      onClick: () => handleExport('csv'),
    },
    {
      key: 'excel',
      label: 'Export to Excel',
      icon: <FileExcelOutlined />,
      onClick: () => handleExport('excel'),
    },
    {
      key: 'pdf',
      label: 'Export to PDF',
      icon: <FilePdfOutlined />,
      onClick: () => handleExport('pdf'),
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Button icon={<DownloadOutlined />} loading={loading} {...buttonProps}>
        Export
      </Button>
    </Dropdown>
  );
}
