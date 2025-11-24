/**
 * useCreditNoteDrafts - Silent auto-save for Credit Note Form
 * 
 * Features:
 * - Silent save on page exit (NO browser warning)
 * - Multiple drafts keyed by invoiceId
 * - Auto-expiry at end of day (midnight)
 * - Conflict detection for same/different invoice scenarios
 * - Recovery from localStorage on page load
 * - Clear draft when credit note is successfully saved
 * 
 * Storage Structure:
 * {
 *   [invoiceId]: {
 *     data: { ...creditNoteFormData },
 *     invoiceId: number,
 *     invoiceNumber: string,
 *     customerName: string,
 *     timestamp: number,
 *     expiresAt: number (midnight timestamp)
 *   }
 * }
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const STORAGE_KEY = 'credit_note_drafts';

/**
 * Get midnight timestamp for today (when drafts expire)
 */
const getMidnightTimestamp = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  return midnight.getTime();
};

/**
 * Check if a draft has expired
 */
const isDraftExpired = (draft) => {
  if (!draft || !draft.expiresAt) return true;
  return Date.now() > draft.expiresAt;
};

/**
 * Safely parse JSON from localStorage
 */
const safeJsonParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

/**
 * Format relative time for display
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  
  return new Date(timestamp).toLocaleDateString();
};

/**
 * Format time until expiry
 */
export const formatTimeUntilExpiry = (expiresAt) => {
  if (!expiresAt) return '';
  
  const now = Date.now();
  const diff = expiresAt - now;
  
  if (diff <= 0) return 'expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Get draft status message for display in list
 * Format: "Saved 2h ago • Expires tonight at midnight"
 */
export const getDraftStatusMessage = (draft) => {
  if (!draft) return '';
  
  const savedTime = formatRelativeTime(draft.timestamp);
  const now = new Date();
  const expiresAt = new Date(draft.expiresAt);
  
  // Check if expires today
  if (expiresAt.toDateString() === now.toDateString()) {
    return `Saved ${savedTime} • Expires tonight at midnight`;
  }
  
  return `Saved ${savedTime} • Expires ${expiresAt.toLocaleDateString()}`;
};

/**
 * Load all drafts from localStorage
 */
const loadAllDrafts = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return safeJsonParse(stored, {});
  } catch {
    return {};
  }
};

/**
 * Save all drafts to localStorage
 */
const saveAllDrafts = (drafts) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    return true;
  } catch (error) {
    console.error('useCreditNoteDrafts: Failed to save drafts', error);
    return false;
  }
};

/**
 * Clean up expired drafts
 */
