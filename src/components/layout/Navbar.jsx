import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Shield, Edit, LogOut } from 'lucide-react';
import EditorPasswordPrompt from '../auth/EditorPasswordPrompt';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [showEditorPrompt, setShowEditorPrompt] = useState(false);
  const { isAdminAuthenticated, logout } = useAdminAuth();

  const activeLinkStyle = {
    color: '#4ade80', // brand-primary
    boxShadow: '0 2px 0 #4ade80',
  };

  return (
    <>
      {showEditorPrompt && <EditorPasswordPrompt onClose={() => setShowEditorPrompt(false)} />}
      <nav className="bg-gray-900/50 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <img className="h-10" src="/oqi-logo.png" alt="OQI Logo" />
              </Link>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <NavLink
                    to="/"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                  >
                    Home
                  </NavLink>
                  <NavLink
                    to="/questionnaire"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                  >
                    Evaluation Tool
                  </NavLink>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setShowEditorPrompt(true)}>
                <Edit size={16} className="mr-2" /> Editor
              </Button>
              {isAdminAuthenticated ? (
                <>
                  <Button asChild variant="ghost">
                    <Link to="/admin"><Shield size={16} className="mr-2" /> Dashboard</Link>
                  </Button>
                  <Button variant="outline" onClick={logout}>
                    <LogOut size={16} className="mr-2" /> Logout
                  </Button>
                </>
              ) : (
                <Button asChild variant="ghost">
                  <Link to="/admin"><Shield size={16} className="mr-2" /> Admin</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;