import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

// Components
import Dashboard from "./Dashboard";
import InvoiceForm from "../pages/InvoiceFormTailwind";
import InvoiceList from "../pages/InvoiceList";
import CustomerManagement from "./CustomerManagement";
import SteelProducts from "./SteelProducts";
import PriceCalculator from "./PriceCalculator";
import SalesAnalytics from "./SalesAnalytics";
import CompanySettings from "./CompanySettings";
import RevenueTrends from "./RevenueTrends";
import StockMovement from "./StockMovement";
import InventoryList from "./InventoryList";
import DeliveryNoteList from "../pages/DeliveryNoteList";
import DeliveryNoteForm from "../pages/DeliveryNoteForm";
import DeliveryNoteDetails from "../pages/DeliveryNoteDetails";
import PurchaseOrderList from "../pages/PurchaseOrderList";
import PurchaseOrderForm from "../pages/PurchaseOrderForm";
import TransitList from "../pages/TransitList";
import Login from "./Login";
import MarketingHome from "../marketing/MarketingHome";
import MarketingProducts from "../marketing/MarketingProducts";
import MarketingAbout from "../marketing/MarketingAbout";
import MarketingContact from "../marketing/MarketingContact";
import ProtectedRoute from "./ProtectedRoute";

const ContentWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'noPadding',
})(({ theme, noPadding }) => ({
  padding: noPadding ? 0 : theme.spacing(2, 1),
  maxWidth: "100%",
  minHeight: noPadding ? 'auto' : "calc(100vh - 64px)",
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.down("sm")]: {
    padding: noPadding ? 0 : theme.spacing(0),
  },
}));

const AppRouter = ({ user, handleSaveInvoice, onLoginSuccess }) => {
  const location = useLocation();

  // Allow public marketing pages and login without auth
  const isMarketing = location.pathname === "/" || location.pathname.startsWith("/marketing");
  const isLoginPage = location.pathname === "/login";
  
  // Check if we need to redirect to login
  const needsAuth = !user && !isLoginPage && !isMarketing;
  
  // If user is logged in and on login page, redirect to dashboard
  const needsDashboardRedirect = user && isLoginPage;

  if (needsAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (needsDashboardRedirect) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ContentWrapper noPadding={isMarketing}>
      <Routes>
        {/* Public Routes: Marketing + Login */}
        <Route path="/" element={<Navigate to="/marketing" replace />} />
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
          path="/invoices"
          element={
            <ProtectedRoute user={user} requiredPermission="invoices.read">
              <InvoiceList />
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
          path="/products"
          element={
            <ProtectedRoute user={user} requiredPermission="products.read">
              <SteelProducts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calculator"
          element={
            <ProtectedRoute user={user}>
              <PriceCalculator />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute user={user} requiredPermission="analytics.read">
              <SalesAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trends"
          element={
            <ProtectedRoute user={user} requiredPermission="analytics.read">
              <RevenueTrends />
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
          path="/stock-movements"
          element={
            <ProtectedRoute user={user}>
              <StockMovement />
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
          path="/transit"
          element={
            <ProtectedRoute user={user} requiredPermission="transit.read">
              <TransitList />
            </ProtectedRoute>
          }
        />

        {/* Catch all route - redirect to dashboard if logged in, marketing if not */}
        <Route
          path="*"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/marketing" replace />
            )
          }
        />
      </Routes>
    </ContentWrapper>
  );
};

export default AppRouter;
