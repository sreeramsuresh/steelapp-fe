/**
 * PurchaseOrderForm.jsx - Unified Document Form Implementation
 *
 * Migrated to use the unified DocumentForm orchestrator component.
 * This provides consistent behavior across all document types.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { DocumentForm } from '../components/documents/DocumentForm';
import { purchaseOrderConfig } from '../config/documents';
import { purchaseOrderAdapter } from '../services/documents/adapters/purchaseOrderAdapter';

export default function PurchaseOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <DocumentForm
      config={purchaseOrderConfig}
      adapter={purchaseOrderAdapter}
      documentId={id ? parseInt(id) : undefined}
      onSaveSuccess={() => navigate('/purchase-orders')}
      onCancel={() => navigate('/purchase-orders')}
    />
  );
}
