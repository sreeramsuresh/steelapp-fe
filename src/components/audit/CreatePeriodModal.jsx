import { X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

/**
 * Create Period Modal
 * Dialog for creating new accounting periods
 */

export default function CreatePeriodModal({ isOpen, onClose, onCreatePeriod, isLoading }) {
  const [periodType, setPeriodType] = useState("MONTHLY");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const currentYear = new Date().getFullYear();
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await onCreatePeriod(periodType, year, month);
      toast.success("Period created successfully!");
      onClose();
    } catch (err) {
      toast.error(`Failed to create period: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create New Period</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Period Type */}
          <div>
            <label htmlFor="period-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Period Type
            </label>
            <select
              id="period-type"
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          {/* Year */}
          <div>
            <label htmlFor="period-year" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Year
            </label>
            <select
              id="period-year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month (only for monthly periods) */}
          {periodType === "MONTHLY" && (
            <div>
              <label
                htmlFor="period-month"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Month
              </label>
              <select
                id="period-month"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create Period"}
          </button>
        </div>
      </div>
    </div>
  );
}
