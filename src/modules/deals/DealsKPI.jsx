import React from 'react';
import { DealAnalyticsCard } from '../../components/analytics';

/**
 * DealsKPI - обертка для отображения аналитики сделок в модуле deals
 * Использует переиспользуемый компонент DealAnalyticsCard
 */
function DealsKPI({ deals = [] }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <DealAnalyticsCard 
        deals={deals}
        showStatistics={true}
        showStageChart={true}
        showManagerChart={true}
        showSourceChart={true}
        size="small"
        chartHeight={300}
      />
    </div>
  );
}

export default DealsKPI;
