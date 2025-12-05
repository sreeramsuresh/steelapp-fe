/**
 * QCInspectionModal - Quality Control inspection form
 * 
 * Allows entering QC results for each item in a credit note.
 * Submits to backend which handles inventory restock and scrap creation.
 */

import { useState, useEffect } from 'react';
import { X, ClipboardCheck, Package, AlertTriangle, Loader2 } from 'lucide-react';
import { creditNoteService } from '../../services/creditNoteService';
import { notificationService } from '../../services/notificationService';

const QC_RESULTS = [
  { value: 'GOOD', label: 'Good - All items can be restocked', color: 'text-green-600' },
  { value: 'BAD', label: 'Bad - All items defective/damaged', color: 'text-red-600' },
  { value: 'PARTIAL', label: 'Partial - Some good, some bad', color: 'text-yellow-600' },
];

const SCRAP_REASON_CATEGORIES = [
  { value: 'MANUFACTURING_DEFECT', label: 'Manufacturing Defect' },
  { value: 'SHIPPING_DAMAGE', label: 'Shipping Damage' },
  { value: 'CUSTOMER_DAMAGE', label: 'Customer Damage' },
  { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'OTHER', label: 'Other' },
];

const QCInspectionModal = ({ isOpen, onClose, creditNote, onSuccess }) => {
  const [qcResult, setQcResult] = useState('GOOD');
  const [qcNotes, setQcNotes] = useState('');
  const [itemResults, setItemResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (creditNote?.items) {
      setItemResults(
        creditNote.items.map((item) => ({
          id: item.id,
          creditNoteItemId: item.id,
          productName: item.productName || item.product_name || '',
          quantityReturned: item.quantityReturned || item.quantity_returned || 0,
          restockedQuantity: item.quantityReturned || item.quantity_returned || 0,
          damagedQuantity: 0,
          defectiveQuantity: 0,
          inspectionNotes: '',
          warehouseId: item.warehouseId || item.warehouse_id || 0,
          scrapReasonCategory: 'OTHER',
          scrapReason: '',
        })),
      );
    }
  }, [creditNote]);

  const handleItemChange = (index, field, value) => {
    setItemResults((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Auto-adjust quantities
      const item = updated[index];
      const total = item.quantityReturned;
      if (field === 'restockedQuantity') {
        const remaining = total - parseFloat(value || 0);
        updated[index].damagedQuantity = Math.max(0, remaining);
        updated[index].defectiveQuantity = 0;
      }
      
      return updated;
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      const result = await creditNoteService.markItemsInspected(creditNote.id, {
        qcResult,
        qcNotes,
        itemResults: itemResults.map((item) => ({
          creditNoteItemId: item.creditNoteItemId,
          restockedQuantity: parseFloat(item.restockedQuantity) || 0,
          damagedQuantity: parseFloat(item.damagedQuantity) || 0,
          defectiveQuantity: parseFloat(item.defectiveQuantity) || 0,
          inspectionNotes: item.inspectionNotes,
          warehouseId: item.warehouseId,
          scrapReasonCategory: item.scrapReasonCategory,
          scrapReason: item.scrapReason,
        })),
      });

      notificationService.success('Items inspected successfully');
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (error) {
      console.error('Failed to submit inspection:', error);
      notificationService.error(error.message || 'Failed to submit inspection');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold dark:text-white">QC Inspection</h2>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Overall QC Result */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Overall QC Result
              </label>
              <div className="flex gap-4">
                {QC_RESULTS.map((result) => (
                  <label key={result.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="qcResult"
                      value={result.value}
                      checked={qcResult === result.value}
                      onChange={(e) => setQcResult(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className={`text-sm ${result.color}`}>{result.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* QC Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                QC Notes
              </label>
              <textarea
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="General inspection notes..."
              />
            </div>

            {/* Item Results */}
            <div className="space-y-4">
              <h3 className="font-medium dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4" />
                Item Inspection
              </h3>
              
              {itemResults.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg dark:border-gray-700">
                  <div className="font-medium mb-3 dark:text-white">{item.productName}</div>
                  <div className="text-sm text-gray-500 mb-3">
                    Returned Qty: {item.quantityReturned}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Restock Qty</label>
                      <input
                        type="number"
                        min="0"
                        max={item.quantityReturned}
                        value={item.restockedQuantity}
                        onChange={(e) => handleItemChange(index, 'restockedQuantity', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Damaged Qty</label>
                      <input
                        type="number"
                        min="0"
                        value={item.damagedQuantity}
                        onChange={(e) => handleItemChange(index, 'damagedQuantity', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Defective Qty</label>
                      <input
                        type="number"
                        min="0"
                        value={item.defectiveQuantity}
                        onChange={(e) => handleItemChange(index, 'defectiveQuantity', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  {(parseFloat(item.damagedQuantity) > 0 || parseFloat(item.defectiveQuantity) > 0) && (
                    <div className="grid grid-cols-2 gap-4 mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Scrap Reason Category</label>
                        <select
                          value={item.scrapReasonCategory}
                          onChange={(e) => handleItemChange(index, 'scrapReasonCategory', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {SCRAP_REASON_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Scrap Reason</label>
                        <input
                          type="text"
                          value={item.scrapReason}
                          onChange={(e) => handleItemChange(index, 'scrapReason', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Details..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Complete Inspection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QCInspectionModal;
