import { Check, Loader2, Search, Shield, TableProperties, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { notificationService } from "../services/notificationService";
import { permissionsMatrixService } from "../services/permissionsMatrixService";
import "./PermissionsMatrix.css";

const MODULE_PRESETS = {
  Sales: ["invoices", "quotations", "delivery_notes", "credit_notes", "customers"],
  Purchase: ["purchase_orders", "suppliers", "supplier_bills", "debit_notes", "supplier_quotations"],
  Inventory: ["inventory", "warehouses", "stock_movements", "stock_batches", "batch_reservations", "grns"],
  Finance: ["payments", "payables", "receivables", "advance_payments", "commissions", "operating_expenses"],
  Admin: ["users", "roles", "company_settings", "audit_logs", "audit_hub"],
};

const MODULE_ROUTES = {
  invoices: "/app/invoices",
  quotations: "/app/quotations",
  delivery_notes: "/app/delivery-notes",
  credit_notes: "/app/credit-notes",
  customers: "/app/customers",
  products: "/app/products",
  purchase_orders: "/app/purchases",
  suppliers: "/app/suppliers",
  payments: "/app/receivables",
  payables: "/app/payables",
  inventory: "/app/inventory",
  warehouses: "/app/warehouses",
  stock_movements: "/app/stock-movements",
};

export default function PermissionsMatrix() {
  const { isDarkMode } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [hideInactive, setHideInactive] = useState(true);
  const [activeModules, setActiveModules] = useState(null); // null = all
  const [selectedRow, setSelectedRow] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [dialogReason, setDialogReason] = useState("");
  const tableRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await permissionsMatrixService.getMatrix();
      setData(result);
    } catch (err) {
      notificationService.error("Failed to load permissions matrix");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    let users = data.users;
    if (hideInactive) users = users.filter((u) => u.is_active);
    if (search) {
      const q = search.toLowerCase();
      users = users.filter((u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return users;
  }, [data, hideInactive, search]);

  const filteredPermissions = useMemo(() => {
    if (!data) return [];
    if (!activeModules) return data.permissions;
    return data.permissions.filter((p) => activeModules.includes(p.module));
  }, [data, activeModules]);

  const moduleList = useMemo(() => {
    if (!data) return [];
    return Object.keys(data.modules).sort();
  }, [data]);

  const moduleGroups = useMemo(() => {
    const groups = [];
    let lastModule = null;
    for (const p of filteredPermissions) {
      if (p.module !== lastModule) {
        groups.push({ module: p.module, permissions: [p] });
        lastModule = p.module;
      } else {
        groups[groups.length - 1].permissions.push(p);
      }
    }
    return groups;
  }, [filteredPermissions]);

  const toggleModule = (mod) => {
    setActiveModules((prev) => {
      if (!prev) return [mod];
      if (prev.includes(mod)) {
        const next = prev.filter((m) => m !== mod);
        return next.length === 0 ? null : next;
      }
      return [...prev, mod];
    });
  };

  const applyPreset = (presetName) => {
    setActiveModules(MODULE_PRESETS[presetName] || null);
  };

  const getCellState = (user, permKey) => {
    if (user.is_director) return "director";
    const custom = user.custom_permissions[permKey];
    if (custom) return custom.action === "grant" ? "custom_grant" : "custom_deny";
    const roleGrants = user.role_grants[permKey];
    if (roleGrants && roleGrants.length > 0) return "role_granted";
    return "no_access";
  };

  const getCellTooltip = (user, permKey) => {
    if (user.is_director) return "Director: Full Access";
    const custom = user.custom_permissions[permKey];
    if (custom) {
      const label = custom.action === "grant" ? "Custom grant" : "Custom deny";
      const by = custom.granted_by_name ? ` by ${custom.granted_by_name}` : "";
      const reason = custom.reason ? `\nReason: ${custom.reason}` : "";
      return `${label}${by}${reason}`;
    }
    const roleGrants = user.role_grants[permKey];
    if (roleGrants && roleGrants.length > 0) {
      return `Granted by: ${roleGrants.join(", ")}`;
    }
    return "Not granted";
  };

  const handleCellClick = (user, permKey) => {
    if (user.is_director || saving) return;
    const state = getCellState(user, permKey);
    const action = permKey.split(".").pop();
    const module = permKey.split(".")[0];
    const permLabel = `${module}.${action}`;

    if (state === "no_access") {
      setDialog({
        user,
        permKey,
        type: "grant",
        title: `Grant "${permLabel}" to ${user.full_name}?`,
      });
    } else if (state === "role_granted") {
      setDialog({
        user,
        permKey,
        type: "deny",
        title: `Deny "${permLabel}" for ${user.full_name}?`,
        subtitle: `This will override the role-based grant from: ${(user.role_grants[permKey] || []).join(", ")}`,
      });
    } else if (state === "custom_grant" || state === "custom_deny") {
      setDialog({
        user,
        permKey,
        type: "remove",
        title: `Remove custom override for "${permLabel}" on ${user.full_name}?`,
        subtitle: "This will revert to role-based access.",
      });
    }
    setDialogReason("");
  };

  const handleDialogConfirm = async () => {
    if (!dialog) return;
    const { user, permKey, type } = dialog;

    setSaving(true);
    setDialog(null);

    // Optimistic update
    const prevData = data;
    try {
      if (type === "grant" || type === "deny") {
        // Optimistic: add custom permission
        setData((d) => {
          const users = d.users.map((u) => {
            if (u.id !== user.id) return u;
            return {
              ...u,
              custom_permissions: {
                ...u.custom_permissions,
                [permKey]: { action: type, reason: dialogReason, granted_by_name: "You" },
              },
            };
          });
          return { ...d, users };
        });

        await permissionsMatrixService.setCustomPermission(user.id, permKey, type, dialogReason);
        notificationService.success(`Permission ${type === "grant" ? "granted" : "denied"} successfully`);
      } else {
        // Remove override — optimistic
        setData((d) => {
          const users = d.users.map((u) => {
            if (u.id !== user.id) return u;
            const cp = { ...u.custom_permissions };
            delete cp[permKey];
            return { ...u, custom_permissions: cp };
          });
          return { ...d, users };
        });

        await permissionsMatrixService.removeCustomPermission(user.id, permKey);
        notificationService.success("Custom override removed");
      }
    } catch (err) {
      // Rollback optimistic update
      setData(prevData);
      notificationService.error(err.message || "Failed to update permission");
    } finally {
      setSaving(false);
    }
  };

  const userPermCount = (user) => {
    if (!data) return { visible: 0, total: 0 };
    let count = 0;
    for (const p of filteredPermissions) {
      const state = getCellState(user, p.permission_key);
      if (state === "role_granted" || state === "custom_grant" || state === "director") count++;
    }
    return { visible: count, total: filteredPermissions.length };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-center text-gray-500">Failed to load permissions data.</div>;
  }

  const borderColor = isDarkMode ? "border-gray-700" : "border-gray-200";
  const bgMain = isDarkMode ? "bg-[#1a1d21]" : "bg-white";
  const bgHeader = isDarkMode ? "bg-[#1e2328]" : "bg-gray-50";
  const textPrimary = isDarkMode ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-500";

  return (
    <div className={`p-4 sm:p-6 ${textPrimary}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white">
            <TableProperties size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Permissions Matrix</h1>
            <p className={`text-sm ${textSecondary}`}>
              {filteredUsers.length} users &middot; {filteredPermissions.length} permissions &middot;{" "}
              {activeModules ? activeModules.length : moduleList.length} modules
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={`flex flex-wrap items-center gap-3 mb-3 p-3 rounded-lg border ${borderColor} ${bgMain}`}>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-md border ${borderColor} ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"} focus:outline-none focus:ring-1 focus:ring-teal-500`}
          />
        </div>
        <label className={`flex items-center gap-2 text-sm ${textSecondary} cursor-pointer`}>
          <input
            type="checkbox"
            checked={hideInactive}
            onChange={(e) => setHideInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          Hide inactive
        </label>
      </div>

      {/* Module filters */}
      <div className={`flex flex-wrap items-center gap-2 mb-3 p-3 rounded-lg border ${borderColor} ${bgMain}`}>
        <button
          type="button"
          onClick={() => setActiveModules(null)}
          className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
            !activeModules
              ? "bg-teal-600 text-white border-teal-600"
              : isDarkMode
                ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          }`}
        >
          All
        </button>
        {moduleList.map((mod) => (
          <button
            type="button"
            key={mod}
            onClick={() => toggleModule(mod)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
              activeModules?.includes(mod)
                ? "bg-teal-600 text-white border-teal-600"
                : isDarkMode
                  ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {mod.replace(/_/g, " ")}
          </button>
        ))}
        <span className={`text-xs ${textSecondary} ml-2`}>Presets:</span>
        {Object.keys(MODULE_PRESETS).map((preset) => (
          <button
            type="button"
            key={preset}
            onClick={() => applyPreset(preset)}
            className={`px-2 py-1 text-xs font-medium rounded-full border transition-colors ${
              isDarkMode
                ? "bg-amber-900/30 text-amber-300 border-amber-700 hover:bg-amber-900/50"
                : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className={`flex flex-wrap items-center gap-4 mb-3 text-xs ${textSecondary}`}>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-center leading-4 text-emerald-700 dark:text-emerald-300 text-[10px]">
            ✔
          </span>
          Role-granted
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 text-center leading-4 text-blue-700 dark:text-blue-300 text-[10px]">
            ✔
          </span>
          Custom grant
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-center leading-4 text-red-700 dark:text-red-300 text-[10px]">
            ✘
          </span>
          Custom deny
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-center leading-4 text-gray-400 text-[10px]">
            ·
          </span>
          No access
        </span>
      </div>

      {/* Matrix table */}
      <div className={`rounded-lg border ${borderColor} overflow-auto max-h-[calc(100vh-320px)]`} ref={tableRef}>
        <table className={`perm-matrix-table text-xs ${bgMain}`}>
          <thead className={`${bgHeader} sticky top-0 z-20`}>
            <tr>
              <th
                className={`perm-matrix-sticky-col ${bgHeader} px-3 py-2 text-left font-semibold ${textPrimary} ${borderColor}`}
                style={{ minWidth: 180, width: 180 }}
              >
                User
              </th>
              <th
                className={`perm-matrix-sticky-col-2 ${bgHeader} px-2 py-2 text-left font-semibold ${textPrimary} ${borderColor}`}
                style={{ minWidth: 120, width: 120 }}
              >
                Role
              </th>
              <th
                className={`${bgHeader} px-2 py-2 text-center font-semibold ${textPrimary} ${borderColor}`}
                style={{ minWidth: 50, width: 50 }}
              >
                #
              </th>
              {moduleGroups.map((group, gi) =>
                group.permissions.map((perm, pi) => (
                  <th
                    key={perm.permission_key}
                    className={`perm-matrix-header-cell ${bgHeader} ${textSecondary} ${borderColor} ${pi === 0 && gi > 0 ? "perm-matrix-module-border" : ""} ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                    title={`${perm.permission_key}${perm.description ? ` — ${perm.description}` : ""}`}
                  >
                    {pi === 0 && MODULE_ROUTES[perm.module] ? (
                      <a
                        href={MODULE_ROUTES[perm.module]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-500 hover:text-teal-400 font-bold"
                        title={`Open ${perm.module}`}
                      >
                        {perm.action}
                      </a>
                    ) : (
                      perm.action
                    )}
                  </th>
                ))
              )}
            </tr>
            {/* Module group header row */}
            <tr>
              <th className={`perm-matrix-sticky-col ${bgHeader} ${borderColor}`} style={{ minWidth: 180 }} />
              <th className={`perm-matrix-sticky-col-2 ${bgHeader} ${borderColor}`} style={{ minWidth: 120 }} />
              <th className={`${bgHeader} ${borderColor}`} />
              {moduleGroups.map((group) => (
                <th
                  key={group.module}
                  colSpan={group.permissions.length}
                  className={`px-1 py-1 text-center text-[9px] font-bold uppercase tracking-wide ${borderColor} ${
                    isDarkMode ? "text-gray-400 bg-gray-800" : "text-gray-500 bg-gray-100"
                  }`}
                >
                  {MODULE_ROUTES[group.module] ? (
                    <a
                      href={MODULE_ROUTES[group.module]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-500 hover:underline"
                    >
                      {group.module.replace(/_/g, " ")}
                    </a>
                  ) : (
                    group.module.replace(/_/g, " ")
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const counts = userPermCount(user);
              const isSelected = selectedRow === user.id;
              const rowBg = isSelected ? (isDarkMode ? "bg-amber-900/20" : "bg-amber-50") : "";

              return (
                <tr
                  key={user.id}
                  className={`${rowBg} hover:${isDarkMode ? "bg-gray-800/50" : "bg-gray-50"} transition-colors`}
                  onClick={() => setSelectedRow(isSelected ? null : user.id)}
                >
                  <td
                    className={`perm-matrix-sticky-col ${rowBg || bgMain} px-3 py-1.5 font-medium ${borderColor} ${textPrimary} whitespace-nowrap`}
                    style={{ minWidth: 180 }}
                  >
                    <div className="truncate max-w-[160px]" title={`${user.full_name} (${user.email})`}>
                      {user.full_name}
                    </div>
                    {!user.is_active && <span className="text-[9px] text-red-500 font-medium">INACTIVE</span>}
                  </td>
                  <td
                    className={`perm-matrix-sticky-col-2 ${rowBg || bgMain} px-2 py-1.5 ${borderColor} ${textSecondary} whitespace-nowrap`}
                    style={{ minWidth: 120 }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="truncate max-w-[80px] text-[10px]" title={user.role_display_names.join(", ")}>
                        {user.role_display_names.join(", ") || "No role"}
                      </span>
                      {user.is_director && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                          <Shield size={8} />
                          Full Access
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`text-center ${borderColor} ${textSecondary} text-[10px]`}>
                    {counts.visible}/{counts.total}
                  </td>
                  {moduleGroups.map((group, gi) =>
                    group.permissions.map((perm, pi) => {
                      const state = getCellState(user, perm.permission_key);
                      const tooltip = getCellTooltip(user, perm.permission_key);
                      const isDisabled = user.is_director;
                      const isModuleBorder = pi === 0 && gi > 0;

                      let cellBg = "";
                      let cellContent = null;

                      if (state === "director" || state === "role_granted") {
                        cellBg = isDarkMode ? "bg-emerald-900/30" : "bg-emerald-50";
                        cellContent = <Check size={12} className="text-emerald-600 dark:text-emerald-400 mx-auto" />;
                      } else if (state === "custom_grant") {
                        cellBg = isDarkMode ? "bg-blue-900/30" : "bg-blue-50";
                        cellContent = <Check size={12} className="text-blue-600 dark:text-blue-400 mx-auto" />;
                      } else if (state === "custom_deny") {
                        cellBg = isDarkMode ? "bg-red-900/30" : "bg-red-50";
                        cellContent = <X size={12} className="text-red-600 dark:text-red-400 mx-auto" />;
                      } else {
                        cellContent = <span className="text-gray-300 dark:text-gray-600">·</span>;
                      }

                      return (
                        <td
                          key={perm.permission_key}
                          className={`perm-matrix-cell ${isDisabled ? "disabled" : ""} ${cellBg} ${borderColor} ${isModuleBorder ? `perm-matrix-module-border ${isDarkMode ? "border-gray-600" : "border-gray-300"}` : ""}`}
                          title={tooltip}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCellClick(user, perm.permission_key);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                              handleCellClick(user, perm.permission_key);
                            }
                          }}
                        >
                          {cellContent}
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`rounded-xl shadow-2xl border ${borderColor} ${isDarkMode ? "bg-gray-900" : "bg-white"} p-6 max-w-md w-full mx-4`}
          >
            <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>{dialog.title}</h3>
            {dialog.subtitle && <p className={`text-sm mb-3 ${textSecondary}`}>{dialog.subtitle}</p>}
            {dialog.type !== "remove" && (
              <div className="mb-4">
                <label htmlFor="perm-reason" className={`block text-sm font-medium mb-1 ${textSecondary}`}>
                  Reason (optional)
                </label>
                <textarea
                  id="perm-reason"
                  value={dialogReason}
                  onChange={(e) => setDialogReason(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="e.g. Temporary access for month-end cleanup"
                  className={`w-full px-3 py-2 text-sm rounded-md border ${borderColor} ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"} focus:outline-none focus:ring-1 focus:ring-teal-500`}
                />
                <p className={`text-xs mt-1 ${textSecondary}`}>{dialogReason.length}/500</p>
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border ${borderColor} ${isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDialogConfirm}
                className={`px-4 py-2 text-sm font-medium rounded-lg text-white ${
                  dialog.type === "deny"
                    ? "bg-red-600 hover:bg-red-700"
                    : dialog.type === "remove"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                {dialog.type === "grant" && "Grant"}
                {dialog.type === "deny" && "Deny"}
                {dialog.type === "remove" && "Remove Override"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
