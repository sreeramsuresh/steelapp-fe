import { useState, useCallback } from 'react';

/**
 * Custom hook for showing professional confirmation dialogs
 *
 * Replaces window.confirm() with a Promise-based custom dialog
 *
 * Usage:
 *   const confirm = useConfirm();
 *
 *   // Simple confirm
 *   const result = await confirm('Delete this item?');
 *   if (result) { ... }
 *
 *   // Advanced confirm
 *   const result = await confirm({
 *     title: 'Delete Customer?',
 *     message: 'This action cannot be undone.',
 *     confirmText: 'Delete',
 *     variant: 'danger'
 *   });
 */
export const useConfirm = () => {
  const [dialogState, setDialogState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'warning',
    resolve: null,
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      // Handle simple string message
      if (typeof options === 'string') {
        setDialogState({
          open: true,
          title: 'Confirm Action',
          message: options,
          confirmText: 'OK',
          cancelText: 'Cancel',
          variant: 'warning',
          resolve,
        });
      } else {
        // Handle advanced options object
        setDialogState({
          open: true,
          title: options.title || 'Confirm Action',
          message: options.message || options.description || '',
          confirmText: options.confirmText || options.okText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          variant: options.variant || options.type || 'warning',
          resolve,
        });
      }
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setDialogState((prev) => {
      prev.resolve?.(true);
      return { ...prev, open: false };
    });
  }, []); // Uses functional setState - no external dependencies needed

  const handleCancel = useCallback(() => {
    setDialogState((prev) => {
      prev.resolve?.(false);
      return { ...prev, open: false };
    });
  }, []); // Uses functional setState - no external dependencies needed

  return {
    confirm,
    dialogState,
    handleConfirm,
    handleCancel,
  };
};
