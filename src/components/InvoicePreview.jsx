import React from "react";
import logoCompany from "../assets/logocompany.png";
import seal from "../assets/Seal.png";
import { X, Download } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import {
  formatCurrency,
  formatDate,
  calculateTRN,
  calculateSubtotal,
  calculateTotalTRN,
  calculateTotal,
} from "../utils/invoiceUtils";

const InvoicePreview = ({ invoice, company, onClose }) => {
  const { isDarkMode } = useTheme();
  // Compute summary values locally to ensure correctness in preview/PDF
  const computedSubtotal = calculateSubtotal(invoice.items || []);
  const computedVatAmount = calculateTotalTRN(invoice.items || []);
  const packing = parseFloat(invoice.packingCharges) || 0;
  const freight = parseFloat(invoice.freightCharges) || 0;
  const loading = parseFloat(invoice.loadingCharges) || 0;
  const other = parseFloat(invoice.otherCharges) || 0;
  const additionalCharges = packing + freight + loading + other;
  const computedTotal = calculateTotal(computedSubtotal + additionalCharges, computedVatAmount);
  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const element = document.getElementById("invoice-preview");
      if (!element) return;

      // Ensure any images (like logo) are loaded before rendering
      const waitForImages = async (container) => {
        const imgs = Array.from(container.querySelectorAll('img'));
        if (imgs.length === 0) return;
        await Promise.all(
          imgs.map((img) => new Promise((resolve) => {
            if (img.complete && img.naturalWidth !== 0) return resolve();
            try { img.crossOrigin = img.crossOrigin || 'anonymous'; } catch (_) {}
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          }))
        );
      };

      // Store original styles
      const originalStyles = element.style.cssText;
      
      // Apply light mode styles temporarily for PDF generation
      element.style.cssText = `
        ${originalStyles}
        background-color: #ffffff !important;
        color: #000000 !important;
      `;
      
      // Apply light mode styles to all child elements
      const allElements = element.querySelectorAll('*');
      const originalElementStyles = [];
      
      allElements.forEach((el, index) => {
        originalElementStyles[index] = el.style.cssText;
        
        // Force light mode colors
        el.style.cssText = `
          ${el.style.cssText}
          color: #000000 !important;
          background-color: transparent !important;
          border-color: #e0e0e0 !important;
        `;
        
        // Special handling for specific elements
        if (el.classList.contains('bg-teal-600') || el.closest('thead')) {
          el.style.backgroundColor = '#f5f5f5 !important';
        }
        
        if (el.classList.contains('border') || el.classList.contains('rounded')) {
          el.style.backgroundColor = '#ffffff !important';
          el.style.borderColor = '#e0e0e0 !important';
        }
        
        if (el.classList.contains('inline-flex') && el.classList.contains('px-2')) {
          el.style.backgroundColor = '#e3f2fd !important';
          el.style.color = '#1976d2 !important';
        }
      });

      await waitForImages(element);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      // Restore original styles
      element.style.cssText = originalStyles;
      allElements.forEach((el, index) => {
        el.style.cssText = originalElementStyles[index];
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden ${
        isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
      }`}>
        <div className={`p-6 border-b flex justify-between items-center ${
          isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Invoice Preview
          </h2>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <Download size={18} />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' 
                  : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              <X size={18} />
              Close
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div id="invoice-preview" className={`p-6 ${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'}`}>
            {/* Invoice Header */}
            <div className="flex justify-between mb-8">
              <div>
                {/* Company Logo (fallbacks to name if logo fails) */}
                <div className="mb-4 flex items-center min-h-12">
                  <img
                    src={company?.logo_url || logoCompany}
                    alt={company?.name || 'Company Logo'}
                    crossOrigin="anonymous"
                    className="max-h-12 w-auto object-contain"
                    onError={(e) => {
                      // If custom URL fails, fallback to text
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {/* If logo hidden due to error, show name */}
                  <noscript>
                    <h1 className="text-2xl font-bold">
                      {company?.name}
                    </h1>
                  </noscript>
                </div>
                {/* Removed company name here; it's part of address at right */}
                <div className="mt-2">
                  <p className={`text-sm leading-tight ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <strong>BANK NAME:</strong> ULTIMATE STEEL AND
                  </p>
                  <p className={`text-sm leading-tight ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    BUILDING MATERIALS TRADING
                  </p>
                  <p className={`text-sm leading-tight mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Account No: 019101641144
                  </p>
                  <p className={`text-sm leading-tight ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    IBAN: AE490330000019101641144
                  </p>
                </div>
                {/* Address moved to right column */}
              </div>

              {/* Right column: Company name (as part of address) and contacts */}
              <div className="text-left">
                <div className="mb-4">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Ultimate Steels Building Materials Trading</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{company.address?.street}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {company.address?.city}
                    {company.address?.emirate ? `, ${company.address.emirate}` : ''}
                    {company.address?.poBox ? ` ${company.address.poBox}` : ''}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{company.address?.country}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone: {company.phone}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email: {company.email}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>TRN: {company.vatNumber}</p>
                </div>
              </div>
            </div>

            {/* Full-width Heading Bar */}
            <div className="w-full bg-teal-600 text-white flex justify-center mb-6 py-3">
              <h2 className="text-xl font-bold tracking-wide text-white">
                TAX INVOICE
              </h2>
            </div>

            {/* Bill To + Invoice Summary Row (space-between), no boxes, narrower width */}
            <div className="flex justify-between gap-4 mb-8">
              {/* Bill To (outside box) */}
              <div className="flex-none w-2/5 min-w-0">
                <h3 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Bill To:
                </h3>
                <p className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {invoice.customer.name}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{invoice.customer.address?.street}</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {invoice.customer.address?.city}{' '}
                  {invoice.customer.address?.emirate}{' '}
                  {invoice.customer.address?.poBox}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{invoice.customer.address?.country}</p>
                {invoice.customer.vatNumber && (
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>TRN: {invoice.customer.vatNumber}</p>
                )}
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone: {invoice.customer.phone}</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email: {invoice.customer.email}</p>
              </div>

              {/* Invoice summary (outside box), styled like Bill To */}
              <div className="flex-none w-2/5 min-w-0 text-left">
                <h3 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  INVOICE
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Invoice #:</strong> {invoice.invoiceNumber}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Date:</strong> {formatDate(invoice.date)}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
                </p>
                <div className="flex items-center gap-2 justify-start mt-2">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong>Status:</strong>
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    invoice.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : invoice.status === 'draft'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
                {invoice.deliveryNote && (
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong>Delivery Note:</strong> {invoice.deliveryNote}
                  </p>
                )}
                {invoice.customerPurchaseOrderNumber && (
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong>Customer PO #:</strong> {invoice.customerPurchaseOrderNumber}
                  </p>
                )}
                {invoice.customerPurchaseOrderDate && (
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong>Customer PO Date:</strong> {formatDate(invoice.customerPurchaseOrderDate)}
                  </p>
                )}
              </div>
            </div>

            {/* Transport Details (disabled for Phase 1) */}
            {false && (
              (invoice.despatchedThrough ||
                invoice.destination ||
                invoice.termsOfDelivery ||
                invoice.modeOfPayment) && (
                <div className="mb-8">
                  <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Transport & Delivery Details:
                  </h3>
                  <div className={`border rounded-lg p-4 ${
                    isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
                  }`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {invoice.despatchedThrough && (
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <strong>Despatched Through:</strong>{" "}
                            {invoice.despatchedThrough}
                          </p>
                        </div>
                      )}
                      {invoice.destination && (
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <strong>Destination:</strong> {invoice.destination}
                          </p>
                        </div>
                      )}
                      {invoice.termsOfDelivery && (
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <strong>Terms of Delivery:</strong>{" "}
                            {invoice.termsOfDelivery}
                          </p>
                        </div>
                      )}
                      {invoice.modeOfPayment && (
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <strong>Mode of Payment:</strong>{" "}
                            {invoice.modeOfPayment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Invoice Table */}
            <div className={`border rounded-lg mb-8 overflow-hidden ${
              isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-teal-600">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Product
                      </th>
                      {invoice.items.some((item) => item.description) && (
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Description
                        </th>
                      )}
                      {/* Grade/Finish/Size/Thickness merged into Product column */}
                      <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-wider">
                        Rate
                      </th>
                      {invoice.items.some((item) => item.discount > 0) && (
                        <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-wider">
                          Discount
                        </th>
                      )}
                      <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-wider">
                        VAT %
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-wider">
                        VAT Amount
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {invoice.items.map((item, index) => {
                      const vatAmount = calculateTRN(item.amount, item.vatRate);
                      const totalWithTRN = item.amount + vatAmount;
                      return (
                        <tr key={index}>
                          <td className={`px-3 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <div className={`${isDarkMode ? 'text-gray-200' : 'text-gray-900'} font-medium`}>
                              {item.name}
                            </div>
                          </td>
                          {invoice.items.some((item) => item.description) && (
                            <td className={`px-3 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.description || "-"}</td>
                          )}
                          
                          <td className={`px-3 py-2 text-right text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.quantity}</td>
                          <td className={`px-3 py-2 text-right text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formatCurrency(item.rate)}
                          </td>
                          {invoice.items.some((item) => item.discount > 0) && (
                            <td className={`px-3 py-2 text-right text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {item.discount > 0
                                ? `${formatCurrency(item.discount)}${
                                    item.discountType === "percentage" ? "%" : ""
                                  }`
                                : "-"}
                            </td>
                          )}
                          <td className={`px-3 py-2 text-right text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formatCurrency(item.amount)}
                          </td>
                          <td className={`px-3 py-2 text-right text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.vatRate}%</td>
                          <td className={`px-3 py-2 text-right text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formatCurrency(vatAmount)}
                          </td>
                          <td className={`px-3 py-2 text-right text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(totalWithTRN)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="flex justify-end mb-8">
              <div className={`border rounded-lg min-w-80 ${
                isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
              }`}>
                <div className="p-6">
                  <div className="flex justify-between mb-2">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subtotal:</span>
                    <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(computedSubtotal)}</span>
                  </div>

                  {/* Additional Charges */}
                  {(invoice.packingCharges > 0 ||
                    invoice.freightCharges > 0 ||
                    invoice.loadingCharges > 0 ||
                    invoice.otherCharges > 0) && (
                    <>
                      {invoice.packingCharges > 0 && (
                        <div className="flex justify-between mb-2">
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Packing Charges:
                          </span>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formatCurrency(invoice.packingCharges)}
                          </span>
                        </div>
                      )}
                      {invoice.freightCharges > 0 && (
                        <div className="flex justify-between mb-2">
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Freight Charges:
                          </span>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formatCurrency(invoice.freightCharges)}
                          </span>
                        </div>
                      )}
                      {invoice.loadingCharges > 0 && (
                        <div className="flex justify-between mb-2">
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Loading Charges:
                          </span>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formatCurrency(invoice.loadingCharges)}
                          </span>
                        </div>
                      )}
                      {invoice.otherCharges > 0 && (
                        <div className="flex justify-between mb-2">
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Other Charges:</span>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formatCurrency(invoice.otherCharges)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between mb-2">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>VAT Amount:</span>
                    <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(computedVatAmount)}</span>
                  </div>

                  {invoice.roundOff && invoice.roundOff !== 0 && (
                    <div className="flex justify-between mb-2">
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Round Off:</span>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {formatCurrency(invoice.roundOff)}
                      </span>
                    </div>
                  )}

                  <hr className={`my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

                  <div className="flex justify-between mb-4">
                    <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Total Amount:
                    </span>
                    <span className="text-lg font-bold text-teal-600">
                      {formatCurrency(computedTotal)}
                    </span>
                  </div>

                  {/* Advance and Balance */}
                  {invoice.advanceReceived > 0 && (
                    <>
                      <div className="flex justify-between mb-2">
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Advance Received:</span>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {formatCurrency(invoice.advanceReceived)}
                        </span>
                      </div>
                      <div className={`flex justify-between p-2 rounded ${
                        isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                      }`}>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Balance Amount:
                        </span>
                        <span className="text-sm font-bold text-red-600">
                          {formatCurrency(Math.max(0, computedTotal - (invoice.advanceReceived || 0)))}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Total in Words */}
                  {invoice.totalInWords && (
                    <div className={`mt-4 p-2 rounded ${
                      isDarkMode ? 'bg-gray-800' : 'bg-blue-50'
                    }`}>
                      <p className={`text-xs italic ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <strong>Amount in Words:</strong> {invoice.totalInWords}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {invoice.notes && (
                  <div>
                    <div className={`border rounded-lg ${
                      isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
                    }`}>
                      <div className="p-6">
                        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Notes:
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{invoice.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
                {invoice.terms && (
                  <div className={invoice.notes ? '' : 'md:col-span-2'}>
                    <div className={`border rounded-lg ${
                      isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
                    }`}>
                      <div className="p-6">
                        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Payment as per payment terms:
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {invoice.terms}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Signature Section with Seal on Left */}
            <div className="flex justify-end mt-12">
              <div className="flex items-end gap-4">
                <img
                  src={seal}
                  alt="Company Seal"
                  crossOrigin="anonymous"
                  className="h-48 w-auto object-contain opacity-95"
                />
                <div className="text-center min-w-48">
                  <p className={`text-sm mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Authorized Signatory
                  </p>
                  <div className="border-b border-black mb-2 h-12 w-48" />
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ULTIMATE STEELS
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
