import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { lazy, Suspense } from 'react';

// Layout Components
import { CoreERPLayout } from '../layouts';
const AnalyticsLayout = lazy(() => import('../layouts/AnalyticsLayout'));

// Loading Screen for Analytics
import AnalyticsLoadingScreen from './AnalyticsLoadingScreen';

// Legacy Redirect Component
import LegacyRedirect from './LegacyRedirect';

// Lazy loaded components
const CustomerDetail = lazy(() => import('../pages/CustomerDetail'));

// Core Components (converted to lazy loading)
const Dashboard = lazy(() => import('./DashboardV2'));
const InvoiceForm = lazy(() => import('../pages/InvoiceForm'));
const InvoiceAllocationConfirmation = lazy(
  () => import('./InvoiceAllocationConfirmation'),
);
const InvoiceList = lazy(() => import('../pages/InvoiceList'));
const CustomerManagement = lazy(() => import('./CustomerManagement'));
const SteelProducts = lazy(() => import('./SteelProducts'));
const CompanySettings = lazy(() => import('./CompanySettings'));
const SearchResults = lazy(() => import('./SearchResults'));
const InventoryList = lazy(() => import('./InventoryList'));
const DeliveryNoteList = lazy(() => import('../pages/DeliveryNoteList'));
const DeliveryNoteForm = lazy(() => import('../pages/DeliveryNoteForm'));
const DeliveryNoteDetails = lazy(() => import('../pages/DeliveryNoteDetails'));
const PurchaseOrderForm = lazy(() => import('../pages/PurchaseOrderForm'));
const Login = lazy(() => import('./Login'));
const MarketingHome = lazy(() => import('../marketing/MarketingHome'));
const MarketingProducts = lazy(() => import('../marketing/MarketingProducts'));
const MarketingAbout = lazy(() => import('../marketing/MarketingAbout'));
const MarketingContact = lazy(() => import('../marketing/MarketingContact'));
const AccountStatementList = lazy(
  () => import('../pages/AccountStatementList'),
);
const AccountStatementForm = lazy(
  () => import('../pages/AccountStatementForm'),
);
const AccountStatementDetails = lazy(
  () => import('../pages/AccountStatementDetails'),
);
const QuotationList = lazy(() => import('../pages/QuotationList'));
const QuotationForm = lazy(() => import('../pages/QuotationForm'));
const CreditNoteList = lazy(() => import('../pages/CreditNoteList'));
const CreditNoteForm = lazy(() => import('../pages/CreditNoteForm'));
const CustomerPerspective = lazy(() => import('../pages/CustomerPerspective'));
const ProtectedRoute = lazy(() => import('./ProtectedRoute'));

// Import/Export Components
const ImportExportDashboard = lazy(
  () => import('../pages/ImportExportDashboard'),
);
const ImportOrderForm = lazy(() => import('../pages/ImportOrderForm'));
const ImportOrderDetails = lazy(() => import('../pages/ImportOrderDetails'));
const ExportOrderForm = lazy(() => import('../pages/ExportOrderForm'));
const ExportOrderDetails = lazy(() => import('../pages/ExportOrderDetails'));
const TransitList = lazy(() => import('../pages/TransitList'));

// Container Management Components
const ContainerList = lazy(() =>
  import('../pages/containers').then((m) => ({ default: m.ContainerList })),
);
const ContainerForm = lazy(() =>
  import('../pages/containers').then((m) => ({ default: m.ContainerForm })),
);

// Finance Components
const FinanceDashboard = lazy(() => import('../pages/FinanceDashboard'));
const Receivables = lazy(() => import('../pages/Receivables'));
const Payables = lazy(() => import('../pages/Payables'));

// Purchases Dashboard
const PurchasesDashboard = lazy(() => import('../pages/PurchasesDashboard'));

// Admin Components
const AuditLogs = lazy(() => import('../pages/AuditLogs'));

// Stock Movement Components
const StockMovementPage = lazy(() => import('../pages/StockMovementPage'));

// Warehouse Components
const WarehouseList = lazy(() => import('../pages/warehouses/WarehouseList'));
const WarehouseDetail = lazy(
  () => import('../pages/warehouses/WarehouseDetail'),
);

// Batch Analytics
const BatchAnalyticsPage = lazy(() => import('../pages/BatchAnalyticsPage'));

// Reports Components
const ReportsDashboard = lazy(() => import('../pages/ReportsDashboard'));
const ProfitAnalysisReport = lazy(
  () => import('../pages/ProfitAnalysisReport'),
);
const PriceHistoryReport = lazy(() => import('../pages/PriceHistoryReport'));
const StockMovementReport = lazy(() => import('../pages/StockMovementReport'));
const VATReturnReport = lazy(() => import('./VATReturnReport'));

// Admin Components - Roles & Permissions
const RolesPage = lazy(() => import('../pages/RolesPage'));

// Purchases Components
const SupplierBillList = lazy(() =>
  import('../pages/purchases').then((m) => ({ default: m.SupplierBillList })),
);
const SupplierBillForm = lazy(() =>
  import('../pages/purchases').then((m) => ({ default: m.SupplierBillForm })),
);
const DebitNoteList = lazy(() =>
  import('../pages/purchases').then((m) => ({ default: m.DebitNoteList })),
);
const DebitNoteForm = lazy(() =>
  import('../pages/purchases').then((m) => ({ default: m.DebitNoteForm })),
);

// Payments Components
const AdvancePaymentList = lazy(() =>
  import('../pages/payments').then((m) => ({ default: m.AdvancePaymentList })),
);
const AdvancePaymentForm = lazy(() =>
  import('../pages/payments').then((m) => ({ default: m.AdvancePaymentForm })),
);

// Price List Components
const PriceListList = lazy(() => import('../pages/PriceListList'));
const PriceListForm = lazy(() => import('../pages/PriceListForm'));

// Commission Components
const AgentCommissionDashboard = lazy(
  () => import('../pages/AgentCommissionDashboard'),
);
// Phase 4 & 5 Dashboard Components
const DeliveryVarianceDashboard = lazy(
  () => import('../pages/DeliveryVarianceDashboard'),
);
const SupplierPerformanceDashboard = lazy(
  () => import('../pages/SupplierPerformanceDashboard'),
);
const ARAgingReport = lazy(() => import('../pages/ARAgingReport'));

// Masters Components
const CountriesList = lazy(() => import('../pages/CountriesList'));
const ExchangeRateList = lazy(() => import('../pages/ExchangeRateList'));

// Supplier Components (Phase 4 Procurement)
const SupplierList = lazy(() =>
  import('../pages/SupplierList').then((m) => ({ default: m.SupplierList })),
);
const SupplierForm = lazy(() =>
  import('../pages/SupplierForm').then((m) => ({ default: m.SupplierForm })),
);

// AnalyticsDashboard removed - /analytics now redirects to /analytics/dashboard

