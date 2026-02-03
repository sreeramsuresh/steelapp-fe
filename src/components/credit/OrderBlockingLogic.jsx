import { AlertTriangle, Phone, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * OrderBlockingLogic Component
 *
 * Displays a modal warning when a customer with credit grade D or E attempts to place an order.
 * Prevents order creation until manager approval or payment arrangement.
 *
 * Props:
 * - customer: Customer object with creditGrade field
 * - isOpen: Boolean to control modal visibility
 * - onClose: Callback when user closes the modal
 * - onApproveOverride: Callback when user confirms manager approval
 * - onContactFinance: Callback when user chooses to contact finance
 */
const OrderBlockingLogic = ({ customer, isOpen, onClose, onApproveOverride, onContactFinance }) => {
  const { isDarkMode } = useTheme();
  const [selectedAction, setSelectedAction] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Determine if customer is blocked
  const isBlocked = customer?.creditGrade && ["D", "E"].includes(customer.creditGrade);

  // Calculate days since last payment (if data available)
  const daysSincePayment = customer?.daysSinceLastPayment || null;
  const dsoThreshold = customer?.dsoThreshold || 90;
  const overdueAmount = customer?.overdueAmount || 0;

  useEffect(() => {
    if (!isOpen) {
      setSelectedAction(null);
      setShowConfirmation(false);
    }
  }, [isOpen]);

  if (!isOpen || !customer) {
    return null;
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case "A":
        return "text-green-600 dark:text-green-400";
      case "B":
        return "text-blue-600 dark:text-blue-400";
      case "C":
        return "text-yellow-600 dark:text-yellow-400";
      case "D":
        return "text-orange-600 dark:text-orange-400";
      case "E":
        return "text-red-600 dark:text-red-500";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getGradeBg = (grade) => {
    switch (grade) {
      case "A":
        return "bg-green-100 dark:bg-green-900/30";
      case "B":
        return "bg-blue-100 dark:bg-blue-900/30";
      case "C":
        return "bg-yellow-100 dark:bg-yellow-900/30";
      case "D":
        return "bg-orange-100 dark:bg-orange-900/30";
      case "E":
        return "bg-red-100 dark:bg-red-900/30";
      default:
        return "bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const handleApproveClick = () => {
    setSelectedAction("approve");
    setShowConfirmation(true);
  };

  const handleConfirmApproval = () => {
    setShowConfirmation(false);
    if (onApproveOverride) {
      onApproveOverride();
    }
    onClose();
  };

  const handleContactFinance = () => {
    setShowConfirmation(false);
    if (onContactFinance) {
      onContactFinance();
    }
    onClose();
  };

  // If customer is not blocked, don&apos;t show modal
  if (!isBlocked) {
    return null;
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className={`fixed inset-0 z-50 ${isDarkMode ? "bg-black/60" : "bg-black/40"}`}
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
        <div
          className={`relative max-w-md w-full rounded-lg shadow-2xl ${
            isDarkMode ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200"
          }`}
          role="dialog"
          aria-modal="true"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className={`absolute top-3 right-3 p-1 rounded-md transition-colors ${
              isDarkMode
                ? "hover:bg-gray-800 text-gray-400 hover:text-gray-300"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className={`px-5 pt-5 pb-3 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getGradeBg(customer.creditGrade)}`}>
                <XCircle className={`w-6 h-6 ${getGradeColor(customer.creditGrade)}`} />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Order Blocked</h2>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Credit management restriction
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={`px-5 py-4 space-y-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            {/* Customer Info */}
            <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
              <p className="text-sm">
                <span className="font-medium">Customer:</span> {customer.name}
              </p>
              <p className="text-sm mt-1">
                <span className="font-medium">Credit Grade:</span>
                <span
                  className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${getGradeBg(customer.creditGrade)} ${getGradeColor(customer.creditGrade)}`}
                >
                  {customer.creditGrade}
                </span>
              </p>
            </div>

            {/* Reason */}
            <div>
              <h4
                className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                  isDarkMode ? "text-red-400" : "text-red-600"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Why is this order blocked?
              </h4>
              <p className="text-sm leading-relaxed">
                Orders are blocked for customers with severe credit issues (Grades D & E).
                {daysSincePayment && (
                  <>
                    {" "}
                    This customer has <span className="font-medium">{daysSincePayment} days</span> since last payment,
                    exceeding the threshold of {dsoThreshold} days.
                  </>
                )}
              </p>

              {/* Overdue Amount */}
              {overdueAmount > 0 && (
                <p
                  className={`text-sm mt-2 p-2 rounded ${
                    isDarkMode ? "bg-red-900/20 text-red-300" : "bg-red-50 text-red-700"
                  }`}
                >
                  <span className="font-medium">Current Overdue:</span> AED {overdueAmount.toFixed(2)}
                </p>
              )}
            </div>

            {/* Recommendation */}
            <div
              className={`p-3 rounded-lg border-l-4 ${
                isDarkMode ? "border-blue-500 bg-blue-900/10 text-blue-300" : "border-blue-500 bg-blue-50 text-blue-900"
              }`}
            >
              <p className="text-sm font-medium mb-1">Recommended Action:</p>
              <p className="text-sm">
                Please contact the customer to arrange payment for outstanding invoices before processing new orders.
              </p>
            </div>
          </div>

          {/* Confirmation Dialog (shown after clicking Approve) */}
          {showConfirmation && selectedAction === "approve" ? (
            <div
              className={`px-5 py-4 border-t ${
                isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
              }`}
            >
              <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                By approving this order, you confirm that you have:
              </p>
              <ul className={`text-sm space-y-1 mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                <li className="flex items-start gap-2">
                  <span
                    className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isDarkMode ? "bg-teal-400" : "bg-teal-600"
                    }`}
                  />
                  Contacted the customer about payment
                </li>
                <li className="flex items-start gap-2">
                  <span
                    className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isDarkMode ? "bg-teal-400" : "bg-teal-600"
                    }`}
                  />
                  Obtained manager/supervisor approval
                </li>
                <li className="flex items-start gap-2">
                  <span
                    className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isDarkMode ? "bg-teal-400" : "bg-teal-600"
                    }`}
                  />
                  Documented the approval reason
                </li>
              </ul>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmApproval}
                  className="flex-1 px-3 py-2 rounded-md text-sm font-medium bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 transition-colors"
                >
                  Confirm & Create Order
                </button>
              </div>
            </div>
          ) : (
            /* Action Buttons */
            <div className={`px-5 py-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} space-y-2`}>
              <button
                onClick={handleApproveClick}
                className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isDarkMode
                    ? "bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/50"
                    : "bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200"
                }`}
              >
                Manager Approval - Create Order
              </button>
              <button
                onClick={handleContactFinance}
                className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  isDarkMode
                    ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/50"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                }`}
              >
                <Phone className="w-4 h-4" />
                Contact Finance Team
              </button>
              <button
                onClick={onClose}
                className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                Cancel Order
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderBlockingLogic;
