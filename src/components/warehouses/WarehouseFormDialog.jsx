/**
 * WarehouseFormDialog Component
 * Modal dialog for creating/editing warehouse details
 */

import { MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";

const WarehouseFormDialog = ({ open, warehouse, onSave, onClose }) => {
  const { isDarkMode } = useTheme();
  const isEditing = !!warehouse;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    address: "",
    city: "",
    state: "",
    country: "UAE",
    postalCode: "",
    contactPerson: "",
    phone: "",
    email: "",
    capacity: "",
    capacityUnit: "MT",
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name || "",
        code: warehouse.code || "",
        description: warehouse.description || "",
        address: warehouse.address || "",
        city: warehouse.city || "",
        state: warehouse.state || "",
        country: warehouse.country || "UAE",
        postalCode: warehouse.postalCode || "",
        contactPerson: warehouse.contactPerson || "",
        phone: warehouse.phone || "",
        email: warehouse.email || "",
        capacity: warehouse.capacity || "",
        capacityUnit: warehouse.capacityUnit || "MT",
        isActive: warehouse.isActive !== false,
      });
    } else {
      // Reset form for new warehouse
      setFormData({
        name: "",
        code: "",
        description: "",
        address: "",
        city: "",
        state: "",
        country: "UAE",
        postalCode: "",
        contactPerson: "",
        phone: "",
        email: "",
        capacity: "",
        capacityUnit: "MT",
        isActive: true,
      });
    }
    setErrors({});
  }, [warehouse]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Code is required";
    } else if (!/^[A-Z0-9-_]+$/i.test(formData.code)) {
      newErrors.code = "Code must be alphanumeric (letters, numbers, - and _)";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (formData.capacity && Number.isNaN(parseFloat(formData.capacity))) {
      newErrors.capacity = "Capacity must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setSaving(true);
    try {
      await onSave({
        ...formData,
        capacity: formData.capacity ? parseFloat(formData.capacity) : null,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputClass = (hasError) => `
    w-full px-3 py-2 rounded-lg border
    ${
      isDarkMode
        ? `bg-[#121418] border-${hasError ? "red-500" : "gray-600"} text-white placeholder-gray-500`
        : `bg-white border-${hasError ? "red-500" : "gray-300"} text-gray-900 placeholder-gray-400`
    }
    focus:outline-none focus:ring-2 focus:ring-teal-500
  `;

  const labelClass = `block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl shadow-xl ${
          isDarkMode ? "bg-[#1E2328]" : "bg-white"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? "bg-teal-900/30" : "bg-teal-100"}`}>
              <MapPin className={`w-5 h-5 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} />
            </div>
            <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {isEditing ? "Edit Warehouse" : "Add New Warehouse"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            <X className={`w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="px-6 py-4 space-y-6">
            {/* Basic Information */}
            <div>
              <h3
                className={`text-sm font-semibold uppercase tracking-wide mb-3 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Main Warehouse"
                    className={inputClass(errors.name)}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="code" className={labelClass}>
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="code"
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g., WH-MAIN"
                    className={inputClass(errors.code)}
                  />
                  {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className={labelClass}>
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Brief description of the warehouse"
                    className={inputClass(false)}
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3
                className={`text-sm font-semibold uppercase tracking-wide mb-3 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="address" className={labelClass}>
                    Address
                  </label>
                  <input
                    id="address"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street address"
                    className={inputClass(false)}
                  />
                </div>

                <div>
                  <label htmlFor="city" className={labelClass}>
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g., Dubai"
                    className={inputClass(errors.city)}
                  />
                  {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                </div>

                <div>
                  <label htmlFor="state" className={labelClass}>
                    State / Emirate
                  </label>
                  <input
                    id="state"
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g., Dubai"
                    className={inputClass(false)}
                  />
                </div>

                <div>
                  <label htmlFor="country" className={labelClass}>
                    Country
                  </label>
                  <input
                    id="country"
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={inputClass(false)}
                  />
                </div>

                <div>
                  <label htmlFor="postalCode" className={labelClass}>
                    Postal Code
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="e.g., 12345"
                    className={inputClass(false)}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3
                className={`text-sm font-semibold uppercase tracking-wide mb-3 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contactPerson" className={labelClass}>
                    Contact Person
                  </label>
                  <input
                    id="contactPerson"
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    placeholder="e.g., Ahmed Hassan"
                    className={inputClass(false)}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className={labelClass}>
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., +971-50-123-4567"
                    className={inputClass(false)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g., warehouse@example.com"
                    className={inputClass(errors.email)}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Capacity & Status */}
            <div>
              <h3
                className={`text-sm font-semibold uppercase tracking-wide mb-3 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Capacity & Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="capacity" className={labelClass}>
                    Capacity
                  </label>
                  <input
                    id="capacity"
                    type="text"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="e.g., 5000"
                    className={inputClass(errors.capacity)}
                  />
                  {errors.capacity && <p className="mt-1 text-xs text-red-500">{errors.capacity}</p>}
                </div>

                <div>
                  <label htmlFor="capacityUnit" className={labelClass}>
                    Unit
                  </label>
                  <select
                    id="capacityUnit"
                    name="capacityUnit"
                    value={formData.capacityUnit}
                    onChange={handleChange}
                    className={inputClass(false)}
                  >
                    <option value="MT">Metric Tons (MT)</option>
                    <option value="KG">Kilograms (KG)</option>
                    <option value="PCS">Pieces (PCS)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label
                    htmlFor="isActive"
                    className={`flex items-center gap-2 cursor-pointer ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <input
                      id="isActive"
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
              isDarkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : isEditing ? "Update Warehouse" : "Create Warehouse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarehouseFormDialog;
