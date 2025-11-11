import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import DashboardStats from '../admin/DashboardStats';
import AnalyticsDashboard from '../questionnaire/AnalyticsDashboard';
import UserManagement from '../admin/UserManagement';
import AppSettings from '../admin/AppSettings';
import { Check, X, AlertTriangle } from 'lucide-react';

// Helper functions adapted from QuestionnaireEditor
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
      recommendation_item_id: recId
    }))
  );
};


const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [questionSuggestions, setQuestionSuggestions] = useState([]);
  const [resourceSuggestions, setResourceSuggestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [questions, setQuestions] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [qSuggestions, rSuggestions, subs, ques] = await Promise.all([
        supabase.from('question_suggestions').select('*').order('created_at', { ascending: false }),
        supabase.from('resource_suggestions').select('*').order('created_at', { ascending: false }),
        supabase.from('questionnaire_submissions').select('*'),
        supabase.from('questions').select('*')
      ]);

      if (qSuggestions.error) throw qSuggestions.error;
      if (rSuggestions.error) throw rSuggestions.error;
      if (subs.error) throw subs.error;
      if (ques.error) throw ques.error;

      setQuestionSuggestions(qSuggestions.data);
      setResourceSuggestions(rSuggestions.data);
      setSubmissions(subs.data);
      setQuestions(ques.data);

    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load all administrative data. Some sections may be unavailable.');
      toast.error('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuestionSuggestion = async (suggestion, newStatus) => {
    const toastId = toast.loading('Processing suggestion...');
    try {
      if (newStatus === 'approved') {
        if (suggestion.suggestion_type === 'add' || suggestion.suggestion_type === 'edit') {
          const { questionData, mappings } = extractMappingsFromPayload(suggestion.payload);
          if (suggestion.suggestion_type === 'add') {
            delete questionData.id;
            const { data: newQuestion, error } = await supabase.from('questions').insert(questionData).select().single();
            if (error) throw error;
            if (mappings && newQuestion) {
              const mappingData = generateMappingData(mappings, newQuestion.id);
              if (mappingData.length > 0) {
                const { error: mapError } = await supabase.from('question_evaluation_mappings').insert(mappingData);
                if (mapError) throw mapError;
              }
            }
          } else { // edit
            const { error } = await supabase.from('questions').update(questionData).eq('id', suggestion.question_id);
            if (error) throw error;
            await supabase.from('question_evaluation_mappings').delete().eq('question_id', suggestion.question_id);
            if (mappings) {
              const mappingData = generateMappingData(mappings, suggestion.question_id);
              if (mappingData.length > 0) {
                const { error: mapError } = await supabase.from('question_evaluation_mappings').insert(mappingData);
                if (mapError) throw mapError;
              }
            }
          }
        } else if (suggestion.suggestion_type === 'delete') {
          const { error } = await supabase.from('questions').delete().eq('id', suggestion.question_id);
          if (error) throw error;
        } else if (suggestion.suggestion_type === 'suggest_resource') {
          const resourcePayload = suggestion.payload;
          const { data: newResource, error: resourceError } = await supabase.from('resources').insert({
            type: resourcePayload.type,
            title: resourcePayload.title,
            description: resourcePayload.description,
            url: resourcePayload.url,
            approved_by: user.id,
            approved_at: new Date(),
          }).select().single();
          if (resourceError) throw resourceError;
          const { error: linkError } = await supabase.from('question_resources').insert({
            question_id: suggestion.question_id,
            resource_id: newResource.id,
          });
          if (linkError) throw linkError;
        }
      }
      // Update suggestion status
      const { error: statusError } = await supabase.from('question_suggestions').update({ status: newStatus, resolved_at: new Date(), resolved_by: user.id }).eq('id', suggestion.id);
      if (statusError) throw statusError;
      
      toast.success('Suggestion processed successfully!', { id: toastId });
      fetchData(); // Refresh data
    } catch (err) {
      toast.error(`Action failed: ${err.message}`, { id: toastId });
    }
  };

  const handleResourceSuggestion = async (suggestion, newStatus) => {
    const toastId = toast.loading('Processing suggestion...');
    try {
      if (newStatus === 'approved') {
        const { error: insertError } = await supabase.from('resources').insert({
          type: suggestion.type,
          title: suggestion.title,
          description: suggestion.description,
          url: suggestion.url,
          approved_by: user.id,
          approved_at: new Date(),
        });
        if (insertError) throw insertError;
      }
      const { error: statusError } = await supabase.from('resource_suggestions').update({ status: newStatus, resolved_at: new Date(), resolved_by: user.id }).eq('id', suggestion.id);
      if (statusError) throw statusError;

      toast.success('Suggestion processed successfully!', { id: toastId });
      fetchData(); // Refresh data
    } catch (err) {
      toast.error(`Action failed: ${err.message}`, { id: toastId });
    }
  };

  const renderContent = () => {
    if (loading) return <p className="text-center py-8 text-gray-500">Loading dashboard...</p>;

    switch (activeTab) {
      case 'stats':
        return <DashboardStats />;
      case 'analytics':
        return <AnalyticsDashboard submissions={submissions} questions={questions} />;
      case 'questions':
        return renderSuggestionsTable(questionSuggestions, handleQuestionSuggestion, ['Suggestion Type', 'Question Context', 'Comment']);
      case 'resources':
        return renderSuggestionsTable(resourceSuggestions, handleResourceSuggestion, ['Title', 'Type', 'URL']);
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <AppSettings />;
      default:
        return null;
    }
  };

  const renderSuggestionsTable = (data, handler, headers) => {
    if (data.length === 0) return <p className="text-gray-500 text-center py-8">No pending suggestions of this type.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
              {headers.map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map(s => (
              <tr key={s.id}>
                <td className="px-4 py-4 text-sm text-gray-700">{s.author_name_context || 'N/A'}</td>
                {headers.includes('Suggestion Type') && <td className="px-4 py-4 text-sm text-gray-700 capitalize">{s.suggestion_type?.replace('_', ' ')}</td>}
                {headers.includes('Question Context') && <td className="px-4 py-4 text-sm text-gray-700">{s.question_title_context}</td>}
                {headers.includes('Comment') && <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">{s.comment}</td>}
                {headers.includes('Title') && <td className="px-4 py-4 text-sm text-gray-700">{s.title}</td>}
                {headers.includes('Type') && <td className="px-4 py-4 text-sm text-gray-700">{s.type}</td>}
                {headers.includes('URL') && <td className="px-4 py-4 text-sm text-blue-500 truncate max-w-xs">{s.url}</td>}
                <td className="px-4 py-4 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : s.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm">
                  {s.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handler(s, 'approved')} className="p-2 text-green-600 hover:bg-green-100 rounded-full" title="Approve"><Check size={16} /></button>
                      <button onClick={() => handler(s, 'rejected')} className="p-2 text-red-600 hover:bg-red-100 rounded-full" title="Reject"><X size={16} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === id ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-red-400" /></div>
            <div className="ml-3"><p className="text-sm text-red-700">{error}</p></div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 mb-6">
          <TabButton id="stats" label="Key Stats" />
          <TabButton id="analytics" label="Submission Analytics" />
          <TabButton id="questions" label="Question Suggestions" />
          <TabButton id="resources" label="Resource Suggestions" />
          <TabButton id="users" label="User Management" />
          <TabButton id="settings" label="Settings" />
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;