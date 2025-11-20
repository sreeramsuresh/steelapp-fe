import React from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const ExportOrderDetails = () => {
  const { id } = useParams();
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
        <h1 className="text-2xl font-bold mb-6">Export Order Details</h1>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Export Order #{id} Details Coming Soon</p>
          <p className="text-sm text-gray-400">
            This page will show comprehensive details of the export order including 
            customer information, product details, shipping status, and compliance documents.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportOrderDetails;
