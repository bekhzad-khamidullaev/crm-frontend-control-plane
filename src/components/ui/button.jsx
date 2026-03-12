import * as React from 'react';
import { Button as AntButton, Spin } from 'antd';

const variantToType = {
  default: 'primary',
  destructive: 'primary',
  outline: 'default',
  secondary: 'default',
  ghost: 'text',
  link: 'link',
};

const sizeToAnt = {
  default: 'middle',
  sm: 'small',
  lg: 'large',
  icon: 'middle',
};

function buttonVariants() {
  return '';
}

const Button = React.forwardRef(
  (
    {
      variant = 'default',
      size = 'default',
      loading = false,
      disabled,
      children,
      type: nativeType,
      danger,
      asChild = false,
      icon,
      ...props
    },
    ref,
  ) => {
    const htmlType = ['button', 'submit', 'reset'].includes(nativeType) ? nativeType : 'button';

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        ref,
        onClick: props.onClick,
        'aria-disabled': disabled || loading,
      });
    }

    return (
      <AntButton
        ref={ref}
        type={variantToType[variant] || 'default'}
        size={sizeToAnt[size] || 'middle'}
        htmlType={htmlType}
        loading={loading ? { indicator: <Spin size="small" /> } : false}
        disabled={disabled || loading}
        danger={danger || variant === 'destructive'}
        icon={icon}
        {...props}
      >
        {children}
      </AntButton>
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
