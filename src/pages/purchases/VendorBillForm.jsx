/**
 * VendorBillForm.jsx - Unified Document Form Implementation
 *
 * Migrated to use the unified DocumentForm orchestrator component.
 * This provides consistent behavior across all document types.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { DocumentForm } from '../../components/documents/DocumentForm';
import { vendorBillConfig } from '../../config/documents';
import { vendorBillAdapter } from '../../services/documents/adapters/vendorBillAdapter';

export default function VendorBillForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <DocumentForm
      config={vendorBillConfig}
      adapter={vendorBillAdapter}
      documentId={id ? parseInt(id) : undefined}
      onSaveSuccess={() => navigate('/purchases/vendor-bills')}
      onCancel={() => navigate('/purchases/vendor-bills')}
    />
  );
}
