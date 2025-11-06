import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ShippingDocumentList = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
        <h1 className="text-2xl font-bold mb-6">Shipping Documents</h1>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Shipping Documents Management Coming Soon</p>
          <p className="text-sm text-gray-400">
            This page will track all shipping documents including Bills of Lading, 
            Air Waybills, and provide real-time shipment tracking capabilities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingDocumentList;