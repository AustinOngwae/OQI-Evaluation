import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';

const SuggestEvaluation = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user) return;
      setFetching(true);
      setFetchError(null);
      try {
        const { data, error } = await supabase
          .from('suggestions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setSuggestions(data);
      } catch (error) {
        toast.error('Failed to load your past suggestions.');
        setFetchError('Could not load suggestions at this time.');
        console.error('Error fetching suggestions:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchSuggestions();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Submitting suggestion...');

    try {
      const { data: newSuggestion, error } = await supabase.from('suggestions').insert({
        user_id: user.id,
        title,
        description,
      }).select();

      if (error) throw error;

      toast.success('Suggestion submitted successfully!', { id: toastId });
      setTitle('');
      setDescription('');
      setSuggestions(prev => [newSuggestion[0], ...prev]);
    } catch (error) {
      toast.error(`Submission failed: ${error.message}`, { id: toastId });
      console.error('Error submitting suggestion:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Suggest an Evaluation Topic</h1>
        <p className="text-gray-600 mb-6">Have an idea for a new evaluation? Share it with the administrators for review.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Community Engagement Metrics"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Explain why this evaluation is important and what it should cover."
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Send size={18} className="mr-2" />
              {loading ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Past Suggestions</h2>
        {fetching ? (
          <p className="text-gray-500 text-center py-4">Loading suggestions...</p>
        ) : fetchError ? (
          <p className="text-red-500 text-center py-4">{fetchError}</p>
        ) : suggestions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">You haven't made any suggestions yet.</p>
        ) : (
          <ul className="space-y-4">
            {suggestions.map(suggestion => (
              <li key={suggestion.id} className="border border-gray-200 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{suggestion.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    suggestion.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    suggestion.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {suggestion.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Submitted on {new Date(suggestion.created_at).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SuggestEvaluation;