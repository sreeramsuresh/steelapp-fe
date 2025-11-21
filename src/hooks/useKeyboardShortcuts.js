/**
 * useKeyboardShortcuts - Scoped keyboard shortcuts hook for Invoice Form
 * 
 * Phase 1.1 of Create Invoice UI Improvements
 * 
 * Features:
 * - Scoped to component lifecycle (cleanup on unmount)
 * - Ignores shortcuts when user is typing in input/textarea/select
 * - Supports modifier keys: Ctrl, Shift, Alt, Meta
 * - Prevents default browser behavior for registered shortcuts
 * 
 * Usage:
 * useKeyboardShortcuts({
 *   'ctrl+s': handleSave,
 *   'ctrl+p': handlePreview,
 *   'escape': handleClose,
 * }, { enabled: true });
 */

import { useEffect, useCallback, useRef } from 'react';

/**
 * Parse a shortcut string into its components
 * @param {string} shortcut - e.g., 'ctrl+s', 'ctrl+shift+p', 'escape'
 * @returns {Object} { key, ctrl, shift, alt, meta }
 */
const parseShortcut = (shortcut) => {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  
  return {
    key,
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta') || parts.includes('cmd'),
  };
};

/**
 * Check if an event matches a parsed shortcut
 * @param {KeyboardEvent} event
 * @param {Object} parsedShortcut
 * @returns {boolean}
 */
const matchesShortcut = (event, parsedShortcut) => {
  const eventKey = event.key.toLowerCase();
  
  // Handle special keys
  const keyMatches = 
    eventKey === parsedShortcut.key ||
    (parsedShortcut.key === 'escape' && eventKey === 'escape') ||
    (parsedShortcut.key === 'esc' && eventKey === 'escape') ||
    (parsedShortcut.key === 'enter' && eventKey === 'enter') ||
    (parsedShortcut.key === 'tab' && eventKey === 'tab');
  
  return (
    keyMatches &&
    event.ctrlKey === parsedShortcut.ctrl &&
    event.shiftKey === parsedShortcut.shift &&
    event.altKey === parsedShortcut.alt &&
    event.metaKey === parsedShortcut.meta
  );
};

/**
 * Check if the event target is an editable element
 * @param {EventTarget} target
 * @returns {boolean}
 */
const isEditableElement = (target) => {
  if (!target || !target.tagName) return false;
  
  const tagName = target.tagName.toLowerCase();
  const isEditable = 
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable;
  
  return isEditable;
};

/**
 * Custom hook for scoped keyboard shortcuts
 * 
 * @param {Object} shortcuts - Map of shortcut strings to callbacks
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether shortcuts are active (default: true)
 * @param {boolean} options.enableInInputs - Allow shortcuts in input fields (default: false)
 * @param {string[]} options.allowInInputs - Specific shortcuts allowed in inputs (e.g., ['escape'])
 */
const useKeyboardShortcuts = (
  shortcuts = {},
  { 
    enabled = true, 
    enableInInputs = false,
    allowInInputs = ['escape', 'esc'],
  } = {}
) => {
  // Store shortcuts in ref to avoid re-registering on every render
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  // Parse shortcuts once
  const parsedShortcutsRef = useRef(new Map());
  
  useEffect(() => {
    parsedShortcutsRef.current.clear();
    Object.keys(shortcutsRef.current).forEach((shortcut) => {
      parsedShortcutsRef.current.set(shortcut, parseShortcut(shortcut));
    });
  }, [Object.keys(shortcuts).join(',')]);

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    const isEditable = isEditableElement(event.target);
    
    // Check each registered shortcut
    for (const [shortcutKey, parsedShortcut] of parsedShortcutsRef.current) {
      if (matchesShortcut(event, parsedShortcut)) {
        // Skip if in editable element, unless:
        // 1. enableInInputs is true, OR
        // 2. This specific shortcut is in allowInInputs
        if (isEditable && !enableInInputs) {
          const shortcutLower = shortcutKey.toLowerCase();
          const isAllowed = allowInInputs.some(
            allowed => shortcutLower.includes(allowed.toLowerCase())
          );
          if (!isAllowed) continue;
        }

        // Prevent default browser behavior
        event.preventDefault();
        event.stopPropagation();

        // Execute the callback
        const callback = shortcutsRef.current[shortcutKey];
        if (typeof callback === 'function') {
          callback(event);
        }
        
        return; // Only execute first matching shortcut
      }
    }
  }, [enabled, enableInInputs, allowInInputs]);

  useEffect(() => {
    if (!enabled) return;

    // Add listener to document for global capture within the component
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount or when disabled
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
};

/**
 * Get display string for a shortcut (for UI hints)
 * @param {string} shortcut - e.g., 'ctrl+s'
 * @returns {string} - e.g., 'Ctrl+S' or '⌘S' on Mac
 */
export const getShortcutDisplayString = (shortcut) => {
  const isMac = typeof navigator !== 'undefined' && 
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  
  const parts = shortcut.toLowerCase().split('+');
  const displayParts = parts.map(part => {
    switch (part) {
      case 'ctrl':
      case 'control':
        return isMac ? '⌘' : 'Ctrl';
      case 'shift':
        return isMac ? '⇧' : 'Shift';
      case 'alt':
        return isMac ? '⌥' : 'Alt';
      case 'meta':
      case 'cmd':
        return isMac ? '⌘' : 'Win';
      case 'escape':
      case 'esc':
        return 'Esc';
      case 'enter':
        return '↵';
      default:
        return part.toUpperCase();
    }
  });
  
  return isMac ? displayParts.join('') : displayParts.join('+');
};

/**
 * Predefined shortcut sets for common use cases
 */
export const INVOICE_SHORTCUTS = {
  SAVE: 'ctrl+s',
  PREVIEW: 'ctrl+p',
  NEW_ITEM: 'ctrl+n',
  DUPLICATE_ITEM: 'ctrl+d',
  CLOSE: 'escape',
  HELP: 'ctrl+/',
};

export default useKeyboardShortcuts;
