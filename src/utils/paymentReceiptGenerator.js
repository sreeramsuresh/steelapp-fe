// jsPDF is loaded dynamically to enable proper code splitting
// This avoids the Vite warning about mixed static/dynamic imports
import { formatCurrency, normalizeLLC, titleCase, formatDateDMY } from './invoiceUtils';
import { formatPaymentDisplay } from './paymentUtils';
import { generateReceiptHTML } from './receiptTemplateGenerator';

/**
 * Lazy load jsPDF to reduce initial bundle size
 * PDF generation is not needed on page load
 */
const getJsPDF = async () => {
  const { jsPDF } = await import('jspdf');
  return jsPDF;
};

/**
 * Generates or retrieves receipt number for a payment
 * Format: RCP-YYYY-NNNN (Year + Sequential Number)
 * Best Practice: Globally unique across entire system
 *
 * @param {Object} payment - Payment object that may contain receipt_number
 * @param {number} paymentIndex - Index for fallback generation (1-based)
 * @returns {string} Receipt number in format RCP-YYYY-NNNN
 */
export const generateReceiptNumber = (payment, paymentIndex = 1) => {
  // Priority 1: Use existing receipt number from database (check both camelCase and snake_case)
  if (payment && (payment.receiptNumber || payment.receipt_number)) {
    return payment.receiptNumber || payment.receipt_number;
  }

  // Priority 2: Generate fallback with current year + index
  // This should rarely be used - backend should always generate receipt numbers
  const year = new Date().getFullYear();
  const paddedIndex = String(paymentIndex).padStart(4, '0');
  return `RCP-${year}-${paddedIndex}`;
};

/**
 * Generate FTA-Compliant Receipt HTML
 * Uses new receiptTemplateGenerator for VAT compliance
 * 
 * @param {Object} payment - Payment record with all receipt details
 * @param {Object} invoice - Invoice being paid
 * @param {Object} company - Company details (with TRN)
 * @param {Object} customer - Customer details
 * @param {number} paymentIndex - Sequential index (1-based)
 * @returns {string} FTA-compliant receipt HTML
 */
export const generateFTACompliantReceiptHTML = (payment, invoice, company, customer, paymentIndex = 1) => {
  return generateReceiptHTML(payment, invoice, company, customer, paymentIndex);
};

/**
 * Helper function to add payment history table to PDF
 */
const addPaymentHistoryTable = (pdf, invoice, currentPayment, yPos, margin, pageWidth) => {
  const allPayments = (invoice.payments || []).filter(p => !p.voided).sort((a, b) => {
    const dateA = new Date(a.paymentDate || a.payment_date || 0);
    const dateB = new Date(b.paymentDate || b.payment_date || 0);
    
    // Primary sort: by date (newest first)
    if (dateB.getTime() !== dateA.getTime()) {
      return dateB - dateA;
    }
    
    // Secondary sort: by ID descending (most recent payment first when dates are the same)
    const idA = a.id || a.paymentId || a.payment_id || 0;
    const idB = b.id || b.paymentId || b.payment_id || 0;
    return idB - idA;
  });

  if (allPayments.length === 0) {
    return yPos;
  }

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Complete Payment History', margin, yPos);
  yPos += 8;

  // Table headers
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');

  // Adjusted column positions for better spacing
  // Receipt No (30mm) | Date (25mm) | Method (28mm) | Ref No (40mm) | Amount (remaining)
  const colX = {
    receiptNo: margin,
    date: margin + 28,
    method: margin + 55,
    refNo: margin + 85,
    amount: pageWidth - margin - 32,  // Increased space from right edge
  };

  pdf.text('Receipt No', colX.receiptNo, yPos);
  pdf.text('Date', colX.date, yPos);
  pdf.text('Method', colX.method, yPos);
  pdf.text('Ref No', colX.refNo, yPos);
  pdf.text('Amount', colX.amount, yPos, { align: 'right' });
  yPos += 5;

  // Header underline
  pdf.setLineWidth(0.3);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  allPayments.forEach((pmt, idx) => {
    // Use the receipt number from the payment object (from database)
    const receiptNum = generateReceiptNumber(pmt, idx + 1);
    const isCurrentPayment = pmt.id === currentPayment.id;

    // Highlight current payment
    if (isCurrentPayment) {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin - 2, yPos - 4, pageWidth - 2 * margin + 4, 6, 'F');
      pdf.setFont('helvetica', 'bold');
    }

    pdf.text(receiptNum, colX.receiptNo, yPos);

    // Format date properly - handle different date formats
    let dateStr = 'N/A';
    try {
      if (pmt.paymentDate) {
        dateStr = formatDateDMY(pmt.paymentDate);
      }
    } catch (e) {
      console.error('Date formatting error:', e);
      dateStr = 'Invalid';
    }
    pdf.text(dateStr, colX.date, yPos);

    const pmtFormatted = formatPaymentDisplay(pmt);
    const methodText = pmtFormatted.modeLabel.length > 10 ? `${pmtFormatted.modeLabel.substring(0, 8)  }..` : pmtFormatted.modeLabel;
    pdf.text(methodText, colX.method, yPos);

    // Allow more space for reference numbers (up to 20 characters)
    const refText = (pmt.referenceNumber || '-').substring(0, 20);
    pdf.text(refText, colX.refNo, yPos);
    pdf.text(formatCurrency(pmt.amount), colX.amount, yPos, { align: 'right' });

    if (isCurrentPayment) {
      pdf.setFont('helvetica', 'normal');
    }

    yPos += 6;
  });

  // Bottom line
  pdf.setLineWidth(0.3);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 3;

  // Note about highlighted row
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text('(Highlighted row indicates this receipt\'s payment)', margin, yPos);
  yPos += 10;

  return yPos;
};

