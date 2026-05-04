/**
 * Products API
 * 
 * Управление продуктами и категориями товаров
 */

import { api } from './client.js';

// ============================================================================
// Products (продукты)
// ============================================================================

/**
 * Get all products
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @param {string} params.search - Search query
 * @param {number} params.product_category - Filter by product category ID
 * @param {string} params.ordering - Sort field (e.g., 'name', '-price')
 * @returns {Promise<Object>}
 */
export async function getProducts(params = {}) {
  return api.get('/api/products/', { params });
}

/**
 * Get single product by ID
 * @param {number} id - Product ID
 * @returns {Promise<Object>}
 */
export async function getProduct(id) {
  return api.get(`/api/products/${id}/`);
}

/**
 * Create new product
 * @param {Object} data - Product data
 * @param {string} data.name - Product name (required)
 * @param {string} data.sku - Stock Keeping Unit
 * @param {string} data.description - Product description
 * @param {number} data.price - Price (required)
 * @param {string} data.currency - Currency code
 * @param {number} data.product_category - Product category ID
 * @param {number} data.stock_quantity - Stock quantity
 * @param {string} data.unit - Unit of measure
 * @param {boolean} data.is_active - Is product active
 * @returns {Promise<Object>}
 */
export async function createProduct(data) {
  return api.post('/api/products/', { body: data });
}

/**
 * Update product (full update)
 * @param {number} id - Product ID
 * @param {Object} data - Product data
 * @returns {Promise<Object>}
 */
export async function updateProduct(id, data) {
  return api.put(`/api/products/${id}/`, { body: data });
}

/**
 * Partially update product
 * @param {number} id - Product ID
 * @param {Object} data - Partial product data
 * @returns {Promise<Object>}
 */
export async function patchProduct(id, data) {
  return api.patch(`/api/products/${id}/`, { body: data });
}

/**
 * Delete product
 * @param {number} id - Product ID
 * @returns {Promise<void>}
 */
export async function deleteProduct(id) {
  return api.delete(`/api/products/${id}/`);
}

// ============================================================================
// Product Categories (категории продуктов)
// ============================================================================

/**
 * Get all product categories
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getProductCategories(params = {}) {
  return api.get('/api/product-categories/', { params });
}

/**
 * Get single product category by ID
 * @param {number} id - Category ID
 * @returns {Promise<Object>}
 */
export async function getProductCategory(id) {
  return api.get(`/api/product-categories/${id}/`);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get products by category
 * @param {number} categoryId - Category ID
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function getProductsByCategory(categoryId, params = {}) {
  return getProducts({ ...params, product_category: categoryId });
}

/**
 * Search products by name or SKU
 * @param {string} query - Search query
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>}
 */
export async function searchProducts(query, params = {}) {
  return getProducts({ ...params, search: query });
}

/**
 * Get active products only
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function getActiveProducts(params = {}) {
  return getProducts({ ...params, on_sale: true });
}

/**
 * Update product stock quantity
 * @param {number} id - Product ID
 * @param {number} quantity - New stock quantity
 * @returns {Promise<Object>}
 */
export async function updateProductStock(id, quantity) {
  return patchProduct(id, { stock_quantity: quantity });
}

/**
 * Toggle product active status
 * @param {number} id - Product ID
 * @param {boolean} onSale - On sale status
 * @returns {Promise<Object>}
 */
export async function toggleProductStatus(id, onSale) {
  return patchProduct(id, { on_sale: onSale });
}
