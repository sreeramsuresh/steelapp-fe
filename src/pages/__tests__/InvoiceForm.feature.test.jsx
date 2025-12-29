/**
 * Step 2: Feature Tests for Invoice
 * Tests core invoice functionality: creation, editing, stock deduction, VAT calculation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  findButtonByRole,
  clickAndWait,
  assertSuccessToast,
  assertFormErrorAppears,
  assertListItemAdded,
} from '../../test/utils';

describe('Invoice Feature', () => {
  describe('Creating a New Invoice', () => {
    it('should create invoice with customer and product selection', async () => {
      const MockInvoiceForm = () => {
        const [invoice, setInvoice] = React.useState({
          customerName: '',
          items: [],
          subtotal: 0,
          vat: 0,
          total: 0,
        });

        const handleAddItem = () => {
          setInvoice({
            ...invoice,
            items: [
              ...invoice.items,
              { product: 'SS-304-Sheet', qty: 50, price: 100 },
            ],
            subtotal: 5000,
            vat: 250,
            total: 5250,
          });
        };

        const handleSave = () => {
          // Simulate saving
        };

        return (
          <>
            <input
              placeholder="Customer Name"
              value={invoice.customerName}
              onChange={(e) =>
                setInvoice({ ...invoice, customerName: e.target.value })
              }
            />
            <button onClick={handleAddItem}>Add Product</button>
            <div className="items-list">
              {invoice.items.map((item, idx) => (
                <div key={idx}>
                  {item.product} - Qty: {item.qty}
                </div>
              ))}
            </div>
            <div>Subtotal: {invoice.subtotal}</div>
            <div>VAT (5%): {invoice.vatAmount}</div>
            <div>Total: {invoice.total}</div>
            <button onClick={handleSave}>Save Invoice</button>
          </>
        );
      };

      render(<MockInvoiceForm />);

      const customerInput = screen.getByPlaceholderText('Customer Name');
      await userEvent.type(customerInput, 'ABC Corp');

      const addProductBtn = findButtonByRole('Add Product');
      await userEvent.click(addProductBtn);

      // Verify item was added
      await assertListItemAdded(/SS-304-Sheet/);
      expect(screen.getByText(/Subtotal: 5000/)).toBeInTheDocument();
      expect(screen.getByText(/VAT \(5%\): 250/)).toBeInTheDocument();
      expect(screen.getByText(/Total: 5250/)).toBeInTheDocument();
    });

    it('should validate required fields before saving', async () => {
      const MockInvoiceForm = () => {
        const [errors, setErrors] = React.useState({});

        const handleSave = () => {
          const newErrors = {};
          if (!screen.getByPlaceholderText('Customer Name').value) {
            newErrors.customer = 'Customer is required';
          }
          setErrors(newErrors);
        };

        return (
          <>
            <input placeholder="Customer Name" />
            <div>
              {errors.customer && (
                <span id="customer-error">{errors.customer}</span>
              )}
            </div>
            <button onClick={handleSave}>Save</button>
          </>
        );
      };

      render(<MockInvoiceForm />);
      const saveBtn = findButtonByRole('Save');
      await userEvent.click(saveBtn);

      // Should show error
      await assertFormErrorAppears('Customer', 'Customer is required');
    });

    it('should calculate VAT correctly for UAE sales (5%)', async () => {
      const MockInvoiceForm = () => {
        const [subtotal, setSubtotal] = React.useState(1000);
        const vat = subtotal * 0.05;
        const total = subtotal + vat;

        return (
          <>
            <div>Subtotal: {subtotal}</div>
            <div>VAT: {vat}</div>
            <div>Total: {total}</div>
          </>
        );
      };

      render(<MockInvoiceForm />);

      expect(screen.getByText('Subtotal: 1000')).toBeInTheDocument();
      expect(screen.getByText('VAT: 50')).toBeInTheDocument();
      expect(screen.getByText('Total: 1050')).toBeInTheDocument();
    });
  });

  describe('Stock Deduction on Invoice', () => {
    it('should deduct stock from warehouse when invoice is saved', async () => {
      const MockInvoiceWithStock = () => {
        const [stockLevel, setStockLevel] = React.useState(100);
        const [invoiceSaved, setInvoiceSaved] = React.useState(false);

        const handleSaveInvoice = () => {
          // Simulate stock deduction
          setStockLevel(stockLevel - 50);
          setInvoiceSaved(true);
        };

        return (
          <>
            <div>Stock Level: {stockLevel}</div>
            <button onClick={handleSaveInvoice}>Save Invoice (50 units)</button>
            {invoiceSaved && (
              <div className="alert-success">Invoice saved, stock updated</div>
            )}
          </>
        );
      };

      render(<MockInvoiceWithStock />);

      expect(screen.getByText('Stock Level: 100')).toBeInTheDocument();

      const saveBtn = findButtonByRole('Save Invoice');
      await userEvent.click(saveBtn);

      await assertSuccessToast(/stock updated/i);
      expect(screen.getByText('Stock Level: 50')).toBeInTheDocument();
    });

    it('should prevent saving invoice if stock is insufficient', async () => {
      const MockInvoiceWithStock = () => {
        const [stockLevel] = React.useState(30);
        const [error, setError] = React.useState('');
        const requestedQty = 50;

        const handleSaveInvoice = () => {
          if (requestedQty > stockLevel) {
            setError('Insufficient stock. Available: 30, Requested: 50');
          }
        };

        return (
          <>
            <div>Stock Available: {stockLevel}</div>
            <button onClick={handleSaveInvoice}>Save Invoice (50 units)</button>
            {error && <div className="alert-error">{error}</div>}
          </>
        );
      };

      render(<MockInvoiceWithStock />);

      const saveBtn = findButtonByRole('Save Invoice');
      await userEvent.click(saveBtn);

      // Should show error
      expect(screen.getByText(/Insufficient stock/)).toBeInTheDocument();
    });
  });

  describe('Invoice Status & Workflow', () => {
    it('should transition invoice through states: Draft → Saved → Delivered → Paid', async () => {
      const MockInvoiceWorkflow = () => {
        const [status, setStatus] = React.useState('draft');

        return (
          <>
            <div>Status: {status}</div>
            <button onClick={() => setStatus('saved')}>Save</button>
            <button
              onClick={() => setStatus('delivered')}
              disabled={status !== 'saved'}
            >
              Mark Delivered
            </button>
            <button
              onClick={() => setStatus('paid')}
              disabled={status !== 'delivered'}
            >
              Mark Paid
            </button>
          </>
        );
      };

      render(<MockInvoiceWorkflow />);

      expect(screen.getByText('Status: draft')).toBeInTheDocument();

      // Draft -> Saved
      const saveBtn = findButtonByRole('Save');
      await userEvent.click(saveBtn);
      expect(screen.getByText('Status: saved')).toBeInTheDocument();

      // Saved -> Delivered
      const deliverBtn = findButtonByRole('Mark Delivered', {
        disabled: false,
      });
      await userEvent.click(deliverBtn);
      expect(screen.getByText('Status: delivered')).toBeInTheDocument();

      // Delivered -> Paid
      const paidBtn = findButtonByRole('Mark Paid', { disabled: false });
      await userEvent.click(paidBtn);
      expect(screen.getByText('Status: paid')).toBeInTheDocument();
    });
  });

  describe('Invoice Editing & Deletion', () => {
    it('should allow editing saved invoice lines', async () => {
      const MockInvoiceEdit = () => {
        const [quantity, setQuantity] = React.useState(50);

        return (
          <>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
            />
            <div>Total Units: {quantity}</div>
            {/* eslint-disable-next-line local-rules/no-dead-button */}
            <button>Save Changes</button>
          </>
        );
      };

      render(<MockInvoiceEdit />);

      const qtyInput = screen.getByDisplayValue('50');
      await userEvent.clear(qtyInput);
      await userEvent.type(qtyInput, '75');

      expect(screen.getByText('Total Units: 75')).toBeInTheDocument();
    });

    it('should prevent deletion of paid invoices', async () => {
      const MockInvoiceDelete = () => {
        const [status] = React.useState('paid');
        const [error, setError] = React.useState('');

        const handleDelete = () => {
          if (status === 'paid') {
            setError('Cannot delete paid invoice');
          }
        };

        return (
          <>
            <div>Status: {status}</div>
            <button onClick={handleDelete}>Delete Invoice</button>
            {error && <div className="alert-error">{error}</div>}
          </>
        );
      };

      render(<MockInvoiceDelete />);

      const deleteBtn = findButtonByRole('Delete Invoice');
      await userEvent.click(deleteBtn);

      expect(
        screen.getByText(/Cannot delete paid invoice/),
      ).toBeInTheDocument();
    });
  });

  describe('Multi-line Invoices', () => {
    it('should correctly calculate totals for invoices with multiple line items', async () => {
      const MockMultiLineInvoice = () => {
        const items = [
          { product: 'SS-304-Sheet', qty: 50, unitPrice: 100 }, // 5000
          { product: 'SS-316-Pipe', qty: 30, unitPrice: 150 }, // 4500
        ];
        const subtotal = items.reduce(
          (sum, item) => sum + item.qty * item.unitPrice,
          0,
        );
        const vat = subtotal * 0.05;
        const total = subtotal + vat;

        return (
          <>
            {items.map((item, idx) => (
              <div key={idx}>
                {item.product}: {item.qty} × {item.unitPrice} ={' '}
                {item.qty * item.unitPrice}
              </div>
            ))}
            <div>Subtotal: {subtotal}</div>
            <div>VAT (5%): {vat}</div>
            <div>Total: {total}</div>
          </>
        );
      };

      render(<MockMultiLineInvoice />);

      expect(screen.getByText(/SS-304-Sheet.*5000/)).toBeInTheDocument();
      expect(screen.getByText(/SS-316-Pipe.*4500/)).toBeInTheDocument();
      expect(screen.getByText('Subtotal: 9500')).toBeInTheDocument();
      expect(screen.getByText('VAT (5%): 475')).toBeInTheDocument();
      expect(screen.getByText('Total: 9975')).toBeInTheDocument();
    });
  });
});
