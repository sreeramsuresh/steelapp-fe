import { AlertTriangle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * PricingWarningBanner - Alert banner for pricing issues
 *
 * Shows warning when product has no base price
 */
export default function PricingWarningBanner({ isDarkMode: overrideDarkMode }) {
  const { isDarkMode: theme } = useTheme();
  const isDarkMode = overrideDarkMode !== undefined ? overrideDarkMode : theme;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${
        isDarkMode ? "bg-yellow-900/20 border-yellow-700" : "bg-yellow-50 border-yellow-300"
      }`}
    >
      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className={`text-sm font-medium ${isDarkMode ? "text-yellow-100" : "text-yellow-900"}`}>
          Product has no base price
        </p>
        <p className={`text-xs ${isDarkMode ? "text-yellow-200/70" : "text-yellow-700"}`}>
          Set selling price to add to default pricelist
        </p>
      </div>
    </div>
  );
}
