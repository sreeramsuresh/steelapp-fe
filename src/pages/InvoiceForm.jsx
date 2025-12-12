/**
 * InvoiceForm.jsx - Unified Document Form Implementation
 *
 * Migrated to use the unified DocumentForm orchestrator component.
 * This provides consistent behavior across all document types.
 *
 * Features:
 * - Standard invoice creation and editing
 * - Conversion from quotations (via ?from=quotation&sourceId=123)
 * - Stock allocation panel for inventory tracking
 * - Preview functionality
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DocumentForm } from '../components/documents/DocumentForm';
import { invoiceConfig } from '../config/documents';
import { invoiceAdapter } from '../services/documents/adapters/invoiceAdapter';
import { quotationsAPI } from '../services/api';

export default function InvoiceForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Handle convert from quotation
  const sourceType = searchParams.get('from');
  const sourceId = searchParams.get('sourceId');
  const [initialData, setInitialData] = useState(null);
  const [isLoadingSource, setIsLoadingSource] = useState(false);

  useEffect(() => {
    if (sourceType === 'quotation' && sourceId) {
      loadQuotationAsInvoice(sourceId);
    }
  }, [sourceType, sourceId]);

  const loadQuotationAsInvoice = async (quotationId) => {
    try {
      setIsLoadingSource(true);

      // Fetch the quotation
      const response = await quotationsAPI.getById(quotationId);
      const quotation = response.data;

      // Transform quotation data to invoice format
      const invoiceData = {
        // Map customer details
        customerId: quotation.customerId,
        customerName: quotation.customerName,
        customerEmail: quotation.customerEmail,
        customerPhone: quotation.customerPhone,
        customerAddress: quotation.customerAddress,

        // Map document details
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 30 days from now

        // Map items
        items: quotation.items?.map(item => ({
          ...item,
          itemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          taxRate: item.taxRate || 5,
          amount: item.amount,
        })) || [],

        // Map financial details
        subtotal: quotation.subtotal || 0,
        discount: quotation.discount || 0,
        taxAmount: quotation.taxAmount || 0,
        total: quotation.total || 0,

        // Add reference to source quotation
        notes: quotation.notes
          ? `${quotation.notes}\n\nConverted from Quotation #${quotation.quotationNumber}`
          : `Converted from Quotation #${quotation.quotationNumber}`,

        // Copy any other relevant fields
        paymentTerms: quotation.paymentTerms,
        deliveryTerms: quotation.deliveryTerms,
      };

      setInitialData(invoiceData);
    } catch (error) {
      console.error('Error loading quotation:', error);
      // Still allow the form to load, just without pre-filled data
      setInitialData(null);
    } finally {
      setIsLoadingSource(false);
    }
  };

  // Show loading state while fetching source document
  if (isLoadingSource) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quotation data...</p>
        </div>
      </div>
    );
  }

  return (
    <DocumentForm
      config={invoiceConfig}
      adapter={invoiceAdapter}
      documentId={id ? parseInt(id) : undefined}
      initialData={initialData}
      onSaveSuccess={() => navigate('/invoices')}
      onCancel={() => navigate('/invoices')}
    />
  );
}
