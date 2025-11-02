import { formatCurrency, formatDate, calculateTRN, calculateSubtotal, calculateTotalTRN, calculateTotal, titleCase } from './invoiceUtils';
import logoCompany from '../assets/logocompany.png';
import sealImage from '../assets/Seal.png';

// Measurement‑based pagination generator
export const generateInvoicePDF = async (invoice, company) => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF('p', 'mm', 'a4');

  // Base margins (mm) — business docs spec
  const M = { top: 15, bottom: 15, left: 15, right: 15 };
  const page = { w: pdf.internal.pageSize.getWidth(), h: pdf.internal.pageSize.getHeight() };

  // Fonts
  const setBody = () => { pdf.setFont('helvetica', ''); pdf.setFontSize(11); };
  const setBold = () => { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); };
  const gray = (v=140) => pdf.setTextColor(v);
  const black = () => pdf.setTextColor(0);

  const textWidth = (txt, fontSize=11, fontStyle='') => {
    const prevSize = pdf.getFontSize();
    const prev = pdf.getFont();
    pdf.setFont('helvetica', fontStyle || '');
    pdf.setFontSize(fontSize);
    const w = pdf.getTextDimensions(txt).w;
    pdf.setFont(prev.fontName, prev.fontStyle);
    pdf.setFontSize(prevSize);
    return w;
  };
  const split = (txt, maxW) => pdf.splitTextToSize(txt || '', maxW);

  // Measure header height based on text blocks (kept consistent on every page)
  const measureHeader = () => {
    const titleH = 8;               // TAX INVOICE banner
    const companyBlockH = 5 * 4;    // approx 4 lines (name + address)
    const invoiceMetaH  = 5 * 4;    // invoice details (2–3 lines)
    const billToH       = 5 * 4;    // bill to block (approx 3–4 lines)
    const gutter        = 4;        // spacing between rows
    return titleH + companyBlockH + gutter + Math.max(invoiceMetaH, billToH) + 2; // mm
  };

  const drawHeader = (pageIdx, pageCount) => {
    let y = M.top;
    // TAX INVOICE banner
    pdf.setFillColor(0, 128, 128);
    pdf.rect(M.left, y, page.w - M.left - M.right, 8, 'F');
    setBold(); pdf.setTextColor(255);
    pdf.text('TAX INVOICE', M.left + 4, y + 5.5);
    y += 12;
    // Company (left)
    setBody(); black();
    const compName = company?.name || 'Ultimate Steels Building Materials Trading';
    pdf.text(compName, M.left, y); y += 5;
    const addr = [company?.address?.street, company?.address?.city, company?.address?.emirate, company?.address?.country]
      .filter(Boolean).join(', ');
    if (addr) { pdf.text(addr, M.left, y); y += 5; }
    // Logo (optional) to left of company name if available (fallback safe)
    // Note: For simplicity, we keep text-only header. Logo embedding can be added if a base64 image is available.

    // Right column: Invoice details + Bill To
    const rightX = page.w - M.right - 70; // fixed width box
    let ry = M.top + 12;
    setBold(); pdf.text('Invoice Details', rightX, ry); ry += 6; setBody();
    const invNo = `Invoice #: ${invoice.invoiceNumber || ''}`;
    const invDate = `Date: ${formatDate(invoice.date || new Date())}`;
    pdf.text(invNo, rightX, ry); ry += 5; pdf.text(invDate, rightX, ry);

    // Bill To block
    const cust = invoice.customer || {};
    const billTop = M.top + 12;
    setBold(); pdf.text('Bill To:', rightX + 40, billTop); setBody();
    const billLines = split(`${titleCase(cust.name || '')}\n${cust.address?.street || ''}\n${cust.address?.city || ''}`, 70);
    let by = billTop + 6;
    billLines.forEach((ln)=>{ pdf.text(ln, rightX + 40, by); by += 5; });
  };

  // Table header measure/draw
  const tableHeaderHeight = 8;
  const drawTableHeader = (y) => {
    // Columns: Description | Qty | Rate | Amount
    const W = page.w - M.left - M.right;
    const col = {
      desc: W * 0.58,
      qty:  W * 0.12,
      rate: W * 0.14,
      amt:  W * 0.16,
    };
    pdf.setFillColor(0, 128, 128);
    pdf.rect(M.left, y, W, tableHeaderHeight, 'F');
    setBold(); pdf.setTextColor(255);
    pdf.text('Description', M.left + 2, y + 5.5);
    const xQty = M.left + col.desc + col.qty;
    const xRate = M.left + col.desc + col.qty + col.rate;
    pdf.text('Qty', M.left + col.desc + col.qty - 2, y + 5.5, { align: 'right' });
    pdf.text('Rate', xRate - 2, y + 5.5, { align: 'right' });
    pdf.text('Amount', M.left + W - 2, y + 5.5, { align: 'right' });
    setBody(); black();
    return { col, height: tableHeaderHeight };
  };

  // Footer measure/draw (signature + stamp + page numbering)
  const measureFooter = () => 30; // mm approx area for seal + signatory
  const drawFooter = (pageIdx, pageCount) => {
    const footerH = measureFooter();
    const yTop = page.h - M.bottom - footerH;
    // Stamp/Seal box
    pdf.setDrawColor(60);
    pdf.rect(M.left, yTop + 2, 35, 25);
    setBody(); gray(100);
    pdf.text('Stamp / Seal', M.left + 3, yTop + 8);
    // Authorized Signatory
    black();
    pdf.text('Authorized Signatory', page.w - M.right - 55, yTop + 8);
    pdf.line(page.w - M.right - 55, yTop + 20, page.w - M.right, yTop + 20);
    setBody(); gray(110);
    pdf.text('ULTIMATE STEELS', page.w - M.right - 40, yTop + 26);
    // Page numbering
    setBody(); gray(120);
    pdf.text(`Page ${pageIdx} of ${pageCount}`, page.w - M.right, page.h - 6, { align: 'right' });
  };

  // Row renderer & measurer
  const renderRows = (startIndex) => {
    const headerH = measureHeader();
    const footerH = measureFooter();
    const topBoundaryY = M.top + headerH + tableHeaderHeight;
    const bottomBoundaryY = page.h - M.bottom - footerH;
    const frame = { x: M.left, y: topBoundaryY, w: page.w - M.left - M.right, h: bottomBoundaryY - topBoundaryY };

    // Draw header each page
    drawHeader(1, 1); // page numbers postdraw
    const { col } = drawTableHeader(M.top + headerH);

    let y = frame.y;
    let idx = startIndex;
    const items = invoice.items || [];
    while (idx < items.length) {
      const it = items[idx];
      const descW = col.desc - 4;
      const descLines = split(it.name || '', descW);
      const rowH = Math.max(8, descLines.length * 5 + 4);
      if (y + rowH > frame.y + frame.h) break; // move whole row to next page
      // Draw row
      setBody(); black();
      // Description (left)
      let ty = y + 5;
      descLines.forEach((ln)=>{ pdf.text(ln, M.left + 2, ty); ty += 5; });
      // Qty / Rate / Amount (right-aligned)
      const xQty = M.left + col.desc + col.qty;
      const xRate = M.left + col.desc + col.qty + col.rate;
      pdf.text(String(it.quantity ?? ''), xQty - 2, y + 5, { align: 'right' });
      pdf.text(formatCurrency(it.rate ?? 0), xRate - 2, y + 5, { align: 'right' });
      pdf.text(formatCurrency(it.amount ?? 0), M.left + frame.w - 2, y + 5, { align: 'right' });
      // Divider
      pdf.setDrawColor(220); pdf.line(M.left, y + rowH, M.left + frame.w, y + rowH);
      y += rowH;
      idx++;
    }
    return { nextIndex: idx, frame, headerH, footerH };
  };

  // Pagination loop
  let index = 0;
  const items = invoice.items || [];
  const pagesMeta = [];
  while (index < items.length) {
    const startPage = pdf.getCurrentPageInfo().pageNumber;
    const res = renderRows(index);
    index = res.nextIndex;
    pagesMeta.push({ pageNumber: pdf.getCurrentPageInfo().pageNumber, lastIndex: index });
    // Footer (+ continue note if not last page)
    const totalPagesSoFar = pdf.getNumberOfPages();
    // We'll add numbering after all pages are created
    if (index < items.length) {
      setBody(); gray(120);
      pdf.text('Items continue on next page.', M.left, page.h - M.bottom - measureFooter() - 2);
      pdf.addPage();
    }
  }

  // Draw footer and totals on last page
  const pageCount = pdf.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    pdf.setPage(p);
    drawFooter(p, pageCount);
  }
  // Totals only on last page
  pdf.setPage(pageCount);
  setBold(); black();
  const totalsY = page.h - M.bottom - measureFooter() - 18;
  pdf.setDrawColor(200); pdf.line(M.left, totalsY - 4, page.w - M.right, totalsY - 4);
  setBody();
  pdf.text('Subtotal:', page.w - M.right - 60, totalsY);
  pdf.text(formatCurrency(calculateSubtotal(items)), page.w - M.right, totalsY, { align: 'right' });
  pdf.text('VAT Amount:', page.w - M.right - 60, totalsY + 6);
  pdf.text(formatCurrency(calculateTotalTRN(items)), page.w - M.right, totalsY + 6, { align: 'right' });
  setBold();
  pdf.text('Total:', page.w - M.right - 60, totalsY + 12);
  pdf.text(formatCurrency(calculateTotal(calculateSubtotal(items), calculateTotalTRN(items))), page.w - M.right, totalsY + 12, { align: 'right' });

  // Save
  pdf.save(`${invoice.invoiceNumber}.pdf`);
  return true;
};

