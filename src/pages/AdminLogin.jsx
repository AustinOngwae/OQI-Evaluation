import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@oqi.com');
  const [password, setPassword] = useState('password');
  const { login } = useAdminAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    // The auth context will trigger a re-render via the listener,
    // and AdminRoute will handle the redirect if successful.
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <Shield size={48} className="mx-auto text-brand-primary mb-4" />
            <h1 className="text-2xl font-bold text-white font-sans">Admin Sign In</h1>
            <p className="text-gray-400 font-body">Access the OQI Dashboard</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2"
              size="lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;