import { X } from "lucide-react";
import { useEffect } from "react";
import AllocationDrawer from "../AllocationDrawer";
import { DRAWER_OVERLAY_CLASSES, DRAWER_PANEL_CLASSES, DRAWER_STYLE } from "./invoiceStyles";

const AddProductDrawer = ({
  isOpen,
  onClose,
  isDarkMode,
  draftInvoiceId,
  warehouseId,
  companyId,
  onAddLineItem,
  customerId = null,
  priceListId = null,
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
      <div className={DRAWER_PANEL_CLASSES(isDarkMode, isOpen)} style={DRAWER_STYLE}>
        <div className="p-4">
          {/* Sticky Header */}
          <div className="sticky top-0 flex justify-between items-start gap-2.5 mb-3 p-4 -m-4 mb-3 z-[1] bg-teal-600 border-b border-teal-700">
            <div>
              <div className="text-sm font-extrabold text-white">Add Product Line</div>
              <div className="text-xs text-teal-100">Search products, allocate batches, and add to invoice</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-teal-700 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* AllocationDrawer Content */}
          <AllocationDrawer
            draftInvoiceId={draftInvoiceId}
            warehouseId={warehouseId}
            companyId={companyId}
            customerId={customerId}
            priceListId={priceListId}
            onAddLineItem={(lineItem) => {
              onAddLineItem(lineItem);
              onClose();
            }}
            onCancel={onClose}
            visible={true}
          />
        </div>
      </div>
    </>
  );
};

export default AddProductDrawer;