const createInvoiceElement = (invoice, company) => {
  const element = document.createElement('div');
  element.style.cssText = `
    width: 210mm;
    min-height: 297mm;
    padding: 15mm 25mm;
    background: white;
    font-family: Calibri, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #1e293b;
    position: absolute;
    top: -9999px;
    left: -9999px;
  `;
  
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const hasDescription = items.some((it) => !!it.description);
  const hasItemDiscount = items.some((it) => (parseFloat(it.discount) || 0) > 0);
  const subtotalVal = calculateSubtotal(items);
  const trnAmountVal = calculateTotalTRN(items);
  const packing = parseFloat(invoice.packingCharges) || 0;
  const freight = parseFloat(invoice.freightCharges) || 0;
  const loading = parseFloat(invoice.loadingCharges) || 0;
  const other = parseFloat(invoice.otherCharges) || 0;
  const additionalChargesVal = packing + freight + loading + other;
  const totalVal = calculateTotal(subtotalVal + additionalChargesVal, trnAmountVal);
  // Safe access helpers
  const safe = (v) => (v == null ? '' : v);
  const cust = invoice.customer || {};
  const custAddr = cust.address || {};
  const comp = company || {};
  const compAddr = comp.address || {};

  element.innerHTML = `
    <style>
      /* Calibri 11 for body text; headings and table headers keep their own sizes */
      p, td, span, li, div { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
      th { font-family: inherit; }
      h1, h2, h3, h4, h5, h6 { font-family: inherit; }
    </style>
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
      <div style="flex: 1;">
        <div style="margin: 0 0 10px 0; display: flex; align-items: center; gap: 10px;">
          <img src="${logoCompany}" alt="Company Logo" crossorigin="anonymous" style="max-height: 48px; width: auto; object-fit: contain;" />
        </div>
        <div style="margin-top: 8px; line-height: 1.3;">
          ${company.bankDetails && (company.bankDetails.bankName || company.bankDetails.accountNumber) ? `
            <p style="margin: 0; font-size: 11px; color: #334155;"><strong>BANK NAME:</strong> ${company.bankDetails.bankName || 'Not specified'}</p>
            ${company.bankDetails.accountNumber ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #334155;">Account No: ${company.bankDetails.accountNumber}</p>` : ''}
            ${company.bankDetails.iban ? `<p style="margin: 0; font-size: 11px; color: #334155;">IBAN: ${company.bankDetails.iban}</p>` : ''}
          ` : `
            <p style="margin: 0; font-size: 11px; color: #334155;"><strong>BANK NAME:</strong> ULTIMATE STEEL AND</p>
            <p style="margin: 0; font-size: 11px; color: #334155;">BUILDING MATERIALS TRADING</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #334155;">Account No: 019101641144</p>
            <p style="margin: 0; font-size: 11px; color: #334155;">IBAN: AE490330000019101641144</p>
          `}
        </div>
      </div>
      
      <div style="text-align: left;">
        <div style="margin-bottom: 6px;">
          <p style="margin: 2px 0;">Ultimate Steels Building Materials Trading</p>
        </div>
        <div style="margin-bottom: 10px;">
          <p style="margin: 2px 0;">${safe(compAddr.street)}</p>
          <p style="margin: 2px 0;">${safe(compAddr.city)}${compAddr.city && compAddr.country ? ', ' : ''}${safe(compAddr.country)}</p>
        </div>
        <div>
          <p style="margin: 2px 0;">Ph: ${comp.phone ? comp.phone.split(',').map(phone => phone.trim()).join(' | ') : ''}</p>
          <p style="margin: 2px 0;">Email: ${safe(comp.email)}</p>
          <p style="margin: 2px 0; font-weight: bold; font-size: 12pt;">VAT Reg No: 104858252000003</p>
        </div>
      </div>
    </div>

    <div style="width: 100%; background-color: #009999; color: #ffffff; text-align: center; margin: 10px 0 20px 0; padding: 15px 0;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; color: #ffffff;">TAX INVOICE</h2>
    </div>

    <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 30px; align-items: flex-start;">
      <div style="flex: 0 0 40%; min-width: 0;">
        <h3 style="margin: 0 0 10px 0; color: #ffffff; background-color: #009999; padding: 8px 12px; font-weight: bold;">Bill To:</h3>
        <div>
          <p style="margin: 2px 0; font-weight: 600;">${titleCase(safe(cust.name))}</p>
          <p style="margin: 2px 0;">${safe(custAddr.street)}</p>
          <p style="margin: 2px 0;">${safe(custAddr.city)}${custAddr.city && custAddr.country ? ', ' : ''}${safe(custAddr.country)}</p>
          ${(cust.vatNumber || cust.gstNumber) ? `<p style="margin: 2px 0;">TRN: ${safe(cust.vatNumber || cust.gstNumber)}</p>` : ''}
          <p style="margin: 2px 0;">Phone: ${safe(cust.phone)}</p>
          <p style="margin: 2px 0;">Email: ${safe(cust.email)}</p>
        </div>
      </div>
      <div style="flex: 0 0 40%; min-width: 0; text-align: left;">
        <h3 style="margin: 0 0 10px 0; color: #ffffff; background-color: #009999; padding: 8px 12px; font-weight: bold; text-align: center;">INVOICE</h3>
        <div>
          <p style="margin: 4px 0;"><strong>Invoice #:</strong> ${safe(invoice.invoiceNumber)}</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${formatDate(invoice.date)}</p>
          <p style="margin: 4px 0;"><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
          ${invoice.customerPurchaseOrderNumber ? `<p style="margin: 4px 0;"><strong>Customer PO #:</strong> ${safe(invoice.customerPurchaseOrderNumber)}</p>` : ''}
          ${invoice.customerPurchaseOrderDate ? `<p style="margin: 4px 0;"><strong>Customer PO Date:</strong> ${formatDate(invoice.customerPurchaseOrderDate)}</p>` : ''}
        </div>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background-color: #009999 !important; color: #ffffff !important;">
            <th style="padding: 10px 8px; text-align: left; border: 1px solid #007d7d; font-weight: 600; color: #ffffff !important; background-color: #009999 !important;">Product</th>
            ${hasDescription ? '<th style="padding: 10px 8px; text-align: left; border: 1px solid #007d7d; font-weight: 600; color: #ffffff !important; background-color: #009999 !important;">Description</th>' : ''}
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff !important; background-color: #009999 !important;">Qty</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff !important; background-color: #009999 !important;">Rate</th>
            ${hasItemDiscount ? '<th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff !important; background-color: #009999 !important;">Discount</th>' : ''}
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff !important; background-color: #009999 !important;">Amount</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff !important; background-color: #009999 !important;">VAT %</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff !important; background-color: #009999 !important;">VAT Amount</th>
            <th style="padding: 10px 8px; text-align: right; border: 1px solid #007d7d; font-weight: 600; color: #ffffff !important; background-color: #009999 !important;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => {
            const amountNum = parseFloat(item.amount) || 0;
            const vatRateNum = parseFloat(item.vatRate) || 0;
            const vatAmount = calculateTRN(amountNum, vatRateNum);
            const totalWithTRN = amountNum + vatAmount;
            const productLine = safe(item.name);
            
            return `
              <tr>
                <td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0; font-weight:600;color:#0f172a;">${productLine}</td>
                ${hasDescription ? '<td style="padding: 8px; text-align: left; border: 1px solid #e2e8f0;">' + (safe(item.description) || '-') + '</td>' : ''}
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${safe(item.quantity)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(item.rate || 0)}</td>
                ${hasItemDiscount ? '<td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">' + (((parseFloat(item.discount)||0) > 0) ? (formatCurrency(item.discount) + (item.discountType === 'percentage' ? '%' : '')) : '-') + '</td>' : ''}
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(amountNum)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${vatRateNum}%</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(vatAmount)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600;">${formatCurrency(totalWithTRN)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
      <div style="min-width: 300px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span>Subtotal:</span>
          <span>${formatCurrency(subtotalVal)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span>VAT Amount:</span>
          <span>${formatCurrency(trnAmountVal)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 16px 0; border-top: 1px solid #e2e8f0; margin-top: 8px; font-weight: 600; font-size: 14px;">
          <span><strong>Total Amount:</strong></span>
          <span><strong>${formatCurrency(totalVal)}</strong></span>
        </div>
      </div>
    </div>

    ${(invoice.notes || invoice.terms) ? `
      <div style="margin-bottom: 30px;">
        ${invoice.notes ? `
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 5px 0; color: #1e293b;">Notes:</h4>
            <p style="margin: 0; color: #64748b;">${invoice.notes}</p>
          </div>
        ` : ''}
        ${invoice.terms ? `
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 5px 0; color: #1e293b;">Payment as per payment terms:</h4>
            <p style="margin: 0; color: #64748b;">${invoice.terms}</p>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <div style="display: flex; justify-content: flex-end; margin-top: 50px;">
      <div style="display: flex; align-items: flex-end; gap: 20px;">
        <img src="${sealImage}" alt="Company Seal" crossorigin="anonymous" style="height: 180px; width: auto; object-fit: contain; opacity: 0.95;" />
        <div style="text-align: center; min-width: 200px;">
          <p style="margin: 0;">Authorized Signatory</p>
          <div style="border-bottom: 1px solid #000; margin: 40px 0 10px 0;"></div>
          <p style="margin: 0; font-weight: 600;">ULTIMATE STEELS</p>
        </div>
      </div>
    </div>
  `;
  
  return element;
};

// Wait for all images within a container to load (or error) before rendering
const waitForImages = (container) => {
  const images = Array.from(container.querySelectorAll('img'));
  if (images.length === 0) return Promise.resolve();

  return Promise.all(
    images.map((img) => {
      return new Promise((resolve) => {
        // If already complete, resolve immediately
        if (img.complete && img.naturalWidth !== 0) return resolve();
        // Set crossOrigin for safety
        try { img.crossOrigin = img.crossOrigin || 'anonymous'; } catch (_) {}
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      });
    })
  );
};
