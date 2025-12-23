import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { lazy, Suspense } from "react";

// Lazy loaded components
const CustomerDetail = lazy(() => import("../pages/CustomerDetail"));

// Core Components (converted to lazy loading)
const Dashboard = lazy(() => import("./DashboardV2"));
const InvoiceForm = lazy(() => import("../pages/InvoiceForm"));
const InvoiceAllocationConfirmation = lazy(
  () => import("./InvoiceAllocationConfirmation"),
);
const InvoiceList = lazy(() => import("../pages/InvoiceList"));
const CustomerManagement = lazy(() => import("./CustomerManagement"));
const SteelProducts = lazy(() => import("./SteelProducts"));
const CompanySettings = lazy(() => import("./CompanySettings"));
const SearchResults = lazy(() => import("./SearchResults"));
const InventoryList = lazy(() => import("./InventoryList"));
const DeliveryNoteList = lazy(() => import("../pages/DeliveryNoteList"));
const DeliveryNoteForm = lazy(() => import("../pages/DeliveryNoteForm"));
const DeliveryNoteDetails = lazy(() => import("../pages/DeliveryNoteDetails"));
const PurchaseOrderForm = lazy(() => import("../pages/PurchaseOrderForm"));
const Login = lazy(() => import("./Login"));
const MarketingHome = lazy(() => import("../marketing/MarketingHome"));
const MarketingProducts = lazy(() => import("../marketing/MarketingProducts"));
const MarketingAbout = lazy(() => import("../marketing/MarketingAbout"));
const MarketingContact = lazy(() => import("../marketing/MarketingContact"));
const AccountStatementList = lazy(
  () => import("../pages/AccountStatementList"),
);
const AccountStatementForm = lazy(
  () => import("../pages/AccountStatementForm"),
);
const AccountStatementDetails = lazy(
  () => import("../pages/AccountStatementDetails"),
);
const QuotationList = lazy(() => import("../pages/QuotationList"));
const QuotationForm = lazy(() => import("../pages/QuotationForm"));
const CreditNoteList = lazy(() => import("../pages/CreditNoteList"));
const CreditNoteForm = lazy(() => import("../pages/CreditNoteForm"));
const CustomerPerspective = lazy(() => import("../pages/CustomerPerspective"));
const ProtectedRoute = lazy(() => import("./ProtectedRoute"));

// Import/Export Components
const ImportExportDashboard = lazy(
  () => import("../pages/ImportExportDashboard"),
);
const ImportOrderForm = lazy(() => import("../pages/ImportOrderForm"));
const ImportOrderDetails = lazy(() => import("../pages/ImportOrderDetails"));
const ExportOrderForm = lazy(() => import("../pages/ExportOrderForm"));
const ExportOrderDetails = lazy(() => import("../pages/ExportOrderDetails"));
const TransitList = lazy(() => import("../pages/TransitList"));

// Container Management Components
const ContainerList = lazy(() =>
  import("../pages/containers").then((m) => ({ default: m.ContainerList })),
);
const ContainerForm = lazy(() =>
  import("../pages/containers").then((m) => ({ default: m.ContainerForm })),
);

// Finance Components
const FinanceDashboard = lazy(() => import("../pages/FinanceDashboard"));

// Purchases Dashboard
const PurchasesDashboard = lazy(() => import("../pages/PurchasesDashboard"));

// Admin Components
const AuditLogs = lazy(() => import("../pages/AuditLogs"));

// Stock Movement Components
const StockMovementPage = lazy(() => import("../pages/StockMovementPage"));

// Warehouse Components
const WarehouseList = lazy(() => import("../pages/warehouses/WarehouseList"));
const WarehouseDetail = lazy(
  () => import("../pages/warehouses/WarehouseDetail"),
);

// Batch Analytics
const BatchAnalyticsPage = lazy(() => import("../pages/BatchAnalyticsPage"));

// Reports Components
const ReportsDashboard = lazy(() => import("../pages/ReportsDashboard"));
const ProfitAnalysisReport = lazy(
  () => import("../pages/ProfitAnalysisReport"),
);
const PriceHistoryReport = lazy(() => import("../pages/PriceHistoryReport"));
const StockMovementReport = lazy(() => import("../pages/StockMovementReport"));
const VATReturnReport = lazy(() => import("./VATReturnReport"));

// Admin Components - Roles & Permissions
const RolesPage = lazy(() => import("../pages/RolesPage"));

// Purchases Components
const VendorBillList = lazy(() =>
  import("../pages/purchases").then((m) => ({ default: m.VendorBillList })),
);
const VendorBillForm = lazy(() =>
  import("../pages/purchases").then((m) => ({ default: m.VendorBillForm })),
);
const DebitNoteList = lazy(() =>
  import("../pages/purchases").then((m) => ({ default: m.DebitNoteList })),
);
const DebitNoteForm = lazy(() =>
  import("../pages/purchases").then((m) => ({ default: m.DebitNoteForm })),
);

