import { apiClient } from "./api.js";
import { apiService } from "./axiosApi.js"; // Only for downloadPDF

/**
 * Transform delivery note data from server (snake_case) to frontend (camelCase)
 */
export const transformDeliveryNoteFromServer = (serverData) => {
  if (!serverData) return null;

  return {
    id: serverData.id,
    companyId: serverData.companyId || serverData.company_id,
    deliveryNoteNumber: serverData.deliveryNoteNumber || serverData.delivery_note_number || "",
    invoiceId: serverData.invoiceId || serverData.invoice_id,
    invoiceNumber: serverData.invoiceNumber || serverData.invoice_number || "",
    purchaseOrderId: serverData.purchaseOrderId || serverData.purchase_order_id,
    customerId: serverData.customerId || serverData.customer_id,
    customerDetails: serverData.customerDetails || serverData.customer_details || "",
    deliveryDate: serverData.deliveryDate || serverData.delivery_date,
    deliveryAddress: serverData.deliveryAddress || serverData.delivery_address || "",
    driverName: serverData.driverName || serverData.driver_name || "",
    driverPhone: serverData.driverPhone || serverData.driver_phone || "",
    vehicleNumber: serverData.vehicleNumber || serverData.vehicle_number || "",
    status: serverData.status || "PENDING",
    isPartial: serverData.isPartial || serverData.is_partial || false,
    notes: serverData.notes || "",
    items: (serverData.items || []).map((item) => ({
      id: item.id,
      invoiceItemId: item.invoiceItemId || item.invoice_item_id,
      productId: item.productId || item.product_id,
      name: item.name || "",
      specification: item.specification || "",
      hsnCode: item.hsnCode || item.hsn_code || "",
      unit: item.unit || "",
      orderedQuantity: parseFloat(item.orderedQuantity || item.ordered_quantity) || 0,
      deliveredQuantity: parseFloat(item.deliveredQuantity || item.delivered_quantity) || 0,
      remainingQuantity: parseFloat(item.remainingQuantity || item.remaining_quantity) || 0,
      isFullyDelivered: item.isFullyDelivered || item.is_fully_delivered || false,
      batchRows: (item.batchRows || []).map((br) => ({
        batchId: br.batchId || br.batch_id,
        batchNumber: br.batchNumber || br.batch_number || "",
        quantity: parseFloat(br.quantity || 0),
        unit: br.unit || "",
        unitCost: parseFloat(br.unitCost || br.unit_cost || 0),
        warehouseName: br.warehouseName || br.warehouse_name || "",
        locationLabel: br.locationLabel || br.location_label || "",
      })),
    })),
    // Stock workflow
    stockDeducted: serverData.stockDeducted || serverData.stock_deducted || false,
    stockDeductedAt: serverData.stockDeductedAt || serverData.stock_deducted_at,
    stockDeductedBy: serverData.stockDeductedBy || serverData.stock_deducted_by,
    // GRN fields
    goodsReceiptDate: serverData.goodsReceiptDate || serverData.goods_receipt_date || "",
    inspectionDate: serverData.inspectionDate || serverData.inspection_date || "",
    // Audit
    createdAt: serverData.createdAt || serverData.created_at,
    updatedAt: serverData.updatedAt || serverData.updated_at,
  };
};

export const deliveryNoteService = {
  // Get all delivery notes with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get("/delivery-notes", params);
  },

  // Get delivery note by ID
  getById: (id) => {
    return apiClient.get(`/delivery-notes/${id}`);
  },

  // Create delivery note from invoice
  create: (deliveryNoteData) => {
    return apiClient.post("/delivery-notes", deliveryNoteData);
  },

  // Update delivery note (full update)
  update: (id, deliveryNoteData) => {
    return apiClient.put(`/delivery-notes/${id}`, deliveryNoteData);
  },

  // Update delivery quantities (partial delivery)
  updateDelivery: (deliveryNoteId, itemId, deliveryData) => {
    return apiClient.patch(`/delivery-notes/${deliveryNoteId}/items/${itemId}/deliver`, deliveryData);
  },

  // Update delivery note status
  updateStatus: (id, status, notes = "") => {
    return apiClient.patch(`/delivery-notes/${id}/status`, { status, notes });
  },

  // Delete delivery note
  delete: (id) => {
    return apiClient.delete(`/delivery-notes/${id}`);
  },

  // Get next delivery note number
  getNextNumber: () => {
    return apiClient.get("/delivery-notes/number/next");
  },

  // Get previously used vehicle numbers (for autocomplete)
  getVehicleSuggestions: (q = "") => {
    return apiClient.get("/delivery-notes/suggestions/vehicles", { q });
  },

  // Get previously used driver names (for autocomplete)
  getDriverSuggestions: (q = "") => {
    return apiClient.get("/delivery-notes/suggestions/drivers", { q });
  },

  // Generate and download PDF
  downloadPDF: async (id) => {
    // Use axios-based service to leverage interceptors and auth headers
    const blob = await apiService.request({
      method: "GET",
      url: `/delivery-notes/${id}/pdf`,
      responseType: "blob",
    });
    const downloadUrl = window.URL.createObjectURL(blob);

    // Get delivery note number for filename
    const deliveryNote = await deliveryNoteService.getById(id);
    const filename = `DN-${deliveryNote.deliveryNoteNumber || deliveryNote.delivery_note_number || id}.pdf`;

    // Create download link
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
  },

  downloadLoadingSlip: async (id) => {
    const blob = await apiService.request({
      method: "GET",
      url: `/delivery-notes/${id}/pdf?type=internal`,
      responseType: "blob",
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const deliveryNote = await deliveryNoteService.getById(id);
    const dnNum = deliveryNote.deliveryNoteNumber || deliveryNote.delivery_note_number || id;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `PICK-${dnNum}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};
