import { Alert, Space, Typography } from 'antd';
import type { BusinessFeatureGateNoticeProps } from './interface';
import './index.css';

const { Text } = Typography;

export default function BusinessFeatureGateNotice({
  featureCode,
  title = 'Раздел недоступен по лицензии',
  description = 'Запросите включение модуля в текущий тариф или обратитесь к администратору лицензии.',
}: BusinessFeatureGateNoticeProps) {
  return (
    <div className="component_BusinessFeatureGateNotice_root">
      <Alert
        type="warning"
        showIcon
        message={title}
        description={
          <Space direction="vertical" size={2} className="component_BusinessFeatureGateNotice_body">
            <Text>{description}</Text>
            <Text type="secondary" code>
              {featureCode}
            </Text>
          </Space>
        }
      />
    </div>
  );
}
