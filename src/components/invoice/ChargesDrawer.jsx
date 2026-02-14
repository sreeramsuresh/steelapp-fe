import { X } from "lucide-react";
import { useEffect } from "react";
import { FormSelect } from "@/components/ui/form-select";
import { SelectItem } from "@/components/ui/select";
import { DRAWER_OVERLAY_CLASSES, DRAWER_PANEL_CLASSES } from "./invoiceStyles";

const ChargesDrawer = ({
  isOpen,
  onClose,
  isDarkMode,
  invoice,
  setInvoice,
  formatCurrency: formatCurrencyFn,
  computedSubtotal,
  showFreightCharges,
  setShowFreightCharges,
  Input: InputComponent,
  VatHelpIcon: VatHelpIconComponent,
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <button
        type="button"
        className={DRAWER_OVERLAY_CLASSES(isOpen)}
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
        aria-label="Close drawer"
      />

      {/* Drawer Panel */}
      <div className={DRAWER_PANEL_CLASSES(isDarkMode, isOpen)}>
        <div className="p-4">
          {/* Sticky Header */}
          <div
            className={`sticky top-0 flex justify-between items-start gap-2.5 mb-3 p-4 -m-4 mb-3 z-[1] ${isDarkMode ? "bg-gray-800 border-b border-gray-700" : "bg-white border-b border-gray-200"}`}
          >
            <div>
              <div className="text-sm font-extrabold">Charges & Discount</div>
              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Configure freight, loading, and discount settings
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Discount Section */}
          <div
            className={`${isDarkMode ? "bg-[#0f151b] border-[#2a3640]" : "bg-gray-50 border-gray-200"} border rounded-[14px] p-4 mb-4`}
          >
            <h4
              className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
            >
              Discount
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <FormSelect
                label="Discount Type"
                value={invoice.discountType || "amount"}
                onValueChange={(value) =>
                  setInvoice((prev) => ({
                    ...prev,
                    discountType: value,
                    discountAmount: "",
                    discountPercentage: "",
                  }))
                }
              >
                <SelectItem value="amount">Fixed Amount (AED)</SelectItem>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
              </FormSelect>

              {invoice.discountType === "percentage" ? (
                <InputComponent
                  label="Discount %"
                  type="number"
                  value={invoice.discountPercentage || ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setInvoice((prev) => ({
                        ...prev,
                        discountPercentage: "",
                      }));
                      return;
                    }
                    const num = Number(raw);
                    if (Number.isNaN(num)) return;
                    const clamped = Math.max(0, Math.min(100, num));
                    setInvoice((prev) => ({
                      ...prev,
                      discountPercentage: clamped,
                    }));
                  }}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                />
              ) : (
                <InputComponent
                  label="Discount Amount"
                  type="number"
                  value={invoice.discountAmount || ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setInvoice((prev) => ({ ...prev, discountAmount: "" }));
                      return;
                    }
                    const num = Number(raw);
                    if (Number.isNaN(num)) return;
                    const clamped = Math.max(0, Math.min(computedSubtotal, num));
                    setInvoice((prev) => ({
                      ...prev,
                      discountAmount: clamped,
                    }));
                  }}
                  min="0"
                  max={computedSubtotal}
                  step="0.01"
                  placeholder="0.00"
                />
              )}
            </div>
            {/* Discount Summary */}
            <div className={`mt-3 pt-3 border-t ${isDarkMode ? "border-[#2a3640]" : "border-gray-200"}`}>
              <div className="flex justify-between items-center">
                <span className={`text-xs ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}>Discount Applied</span>
                <span className={`text-sm font-bold ${isDarkMode ? "text-[#f39c12]" : "text-amber-600"}`}>
                  -
                  {formatCurrencyFn(
                    invoice.discountType === "percentage"
                      ? (computedSubtotal * (invoice.discountPercentage || 0)) / 100
                      : invoice.discountAmount || 0
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Freight & Loading Charges Section */}
          <div
            className={`${isDarkMode ? "bg-[#0f151b] border-[#2a3640]" : "bg-gray-50 border-gray-200"} border rounded-[14px] p-4`}
          >
            <div className="flex justify-between items-center mb-3">
              <h4
                className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
              >
                <span>Freight & Loading Charges</span>
                <VatHelpIconComponent
                  heading="Auxiliary Charges & VAT Treatment (Article 45)"
                  content={[
                    "Add charges for services with supply: packing, freight, insurance, loading, other. These are taxable under UAE VAT Article 45.",
                    "All charges subject to 5% VAT by default.",
                  ]}
                />
              </h4>
              <button
                type="button"
                onClick={() => setShowFreightCharges(!showFreightCharges)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  showFreightCharges
                    ? isDarkMode
                      ? "bg-teal-600 text-white"
                      : "bg-teal-500 text-white"
                    : isDarkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {showFreightCharges ? "ON" : "OFF"}
              </button>
            </div>

            {showFreightCharges && (
              <>
                {/* Export Toggle */}
                <label
                  htmlFor="invoice-is-export"
                  className={`flex items-center gap-2 cursor-pointer mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  <input
                    id="invoice-is-export"
                    type="checkbox"
                    checked={invoice.isExport || false}
                    onChange={(e) => {
                      const isExport = e.target.checked;
                      setInvoice((prev) => ({
                        ...prev,
                        isExport,
                        packingChargesVat: isExport ? 0 : (parseFloat(prev.packingCharges) || 0) * 0.05,
                        freightChargesVat: isExport ? 0 : (parseFloat(prev.freightCharges) || 0) * 0.05,
                        insuranceChargesVat: isExport ? 0 : (parseFloat(prev.insuranceCharges) || 0) * 0.05,
                        loadingChargesVat: isExport ? 0 : (parseFloat(prev.loadingCharges) || 0) * 0.05,
                        otherChargesVat: isExport ? 0 : (parseFloat(prev.otherCharges) || 0) * 0.05,
                      }));
                    }}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium">Export Invoice (0% VAT)</span>
                </label>

                {/* Charge Fields Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Packing */}
                  <div>
                    <InputComponent
                      label="Packing"
                      type="number"
                      value={invoice.packingCharges || ""}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const vat = invoice.isExport ? 0 : amount * 0.05;
                        setInvoice((prev) => ({
                          ...prev,
                          packingCharges: amount,
                          packingChargesVat: vat,
                        }));
                      }}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <div className={`text-xs mt-1 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}>
                      VAT: {formatCurrencyFn(invoice.packingChargesVat || 0)}
                    </div>
                  </div>

                  {/* Freight */}
                  <div>
                    <InputComponent
                      label="Freight"
                      type="number"
                      value={invoice.freightCharges || ""}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const vat = invoice.isExport ? 0 : amount * 0.05;
                        setInvoice((prev) => ({
                          ...prev,
                          freightCharges: amount,
                          freightChargesVat: vat,
                        }));
                      }}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <div className={`text-xs mt-1 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}>
                      VAT: {formatCurrencyFn(invoice.freightChargesVat || 0)}
                    </div>
                  </div>

                  {/* Insurance */}
                  <div>
                    <InputComponent
                      label="Insurance"
                      type="number"
                      value={invoice.insuranceCharges || ""}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const vat = invoice.isExport ? 0 : amount * 0.05;
                        setInvoice((prev) => ({
                          ...prev,
                          insuranceCharges: amount,
                          insuranceChargesVat: vat,
                        }));
                      }}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <div className={`text-xs mt-1 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}>
                      VAT: {formatCurrencyFn(invoice.insuranceChargesVat || 0)}
                    </div>
                  </div>

                  {/* Loading */}
                  <div>
                    <InputComponent
                      label="Loading"
                      type="number"
                      value={invoice.loadingCharges || ""}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const vat = invoice.isExport ? 0 : amount * 0.05;
                        setInvoice((prev) => ({
                          ...prev,
                          loadingCharges: amount,
                          loadingChargesVat: vat,
                        }));
                      }}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <div className={`text-xs mt-1 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}>
                      VAT: {formatCurrencyFn(invoice.loadingChargesVat || 0)}
                    </div>
                  </div>

                  {/* Other */}
                  <div className="col-span-2">
                    <InputComponent
                      label="Other Charges"
                      type="number"
                      value={invoice.otherCharges || ""}
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const vat = invoice.isExport ? 0 : amount * 0.05;
                        setInvoice((prev) => ({
                          ...prev,
                          otherCharges: amount,
                          otherChargesVat: vat,
                        }));
                      }}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <div className={`text-xs mt-1 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}>
                      VAT: {formatCurrencyFn(invoice.otherChargesVat || 0)}
                    </div>
                  </div>
                </div>

                {/* Total Charges Summary */}
                <div className={`mt-4 pt-3 border-t ${isDarkMode ? "border-[#2a3640]" : "border-gray-200"}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}>Total Charges</span>
                    <span className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {formatCurrencyFn(
                        (invoice.packingCharges || 0) +
                          (invoice.freightCharges || 0) +
                          (invoice.insuranceCharges || 0) +
                          (invoice.loadingCharges || 0) +
                          (invoice.otherCharges || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}>
                      Total Charges VAT
                    </span>
                    <span className={`text-sm font-bold ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}>
                      {formatCurrencyFn(
                        (invoice.packingChargesVat || 0) +
                          (invoice.freightChargesVat || 0) +
                          (invoice.insuranceChargesVat || 0) +
                          (invoice.loadingChargesVat || 0) +
                          (invoice.otherChargesVat || 0)
                      )}
                    </span>
                  </div>
                  {invoice.isExport && <div className="text-xs text-amber-500 mt-2">Zero-rated for export</div>}
                </div>
              </>
            )}
          </div>

          {/* Sticky Footer */}
          <div
            className="sticky bottom-0 pt-4 mt-4"
            style={{
              background: isDarkMode
                ? "linear-gradient(to top, rgba(20,26,32,1) 70%, rgba(20,26,32,0))"
                : "linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))",
            }}
          >
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                  isDarkMode
                    ? "bg-[#0f151b] border border-[#2a3640] text-[#e6edf3] hover:border-[#4aa3ff]"
                    : "bg-white border border-gray-300 text-gray-900 hover:border-blue-500"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChargesDrawer;
