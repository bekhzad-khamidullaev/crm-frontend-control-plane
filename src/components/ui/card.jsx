import * as React from 'react';
import { Card as AntCard } from 'antd';

const Card = React.forwardRef(({ children, ...props }, ref) => (
  <AntCard ref={ref} bordered style={{ borderRadius: 10 }} {...props}>
    {children}
  </AntCard>
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} style={{ marginBottom: 12 }} {...props}>
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} style={{ fontSize: 18, fontWeight: 600 }} {...props}>
    {children}
  </div>
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} style={{ color: 'rgba(0,0,0,0.45)', marginTop: 4 }} {...props}>
    {children}
  </div>
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} style={{ marginTop: 12 }} {...props}>
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
