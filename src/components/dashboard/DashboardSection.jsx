/**
 * DashboardSection Component
 * Section component that automatically filters widgets by permissions
 */

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useDashboardPermissions } from '../../hooks/useDashboardPermissions';

export const DashboardSection = ({
  title,
  description,
  category,
  widgets = [],
  icon,
  headerAction,
  defaultExpanded = true,
  showCount = true,
  className = '',
}) => {
  const { isDarkMode } = useTheme();
  const { canViewWidget, getWidgetsByCategory, isLoading } = useDashboardPermissions();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const visibleWidgets = useMemo(() => {
    if (category) {
      const categoryWidgets = getWidgetsByCategory(category);
      return widgets.filter((w) => categoryWidgets.includes(w.id));
    }
    return widgets.filter((w) => canViewWidget(w.id));
  }, [widgets, category, canViewWidget, getWidgetsByCategory]);

  if (!isLoading && visibleWidgets.length === 0) return null;

  const getSpanClass = (size) => {
    switch (size) {
      case 'sm': return 'lg:col-span-1';
      case 'lg': return 'lg:col-span-2';
      case 'xl': return 'lg:col-span-3';
      default: return 'lg:col-span-1';
    }
  };

  return (
    <div className={`mb-6 ${className}`}>
      <div
        className={`flex items-center justify-between p-4 rounded-t-xl cursor-pointer transition-colors ${
          isDarkMode ? 'bg-gray-800 hover:bg-gray-750 border-b border-gray-700' : 'bg-gray-50 hover:bg-gray-100 border-b border-gray-200'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {icon && <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>{icon}</div>}
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
              {showCount && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                  {visibleWidgets.length} widgets
                </span>
              )}
            </div>
            {description && <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {headerAction && <div onClick={(e) => e.stopPropagation()}>{headerAction}</div>}
          <button className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={`p-4 rounded-b-xl ${isDarkMode ? 'bg-gray-800/50 border border-t-0 border-gray-700' : 'bg-white border border-t-0 border-gray-200'}`}>
          {isLoading ? (
            <DashboardSectionSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleWidgets.map((widget) => {
                const WidgetComponent = widget.component;
                return (
                  <div key={widget.id} className={getSpanClass(widget.size)}>
                    <WidgetComponent {...(widget.props || {})} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const DashboardSectionSkeleton = ({ count = 3 }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`p-4 rounded-xl animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className={`h-4 w-24 rounded mb-3 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
          <div className={`h-8 w-32 rounded mb-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
          <div className={`h-3 w-16 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
        </div>
      ))}
    </div>
  );
};

export default DashboardSection;
