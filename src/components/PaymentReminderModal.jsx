import React, { useState, useEffect } from 'react';
import { X, Phone, Calendar, Trash2, Edit2, Plus } from 'lucide-react';
import { formatDateTime } from '../utils/invoiceUtils';

const PaymentReminderModal = ({ isOpen, onClose, invoice, onSave }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    contact_date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    notes: ''
  });

  // Fetch existing reminders when modal opens
  useEffect(() => {
    if (isOpen && invoice?.id) {
      fetchReminders();
    }
  }, [isOpen, invoice?.id]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoice.id}/payment-reminders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      }
    } catch (err) {
      // Silently fail - just show empty list
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.notes.trim()) {
      return;
    }

    try {
      if (editingId) {
        // Update existing reminder
        const response = await fetch(`/api/invoices/payment-reminders/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const updatedReminder = await response.json();
          setReminders(reminders.map(r => r.id === editingId ? updatedReminder : r));
        }
      } else {
        // Create new reminder
        const response = await fetch(`/api/invoices/${invoice.id}/payment-reminders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const newReminder = await response.json();
          setReminders([newReminder, ...reminders]);

          if (onSave) {
            onSave(newReminder);
          }
        }
      }

      // Reset form
      setFormData({
        contact_date: new Date().toISOString().slice(0, 16),
        notes: ''
      });
      setIsAdding(false);
      setEditingId(null);
    } catch (err) {
      // Silently fail
    }
  };

  const handleEdit = (reminder) => {
    setEditingId(reminder.id);
    setFormData({
      contact_date: new Date(reminder.contact_date).toISOString().slice(0, 16),
      notes: reminder.notes
    });
    setIsAdding(true);
  };

  const handleDelete = async (reminderId) => {
    if (!window.confirm('Delete this note?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/payment-reminders/${reminderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setReminders(reminders.filter(r => r.id !== reminderId));
      }
    } catch (err) {
      // Silently fail
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      contact_date: new Date().toISOString().slice(0, 16),
      notes: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-2 border-yellow-300 dark:border-yellow-700">
        {/* Header - Sticky Note Style */}
        <div className="bg-yellow-200 dark:bg-yellow-800/40 px-6 py-4 border-b-2 border-yellow-300 dark:border-yellow-700">
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
              className="text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Add New Button */}
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full mb-4 px-4 py-3 bg-yellow-300 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100 rounded-lg hover:bg-yellow-400 dark:hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 font-medium shadow-md"
            >
              <Plus size={20} />
              Add New Payment Call Note
            </button>
          )}

          {/* Add/Edit Form */}
          {isAdding && (
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
                    Conversation Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Document what was discussed with the customer regarding pending payment..."
                    rows={10}
                    maxLength={1000}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-600 focus:border-transparent resize-none"
                    required
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.notes.length}/1000 characters (approx. 10 lines)
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
          )}

          {/* Reminders List */}
          {loading ? (
            <div className="text-center py-8 text-yellow-700 dark:text-yellow-300">
              Loading...
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-8 text-yellow-700 dark:text-yellow-300">
              <Phone className="mx-auto mb-2 opacity-50" size={48} />
              <p className="font-medium">No payment reminder calls recorded yet</p>
              <p className="text-sm mt-1">Click "Add New" to document your first call</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border-yellow-400 dark:border-yellow-600 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar size={14} />
                      <span className="font-medium">
                        {formatDateTime(reminder.contact_date)}
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

                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {reminder.notes}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-yellow-200 dark:bg-yellow-800/40 px-6 py-3 border-t-2 border-yellow-300 dark:border-yellow-700">
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
