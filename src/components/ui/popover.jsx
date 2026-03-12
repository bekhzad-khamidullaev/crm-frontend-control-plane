import * as React from 'react';
import { Popover as AntPopover } from 'antd';

const PopoverContext = React.createContext(null);

function usePopoverContext() {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) {
    return { open: false, setOpen: () => {}, content: null, setContent: () => {} };
  }
  return ctx;
}

const Popover = ({ open: controlledOpen, onOpenChange, children }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const [content, setContent] = React.useState(null);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (next) => {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return <PopoverContext.Provider value={{ open, setOpen, content, setContent }}>{children}</PopoverContext.Provider>;
};

const PopoverTrigger = ({ asChild = false, children }) => {
  const { open, setOpen, content } = usePopoverContext();
  const triggerNode = asChild && React.isValidElement(children) ? children : <span>{children}</span>;

  return (
    <AntPopover
      open={open}
      onOpenChange={setOpen}
      content={content}
      trigger="click"
    >
      {triggerNode}
    </AntPopover>
  );
};

const PopoverAnchor = ({ children }) => children;

const PopoverContent = ({ children }) => {
  const { setContent } = usePopoverContext();
  React.useEffect(() => {
    setContent(children);
    return () => setContent(null);
  }, [children, setContent]);
  return null;
};

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
