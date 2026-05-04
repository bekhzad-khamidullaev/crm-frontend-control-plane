/**
 * Экспорт данных чартов в различные форматы
 */

/**
 * Экспорт данных в CSV
 * @param {Array} data - массив данных
 * @param {string} filename - имя файла
 * @param {Array} columns - массив колонок { key, label }
 */
export function exportToCSV(data, filename = 'export.csv', columns = []) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Если columns не указаны, используем все ключи первого объекта
  const cols = columns.length > 0 
    ? columns 
    : Object.keys(data[0]).map(key => ({ key, label: key }));

  // Создаем заголовок
  const header = cols.map(col => col.label).join(',');
  
  // Создаем строки данных
  const rows = data.map(item => {
    return cols.map(col => {
      const value = item[col.key];
      // Экранируем значения с запятыми и кавычками
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',');
  });

  // Объединяем заголовок и данные
  const csv = [header, ...rows].join('\n');

  // Создаем Blob и скачиваем
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Экспорт чарта как изображение PNG
 * @param {HTMLCanvasElement} canvas - canvas элемент чарта
 * @param {string} filename - имя файла
 */
export function exportChartAsImage(canvas, filename = 'chart.png') {
  if (!canvas) {
    console.warn('Canvas element not found');
    return;
  }

  canvas.toBlob(blob => {
    downloadBlob(blob, filename);
  });
}

/**
 * Экспорт чарта в PDF
 * @param {HTMLElement} element - DOM элемент для экспорта
 * @param {string} filename - имя файла
 */
export async function exportToPDF(element, filename = 'chart.pdf') {
  try {
    // Динамический импорт для code splitting
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Определяем ориентацию
    const orientation = imgWidth > imgHeight ? 'landscape' : 'portrait';
    
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [imgWidth, imgHeight],
      compress: true,
    });

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Ошибка экспорта в PDF: ' + error.message);
  }
}

/**
 * Экспорт данных чарта для Chart.js
 * @param {Object} chartInstance - экземпляр Chart.js
 * @param {string} format - 'csv', 'json', 'png'
 * @param {string} filename - имя файла
 */
export function exportChartData(chartInstance, format = 'csv', filename = 'chart-data') {
  if (!chartInstance || !chartInstance.data) {
    console.warn('Invalid chart instance');
    return;
  }

  const { labels, datasets } = chartInstance.data;

  switch (format) {
    case 'csv': {
      // Преобразуем данные чарта в табличный формат
      const data = labels.map((label, index) => {
        const row = { label };
        datasets.forEach(dataset => {
          row[dataset.label || 'value'] = dataset.data[index];
        });
        return row;
      });
      exportToCSV(data, `${filename}.csv`);
      break;
    }

    case 'json': {
      const jsonData = { labels, datasets };
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
        type: 'application/json' 
      });
      downloadBlob(blob, `${filename}.json`);
      break;
    }

    case 'png':
      exportChartAsImage(chartInstance.canvas, `${filename}.png`);
      break;

    default:
      console.warn('Unsupported export format:', format);
  }
}

/**
 * Вспомогательная функция для скачивания Blob
 * @param {Blob} blob - данные для скачивания
 * @param {string} filename - имя файла
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Экспорт множества чартов в один PDF
 * @param {Array} elements - массив DOM элементов
 * @param {string} filename - имя файла
 * @param {Object} options - опции (title, pageBreak)
 */
export async function exportMultipleChartsToPDF(elements, filename = 'charts.pdf', options = {}) {
  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);

    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    // Добавляем заголовок если есть
    if (options.title) {
      pdf.setFontSize(16);
      pdf.text(options.title, margin, margin + 5);
    }

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const yPosition = options.title && i === 0 ? margin + 15 : margin;

      // Новая страница для каждого графика кроме первого
      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        imgData, 
        'PNG', 
        margin, 
        yPosition, 
        imgWidth, 
        Math.min(imgHeight, pageHeight - yPosition - margin)
      );
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error exporting multiple charts to PDF:', error);
    throw new Error('Ошибка экспорта в PDF: ' + error.message);
  }
}
