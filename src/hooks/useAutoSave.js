/**
 * useAutoSave - Auto-save with debouncing and localStorage for Invoice Form
 *
 * Phase 1.2 of Create Invoice UI Improvements
 *
 * Features:
 * - Debounced auto-save to localStorage (not server - respects constraints)
 * - Tracks dirty state and last saved timestamp
 * - Recovery from localStorage on page load
 * - Clear draft when invoice is successfully saved to server
 * - Status indicator: 'saved' | 'saving' | 'unsaved' | 'recovered'
 *
 * NOTE: This does NOT save to the backend server.
 * It only saves drafts to localStorage for crash recovery.
 * The actual server save is still done via the existing handleSave function.
 */

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY_PREFIX = "invoice_draft_";
const DEFAULT_DEBOUNCE_MS = 30000; // 30 seconds
const MIN_DEBOUNCE_MS = 5000; // Minimum 5 seconds to prevent too frequent saves

/**
 * Get storage key for an invoice
 * @param {string|number|null} invoiceId - Invoice ID or null for new invoice
 */
const getStorageKey = (invoiceId) => {
  return `${STORAGE_KEY_PREFIX}${invoiceId || "new"}`;
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
 * @param {number} timestamp - Unix timestamp in milliseconds
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "";

  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;

  // Show date for older saves
  return new Date(timestamp).toLocaleDateString();
};

/**
 * Custom hook for auto-saving invoice drafts to localStorage
 *
 * @param {Object} data - The invoice data to auto-save
 * @param {string|number|null} invoiceId - Invoice ID (null for new invoices)
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether auto-save is active (default: true)
 * @param {number} options.debounceMs - Debounce time in ms (default: 30000)
 * @param {Function} options.onRecover - Callback when draft is recovered
 */
const useAutoSave = (
  data,
  invoiceId = null,
  { enabled = true, debounceMs = DEFAULT_DEBOUNCE_MS, onRecover = null } = {},
) => {
  // State
  const [status, setStatus] = useState("saved"); // 'saved' | 'saving' | 'unsaved' | 'recovered'
  const [lastSaved, setLastSaved] = useState(null);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Refs
  const debounceTimerRef = useRef(null);
  const previousDataRef = useRef(null);
  const isInitializedRef = useRef(false);
  const storageKey = getStorageKey(invoiceId);

  /**
   * Save data to localStorage
   */
  const saveToLocal = useCallback(
    (dataToSave) => {
      if (!enabled) return;

      try {
        const saveData = {
          data: dataToSave,
          timestamp: Date.now(),
          invoiceId,
        };
        localStorage.setItem(storageKey, JSON.stringify(saveData));
        setLastSaved(saveData.timestamp);
        setHasLocalDraft(true);
        setStatus("saved");
        setIsDirty(false);
      } catch (error) {
        console.error("useAutoSave: Failed to save to localStorage", error);
        setStatus("unsaved");
      }
    },
    [enabled, storageKey, invoiceId],
  );

  /**
   * Load data from localStorage
   */
  const loadFromLocal = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const parsed = safeJsonParse(stored);
      if (parsed && parsed.data) {
        setHasLocalDraft(true);
        setLastSaved(parsed.timestamp);
        return parsed;
      }
      return null;
    } catch (error) {
      console.error("useAutoSave: Failed to load from localStorage", error);
      return null;
    }
  }, [storageKey]);

  /**
   * Clear draft from localStorage (call after successful server save)
   */
  const clearLocalDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasLocalDraft(false);
      setLastSaved(null);
      setIsDirty(false);
      setStatus("saved");
    } catch (error) {
      console.error("useAutoSave: Failed to clear localStorage", error);
    }
  }, [storageKey]);

  /**
   * Check if there's a recoverable draft
   */
  const checkForRecoverableDraft = useCallback(() => {
    const stored = loadFromLocal();
    if (stored && stored.data) {
      setStatus("recovered");
      return stored;
    }
    return null;
  }, [loadFromLocal]);

  /**
   * Manually trigger a save (bypasses debounce)
   */
  const saveNow = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    saveToLocal(data);
  }, [data, saveToLocal]);

  // Check for existing draft on mount
  useEffect(() => {
    if (!enabled || isInitializedRef.current) return;

    const existingDraft = checkForRecoverableDraft();
    if (existingDraft && onRecover) {
      // Notify parent component about recoverable draft
      onRecover(existingDraft);
    }

    isInitializedRef.current = true;
  }, [enabled, checkForRecoverableDraft, onRecover]);

  // Debounced auto-save when data changes
  useEffect(() => {
    if (!enabled || !isInitializedRef.current) return;

    // Skip if data hasn't actually changed (deep comparison would be expensive)
    const dataString = JSON.stringify(data);
    if (previousDataRef.current === dataString) return;
    previousDataRef.current = dataString;

    // Mark as dirty immediately
    setIsDirty(true);
    setStatus("unsaved");

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    const actualDebounce = Math.max(debounceMs, MIN_DEBOUNCE_MS);
    debounceTimerRef.current = setTimeout(() => {
      setStatus("saving");
      // Small delay to show "saving" state
      setTimeout(() => {
        saveToLocal(data);
      }, 100);
    }, actualDebounce);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, enabled, debounceMs, saveToLocal]);

  // Save on page unload (if dirty)
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event) => {
      if (isDirty) {
        // Try to save immediately before page closes
        saveToLocal(data);

        // Show browser's "unsaved changes" dialog
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, isDirty, data, saveToLocal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    // Status
    status,
    lastSaved,
    lastSavedFormatted: formatRelativeTime(lastSaved),
    hasLocalDraft,
    isDirty,

    // Actions
    saveNow,
    saveToLocal,
    loadFromLocal,
    clearLocalDraft,
    checkForRecoverableDraft,
  };
};

/**
 * Get status display info for UI
 */
export const getAutoSaveStatusDisplay = (status, lastSavedFormatted) => {
  switch (status) {
    case "saved":
      return {
        text: lastSavedFormatted
          ? `Draft saved ${lastSavedFormatted}`
          : "Draft saved",
        color: "text-green-500",
        icon: "✓",
      };
    case "saving":
      return {
        text: "Saving draft...",
        color: "text-yellow-500",
        icon: "⏳",
      };
    case "unsaved":
      return {
        text: "Unsaved changes",
        color: "text-orange-500",
        icon: "●",
      };
    case "recovered":
      return {
        text: "Draft recovered",
        color: "text-blue-500",
        icon: "↺",
      };
    default:
      return {
        text: "",
        color: "text-gray-500",
        icon: "",
      };
  }
};

export default useAutoSave;
