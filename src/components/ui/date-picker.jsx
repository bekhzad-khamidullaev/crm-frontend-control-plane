import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '../../lib/utils/cn.js';
import { Button } from './button.jsx';
import { Calendar } from './calendar.jsx';
import { Popover, PopoverContent, PopoverTrigger } from './popover.jsx';

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  className,
  formatString = 'dd.MM.yyyy',
}) {
  const selected = value ? new Date(value) : undefined;

  const handleSelect = (date) => {
    if (!date) {
      onChange?.(null);
      return;
    }
    onChange?.(date);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground', className)}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, formatString) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar mode="single" selected={selected} onSelect={handleSelect} initialFocus />
      </PopoverContent>
    </Popover>
  );
}
