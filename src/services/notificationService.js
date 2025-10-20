import toast from 'react-hot-toast';

// Custom toast styles for theme integration
const toastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {},
  className: '',
  iconTheme: {
    primary: '#14b8a6', // teal-500
    secondary: '#ffffff',
  },
};

// Theme-aware toast styles
const getToastStyle = (isDarkMode = false) => ({
  ...toastOptions,
  style: {
    background: isDarkMode ? '#1f2937' : '#ffffff', // gray-800 : white
    color: isDarkMode ? '#f9fafb' : '#111827', // gray-50 : gray-900
    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`, // gray-700 : gray-200
    borderRadius: '0.75rem', // rounded-xl
    fontSize: '0.875rem', // text-sm
    fontWeight: '500',
    boxShadow: isDarkMode 
      ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)'
      : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
});

class NotificationService {
  constructor() {
    this.isDarkMode = false;
  }

  setTheme(isDarkMode) {
    this.isDarkMode = isDarkMode;
  }

  success(message, options = {}) {
    return toast.success(message, {
      ...getToastStyle(this.isDarkMode),
      ...options,
      iconTheme: {
        primary: '#10b981', // green-500
        secondary: '#ffffff',
      },
    });
  }

  error(message, options = {}) {
    return toast.error(message, {
      ...getToastStyle(this.isDarkMode),
      duration: 6000, // Longer duration for errors
      ...options,
      iconTheme: {
        primary: '#ef4444', // red-500
        secondary: '#ffffff',
      },
    });
  }

  warning(message, options = {}) {
    return toast(message, {
      ...getToastStyle(this.isDarkMode),
      ...options,
      icon: '⚠️',
      iconTheme: {
        primary: '#f59e0b', // amber-500
        secondary: '#ffffff',
      },
    });
  }

  info(message, options = {}) {
    return toast(message, {
      ...getToastStyle(this.isDarkMode),
      ...options,
      icon: 'ℹ️',
      iconTheme: {
        primary: '#3b82f6', // blue-500
        secondary: '#ffffff',
      },
    });
  }

  loading(message, options = {}) {
    return toast.loading(message, {
      ...getToastStyle(this.isDarkMode),
      ...options,
    });
  }

  promise(promise, messages, options = {}) {
    return toast.promise(promise, messages, {
      ...getToastStyle(this.isDarkMode),
      ...options,
    });
  }

  custom(jsx, options = {}) {
    return toast.custom(jsx, {
      ...getToastStyle(this.isDarkMode),
      ...options,
    });
  }

  dismiss(toastId) {
    return toast.dismiss(toastId);
  }

  remove(toastId) {
    return toast.remove(toastId);
  }

  // Utility methods for common operations
  apiSuccess(operation = 'Operation') {
    return this.success(`${operation} completed successfully!`);
  }

  apiError(operation = 'Operation', error) {
    const message = error?.response?.data?.message || error?.message || `${operation} failed`;
    return this.error(message);
  }

  formSuccess(formType = 'Form') {
    return this.success(`${formType} saved successfully!`);
  }

  formError(formType = 'Form', error) {
    const message = error?.message || `Failed to save ${formType.toLowerCase()}`;
    return this.error(message);
  }

  deleteSuccess(itemType = 'Item') {
    return this.success(`${itemType} deleted successfully!`);
  }

  deleteError(itemType = 'Item', error) {
    const apiMsg = error?.response?.data?.error || error?.response?.data?.message;
    const message = apiMsg || error?.message || `Failed to delete ${itemType.toLowerCase()}`;
    return this.error(message);
  }

  updateSuccess(itemType = 'Item') {
    return this.success(`${itemType} updated successfully!`);
  }

  updateError(itemType = 'Item', error) {
    const message = error?.message || `Failed to update ${itemType.toLowerCase()}`;
    return this.error(message);
  }

  createSuccess(itemType = 'Item') {
    return this.success(`${itemType} created successfully!`);
  }

  createError(itemType = 'Item', error) {
    const message = error?.message || `Failed to create ${itemType.toLowerCase()}`;
    return this.error(message);
  }
}

// Create and export a singleton instance
export const notificationService = new NotificationService();

// Export toast for direct access if needed
export { toast };

// Export default
export default notificationService;
