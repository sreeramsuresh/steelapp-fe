import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, Download, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { accountStatementsAPI } from '../services/api';
import { formatDate } from '../utils/invoiceUtils';

const GenerateStatementModal = ({ isOpen, onClose, customer, onGenerated }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
  });
  const [error, setError] = useState('');

  // Initialize dates when modal opens
  useEffect(() => {
    if (isOpen && customer) {
      // Default to last 6 months
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);

      setFormData({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });
      setError('');
    }
  }, [isOpen, customer]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGenerate = async () => {
    // Validation
    if (!formData.start_date || !formData.end_date) {
      setError('Please select both start and end dates');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError('Start date must be before end date');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const statementData = {
        customer_id: customer.id,
        from_date: formData.start_date,
        to_date: formData.end_date,
        notes: `Generated on ${formatDate(new Date())}`,
      };

      // Always generate and save statement (best practice)
      await accountStatementsAPI.generateOnTheFly(statementData);
      onGenerated && onGenerated();

      onClose();
    } catch (err) {
      console.error('Error generating statement:', err);
      setError(err.response?.data?.error || err.response?.data?.details || 'Failed to generate statement');
    } finally {
      setLoading(false);
    }
  };

  const getQuickDateRange = (months) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    setFormData(prev => ({
      ...prev,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className={`relative w-full max-w-lg mx-4 rounded-xl shadow-2xl ${
        isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Generate Statement of Accounts
              </h2>
              <div className={`mt-2 px-3 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-teal-900/30 border-teal-600/50'
                  : 'bg-teal-50 border-teal-300'
              }`}>
                <p className={`text-base font-semibold ${isDarkMode ? 'text-teal-300' : 'text-teal-800'}`}>
                  {customer?.name || 'Select customer'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className={`flex items-start gap-3 p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-red-900/20 border-red-700 text-red-300'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Quick Date Ranges */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Quick Selection
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '1M', months: 1 },
                { label: '3M', months: 3 },
                { label: '6M', months: 6 },
                { label: '1Y', months: 12 },
              ].map(({ label, months }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => getQuickDateRange(months)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <Calendar className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 pointer-events-none ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <Calendar className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 pointer-events-none ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
            </div>
          </div>

          {/* Info message */}
          <div className={`flex items-start gap-3 p-4 rounded-lg border ${
            isDarkMode ? 'border-teal-700 bg-teal-900/20' : 'border-teal-200 bg-teal-50'
          }`}>
            <FileText className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
            <div className="flex-1">
              <div className={`text-sm font-medium ${isDarkMode ? 'text-teal-300' : 'text-teal-900'}`}>
                Statement will be saved automatically
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                A record will be kept in the system with naming format: ST-YYYYMM-NNNN
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
          isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
        }`}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-teal-600/50 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700'
            } text-white disabled:opacity-50`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Generate & Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateStatementModal;
