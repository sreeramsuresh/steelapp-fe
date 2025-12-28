import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { accountStatementService } from '../services/accountStatementService';
import { apiClient } from '../services/api';
import { FormSelect } from '../components/ui/form-select';
import { SelectItem } from '../components/ui/select';

const AccountStatementForm = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    start_date: '',
    end_date: '',
    format: 'SUMMARY',
    currency: 'AED',
    include_zero_balance: false,
    grouping: 'BY_INVOICE',
    delivery_method: 'EMAIL',
    notes: '',
  });
  const [error, setError] = useState('');

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await apiClient.get('/customers', { limit: 100 });
        setCustomers(response.customers || response || []);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customers');
      }
    };
    fetchCustomers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.customer_id || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError('Start date must be before end date');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await accountStatementService.create(formData);
      navigate(`/account-statements/${response.id}`);
    } catch (err) {
      setError('Failed to create account statement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div
      className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
    >
      <div
        className={`p-6 mx-0 sm:mx-auto max-w-2xl rounded-none sm:rounded-2xl border ${
          isDarkMode
            ? 'bg-[#1E2328] border-[#37474F]'
            : 'bg-white border-[#E0E0E0]'
        }`}
      >
        <div className="mb-6">
          <h1
            className={`text-2xl font-semibold mb-2 flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            <FileText size={32} className="text-teal-600" />
            Create Account Statement
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Generate a new account statement for a customer
          </p>
        </div>

        {error && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-red-900/20 border-red-700 text-red-300'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div>
            <FormSelect
              label="Customer"
              value={formData.customer_id || 'none'}
              onValueChange={(value) =>
                handleChange({
                  target: {
                    name: 'customer_id',
                    value: value === 'none' ? '' : value,
                  },
                })
              }
              required={true}
              showValidation={false}
              placeholder="Select a customer"
            >
              <SelectItem value="none">Select a customer</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={String(customer.id)}>
                  {customer.name}{' '}
                  {customer.company ? `- ${customer.company}` : ''}
                </SelectItem>
              ))}
            </FormSelect>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Calendar
                    size={20}
                    className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Calendar
                    size={20}
                    className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Statement Format */}
          <div>
            <FormSelect
              label="Statement Format"
              value={formData.format}
              onValueChange={(value) =>
                handleChange({
                  target: { name: 'format', value },
                })
              }
              required={true}
              showValidation={false}
              placeholder="Select format"
            >
              <SelectItem value="SUMMARY">Summary (Totals Only)</SelectItem>
              <SelectItem value="DETAILED">
                Detailed (All Transactions)
              </SelectItem>
              <SelectItem value="AGED">Aged (Aging Buckets)</SelectItem>
            </FormSelect>
          </div>

          {/* Currency and Grouping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <FormSelect
                label="Currency"
                value={formData.currency}
                onValueChange={(value) =>
                  handleChange({
                    target: { name: 'currency', value },
                  })
                }
                required={true}
                showValidation={false}
                placeholder="Select currency"
              >
                <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
              </FormSelect>
            </div>

            <div>
              <FormSelect
                label="Grouping"
                value={formData.grouping}
                onValueChange={(value) =>
                  handleChange({
                    target: { name: 'grouping', value },
                  })
                }
                required={true}
                showValidation={false}
                placeholder="Select grouping"
              >
                <SelectItem value="BY_INVOICE">By Invoice</SelectItem>
                <SelectItem value="BY_DATE">By Date</SelectItem>
                <SelectItem value="BY_PRODUCT">By Product</SelectItem>
              </FormSelect>
            </div>
          </div>

          {/* Delivery Method */}
          <div>
            <FormSelect
              label="Delivery Method"
              value={formData.delivery_method}
              onValueChange={(value) =>
                handleChange({
                  target: { name: 'delivery_method', value },
                })
              }
              required={true}
              showValidation={false}
              placeholder="Select delivery method"
            >
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="PRINT">Print</SelectItem>
              <SelectItem value="PORTAL">Customer Portal</SelectItem>
            </FormSelect>
          </div>

          {/* Include Zero Balance */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="include_zero_balance"
              name="include_zero_balance"
              checked={formData.include_zero_balance}
              onChange={(e) =>
                handleChange({
                  target: {
                    name: 'include_zero_balance',
                    value: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500"
            />
            <label
              htmlFor="include_zero_balance"
              className={`text-sm font-medium cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Include invoices with zero balance
            </label>
          </div>

          {/* Notes */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Add any additional notes for this statement..."
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/account-statements')}
              className={`px-6 py-3 border rounded-lg transition-colors duration-200 ${
                isDarkMode
                  ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
                  : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating...' : 'Create Statement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountStatementForm;
