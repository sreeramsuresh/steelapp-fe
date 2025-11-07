import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const MaterialCertificateList = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
        <h1 className="text-2xl font-bold mb-6">Material Certificates</h1>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Material Certificates Management Coming Soon</p>
          <p className="text-sm text-gray-400">
            This page will manage material certificates including MTC, COA, COO 
            with verification workflows and compliance tracking.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaterialCertificateList;