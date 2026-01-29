import { Truck } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function LeadTimeInput({ item, index, onUpdate }) {
  const { isDarkMode } = useTheme();

  // Only show for items that need procurement (not warehouse stock or insufficient stock)
  const showLeadTime = item.sourceType === 'TO_BE_PROCURED' || !item.productId;

  if (!showLeadTime) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Truck
            className={`h-4 w-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}
          />
          <span
            className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Lead Time:
          </span>
        </div>
        <div className="flex items-center gap-1">
          <input
            id={`lead-time-${index}`}
            type="number"
            min="0"
            value={item.estimatedLeadTimeDays || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || null;
              onUpdate(index, 'estimatedLeadTimeDays', value);
            }}
            placeholder="0"
            aria-label={`Lead time in days for item ${index + 1} (estimated procurement duration from supplier)`}
            className={`w-16 px-2 py-1 text-sm rounded border ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
          />
          <span
            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            days
          </span>
        </div>
      </div>
      <p
        className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}
      >
        Expected days for supplier to deliver this item from order date
      </p>
    </div>
  );
}
