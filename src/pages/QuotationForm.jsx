/**
 * QuotationForm.jsx - Unified Document Form Implementation
 *
 * Migrated to use the unified DocumentForm orchestrator component.
 * This provides consistent behavior across all document types.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { DocumentForm } from '../components/documents/DocumentForm';
import { quotationConfig } from '../config/documents';
import { quotationAdapter } from '../services/documents/adapters/quotationAdapter';

export default function QuotationForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <DocumentForm
      config={quotationConfig}
      adapter={quotationAdapter}
      documentId={id ? parseInt(id) : undefined}
      onSaveSuccess={() => navigate('/quotations')}
      onCancel={() => navigate('/quotations')}
    />
  );
}
