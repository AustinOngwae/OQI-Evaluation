import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import { Users, FileText, MessageCircle, Check, X, BarChart2, Lightbulb } from 'lucide-react';
import AnalyticsDashboard from './AnalyticsDashboard';
import { useAuth } from '../../context/AuthContext';

const extractMappingsFromPayload = (payload) => {
  if (!payload.options || payload.options.length === 0) {
    return { questionData: payload, mappings: null };
  }

  const mappings = payload.options
    .filter(opt => opt.recommendations && opt.recommendations.length > 0)
    .map(opt => ({
      answer_value: opt.value,
      recommendations: opt.recommendations
    }));

  const questionData = JSON.parse(JSON.stringify(payload));
  if (questionData.options) {
    questionData.options.forEach(opt => delete opt.recommendations);
  }

  return { questionData, mappings };
};

const generateMappingData = (mappings, question_id) => {
  return mappings.flatMap(m =>
    m.recommendations.map(recId => ({
      question_id: question_id,
      answer_value: m.answer_value,
      recommendation_item_id: recId // recommendation_item_id is still used in DB
    }))
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingQuestionSuggestions: 0,
    appliedQuestionSuggestions: 0,
    pendingResourceSuggestions: 0,
    questionnairesCompleted: 0,
  });
  const [questionSuggestions, setQuestionSuggestions] = useState([]);
  const [resourceSuggestions, setResourceSuggestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(true); // Default to denied

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setAccessDenied(false);
        loadDashboardData();
      } else {
        setAccessDenied(true);
        setLoading(false);
      }
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [questionSuggestionsRes, resourceSuggestionsRes, usersRes, submissionsRes, questionsRes] = await Promise.all([
        supabase.from('question_suggestions').select('*').order('created_at', { ascending: false }),
        supabase.from('resource_suggestions').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('updated_at', { ascending: false }),
        supabase.from('questionnaire_submissions').select('answers, created_at'),
        supabase.from('questions').select('*')
      ]);

      if (questionSuggestionsRes.error) throw questionSuggestionsRes.error;
      if (resourceSuggestionsRes.error) throw resourceSuggestionsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (submissionsRes.error) throw submissionsRes.error;
      if (questionsRes.error) throw questionsRes.error;

      setQuestionSuggestions(questionSuggestionsRes.data);
      setResourceSuggestions(resourceSuggestionsRes.data);
      setUsers(usersRes.data);
      setQuestions(questionsRes.data);
      setSubmissions(submissionsRes.data);

      setStats({
        totalUsers: usersRes.data.length,
        pendingQuestionSuggestions: questionSuggestionsRes.data.filter(s => s.status === 'pending').length,
        appliedQuestionSuggestions: questionSuggestionsRes.data.filter(s => s.status === 'approved').length,
        pendingResourceSuggestions: resourceSuggestionsRes.data.filter(s => s.status === 'pending').length,
        questionnairesCompleted: submissionsRes.data.length,
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error.message);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSuggestion = async (suggestion, action) => {
    const toastId = toast.loading('Processing question suggestion...');
    try {
      if (action === 'approved') {
        const { suggestion_type, payload, question_id } = suggestion;
        let dbError = null;

        const { questionData, mappings } = extractMappingsFromPayload(payload);

        switch (suggestion_type) {
          case 'add':
            const { data: newQuestion, error: addError } = await supabase
              .from('questions')
              .insert(questionData)
              .select()
              .single();
            
            if (addError) {
              dbError = addError;
              break;
            }

            if (mappings && newQuestion) {
              const mappingData = generateMappingData(mappings, newQuestion.id);
              if (mappingData.length > 0) {
                const { error: mappingError } = await supabase
                  .from('question_evaluation_mappings')
                  .insert(mappingData);
                if (mappingError) {
                  console.error("Failed to insert mappings:", mappingError);
                  toast.error("Question added, but failed to add evaluation mappings.", { id: toastId, duration: 5000 });
                }
              }
            }
            break;
          case 'edit':
            const { error: editError } = await supabase
              .from('questions')
              .update(questionData)
              .eq('id', question_id);
            
            if (editError) {
              dbError = editError;
              break;
            }

            const { error: deleteMapError } = await supabase
              .from('question_evaluation_mappings')
              .delete()
              .eq('question_id', question_id);

            if (deleteMapError) {
              console.error("Failed to delete old mappings:", deleteMapError);
              toast.error("Question updated, but failed to update mappings.", { id: toastId, duration: 5000 });
            }

            if (mappings) {
              const mappingData = generateMappingData(mappings, question_id);
              if (mappingData.length > 0) {
                const { error: mappingError } = await supabase
                  .from('question_evaluation_mappings')
                  .insert(mappingData);
                if (mappingError) {
                  console.error("Failed to insert new mappings:", mappingError);
                  toast.error("Question updated, but failed to update mappings.", { id: toastId, duration: 5000 });
                }
              }
            }
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

      const { error: updateStatusError } = await supabase
        .from('question_suggestions')
        .update({ status: action, resolved_at: new Date().toISOString(), resolved_by: user.id })
        .eq('id', suggestion.id);
      if (updateStatusError) throw updateStatusError;

      toast.success(`Question suggestion ${action}.`, { id: toastId });
      loadDashboardData();
    } catch (error) {
      console.error('Error processing question suggestion:', error.message);
      toast.error(`Failed to process question suggestion: ${error.message}`, { id: toastId });
    }
  };

  const handleResourceSuggestion = async (suggestion, action) => {
    const toastId = toast.loading('Processing resource suggestion...');
    try {
      if (action === 'approved') {
        const { error: insertError } = await supabase.from('resources').insert({
          type: suggestion.type,
          title: suggestion.title,
          description: suggestion.description,
          url: suggestion.url,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        });
        if (insertError) throw insertError;
      }

      const { error: updateStatusError } = await supabase
        .from('resource_suggestions')
        .update({ status: action, resolved_at: new Date().toISOString(), resolved_by: user.id })
        .eq('id', suggestion.id);
      if (updateStatusError) throw updateStatusError;

      toast.success(`Resource suggestion ${action}.`, { id: toastId });
      loadDashboardData();
    } catch (error) {
      console.error('Error processing resource suggestion:', error.message);
      toast.error(`Failed to process resource suggestion: ${error.message}`, { id: toastId });
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (userId === user.id) {
      toast.error("For security, you cannot change your own role.");
      return;
    }

    const toastId = toast.loading("Updating user role...");
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      toast.success("User role updated.", { id: toastId });
      loadDashboardData();
    } catch (error) {
      console.error("Error updating user role:", error.message);
      toast.error(`Failed to update role: ${error.message}`, { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Verifying permissions...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  const renderQuestionPayload = (suggestion) => {
    const { suggestion_type, payload } = suggestion;
    return (
      <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
        <p><strong>Type:</strong> {suggestion_type}</p>
        <pre className="whitespace-pre-wrap break-all">{JSON.stringify(payload, null, 2)}</pre>
      </div>
    );
  };

  const renderResourceSuggestionDetails = (suggestion) => {
    return (
      <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
        <p><strong>Type:</strong> {suggestion.type === 'resource_link' ? 'Resource Link' : 'Definition'}</p>
        <p><strong>Title:</strong> {suggestion.title}</p>
        {suggestion.description && <p><strong>Description:</strong> {suggestion.description}</p>}
        {suggestion.url && <p><strong>URL:</strong> <a href={suggestion.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{suggestion.url}</a></p>}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage OQI evaluation system and review community contributions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} title="Total Users" value={stats.totalUsers} color="blue" />
        <StatCard icon={MessageCircle} title="Pending Q. Suggestions" value={stats.pendingQuestionSuggestions} color="yellow" />
        <StatCard icon={Lightbulb} title="Pending R. Suggestions" value={stats.pendingResourceSuggestions} color="orange" />
        <StatCard icon={FileText} title="Total Submissions" value={stats.questionnairesCompleted} color="purple" />
      </div>

      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center">
          <BarChart2 className="w-6 h-6 text-gray-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Evaluation Analytics</h2>
            <p className="text-gray-600 mt-1">Analyze submission data to gain insights.</p>
          </div>
        </div>
        <div className="p-6">
          {loading ? <p>Loading analytics...</p> : <AnalyticsDashboard submissions={submissions} questions={questions} />}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Community Question Suggestions</h2>
          <p className="text-gray-600 mt-1">Review and manage suggestions for evaluation questions</p>
        </div>
        <div className="p-6">
          {loading ? <p>Loading suggestions...</p> : questionSuggestions.filter(s => s.status === 'pending').length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending question suggestions.</p>
          ) : (
            <div className="space-y-4">
              {questionSuggestions.filter(s => s.status === 'pending').map(suggestion => (
                <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 capitalize">{suggestion.suggestion_type} suggestion for "{suggestion.question_title_context || 'New Question'}"</h3>
                      <p className="text-gray-600 my-2 italic">"{suggestion.comment}"</p>
                      {renderQuestionPayload(suggestion)}
                      <p className="text-sm text-gray-500 mt-2">Suggested by: {suggestion.author_name_context} • {new Date(suggestion.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => handleQuestionSuggestion(suggestion, 'approved')} className="flex items-center bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"><Check size={16} className="mr-1" />Approve</button>
                      <button onClick={() => handleQuestionSuggestion(suggestion, 'rejected')} className="flex items-center bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"><X size={16} className="mr-1" />Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Community Resource Suggestions</h2>
          <p className="text-gray-600 mt-1">Review and manage suggestions for public resources and definitions</p>
        </div>
        <div className="p-6">
          {loading ? <p>Loading resource suggestions...</p> : resourceSuggestions.filter(s => s.status === 'pending').length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending resource suggestions.</p>
          ) : (
            <div className="space-y-4">
              {resourceSuggestions.filter(s => s.status === 'pending').map(suggestion => (
                <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 capitalize">
                        {suggestion.type === 'resource_link' ? 'Resource Link' : 'Definition'} Suggestion: "{suggestion.title}"
                      </h3>
                      {suggestion.comment && <p className="text-gray-600 my-2 italic">"{suggestion.comment}"</p>}
                      {renderResourceSuggestionDetails(suggestion)}
                      <p className="text-sm text-gray-500 mt-2">Suggested by: {suggestion.author_name_context} • {new Date(suggestion.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => handleResourceSuggestion(suggestion, 'approved')} className="flex items-center bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"><Check size={16} className="mr-1" />Approve</button>
                      <button onClick={() => handleResourceSuggestion(suggestion, 'rejected')} className="flex items-center bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"><X size={16} className="mr-1" />Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
          <p className="text-gray-600 mt-1">View and manage user roles in the system</p>
        </div>
        <div className="p-6">
          {loading ? <p>Loading users...</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(profile => (
                    <tr key={profile.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{profile.first_name || 'N/A'} {profile.last_name || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.organization || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <select
                          value={profile.role}
                          onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                          disabled={profile.id === user.id}
                          className="p-1 border border-gray-300 rounded-md disabled:opacity-70 disabled:bg-gray-100"
                        >
                          <option value="user">User</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(profile.updated_at).toLocaleDateString()}</td>
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

const StatCard = ({ icon: Icon, title, value, color }) => {
  const colors = {
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
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