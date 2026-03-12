import * as React from 'react';

const Table = React.forwardRef(({ children, ...props }, ref) => (
  <div style={{ width: '100%', overflow: 'auto' }}>
    <table ref={ref} style={{ width: '100%', borderCollapse: 'collapse' }} {...props}>
      {children}
    </table>
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef((props, ref) => <thead ref={ref} {...props} />);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef((props, ref) => <tbody ref={ref} {...props} />);
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef((props, ref) => <tfoot ref={ref} {...props} />);
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef(({ style, ...props }, ref) => (
  <tr ref={ref} style={{ borderBottom: '1px solid rgba(5,5,5,0.06)', ...style }} {...props} />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef(({ style, ...props }, ref) => (
  <th
    ref={ref}
    style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600, color: 'rgba(0,0,0,0.65)', ...style }}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef(({ style, ...props }, ref) => (
  <td ref={ref} style={{ padding: '10px 8px', verticalAlign: 'middle', ...style }} {...props} />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef(({ style, ...props }, ref) => (
  <caption ref={ref} style={{ padding: '8px 0', color: 'rgba(0,0,0,0.45)', ...style }} {...props} />
));
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
