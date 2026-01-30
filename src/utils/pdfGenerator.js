/**
 * @deprecated This frontend PDF generator is DEPRECATED.
 *
 * MIGRATION NOTICE:
 * -----------------
 * PDF generation has been unified using React SSR + Puppeteer on the backend.
 * This ensures pixel-perfect consistency between preview and PDF download.
 *
 * For PDF downloads, use the backend API endpoints instead:
 * - POST /api/invoices/:id/pdf
 * - POST /api/quotations/:id/pdf
 * - POST /api/purchase-orders/:id/pdf
 * - POST /api/credit-notes/:id/pdf
 * - POST /api/delivery-notes/:id/pdf
 * - POST /api/payments/:id/receipt-pdf
 * - POST /api/customers/:id/statement-pdf
 *
 * The backend uses React SSR to render the SAME React components used for preview,
 * ensuring the PDF matches what users see on screen.
 *
 * This file is kept for backwards compatibility but will be removed in a future version.
 *
 * @see steelapprnp/services/pdfService.js
 * @see steelapprnp/templates/ssrRenderer.js
 */

import {
  formatCurrency as _formatCurrency,
  formatDate as _formatDate,
  calculateTRN,
  calculateSubtotal,
  calculateTotalTRN as _calculateTotalTRN,
  calculateTotal,
  titleCase,
  formatNumber,
  formatDateDMY as _formatDateDMY,
  calculateDiscountedTRN,
  getCompanyImages,
  toUAEDateProfessional,
  toUAEPaymentDateTime,
  TIMEZONE_DISCLAIMER,
} from './invoiceUtils';
import { mergeTemplateSettings } from '../constants/defaultTemplateSettings';

/**
 * Convert hex color to RGB array
 * @param {string} hex - Hex color (e.g., "#5B6DB5")
 * @returns {number[]} RGB array [r, g, b]
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
};

/**
 * @deprecated Use backend API endpoint instead: POST /api/invoices/:id/pdf
 */
