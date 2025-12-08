import React from 'react';
import { FloatButton } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

/**
 * FAB (Floating Action Button) wrapper around Ant Design FloatButton
 */
export function FAB({ 
  icon = 'add', 
  label = '', 
  onClick, 
  extended = false,
  type = 'primary',
  shape = 'circle',
  style = {},
  ...rest
} = {}) {
  
  // Map common icon names to Ant Design icons
  const iconMap = {
    'add': <PlusOutlined />,
    'edit': '✏️',
    'delete': '🗑️',
    'save': '💾',
    'upload': '⬆️',
  };

  const fabIcon = iconMap[icon] || icon;

  // For extended FAB, render as a button with text
  if (extended) {
    return (
      <FloatButton
        icon={fabIcon}
        description={label}
        onClick={onClick}
        type={type}
        shape="square"
        style={{ width: 'auto', ...style }}
        {...rest}
      />
    );
  }

  // Regular FAB
  return (
    <FloatButton
      icon={fabIcon}
      tooltip={label}
      onClick={onClick}
      type={type}
      shape={shape}
      style={style}
      {...rest}
    />
  );
}

export default FAB;
