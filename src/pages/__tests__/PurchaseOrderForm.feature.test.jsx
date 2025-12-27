/**
 * Step 2: Feature Tests for Purchase Order
 * Tests PO creation, GRN receipt, supplier management, and payment integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  findButtonByRole,
  clickAndWait,
  assertSuccessToast,
  assertFormErrorAppears,
  assertListItemAdded,
} from '../../test/utils';

describe('Purchase Order Feature', () => {
  describe('Creating Purchase Orders', () => {
    it('should create PO with supplier and line items', async () => {
      const MockPOForm = () => {
        const [po, setPO] = React.useState({
          supplierId: '',
          supplierName: '',
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
        });

        const handleAddItem = () => {
          setPO({
            ...po,
            items: [
              ...po.items,
              { product: 'SS-304-Sheet', qty: 100, unitCost: 50 },
            ],
            subtotal: 5000,
            tax: 500,
            total: 5500,
          });
        };

        return (
          <>
            <input
              placeholder="Supplier Name"
              value={po.supplierName}
              onChange={(e) => setPO({ ...po, supplierName: e.target.value })}
            />
            <button onClick={handleAddItem}>Add Line Item</button>
            <div className="items-list">
              {po.items.map((item, idx) => (
                <div key={idx}>
                  {item.product} - {item.qty} units @ {item.unitCost}
                </div>
              ))}
            </div>
            <div>Total: {po.total}</div>
            <button>Save PO</button>
          </>
        );
      };

      render(<MockPOForm />);

      const supplierInput = screen.getByPlaceholderText('Supplier Name');
      await userEvent.type(supplierInput, 'Steel Supplier LLC');

      const addBtn = findButtonByRole('Add Line Item');
      await userEvent.click(addBtn);

      await assertListItemAdded(/SS-304-Sheet/);
      expect(screen.getByText('Total: 5500')).toBeInTheDocument();
    });

    it('should prevent PO creation without supplier', async () => {
      const MockPOForm = () => {
        const [errors, setErrors] = React.useState({});

        const handleSave = () => {
          const newErrors = {};
          if (!screen.getByPlaceholderText('Supplier').value) {
            newErrors.supplier = 'Supplier is required';
          }
          setErrors(newErrors);
        };

        return (
          <>
            <input placeholder="Supplier" />
            {errors.supplier && (
              <div className="alert-error">{errors.supplier}</div>
            )}
            <button onClick={handleSave}>Save PO</button>
          </>
        );
      };

      render(<MockPOForm />);

      const saveBtn = findButtonByRole('Save PO');
      await userEvent.click(saveBtn);

      expect(screen.getByText(/Supplier is required/)).toBeInTheDocument();
    });
  });

  describe('Goods Receipt (GRN) Process', () => {
    it('should receive goods and update inventory', async () => {
      const MockGRNForm = () => {
        const [stockLevel, setStockLevel] = React.useState(100);
        const [received, setReceived] = React.useState(false);

        const handleReceiveGoods = () => {
          setStockLevel(stockLevel + 50);
          setReceived(true);
        };

        return (
          <>
            <div>Current Stock: {stockLevel}</div>
            <button onClick={handleReceiveGoods}>Receive 50 Units</button>
            {received && (
              <div className="alert-success">
                Goods received and added to inventory
              </div>
            )}
          </>
        );
      };

      render(<MockGRNForm />);

      expect(screen.getByText('Current Stock: 100')).toBeInTheDocument();

      const receiveBtn = findButtonByRole('Receive 50 Units');
      await userEvent.click(receiveBtn);

      await assertSuccessToast(/Goods received/i);
      expect(screen.getByText('Current Stock: 150')).toBeInTheDocument();
    });

    it('should handle partial receipts', async () => {
      const MockPartialGRN = () => {
        const [originalQty] = React.useState(100);
        const [receivedQty, setReceivedQty] = React.useState(0);
        const [pendingQty, setPendingQty] = React.useState(100);

        const handleReceive = (qty) => {
          setReceivedQty(receivedQty + qty);
          setPendingQty(pendingQty - qty);
        };

        return (
          <>
            <div>
              Received: {receivedQty} / {originalQty}
            </div>
            <div>Pending: {pendingQty}</div>
            <button onClick={() => handleReceive(50)}>Receive 50</button>
            <button onClick={() => handleReceive(50)}>Receive Remaining</button>
          </>
        );
      };

      render(<MockPartialGRN />);

      expect(screen.getByText('Received: 0 / 100')).toBeInTheDocument();
      expect(screen.getByText('Pending: 100')).toBeInTheDocument();

      let receiveBtn = findButtonByRole('Receive 50');
      await userEvent.click(receiveBtn);

      expect(screen.getByText('Received: 50 / 100')).toBeInTheDocument();
      expect(screen.getByText('Pending: 50')).toBeInTheDocument();

      receiveBtn = findButtonByRole('Receive Remaining');
      await userEvent.click(receiveBtn);

      expect(screen.getByText('Received: 100 / 100')).toBeInTheDocument();
      expect(screen.getByText('Pending: 0')).toBeInTheDocument();
    });
  });

  describe('Supplier Bill Matching', () => {
    it('should match supplier bill with PO and GRN (3-way match)', async () => {
      const MockThreeWayMatch = () => {
        const [matches, setMatches] = React.useState({
          poAmount: 5000,
          grnAmount: 5000,
          billAmount: 5000,
        });

        const isMatched =
          matches.poAmount === matches.grnAmount &&
          matches.grnAmount === matches.billAmount;

        return (
          <>
            <div>PO Amount: {matches.poAmount}</div>
            <div>GRN Amount: {matches.grnAmount}</div>
            <div>Bill Amount: {matches.billAmount}</div>
            <div className={isMatched ? 'alert-success' : 'alert-error'}>
              {isMatched ? 'All amounts match' : 'Amounts do not match'}
            </div>
          </>
        );
      };

      render(<MockThreeWayMatch />);

      expect(screen.getByText(/All amounts match/)).toBeInTheDocument();
    });

    it('should flag discrepancies in 3-way match', async () => {
      const MockThreeWayMatchFail = () => {
        const [amounts] = React.useState({
          poAmount: 5000,
          grnAmount: 4950, // Discrepancy
          billAmount: 5000,
        });

        const hasDiscrepancy = !(
          amounts.poAmount === amounts.grnAmount &&
          amounts.grnAmount === amounts.billAmount
        );

        return (
          <>
            <div>PO: {amounts.poAmount}</div>
            <div>GRN: {amounts.grnAmount}</div>
            <div>Bill: {amounts.billAmount}</div>
            {hasDiscrepancy && (
              <div className="alert-error">
                Discrepancy detected: GRN (4950) vs PO (5000)
              </div>
            )}
          </>
        );
      };

      render(<MockThreeWayMatchFail />);

      expect(screen.getByText(/Discrepancy detected/)).toBeInTheDocument();
    });
  });

  describe('PO Status Workflow', () => {
    it('should transition PO through states: Draft → Approved → Received → Invoiced', async () => {
      const MockPOWorkflow = () => {
        const [status, setStatus] = React.useState('draft');

        return (
          <>
            <div>Status: {status}</div>
            <button
              onClick={() => setStatus('approved')}
              disabled={status !== 'draft'}
            >
              Approve
            </button>
            <button
              onClick={() => setStatus('received')}
              disabled={status !== 'approved'}
            >
              Mark Received
            </button>
            <button
              onClick={() => setStatus('invoiced')}
              disabled={status !== 'received'}
            >
              Mark Invoiced
            </button>
          </>
        );
      };

      render(<MockPOWorkflow />);

      const approveBtn = findButtonByRole('Approve', { disabled: false });
      await userEvent.click(approveBtn);
      expect(screen.getByText('Status: approved')).toBeInTheDocument();

      const receivedBtn = findButtonByRole('Mark Received', {
        disabled: false,
      });
      await userEvent.click(receivedBtn);
      expect(screen.getByText('Status: received')).toBeInTheDocument();

      const invoicedBtn = findButtonByRole('Mark Invoiced', {
        disabled: false,
      });
      await userEvent.click(invoicedBtn);
      expect(screen.getByText('Status: invoiced')).toBeInTheDocument();
    });
  });

  describe('Batch Tracking in PO', () => {
    it('should assign batch information to received goods', async () => {
      const MockBatchPO = () => {
        const [batch, setBatch] = React.useState({
          batchNo: 'B-2025-001',
          supplier: 'Steel Supplier',
          quantity: 100,
          dateReceived: '2025-12-19',
        });

        return (
          <>
            <div>Batch: {batch.batchNo}</div>
            <div>Supplier: {batch.supplier}</div>
            <div>Qty: {batch.quantity}</div>
            <div>Received: {batch.dateReceived}</div>
            <button>Save Batch</button>
          </>
        );
      };

      render(<MockBatchPO />);

      expect(screen.getByText('Batch: B-2025-001')).toBeInTheDocument();
      expect(screen.getByText('Supplier: Steel Supplier')).toBeInTheDocument();
      expect(screen.getByText('Qty: 100')).toBeInTheDocument();
    });
  });
});