export const generateInvoicePDF = async (invoice, company) => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Get company images from company profile
  const { logoUrl: logoCompany, sealUrl: sealImage } =
    getCompanyImages(company);

  // Get template settings (merge company settings with defaults)
  const templateSettings = mergeTemplateSettings(
    company?.settings?.invoiceTemplate || {},
  );
  const {
    colors,
    layout,
    typography,
    branding,
    visibility: _visibility,
    table: _table,
    formatting: _formatting,
    labels: _labels,
  } = templateSettings;

  // Page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = layout.marginLeft;

  // Color scheme from settings
  const primaryColor = hexToRgb(colors.primary);
  const primaryBlue = hexToRgb(colors.primary); // Alias for primaryColor
  const textPrimaryColor = hexToRgb(colors.textPrimary);
  const textSecondaryColor = hexToRgb(colors.textSecondary);
  const textLightColor = hexToRgb(colors.textLight);

  // Helper functions for colors
  const setTextPrimary = () => pdf.setTextColor(...textPrimaryColor);
  const setTextSecondary = () => pdf.setTextColor(...textSecondaryColor);
  const _setTextLight = () => pdf.setTextColor(...textLightColor);
  const _setPrimaryColor = () => pdf.setTextColor(...primaryColor);
  const setBlack = () => pdf.setTextColor(0, 0, 0);
  const setDarkGray = () => pdf.setTextColor(80, 80, 80);

  let currentY = layout.marginTop;

  // ==================== HEADER SECTION ====================
  // Company name and info (left side)
  if (branding.companyNameInHeader) {
    pdf.setFontSize(typography.fontSize.xlarge);
    pdf.setFont(typography.fontFamily, 'bold');
    setTextPrimary();
    const companyName =
      company?.name || 'Ultimate Steels Building Materials Trading';
    pdf.text(companyName, margin, currentY);
    currentY += layout.lineSpacing + 1;
  }

  // Company address and contact
  pdf.setFontSize(typography.fontSize.base);
  pdf.setFont(typography.fontFamily, 'normal');
  setTextSecondary();

  const compAddr = company?.address || {};
  if (compAddr.street) {
    pdf.text(compAddr.street, margin, currentY);
    currentY += 4;
  }

  const cityCountry = [compAddr.city, compAddr.country]
    .filter(Boolean)
    .join(', ');
  if (cityCountry) {
    pdf.text(cityCountry, margin, currentY);
    currentY += 4;
  }

  if (company?.phone) {
    pdf.text(`Mobile: ${company.phone}`, margin, currentY);
    currentY += 4;
  }

  if (company?.email) {
    pdf.text(`Email: ${company.email}`, margin, currentY);
    currentY += 4;
  }

  // VAT Registration
  pdf.setFont('helvetica', 'bold');
  pdf.text('VAT Reg No: 104858252000003', margin, currentY);
  currentY += 2;

  // Add logo on the right side of header (maintain aspect ratio)
  try {
    // Load image to get actual dimensions
    const img = new Image();
    img.src = logoCompany;

    // Set max dimensions
    const maxLogoWidth = 50;
    const maxLogoHeight = 15;

    // Calculate aspect ratio
    let logoWidth = maxLogoWidth;
    let logoHeight = (img.height / img.width) * logoWidth;

    // If height exceeds max, scale down based on height
    if (logoHeight > maxLogoHeight) {
      logoHeight = maxLogoHeight;
      logoWidth = (img.width / img.height) * logoHeight;
    }

    const logoX = pageWidth - margin - logoWidth;
    pdf.addImage(logoCompany, 'PNG', logoX, margin, logoWidth, logoHeight);
  } catch {
    // Logo loading failed - continue without logo
  }

  currentY += 3;

  // Horizontal line separator
  pdf.setDrawColor(91, 109, 181);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  // ==================== INVOICE TITLE BANNER ====================
  // Determine invoice title based on status
  const invoiceTitle =
    invoice.status === 'draft'
      ? 'DRAFT INVOICE'
      : invoice.status === 'proforma'
        ? 'PROFORMA INVOICE'
        : 'TAX INVOICE';

  // Draw title banner (6mm height - industry standard for A4)
  const titleBannerHeight = 6;
  pdf.setFillColor(...primaryColor);
  pdf.rect(margin, currentY, pageWidth - 2 * margin, titleBannerHeight, 'F');

  // Add centered title text (use template fontSize.title - 10pt industry standard)
  pdf.setFontSize(typography.fontSize.title);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  const titleWidth = pdf.getTextWidth(invoiceTitle);
  const titleX = (pageWidth - titleWidth) / 2;
  pdf.text(invoiceTitle, titleX, currentY + 4.2);

  currentY += titleBannerHeight + 4;

  // ==================== INVOICE TO & INVOICE INFO SECTION ====================
  const leftColX = margin;
  const rightColX = pageWidth / 2 + 5;
  const invoiceInfoStartY = currentY;

  // LEFT SIDE - Invoice To
  pdf.setFontSize(typography.fontSize.large);
  pdf.setFont('helvetica', 'bold');
  setBlack();
  pdf.text('Invoice To:', leftColX, currentY);
  currentY += 5;

  pdf.setFontSize(typography.fontSize.base);
  pdf.setFont('helvetica', 'normal');
  const cust = invoice.customer || {};
  const custAddr = cust.address || {};

  if (cust.name) {
    pdf.text(titleCase(cust.name), leftColX, currentY);
    currentY += 4;
  }

  if (custAddr.street) {
    pdf.text(custAddr.street, leftColX, currentY);
    currentY += 4;
  }

  const custCityCountry = [custAddr.city, custAddr.country]
    .filter(Boolean)
    .join(', ');
  if (custCityCountry) {
    pdf.text(custCityCountry, leftColX, currentY);
    currentY += 4;
  }

  if (cust.email) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Email: `, leftColX, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(cust.email, leftColX + 11, currentY);
    currentY += 4;
  }

  if (cust.phone) {
    pdf.text(`Phone: ${cust.phone}`, leftColX, currentY);
    currentY += 4;
  }

  if (cust.vatNumber) {
    pdf.text(`TRN: ${cust.vatNumber}`, leftColX, currentY);
  }

  // RIGHT SIDE - Invoice Info Box with Blue Header
  let rightY = invoiceInfoStartY;
  const boxWidth = pageWidth - rightColX - margin;
  const boxHeaderHeight = 7;

  // Blue header box
  pdf.setFillColor(...primaryBlue);
  pdf.rect(rightColX, rightY, boxWidth, boxHeaderHeight, 'F');

  pdf.setFontSize(typography.fontSize.large);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Invoice No:', rightColX + 2, rightY + 5);

  // Invoice number (right aligned in blue box)
  const invNum = invoice.invoiceNumber || '';
  const invNumWidth = pdf.getTextWidth(invNum);
  pdf.text(invNum, rightColX + boxWidth - invNumWidth - 2, rightY + 5);

  rightY += boxHeaderHeight + 1;

  // Invoice details in white box with border
  const detailsStartY = rightY;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...primaryBlue);

  // Invoice Date - Professional format
  pdf.setFontSize(typography.fontSize.base);
  setBlack();
  pdf.setFont('helvetica', 'bold');
  pdf.text('Invoice Date:', rightColX + 2, rightY + 4);
  pdf.setFont('helvetica', 'normal');
  const invoiceDateStr = toUAEDateProfessional(invoice.date || new Date());
  const invoiceDateWidth = pdf.getTextWidth(invoiceDateStr);
  pdf.text(
    invoiceDateStr,
    rightColX + boxWidth - invoiceDateWidth - 2,
    rightY + 4,
  );
  rightY += 6;

  // Issued Date/Time - Split into two rows for better readability
  // Row 1: "Issued:" with just the date
  const issuedDateTime = invoice.createdAt || invoice.date || new Date();
  const issuedDateStr = toUAEDateProfessional(issuedDateTime);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Issued:', rightColX + 2, rightY + 4);
  pdf.setFont('helvetica', 'normal');
  const issuedDateWidth = pdf.getTextWidth(issuedDateStr);
  pdf.text(
    issuedDateStr,
    rightColX + boxWidth - issuedDateWidth - 2,
    rightY + 4,
  );
  rightY += 5;

  // Row 2: Time portion on separate line (right-aligned)
  // Extract time from the full datetime format
  const issuedDateObj = new Date(issuedDateTime);
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dubai',
  });
  const timeStr = `${timeFormatter.format(issuedDateObj).toUpperCase()} GST (UTC+4)`;
  const timeStrWidth = pdf.getTextWidth(timeStr);
  pdf.setFontSize(typography.fontSize.small);
  setTextSecondary();
  pdf.text(timeStr, rightColX + boxWidth - timeStrWidth - 2, rightY + 3);
  rightY += 5;

  // Reset font settings for next rows
  pdf.setFontSize(typography.fontSize.base);
  setBlack();

  // SO (Sales Order)
  if (invoice.customerPurchaseOrderNumber) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('SO:', rightColX + 2, rightY + 4);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      invoice.customerPurchaseOrderNumber,
      rightColX + boxWidth - 20,
      rightY + 4,
    );
    rightY += 6;
  }

  // Order Date - Professional format
  if (invoice.customerPurchaseOrderDate) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Order Date:', rightColX + 2, rightY + 4);
    pdf.setFont('helvetica', 'normal');
    const orderDateStr = toUAEDateProfessional(
      invoice.customerPurchaseOrderDate,
    );
    const orderDateWidth = pdf.getTextWidth(orderDateStr);
    pdf.text(
      orderDateStr,
      rightColX + boxWidth - orderDateWidth - 2,
      rightY + 4,
    );
    rightY += 6;
  }

  // Due Date - Professional format (if available)
  if (invoice.dueDate) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Due Date:', rightColX + 2, rightY + 4);
    pdf.setFont('helvetica', 'normal');
    const dueDateStr = toUAEDateProfessional(invoice.dueDate);
    const dueDateWidth = pdf.getTextWidth(dueDateStr);
    pdf.text(dueDateStr, rightColX + boxWidth - dueDateWidth - 2, rightY + 4);
    rightY += 6;
  }

  // Draw border around the details box
  const detailsBoxHeight = rightY - detailsStartY;
  pdf.setDrawColor(...primaryBlue);
  pdf.setLineWidth(0.3);
  pdf.rect(
    rightColX,
    invoiceInfoStartY + boxHeaderHeight,
    boxWidth,
    detailsBoxHeight,
  );

  currentY = Math.max(currentY, rightY) + 5;

  // ==================== CURRENCY INFO (Compact one-liner) ====================
  if (invoice.currency && invoice.currency !== 'AED') {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100); // Gray text
    pdf.text(
      `Exchange Rate: 1 ${invoice.currency} = ${formatNumber(invoice.exchangeRate || 1)} AED`,
      margin,
      currentY + 3,
    );

    // Reset text color
    setTextPrimary();
    currentY += 6;
  }

  // ==================== TABLE SECTION (UAE VAT Compliant) ====================
  const _tableStartY = currentY;

  // Table column configuration - Updated for UAE VAT compliance
  // Matches preview proportions: 4%, 44%, 6%, 10%, 10%, 16%, 10%
  const tableWidth = pageWidth - 2 * margin;
  const colWidths = {
    sr: tableWidth * 0.04, // 4% - Sr. No
    description: tableWidth * 0.44, // 44% - Description
    quantity: tableWidth * 0.06, // 6% - Quantity
    unitPrice: tableWidth * 0.1, // 10% - Unit Price
    netAmt: tableWidth * 0.1, // 10% - Net Amount
    vat: tableWidth * 0.16, // 16% - VAT (combined amount and rate)
    total: tableWidth * 0.1, // 10% - Total with VAT
  };

  // Table header with blue background (6mm height - industry standard)
  const tableHeaderHeight = 6;
  pdf.setFillColor(...primaryColor);
  pdf.rect(margin, currentY, pageWidth - 2 * margin, tableHeaderHeight, 'F');

  pdf.setFontSize(typography.fontSize.tableHeader);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);

  let colX = margin + 2;
  pdf.text('Sr.', colX, currentY + 4.2);
  colX += colWidths.sr;
  pdf.text('Description', colX, currentY + 4.2);
  colX += colWidths.description;
  pdf.text('Qty', colX + colWidths.quantity / 2, currentY + 4.2, {
    align: 'center',
  });
  colX += colWidths.quantity;
  pdf.text('Unit Price', colX + colWidths.unitPrice / 2, currentY + 4.2, {
    align: 'center',
  });
  colX += colWidths.unitPrice;
  pdf.text('Net Amt', colX + colWidths.netAmt - 2, currentY + 4.2, {
    align: 'right',
  });
  colX += colWidths.netAmt;
  pdf.text('VAT', colX + colWidths.vat - 2, currentY + 4.2, { align: 'right' });
  colX += colWidths.vat;
  pdf.text('Total', colX + colWidths.total - 2, currentY + 4.2, {
    align: 'right',
  });

  currentY += tableHeaderHeight;

  // Table rows
  const items = invoice.items || [];
  pdf.setFont('helvetica', 'normal');
  setBlack();

  items.forEach((item, index) => {
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      pdf.addPage();
      currentY = margin;
    }

    const rowHeight = 7;

    // Alternating row colors (very light gray for even rows)
    if (index % 2 === 0) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, currentY, pageWidth - 2 * margin, rowHeight, 'F');
    }

    colX = margin + 2;

    pdf.setFontSize(8);
    setTextPrimary();

    // Sr. number
    pdf.text(String(index + 1), colX, currentY + 5);
    colX += colWidths.sr;

    // Description
    const desc = item.name || '';
    const descLines = pdf.splitTextToSize(desc, colWidths.description - 4);
    pdf.setFont('helvetica', 'bold');
    pdf.text(descLines[0] || '', colX, currentY + 5);
    pdf.setFont('helvetica', 'normal');
    colX += colWidths.description;

    // Quantity
    pdf.text(
      String(item.quantity || 0),
      colX + colWidths.quantity / 2,
      currentY + 5,
      { align: 'center' },
    );
    colX += colWidths.quantity;

    // Unit Price
    pdf.text(
      formatNumber(item.rate || 0),
      colX + colWidths.unitPrice - 2,
      currentY + 5,
      { align: 'right' },
    );
    colX += colWidths.unitPrice;

    // Net Amount (excluding VAT)
    const amountNum = parseFloat(item.amount) || 0;
    pdf.text(
      formatNumber(amountNum),
      colX + colWidths.netAmt - 2,
      currentY + 5,
      { align: 'right' },
    );
    colX += colWidths.netAmt;

    // VAT (combined amount and rate)
    const vatRate = item.vatRate || 0;
    const vatAmount = calculateTRN(amountNum, vatRate);
    const vatText = `${formatNumber(vatAmount)} (${vatRate > 0 ? `${vatRate}%` : '0%'})`;
    pdf.text(vatText, colX + colWidths.vat - 2, currentY + 5, {
      align: 'right',
    });
    colX += colWidths.vat;

    // Total (including VAT)
    const totalWithVAT = amountNum + vatAmount;
    pdf.setFont('helvetica', 'bold');
    pdf.text(
      formatNumber(totalWithVAT),
      colX + colWidths.total - 2,
      currentY + 5,
      { align: 'right' },
    );
    pdf.setFont('helvetica', 'normal');

    currentY += rowHeight;
  });

  // Bottom border of table
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 5;

  // ==================== TOTALS SECTION ====================
  const totalsX = pageWidth - margin - 60;

  const subtotalVal = calculateSubtotal(items);
  const discountPerc = parseFloat(invoice.discountPercentage) || 0;
  const discountFlat = parseFloat(invoice.discountAmount) || 0;
  const discountVal =
    invoice.discountType === 'percentage'
      ? (subtotalVal * discountPerc) / 100
      : discountFlat;
  const vatVal = calculateDiscountedTRN(
    items,
    invoice.discountType,
    invoice.discountPercentage,
    invoice.discountAmount,
  );
  const additionalCharges =
    (parseFloat(invoice.packingCharges) || 0) +
    (parseFloat(invoice.freightCharges) || 0) +
    (parseFloat(invoice.loadingCharges) || 0) +
    (parseFloat(invoice.otherCharges) || 0);
  const totalVal = calculateTotal(
    Math.max(0, subtotalVal - discountVal) + additionalCharges,
    vatVal,
  );

  pdf.setFontSize(typography.fontSize.base);
  pdf.setFont('helvetica', 'normal');
  setBlack();

  // SubTotal
  pdf.text('SubTotal', totalsX, currentY);
  pdf.text(`AED ${formatNumber(subtotalVal)}`, pageWidth - margin, currentY, {
    align: 'right',
  });
  currentY += 5;

  // Discount (if applicable)
  if (discountVal > 0) {
    pdf.text('Discount', totalsX, currentY);
    pdf.text(
      `- AED ${formatNumber(discountVal)}`,
      pageWidth - margin,
      currentY,
      { align: 'right' },
    );
    currentY += 5;
  }

  // VAT
  pdf.text('VAT', totalsX, currentY);
  pdf.text(`AED ${formatNumber(vatVal)}`, pageWidth - margin, currentY, {
    align: 'right',
  });
  currentY += 5;

  // TOTAL (bold)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(typography.fontSize.large);
  pdf.text('TOTAL', totalsX, currentY);
  pdf.text(`AED ${formatNumber(totalVal)}`, pageWidth - margin, currentY, {
    align: 'right',
  });
  currentY += 8;

  // ==================== BALANCE DUE (from payments array) ====================
  // Calculate total paid from payments array (industry standard - no separate advance field)
  const totalPaidFromPayments = (invoice.payments || []).reduce(
    (sum, p) => sum + (parseFloat(p.amount) || 0),
    0,
  );
  if (totalPaidFromPayments > 0) {
    // Draw separator line
    pdf.setLineWidth(0.2);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(totalsX, currentY, pageWidth - margin, currentY);
    currentY += 4;

    // Show payments received
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(typography.fontSize.base);
    pdf.setTextColor(34, 139, 34); // Green color for payments
    pdf.text('Less: Payments Received', totalsX, currentY);
    pdf.text(
      `- AED ${formatNumber(totalPaidFromPayments)}`,
      pageWidth - margin,
      currentY,
      { align: 'right' },
    );
    currentY += 6;

    // Calculate and show balance due
    const balanceDue = Math.max(0, totalVal - totalPaidFromPayments);
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(...primaryColor);
    pdf.line(totalsX, currentY, pageWidth - margin, currentY);
    currentY += 5;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(typography.fontSize.large);
    pdf.setTextColor(...textPrimaryColor);
    pdf.text('Balance Due', totalsX, currentY);
    pdf.text(`AED ${formatNumber(balanceDue)}`, pageWidth - margin, currentY, {
      align: 'right',
    });
    currentY += 10;
  }

  // ==================== PAYMENT HISTORY SECTION (Optional) ====================
  // Only show if there are payments
  if (invoice.payments && invoice.payments.length > 0) {
    pdf.setFontSize(typography.fontSize.large);
    pdf.setFont('helvetica', 'bold');
    setBlack();
    pdf.text('Payment History', margin, currentY);
    currentY += 6;

    // Payment table header (6mm height - consistent with main table)
    pdf.setFillColor(...primaryBlue);
    pdf.rect(margin, currentY, pageWidth - 2 * margin, tableHeaderHeight, 'F');

    pdf.setFontSize(typography.fontSize.tableHeader);
    pdf.setTextColor(255, 255, 255);

    const payColWidths = {
      sr: 15,
      date: 35,
      method: 40,
      ref: 50,
      amount: 35,
    };

    colX = margin + 2;
    pdf.text('Sr.', colX, currentY + 4.2);
    colX += payColWidths.sr;
    pdf.text('Date', colX, currentY + 4.2);
    colX += payColWidths.date;
    pdf.text('Method', colX, currentY + 4.2);
    colX += payColWidths.method;
    pdf.text('Ref.', colX, currentY + 4.2);
    colX += payColWidths.ref;
    pdf.text('Amount', colX + payColWidths.amount - 2, currentY + 4.2, {
      align: 'right',
    });

    currentY += tableHeaderHeight;

    // Payment rows
    pdf.setFont('helvetica', 'normal');
    setBlack();

    invoice.payments.forEach((payment, index) => {
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, currentY, pageWidth - 2 * margin, 6, 'F');
      }

      colX = margin + 2;
      pdf.text(String(index + 1), colX, currentY + 4);
      colX += payColWidths.sr;
      // Use professional payment datetime format with GST indicator
      pdf.text(
        toUAEPaymentDateTime(payment.date || new Date()),
        colX,
        currentY + 4,
      );
      colX += payColWidths.date;
      pdf.text(payment.method || '', colX, currentY + 4);
      colX += payColWidths.method;
      pdf.text(payment.reference || '', colX, currentY + 4);
      colX += payColWidths.ref;
      pdf.text(
        `AED ${formatNumber(payment.amount || 0)}`,
        colX + payColWidths.amount - 2,
        currentY + 4,
        { align: 'right' },
      );

      currentY += 6;
    });

    currentY += 5;
  }

  // ==================== FOOTER SECTION ====================
  pdf.setFontSize(typography.fontSize.base);
  pdf.setFont('helvetica', 'normal');
  setDarkGray();

  // Payment Terms
  if (invoice.terms) {
    pdf.text('\u2022 Payment Term: ', margin, currentY);
    const termsText = pdf.splitTextToSize(
      invoice.terms,
      pageWidth - margin - 40,
    );
    pdf.text(termsText[0] || '', margin + 26, currentY);
    currentY += 5;
  }

  // Notes/Comments
  if (invoice.notes) {
    pdf.text('\u2022 Comment: ', margin, currentY);
    const notesText = pdf.splitTextToSize(
      invoice.notes,
      pageWidth - margin - 40,
    );
    pdf.text(notesText[0] || '', margin + 20, currentY);
    currentY += 5;
  }

  // Place of Supply (Warehouse) - UAE VAT Compliance
  if (invoice.warehouseName || invoice.warehouseCode || invoice.warehouseCity) {
    const warehouseInfo = [
      invoice.warehouseName,
      invoice.warehouseCode,
      invoice.warehouseCity,
    ]
      .filter(Boolean)
      .join(', ');
    pdf.text('\u2022 Place of Supply (Warehouse): ', margin, currentY);
    pdf.text(warehouseInfo, margin + 45, currentY);
    currentY += 5;
  }

  currentY += 2;

  // Tax Notes Section - UAE VAT Compliance (highlighted)
  if (invoice.taxNotes) {
    const taxNotesLines = pdf.splitTextToSize(
      invoice.taxNotes,
      pageWidth - 2 * margin - 8,
    );
    const taxNotesHeight = Math.max(14, 6 + taxNotesLines.length * 4);

    // Light yellow background box (bg-yellow-50)
    pdf.setFillColor(254, 252, 232);
    pdf.rect(margin, currentY, pageWidth - 2 * margin, taxNotesHeight, 'F');

    // Thick left border (border-yellow-500)
    pdf.setDrawColor(234, 179, 8);
    pdf.setLineWidth(2);
    pdf.line(margin, currentY, margin, currentY + taxNotesHeight);

    // Reset line width
    pdf.setLineWidth(0.3);

    pdf.setFontSize(typography.fontSize.base);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(113, 63, 18); // text-yellow-900
    pdf.text('Tax Notes:', margin + 3, currentY + 5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(typography.fontSize.small);
    pdf.setTextColor(133, 77, 14); // text-yellow-800
    pdf.text(taxNotesLines, margin + 3, currentY + 10);

    // Reset text color
    setTextPrimary();

    currentY += taxNotesHeight + 2;
  }

  currentY += 4;

  // ==================== FOOTER SPACE CHECK ====================
  // Ensure we have enough space for signature/seal section + contact footer
  const footerRequiredSpace = 50; // Minimum space needed for seal + signature + contact info
  const availableSpace = pageHeight - currentY - layout.marginBottom;

  if (availableSpace < footerRequiredSpace) {
    pdf.addPage();
    currentY = layout.marginTop;
  }

  // ==================== SIGNATURE AND SEAL SECTION ====================
  const signatureY = currentY;

  // Company Seal/Stamp - Left Side
  try {
    const sealSize = 20; // 20mm x 20mm seal
    pdf.addImage(sealImage, 'PNG', margin, signatureY, sealSize, sealSize);

    // Seal label
    pdf.setFontSize(8);
    setDarkGray();
    pdf.text('Company Seal', margin + sealSize + 3, signatureY + 5);
    pdf.setFontSize(7);
    pdf.text('Ultimate Steels', margin + sealSize + 3, signatureY + 9);
    pdf.text('Building Materials', margin + sealSize + 3, signatureY + 12);
    pdf.text('Trading LLC', margin + sealSize + 3, signatureY + 15);
  } catch (_error) {
    // Fallback: just show text if seal image fails
    pdf.setDrawColor(60);
    pdf.rect(margin, signatureY, 20, 20);
    pdf.setFontSize(8);
    setDarkGray();
    pdf.text('Company Seal', margin + 2, signatureY + 5);
  }

  // Authorized Signatory - Right Side
  const signatoryX = pageWidth - margin - 60;
  pdf.setFontSize(typography.fontSize.base);
  setBlack();
  pdf.setFont('helvetica', 'bold');
  pdf.text('Authorized Signatory', signatoryX, signatureY + 5);

  // Signature line
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.3);
  pdf.line(signatoryX, signatureY + 16, signatoryX + 55, signatureY + 16);

  // Company name under signature
  pdf.setFontSize(typography.fontSize.small);
  setDarkGray();
  pdf.text('ULTIMATE STEELS', signatoryX + 5, signatureY + 19);
  pdf.text('BUILDING MATERIALS TRADING', signatoryX, signatureY + 22);

  currentY = signatureY + 24;

  // Bottom footer line
  const footerY = currentY;
  pdf.setDrawColor(91, 109, 181);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY, pageWidth - margin, footerY);

  // Contact information
  pdf.setFontSize(typography.fontSize.small);
  setDarkGray();
  const contactInfo = `Phone: ${company?.phone || '+971 XXX XXX'} | Email: ${company?.email || 'info@example.com'} | Website: www.ultimatesteels.com`;
  const contactWidth = pdf.getTextWidth(contactInfo);
  pdf.text(contactInfo, (pageWidth - contactWidth) / 2, footerY + 3);

  // Timezone disclaimer - Important for international business
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'italic');
  const disclaimerWidth = pdf.getTextWidth(TIMEZONE_DISCLAIMER);
  pdf.text(TIMEZONE_DISCLAIMER, (pageWidth - disclaimerWidth) / 2, footerY + 6);

  // Page number
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(typography.fontSize.small);
  pdf.text(`Page: 1 / 1`, pageWidth / 2, footerY + 9, { align: 'center' });

  // Save the PDF
  pdf.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);
  return true;
};

// Export placeholder functions for compatibility
const createInvoiceElement = (_invoice, _company) => {
  return null;
};

const waitForImages = (_container) => {
  return Promise.resolve();
};

export { createInvoiceElement, waitForImages };
