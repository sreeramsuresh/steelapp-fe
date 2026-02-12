import { ArrowLeft, BookOpen } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import invoiceCorrectionConfig from "../components/finance/invoiceCorrectionConfig";
import journalEntryCorrectionConfig from "../components/finance/journalEntryCorrectionConfig";
import paymentCorrectionConfig from "../components/finance/paymentCorrectionConfig";
import priceListCorrectionConfig from "../components/finance/priceListCorrectionConfig";
import stockMovementCorrectionConfig from "../components/finance/stockMovementCorrectionConfig";
import supplierBillCorrectionConfig from "../components/finance/supplierBillCorrectionConfig";
import vatPeriodCorrectionConfig from "../components/finance/vatPeriodCorrectionConfig";
import { DocumentWorkflowGuide as Guide } from "../components/posted-document-framework";
import { useTheme } from "../contexts/ThemeContext";

// Registry: all module correction configs
const MODULE_CONFIGS = {
  invoice: invoiceCorrectionConfig,
  supplier_bill: supplierBillCorrectionConfig,
  journal_entry: journalEntryCorrectionConfig,
  payment: paymentCorrectionConfig,
  stock: stockMovementCorrectionConfig,
  vat_period: vatPeriodCorrectionConfig,
  price_list: priceListCorrectionConfig,
};

const DocumentWorkflowGuidePage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const module = searchParams.get("module") || "invoice";
  const config = MODULE_CONFIGS[module] || MODULE_CONFIGS.invoice;

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <div
        className={`sticky top-0 z-10 backdrop-blur-md border-b ${
          isDarkMode ? "bg-gray-900/92 border-gray-700" : "bg-white/92 border-gray-200"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-amber-500/10" : "bg-amber-50"}`}>
                <BookOpen className={`h-5 w-5 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`} />
              </div>
              <div>
                <h1 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Correction Guide</h1>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  How to correct posted documents
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Guide mode="guide" config={config} onNavigate={(url) => navigate(url)} />
      </div>
    </div>
  );
};

export default DocumentWorkflowGuidePage;
