/**
 * Predictions API - AI/ML predictions endpoints
 */

import { get, post } from './client.js';

/**
 * Clients predictions
 */
export const clientsPredictions = {
  // Get forecast for clients
  forecast: (params) => get('/api/predictions/clients/forecast/', { params }),
  
  // Predict client behavior
  predict: (payload) => post('/api/predictions/clients/predict/', { body: payload }),
};

/**
 * Leads predictions
 */
export const leadsPredictions = {
  // Get forecast for leads
  forecast: (params) => get('/api/predictions/leads/forecast/', { params }),
  
  // Predict lead conversion
  predict: (payload) => post('/api/predictions/leads/predict/', { body: payload }),
};

/**
 * Next actions predictions
 */
export const nextActionsPredictions = {
  // Get next actions for clients
  clients: (params) => get('/api/predictions/next-actions/clients/', { params }),
  
  // Predict next actions for clients
  predictClients: (payload) => post('/api/predictions/next-actions/clients/predict/', { body: payload }),
  
  // Get next actions for deals
  deals: (params) => get('/api/predictions/next-actions/deals/', { params }),
  
  // Predict next actions
  predict: (payload) => post('/api/predictions/next-actions/predict/', { body: payload }),
};

/**
 * Revenue predictions
 */
export const revenuePredictions = {
  // Get revenue forecast
  forecast: (params) => get('/api/predictions/revenue/forecast/', { params }),
  
  // Predict revenue
  predict: (payload) => post('/api/predictions/revenue/predict/', { body: payload }),
};

/**
 * General predictions
 */
export const predictions = {
  // Predict all metrics at once
  predictAll: (payload) => post('/api/predictions/predict-all/', { body: payload }),
  
  // Get prediction status
  status: () => get('/api/predictions/status/'),
  
  // Nested APIs
  clients: clientsPredictions,
  leads: leadsPredictions,
  nextActions: nextActionsPredictions,
  revenue: revenuePredictions,
};

export default predictions;
