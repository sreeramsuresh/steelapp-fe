import { apiClient } from "./api.js";

/**
 * Transform product data from server (snake_case) to frontend (camelCase)
 * API Gateway handles auto-conversion, but this ensures explicit mapping
 */
export const transformProductFromServer = (serverData) => {
  if (!serverData) return null;

  return {
    id: serverData.id,
    companyId: serverData.companyId || serverData.company_id,
    name: serverData.name || serverData.displayName || serverData.display_name || "",
    sku: serverData.sku || "",
    category: serverData.category || "",
    commodity: serverData.commodity || "",
    grade: serverData.grade || "",
    finish: serverData.finish || "",
    form: serverData.form || "",
    size: serverData.size || "",
    thickness: serverData.thickness || "",
    unit: serverData.unit || "KG",
    costPrice: parseFloat(serverData.costPrice || serverData.cost_price) || 0,
    sellingPrice: parseFloat(serverData.sellingPrice || serverData.selling_price) || 0,
    quantityInStock: parseFloat(serverData.quantityInStock || serverData.quantity_in_stock) || 0,
    reorderLevel: parseFloat(serverData.reorderLevel || serverData.reorder_level) || 0,
    status: serverData.status || "ACTIVE",
    notes: serverData.notes || "",
    // Additional fields
    maxStock: parseFloat(serverData.maxStock || serverData.max_stock) || 0,
    minStock: parseFloat(serverData.minStock || serverData.min_stock) || 0,
    description: serverData.description || "",
    supplier: serverData.supplier || "",
    location: serverData.location || "",
    weight: serverData.weight || "",
    width: serverData.width || "",
    specifications: serverData.specifications || "",
    // Material specs
    sizeInch: serverData.sizeInch || serverData.size_inch || "",
    od: serverData.od || "",
    length: serverData.length || "",
    gradeVariant: serverData.gradeVariant || serverData.grade_variant || "",
    standard: serverData.standard || "",
    formType: serverData.formType || serverData.form_type || "",
    shape: serverData.shape || "",
    condition: serverData.condition || "",
    // Dimensions
    height: serverData.height || "",
    nbSize: serverData.nbSize || serverData.nb_size || "",
    schedule: serverData.schedule || "",
    diameter: serverData.diameter || "",
    // Naming system
    uniqueName: serverData.uniqueName || serverData.unique_name || "",
    displayName: serverData.displayName || serverData.display_name || "",
    fullName: serverData.fullName || serverData.full_name || "",
    currentStock: parseFloat(serverData.currentStock || serverData.current_stock) || 0,
    // Origin
    origin: serverData.origin || "",
    countryOfOrigin: serverData.countryOfOrigin || serverData.country_of_origin || "",
    isPinned: serverData.isPinned || serverData.is_pinned || false,
    // Product master
    hsCode: serverData.hsCode || serverData.hs_code || "",
    millName: serverData.millName || serverData.mill_name || "",
    millCountry: serverData.millCountry || serverData.mill_country || "",
    productCategory: serverData.productCategory || serverData.product_category || "",
    surfaceFinishOptions: serverData.surfaceFinishOptions || serverData.surface_finish_options || "",
    materialPrefix: serverData.materialPrefix || serverData.material_prefix || "",
    gradeNumber: serverData.gradeNumber || serverData.grade_number || "",
    // Traceability
    heatNumber: serverData.heatNumber || serverData.heat_number || "",
    originCountryId: serverData.originCountryId || serverData.origin_country_id,
    millLocation: serverData.millLocation || serverData.mill_location || "",
    // Audit
    createdAt: serverData.createdAt || serverData.created_at,
    updatedAt: serverData.updatedAt || serverData.updated_at,
  };
};

export const productService = {
  // Alias for backwards compatibility with components using getAll
  async getAll(params = {}) {
    return apiClient.get("/products", params);
  },

  async getProducts(params = {}) {
    return apiClient.get("/products", params);
  },

  async getProduct(id) {
    return apiClient.get(`/products/${id}`);
  },

  async createProduct(productData) {
    return apiClient.post("/products", productData);
  },

  async updateProduct(id, productData) {
    return apiClient.put(`/products/${id}`, productData);
  },

  async deleteProduct(id) {
    return apiClient.delete(`/products/${id}`);
  },

  async updateProductPrice(id, priceData) {
    return apiClient.post(`/products/${id}/price-update`, priceData);
  },

  async updateStock(id, stockData) {
    return apiClient.put(`/products/${id}/stock`, stockData);
  },

  async getProductAnalytics() {
    return apiClient.get("/products/analytics");
  },

  async searchProducts(searchTerm, filters = {}) {
    return apiClient.get("/products", {
      search: searchTerm,
      ...filters,
    });
  },

  async getProductsByCategory(category) {
    return apiClient.get("/products", { category });
  },

  async getLowStockProducts() {
    return apiClient.get("/products", { stock_status: "low" });
  },

  async getWarehouseStock(productId) {
    // companyId is automatically added by backend from authenticated user context
    return apiClient.get("/products/warehouse-stock", {
      productId,
    });
  },

  async downloadProducts() {
    const { apiService } = await import("./axiosApi");
    const blob = await apiService.request({
      method: "GET",
      url: "/products/download",
      responseType: "blob",
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const filename = `products_${new Date().toISOString().split("T")[0]}.xlsx`;

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(downloadUrl);
  },
};
