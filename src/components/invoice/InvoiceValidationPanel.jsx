import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { useState } from "react";

/**
 * InvoiceValidationPanel - Pre-finalization validation modal
 *
 * Shows critical issues (blocking) and warnings (bypassable)
 * Critical issues prevent finalization
 * Warnings can be acknowledged to proceed
 */
export default function InvoiceValidationPanel({
  isOpen,
  onClose,
  criticalIssues,
  warnings,
  isDarkMode,
  onProceed,
  isLoading,
}) {
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(false);

  if (!isOpen) return null;

  const canProceed = criticalIssues.length === 0 && (warnings.length === 0 || warningsAcknowledged);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Invoice Validation</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={`p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Critical Issues Section */}
        {criticalIssues.length > 0 && (
          <div className="mb-6">
            <div
              className={`flex items-start gap-3 p-4 rounded-lg mb-3 ${
                isDarkMode ? "bg-red-900/20 border border-red-700" : "bg-red-50 border border-red-300"
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className={`font-semibold ${isDarkMode ? "text-red-100" : "text-red-900"}`}>
                  Cannot Finalize - Fix These Issues First
                </p>
                <ul className={`mt-2 space-y-2 text-sm ${isDarkMode ? "text-red-200/80" : "text-red-700"}`}>
                  {criticalIssues.map((issue) => (
                    <li key={`${issue.type}-${issue.productId || "general"}`} className="flex gap-2">
                      <span className="text-red-500">•</span>
                      <span>{issue.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Warnings Section */}
        {warnings.length > 0 && (
          <div className="mb-6">
            <div
              className={`flex items-start gap-3 p-4 rounded-lg ${
                isDarkMode ? "bg-yellow-900/20 border border-yellow-700" : "bg-yellow-50 border border-yellow-300"
              }`}
            >
              <Info className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className={`font-semibold ${isDarkMode ? "text-yellow-100" : "text-yellow-900"}`}>
                  Review These Warnings
                </p>
                <ul className={`mt-2 space-y-2 text-sm ${isDarkMode ? "text-yellow-200/80" : "text-yellow-700"}`}>
                  {warnings.map((warning) => (
                    <li key={`${warning.type}-${warning.productId || "general"}`} className="flex gap-2">
                      <span className="text-yellow-500">•</span>
                      <span>{warning.message}</span>
                    </li>
                  ))}
                </ul>

                {/* Acknowledge Checkbox */}
                {criticalIssues.length === 0 && (
                  <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={warningsAcknowledged}
                      onChange={(e) => setWarningsAcknowledged(e.target.checked)}
                      disabled={isLoading}
                      className="w-4 h-4 rounded"
                    />
                    <span className={`text-sm font-medium ${isDarkMode ? "text-yellow-100" : "text-yellow-900"}`}>
                      I acknowledge these warnings and want to proceed
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {criticalIssues.length === 0 && warnings.length === 0 && (
          <div
            className={`flex items-start gap-3 p-4 rounded-lg ${
              isDarkMode ? "bg-green-900/20 border border-green-700" : "bg-green-50 border border-green-300"
            }`}
          >
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className={`font-semibold ${isDarkMode ? "text-green-100" : "text-green-900"}`}>Ready to Finalize</p>
              <p className={`text-sm mt-1 ${isDarkMode ? "text-green-200/80" : "text-green-700"}`}>
                All pricing validation checks passed. You can proceed with invoice finalization.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-8">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50"
                : "bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-50"
            } ${isLoading ? "cursor-not-allowed" : ""}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onProceed}
            disabled={!canProceed || isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
              isDarkMode
                ? "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50"
                : "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:opacity-50"
            } ${!canProceed || isLoading ? "cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Processing..." : "Finalize Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
