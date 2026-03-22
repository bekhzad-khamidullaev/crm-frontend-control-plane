import { Alert, Button, Result, Space, Typography } from 'antd';
import resolveFeatureName from '../lib/api/licenseFeatureName.ts';
import { t } from '../lib/i18n/index.js';

const { Text } = Typography;

export default function LicenseRestrictedResult({ restriction, onBack }) {
  const featureCode = String(restriction?.feature || 'unknown.feature').trim();
  const featureName = resolveFeatureName(featureCode, t);
  const title = t('licenseRestrictedResult.title') === 'licenseRestrictedResult.title'
    ? 'Feature unavailable by license'
    : t('licenseRestrictedResult.title');
  const subtitle = t('licenseRestrictedResult.subtitle', { feature: featureName }) === 'licenseRestrictedResult.subtitle'
    ? `The current license does not include ${featureName}.`
    : t('licenseRestrictedResult.subtitle', { feature: featureName });
  const helper = t('licenseRestrictedResult.helper') === 'licenseRestrictedResult.helper'
    ? 'Navigation hides restricted modules proactively, but direct links still explain which entitlement is missing.'
    : t('licenseRestrictedResult.helper');

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="warning"
        showIcon
        message={title}
        description={(
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text>{subtitle}</Text>
            <Text type="secondary">{helper}</Text>
          </Space>
        )}
        style={{
          borderRadius: 16,
          border: '1px solid rgba(217, 119, 6, 0.28)',
        }}
      />
      <Result
        status="403"
        title={title}
        subTitle={subtitle}
        extra={(
          <Button type="primary" onClick={onBack}>
            {t('licenseRestrictedResult.back') === 'licenseRestrictedResult.back'
              ? 'Back to Dashboard'
              : t('licenseRestrictedResult.back')}
          </Button>
        )}
      />
    </Space>
  );
}

