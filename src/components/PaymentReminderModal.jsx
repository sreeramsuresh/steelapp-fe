import { Calendar, Edit2, Loader2, Phone, Plus, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { apiService, tokenUtils } from "../services/axiosApi";
import { notificationService } from "../services/notificationService";
import { formatCurrency, formatDateTime } from "../utils/invoiceUtils";
import ConfirmDialog from "./ConfirmDialog";

// Helper function to get first name from full name
const getFirstName = (name) => {
  if (!name) return "N/A";

  const parts = name
    .trim()
    .split(" ")
    .filter((p) => p.length > 0);

  if (parts.length === 0) return "N/A";

  // Return first name only, capitalized
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
};

// Helper function to safely format a date string
const formatPromisedDate = (dateString) => {
  if (!dateString) return null;

  const date = new Date(dateString);
  // Check if date is valid
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const PaymentReminderModal = ({ isOpen, onClose, invoice, onSave, isViewOnly = false }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // For custom confirmation dialog
  const [formData, setFormData] = useState({
    contact_date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    notes: "",
    promised_amount: "",
    promised_date: "",
  });
  const notesTextareaRef = React.useRef(null);

  // Get current user info
  useEffect(() => {
    const user = tokenUtils.getUser() || JSON.parse(localStorage.getItem("steel-app-user") || "null");
    setCurrentUser(user);
  }, []);

  // Fetch existing reminders when drawer opens
  useEffect(() => {
    if (isOpen && invoice?.id) {
      fetchReminders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, invoice?.id, fetchReminders]); // fetchReminders is stable within component lifecycle

  // Auto-resize textarea as user types
  useEffect(() => {
    if (notesTextareaRef.current) {
      notesTextareaRef.current.style.height = "auto";
      notesTextareaRef.current.style.height = `${notesTextareaRef.current.scrollHeight}px`;
    }
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const data = await apiService.get(`/invoices/${invoice.id}/payment-reminders`);
      setReminders(data);
    } catch (err) {
      // Silently fail - just show empty list
      console.error("Failed to fetch reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.notes.trim()) {
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        // Update existing reminder
        const updatedReminder = await apiService.put(`/invoices/payment-reminders/${editingId}`, formData);

        setReminders(reminders.map((r) => (r.id === editingId ? updatedReminder : r)));

        // Reset form
        setFormData({
          contact_date: new Date().toISOString().slice(0, 16),
          notes: "",
          promised_amount: "",
          promised_date: "",
        });
        setEditingId(null);
        notificationService.success("Note updated successfully");
      } else {
        // Create new reminder
        const newReminder = await apiService.post(`/invoices/${invoice.id}/payment-reminders`, formData);

        // Add new reminder to the TOP of the list
        setReminders([newReminder, ...reminders]);

        // Reset form
        setFormData({
          contact_date: new Date().toISOString().slice(0, 16),
          notes: "",
          promised_amount: "",
          promised_date: "",
        });
        setEditingId(null);

        // Delay refresh to allow smooth state transition (300ms)
        setTimeout(async () => {
          await fetchReminders();
        }, 300);

        if (onSave) {
          onSave(newReminder);
        }
        notificationService.success("Note saved successfully");
      }
    } catch (err) {
      console.error("Error saving reminder:", err);
      notificationService.error(`Error saving note: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (reminder) => {
    setEditingId(reminder.id);
    setFormData({
      contact_date: new Date(reminder.contactDate).toISOString().slice(0, 16),
      notes: reminder.notes,
      promised_amount: reminder.promisedAmount || "",
      promised_date: reminder.promisedDate || "",
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
      setReminders(reminders.filter((r) => r.id !== deleteConfirmId));
      notificationService.success("Note deleted successfully");
      // console.log('Note deleted successfully');
      setDeleteConfirmId(null); // Close confirmation dialog
    } catch (err) {
      console.error("Failed to delete note:", err);
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
      notes: "",
      promised_amount: "",
      promised_date: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex">
      {/* Backdrop */}
      <button type="button" className="flex-1 bg-black/30"
    onClick={onClose}
    onKeyDown={(e) => e.key === "Enter" && onClose()}
      ></button>

      {/* Drawer */}
      <div className="w-full max-w-lg h-full overflow-auto bg-gradient-to-br from-orange-50 to-amber-50 dark:from-[#2A1E1A] dark:to-[#221A16] text-gray-900 dark:text-white shadow-xl border-l-2 border-orange-300 dark:border-orange-700">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 px-6 py-4 border-b-2 border-orange-300 dark:border-orange-700 backdrop-blur-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <Phone className="text-orange-700 dark:text-orange-400" size={24} />
                <h2 className="text-xl font-bold text-orange-900 dark:text-orange-100">Payment Reminder Calls</h2>
                {isViewOnly && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                    View Only
                  </span>
                )}
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Invoice: {invoice?.invoiceNumber} | Customer: {invoice?.customer?.name || "N/A"}
              </p>
            </div>
            <button type="button" onClick={onClose}
              className="p-2 rounded hover:bg-orange-200 dark:hover:bg-orange-800/50 text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100 transition-colors"
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
        <div className="p-6 space-y-4">
          {/* Invoice Summary Section */}
          <div className="p-4 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-lg border-2 border-orange-300 dark:border-orange-700">
            <div className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
              <span>📊</span> Invoice Summary
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs text-orange-700 dark:text-orange-300 mb-1">Total Amount</div>
                <div className="font-bold text-lg text-orange-900 dark:text-orange-100">
                  {formatCurrency(invoice?.invoiceAmount || invoice?.total || 0)}
                </div>
              </button>
              <div>
                <div className="text-xs text-orange-700 dark:text-orange-300 mb-1">Paid Amount</div>
                <div className="font-bold text-lg text-green-600 dark:text-green-400">
                  {formatCurrency(invoice?.received || 0)}
                </div>
              </div>
              <div>
                <div className="text-xs text-orange-700 dark:text-orange-300 mb-1">Balance Due</div>
                <div className="font-bold text-lg text-red-600 dark:text-red-400">
                  {formatCurrency(invoice?.outstanding || invoice?.balanceDue || 0)}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-orange-300 dark:border-orange-700">
              <div className="text-xs text-orange-700 dark:text-orange-300">
                <strong>Customer:</strong> {invoice?.customer?.name || "N/A"}
              </div>
            </div>
          </div>

          {/* Saved Notes List */}
          {loading ? (
            <div className="text-center py-4 text-orange-700 dark:text-orange-300">Loading...</div>
          ) : (
            reminders.length > 0 && (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-md border-l-4 border-orange-400 dark:border-orange-600 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar size={14} />
                        <span className="font-medium">{formatDateTime(reminder.contactDate)}</span>
                        {/* User First Name */}
                        <span className="ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded text-xs font-semibold">
                          {getFirstName(currentUser?.name)}
                        </span>
                      </div>
                      {!isViewOnly && (
                        <div className="flex gap-1">
                          <button type="button" onClick={() => handleEdit(reminder)}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button type="button" onClick={() => handleDelete(reminder.id)}
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-800 dark:text-gray-200 text-sm">{reminder.notes}</p>

                    {/* Show promised payment info if available */}
                    {(reminder.promisedAmount || reminder.promisedDate) && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 space-y-1">
                        {reminder.promisedAmount && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span>💰</span>
                            <span className="font-semibold">Promised Amount:</span>
                            <span className="text-green-600 dark:text-green-400 font-bold">
                              AED {parseFloat(reminder.promisedAmount).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {formatPromisedDate(reminder.promisedDate) && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span>📅</span>
                            <span className="font-semibold">Promised Date:</span>
                            <span className="text-blue-600 dark:text-blue-400 font-bold">
                              {formatPromisedDate(reminder.promisedDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* Form - Hidden in View Only mode */}
          {!isViewOnly && (
            <form
              onSubmit={handleSubmit}
              className="p-5 bg-white dark:bg-gray-800/50 rounded-lg shadow-lg border-2 border-orange-400 dark:border-orange-600"
            >
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-4 flex items-center gap-2">
                {editingId ? (
                  <Edit2 size={18} className="text-orange-600 dark:text-orange-400" />
                ) : (
                  <Plus size={18} className="text-orange-600 dark:text-orange-400" />
                )}
                {editingId ? "Edit Call Note" : "New Call Note"}
              </h3>

              <div className="space-y-4">
                {/* Date & Time */}
                <div>
                  <label
                    htmlFor="contact-date-input"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1"
                  >
                    <Calendar size={16} />
                    Date & Time of Call
                  </label>
                  <input
                    id="contact-date-input"
                    type="datetime-local"
                    value={formData.contact_date}
                    onChange={(e) => setFormData({ ...formData, contact_date: e.target.value })}
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600 focus:border-transparent cursor-pointer"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="call-notes-textarea"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Call Notes
                  </label>
                  <textarea
                    id="call-notes-textarea"
                    ref={notesTextareaRef}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Enter call notes - what was discussed, customer response, concerns, etc..."
                    rows={3}
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600 focus:border-transparent resize-y min-h-[60px] overflow-hidden"
                    required
                  />
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-gray-500 dark:text-gray-400">Auto-expands as you type</span>
                    <span
                      className={`font-medium ${formData.notes.length > 180 ? "text-orange-600 dark:text-orange-400" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      {formData.notes.length}/200
                    </span>
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        promised_amount: e.target.value,
                      })
                    }
                    placeholder="e.g., 5000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600 focus:border-transparent"
                  />
                </div>

                {/* Promised Payment Date (Important) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <span>📅</span>
                    When Will Customer Pay?{" "}
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold">(Important)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.promised_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        promised_date: e.target.value,
                      })
                    }
                    onClick={(e) => e.target.showPicker?.()}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600 focus:border-transparent cursor-pointer"
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
                  disabled={isSaving}
                  className={`flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 dark:hover:from-orange-700 dark:hover:to-amber-700 transition-all font-medium shadow-md hover:shadow-lg inline-flex items-center justify-center ${
                    isSaving ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    `${editingId ? "Update" : "Save"} Note`
                  )}
                </button>
                {editingId && (
                  <button type="button" onClick={handleCancel}
                    disabled={isSaving}
                    className={`flex-1 px-4 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium shadow ${
                      isSaving ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentReminderModal;
