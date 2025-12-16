import { Warehouse, Truck, Ship, ChevronDown } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * SourceTypeSelector Component
 * Dropdown selector for invoice line item source type
 * Options: Warehouse Stock, Local Drop-Ship, Import Drop-Ship
 */
const SourceTypeSelector = ({
  value = "WAREHOUSE",
  onChange,
  disabled = false,
  id,
  "data-testid": dataTestId,
}) => {
  const { isDarkMode } = useTheme();

  const options = [
    {
      value: "WAREHOUSE",
      label: "Warehouse Stock",
      shortLabel: "Warehouse",
      icon: Warehouse,
    },
    {
      value: "LOCAL_DROP_SHIP",
      label: "Local Drop-Ship",
      shortLabel: "Local Drop",
      icon: Truck,
    },
    {
      value: "IMPORT_DROP_SHIP",
      label: "Import Drop-Ship",
      shortLabel: "Import Drop",
      icon: Ship,
    },
  ];

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];
  const Icon = selectedOption.icon;

  return (
    <div className="relative inline-block w-full min-w-[140px] max-w-[160px]">
      <select
        id={id}
        data-testid={dataTestId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full appearance-none pl-8 pr-7 py-1.5 rounded-md text-xs font-medium
          transition-all duration-200 cursor-pointer
          ${disabled ? "cursor-not-allowed opacity-50" : ""}
          ${
            isDarkMode
              ? "bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 focus:border-teal-500"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:border-teal-500"
          }
          focus:outline-none focus:ring-1 focus:ring-teal-500
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.shortLabel}
          </option>
        ))}
      </select>
      {/* Icon on the left */}
      <Icon
        className={`absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${
          isDarkMode ? "text-gray-400" : "text-gray-500"
        }`}
      />
      {/* Chevron on the right */}
      <ChevronDown
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none ${
          isDarkMode ? "text-gray-400" : "text-gray-500"
        }`}
      />
    </div>
  );
};

export default SourceTypeSelector;
