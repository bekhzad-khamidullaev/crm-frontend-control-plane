/**
 * StatusTag component - colored badges for status display
 * Consistent status visualization across the app
 */

import React from 'react';
import { Tag, TagProps } from 'antd';

export interface StatusTagProps extends Omit<TagProps, 'color'> {
  status: 'success' | 'error' | 'warning' | 'processing' | 'default' | 'info';
  text: string;
}

const statusColors = {
  success: 'green',
  error: 'red',
  warning: 'orange',
  processing: 'blue',
  default: 'default',
  info: 'cyan',
} as const;

export const StatusTag: React.FC<StatusTagProps> = ({ status, text, ...props }) => {
  return (
    <Tag color={statusColors[status]} {...props}>
      {text}
    </Tag>
  );
};
