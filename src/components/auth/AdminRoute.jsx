import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminRoute = () => {
  const { isAdminAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (isAdminAuthenticated) {
    return <Outlet />;
  }
  
  // If not an authenticated admin, redirect to home page.
  // Access must be gained via the password prompt.
  return <Navigate to="/" replace />;
};

export default AdminRoute;