import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Download, FileSpreadsheet, ArrowLeft, Filter } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { payablesService } from '../services/payablesService';
import { formatCurrency } from '../utils/invoiceUtils';
import { useApiData } from '../hooks/useApi';
import { companyService } from '../services';
import { generateStatementPDF } from '../utils/statementPdfGenerator';

const formatDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
};

const startOfNDaysAgo = (n) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - n);
  return dt.toISOString().slice(0,10);
};

const todayStr = () => new Date().toISOString().slice(0,10);

const CustomerPerspective = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [sp, setSp] = useSearchParams();
  const customerNameParam = sp.get('name') || '';
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  // Default to no date filter so initial view shows ALL data
  const [start, setStart] = useState(sp.get('start') || '');
  const [end, setEnd] = useState(sp.get('end') || '');
  const containerRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    const params = {
      // Send both forms to maximize backend compatibility
      customer: customerNameParam || undefined,
      customer_id: customerId || undefined,
      start_date: start || undefined,
      end_date: end || undefined,
      date_type: 'invoice',
      limit: 1000,
    };
    const resp = await payablesService.getInvoices(params);
    let list = resp.items || [];
    // Client-side filter as a safety net, in case backend ignores params
    if (customerId) {
      const byId = list.filter((r) => {
        const id = String(r.customer?.id ?? r.customer_id ?? '').trim();
        return id && id === String(customerId).trim();
      });
      if (byId.length > 0) {
        list = byId;
      } else if (customerNameParam) {
        const target = customerNameParam.trim().toLowerCase();
        const byName = list.filter((r) => {
          const nm = (r.customer?.name || '').trim().toLowerCase();
          return nm === target || nm.includes(target);
        });
        list = byName;
      }
    } else if (customerNameParam) {
      const target = customerNameParam.trim().toLowerCase();
      list = list.filter((r) => {
        const nm = (r.customer?.name || '').trim().toLowerCase();
        return nm === target || nm.includes(target);
      });
    }
    setItems(list);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [customerId, start, end]);

  const totals = useMemo(() => {
    const totalInvoiced = items.reduce((s, r) => s + Number(r.invoice_amount || 0), 0);
    const totalReceived = items.reduce((s, r) => s + Number(r.received || 0), 0);
    const totalOutstanding = items.reduce((s, r) => s + Number(r.outstanding || 0), 0);
    return { totalInvoiced, totalReceived, totalOutstanding };
  }, [items]);

  const customerName = useMemo(() => {
    // Prefer explicit query param, then data
    return customerNameParam || items[0]?.customer?.name || '';
  }, [items, customerNameParam]);

  const applyQuick = (days) => {
    const s = startOfNDaysAgo(days);
    const e = todayStr();
    setStart(s); setEnd(e);
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      next.set('start', s); next.set('end', e);
      return next;
    });
  };

  const clearDates = () => {
    setStart(''); setEnd('');
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('start'); next.delete('end');
      return next;
    });
    // Fetch all data again
    fetchData();
  };

  const applyFilters = () => {
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      if (start) next.set('start', start); else next.delete('start');
      if (end) next.set('end', end); else next.delete('end');
      return next;
    });
    fetchData();
  };

  const downloadExcel = async () => {
    // Try backend export to XLSX, fallback to CSV
    try {
      const blob = await payablesService.exportDownload('invoices', {
        customer: customerId || customerName,
        start_date: start,
        end_date: end,
        date_type: 'invoice',
      }, 'xlsx');
      const fname = `Statement-${customerName || customerId}-${start}_to_${end}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = fname; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      return;
    } catch (e) {
      // Fallback to CSV
      const headers = ['Invoice #','Invoice Date','Due Date','Currency','Invoice Amount','Received','Outstanding','Status'];
      const rows = items.map(r => [r.invoice_no || r.invoiceNumber, r.invoice_date || r.date, r.due_date || r.dueDate, r.currency || 'AED', (r.invoice_amount||0), (r.received||0), (r.outstanding||0), r.status]);
      const csv = [headers, ...rows].map(r => r.map(v => (v!==undefined&&v!==null?`${v}`.replace(/"/g,'""'):'')).map(v=>`"${v}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Statement-${customerName || customerId}-${start}_to_${end}.csv`; a.click(); URL.revokeObjectURL(url);
    }
  };

  const { data: company } = useApiData(companyService.getCompany, [], true);

  const downloadPDF = async () => {
    await generateStatementPDF({
      customerName: customerName || customerId,
      periodStart: start,
      periodEnd: end,
      items,
      company: company || {},
    });
  };

  return (
    <div className={`p-0 sm:p-4 min-h-[calc(100vh-64px)] ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={()=>navigate('/payables')} className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Statement Of Account</div>
              <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{customerName || 'Customer'} • {formatDate(start)} - {formatDate(end)}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadExcel} className="px-3 py-2 rounded border flex items-center gap-2"><FileSpreadsheet size={16}/>Export Excel</button>
            <button onClick={downloadPDF} className="px-3 py-2 rounded bg-teal-600 text-white flex items-center gap-2"><Download size={16}/>Download PDF</button>
          </div>
        </div>

        {/* Filters */}
        <div className={`p-3 rounded-lg border mb-4 ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2"><Filter size={16}/><span className="text-sm opacity-70">Filter by Date</span></div>
            <input type="date" value={start} onChange={(e)=>setStart(e.target.value)} className="px-2 py-2 rounded border"/>
            <span className="opacity-70">to</span>
            <input type="date" value={end} onChange={(e)=>setEnd(e.target.value)} className="px-2 py-2 rounded border"/>
            <button onClick={()=>applyQuick(10)} className="px-3 py-2 rounded border">Last 10 days</button>
            <button onClick={clearDates} className="px-3 py-2 rounded border">Clear</button>
            <button onClick={applyFilters} className="px-3 py-2 rounded bg-teal-600 text-white">Apply</button>
          </div>
        </div>

        {/* Content to export */}
        <div ref={containerRef} id="customer-statement" className="space-y-4">
          {/* PDF Header */}
          <div>
            <div className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Statement Of Account</div>
            <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{customerName || 'Customer'} • {formatDate(start)} - {formatDate(end)}</div>
          </div>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-xs opacity-70">Total Invoiced</div>
              <div className="text-lg font-semibold">{formatCurrency(totals.totalInvoiced)}</div>
            </div>
            <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-xs opacity-70">Total Received</div>
              <div className="text-lg font-semibold">{formatCurrency(totals.totalReceived)}</div>
            </div>
            <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-xs opacity-70">Total Outstanding</div>
              <div className="text-lg font-semibold">{formatCurrency(totals.totalOutstanding)}</div>
            </div>
          </div>

          {/* Table */}
          <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
            <div className="overflow-auto">
              <table className="min-w-full divide-y">
                <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <th className="px-4 py-3 text-left text-xs uppercase">Invoice #</th>
                    <th className="px-4 py-3 text-left text-xs uppercase">Invoice Date</th>
                    <th className="px-4 py-3 text-left text-xs uppercase">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs uppercase">Currency</th>
                    <th className="px-4 py-3 text-right text-xs uppercase">Invoice Amount</th>
                    <th className="px-4 py-3 text-right text-xs uppercase">Received</th>
                    <th className="px-4 py-3 text-right text-xs uppercase">Outstanding</th>
                    <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {loading ? (
                    <tr><td colSpan={8} className="px-4 py-6 text-center">Loading...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-6 text-center">No records</td></tr>
                  ) : items.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-2">{row.invoice_no || row.invoiceNumber}</td>
                      <td className="px-4 py-2">{formatDate(row.invoice_date || row.date)}</td>
                      <td className="px-4 py-2">{formatDate(row.due_date || row.dueDate)}</td>
                      <td className="px-4 py-2">{row.currency || 'AED'}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(row.invoice_amount || 0)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(row.received || 0)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(row.outstanding || 0)}</td>
                      <td className="px-4 py-2">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPerspective;
