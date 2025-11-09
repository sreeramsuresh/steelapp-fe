import {
  formatCurrency,
  formatDate,
  calculateTRN,
  calculateSubtotal,
  calculateTotalTRN,
  calculateTotal,
  titleCase,
  formatNumber,
  formatDateDMY,
  calculateDiscountedTRN,
} from "./invoiceUtils";
import { mergeTemplateSettings } from "../constants/defaultTemplateSettings";
import logoCompany from "../assets/logocompany.png";
import sealImage from "../assets/Seal.png";

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

// New modern PDF generator based on customizable template settings
export const generateInvoicePDF = async (invoice, company) => {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p", "mm", "a4");

  // Get template settings (merge company settings with defaults)
  const templateSettings = mergeTemplateSettings(company?.settings?.invoice_template || {});
  const { colors, layout, typography, branding, visibility, table, formatting, labels } = templateSettings;

  // Page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = layout.marginLeft;

  // Color scheme from settings
  const primaryColor = hexToRgb(colors.primary);
  const textPrimaryColor = hexToRgb(colors.textPrimary);
  const textSecondaryColor = hexToRgb(colors.textSecondary);
  const textLightColor = hexToRgb(colors.textLight);

  // Helper functions for colors
  const setTextPrimary = () => pdf.setTextColor(...textPrimaryColor);
  const setTextSecondary = () => pdf.setTextColor(...textSecondaryColor);
  const setTextLight = () => pdf.setTextColor(...textLightColor);
  const setPrimaryColor = () => pdf.setTextColor(...primaryColor);

  let currentY = layout.marginTop;

  // ==================== HEADER SECTION ====================
  // Company name and info (left side)
  if (branding.companyNameInHeader) {
    pdf.setFontSize(typography.fontSize.xlarge);
    pdf.setFont(typography.fontFamily, "bold");
    setTextPrimary();
    const companyName = company?.name || "Ultimate Steels Building Materials Trading";
    pdf.text(companyName, margin, currentY);
    currentY += layout.lineSpacing + 1;
  }

  // Company address and contact
  pdf.setFontSize(typography.fontSize.base);
  pdf.setFont(typography.fontFamily, "normal");
  setTextSecondary();

  const compAddr = company?.address || {};
  if (compAddr.street) {
    pdf.text(compAddr.street, margin, currentY);
    currentY += 4;
  }

  const cityCountry = [compAddr.city, compAddr.country].filter(Boolean).join(", ");
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
  pdf.setFont("helvetica", "bold");
  pdf.text("VAT Reg No: 104858252000003", margin, currentY);
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
    pdf.addImage(logoCompany, "PNG", logoX, margin, logoWidth, logoHeight);
  } catch (error) {
    console.error("Error adding logo:", error);
  }

  currentY += 3;

  // Horizontal line separator
  pdf.setDrawColor(91, 109, 181);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // ==================== INVOICE TITLE BANNER ====================
  // Determine invoice title based on status
  const invoiceTitle = invoice.status === 'draft' ? 'DRAFT INVOICE' :
                       invoice.status === 'proforma' ? 'PROFORMA INVOICE' :
                       'TAX INVOICE';

  // Draw title banner with same height and style as Invoice No box (7mm height)
  const titleBannerHeight = 7;
  pdf.setFillColor(...primaryColor);
  pdf.rect(margin, currentY, pageWidth - 2 * margin, titleBannerHeight, "F");

  // Add centered title text
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  const titleWidth = pdf.getTextWidth(invoiceTitle);
  const titleX = (pageWidth - titleWidth) / 2;
  pdf.text(invoiceTitle, titleX, currentY + 5);

  currentY += titleBannerHeight + 6;

  // ==================== INVOICE TO & INVOICE INFO SECTION ====================
  const leftColX = margin;
  const rightColX = pageWidth / 2 + 5;
  const invoiceInfoStartY = currentY;

  // LEFT SIDE - Invoice To
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  setBlack();
  pdf.text("Invoice To:", leftColX, currentY);
  currentY += 5;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
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

  const custCityCountry = [custAddr.city, custAddr.country].filter(Boolean).join(", ");
  if (custCityCountry) {
    pdf.text(custCityCountry, leftColX, currentY);
    currentY += 4;
  }

  if (cust.email) {
    pdf.setFont("helvetica", "bold");
    pdf.text(`Email: `, leftColX, currentY);
    pdf.setFont("helvetica", "normal");
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
  pdf.rect(rightColX, rightY, boxWidth, boxHeaderHeight, "F");

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text("Invoice No:", rightColX + 2, rightY + 5);

  // Invoice number (right aligned in blue box)
  const invNum = invoice.invoiceNumber || "";
  const invNumWidth = pdf.getTextWidth(invNum);
  pdf.text(invNum, rightColX + boxWidth - invNumWidth - 2, rightY + 5);

  rightY += boxHeaderHeight + 1;

  // Invoice details in white box with border
  const detailsStartY = rightY;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...primaryBlue);

  // Invoice Date
  pdf.setFontSize(9);
  setBlack();
  pdf.setFont("helvetica", "bold");
  pdf.text("Invoice Date:", rightColX + 2, rightY + 4);
  pdf.setFont("helvetica", "normal");
  pdf.text(formatDateDMY(invoice.date || new Date()), rightColX + boxWidth - 20, rightY + 4);
  rightY += 6;

  // SO (Sales Order)
  if (invoice.customerPurchaseOrderNumber) {
    pdf.setFont("helvetica", "bold");
    pdf.text("SO:", rightColX + 2, rightY + 4);
    pdf.setFont("helvetica", "normal");
    pdf.text(invoice.customerPurchaseOrderNumber, rightColX + boxWidth - 20, rightY + 4);
    rightY += 6;
  }

  // Order Date
  if (invoice.customerPurchaseOrderDate) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Order Date:", rightColX + 2, rightY + 4);
    pdf.setFont("helvetica", "normal");
    pdf.text(formatDateDMY(invoice.customerPurchaseOrderDate), rightColX + boxWidth - 20, rightY + 4);
    rightY += 6;
  }

  // Due Date (if available)
  if (invoice.dueDate) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Due Date:", rightColX + 2, rightY + 4);
    pdf.setFont("helvetica", "normal");
    pdf.text(formatDateDMY(invoice.dueDate), rightColX + boxWidth - 20, rightY + 4);
    rightY += 6;
  }

  // Draw border around the details box
  const detailsBoxHeight = rightY - detailsStartY;
  pdf.setDrawColor(...primaryBlue);
  pdf.setLineWidth(0.3);
  pdf.rect(rightColX, invoiceInfoStartY + boxHeaderHeight, boxWidth, detailsBoxHeight);

  currentY = Math.max(currentY, rightY) + 8;

  // ==================== TABLE SECTION ====================
  const tableStartY = currentY;

  // Table column configuration
  const colWidths = {
    sr: 12,
    description: 70,
    quantity: 20,
    unitPrice: 25,
    taxes: 20,
    price: 28
  };

  // Table header with blue background
  pdf.setFillColor(...primaryBlue);
  pdf.rect(margin, currentY, pageWidth - 2 * margin, 8, "F");

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);

  let colX = margin + 2;
  pdf.text("Sr.", colX, currentY + 5.5);
  colX += colWidths.sr;
  pdf.text("Description", colX, currentY + 5.5);
  colX += colWidths.description;
  pdf.text("Quantity", colX, currentY + 5.5, { align: "center" });
  colX += colWidths.quantity;
  pdf.text("Unit Price", colX, currentY + 5.5, { align: "center" });
  colX += colWidths.unitPrice;
  pdf.text("VAT", colX, currentY + 5.5, { align: "center" });
  colX += colWidths.taxes;
  pdf.text("Price", colX + colWidths.price - 2, currentY + 5.5, { align: "right" });

  currentY += 8;

  // Table rows
  const items = invoice.items || [];
  pdf.setFont("helvetica", "normal");
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
      pdf.rect(margin, currentY, pageWidth - 2 * margin, rowHeight, "F");
    }

    colX = margin + 2;

    // Sr. number
    pdf.text(String(index + 1), colX, currentY + 5);
    colX += colWidths.sr;

    // Description
    const desc = item.name || "";
    const descLines = pdf.splitTextToSize(desc, colWidths.description - 4);
    pdf.text(descLines[0] || "", colX, currentY + 5);
    colX += colWidths.description;

    // Quantity
    pdf.text(String(item.quantity || 0), colX + colWidths.quantity / 2, currentY + 5, { align: "center" });
    colX += colWidths.quantity;

    // Unit Price
    pdf.text(formatNumber(item.rate || 0), colX + colWidths.unitPrice / 2, currentY + 5, { align: "center" });
    colX += colWidths.unitPrice;

    // Taxes (VAT Rate %)
    const vatRate = item.vatRate || 0;
    pdf.text(vatRate > 0 ? `${vatRate}%` : "", colX + colWidths.taxes / 2, currentY + 5, { align: "center" });
    colX += colWidths.taxes;

    // Price (amount including VAT)
    const amountNum = parseFloat(item.amount) || 0;
    const vatAmount = calculateTRN(amountNum, vatRate);
    const totalWithVAT = amountNum + vatAmount;
    pdf.text(formatNumber(totalWithVAT), colX + colWidths.price - 2, currentY + 5, { align: "right" });

    currentY += rowHeight;
  });

  // Bottom border of table
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 8;

  // ==================== TOTALS SECTION ====================
  const totalsX = pageWidth - margin - 60;

  const subtotalVal = calculateSubtotal(items);
  const discountPerc = parseFloat(invoice.discountPercentage) || 0;
  const discountFlat = parseFloat(invoice.discountAmount) || 0;
  const discountVal = invoice.discountType === "percentage"
    ? (subtotalVal * discountPerc) / 100
    : discountFlat;
  const vatVal = calculateDiscountedTRN(
    items,
    invoice.discountType,
    invoice.discountPercentage,
    invoice.discountAmount
  );
  const additionalCharges =
    (parseFloat(invoice.packingCharges) || 0) +
    (parseFloat(invoice.freightCharges) || 0) +
    (parseFloat(invoice.loadingCharges) || 0) +
    (parseFloat(invoice.otherCharges) || 0);
  const totalVal = calculateTotal(
    Math.max(0, subtotalVal - discountVal) + additionalCharges,
    vatVal
  );

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  setBlack();

  // SubTotal
  pdf.text("SubTotal", totalsX, currentY);
  pdf.text(`AED ${formatNumber(subtotalVal)}`, pageWidth - margin, currentY, { align: "right" });
  currentY += 5;

  // Discount (if applicable)
  if (discountVal > 0) {
    pdf.text("Discount", totalsX, currentY);
    pdf.text(`- AED ${formatNumber(discountVal)}`, pageWidth - margin, currentY, { align: "right" });
    currentY += 5;
  }

  // VAT
  pdf.text("VAT", totalsX, currentY);
  pdf.text(`AED ${formatNumber(vatVal)}`, pageWidth - margin, currentY, { align: "right" });
  currentY += 5;

  // TOTAL (bold)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("TOTAL", totalsX, currentY);
  pdf.text(`AED ${formatNumber(totalVal)}`, pageWidth - margin, currentY, { align: "right" });
  currentY += 10;

  // ==================== PAYMENT HISTORY SECTION (Optional) ====================
  // Only show if there are payments
  if (invoice.payments && invoice.payments.length > 0) {
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    setBlack();
    pdf.text("Payment History", margin, currentY);
    currentY += 6;

    // Payment table header
    pdf.setFillColor(...primaryBlue);
    pdf.rect(margin, currentY, pageWidth - 2 * margin, 7, "F");

    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);

    const payColWidths = {
      sr: 15,
      date: 35,
      method: 40,
      ref: 50,
      amount: 35
    };

    colX = margin + 2;
    pdf.text("Sr.", colX, currentY + 5);
    colX += payColWidths.sr;
    pdf.text("Date", colX, currentY + 5);
    colX += payColWidths.date;
    pdf.text("Method", colX, currentY + 5);
    colX += payColWidths.method;
    pdf.text("Ref.", colX, currentY + 5);
    colX += payColWidths.ref;
    pdf.text("Amount", colX + payColWidths.amount - 2, currentY + 5, { align: "right" });

    currentY += 7;

    // Payment rows
    pdf.setFont("helvetica", "normal");
    setBlack();

    invoice.payments.forEach((payment, index) => {
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, currentY, pageWidth - 2 * margin, 6, "F");
      }

      colX = margin + 2;
      pdf.text(String(index + 1), colX, currentY + 4);
      colX += payColWidths.sr;
      pdf.text(formatDateDMY(payment.date || new Date()), colX, currentY + 4);
      colX += payColWidths.date;
      pdf.text(payment.method || "", colX, currentY + 4);
      colX += payColWidths.method;
      pdf.text(payment.reference || "", colX, currentY + 4);
      colX += payColWidths.ref;
      pdf.text(`AED ${formatNumber(payment.amount || 0)}`, colX + payColWidths.amount - 2, currentY + 4, { align: "right" });

      currentY += 6;
    });

    currentY += 8;
  }

  // ==================== FOOTER SECTION ====================
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  setDarkGray();

  // Payment Terms
  if (invoice.terms) {
    pdf.text("\u2022 Payment Term: ", margin, currentY);
    const termsText = pdf.splitTextToSize(invoice.terms, pageWidth - margin - 40);
    pdf.text(termsText[0] || "", margin + 26, currentY);
    currentY += 5;
  }

  // Notes/Comments
  if (invoice.notes) {
    pdf.text("\u2022 Comment: ", margin, currentY);
    const notesText = pdf.splitTextToSize(invoice.notes, pageWidth - margin - 40);
    pdf.text(notesText[0] || "", margin + 20, currentY);
    currentY += 5;
  }

  // Additional remarks
  if (invoice.warehouseName || invoice.warehouseCode) {
    const warehouseInfo = [invoice.warehouseName, invoice.warehouseCode].filter(Boolean).join(" - ");
    pdf.text("\u2022 Warehouse: ", margin, currentY);
    pdf.text(warehouseInfo, margin + 22, currentY);
    currentY += 5;
  }

  currentY += 8;

  // ==================== SIGNATURE AND SEAL SECTION ====================
  const signatureY = currentY;

  // Company Seal/Stamp - Left Side
  try {
    const sealSize = 20; // 20mm x 20mm seal
    pdf.addImage(sealImage, "PNG", margin, signatureY, sealSize, sealSize);

    // Seal label
    pdf.setFontSize(8);
    setDarkGray();
    pdf.text("Company Seal", margin + sealSize + 3, signatureY + 5);
    pdf.setFontSize(7);
    pdf.text("Ultimate Steels", margin + sealSize + 3, signatureY + 9);
    pdf.text("Building Materials", margin + sealSize + 3, signatureY + 12);
    pdf.text("Trading LLC", margin + sealSize + 3, signatureY + 15);
  } catch (error) {
    console.error("Error adding seal:", error);
    // Fallback: just show text if seal image fails
    pdf.setDrawColor(60);
    pdf.rect(margin, signatureY, 20, 20);
    pdf.setFontSize(8);
    setDarkGray();
    pdf.text("Company Seal", margin + 2, signatureY + 5);
  }

  // Authorized Signatory - Right Side
  const signatoryX = pageWidth - margin - 60;
  pdf.setFontSize(9);
  setBlack();
  pdf.setFont("helvetica", "bold");
  pdf.text("Authorized Signatory", signatoryX, signatureY + 5);

  // Signature line
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.3);
  pdf.line(signatoryX, signatureY + 16, signatoryX + 55, signatureY + 16);

  // Company name under signature
  pdf.setFontSize(8);
  setDarkGray();
  pdf.text("ULTIMATE STEELS", signatoryX + 5, signatureY + 19);
  pdf.text("BUILDING MATERIALS TRADING", signatoryX, signatureY + 22);

  currentY = signatureY + 28;

  // Bottom footer line
  const footerY = currentY;
  pdf.setDrawColor(91, 109, 181);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY, pageWidth - margin, footerY);

  // Contact information
  pdf.setFontSize(8);
  setDarkGray();
  const contactInfo = `Phone: ${company?.phone || "+971 XXX XXX"} | Email: ${company?.email || "info@example.com"} | Website: www.ultimatesteels.com`;
  const contactWidth = pdf.getTextWidth(contactInfo);
  pdf.text(contactInfo, (pageWidth - contactWidth) / 2, footerY + 4);

  // Page number
  pdf.text(`Page: 1 / 1`, pageWidth / 2, footerY + 8, { align: "center" });

  // Save the PDF
  pdf.save(`${invoice.invoiceNumber || "invoice"}.pdf`);
  return true;
};

// Export placeholder functions for compatibility
const createInvoiceElement = (invoice, company) => {
  console.log("createInvoiceElement is deprecated - using new PDF generator");
  return null;
};

const waitForImages = (container) => {
  console.log("waitForImages is deprecated - using new PDF generator");
  return Promise.resolve();
};

export { createInvoiceElement, waitForImages };
