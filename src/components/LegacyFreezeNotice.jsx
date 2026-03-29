import { Alert, Button, Result, Space, Typography } from 'antd';
import { useEffect, useMemo } from 'react';
import { getControlPlaneTargetUrl, getLegacyFreezeCopy } from '../lib/controlPlaneRedirect.js';

const { Text } = Typography;
const normalizePath = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '/dashboard';
  return raw.startsWith('/') ? raw : `/${raw}`;
};

export default function LegacyFreezeNotice({ freezeType }) {
  const copy = useMemo(() => getLegacyFreezeCopy(freezeType), [freezeType]);
  const controlPlaneTargetUrl = useMemo(
    () => getControlPlaneTargetUrl(copy.targetPath),
    [copy.targetPath]
  );
  const localTargetUrl = useMemo(() => {
    if (!copy.localTargetPath || typeof window === 'undefined') return null;
    const targetPath = normalizePath(copy.localTargetPath);
    return `${window.location.origin}${window.location.pathname}${window.location.search}#${targetPath}`;
  }, [copy.localTargetPath]);
  const targetUrl = controlPlaneTargetUrl || localTargetUrl;

  useEffect(() => {
    if (!targetUrl) return undefined;
    const timer = window.setTimeout(() => {
      window.location.replace(targetUrl);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [targetUrl]);

  return (
    <Result
      status="warning"
      title={copy.title}
      subTitle={
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Alert
            type="warning"
            showIcon
            message={copy.bannerMessage || 'Legacy frontend frozen'}
            description={copy.description}
          />
          {targetUrl ? (
            <Text type="secondary">Automatic redirect target: {targetUrl}</Text>
          ) : controlPlaneTargetUrl ? null : (
            <Text type="secondary">
              Set `VITE_CONTROL_PLANE_BASE_URL` or `window.__APP_CONFIG__.controlPlaneBaseUrl` to enable automatic redirect.
            </Text>
          )}
        </Space>
      }
      extra={
        <Space wrap>
          <Button type="primary" href={targetUrl || undefined} disabled={!targetUrl}>
            {copy.ctaLabel}
          </Button>
          <Button onClick={() => targetUrl && window.location.replace(targetUrl)} disabled={!targetUrl}>
            Redirect now
          </Button>
        </Space>
      }
    />
  );
}
