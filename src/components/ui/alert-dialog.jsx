import * as React from 'react';
import { Modal } from 'antd';
import { Button } from './button.jsx';

const AlertDialogContext = React.createContext(null);

function useAlertContext() {
  const ctx = React.useContext(AlertDialogContext);
  if (!ctx) {
    return { open: false, setOpen: () => {} };
  }
  return ctx;
}

const AlertDialog = ({ open: controlledOpen, onOpenChange, children }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (next) => {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return <AlertDialogContext.Provider value={{ open, setOpen }}>{children}</AlertDialogContext.Provider>;
};

const AlertDialogTrigger = ({ asChild = false, children }) => {
  const { setOpen } = useAlertContext();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(true);
      },
    });
  }
  return <span onClick={() => setOpen(true)}>{children}</span>;
};

const AlertDialogPortal = ({ children }) => children;
const AlertDialogOverlay = () => null;

const AlertDialogContent = ({ children, width = 520, ...props }) => {
  const { open, setOpen } = useAlertContext();
  return (
    <Modal open={open} onCancel={() => setOpen(false)} footer={null} width={width} destroyOnClose {...props}>
      {children}
    </Modal>
  );
};

const AlertDialogHeader = ({ children, ...props }) => <div {...props}>{children}</div>;
const AlertDialogFooter = ({ children, ...props }) => (
  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }} {...props}>
    {children}
  </div>
);
const AlertDialogTitle = ({ children, ...props }) => <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }} {...props}>{children}</div>;
const AlertDialogDescription = ({ children, ...props }) => <div style={{ color: 'rgba(0,0,0,0.65)' }} {...props}>{children}</div>;

const AlertDialogAction = ({ children, onClick, ...props }) => {
  const { setOpen } = useAlertContext();
  return (
    <Button
      {...props}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
    >
      {children}
    </Button>
  );
};

const AlertDialogCancel = ({ children, onClick, ...props }) => {
  const { setOpen } = useAlertContext();
  return (
    <Button
      variant="outline"
      {...props}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
    >
      {children}
    </Button>
  );
};

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