// Payments Components
const AdvancePaymentList = lazy(() =>
  import("../pages/payments").then((m) => ({ default: m.AdvancePaymentList })),
);
const AdvancePaymentForm = lazy(() =>
  import("../pages/payments").then((m) => ({ default: m.AdvancePaymentForm })),
);

// Price List Components
const PriceListList = lazy(() => import("../pages/PriceListList"));
const PriceListForm = lazy(() => import("../pages/PriceListForm"));

// Commission Components
const AgentCommissionDashboard = lazy(
  () => import("../pages/AgentCommissionDashboard"),
);
const CommissionApprovalWorkflow = lazy(
  () => import("../pages/CommissionApprovalWorkflow"),
);

// Phase 4 & 5 Dashboard Components
const DeliveryVarianceDashboard = lazy(
  () => import("../pages/DeliveryVarianceDashboard"),
);
const CustomerCreditManagement = lazy(
  () => import("../pages/CustomerCreditManagement"),
);
const ARAgingReport = lazy(() => import("../pages/ARAgingReport"));

// Masters Components
const CountriesList = lazy(() => import("../pages/CountriesList"));
const ExchangeRateList = lazy(() => import("../pages/ExchangeRateList"));

// Supplier Components (Phase 4 Procurement)
const SupplierList = lazy(() =>
  import("../pages/SupplierList").then((m) => ({ default: m.SupplierList })),
);
const SupplierForm = lazy(() =>
  import("../pages/SupplierForm").then((m) => ({ default: m.SupplierForm })),
);

