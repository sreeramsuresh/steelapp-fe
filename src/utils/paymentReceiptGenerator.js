import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate, normalizeLLC, titleCase, formatDateDMY } from './invoiceUtils';
import { formatPaymentDisplay, getPaymentModeConfig } from './paymentUtils';

/**
 * Generates a unique receipt number for a payment
 * Format: RCP-[InvoiceNumber]-[PaymentNumber]
 */
export const generateReceiptNumber = (invoiceNumber, paymentIndex) => {
  const paddedIndex = String(paymentIndex).padStart(3, '0');
  return `RCP-${invoiceNumber}-${paddedIndex}`;
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

    // Receipt Number and Date
    const receiptNumber = generateReceiptNumber(invoice.invoiceNumber, paymentIndex);
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

    // ========== PAYMENT DETAILS SECTION ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Details', margin, yPos);
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
    if (payment.reference_number) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reference No:', col1X, leftY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(payment.reference_number, col1X + labelWidth, leftY);
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

    // ========== INVOICE SUMMARY ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Summary', margin, yPos);
    yPos += 8;

    // Calculate totals
    const invoiceTotal = invoice.total || 0;
    const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
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
    yPos += 15;

    // ========== FOOTER SECTION ==========
    // Thank you message
    const footerStartY = pageHeight - 60;
    yPos = Math.max(yPos, footerStartY);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Thank you for your payment!', pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

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

    // Bottom disclaimer
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('This is a computer-generated receipt and does not require a physical signature.',
      pageWidth / 2, pageHeight - 15, { align: 'center' });

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

    // Receipt Number and Date
    const receiptNumber = generateReceiptNumber(invoice.invoiceNumber, paymentIndex);
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

    // ========== PAYMENT DETAILS SECTION ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Details', margin, yPos);
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
    if (payment.reference_number) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reference No:', col1X, leftY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(payment.reference_number, col1X + labelWidth, leftY);
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

    // ========== INVOICE SUMMARY ==========
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Summary', margin, yPos);
    yPos += 8;

    // Calculate totals
    const invoiceTotal = invoice.total || 0;
    const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
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
    yPos += 15;

    // ========== FOOTER SECTION ==========
    // Thank you message
    const footerStartY = pageHeight - 60;
    yPos = Math.max(yPos, footerStartY);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Thank you for your payment!', pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

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

    // Bottom disclaimer
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('This is a computer-generated receipt and does not require a physical signature.',
      pageWidth / 2, pageHeight - 15, { align: 'center' });

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
