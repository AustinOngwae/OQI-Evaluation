import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';
import { useSession } from '../../context/SessionContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield } from 'lucide-react';

const Navbar = () => {
  const { session, profile, isAdmin } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-white/10 text-white'
        : 'text-gray-300 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <header className="bg-gray-900/50 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <img className="h-10 w-auto" src="/oqi-logo.png" alt="OQI Logo" />
            </Link>
            <nav className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <NavLink to="/" className={navLinkClasses} end>Home</NavLink>
                <NavLink to="/questionnaire" className={navLinkClasses}>Evaluation</NavLink>
                <NavLink to="/editor" className={navLinkClasses}>Editor</NavLink>
                {isAdmin && (
                  <NavLink to="/admin" className={navLinkClasses}>
                    <Shield size={16} className="mr-2" /> Admin
                  </NavLink>
                )}
              </div>
            </nav>
          </div>
          <div className="flex items-center">
            {session ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{profile?.first_name || profile?.email}</p>
                  {isAdmin && <p className="text-xs text-brand-primary">Administrator</p>}
                </div>
                <Button onClick={handleLogout} variant="secondary" size="sm">
                  <LogOut size={16} className="mr-2" /> Logout
                </Button>
              </div>
            ) : (
              <Button asChild>
                <Link to="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;