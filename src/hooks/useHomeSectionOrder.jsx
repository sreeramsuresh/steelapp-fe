import { useState, useEffect, useCallback, useRef } from 'react';
import { userPreferencesService } from '../services/userPreferencesService';

const DEFAULT_ORDER = ['quickAccess', 'createNew', 'recentItems'];
const VALID_SECTIONS = new Set(DEFAULT_ORDER);

const validateSectionOrder = (order) => {
  if (!Array.isArray(order)) return DEFAULT_ORDER;

  const valid = order.filter(id => VALID_SECTIONS.has(id));
  const missing = DEFAULT_ORDER.filter(id => !valid.includes(id));

  return [...valid, ...missing];
};

const useHomeSectionOrder = () => {
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_ORDER);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimerRef = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = userPreferencesService.getHomeSectionOrder();
    if (saved) {
      const validated = validateSectionOrder(saved);
      setSectionOrder(validated);
    }
  }, []);

  // Reorder sections - updates state and saves to both storage layers
  const reorderSections = useCallback((newOrder) => {
    const validated = validateSectionOrder(newOrder);
    setSectionOrder(validated);

    // Save to localStorage immediately
    userPreferencesService.setHomeSectionOrder(validated);

    // Debounced save to backend (300ms)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      syncToBackend(validated);
    }, 300);
  }, []);

  // Save to backend via user permissions
  const syncToBackend = useCallback(async (order) => {
    const user = userPreferencesService.getCurrentUser();
    if (!user || !user.id) {
      console.warn('Not logged in - section order saved locally only');
      return;
    }

    setIsSaving(true);
    try {
      const currentPermissions = user.permissions || {};
      const updatedPermissions = {
        ...currentPermissions,
        ui: {
          ...(currentPermissions.ui || {}),
          homeSectionOrder: order,
        },
      };

      await userPreferencesService.updatePermissions(user.id, updatedPermissions);
    } catch (error) {
      console.warn('Failed to sync section order to backend:', error);
      // Don't throw - localStorage is already saved
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    sectionOrder,
    reorderSections,
    isSaving,
  };
};

export default useHomeSectionOrder;
