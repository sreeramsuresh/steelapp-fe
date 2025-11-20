import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { invoiceService, customerService } from '../services/dataService';
import { Search, FileText, Users, ArrowRight, AlertCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/invoiceUtils';

const SectionHeader = ({ icon: Icon, title, count, toAll, isDarkMode }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Icon size={18} className="text-teal-600" />
      <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <span className={`text-xs px-2 py-0.5 rounded-full border ${isDarkMode ? 'text-gray-300 border-gray-600' : 'text-gray-600 border-gray-300'}`}>{count}</span>
    </div>
    {toAll && (
      <Link to={toAll} className={`inline-flex items-center gap-1 text-xs ${isDarkMode ? 'text-teal-300 hover:text-teal-200' : 'text-teal-700 hover:text-teal-800'}`}>
        View all
        <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

const SearchResults = () => {
  const { isDarkMode } = useTheme();
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').trim();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoiceResults, setInvoiceResults] = useState([]);
  const [customerResults, setCustomerResults] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const [inv, cust] = await Promise.all([
          q ? invoiceService.searchInvoices(q) : Promise.resolve({ invoices: [] }),
          q ? customerService.searchCustomers(q) : Promise.resolve({ customers: [] }),
        ]);
        if (cancelled) return;
        const invoices = Array.isArray(inv?.invoices) ? inv.invoices : Array.isArray(inv) ? inv : [];
        const customers = Array.isArray(cust?.customers) ? cust.customers : Array.isArray(cust) ? cust : [];
        setInvoiceResults(invoices);
        setCustomerResults(customers);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to search');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [q]);

  return (
    <div className={`p-4 md:p-6 min-h-[calc(100vh-64px)] ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      <div className={`rounded-xl border p-4 md:p-6 ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
        <div className="mb-4 md:mb-6 flex items-center gap-3">
          <Search size={22} className="text-teal-600" />
          <h1 className={`text-xl md:text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Search results</h1>
          {q && (
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              for “{q}”
            </span>
          )}
        </div>

        {error && (
          <div className={`mb-4 p-3 rounded border flex items-center gap-2 ${isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Searching…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Invoices */}
            <div className={`rounded-lg border p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <SectionHeader icon={FileText} title="Invoices" count={invoiceResults.length} toAll={q ? `/invoices?search=${encodeURIComponent(q)}` : undefined} isDarkMode={isDarkMode} />
              {invoiceResults.length === 0 ? (
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>No matches</p>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {invoiceResults.slice(0, 6).map((inv) => (
                    <Link to={`/edit/${inv.id}`} key={inv.id} className={`flex items-center justify-between py-2 px-1 rounded hover:${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} transition-colors`}>
                      <div>
                        <div className={`text-sm font-semibold text-teal-600`}>{inv.invoiceNumber}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatDate(inv.date)} • {inv.customer?.name || '—'}</div>
                      </div>
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(inv.total || 0)}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Customers */}
            <div className={`rounded-lg border p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <SectionHeader icon={Users} title="Customers" count={customerResults.length} toAll={q ? `/customers?search=${encodeURIComponent(q)}` : undefined} isDarkMode={isDarkMode} />
              {customerResults.length === 0 ? (
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>No matches</p>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {customerResults.slice(0, 6).map((c) => {
                    const term = c.name || c.email || String(c.id || '');
                    const href = term ? `/customers?search=${encodeURIComponent(term)}` : '/customers';
                    return (
                      <Link
                        to={href}
                        key={c.id}
                        className={`block py-2 px-1 rounded ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}
                      >
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{c.name || 'Unnamed customer'}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{c.email || '—'} {c.company ? `• ${c.company}` : ''}</div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
