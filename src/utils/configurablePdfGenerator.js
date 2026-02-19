import { mergeTemplateSettings } from "../constants/defaultTemplateSettings.js";
import {
  calculateDiscountedTRN,
  calculateSubtotal,
  calculateTotal,
  calculateTRN,
  formatDateDMY,
  formatNumber,
  getCompanyImages,
  titleCase,
} from "./invoiceUtils.js";

/**
 * Convert hex color to RGB array
 * @param {string} hex - Hex color (e.g., "#5B6DB5")
 * @returns {number[]} RGB array [r, g, b]
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
};

/**
 * Layer 1: Pure data transformation (testable, no DOM/browser dependencies)
 * Extracts and structures all invoice data for configurable PDF rendering
 */
export function buildConfigurableDocumentStructure(invoice, company) {
  const inv = invoice || {};
  const comp = company || {};
  const compAddr = comp.address || {};
  const cust = inv.customer || {};
  const custAddr = cust.address || {};

  // Transform items with calculations
  const items = Array.isArray(inv.items)
    ? inv.items.map((item) => ({
        name: item.name || "",
        quantity: parseFloat(item.quantity) || 0,
        rate: parseFloat(item.rate) || 0,
        amount: parseFloat(item.amount) || 0,
        vatRate: parseFloat(item.vatRate) || 0,
      }))
    : [];

  // Calculate totals
  const subtotal = calculateSubtotal(items);
  const discountPerc = parseFloat(inv.discountPercentage) || 0;
  const discountFlat = parseFloat(inv.discountAmount) || 0;
  const discountValue = inv.discountType === "percentage" ? (subtotal * discountPerc) / 100 : discountFlat;
  const vatAmount = calculateDiscountedTRN(items, inv.discountType, inv.discountPercentage, inv.discountAmount);
  const additionalCharges =
    (parseFloat(inv.packingCharges) || 0) +
    (parseFloat(inv.freightCharges) || 0) +
    (parseFloat(inv.loadingCharges) || 0) +
    (parseFloat(inv.otherCharges) || 0);
  const total = calculateTotal(Math.max(0, subtotal - discountValue) + additionalCharges, vatAmount);

  // Calculate payment totals
  const payments = Array.isArray(inv.payments)
    ? inv.payments.map((p) => ({
        date: p.date || "",
        method: p.method || "",
        reference: p.reference || "",
        amount: parseFloat(p.amount) || 0,
      }))
    : [];
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, total - totalPaid);

  return {
    invoice: {
      number: inv.invoiceNumber || "",
      date: inv.date || "",
      customerPO: inv.customerPurchaseOrderNumber || "",
      customerPODate: inv.customerPurchaseOrderDate || "",
      dueDate: inv.dueDate || "",
      notes: inv.notes || "",
      terms: inv.terms || "",
      warehouseName: inv.warehouseName || "",
      warehouseCode: inv.warehouseCode || "",
    },
    company: {
      name: comp.name || "",
      address: {
        street: compAddr.street || "",
        city: compAddr.city || "",
        country: compAddr.country || "",
      },
      phone: comp.phone || "",
      email: comp.email || "",
      website: comp.website || "",
      trn: comp.vatNumber || "",
    },
    customer: {
      name: cust.name || "",
      address: {
        street: custAddr.street || "",
        city: custAddr.city || "",
        country: custAddr.country || "",
      },
      email: cust.email || "",
      phone: cust.phone || "",
      trn: cust.vatNumber || "",
    },
    items: items,
    payments: payments,
    calculations: {
      subtotal: subtotal,
      discountPercentage: discountPerc,
      discountAmount: discountFlat,
      discountValue: discountValue,
      vatAmount: vatAmount,
      additionalCharges: additionalCharges,
      total: total,
      totalPaid: totalPaid,
      balanceDue: balanceDue,
    },
    metadata: {
      hasNotes: !!inv.notes,
      hasTerms: !!inv.terms,
      hasWarehouse: !!(inv.warehouseName || inv.warehouseCode),
      hasPayments: payments.length > 0,
      hasCustomerPO: !!inv.customerPurchaseOrderNumber,
      hasCustomerPODate: !!inv.customerPurchaseOrderDate,
      isDueToday: !!inv.dueDate,
    },
  };
}

