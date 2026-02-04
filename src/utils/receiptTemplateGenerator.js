/**
 * Receipt Template Generator Utility
 * Handles generation of FTA-compliant receipts from template
 *
 * Usage:
 * const html = generateReceiptHTML(payment, invoice, company, customer);
 *
 * Features:
 * - VAT compliance (Article 18 - Time of Supply for advance payments)
 * - Multi-currency support (AED, USD, EUR, GBP, SAR)
 * - Advance payment VAT notation
 * - FTA Form 201 reconciliation fields
 * - Exchange rate tracking for FX payments
 */

import { formatCurrency } from "./invoiceUtils.js";

/**
 * Generate FTA-compliant receipt HTML
 * @param {Object} payment - Payment record with receipt details
 * @param {Object} invoice - Invoice being paid
 * @param {Object} company - Company details (with TRN)
 * @param {Object} customer - Customer details
 * @param {number} paymentIndex - Sequential index of this payment (1-based)
 * @returns {string} HTML content ready for printing/PDF
 */
export const generateReceiptHTML = (payment, invoice, company, customer, paymentIndex = 1) => {
  // Normalize field names (handle both camelCase and snake_case)
  const companyName = company?.legalName || company?.legal_name || "Company Name";
  const companyTRN = company?.trn || company?.TRN || "";
  const companyAddress = company?.address || "";
  const companyPhone = company?.phone || "";
  const companyEmail = company?.email || "";

  const customerName = customer?.name || customer?.customer_name || "Customer";
  const customerTRN = customer?.trn || customer?.TRN || "";
  const customerAddress = customer?.address || "";

  const invoiceNumber = invoice?.invoiceNumber || invoice?.invoice_number || "N/A";
  const invoiceDate = invoice?.invoiceDate || invoice?.invoice_date || "";
  const invoiceTotal = invoice?.total || invoice?.total_amount || 0;
  const invoiceExcludingVAT = invoice?.amountExcludingVat || invoice?.amount_excluding_vat || invoiceTotal / 1.05;
  const invoiceVAT = invoice?.vat || invoice?.vat_amount || invoiceTotal - invoiceExcludingVAT;

  const paymentAmount = payment?.amount || 0;
  const paymentDate = payment?.paymentDate || payment?.payment_date || new Date().toISOString();
  const paymentMethod = payment?.paymentMethod || payment?.payment_method || "N/A";
  const referenceNumber = payment?.referenceNumber || payment?.reference_number || payment?.reference_no || "";
  const receiptNumber = payment?.receiptNumber || payment?.receipt_number || "N/A";
  const compositeReference = payment?.compositeReference || payment?.composite_reference || "";
  const isAdvancePayment = payment?.isAdvancePayment || payment?.is_advance_payment || false;
  const _remarks = payment?.remarks || "";

  const currencyCode = payment?.currencyCode || payment?.currency_code || "AED";
  const exchangeRate = payment?.exchangeRate || payment?.exchange_rate || 1.0;
  const amountInAED = payment?.amountInAed || payment?.amount_in_aed || paymentAmount;

  const outstandingBalance = invoice?.outstandingBalance || invoice?.outstanding || 0;

  // Format dates
  const formattedPaymentDate = new Date(paymentDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const formattedInvoiceDate = invoiceDate
    ? new Date(invoiceDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "N/A";

  // Determine payment method display
  let paymentMethodDisplay = paymentMethod;
  let additionalPaymentDetails = "";

  if (paymentMethod.toLowerCase() === "cheque") {
    paymentMethodDisplay = "☐ Cheque";
    if (referenceNumber) {
      additionalPaymentDetails = `<tr>
        <td><strong>Cheque Number:</strong></td>
        <td>${referenceNumber}</td>
      </tr>`;
    }
  } else if (paymentMethod.toLowerCase() === "bank_transfer" || paymentMethod.toLowerCase() === "bank transfer") {
    paymentMethodDisplay = "🏦 Bank Transfer";
    if (referenceNumber) {
      additionalPaymentDetails = `<tr>
        <td><strong>Bank Reference/Transaction ID:</strong></td>
        <td>${referenceNumber}</td>
      </tr>`;
    }
  } else if (paymentMethod.toLowerCase() === "cash") {
    paymentMethodDisplay = "💵 Cash";
  } else if (paymentMethod.toLowerCase() === "credit_card" || paymentMethod.toLowerCase() === "credit card") {
    paymentMethodDisplay = "💳 Credit Card";
    if (referenceNumber) {
      additionalPaymentDetails = `<tr>
        <td><strong>Authorization Number:</strong></td>
        <td>${referenceNumber}</td>
      </tr>`;
    }
  }

  // Build HTML
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${receiptNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
      padding: 20px;
    }
    
    .receipt-container {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #ddd;
      padding: 30px;
      background: white;
    }
    
    .receipt-header {
      text-align: center;
      border-bottom: 3px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .receipt-header h1 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .company-details {
      margin-top: 15px;
      font-size: 13px;
    }
    
    .company-details p {
      margin: 3px 0;
    }
    
    .company-name {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .trn-label {
      font-weight: 600;
      color: #000;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: bold;
      margin-top: 25px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid #333;
      padding-bottom: 5px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 13px;
    }
    
    table tr {
      border-bottom: 1px solid #eee;
    }
    
    table td {
      padding: 8px;
      text-align: left;
    }
    
    table td:last-child {
      text-align: right;
    }
    
    .amount {
      text-align: right;
      font-weight: 600;
    }
    
    .vat-section {
      border: 2px solid #000;
      padding: 15px;
      margin: 20px 0;
      background-color: #f9f9f9;
    }
    
    .vat-section h3 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    
    .vat-highlight {
      font-weight: 600;
      color: #d32f2f;
    }
    
    .footer {
      margin-top: 30px;
      border-top: 1px solid #ddd;
      padding-top: 15px;
      font-size: 11px;
      text-align: center;
      color: #666;
    }
    
    .compliance-note {
      font-size: 10px;
      font-style: italic;
      margin-top: 10px;
      color: #666;
      line-height: 1.4;
    }
    
    .composite-ref {
      font-size: 12px;
      font-family: 'Courier New', monospace;
      background: #f0f0f0;
      padding: 5px 8px;
      border-radius: 3px;
      word-break: break-all;
    }
    
    .advance-payment-banner {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 10px;
      margin-bottom: 15px;
      font-size: 12px;
    }
    
    .advance-payment-banner strong {
      color: #856404;
    }
    
    .currency-section {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 3px;
      margin: 10px 0;
      font-size: 12px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .receipt-container {
        border: none;
        margin: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- HEADER -->
    <div class="receipt-header">
      <h1>PAYMENT RECEIPT</h1>
      <div class="company-details">
        <p class="company-name">${companyName}</p>
        <p><span class="trn-label">Tax Registration Number (TRN):</span> ${companyTRN}</p>
        <p>${companyAddress}</p>
        ${companyPhone ? `<p>Tel: ${companyPhone}</p>` : ""}
        ${companyEmail ? `<p>Email: ${companyEmail}</p>` : ""}
      </div>
    </div>

    <!-- RECEIPT DETAILS -->
    <div class="section-title">Receipt Information</div>
    <table>
      <tr>
        <td><strong>Receipt Number:</strong></td>
        <td><strong>${receiptNumber}</strong></td>
      </tr>
      <tr>
        <td><strong>Receipt Date:</strong></td>
        <td>${formattedPaymentDate}</td>
      </tr>
      <tr>
        <td><strong>Invoice Number (Paid Against):</strong></td>
        <td><strong>${invoiceNumber}</strong></td>
      </tr>
      <tr>
        <td><strong>Invoice Date:</strong></td>
        <td>${formattedInvoiceDate}</td>
      </tr>
    </table>

    <!-- CUSTOMER DETAILS -->
    <div class="section-title">Received From (Customer)</div>
    <table>
      <tr>
        <td><strong>Customer Name:</strong></td>
        <td>${customerName}</td>
      </tr>
      <tr>
        <td><strong>Address:</strong></td>
        <td>${customerAddress}</td>
      </tr>
      ${
        customerTRN
          ? `<tr>
        <td><strong>Customer TRN:</strong></td>
        <td>${customerTRN}</td>
      </tr>`
          : ""
      }
    </table>

    <!-- PAYMENT DETAILS -->
    <div class="section-title">Payment Details</div>
    <table>
      <tr>
        <td><strong>Payment Method:</strong></td>
        <td>${paymentMethodDisplay}</td>
      </tr>
      ${additionalPaymentDetails}
    </table>

    <!-- ADVANCE PAYMENT BANNER -->
    ${
      isAdvancePayment
        ? `
    <div class="advance-payment-banner">
      <strong>⚠️ ADVANCE PAYMENT RECEIPT</strong>
      <p style="margin-top: 5px;">
        This receipt is for advance payment received on <strong>${invoiceNumber}</strong>. 
        VAT on this advance payment will be accounted for upon issue of final invoice per FTA Article 18.
      </p>
    </div>
    `
        : ""
    }

    <!-- VAT SECTION (CRITICAL FOR FTA) -->
    <div class="vat-section">
      <h3>VALUE ADDED TAX (VAT) INFORMATION</h3>
      
      ${
        isAdvancePayment
          ? `
        <!-- ADVANCE PAYMENT VAT SECTION -->
        <p style="font-weight: 600; margin-bottom: 10px;">Advance Payment Received</p>
        <table>
          <tr>
            <td>Advance Payment (excluding VAT):</td>
            <td class="amount">AED ${formatCurrency(paymentAmount / 1.05)}</td>
          </tr>
          <tr>
            <td>VAT at 5%:</td>
            <td class="amount">AED ${formatCurrency((paymentAmount / 1.05) * 0.05)}</td>
          </tr>
          <tr style="font-weight: 600; border-top: 2px solid #000;">
            <td><strong>Total Amount Received (inc. VAT):</strong></td>
            <td class="amount"><strong>AED ${formatCurrency(paymentAmount)}</strong></td>
          </tr>
        </table>
        <p style="font-size: 11px; margin-top: 10px; font-style: italic; color: #555;">
          <em>VAT on this advance payment will be accounted for upon issue of final invoice per FTA Article 18 (Time of Supply). No additional VAT is charged on this receipt.</em>
        </p>
      `
          : `
        <!-- REGULAR INVOICE PAYMENT VAT SECTION -->
        <p style="font-weight: 600; margin-bottom: 10px;">Payment Against Invoice ${invoiceNumber}</p>
        <table>
          <tr>
            <td>Invoice Amount (exc. VAT):</td>
            <td class="amount">AED ${formatCurrency(invoiceExcludingVAT)}</td>
          </tr>
          <tr>
            <td>VAT on Invoice (5%):</td>
            <td class="amount">AED ${formatCurrency(invoiceVAT)}</td>
          </tr>
          <tr style="font-weight: 600;">
            <td>Invoice Total (inc. VAT):</td>
            <td class="amount">AED ${formatCurrency(invoiceTotal)}</td>
          </tr>
          <tr style="border-top: 2px solid #000; font-weight: 600; background-color: #f0f0f0;">
            <td><strong>Payment Received:</strong></td>
            <td class="amount"><strong>AED ${formatCurrency(paymentAmount)}</strong></td>
          </tr>
          <tr>
            <td>Outstanding Balance:</td>
            <td class="amount">AED ${formatCurrency(outstandingBalance)}</td>
          </tr>
        </table>
        <p style="font-size: 11px; margin-top: 10px; font-style: italic; color: #555;">
          <em>No additional VAT is charged on this payment receipt. VAT was accounted for on the original invoice date.</em>
        </p>
      `
      }
    </div>

    <!-- MULTI-CURRENCY SECTION (if applicable) -->
    ${
      currencyCode !== "AED"
        ? `
    <div class="currency-section">
      <strong>Foreign Currency Payment Details</strong>
      <table style="margin-top: 8px;">
        <tr>
          <td>Payment Currency:</td>
          <td><strong>${currencyCode}</strong></td>
        </tr>
        <tr>
          <td>Amount in ${currencyCode}:</td>
          <td class="amount"><strong>${formatCurrency(paymentAmount)}</strong></td>
        </tr>
        <tr>
          <td>Exchange Rate:</td>
          <td class="amount">1 ${currencyCode} = ${exchangeRate.toFixed(4)} AED</td>
        </tr>
        <tr style="font-weight: 600; border-top: 1px solid #ddd;">
          <td>Amount in AED (for VAT reporting):</td>
          <td class="amount"><strong>AED ${formatCurrency(amountInAED)}</strong></td>
        </tr>
      </table>
    </div>
    `
        : ""
    }

    <!-- AUDIT REFERENCE -->
    <div style="margin-top: 20px; padding: 10px; background: #f9f9f9; border-radius: 3px;">
      <p style="font-size: 12px;"><strong>Composite Receipt Reference (Audit Trail):</strong></p>
      <p class="composite-ref">${compositeReference}</p>
      <p style="font-size: 10px; color: #666; margin-top: 5px;">
        This reference links the payment to the original invoice for FTA Form 201 reconciliation and audit purposes.
      </p>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <p><strong>Payment Receipt #${paymentIndex}</strong> | Issued by Steel ERP System</p>
      <p>Date/Time: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" })}</p>
      <div class="compliance-note">
        <p>
          This receipt is issued in compliance with UAE Federal Law No. 8 of 2017 (VAT Law) and Executive Regulations.
          Retain this receipt for your accounting records. Receipts must be retained for 5 years per FTA requirements.
        </p>
        <p style="margin-top: 8px;">
          For inquiries, contact: ${companyEmail || companyPhone || companyAddress}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  return html;
};

/**
 * Generate receipt with minimal processing
 * Useful for quick preview/display
 */
export const generateReceiptPreview = (payment, invoice, company, customer) => {
  return generateReceiptHTML(payment, invoice, company, customer);
};

export default {
  generateReceiptHTML,
  generateReceiptPreview,
};
