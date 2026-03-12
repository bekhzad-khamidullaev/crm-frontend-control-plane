import * as React from 'react';
import { Alert as AntAlert } from 'antd';

const Alert = React.forwardRef(({ variant = 'default', children, ...props }, ref) => {
  const type = variant === 'destructive' ? 'error' : 'info';
  return (
    <div ref={ref}>
      <AntAlert type={type} showIcon message={children} {...props} />
    </div>
  );
});
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} style={{ fontWeight: 600 }} {...props}>{children}</div>
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
