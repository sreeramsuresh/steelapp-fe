/**
 * WidgetSkeleton - Animated loading skeleton for dashboard widgets
 */

import { useTheme } from '../../contexts/ThemeContext';

const WidgetSkeleton = ({ variant = 'card', size = 'md' }) => {
  const { isDarkMode } = useTheme();

  const baseClasses = `rounded-xl animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`;

  const sizeClasses = {
    sm: 'p-3 min-h-[120px]',
    md: 'p-4 min-h-[180px]',
    lg: 'p-5 min-h-[240px]',
    xl: 'p-6 min-h-[320px]',
  };

  const skeletonBar = (width, height = 'h-4') => (
    <div className={`${height} ${width} rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
  );

  const renderCardSkeleton = () => (
    <div className={`${baseClasses} ${sizeClasses[size]}`} role="status" aria-label="Loading widget">
      <div className="flex justify-between items-start mb-4">
        {skeletonBar('w-24')}
        <div className={`w-10 h-10 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      </div>
      {skeletonBar('w-32', 'h-8')}
      <div className="mt-3 flex items-center gap-2">
        {skeletonBar('w-16', 'h-3')}
        {skeletonBar('w-20', 'h-3')}
      </div>
    </div>
  );

  const renderChartSkeleton = () => (
    <div className={`${baseClasses} ${sizeClasses[size]}`} role="status" aria-label="Loading chart">
      <div className="flex justify-between items-center mb-4">
        {skeletonBar('w-32')}
        <div className="flex gap-2">
          {skeletonBar('w-16', 'h-6')}
          {skeletonBar('w-16', 'h-6')}
        </div>
      </div>
      <div className="flex items-end gap-2 h-32">
        {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 45, 90].map((h, i) => (
          <div key={i} className={`flex-1 rounded-t ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-4">
        {skeletonBar('w-12', 'h-3')}
        {skeletonBar('w-12', 'h-3')}
        {skeletonBar('w-12', 'h-3')}
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className={`${baseClasses} ${sizeClasses[size]}`} role="status" aria-label="Loading list">
      {skeletonBar('w-28', 'h-5')}
      <div className="mt-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <div className="flex-1">
              {skeletonBar('w-3/4', 'h-3')}
              <div className="mt-1">{skeletonBar('w-1/2', 'h-2')}</div>
            </div>
            {skeletonBar('w-16', 'h-4')}
          </div>
        ))}
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className={`${baseClasses} ${sizeClasses[size]}`} role="status" aria-label="Loading table">
      <div className="flex justify-between mb-4">
        {skeletonBar('w-32', 'h-5')}
        {skeletonBar('w-20', 'h-6')}
      </div>
      <div className={`flex gap-4 pb-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {skeletonBar('w-1/4', 'h-3')}
        {skeletonBar('w-1/4', 'h-3')}
        {skeletonBar('w-1/4', 'h-3')}
        {skeletonBar('w-1/4', 'h-3')}
      </div>
      <div className="mt-3 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            {skeletonBar('w-1/4')}
            {skeletonBar('w-1/4')}
            {skeletonBar('w-1/4')}
            {skeletonBar('w-1/4')}
          </div>
        ))}
      </div>
    </div>
  );

  switch (variant) {
    case 'chart': return renderChartSkeleton();
    case 'list': return renderListSkeleton();
    case 'table': return renderTableSkeleton();
    default: return renderCardSkeleton();
  }
};

export default WidgetSkeleton;
