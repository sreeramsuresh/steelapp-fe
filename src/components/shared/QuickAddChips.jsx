import { Pin } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Enhanced quick-add chips showing product name, last price, and stock level.
 *
 * @param {Object} props
 * @param {Array} props.products - Product array with id, displayName/name, lastPrice, stockQty, etc.
 * @param {Array} [props.pinnedIds] - Array of pinned product IDs
 * @param {Function} props.onSelect - Called with product when chip is clicked
 * @param {Function} [props.onTogglePin] - Called with (event, productId) to toggle pin
 * @param {string} [props.label] - Section label
 * @param {Function} [props.getProductName] - Custom function to get display name from product
 * @param {Function} [props.getProductMeta] - Custom function to get meta text (price + stock) from product. Returns { price, stock } or null.
 */
export default function QuickAddChips({
  products = [],
  pinnedIds = [],
  onSelect,
  onTogglePin,
  label = "Quick Add \u2014 Pinned Products",
  getProductName,
  getProductMeta,
}) {
  const { isDarkMode } = useTheme();

  if (!products.length) return null;

  const getName = (product) => {
    if (getProductName) return getProductName(product);
    return (
      product.displayName ||
      product.display_name ||
      product.uniqueName ||
      product.unique_name ||
      product.name ||
      product.description ||
      product.sku ||
      "Product"
    );
  };

  const getMeta = (product) => {
    if (getProductMeta) return getProductMeta(product);
    return null;
  };

  return (
    <div className="mb-4">
      <div
        className={`text-[11px] font-semibold uppercase tracking-[0.06em] mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
      >
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {products.map((product) => {
          const isPinned = pinnedIds.includes(product.id);
          const meta = getMeta(product);

          return (
            <div key={product.id} className="relative group">
              <button
                type="button"
                onClick={() => onSelect(product)}
                className={`flex flex-col px-3.5 py-2 border-[1.5px] rounded-md cursor-pointer transition-all min-w-[150px] text-left
                  ${
                    isPinned
                      ? isDarkMode
                        ? "border-teal-700 bg-teal-900/40 hover:bg-teal-900/60"
                        : "border-teal-500 bg-teal-50 hover:bg-teal-100"
                      : isDarkMode
                        ? "border-gray-700 bg-gray-800 hover:border-teal-600 hover:bg-gray-750"
                        : "border-gray-200 bg-white hover:border-teal-500 hover:bg-teal-50"
                  }
                  hover:-translate-y-px hover:shadow-sm
                  ${onTogglePin ? "pr-7" : ""}
                `}
              >
                <span
                  className={`text-[12.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] ${
                    isDarkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {getName(product)}
                </span>
                {meta && (
                  <span
                    className={`flex items-center gap-2 mt-0.5 text-[11px] font-mono font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {meta.price && <span>{meta.price}</span>}
                    {meta.price && meta.stock && (
                      <span className={`w-[3px] h-[3px] rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`} />
                    )}
                    {meta.stock && <span className="text-emerald-600">{meta.stock}</span>}
                  </span>
                )}
              </button>
              {onTogglePin && (
                <button
                  type="button"
                  onClick={(e) => onTogglePin(e, product.id)}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded transition-all ${
                    isPinned
                      ? isDarkMode
                        ? "text-teal-300"
                        : "text-teal-700"
                      : isDarkMode
                        ? "text-gray-500 hover:text-teal-400"
                        : "text-gray-400 hover:text-teal-600"
                  }`}
                  title={isPinned ? "Unpin product" : "Pin product"}
                >
                  {isPinned ? <Pin size={12} fill="currentColor" /> : <Pin size={12} />}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
