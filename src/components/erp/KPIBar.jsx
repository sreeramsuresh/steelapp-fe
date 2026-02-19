import { useTheme } from "../../contexts/ThemeContext";

const COLOR_MAP = {
  teal: {
    active: "bg-teal-50 border-teal-300 ring-1 ring-teal-300",
    activeDark: "bg-teal-900/30 border-teal-600 ring-1 ring-teal-600",
  },
  green: {
    active: "bg-green-50 border-green-300 ring-1 ring-green-300",
    activeDark: "bg-green-900/30 border-green-600 ring-1 ring-green-600",
  },
  red: {
    active: "bg-red-50 border-red-300 ring-1 ring-red-300",
    activeDark: "bg-red-900/30 border-red-600 ring-1 ring-red-600",
  },
  orange: {
    active: "bg-orange-50 border-orange-300 ring-1 ring-orange-300",
    activeDark: "bg-orange-900/30 border-orange-600 ring-1 ring-orange-600",
  },
  blue: {
    active: "bg-blue-50 border-blue-300 ring-1 ring-blue-300",
    activeDark: "bg-blue-900/30 border-blue-600 ring-1 ring-blue-600",
  },
};

const INACTIVE_CLS = {
  light: "bg-white border-gray-200 hover:border-gray-300",
  dark: "bg-[#1E2328] border-[#37474F] hover:border-gray-500",
};

/**
 * KPIBar — A row of KPI cards. Clickable cards filter data; static cards just display.
 *
 * @param {Object[]} items - KPI definitions
 * @param {string}   items[].label     - Display label (e.g. "Total Invoiced")
 * @param {string}   items[].value     - Formatted value (e.g. "AED 1,234.00")
 * @param {string}   [items[].filterValue] - If set, card is clickable and sets this filter
 * @param {string}   [items[].color]   - Active color: teal|green|red|orange|blue (default teal)
 * @param {string}   activeFilter      - Currently active filter value (compared with filterValue)
 * @param {Function} onFilter          - Called with filterValue when a clickable KPI is clicked
 * @param {string}   [columns]         - Grid columns class override (default "grid-cols-2 md:grid-cols-3 lg:grid-cols-5")
 */
export default function KPIBar({ items = [], activeFilter, onFilter, columns }) {
  const { isDarkMode } = useTheme();
  const gridCls = columns || "grid-cols-2 md:grid-cols-3 lg:grid-cols-5";

  return (
    <div className={`grid ${gridCls} gap-3`}>
      {items.map((kpi) => {
        const isClickable = kpi.filterValue !== undefined;
        const isActive = isClickable && activeFilter === kpi.filterValue;
        const colorDef = COLOR_MAP[kpi.color || "teal"] || COLOR_MAP.teal;

        const activeCls = isDarkMode ? colorDef.activeDark : colorDef.active;
        const inactiveCls = isDarkMode ? INACTIVE_CLS.dark : INACTIVE_CLS.light;
        const baseCls = `p-3 rounded-lg border text-left transition-all ${isActive ? activeCls : inactiveCls}`;

        if (isClickable) {
          return (
            <button
              key={kpi.label}
              type="button"
              onClick={() => onFilter?.(kpi.filterValue)}
              className={`${baseCls} hover:shadow-md`}
            >
              <div className="text-xs opacity-70">{kpi.label}</div>
              <div className="text-lg font-semibold">{kpi.value}</div>
            </button>
          );
        }

        return (
          <div
            key={kpi.label}
            className={`p-3 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
          >
            <div className="text-xs opacity-70">{kpi.label}</div>
            <div className="text-lg font-semibold">{kpi.value}</div>
          </div>
        );
      })}
    </div>
  );
}
