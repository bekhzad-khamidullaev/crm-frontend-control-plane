/**
 * Centralized API exports
 * 
 * Единая точка импорта для всех API модулей
 * 
 * Usage:
 * import { auth, leads, contacts } from '@/lib/api';
 * 
 * Or import specific functions:
 * import { getLeads, createLead } from '@/lib/api';
 */

// Core
// export * as client from './client.js';
// export * as auth from './auth.js';

// Analytics & Dashboard
// export * as analytics from './analytics.js';

// Users & Profiles
// export * as user from './user.js';

// CRM Core Entities - only export functions that actually exist in client.js
export { 
  getLeads, 
  getLead, 
  createLead, 
  updateLead, 
  deleteLead,
} from './client.js';

export {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} from './client.js';

export {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} from './client.js';

export {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
} from './client.js';

export {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from './client.js';

export {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from './client.js';

export {
  getUsers,
  getUser,
} from './client.js';

// Communication
// export * as calls from './calls.js';
// export * as chat from './chat.js';
// export * as telephony from './telephony.js';
// export * as emails from './emails.js';

// Reference Data (справочники)
// export * as reference from './reference.js';

// Business Entities
// export * as products from './products.js';
// export * as payments from './payments.js';
// export * as shipments from './shipments.js';
// export * as outputs from './outputs.js';
// export * as requests from './requests.js';

// Marketing & Mass Mail
// export * as marketing from './marketing.js';
// export * as massmail from './massmail.js';

// Organization
// export * as memos from './memos.js';
// export * as reminders from './reminders.js';

// Utilities
// export * as exportApi from './export.js';
// export * as help from './help.js';

// Integrations (опционально, если используются)
// export * as facebook from './integrations/facebook.js';
// export * as instagram from './integrations/instagram.js';
// export * as telegram from './integrations/telegram.js';

/**
 * Convenience function to initialize all reference data
 * Useful for app initialization
 */
export { loadAllReferenceData } from './reference.js';

/**
 * Re-export commonly used functions for convenience
 */

// From reference.js
export {
  getStages,
  getTaskStages,
  getProjectStages,
  getLeadSources,
  getIndustries,
  getCountries,
  getCities,
  getCurrencies,
  getClientTypes,
  getClosingReasons,
  getDepartments,
  getCrmTags,
  getTaskTags,
} from './reference.js';

// From products.js
export {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
  searchProducts,
} from './products.js';

// From payments.js
export {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentSummary,
  getPaymentsThisMonth,
} from './payments.js';

// From marketing.js
export {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  activateCampaign,
  pauseCampaign,
  getSegments,
  getTemplates,
} from './marketing.js';

// From memos.js
export {
  getMemos,
  getMemo,
  createMemo,
  updateMemo,
  deleteMemo,
  markMemoPostponed,
  markMemoReviewed,
  getMemosByStage,
  getMemosByRecipient,
} from './memos.js';

// From reminders.js
export {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  getUpcomingReminders,
  getRemindersByOwner,
  markReminderCompleted,
  snoozeReminder,
} from './reminders.js';

// From emails.js
export {
  getCrmEmails,
  getCrmEmail,
  createCrmEmail,
  deleteCrmEmail,
  getEmailsByContact,
  getEmailsByLead,
  getIncomingEmails,
  getOutgoingEmails,
  sendEmailToContact,
  replyToEmail,
} from './emails.js';

// From massmail.js
export {
  getEmailAccounts,
  getMailings,
  getMessages,
  getSignatures,
  createEmailAccount,
  createMessage,
  createSignature,
} from './massmail.js';

// From calls.js
export {
  getCallLogs,
  getCallLog,
  getVoipCallLogs,
  getVoipCallLog,
  createCallLog,
  updateCallLog,
  deleteCallLog,
  addCallNote,
  getEntityCallLogs,
  getCompanyCallLogs,
  getDealCallLogs,
  getCallStatistics,
  getCrmCallStatistics,
} from './calls.js';

// From chat.js
export {
  getChatMessages,
  getChatMessage,
  createChatMessage,
  updateChatMessage,
  deleteChatMessage,
  getMessageThread,
  getEntityChatMessages,
  getChatStatistics,
  getUnreadCount,
} from './chat.js';

// From user.js
export {
  getUsers as getUsersDirectory,
  getProfiles,
  getProfileByUser,
  getUserSessions,
  revokeAllSessions,
  get2FAStatus,
} from './user.js';

/**
 * Default export: object with all API modules
 * Commented out to avoid issues with undefined imports
 */
// export default {
//   client,
//   auth,
//   analytics,
//   user,
//   calls,
//   chat,
//   telephony,
//   reference,
//   products,
//   payments,
//   shipments,
//   outputs,
//   requests,
//   marketing,
//   massmail,
//   emails,
//   memos,
//   reminders,
//   exportApi,
//   help,
// };

// NEW: AI/ML Predictions API
export * from './predictions.js';

// NEW: SMS API
export * from './sms.js';

// NEW: Settings API
export * from './settings.js';
