import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle,
  ChevronDown,
  Copy,
  Edit,
  Eye,
  HelpCircle,
  Info,
  Lightbulb,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useApi, useApiData } from "../hooks/useApi";
import { useConfirm } from "../hooks/useConfirm";
import { productService } from "../services/dataService";
import { notificationService } from "../services/notificationService";
import pricelistService from "../services/pricelistService";
import { FINISHES } from "../types";
import { getProductDisplayName, getProductUniqueName } from "../utils/fieldAccessors";
import { clearInventoryCache } from "../utils/inventorySyncUtils";
import { getAllowedBases, getDefaultBasis, PRICING_BASIS_MICROCOPY } from "../utils/pricingBasisRules";
import ConfirmDialog from "./ConfirmDialog";
import ProductUpload from "./ProductUpload";
import QuickPriceEditModal from "./pricing/QuickPriceEditModal";

// Custom components for consistent theming
const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  className = "",
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const getVariantClasses = () => {
    if (variant === "primary") {
      return isDarkMode
        ? `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:bg-gray-600 disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-gray-800`
        : `bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500 hover:-translate-y-0.5 focus:ring-blue-500 disabled:bg-gray-400 disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-white`;
    } else if (variant === "secondary") {
      return `${
        isDarkMode
          ? "bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500 disabled:bg-gray-800 focus:ring-offset-gray-800"
          : "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400 disabled:bg-gray-100 focus:ring-offset-white"
      }`;
    } else {
      // outline
      return `border ${
        isDarkMode
          ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700 disabled:bg-gray-800 focus:ring-offset-gray-800"
          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:bg-gray-50 focus:ring-offset-white"
      } focus:ring-teal-500`;
    }
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${disabled ? "cursor-not-allowed" : ""} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, error, className = "", type = "text", id, required = false, ...props }) => {
  const { isDarkMode } = useTheme();
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
          isDarkMode
            ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
        } ${error ? "!border-red-500 ring-1 ring-red-500" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

const Select = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  id,
  required = false,
  error = "",
}) => {
  const { isDarkMode } = useTheme();
  const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
            isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
          } ${error ? "!border-red-500 ring-1 ring-red-500" : ""} ${className}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

