/**
 * InvoiceCreditNotesSection - Shows related credit notes for an invoice
 * 
 * Displays in InvoiceForm when editing an existing invoice.
 * Shows:
 * - List of credit notes for this invoice
 * - Total credit amount
 * - Quick action to create new credit note
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReceiptText,
  Plus,
  ExternalLink,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { creditNoteService } from '../../services/creditNoteService';
import { formatCurrency, formatDate } from '../../utils/invoiceUtils';

const STATUS_COLORS = {
  draft: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: 'Draft' },
  issued: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Issued' },
  items_received: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Items Received' },
  items_inspected: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Inspected' },
  applied: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Applied' },
  refunded: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', label: 'Refunded' },
  completed: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', label: 'Completed' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Cancelled' },
};

const InvoiceCreditNotesSection = ({ invoiceId, invoiceStatus, isDarkMode }) => {
  const navigate = useNavigate();
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Only show for issued invoices
  const canCreateCreditNote = invoiceStatus === 'issued' || invoiceStatus === 'STATUS_ISSUED';

  useEffect(() => {
    if (invoiceId) {
      loadCreditNotes();
    }
  }, [invoiceId]);

  const loadCreditNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await creditNoteService.getCreditNotesByInvoice(invoiceId);
      setCreditNotes(response.data || response || []);
    } catch (err) {
      console.error('Error loading credit notes:', err);
      setError('Failed to load credit notes');
      setCreditNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS.draft;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const totalCredit = creditNotes.reduce((sum, cn) => sum + (cn.totalCredit || 0), 0);

  // Don't show section if no credit notes and can't create one
  if (!loading && creditNotes.length === 0 && !canCreateCreditNote) {
    return null;
  }

  return (
    <div className={`rounded-lg border ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } shadow-sm`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      } flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <ReceiptText className={`h-5 w-5 ${
            isDarkMode ? 'text-purple-400' : 'text-purple-600'
          }`} />
          <h3 className={`font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Credit Notes
          </h3>
          {creditNotes.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
            }`}>
              {creditNotes.length}
            </span>
          )}
        </div>
        {canCreateCreditNote && (
          <button
            onClick={() => navigate(`/credit-notes/new?invoiceId=${invoiceId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className={`h-6 w-6 animate-spin ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </div>
        ) : error ? (
          <div className={`flex items-center gap-2 py-4 ${
            isDarkMode ? 'text-red-400' : 'text-red-600'
          }`}>
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        ) : creditNotes.length === 0 ? (
          <div className={`text-center py-6 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <ReceiptText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No credit notes for this invoice</p>
            {canCreateCreditNote && (
              <p className="text-xs mt-1">Click "New" to create one</p>
            )}
          </div>
        ) : (
          <>
            {/* Credit Notes List */}
            <div className="space-y-2">
              {creditNotes.map((cn) => (
                <div
                  key={cn.id}
                  onClick={() => navigate(`/credit-notes/${cn.id}`)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700/50 hover:bg-gray-700' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className={`font-medium text-sm ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {cn.creditNoteNumber}
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {formatDate(cn.creditNoteDate)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-medium text-sm ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      -{formatCurrency(cn.totalCredit)}
                    </span>
                    {getStatusBadge(cn.status)}
                    <ExternalLink className={`h-4 w-4 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            {creditNotes.length > 0 && (
              <div className={`mt-4 pt-3 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              } flex justify-between items-center`}>
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Total Credit Applied
                </span>
                <span className={`font-semibold ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  -{formatCurrency(totalCredit)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InvoiceCreditNotesSection;
