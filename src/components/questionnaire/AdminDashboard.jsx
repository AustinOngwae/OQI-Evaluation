import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUsers, FiFileText, FiMessageCircle, FiTrendingUp, FiCheck, FiX } = FiIcons;

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Load suggestions
    const storedSuggestions = JSON.parse(localStorage.getItem('questionnaire_suggestions') || '[]');
    setSuggestions(storedSuggestions);

    // Load users (in real app, would come from backend)
    const storedUsers = JSON.parse(localStorage.getItem('questionnaire_users') || '[]');
    setUsers(storedUsers);

    // Calculate stats
    setStats({
      totalUsers: storedUsers.length,
      pendingSuggestions: storedSuggestions.filter(s => s.status === 'pending').length,
      appliedSuggestions: storedSuggestions.filter(s => s.status === 'applied').length,
      questionnairesCompleted: Math.floor(Math.random() * 100) + 50 // Mock data
    });
  };

  const handleSuggestion = (suggestionId, action) => {
    const updatedSuggestions = suggestions.map(s => 
      s.id === suggestionId ? { ...s, status: action, processedBy: user.name, processedAt: new Date().toISOString() } : s
    );
    setSuggestions(updatedSuggestions);
    localStorage.setItem('questionnaire_suggestions', JSON.stringify(updatedSuggestions));
    loadDashboardData();
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage questionnaire system and review community contributions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center">
            <SafeIcon icon={FiUsers} className="text-3xl text-blue-600" />
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-800">{stats.totalUsers}</h3>
              <p className="text-gray-600">Total Users</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center">
            <SafeIcon icon={FiMessageCircle} className="text-3xl text-yellow-600" />
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-800">{stats.pendingSuggestions}</h3>
              <p className="text-gray-600">Pending Suggestions</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center">
            <SafeIcon icon={FiCheck} className="text-3xl text-green-600" />
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-800">{stats.appliedSuggestions}</h3>
              <p className="text-gray-600">Applied Suggestions</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center">
            <SafeIcon icon={FiFileText} className="text-3xl text-purple-600" />
            <div className="ml-4">
              <h3 className="text-2xl font-bold text-gray-800">{stats.questionnairesCompleted}</h3>
              <p className="text-gray-600">Questionnaires Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions Management */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Community Suggestions</h2>
          <p className="text-gray-600 mt-1">Review and manage suggestions from editors and reviewers</p>
        </div>
        
        <div className="p-6">
          {suggestions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No suggestions yet.</p>
          ) : (
            <div className="space-y-4">
              {suggestions.map(suggestion => (
                <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">{suggestion.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          suggestion.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          suggestion.status === 'applied' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {suggestion.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{suggestion.description}</p>
                      <div className="text-sm text-gray-500">
                        <p>Question: {suggestion.questionTitle}</p>
                        <p>Suggested by: {suggestion.author} • {new Date(suggestion.createdAt).toLocaleDateString()}</p>
                        {suggestion.processedBy && (
                          <p>Processed by: {suggestion.processedBy} • {new Date(suggestion.processedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    
                    {suggestion.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleSuggestion(suggestion.id, 'applied')}
                          className="flex items-center bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          <SafeIcon icon={FiCheck} className="mr-1" />
                          Apply
                        </button>
                        <button
                          onClick={() => handleSuggestion(suggestion.id, 'rejected')}
                          className="flex items-center bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          <SafeIcon icon={FiX} className="mr-1" />
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

      {/* User Management */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>
        
        <div className="p-6">
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 text-gray-600 font-medium">Name</th>
                    <th className="py-2 text-gray-600 font-medium">Email</th>
                    <th className="py-2 text-gray-600 font-medium">Role</th>
                    <th className="py-2 text-gray-600 font-medium">Organization</th>
                    <th className="py-2 text-gray-600 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-gray-100">
                      <td className="py-3 text-gray-800">{user.name}</td>
                      <td className="py-3 text-gray-600">{user.email}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'reviewer' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">{user.organization || '-'}</td>
                      <td className="py-3 text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;