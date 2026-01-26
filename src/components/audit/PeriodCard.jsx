import React from 'react';
import { ChevronRight, Lock, Download, Eye } from 'lucide-react';
import PeriodStatusBadge from './PeriodStatusBadge';
import { format } from 'date-fns';

/**
 * Period Card Component
 * Displays individual period with status and action buttons
 */

export default function PeriodCard({
  period,
  onClose,
  onLock,
  onView,
  isClosing = false,
  isLocking = false
}) {
  const getPeriodLabel = () => {
    if (period.period_type === 'MONTHLY') {
      return new Date(period.period_year, period.period_month - 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } else if (period.period_type === 'QUARTERLY') {
      const q = Math.ceil(period.period_month / 3);
      return `Q${q} ${period.period_year}`;
    } else {
      return `${period.period_year}`;
    }
  };

  const canClose = period.status === 'OPEN';
  const canLock = period.status === 'REVIEW';
  const canView = period.status !== 'OPEN';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-700">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {getPeriodLabel()}
              </h3>
              <PeriodStatusBadge status={period.status} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400">Period Start</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {format(new Date(period.period_start_date), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Period End</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {format(new Date(period.period_end_date), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-400">Type</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {period.period_type}
                </p>
              </div>
              {period.locked_at && (
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Locked By</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {format(new Date(period.locked_at), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>

            {period.period_hash && (
              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Period Hash (SHA-256)</p>
                <p className="font-mono text-xs text-slate-900 dark:text-slate-100 break-all">
                  {period.period_hash}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 min-w-fit">
            {canClose && (
              <button
                onClick={onClose}
                disabled={isClosing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isClosing ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Closing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Close Period
                  </>
                )}
              </button>
            )}

            {canLock && (
              <button
                onClick={onLock}
                disabled={isLocking}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isLocking ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Locking...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Lock Period
                  </>
                )}
              </button>
            )}

            {canView && (
              <button
                onClick={onView}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                View Data
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
