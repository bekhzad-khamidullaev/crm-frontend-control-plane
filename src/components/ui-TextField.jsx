import React from 'react';
import ReactDOM from 'react-dom/client';
import { Input } from 'antd';

const { TextArea } = Input;

/**
 * TextField wrapper around Ant Design Input
 * Provides a consistent API for form fields
 */
export function TextField({ 
  label = '', 
  value = '', 
  type = 'text', 
  required = false,
  multiline = false,
  rows = 3,
  helperText = '',
  errorText = '',
  placeholder = '',
  onChange = null,
  style = {},
  className = '',
  ...rest
} = {}) {
  
  const [internalValue, setInternalValue] = React.useState(value);
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const inputProps = {
    value: internalValue,
    onChange: handleChange,
    placeholder: placeholder || label,
    type: multiline ? undefined : type,
    status: errorText ? 'error' : undefined,
    ...rest
  };

  return (
    <div className={`text-field-wrapper ${className}`} style={{ marginBottom: 16, ...style }}>
      {label && (
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </label>
      )}
      
      {multiline ? (
        <TextArea rows={rows} {...inputProps} />
      ) : (
        <Input {...inputProps} />
      )}
      
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

// Extended API for compatibility
TextField.create = (options) => {
  const containerDiv = document.createElement('div');
  let componentInstance = null;
  
  const render = () => {
    const root = ReactDOM.createRoot(containerDiv);
    root.render(<TextField {...options} />);
  };
  
  return {
    element: containerDiv,
    input: containerDiv.querySelector('input, textarea'),
    getValue: () => options.value || '',
    setValue: (val) => { 
      options.value = val;
      render();
    },
    setError: (msg) => {
      options.errorText = msg;
      render();
    },
    clearError: () => {
      options.errorText = '';
      render();
    }
  };
};

export default TextField;
