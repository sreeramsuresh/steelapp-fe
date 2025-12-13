/**
 * GRN (Goods Receipt Note) Service
 *
 * Handles goods receipt operations for the 3-way match workflow:
 * Purchase Order -> GRN -> Vendor Bill
 *
 * GRNs capture actual received quantities and weights at warehouse,
 * enabling variance detection and landed cost allocation.
 */

import { apiClient } from "./api";

/**
 * Transform GRN data for server submission
 */
const transformGRNForServer = (grnData) => {
  return {
    purchaseOrderId: grnData.purchaseOrderId || null,
    supplierId: grnData.supplierId || grnData.vendorId || null,
    warehouseId: grnData.warehouseId || null,
    receivedDate:
      grnData.receivedDate || new Date().toISOString().split("T")[0],
    receivedBy: grnData.receivedBy || "",
    deliveryNoteNumber: grnData.deliveryNoteNumber || "",
    vehicleNumber: grnData.vehicleNumber || "",
    notes: grnData.notes || "",
    // Import-specific fields
    importContainerId: grnData.importContainerId || null,
    blNumber: grnData.blNumber || "",
    containerNumber: grnData.containerNumber || "",
    // Items
    items: (grnData.items || []).map((item) => ({
      purchaseOrderLineId: item.purchaseOrderLineId || null,
      productId: item.productId || null,
      description: item.description || "",
      // Quantity tracking
      orderedQuantity: parseFloat(item.orderedQuantity || 0),
      receivedQuantity: parseFloat(item.receivedQuantity || item.quantity || 0),
      rejectedQuantity: parseFloat(item.rejectedQuantity || 0),
      acceptedQuantity: parseFloat(
        item.acceptedQuantity || item.receivedQuantity || 0,
      ),
      quantityUom: item.quantityUom || "PCS",
      // Weight tracking (critical for steel)
      poWeightKg: parseFloat(item.poWeightKg || 0),
      receivedWeightKg: parseFloat(item.receivedWeightKg || 0),
      weightVarianceKg: parseFloat(item.weightVarianceKg || 0),
      weightVariancePercent: parseFloat(item.weightVariancePercent || 0),
      // Pricing
      unitPrice: parseFloat(item.unitPrice || 0),
      pricingBasis: item.pricingBasis || "PER_MT",
      // Batch/lot tracking
      batchNumber: item.batchNumber || "",
      heatNumber: item.heatNumber || "",
      millCertNumber: item.millCertNumber || "",
      // Quality
      qualityStatus: item.qualityStatus || "pending",
      rejectionReason: item.rejectionReason || "",
      // Storage
      storageLocation: item.storageLocation || "",
    })),
  };
};

/**
 * Transform GRN data from server response
 */
