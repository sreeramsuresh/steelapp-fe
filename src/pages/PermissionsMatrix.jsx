import { Check, Loader2, Search, Shield, TableProperties, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { notificationService } from "../services/notificationService";
import { permissionsMatrixService } from "../services/permissionsMatrixService";
import "./PermissionsMatrix.css";

const MODULE_PRESETS = {
  Sales: [
    "invoices",
    "quotations",
    "deliveryNotes",
    "creditNotes",
    "customers",
    "pricelists",
    "pricing",
    "deliveryVariance",
    "customerCredit",
  ],
  Purchase: ["purchaseOrders", "suppliers", "supplierBills", "debitNotes", "supplierQuotations"],
  Inventory: [
    "inventory",
    "warehouses",
    "stockMovements",
    "stockBatches",
    "batchReservations",
    "grns",
    "products",
    "materialCertificates",
    "pinnedProducts",
    "unitConversions",
    "cogs",
  ],
  Finance: [
    "payments",
    "payables",
    "receivables",
    "advancePayments",
    "commissions",
    "operatingExpenses",
    "accountStatements",
    "accountingPeriods",
    "bankReconciliation",
    "exchangeRates",
    "financialReports",
    "journalEntries",
    "reconciliations",
    "trn",
    "vatRates",
    "vatReturn",
  ],
  Trade: [
    "importOrders",
    "exportOrders",
    "importContainers",
    "customsDocuments",
    "shippingDocuments",
    "tradeFinance",
    "countries",
  ],
  Admin: [
    "users",
    "roles",
    "companySettings",
    "auditLogs",
    "auditHub",
    "activities",
    "analytics",
    "categoryPolicies",
    "dashboard",
    "documentLinks",
    "integrations",
    "notifications",
    "policySnapshots",
    "reports",
    "templates",
  ],
};

// Convert camelCase to readable label: "accountStatements" → "account statements"
const toLabel = (str) =>
  str
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .toLowerCase()
    .trim();

const MODULE_ROUTES = {
  invoices: "/app/invoices",
  quotations: "/app/quotations",
  deliveryNotes: "/app/delivery-notes",
  creditNotes: "/app/credit-notes",
  customers: "/app/customers",
  products: "/app/products",
  purchaseOrders: "/app/purchases",
  suppliers: "/app/suppliers",
  payments: "/app/receivables",
  payables: "/app/payables",
  inventory: "/app/inventory",
  warehouses: "/app/warehouses",
  stockMovements: "/app/stock-movements",
};

export default function PermissionsMatrix() {
  const { isDarkMode } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [hideInactive, setHideInactive] = useState(true);
  const [customOnly, setCustomOnly] = useState(false);
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

  // Count users with any custom overrides (for badge)
  const customOverrideCount = useMemo(() => {
    if (!data) return 0;
    return data.users.filter((u) => u.customPermissions && Object.keys(u.customPermissions).length > 0).length;
  }, [data]);

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    let users = data.users;
    if (hideInactive) users = users.filter((u) => u.isActive);
    if (customOnly) users = users.filter((u) => u.customPermissions && Object.keys(u.customPermissions).length > 0);
    if (search) {
      const q = search.toLowerCase();
      users = users.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return users;
  }, [data, hideInactive, customOnly, search]);

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

  const applyPreset = (presetName) => {
    setActiveModules(MODULE_PRESETS[presetName] || null);
  };

  const getCellState = (user, permKey) => {
    if (user.isDirector) return "director";
    const custom = user.customPermissions[permKey];
    if (custom) return custom.action === "grant" ? "custom_grant" : "custom_deny";
    const grants = user.roleGrants[permKey];
    if (grants && grants.length > 0) return "role_granted";
    return "no_access";
  };

  const getCellTooltip = (user, permKey) => {
    if (user.isDirector) return "Director: Full Access";
    const custom = user.customPermissions[permKey];
    if (custom) {
      const label = custom.action === "grant" ? "Custom grant" : "Custom deny";
      const by = custom.grantedByName ? ` by ${custom.grantedByName}` : "";
      const reason = custom.reason ? `\nReason: ${custom.reason}` : "";
      return `${label}${by}${reason}`;
    }
    const grants = user.roleGrants[permKey];
    if (grants && grants.length > 0) {
      return `Granted by: ${grants.join(", ")}`;
    }
    return "Not granted";
  };

  const handleCellClick = (user, permKey) => {
    if (user.isDirector || saving) return;
    const state = getCellState(user, permKey);
    const action = permKey.split(".").pop();
    const module = permKey.split(".")[0];
    const permLabel = `${module}.${action}`;

    if (state === "no_access") {
      setDialog({
        user,
        permKey,
        type: "grant",
        title: `Grant "${permLabel}" to ${user.fullName}?`,
      });
    } else if (state === "role_granted") {
      setDialog({
        user,
        permKey,
        type: "deny",
        title: `Deny "${permLabel}" for ${user.fullName}?`,
        subtitle: `This will override the role-based grant from: ${(user.roleGrants[permKey] || []).join(", ")}`,
      });
    } else if (state === "custom_grant" || state === "custom_deny") {
      setDialog({
        user,
        permKey,
        type: "remove",
        title: `Remove custom override for "${permLabel}" on ${user.fullName}?`,
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
        setData((d) => {
          const users = d.users.map((u) => {
            if (u.id !== user.id) return u;
            return {
              ...u,
              customPermissions: {
                ...u.customPermissions,
                [permKey]: { action: type, reason: dialogReason, grantedByName: "You" },
              },
            };
          });
          return { ...d, users };
        });

        await permissionsMatrixService.setCustomPermission(user.id, permKey, type, dialogReason);
        notificationService.success(`Permission ${type === "grant" ? "granted" : "denied"} successfully`);
      } else {
        setData((d) => {
          const users = d.users.map((u) => {
            if (u.id !== user.id) return u;
            const cp = { ...u.customPermissions };
            delete cp[permKey];
            return { ...u, customPermissions: cp };
          });
          return { ...d, users };
        });

        await permissionsMatrixService.removeCustomPermission(user.id, permKey);
        notificationService.success("Custom override removed");
      }
    } catch (err) {
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
      const state = getCellState(user, p.permissionKey);
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
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-600";

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 text-sm rounded-md border ${borderColor} ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"} focus:outline-none focus:ring-1 focus:ring-teal-500`}
          />
        </div>
        <label className={`flex items-center gap-2 text-sm ${textSecondary} cursor-pointer`}>
          <input
            type="checkbox"
            checked={hideInactive}
            onChange={(e) => setHideInactive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          Hide inactive
        </label>
        <button
          type="button"
          onClick={() => setCustomOnly((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
            customOnly
              ? "bg-blue-500 text-white border-blue-500"
              : isDarkMode
                ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          }`}
        >
          Custom Only
          {customOverrideCount > 0 && (
            <span
              className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                customOnly
                  ? "bg-white/20 text-white"
                  : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              }`}
            >
              {customOverrideCount}
            </span>
          )}
        </button>
      </div>

      {/* Module filters */}
      <div className={`flex flex-wrap items-center gap-2 mb-3 p-3 rounded-lg border ${borderColor} ${bgMain}`}>
        <span className={`text-xs font-medium ${textSecondary} mr-1`}>Filter:</span>
        <button
          type="button"
          onClick={() => setActiveModules(null)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
            !activeModules
              ? "bg-teal-600 text-white border-teal-600"
              : isDarkMode
                ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          }`}
        >
          All
        </button>
        {Object.keys(MODULE_PRESETS).map((preset) => {
          const presetModules = MODULE_PRESETS[preset];
          const isActive =
            activeModules &&
            presetModules.length === activeModules.length &&
            presetModules.every((m) => activeModules.includes(m));
          return (
            <button
              type="button"
              key={preset}
              onClick={() => applyPreset(preset)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                isActive
                  ? "bg-teal-600 text-white border-teal-600"
                  : isDarkMode
                    ? "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {preset}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className={`flex flex-wrap items-center gap-5 mb-4 text-xs ${textSecondary}`}>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700">
            <Check size={14} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          </span>
          Role-granted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-500 dark:bg-blue-600">
            <Check size={14} className="text-white" strokeWidth={3} />
          </span>
          Custom grant
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-red-500 dark:bg-red-600">
            <X size={14} className="text-white" strokeWidth={3} />
          </span>
          Custom deny
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
            <span className="text-gray-400 dark:text-gray-500 text-2xl leading-none font-bold">·</span>
          </span>
          No access
        </span>
      </div>

      {/* Matrix table */}
      <div className={`rounded-lg border ${borderColor} overflow-x-auto`} ref={tableRef}>
        <table className={`perm-matrix-table text-[13px] ${bgMain}`}>
          <thead className={`${bgHeader} sticky top-0 z-20`}>
            {/* Module group header row — placed ABOVE action labels */}
            <tr>
              <th
                className={`perm-matrix-sticky-col ${bgHeader} ${borderColor}`}
                style={{ minWidth: 200, width: 200 }}
              />
              <th
                className={`perm-matrix-sticky-col-2 ${bgHeader} ${borderColor}`}
                style={{ minWidth: 160, width: 160 }}
              />
              <th className={`${bgHeader} ${borderColor}`} style={{ minWidth: 56, width: 56 }} />
              {moduleGroups.map((group) => (
                <th
                  key={group.module}
                  colSpan={group.permissions.length}
                  className={`px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider ${borderColor} ${
                    isDarkMode ? "text-gray-300 bg-gray-800" : "text-gray-700 bg-gray-100"
                  }`}
                >
                  {MODULE_ROUTES[group.module] ? (
                    <a
                      href={MODULE_ROUTES[group.module]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-500 hover:underline"
                    >
                      {toLabel(group.module)}
                    </a>
                  ) : (
                    toLabel(group.module)
                  )}
                </th>
              ))}
            </tr>
            {/* Action label headers (rotated) */}
            <tr>
              <th
                className={`perm-matrix-sticky-col ${bgHeader} px-4 py-3 text-left font-semibold ${textPrimary} ${borderColor}`}
                style={{ minWidth: 200, width: 200 }}
              >
                User
              </th>
              <th
                className={`perm-matrix-sticky-col-2 ${bgHeader} px-3 py-3 text-left font-semibold ${textPrimary} ${borderColor}`}
                style={{ minWidth: 160, width: 160 }}
              >
                Role
              </th>
              <th
                className={`${bgHeader} px-2 py-3 text-center font-semibold ${textPrimary} ${borderColor}`}
                style={{ minWidth: 56, width: 56 }}
              >
                #
              </th>
              {moduleGroups.map((group, gi) =>
                group.permissions.map((perm, pi) => (
                  <th
                    key={perm.permissionKey}
                    className={`perm-matrix-header-cell ${bgHeader} ${isDarkMode ? "text-gray-300" : "text-gray-700"} ${borderColor} ${pi === 0 && gi > 0 ? "perm-matrix-module-border" : ""} ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                    title={`${perm.permissionKey}${perm.description ? ` — ${perm.description}` : ""}`}
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
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const counts = userPermCount(user);
              const isSelected = selectedRow === user.id;
              const rowBg = isSelected ? (isDarkMode ? "bg-amber-900/20" : "bg-amber-50") : "";
              // Sticky columns need OPAQUE backgrounds so scrolling cells don't show through
              const stickyBg = isSelected ? (isDarkMode ? "#2a2310" : "#fffbeb") : isDarkMode ? "#1a1d21" : "#ffffff";

              return (
                <tr
                  key={user.id}
                  className={`${rowBg} hover:${isDarkMode ? "bg-gray-800/50" : "bg-gray-50"} transition-colors`}
                  onClick={() => setSelectedRow(isSelected ? null : user.id)}
                >
                  <td
                    className={`perm-matrix-sticky-col px-4 py-2 font-medium ${borderColor} ${textPrimary} whitespace-nowrap`}
                    style={{ minWidth: 200, backgroundColor: stickyBg }}
                  >
                    <div className="truncate max-w-[180px]" title={`${user.fullName} (${user.email})`}>
                      {user.fullName}
                    </div>
                    {!user.isActive && (
                      <span className="text-[10px] text-red-500 font-semibold uppercase">Inactive</span>
                    )}
                  </td>
                  <td
                    className={`perm-matrix-sticky-col-2 px-3 py-2 ${borderColor} whitespace-nowrap`}
                    style={{ minWidth: 160, backgroundColor: stickyBg }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`truncate max-w-[100px] text-xs ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        title={user.roleDisplayNames.join(", ")}
                      >
                        {user.roleDisplayNames.join(", ") || "No role"}
                      </span>
                      {user.isDirector && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 whitespace-nowrap">
                          <Shield size={10} />
                          Full Access
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className={`text-center ${borderColor} text-xs tabular-nums ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                  >
                    {counts.visible}/{counts.total}
                  </td>
                  {moduleGroups.map((group, gi) =>
                    group.permissions.map((perm, pi) => {
                      const state = getCellState(user, perm.permissionKey);
                      const tooltip = getCellTooltip(user, perm.permissionKey);
                      const isDisabled = user.isDirector;
                      const isModuleBorder = pi === 0 && gi > 0;

                      let cellBg = "";
                      let cellContent = null;

                      if (state === "director" || state === "role_granted") {
                        cellBg = isDarkMode ? "bg-emerald-900/30" : "bg-emerald-50";
                        cellContent = (
                          <Check
                            size={20}
                            className="text-emerald-600 dark:text-emerald-400 mx-auto"
                            strokeWidth={2.5}
                          />
                        );
                      } else if (state === "custom_grant") {
                        cellBg = isDarkMode ? "bg-blue-600" : "bg-blue-500";
                        cellContent = <Check size={20} className="text-white mx-auto" strokeWidth={3} />;
                      } else if (state === "custom_deny") {
                        cellBg = isDarkMode ? "bg-red-600" : "bg-red-500";
                        cellContent = <X size={20} className="text-white mx-auto" strokeWidth={3} />;
                      } else {
                        cellContent = (
                          <span
                            className="text-gray-400 dark:text-gray-500 block text-center"
                            style={{ fontSize: "45px", lineHeight: "40px", height: "40px", overflow: "hidden" }}
                          >
                            ·
                          </span>
                        );
                      }

                      return (
                        <td
                          key={perm.permissionKey}
                          className={`perm-matrix-cell ${isDisabled ? "disabled" : ""} ${cellBg} ${borderColor} ${isModuleBorder ? `perm-matrix-module-border ${isDarkMode ? "border-gray-600" : "border-gray-300"}` : ""}`}
                          title={tooltip}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCellClick(user, perm.permissionKey);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                              handleCellClick(user, perm.permissionKey);
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
