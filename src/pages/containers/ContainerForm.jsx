import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { X, Loader2, Save } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { importContainerService } from "../../services/importContainerService";
import { suppliersAPI, purchaseOrdersAPI } from "../../services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/**
 * ContainerForm - Modal form for create/edit import containers
 */
export function ContainerForm({ container, companyId, onSave, onClose }) {
  const { isDarkMode } = useTheme();
  const isEditing = Boolean(container?.id);

  const [formData, setFormData] = useState({
    containerNumber: "",
    billOfLading: "",
    supplierId: "",
    shippingLine: "",
    vesselName: "",
    portOfLoading: "",
    portOfDischarge: "Jebel Ali, UAE",
    departureDate: "",
    eta: "",
    totalFob: "",
    totalFreight: "",
    totalInsurance: "",
    totalCustomsDuty: "",
    totalHandling: "",
    totalOtherCosts: "",
    purchaseOrderId: "",
    notes: "",
  });

  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Load suppliers and purchase orders
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [suppliersRes, posRes] = await Promise.all([
          suppliersAPI.getAll(),
          purchaseOrdersAPI.getAll({ companyId, status: "CONFIRMED" }),
        ]);
        setSuppliers(suppliersRes || []);
        setPurchaseOrders(posRes?.purchaseOrders || posRes || []);
      } catch (err) {
        console.error("Failed to load form data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  // Populate form when editing
  useEffect(() => {
    if (container) {
      setFormData({
        containerNumber: container.containerNumber || "",
        billOfLading: container.billOfLading || "",
        supplierId: container.supplierId?.toString() || "",
        shippingLine: container.shippingLine || "",
        vesselName: container.vesselName || "",
        portOfLoading: container.portOfLoading || "",
        portOfDischarge: container.portOfDischarge || "Jebel Ali, UAE",
        departureDate: container.departureDate?.split("T")[0] || "",
        eta: container.eta?.split("T")[0] || "",
        totalFob: container.totalFob || "",
        totalFreight: container.totalFreight || "",
        totalInsurance: container.totalInsurance || "",
        totalCustomsDuty: container.totalCustomsDuty || "",
        totalHandling: container.totalHandling || "",
        totalOtherCosts: container.totalOtherCosts || "",
        purchaseOrderId: container.purchaseOrderId?.toString() || "",
        notes: container.notes || "",
      });
    }
  }, [container]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.containerNumber.trim()) {
      errors.containerNumber = "Container number is required";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        companyId,
        containerNumber: formData.containerNumber.trim(),
        billOfLading: formData.billOfLading.trim(),
        supplierId: formData.supplierId ? parseInt(formData.supplierId) : null,
        shippingLine: formData.shippingLine.trim(),
        vesselName: formData.vesselName.trim(),
        portOfLoading: formData.portOfLoading.trim(),
        portOfDischarge: formData.portOfDischarge.trim(),
        departureDate: formData.departureDate || null,
        eta: formData.eta || null,
        totalFob: formData.totalFob || "0",
        totalFreight: formData.totalFreight || "0",
        totalInsurance: formData.totalInsurance || "0",
        totalCustomsDuty: formData.totalCustomsDuty || "0",
        totalHandling: formData.totalHandling || "0",
        totalOtherCosts: formData.totalOtherCosts || "0",
        purchaseOrderId: formData.purchaseOrderId
          ? parseInt(formData.purchaseOrderId)
          : null,
        notes: formData.notes.trim(),
      };

      let result;
      if (isEditing) {
        result = await importContainerService.updateContainer(
          container.id,
          payload,
        );
      } else {
        result = await importContainerService.createContainer(payload);
      }

      onSave(result);
    } catch (err) {
      console.error("Failed to save container:", err);
      setError(err.message || "Failed to save container");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full px-3 py-2 border rounded-lg ${
    isDarkMode
      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
  }`;

  const labelClass = `block text-sm font-medium mb-1 ${
    isDarkMode ? "text-gray-300" : "text-gray-700"
  }`;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          className={`p-8 rounded-xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"}`}
        >
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl ${
          isDarkMode ? "bg-[#1E2328] text-white" : "bg-white text-gray-900"
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 flex items-center justify-between p-4 border-b ${
            isDarkMode
              ? "bg-[#1E2328] border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h2 className="text-xl font-semibold">
            {isEditing ? "Edit Container" : "Add New Container"}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 ${
              isDarkMode ? "hover:bg-gray-700" : ""
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Container Identification */}
          <div className="space-y-4">
            <h3
              className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              Container Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={labelClass}>
                  Container Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.containerNumber}
                  onChange={(e) =>
                    handleChange("containerNumber", e.target.value)
                  }
                  placeholder="e.g., MSKU1234567"
                  className={inputClass}
                />
                {validationErrors.containerNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.containerNumber}
                  </p>
                )}
              </div>
              <div>
                <Label className={labelClass}>Bill of Lading</Label>
                <Input
                  value={formData.billOfLading}
                  onChange={(e) => handleChange("billOfLading", e.target.value)}
                  placeholder="B/L number"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Supplier & PO */}
          <div className="space-y-4">
            <h3
              className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              Supplier & Purchase Order
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={labelClass}>Supplier</Label>
                <Select
                  value={formData.supplierId}
                  onValueChange={(value) => handleChange("supplierId", value)}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem
                        key={supplier.id}
                        value={supplier.id.toString()}
                      >
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelClass}>Purchase Order</Label>
                <Select
                  value={formData.purchaseOrderId}
                  onValueChange={(value) =>
                    handleChange("purchaseOrderId", value)
                  }
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select PO (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders.map((po) => (
                      <SelectItem key={po.id} value={po.id.toString()}>
                        {po.poNumber || po.po_number} -{" "}
                        {po.supplierName || po.supplier_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Shipping Details */}
          <div className="space-y-4">
            <h3
              className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              Shipping Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={labelClass}>Shipping Line</Label>
                <Input
                  value={formData.shippingLine}
                  onChange={(e) => handleChange("shippingLine", e.target.value)}
                  placeholder="e.g., Maersk, MSC, CMA CGM"
                  className={inputClass}
                />
              </div>
              <div>
                <Label className={labelClass}>Vessel Name</Label>
                <Input
                  value={formData.vesselName}
                  onChange={(e) => handleChange("vesselName", e.target.value)}
                  placeholder="Vessel name"
                  className={inputClass}
                />
              </div>
              <div>
                <Label className={labelClass}>Port of Loading</Label>
                <Input
                  value={formData.portOfLoading}
                  onChange={(e) =>
                    handleChange("portOfLoading", e.target.value)
                  }
                  placeholder="e.g., Shanghai, China"
                  className={inputClass}
                />
              </div>
              <div>
                <Label className={labelClass}>Port of Discharge</Label>
                <Input
                  value={formData.portOfDischarge}
                  onChange={(e) =>
                    handleChange("portOfDischarge", e.target.value)
                  }
                  placeholder="e.g., Jebel Ali, UAE"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3
              className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={labelClass}>Departure Date</Label>
                <Input
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) =>
                    handleChange("departureDate", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <Label className={labelClass}>ETA (Estimated Arrival)</Label>
                <Input
                  type="date"
                  value={formData.eta}
                  onChange={(e) => handleChange("eta", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Cost Fields */}
          <div className="space-y-4">
            <h3
              className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              Costs (AED)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className={labelClass}>Total FOB</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.totalFob}
                  onChange={(e) => handleChange("totalFob", e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <Label className={labelClass}>Freight</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.totalFreight}
                  onChange={(e) => handleChange("totalFreight", e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <Label className={labelClass}>Insurance</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.totalInsurance}
                  onChange={(e) =>
                    handleChange("totalInsurance", e.target.value)
                  }
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <Label className={labelClass}>Customs Duty</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.totalCustomsDuty}
                  onChange={(e) =>
                    handleChange("totalCustomsDuty", e.target.value)
                  }
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <Label className={labelClass}>Handling</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.totalHandling}
                  onChange={(e) =>
                    handleChange("totalHandling", e.target.value)
                  }
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <Label className={labelClass}>Other Costs</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.totalOtherCosts}
                  onChange={(e) =>
                    handleChange("totalOtherCosts", e.target.value)
                  }
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3
              className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
            >
              Notes
            </h3>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes about this container..."
              rows={3}
              className={inputClass}
            />
          </div>

          {/* Footer */}
          <div
            className={`flex justify-end gap-3 pt-4 border-t ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Update Container" : "Create Container"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

ContainerForm.propTypes = {
  container: PropTypes.object,
  companyId: PropTypes.number.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ContainerForm;
