import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';

const SuggestionManagement = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch suggestions');
      console.error('Error fetching suggestions:', error);
    } else {
      setSuggestions(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleUpdateStatus = async (id, status) => {
    const toastId = toast.loading('Updating suggestion...');
    const { error } = await supabase
      .from('suggestions')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error(`Failed to update suggestion: ${error.message}`, { id: toastId });
    } else {
      toast.success('Suggestion updated successfully', { id: toastId });
      fetchSuggestions(); // Refresh the list
    }
  };

  if (loading) {
    return <div className="p-6"><p className="text-gray-500">Loading suggestions...</p></div>;
  }

  return (
    <div className="p-6">
      {suggestions.length === 0 ? (
        <p className="text-gray-500">No suggestions found.</p>
      ) : (
        <ul className="space-y-4">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} className="border p-4 rounded-md flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <p className="font-semibold text-gray-800">{suggestion.suggestion_text}</p>
                <p className={`text-sm font-medium ${
                  suggestion.status === 'pending' ? 'text-yellow-600' :
                  suggestion.status === 'approved' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  Status: {suggestion.status}
                </p>
              </div>
              {suggestion.status === 'pending' && (
                 <div className="flex-shrink-0 flex space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(suggestion.id, 'approved')}
                      className="bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(suggestion.id, 'rejected')}
                      className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      Dismiss
                    </button>
                 </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SuggestionManagement;