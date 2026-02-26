/**
 * TextField Component - Wrapper around Ant Design Input
 * Provides consistent API for form fields
 */

import React from 'react';
import { Input, Form } from 'antd';

const { TextArea } = Input;

export default function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  error,
  helperText,
  required = false,
  disabled = false,
  multiline = false,
  rows = 3,
  ...rest
}) {
  const handleChange = (e) => {
    onChange?.(e.target.value);
  };

  const inputProps = {
    value,
    onChange: handleChange,
    placeholder,
    disabled,
    status: error ? 'error' : undefined,
    ...rest,
  };

  const input = multiline ? (
    <TextArea rows={rows} {...inputProps} />
  ) : (
    <Input type={type} {...inputProps} />
  );

  if (label) {
    return (
      <Form.Item
        label={label}
        required={required}
        validateStatus={error ? 'error' : undefined}
        help={error || helperText}
      >
        {input}
      </Form.Item>
    );
  }

  return input;
}
