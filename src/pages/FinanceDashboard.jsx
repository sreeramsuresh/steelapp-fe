import { Banknote, BookOpen, ClipboardCheck, DollarSign, FileText, RotateCcw, ShieldCheck } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import AccountStatementList from "./AccountStatementList";
import CommissionApprovalWorkflow from "./CommissionApprovalWorkflow";
import CreditNoteList from "./CreditNoteList";
import CustomerCreditManagement from "./CustomerCreditManagement";

const DocumentWorkflowGuideTab = lazy(() => import("./DocumentWorkflowGuide"));

const LazyJournalCorrectionGuide = lazy(() =>
	Promise.all([
		import("../components/posted-document-framework/DocumentWorkflowGuide"),
		import("../components/finance/journalEntryCorrectionConfig"),
	]).then(([guideModule, configModule]) => ({
		default: (props) => <guideModule.default {...props} config={configModule.default} mode="guide" />,
	})),
);

const FinanceDashboard = () => {
  const { isDarkMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize activeTab from URL parameter
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      [
        "credit-notes",
        "statements",
        "commission-approvals",
        "credit-management",
        "document-workflow",
        "journal-correction-guide",
      ].includes(tabParam)
    ) {
      return tabParam;
    }
    return "credit-notes";
  });

  // Update tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      [
        "credit-notes",
        "statements",
        "commission-approvals",
        "credit-management",
        "document-workflow",
        "journal-correction-guide",
      ].includes(tabParam)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const tabs = [
    {
      id: "credit-notes",
      label: "Credit Notes",
      icon: RotateCcw,
      component: CreditNoteList,
    },
    {
      id: "statements",
      label: "Account Statements",
      icon: FileText,
      component: AccountStatementList,
    },
    {
      id: "commission-approvals",
      label: "Commission Approvals",
      icon: DollarSign,
      component: CommissionApprovalWorkflow,
    },
    {
      id: "credit-management",
      label: "Credit Management",
      icon: ShieldCheck,
      component: CustomerCreditManagement,
    },
    {
      id: "document-workflow",
      label: "Correction Guide",
      icon: BookOpen,
      component: DocumentWorkflowGuideTab,
    },
    {
      id: "journal-correction-guide",
      label: "Journal Reversal Guide",
      icon: ClipboardCheck,
      component: LazyJournalCorrectionGuide,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <div
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} border-b ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <Banknote className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                💵 Finance Dashboard
              </h1>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Credit notes, statements, commission approvals, and credit management
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchParams({ tab: tab.id }, { replace: true });
                  }}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg border-b-2 transition-colors ${
                    isActive
                      ? `border-green-600 ${isDarkMode ? "bg-gray-700 text-green-400" : "bg-gray-50 text-green-600"}`
                      : `border-transparent ${isDarkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full" />
            </div>
          }
        >
          {ActiveComponent && (
            <ActiveComponent
              preSelectedCustomerId={searchParams.get("customerId")}
              preSelectedCustomerName={searchParams.get("customerName")}
              preSelectedInvoiceId={searchParams.get("invoiceId")}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default FinanceDashboard;