const Textarea = ({ label, error, className = "", id, ...props }) => {
  const { isDarkMode } = useTheme();
  const textareaId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={textareaId}
          className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none ${
          isDarkMode
            ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
        } ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

// Phase 3: Tooltip Component for Educational Help
const Tooltip = ({ content, children, position = "top" }) => {
  const { isDarkMode } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);

  return (
    <div className="relative inline-flex items-center">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Tooltip trigger - hover only, no click action */}
      <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)} className="cursor-help">
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 px-3 py-2 text-xs rounded-lg shadow-lg whitespace-normal max-w-xs ${
            isDarkMode
              ? "bg-gray-900 text-gray-200 border border-gray-700"
              : "bg-white text-gray-800 border border-gray-200"
          } ${
            position === "top"
              ? "bottom-full mb-2 left-1/2 transform -translate-x-1/2"
              : position === "bottom"
                ? "top-full mt-2 left-1/2 transform -translate-x-1/2"
                : position === "left"
                  ? "right-full mr-2 top-1/2 transform -translate-y-1/2"
                  : "left-full ml-2 top-1/2 transform -translate-y-1/2"
          }`}
          style={{ minWidth: "200px" }}
        >
          {content}
          <div
            className={`absolute w-2 h-2 transform rotate-45 ${
              isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
            } ${
              position === "top"
                ? "bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b"
                : position === "bottom"
                  ? "top-[-4px] left-1/2 -translate-x-1/2 border-l border-t"
                  : position === "left"
                    ? "right-[-4px] top-1/2 -translate-y-1/2 border-t border-r"
                    : "left-[-4px] top-1/2 -translate-y-1/2 border-b border-l"
            }`}
          />
        </div>
      )}
    </div>
  );
};

// Phase 4: Product Name Segment Display Component
const ProductNameSegments = ({ productData, focusedField, isDarkMode }) => {
  const segments = [];

  // Build segments from product data
  if (productData.commodity) {
    segments.push({
      key: "commodity",
      value: productData.commodity.toUpperCase(),
      label: "Commodity",
      color: isDarkMode
        ? "bg-purple-900/40 text-purple-300 border-purple-700"
        : "bg-purple-100 text-purple-800 border-purple-300",
    });
  } else {
    segments.push({
      key: "commodity",
      value: "___",
      label: "Commodity",
      placeholder: true,
    });
  }

  if (productData.grade) {
    const grade = String(productData.grade)
      .trim()
      .replace(/^gr\s*/i, "");
    segments.push({
      key: "grade",
      value: grade,
      label: "Grade",
      color: isDarkMode ? "bg-teal-900/40 text-teal-300 border-teal-700" : "bg-teal-100 text-teal-800 border-teal-300",
    });
  } else {
    segments.push({
      key: "grade",
      value: "___",
      label: "Grade",
      placeholder: true,
    });
  }

  if (productData.category) {
    const categoryLabel = productData.category.charAt(0).toUpperCase() + productData.category.slice(1);
    segments.push({
      key: "category",
      value: categoryLabel,
      label: "Category",
      color: isDarkMode ? "bg-blue-900/40 text-blue-300 border-blue-700" : "bg-blue-100 text-blue-800 border-blue-300",
    });
  } else {
    segments.push({
      key: "category",
      value: "___",
      label: "Category",
      placeholder: true,
    });
  }

  if (productData.finish) {
    segments.push({
      key: "finish",
      value: productData.finish.toUpperCase(),
      label: "Finish",
      color: isDarkMode
        ? "bg-indigo-900/40 text-indigo-300 border-indigo-700"
        : "bg-indigo-100 text-indigo-800 border-indigo-300",
    });
  } else {
    segments.push({
      key: "finish",
      value: "___",
      label: "Finish",
      placeholder: true,
    });
  }

  // Dimensions segment
  const isPipeOrTube = /pipe|tube/i.test(productData.category || "");
  let dimensionValue = "";
  if (isPipeOrTube) {
    const parts = [];
    if (productData.sizeInch) parts.push(`${productData.sizeInch}"`);
    if (productData.od) parts.push(`OD${productData.od}`);
    if (productData.length) parts.push(`L${productData.length}`);
    dimensionValue = parts.join("x") || "___";
  } else {
    dimensionValue = productData.size || "___";
  }

  segments.push({
    key: "dimensions",
    value: dimensionValue,
    label: "Dimensions",
    color: isDarkMode
      ? "bg-amber-900/40 text-amber-300 border-amber-700"
      : "bg-amber-100 text-amber-800 border-amber-300",
    placeholder: dimensionValue === "___",
  });

  // Thickness segment
  const thicknessValue = productData.thickness
    ? `${String(productData.thickness).trim().replace(/mm$/i, "")}mm`
    : "___";
  segments.push({
    key: "thickness",
    value: thicknessValue,
    label: "Thickness",
    color: isDarkMode ? "bg-rose-900/40 text-rose-300 border-rose-700" : "bg-rose-100 text-rose-800 border-rose-300",
    placeholder: thicknessValue === "___",
  });

  // NOTE: Origin (LOCAL/IMPORTED) is NOT part of product identity per SSOT rules.
  // Origin is stored at batch level, not product level.
  // Same product (e.g., SS-304-Sheet-2B-1219mm-0.8mm) can exist as both local and imported batches.

  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        isDarkMode ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-300"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-teal-500" />
        <span className={`text-xs font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          PRODUCT IDENTITY PREVIEW
        </span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded ${isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500"}`}
        >
          SSOT
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {segments.map((segment, index) => (
          <div key={segment.key} className="flex items-center gap-1">
            <div
              className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                segment.placeholder
                  ? isDarkMode
                    ? "bg-gray-800 text-gray-500 border-gray-700 border-dashed"
                    : "bg-gray-200 text-gray-400 border-gray-300 border-dashed"
                  : focusedField === segment.key
                    ? `ring-2 ring-teal-500 ring-offset-2 ${segment.color}`
                    : segment.color
              }`}
            >
              <div className="text-xs font-medium">{segment.value}</div>
              <div className={`text-[10px] mt-0.5 ${segment.placeholder ? "opacity-50" : "opacity-70"}`}>
                {segment.label}
              </div>
            </div>
            {index < segments.length - 1 && (
              <span className={`text-lg font-bold ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>-</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Phase 6: Smart Validation Component
const ValidationMessage = ({ type = "info", message, suggestion }) => {
  const { isDarkMode } = useTheme();

  const colors = {
    error: isDarkMode ? "bg-red-900/30 border-red-700 text-red-300" : "bg-red-50 border-red-300 text-red-700",
    warning: isDarkMode
      ? "bg-amber-900/30 border-amber-700 text-amber-300"
      : "bg-amber-50 border-amber-300 text-amber-700",
    success: isDarkMode
      ? "bg-green-900/30 border-green-700 text-green-300"
      : "bg-green-50 border-green-300 text-green-700",
    info: isDarkMode ? "bg-blue-900/30 border-blue-700 text-blue-300" : "bg-blue-50 border-blue-300 text-blue-700",
  };

  const icons = {
    error: <AlertTriangle className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
    success: <CheckCircle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
  };

  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border ${colors[type]} text-sm mt-2`}>
      {icons[type]}
      <div className="flex-1">
        <p>{message}</p>
        {suggestion && (
          <p className="mt-1 font-medium flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Did you mean: <span className="underline">{suggestion}</span>?
          </p>
        )}
      </div>
    </div>
  );
};

// Comprehensive SS Trading Product Categories (moved outside component to avoid recreating on every render)
const PRODUCT_CATEGORIES = [
  // Flat Products
  { value: "sheet", label: "Sheet", group: "flat", icon: "📄" },
  { value: "plate", label: "Plate", group: "flat", icon: "📋" },
  { value: "coil", label: "Coil", group: "flat", icon: "🔄" },
  // Tubes (Hollow Sections)
  { value: "square_tube", label: "Square Tube", group: "tube", icon: "⬜" },
  {
    value: "rectangular_tube",
    label: "Rectangular Tube",
    group: "tube",
    icon: "▭",
  },
  { value: "round_tube", label: "Round Tube", group: "tube", icon: "⭕" },
  { value: "tube", label: "Tube (General)", group: "tube", icon: "🔲" },
  // Pipes
  { value: "seamless_pipe", label: "Seamless Pipe", group: "pipe", icon: "🔵" },
  { value: "erw_pipe", label: "ERW Pipe", group: "pipe", icon: "🔴" },
  { value: "pol_pipe", label: "Polished Pipe", group: "pipe", icon: "✨" },
  { value: "pipe", label: "Pipe (General)", group: "pipe", icon: "⚫" },
  // Bars
  { value: "round_bar", label: "Round Bar", group: "bar", icon: "●" },
  { value: "flat_bar", label: "Flat Bar", group: "bar", icon: "▬" },
  { value: "square_bar", label: "Square Bar", group: "bar", icon: "■" },
  { value: "hex_bar", label: "Hex Bar", group: "bar", icon: "⬡" },
  { value: "angle_bar", label: "Angle Bar", group: "bar", icon: "∟" },
  { value: "bar", label: "Bar (General)", group: "bar", icon: "▪" },
  // Fittings & Others
  { value: "fittings", label: "Fittings", group: "fittings", icon: "🔧" },
  { value: "flange", label: "Flange", group: "fittings", icon: "⚙️" },
  { value: "fasteners", label: "Fasteners", group: "fittings", icon: "🔩" },
  { value: "wire", label: "Wire", group: "other", icon: "〰️" },
];

// Category group definitions (static structure)
const CATEGORY_GROUP_DEFS = [
  {
    id: "flat",
    label: "Flat Products",
    icon: "📄",
    categories: ["sheet", "plate", "coil"],
  },
  {
    id: "tube",
    label: "Tubes",
    icon: "🔲",
    categories: ["square_tube", "rectangular_tube", "round_tube", "tube"],
  },
  {
    id: "pipe",
    label: "Pipes",
    icon: "⚫",
    categories: ["seamless_pipe", "erw_pipe", "pol_pipe", "pipe"],
  },
  {
    id: "bar",
    label: "Bars",
    icon: "▬",
    categories: ["round_bar", "flat_bar", "square_bar", "hex_bar", "angle_bar", "bar"],
  },
  {
    id: "fittings",
    label: "Fittings",
    icon: "🔧",
    categories: ["fittings", "flange", "fasteners"],
  },
  { id: "wire", label: "Wire & Other", icon: "〰️", categories: ["wire"] },
];

// Grade group definitions (static structure)
const GRADE_GROUP_DEFS = [
  { id: "304", label: "304 Series", grades: ["304", "304L", "304H"] },
  { id: "316", label: "316 Series", grades: ["316", "316L", "316Ti"] },
  { id: "200", label: "200 Series", grades: ["201", "202"] },
  { id: "duplex", label: "Duplex", grades: ["2205", "2507", "2304"] },
  { id: "ms", label: "MS/GI", grades: ["MS", "Galvanized", "GI"] },
  {
    id: "ferritic",
    label: "Ferritic",
    grades: ["409", "410", "430", "434", "436", "439", "444"],
  },
];

const SteelProducts = () => {
  const { isDarkMode } = useTheme();
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-based tab state for persistence across refreshes
  const activeTab = searchParams.get("tab") || "catalog";
  const setActiveTab = (tab) => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("tab", tab);
        return newParams;
      },
      { replace: true }
    );
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all"); // Phase 3: Product category filter
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pageInfo, setPageInfo] = useState({ totalPages: 0, totalCount: 0 });
  const [showSpeedButtons, setShowSpeedButtons] = useState(() => {
    const saved = localStorage.getItem("steelProducts_showQuickFilters");
    return saved !== null ? JSON.parse(saved) : false; // Default OFF
  });

  // Column configuration for list view
  const ALL_COLUMNS = [
    {
      key: "productName",
      label: "Product Identity",
      required: true,
      width: "w-[40%]",
    },
    { key: "stock", label: "Stock", required: true, width: "w-[10%]" },
    { key: "buyPrice", label: "Std Cost (Ref)", required: true, width: "w-[12%]" },
    {
      key: "sellPrice",
      label: "Sell Price (Ref)",
      required: true,
      width: "w-[12%]",
    },
    { key: "margin", label: "Margin", required: true, width: "w-[8%]" },
    { key: "supplier", label: "Supplier", required: false, width: "w-[120px]" },
    { key: "location", label: "Location", required: false, width: "w-[120px]" },
    { key: "minStock", label: "Min Stock", required: false, width: "w-[90px]" },
    { key: "maxStock", label: "Max Stock", required: false, width: "w-[90px]" },
    { key: "category", label: "Category", required: false, width: "w-[100px]" },
    { key: "grade", label: "Grade", required: false, width: "w-[80px]" },
    { key: "finish", label: "Finish", required: false, width: "w-[80px]" },
    { key: "origin", label: "Country of Origin", required: false, width: "w-[120px]" },
    { key: "lastModified", label: "Modified", required: false, width: "w-[100px]" },
  ];

  const DEFAULT_VISIBLE_COLUMNS = ["productName", "stock", "buyPrice", "sellPrice", "margin"];

  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem("steelProducts_visibleColumns");
    return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLUMNS;
  });

  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const columnPickerRef = useRef(null);

  // Persist column preferences
  useEffect(() => {
    localStorage.setItem("steelProducts_visibleColumns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Phase 3: Fetch default pricelist ID on mount
  useEffect(() => {
    const fetchDefaultPricelist = async () => {
      try {
        const response = await pricelistService.getAll({ is_default: true });
        if (response?.pricelists && response.pricelists.length > 0) {
          setDefaultPricelistId(response.pricelists[0].id);
        }
      } catch (error) {
        console.error("Error fetching default pricelist:", error);
      }
    };

    fetchDefaultPricelist();
  }, []);

  // Close column picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(event.target)) {
        setShowColumnPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (columnKey) => {
    const column = ALL_COLUMNS.find((c) => c.key === columnKey);
    if (column?.required) return; // Can't toggle required columns

    setVisibleColumns((prev) =>
      prev.includes(columnKey) ? prev.filter((k) => k !== columnKey) : [...prev, columnKey]
    );
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const {
    data: productsData,
    loading: _loadingProducts,
    error: productsError,
    refetch: refetchProducts,
  } = useApiData(
    () =>
      productService.getProducts({
        search: searchTerm,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        stock_status: stockFilter === "all" ? undefined : stockFilter,
        page,
        limit: pageSize,
      }),
    [searchTerm, categoryFilter, stockFilter, page, pageSize]
  );

  // Extract pagination info from API response
  useEffect(() => {
    if (productsData?.pageInfo) {
      setPageInfo(productsData.pageInfo);
    }
  }, [productsData?.pageInfo]);

  const { execute: createProduct, loading: _creatingProduct } = useApi(productService.createProduct);
  const { execute: updateProduct, loading: updatingProduct } = useApi(productService.updateProduct);
  const { execute: deleteProduct } = useApi(productService.deleteProduct);

  const products = useMemo(() => productsData?.products || [], [productsData?.products]);

  // Build a robust list of finishes: predefined + those present in products (all UPPERCASE)
  const allFinishes = useMemo(() => {
    try {
      const set = new Set(FINISHES || []);
      (products || []).forEach((p) => {
        if (p?.finish && String(p.finish).trim()) {
          set.add(String(p.finish).trim().toUpperCase());
        }
      });
      return Array.from(set);
    } catch {
      return FINISHES || [];
    }
  }, [products]);

  // Persist Quick Filters visibility to localStorage
  useEffect(() => {
    localStorage.setItem("steelProducts_showQuickFilters", JSON.stringify(showSpeedButtons));
  }, [showSpeedButtons]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null); // null = add mode, product.id = edit mode
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [customThickness, setCustomThickness] = useState(false);
  const [saveWarnings, setSaveWarnings] = useState(null); // { warnings: [], onConfirm: fn }
  const [copySearchTerm, setCopySearchTerm] = useState("");
  const [_activeTooltip, _setActiveTooltip] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Phase 3: Pricing edit modal state
  const [showPricingEditModal, setShowPricingEditModal] = useState(false);
  const [defaultPricelistId, setDefaultPricelistId] = useState(null);

  // Phase 2-6: Enhanced form state
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [similarProducts, setSimilarProducts] = useState([]);

  const [newProduct, setNewProduct] = useState({
    displayName: "", // User-facing, editable name
    category: "sheet",
    commodity: "SS",
    grade: "",
    finish: "",
    size: "",
    sizeInch: "",
    od: "",
    length: "",
    weight: "",
    description: "",
    currentStock: "",
    minStock: "",
    maxStock: "",
    costPrice: "",
    sellingPrice: "",
    supplier: "",
    location: "",
    origin: "UAE", // Country of origin - default UAE
    // Phase 3: Product Master Data (added 2025-12-02)
    hsCode: "", // Harmonized System code (6-10 digits)
    millName: "", // Steel mill/manufacturer name
    productCategory: "", // Product category (COIL, SHEET, PLATE, PIPE, TUBE, BAR, FLAT)
    // Unit of Measure fields (added 2025-12-09 - Piece-Based Inventory)
    primaryUom: "PCS", // Primary unit: PCS, KG, MT, METER
    unitWeightKg: "", // Weight of one piece in kg
    allowDecimalQuantity: false, // Whether fractional quantities allowed
    // Pricing & Commercial Fields (added 2025-12-12 - Pricing Audit)
    pricingBasis: "PER_MT", // Basis for cost_price/selling_price: PER_KG, PER_MT, PER_PCS, PER_METER, PER_LOT
    weightTolerancePercent: 2.5, // Acceptable weight variance % (Sheets: 2.5%, Pipes: 5%, Bars: 3%)
    specifications: {
      length: "",
      width: "",
      thickness: "",
      diameter: "",
      tensileStrength: "",
      yieldStrength: "",
      carbonContent: "",
      coating: "",
      standard: "",
    },
  });

  // Origin options for dropdown
  const originOptions = [
    { value: "UAE", label: "UAE" },
    { value: "India", label: "India" },
    { value: "China", label: "China" },
    { value: "Taiwan", label: "Taiwan" },
    { value: "Korea", label: "Korea" },
    { value: "Japan", label: "Japan" },
    { value: "Malaysia", label: "Malaysia" },
    { value: "Indonesia", label: "Indonesia" },
    { value: "Vietnam", label: "Vietnam" },
    { value: "Thailand", label: "Thailand" },
    { value: "Germany", label: "Germany" },
    { value: "Italy", label: "Italy" },
    { value: "Spain", label: "Spain" },
    { value: "USA", label: "USA" },
    { value: "UK", label: "UK" },
    { value: "Belgium", label: "Belgium" },
    { value: "Netherlands", label: "Netherlands" },
    { value: "Turkey", label: "Turkey" },
  ];

  // Use constants defined outside component
  const categories = PRODUCT_CATEGORIES;
  const categoryGroupDefs = CATEGORY_GROUP_DEFS;

  // Product Templates for Quick Start
  const productTemplates = [
    {
      id: "template-304-sheet",
      name: "📄 Standard 304 Sheet (1.5mm)",
      category: "sheet",
      commodity: "SS",
      grade: "304",
      finish: "2B",
      width: "1220mm",
      thickness: "1.5mm",
      length: "2440mm",
      millCountry: "AE",
    },
    {
      id: "template-316l-sheet",
      name: "📄 Standard 316L Sheet (2.0mm)",
      category: "sheet",
      commodity: "SS",
      grade: "316L",
      finish: "2B",
      width: "1220mm",
      thickness: "2.0mm",
      length: "2440mm",
      millCountry: "AE",
    },
    {
      id: "template-pipe",
      name: '🔧 Common Pipe (2" SCH 40)',
      category: "pipe",
      commodity: "SS",
      grade: "304",
      finish: "Polished",
      sizeInch: '2"',
      schedule: "SCH 40",
      length: "6000mm",
      millCountry: "AE",
    },
    {
      id: "template-tube",
      name: "🔧 Common Tube (50x50mm)",
      category: "square_tube",
      commodity: "SS",
      grade: "304",
      finish: "Polished",
      size: "50x50mm",
      thickness: "1.5mm",
      length: "6000mm",
      millCountry: "AE",
    },
    {
      id: "template-coil",
      name: "📦 Standard Coil",
      category: "coil",
      commodity: "SS",
      grade: "304",
      finish: "2B",
      width: "1000mm",
      thickness: "1.0mm",
      millCountry: "AE",
    },
  ];

  // Grade helper descriptions
  const gradeHelp = {
    304: "Most common grade. Good corrosion resistance. General purpose applications.",
    "316L": "Marine grade. Better corrosion resistance than 304. Used in medical/marine/food industries.",
    316: "High corrosion resistance. Used in chemical and marine environments.",
    201: "Budget-friendly option. Lower nickel content. Good for non-critical applications.",
    430: "Ferritic grade. Magnetic. Lower cost. Used in automotive and appliances.",
    310: "High temperature resistance. Used in furnaces and heat exchangers.",
    321: "Stabilized grade. Good for high temperature applications.",
    "904L": "Super austenitic. Excellent corrosion resistance in harsh environments.",
  };

  // Finish helper descriptions
  const finishHelp = {
    "2B": "Most common cold-rolled finish. Smooth, slightly reflective. General purpose.",
    BA: "Bright annealed. Mirror-like finish. Premium applications requiring aesthetics.",
    "No.1": "Hot-rolled. Rough finish. Used for plates and structural applications.",
    HL: "Hairline finish. Fine linear texture. Popular for decorative applications.",
    Polished: "High shine. Mirror or near-mirror finish. Used for pipes, tubes, and decorative work.",
    "2D": "Dull cold-rolled finish. Not reflective. Industrial applications.",
    "8K": "Mirror polish. Highest reflectivity. Premium architectural and decorative use.",
  };

  // Phase 6: Smart Validation Functions
  const validateGrade = (grade) => {
    if (!grade) return null;

    const gradeStr = String(grade).trim().toUpperCase();
    const knownGrades = grades.map((g) => g.toUpperCase());

    // Check if grade is in known list
    if (!knownGrades.includes(gradeStr)) {
      // Find close matches using simple string similarity
      const suggestions = knownGrades.filter((g) => {
        // Check if it's a substring match
        if (g.includes(gradeStr) || gradeStr.includes(g)) return true;
        // Check for common typos (off by one character)
        if (Math.abs(g.length - gradeStr.length) <= 1) {
          const minLen = Math.min(g.length, gradeStr.length);
          let matches = 0;
          for (let i = 0; i < minLen; i++) {
            if (g[i] === gradeStr[i]) matches++;
          }
          return matches >= minLen - 1;
        }
        return false;
      });

      if (suggestions.length > 0) {
        return {
          type: "warning",
          message: `Grade "${grade}" is not in our standard list.`,
          suggestion: suggestions[0],
        };
      }

      return {
        type: "info",
        message: `Grade "${grade}" will be added as a custom grade.`,
      };
    }

    return null;
  };

  // Phase 2: Template Selection Handler
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
    setNewProduct({
      ...newProduct,
      category: template.category,
      commodity: template.commodity,
      grade: template.grade,
      finish: template.finish,
      millCountry: template.millCountry,
      thickness: template.thickness || "",
      width: template.width || "",
      length: template.length || "",
      size: template.size || "",
      sizeInch: template.sizeInch || "",
      schedule: template.schedule || "",
    });
    notificationService.success(`Applied template: ${template.name}`);
  };

  // Phase 2: Clear Form Handler
  const handleClearForm = () => {
    setValidationErrors({});
    setNewProduct({
      displayName: "",
      category: "sheet",
      commodity: "SS",
      grade: "",
      finish: "",
      size: "",
      sizeInch: "",
      od: "",
      length: "",
      weight: "",
      description: "",
      currentStock: "",
      minStock: "",
      maxStock: "",
      costPrice: "",
      sellingPrice: "",
      supplier: "",
      location: "",
      origin: "UAE",
      hsCode: "",
      millCountry: "",
      millName: "",
      productCategory: "",
      // Unit of Measure (reset to defaults)
      primaryUom: "PCS",
      unitWeightKg: "",
      allowDecimalQuantity: false,
      // Pricing & Commercial Fields (reset to defaults)
      pricingBasis: "PER_MT",
      weightTolerancePercent: 2.5,
      specifications: {
        length: "",
        width: "",
        thickness: "",
        diameter: "",
        tensileStrength: "",
        yieldStrength: "",
        carbonContent: "",
        coating: "",
        standard: "",
      },
    });
    setSelectedTemplate("");
    setValidationErrors({});
    setFocusedField(null);
    notificationService.success("Form cleared");
  };

  // Phase 5: Copy from Existing Product Handler
  const handleCopyFromProduct = (product) => {
    setNewProduct({
      ...newProduct,
      category: product.category,
      commodity: product.commodity || "SS",
      grade: product.grade,
      finish: product.finish,
      size: product.size || "",
      sizeInch: product.sizeInch || product.size_inch || "",
      od: product.od || "",
      length: product.length || "",
      thickness: product.thickness || "",
      weight: product.weight || "",
      description: product.description || "",
      supplier: product.supplier || "",
      location: product.location || "",
      millCountry: product.millCountry || product.mill_country || product.origin || "",
      specifications: product.specifications || {
        length: "",
        width: "",
        thickness: "",
        diameter: "",
        tensileStrength: "",
        yieldStrength: "",
        carbonContent: "",
        coating: "",
        standard: "",
      },
      // Don't copy stock or pricing - those should be set manually
    });
    setShowCopyModal(false);
    notificationService.success(`Copied product details from: ${getProductDisplayName(product) || "product"}`);
  };

  // Phase 7: Find Similar Products
  useEffect(() => {
    if (!showAddModal) {
      // Only run when modal is open
      return;
    }

    if (!newProduct.grade && !newProduct.category && !newProduct.finish) {
      setSimilarProducts([]);
      return;
    }

    const similar = products
      .filter((p) => {
        let score = 0;
        if (p.grade === newProduct.grade) score += 3;
        if (p.category === newProduct.category) score += 2;
        if (p.finish === newProduct.finish) score += 1;
        return score >= 2; // At least 2 matching attributes
      })
      .slice(0, 5); // Limit to 5 products

    setSimilarProducts(similar);
  }, [newProduct.grade, newProduct.category, newProduct.finish, showAddModal, products]);

  // Dynamic category groups - only show groups that have matching products
  const categoryGroups = useMemo(() => {
    const dynamicGroups = categoryGroupDefs
      .map((group) => {
        const count = products.filter((p) => {
          const productCategory = (p?.category || "").toLowerCase();
          return group.categories.some((cat) => productCategory === cat.toLowerCase());
        }).length;
        return { ...group, count };
      })
      .filter((group) => group.count > 0); // Only show groups with products

    // Get categories that don&apos;t fit any group
    const allGroupedCategories = categoryGroupDefs.flatMap((g) => g.categories.map((cat) => cat.toLowerCase()));
    const otherProducts = products.filter((p) => {
      const productCategory = (p?.category || "").toLowerCase();
      if (!productCategory) return false;
      return !allGroupedCategories.includes(productCategory);
    });

    if (otherProducts.length > 0) {
      // Extract unique "other" categories
      const otherCategories = [...new Set(otherProducts.map((p) => p.category).filter(Boolean))];
      dynamicGroups.push({
        id: "other",
        label: "Other",
        icon: "📋",
        categories: otherCategories,
        count: otherProducts.length,
      });
    }

    return [{ id: "all", label: "All", icon: "📦", count: products.length }, ...dynamicGroups];
  }, [products]);

  // Active category group for speed buttons
  const [activeCategoryGroup, setActiveCategoryGroup] = useState("all");

  // Comprehensive SS Trading Grades
  const grades = [
    // Austenitic Stainless Steel (most common)
    "201",
    "202",
    "301",
    "304",
    "304L",
    "304H",
    "316",
    "316L",
    "316Ti",
    "317",
    "317L",
    "310",
    "310S",
    "321",
    "321H",
    "347",
    "347H",
    // Ferritic Stainless Steel
    "409",
    "430",
    "434",
    "436",
    "439",
    "444",
    // Duplex Stainless Steel
    "2205",
    "2507",
    "2304",
    // Martensitic
    "410",
    "420",
    "440A",
    "440B",
    "440C",
    // Carbon/Mild Steel
    "MS",
    "Galvanized",
    "GI",
    // Standards
    "IS2062",
    "ASTM A36",
    "ASTM A572",
    "Fe415",
    "Fe500",
    "Fe550",
    "Fe600",
  ];

  // Use constant defined outside component
  const gradeGroupDefs = GRADE_GROUP_DEFS;

  // Dynamic grade groups - only show groups that have matching products
  const gradeGroups = useMemo(() => {
    const dynamicGroups = gradeGroupDefs
      .map((group) => {
        const count = products.filter((p) => {
          const productGrade = (p?.grade || "").toLowerCase();
          return group.grades.some((g) => productGrade.includes(g.toLowerCase()));
        }).length;
        return { ...group, count };
      })
      .filter((group) => group.count > 0); // Only show groups with products

    // Get grades that don&apos;t fit any group
    const allGroupedGrades = gradeGroupDefs.flatMap((g) => g.grades.map((grade) => grade.toLowerCase()));
    const otherProducts = products.filter((p) => {
      const productGrade = (p?.grade || "").toLowerCase();
      if (!productGrade) return false;
      return !allGroupedGrades.some((g) => productGrade.includes(g));
    });

    if (otherProducts.length > 0) {
      // Extract unique "other" grades
      const otherGrades = [...new Set(otherProducts.map((p) => p.grade).filter(Boolean))];
      dynamicGroups.push({
        id: "other",
        label: "Other",
        grades: otherGrades,
        count: otherProducts.length,
      });
    }

    return [{ id: "all", label: "All Grades", count: products.length }, ...dynamicGroups];
  }, [products]);

  const [activeGradeGroup, setActiveGradeGroup] = useState("all");

  const filteredProducts = products.filter((product) => {
    const displayName = (product?.displayName ?? product?.display_name ?? "").toString().toLowerCase();
    const uniqueName = (product?.uniqueName ?? product?.unique_name ?? "").toString().toLowerCase();
    const grade = (product?.grade ?? "").toString().toLowerCase();
    const category = (product?.category ?? "").toString().toLowerCase();
    const finish = (product?.finish ?? "").toString().toLowerCase();
    const thickness = (product?.thickness ?? "").toString().toLowerCase();
    const needle = (searchTerm ?? "").toString().toLowerCase();

    const matchesSearch =
      displayName.includes(needle) ||
      uniqueName.includes(needle) ||
      grade.includes(needle) ||
      category.includes(needle) ||
      (!!finish && finish.includes(needle)) ||
      (!!thickness && thickness.includes(needle));

    // Match by individual category OR by category group
    const activeGroup = categoryGroups.find((g) => g.id === activeCategoryGroup);
    const matchesCategoryGroup =
      activeCategoryGroup === "all" ||
      activeGroup?.categories?.some((cat) => product?.category?.toLowerCase() === cat.toLowerCase());
    const matchesCategory = (categoryFilter === "all" || product?.category === categoryFilter) && matchesCategoryGroup;

    const current = Number(product?.currentStock ?? product?.current_stock ?? 0);
    const min = Number(product?.minStock ?? product?.min_stock ?? 0);
    const max = Number(product?.maxStock ?? product?.max_stock ?? 0);

    // Calculate stock status for filtering (must match getStockStatus logic)
    const effectiveMin = min > 0 ? min : 5;
    let productStockStatus = "normal";
    if (current <= 0) productStockStatus = "out_of_stock";
    else if (current <= effectiveMin) productStockStatus = "low";
    else if (max > 0 && current >= max * 0.8) productStockStatus = "high";

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && (productStockStatus === "low" || productStockStatus === "out_of_stock")) ||
      (stockFilter === "normal" && productStockStatus === "normal") ||
      (stockFilter === "high" && productStockStatus === "high");

    // Match by grade group
    const activeGrade = gradeGroups.find((g) => g.id === activeGradeGroup);
    const matchesGradeGroup =
      activeGradeGroup === "all" || activeGrade?.grades?.some((g) => grade.includes(g.toLowerCase()));

    // Phase 3: Match by product category (COIL, SHEET, PLATE, PIPE, TUBE, BAR, FLAT)
    const productCategory = (product?.productCategory || product?.product_category || "").toUpperCase();
    const matchesProductCategory =
      productCategoryFilter === "all" ||
      (productCategoryFilter && productCategory === productCategoryFilter.toUpperCase());

    return matchesSearch && matchesCategory && matchesStock && matchesGradeGroup && matchesProductCategory;
  });

  // Apply sorting to filtered products
  const sortedProducts = useMemo(() => {
    if (!sortConfig.key) return filteredProducts;

    return [...filteredProducts].sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case "productName":
          aVal = getProductDisplayName(a).toLowerCase();
          bVal = getProductDisplayName(b).toLowerCase();
          break;
        case "stock":
          aVal = Number(a.currentStock ?? a.current_stock ?? 0);
          bVal = Number(b.currentStock ?? b.current_stock ?? 0);
          break;
        case "buyPrice":
          aVal = Number(a.costPrice ?? a.cost_price ?? 0);
          bVal = Number(b.costPrice ?? b.cost_price ?? 0);
          break;
        case "sellPrice":
          aVal = Number(a.sellingPrice ?? a.selling_price ?? 0);
          bVal = Number(b.sellingPrice ?? b.selling_price ?? 0);
          break;
        case "margin": {
          const aCost = Number(a.costPrice ?? a.cost_price ?? 0);
          const aSell = Number(a.sellingPrice ?? a.selling_price ?? 0);
          aVal = aCost > 0 ? ((aSell - aCost) / aCost) * 100 : 0;
          const bCost = Number(b.costPrice ?? b.cost_price ?? 0);
          const bSell = Number(b.sellingPrice ?? b.selling_price ?? 0);
          bVal = bCost > 0 ? ((bSell - bCost) / bCost) * 100 : 0;
          break;
        }
        case "supplier":
          aVal = (a.supplier || "").toLowerCase();
          bVal = (b.supplier || "").toLowerCase();
          break;
        case "location":
          aVal = (a.location || "").toLowerCase();
          bVal = (b.location || "").toLowerCase();
          break;
        case "minStock":
          aVal = Number(a.minStock ?? a.min_stock ?? 0);
          bVal = Number(b.minStock ?? b.min_stock ?? 0);
          break;
        case "maxStock":
          aVal = Number(a.maxStock ?? a.max_stock ?? 0);
          bVal = Number(b.maxStock ?? b.max_stock ?? 0);
          break;
        case "category":
          aVal = (a.category || "").toLowerCase();
          bVal = (b.category || "").toLowerCase();
          break;
        case "grade":
          aVal = (a.grade || "").toLowerCase();
          bVal = (b.grade || "").toLowerCase();
          break;
        case "finish":
          aVal = (a.finish || "").toLowerCase();
          bVal = (b.finish || "").toLowerCase();
          break;
        case "origin":
          aVal = (a.origin || a.millCountry || a.mill_country || "").toLowerCase();
          bVal = (b.origin || b.millCountry || b.mill_country || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortConfig]);

  // Helper to get cell value for a column
  const getCellValue = (product, columnKey) => {
    const stockStatus = getStockStatus(product);
    switch (columnKey) {
      case "productName":
        return getProductDisplayName(product) || "N/A";
      case "stock":
        return {
          value: product.currentStock ?? product.current_stock ?? 0,
          status: stockStatus,
        };
      case "buyPrice":
        return product.costPrice ?? product.cost_price ?? 0;
      case "sellPrice":
        return product.sellingPrice ?? product.selling_price ?? 0;
      case "margin": {
        const cost = Number(product.costPrice ?? product.cost_price ?? 0);
        const sell = Number(product.sellingPrice ?? product.selling_price ?? 0);
        return cost > 0 ? Math.round(((sell - cost) / cost) * 100) : 0;
      }
      case "supplier":
        return product.supplier || "-";
      case "location":
        return product.location || "-";
      case "minStock":
        return product.minStock ?? product.min_stock ?? 0;
      case "maxStock":
        return product.maxStock ?? product.max_stock ?? 0;
      case "category":
        return product.category || "-";
      case "grade":
        return (
          (product.grade || "")
            .toString()
            .replace(/^(gr|ss)\s*/i, "")
            .toUpperCase() || "-"
        );
      case "finish":
        return product.finish || "-";
      case "origin":
        return product.millCountry === "AE" || product.mill_country === "AE"
          ? "Local"
          : product.millCountry || product.mill_country || product.origin || "-";
      case "lastModified": {
        const dt = product.updatedAt || product.updated_at || product.audit?.updatedAt;
        if (!dt) return "-";
        const d = new Date(dt);
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      }
      default:
        return "-";
    }
  };

  const handleAddProduct = async () => {
    try {
      // Validate ALL required fields with field-level errors
      const errors = {};
      // commodity is always "SS" (read-only badge) - no validation needed
      if (!newProduct.category || newProduct.category.trim().length === 0) {
        errors.category = "Category is required";
      }
      if (!newProduct.grade || newProduct.grade.trim().length === 0) {
        errors.grade = "Grade is required";
      }
      if (!newProduct.finish || newProduct.finish.trim().length === 0) {
        errors.finish = "Surface Finish is required";
      }
      const isPipeOrTube = /pipe|tube/i.test(newProduct.category || "");
      if (isPipeOrTube) {
        if (!newProduct.sizeInch && !newProduct.od && !newProduct.size) {
          errors.dimensions = "For Pipe/Tube, Size (inch) or OD is required";
        }
      } else {
        if (!newProduct.size || newProduct.size.trim().length === 0) {
          errors.dimensions = "Dimensions are required";
        }
      }
      if (!newProduct.thickness || newProduct.thickness.trim().length === 0) {
        errors.thickness = "Thickness is required";
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        const missingFields = Object.values(errors).join(", ");
        notificationService.error(`Please fill required fields: ${missingFields}`);
        return;
      }
      // Clear validation errors on successful validation
      setValidationErrors({});

      // Data correctness checks (warn about suspicious values)
      const warnings = [];
      const costVal = Number(newProduct.costPrice);
      const sellVal = Number(newProduct.sellingPrice);
      if (costVal > 0 && sellVal > 0 && sellVal < costVal) {
        warnings.push(`Selling price (AED ${sellVal}) is below cost price (AED ${costVal}) — negative margin`);
      }
      if (costVal > 100000 || sellVal > 100000) {
        warnings.push(`Price seems unusually high (AED ${Math.max(costVal, sellVal).toLocaleString()})`);
      }
      if (newProduct.thickness) {
        const thickNum = Number.parseFloat(newProduct.thickness);
        if (!Number.isNaN(thickNum) && (thickNum <= 0 || thickNum > 100)) {
          warnings.push(`Thickness ${thickNum}mm seems unusual (expected 0.1-100mm)`);
        }
      }
      if (similarProducts.length > 0) {
        warnings.push(`${similarProducts.length} similar product(s) already exist — possible duplicate`);
      }
      if (warnings.length > 0) {
        setSaveWarnings({
          warnings,
          onConfirm: () => {
            setSaveWarnings(null);
            doAddProduct();
          },
        });
        return;
      }
      doAddProduct();
    } catch (error) {
      console.error("Error in handleAddProduct validation:", error);
      notificationService.error(`Validation error: ${error.message || "Unknown error"}`);
    }
  };

  const doAddProduct = async () => {
    try {
      // API Gateway auto-converts camelCase → snake_case, so send camelCase
      const productData = {
        displayName: newProduct.displayName,
        category: newProduct.category,
        commodity: "SS",
        grade: newProduct.grade,
        finish: newProduct.finish,
        size: newProduct.size,
        sizeInch: newProduct.sizeInch || undefined, // API Gateway converts to size_inch
        od: newProduct.od || undefined,
        length: newProduct.length || undefined,
        thickness: newProduct.thickness,
        weight: newProduct.weight,
        description: newProduct.description,
        // currentStock: omitted - computed from inventory_items (GRN approvals / delivery notes)
        minStock: newProduct.minStock === "" ? 10 : Number(newProduct.minStock),
        maxStock: newProduct.maxStock === "" ? 1000 : Number(newProduct.maxStock),
        costPrice: newProduct.costPrice === "" ? 0 : Number(newProduct.costPrice),
        sellingPrice: newProduct.sellingPrice === "" ? 0 : Number(newProduct.sellingPrice),
        supplier: newProduct.supplier,
        location: newProduct.location,
        origin: newProduct.millCountry || undefined,
        hsCode: newProduct.hsCode || undefined,
        millCountry: newProduct.millCountry || undefined, // API Gateway converts to mill_country
        millName: newProduct.millName || undefined, // API Gateway converts to mill_name
        productCategory: newProduct.productCategory || undefined, // API Gateway converts to product_category
        // Unit of Measure fields (added 2025-12-09)
        primaryUom: newProduct.primaryUom || "PCS",
        unitWeightKg: newProduct.unitWeightKg || undefined,
        allowDecimalQuantity: newProduct.allowDecimalQuantity || false,
        // Pricing & Commercial Fields (added 2025-12-12 - Pricing Audit)
        pricingBasis: newProduct.pricingBasis || "PER_MT", // API Gateway converts to pricing_basis
        weightTolerancePercent: newProduct.weightTolerancePercent || 2.5, // API Gateway converts to weight_tolerance_percent
        specifications: newProduct.specifications,
      };
      const createdProduct = await createProduct(productData);

      // Show success message with both displayName and uniqueName
      const successMsg = createdProduct?.uniqueName
        ? `Product created successfully!\nDisplay Name: ${createdProduct.displayName}\nSystem ID: ${createdProduct.uniqueName}`
        : "Product created successfully!";

      // Sync inventory cache across modules
      clearInventoryCache();
      setNewProduct({
        displayName: "",
        category: "sheet",
        commodity: "SS",
        grade: "",
        finish: "",
        size: "",
        sizeInch: "",
        od: "",
        length: "",
        weight: "",
        description: "",
        currentStock: "",
        minStock: "",
        maxStock: "",
        costPrice: "",
        sellingPrice: "",
        supplier: "",
        location: "",
        origin: "UAE", // Reset to default
        // Phase 3: Reset Product Master Data fields
        hsCode: "",
        millName: "",
        productCategory: "",
        // Unit of Measure (reset to defaults)
        primaryUom: "PCS",
        unitWeightKg: "",
        allowDecimalQuantity: false,
        // Pricing & Commercial Fields (reset to defaults)
        pricingBasis: "PER_MT",
        weightTolerancePercent: 2.5,
        specifications: {
          length: "",
          width: "",
          thickness: "",
          diameter: "",
          tensileStrength: "",
          yieldStrength: "",
          carbonContent: "",
          coating: "",
          standard: "",
        },
      });
      setShowAddModal(false);
      refetchProducts();
      notificationService.success(successMsg);
    } catch (error) {
      console.error("Error adding product:", error);
      notificationService.error("Failed to add product");
    }
  };

  // Auto-compose product name matching database trigger pattern:
  // {commodity}-{grade}{grade_variant}-{category}-{finish}-{dimensions}
  // Uses HYPHEN delimiter (not space) and NO 'GR' prefix on grade
  useEffect(() => {
    const parts = [];
    // Commodity (uppercase)
    if (newProduct.commodity) parts.push(String(newProduct.commodity).trim().toUpperCase());
    // Grade + GradeVariant (no GR prefix - e.g., "304", "316L", "304L")
    if (newProduct.grade) {
      const g = String(newProduct.grade).trim();
      // Strip any existing GR prefix if user accidentally added it
      let fullGrade = g.replace(/^gr\s*/i, "");
      // Append grade variant if present (e.g., "L" in "304L")
      if (newProduct.gradeVariant) {
        fullGrade += String(newProduct.gradeVariant).trim();
      }
      parts.push(fullGrade);
    }
    // Category (InitCap)
    const catLabel = categories.find((c) => c.value === newProduct.category)?.label;
    if (catLabel) parts.push(catLabel);
    // Finish (uppercase)
    if (newProduct.finish) parts.push(String(newProduct.finish).trim().toUpperCase());
    // Dimensions (varies by category)
    const isPipeOrTube = /pipe|tube/i.test(newProduct.category || "");
    if (isPipeOrTube) {
      // For pipes/tubes: size (inch), OD, length
      const dimParts = [];
      if (newProduct.sizeInch) dimParts.push(`${String(newProduct.sizeInch).trim()}"`);
      if (newProduct.od) dimParts.push(`OD${String(newProduct.od).trim()}`);
      if (newProduct.length) dimParts.push(`L${String(newProduct.length).trim()}`);
      if (dimParts.length > 0) parts.push(dimParts.join("x"));
    } else {
      // For sheets/bars/etc: size and thickness
      if (newProduct.size) parts.push(String(newProduct.size).trim());
    }
    if (newProduct.thickness) {
      const thk = String(newProduct.thickness).trim().replace(/mm$/i, "");
      if (thk) parts.push(`${thk}mm`);
    }

    // Join with hyphens (matching database trigger pattern)
    const composed = parts.filter((p) => p).join("-");
    setNewProduct((prev) => ({ ...prev, displayName: composed }));
  }, [
    newProduct.commodity,
    newProduct.category,
    newProduct.grade,
    newProduct.gradeVariant,
    newProduct.finish,
    newProduct.size,
    newProduct.sizeInch,
    newProduct.od,
    newProduct.length,
    newProduct.thickness,
  ]);

  // Auto-regenerate displayName when editing product details
  /**
   * PRODUCT NAME REGENERATION LOGIC
   *
   * Generates user-facing displayName following the specification:
   * PATTERN: SS-{grade}{variant}-{form_type}-{finish}-{dimensions}
   *
   * FIELD ORDER (STRICT):
   * 1. SS (hardcoded prefix)
   * 2. Grade + Variant (e.g., "304L", "316")
   * 3. Form Type (e.g., "Sheet", "Pipe" - uses form_type or category label)
   * 4. Finish (e.g., "2B", "Polished")
   * 5. Dimensions (hyphens ONLY, no spaces or x)
   *
   * NOTE: uniqueName (system ID) is auto-generated by database trigger and cannot be edited
   *
   * EXAMPLES:
   * - Coil:  SS-201-Coil-BA-1250mm-0.8mm
   * - Sheet: SS-304-Sheet-2B-1220mm-1.5mm-2440mm
   * - Pipe:  SS-304L-Pipe-Polished-2"-SCH40
   */
  useEffect(() => {
    if (!selectedProduct) return;

    // For existing products, only regenerate if explicitly requested via regenerateName flag
    // For new products (no id), always auto-generate
    if (selectedProduct.id && !selectedProduct.regenerateName) return;

    const parts = [];

    // SS prefix (hardcoded, always present)
    parts.push("SS");

    // Grade + GradeVariant (no GR or SS prefix - e.g., "304", "316L", "304L")
    if (selectedProduct.grade) {
      const g = String(selectedProduct.grade).trim();
      // Strip both "GR" and "SS" prefixes (case insensitive)
      let fullGrade = g.replace(/^(gr|ss)\s*/i, "");
      // Append grade variant if present (e.g., "L" in "304L")
      if (selectedProduct.gradeVariant) {
        fullGrade += String(selectedProduct.gradeVariant).trim();
      }
      parts.push(fullGrade);
    }

    // Form Type (canonical field - use form_type if available, falls back to category label)
    const formType = selectedProduct.form_type || selectedProduct.category;
    if (formType) {
      const catLabel = categories.find((c) => c.value === formType)?.label || formType;
      parts.push(catLabel);
    }

    // Finish (uppercase)
    if (selectedProduct.finish) {
      parts.push(String(selectedProduct.finish).trim().toUpperCase());
    }

    // Dimensions (ALL separated by hyphens, never spaces or 'x')
    const isPipeOrTube = /pipe|tube/i.test(formType || "");
    if (isPipeOrTube) {
      // For pipes/tubes: nb_size (inch) or OD, then schedule or thickness, then length
      if (selectedProduct.sizeInch) {
        parts.push(`${String(selectedProduct.sizeInch).trim()}"`);
      } else if (selectedProduct.od) {
        parts.push(`${String(selectedProduct.od).trim()}mm`);
      }
      if (selectedProduct.schedule) {
        parts.push(String(selectedProduct.schedule).trim());
      } else if (selectedProduct.thickness) {
        parts.push(`${String(selectedProduct.thickness).trim()}mm`);
      }
      if (selectedProduct.length && selectedProduct.length !== "Coil") {
        parts.push(`${String(selectedProduct.length).trim()}mm`);
      }
    } else if (/coil/i.test(formType || "")) {
      // For coils: width, thickness
      if (selectedProduct.width) {
        parts.push(`${String(selectedProduct.width).trim()}mm`);
      }
      if (selectedProduct.thickness) {
        parts.push(`${String(selectedProduct.thickness).trim()}mm`);
      }
    } else {
      // For sheets/plates/bars: width, thickness, length
      if (selectedProduct.width) {
        parts.push(`${String(selectedProduct.width).trim()}mm`);
      }
      if (selectedProduct.thickness) {
        parts.push(`${String(selectedProduct.thickness).trim()}mm`);
      }
      if (selectedProduct.length) {
        parts.push(`${String(selectedProduct.length).trim()}mm`);
      }
    }

    // displayName = parts joined by hyphen
    const displayName = parts.filter((p) => p).join("-");

    // Only update if the generated displayName is different from current one
    if (selectedProduct.displayName !== displayName) {
      setSelectedProduct((prev) => ({
        ...prev,
        displayName,
        display_name: displayName,
        regenerateName: false, // Reset the flag after regeneration
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Note: Using granular selectedProduct properties instead of full object to avoid unnecessary rerenders
    selectedProduct?.id,
    selectedProduct?.form_type,
    selectedProduct?.category,
    selectedProduct?.grade,
    selectedProduct?.gradeVariant,
    selectedProduct?.finish,
    selectedProduct?.width,
    selectedProduct?.sizeInch,
    selectedProduct?.od,
    selectedProduct?.length,
    selectedProduct?.thickness,
    selectedProduct?.schedule,
    selectedProduct?.mill_country,
    selectedProduct?.millCountry,
    selectedProduct?.mill_name,
    selectedProduct?.millName,
    selectedProduct?.regenerateName,
    selectedProduct?.displayName,
    selectedProduct,
  ]);

  const handleEditProduct = async () => {
    try {
      // Use same validation as handleAddProduct but for edit mode (data is in newProduct)
      const errors = {};
      if (!newProduct.category || newProduct.category.trim().length === 0) {
        errors.category = "Category is required";
      }
      if (!newProduct.grade || newProduct.grade.trim().length === 0) {
        errors.grade = "Grade is required";
      }
      if (!newProduct.finish || newProduct.finish.trim().length === 0) {
        errors.finish = "Surface Finish is required";
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        const missingFields = Object.values(errors).join(", ");
        notificationService.error(`Please fill required fields: ${missingFields}`);
        return;
      }
      setValidationErrors({});

      // Data correctness checks
      const warnings = [];
      const costVal = Number(newProduct.costPrice);
      const sellVal = Number(newProduct.sellingPrice);
      if (costVal > 0 && sellVal > 0 && sellVal < costVal) {
        warnings.push(`Selling price (AED ${sellVal}) is below cost price (AED ${costVal}) — negative margin`);
      }
      if (costVal > 100000 || sellVal > 100000) {
        warnings.push(`Price seems unusually high (AED ${Math.max(costVal, sellVal).toLocaleString()})`);
      }
      if (newProduct.thickness) {
        const thickNum = Number.parseFloat(newProduct.thickness);
        if (!Number.isNaN(thickNum) && (thickNum <= 0 || thickNum > 100)) {
          warnings.push(`Thickness ${thickNum}mm seems unusual (expected 0.1-100mm)`);
        }
      }
      if (warnings.length > 0) {
        setSaveWarnings({
          warnings,
          onConfirm: () => {
            setSaveWarnings(null);
            doEditProduct();
          },
        });
        return;
      }
      doEditProduct();
    } catch (error) {
      console.error("Error in handleEditProduct validation:", error);
      notificationService.error(`Validation error: ${error.message || "Unknown error"}`);
    }
  };

  const doEditProduct = async () => {
    try {
      // API Gateway auto-converts camelCase → snake_case, so send camelCase
      const productData = {
        displayName: newProduct.displayName,
        category: newProduct.category,
        commodity: "SS",
        grade: newProduct.grade,
        finish: newProduct.finish,
        size: newProduct.size,
        sizeInch: newProduct.sizeInch || "",
        od: newProduct.od || "",
        length: newProduct.length || "",
        thickness: newProduct.thickness,
        weight: newProduct.weight,
        description: newProduct.description,
        // currentStock: omitted - computed from inventory_items (GRN approvals / delivery notes)
        minStock: newProduct.minStock === "" ? 0 : Number(newProduct.minStock),
        maxStock: newProduct.maxStock === "" ? 1000 : Number(newProduct.maxStock),
        costPrice: newProduct.costPrice === "" ? 0 : Number(newProduct.costPrice),
        sellingPrice: newProduct.sellingPrice === "" ? 0 : Number(newProduct.sellingPrice),
        supplier: newProduct.supplier,
        location: newProduct.location,
        origin: newProduct.millCountry || undefined,
        hsCode: newProduct.hsCode || undefined,
        millCountry: newProduct.millCountry || undefined,
        millName: newProduct.millName || undefined,
        productCategory: newProduct.productCategory || undefined,
        primaryUom: newProduct.primaryUom || "PCS",
        unitWeightKg: newProduct.unitWeightKg || undefined,
        allowDecimalQuantity: newProduct.allowDecimalQuantity || false,
        pricingBasis: newProduct.pricingBasis || "PER_MT",
        weightTolerancePercent:
          newProduct.weightTolerancePercent !== undefined ? Number(newProduct.weightTolerancePercent) : 2.5,
        specifications: newProduct.specifications,
      };

      await updateProduct(editingProductId, productData);

      // Sync inventory cache across modules
      clearInventoryCache();

      await refetchProducts();

      notificationService.success("Product updated successfully!");
      setShowAddModal(false);
      setEditingProductId(null);
      setSelectedProduct(null);
    } catch (error) {
      console.error("❌ Error updating product:", error);
      notificationService.error(`Failed to update product: ${error.message || "Unknown error"}`);
    }
  };

  const handleDeleteProduct = async (productId) => {
    const confirmed = await confirm({
      title: "Delete Product?",
      message: "Are you sure you want to delete this product? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteProduct(productId);
      // Sync inventory cache across modules
      clearInventoryCache();
      refetchProducts();
      notificationService.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      notificationService.error("Failed to delete product");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.size === 0) return;
    const confirmed = await confirm({
      title: `Delete ${selectedProductIds.size} Product(s)?`,
      message: `Are you sure you want to delete ${selectedProductIds.size} selected product(s)? This action cannot be undone.`,
      confirmText: "Delete All",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      for (const id of selectedProductIds) {
        await deleteProduct(id);
      }
      clearInventoryCache();
      refetchProducts();
      setSelectedProductIds(new Set());
      notificationService.success(`${selectedProductIds.size} product(s) deleted`);
    } catch (error) {
      console.error("Error in bulk delete:", error);
      notificationService.error("Some products failed to delete");
    }
  };

  /**
   * Determine stock status with proper edge case handling
   * - OUT_OF_STOCK: quantity is 0 or negative (always takes priority)
   * - LOW: quantity > 0 but <= minStock (or <= 5 if minStock is 0)
   * - HIGH: quantity >= maxStock * 0.8 (only if maxStock > 0)
   * - NORMAL: everything else
   */
  const getStockStatus = (product) => {
    // Safely parse values with fallbacks to 0
    const currentStock = Number(product.currentStock) || 0;
    const minStock = Number(product.minStock) || 0;
    const maxStock = Number(product.maxStock) || 0;

    // CRITICAL: Out of stock takes priority over everything
    if (currentStock <= 0) {
      return "out_of_stock";
    }

    // Low stock check
    // If minStock is 0 (not set), use 5 as default threshold
    const effectiveMinStock = minStock > 0 ? minStock : 5;
    if (currentStock <= effectiveMinStock) {
      return "low";
    }

    // High stock check - only if maxStock is defined and > 0
    // Prevent false positives when maxStock is 0 or undefined
    if (maxStock > 0 && currentStock >= maxStock * 0.8) {
      return "high";
    }

    return "normal";
  };

  const renderCatalog = () => (
    <div className="p-4">
      {/* Quick Filters Header with Toggle - Compact */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-teal-400" : "text-teal-600"}`}
        >
          Quick Filters
        </span>
        <button
          type="button"
          onClick={() => setShowSpeedButtons(!showSpeedButtons)}
          className={`
            relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200
            ${showSpeedButtons ? "bg-teal-500" : isDarkMode ? "bg-gray-600" : "bg-gray-300"}
          `}
          title={showSpeedButtons ? "Hide quick filters" : "Show quick filters"}
        >
          <span
            className={`
              inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200
              ${showSpeedButtons ? "translate-x-3.5" : "translate-x-0.5"}
            `}
          />
        </button>
      </div>

      {/* Speed Buttons Container - Collapsible & Compact */}
      {showSpeedButtons && (
        <div className="space-y-2 mb-3">
          {/* Category Speed Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-xs font-medium ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Category:</span>
            {categoryGroups.map((group) => {
              const isActive = activeCategoryGroup === group.id;
              return (
                <button
                  type="button"
                  key={group.id}
                  onClick={() => {
                    setActiveCategoryGroup(group.id);
                    setCategoryFilter("all");
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all border ${
                    isActive
                      ? "bg-teal-500 text-white border-teal-400"
                      : isDarkMode
                        ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm">{group.icon}</span>
                  <span>{group.label}</span>
                  <span
                    className={`px-1 rounded text-xs ${isActive ? "bg-white/20" : isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                  >
                    {group.count}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Grade Speed Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-xs font-medium ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Grade:</span>
            {gradeGroups.map((group) => {
              const isActive = activeGradeGroup === group.id;
              return (
                <button
                  type="button"
                  key={group.id}
                  onClick={() => setActiveGradeGroup(group.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all border ${
                    isActive
                      ? "bg-teal-500 text-white border-teal-400"
                      : isDarkMode
                        ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span>{group.label}</span>
                  <span
                    className={`px-1 rounded text-xs ${isActive ? "bg-white/20" : isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}
                  >
                    {group.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Product Stats Summary - Compact inline */}
      <div
        className={`flex flex-wrap items-center gap-4 py-2 mb-3 text-xs border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="flex items-center gap-1">
          <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Showing:</span>
          <span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {filteredProducts.length}
          </span>
          <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>of {pageInfo.totalItems || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
          <span className="text-sm font-medium text-gray-500">
            {products.filter((p) => (Number(p.currentStock) || 0) <= 0).length}
          </span>
          <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>out of stock</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          <span className="text-sm font-medium text-red-500">
            {
              products.filter((p) => {
                const currentStock = Number(p.currentStock) || 0;
                const minStock = p.minStock > 0 ? p.minStock : 5;
                return currentStock > 0 && currentStock <= minStock;
              }).length
            }
          </span>
          <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>low stock</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          <span className="text-sm font-medium text-green-500">
            {products.filter((p) => (Number(p.currentStock) || 0) > (p.minStock || 0)).length}
          </span>
          <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>in stock</span>
        </div>
      </div>

      {/* Controls - Compact row with uniform heights */}
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          />
          <input
            type="text"
            placeholder="Search products by name, code, or specification..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full h-9 pl-9 pr-3 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isDarkMode
                ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`h-9 pl-3 pr-8 text-sm border rounded-lg appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          />
        </div>

        {/* Stock Filter */}
        <div className="relative">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className={`h-9 pl-3 pr-8 text-sm border rounded-lg appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="all">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="normal">Normal</option>
            <option value="high">High Stock</option>
          </select>
          <ChevronDown
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          />
        </div>

        {/* Product Category Filter */}
        <div className="relative">
          <select
            value={productCategoryFilter}
            onChange={(e) => setProductCategoryFilter(e.target.value)}
            className={`h-9 pl-3 pr-8 text-sm border rounded-lg appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="all">All Groups</option>
            <option value="COIL">COIL</option>
            <option value="SHEET">SHEET</option>
            <option value="PLATE">PLATE</option>
            <option value="PIPE">PIPE</option>
            <option value="TUBE">TUBE</option>
            <option value="BAR">BAR</option>
            <option value="FLAT">FLAT</option>
          </select>
          <ChevronDown
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          />
        </div>

        {/* Action Buttons */}
        <button
          type="button"
          onClick={async () => {
            try {
              await productService.downloadProducts();
            } catch (error) {
              console.error("Error downloading products:", error);
              notificationService.error("Failed to download products");
            }
          }}
          className={`h-9 px-3 text-sm font-medium rounded-lg border inline-flex items-center gap-1.5 transition-colors ${
            isDarkMode
              ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Package size={16} />
          Download
        </button>
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="h-9 px-3 text-sm font-medium rounded-lg inline-flex items-center gap-1.5 bg-teal-600 text-white hover:bg-teal-500 transition-colors"
        >
          <Upload size={16} />
          Upload
        </button>
        <button
          type="button"
          onClick={() => {
            setEditingProductId(null);
            handleClearForm();
            setShowAddModal(true);
          }}
          className="h-9 px-3 text-sm font-medium rounded-lg inline-flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          <Plus size={16} />
          Add Product
        </button>

        {/* Column Picker Button */}
        <div className="relative" ref={columnPickerRef}>
          <button
            type="button"
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className={`h-9 w-9 rounded-lg border inline-flex items-center justify-center transition-colors ${
              isDarkMode
                ? "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
            title="Configure Columns"
          >
            <Settings2 size={16} />
          </button>
          {showColumnPicker && (
            <div
              className={`absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border shadow-lg ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`px-3 py-2 border-b text-sm font-medium ${
                  isDarkMode ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"
                }`}
              >
                Show Columns
              </div>
              <div className="p-2 max-h-64 overflow-y-auto">
                {ALL_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${
                      col.required ? "opacity-50 cursor-not-allowed" : ""
                    } ${isDarkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-700"}`}
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.key)}
                      onChange={() => toggleColumn(col.key)}
                      disabled={col.required}
                      className="rounded border-gray-400 text-teal-600 focus:ring-teal-500"
                    />
                    <span>{col.label}</span>
                    {col.required && <span className="text-xs text-gray-500">(required)</span>}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProductIds.size > 0 && (
        <div
          className={`flex items-center gap-3 px-4 py-2 rounded-lg mb-2 ${isDarkMode ? "bg-teal-900/30 border border-teal-700" : "bg-teal-50 border border-teal-200"}`}
        >
          <span className={`text-sm font-medium ${isDarkMode ? "text-teal-300" : "text-teal-700"}`}>
            {selectedProductIds.size} selected
          </span>
          <Button variant="secondary" size="sm" onClick={() => setSelectedProductIds(new Set())}>
            Clear
          </Button>
          <Button variant="secondary" size="sm" onClick={handleBulkDelete} className="text-red-600 hover:text-red-700">
            <Trash2 size={14} />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Table Container */}
      <div className={`overflow-x-auto rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <table className="w-full min-w-[800px] table-fixed">
          {/* Table Header */}
          <thead className={`sticky top-0 z-10 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <tr>
              <th className="px-2 py-2 w-[40px]">
                <input
                  type="checkbox"
                  checked={selectedProductIds.size > 0 && selectedProductIds.size === sortedProducts.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProductIds(new Set(sortedProducts.map((p) => p.id)));
                    } else {
                      setSelectedProductIds(new Set());
                    }
                  }}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
              </th>
              {ALL_COLUMNS.filter((col) => visibleColumns.includes(col.key)).map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors ${col.width} ${
                    isDarkMode
                      ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {sortConfig.key === col.key ? (
                      sortConfig.direction === "asc" ? (
                        <ArrowUp size={14} className="text-teal-500" />
                      ) : (
                        <ArrowDown size={14} className="text-teal-500" />
                      )
                    ) : (
                      <ArrowUpDown size={14} className="opacity-40" />
                    )}
                  </div>
                </th>
              ))}
              <th
                className={`px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider w-[120px] ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
            {sortedProducts.map((product, index) => {
              const stockData = getCellValue(product, "stock");
              return (
                <tr
                  key={`${product.id}-${index}`}
                  className={`transition-colors ${
                    isDarkMode ? "bg-gray-900 hover:bg-gray-800" : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <td className="px-2 py-2 w-[40px]">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.has(product.id)}
                      onChange={(e) => {
                        const next = new Set(selectedProductIds);
                        if (e.target.checked) next.add(product.id);
                        else next.delete(product.id);
                        setSelectedProductIds(next);
                      }}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </td>
                  {ALL_COLUMNS.filter((col) => visibleColumns.includes(col.key)).map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 text-sm whitespace-nowrap ${col.width} ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {col.key === "stock" ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              stockData.status === "out_of_stock"
                                ? "bg-red-500"
                                : stockData.status === "low"
                                  ? "bg-yellow-500"
                                  : stockData.status === "high"
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                            }`}
                          />
                          <span className="font-medium">{stockData.value}</span>
                          <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                            {(product.pricingBasis || product.pricing_basis) === "PER_PCS"
                              ? "PCS"
                              : (product.pricingBasis || product.pricing_basis) === "PER_METER"
                                ? "M"
                                : "MT"}
                          </span>
                        </div>
                      ) : col.key === "buyPrice" || col.key === "sellPrice" ? (
                        <span className={col.key === "sellPrice" ? "text-green-600 font-medium" : ""}>
                          AED {Number(getCellValue(product, col.key)).toFixed(2)}
                        </span>
                      ) : col.key === "margin" ? (
                        <div className="flex items-center gap-1">
                          <span
                            className={`font-medium px-2 py-1 rounded ${
                              getCellValue(product, col.key) < 0
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : getCellValue(product, col.key) > 20
                                  ? "text-green-600"
                                  : getCellValue(product, col.key) > 10
                                    ? "text-yellow-600"
                                    : "text-red-500"
                            }`}
                          >
                            {getCellValue(product, col.key)}%
                          </span>
                          {getCellValue(product, col.key) < 0 && (
                            <span className="text-red-500 font-bold" title="Negative margin alert">
                              ⚠️
                            </span>
                          )}
                        </div>
                      ) : col.key === "productName" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowSpecModal(true);
                          }}
                          className={`font-mono text-sm text-left hover:underline truncate block w-full ${isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"}`}
                          title={
                            product.displayName ||
                            product.display_name ||
                            product.uniqueName ||
                            product.unique_name ||
                            ""
                          }
                        >
                          {product.displayName ||
                            product.display_name ||
                            product.uniqueName ||
                            product.unique_name ||
                            "N/A"}
                        </button>
                      ) : (
                        getCellValue(product, col.key)
                      )}
                    </td>
                  ))}
                  {/* Actions Column */}
                  <td className="px-3 py-2 text-right w-[100px]">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          // Populate newProduct from existing product for unified Add/Edit modal
                          const thk = product.thickness || "";
                          setNewProduct({
                            displayName: getProductDisplayName(product),
                            category: product.category || "sheet",
                            commodity: product.commodity || "SS",
                            grade: product.grade || "",
                            finish: product.finish ? String(product.finish).trim() : "",
                            size: product.size || "",
                            sizeInch: product.sizeInch || product.size_inch || "",
                            od: product.od || "",
                            length: product.length || "",
                            weight: product.weight || "",
                            description: product.description || "",
                            currentStock:
                              product.currentStock !== undefined ? product.currentStock : product.current_stock || "",
                            minStock: product.minStock ?? product.min_stock ?? "",
                            maxStock: product.maxStock ?? product.max_stock ?? "",
                            costPrice: product.costPrice !== undefined ? product.costPrice : product.cost_price || "",
                            sellingPrice:
                              product.sellingPrice !== undefined ? product.sellingPrice : product.selling_price || "",
                            supplier: product.supplier || "",
                            location: product.location || "",
                            origin: product.origin || "UAE",
                            thickness: thk,
                            hsCode: product.hsCode || product.hs_code || "",
                            millCountry: product.millCountry || product.mill_country || product.origin || "",
                            millName: product.millName || product.mill_name || "",
                            productCategory: product.productCategory || product.product_category || "",
                            primaryUom: product.primaryUom || product.primary_uom || "PCS",
                            unitWeightKg: product.unitWeightKg || product.unit_weight_kg || "",
                            allowDecimalQuantity:
                              product.allowDecimalQuantity ?? product.allow_decimal_quantity ?? false,
                            pricingBasis: product.pricingBasis || product.pricing_basis || "PER_MT",
                            weightTolerancePercent:
                              product.weightTolerancePercent ?? product.weight_tolerance_percent ?? 2.5,
                            specifications: product.specifications || {
                              length: "",
                              width: "",
                              thickness: "",
                              diameter: "",
                              tensileStrength: "",
                              yieldStrength: "",
                              carbonContent: "",
                              coating: "",
                              standard: "",
                            },
                          });
                          // Check if thickness matches a standard dropdown option
                          const stdThicknesses = [
                            "0.3mm",
                            "0.4mm",
                            "0.5mm",
                            "0.6mm",
                            "0.7mm",
                            "0.8mm",
                            "0.9mm",
                            "1.0mm",
                            "1.2mm",
                            "1.5mm",
                            "1.6mm",
                            "2.0mm",
                            "2.5mm",
                            "3.0mm",
                            "4.0mm",
                            "5.0mm",
                            "6.0mm",
                            "8.0mm",
                            "10.0mm",
                            "12.0mm",
                            "14.0mm",
                            "16.0mm",
                            "20.0mm",
                            "25.0mm",
                            "30.0mm",
                          ];
                          setCustomThickness(thk !== "" && !stdThicknesses.includes(thk));
                          setEditingProductId(product.id);
                          setSelectedProduct(product);
                          setShowAddModal(true);
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? "text-teal-400 hover:text-teal-300 hover:bg-gray-700"
                            : "text-teal-600 hover:text-teal-700 hover:bg-gray-100"
                        }`}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          notificationService.info("Copy feature coming soon");
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        }`}
                        title="Copy"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        className={`p-1.5 rounded transition-colors ${
                          isDarkMode
                            ? "text-red-400 hover:text-red-300 hover:bg-gray-700"
                            : "text-red-500 hover:text-red-600 hover:bg-gray-100"
                        }`}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty State / Error State */}
        {sortedProducts.length === 0 && (
          <div className={`p-8 text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            {productsError ? (
              <div className="space-y-3">
                <AlertTriangle className={`w-8 h-8 mx-auto ${isDarkMode ? "text-red-400" : "text-red-500"}`} />
                <p className={isDarkMode ? "text-red-400" : "text-red-600"}>
                  Failed to load products. Please check your connection and try again.
                </p>
                <button
                  type="button"
                  onClick={() => refetchProducts()}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  Retry
                </button>
              </div>
            ) : (
              "No products found matching your criteria."
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {sortedProducts.length > 0 && (
          <div
            className={`flex items-center justify-between mt-4 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, pageInfo.totalItems || 0)} of{" "}
              {pageInfo.totalItems || 0} products
            </div>
            <div className="flex gap-4 items-center">
              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="product-page-size"
                  className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Per page:
                </label>
                <select
                  id="product-page-size"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className={`px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isDarkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-300 text-gray-700"
                  }`}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`p-1.5 rounded border transition-colors ${
                    page === 1
                      ? isDarkMode
                        ? "opacity-50 cursor-not-allowed border-gray-700 text-gray-600"
                        : "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                      : isDarkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                  title="Previous page"
                >
                  <ChevronDown size={16} className="rotate-90" />
                </button>
                <span className={`px-2 py-1 text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Page {page} of {pageInfo.totalPages || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageInfo.totalPages || 1, p + 1))}
                  disabled={page >= (pageInfo.totalPages || 1)}
                  className={`p-1.5 rounded border transition-colors ${
                    page >= (pageInfo.totalPages || 1)
                      ? isDarkMode
                        ? "opacity-50 cursor-not-allowed border-gray-700 text-gray-600"
                        : "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                      : isDarkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                  title="Next page"
                >
                  <ChevronDown size={16} className="-rotate-90" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`p-4 min-h-screen ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
        }`}
      >
        {/* Header - Compact */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Package size={24} className="text-teal-600" />
            <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              🏗️ Stainless Steel Products
            </h1>
          </div>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Manage your steel product catalog, inventory, and pricing
          </p>
        </div>

        {/* Tabs - Folder style that connects to content */}
        <div className="flex flex-wrap gap-1 relative">
          {[{ id: "catalog", label: "Product Catalog", icon: Package }].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg border-t border-l border-r relative ${
                  isActive
                    ? isDarkMode
                      ? "bg-gray-800 text-teal-400 border-gray-700 z-10"
                      : "bg-gray-50 text-teal-700 border-gray-200 z-10"
                    : isDarkMode
                      ? "bg-gray-900/50 text-gray-400 border-gray-800 hover:text-gray-200 hover:bg-gray-800/50"
                      : "bg-gray-100/50 text-gray-600 border-gray-200 hover:text-gray-900 hover:bg-gray-100"
                }`}
                style={isActive ? { marginBottom: "-1px" } : {}}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content - Connected to tabs */}
        <div
          className={`border rounded-b-lg rounded-tr-lg ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}
        >
          {activeTab === "catalog" && renderCatalog()}
        </div>

        {/* Add Product Modal */}
        {showAddModal && (
          <div
            role="dialog"
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                editingProductId ? handleEditProduct() : handleAddProduct();
              }
            }}
          >
            <div
              className={`rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
                isDarkMode ? "bg-[#1E2328]" : "bg-white"
              }`}
            >
              {/* Modal Header */}
              <div
                className={`flex justify-between items-center p-6 border-b ${
                  isDarkMode ? "border-[#37474F]" : "border-gray-200"
                }`}
              >
                <div>
                  <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {editingProductId ? "Edit Product" : "Add New Product"}
                  </h2>
                  <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Fields marked with <span className="text-red-500">*</span> are required
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProductId(null);
                  }}
                  className={`p-2 rounded transition-colors bg-transparent ${
                    isDarkMode ? "text-gray-400 hover:text-gray-300" : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Phase 2: Enhanced Quick Start Templates with Dropdown & Clear - hidden in edit mode */}
                {!editingProductId && (
                  <div
                    className={`p-4 rounded-lg border ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-teal-50 border-teal-200"}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-teal-500" />
                        <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          Quick Start Templates
                        </h3>
                      </div>
                      <Button onClick={handleClearForm} variant="outline" size="sm" className="flex items-center gap-1">
                        <RotateCcw size={14} />
                        Clear Form
                      </Button>
                    </div>
                    <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Select a template to quickly pre-fill common product specifications
                    </p>

                    {/* Template Quick Buttons */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {productTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleTemplateSelect(template)}
                          className={`flex-shrink-0 px-3 py-2 rounded-lg border transition-all ${
                            selectedTemplate === template.id
                              ? isDarkMode
                                ? "border-teal-500 bg-teal-900/50 shadow-lg"
                                : "border-teal-500 bg-teal-100 shadow-md"
                              : isDarkMode
                                ? "border-gray-600 bg-gray-800 hover:border-teal-600"
                                : "border-gray-300 bg-white hover:border-teal-400"
                          }`}
                        >
                          <div className={`text-xs font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {template.name.split(" ")[0]} {/* Show emoji */}
                          </div>
                          <div className={`text-[10px] mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {template.grade}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Copy from Existing - inline with templates */}
                    <button
                      type="button"
                      onClick={() => setShowCopyModal(true)}
                      className={`mt-2 px-3 py-1.5 rounded-lg border text-xs transition-all flex items-center gap-1.5 ${
                        isDarkMode
                          ? "border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300"
                          : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <Copy size={12} />
                      or copy from existing product
                    </button>
                  </div>
                )}

                {/* Phase 4: Visual Product Name Builder - Sticky for visibility while scrolling */}
                <div className="sticky top-0 z-10">
                  <ProductNameSegments productData={newProduct} focusedField={focusedField} isDarkMode={isDarkMode} />
                </div>

                {/* Basic Information with Tooltips */}
                <div>
                  <h3 className="text-lg font-medium text-teal-600 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Commodity - Read-only badge (always SS for Stainless Steel) */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
                          Commodity
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${isDarkMode ? "bg-gray-800/50 border-gray-600" : "bg-gray-50 border-gray-300"}`}
                      >
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                          SS
                        </span>
                        <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Stainless Steel
                        </span>
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label
                          htmlFor="category-select"
                          className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        >
                          Form Type / Category<span className="text-red-500 ml-1">*</span>
                        </label>
                        <Tooltip content="Product form: Sheet (flat), Pipe (round hollow), Tube (square/rectangular hollow), Coil (rolled), etc.">
                          <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        </Tooltip>
                      </div>
                      <div className="relative">
                        <select
                          id="category-select"
                          value={newProduct.category}
                          onChange={(e) => {
                            const cat = e.target.value;
                            // Auto-map category to customs Product Category
                            const categoryToProductCategory = {
                              sheet: "SHEET",
                              coil: "COIL",
                              plate: "PLATE",
                              round_pipe: "PIPE",
                              seamless_pipe: "PIPE",
                              erw_pipe: "PIPE",
                              welded_pipe: "PIPE",
                              square_tube: "TUBE",
                              rectangular_tube: "TUBE",
                              round_bar: "BAR",
                              flat_bar: "FLAT",
                              angle: "BAR",
                              channel: "BAR",
                              beam: "BAR",
                              wire: "BAR",
                              strip: "FLAT",
                              circle: "SHEET",
                              blank: "SHEET",
                            };
                            setNewProduct({
                              ...newProduct,
                              category: cat,
                              productCategory: categoryToProductCategory[cat] || newProduct.productCategory || "",
                            });
                            if (validationErrors.category && cat.trim()) {
                              setValidationErrors((prev) => ({ ...prev, category: undefined }));
                            }
                          }}
                          onFocus={() => setFocusedField("category")}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } ${validationErrors.category ? "!border-red-500 ring-1 ring-red-500" : ""}`}
                        >
                          {categories.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.icon} {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                        />
                      </div>
                      {validationErrors.category && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.category}</p>
                      )}
                    </div>

                    {/* Grade with Validation */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label
                          htmlFor="grade-input"
                          className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        >
                          Grade<span className="text-red-500 ml-1">*</span>
                        </label>
                        <Tooltip
                          content={
                            gradeHelp[newProduct.grade] ||
                            "Steel grade determines corrosion resistance, strength, and application. Common grades: 304 (general), 316L (marine), 201 (budget)."
                          }
                        >
                          <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        </Tooltip>
                      </div>
                      <div className="relative">
                        <select
                          id="grade-input"
                          value={newProduct.grade}
                          onChange={(e) => {
                            setNewProduct({
                              ...newProduct,
                              grade: e.target.value,
                            });
                            const validation = validateGrade(e.target.value);
                            setValidationErrors({
                              ...validationErrors,
                              grade: validation,
                            });
                          }}
                          onFocus={() => setFocusedField("grade")}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } ${validationErrors.grade && typeof validationErrors.grade === "string" ? "!border-red-500 ring-1 ring-red-500" : ""}`}
                        >
                          <option value="">Select grade...</option>
                          {grades.map((grade) => (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                        />
                      </div>
                      {validationErrors.grade && typeof validationErrors.grade === "string" && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.grade}</p>
                      )}
                      {validationErrors.grade && typeof validationErrors.grade === "object" && (
                        <ValidationMessage
                          type={validationErrors.grade.type}
                          message={validationErrors.grade.message}
                          suggestion={validationErrors.grade.suggestion}
                        />
                      )}
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Do not include &apos;GR&apos; prefix - it will be added automatically.
                      </p>
                    </div>

                    {/* Finish */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label
                          htmlFor="finish-select"
                          className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        >
                          Surface Finish<span className="text-red-500 ml-1">*</span>
                        </label>
                        <Tooltip
                          content={
                            finishHelp[newProduct.finish] ||
                            "Surface finish affects appearance and application. 2B (standard), BA (mirror), HL (brushed), Polished (shiny)."
                          }
                        >
                          <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        </Tooltip>
                      </div>
                      <div className="relative">
                        <select
                          id="finish-select"
                          value={(newProduct.finish || "").trim()}
                          onChange={(e) => {
                            setNewProduct({
                              ...newProduct,
                              finish: e.target.value.trim().toUpperCase(),
                            });
                            if (validationErrors.finish && e.target.value.trim()) {
                              setValidationErrors((prev) => ({ ...prev, finish: undefined }));
                            }
                          }}
                          onFocus={() => setFocusedField("finish")}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } ${validationErrors.finish ? "!border-red-500 ring-1 ring-red-500" : ""}`}
                        >
                          <option value="">Select finish...</option>
                          {allFinishes.map((finish) => (
                            <option key={finish} value={finish}>
                              {finish} Finish
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                        />
                      </div>
                      {validationErrors.finish && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.finish}</p>
                      )}
                    </div>
                    {/* Dimensions - Dynamic based on category */}
                    {/pipe|tube/i.test(newProduct.category || "") ? (
                      <>
                        {/* Pipe/Tube Dimensions */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <label
                              htmlFor="size-inch-input"
                              className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                            >
                              Size (inches)<span className="text-red-500 ml-1">*</span>
                            </label>
                            <Tooltip content='Nominal pipe size in inches (e.g., 2", 4", 6"). Standard sizes: 1/2", 3/4", 1", 1.5", 2", 3", 4", 6", 8".'>
                              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                            </Tooltip>
                          </div>
                          <input
                            id="size-inch-input"
                            type="text"
                            value={newProduct.sizeInch}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                sizeInch: e.target.value,
                              })
                            }
                            onFocus={() => setFocusedField("dimensions")}
                            onBlur={() => setFocusedField(null)}
                            placeholder='e.g., 2"'
                            className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <label
                              htmlFor="od-input"
                              className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                            >
                              OD (Outer Diameter)
                            </label>
                            <Tooltip content="Outer diameter in inches or mm. For precise measurement and wall thickness calculation.">
                              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                            </Tooltip>
                          </div>
                          <input
                            id="od-input"
                            type="text"
                            value={newProduct.od}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                od: e.target.value,
                              })
                            }
                            onFocus={() => setFocusedField("dimensions")}
                            onBlur={() => setFocusedField(null)}
                            placeholder='e.g., 2.375"'
                            className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <label
                              htmlFor="length-input"
                              className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                            >
                              Length
                            </label>
                            <Tooltip content='Standard length in mm or inches. Common: 6m (236"), 3m (118"), custom lengths available.'>
                              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                            </Tooltip>
                          </div>
                          <input
                            id="length-input"
                            type="text"
                            value={newProduct.length}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                length: e.target.value,
                              })
                            }
                            onFocus={() => setFocusedField("dimensions")}
                            onBlur={() => setFocusedField(null)}
                            placeholder='e.g., 6000mm or 236"'
                            className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                            }`}
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <label
                            htmlFor="dimensions-input"
                            className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                          >
                            Dimensions (mm)<span className="text-red-500 ml-1">*</span>
                          </label>
                          <Tooltip content="Dimensions in millimeters. Format: Width x Length (e.g., 1220x2440) or Width x Thickness x Length. Standard sheet: 1220x2440mm (4'x8').">
                            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                          </Tooltip>
                        </div>
                        <input
                          id="dimensions-input"
                          type="text"
                          value={newProduct.size}
                          onChange={(e) => {
                            setNewProduct({
                              ...newProduct,
                              size: e.target.value,
                            });
                            if (validationErrors.dimensions && e.target.value.trim()) {
                              setValidationErrors((prev) => ({ ...prev, dimensions: undefined }));
                            }
                          }}
                          onFocus={() => setFocusedField("dimensions")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="e.g., 1220x2440 or 50x50"
                          className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                          } ${validationErrors.dimensions ? "!border-red-500 ring-1 ring-red-500" : ""}`}
                        />
                        {validationErrors.dimensions && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.dimensions}</p>
                        )}
                      </div>
                    )}

                    {/* Thickness - dropdown with standard SS gauges */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <label
                          htmlFor="thickness-select"
                          className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                        >
                          Thickness<span className="text-red-500 ml-1">*</span>
                        </label>
                        <Tooltip content="Select standard gauge thickness. Use 'Custom' for non-standard sizes.">
                          <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        </Tooltip>
                      </div>
                      {customThickness ? (
                        <div className="flex gap-2">
                          <input
                            id="thickness-select"
                            type="text"
                            value={newProduct.thickness}
                            onChange={(e) => {
                              setNewProduct({ ...newProduct, thickness: e.target.value });
                              if (validationErrors.thickness && e.target.value.trim()) {
                                setValidationErrors((prev) => ({ ...prev, thickness: undefined }));
                              }
                            }}
                            onFocus={() => setFocusedField("thickness")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="e.g., 1.8mm"
                            className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                            } ${validationErrors.thickness ? "!border-red-500 ring-1 ring-red-500" : ""}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCustomThickness(false);
                              setNewProduct({ ...newProduct, thickness: "" });
                            }}
                            className={`px-2 py-1 text-xs rounded border ${isDarkMode ? "border-gray-600 text-gray-400 hover:text-white" : "border-gray-300 text-gray-500 hover:text-gray-700"}`}
                          >
                            List
                          </button>
                        </div>
                      ) : (
                        <select
                          id="thickness-select"
                          value={newProduct.thickness}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "__custom__") {
                              setCustomThickness(true);
                              setNewProduct({ ...newProduct, thickness: "" });
                              return;
                            }
                            setNewProduct({ ...newProduct, thickness: val });
                            if (validationErrors.thickness && val) {
                              setValidationErrors((prev) => ({ ...prev, thickness: undefined }));
                            }
                          }}
                          onFocus={() => setFocusedField("thickness")}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          } ${validationErrors.thickness ? "!border-red-500 ring-1 ring-red-500" : ""}`}
                        >
                          <option value="">Select thickness...</option>
                          <optgroup label="Thin Gauge (&lt; 1mm)">
                            <option value="0.3mm">0.3 mm</option>
                            <option value="0.4mm">0.4 mm</option>
                            <option value="0.5mm">0.5 mm</option>
                            <option value="0.6mm">0.6 mm</option>
                            <option value="0.7mm">0.7 mm</option>
                            <option value="0.8mm">0.8 mm</option>
                            <option value="0.9mm">0.9 mm</option>
                          </optgroup>
                          <optgroup label="Standard Gauge (1-3mm)">
                            <option value="1.0mm">1.0 mm</option>
                            <option value="1.2mm">1.2 mm</option>
                            <option value="1.5mm">1.5 mm</option>
                            <option value="1.6mm">1.6 mm</option>
                            <option value="2.0mm">2.0 mm</option>
                            <option value="2.5mm">2.5 mm</option>
                            <option value="3.0mm">3.0 mm</option>
                          </optgroup>
                          <optgroup label="Heavy Gauge (4-6mm)">
                            <option value="4.0mm">4.0 mm</option>
                            <option value="5.0mm">5.0 mm</option>
                            <option value="6.0mm">6.0 mm</option>
                          </optgroup>
                          <optgroup label="Plate (8mm+)">
                            <option value="8.0mm">8.0 mm</option>
                            <option value="10.0mm">10.0 mm</option>
                            <option value="12.0mm">12.0 mm</option>
                            <option value="14.0mm">14.0 mm</option>
                            <option value="16.0mm">16.0 mm</option>
                            <option value="20.0mm">20.0 mm</option>
                            <option value="25.0mm">25.0 mm</option>
                            <option value="30.0mm">30.0 mm</option>
                          </optgroup>
                          <optgroup label="Other">
                            <option value="__custom__">Custom thickness...</option>
                          </optgroup>
                        </select>
                      )}
                      {validationErrors.thickness && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.thickness}</p>
                      )}
                    </div>
                    <Input
                      label="Weight (kg/pc or kg/m)"
                      value={newProduct.weight}
                      onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
                      placeholder="e.g., 25.5"
                    />
                    <div className="sm:col-span-2">
                      <Textarea
                        label="Description"
                        value={newProduct.description}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            description: e.target.value,
                          })
                        }
                        placeholder="Enter product description"
                        rows={1}
                      />
                    </div>
                  </div>
                </div>

                {/* Inventory Information - collapsible (new products start at 0) */}
                <details className={`group rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <summary
                    className={`flex items-center justify-between cursor-pointer p-4 ${isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}`}
                  >
                    <h3 className="text-lg font-medium text-teal-600">Inventory Information</h3>
                    <ChevronDown className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 pt-0">
                    <div>
                      <span
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Current Stock (Auto)
                      </span>
                      <div
                        className={`px-3 py-2 rounded-lg border ${isDarkMode ? "bg-[#263238] border-[#37474F] text-gray-400" : "bg-gray-100 border-gray-200 text-gray-500"}`}
                        title="Stock is managed through GRN approvals and delivery notes"
                      >
                        {editingProductId ? (newProduct.currentStock ?? 0) : 0}
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Updated via GRN / Delivery Notes
                      </p>
                    </div>
                    <Input
                      label="Minimum Stock"
                      type="number"
                      value={newProduct.minStock || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          minStock: e.target.value === "" ? "" : Number(e.target.value) || "",
                        })
                      }
                      placeholder="Enter minimum stock level"
                    />
                    <Input
                      label="Maximum Stock"
                      type="number"
                      value={newProduct.maxStock || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          maxStock: e.target.value === "" ? "" : Number(e.target.value) || "",
                        })
                      }
                      placeholder="Enter maximum stock level"
                    />
                  </div>
                </details>

                {/* Pricing Information */}
                <div>
                  <h3 className="text-lg font-medium text-teal-600 mb-4">Pricing Information</h3>
                  {(() => {
                    const basisUnit = "/pc";
                    const costNum = Number(newProduct.costPrice) || 0;
                    const sellNum = Number(newProduct.sellingPrice) || 0;
                    // Range thresholds per pricing basis (AED) for stainless steel
                    const ranges = {
                      PER_MT: { low: 500, high: 50000, label: "per pc" },
                      PER_KG: { low: 0.5, high: 50, label: "per pc" },
                      PER_PCS: { low: 1, high: 10000, label: "per pc" },
                      PER_METER: { low: 5, high: 5000, label: "per pc" },
                      PER_LOT: { low: 100, high: 500000, label: "per pc" },
                    };
                    const range = ranges[newProduct.pricingBasis] || ranges.PER_MT;
                    const costWarning =
                      costNum > 0 && (costNum < range.low || costNum > range.high)
                        ? `Unusual for ${range.label} (typical: ${range.low.toLocaleString()}–${range.high.toLocaleString()} AED)`
                        : null;
                    const sellWarning =
                      sellNum > 0 && (sellNum < range.low || sellNum > range.high)
                        ? `Unusual for ${range.label} (typical: ${range.low.toLocaleString()}–${range.high.toLocaleString()} AED)`
                        : null;
                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="relative">
                            <div className="flex items-center gap-1">
                              <Input
                                label={`Standard Cost (Ref) ${basisUnit}`}
                                type="number"
                                value={newProduct.costPrice || ""}
                                onChange={(e) =>
                                  setNewProduct({
                                    ...newProduct,
                                    costPrice: e.target.value === "" ? "" : Number(e.target.value) || "",
                                  })
                                }
                                placeholder={`Cost ${range.label}`}
                                className="pl-12"
                              />
                            </div>
                            <span
                              className={`absolute left-3 top-8 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                            >
                              AED
                            </span>
                            {costWarning ? (
                              <p className="text-xs mt-0.5 text-amber-500">{costWarning}</p>
                            ) : (
                              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                For estimation only. Inventory valued from batches.
                              </p>
                            )}
                          </div>
                          <div className="relative">
                            <Input
                              label={`Base Selling Price ${basisUnit} (seeds default pricelist)`}
                              type="number"
                              value={newProduct.sellingPrice || ""}
                              onChange={(e) =>
                                setNewProduct({
                                  ...newProduct,
                                  sellingPrice: e.target.value === "" ? "" : Number(e.target.value) || "",
                                })
                              }
                              placeholder={`Sell price ${range.label}`}
                              className="pl-12"
                            />
                            <span
                              className={`absolute left-3 top-8 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                            >
                              AED
                            </span>
                            {sellWarning ? (
                              <p className="text-xs mt-0.5 text-amber-500">{sellWarning}</p>
                            ) : (
                              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                Seeds default pricelist on create/update.
                              </p>
                            )}
                          </div>
                          <Select
                            label="Pricing Basis"
                            value={newProduct.pricingBasis || "PER_MT"}
                            onChange={(e) =>
                              setNewProduct({
                                ...newProduct,
                                pricingBasis: e.target.value,
                              })
                            }
                            options={(() => {
                              const allOpts = [
                                { value: "PER_MT", label: "Per MT (Metric Ton)" },
                                { value: "PER_KG", label: "Per KG" },
                                { value: "PER_PCS", label: "Per Piece" },
                                { value: "PER_METER", label: "Per Meter" },
                                { value: "PER_LOT", label: "Per Lot" },
                              ];
                              const allowed = getAllowedBases(newProduct.productCategory);
                              return allOpts.filter((o) => allowed.includes(o.value));
                            })()}
                          />
                          {newProduct.productCategory === "SHEET" && (
                            <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                              {PRICING_BASIS_MICROCOPY.SHEET}
                            </p>
                          )}
                        </div>
                        {/* Live Margin Preview */}
                        {newProduct.costPrice && newProduct.sellingPrice && sellNum > 0 && (
                          <div
                            className={`mt-2 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                              ((sellNum - costNum) / sellNum) * 100 < 0
                                ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                                : ((sellNum - costNum) / sellNum) * 100 > 20
                                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                  : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                            }`}
                          >
                            <span className="font-medium">Margin:</span>
                            <span className="font-bold">{(((sellNum - costNum) / sellNum) * 100).toFixed(1)}%</span>
                            <span className="text-xs opacity-75">
                              (AED {(sellNum - costNum).toFixed(2)} {range.label})
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div className="mt-4">
                    <Input
                      label="Weight Tolerance %"
                      type="number"
                      step="0.1"
                      value={newProduct.weightTolerancePercent ?? 2.5}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          weightTolerancePercent: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      placeholder="e.g., 2.5 for sheets"
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      Typical: Sheets ±2.5% | Coils ±2% | Bars ±3% | Pipes ±5%
                    </p>
                  </div>
                </div>

                {/* Supplier & Location - collapsible */}
                <details className={`group rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <summary
                    className={`flex items-center justify-between cursor-pointer p-4 ${isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}`}
                  >
                    <h3 className="text-lg font-medium text-teal-600">Supplier & Location</h3>
                    <ChevronDown className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 pt-0">
                    <Input
                      label="Supplier"
                      value={newProduct.supplier}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          supplier: e.target.value,
                        })
                      }
                      placeholder="Enter supplier name"
                    />
                    <Input
                      label="Storage Location"
                      value={newProduct.location}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          location: e.target.value,
                        })
                      }
                      placeholder="Enter storage location"
                    />
                  </div>
                </details>

                {/* Product Specifications (advanced material properties) */}
                <details className={`group rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <summary
                    className={`flex items-center justify-between cursor-pointer p-4 ${isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}`}
                  >
                    <h3 className="text-lg font-medium text-teal-600">Product Specifications</h3>
                    <ChevronDown className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 pt-0">
                    <Input
                      label="Diameter"
                      value={newProduct.specifications.diameter}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          specifications: {
                            ...newProduct.specifications,
                            diameter: e.target.value,
                          },
                        })
                      }
                      placeholder="Enter diameter"
                    />
                    <Input
                      label="Tensile Strength"
                      value={newProduct.specifications.tensileStrength}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          specifications: {
                            ...newProduct.specifications,
                            tensileStrength: e.target.value,
                          },
                        })
                      }
                      placeholder="Enter tensile strength"
                    />
                    <Input
                      label="Yield Strength"
                      value={newProduct.specifications.yieldStrength}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          specifications: {
                            ...newProduct.specifications,
                            yieldStrength: e.target.value,
                          },
                        })
                      }
                      placeholder="Enter yield strength"
                    />
                    <Input
                      label="Carbon Content"
                      value={newProduct.specifications.carbonContent}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          specifications: {
                            ...newProduct.specifications,
                            carbonContent: e.target.value,
                          },
                        })
                      }
                      placeholder="Enter carbon content"
                    />
                    <Input
                      label="Coating"
                      value={newProduct.specifications.coating}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          specifications: {
                            ...newProduct.specifications,
                            coating: e.target.value,
                          },
                        })
                      }
                      placeholder="Enter coating type"
                    />
                    <div className="sm:col-span-2">
                      <Input
                        label="Standard"
                        value={newProduct.specifications.standard}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            specifications: {
                              ...newProduct.specifications,
                              standard: e.target.value,
                            },
                          })
                        }
                        placeholder="Enter applicable standard"
                      />
                    </div>
                  </div>
                </details>

                {/* Customs & Trade Compliance - collapsible */}
                <details className={`group rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <summary
                    className={`flex items-center justify-between cursor-pointer p-4 ${isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}`}
                  >
                    <h3 className="text-lg font-medium text-teal-600">Customs & Trade Compliance</h3>
                    <ChevronDown className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 pt-0">
                    <Input
                      label="HS Code (Harmonized System)"
                      value={newProduct.hsCode || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, hsCode: e.target.value })}
                      placeholder="e.g., 720299 or 7225403010"
                      error={newProduct.hsCode && !/^\d{6,10}$/.test(newProduct.hsCode) ? "Must be 6-10 digits" : ""}
                    />
                    <Select
                      label="Country of Origin"
                      options={originOptions}
                      value={newProduct.millCountry || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          millCountry: e.target.value,
                        })
                      }
                      placeholder="Select country of origin..."
                    />
                    {/* Origin Status - computed badge */}
                    <div>
                      <span
                        className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
                      >
                        Origin Status
                      </span>
                      {newProduct.millCountry ? (
                        <span
                          className={`inline-block px-3 py-1.5 text-sm font-medium rounded-lg ${
                            newProduct.millCountry === "AE"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {newProduct.millCountry === "AE" ? "LOCAL" : "IMPORTED"}
                        </span>
                      ) : (
                        <span className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                          Select country of origin to determine
                        </span>
                      )}
                    </div>
                    <Input
                      label="Mill Name / Manufacturer"
                      value={newProduct.millName || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          millName: e.target.value,
                        })
                      }
                      placeholder="e.g., Nippon Steel, Tata Steel"
                    />
                    <Select
                      label="Product Category"
                      options={[
                        { value: "COIL", label: "COIL" },
                        { value: "SHEET", label: "SHEET" },
                        { value: "PLATE", label: "PLATE" },
                        { value: "PIPE", label: "PIPE" },
                        { value: "TUBE", label: "TUBE" },
                        { value: "BAR", label: "BAR" },
                        { value: "FLAT", label: "FLAT" },
                      ]}
                      value={newProduct.productCategory || ""}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setNewProduct({
                          ...newProduct,
                          productCategory: cat,
                          pricingBasis: getDefaultBasis(cat),
                        });
                      }}
                      placeholder="Select category..."
                    />
                  </div>
                </details>
              </div>

              {/* Phase 7: Similar Products Sidebar (Optional) */}
              {similarProducts.length > 0 && (
                <div
                  className={`p-6 border-t ${isDarkMode ? "border-gray-700 bg-gray-800/30" : "border-gray-200 bg-gray-50"}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <h3 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Similar Products Found ({similarProducts.length})
                    </h3>
                  </div>
                  <p className={`text-xs mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    These products match your specifications. You might want to review them before adding a new product.
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {similarProducts.map((product, index) => (
                      <div
                        key={`similar-${product.id}-${index}`}
                        className={`p-3 rounded-lg border ${
                          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm font-medium truncate mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              {getProductDisplayName(product) || "N/A"}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {product.grade && (
                                <span
                                  className={`px-2 py-0.5 text-xs rounded ${
                                    isDarkMode ? "bg-teal-900/30 text-teal-300" : "bg-teal-100 text-teal-800"
                                  }`}
                                >
                                  {product.grade}
                                </span>
                              )}
                              {product.finish && (
                                <span
                                  className={`px-2 py-0.5 text-xs rounded ${
                                    isDarkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {product.finish}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 text-xs rounded ${
                                  isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                Stock: {product.currentStock || 0}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowSpecModal(true);
                              }}
                              className={`p-1.5 rounded transition-colors ${
                                isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                              }`}
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyFromProduct(product)}
                              className={`p-1.5 rounded transition-colors ${
                                isDarkMode ? "hover:bg-gray-700 text-teal-400" : "hover:bg-gray-100 text-teal-600"
                              }`}
                              title="Copy Specifications"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div
                className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}
              >
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProductId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingProductId ? handleEditProduct : handleAddProduct}
                  disabled={editingProductId ? updatingProduct : false}
                >
                  {editingProductId && updatingProduct ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {editingProductId ? (updatingProduct ? "Saving..." : "Save Changes") : "Add Product"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Old Edit Product Modal removed - unified with Add Product Modal above */}
        {/* Save Warnings Confirmation Dialog */}
        {saveWarnings && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div
              className={`rounded-xl shadow-2xl max-w-md w-full mx-4 ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}
            >
              <div
                className={`flex items-center gap-3 px-6 py-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Review Before Saving
                  </h3>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Please review the following
                  </p>
                </div>
              </div>
              <div className="px-6 py-4">
                <ul className="space-y-2">
                  {saveWarnings.warnings.map((w, i) => (
                    <li
                      key={w}
                      className={`flex items-start gap-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      <span className="mt-0.5 text-amber-500 font-bold">{i + 1}.</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className={`flex justify-end gap-3 px-6 py-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
              >
                <button
                  type="button"
                  onClick={() => setSaveWarnings(null)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={saveWarnings.onConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700"
                >
                  Save Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Specifications Modal - Zoho-Style Accordion Drawer */}
        {showSpecModal &&
          selectedProduct &&
          (() => {
            // Format grade (clean, no prefix)
            const getFormattedGrade = () => {
              const g = (selectedProduct.grade || "").toString().trim();
              return g ? g.replace(/^(gr|ss)\s*/i, "").toUpperCase() : "";
            };

            // Format finish with "Finish" suffix
            const getFormattedFinish = () => {
              const f = (selectedProduct.finish || "").toString().trim();
              return f ? (/\bfinish$/i.test(f) ? f : `${f} Finish`) : "";
            };

            // Check if sections have data
            const hasDescription = selectedProduct.description?.trim();

            // Calculate margin
            const margin =
              selectedProduct.costPrice > 0 && selectedProduct.sellingPrice > 0
                ? Math.round(
                    ((selectedProduct.sellingPrice - selectedProduct.costPrice) / selectedProduct.costPrice) * 100
                  )
                : null;

            const isPipeOrTube = /pipe|tube/i.test(selectedProduct.category || "");

            // Determine origin status
            const originStatus =
              selectedProduct.origin?.toLowerCase() === "uae" ||
              selectedProduct.origin?.toLowerCase() === "local" ||
              !selectedProduct.origin
                ? "Local"
                : "Imported";
            const isImported = originStatus === "Imported";

            return (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className={`rounded-lg w-full max-w-xl shadow-xl ${isDarkMode ? "bg-[#1e2328]" : "bg-white"}`}>
                  {/* Compact Header */}
                  <div
                    className={`flex items-center justify-between px-4 py-3 border-b ${
                      isDarkMode ? "border-gray-700 bg-[#252b32]" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {getProductDisplayName(selectedProduct) || "Product"}
                      </h2>
                      <div className="flex gap-1.5">
                        {selectedProduct.category && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              isDarkMode ? "bg-teal-500/20 text-teal-300" : "bg-teal-100 text-teal-700"
                            }`}
                          >
                            {categories.find((c) => c.value === selectedProduct.category)?.label ||
                              selectedProduct.category}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            isImported
                              ? isDarkMode
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-amber-100 text-amber-700"
                              : isDarkMode
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {originStatus}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSpecModal(false)}
                      className={`p-1.5 rounded-md transition ${
                        isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-500"
                      }`}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className={`px-4 py-3 ${isDarkMode ? "bg-[#1e2328]" : "bg-white"}`}>
                    {/* Product Identity (SSOT) */}
                    <div
                      className={`text-xs font-mono mb-3 px-2 py-1 rounded ${isDarkMode ? "bg-gray-800 text-teal-400" : "bg-gray-100 text-teal-600"}`}
                    >
                      <span className={`${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>ID: </span>
                      {getProductUniqueName(selectedProduct) || "N/A"}
                    </div>

                    {/* Key Metrics - Compact Row */}
                    <div
                      className={`grid grid-cols-5 gap-2 p-2 rounded-md mb-3 ${
                        isDarkMode ? "bg-[#252b32]" : "bg-gray-100"
                      }`}
                    >
                      <div className="text-center">
                        <div className={`text-xs font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Stock
                        </div>
                        <div className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {selectedProduct.currentStock ?? 0}
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-xs font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          title="Base selling price (seeds default pricelist)"
                        >
                          Base Price
                        </div>
                        <div className={`text-base font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                          {selectedProduct.sellingPrice ? Number(selectedProduct.sellingPrice).toLocaleString() : "—"}
                        </div>
                        {defaultPricelistId && (
                          <button
                            type="button"
                            onClick={() => setShowPricingEditModal(true)}
                            className={`text-[10px] mt-0.5 underline ${isDarkMode ? "text-emerald-400" : "text-emerald-600"} hover:opacity-80`}
                          >
                            Update Pricelist
                          </button>
                        )}
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-xs font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          title="Standard reference cost for estimation"
                        >
                          Std Cost (Ref)
                        </div>
                        <div className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {selectedProduct.costPrice ? Number(selectedProduct.costPrice).toLocaleString() : "—"}
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-xs font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          title="Auto-updated from latest GRN approval"
                        >
                          Last Buy
                        </div>
                        <div className={`text-base font-bold ${isDarkMode ? "text-sky-400" : "text-sky-600"}`}>
                          {selectedProduct.lastPurchaseCost != null && selectedProduct.lastPurchaseCost !== 0
                            ? Number(selectedProduct.lastPurchaseCost).toLocaleString()
                            : "N/A"}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`text-xs font-semibold ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Margin
                        </div>
                        <div
                          className={`text-base font-bold ${
                            margin && margin > 0
                              ? isDarkMode
                                ? "text-emerald-400"
                                : "text-emerald-600"
                              : isDarkMode
                                ? "text-red-400"
                                : "text-red-600"
                          }`}
                        >
                          {margin !== null ? `${margin}%` : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Specifications Table - Compact */}
                    <div
                      className={`text-sm border rounded-md overflow-hidden ${
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <table className="w-full">
                        <tbody>
                          {getFormattedGrade() && (
                            <tr className={isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100"}>
                              <td
                                className={`px-3 py-1.5 font-semibold ${isDarkMode ? "text-gray-300 bg-[#252b32]" : "text-gray-700 bg-gray-100"}`}
                                style={{ width: "40%" }}
                              >
                                Grade
                              </td>
                              <td className={`px-3 py-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {getFormattedGrade()}
                              </td>
                            </tr>
                          )}
                          {getFormattedFinish() && (
                            <tr className={isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100"}>
                              <td
                                className={`px-3 py-1.5 font-semibold ${isDarkMode ? "text-gray-300 bg-[#252b32]" : "text-gray-700 bg-gray-100"}`}
                              >
                                Finish
                              </td>
                              <td className={`px-3 py-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {getFormattedFinish()}
                              </td>
                            </tr>
                          )}
                          {selectedProduct.thickness && (
                            <tr className={isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100"}>
                              <td
                                className={`px-3 py-1.5 font-semibold ${isDarkMode ? "text-gray-300 bg-[#252b32]" : "text-gray-700 bg-gray-100"}`}
                              >
                                Thickness
                              </td>
                              <td className={`px-3 py-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {selectedProduct.thickness}
                              </td>
                            </tr>
                          )}
                          {selectedProduct.width && (
                            <tr className={isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100"}>
                              <td
                                className={`px-3 py-1.5 font-semibold ${isDarkMode ? "text-gray-300 bg-[#252b32]" : "text-gray-700 bg-gray-100"}`}
                              >
                                Width
                              </td>
                              <td className={`px-3 py-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {selectedProduct.width}
                              </td>
                            </tr>
                          )}
                          {selectedProduct.length && (
                            <tr className={isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100"}>
                              <td
                                className={`px-3 py-1.5 font-semibold ${isDarkMode ? "text-gray-300 bg-[#252b32]" : "text-gray-700 bg-gray-100"}`}
                              >
                                Length
                              </td>
                              <td className={`px-3 py-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {selectedProduct.length}
                              </td>
                            </tr>
                          )}
                          {isPipeOrTube && selectedProduct.od && (
                            <tr className={isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100"}>
                              <td
                                className={`px-3 py-1.5 font-semibold ${isDarkMode ? "text-gray-300 bg-[#252b32]" : "text-gray-700 bg-gray-100"}`}
                              >
                                OD
                              </td>
                              <td className={`px-3 py-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {selectedProduct.od}
                              </td>
                            </tr>
                          )}
                          {isPipeOrTube && selectedProduct.sizeInch && (
                            <tr className={isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100"}>
                              <td
                                className={`px-3 py-1.5 font-semibold ${isDarkMode ? "text-gray-300 bg-[#252b32]" : "text-gray-700 bg-gray-100"}`}
                              >
                                Size (Inch)
                              </td>
                              <td className={`px-3 py-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {selectedProduct.sizeInch}&quot;
                              </td>
                            </tr>
                          )}
                          {selectedProduct.weight && (
                            <tr className={isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100"}>
                              <td
                                className={`px-3 py-1.5 font-semibold ${isDarkMode ? "text-gray-300 bg-[#252b32]" : "text-gray-700 bg-gray-100"}`}
                              >
                                Weight
                              </td>
                              <td className={`px-3 py-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {selectedProduct.weight} kg
                              </td>
                            </tr>
                          )}
                          <tr className={isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100"}>
                            <td
                              className={`px-3 py-1.5 font-semibold ${isDarkMode ? "text-gray-300 bg-[#252b32]" : "text-gray-700 bg-gray-100"}`}
                            >
                              Min / Max Stock
                            </td>
                            <td className={`px-3 py-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {selectedProduct.minStock ?? 0} / {selectedProduct.maxStock ?? 0}
                            </td>
                          </tr>
                          {selectedProduct.location && (
                            <tr className={isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100"}>
                              <td
                                className={`px-3 py-1.5 font-semibold ${isDarkMode ? "text-gray-300 bg-[#252b32]" : "text-gray-700 bg-gray-100"}`}
                              >
                                Location
                              </td>
                              <td className={`px-3 py-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {selectedProduct.location}
                              </td>
                            </tr>
                          )}
                          {selectedProduct.supplier && (
                            <tr className={isDarkMode ? "" : ""}>
                              <td
                                className={`px-3 py-1.5 font-semibold ${isDarkMode ? "text-gray-300 bg-[#252b32]" : "text-gray-700 bg-gray-100"}`}
                              >
                                Supplier
                              </td>
                              <td className={`px-3 py-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {selectedProduct.supplier}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Description if exists */}
                    {hasDescription && (
                      <div
                        className={`mt-3 p-2.5 rounded-md text-sm ${
                          isDarkMode ? "bg-[#252b32] text-gray-200" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedProduct.description}
                      </div>
                    )}
                  </div>

                  {/* Compact Footer */}
                  <div
                    className={`px-4 py-2 border-t flex justify-end ${
                      isDarkMode ? "border-gray-700 bg-[#252b32]" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Button onClick={() => setShowSpecModal(false)} variant="secondary" size="sm">
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Copy from Existing Modal */}
        {showCopyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div
              className={`rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden ${
                isDarkMode ? "bg-[#1E2328]" : "bg-white"
              }`}
            >
              {/* Modal Header */}
              <div
                className={`flex justify-between items-center p-4 border-b ${
                  isDarkMode ? "border-[#37474F]" : "border-gray-200"
                }`}
              >
                <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Copy from Existing Product
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowCopyModal(false);
                    setCopySearchTerm("");
                  }}
                  className={`p-2 rounded transition-colors ${
                    isDarkMode ? "text-gray-400 hover:text-gray-300" : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={copySearchTerm}
                    onChange={(e) => setCopySearchTerm(e.target.value)}
                    placeholder="Search by name, grade, category..."
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                    }`}
                  />
                </div>
              </div>

              {/* Product List */}
              <div className="p-4 overflow-y-auto max-h-96">
                {products
                  .filter((p) => {
                    const term = copySearchTerm.toLowerCase();
                    return (
                      getProductDisplayName(p).toLowerCase().includes(term) ||
                      getProductUniqueName(p).toLowerCase().includes(term) ||
                      (p.grade || "").toLowerCase().includes(term) ||
                      (p.category || "").toLowerCase().includes(term)
                    );
                  })
                  .map((product, index) => (
                    <div
                      key={`copy-${product.id}-${index}`}
                      className={`p-3 rounded-lg mb-2 border transition-colors ${
                        isDarkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {getProductDisplayName(product)}
                          </h4>
                          <p className={`text-xs font-mono ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                            {getProductUniqueName(product)}
                          </p>
                          <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {product.grade} • {product.category} • {product.finish}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewProduct({
                              ...newProduct,
                              category: product.category || "",
                              commodity: product.commodity || "SS",
                              grade: product.grade || "",
                              finish: product.finish || "",
                              millCountry: product.millCountry || product.mill_country || product.origin || "",
                              thickness: product.thickness || "",
                              width: product.width || "",
                              length: product.length || "",
                              size: product.size || "",
                              sizeInch: product.sizeInch || product.size_inch || "",
                              od: product.od || "",
                              schedule: product.schedule || "",
                              description: product.description || "",
                              weight: product.weight || "",
                            });
                            setShowCopyModal(false);
                            setCopySearchTerm("");
                            notificationService.success("Product attributes copied! Adjust stock and pricing.");
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isDarkMode
                              ? "bg-teal-700 hover:bg-teal-600 text-white"
                              : "bg-teal-100 hover:bg-teal-200 text-teal-700"
                          }`}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Product Upload Modal */}
        <ProductUpload
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={() => {
            refetchProducts();
            setShowUploadModal(false);
          }}
        />

        <ConfirmDialog
          open={dialogState.open}
          title={dialogState.title}
          message={dialogState.message}
          variant={dialogState.variant}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />

        {/* Phase 5: Copy from Existing Product Modal */}
        {showCopyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div
              className={`rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col ${
                isDarkMode ? "bg-[#1E2328]" : "bg-white"
              }`}
            >
              {/* Modal Header */}
              <div
                className={`flex justify-between items-center p-6 border-b ${
                  isDarkMode ? "border-[#37474F]" : "border-gray-200"
                }`}
              >
                <div>
                  <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Copy from Existing Product
                  </h2>
                  <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Select a product to copy its specifications (stock and pricing will not be copied)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCopyModal(false)}
                  className={`p-2 rounded transition-colors bg-transparent ${
                    isDarkMode ? "text-gray-400 hover:text-gray-300" : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b" style={{ borderColor: isDarkMode ? "#37474F" : "#E5E7EB" }}>
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  />
                  <input
                    type="text"
                    placeholder="Search products by name, grade, or category..."
                    value={copySearchTerm}
                    onChange={(e) => setCopySearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
              </div>

              {/* Product List */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {products
                    .filter((p) => {
                      if (!copySearchTerm) return true;
                      const search = copySearchTerm.toLowerCase();
                      return (
                        getProductDisplayName(p).toLowerCase().includes(search) ||
                        getProductUniqueName(p).toLowerCase().includes(search) ||
                        (p.grade || "").toLowerCase().includes(search) ||
                        (p.category || "").toLowerCase().includes(search) ||
                        (p.finish || "").toLowerCase().includes(search)
                      );
                    })
                    .map((product, index) => (
                      <button
                        type="button"
                        key={`select-${product.id}-${index}`}
                        onClick={() => handleCopyFromProduct(product)}
                        className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-lg ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-700 hover:border-teal-500"
                            : "bg-white border-gray-200 hover:border-teal-500"
                        }`}
                      >
                        <div className={`font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {getProductDisplayName(product)}
                        </div>
                        <div className={`text-xs font-mono mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                          {getProductUniqueName(product)}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`px-2 py-1 text-xs rounded border ${
                              isDarkMode
                                ? "bg-teal-900/30 text-teal-300 border-teal-700"
                                : "bg-teal-100 text-teal-800 border-teal-300"
                            }`}
                          >
                            {product.grade}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded border ${
                              isDarkMode
                                ? "bg-blue-900/30 text-blue-300 border-blue-700"
                                : "bg-blue-100 text-blue-800 border-blue-300"
                            }`}
                          >
                            {product.category}
                          </span>
                          {product.finish && (
                            <span
                              className={`px-2 py-1 text-xs rounded border ${
                                isDarkMode
                                  ? "bg-indigo-900/30 text-indigo-300 border-indigo-700"
                                  : "bg-indigo-100 text-indigo-800 border-indigo-300"
                              }`}
                            >
                              {product.finish}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Quick Price Edit Modal */}
        {showPricingEditModal && selectedProduct && defaultPricelistId && (
          <QuickPriceEditModal
            isOpen={showPricingEditModal}
            onClose={() => setShowPricingEditModal(false)}
            productId={selectedProduct.id}
            productName={selectedProduct.displayName || selectedProduct.name || "Product"}
            currentPrice={selectedProduct.sellingPrice || selectedProduct.selling_price}
            defaultPricelistId={defaultPricelistId}
            onPriceSaved={(newPrice) => {
              setSelectedProduct({
                ...selectedProduct,
                sellingPrice: newPrice,
                selling_price: newPrice,
              });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SteelProducts;
