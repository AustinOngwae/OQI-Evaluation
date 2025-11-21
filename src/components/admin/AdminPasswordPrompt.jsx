import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Delete } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button } from '@/components/ui/button';

const AdminPasswordPrompt = ({ onClose }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleKeyPress = (key) => {
    if (password.length < 6) {
      setPassword(password + key);
    }
  };

  const handleDelete = () => {
    setPassword(password.slice(0, -1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const success = await login(password);
    setLoading(false);
    if (success) {
      toast.success('Access granted');
      onClose();
      navigate('/admin');
    } else {
      toast.error('Incorrect password');
      setPassword('');
    }
  };

  const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

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
        <div className="w-full h-12 bg-white/10 rounded-lg flex items-center justify-center text-2xl tracking-[0.5em] mb-6">
          {'*'.repeat(password.length).padEnd(6, ' ')}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {keypadKeys.map((key, index) => (
            <button
              key={index}
              onClick={() => {
                if (key === 'del') handleDelete();
                else if (key) handleKeyPress(key);
              }}
              disabled={!key}
              className="h-16 rounded-lg bg-white/10 text-2xl font-semibold flex items-center justify-center hover:bg-white/20 disabled:opacity-0 transition-colors"
            >
              {key === 'del' ? <Delete size={24} /> : key}
            </button>
          ))}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading || password.length !== 6}
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