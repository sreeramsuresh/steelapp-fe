import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

const DELETION_REASONS = [
  {
    value: "duplicate",
    label: "Duplicate Entry",
    description: "This invoice was created by mistake (duplicate)",
  },
  {
    value: "error",
    label: "Entered in Error",
    description: "Wrong data or information was entered",
  },
  {
    value: "cancelled",
    label: "Customer Cancellation",
    description: "Customer cancelled the order",
  },
  {
    value: "pricing",
    label: "Pricing Error",
    description: "Incorrect pricing or rates",
  },
  {
    value: "wrong_customer",
    label: "Wrong Customer",
    description: "Invoice created for wrong customer",
  },
  {
    value: "data_mistake",
    label: "Data Entry Mistake",
    description: "General data entry error",
  },
  {
    value: "other",
    label: "Other Reason",
    description: "Specify custom reason below",
  },
];

const DeleteInvoiceModal = ({ isOpen, onClose, onConfirm, invoice }) => {
  const { isDarkMode } = useTheme();
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const invoiceNumber = invoice?.invoiceNumber || invoice?.invoiceNumber || invoice?.id;
  const invoiceStatus = invoice?.status || "draft";

  const statusLabels = {
    draft: "Draft",
    proforma: "Proforma",
    issued: "Final Tax Invoice",
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      alert("Please select a reason for deletion");
      return;
    }

    if (selectedReason === "other" && !customReason.trim()) {
      alert("Please provide a custom reason");
      return;
    }

    const reason =
      selectedReason === "other"
        ? customReason.trim()
        : DELETION_REASONS.find((r) => r.value === selectedReason)?.label;

    setIsDeleting(true);
    try {
      await onConfirm({
        invoiceId: invoice.id,
        reason,
        reasonCode: selectedReason,
      });
      handleClose();
    } catch (_error) {
      setIsDeleting(false);
      // Error handling done by parent
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomReason("");
    setIsDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`relative w-full max-w-lg rounded-lg shadow-xl ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Delete Invoice</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {statusLabels[invoiceStatus]} #{invoiceNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className={`p-1 rounded-lg transition-colors ${
              isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Warning Message */}
          <div
            className={`p-4 rounded-lg border ${
              isDarkMode
                ? "bg-yellow-900/20 border-yellow-700 text-yellow-200"
                : "bg-yellow-50 border-yellow-200 text-yellow-800"
            }`}
          >
            <p className="text-sm font-medium mb-1">⚠️ Important: Soft Delete with Audit Trail</p>
            <p className="text-xs">
              This invoice will be marked as deleted but retained in the system for audit and compliance purposes. You
              can restore it later if needed.
            </p>
          </div>

          {/* Reason Selection */}
          <div>
            <div className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
              Reason for Deletion <span className="text-red-500">*</span>
            </div>
            <div className="space-y-2">
              {DELETION_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  htmlFor={`reason-${reason.value}`}
                  aria-label={reason.label}
                  className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedReason === reason.value
                      ? isDarkMode
                        ? "border-teal-500 bg-teal-900/20"
                        : "border-teal-500 bg-teal-50"
                      : isDarkMode
                        ? "border-gray-600 hover:border-gray-500 hover:bg-gray-700"
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    id={`reason-${reason.value}`}
                    name="deleteReason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-sm">{reason.label}</div>
                    <div className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {reason.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Reason Text Area */}
          {selectedReason === "other" && (
            <div>
              <label
                htmlFor="customReason"
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
              >
                Custom Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please provide a detailed reason for deletion..."
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-teal-500"
                } focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 outline-none`}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex gap-3 p-6 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"
            } ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isDeleting || !selectedReason || (selectedReason === "other" && !customReason.trim())}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDeleting || !selectedReason || (selectedReason === "other" && !customReason.trim())
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isDeleting ? "Deleting..." : "Delete Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteInvoiceModal;