export const cleanupExpiredDrafts = () => {
  const drafts = loadAllDrafts();
  let hasChanges = false;
  
  Object.keys(drafts).forEach(key => {
    if (isDraftExpired(drafts[key])) {
      delete drafts[key];
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    saveAllDrafts(drafts);
  }
  
  return drafts;
};

/**
 * Custom hook for managing credit note drafts
 * 
 * @param {Object} options - Configuration options
 * @param {number|null} options.currentInvoiceId - Current invoice being edited
 * @param {Function} options.onConflict - Callback when conflict detected
 */
const useCreditNoteDrafts = ({
  currentInvoiceId = null,
  onConflict = null,
} = {}) => {
  // State
  const [drafts, setDrafts] = useState({});
  const [currentDraft, setCurrentDraft] = useState(null);
  const [conflictInfo, setConflictInfo] = useState(null);
  
  // Refs
  const pendingSaveRef = useRef(null);
  const isInitializedRef = useRef(false);

  /**
   * Refresh drafts from localStorage
   */
  const refreshDrafts = useCallback(() => {
    const cleanedDrafts = cleanupExpiredDrafts();
    setDrafts(cleanedDrafts);
    return cleanedDrafts;
  }, []);

  /**
   * Get all non-expired drafts as array (for list display)
   */
  const getAllDraftsArray = useMemo(() => {
    return Object.values(drafts).filter(d => !isDraftExpired(d));
  }, [drafts]);

  /**
   * Check if draft exists for a specific invoice
   */
  const hasDraftForInvoice = useCallback((invoiceId) => {
    if (!invoiceId) return false;
    const draft = drafts[invoiceId];
    return draft && !isDraftExpired(draft);
  }, [drafts]);

  /**
   * Get draft for a specific invoice
   */
  const getDraft = useCallback((invoiceId) => {
    if (!invoiceId) return null;
    const draft = drafts[invoiceId];
    if (draft && !isDraftExpired(draft)) {
      return draft;
    }
    return null;
  }, [drafts]);

  /**
   * Save draft for current invoice
   */
  const saveDraft = useCallback((data, invoiceInfo = {}) => {
    const invoiceId = invoiceInfo.invoiceId || currentInvoiceId;
    if (!invoiceId) {
      console.warn('useCreditNoteDrafts: Cannot save draft without invoiceId');
      return false;
    }

    const newDraft = {
      data,
      invoiceId,
      invoiceNumber: invoiceInfo.invoiceNumber || data.invoiceNumber || '',
      customerName: invoiceInfo.customerName || data.customerName || '',
      timestamp: Date.now(),
      expiresAt: getMidnightTimestamp(),
    };

    const allDrafts = loadAllDrafts();
    allDrafts[invoiceId] = newDraft;
    
    if (saveAllDrafts(allDrafts)) {
      setDrafts(allDrafts);
      setCurrentDraft(newDraft);
      return true;
    }
    return false;
  }, [currentInvoiceId]);

  /**
   * Delete draft for a specific invoice
   */
  const deleteDraft = useCallback((invoiceId) => {
    if (!invoiceId) return false;
    
    const allDrafts = loadAllDrafts();
    if (allDrafts[invoiceId]) {
      delete allDrafts[invoiceId];
      saveAllDrafts(allDrafts);
      setDrafts(allDrafts);
      
      if (currentDraft?.invoiceId === invoiceId) {
        setCurrentDraft(null);
      }
      return true;
    }
    return false;
  }, [currentDraft]);

  /**
   * Clear all drafts
   */
  const clearAllDrafts = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setDrafts({});
    setCurrentDraft(null);
  }, []);

  /**
   * Check for conflicts when opening credit note form
   * Returns: { type: 'same_invoice' | 'different_invoice' | null, existingDraft: draft }
   */
  const checkConflict = useCallback((targetInvoiceId) => {
    const allDrafts = cleanupExpiredDrafts();
    const existingDrafts = Object.values(allDrafts).filter(d => !isDraftExpired(d));
    
    if (existingDrafts.length === 0) {
      return { type: null, existingDraft: null, allDrafts: [] };
    }

    // Check if there's a draft for the same invoice
    const sameDraft = allDrafts[targetInvoiceId];
    if (sameDraft && !isDraftExpired(sameDraft)) {
      return {
        type: 'same_invoice',
        existingDraft: sameDraft,
        allDrafts: existingDrafts,
      };
    }

    // Check if there are drafts for different invoices
    if (existingDrafts.length > 0) {
      return {
        type: 'different_invoice',
        existingDraft: existingDrafts[0], // Return first draft
        allDrafts: existingDrafts,
      };
    }

    return { type: null, existingDraft: null, allDrafts: [] };
  }, []);

  /**
   * Set pending save data (to be saved on unmount)
   */
  const setPendingSave = useCallback((data, invoiceInfo = {}) => {
    pendingSaveRef.current = { data, invoiceInfo };
  }, []);

  /**
   * Clear pending save
   */
  const clearPendingSave = useCallback(() => {
    pendingSaveRef.current = null;
  }, []);

  // Initialize - clean up expired drafts and load
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    const cleanedDrafts = cleanupExpiredDrafts();
    setDrafts(cleanedDrafts);
    
    // Check for current invoice draft
    if (currentInvoiceId && cleanedDrafts[currentInvoiceId]) {
      setCurrentDraft(cleanedDrafts[currentInvoiceId]);
    }
    
    isInitializedRef.current = true;
  }, [currentInvoiceId]);

  // Check for conflicts when currentInvoiceId changes
  useEffect(() => {
    if (!isInitializedRef.current || !currentInvoiceId) return;
    
    const conflict = checkConflict(currentInvoiceId);
    if (conflict.type && onConflict) {
      setConflictInfo(conflict);
      onConflict(conflict);
    }
  }, [currentInvoiceId, checkConflict, onConflict]);

  // Silent save on page unload (NO browser warning)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save pending data silently - no warning dialog
      if (pendingSaveRef.current) {
        const { data, invoiceInfo } = pendingSaveRef.current;
        const invoiceId = invoiceInfo.invoiceId || currentInvoiceId;
        
        if (invoiceId && data) {
          const allDrafts = loadAllDrafts();
          allDrafts[invoiceId] = {
            data,
            invoiceId,
            invoiceNumber: invoiceInfo.invoiceNumber || data.invoiceNumber || '',
            customerName: invoiceInfo.customerName || data.customerName || '',
            timestamp: Date.now(),
            expiresAt: getMidnightTimestamp(),
          };
          
          // Synchronous save for beforeunload
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allDrafts));
          } catch (e) {
            console.error('Failed to save draft on exit', e);
          }
        }
      }
      // NO event.preventDefault() - allows silent exit
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentInvoiceId]);

  // Also save on component unmount (navigation within app)
  useEffect(() => {
    return () => {
      if (pendingSaveRef.current) {
        const { data, invoiceInfo } = pendingSaveRef.current;
        const invoiceId = invoiceInfo.invoiceId || currentInvoiceId;
        
        if (invoiceId && data) {
          const allDrafts = loadAllDrafts();
          allDrafts[invoiceId] = {
            data,
            invoiceId,
            invoiceNumber: invoiceInfo.invoiceNumber || data.invoiceNumber || '',
            customerName: invoiceInfo.customerName || data.customerName || '',
            timestamp: Date.now(),
            expiresAt: getMidnightTimestamp(),
          };
          
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allDrafts));
          } catch (e) {
            console.error('Failed to save draft on unmount', e);
          }
        }
      }
    };
  }, [currentInvoiceId]);

  // Periodic cleanup (every hour)
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupExpiredDrafts();
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  return {
    // State
    drafts,
    currentDraft,
    conflictInfo,
    allDrafts: getAllDraftsArray,
    hasDrafts: getAllDraftsArray.length > 0,
    
    // Actions
    saveDraft,
    getDraft,
    deleteDraft,
    clearAllDrafts,
    hasDraftForInvoice,
    checkConflict,
    refreshDrafts,
    
    // For silent save
    setPendingSave,
    clearPendingSave,
    
    // Utilities
    cleanupExpiredDrafts,
  };
};

export default useCreditNoteDrafts;
