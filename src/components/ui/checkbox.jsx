import * as React from 'react';
import { Checkbox as AntCheckbox } from 'antd';

const Checkbox = React.forwardRef(({ checked, onCheckedChange, children, ...props }, ref) => (
  <AntCheckbox
    ref={ref}
    checked={checked}
    onChange={(e) => {
      const value = !!e.target.checked;
      onCheckedChange?.(value);
      props.onChange?.(e);
    }}
    {...props}
  >
    {children}
  </AntCheckbox>
));

Checkbox.displayName = 'Checkbox';

export { Checkbox };
