import { AlertTriangle, ChevronDown, Copy, Package, Ship } from "lucide-react";
import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { formatCurrency } from "../../utils/invoiceUtils";

function getEffectiveCost(batch) {
  const isImported = batch.procurementChannel === "IMPORTED";
  if (isImported && batch.landedCostPerUnit != null && parseFloat(batch.landedCostPerUnit) > 0) {
    return parseFloat(batch.landedCostPerUnit);
  }
  return parseFloat(batch.unitCost) || 0;
}

function getDaysAge(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Math.ceil(Math.abs(Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const GRID_COLS = "grid-cols-[minmax(160px,1.5fr)_100px_100px_120px_130px_50px_100px]";

const BatchCostTable = ({ batches = [], onBatchClick }) => {
  const { isDarkMode } = useTheme();
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggle = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyBatchNumber = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  const sortedBatches = useMemo(
    () =>
      [...batches]
        .filter((b) => (b.quantityRemaining || 0) > 0)
        .sort((a, b) => new Date(a.receivedDate || a.createdAt || 0) - new Date(b.receivedDate || b.createdAt || 0)),
    [batches]
  );

  if (sortedBatches.length === 0) {
    return (
      <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
        <Package size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No active batches</p>
      </div>
    );
  }

  const headerClass = `text-xs font-medium uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`;

  return (
    <div className="overflow-x-auto text-sm">
      {/* Header row */}
      <div className={`grid ${GRID_COLS} items-center px-3 py-2 ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}>
        <div className={`${headerClass} text-left`}>Batch</div>
        <div className={`${headerClass} text-center`}>Channel</div>
        <div className={`${headerClass} text-right`}>Qty Remaining</div>
        <div className={`${headerClass} text-right`}>Eff. Cost/Unit</div>
        <div className={`${headerClass} text-right`}>Total Value</div>
        <div className={`${headerClass} text-right`}>Age</div>
        <div className={`${headerClass} text-right`}>Received</div>
      </div>

      {/* Data rows */}
      <div className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
        {sortedBatches.map((batch) => {
          const isImported = batch.procurementChannel === "IMPORTED";
          const effectiveCost = getEffectiveCost(batch);
          const qty = parseFloat(batch.quantityRemaining) || 0;
          const totalVal = qty * effectiveCost;
          const age = getDaysAge(batch.receivedDate || batch.createdAt);
          const isExpanded = expandedIds.has(batch.id);
          const hasNullLanded =
            isImported && (batch.landedCostPerUnit == null || parseFloat(batch.landedCostPerUnit) <= 0);
          const batchLabel = batch.batchNumber || `B-${batch.id}`;

          return (
            <div key={batch.id} className="group">
              {/* Main row */}
              {/* biome-ignore lint/a11y/useSemanticElements: div used for grid layout styling */}
              <div
                className={`grid ${GRID_COLS} items-center px-3 py-2.5 cursor-pointer transition-colors ${
                  isDarkMode ? "hover:bg-[#2E3B4E]" : "hover:bg-gray-50"
                }`}
                onClick={() => (isImported ? toggle(batch.id) : onBatchClick?.(batch))}
                onKeyDown={null}
                role="button"
                tabIndex={0}
              >
                {/* Batch */}
                <div className="flex items-center gap-2 min-w-0">
                  {isImported ? (
                    <ChevronDown
                      size={14}
                      className={`shrink-0 transition-transform ${isExpanded ? "" : "-rotate-90"} ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                    />
                  ) : (
                    <div className="w-[14px]" />
                  )}
                  <span className={`font-medium truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {batchLabel}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => copyBatchNumber(e, batchLabel)}
                    className={`opacity-0 group-hover:opacity-100 p-0.5 rounded ${isDarkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-gray-200 text-gray-500"}`}
                    title="Copy batch number"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                {/* Channel */}
                <div className="text-center">
                  {isImported ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}
                    >
                      <Ship size={12} /> Import
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"}`}
                    >
                      <Package size={12} /> Local
                    </span>
                  )}
                </div>
                {/* Qty */}
                <div className={`text-right ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {/* Effective Cost */}
                <div
                  className={`text-right flex items-center justify-end gap-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                >
                  {formatCurrency(effectiveCost)}
                  {hasNullLanded && (
                    <span title="Landed cost missing — using unit cost">
                      <AlertTriangle size={12} className={isDarkMode ? "text-amber-400" : "text-amber-500"} />
                    </span>
                  )}
                </div>
                {/* Total Value */}
                <div className={`text-right font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {formatCurrency(totalVal)}
                </div>
                {/* Age */}
                <div
                  className={`text-right ${
                    age && age > 90
                      ? isDarkMode
                        ? "text-amber-400"
                        : "text-amber-600"
                      : isDarkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                  }`}
                >
                  {age != null ? `${age}d` : "-"}
                </div>
                {/* Received */}
                <div className={`text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {formatDate(batch.receivedDate)}
                </div>
              </div>

              {/* Expanded landed cost breakdown for imported batches */}
              {isImported && isExpanded && (
                <div className={`px-6 pb-3 pt-1 ml-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                    <div>
                      <span className="block font-medium mb-0.5">FOB Cost</span>
                      <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>
                        {formatCurrency(batch.unitCost || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="block font-medium mb-0.5">Freight</span>
                      <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>
                        {formatCurrency(batch.freightCost || batch.freight_cost || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="block font-medium mb-0.5">Duty</span>
                      <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>
                        {formatCurrency(batch.dutyCost || batch.duty_cost || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="block font-medium mb-0.5">Insurance</span>
                      <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>
                        {formatCurrency(batch.insuranceCost || batch.insurance_cost || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="block font-medium mb-0.5">Handling</span>
                      <span className={isDarkMode ? "text-gray-200" : "text-gray-700"}>
                        {formatCurrency(batch.handlingCost || batch.handling_cost || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="block font-medium mb-0.5">Landed/Unit</span>
                      <span className={`font-semibold ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                        {batch.landedCostPerUnit ? formatCurrency(batch.landedCostPerUnit) : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

BatchCostTable.propTypes = {
  batches: PropTypes.array,
  onBatchClick: PropTypes.func,
};

export default BatchCostTable;
