import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

// Layout Components
import { CoreERPLayout } from "../layouts";

const AnalyticsLayout = lazy(() => import("../layouts/AnalyticsLayout"));

// Loading Screen for Analytics
import AnalyticsLoadingScreen from "./AnalyticsLoadingScreen";
// Error Boundary
import ErrorBoundary from "./ErrorBoundary";
// Legacy Redirect Component
import LegacyRedirect from "./LegacyRedirect";

// Loading Fallbacks
import { InvoiceFormLoadingFallback } from "./LoadingFallback";

// Lazy loaded components
const CustomerDetail = lazy(() => import("../pages/CustomerDetail"));

// Core Components (converted to lazy loading)
const Dashboard = lazy(() => import("./DashboardV2"));
const HomePage = lazy(() => import("../pages/HomePage"));
const InvoiceForm = lazy(() => import("../pages/InvoiceForm"));
const InvoiceAllocationConfirmation = lazy(() => import("./InvoiceAllocationConfirmation"));
const InvoiceList = lazy(() => import("../pages/InvoiceList"));
const CustomerManagement = lazy(() => import("./CustomerManagement"));
const CustomerForm = lazy(() => import("../pages/CustomerForm"));
const SteelProducts = lazy(() => import("./SteelProducts"));
const CompanySettings = lazy(() => import("./CompanySettings"));
const SearchResults = lazy(() => import("./SearchResults"));
const InventoryList = lazy(() => import("../pages/inventory/StockLevelsDashboard"));
const DeliveryNoteList = lazy(() => import("../pages/DeliveryNoteList"));
const DeliveryNoteForm = lazy(() => import("../pages/DeliveryNoteForm"));
const DeliveryNoteDetails = lazy(() => import("../pages/DeliveryNoteDetails"));
const PurchaseOrderForm = lazy(() => import("../pages/PurchaseOrderForm"));
const Login = lazy(() => import("./Login"));
const ForgotPassword = lazy(() => import("./ForgotPassword"));
const ResetPassword = lazy(() => import("./ResetPassword"));
const AcceptInvite = lazy(() => import("./AcceptInvite"));
const MarketingHome = lazy(() => import("../marketing/MarketingHome"));
const MarketingProducts = lazy(() => import("../marketing/MarketingProducts"));
const MarketingAbout = lazy(() => import("../marketing/MarketingAbout"));
const MarketingContact = lazy(() => import("../marketing/MarketingContact"));
const AccountStatementList = lazy(() => import("../pages/AccountStatementList"));
const AccountStatementForm = lazy(() => import("../pages/AccountStatementForm"));
const AccountStatementDetails = lazy(() => import("../pages/AccountStatementDetails"));
const QuotationList = lazy(() => import("../pages/QuotationList"));
const QuotationForm = lazy(() => import("../pages/QuotationForm"));
const CreditNoteList = lazy(() => import("../pages/CreditNoteList"));
const CreditNoteForm = lazy(() => import("../pages/CreditNoteForm"));
const CustomerPerspective = lazy(() => import("../pages/CustomerPerspective"));
const ProtectedRoute = lazy(() => import("./ProtectedRoute"));

// Import/Export Components
const ImportExportDashboard = lazy(() => import("../pages/ImportExportDashboard"));
const ImportOrderForm = lazy(() => import("../pages/ImportOrderForm"));
const ImportOrderDetails = lazy(() => import("../pages/ImportOrderDetails"));
const ExportOrderForm = lazy(() => import("../pages/ExportOrderForm"));
const ExportOrderDetails = lazy(() => import("../pages/ExportOrderDetails"));
const TransitList = lazy(() => import("../pages/TransitList"));

// Container Management Components
const ContainerList = lazy(() => import("../pages/containers").then((m) => ({ default: m.ContainerList })));
const ContainerForm = lazy(() => import("../pages/containers").then((m) => ({ default: m.ContainerForm })));

// Finance Components
const FinanceDashboard = lazy(() => import("../pages/FinanceDashboard"));
const Receivables = lazy(() => import("../pages/Receivables"));
const Payables = lazy(() => import("../pages/Payables"));
const OperatingExpenses = lazy(() => import("../pages/OperatingExpenses"));

// Purchases Dashboard
const PurchasesDashboard = lazy(() => import("../pages/PurchasesDashboard"));

// PO Workspace
const POWorkspaceShell = lazy(() => import("./purchase-order/workspace/POWorkspaceShell"));
const POTypeSelection = lazy(() => import("../pages/purchases/POTypeSelection"));
const POOverview = lazy(() => import("../pages/purchases/workspace/POOverview"));
const PODispatchConfirm = lazy(() => import("../pages/purchases/workspace/PODispatchConfirm"));
const POReceiveReturn = lazy(() => import("../pages/purchases/workspace/POReceiveReturn"));
const POGRNList = lazy(() => import("../pages/purchases/workspace/POGRNList"));
const POGRNDetail = lazy(() => import("../pages/purchases/workspace/POGRNDetail"));
const POBillsList = lazy(() => import("../pages/purchases/workspace/POBillsList"));
const POBillDetail = lazy(() => import("../pages/purchases/workspace/POBillDetail"));
const POPaymentsList = lazy(() => import("../pages/purchases/workspace/POPaymentsList"));
const POPaymentDetail = lazy(() => import("../pages/purchases/workspace/POPaymentDetail"));

// Document Workflow Guide
const DocumentWorkflowGuide = lazy(() => import("../pages/DocumentWorkflowGuide"));

// Admin Components
const AuditLogs = lazy(() => import("../pages/AuditLogs"));

// Stock Movement Components
const StockMovementPage = lazy(() => import("../pages/StockMovementPage"));

// Warehouse Components
const WarehouseList = lazy(() => import("../pages/warehouses/WarehouseList"));
const WarehouseDetail = lazy(() => import("../pages/warehouses/WarehouseDetail"));
const WarehouseLocations = lazy(() => import("../pages/WarehouseLocations"));

// Batch Analytics
const BatchAnalyticsPage = lazy(() => import("../pages/BatchAnalyticsPage"));

// User Profile
const UserProfile = lazy(() => import("../pages/UserProfile"));

// Reports Components
const ReportsDashboard = lazy(() => import("../pages/ReportsDashboard"));
const ProfitAnalysisReport = lazy(() => import("../pages/ProfitAnalysisReport"));
const PriceHistoryReport = lazy(() => import("../pages/PriceHistoryReport"));
const StockMovementReport = lazy(() => import("../pages/StockMovementReport"));
const VATReturnReport = lazy(() => import("./VATReturnReport"));

// Financial Reports
const BankLedgerReport = lazy(() => import("../pages/reports/BankLedgerReport"));
const BankReconciliationStatement = lazy(() => import("../pages/reports/BankReconciliationStatement"));
const CashBookReport = lazy(() => import("../pages/reports/CashBookReport"));
const JournalRegisterReport = lazy(() => import("../pages/reports/JournalRegisterReport"));
const TrialBalanceReport = lazy(() => import("../pages/reports/TrialBalanceReport"));
const COGSAnalysisReport = lazy(() => import("../pages/reports/COGSAnalysisReport"));
const ReconciliationReport = lazy(() => import("../pages/reports/ReconciliationReport"));

// Feedback Management
const FeedbackManagement = lazy(() => import("../pages/FeedbackManagement"));

// Admin Components - Roles & Permissions
const RolesPage = lazy(() => import("../pages/RolesPage"));
const PermissionsMatrix = lazy(() => import("../pages/PermissionsMatrix"));
const UserManagementPage = lazy(() => import("../pages/UserManagementPage"));

// Phase 3: Pricing Components
const BasePricesPage = lazy(() => import("../pages/BasePricesPage"));
const CustomerPricingPage = lazy(() => import("../pages/CustomerPricingPage"));

// Audit Hub Components
const AuditHubDashboard = lazy(() =>
  import("../pages/AuditHub/AuditHubDashboard").then((m) => ({
    default: m.default,
  }))
);
const DatasetExplorer = lazy(() =>
  import("../pages/AuditHub/DatasetExplorer").then((m) => ({
    default: m.default,
  }))
);
const SignOffWorkflow = lazy(() =>
  import("../pages/AuditHub/SignOffWorkflow").then((m) => ({
    default: m.default,
  }))
);

