import { useState, useContext, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { DarkModeContext } from '../../context/DarkModeContext';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  DollarSign,
  Edit2,
  ThumbsUp,
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';

/**
 * CommissionPanel Component
 * Displays commission details for invoices with Phase 5 accrual-based workflow
 * Features:
 * - Commission amount and percentage display
 * - Status workflow (PENDING → APPROVED → PAID)
 * - Grace period countdown (15 days for corrections)
 * - Commission adjustment modal
 * - Approve and mark as paid actions
 * - Audit trail view
 */
const CommissionPanel = ({
  invoice = {},
  onAdjustCommission = () => {},
  onApproveCommission = () => {},
  onMarkAsPaid = () => {},
  onViewAuditTrail = () => {},
  readOnly = false,
}) => {
  const { isDarkMode } = useContext(DarkModeContext);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustedAmount, setAdjustedAmount] = useState(
    invoice.commissionAmount || 0,
  );
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [daysUntilGraceExpiry, setDaysUntilGraceExpiry] = useState(0);

  // Calculate days remaining in grace period
  useEffect(() => {
    if (invoice.commissionGracePeriodEndDate) {
      const endDate = new Date(invoice.commissionGracePeriodEndDate);
      const today = new Date();
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysUntilGraceExpiry(Math.max(0, diffDays));
    }
  }, [invoice.commissionGracePeriodEndDate]);

  // Get status color based on commission status
  const getStatusColor = (status) => {
    const colorMap = {
      PENDING:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      VOIDED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      PENDING: <Clock className="w-4 h-4" />,
      APPROVED: <ThumbsUp className="w-4 h-4" />,
      PAID: <CheckCircle className="w-4 h-4" />,
      VOIDED: <AlertCircle className="w-4 h-4" />,
    };
    return iconMap[status] || null;
  };

  const handleAdjustCommission = () => {
    if (adjustedAmount < 0) {
      notificationService.warning('Commission amount cannot be negative');
      return;
    }
    onAdjustCommission({
      invoiceId: invoice.id,
      newAmount: parseFloat(adjustedAmount),
      reason: adjustmentReason,
    });
    setIsAdjustModalOpen(false);
    setAdjustedAmount(invoice.commissionAmount || 0);
    setAdjustmentReason('');
  };

  const handleApprove = () => {
    if (window.confirm('Approve this commission for payout?')) {
      onApproveCommission({
        invoiceId: invoice.id,
        commissionAmount: invoice.commissionAmount,
      });
    }
  };

  const handleMarkAsPaid = () => {
    if (window.confirm('Mark this commission as paid?')) {
      onMarkAsPaid({
        invoiceId: invoice.id,
        commissionAmount: invoice.commissionAmount,
      });
    }
  };

  const cardBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-900';
  const mutedColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
  const dividerColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <>
      <Card className={`${cardBg} border ${dividerColor}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <CardTitle className={textColor}>Commission Details</CardTitle>
            </div>
            <Badge
              className={getStatusColor(invoice.commissionStatus || 'PENDING')}
            >
              <span className="flex items-center gap-1">
                {getStatusIcon(invoice.commissionStatus || 'PENDING')}
                {invoice.commissionStatus || 'PENDING'}
              </span>
            </Badge>
          </div>
          <CardDescription className={mutedColor}>
            Accrual-based commission tracking with approval workflow
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Commission Amount Section */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
            >
              <p className={`${mutedColor} text-sm font-medium mb-1`}>
                Commission Amount
              </p>
              <p className={`${textColor} text-2xl font-bold`}>
                AED {(invoice.commissionAmount || 0).toFixed(2)}
              </p>
              <p className={`${mutedColor} text-xs mt-2`}>
                {invoice.commissionPercentage || 10}% of invoice total
              </p>
            </div>

            <div
              className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
            >
              <p className={`${mutedColor} text-sm font-medium mb-1`}>
                Sales Person
              </p>
              <p className={`${textColor} text-lg font-semibold`}>
                {invoice.salesPersonName || 'Not assigned'}
              </p>
              <p className={`${mutedColor} text-xs mt-2`}>
                ID: {invoice.salesPersonId || 'N/A'}
              </p>
            </div>
          </div>

          {/* Grace Period & Key Dates */}
          <div className="space-y-3">
            <h3 className={`${textColor} font-semibold text-sm`}>
              Timeline & Dates
            </h3>
            <div className="space-y-2">
              {/* Grace Period Status */}
              <div className="flex items-start justify-between">
                <div>
                  <p className={`${mutedColor} text-sm`}>Grace Period</p>
                  <p className={`${textColor} text-sm font-medium`}>
                    Adjustments allowed until{' '}
                    {invoice.commissionGracePeriodEndDate
                      ? new Date(
                        invoice.commissionGracePeriodEndDate,
                      ).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                {daysUntilGraceExpiry > 0 && (
                  <Badge
                    className={
                      daysUntilGraceExpiry > 5
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }
                  >
                    {daysUntilGraceExpiry} days
                  </Badge>
                )}
              </div>

              {/* Approval Date */}
              {invoice.commissionApprovedDate && (
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`${mutedColor} text-sm`}>Approved</p>
                    <p className={`${textColor} text-sm font-medium`}>
                      {new Date(
                        invoice.commissionApprovedDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              )}

              {/* Payout Date */}
              {invoice.commissionPayoutDate && (
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`${mutedColor} text-sm`}>Paid</p>
                    <p className={`${textColor} text-sm font-medium`}>
                      {new Date(
                        invoice.commissionPayoutDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              )}
            </div>
          </div>

          {/* Status-based Actions */}
          {!readOnly && (
            <div
              className="border-t pt-4"
              style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}
            >
              <div className="flex flex-wrap gap-2">
                {/* PENDING: Allow adjustments and approval */}
                {invoice.commissionStatus === 'PENDING' && (
                  <>
                    {daysUntilGraceExpiry > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAdjustModalOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Adjust Amount
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleApprove}
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Approve for Payout
                    </Button>
                  </>
                )}

                {/* APPROVED: Allow marking as paid */}
                {invoice.commissionStatus === 'APPROVED' && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleMarkAsPaid}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}

                {/* View Audit Trail (always available) */}
                <Button size="sm" variant="ghost" onClick={onViewAuditTrail}>
                  View History
                </Button>
              </div>
            </div>
          )}

          {/* Information Box */}
          <div
            className={`p-3 rounded-lg border ${isDarkMode ? 'bg-blue-900 border-blue-700 text-blue-100' : 'bg-blue-50 border-blue-200 text-blue-900'}`}
          >
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Commission Workflow</p>
                <ul className="list-disc list-inside mt-1 text-xs space-y-1">
                  <li>Commission accrues when invoice is issued</li>
                  <li>15-day grace period allows adjustments</li>
                  <li>Manager approval required before payout</li>
                  <li>All changes tracked in audit trail</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Modal */}
      <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
        <DialogContent
          className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}
        >
          <DialogHeader>
            <DialogTitle className={textColor}>
              Adjust Commission Amount
            </DialogTitle>
            <DialogDescription className={mutedColor}>
              You can adjust the commission during the grace period. All
              adjustments are logged for audit purposes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className={`${textColor} block text-sm font-medium mb-2`}>
                New Commission Amount (AED)
              </label>
              <input
                type="number"
                value={adjustedAmount}
                onChange={(e) => setAdjustedAmount(e.target.value)}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 rounded border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <p className={`${mutedColor} text-xs mt-1`}>
                Original: AED {(invoice.commissionAmount || 0).toFixed(2)}
              </p>
            </div>

            <div>
              <label className={`${textColor} block text-sm font-medium mb-2`}>
                Reason for Adjustment
              </label>
              <textarea
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Enter reason for adjustment (required)"
                className={`w-full px-3 py-2 rounded border text-sm ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                rows="3"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdjustModalOpen(false);
                  setAdjustedAmount(invoice.commissionAmount || 0);
                  setAdjustmentReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleAdjustCommission}
                disabled={!adjustmentReason.trim()}
              >
                Save Adjustment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CommissionPanel;
