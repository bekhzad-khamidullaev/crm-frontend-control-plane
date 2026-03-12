import * as React from 'react';
import { Divider } from 'antd';

const Separator = React.forwardRef(({ orientation = 'horizontal', ...props }, ref) => (
  <Divider ref={ref} type={orientation === 'vertical' ? 'vertical' : 'horizontal'} {...props} />
));

Separator.displayName = 'Separator';

export { Separator };