// Purchases Components
const SupplierBillList = lazy(() => import("../pages/purchases").then((m) => ({ default: m.SupplierBillList })));
const SupplierBillForm = lazy(() => import("../pages/purchases").then((m) => ({ default: m.SupplierBillForm })));
const DebitNoteList = lazy(() => import("../pages/purchases").then((m) => ({ default: m.DebitNoteList })));
const DebitNoteForm = lazy(() => import("../pages/purchases").then((m) => ({ default: m.DebitNoteForm })));

// Payments Components
const AdvancePaymentList = lazy(() => import("../pages/payments").then((m) => ({ default: m.AdvancePaymentList })));
const AdvancePaymentForm = lazy(() => import("../pages/payments").then((m) => ({ default: m.AdvancePaymentForm })));

// Price List Components
const PriceListList = lazy(() => import("../pages/PriceListList"));
const PriceListForm = lazy(() => import("../pages/PriceListForm"));

// Commission Components
const AgentCommissionDashboard = lazy(() => import("../pages/AgentCommissionDashboard"));
// Phase 4 & 5 Dashboard Components
const DeliveryVarianceDashboard = lazy(() => import("../pages/DeliveryVarianceDashboard"));
const SupplierPerformanceDashboard = lazy(() => import("../pages/SupplierPerformanceDashboard"));
const ARAgingReport = lazy(() => import("../pages/ARAgingReport"));

// Masters Components
const CountriesList = lazy(() => import("../pages/CountriesList"));
const ExchangeRateList = lazy(() => import("../pages/ExchangeRateList"));

// Supplier Components (Phase 4 Procurement)
const SupplierList = lazy(() => import("../pages/SupplierList").then((m) => ({ default: m.SupplierList })));
const SupplierForm = lazy(() => import("../pages/SupplierForm").then((m) => ({ default: m.SupplierForm })));

// Supplier Quotation Components (PDF Upload Module)
const SupplierQuotationList = lazy(() =>
  import("../pages/SupplierQuotationList").then((m) => ({
    default: m.SupplierQuotationList,
  }))
);
const SupplierQuotationForm = lazy(() =>
  import("../pages/SupplierQuotationForm").then((m) => ({
    default: m.SupplierQuotationForm,
  }))
);
const SupplierQuotationDetail = lazy(() =>
  import("../pages/SupplierQuotationDetail").then((m) => ({
    default: m.SupplierQuotationDetail,
  }))
);
const SupplierQuotationUpload = lazy(() =>
  import("../pages/SupplierQuotationUpload").then((m) => ({
    default: m.SupplierQuotationUpload,
  }))
);

// AnalyticsDashboard removed - /analytics now redirects to /analytics/dashboard

