import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileText,
  Banknote,
  Receipt,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { accountStatementService } from '../services/accountStatementService';
import { formatCurrency, formatDate } from '../utils/invoiceUtils';

const AccountStatementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatement = async () => {
      try {
        setLoading(true);
        const response = await accountStatementService.getById(id);
        setStatement(response);
      } catch (err) {
        console.error('Error fetching statement:', err);
        setError('Failed to load account statement');
      } finally {
        setLoading(false);
      }
    };

    fetchStatement();
  }, [id]);

  const handleDownloadPDF = async () => {
    try {
      await accountStatementService.downloadPDF(id);
    } catch {
      setError('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div
        className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span
            className={`ml-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            Loading account statement...
          </span>
        </div>
      </div>
    );
  }

  if (error || !statement) {
    return (
      <div
        className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
      >
        <div
          className={`text-center p-12 rounded-2xl border ${
            isDarkMode
              ? 'bg-[#1E2328] border-[#37474F]'
              : 'bg-white border-[#E0E0E0]'
          }`}
        >
          <p
            className={`text-lg ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
          >
            {error || 'Statement not found'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate running balance for transactions
  const transactions = [];
  let runningBalance = parseFloat(statement.openingBalance) || 0;

  // Add invoices
  if (statement.invoices) {
    statement.invoices.forEach((invoice) => {
      runningBalance += invoice.totalAmount || 0;
      transactions.push({
        date: invoice.invoiceDate,
        type: 'Invoice',
        reference: invoice.invoiceNumber,
        description: `Invoice ${invoice.invoiceNumber}`,
        debit: invoice.totalAmount || 0,
        credit: 0,
        balance: runningBalance,
      });
    });
  }

  // Add payments
  if (statement.payments) {
    statement.payments.forEach((payment) => {
      runningBalance -= payment.amount || 0;
      transactions.push({
        date: payment.paymentDate,
        type: 'Payment',
        reference: payment.referenceNumber || '-',
        description: `Payment for ${payment.invoiceNumber}`,
        debit: 0,
        credit: payment.amount || 0,
        balance: runningBalance,
      });
    });
  }

  // Sort transactions by date
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div
      className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
    >
      <div
        className={`p-0 sm:p-6 mx-0 rounded-none sm:rounded-2xl border overflow-hidden ${
          isDarkMode
            ? 'bg-[#1E2328] border-[#37474F]'
            : 'bg-white border-[#E0E0E0]'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6 px-4 sm:px-0 pt-4 sm:pt-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/account-statements')}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1
                className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Account Statement
              </h1>
              <p
                className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {statement.statementNumber}
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Download size={18} />
            Download PDF
          </button>
        </div>

        {/* Customer and Period Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div
            className={`p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <h3
              className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Customer Details
            </h3>
            <div
              className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {statement.customerName}
            </div>
            {statement.customerCompany && (
              <div
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {statement.customerCompany}
              </div>
            )}
            {statement.customerEmail && (
              <div
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {statement.customerEmail}
              </div>
            )}
            {statement.customerPhone && (
              <div
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {statement.customerPhone}
              </div>
            )}
          </div>

          <div
            className={`p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <h3
              className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Statement Period
            </h3>
            <div
              className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {formatDate(statement.startDate)} -{' '}
              {formatDate(statement.endDate)}
            </div>
            <div
              className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Generated on: {formatDate(statement.createdAt)}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Banknote className="text-blue-500" size={24} />
              <div>
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Opening Balance
                </p>
                <p
                  className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {formatCurrency(statement.openingBalance)}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="text-orange-500" size={24} />
              <div>
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Total Invoiced
                </p>
                <p
                  className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {formatCurrency(statement.totalInvoiced)}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Receipt className="text-green-500" size={24} />
              <div>
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Total Paid
                </p>
                <p
                  className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {formatCurrency(statement.totalPaid)}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {statement.closingBalance > 0 ? (
                <TrendingUp className="text-red-500" size={24} />
              ) : (
                <TrendingDown className="text-green-500" size={24} />
              )}
              <div>
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Closing Balance
                </p>
                <p
                  className={`text-lg font-semibold ${
                    statement.closingBalance > 0
                      ? 'text-red-500'
                      : 'text-green-500'
                  }`}
                >
                  {formatCurrency(statement.closingBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="mb-6">
          <h2
            className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Transaction Details
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
                <tr>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Date
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Type
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Reference
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Description
                  </th>
                  <th
                    className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Debit
                  </th>
                  <th
                    className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Credit
                  </th>
                  <th
                    className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}
              >
                <tr className={isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3" colSpan={4}>
                    <span
                      className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Opening Balance
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">-</td>
                  <td className="px-4 py-3 text-right">-</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {formatCurrency(statement.openingBalance)}
                  </td>
                </tr>
                {transactions.map((trans, index) => (
                  <tr
                    key={index}
                    className={`hover:${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'} transition-colors`}
                  >
                    <td
                      className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                      {formatDate(trans.date)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                      {trans.type}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {trans.reference}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                      {trans.description}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {trans.debit > 0 ? formatCurrency(trans.debit) : '-'}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {trans.credit > 0 ? formatCurrency(trans.credit) : '-'}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-medium ${
                        trans.balance > 0 ? 'text-red-500' : 'text-green-500'
                      }`}
                    >
                      {formatCurrency(trans.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {statement.notes && (
          <div
            className={`p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <h3
              className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Notes
            </h3>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {statement.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountStatementDetails;