const AppRouter = ({ user, handleSaveInvoice, onLoginSuccess }) => {
  const location = useLocation();
  const { isDarkMode } = useTheme();

  // Allow public marketing pages and login without auth
  const isMarketing =
    location.pathname === "/" || location.pathname.startsWith("/marketing");
  const isLoginPage = location.pathname === "/login";

  // Check if we need to redirect to login
  const needsAuth = !user && !isLoginPage && !isMarketing;

  // If user is logged in and on login page, redirect to dashboard
  const needsDashboardRedirect = user && isLoginPage;

  if (needsAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (needsDashboardRedirect) {
    return <Navigate to="/invoices" replace />;
  }

  return (
    <div
      className={`w-full ${isMarketing ? "" : "p-2 sm:p-1 min-h-[calc(100vh-64px)]"} ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
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
          {/* Default route - redirect to login if not authenticated, invoices if authenticated */}
          <Route
            path="/"
            element={<Navigate to={user ? "/invoices" : "/login"} replace />}
          />

          {/* Public Routes: Marketing + Login */}
          <Route path="/marketing" element={<MarketingHome />} />
          <Route path="/marketing/products" element={<MarketingProducts />} />
          <Route path="/marketing/about" element={<MarketingAbout />} />
          <Route path="/marketing/contact" element={<MarketingContact />} />
          <Route
            path="/login"
            element={<Login onLoginSuccess={onLoginSuccess} />}
          />

          {/* Protected Routes */}

          <Route
            path="/search"
            element={
              <ProtectedRoute user={user}>
                <SearchResults />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-invoice"
            element={
              <ProtectedRoute user={user} requiredPermission="invoices.create">
                <InvoiceForm onSave={handleSaveInvoice} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit/:id"
            element={
              <ProtectedRoute user={user} requiredPermission="invoices.update">
                <InvoiceForm onSave={handleSaveInvoice} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/invoices/:invoiceId/confirm-allocation"
            element={
              <ProtectedRoute user={user} requiredPermission="invoices.read">
                <InvoiceAllocationConfirmation />
              </ProtectedRoute>
            }
          />

          {/* All invoices list requires invoices_all.read */}
          <Route
            path="/invoices"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="invoices_all.read"
              >
                <InvoiceList />
              </ProtectedRoute>
            }
          />

          {/* Credit Notes Routes */}
          <Route
            path="/credit-notes"
            element={
              <ProtectedRoute user={user} requiredPermission="invoices.read">
                <CreditNoteList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/credit-notes/new"
            element={
              <ProtectedRoute user={user} requiredPermission="invoices.create">
                <CreditNoteForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/credit-notes/:id"
            element={
              <ProtectedRoute user={user} requiredPermission="invoices.update">
                <CreditNoteForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute user={user} requiredPermission="analytics.read">
                <ReportsDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/profit-analysis"
            element={
              <ProtectedRoute user={user} requiredPermission="analytics.read">
                <ProfitAnalysisReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/price-history"
            element={
              <ProtectedRoute user={user} requiredPermission="analytics.read">
                <PriceHistoryReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/stock-movements"
            element={
              <ProtectedRoute user={user} requiredPermission="inventory.read">
                <StockMovementReport />
              </ProtectedRoute>
            }
          />

          {/* VAT Return Report Routes */}
          <Route
            path="/reports/vat-return"
            element={
              <ProtectedRoute user={user} requiredPermission="analytics.read">
                <VATReturnReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/vat-return/:id"
            element={
              <ProtectedRoute user={user} requiredPermission="analytics.read">
                <VATReturnReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/vat-return/:id/preview"
            element={
              <ProtectedRoute user={user} requiredPermission="analytics.read">
                <VATReturnReport />
              </ProtectedRoute>
            }
          />

          {/* Purchases Routes - Vendor Bills */}
          <Route
            path="/purchases/vendor-bills"
            element={
              <ProtectedRoute user={user} requiredPermission="payables.read">
                <VendorBillList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/vendor-bills/new"
            element={
              <ProtectedRoute user={user} requiredPermission="payables.create">
                <VendorBillForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/vendor-bills/:id"
            element={
              <ProtectedRoute user={user} requiredPermission="payables.read">
                <VendorBillForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/vendor-bills/:id/edit"
            element={
              <ProtectedRoute user={user} requiredPermission="payables.update">
                <VendorBillForm />
              </ProtectedRoute>
            }
          />

          {/* Purchases Routes - Debit Notes */}
          <Route
            path="/purchases/debit-notes"
            element={
              <ProtectedRoute user={user} requiredPermission="payables.read">
                <DebitNoteList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/debit-notes/new"
            element={
              <ProtectedRoute user={user} requiredPermission="payables.create">
                <DebitNoteForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/debit-notes/:id"
            element={
              <ProtectedRoute user={user} requiredPermission="payables.read">
                <DebitNoteForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases/debit-notes/:id/edit"
            element={
              <ProtectedRoute user={user} requiredPermission="payables.update">
                <DebitNoteForm />
              </ProtectedRoute>
            }
          />

          {/* Advance Payments Routes */}
          <Route
            path="/payments/advance-payments"
            element={
              <ProtectedRoute user={user} requiredPermission="payables.read">
                <AdvancePaymentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/advance-payments/new"
            element={
              <ProtectedRoute user={user} requiredPermission="payables.create">
                <AdvancePaymentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/advance-payments/:id"
            element={
              <ProtectedRoute user={user} requiredPermission="payables.read">
                <AdvancePaymentForm />
              </ProtectedRoute>
            }
          />

          {/* Price List Routes */}
          <Route
            path="/pricelists"
            element={
              <ProtectedRoute user={user} requiredPermission="products.read">
                <PriceListList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pricelists/new"
            element={
              <ProtectedRoute user={user} requiredPermission="products.create">
                <PriceListForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pricelists/:id"
            element={
              <ProtectedRoute user={user} requiredPermission="products.read">
                <PriceListForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pricelists/:id/edit"
            element={
              <ProtectedRoute user={user} requiredPermission="products.update">
                <PriceListForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-commissions"
            element={
              <ProtectedRoute user={user}>
                <AgentCommissionDashboard />
              </ProtectedRoute>
            }
          />

          {/* Phase 5A: Commission Approval Workflow */}
          <Route
            path="/dashboards/commission-approvals"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="commissions.approve"
              >
                <CommissionApprovalWorkflow />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute user={user} requiredRole="admin">
                <CompanySettings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute user={user} requiredRole="admin">
                <AuditLogs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/roles"
            element={
              <ProtectedRoute user={user} requiredRole="admin">
                <RolesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance"
            element={
              <ProtectedRoute user={user} requiredPermission="payables.read">
                <FinanceDashboard />
              </ProtectedRoute>
            }
          />

          {/* Phase 5B: Customer Credit Management */}
          <Route
            path="/dashboards/customer-credit"
            element={
              <ProtectedRoute user={user} requiredPermission="customers.read">
                <CustomerCreditManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payables/customer/:customerId"
            element={
              <ProtectedRoute user={user} requiredPermission="payables.read">
                <CustomerPerspective />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute user={user}>
                <InventoryList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/stock-movements"
            element={
              <ProtectedRoute user={user}>
                <StockMovementPage />
              </ProtectedRoute>
            }
          />

          {/* Warehouse Routes */}
          <Route
            path="/warehouses"
            element={
              <ProtectedRoute user={user}>
                <WarehouseList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/warehouses/:id"
            element={
              <ProtectedRoute user={user}>
                <WarehouseDetail />
              </ProtectedRoute>
            }
          />

          {/* Batch Analytics Route */}
          <Route
            path="/batch-analytics"
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
            path="/delivery-notes"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="delivery_notes.read"
              >
                <DeliveryNoteList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/delivery-notes/new"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="delivery_notes.create"
              >
                <DeliveryNoteForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/delivery-notes/:id"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="delivery_notes.read"
              >
                <DeliveryNoteDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/delivery-notes/:id/edit"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="delivery_notes.update"
              >
                <DeliveryNoteForm />
              </ProtectedRoute>
            }
          />

          {/* Purchases Dashboard - Main purchases page with tabs */}
          <Route
            path="/purchases"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="purchase_orders.read"
              >
                <PurchasesDashboard />
              </ProtectedRoute>
            }
          />

          {/* Legacy Purchase Orders route - redirect to purchases dashboard */}
          <Route
            path="/purchase-orders"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="purchase_orders.read"
              >
                <PurchasesDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/purchase-orders/new"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="purchase_orders.create"
              >
                <PurchaseOrderForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/purchase-orders/:id/edit"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="purchase_orders.update"
              >
                <PurchaseOrderForm />
              </ProtectedRoute>
            }
          />

          {/* Supplier Management Routes (Phase 4 Procurement) */}
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute user={user} requiredPermission="suppliers.read">
                <SupplierList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/suppliers/new"
            element={
              <ProtectedRoute user={user} requiredPermission="suppliers.create">
                <SupplierForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/suppliers/:id/edit"
            element={
              <ProtectedRoute user={user} requiredPermission="suppliers.update">
                <SupplierForm />
              </ProtectedRoute>
            }
          />

          {/* Phase 4: Delivery Variance Dashboard */}
          <Route
            path="/dashboards/delivery-variance"
            element={
              <ProtectedRoute user={user} requiredPermission="suppliers.read">
                <DeliveryVarianceDashboard />
              </ProtectedRoute>
            }
          />

          {/* AR Aging Report */}
          <Route
            path="/dashboards/ar-aging"
            element={
              <ProtectedRoute user={user} requiredPermission="customers.read">
                <ARAgingReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account-statements"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="account_statements.read"
              >
                <AccountStatementList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account-statements/new"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="account_statements.create"
              >
                <AccountStatementForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account-statements/:id"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="account_statements.read"
              >
                <AccountStatementDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quotations"
            element={
              <ProtectedRoute user={user} requiredPermission="quotations.read">
                <QuotationList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quotations/new"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="quotations.create"
              >
                <QuotationForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quotations/:id"
            element={
              <ProtectedRoute user={user} requiredPermission="quotations.read">
                <QuotationForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quotations/:id/edit"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="quotations.update"
              >
                <QuotationForm />
              </ProtectedRoute>
            }
          />

          {/* Import/Export Routes */}

          {/* Main Import/Export Dashboard with Tabs */}
          <Route
            path="/import-export"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="import_orders.read"
              >
                <ImportExportDashboard />
              </ProtectedRoute>
            }
          />

          {/* Import Order Forms & Details */}
          <Route
            path="/import-orders/new"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="import_orders.create"
              >
                <ImportOrderForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/import-orders/:id"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="import_orders.read"
              >
                <ImportOrderDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/import-orders/:id/edit"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="import_orders.update"
              >
                <ImportOrderForm />
              </ProtectedRoute>
            }
          />

          {/* Export Order Forms & Details */}
          <Route
            path="/export-orders/new"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="export_orders.create"
              >
                <ExportOrderForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/export-orders/:id"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="export_orders.read"
              >
                <ExportOrderDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/export-orders/:id/edit"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="export_orders.update"
              >
                <ExportOrderForm />
              </ProtectedRoute>
            }
          />

          {/* Transit Tracking */}
          <Route
            path="/transit"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="import_orders.read"
              >
                <TransitList />
              </ProtectedRoute>
            }
          />

          {/* Container Management Routes */}
          <Route
            path="/containers"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="import_orders.read"
              >
                <ContainerList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/containers/new"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="import_orders.create"
              >
                <ContainerForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/containers/:id"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="import_orders.read"
              >
                <ContainerForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/containers/:id/edit"
            element={
              <ProtectedRoute
                user={user}
                requiredPermission="import_orders.update"
              >
                <ContainerForm />
              </ProtectedRoute>
            }
          />

          {/* Masters Routes */}
          <Route
            path="/masters/countries"
            element={
              <ProtectedRoute user={user}>
                <CountriesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/masters/exchange-rates"
            element={
              <ProtectedRoute user={user}>
                <ExchangeRateList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute user={user} requiredPermission="customers.read">
                <CustomerManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:customerId"
            element={
              <ProtectedRoute user={user} requiredPermission="customers.read">
                <CustomerDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute user={user} requiredPermission="products.read">
                <SteelProducts />
              </ProtectedRoute>
            }
          />

          {/* Catch all route - DEVELOPMENT: redirect to invoices */}
          <Route path="*" element={<Navigate to="/invoices" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default AppRouter;
