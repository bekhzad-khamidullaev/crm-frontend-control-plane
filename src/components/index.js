// Minimal exports to fix white screen
// React components with default exports only

// Core React components
export { default as CallButton } from './CallButton.jsx';
export { default as SendSMSModal } from './SendSMSModal.jsx';
export { default as BulkSMSModal } from './BulkSMSModal.jsx';
export { default as ActiveCallWidget } from './ActiveCallWidget.jsx';
export { default as AudioPlayer } from './AudioPlayer.jsx';
export { default as ChatMessageItem } from './ChatMessageItem.jsx';
export { default as ChatMessageComposer } from './ChatMessageComposer.jsx';
export { default as IntegrationCard } from './IntegrationCard.jsx';
export { default as FacebookConnect } from './FacebookConnect.jsx';
export { default as InstagramConnect } from './InstagramConnect.jsx';
export { default as TelegramConnect } from './TelegramConnect.jsx';
export { default as TelephonySettings } from './TelephonySettings.jsx';
export { default as VoIPConnectionsList } from './VoIPConnectionsList.jsx';
export { default as SMSSettings } from './SMSSettings.jsx';
export { CallsActivityChart, CallsDistributionChart, CallsStatusChart, CallsDurationChart } from './CallsCharts.jsx';

// UI Components (React with default exports)
export { default as ReferenceSelect } from './ui-ReferenceSelect.jsx';
export { default as BulkActions } from './ui-BulkActions.jsx';
export { default as ClickToCall } from './ui-ClickToCall.jsx';
export { default as CallControls } from './ui-CallControls.jsx';
export { default as CallTimer } from './ui-CallTimer.jsx';
export { default as ChatInput } from './ui-ChatInput.jsx';
export { default as ChatMessage } from './ui-ChatMessage.jsx';
export { default as Layout } from './ui-Layout.jsx';

// Widgets
export { default as RemindersWidget } from './RemindersWidget.jsx';
export { default as PaymentsWidget } from './PaymentsWidget.jsx';
export { default as MemosWidget } from './MemosWidget.jsx';
export { default as CampaignsWidget } from './CampaignsWidget.jsx';
export { default as RevenueChart } from './RevenueChart.jsx';

// Analytics components
export { default as AnalyticsCard } from './analytics/AnalyticsCard.jsx';
export { default as PredictionChart } from './analytics/PredictionChart.jsx';
export { default as AnalyticsStatusBanner } from './analytics/AnalyticsStatusBanner.jsx';

// Advanced features (commented out for now - use direct imports)
// export { default as ExportButton } from './ExportButton.jsx';
// export { default as ImportModal } from './ImportModal.jsx';
// export { default as ActivityLog } from './ActivityLog.jsx';
// export { default as QuickActions } from './QuickActions.jsx';
// export { default as AdvancedFilter } from './AdvancedFilter.jsx';
// export { default as KeyboardShortcutsHelp } from './KeyboardShortcutsHelp.jsx';
// export { default as EditableCell } from './ui-EditableCell.jsx';