/**
 * Helper function to add status badge
 */
const addStatusBadge = (pdf, balanceDue, yPos, margin, pageWidth) => {
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');

  if (balanceDue <= 0) {
    // FULLY PAID badge
    pdf.setDrawColor(34, 197, 94); // green border
    pdf.setLineWidth(1);
    pdf.rect(pageWidth - margin - 50, yPos - 6, 50, 10);
    pdf.setTextColor(34, 197, 94); // green text
    pdf.text('FULLY PAID', pageWidth - margin - 25, yPos, { align: 'center' });
    pdf.setTextColor(0, 0, 0); // reset to black
  } else {
    // OUTSTANDING badge
    pdf.setDrawColor(239, 68, 68); // red border
    pdf.setLineWidth(1);
    pdf.rect(pageWidth - margin - 60, yPos - 6, 60, 10);
    pdf.setTextColor(239, 68, 68); // red text
    pdf.text('OUTSTANDING', pageWidth - margin - 30, yPos, { align: 'center' });
    pdf.setTextColor(0, 0, 0); // reset to black
  }

  return yPos + 10;
};

/**
 * Generates a PDF payment receipt for a single payment
 * Professional monochrome design following industry best practices
 * @param {Object} payment - The payment object
 * @param {Object} invoice - The invoice object
 * @param {Object} company - The company details
 * @param {number} paymentIndex - The index of this payment (for receipt numbering)
 */
