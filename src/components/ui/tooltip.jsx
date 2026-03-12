import * as React from 'react';
import { Tooltip as AntTooltip } from 'antd';

const TooltipProvider = ({ children }) => children;

const Tooltip = ({ children }) => {
  const nodes = React.Children.toArray(children);
  const trigger = nodes.find((child) => child?.type?.displayName === 'TooltipTrigger');
  const content = nodes.find((child) => child?.type?.displayName === 'TooltipContent');

  if (!trigger) return null;

  return <AntTooltip title={content?.props?.children}>{trigger.props.children}</AntTooltip>;
};

const TooltipTrigger = ({ children }) => children;
TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = () => null;
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
