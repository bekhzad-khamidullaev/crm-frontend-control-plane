import { Modal, Descriptions, Divider, Typography } from 'antd';
import { commonShortcuts, formatKeyCombo } from '../lib/hooks/useKeyboardShortcuts';

const { Title, Text } = Typography;

/**
 * KeyboardShortcutsHelp modal - displays all available keyboard shortcuts
 */
export default function KeyboardShortcutsHelp({ open, onClose }) {
  const shortcuts = {
    Navigation: [
      'ctrl+h',
      'ctrl+l',
      'ctrl+d',
      'ctrl+k',
    ],
    Actions: [
      'ctrl+n',
      'ctrl+s',
      'ctrl+e',
      'ctrl+f',
      'ctrl+r',
      'escape',
    ],
    Table: [
      'ctrl+a',
      'ctrl+shift+a',
    ],
    Help: [
      'ctrl+/',
      'ctrl+shift+/',
    ],
  };

  return (
    <Modal
      title="Keyboard Shortcuts"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Text type="secondary">
        Use these keyboard shortcuts to navigate and perform actions more efficiently.
      </Text>

      {Object.entries(shortcuts).map(([category, keys]) => (
        <div key={category}>
          <Divider orientation="left">
            <Title level={5}>{category}</Title>
          </Divider>
          
          <Descriptions column={1} bordered size="small">
            {keys.map(key => {
              const shortcut = commonShortcuts[key];
              if (!shortcut) return null;
              
              return (
                <Descriptions.Item
                  key={key}
                  label={
                    <kbd
                      style={{
                        padding: '2px 6px',
                        background: '#f5f5f5',
                        border: '1px solid #d9d9d9',
                        borderRadius: '3px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                      }}
                    >
                      {formatKeyCombo(key)}
                    </kbd>
                  }
                >
                  {shortcut.description}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
        </div>
      ))}

      <Divider />
      
      <Text type="secondary" style={{ fontSize: '12px' }}>
        Note: Some shortcuts may not work when focus is in an input field.
        Press <kbd>Esc</kbd> to exit input fields and use shortcuts.
      </Text>
    </Modal>
  );
}
