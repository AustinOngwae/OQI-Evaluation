import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import DashboardStats from '../admin/DashboardStats';
import AnalyticsDashboard from '../questionnaire/AnalyticsDashboard';
import AppSettings from '../admin/AppSettings';
import SubmissionDetailsModal from '../admin/SubmissionDetailsModal';
import { Check, X, AlertTriangle, Eye, Trash2 } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [questionSuggestions, setQuestionSuggestions] = useState([]);
  const [resourceSuggestions, setResourceSuggestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [viewingSubmission, setViewingSubmission] = useState(null);

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
            approved_by: null,
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
      const { error: statusError } = await supabase.from('question_suggestions').update({ status: newStatus, resolved_at: new Date(), resolved_by: null }).eq('id', suggestion.id);
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
          approved_by: null,
          approved_at: new Date(),
        });
        if (insertError) throw insertError;
      }
      const { error: statusError } = await supabase.from('resource_suggestions').update({ status: newStatus, resolved_at: new Date(), resolved_by: null }).eq('id', suggestion.id);
      if (statusError) throw statusError;

      toast.success('Suggestion processed successfully!', { id: toastId });
      fetchData(); // Refresh data
    } catch (err) {
      toast.error(`Action failed: ${err.message}`, { id: toastId });
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }
    const toastId = toast.loading('Deleting submission...');
    try {
      const { error } = await supabase
        .from('questionnaire_submissions')
        .delete()
        .eq('id', submissionId);
      
      if (error) throw error;

      toast.success('Submission deleted successfully.', { id: toastId });
      fetchData(); // Refresh data
    } catch (err) {
      toast.error(`Failed to delete submission: ${err.message}`, { id: toastId });
    }
  };

  const renderResourceSuggestionsTable = (generalSuggestions, questionRelatedSuggestions) => {
    const allSuggestions = [
      ...generalSuggestions.map(s => ({ ...s, sourceTable: 'resource_suggestions' })),
      ...questionRelatedSuggestions.map(s => ({ ...s, sourceTable: 'question_suggestions' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (allSuggestions.length === 0) return <p className="text-gray-400 text-center py-8">No pending resource suggestions.</p>;

    const handleAction = (suggestion, status) => {
      if (suggestion.sourceTable === 'resource_suggestions') {
        handleResourceSuggestion(suggestion, status);
      } else {
        handleQuestionSuggestion(suggestion, status);
      }
    };

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Author</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Context</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Comment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
            {allSuggestions.map(s => {
              const isGeneral = s.sourceTable === 'resource_suggestions';
              const title = isGeneral ? s.title : s.payload.title;
              const url = isGeneral ? s.url : s.payload.url;
              const context = isGeneral ? (url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate block">{url}</a> : 'General Definition') : `For question: "${s.question_title_context}"`;

              return (
                <tr key={s.id} className="hover:bg-white/5">
                  <td className="px-4 py-4 text-sm text-gray-200">{s.author_name_context}</td>
                  <td className="px-4 py-4 text-sm text-gray-200">{title}</td>
                  <td className="px-4 py-4 text-sm text-gray-300 max-w-xs">{context}</td>
                  <td className="px-4 py-4 text-sm text-gray-300 max-w-xs truncate">{s.comment}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.status === 'pending' ? 'bg-yellow-400/20 text-yellow-300' : s.status === 'approved' ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {s.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAction(s, 'approved')} className="p-2 text-green-400 hover:bg-green-400/20 rounded-full" title="Approve"><Check size={16} /></button>
                        <button onClick={() => handleAction(s, 'rejected')} className="p-2 text-red-400 hover:bg-red-400/20 rounded-full" title="Reject"><X size={16} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSubmissionsTable = () => {
    if (submissions.length === 0) {
      return <p className="text-gray-400 text-center py-8">No questionnaire submissions yet.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Submitter</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Organization</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
            {submissions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(sub => (
              <tr key={sub.id} className="hover:bg-white/5">
                <td className="px-4 py-4 text-sm text-gray-200">{sub.user_context?.firstName || 'N/A'} {sub.user_context?.lastName || ''}</td>
                <td className="px-4 py-4 text-sm text-gray-300">{sub.user_context?.organization || 'N/A'}</td>
                <td className="px-4 py-4 text-sm text-gray-300">{new Date(sub.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewingSubmission(sub)} className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-full" title="View Details"><Eye size={16} /></button>
                    <button onClick={() => handleDeleteSubmission(sub.id)} className="p-2 text-red-400 hover:bg-red-400/20 rounded-full" title="Delete Submission"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) return <p className="text-center py-8 text-gray-300">Loading dashboard...</p>;

    switch (activeTab) {
      case 'stats':
        return <DashboardStats />;
      case 'submissions':
        return renderSubmissionsTable();
      case 'analytics':
        return <AnalyticsDashboard submissions={submissions} questions={questions} />;
      case 'questions':
        const pureQuestionSuggestions = questionSuggestions.filter(s => s.suggestion_type !== 'suggest_resource');
        return renderSuggestionsTable(pureQuestionSuggestions, handleQuestionSuggestion, ['Suggestion Type', 'Question Context', 'Comment']);
      case 'resources':
        const questionRelatedResourceSuggestions = questionSuggestions.filter(s => s.suggestion_type === 'suggest_resource');
        return renderResourceSuggestionsTable(resourceSuggestions, questionRelatedResourceSuggestions);
      case 'settings':
        return <AppSettings />;
      default:
        return null;
    }
  };

  const renderSuggestionsTable = (data, handler, headers) => {
    if (data.length === 0) return <p className="text-gray-400 text-center py-8">No pending suggestions of this type.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Author</th>
              {headers.map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">{h}</th>)}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
            {data.map(s => (
              <tr key={s.id} className="hover:bg-white/5">
                <td className="px-4 py-4 text-sm text-gray-200">{s.author_name_context}</td>
                {headers.includes('Suggestion Type') && <td className="px-4 py-4 text-sm text-gray-200 capitalize">{s.suggestion_type?.replace('_', ' ')}</td>}
                {headers.includes('Question Context') && <td className="px-4 py-4 text-sm text-gray-200">{s.question_title_context}</td>}
                {headers.includes('Comment') && <td className="px-4 py-4 text-sm text-gray-300 max-w-xs"><span className="truncate block">{s.comment}</span></td>}
                <td className="px-4 py-4 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.status === 'pending' ? 'bg-yellow-400/20 text-yellow-300' : s.status === 'approved' ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm">
                  {s.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handler(s, 'approved')} className="p-2 text-green-400 hover:bg-green-400/20 rounded-full" title="Approve"><Check size={16} /></button>
                      <button onClick={() => handler(s, 'rejected')} className="p-2 text-red-400 hover:bg-red-400/20 rounded-full" title="Reject"><X size={16} /></button>
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
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === id ? 'bg-brand-purple text-white' : 'text-gray-300 hover:bg-white/10'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {viewingSubmission && (
        <SubmissionDetailsModal 
          submission={viewingSubmission} 
          questions={questions} 
          onClose={() => setViewingSubmission(null)} 
        />
      )}
      <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
      
      {error && (
        <div className="bg-red-500/20 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-red-300" /></div>
            <div className="ml-3"><p className="text-sm text-red-200">{error}</p></div>
          </div>
        </div>
      )}

      <div className="glass-card p-6">
        <div className="flex flex-wrap gap-2 border-b border-white/20 pb-4 mb-6">
          <TabButton id="stats" label="Key Stats" />
          <TabButton id="submissions" label="Submissions" />
          <TabButton id="analytics" label="Submission Analytics" />
          <TabButton id="questions" label="Question Suggestions" />
          <TabButton id="resources" label="Resource Suggestions" />
          <TabButton id="settings" label="Settings" />
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;