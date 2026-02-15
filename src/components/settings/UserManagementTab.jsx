import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Box,
  Briefcase,
  Calculator,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  Crown,
  DollarSign,
  Download,
  Edit,
  Eye,
  FilePlus,
  History,
  Key,
  Mail,
  Pencil,
  Plus,
  Printer,
  Receipt,
  Save,
  Shield,
  ShoppingBag,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { authService } from "../../services/axiosAuthService";
import { notificationService } from "../../services/notificationService";
import { roleService } from "../../services/roleService";
import { userAdminAPI } from "../../services/userAdminApi";
import { formatDateDMY } from "../../utils/invoiceUtils";
import RolesHelpPanel from "../RolesHelpPanel";

// Shared UI primitives (lightweight re-definitions to avoid circular deps)

const SettingsPaper = ({ children, className = "" }) => {
  const { isDarkMode } = useTheme();
  return (
    <div
      className={`rounded-2xl shadow-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"} ${className}`}
    >
      {children}
    </div>
  );
};

const SettingsCard = ({ children, className = "" }) => {
  const { isDarkMode } = useTheme();
  return (
    <div
      className={`rounded-xl border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"} ${className}`}
    >
      {children}
    </div>
  );
};

const Button = ({ children, variant = "primary", startIcon, onClick, disabled, className = "" }) => {
  const { isDarkMode } = useTheme();
  const base = "px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2";
  const variants = {
    primary: isDarkMode
      ? "bg-teal-600 hover:bg-teal-700 text-white disabled:bg-gray-700 disabled:text-gray-500"
      : "bg-teal-600 hover:bg-teal-700 text-white disabled:bg-gray-300 disabled:text-gray-500",
    outline: isDarkMode
      ? "border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
      : "border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50",
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {startIcon}
      {children}
    </button>
  );
};

const Input = ({ placeholder, value, onChange, startIcon, className = "" }) => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`relative ${className}`}>
      {startIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{startIcon}</div>}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 border rounded-lg transition-colors ${startIcon ? "pl-10" : ""} ${
          isDarkMode
            ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
        }`}
      />
    </div>
  );
};

const TextField = ({ label, value, onChange, placeholder, error, helperText, type = "text", multiline, rows }) => {
  const { isDarkMode } = useTheme();
  const inputClass = `w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
    error
      ? "border-red-500"
      : isDarkMode
        ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
  }`;
  return (
    <div>
      {label && (
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
          {label}
        </label>
      )}
      {multiline ? (
        <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows || 3} className={inputClass} />
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={inputClass} />
      )}
      {helperText && (
        <p className={`text-xs mt-1 ${error ? "text-red-500" : isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

const CircularProgress = ({ size = 24 }) => (
  <div className="animate-spin rounded-full border-b-2 border-teal-600" style={{ width: size, height: size }} />
);

const Switch = ({ checked, onChange, label, disabled = false }) => {
  const { isDarkMode } = useTheme();
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only" />
        <div
          className={`w-10 h-6 rounded-full transition-colors duration-200 ${
            checked ? "bg-teal-600" : isDarkMode ? "bg-gray-700" : "bg-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
              checked ? "transform translate-x-4" : ""
            }`}
          />
        </div>
      </div>
      {label && <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{label}</span>}
    </label>
  );
};

