import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing filter state with localStorage persistence
 * @param {string} storageKey - Key for localStorage
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Filter state and methods
 */
export default function useFilters(storageKey, initialFilters = {}) {
  const [filters, setFilters] = useState(() => {
    // Try to load from localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : initialFilters;
    } catch (error) {
      console.error('Failed to load filters from localStorage:', error);
      return initialFilters;
    }
  });

  const [savedPresets, setSavedPresets] = useState(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}_presets`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save filters to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch (error) {
      console.error('Failed to save filters to localStorage:', error);
    }
  }, [filters, storageKey]);

  // Save presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${storageKey}_presets`, JSON.stringify(savedPresets));
    } catch (error) {
      console.error('Failed to save presets to localStorage:', error);
    }
  }, [savedPresets, storageKey]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const savePreset = useCallback((name) => {
    const preset = {
      id: Date.now().toString(),
      name,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };

    setSavedPresets(prev => [...prev, preset]);
    return preset;
  }, [filters]);

  const loadPreset = useCallback((presetId) => {
    const preset = savedPresets.find(p => p.id === presetId);
    if (preset) {
      setFilters(preset.filters);
      return true;
    }
    return false;
  }, [savedPresets]);

  const deletePreset = useCallback((presetId) => {
    setSavedPresets(prev => prev.filter(p => p.id !== presetId));
  }, []);

  const renamePreset = useCallback((presetId, newName) => {
    setSavedPresets(prev =>
      prev.map(p => (p.id === presetId ? { ...p, name: newName } : p))
    );
  }, []);

  // Build query params for API
  const getQueryParams = useCallback(() => {
    const params = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Handle arrays
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params[key] = value.join(',');
          }
        } else {
          params[key] = value;
        }
      }
    });

    return params;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return Object.values(filters).some(
      value => value !== null && value !== undefined && value !== '' && 
               (!Array.isArray(value) || value.length > 0)
    );
  }, [filters]);

  // Count active filters
  const activeFilterCount = useCallback(() => {
    return Object.values(filters).filter(
      value => value !== null && value !== undefined && value !== '' &&
               (!Array.isArray(value) || value.length > 0)
    ).length;
  }, [filters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    clearFilters,
    getQueryParams,
    hasActiveFilters,
    activeFilterCount,
    // Presets
    savedPresets,
    savePreset,
    loadPreset,
    deletePreset,
    renamePreset,
  };
}
