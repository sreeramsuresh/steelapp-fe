/**
 * GLMappingRules.jsx
 * Configuration page for GL mapping rules that automate journal entry generation.
 * CRUD + preview for posting rules keyed by event type (GRN_POSTED, BILL_APPROVE, etc.).
 */

import { AlertTriangle, Loader2, Pencil, Play, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { financialreportsService } from "../../services/financialReportsService";
import glMappingService from "../../services/glMappingService";

const EVENT_TYPES = [
  "GRN_POSTED",
  "BILL_APPROVE",
  "INVOICE_POSTED",
  "PAYMENT_RECEIVED",
  "PAYMENT_SENT",
  "PAYROLL_POSTED",
  "EXPENSE_POSTED",
  "JOURNAL_MANUAL",
];

let entryIdCounter = 0;
const makeEntry = (overrides = {}) => ({
  _key: `e_${++entryIdCounter}`,
  accountCode: "",
  debitCredit: "DEBIT",
  amountField: "",
  description: "",
  ...overrides,
});

const EMPTY_RULE = {
  ruleCode: "",
  eventType: "GRN_POSTED",
  priority: 100,
  conditions: {},
  postingEntries: [makeEntry(), makeEntry({ debitCredit: "CREDIT" })],
  isActive: true,
};

export default function GLMappingRules() {
  const { isDarkMode } = useTheme();
  const [rules, setRules] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [saving, setSaving] = useState(false);

  // Preview state
  const [previewRule, setPreviewRule] = useState(null);
  const [previewLines, setPreviewLines] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  const cardBg = isDarkMode ? "bg-gray-800" : "bg-white";
  const textPrimary = isDarkMode ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-600";
  const inputCls = isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900";
  const theadBg = isDarkMode ? "bg-gray-700" : "bg-gray-50";
  const rowBorder = isDarkMode ? "border-gray-700" : "border-b";
  const hoverRow = isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50";

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [rulesData, coaRes] = await Promise.all([
        glMappingService.listRules(),
        financialreportsService.getChartOfAccounts({}),
      ]);
      setRules(Array.isArray(rulesData) ? rulesData : []);
      const coaData = coaRes?.data || coaRes || {};
      setAccounts(
        (coaData.accounts || []).map((a) => ({
          code: a.accountCode || a.code,
          name: a.accountName || a.name,
        }))
      );
    } catch (err) {
      console.error("Failed to load GL mapping data:", err);
      setError("Failed to load GL mapping rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Modal helpers ──

  const openCreate = () => {
    setEditRule({ ...EMPTY_RULE, postingEntries: [makeEntry(), makeEntry({ debitCredit: "CREDIT" })] });
    setModalOpen(true);
  };

  const openEdit = (rule) => {
    setEditRule({
      ...rule,
      postingEntries:
        rule.postingEntries?.length > 0
          ? rule.postingEntries.map((e) => ({ ...e, _key: e._key || `e_${++entryIdCounter}` }))
          : [makeEntry(), makeEntry({ debitCredit: "CREDIT" })],
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditRule(null);
  };

  const handleFieldChange = (field, value) => {
    setEditRule((prev) => ({ ...prev, [field]: value }));
  };

  const handleEntryChange = (idx, field, value) => {
    setEditRule((prev) => {
      const entries = [...prev.postingEntries];
      entries[idx] = { ...entries[idx], [field]: value };
      return { ...prev, postingEntries: entries };
    });
  };

  const addEntry = () => {
    setEditRule((prev) => ({
      ...prev,
      postingEntries: [...prev.postingEntries, makeEntry()],
    }));
  };

  const removeEntry = (idx) => {
    setEditRule((prev) => ({
      ...prev,
      postingEntries: prev.postingEntries.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editRule.id) {
        await glMappingService.updateRule(editRule.ruleCode, editRule);
      } else {
        await glMappingService.createRule(editRule);
      }
      closeModal();
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleCode) => {
    if (!window.confirm(`Delete rule "${ruleCode}"?`)) return;
    try {
      await glMappingService.deleteRule(ruleCode);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete rule");
    }
  };

  const handlePreview = async (rule) => {
    setPreviewing(true);
    setPreviewRule(rule);
    setPreviewLines(null);
    try {
      const result = await glMappingService.previewLines(rule.ruleCode, { amount: 1000 });
      setPreviewLines(result);
    } catch (err) {
      setPreviewLines({ error: err.response?.data?.message || "Preview failed" });
    } finally {
      setPreviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>GL Mapping Rules</h1>
          <p className={`text-sm ${textSecondary}`}>Configure rules for automated journal entry generation.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 text-sm"
        >
          <Plus className="h-4 w-4" /> New Rule
        </button>
      </div>

      {error && (
        <div
          className={`mb-4 px-4 py-3 rounded ${
            isDarkMode ? "bg-red-900/30 border-red-700 text-red-300" : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline text-sm">
            dismiss
          </button>
        </div>
      )}

      {/* Rules Table */}
      <div className={`${cardBg} rounded-lg shadow overflow-x-auto`}>
        <table className="min-w-full">
          <thead>
            <tr className={`${theadBg} ${rowBorder}`}>
              <th className={`px-4 py-3 text-left text-sm font-medium ${textPrimary}`}>Rule Code</th>
              <th className={`px-4 py-3 text-left text-sm font-medium ${textPrimary}`}>Event Type</th>
              <th className={`px-4 py-3 text-center text-sm font-medium ${textPrimary}`}>Priority</th>
              <th className={`px-4 py-3 text-center text-sm font-medium ${textPrimary}`}>Entries</th>
              <th className={`px-4 py-3 text-center text-sm font-medium ${textPrimary}`}>Active</th>
              <th className={`px-4 py-3 text-right text-sm font-medium ${textPrimary}`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={6} className={`px-4 py-8 text-center text-sm ${textSecondary}`}>
                  No GL mapping rules defined. Click "New Rule" to create one.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.ruleCode || rule.id} className={`${rowBorder} ${hoverRow}`}>
                  <td className={`px-4 py-3 text-sm font-medium ${textPrimary}`}>{rule.ruleCode}</td>
                  <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        isDarkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {rule.eventType}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-center text-sm ${textPrimary}`}>{rule.priority}</td>
                  <td className={`px-4 py-3 text-center text-sm ${textPrimary}`}>{rule.postingEntries?.length || 0}</td>
                  <td className="px-4 py-3 text-center text-sm">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        rule.isActive !== false
                          ? isDarkMode
                            ? "bg-green-900 text-green-200"
                            : "bg-green-100 text-green-800"
                          : isDarkMode
                            ? "bg-gray-700 text-gray-400"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {rule.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handlePreview(rule)}
                        className={`p-1.5 rounded ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"}`}
                        title="Preview journal lines"
                      >
                        <Play className="h-3.5 w-3.5 text-green-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(rule)}
                        className={`p-1.5 rounded ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"}`}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5 text-blue-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule.ruleCode)}
                        className={`p-1.5 rounded ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"}`}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Panel */}
      {previewRule && (
        <div className={`mt-6 ${cardBg} rounded-lg shadow p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${textPrimary}`}>
              Preview: {previewRule.ruleCode} (sample amount: 1,000)
            </h3>
            <button type="button" onClick={() => setPreviewRule(null)} className="p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
          {previewing ? (
            <div className={`text-sm ${textSecondary}`}>Loading preview...</div>
          ) : previewLines?.error ? (
            <div className="text-sm text-red-500">{previewLines.error}</div>
          ) : previewLines?.journalLines ? (
            <>
              <table className="min-w-full text-sm mb-2">
                <thead>
                  <tr className={`${theadBg}`}>
                    <th className={`px-3 py-2 text-left ${textPrimary}`}>Account</th>
                    <th className={`px-3 py-2 text-left ${textPrimary}`}>D/C</th>
                    <th className={`px-3 py-2 text-right ${textPrimary}`}>Amount</th>
                    <th className={`px-3 py-2 text-left ${textPrimary}`}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {previewLines.journalLines.map((line) => (
                    <tr key={`${line.accountCode}-${line.debitCredit}-${line.amount}`} className={rowBorder}>
                      <td className={`px-3 py-2 ${textPrimary}`}>{line.accountCode}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`text-xs font-medium ${line.debitCredit === "DEBIT" ? "text-green-500" : "text-red-500"}`}
                        >
                          {line.debitCredit}
                        </span>
                      </td>
                      <td className={`px-3 py-2 text-right ${textPrimary}`}>{(line.amount || 0).toFixed(2)}</td>
                      <td className={`px-3 py-2 ${textSecondary}`}>{line.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-4 text-xs">
                <span className="text-green-500">Total Debits: {(previewLines.totalDebits || 0).toFixed(2)}</span>
                <span className="text-red-500">Total Credits: {(previewLines.totalCredits || 0).toFixed(2)}</span>
                {Math.abs((previewLines.totalDebits || 0) - (previewLines.totalCredits || 0)) > 0.01 && (
                  <span className="text-yellow-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Unbalanced!
                  </span>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && editRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${cardBg} rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${textPrimary}`}>{editRule.id ? "Edit Rule" : "New Rule"}</h2>
              <button type="button" onClick={closeModal}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Rule Code */}
              <div>
                <label
                  htmlFor="gl-rule-code"
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Rule Code
                </label>
                <input
                  id="gl-rule-code"
                  type="text"
                  value={editRule.ruleCode}
                  onChange={(e) => handleFieldChange("ruleCode", e.target.value)}
                  disabled={Boolean(editRule.id)}
                  className={`w-full border rounded px-3 py-2 text-sm ${inputCls} ${editRule.id ? "opacity-50" : ""}`}
                  placeholder="e.g. GRN_STD_ENTRY"
                />
              </div>

              {/* Event Type + Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="gl-event-type"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Event Type
                  </label>
                  <select
                    id="gl-event-type"
                    value={editRule.eventType}
                    onChange={(e) => handleFieldChange("eventType", e.target.value)}
                    className={`w-full border rounded px-3 py-2 text-sm ${inputCls}`}
                  >
                    {EVENT_TYPES.map((et) => (
                      <option key={et} value={et}>
                        {et}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="gl-priority"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Priority
                  </label>
                  <input
                    id="gl-priority"
                    type="number"
                    value={editRule.priority}
                    onChange={(e) => handleFieldChange("priority", parseInt(e.target.value, 10) || 100)}
                    className={`w-full border rounded px-3 py-2 text-sm ${inputCls}`}
                  />
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editRule.isActive !== false}
                  onChange={(e) => handleFieldChange("isActive", e.target.checked)}
                />
                <span className={textPrimary}>Active</span>
              </label>

              {/* Posting Entries */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Posting Entries
                  </span>
                  <button
                    type="button"
                    onClick={addEntry}
                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Line
                  </button>
                </div>
                <div className="space-y-2">
                  {editRule.postingEntries.map((entry, idx) => (
                    <div
                      key={entry._key}
                      className={`flex items-center gap-2 p-2 rounded ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
                    >
                      <select
                        value={entry.accountCode}
                        onChange={(e) => handleEntryChange(idx, "accountCode", e.target.value)}
                        className={`flex-1 border rounded px-2 py-1.5 text-sm ${inputCls}`}
                      >
                        <option value="">-- Account --</option>
                        {accounts.map((acc) => (
                          <option key={acc.code} value={acc.code}>
                            {acc.code} - {acc.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={entry.debitCredit}
                        onChange={(e) => handleEntryChange(idx, "debitCredit", e.target.value)}
                        className={`w-24 border rounded px-2 py-1.5 text-sm ${inputCls}`}
                      >
                        <option value="DEBIT">Debit</option>
                        <option value="CREDIT">Credit</option>
                      </select>
                      <input
                        type="text"
                        value={entry.amountField || ""}
                        onChange={(e) => handleEntryChange(idx, "amountField", e.target.value)}
                        placeholder="Amount field"
                        className={`w-28 border rounded px-2 py-1.5 text-sm ${inputCls}`}
                      />
                      <input
                        type="text"
                        value={entry.description || ""}
                        onChange={(e) => handleEntryChange(idx, "description", e.target.value)}
                        placeholder="Description"
                        className={`flex-1 border rounded px-2 py-1.5 text-sm ${inputCls}`}
                      />
                      {editRule.postingEntries.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeEntry(idx)}
                          className="p-1 text-red-500 hover:text-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={closeModal}
                className={`px-4 py-2 text-sm rounded-lg ${isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !editRule.ruleCode}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg px-4 py-2 text-sm"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editRule.id ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
