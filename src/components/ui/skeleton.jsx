import * as React from 'react';

function Skeleton({ style, ...props }) {
  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.06)',
        borderRadius: 8,
        minHeight: 16,
        width: '100%',
        ...style,
      }}
      {...props}
    />
  );
}

export { Skeleton };
