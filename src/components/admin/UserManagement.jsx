import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Users, Shield, ShieldCheck } from 'lucide-react';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role');
      if (error) throw error;
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load user data.');
      toast.error('Could not load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    const toastId = toast.loading('Updating user role...');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      toast.success('User role updated successfully!', { id: toastId });
      fetchUsers(); // Refresh the user list
    } catch (err) {
      toast.error(`Failed to update role: ${err.message}`, { id: toastId });
    }
  };

  if (loading) return <p className="text-center py-8">Loading users...</p>;
  if (error) return <p className="text-center py-8 text-red-400">{error}</p>;

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <Users className="mr-2" /> User Management
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/20">
          <thead className="bg-white/10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {user.first_name || ''} {user.last_name || ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <div className="flex items-center">
                    {user.role === 'admin' ? <ShieldCheck className="h-5 w-5 text-green-400 mr-2" /> : <Shield className="h-5 w-5 text-gray-400 mr-2" />}
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={user.id === currentUser.id}
                      className={`bg-white/5 border border-white/20 rounded-lg p-1 text-white focus:ring-2 focus:ring-brand-purple-light focus:border-brand-purple-light transition-colors ${user.id === currentUser.id ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    {user.id === currentUser.id && <span className="text-xs text-gray-400 ml-2">(You)</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;