import { api } from "./client.js";

export const marketplaceApi = {
  listExtensions: (params = {}) => api.get("/api/settings/marketplace/extensions/", { params }),
  installExtension: (manifest) =>
    api.post("/api/settings/marketplace/extensions/install/", { body: { manifest } }),
  upgradeExtension: (id, manifest) =>
    api.post(`/api/settings/marketplace/extensions/${id}/upgrade/`, { body: { manifest } }),
  uninstallExtension: (id) =>
    api.post(`/api/settings/marketplace/extensions/${id}/uninstall/`, { body: {} }),
  extensionDiagnostics: (id) => api.get(`/api/settings/marketplace/extensions/${id}/diagnostics/`),
  compatibilityMatrix: () => api.get("/api/settings/marketplace/extensions/compatibility-matrix/"),
};

export default marketplaceApi;

