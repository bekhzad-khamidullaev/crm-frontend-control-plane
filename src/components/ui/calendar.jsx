import * as React from 'react';
import { DatePicker as AntDatePicker } from 'antd';
import dayjs from 'dayjs';

function Calendar({ selected, onSelect, ...props }) {
  return (
    <AntDatePicker
      value={selected ? dayjs(selected) : null}
      onChange={(date) => onSelect?.(date ? date.toDate() : null)}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
