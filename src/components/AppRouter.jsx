import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

// Components
import Dashboard from './Dashboard';
import InvoiceForm from '../pages/InvoiceForm';
import InvoiceList from '../pages/InvoiceList';
import CustomerManagement from './CustomerManagement';
import SteelProducts from './SteelProducts';
import PriceCalculator from './PriceCalculator';
import SalesAnalytics from './SalesAnalytics';
import CompanySettings from './CompanySettings';
import SearchResults from './SearchResults';
import RevenueTrends from './RevenueTrends';
import InventoryList from './InventoryList';
import DeliveryNoteList from '../pages/DeliveryNoteList';
import DeliveryNoteForm from '../pages/DeliveryNoteForm';
import DeliveryNoteDetails from '../pages/DeliveryNoteDetails';
import PurchaseOrderList from '../pages/PurchaseOrderList';
import PurchaseOrderForm from '../pages/PurchaseOrderForm';
import Login from './Login';
import MarketingHome from '../marketing/MarketingHome';
import MarketingProducts from '../marketing/MarketingProducts';
import MarketingAbout from '../marketing/MarketingAbout';
import MarketingContact from '../marketing/MarketingContact';
import AccountStatementList from '../pages/AccountStatementList';
import AccountStatementForm from '../pages/AccountStatementForm';
import AccountStatementDetails from '../pages/AccountStatementDetails';
import QuotationList from '../pages/QuotationList';
import QuotationForm from '../pages/QuotationForm';
import CreditNoteList from '../pages/CreditNoteList';
import CreditNoteForm from '../pages/CreditNoteForm';
import Payables from '../pages/Payables';
import Receivables from '../pages/Receivables';
import CustomerPerspective from '../pages/CustomerPerspective';
import ProtectedRoute from './ProtectedRoute';

// Import/Export Components
import ImportExportDashboard from '../pages/ImportExportDashboard';
import ImportOrderForm from '../pages/ImportOrderForm';
import ImportOrderDetails from '../pages/ImportOrderDetails';
import ExportOrderForm from '../pages/ExportOrderForm';
import ExportOrderDetails from '../pages/ExportOrderDetails';

// Finance Components
import FinanceDashboard from '../pages/FinanceDashboard';

// Business Components
import BusinessDashboard from '../pages/BusinessDashboard';

// Admin Components
import AuditLogs from '../pages/AuditLogs';

// Stock Movement Components
import StockMovementPage from '../pages/StockMovementPage';

// Reports Components
import ReportsDashboard from '../pages/ReportsDashboard';
import ProfitAnalysisReport from '../pages/ProfitAnalysisReport';
import PriceHistoryReport from '../pages/PriceHistoryReport';

// Price List Components
import PriceListList from '../pages/PriceListList';
import PriceListForm from '../pages/PriceListForm';

// Commission Components
import AgentCommissionDashboard from '../pages/AgentCommissionDashboard';

const AppRouter = ({ user, handleSaveInvoice, onLoginSuccess }) => {
  const location = useLocation();
  const { isDarkMode } = useTheme();

  // Allow public marketing pages and login without auth
  const isMarketing = location.pathname === '/' || location.pathname.startsWith('/marketing');
  const isLoginPage = location.pathname === '/login';

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
    <div className={`w-full ${isMarketing ? '' : 'p-2 sm:p-1 min-h-[calc(100vh-64px)]'} ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      <Routes>
        {/* Default route - redirect to login if not authenticated, invoices if authenticated */}
        <Route path="/" element={<Navigate to={user ? '/invoices' : '/login'} replace />} />

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
          path="/business"
          element={
            <ProtectedRoute user={user} requiredPermission="customers.read">
              <BusinessDashboard />
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

        <Route
          path="/purchase-orders"
          element={
            <ProtectedRoute
              user={user}
              requiredPermission="purchase_orders.read"
            >
              <PurchaseOrderList />
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

        

        <Route
          path="/account-statements"
          element={
            <ProtectedRoute user={user} requiredPermission="account_statements.read">
              <AccountStatementList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account-statements/new"
          element={
            <ProtectedRoute user={user} requiredPermission="account_statements.create">
              <AccountStatementForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account-statements/:id"
          element={
            <ProtectedRoute user={user} requiredPermission="account_statements.read">
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
            <ProtectedRoute user={user} requiredPermission="import_orders.create">
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
            <ProtectedRoute user={user} requiredPermission="import_orders.update">
              <ImportOrderForm />
            </ProtectedRoute>
          }
        />

        {/* Export Order Forms & Details */}
        <Route
          path="/export-orders/new"
          element={
            <ProtectedRoute user={user} requiredPermission="export_orders.create">
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
            <ProtectedRoute user={user} requiredPermission="export_orders.update">
              <ExportOrderForm />
            </ProtectedRoute>
          }
        />

        {/* Catch all route - DEVELOPMENT: redirect to invoices */}
        <Route
          path="*"
          element={<Navigate to="/invoices" replace />}
        />
      </Routes>
    </div>
  );
};

export default AppRouter;
