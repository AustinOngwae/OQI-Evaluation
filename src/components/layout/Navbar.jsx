import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../integrations/supabase/client'; // Add this line

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="w-full flex justify-between items-center p-4 bg-white shadow-md">
      <Link to="/" className="text-xl font-bold">OQI Evaluation</Link>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            {user.role === 'admin' && (
              <Link to="/admin">
                <Button variant="ghost">Admin Dashboard</Button>
              </Link>
            )}
            <Button variant="ghost" onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;