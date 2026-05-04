import React, { useState, useRef } from 'react';
import { Card, Space, Button, Select, DatePicker, Dropdown, App, Tooltip, Switch } from 'antd';
import {
  DownloadOutlined,
  FilterOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPeriodOptions, formatDateRange } from '../../lib/utils/date-filters';
import { exportToCSV, exportToPDF, exportChartAsImage } from '../../lib/utils/chart-export';
import RealTimeIndicator from './RealTimeIndicator';
import { useBackgroundRefresh } from '@/shared/hooks';

const { RangePicker } = DatePicker;

/**
 * AnalyticsWrapper - универсальная обертка для аналитических компонентов
 * Включает фильтры периода, экспорт, обновление
 * 
 * @param {string} title - заголовок секции
 * @param {ReactNode} children - вложенные компоненты
 * @param {Function} onPeriodChange - callback при изменении периода
 * @param {Function} onRefresh - callback для обновления данных
 * @param {Array} exportData - данные для экспорта CSV
 * @param {boolean} loading - состояние загрузки
 * @param {boolean} showFilters - показывать ли фильтры
 * @param {boolean} showExport - показывать ли кнопки экспорта
 * @param {Object} extra - дополнительные элементы в заголовке
 */
function AnalyticsWrapper({
  title,
  children,
  onPeriodChange,
  onRefresh,
  exportData = [],
  loading = false,
  showFilters = true,
  showExport = true,
  extra = null,
  defaultPeriod = '30d',
  enableRealTime = false,
  realTimeInterval = 30000,
  onRealTimeToggle,
  lastUpdate = null,
}) {
  const { message } = App.useApp();
  const [period, setPeriod] = useState(defaultPeriod);
  const [customRange, setCustomRange] = useState(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const contentRef = useRef(null);
  useBackgroundRefresh(onRefresh, {
    enabled: Boolean(onRefresh) && !enableRealTime && !isRealTimeActive,
    interval: realTimeInterval,
  });

  const periodOptions = getPeriodOptions();

  // Обработка изменения периода
  const handlePeriodChange = (value) => {
    setPeriod(value);
    
    if (value === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      if (onPeriodChange) {
        onPeriodChange(value, null);
      }
    }
  };

  // Обработка выбора кастомного диапазона
  const handleCustomRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      const range = {
        start: dates[0].toDate(),
        end: dates[1].toDate(),
      };
      setCustomRange(range);
      if (onPeriodChange) {
        onPeriodChange('custom', range);
      }
    }
  };

  // Переключение real-time режима
  const handleRealTimeToggle = (checked) => {
    setIsRealTimeActive(checked);
    if (onRealTimeToggle) {
      onRealTimeToggle(checked);
    }
    message.info(checked ? 'Real-time обновление включено' : 'Real-time обновление выключено');
  };

  // Экспорт в CSV
  const handleExportCSV = () => {
    if (exportData.length === 0) {
      message.warning('Нет данных для экспорта');
      return;
    }
    
    const filename = `${title.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.csv`;
    exportToCSV(exportData, filename);
    message.success('Данные экспортированы в CSV');
  };

  // Экспорт в PDF
  const handleExportPDF = async () => {
    if (!contentRef.current) {
      message.warning('Нет данных для экспорта');
      return;
    }
    
    const filename = `${title.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.pdf`;
    message.loading('Экспорт в PDF...', 0);
    
    try {
      await exportToPDF(contentRef.current, filename);
      message.destroy();
      message.success('Экспортировано в PDF');
    } catch (error) {
      message.destroy();
      message.error('Ошибка экспорта. Убедитесь, что установлены jspdf и html2canvas');
    }
  };

  // Экспорт как изображение
  const handleExportImage = () => {
    if (!contentRef.current) {
      message.warning('Нет данных для экспорта');
      return;
    }

    const canvas = contentRef.current.querySelector('canvas');
    if (canvas) {
      const filename = `${title.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.png`;
      exportChartAsImage(canvas, filename);
      message.success('Экспортировано как изображение');
    } else {
      message.warning('График не найден');
    }
  };

  // Меню экспорта
  const exportMenuItems = [
    {
      key: 'csv',
      icon: <FileTextOutlined />,
      label: 'Экспорт в CSV',
      onClick: handleExportCSV,
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: 'Экспорт в PDF',
      onClick: handleExportPDF,
    },
    {
      key: 'image',
      icon: <FileImageOutlined />,
      label: 'Экспорт как изображение',
      onClick: handleExportImage,
    },
  ];

  // Дополнительные элементы заголовка
  const cardExtra = (
    <Space wrap>
      {showFilters && (
        <>
          <Select
            value={period}
            onChange={handlePeriodChange}
            style={{ width: 180 }}
            options={periodOptions}
            suffixIcon={<FilterOutlined />}
          />
          
          {showCustomPicker && (
            <RangePicker
              value={customRange ? [dayjs(customRange.start), dayjs(customRange.end)] : null}
              onChange={handleCustomRangeChange}
              format="DD.MM.YYYY"
              placeholder={['Начало', 'Конец']}
            />
          )}
        </>
      )}

      {enableRealTime && (
        <Tooltip title={isRealTimeActive ? 'Отключить автообновление' : 'Включить автообновление'}>
          <Space>
            <SyncOutlined spin={isRealTimeActive && loading} />
            <Switch
              checked={isRealTimeActive}
              onChange={handleRealTimeToggle}
              size="small"
            />
          </Space>
        </Tooltip>
      )}

      {showExport && (
        <Dropdown
          menu={{ items: exportMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Tooltip title="Экспорт данных">
            <Button 
              icon={<DownloadOutlined />}
              type="default"
              className="export-button"
            >
              Экспорт
            </Button>
          </Tooltip>
        </Dropdown>
      )}

      {extra}
    </Space>
  );

  return (
    <Card
      title={title}
      extra={cardExtra}
      className="analytics-card"
      loading={loading}
    >
      <div ref={contentRef} className="analytics-content">
        {children}
      </div>
      
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {showFilters && (
          <div style={{ color: '#999', fontSize: 12 }}>
            {formatDateRange(period, customRange)}
          </div>
        )}
        
        {enableRealTime && (
          <RealTimeIndicator
            isActive={isRealTimeActive}
            lastUpdate={lastUpdate}
            interval={realTimeInterval}
            loading={loading}
          />
        )}
      </div>
    </Card>
  );
}

export default AnalyticsWrapper;
