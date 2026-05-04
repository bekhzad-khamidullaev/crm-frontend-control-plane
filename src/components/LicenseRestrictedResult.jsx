import { Alert, Button, Result, Space, Typography } from 'antd';
import { getLicenseRestrictionMessage } from '../lib/api/licenseRestrictionState.js';
import { isBannerLicensePolicy } from '../lib/licenseUiPolicy.js';
import { t } from '../lib/i18n/index.js';

const { Text } = Typography;

export default function LicenseRestrictedResult({ restriction, onBack }) {
  const copy = getLicenseRestrictionMessage(restriction, t);
  const deniedTitle =
    t('licenseRestrictedResult.title') === 'licenseRestrictedResult.title'
      ? `Доступ запрещён: ${copy.message}`
      : t('licenseRestrictedResult.title');
  const helper = isBannerLicensePolicy()
    ? 'Раздел отображается в интерфейсе, но недоступен до включения нужного модуля в лицензии.'
    : restriction?.code === 'LICENSE_FEATURE_DISABLED'
      ? 'Navigation hides restricted modules proactively, but direct links still explain which entitlement is missing.'
      : 'Current license state blocks access to this module until the license issue is resolved.';

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="warning"
        showIcon
        message={copy.message}
        description={
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text>{copy.description}</Text>
            <Text type="secondary">{helper}</Text>
          </Space>
        }
        style={{
          borderRadius: 16,
          border: '1px solid rgba(217, 119, 6, 0.28)',
        }}
      />
      <Result
        status="403"
        title={deniedTitle}
        subTitle={copy.description}
        extra={
          <Button type="primary" onClick={onBack}>
            {t('licenseRestrictedResult.back') === 'licenseRestrictedResult.back'
              ? 'Back to Dashboard'
              : t('licenseRestrictedResult.back')}
          </Button>
        }
      />
    </Space>
  );
}
