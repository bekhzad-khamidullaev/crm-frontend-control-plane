import * as React from 'react';
import { Tag } from 'antd';

const colorMap = {
  default: 'blue',
  secondary: 'default',
  destructive: 'red',
  outline: 'default',
};

function badgeVariants() {
  return '';
}

function Badge({ variant = 'default', children, ...props }) {
  return (
    <Tag color={colorMap[variant] || 'default'} {...props}>
      {children}
    </Tag>
  );
}

export { Badge, badgeVariants };
