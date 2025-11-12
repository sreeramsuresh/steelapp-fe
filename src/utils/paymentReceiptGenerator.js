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
 * @param {Object} payment - The payment object
 * @param {Object} invoice - The invoice object
 * @param {Object} company - The company details
 * @param {number} paymentIndex - The index of this payment (for receipt numbering)
 */
export const generatePaymentReceipt = async (payment, invoice, company, paymentIndex = 1) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 20;
    let yPos = margin;

    // Helper function to add text
    const addText = (text, x, y, options = {}) => {
      const {
        fontSize = 10,
        fontStyle = 'normal',
        align = 'left',
        maxWidth = null
      } = options;

      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle);

      if (maxWidth) {
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y, { align });
        return y + (lines.length * fontSize * 0.5);
      } else {
        pdf.text(text, x, y, { align });
        return y + (fontSize * 0.5);
      }
    };

    // Receipt Header
    pdf.setFillColor(20, 184, 166); // Teal color
    pdf.rect(0, 0, pageWidth, 40, 'F');

    // Title
    pdf.setTextColor(255, 255, 255);
    yPos = addText('PAYMENT RECEIPT', pageWidth / 2, 15, { fontSize: 24, fontStyle: 'bold', align: 'center' });

    // Receipt Number
    const receiptNumber = generateReceiptNumber(invoice.invoiceNumber, paymentIndex);
    yPos = addText(`Receipt #: ${receiptNumber}`, pageWidth / 2, 28, { fontSize: 12, align: 'center' });

    // Reset text color
    pdf.setTextColor(0, 0, 0);
    yPos = 50;

    // Company Details (Left)
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(normalizeLLC(company?.name || 'Ultimate Steels Building Materials Trading'), margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
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
      pdf.text(`Ph: ${company.phone}`, margin, yPos);
      yPos += 5;
    }
    if (company.email) {
      pdf.text(`Email: ${company.email}`, margin, yPos);
      yPos += 5;
    }
    if (company.vatNumber) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`VAT Reg No: ${company.vatNumber}`, margin, yPos);
      yPos += 5;
    }

    // Receipt Date (Right)
    const receiptDate = new Date();
    const rightX = pageWidth - margin;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Receipt Date: ${formatDateDMY(receiptDate.toISOString().split('T')[0])}`, rightX, 50, { align: 'right' });

    // Horizontal line
    yPos = Math.max(yPos, 95);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Customer Details Section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Received From:', margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(titleCase(normalizeLLC(invoice.customer.name)), margin + 5, yPos);
    yPos += 5;

    if (invoice.customer.address?.street) {
      pdf.text(invoice.customer.address.street, margin + 5, yPos);
      yPos += 5;
    }
    if (invoice.customer.address?.city && invoice.customer.address?.country) {
      pdf.text(`${invoice.customer.address.city}, ${invoice.customer.address.country}`, margin + 5, yPos);
      yPos += 5;
    }
    if (invoice.customer.phone) {
      pdf.text(`Phone: ${invoice.customer.phone}`, margin + 5, yPos);
      yPos += 5;
    }
    if (invoice.customer.email) {
      pdf.text(`Email: ${invoice.customer.email}`, margin + 5, yPos);
      yPos += 5;
    }
    if (invoice.customer.vatNumber) {
      pdf.text(`TRN: ${invoice.customer.vatNumber}`, margin + 5, yPos);
      yPos += 5;
    }

    yPos += 5;

    // Payment Details Section
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 50, 'F');

    yPos += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Details', margin + 5, yPos);
    yPos += 10;

    // Payment details in two columns
    const colWidth = (pageWidth - 2 * margin - 10) / 2;
    const col1X = margin + 5;
    const col2X = margin + 5 + colWidth + 5;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Left column
    let leftY = yPos;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Reference:', col1X, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.invoiceNumber, col1X + 40, leftY);
    leftY += 6;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Date:', col1X, leftY);
    pdf.setFont('helvetica', 'normal');
    const formatted = formatPaymentDisplay(payment);
    pdf.text(formatted.formattedDate, col1X + 40, leftY);
    leftY += 6;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Mode:', col1X, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatted.modeLabel, col1X + 40, leftY);

    // Right column
    let rightY = yPos;
    if (payment.reference_number) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reference #:', col2X, rightY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(payment.reference_number, col2X + 30, rightY);
      rightY += 6;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.text('Amount Paid:', col2X, rightY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 128, 0); // Green for amount
    pdf.setFontSize(12);
    pdf.text(formatted.formattedAmount, col2X + 30, rightY);
    pdf.setTextColor(0, 0, 0); // Reset color
    pdf.setFontSize(10);

    yPos += 45;

    // Notes section (if any)
    if (payment.notes) {
      yPos += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Notes:', margin, yPos);
      yPos += 6;

      pdf.setFont('helvetica', 'normal');
      const noteLines = pdf.splitTextToSize(payment.notes, pageWidth - 2 * margin - 10);
      pdf.text(noteLines, margin + 5, yPos);
      yPos += noteLines.length * 5;
      yPos += 5;
    }

    // Invoice Summary Box
    yPos += 10;
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(250, 250, 250);
    const boxHeight = 35;
    pdf.rect(margin, yPos, pageWidth - 2 * margin, boxHeight, 'FD');

    yPos += 8;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Summary', margin + 5, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Calculate totals
    const invoiceTotal = invoice.total || 0;
    const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const balanceDue = Math.max(0, invoiceTotal - totalPaid);

    // Three columns for summary
    const summaryCol1 = margin + 5;
    const summaryCol2 = margin + (pageWidth - 2 * margin) / 3;
    const summaryCol3 = margin + 2 * (pageWidth - 2 * margin) / 3;

    pdf.text('Invoice Total:', summaryCol1, yPos);
    pdf.text(formatCurrency(invoiceTotal), summaryCol1, yPos + 5);

    pdf.text('Total Paid:', summaryCol2, yPos);
    pdf.setTextColor(0, 128, 0);
    pdf.text(formatCurrency(totalPaid), summaryCol2, yPos + 5);
    pdf.setTextColor(0, 0, 0);

    pdf.text('Balance Due:', summaryCol3, yPos);
    if (balanceDue > 0) {
      pdf.setTextColor(220, 38, 38); // Red
    } else {
      pdf.setTextColor(0, 128, 0); // Green
    }
    pdf.text(formatCurrency(balanceDue), summaryCol3, yPos + 5);
    pdf.setTextColor(0, 0, 0);

    yPos += boxHeight + 15;

    // Footer section with signature
    const footerY = pageHeight - 60;

    // Thank you message
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Thank you for your payment!', pageWidth / 2, footerY, { align: 'center' });

    // Signature line
    const sigY = footerY + 20;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    // Stamp area (left)
    pdf.rect(margin, sigY - 5, 40, 30);
    pdf.text('Company Seal', margin + 20, sigY + 28, { align: 'center' });

    // Signature line (right)
    const sigX = pageWidth - margin - 60;
    pdf.line(sigX, sigY + 15, sigX + 60, sigY + 15);
    pdf.text('Authorized Signatory', sigX + 30, sigY + 20, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.text(normalizeLLC('ULTIMATE STEELS'), sigX + 30, sigY + 25, { align: 'center' });

    // Bottom note
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('This is a computer-generated receipt and does not require a physical signature.',
      pageWidth / 2, pageHeight - 15, { align: 'center' });

    // Save the PDF
    const fileName = `Payment_Receipt_${receiptNumber}.pdf`;
    pdf.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating payment receipt:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Prints a payment receipt (opens PDF in browser print dialog)
 * @param {Object} payment - The payment object
 * @param {Object} invoice - The invoice object
 * @param {Object} company - The company details
 * @param {number} paymentIndex - The index of this payment (for receipt numbering)
 */
export const printPaymentReceipt = async (payment, invoice, company, paymentIndex = 1) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 20;
    let yPos = margin;

    // Helper function to add text
    const addText = (text, x, y, options = {}) => {
      const {
        fontSize = 10,
        fontStyle = 'normal',
        align = 'left',
        maxWidth = null
      } = options;

      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle);

      if (maxWidth) {
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y, { align });
        return y + (lines.length * fontSize * 0.5);
      } else {
        pdf.text(text, x, y, { align });
        return y + (fontSize * 0.5);
      }
    };

    // Receipt Header
    pdf.setFillColor(20, 184, 166); // Teal color
    pdf.rect(0, 0, pageWidth, 40, 'F');

    // Title
    pdf.setTextColor(255, 255, 255);
    yPos = addText('PAYMENT RECEIPT', pageWidth / 2, 15, { fontSize: 24, fontStyle: 'bold', align: 'center' });

    // Receipt Number
    const receiptNumber = generateReceiptNumber(invoice.invoiceNumber, paymentIndex);
    yPos = addText(`Receipt #: ${receiptNumber}`, pageWidth / 2, 28, { fontSize: 12, align: 'center' });

    // Reset text color
    pdf.setTextColor(0, 0, 0);
    yPos = 50;

    // Company Details (Left)
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(normalizeLLC(company?.name || 'Ultimate Steels Building Materials Trading'), margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
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
      pdf.text(`Ph: ${company.phone}`, margin, yPos);
      yPos += 5;
    }
    if (company.email) {
      pdf.text(`Email: ${company.email}`, margin, yPos);
      yPos += 5;
    }
    if (company.vatNumber) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`VAT Reg No: ${company.vatNumber}`, margin, yPos);
      yPos += 5;
    }

    // Receipt Date (Right)
    const receiptDate = new Date();
    const rightX = pageWidth - margin;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Receipt Date: ${formatDateDMY(receiptDate.toISOString().split('T')[0])}`, rightX, 50, { align: 'right' });

    // Horizontal line
    yPos = Math.max(yPos, 95);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Customer Details Section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Received From:', margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(titleCase(normalizeLLC(invoice.customer.name)), margin + 5, yPos);
    yPos += 5;

    if (invoice.customer.address?.street) {
      pdf.text(invoice.customer.address.street, margin + 5, yPos);
      yPos += 5;
    }
    if (invoice.customer.address?.city && invoice.customer.address?.country) {
      pdf.text(`${invoice.customer.address.city}, ${invoice.customer.address.country}`, margin + 5, yPos);
      yPos += 5;
    }
    if (invoice.customer.phone) {
      pdf.text(`Phone: ${invoice.customer.phone}`, margin + 5, yPos);
      yPos += 5;
    }
    if (invoice.customer.email) {
      pdf.text(`Email: ${invoice.customer.email}`, margin + 5, yPos);
      yPos += 5;
    }
    if (invoice.customer.vatNumber) {
      pdf.text(`TRN: ${invoice.customer.vatNumber}`, margin + 5, yPos);
      yPos += 5;
    }

    yPos += 5;

    // Payment Details Section
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 50, 'F');

    yPos += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Details', margin + 5, yPos);
    yPos += 10;

    // Payment details in two columns
    const colWidth = (pageWidth - 2 * margin - 10) / 2;
    const col1X = margin + 5;
    const col2X = margin + 5 + colWidth + 5;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Left column
    let leftY = yPos;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Reference:', col1X, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.invoiceNumber, col1X + 40, leftY);
    leftY += 6;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Date:', col1X, leftY);
    pdf.setFont('helvetica', 'normal');
    const formatted = formatPaymentDisplay(payment);
    pdf.text(formatted.formattedDate, col1X + 40, leftY);
    leftY += 6;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Mode:', col1X, leftY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatted.modeLabel, col1X + 40, leftY);

    // Right column
    let rightY = yPos;
    if (payment.reference_number) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reference #:', col2X, rightY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(payment.reference_number, col2X + 30, rightY);
      rightY += 6;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.text('Amount Paid:', col2X, rightY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 128, 0); // Green for amount
    pdf.setFontSize(12);
    pdf.text(formatted.formattedAmount, col2X + 30, rightY);
    pdf.setTextColor(0, 0, 0); // Reset color
    pdf.setFontSize(10);

    yPos += 45;

    // Notes section (if any)
    if (payment.notes) {
      yPos += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Notes:', margin, yPos);
      yPos += 6;

      pdf.setFont('helvetica', 'normal');
      const noteLines = pdf.splitTextToSize(payment.notes, pageWidth - 2 * margin - 10);
      pdf.text(noteLines, margin + 5, yPos);
      yPos += noteLines.length * 5;
      yPos += 5;
    }

    // Invoice Summary Box
    yPos += 10;
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(250, 250, 250);
    const boxHeight = 35;
    pdf.rect(margin, yPos, pageWidth - 2 * margin, boxHeight, 'FD');

    yPos += 8;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Summary', margin + 5, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Calculate totals
    const invoiceTotal = invoice.total || 0;
    const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const balanceDue = Math.max(0, invoiceTotal - totalPaid);

    // Three columns for summary
    const summaryCol1 = margin + 5;
    const summaryCol2 = margin + (pageWidth - 2 * margin) / 3;
    const summaryCol3 = margin + 2 * (pageWidth - 2 * margin) / 3;

    pdf.text('Invoice Total:', summaryCol1, yPos);
    pdf.text(formatCurrency(invoiceTotal), summaryCol1, yPos + 5);

    pdf.text('Total Paid:', summaryCol2, yPos);
    pdf.setTextColor(0, 128, 0);
    pdf.text(formatCurrency(totalPaid), summaryCol2, yPos + 5);
    pdf.setTextColor(0, 0, 0);

    pdf.text('Balance Due:', summaryCol3, yPos);
    if (balanceDue > 0) {
      pdf.setTextColor(220, 38, 38); // Red
    } else {
      pdf.setTextColor(0, 128, 0); // Green
    }
    pdf.text(formatCurrency(balanceDue), summaryCol3, yPos + 5);
    pdf.setTextColor(0, 0, 0);

    yPos += boxHeight + 15;

    // Footer section with signature
    const footerY = pageHeight - 60;

    // Thank you message
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Thank you for your payment!', pageWidth / 2, footerY, { align: 'center' });

    // Signature line
    const sigY = footerY + 20;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    // Stamp area (left)
    pdf.rect(margin, sigY - 5, 40, 30);
    pdf.text('Company Seal', margin + 20, sigY + 28, { align: 'center' });

    // Signature line (right)
    const sigX = pageWidth - margin - 60;
    pdf.line(sigX, sigY + 15, sigX + 60, sigY + 15);
    pdf.text('Authorized Signatory', sigX + 30, sigY + 20, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.text(normalizeLLC('ULTIMATE STEELS'), sigX + 30, sigY + 25, { align: 'center' });

    // Bottom note
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
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
