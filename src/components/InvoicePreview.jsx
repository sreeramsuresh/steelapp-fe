import React from "react";
import defaultLogo from "../assets/logocompany.png";
import defaultSeal from "../assets/Seal.png";
import { X, Download } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import {
  formatDate,
  calculateTRN,
  calculateSubtotal,
  calculateTotal,
  titleCase,
  formatNumber,
  formatDateDMY,
  calculateDiscountedTRN,
} from "../utils/invoiceUtils";
import { DEFAULT_TEMPLATE_SETTINGS } from "../constants/defaultTemplateSettings";

const InvoicePreview = ({ invoice, company, onClose, invoiceId, onSave, isSaving, isFormValid = true }) => {
  const { isDarkMode } = useTheme();
  const [isDownloading, setIsDownloading] = React.useState(false);

  // Get template colors from company settings or use defaults
  const templateSettings = company?.settings?.invoice_template || DEFAULT_TEMPLATE_SETTINGS;
  const primaryColor = templateSettings.colors?.primary || DEFAULT_TEMPLATE_SETTINGS.colors.primary;

  // Check if form has required fields based on invoice status
  const checkFormValidity = () => {
    // Existing invoices can always be viewed/updated
    if (invoiceId) return true;

    const hasCustomer = invoice.customer?.name && invoice.customer.name.trim() !== '';
    const hasItems = invoice.items && invoice.items.length > 0;
    const hasValidItems = hasItems && invoice.items.every(item =>
      item.name && item.name.trim() !== '' &&
      item.quantity > 0 &&
      item.rate > 0
    );
    const hasDate = !!invoice.date;
    const hasDueDate = !!invoice.dueDate;

    const isComplete = hasCustomer && hasItems && hasValidItems && hasDate && hasDueDate;

    // Business rules by status:
    // - draft: Allow save with incomplete data (work in progress)
    // - proforma: Require complete data (sent to customers as quote)
    // - issued: Require complete data (final legal invoice)
    const status = invoice.status || 'draft';

    if (status === 'draft') {
      // Drafts can be saved incomplete, but we'll block PDF download separately
      return true;
    }

    // Proforma and issued invoices must be complete
    return isComplete;
  };

  // Separate validation for PDF download - requires saved invoice (per PDF_WORKFLOW.md)
  const canDownloadPDF = () => {
    // PDF download requires invoice to be saved first (backend generates all PDFs)
    return !!invoiceId;
  };

  // Use the isFormValid prop if explicitly passed (from parent), otherwise use internal validation
  // This ensures the save button is properly disabled when parent says form is invalid
  const canSave = isFormValid !== undefined ? isFormValid : checkFormValidity();
  const canDownload = canDownloadPDF();

  // Compute summary values
  const computedSubtotal = calculateSubtotal(invoice.items || []);
  const computedVatAmount = calculateDiscountedTRN(
    invoice.items || [],
    invoice.discountType,
    invoice.discountPercentage,
    invoice.discountAmount
  );
  const additionalCharges =
    (parseFloat(invoice.packingCharges) || 0) +
    (parseFloat(invoice.freightCharges) || 0) +
    (parseFloat(invoice.loadingCharges) || 0) +
    (parseFloat(invoice.otherCharges) || 0);
  const discountPercent = parseFloat(invoice.discountPercentage) || 0;
  const discountFlat = parseFloat(invoice.discountAmount) || 0;
  const computedDiscount =
    (invoice.discountType === "percentage"
      ? (computedSubtotal * discountPercent) / 100
      : discountFlat) || 0;
  const computedTotal = calculateTotal(
    Math.max(0, computedSubtotal - computedDiscount) + additionalCharges,
    computedVatAmount
  );

  // Download PDF from backend - all PDFs must be generated server-side (per PDF_WORKFLOW.md)
  const handleDownloadPDF = async () => {
    if (!invoiceId) {
      alert('Please save the invoice before downloading PDF');
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/invoices/${invoiceId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNumber || 'invoice'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const cust = invoice.customer || {};
  const custAddr = cust.address || {};
  const compAddr = company?.address || {};

  // Use company logo from settings or fall back to default
  const companyLogo = company?.logo_url || company?.pdf_logo_url || defaultLogo;
  const companySeal = company?.seal_url || defaultSeal;  // Add seal support if available

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Invoice Preview
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading || !canDownload}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                canDownload
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={!canDownload ? "Please save the invoice before downloading PDF" : ""}
            >
              <Download size={18} />
              {isDownloading ? "Downloading..." : "Download PDF"}
            </button>
            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaving || !canSave}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  canSave
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                } disabled:opacity-50`}
                title={!canSave ? "Please fill in all required fields (Customer, Items, Date, Due Date)" : ""}
              >
                {isSaving ? "Saving..." : invoiceId ? "Update" : "Save"}
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Invoice Preview Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white shadow-lg" style={{ maxWidth: '210mm', margin: '0 auto', padding: '15mm' }}>

            {/* HEADER SECTION */}
            <div className="flex justify-between items-start mb-4">
              {/* Company Info - Left */}
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {company?.name || "Ultimate Steels Building Materials Trading"}
                </h1>
                <div className="text-sm text-gray-600 mt-1">
                  {compAddr.street && <p>{compAddr.street}</p>}
                  {(compAddr.city || compAddr.country) && (
                    <p>{[compAddr.city, compAddr.country].filter(Boolean).join(", ")}</p>
                  )}
                  {company?.phone && <p>Mobile: {company.phone}</p>}
                  {company?.email && <p>Email: {company.email}</p>}
                  <p className="font-semibold mt-1">VAT Reg No: 104858252000003</p>
                </div>
              </div>

              {/* Logo - Right */}
              <div>
                <img src={companyLogo} alt="Company Logo" className="h-12 w-auto" />
              </div>
            </div>

            {/* Horizontal Line */}
            <div className="border-t-2 mb-6" style={{ borderColor: primaryColor }}></div>

            {/* INVOICE TITLE */}
            <div className="mb-6">
              <div className="text-white px-3 py-1.5 text-center font-bold text-base" style={{ backgroundColor: primaryColor }}>
                {invoice.status === 'draft' && 'DRAFT INVOICE'}
                {invoice.status === 'proforma' && 'PROFORMA INVOICE'}
                {(!invoice.status || (invoice.status !== 'draft' && invoice.status !== 'proforma')) && 'TAX INVOICE'}
              </div>
            </div>

            {/* INVOICE TO & INFO SECTION */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Left - Invoice To */}
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Invoice To:</h3>
                <div className="text-sm text-gray-700">
                  {cust.name && <p className="font-medium">{titleCase(cust.name)}</p>}
                  {custAddr.street && <p>{custAddr.street}</p>}
                  {(custAddr.city || custAddr.country) && (
                    <p>{[custAddr.city, custAddr.country].filter(Boolean).join(", ")}</p>
                  )}
                  {cust.email && <p><span className="font-semibold">Email:</span> {cust.email}</p>}
                  {cust.phone && <p>Phone: {cust.phone}</p>}
                  {cust.vatNumber && <p>TRN: {cust.vatNumber}</p>}
                </div>
              </div>

              {/* Right - Invoice Info Box */}
              <div className="border" style={{ borderColor: primaryColor }}>
                <div className="text-white px-3 py-1.5 flex justify-between items-center" style={{ backgroundColor: primaryColor }}>
                  <span className="font-bold">Invoice No:</span>
                  <span className="font-bold">{invoice.invoiceNumber || ""}</span>
                </div>
                <div className="px-3 py-2 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-semibold">Invoice Date:</span>
                    <span>{formatDateDMY(invoice.date || new Date())}</span>
                  </div>
                  {invoice.customerPurchaseOrderNumber && (
                    <div className="flex justify-between">
                      <span className="font-semibold">SO:</span>
                      <span>{invoice.customerPurchaseOrderNumber}</span>
                    </div>
                  )}
                  {invoice.customerPurchaseOrderDate && (
                    <div className="flex justify-between">
                      <span className="font-semibold">Order Date:</span>
                      <span>{formatDateDMY(invoice.customerPurchaseOrderDate)}</span>
                    </div>
                  )}
                  {invoice.dueDate && (
                    <div className="flex justify-between">
                      <span className="font-semibold">Due Date:</span>
                      <span>{formatDateDMY(invoice.dueDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CURRENCY & EXCHANGE RATE SECTION (UAE VAT Compliance) */}
            {invoice.currency && invoice.currency !== 'AED' && (
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-sm">
                <div className="font-semibold text-blue-900 mb-1">Currency Information:</div>
                <div className="text-blue-800 space-y-1">
                  <div><span className="font-semibold">Currency:</span> {invoice.currency}</div>
                  <div><span className="font-semibold">Exchange Rate:</span> 1 {invoice.currency} = {formatNumber(invoice.exchangeRate || 1)} AED</div>
                  <div><span className="font-semibold">Total ({invoice.currency}):</span> {formatNumber(computedTotal / (invoice.exchangeRate || 1))}</div>
                  <div><span className="font-semibold">Total (AED):</span> AED {formatNumber(computedTotal)}</div>
                </div>
              </div>
            )}

            {/* TABLE SECTION - UAE VAT Compliant */}
            <div className="mb-6">
              <table className="w-full border-collapse" style={{ fontSize: '11px' }}>
                <thead>
                  <tr className="text-white" style={{ backgroundColor: primaryColor }}>
                    <th className="px-2 py-2 text-left text-xs font-bold" style={{ width: '4%' }}>Sr.</th>
                    <th className="px-2 py-2 text-left text-xs font-bold" style={{ width: '44%' }}>Description</th>
                    <th className="px-2 py-2 text-center text-xs font-bold" style={{ width: '6%' }}>Qty</th>
                    <th className="px-2 py-2 text-right text-xs font-bold" style={{ width: '10%' }}>Unit Price</th>
                    <th className="px-2 py-2 text-right text-xs font-bold" style={{ width: '10%' }}>Net Amt</th>
                    <th className="px-2 py-2 text-right text-xs font-bold" style={{ width: '16%' }}>VAT</th>
                    <th className="px-2 py-2 text-right text-xs font-bold" style={{ width: '10%' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item, index) => {
                    const amountNum = parseFloat(item.amount) || 0;
                    const vatRate = parseFloat(item.vatRate) || 0;
                    const vatAmount = calculateTRN(amountNum, vatRate);
                    const totalWithVAT = amountNum + vatAmount;

                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-2 py-2 text-xs">{index + 1}</td>
                        <td className="px-2 py-2 text-xs font-medium">{item.name || ""}</td>
                        <td className="px-2 py-2 text-xs text-center">{item.quantity || 0}</td>
                        <td className="px-2 py-2 text-xs text-right">{formatNumber(item.rate || 0)}</td>
                        <td className="px-2 py-2 text-xs text-right">{formatNumber(amountNum)}</td>
                        <td className="px-2 py-2 text-xs text-right">{formatNumber(vatAmount)} ({vatRate > 0 ? `${vatRate}%` : "0%"})</td>
                        <td className="px-2 py-2 text-xs text-right font-medium">{formatNumber(totalWithVAT)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="border-t-2 border-gray-300 mt-1"></div>
            </div>

            {/* TOTALS SECTION */}
            <div className="flex justify-end mb-6">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>SubTotal</span>
                  <span>AED {formatNumber(computedSubtotal)}</span>
                </div>
                {computedDiscount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span>- AED {formatNumber(computedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>VAT</span>
                  <span>AED {formatNumber(computedVatAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>TOTAL</span>
                  <span>AED {formatNumber(computedTotal)}</span>
                </div>
              </div>
            </div>

            {/* PAYMENT HISTORY (Optional) */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-2">Payment History</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-white" style={{ backgroundColor: primaryColor }}>
                      <th className="px-2 py-2 text-left text-sm font-bold">Sr.</th>
                      <th className="px-2 py-2 text-left text-sm font-bold">Date</th>
                      <th className="px-2 py-2 text-left text-sm font-bold">Method</th>
                      <th className="px-2 py-2 text-left text-sm font-bold">Ref.</th>
                      <th className="px-2 py-2 text-right text-sm font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map((payment, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-2 py-1.5 text-sm">{index + 1}</td>
                        <td className="px-2 py-1.5 text-sm">{formatDateDMY(payment.date || new Date())}</td>
                        <td className="px-2 py-1.5 text-sm">{payment.method || ""}</td>
                        <td className="px-2 py-1.5 text-sm">{payment.reference || ""}</td>
                        <td className="px-2 py-1.5 text-sm text-right">AED {formatNumber(payment.amount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* FOOTER SECTION */}
            <div className="space-y-1 text-sm text-gray-600 mb-6">
              {invoice.terms && (
                <p>
                  <span className="mr-1">•</span>
                  <span className="font-semibold">Payment Term:</span> {invoice.terms}
                </p>
              )}
              {invoice.notes && (
                <p>
                  <span className="mr-1">•</span>
                  <span className="font-semibold">Comment:</span> {invoice.notes}
                </p>
              )}
              {(invoice.warehouseName || invoice.warehouseCode) && (
                <p>
                  <span className="mr-1">•</span>
                  <span className="font-semibold">Place of Supply (Warehouse):</span> {[invoice.warehouseName, invoice.warehouseCode, invoice.warehouseCity].filter(Boolean).join(", ")}
                </p>
              )}
            </div>

            {/* TAX NOTES SECTION (UAE VAT Compliance) */}
            {invoice.taxNotes && (
              <div className="mb-6 p-3 bg-yellow-50 border-l-4 border-yellow-500">
                <h4 className="text-sm font-bold text-yellow-900 mb-2">Tax Notes:</h4>
                <div className="text-sm text-yellow-800 whitespace-pre-wrap">{invoice.taxNotes}</div>
              </div>
            )}

            {/* SIGNATURE AND SEAL SECTION */}
            <div className="flex justify-between items-start mb-6">
              {/* Company Seal - Left */}
              <div className="flex items-start gap-3">
                <img src={companySeal} alt="Company Seal" className="w-16 h-16 object-contain" />
                <div className="text-xs text-gray-600">
                  <p className="font-medium">Company Seal</p>
                  <p className="mt-1">Ultimate Steels</p>
                  <p>Building Materials</p>
                  <p>Trading LLC</p>
                </div>
              </div>

              {/* Authorized Signatory - Right */}
              <div className="text-center min-w-[180px]">
                <p className="text-sm font-semibold text-gray-800 mb-4">Authorized Signatory</p>
                <div className="border-b border-gray-800 mb-2"></div>
                <p className="text-xs font-semibold text-gray-600">ULTIMATE STEELS</p>
                <p className="text-xs font-semibold text-gray-600">BUILDING MATERIALS TRADING</p>
              </div>
            </div>

            {/* Bottom Footer Line */}
            <div className="border-t-2 pt-2" style={{ borderColor: primaryColor }}>
              <p className="text-center text-xs text-gray-600">
                Phone: {company?.phone || "+971 XXX XXX"} | Email: {company?.email || "info@example.com"} | Website: www.ultimatesteels.com
              </p>
              <p className="text-center text-xs text-gray-500 mt-1">Page: 1 / 1</p>
            </div>
          </div>
        </div>

        {/* Validation Warning */}
        {(!canSave || !canDownload) && (
          <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-200">
            {!canDownload ? (
              // Warning for PDF download - requires saving first
              <p className="text-sm text-yellow-800 font-medium">
                ℹ️ Please save the invoice before downloading PDF
              </p>
            ) : !canSave ? (
              // Warning for proforma/issued - need all fields to save
              <>
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Please fill in all required fields before saving:
                </p>
                <ul className="text-sm text-yellow-700 mt-1 ml-4 list-disc">
                  <li>Customer name</li>
                  <li>At least one item (with name, quantity, and rate)</li>
                  <li>Invoice Date</li>
                  <li>Due Date</li>
                </ul>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePreview;
