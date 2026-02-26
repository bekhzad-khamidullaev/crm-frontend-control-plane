/**
 * Shipments API
 * 
 * Управление отгрузками товаров
 */

import { api } from './client.js';

// ============================================================================
// Shipments (отгрузки)
// ============================================================================

/**
 * Get all shipments
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {string} params.status - Filter by status
 * @param {number} params.deal - Filter by deal ID
 * @param {string} params.date_from - Filter from date (YYYY-MM-DD)
 * @param {string} params.date_to - Filter to date (YYYY-MM-DD)
 * @param {string} params.ordering - Sort field
 * @returns {Promise<Object>}
 */
export async function getShipments(params = {}) {
  return api.get('/api/shipments/', { params });
}

/**
 * Get single shipment by ID
 * @param {number} id - Shipment ID
 * @returns {Promise<Object>}
 */
export async function getShipment(id) {
  return api.get(`/api/shipments/${id}/`);
}

/**
 * Create new shipment
 * @param {Object} data - Shipment data
 * @param {string} data.tracking_number - Tracking number
 * @param {number} data.deal - Related deal ID
 * @param {string} data.status - Status (pending, in_transit, delivered, cancelled)
 * @param {string} data.shipped_date - Shipment date (YYYY-MM-DD)
 * @param {string} data.estimated_delivery - Estimated delivery date
 * @param {string} data.actual_delivery - Actual delivery date
 * @param {string} data.carrier - Carrier/shipping company
 * @param {string} data.shipping_address - Shipping address
 * @param {Array} data.items - Shipment items
 * @returns {Promise<Object>}
 */
export async function createShipment(data) {
  return api.post('/api/shipments/', { body: data });
}

/**
 * Update shipment (full update)
 * @param {number} id - Shipment ID
 * @param {Object} data - Shipment data
 * @returns {Promise<Object>}
 */
export async function updateShipment(id, data) {
  return api.put(`/api/shipments/${id}/`, { body: data });
}

/**
 * Partially update shipment
 * @param {number} id - Shipment ID
 * @param {Object} data - Partial shipment data
 * @returns {Promise<Object>}
 */
export async function patchShipment(id, data) {
  return api.patch(`/api/shipments/${id}/`, { body: data });
}

/**
 * Delete shipment
 * @param {number} id - Shipment ID
 * @returns {Promise<void>}
 */
export async function deleteShipment(id) {
  return api.delete(`/api/shipments/${id}/`);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get shipments by deal
 * @param {number} dealId - Deal ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getShipmentsByDeal(dealId, params = {}) {
  return getShipments({ ...params, deal: dealId });
}

/**
 * Get shipments by status
 * @param {string} status - Shipment status
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getShipmentsByStatus(status, params = {}) {
  return getShipments({ ...params, status });
}

/**
 * Get pending shipments
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getPendingShipments(params = {}) {
  return getShipmentsByStatus('pending', params);
}

/**
 * Get in transit shipments
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getInTransitShipments(params = {}) {
  return getShipmentsByStatus('in_transit', params);
}

/**
 * Get delivered shipments
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getDeliveredShipments(params = {}) {
  return getShipmentsByStatus('delivered', params);
}

/**
 * Mark shipment as in transit
 * @param {number} id - Shipment ID
 * @returns {Promise<Object>}
 */
export async function markShipmentInTransit(id) {
  return patchShipment(id, { status: 'in_transit' });
}

/**
 * Mark shipment as delivered
 * @param {number} id - Shipment ID
 * @param {string} deliveryDate - Actual delivery date (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
export async function markShipmentDelivered(id, deliveryDate) {
  return patchShipment(id, {
    status: 'delivered',
    actual_delivery: deliveryDate || new Date().toISOString().split('T')[0],
  });
}

/**
 * Cancel shipment
 * @param {number} id - Shipment ID
 * @returns {Promise<Object>}
 */
export async function cancelShipment(id) {
  return patchShipment(id, { status: 'cancelled' });
}

/**
 * Update tracking number
 * @param {number} id - Shipment ID
 * @param {string} trackingNumber - New tracking number
 * @returns {Promise<Object>}
 */
export async function updateTrackingNumber(id, trackingNumber) {
  return patchShipment(id, { tracking_number: trackingNumber });
}
