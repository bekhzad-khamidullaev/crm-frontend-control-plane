import { App, Button, DatePicker, Input, InputNumber, Select } from 'antd';
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import type { EditableCellOption, EditableCellProps, EditableColumn } from './interface';


const { TextArea } = Input;

const valuesEqual = (left: unknown, right: unknown): boolean => String(left) === String(right);

const normalizeOptionValue = (value: unknown, options: EditableCellOption[] = []): unknown => {
  const matched = options.find((option) => valuesEqual(option?.value, value));
  return matched ? matched.value : value;
};

const normalizeDateValue = (raw: unknown): string | null => {
  if (raw === null || raw === undefined || raw === '') return null;
  const date = dayjs(raw as string);
  return date.isValid() ? date.format('YYYY-MM-DD') : String(raw);
};

const normalizeComparableValue = (raw: unknown, type: EditableCellProps['type']): string => {
  if (type === 'date') return normalizeDateValue(raw) ?? '';
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
  style,
  className,
}: EditableCellProps) {
  const { message } = App.useApp();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<unknown>(initialValue);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<any>(null);

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

  const cancel = () => {
    setValue(initialValue);
    setEditing(false);
  };

  const save = async (nextValue: unknown = value) => {
    const normalizedCurrent = normalizeComparableValue(nextValue, type);
    const normalizedInitial = normalizeComparableValue(initialValue, type);
    if (normalizedCurrent === normalizedInitial) {
      setEditing(false);
      return;
    }

    if (!onSave) {
      setEditing(false);
      return;
    }

    try {
      setSaving(true);
      await onSave(record, dataIndex, nextValue);
      setEditing(false);
      message.success('Сохранено');
    } catch (error) {
      console.error('EditableCell save error:', error);
      message.error('Ошибка сохранения');
      setValue(initialValue);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = () => {
    const commonProps: Record<string, unknown> = {
      ref: inputRef,
      disabled: saving,
      size: 'small',
      onPressEnter: type !== 'textarea' ? () => save() : undefined,
      onBlur: saveOnBlur && type !== 'date' ? () => save() : undefined,
      ...inputProps,
    };

    if (type === 'number') {
      return (
        <InputNumber
          {...commonProps}
          value={value as number | null}
          onChange={(val) => setValue(val)}
          style={{ width: '100%' }}
        />
      );
    }

    if (type === 'select') {
      return (
        <Select
          {...commonProps}
          value={normalizeOptionValue(value, options) as string | number | undefined}
          onChange={(val) => setValue(val)}
          placeholder={placeholder || 'Выберите...'}
          allowClear={(inputProps.allowClear as boolean | undefined) ?? true}
          showSearch={(inputProps.showSearch as boolean | undefined) ?? true}
          optionFilterProp="label"
          popupMatchSelectWidth={false}
          styles={{ popup: { root: { minWidth: 220, maxWidth: 360 } } }}
          style={{ width: '100%' }}
          options={options.map((option) => ({
            value: option.value as string | number,
            label: option.label,
            disabled: option.disabled,
          }))}
        />
      );
    }

    if (type === 'date') {
      return (
        <DatePicker
          {...commonProps}
          value={value ? dayjs(value as string) : null}
          onChange={(date: Dayjs | null) => {
            setValue(date);
            if (saveOnBlur) {
              void save(date);
            }
          }}
          format="DD.MM.YYYY"
          allowClear={(inputProps.allowClear as boolean | undefined) ?? true}
          style={{ width: '100%' }}
        />
      );
    }

    if (type === 'textarea') {
      return (
        <TextArea
          {...commonProps}
          value={(value as string) ?? ''}
          onChange={(event) => setValue(event.target.value)}
          rows={2}
          onPressEnter={undefined}
        />
      );
    }

    return (
      <Input
        {...commonProps}
        value={(value as string) ?? ''}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
      />
    );
  };

  const displayValue = (() => {
    if (format) return format(value, record);

    if (type === 'date' && value) {
      const date = dayjs(value as string);
      return date.isValid() ? date.format('DD/MM/YYYY') : '-';
    }

    if (type === 'select' && options.length > 0) {
      const option = options.find((opt) => valuesEqual(opt?.value, value));
      return option ? option.label : (value as string);
    }

    return (value as string | number | null | undefined) ?? '-';
  })();

  if (!editable) {
    return <div style={style}>{renderView ? renderView(initialValue) : displayValue}</div>;
  }

  if (editing) {
    return (
      <div
        className="crm-editable-cell crm-editable-cell--editing"
        style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%', ...style }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>{renderInput()}</div>
        <Button
          type="text"
          size="small"
          icon={<CheckOutlined />}
          onClick={() => save()}
          onMouseDown={(event) => event.preventDefault()}
          loading={saving}
          style={{ color: '#52c41a' }}
        />
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={cancel}
          onMouseDown={(event) => event.preventDefault()}
          disabled={saving}
          danger
        />
      </div>
    );
  }

  return (
    <div
      className={`crm-editable-cell ${className || ''}`.trim()}
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
        ...style,
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
      <span style={{ flex: 1, minWidth: 0 }}>{renderView ? renderView(initialValue) : displayValue}</span>
      <EditOutlined className="crm-editable-cell__hint" />
    </div>
  );
}

export function makeEditable(
  column: EditableColumn,
  onSave: (record: any, dataIndex: string, value: any) => Promise<void> | void,
) {
  return {
    ...column,
    onCell: (record: any) => ({
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
