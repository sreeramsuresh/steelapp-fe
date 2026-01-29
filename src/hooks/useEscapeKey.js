import { useEffect } from 'react';

/**
 * Hook to handle Escape key press for modals and dialogs
 * Fixes bug #25: Modal Escape key handling
 *
 * Usage:
 *   const handleClose = () => setOpen(false);
 *   useEscapeKey(handleClose, isOpen);
 */
const useEscapeKey = (callback, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [callback, enabled]);
};

export default useEscapeKey;
