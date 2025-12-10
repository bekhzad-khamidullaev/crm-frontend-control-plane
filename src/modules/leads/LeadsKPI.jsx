import React from 'react';
import { LeadAnalyticsCard } from '../../components/analytics';

/**
 * LeadsKPI - обертка для отображения аналитики лидов в модуле leads
 * Использует переиспользуемый компонент LeadAnalyticsCard
 */
function LeadsKPI({ leads = [] }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <LeadAnalyticsCard 
        leads={leads}
        showStatistics={true}
        showStatusChart={true}
        showSourceChart={true}
        showFunnelChart={true}
        size="small"
        chartHeight={300}
      />
    </div>
  );
}

export default LeadsKPI;
