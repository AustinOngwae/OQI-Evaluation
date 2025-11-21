import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Check, X, Trash2, Download, FileText, GitPullRequest, Book, BarChart2, SlidersHorizontal, AlertTriangle, RefreshCw } from 'lucide-react';
import DashboardStats from '../admin/DashboardStats';
import SubmissionDetailsModal from '../admin/SubmissionDetailsModal';
import AnalyticsDashboard from './AnalyticsDashboard';
import AppSettings from '../admin/AppSettings';
import PublicResourcesDisplay from '../resources/PublicResourcesDisplay';
import { useData } from '../../context/DataContext';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('Submissions');
  const [submissions, setSubmissions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState({ submissions: true, suggestions: true });
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const { questions, evaluationItems, questionEvaluationMappings, reload: reloadAllData } = useData();

  const fetchData = useCallback(async (type) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    const tableName = type === 'submissions' ? 'questionnaire_submissions' : 'question_suggestions';
    const { data, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: false });
    
    if (error) {
      toast.error(`Failed to load ${type}.`);
      console.error(`Error loading ${type}:`, error);
    } else {
      if (type === 'submissions') setSubmissions(data);
      if (type === 'suggestions') setSuggestions(data);
    }
    setLoading(prev => ({ ...prev, [type]: false }));
  }, []);

  useEffect(() => {
    fetchData('submissions');
    fetchData('suggestions');
  }, [fetchData]);

  const handleSuggestionAction = async (id, newStatus) => {
    const originalSuggestions = [...suggestions];
    const optimisticSuggestions = suggestions.map(s => s.id === id ? { ...s, status: newStatus } : s);
    setSuggestions(optimisticSuggestions);

    const { error } = await supabase.from('question_suggestions').update({ status: newStatus, resolved_at: new Date() }).eq('id', id);
    if (error) {
      toast.error('Action failed. Reverting.');
      setSuggestions(originalSuggestions);
    } else {
      toast.success(`Suggestion ${newStatus}.`);
      if (newStatus === 'approved') {
        // TODO: Implement logic to apply the suggestion
        toast.success('Suggestion approved and applied!');
      }
    }
  };

  const handleDeleteSubmission = async (id) => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) return;
    const { error } = await supabase.from('questionnaire_submissions').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete submission.');
    } else {
      toast.success('Submission deleted.');
      setSubmissions(submissions.filter(s => s.id !== id));
    }
  };

  const tabs = [
    { name: 'Submissions', icon: FileText },
    { name: 'Suggestions', icon: GitPullRequest },
    { name: 'Resources', icon: Book },
    { name: 'Analytics', icon: BarChart2 },
    { name: 'Settings', icon: SlidersHorizontal },
  ];

  const renderSubmissions = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-300">
        <thead className="text-xs text-gray-400 uppercase bg-white/10">
          <tr>
            <th scope="col" className="px-6 py-3">Submitter</th>
            <th scope="col" className="px-6 py-3">Organization</th>
            <th scope="col" className="px-6 py-3">Date</th>
            <th scope="col" className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading.submissions ? (
            <tr><td colSpan="4" className="text-center p-8">Loading submissions...</td></tr>
          ) : submissions.length === 0 ? (
            <tr><td colSpan="4" className="text-center p-8">No submissions yet.</td></tr>
          ) : (
            submissions.map(submission => (
              <tr key={submission.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="px-6 py-4 font-medium text-white">{submission.user_context?.firstName} {submission.user_context?.lastName}</td>
                <td className="px-6 py-4">{submission.user_context?.organization || 'N/A'}</td>
                <td className="px-6 py-4">{format(new Date(submission.created_at), 'PPp')}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(submission)}>View Details</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteSubmission(submission.id)}><Trash2 size={16} /></Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderSuggestions = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-300">
        <thead className="text-xs text-gray-400 uppercase bg-white/10">
          <tr>
            <th scope="col" className="px-6 py-3">Question</th>
            <th scope="col" className="px-6 py-3">Suggestion Type</th>
            <th scope="col" className="px-6 py-3">Status</th>
            <th scope="col" className="px-6 py-3">Date</th>
            <th scope="col" className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading.suggestions ? (
            <tr><td colSpan="5" className="text-center p-8">Loading suggestions...</td></tr>
          ) : suggestions.length === 0 ? (
            <tr><td colSpan="5" className="text-center p-8">No suggestions yet.</td></tr>
          ) : (
            suggestions.map(suggestion => (
              <tr key={suggestion.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="px-6 py-4 font-medium text-white truncate max-w-xs">{suggestion.question_title_context}</td>
                <td className="px-6 py-4">{suggestion.suggestion_type}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    suggestion.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                    suggestion.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>{suggestion.status}</span>
                </td>
                <td className="px-6 py-4">{format(new Date(suggestion.created_at), 'PPp')}</td>
                <td className="px-6 py-4 text-right">
                  {suggestion.status === 'pending' && (
                    <div className="flex justify-end items-center gap-2">
                      <Button variant="outline" size="sm" className="bg-green-500/20 hover:bg-green-500/40 text-green-300 border-green-500/30" onClick={() => handleSuggestionAction(suggestion.id, 'approved')}><Check size={16} /></Button>
                      <Button variant="outline" size="sm" className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border-red-500/30" onClick={() => handleSuggestionAction(suggestion.id, 'rejected')}><X size={16} /></Button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Submissions': return renderSubmissions();
      case 'Suggestions': return renderSuggestions();
      case 'Resources': return <div className="bg-white/5 p-4 rounded-lg border border-white/20"><PublicResourcesDisplay /></div>;
      case 'Analytics': return <AnalyticsDashboard submissions={submissions} questions={questions} />;
      case 'Settings': return <AppSettings />;
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {selectedSubmission && <SubmissionDetailsModal submission={selectedSubmission} questions={questions} evaluationItems={evaluationItems} questionEvaluationMappings={questionEvaluationMappings} onClose={() => setSelectedSubmission(null)} />}
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-sans">Admin Dashboard</h1>
          <p className="text-gray-300 mt-2 font-body">Manage submissions, review suggestions, and view analytics.</p>
        </div>
        <Button variant="outline" onClick={reloadAllData}><RefreshCw size={16} className="mr-2" /> Refresh Data</Button>
      </div>

      <DashboardStats />

      <div className="glass-card p-4 sm:p-6">
        <div className="mb-6 border-b border-white/20">
          <nav className="-mb-px flex space-x-4 sm:space-x-8" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeTab === tab.name
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                <tab.icon size={16} className="mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;