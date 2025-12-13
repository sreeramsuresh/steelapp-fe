import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { lazy } from "react";

// Lazy loaded components
const CustomerDetail = lazy(() => import("../pages/CustomerDetail"));

// Components
import Dashboard from "./DashboardV2";
import InvoiceForm from "../pages/InvoiceForm";
import InvoiceList from "../pages/InvoiceList";
import CustomerManagement from "./CustomerManagement";
import SteelProducts from "./SteelProducts";
import CompanySettings from "./CompanySettings";
import SearchResults from "./SearchResults";
import InventoryList from "./InventoryList";
import DeliveryNoteList from "../pages/DeliveryNoteList";
import DeliveryNoteForm from "../pages/DeliveryNoteForm";
import DeliveryNoteDetails from "../pages/DeliveryNoteDetails";
import PurchaseOrderForm from "../pages/PurchaseOrderForm";
import Login from "./Login";
import MarketingHome from "../marketing/MarketingHome";
import MarketingProducts from "../marketing/MarketingProducts";
import MarketingAbout from "../marketing/MarketingAbout";
import MarketingContact from "../marketing/MarketingContact";
import AccountStatementList from "../pages/AccountStatementList";
import AccountStatementForm from "../pages/AccountStatementForm";
import AccountStatementDetails from "../pages/AccountStatementDetails";
import QuotationList from "../pages/QuotationList";
import QuotationForm from "../pages/QuotationForm";
import CreditNoteList from "../pages/CreditNoteList";
import CreditNoteForm from "../pages/CreditNoteForm";
import CustomerPerspective from "../pages/CustomerPerspective";
import ProtectedRoute from "./ProtectedRoute";

// Import/Export Components
import ImportExportDashboard from "../pages/ImportExportDashboard";
import ImportOrderForm from "../pages/ImportOrderForm";
import ImportOrderDetails from "../pages/ImportOrderDetails";
import ExportOrderForm from "../pages/ExportOrderForm";
import ExportOrderDetails from "../pages/ExportOrderDetails";
import TransitList from "../pages/TransitList";

// Container Management Components
import { ContainerList } from "../pages/containers";

// Finance Components
import FinanceDashboard from "../pages/FinanceDashboard";

// Purchases Dashboard
import PurchasesDashboard from "../pages/PurchasesDashboard";

// Admin Components
import AuditLogs from "../pages/AuditLogs";

// Stock Movement Components
import StockMovementPage from "../pages/StockMovementPage";

// Warehouse Components
import WarehouseList from "../pages/warehouses/WarehouseList";
import WarehouseDetail from "../pages/warehouses/WarehouseDetail";

// Batch Analytics
import BatchAnalyticsPage from "../pages/BatchAnalyticsPage";

// Reports Components
import ReportsDashboard from "../pages/ReportsDashboard";
import ProfitAnalysisReport from "../pages/ProfitAnalysisReport";
import PriceHistoryReport from "../pages/PriceHistoryReport";
import VATReturnReport from "./VATReturnReport";

// Purchases Components
import {
  VendorBillList,
  VendorBillForm,
  DebitNoteList,
  DebitNoteForm,
} from "../pages/purchases";

// Payments Components
import { AdvancePaymentList, AdvancePaymentForm } from "../pages/payments";

// Price List Components
import PriceListList from "../pages/PriceListList";
import PriceListForm from "../pages/PriceListForm";

// Commission Components
import AgentCommissionDashboard from "../pages/AgentCommissionDashboard";
import CommissionApprovalWorkflow from "../pages/CommissionApprovalWorkflow";

// Phase 4 & 5 Dashboard Components
import DeliveryVarianceDashboard from "../pages/DeliveryVarianceDashboard";
import CustomerCreditManagement from "../pages/CustomerCreditManagement";
import ARAgingReport from "../pages/ARAgingReport";

// Masters Components
import CountriesList from "../pages/CountriesList";
import ExchangeRateList from "../pages/ExchangeRateList";

// Supplier Components (Phase 4 Procurement)
import { SupplierList } from "../pages/SupplierList";
import { SupplierForm } from "../pages/SupplierForm";

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

        {/* All invoices list requires invoices_all.read */}
        <Route
          path="/invoices"
          element={
            <ProtectedRoute user={user} requiredPermission="invoices_all.read">
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
            <ProtectedRoute user={user} requiredPermission="quotations.create">
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
            <ProtectedRoute user={user} requiredPermission="quotations.update">
              <QuotationForm />
            </ProtectedRoute>
          }
        />

        {/* Import/Export Routes */}

        {/* Main Import/Export Dashboard with Tabs */}
        <Route
          path="/import-export"
          element={
            <ProtectedRoute user={user} requiredPermission="import_orders.read">
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
            <ProtectedRoute user={user} requiredPermission="import_orders.read">
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
            <ProtectedRoute user={user} requiredPermission="export_orders.read">
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
            <ProtectedRoute user={user} requiredPermission="import_orders.read">
              <TransitList />
            </ProtectedRoute>
          }
        />

        {/* Container Management Routes */}
        <Route
          path="/containers"
          element={
            <ProtectedRoute user={user} requiredPermission="import_orders.read">
              <ContainerList />
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
    </div>
  );
};

export default AppRouter;
