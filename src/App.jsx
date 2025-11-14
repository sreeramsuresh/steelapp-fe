import { useState, useEffect } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import AppRouter from './components/AppRouter';
import NotificationProvider from './components/NotificationProvider';
import { NotificationCenterProvider } from './contexts/NotificationCenterContext';
import { authService } from './services/axiosAuthService';

// Initialize auth service on app load
authService.initialize();


// Helper component to get current page title
const AppContent = ({ user, sidebarOpen, setSidebarOpen, handleLogout, handleSaveInvoice, onLoginSuccess }) => {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  
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

  // If on login or public marketing pages (including root), show only the router content
  const isPublicMarketing = location.pathname === '/' || location.pathname.startsWith('/marketing');

  // Toggle global scrolling depending on public vs. app pages
  useEffect(() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    if (isPublicMarketing || location.pathname === '/login') {
      // Allow normal page scroll for public pages
      htmlEl.style.overflow = 'auto';
      htmlEl.style.height = 'auto';
      bodyEl.style.overflow = 'auto';
      bodyEl.style.height = 'auto';
    } else {
      // Preserve app behavior: single scroll container inside app layout
      htmlEl.style.overflow = 'hidden';
      htmlEl.style.height = '100vh';
      bodyEl.style.overflow = 'hidden';
      bodyEl.style.height = '100vh';
    }

    // Cleanup on unmount
    return () => {
      htmlEl.style.overflow = '';
      htmlEl.style.height = '';
      bodyEl.style.overflow = '';
      bodyEl.style.height = '';
    };
  }, [isPublicMarketing, location.pathname]);
  if (location.pathname === '/login' || isPublicMarketing) {
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
    <div className={`relative min-h-screen max-h-screen overflow-hidden w-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      {/* Sidebar Overlay for mobile */}
      <div className={`md:hidden ${sidebarOpen ? 'block' : 'hidden'} fixed inset-0 bg-black bg-opacity-50 z-[999]`} onClick={toggleSidebar} />
      
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        invoiceCount={0}
      />
      
      <div className={`${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'} h-screen transition-all duration-300 ease-in-out z-[1] overflow-auto flex flex-col ${
        sidebarOpen ? 'md:ml-[260px] xl:ml-[280px]' : 'md:ml-0'
      }`}>
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
      </div>
    </div>
  );
};

// Themed App wrapper that uses the theme context
const ThemedApp = ({ isLoading, ...props }) => {
  const { isDarkMode } = useTheme();

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen gap-4 ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Loading ULTIMATE STEELS...</span>
      </div>
    );
  }

  return <AppContent {...props} />;
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        // Exact GigLabz behavior: do not proactively verify/refresh on load.
        // Just hydrate user from storage if tokens exist; rely on interceptor (403) to refresh.
        if (authService.isAuthenticated()) {
          const storedUser = authService.getUser();
          if (storedUser && mounted) setUser(storedUser);
        } else if (mounted) {
          setUser(null);
        }
      } catch (error) {
        if (mounted) console.error('Failed to initialize app:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeApp();

    return () => {
      mounted = false;
    };
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
    console.log('🚨 App.jsx handleLogout called!');
    console.log('🚨 Current user:', user);
    try {
      console.log('🚨 Calling authService.logout()...');
      await authService.logout();
      console.log('🚨 authService.logout() completed successfully');
    } catch (error) {
      console.warn('🚨 Logout failed:', error);
    } finally {
      console.log('🚨 Setting user to null...');
      setUser(null);
      console.log('🚨 User set to null, logout complete');
    }
  };


  if (loading) {
    return (
      <ThemeProvider>
        <ThemedApp isLoading={true} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <NotificationCenterProvider>
          <NotificationProvider>
            <ThemedApp 
              user={user}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              handleLogout={handleLogout}
              handleSaveInvoice={handleSaveInvoice}
              onLoginSuccess={handleLoginSuccess}
            />
          </NotificationProvider>
        </NotificationCenterProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
