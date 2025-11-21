import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLogin from '../../pages/AdminLogin';

const AdminRoute = () => {
  const { isAdminAuthenticated, loading, user } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (user && isAdminAuthenticated) {
    return <Outlet />;
  }
  
  if (user && !isAdminAuthenticated) {
    // Logged in but not an admin, redirect away.
    return <Navigate to="/" replace />;
  }

  // Not logged in at all, show login page.
  return <AdminLogin />;
};

export default AdminRoute;