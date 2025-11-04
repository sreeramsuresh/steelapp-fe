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
import logoCompany from "../assets/logocompany.png";
import sealImage from "../assets/Seal.png";

// Measurement‑based pagination generator
export const generateInvoicePDF = async (invoice, company) => {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p", "mm", "a4");

  // Base margins (mm) — ultra minimal for maximum content space
  const M = { top: 8, bottom: 5, left: 10, right: 10 };
  const page = {
    w: pdf.internal.pageSize.getWidth(),
    h: pdf.internal.pageSize.getHeight(),
  };

  // Fonts
  const setBody = () => {
    pdf.setFont("helvetica", "");
    pdf.setFontSize(11);
  };
  const setBold = () => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
  };
  const gray = (v = 140) => pdf.setTextColor(v);
  const black = () => pdf.setTextColor(0);

  const textWidth = (txt, fontSize = 11, fontStyle = "") => {
    const prevSize = pdf.getFontSize();
    const prev = pdf.getFont();
    pdf.setFont("helvetica", fontStyle || "");
    pdf.setFontSize(fontSize);
    const w = pdf.getTextDimensions(txt).w;
    pdf.setFont(prev.fontName, prev.fontStyle);
    pdf.setFontSize(prevSize);
    return w;
  };
  const split = (txt, maxW) => pdf.splitTextToSize(txt || "", maxW);

  const measureHeader = (isFirstPage = true) => {
    if (isFirstPage) {
      const companyNameH = 4;
      const taxInvoiceH = 5;
      const customerInfoH = 8;
      const invoiceInfoH = 6;
      const spacing = 2;
      return (
        companyNameH +
        taxInvoiceH +
        Math.max(customerInfoH, invoiceInfoH) +
        spacing
      );
    } else {
      return 8;
    }
  };

  const drawHeader = (pageIdx, pageCount, isFirstPage = true) => {
    let y = M.top;

    if (isFirstPage) {
      setBody();
      black();

      const compName =
        company?.name || "Ultimate Steels Building Materials Trading";
      pdf.text(compName, M.left, y);
      y += 4;

      pdf.setFillColor(0, 128, 128);
      pdf.rect(M.left, y, page.w - M.left - M.right, 5, "F");
      setBold();
      pdf.setTextColor(255);
      const titleWidth = textWidth("TAX INVOICE", 10, "bold");
      const centerX = M.left + (page.w - M.left - M.right) / 2 - titleWidth / 2;
      pdf.setFontSize(10);
      pdf.text("TAX INVOICE", centerX, y + 3.5);
      pdf.setFontSize(11);
      y += 6;

      setBody();
      black();
      const leftColX = M.left;
      const rightColX = page.w - M.right - 70;

      const cust = invoice.customer || {};
      // Show invoice date above Bill To in DMY format
      pdf.text(`INVOICE Date : ${formatDateDMY(invoice.date || new Date())}`, leftColX, y);
      y += 4;
      pdf.text(`Bill To: ${titleCase(cust.name || "")}`, leftColX, y);

      const invNo = `Invoice #: ${invoice.invoiceNumber || ""}`;
      pdf.text(invNo, rightColX, y);
      y += 4;
      if (invoice.modeOfPayment) {
        pdf.text(`Payment Mode: ${invoice.modeOfPayment}`, rightColX, y);
        y += 4;
      }
      if (invoice.chequeNumber) {
        pdf.text(`Cheque No: ${invoice.chequeNumber}`, rightColX, y);
        y += 4;
      }
    } else {
      setBody();
      black();
      const compName =
        company?.name || "Ultimate Steels Building Materials Trading";
      pdf.text(compName, M.left, y);

      const invInfo = `Invoice #: ${invoice.invoiceNumber || ""} (Continued)`;
      pdf.text(invInfo, page.w - M.right, y, { align: "right" });
      y += 4;
    }
  };

  const tableHeaderHeight = 0;
  const getColumnLayout = () => {
    const W = page.w - M.left - M.right;
    return {
      sno: W * 0.07,
      desc: W * 0.51,
      qty: W * 0.1,
      rate: W * 0.15,
      amt: W * 0.17,
    };
  };

  const measureFooter = (isLastPage = false) => {
    return isLastPage ? 25 : 20;
  };

  const drawFooter = (pageIdx, pageCount, customFooterY = null) => {
    const isLastPage = pageIdx === pageCount;
    const footerH = measureFooter(isLastPage);
    const yTop = customFooterY || page.h - M.bottom - footerH;

    pdf.setDrawColor(60);
    pdf.rect(M.left, yTop + 2, 35, 22);
    setBody();
    gray(100);
    pdf.text("Company Seal", M.left + 2, yTop + 6);

    setBody();
    gray(80);
    pdf.setFontSize(9);
    pdf.text("Ultimate Steels", M.left + 2, yTop + 11);
    pdf.text("Building Materials", M.left + 2, yTop + 15);
    pdf.text("Trading LLC", M.left + 2, yTop + 19);
    pdf.setFontSize(11);

    black();
    setBold();
    pdf.text("Authorized Signatory", page.w - M.right - 70, yTop + 5);

    pdf.setDrawColor(0);
    pdf.line(
      page.w - M.right - 70,
      yTop + 16,
      page.w - M.right - 15,
      yTop + 16
    );

    setBody();
    gray(80);
    pdf.setFontSize(9);
    pdf.text("ULTIMATE STEELS", page.w - M.right - 60, yTop + 20);
    pdf.text("BUILDING MATERIALS TRADING", page.w - M.right - 75, yTop + 23);
    pdf.setFontSize(11);

    setBody();
    gray(120);
    pdf.text(`Page ${pageIdx} of ${pageCount}`, page.w - M.right, page.h - 4, {
      align: "right",
    });

    pdf.setDrawColor(200);
    pdf.line(M.left, yTop, page.w - M.right, yTop);
  };

  const renderRows = (startIndex, isFirstPage = true, isLastPage = false) => {
    const headerH = measureHeader(isFirstPage);
    const topBoundaryY = M.top + headerH + tableHeaderHeight;
    const frame = {
      x: M.left,
      y: topBoundaryY,
      w: page.w - M.left - M.right,
      h: page.h - topBoundaryY - M.bottom - 5,
    };

    const currentPage = pdf.getCurrentPageInfo().pageNumber;
    drawHeader(currentPage, 1, isFirstPage);
    const col = getColumnLayout();

    let y = frame.y;
    let idx = startIndex;
    const items = invoice.items || [];
    let itemsOnThisPage = 0;

    const remainingItems = items.length - idx;

    const footerMinSpace = 25;
    const maxAvailableHeight = frame.h - footerMinSpace;

    while (idx < items.length) {
      const it = items[idx];
      const descW = col.desc - 4;
      const descLines = split(it.name || "", descW);
      const baseHeight = 4;
      const lineHeight = 3;
      const padding = 1;
      const rowH =
        baseHeight + Math.max(0, descLines.length - 1) * lineHeight + padding;

      const contentHeightAfterItem = y + rowH - frame.y;
      const spaceNeededForFooter = measureFooter(idx === items.length - 1) + 3;
      const totalSpaceNeeded = contentHeightAfterItem + spaceNeededForFooter;

      if (totalSpaceNeeded > maxAvailableHeight && idx < items.length - 1) {
        break;
      }
      setBody();
      black();
      pdf.text(String(idx + 1), M.left + col.sno - 2, y + 4, {
        align: "right",
      });
      let ty = y + 3;
      descLines.forEach((ln, lineIndex) => {
        pdf.text(ln, M.left + col.sno + 2, ty);
        ty += lineIndex < descLines.length - 1 ? 3 : 0;
      });
      const xQty = M.left + col.sno + col.desc + col.qty;
      const xRate = M.left + col.sno + col.desc + col.qty + col.rate;
      pdf.text(String(it.quantity ?? ""), xQty - 2, y + 4, { align: "right" });
      pdf.text(formatNumber(it.rate ?? 0), xRate - 2, y + 4, {
        align: "right",
      });
      pdf.text(formatNumber(it.amount ?? 0), M.left + frame.w - 2, y + 4, {
        align: "right",
      });

      y += rowH;
      idx++;
      itemsOnThisPage++;
    }

    const actualContentHeight = y - frame.y;
    const remainingSpace = frame.h - actualContentHeight;

    return {
      nextIndex: idx,
      frame,
      headerH,
      footerH: measureFooter(idx >= items.length),
      actualContentHeight: y - frame.y,
      remainingSpace: frame.h - (y - frame.y),
      lastItemY: y,
    };
  };

  let index = 0;
  const items = invoice.items || [];
  const pagesMeta = [];
  let pageCount = 0;

  while (index < items.length) {
    pageCount++;
    const isFirstPage = pageCount === 1;
    const isLastPage = index + 15 >= items.length;
    const startPage = pdf.getCurrentPageInfo().pageNumber;
    const res = renderRows(index, isFirstPage, isLastPage);
    index = res.nextIndex;

    const minFooterGap = 1;
    const footerY = res.lastItemY + minFooterGap;

    pagesMeta.push({
      pageNumber: pdf.getCurrentPageInfo().pageNumber,
      lastIndex: index,
      isFirstPage,
      footerY: footerY,
      actualContentHeight: res.actualContentHeight,
    });

    if (index < items.length) {
      setBody();
      gray(120);
      pdf.text("Items continue on next page.", M.left, footerY - 2);
      pdf.addPage();
    }
  }

  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    const isLastPg = p === totalPages;
    const pageMeta = pagesMeta[p - 1];
    const customFooterY = pageMeta ? pageMeta.footerY : null;
    drawFooter(p, totalPages, customFooterY);
  }

  pdf.setPage(totalPages);
  setBold();
  black();
  const lastPageMeta = pagesMeta[totalPages - 1];
  const totalsY = lastPageMeta
    ? lastPageMeta.lastItemY + 2
    : page.h - M.bottom - measureFooter(true) - 3;
  pdf.setDrawColor(200);
  pdf.line(M.left, totalsY - 2, page.w - M.right, totalsY - 2);
  setBody();

  const subtotalValForTotals = calculateSubtotal(items);
  const addChargesValForTotals =
    (parseFloat(invoice.packingCharges) || 0) +
    (parseFloat(invoice.freightCharges) || 0) +
    (parseFloat(invoice.loadingCharges) || 0) +
    (parseFloat(invoice.otherCharges) || 0);
  const discountPerc = parseFloat(invoice.discountPercentage) || 0;
  const discountFlat = parseFloat(invoice.discountAmount) || 0;
  const discountValForTotals =
    invoice.discountType === "percentage"
      ? (subtotalValForTotals * discountPerc) / 100
      : discountFlat;

  pdf.text("Subtotal (AED):", page.w - M.right - 60, totalsY);
  pdf.text(formatNumber(subtotalValForTotals), page.w - M.right, totalsY, {
    align: "right",
  });
  if (discountValForTotals > 0) {
    pdf.text("Discount (AED):", page.w - M.right - 60, totalsY + 3);
    pdf.text("-" + formatNumber(discountValForTotals), page.w - M.right, totalsY + 3, { align: "right" });
  }

  const vatLineY = discountValForTotals > 0 ? totalsY + 6 : totalsY + 3;
  const vatAfterDiscount = calculateDiscountedTRN(
    items,
    invoice.discountType,
    invoice.discountPercentage,
    invoice.discountAmount
  );
  pdf.text("VAT Amount (AED):", page.w - M.right - 60, vatLineY);
  pdf.text(formatNumber(vatAfterDiscount), page.w - M.right, vatLineY, { align: "right" });

  setBold();
  const totalLineY = vatLineY + 3;
  pdf.text("Total (AED):", page.w - M.right - 60, totalLineY);
  pdf.text(
    formatNumber(
      calculateTotal(
        Math.max(0, subtotalValForTotals - discountValForTotals) + addChargesValForTotals,
        vatAfterDiscount
      )
    ),
    page.w - M.right,
    totalLineY,
    { align: "right" }
  );

  let currentY = totalsY + 8;
  setBody();
  black();

  if (invoice.notes) {
    pdf.text("Notes:", M.left, currentY);
    currentY += 3;
    const notesLines = split(invoice.notes, page.w - M.left - M.right - 10);
    notesLines.forEach((line) => {
      pdf.text(line, M.left, currentY);
      currentY += 3;
    });
    currentY += 1;
  }

  if (invoice.terms) {
    pdf.text("Payment as per payment terms:", M.left, currentY);
    currentY += 3;
    
    // First split by manual line breaks (\n), then by width
    const manualLines = invoice.terms.split('\n');
    manualLines.forEach((manualLine) => {
      if (manualLine.trim()) {
        // Split each manual line by width if it's too long
        const termsLines = split(manualLine, page.w - M.left - M.right - 10);
        termsLines.forEach((line) => {
          pdf.text(line, M.left, currentY);
          currentY += 3;
        });
      } else {
        // Empty line - just add spacing
        currentY += 3;
      }
    });
  }

  const finalContentY = currentY + 2;

  pdf.setPage(totalPages);
  drawFooter(totalPages, totalPages, finalContentY);

  pdf.save(`${invoice.invoiceNumber}.pdf`);
  return true;
};

