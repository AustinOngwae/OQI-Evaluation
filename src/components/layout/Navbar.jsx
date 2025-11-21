import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, UserCog, Edit } from 'lucide-react';

const Navbar = () => {
  const { isAdmin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClasses = ({ isActive }) =>
    `font-sans font-semibold transition-colors duration-200 flex items-center ${
      isActive ? 'text-white' : 'text-gray-400 hover:text-white'
    }`;

  return (
    <header className="bg-black/20 backdrop-blur-lg sticky top-0 z-40 border-b border-white/10">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex-shrink-0">
              <img className="h-8 w-auto" src="/oqi-logo.png" alt="OQI Logo" />
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <NavLink to="/questionnaire" className={navLinkClasses}>
                Evaluation
              </NavLink>
              <NavLink to="/editor" className={navLinkClasses}>
                <Edit size={16} className="mr-2" />
                Editor
              </NavLink>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAdmin ? (
              <>
                <NavLink to="/admin" className={navLinkClasses}>
                  <UserCog size={16} className="mr-2" />
                  Admin
                </NavLink>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut size={16} className="mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <NavLink to="/admin" className={navLinkClasses}>
                Admin Login
              </NavLink>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;