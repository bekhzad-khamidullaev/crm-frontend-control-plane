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

  const handleSearch = (searchValue) => {
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  // Convert options to Ant Design format if needed
  const formattedOptions = options.map(opt => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt };
    }
    return opt;
  });

  return (
    <div className={`select-wrapper ${className}`} style={{ marginBottom: 16, ...style }}>
      {label && (
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </label>
      )}
      
      <AntSelect
        value={value || undefined}
        onChange={handleChange}
        onSearch={searchable || showSearch ? handleSearch : undefined}
        options={formattedOptions}
        placeholder={placeholder}
        disabled={disabled}
        mode={multiple ? 'multiple' : undefined}
        showSearch={searchable || showSearch}
        allowClear={allowClear}
        style={{ width: '100%' }}
        status={errorText ? 'error' : undefined}
        filterOption={(input, option) => {
          if (!option) return false;
          const label = option.label?.toString().toLowerCase() || '';
          const value = option.value?.toString().toLowerCase() || '';
          const search = input.toLowerCase();
          return label.includes(search) || value.includes(search);
        }}
        {...rest}
      />
      
      {helperText && !errorText && (
        <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
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
