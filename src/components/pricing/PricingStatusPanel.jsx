import { AlertTriangle, CheckCircle, DollarSign, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { pricelistService } from "../../services/pricelistService";

/**
 * PricingStatusPanel - Visual indicator showing if product has base pricing
 *
 * Shows one of three states:
 * - ✅ In Default Pricelist (green)
 * - ⚠️ Missing from Default Pricelist (yellow)
 * - ❌ No Selling Price (red)
 */
export default function PricingStatusPanel({ productId, sellingPrice, isDarkMode, onQuickEdit }) {
  const [status, setStatus] = useState("checking");
  const [isLoading, setIsLoading] = useState(true);
  const { isDarkMode: theme } = useTheme();
  const darkMode = isDarkMode !== undefined ? isDarkMode : theme;

  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      setStatus("no-price");
      return;
    }

    const checkPricingStatus = async () => {
      try {
        setIsLoading(true);

        // Check if product has selling price
        if (!sellingPrice || Number(sellingPrice) <= 0) {
          setStatus("no-price");
          return;
        }

        // Check if product exists in default pricelist
        try {
          const response = await pricelistService.getProductPrice(productId, {
            pricelist_type: "default",
          });

          if (response && response.selling_price > 0) {
            setStatus("priced");
          } else {
            setStatus("unpriced");
          }
        } catch {
          // If API call fails, assume product is not in default pricelist yet
          setStatus("unpriced");
        }
      } catch (error) {
        console.error("Error checking pricing status:", error);
        setStatus("error");
      } finally {
        setIsLoading(false);
      }
    };

    checkPricingStatus();
  }, [productId, sellingPrice]);

  const getStatusConfig = () => {
    const configs = {
      priced: {
        icon: CheckCircle,
        label: "In Default Pricelist",
        description: "Product is priced and ready for invoicing",
        bgColor: darkMode ? "bg-green-900/20" : "bg-green-50",
        borderColor: darkMode ? "border-green-700" : "border-green-300",
        iconColor: "text-green-500",
        badgeColor: darkMode ? "bg-green-900 text-green-100" : "bg-green-100 text-green-800",
      },
      unpriced: {
        icon: AlertTriangle,
        label: "Not in Default Pricelist",
        description: "Set selling price to add to company base prices",
        bgColor: darkMode ? "bg-yellow-900/20" : "bg-yellow-50",
        borderColor: darkMode ? "border-yellow-700" : "border-yellow-300",
        iconColor: "text-yellow-500",
        badgeColor: darkMode ? "bg-yellow-900 text-yellow-100" : "bg-yellow-100 text-yellow-800",
        action: true,
      },
      "no-price": {
        icon: X,
        label: "No Selling Price",
        description: "Product needs a selling price to be priced",
        bgColor: darkMode ? "bg-red-900/20" : "bg-red-50",
        borderColor: darkMode ? "border-red-700" : "border-red-300",
        iconColor: "text-red-500",
        badgeColor: darkMode ? "bg-red-900 text-red-100" : "bg-red-100 text-red-800",
        action: true,
      },
      error: {
        icon: AlertTriangle,
        label: "Unable to Check Status",
        description: "Could not verify pricing status",
        bgColor: darkMode ? "bg-gray-800" : "bg-gray-100",
        borderColor: darkMode ? "border-gray-700" : "border-gray-300",
        iconColor: "text-gray-500",
        badgeColor: darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-200 text-gray-800",
      },
    };

    return configs[status] || configs.error;
  };

  if (isLoading) {
    return (
      <div
        className={`p-3 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-300"}`}
      >
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin">
            <DollarSign className="w-4 h-4" />
          </div>
          Checking pricing status...
        </div>
      </div>
    );
  }

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-medium ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{config.label}</p>
          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${config.badgeColor}`}>
            {status === "priced" ? "✓ Priced" : status === "unpriced" ? "⚠ Unpriced" : "✗ Missing"}
          </span>
        </div>
        <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{config.description}</p>
        {config.action && onQuickEdit && (
          <button
            type="button"
            onClick={onQuickEdit}
            className={`mt-2 text-xs font-medium py-1 px-2 rounded transition-colors ${
              darkMode
                ? "bg-blue-900/40 hover:bg-blue-900/60 text-blue-300"
                : "bg-blue-100 hover:bg-blue-200 text-blue-700"
            }`}
          >
            Fix Pricing →
          </button>
        )}
      </div>
    </div>
  );
}
