/**
 * PriceInheritanceIndicator - Badge showing price override status
 *
 * Shows:
 * - Green "Override" for customer-specific prices
 * - Gray "Inherited" for default prices
 */
export default function PriceInheritanceIndicator({ isOverride, isDarkMode }) {
  if (isOverride) {
    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          isDarkMode ? "bg-green-900 text-green-100" : "bg-green-100 text-green-800"
        }`}
        title="Customer-specific price override"
      >
        ✓ Override
      </span>
    );
  }

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
      }`}
      title="Using company default price"
    >
      → Inherited
    </span>
  );
}
