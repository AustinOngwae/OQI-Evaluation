import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const QuestionForm = ({ question, onSubmit, onCancel, mode = 'edit' }) => {
  const [formData, setFormData] = useState({
    step_id: 1,
    type: 'text',
    title: '',
    description: '',
    required: false,
    options: [],
    ...question,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'step_id' ? parseInt(value, 10) : value),
    }));
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index][field] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), { label: '', value: '' }],
    }));
  };

  const removeOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Clean up options if not a relevant type
    const finalData = { ...formData };
    if (!['radio', 'checkbox', 'select'].includes(finalData.type)) {
      finalData.options = [];
    }
    onSubmit(finalData);
  };

  const isOptionType = ['radio', 'checkbox', 'select'].includes(formData.type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{mode === 'add' ? 'Add New Question' : 'Edit Question'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Step</label>
              <select
                name="step_id"
                value={formData.step_id}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {[1, 2, 3, 4].map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="text">Text</option>
                <option value="radio">Radio</option>
                <option value="checkbox">Checkbox</option>
                <option value="select">Select</option>
              </select>
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="required"
              id="required"
              checked={formData.required}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="required" className="ml-2 block text-sm text-gray-900">Required</label>
          </div>

          {isOptionType && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Options</h3>
              <div className="space-y-2">
                {(formData.options || []).map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <input
                      type="text"
                      placeholder="Label"
                      value={option.label}
                      onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={option.value}
                      onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded"
                    />
                    <button type="button" onClick={() => removeOption(index)} className="p-2 text-red-600 hover:bg-red-100 rounded">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addOption} className="mt-2 flex items-center text-blue-600">
                <Plus size={16} className="mr-1" /> Add Option
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionForm;