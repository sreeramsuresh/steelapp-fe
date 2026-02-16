import {
  AlertTriangle,
  DollarSign,
  Hash,
  Layers,
  Loader2,
  TrendingUp,
  X,
} from "lucide-react";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { stockBatchService } from "../../services/stockBatchService";
import { formatCurrency } from "../../utils/invoiceUtils";
import BatchCostTable from "./BatchCostTable";

function getEffectiveCost(batch) {
  const isImported = batch.procurementChannel === "IMPORTED";
  if (isImported && batch.landedCostPerUnit != null && parseFloat(batch.landedCostPerUnit) > 0) {
    return parseFloat(batch.landedCostPerUnit);
  }
  return parseFloat(batch.unitCost) || 0;
}

const ProductBatchDrawer = ({ open, onClose, product }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !product?.productId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    stockBatchService
      .getBatchesByProduct(product.productId, { hasStock: true })
      .then((res) => {
        if (cancelled) return;
        const raw = res.batches || res;
        setBatches(Array.isArray(raw) ? raw : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load batches");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, product?.productId]);

  const stats = useMemo(() => {
    const activeBatches = batches.filter((b) => (b.quantityRemaining || 0) > 0);
    const totalQty = activeBatches.reduce((s, b) => s + (parseFloat(b.quantityRemaining) || 0), 0);
    const totalValue = activeBatches.reduce((s, b) => {
      const qty = parseFloat(b.quantityRemaining) || 0;
      return s + qty * getEffectiveCost(b);
    }, 0);
    const avgCost = totalQty > 0 ? totalValue / totalQty : 0;
    const hasImported = activeBatches.some((b) => b.procurementChannel === "IMPORTED");

    // Last buy price: unit_cost from newest batch
    const sorted = [...activeBatches].sort(
      (a, b) => new Date(b.receivedDate || b.createdAt || 0) - new Date(a.receivedDate || a.createdAt || 0),
    );
    const lastBuyPrice = sorted.length > 0 ? parseFloat(sorted[0].unitCost) || 0 : 0;

    return {
      totalQty,
      totalValue,
      avgCost,
      lastBuyPrice,
      batchCount: activeBatches.length,
      hasImported,
    };
  }, [batches]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} onKeyDown={null} role="presentation" />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-4xl z-50 shadow-2xl flex flex-col transition-transform ${
          isDarkMode ? "bg-[#1A1F25]" : "bg-white"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="min-w-0">
            <h2 className={`text-lg font-semibold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {product?.productName || "Product Batches"}
            </h2>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {product?.productSku || ""} — {stats.totalQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {product?.unit || "KG"} on hand
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className={`grid grid-cols-4 gap-3 px-6 py-4 shrink-0 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className={isDarkMode ? "text-green-400" : "text-green-600"} />
              <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {stats.hasImported ? "Total Value (Landed)" : "Total Value (Cost)"}
              </span>
            </div>
            <p className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {formatCurrency(stats.totalValue)}
            </p>
          </div>

          <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className={isDarkMode ? "text-blue-400" : "text-blue-600"} />
              <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Wtd Avg Cost/Unit</span>
            </div>
            <p className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {formatCurrency(stats.avgCost)}
            </p>
          </div>

          <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className={isDarkMode ? "text-purple-400" : "text-purple-600"} />
              <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Last Buy Price</span>
            </div>
            <p className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {formatCurrency(stats.lastBuyPrice)}
            </p>
          </div>

          <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-1">
              <Layers size={14} className={isDarkMode ? "text-teal-400" : "text-teal-600"} />
              <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Active Batches</span>
            </div>
            <p className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {stats.batchCount}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} />
            </div>
          ) : error ? (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${isDarkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-700"}`}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          ) : (
            <BatchCostTable batches={batches} />
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <Link
            to={`/app/stock-movements?product_id=${product?.productId}`}
            className={`text-sm font-medium ${isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"}`}
          >
            View Full Movement History →
          </Link>
        </div>
      </div>
    </>
  );
};

ProductBatchDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.shape({
    productId: PropTypes.number,
    productName: PropTypes.string,
    productSku: PropTypes.string,
    unit: PropTypes.string,
  }),
};

export default ProductBatchDrawer;
