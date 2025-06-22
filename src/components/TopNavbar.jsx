import React, { useState, useRef, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  InputBase, 
  Badge, 
  Avatar, 
  Menu as MuiMenu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Box, 
  Chip,
  Paper,
  ClickAwayListener,
  Popper,
  Fade,
  MenuList
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { Menu, Bell, Search, ChevronDown, User, Settings, LogOut, HelpCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Styled Components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[1],
  zIndex: theme.zIndex.drawer + 1,
  height: '64px',
  [theme.breakpoints.down('sm')]: {
    height: '56px',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    height: '60px',
  },
}));

const SearchContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.spacing(2),
  backgroundColor: alpha(theme.palette.common.white, 0.05),
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.08),
    borderColor: theme.palette.primary.main,
  },
  '&:focus-within': {
    backgroundColor: alpha(theme.palette.common.white, 0.1),
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
  },
  marginLeft: 0,
  width: '100%',
  maxWidth: 400,
  transition: 'all 0.3s ease',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
  [theme.breakpoints.up('lg')]: {
    maxWidth: 500,
  },
  [theme.breakpoints.up('xl')]: {
    maxWidth: 600,
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.5, 1.5, 1.5, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('sm')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
    [theme.breakpoints.up('lg')]: {
      width: '25ch',
      '&:focus': {
        width: '35ch',
      },
    },
    [theme.breakpoints.up('xl')]: {
      width: '30ch',
      '&:focus': {
        width: '40ch',
      },
    },
  },
}));

const UserSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  cursor: 'pointer',
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(1.5),
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 36,
  height: 36,
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  fontSize: '0.875rem',
  fontWeight: 600,
}));

const NotificationMenu = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(1),
  minWidth: 320,
  maxWidth: 400,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[8],
}));

const NotificationItem = styled(Box)(({ theme, unread }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  cursor: 'pointer',
  position: 'relative',
  backgroundColor: unread ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
  '&:last-child': {
    borderBottom: 'none',
  },
}));

const TopNavbar = ({ user, onLogout, onToggleSidebar, currentPage = "Dashboard" }) => {
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const profileDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const { isDarkMode, toggleTheme } = useTheme();

  const handleProfileClick = (event) => {
    setProfileAnchorEl(event.currentTarget);
    setNotificationAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
    setProfileAnchorEl(null);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    setProfileAnchorEl(null);
    onLogout();
  };

  // Mock notifications (you can replace with real data)
  const notifications = [
    { id: 1, title: "New invoice created", message: "Invoice #INV-001 has been generated", time: "2 min ago", unread: true },
    { id: 2, title: "Payment received", message: "Payment for Invoice #INV-002 received", time: "1 hour ago", unread: true },
    { id: 3, title: "System update", message: "Application updated to version 2.1.0", time: "2 hours ago", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <StyledAppBar position="sticky" elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 2, md: 2, lg: 2, xl: 2 }, minHeight: { xs: '56px', sm: '60px', md: '64px' } }}>
        {/* Left Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            color="inherit" 
            onClick={onToggleSidebar}
            sx={{ 
              display: { md: 'none' },
              color: 'text.primary',
              '&:hover': { 
                backgroundColor: alpha('#667eea', 0.1),
                color: 'primary.main',
              }
            }}
          >
            <Menu size={20} />
          </IconButton>
          
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography 
              variant="h6" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
              }}
            >
              {currentPage}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                display: 'block',
                mt: -1,
              }}
            >
              Steel Invoice Pro
            </Typography>
          </Box>
        </Box>

        {/* Center Section - Search */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, justifyContent: 'center', maxWidth: { md: 500, lg: 600, xl: 700 }, mx: { md: 2, lg: 2, xl: 2 } }}>
          <SearchContainer>
            <SearchIconWrapper>
              <Search size={16} />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search invoices, customers..."
              inputProps={{ 'aria-label': 'search' }}
            />
          </SearchContainer>
        </Box>

        {/* Right Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Theme Toggle */}
          <IconButton 
            color="inherit" 
            onClick={toggleTheme}
            sx={{ 
              color: 'text.primary',
              '&:hover': { 
                backgroundColor: alpha('#667eea', 0.1),
                color: 'primary.main',
              }
            }}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </IconButton>

          {/* Notifications */}
          <IconButton 
            color="inherit" 
            onClick={handleNotificationClick}
            sx={{ 
              color: 'text.primary',
              '&:hover': { 
                backgroundColor: alpha('#667eea', 0.1),
                color: 'primary.main',
              }
            }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <Bell size={18} />
            </Badge>
          </IconButton>

          {/* Profile Section */}
          <UserSection onClick={handleProfileClick}>
            <UserAvatar>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </UserAvatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                {user?.role || 'Admin'}
              </Typography>
            </Box>
            <ChevronDown 
              size={16} 
              style={{ 
                color: 'var(--text-secondary)',
                transform: profileAnchorEl ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease'
              }} 
            />
          </UserSection>
        </Box>

        {/* Notification Menu */}
        <Popper 
          open={Boolean(notificationAnchorEl)} 
          anchorEl={notificationAnchorEl} 
          placement="bottom-end"
          transition
          sx={{ zIndex: 1300 }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={200}>
              <ClickAwayListener onClickAway={handleNotificationClose}>
                <NotificationMenu>
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Notifications
                      </Typography>
                      <Chip 
                        label={`${unreadCount} new`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {notifications.map((notification) => (
                      <NotificationItem key={notification.id} unread={notification.unread}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {notification.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {notification.time}
                        </Typography>
                        {notification.unread && (
                          <Box 
                            sx={{ 
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'primary.main'
                            }} 
                          />
                        )}
                      </NotificationItem>
                    ))}
                  </Box>
                  
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                    <Typography 
                      variant="body2" 
                      color="primary" 
                      sx={{ 
                        cursor: 'pointer', 
                        '&:hover': { textDecoration: 'underline' } 
                      }}
                    >
                      View all notifications
                    </Typography>
                  </Box>
                </NotificationMenu>
              </ClickAwayListener>
            </Fade>
          )}
        </Popper>

        {/* Profile Menu */}
        <MuiMenu
          anchorEl={profileAnchorEl}
          open={Boolean(profileAnchorEl)}
          onClose={handleProfileClose}
          PaperProps={{
            sx: { 
              mt: 1,
              minWidth: 280,
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              boxShadow: (theme) => theme.shadows[8],
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <UserAvatar sx={{ width: 48, height: 48 }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </UserAvatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {user?.name || 'User Name'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email || 'user@example.com'}
                </Typography>
                <Chip 
                  label={user?.role || 'Administrator'} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>
          </Box>
          
          <MenuItem onClick={handleProfileClose}>
            <ListItemIcon>
              <User size={18} />
            </ListItemIcon>
            <ListItemText>My Profile</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleProfileClose}>
            <ListItemIcon>
              <Settings size={18} />
            </ListItemIcon>
            <ListItemText>Account Settings</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleProfileClose}>
            <ListItemIcon>
              <HelpCircle size={18} />
            </ListItemIcon>
            <ListItemText>Help & Support</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}>
              <LogOut size={18} />
            </ListItemIcon>
            <ListItemText>Sign Out</ListItemText>
          </MenuItem>
        </MuiMenu>
      </Toolbar>
    </StyledAppBar>
  );
};

export default TopNavbar;