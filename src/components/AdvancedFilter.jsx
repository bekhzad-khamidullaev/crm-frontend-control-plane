import { useState } from 'react';
import { Button, Space, Select, Input, DatePicker, InputNumber, Dropdown, Tag, Modal, Form, message } from 'antd';
import { FilterOutlined, PlusOutlined, DeleteOutlined, SaveOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

/**
 * AdvancedFilter component with multiple conditions and saved presets
 */
export default function AdvancedFilter({
  fields = [], // [{ name, label, type, options }]
  filters = {},
  onChange,
  savedPresets = [],
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
}) {
  const [visible, setVisible] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [saveModalVisible, setSaveModalVisible] = useState(false);

  const operators = {
    text: [
      { value: 'contains', label: 'Contains' },
      { value: 'equals', label: 'Equals' },
      { value: 'starts_with', label: 'Starts with' },
      { value: 'ends_with', label: 'Ends with' },
      { value: 'not_equals', label: 'Not equals' },
    ],
    number: [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not equals' },
      { value: 'greater_than', label: 'Greater than' },
      { value: 'less_than', label: 'Less than' },
      { value: 'between', label: 'Between' },
    ],
    date: [
      { value: 'equals', label: 'On date' },
      { value: 'before', label: 'Before' },
      { value: 'after', label: 'After' },
      { value: 'between', label: 'Between' },
      { value: 'last_7_days', label: 'Last 7 days' },
      { value: 'last_30_days', label: 'Last 30 days' },
      { value: 'this_month', label: 'This month' },
      { value: 'this_year', label: 'This year' },
    ],
    select: [
      { value: 'equals', label: 'Is' },
      { value: 'not_equals', label: 'Is not' },
      { value: 'in', label: 'Is any of' },
    ],
    boolean: [
      { value: 'equals', label: 'Is' },
    ],
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { id: Date.now(), field: '', operator: '', value: null },
    ]);
  };

  const updateCondition = (id, key, value) => {
    setConditions(
      conditions.map(c =>
        c.id === id ? { ...c, [key]: value } : c
      )
    );
  };

  const removeCondition = (id) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const applyFilters = () => {
    const newFilters = {};
    
    conditions.forEach(condition => {
      if (condition.field && condition.operator && condition.value !== null && condition.value !== '') {
        const key = `${condition.field}__${condition.operator}`;
        newFilters[key] = condition.value;
      }
    });

    onChange(newFilters);
    setVisible(false);
    message.success('Filters applied');
  };

  const clearFilters = () => {
    setConditions([]);
    onChange({});
    setVisible(false);
    message.success('Filters cleared');
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      message.error('Please enter a preset name');
      return;
    }

    const preset = {
      name: presetName,
      conditions: [...conditions],
    };

    onSavePreset(preset);
    setSaveModalVisible(false);
    setPresetName('');
    message.success('Filter preset saved');
  };

  const handleLoadPreset = (preset) => {
    setConditions(preset.conditions || []);
    message.success(`Loaded preset: ${preset.name}`);
  };

  const renderValueInput = (condition) => {
    const field = fields.find(f => f.name === condition.field);
    if (!field) return null;

    const commonProps = {
      value: condition.value,
      onChange: (value) => updateCondition(condition.id, 'value', value),
      style: { width: '100%' },
      placeholder: 'Enter value',
    };

    switch (field.type) {
      case 'number':
        if (condition.operator === 'between') {
          return (
            <Space.Compact style={{ width: '100%' }}>
              <InputNumber
                {...commonProps}
                value={condition.value?.[0]}
                onChange={(val) => updateCondition(condition.id, 'value', [val, condition.value?.[1]])}
                placeholder="Min"
              />
              <InputNumber
                {...commonProps}
                value={condition.value?.[1]}
                onChange={(val) => updateCondition(condition.id, 'value', [condition.value?.[0], val])}
                placeholder="Max"
              />
            </Space.Compact>
          );
        }
        return <InputNumber {...commonProps} />;

      case 'date':
        if (condition.operator === 'between') {
          return (
            <RangePicker
              {...commonProps}
              value={condition.value}
              onChange={(dates) => updateCondition(condition.id, 'value', dates)}
              format="DD/MM/YYYY"
            />
          );
        }
        if (['last_7_days', 'last_30_days', 'this_month', 'this_year'].includes(condition.operator)) {
          return <Tag color="blue">Auto-calculated</Tag>;
        }
        return (
          <DatePicker
            {...commonProps}
            value={condition.value ? dayjs(condition.value) : null}
            onChange={(date) => updateCondition(condition.id, 'value', date)}
            format="DD/MM/YYYY"
          />
        );

      case 'select':
        if (condition.operator === 'in') {
          return (
            <Select
              {...commonProps}
              mode="multiple"
              options={field.options}
              onChange={(value) => updateCondition(condition.id, 'value', value)}
            />
          );
        }
        return (
          <Select
            {...commonProps}
            options={field.options}
            onChange={(value) => updateCondition(condition.id, 'value', value)}
          />
        );

      case 'boolean':
        return (
          <Select
            {...commonProps}
            options={[
              { value: true, label: 'Yes' },
              { value: false, label: 'No' },
            ]}
            onChange={(value) => updateCondition(condition.id, 'value', value)}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
          />
        );
    }
  };

  const activeFilterCount = Object.keys(filters).length;

  const filterContent = (
    <div style={{ width: 600, padding: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {savedPresets.length > 0 && (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Saved Presets:</div>
            <Space wrap>
              {savedPresets.map(preset => (
                <Tag
                  key={preset.id}
                  color="blue"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleLoadPreset(preset)}
                  closable
                  onClose={(e) => {
                    e.preventDefault();
                    onDeletePreset(preset.id);
                  }}
                >
                  {preset.name}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>Filter Conditions:</div>
          {conditions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
              No conditions added. Click "Add Condition" to start.
            </div>
          ) : (
            conditions.map((condition, index) => (
              <Space key={condition.id} style={{ width: '100%', marginBottom: 8 }} align="start">
                {index > 0 && <Tag>AND</Tag>}
                <Select
                  placeholder="Field"
                  style={{ width: 150 }}
                  value={condition.field}
                  onChange={(value) => {
                    updateCondition(condition.id, 'field', value);
                    updateCondition(condition.id, 'operator', '');
                    updateCondition(condition.id, 'value', null);
                  }}
                >
                  {fields.map(field => (
                    <Select.Option key={field.name} value={field.name}>
                      {field.label}
                    </Select.Option>
                  ))}
                </Select>

                <Select
                  placeholder="Operator"
                  style={{ width: 130 }}
                  value={condition.operator}
                  onChange={(value) => {
                    updateCondition(condition.id, 'operator', value);
                    updateCondition(condition.id, 'value', null);
                  }}
                  disabled={!condition.field}
                >
                  {condition.field &&
                    operators[fields.find(f => f.name === condition.field)?.type || 'text']?.map(op => (
                      <Select.Option key={op.value} value={op.value}>
                        {op.label}
                      </Select.Option>
                    ))}
                </Select>

                <div style={{ flex: 1 }}>
                  {renderValueInput(condition)}
                </div>

                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeCondition(condition.id)}
                />
              </Space>
            ))
          )}
        </div>

        <Space>
          <Button icon={<PlusOutlined />} onClick={addCondition}>
            Add Condition
          </Button>
          {conditions.length > 0 && (
            <Button icon={<SaveOutlined />} onClick={() => setSaveModalVisible(true)}>
              Save as Preset
            </Button>
          )}
        </Space>

        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={clearFilters} icon={<CloseCircleOutlined />}>
            Clear All
          </Button>
          <Button type="primary" onClick={applyFilters}>
            Apply Filters
          </Button>
        </Space>
      </Space>

      <Modal
        title="Save Filter Preset"
        open={saveModalVisible}
        onOk={handleSavePreset}
        onCancel={() => setSaveModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="Preset Name">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter preset name"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );

  return (
    <Dropdown
      open={visible}
      onOpenChange={setVisible}
      trigger={['click']}
      dropdownRender={() => filterContent}
      placement="bottomLeft"
    >
      <Button icon={<FilterOutlined />}>
        Advanced Filters
        {activeFilterCount > 0 && (
          <Tag color="blue" style={{ marginLeft: 8 }}>
            {activeFilterCount}
          </Tag>
        )}
      </Button>
    </Dropdown>
  );
}
