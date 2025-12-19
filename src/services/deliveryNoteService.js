import { apiClient } from './api';
import { apiService } from './axiosApi'; // Only for downloadPDF

export const deliveryNoteService = {
  // Get all delivery notes with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get('/delivery-notes', params);
  },

  // Get delivery note by ID
  getById: (id) => {
    return apiClient.get(`/delivery-notes/${id}`);
  },

  // Create delivery note from invoice
  create: (deliveryNoteData) => {
    return apiClient.post('/delivery-notes', deliveryNoteData);
  },

  // Update delivery note (full update)
  update: (id, deliveryNoteData) => {
    return apiClient.put(`/delivery-notes/${id}`, deliveryNoteData);
  },

  // Update delivery quantities (partial delivery)
  updateDelivery: (deliveryNoteId, itemId, deliveryData) => {
    return apiClient.patch(
      `/delivery-notes/${deliveryNoteId}/items/${itemId}/deliver`,
      deliveryData,
    );
  },

  // Update delivery note status
  updateStatus: (id, status, notes = '') => {
    return apiClient.patch(`/delivery-notes/${id}/status`, { status, notes });
  },

  // Delete delivery note
  delete: (id) => {
    return apiClient.delete(`/delivery-notes/${id}`);
  },

  // Get next delivery note number
  getNextNumber: () => {
    return apiClient.get('/delivery-notes/number/next');
  },

  // Generate and download PDF
  downloadPDF: async (id) => {
    // Use axios-based service to leverage interceptors and auth headers
    const blob = await apiService.request({
      method: 'GET',
      url: `/delivery-notes/${id}/pdf`,
      responseType: 'blob',
    });
    const downloadUrl = window.URL.createObjectURL(blob);

    // Get delivery note number for filename
    const deliveryNote = await deliveryNoteService.getById(id);
    const filename = `DN-${deliveryNote.deliveryNoteNumber || deliveryNote.delivery_note_number || id}.pdf`;

    // Create download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
  },
};