/**
 * Layer 2: Browser-dependent PDF generation
 * Uses pre-built document structure for rendering
 */
export const generateConfigurablePDF = async (invoice, company, options = {}) => {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p", "mm", "a4");
  const { isPreview = false } = options;

  // Extract document structure first (testable logic)
  const docStructure = buildConfigurableDocumentStructure(invoice, company);

  // Get company images from company profile
  const { logoUrl: logoCompany, sealUrl: sealImage } = getCompanyImages(company);

  // Get template settings (merge company settings with defaults)
  const settings = mergeTemplateSettings(company?.settings?.invoiceTemplate || {});
  const { colors, layout, typography, branding, visibility, table, formatting, labels } = settings;

  // Page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Color helpers
  const primaryRgb = hexToRgb(colors.primary);
  const textPrimaryRgb = hexToRgb(colors.textPrimary);
  const textSecondaryRgb = hexToRgb(colors.textSecondary);
  const textLightRgb = hexToRgb(colors.textLight);

  const setTextPrimary = () => pdf.setTextColor(...textPrimaryRgb);
  const setTextSecondary = () => pdf.setTextColor(...textSecondaryRgb);
  const _setTextLight = () => pdf.setTextColor(...textLightRgb);
  const _setPrimaryColor = () => pdf.setTextColor(...primaryRgb);

  let currentY = layout.marginTop;

  // ==================== HEADER SECTION ====================
  if (branding.companyNameInHeader) {
    pdf.setFontSize(typography.fontSize.xlarge);
    pdf.setFont(typography.fontFamily, "bold");
    setTextPrimary();
    const companyName = company?.name || "Ultimate Steels Building Materials Trading";
    pdf.text(companyName, layout.marginLeft, currentY);
    currentY += layout.lineSpacing + 1;
  }

  // Company info
  pdf.setFontSize(typography.fontSize.base);
  pdf.setFont(typography.fontFamily, "normal");
  setTextSecondary();

  const compAddr = company?.address || {};
  if (visibility.showCompanyAddress && compAddr.street) {
    pdf.text(compAddr.street, layout.marginLeft, currentY);
    currentY += layout.lineSpacing;
  }

  if (visibility.showCompanyAddress && (compAddr.city || compAddr.country)) {
    const cityCountry = [compAddr.city, compAddr.country].filter(Boolean).join(", ");
    pdf.text(cityCountry, layout.marginLeft, currentY);
    currentY += layout.lineSpacing;
  }

  if (visibility.showCompanyPhone && company?.phone) {
    pdf.text(`Mobile: ${company.phone}`, layout.marginLeft, currentY);
    currentY += layout.lineSpacing;
  }

  if (visibility.showCompanyEmail && company?.email) {
    pdf.text(`Email: ${company.email}`, layout.marginLeft, currentY);
    currentY += layout.lineSpacing;
  }

  // VAT Number
  if (branding.showVATNumber) {
    pdf.setFont(typography.fontFamily, "bold");
    pdf.text("VAT Reg No: 104858252000003", layout.marginLeft, currentY);
    currentY += 2;
  }

  // Logo
  if (branding.showLogo) {
    try {
      const img = new Image();
      img.src = logoCompany;

      let logoWidth = branding.logoMaxWidth;
      let logoHeight = (img.height / img.width) * logoWidth;

      if (logoHeight > branding.logoMaxHeight) {
        logoHeight = branding.logoMaxHeight;
        logoWidth = (img.width / img.height) * logoHeight;
      }

      const logoX = pageWidth - layout.marginRight - logoWidth;
      pdf.addImage(logoCompany, "PNG", logoX, layout.marginTop, logoWidth, logoHeight);
    } catch (error) {
      console.error("Error adding logo:", error);
    }
  }

  currentY += layout.lineSpacing;

  // Horizontal line separator
  pdf.setDrawColor(...primaryRgb);
  pdf.setLineWidth(0.5);
  pdf.line(layout.marginLeft, currentY, pageWidth - layout.marginRight, currentY);
  currentY += layout.sectionSpacing;

  // ==================== INVOICE TO & INFO SECTION ====================
  const leftColX = layout.marginLeft;
  const rightColX = pageWidth / 2 + 5;
  const invoiceInfoStartY = currentY;

  // LEFT SIDE - Invoice To
  pdf.setFontSize(typography.fontSize.large);
  pdf.setFont(typography.fontFamily, "bold");
  setTextPrimary();
  pdf.text(labels.invoiceTo, leftColX, currentY);
  currentY += 5;

  pdf.setFontSize(typography.fontSize.base);
  pdf.setFont(typography.fontFamily, "normal");
  const cust = docStructure.customer;

  if (cust.name) {
    pdf.text(titleCase(cust.name), leftColX, currentY);
    currentY += layout.lineSpacing;
  }

  if (cust.address.street) {
    pdf.text(cust.address.street, leftColX, currentY);
    currentY += layout.lineSpacing;
  }

  const custCityCountry = [cust.address.city, cust.address.country].filter(Boolean).join(", ");
  if (custCityCountry) {
    pdf.text(custCityCountry, leftColX, currentY);
    currentY += layout.lineSpacing;
  }

  if (cust.email) {
    pdf.setFont(typography.fontFamily, "bold");
    pdf.text(`Email: `, leftColX, currentY);
    pdf.setFont(typography.fontFamily, "normal");
    pdf.text(cust.email, leftColX + 11, currentY);
    currentY += layout.lineSpacing;
  }

  if (cust.phone) {
    pdf.text(`Phone: ${cust.phone}`, leftColX, currentY);
    currentY += layout.lineSpacing;
  }

  if (cust.trn) {
    pdf.text(`TRN: ${cust.trn}`, leftColX, currentY);
  }

  // RIGHT SIDE - Invoice Info Box
  let rightY = invoiceInfoStartY;
  const boxWidth = pageWidth - rightColX - layout.marginRight;
  const boxHeaderHeight = 7;

  // Blue header box
  pdf.setFillColor(...primaryRgb);
  pdf.rect(rightColX, rightY, boxWidth, boxHeaderHeight, "F");

  pdf.setFontSize(typography.fontSize.large);
  pdf.setFont(typography.fontFamily, "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text(labels.invoiceNo, rightColX + 2, rightY + 5);

  const invNum = docStructure.invoice.number;
  const invNumWidth = pdf.getTextWidth(invNum);
  pdf.text(invNum, rightColX + boxWidth - invNumWidth - 2, rightY + 5);

  rightY += boxHeaderHeight + 1;

  // Invoice details
  pdf.setFontSize(typography.fontSize.base);
  setTextPrimary();

  if (visibility.showInvoiceDate) {
    pdf.setFont(typography.fontFamily, "bold");
    pdf.text(labels.invoiceDate, rightColX + 2, rightY + 4);
    pdf.setFont(typography.fontFamily, "normal");
    pdf.text(formatDateDMY(docStructure.invoice.date || new Date()), rightColX + boxWidth - 20, rightY + 4);
    rightY += 6;
  }

  if (visibility.showCustomerPO && docStructure.invoice.customerPO) {
    pdf.setFont(typography.fontFamily, "bold");
    pdf.text(labels.salesOrder, rightColX + 2, rightY + 4);
    pdf.setFont(typography.fontFamily, "normal");
    pdf.text(docStructure.invoice.customerPO, rightColX + boxWidth - 20, rightY + 4);
    rightY += 6;
  }

  if (visibility.showCustomerPODate && docStructure.invoice.customerPODate) {
    pdf.setFont(typography.fontFamily, "bold");
    pdf.text(labels.orderDate, rightColX + 2, rightY + 4);
    pdf.setFont(typography.fontFamily, "normal");
    pdf.text(formatDateDMY(docStructure.invoice.customerPODate), rightColX + boxWidth - 20, rightY + 4);
    rightY += 6;
  }

  if (visibility.showDueDate && docStructure.invoice.dueDate) {
    pdf.setFont(typography.fontFamily, "bold");
    pdf.text(labels.dueDate, rightColX + 2, rightY + 4);
    pdf.setFont(typography.fontFamily, "normal");
    pdf.text(formatDateDMY(docStructure.invoice.dueDate), rightColX + boxWidth - 20, rightY + 4);
    rightY += 6;
  }

  // Border around details box
  const detailsBoxHeight = rightY - invoiceInfoStartY - boxHeaderHeight;
  pdf.setDrawColor(...primaryRgb);
  pdf.setLineWidth(0.3);
  pdf.rect(rightColX, invoiceInfoStartY + boxHeaderHeight, boxWidth, detailsBoxHeight);

  currentY = Math.max(currentY, rightY) + layout.sectionSpacing;

  // ==================== TABLE SECTION ====================
  const _tableStartY = currentY;

  // Calculate column widths from settings (percentage to actual mm)
  const tableWidth = pageWidth - layout.marginLeft - layout.marginRight;
  const colWidths = {
    sno: (tableWidth * table.columnWidths.sno) / 100,
    description: (tableWidth * table.columnWidths.description) / 100,
    quantity: (tableWidth * table.columnWidths.quantity) / 100,
    unitPrice: (tableWidth * table.columnWidths.unitPrice) / 100,
    vat: (tableWidth * table.columnWidths.vat) / 100,
    price: (tableWidth * table.columnWidths.price) / 100,
  };

  // Table header
  const headerBgRgb = hexToRgb(table.headerBgColor);
  const headerTextRgb = hexToRgb(table.headerTextColor);

  pdf.setFillColor(...headerBgRgb);
  pdf.rect(layout.marginLeft, currentY, tableWidth, 8, "F");

  pdf.setFontSize(typography.fontSize.base);
  pdf.setFont(typography.fontFamily, "bold");
  pdf.setTextColor(...headerTextRgb);

  let colX = layout.marginLeft + 2;
  if (visibility.showItemNumber) {
    pdf.text(labels.serialNo, colX, currentY + 5.5);
    colX += colWidths.sno;
  }
  if (visibility.showDescription) {
    pdf.text(labels.description, colX, currentY + 5.5);
    colX += colWidths.description;
  }
  if (visibility.showQuantity) {
    pdf.text(labels.quantity, colX, currentY + 5.5, { align: "center" });
    colX += colWidths.quantity;
  }
  if (visibility.showUnitPrice) {
    pdf.text(labels.unitPrice, colX, currentY + 5.5, { align: "center" });
    colX += colWidths.unitPrice;
  }
  if (visibility.showVAT) {
    pdf.text(labels.vat, colX, currentY + 5.5, { align: "center" });
    colX += colWidths.vat;
  }
  if (visibility.showPrice) {
    pdf.text(labels.price, colX + colWidths.price - 2, currentY + 5.5, {
      align: "right",
    });
  }

  currentY += 8;

  // Table rows
  const items = docStructure.items;
  pdf.setFont(typography.fontFamily, "normal");
  setTextPrimary();

  items.forEach((item, index) => {
    if (currentY > pageHeight - 60) {
      pdf.addPage();
      currentY = layout.marginTop;
    }

    const rowHeight = table.rowHeight;

    // Alternating row colors
    if (table.showAlternatingRows && index % 2 === 0) {
      const evenBgRgb = hexToRgb(colors.tableBgEven);
      pdf.setFillColor(...evenBgRgb);
      pdf.rect(layout.marginLeft, currentY, tableWidth, rowHeight, "F");
    }

    colX = layout.marginLeft + 2;

    if (visibility.showItemNumber) {
      pdf.text(String(index + 1), colX, currentY + 5);
      colX += colWidths.sno;
    }

    if (visibility.showDescription) {
      const desc = item.name || "";
      const descLines = pdf.splitTextToSize(desc, colWidths.description - 4);
      pdf.text(descLines[0] || "", colX, currentY + 5);
      colX += colWidths.description;
    }

    if (visibility.showQuantity) {
      pdf.text(String(item.quantity || 0), colX + colWidths.quantity / 2, currentY + 5, { align: "center" });
      colX += colWidths.quantity;
    }

    if (visibility.showUnitPrice) {
      pdf.text(formatNumber(item.rate || 0), colX + colWidths.unitPrice / 2, currentY + 5, { align: "center" });
      colX += colWidths.unitPrice;
    }

    if (visibility.showVAT) {
      const vatRate = item.vatRate || 0;
      pdf.text(vatRate > 0 ? `${vatRate}%` : "", colX + colWidths.vat / 2, currentY + 5, { align: "center" });
      colX += colWidths.vat;
    }

    if (visibility.showPrice) {
      const amountNum = parseFloat(item.amount) || 0;
      const vatRate = item.vatRate || 0;
      const vatAmount = calculateTRN(amountNum, vatRate);
      const totalWithVAT = amountNum + vatAmount;
      pdf.text(formatNumber(totalWithVAT), layout.marginLeft + tableWidth - 2, currentY + 5, { align: "right" });
    }

    currentY += rowHeight;
  });

  // Bottom border of table
  const borderRgb = hexToRgb(colors.borderColor);
  pdf.setDrawColor(...borderRgb);
  pdf.setLineWidth(0.3);
  pdf.line(layout.marginLeft, currentY, pageWidth - layout.marginRight, currentY);

  currentY += layout.sectionSpacing;

  // ==================== TOTALS SECTION ====================
  const totalsX = pageWidth - layout.marginRight - 60;

  const calc = docStructure.calculations;

  pdf.setFontSize(typography.fontSize.base);
  pdf.setFont(typography.fontFamily, "normal");
  setTextPrimary();

  const currencySymbol = formatting.currencySymbol;

  if (visibility.showSubtotal) {
    pdf.text(labels.subtotal, totalsX, currentY);
    pdf.text(`${currencySymbol} ${formatNumber(calc.subtotal)}`, pageWidth - layout.marginRight, currentY, {
      align: "right",
    });
    currentY += 5;
  }

  if (visibility.showDiscount && calc.discountValue > 0) {
    pdf.text(labels.discount, totalsX, currentY);
    pdf.text(`- ${currencySymbol} ${formatNumber(calc.discountValue)}`, pageWidth - layout.marginRight, currentY, {
      align: "right",
    });
    currentY += 5;
  }

  if (visibility.showVATAmount) {
    pdf.text(labels.vatAmount, totalsX, currentY);
    pdf.text(`${currencySymbol} ${formatNumber(calc.vatAmount)}`, pageWidth - layout.marginRight, currentY, {
      align: "right",
    });
    currentY += 5;
  }

  if (visibility.showTotal) {
    pdf.setFont(typography.fontFamily, "bold");
    pdf.setFontSize(typography.fontSize.large);
    pdf.text(labels.total, totalsX, currentY);
    pdf.text(`${currencySymbol} ${formatNumber(calc.total)}`, pageWidth - layout.marginRight, currentY, {
      align: "right",
    });
    currentY += 8;
  }

  // ==================== BALANCE DUE (from payments array) ====================
  if (calc.totalPaid > 0) {
    // Draw separator line
    pdf.setLineWidth(0.2);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(totalsX, currentY, pageWidth - layout.marginRight, currentY);
    currentY += 4;

    // Show payments received
    pdf.setFont(typography.fontFamily, "normal");
    pdf.setFontSize(typography.fontSize.base);
    pdf.setTextColor(34, 139, 34); // Green color for payments
    pdf.text("Less: Payments Received", totalsX, currentY);
    pdf.text(`- ${currencySymbol} ${formatNumber(calc.totalPaid)}`, pageWidth - layout.marginRight, currentY, {
      align: "right",
    });
    currentY += 6;

    // Show balance due
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(...primaryRgb);
    pdf.line(totalsX, currentY, pageWidth - layout.marginRight, currentY);
    currentY += 5;

    pdf.setFont(typography.fontFamily, "bold");
    pdf.setFontSize(typography.fontSize.xlarge);
    setTextPrimary();
    pdf.text("Balance Due", totalsX, currentY);
    pdf.text(`${currencySymbol} ${formatNumber(calc.balanceDue)}`, pageWidth - layout.marginRight, currentY, {
      align: "right",
    });
    currentY += 10;
  }

  // ==================== PAYMENT HISTORY (Optional) ====================
  if (visibility.showPaymentHistory && docStructure.payments && docStructure.payments.length > 0) {
    pdf.setFontSize(typography.fontSize.large);
    pdf.setFont(typography.fontFamily, "bold");
    setTextPrimary();
    pdf.text("Payment History", layout.marginLeft, currentY);
    currentY += 6;

    // Payment table header
    pdf.setFillColor(...primaryRgb);
    pdf.rect(layout.marginLeft, currentY, tableWidth, 7, "F");

    pdf.setFontSize(typography.fontSize.base);
    pdf.setTextColor(255, 255, 255);

    const payColWidths = {
      sr: 15,
      date: 35,
      method: 40,
      ref: 50,
      amount: 35,
    };

    colX = layout.marginLeft + 2;
    pdf.text("Sr.", colX, currentY + 5);
    colX += payColWidths.sr;
    pdf.text("Date", colX, currentY + 5);
    colX += payColWidths.date;
    pdf.text("Method", colX, currentY + 5);
    colX += payColWidths.method;
    pdf.text("Ref.", colX, currentY + 5);
    colX += payColWidths.ref;
    pdf.text("Amount", colX + payColWidths.amount - 2, currentY + 5, {
      align: "right",
    });

    currentY += 7;

    // Payment rows
    pdf.setFont(typography.fontFamily, "normal");
    setTextPrimary();

    docStructure.payments.forEach((payment, index) => {
      if (index % 2 === 0 && table.showAlternatingRows) {
        const evenBgRgb = hexToRgb(colors.tableBgEven);
        pdf.setFillColor(...evenBgRgb);
        pdf.rect(layout.marginLeft, currentY, tableWidth, 6, "F");
      }

      colX = layout.marginLeft + 2;
      pdf.text(String(index + 1), colX, currentY + 4);
      colX += payColWidths.sr;
      pdf.text(formatDateDMY(payment.date || new Date()), colX, currentY + 4);
      colX += payColWidths.date;
      pdf.text(payment.method || "", colX, currentY + 4);
      colX += payColWidths.method;
      pdf.text(payment.reference || "", colX, currentY + 4);
      colX += payColWidths.ref;
      pdf.text(`${currencySymbol} ${formatNumber(payment.amount || 0)}`, colX + payColWidths.amount - 2, currentY + 4, {
        align: "right",
      });

      currentY += 6;
    });

    currentY += layout.sectionSpacing;
  }

  // ==================== FOOTER SECTION ====================
  pdf.setFontSize(typography.fontSize.base);
  pdf.setFont(typography.fontFamily, "normal");
  setTextSecondary();

  if (visibility.showTerms && docStructure.invoice.terms) {
    pdf.text(`\u2022 ${labels.paymentTerm} `, layout.marginLeft, currentY);
    const termsText = pdf.splitTextToSize(
      docStructure.invoice.terms,
      pageWidth - layout.marginLeft - layout.marginRight - 30
    );
    pdf.text(termsText[0] || "", layout.marginLeft + 26, currentY);
    currentY += 5;
  }

  if (visibility.showNotes && docStructure.invoice.notes) {
    pdf.text(`\u2022 ${labels.comment} `, layout.marginLeft, currentY);
    const notesText = pdf.splitTextToSize(
      docStructure.invoice.notes,
      pageWidth - layout.marginLeft - layout.marginRight - 25
    );
    pdf.text(notesText[0] || "", layout.marginLeft + 20, currentY);
    currentY += 5;
  }

  if (visibility.showWarehouse && (docStructure.invoice.warehouseName || docStructure.invoice.warehouseCode)) {
    const warehouseInfo = [docStructure.invoice.warehouseName, docStructure.invoice.warehouseCode]
      .filter(Boolean)
      .join(" - ");
    pdf.text(`\u2022 ${labels.warehouse} `, layout.marginLeft, currentY);
    pdf.text(warehouseInfo, layout.marginLeft + 22, currentY);
    currentY += 5;
  }

  currentY += layout.sectionSpacing;

  // ==================== SIGNATURE AND SEAL SECTION ====================
  if (visibility.showSignature || visibility.showCompanySeal) {
    const signatureY = currentY;

    // Company Seal - Left Side
    if (visibility.showCompanySeal && branding.showSeal) {
      try {
        const sealSize = branding.sealSize;
        pdf.addImage(sealImage, "PNG", layout.marginLeft, signatureY, sealSize, sealSize);

        // Seal label
        pdf.setFontSize(typography.fontSize.small);
        setTextSecondary();
        pdf.text(labels.companySeal, layout.marginLeft + sealSize + 3, signatureY + 5);
        pdf.setFontSize(typography.fontSize.small - 1);
        pdf.text("Ultimate Steels", layout.marginLeft + sealSize + 3, signatureY + 9);
        pdf.text("Building Materials", layout.marginLeft + sealSize + 3, signatureY + 12);
        pdf.text("Trading LLC", layout.marginLeft + sealSize + 3, signatureY + 15);
      } catch (error) {
        console.error("Error adding seal:", error);
        // Fallback
        pdf.setDrawColor(60);
        pdf.rect(layout.marginLeft, signatureY, 20, 20);
        pdf.setFontSize(typography.fontSize.small);
        setTextSecondary();
        pdf.text(labels.companySeal, layout.marginLeft + 2, signatureY + 5);
      }
    }

    // Authorized Signatory - Right Side
    if (visibility.showSignature) {
      const signatoryX = pageWidth - layout.marginRight - 60;
      pdf.setFontSize(typography.fontSize.base);
      setTextPrimary();
      pdf.setFont(typography.fontFamily, "bold");
      pdf.text(labels.authorizedSignatory, signatoryX, signatureY + 5);

      // Signature line
      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);
      pdf.line(signatoryX, signatureY + 16, signatoryX + 55, signatureY + 16);

      // Company name under signature
      pdf.setFontSize(typography.fontSize.small);
      setTextSecondary();
      pdf.text("ULTIMATE STEELS", signatoryX + 5, signatureY + 19);
      pdf.text("BUILDING MATERIALS TRADING", signatoryX, signatureY + 22);
    }

    currentY = signatureY + 28;
  }

  // Bottom footer line
  const footerY = currentY;
  pdf.setDrawColor(...primaryRgb);
  pdf.setLineWidth(0.5);
  pdf.line(layout.marginLeft, footerY, pageWidth - layout.marginRight, footerY);

  // Contact information
  if (visibility.showContactInfo) {
    pdf.setFontSize(typography.fontSize.small);
    setTextSecondary();
    const phone = visibility.showCompanyPhone ? company?.phone || "+971 XXX XXX" : "";
    const email = visibility.showCompanyEmail ? company?.email || "info@example.com" : "";
    const website = visibility.showCompanyWebsite ? company?.website || "www.ultimatesteels.com" : "";

    const contactParts = [
      phone && `Phone: ${phone}`,
      email && `Email: ${email}`,
      website && `Website: ${website}`,
    ].filter(Boolean);

    const contactInfo = contactParts.join(" | ");
    const contactWidth = pdf.getTextWidth(contactInfo);
    pdf.text(contactInfo, (pageWidth - contactWidth) / 2, footerY + 4);
  }

  // Page number
  if (visibility.showPageNumbers) {
    pdf.text(`${labels.page} 1 / 1`, pageWidth / 2, footerY + 8, {
      align: "center",
    });
  }

  // Add watermark for preview/test invoices
  if (isPreview) {
    // Save current graphics state
    pdf.saveGraphicsState();

    // Set watermark properties
    pdf.setFontSize(70);
    pdf.setFont(typography.fontFamily, "bold");
    pdf.setTextColor(200, 200, 200); // Light gray
    pdf.setGState(new pdf.GState({ opacity: 0.15 })); // 15% opacity

    // Calculate center position and rotate
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    // Rotate 45 degrees and add watermark text
    pdf.text("TEST SAMPLE", centerX, centerY, {
      align: "center",
      angle: 45,
    });

    // Restore graphics state
    pdf.restoreGraphicsState();
  }

  // Save the PDF
  pdf.save(`${docStructure.invoice.number || "invoice"}.pdf`);
  return true;
};

// Export as default generator (will replace old one after testing)
export { generateConfigurablePDF as generateInvoicePDF };
