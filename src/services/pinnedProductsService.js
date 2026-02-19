import { apiClient } from "./api.js";

export const pinnedProductsService = {
  /**
   * Get pinned products for the current user
   */
  getPinnedProducts: async () => {
    const response = await apiClient.get("/pinned-products");
    return response;
  },

  /**
   * Pin a product
   */
  pinProduct: async (productId) => {
    const response = await apiClient.post(`/pinned-products/${productId}`);
    return response;
  },

  /**
   * Unpin a product
   */
  unpinProduct: async (productId) => {
    const response = await apiClient.delete(`/pinned-products/${productId}`);
    return response;
  },
};
