/**
 * Import utilities for parsing CSV/Excel files
 */

/**
 * Parse CSV file content
 * @param {string} content - CSV file content
 * @returns {Array} Parsed rows
 */
export function parseCSV(content) {
  const lines = content.split(/\r?\n/);
  const result = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n in \r\n
      }
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        result.push(currentRow);
        currentRow = [];
        currentField = '';
      }
    } else {
      currentField += char;
    }
  }

  // Push last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    result.push(currentRow);
  }

  return result;
}

/**
 * Read file as text
 * @param {File} file - File object
 * @returns {Promise<string>} File content
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

/**
 * Convert CSV rows to objects based on header mapping
 * @param {Array} rows - Parsed CSV rows
 * @param {Object} columnMapping - Map of CSV headers to field names
 * @returns {Array} Array of objects
 */
export function csvToObjects(rows, columnMapping) {
  if (rows.length === 0) return [];

  const headers = rows[0];
  const data = rows.slice(1);

  return data
    .filter(row => row.some(cell => cell.trim() !== '')) // Skip empty rows
    .map((row, rowIndex) => {
      const obj = { _rowIndex: rowIndex + 2 }; // +2 for header and 1-based index

      headers.forEach((header, colIndex) => {
        const fieldName = columnMapping[header] || header;
        const value = row[colIndex]?.trim();
        obj[fieldName] = value || null;
      });

      return obj;
    });
}

/**
 * Validate imported data
 * @param {Array} data - Data to validate
 * @param {Array} rules - Validation rules
 * @returns {Object} Validation result { valid, errors, warnings }
 */
export function validateImportData(data, rules = []) {
  const errors = [];
  const warnings = [];

  data.forEach((row, index) => {
    rules.forEach(rule => {
      const value = row[rule.field];
      const rowNum = row._rowIndex || index + 1;

      // Required field
      if (rule.required && (value === null || value === undefined || value === '')) {
        errors.push({
          row: rowNum,
          field: rule.field,
          message: `${rule.label || rule.field} is required`,
          type: 'required',
        });
      }

      // Type validation
      if (value && rule.type) {
        switch (rule.type) {
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              errors.push({
                row: rowNum,
                field: rule.field,
                message: `Invalid email format: ${value}`,
                type: 'format',
              });
            }
            break;

          case 'number':
            if (isNaN(parseFloat(value))) {
              errors.push({
                row: rowNum,
                field: rule.field,
                message: `Must be a number: ${value}`,
                type: 'format',
              });
            }
            break;

          case 'date':
            if (isNaN(Date.parse(value))) {
              errors.push({
                row: rowNum,
                field: rule.field,
                message: `Invalid date format: ${value}`,
                type: 'format',
              });
            }
            break;

          case 'phone':
            if (!/^[\d\s\-\+\(\)]+$/.test(value)) {
              warnings.push({
                row: rowNum,
                field: rule.field,
                message: `Possible invalid phone format: ${value}`,
                type: 'format',
              });
            }
            break;
        }
      }

      // Custom validation
      if (rule.validate && typeof rule.validate === 'function') {
        const result = rule.validate(value, row);
        if (result !== true) {
          errors.push({
            row: rowNum,
            field: rule.field,
            message: result || 'Validation failed',
            type: 'custom',
          });
        }
      }

      // Min/Max length
      if (value && rule.minLength && value.length < rule.minLength) {
        errors.push({
          row: rowNum,
          field: rule.field,
          message: `Minimum length is ${rule.minLength}`,
          type: 'length',
        });
      }

      if (value && rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          row: rowNum,
          field: rule.field,
          message: `Maximum length is ${rule.maxLength}`,
          type: 'length',
        });
      }

      // Enum values
      if (value && rule.enum && !rule.enum.includes(value)) {
        errors.push({
          row: rowNum,
          field: rule.field,
          message: `Invalid value: ${value}. Must be one of: ${rule.enum.join(', ')}`,
          type: 'enum',
        });
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Transform imported data
 * @param {Array} data - Data to transform
 * @param {Object} transformers - Field transformers
 * @returns {Array} Transformed data
 */
export function transformImportData(data, transformers = {}) {
  return data.map(row => {
    const transformed = { ...row };

    Object.entries(transformers).forEach(([field, transformer]) => {
      if (transformed[field] !== null && transformed[field] !== undefined) {
        transformed[field] = transformer(transformed[field], row);
      }
    });

    // Remove internal fields
    delete transformed._rowIndex;

    return transformed;
  });
}

/**
 * Common transformers
 */
export const transformers = {
  trim: (value) => typeof value === 'string' ? value.trim() : value,
  lowercase: (value) => typeof value === 'string' ? value.toLowerCase() : value,
  uppercase: (value) => typeof value === 'string' ? value.toUpperCase() : value,
  number: (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  },
  boolean: (value) => {
    if (typeof value === 'boolean') return value;
    const str = String(value).toLowerCase().trim();
    return ['true', 'yes', '1', 'y'].includes(str);
  },
  date: (value) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  },
  phone: (value) => {
    // Remove all non-digit characters except +
    return typeof value === 'string' ? value.replace(/[^\d+]/g, '') : value;
  },
};

/**
 * Auto-detect column mapping
 * @param {Array} headers - CSV headers
 * @param {Array} fields - Expected field names with labels
 * @returns {Object} Suggested mapping
 */
export function autoDetectMapping(headers, fields) {
  const mapping = {};

  headers.forEach(header => {
    const normalized = header.toLowerCase().trim();
    
    // Try exact match
    const exactMatch = fields.find(f => 
      f.name.toLowerCase() === normalized ||
      (f.label && f.label.toLowerCase() === normalized)
    );

    if (exactMatch) {
      mapping[header] = exactMatch.name;
      return;
    }

    // Try partial match
    const partialMatch = fields.find(f => 
      normalized.includes(f.name.toLowerCase()) ||
      (f.label && normalized.includes(f.label.toLowerCase())) ||
      f.name.toLowerCase().includes(normalized) ||
      (f.label && f.label.toLowerCase().includes(normalized))
    );

    if (partialMatch) {
      mapping[header] = partialMatch.name;
    }
  });

  return mapping;
}
