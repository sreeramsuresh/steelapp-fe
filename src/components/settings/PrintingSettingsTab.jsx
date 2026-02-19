import { AlertCircle, Printer, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { apiClient as apiService } from "../../services/api";
import { notificationService } from "../../services/notificationService";

// Reuse shared UI primitives from parent scope — these are defined in CompanySettings
// but since they're simple, we inline lightweight versions here.

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

const SectionHeader = ({ icon: Icon, title }) => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
      <div className="flex items-center gap-3">
        <Icon className={isDarkMode ? "text-teal-400" : "text-teal-600"} size={24} />
        <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</h3>
      </div>
    </div>
  );
};

const SectionCard = ({ title, children }) => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`p-6 border-b last:border-b-0 ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
      {title && (
        <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</h4>
      )}
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

const PrintingSettingsTab = () => {
  const { isDarkMode } = useTheme();

  const [printingSettings, setPrintingSettings] = useState({
    receipt_size: "A5",
    print_on_paper_size: "A4",
    receipt_printer: "default",
    invoice_printer: "default",
    receipt_copies: 1,
    invoice_copies: 1,
    auto_print_receipts: false,
    auto_print_invoices: false,
  });
  const [savingPrintingSettings, setSavingPrintingSettings] = useState(false);

  // Fetch printing settings on mount
  useEffect(() => {
    (async () => {
      try {
        const settings = await apiService.get("/company/printing-settings");
        if (settings) {
          setPrintingSettings(settings);
        }
      } catch (error) {
        console.error("Error loading printing settings:", error);
        notificationService.error("Failed to load printing settings");
      }
    })();
  }, []);

  const savePrintingSettingsHandler = async () => {
    try {
      setSavingPrintingSettings(true);
      await apiService.put("/company/printing-settings", printingSettings);
      notificationService.success("Printing settings saved successfully");
    } catch (error) {
      console.error("Error saving printing settings:", error);
      notificationService.error("Failed to save printing settings");
    } finally {
      setSavingPrintingSettings(false);
    }
  };

  const resetPrintingSettings = () => {
    setPrintingSettings({
      receipt_size: "A5",
      print_on_paper_size: "A4",
      receipt_printer: "default",
      invoice_printer: "default",
      receipt_copies: 1,
      invoice_copies: 1,
      auto_print_receipts: false,
      auto_print_invoices: false,
    });
    notificationService.info("Settings reset to defaults");
  };

  if (!printingSettings || Object.keys(printingSettings).length === 0) {
    return (
      <SettingsPaper>
        <div className="p-6 text-center">
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Loading printing settings...</p>
        </div>
      </SettingsPaper>
    );
  }

  return (
    <SettingsPaper className="max-w-3xl">
      <SectionHeader icon={Printer} title="Printing & Document Settings" />

      <SectionCard title="Payment Receipt Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="receipt-size"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Receipt Size
            </label>
            <select
              id="receipt-size"
              value={printingSettings.receipt_size || "A5"}
              onChange={(e) => setPrintingSettings({ ...printingSettings, receipt_size: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg transition-colors ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            >
              <option value="A5">A5 (148mm x 210mm) - Recommended</option>
              <option value="A6">A6 (105mm x 148mm) - Compact</option>
              <option value="A4">A4 (210mm x 297mm) - Full Page</option>
            </select>
            <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Select the size for payment receipt PDFs
            </p>
          </div>

          <div>
            <label
              htmlFor="print-on-paper-size"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Print On Paper Size
            </label>
            <select
              id="print-on-paper-size"
              value={printingSettings.print_on_paper_size || "A4"}
              onChange={(e) => setPrintingSettings({ ...printingSettings, print_on_paper_size: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg transition-colors ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            >
              <option value="A4">A4 (210mm x 297mm)</option>
              <option value="A5">A5 (148mm x 210mm)</option>
              <option value="A6">A6 (105mm x 148mm)</option>
            </select>
            <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Physical paper size loaded in printer
            </p>
          </div>
        </div>

        <div
          className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-teal-900/20 border-teal-700" : "bg-teal-50 border-teal-200"} border`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className={`${isDarkMode ? "text-teal-400" : "text-teal-600"} flex-shrink-0 mt-0.5`}
            />
            <div className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
              <strong className={isDarkMode ? "text-teal-300" : "text-teal-700"}>Example:</strong> If Receipt Size = A5
              and Print On = A4, the receipt will be A5 size centered on A4 paper. This is the most economical setting
              for standard printers.
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Printer Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="receipt-printer"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Receipt Printer
            </label>
            <select
              id="receipt-printer"
              value={printingSettings.receipt_printer || "default"}
              onChange={(e) => setPrintingSettings({ ...printingSettings, receipt_printer: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg transition-colors ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            >
              <option value="default">Default Printer</option>
              <option value="receipt_printer">Receipt Printer (if available)</option>
              <option value="pdf_only">Save as PDF Only (No Print)</option>
            </select>
            <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Printer for payment receipts
            </p>
          </div>

          <div>
            <label
              htmlFor="invoice-printer"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Invoice Printer
            </label>
            <select
              id="invoice-printer"
              value={printingSettings.invoice_printer || "default"}
              onChange={(e) => setPrintingSettings({ ...printingSettings, invoice_printer: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg transition-colors ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            >
              <option value="default">Default Printer</option>
              <option value="main_printer">Main Office Printer</option>
              <option value="pdf_only">Save as PDF Only (No Print)</option>
            </select>
            <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Printer for invoices and documents
            </p>
          </div>
        </div>

        <div
          className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-teal-900/20 border-teal-700" : "bg-teal-50 border-teal-200"} border`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className={`${isDarkMode ? "text-teal-400" : "text-teal-600"} flex-shrink-0 mt-0.5`}
            />
            <div className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
              <strong className={isDarkMode ? "text-teal-300" : "text-teal-700"}>Note:</strong> Printer selection works
              when using the browser&apos;s print dialog. For automatic printing, configure your browser&apos;s default
              printer settings.
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Document Copies">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label
              htmlFor="receipt-copies"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Receipt Copies
            </label>
            <input
              id="receipt-copies"
              type="number"
              min="1"
              max="5"
              value={printingSettings.receipt_copies || 1}
              onChange={(e) =>
                setPrintingSettings({ ...printingSettings, receipt_copies: parseInt(e.target.value, 10) || 1 })
              }
              className={`w-full px-4 py-2 border rounded-lg transition-colors ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            />
            <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Number of copies to print
            </p>
          </div>

          <div>
            <label
              htmlFor="invoice-copies"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              Invoice Copies
            </label>
            <input
              id="invoice-copies"
              type="number"
              min="1"
              max="5"
              value={printingSettings.invoice_copies || 1}
              onChange={(e) =>
                setPrintingSettings({ ...printingSettings, invoice_copies: parseInt(e.target.value, 10) || 1 })
              }
              className={`w-full px-4 py-2 border rounded-lg transition-colors ${isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
            />
            <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Number of copies to print
            </p>
          </div>

          <div>
            <div className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Auto Print
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printingSettings.auto_print_receipts || false}
                  onChange={(e) => setPrintingSettings({ ...printingSettings, auto_print_receipts: e.target.checked })}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Auto print receipts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printingSettings.auto_print_invoices || false}
                  onChange={(e) => setPrintingSettings({ ...printingSettings, auto_print_invoices: e.target.checked })}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Auto print invoices</span>
              </label>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end gap-3 mt-6 p-6 pt-0">
        <Button variant="outline" onClick={resetPrintingSettings}>
          Reset to Defaults
        </Button>
        <Button startIcon={<Save size={20} />} onClick={savePrintingSettingsHandler} disabled={savingPrintingSettings}>
          {savingPrintingSettings ? "Saving..." : "Save Printing Settings"}
        </Button>
      </div>
    </SettingsPaper>
  );
};

export default PrintingSettingsTab;
