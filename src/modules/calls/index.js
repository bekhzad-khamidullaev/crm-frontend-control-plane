/**
 * Calls Module
 * Main entry point for telephony functionality
 */

import CallsList from './CallsList.js';
import CallWidget from './CallWidget.js';

/**
 * Mount calls module
 * @param {HTMLElement} container - Container element
 * @param {Object} route - Route object
 */
export function mountCalls(container, route) {
  container.innerHTML = '';

  // Determine what to show based on route
  switch (route.name) {
    case 'calls-list':
      container.appendChild(CallsList());
      break;
    
    default:
      // Default to list view
      container.appendChild(CallsList());
  }
}

/**
 * Initialize global call widget
 * Shows a floating widget for making/receiving calls
 */
export function initCallWidget() {
  // Check if widget already exists
  if (document.querySelector('.call-widget-global')) {
    return;
  }

  const widget = CallWidget({ global: true });
  document.body.appendChild(widget);
}

export default mountCalls;
