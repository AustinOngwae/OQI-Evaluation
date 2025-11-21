import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminPasswordPrompt from '../admin/AdminPasswordPrompt';

const AdminRoute = () => {
  const { isAdmin } = useAdminAuth();
  const navigate = useNavigate();

  if (!isAdmin) {
    return <AdminPasswordPrompt onClose={() => navigate('/')} />;
  }

  return <Outlet />;
};

export default AdminRoute;