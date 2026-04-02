import type { CSSProperties, ReactNode } from 'react';

export type EditableCellType = 'text' | 'number' | 'select' | 'date' | 'textarea';

export interface EditableCellOption {
  value: string | number | null;
  label: ReactNode;
  disabled?: boolean;
}

export interface EditableCellProps {
  value: any;
  record: any;
  dataIndex: string;
  editable?: boolean;
  type?: EditableCellType;
  options?: EditableCellOption[];
  onSave?: (record: any, dataIndex: string, value: any) => Promise<void> | void;
  format?: (value: any, record: any) => ReactNode;
  renderView?: (value: any) => ReactNode;
  placeholder?: string;
  saveOnBlur?: boolean;
  inputProps?: Record<string, unknown>;
  style?: CSSProperties;
  className?: string;
}

export interface EditableColumn {
  editable?: boolean;
  dataIndex: string;
  editType?: EditableCellType;
  editOptions?: EditableCellOption[];
  format?: (value: any, record: any) => ReactNode;
  [key: string]: unknown;
}
