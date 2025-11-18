import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { LogOut } from 'lucide-react';

const Navbar = () => {
  const { isAdminAuthenticated, logout } = useAdminAuth();

  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img src="/gesda-logo.png" alt="GESDA Logo" className="h-10" />
          </Link>
          <div className="flex items-center space-x-4">
            {isAdminAuthenticated && (
              <button onClick={logout} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                <LogOut size={16} />
                Exit Admin
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;