import * as React from 'react';
import { Modal } from 'antd';

const DialogContext = React.createContext(null);

function useDialogContext() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) {
    return { open: false, setOpen: () => {} };
  }
  return ctx;
}

const Dialog = ({ open: controlledOpen, onOpenChange, children }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (next) => {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
};

const DialogTrigger = ({ asChild = false, children }) => {
  const { setOpen } = useDialogContext();
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

const DialogPortal = ({ children }) => children;
const DialogOverlay = () => null;

const DialogContent = ({ children, width = 640, ...props }) => {
  const { open, setOpen } = useDialogContext();
  return (
    <Modal open={open} onCancel={() => setOpen(false)} footer={null} width={width} destroyOnClose {...props}>
      {children}
    </Modal>
  );
};

const DialogClose = ({ asChild = false, children }) => {
  const { setOpen } = useDialogContext();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(false);
      },
    });
  }
  return <button onClick={() => setOpen(false)}>{children || 'Close'}</button>;
};

const DialogHeader = ({ children, ...props }) => <div {...props}>{children}</div>;
const DialogFooter = ({ children, ...props }) => <div style={{ marginTop: 16 }} {...props}>{children}</div>;
const DialogTitle = ({ children, ...props }) => <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }} {...props}>{children}</div>;
const DialogDescription = ({ children, ...props }) => <div style={{ color: 'rgba(0,0,0,0.65)', marginBottom: 12 }} {...props}>{children}</div>;

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
