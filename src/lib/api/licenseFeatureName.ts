const FEATURE_NAME_KEYS: Record<string, string> = {
  'analytics.core': 'licenseFeatures.analyticsCore',
  'dashboard.core': 'licenseFeatures.dashboardCore',
  'deals.core': 'licenseFeatures.dealsCore',
  'contacts.core': 'licenseFeatures.contactsCore',
  'leads.core': 'licenseFeatures.leadsCore',
  'telephony.core': 'licenseFeatures.telephonyCore',
  'crm.leads': 'licenseFeatures.crmLeads',
  'crm.contacts': 'licenseFeatures.crmContacts',
  'crm.companies': 'licenseFeatures.crmCompanies',
  'crm.deals': 'licenseFeatures.crmDeals',
  'crm.products': 'licenseFeatures.crmProducts',
  'crm.payments': 'licenseFeatures.crmPayments',
  'tasks.core': 'licenseFeatures.tasksCore',
  'tasks.projects': 'licenseFeatures.tasksProjects',
  'tasks.reminders': 'licenseFeatures.tasksReminders',
  'tasks.memos': 'licenseFeatures.tasksMemos',
  'communications.voip': 'licenseFeatures.communicationsVoip',
  'communications.chat': 'licenseFeatures.communicationsChat',
  'communications.sms': 'licenseFeatures.communicationsSms',
  'communications.email': 'licenseFeatures.communicationsEmail',
  'marketing.campaigns': 'licenseFeatures.marketingCampaigns',
  'marketing.segments': 'licenseFeatures.marketingSegments',
  'marketing.templates': 'licenseFeatures.marketingTemplates',
  'integrations.core': 'licenseFeatures.integrationsCore',
  'inbox.unified': 'licenseFeatures.inboxUnified',
  'inbox.sla': 'licenseFeatures.inboxSla',
  'onboarding.wizard': 'licenseFeatures.onboardingWizard',
  'onboarding.checklist': 'licenseFeatures.onboardingChecklist',
  'reference.core': 'licenseFeatures.referenceCore',
  'settings.core': 'licenseFeatures.settingsCore',
  'users.core': 'licenseFeatures.usersCore',
  'help.center': 'licenseFeatures.helpCenter',
  'landing.builder': 'licenseFeatures.landingBuilder',
  'billing.invoicing': 'licenseFeatures.billingInvoicing',
  'billing.payments_reconciliation': 'licenseFeatures.billingPaymentsReconciliation',
  'inventory.lite': 'licenseFeatures.inventoryLite',
  'fulfillment.core': 'licenseFeatures.fulfillmentCore',
  'documents.core': 'licenseFeatures.documentsCore',
  'service.tickets': 'licenseFeatures.serviceTickets',
  'projects.delivery': 'licenseFeatures.projectsDelivery',
  'marketplace.registry': 'licenseFeatures.marketplaceRegistry',
  'marketplace.extensions': 'licenseFeatures.marketplaceExtensions',
  'partner.reseller': 'licenseFeatures.partnerReseller',
};

const FEATURE_FALLBACK_NAMES: Record<string, string> = {
  'analytics.core': 'Analytics',
  'dashboard.core': 'Dashboard',
  'deals.core': 'Deals',
  'contacts.core': 'Contacts',
  'leads.core': 'Leads',
  'telephony.core': 'Telephony',
  'crm.leads': 'Leads',
  'crm.contacts': 'Contacts',
  'crm.companies': 'Companies',
  'crm.deals': 'Deals',
  'crm.products': 'Products',
  'crm.payments': 'Payments',
  'tasks.core': 'Tasks',
  'tasks.projects': 'Projects',
  'tasks.reminders': 'Reminders',
  'tasks.memos': 'Notes',
  'communications.voip': 'Telephony',
  'communications.chat': 'Chats',
  'communications.sms': 'SMS',
  'communications.email': 'Email',
  'marketing.campaigns': 'Campaigns',
  'marketing.segments': 'Segments',
  'marketing.templates': 'Templates',
  'integrations.core': 'Integrations',
  'inbox.unified': 'Unified Inbox',
  'inbox.sla': 'Inbox SLA',
  'onboarding.wizard': 'Setup Wizard',
  'onboarding.checklist': 'Onboarding Checklist',
  'reference.core': 'Reference Data',
  'settings.core': 'Settings',
  'users.core': 'Users',
  'help.center': 'Help Center',
  'landing.builder': 'Landing Builder',
  'billing.invoicing': 'Invoicing',
  'billing.payments_reconciliation': 'Payment Reconciliation',
  'inventory.lite': 'Inventory Lite',
  'fulfillment.core': 'Fulfillment',
  'documents.core': 'Documents',
  'service.tickets': 'Service Tickets',
  'projects.delivery': 'Delivery Tracking',
  'marketplace.registry': 'Marketplace Registry',
  'marketplace.extensions': 'Extension Runtime',
  'partner.reseller': 'Partner Workflows',
};

const NAMESPACE_FALLBACKS: Record<string, string> = {
  crm: 'CRM',
  tasks: 'Tasks',
  communications: 'Communications',
  marketing: 'Marketing',
  analytics: 'Analytics',
  integrations: 'Integrations',
  settings: 'Settings',
  users: 'Users',
  help: 'Help',
  landing: 'Landing',
  reference: 'Reference',
};

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function fallbackFeatureName(featureCode: string): string {
  if (FEATURE_FALLBACK_NAMES[featureCode]) {
    return FEATURE_FALLBACK_NAMES[featureCode];
  }

  const [namespace = '', rawModule = ''] = featureCode.split('.');
  if (namespace && rawModule) {
    const namespaceName = NAMESPACE_FALLBACKS[namespace] || toTitleCase(namespace);
    const moduleName = toTitleCase(rawModule.replace(/[._-]+/g, ' '));
    return `${namespaceName} / ${moduleName}`;
  }

  return toTitleCase(
    featureCode
      .trim()
      .replace(/[._-]+/g, ' ')
  );
}

export function normalizeFeatureCode(featureCode: string): string {
  return String(featureCode || '').trim().toLowerCase();
}

export function resolveFeatureName(
  featureCode: string,
  translate: ((key: string) => string) | null | undefined
): string {
  const normalized = normalizeFeatureCode(featureCode);
  if (!normalized) return 'Unknown module';

  const i18nKey = FEATURE_NAME_KEYS[normalized];
  if (i18nKey && typeof translate === 'function') {
    const translated = translate(i18nKey);
    if (translated && translated !== i18nKey) {
      return translated;
    }
  }

  return fallbackFeatureName(normalized);
}

export default resolveFeatureName;
