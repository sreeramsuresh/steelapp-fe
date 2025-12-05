/**
 * DraftConflictModal - Modal for handling credit note draft conflicts
 * 
 * Shows when user tries to create a credit note but has existing draft(s):
 * - Same invoice: Offer to resume the draft
 * - Different invoice: Offer to resume, discard, or start fresh
 */

import {
  AlertTriangle,
  FileText,
  Clock,
  Trash2,
  PlayCircle,
  X,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { getDraftStatusMessage, formatRelativeTime } from '../hooks/useCreditNoteDrafts';

const DraftConflictModal = ({
  isOpen,
  onClose,
  conflict,
  onResume,
  onDiscard,
  onStartFresh,
  isLoading = false,
  isDarkMode = false,
}) => {
  if (!isOpen || !conflict) return null;

  const { type, existingDraft, allDrafts } = conflict;
  const isSameInvoice = type === 'same_invoice';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full max-w-lg transform overflow-hidden rounded-xl shadow-2xl transition-all ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  isDarkMode ? 'bg-amber-900/30' : 'bg-amber-100'
                }`}>
                  <AlertTriangle className={`h-5 w-5 ${
                    isDarkMode ? 'text-amber-400' : 'text-amber-600'
                  }`} />
                </div>
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {isSameInvoice ? 'Resume Draft?' : 'Existing Draft Found'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {isSameInvoice 
                ? 'You have an unsaved draft for this invoice. Would you like to continue where you left off?'
                : 'You have an unsaved draft for a different invoice. What would you like to do?'
              }
            </p>

            {/* Draft Card */}
            {existingDraft && (
              <div className={`p-4 rounded-lg border mb-4 ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    isDarkMode ? 'bg-teal-900/30' : 'bg-teal-100'
                  }`}>
                    <FileText className={`h-5 w-5 ${
                      isDarkMode ? 'text-teal-400' : 'text-teal-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {existingDraft.invoiceNumber || 'Draft Credit Note'}
                      </h4>
                      <span className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {existingDraft.data?.totalCredit > 0 && formatCurrency(existingDraft.data.totalCredit)}
                      </span>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {existingDraft.customerName}
                    </p>
                    <div className={`flex items-center gap-1.5 mt-2 text-xs ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      <Clock className="h-3.5 w-3.5" />
                      <span>{getDraftStatusMessage(existingDraft)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Show other drafts if different invoice conflict */}
            {!isSameInvoice && allDrafts && allDrafts.length > 1 && (
              <div className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className="font-medium">Note:</span> You have {allDrafts.length} draft(s) total.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={`px-6 py-4 border-t ${
            isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {/* Different actions based on conflict type */}
              {isSameInvoice ? (
                <>
                  <button
                    onClick={() => onDiscard(existingDraft.invoiceId)}
                    disabled={isLoading}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:opacity-50`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Discard & Start Fresh
                  </button>
                  <button
                    onClick={() => onResume(existingDraft)}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                    Resume Draft
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onDiscard(existingDraft.invoiceId)}
                    disabled={isLoading}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode
                        ? 'text-red-400 hover:bg-red-900/20'
                        : 'text-red-600 hover:bg-red-50'
                    } disabled:opacity-50`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Discard Draft
                  </button>
                  <button
                    onClick={onStartFresh}
                    disabled={isLoading}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:opacity-50`}
                  >
                    Continue to New
                  </button>
                  <button
                    onClick={() => onResume(existingDraft)}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                    Resume Draft
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftConflictModal;
