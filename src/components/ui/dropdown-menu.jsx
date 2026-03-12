import * as React from 'react';
import { Dropdown } from 'antd';

const DropdownMenuContext = React.createContext(null);

function useDropdownContext() {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) {
    return { items: [], setItems: () => {} };
  }
  return ctx;
}

const DropdownMenu = ({ children }) => {
  const [items, setItems] = React.useState([]);
  return <DropdownMenuContext.Provider value={{ items, setItems }}>{children}</DropdownMenuContext.Provider>;
};

const DropdownMenuTrigger = ({ asChild = false, children }) => {
  const { items } = useDropdownContext();

  const childNode = asChild && React.isValidElement(children) ? children : <span>{children}</span>;

  return (
    <Dropdown trigger={['click']} menu={{ items }}>
      {childNode}
    </Dropdown>
  );
};

const DropdownMenuContent = ({ children }) => {
  const { setItems } = useDropdownContext();

  React.useEffect(() => {
    let idx = 0;
    const parsed = React.Children.toArray(children)
      .map((child) => {
        if (!child || !child.type) return null;

        if (child.type.displayName === 'DropdownMenuSeparator') {
          idx += 1;
          return { type: 'divider', key: `divider-${idx}` };
        }

        if (child.type.displayName === 'DropdownMenuLabel') {
          idx += 1;
          return { type: 'group', key: `label-${idx}`, label: child.props.children, disabled: true };
        }

        if (child.type.displayName === 'DropdownMenuItem') {
          idx += 1;
          const itemKey = `item-${idx}`;
          return {
            key: itemKey,
            label: child.props.children,
            danger: child.props.className?.includes('destructive'),
            disabled: !!child.props.disabled,
            onClick: child.props.onClick,
          };
        }

        return null;
      })
      .filter(Boolean);

    setItems(parsed);
  }, [children, setItems]);

  return null;
};

const DropdownMenuItem = () => null;
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuCheckboxItem = () => null;
const DropdownMenuRadioItem = () => null;

const DropdownMenuLabel = () => null;
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuSeparator = () => null;
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

const DropdownMenuShortcut = ({ children }) => children;

const DropdownMenuGroup = ({ children }) => children;
const DropdownMenuPortal = ({ children }) => children;
const DropdownMenuSub = ({ children }) => children;
const DropdownMenuSubContent = ({ children }) => children;
const DropdownMenuSubTrigger = ({ children }) => children;
const DropdownMenuRadioGroup = ({ children }) => children;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
