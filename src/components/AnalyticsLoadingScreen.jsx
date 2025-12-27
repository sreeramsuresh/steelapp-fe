/**
 * AnalyticsLoadingScreen.jsx
 * Loading state displayed while Analytics Hub bundle is being loaded
 * Used as Suspense fallback for lazy-loaded AnalyticsLayout
 */
import { BarChart3 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const AnalyticsLoadingScreen = () => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`flex items-center justify-center min-h-screen ${
        isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'
      }`}
    >
      <div className="text-center">
        {/* Analytics Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-lg">
            <BarChart3 size={32} />
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="mb-4 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>

        {/* Loading Text */}
        <h2
          className={`text-xl font-semibold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Loading Analytics Hub
        </h2>
        <p
          className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Preparing insights and reports...
        </p>
      </div>
    </div>
  );
};

export default AnalyticsLoadingScreen;
