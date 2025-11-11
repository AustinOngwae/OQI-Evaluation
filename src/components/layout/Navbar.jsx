import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const toastId = toast.loading('Signing out...');
    try {
      await logout();
      toast.success('Signed out successfully', { id: toastId });
      navigate('/login');
    } catch (error) {
      toast.error(`Sign out failed: ${error.message}`, { id: toastId });
    }
  };

  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-white">
            GESDA OQI Tool
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-300 hidden sm:block">
                  Welcome, {user.first_name || user.email}
                </span>
                <button onClick={handleLogout} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                  <LogOut size={16} />
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login">
                <button className="btn-primary">Login / Sign Up</button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;