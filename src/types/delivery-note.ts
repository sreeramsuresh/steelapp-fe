/**
 * Canonical DeliveryNote Type (camelCase only)
 * This is the NORMALIZED frontend schema after deliveryNoteNormalizer processes API data.
 * 
 * IMPORTANT: Backend/API uses snake_case. Frontend MUST use camelCase.
 * The deliveryNoteNormalizer converts snake_case → camelCase.
 */

/**
 * Main DeliveryNote interface - CAMELCASE ONLY
 * All fields that exist after deliveryNoteNormalizer processing
 */
export interface DeliveryNote {
  // Core identifiers
  id: number;
  deliveryNoteNumber: string;
  deliveryDate?: string;
  
  // Related documents
  invoiceId?: number;
  invoiceNumber?: string;
  purchaseOrderId?: number;
  
  // Customer & Delivery
  customerDetails?: object;
  deliveryAddress?: string;
  
  // Driver & Vehicle
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  
  // Items & Status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  status?: string;
  isPartial?: boolean;
  
  // Notes & Metadata
  notes?: string;
  hasNotes?: boolean;
  tooltip?: string;
  enabled?: boolean;
}

/**
 * Type guard to check if object is a valid DeliveryNote
 */
export function isDeliveryNote(obj: unknown): obj is DeliveryNote {
  if (!obj || typeof obj !== 'object') return false;
  const record = obj as Record<string, unknown>;
  return (
    typeof record.id === 'number' &&
    typeof record.deliveryNoteNumber === 'string'
  );
}