const createInvoiceElement = (invoice, company) => {
  const element = document.createElement("div");
  element.style.cssText = `
    width: 210mm;
    min-height: 297mm;
    padding: 12mm 20mm;
    background: white;
    font-family: Calibri, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.2;
    color: #1e293b;
    position: absolute;
    top: -9999px;
    left: -9999px;
  `;

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const subtotalVal = calculateSubtotal(items);
  const trnAmountVal = calculateDiscountedTRN(
    items,
    invoice.discountType,
    invoice.discountPercentage,
    invoice.discountAmount
  );
  const packing = parseFloat(invoice.packingCharges) || 0;
  const freight = parseFloat(invoice.freightCharges) || 0;
  const loading = parseFloat(invoice.loadingCharges) || 0;
  const other = parseFloat(invoice.otherCharges) || 0;
  const additionalChargesVal = packing + freight + loading + other;
  const discountPercVal = parseFloat(invoice.discountPercentage) || 0;
  const discountFlatVal = parseFloat(invoice.discountAmount) || 0;
  const discountVal =
    invoice.discountType === "percentage"
      ? (subtotalVal * discountPercVal) / 100
      : discountFlatVal;
  const totalVal = calculateTotal(
    Math.max(0, subtotalVal - discountVal) + additionalChargesVal,
    trnAmountVal
  );

  const safe = (v) => (v == null ? "" : v);
  const cust = invoice.customer || {};
  const custAddr = cust.address || {};
  const comp = company || {};
  const compAddr = comp.address || {};

  element.innerHTML = `
    <style>
      /* CRITICAL: Prevent ANY spacing from elements */
      * {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
      
      /* Only add back necessary spacing explicitly */
      p, td, span, li, div { 
        font-family: Calibri, Arial, sans-serif; 
        font-size: 11pt; 
        line-height: 1.2; 
      }
      
      /* Completely remove table structures - NO TABLES ALLOWED */
      table { display: none !important; }
      
      .header-section-first {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: white;
        padding: 12px 20px !important;
        border-bottom: 2px solid #e2e8f0;
        z-index: 1000;
      }
      
      .content-area-first {
        margin-top: 160px !important;
        margin-bottom: 0 !important;
        padding: 0 !important;
      }
      
      .footer-section {
        margin-top: 10px !important;
        padding: 10px 20px !important;
        border-top: 1px solid #e2e8f0;
      }
      
      .item-row {
        padding: 3px 0 !important;
        margin: 0 !important;
      }
      
      .totals-section {
        margin-top: 5px !important;
        padding: 0 !important;
      }
    </style>
    
    <!-- HEADER -->
    <div class="header-section-first">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px !important;">
        <img src="${logoCompany}" alt="Company Logo" crossorigin="anonymous" style="max-height: 35px; width: auto;" />
        <div>
          <p style="font-weight: bold; font-size: 11pt;">Ultimate Steels Building Materials Trading</p>
        </div>
      </div>
      
      <div style="margin-bottom: 12px !important;">
        <p style="margin: 1px 0 !important; font-size: 10pt;">${safe(
          compAddr.street
        )}</p>
        <p style="margin: 1px 0 !important; font-size: 10pt;">${safe(
          compAddr.city
        )}${compAddr.city && compAddr.country ? ", " : ""}${safe(
    compAddr.country
  )}</p>
        <p style="margin: 1px 0 !important; font-size: 10pt;">Ph: ${
          comp.phone
            ? comp.phone
                .split(",")
                .map((phone) => phone.trim())
                .join(" | ")
            : ""
        }</p>
        <p style="margin: 1px 0 !important; font-size: 10pt;">Email: ${safe(
          comp.email
        )}</p>
        <p style="margin: 1px 0 !important; font-weight: bold; font-size: 10pt;">VAT Reg No: 104858252000003</p>
      </div>
      
      <div style="width: 100%; background-color: #009999; color: #ffffff; text-align: center; margin: 8px 0 !important; padding: 10px 0 !important;">
        <h2 style="font-size: 16px; font-weight: 700; color: #ffffff;">TAX INVOICE</h2>
      </div>
      
      <div style="display: flex; justify-content: space-between; gap: 15px;">
        <div style="flex: 0 0 45%;">
          <div style="margin: 0 0 6px 0 !important; font-size: 10pt; color: #0f172a;">
            <strong>INVOICE Date :</strong> ${formatDateDMY(invoice.date)}
          </div>
          <h3 style="margin: 0 0 2px 0 !important; color: #ffffff; background-color: #009999; padding: 5px 8px !important; font-weight: bold; font-size: 10pt;">Bill To:</h3>
          <div>
            <p style="margin: 1px 0 !important; font-weight: 600; font-size: 10pt;">${titleCase(
              safe(cust.name)
            )}</p>
            <p style="margin: 1px 0 !important; font-size: 10pt;">${safe(
              custAddr.street
            )}</p>
            <p style="margin: 1px 0 !important; font-size: 10pt;">${safe(
              custAddr.city
            )}${custAddr.city && custAddr.country ? ", " : ""}${safe(
    custAddr.country
  )}</p>
            ${
              cust.vatNumber || cust.gstNumber
                ? `<p style="margin: 1px 0 !important; font-size: 10pt;">TRN: ${safe(
                    cust.vatNumber || cust.gstNumber
                  )}</p>`
                : ""
            }
            <p style="margin: 1px 0 !important; font-size: 10pt;">Phone: ${safe(
              cust.phone
            )}</p>
            <p style="margin: 1px 0 !important; font-size: 10pt;">Email: ${safe(
              cust.email
            )}</p>
          </div>
        </div>
        <div style="flex: 0 0 45%;">
          <div>
            <p style="margin: 2px 0 !important; font-size: 10pt;"><strong>Invoice #:</strong> ${safe(
              invoice.invoiceNumber
            )}</p>
            ${
              invoice.customerPurchaseOrderNumber
                ? `<p style="margin: 2px 0 !important; font-size: 10pt;"><strong>Customer PO #:</strong> ${safe(
                    invoice.customerPurchaseOrderNumber
                  )}</p>`
                : ""
            }
            ${
              invoice.customerPurchaseOrderDate
                ? `<p style="margin: 2px 0 !important; font-size: 10pt;"><strong>Customer PO Date:</strong> ${formatDate(
                    invoice.customerPurchaseOrderDate
                  )}</p>`
                : ""
            }
            ${
              invoice.modeOfPayment
                ? `<p style="margin: 2px 0 !important; font-size: 10pt;"><strong>Payment Mode:</strong> ${safe(invoice.modeOfPayment)}</p>`
                : ''
            }
            ${
              invoice.chequeNumber
                ? `<p style=\"margin: 2px 0 !important; font-size: 10pt;\"><strong>Cheque No:</strong> ${safe(invoice.chequeNumber)}</p>`
                : ''
            }
            ${
              invoice.warehouseName || invoice.warehouseCode || invoice.warehouseCity
                ? `<div style="margin: 4px 0 !important; font-size: 10pt;">
                    <strong>Warehouse:</strong><br/>
                    ${safe(invoice.warehouseName || '')}<br/>
                    ${invoice.warehouseCode ? `WAREHOUSE NO:${safe(invoice.warehouseCode)}` : ''}${invoice.warehouseCity ? '<br/>' : ''}
                    ${safe(invoice.warehouseCity || '')}
                  </div>`
                : ''
            }
          </div>
        </div>
      </div>
    </div>
    
    <!-- CONTENT AREA - NO TABLES, ONLY DIVS -->
    <div class="content-area-first">
      <!-- Items as simple divs, no table -->
      ${items
        .map((item, i) => {
          const amountNum = parseFloat(item.amount) || 0;
          const vatRateNum = parseFloat(item.vatRate) || 0;
          const vatAmount = calculateTRN(amountNum, vatRateNum);
          const totalWithTRN = amountNum + vatAmount;
          const productLine = safe(item.name);

          return `
          <div class="item-row" style="display: flex; justify-content: space-between; align-items: center; border-bottom: ${
            i === items.length - 1 ? "none" : "1px solid #f1f5f9"
          };">
            <div style="flex: 0 0 30px; font-size: 10pt;">${i + 1}.</div>
            <div style="flex: 1; font-weight: 600; font-size: 10pt; color: #0f172a; padding-right: 10px !important;">${productLine}</div>
            <div style="flex: 0 0 60px; text-align: right; font-size: 10pt;">${safe(
              item.quantity
            )}</div>
            <div style="flex: 0 0 80px; text-align: right; font-size: 10pt;">${formatNumber(
              item.rate || 0
            )}</div>
            <div style="flex: 0 0 100px; text-align: right; font-size: 10pt; font-weight: 600;">${formatNumber(
              totalWithTRN
            )}</div>
          </div>
        `;
        })
        .join("")}

      <!-- Totals Section -->
      <div class="totals-section" style="display: flex; justify-content: flex-end;">
        <div style="min-width: 280px; padding-top: 5px !important;">
          <div style="display: flex; justify-content: space-between; padding: 2px 0 !important;">
            <span>Subtotal (AED):</span>
            <span>${formatNumber(subtotalVal)}</span>
          </div>
          ${
            discountVal > 0
              ? `<div style="display: flex; justify-content: space-between; padding: 2px 0 !important;">
                   <span>Discount (AED):</span>
                   <span>- ${formatNumber(discountVal)}</span>
                 </div>`
              : ""
          }
          <div style="display: flex; justify-content: space-between; padding: 2px 0 !important;">
            <span>VAT Amount (AED):</span>
            <span>${formatNumber(trnAmountVal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 2px 0 !important; border-top: 1px solid #e2e8f0; margin-top: 2px !important; font-weight: 600; font-size: 12px;">
            <span><strong>Total Amount (AED):</strong></span>
            <span><strong>${formatNumber(totalVal)}</strong></span>
          </div>
        </div>
      </div>

      ${
        invoice.notes || invoice.terms
          ? `
        <div style="margin-top: 8px !important;">
          ${
            invoice.notes
              ? `
            <div style="margin-bottom: 3px !important;">
              <h4 style="margin: 0 0 2px 0 !important; color: #1e293b; font-size: 10pt;">Notes:</h4>
              <p style="color: #64748b; font-size: 10pt; white-space: pre-line;">${invoice.notes}</p>
            </div>
          `
              : ""
          }
          ${
            invoice.terms
              ? `
            <div style="margin-bottom: 3px !important;">
              <h4 style="margin: 0 0 2px 0 !important; color: #1e293b; font-size: 10pt;">Payment as per payment terms:</h4>
              <p style="color: #64748b; font-size: 10pt; white-space: pre-line;">${invoice.terms}</p>
            </div>
          `
              : ""
          }
        </div>
      `
          : ""
      }
    </div>
    
    <!-- FOOTER -->
    <div class="footer-section">
      <div style="display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${sealImage}" alt="Company Seal" crossorigin="anonymous" style="height: 65px; width: auto;" />
          <div>
            <p style="font-size: 9pt; color: #666;">Company Seal</p>
            <p style="margin: 1px 0 !important; font-size: 8pt; color: #666;">Ultimate Steels</p>
            <p style="margin: 1px 0 !important; font-size: 8pt; color: #666;">Building Materials Trading</p>
          </div>
        </div>
        
        <div style="text-align: center; min-width: 180px;">
          <p style="font-size: 10pt;">Authorized Signatory</p>
          <div style="border-bottom: 1px solid #000; margin: 20px 0 6px 0 !important;"></div>
          <p style="font-weight: 600; font-size: 9pt;">ULTIMATE STEELS</p>
          <p style="margin: 1px 0 !important; font-weight: 600; font-size: 9pt;">BUILDING MATERIALS TRADING</p>
        </div>
      </div>
    </div>
  `;

  return element;
};

// Wait for all images within a container to load
const waitForImages = (container) => {
  const images = Array.from(container.querySelectorAll("img"));
  if (images.length === 0) return Promise.resolve();

  return Promise.all(
    images.map((img) => {
      return new Promise((resolve) => {
        if (img.complete && img.naturalWidth !== 0) return resolve();
        try {
          img.crossOrigin = img.crossOrigin || "anonymous";
        } catch (_) {}
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });
    })
  );
};

export { createInvoiceElement, waitForImages };
