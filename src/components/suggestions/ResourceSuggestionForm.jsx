import React, { useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ResourceSuggestionForm = ({ onClose, onSubmitted }) => {
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
      const { error } = await supabase.from('resource_suggestions').insert({
        author_id: null,
        author_name_context: 'Anonymous',
        type: formData.type,
        title: formData.title,
        description: formData.description,
        url: formData.type === 'resource_link' ? formData.url : null,
        comment: formData.comment,
      });

      if (error) throw error;

      toast.success('Suggestion submitted for review!', { id: toastId });
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-white font-sans">Suggest New General Resource</h2>
        <p className="text-gray-300 mb-4 font-body">
          Help improve the tool by suggesting useful resources or definitions. This will be available as a general resource.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 font-body">Type of Suggestion</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="resource_link">Resource Link</option>
              <option value="definition">Definition / Description</option>
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 font-body">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., OQI Framework Overview"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 font-body">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Provide a brief summary or explanation."
            />
          </div>

          {formData.type === 'resource_link' && (
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-300 font-body">URL</label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://example.com/resource"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-300 font-body">Your Comment (Optional)</label>
            <textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              rows="2"
              placeholder="Why is this a valuable addition?"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title || (formData.type === 'resource_link' && !formData.url)}
            >
              <Send size={16} className="mr-2" /> Submit Suggestion
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceSuggestionForm;