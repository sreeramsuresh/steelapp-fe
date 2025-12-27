import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  Fragment,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Save,
  Eye,
  Download,
  X,
  AlertTriangle,
  Info,
  ArrowLeft,
  Pin,
  Settings,
  Loader2,
  Banknote,
  List,
  CheckCircle,
  DollarSign,
  FileText,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { createInvoice, createSteelItem, UAE_EMIRATES } from '../types';
import { PAYMENT_MODES } from '../utils/paymentUtils';
import {
  calculateItemAmount,
  calculateSubtotal,
  calculateTotal,
  formatCurrency,
  formatDateForInput,
  titleCase,
  normalizeLLC,
  calculateDiscountedTRN,
} from '../utils/invoiceUtils';
import InvoicePreview from '../components/InvoicePreview';
import { invoiceService, companyService, commissionService } from '../services';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { pinnedProductsService } from '../services/pinnedProductsService';
import pricelistService from '../services/pricelistService';
import { stockBatchService } from '../services/stockBatchService';
import { invoicesAPI } from '../services/api';
import { useApiData, useApi } from '../hooks/useApi';
import useKeyboardShortcuts, {
  getShortcutDisplayString,
  INVOICE_SHORTCUTS,
} from '../hooks/useKeyboardShortcuts';
// AutoSave removed - was causing status bug on new invoices
import useDragReorder from '../hooks/useDragReorder';
import useBulkActions from '../hooks/useBulkActions';
import useInvoiceTemplates from '../hooks/useInvoiceTemplates';
import { useReducedMotion } from '../hooks/useAccessibility';
import { notificationService } from '../services/notificationService';
import LoadingOverlay from '../components/LoadingOverlay';
import SourceTypeSelector from '../components/invoice/SourceTypeSelector';
import AllocationPanel from '../components/invoice/AllocationPanel';
import AllocationDrawer from '../components/AllocationDrawer';
import { batchReservationService } from '../services/batchReservationService';
import { v4 as uuidv4 } from 'uuid';
import { FormSelect } from '@/components/ui/form-select';
import { SelectItem } from '@/components/ui/select';

// ==================== LAYOUT HELPERS (Updated: Theme-safe classes) ====================

// Layout class helpers for consistent styling (NO hardcoded colors)
const CARD_CLASSES = (isDarkMode) =>
  `${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-4`;

const DRAWER_OVERLAY_CLASSES = (isOpen) =>
  `fixed inset-0 bg-black/55 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;

const DRAWER_PANEL_CLASSES = (isDarkMode, isOpen) =>
  `fixed top-0 right-0 h-full w-[min(620px,92vw)] z-[31] ${isDarkMode ? 'bg-gray-800 border-l border-gray-700' : 'bg-white border-l border-gray-200'} overflow-auto transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`;

const QUICK_LINK_CLASSES = (isDarkMode) =>
  `flex items-center gap-2 py-2 px-2.5 w-full text-left ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-[10px] cursor-pointer text-[13px] transition-colors hover:border-teal-500 hover:text-teal-400`;

const BTN_PRIMARY_CLASSES =
  'bg-teal-600 border-transparent text-white font-extrabold hover:bg-teal-500 rounded-xl py-2.5 px-3 text-[13px] cursor-pointer';

const DIVIDER_CLASSES = (isDarkMode) =>
  `h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} my-3`;

// ==================== DRAWER COMPONENTS ====================

// Charges & Discount Drawer Component
const ChargesDrawer = ({
  isOpen,
  onClose,
  isDarkMode,
  invoice,
  setInvoice,
  formatCurrency,
  computedSubtotal,
  showFreightCharges,
  setShowFreightCharges,
  Input: InputComponent,
  Select: SelectComponent,
  VatHelpIcon: VatHelpIconComponent,
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div className={DRAWER_OVERLAY_CLASSES(isOpen)} onClick={onClose} />

      {/* Drawer Panel */}
      <div className={DRAWER_PANEL_CLASSES(isDarkMode, isOpen)}>
        <div className="p-4">
          {/* Sticky Header */}
          <div
            className={`sticky top-0 flex justify-between items-start gap-2.5 mb-3 p-4 -m-4 mb-3 z-[1] ${isDarkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'}`}
          >
            <div>
              <div className="text-sm font-extrabold">Charges & Discount</div>
              <div
                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Configure freight, loading, and discount settings
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Discount Section */}
          <div
            className={`${isDarkMode ? 'bg-[#0f151b] border-[#2a3640]' : 'bg-gray-50 border-gray-200'} border rounded-[14px] p-4 mb-4`}
          >
            <h4
              className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
            >
              Discount
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <FormSelect
                label="Discount Type"
                value={invoice.discountType || 'amount'}
                onValueChange={(value) =>
                  setInvoice((prev) => ({
                    ...prev,
                    discountType: value,
                    discountAmount: '',
                    discountPercentage: '',
                  }))
                }
              >
                <SelectItem value="amount">Fixed Amount (AED)</SelectItem>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
              </FormSelect>

              {invoice.discountType === 'percentage' ? (
                <InputComponent
                  label="Discount %"
                  type="number"
                  value={invoice.discountPercentage || ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setInvoice((prev) => ({
                        ...prev,
                        discountPercentage: '',
                      }));
                      return;
                    }
                    const num = Number(raw);
                    if (Number.isNaN(num)) return;
                    const clamped = Math.max(0, Math.min(100, num));
                    setInvoice((prev) => ({
                      ...prev,
                      discountPercentage: clamped,
                    }));
                  }}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                />
              ) : (
                <InputComponent
                  label="Discount Amount"
                  type="number"
                  value={invoice.discountAmount || ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setInvoice((prev) => ({ ...prev, discountAmount: '' }));
                      return;
                    }
                    const num = Number(raw);
                    if (Number.isNaN(num)) return;
                    const clamped = Math.max(
                      0,
                      Math.min(computedSubtotal, num),
                    );
                    setInvoice((prev) => ({
                      ...prev,
                      discountAmount: clamped,
                    }));
                  }}
                  min="0"
                  max={computedSubtotal}
                  step="0.01"
                  placeholder="0.00"
                />
              )}
            </div>
            {/* Discount Summary */}
            <div
              className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-[#2a3640]' : 'border-gray-200'}`}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                >
                  Discount Applied
                </span>
                <span
                  className={`text-sm font-bold ${isDarkMode ? 'text-[#f39c12]' : 'text-amber-600'}`}
                >
                  -
                  {formatCurrency(
                    invoice.discountType === 'percentage'
                      ? (computedSubtotal * (invoice.discountPercentage || 0)) /
                          100
                      : invoice.discountAmount || 0,
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Freight & Loading Charges Section */}
          <div
            className={`${isDarkMode ? 'bg-[#0f151b] border-[#2a3640]' : 'bg-gray-50 border-gray-200'} border rounded-[14px] p-4`}
          >
            <div className="flex justify-between items-center mb-3">
              <h4
                className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
              >
                <span>Freight & Loading Charges</span>
                <VatHelpIconComponent
                  heading="Auxiliary Charges & VAT Treatment (Article 45)"
                  content={[
                    'Add charges for services with supply: packing, freight, insurance, loading, other. These are taxable under UAE VAT Article 45.',
                    'All charges subject to 5% VAT by default. Check "Export Invoice" for zero-rated treatment.',
                  ]}
                />
              </h4>
              <button
                type="button"
                onClick={() => setShowFreightCharges(!showFreightCharges)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  showFreightCharges
                    ? isDarkMode
                      ? 'bg-teal-600 text-white'
                      : 'bg-teal-500 text-white'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {showFreightCharges ? 'ON' : 'OFF'}
              </button>
            </div>

            {showFreightCharges && (
              <>
                {/* Export Toggle */}
                <label
                  className={`flex items-center gap-2 cursor-pointer mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  <input
                    type="checkbox"
                    checked={invoice.isExport || false}
                    onChange={(e) => {
                      const isExport = e.target.checked;
                      setInvoice((prev) => ({
                        ...prev,
                        isExport,
                        packingChargesVat: isExport
                          ? 0
                          : (parseFloat(prev.packingCharges) || 0) * 0.05,
                        freightChargesVat: isExport
                          ? 0
                          : (parseFloat(prev.freightCharges) || 0) * 0.05,
                        insuranceChargesVat: isExport
                          ? 0
                          : (parseFloat(prev.insuranceCharges) || 0) * 0.05,
                        loadingChargesVat: isExport
                          ? 0
                          : (parseFloat(prev.loadingCharges) || 0) * 0.05,
                        otherChargesVat: isExport
                          ? 0
                          : (parseFloat(prev.otherCharges) || 0) * 0.05,
                      }));
                    }}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium">
                    Export Invoice (0% VAT)
                  </span>
                </label>

                {/* Charge Fields Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Packing */}
                  <div>
                    <InputComponent
                      label="Packing"
                      type="number"
                      value={invoice.packingCharges || ''}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const vat = invoice.isExport ? 0 : amount * 0.05;
                        setInvoice((prev) => ({
                          ...prev,
                          packingCharges: amount,
                          packingChargesVat: vat,
                        }));
                      }}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <div
                      className={`text-xs mt-1 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                    >
                      VAT: {formatCurrency(invoice.packingChargesVat || 0)}
                    </div>
                  </div>

                  {/* Freight */}
                  <div>
                    <InputComponent
                      label="Freight"
                      type="number"
                      value={invoice.freightCharges || ''}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const vat = invoice.isExport ? 0 : amount * 0.05;
                        setInvoice((prev) => ({
                          ...prev,
                          freightCharges: amount,
                          freightChargesVat: vat,
                        }));
                      }}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <div
                      className={`text-xs mt-1 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                    >
                      VAT: {formatCurrency(invoice.freightChargesVat || 0)}
                    </div>
                  </div>

                  {/* Insurance */}
                  <div>
                    <InputComponent
                      label="Insurance"
                      type="number"
                      value={invoice.insuranceCharges || ''}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const vat = invoice.isExport ? 0 : amount * 0.05;
                        setInvoice((prev) => ({
                          ...prev,
                          insuranceCharges: amount,
                          insuranceChargesVat: vat,
                        }));
                      }}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <div
                      className={`text-xs mt-1 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                    >
                      VAT: {formatCurrency(invoice.insuranceChargesVat || 0)}
                    </div>
                  </div>

                  {/* Loading */}
                  <div>
                    <InputComponent
                      label="Loading"
                      type="number"
                      value={invoice.loadingCharges || ''}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const vat = invoice.isExport ? 0 : amount * 0.05;
                        setInvoice((prev) => ({
                          ...prev,
                          loadingCharges: amount,
                          loadingChargesVat: vat,
                        }));
                      }}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <div
                      className={`text-xs mt-1 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                    >
                      VAT: {formatCurrency(invoice.loadingChargesVat || 0)}
                    </div>
                  </div>

                  {/* Other */}
                  <div className="col-span-2">
                    <InputComponent
                      label="Other Charges"
                      type="number"
                      value={invoice.otherCharges || ''}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const vat = invoice.isExport ? 0 : amount * 0.05;
                        setInvoice((prev) => ({
                          ...prev,
                          otherCharges: amount,
                          otherChargesVat: vat,
                        }));
                      }}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <div
                      className={`text-xs mt-1 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                    >
                      VAT: {formatCurrency(invoice.otherChargesVat || 0)}
                    </div>
                  </div>
                </div>

                {/* Total Charges Summary */}
                <div
                  className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-[#2a3640]' : 'border-gray-200'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                    >
                      Total Charges
                    </span>
                    <span
                      className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {formatCurrency(
                        (invoice.packingCharges || 0) +
                          (invoice.freightCharges || 0) +
                          (invoice.insuranceCharges || 0) +
                          (invoice.loadingCharges || 0) +
                          (invoice.otherCharges || 0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
                    >
                      Total Charges VAT
                    </span>
                    <span
                      className={`text-sm font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}
                    >
                      {formatCurrency(
                        (invoice.packingChargesVat || 0) +
                          (invoice.freightChargesVat || 0) +
                          (invoice.insuranceChargesVat || 0) +
                          (invoice.loadingChargesVat || 0) +
                          (invoice.otherChargesVat || 0),
                      )}
                    </span>
                  </div>
                  {invoice.isExport && (
                    <div className="text-xs text-amber-500 mt-2">
                      Zero-rated for export
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sticky Footer */}
          <div
            className="sticky bottom-0 pt-4 mt-4"
            style={{
              background: isDarkMode
                ? 'linear-gradient(to top, rgba(20,26,32,1) 70%, rgba(20,26,32,0))'
                : 'linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))',
            }}
          >
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-[#0f151b] border border-[#2a3640] text-[#e6edf3] hover:border-[#4aa3ff]'
                    : 'bg-white border border-gray-300 text-gray-900 hover:border-blue-500'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Notes & Terms Drawer Component
const NotesDrawer = ({
  isOpen,
  onClose,
  isDarkMode,
  invoice,
  setInvoice,
  Textarea: TextareaComponent,
  VatHelpIcon: VatHelpIconComponent,
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div className={DRAWER_OVERLAY_CLASSES(isOpen)} onClick={onClose} />

      {/* Drawer Panel */}
      <div className={DRAWER_PANEL_CLASSES(isDarkMode, isOpen)}>
        <div className="p-4">
          {/* Sticky Header */}
          <div
            className={`sticky top-0 flex justify-between items-start gap-2.5 mb-3 p-4 -m-4 mb-3 z-[1] ${isDarkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'}`}
          >
            <div>
              <div className="text-sm font-extrabold">Notes & Terms</div>
              <div
                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Add invoice notes, VAT notes, and payment terms
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Invoice Notes */}
          <div
            className={`${isDarkMode ? 'bg-[#0f151b] border-[#2a3640]' : 'bg-gray-50 border-gray-200'} border rounded-[14px] p-4 mb-4`}
          >
            <h4
              className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
            >
              Invoice Notes
            </h4>
            <TextareaComponent
              value={invoice.notes || ''}
              onChange={(e) =>
                setInvoice((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Additional notes for the customer..."
              autoGrow={true}
              rows={3}
            />
          </div>

          {/* VAT Tax Notes */}
          <div
            className={`${isDarkMode ? 'bg-[#0f151b] border-[#2a3640]' : 'bg-gray-50 border-gray-200'} border rounded-[14px] p-4 mb-4`}
          >
            <h4
              className={`text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
            >
              <span>VAT Tax Notes</span>
              <VatHelpIconComponent
                content={[
                  'Required if supply is zero-rated or reverse charge applies.',
                  'Must explain reason for 0% VAT treatment.',
                  'Part of FTA Form 201 compliance documentation.',
                ]}
              />
            </h4>
            <TextareaComponent
              value={invoice.taxNotes || ''}
              onChange={(e) =>
                setInvoice((prev) => ({ ...prev, taxNotes: e.target.value }))
              }
              placeholder="Explanation for zero-rated or exempt supplies (FTA requirement)..."
              autoGrow={true}
              rows={2}
            />
            <p
              className={`text-xs mt-2 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
            >
              Required when items are zero-rated or exempt from VAT
            </p>
          </div>

          {/* Payment Terms & Conditions */}
          <div
            className={`${isDarkMode ? 'bg-[#0f151b] border-[#2a3640]' : 'bg-gray-50 border-gray-200'} border rounded-[14px] p-4`}
          >
            <h4
              className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDarkMode ? 'text-[#93a4b4]' : 'text-gray-500'}`}
            >
              Payment Terms & Conditions
            </h4>
            <TextareaComponent
              value={invoice.terms || ''}
              onChange={(e) =>
                setInvoice((prev) => ({ ...prev, terms: e.target.value }))
              }
              placeholder="Enter payment terms and conditions..."
              autoGrow={true}
              rows={3}
            />
          </div>

          {/* Sticky Footer */}
          <div
            className="sticky bottom-0 pt-4 mt-4"
            style={{
              background: isDarkMode
                ? 'linear-gradient(to top, rgba(20,26,32,1) 70%, rgba(20,26,32,0))'
                : 'linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))',
            }}
          >
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-[#0f151b] border border-[#2a3640] text-[#e6edf3] hover:border-[#4aa3ff]'
                    : 'bg-white border border-gray-300 text-gray-900 hover:border-blue-500'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Add Product Drawer Component
const AddProductDrawer = ({
  isOpen,
  onClose,
  isDarkMode,
  draftInvoiceId,
  warehouseId,
  companyId,
  onAddLineItem,
  customerId = null, // NEW - for pricing
  priceListId = null, // NEW - for pricing
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div className={DRAWER_OVERLAY_CLASSES(isOpen)} onClick={onClose} />

      {/* Drawer Panel */}
      <div className={DRAWER_PANEL_CLASSES(isDarkMode, isOpen)}>
        <div className="p-4">
          {/* Sticky Header */}
          <div
            className={`sticky top-0 flex justify-between items-start gap-2.5 mb-3 p-4 -m-4 mb-3 z-[1] ${isDarkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'}`}
          >
            <div>
              <div className="text-sm font-extrabold">Add Product Line</div>
              <div
                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Search products, allocate batches, and add to invoice
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* AllocationDrawer Content */}
          <AllocationDrawer
            draftInvoiceId={draftInvoiceId}
            warehouseId={warehouseId}
            companyId={companyId}
            customerId={customerId} // NEW - pass through for pricing
            priceListId={priceListId} // NEW - pass through for pricing
            onAddLineItem={(lineItem) => {
              onAddLineItem(lineItem);
              onClose();
            }}
            onCancel={onClose}
            visible={true}
          />
        </div>
      </div>
    </>
  );
};

// Custom Tailwind Components
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const getVariantClasses = () => {
    if (variant === 'primary') {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:${
        isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
      } disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-${
        isDarkMode ? 'gray-800' : 'white'
      }`;
    } else if (variant === 'secondary') {
      return `${
        isDarkMode
          ? 'bg-gray-700 hover:bg-gray-600'
          : 'bg-gray-200 hover:bg-gray-300'
      } ${isDarkMode ? 'text-white' : 'text-gray-800'} focus:ring-${
        isDarkMode ? 'gray-500' : 'gray-400'
      } disabled:${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
      } focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    } else {
      // outline
      return `border ${
        isDarkMode
          ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
          : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
      } focus:ring-teal-500 disabled:${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
      } focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    }
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-sm',
  };

  return (
    <button
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${
        disabled ? 'cursor-not-allowed' : ''
      } ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({
  label,
  error,
  className = '',
  required = false,
  validationState = null,
  showValidation = true,
  id,
  'data-testid': dataTestId,
  ...props
}) => {
  const { isDarkMode } = useTheme();
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Determine border and background color based on validation state
  const getValidationClasses = () => {
    // If validation highlighting is disabled, show default styles
    if (!showValidation) {
      return isDarkMode
        ? 'border-gray-600 bg-gray-800'
        : 'border-gray-300 bg-white';
    }

    if (error || validationState === 'invalid') {
      return isDarkMode
        ? 'border-red-500 bg-red-900/10'
        : 'border-red-500 bg-red-50';
    }
    if (validationState === 'valid') {
      return isDarkMode
        ? 'border-green-500 bg-green-900/10'
        : 'border-green-500 bg-green-50';
    }
    if (required && validationState === null) {
      // Untouched required field - show subtle indication
      return isDarkMode
        ? 'border-yellow-600/50 bg-yellow-900/5'
        : 'border-yellow-400/50 bg-yellow-50/30';
    }
    return isDarkMode
      ? 'border-gray-600 bg-gray-800'
      : 'border-gray-300 bg-white';
  };

  return (
    <div className="space-y-0.5">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-xs font-medium ${
            isDarkMode ? 'text-gray-400' : 'text-gray-700'
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        data-testid={dataTestId}
        className={`w-full px-2 py-2 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 h-[38px] ${
          isDarkMode
            ? 'text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500'
            : 'text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
        } ${getValidationClasses()} ${className}`}
        {...props}
      />
      {error && (
        <p
          className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Custom Select component removed - now using FormSelect from @/components/ui/form-select

const Textarea = ({
  label,
  error,
  className = '',
  autoGrow = false,
  id,
  ...props
}) => {
  const { isDarkMode } = useTheme();
  const textareaRef = useRef(null);
  const textareaId =
    id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea && autoGrow) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set the height to match content, with a minimum of one line
      textarea.style.height = `${Math.max(textarea.scrollHeight, 44)}px`;
    }
  }, [autoGrow]);

  useEffect(() => {
    adjustHeight();
  }, [props.value, adjustHeight]);

  const handleChange = (e) => {
    if (props.onChange) {
      props.onChange(e);
    }
    adjustHeight();
  };

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={textareaId}
          className={`block text-sm font-medium ${
            isDarkMode ? 'text-gray-400' : 'text-gray-700'
          }`}
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={textareaRef}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:-translate-y-0.5 transition-all duration-300 resize-none ${
          isDarkMode
            ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500'
            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
        } ${error ? 'border-red-500' : ''} ${autoGrow ? 'overflow-hidden' : ''} ${className}`}
        {...props}
        onChange={handleChange}
        rows={autoGrow ? 1 : props.rows}
      />
      {error && (
        <p
          className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
        >
          {error}
        </p>
      )}
    </div>
  );
};

const Card = ({ children, className = '' }) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${
        isDarkMode
          ? 'bg-gray-800 border border-gray-600'
          : 'bg-white border border-gray-200'
      } ${className}`}
    >
      {children}
    </div>
  );
};

const Alert = ({ variant = 'info', children, onClose, className = '' }) => {
  const { isDarkMode } = useTheme();

  const getVariantClasses = () => {
    const darkVariants = {
      info: 'bg-blue-900/20 border-blue-500/30 text-blue-300',
      warning: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300',
      error: 'bg-red-900/20 border-red-500/30 text-red-300',
      success: 'bg-green-900/20 border-green-500/30 text-green-300',
    };

    const lightVariants = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      success: 'bg-green-50 border-green-200 text-green-800',
    };

    return isDarkMode ? darkVariants[variant] : lightVariants[variant];
  };

  return (
    <div
      className={`border rounded-lg p-4 ${getVariantClasses()} ${className}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {variant === 'warning' && <AlertTriangle className="h-5 w-5" />}
          {variant === 'info' && <Info className="h-5 w-5" />}
        </div>
        <div className="ml-3 flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 flex-shrink-0 ${
              isDarkMode
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// VAT Compliance Help Icon Component
const VatHelpIcon = ({ content, heading }) => {
  const [showModal, setShowModal] = useState(false);
  const { isDarkMode } = useTheme();

  const handleCloseModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center ml-1 p-1 transition-colors"
        title="Click for help"
      >
        <Info className="w-4 h-4 text-teal-600 dark:text-teal-400" />
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto"
          onClick={handleCloseModal}
          role="button"
          tabIndex={-1}
          onKeyDown={(e) => e.key === 'Escape' && handleCloseModal()}
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-xl mx-4 shadow-xl relative my-8`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={handleCloseModal}
              className={`absolute top-4 right-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              <X className="w-4 h-4" />
            </button>
            {heading && (
              <h2
                className={`text-sm font-bold mb-4 pr-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
              >
                {heading}
              </h2>
            )}
            <div
              className={`space-y-4 pr-4 normal-case ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              {Array.isArray(content) ? (
                content.map((paragraph, idx) => (
                  <p
                    key={idx}
                    className={`text-xs leading-relaxed normal-case ${idx === 0 ? 'font-semibold' : ''}`}
                  >
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-xs leading-relaxed normal-case">{content}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Autocomplete = ({
  options = [],
  value: _value,
  onChange,
  onInputChange,
  inputValue,
  placeholder,
  label,
  disabled = false,
  renderOption,
  noOptionsText = 'No options',
  className = '',
  title,
  error,
  required = false,
  validationState = null,
  showValidation = true,
  'data-testid': dataTestId,
}) => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredOptions]);

  // Lightweight fuzzy match: token-based includes with typo tolerance (edit distance <= 1)
  const norm = (s) => (s || '').toString().toLowerCase().trim();
  const ed1 = (a, b) => {
    // Early exits
    if (a === b) return 0;
    const la = a.length,
      lb = b.length;
    if (Math.abs(la - lb) > 1) return 2; // too far
    // DP edit distance capped at 1 for speed
    let dpPrev = new Array(lb + 1);
    let dpCurr = new Array(lb + 1);
    for (let j = 0; j <= lb; j++) dpPrev[j] = j;
    for (let i = 1; i <= la; i++) {
      dpCurr[0] = i;
      const ca = a.charCodeAt(i - 1);
      for (let j = 1; j <= lb; j++) {
        const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        dpCurr[j] = Math.min(
          dpPrev[j] + 1, // deletion
          dpCurr[j - 1] + 1, // insertion
          dpPrev[j - 1] + cost, // substitution
        );
        // Early cut: if all >1 can break (skip for simplicity)
      }
      // swap
      const tmp = dpPrev;
      dpPrev = dpCurr;
      dpCurr = tmp;
    }
    return dpPrev[lb];
  };

  const tokenMatch = useCallback((token, optLabel) => {
    const t = norm(token);
    const l = norm(optLabel);
    if (!t) return true;
    if (l.includes(t)) return true;
    // fuzzy: split label into words and check any word within edit distance 1
    const words = l.split(/\s+/);
    for (const w of words) {
      if (Math.abs(w.length - t.length) <= 1 && ed1(w, t) <= 1) return true;
    }
    return false;
  }, []);

  const fuzzyFilter = useCallback(
    (opts, query) => {
      const q = norm(query);
      if (!q) return opts;
      const tokens = q.split(/\s+/).filter(Boolean);
      const scored = [];
      for (const o of opts) {
        const optLabel = norm(o.label || o.name || '');
        if (!optLabel) continue;
        let ok = true;
        let score = 0;
        for (const t of tokens) {
          if (!tokenMatch(t, optLabel)) {
            ok = false;
            break;
          }
          // basic score: shorter distance preferred
          const idx = optLabel.indexOf(norm(t));
          score += idx >= 0 ? 0 : 1; // penalize fuzzy matches
        }
        if (ok) scored.push({ o, score });
      }
      scored.sort((a, b) => a.score - b.score);
      return scored.map((s) => s.o);
    },
    [tokenMatch],
  );

  useEffect(() => {
    if (inputValue) {
      const filtered = fuzzyFilter(options, inputValue);
      setFilteredOptions(filtered.slice(0, 20));
    } else {
      setFilteredOptions(options);
    }
  }, [options, inputValue, fuzzyFilter]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onInputChange?.(e, newValue);
    setIsOpen(true);
  };

  const handleOptionSelect = (option) => {
    onChange?.(null, option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredOptions.length
        ) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const updateDropdownPosition = useCallback(() => {
    if (dropdownRef.current && inputRef.current && isOpen) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;

      dropdown.style.position = 'fixed';
      dropdown.style.top = `${inputRect.bottom + 4}px`;
      dropdown.style.left = `${inputRect.left}px`;
      // Make dropdown at least as wide as the input, but allow it to grow to fit contents
      dropdown.style.minWidth = `${inputRect.width}px`;
      dropdown.style.width = 'auto';
      dropdown.style.maxWidth = '90vw';
      dropdown.style.zIndex = '9999';
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  return (
    <div className="relative">
      <div ref={inputRef}>
        <Input
          label={label}
          value={inputValue || ''}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          title={title}
          error={error}
          required={required}
          validationState={validationState}
          showValidation={showValidation}
          data-testid={dataTestId}
        />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          data-testid={dataTestId ? `${dataTestId}-listbox` : undefined}
          role="listbox"
          className={`border rounded-lg shadow-xl max-h-60 overflow-auto ${
            isDarkMode
              ? 'bg-gray-800 border-gray-600'
              : 'bg-white border-gray-200'
          }`}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.id || index}
                data-testid={
                  dataTestId ? `${dataTestId}-option-${index}` : undefined
                }
                className={`px-3 py-2 cursor-pointer border-b last:border-b-0 ${
                  index === highlightedIndex
                    ? isDarkMode
                      ? 'bg-teal-700 text-white border-gray-700'
                      : 'bg-teal-100 text-gray-900 border-gray-100'
                    : isDarkMode
                      ? 'hover:bg-gray-700 text-white border-gray-700'
                      : 'hover:bg-gray-50 text-gray-900 border-gray-100'
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleOptionSelect(option);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {renderOption ? (
                  renderOption(option)
                ) : (
                  <div>
                    <div className="font-medium">{option.name}</div>
                    {option.subtitle && (
                      <div
                        className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        {option.subtitle}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div
              className={`px-3 py-2 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {noOptionsText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const _Modal = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity"
          onClick={onClose}
          role="button"
          tabIndex={-1}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        >
          <div
            className={`absolute inset-0 ${
              isDarkMode ? 'bg-gray-900' : 'bg-black'
            } opacity-75`}
          ></div>
        </div>

        <div
          className={`inline-block align-bottom border rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${
            sizes[size]
          } sm:w-full sm:p-6 ${
            isDarkMode
              ? 'bg-gray-800 border-gray-600'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-lg font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {title}
            </h3>
            <button
              onClick={onClose}
              className={
                isDarkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner = ({ size = 'md' }) => {
  const { isDarkMode } = useTheme();
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-t-blue-600 ${
        sizes[size]
      } ${isDarkMode ? 'border-gray-300' : 'border-gray-200'}`}
    ></div>
  );
};

// Form Settings Panel Component
const FormSettingsPanel = ({
  isOpen,
  onClose,
  preferences,
  onPreferenceChange,
}) => {
  const { isDarkMode } = useTheme();
  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1 pr-4">
        <p
          className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
        >
          {label}
        </p>
        <p
          className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          {description}
        </p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
          enabled ? 'bg-teal-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div
      ref={panelRef}
      className={`absolute right-0 top-12 w-80 rounded-lg shadow-lg border z-50 ${
        isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
      >
        <div className="flex items-center justify-between">
          <h3
            className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
          >
            Form Settings
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="px-4 py-2 divide-y divide-gray-200 dark:divide-gray-700">
        <ToggleSwitch
          enabled={preferences.showValidationHighlighting}
          onChange={() =>
            onPreferenceChange(
              'showValidationHighlighting',
              !preferences.showValidationHighlighting,
            )
          }
          label="Field Validation Highlighting"
          description="Show red/green borders for invalid/valid fields"
        />
        <ToggleSwitch
          enabled={preferences.showSpeedButtons}
          onChange={() =>
            onPreferenceChange(
              'showSpeedButtons',
              !preferences.showSpeedButtons,
            )
          }
          label="Quick Add Speed Buttons"
          description="Show pinned & top products for quick adding"
        />
      </div>

      {/* Footer note */}
      <div
        className={`px-4 py-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
      >
        Settings are saved automatically
      </div>
    </div>
  );
};

// ==================== LINE ITEMS TABLE COMPONENT ====================
const LineItemsTable = ({
  items,
  isDarkMode,
  onQuantityChange,
  onRateChange,
  onDescriptionChange,
  onRemove,
  onAllocate,
  formatCurrency,
}) => {
  const getAllocationStatus = (item) => {
    const required = item.quantity || 0;
    const allocated = (item.allocations || []).reduce(
      (sum, alloc) => sum + (parseFloat(alloc.quantity) || 0),
      0,
    );

    if (required === 0)
      return { cls: 'warn', label: 'No qty', text: 'Set qty' };
    if (allocated === 0)
      return { cls: 'warn', label: 'Not allocated', text: `0/${required}` };
    if (allocated < required)
      return {
        cls: 'warn',
        label: 'Partial',
        text: `${allocated}/${required}`,
      };
    if (allocated === required)
      return { cls: 'ok', label: 'Allocated', text: `${required}/${required}` };
    return { cls: 'bad', label: 'Over', text: `${allocated}/${required}` };
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr
            className={
              isDarkMode
                ? 'border-b border-gray-700'
                : 'border-b border-gray-200'
            }
          >
            <th
              className={`text-left px-3 py-2 text-xs font-extrabold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Description
            </th>
            <th
              className={`text-right px-3 py-2 text-xs font-extrabold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              style={{ width: '110px' }}
            >
              Qty
            </th>
            <th
              className={`text-right px-3 py-2 text-xs font-extrabold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              style={{ width: '140px' }}
            >
              Rate
            </th>
            <th
              className={`text-right px-3 py-2 text-xs font-extrabold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              style={{ width: '150px' }}
            >
              Amount
            </th>
            <th
              className={`text-left px-3 py-2 text-xs font-extrabold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              style={{ width: '220px' }}
            >
              Allocation
            </th>
            <th style={{ width: '92px' }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const amount = (item.quantity || 0) * (item.rate || 0);
            const status = getAllocationStatus(item);

            return (
              <tr
                key={index}
                className={
                  isDarkMode
                    ? 'border-b border-gray-700'
                    : 'border-b border-gray-200'
                }
              >
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.name || ''}
                    onChange={(e) => onDescriptionChange(index, e.target.value)}
                    className={`w-full ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl py-2.5 px-3 text-[13px] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20`}
                    placeholder="Product description"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) =>
                      onQuantityChange(index, parseFloat(e.target.value) || 0)
                    }
                    className={`w-full text-right ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl py-2.5 px-3 text-[13px] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20`}
                    inputMode="numeric"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    value={item.rate || ''}
                    onChange={(e) =>
                      onRateChange(index, parseFloat(e.target.value) || 0)
                    }
                    className={`w-full text-right ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl py-2.5 px-3 text-[13px] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20`}
                    inputMode="decimal"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <span
                    className={`font-mono text-[13px] ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
                  >
                    {formatCurrency(amount)}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border ${
                        status.cls === 'ok'
                          ? 'border-green-500/35 text-green-400'
                          : status.cls === 'warn'
                            ? 'border-yellow-500/35 text-yellow-400'
                            : 'border-red-500/35 text-red-400'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      {status.label}{' '}
                      <span className="font-mono">({status.text})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onAllocate(index)}
                      className={`px-2.5 py-1 text-xs rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-900 hover:border-teal-500' : 'border-gray-300 bg-white hover:border-teal-500'} transition-colors`}
                    >
                      Allocate
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className={`px-2.5 py-1 text-xs rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-900 hover:border-red-500 hover:text-red-400' : 'border-gray-300 bg-white hover:border-red-500 hover:text-red-600'} transition-colors`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const InvoiceForm = ({ onSave }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Helper function to generate auto-concatenated product name
  const _generateProductName = useCallback((item) => {
    const parts = [];
    // Commodity is not available in steel item, we'll use a default "SS" if not set
    // Category/Product Type
    if (item.productType) parts.push(item.productType);
    // Grade (clean, no prefix)
    if (item.grade) {
      const g = String(item.grade)
        .trim()
        .replace(/^(gr|ss)\s*/i, '')
        .toUpperCase();
      parts.push(g);
    }
    // Finish
    if (item.finish) parts.push(item.finish);
    // Size (add " for pipes/tubes)
    const isPipeOrTube = /pipe|tube/i.test(item.productType || '');
    if (item.size) {
      parts.push(isPipeOrTube ? `${item.size}"` : item.size);
    }
    // Thickness
    if (item.thickness) parts.push(item.thickness);
    return parts.join(' ');
  }, []);

  // Debounce timeout refs for charges fields
  const _chargesTimeout = useRef(null);

  // Field refs for scroll-to-field functionality (Option C Hybrid UX)
  const customerRef = useRef(null);
  const dateRef = useRef(null);
  const dueDateRef = useRef(null);
  const itemsRef = useRef(null);

  // Additional refs for auto-focus navigation through mandatory fields
  const paymentModeRef = useRef(null);
  const addItemButtonRef = useRef(null);
  const saveButtonRef = useRef(null);

  // Scroll to field function - maps error field names to refs
  const scrollToField = useCallback((fieldName) => {
    let targetRef = null;
    let targetElement = null;

    // Map field names to refs
    if (fieldName === 'customer.name' || fieldName === 'customer') {
      targetRef = customerRef;
    } else if (fieldName === 'date') {
      targetRef = dateRef;
    } else if (fieldName === 'dueDate') {
      targetRef = dueDateRef;
    } else if (fieldName.startsWith('item.')) {
      // Extract item index: 'item.0.rate' -> 0
      const match = fieldName.match(/item\.(\d+)\./);
      if (match) {
        const itemIndex = parseInt(match[1], 10);
        // Try to find the line item element by index
        targetElement = document.querySelector(
          `[data-item-index="${itemIndex}"]`,
        );
      }
      if (!targetElement) {
        targetRef = itemsRef; // Fallback to items section
      }
    }

    // Scroll to the target
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the element briefly
      targetElement.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
      setTimeout(() => {
        targetElement.classList.remove(
          'ring-2',
          'ring-red-500',
          'ring-offset-2',
        );
      }, 2000);
    } else if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the element briefly
      targetRef.current.classList.add(
        'ring-2',
        'ring-red-500',
        'ring-offset-2',
      );
      setTimeout(() => {
        targetRef.current.classList.remove(
          'ring-2',
          'ring-red-500',
          'ring-offset-2',
        );
      }, 2000);
    }

    // Clear validation errors after scrolling (user is addressing them)
    // Don't clear - let user fix and re-save
  }, []);

  const [showPreview, setShowPreview] = useState(false);
  const [_isFormValidForSave, setIsFormValidForSave] = useState(true);
  const [_isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [_pdfButtonHighlight, setPdfButtonHighlight] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Removed unused state: selectedProductForRow, setSelectedProductForRow
  const [searchInputs, setSearchInputs] = useState({});
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [tradeLicenseStatus, setTradeLicenseStatus] = useState(null);
  const [showTradeLicenseAlert, setShowTradeLicenseAlert] = useState(false);

  // Save confirmation for Final Tax Invoice (new invoices only)
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);

  // Success modal after creating invoice
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState(null);

  // Phase 4: Auto drop-ship and partial allocation suggestion modals
  // Removed popup modals - replaced with inline SourceTypeSelector dropdown

  // Form preferences state (with localStorage persistence)
  const [showFormSettings, setShowFormSettings] = useState(false);
  const [showFreightCharges, setShowFreightCharges] = useState(false);

  // Phase 1.1 UX Refactoring: Drawer states for secondary content
  const [showChargesDrawer, setShowChargesDrawer] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [showAddProductDrawer, setShowAddProductDrawer] = useState(false);

  const [formPreferences, setFormPreferences] = useState(() => {
    const saved = localStorage.getItem('invoiceFormPreferences');
    return saved
      ? JSON.parse(saved)
      : {
        showValidationHighlighting: true,
        showSpeedButtons: true,
      };
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      'invoiceFormPreferences',
      JSON.stringify(formPreferences),
    );
  }, [formPreferences]);

  // ============================================================
  // PHASE 1 UI IMPROVEMENTS: Keyboard Shortcuts & Auto-Save
  // ============================================================

  // Draft recovery removed - autosave was causing status bug

  // Form validation state
  const [validationErrors, setValidationErrors] = useState([]);
  const [invalidFields, setInvalidFields] = useState(new Set());

  // Item allocations state (for reallocation modal updates)
  const [_itemAllocations, setItemAllocations] = useState({});

  // Phase 3: AllocationDrawer integration - 60/40 layout mode
  // When true, shows the new drawer-based line item entry UI
  const [useDrawerMode] = useState(true); // Set to true to enable new drawer mode

  // Real-time field validation states (null = untouched, 'valid' = valid, 'invalid' = invalid)
  const [fieldValidation, setFieldValidation] = useState({});

  // Helper to enforce invoice number prefix by status
  const withStatusPrefix = (num, status) => {
    const desired =
      status === 'draft' ? 'DFT' : status === 'proforma' ? 'PFM' : 'INV';

    if (!num || typeof num !== 'string') {
      // Generate the base number format YYYYMM-NNNN from backend API
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      return `${desired}-${year}${month}-0001`;
    }

    // Handle numbers that already have the correct format: PREFIX-YYYYMM-NNNN
    const formatMatch = num.match(/^(DFT|PFM|INV)-(\d{6}-\d{4})$/);
    if (formatMatch) {
      // Replace the prefix but keep the YYYYMM-NNNN part
      return `${desired}-${formatMatch[2]}`;
    }

    // Handle legacy format or partial numbers - try to extract meaningful parts
    const parts = num.split('-');
    if (parts.length >= 2) {
      // If it looks like YYYYMM-NNNN format, use it
      const datePart = parts[parts.length - 2];
      const numberPart = parts[parts.length - 1];
      if (/^\d{6}$/.test(datePart) && /^\d{4}$/.test(numberPart)) {
        return `${desired}-${datePart}-${numberPart}`;
      }
    }

    // Fallback: generate new format
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${desired}-${year}${month}-0001`;
  };

  /**
   * ⚠️ INVOICE STATUS TRANSITION RULES ⚠️
   *
   * ALLOWED TRANSITIONS:
   * - draft → proforma (convert draft to quote)
   * - draft → issued (direct finalization - issue tax invoice)
   * - proforma → issued (convert quote to final tax invoice after sale completion)
   *
   * FORBIDDEN TRANSITIONS:
   * - issued → draft (cannot un-finalize)
   * - issued → proforma (cannot un-finalize)
   * - Any backward movement from issued status
   *
   * INVENTORY IMPACT BY STATUS:
   * - draft: NO inventory impact (work in progress)
   * - proforma: NO inventory impact (quote only, no commitment)
   * - issued (Final Tax Invoice): YES - inventory deducted, revenue recorded
   *
   * Backend should enforce inventory deduction ONLY when status changes to 'issued'
   */
  const [invoice, setInvoice] = useState(() => {
    const newInvoice = createInvoice();
    // Invoice number will be auto-generated by the database on save
    newInvoice.invoiceNumber = '(Auto-assigned on save)';
    // Default status to 'draft'
    newInvoice.status = 'draft';
    // Start with one empty item row
    newInvoice.items = [createSteelItem()];
    return newInvoice;
  });

  // Validate individual field in real-time
  const validateField = useCallback(
    (fieldName, value) => {
      let isValid = false;

      switch (fieldName) {
        case 'customer':
          isValid = value && value.id && value.name;
          break;
        case 'dueDate':
          isValid = value && value.trim() !== '';
          break;
        case 'status':
          isValid = value && ['draft', 'proforma', 'issued'].includes(value);
          break;
        case 'paymentMode':
          isValid = value && value.trim() !== '';
          break;
        case 'warehouse': {
          // Warehouse is optional for drafts, required for issued/proforma
          const invoiceStatus = invoice?.status || 'draft';
          if (invoiceStatus === 'draft') {
            isValid = true; // Optional for drafts
          } else {
            isValid = value && String(value).trim() !== '';
          }
          break;
        }
        case 'currency':
          isValid = value && value.trim() !== '';
          break;
        case 'placeOfSupply':
          isValid = value && value.trim() !== '';
          break;
        case 'supplyDate':
          isValid = value && value.trim() !== '';
          break;
        case 'items':
          isValid =
            Array.isArray(value) &&
            value.length > 0 &&
            value.every(
              (item) => item.name && item.quantity > 0 && item.rate > 0,
            );
          break;
        default:
          isValid = true;
      }

      setFieldValidation((prev) => ({
        ...prev,
        [fieldName]: isValid ? 'valid' : 'invalid',
      }));

      return isValid;
    },
    [invoice?.status],
  );

  // Track if form has unsaved changes (for navigation warning)
  const [_formDirty, setFormDirty] = useState(false);
  // Removed unused states: showExitConfirmModal, setShowExitConfirmModal, pendingNavigation, setPendingNavigation

  // Track the ORIGINAL saved status for isLocked calculation
  // This prevents the locked banner from showing when just changing the dropdown
  const [originalSavedStatus, setOriginalSavedStatus] = useState(null);

  // Phase 4: Store saved batch consumptions separately from draft allocations
  // This prevents overwriting user edits when loading existing invoice data
  const [savedConsumptionsByItemId, setSavedConsumptionsByItemId] = useState({});
  const [_consumptionsFetched, setConsumptionsFetched] = useState(false);

  // Mark form as dirty whenever invoice changes (except initial load)
  const initialLoadRef = useRef(true);
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    // Only mark dirty for new invoices or if editing and changes were made
    if (!id || invoice) {
      setFormDirty(true);
    }
  }, [invoice, id]);

  // Reset dirty flag when invoice is saved successfully
  useEffect(() => {
    if (createdInvoiceId) {
      setFormDirty(false);
    }
  }, [createdInvoiceId]);

  // Warn before browser close/refresh if there are unsaved changes
  // DISABLED FOR TESTING - Re-enable before deployment
  // useEffect(() => {
  //   const handleBeforeUnload = (e) => {
  //     if (formDirty) {
  //       e.preventDefault();
  //       e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
  //       return e.returnValue;
  //     }
  //   };
  //   window.addEventListener('beforeunload', handleBeforeUnload);
  //   return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  // }, [formDirty]);

  // UAE VAT COMPLIANCE: Check if invoice is locked
  // Issued invoices can be edited within 24 hours of issuance (creates revision)
  // After 24 hours, invoice is permanently locked
  // IMPORTANT: New invoices (no id) are NEVER locked, even if status is 'issued'
  // IMPORTANT: Use originalSavedStatus (not current form status) to prevent
  //            the locked banner from showing when user changes status dropdown
  const isLocked = useMemo(() => {
    // NEW INVOICES ARE NEVER LOCKED - they haven't been saved yet
    // The 'id' parameter from useParams() is only present when editing an existing invoice
    if (!id) return false;

    // Use the ORIGINAL saved status, not the current form state
    // This prevents locked banner from appearing when converting draft to final
    // The banner should only show for invoices that were ALREADY saved as 'issued'
    if (originalSavedStatus !== 'issued') return false;

    // Check 24-hour edit window
    const issuedAt = invoice?.issuedAt;
    if (!issuedAt) {
      // No issuedAt means this is a legacy invoice that was issued before edit window feature
      // These are considered locked (cannot edit without credit note)
      return true;
    }

    const issuedDate = new Date(issuedAt);
    const now = new Date();
    const hoursSinceIssued = (now - issuedDate) / (1000 * 60 * 60);

    return hoursSinceIssued >= 24; // Locked if 24+ hours since issued
  }, [id, originalSavedStatus, invoice?.issuedAt]);

  // Calculate if we're in revision mode (editing issued invoice within 24h)
  // Use originalSavedStatus to ensure this only applies to invoices that were
  // ALREADY saved as 'issued', not invoices being converted to 'issued'
  const isRevisionMode = useMemo(() => {
    // Must be editing an existing invoice
    if (!id) return false;

    // Use original saved status - only in revision mode if invoice was SAVED as issued
    if (originalSavedStatus !== 'issued') return false;

    const issuedAt = invoice?.issuedAt;
    if (!issuedAt) return false;

    const issuedDate = new Date(issuedAt);
    const now = new Date();
    const hoursSinceIssued = (now - issuedDate) / (1000 * 60 * 60);

    return hoursSinceIssued < 24; // In revision mode if within 24 hours
  }, [id, originalSavedStatus, invoice?.issuedAt]);

  // Calculate hours remaining in edit window
  const hoursRemainingInEditWindow = useMemo(() => {
    if (!isRevisionMode || !invoice?.issuedAt) return 0;

    const issuedDate = new Date(invoice.issuedAt);
    const now = new Date();
    const hoursSinceIssued = (now - issuedDate) / (1000 * 60 * 60);

    return Math.max(0, Math.ceil(24 - hoursSinceIssued));
  }, [isRevisionMode, invoice?.issuedAt]);

  // Auto-focus to next mandatory field
  const focusNextMandatoryField = useCallback(() => {
    // Check mandatory fields in order and focus the first unfilled one
    // 1. Customer (mandatory)
    if (!invoice.customer?.id) {
      customerRef.current?.querySelector('input')?.focus();
      return;
    }

    // 2. Payment Mode (mandatory)
    if (!invoice.modeOfPayment) {
      paymentModeRef.current?.focus();
      return;
    }

    // 3. At least one item with valid product, quantity, and rate (mandatory)
    const hasValidItem = invoice.items?.some(
      (item) => item.productId && item.quantity > 0 && item.rate > 0,
    );
    if (!hasValidItem) {
      // Focus Add Item button if no items, or focus the items section
      addItemButtonRef.current?.focus();
      addItemButtonRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    // All mandatory fields filled - focus Save button
    saveButtonRef.current?.focus();
    saveButtonRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [invoice.customer?.id, invoice.modeOfPayment, invoice.items]);

  // No extra payment terms fields; Due Date remains directly editable

  // Remove deferred value which might be causing delays
  const deferredItems = invoice.items;

  // Check if any line items require warehouse (sourceType === 'WAREHOUSE')
  const needsWarehouseSelector = useMemo(() => {
    // Show warehouse selector if no items exist (new invoice) or if any item uses warehouse stock
    if (!invoice.items || invoice.items.length === 0) {
      return true;
    }
    return invoice.items.some(
      (item) => !item.sourceType || item.sourceType === 'WAREHOUSE',
    );
  }, [invoice.items]);

  const {
    data: company,
    loading: loadingCompany,
    refetch: refetchCompany,
  } = useApiData(companyService.getCompany, [], true);
  const { execute: saveInvoice, loading: savingInvoice } = useApi(
    invoiceService.createInvoice,
  );
  const { execute: updateInvoice, loading: updatingInvoice } = useApi(
    invoiceService.updateInvoice,
  );
  const { data: existingInvoice, loading: loadingInvoice } = useApiData(
    () => (id ? invoiceService.getInvoice(id) : null),
    [id],
    { immediate: !!id, skipInitialLoading: !id },
  );
  const { data: _nextInvoiceData, refetch: refetchNextInvoice } = useApiData(
    () => invoiceService.getNextInvoiceNumber(),
    [],
    !id,
  );
  const { data: customersData, loading: loadingCustomers } = useApiData(
    () => customerService.getCustomers({ status: 'active', limit: 1000 }),
    [],
  );
  const { data: salesAgentsData, loading: loadingAgents } = useApiData(
    () => commissionService.getAgents(),
    [],
  );
  const {
    data: productsData,
    loading: loadingProducts,
    refetch: refetchProducts,
  } = useApiData(() => productService.getProducts({ limit: 1000 }), []);
  const { execute: _createProduct, loading: _creatingProduct } = useApi(
    productService.createProduct,
  );

  // Pinned products state
  const [pinnedProductIds, setPinnedProductIds] = useState([]);
  const { data: pinnedData, refetch: _refetchPinned } = useApiData(
    () => pinnedProductsService.getPinnedProducts(),
    [],
  );

  // Pricelist state
  const [selectedPricelistId, setSelectedPricelistId] = useState(null);
  const [pricelistName, setPricelistName] = useState(null);

  // ============================================================
  // AUTO-SAVE REMOVED - Was causing status bug on new invoices
  // ============================================================

  // ============================================================
  // PHASE 2-5 UI IMPROVEMENTS
  // ============================================================

  // Reduced motion preference for accessibility
  const _prefersReducedMotion = useReducedMotion();

  // Drag reorder for line items
  const handleItemsReorder = useCallback((newItems) => {
    setInvoice((prev) => ({ ...prev, items: newItems }));
  }, []);

  const {
    getDragHandleProps: _getDragHandleProps,
    getDragItemProps: _getDragItemProps,
    isDropTarget: _isDropTarget,
    isDragSource: _isDragSource,
  } = useDragReorder({
    items: invoice.items,
    onReorder: handleItemsReorder,
    enabled: true,
  });

  // Bulk selection for line items
  const {
    selectedIds: _selectedItemIds,
    isSelected: _isItemSelected,
    toggleSelect: _toggleItemSelect,
    selectAll: _selectAllItems,
    clearSelection: _clearItemSelection,
    toggleSelectAll: _toggleSelectAllItems,
    deleteSelected: _deleteSelectedItems,
    selectedCount: _selectedItemCount,
    isAllSelected: _isAllItemsSelected,
    isSomeSelected: _isSomeItemsSelected,
  } = useBulkActions({
    items: invoice.items,
    onUpdate: handleItemsReorder,
    getId: (item) => item.id,
  });

  // Invoice templates - read from company settings (edit in Company Settings page)
  const { currentTemplate } = useInvoiceTemplates('standard', company);

  // Template settings now managed in Company Settings only

  // Update pinned products when data loads
  useEffect(() => {
    if (pinnedData?.pinnedProducts) {
      setPinnedProductIds(pinnedData.pinnedProducts);
    }
  }, [pinnedData]);

  // Handle pin/unpin
  const handleTogglePin = async (e, productId) => {
    e.stopPropagation(); // Prevent adding item to invoice
    try {
      if (pinnedProductIds.includes(productId)) {
        await pinnedProductsService.unpinProduct(productId);
        setPinnedProductIds((prev) =>
          prev.filter((pinnedId) => pinnedId !== productId),
        );
      } else {
        if (pinnedProductIds.length >= 10) {
          notificationService.error('Maximum 10 products can be pinned');
          return;
        }
        await pinnedProductsService.pinProduct(productId);
        setPinnedProductIds((prev) => [...prev, productId]);
      }
    } catch (error) {
      notificationService.error(error.message || 'Failed to update pin');
    }
  };

  // Refetch products when form loads to ensure fresh data (updated names, latest sales data)
  useEffect(() => {
    refetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Also refetch when window regains focus (user returns from product management)
  useEffect(() => {
    const handleFocus = () => {
      refetchProducts();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // refetchProducts is stable enough for event handlers

  // Refetch company data when window regains focus (user returns from company settings)
  useEffect(() => {
    const handleFocus = () => {
      refetchCompany();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // refetchCompany is stable enough for event handlers

  // Get sorted products: pinned first, then top sold
  const sortedProducts = useMemo(() => {
    const allProducts = productsData?.products || [];
    const pinned = allProducts.filter((p) => pinnedProductIds.includes(p.id));
    const unpinned = allProducts.filter(
      (p) => !pinnedProductIds.includes(p.id),
    );
    return [...pinned, ...unpinned].slice(0, 10);
  }, [productsData, pinnedProductIds]);

  // Date helpers for constraints
  const invoiceDateObj = useMemo(() => {
    try {
      return invoice.date ? new Date(invoice.date) : new Date();
    } catch {
      return new Date();
    }
  }, [invoice.date]);

  const dueMinStr = useMemo(
    () => formatDateForInput(invoiceDateObj),
    [invoiceDateObj],
  );
  const dueMaxStr = useMemo(() => {
    const d = new Date(invoiceDateObj.getTime());
    d.setMonth(d.getMonth() + 6);
    return formatDateForInput(d);
  }, [invoiceDateObj]);

  // Warehouses state
  const [warehouses, setWarehouses] = useState([]);

  // Stock batches per product for FIFO allocation
  // Structure: { [productId]: { batches: [...], stockByWarehouse: { [warehouseId]: number } } }
  const [productBatchData, setProductBatchData] = useState({});

  /**
   * Fetch available batches for a product across all warehouses
   * @param {number|string} productId - Product ID
   * @returns {Promise<{batches: Array, stockByWarehouse: Object, totalStock: number}>}
   */
  const fetchBatchesForProduct = useCallback(
    async (productId) => {
      if (!productId || !company?.id) return null;

      try {
        const response = await stockBatchService.getBatches({
          productId,
          companyId: company.id,
          activeOnly: true,
          limit: 100, // Get all available batches
        });

        const batches = response?.batches || response?.data?.batches || [];

        // Sort by GRN date (oldest first = FIFO)
        const sortedBatches = [...batches].sort((a, b) => {
          const dateA = new Date(
            a.grnDate || a.grn_date || a.createdAt || a.created_at,
          );
          const dateB = new Date(
            b.grnDate || b.grn_date || b.createdAt || b.created_at,
          );
          return dateA - dateB;
        });

        // Calculate stock by warehouse
        // CRITICAL: Normalize keys to strings to prevent type mismatch with wh.id
        const stockByWarehouse = {};
        let totalStock = 0;
        sortedBatches.forEach((batch) => {
          const whId = batch.warehouseId || batch.warehouse_id;
          const available = parseFloat(
            batch.quantityAvailable || batch.quantity_available || 0,
          );
          if (whId) {
            const key = String(whId); // Normalize to string
            stockByWarehouse[key] = (stockByWarehouse[key] || 0) + available;
          }
          totalStock += available;
        });

        const batchData = {
          batches: sortedBatches,
          stockByWarehouse,
          totalStock,
        };

        // Update state
        setProductBatchData((prev) => ({
          ...prev,
          [productId]: batchData,
        }));

        return batchData;
      } catch (error) {
        console.error('Error fetching batches for product:', error);
        return { batches: [], stockByWarehouse: {}, totalStock: 0 };
      }
    },
    [company?.id],
  );

  /**
   * Auto-allocate batches using FIFO (First-In-First-Out) logic
   * Enhanced with explicit FIFO sorting and multi-warehouse awareness
   * @param {number} itemIndex - Index of the item in invoice.items
   * @param {number} requiredQty - Required quantity to allocate
   * @param {Array} batches - Available batches (will be sorted by received date)
   * @returns {Array} - Array of allocations sorted by FIFO order
   */
  const autoAllocateFIFO = useCallback((itemIndex, requiredQty, batches) => {
    if (!batches || batches.length === 0 || requiredQty <= 0) {
      return [];
    }

    // Sort batches by received_date ASC (FIFO - oldest first)
    // This ensures we always allocate from oldest stock first regardless of warehouse
    const sortedBatches = [...batches].sort((a, b) => {
      const dateA = new Date(
        a.receivedDate ||
          a.received_date ||
          a.grnDate ||
          a.grn_date ||
          a.createdAt ||
          a.created_at,
      );
      const dateB = new Date(
        b.receivedDate ||
          b.received_date ||
          b.grnDate ||
          b.grn_date ||
          b.createdAt ||
          b.created_at,
      );
      return dateA - dateB; // Oldest first
    });

    const allocations = [];
    let remaining = requiredQty;

    for (const batch of sortedBatches) {
      if (remaining <= 0) break;

      const available = parseFloat(
        batch.quantityAvailable || batch.quantity_available || 0,
      );
      if (available <= 0) continue;

      const allocateQty = Math.min(available, remaining);

      allocations.push({
        batchId: batch.id,
        batchNumber:
          batch.batchNumber || batch.batch_number || `BTH-${batch.id}`,
        receivedDate:
          batch.receivedDate ||
          batch.received_date ||
          batch.grnDate ||
          batch.grn_date ||
          batch.createdAt ||
          batch.created_at,
        warehouseId: batch.warehouseId || batch.warehouse_id,
        warehouseName:
          batch.warehouseName || batch.warehouse_name || 'Unknown Warehouse',
        availableQty: available,
        allocatedQty: allocateQty,
        unitCost: parseFloat(
          batch.unitCost ||
            batch.unit_cost ||
            batch.landedCostPerUnit ||
            batch.landed_cost_per_unit ||
            0,
        ),
        procurementChannel:
          batch.procurementChannel || batch.procurement_channel || 'LOCAL',
      });

      remaining -= allocateQty;
    }

    // If there's remaining quantity after all batches, it needs drop ship or split
    // This will be handled by the caller (auto drop-ship / auto-split suggestions)

    return allocations;
  }, []);

  /**
   * Apply auto-allocation to a line item after product selection
   * P0: Only allocates if sourceType === 'WAREHOUSE'
   * @param {number} itemIndex - Index of the item
   * @param {number|string} productId - Product ID
   * @param {number} quantity - Required quantity
   */
  const applyAutoAllocation = useCallback(
    async (itemIndex, productId, quantity) => {
      const currentItem = invoice.items[itemIndex];

      // P0: Only allocate for warehouse items
      if (currentItem.sourceType !== 'WAREHOUSE') {
        notificationService.info(
          'Auto-allocation only available for Warehouse source type',
        );
        return;
      }

      // Fetch batches for this product
      const batchData = await fetchBatchesForProduct(productId);
      if (!batchData) return;

      const { batches, totalStock } = batchData;
      const requiredQty = quantity || 1;

      if (totalStock === 0) {
        // AUTO-SELECT Local Drop Ship when no warehouse stock
        setInvoice((prev) => {
          const newItems = [...prev.items];
          newItems[itemIndex] = {
            ...newItems[itemIndex],
            sourceType: 'LOCAL_DROP_SHIP',
            allocations: [],
            allocationMode: null,
          };
          return { ...prev, items: newItems };
        });

        // AUTO-EXPAND allocation section for visibility
        setExpandedAllocations((prev) => {
          const newSet = new Set(prev);
          newSet.add(itemIndex);
          return newSet;
        });

        return;
      }

      // Stock available - apply FIFO allocation
      const fifoAllocations = autoAllocateFIFO(itemIndex, requiredQty, batches);
      const totalAllocated = fifoAllocations.reduce(
        (sum, a) => sum + a.allocatedQty,
        0,
      );

      // Convert legacy format to canonical allocations
      const canonicalAllocations = fifoAllocations.map((a) => ({
        batchId: a.batchId,
        batchNumber: a.batchNumber,
        quantity: a.allocatedQty,
        unitCost: a.unitCost || 0,
        totalCost: (a.allocatedQty || 0) * (a.unitCost || 0),
      }));

      setInvoice((prev) => {
        const newItems = [...prev.items];
        newItems[itemIndex] = {
          ...newItems[itemIndex],
          sourceType: 'WAREHOUSE',
          allocations: canonicalAllocations,
          allocationMode: 'AUTO_FIFO',
          partialAllocation: totalAllocated < requiredQty,
          shortfallQty: requiredQty - totalAllocated,
        };
        return { ...prev, items: newItems };
      });

      // AUTO-EXPAND allocation section for visibility
      setExpandedAllocations((prev) => {
        const newSet = new Set(prev);
        newSet.add(itemIndex);
        return newSet;
      });

      // P1: Show partial stock warning
      if (totalAllocated < requiredQty) {
        const shortfall = requiredQty - totalAllocated;
        notificationService.warning(
          `Warehouse has ${totalAllocated}/${requiredQty} units. Consider splitting: ${totalAllocated} warehouse + ${shortfall} drop-ship`,
          { autoClose: 8000 },
        );
      } else {
        notificationService.success(
          `Allocated ${totalAllocated} units from warehouse batches (FIFO)`,
        );
      }
    },
    [fetchBatchesForProduct, autoAllocateFIFO, invoice.items],
  );

  // Fetch warehouses once (active only)
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await (
          await import('../services/api')
        ).apiClient.get('/warehouses');
        const list = res?.warehouses || res?.data?.warehouses || [];
        const active = list.filter((w) => w.isActive !== false);
        setWarehouses(active);

        // Set default warehouse (Sharjah or first warehouse) for new invoices
        if (!id && active.length > 0 && !invoice.warehouseId) {
          // Try to find Sharjah warehouse, otherwise use first one
          const sharjahWarehouse = active.find(
            (w) =>
              w.city?.toLowerCase().includes('sharjah') ||
              w.name?.toLowerCase().includes('sharjah'),
          );
          const defaultWarehouse = sharjahWarehouse || active[0];

          setInvoice((prev) => ({
            ...prev,
            warehouseId: defaultWarehouse.id.toString(),
            warehouseName: defaultWarehouse.name || '',
            warehouseCode: defaultWarehouse.code || '',
            warehouseCity: defaultWarehouse.city || '',
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch warehouses:', err);
        setWarehouses([]);
      }
    };
    fetchWarehouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Mount-only: Load warehouses once when component mounts or id changes

  // Heavily optimized calculations with minimal dependencies
  const computedSubtotal = useMemo(
    () => calculateSubtotal(invoice.items),
    [invoice.items],
  );
  const computedVatAmount = useMemo(() => {
    return calculateDiscountedTRN(
      invoice.items,
      invoice.discountType,
      invoice.discountPercentage,
      invoice.discountAmount,
    );
  }, [
    invoice.items,
    invoice.discountType,
    invoice.discountPercentage,
    invoice.discountAmount,
  ]);

  const computedDiscountAmount = useMemo(() => {
    const discountAmount = parseFloat(invoice.discountAmount) || 0;
    const discountPercentage = parseFloat(invoice.discountPercentage) || 0;

    if (invoice.discountType === 'percentage') {
      return (computedSubtotal * discountPercentage) / 100;
    } else {
      return discountAmount;
    }
  }, [
    computedSubtotal,
    invoice.discountAmount,
    invoice.discountPercentage,
    invoice.discountType,
  ]);

  // Parse charges only when calculating final total to avoid blocking on every keystroke
  const computedTotal = useMemo(() => {
    const discountAmount = parseFloat(invoice.discountAmount) || 0;
    const discountPercentage = parseFloat(invoice.discountPercentage) || 0;

    let totalDiscount = 0;
    if (invoice.discountType === 'percentage') {
      totalDiscount = (computedSubtotal * discountPercentage) / 100;
    } else {
      totalDiscount = discountAmount;
    }

    const subtotalAfterDiscount = Math.max(0, computedSubtotal - totalDiscount);
    return calculateTotal(subtotalAfterDiscount, computedVatAmount);
  }, [
    computedSubtotal,
    computedVatAmount,
    invoice.discountAmount,
    invoice.discountPercentage,
    invoice.discountType,
  ]);

  // No longer needed - invoice numbers are generated by database on save
  // useEffect(() => {
  //   if (nextInvoiceData && nextInvoiceData.nextInvoiceNumber && !id) {
  //     setInvoice((prev) => ({
  //       ...prev,
  //       invoiceNumber: withStatusPrefix(
  //         nextInvoiceData.nextInvoiceNumber,
  //         prev.status || "draft"
  //       ),
  //     }));
  //   }
  // }, [nextInvoiceData, id]);

  useEffect(() => {
    if (existingInvoice && id) {
      // Check if invoice is deleted - prevent editing
      if (existingInvoice.deletedAt) {
        notificationService.error(
          `This invoice has been deleted and cannot be edited. Reason: ${existingInvoice.deletionReason || 'No reason provided'}`,
        );
        navigate('/invoices');
        return;
      }
      // Auto-populate date to today if empty (common in Odoo/Zoho)
      const invoiceWithDate = {
        ...existingInvoice,
        date: existingInvoice.date
          ? formatDateForInput(new Date(existingInvoice.date))
          : formatDateForInput(new Date()),
      };
      setInvoice(invoiceWithDate);

      // Capture the original saved status for isLocked calculation
      // This prevents the locked banner from showing when just changing the dropdown
      const savedStatus = (existingInvoice.status || '')
        .toLowerCase()
        .replace('status_', '');
      setOriginalSavedStatus(savedStatus);
    }
  }, [existingInvoice, id, navigate]);

  // Phase 4: Fetch saved batch consumptions for existing invoices
  // This runs after existingInvoice is loaded and the invoice ID is known
  useEffect(() => {
    const fetchConsumptions = async () => {
      // Only fetch for existing invoices that have been finalized (issued/proforma)
      if (!id || !existingInvoice) return;

      const status = (existingInvoice.status || '').toLowerCase().replace('status_', '');
      // Only fetch consumptions for invoices that have been through finalization
      if (status !== 'issued' && status !== 'proforma') {
        setConsumptionsFetched(true);
        return;
      }

      try {
        const response = await batchReservationService.getInvoiceBatchConsumptions(parseInt(id, 10));
        if (response && response.items) {
          // Map consumptions by invoice_item_id for easy lookup
          const byItemId = {};
          response.items.forEach((item) => {
            byItemId[item.invoiceItemId] = {
              consumptions: item.consumptions || [],
              totalQuantity: item.totalQuantity || '0',
              totalCogs: item.totalCogs || '0',
              isDropShip: item.isDropShip || false,
            };
          });
          setSavedConsumptionsByItemId(byItemId);
        }
        setConsumptionsFetched(true);
      } catch (err) {
        console.error('Failed to fetch batch consumptions:', err);
        // Don't block the form if consumption fetch fails
        setConsumptionsFetched(true);
      }
    };

    fetchConsumptions();
  }, [id, existingInvoice]);

  // Validate fields on load and when invoice changes
  useEffect(() => {
    if (invoice) {
      validateField('customer', invoice.customer);
      validateField('dueDate', invoice.dueDate);
      validateField('status', invoice.status);
      validateField('paymentMode', invoice.modeOfPayment);
      validateField('warehouse', invoice.warehouseId);
      validateField('currency', invoice.currency);
      validateField('placeOfSupply', invoice.placeOfSupply);
      validateField('supplyDate', invoice.supplyDate);
      validateField('items', invoice.items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    invoice.customer.id,
    invoice.dueDate,
    invoice.status,
    invoice.modeOfPayment,
    invoice.warehouseId,
    invoice.currency,
    invoice.placeOfSupply || '',
    invoice.supplyDate || '',
    invoice.items.length,
    validateField,
  ]);
  // Note: Using granular dependencies (invoice.customer.id, invoice.items.length, etc.) instead of entire invoice object to avoid unnecessary re-validations

  const checkTradeLicenseStatus = async (customerId) => {
    try {
      // Use axios-based client to benefit from auth + baseURL
      const { apiClient } = await import('../services/api');
      const licenseStatus = await apiClient.get(
        `/customers/${customerId}/trade-license-status`,
      );
      if (licenseStatus) {
        setTradeLicenseStatus(licenseStatus);
        // Show alert for expired or expiring licenses
        if (
          licenseStatus.hasLicense &&
          (licenseStatus.status === 'expired' ||
            licenseStatus.status === 'expiring_soon')
        ) {
          setShowTradeLicenseAlert(true);
        } else {
          setShowTradeLicenseAlert(false);
        }
      }
    } catch (error) {
      // Fall back to fetch with defensive parsing to capture server HTML errors
      try {
        const resp = await fetch(
          `/api/customers/${customerId}/trade-license-status`,
        );
        const ct = resp.headers.get('content-type') || '';
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`HTTP ${resp.status}: ${txt.slice(0, 200)}`);
        }
        if (!ct.includes('application/json')) {
          const txt = await resp.text();
          throw new SyntaxError(
            `Unexpected content-type: ${ct}. Body starts: ${txt.slice(0, 80)}`,
          );
        }
        const licenseStatus = await resp.json();
        setTradeLicenseStatus(licenseStatus);
      } catch (fallbackErr) {
        // Silently ignore - trade license check is optional feature, route may not exist
        // console.debug('Trade license check unavailable:', fallbackErr.message);
      }
    }
  };

  const handleCustomerSelect = useCallback(
    async (customerId) => {
      const customers = customersData?.customers || [];
      const selectedCustomer = customers.find((c) => c.id === customerId);

      if (selectedCustomer) {
        setInvoice((prev) => ({
          ...prev,
          customer: {
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            email: selectedCustomer.email || '',
            phone: selectedCustomer.phone || '',
            // Use TRN number from customer data
            vatNumber:
              selectedCustomer.trnNumber || selectedCustomer.vatNumber || '',
            address: {
              street: selectedCustomer.address?.street || '',
              city: selectedCustomer.address?.city || '',
              emirate: selectedCustomer.address?.emirate || '',
              poBox: selectedCustomer.address?.poBox || '',
            },
          },
        }));

        // Fetch customer's pricelist
        if (selectedCustomer.pricelistId) {
          try {
            const response = await pricelistService.getById(
              selectedCustomer.pricelistId,
            );
            setSelectedPricelistId(selectedCustomer.pricelistId);
            setPricelistName(response.data.name);
          } catch (error) {
            // Silently ignore - pricelist is optional, may not be configured
            // console.debug('Pricelist fetch failed:', error.message);
            setSelectedPricelistId(null);
            setPricelistName(null);
          }
        } else {
          // Use default pricelist
          setSelectedPricelistId(null);
          setPricelistName('Default Price List');
        }

        // Check trade license status
        checkTradeLicenseStatus(customerId);

        // Validate customer field
        validateField('customer', {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
        });

        // Clear customer-related validation errors since user has now selected a customer
        setValidationErrors((prev) =>
          prev.filter((err) => !err.toLowerCase().includes('customer')),
        );
        setInvalidFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete('customer');
          newSet.delete('customer.name');
          return newSet;
        });

        // Auto-focus to next mandatory field after customer selection
        setTimeout(() => focusNextMandatoryField(), 100);
      }
    },
    [customersData, validateField, focusNextMandatoryField],
  );

  const handleSalesAgentSelect = useCallback((agentId) => {
    setInvoice((prev) => ({
      ...prev,
      sales_agent_id: agentId && agentId !== 'none' ? parseInt(agentId) : null,
    }));
  }, []);

  // Duplicate product detection state
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const pendingProductRef = useRef(null);

  // Speed button quantity increment animation
  const [blinkingRowIndex, setBlinkingRowIndex] = useState(null);

  // Allocation panel expansion state
  const [expandedAllocations, setExpandedAllocations] = useState(new Set());

  // Toggle allocation panel for a specific row
  const toggleAllocationPanel = useCallback((index) => {
    setExpandedAllocations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Get allocation status badge for a line item
  // Only show status badges for saved invoices (when id exists)
  // For new invoices, hide the "Pending" status as it's just noise
  const _getAllocationStatusBadge = useCallback(
    (item) => {
      const status = item.allocationStatus || 'pending';

      // Don't show "Pending" badge on new/unsaved invoices - it's confusing
      // Only show meaningful statuses (allocated, partial, failed) on saved invoices
      if (!id && status === 'pending') {
        return null;
      }

      if (status === 'allocated') {
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              isDarkMode
                ? 'bg-green-900/40 text-green-300 border border-green-700'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            <CheckCircle size={12} />
            Allocated
          </span>
        );
      } else if (status === 'partial') {
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              isDarkMode
                ? 'bg-amber-900/40 text-amber-300 border border-amber-700'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <AlertTriangle size={12} />
            Partial
          </span>
        );
      } else if (status === 'failed') {
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              isDarkMode
                ? 'bg-red-900/40 text-red-300 border border-red-700'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <X size={12} />
            Failed
          </span>
        );
      } else {
        // pending or no status
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              isDarkMode
                ? 'bg-gray-700 text-gray-300 border border-gray-600'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            <Info size={12} />
            Pending
          </span>
        );
      }
    },
    [isDarkMode, id],
  );

  // Get UOM conversion display text
  const getUomConversionText = useCallback((item) => {
    if (!item.itemUom || !item.primaryUom || item.itemUom === item.primaryUom) {
      return null;
    }

    const qty = item.quantity || 0;
    const factor = item.conversionFactor || 1;
    const convertedQty = qty * factor;

    if (item.unitWeight && item.itemUom === 'PCS' && item.primaryUom === 'KG') {
      return `${qty} PCS = ${convertedQty.toFixed(2)} KG (unit weight: ${item.unitWeight} kg)`;
    }

    return `${qty} ${item.itemUom} = ${convertedQty.toFixed(2)} ${item.primaryUom}`;
  }, []);

  // Check if product already exists in items (excluding current index)
  const findDuplicateProduct = useCallback(
    (productId, excludeIndex) => {
      if (!productId) return null;
      return invoice.items.findIndex(
        (item, idx) => idx !== excludeIndex && item.productId === productId,
      );
    },
    [invoice.items],
  );

  // Find the first empty item row (no product selected, no name entered)
  const findEmptyItemIndex = useCallback(() => {
    return invoice.items.findIndex(
      (item) => !item.productId && !item.name?.trim(),
    );
  }, [invoice.items]);

  const handleProductSelectInternal = useCallback(
    async (index, product, skipDuplicateCheck = false) => {
      if (product && typeof product === 'object') {
        // Check for duplicate product (unless skipping)
        if (!skipDuplicateCheck) {
          const existingIndex = findDuplicateProduct(product.id, index);
          if (existingIndex !== -1) {
            // Store pending selection and show warning
            pendingProductRef.current = { index, product };
            setDuplicateWarning({
              productName: product.displayName || product.display_name || 'N/A',
              existingIndex,
              existingQuantity: invoice.items[existingIndex]?.quantity || 0,
            });
            return; // Don't proceed until user confirms
          }
        }

        // Helper: extract thickness from product specs or size string
        const getThickness = (p) => {
          try {
            const cat = (p?.category || '').toString().toLowerCase();
            const isPipe = /pipe/.test(cat);
            const specThk =
              p?.specifications?.thickness || p?.specifications?.Thickness;
            if (specThk && String(specThk).trim())
              return String(specThk).trim();
            if (isPipe) return ''; // avoid deriving thickness from pipe size
            const sizeStr = p?.size ? String(p.size) : '';
            const mmMatch = sizeStr.match(/(\d+(?:\.\d+)?)\s*(mm)\b/i);
            if (mmMatch) return `${mmMatch[1]}mm`;
            const xParts = sizeStr
              .split(/x|X|\*/)
              .map((s) => s.trim())
              .filter(Boolean);
            if (xParts.length >= 2) {
              const last = xParts[xParts.length - 1];
              const numMatch = last.match(/\d+(?:\.\d+)?/);
              if (numMatch) return `${numMatch[0]}mm`;
            }
          } catch (err) {
            console.warn('Error extracting thickness from product:', err);
          }
          return '';
        };

        // Fetch price from pricelist if available (with volume discount support)
        let sellingPrice = product.sellingPrice || 0;
        if (selectedPricelistId) {
          try {
            // Use getPriceForQuantity for volume discount support
            const priceResponse = await pricelistService.getPriceForQuantity(
              product.id,
              selectedPricelistId,
              1,
            );
            sellingPrice =
              priceResponse.price ||
              priceResponse.data?.price ||
              product.sellingPrice ||
              0;
          } catch (error) {
            console.error('Error fetching pricelist price:', error);
            // Fallback to default product price
            sellingPrice = product.sellingPrice || 0;
          }
        }

        setInvoice((prev) => {
          const newItems = [...prev.items];

          // Determine quantityUom from product's primary_uom (preferred) or fallback to category detection
          // primary_uom: 'PCS' for discrete items (sheets, pipes, bars), 'MT' or 'KG' for bulk (coils)
          const primaryUom = (
            product.primaryUom ||
            product.primary_uom ||
            ''
          ).toUpperCase();
          let quantityUom;
          if (primaryUom === 'MT' || primaryUom === 'KG') {
            quantityUom = primaryUom; // Use product's declared UOM for coils/bulk
          } else {
            // Fallback: category-based detection for legacy products without primary_uom
            const category = (product.category || '').toLowerCase();
            const isCoil = category.includes('coil');
            quantityUom = isCoil ? 'MT' : 'PCS';
          }

          // Get pricing basis and unit weight from product
          const pricingBasis =
            product.pricingBasis || product.pricing_basis || 'PER_MT';
          const unitWeightKg =
            product.unitWeightKg || product.unit_weight_kg || null;
          const quantity = newItems[index].quantity || 1;

          // Flag if weight is missing for weight-based pricing (for UI warning)
          const missingWeightWarning =
            (pricingBasis === 'PER_MT' || pricingBasis === 'PER_KG') &&
            quantityUom === 'PCS' &&
            !unitWeightKg;

          // Calculate theoretical weight (for audit trail)
          let theoreticalWeightKg = null;
          if (quantityUom === 'MT') {
            theoreticalWeightKg = quantity * 1000; // MT to KG
          } else if (quantityUom === 'KG') {
            theoreticalWeightKg = quantity;
          } else if (unitWeightKg) {
            theoreticalWeightKg = quantity * unitWeightKg;
          }

          // Calculate amount using new pricing-aware function
          const amount = calculateItemAmount(
            quantity,
            sellingPrice,
            pricingBasis,
            unitWeightKg,
            quantityUom,
          );

          newItems[index] = {
            ...newItems[index],
            productId: product.id,
            // Use displayName (without origin) for invoice line items
            name:
              product.displayName ||
              product.display_name ||
              product.uniqueName ||
              product.unique_name,
            category: product.category || '',
            commodity: product.commodity || 'SS',
            grade: product.grade || '',
            finish: product.finish || '',
            size: product.size || '',
            sizeInch: product.sizeInch || '',
            od: product.od || '',
            length: product.length || '',
            thickness: getThickness(product),
            // unit removed from invoice UI
            rate: sellingPrice,
            vatRate: newItems[index].vatRate || 5, // Preserve existing VAT rate or default to 5%
            amount,
            // Pricing & Commercial Fields (added 2025-12-12 - Pricing Audit)
            pricingBasis,
            unitWeightKg,
            quantityUom,
            theoreticalWeightKg,
            // Warning flag for missing unit weight on weight-based pricing
            missingWeightWarning,
          };

          return {
            ...prev,
            items: newItems,
          };
        });

        // Clear search input for this row
        setSearchInputs((prev) => ({ ...prev, [index]: '' }));

        // Auto-allocate batches using FIFO when product is selected
        const quantity = invoice.items[index]?.quantity || 1;
        await applyAutoAllocation(index, product.id, quantity);
      }
    },
    [
      selectedPricelistId,
      findDuplicateProduct,
      invoice.items,
      applyAutoAllocation,
    ],
  );

  // Handle duplicate confirmation - add anyway
  const handleDuplicateAddAnyway = useCallback(() => {
    if (pendingProductRef.current) {
      const { index, product } = pendingProductRef.current;
      pendingProductRef.current = null;
      setDuplicateWarning(null);
      // Re-call with skip flag
      handleProductSelectInternal(index, product, true);
    }
  }, [handleProductSelectInternal]);

  // Handle duplicate confirmation - update existing quantity
  const handleDuplicateUpdateExisting = useCallback(() => {
    if (pendingProductRef.current && duplicateWarning) {
      const { product } = pendingProductRef.current;
      const existingIndex = duplicateWarning.existingIndex;

      // Update existing item's quantity by adding 1
      setInvoice((prev) => {
        const newItems = [...prev.items];
        const existingItem = newItems[existingIndex];
        const newQuantity = (existingItem.quantity || 0) + 1;
        // Recalculate theoretical weight
        let theoreticalWeightKg = existingItem.theoreticalWeightKg;
        if (existingItem.unitWeightKg && existingItem.quantityUom === 'PCS') {
          theoreticalWeightKg = newQuantity * existingItem.unitWeightKg;
        } else if (existingItem.quantityUom === 'MT') {
          theoreticalWeightKg = newQuantity * 1000;
        } else if (existingItem.quantityUom === 'KG') {
          theoreticalWeightKg = newQuantity;
        }
        newItems[existingIndex] = {
          ...existingItem,
          quantity: newQuantity,
          theoreticalWeightKg,
          amount: calculateItemAmount(
            newQuantity,
            existingItem.rate,
            existingItem.pricingBasis,
            existingItem.unitWeightKg,
            existingItem.quantityUom,
          ),
        };
        return { ...prev, items: newItems };
      });

      // Remove the empty row that was being edited
      const { index } = pendingProductRef.current;
      if (invoice.items[index] && !invoice.items[index].productId) {
        setInvoice((prev) => ({
          ...prev,
          items: prev.items.filter((_, idx) => idx !== index),
        }));
      }

      pendingProductRef.current = null;
      setDuplicateWarning(null);
      notificationService.success(
        `Quantity updated for ${product.displayName || product.display_name || 'N/A'}`,
      );
    }
  }, [duplicateWarning, invoice.items]);

  // Cancel duplicate warning
  const handleDuplicateCancel = useCallback(() => {
    pendingProductRef.current = null;
    setDuplicateWarning(null);
  }, []);

  // Public handler that includes duplicate checking
  const handleProductSelect = useCallback(
    (index, product) => {
      handleProductSelectInternal(index, product, false);
    },
    [handleProductSelectInternal],
  );

  // No automatic coupling; due date is independently editable by the user

  const searchTimerRef = useRef(null);

  const handleSearchInputChange = useCallback((index, value) => {
    setSearchInputs((prev) => ({ ...prev, [index]: value }));

    // Update the item name immediately for responsive typing
    setInvoice((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        name: value,
        productId: null, // Clear product ID when typing custom name
      };
      return {
        ...prev,
        items: newItems,
      };
    });
    // Debounced server-side product search
    try {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(async () => {
        const term = (value || '').trim();
        if (!term) return;
        try {
          const resp = await productService.getProducts({
            search: term,
            limit: 20,
          });
          // Overwrite the shared productsData with the fetched subset is complex;
          // instead we keep a local map of options for active row via Autocomplete filtering.
          // Here we attach the fetched results to a special key for the row.
          setSearchInputs((prev) => ({
            ...prev,
            __results: resp?.products || [],
          }));
        } catch (err) {
          console.warn('Product search failed:', err);
          setSearchInputs((prev) => ({ ...prev, __results: [] }));
        }
      }, 300);
    } catch (err) {
      console.error('Error setting up product search timer:', err);
    }
  }, []);

  const handleItemChange = useCallback(
    async (index, field, value) => {
      // P0 CRITICAL: Handle sourceType changes with allocation release and stock validation
      if (field === 'sourceType') {
        const currentItem = invoice.items[index];
        const oldSourceType = currentItem.sourceType || 'WAREHOUSE';
        const newSourceType = value;

        // P0: Validate stock when switching TO warehouse
        if (newSourceType === 'WAREHOUSE') {
          const stockData = productBatchData[currentItem.productId];
          const totalStock =
            stockData?.batches?.reduce(
              (sum, b) => sum + (b.quantityAvailable || 0),
              0,
            ) || 0;

          if (totalStock === 0) {
            notificationService.error(
              'Cannot switch to Warehouse - no stock available',
            );
            return; // Block the change
          }

          if (totalStock > 0 && totalStock < currentItem.quantity) {
            notificationService.warning(
              `Only ${totalStock} units available in warehouse (${currentItem.quantity} required). Consider partial allocation.`,
              { autoClose: 8000 },
            );
            // Allow switch but show warning
          }
        }

        // P0: Release allocations when switching FROM warehouse TO drop-ship
        if (oldSourceType === 'WAREHOUSE' && newSourceType !== 'WAREHOUSE') {
          setInvoice((prev) => {
            const newItems = [...prev.items];
            newItems[index] = {
              ...newItems[index],
              sourceType: newSourceType,
              manualAllocations: null,
              allocationStatus: 'pending',
            };
            return { ...prev, items: newItems };
          });
          notificationService.info('Warehouse allocations released');
          return;
        }
      }

      // First, update the item immediately
      setInvoice((prev) => {
        const newItems = [...prev.items];
        newItems[index] = {
          ...newItems[index],
          [field]: value,
        };

        // Auto-update VAT rate based on supply type
        if (field === 'supplyType') {
          if (value === 'standard') {
            newItems[index].vatRate = 5;
          } else if (value === 'zero_rated' || value === 'exempt') {
            newItems[index].vatRate = 0;
          }
        }

        if (field === 'quantity' || field === 'rate') {
          const item = newItems[index];
          newItems[index].amount = calculateItemAmount(
            item.quantity,
            item.rate,
            item.pricingBasis,
            item.unitWeightKg,
            item.quantityUom,
          );
          // Update theoretical weight when quantity changes
          if (
            field === 'quantity' &&
            item.unitWeightKg &&
            item.quantityUom === 'PCS'
          ) {
            newItems[index].theoreticalWeightKg =
              item.quantity * item.unitWeightKg;
          } else if (field === 'quantity' && item.quantityUom === 'MT') {
            newItems[index].theoreticalWeightKg = item.quantity * 1000;
          } else if (field === 'quantity' && item.quantityUom === 'KG') {
            newItems[index].theoreticalWeightKg = item.quantity;
          }
        }

        // Check if item is now complete (has product, quantity > 0, rate > 0)
        const updatedItem = newItems[index];
        if (
          updatedItem.productId &&
          updatedItem.quantity > 0 &&
          updatedItem.rate > 0
        ) {
          // Clear item-related validation errors
          setValidationErrors((errors) =>
            errors.filter((err) => !err.toLowerCase().includes('item')),
          );
          // Note: Don't auto-focus away - user may want to add more items
        }

        return {
          ...prev,
          items: newItems,
        };
      });

      // If quantity changed and we have a pricelist, re-fetch price for volume discount
      if (field === 'quantity' && selectedPricelistId) {
        // Get current item to check if it has a product
        setInvoice((prev) => {
          const item = prev.items[index];
          if (item?.productId && value > 0) {
            // Fetch volume-based price asynchronously
            pricelistService
              .getPriceForQuantity(item.productId, selectedPricelistId, value)
              .then((priceResponse) => {
                const newPrice =
                  priceResponse.price || priceResponse.data?.price;
                if (newPrice && newPrice !== item.rate) {
                  setInvoice((prevInv) => {
                    const newItems = [...prevInv.items];
                    const currentItem = newItems[index];
                    newItems[index] = {
                      ...currentItem,
                      rate: newPrice,
                      amount: calculateItemAmount(
                        currentItem.quantity,
                        newPrice,
                        currentItem.pricingBasis,
                        currentItem.unitWeightKg,
                        currentItem.quantityUom,
                      ),
                    };
                    return { ...prevInv, items: newItems };
                  });
                }
              })
              .catch((_err) => {
                // Volume discount price fetch failed, using default price
              });
          }
          return prev; // No change in this callback
        });
      }
    },
    [selectedPricelistId],
  );

  const productOptions = useMemo(() => {
    const list = productsData?.products || [];
    return list.map((product) => {
      // Handle both camelCase and snake_case field names from API
      const uniqueName = product.uniqueName || product.unique_name;
      const displayName = product.displayName || product.display_name;
      const sellingPrice = product.sellingPrice ?? product.selling_price ?? 0;
      // Use uniqueName for dropdown display, displayName for documents
      const label = uniqueName || displayName || 'N/A';
      return {
        ...product,
        label,
        searchDisplay: label,
        // Normalize fields for consistent access
        uniqueName: uniqueName || '',
        displayName: displayName || '',
        subtitle: `${product.category} • ${product.grade || 'N/A'} • د.إ${sellingPrice}`,
      };
    });
  }, [productsData]);

  const searchOptions = useMemo(() => {
    const list = searchInputs?.__results || [];
    return list.map((product) => {
      // Handle both camelCase and snake_case field names from API
      const uniqueName = product.uniqueName || product.unique_name;
      const displayName = product.displayName || product.display_name;
      const sellingPrice = product.sellingPrice ?? product.selling_price ?? 0;
      // Use uniqueName for dropdown display, displayName for documents
      const label = uniqueName || displayName || 'N/A';
      return {
        ...product,
        label,
        searchDisplay: label,
        // Normalize fields for consistent access
        uniqueName: uniqueName || '',
        displayName: displayName || '',
        subtitle: `${product.category} • ${product.grade || 'N/A'} • د.إ${sellingPrice}`,
      };
    });
  }, [searchInputs.__results]);

  const addItem = useCallback(() => {
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, createSteelItem()],
    }));
    // Clear item-related validation errors since user is adding an item
    setValidationErrors((prev) =>
      prev.filter((err) => !err.toLowerCase().includes('item is required')),
    );
  }, []);

  const removeItem = useCallback((index) => {
    setInvoice((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      // Always maintain at least one empty row
      if (newItems.length === 0) {
        newItems.push(createSteelItem());
      }
      return { ...prev, items: newItems };
    });
  }, []);

  // ============================================================
  // PHASE 3: AllocationDrawer Line Item Handlers
  // ============================================================

  /**
   * Handle adding a line item from the AllocationDrawer
   * This callback receives the full line item data including allocations
   */
  const handleAddLineItem = useCallback((lineItemData) => {
    // lineItemData structure from AllocationDrawer:
    // {
    //   lineItemTempId: 'uuid-v4-string',
    //   productId: 123,
    //   product: { ... full product object },
    //   name: 'SS-304-Sheet-2B-1220mm-1.5mm-2440mm',
    //   quantity: 500,
    //   unit: 'KG',
    //   rate: 75.00,
    //   amount: 37500.00,
    //   sourceType: 'WAREHOUSE',
    //   warehouseId: 1,
    //   allocations: [ ... batch allocations with reservation data ],
    //   reservationId: 456,
    //   expiresAt: '2024-12-14T11:30:00Z'
    // }

    setInvoice((prev) => {
      // Remove empty placeholder items (items without productId)
      const existingValidItems = prev.items.filter(
        (item) => item.productId || item.name,
      );

      // Create the new line item with all data from drawer
      const newItem = {
        id: uuidv4(),
        lineItemTempId: lineItemData.lineItemTempId,
        productId: lineItemData.productId,
        name: lineItemData.name,
        // Copy product details for display
        category: lineItemData.product?.category || '',
        commodity: lineItemData.product?.commodity || '',
        grade: lineItemData.product?.grade || '',
        finish: lineItemData.product?.finish || '',
        size: lineItemData.product?.size || '',
        thickness: lineItemData.product?.thickness || '',
        origin: lineItemData.product?.origin || '',
        // Quantity and pricing
        quantity: parseFloat(lineItemData.quantity),
        quantityUom: lineItemData.unit || 'KG',
        rate: parseFloat(lineItemData.rate),
        pricingBasis: 'PER_KG', // Default, will be updated
        amount: parseFloat(lineItemData.amount),
        // Stock source
        sourceType: lineItemData.sourceType,
        warehouseId: lineItemData.warehouseId,
        // CANONICAL allocation representation (single source of truth)
        allocations: lineItemData.allocations || [],
        allocationMode: lineItemData.allocationMode || 'AUTO_FIFO',
        // Reservation tracking
        reservationId: lineItemData.reservationId,
        reservationExpiresAt: lineItemData.expiresAt,
        // Weight info (calculated)
        unitWeightKg: lineItemData.product?.unitWeightKg || 1,
        theoreticalWeightKg: parseFloat(lineItemData.quantity),
        // VAT (default 5%)
        supplyType: 'standard',
      };

      return {
        ...prev,
        items: [...existingValidItems, newItem],
      };
    });

    // Show success notification
    notificationService.success(
      `Added: ${lineItemData.name} (${lineItemData.quantity} ${lineItemData.unit})`,
    );

    // Trigger recalculation of totals
    setFormDirty(true);
  }, []);

  /**
   * Handle deleting a line item that was added via the drawer
   * This also cancels any associated reservations
   */
  const handleDeleteLineItem = useCallback(
    async (lineItemTempId) => {
      // Find the item to get reservation info
      const itemToDelete = invoice.items.find(
        (item) => item.lineItemTempId === lineItemTempId,
      );

      if (!itemToDelete) {
        notificationService.error('Item not found');
        return;
      }

      // Cancel reservations for this line item if it has any
      if (
        itemToDelete.lineItemTempId &&
        itemToDelete.sourceType === 'WAREHOUSE'
      ) {
        try {
          await batchReservationService.cancelLineItemReservations({
            draftInvoiceId: invoice.id || 0,
            lineItemTempId: itemToDelete.lineItemTempId,
          });
        } catch (err) {
          console.warn('Failed to cancel reservation on delete:', err);
          // Continue with deletion even if reservation cancel fails
        }
      }

      // Remove the item from invoice
      setInvoice((prev) => {
        const newItems = prev.items.filter(
          (item) => item.lineItemTempId !== lineItemTempId,
        );
        // Always maintain at least one empty row if all items deleted
        if (newItems.length === 0) {
          newItems.push(createSteelItem());
        }
        return { ...prev, items: newItems };
      });

      notificationService.success('Line item deleted');
      setFormDirty(true);
    },
    [invoice.id, invoice.items],
  );

  /**
   * Get status icon for a line item based on its allocation state
   */
  const getLineItemStatusIcon = useCallback((item) => {
    // Drop-ship items show ship icon
    if (
      item.sourceType === 'LOCAL_DROP_SHIP' ||
      item.sourceType === 'IMPORT_DROP_SHIP'
    ) {
      return {
        icon: 'ship',
        title: 'Drop-ship order',
        className: 'text-blue-500',
      };
    }

    // Warehouse items - check allocation status
    if (!item.allocations || item.allocations.length === 0) {
      return {
        icon: 'empty',
        title: 'Not allocated',
        className: 'text-gray-400',
      };
    }

    const allocatedQty = (item.allocations || []).reduce(
      (sum, a) => sum + parseFloat(a.quantity || 0),
      0,
    );
    const requiredQty = parseFloat(item.quantity) || 0;

    if (Math.abs(allocatedQty - requiredQty) < 0.001) {
      return {
        icon: 'check',
        title: 'Fully allocated',
        className: 'text-green-500',
      };
    }

    if (allocatedQty > 0 && allocatedQty < requiredQty) {
      return {
        icon: 'partial',
        title: `Partially allocated (${allocatedQty.toFixed(2)}/${requiredQty.toFixed(2)})`,
        className: 'text-amber-500',
      };
    }

    return {
      icon: 'empty',
      title: 'Not allocated',
      className: 'text-gray-400',
    };
  }, []);

  // ============================================================
  // END PHASE 3: AllocationDrawer Line Item Handlers
  // ============================================================

  const handleSave = async () => {
    // Prevent double-click / rapid clicks at entry point
    if (isSaving) {
      return;
    }

    // For new invoices with Final Tax Invoice status, show confirmation first
    if (!id && invoice.status === 'issued') {
      setShowSaveConfirmDialog(true);
      return;
    }

    // Otherwise proceed with save directly
    await performSave();
  };

  // Function to check if form has all required fields
  const validateRequiredFields = () => {
    const errors = [];
    const invalidFieldsSet = new Set();

    // Check customer information
    if (!invoice.customer?.name || invoice.customer.name.trim() === '') {
      errors.push('Customer name is required');
      invalidFieldsSet.add('customer.name');
    }

    // Check if there are any items (filter out empty placeholder items)
    // Placeholder items have no productId and no name - same logic as UI display
    const realItems = (invoice.items || []).filter(
      (item) => item.productId || (item.name && item.name.trim() !== ''),
    );

    if (realItems.length === 0) {
      errors.push('At least one item is required');
    } else {
      // Validate each real item
      realItems.forEach((item, index) => {
        if (!item.name || item.name.trim() === '') {
          errors.push(`Item ${index + 1}: Product name is required`);
          invalidFieldsSet.add(`item.${index}.name`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.quantity`);
        }
        if (!item.rate || item.rate <= 0) {
          errors.push(`Item ${index + 1}: Rate must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.rate`);
        }
        // CRITICAL: Block save when unit weight is missing for weight-based pricing
        // This prevents incorrect pricing calculations (e.g., 30x overcharge)
        if (item.missingWeightWarning) {
          errors.push(
            `Item ${index + 1}: Unit weight is missing for "${item.name}". This product has weight-based pricing (${item.pricingBasis}) but no unit weight. Please contact admin to add unit weight to the product master.`,
          );
          invalidFieldsSet.add(`item.${index}.unitWeight`);
        }
      });
    }

    // Check dates
    if (!invoice.date) {
      errors.push('Invoice date is required');
      invalidFieldsSet.add('date');
    }
    if (!invoice.dueDate) {
      errors.push('Due date is required');
      invalidFieldsSet.add('dueDate');
    }

    // Check status (required field)
    if (
      !invoice.status ||
      !['draft', 'proforma', 'issued'].includes(invoice.status)
    ) {
      errors.push('Invoice status is required');
      invalidFieldsSet.add('status');
    }

    return {
      isValid: errors.length === 0,
      errors,
      invalidFields: invalidFieldsSet,
    };
  };

  // UAE VAT COMPLIANCE: Issue Final Tax Invoice
  // This action is IRREVERSIBLE - invoice becomes a legal tax document
  const handleIssueInvoice = async () => {
    if (!invoice?.id) {
      notificationService.error(
        'Please save the invoice first before issuing.',
      );
      return;
    }

    if (isLocked) {
      notificationService.warning('This invoice has already been issued.');
      return;
    }

    // Validate allocation completeness for warehouse items
    const incompleteAllocations = [];
    (invoice.items || []).forEach((item, idx) => {
      if (item.sourceType === 'WAREHOUSE') {
        const allocatedQty = (item.allocations || []).reduce(
          (sum, a) => sum + parseFloat(a.quantity || 0),
          0,
        );
        const requiredQty = parseFloat(item.quantity) || 0;

        // VERIFICATION LOG: Allocation validation
        console.log(`[ISSUE VALIDATION] Line ${idx + 1}: ${item.name}`, {
          sourceType: item.sourceType,
          requiredQty,
          allocatedQty,
          allocations: item.allocations,
          allocationMode: item.allocationMode,
          shortfall: requiredQty - allocatedQty,
        });

        if (Math.abs(allocatedQty - requiredQty) > 0.001) {
          incompleteAllocations.push({
            index: idx + 1,
            name: item.name,
            required: requiredQty,
            allocated: allocatedQty,
          });
        }
      }
    });

    if (incompleteAllocations.length > 0) {
      console.error(
        '[ISSUE BLOCKED] Incomplete allocations detected:',
        incompleteAllocations,
      );
      const message = `Cannot issue invoice - incomplete allocations:\n\n${incompleteAllocations
        .map(
          (ia) =>
            `Line ${ia.index}: ${ia.name}\n  Required: ${ia.required.toFixed(3)}\n  Allocated: ${ia.allocated.toFixed(3)}`,
        )
        .join('\n\n')}`;

      notificationService.error(message);
      return;
    }

    // Confirm with user - this is irreversible
    const confirmed = window.confirm(
      'Issue Final Tax Invoice?\n\n' +
        'WARNING: Once issued, this invoice cannot be modified.\n' +
        'Any corrections must be made via Credit Note.\n\n' +
        'This action cannot be undone.\n\n' +
        'Are you sure you want to proceed?',
    );

    if (!confirmed) return;

    try {
      setIsSaving(true);
      const issuedInvoice = await invoiceService.issueInvoice(invoice.id);

      // Update local state with the issued invoice
      setInvoice((prev) => ({
        ...prev,
        ...issuedInvoice,
        status: 'issued',
      }));

      notificationService.success(
        'Invoice issued successfully as Final Tax Invoice. It is now locked and cannot be modified.',
      );
    } catch (error) {
      console.error('Failed to issue invoice:', error);
      notificationService.error(
        `Failed to issue invoice: ${error.response?.data?.message || error.message}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for preview button - validates before opening preview
  const handlePreviewClick = async () => {
    if (!company) {
      notificationService.warning(
        'Company data is still loading. Please wait...',
      );
      return;
    }

    // Refetch company data to ensure latest template colors are used
    try {
      await refetchCompany();
    } catch (error) {
      console.warn('Failed to refresh company data:', error);
      // Continue with cached data rather than blocking preview
    }

    // Validate required fields silently (don&apos;t show errors, just set flag)
    const validation = validateRequiredFields();
    setIsFormValidForSave(validation.isValid);

    // Always open preview - save button will be disabled if invalid
    setShowPreview(true);
  };

  const performSave = async (statusOverride = null) => {
    // Prevent double-saves
    if (isSaving) {
      return;
    }

    // Use statusOverride if provided (for Final Tax Invoice confirmation flow)
    // This ensures the status is correct regardless of React state timing issues
    const effectiveStatus = statusOverride || invoice.status;

    // DEBUG: Log status at start of performSave

    // Filter out empty placeholder items before validation
    // Placeholder items have no productId and no name - same logic as UI display
    // Note: Can't rely on quantity/rate since defaults are quantity=1, rate=0
    const nonBlankItems = (invoice.items || []).filter(
      (item) => item.productId || (item.name && item.name.trim() !== ''),
    );

    // Validate required fields before saving
    const errors = [];
    const invalidFieldsSet = new Set();

    // Check customer information
    if (!invoice.customer?.name || invoice.customer.name.trim() === '') {
      errors.push('Customer name is required');
      invalidFieldsSet.add('customer.name');
    }

    // Check if there are any items after filtering blanks
    if (!nonBlankItems || nonBlankItems.length === 0) {
      errors.push('At least one item is required');
    } else {
      // Validate each non-blank item
      nonBlankItems.forEach((item, index) => {
        if (!item.name || item.name.trim() === '') {
          errors.push(`Item ${index + 1}: Product name is required`);
          invalidFieldsSet.add(`item.${index}.name`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.quantity`);
        }
        if (!item.rate || item.rate <= 0) {
          errors.push(`Item ${index + 1}: Rate must be greater than 0`);
          invalidFieldsSet.add(`item.${index}.rate`);
        }
      });
    }

    // Check dates
    if (!invoice.date) {
      errors.push('Invoice date is required');
      invalidFieldsSet.add('date');
    }
    if (!invoice.dueDate) {
      errors.push('Due date is required');
      invalidFieldsSet.add('dueDate');
    }

    // Check status (required field) - use effectiveStatus for Final Tax Invoice flow
    if (
      !effectiveStatus ||
      !['draft', 'proforma', 'issued'].includes(effectiveStatus)
    ) {
      errors.push('Invoice status is required');
      invalidFieldsSet.add('status');
    }

    // If there are validation errors, show them and stop
    if (errors.length > 0) {
      setValidationErrors(errors);
      setInvalidFields(invalidFieldsSet);

      // Scroll to the first error (save button area) - instant to prevent layout shift
      setTimeout(() => {
        const errorAlert = document.getElementById('validation-errors-alert');
        if (errorAlert) {
          errorAlert.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      }, 100);

      setIsSaving(false); // Reset saving state on validation error
      return;
    }

    // Clear any previous validation errors
    setValidationErrors([]);
    setInvalidFields(new Set());

    setIsSaving(true);
    try {
      // Convert empty string values to numbers before saving
      // IMPORTANT: Use effectiveStatus to ensure correct status for Final Tax Invoice flow
      const processedInvoice = {
        ...invoice,
        status: effectiveStatus, // Use effectiveStatus, not invoice.status (fixes DFT- prefix bug)
        discountAmount:
          invoice.discountAmount === '' ? 0 : Number(invoice.discountAmount),
        discountPercentage:
          invoice.discountPercentage === ''
            ? 0
            : Number(invoice.discountPercentage),
        items: nonBlankItems.map((item) => ({
          ...item,
          quantity: item.quantity === '' ? 0 : Number(item.quantity),
          rate: item.rate === '' ? 0 : Number(item.rate),
          discount: item.discount === '' ? 0 : Number(item.discount),
          vatRate: item.vatRate === '' ? 0 : Number(item.vatRate),
          // Phase 2: Manual batch allocation - deterministic mapping from canonical allocations
          allocation_mode: item.allocationMode || 'AUTO_FIFO',
          manual_allocations: (item.allocations || []).map((a) => ({
            batch_id: a.batchId,
            quantity: a.quantity,
          })),
        })),
      };

      // VERIFICATION LOG: Save payload
      console.log('[SAVE VERIFICATION] Processed invoice payload:', {
        invoiceId: processedInvoice.id,
        status: processedInvoice.status,
        itemsCount: processedInvoice.items.length,
        items: processedInvoice.items.map((item, idx) => ({
          index: idx + 1,
          name: item.name,
          quantity: item.quantity,
          sourceType: item.sourceType,
          allocation_mode: item.allocation_mode,
          manual_allocations_count: item.manual_allocations?.length || 0,
          manual_allocations: item.manual_allocations,
        })),
      });

      if (id) {
        // Update existing invoice using cancel and recreate approach
        const updatedInvoice = await updateInvoice(
          invoice.id,
          processedInvoice,
        );
        if (onSave) onSave(updatedInvoice);

        // Navigate to the new invoice ID (backend creates new invoice using cancel-and-recreate)
        // The backend returns: { id: oldId, new_invoice_id: actualNewId }
        // We need to navigate to the NEW invoice to continue editing
        if (
          updatedInvoice.newInvoiceId &&
          updatedInvoice.newInvoiceId !== parseInt(id)
        ) {
          notificationService.success(
            'Invoice updated successfully! Original invoice cancelled, inventory movements reversed, new invoice created with updated data.',
          );
          // Navigate to new invoice ID with smooth transition (300ms)
          setTimeout(() => {
            navigate(`/edit/${updatedInvoice.newInvoiceId}`, { replace: true });
          }, 300);
        } else {
          notificationService.success(
            'Invoice updated successfully! Original invoice cancelled, inventory movements reversed, new invoice created with updated data.',
          );
        }
      } else {
        // Create new invoice
        const newInvoice = await saveInvoice(processedInvoice);
        if (onSave) onSave(newInvoice);

        // Update the form with the database-generated invoice number
        setInvoice((prev) => ({
          ...prev,
          invoiceNumber: newInvoice.invoiceNumber,
        }));

        // Store the created invoice ID for success modal
        setCreatedInvoiceId(newInvoice.id);

        // Close preview modal if it's open
        setShowPreview(false);

        // Phase 4: Finalize invoice with batch allocations
        // Check if invoice has warehouse items with allocations (lineItemTempId indicates Phase 3+ allocation)
        const warehouseItemsWithAllocations = invoice.items.filter(
          (item) => item.sourceType === 'WAREHOUSE' && item.lineItemTempId,
        );

        if (
          warehouseItemsWithAllocations.length > 0 &&
          newInvoice.items?.length > 0
        ) {
          try {
            // Build line item mappings from frontend items to backend items
            // Match by lineItemTempId which is stored in both
            const lineItemMappings = warehouseItemsWithAllocations
              .map((frontendItem) => {
                // Find corresponding backend item by line_item_temp_id
                const backendItem = newInvoice.items.find(
                  (bi) =>
                    bi.lineItemTempId === frontendItem.lineItemTempId ||
                    bi.line_item_temp_id === frontendItem.lineItemTempId,
                );
                if (backendItem) {
                  return {
                    lineItemTempId: frontendItem.lineItemTempId,
                    invoiceItemId: backendItem.id,
                  };
                }
                return null;
              })
              .filter(Boolean);

            if (lineItemMappings.length > 0) {
              console.log(
                '[InvoiceForm-Phase4] Finalizing invoice with',
                lineItemMappings.length,
                'line item mappings',
              );

              const finalizeResult =
                await batchReservationService.finalizeInvoice({
                  draftInvoiceId: newInvoice.id,
                  lineItemMappings,
                  targetStatus: effectiveStatus, // 'issued' or 'proforma'
                  skipStockDeduction: false,
                });

              if (finalizeResult.success) {
                console.log(
                  '[InvoiceForm-Phase4] Finalization successful:',
                  finalizeResult.invoiceNumber,
                );
                // Update invoice number if it was generated during finalization
                if (finalizeResult.invoiceNumber) {
                  setInvoice((prev) => ({
                    ...prev,
                    invoiceNumber: finalizeResult.invoiceNumber,
                  }));
                }
              } else {
                console.warn(
                  '[InvoiceForm-Phase4] Finalization returned success=false:',
                  finalizeResult.message,
                );
                notificationService.warning(
                  'Invoice saved but stock finalization incomplete. Please review.',
                );
              }
            }
          } catch (finalizeError) {
            console.error(
              '[InvoiceForm-Phase4] Finalization error:',
              finalizeError,
            );
            // Check for specific error types
            const errorMessage =
              finalizeError?.response?.data?.message ||
              finalizeError?.message ||
              'Unknown error';

            if (errorMessage.toLowerCase().includes('expired')) {
              notificationService.error(
                'Some batch reservations have expired. Invoice saved but stock not deducted. Please re-allocate batches.',
              );
            } else if (
              errorMessage.toLowerCase().includes('insufficient') ||
              errorMessage.toLowerCase().includes('stock')
            ) {
              notificationService.error(
                'Stock no longer available. Invoice saved but stock not deducted. Another user may have used the same batches.',
              );
            } else {
              notificationService.warning(
                `Invoice saved but finalization failed: ${errorMessage}`,
              );
            }
            // Continue - invoice is saved, just finalization failed
          }
        }

        // Phase 2.1: If invoice has pending confirmation, navigate to confirmation screen
        // NOTE: This is from the old Phase 2 flow - now superseded by Phase 4 finalize
        if (newInvoice.expiresAt) {
          notificationService.success(
            'Invoice created! Please confirm batch allocation within 5 minutes.',
          );
          navigate(`/invoices/${newInvoice.id}/confirm-allocation`);
          return;
        }

        // Show success modal with options
        setShowSuccessModal(true);

        // Trigger PDF button highlight animation for 3 seconds
        setPdfButtonHighlight(true);
        setTimeout(() => setPdfButtonHighlight(false), 3000);

        // OLD AUTO-NAVIGATION CODE (commented for easy revert):
        // notificationService.success("Invoice created successfully!");
        // setTimeout(() => {
        //   navigate('/invoices');
        // }, 1500);
      }
    } catch (error) {
      console.error('Error saving invoice:', error);

      // Extract detailed error message
      let errorMessage = 'Failed to save invoice. Please try again.';

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Check for duplicate invoice number error (from database unique constraint)
      if (
        errorMessage.toLowerCase().includes('duplicate') ||
        errorMessage.toLowerCase().includes('unique_invoice_number') ||
        error?.response?.status === 409
      ) {
        // If this is a NEW invoice (not an edit), auto-fetch next available number
        if (!id) {
          errorMessage = `Invoice number ${invoice.invoiceNumber} already exists. Fetching a new invoice number...`;
          notificationService.warning(errorMessage);

          // Refetch the next invoice number
          try {
            await refetchNextInvoice();
            notificationService.success(
              'New invoice number assigned. Please try saving again.',
            );
            return; // Exit early so user can try again with new number
          } catch (refetchError) {
            errorMessage = `Failed to get a new invoice number. Please refresh the page.`;
          }
        } else {
          errorMessage = `Invoice number ${invoice.invoiceNumber} already exists. This should not happen when editing. Please contact support.`;
        }
      }

      // Show detailed validation errors if available
      if (error?.response?.data?.details) {
        const details = error.response.data.details;
        if (Array.isArray(details)) {
          errorMessage += `\n${details.join('\n')}`;
        } else if (typeof details === 'object') {
          errorMessage += `\n${Object.entries(details)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('\n')}`;
        }
      }

      notificationService.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirmDialog(false);

    // Pass 'issued' explicitly since user confirmed Final Tax Invoice dialog
    // This ensures status is correct regardless of React state timing
    await performSave('issued');
  };

  const handleCancelSave = () => {
    setShowSaveConfirmDialog(false);
  };

  // Handle actions from success modal
  const handleSuccessDownloadPDF = async () => {
    setShowSuccessModal(false);

    // Wait for modal close animation, then trigger PDF download and navigate
    setTimeout(async () => {
      await handleDownloadPDF();
      notificationService.success(
        'Invoice created successfully! PDF downloaded.',
      );

      // Navigate after PDF download completes (smooth transition)
      navigate('/invoices');
    }, 300);
  };

  const handleSuccessGoToList = () => {
    setShowSuccessModal(false);

    // Smooth transition delay for modal close animation
    setTimeout(() => {
      notificationService.success('Invoice created successfully!');
      navigate('/invoices');
    }, 300);
  };

  // Navigate to invoice list and auto-open payment drawer
  const handleSuccessRecordPayment = () => {
    setShowSuccessModal(false);

    // Navigate to invoice list with query param to auto-open payment drawer
    setTimeout(() => {
      navigate(`/invoices?openPayment=${createdInvoiceId}`);
    }, 300);
  };

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);

    // Navigate to edit mode to prevent duplicate creation
    // User can continue viewing/editing the invoice
    if (createdInvoiceId) {
      navigate(`/edit/${createdInvoiceId}`);
      notificationService.success(
        'Invoice created successfully! Now in edit mode.',
      );
    }
  }, [createdInvoiceId, navigate]);

  // Phase 4: Removed drop-ship popup handlers - now using inline SourceTypeSelector dropdown

  // Handle ESC key to close success modal (only for Draft/Proforma, not Final Tax Invoice)
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showSuccessModal) {
        // Only allow ESC to close for Draft and Proforma invoices
        const isFinalTaxInvoice = invoice.status === 'issued';
        if (!isFinalTaxInvoice) {
          handleSuccessModalClose();
        }
      }
    };

    if (showSuccessModal) {
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [
    showSuccessModal,
    createdInvoiceId,
    invoice.status,
    handleSuccessModalClose,
  ]);

  const handleDownloadPDF = useCallback(async () => {
    // Use either the route ID or the newly created invoice ID
    const invoiceId = id || createdInvoiceId;

    // Require invoice to be saved first
    if (!invoiceId) {
      notificationService.warning(
        'Please save the invoice first before downloading PDF',
      );
      return;
    }

    // If company details still loading, set a pending flag and retry when ready
    if (loadingCompany) {
      setPdfPending(true);
      notificationService.info(
        'Loading company details… Will download when ready.',
      );
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Use backend API to generate searchable text PDF with proper fonts and margins
      await invoicesAPI.downloadPDF(invoiceId);
      notificationService.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      notificationService.error(`PDF generation failed: ${error.message}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [id, createdInvoiceId, loadingCompany]);

  // Auto-retry PDF generation once company finishes loading if user requested it
  const [pdfPending, setPdfPending] = useState(false);
  useEffect(() => {
    if (pdfPending && !loadingCompany) {
      setPdfPending(false);
      // Retry PDF download now that company details are loaded
      handleDownloadPDF();
    }
  }, [pdfPending, loadingCompany, handleDownloadPDF]);

  // ============================================================
  // KEYBOARD SHORTCUTS - Scoped to this page only
  // ============================================================
  useKeyboardShortcuts(
    {
      [INVOICE_SHORTCUTS.SAVE]: () => {
        // Ctrl+S - Save invoice
        if (!isSaving && !savingInvoice && !updatingInvoice) {
          handleSave();
        }
      },
      [INVOICE_SHORTCUTS.PREVIEW]: () => {
        // Ctrl+P - Preview invoice (override browser print)
        if (!showPreview) {
          handlePreviewClick();
        }
      },
      [INVOICE_SHORTCUTS.CLOSE]: () => {
        // Escape - Close modals or go back
        if (showSuccessModal) {
          handleSuccessModalClose();
        } else if (showSaveConfirmDialog) {
          handleCancelSave();
        } else if (showFormSettings) {
          setShowFormSettings(false);
        }
      },
    },
    {
      enabled: !showPreview, // Disable when preview is open (it has its own handlers)
      allowInInputs: ['escape'], // Allow Escape in inputs to close modals
    },
  );

  if (showPreview) {
    // Preview is view-only - no Save button per unified design rules
    // User must close preview and save from form
    return (
      <InvoicePreview
        invoice={invoice}
        company={company || {}}
        onClose={() => setShowPreview(false)}
        invoiceId={id}
        template={currentTemplate}
      />
    );
  }

  if (loadingInvoice) {
    return (
      <div
        className={`h-full flex items-center justify-center ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="lg" />
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Loading invoice...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`min-h-screen pb-32 md:pb-6 ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        {/* Sticky Header - Mobile & Desktop */}
        <header
          className={`sticky top-0 z-20 backdrop-blur-md border-b ${
            isDarkMode
              ? 'bg-gray-900/92 border-gray-700'
              : 'bg-white/92 border-gray-200'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/invoices')}
                  className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    isDarkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-label="Back to invoices"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1
                    className={`text-lg md:text-xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {id ? 'Edit Invoice' : 'New Invoice'}
                  </h1>
                  <p
                    className={`text-xs md:text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {invoice.invoiceNumber || 'Invoice #'}
                  </p>
                </div>
              </div>

              <div className="hidden md:flex gap-2 items-start relative">
                {/* Settings Icon */}
                <button
                  onClick={() => setShowFormSettings(!showFormSettings)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-label="Form settings"
                  title="Form Settings"
                >
                  <Settings className="h-5 w-5" />
                </button>

                {/* Settings Panel */}
                <FormSettingsPanel
                  isOpen={showFormSettings}
                  onClose={() => setShowFormSettings(false)}
                  preferences={formPreferences}
                  onPreferenceChange={(key, value) => {
                    setFormPreferences((prev) => ({
                      ...prev,
                      [key]: value,
                    }));
                  }}
                />

                <Button
                  variant="outline"
                  onClick={handlePreviewClick}
                  disabled={loadingCompany}
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <div className="flex flex-col items-start">
                  <Button
                    ref={saveButtonRef}
                    onClick={handleSave}
                    disabled={
                      savingInvoice || updatingInvoice || isSaving || isLocked
                    }
                    title={
                      isLocked
                        ? 'Invoice is locked (24h edit window expired)'
                        : isRevisionMode
                          ? `Save revision (${hoursRemainingInEditWindow}h remaining)`
                          : `Save as draft (${getShortcutDisplayString(INVOICE_SHORTCUTS.SAVE)})`
                    }
                  >
                    {savingInvoice || updatingInvoice || isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {savingInvoice || updatingInvoice || isSaving
                      ? 'Saving...'
                      : isRevisionMode
                        ? 'Save Revision'
                        : 'Save Draft'}
                  </Button>
                  {isRevisionMode && (
                    <span
                      className={`text-[10px] mt-1 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}
                    >
                      {hoursRemainingInEditWindow}h left to edit
                    </span>
                  )}
                </div>

                {/* UAE VAT: Issue Final Tax Invoice Button - Only for drafts, not revisions */}
                {id &&
                  !isLocked &&
                  !isRevisionMode &&
                  invoice.status !== 'issued' && (
                  <div className="flex flex-col items-center">
                    <Button
                      variant="success"
                      onClick={handleIssueInvoice}
                      disabled={savingInvoice || updatingInvoice || isSaving}
                      title="Issue as Final Tax Invoice (locks invoice permanently)"
                      className="bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600"
                    >
                      <Download className="h-4 w-4" />
                        Issue Final Invoice
                    </Button>
                    <span
                      className={`text-[10px] mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                    >
                        Once issued, cannot be edited
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - 12-column grid layout (8+4) */}
        <main className="max-w-[1400px] mx-auto px-4 py-4">
          <div className="grid grid-cols-12 gap-3">
            {/* Left Panel (8 cols) - Main Form Content */}
            <div className="col-span-12 lg:col-span-8 space-y-3">
              {/* UAE VAT COMPLIANCE: Locked Invoice Warning Banner */}
              {isLocked && (
                <div
                  className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
                    isDarkMode
                      ? 'bg-amber-900/20 border-amber-600 text-amber-200'
                      : 'bg-amber-50 border-amber-500 text-amber-800'
                  }`}
                >
                  <AlertTriangle
                    className={`flex-shrink-0 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}
                    size={24}
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-lg">
                      Final Tax Invoice - Locked
                    </h4>
                    <p className="text-sm mt-1">
                      This invoice has been issued as a Final Tax Invoice and
                      cannot be modified. UAE VAT compliance requires any
                      corrections to be made via Credit Note.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() =>
                        navigate(`/credit-notes/new?invoiceId=${invoice.id}`)
                      }
                    >
                      Create Credit Note
                    </Button>
                  </div>
                </div>
              )}

              {/* Validation Errors Alert */}
              {validationErrors.length > 0 && (
                <div
                  id="validation-errors-alert"
                  className={`mt-6 p-4 rounded-lg border-2 ${
                    isDarkMode
                      ? 'bg-red-900/20 border-red-600 text-red-200'
                      : 'bg-red-50 border-red-500 text-red-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={`flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
                      size={24}
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-2">
                        Please fix the following errors:
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {validationErrors.map((error, index) => {
                          // Parse error to extract field name for scrolling
                          let fieldName = null;
                          if (error.includes('Customer'))
                            fieldName = 'customer.name';
                          else if (error.includes('Invoice date'))
                            fieldName = 'date';
                          else if (error.includes('Due date'))
                            fieldName = 'dueDate';
                          else if (error.match(/Item \d+/)) {
                            const match = error.match(/Item (\d+)/);
                            if (match) {
                              const itemNum = parseInt(match[1], 10) - 1; // Convert to 0-indexed
                              if (error.includes('Rate'))
                                fieldName = `item.${itemNum}.rate`;
                              else if (error.includes('Quantity'))
                                fieldName = `item.${itemNum}.quantity`;
                              else if (error.includes('Product'))
                                fieldName = `item.${itemNum}.name`;
                              else fieldName = `item.${itemNum}`;
                            }
                          }

                          return (
                            <li key={index}>
                              <button
                                onClick={() =>
                                  fieldName && scrollToField(fieldName)
                                }
                                disabled={!fieldName}
                                className={`flex items-center gap-2 w-full text-left ${fieldName ? 'cursor-pointer hover:underline hover:text-red-400' : 'opacity-60 cursor-default'}`}
                                title={
                                  fieldName ? 'Click to scroll to field' : ''
                                }
                              >
                                <span className="text-red-500">•</span>
                                <span>{error}</span>
                                {fieldName && (
                                  <span className="text-xs opacity-60">↓</span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                      <button
                        onClick={() => {
                          setValidationErrors([]);
                          setInvalidFields(new Set());
                        }}
                        className={`mt-3 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          isDarkMode
                            ? 'bg-red-800 hover:bg-red-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Two-Column Header Layout - Customer/Sales + Invoice Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* LEFT COLUMN: Customer & Sales Information */}
                <Card
                  className={`p-3 md:p-4 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}
                >
                  {/* Customer Selection - Priority #1 */}
                  <div className="mb-4" ref={customerRef}>
                    <h3
                      className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Customer Information
                    </h3>
                    {/* Customer Selector - Enhanced with Search */}
                    <div className="space-y-0.5">
                      <Autocomplete
                        label="Select Customer"
                        data-testid="customer-autocomplete"
                        options={(customersData?.customers || []).map((c) => ({
                          id: c.id,
                          label: `${titleCase(normalizeLLC(c.name))} - ${c.email || 'No email'}`,
                          name: c.name,
                          email: c.email,
                          phone: c.phone,
                        }))}
                        value={
                          invoice.customer.id
                            ? {
                              id: invoice.customer.id,
                              label: `${titleCase(normalizeLLC(invoice.customer.name))} - ${invoice.customer.email || 'No email'}`,
                            }
                            : null
                        }
                        onChange={(e, selected) => {
                          if (selected?.id) {
                            handleCustomerSelect(selected.id);
                            // Show selected customer name in the input field
                            setCustomerSearchInput(
                              titleCase(normalizeLLC(selected.name || '')),
                            );
                          }
                        }}
                        inputValue={customerSearchInput}
                        onInputChange={(e, value) =>
                          setCustomerSearchInput(value)
                        }
                        placeholder="Search customers by name or email..."
                        disabled={loadingCustomers}
                        noOptionsText={
                          loadingCustomers
                            ? 'Loading customers...'
                            : 'No customers found'
                        }
                        error={invalidFields.has('customer.name')}
                        className="text-base"
                        required={true}
                        validationState={fieldValidation.customer}
                        showValidation={
                          formPreferences.showValidationHighlighting
                        }
                      />
                      {invalidFields.has('customer.name') && (
                        <p
                          className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
                        >
                          Customer is required
                        </p>
                      )}
                    </div>

                    {/* Display customer details - always visible */}
                    <div
                      className={`p-4 rounded-lg border ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-gray-100 border-gray-200'
                      }`}
                    >
                      <h4
                        className={`font-medium mb-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {invoice.customer.name
                          ? 'Selected Customer:'
                          : 'Customer Details:'}
                      </h4>
                      <div
                        className={`space-y-1 text-sm ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        <p>
                          <span className="font-medium">Name:</span>{' '}
                          {invoice.customer.name
                            ? titleCase(normalizeLLC(invoice.customer.name))
                            : ''}
                        </p>
                        <p>
                          <span className="font-medium">Email:</span>{' '}
                          {invoice.customer.email || ''}
                        </p>
                        <p>
                          <span className="font-medium">Phone:</span>{' '}
                          {invoice.customer.phone || ''}
                        </p>
                        <p>
                          <span className="font-medium">TRN:</span>{' '}
                          {invoice.customer.vatNumber || ''}
                        </p>
                        <p>
                          <span className="font-medium">Address:</span>{' '}
                          {invoice.customer.address?.street ||
                          invoice.customer.address?.city
                            ? [
                              invoice.customer.address.street,
                              invoice.customer.address.city,
                              invoice.customer.address.emirate,
                              invoice.customer.address.poBox,
                            ]
                              .filter(Boolean)
                              .join(', ')
                            : ''}
                        </p>
                        <p className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                          <span className="font-medium">Price List:</span>{' '}
                          {pricelistName && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                              {pricelistName}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Trade License Status Alert */}
                    {showTradeLicenseAlert && tradeLicenseStatus && (
                      <Alert
                        variant="warning"
                        onClose={() => setShowTradeLicenseAlert(false)}
                      >
                        <div>
                          <h4 className="font-medium mb-1">
                            Trade License Alert
                          </h4>
                          <p className="text-sm">
                            {tradeLicenseStatus.message}
                          </p>
                          {tradeLicenseStatus.licenseNumber && (
                            <p className="text-sm mt-1">
                              <span className="font-medium">
                                License Number:
                              </span>{' '}
                              {tradeLicenseStatus.licenseNumber}
                            </p>
                          )}
                          {tradeLicenseStatus.expiryDate && (
                            <p className="text-sm">
                              <span className="font-medium">Expiry Date:</span>{' '}
                              {new Date(
                                tradeLicenseStatus.expiryDate,
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </Alert>
                    )}

                    {loadingCustomers && (
                      <div className="flex items-center space-x-2">
                        <LoadingSpinner size="sm" />
                        <span
                          className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          Loading customers...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sales Agent Selection */}
                  <div
                    className="border-t pt-4 mt-4"
                    style={{
                      borderColor: isDarkMode
                        ? 'rgb(75 85 99)'
                        : 'rgb(229 231 235)',
                    }}
                  >
                    <h3
                      className={`text-xs font-semibold uppercase tracking-wide mb-3 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      Sales Information
                    </h3>
                    <FormSelect
                      label="Sales Agent (Optional)"
                      value={invoice.salesAgentId || 'none'}
                      onValueChange={(value) => handleSalesAgentSelect(value)}
                      disabled={loadingAgents}
                      className="text-base"
                    >
                      <SelectItem value="none">No sales agent</SelectItem>
                      {(salesAgentsData?.data || []).map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.fullName || agent.username}
                          {agent.defaultCommissionRate
                            ? ` (${agent.defaultCommissionRate}% commission)`
                            : ''}
                        </SelectItem>
                      ))}
                    </FormSelect>
                    {loadingAgents && (
                      <div className="flex items-center space-x-2 mt-2">
                        <LoadingSpinner size="sm" />
                        <span
                          className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          Loading sales agents...
                        </span>
                      </div>
                    )}

                    {/* Commission Details - Only shown when sales agent is selected */}
                    {invoice.salesAgentId && (
                      <div
                        className="border-t pt-4 mt-4"
                        style={{
                          borderColor: isDarkMode
                            ? 'rgb(75 85 99)'
                            : 'rgb(229 231 235)',
                        }}
                      >
                        <div className="space-y-3">
                          <Input
                            label="Commission Percentage (%)"
                            type="number"
                            value={invoice.commissionPercentage || 10}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '') {
                                setInvoice((prev) => ({
                                  ...prev,
                                  commissionPercentage: 0,
                                }));
                                return;
                              }
                              const num = Number(raw);
                              if (Number.isNaN(num)) return;
                              const clamped = Math.max(0, Math.min(100, num));
                              setInvoice((prev) => ({
                                ...prev,
                                commissionPercentage: clamped,
                              }));
                            }}
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="10.00"
                            inputMode="decimal"
                            onKeyDown={(e) => {
                              const blocked = ['e', 'E', '+', '-'];
                              if (blocked.includes(e.key)) e.preventDefault();
                            }}
                            disabled={isLocked}
                            className="text-base"
                          />
                          <div
                            className={`p-3 rounded ${
                              isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                            }`}
                          >
                            <p
                              className={`text-xs ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              } mb-2`}
                            >
                              Commission Amount (Accrual)
                            </p>
                            <p
                              className={`text-lg font-bold ${
                                isDarkMode ? 'text-teal-400' : 'text-teal-600'
                              }`}
                            >
                              AED{' '}
                              {(
                                (computedTotal *
                                  (invoice.commissionPercentage || 10)) /
                                100
                              ).toFixed(2)}
                            </p>
                            <p
                              className={`text-xs ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              } mt-2`}
                            >
                              Accrues when invoice is issued. 15-day grace
                              period for adjustments.
                            </p>
                          </div>
                          {id && invoice.commissionStatus && (
                            <div
                              className={`p-3 rounded border ${
                                isDarkMode
                                  ? 'bg-gray-700 border-gray-600'
                                  : 'bg-blue-50 border-blue-200'
                              }`}
                            >
                              <p
                                className={`text-xs font-semibold ${
                                  isDarkMode ? 'text-blue-300' : 'text-blue-800'
                                } mb-1`}
                              >
                                Commission Status
                              </p>
                              <p
                                className={`text-sm font-medium ${
                                  invoice.commissionStatus === 'PAID'
                                    ? 'text-green-600'
                                    : invoice.commissionStatus === 'APPROVED'
                                      ? 'text-blue-600'
                                      : invoice.commissionStatus === 'PENDING'
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                }`}
                              >
                                {invoice.commissionStatus}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* RIGHT COLUMN: Invoice Details */}
                <Card
                  className={`p-3 md:p-4 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}
                >
                  <h3
                    className={`text-xs font-semibold uppercase tracking-wide mb-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Invoice Details
                  </h3>
                  <div className="space-y-4">
                    {/* Invoice Number and Status - Invoice identity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        label="Invoice Number"
                        value={invoice.invoiceNumber}
                        readOnly
                        className="text-base bg-gray-50"
                        placeholder="Auto-generated on save"
                      />
                      <FormSelect
                        label="Invoice Status"
                        value={invoice.status}
                        required={true}
                        validationState={fieldValidation.status}
                        onValueChange={(newStatus) => {
                          setInvoice((prev) => ({
                            ...prev,
                            status: newStatus,
                            invoiceNumber: !id
                              ? withStatusPrefix(prev.invoiceNumber, newStatus)
                              : prev.invoiceNumber,
                          }));
                          validateField('status', newStatus);
                        }}
                        className="text-base"
                      >
                        <SelectItem value="draft">Draft Invoice</SelectItem>
                        <SelectItem value="proforma">
                          Proforma Invoice
                        </SelectItem>
                        <SelectItem value="issued">
                          Final Tax Invoice
                        </SelectItem>
                      </FormSelect>
                    </div>

                    {/* Invoice Date and Due Date - Date fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        label="Invoice Date"
                        type="date"
                        value={formatDateForInput(invoice.date)}
                        readOnly
                        error={invalidFields.has('date')}
                        className="text-base"
                      />
                      <div ref={dueDateRef}>
                        <Input
                          label="Due Date"
                          type="date"
                          value={formatDateForInput(invoice.dueDate)}
                          min={dueMinStr}
                          max={dueMaxStr}
                          required={true}
                          validationState={fieldValidation.dueDate}
                          showValidation={
                            formPreferences.showValidationHighlighting
                          }
                          error={invalidFields.has('dueDate')}
                          onChange={(e) => {
                            const v = e.target.value;
                            let validatedValue = v;
                            if (v && v < dueMinStr) validatedValue = dueMinStr;
                            if (v && v > dueMaxStr) validatedValue = dueMaxStr;
                            setInvoice((prev) => ({
                              ...prev,
                              dueDate: validatedValue,
                            }));
                            validateField('dueDate', validatedValue);
                          }}
                          className="text-base"
                        />
                      </div>
                    </div>

                    {/* Payment Terms and Currency - Transaction settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <FormSelect
                        label="Payment Terms"
                        value={invoice.modeOfPayment || ''}
                        required={false}
                        validationState={fieldValidation.paymentMode}
                        onValueChange={(value) => {
                          setInvoice((prev) => ({
                            ...prev,
                            modeOfPayment: value,
                          }));
                          validateField('paymentMode', value);
                          // Auto-focus to next mandatory field after payment terms selection
                          if (value) {
                            setTimeout(() => focusNextMandatoryField(), 100);
                          }
                        }}
                        className="text-base"
                      >
                        {Object.values(PAYMENT_MODES).map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.icon} {mode.label}
                          </SelectItem>
                        ))}
                      </FormSelect>
                      <FormSelect
                        label="Currency"
                        value={invoice.currency || 'AED'}
                        required={true}
                        validationState={fieldValidation.currency}
                        onValueChange={(value) => {
                          setInvoice((prev) => ({
                            ...prev,
                            currency: value,
                          }));
                          validateField('currency', value);
                        }}
                        className="text-base"
                      >
                        <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                        <SelectItem value="USD">USD (US Dollar)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                        <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                        <SelectItem value="QAR">QAR (Qatari Riyal)</SelectItem>
                        <SelectItem value="OMR">OMR (Omani Rial)</SelectItem>
                        <SelectItem value="BHD">
                          BHD (Bahraini Dinar)
                        </SelectItem>
                        <SelectItem value="KWD">KWD (Kuwaiti Dinar)</SelectItem>
                      </FormSelect>
                    </div>

                    {/* Warehouse - Only shown when warehouse items exist */}
                    {needsWarehouseSelector && (
                      <div className="grid grid-cols-1 gap-2">
                        <FormSelect
                          label="Warehouse"
                          value={invoice.warehouseId || ''}
                          required={invoice.status !== 'draft'}
                          validationState={fieldValidation.warehouse}
                          onValueChange={(warehouseId) => {
                            const w = warehouses.find(
                              (wh) => wh.id.toString() === warehouseId,
                            );
                            setInvoice((prev) => ({
                              ...prev,
                              warehouseId,
                              warehouseName: w ? w.name : '',
                              warehouseCode: w ? w.code : '',
                              warehouseCity: w ? w.city : '',
                            }));
                            validateField('warehouse', warehouseId);
                          }}
                          className="text-base"
                        >
                          {warehouses.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name} - {w.city}
                            </SelectItem>
                          ))}
                        </FormSelect>
                      </div>
                    )}

                    {/* Customer PO Fields - Customer reference info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        label="Customer PO Number"
                        value={invoice.customerPurchaseOrderNumber || ''}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            customerPurchaseOrderNumber: e.target.value,
                          }))
                        }
                        placeholder="PO number"
                        className="text-base"
                      />
                      <Input
                        label="Customer PO Date"
                        type="date"
                        value={invoice.customerPurchaseOrderDate || ''}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            customerPurchaseOrderDate: e.target.value,
                          }))
                        }
                        className="text-base"
                      />
                    </div>

                    {/* VAT Compliance Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <FormSelect
                        label={
                          <span className="inline-flex items-center gap-1">
                            <span>
                              Place of Supply
                              {invoice.status === 'issued' && (
                                <span className="text-red-500 ml-0.5">*</span>
                              )}
                            </span>
                            <VatHelpIcon
                              content={[
                                'When required: Mandatory for all invoices.',
                                'Specifies which Emirate the supply is made from.',
                                'Used for compliance with FTA Form 201.',
                              ]}
                            />
                          </span>
                        }
                        value={invoice.placeOfSupply || ''}
                        validationState={fieldValidation.placeOfSupply}
                        onValueChange={(value) => {
                          setInvoice((prev) => ({
                            ...prev,
                            placeOfSupply: value,
                          }));
                          validateField('placeOfSupply', value);
                        }}
                        className="text-base"
                      >
                        {UAE_EMIRATES.map((emirate) => (
                          <SelectItem key={emirate} value={emirate}>
                            {emirate}
                          </SelectItem>
                        ))}
                      </FormSelect>
                      <Input
                        label={
                          <span className="inline-flex items-center gap-1">
                            <span>Supply Date</span>
                            <VatHelpIcon
                              content={[
                                'When required: Mandatory. Determines VAT liability date.',
                                'Must be the date supply is made (goods delivered/services rendered).',
                                'Defaults to invoice date if empty.',
                              ]}
                            />
                          </span>
                        }
                        type="date"
                        value={invoice.supplyDate || ''}
                        validationState={fieldValidation.supplyDate}
                        showValidation={
                          formPreferences.showValidationHighlighting
                        }
                        onChange={(e) => {
                          setInvoice((prev) => ({
                            ...prev,
                            supplyDate: e.target.value,
                          }));
                          validateField('supplyDate', e.target.value);
                        }}
                        className="text-base"
                      />
                    </div>

                    {/* Exchange Rate Date - Conditional (shown for foreign currency) */}
                    {invoice.currency && invoice.currency !== 'AED' && (
                      <Input
                        label="Exchange Rate Date"
                        type="date"
                        value={invoice.exchangeRateDate || ''}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            exchangeRateDate: e.target.value,
                          }))
                        }
                        className="text-base"
                      />
                    )}
                  </div>
                </Card>
              </div>

              {/* Items Section - Responsive */}
              <Card
                className={`p-3 md:p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                ref={itemsRef}
              >
                <div className="mb-4 flex justify-between items-center">
                  <h3
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Line Items
                    {useDrawerMode &&
                      invoice.items.filter((i) => i.productId).length > 0 && (
                      <span className="ml-2 text-teal-600">
                          ({invoice.items.filter((i) => i.productId).length}{' '}
                          items)
                      </span>
                    )}
                  </h3>
                  {useDrawerMode && (
                    <button
                      type="button"
                      onClick={() => setShowAddProductDrawer(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        isDarkMode
                          ? 'bg-teal-600 hover:bg-teal-500 text-white'
                          : 'bg-teal-600 hover:bg-teal-700 text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Item
                    </button>
                  )}
                </div>

                {/* DRAWER MODE: Read-Only Line Items Display */}
                {useDrawerMode ? (
                  <div className="overflow-x-auto">
                    {/* Empty state when no items */}
                    {invoice.items.filter((item) => item.productId || item.name)
                      .length === 0 ? (
                        <div
                          className={`text-center py-8 px-4 border-2 border-dashed rounded-lg ${
                            isDarkMode
                              ? 'border-gray-600 text-gray-400'
                              : 'border-gray-300 text-gray-500'
                          }`}
                        >
                          <List className="mx-auto h-10 w-10 mb-2 opacity-50" />
                          <p className="text-sm font-medium mb-1">
                          No line items yet
                          </p>
                          <p className="text-xs opacity-75">
                          Search for products in the panel on the right and
                          click &quot;Add to Invoice&quot;
                          </p>
                        </div>
                      ) : (
                        <table
                          className={`min-w-full table-fixed divide-y ${
                            isDarkMode ? 'divide-gray-600' : 'divide-gray-200'
                          }`}
                        >
                          <thead className="bg-teal-600">
                            <tr className="h-10">
                              <th className="py-2 px-2 text-center text-[11px] font-bold uppercase tracking-wide text-white w-10">
                              #
                              </th>
                              <th
                                className="pl-3 pr-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white"
                                style={{ width: '35%' }}
                              >
                              Product
                              </th>
                              <th className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-white w-24">
                              Qty
                              </th>
                              <th className="px-2 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white w-24">
                              Rate
                              </th>
                              <th className="px-2 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white w-28">
                              Amount
                              </th>
                              <th className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-white w-16">
                              Status
                              </th>
                              <th className="py-2 px-2 text-center text-[11px] font-bold uppercase tracking-wide text-white w-10"></th>
                            </tr>
                          </thead>
                          <tbody
                            className={`divide-y ${
                              isDarkMode
                                ? 'bg-gray-800 divide-gray-600'
                                : 'bg-white divide-gray-200'
                            }`}
                          >
                            {invoice.items
                              .filter((item) => item.productId || item.name)
                              .map((item, index) => {
                                const statusInfo = getLineItemStatusIcon(item);
                                return (
                                  <tr
                                    key={
                                      item.lineItemTempId ||
                                    item.id ||
                                    `item-${index}`
                                    }
                                    className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                                  >
                                    {/* # */}
                                    <td className="py-2 px-2 text-center text-sm">
                                      {index + 1}
                                    </td>
                                    {/* Product */}
                                    <td className="pl-3 pr-2 py-2">
                                      <div>
                                        <div
                                          className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                        >
                                          {item.name || 'Unnamed Product'}
                                        </div>
                                        {/* Phase 4: Display batch allocations from saved consumptions or draft allocations */}
                                        {item.sourceType === 'WAREHOUSE' && (() => {
                                        // Use saved consumptions for finalized invoices, draft allocations otherwise
                                          const savedConsumption = savedConsumptionsByItemId[item.id];
                                          const displayAllocations = savedConsumption?.consumptions?.length > 0
                                            ? savedConsumption.consumptions
                                            : item.allocations || [];

                                          if (displayAllocations.length === 0) return null;

                                          return (
                                            <div className="text-xs text-gray-500 mt-0.5">
                                              {displayAllocations
                                                .slice(0, 2)
                                                .map((alloc, i) => (
                                                  <span key={i}>
                                                    {alloc.batchNumber || `Batch ${alloc.batchId}`}
                                                  :{' '}
                                                    {parseFloat(
                                                      alloc.quantity || alloc.quantityConsumed || 0,
                                                    ).toFixed(0)}{' '}
                                                  kg
                                                    {i <
                                                    Math.min(
                                                      displayAllocations.length - 1,
                                                      1,
                                                    ) && ', '}
                                                  </span>
                                                ))}
                                              {displayAllocations.length > 2 && (
                                                <span className="text-teal-600">
                                                  {' '}
                                                +{displayAllocations.length - 2}{' '}
                                                more
                                                </span>
                                              )}
                                              {savedConsumption && (
                                                <span className="ml-1 text-green-600" title="Saved to database">
                                                ✓
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })()}
                                        {(item.sourceType === 'LOCAL_DROP_SHIP' ||
                                        item.sourceType ===
                                          'IMPORT_DROP_SHIP') && (
                                          <div className="text-xs text-blue-500 mt-0.5">
                                            {item.sourceType === 'LOCAL_DROP_SHIP'
                                              ? 'Local Drop-Ship'
                                              : 'Import Drop-Ship'}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    {/* Qty */}
                                    <td className="px-2 py-2 text-center text-sm">
                                      {item.quantity || 0}{' '}
                                      {item.quantityUom || 'KG'}
                                    </td>
                                    {/* Rate */}
                                    <td className="px-2 py-2 text-right text-sm">
                                      {formatCurrency(item.rate || 0)}
                                    </td>
                                    {/* Amount */}
                                    <td className="px-2 py-2 text-right text-sm font-medium">
                                      <div>
                                        {formatCurrency(
                                          item.amount ||
                                          item.quantity * item.rate ||
                                          0,
                                        )}
                                      </div>
                                      {/* Phase 7: Line item cost/margin display for confirmed invoices */}
                                      {item.costPrice > 0 && (
                                        <div className={`text-[10px] mt-0.5 ${item.marginPercent >= 15 ? 'text-green-500' : item.marginPercent >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                                        Cost: {formatCurrency(item.costPrice)} | {item.marginPercent?.toFixed(1) || 0}%
                                        </div>
                                      )}
                                    </td>
                                    {/* Status Icon */}
                                    <td className="px-2 py-2 text-center">
                                      <span
                                        className={statusInfo.className}
                                        title={statusInfo.title}
                                      >
                                        {statusInfo.icon === 'check' && (
                                          <CheckCircle className="w-5 h-5 inline" />
                                        )}
                                        {statusInfo.icon === 'partial' && (
                                          <AlertTriangle className="w-5 h-5 inline" />
                                        )}
                                        {statusInfo.icon === 'empty' && (
                                          <span className="inline-block w-5 h-5 rounded-full border-2 border-current"></span>
                                        )}
                                        {statusInfo.icon === 'ship' && (
                                          <span className="text-lg">🚢</span>
                                        )}
                                      </span>
                                    </td>
                                    {/* Delete */}
                                    <td className="py-2 px-2 text-center">
                                      <button
                                        onClick={() => {
                                          if (
                                            window.confirm(
                                              `Delete "${item.name}"?`,
                                            )
                                          ) {
                                            if (item.lineItemTempId) {
                                              handleDeleteLineItem(
                                                item.lineItemTempId,
                                              );
                                            } else {
                                              removeItem(
                                                invoice.items.findIndex(
                                                  (i) => i.id === item.id,
                                                ),
                                              );
                                            }
                                          }
                                        }}
                                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                        title="Delete item"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      )}
                  </div>
                ) : (
                  /* LEGACY MODE: Editable Line Items Table */
                  <>
                    {/* Quick Add Speed Buttons - Pinned & Top Products */}
                    {formPreferences.showSpeedButtons && (
                      <div className="mb-4">
                        <p
                          className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          Quick Add (Pinned & Top Products)
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {sortedProducts.slice(0, 8).map((product) => {
                            const isPinned = pinnedProductIds.includes(
                              product.id,
                            );
                            return (
                              <div key={product.id} className="relative group">
                                <button
                                  onClick={() => {
                                    // Check if product already exists - if so, increment quantity directly
                                    const existingIndex = findDuplicateProduct(
                                      product.id,
                                      -1,
                                    );
                                    if (
                                      existingIndex !== -1 &&
                                      existingIndex !== null
                                    ) {
                                      // Product exists - increment quantity and recalculate amount
                                      setInvoice((prev) => {
                                        const newItems = [...prev.items];
                                        const existingItem =
                                          newItems[existingIndex];
                                        const newQuantity =
                                          (existingItem.quantity || 0) + 1;
                                        // Recalculate theoretical weight
                                        let theoreticalWeightKg =
                                          existingItem.theoreticalWeightKg;
                                        if (
                                          existingItem.unitWeightKg &&
                                          existingItem.quantityUom === 'PCS'
                                        ) {
                                          theoreticalWeightKg =
                                            newQuantity *
                                            existingItem.unitWeightKg;
                                        } else if (
                                          existingItem.quantityUom === 'MT'
                                        ) {
                                          theoreticalWeightKg =
                                            newQuantity * 1000;
                                        } else if (
                                          existingItem.quantityUom === 'KG'
                                        ) {
                                          theoreticalWeightKg = newQuantity;
                                        }
                                        newItems[existingIndex] = {
                                          ...existingItem,
                                          quantity: newQuantity,
                                          theoreticalWeightKg,
                                          amount: calculateItemAmount(
                                            newQuantity,
                                            existingItem.rate,
                                            existingItem.pricingBasis,
                                            existingItem.unitWeightKg,
                                            existingItem.quantityUom,
                                          ),
                                        };
                                        return { ...prev, items: newItems };
                                      });
                                      // Trigger blink animation (3 seconds)
                                      setBlinkingRowIndex(existingIndex);
                                      setTimeout(
                                        () => setBlinkingRowIndex(null),
                                        3000,
                                      );
                                      return;
                                    }

                                    // Product doesn't exist - fill empty row or create new one
                                    let targetIndex = findEmptyItemIndex();
                                    if (targetIndex === -1) {
                                      // No empty row - add one and use that index
                                      targetIndex = invoice.items.length;
                                      setInvoice((prev) => ({
                                        ...prev,
                                        items: [
                                          ...prev.items,
                                          createSteelItem(),
                                        ],
                                      }));
                                    }
                                    // Use handleProductSelect for consistent pricing (pricelist support)
                                    setTimeout(
                                      () =>
                                        handleProductSelect(
                                          targetIndex,
                                          product,
                                        ),
                                      0,
                                    );
                                  }}
                                  className={`w-full px-3 py-2 pr-8 rounded-lg border text-xs font-medium transition-all duration-200 hover:scale-[1.02] truncate text-left ${
                                    isPinned
                                      ? isDarkMode
                                        ? 'border-gray-500 bg-gray-700 text-gray-200 hover:bg-gray-600 shadow-sm'
                                        : 'border-gray-400 bg-gray-100 text-gray-800 hover:bg-gray-200 shadow-sm'
                                      : isDarkMode
                                        ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                  }`}
                                  title={
                                    product.displayName ||
                                    product.display_name ||
                                    'N/A'
                                  }
                                >
                                  {product.uniqueName ||
                                    product.unique_name ||
                                    'N/A'}
                                </button>
                                <button
                                  onClick={(e) =>
                                    handleTogglePin(e, product.id)
                                  }
                                  className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded transition-all duration-200 hover:scale-110 ${
                                    isPinned
                                      ? isDarkMode
                                        ? 'text-gray-300 hover:text-white'
                                        : 'text-gray-700 hover:text-gray-900'
                                      : isDarkMode
                                        ? 'text-gray-500 hover:text-gray-300'
                                        : 'text-gray-400 hover:text-gray-600'
                                  }`}
                                  title={
                                    isPinned ? 'Unpin product' : 'Pin product'
                                  }
                                >
                                  {isPinned ? (
                                    <Pin size={14} fill="currentColor" />
                                  ) : (
                                    <Pin size={14} />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Items Table - Desktop & Tablet */}
                    <div className="hidden md:block overflow-x-auto">
                      <table
                        className={`min-w-full table-fixed divide-y ${
                          isDarkMode ? 'divide-gray-600' : 'divide-gray-200'
                        }`}
                      >
                        <thead className="bg-teal-600">
                          <tr className="h-11">
                            {/* Expand Button Column */}
                            <th className="py-2 px-2 text-center text-[11px] font-bold uppercase tracking-wide text-white w-10">
                              #
                            </th>
                            {/* Product Description */}
                            <th
                              className="pl-3 pr-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white"
                              style={{ width: '38%' }}
                            >
                              Product Description
                            </th>
                            {/* Qty */}
                            <th className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-white w-20">
                              Qty
                            </th>
                            {/* Unit Wt (kg) */}
                            <th className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-white w-24">
                              Unit Wt
                              <span className="font-normal opacity-75 ml-0.5">
                                (kg)
                              </span>
                            </th>
                            {/* Total Wt (kg) */}
                            <th className="px-2 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white w-28">
                              Total Wt
                              <span className="font-normal opacity-75 ml-0.5">
                                (kg)
                              </span>
                            </th>
                            {/* Rate + Basis */}
                            <th className="px-2 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white w-36">
                              Rate + Basis
                            </th>
                            {/* VAT % */}
                            <th className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-white w-20">
                              VAT %
                            </th>
                            {/* Amount */}
                            <th className="px-2 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white w-28">
                              Amount
                              <span className="font-normal opacity-75 ml-0.5">
                                (AED)
                              </span>
                            </th>
                            {/* Delete */}
                            <th className="py-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody
                          className={`divide-y ${
                            isDarkMode
                              ? 'bg-gray-800 divide-gray-600'
                              : 'bg-white divide-gray-200'
                          }`}
                        >
                          {deferredItems.slice(0, 20).map((item, index) => {
                            const tooltip = [
                              item.name ? `Name: ${item.name}` : '',
                              item.category ? `Category: ${item.category}` : '',
                              item.commodity
                                ? `Commodity: ${item.commodity}`
                                : '',
                              item.grade ? `Grade: ${item.grade}` : '',
                              item.finish ? `Finish: ${item.finish}` : '',
                              item.size ? `Size: ${item.size}` : '',
                              item.sizeInch
                                ? `Size (Inch): ${item.sizeInch}`
                                : '',
                              item.od ? `OD: ${item.od}` : '',
                              item.length ? `Length: ${item.length}` : '',
                              item.thickness
                                ? `Thickness: ${item.thickness}`
                                : '',
                              item.unit ? `Unit: ${item.unit}` : '',
                              item.hsnCode ? `HSN: ${item.hsnCode}` : '',
                            ]
                              .filter(Boolean)
                              .join('\n');
                            const isExpanded = expandedAllocations.has(index);
                            const hasAllocations =
                              item.allocations && item.allocations.length > 0;
                            const _uomConversionText =
                              getUomConversionText(item);

                            return (
                              <Fragment key={item.id || `item-${index}`}>
                                <tr className="hover:bg-gray-50">
                                  {/* Column 1: Expand button */}
                                  <td className="py-2 px-2 text-center">
                                    {item.productId && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleAllocationPanel(index)
                                        }
                                        className={
                                          isExpanded
                                            ? 'text-teal-600 p-0.5'
                                            : 'text-gray-400 hover:text-teal-600 p-0.5'
                                        }
                                        title={
                                          isExpanded
                                            ? 'Collapse allocation details'
                                            : 'Expand allocation details'
                                        }
                                      >
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d={
                                              isExpanded
                                                ? 'M19 9l-7 7-7-7'
                                                : 'M9 5l7 7-7 7'
                                            }
                                          />
                                        </svg>
                                      </button>
                                    )}
                                  </td>
                                  {/* Column 2: Product Description */}
                                  <td className="pl-3 pr-2 py-2 relative">
                                    <Autocomplete
                                      data-testid={`product-autocomplete-${index}`}
                                      options={
                                        searchInputs[index]
                                          ? searchOptions.length
                                            ? searchOptions
                                            : productOptions
                                          : productOptions
                                      }
                                      value={
                                        item.productId
                                          ? productOptions.find(
                                            (p) => p.id === item.productId,
                                          )
                                          : null
                                      }
                                      inputValue={
                                        searchInputs[index] || item.name || ''
                                      }
                                      onInputChange={(event, newInputValue) => {
                                        handleSearchInputChange(
                                          index,
                                          newInputValue,
                                        );
                                      }}
                                      onChange={(event, newValue) => {
                                        if (newValue) {
                                          handleProductSelect(index, newValue);
                                        }
                                      }}
                                      placeholder="Search products..."
                                      disabled={loadingProducts}
                                      title={tooltip}
                                      renderOption={(option) => (
                                        <div>
                                          <div className="font-medium">
                                            {option.displayName ||
                                              option.display_name ||
                                              option.uniqueName ||
                                              option.unique_name ||
                                              option.name}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {option.origin
                                              ? `${option.origin} • `
                                              : ''}
                                            {option.subtitle}
                                          </div>
                                        </div>
                                      )}
                                      noOptionsText="No products found"
                                      size="small"
                                      className="autocomplete-table-cell"
                                    />
                                  </td>
                                  {/* Column 3: Qty */}
                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      value={item.quantity || ''}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          'quantity',
                                          e.target.value === ''
                                            ? ''
                                            : parseFloat(e.target.value),
                                        )
                                      }
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-teal-500"
                                    />
                                  </td>
                                  {/* Column 4: Unit Wt */}
                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      value={
                                        item.unitWeightKg ||
                                        item.unit_weight_kg ||
                                        ''
                                      }
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          'unitWeightKg',
                                          e.target.value === ''
                                            ? ''
                                            : parseFloat(e.target.value),
                                        )
                                      }
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-teal-500"
                                    />
                                  </td>

                                  {/* Column 5: Total Wt (CALCULATED - gray div, NOT input) */}
                                  <td className="px-2 py-2">
                                    <div className="bg-gray-100 rounded px-2 py-1.5 text-right text-sm font-medium text-gray-700">
                                      {item.theoreticalWeightKg
                                        ? item.theoreticalWeightKg.toFixed(2)
                                        : '0.00'}
                                    </div>
                                  </td>

                                  {/* Column 6: Rate + Basis (COMBINED flex container) */}
                                  <td className="px-2 py-2 w-28">
                                    <div className="flex border border-gray-300 rounded overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                                      <input
                                        type="number"
                                        value={item.rate || ''}
                                        onChange={(e) =>
                                          handleItemChange(
                                            index,
                                            'rate',
                                            e.target.value === ''
                                              ? ''
                                              : parseFloat(e.target.value),
                                          )
                                        }
                                        className="w-16 px-2 py-1.5 text-right text-sm border-0 outline-none bg-white"
                                      />
                                      <select
                                        value={item.pricingBasis || 'PER_MT'}
                                        onChange={(e) =>
                                          handleItemChange(
                                            index,
                                            'pricingBasis',
                                            e.target.value,
                                          )
                                        }
                                        className={`text-[10px] font-bold px-1.5 cursor-pointer outline-none ${
                                          item.pricingBasis === 'PER_KG'
                                            ? 'border-l border-blue-200 bg-blue-100 text-blue-700'
                                            : item.pricingBasis === 'PER_PCS'
                                              ? 'border-l border-emerald-200 bg-emerald-100 text-emerald-700'
                                              : 'border-l border-gray-200 bg-gray-50 text-gray-600'
                                        }`}
                                      >
                                        <option value="PER_MT">/MT</option>
                                        <option value="PER_KG">/kg</option>
                                        <option value="PER_PCS">/pc</option>
                                      </select>
                                    </div>
                                  </td>

                                  {/* Column 7: VAT % dropdown */}
                                  <td className="px-2 py-2">
                                    <select
                                      value={item.supplyType || 'standard'}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          'supplyType',
                                          e.target.value,
                                        )
                                      }
                                      className={`w-full px-1 py-1.5 border rounded text-sm focus:ring-2 focus:ring-teal-500 ${
                                        isDarkMode
                                          ? 'bg-gray-700 border-gray-600 text-white'
                                          : 'bg-white border-gray-300 text-gray-900'
                                      }`}
                                    >
                                      <option value="standard">5%</option>
                                      <option value="zero_rated">0%</option>
                                      <option value="exempt">Exempt</option>
                                    </select>
                                  </td>

                                  {/* Column 8: Amount (CALCULATED - gray div, NOT input) */}
                                  <td className="px-2 py-2 w-36">
                                    <div className="bg-gray-100 rounded px-2 py-1.5 text-right text-sm font-semibold text-gray-900">
                                      {formatCurrency(item.amount)}
                                    </div>
                                  </td>

                                  {/* Column 9: Delete button */}
                                  <td className="py-2 pr-2 text-center">
                                    <button
                                      onClick={() => removeItem(index)}
                                      className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  </td>
                                </tr>

                                {/* Expandable Allocation Panel Row */}
                                {isExpanded && item.productId && (
                                  <tr key={`${item.id}-allocation`}>
                                    <td
                                      colSpan="9"
                                      className="bg-gray-50 px-4 py-3 border-l-4 border-teal-500"
                                    >
                                      <div className="space-y-3">
                                        {/* Header with Source Type Selector and stock status */}
                                        <div className="flex items-center justify-between gap-4">
                                          <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-semibold text-gray-700">
                                              Stock Allocation Details
                                            </h4>
                                            {/* P0: Source Type Selector with auto-selection */}
                                            <SourceTypeSelector
                                              id={`source-type-${index}`}
                                              data-testid={`source-type-${index}`}
                                              value={(() => {
                                                // Auto-select based on stock availability
                                                const currentSourceType =
                                                  item.sourceType;
                                                if (currentSourceType)
                                                  return currentSourceType;

                                                const stockData =
                                                  productBatchData[
                                                    item.productId
                                                  ];
                                                // Use totalStock from batchData (cached, accurate)
                                                const totalStock =
                                                  stockData?.totalStock ?? 0;

                                                return totalStock === 0
                                                  ? 'LOCAL_DROP_SHIP'
                                                  : 'WAREHOUSE';
                                              })()}
                                              onChange={(sourceType) =>
                                                handleItemChange(
                                                  index,
                                                  'sourceType',
                                                  sourceType,
                                                )
                                              }
                                              disabled={false}
                                            />
                                          </div>
                                          {/* Stock availability display - all warehouses */}
                                          <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-500">
                                              Stock availability:
                                            </span>
                                            <div
                                              className="flex items-center gap-4 ml-2"
                                              data-testid={`allocation-stock-warehouses-${index}`}
                                            >
                                              {warehouses.map((wh) => {
                                                // Get real stock from productBatchData
                                                const stockByWarehouse =
                                                  productBatchData[
                                                    item.productId
                                                  ]?.stockByWarehouse || {};
                                                // CRITICAL: Normalize wh.id to string to match stockByWarehouse keys
                                                const stockQty =
                                                  stockByWarehouse[
                                                    String(wh.id)
                                                  ] || 0;
                                                const hasStock = stockQty > 0;
                                                const isLoading =
                                                  item.productId &&
                                                  !productBatchData[
                                                    item.productId
                                                  ];
                                                return (
                                                  <span
                                                    key={wh.id}
                                                    data-testid={`stock-warehouse-${wh.id}`}
                                                    className={`text-xs font-medium ${
                                                      hasStock
                                                        ? 'text-gray-700'
                                                        : 'text-red-500'
                                                    }`}
                                                  >
                                                    {wh.name || wh.code}{' '}
                                                    <span
                                                      className={
                                                        hasStock
                                                          ? 'text-green-600 font-bold'
                                                          : isLoading
                                                            ? 'text-gray-400 font-bold'
                                                            : 'text-red-500 font-bold'
                                                      }
                                                    >
                                                      {isLoading
                                                        ? '...'
                                                        : stockQty}
                                                    </span>
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>

                                        {/* P0: Conditional rendering based on sourceType */}
                                        {(item.sourceType || 'WAREHOUSE') ===
                                        'WAREHOUSE' ? (
                                          /* Batch Allocation Table - only show for WAREHOUSE */
                                          /* Phase 4: Use saved consumptions for finalized invoices, draft allocations otherwise */
                                            (() => {
                                              const savedConsumption = savedConsumptionsByItemId[item.id];
                                              const hasSavedConsumptions = savedConsumption?.consumptions?.length > 0;
                                              const displayAllocations = hasSavedConsumptions
                                                ? savedConsumption.consumptions
                                                : item.allocations || [];
                                              const isReadOnly = hasSavedConsumptions;

                                              return (
                                                <div
                                                  className="border border-gray-200 rounded-lg overflow-hidden"
                                                  data-testid={`allocation-panel-${index}`}
                                                >
                                                  <div className="bg-gray-100 px-3 py-2 flex justify-between items-center border-b">
                                                    <span className="text-xs font-semibold text-gray-600">
                                                    Batch Allocation
                                                      {hasSavedConsumptions && (
                                                        <span className="ml-2 text-green-600" title="Saved to database">
                                                        ✓ Finalized
                                                        </span>
                                                      )}
                                                    </span>
                                                    {(() => {
                                                      const allocatedQty = hasSavedConsumptions
                                                        ? parseFloat(savedConsumption.totalQuantity || 0)
                                                        : displayAllocations.reduce(
                                                          (sum, a) =>
                                                            sum +
                                                            (parseFloat(a.quantity || a.quantityConsumed || 0)),
                                                          0,
                                                        );
                                                      const requiredQty = item.quantity || 0;

                                                      return (
                                                        <span className="text-xs text-gray-500">
                                                          {hasSavedConsumptions ? 'Consumed' : 'Allocated'}:{' '}
                                                          <strong className="text-teal-600">
                                                            {allocatedQty}
                                                          </strong>{' '}
                                                        / Required: {requiredQty}
                                                          {hasSavedConsumptions && savedConsumption.totalCogs && parseFloat(savedConsumption.totalCogs) > 0 && (
                                                            <span className="ml-2 text-gray-400">
                                                            COGS: {formatCurrency(parseFloat(savedConsumption.totalCogs))}
                                                            </span>
                                                          )}
                                                        </span>
                                                      );
                                                    })()}
                                                  </div>
                                                  <table
                                                    className="min-w-full text-xs"
                                                    data-testid={`batch-allocation-table-${index}`}
                                                  >
                                                    <thead className="bg-gray-50">
                                                      <tr>
                                                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                        Batch #
                                                        </th>
                                                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                          {hasSavedConsumptions ? 'Warehouse' : 'GRN Date'}
                                                        </th>
                                                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                        Channel
                                                        </th>
                                                        {!hasSavedConsumptions && (
                                                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                          Available
                                                          </th>
                                                        )}
                                                        <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                          {hasSavedConsumptions ? 'Consumed' : 'Allocated'}
                                                        </th>
                                                        <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                        Cost/Unit
                                                        </th>
                                                        {hasSavedConsumptions && (
                                                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                          Total COGS
                                                          </th>
                                                        )}
                                                        {!isReadOnly && (
                                                          <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                          Actions
                                                          </th>
                                                        )}
                                                      </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 bg-white">
                                                      {displayAllocations.map(
                                                        (allocation, allocIndex) => (
                                                          <tr key={allocIndex}>
                                                            <td className="px-3 py-2 font-mono text-gray-700">
                                                              {allocation.batchNumber || 'N/A'}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-600">
                                                              {hasSavedConsumptions
                                                                ? allocation.warehouseName || 'N/A'
                                                                : allocation.grnDate || 'N/A'}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                              <span
                                                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                                  (allocation.procurementChannel || 'LOCAL') === 'LOCAL'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : allocation.procurementChannel === 'DROP_SHIP'
                                                                      ? 'bg-purple-100 text-purple-800'
                                                                      : 'bg-blue-100 text-blue-800'
                                                                }`}
                                                              >
                                                                {allocation.procurementChannel || 'LOCAL'}
                                                              </span>
                                                            </td>
                                                            {!hasSavedConsumptions && (
                                                              <td className="px-3 py-2 text-right text-gray-700">
                                                                {allocation.availableQty || 0}
                                                              </td>
                                                            )}
                                                            <td className="px-3 py-2 text-right">
                                                              {isReadOnly ? (
                                                                <span className="font-medium text-gray-700">
                                                                  {parseFloat(
                                                                    allocation.quantityConsumed || allocation.quantity || 0,
                                                                  ).toFixed(3)}
                                                                </span>
                                                              ) : (
                                                                <input
                                                                  type="number"
                                                                  value={allocation.quantity || 0}
                                                                  onChange={(e) => {
                                                                    const newAllocations = [
                                                                      ...(item.allocations || []),
                                                                    ];
                                                                    newAllocations[allocIndex] = {
                                                                      ...newAllocations[allocIndex],
                                                                      quantity:
                                                                      parseFloat(e.target.value) || 0,
                                                                    };
                                                                    handleItemChange(
                                                                      index,
                                                                      'allocations',
                                                                      newAllocations,
                                                                    );
                                                                  }}
                                                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-xs"
                                                                />
                                                              )}
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-gray-600">
                                                              {parseFloat(allocation.unitCost || 0).toFixed(2)}
                                                            </td>
                                                            {hasSavedConsumptions && (
                                                              <td className="px-3 py-2 text-right text-gray-600 font-medium">
                                                                {formatCurrency(parseFloat(allocation.totalCogs || 0))}
                                                              </td>
                                                            )}
                                                            {!isReadOnly && (
                                                              <td className="px-3 py-2 text-right">
                                                                <button
                                                                  type="button"
                                                                  onClick={() => {
                                                                    const newAllocations = (
                                                                      item.allocations || []
                                                                    ).filter((_, i) => i !== allocIndex);
                                                                    handleItemChange(
                                                                      index,
                                                                      'allocations',
                                                                      newAllocations,
                                                                    );
                                                                  }}
                                                                  className="text-red-500 hover:text-red-700 text-xs"
                                                                >
                                                                Remove
                                                                </button>
                                                              </td>
                                                            )}
                                                          </tr>
                                                        ),
                                                      )}
                                                      {displayAllocations.length === 0 && (
                                                        <tr>
                                                          <td
                                                            colSpan={hasSavedConsumptions ? 6 : 7}
                                                            className="px-3 py-4 text-center text-gray-500 text-xs"
                                                          >
                                                            {hasSavedConsumptions
                                                              ? 'No batch consumption records found.'
                                                              : 'No batches allocated. Click "Add Batch" or "Auto-Allocate (FIFO)" below.'}
                                                          </td>
                                                        </tr>
                                                      )}
                                                    </tbody>
                                                  </table>
                                                  {!isReadOnly && (
                                                    <div className="bg-gray-50 px-3 py-2 border-t flex justify-between items-center">
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                        // TODO: Implement add batch modal
                                                          console.log(
                                                            'Add batch clicked for item index:',
                                                            index,
                                                          );
                                                        }}
                                                        className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                                                      >
                                                      + Add Batch
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={async () => {
                                                        // Re-apply FIFO auto-allocation (useful after manual changes)
                                                          await applyAutoAllocation(
                                                            index,
                                                            item.productId,
                                                            item.quantity || 1,
                                                          );
                                                        }}
                                                        disabled={
                                                          (item.sourceType || 'WAREHOUSE') !== 'WAREHOUSE'
                                                        }
                                                        className={`text-xs px-3 py-1 rounded transition-colors ${
                                                          (item.sourceType || 'WAREHOUSE') === 'WAREHOUSE'
                                                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        }`}
                                                      >
                                                      Auto-Allocate (FIFO)
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })()
                                          ) : (
                                          /* P0: Drop-ship indicator for non-warehouse items */
                                            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                                              <div className="flex items-center gap-2">
                                                <svg
                                                  className="w-5 h-5 text-blue-600"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                                  />
                                                </svg>
                                                <span className="text-sm font-medium text-blue-800">
                                                  {(item.sourceType ||
                                                  'WAREHOUSE') ===
                                                'LOCAL_DROP_SHIP'
                                                    ? 'Local Drop Ship'
                                                    : 'Import Drop Ship'}
                                                </span>
                                              </div>
                                              <p className="text-xs text-blue-700 mt-1 ml-7">
                                              Goods will be shipped directly
                                              from supplier to customer. No
                                              warehouse allocation needed.
                                              </p>
                                            </div>
                                          )}
                                      </div>
                                    </td>
                                  </tr>
                                )}

                                {/* Keep existing AllocationPanel for locked/existing invoices */}
                                {isExpanded &&
                                  item.productId &&
                                  id && // Only show for existing invoices
                                  (() => {
                                    const allocationsData = hasAllocations
                                      ? item.allocations
                                      : [];
                                    const lockedAllocation =
                                      allocationsData.find(
                                        (a) =>
                                          a.consumed_by_delivery_note_id ||
                                          a.consumedByDeliveryNoteId,
                                      );
                                    const isBatchLocked = !!lockedAllocation;

                                    if (isBatchLocked) {
                                      return (
                                        <tr
                                          key={`${item.id}-allocation-readonly`}
                                        >
                                          <td
                                            colSpan="9"
                                            className="bg-gray-50 px-4 py-3"
                                          >
                                            <AllocationPanel
                                              productId={item.productId}
                                              warehouseId={
                                                item.warehouseId ||
                                                invoice.warehouseId ||
                                                null
                                              }
                                              requiredQty={item.quantity || 0}
                                              allocations={allocationsData}
                                              disabled={true}
                                              isNewInvoice={!id}
                                              isLocked={isBatchLocked}
                                              deliveryNoteNumber={
                                                lockedAllocation?.delivery_note_number ||
                                                lockedAllocation?.deliveryNoteNumber ||
                                                null
                                              }
                                              invoiceItemId={item.id}
                                              onReallocationComplete={(
                                                newAllocations,
                                              ) => {
                                                // Update local allocations state after reallocation
                                                setItemAllocations((prev) => ({
                                                  ...prev,
                                                  [item.id]: newAllocations,
                                                }));
                                              }}
                                            />
                                          </td>
                                        </tr>
                                      );
                                    }
                                    return null;
                                  })()}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Items Cards - Mobile */}
                    <div className="md:hidden space-y-4">
                      {deferredItems.slice(0, 10).map((item, index) => {
                        const tooltip = [
                          item.name ? `Name: ${item.name}` : '',
                          item.category ? `Category: ${item.category}` : '',
                          item.commodity ? `Commodity: ${item.commodity}` : '',
                          item.grade ? `Grade: ${item.grade}` : '',
                          item.finish ? `Finish: ${item.finish}` : '',
                          item.size ? `Size: ${item.size}` : '',
                          item.sizeInch ? `Size (Inch): ${item.sizeInch}` : '',
                          item.od ? `OD: ${item.od}` : '',
                          item.length ? `Length: ${item.length}` : '',
                          item.thickness ? `Thickness: ${item.thickness}` : '',
                          item.unit ? `Unit: ${item.unit}` : '',
                          item.hsnCode ? `HSN: ${item.hsnCode}` : '',
                        ]
                          .filter(Boolean)
                          .join('\n');
                        return (
                          <Card
                            key={item.id || `mobile-item-${index}`}
                            className="p-4"
                            data-item-index={index}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <h4
                                className={`font-medium ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}
                              >
                                Item #{index + 1}
                              </h4>
                              <button
                                onClick={() => removeItem(index)}
                                className={`hover:text-red-300 ${
                                  isDarkMode ? 'text-red-400' : 'text-red-500'
                                }`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="space-y-4">
                              <Autocomplete
                                options={
                                  searchInputs[index]
                                    ? searchOptions.length
                                      ? searchOptions
                                      : productOptions
                                    : productOptions
                                }
                                value={
                                  item.productId
                                    ? productOptions.find(
                                      (p) => p.id === item.productId,
                                    )
                                    : null
                                }
                                inputValue={
                                  searchInputs[index] || item.name || ''
                                }
                                onInputChange={(event, newInputValue) => {
                                  handleSearchInputChange(index, newInputValue);
                                }}
                                onChange={(event, newValue) => {
                                  if (newValue) {
                                    handleProductSelect(index, newValue);
                                  }
                                }}
                                label="Product"
                                placeholder="Search products..."
                                disabled={loadingProducts}
                                title={tooltip}
                                error={invalidFields.has(`item.${index}.name`)}
                                renderOption={(option) => (
                                  <div>
                                    <div className="font-medium">
                                      {option.displayName ||
                                        option.display_name ||
                                        option.uniqueName ||
                                        option.unique_name ||
                                        option.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {option.origin
                                        ? `${option.origin} • `
                                        : ''}
                                      {option.subtitle}
                                    </div>
                                  </div>
                                )}
                                noOptionsText="No products found"
                              />

                              {/* Removed Grade, Finish, Size, Thickness fields */}

                              <div className="grid grid-cols-2 gap-2">
                                <div
                                  className={`transition-all duration-300 ${blinkingRowIndex === index ? 'ring-2 ring-red-400 rounded animate-pulse' : ''}`}
                                >
                                  <Input
                                    label="Qty"
                                    type="number"
                                    value={item.quantity || ''}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        'quantity',
                                        e.target.value === ''
                                          ? ''
                                          : Number.isNaN(Number(e.target.value))
                                            ? ''
                                            : parseInt(e.target.value, 10),
                                      )
                                    }
                                    min="0"
                                    step="1"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    error={invalidFields.has(
                                      `item.${index}.quantity`,
                                    )}
                                    onKeyDown={(e) => {
                                      const allow = [
                                        'Backspace',
                                        'Delete',
                                        'Tab',
                                        'Escape',
                                        'Enter',
                                        'ArrowLeft',
                                        'ArrowRight',
                                        'Home',
                                        'End',
                                      ];
                                      if (
                                        allow.includes(e.key) ||
                                        e.ctrlKey ||
                                        e.metaKey
                                      ) {
                                        return;
                                      }
                                      if (!/^[0-9]$/.test(e.key)) {
                                        e.preventDefault();
                                      }
                                    }}
                                    onPaste={(e) => {
                                      e.preventDefault();
                                      const t = (
                                        e.clipboardData || window.clipboardData
                                      ).getData('text');
                                      const digits = (t || '').replace(
                                        /\D/g,
                                        '',
                                      );
                                      handleItemChange(
                                        index,
                                        'quantity',
                                        digits ? parseInt(digits, 10) : '',
                                      );
                                    }}
                                    onWheel={(e) => e.currentTarget.blur()}
                                  />
                                </div>
                                <Input
                                  label={`Rate${item.pricingBasis && item.pricingBasis !== 'PER_MT' ? ` (${item.pricingBasis.replace('PER_', 'per ').replace('_', ' ')})` : ' (per MT)'}`}
                                  type="number"
                                  value={item.rate || ''}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      'rate',
                                      e.target.value === ''
                                        ? ''
                                        : parseFloat(e.target.value),
                                    )
                                  }
                                  min="0"
                                  step="0.01"
                                  error={invalidFields.has(
                                    `item.${index}.rate`,
                                  )}
                                />
                              </div>

                              {/* Source Type Selector moved to batch allocation section */}

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label
                                    htmlFor={`supply-type-${index}`}
                                    className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                  >
                                    Supply Type
                                  </label>
                                  <select
                                    id={`supply-type-${index}`}
                                    value={item.supplyType || 'standard'}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        'supplyType',
                                        e.target.value,
                                      )
                                    }
                                    className={`w-full px-3 py-2 border rounded ${
                                      isDarkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                  >
                                    <option value="standard">5% Std</option>
                                    <option value="zero_rated">0% Zero</option>
                                    <option value="exempt">Exempt</option>
                                  </select>
                                </div>
                                <Input
                                  label="VAT %"
                                  type="number"
                                  value={item.vatRate || ''}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      'vatRate',
                                      e.target.value === ''
                                        ? ''
                                        : parseFloat(e.target.value),
                                    )
                                  }
                                  min="0"
                                  max="15"
                                  step="0.01"
                                  placeholder="5.00"
                                />
                              </div>

                              <div
                                className={`flex justify-end p-3 rounded-md ${
                                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                }`}
                              >
                                <span
                                  className={`font-medium ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}
                                >
                                  Amount: {formatCurrency(item.amount)}
                                </span>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                      {deferredItems.length > 10 && (
                        <div
                          className={`text-center py-4 text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          Showing first 10 items. Add more items as needed.
                        </div>
                      )}
                    </div>

                    {/* Add Item Button - Below Items for Easy Access (Legacy Mode Only) */}
                    <div
                      className={`mt-4 pt-4 border-t border-dashed ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                    >
                      <Button
                        ref={addItemButtonRef}
                        onClick={addItem}
                        variant="primary"
                        size="sm"
                        className="min-h-[44px]"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Item</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </div>
                  </>
                )}
                {/* End Drawer Mode Conditional */}
              </Card>
            </div>
            {/* End Left Panel */}

            {/* Right Panel (4 cols) - Sticky Summary */}
            <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-24 self-start">
              <Card className={CARD_CLASSES(isDarkMode)}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-extrabold">Summary</div>
                    <div
                      className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      Sticky on desktop
                    </div>
                  </div>
                </div>

                {/* Summary Rows */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                    >
                      Subtotal
                    </span>
                    <span
                      className={`font-mono ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
                    >
                      {formatCurrency(computedSubtotal)}
                    </span>
                  </div>

                  {computedDiscountAmount > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span
                        className={
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }
                      >
                        Discount
                      </span>
                      <span className="font-mono text-yellow-500">
                        -{formatCurrency(computedDiscountAmount)}
                      </span>
                    </div>
                  )}

                  {(invoice.packingCharges || 0) +
                    (invoice.freightCharges || 0) +
                    (invoice.insuranceCharges || 0) +
                    (invoice.loadingCharges || 0) +
                    (invoice.otherCharges || 0) >
                    0 && (
                    <div className="flex justify-between items-center py-1">
                      <span
                        className={
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }
                      >
                        Charges
                      </span>
                      <span
                        className={`font-mono ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
                      >
                        {formatCurrency(
                          (invoice.packingCharges || 0) +
                            (invoice.freightCharges || 0) +
                            (invoice.insuranceCharges || 0) +
                            (invoice.loadingCharges || 0) +
                            (invoice.otherCharges || 0),
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-1">
                    <span
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                    >
                      VAT (5%)
                    </span>
                    <span
                      className={`font-mono ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
                    >
                      {formatCurrency(computedVatAmount)}
                    </span>
                  </div>

                  <div className={DIVIDER_CLASSES(isDarkMode)} />

                  <div className="flex justify-between items-center py-2">
                    <span
                      className={`font-extrabold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
                    >
                      Total
                    </span>
                    <span className="font-mono text-lg font-extrabold text-teal-400">
                      {formatCurrency(computedTotal)}
                    </span>
                  </div>

                  {/* Phase 7: COGS/Profit Section - Show for confirmed invoices with COGS data */}
                  {(invoice.totalCogs > 0 || invoice.status === 'CONFIRMED') && (
                    <>
                      <div className={DIVIDER_CLASSES(isDarkMode)} />
                      <div className="space-y-1">
                        <div className="flex justify-between items-center py-1">
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Cost of Goods
                          </span>
                          <span className={`font-mono text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formatCurrency(invoice.totalCogs || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Gross Profit
                          </span>
                          <span className={`font-mono text-xs ${(invoice.totalProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(invoice.totalProfit || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Margin
                          </span>
                          <span className={`font-mono text-xs font-semibold ${(invoice.grossMarginPercent || 0) >= 15 ? 'text-green-400' : (invoice.grossMarginPercent || 0) >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {(invoice.grossMarginPercent || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className={DIVIDER_CLASSES(isDarkMode)} />

                {/* Quick Actions */}
                <div>
                  <h3
                    className={`text-xs font-extrabold uppercase tracking-wide mb-2 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Quick Actions
                  </h3>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowChargesDrawer(true)}
                      className={QUICK_LINK_CLASSES(isDarkMode)}
                    >
                      <DollarSign className="w-4 h-4 opacity-60" />
                      <span className="flex-1">Edit Charges & Discount</span>
                      {(computedDiscountAmount > 0 || showFreightCharges) && (
                        <span className="text-xs text-teal-400">Active</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowNotesDrawer(true)}
                      className={QUICK_LINK_CLASSES(isDarkMode)}
                    >
                      <FileText className="w-4 h-4 opacity-60" />
                      <span className="flex-1">Edit Notes & Terms</span>
                      {(invoice.notes || invoice.taxNotes || invoice.terms) && (
                        <span className="text-xs text-teal-400">
                          Has content
                        </span>
                      )}
                    </button>
                  </div>

                  <p
                    className={`text-xs mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Payments are recorded after invoice creation via the Payment
                    Drawer
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </main>

        {/* Sticky Mobile Footer - Actions & Total */}
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-20 border-t shadow-2xl ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="px-4 py-3">
            {/* Total Display */}
            <div className="flex justify-between items-center mb-3">
              <span
                className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                Total Amount
              </span>
              <span className="text-xl font-bold text-teal-500">
                {formatCurrency(computedTotal)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreviewClick}
                disabled={loadingCompany}
                className="flex-1 min-h-[48px]"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  savingInvoice ||
                  updatingInvoice ||
                  isSaving ||
                  (id && invoice.status === 'issued')
                }
                className="flex-1 min-h-[48px]"
              >
                {savingInvoice || updatingInvoice || isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {savingInvoice || updatingInvoice || isSaving
                  ? 'Saving...'
                  : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Confirmation Dialog (for Final Tax Invoice) */}
      {showSaveConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`max-w-md w-full mx-4 p-6 rounded-lg shadow-xl ${
              isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            <div className="flex items-start mb-4">
              <AlertTriangle
                className="text-yellow-500 mr-3 flex-shrink-0"
                size={24}
              />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Confirm Final Tax Invoice Creation
                </h3>
                <p className="text-sm mb-4">
                  You are about to create and save a{' '}
                  <strong>Final Tax Invoice</strong>.
                </p>
                <p className="text-sm mb-2">
                  <strong>This action will:</strong>
                </p>
                <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                  <li>Deduct inventory from stock immediately</li>
                  <li>Record revenue in the system</li>
                  <li>
                    Create an invoice that cannot be edited (requires credit
                    note)
                  </li>
                  <li>
                    Generate an official tax invoice number (INV-YYYYMM-NNNN)
                  </li>
                </ul>
                <p className="text-sm mt-3 font-semibold text-red-600 dark:text-red-400">
                  ⚠️ This action cannot be undone!
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelSave}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                Yes, Create Final Tax Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - Invoice Created */}
      {showSuccessModal &&
        (() => {
          // Check if this is a Final Tax Invoice (cannot be edited after creation)
          const isFinalTaxInvoice = invoice.status === 'issued';
          const canContinueEditing = !isFinalTaxInvoice; // Draft and Proforma can be edited

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={canContinueEditing ? handleSuccessModalClose : undefined}
              role="button"
              tabIndex={canContinueEditing ? 0 : -1}
              onKeyDown={(e) =>
                canContinueEditing &&
                e.key === 'Escape' &&
                handleSuccessModalClose()
              }
            >
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
              <div
                className={`max-w-md w-full mx-4 rounded-2xl shadow-2xl relative overflow-hidden ${
                  isDarkMode ? 'bg-gray-900' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
              >
                {/* Success Header with Gradient */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-white/20 rounded-full p-3">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Invoice Created!
                      </h3>
                      <p className="text-emerald-100 text-sm mt-0.5">
                        {isFinalTaxInvoice
                          ? `Final Tax Invoice ${invoice.invoiceNumber || ''}`
                          : invoice.status === 'proforma'
                            ? 'Proforma Invoice'
                            : 'Draft saved'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Close button - only show for Draft/Proforma */}
                {canContinueEditing && (
                  <button
                    onClick={handleSuccessModalClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                )}

                {/* Action Buttons */}
                <div className="p-6 space-y-3">
                  <p
                    className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    What would you like to do next?
                  </p>

                  {/* Download PDF Button */}
                  <button
                    onClick={handleSuccessDownloadPDF}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40"
                  >
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Download size={20} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Download PDF</div>
                      <div className="text-xs text-teal-100">
                        Save invoice to your device
                      </div>
                    </div>
                  </button>

                  {/* Record Payment Button - Only for Final Tax Invoice */}
                  {isFinalTaxInvoice && (
                    <button
                      onClick={handleSuccessRecordPayment}
                      className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                    >
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Banknote size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Record Payment</div>
                        <div className="text-xs text-amber-100">
                          Record advance or full payment
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Go to Invoice List Button */}
                  <button
                    onClick={handleSuccessGoToList}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all border ${
                      isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                    >
                      <List size={20} />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Go to Invoice List</div>
                      <div
                        className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        View all invoices
                      </div>
                    </div>
                  </button>
                </div>

                {/* Continue editing hint - only show for Draft/Proforma */}
                {canContinueEditing && (
                  <div
                    className={`px-6 pb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                  >
                    <p className="text-xs text-center">
                      Press ESC or click outside to continue editing
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {/* Phase 4: Removed drop-ship popup modals - now using inline SourceTypeSelector dropdown */}

      {/* Duplicate Product Warning Dialog */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opa bg-opacity-50">
          <div
            className={`max-w-md w-full mx-4 p-6 rounded-lg shadow-xl ${
              isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-900/30 rounded-full p-3 mr-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2 text-amber-600 dark:text-amber-400">
                  Duplicate Product Detected
                </h3>
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  <strong>{duplicateWarning.productName}</strong> already exists
                  in this invoice (Row {duplicateWarning.existingIndex + 1},
                  Qty: {duplicateWarning.existingQuantity}).
                </p>
              </div>
            </div>

            <p
              className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              What would you like to do?
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDuplicateUpdateExisting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                Update Existing Quantity (+1)
              </button>
              <button
                onClick={handleDuplicateAddAnyway}
                className={`w-full px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Add as Separate Line
              </button>
              <button
                onClick={handleDuplicateCancel}
                className={`w-full px-4 py-2 text-sm rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay for Issued Invoice Saves */}
      <LoadingOverlay
        show={isSaving && invoice.status === 'issued'}
        message="Saving invoice..."
        detail="Updating inventory and generating records"
      />

      {/* Phase 1.1 UX: Charges & Discount Drawer */}
      <ChargesDrawer
        isOpen={showChargesDrawer}
        onClose={() => setShowChargesDrawer(false)}
        isDarkMode={isDarkMode}
        invoice={invoice}
        setInvoice={setInvoice}
        formatCurrency={formatCurrency}
        computedSubtotal={computedSubtotal}
        showFreightCharges={showFreightCharges}
        setShowFreightCharges={setShowFreightCharges}
        Input={Input}
        Select={FormSelect}
        VatHelpIcon={VatHelpIcon}
      />

      {/* Phase 1.1 UX: Notes & Terms Drawer */}
      <NotesDrawer
        isOpen={showNotesDrawer}
        onClose={() => setShowNotesDrawer(false)}
        isDarkMode={isDarkMode}
        invoice={invoice}
        setInvoice={setInvoice}
        Textarea={Textarea}
        VatHelpIcon={VatHelpIcon}
      />

      {/* Add Product Drawer */}
      {useDrawerMode && (
        <AddProductDrawer
          isOpen={showAddProductDrawer}
          onClose={() => setShowAddProductDrawer(false)}
          isDarkMode={isDarkMode}
          draftInvoiceId={typeof invoice.id === 'number' ? invoice.id : null}
          warehouseId={
            invoice.warehouseId
              ? parseInt(invoice.warehouseId, 10)
              : warehouses[0]?.id || 1
          }
          companyId={company?.id}
          customerId={invoice.customer?.id || null} // NEW - for pricing
          priceListId={selectedPricelistId || null} // NEW - for pricing
          onAddLineItem={handleAddLineItem}
        />
      )}
    </>
  );
};

export default InvoiceForm;
