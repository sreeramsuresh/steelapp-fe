import { AlertTriangle, CheckCircle, X } from "lucide-react";

/**
 * LineItemPricingStatus - Badge showing pricing status for invoice line item
 *
 * Shows:
 * - ✅ Green for priced products
 * - ⚠️ Yellow for using default price (no customer override)
 * - ❌ Red for missing price (blocks finalization)
 */
export default function LineItemPricingStatus({ status, isDarkMode }) {
  if (status === "priced") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
          isDarkMode ? "bg-green-900 text-green-100" : "bg-green-100 text-green-800"
        }`}
        title="Product is priced and ready for invoicing"
      >
        <CheckCircle className="w-3 h-3" />
        Priced
      </span>
    );
  }

  if (status === "using_default") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
          isDarkMode ? "bg-yellow-900 text-yellow-100" : "bg-yellow-100 text-yellow-800"
        }`}
        title="Using company default price (no customer override)"
      >
        <AlertTriangle className="w-3 h-3" />
        Default Price
      </span>
    );
  }

  if (status === "missing_price") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
          isDarkMode ? "bg-red-900 text-red-100" : "bg-red-100 text-red-800"
        }`}
        title="Product has no pricing - invoice cannot be finalized"
      >
        <X className="w-3 h-3" />
        Missing Price
      </span>
    );
  }

  return null;
}
