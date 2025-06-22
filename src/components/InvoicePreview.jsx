import React from 'react';
import { X, Download } from 'lucide-react';
import { formatCurrency, formatDate, calculateGST } from '../utils/invoiceUtils';

const InvoicePreview = ({ invoice, company, onClose }) => {
  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      const element = document.getElementById('invoice-preview');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="invoice-preview-modal">
      <div className="modal-header">
        <h2>Invoice Preview</h2>
        <div className="modal-actions">
          <button onClick={handleDownloadPDF} className="btn btn-primary">
            <Download size={18} />
            Download PDF
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            <X size={18} />
            Close
          </button>
        </div>
      </div>
      
      <div id="invoice-preview" className="invoice-preview">
        <div className="invoice-header">
          <div className="company-info">
            <h1>{company.name}</h1>
            <div className="address">
              <p>{company.address.street}</p>
              <p>{company.address.city}, {company.address.state} {company.address.zipCode}</p>
              <p>{company.address.country}</p>
            </div>
            <div className="contact">
              <p>Phone: {company.phone}</p>
              <p>Email: {company.email}</p>
              <p>GST: {company.gstNumber}</p>
            </div>
          </div>
          
          <div className="invoice-meta">
            <h2>INVOICE</h2>
            <div className="meta-info">
              <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> {formatDate(invoice.date)}</p>
              <p><strong>Due Date:</strong> {formatDate(invoice.dueDate)}</p>
              <p><strong>Status:</strong> <span className={`status ${invoice.status}`}>{invoice.status.toUpperCase()}</span></p>
            </div>
          </div>
        </div>

        <div className="bill-to">
          <h3>Bill To:</h3>
          <div className="customer-details">
            <p><strong>{invoice.customer.name}</strong></p>
            <p>{invoice.customer.address.street}</p>
            <p>{invoice.customer.address.city}, {invoice.customer.address.state} {invoice.customer.address.zipCode}</p>
            <p>{invoice.customer.address.country}</p>
            {invoice.customer.gstNumber && <p>GST: {invoice.customer.gstNumber}</p>}
            <p>Phone: {invoice.customer.phone}</p>
            <p>Email: {invoice.customer.email}</p>
          </div>
        </div>

        <div className="invoice-table">
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Specification</th>
                <th>HSN Code</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>GST %</th>
                <th>GST Amount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => {
                const gstAmount = calculateGST(item.amount, item.gstRate);
                const totalWithGST = item.amount + gstAmount;
                
                return (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.specification}</td>
                    <td>{item.hsnCode}</td>
                    <td>{item.unit}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.rate)}</td>
                    <td>{formatCurrency(item.amount)}</td>
                    <td>{item.gstRate}%</td>
                    <td>{formatCurrency(gstAmount)}</td>
                    <td>{formatCurrency(totalWithGST)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="invoice-summary">
          <div className="summary-table">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>GST Amount:</span>
              <span>{formatCurrency(invoice.gstAmount)}</span>
            </div>
            <div className="summary-row total">
              <span><strong>Total Amount:</strong></span>
              <span><strong>{formatCurrency(invoice.total)}</strong></span>
            </div>
          </div>
        </div>

        {(invoice.notes || invoice.terms) && (
          <div className="invoice-footer">
            {invoice.notes && (
              <div className="notes">
                <h4>Notes:</h4>
                <p>{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div className="terms">
                <h4>Terms & Conditions:</h4>
                <p>{invoice.terms}</p>
              </div>
            )}
          </div>
        )}

        <div className="invoice-signature">
          <div className="signature-section">
            <p>Authorized Signatory</p>
            <div className="signature-line"></div>
            <p>{company.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;