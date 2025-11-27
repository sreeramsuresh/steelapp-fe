import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Printer,
  Trash2,
  Ship,
  Plane,
  Truck,
  Package,
  Building2,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  ChevronRight,
  Download,
  Eye,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Anchor,
  CreditCard,
  FileCheck,
  ShieldCheck,
  Award,
  Banknote,
  User,
  Phone,
  Mail,
  Globe,
  X,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { importOrderService } from '../services/importOrderService';
import ConfirmDialog from '../components/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

// Status configuration
const STATUS_CONFIG = {
  draft: {
    color: 'gray',
    bgLight: 'bg-gray-100',
    bgDark: 'bg-gray-800',
    textLight: 'text-gray-800',
    textDark: 'text-gray-300',
    borderLight: 'border-gray-300',
    borderDark: 'border-gray-600',
    icon: FileText,
    label: 'Draft',
  },
  confirmed: {
    color: 'blue',
    bgLight: 'bg-blue-100',
    bgDark: 'bg-blue-900/30',
    textLight: 'text-blue-800',
    textDark: 'text-blue-300',
    borderLight: 'border-blue-300',
    borderDark: 'border-blue-600',
    icon: CheckCircle,
    label: 'Confirmed',
  },
  shipped: {
    color: 'indigo',
    bgLight: 'bg-indigo-100',
    bgDark: 'bg-indigo-900/30',
    textLight: 'text-indigo-800',
    textDark: 'text-indigo-300',
    borderLight: 'border-indigo-300',
    borderDark: 'border-indigo-600',
    icon: Ship,
    label: 'Shipped',
  },
  in_transit: {
    color: 'amber',
    bgLight: 'bg-amber-100',
    bgDark: 'bg-amber-900/30',
    textLight: 'text-amber-800',
    textDark: 'text-amber-300',
    borderLight: 'border-amber-300',
    borderDark: 'border-amber-600',
    icon: Ship,
    label: 'In Transit',
  },
  arrived: {
    color: 'purple',
    bgLight: 'bg-purple-100',
    bgDark: 'bg-purple-900/30',
    textLight: 'text-purple-800',
    textDark: 'text-purple-300',
    borderLight: 'border-purple-300',
    borderDark: 'border-purple-600',
    icon: Anchor,
    label: 'Arrived',
  },
  customs: {
    color: 'orange',
    bgLight: 'bg-orange-100',
    bgDark: 'bg-orange-900/30',
    textLight: 'text-orange-800',
    textDark: 'text-orange-300',
    borderLight: 'border-orange-300',
    borderDark: 'border-orange-600',
    icon: ShieldCheck,
    label: 'Customs Clearance',
  },
  customs_clearance: {
    color: 'orange',
    bgLight: 'bg-orange-100',
    bgDark: 'bg-orange-900/30',
    textLight: 'text-orange-800',
    textDark: 'text-orange-300',
    borderLight: 'border-orange-300',
    borderDark: 'border-orange-600',
    icon: ShieldCheck,
    label: 'Customs Clearance',
  },
  completed: {
    color: 'green',
    bgLight: 'bg-green-100',
    bgDark: 'bg-green-900/30',
    textLight: 'text-green-800',
    textDark: 'text-green-300',
    borderLight: 'border-green-300',
    borderDark: 'border-green-600',
    icon: CheckCircle,
    label: 'Completed',
  },
  cancelled: {
    color: 'red',
    bgLight: 'bg-red-100',
    bgDark: 'bg-red-900/30',
    textLight: 'text-red-800',
    textDark: 'text-red-300',
    borderLight: 'border-red-300',
    borderDark: 'border-red-600',
    icon: XCircle,
    label: 'Cancelled',
  },
};

// Status transitions
const STATUS_TRANSITIONS = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'in_transit', 'cancelled'],
  shipped: ['in_transit', 'cancelled'],
  in_transit: ['arrived', 'customs', 'customs_clearance', 'cancelled'],
  arrived: ['customs', 'customs_clearance', 'cancelled'],
  customs: ['completed', 'cancelled'],
  customs_clearance: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// Document tabs configuration
const DOCUMENT_TABS = [
  { id: 'trade', label: 'Trade Documents', icon: FileText },
  { id: 'shipping', label: 'Shipping Documents', icon: Ship },
  { id: 'customs', label: 'Customs Documents', icon: ShieldCheck },
  { id: 'certificates', label: 'Material Certificates', icon: Award },
  { id: 'finance', label: 'Trade Finance', icon: Banknote },
];

const ImportOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();

  // State
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeDocTab, setActiveDocTab] = useState('trade');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('');
  const [showStatusNotesModal, setShowStatusNotesModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  // Load order data
  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await importOrderService.getImportOrder(id);
      setOrder(response.order || response);
    } catch (err) {
      console.error('Error loading import order:', err);
      setError(err.message || 'Failed to load import order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Get status config
  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    setStatusDropdownOpen(false);
    setPendingStatus(newStatus);
    setShowStatusNotesModal(true);
  };

  // Confirm status update
  const confirmStatusUpdate = async () => {
    try {
      await importOrderService.updateStatus(id, pendingStatus, statusUpdateNotes);
      setSuccess(`Status updated to ${getStatusConfig(pendingStatus).label}`);
      setShowStatusNotesModal(false);
      setStatusUpdateNotes('');
      setPendingStatus(null);
      loadOrder();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Import Order?',
      message: `Are you sure you want to delete import order ${order?.importOrderNumber || order?.import_order_number}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await importOrderService.deleteImportOrder(id);
      setSuccess('Import order deleted successfully');
      setTimeout(() => navigate('/import-orders'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to delete import order');
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Get shipping method icon
  const getShippingIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'air':
      case 'air_freight':
        return Plane;
      case 'land':
      case 'road':
        return Truck;
      case 'sea':
      case 'ocean':
      default:
        return Ship;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span className={`ml-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading import order...
          </span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !order) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className={`text-center p-12 rounded-2xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
        }`}>
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Error Loading Order
          </h2>
          <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={loadOrder}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <RefreshCw className="inline-block w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className={`text-center p-12 rounded-2xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
        }`}>
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Import order not found
          </p>
          <Link
            to="/import-orders"
            className="mt-4 inline-block text-teal-600 hover:text-teal-700"
          >
            Back to Import Orders
          </Link>
        </div>
      </div>
    );
  }

  // Normalize field names (handle both camelCase and snake_case)
  const orderNumber = order.importOrderNumber || order.import_order_number || 'N/A';
  const orderDate = order.orderDate || order.order_date;
  const piNumber = order.piNumber || order.pi_number;
  const poNumber = order.poNumber || order.po_number;
  const status = order.status || 'draft';
  const currency = order.currency || 'USD';
  const exchangeRate = order.exchangeRate || order.exchange_rate || 1;
  const subtotal = order.subtotal || order.sub_total || 0;
  const freightCost = order.freightCost || order.freight_cost || 0;
  const insuranceCost = order.insuranceCost || order.insurance_cost || 0;
  const cifValue = order.cifValue || order.cif_value || (parseFloat(subtotal) + parseFloat(freightCost) + parseFloat(insuranceCost));
  const customsDuty = order.customsDuty || order.customs_duty || (cifValue * 0.05);
  const vat = order.vat || (cifValue * 0.05);
  const grandTotal = order.grandTotal || order.grand_total || order.total || (cifValue + customsDuty + vat);
  const grandTotalAED = order.grandTotalAed || order.grand_total_aed || (grandTotal * exchangeRate);
  const items = order.items || order.lineItems || order.line_items || [];
  const supplier = order.supplier || {};
  const supplierName = order.supplierName || order.supplier_name || supplier.name || 'N/A';
  const originPort = order.originPort || order.origin_port || 'N/A';
  const destinationPort = order.destinationPort || order.destination_port || 'Jebel Ali, UAE';
  const shippingMethod = order.shippingMethod || order.shipping_method || 'sea';
  const vesselName = order.vesselName || order.vessel_name;
  const containerNumber = order.containerNumber || order.container_number;
  const blNumber = order.blNumber || order.bl_number;
  const etd = order.etd || order.estimated_departure;
  const eta = order.eta || order.estimated_arrival;
  const actualArrival = order.actualArrival || order.actual_arrival;
  const incoterms = order.incoterms || 'CIF';
  const paymentTerms = order.paymentTerms || order.payment_terms;
  const lcNumber = order.lcNumber || order.lc_number;
  const createdAt = order.createdAt || order.created_at;
  const updatedAt = order.updatedAt || order.updated_at;
  const createdBy = order.createdBy || order.created_by;
  const notes = order.notes;
  const documents = order.documents || [];
  const statusHistory = order.statusHistory || order.status_history || [];

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;
  const ShippingIcon = getShippingIcon(shippingMethod);
  const availableTransitions = STATUS_TRANSITIONS[status] || [];

  return (
    <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/import-orders')}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold flex items-center gap-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Package size={32} className="text-teal-600" />
              {orderNumber}
            </h1>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Import Order Details
            </p>
          </div>
          {/* Status Badge */}
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full border ${
            isDarkMode
              ? `${statusConfig.bgDark} ${statusConfig.textDark} ${statusConfig.borderDark}`
              : `${statusConfig.bgLight} ${statusConfig.textLight} ${statusConfig.borderLight}`
          }`}>
            <StatusIcon size={16} />
            {statusConfig.label}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {status === 'draft' && (
            <Link
              to={`/import-orders/${id}/edit`}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                isDarkMode
                  ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
                  : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Edit size={18} />
              Edit
            </Link>
          )}

          <button
            onClick={handlePrint}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              isDarkMode
                ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
                : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Printer size={18} />
            Print
          </button>

          {/* Status Update Dropdown */}
          {availableTransitions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <RefreshCw size={18} />
                Update Status
                <ChevronRight size={16} className={`transform transition-transform ${statusDropdownOpen ? 'rotate-90' : ''}`} />
              </button>
              {statusDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setStatusDropdownOpen(false)}
                  />
                  <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-20 border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    {availableTransitions.map((nextStatus) => {
                      const nextConfig = getStatusConfig(nextStatus);
                      const NextIcon = nextConfig.icon;
                      return (
                        <button
                          key={nextStatus}
                          onClick={() => handleStatusUpdate(nextStatus)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isDarkMode
                              ? 'hover:bg-gray-700 text-gray-200'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <NextIcon size={18} className={nextConfig.textLight} />
                          {nextConfig.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary Card */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <FileText size={20} className="text-teal-600" />
              Order Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Order Date</p>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatDate(orderDate)}
                </p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>PI Number</p>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {piNumber || 'N/A'}
                </p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>PO Number</p>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {poNumber || 'N/A'}
                </p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Created</p>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatDate(createdAt)}
                </p>
              </div>
              {createdBy && (
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Created By</p>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {createdBy}
                  </p>
                </div>
              )}
              {updatedAt && (
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Modified</p>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatDate(updatedAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Status Timeline */}
            {statusHistory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-dashed ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
                <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status History
                </h3>
                <div className="space-y-3">
                  {statusHistory.slice(0, 5).map((entry, index) => {
                    const entryConfig = getStatusConfig(entry.status);
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-2 rounded-full ${
                          isDarkMode ? entryConfig.bgDark : entryConfig.bgLight
                        }`} />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {entryConfig.label}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatDate(entry.timestamp || entry.date)} {entry.user && `by ${entry.user}`}
                          </p>
                          {entry.notes && (
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Supplier Card */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Building2 size={20} className="text-teal-600" />
              Supplier Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Supplier Name</p>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {order.supplierId ? (
                    <Link
                      to={`/suppliers/${order.supplierId || order.supplier_id}`}
                      className="text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1"
                    >
                      {supplierName}
                      <ExternalLink size={14} />
                    </Link>
                  ) : (
                    supplierName
                  )}
                </p>
              </div>
              {(supplier.contactPerson || supplier.contact_person) && (
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contact Person</p>
                  <p className={`font-medium flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <User size={14} />
                    {supplier.contactPerson || supplier.contact_person}
                  </p>
                </div>
              )}
              {(supplier.email || order.supplierEmail || order.supplier_email) && (
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                  <p className={`font-medium flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Mail size={14} />
                    {supplier.email || order.supplierEmail || order.supplier_email}
                  </p>
                </div>
              )}
              {(supplier.phone || order.supplierPhone || order.supplier_phone) && (
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone</p>
                  <p className={`font-medium flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Phone size={14} />
                    {supplier.phone || order.supplierPhone || order.supplier_phone}
                  </p>
                </div>
              )}
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Payment Terms</p>
                <p className={`font-medium flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <CreditCard size={14} />
                  {paymentTerms || 'N/A'}
                </p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Incoterms</p>
                <p className={`font-medium flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Globe size={14} />
                  {incoterms}
                </p>
              </div>
              {/* Supplier VAT Status - UAE VAT Compliance */}
              {(order.supplier_vat_status || order.supplierVatStatus) && (
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Supplier VAT Status</p>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {order.supplier_vat_status || order.supplierVatStatus}
                  </p>
                </div>
              )}
              {/* Supplier TRN - UAE VAT Compliance */}
              {(order.supplier_trn || order.supplierTrn) && (
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Supplier TRN</p>
                  <p className={`font-medium font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {order.supplier_trn || order.supplierTrn}
                  </p>
                </div>
              )}
              {lcNumber && (
                <div className="md:col-span-2">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>LC Number</p>
                  <p className={`font-medium flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Banknote size={14} />
                    {lcNumber}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Card */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <ShippingIcon size={20} className="text-teal-600" />
              Shipping Information
            </h2>

            {/* Route Visualization */}
            <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <MapPin className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {originPort}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Origin</p>
                </div>
                <div className="flex-1 mx-4">
                  <div className={`h-0.5 relative ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                    <ShippingIcon className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 ${
                      isDarkMode ? 'text-teal-400' : 'text-teal-600'
                    }`} />
                  </div>
                </div>
                <div className="text-center">
                  <MapPin className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {destinationPort}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Destination</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Shipping Method</p>
                <p className={`font-medium flex items-center gap-2 capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <ShippingIcon size={14} />
                  {shippingMethod?.replace('_', ' ') || 'Sea Freight'}
                </p>
              </div>
              {vesselName && (
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vessel Name</p>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{vesselName}</p>
                </div>
              )}
              {containerNumber && (
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Container No.</p>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{containerNumber}</p>
                </div>
              )}
              {blNumber && (
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>B/L Number</p>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{blNumber}</p>
                </div>
              )}
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ETD</p>
                <p className={`font-medium flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Calendar size={14} />
                  {formatDate(etd)}
                </p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ETA</p>
                <p className={`font-medium flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Calendar size={14} />
                  {formatDate(eta)}
                </p>
              </div>
              {actualArrival && (
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actual Arrival</p>
                  <p className={`font-medium flex items-center gap-2 text-green-600`}>
                    <CheckCircle size={14} />
                    {formatDate(actualArrival)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Package size={20} className="text-teal-600" />
              Line Items
              <span className={`text-sm font-normal ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ({items.length} {items.length === 1 ? 'item' : 'items'})
              </span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Product
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Specification
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      HS Code
                    </th>
                    <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Qty
                    </th>
                    <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Unit Price
                    </th>
                    <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="6" className={`px-4 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No items in this order
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const productName = item.productName || item.product_name || item.name || item.description || 'N/A';
                      const specification = item.specification || item.specs || item.grade || '-';
                      const hsCode = item.hsCode || item.hs_code || '-';
                      const quantity = item.quantity || item.qty || 0;
                      const unit = item.unit || 'MT';
                      const unitPrice = item.unitPrice || item.unit_price || item.price || 0;
                      const lineTotal = item.total || item.lineTotal || item.line_total || (quantity * unitPrice);
                      const mill = item.mill || item.millName || item.mill_name;
                      const heatNumber = item.heatNumber || item.heat_number;

                      return (
                        <tr key={item.id || index} className={`${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                          <td className="px-4 py-3">
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {productName}
                            </div>
                            {(mill || heatNumber) && (
                              <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {mill && `Mill: ${mill}`}
                                {mill && heatNumber && ' | '}
                                {heatNumber && `Heat: ${heatNumber}`}
                              </div>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {specification}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {hsCode}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {quantity.toLocaleString()} {unit}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {formatCurrency(unitPrice, currency)}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(lineTotal, currency)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Documents Tabs */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <FileCheck size={20} className="text-teal-600" />
              Documents
            </h2>

            {/* Tab Navigation */}
            <div className={`flex flex-wrap gap-2 mb-4 border-b pb-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {DOCUMENT_TABS.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeDocTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDocTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <TabIcon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Document List */}
            <div className="space-y-2">
              {documents.filter(doc => doc.category === activeDocTab || (!doc.category && activeDocTab === 'trade')).length === 0 ? (
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No documents in this category</p>
                </div>
              ) : (
                documents
                  .filter(doc => doc.category === activeDocTab || (!doc.category && activeDocTab === 'trade'))
                  .map((doc, index) => (
                    <div
                      key={doc.id || index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {doc.name || doc.fileName || doc.file_name}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {doc.uploadedAt ? formatDate(doc.uploadedAt || doc.uploaded_at) : 'Uploaded'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                          }`}
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                          }`}
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
            }`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Notes
              </h2>
              <p className={`text-sm whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Cost Breakdown */}
        <div className="space-y-6">
          {/* Cost Breakdown Card */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <DollarSign size={20} className="text-teal-600" />
              Cost Breakdown
            </h2>

            <div className="space-y-3">
              {/* Currency & Exchange Rate */}
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Currency</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currency}</span>
                </div>
                {currency !== 'AED' && (
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Exchange Rate</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      1 {currency} = {exchangeRate} AED
                    </span>
                  </div>
                )}
              </div>

              <hr className={isDarkMode ? 'border-gray-700' : 'border-gray-200'} />

              {/* Subtotal */}
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Subtotal (FOB)</span>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(subtotal, currency)}
                </span>
              </div>

              {/* Freight */}
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Freight</span>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(freightCost, currency)}
                </span>
              </div>

              {/* Insurance */}
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Insurance</span>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(insuranceCost, currency)}
                </span>
              </div>

              <hr className={isDarkMode ? 'border-gray-700' : 'border-gray-200'} />

              {/* CIF Value */}
              <div className="flex justify-between">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>CIF Value</span>
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(cifValue, currency)}
                </span>
              </div>

              <hr className={isDarkMode ? 'border-gray-700' : 'border-gray-200'} />

              {/* Customs Duty */}
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Customs Duty (5%)
                </span>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(customsDuty, currency)}
                </span>
              </div>

              {/* VAT */}
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  VAT (5%)
                  <span className={`ml-1 text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    (Recoverable)
                  </span>
                </span>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(vat, currency)}
                </span>
              </div>

              <hr className={`my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

              {/* Grand Total */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-teal-900/30' : 'bg-teal-50'}`}>
                <div className="flex justify-between items-center">
                  <span className={`font-semibold ${isDarkMode ? 'text-teal-300' : 'text-teal-800'}`}>
                    Grand Total
                  </span>
                  <span className={`text-xl font-bold ${isDarkMode ? 'text-teal-300' : 'text-teal-800'}`}>
                    {formatCurrency(grandTotal, currency)}
                  </span>
                </div>
                {currency !== 'AED' && (
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-sm ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                      Total in AED
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                      {formatCurrency(grandTotalAED, 'AED')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Clock size={20} className="text-teal-600" />
              Activity Timeline
            </h2>

            <div className="space-y-4">
              {statusHistory.length === 0 ? (
                <div className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No activity recorded yet</p>
                </div>
              ) : (
                statusHistory.map((entry, index) => {
                  const entryConfig = getStatusConfig(entry.status);
                  const EntryIcon = entryConfig.icon;
                  return (
                    <div key={index} className="flex gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isDarkMode ? entryConfig.bgDark : entryConfig.bgLight
                      }`}>
                        <EntryIcon size={14} className={isDarkMode ? entryConfig.textDark : entryConfig.textLight} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Status changed to {entryConfig.label}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatDate(entry.timestamp || entry.date)}
                          {entry.user && ` by ${entry.user}`}
                        </p>
                        {entry.notes && (
                          <p className={`text-xs mt-1 p-2 rounded ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Created entry */}
              {createdAt && (
                <div className="flex gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <FileText size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Order created
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(createdAt)}
                      {createdBy && ` by ${createdBy}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Notes Modal */}
      {showStatusNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-md w-full ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'}`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Update Status
                </h2>
                <button
                  onClick={() => {
                    setShowStatusNotesModal(false);
                    setPendingStatus(null);
                    setStatusUpdateNotes('');
                  }}
                  className={`p-1 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Update status to <strong>{pendingStatus && getStatusConfig(pendingStatus).label}</strong>
              </p>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Notes (optional)
              </label>
              <textarea
                value={statusUpdateNotes}
                onChange={(e) => setStatusUpdateNotes(e.target.value)}
                placeholder="Add any notes about this status change..."
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div className={`p-6 border-t flex gap-3 justify-end ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
              <button
                onClick={() => {
                  setShowStatusNotesModal(false);
                  setPendingStatus(null);
                  setStatusUpdateNotes('');
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Success/Error Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-4 rounded-lg border shadow-lg max-w-md ${
            isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="ml-2">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`p-4 rounded-lg border shadow-lg max-w-md ${
            isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span className="flex-1">{success}</span>
              <button onClick={() => setSuccess(null)} className="ml-2">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportOrderDetails;
