import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Components
import Dashboard from './Dashboard';
import InvoiceForm from '../pages/InvoiceForm';
import InvoiceList from '../pages/InvoiceList';
import CustomerManagement from './CustomerManagement';
import SteelProducts from './SteelProducts';
import PriceCalculator from './PriceCalculator';
import SalesAnalytics from './SalesAnalytics';
import CompanySettings from './CompanySettings';
import RevenueTrends from './RevenueTrends';
import StockMovement from './StockMovement';
import InventoryList from './InventoryList';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute';

const ContentWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  maxWidth: '100%',
  minHeight: 'calc(100vh - 64px)',
  backgroundColor: theme.palette.background.default,
}));

const AppRouter = ({ 
  user, 
  handleSaveInvoice, 
  onLoginSuccess 
}) => {
  const location = useLocation();

  // If user is not logged in and not on login page, redirect to login
  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in and on login page, redirect to dashboard
  if (user && location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ContentWrapper>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={<Login onLoginSuccess={onLoginSuccess} />} 
        />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute user={user}>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute user={user}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/create-invoice" element={
          <ProtectedRoute user={user} requiredPermission="invoices.create">
            <InvoiceForm onSave={handleSaveInvoice} />
          </ProtectedRoute>
        } />
        
        <Route path="/edit/:id" element={
          <ProtectedRoute user={user} requiredPermission="invoices.update">
            <InvoiceForm 
              onSave={handleSaveInvoice} 
            />
          </ProtectedRoute>
        } />
        
        <Route path="/invoices" element={
          <ProtectedRoute user={user} requiredPermission="invoices.read">
            <InvoiceList />
          </ProtectedRoute>
        } />
        
        <Route path="/drafts" element={
          <ProtectedRoute user={user} requiredPermission="invoices.read">
            <InvoiceList defaultStatusFilter="draft" />
          </ProtectedRoute>
        } />
        
        <Route path="/customers" element={
          <ProtectedRoute user={user} requiredPermission="customers.read">
            <CustomerManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/products" element={
          <ProtectedRoute user={user} requiredPermission="products.read">
            <SteelProducts />
          </ProtectedRoute>
        } />
        
        <Route path="/calculator" element={
          <ProtectedRoute user={user}>
            <PriceCalculator />
          </ProtectedRoute>
        } />
        
        <Route path="/analytics" element={
          <ProtectedRoute user={user} requiredPermission="analytics.read">
            <SalesAnalytics />
          </ProtectedRoute>
        } />
        
        <Route path="/trends" element={
          <ProtectedRoute user={user} requiredPermission="analytics.read">
            <RevenueTrends />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute user={user} requiredRole="admin">
            <CompanySettings />
          </ProtectedRoute>
        } />
        
        <Route path="/stock-movements" element={
          <ProtectedRoute user={user}>
            <StockMovement />
          </ProtectedRoute>
        } />
        
        <Route path="/inventory" element={
          <ProtectedRoute user={user}>
            <InventoryList />
          </ProtectedRoute>
        } />
        
        {/* Catch all route - redirect to dashboard if logged in, login if not */}
        <Route path="*" element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } />
      </Routes>
    </ContentWrapper>
  );
};

export default AppRouter;