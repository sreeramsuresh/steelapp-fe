import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Professional Confirmation Dialog Component
 *
 * Replaces native browser confirm() dialogs with a branded, customizable modal.
 *
 * Usage:
 *   <ConfirmDialog
 *     open={showDialog}
 *     title="Delete Customer?"
 *     message="Are you sure you want to delete this customer? This action cannot be undone."
 *     confirmText="Delete"
 *     cancelText="Cancel"
 *     variant="danger"
 *     onConfirm={() => { ... }}
 *     onCancel={() => setShowDialog(false)}
 *   />
 */
const ConfirmDialog = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning', // 'danger', 'warning', 'info', 'success'
  onConfirm,
  onCancel,
  showIcon = true,
}) => {
  const { isDarkMode } = useTheme();

  if (!open) return null;

  const variants = {
    danger: {
      icon: AlertTriangle,
      iconColor: isDarkMode ? 'text-red-400' : 'text-red-600',
      iconBg: isDarkMode ? 'bg-red-900/20' : 'bg-red-100',
      confirmBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      confirmText: 'text-white',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
      iconBg: isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-100',
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      confirmText: 'text-white',
    },
    info: {
      icon: Info,
      iconColor: isDarkMode ? 'text-blue-400' : 'text-blue-600',
      iconBg: isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100',
      confirmBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      confirmText: 'text-white',
    },
    success: {
      icon: CheckCircle,
      iconColor: isDarkMode ? 'text-green-400' : 'text-green-600',
      iconBg: isDarkMode ? 'bg-green-900/20' : 'bg-green-100',
      confirmBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      confirmText: 'text-white',
    },
  };

  const config = variants[variant] || variants.warning;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className={`relative z-10 w-full max-w-md mx-4 rounded-xl shadow-2xl ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className={`absolute top-4 right-4 p-1 rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          }`}
        >
          <X size={20} />
        </button>

        <div className="p-6">
          {/* Icon & Title */}
          <div className="flex items-start gap-4 mb-4">
            {showIcon && (
              <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${config.iconColor}`} />
              </div>
            )}
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {title}
              </h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${config.confirmBg} ${config.confirmText} focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDarkMode ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
