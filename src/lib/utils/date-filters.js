import dayjs from 'dayjs';

/**
 * Получить диапазон дат для заданного периода
 * @param {string} period - '7d', '30d', '90d', 'custom'
 * @param {Object} customRange - { start: Date, end: Date } для custom периода
 * @returns {Object} { start: Date, end: Date }
 */
export function getDateRange(period, customRange = null) {
  const end = dayjs();
  let start;

  switch (period) {
    case '7d':
      start = dayjs().subtract(7, 'day');
      break;
    case '30d':
      start = dayjs().subtract(30, 'day');
      break;
    case '90d':
      start = dayjs().subtract(90, 'day');
      break;
    case '180d':
      start = dayjs().subtract(180, 'day');
      break;
    case '1y':
      start = dayjs().subtract(1, 'year');
      break;
    case 'custom':
      if (customRange) {
        return {
          start: dayjs(customRange.start).toDate(),
          end: dayjs(customRange.end).toDate(),
        };
      }
      start = dayjs().subtract(30, 'day');
      break;
    default:
      start = dayjs().subtract(30, 'day');
  }

  return {
    start: start.toDate(),
    end: end.toDate(),
  };
}

/**
 * Фильтровать массив данных по периоду
 * @param {Array} data - массив данных с полем created_at или date
 * @param {string} period - период фильтрации
 * @param {Object} customRange - кастомный диапазон
 * @param {string} dateField - название поля с датой (по умолчанию 'created_at')
 * @returns {Array} отфильтрованные данные
 */
export function filterDataByPeriod(data, period, customRange = null, dateField = 'created_at') {
  if (!data || !Array.isArray(data)) return [];
  
  const { start, end } = getDateRange(period, customRange);
  
  return data.filter(item => {
    const itemDate = dayjs(item[dateField]);
    return itemDate.isAfter(start) && itemDate.isBefore(end);
  });
}

/**
 * Форматировать диапазон дат для отображения
 * @param {string} period - период
 * @param {Object} customRange - кастомный диапазон
 * @returns {string} отформатированная строка
 */
export function formatDateRange(period, customRange = null) {
  const { start, end } = getDateRange(period, customRange);
  
  const startStr = dayjs(start).format('DD.MM.YYYY');
  const endStr = dayjs(end).format('DD.MM.YYYY');
  
  const periodLabels = {
    '7d': 'Последние 7 дней',
    '30d': 'Последние 30 дней',
    '90d': 'Последние 90 дней',
    '180d': 'Последние 180 дней',
    '1y': 'Последний год',
  };
  
  if (period === 'custom') {
    return `${startStr} - ${endStr}`;
  }
  
  return periodLabels[period] || `${startStr} - ${endStr}`;
}

/**
 * Получить метки периодов для селектора
 * @returns {Array} массив опций для Select
 */
export function getPeriodOptions() {
  return [
    { value: '7d', label: 'Последние 7 дней' },
    { value: '30d', label: 'Последние 30 дней' },
    { value: '90d', label: 'Последние 90 дней' },
    { value: '180d', label: 'Последние 180 дней' },
    { value: '1y', label: 'Последний год' },
    { value: 'custom', label: 'Произвольный период' },
  ];
}

/**
 * Группировать данные по периодам (день, неделя, месяц)
 * @param {Array} data - массив данных
 * @param {string} groupBy - 'day', 'week', 'month'
 * @param {string} dateField - поле с датой
 * @returns {Object} сгруппированные данные
 */
export function groupDataByPeriod(data, groupBy = 'day', dateField = 'created_at') {
  if (!data || !Array.isArray(data)) return {};
  
  const grouped = {};
  
  data.forEach(item => {
    const date = dayjs(item[dateField]);
    let key;
    
    switch (groupBy) {
      case 'day':
        key = date.format('YYYY-MM-DD');
        break;
      case 'week':
        key = date.startOf('week').format('YYYY-MM-DD');
        break;
      case 'month':
        key = date.format('YYYY-MM');
        break;
      default:
        key = date.format('YYYY-MM-DD');
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });
  
  return grouped;
}
