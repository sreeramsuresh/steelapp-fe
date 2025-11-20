import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Banknote, Download, Filter, RefreshCw, X, PlusCircle, Trash2, CheckCircle, AlertTriangle, Printer } from 'lucide-react';
import { payablesService, PAYMENT_MODES } from '../services/dataService';
import { uuid } from '../utils/uuid';
import { formatCurrency } from '../utils/invoiceUtils';
import { authService } from '../services/axiosAuthService';
import { notificationService } from '../services/notificationService';
import { generatePaymentReceipt, printPaymentReceipt } from '../utils/paymentReceiptGenerator';

const TabButton = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-teal-600 text-white' : 'bg-transparent text-teal-600 hover:bg-teal-50'
      }`}
    >
      {children}
    </button>
  );
};

const Pill = ({ color = 'gray', children }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    teal: 'bg-teal-100 text-teal-800 border-teal-300',
  };
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
};

const useURLState = (initial) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => {
    const obj = { ...initial };
    for (const key of Object.keys(initial)) {
      const v = searchParams.get(key);
      if (v !== null) obj[key] = v;
    }
    return obj;
  }, [searchParams]);
  const setState = (patch) => {
    const next = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    const entries = Object.entries(next).filter(([,v]) => v !== '' && v !== undefined && v !== null);
    setSearchParams(Object.fromEntries(entries), { replace: true });
  };
  return [state, setState];
};

const StatusPill = ({ status }) => {
  const map = {
    unpaid: { label: 'Unpaid', color: 'red' },
    partially_paid: { label: 'Partially Paid', color: 'yellow' },
    paid: { label: 'Paid', color: 'green' },
    overdue: { label: 'Overdue', color: 'red' },
  };
  const cfg = map[status] || map.unpaid;
  return <Pill color={cfg.color}>{cfg.label}</Pill>;
};

const formatDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
};

const numberInput = (v) => (v === '' || isNaN(Number(v)) ? '' : v);

const downloadBlob = (blob, filename) => {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Download failed', e);
  }
};

const InvoicesTab = ({ canManage }) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [filters, setFilters] = useURLState({
    tab: 'invoices',
    q: '',
    status: 'all',
    dateType: 'invoice',
    start: '',
    end: '',
    customer: '',
    minOut: '',
    maxOut: '',
    page: '1',
    size: '10',
  });
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [drawer, setDrawer] = useState({ open: false, item: null });
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null);
  const [printingReceiptId, setPrintingReceiptId] = useState(null);
  const page = Number(filters.page || 1);
  const size = Number(filters.size || 10);

  const fetchData = async () => {
    setLoading(true);
    const { items } = await payablesService.getInvoices({
      search: filters.q || undefined,
      status: filters.status === 'all' ? undefined : filters.status,
      start_date: filters.start || undefined,
      end_date: filters.end || undefined,
      date_type: filters.dateType,
      customer: filters.customer || undefined,
      min_outstanding: filters.minOut || undefined,
      max_outstanding: filters.maxOut || undefined,
      page,
      limit: size,
    });
    setItems(items);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filters.q, filters.status, filters.start, filters.end, filters.dateType, filters.customer, filters.minOut, filters.maxOut, filters.page, filters.size]);

  const aggregates = useMemo(() => {
    const totalInvoiced = items.reduce((s, r) => s + (Number(r.invoiceAmount || 0)), 0);
    const totalReceived = items.reduce((s, r) => s + (Number(r.received || 0)), 0);
    const totalOutstanding = items.reduce((s, r) => s + (Number(r.outstanding || 0)), 0);
    const overdueAmount = items.filter(r => r.status === 'overdue').reduce((s, r) => s + (Number(r.outstanding || 0)), 0);
    // Simple avg days past due placeholder
    const today = new Date();
    const pastDueDays = items
      .filter(r => (r.dueDate && new Date(r.dueDate) < today && r.outstanding > 0))
      .map(r => Math.floor((today - new Date(r.dueDate)) / (1000*60*60*24)));
    const avgDaysPastDue = pastDueDays.length ? Math.round(pastDueDays.reduce((a,b)=>a+b,0)/pastDueDays.length) : 0;
    return { totalInvoiced, totalReceived, totalOutstanding, overdueAmount, avgDaysPastDue };
  }, [items]);

  const allSelected = selected.size > 0 && selected.size === items.length;
  const toggleAll = () => {
    setSelected(prev => prev.size === items.length ? new Set() : new Set(items.map(i => i.id)));
  };
  const toggleOne = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const openDrawer = (item) => setDrawer({ open: true, item });
  const closeDrawer = () => setDrawer({ open: false, item: null });

  const handleAddPayment = async ({ amount, method, referenceNo, notes, paymentDate }) => {
    const inv = drawer.item;
    if (!inv) return;
    const outstanding = Number(inv.outstanding || 0);
    if (!(Number(amount) > 0)) return alert('Amount must be > 0');
    if (Number(amount) > outstanding) return alert('Amount exceeds outstanding');
    // Optimistic update
    const newPayment = {
      id: uuid(),
      paymentDate: paymentDate || new Date().toISOString().slice(0,10),
      amount: Number(amount),
      method, referenceNo, notes, createdAt: new Date().toISOString(),
    };
    const updated = { ...inv, payments: [...(inv.payments||[]), newPayment] };
    const derived = { received: (inv.received||0) + newPayment.amount, outstanding: Math.max(0, +(outstanding - newPayment.amount).toFixed(2)), status: inv.status };
    // recompute status
    if (derived.outstanding === 0) derived.status = 'paid'; else if (derived.outstanding < (inv.invoiceAmount||0)) derived.status = 'partially_paid';
    const updatedInv = { ...updated, ...derived };
    setDrawer({ open: true, item: updatedInv });
    setItems(prev => prev.map(i => i.id === inv.id ? updatedInv : i));
    try {
      await payablesService.addInvoicePayment(inv.id, newPayment);
    } catch (e) { 
      // Ignore - optimistic UI already updated, backend error doesn't affect display
      console.warn('Failed to persist payment to backend:', e.message);
    }
  };

  const handleVoidLast = async () => {
    const inv = drawer.item; if (!inv) return;
    const payments = (inv.payments || []).filter(p => !p.voided);
    if (payments.length === 0) return;
    const last = payments[payments.length - 1];
    const updatedPayments = inv.payments.map(p => p.id === last.id ? { ...p, voided: true, voidedAt: new Date().toISOString() } : p);
    const updated = { ...inv, payments: updatedPayments };
    const received = updatedPayments.filter(p=>!p.voided).reduce((s,p)=>s+Number(p.amount||0),0);
    const outstanding = Math.max(0, +((inv.invoiceAmount||0)-received).toFixed(2));
    let status = 'unpaid'; if (outstanding === 0) status='paid'; else if (outstanding < (inv.invoiceAmount||0)) status='partially_paid';
    const updatedInv = { ...updated, received, outstanding, status };
    setDrawer({ open: true, item: updatedInv });
    setItems(prev => prev.map(i => i.id === inv.id ? updatedInv : i));
    try { 
      await payablesService.voidInvoicePayment(inv.id, last.id, 'User void via UI'); 
    } catch(e){ 
      // Ignore - optimistic UI already voided payment, backend error doesn't affect display
      console.warn('Failed to persist void to backend:', e.message);
    }
  };

  const handleMarkPaid = async () => {
    const inv = drawer.item; if (!inv) return;
    const amt = Number(inv.outstanding || 0);
    if (amt <= 0) return;
    await handleAddPayment({ amount: amt, method: 'Other', referenceNo: 'Auto-Paid', notes: 'Mark as Paid', paymentDate: new Date().toISOString().slice(0,10) });
  };

  const handleDownloadReceipt = async (payment, paymentIndex) => {
    const inv = drawer.item;
    if (!inv) {
      alert('Unable to generate receipt. Missing invoice information.');
      return;
    }

    const companyInfo = JSON.parse(localStorage.getItem('companySettings') || '{}');

    setDownloadingReceiptId(payment.id);
    try {
      const invoiceData = {
        invoiceNumber: inv.invoiceNo || inv.invoiceNumber,
        total: inv.invoiceAmount || 0,
        payments: inv.payments || [],
        customer: inv.customer || {},
      };
      const result = await generatePaymentReceipt(payment, invoiceData, companyInfo, paymentIndex);
      if (!result.success) {
        alert(`Error generating receipt: ${result.error}`);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const handlePrintReceipt = async (payment, paymentIndex) => {
    const inv = drawer.item;
    if (!inv) {
      alert('Unable to print receipt. Missing invoice information.');
      return;
    }

    const companyInfo = JSON.parse(localStorage.getItem('companySettings') || '{}');

    setPrintingReceiptId(payment.id);
    try {
      const invoiceData = {
        invoiceNumber: inv.invoiceNo || inv.invoiceNumber,
        total: inv.invoiceAmount || 0,
        payments: inv.payments || [],
        customer: inv.customer || {},
      };
      const result = await printPaymentReceipt(payment, invoiceData, companyInfo, paymentIndex);
      if (!result.success) {
        alert(`Error printing receipt: ${result.error}`);
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('Failed to print receipt. Please try again.');
    } finally {
      setPrintingReceiptId(null);
    }
  };

  const exportInvoices = async () => {
    try {
      const params = {
        search: filters.q || undefined,
        status: filters.status === 'all' ? undefined : filters.status,
        start_date: filters.start || undefined,
        end_date: filters.end || undefined,
        date_type: filters.dateType,
        customer: filters.customer || undefined,
        min_outstanding: filters.minOut || undefined,
        max_outstanding: filters.maxOut || undefined,
      };
      const blob = await payablesService.exportDownload('invoices', params, 'csv');
      downloadBlob(blob, 'invoices.csv');
      return;
    } catch (e) {
      console.warn('Backend export failed, falling back to client CSV');
    }
    const headers = ['Invoice #','Customer','Invoice Date','Due Date','Currency','Invoice Amount','Received To-Date','Outstanding','Status'];
    const rows = items.map(r => [r.invoiceNo || r.invoiceNumber, r.customer?.name || '', r.invoiceDate || r.date, r.dueDate || r.dueDate, r.currency || 'AED', (r.invoiceAmount||0), (r.received||0), (r.outstanding||0), r.status]);
    const csv = [headers, ...rows].map(r => r.map(v => (v!==undefined&&v!==null?`${v}`.replace(/"/g,'""'):'')).map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'invoices.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['Invoice #','Customer','Invoice Date','Due Date','Currency','Invoice Amount','Received To-Date','Outstanding','Status'];
    const rows = items.map(r => [r.invoiceNo || r.invoiceNumber, r.customer?.name || '', r.invoiceDate || r.date, r.dueDate || r.dueDate, r.currency || 'AED', (r.invoiceAmount||0), (r.received||0), (r.outstanding||0), r.status]);
    const csv = [headers, ...rows].map(r => r.map(v => (v!==undefined&&v!==null?`${v}`.replace(/"/g,'""'):'')).map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'invoices.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-4`}>
      {/* Filters Row */}
      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            <select value={filters.dateType} onChange={(e)=>setFilters({ dateType:e.target.value, page:'1' })} className="px-2 py-2 rounded border w-32">
              <option value="invoice">Invoice Date</option>
              <option value="due">Due Date</option>
            </select>
            <input type="date" value={filters.start} onChange={(e)=>setFilters({ start:e.target.value, page:'1' })} className="px-2 py-2 rounded border flex-1 min-w-0"/>
            <span className="opacity-70 shrink-0">to</span>
            <input type="date" value={filters.end} onChange={(e)=>setFilters({ end:e.target.value, page:'1' })} className="px-2 py-2 rounded border flex-1 min-w-0"/>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input placeholder="Customer (name/email)" value={filters.customer} onChange={(e)=>setFilters({ customer:e.target.value, page:'1' })} className="px-3 py-2 rounded border w-full min-w-0"/>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select value={filters.status} onChange={(e)=>setFilters({ status:e.target.value, page:'1' })} className="px-2 py-2 rounded border w-full">
              <option value="all">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input placeholder="Invoice # or search" value={filters.q} onChange={(e)=>setFilters({ q:e.target.value, page:'1' })} className="px-3 py-2 rounded border w-full min-w-0"/>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input type="number" step="0.01" placeholder="Min Outstanding" value={filters.minOut} onChange={(e)=>setFilters({ minOut:numberInput(e.target.value), page:'1' })} className="px-3 py-2 rounded border w-full min-w-0"/>
            <input type="number" step="0.01" placeholder="Max Outstanding" value={filters.maxOut} onChange={(e)=>setFilters({ maxOut:numberInput(e.target.value), page:'1' })} className="px-3 py-2 rounded border w-full min-w-0"/>
          </div>
          <div className="flex flex-wrap gap-2 items-center justify-end sm:justify-end">
            <button onClick={fetchData} className="px-3 py-2 rounded bg-teal-600 text-white flex items-center gap-2"><RefreshCw size={16}/>Apply</button>
            <button onClick={exportInvoices} className="px-3 py-2 rounded border flex items-center gap-2"><Download size={16}/>Export</button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
          <div className="text-xs opacity-70">Total Invoiced</div>
          <div className="text-lg font-semibold">{formatCurrency(aggregates.totalInvoiced)}</div>
        </div>
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
          <div className="text-xs opacity-70">Total Received</div>
          <div className="text-lg font-semibold">{formatCurrency(aggregates.totalReceived)}</div>
        </div>
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
          <div className="text-xs opacity-70">Total Outstanding</div>
          <div className="text-lg font-semibold">{formatCurrency(aggregates.totalOutstanding)}</div>
        </div>
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
          <div className="text-xs opacity-70">Overdue Amount</div>
          <div className="text-lg font-semibold">{formatCurrency(aggregates.overdueAmount)}</div>
        </div>
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
          <div className="text-xs opacity-70">Avg Days Past Due</div>
          <div className="text-lg font-semibold">{aggregates.avgDaysPastDue}</div>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
        <div className="overflow-auto">
          <table className="min-w-full divide-y">
            <thead>
              <tr className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <th className="px-4 py-3 text-left"><input type="checkbox" checked={allSelected} onChange={toggleAll}/></th>
                <th className="px-4 py-3 text-left text-xs uppercase">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Invoice Date</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Currency</th>
                <th className="px-4 py-3 text-right text-xs uppercase">Invoice Amount</th>
                <th className="px-4 py-3 text-right text-xs uppercase">Received To-Date</th>
                <th className="px-4 py-3 text-right text-xs uppercase">Outstanding</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-6 text-center">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-6 text-center">No records</td></tr>
              ) : items.map((row) => (
                <tr key={row.id} className={`hover:${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'} cursor-pointer`}>
                  <td className="px-4 py-2"><input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} onClick={(e)=>e.stopPropagation()}/></td>
                  <td className="px-4 py-2 text-teal-600 font-semibold" onClick={()=>openDrawer(row)}>{row.invoiceNo || row.invoiceNumber}</td>
                  <td className="px-4 py-2">
                    {row.customer?.name ? (
                      <button
                        className="text-teal-600 hover:underline"
                        onClick={(e)=>{
                          e.stopPropagation();
                          const cid = row.customer?.id || row.customerId || '';
                          const name = row.customer?.name || '';
                          if (cid) navigate(`/payables/customer/${cid}?name=${encodeURIComponent(name)}`);
                          else navigate(`/payables/customer/${encodeURIComponent(name)}?name=${encodeURIComponent(name)}`);
                        }}
                      >
                        {row.customer.name}
                      </button>
                    ) : (
                      <span onClick={()=>openDrawer(row)}>{row.customer?.name || ''}</span>
                    )}
                  </td>
                  <td className="px-4 py-2" onClick={()=>openDrawer(row)}>{formatDate(row.invoiceDate || row.date)}</td>
                  <td className="px-4 py-2" onClick={()=>openDrawer(row)}>
                    <div className="flex items-center gap-2">
                      <span>{formatDate(row.dueDate || row.dueDate)}</span>
                      {(row.status === 'overdue') && <Pill color="red">Overdue</Pill>}
                    </div>
                  </td>
                  <td className="px-4 py-2" onClick={()=>openDrawer(row)}>{row.currency || 'AED'}</td>
                  <td className="px-4 py-2 text-right" onClick={()=>openDrawer(row)}>{formatCurrency(row.invoiceAmount || 0)}</td>
                  <td className="px-4 py-2 text-right" onClick={()=>openDrawer(row)}>{formatCurrency(row.received || 0)}</td>
                  <td className="px-4 py-2 text-right" onClick={()=>openDrawer(row)}>{formatCurrency(row.outstanding || 0)}</td>
                  <td className="px-4 py-2" onClick={()=>openDrawer(row)}><StatusPill status={row.status} /></td>
                  <td className="px-4 py-2 text-right">
                    <button className={`px-2 py-1 ${canManage ? 'text-teal-600' : 'text-gray-400 cursor-not-allowed'}`} onClick={()=> canManage && openDrawer(row)} disabled={!canManage}>Record Payment</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Bulk Actions */}
        {selected.size > 0 && (
          <div className={`flex items-center justify-between px-4 py-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="text-sm">{selected.size} selected</div>
            <div className="flex gap-2">
              <button className={`px-3 py-2 rounded border ${canManage ? '' : 'text-gray-400 cursor-not-allowed'}`} disabled={!canManage} onClick={()=>{
                // Mark selected as paid (optimistic)
                setItems(prev => prev.map(i => selected.has(i.id) ? { ...i, received: (i.received||0)+(i.outstanding||0), outstanding: 0, status:'paid', payments: [...(i.payments||[]), { id: uuid(), amount: i.outstanding||0, method:'Other', paymentDate: new Date().toISOString().slice(0,10) }] } : i));
                setSelected(new Set());
              }}><CheckCircle size={16} className="inline mr-1"/>Mark as Paid</button>
              <button className="px-3 py-2 rounded border" onClick={()=>exportInvoices()}><Download size={16} className="inline mr-1"/>Export</button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawer.open && drawer.item && (
        <div className="fixed inset-0 z-[1100] flex">
          <div className="flex-1 bg-black/30" onClick={closeDrawer}></div>
          <div className={`w-full max-w-md h-full overflow-auto ${isDarkMode ? 'bg-[#1E2328] text-white' : 'bg-white text-gray-900'} shadow-xl`}> 
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{drawer.item.invoiceNo || drawer.item.invoiceNumber}</div>
                <div className="text-sm opacity-70">{drawer.item.customer?.name || ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={drawer.item.status} />
                <button onClick={closeDrawer} className="p-2 rounded hover:bg-gray-100"><X size={18}/></button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="opacity-70">Invoice Date</div><div>{formatDate(drawer.item.invoiceDate || drawer.item.date)}</div></div>
                <div><div className="opacity-70">Due Date</div><div>{formatDate(drawer.item.dueDate || drawer.item.dueDate)}</div></div>
                <div><div className="opacity-70">Currency</div><div>{drawer.item.currency || 'AED'}</div></div>
                <div><div className="opacity-70">Invoice Amount</div><div className="font-semibold">{formatCurrency(drawer.item.invoiceAmount || 0)}</div></div>
                <div><div className="opacity-70">Received</div><div className="font-semibold">{formatCurrency(drawer.item.received || 0)}</div></div>
                <div><div className="opacity-70">Outstanding</div><div className="font-semibold">{formatCurrency(drawer.item.outstanding || 0)}</div></div>
              </div>

              {/* Payments Timeline */}
              <div>
                <div className="font-semibold mb-2">Payments</div>
                <div className="space-y-2">
                  {(drawer.item.payments || []).length === 0 && (
                    <div className="text-sm opacity-70">No payments recorded yet.</div>
                  )}
                  {(drawer.item.payments || []).map((p, idx) => {
                    const paymentIndex = (drawer.item.payments || []).length - idx;
                    const isDownloading = downloadingReceiptId === p.id;
                    const isPrinting = printingReceiptId === p.id;

                    return (
                      <div key={p.id || idx} className={`p-2 rounded border ${p.voided ? 'opacity-60 line-through' : ''}`}>
                        <div className="flex justify-between items-start text-sm">
                          <div className="flex-1">
                            <div className="font-medium">{formatCurrency(p.amount || 0)}</div>
                            <div className="opacity-70">{p.method} • {p.referenceNo || '—'}</div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <div>{formatDate(p.paymentDate)}</div>
                              {p.voided && <div className="text-xs text-red-600">Voided</div>}
                            </div>
                            {!p.voided && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handlePrintReceipt(p, paymentIndex)}
                                  disabled={isPrinting}
                                  className={`p-1.5 rounded transition-colors ${
                                    isPrinting
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'hover:bg-purple-50 text-purple-600 hover:text-purple-700'
                                  }`}
                                  title="Print payment receipt"
                                >
                                  <Printer size={14} />
                                </button>
                                <button
                                  onClick={() => handleDownloadReceipt(p, paymentIndex)}
                                  disabled={isDownloading}
                                  className={`p-1.5 rounded transition-colors ${
                                    isDownloading
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'hover:bg-teal-50 text-teal-600 hover:text-teal-700'
                                  }`}
                                  title="Download payment receipt"
                                >
                                  <Download size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {p.notes && <div className="text-xs mt-1 opacity-80">{p.notes}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Payment */}
              {canManage && drawer.item.outstanding > 0 ? (
                <AddPaymentForm outstanding={drawer.item.outstanding || 0} onSave={handleAddPayment} />
              ) : drawer.item.outstanding === 0 ? (
                <div className="p-3 rounded border border-green-300 bg-green-50 text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle size={18} />
                  <span className="font-medium">Invoice Fully Paid</span>
                </div>
              ) : (
                <div className="text-sm opacity-70">You don't have permission to add payments.</div>
              )}

              {/* Quick Actions */}
              {canManage && drawer.item.outstanding > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-2 rounded border" onClick={handleMarkPaid}><CheckCircle size={16} className="inline mr-1"/>Mark as Paid</button>
                  <button className="px-3 py-2 rounded border" onClick={handleVoidLast}><Trash2 size={16} className="inline mr-1"/>Void last</button>
                  {(() => {
                    const payments = (drawer.item?.payments || []).filter(p=>!p.voided);
                    if (!payments.length) return null;
                    const last = payments[payments.length-1];
                    return (
                      <>
                        <button className="px-3 py-2 rounded border" onClick={async()=>{
                          try {
                            const blob = await payablesService.downloadInvoiceReceipt(drawer.item.id, last.id);
                            downloadBlob(blob, `receipt-${drawer.item.invoiceNo || drawer.item.invoiceNumber}-${last.id}.pdf`);
                          } catch(e) {
                            notificationService.error('Failed to download receipt');
                          }
                        }}>Download receipt</button>
                        <button className="px-3 py-2 rounded border" onClick={async()=>{
                          try {
                            await payablesService.emailInvoiceReceipt(drawer.item.id, last.id);
                            notificationService.success('Receipt emailed to customer');
                          } catch(e) {
                            notificationService.error('Failed to email receipt');
                          }
                        }}>Email receipt</button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AddPaymentForm = ({ outstanding = 0, onSave }) => {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Get current payment mode config
  const modeConfig = PAYMENT_MODES[method] || PAYMENT_MODES.cash;

  // Validation: amount must be > 0, <= outstanding, and reference required for non-cash
  const canSave =
    Number(amount) > 0 &&
    Number(amount) <= Number(outstanding || 0) &&
    (!modeConfig.requiresRef || (reference && reference.trim() !== ''));

  const handleSave = () => {
    if (!canSave) return;
    onSave({ amount: Number(amount), method, referenceNo: reference, notes, paymentDate: date });
    // Clear form after successful save
    setDate(new Date().toISOString().slice(0,10));
    setAmount('');
    setMethod('cash');
    setReference('');
    setNotes('');
  };

  return (
    <div className="p-3 rounded border">
      <div className="font-semibold mb-2">Add Payment</div>
      {outstanding > 0 && (
        <>
          <div className="mb-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded flex justify-between items-center">
            <span className="font-medium">Outstanding Balance:</span>
            <button
              type="button"
              onClick={() => setAmount(outstanding.toString())}
              className="font-bold text-blue-700 hover:text-blue-900 cursor-pointer hover:scale-105 transition-all group"
              title="Click to apply this amount to payment"
            >
              {formatCurrency(outstanding)}
              <span className="ml-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                ✓
              </span>
            </button>
          </div>
          <div className="mb-2 text-xs text-gray-600">
            💡 <strong>Tip:</strong> Click the balance amount above to auto-fill
          </div>
        </>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <div className="text-xs opacity-70 mb-1">Payment Date</div>
          <input type="date" className="px-2 py-2 rounded border w-full" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Amount (max: {formatCurrency(outstanding)})</div>
          <input type="number" step="0.01" max={outstanding} className="px-2 py-2 rounded border w-full" value={amount} onChange={e=>setAmount(numberInput(e.target.value))} />
          {Number(amount) > Number(outstanding) && <div className="text-xs text-red-600 mt-1">Amount cannot exceed outstanding balance</div>}
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">Payment Method</div>
          <select className="px-2 py-2 rounded border w-full" value={method} onChange={e=>{setMethod(e.target.value); setReference('');}}>
            {Object.values(PAYMENT_MODES).map(m => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
          </select>
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">
            {modeConfig.refLabel || 'Reference #'}
            {modeConfig.requiresRef && <span className="text-red-500"> *</span>}
          </div>
          <input
            className="px-2 py-2 rounded border w-full"
            value={reference}
            onChange={e=>setReference(e.target.value)}
            placeholder={modeConfig.requiresRef ? `Enter ${modeConfig.refLabel || 'reference'}` : 'Optional'}
            required={modeConfig.requiresRef}
          />
          {modeConfig.requiresRef && (!reference || reference.trim() === '') && (
            <div className="text-xs text-red-600 mt-1">Reference is required for {modeConfig.label}</div>
          )}
        </div>
        <div className="sm:col-span-2">
          <div className="text-xs opacity-70 mb-1">Notes</div>
          <textarea className="px-2 py-2 rounded border w-full" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button disabled={!canSave} onClick={handleSave} className={`px-3 py-2 rounded ${canSave ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>Save Payment</button>
      </div>
    </div>
  );
};

const POTab = ({ canManage }) => {
  const { isDarkMode } = useTheme();
  const [filters, setFilters] = useURLState({
    tab: 'pos', q: '', status: 'all', dateType: 'po', start: '', end: '', vendor: '', minBal: '', maxBal: '', page: '1', size: '10',
  });
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [drawer, setDrawer] = useState({ open: false, item: null });
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null);
  const [printingReceiptId, setPrintingReceiptId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const { items } = await payablesService.getPOs({
      search: filters.q || undefined,
      status: filters.status === 'all' ? undefined : filters.status,
      start_date: filters.start || undefined,
      end_date: filters.end || undefined,
      vendor: filters.vendor || undefined,
      min_balance: filters.minBal || undefined,
      max_balance: filters.maxBal || undefined,
    });
    setItems(items); setLoading(false);
  };
  useEffect(() => { fetchData(); }, [filters.q, filters.status, filters.start, filters.end, filters.vendor, filters.minBal, filters.maxBal]);

  const aggregates = useMemo(() => {
    const totalPO = items.reduce((s, r) => s + (Number(r.poValue || 0)), 0);
    const totalPaid = items.reduce((s, r) => s + (Number(r.paid || 0)), 0);
    const totalBalance = items.reduce((s, r) => s + (Number(r.balance || 0)), 0);
    const overdue = items.filter(r => r.status === 'overdue').reduce((s,r)=>s+Number(r.balance||0),0);
    const today = new Date();
    const upcoming = items.filter(r => r.dueDate && new Date(r.dueDate) > today && new Date(r.dueDate) < new Date(+today + 7*864e5)).reduce((s,r)=>s+Number(r.balance||0),0);
    return { totalPO, totalPaid, totalBalance, overdue, upcoming };
  }, [items]);

  const openDrawer = (item) => setDrawer({ open: true, item });
  const closeDrawer = () => setDrawer({ open: false, item: null });

  const handleAddPayment = async ({ amount, method, referenceNo, notes, paymentDate }) => {
    const po = drawer.item; if (!po) return;
    const balance = Number(po.balance || 0);
    if (!(Number(amount) > 0)) return alert('Amount must be > 0');
    if (Number(amount) > balance) return alert('Amount exceeds balance');
    const newPayment = { id: uuid(), paymentDate: paymentDate || new Date().toISOString().slice(0,10), amount: Number(amount), method, referenceNo, notes };
    const updated = { ...po, payments: [...(po.payments||[]), newPayment] };
    const paid = (po.paid||0)+newPayment.amount; const newBal = Math.max(0, +(balance - newPayment.amount).toFixed(2));
    let status='unpaid'; if (newBal===0) status='paid'; else if (newBal<(po.poValue||0)) status='partially_paid';
    const updatedPO = { ...updated, paid, balance: newBal, status };
    setDrawer({ open: true, item: updatedPO });
    setItems(prev => prev.map(i => i.id===po.id? updatedPO : i));
    try { 
      await payablesService.addPOPayment(po.id, newPayment); 
    } catch(e){ 
      // Ignore - optimistic UI already updated, backend error doesn't affect display
      console.warn('Failed to persist PO payment to backend:', e.message);
    }
  };

  const handleVoidLast = async () => {
    const po = drawer.item; if (!po) return; const payments = (po.payments||[]).filter(p=>!p.voided);
    if (!payments.length) return; const last = payments[payments.length-1];
    const updatedPayments = po.payments.map(p=>p.id===last.id? { ...p, voided:true, voidedAt: new Date().toISOString() } : p);
    const paid = updatedPayments.filter(p=>!p.voided).reduce((s,p)=>s+Number(p.amount||0),0);
    const balance = Math.max(0, +((po.poValue||0)-paid).toFixed(2)); let status='unpaid'; if (balance===0) status='paid'; else if (balance<(po.poValue||0)) status='partially_paid';
    const updatedPO = { ...po, payments: updatedPayments, paid, balance, status };
    setDrawer({ open: true, item: updatedPO }); setItems(prev=>prev.map(i=>i.id===po.id?updatedPO:i));
    try{ await payablesService.voidPOPayment(po.id, last.id, 'User void via UI'); }catch(e){/* ignore */}
  };

  const handleMarkPaid = async () => {
    const po = drawer.item; if (!po) return; const amt = Number(po.balance||0); if (amt<=0) return;
    await handleAddPayment({ amount: amt, method:'Other', referenceNo:'Auto-Paid', notes:'Mark as Fully Paid', paymentDate: new Date().toISOString().slice(0,10) });
  };

  const handleDownloadReceipt = async (payment, paymentIndex) => {
    const po = drawer.item;
    if (!po) {
      alert('Unable to generate receipt. Missing PO information.');
      return;
    }

    const companyInfo = JSON.parse(localStorage.getItem('companySettings') || '{}');

    setDownloadingReceiptId(payment.id);
    try {
      const poData = {
        invoiceNumber: po.poNo || po.poNumber,
        total: po.poValue || 0,
        payments: po.payments || [],
        customer: po.vendor || {},
      };
      const result = await generatePaymentReceipt(payment, poData, companyInfo, paymentIndex);
      if (!result.success) {
        alert(`Error generating receipt: ${result.error}`);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const handlePrintReceipt = async (payment, paymentIndex) => {
    const po = drawer.item;
    if (!po) {
      alert('Unable to print receipt. Missing PO information.');
      return;
    }

    const companyInfo = JSON.parse(localStorage.getItem('companySettings') || '{}');

    setPrintingReceiptId(payment.id);
    try {
      const poData = {
        invoiceNumber: po.poNo || po.poNumber,
        total: po.poValue || 0,
        payments: po.payments || [],
        customer: po.vendor || {},
      };
      const result = await printPaymentReceipt(payment, poData, companyInfo, paymentIndex);
      if (!result.success) {
        alert(`Error printing receipt: ${result.error}`);
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('Failed to print receipt. Please try again.');
    } finally {
      setPrintingReceiptId(null);
    }
  };

  const exportPOs = async () => {
    try {
      const params = {
        search: filters.q || undefined,
        status: filters.status === 'all' ? undefined : filters.status,
        start_date: filters.start || undefined,
        end_date: filters.end || undefined,
        vendor: filters.vendor || undefined,
        min_balance: filters.minBal || undefined,
        max_balance: filters.maxBal || undefined,
      };
      const blob = await payablesService.exportDownload('pos', params, 'csv');
      downloadBlob(blob, 'pos.csv');
      return;
    } catch (e) {
      console.warn('Backend export failed, falling back to client CSV');
    }
    const headers = ['PO #','Vendor','PO Date','Due Date','Currency','PO Value','Paid To-Date','Balance','Status'];
    const rows = items.map(r => [r.poNo || r.poNumber, r.vendor?.name || r.vendor || '', r.poDate || r.date, r.dueDate || r.dueDate, r.currency || 'AED', (r.poValue||0), (r.paid||0), (r.balance||0), r.status]);
    const csv = [headers, ...rows].map(r => r.map(v => (v!==undefined&&v!==null?`${v}`.replace(/"/g,'""'):'')).map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pos.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['PO #','Vendor','PO Date','Due Date','Currency','PO Value','Paid To-Date','Balance','Status'];
    const rows = items.map(r => [r.poNo || r.poNumber, r.vendor?.name || r.vendor || '', r.poDate || r.date, r.dueDate || r.dueDate, r.currency || 'AED', (r.poValue||0), (r.paid||0), (r.balance||0), r.status]);
    const csv = [headers, ...rows].map(r => r.map(v => (v!==undefined&&v!==null?`${v}`.replace(/"/g,'""'):'')).map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pos.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            <select value={filters.dateType} onChange={(e)=>setFilters({ dateType:e.target.value })} className="px-2 py-2 rounded border w-32">
              <option value="po">PO Date</option>
              <option value="due">Due Date</option>
            </select>
            <input type="date" value={filters.start} onChange={(e)=>setFilters({ start:e.target.value })} className="px-2 py-2 rounded border flex-1 min-w-0"/>
            <span className="opacity-70 shrink-0">to</span>
            <input type="date" value={filters.end} onChange={(e)=>setFilters({ end:e.target.value })} className="px-2 py-2 rounded border flex-1 min-w-0"/>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input placeholder="Vendor" value={filters.vendor} onChange={(e)=>setFilters({ vendor:e.target.value })} className="px-3 py-2 rounded border w-full min-w-0"/>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select value={filters.status} onChange={(e)=>setFilters({ status:e.target.value })} className="px-2 py-2 rounded border w-full">
              <option value="all">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input placeholder="PO # or search" value={filters.q} onChange={(e)=>setFilters({ q:e.target.value })} className="px-3 py-2 rounded border w-full min-w-0"/>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <input type="number" step="0.01" placeholder="Min Balance" value={filters.minBal} onChange={(e)=>setFilters({ minBal:numberInput(e.target.value) })} className="px-3 py-2 rounded border w-full min-w-0"/>
            <input type="number" step="0.01" placeholder="Max Balance" value={filters.maxBal} onChange={(e)=>setFilters({ maxBal:numberInput(e.target.value) })} className="px-3 py-2 rounded border w-full min-w-0"/>
          </div>
          <div className="flex flex-wrap gap-2 items-center justify-end sm:justify-end">
            <button onClick={fetchData} className="px-3 py-2 rounded bg-teal-600 text-white flex items-center gap-2"><RefreshCw size={16}/>Apply</button>
            <button onClick={exportPOs} className="px-3 py-2 rounded border flex items-center gap-2"><Download size={16}/>Export</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
          <div className="text-xs opacity-70">Total PO Value</div>
          <div className="text-lg font-semibold">{formatCurrency(aggregates.totalPO)}</div>
        </div>
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
          <div className="text-xs opacity-70">Total Paid</div>
          <div className="text-lg font-semibold">{formatCurrency(aggregates.totalPaid)}</div>
        </div>
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
          <div className="text-xs opacity-70">Total Balance</div>
          <div className="text-lg font-semibold">{formatCurrency(aggregates.totalBalance)}</div>
        </div>
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
          <div className="text-xs opacity-70">Overdue Payables</div>
          <div className="text-lg font-semibold">{formatCurrency(aggregates.overdue)}</div>
        </div>
        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
          <div className="text-xs opacity-70">Upcoming (7 days)</div>
          <div className="text-lg font-semibold">{formatCurrency(aggregates.upcoming)}</div>
        </div>
      </div>

      <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'}`}>
        <div className="overflow-auto">
          <table className="min-w-full divide-y">
            <thead>
              <tr className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <th className="px-4 py-3 text-left text-xs uppercase">PO #</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Vendor</th>
                <th className="px-4 py-3 text-left text-xs uppercase">PO Date</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Currency</th>
                <th className="px-4 py-3 text-right text-xs uppercase">PO Value</th>
                <th className="px-4 py-3 text-right text-xs uppercase">Paid To-Date</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Last Payment</th>
                <th className="px-4 py-3 text-right text-xs uppercase">Balance</th>
                <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-6 text-center">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-6 text-center">No records</td></tr>
              ) : items.map((row) => (
                <tr key={row.id} className={`hover:${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'} cursor-pointer`}>
                  <td className="px-4 py-2 text-teal-600 font-semibold" onClick={()=>openDrawer(row)}>{row.poNo || row.poNumber}</td>
                  <td className="px-4 py-2" onClick={()=>openDrawer(row)}>{row.vendor?.name || row.vendor || ''}</td>
                  <td className="px-4 py-2" onClick={()=>openDrawer(row)}>{formatDate(row.poDate || row.date)}</td>
                  <td className="px-4 py-2" onClick={()=>openDrawer(row)}>
                    <div className="flex items-center gap-2">
                      <span>{formatDate(row.dueDate || row.dueDate)}</span>
                      {(row.status === 'overdue') && <Pill color="red">Overdue</Pill>}
                    </div>
                  </td>
                  <td className="px-4 py-2" onClick={()=>openDrawer(row)}>{row.currency || 'AED'}</td>
                  <td className="px-4 py-2 text-right" onClick={()=>openDrawer(row)}>{formatCurrency(row.poValue || 0)}</td>
                  <td className="px-4 py-2 text-right" onClick={()=>openDrawer(row)}>
                    <div>
                      <div className="font-medium">{formatCurrency(row.paid || 0)}</div>
                      {(row.payments && row.payments.filter(p => !p.voided).length > 0) && (
                        <div className="text-xs opacity-70">
                          {row.payments.filter(p => !p.voided).length} payment{row.payments.filter(p => !p.voided).length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2" onClick={()=>openDrawer(row)}>
                    {(row.payments && row.payments.length > 0) ? (
                      <div className="text-xs">
                        <div className="font-medium">{formatDate(row.payments[row.payments.length - 1]?.paymentDate)}</div>
                        <div className="opacity-70">{formatCurrency(row.payments[row.payments.length - 1]?.amount || 0)}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No payments</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right" onClick={()=>openDrawer(row)}>{formatCurrency(row.balance || 0)}</td>
                  <td className="px-4 py-2" onClick={()=>openDrawer(row)}><StatusPill status={row.status} /></td>
                  <td className="px-4 py-2 text-right">
                    <button className={`px-2 py-1 ${canManage ? 'text-teal-600' : 'text-gray-400 cursor-not-allowed'}`} disabled={!canManage} onClick={()=> canManage && openDrawer(row)}>Record Payment</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {drawer.open && drawer.item && (
        <div className="fixed inset-0 z-[1100] flex">
          <div className="flex-1 bg-black/30" onClick={closeDrawer}></div>
          <div className={`w-full max-w-md h-full overflow-auto ${isDarkMode ? 'bg-[#1E2328] text-white' : 'bg-white text-gray-900'} shadow-xl`}> 
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{drawer.item.poNo || drawer.item.poNumber}</div>
                <div className="text-sm opacity-70">{drawer.item.vendor?.name || drawer.item.vendor || ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={drawer.item.status} />
                <button onClick={closeDrawer} className="p-2 rounded hover:bg-gray-100"><X size={18}/></button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="opacity-70">PO Date</div><div>{formatDate(drawer.item.poDate || drawer.item.date)}</div></div>
                <div><div className="opacity-70">Due Date</div><div>{formatDate(drawer.item.dueDate || drawer.item.dueDate)}</div></div>
                <div><div className="opacity-70">Currency</div><div>{drawer.item.currency || 'AED'}</div></div>
                <div><div className="opacity-70">PO Value</div><div className="font-semibold">{formatCurrency(drawer.item.poValue || 0)}</div></div>
                <div><div className="opacity-70">Paid</div><div className="font-semibold">{formatCurrency(drawer.item.paid || 0)}</div></div>
                <div><div className="opacity-70">Balance</div><div className="font-semibold">{formatCurrency(drawer.item.balance || 0)}</div></div>
              </div>

              {/* Payments Timeline */}
              <div>
                <div className="font-semibold mb-2">Payments</div>
                <div className="space-y-2">
                  {(drawer.item.payments || []).length === 0 && (
                    <div className="text-sm opacity-70">No payments recorded yet.</div>
                  )}
                  {(drawer.item.payments || []).map((p, idx) => {
                    const paymentIndex = (drawer.item.payments || []).length - idx;
                    const isDownloading = downloadingReceiptId === p.id;
                    const isPrinting = printingReceiptId === p.id;

                    return (
                      <div key={p.id || idx} className={`p-2 rounded border ${p.voided ? 'opacity-60 line-through' : ''}`}>
                        <div className="flex justify-between items-start text-sm">
                          <div className="flex-1">
                            <div className="font-medium">{formatCurrency(p.amount || 0)}</div>
                            <div className="opacity-70">{p.method} • {p.referenceNo || '—'}</div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <div>{formatDate(p.paymentDate)}</div>
                              {p.voided && <div className="text-xs text-red-600">Voided</div>}
                            </div>
                            {!p.voided && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handlePrintReceipt(p, paymentIndex)}
                                  disabled={isPrinting}
                                  className={`p-1.5 rounded transition-colors ${
                                    isPrinting
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'hover:bg-purple-50 text-purple-600 hover:text-purple-700'
                                  }`}
                                  title="Print payment receipt"
                                >
                                  <Printer size={14} />
                                </button>
                                <button
                                  onClick={() => handleDownloadReceipt(p, paymentIndex)}
                                  disabled={isDownloading}
                                  className={`p-1.5 rounded transition-colors ${
                                    isDownloading
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'hover:bg-teal-50 text-teal-600 hover:text-teal-700'
                                  }`}
                                  title="Download payment receipt"
                                >
                                  <Download size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {p.notes && <div className="text-xs mt-1 opacity-80">{p.notes}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Payment */}
              {canManage && drawer.item.balance > 0 ? (
                <AddPaymentForm outstanding={drawer.item.balance || 0} onSave={handleAddPayment} />
              ) : drawer.item.balance === 0 ? (
                <div className="p-3 rounded border border-green-300 bg-green-50 text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle size={18} />
                  <span className="font-medium">Purchase Order Fully Paid</span>
                </div>
              ) : (
                <div className="text-sm opacity-70">You don't have permission to add payments.</div>
              )}

              {/* Quick Actions */}
              {canManage && drawer.item.balance > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-2 rounded border" onClick={handleMarkPaid}><CheckCircle size={16} className="inline mr-1"/>Mark as Fully Paid</button>
                  <button className="px-3 py-2 rounded border" onClick={handleVoidLast}><Trash2 size={16} className="inline mr-1"/>Void last</button>
                  {(() => {
                    const payments = (drawer.item?.payments || []).filter(p=>!p.voided);
                    if (!payments.length) return null;
                    const last = payments[payments.length-1];
                    return (
                      <>
                        <button className="px-3 py-2 rounded border" onClick={async()=>{
                          try {
                            const blob = await payablesService.downloadPOVoucher(drawer.item.id, last.id);
                            downloadBlob(blob, `voucher-${drawer.item.poNo || drawer.item.poNumber}-${last.id}.pdf`);
                          } catch(e) {
                            notificationService.error('Failed to download voucher');
                          }
                        }}>Download voucher</button>
                        <button className="px-3 py-2 rounded border" onClick={async()=>{
                          try {
                            await payablesService.emailPOVoucher(drawer.item.id, last.id);
                            notificationService.success('Voucher emailed to vendor');
                          } catch(e) {
                            notificationService.error('Failed to email voucher');
                          }
                        }}>Email voucher</button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Payables = () => {
  const { isDarkMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'pos';
  const canManage = authService.hasPermission('payables','manage')
    || authService.hasPermission('payables','write')
    || authService.hasRole(['admin','finance']);
  const setTab = (t) => setSearchParams({ ...Object.fromEntries(searchParams.entries()), tab: t });

  return (
    <div className={`p-2 sm:p-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white">
            <Banknote size={20} />
          </div>
          <div>
            <div className="font-bold text-xl">Payables</div>
            <div className="text-xs opacity-70">Track receivables and vendor payables</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Placeholder for global search/filter if needed */}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <TabButton active={tab === 'invoices'} onClick={() => setTab('invoices')}>Invoices</TabButton>
        <TabButton active={tab === 'pos'} onClick={() => setTab('pos')}>PO Payments</TabButton>
      </div>

      {tab === 'invoices' ? <InvoicesTab canManage={canManage} /> : <POTab canManage={canManage} />}
    </div>
  );
};

export default Payables;
