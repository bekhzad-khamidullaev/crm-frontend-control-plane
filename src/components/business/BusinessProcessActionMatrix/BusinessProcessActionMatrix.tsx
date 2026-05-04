import { Alert, Grid, Space, Tag, Typography } from 'antd';
import type { BusinessProcessActionMatrixProps } from './interface';
import './index.css';

const { Text } = Typography;

function permissionTag(label: string, enabled: boolean) {
  return (
    <Tag
      className="component_BusinessProcessActionMatrix_actionTag"
      color={enabled ? 'success' : 'default'}
    >
      {label}: {enabled ? 'доступно' : 'ограничено'}
    </Tag>
  );
}

export default function BusinessProcessActionMatrix({
  canCreateTemplate,
  canEditTemplate,
  canLaunchTemplate,
  canAdvanceInstance,
  canCancelInstance,
}: BusinessProcessActionMatrixProps) {
  const screens = Grid.useBreakpoint();
  const isRestricted = !(
    canCreateTemplate &&
    canEditTemplate &&
    canLaunchTemplate &&
    canAdvanceInstance &&
    canCancelInstance
  );

  return (
    <div className="component_BusinessProcessActionMatrix_root">
      <Alert
        type={isRestricted ? 'warning' : 'success'}
        showIcon
        message={
          isRestricted
            ? 'Часть действий ограничена правами роли'
            : 'Доступ к действиям модуля открыт'
        }
        description={
          <Space
            className="component_BusinessProcessActionMatrix_actions"
            direction="vertical"
            size={6}
          >
            <Text type="secondary">
              Проверка выполняется на backend. Интерфейс показывает доступные действия для вашей роли.
            </Text>
            <Space size={6} wrap={!isRestricted || !screens.sm}>
              {permissionTag('Создание шаблонов', canCreateTemplate)}
              {permissionTag('Редактирование шаблонов', canEditTemplate)}
              {permissionTag('Запуск экземпляров', canLaunchTemplate)}
              {permissionTag('Продвижение шага', canAdvanceInstance)}
              {permissionTag('Отмена экземпляра', canCancelInstance)}
            </Space>
          </Space>
        }
      />
    </div>
  );
}
