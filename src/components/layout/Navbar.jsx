import { Button } from "@/components/ui/button";
import { useAuth } from "../../../src/context/AuthContext";
import { Link } from "react-router-dom";

const Navbar = () => {
  const { user, loading } = useAuth();

  return (
    <nav className="w-full bg-white shadow-md p-4 flex justify-between items-center">
      <div className="text-lg font-bold text-gray-800">Evaluation App</div>
      <div className="flex items-center space-x-4">
        <Link to="/">
          <Button variant="ghost">Home</Button>
        </Link>
        {user && (
          <Link to="/suggest-evaluation">
            <Button variant="ghost">Suggest Evaluation</Button>
          </Link>
        )}
        {user && user.role === 'admin' && (
          <Link to="/admin">
            <Button variant="ghost">Admin Dashboard</Button>
          </Link>
        )}
        {user ? (
          <Button onClick={() => supabase.auth.signOut()} variant="outline">
            Logout
          </Button>
        ) : (
          <Link to="/login">
            <Button variant="default">Login</Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;