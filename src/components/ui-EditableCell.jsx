import { useState, useEffect, useRef } from 'react';
import { Input, InputNumber, Select, DatePicker, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

/**
 * EditableCell component for inline table editing
 * Supports text, number, select, and date fields with auto-save
 */
export default function EditableCell({
  value: initialValue,
  record,
  dataIndex,
  editable = true,
  type = 'text', // text, number, select, date
  options = [], // for select type
  onSave,
  format, // function to format display value
  ...restProps
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
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
      message.success('Updated successfully');
    } catch (error) {
      console.error('Save error:', error);
      message.error('Failed to update');
      setValue(initialValue);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setValue(initialValue);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      save();
    } else if (e.key === 'Escape') {
      cancel();
    }
  };

  const renderInput = () => {
    const commonProps = {
      ref: inputRef,
      value,
      onChange: (e) => setValue(e?.target?.value ?? e),
      onBlur: save,
      onKeyDown: handleKeyDown,
      disabled: saving,
      size: 'small',
      style: { width: '100%' },
    };

    switch (type) {
      case 'number':
        return (
          <InputNumber
            {...commonProps}
            onChange={(val) => setValue(val)}
          />
        );
      
      case 'select':
        return (
          <Select
            {...commonProps}
            ref={inputRef}
            onChange={(val) => setValue(val)}
            options={options}
            showSearch
            optionFilterProp="label"
          />
        );
      
      case 'date':
        return (
          <DatePicker
            {...commonProps}
            ref={inputRef}
            value={value ? dayjs(value) : null}
            onChange={(date) => setValue(date ? date.format('YYYY-MM-DD') : null)}
            format="DD/MM/YYYY"
          />
        );
      
      case 'textarea':
        return (
          <Input.TextArea
            {...commonProps}
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
        );
      
      default:
        return <Input {...commonProps} />;
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
      const option = options.find(opt => opt.value === value);
      return option ? option.label : value;
    }

    return value ?? '-';
  };

  if (!editable) {
    return (
      <div {...restProps}>
        {getDisplayValue()}
      </div>
    );
  }

  return editing ? (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} {...restProps}>
      {renderInput()}
      <CheckOutlined
        style={{ color: '#52c41a', cursor: 'pointer' }}
        onClick={save}
      />
      <CloseOutlined
        style={{ color: '#ff4d4f', cursor: 'pointer' }}
        onClick={cancel}
      />
    </div>
  ) : (
    <div
      {...restProps}
      style={{
        cursor: editable ? 'pointer' : 'default',
        padding: '4px 8px',
        borderRadius: '4px',
        minHeight: '32px',
        display: 'flex',
        alignItems: 'center',
        ...restProps.style,
      }}
      onClick={toggleEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          toggleEdit();
        }
      }}
      tabIndex={editable ? 0 : -1}
      role="button"
      aria-label="Click to edit"
    >
      {getDisplayValue()}
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
