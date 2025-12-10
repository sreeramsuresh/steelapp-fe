import { Warehouse, Truck, Ship } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * SourceTypeSelector Component
 * Radio button selector for invoice line item source type
 * Options: Warehouse Stock, Local Drop-Ship, Import Drop-Ship
 */
const SourceTypeSelector = ({ value = 'WAREHOUSE', onChange, disabled = false }) => {
  const { isDarkMode } = useTheme();

  const options = [
    {
      value: 'WAREHOUSE',
      label: 'Warehouse Stock',
      icon: Warehouse,
      description: 'From inventory',
    },
    {
      value: 'LOCAL_DROP_SHIP',
      label: 'Local Drop-Ship',
      icon: Truck,
      description: 'Direct supplier delivery',
    },
    {
      value: 'IMPORT_DROP_SHIP',
      label: 'Import Drop-Ship',
      icon: Ship,
      description: 'International shipment',
    },
  ];

  return (
    <div className="flex gap-2">
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
              transition-all duration-200 flex-1
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              ${
                isSelected
                  ? isDarkMode
                    ? 'bg-teal-900/50 border-2 border-teal-500 text-teal-300'
                    : 'bg-teal-50 border-2 border-teal-600 text-teal-700'
                  : isDarkMode
                    ? 'bg-gray-700 border-2 border-gray-600 text-gray-300 hover:bg-gray-600'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
            title={option.description}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SourceTypeSelector;
