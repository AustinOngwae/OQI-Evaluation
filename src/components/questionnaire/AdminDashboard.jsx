import React, { useState, useEffect } from 'react';
import SafeIcon from '../common/SafeIcon';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import { Users, FileText, MessageCircle, Check, X, TrendingUp } from 'lucide-react';

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load suggestions from Supabase
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from('question_suggestions')
        .select('*')
        .order('created_at', { ascending: false });
      if (suggestionsError) throw suggestionsError;
      setSuggestions(suggestionsData);

      // Mock users for now
      const mockUsers = [
        { id: 'mock-admin-1', name: 'Admin User', email: 'admin@example.com', role: 'admin', organization: 'UN-HABITAT', createdAt: new Date().toISOString() },
        { id: 'mock-editor-1', name: 'Editor User', email: 'editor@example.com', role: 'editor', organization: 'City Planning', createdAt: new Date().toISOString() },
        { id: 'mock-user-1', name: 'Regular User', email: 'user@example.com', role: 'user', organization: 'Community Member', createdAt: new Date().toISOString() },
      ];
      setUsers(mockUsers);

      // Calculate stats
      setStats({
        totalUsers: mockUsers.length,
        pendingSuggestions: suggestionsData.filter(s => s.status === 'pending').length,
        appliedSuggestions: suggestionsData.filter(s => s.status === 'approved').length,
        questionnairesCompleted: Math.floor(Math.random() * 100) + 50 // Mock data
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error.message);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = async (suggestion, action) => {
    const toastId = toast.loading('Processing suggestion...');
    try {
      if (action === 'approved') {
        const { suggestion_type, payload, question_id } = suggestion;
        let dbError = null;

        switch (suggestion_type) {
          case 'add':
            const { error: addError } = await supabase.from('questions').insert(payload);
            dbError = addError;
            break;
          case 'edit':
            const { error: editError } = await supabase.from('questions').update(payload).eq('id', question_id);
            dbError = editError;
            break;
          case 'delete':
            const { error: deleteError } = await supabase.from('questions').delete().eq('id', question_id);
            dbError = deleteError;
            break;
          default:
            throw new Error(`Unknown suggestion type: ${suggestion_type}`);
        }
        if (dbError) throw dbError;
      }

      // Update suggestion status
      const { error: updateStatusError } = await supabase
        .from('question_suggestions')
        .update({ status: action, resolved_at: new Date().toISOString(), resolved_by: user.id })
        .eq('id', suggestion.id);
      if (updateStatusError) throw updateStatusError;

      toast.success(`Suggestion ${action}.`, { id: toastId });
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error processing suggestion:', error.message);
      toast.error(`Failed to process suggestion: ${error.message}`, { id: toastId });
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  const renderPayload = (suggestion) => {
    const { suggestion_type, payload } = suggestion;
    return (
      <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
        <p><strong>Type:</strong> {suggestion_type}</p>
        <pre className="whitespace-pre-wrap break-all">{JSON.stringify(payload, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage questionnaire system and review community contributions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Users} title="Total Users" value={stats.totalUsers} color="blue" />
        <StatCard icon={MessageCircle} title="Pending Suggestions" value={stats.pendingSuggestions} color="yellow" />
        <StatCard icon={Check} title="Applied Suggestions" value={stats.appliedSuggestions} color="green" />
        <StatCard icon={FileText} title="Questionnaires Completed" value={stats.questionnairesCompleted} color="purple" />
      </div>

      {/* Suggestions Management */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Community Suggestions</h2>
          <p className="text-gray-600 mt-1">Review and manage suggestions from editors</p>
        </div>
        
        <div className="p-6">
          {loading ? <p>Loading suggestions...</p> : suggestions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No suggestions yet.</p>
          ) : (
            <div className="space-y-4">
              {suggestions.map(suggestion => (
                <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800 capitalize">{suggestion.suggestion_type} suggestion for "{suggestion.question_title_context || 'New Question'}"</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          suggestion.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          suggestion.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {suggestion.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2 italic">"{suggestion.comment}"</p>
                      {renderPayload(suggestion)}
                      <div className="text-sm text-gray-500 mt-2">
                        <p>Suggested by: {suggestion.author_name_context} • {new Date(suggestion.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {suggestion.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleSuggestion(suggestion, 'approved')}
                          className="flex items-center bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          <Check size={16} className="mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleSuggestion(suggestion, 'rejected')}
                          className="flex items-center bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          <X size={16} className="mr-1" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, color }) => {
  const colors = {
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  };
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <div className="flex items-center">
        <Icon className={`w-8 h-8 ${colors[color]}`} />
        <div className="ml-4">
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
          <p className="text-gray-600">{title}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;