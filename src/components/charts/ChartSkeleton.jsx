/**
 * ChartSkeleton.jsx
 * Loading placeholder for lazy-loaded chart components
 */
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';

const ChartSkeleton = ({ height = 300 }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`animate-pulse rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
      style={{ height: `${height}px`, width: '100%' }}
    >
      <div className="flex items-center justify-center h-full">
        <div
          className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
        >
          Loading chart...
        </div>
      </div>
    </div>
  );
};

ChartSkeleton.propTypes = {
  height: PropTypes.number,
};

export default ChartSkeleton;
