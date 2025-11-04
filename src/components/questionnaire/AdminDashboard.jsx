import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import DashboardStats from '../admin/DashboardStats'; // Import the new component

const AdminDashboard = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (user?.role !== 'admin') {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('suggestions')
          .select(`
            *,
            profiles (
              first_name,
              last_name,
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSuggestions(data);
      } catch (error) {
        toast.error('Failed to load suggestions.');
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [user]);

  const handleStatusChange = async (id, newStatus) => {
    const toastId = toast.loading('Updating status...');
    try {
      const { error } = await supabase
        .from('suggestions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setSuggestions(prev =>
        prev.map(s => (s.id === id ? { ...s, status: newStatus } : s))
      );
      toast.success('Status updated successfully!', { id: toastId });
    } catch (error) {
      toast.error(`Update failed: ${error.message}`, { id: toastId });
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
      
      {/* Analytics Section */}
      <DashboardStats />

      {/* Suggestions Management Section */}
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Evaluation Suggestions</h2>
        {loading ? (
          <p>Loading suggestions...</p>
        ) : suggestions.length === 0 ? (
          <p className="text-gray-500">No suggestions have been submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitter</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggestion</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suggestions.map(s => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{s.profiles?.first_name || 'Unknown'} {s.profiles?.last_name}</div>
                      <div className="text-sm text-gray-500">{s.profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{s.title}</div>
                      <div className="text-sm text-gray-600 max-w-xs truncate">{s.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        s.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        s.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {s.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button onClick={() => handleStatusChange(s.id, 'approved')} className="text-green-600 hover:text-green-900">Approve</button>
                          <button onClick={() => handleStatusChange(s.id, 'rejected')} className="text-red-600 hover:text-red-900">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;