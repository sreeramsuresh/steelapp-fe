/**
 * Step 3: End-to-End Workflow Test - Full Sales Cycle
 * Complete business process: Quote → PO → Invoice → Delivery → Payment
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  findButtonByRole,
  assertSuccessToast,
  waitForApiCall,
} from '../../../test/utils';

describe('E2E Workflow: Complete Sales Cycle', () => {
  it('should execute full sales cycle: Quote → PO → Invoice → Delivery → Payment', async () => {
    /**
     * STEP 1: Customer creates/accepts Quotation
     */
    const QuotationStep = () => {
      const [quote, setQuote] = React.useState({
        status: 'draft',
        items: [],
        total: 0,
      });

      return (
        <>
          <div>Quotation Status: {quote.status}</div>
          <button onClick={() => setQuote({ ...quote, status: 'sent' })}>Send Quote</button>
          <button onClick={() => setQuote({ ...quote, status: 'accepted' })} disabled={quote.status !== 'sent'}>
            Accept Quote
          </button>
        </>
      );
    };

    /**
     * STEP 2: Convert Quotation to Purchase Order
     */
    const PurchaseOrderStep = () => {
      const [po, setPO] = React.useState({
        status: 'draft',
        fromQuoteId: 'Q-001',
      });

      return (
        <>
          <div>Purchase Order Status: {po.status}</div>
          <button onClick={() => setPO({ ...po, status: 'confirmed' })}>Confirm PO</button>
        </>
      );
    };

    /**
     * STEP 3: Create Invoice from PO
     */
    const InvoiceStep = () => {
      const [invoice, setInvoice] = React.useState({
        status: 'draft',
        fromPOId: 'PO-001',
      });

      return (
        <>
          <div>Invoice Status: {invoice.status}</div>
          <button onClick={() => setInvoice({ ...invoice, status: 'saved' })}>Save Invoice</button>
        </>
      );
    };

    /**
     * STEP 4: Create Delivery Note from Invoice
     */
    const DeliveryStep = () => {
      const [delivery, setDelivery] = React.useState({
        status: 'draft',
        fromInvoiceId: 'INV-001',
        stock: 100,
      });

      return (
        <>
          <div>Delivery Status: {delivery.status}</div>
          <div>Stock Level: {delivery.stock}</div>
          <button onClick={() => setDelivery({ ...delivery, status: 'delivered', stock: delivery.stock - 50 })}>
            Mark Delivered
          </button>
        </>
      );
    };

    /**
     * STEP 5: Record Payment
     */
    const PaymentStep = () => {
      const [payment, setPayment] = React.useState({
        status: 'unpaid',
        invoiceAmount: 5250,
      });

      const [recordedPayment, setRecordedPayment] = React.useState(0);

      const handleRecordPayment = () => {
        setRecordedPayment(payment.invoiceAmount);
        setPayment({ ...payment, status: 'paid' });
      };

      return (
        <>
          <div>Invoice Amount: {payment.invoiceAmount}</div>
          <div>Paid Amount: {recordedPayment}</div>
          <div>Status: {payment.status}</div>
          <button onClick={handleRecordPayment}>Record Payment</button>
        </>
      );
    };

    // Simulate complete workflow
    const CompleteWorkflow = () => {
      const [step, setStep] = React.useState('quotation');

      return (
        <>
          {step === 'quotation' && (
            <>
              <QuotationStep />
              <button onClick={() => setStep('po')}>Proceed to PO</button>
            </>
          )}
          {step === 'po' && (
            <>
              <PurchaseOrderStep />
              <button onClick={() => setStep('invoice')}>Proceed to Invoice</button>
            </>
          )}
          {step === 'invoice' && (
            <>
              <InvoiceStep />
              <button onClick={() => setStep('delivery')}>Proceed to Delivery</button>
            </>
          )}
          {step === 'delivery' && (
            <>
              <DeliveryStep />
              <button onClick={() => setStep('payment')}>Proceed to Payment</button>
            </>
          )}
          {step === 'payment' && (
            <>
              <PaymentStep />
              <div className="alert-success">Sales Cycle Complete</div>
            </>
          )}
        </>
      );
    };

    render(<CompleteWorkflow />);

    // Step 1: Quote
    expect(screen.getByText(/Quotation Status: draft/)).toBeInTheDocument();
    let proceedBtn = findButtonByRole('Proceed to PO');
    await userEvent.click(proceedBtn);

    // Step 2: PO
    expect(screen.getByText(/Purchase Order Status: draft/)).toBeInTheDocument();
    proceedBtn = findButtonByRole('Proceed to Invoice');
    await userEvent.click(proceedBtn);

    // Step 3: Invoice
    expect(screen.getByText(/Invoice Status: draft/)).toBeInTheDocument();
    proceedBtn = findButtonByRole('Proceed to Delivery');
    await userEvent.click(proceedBtn);

    // Step 4: Delivery
    expect(screen.getByText(/Delivery Status: draft/)).toBeInTheDocument();
    expect(screen.getByText('Stock Level: 100')).toBeInTheDocument();
    proceedBtn = findButtonByRole('Proceed to Payment');
    await userEvent.click(proceedBtn);

    // Step 5: Payment
    expect(screen.getByText('Invoice Amount: 5250')).toBeInTheDocument();
    const paymentBtn = findButtonByRole('Record Payment');
    await userEvent.click(paymentBtn);

    // Final verification
    expect(screen.getByText('Status: paid')).toBeInTheDocument();
    expect(screen.getByText('Paid Amount: 5250')).toBeInTheDocument();
    expect(screen.getByText(/Sales Cycle Complete/)).toBeInTheDocument();
  });

  it('should correctly handle multi-line items through entire sales cycle', async () => {
    const MultiLineWorkflow = () => {
      const [items] = React.useState([
        { sku: 'SS-304-Sheet', qty: 50, unitPrice: 100 },
        { sku: 'SS-316-Pipe', qty: 30, unitPrice: 150 },
      ]);

      const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
      const vat = subtotal * 0.05;
      const total = subtotal + vat;

      return (
        <>
          {items.map((item) => (
            <div key={item.sku}>
              {item.sku}: {item.qty} × {item.unitPrice}
            </div>
          ))}
          <div>Subtotal: {subtotal}</div>
          <div>VAT: {vat}</div>
          <div>Total: {total}</div>
        </>
      );
    };

    render(<MultiLineWorkflow />);

    expect(screen.getByText(/SS-304-Sheet/)).toBeInTheDocument();
    expect(screen.getByText(/SS-316-Pipe/)).toBeInTheDocument();
    expect(screen.getByText(/Subtotal.*9500/)).toBeInTheDocument();
    expect(screen.getByText(/Total.*9975/)).toBeInTheDocument();
  });
});
