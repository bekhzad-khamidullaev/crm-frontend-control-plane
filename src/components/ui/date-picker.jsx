import * as React from 'react';
import { DatePicker as AntDatePicker } from 'antd';
import dayjs from 'dayjs';

export function DatePicker({ value, onChange, placeholder = 'Pick a date', disabled = false, formatString = 'DD.MM.YYYY', ...props }) {
  const parsedValue = value ? dayjs(value) : null;
  return (
    <AntDatePicker
      value={parsedValue}
      onChange={(date) => onChange?.(date ? date.toDate() : null)}
      placeholder={placeholder}
      disabled={disabled}
      format={formatString}
      {...props}
    />
  );
}
