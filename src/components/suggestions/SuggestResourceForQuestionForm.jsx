import React, { useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';

const SuggestResourceForQuestionForm = ({ user, question, onClose, onSubmitted }) => {
  const [formData, setFormData] = useState({
    type: 'resource_link',
    title: '',
    description: '',
    url: '',
    comment: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Submitting suggestion...');

    try {
      const payload = {
        type: formData.type,
        title: formData.title,
        description: formData.description,
        url: formData.type === 'resource_link' ? formData.url : null,
      };

      const { error } = await supabase.from('question_suggestions').insert({
        author_id: user.id,
        author_name_context: user.first_name || user.email,
        question_id: question.id,
        question_title_context: question.title,
        suggestion_type: 'suggest_resource',
        payload: payload,
        comment: formData.comment,
      });

      if (error) throw error;

      toast.success('Resource suggestion submitted for review!', { id: toastId });
      onSubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting resource suggestion:', error.message);
      toast.error(`Submission failed: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-2 text-gray-800">Suggest a Resource</h2>
        <p className="text-sm text-gray-600 mb-4">For question: "{question.title}"</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type of Resource</label>
            <select id="type" name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900" required>
              <option value="resource_link">Resource Link</option>
              <option value="definition">Definition / Description</option>
            </select>
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500" placeholder="e.g., WHO Guidelines" required />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500" placeholder="Provide a brief summary." />
          </div>
          {formData.type === 'resource_link' && (
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL</label>
              <input type="url" id="url" name="url" value={formData.url} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500" placeholder="https://example.com" required />
            </div>
          )}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Your Comment (Optional)</label>
            <textarea id="comment" name="comment" value={formData.comment} onChange={handleChange} rows="2" className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500" placeholder="Why is this a valuable addition?" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-gray-800" disabled={loading}>Cancel</button>
            <button type="submit" className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled={loading || !formData.title || (formData.type === 'resource_link' && !formData.url)}>
              <Send size={16} className="mr-2" /> Submit Suggestion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuggestResourceForQuestionForm;