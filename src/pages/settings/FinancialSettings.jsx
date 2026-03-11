/**
 * FinancialSettings.jsx
 * Company-level GL account defaults and base currency configuration.
 * Reads/writes via /api/company-financial-settings (migration 0149).
 */

import { Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import companyFinancialSettingsService from "../../services/companyFinancialSettingsService";
import { financialreportsService } from "../../services/financialReportsService";

// Settings field definitions — each maps to a DB column and a COA filter
const SETTING_FIELDS = [
  { key: "defaultBankAccountCode", label: "Default Bank Account", coaType: "bank" },
  { key: "defaultCashAccountCode", label: "Default Cash Account", coaType: "bank" },
  { key: "accountsPayableCode", label: "Accounts Payable", coaType: null },
  { key: "inputVatGlAccountCode", label: "Input VAT GL Account", coaType: null },
  { key: "outputVatGlAccountCode", label: "Output VAT GL Account", coaType: null },
  { key: "salariesPayableCode", label: "Salaries Payable", coaType: null },
  { key: "employeeAdvanceReceivableCode", label: "Employee Advance Receivable", coaType: null },
  { key: "employeeLoanReceivableCode", label: "Employee Loan Receivable", coaType: null },
];

export default function FinancialSettings() {
  const { isDarkMode } = useTheme();
  const [settings, setSettings] = useState({});
  const [allAccounts, setAllAccounts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const cardBg = isDarkMode ? "bg-gray-800" : "bg-white";
  const textPrimary = isDarkMode ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-600";
  const inputCls = isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900";

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsRes, allRes, bankRes] = await Promise.all([
        companyFinancialSettingsService.get(),
        financialreportsService.getChartOfAccounts({}),
        financialreportsService.getChartOfAccounts({ type: "bank" }),
      ]);

      // Settings
      const data = settingsRes?.data || settingsRes || {};
      setSettings(data);

      // All accounts (for non-type-specific dropdowns)
      const allData = allRes?.data || allRes || {};
      setAllAccounts(
        (allData.accounts || []).map((a) => ({
          code: a.accountCode || a.code,
          name: a.accountName || a.name,
        }))
      );

      // Bank-type accounts
      const bankData = bankRes?.data || bankRes || {};
      setBankAccounts(
        (bankData.accounts || []).map((a) => ({
          code: a.accountCode || a.code,
          name: a.accountName || a.name,
        }))
      );
    } catch (err) {
      console.error("Failed to load financial settings:", err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await companyFinancialSettingsService.update(settings);
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const getAccountOptions = (coaType) => {
    return coaType === "bank" ? bankAccounts : allAccounts;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className={`text-2xl font-bold mb-1 ${textPrimary}`}>Financial Settings</h1>
      <p className={`text-sm mb-6 ${textSecondary}`}>
        Configure default GL accounts and base currency for your company.
      </p>

      {error && (
        <div
          className={`mb-4 px-4 py-3 rounded ${
            isDarkMode ? "bg-red-900/30 border-red-700 text-red-300" : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className={`mb-4 px-4 py-3 rounded ${
            isDarkMode
              ? "bg-green-900/30 border-green-700 text-green-300"
              : "bg-green-50 border border-green-200 text-green-700"
          }`}
        >
          Settings saved successfully.
        </div>
      )}

      <div className={`${cardBg} rounded-lg shadow-sm p-6 space-y-5`}>
        {SETTING_FIELDS.map((field) => {
          const options = getAccountOptions(field.coaType);
          return (
            <div key={field.key}>
              <label
                htmlFor={field.key}
                className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                {field.label}
              </label>
              <select
                id={field.key}
                value={settings[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className={`w-full border rounded px-3 py-2 text-sm ${inputCls}`}
              >
                <option value="">-- Select --</option>
                {options.map((acc) => (
                  <option key={acc.code} value={acc.code}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}

        {/* Base Currency */}
        <div>
          <label
            htmlFor="baseCurrency"
            className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Base Currency
          </label>
          <input
            id="baseCurrency"
            type="text"
            maxLength={3}
            value={settings.baseCurrency || "AED"}
            onChange={(e) => handleChange("baseCurrency", e.target.value.toUpperCase())}
            className={`w-32 border rounded px-3 py-2 text-sm uppercase ${inputCls}`}
          />
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg px-5 py-2.5 text-sm transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
