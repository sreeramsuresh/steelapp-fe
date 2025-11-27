/**
 * StockMovementPage
 * Phase 8: Main page for stock movement management
 *
 * Integrates transfers, reservations, and reconciliation in a tabbed interface
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Paper,
  Typography,
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
  BookmarkBorder as ReservationIcon,
  Assessment as ReconciliationIcon,
  Inventory as MovementsIcon,
} from '@mui/icons-material';
import {
  TransferList,
  TransferForm,
  ReservationList,
  ReservationForm,
  ReconciliationDashboard,
} from '../components/stock-movement';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Tab panel component
 */
const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && children}
  </div>
);

const StockMovementPage = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  // Sub-views for transfers
  const [transferView, setTransferView] = useState('list'); // 'list' | 'create' | 'view'
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  // Sub-views for reservations
  const [reservationView, setReservationView] = useState('list');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showReservationForm, setShowReservationForm] = useState(false);

  // Handle transfer navigation
  const handleTransferCreateNew = () => {
    setTransferView('create');
  };

  const handleTransferCreated = (transfer) => {
    setTransferView('list');
    // Could show success toast here
  };

  const handleTransferCancel = () => {
    setTransferView('list');
  };

  const handleViewTransfer = (transfer) => {
    setSelectedTransfer(transfer);
    setTransferView('view');
  };

  // Handle reservation navigation
  const handleReservationCreateNew = () => {
    setShowReservationForm(true);
  };

  const handleReservationCreated = (reservation) => {
    setShowReservationForm(false);
    // Could show success toast here
  };

  const handleViewReservation = (reservation) => {
    setSelectedReservation(reservation);
    // TODO: Implement reservation detail view
    console.log('View reservation:', reservation);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Reset sub-views when changing tabs
    setTransferView('list');
    setReservationView('list');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
        py: 3,
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <MovementsIcon fontSize="large" color="primary" />
            <Typography variant="h4" component="h1">
              Stock Movement Management
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Manage inter-warehouse transfers, stock reservations, and reconciliation
          </Typography>
        </Box>

        {/* Main Tabs */}
        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              icon={<TransferIcon />}
              label="Transfers"
              iconPosition="start"
            />
            <Tab
              icon={<ReservationIcon />}
              label="Reservations"
              iconPosition="start"
            />
            <Tab
              icon={<ReconciliationIcon />}
              label="Reconciliation"
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          {transferView === 'list' && (
            <TransferList
              onCreateNew={handleTransferCreateNew}
              onViewTransfer={handleViewTransfer}
            />
          )}
          {transferView === 'create' && (
            <TransferForm
              onCancel={handleTransferCancel}
              onSuccess={handleTransferCreated}
            />
          )}
          {transferView === 'view' && selectedTransfer && (
            <Box>
              {/* Simple transfer detail view - could be expanded */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Transfer Details: {selectedTransfer.transferNumber}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography>
                    <strong>Status:</strong> {selectedTransfer.status}
                  </Typography>
                  <Typography>
                    <strong>From:</strong> {selectedTransfer.sourceWarehouseName}
                  </Typography>
                  <Typography>
                    <strong>To:</strong> {selectedTransfer.destinationWarehouseName}
                  </Typography>
                  <Typography>
                    <strong>Items:</strong> {selectedTransfer.items?.length || 0}
                  </Typography>
                  {selectedTransfer.notes && (
                    <Typography>
                      <strong>Notes:</strong> {selectedTransfer.notes}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ mt: 3 }}>
                  <button onClick={handleTransferCancel}>Back to List</button>
                </Box>
              </Paper>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ReservationList
            onCreateNew={handleReservationCreateNew}
            onViewReservation={handleViewReservation}
          />
          <ReservationForm
            open={showReservationForm}
            onClose={() => setShowReservationForm(false)}
            onSuccess={handleReservationCreated}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <ReconciliationDashboard />
        </TabPanel>
      </Container>
    </Box>
  );
};

export default StockMovementPage;
