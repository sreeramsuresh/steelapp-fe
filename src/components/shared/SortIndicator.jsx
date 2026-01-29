import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

/**
 * Sort Indicator Component
 * Shows visual indicator for table column sort direction
 * Fixes bug #29: Subtle sort indicators - makes sort direction clearly visible
 */

export default function SortIndicator({
  direction = null, // 'asc', 'desc', or null for unsorted
  size = 'sm',
}) {
  const sizeMap = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (direction === 'asc') {
    return <ArrowUp className={`${sizeMap[size]} text-blue-600 inline-block ml-1`} />;
  }

  if (direction === 'desc') {
    return <ArrowDown className={`${sizeMap[size]} text-blue-600 inline-block ml-1`} />;
  }

  // Unsorted - show subtle indicator
  return (
    <ArrowUpDown
      className={`${sizeMap[size]} text-gray-400 dark:text-gray-600 inline-block ml-1 opacity-50`}
    />
  );
}
