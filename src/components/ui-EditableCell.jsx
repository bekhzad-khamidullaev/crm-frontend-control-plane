import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Input, Select, DatePicker, InputNumber, Button, App } from 'antd';
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const valuesEqual = (left, right) => String(left) === String(right);

const normalizeOptionValue = (value, options = []) => {
  const matched = options.find((option) => valuesEqual(option?.value, value));
  return matched ? matched.value : value;
};

const normalizeDateValue = (raw) => {
  if (raw === null || raw === undefined || raw === '') return null;
  const date = dayjs(raw);
  return date.isValid() ? date.format('YYYY-MM-DD') : String(raw);
};

const normalizeComparableValue = (raw, type) => {
  if (type === 'date') return normalizeDateValue(raw);
  if (dayjs.isDayjs(raw)) return raw.toISOString();
  if (raw === null || raw === undefined || raw === '') return '';
  return String(raw);
};

export default function EditableCell({
  value: initialValue,
  record,
  dataIndex,
  editable = true,
  type = 'text',
  options = [],
  onSave,
  format,
  renderView,
  placeholder,
  saveOnBlur = true,
  inputProps = {},
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
    if (!editable) return;
    setEditing((prev) => !prev);
    setValue(initialValue);
  };

  const save = async () => {
    const normalizedCurrent = normalizeComparableValue(value, type);
    const normalizedInitial = normalizeComparableValue(initialValue, type);
    if (normalizedCurrent === normalizedInitial) {
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

  const renderInput = () => {
    const commonProps = {
      ref: inputRef,
      disabled: saving,
      size: 'small',
      onPressEnter: type !== 'textarea' ? save : undefined,
      onBlur: saveOnBlur ? save : undefined,
      ...inputProps,
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
            allowClear={inputProps.allowClear ?? true}
            showSearch={inputProps.showSearch ?? true}
            optionFilterProp="label"
            popupMatchSelectWidth={false}
            dropdownStyle={{ minWidth: 220, maxWidth: 360 }}
            style={{ width: '100%' }}
            options={options.map((option) => ({
              value: option.value,
              label: option.label,
              disabled: option.disabled,
            }))}
          />
        );

      case 'date':
        return (
          <DatePicker
            {...commonProps}
            value={value ? dayjs(value) : null}
            onChange={(date) => setValue(date)}
            format="DD.MM.YYYY"
            allowClear={inputProps.allowClear ?? true}
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

  if (editing) {
    return (
      <div
        className="crm-editable-cell crm-editable-cell--editing"
        style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%', ...restProps.style }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>{renderInput()}</div>
        <Button
          type="link"
          size="small"
          icon={<CheckOutlined />}
          onClick={save}
          onMouseDown={(event) => event.preventDefault()}
          loading={saving}
          style={{ color: '#52c41a', paddingInline: 4 }}
        />
        <Button
          type="link"
          size="small"
          icon={<CloseOutlined />}
          onClick={cancel}
          onMouseDown={(event) => event.preventDefault()}
          disabled={saving}
          danger
          style={{ paddingInline: 4 }}
        />
      </div>
    );
  }

  return (
    <div
      className="crm-editable-cell"
      style={{
        cursor: editable ? 'pointer' : 'default',
        padding: '4px 8px',
        borderRadius: 4,
        minHeight: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        width: '100%',
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
      <span style={{ flex: 1, minWidth: 0 }}>
        {renderView ? renderView(initialValue) : getDisplayValue()}
      </span>
      <EditOutlined className="crm-editable-cell__hint" />
    </div>
  );
}

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
