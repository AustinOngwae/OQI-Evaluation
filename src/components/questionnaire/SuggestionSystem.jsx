import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMessageCircle, FiSend, FiThumbsUp, FiThumbsDown } = FiIcons;

const SuggestionSystem = ({ questionId, questionTitle }) => {
  const { user } = useAuth();
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [suggestion, setSuggestion] = useState({
    type: 'edit',
    title: '',
    description: '',
    changes: {}
  });

  const submitSuggestion = () => {
    const newSuggestion = {
      id: `suggestion_${Date.now()}`,
      questionId,
      questionTitle,
      author: user.name,
      authorEmail: user.email,
      createdAt: new Date().toISOString(),
      status: 'pending',
      ...suggestion
    };

    // Save to localStorage (in real app, would be API call)
    const existing = JSON.parse(localStorage.getItem('questionnaire_suggestions') || '[]');
    existing.push(newSuggestion);
    localStorage.setItem('questionnaire_suggestions', JSON.stringify(existing));

    // Reset form
    setSuggestion({ type: 'edit', title: '', description: '', changes: {} });
    setShowSuggestionForm(false);
    
    // Show success message
    alert('Suggestion submitted successfully!');
  };

  if (!user || user.role === 'user') return null;

  return (
    <div className="mt-4 border-t pt-4">
      {!showSuggestionForm ? (
        <button
          onClick={() => setShowSuggestionForm(true)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <SafeIcon icon={FiMessageCircle} className="mr-1" />
          Suggest improvement
        </button>
      ) : (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-3">Suggest Improvement</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggestion Type
              </label>
              <select
                value={suggestion.type}
                onChange={(e) => setSuggestion(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded text-sm"
              >
                <option value="edit">Edit existing question</option>
                <option value="add">Add new question</option>
                <option value="remove">Remove question</option>
                <option value="reorder">Reorder questions</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={suggestion.title}
                onChange={(e) => setSuggestion(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="Brief title for your suggestion"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={suggestion.description}
                onChange={(e) => setSuggestion(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                rows="3"
                placeholder="Explain your suggestion and why it would improve the questionnaire"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={submitSuggestion}
                disabled={!suggestion.title || !suggestion.description}
                className="flex items-center bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <SafeIcon icon={FiSend} className="mr-1" />
                Submit
              </button>
              <button
                onClick={() => setShowSuggestionForm(false)}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionSystem;