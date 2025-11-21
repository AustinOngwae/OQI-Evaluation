import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NewResourceSubForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: 'resource_link',
    title: '',
    description: '',
    url: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800 font-sans">Add New Resource Information</h2>
        <p className="text-gray-600 mb-4 text-sm font-body">
          This resource will be suggested along with your question. It will be reviewed by an administrator.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 font-body">Type of Resource</label>
            <select id="type" name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900" required>
              <option value="resource_link">Resource Link</option>
              <option value="definition">Definition / Description</option>
            </select>
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 font-body">Title</label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500" placeholder="e.g., WHO Guidelines" required />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 font-body">Description (Optional)</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500" placeholder="Provide a brief summary." />
          </div>
          {formData.type === 'resource_link' && (
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 font-body">URL</label>
              <input type="url" id="url" name="url" value={formData.url} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500" placeholder="https://example.com" required />
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!formData.title || (formData.type === 'resource_link' && !formData.url)}>
              <Send size={16} className="mr-2" /> Add to Suggestion
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewResourceSubForm;