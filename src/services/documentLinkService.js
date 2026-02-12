import { apiClient } from "./api.js";

/**
 * Frontend API client for the Document Link / Correction Chain system.
 * Calls the backend graph API at /api/documents.
 */
export const documentLinkService = {
  /**
   * Fetch the full correction chain graph for a posted document.
   * @param {string} docType - e.g. "invoice", "credit_note", "supplier_bill"
   * @param {number|string} docId - the document's primary key
   * @returns {Promise<{ root, nodes, edges, computed }>}
   */
  getCorrectionChain: (docType, docId) => {
    return apiClient.get(`/documents/${docType}/${docId}/correction-chain`);
  },

  /**
   * Create a new link between two documents.
   * @param {{ sourceType, sourceId, targetType, targetId, linkType }} payload
   * @returns {Promise<{ id, ...link }>}
   */
  createLink: (payload) => {
    return apiClient.post("/documents/links", payload);
  },
};
