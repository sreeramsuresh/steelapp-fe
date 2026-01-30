/**
 * HomeButton.jsx
 * Home navigation button for TopNavbar
 * Easily removable component (rollback: just delete this file and remove import from TopNavbar)
 */

import React from 'react';
import { Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const HomeButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  // Don't show home button if already on home page
  const isOnHome = location.pathname === '/app' || location.pathname === '/app/home';

  const handleHomeClick = () => {
    navigate('/app/home');
  };

  return (
    <button
      onClick={handleHomeClick}
      disabled={isOnHome}
      title={isOnHome ? 'Already on home page' : 'Return to home page'}
      className={`p-2 rounded-lg transition-all duration-200 ${
        isDarkMode
          ? 'hover:bg-gray-700 text-gray-300 hover:text-white disabled:text-gray-600'
          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 disabled:text-gray-300'
      } ${isOnHome ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'}`}
    >
      <Home size={20} />
    </button>
  );
};

export default HomeButton;