const transformGRNFromServer = (serverData) => {
  if (!serverData) return null;

  return {
    id: serverData.id,
    grnNumber: serverData.grnNumber || serverData.grn_number || "",
    companyId: serverData.companyId || serverData.company_id,
    purchaseOrderId:
      serverData.purchaseOrderId || serverData.purchase_order_id || null,
    poNumber: serverData.poNumber || serverData.po_number || "",
    supplierId: serverData.supplierId || serverData.supplier_id || null,
    supplierName: serverData.supplierName || serverData.supplier_name || "",
    warehouseId: serverData.warehouseId || serverData.warehouse_id || null,
    warehouseName: serverData.warehouseName || serverData.warehouse_name || "",
    receivedDate: serverData.receivedDate || serverData.received_date || null,
    receivedBy: serverData.receivedBy || serverData.received_by || "",
    deliveryNoteNumber:
      serverData.deliveryNoteNumber || serverData.delivery_note_number || "",
    vehicleNumber: serverData.vehicleNumber || serverData.vehicle_number || "",
    notes: serverData.notes || "",
    status: serverData.status || "draft",
    // Import-specific
    importContainerId:
      serverData.importContainerId || serverData.import_container_id || null,
    containerNumber:
      serverData.containerNumber || serverData.container_number || "",
    blNumber: serverData.blNumber || serverData.bl_number || "",
    procurementChannel:
      serverData.procurementChannel ||
      serverData.procurement_channel ||
      "LOCAL",
    // Billing status
    isBilled: serverData.isBilled || serverData.is_billed || false,
    vendorBillId: serverData.vendorBillId || serverData.vendor_bill_id || null,
    vendorBillNumber:
      serverData.vendorBillNumber || serverData.vendor_bill_number || "",
    // Totals
    totalReceivedQuantity: parseFloat(
      serverData.totalReceivedQuantity ||
        serverData.total_received_quantity ||
        0,
    ),
    totalReceivedWeightKg: parseFloat(
      serverData.totalReceivedWeightKg ||
        serverData.total_received_weight_kg ||
        0,
    ),
    totalAmount: parseFloat(
      serverData.totalAmount || serverData.total_amount || 0,
    ),
    // Items
    items: (serverData.items || []).map((item) => ({
      id: item.id,
      grnId: item.grnId || item.grn_id,
      purchaseOrderLineId:
        item.purchaseOrderLineId || item.purchase_order_line_id || null,
      productId: item.productId || item.product_id || null,
      productName: item.productName || item.product_name || "",
      description: item.description || "",
      // Quantities
      orderedQuantity: parseFloat(
        item.orderedQuantity || item.ordered_quantity || 0,
      ),
      receivedQuantity: parseFloat(
        item.receivedQuantity || item.received_quantity || 0,
      ),
      rejectedQuantity: parseFloat(
        item.rejectedQuantity || item.rejected_quantity || 0,
      ),
      acceptedQuantity: parseFloat(
        item.acceptedQuantity || item.accepted_quantity || 0,
      ),
      quantityUom: item.quantityUom || item.quantity_uom || "PCS",
      // Weights
      poWeightKg: parseFloat(item.poWeightKg || item.po_weight_kg || 0),
      receivedWeightKg: parseFloat(
        item.receivedWeightKg || item.received_weight_kg || 0,
      ),
      weightVarianceKg: parseFloat(
        item.weightVarianceKg || item.weight_variance_kg || 0,
      ),
      weightVariancePercent: parseFloat(
        item.weightVariancePercent || item.weight_variance_percent || 0,
      ),
      // Pricing
      unitPrice: parseFloat(item.unitPrice || item.unit_price || 0),
      pricingBasis: item.pricingBasis || item.pricing_basis || "PER_MT",
      amount: parseFloat(item.amount || 0),
      // Batch
      batchNumber: item.batchNumber || item.batch_number || "",
      heatNumber: item.heatNumber || item.heat_number || "",
      millCertNumber: item.millCertNumber || item.mill_cert_number || "",
      // Quality
      qualityStatus: item.qualityStatus || item.quality_status || "pending",
      rejectionReason: item.rejectionReason || item.rejection_reason || "",
      storageLocation: item.storageLocation || item.storage_location || "",
    })),
    // Timestamps
    createdAt: serverData.createdAt || serverData.created_at || null,
    updatedAt: serverData.updatedAt || serverData.updated_at || null,
  };
};

const grnService = {
  /**
   * Get all GRNs with pagination and filters
   */
  async getAll(params = {}) {
    try {
      const queryParams = {
        page: params.page || 1,
        pageSize: params.pageSize || params.limit || 50,
        supplierId: params.supplierId || params.vendorId || undefined,
        purchaseOrderId: params.purchaseOrderId || undefined,
        warehouseId: params.warehouseId || undefined,
        status: params.status || undefined,
        isBilled: params.isBilled,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        search: params.search || undefined,
      };

      // Remove undefined params
      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key],
      );

      const response = await apiClient.get("/grns", queryParams);

      if (response.data && Array.isArray(response.data)) {
        return {
          data: response.data.map(transformGRNFromServer),
          pagination: response.pagination || null,
        };
      }

      if (Array.isArray(response)) {
        return {
          data: response.map(transformGRNFromServer),
          pagination: null,
        };
      }

      if (response.items && Array.isArray(response.items)) {
        return {
          data: response.items.map(transformGRNFromServer),
          pagination: response.pagination || null,
        };
      }

      return { data: [], pagination: null };
    } catch (error) {
      console.error("[GRNService] getAll failed:", error);
      throw error;
    }
  },

  /**
   * Get single GRN by ID
   */
  async getById(id) {
    try {
      const response = await apiClient.get(`/grns/${id}`);
      return transformGRNFromServer(response);
    } catch (error) {
      console.error("[GRNService] getById failed:", error);
      throw error;
    }
  },

  /**
   * Get GRNs for a specific Purchase Order
   */
  async getByPurchaseOrder(purchaseOrderId) {
    try {
      const response = await apiClient.get(`/grns/by-po/${purchaseOrderId}`);
      const grns = Array.isArray(response)
        ? response
        : response.data || response.items || [];
      return grns.map(transformGRNFromServer);
    } catch (error) {
      console.error("[GRNService] getByPurchaseOrder failed:", error);
      throw error;
    }
  },

  /**
   * Get unbilled GRNs (available for vendor bill matching)
   */
  async getUnbilled(params = {}) {
    try {
      const queryParams = {
        supplierId: params.supplierId || params.vendorId || undefined,
        page: params.page || 1,
        pageSize: params.pageSize || 50,
      };

      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key],
      );

      const response = await apiClient.get("/grns/unbilled", queryParams);
      const grns = response.data || response.items || response;
      return Array.isArray(grns) ? grns.map(transformGRNFromServer) : [];
    } catch (error) {
      console.error("[GRNService] getUnbilled failed:", error);
      throw error;
    }
  },

  /**
   * Create new GRN
   */
  async create(grnData) {
    try {
      const transformedData = transformGRNForServer(grnData);
      const response = await apiClient.post("/grns", transformedData);
      return transformGRNFromServer(response);
    } catch (error) {
      console.error("[GRNService] create failed:", error);
      throw error;
    }
  },

  /**
   * Update existing GRN
   */
  async update(id, grnData) {
    try {
      const transformedData = transformGRNForServer(grnData);
      const response = await apiClient.put(`/grns/${id}`, transformedData);
      return transformGRNFromServer(response);
    } catch (error) {
      console.error("[GRNService] update failed:", error);
      throw error;
    }
  },

  /**
   * Approve GRN (moves stock into inventory)
   */
  async approve(id, notes = "") {
    try {
      const response = await apiClient.post(`/grns/${id}/approve`, { notes });
      return transformGRNFromServer(response);
    } catch (error) {
      console.error("[GRNService] approve failed:", error);
      throw error;
    }
  },

  /**
   * Cancel GRN
   */
  async cancel(id, reason = "") {
    try {
      const response = await apiClient.post(`/grns/${id}/cancel`, { reason });
      return transformGRNFromServer(response);
    } catch (error) {
      console.error("[GRNService] cancel failed:", error);
      throw error;
    }
  },

  /**
   * Mark GRN as billed (linked to vendor bill)
   */
  async markBilled(id, vendorBillId) {
    try {
      const response = await apiClient.post(`/grns/${id}/mark-billed`, {
        vendorBillId,
      });
      return transformGRNFromServer(response);
    } catch (error) {
      console.error("[GRNService] markBilled failed:", error);
      throw error;
    }
  },

  /**
   * Get next GRN number
   */
  async getNextNumber() {
    try {
      const response = await apiClient.get("/grns/number/next");
      return response;
    } catch (error) {
      console.error("[GRNService] getNextNumber failed:", error);
      throw error;
    }
  },

  /**
   * Search GRNs
   */
  async search(searchTerm, filters = {}) {
    try {
      const response = await apiClient.get("/grns", {
        search: searchTerm,
        ...filters,
      });
      const grns = response.data || response.items || response;
      return Array.isArray(grns) ? grns.map(transformGRNFromServer) : [];
    } catch (error) {
      console.error("[GRNService] search failed:", error);
      throw error;
    }
  },
};

export { grnService };
export default grnService;
