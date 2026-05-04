import React from 'react';
import { FloatButton } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SaveOutlined, 
  UploadOutlined 
} from '@ant-design/icons';

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
  className = '',
  style = {},
  ...rest
} = {}) {
  const iconMap = {
    add: <PlusOutlined />,
    edit: <EditOutlined />,
    delete: <DeleteOutlined />,
    save: <SaveOutlined />,
    upload: <UploadOutlined />,
  };

  const fabIcon = iconMap[icon] || icon;

  // Если extended (с текстом), используем обычную FloatButton с description
  if (extended && label) {
    return (
      <FloatButton
        icon={fabIcon}
        description={label}
        type={type}
        shape={shape}
        onClick={onClick}
        style={{ right: 24, bottom: 24, ...style }}
        className={className}
        {...rest}
      />
    );
  }

  // Обычная круглая кнопка
  return (
    <FloatButton
      icon={fabIcon}
      type={type}
      shape={shape}
      onClick={onClick}
      style={{ right: 24, bottom: 24, ...style }}
      className={className}
      {...rest}
    />
  );
}

export default FAB;
