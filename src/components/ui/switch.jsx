import * as React from 'react';
import { Switch as AntSwitch } from 'antd';

const Switch = React.forwardRef(({ onCheckedChange, checked, ...props }, ref) => (
  <AntSwitch
    ref={ref}
    checked={checked}
    onChange={(value) => {
      onCheckedChange?.(value);
      props.onChange?.(value);
    }}
    {...props}
  />
));

Switch.displayName = 'Switch';

export { Switch };