export const generatePaymentReceipt = async (payment, invoice, company, paymentIndex = 1) => {
  try {
    // Lazy load jsPDF for code splitting
    const jsPDF = await getJsPDF();
    // A4 size: 210mm x 297mm (standard)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 20;
    let yPos = margin;

    // Standard font settings - black text only
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');

    // ========== HEADER SECTION ==========
    // Receipt Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAYMENT RECEIPT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Receipt Number and Date - use payment object for proper receipt number from database
    const receiptNumber = generateReceiptNumber(payment, paymentIndex);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const receiptDate = new Date();
    pdf.text(`Receipt No: ${receiptNumber}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    pdf.text(`Date: ${formatDateDMY(receiptDate.toISOString().split('T')[0])}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // Top separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // ========== FROM SECTION (Company Details) ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('From:', margin, yPos);
    yPos += 6;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(normalizeLLC(company?.name || 'Ultimate Steels Building Materials Trading'), margin, yPos);
    yPos += 5;

    pdf.setFont('helvetica', 'normal');
    if (company.address?.street) {
      pdf.text(company.address.street, margin, yPos);
      yPos += 5;
    }
    if (company.address?.city && company.address?.country) {
      pdf.text(`${company.address.city}, ${company.address.country}`, margin, yPos);
      yPos += 5;
    }
    if (company.phone) {
      pdf.text(`Phone: ${company.phone}`, margin, yPos);
      yPos += 5;
    }
    if (company.email) {
      pdf.text(`Email: ${company.email}`, margin, yPos);
      yPos += 5;
    }
    if (company.vatNumber) {
      pdf.text(`TRN: ${company.vatNumber}`, margin, yPos);
      yPos += 5;
    }
    yPos += 8;

    // Separator line
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // ========== RECEIVED FROM SECTION (Customer Details) ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Received From:', margin, yPos);
    yPos += 6;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(titleCase(normalizeLLC(invoice.customer.name)), margin, yPos);
    yPos += 5;

    if (invoice.customer.address?.street) {
      pdf.text(invoice.customer.address.street, margin, yPos);
      yPos += 5;
    }
    if (invoice.customer.address?.city && invoice.customer.address?.country) {
      pdf.text(`${invoice.customer.address.city}, ${invoice.customer.address.country}`, margin, yPos);
      yPos += 5;
    }
    if (invoice.customer.phone) {
      pdf.text(`Phone: ${invoice.customer.phone}`, margin, yPos);
      yPos += 5;
    }
    if (invoice.customer.email) {
      pdf.text(`Email: ${invoice.customer.email}`, margin, yPos);
      yPos += 5;
    }
    if (invoice.customer.vatNumber) {
      pdf.text(`TRN: ${invoice.customer.vatNumber}`, margin, yPos);
      yPos += 5;
    }
    yPos += 8;

    // Separator line
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 12;

    // ========== CURRENT PAYMENT DETAILS SECTION ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Current Payment Received', margin, yPos);
    yPos += 8;

    // Format payment data
    const formatted = formatPaymentDisplay(payment);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Two-column layout for payment details
    const labelWidth = 40;
    const col1X = margin;
    const col2X = pageWidth / 2 + 10;

    // Left column
    let leftY = yPos;

    // Invoice Reference
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice No:', col1X, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.invoiceNumber, col1X + labelWidth, leftY);
    leftY += 6;

    // Payment Date
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Date:', col1X, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatted.formattedDate, col1X + labelWidth, leftY);
    leftY += 6;

    // Payment Method
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Method:', col1X, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatted.modeLabel, col1X + labelWidth, leftY);
    leftY += 6;

    // Reference Number (if available)
    if (payment.referenceNumber) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reference No:', col1X, leftY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(payment.referenceNumber, col1X + labelWidth, leftY);
      leftY += 6;
    }

    // Right column - Amount Received (prominent)
    let rightY = yPos;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Amount Received:', col2X, rightY);
    rightY += 6;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatted.formattedAmount, col2X, rightY);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    yPos = Math.max(leftY, rightY) + 10;

    // Notes section (if any)
    if (payment.notes) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Notes:', margin, yPos);
      yPos += 6;

      pdf.setFont('helvetica', 'normal');
      const noteLines = pdf.splitTextToSize(payment.notes, pageWidth - 2 * margin);
      pdf.text(noteLines, margin, yPos);
      yPos += noteLines.length * 5 + 8;
    } else {
      yPos += 5;
    }

    // Separator line
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 12;

    // ========== PAYMENT HISTORY TABLE ==========
    yPos = addPaymentHistoryTable(pdf, invoice, payment, yPos, margin, pageWidth);
    yPos += 5;

    // Separator line
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 12;

    // ========== INVOICE SUMMARY ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Summary', margin, yPos);
    yPos += 8;

    // Calculate totals
    const invoiceTotal = invoice.total || 0;
    const totalPaid = (invoice.payments || []).filter(p => !p.voided).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const balanceDue = Math.max(0, invoiceTotal - totalPaid);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Three-column summary
    const summaryLabelWidth = 35;

    // Invoice Total
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Total:', margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatCurrency(invoiceTotal), margin + summaryLabelWidth, yPos);
    yPos += 6;

    // Total Paid
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total Paid:', margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatCurrency(totalPaid), margin + summaryLabelWidth, yPos);
    yPos += 6;

    // Balance Due
    pdf.setFont('helvetica', 'bold');
    pdf.text('Balance Due:', margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatCurrency(balanceDue), margin + summaryLabelWidth, yPos);

    // Add status badge on the right
    yPos = addStatusBadge(pdf, balanceDue, yPos, margin, pageWidth);
    yPos += 10;

    // ========== FOOTER SECTION ==========
    // Ensure we have enough space for footer (need at least 50mm from bottom)
    const footerStartY = pageHeight - 55;
    yPos = Math.max(yPos, footerStartY);

    // Thank you message
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Thank you for your payment!', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Signature section
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    const sigLineLength = 50;
    const sigLineX = pageWidth - margin - sigLineLength;

    // Signature line
    pdf.setLineWidth(0.3);
    pdf.line(sigLineX, yPos, sigLineX + sigLineLength, yPos);
    yPos += 5;

    pdf.text('Authorized Signatory', sigLineX + (sigLineLength / 2), yPos, { align: 'center' });
    yPos += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text(normalizeLLC(company?.name || 'ULTIMATE STEELS'), sigLineX + (sigLineLength / 2), yPos, { align: 'center' });
    yPos += 10;

    // Bottom disclaimer - positioned relative to signature, not absolute
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    // Split long text into multiple lines if needed
    const disclaimerText = 'This is a computer-generated receipt and does not require a physical signature.';
    const maxWidth = pageWidth - 2 * margin;
    const disclaimerLines = pdf.splitTextToSize(disclaimerText, maxWidth);
    pdf.text(disclaimerLines, pageWidth / 2, yPos, { align: 'center' });

    // Save the PDF
    const fileName = `Payment_Receipt_${receiptNumber}.pdf`;
    pdf.save(fileName);

    return { success: true, fileName, receiptNumber };
  } catch (error) {
    console.error('Error generating payment receipt:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prints a payment receipt (opens PDF in browser print dialog)
 * Professional monochrome design following industry best practices
 * @param {Object} payment - The payment object
 * @param {Object} invoice - The invoice object
 * @param {Object} company - The company details
 * @param {number} paymentIndex - The index of this payment (for receipt numbering)
 */
export const printPaymentReceipt = async (payment, invoice, company, paymentIndex = 1) => {
  try {
    // Lazy load jsPDF for code splitting
    const jsPDF = await getJsPDF();
    // A4 size: 210mm x 297mm (standard)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 20;
    let yPos = margin;

    // Standard font settings - black text only
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');

    // ========== HEADER SECTION ==========
    // Receipt Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAYMENT RECEIPT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Receipt Number and Date - use payment object for proper receipt number from database
    const receiptNumber = generateReceiptNumber(payment, paymentIndex);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const receiptDate = new Date();
    pdf.text(`Receipt No: ${receiptNumber}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    pdf.text(`Date: ${formatDateDMY(receiptDate.toISOString().split('T')[0])}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // Top separator line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // ========== FROM SECTION (Company Details) ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('From:', margin, yPos);
    yPos += 6;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(normalizeLLC(company?.name || 'Ultimate Steels Building Materials Trading'), margin, yPos);
    yPos += 5;

    pdf.setFont('helvetica', 'normal');
    if (company.address?.street) {
      pdf.text(company.address.street, margin, yPos);
      yPos += 5;
    }
    if (company.address?.city && company.address?.country) {
      pdf.text(`${company.address.city}, ${company.address.country}`, margin, yPos);
      yPos += 5;
    }
    if (company.phone) {
      pdf.text(`Phone: ${company.phone}`, margin, yPos);
      yPos += 5;
    }
    if (company.email) {
      pdf.text(`Email: ${company.email}`, margin, yPos);
      yPos += 5;
    }
    if (company.vatNumber) {
      pdf.text(`TRN: ${company.vatNumber}`, margin, yPos);
      yPos += 5;
    }
    yPos += 8;

    // Separator line
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // ========== RECEIVED FROM SECTION (Customer Details) ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Received From:', margin, yPos);
    yPos += 6;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(titleCase(normalizeLLC(invoice.customer.name)), margin, yPos);
    yPos += 5;

    if (invoice.customer.address?.street) {
      pdf.text(invoice.customer.address.street, margin, yPos);
      yPos += 5;
    }
    if (invoice.customer.address?.city && invoice.customer.address?.country) {
      pdf.text(`${invoice.customer.address.city}, ${invoice.customer.address.country}`, margin, yPos);
      yPos += 5;
    }
    if (invoice.customer.phone) {
      pdf.text(`Phone: ${invoice.customer.phone}`, margin, yPos);
      yPos += 5;
    }
    if (invoice.customer.email) {
      pdf.text(`Email: ${invoice.customer.email}`, margin, yPos);
      yPos += 5;
    }
    if (invoice.customer.vatNumber) {
      pdf.text(`TRN: ${invoice.customer.vatNumber}`, margin, yPos);
      yPos += 5;
    }
    yPos += 8;

    // Separator line
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 12;

    // ========== CURRENT PAYMENT DETAILS SECTION ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Current Payment Received', margin, yPos);
    yPos += 8;

    // Format payment data
    const formatted = formatPaymentDisplay(payment);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Two-column layout for payment details
    const labelWidth = 40;
    const col1X = margin;
    const col2X = pageWidth / 2 + 10;

    // Left column
    let leftY = yPos;

    // Invoice Reference
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice No:', col1X, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.invoiceNumber, col1X + labelWidth, leftY);
    leftY += 6;

    // Payment Date
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Date:', col1X, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatted.formattedDate, col1X + labelWidth, leftY);
    leftY += 6;

    // Payment Method
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Method:', col1X, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatted.modeLabel, col1X + labelWidth, leftY);
    leftY += 6;

    // Reference Number (if available)
    if (payment.referenceNumber) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reference No:', col1X, leftY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(payment.referenceNumber, col1X + labelWidth, leftY);
      leftY += 6;
    }

    // Right column - Amount Received (prominent)
    let rightY = yPos;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Amount Received:', col2X, rightY);
    rightY += 6;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatted.formattedAmount, col2X, rightY);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    yPos = Math.max(leftY, rightY) + 10;

    // Notes section (if any)
    if (payment.notes) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Notes:', margin, yPos);
      yPos += 6;

      pdf.setFont('helvetica', 'normal');
      const noteLines = pdf.splitTextToSize(payment.notes, pageWidth - 2 * margin);
      pdf.text(noteLines, margin, yPos);
      yPos += noteLines.length * 5 + 8;
    } else {
      yPos += 5;
    }

    // Separator line
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 12;

    // ========== PAYMENT HISTORY TABLE ==========
    yPos = addPaymentHistoryTable(pdf, invoice, payment, yPos, margin, pageWidth);
    yPos += 5;

    // Separator line
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 12;

    // ========== INVOICE SUMMARY ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Summary', margin, yPos);
    yPos += 8;

    // Calculate totals
    const invoiceTotal = invoice.total || 0;
    const totalPaid = (invoice.payments || []).filter(p => !p.voided).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const balanceDue = Math.max(0, invoiceTotal - totalPaid);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Three-column summary
    const summaryLabelWidth = 35;

    // Invoice Total
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Total:', margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatCurrency(invoiceTotal), margin + summaryLabelWidth, yPos);
    yPos += 6;

    // Total Paid
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total Paid:', margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatCurrency(totalPaid), margin + summaryLabelWidth, yPos);
    yPos += 6;

    // Balance Due
    pdf.setFont('helvetica', 'bold');
    pdf.text('Balance Due:', margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatCurrency(balanceDue), margin + summaryLabelWidth, yPos);

    // Add status badge on the right
    yPos = addStatusBadge(pdf, balanceDue, yPos, margin, pageWidth);
    yPos += 10;

    // ========== FOOTER SECTION ==========
    // Ensure we have enough space for footer (need at least 50mm from bottom)
    const footerStartY = pageHeight - 55;
    yPos = Math.max(yPos, footerStartY);

    // Thank you message
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Thank you for your payment!', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Signature section
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    const sigLineLength = 50;
    const sigLineX = pageWidth - margin - sigLineLength;

    // Signature line
    pdf.setLineWidth(0.3);
    pdf.line(sigLineX, yPos, sigLineX + sigLineLength, yPos);
    yPos += 5;

    pdf.text('Authorized Signatory', sigLineX + (sigLineLength / 2), yPos, { align: 'center' });
    yPos += 4;
    pdf.setFont('helvetica', 'bold');
    pdf.text(normalizeLLC(company?.name || 'ULTIMATE STEELS'), sigLineX + (sigLineLength / 2), yPos, { align: 'center' });
    yPos += 10;

    // Bottom disclaimer - positioned relative to signature, not absolute
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    // Split long text into multiple lines if needed
    const disclaimerText = 'This is a computer-generated receipt and does not require a physical signature.';
    const maxWidth = pageWidth - 2 * margin;
    const disclaimerLines = pdf.splitTextToSize(disclaimerText, maxWidth);
    pdf.text(disclaimerLines, pageWidth / 2, yPos, { align: 'center' });

    // Open print dialog instead of saving
    pdf.autoPrint();
    window.open(pdf.output('bloburl'), '_blank');

    return { success: true, receiptNumber };
  } catch (error) {
    console.error('Error printing payment receipt:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generates receipts for all payments in an invoice
 * @param {Object} invoice - The invoice object with payments
 * @param {Object} company - The company details
 */
export const generateAllPaymentReceipts = async (invoice, company) => {
  if (!invoice.payments || invoice.payments.length === 0) {
    return { success: false, error: 'No payments found for this invoice' };
  }

  const results = [];
  for (let i = 0; i < invoice.payments.length; i++) {
    const payment = invoice.payments[i];
    const result = await generatePaymentReceipt(payment, invoice, company, i + 1);
    results.push(result);
  }

  return { success: true, results };
};