const AppRouter = ({ user, handleSaveInvoice, onLoginSuccess }) => {
  const location = useLocation();
  const { isDarkMode } = useTheme();

  // Allow public marketing pages and login without auth
  const isMarketing = location.pathname === "/" || location.pathname.startsWith("/marketing");
  const isLoginPage = location.pathname === "/login";
  const isPublicAuthPage =
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/accept-invite";
  const isAppRoute = location.pathname.startsWith("/app") || location.pathname.startsWith("/analytics");

  // Check if we need to redirect to login
  const needsAuth = !user && !isLoginPage && !isMarketing && !isPublicAuthPage;

  // If user is logged in and on login page, redirect to app
  // Skip redirect if ?rbac is in the URL (allows RBAC test panel usage)
  const hasRbacParam = location.search.includes("rbac");
  const needsAppRedirect = user && isLoginPage && !hasRbacParam;

  if (needsAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (needsAppRedirect) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div
      className={`w-full ${isMarketing || isAppRoute ? "" : "p-2 sm:p-1 min-h-[calc(100vh-64px)]"} ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        }
      >
        <Routes>
          {/* ========================================== */}
          {/* PUBLIC ROUTES (No Auth Required)          */}
          {/* ========================================== */}

          {/* Root - redirect to app or login */}
          <Route path="/" element={<Navigate to={user ? "/app" : "/login"} replace />} />

          {/* Marketing Pages */}
          <Route path="/marketing" element={<MarketingHome />} />
          <Route path="/marketing/products" element={<MarketingProducts />} />
          <Route path="/marketing/about" element={<MarketingAbout />} />
          <Route path="/marketing/contact" element={<MarketingContact />} />

          {/* Login */}
          <Route path="/login" element={<Login onLoginSuccess={onLoginSuccess} />} />

          {/* Password Reset */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Accept Invitation */}
          <Route path="/accept-invite" element={<AcceptInvite />} />

          {/* ========================================== */}
          {/* LEGACY REDIRECTS (Old URLs → New URLs)    */}
          {/* ========================================== */}

          {/* Dashboard → Analytics */}
          <Route path="/dashboard" element={<LegacyRedirect />} />

          {/* Sales */}
          <Route path="/quotations/*" element={<LegacyRedirect />} />
          <Route path="/invoices/*" element={<LegacyRedirect />} />
          <Route path="/delivery-notes/*" element={<LegacyRedirect />} />
          <Route path="/credit-notes/*" element={<LegacyRedirect />} />

          {/* Purchases */}
          <Route path="/purchases/*" element={<LegacyRedirect />} />
          <Route path="/purchase-orders/*" element={<LegacyRedirect />} />

          {/* Finance */}
          <Route path="/operating-expenses" element={<LegacyRedirect />} />
          <Route path="/finance" element={<LegacyRedirect />} />
          <Route path="/dashboards/*" element={<LegacyRedirect />} />
          <Route path="/account-statements/*" element={<LegacyRedirect />} />

          {/* Inventory */}
          <Route path="/warehouses/*" element={<LegacyRedirect />} />
          <Route path="/inventory" element={<LegacyRedirect />} />
          <Route path="/stock-movements" element={<LegacyRedirect />} />
          <Route path="/batch-analytics" element={<LegacyRedirect />} />

          {/* Trade */}
          <Route path="/import-export" element={<LegacyRedirect />} />
          <Route path="/containers/*" element={<LegacyRedirect />} />
          <Route path="/import-orders/*" element={<LegacyRedirect />} />
          <Route path="/export-orders/*" element={<LegacyRedirect />} />
          <Route path="/transit" element={<LegacyRedirect />} />

          {/* Masters */}
          <Route path="/customers/*" element={<LegacyRedirect />} />
          <Route path="/products" element={<LegacyRedirect />} />
          <Route path="/pricelists/*" element={<LegacyRedirect />} />
          <Route path="/suppliers/*" element={<LegacyRedirect />} />

          {/* Settings */}
          <Route path="/settings" element={<LegacyRedirect />} />
          <Route path="/roles" element={<LegacyRedirect />} />
          <Route path="/audit-logs" element={<LegacyRedirect />} />

          {/* Reports */}
          <Route path="/reports/*" element={<LegacyRedirect />} />

          {/* ========================================== */}
          {/* CORE ERP ROUTES (/app/*)                  */}
          {/* Operational workflows - DO something      */}
          {/* ========================================== */}

          <Route path="/app" element={<CoreERPLayout />}>
            {/* Home Page - Default landing */}
            <Route index element={<HomePage />} />
            <Route
              path="home"
              element={
                <ProtectedRoute user={user}>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            {/* Search */}
            <Route
              path="search"
              element={
                <ProtectedRoute user={user}>
                  <SearchResults />
                </ProtectedRoute>
              }
            />

            {/* ===== SALES ===== */}
            <Route
              path="quotations"
              element={
                <ProtectedRoute user={user} requiredPermission="quotations.read">
                  <QuotationList />
                </ProtectedRoute>
              }
            />
            <Route
              path="quotations/new"
              element={
                <ProtectedRoute user={user} requiredPermission="quotations.create">
                  <QuotationForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="quotations/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="quotations.read">
                  <QuotationForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="quotations/:id/edit"
              element={
                <ProtectedRoute user={user} requiredPermission="quotations.update">
                  <QuotationForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="invoices"
              element={
                <ErrorBoundary>
                  <ProtectedRoute user={user} requiredPermission="invoices.read">
                    <InvoiceList />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="invoices/new"
              element={
                <ErrorBoundary>
                  <ProtectedRoute user={user} requiredPermission="invoices.create">
                    <Suspense fallback={<InvoiceFormLoadingFallback />}>
                      <InvoiceForm onSave={handleSaveInvoice} />
                    </Suspense>
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="invoices/:id"
              element={
                <ErrorBoundary>
                  <ProtectedRoute user={user} requiredPermission="invoices.read">
                    <Suspense fallback={<InvoiceFormLoadingFallback />}>
                      <InvoiceForm onSave={handleSaveInvoice} />
                    </Suspense>
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="invoices/:invoiceId/confirm-allocation"
              element={
                <ErrorBoundary>
                  <ProtectedRoute user={user} requiredPermission="invoices.read">
                    <InvoiceAllocationConfirmation />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />

            <Route
              path="delivery-notes"
              element={
                <ProtectedRoute user={user} requiredPermission="delivery_notes.read">
                  <DeliveryNoteList />
                </ProtectedRoute>
              }
            />
            <Route
              path="delivery-notes/new"
              element={
                <ProtectedRoute user={user} requiredPermission="delivery_notes.create">
                  <DeliveryNoteForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="delivery-notes/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="delivery_notes.read">
                  <DeliveryNoteDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="delivery-notes/:id/edit"
              element={
                <ProtectedRoute user={user} requiredPermission="delivery_notes.update">
                  <DeliveryNoteForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="credit-notes"
              element={
                <ProtectedRoute user={user} requiredPermission="invoices.read">
                  <CreditNoteList />
                </ProtectedRoute>
              }
            />
            <Route
              path="credit-notes/new"
              element={
                <ProtectedRoute user={user} requiredPermission="invoices.create">
                  <CreditNoteForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="credit-notes/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="invoices.read">
                  <CreditNoteForm />
                </ProtectedRoute>
              }
            />

            {/* ===== PURCHASES ===== */}
            <Route
              path="purchases"
              element={
                <ProtectedRoute user={user} requiredPermission="purchase_orders.read">
                  <PurchasesDashboard />
                </ProtectedRoute>
              }
            />
            {/* PO Workspace — nested routes */}
            <Route
              path="purchases/po/:poId"
              element={
                <ProtectedRoute user={user} requiredPermission="purchase_orders.read">
                  <POWorkspaceShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<POOverview />} />
              <Route path="dispatch" element={<PODispatchConfirm />} />
              <Route path="receive" element={<POReceiveReturn />} />
              <Route path="grn" element={<POGRNList />} />
              <Route path="grn/:grnId" element={<POGRNDetail />} />
              <Route path="bills" element={<POBillsList />} />
              <Route path="bills/:billId" element={<POBillDetail />} />
              <Route path="payments" element={<POPaymentsList />} />
              <Route path="payments/:paymentId" element={<POPaymentDetail />} />
            </Route>

            {/* PO type selection — shown before the creation form */}
            <Route
              path="purchases/po/new"
              element={
                <ProtectedRoute user={user} requiredPermission="purchase_orders.create">
                  <POTypeSelection />
                </ProtectedRoute>
              }
            />
            {/* Redirect bare /app/purchase-orders list route → new purchases dashboard */}
            <Route path="purchase-orders" element={<Navigate to="/app/purchases" replace />} />

            <Route
              path="purchase-orders/new"
              element={
                <ProtectedRoute user={user} requiredPermission="purchase_orders.create">
                  <PurchaseOrderForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="purchase-orders/:id/edit"
              element={
                <ProtectedRoute user={user} requiredPermission="purchase_orders.update">
                  <PurchaseOrderForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="supplier-bills"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.read">
                  <SupplierBillList />
                </ProtectedRoute>
              }
            />
            <Route
              path="supplier-bills/new"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.create">
                  <SupplierBillForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="supplier-bills/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.read">
                  <SupplierBillForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="supplier-bills/:id/edit"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.update">
                  <SupplierBillForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="debit-notes"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.read">
                  <DebitNoteList />
                </ProtectedRoute>
              }
            />
            <Route
              path="debit-notes/new"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.create">
                  <DebitNoteForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="debit-notes/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.read">
                  <DebitNoteForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="debit-notes/:id/edit"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.update">
                  <DebitNoteForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="advance-payments"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.read">
                  <AdvancePaymentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="advance-payments/new"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.create">
                  <AdvancePaymentForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="advance-payments/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.read">
                  <AdvancePaymentForm />
                </ProtectedRoute>
              }
            />

            {/* ===== FINANCE (Operational) ===== */}
            <Route
              path="finance"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.read">
                  <FinanceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="finance/document-workflow"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.read">
                  <DocumentWorkflowGuide />
                </ProtectedRoute>
              }
            />
            <Route
              path="receivables"
              element={
                <ProtectedRoute user={user} requiredPermission="receivables.read">
                  <Receivables />
                </ProtectedRoute>
              }
            />
            <Route
              path="payables"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.read">
                  <Payables />
                </ProtectedRoute>
              }
            />
            <Route
              path="operating-expenses"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.read">
                  <OperatingExpenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-commissions"
              element={
                <ProtectedRoute user={user}>
                  <AgentCommissionDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="customer-perspective/:customerId"
              element={
                <ProtectedRoute user={user} requiredPermission="payables.read">
                  <CustomerPerspective />
                </ProtectedRoute>
              }
            />
            <Route
              path="account-statements"
              element={
                <ProtectedRoute user={user} requiredPermission="account_statements.read">
                  <AccountStatementList />
                </ProtectedRoute>
              }
            />
            <Route
              path="account-statements/new"
              element={
                <ProtectedRoute user={user} requiredPermission="account_statements.create">
                  <AccountStatementForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="account-statements/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="account_statements.read">
                  <AccountStatementDetails />
                </ProtectedRoute>
              }
            />

            {/* ===== INVENTORY ===== */}
            <Route
              path="warehouses"
              element={
                <ProtectedRoute user={user} requiredPermission="warehouses.read">
                  <WarehouseList />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouses/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="warehouses.read">
                  <WarehouseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse-locations"
              element={
                <ProtectedRoute user={user} requiredPermission="warehouse_locations.read">
                  <WarehouseLocations />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory"
              element={
                <ProtectedRoute user={user} requiredPermission="inventory.read">
                  <InventoryList />
                </ProtectedRoute>
              }
            />
            <Route
              path="stock-movements"
              element={
                <ProtectedRoute user={user} requiredPermission="stock_movements.read">
                  <StockMovementPage />
                </ProtectedRoute>
              }
            />

            {/* ===== TRADE ===== */}
            <Route
              path="import-export"
              element={
                <ProtectedRoute user={user} requiredPermission="import_orders.read">
                  <ImportExportDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="import-orders/new"
              element={
                <ProtectedRoute user={user} requiredPermission="import_orders.create">
                  <ImportOrderForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="import-orders/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="import_orders.read">
                  <ImportOrderDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="import-orders/:id/edit"
              element={
                <ProtectedRoute user={user} requiredPermission="import_orders.update">
                  <ImportOrderForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="export-orders/new"
              element={
                <ProtectedRoute user={user} requiredPermission="export_orders.create">
                  <ExportOrderForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="export-orders/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="export_orders.read">
                  <ExportOrderDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="export-orders/:id/edit"
              element={
                <ProtectedRoute user={user} requiredPermission="export_orders.update">
                  <ExportOrderForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="transit"
              element={
                <ProtectedRoute user={user} requiredPermission="import_orders.read">
                  <TransitList />
                </ProtectedRoute>
              }
            />
            <Route
              path="containers"
              element={
                <ProtectedRoute user={user} requiredPermission="import_orders.read">
                  <ContainerList />
                </ProtectedRoute>
              }
            />
            <Route
              path="containers/new"
              element={
                <ProtectedRoute user={user} requiredPermission="import_orders.create">
                  <ContainerForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="containers/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="import_orders.read">
                  <ContainerForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="containers/:id/edit"
              element={
                <ProtectedRoute user={user} requiredPermission="import_orders.update">
                  <ContainerForm />
                </ProtectedRoute>
              }
            />

            {/* ===== MASTERS ===== */}
            <Route
              path="customers"
              element={
                <ProtectedRoute user={user} requiredPermission="customers.read">
                  <CustomerManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/new"
              element={
                <ProtectedRoute user={user} requiredPermission="customers.create">
                  <CustomerForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/:customerId/edit"
              element={
                <ProtectedRoute user={user} requiredPermission="customers.update">
                  <CustomerForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/:customerId"
              element={
                <ProtectedRoute user={user} requiredPermission="customers.read">
                  <CustomerDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/:customerId/pricing"
              element={
                <ProtectedRoute user={user} requiredPermission="customers.read">
                  <Suspense fallback={<div>Loading...</div>}>
                    <CustomerPricingPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="products"
              element={
                <ProtectedRoute user={user} requiredPermission="products.read">
                  <Suspense fallback={<div>Loading...</div>}>
                    <SteelProducts />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="pricelists"
              element={
                <ProtectedRoute user={user} requiredPermission="pricelists.read">
                  <PriceListList />
                </ProtectedRoute>
              }
            />
            <Route
              path="pricelists/new"
              element={
                <ProtectedRoute user={user} requiredPermission="pricelists.create">
                  <PriceListForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="pricelists/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="pricelists.read">
                  <PriceListForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="pricelists/:id/edit"
              element={
                <ProtectedRoute user={user} requiredPermission="pricelists.update">
                  <PriceListForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="suppliers"
              element={
                <ProtectedRoute user={user} requiredPermission="suppliers.read">
                  <SupplierList />
                </ProtectedRoute>
              }
            />
            <Route
              path="suppliers/new"
              element={
                <ProtectedRoute user={user} requiredPermission="suppliers.create">
                  <SupplierForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="suppliers/:id/edit"
              element={
                <ProtectedRoute user={user} requiredPermission="suppliers.update">
                  <SupplierForm />
                </ProtectedRoute>
              }
            />

            {/* ===== SUPPLIER QUOTATIONS (PDF Upload Module) ===== */}
            <Route
              path="supplier-quotations"
              element={
                <ProtectedRoute user={user} requiredPermission="suppliers.read">
                  <SupplierQuotationList />
                </ProtectedRoute>
              }
            />
            <Route
              path="supplier-quotations/upload"
              element={
                <ProtectedRoute user={user} requiredPermission="suppliers.create">
                  <SupplierQuotationUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="supplier-quotations/new"
              element={
                <ProtectedRoute user={user} requiredPermission="suppliers.create">
                  <SupplierQuotationForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="supplier-quotations/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="suppliers.read">
                  <SupplierQuotationDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="supplier-quotations/:id/edit"
              element={
                <ProtectedRoute user={user} requiredPermission="suppliers.update">
                  <SupplierQuotationForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="countries"
              element={
                <ProtectedRoute user={user}>
                  <CountriesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="exchange-rates"
              element={
                <ProtectedRoute user={user}>
                  <ExchangeRateList />
                </ProtectedRoute>
              }
            />

            {/* ===== SETTINGS ===== */}
            <Route
              path="settings"
              element={
                <ProtectedRoute
                  user={user}
                  requiredRoles={[
                    "admin",
                    "managing_director",
                    "operations_manager",
                    "finance_manager",
                    "finance_manager_predefined",
                  ]}
                >
                  <CompanySettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute user={user} requiredPermission="users.read">
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="roles"
              element={
                <ProtectedRoute user={user} requiredPermission="roles.read">
                  <RolesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="permissions-matrix"
              element={
                <ProtectedRoute user={user} requiredPermission="roles.read">
                  <PermissionsMatrix />
                </ProtectedRoute>
              }
            />
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute user={user} requiredPermission="audit_logs.read">
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            {/* ===== FEEDBACK MANAGEMENT ===== */}
            <Route
              path="feedback"
              element={
                <ProtectedRoute user={user} requiredRoles={["admin", "managing_director"]}>
                  <FeedbackManagement />
                </ProtectedRoute>
              }
            />

            {/* ===== PRICING MANAGEMENT ===== */}
            <Route
              path="base-prices"
              element={
                <ProtectedRoute user={user} requiredPermission="products.update">
                  <Suspense fallback={<div>Loading...</div>}>
                    <BasePricesPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* ===== AUDIT HUB ===== */}
            <Route
              path="audit-hub"
              element={
                <ProtectedRoute user={user} requiredPermission="audit_hub.view">
                  <Suspense fallback={<div>Loading...</div>}>
                    <AuditHubDashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="audit-hub/datasets/:datasetId"
              element={
                <ProtectedRoute user={user} requiredPermission="audit_hub.view">
                  <Suspense fallback={<div>Loading...</div>}>
                    <DatasetExplorer />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="audit-hub/datasets/:periodId/:datasetId/sign-off"
              element={
                <ProtectedRoute user={user} requiredPermission="audit_hub.sign_off">
                  <Suspense fallback={<div>Loading...</div>}>
                    <SignOffWorkflow />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* User Profile - accessible to all authenticated users */}
            <Route
              path="profile"
              element={
                <ProtectedRoute user={user}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <UserProfile />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Route>

          {/* ========================================== */}
          {/* ANALYTICS HUB ROUTES (/analytics/*)       */}
          {/* View/Report - see data, analyze, export   */}
          {/* ========================================== */}

          <Route
            path="/analytics"
            element={
              <Suspense fallback={<AnalyticsLoadingScreen />}>
                <AnalyticsLayout />
              </Suspense>
            }
          >
            {/* Redirect /analytics to /analytics/dashboard */}
            <Route index element={<Navigate to="/analytics/dashboard" replace />} />

            {/* Executive Dashboard */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute user={user} requiredRoles={["admin", "managing_director", "financial_analyst"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Sales Analytics */}
            <Route
              path="profit-analysis"
              element={
                <ProtectedRoute user={user} requiredPermission="analytics.read">
                  <ProfitAnalysisReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="price-history"
              element={
                <ProtectedRoute user={user} requiredPermission="analytics.read">
                  <PriceHistoryReport />
                </ProtectedRoute>
              }
            />

            {/* Finance Dashboards */}
            <Route
              path="ar-aging"
              element={
                <ProtectedRoute user={user} requiredPermission="customers.read">
                  <ARAgingReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="commission-dashboard"
              element={
                <ProtectedRoute user={user}>
                  <AgentCommissionDashboard />
                </ProtectedRoute>
              }
            />

            {/* Financial Reports */}
            <Route
              path="bank-ledger"
              element={
                <ProtectedRoute user={user} requiredPermission="analytics.read">
                  <BankLedgerReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="bank-reconciliation"
              element={
                <ProtectedRoute user={user} requiredPermission="analytics.read">
                  <BankReconciliationStatement />
                </ProtectedRoute>
              }
            />
            <Route
              path="cash-book"
              element={
                <ProtectedRoute user={user} requiredPermission="analytics.read">
                  <CashBookReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="journal-register"
              element={
                <ProtectedRoute user={user} requiredPermission="analytics.read">
                  <JournalRegisterReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="trial-balance"
              element={
                <ProtectedRoute user={user} requiredPermission="analytics.read">
                  <TrialBalanceReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="cogs-analysis"
              element={
                <ProtectedRoute user={user} requiredPermission="analytics.read">
                  <COGSAnalysisReport />
                </ProtectedRoute>
              }
            />

            {/* Audit Hub */}
            <Route
              path="audit-hub"
              element={
                <ProtectedRoute
                  user={user}
                  requiredRoles={[
                    "accountant",
                    "senior_accountant",
                    "finance_manager",
                    "manager",
                    "admin",
                    "super_admin",
                    "director",
                  ]}
                >
                  <AuditHubDashboard />
                </ProtectedRoute>
              }
            />

            {/* Inventory Analytics */}
            <Route
              path="batch-analytics"
              element={
                <ProtectedRoute
                  user={user}
                  requiredRoles={[
                    "warehouse_manager",
                    "inventory_controller",
                    "supervisor",
                    "manager",
                    "admin",
                    "super_admin",
                    "finance_manager",
                    "accountant",
                    "director",
                  ]}
                >
                  <BatchAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="stock-movement-report"
              element={
                <ProtectedRoute user={user} requiredPermission="inventory.read">
                  <StockMovementReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="reconciliation"
              element={
                <ProtectedRoute user={user} requiredPermission="inventory.read">
                  <ReconciliationReport />
                </ProtectedRoute>
              }
            />

            {/* Purchase Analytics */}
            <Route
              path="delivery-performance"
              element={
                <ProtectedRoute user={user} requiredPermission="suppliers.read">
                  <DeliveryVarianceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="supplier-performance"
              element={
                <ProtectedRoute user={user} requiredPermission="suppliers.read">
                  <SupplierPerformanceDashboard />
                </ProtectedRoute>
              }
            />

            {/* Reports Hub */}
            <Route
              path="reports"
              element={
                <ProtectedRoute user={user} requiredPermission="analytics.read">
                  <ReportsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="vat-return"
              element={
                <ProtectedRoute user={user} requiredPermission="analytics.read">
                  <VATReturnReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="vat-return/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="analytics.read">
                  <VATReturnReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="vat-return/:id/preview"
              element={
                <ProtectedRoute user={user} requiredPermission="analytics.read">
                  <VATReturnReport />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* ========================================== */}
          {/* CATCH-ALL - Redirect to /app              */}
          {/* ========================================== */}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default AppRouter;
