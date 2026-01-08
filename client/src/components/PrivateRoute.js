import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle role checking - can be string or array
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    
    // Super-admin and sub-admin can access admin routes
    if (allowedRoles.includes('admin') || allowedRoles.includes('super-admin') || allowedRoles.includes('sub-admin')) {
      if (['admin', 'super-admin', 'sub-admin'].includes(user.role)) {
        return children;
      }
    }
    
    // Check if user role matches any allowed role
    if (!allowedRoles.includes(user.role)) {
      // Redirect based on user role
      if (['admin', 'super-admin', 'sub-admin'].includes(user.role)) {
        return <Navigate to="/admin" replace />;
      } else {
        return <Navigate to="/employee" replace />;
      }
    }
  }

  return children;
};

export default PrivateRoute;

