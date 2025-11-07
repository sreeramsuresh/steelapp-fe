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
  titleCase,
  formatNumber,
  normalizeLLC,
  formatDateDMY,
  calculateDiscountedTRN,
} from "../utils/invoiceUtils";
import {
  calculateTotalPaid,
  calculateBalanceDue,
  calculatePaymentStatus,
  getPaymentStatusConfig,
  formatPaymentDisplay
} from "../utils/paymentUtils";

const InvoicePreview = ({ invoice, company, onClose, invoiceId, onSave, isSaving }) => {
  const { isDarkMode } = useTheme();
  const [isDownloading, setIsDownloading] = React.useState(false);
  // Compute summary values locally to ensure correctness in preview/PDF
  const computedSubtotal = calculateSubtotal(invoice.items || []);
  const computedVatAmount = calculateDiscountedTRN(
    invoice.items || [],
    invoice.discountType,
    invoice.discountPercentage,
    invoice.discountAmount
  );
  const packing = parseFloat(invoice.packingCharges) || 0;
  const freight = parseFloat(invoice.freightCharges) || 0;
  const loading = parseFloat(invoice.loadingCharges) || 0;
  const other = parseFloat(invoice.otherCharges) || 0;
  const additionalCharges = packing + freight + loading + other;
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
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      const element = document.getElementById("invoice-preview");
      if (!element) {
        setIsDownloading(false);
        return;
      }

      // Ensure any images (like logo) are loaded before rendering
      const waitForImages = async (container) => {
        const imgs = Array.from(container.querySelectorAll("img"));
        if (imgs.length === 0) return;
        await Promise.all(
          imgs.map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete && img.naturalWidth !== 0) return resolve();
                try {
                  img.crossOrigin = img.crossOrigin || "anonymous";
                } catch (_) {}
                img.addEventListener("load", resolve, { once: true });
                img.addEventListener("error", resolve, { once: true });
              })
          )
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
      const allElements = element.querySelectorAll("*");
      const originalElementStyles = [];

      allElements.forEach((el, index) => {
        originalElementStyles[index] = el.style.cssText;
        // Keep original white text for TAX INVOICE banner and table headers
        const isHeaderArea =
          el.closest("thead") ||
          el.classList.contains("bg-teal-600") ||
          el.classList.contains("text-white");
        if (!isHeaderArea) {
          el.style.cssText = `${el.style.cssText}; color: #000000 !important;`;
        }
      });

      await waitForImages(element);

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Render each logical page node separately to avoid slicing bugs
      const pageNodes = Array.from(
        element.querySelectorAll('[data-invoice-page="true"]')
      );
      const headerEl = element.querySelector(
        '[data-invoice-global-top="true"]'
      );
      const Mx = 15; // mm side margin per business docs
      const My = 15; // mm top/bottom margin per business docs
      if (pageNodes.length > 0) {
        for (let i = 0; i < pageNodes.length; i++) {
          let targetNode = pageNodes[i];
          let pageCanvas;
          if (i === 0 && headerEl) {
            // Compose first page: header + first page content in a temporary container
            const temp = document.createElement("div");
            temp.style.cssText =
              "position:absolute; left:-9999px; top:-9999px; background:#ffffff;";
            temp.style.width = `${
              targetNode.clientWidth || element.clientWidth
            }px`;
            temp.appendChild(headerEl.cloneNode(true));
            temp.appendChild(targetNode.cloneNode(true));
            document.body.appendChild(temp);
            pageCanvas = await html2canvas(temp, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: "#ffffff",
            });
            document.body.removeChild(temp);
          } else {
            pageCanvas = await html2canvas(targetNode, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: "#ffffff",
            });
          }
          const img = pageCanvas.toDataURL("image/png");
          const pageHeight = pdf.internal.pageSize.getHeight();
          const aspect = pageCanvas.height / pageCanvas.width;
          // Scale to fit inside margins
          let drawWidth = pageWidth - 2 * Mx;
          let drawHeight = drawWidth * aspect;
          const maxHeight = pageHeight - 2 * My;
          if (drawHeight > maxHeight) {
            drawHeight = maxHeight;
            drawWidth = drawHeight / aspect;
          }
          const x = Mx + (pageWidth - 2 * Mx - drawWidth) / 2; // center within margins
          const y = My; // top-align within margin
          if (i > 0) pdf.addPage();
          pdf.addImage(img, "PNG", x, y, drawWidth, drawHeight);
        }
      } else {
        // Fallback: single canvas of full element
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });
        const fullImg = canvas.toDataURL("image/png");
        const pageHeight = pdf.internal.pageSize.getHeight();
        const aspect = canvas.height / canvas.width;
        let drawWidth = pageWidth - 2 * Mx;
        let drawHeight = drawWidth * aspect;
        const maxHeight = pageHeight - 2 * My;
        if (drawHeight > maxHeight) {
          drawHeight = maxHeight;
          drawWidth = drawHeight / aspect;
        }
        const x = Mx + (pageWidth - 2 * Mx - drawWidth) / 2;
        const y = My;
        pdf.addImage(fullImg, "PNG", x, y, drawWidth, drawHeight);
      }

      // Restore original styles
      element.style.cssText = originalStyles;
      allElements.forEach((el, index) => {
        el.style.cssText = originalElementStyles[index];
      });
      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle save and download flow for unsaved invoices
  const handleSaveAndDownload = async () => {
    if (!onSave) {
      alert("Save function not available");
      return;
    }

    try {
      setIsDownloading(true);

      // Save the invoice first
      await onSave();

      // Wait a moment for the save to complete and state to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Then download the PDF
      await handleDownloadPDF();

    } catch (error) {
      console.error("Error saving and downloading:", error);
      alert("Failed to save invoice. Please try again.");
      setIsDownloading(false);
    }
  };

  // Auto-fit pagination in preview by measurement
  const [pages, setPages] = React.useState([]);
  const measureRef = React.useRef(null);
  const measureTopRef = React.useRef(null);
  const measureHeadRef = React.useRef(null);
  const measureRowsRef = React.useRef(null);
  const measureFooterRef = React.useRef(null);
  const measureTotalsRef = React.useRef(null);

  React.useEffect(() => {
    try {
      const el = measureRef.current;
      if (!el) return;
      // Force a reflow after mount
      const topH = measureTopRef.current?.offsetHeight || 0;
      const headH = measureHeadRef.current?.offsetHeight || 0;
      const footH = measureFooterRef.current?.offsetHeight || 0;
      const totalsH = measureTotalsRef.current?.offsetHeight || 0;
      const rows = Array.from(
        (measureRowsRef.current || {}).querySelectorAll("tr")
      );
      const rowHeights = rows.map((r) => r.offsetHeight || 0);
      const pageHeightPx = 1122; // A4 height: 297mm = 1122px at 96dpi
      const footerReservedSpace = 265; // 70mm reserved (50mm footer + 20mm bottom margin) = 265px
      const padding = 8; // Internal padding allowance
      const frameHeight = Math.max(
        200,
        pageHeightPx - (topH + headH + footerReservedSpace + padding)
      );
      // Build pages by accumulating rows within frameHeight; leave room for totals on the final page
      const items = invoice.items || [];
      const result = [];
      let idx = 0;
      while (idx < items.length) {
        let used = 0;
        const start = idx;
        const remainingHeight =
          rowHeights.slice(idx).reduce((a, b) => a + b, 0) ||
          (items.length - idx) * 32;
        // If the remaining rows can fit in a single page when reserving totals, use reduced budget
        const budget =
          remainingHeight <= frameHeight - totalsH
            ? frameHeight - totalsH
            : frameHeight;
        while (idx < items.length) {
          const h = rowHeights[idx] || 32;
          if (used + h > budget && idx > start) break;
          if (h > budget && idx === start) {
            idx++;
            break;
          } // ensure progress
          used += h;
          idx++;
        }
        result.push(items.slice(start, idx));
      }
      setPages(result);
    } catch (e) {
      console.warn("Pagination measure failed:", e);
      setPages([]);
    }
  }, [invoice.items, isDarkMode]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`rounded-xl w-full max-w-6xl max-h-[90vh] overflow-auto ${
          isDarkMode ? "bg-[#1E2328]" : "bg-white"
        }`}
      >
        <div
          className={`p-6 border-b flex justify-between items-center ${
            isDarkMode ? "border-[#37474F]" : "border-gray-200"
          }`}
        >
          <h2
            className={`text-xl font-semibold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Invoice Preview
          </h2>
          <div className="flex gap-3">
            <button
              onClick={invoiceId ? handleDownloadPDF : handleSaveAndDownload}
              disabled={isSaving || isDownloading}
              className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md ${
                isSaving || isDownloading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={invoiceId ? "Download invoice as PDF" : "Save invoice and download PDF"}
            >
              <Download size={18} />
              {isSaving
                ? "Saving..."
                : isDownloading
                  ? "Generating..."
                  : invoiceId
                    ? "Download PDF"
                    : "Save & Download PDF"}
            </button>
            <button
              onClick={onClose}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                isDarkMode
                  ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                  : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              <X size={18} />
              Close
            </button>
          </div>
        </div>

        <div>
          <div
            id="invoice-preview"
            className={`px-12 py-6 ${isDarkMode ? "bg-[#1E2328]" : "bg-white"}`}
            style={{
              fontFamily: "Calibri, Arial, sans-serif",
              fontSize: "13pt",
            }}
          >
            {/* Hidden measurement container */}
            <div
              style={{
                position: "absolute",
                left: -9999,
                top: -9999,
                visibility: "hidden",
                width: "800px",
              }}
              ref={measureRef}
            >
              {/* Top repeated block */}
              <div ref={measureTopRef}>
                <div className="flex justify-between mb-6">
                  <div>
                    <div className="mb-2 flex items-center min-h-10">
                      <img
                        src={company?.logo_url || logoCompany}
                        alt="Company Logo"
                        crossOrigin="anonymous"
                        className="max-h-10 w-auto object-contain"
                      />
                    </div>
                    <div className="mt-1">
                      <p className="text-sm">
                        {normalizeLLC(
                          company?.name ||
                            "Ultimate Steels Building Materials Trading"
                        )}
                      </p>
                      <p className="text-sm">{company.address?.street}</p>
                      <p className="text-sm">
                        {company.address?.city}
                        {company.address?.city && company.address?.country
                          ? ", "
                          : ""}
                        {company.address?.country}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <div>
                      <p className="text-sm mb-1">
                        <strong>INVOICE Date :</strong> {formatDateDMY(invoice.date)}
                      </p>
                      <h3 className="text-base font-bold mb-1">Bill To:</h3>
                      <p className="text-sm font-bold">
                        {titleCase(normalizeLLC(invoice.customer.name))}
                      </p>
                      <p className="text-sm">
                        {invoice.customer.address?.street}
                      </p>
                      <p className="text-sm">
                        {invoice.customer.address?.city}
                        {invoice.customer.address?.city &&
                        invoice.customer.address?.country
                          ? ", "
                          : ""}
                        {invoice.customer.address?.country}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-teal-600 text-white flex justify-center mb-4 py-2">
                  <h2 className="text-lg font-bold tracking-wide">
                    {invoice.status === 'draft' ? 'DRAFT TAX INVOICE' :
                     invoice.status === 'proforma' ? 'PROFORMA TAX INVOICE' :
                     'TAX INVOICE'}
                  </h2>
                </div>
              </div>
              {/* Table header */}
              <div ref={measureHeadRef}>
                <table className="w-full">
                  <thead className="bg-teal-600">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider w-12">
                        S.No.
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-wider">
                        Rate (AED)
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-wider">
                        Amount (AED)
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
              {/* Rows measure */}
              <table className="w-full">
                <tbody ref={measureRowsRef}>
                  {(invoice.items || []).map((item, idx) => (
                    <tr key={`m-${idx}`}>
                      <td className="px-3 py-2 text-sm text-center w-12">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="font-medium">{item.name}</div>
                      </td>
                      <td className="px-3 py-2 text-sm text-right">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-sm text-right">
                        {formatNumber(item.rate)}
                      </td>
                      <td className="px-3 py-2 text-sm text-right">
                        {formatNumber(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Footer/signature measure */}
              <div ref={measureFooterRef} className="flex justify-end mt-8">
                <div className="flex items-end gap-4">
                  <div className="h-36 w-36 border" />
                  <div className="text-center min-w-48">
                    <p className="text-sm mb-6">Authorized Signatory</p>
                    <div className="border-b border-black mb-2 h-10 w-48" />
                    <p className="text-sm font-bold">ULTIMATE STEELS</p>
                  </div>
                </div>
              </div>
              {/* Totals measure */}
              <div ref={measureTotalsRef} className="flex justify-end mt-6">
                <div className="border rounded-lg min-w-80">
                  <div className="p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Subtotal (AED):</span>
                      <span className="text-sm">
                        {formatNumber(computedSubtotal)}
                      </span>
                    </div>
                    {computedDiscount > 0 && (
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Discount (AED):</span>
                        <span className="text-sm">- {formatNumber(computedDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">VAT Amount (AED):</span>
                      <span className="text-sm">
                        {formatNumber(computedVatAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lg font-bold">
                        Total Amount (AED):
                      </span>
                      <span className="text-lg font-bold">
                        {formatNumber(computedTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Invoice Header */}
            <div data-invoice-global-top="true">
              <div className="flex justify-between mb-8">
                <div>
                  {/* Company Logo (fallbacks to name if logo fails) */}
                  <div className="mb-4 flex items-center min-h-12">
                    <img
                      src={company?.logo_url || logoCompany}
                      alt={company?.name || "Company Logo"}
                      crossOrigin="anonymous"
                      className="max-h-12 w-auto object-contain"
                      onError={(e) => {
                        // If custom URL fails, fallback to text
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    {/* If logo hidden due to error, show name */}
                    <noscript>
                      <h1 className="text-2xl font-bold">{company?.name}</h1>
                    </noscript>
                  </div>
                  {/* Removed company name here; it's part of address at right */}
                  <div className="mt-2">
                    <p
                      className={`leading-tight ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      <strong>{titleCase("Bank Account Name")}:</strong>{" "}
                      {titleCase(normalizeLLC("Ultimate Steel And"))}
                    </p>
                    <p
                      className={`leading-tight ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      {titleCase(normalizeLLC("Building Materials Trading"))}
                    </p>
                    <p
                      className={`leading-tight mt-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      Account No: 019101641144
                    </p>
                    <p
                      className={`leading-tight ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      IBAN: AE490330000019101641144
                    </p>
                  </div>
                  {/* Address moved to right column */}
                </div>

                {/* Right column: Company name (as part of address) and contacts */}
                <div className="text-left">
                  <div className="mb-4">
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      {normalizeLLC(
                        "Ultimate Steels Building Materials Trading"
                      )}
                    </p>
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      {company.address?.street}
                    </p>
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      {company.address?.city}
                      {company.address?.city && company.address?.country
                        ? ", "
                        : ""}
                      {company.address?.country}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      Ph:{" "}
                      {company.phone
                        ? company.phone
                            .split(",")
                            .map((phone) => phone.trim())
                            .join(" | ")
                        : ""}
                    </p>
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      Email: {company.email}
                    </p>
                    <p
                      className={`font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "12pt",
                        fontWeight: "bold",
                      }}
                    >
                      VAT Reg No: 104858252000003
                    </p>
                  </div>
                </div>
              </div>

              {/* Full-width Heading Bar */}
              <div className="w-full bg-teal-600 text-white flex justify-center items-center mb-6 py-3">
                <h2
                  className="text-xl font-bold tracking-wide text-white"
                  style={{ fontFamily: "Calibri, Arial, sans-serif" }}
                >
                  {invoice.status === 'draft' ? 'DRAFT TAX INVOICE' :
                   invoice.status === 'proforma' ? 'PROFORMA TAX INVOICE' :
                   'TAX INVOICE'}
                </h2>
              </div>

              {/* Bill To + Invoice Summary Row (space-between), tightened spacing */}
              <div className="flex justify-between gap-4 mb-6 items-start">
                {/* Bill To (outside box) */}
                <div className="flex-none w-2/5 min-w-0">
                  <div
                    className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: "13pt", marginBottom: "2px" }}
                  >
                    <strong>INVOICE Date :</strong> {formatDateDMY(invoice.date)}
                  </div>
                  <h3
                    className={`font-bold mb-1 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                    style={{
                      fontFamily: "Calibri, Arial, sans-serif",
                      fontSize: "13pt",
                    }}
                  >
                    Bill To:
                  </h3>
                  <div className="space-y-0" style={{ lineHeight: 1.15 }}>
                    <p
                      className={`font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      {titleCase(normalizeLLC(invoice.customer.name))}
                    </p>
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      {invoice.customer.address?.street}
                    </p>
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      {invoice.customer.address?.city}
                      {invoice.customer.address?.city &&
                      invoice.customer.address?.country
                        ? ", "
                        : ""}
                      {invoice.customer.address?.country}
                    </p>
                    {invoice.customer.vatNumber && (
                      <p
                        className={`${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                        style={{
                          fontFamily: "Calibri, Arial, sans-serif",
                          fontSize: "13pt",
                        }}
                      >
                        TRN: {invoice.customer.vatNumber}
                      </p>
                    )}
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      Phone: {invoice.customer.phone}
                    </p>
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      Email: {invoice.customer.email}
                    </p>
                  </div>
                </div>

                {/* Invoice summary (outside box), styled like Bill To */}
                <div className="flex-none w-2/5 min-w-0 text-left">
                  <div className="space-y-0" style={{ lineHeight: 1.15 }}>
                    <p
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                    style={{
                      fontFamily: "Calibri, Arial, sans-serif",
                      fontSize: "13pt",
                    }}
                  >
                    <strong>Invoice #:</strong> {invoice.invoiceNumber}
                  </p>
                    <div className="flex items-center gap-2 justify-start">
                    <span
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      <strong>Payment Mode:</strong>
                    </span>
                    <span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {invoice.modeOfPayment || "-"}
                    </span>
                    </div>
                  {invoice.chequeNumber && (
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      <strong>Cheque No:</strong> {invoice.chequeNumber}
                    </p>
                  )}
                  </div>
                  {(
                    invoice.warehouseName ||
                    invoice.warehouseCode ||
                    invoice.warehouseCity
                  ) && (
                    <div className={`space-y-0 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ marginTop: 6, lineHeight: 1.15 }}>
                      <div className="font-semibold" style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: "13pt" }}>Warehouse:</div>
                      {invoice.warehouseName && <div style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: "13pt" }}>{invoice.warehouseName}</div>}
                      {invoice.warehouseCode && (
                        <div style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: "13pt" }}>Warehouse No: {invoice.warehouseCode}</div>
                      )}
                      {invoice.warehouseCity && <div style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: "13pt" }}>{invoice.warehouseCity}</div>}
                    </div>
                  )}
                  {invoice.deliveryNote && (
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      <strong>Delivery Note:</strong> {invoice.deliveryNote}
                    </p>
                  )}
                  {invoice.customerPurchaseOrderNumber && (
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      <strong>Customer PO #:</strong>{" "}
                      {invoice.customerPurchaseOrderNumber}
                    </p>
                  )}
                  {invoice.customerPurchaseOrderDate && (
                    <p
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                      style={{
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontSize: "13pt",
                      }}
                    >
                      <strong>Customer PO Date:</strong>{" "}
                      {formatDate(invoice.customerPurchaseOrderDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Transport Details (disabled for Phase 1) */}
            {false &&
              (invoice.despatchedThrough ||
                invoice.destination ||
                invoice.termsOfDelivery ||
                invoice.modeOfPayment) && (
                <div className="mb-8">
                  <h3
                    className={`text-lg font-bold mb-4 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Transport & Delivery Details:
                  </h3>
                  <div
                    className={`border rounded-lg p-4 ${
                      isDarkMode
                        ? "border-[#37474F] bg-[#1E2328]"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {invoice.despatchedThrough && (
                        <div>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            <strong>Despatched Through:</strong>{" "}
                            {invoice.despatchedThrough}
                          </p>
                        </div>
                      )}
                      {invoice.destination && (
                        <div>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            <strong>Destination:</strong> {invoice.destination}
                          </p>
                        </div>
                      )}
                      {invoice.termsOfDelivery && (
                        <div>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            <strong>Terms of Delivery:</strong>{" "}
                            {invoice.termsOfDelivery}
                          </p>
                        </div>
                      )}
                      {invoice.modeOfPayment && (
                        <div>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            <strong>Mode of Payment:</strong>{" "}
                            {invoice.modeOfPayment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Paginated Invoice Table with repeated signature */}
            {(() => {
              const items = invoice.items || [];
              const showDescCol = items.some((it) => !!it.description);
              const showDiscCol = items.some(
                (it) => (parseFloat(it.discount) || 0) > 0
              );
              const fallbackPerPage = 16;
              const chunk = (arr, size) => {
                const out = [];
                for (let i = 0; i < arr.length; i += size)
                  out.push(arr.slice(i, i + size));
                return out;
              };
              const computedPages =
                pages && pages.length > 0
                  ? pages
                  : chunk(items, fallbackPerPage);
              return computedPages.map((pageItems, pi) => {
                const isFirst = pi === 0;
                return (
                  <div
                    key={`page-${pi}`}
                    className="mb-4"
                    style={{
                      height: "1122px", // A4 height: 297mm = 1122px at 96dpi (297mm ÷ 25.4 × 96)
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      padding: "0",
                      margin: "0",
                      overflow: "hidden",
                      boxSizing: "border-box",
                    }}
                    data-invoice-page="true"
                  >
                    {/* Repeated global top on pages after the first: header + banner + bill-to/summary */}
                    {pi > 0 && (
                      <>
                        {/* Company header (left: logo + bank details) and company info (right) */}
                        <div className="flex justify-between mb-8">
                          <div>
                            {/* Logo */}
                            <div className="mb-4 flex items-center min-h-12">
                              <img
                                src={company?.logo_url || logoCompany}
                                alt={company?.name || "Company Logo"}
                                crossOrigin="anonymous"
                                className="max-h-12 w-auto object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                            {/* Bank details */}
                            <div className="mt-2">
                              <p
                                className={`leading-tight ${
                                  isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                <strong>
                                  {titleCase("Bank Account Name")}:
                                </strong>{" "}
                                {titleCase(normalizeLLC("Ultimate Steel And"))}
                              </p>
                              <p
                                className={`leading-tight ${
                                  isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                {titleCase(
                                  normalizeLLC("Building Materials Trading")
                                )}
                              </p>
                              <p
                                className={`leading-tight mt-1 ${
                                  isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                Account No: 019101641144
                              </p>
                              <p
                                className={`leading-tight ${
                                  isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                IBAN: AE490330000019101641144
                              </p>
                            </div>
                          </div>
                          {/* Company info (right) */}
                          <div className="text-left">
                            <div className="mb-4">
                              <p
                                className={`${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                {normalizeLLC(
                                  "Ultimate Steels Building Materials Trading"
                                )}
                              </p>
                              <p
                                className={`${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                {company.address?.street}
                              </p>
                              <p
                                className={`${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                {company.address?.city}
                                {company.address?.city &&
                                company.address?.country
                                  ? ", "
                                  : ""}
                                {company.address?.country}
                              </p>
                            </div>
                            <div>
                              <p
                                className={`${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                Ph:{" "}
                                {company.phone
                                  ? company.phone
                                      .split(",")
                                      .map((p) => p.trim())
                                      .join(" | ")
                                  : ""}
                              </p>
                              <p
                                className={`${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                Email: {company.email}
                              </p>
                              <p
                                className={`font-bold ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "12pt",
                                  fontWeight: "bold",
                                }}
                              >
                                VAT Reg No: 104858252000003
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Invoice banner */}
                        <div className="w-full bg-teal-600 text-white flex justify-center items-center mb-6 py-3">
                          <h2
                            className="text-xl font-bold tracking-wide text-white"
                            style={{ fontFamily: "Calibri, Arial, sans-serif" }}
                          >
                            {invoice.status === 'draft' ? 'DRAFT TAX INVOICE' :
                             invoice.status === 'proforma' ? 'PROFORMA TAX INVOICE' :
                             'TAX INVOICE'}
                          </h2>
                        </div>

                        {/* Bill To (left) and Invoice summary (right) */}
                        <div className="flex justify-between gap-4 mb-8">
                          {/* Bill To */}
                          <div className="flex-none w-2/5 min-w-0">
                            <div
                              className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                              style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: "13pt", marginBottom: "6px" }}
                            >
                              <strong>INVOICE Date :</strong> {formatDateDMY(invoice.date)}
                            </div>
                            <h3
                              className={`font-bold mb-3 ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                              style={{
                                fontFamily: "Calibri, Arial, sans-serif",
                                fontSize: "13pt",
                              }}
                            >
                              Bill To:
                            </h3>
                            <p
                              className={`font-bold mb-1 ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                              style={{
                                fontFamily: "Calibri, Arial, sans-serif",
                                fontSize: "13pt",
                              }}
                            >
                              {titleCase(normalizeLLC(invoice.customer.name))}
                            </p>
                            <p
                              className={`${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                              style={{
                                fontFamily: "Calibri, Arial, sans-serif",
                                fontSize: "13pt",
                              }}
                            >
                              {invoice.customer.address?.street}
                            </p>
                            <p
                              className={`${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                              style={{
                                fontFamily: "Calibri, Arial, sans-serif",
                                fontSize: "13pt",
                              }}
                            >
                              {invoice.customer.address?.city}
                              {invoice.customer.address?.city &&
                              invoice.customer.address?.country
                                ? ", "
                                : ""}
                              {invoice.customer.address?.country}
                            </p>
                            {invoice.customer.vatNumber && (
                              <p
                                className={`${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                TRN: {invoice.customer.vatNumber}
                              </p>
                            )}
                            <p
                              className={`${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                              style={{
                                fontFamily: "Calibri, Arial, sans-serif",
                                fontSize: "13pt",
                              }}
                            >
                              Phone: {invoice.customer.phone}
                            </p>
                            <p
                              className={`${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                              style={{
                                fontFamily: "Calibri, Arial, sans-serif",
                                fontSize: "13pt",
                              }}
                            >
                              Email: {invoice.customer.email}
                            </p>
                          </div>

                          {/* Invoice summary */}
                          <div className="flex-none w-2/5 min-w-0 text-left">
                            <h3
                              className={`font-bold mb-3 ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                              style={{
                                fontFamily: "Calibri, Arial, sans-serif",
                                fontSize: "13pt",
                              }}
                            >
                              {/* Removed explicit INVOICE heading */}
                            </h3>
                            <p
                              className={`${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                              style={{
                                fontFamily: "Calibri, Arial, sans-serif",
                                fontSize: "13pt",
                              }}
                            >
                              <strong>Invoice #:</strong>{" "}
                              {invoice.invoiceNumber}
                            </p>
                            <p
                              className={`${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                              style={{
                                fontFamily: "Calibri, Arial, sans-serif",
                                fontSize: "13pt",
                              }}
                            ></p>
                            <div className="flex items-center gap-2 justify-start mt-2">
                              <span
                                className={`${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                <strong>Payment Mode:</strong>
                              </span>
                              <span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                {invoice.modeOfPayment || "-"}
                              </span>
                            </div>
                            {invoice.chequeNumber && (
                              <p
                                className={`${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                <strong>Cheque No:</strong> {invoice.chequeNumber}
                              </p>
                            )}
                            {(
                              invoice.warehouseName ||
                              invoice.warehouseCode ||
                              invoice.warehouseCity
                            ) && (
                              <div className={`space-y-0 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ marginTop: 6, lineHeight: 1.15 }}>
                                <div className="font-semibold" style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: "13pt" }}>Warehouse:</div>
                                {invoice.warehouseName && <div style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: "13pt" }}>{invoice.warehouseName}</div>}
                                {invoice.warehouseCode && (
                                  <div style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: "13pt" }}>Warehouse No: {invoice.warehouseCode}</div>
                                )}
                                {invoice.warehouseCity && <div style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: "13pt" }}>{invoice.warehouseCity}</div>}
                              </div>
                            )}
                            {invoice.deliveryNote && (
                              <p
                                className={`${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                <strong>Delivery Note:</strong>{" "}
                                {invoice.deliveryNote}
                              </p>
                            )}
                            {invoice.customerPurchaseOrderNumber && (
                              <p
                                className={`${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                <strong>Customer PO #:</strong>{" "}
                                {invoice.customerPurchaseOrderNumber}
                              </p>
                            )}
                            {invoice.customerPurchaseOrderDate && (
                              <p
                                className={`${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                                style={{
                                  fontFamily: "Calibri, Arial, sans-serif",
                                  fontSize: "13pt",
                                }}
                              >
                                <strong>Customer PO Date:</strong>{" "}
                                {formatDate(invoice.customerPurchaseOrderDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    {/* Content Area - Items and Summary */}
                    <div
                      style={{
                        flex: "1 1 auto",
                        display: "flex",
                        flexDirection: "column",
                        paddingBottom: "265px", // Reserve 70mm for footer area (50mm footer + 20mm bottom margin)
                      }}
                    >
                      <div
                        className={`border rounded-lg ${
                          isDarkMode ? "border-[#37474F]" : "border-gray-200"
                        }`}
                        style={{ display: "flex", flexDirection: "column" }}
                      >
                        <div style={{ paddingBottom: "4px" }}>
                          <table className="w-full">
                            <thead className="bg-teal-600">
                              <tr>
                                <th
                                  className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider w-12"
                                  style={{
                                    fontFamily: "Calibri, Arial, sans-serif",
                                  }}
                                >
                                  S.No.
                                </th>
                                <th
                                  className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider"
                                  style={{
                                    fontFamily: "Calibri, Arial, sans-serif",
                                  }}
                                >
                                  Product
                                </th>
                                {showDescCol && (
                                  <th
                                    className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider"
                                    style={{
                                      fontFamily: "Calibri, Arial, sans-serif",
                                    }}
                                  >
                                    Description
                                  </th>
                                )}
                                <th
                                  className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider"
                                  style={{
                                    fontFamily: "Calibri, Arial, sans-serif",
                                  }}
                                >
                                  Qty
                                </th>
                                <th
                                  className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider"
                                  style={{
                                    fontFamily: "Calibri, Arial, sans-serif",
                                  }}
                                >
                                  Rate (AED)
                                </th>
                                {showDiscCol && (
                                  <th
                                    className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider"
                                    style={{
                                      fontFamily: "Calibri, Arial, sans-serif",
                                    }}
                                  >
                                    Discount
                                  </th>
                                )}
                                <th
                                  className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider"
                                  style={{
                                    fontFamily: "Calibri, Arial, sans-serif",
                                  }}
                                >
                                  Amount (AED)
                                </th>
                                <th
                                  className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider"
                                  style={{
                                    fontFamily: "Calibri, Arial, sans-serif",
                                  }}
                                >
                                  VAT %
                                </th>
                                <th
                                  className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider"
                                  style={{
                                    fontFamily: "Calibri, Arial, sans-serif",
                                  }}
                                >
                                  VAT Amount (AED)
                                </th>
                                <th
                                  className="px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider"
                                  style={{
                                    fontFamily: "Calibri, Arial, sans-serif",
                                  }}
                                >
                                  Total (AED)
                                </th>
                              </tr>
                            </thead>
                            <tbody
                              className={`divide-y ${
                                isDarkMode
                                  ? "divide-gray-700"
                                  : "divide-gray-200"
                              }`}
                            >
                              {pageItems.map((item, index) => {
                                const vatAmount = calculateTRN(
                                  item.amount,
                                  item.vatRate
                                );
                                const totalWithTRN = item.amount + vatAmount;
                                return (
                                  <tr key={`${pi}-${index}`}>
                                    <td
                                      className={`px-3 py-2 text-center ${
                                        isDarkMode
                                          ? "text-gray-300"
                                          : "text-gray-700"
                                      }`}
                                      style={{
                                        fontFamily:
                                          "Calibri, Arial, sans-serif",
                                        fontSize: "13pt",
                                      }}
                                    >
                                      {index +
                                        1 +
                                        computedPages
                                          .slice(0, pi)
                                          .reduce(
                                            (sum, arr) => sum + arr.length,
                                            0
                                          )}
                                    </td>
                                    <td
                                      className={`px-3 py-2 ${
                                        isDarkMode
                                          ? "text-gray-300"
                                          : "text-gray-700"
                                      }`}
                                      style={{
                                        fontFamily:
                                          "Calibri, Arial, sans-serif",
                                        fontSize: "13pt",
                                      }}
                                    >
                                      <div
                                        className={`${
                                          isDarkMode
                                            ? "text-gray-200"
                                            : "text-gray-900"
                                        } font-medium`}
                                        style={{
                                          fontFamily:
                                            "Calibri, Arial, sans-serif",
                                        }}
                                      >
                                        {item.name}
                                      </div>
                                    </td>
                                    {showDescCol && (
                                      <td
                                        className={`px-3 py-2 ${
                                          isDarkMode
                                            ? "text-gray-300"
                                            : "text-gray-700"
                                        }`}
                                        style={{
                                          fontFamily:
                                            "Calibri, Arial, sans-serif",
                                          fontSize: "13pt",
                                        }}
                                      >
                                        {item.description || "-"}
                                      </td>
                                    )}
                                    <td
                                      className={`px-3 py-2 text-right ${
                                        isDarkMode
                                          ? "text-gray-300"
                                          : "text-gray-700"
                                      }`}
                                      style={{
                                        fontFamily:
                                          "Calibri, Arial, sans-serif",
                                        fontSize: "13pt",
                                      }}
                                    >
                                      {item.quantity}
                                    </td>
                                    <td
                                      className={`px-3 py-2 text-right ${
                                        isDarkMode
                                          ? "text-gray-300"
                                          : "text-gray-700"
                                      }`}
                                      style={{
                                        fontFamily:
                                          "Calibri, Arial, sans-serif",
                                        fontSize: "13pt",
                                      }}
                                    >
                                      {formatNumber(item.rate)}
                                    </td>
                                    {showDiscCol && (
                                      <td
                                        className={`px-3 py-2 text-right ${
                                          isDarkMode
                                            ? "text-gray-300"
                                            : "text-gray-700"
                                        }`}
                                        style={{
                                          fontFamily:
                                            "Calibri, Arial, sans-serif",
                                          fontSize: "13pt",
                                        }}
                                      >
                                        {item.discount > 0
                                          ? `${formatNumber(item.discount)}${
                                              item.discountType === "percentage"
                                                ? "%"
                                                : ""
                                            }`
                                          : "-"}
                                      </td>
                                    )}
                                    <td
                                      className={`px-3 py-2 text-right ${
                                        isDarkMode
                                          ? "text-gray-300"
                                          : "text-gray-700"
                                      }`}
                                      style={{
                                        fontFamily:
                                          "Calibri, Arial, sans-serif",
                                        fontSize: "13pt",
                                      }}
                                    >
                                      {formatNumber(item.amount)}
                                    </td>
                                    <td
                                      className={`px-3 py-2 text-right ${
                                        isDarkMode
                                          ? "text-gray-300"
                                          : "text-gray-700"
                                      }`}
                                      style={{
                                        fontFamily:
                                          "Calibri, Arial, sans-serif",
                                        fontSize: "13pt",
                                      }}
                                    >
                                      {item.vatRate}%
                                    </td>
                                    <td
                                      className={`px-3 py-2 text-right ${
                                        isDarkMode
                                          ? "text-gray-300"
                                          : "text-gray-700"
                                      }`}
                                      style={{
                                        fontFamily:
                                          "Calibri, Arial, sans-serif",
                                        fontSize: "13pt",
                                      }}
                                    >
                                      {formatNumber(vatAmount)}
                                    </td>
                                    <td
                                      className={`px-3 py-2 text-right font-bold ${
                                        isDarkMode
                                          ? "text-white"
                                          : "text-gray-900"
                                      }`}
                                      style={{
                                        fontFamily:
                                          "Calibri, Arial, sans-serif",
                                        fontSize: "13pt",
                                      }}
                                    >
                                      {formatNumber(totalWithTRN)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {/* On last page, show summary in content area */}
                      {pi === computedPages.length - 1 && (
                        <>
                          {/* Invoice Summary (last page only) */}
                          <div className="flex justify-end mt-2">
                            <div
                              className={`border rounded-lg min-w-80 ${
                                isDarkMode
                                  ? "border-[#37474F] bg-[#1E2328]"
                                  : "border-gray-200 bg-white"
                              }`}
                            >
                              <div className="p-4">
                                <div className="flex justify-between mb-2">
                                  <span
                                    className={`${
                                      isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    }`}
                                    style={{
                                      fontFamily: "Calibri, Arial, sans-serif",
                                      fontSize: "13pt",
                                    }}
                                  >
                                    Subtotal (AED):
                                  </span>
                                  <span
                                    className={`${
                                      isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                    }`}
                                    style={{
                                      fontFamily: "Calibri, Arial, sans-serif",
                                      fontSize: "13pt",
                                    }}
                                  >
                                    {formatNumber(computedSubtotal)}
                                  </span>
                                </div>
                                {computedDiscount > 0 && (
                                  <div className="flex justify-between mb-2">
                                    <span
                                      className={`${
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-600"
                                      }`}
                                      style={{
                                        fontFamily:
                                          "Calibri, Arial, sans-serif",
                                        fontSize: "10pt",
                                      }}
                                    >
                                      Discount (AED):
                                    </span>
                                    <span
                                      className={`${
                                        isDarkMode
                                          ? "text-gray-300"
                                          : "text-gray-700"
                                      }`}
                                      style={{
                                        fontFamily:
                                          "Calibri, Arial, sans-serif",
                                        fontSize: "10pt",
                                      }}
                                    >
                                      - {formatCurrency(computedDiscount)}
                                    </span>
                                  </div>
                                )}
                                {(invoice.packingCharges > 0 ||
                                  invoice.freightCharges > 0 ||
                                  invoice.loadingCharges > 0 ||
                                  invoice.otherCharges > 0) && (
                                  <>
                                    {invoice.packingCharges > 0 && (
                                      <div className="flex justify-between mb-2">
                                        <span
                                          className={`${
                                            isDarkMode
                                              ? "text-gray-400"
                                              : "text-gray-600"
                                          }`}
                                          style={{
                                            fontFamily:
                                              "Calibri, Arial, sans-serif",
                                            fontSize: "10pt",
                                          }}
                                        >
                                          Packing Charges:
                                        </span>
                                        <span
                                          className={`${
                                            isDarkMode
                                              ? "text-gray-300"
                                              : "text-gray-700"
                                          }`}
                                          style={{
                                            fontFamily:
                                              "Calibri, Arial, sans-serif",
                                            fontSize: "10pt",
                                          }}
                                        >
                                          {formatCurrency(
                                            invoice.packingCharges
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    {invoice.freightCharges > 0 && (
                                      <div className="flex justify-between mb-2">
                                        <span
                                          className={`${
                                            isDarkMode
                                              ? "text-gray-400"
                                              : "text-gray-600"
                                          }`}
                                          style={{
                                            fontFamily:
                                              "Calibri, Arial, sans-serif",
                                            fontSize: "10pt",
                                          }}
                                        >
                                          Freight Charges:
                                        </span>
                                        <span
                                          className={`${
                                            isDarkMode
                                              ? "text-gray-300"
                                              : "text-gray-700"
                                          }`}
                                          style={{
                                            fontFamily:
                                              "Calibri, Arial, sans-serif",
                                            fontSize: "10pt",
                                          }}
                                        >
                                          {formatCurrency(
                                            invoice.freightCharges
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    {invoice.loadingCharges > 0 && (
                                      <div className="flex justify-between mb-2">
                                        <span
                                          className={`${
                                            isDarkMode
                                              ? "text-gray-400"
                                              : "text-gray-600"
                                          }`}
                                          style={{
                                            fontFamily:
                                              "Calibri, Arial, sans-serif",
                                            fontSize: "10pt",
                                          }}
                                        >
                                          Loading Charges:
                                        </span>
                                        <span
                                          className={`${
                                            isDarkMode
                                              ? "text-gray-300"
                                              : "text-gray-700"
                                          }`}
                                          style={{
                                            fontFamily:
                                              "Calibri, Arial, sans-serif",
                                            fontSize: "10pt",
                                          }}
                                        >
                                          {formatCurrency(
                                            invoice.loadingCharges
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    {invoice.otherCharges > 0 && (
                                      <div className="flex justify-between mb-2">
                                        <span
                                          className={`${
                                            isDarkMode
                                              ? "text-gray-400"
                                              : "text-gray-600"
                                          }`}
                                          style={{
                                            fontFamily:
                                              "Calibri, Arial, sans-serif",
                                            fontSize: "10pt",
                                          }}
                                        >
                                          Other Charges:
                                        </span>
                                        <span
                                          className={`${
                                            isDarkMode
                                              ? "text-gray-300"
                                              : "text-gray-700"
                                          }`}
                                          style={{
                                            fontFamily:
                                              "Calibri, Arial, sans-serif",
                                            fontSize: "10pt",
                                          }}
                                        >
                                          {formatCurrency(invoice.otherCharges)}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                )}
                                <div className="flex justify-between mb-2">
                                  <span
                                    className={`${
                                      isDarkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    }`}
                                    style={{
                                      fontFamily: "Calibri, Arial, sans-serif",
                                      fontSize: "13pt",
                                    }}
                                  >
                                    VAT (AED):
                                  </span>
                                  <span
                                    className={`${
                                      isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                    }`}
                                    style={{
                                      fontFamily: "Calibri, Arial, sans-serif",
                                      fontSize: "13pt",
                                    }}
                                  >
                                    {formatNumber(computedVatAmount)}
                                  </span>
                                </div>
                                {(() => {
                                  const roundOffValue = parseFloat(
                                    invoice.roundOff || 0
                                  );
                                  return (
                                    roundOffValue !== 0 && (
                                      <div className="flex justify-between mb-2">
                                        <span
                                          className={`${
                                            isDarkMode
                                              ? "text-gray-400"
                                              : "text-gray-600"
                                          }`}
                                          style={{
                                            fontFamily:
                                              "Calibri, Arial, sans-serif",
                                            fontSize: "10pt",
                                          }}
                                        >
                                          Round Off:
                                        </span>
                                        <span
                                          className={`${
                                            isDarkMode
                                              ? "text-gray-300"
                                              : "text-gray-700"
                                          }`}
                                          style={{
                                            fontFamily:
                                              "Calibri, Arial, sans-serif",
                                            fontSize: "10pt",
                                          }}
                                        >
                                          {formatCurrency(roundOffValue)}
                                        </span>
                                      </div>
                                    )
                                  );
                                })()}
                                <hr
                                  className={`my-2 ${
                                    isDarkMode
                                      ? "border-gray-700"
                                      : "border-gray-200"
                                  }`}
                                />
                                <div className="flex justify-between mb-2">
                                  <span
                                    className={`font-bold ${
                                      isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                    }`}
                                    style={{
                                      fontFamily: "Calibri, Arial, sans-serif",
                                      fontSize: "13pt",
                                    }}
                                  >
                                    Total Amount (AED):
                                  </span>
                                  <span
                                    className="font-bold text-teal-600"
                                    style={{
                                      fontFamily: "Calibri, Arial, sans-serif",
                                      fontSize: "13pt",
                                    }}
                                  >
                                    {formatNumber(computedTotal)}
                                  </span>
                                </div>
                                {invoice.advanceReceived > 0 && (
                                  <>
                                    <div className="flex justify-between mb-2">
                                      <span
                                        className={`text-xs ${
                                          isDarkMode
                                            ? "text-gray-400"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        Advance Received:
                                      </span>
                                      <span
                                        className={`text-xs ${
                                          isDarkMode
                                            ? "text-gray-300"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {formatCurrency(
                                          invoice.advanceReceived
                                        )}
                                      </span>
                                    </div>
                                    <div
                                      className={`flex justify-between p-2 rounded ${
                                        isDarkMode
                                          ? "bg-gray-800"
                                          : "bg-gray-50"
                                      }`}
                                    >
                                      <span
                                        className={`text-sm font-bold ${
                                          isDarkMode
                                            ? "text-white"
                                            : "text-gray-900"
                                        }`}
                                      >
                                        Balance Amount:
                                      </span>
                                      <span className="text-sm font-bold text-red-600">
                                        {formatCurrency(
                                          Math.max(
                                            0,
                                            computedTotal -
                                              (invoice.advanceReceived || 0)
                                          )
                                        )}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Payment Summary Section - Only for issued invoices with payments */}
                          {invoice.status === 'issued' && invoice.payments && invoice.payments.length > 0 && (
                            <div className="mt-6 pt-6 border-t" style={{ borderColor: isDarkMode ? '#37474F' : '#e5e7eb' }}>
                              {/* Payment Summary Heading */}
                              <h3
                                className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '14pt' }}
                              >
                                Payment Summary
                              </h3>

                              {/* Payment Totals Box */}
                              <div
                                className={`border rounded-lg mb-4 ${
                                  isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
                                }`}
                              >
                                <div className="p-4">
                                  <div className="flex justify-between items-center gap-6">
                                    {/* Totals */}
                                    <div className="flex-1 space-y-2">
                                      <div className="flex justify-between">
                                        <span
                                          className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                          style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '11pt' }}
                                        >
                                          Invoice Total:
                                        </span>
                                        <span
                                          className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                          style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '11pt' }}
                                        >
                                          {formatCurrency(computedTotal)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span
                                          className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                          style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '11pt' }}
                                        >
                                          Total Paid:
                                        </span>
                                        <span
                                          className="font-semibold text-green-600"
                                          style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '11pt' }}
                                        >
                                          {formatCurrency(calculateTotalPaid(invoice.payments))}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span
                                          className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                          style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '11pt' }}
                                        >
                                          Balance Due:
                                        </span>
                                        <span
                                          className={`font-semibold ${
                                            calculateBalanceDue(computedTotal, invoice.payments) > 0
                                              ? 'text-red-600'
                                              : 'text-green-600'
                                          }`}
                                          style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '11pt' }}
                                        >
                                          {formatCurrency(calculateBalanceDue(computedTotal, invoice.payments))}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Payment Status Badge */}
                                    <div className="flex-shrink-0">
                                      {(() => {
                                        const paymentStatus = calculatePaymentStatus(computedTotal, invoice.payments);
                                        const statusConfig = getPaymentStatusConfig(paymentStatus);
                                        return (
                                          <div
                                            className={`px-4 py-2 rounded-full text-center min-w-[140px] ${
                                              isDarkMode ? statusConfig.bgDark : statusConfig.bgLight
                                            }`}
                                          >
                                            <div
                                              className={`text-xs font-bold uppercase tracking-wide ${
                                                isDarkMode ? statusConfig.textDark : statusConfig.textLight
                                              }`}
                                              style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
                                            >
                                              {statusConfig.label}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Payment History Table */}
                              <h4
                                className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '12pt' }}
                              >
                                Payment History
                              </h4>
                              <div
                                className={`border rounded-lg overflow-hidden ${
                                  isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
                                }`}
                              >
                                <table className="w-full">
                                  <thead className="bg-teal-600">
                                    <tr>
                                      <th
                                        className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider"
                                        style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
                                      >
                                        #
                                      </th>
                                      <th
                                        className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider"
                                        style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
                                      >
                                        Date
                                      </th>
                                      <th
                                        className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-wider"
                                        style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
                                      >
                                        Amount
                                      </th>
                                      <th
                                        className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider"
                                        style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
                                      >
                                        Mode
                                      </th>
                                      <th
                                        className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider"
                                        style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
                                      >
                                        Reference
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                    {[...invoice.payments].sort((a, b) => new Date(b.date) - new Date(a.date)).map((payment, index, sortedArray) => {
                                      const formatted = formatPaymentDisplay(payment);
                                      return (
                                        <tr key={payment.id}>
                                          <td
                                            className={`px-3 py-2 text-center ${
                                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}
                                            style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '10pt' }}
                                          >
                                            {sortedArray.length - index}
                                          </td>
                                          <td
                                            className={`px-3 py-2 ${
                                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}
                                            style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '10pt' }}
                                          >
                                            {formatted.formattedDate}
                                          </td>
                                          <td
                                            className="px-3 py-2 text-right font-semibold text-green-600"
                                            style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '10pt' }}
                                          >
                                            {formatted.formattedAmount}
                                          </td>
                                          <td
                                            className={`px-3 py-2 ${
                                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}
                                            style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '10pt' }}
                                          >
                                            {formatted.modeLabel}
                                          </td>
                                          <td
                                            className={`px-3 py-2 ${
                                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}
                                            style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '10pt' }}
                                          >
                                            {payment.reference_number || '-'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Fixed Footer Section - 50mm height, 15mm from bottom edge */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "0px", // Start from the very bottom of the A4 page
                        left: "0",
                        right: "0",
                        height: "189px", // 50mm footer height = 189px (50mm ÷ 25.4 × 96)
                        marginBottom: "57px", // 15mm bottom margin = 57px (15mm ÷ 25.4 × 96)
                        paddingLeft: "45px", // 12mm side margin = 45px (12mm ÷ 25.4 × 96)
                        paddingRight: "45px", // 12mm side margin = 45px
                        paddingTop: "19px", // 5mm top padding = 19px (5mm ÷ 25.4 × 96)
                        paddingBottom: "19px", // 5mm bottom padding = 19px
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center", // Center content vertically in footer area
                        gap: "8px",
                        zIndex: 10,
                        backgroundColor: isDarkMode ? "#1E2328" : "#ffffff",
                        borderTop: `1px solid ${
                          isDarkMode ? "#37474F" : "#e5e7eb"
                        }`, // Visible footer separator
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Footer Content - Notes/Terms on Left, Signature on Right */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "24px",
                          height: "100%",
                          width: "100%",
                        }}
                      >
                        {/* Left Side - Notes and Terms */}
                        <div
                          style={{
                            flex: "1 1 60%",
                            maxWidth: "60%",
                            minHeight: "100px",
                          }}
                        >
                          {invoice.notes || invoice.terms ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                              }}
                            >
                              {invoice.notes && (
                                <div
                                  style={{
                                    border: `1px solid ${
                                      isDarkMode ? "#37474F" : "#e5e7eb"
                                    }`,
                                    borderRadius: "8px",
                                    backgroundColor: isDarkMode
                                      ? "#1E2328"
                                      : "#ffffff",
                                    padding: "8px",
                                  }}
                                >
                                  <h3
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: "bold",
                                      marginBottom: "4px",
                                      color: isDarkMode ? "#ffffff" : "#000000",
                                    }}
                                  >
                                    Notes:
                                  </h3>
                                  <p
                                    style={{
                                      fontSize: "11px",
                                      color: isDarkMode ? "#d1d5db" : "#374151",
                                      whiteSpace: "pre-line",
                                    }}
                                  >
                                    {invoice.notes}
                                  </p>
                                </div>
                              )}
                              {invoice.terms && (
                                <div
                                  style={{
                                    border: `1px solid ${
                                      isDarkMode ? "#37474F" : "#e5e7eb"
                                    }`,
                                    borderRadius: "8px",
                                    backgroundColor: isDarkMode
                                      ? "#1E2328"
                                      : "#ffffff",
                                    padding: "8px",
                                  }}
                                >
                                  <h3
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: "bold",
                                      marginBottom: "4px",
                                      color: isDarkMode ? "#ffffff" : "#000000",
                                    }}
                                  >
                                    Payment as per agreed terms.
                                  </h3>
                                  <p
                                    style={{
                                      fontSize: "11px",
                                      color: isDarkMode ? "#d1d5db" : "#374151",
                                      whiteSpace: "pre-line",
                                    }}
                                  >
                                    {invoice.terms}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize: "11px", color: "#6b7280" }}>
                              No notes or terms available
                            </div>
                          )}
                        </div>

                        {/* Right Side - Signature Area - Always visible */}
                        <div
                          style={{
                            flexShrink: "0",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <img
                              src={seal}
                              alt="Company Seal"
                              crossOrigin="anonymous"
                              style={{
                                height: "96px",
                                width: "auto",
                                objectFit: "contain",
                                opacity: "0.95",
                              }}
                            />
                            <div
                              style={{ textAlign: "center", minWidth: "160px" }}
                            >
                              <p
                                style={{
                                  fontSize: "12px",
                                  marginBottom: "8px",
                                  color: isDarkMode ? "#d1d5db" : "#374151",
                                }}
                              >
                                Authorized Signatory
                              </p>
                              <div
                                style={{
                                  borderBottom: "1px solid #000000",
                                  margin: "0 0 4px 0",
                                  height: "24px",
                                  width: "160px",
                                }}
                              />
                              <p
                                style={{
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  color: isDarkMode ? "#ffffff" : "#000000",
                                }}
                              >
                                {normalizeLLC("ULTIMATE STEELS")}
                              </p>
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                                }}
                              >
                                {normalizeLLC("BUILDING MATERIALS")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}

            {/* Invoice Summary (moved to last page). Keep here only if no items */}
            {(!invoice.items || invoice.items.length === 0) && (
              <div className="flex justify-end mb-8">
                <div
                  className={`border rounded-lg min-w-80 ${
                    isDarkMode
                      ? "border-[#37474F] bg-[#1E2328]"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex justify-between mb-2">
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Subtotal (AED):
                      </span>
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {formatNumber(computedSubtotal)}
                      </span>
                    </div>

                    {computedDiscount > 0 && (
                      <div className="flex justify-between mb-2">
                        <span
                          className={`text-xs ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Discount (AED):
                        </span>
                        <span
                          className={`text-xs ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          - {formatCurrency(computedDiscount)}
                        </span>
                      </div>
                    )}

                    {/* Additional Charges */}
                    {(invoice.packingCharges > 0 ||
                      invoice.freightCharges > 0 ||
                      invoice.loadingCharges > 0 ||
                      invoice.otherCharges > 0) && (
                      <>
                        {invoice.packingCharges > 0 && (
                          <div className="flex justify-between mb-2">
                            <span
                              className={`text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Packing Charges:
                            </span>
                            <span
                              className={`text-xs ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {formatCurrency(invoice.packingCharges)}
                            </span>
                          </div>
                        )}
                        {invoice.freightCharges > 0 && (
                          <div className="flex justify-between mb-2">
                            <span
                              className={`text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Freight Charges:
                            </span>
                            <span
                              className={`text-xs ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {formatCurrency(invoice.freightCharges)}
                            </span>
                          </div>
                        )}
                        {invoice.loadingCharges > 0 && (
                          <div className="flex justify-between mb-2">
                            <span
                              className={`text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Loading Charges:
                            </span>
                            <span
                              className={`text-xs ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {formatCurrency(invoice.loadingCharges)}
                            </span>
                          </div>
                        )}
                        {invoice.otherCharges > 0 && (
                          <div className="flex justify-between mb-2">
                            <span
                              className={`text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Other Charges:
                            </span>
                            <span
                              className={`text-xs ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {formatCurrency(invoice.otherCharges)}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-between mb-2">
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        VAT Amount (AED):
                      </span>
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {formatNumber(computedVatAmount)}
                      </span>
                    </div>

                    {(() => {
                      const roundOffValue = parseFloat(invoice.roundOff || 0);
                      return (
                        roundOffValue !== 0 && (
                          <div className="flex justify-between mb-2">
                            <span
                              className={`${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                              style={{
                                fontFamily: "Calibri, Arial, sans-serif",
                                fontSize: "10pt",
                              }}
                            >
                              Round Off:
                            </span>
                            <span
                              className={`${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                              style={{
                                fontFamily: "Calibri, Arial, sans-serif",
                                fontSize: "10pt",
                              }}
                            >
                              {formatCurrency(roundOffValue)}
                            </span>
                          </div>
                        )
                      );
                    })()}

                    <hr
                      className={`my-2 ${
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      }`}
                    />

                    <div className="flex justify-between mb-4">
                      <span
                        className={`text-lg font-bold ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Total Amount (AED):
                      </span>
                      <span className="text-lg font-bold text-teal-600">
                        {formatNumber(computedTotal)}
                      </span>
                    </div>

                    {/* Advance and Balance */}
                    {invoice.advanceReceived > 0 && (
                      <>
                        <div className="flex justify-between mb-2">
                          <span
                            className={`text-xs ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Advance Received:
                          </span>
                          <span
                            className={`text-xs ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {formatCurrency(invoice.advanceReceived)}
                          </span>
                        </div>
                        <div
                          className={`flex justify-between p-2 rounded ${
                            isDarkMode ? "bg-gray-800" : "bg-gray-50"
                          }`}
                        >
                          <span
                            className={`text-sm font-bold ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            Balance Amount:
                          </span>
                          <span className="text-sm font-bold text-red-600">
                            {formatCurrency(
                              Math.max(
                                0,
                                computedTotal - (invoice.advanceReceived || 0)
                              )
                            )}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Total in Words */}
                    {invoice.totalInWords && (
                      <div
                        className={`mt-4 p-2 rounded ${
                          isDarkMode ? "bg-gray-800" : "bg-blue-50"
                        }`}
                      >
                        <p
                          className={`text-xs italic ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <strong>Amount in Words:</strong>{" "}
                          {invoice.totalInWords}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notes and Terms */}
            {(!invoice.items || invoice.items.length === 0) &&
              (invoice.notes || invoice.terms) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {invoice.notes && (
                    <div>
                      <div
                        className={`border rounded-lg ${
                          isDarkMode
                            ? "border-[#37474F] bg-[#1E2328]"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="p-6">
                          <h3
                            className={`text-lg font-bold mb-4 ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            Notes:
                          </h3>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                            style={{ whiteSpace: 'pre-line' }}
                          >
                            {invoice.notes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {invoice.terms && (
                    <div className={invoice.notes ? "" : "md:col-span-2"}>
                      <div
                        className={`border rounded-lg ${
                          isDarkMode
                            ? "border-[#37474F] bg-[#1E2328]"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="p-6">
                          <h3
                            className={`text-lg font-bold mb-4 ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            Payment as per payment terms:
                          </h3>
                          <p
                            className={`text-sm ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                            style={{ whiteSpace: 'pre-line' }}
                          >
                            {invoice.terms}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* Signature section is now repeated per page above */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
