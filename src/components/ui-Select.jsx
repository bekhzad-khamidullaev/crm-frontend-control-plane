import React from 'react';
import { Select as AntSelect } from 'antd';

/**
 * Enterprise-grade Select component wrapper around Ant Design Select
 * Provides a consistent API for form fields
 */
export function Select({
  label = '',
  value = '',
  options = [],
  required = false,
  disabled = false,
  multiple = false,
  searchable = true,
  placeholder = 'Выберите...',
  helperText = '',
  errorText = '',
  onChange = null,
  onSearch = null,
  style = {},
  className = '',
  allowClear = true,
  showSearch = true,
  ...rest
} = {}) {
  const handleChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  const formattedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt };
    }
    return opt;
  });

  return (
    <div className={className} style={{ marginBottom: 16, ...style }}>
      {label && (
        <div style={{ marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: '#ff4d4f' }}> *</span>}
        </div>
      )}

      <AntSelect
        value={value || undefined}
        onChange={handleChange}
        options={formattedOptions}
        placeholder={placeholder}
        disabled={disabled}
        mode={multiple ? 'multiple' : undefined}
        showSearch={searchable || showSearch}
        allowClear={allowClear}
        onSearch={onSearch}
        style={{ width: '100%' }}
        status={errorText ? 'error' : undefined}
        filterOption={(input, option) => {
          if (!input) return true;
          return (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
        }}
        {...rest}
      />

      {helperText && !errorText && (
        <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
          {helperText}
        </div>
      )}

      {errorText && (
        <div style={{ marginTop: 4, fontSize: 12, color: '#ff4d4f' }}>
          {errorText}
        </div>
      )}
    </div>
  );
}

export default Select;
