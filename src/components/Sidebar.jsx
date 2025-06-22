import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Badge
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Home,
  FileText, 
  Plus, 
  List as ListIcon, 
  Settings, 
  BarChart3, 
  Users, 
  Package,
  Calculator,
  TrendingUp
} from 'lucide-react';

// Styled Components
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 260,
    background: theme.palette.background.paper,
    border: 'none',
    overflow: 'hidden',
    height: '100vh',
    [theme.breakpoints.up('xl')]: {
      width: 280,
    },
  },
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  background: theme.palette.background.paper,
  height: '64px',
  display: 'flex',
  alignItems: 'center',
  boxSizing: 'border-box',
  [theme.breakpoints.down('sm')]: {
    height: '56px',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    height: '60px',
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  textDecoration: 'none',
  color: theme.palette.text.primary,
  '&:hover': {
    textDecoration: 'none',
    color: theme.palette.text.primary,
  },
}));

const LogoIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: theme.spacing(1),
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(2, 2, 1, 2),
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: theme.palette.text.secondary,
}));

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ theme, active }) => ({
  margin: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1, 2),
  minHeight: 48,
  color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
  background: active ? theme.palette.primary.main : 'transparent',
  '&:hover': {
    background: active 
      ? theme.palette.primary.dark
      : theme.palette.action.hover,
  },
  '& .MuiListItemIcon-root': {
    minWidth: 'auto',
    marginRight: theme.spacing(2),
    color: 'inherit',
  },
  '& .MuiListItemText-primary': {
    fontSize: '0.875rem',
    fontWeight: active ? 600 : 500,
  },
}));


const CustomBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    background: theme.palette.info.main,
    color: theme.palette.info.contrastText,
    fontSize: '0.65rem',
    minWidth: '18px',
    height: '18px',
    fontWeight: 600,
  },
}));

const Sidebar = ({ isOpen, onToggle, invoiceCount }) => {
  const location = useLocation();
  
  const navigationItems = [
    {
      section: 'Dashboard',
      items: [
        {
          name: 'Dashboard',
          path: '/',
          icon: Home,
          description: 'Overview & Analytics'
        }
      ]
    },
    {
      section: 'Invoices',
      items: [
        {
          name: 'Create Invoice',
          path: '/create-invoice',
          icon: Plus,
          description: 'Create new invoice'
        },
        {
          name: 'All Invoices',
          path: '/invoices',
          icon: ListIcon,
          description: 'View all invoices',
          badge: invoiceCount
        },
        {
          name: 'Draft Invoices',
          path: '/drafts',
          icon: FileText,
          description: 'Manage draft invoices'
        }
      ]
    },
    {
      section: 'Business',
      items: [
        {
          name: 'Customers',
          path: '/customers',
          icon: Users,
          description: 'Manage customers'
        },
        {
          name: 'Steel Products',
          path: '/products',
          icon: Package,
          description: 'Manage steel inventory'
        },
        {
          name: 'Price Calculator',
          path: '/calculator',
          icon: Calculator,
          description: 'Steel price calculator'
        }
      ]
    },
    {
      section: 'Reports',
      items: [
        {
          name: 'Sales Analytics',
          path: '/analytics',
          icon: BarChart3,
          description: 'View sales reports'
        },
        {
          name: 'Revenue Trends',
          path: '/trends',
          icon: TrendingUp,
          description: 'Revenue analytics'
        }
      ]
    },
    {
      section: 'Settings',
      items: [
        {
          name: 'Company Settings',
          path: '/settings',
          icon: Settings,
          description: 'Configure company details'
        }
      ]
    }
  ];

  const isActiveRoute = (path) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/dashboard')) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <StyledDrawer
      variant="permanent"
      open={isOpen}
      sx={{
        width: isOpen ? { xs: 260, xl: 280 } : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: { xs: 260, xl: 280 },
          boxSizing: 'border-box',
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        },
        '@media (max-width: 768px)': {
          '& .MuiDrawer-paper': {
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          },
        },
      }}
    >
      {/* Sidebar Header */}
      <SidebarHeader>
        <LogoContainer component={Link} to="/">
          <LogoIcon>
            <FileText size={20} />
          </LogoIcon>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>
              Steel Invoice Pro
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.75rem' }}>
              Business Management
            </Typography>
          </Box>
        </LogoContainer>
      </SidebarHeader>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {navigationItems.map((section, sectionIndex) => (
          <Box key={sectionIndex}>
            {section.section !== 'Dashboard' && (
              <SectionTitle variant="overline">
                {section.section}
              </SectionTitle>
            )}
            <List disablePadding>
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);
                
                return (
                  <ListItem key={itemIndex} disablePadding>
                    <StyledListItemButton
                      component={Link}
                      to={item.path}
                      active={isActive}
                      onClick={() => window.innerWidth <= 768 && onToggle()}
                      title={item.description}
                    >
                      <ListItemIcon>
                        <Icon size={20} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.name}
                        sx={{ 
                          '& .MuiListItemText-primary': {
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 600 : 500,
                          }
                        }}
                      />
                      {item.badge && (
                        <CustomBadge 
                          badgeContent={item.badge} 
                          sx={{ marginLeft: 'auto' }}
                        />
                      )}
                    </StyledListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

    </StyledDrawer>
  );
};

export default Sidebar;