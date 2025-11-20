import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import { notificationService } from '../services/notificationService';

const NotificationProvider = ({ children }) => {
  const { isDarkMode } = useTheme();

  // Update notification service theme when theme changes
  useEffect(() => {
    notificationService.setTheme(isDarkMode);
  }, [isDarkMode]);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{
          top: 20,
          right: 20,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: isDarkMode ? '#1f2937' : '#ffffff',
            color: isDarkMode ? '#f9fafb' : '#111827',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            boxShadow: isDarkMode 
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            maxWidth: '420px',
            padding: '16px',
          },
          // Custom styling for different toast types
          success: {
            iconTheme: {
              primary: '#10b981', // green-500
              secondary: '#ffffff',
            },
          },
          error: {
            duration: 6000,
            iconTheme: {
              primary: '#ef4444', // red-500
              secondary: '#ffffff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#14b8a6', // teal-500
              secondary: '#ffffff',
            },
          },
        }}
      />
    </>
  );
};

export default NotificationProvider;
