import dayjs from 'dayjs';

/**
 * Export utilities for CSV, Excel, and PDF formats
 */

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column configuration [{ key, label }]
 * @returns {string} CSV string
 */
export function convertToCSV(data, columns) {
  if (!data || data.length === 0) {
    return '';
  }

  // Create header row
  const headers = columns.map(col => `"${col.label}"`).join(',');
  
  // Create data rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value = getNestedValue(row, col.key);
      
      // Format value based on type
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else if (col.format && typeof col.format === 'function') {
        value = col.format(value, row);
      } else {
        value = String(value);
      }
      
      // Escape quotes and wrap in quotes
      return `"${value.replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column configuration
 * @param {string} filename - Output filename
 */
export function exportToCSV(data, columns, filename = 'export.csv') {
  const csv = convertToCSV(data, columns);
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export data to Excel format (CSV with UTF-8 BOM for Excel compatibility)
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column configuration
 * @param {string} filename - Output filename
 */
export function exportToExcel(data, columns, filename = 'export.csv') {
  const csv = convertToCSV(data, columns);
  // Add UTF-8 BOM for Excel
  const bom = '\uFEFF';
  downloadFile(bom + csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export data to PDF format (using HTML table)
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column configuration
 * @param {string} filename - Output filename
 * @param {Object} options - PDF options (title, _orientation)
 */
export function exportToPDF(data, columns, _filename = 'export.pdf', options = {}) {
  const { title = 'Export', orientation: _orientation = 'portrait' } = options;
  
  // Create HTML table
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px;
          font-size: 12px;
        }
        h1 { 
          color: #333; 
          font-size: 24px;
          margin-bottom: 20px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px;
        }
        th { 
          background-color: #1890ff; 
          color: white; 
          padding: 10px; 
          text-align: left;
          border: 1px solid #ddd;
          font-weight: bold;
        }
        td { 
          padding: 8px; 
          border: 1px solid #ddd;
        }
        tr:nth-child(even) { 
          background-color: #f9f9f9; 
        }
        .export-date {
          color: #666;
          font-size: 11px;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="export-date">Exported: ${dayjs().format('DD/MM/YYYY HH:mm')}</div>
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => {
                let value = getNestedValue(row, col.key);
                if (value === null || value === undefined) {
                  value = '-';
                } else if (typeof value === 'object') {
                  value = JSON.stringify(value);
                } else if (col.format && typeof col.format === 'function') {
                  value = col.format(value, row);
                }
                return `<td>${String(value)}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Open in new window for printing/saving as PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  } else {
    alert('Please allow popups to export PDF');
  }
}

/**
 * Download file helper
 * @param {string} content - File content
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to get value from
 * @param {string} path - Dot notation path (e.g., 'user.name')
 * @returns {*} Value at path
 */
function getNestedValue(obj, path) {
  if (!path) return obj;
  
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[key];
  }
  
  return value;
}

/**
 * Format common data types for export
 */
export const formatters = {
  date: (value) => value ? dayjs(value).format('DD/MM/YYYY') : '-',
  datetime: (value) => value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-',
  currency: (value, row) => {
    const currency = row.currency || '$';
    return value ? `${currency} ${parseFloat(value).toFixed(2)}` : '-';
  },
  boolean: (value) => value ? 'Yes' : 'No',
  array: (value) => Array.isArray(value) ? value.join(', ') : '-',
  number: (value) => value !== null && value !== undefined ? parseFloat(value).toLocaleString() : '-',
};

/**
 * Generate filename with timestamp
 * @param {string} prefix - Filename prefix
 * @param {string} extension - File extension
 * @returns {string} Filename with timestamp
 */
export function generateFilename(prefix = 'export', extension = 'csv') {
  const timestamp = dayjs().format('YYYYMMDD_HHmmss');
  return `${prefix}_${timestamp}.${extension}`;
}
