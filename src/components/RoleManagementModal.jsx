import { AlertCircle, Edit2, Lock, Plus, Shield, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { notificationService } from "../services/notificationService";
import { roleService } from "../services/roleService";
import ConfirmDialog from "./ConfirmDialog";

/**
 * RoleManagementModal - Manage system and custom roles
 *
 * Features:
 * - List all roles (system + custom)
 * - Visual indicator for system roles (cannot be deleted)
 * - Create new custom roles with validation
 * - Edit system roles (description, permissions, director status)
 * - Edit custom roles (full edit)
 * - Delete custom roles only
 * - Real-time validation
 */
const RoleManagementModal = ({ open, onClose, onRoleUpdated }) => {
  const { isDarkMode } = useTheme();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    isDirector: false,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    roleId: null,
    roleName: null,
  });

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await roleService.getRoles();
      setRoles(data || []);
    } catch (error) {
      console.error("Error loading roles:", error);
      notificationService.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  // Load roles when modal opens
  useEffect(() => {
    if (open) {
      loadRoles();
    }
  }, [open, loadRoles]);

  const validateForm = () => {
    const errors = {};

    if (!editingRole) {
      // Creating new role
      if (!formData.displayName || formData.displayName.trim().length < 3) {
        errors.displayName = "Display name must be at least 3 characters";
      } else if (formData.displayName.trim().length > 50) {
        errors.displayName = "Display name must be less than 50 characters";
      }

      // Check for reserved names
      const reservedNames = ["admin", "superuser", "root"];
      const normalized = formData.displayName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      if (reservedNames.includes(normalized)) {
        errors.displayName = `"${formData.displayName}" is a reserved name and cannot be used`;
      }

      // Check for duplicate names
      const exists = roles.some((r) => r.name?.toLowerCase() === formData.displayName.toLowerCase());
      if (exists) {
        errors.displayName = "A role with this name already exists";
      }
    } else {
      // Editing existing role
      if (!formData.displayName || formData.displayName.trim().length < 3) {
        errors.displayName = "Display name must be at least 3 characters";
      } else if (formData.displayName.trim().length > 50) {
        errors.displayName = "Display name must be less than 50 characters";
      }

      // For custom roles, check for duplicates (excluding current role)
      if (!editingRole.isSystemRole) {
        const exists = roles.some(
          (r) => r.id !== editingRole.id && r.name?.toLowerCase() === formData.displayName.toLowerCase()
        );
        if (exists) {
          errors.displayName = "A role with this name already exists";
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await roleService.createRole({
        name: formData.displayName,
        description: formData.description,
        isDirector: formData.isDirector,
        permissionKeys: [],
      });

      notificationService.success("Role created successfully");
      loadRoles();
      resetForm();
      if (onRoleUpdated) onRoleUpdated();
    } catch (error) {
      console.error("Error creating role:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to create role";
      notificationService.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name || "",
      displayName: role.name || "",
      description: role.description || "",
      isDirector: role.isDirector || false,
    });
    setShowCreateForm(true);
    setValidationErrors({});
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await roleService.updateRole(editingRole.id, {
        name: formData.displayName,
        description: formData.description,
        isDirector: formData.isDirector,
        permissionKeys: editingRole.permissionKeys || [],
      });

      notificationService.success("Role updated successfully");
      loadRoles();
      resetForm();
      if (onRoleUpdated) onRoleUpdated();
    } catch (error) {
      console.error("Error updating role:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to update role";
      notificationService.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (role) => {
    if (role.isSystemRole || role.isSystem) {
      notificationService.warning(`System role "${role.name}" cannot be deleted`);
      return;
    }

    setDeleteConfirm({
      open: true,
      roleId: role.id,
      roleName: role.name,
    });
  };

  const confirmDelete = async () => {
    const { roleId } = deleteConfirm;
    if (!roleId) return;

    try {
      await roleService.deleteRole(roleId);
      notificationService.success("Role deleted successfully");
      loadRoles();
      if (onRoleUpdated) onRoleUpdated();
    } catch (error) {
      console.error("Error deleting role:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to delete role";
      notificationService.error(errorMsg);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      displayName: "",
      description: "",
      isDirector: false,
    });
    setEditingRole(null);
    setShowCreateForm(false);
    setValidationErrors({});
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        data-testid="role-management-modal"
        className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg shadow-xl ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <div className="flex items-center gap-3">
            <Shield className="text-teal-500" size={24} />
            <h2 className="text-2xl font-semibold">Manage Roles</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-testid="close-modal-x"
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Create/Edit Form */}
          {showCreateForm ? (
            <div
              className={`mb-6 p-4 rounded-lg border ${isDarkMode ? "border-gray-700 bg-gray-750" : "border-gray-200 bg-gray-50"}`}
            >
              <h3 className="text-lg font-medium mb-4">{editingRole ? "Edit Role" : "Create New Role"}</h3>

              {editingRole?.isSystemRole && (
                <div
                  className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${isDarkMode ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-800"}`}
                >
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong>System Role:</strong> You can edit the description and director status, but cannot change
                    the role name.
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Display Name */}
                <div>
                  <label
                    htmlFor="displayName"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Display Name *
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => {
                      setFormData({ ...formData, displayName: e.target.value });
                      setValidationErrors({
                        ...validationErrors,
                        displayName: "",
                      });
                    }}
                    disabled={editingRole?.isSystemRole}
                    placeholder="e.g., Sales Manager"
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      validationErrors.displayName
                        ? "border-red-500"
                        : isDarkMode
                          ? "border-gray-600"
                          : "border-gray-300"
                    } ${
                      isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
                    } ${editingRole?.isSystemRole ? "opacity-50 cursor-not-allowed" : ""} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                  {validationErrors.displayName && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.displayName}</p>
                  )}
                  {!editingRole && (
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      3-50 characters. Will be converted to lowercase with underscores.
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this role's responsibilities"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isDarkMode ? "border-gray-600 bg-gray-800 text-white" : "border-gray-300 bg-white text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none`}
                  />
                </div>

                {/* Director Role Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDirector"
                    checked={formData.isDirector}
                    onChange={(e) => setFormData({ ...formData, isDirector: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                  />
                  <label htmlFor="isDirector" className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Director Role (elevated privileges)
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={editingRole ? handleUpdate : handleCreate}
                  disabled={submitting}
                  data-testid={editingRole ? "update-role-btn" : "create-role-btn"}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : editingRole ? "Update Role" : "Create Role"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  data-testid="cancel-form-btn"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              data-testid="create-new-role-btn"
              className="mb-6 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Create New Role
            </button>
          )}

          {/* Roles List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
              <p className={`mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading roles...</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8">
              <Shield size={48} className={isDarkMode ? "text-gray-600 mx-auto mb-2" : "text-gray-400 mx-auto mb-2"} />
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>No roles found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  data-testid={`role-item-${role.id}`}
                  className={`p-4 rounded-lg border transition-all ${
                    isDarkMode
                      ? "border-gray-700 bg-gray-750 hover:bg-gray-700"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-medium">{role.name}</h4>
                        {(role.isSystemRole || role.isSystem) && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
                            <Lock size={12} />
                            System
                          </span>
                        )}
                        {role.isDirector && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs rounded-full">
                            Director
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {role.description || "No description"}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        type="button"
                        onClick={() => handleEdit(role)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                        }`}
                        title="Edit role"
                      >
                        <Edit2 size={18} />
                      </button>
                      {!role.isSystemRole && !role.isSystem && (
                        <button
                          type="button"
                          onClick={() => handleDelete(role)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete role"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-2 p-6 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-modal-btn"
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.open && (
        <ConfirmDialog
          title="Delete Role?"
          message={`Are you sure you want to delete the role "${deleteConfirm.roleName}"? This action cannot be undone.`}
          variant="danger"
          onConfirm={() => {
            confirmDelete().finally(() => setDeleteConfirm({ open: false, roleId: null, roleName: null }));
          }}
          onCancel={() => setDeleteConfirm({ open: false, roleId: null, roleName: null })}
        />
      )}
    </div>
  );
};

export default RoleManagementModal;