// Invitation countdown helper
function formatCountdown(expiresAt) {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires - now;
  if (diffMs <= 0) {
    const agoMs = Math.abs(diffMs);
    const agoHours = Math.floor(agoMs / 3600000);
    const agoMinutes = Math.floor((agoMs % 3600000) / 60000);
    return {
      text: agoHours > 0 ? `Expired ${agoHours}h ${agoMinutes}m ago` : `Expired ${agoMinutes}m ago`,
      urgent: true,
      expired: true,
    };
  }
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return {
    text: hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`,
    urgent: hours < 2,
    expired: false,
  };
}

const UserManagementTab = () => {
  const { isDarkMode } = useTheme();

  // Users state
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userPageSize] = useState(20);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userLoadingError, setUserLoadingError] = useState(null);
  const [userValidationErrors, setUserValidationErrors] = useState({});
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [invitations, setInvitations] = useState([]);

  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState({ open: false, user: null });
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role_ids: [] });
  const [showManageRolesModal, setShowManageRolesModal] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({ name: "", displayName: "", description: "", isDirector: false });
  const [customPermissionModal, setCustomPermissionModal] = useState({ open: false, userId: null });
  const [auditLogModal, setAuditLogModal] = useState({ open: false, userId: null, logs: [] });
  const [viewPermissionsModal, setViewPermissionsModal] = useState({
    open: false,
    userId: null,
    userName: "",
    rolePermissions: [],
    customGrants: [],
    loading: false,
  });
  const [passwordChangeModal, setPasswordChangeModal] = useState({
    open: false,
    userId: null,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    loading: false,
    error: null,
  });

  // RBAC
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedUserRoles, setSelectedUserRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [isDirector, setIsDirector] = useState(false);
  const [allPermissions, setAllPermissions] = useState({});
  const [customPermission, setCustomPermission] = useState({ permission_keys: [], reason: "", expires_at: null });
  const [permissionSearch, setPermissionSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState({});

  // Icon mappings
  const getRoleIcon = (roleName) => {
    const name = (roleName || "").toLowerCase().replace(/\s+/g, "_");
    const iconMap = {
      managing_director: Crown,
      operations_manager: Activity,
      finance_manager: DollarSign,
      sales_manager: TrendingUp,
      purchase_manager: ShoppingBag,
      warehouse_manager: Warehouse,
      accounts_manager: Calculator,
      sales_executive: Users,
      purchase_executive: ClipboardList,
      stock_keeper: Box,
      accounts_executive: Receipt,
      logistics_coordinator: Truck,
    };
    return iconMap[name] || Briefcase;
  };

  const getPermissionIcon = (permissionKey) => {
    const key = (permissionKey || "").toLowerCase();
    if (key.includes("create") || key.includes("add")) return FilePlus;
    if (key.includes("edit") || key.includes("update")) return Pencil;
    if (key.includes("delete") || key.includes("remove")) return Trash2;
    if (key.includes("view") || key.includes("read")) return Eye;
    if (key.includes("approve")) return ThumbsUp;
    if (key.includes("export")) return Download;
    if (key.includes("print")) return Printer;
    if (key.includes("manage") || key.includes("access")) return Key;
    return Shield;
  };

  // Formatters
  const formatDateTime = (value) => {
    if (!value) return "Never";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleString("en-AE", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(value);
    }
  };
  const formatDateOnly = (value) => {
    if (!value) return "";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString("en-AE", { year: "numeric", month: "short", day: "2-digit" });
    } catch {
      return String(value);
    }
  };

  // Validation
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateUserForm = (user, isEdit = false) => {
    const errors = {};
    if (!user.name || user.name.trim().length === 0) errors.name = "Name is required";
    if (!user.email || user.email.trim().length === 0) errors.email = "Email is required";
    else if (!validateEmail(user.email)) errors.email = "Please enter a valid email address";
    if (!isEdit && user.password !== undefined) {
      if (!user.password || user.password.length === 0) errors.password = "Password is required";
      else if (user.password.length < 8) errors.password = "Password must be at least 8 characters";
    }
    if (selectedUserRoles.length === 0) errors.roles = "Please assign at least one role";
    return errors;
  };

  const filteredUsers = users.filter((user) => {
    if (!userSearchTerm) return true;
    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.roles?.some((role) => role.displayName?.toLowerCase().includes(searchLower))
    );
  });

  // Load RBAC data + users in parallel
  useEffect(() => {
    (async () => {
      try {
        const currentUser = authService.getUser();
        // Fire all independent requests in parallel
        const [availRoles, permissions, userPerms] = await Promise.all([
          roleService.getAvailableRoles(),
          roleService.getAllPermissions(),
          currentUser?.id ? roleService.getUserPermissions(currentUser.id) : Promise.resolve(null),
        ]);
        setAvailableRoles(availRoles);
        setAllPermissions(permissions);
        if (userPerms) setIsDirector(userPerms.isDirector || false);
      } catch (error) {
        console.error("Error loading RBAC data:", error);
        notificationService.error("Failed to load role configuration");
      }
    })();
  }, []);

  // Load users
  useEffect(() => {
    (async () => {
      try {
        // Fire users list, roles lookup, and invitations in parallel
        const [response, roles, invites] = await Promise.allSettled([
          userAdminAPI.list({ page: userCurrentPage, limit: userPageSize, status: "all" }),
          roleService.getRoles(),
          userAdminAPI.listInvitations(),
        ]);

        if (response.status === "rejected") throw response.reason;

        const responseVal = response.value;
        const remoteUsers = Array.isArray(responseVal) ? responseVal : responseVal.data || [];
        const pageInfo = responseVal.page_info || { total_pages: 1 };
        const rolesLookup = roles.status === "fulfilled" ? Object.fromEntries(roles.value.map((r) => [r.id, r])) : {};
        const mapped = remoteUsers.map((u) => {
          const roleIds = u.roleIds || [];
          const userRoles = roleIds
            .map((rid) => rolesLookup[rid])
            .filter(Boolean)
            .map((r) => ({ id: r.id, displayName: r.displayName || r.name, isDirector: r.isDirector || false }));
          return {
            id: String(u.id),
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status || (u.isActive !== false ? "active" : "inactive"),
            createdAt: (u.audit?.createdAt || u.createdAt || "").toString().substring(0, 10),
            lastLogin: u.lastLogin || u.audit?.lastLoginAt || null,
            roles: userRoles,
            permissions: typeof u.permissions === "string" ? JSON.parse(u.permissions) : u.permissions || {},
          };
        });
        setUsers(mapped);
        setUserTotalPages(pageInfo.total_pages || 1);
        setUserLoadingError(null);
        if (invites.status === "fulfilled") setInvitations(invites.value);
      } catch (e) {
        const errorMsg = e?.response?.data?.message || e?.message || "Failed to load users from backend";
        console.warn("Failed to load users from backend:", errorMsg);
        setUsers([]);
        setUserTotalPages(1);
        setUserLoadingError(errorMsg);
        notificationService.error(`User Management: ${errorMsg}`);
      }
    })();
  }, [userCurrentPage, userPageSize]);

  const loadRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      const roles = await roleService.getRoles();
      setAvailableRoles(roles);
    } catch (error) {
      console.error("Error loading roles:", error);
      notificationService.error("Failed to load roles");
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showManageRolesModal) loadRoles();
  }, [showManageRolesModal, loadRoles]);

  // Handlers
  const toggleUserStatus = async (userId) => {
    try {
      const u = users.find((x) => x.id === userId);
      if (!u) return;
      const newStatus = u.status === "active" ? "inactive" : "active";
      await userAdminAPI.update(userId, { status: newStatus });
      setUsers((prev) => prev.map((x) => (x.id === userId ? { ...x, status: newStatus } : x)));
      notificationService.success("User status updated");
    } catch (e) {
      notificationService.error(e?.response?.data?.error || e?.message || "Failed to update user");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await userAdminAPI.remove(userId);
      setUsers((prev) => prev.filter((x) => x.id !== userId));
      notificationService.success("User deleted successfully!");
    } catch (e) {
      notificationService.error(e?.response?.data?.error || e?.message || "Failed to delete user");
    }
  };

  const handleChangePassword = async () => {
    if (!passwordChangeModal.newPassword) {
      setPasswordChangeModal((prev) => ({ ...prev, error: "New password is required" }));
      return;
    }
    if (passwordChangeModal.newPassword.length < 8) {
      setPasswordChangeModal((prev) => ({ ...prev, error: "Password must be at least 8 characters" }));
      return;
    }
    if (passwordChangeModal.newPassword !== passwordChangeModal.confirmPassword) {
      setPasswordChangeModal((prev) => ({ ...prev, error: "Passwords do not match" }));
      return;
    }
    try {
      setPasswordChangeModal((prev) => ({ ...prev, loading: true, error: null }));
      await userAdminAPI.changePassword(passwordChangeModal.userId, {
        current_password: passwordChangeModal.currentPassword,
        new_password: passwordChangeModal.newPassword,
      });
      notificationService.success("Password changed successfully");
      setPasswordChangeModal({
        open: false,
        userId: null,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        loading: false,
        error: null,
      });
    } catch (error) {
      setPasswordChangeModal((prev) => ({
        ...prev,
        error:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to change password",
        loading: false,
      }));
    }
  };

  const handleSaveRole = async () => {
    try {
      if (!roleFormData.name || !roleFormData.displayName) {
        notificationService.warning("Please fill in all required fields");
        return;
      }
      const payload = {
        name: roleFormData.name,
        display_name: roleFormData.displayName,
        description: roleFormData.description,
        is_director: roleFormData.isDirector,
      };
      if (editingRole) {
        await roleService.updateRole(editingRole.id, payload);
        notificationService.success("Role updated successfully");
      } else {
        await roleService.createRole(payload);
        notificationService.success("Role created successfully");
      }
      setShowRoleDialog(false);
      await loadRoles();
    } catch (error) {
      console.error("Error saving role:", error);
      notificationService.error("Failed to save role");
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;
    try {
      await roleService.deleteRole(roleId);
      notificationService.success("Role deleted successfully");
      await loadRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
      notificationService.error("Failed to delete role");
    }
  };

  const handleInviteUser = async () => {
    const errors = validateUserForm(newUser, true);
    if (Object.keys(errors).length > 0) {
      setUserValidationErrors(errors);
      notificationService.warning("Please fix the validation errors");
      return;
    }
    try {
      setIsSubmittingUser(true);
      await userAdminAPI.invite({ name: newUser.name.trim(), email: newUser.email.trim(), role: "user" });
      notificationService.success(`Invitation sent to ${newUser.email.trim()}`);
      setShowAddUserModal(false);
      setUserValidationErrors({});
      setNewUser({ name: "", email: "", password: "", role_ids: [] });
      setSelectedUserRoles([]);
      const updated = await userAdminAPI.listInvitations();
      setInvitations(updated);
    } catch (error) {
      console.error("Error sending invitation:", error);
      const errorCode = error.response?.data?.errorCode;
      if (errorCode === "INVITE_EMAIL_FAILED") {
        notificationService.error("Invitation could not be sent — email delivery failed. Check SMTP settings.");
      } else {
        notificationService.error(error.response?.data?.error || "Failed to send invitation");
      }
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleUpdateUser = async () => {
    const errors = validateUserForm(editUserModal.user, true);
    if (Object.keys(errors).length > 0) {
      setUserValidationErrors(errors);
      notificationService.warning("Please fix the validation errors");
      return;
    }
    try {
      setIsSubmittingUser(true);
      await userAdminAPI.update(editUserModal.user.id, {
        name: editUserModal.user.name.trim(),
        email: editUserModal.user.email.trim(),
      });
      await roleService.replaceUserRoles(editUserModal.user.id, selectedUserRoles);
      notificationService.success("User updated successfully!");
      setEditUserModal({ open: false, user: null });
      setUserValidationErrors({});
      // Refresh user list
      const response = await userAdminAPI.list({ page: userCurrentPage, limit: userPageSize });
      const remoteUsers = Array.isArray(response) ? response : response.data || [];
      const mapped = await Promise.all(
        remoteUsers.map(async (u) => {
          const userPerms = await roleService.getUserPermissions(u.id);
          return {
            id: String(u.id),
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status || (u.isActive !== false ? "active" : "inactive"),
            createdAt: (u.audit?.createdAt || u.createdAt || "").toString().substring(0, 10),
            lastLogin: u.lastLogin || u.audit?.lastLoginAt || null,
            roles: userPerms.roles || [],
          };
        })
      );
      setUsers(mapped);
    } catch (error) {
      console.error("Error updating user:", error);
      notificationService.error(error.response?.data?.error || "Failed to update user");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleGrantCustomPermissions = async () => {
    try {
      if (customPermission.permission_keys.length === 0 || !customPermission.reason) {
        notificationService.warning("Please select at least one permission and provide a reason");
        return;
      }
      const results = await Promise.allSettled(
        customPermission.permission_keys.map((permKey) =>
          roleService.grantCustomPermission(
            customPermissionModal.userId,
            permKey,
            customPermission.reason,
            customPermission.expires_at || null
          )
        )
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed === 0)
        notificationService.success(`Successfully granted ${succeeded} permission${succeeded !== 1 ? "s" : ""}!`);
      else if (succeeded > 0)
        notificationService.warning(
          `Granted ${succeeded} permission${succeeded !== 1 ? "s" : ""}, but ${failed} failed`
        );
      else notificationService.error("Failed to grant permissions");
      setCustomPermissionModal({ open: false, userId: null });
    } catch (error) {
      console.error("Error granting permissions:", error);
      notificationService.error(error.response?.data?.error || "Failed to grant permissions");
    }
  };

  // ===================== RENDER =====================

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:min-h-[600px]">
      {/* Left Column */}
      <div className="lg:w-3/5 flex-shrink-0">
        <SettingsPaper>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                User Management
              </h3>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  startIcon={<Shield size={16} />}
                  onClick={() => setShowManageRolesModal(true)}
                >
                  Manage Roles
                </Button>
                <Button
                  variant="primary"
                  startIcon={<Mail size={16} />}
                  onClick={() => {
                    setNewUser({ name: "", email: "", password: "", role_ids: [] });
                    setSelectedUserRoles([]);
                    setShowAddUserModal(true);
                  }}
                >
                  Invite User
                </Button>
              </div>
            </div>

            <Input
              placeholder="Search users by name, email, or role..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              startIcon={<Users size={16} />}
              className="max-w-md mb-6"
            />

            {filteredUsers.length > 0 && (
              <div className={`text-sm mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? "s" : ""}
                {userSearchTerm && " (filtered)"}
              </div>
            )}

            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                  <div className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {userLoadingError ? (
                      <>
                        <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
                        <div className="text-red-600 font-semibold mb-2">Failed to load users</div>
                        <div className="text-sm text-gray-600">{userLoadingError}</div>
                      </>
                    ) : userSearchTerm ? (
                      <div>No users found matching your search</div>
                    ) : (
                      <div>No users yet. Add your first user to get started.</div>
                    )}
                  </div>
                </div>
              ) : null}
              {filteredUsers.map((user) => (
                <SettingsCard key={user.id} className={user.status === "active" ? "" : "opacity-60"}>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg ${isDarkMode ? "bg-teal-600" : "bg-teal-500"}`}
                        >
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <h4 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {user.name || "Unnamed User"}
                          </h4>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {user.email || "No email"}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role, idx) => (
                                <span
                                  key={role.id || `role-${idx}`}
                                  className={`inline-block px-2 py-1 text-xs font-medium rounded border ${
                                    role.isDirector
                                      ? isDarkMode
                                        ? "text-purple-400 border-purple-600 bg-purple-900/20"
                                        : "text-purple-600 border-purple-300 bg-purple-50"
                                      : isDarkMode
                                        ? "text-teal-400 border-teal-600 bg-teal-900/20"
                                        : "text-teal-600 border-teal-300 bg-teal-50"
                                  }`}
                                >
                                  {role.displayName}
                                </span>
                              ))
                            ) : (
                              <span
                                className={`inline-block px-2 py-1 text-xs font-medium rounded border ${isDarkMode ? "text-gray-400 border-gray-600 bg-gray-800" : "text-gray-600 border-gray-300 bg-gray-50"}`}
                              >
                                No roles assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={user.status === "active"}
                          onChange={() => toggleUserStatus(user.id)}
                          label={user.status === "active" ? "Active" : "Inactive"}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setViewPermissionsModal({
                                open: true,
                                userId: user.id,
                                userName: user.name,
                                rolePermissions: [],
                                customGrants: [],
                                loading: true,
                              });
                              const userPermissions = await roleService.getUserPermissions(user.id);
                              setViewPermissionsModal((prev) => ({
                                ...prev,
                                rolePermissions: userPermissions.roles || [],
                                customGrants: userPermissions.customPermissions || [],
                                loading: false,
                              }));
                            } catch (error) {
                              console.error("Error loading permissions:", error);
                              notificationService.error("Failed to load permissions");
                              setViewPermissionsModal((prev) => ({ ...prev, loading: false }));
                            }
                          }}
                          className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "hover:bg-gray-700 text-green-400" : "hover:bg-gray-100 text-green-600"}`}
                          title="View All Permissions"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const userPermissions = await roleService.getUserPermissions(user.id);
                              setEditUserModal({
                                open: true,
                                user: {
                                  ...user,
                                  role_ids: userPermissions.roles.map((r) => r.id),
                                  roles: userPermissions.roles,
                                },
                              });
                              setSelectedUserRoles(userPermissions.roles.map((r) => r.id));
                            } catch (error) {
                              console.error("Error loading user data:", error);
                              notificationService.error("Failed to load user data");
                            }
                          }}
                          className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-700"}`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPasswordChangeModal({
                              open: true,
                              userId: user.id,
                              currentPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                              loading: false,
                              error: null,
                            })
                          }
                          className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "hover:bg-gray-700 text-orange-400" : "hover:bg-gray-100 text-orange-600"}`}
                          title="Change Password"
                        >
                          <Key size={16} />
                        </button>
                        {isDirector && (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const logs = await roleService.getAuditLog(user.id, 50);
                                  setAuditLogModal({ open: true, userId: user.id, logs });
                                } catch (error) {
                                  console.error("Error loading audit log:", error);
                                  notificationService.error("Failed to load audit log");
                                }
                              }}
                              className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "hover:bg-gray-700 text-blue-400" : "hover:bg-gray-100 text-blue-600"}`}
                              title="View Audit Log"
                            >
                              <History size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomPermissionModal({ open: true, userId: user.id });
                                setCustomPermission({ permission_keys: [], reason: "", expires_at: null });
                                setPermissionSearch("");
                                setExpandedModules({});
                              }}
                              className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "hover:bg-gray-700 text-yellow-400" : "hover:bg-gray-100 text-yellow-600"}`}
                              title="Grant Custom Permissions"
                            >
                              <UserCheck size={16} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteUser(user.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <hr className={`my-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Created</p>
                        <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {formatDateOnly(user.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Last Login</p>
                        <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {formatDateTime(user.lastLogin)}
                        </p>
                      </div>
                    </div>
                  </div>
                </SettingsCard>
              ))}
            </div>

            {/* Pagination */}
            {userTotalPages > 1 && (
              <div
                className={`flex items-center justify-between mt-6 pt-6 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
              >
                <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Page {userCurrentPage} of {userTotalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUserCurrentPage(Math.max(1, userCurrentPage - 1))}
                    disabled={userCurrentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${userCurrentPage === 1 ? (isDarkMode ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed") : isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserCurrentPage(Math.min(userTotalPages, userCurrentPage + 1))}
                    disabled={userCurrentPage === userTotalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${userCurrentPage === userTotalPages ? (isDarkMode ? "bg-gray-800 text-gray-600 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed") : isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300"}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </SettingsPaper>

        {/* Pending Invitations */}
        {invitations.filter((inv) => inv.status === "pending").length > 0 && (
          <SettingsPaper className="mt-6">
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Pending Invitations
              </h3>
              <div className="space-y-3">
                {invitations
                  .filter((inv) => inv.status === "pending")
                  .map((inv) => (
                    <div
                      key={inv.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {inv.name || inv.email}
                          </span>
                          {inv.emailStatus === "SENT" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle size={12} /> Email Sent
                            </span>
                          )}
                          {inv.emailStatus === "FAILED" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              <AlertCircle size={12} /> Email Failed
                            </span>
                          )}
                          {(!inv.emailStatus || inv.emailStatus === "PENDING") && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                              <Clock size={12} /> Pending
                            </span>
                          )}
                        </div>
                        <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {inv.email} — {inv.role}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                            Invited {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : ""}
                            {inv.invitedByName ? ` by ${inv.invitedByName}` : ""}
                          </span>
                          {inv.expiresAt &&
                            (() => {
                              const cd = formatCountdown(inv.expiresAt);
                              return (
                                <span
                                  className={`text-xs font-medium ${cd.expired ? "text-red-500" : cd.urgent ? "text-yellow-500" : "text-green-500"}`}
                                >
                                  {cd.text}
                                </span>
                              );
                            })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await userAdminAPI.resendInvite(inv.email);
                              notificationService.success(`Invitation resent to ${inv.email}`);
                              const updated = await userAdminAPI.listInvitations();
                              setInvitations(updated);
                            } catch (err) {
                              const errorCode = err.response?.data?.errorCode;
                              notificationService.error(
                                errorCode === "INVITE_EMAIL_FAILED"
                                  ? "Email delivery failed. Check SMTP settings."
                                  : err.response?.data?.error || "Failed to resend invitation"
                              );
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isDarkMode ? "bg-teal-900/30 text-teal-400 hover:bg-teal-900/50 border border-teal-700" : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"}`}
                        >
                          Resend
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await userAdminAPI.revokeInvite(inv.id);
                              notificationService.success("Invitation revoked");
                              const updated = await userAdminAPI.listInvitations();
                              setInvitations(updated);
                            } catch (err) {
                              notificationService.error(err.response?.data?.error || "Failed to revoke invitation");
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-700" : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"}`}
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </SettingsPaper>
        )}

        {/* Expired Invitations */}
        {invitations.filter((inv) => inv.status === "expired").length > 0 && (
          <SettingsPaper className="mt-6">
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Expired Invitations
              </h3>
              <div className="space-y-3">
                {invitations
                  .filter((inv) => inv.status === "expired")
                  .map((inv) => (
                    <div
                      key={inv.id}
                      className={`flex items-center justify-between p-4 rounded-lg border opacity-60 ${isDarkMode ? "bg-gray-800/30 border-gray-700" : "bg-gray-50 border-gray-200"}`}
                    >
                      <div>
                        <div className={`font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {inv.name || inv.email}
                        </div>
                        <div className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                          {inv.email} — {inv.role}
                        </div>
                        {inv.expiresAt && (
                          <div className="text-xs text-red-500 mt-1">{formatCountdown(inv.expiresAt).text}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await userAdminAPI.resendInvite(inv.email);
                            notificationService.success(`Invitation resent to ${inv.email}`);
                            const updated = await userAdminAPI.listInvitations();
                            setInvitations(updated);
                          } catch (err) {
                            const errorCode = err.response?.data?.errorCode;
                            notificationService.error(
                              errorCode === "INVITE_EMAIL_FAILED"
                                ? "Email delivery failed. Check SMTP settings."
                                : err.response?.data?.error || "Failed to resend invitation"
                            );
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isDarkMode ? "bg-teal-900/30 text-teal-400 hover:bg-teal-900/50 border border-teal-700" : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"}`}
                      >
                        Resend
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </SettingsPaper>
        )}
      </div>

      {/* Right Column - Help Panel */}
      <div className="lg:w-2/5 lg:self-stretch lg:min-h-[600px]">
        <div className="h-full max-h-[calc(100vh-120px)] overflow-y-auto lg:sticky lg:top-6">
          <RolesHelpPanel />
        </div>
      </div>

      {/* ========== MODALS ========== */}

      {/* Manage Roles Modal */}
      {showManageRolesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl max-h-[90vh] flex flex-col`}
          >
            <div className={`p-6 border-b flex-shrink-0 ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Shield className={isDarkMode ? "text-teal-400" : "text-teal-600"} size={24} />
                  <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Manage Roles
                  </h3>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    startIcon={<Plus size={16} />}
                    onClick={() => {
                      setEditingRole(null);
                      setRoleFormData({ name: "", displayName: "", description: "", isDirector: false });
                      setShowRoleDialog(true);
                    }}
                  >
                    Create Role
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowManageRolesModal(false)}
                    className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                  >
                    <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {rolesLoading ? (
                <div className="flex justify-center items-center py-12">
                  <CircularProgress size={32} />
                </div>
              ) : availableRoles.length === 0 ? (
                <div className="text-center py-12">
                  <Shield size={48} className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                  <p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    No roles found. Create your first role to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableRoles.map((role) => (
                    <SettingsCard key={role.id}>
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {role.displayName || role.display_name}
                              </h4>
                              {(role.isDirector || role.is_director) && (
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded ${isDarkMode ? "bg-purple-900/30 text-purple-400 border border-purple-600" : "bg-purple-100 text-purple-700 border border-purple-300"}`}
                                >
                                  Director
                                </span>
                              )}
                              {(role.isSystem || role.is_system) && (
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded ${isDarkMode ? "bg-blue-900/30 text-blue-400 border border-blue-600" : "bg-blue-100 text-blue-700 border border-blue-300"}`}
                                >
                                  System
                                </span>
                              )}
                            </div>
                            <p className={`text-sm mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>
                              {role.name}
                            </p>
                            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {role.description || "No description"}
                            </p>
                            <div className="flex gap-4 mt-3">
                              <div className="flex items-center gap-2">
                                <Users size={14} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
                                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                  {role.userCount || role.user_count || 0} users
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Shield size={14} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
                                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                  {role.permissionCount || role.permission_count || 0} permissions
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRole(role);
                                setRoleFormData({
                                  name: role.name,
                                  displayName: role.displayName || role.display_name,
                                  description: role.description || "",
                                  isDirector: role.isDirector || role.is_director || false,
                                });
                                setShowRoleDialog(true);
                              }}
                              className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-700"}`}
                              title="Edit Role"
                            >
                              <Edit size={16} />
                            </button>
                            {!(role.isSystem || role.is_system) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                                title="Delete Role"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </SettingsCard>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Role Dialog */}
      {showRoleDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className={`w-full max-w-md rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl`}>
            <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {editingRole ? "Edit Role" : "Create New Role"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowRoleDialog(false)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <TextField
                label="Role Name"
                value={roleFormData.name}
                onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                placeholder="e.g., sales_manager"
                helperText="Unique identifier (lowercase, underscores allowed)"
              />
              <TextField
                label="Display Name"
                value={roleFormData.displayName}
                onChange={(e) => setRoleFormData({ ...roleFormData, displayName: e.target.value })}
                placeholder="e.g., Sales Manager"
                helperText="Friendly name shown to users"
              />
              <TextField
                label="Description"
                value={roleFormData.description}
                onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                placeholder="Brief description of this role's purpose"
                multiline
                rows={3}
              />
              <div className="flex items-center gap-3">
                <Switch
                  checked={roleFormData.isDirector}
                  onChange={(e) => setRoleFormData({ ...roleFormData, isDirector: e.target.checked })}
                  label="Director Role"
                />
                <div>
                  <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Director Role
                  </span>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Grants elevated privileges and access to sensitive operations
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"} flex gap-3 justify-end`}
            >
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRole}>{editingRole ? "Update" : "Create"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl max-h-[90vh] overflow-y-auto`}
          >
            <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Invite New User
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                </button>
              </div>
            </div>
            <form className="p-6" onSubmit={(e) => e.preventDefault()}>
              <div
                className={`mb-4 p-3 rounded-lg border text-sm flex items-center gap-2 ${isDarkMode ? "bg-teal-900/20 border-teal-700 text-teal-300" : "bg-teal-50 border-teal-200 text-teal-700"}`}
              >
                <Mail size={16} />
                <span>An invitation email will be sent to this address. The user will set their own password.</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Full Name"
                  value={newUser.name}
                  onChange={(e) => {
                    setNewUser({ ...newUser, name: e.target.value });
                    if (userValidationErrors.name) setUserValidationErrors({ ...userValidationErrors, name: null });
                  }}
                  placeholder="Enter full name"
                  error={userValidationErrors.name}
                  helperText={userValidationErrors.name}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => {
                    setNewUser({ ...newUser, email: e.target.value });
                    if (userValidationErrors.email) setUserValidationErrors({ ...userValidationErrors, email: null });
                  }}
                  placeholder="Enter email address"
                  error={userValidationErrors.email}
                  helperText={userValidationErrors.email}
                />
              </div>
              <div className="mt-6">
                <div className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                  Assign Roles (select multiple) <span className="text-red-500">*</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableRoles.map((role) => (
                    <label
                      key={role.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 flex items-center justify-between ${selectedUserRoles.includes(role.id) ? (isDarkMode ? "border-teal-500 bg-teal-900/20" : "border-teal-500 bg-teal-50") : isDarkMode ? "border-gray-600 bg-gray-800 hover:border-gray-500" : "border-gray-300 bg-white hover:border-gray-400"}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserRoles.includes(role.id)}
                        onChange={() => {
                          setSelectedUserRoles(
                            selectedUserRoles.includes(role.id)
                              ? selectedUserRoles.filter((id) => id !== role.id)
                              : [...selectedUserRoles, role.id]
                          );
                          if (userValidationErrors.roles)
                            setUserValidationErrors({ ...userValidationErrors, roles: null });
                        }}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <h5 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {role.displayName}
                        </h5>
                        {role.description && (
                          <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {role.description}
                          </p>
                        )}
                      </div>
                      {selectedUserRoles.includes(role.id) && (
                        <CheckCircle size={20} className="text-teal-500 flex-shrink-0 ml-2" />
                      )}
                    </label>
                  ))}
                </div>
                <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Click on roles to select/deselect. Users can have multiple roles.
                </p>
                {userValidationErrors.roles && (
                  <p className="text-red-500 text-sm mt-2">{userValidationErrors.roles}</p>
                )}
              </div>
            </form>
            <div
              className={`p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"} flex gap-3 justify-end`}
            >
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddUserModal(false);
                  setUserValidationErrors({});
                }}
                disabled={isSubmittingUser}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInviteUser}
                disabled={isSubmittingUser}
                startIcon={isSubmittingUser ? <CircularProgress size={16} /> : <Mail size={20} />}
              >
                Send Invitation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModal.open && editUserModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl max-h-[90vh] overflow-y-auto`}
          >
            <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Edit User</h3>
                <button
                  type="button"
                  onClick={() => setEditUserModal({ open: false, user: null })}
                  className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Full Name"
                  value={editUserModal.user.name}
                  onChange={(e) => {
                    setEditUserModal((prev) => ({ ...prev, user: { ...prev.user, name: e.target.value } }));
                    if (userValidationErrors.name) setUserValidationErrors({ ...userValidationErrors, name: null });
                  }}
                  placeholder="Enter full name"
                  error={userValidationErrors.name}
                  helperText={userValidationErrors.name}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={editUserModal.user.email}
                  onChange={(e) => {
                    setEditUserModal((prev) => ({ ...prev, user: { ...prev.user, email: e.target.value } }));
                    if (userValidationErrors.email) setUserValidationErrors({ ...userValidationErrors, email: null });
                  }}
                  placeholder="Enter email address"
                  error={userValidationErrors.email}
                  helperText={userValidationErrors.email}
                />
              </div>
              <div className="mt-6">
                <div className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                  Assigned Roles (select multiple) <span className="text-red-500">*</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableRoles.map((role) => (
                    <button
                      type="button"
                      key={role.id}
                      onClick={() => {
                        setSelectedUserRoles(
                          selectedUserRoles.includes(role.id)
                            ? selectedUserRoles.filter((id) => id !== role.id)
                            : [...selectedUserRoles, role.id]
                        );
                      }}
                      aria-pressed={selectedUserRoles.includes(role.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 text-left ${selectedUserRoles.includes(role.id) ? (isDarkMode ? "border-teal-500 bg-teal-900/20" : "border-teal-500 bg-teal-50") : isDarkMode ? "border-gray-600 bg-gray-800 hover:border-gray-500" : "border-gray-300 bg-white hover:border-gray-400"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {role.displayName}
                          </h5>
                          {role.description && (
                            <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {role.description}
                            </p>
                          )}
                        </div>
                        {selectedUserRoles.includes(role.id) && (
                          <CheckCircle size={20} className="text-teal-500 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {userValidationErrors.roles && (
                  <p className="text-red-500 text-sm mt-2">{userValidationErrors.roles}</p>
                )}
              </div>
            </div>
            <div
              className={`p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"} flex gap-3 justify-end`}
            >
              <Button
                variant="outline"
                onClick={() => {
                  setEditUserModal({ open: false, user: null });
                  setUserValidationErrors({});
                }}
                disabled={isSubmittingUser}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={isSubmittingUser}
                startIcon={isSubmittingUser ? <CircularProgress size={16} /> : <Save size={20} />}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Permission Modal */}
      {customPermissionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl`}
          >
            <div className={`p-6 border-b flex-shrink-0 ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Grant Custom Permissions
                  </h3>
                  <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Select multiple permissions to grant temporary access
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomPermissionModal({ open: false, userId: null })}
                  className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div
                className={`mb-4 p-4 rounded-lg border-l-4 ${isDarkMode ? "bg-yellow-900/20 border-yellow-500 text-yellow-300" : "bg-yellow-50 border-yellow-500 text-yellow-800"}`}
              >
                <div className="flex items-start">
                  <Shield size={20} className="mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Director Override</p>
                    <p>Grant one or more permissions to users temporarily.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {customPermission.permission_keys.length > 0 && (
                  <div
                    className={`p-3 rounded-lg ${isDarkMode ? "bg-teal-900/20 border border-teal-700/30" : "bg-teal-50 border border-teal-200"}`}
                  >
                    <p className={`text-sm font-medium ${isDarkMode ? "text-teal-400" : "text-teal-700"}`}>
                      {customPermission.permission_keys.length} permission
                      {customPermission.permission_keys.length !== 1 ? "s" : ""} selected
                    </p>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="permission-search"
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Search Permissions
                  </label>
                  <input
                    id="permission-search"
                    type="text"
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    placeholder="Search by permission name or description..."
                    className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 ${isDarkMode ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
                  />
                </div>
                <div>
                  <div className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                    Select Permissions
                  </div>
                  <div
                    className={`border rounded-lg max-h-64 overflow-y-auto ${isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-white"}`}
                  >
                    {Object.keys(allPermissions).length === 0 ? (
                      <div className="p-4 text-center">
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Loading permissions...
                        </p>
                      </div>
                    ) : (
                      Object.entries(allPermissions)
                        .filter(([module, permissions]) => {
                          if (!permissionSearch) return true;
                          const search = permissionSearch.toLowerCase();
                          return (
                            module.toLowerCase().includes(search) ||
                            permissions.some(
                              (p) =>
                                p.description.toLowerCase().includes(search) || p.key.toLowerCase().includes(search)
                            )
                          );
                        })
                        .map(([module, permissions]) => {
                          const filteredPerms = permissions.filter((p) => {
                            if (!permissionSearch) return true;
                            const search = permissionSearch.toLowerCase();
                            return p.description.toLowerCase().includes(search) || p.key.toLowerCase().includes(search);
                          });
                          if (filteredPerms.length === 0) return null;
                          const isExpanded = expandedModules[module] !== false;
                          const modulePerms = filteredPerms.map((p) => p.key);
                          const allSelected = modulePerms.every((k) => customPermission.permission_keys.includes(k));
                          const someSelected = modulePerms.some((k) => customPermission.permission_keys.includes(k));
                          return (
                            <div
                              key={module}
                              className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} last:border-b-0`}
                            >
                              <button
                                type="button"
                                className={`w-full flex items-center justify-between p-3 cursor-pointer transition-colors border-0 bg-transparent text-left ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                                onClick={() => setExpandedModules((prev) => ({ ...prev, [module]: !isExpanded }))}
                                aria-expanded={isExpanded}
                              >
                                <div className="flex items-center flex-1">
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(input) => {
                                      if (input) input.indeterminate = someSelected && !allSelected;
                                    }}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      const newKeys = e.target.checked
                                        ? [...new Set([...customPermission.permission_keys, ...modulePerms])]
                                        : customPermission.permission_keys.filter((k) => !modulePerms.includes(k));
                                      setCustomPermission({ ...customPermission, permission_keys: newKeys });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={`Select all ${module} permissions`}
                                    className="mr-3 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                  />
                                  <span
                                    className={`font-medium uppercase text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
                                  >
                                    {module}
                                  </span>
                                  <span className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    ({filteredPerms.length})
                                  </span>
                                </div>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                              {isExpanded && (
                                <div className={isDarkMode ? "bg-gray-900/50" : "bg-gray-50"}>
                                  {filteredPerms.map((perm) => (
                                    <label
                                      key={perm.key}
                                      className={`flex items-start p-3 pl-10 cursor-pointer transition-colors ${isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                                      aria-label={perm.description}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={customPermission.permission_keys.includes(perm.key)}
                                        onChange={(e) => {
                                          const newKeys = e.target.checked
                                            ? [...customPermission.permission_keys, perm.key]
                                            : customPermission.permission_keys.filter((k) => k !== perm.key);
                                          setCustomPermission({ ...customPermission, permission_keys: newKeys });
                                        }}
                                        className="mt-0.5 mr-3 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                      />
                                      <div className="flex-1">
                                        <div
                                          className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                                        >
                                          {perm.description}
                                        </div>
                                        <div
                                          className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}
                                        >
                                          {perm.key}
                                        </div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
                <TextField
                  label="Reason (required)"
                  value={customPermission.reason}
                  onChange={(e) => setCustomPermission({ ...customPermission, reason: e.target.value })}
                  placeholder="Explain why this permission is needed"
                  multiline
                  rows={2}
                />
                <div>
                  <label
                    htmlFor="permission-expires-at"
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                  >
                    Expires At (optional)
                  </label>
                  <input
                    id="permission-expires-at"
                    type="datetime-local"
                    value={customPermission.expires_at || ""}
                    onChange={(e) => setCustomPermission({ ...customPermission, expires_at: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Leave blank for permanent access
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`p-6 border-t flex-shrink-0 ${isDarkMode ? "border-[#37474F]" : "border-gray-200"} flex gap-3 justify-end`}
            >
              <Button variant="outline" onClick={() => setCustomPermissionModal({ open: false, userId: null })}>
                Cancel
              </Button>
              <Button
                onClick={handleGrantCustomPermissions}
                startIcon={<Shield size={20} />}
                disabled={customPermission.permission_keys.length === 0}
              >
                Grant {customPermission.permission_keys.length > 0 ? `${customPermission.permission_keys.length} ` : ""}
                Permission{customPermission.permission_keys.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {auditLogModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-4xl rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl max-h-[90vh] overflow-y-auto`}
          >
            <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Permission Audit Log
                </h3>
                <button
                  type="button"
                  onClick={() => setAuditLogModal({ open: false, userId: null, logs: [] })}
                  className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                </button>
              </div>
            </div>
            <div className="p-6">
              {auditLogModal.logs.length === 0 ? (
                <div className="text-center py-12">
                  <History size={48} className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>No audit log entries found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogModal.logs.map((log, index) => (
                    <div
                      key={log.id || `log-${index}`}
                      className={`p-4 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                          <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {formatDateTime(log.createdAt)}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${log.action === "grant" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : log.action === "revoke" ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"}`}
                        >
                          {log.action.toUpperCase()}
                        </span>
                      </div>
                      <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        <strong>Changed by:</strong> {log.changedByName}
                      </p>
                      {log.details && (
                        <div className={`mt-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={`p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"} flex justify-end`}>
              <Button variant="outline" onClick={() => setAuditLogModal({ open: false, userId: null, logs: [] })}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View All Permissions Modal */}
      {viewPermissionsModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl max-h-[90vh] flex flex-col`}
          >
            <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    User Permissions
                  </h3>
                  <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {viewPermissionsModal.userName || "User"} - Complete Permission Breakdown
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setViewPermissionsModal({
                      open: false,
                      userId: null,
                      userName: "",
                      rolePermissions: [],
                      customGrants: [],
                      loading: false,
                    })
                  }
                  className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {viewPermissionsModal.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
                </div>
              ) : (
                <div className="space-y-6">
                  {viewPermissionsModal.rolePermissions.length > 0 && (
                    <div>
                      <div className="flex items-center mb-4">
                        <Shield className={`mr-2 ${isDarkMode ? "text-teal-400" : "text-teal-600"}`} size={20} />
                        <h4 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          From Assigned Roles
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {viewPermissionsModal.rolePermissions.map((role, idx) => (
                          <div
                            key={role.id || `role-${idx}`}
                            className={`rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"} p-3`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const RoleIcon = getRoleIcon(role.name);
                                  return (
                                    <RoleIcon size={18} className={isDarkMode ? "text-teal-400" : "text-teal-600"} />
                                  );
                                })()}
                                <h5 className={`font-medium text-base ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                  {role.displayName}
                                </h5>
                              </div>
                              {role.isDirector && (
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded ${isDarkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-700"}`}
                                >
                                  Director
                                </span>
                              )}
                            </div>
                            {role.description && (
                              <p
                                className={`text-sm leading-snug mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                              >
                                {role.description}
                              </p>
                            )}
                            {role.permissions && role.permissions.length > 0 ? (
                              <div className="grid grid-cols-1 gap-1.5">
                                {role.permissions.map((perm, permIdx) => {
                                  const PermIcon = getPermissionIcon(perm.permissionKey || perm.description);
                                  return (
                                    <div
                                      key={perm.id || `perm-${permIdx}`}
                                      className={`flex items-center text-sm leading-tight ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                                    >
                                      <PermIcon size={13} className="mr-1.5 text-green-500 flex-shrink-0" />
                                      <span className="truncate" title={perm.description}>
                                        {perm.description || perm.permissionKey}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                No specific permissions defined (may have full access)
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewPermissionsModal.customGrants && viewPermissionsModal.customGrants.length > 0 && (
                    <div>
                      <div className="flex items-center mb-4">
                        <UserCheck className={`mr-2 ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`} size={20} />
                        <h4 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          Custom Permission Grants
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {viewPermissionsModal.customGrants.map((grant, idx) => (
                          <div
                            key={grant.id || `grant-${idx}`}
                            className={`rounded-lg border ${isDarkMode ? "bg-yellow-900/10 border-yellow-700/30" : "bg-yellow-50 border-yellow-200"} p-4`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <CheckCircle size={14} className="mr-2 text-yellow-500" />
                                  <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {grant.permissionKey}
                                  </span>
                                </div>
                                {grant.reason && (
                                  <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    <strong>Reason:</strong> {grant.reason}
                                  </p>
                                )}
                                {grant.grantedByName && (
                                  <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    <strong>Granted by:</strong> {grant.grantedByName}
                                  </p>
                                )}
                              </div>
                              {grant.expires_at && (
                                <div className="ml-4">
                                  <span
                                    className={`inline-flex items-center px-2 py-1 text-xs rounded ${new Date(grant.expires_at) < new Date() ? (isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700") : isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700"}`}
                                  >
                                    <Clock size={12} className="mr-1" />
                                    Expires: {formatDateDMY(grant.expires_at)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewPermissionsModal.rolePermissions.length === 0 &&
                    (!viewPermissionsModal.customGrants || viewPermissionsModal.customGrants.length === 0) && (
                      <div className="text-center py-12">
                        <Shield
                          size={48}
                          className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}
                        />
                        <h4 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          No Permissions Assigned
                        </h4>
                        <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          This user has no roles or custom permissions assigned.
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>
            <div className={`p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"} flex justify-end`}>
              <Button
                variant="outline"
                onClick={() =>
                  setViewPermissionsModal({
                    open: false,
                    userId: null,
                    userName: "",
                    rolePermissions: [],
                    customGrants: [],
                    loading: false,
                  })
                }
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {passwordChangeModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"} shadow-2xl`}>
            <div className={`p-6 border-b flex-shrink-0 ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Key className={isDarkMode ? "text-teal-400" : "text-teal-600"} size={24} />
                  <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Change Password
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPasswordChangeModal({
                      open: false,
                      userId: null,
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                      loading: false,
                      error: null,
                    })
                  }
                  className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {passwordChangeModal.error && (
                <div
                  className={`p-3 rounded-lg ${isDarkMode ? "bg-red-900/20 text-red-400 border border-red-900" : "bg-red-50 text-red-700 border border-red-200"}`}
                >
                  {passwordChangeModal.error}
                </div>
              )}
              <div>
                <label
                  htmlFor="current-password"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={passwordChangeModal.currentPassword}
                  onChange={(e) => setPasswordChangeModal((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-600"} focus:outline-none`}
                  placeholder="Enter current password"
                  disabled={passwordChangeModal.loading}
                />
              </div>
              <div>
                <label
                  htmlFor="new-password"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={passwordChangeModal.newPassword}
                  onChange={(e) => setPasswordChangeModal((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-600"} focus:outline-none`}
                  placeholder="Enter new password (min 8 chars)"
                  disabled={passwordChangeModal.loading}
                />
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={passwordChangeModal.confirmPassword}
                  onChange={(e) => setPasswordChangeModal((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-teal-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-600"} focus:outline-none`}
                  placeholder="Confirm new password"
                  disabled={passwordChangeModal.loading}
                />
              </div>
            </div>
            <div
              className={`p-6 border-t flex gap-3 justify-end ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}
            >
              <button
                type="button"
                onClick={() =>
                  setPasswordChangeModal({
                    open: false,
                    userId: null,
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                    loading: false,
                    error: null,
                  })
                }
                disabled={passwordChangeModal.loading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600" : "bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"}`}
              >
                Cancel
              </button>
              <Button onClick={handleChangePassword} disabled={passwordChangeModal.loading}>
                {passwordChangeModal.loading ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTab;
