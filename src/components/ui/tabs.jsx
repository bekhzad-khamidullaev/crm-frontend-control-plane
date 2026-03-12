import * as React from 'react';
import { Tabs as AntTabs } from 'antd';

const Tabs = ({ value, defaultValue, onValueChange, children, ...props }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const activeKey = value ?? internalValue;

  const listChild = React.Children.toArray(children).find((child) => child?.type?.displayName === 'TabsList');
  const contentChildren = React.Children.toArray(children).filter((child) => child?.type?.displayName === 'TabsContent');

  const triggers = listChild
    ? React.Children.toArray(listChild.props.children).filter((child) => child?.type?.displayName === 'TabsTrigger')
    : [];

  const items = triggers.map((trigger) => {
    const matchedContent = contentChildren.find((content) => content.props.value === trigger.props.value);
    return {
      key: String(trigger.props.value),
      label: trigger.props.children,
      disabled: !!trigger.props.disabled,
      children: matchedContent ? matchedContent.props.children : null,
    };
  });

  return (
    <AntTabs
      activeKey={activeKey ? String(activeKey) : items[0]?.key}
      onChange={(nextKey) => {
        if (value === undefined) setInternalValue(nextKey);
        onValueChange?.(nextKey);
      }}
      items={items}
      {...props}
    />
  );
};
Tabs.displayName = 'Tabs';

const TabsList = ({ children }) => children;
TabsList.displayName = 'TabsList';

const TabsTrigger = () => null;
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = () => null;
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
