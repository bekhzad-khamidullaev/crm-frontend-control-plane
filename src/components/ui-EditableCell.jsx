import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Input, Select, DatePicker, InputNumber, Button, App } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const valuesEqual = (left, right) => String(left) === String(right);

const normalizeOptionValue = (value, options = []) => {
  const matched = options.find((option) => valuesEqual(option?.value, value));
  return matched ? matched.value : value;
};

/**
 * EditableCell component for inline table editing
 * Supports text, number, select, and date fields with auto-save
 */
export default function EditableCell({
  value: initialValue,
  record,
  dataIndex,
  editable = true,
  type = 'text', // text, number, select, date, textarea
  options = [], // for select type
  onSave,
  format, // function to format display value
  renderView, // custom render function for view mode
  placeholder,
  ...restProps
}) {
  const { message } = App.useApp();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus?.();
    }
  }, [editing]);

  const toggleEdit = () => {
    if (editable) {
      setEditing(!editing);
      setValue(initialValue);
    }
  };

  const save = async () => {
    if (value === initialValue) {
      setEditing(false);
      return;
    }

    try {
      setSaving(true);
      await onSave(record, dataIndex, value);
      setEditing(false);
      message.success('Сохранено');
    } catch (error) {
      console.error('Save error:', error);
      message.error('Ошибка сохранения');
      setValue(initialValue);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setValue(initialValue);
    setEditing(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && type !== 'textarea') {
      save();
    } else if (event.key === 'Escape') {
      cancel();
    }
  };

  const renderInput = () => {
    const commonProps = {
      ref: inputRef,
      disabled: saving,
      size: 'small',
      onPressEnter: type !== 'textarea' ? save : undefined,
      onBlur: save,
    };

    switch (type) {
      case 'number':
        return (
          <InputNumber
            {...commonProps}
            value={value}
            onChange={(val) => setValue(val)}
            style={{ width: '100%' }}
          />
        );

      case 'select':
        return (
          <Select
            {...commonProps}
            value={normalizeOptionValue(value, options) ?? undefined}
            onChange={(val) => setValue(val)}
            placeholder={placeholder || 'Выберите...'}
            style={{ width: '100%' }}
          >
            {options.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );

      case 'date':
        return (
          <DatePicker
            {...commonProps}
            value={value ? dayjs(value) : null}
            onChange={(date) => setValue(date)}
            format="DD.MM.YYYY"
            style={{ width: '100%' }}
          />
        );

      case 'textarea':
        return (
          <TextArea
            {...commonProps}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={2}
            onPressEnter={undefined}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
          />
        );
    }
  };

  const getDisplayValue = () => {
    if (format && typeof format === 'function') {
      return format(value, record);
    }

    if (type === 'date' && value) {
      return dayjs(value).format('DD/MM/YYYY');
    }

    if (type === 'select' && options.length > 0) {
      const option = options.find((opt) => valuesEqual(opt?.value, value));
      return option ? option.label : value;
    }

    return value ?? '-';
  };

  if (!editable) {
    return <div style={restProps.style}>{renderView ? renderView(initialValue) : getDisplayValue()}</div>;
  }

  return editing ? (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', ...restProps.style }}>
      <div style={{ flex: 1 }}>{renderInput()}</div>
      <Button
        type="link"
        size="small"
        icon={<CheckOutlined />}
        onClick={save}
        loading={saving}
        style={{ color: '#52c41a' }}
      />
      <Button
        type="link"
        size="small"
        icon={<CloseOutlined />}
        onClick={cancel}
        disabled={saving}
        danger
      />
    </div>
  ) : (
    <div
      style={{
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: 4,
        minHeight: 32,
        display: 'flex',
        alignItems: 'center',
        ...restProps.style,
      }}
      onClick={toggleEdit}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          toggleEdit();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label="Click to edit"
    >
      {renderView ? renderView(initialValue) : getDisplayValue()}
    </div>
  );
}

/**
 * HOC to make a column editable
 * @param {Object} column - Ant Design table column config
 * @param {Function} onSave - Save callback
 * @returns {Object} Enhanced column config
 */
export function makeEditable(column, onSave) {
  return {
    ...column,
    onCell: (record) => ({
      record,
      editable: column.editable !== false,
      dataIndex: column.dataIndex,
      type: column.editType || 'text',
      options: column.editOptions || [],
      onSave,
      format: column.format,
    }),
  };
}
