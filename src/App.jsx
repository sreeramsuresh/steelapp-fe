import { useState, useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import muiTheme from './theme/muiTheme';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import AppRouter from './components/AppRouter';
import { authService } from './services/axiosAuthService';
import { styled } from '@mui/material/styles';

// Initialize auth service on app load
authService.initialize();

// Styled Components
const AppContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '100vh',
  maxHeight: '100vh',
  background: theme.palette.background.default,
  overflow: 'hidden',
  width: '100vw',
}));

const SidebarOverlay = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: open ? 'block' : 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
}));

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'sidebarOpen',
})(({ theme, sidebarOpen }) => ({
  background: theme.palette.background.default,
  height: '100vh',
  position: 'absolute',
  top: 0,
  left: sidebarOpen ? '260px' : '0',
  right: 0,
  transition: 'left 0.3s ease',
  zIndex: 1,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.up('xl')]: {
    left: sidebarOpen ? '280px' : '0',
  },
  [theme.breakpoints.down('md')]: {
    left: 0,
    position: 'relative',
  },
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  padding: 0,
  width: '100%',
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: theme.palette.background.default,
  gap: theme.spacing(2),
}));

// Helper component to get current page title
const AppContent = ({ user, sidebarOpen, setSidebarOpen, handleLogout, handleSaveInvoice, onLoginSuccess }) => {
  const location = useLocation();
  
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/':
      case '/dashboard':
        return 'Dashboard';
      case '/login':
        return 'Login';
      case '/create-invoice':
        return 'Create Invoice';
      case '/invoices':
        return 'All Invoices';
      case '/drafts':
        return 'Draft Invoices';
      case '/customers':
        return 'Customer Management';
      case '/products':
        return 'Steel Products';
      case '/calculator':
        return 'Price Calculator';
      case '/analytics':
        return 'Sales Analytics';
      case '/trends':
        return 'Revenue Trends';
      case '/settings':
        return 'Company Settings';
      default:
        if (path.includes('/edit/')) {
          return 'Edit Invoice';
        }
        return 'Dashboard';
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // If on login page, show only the router content
  if (location.pathname === '/login') {
    return (
      <AppRouter
        user={user}
        handleSaveInvoice={handleSaveInvoice}
        onLoginSuccess={onLoginSuccess}
      />
    );
  }

  // For authenticated routes, show full layout
  return (
    <AppContainer>
      <SidebarOverlay open={sidebarOpen} onClick={toggleSidebar} />
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        invoiceCount={0}
      />
      
      <MainContent sidebarOpen={sidebarOpen}>
        <TopNavbar 
          user={user}
          onLogout={handleLogout}
          onToggleSidebar={toggleSidebar}
          currentPage={getPageTitle()}
        />
        
        <AppRouter
          user={user}
          handleSaveInvoice={handleSaveInvoice}
          onLoginSuccess={onLoginSuccess}
        />
      </MainContent>
    </AppContainer>
  );
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if user is authenticated
        if (authService.isAuthenticated()) {
          const storedUser = authService.getUser();
          
          // Try to verify token with server
          try {
            const isValid = await authService.verifyToken();
            
            if (isValid) {
              const currentUser = authService.getUser();
              setUser(currentUser);
            } else {
              // Token verification failed
              authService.clearSession();
            }
          } catch (apiError) {
            // Token might be expired or invalid
            console.warn('Token verification failed:', apiError);
            authService.clearSession();
          }
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        authService.clearSession();
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSaveInvoice = (invoice) => {
    // Invoice state is now managed by individual components
    console.log('Invoice saved:', invoice.invoiceNumber);
  };

  const handleLoginSuccess = async (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout failed:', error);
    } finally {
      setUser(null);
    }
  };


  if (loading) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <LoadingContainer>
          <CircularProgress size={32} />
          <Typography color="text.primary">Loading Steel Invoice Pro...</Typography>
        </LoadingContainer>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Router>
        <AppContent 
          user={user}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          handleLogout={handleLogout}
          handleSaveInvoice={handleSaveInvoice}
          onLoginSuccess={handleLoginSuccess}
        />
      </Router>
    </ThemeProvider>
  );
}

export default App;
