import * as React from 'react';
import { Input as AntInput } from 'antd';

const Input = React.forwardRef(({ type = 'text', ...props }, ref) => {
  if (type === 'password') {
    return <AntInput.Password ref={ref} {...props} />;
  }
  return <AntInput ref={ref} type={type} {...props} />;
});

Input.displayName = 'Input';

export { Input };
