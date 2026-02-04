import {
  Calculator,
  CheckCircle,
  Layers,
  Package,
  Percent,
  Plus,
  Ruler,
  Save,
  Settings,
  Weight,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

const PriceCalculator = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("calculator");
  const [selectedProduct, setSelectedProduct] = useState("rebar");
  const [dimensions, setDimensions] = useState({
    length: "",
    width: "",
    thickness: "",
    diameter: "",
    quantity: "",
  });
  const [customRules, setCustomRules] = useState([]);
  const [bulkDiscounts, setBulkDiscounts] = useState([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    condition: "quantity",
    operator: "greater_than",
    value: "",
    adjustmentType: "percentage",
    adjustmentValue: "",
    active: true,
  });
  const [newDiscount, setNewDiscount] = useState({
    name: "",
    minQuantity: "",
    discountPercentage: "",
    active: true,
  });

  // Base steel prices per kg (these would normally come from an API)
  const basePrices = useMemo(
    () => ({
      rebar: { fe415: 48, fe500: 52, fe550: 55 },
      structural: { ms: 55, ss304: 180, ss316: 220 },
      sheet: { ms: 62, galvanized: 75, ss304: 190 },
      pipe: { ms: 58, galvanized: 70, ss304: 185 },
      angle: { ms: 55, galvanized: 68 },
      round: { ms: 53, ss304: 175 },
      flat: { ms: 54, ss304: 178 },
      wire: { ms: 60, galvanized: 72 },
    }),
    []
  );

  // Steel density and weight calculations
  const steelDensity = 7850; // kg/m³

  const productTypes = useMemo(
    () => ({
      rebar: {
        name: "TMT Rebar",
        grades: ["fe415", "fe500", "fe550"],
        weightFormula: "circular",
        dimensions: ["diameter", "length"],
      },
      structural: {
        name: "Structural Steel",
        grades: ["ms", "ss304", "ss316"],
        weightFormula: "rectangular",
        dimensions: ["length", "width", "thickness"],
      },
      sheet: {
        name: "Steel Sheet",
        grades: ["ms", "galvanized", "ss304"],
        weightFormula: "sheet",
        dimensions: ["length", "width", "thickness"],
      },
      pipe: {
        name: "Steel Pipe",
        grades: ["ms", "galvanized", "ss304"],
        weightFormula: "pipe",
        dimensions: ["diameter", "thickness", "length"],
      },
      angle: {
        name: "Steel Angle",
        grades: ["ms", "galvanized"],
        weightFormula: "angle",
        dimensions: ["length", "width", "thickness"],
      },
      round: {
        name: "Round Bar",
        grades: ["ms", "ss304"],
        weightFormula: "circular",
        dimensions: ["diameter", "length"],
      },
      flat: {
        name: "Flat Bar",
        grades: ["ms", "ss304"],
        weightFormula: "rectangular",
        dimensions: ["length", "width", "thickness"],
      },
      wire: {
        name: "Steel Wire",
        grades: ["ms", "galvanized"],
        weightFormula: "circular",
        dimensions: ["diameter", "length"],
      },
    }),
    []
  );

  const [selectedGrade, setSelectedGrade] = useState(productTypes[selectedProduct].grades[0]);

  useEffect(() => {
    // Load saved data
    const savedRules = localStorage.getItem("steel-app-pricing-rules");
    const savedDiscounts = localStorage.getItem("steel-app-bulk-discounts");

    if (savedRules) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomRules(JSON.parse(savedRules));
    } else {
      // Default pricing rules
      const defaultRules = [
        {
          id: "1",
          name: "High Volume Discount",
          condition: "quantity",
          operator: "greater_than",
          value: 1000,
          adjustmentType: "percentage",
          adjustmentValue: -5,
          active: true,
        },
        {
          id: "2",
          name: "Premium Grade Surcharge",
          condition: "grade",
          operator: "equals",
          value: "ss316",
          adjustmentType: "percentage",
          adjustmentValue: 10,
          active: true,
        },
        {
          id: "3",
          name: "Small Order Fee",
          condition: "total",
          operator: "less_than",
          value: 5000,
          adjustmentType: "fixed",
          adjustmentValue: 500,
          active: true,
        },
      ];
      setCustomRules(defaultRules);
      localStorage.setItem("steel-app-pricing-rules", JSON.stringify(defaultRules));
    }

    if (savedDiscounts) {
      setBulkDiscounts(JSON.parse(savedDiscounts));
    } else {
      // Default bulk discounts
      const defaultDiscounts = [
        {
          id: "1",
          name: "5+ tonnes",
          minQuantity: 5000,
          discountPercentage: 3,
          active: true,
        },
        {
          id: "2",
          name: "10+ tonnes",
          minQuantity: 10000,
          discountPercentage: 5,
          active: true,
        },
        {
          id: "3",
          name: "25+ tonnes",
          minQuantity: 25000,
          discountPercentage: 8,
          active: true,
        },
        {
          id: "4",
          name: "50+ tonnes",
          minQuantity: 50000,
          discountPercentage: 12,
          active: true,
        },
      ];
      setBulkDiscounts(defaultDiscounts);
      localStorage.setItem("steel-app-bulk-discounts", JSON.stringify(defaultDiscounts));
    }

    // Reset grade when product changes
    setSelectedGrade(productTypes[selectedProduct].grades[0]);
  }, [selectedProduct, productTypes]);

  const calculateWeight = useMemo(() => {
    const { weightFormula } = productTypes[selectedProduct];
    const { length, width, thickness, diameter, quantity } = dimensions;

    let weightPerUnit = 0;

    switch (weightFormula) {
      case "circular": // For rebar, round bars, wire
        if (diameter && length) {
          const radiusM = diameter / 1000 / 2; // Convert mm to m
          const lengthM = length;
          const volume = Math.PI * radiusM * radiusM * lengthM;
          weightPerUnit = volume * steelDensity;
        }
        break;

      case "rectangular": // For structural steel, flat bars
        if (length && width && thickness) {
          const lengthM = length;
          const widthM = width / 1000; // Convert mm to m
          const thicknessM = thickness / 1000; // Convert mm to m
          const volume = lengthM * widthM * thicknessM;
          weightPerUnit = volume * steelDensity;
        }
        break;

      case "sheet": // For steel sheets
        if (length && width && thickness) {
          const lengthM = length / 1000; // Convert mm to m
          const widthM = width / 1000; // Convert mm to m
          const thicknessM = thickness / 1000; // Convert mm to m
          const volume = lengthM * widthM * thicknessM;
          weightPerUnit = volume * steelDensity;
        }
        break;

      case "pipe": // For pipes
        if (diameter && thickness && length) {
          const outerRadiusM = diameter / 1000 / 2; // Convert mm to m
          const innerRadiusM = outerRadiusM - thickness / 1000;
          const lengthM = length;
          const volume = Math.PI * (outerRadiusM * outerRadiusM - innerRadiusM * innerRadiusM) * lengthM;
          weightPerUnit = volume * steelDensity;
        }
        break;

      case "angle": // For angles - simplified as two rectangles
        if (length && width && thickness) {
          const lengthM = length;
          const widthM = width / 1000; // Convert mm to m
          const thicknessM = thickness / 1000; // Convert mm to m
          // Simplified: two rectangles minus overlap
          const volume = lengthM * thicknessM * (2 * widthM - thicknessM);
          weightPerUnit = volume * steelDensity;
        }
        break;

      default:
        weightPerUnit = 0;
    }

    return weightPerUnit * quantity;
  }, [selectedProduct, dimensions, productTypes]);

  const calculatePrice = useMemo(() => {
    const basePrice = basePrices[selectedProduct][selectedGrade] || 50;
    const totalWeight = calculateWeight;
    let subtotal = totalWeight * basePrice;

    // Apply custom pricing rules
    const applicableRules = customRules.filter((rule) => rule.active);
    const adjustments = [];

    applicableRules.forEach((rule) => {
      let applies = false;

      switch (rule.condition) {
        case "quantity":
          if (rule.operator === "greater_than" && dimensions.quantity > rule.value) applies = true;
          if (rule.operator === "less_than" && dimensions.quantity < rule.value) applies = true;
          if (rule.operator === "equals" && dimensions.quantity === rule.value) applies = true;
          break;
        case "weight":
          if (rule.operator === "greater_than" && totalWeight > rule.value) applies = true;
          if (rule.operator === "less_than" && totalWeight < rule.value) applies = true;
          break;
        case "total":
          if (rule.operator === "greater_than" && subtotal > rule.value) applies = true;
          if (rule.operator === "less_than" && subtotal < rule.value) applies = true;
          break;
        case "grade":
          if (rule.operator === "equals" && selectedGrade === rule.value) applies = true;
          break;
      }

      if (applies) {
        let adjustment = 0;
        if (rule.adjustmentType === "percentage") {
          adjustment = subtotal * (rule.adjustmentValue / 100);
        } else {
          adjustment = rule.adjustmentValue;
        }

        adjustments.push({
          name: rule.name,
          amount: adjustment,
          type: rule.adjustmentType,
        });

        subtotal += adjustment;
      }
    });

    // Apply bulk discounts
    const applicableDiscounts = bulkDiscounts
      .filter((discount) => discount.active && totalWeight >= discount.minQuantity)
      .sort((a, b) => b.discountPercentage - a.discountPercentage);

    let bulkDiscount = 0;
    let appliedDiscount = null;

    if (applicableDiscounts.length > 0) {
      appliedDiscount = applicableDiscounts[0];
      bulkDiscount = subtotal * (appliedDiscount.discountPercentage / 100);
      subtotal -= bulkDiscount;
    }

    return {
      basePrice,
      baseAmount: totalWeight * basePrice,
      adjustments,
      bulkDiscount,
      appliedDiscount,
      subtotal,
      total: subtotal,
      pricePerKg: totalWeight > 0 ? subtotal / totalWeight : 0,
    };
  }, [selectedProduct, selectedGrade, calculateWeight, dimensions, customRules, bulkDiscounts, basePrices]);

  const handleAddRule = () => {
    const rule = {
      ...newRule,
      id: Date.now().toString(),
      value: newRule.value === "" ? 0 : Number(newRule.value),
      adjustmentValue: newRule.adjustmentValue === "" ? 0 : Number(newRule.adjustmentValue),
    };
    const updatedRules = [...customRules, rule];
    setCustomRules(updatedRules);
    localStorage.setItem("steel-app-pricing-rules", JSON.stringify(updatedRules));
    setNewRule({
      name: "",
      condition: "quantity",
      operator: "greater_than",
      value: "",
      adjustmentType: "percentage",
      adjustmentValue: "",
      active: true,
    });
    setShowRulesModal(false);
  };

  const handleAddDiscount = () => {
    const discount = {
      ...newDiscount,
      id: Date.now().toString(),
      minQuantity: newDiscount.minQuantity === "" ? 0 : Number(newDiscount.minQuantity),
      discountPercentage: newDiscount.discountPercentage === "" ? 0 : Number(newDiscount.discountPercentage),
    };
    const updatedDiscounts = [...bulkDiscounts, discount];
    setBulkDiscounts(updatedDiscounts);
    localStorage.setItem("steel-app-bulk-discounts", JSON.stringify(updatedDiscounts));
    setNewDiscount({
      name: "",
      minQuantity: "",
      discountPercentage: "",
      active: true,
    });
    setShowDiscountModal(false);
  };

  const toggleRuleActive = (ruleId) => {
    const updatedRules = customRules.map((rule) => (rule.id === ruleId ? { ...rule, active: !rule.active } : rule));
    setCustomRules(updatedRules);
    localStorage.setItem("steel-app-pricing-rules", JSON.stringify(updatedRules));
  };

  const toggleDiscountActive = (discountId) => {
    const updatedDiscounts = bulkDiscounts.map((discount) =>
      discount.id === discountId ? { ...discount, active: !discount.active } : discount
    );
    setBulkDiscounts(updatedDiscounts);
    localStorage.setItem("steel-app-bulk-discounts", JSON.stringify(updatedDiscounts));
  };

  const deleteRule = (ruleId) => {
    const updatedRules = customRules.filter((rule) => rule.id !== ruleId);
    setCustomRules(updatedRules);
    localStorage.setItem("steel-app-pricing-rules", JSON.stringify(updatedRules));
  };

  const deleteDiscount = (discountId) => {
    const updatedDiscounts = bulkDiscounts.filter((discount) => discount.id !== discountId);
    setBulkDiscounts(updatedDiscounts);
    localStorage.setItem("steel-app-bulk-discounts", JSON.stringify(updatedDiscounts));
  };

  const renderCalculator = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Calculator Form */}
      <div className="space-y-6">
        <div
          className={`border rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${
            isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <Package size={20} className="text-teal-600" />
            <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Product Selection
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="product-type"
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Product Type
              </label>
              <select
                id="product-type"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                {Object.entries(productTypes).map(([key, product]) => (
                  <option key={key} value={key}>
                    {product.displayName || product.display_name || product.name || "N/A"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="grade"
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Grade
              </label>
              <select
                id="grade"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                {productTypes[selectedProduct].grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div
          className={`border rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${
            isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <Ruler size={20} className="text-teal-600" />
            <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Dimensions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productTypes[selectedProduct].dimensions.includes("diameter") && (
              <div>
                <label
                  htmlFor="diameter"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Diameter (mm)
                </label>
                <input
                  id="diameter"
                  type="number"
                  value={dimensions.diameter || ""}
                  onChange={(e) =>
                    setDimensions({
                      ...dimensions,
                      diameter: e.target.value === "" ? "" : Number(e.target.value) || "",
                    })
                  }
                  placeholder="Enter diameter"
                  className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
            )}
            {productTypes[selectedProduct].dimensions.includes("length") && (
              <div>
                <label
                  htmlFor="length"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Length (m)
                </label>
                <input
                  id="length"
                  type="number"
                  value={dimensions.length || ""}
                  onChange={(e) =>
                    setDimensions({
                      ...dimensions,
                      length: e.target.value === "" ? "" : Number(e.target.value) || "",
                    })
                  }
                  placeholder="Enter length"
                  className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
            )}
            {productTypes[selectedProduct].dimensions.includes("width") && (
              <div>
                <label
                  htmlFor="width"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Width (mm)
                </label>
                <input
                  id="width"
                  type="number"
                  value={dimensions.width || ""}
                  onChange={(e) =>
                    setDimensions({
                      ...dimensions,
                      width: e.target.value === "" ? "" : Number(e.target.value) || "",
                    })
                  }
                  placeholder="Enter width"
                  className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
            )}
            {productTypes[selectedProduct].dimensions.includes("thickness") && (
              <div>
                <label
                  htmlFor="thickness"
                  className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Thickness (mm)
                </label>
                <input
                  id="thickness"
                  type="number"
                  value={dimensions.thickness || ""}
                  onChange={(e) =>
                    setDimensions({
                      ...dimensions,
                      thickness: e.target.value === "" ? "" : Number(e.target.value) || "",
                    })
                  }
                  placeholder="Enter thickness"
                  className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
            )}
            <div>
              <label
                htmlFor="quantity"
                className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={dimensions.quantity || ""}
                onChange={(e) =>
                  setDimensions({
                    ...dimensions,
                    quantity: e.target.value === "" ? "" : Number(e.target.value) || "",
                  })
                }
                placeholder="Enter quantity"
                className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Calculation Results</h3>
            <span className="text-sm opacity-80">Base Price: AED {calculatePrice.basePrice}/kg</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Weight size={16} />
                <span className="text-sm opacity-90">Total Weight</span>
              </div>
              <div className="text-xl font-semibold">{calculateWeight.toFixed(2)} kg</div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package size={16} />
                <span className="text-sm opacity-90">Weight per Unit</span>
              </div>
              <div className="text-xl font-semibold">
                {dimensions.quantity > 0 ? (calculateWeight / dimensions.quantity).toFixed(2) : 0} kg
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 pt-4 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm opacity-90">Base Amount</span>
                <span className="font-semibold">AED {calculatePrice.baseAmount.toFixed(2)}</span>
              </div>

              {calculatePrice.adjustments.map((adjustment, index) => (
                <div key={adjustment.id || adjustment.name || `adjustment-${index}`} className="flex justify-between">
                  <span className="text-sm opacity-90">
                    {adjustment.name}
                    <span className="ml-1 opacity-70 text-xs">
                      (
                      {adjustment.type === "percentage"
                        ? `${adjustment.amount < 0 ? "" : "+"}${((adjustment.amount / calculatePrice.baseAmount) * 100).toFixed(1)}%`
                        : "Fixed"}
                      )
                    </span>
                  </span>
                  <span className={`font-semibold ${adjustment.amount < 0 ? "text-green-300" : "text-yellow-300"}`}>
                    {adjustment.amount >= 0 ? "+" : ""}AED {adjustment.amount.toFixed(2)}
                  </span>
                </div>
              ))}

              {calculatePrice.bulkDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">
                    Bulk Discount ({calculatePrice.appliedDiscount.name})
                    <span className="ml-1 opacity-70 text-xs">
                      (-{calculatePrice.appliedDiscount.discountPercentage}%)
                    </span>
                  </span>
                  <span className="text-green-300 font-semibold">-AED {calculatePrice.bulkDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/20 pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-lg font-bold">Total Amount</span>
              <span className="text-lg font-bold">AED {calculatePrice.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm opacity-90">Final Price per kg</span>
              <span className="font-semibold">AED {calculatePrice.pricePerKg.toFixed(2)}</span>
            </div>
          </div>

          {calculatePrice.appliedDiscount && (
            <div className="mt-4 p-3 bg-green-600/20 border border-green-500/30 rounded-lg flex items-center gap-2">
              <CheckCircle size={16} />
              <span className="text-sm">Bulk discount applied: {calculatePrice.appliedDiscount.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPricingRules = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Custom Pricing Rules</h3>
        <button type="button" onClick={() => setShowRulesModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300"
        >
          <Plus size={20} />
          Add Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customRules.map((rule) => (
          <div
            key={rule.id}
            className={`border rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
              isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{rule.name}</h4>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    rule.active
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-gray-100 text-gray-800 border border-gray-200"
                  }`}
                >
                  {rule.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => toggleRuleActive(rule.id)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    rule.active
                      ? isDarkMode
                        ? "border border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
                        : "border border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {rule.active ? "Disable" : "Enable"}
                </button>
                <button type="button" onClick={() => deleteRule(rule.id)}
                  className={`p-1 rounded-lg transition-colors ${
                    isDarkMode ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-100"
                  }`}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Condition:
                </span>
                <span className={`ml-2 text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {rule.condition} {rule.operator.replace("_", " ")} {rule.value}
                </span>
              </div>
              <div>
                <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Adjustment:
                </span>
                <span
                  className={`ml-2 text-sm font-semibold ${
                    rule.adjustmentValue < 0 ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {rule.adjustmentType === "percentage"
                    ? `${rule.adjustmentValue > 0 ? "+" : ""}${rule.adjustmentValue}%`
                    : `${rule.adjustmentValue > 0 ? "+" : ""}AED ${rule.adjustmentValue}`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBulkDiscounts = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Bulk Quantity Discounts
        </h3>
        <button type="button" onClick={() => setShowDiscountModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300"
        >
          <Plus size={20} />
          Add Discount
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {bulkDiscounts.map((discount) => (
          <div
            key={discount.id}
            className={`border rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
              isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className={`font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{discount.name}</h4>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    discount.active
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-gray-100 text-gray-800 border border-gray-200"
                  }`}
                >
                  {discount.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => toggleDiscountActive(discount.id)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    discount.active
                      ? isDarkMode
                        ? "border border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
                        : "border border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {discount.active ? "Disable" : "Enable"}
                </button>
                <button type="button" onClick={() => deleteDiscount(discount.id)}
                  className={`p-1 rounded-lg transition-colors ${
                    isDarkMode ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-100"
                  }`}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-teal-600" />
                <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Min Quantity: <strong>{discount.minQuantity.toLocaleString()} kg</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Percent size={16} className="text-green-600" />
                <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Discount: <strong className="text-green-600">{discount.discountPercentage}%</strong>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`p-4 min-h-[calc(100vh-64px)] overflow-auto ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
      <div
        className={`border rounded-xl overflow-hidden shadow-lg ${
          isDarkMode ? "border-[#37474F] bg-[#1E2328]" : "border-gray-200 bg-white"
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <Calculator size={28} className="text-teal-600" />
              <h1 className={`text-3xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                🧮 Steel Price Calculator
              </h1>
            </div>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Calculate steel prices with real-time weight calculations and custom pricing rules
            </p>
          </div>

          {/* Tabs - Pill style */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setActiveTab("calculator")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  activeTab === "calculator"
                    ? isDarkMode
                      ? "bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200"
                      : "bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800"
                    : isDarkMode
                      ? "bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white"
                      : "bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Calculator size={18} />
                Price Calculator
              </button>
              <button type="button" onClick={() => setActiveTab("rules")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  activeTab === "rules"
                    ? isDarkMode
                      ? "bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200"
                      : "bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800"
                    : isDarkMode
                      ? "bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white"
                      : "bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Settings size={18} />
                Pricing Rules
              </button>
              <button type="button" onClick={() => setActiveTab("discounts")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  activeTab === "discounts"
                    ? isDarkMode
                      ? "bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200"
                      : "bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800"
                    : isDarkMode
                      ? "bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white"
                      : "bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Percent size={18} />
                Bulk Discounts
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "calculator" && renderCalculator()}
            {activeTab === "rules" && renderPricingRules()}
            {activeTab === "discounts" && renderBulkDiscounts()}
          </div>
        </div>

        {/* Add Rule Modal */}
        {showRulesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div
              className={`rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden ${
                isDarkMode ? "bg-[#1E2328]" : "bg-white"
              }`}
            >
              <div
                className={`p-6 border-b flex justify-between items-center ${
                  isDarkMode ? "border-[#37474F]" : "border-gray-200"
                }`}
              >
                <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Add Pricing Rule
                </h2>
                <button type="button" onClick={() => setShowRulesModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-full">
                    <label
                      htmlFor="rule-name"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Rule Name
                    </label>
                    <input
                      id="rule-name"
                      type="text"
                      value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      placeholder="Enter rule name"
                      className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="rule-condition"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Condition
                    </label>
                    <select
                      id="rule-condition"
                      value={newRule.condition}
                      onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                      className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      <option value="quantity">Quantity</option>
                      <option value="weight">Weight (kg)</option>
                      <option value="total">Total Amount (AED)</option>
                      <option value="grade">Grade</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="rule-operator"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Operator
                    </label>
                    <select
                      id="rule-operator"
                      value={newRule.operator}
                      onChange={(e) => setNewRule({ ...newRule, operator: e.target.value })}
                      className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                      <option value="equals">Equals</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="rule-value"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Value
                    </label>
                    {newRule.condition === "grade" ? (
                      <select
                        id="rule-value"
                        value={newRule.value}
                        onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                        className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="">Select Grade</option>
                        <option value="fe415">FE415</option>
                        <option value="fe500">FE500</option>
                        <option value="fe550">FE550</option>
                        <option value="ms">MS</option>
                        <option value="ss304">SS304</option>
                        <option value="ss316">SS316</option>
                        <option value="galvanized">Galvanized</option>
                      </select>
                    ) : (
                      <input
                        id="rule-value"
                        type="number"
                        value={newRule.value || ""}
                        onChange={(e) =>
                          setNewRule({
                            ...newRule,
                            value: e.target.value === "" ? "" : Number(e.target.value) || "",
                          })
                        }
                        placeholder="Enter value"
                        className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                      />
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="rule-adjustment-type"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Adjustment Type
                    </label>
                    <select
                      id="rule-adjustment-type"
                      value={newRule.adjustmentType}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          adjustmentType: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div className="col-span-full">
                    <label
                      htmlFor="rule-adjustment-value"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Adjustment Value {newRule.adjustmentType === "percentage" ? "(%)" : "(AED)"}
                    </label>
                    <input
                      id="rule-adjustment-value"
                      type="number"
                      value={newRule.adjustmentValue || ""}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          adjustmentValue: e.target.value === "" ? "" : Number(e.target.value) || "",
                        })
                      }
                      placeholder={newRule.adjustmentType === "percentage" ? "Enter percentage" : "Enter amount"}
                      className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>
                </div>
              </div>
              <div
                className={`p-6 border-t flex gap-3 justify-end ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}
              >
                <button type="button" onClick={() => setShowRulesModal(false)}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                      : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button type="button" onClick={handleAddRule}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300"
                >
                  <Save size={20} />
                  Add Rule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Discount Modal */}
        {showDiscountModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div
              className={`rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden ${
                isDarkMode ? "bg-[#1E2328]" : "bg-white"
              }`}
            >
              <div
                className={`p-6 border-b flex justify-between items-center ${
                  isDarkMode ? "border-[#37474F]" : "border-gray-200"
                }`}
              >
                <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Add Bulk Discount
                </h2>
                <button type="button" onClick={() => setShowDiscountModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor="discount-name"
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Discount Name
                  </label>
                  <input
                    id="discount-name"
                    type="text"
                    value={newDiscount.name}
                    onChange={(e) => setNewDiscount({ ...newDiscount, name: e.target.value })}
                    placeholder="Enter discount name (e.g., 10+ tonnes)"
                    className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="discount-min-quantity"
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Minimum Quantity (kg)
                  </label>
                  <input
                    id="discount-min-quantity"
                    type="number"
                    value={newDiscount.minQuantity || ""}
                    onChange={(e) =>
                      setNewDiscount({
                        ...newDiscount,
                        minQuantity: e.target.value === "" ? "" : Number(e.target.value) || "",
                      })
                    }
                    placeholder="Enter minimum quantity"
                    className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="discount-percentage"
                    className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Discount Percentage (%)
                  </label>
                  <input
                    id="discount-percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={newDiscount.discountPercentage || ""}
                    onChange={(e) =>
                      setNewDiscount({
                        ...newDiscount,
                        discountPercentage: e.target.value === "" ? "" : Number(e.target.value) || "",
                      })
                    }
                    placeholder="Enter discount percentage"
                    className={`w-full px-3 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
              </div>
              <div
                className={`p-6 border-t flex gap-3 justify-end ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}
              >
                <button type="button" onClick={() => setShowDiscountModal(false)}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                      : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button type="button" onClick={handleAddDiscount}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300"
                >
                  <Save size={20} />
                  Add Discount
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceCalculator;
