import React, { useState, useEffect } from 'react';
import { X, Phone, Calendar, Trash2, Edit2, Plus } from 'lucide-react';
import { formatDateTime } from '../utils/invoiceUtils';
import { apiService, tokenUtils } from '../services/axiosApi';
import ConfirmDialog from './ConfirmDialog';
import { notificationService } from '../services/notificationService';

// Helper function to get first name from full name
const getFirstName = (name) => {
  if (!name) return 'N/A';

  const parts = name.trim().split(' ').filter(p => p.length > 0);

  if (parts.length === 0) return 'N/A';

  // Return first name only, capitalized
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
};

const PaymentReminderModal = ({ isOpen, onClose, invoice, onSave }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // For custom confirmation dialog
  const [formData, setFormData] = useState({
    contact_date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    notes: '',
    promised_amount: '',
    promised_date: ''
  });

  // Draggable state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Get current user info
  useEffect(() => {
    const user = tokenUtils.getUser() || JSON.parse(localStorage.getItem('steel-app-user') || 'null');
    setCurrentUser(user);
  }, []);

  // Fetch existing reminders when modal opens
  useEffect(() => {
    if (isOpen && invoice?.id) {
      fetchReminders();
    }
  }, [isOpen, invoice?.id]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const data = await apiService.get(`/invoices/${invoice.id}/payment-reminders`);
      setReminders(data);
    } catch (err) {
      // Silently fail - just show empty list
      console.error('Failed to fetch reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    // Only allow dragging from header area
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('=== SAVE BUTTON CLICKED ===');
    console.log('Form data:', formData);
    console.log('Invoice ID:', invoice?.id);
    console.log('Token exists:', !!localStorage.getItem('token'));

    if (!formData.notes.trim()) {
      console.log('ERROR: Notes are empty');
      return;
    }

    try {
      if (editingId) {
        // Update existing reminder
        console.log('Updating reminder:', editingId);
        const updatedReminder = await apiService.put(`/invoices/payment-reminders/${editingId}`, formData);

        setReminders(reminders.map(r => r.id === editingId ? updatedReminder : r));

        // Reset form
        console.log('Resetting form after update...');
        setFormData({
          contact_date: new Date().toISOString().slice(0, 16),
          notes: '',
          promised_amount: '',
          promised_date: ''
        });
        setEditingId(null);
        notificationService.success('Note updated successfully');
        console.log('=== UPDATE COMPLETED SUCCESSFULLY ===');
      } else {
        // Create new reminder
        const url = `/invoices/${invoice.id}/payment-reminders`;
        console.log('Making POST request to:', url);
        console.log('Request body:', JSON.stringify(formData));

        const newReminder = await apiService.post(url, formData);
        console.log('New reminder received:', newReminder);

        // Add new reminder to the TOP of the list
        setReminders([newReminder, ...reminders]);

        // Reset form
        console.log('Resetting form...');
        setFormData({
          contact_date: new Date().toISOString().slice(0, 16),
          notes: '',
          promised_amount: '',
          promised_date: ''
        });
        setEditingId(null);

        // Refresh the list to ensure we have latest data
        console.log('Refreshing list...');
        await fetchReminders();

        if (onSave) {
          onSave(newReminder);
        }
        notificationService.success('Note saved successfully');
        console.log('=== SAVE COMPLETED SUCCESSFULLY ===');
      }
    } catch (err) {
      console.error('Error saving reminder:', err);
      notificationService.error(`Error saving note: ${err.message}`);
    }
  };

  const handleEdit = (reminder) => {
    setEditingId(reminder.id);
    setFormData({
      contact_date: new Date(reminder.contact_date).toISOString().slice(0, 16),
      notes: reminder.notes,
      promised_amount: reminder.promised_amount || '',
      promised_date: reminder.promised_date || ''
    });
  };

  const handleDelete = (reminderId) => {
    // Show custom confirmation dialog
    setDeleteConfirmId(reminderId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await apiService.delete(`/invoices/payment-reminders/${deleteConfirmId}`);
      setReminders(reminders.filter(r => r.id !== deleteConfirmId));
      notificationService.success('Note deleted successfully');
      console.log('Note deleted successfully');
      setDeleteConfirmId(null); // Close confirmation dialog
    } catch (err) {
      console.error('Failed to delete note:', err);
      notificationService.error(`Error deleting note: ${err.message}`);
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      contact_date: new Date().toISOString().slice(0, 16),
      notes: '',
      promised_amount: '',
      promised_date: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4">
      <div
        className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-2 border-yellow-300 dark:border-yellow-700 absolute top-1/2 left-1/2"
        style={{
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
          cursor: isDragging ? 'grabbing' : 'default',
          userSelect: isDragging ? 'none' : 'auto'
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Header - Sticky Note Style - Draggable */}
        <div className="drag-handle bg-yellow-200 dark:bg-yellow-800/40 px-6 py-4 border-b-2 border-yellow-300 dark:border-yellow-700 cursor-move">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <Phone className="text-yellow-700 dark:text-yellow-400" size={24} />
                <h2 className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                  Payment Reminder Calls
                </h2>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Invoice: {invoice?.invoiceNumber} | Customer: {invoice?.customer?.name || 'N/A'}
              </p>
            </div>
            <button
              onClick={onClose}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteConfirmId !== null}
          title="Delete this note?"
          message="This action cannot be undone."
          variant="danger"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />

        {/* Content - Scrollable */}
        <div
          className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Saved Notes List - TOP (Max 3 visible, rest scroll) */}
          {loading ? (
            <div className="text-center py-4 text-yellow-700 dark:text-yellow-300 mb-6">
              Loading...
            </div>
          ) : reminders.length > 0 && (
            <div className="mb-6 max-h-[280px] overflow-y-auto space-y-3 pr-2">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border-yellow-400 dark:border-yellow-600 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar size={14} />
                      <span className="font-medium">
                        {formatDateTime(reminder.contact_date)}
                      </span>
                      {/* User First Name */}
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded text-xs font-semibold">
                        {getFirstName(currentUser?.name)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(reminder)}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(reminder.id)}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-800 dark:text-gray-200 text-sm">
                    {reminder.notes}
                  </p>

                  {/* Show promised payment info if available */}
                  {(reminder.promised_amount || reminder.promised_date) && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 space-y-1">
                      {reminder.promised_amount && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>💰</span>
                          <span className="font-semibold">Promised Amount:</span>
                          <span className="text-green-600 dark:text-green-400 font-bold">
                            AED {parseFloat(reminder.promised_amount).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {reminder.promised_date && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>📅</span>
                          <span className="font-semibold">Promised Date:</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {new Date(reminder.promised_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Form - Always Visible - BOTTOM */}
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-yellow-400 dark:border-yellow-600">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                {editingId ? 'Edit Call Note' : 'New Call Note'}
              </h3>

              <div className="space-y-4">
                {/* Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <Calendar size={16} />
                    Date & Time of Call
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.contact_date}
                    onChange={(e) => setFormData({ ...formData, contact_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-600 focus:border-transparent"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Quick note..."
                    rows={2}
                    maxLength={40}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-600 focus:border-transparent resize-none"
                    required
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.notes.length}/40 characters
                  </div>
                </div>

                {/* Promised Amount (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <span>💰</span>
                    Promised Amount <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.promised_amount}
                    onChange={(e) => setFormData({ ...formData, promised_amount: e.target.value })}
                    placeholder="e.g., 5000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-600 focus:border-transparent"
                  />
                </div>

                {/* Promised Payment Date (Important) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <span>📅</span>
                    When Will Customer Pay? <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold">(Important)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.promised_date}
                    onChange={(e) => setFormData({ ...formData, promised_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-600 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty if no specific date promised
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-yellow-500 dark:bg-yellow-600 text-white rounded-lg hover:bg-yellow-600 dark:hover:bg-yellow-700 transition-colors font-medium shadow"
                >
                  {editingId ? 'Update' : 'Save'} Note
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium shadow"
                >
                  Cancel
                </button>
              </div>
            </form>
        </div>

        {/* Footer */}
        <div
          className="bg-yellow-200 dark:bg-yellow-800/40 px-6 py-3 border-t-2 border-yellow-300 dark:border-yellow-700"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-yellow-600 dark:bg-yellow-700 text-white rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-800 transition-colors font-medium shadow"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentReminderModal;
