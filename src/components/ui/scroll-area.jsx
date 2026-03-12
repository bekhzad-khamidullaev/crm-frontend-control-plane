import * as React from 'react';

const ScrollArea = React.forwardRef(({ children, style, ...props }, ref) => (
  <div ref={ref} style={{ overflow: 'auto', ...style }} {...props}>
    {children}
  </div>
));

ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };
