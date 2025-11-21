import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button } from '@/components/ui/button';

const AdminPasswordPrompt = ({ onClose }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    const success = await login('admin@oqi.com', password);
    setLoading(false);
    if (success) {
      toast.success('Access granted');
      onClose();
      navigate('/admin');
    } else {
      // The context already shows a toast error for failed login
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 w-full max-w-sm text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-sans">Admin Access</h2>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X size={20} />
          </Button>
        </div>
        <p className="text-gray-300 text-center mb-4 font-body">Enter the password to access the admin dashboard.</p>
        <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter admin password"
            autoFocus
        />
        <Button
          onClick={handleSubmit}
          disabled={loading || !password}
          className="w-full mt-6"
          size="lg"
        >
          {loading ? 'Verifying...' : 'Enter'}
        </Button>
      </div>
    </div>
  );
};

export default AdminPasswordPrompt;