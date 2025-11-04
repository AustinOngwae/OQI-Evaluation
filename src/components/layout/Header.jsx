import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const toastId = toast.loading('Signing out...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully', { id: toastId });
      navigate('/');
    } catch (error) {
      toast.error(`Sign out failed: ${error.message}`, { id: toastId });
    }
  };

  const navLinks = (
    <ul className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
      <li><Link to="/questionnaire" className="text-gray-600 hover:text-purple-600 transition-colors">Questionnaire</Link></li>
      <li><Link to="/resources" className="text-gray-600 hover:text-purple-600 transition-colors">Resources</Link></li>
      {user && user.role === 'admin' && (
        <li><Link to="/admin" className="text-gray-600 hover:text-purple-600 transition-colors">Admin</Link></li>
      )}
      {user ? (
        <>
          <li><Link to="/profile" className="text-gray-600 hover:text-purple-600 transition-colors">Profile</Link></li>
          <li>
            <button
              onClick={handleSignOut}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Sign Out
            </button>
          </li>
        </>
      ) : (
        !loading && (
          <>
            <li><Link to="/login" className="text-gray-600 hover:text-purple-600 transition-colors">Login</Link></li>
            <li><Link to="/signup" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">Sign Up</Link></li>
          </>
        )
      )}
    </ul>
  );

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-purple-600">OQI</Link>
          </div>
          <div className="hidden md:block">
            {navLinks}
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 hover:text-purple-600">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4">
          {navLinks}
        </div>
      )}
    </header>
  );
};

export default Header;