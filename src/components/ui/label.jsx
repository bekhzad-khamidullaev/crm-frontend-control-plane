import * as React from 'react';

const Label = React.forwardRef(({ children, ...props }, ref) => (
  <label ref={ref} style={{ display: 'inline-block', marginBottom: 6, fontWeight: 500 }} {...props}>
    {children}
  </label>
));

Label.displayName = 'Label';

export { Label };
