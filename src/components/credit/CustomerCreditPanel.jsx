import { AlertCircle, Calendar, DollarSign, Edit3, Shield, TrendingUp } from "lucide-react";
import { useContext, useState } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";
import { formatDateDMY } from "../../utils/invoiceUtils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

/**
 * CustomerCreditPanel Component
 * Displays customer credit management with Phase 5 DSO-based grading
 * Features:
 * - Credit limit, utilization, and available balance
 * - DSO-based credit grade (A-E)
 * - Aging analysis in 5 buckets
 * - Last payment tracking
 * - Order eligibility indicators
 * - Credit limit adjustment modal
 */
const CustomerCreditPanel = ({
  customer = {},
  onUpdateCreditLimit = () => {},
  onViewAging = () => {},
  onViewPaymentHistory = () => {},
  readOnly = false,
}) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newCreditLimit, setNewCreditLimit] = useState(customer.creditLimit || 0);
  const [reviewReason, setReviewReason] = useState("");

  // Get credit grade color and icon
  const getCreditGradeColor = (grade) => {
    const colorMap = {
      A: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      B: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      C: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      D: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      E: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colorMap[grade] || "bg-gray-100 text-gray-800";
  };

  const getCreditGradeDescription = (grade) => {
    const descriptions = {
      A: "Excellent - Reliable payment history",
      B: "Good - Minor delays occasional",
      C: "Fair - Moderate payment delays",
      D: "Poor - Frequent delays (orders blocked)",
      E: "Critical - Severe delays (orders blocked)",
    };
    return descriptions[grade] || "Unknown";
  };

  // Determine if customer can place orders
  const canPlaceOrders = !["D", "E"].includes(customer.creditGrade);

  // Calculate credit utilization percentage
  const creditUtilization = customer.creditLimit ? ((customer.creditUsed || 0) / customer.creditLimit) * 100 : 0;

  // Get color for utilization bar
  const getUtilizationColor = (percentage) => {
    if (percentage <= 50) return "bg-green-500";
    if (percentage <= 75) return "bg-yellow-500";
    if (percentage <= 90) return "bg-orange-500";
    return "bg-red-500";
  };

  const handleUpdateCreditLimit = () => {
    if (newCreditLimit < 0) {
      alert("Credit limit cannot be negative");
      return;
    }
    onUpdateCreditLimit({
      customerId: customer.id,
      newLimit: parseFloat(newCreditLimit),
      reason: reviewReason,
    });
    setIsEditModalOpen(false);
    setNewCreditLimit(customer.creditLimit || 0);
    setReviewReason("");
  };

  const cardBg = isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white";
  const textColor = isDarkMode ? "text-gray-100" : "text-gray-900";
  const mutedColor = isDarkMode ? "text-gray-400" : "text-gray-600";
  const dividerColor = isDarkMode ? "border-gray-700" : "border-gray-200";

  return (
    <>
      <Card className={`${cardBg} border ${dividerColor}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <CardTitle className={textColor}>Credit Management</CardTitle>
            </div>
            <Badge className={getCreditGradeColor(customer.creditGrade || "A")}>
              Grade {customer.creditGrade || "A"}
            </Badge>
          </div>
          <CardDescription className={mutedColor}>
            {getCreditGradeDescription(customer.creditGrade || "A")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order Eligibility Alert */}
          {!canPlaceOrders && (
            <div
              className={`p-3 rounded-lg border flex gap-2 ${
                isDarkMode ? "bg-red-900 border-red-700 text-red-100" : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Order Blocked</p>
                <p>
                  This customer cannot place new orders due to grade {customer.creditGrade}. Payment action required.
                </p>
              </div>
            </div>
          )}

          {/* Credit Limit Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`${textColor} font-semibold text-sm`}>Credit Utilization</h3>
              <span className={`${textColor} text-sm font-bold`}>{creditUtilization.toFixed(1)}%</span>
            </div>

            {/* Progress Bar */}
            <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
              <div
                className={`h-full transition-all ${getUtilizationColor(creditUtilization)}`}
                style={{ width: `${Math.min(creditUtilization, 100)}%` }}
              />
            </div>

            {/* Credit Details Grid */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <p className={`${mutedColor} text-xs font-medium mb-1`}>Limit</p>
                <p className={`${textColor} text-lg font-bold`}>
                  AED{" "}
                  {(customer.creditLimit || 0).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <p className={`${mutedColor} text-xs font-medium mb-1`}>Used</p>
                <p className={`${textColor} text-lg font-bold`}>
                  AED{" "}
                  {(customer.creditUsed || 0).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <p className={`${mutedColor} text-xs font-medium mb-1`}>Available</p>
                <p className={`${textColor} text-lg font-bold text-green-600`}>
                  AED{" "}
                  {(customer.creditAvailable || 0).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Metrics */}
          <div className="space-y-3 border-t pt-4" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
            <h3 className={`${textColor} font-semibold text-sm`}>Payment Metrics</h3>

            <div className="space-y-2">
              {/* DSO */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className={`${mutedColor} text-sm`}>DSO (Days)</span>
                </div>
                <span className={`${textColor} font-semibold`}>{customer.dsoDays || 0} days</span>
              </div>

              {/* Last Payment */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className={`${mutedColor} text-sm`}>Last Payment</span>
                </div>
                <span className={`${textColor} font-semibold`}>
                  {customer.lastPaymentDate ? formatDateDMY(customer.lastPaymentDate) : "No payments"}
                </span>
              </div>

              {/* Credit Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span className={`${mutedColor} text-sm`}>Credit Score</span>
                </div>
                <span className={`${textColor} font-semibold`}>{customer.creditScore || 0} / 100</span>
              </div>
            </div>
          </div>

          {/* Aging Analysis */}
          <div className="space-y-3 border-t pt-4" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
            <div className="flex items-center justify-between">
              <h3 className={`${textColor} font-semibold text-sm`}>Aging Breakdown</h3>
              <Button size="sm" variant="ghost" onClick={onViewAging}>
                View Details
              </Button>
            </div>

            <div className="space-y-2">
              {/* Current */}
              <div className="flex items-center justify-between">
                <span className={`${mutedColor} text-sm`}>Current (0 days)</span>
                <span className={`${textColor} font-semibold`}>
                  AED{" "}
                  {(customer.agingCurrent || 0).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* 1-30 Days */}
              <div className="flex items-center justify-between">
                <span className={`${mutedColor} text-sm`}>1-30 days overdue</span>
                <span className={`${textColor} font-semibold`}>
                  AED{" "}
                  {(customer.aging1_30 || 0).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* 31-60 Days */}
              <div className="flex items-center justify-between">
                <span className={`${mutedColor} text-sm`}>31-60 days overdue</span>
                <span className={`${textColor} font-semibold`}>
                  AED{" "}
                  {(customer.aging31_60 || 0).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* 61-90 Days */}
              <div className="flex items-center justify-between">
                <span className={`${mutedColor} text-sm`}>61-90 days overdue</span>
                <span className={`${textColor} font-semibold`}>
                  AED{" "}
                  {(customer.aging61_90 || 0).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* 90+ Days */}
              <div className="flex items-center justify-between">
                <span className={`${mutedColor} text-sm`}>90+ days overdue</span>
                <span className={`${textColor} font-semibold text-red-600`}>
                  AED{" "}
                  {(customer.aging90_plus || 0).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!readOnly && (
            <div className="border-t pt-4 flex gap-2" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Adjust Credit Limit
              </Button>
              <Button size="sm" variant="ghost" onClick={onViewPaymentHistory}>
                View Payment History
              </Button>
            </div>
          )}

          {/* Info Box */}
          <div
            className={`p-3 rounded-lg border text-sm ${
              isDarkMode ? "bg-blue-900 border-blue-700 text-blue-100" : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            <p className="font-semibold mb-2">Credit Grade Criteria</p>
            <ul className="text-xs space-y-1">
              <li>
                <strong>A (DSO &lt; 20):</strong> No restrictions, ideal customer
              </li>
              <li>
                <strong>B (DSO 20-40):</strong> Minor payment delays allowed
              </li>
              <li>
                <strong>C (DSO 40-60):</strong> Monitor closely, require deposits
              </li>
              <li>
                <strong>D (DSO 60-90):</strong> Orders blocked until payment
              </li>
              <li>
                <strong>E (DSO 90+):</strong> Severe risk, no credit orders
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Credit Limit Adjustment Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className={isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}>
          <DialogHeader>
            <DialogTitle className={textColor}>Adjust Credit Limit</DialogTitle>
            <DialogDescription className={mutedColor}>
              Review and adjust the customer&apos;s credit limit. Changes are logged for audit purposes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="current-credit-limit" className={`${textColor} block text-sm font-medium mb-2`}>
                Current Credit Limit (AED)
              </label>
              <input
                id="current-credit-limit"
                type="text"
                value={(customer.creditLimit || 0).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
                disabled
                className={`w-full px-3 py-2 rounded border ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-100 border-gray-300 text-gray-600"
                }`}
              />
            </div>

            <div>
              <label htmlFor="new-credit-limit" className={`${textColor} block text-sm font-medium mb-2`}>
                New Credit Limit (AED)
              </label>
              <input
                id="new-credit-limit"
                type="number"
                value={newCreditLimit}
                onChange={(e) => setNewCreditLimit(e.target.value)}
                step="100"
                min="0"
                className={`w-full px-3 py-2 rounded border ${
                  isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <p className={`${mutedColor} text-xs mt-1`}>Current usage: AED {(customer.creditUsed || 0).toFixed(2)}</p>
            </div>

            <div>
              <label htmlFor="review-reason" className={`${textColor} block text-sm font-medium mb-2`}>
                Reason for Review
              </label>
              <textarea
                id="review-reason"
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="Payment history improvement, business growth, risk assessment, etc."
                className={`w-full px-3 py-2 rounded border text-sm ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 placeholder-gray-400"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                rows="3"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setNewCreditLimit(customer.creditLimit || 0);
                  setReviewReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleUpdateCreditLimit}
                disabled={!reviewReason.trim()}
              >
                Update Credit Limit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomerCreditPanel;
