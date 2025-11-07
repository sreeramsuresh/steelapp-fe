import { formatCurrency, formatDate, calculateTotal } from './invoiceUtils';
import logoCompany from '../assets/logocompany.png';
import sealImage from '../assets/Seal.png';

export const generateStatementPDF = async ({ customerName, periodStart, periodEnd, items, company }) => {
  try {
    const { jsPDF } = await import('jspdf');

    const element = createStatementElement({ customerName, periodStart, periodEnd, items, company });
    document.body.appendChild(element);

    await waitForImages(element);
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: true,
    });

    document.body.removeChild(element);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p','mm','a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const fname = `Statement-${(customerName || 'Customer').replace(/[\\/:*?"<>|]/g,'_')}-${periodStart || ''}_to_${periodEnd || ''}.pdf`;
    pdf.save(fname);
    return true;
  } catch (e) {
    console.error('Error generating Statement PDF:', e);
    throw e;
  }
};

const createStatementElement = ({ customerName, periodStart, periodEnd, items = [], company = {} }) => {
  const el = document.createElement('div');
  el.style.cssText = `
    width: 210mm;
    min-height: 297mm;
    padding: 20mm;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    font-size: 12px;
    line-height: 1.4;
    color: #1e293b;
    position: absolute;
    top: -9999px;
    left: -9999px;
  `;

  const safe = (v) => (v == null ? '' : v);
  const comp = company || {};
  const compAddr = comp.address || {};

  const totalInvoiced = items.reduce((s, r) => s + (parseFloat(r.invoice_amount) || 0), 0);
  const totalReceived = items.reduce((s, r) => s + (parseFloat(r.received) || 0), 0);
  const totalOutstanding = items.reduce((s, r) => s + (parseFloat(r.outstanding) || 0), 0);

  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:30px; padding-bottom:20px; border-bottom:2px solid #e2e8f0;">
      <div style="flex:1;">
        <div style="margin:0 0 10px 0; display:flex; align-items:center; gap:10px;">
          <img src="${logoCompany}" alt="Company Logo" crossorigin="anonymous" style="max-height:48px; width:auto; object-fit:contain;" />
        </div>
        <div style="margin-top:8px; line-height:1.3;">
          <p style="margin:0; font-size:11px; color:#334155;"><strong>${safe(comp.name) || 'Company'}</strong></p>
          <p style="margin:0; font-size:11px; color:#334155;">${safe(compAddr.street)}</p>
          <p style="margin:0; font-size:11px; color:#334155;">${safe(compAddr.city)}${compAddr.emirate ? ', ' + compAddr.emirate : ''} ${compAddr.poBox || ''}</p>
          <p style="margin:0; font-size:11px; color:#334155;">${safe(compAddr.country)}</p>
          <p style="margin:0; font-size:11px; color:#334155;">Phone: ${safe(comp.phone)}</p>
          <p style="margin:0; font-size:11px; color:#334155;">Email: ${safe(comp.email)}</p>
          <p style="margin:0; font-size:11px; color:#334155;">TRN: ${safe(comp.vatNumber)}</p>
        </div>
      </div>

      <div style="text-align:left;">
        <div style="margin-bottom:6px;">
          <p style="margin:2px 0;">${safe(customerName) || 'Customer'}</p>
        </div>
        <div style="margin-bottom:10px;">
          <p style="margin:2px 0;"><strong>Period:</strong> ${formatDate(periodStart)} - ${formatDate(periodEnd)}</p>
          <p style="margin:2px 0;"><strong>Generated:</strong> ${formatDate(new Date())}</p>
        </div>
      </div>
    </div>

    <div style="width:100%; background-color:#009999; color:#ffffff; text-align:center; margin:10px 0 20px 0; padding:15px 0;">
      <h2 style="margin:0; font-size:20px; font-weight:700; letter-spacing:0.5px; color:#ffffff;">STATEMENT OF ACCOUNT</h2>
    </div>

    <div style="margin-bottom:20px; display:flex; gap:16px;">
      <div style="flex:1; padding:12px; border:1px solid #e2e8f0; border-radius:8px;">
        <div style="font-size:12px; color:#64748b;">Total Invoiced</div>
        <div style="font-size:16px; font-weight:700; color:#0f172a;">${formatCurrency(totalInvoiced)}</div>
      </div>
      <div style="flex:1; padding:12px; border:1px solid #e2e8f0; border-radius:8px;">
        <div style="font-size:12px; color:#64748b;">Total Received</div>
        <div style="font-size:16px; font-weight:700; color:#0f172a;">${formatCurrency(totalReceived)}</div>
      </div>
      <div style="flex:1; padding:12px; border:1px solid #e2e8f0; border-radius:8px;">
        <div style="font-size:12px; color:#64748b;">Total Outstanding</div>
        <div style="font-size:16px; font-weight:700; color:#0f172a;">${formatCurrency(totalOutstanding)}</div>
      </div>
    </div>

    <div style="margin-bottom:30px;">
      <table style="width:100%; border-collapse:collapse; font-size:11px;">
        <thead>
          <tr style="background-color:#009999; color:#ffffff;">
            <th style="padding:10px 8px; text-align:left; border:1px solid #007d7d; font-weight:600;">Invoice #</th>
            <th style="padding:10px 8px; text-align:left; border:1px solid #007d7d; font-weight:600;">Invoice Date</th>
            <th style="padding:10px 8px; text-align:left; border:1px solid #007d7d; font-weight:600;">Due Date</th>
            <th style="padding:10px 8px; text-align:left; border:1px solid #007d7d; font-weight:600;">Currency</th>
            <th style="padding:10px 8px; text-align:right; border:1px solid #007d7d; font-weight:600;">Invoice Amount</th>
            <th style="padding:10px 8px; text-align:right; border:1px solid #007d7d; font-weight:600;">Received</th>
            <th style="padding:10px 8px; text-align:right; border:1px solid #007d7d; font-weight:600;">Outstanding</th>
            <th style="padding:10px 8px; text-align:left; border:1px solid #007d7d; font-weight:600;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((r) => `
            <tr>
              <td style="padding:8px; text-align:left; border:1px solid #e2e8f0;">${safe(r.invoice_no || r.invoiceNumber)}</td>
              <td style="padding:8px; text-align:left; border:1px solid #e2e8f0;">${formatDate(r.invoice_date || r.date)}</td>
              <td style="padding:8px; text-align:left; border:1px solid #e2e8f0;">${formatDate(r.due_date || r.dueDate)}</td>
              <td style="padding:8px; text-align:left; border:1px solid #e2e8f0;">${safe(r.currency || 'AED')}</td>
              <td style="padding:8px; text-align:right; border:1px solid #e2e8f0;">${formatCurrency(r.invoice_amount || 0)}</td>
              <td style="padding:8px; text-align:right; border:1px solid #e2e8f0;">${formatCurrency(r.received || 0)}</td>
              <td style="padding:8px; text-align:right; border:1px solid #e2e8f0; font-weight:600;">${formatCurrency(r.outstanding || 0)}</td>
              <td style="padding:8px; text-align:left; border:1px solid #e2e8f0;">${safe(r.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div style="display:flex; justify-content:flex-end; margin-top:50px;">
      <div style="display:flex; align-items:flex-end; gap:20px;">
        <img src="${sealImage}" alt="Company Seal" crossorigin="anonymous" style="height: 160px; width:auto; object-fit:contain; opacity:0.95;" />
        <div style="text-align:center; min-width:200px;">
          <p style="margin:0;">Authorized Signatory</p>
          <div style="border-bottom:1px solid #000; margin:40px 0 10px 0;"></div>
          <p style="margin:0; font-weight:600;">${safe(comp.name) || 'Company'}</p>
        </div>
      </div>
    </div>
  `;
  return el;
};

const waitForImages = (container) => {
  const images = Array.from(container.querySelectorAll('img'));
  if (images.length === 0) return Promise.resolve();
  return Promise.all(images.map(img => new Promise((resolve) => {
    if (img.complete && img.naturalWidth !== 0) return resolve();
    try { img.crossOrigin = img.crossOrigin || 'anonymous'; } catch {}
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  })));
};

