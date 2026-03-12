import * as React from 'react';
import { Select as AntSelect } from 'antd';

const SelectContext = React.createContext(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) {
    return {
      value: undefined,
      setValue: () => {},
      options: [],
      setOptions: () => {},
      placeholder: undefined,
      setPlaceholder: () => {},
      disabled: false,
    };
  }
  return ctx;
}

const Select = ({ value: controlledValue, defaultValue, onValueChange, disabled = false, children }) => {
  const [value, setValueState] = React.useState(defaultValue);
  const [options, setOptions] = React.useState([]);
  const [placeholder, setPlaceholder] = React.useState(undefined);

  const currentValue = controlledValue ?? value;

  const setValue = (next) => {
    if (controlledValue === undefined) setValueState(next);
    onValueChange?.(next);
  };

  return (
    <SelectContext.Provider
      value={{ value: currentValue, setValue, options, setOptions, placeholder, setPlaceholder, disabled }}
    >
      {children}
    </SelectContext.Provider>
  );
};

const SelectGroup = ({ children }) => children;

const SelectValue = ({ placeholder }) => {
  const { setPlaceholder } = useSelectContext();
  React.useEffect(() => {
    setPlaceholder(placeholder);
  }, [placeholder, setPlaceholder]);
  return null;
};

const SelectTrigger = React.forwardRef((props, ref) => {
  const { value, setValue, options, placeholder, disabled } = useSelectContext();

  return (
    <AntSelect
      ref={ref}
      value={value}
      options={options}
      onChange={setValue}
      placeholder={placeholder}
      style={{ width: '100%' }}
      disabled={disabled}
      {...props}
    />
  );
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = ({ children }) => {
  const { setOptions } = useSelectContext();

  React.useEffect(() => {
    const parsed = React.Children.toArray(children)
      .filter((child) => child?.type?.displayName === 'SelectItem')
      .map((child) => ({
        value: child.props.value,
        label: child.props.children,
        disabled: !!child.props.disabled,
      }));

    setOptions(parsed);
  }, [children, setOptions]);

  return null;
};

const SelectLabel = () => null;

const SelectItem = () => null;
SelectItem.displayName = 'SelectItem';

const SelectSeparator = () => null;
const SelectScrollUpButton = () => null;
const SelectScrollDownButton = () => null;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
