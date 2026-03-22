import React from 'react';
import { Tooltip } from 'antd';
import { t } from '../lib/i18n/index.js';
import { getFeatureRestrictionReason } from '../lib/api/licenseRestrictionState.js';

function buildRestrictionTitle(reason, feature) {
  const normalizedReason = String(reason || '').trim();
  if (normalizedReason) return normalizedReason;

  if (!String(feature || '').trim()) {
    return t(
      'licenseRestrictedAction.defaultReason',
      'Действие недоступно по текущей лицензии',
    );
  }
  return getFeatureRestrictionReason(feature, t);
}

export default function LicenseRestrictedAction({
  restricted = false,
  reason = '',
  feature = '',
  block = false,
  placement = 'top',
  children,
}) {
  if (!React.isValidElement(children)) {
    return children;
  }

  if (!restricted) {
    return children;
  }

  const title = buildRestrictionTitle(reason, feature);
  const child = React.cloneElement(children, {
    disabled: true,
    'aria-disabled': true,
  });

  return (
    <Tooltip title={title} placement={placement}>
      <div
        style={{
          display: block ? 'block' : 'inline-block',
          width: block ? '100%' : undefined,
          cursor: 'not-allowed',
        }}
      >
        {child}
      </div>
    </Tooltip>
  );
}
