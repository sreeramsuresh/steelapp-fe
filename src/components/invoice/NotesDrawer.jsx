import { X } from "lucide-react";
import { useEffect } from "react";
import { DRAWER_OVERLAY_CLASSES, DRAWER_PANEL_CLASSES } from "./invoiceStyles";

const NotesDrawer = ({
  isOpen,
  onClose,
  isDarkMode,
  invoice,
  setInvoice,
  Textarea: TextareaComponent,
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
              <div className="text-sm font-extrabold">Notes & Terms</div>
              <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Add invoice notes, VAT notes, and payment terms
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

          {/* Invoice Notes */}
          <div
            className={`${isDarkMode ? "bg-[#0f151b] border-[#2a3640]" : "bg-gray-50 border-gray-200"} border rounded-[14px] p-4 mb-4`}
          >
            <h4
              className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
            >
              Invoice Notes
            </h4>
            <TextareaComponent
              value={invoice.notes || ""}
              onChange={(e) => setInvoice((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes for the customer..."
              autoGrow={true}
              rows={3}
            />
          </div>

          {/* VAT Tax Notes */}
          <div
            className={`${isDarkMode ? "bg-[#0f151b] border-[#2a3640]" : "bg-gray-50 border-gray-200"} border rounded-[14px] p-4 mb-4`}
          >
            <h4
              className={`text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-1 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
            >
              <span>VAT Tax Notes</span>
              <VatHelpIconComponent
                content={[
                  "Required if supply is zero-rated or reverse charge applies.",
                  "Must explain reason for 0% VAT treatment.",
                  "Part of FTA Form 201 compliance documentation.",
                ]}
              />
            </h4>
            <TextareaComponent
              value={invoice.taxNotes || ""}
              onChange={(e) => setInvoice((prev) => ({ ...prev, taxNotes: e.target.value }))}
              placeholder="Explanation for zero-rated or exempt supplies (FTA requirement)..."
              autoGrow={true}
              rows={2}
            />
            <p className={`text-xs mt-2 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}>
              Required when items are zero-rated or exempt from VAT
            </p>
          </div>

          {/* Payment Terms & Conditions */}
          <div
            className={`${isDarkMode ? "bg-[#0f151b] border-[#2a3640]" : "bg-gray-50 border-gray-200"} border rounded-[14px] p-4`}
          >
            <h4
              className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
            >
              Payment Terms & Conditions
            </h4>
            <TextareaComponent
              value={invoice.terms || ""}
              onChange={(e) => setInvoice((prev) => ({ ...prev, terms: e.target.value }))}
              placeholder="Enter payment terms and conditions..."
              autoGrow={true}
              rows={3}
            />
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

export default NotesDrawer;
