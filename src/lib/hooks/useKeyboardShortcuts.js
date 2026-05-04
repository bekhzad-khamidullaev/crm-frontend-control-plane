import { useEffect, useCallback } from 'react';

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} shortcuts - Map of key combinations to callbacks
 * @param {boolean} enabled - Enable/disable shortcuts
 */
export default function useKeyboardShortcuts(shortcuts = {}, enabled = true) {
  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) return;

      // Build key combination string
      const parts = [];
      if (event.ctrlKey || event.metaKey) parts.push('ctrl');
      if (event.shiftKey) parts.push('shift');
      if (event.altKey) parts.push('alt');
      
      // Get the actual key (lowercase)
      const key = event.key.toLowerCase();
      if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
        parts.push(key);
      }

      const combination = parts.join('+');

      // Check if this combination has a handler
      const handler = shortcuts[combination];
      if (handler && typeof handler === 'function') {
        // Don't trigger if user is typing in an input
        const activeElement = document.activeElement;
        const isInput = 
          activeElement &&
          (activeElement.tagName === 'INPUT' ||
           activeElement.tagName === 'TEXTAREA' ||
           activeElement.contentEditable === 'true');

        // Allow Escape key even in inputs
        if (!isInput || key === 'escape') {
          event.preventDefault();
          handler(event);
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}

/**
 * Common keyboard shortcuts configuration
 */
export const commonShortcuts = {
  // Navigation
  'ctrl+h': { label: 'Go to Dashboard', description: 'Navigate to dashboard' },
  'ctrl+l': { label: 'Go to Leads', description: 'Navigate to leads list' },
  'ctrl+d': { label: 'Go to Deals', description: 'Navigate to deals list' },
  'ctrl+k': { label: 'Go to Contacts', description: 'Navigate to contacts list' },
  
  // Actions
  'ctrl+n': { label: 'New', description: 'Create new item' },
  'ctrl+s': { label: 'Save', description: 'Save current form' },
  'ctrl+e': { label: 'Edit', description: 'Edit current item' },
  'ctrl+f': { label: 'Search', description: 'Focus search field' },
  'ctrl+/': { label: 'Help', description: 'Show keyboard shortcuts' },
  'ctrl+shift+/': { label: 'Help', description: 'Show keyboard shortcuts (alt)' },
  'escape': { label: 'Cancel/Close', description: 'Close modal or cancel action' },
  
  // Table actions
  'ctrl+a': { label: 'Select All', description: 'Select all rows in table' },
  'ctrl+shift+a': { label: 'Deselect All', description: 'Clear selection' },
  
  // Refresh
  'ctrl+r': { label: 'Refresh', description: 'Reload current data' },
};

/**
 * Format key combination for display
 * @param {string} combination - Key combination (e.g., 'ctrl+s')
 * @returns {string} Formatted string (e.g., 'Ctrl + S')
 */
export function formatKeyCombo(combination) {
  return combination
    .split('+')
    .map(key => {
      const map = {
        ctrl: '⌘/Ctrl',
        shift: 'Shift',
        alt: 'Alt',
        escape: 'Esc',
      };
      return map[key] || key.toUpperCase();
    })
    .join(' + ');
}
