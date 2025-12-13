/**
 * AccountStatementPreview Component
 * View-only preview modal for Account Statements.
 * Part of the unified Preview/Download system.
 *
 * Rules:
 * - Preview allowed anytime (even for incomplete records)
 * - NO action buttons inside preview modal (only X close button)
 * - Shows validation warnings at bottom if incomplete
 */
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { X, AlertTriangle, FileText } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency, formatDate } from '../../utils/invoiceUtils';
import { validateAccountStatementForDownload } from '../../utils/recordUtils';
import { getDocumentTemplateColor } from '../../constants/defaultTemplateSettings';

const AccountStatementPreview = ({ statement, company, onClose }) => {
  const { isDarkMode } = useTheme();

  // Get the template color for statements
  const templateColor = useMemo(() => {
    return getDocumentTemplateColor('statement', company);
  }, [company]);

  // Validate statement and get warnings
  const validation = useMemo(() => {
    return validateAccountStatementForDownload(statement);
  }, [statement]);

  // Calculate summary data
  const openingBalance = statement.openingBalance || 0;
  const totalInvoices = statement.totalInvoices || 0;
  const totalPayments = statement.totalPayments || 0;
  const closingBalance = statement.closingBalance || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}
      >
        {/* Header - Only X button (view-only) */}
        <div
          className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <h2
            className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
          >
            Account Statement Preview
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Close preview"
          >
            <X size={24} />
          </button>
        </div>

        {/* Account Statement Preview Content - Scrollable */}
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{ background: isDarkMode ? '#1a1a2e' : '#f5f5f5' }}
        >
          {/* Document Container */}
          <div
            className={`max-w-3xl mx-auto ${isDarkMode ? 'bg-gray-900' : 'bg-white'} shadow-lg rounded-lg overflow-hidden`}
          >
            {/* Document Header */}
            <div
              className="text-white p-6"
              style={{ backgroundColor: templateColor }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <FileText size={32} />
                  <div>
                    <h1 className="text-2xl font-bold">STATEMENT OF ACCOUNT</h1>
                    <p className="text-white/80 mt-1">
                      {statement.statementNumber ||
                        statement.statement_number ||
                        'SOA-DRAFT'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {company?.name || 'Company Name'}
                  </p>
                  <p className="text-sm text-white/80">
                    {company?.address?.street || ''}
                  </p>
                  <p className="text-sm text-white/80">
                    {company?.phone || ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Body */}
            <div
              className={`p-6 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
            >
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3
                    className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}
                  >
                    Account Holder
                  </h3>
                  <p className="font-medium">
                    {statement.customerName ||
                      statement.customer_name ||
                      'Customer Name'}
                  </p>
                  {(statement.customerCompany ||
                    statement.customer_company) && (
                    <p className="text-sm">
                      {statement.customerCompany || statement.customer_company}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <span
                      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Statement Period:{' '}
                    </span>
                    <span className="font-medium">
                      {formatDate(statement.fromDate || statement.from_date)} -{' '}
                      {formatDate(statement.toDate || statement.to_date)}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span
                      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Generated:{' '}
                    </span>
                    <span className="font-medium">
                      {formatDate(
                        statement.createdAt ||
                          statement.created_at ||
                          new Date(),
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div
                className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
              >
                <h3
                  className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}
                >
                  Account Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p
                      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Opening Balance
                    </p>
                    <p
                      className={`text-lg font-semibold ${openingBalance >= 0 ? 'text-gray-600' : 'text-green-600'}`}
                    >
                      {formatCurrency(Math.abs(openingBalance))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Total Invoiced
                    </p>
                    <p className="text-lg font-semibold text-orange-600">
                      {formatCurrency(totalInvoices)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Total Paid
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(totalPayments)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Closing Balance
                    </p>
                    <p
                      className={`text-lg font-bold ${closingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {formatCurrency(Math.abs(closingBalance))}
                      <span className="text-xs ml-1">
                        {closingBalance > 0
                          ? '(Due)'
                          : closingBalance < 0
                            ? '(Credit)'
                            : ''}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Transactions Preview */}
              {statement.transactions && statement.transactions.length > 0 ? (
                <div className="mb-6">
                  <h3
                    className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}
                  >
                    Transactions ({statement.transactions.length})
                  </h3>
                  <div
                    className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <table className="w-full text-sm">
                      <thead
                        className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}
                      >
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left font-medium">
                            Reference
                          </th>
                          <th className="px-4 py-2 text-left font-medium">
                            Type
                          </th>
                          <th className="px-4 py-2 text-right font-medium">
                            Debit
                          </th>
                          <th className="px-4 py-2 text-right font-medium">
                            Credit
                          </th>
                          <th className="px-4 py-2 text-right font-medium">
                            Balance
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {statement.transactions
                          .slice(0, 10)
                          .map((txn, index) => (
                            <tr
                              key={index}
                              className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                            >
                              <td className="px-4 py-3">
                                {formatDate(txn.date)}
                              </td>
                              <td className="px-4 py-3">
                                {txn.reference || '-'}
                              </td>
                              <td className="px-4 py-3">{txn.type || '-'}</td>
                              <td className="px-4 py-3 text-right text-red-600">
                                {txn.debit ? formatCurrency(txn.debit) : '-'}
                              </td>
                              <td className="px-4 py-3 text-right text-green-600">
                                {txn.credit ? formatCurrency(txn.credit) : '-'}
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatCurrency(txn.balance || 0)}
                              </td>
                            </tr>
                          ))}
                        {statement.transactions.length > 10 && (
                          <tr
                            className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                          >
                            <td
                              colSpan="6"
                              className="px-4 py-3 text-center text-gray-500"
                            >
                              ... and {statement.transactions.length - 10} more
                              transactions
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div
                  className={`mb-6 p-8 text-center rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                >
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    No transaction details available in this preview.
                  </p>
                  <p
                    className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                  >
                    Download the PDF for full transaction history.
                  </p>
                </div>
              )}

              {/* Footer Note */}
              <div
                className={`text-center text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
              >
                <p>
                  This is a preview. Download the PDF for the complete statement
                  with all transactions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Warnings Footer */}
        {!validation.isValid && validation.warnings.length > 0 && (
          <div
            className={`p-4 border-t ${isDarkMode ? 'border-gray-700 bg-yellow-900/20' : 'border-gray-200 bg-yellow-50'}`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                className="text-yellow-500 flex-shrink-0 mt-0.5"
                size={18}
              />
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}
                >
                  Incomplete record - Cannot download until resolved:
                </p>
                <ul
                  className={`text-sm mt-1 list-disc list-inside ${isDarkMode ? 'text-yellow-200' : 'text-yellow-700'}`}
                >
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

AccountStatementPreview.propTypes = {
  statement: PropTypes.object.isRequired,
  company: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

AccountStatementPreview.defaultProps = {
  company: {},
};

export default AccountStatementPreview;
