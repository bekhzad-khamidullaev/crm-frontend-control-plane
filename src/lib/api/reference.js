/**
 * Reference Data API
 * 
 * Справочные данные для всей CRM системы:
 * - Stages (этапы сделок)
 * - Task Stages (этапы задач)
 * - Project Stages (этапы проектов)
 * - Lead Sources (источники лидов)
 * - Industries (отрасли)
 * - Countries (страны)
 * - Cities (города)
 * - Currencies (валюты)
 * - Client Types (типы клиентов)
 * - Closing Reasons (причины закрытия)
 * - Resolutions (резолюции memo)
 * - Departments (отделы)
 * - CRM Tags (теги)
 * - Task Tags (теги задач)
 */

import { api } from './client.js';

function makeCrud(path) {
  return {
    create: (payload) => api.post(path, { body: payload }),
    update: (id, payload) => api.put(`${path}${id}/`, { body: payload }),
    patch: (id, payload) => api.patch(`${path}${id}/`, { body: payload }),
    remove: (id) => api.delete(`${path}${id}/`),
  };
}

// ============================================================================
// Stages (этапы сделок)
// ============================================================================

/**
 * Get all deal stages
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getStages(params = {}) {
  return api.get('/api/stages/', { params });
}

/**
 * Get single stage by ID
 * @param {number} id - Stage ID
 * @returns {Promise<Object>}
 */
export async function getStage(id) {
  return api.get(`/api/stages/${id}/`);
}
export const stageCrud = makeCrud('/api/stages/');

// ============================================================================
// Task Stages (этапы задач)
// ============================================================================

/**
 * Get all task stages
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getTaskStages(params = {}) {
  return api.get('/api/task-stages/', { params });
}

/**
 * Get single task stage by ID
 * @param {number} id - Task stage ID
 * @returns {Promise<Object>}
 */
export async function getTaskStage(id) {
  return api.get(`/api/task-stages/${id}/`);
}
export const taskStageCrud = makeCrud('/api/task-stages/');

// ============================================================================
// Project Stages (этапы проектов)
// ============================================================================

/**
 * Get all project stages
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getProjectStages(params = {}) {
  return api.get('/api/project-stages/', { params });
}

/**
 * Get single project stage by ID
 * @param {number} id - Project stage ID
 * @returns {Promise<Object>}
 */
export async function getProjectStage(id) {
  return api.get(`/api/project-stages/${id}/`);
}
export const projectStageCrud = makeCrud('/api/project-stages/');

// ============================================================================
// Lead Sources (источники лидов)
// ============================================================================

/**
 * Get all lead sources
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getLeadSources(params = {}) {
  return api.get('/api/lead-sources/', { params });
}

/**
 * Get single lead source by ID
 * @param {number} id - Lead source ID
 * @returns {Promise<Object>}
 */
export async function getLeadSource(id) {
  return api.get(`/api/lead-sources/${id}/`);
}
export const leadSourceCrud = makeCrud('/api/lead-sources/');

// ============================================================================
// Industries (отрасли)
// ============================================================================

/**
 * Get all industries
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getIndustries(params = {}) {
  return api.get('/api/industries/', { params });
}

/**
 * Get single industry by ID
 * @param {number} id - Industry ID
 * @returns {Promise<Object>}
 */
export async function getIndustry(id) {
  return api.get(`/api/industries/${id}/`);
}
export const industryCrud = makeCrud('/api/industries/');

// ============================================================================
// Countries (страны)
// ============================================================================

/**
 * Get all countries
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getCountries(params = {}) {
  return api.get('/api/countries/', { params });
}

/**
 * Get single country by ID
 * @param {number} id - Country ID
 * @returns {Promise<Object>}
 */
export async function getCountry(id) {
  return api.get(`/api/countries/${id}/`);
}
export const countryCrud = makeCrud('/api/countries/');

// ============================================================================
// Cities (города)
// ============================================================================

/**
 * Get all cities
 * @param {Object} params - Query parameters (можно фильтровать по country)
 * @returns {Promise<Object>}
 */
export async function getCities(params = {}) {
  return api.get('/api/cities/', { params });
}

/**
 * Get single city by ID
 * @param {number} id - City ID
 * @returns {Promise<Object>}
 */
export async function getCity(id) {
  return api.get(`/api/cities/${id}/`);
}
export const cityCrud = makeCrud('/api/cities/');

// ============================================================================
// Currencies (валюты)
// ============================================================================

/**
 * Get all currencies
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getCurrencies(params = {}) {
  return api.get('/api/currencies/', { params });
}

/**
 * Get single currency by ID
 * @param {number} id - Currency ID
 * @returns {Promise<Object>}
 */
export async function getCurrency(id) {
  return api.get(`/api/currencies/${id}/`);
}

/**
 * Get currency exchange rates
 * @param {number} id - Currency ID
 * @returns {Promise<Object>}
 */
