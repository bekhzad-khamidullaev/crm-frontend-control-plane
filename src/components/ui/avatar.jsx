import * as React from 'react';
import { Avatar as AntAvatar } from 'antd';

const Avatar = React.forwardRef(({ children, ...props }, ref) => (
  <AntAvatar ref={ref} {...props}>
    {children}
  </AntAvatar>
));
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef(({ src, alt, ...props }, ref) => (
  <img ref={ref} src={src} alt={alt || ''} {...props} />
));
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef(({ children, ...props }, ref) => (
  <span ref={ref} {...props}>
    {children}
  </span>
));
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
