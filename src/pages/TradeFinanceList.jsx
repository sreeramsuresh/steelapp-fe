import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const TradeFinanceList = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-sm`}>
        <h1 className="text-2xl font-bold mb-6">Trade Finance</h1>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Trade Finance Management Coming Soon</p>
          <p className="text-sm text-gray-400">
            This page will manage Letters of Credit, Bank Guarantees, 
            Documentary Collections, and other trade finance instruments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TradeFinanceList;
