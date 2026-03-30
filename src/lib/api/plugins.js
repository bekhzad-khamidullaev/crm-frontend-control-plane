import { api } from "./client.js";

export const marketplaceApi = {
  listExtensions: (params = {}) => api.get("/api/settings/marketplace/extensions/", { params }),
  moduleCatalog: () => api.get("/api/settings/marketplace/extensions/module-catalog/"),
  installExtension: (manifest) =>
    api.post("/api/settings/marketplace/extensions/install/", { body: { manifest } }),
  upgradeExtension: (id, manifest) =>
    api.post(`/api/settings/marketplace/extensions/${id}/upgrade/`, { body: { manifest } }),
  uninstallExtension: (id) =>
    api.post(`/api/settings/marketplace/extensions/${id}/uninstall/`, { body: {} }),
  extensionDiagnostics: (id) => api.get(`/api/settings/marketplace/extensions/${id}/diagnostics/`),
  compatibilityMatrix: () => api.get("/api/settings/marketplace/extensions/compatibility-matrix/"),
};

export const moduleTypeMeta = {
  email: { key: "email", title: "Email", description: "SMTP и email-платформы" },
  messaging: { key: "messaging", title: "Messaging", description: "Мессенджеры и чат-каналы" },
  social: { key: "social", title: "Social", description: "Социальные сети" },
  telephony: { key: "telephony", title: "Telephony", description: "PBX/VoIP и телефония" },
  analytics: { key: "analytics", title: "Analytics", description: "BI и экспорт аналитики" },
  automation: { key: "automation", title: "Automation", description: "Автоматизация и workflow" },
  payments: { key: "payments", title: "Payments", description: "Платежные интеграции" },
  storage: { key: "storage", title: "Storage", description: "Файловые хранилища" },
  other: { key: "other", title: "Other", description: "Прочие модули интеграций" },
};

const MODULE_TYPE_ORDER = [
  "email",
  "messaging",
  "social",
  "telephony",
  "analytics",
  "automation",
  "payments",
  "storage",
  "other",
];

export function normalizeModuleType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "other";
  if (moduleTypeMeta[normalized]) return normalized;
  if (normalized.includes("mail")) return "email";
  if (normalized.includes("chat") || normalized.includes("message")) return "messaging";
  if (normalized.includes("social")) return "social";
  if (normalized.includes("call") || normalized.includes("telephony") || normalized.includes("pbx")) return "telephony";
  if (normalized.includes("analytic") || normalized.includes("bi")) return "analytics";
  if (normalized.includes("automat")) return "automation";
  if (normalized.includes("pay")) return "payments";
  if (normalized.includes("storage") || normalized.includes("drive")) return "storage";
  return "other";
}

export function groupModulesByType(modules = []) {
  const buckets = MODULE_TYPE_ORDER.reduce((acc, type) => ({ ...acc, [type]: [] }), {});
  (Array.isArray(modules) ? modules : []).forEach((item) => {
    const type = normalizeModuleType(item?.type || item?.manifest?.type || item?.category);
    buckets[type].push(item);
  });
  return MODULE_TYPE_ORDER
    .map((type) => ({
      type,
      title: moduleTypeMeta[type]?.title || type,
      description: moduleTypeMeta[type]?.description || "",
      items: buckets[type] || [],
    }))
    .filter((section) => section.items.length > 0);
}

export default marketplaceApi;
