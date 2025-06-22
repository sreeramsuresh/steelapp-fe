import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Typography, Alert, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Lock, ArrowBack } from '@mui/icons-material';
import { authService } from '../services/axiosAuthService';

const UnauthorizedContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  padding: theme.spacing(4),
  textAlign: 'center',
}));

const ProtectedRoute = ({ 
  children, 
  user, 
  requiredRole, 
  requiredPermission,
  fallbackPath = '/login' 
}) => {
  const location = useLocation();

  // Check if user is authenticated
  if (!user || !authService.isAuthenticated()) {
    // Save the attempted location for redirect after login
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role-based access
  if (requiredRole && !authService.hasRole(requiredRole)) {
    return (
      <UnauthorizedContainer>
        <Lock sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom color="error">
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You don't have the required role ({requiredRole}) to access this page.
        </Typography>
        <Alert severity="warning" sx={{ mb: 3, maxWidth: 400 }}>
          Current role: <strong>{authService.getUserRole()}</strong>
          <br />
          Required role: <strong>{requiredRole}</strong>
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </UnauthorizedContainer>
    );
  }

  // Check permission-based access
  if (requiredPermission) {
    const [resource, action] = requiredPermission.split('.');
    
    if (!authService.hasPermission(resource, action)) {
      return (
        <UnauthorizedContainer>
          <Lock sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom color="warning.main">
            Insufficient Permissions
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You don't have permission to {action} {resource}.
          </Typography>
          <Alert severity="info" sx={{ mb: 3, maxWidth: 400 }}>
            Required permission: <strong>{requiredPermission}</strong>
            <br />
            Contact your administrator to request access.
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </UnauthorizedContainer>
      );
    }
  }

  // User is authenticated and authorized
  return children;
};

export default ProtectedRoute;