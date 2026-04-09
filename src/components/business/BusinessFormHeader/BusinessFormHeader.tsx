import { Button, Grid, Typography } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import type { BusinessFormHeaderProps } from './interface';
import './index.css';

const { Title, Text } = Typography;

export default function BusinessFormHeader({
  title,
  subtitle,
  formId,
  submitLabel,
  backLabel = 'Назад',
  isSubmitting = false,
  onBack,
  submitIcon,
}: BusinessFormHeaderProps) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  return (
    <div className="component_BusinessFormHeader_root">
      <div
        className={[
          'component_BusinessFormHeader_topRow',
          isMobile ? 'component_BusinessFormHeader_topRow_mobile' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          className="component_BusinessFormHeader_backButton"
          block={isMobile}
        >
          {backLabel}
        </Button>
        <Button
          type="primary"
          icon={submitIcon || <SaveOutlined />}
          htmlType="submit"
          form={formId}
          loading={isSubmitting}
          className="component_BusinessFormHeader_submitButton"
          block={isMobile}
        >
          {submitLabel}
        </Button>
      </div>

      <div>
        <Title level={isMobile ? 3 : 2} className="component_BusinessFormHeader_title">
          {title}
        </Title>
        {subtitle ? (
          <Text type="secondary" className="component_BusinessFormHeader_subtitle">
            {subtitle}
          </Text>
        ) : null}
      </div>
    </div>
  );
}