const AppRouter = ({ user, handleSaveInvoice, onLoginSuccess }) => {
  const location = useLocation();
  const { isDarkMode } = useTheme();

  // Allow public marketing pages and login without auth
  const isMarketing =
    location.pathname === '/' || location.pathname.startsWith('/marketing');
  const isLoginPage = location.pathname === '/login';
  const isAppRoute =
    location.pathname.startsWith('/app') ||
    location.pathname.startsWith('/analytics');

  // Check if we need to redirect to login
  const needsAuth = !user && !isLoginPage && !isMarketing;

  // If user is logged in and on login page, redirect to app
  const needsAppRedirect = user && isLoginPage;

  if (needsAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (needsAppRedirect) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div
      className={`w-full ${isMarketing || isAppRoute ? '' : 'p-2 sm:p-1 min-h-[calc(100vh-64px)]'} ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
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
          <Route
            path="/"
            element={<Navigate to={user ? '/app' : '/login'} replace />}
          />

          {/* Marketing Pages */}
          <Route path="/marketing" element={<MarketingHome />} />
          <Route path="/marketing/products" element={<MarketingProducts />} />
          <Route path="/marketing/about" element={<MarketingAbout />} />
          <Route path="/marketing/contact" element={<MarketingContact />} />

          {/* Login */}
          <Route
            path="/login"
            element={<Login onLoginSuccess={onLoginSuccess} />}
          />

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
            {/* Redirect /app to first operational page */}
            <Route index element={<Navigate to="/app/quotations" replace />} />

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
                <ProtectedRoute
                  user={user}
                  requiredPermission="quotations.read"
                >
                  <QuotationList />
                </ProtectedRoute>
              }
            />
            <Route
              path="quotations/new"
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
              path="quotations/:id"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="quotations.read"
                >
                  <QuotationForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="quotations/:id/edit"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="quotations.update"
                >
                  <QuotationForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="invoices"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="invoices_all.read"
                >
                  <InvoiceList />
                </ProtectedRoute>
              }
            />
            <Route
              path="invoices/new"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="invoices.create"
                >
                  <InvoiceForm onSave={handleSaveInvoice} />
                </ProtectedRoute>
              }
            />
            <Route
              path="invoices/:id"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="invoices.update"
                >
                  <InvoiceForm onSave={handleSaveInvoice} />
                </ProtectedRoute>
              }
            />
            <Route
              path="invoices/:invoiceId/confirm-allocation"
              element={
                <ProtectedRoute user={user} requiredPermission="invoices.read">
                  <InvoiceAllocationConfirmation />
                </ProtectedRoute>
              }
            />

            <Route
              path="delivery-notes"
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
              path="delivery-notes/new"
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
              path="delivery-notes/:id"
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
              path="delivery-notes/:id/edit"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="delivery_notes.update"
                >
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
                <ProtectedRoute
                  user={user}
                  requiredPermission="invoices.create"
                >
                  <CreditNoteForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="credit-notes/:id"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="invoices.update"
                >
                  <CreditNoteForm />
                </ProtectedRoute>
              }
            />

            {/* ===== PURCHASES ===== */}
            <Route
              path="purchases"
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
              path="purchase-orders/new"
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
              path="purchase-orders/:id/edit"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="purchase_orders.update"
                >
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
                <ProtectedRoute
                  user={user}
                  requiredPermission="payables.create"
                >
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
                <ProtectedRoute
                  user={user}
                  requiredPermission="payables.update"
                >
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
                <ProtectedRoute
                  user={user}
                  requiredPermission="payables.create"
                >
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
                <ProtectedRoute
                  user={user}
                  requiredPermission="payables.update"
                >
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
                <ProtectedRoute
                  user={user}
                  requiredPermission="payables.create"
                >
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
              path="receivables"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="receivables.read"
                >
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
                <ProtectedRoute
                  user={user}
                  requiredPermission="account_statements.read"
                >
                  <AccountStatementList />
                </ProtectedRoute>
              }
            />
            <Route
              path="account-statements/new"
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
              path="account-statements/:id"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="account_statements.read"
                >
                  <AccountStatementDetails />
                </ProtectedRoute>
              }
            />

            {/* ===== INVENTORY ===== */}
            <Route
              path="warehouses"
              element={
                <ProtectedRoute user={user}>
                  <WarehouseList />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouses/:id"
              element={
                <ProtectedRoute user={user}>
                  <WarehouseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory"
              element={
                <ProtectedRoute user={user}>
                  <InventoryList />
                </ProtectedRoute>
              }
            />
            <Route
              path="stock-movements"
              element={
                <ProtectedRoute user={user}>
                  <StockMovementPage />
                </ProtectedRoute>
              }
            />

            {/* ===== TRADE ===== */}
            <Route
              path="import-export"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="import_orders.read"
                >
                  <ImportExportDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="import-orders/new"
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
              path="import-orders/:id"
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
              path="import-orders/:id/edit"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="import_orders.update"
                >
                  <ImportOrderForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="export-orders/new"
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
              path="export-orders/:id"
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
              path="export-orders/:id/edit"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="export_orders.update"
                >
                  <ExportOrderForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="transit"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="import_orders.read"
                >
                  <TransitList />
                </ProtectedRoute>
              }
            />
            <Route
              path="containers"
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
              path="containers/new"
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
              path="containers/:id"
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
              path="containers/:id/edit"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="import_orders.update"
                >
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
              path="customers/:customerId"
              element={
                <ProtectedRoute user={user} requiredPermission="customers.read">
                  <CustomerDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="products"
              element={
                <ProtectedRoute user={user} requiredPermission="products.read">
                  <SteelProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="pricelists"
              element={
                <ProtectedRoute user={user} requiredPermission="products.read">
                  <PriceListList />
                </ProtectedRoute>
              }
            />
            <Route
              path="pricelists/new"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="products.create"
                >
                  <PriceListForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="pricelists/:id"
              element={
                <ProtectedRoute user={user} requiredPermission="products.read">
                  <PriceListForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="pricelists/:id/edit"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="products.update"
                >
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
                <ProtectedRoute
                  user={user}
                  requiredPermission="suppliers.create"
                >
                  <SupplierForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="suppliers/:id/edit"
              element={
                <ProtectedRoute
                  user={user}
                  requiredPermission="suppliers.update"
                >
                  <SupplierForm />
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
                <ProtectedRoute user={user} requiredRole="admin">
                  <CompanySettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="roles"
              element={
                <ProtectedRoute user={user} requiredRole="admin">
                  <RolesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute user={user} requiredRole="admin">
                  <AuditLogs />
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
            <Route
              index
              element={<Navigate to="/analytics/dashboard" replace />}
            />

            {/* Executive Dashboard */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute user={user}>
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

            {/* Inventory Analytics */}
            <Route
              path="batch-analytics"
              element={
                <ProtectedRoute
                  user={user}
                  requiredRoles={[
                    'warehouse_manager',
                    'inventory_controller',
                    'supervisor',
                    'manager',
                    'admin',
                    'super_admin',
                    'finance_manager',
                    'accountant',
                    'director',
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
