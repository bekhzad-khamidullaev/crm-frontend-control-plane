import React from 'react';
import ReactDOM from 'react-dom/client';

import { Input, Form } from 'antd';

const { TextArea } = Input;

/**
 * TextField wrapper around shadcn/ui Input
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

  React.useEffect(() => {
    setInternalValue(value ?? '');
  }, [value]);

  const handleChange = (event) => {
    const newValue = event.target.value;
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
    rows: multiline ? rows : undefined,
    className: errorText ? 'border-destructive focus-visible:ring-destructive' : undefined,
    ...rest,
  };

  return (
    <div className={`text-field-wrapper ${className}`} style={{ marginBottom: 16, ...style }}>
      {label && (
        <Label className="mb-1 block text-sm font-medium">
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
      )}

      {multiline ? <Textarea {...inputProps} /> : <Input {...inputProps} />}

      {helperText && !errorText && (
        <div className="mt-1 text-xs text-muted-foreground">{helperText}</div>
      )}

      {errorText && <div className="mt-1 text-xs text-destructive">{errorText}</div>}
    </div>
  );
}

// Extended API for compatibility
TextField.create = (options) => {
  const containerDiv = document.createElement('div');
  let root = null;

  const render = () => {
    if (!root) {
      root = ReactDOM.createRoot(containerDiv);
    }
    root.render(<TextField {...options} />);
  };

  render();

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
    },
  };
};

export default TextField;