export async function getCurrencyRates(id) {
  return api.get(`/api/currencies/${id}/rates/`);
}
export const currencyCrud = makeCrud('/api/currencies/');

// ============================================================================
// Client Types (типы клиентов)
// ============================================================================

/**
 * Get all client types
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getClientTypes(params = {}) {
  return api.get('/api/client-types/', { params });
}

/**
 * Get single client type by ID
 * @param {number} id - Client type ID
 * @returns {Promise<Object>}
 */
export async function getClientType(id) {
  return api.get(`/api/client-types/${id}/`);
}
export const clientTypeCrud = makeCrud('/api/client-types/');

// ============================================================================
// Closing Reasons (причины закрытия)
// ============================================================================

/**
 * Get all closing reasons
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getClosingReasons(params = {}) {
  return api.get('/api/closing-reasons/', { params });
}

/**
 * Get single closing reason by ID
 * @param {number} id - Closing reason ID
 * @returns {Promise<Object>}
 */
export async function getClosingReason(id) {
  return api.get(`/api/closing-reasons/${id}/`);
}
export const closingReasonCrud = makeCrud('/api/closing-reasons/');

// ============================================================================
// Memo Resolutions
// ============================================================================

/**
 * Get all memo resolutions
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getResolutions(params = {}) {
  return api.get('/api/resolutions/', { params });
}

/**
 * Get single memo resolution by ID
 * @param {number} id - Resolution ID
 * @returns {Promise<Object>}
 */
export async function getResolution(id) {
  return api.get(`/api/resolutions/${id}/`);
}
export const resolutionCrud = makeCrud('/api/resolutions/');

// ============================================================================
// Departments (отделы)
// ============================================================================

/**
 * Get all departments
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getDepartments(params = {}) {
  return api.get('/api/departments/', { params });
}

/**
 * Get single department by ID
 * @param {number} id - Department ID
 * @returns {Promise<Object>}
 */
export async function getDepartment(id) {
  return api.get(`/api/departments/${id}/`);
}

/**
 * Get department members
 * @param {number} id - Department ID
 * @returns {Promise<Object>}
 */
export async function getDepartmentMembers(id) {
  return api.get(`/api/departments/${id}/members/`);
}
export const departmentCrud = makeCrud('/api/departments/');

// ============================================================================
// CRM Tags (теги)
// ============================================================================

/**
 * Get all CRM tags
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getCrmTags(params = {}) {
  return api.get('/api/crm-tags/', { params });
}

/**
 * Get single CRM tag by ID
 * @param {number} id - Tag ID
 * @returns {Promise<Object>}
 */
export async function getCrmTag(id) {
  return api.get(`/api/crm-tags/${id}/`);
}
export const crmTagCrud = makeCrud('/api/crm-tags/');

// ============================================================================
// Task Tags (теги задач)
// ============================================================================

/**
 * Get all task tags
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getTaskTags(params = {}) {
  return api.get('/api/task-tags/', { params });
}

/**
 * Get single task tag by ID
 * @param {number} id - Task tag ID
 * @returns {Promise<Object>}
 */
export async function getTaskTag(id) {
  return api.get(`/api/task-tags/${id}/`);
}
export const taskTagCrud = makeCrud('/api/task-tags/');

// ============================================================================
// Utility Functions (вспомогательные функции)
// ============================================================================

/**
 * Load all reference data at once (для инициализации приложения)
 * @returns {Promise<Object>} - Объект со всеми справочниками
 */
export async function loadAllReferenceData() {
  try {
    const [
      stages,
      taskStages,
      projectStages,
      leadSources,
      industries,
      countries,
      currencies,
      clientTypes,
      closingReasons,
      resolutions,
      departments,
      crmTags,
      taskTags,
    ] = await Promise.all([
      getStages(),
      getTaskStages(),
      getProjectStages(),
      getLeadSources(),
      getIndustries(),
      getCountries(),
      getCurrencies(),
      getClientTypes(),
      getClosingReasons(),
      getResolutions(),
      getDepartments(),
      getCrmTags(),
      getTaskTags(),
    ]);

    return {
      stages: stages.results || stages,
      taskStages: taskStages.results || taskStages,
      projectStages: projectStages.results || projectStages,
      leadSources: leadSources.results || leadSources,
      industries: industries.results || industries,
      countries: countries.results || countries,
      currencies: currencies.results || currencies,
      clientTypes: clientTypes.results || clientTypes,
      closingReasons: closingReasons.results || closingReasons,
      resolutions: resolutions.results || resolutions,
      departments: departments.results || departments,
      crmTags: crmTags.results || crmTags,
      taskTags: taskTags.results || taskTags,
    };
  } catch (error) {
    console.error('Error loading reference data:', error);
    throw error;
  }
}

/**
 * Get cities by country ID
 * @param {number} countryId - Country ID
 * @returns {Promise<Object>}
 */
export async function getCitiesByCountry(countryId) {
  return getCities({ country: countryId });
}
