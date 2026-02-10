import React from 'react';
import { DatePicker as AntDatePicker } from 'antd';
import dayjs from 'dayjs';

const { RangePicker: AntRangePicker } = AntDatePicker;

export function DatePicker({ value, onChange, format = 'DD.MM.YYYY', style, ...rest }) {
  const dayjsValue = value ? dayjs(value) : null;

  const handleChange = (date) => {
    onChange?.(date);
  };

  return (
    <AntDatePicker
      value={dayjsValue}
      onChange={handleChange}
      format={format}
      style={style}
      {...rest}
    />
  );
}

DatePicker.RangePicker = function RangePicker({ value = [], onChange, format = 'DD.MM.YYYY', ...rest }) {
  const rangeValue = value && value.length === 2 ? [
    value[0] ? dayjs(value[0]) : null,
    value[1] ? dayjs(value[1]) : null
  ] : null;

  return (
    <AntRangePicker
      value={rangeValue}
      onChange={onChange}
      format={format}
      {...rest}
    />
  );
};

export default DatePicker;
