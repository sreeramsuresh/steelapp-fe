import { AlertCircle, Calendar, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";

export default function DeliveryScheduleModal({ isOpen, onClose, schedule, lineQuantity, onSave }) {
  const { isDarkMode } = useTheme();
  const [localSchedule, setLocalSchedule] = useState(schedule || []);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLocalSchedule(schedule || []);
      setValidationError("");
    }
  }, [isOpen, schedule]);

  const addScheduleEntry = () => {
    setLocalSchedule([...localSchedule, { date: "", quantity: 0, notes: "" }]);
  };

  const removeScheduleEntry = (index) => {
    setLocalSchedule(localSchedule.filter((_, i) => i !== index));
  };

  const updateScheduleEntry = (index, field, value) => {
    const updated = [...localSchedule];
    updated[index] = { ...updated[index], [field]: value };
    setLocalSchedule(updated);
  };

  const validateSchedule = () => {
    if (localSchedule.length === 0) {
      return true; // Empty schedule is valid
    }

    const totalScheduledQty = localSchedule.reduce((sum, entry) => sum + (parseFloat(entry.quantity) || 0), 0);

    if (Math.abs(totalScheduledQty - lineQuantity) > 0.01) {
      setValidationError(
        `Total scheduled quantity (${totalScheduledQty.toFixed(2)}) must match line quantity (${lineQuantity.toFixed(2)})`
      );
      return false;
    }

    const hasEmptyDate = localSchedule.some((entry) => !entry.date);
    if (hasEmptyDate) {
      setValidationError("All delivery entries must have a date");
      return false;
    }

    setValidationError("");
    return true;
  };

  const handleSave = () => {
    if (!validateSchedule()) {
      return;
    }

    const sortedSchedule = localSchedule
      .filter((entry) => entry.date && entry.quantity > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    onSave(sortedSchedule);
    onClose();
  };

  const totalScheduledQty = localSchedule.reduce((sum, entry) => sum + (parseFloat(entry.quantity) || 0), 0);
  const remainingQty = lineQuantity - totalScheduledQty;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onClose();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        />

        <div
          className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Delivery Schedule
                  </h3>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Plan phased deliveries for line quantity: {lineQuantity} units
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`p-1 rounded-lg ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                aria-label="Close delivery schedule modal"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{validationError}</p>
              </div>
            )}

            {/* Validation Requirements */}
            <div
              className={`p-3 mb-4 rounded-lg border text-sm ${isDarkMode ? "bg-gray-900/30 border-amber-700 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-900"}`}
            >
              <p className="font-medium mb-2">Requirements:</p>
              <ul className="space-y-1 text-xs list-disc list-inside">
                <li>Total scheduled quantity must match line quantity ({lineQuantity} units)</li>
                <li>Each delivery entry requires a date and quantity</li>
                <li>Entries are sorted by date in the schedule</li>
              </ul>
            </div>

            {/* Summary Progress */}
            <div className={`p-3 mb-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-blue-50"}`}>
              <div className="flex justify-between items-center text-sm">
                <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Line Quantity:</span>
                <span className="font-semibold">{lineQuantity} units</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Total Scheduled:</span>
                <span
                  className={`font-semibold ${Math.abs(remainingQty) < 0.01 ? "text-green-600" : "text-orange-600"}`}
                >
                  {totalScheduledQty.toFixed(2)} units
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Remaining:</span>
                <span
                  className={`font-semibold ${
                    Math.abs(remainingQty) < 0.01
                      ? "text-green-600"
                      : remainingQty < 0
                        ? "text-red-600"
                        : "text-orange-600"
                  }`}
                >
                  {remainingQty.toFixed(2)} units
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {localSchedule.map((entry, index) => (
                <div
                  key={entry}
                  className={`p-3 rounded-lg border ${
                    isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <label
                          htmlFor={`delivery-date-${index}`}
                          className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          Delivery Date *
                        </label>
                        <input
                          id={`delivery-date-${index}`}
                          type="date"
                          value={entry.date}
                          onChange={(e) => updateScheduleEntry(index, "date", e.target.value)}
                          className={`w-full px-2 py-1.5 text-sm rounded border ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`delivery-quantity-${index}`}
                          className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          Quantity *
                        </label>
                        <input
                          id={`delivery-quantity-${index}`}
                          type="number"
                          step="0.01"
                          value={entry.quantity}
                          onChange={(e) => updateScheduleEntry(index, "quantity", parseFloat(e.target.value) || 0)}
                          className={`w-full px-2 py-1.5 text-sm rounded border ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`delivery-notes-${index}`}
                          className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          Notes (optional)
                        </label>
                        <input
                          id={`delivery-notes-${index}`}
                          type="text"
                          value={entry.notes}
                          onChange={(e) => updateScheduleEntry(index, "notes", e.target.value)}
                          className={`w-full px-2 py-1.5 text-sm rounded border ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                          placeholder="Partial shipment"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeScheduleEntry(index)}
                      className="mt-5 p-1.5 text-red-600 hover:bg-red-50 rounded"
                      aria-label={`Delete delivery date entry ${index + 1}`}
                      title="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addScheduleEntry}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
              aria-label="Add new delivery date entry"
              title="Add delivery date"
            >
              <Plus className="h-4 w-4" />
              Add Delivery Date
            </button>
          </div>

          <div
            className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t ${
              isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
            }`}
          >
            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Save Schedule
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`mt-3 sm:mt-0 sm:mr-3 w-full sm:w-auto px-4 py-2 rounded-lg font-medium ${
                isDarkMode
                  ? "bg-gray-600 text-white hover:bg-gray-500"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
