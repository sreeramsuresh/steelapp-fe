import { ChevronDown, Loader2, Save, X } from "lucide-react";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "../../contexts/ThemeContext";
import { suppliersAPI } from "../../services/api";
import { importContainerService } from "../../services/importContainerService";
import { purchaseOrderService } from "../../services/purchaseOrderService";

// Container types
const CONTAINER_TYPES = [
  { value: "20FT", label: "20FT Standard" },
  { value: "40FT", label: "40FT Standard" },
  { value: "40HC", label: "40FT High Cube" },
  { value: "45HC", label: "45FT High Cube" },
  { value: "REEFER_20", label: "20FT Reefer" },
  { value: "REEFER_40", label: "40FT Reefer" },
];

// Container sizes
const CONTAINER_SIZES = [
  { value: "20", label: "20 feet" },
  { value: "40", label: "40 feet" },
  { value: "45", label: "45 feet" },
];

// Customs clearance statuses
const CUSTOMS_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "CLEARED", label: "Cleared" },
  { value: "ON_HOLD", label: "On Hold" },
];

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
    // Phase 2b fields
    containerType: "40FT",
    containerSize: "40",
    isHighCube: false,
    isReefer: false,
    temperatureSetting: "",
    carrierSealNumber: "",
    customsSealNumber: "",
    shipperSealNumber: "",
    tareWeight: "",
    grossWeight: "",
    netWeight: "",
    vgmWeight: "",
    vgmCertifiedBy: "",
    vgmCertifiedAt: "",
    customsClearanceStatus: "PENDING",
    customsAgent: "",
    customsBrokerReference: "",
    customsEntryNumber: "",
    customsClearanceDate: "",
    preShipmentInspection: false,
    psiCertificateNumber: "",
    psiDate: "",
    certificateOfOriginNumber: "",
    phytosanitaryCertificate: "",
    freeDaysAtPort: 0,
    demurrageStartDate: "",
    demurrageDaysIncurred: 0,
    demurrageCost: "",
    detentionStartDate: "",
    detentionDaysIncurred: 0,
    detentionCost: "",
    containerReleased: false,
    releaseDate: "",
    releaseReference: "",
    deliveryOrderNumber: "",
    emptyReturnDate: "",
    emptyReturnDepot: "",
    portCharges: "",
    storageCharges: "",
    documentationFees: "",
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
          purchaseOrderService.getAll({ companyId, status: "CONFIRMED" }),
        ]);
        // Ensure suppliers is always an array
        setSuppliers(Array.isArray(suppliersRes) ? suppliersRes : []);
        // Ensure purchase orders is always an array
        const poArray = posRes?.purchaseOrders || posRes;
        setPurchaseOrders(Array.isArray(poArray) ? poArray : []);
      } catch (err) {
        console.error("Failed to load form data:", err);
        // Ensure state is reset to safe defaults on error
        setSuppliers([]);
        setPurchaseOrders([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  // Auto-calculate netWeight when gross/tare weights change
  useEffect(() => {
    const gross = parseFloat(formData.grossWeight) || 0;
    const tare = parseFloat(formData.tareWeight) || 0;
    const netWeight = gross - tare;
    const calculatedNetWeight = netWeight > 0 ? netWeight.toString() : "";
    const currentNetWeight = formData.netWeight ? formData.netWeight.toString() : "";

    if (calculatedNetWeight !== currentNetWeight) {
      setFormData((prev) => ({ ...prev, netWeight: calculatedNetWeight }));
    }
  }, [formData.grossWeight, formData.tareWeight, formData.netWeight]);

  // Auto-calculate demurrage days
  useEffect(() => {
    if (formData.demurrageStartDate) {
      const startDate = new Date(formData.demurrageStartDate);
      const today = new Date();
      const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      const daysIncurred = Math.max(0, daysDiff - (parseInt(formData.freeDaysAtPort, 10) || 0));
      const calculatedDays = daysIncurred.toString();
      const currentDays = formData.demurrageDaysIncurred ? formData.demurrageDaysIncurred.toString() : "0";

      if (calculatedDays !== currentDays) {
        setFormData((prev) => ({
          ...prev,
          demurrageDaysIncurred: daysIncurred,
        }));
      }
    } else {
      const currentDays = formData.demurrageDaysIncurred ? formData.demurrageDaysIncurred.toString() : "0";
      if (currentDays !== "0") {
        setFormData((prev) => ({ ...prev, demurrageDaysIncurred: 0 }));
      }
    }
  }, [formData.demurrageStartDate, formData.freeDaysAtPort, formData.demurrageDaysIncurred]);

  // Auto-calculate detention days
  useEffect(() => {
    if (formData.detentionStartDate) {
      const startDate = new Date(formData.detentionStartDate);
      const today = new Date();
      const daysIncurred = Math.max(0, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)));
      const calculatedDays = daysIncurred.toString();
      const currentDays = formData.detentionDaysIncurred ? formData.detentionDaysIncurred.toString() : "0";

      if (calculatedDays !== currentDays) {
        setFormData((prev) => ({
          ...prev,
          detentionDaysIncurred: daysIncurred,
        }));
      }
    } else {
      const currentDays = formData.detentionDaysIncurred ? formData.detentionDaysIncurred.toString() : "0";
      if (currentDays !== "0") {
        setFormData((prev) => ({ ...prev, detentionDaysIncurred: 0 }));
      }
    }
  }, [formData.detentionStartDate, formData.detentionDaysIncurred]);

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
        // Phase 2b fields
        containerType: container.containerType || "40FT",
        containerSize: container.containerSize || "40",
        isHighCube: container.isHighCube || false,
        isReefer: container.isReefer || false,
        temperatureSetting: container.temperatureSetting || "",
        carrierSealNumber: container.carrierSealNumber || "",
        customsSealNumber: container.customsSealNumber || "",
        shipperSealNumber: container.shipperSealNumber || "",
        tareWeight: container.tareWeight || "",
        grossWeight: container.grossWeight || "",
        netWeight: container.netWeight || "",
        vgmWeight: container.vgmWeight || "",
        vgmCertifiedBy: container.vgmCertifiedBy || "",
        vgmCertifiedAt: container.vgmCertifiedAt?.split("T")[0] || "",
        customsClearanceStatus: container.customsClearanceStatus || "PENDING",
        customsAgent: container.customsAgent || "",
        customsBrokerReference: container.customsBrokerReference || "",
        customsEntryNumber: container.customsEntryNumber || "",
        customsClearanceDate: container.customsClearanceDate?.split("T")[0] || "",
        preShipmentInspection: container.preShipmentInspection || false,
        psiCertificateNumber: container.psiCertificateNumber || "",
        psiDate: container.psiDate?.split("T")[0] || "",
        certificateOfOriginNumber: container.certificateOfOriginNumber || "",
        phytosanitaryCertificate: container.phytosanitaryCertificate || "",
        freeDaysAtPort: container.freeDaysAtPort || 0,
        demurrageStartDate: container.demurrageStartDate?.split("T")[0] || "",
        demurrageDaysIncurred: container.demurrageDaysIncurred || 0,
        demurrageCost: container.demurrageCost || "",
        detentionStartDate: container.detentionStartDate?.split("T")[0] || "",
        detentionDaysIncurred: container.detentionDaysIncurred || 0,
        detentionCost: container.detentionCost || "",
        containerReleased: container.containerReleased || false,
        releaseDate: container.releaseDate?.split("T")[0] || "",
        releaseReference: container.releaseReference || "",
        deliveryOrderNumber: container.deliveryOrderNumber || "",
        emptyReturnDate: container.emptyReturnDate?.split("T")[0] || "",
        emptyReturnDepot: container.emptyReturnDepot || "",
        portCharges: container.portCharges || "",
        storageCharges: container.storageCharges || "",
        documentationFees: container.documentationFees || "",
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
      // Calculate total landed cost including new Phase 2b charges
      const totalLandedCost =
        parseFloat(formData.totalFob || 0) +
        parseFloat(formData.totalFreight || 0) +
        parseFloat(formData.totalInsurance || 0) +
        parseFloat(formData.totalCustomsDuty || 0) +
        parseFloat(formData.totalHandling || 0) +
        parseFloat(formData.totalOtherCosts || 0) +
        parseFloat(formData.portCharges || 0) +
        parseFloat(formData.storageCharges || 0) +
        parseFloat(formData.documentationFees || 0);

      const payload = {
        companyId,
        containerNumber: formData.containerNumber.trim(),
        billOfLading: formData.billOfLading.trim(),
        supplierId: formData.supplierId ? parseInt(formData.supplierId, 10) : null,
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
        purchaseOrderId: formData.purchaseOrderId ? parseInt(formData.purchaseOrderId, 10) : null,
        notes: formData.notes.trim(),
        // Phase 2b fields
        containerType: formData.containerType,
        containerSize: formData.containerSize,
        isHighCube: formData.isHighCube,
        isReefer: formData.isReefer,
        temperatureSetting: formData.isReefer ? formData.temperatureSetting : null,
        carrierSealNumber: formData.carrierSealNumber.trim(),
        customsSealNumber: formData.customsSealNumber.trim(),
        shipperSealNumber: formData.shipperSealNumber.trim(),
        tareWeight: formData.tareWeight || null,
        grossWeight: formData.grossWeight || null,
        netWeight: formData.netWeight || null,
        vgmWeight: formData.vgmWeight || null,
        vgmCertifiedBy: formData.vgmCertifiedBy.trim(),
        vgmCertifiedAt: formData.vgmCertifiedAt || null,
        customsClearanceStatus: formData.customsClearanceStatus,
        customsAgent: formData.customsAgent.trim(),
        customsBrokerReference: formData.customsBrokerReference.trim(),
        customsEntryNumber: formData.customsEntryNumber.trim(),
        customsClearanceDate: formData.customsClearanceDate || null,
        preShipmentInspection: formData.preShipmentInspection,
        psiCertificateNumber: formData.preShipmentInspection ? formData.psiCertificateNumber.trim() : null,
        psiDate: formData.preShipmentInspection ? formData.psiDate || null : null,
        certificateOfOriginNumber: formData.certificateOfOriginNumber.trim(),
        phytosanitaryCertificate: formData.phytosanitaryCertificate.trim(),
        freeDaysAtPort: parseInt(formData.freeDaysAtPort, 10) || 0,
        demurrageStartDate: formData.demurrageStartDate || null,
        demurrageDaysIncurred: parseInt(formData.demurrageDaysIncurred, 10) || 0,
        demurrageCost: formData.demurrageCost || "0",
        detentionStartDate: formData.detentionStartDate || null,
        detentionDaysIncurred: parseInt(formData.detentionDaysIncurred, 10) || 0,
        detentionCost: formData.detentionCost || "0",
        containerReleased: formData.containerReleased,
        releaseDate: formData.containerReleased ? formData.releaseDate || null : null,
        releaseReference: formData.containerReleased ? formData.releaseReference.trim() : null,
        deliveryOrderNumber: formData.deliveryOrderNumber.trim(),
        emptyReturnDate: formData.emptyReturnDate || null,
        emptyReturnDepot: formData.emptyReturnDepot.trim(),
        portCharges: formData.portCharges || "0",
        storageCharges: formData.storageCharges || "0",
        documentationFees: formData.documentationFees || "0",
        totalLandedCost: totalLandedCost.toString(),
      };

      let result;
      if (isEditing) {
        result = await importContainerService.updateContainer(container.id, payload);
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

  const labelClass = `block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className={`p-8 rounded-xl ${isDarkMode ? "bg-[#1E2328]" : "bg-white"}`}>
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      data-testid="container-modal"
    >
      <div
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl ${
          isDarkMode ? "bg-[#1E2328] text-white" : "bg-white text-gray-900"
        }`}
        data-testid="container-form"
      >
        {/* Header */}
        <div
          className={`sticky top-0 flex items-center justify-between p-4 border-b ${
            isDarkMode ? "bg-[#1E2328] border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <h2 className="text-xl font-semibold">{isEditing ? "Edit Container" : "Add New Container"}</h2>
          <button type="button" onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 ${isDarkMode ? "hover:bg-gray-700" : ""}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">{error}</div>}

          {/* Container Identification */}
          <div className="space-y-4">
            <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
              Container Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={labelClass}>
                  Container Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.containerNumber}
                  onChange={(e) => handleChange("containerNumber", e.target.value)}
                  placeholder="e.g., MSKU1234567"
                  className={inputClass}
                  data-testid="container-number"
                />
                {validationErrors.containerNumber && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.containerNumber}</p>
                )}
              </div>
              <div>
                <Label className={labelClass}>Bill of Lading</Label>
                <Input
                  value={formData.billOfLading}
                  onChange={(e) => handleChange("billOfLading", e.target.value)}
                  placeholder="B/L number"
                  className={inputClass}
                  data-testid="bill-of-lading"
                />
              </div>
            </div>
          </div>

          {/* Supplier & PO */}
          <div className="space-y-4">
            <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
              Supplier & Purchase Order
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={labelClass}>Supplier</Label>
                <Select value={formData.supplierId} onValueChange={(value) => handleChange("supplierId", value)}>
                  <SelectTrigger className={inputClass} data-testid="supplier-select">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
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
                  onValueChange={(value) => handleChange("purchaseOrderId", value)}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select PO (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders?.map((po) => (
                      <SelectItem key={po.id} value={po.id.toString()}>
                        {po.poNumber || po.po_number} - {po.supplierName || po.supplier_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Shipping Details */}
          <div className="space-y-4">
            <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Shipping Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={labelClass}>Shipping Line</Label>
                <Input
                  value={formData.shippingLine}
                  onChange={(e) => handleChange("shippingLine", e.target.value)}
                  placeholder="e.g., Maersk, MSC, CMA CGM"
                  className={inputClass}
                  data-testid="shipping-line"
                />
              </div>
              <div>
                <Label className={labelClass}>Vessel Name</Label>
                <Input
                  value={formData.vesselName}
                  onChange={(e) => handleChange("vesselName", e.target.value)}
                  placeholder="Vessel name"
                  className={inputClass}
                  data-testid="vessel-name"
                />
              </div>
              <div>
                <Label className={labelClass}>Port of Loading</Label>
                <Input
                  value={formData.portOfLoading}
                  onChange={(e) => handleChange("portOfLoading", e.target.value)}
                  placeholder="e.g., Shanghai, China"
                  className={inputClass}
                  data-testid="port-of-loading"
                />
              </div>
              <div>
                <Label className={labelClass}>Port of Discharge</Label>
                <Input
                  value={formData.portOfDischarge}
                  onChange={(e) => handleChange("portOfDischarge", e.target.value)}
                  placeholder="e.g., Jebel Ali, UAE"
                  className={inputClass}
                  data-testid="port-of-discharge"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={labelClass}>Departure Date</Label>
                <Input
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => handleChange("departureDate", e.target.value)}
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
            <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Costs (AED)</h3>
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
                  onChange={(e) => handleChange("totalInsurance", e.target.value)}
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
                  onChange={(e) => handleChange("totalCustomsDuty", e.target.value)}
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
                  onChange={(e) => handleChange("totalHandling", e.target.value)}
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
                  onChange={(e) => handleChange("totalOtherCosts", e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* PHASE 2B ACCORDION SECTIONS */}

          {/* Container Specifications Accordion */}
          <details open className="border rounded-lg overflow-hidden">
            <summary className="cursor-pointer p-4 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                Container Specifications
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className={labelClass}>Container Type</Label>
                  <Select
                    value={formData.containerType}
                    onValueChange={(value) => handleChange("containerType", value)}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTAINER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>Container Size</Label>
                  <Select
                    value={formData.containerSize}
                    onValueChange={(value) => handleChange("containerSize", value)}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTAINER_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isHighCube}
                      onChange={(e) => handleChange("isHighCube", e.target.checked)}
                    />
                    <span className="text-sm">High Cube</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isReefer}
                      onChange={(e) => handleChange("isReefer", e.target.checked)}
                    />
                    <span className="text-sm">Reefer</span>
                  </label>
                </div>
              </div>
              {formData.isReefer && (
                <div>
                  <Label className={labelClass}>Temperature Setting (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.temperatureSetting}
                    onChange={(e) => handleChange("temperatureSetting", e.target.value)}
                    placeholder="-20"
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </details>

          {/* Seal Numbers & Security Accordion */}
          <details className="border rounded-lg overflow-hidden">
            <summary className="cursor-pointer p-4 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                Seal Numbers & Security
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className={labelClass}>Carrier Seal Number</Label>
                  <Input
                    value={formData.carrierSealNumber}
                    onChange={(e) => handleChange("carrierSealNumber", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Customs Seal Number</Label>
                  <Input
                    value={formData.customsSealNumber}
                    onChange={(e) => handleChange("customsSealNumber", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Shipper Seal Number</Label>
                  <Input
                    value={formData.shipperSealNumber}
                    onChange={(e) => handleChange("shipperSealNumber", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Weight Measurements Accordion */}
          <details className="border rounded-lg overflow-hidden">
            <summary className="cursor-pointer p-4 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Weight Measurements</h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className={labelClass}>Tare Weight (KG)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tareWeight}
                    onChange={(e) => handleChange("tareWeight", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Gross Weight (KG)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.grossWeight}
                    onChange={(e) => handleChange("grossWeight", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Net Weight (KG)</Label>
                  <Input type="number" value={formData.netWeight} disabled className={inputClass} />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className={labelClass}>VGM Weight (KG)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.vgmWeight}
                    onChange={(e) => handleChange("vgmWeight", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>VGM Certified By</Label>
                  <Input
                    value={formData.vgmCertifiedBy}
                    onChange={(e) => handleChange("vgmCertifiedBy", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>VGM Certified Date</Label>
                  <Input
                    type="datetime-local"
                    value={formData.vgmCertifiedAt}
                    onChange={(e) => handleChange("vgmCertifiedAt", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Customs Clearance Accordion */}
          <details className="border rounded-lg overflow-hidden">
            <summary className="cursor-pointer p-4 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Customs Clearance</h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>Clearance Status</Label>
                  <Select
                    value={formData.customsClearanceStatus}
                    onValueChange={(value) => handleChange("customsClearanceStatus", value)}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMS_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClass}>Customs Agent</Label>
                  <Input
                    value={formData.customsAgent}
                    onChange={(e) => handleChange("customsAgent", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className={labelClass}>Broker Reference</Label>
                  <Input
                    value={formData.customsBrokerReference}
                    onChange={(e) => handleChange("customsBrokerReference", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Entry Number</Label>
                  <Input
                    value={formData.customsEntryNumber}
                    onChange={(e) => handleChange("customsEntryNumber", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Clearance Date</Label>
                  <Input
                    type="date"
                    value={formData.customsClearanceDate}
                    onChange={(e) => handleChange("customsClearanceDate", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Inspection & Certificates Accordion */}
          <details className="border rounded-lg overflow-hidden">
            <summary className="cursor-pointer p-4 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                Inspection & Certificates
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.preShipmentInspection}
                    onChange={(e) => handleChange("preShipmentInspection", e.target.checked)}
                  />
                  <span className="text-sm">Pre-Shipment Inspection Required</span>
                </label>
              </div>
              {formData.preShipmentInspection && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className={labelClass}>PSI Certificate Number</Label>
                    <Input
                      value={formData.psiCertificateNumber}
                      onChange={(e) => handleChange("psiCertificateNumber", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label className={labelClass}>PSI Date</Label>
                    <Input
                      type="date"
                      value={formData.psiDate}
                      onChange={(e) => handleChange("psiDate", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className={labelClass}>Certificate of Origin Number</Label>
                  <Input
                    value={formData.certificateOfOriginNumber}
                    onChange={(e) => handleChange("certificateOfOriginNumber", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Phytosanitary Certificate</Label>
                  <Input
                    value={formData.phytosanitaryCertificate}
                    onChange={(e) => handleChange("phytosanitaryCertificate", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Demurrage & Detention Accordion */}
          <details className="border rounded-lg overflow-hidden">
            <summary className="cursor-pointer p-4 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                Demurrage & Detention Tracking
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div>
                <Label className={labelClass}>Free Days at Port</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.freeDaysAtPort}
                  onChange={(e) => handleChange("freeDaysAtPort", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className={labelClass}>Demurrage Start Date</Label>
                  <Input
                    type="date"
                    value={formData.demurrageStartDate}
                    onChange={(e) => handleChange("demurrageStartDate", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Demurrage Days Incurred</Label>
                  <Input type="number" value={formData.demurrageDaysIncurred} disabled className={inputClass} />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                </div>
                <div>
                  <Label className={labelClass}>Demurrage Cost (AED)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.demurrageCost}
                    onChange={(e) => handleChange("demurrageCost", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className={labelClass}>Detention Start Date</Label>
                  <Input
                    type="date"
                    value={formData.detentionStartDate}
                    onChange={(e) => handleChange("detentionStartDate", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Detention Days Incurred</Label>
                  <Input type="number" value={formData.detentionDaysIncurred} disabled className={inputClass} />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                </div>
                <div>
                  <Label className={labelClass}>Detention Cost (AED)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.detentionCost}
                    onChange={(e) => handleChange("detentionCost", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Container Release & Delivery Accordion */}
          <details className="border rounded-lg overflow-hidden">
            <summary className="cursor-pointer p-4 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                Container Release & Delivery
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4 space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.containerReleased}
                    onChange={(e) => handleChange("containerReleased", e.target.checked)}
                  />
                  <span className="text-sm">Container Released</span>
                </label>
              </div>
              {formData.containerReleased && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className={labelClass}>Release Date</Label>
                    <Input
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) => handleChange("releaseDate", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label className={labelClass}>Release Reference</Label>
                    <Input
                      value={formData.releaseReference}
                      onChange={(e) => handleChange("releaseReference", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className={labelClass}>Delivery Order Number</Label>
                  <Input
                    value={formData.deliveryOrderNumber}
                    onChange={(e) => handleChange("deliveryOrderNumber", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Empty Return Date</Label>
                  <Input
                    type="date"
                    value={formData.emptyReturnDate}
                    onChange={(e) => handleChange("emptyReturnDate", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Empty Return Depot</Label>
                  <Input
                    value={formData.emptyReturnDepot}
                    onChange={(e) => handleChange("emptyReturnDepot", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Additional Cost Breakdown Accordion */}
          <details className="border rounded-lg overflow-hidden">
            <summary className="cursor-pointer p-4 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                Additional Cost Breakdown
              </h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className={labelClass}>Port Charges (AED)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.portCharges}
                    onChange={(e) => handleChange("portCharges", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Storage Charges (AED)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.storageCharges}
                    onChange={(e) => handleChange("storageCharges", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className={labelClass}>Documentation Fees (AED)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.documentationFees}
                    onChange={(e) => handleChange("documentationFees", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                These charges will be included in total landed cost calculation
              </p>
            </div>
          </details>

          {/* Notes */}
          <details className="border rounded-lg overflow-hidden">
            <summary className="cursor-pointer p-4 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
              <h3 className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Notes</h3>
              <ChevronDown className="w-5 h-5" />
            </summary>
            <div className="p-4">
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Additional notes about this container..."
                rows={3}
                className={inputClass}
              />
            </div>
          </details>

          {/* Footer */}
          <div className={`flex justify-end gap-3 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} data-testid="cancel-button">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} data-testid="save-button">
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
