import React, { useState, useEffect } from 'react';
import { Plus, Trash2, XCircle } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import NewResourceSubForm from '../suggestions/NewResourceSubForm';

const QuestionForm = ({ question, onSubmit, onCancel, mode = 'edit' }) => {
  const [formData, setFormData] = useState({
    step_id: 1,
    type: 'text',
    title: '',
    description: '',
    required: false,
    options: [],
    linked_resources: [],
    ...question,
  });
  const [evaluationItems, setEvaluationItems] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSuggestingResource, setIsSuggestingResource] = useState(false);
  const [newlySuggestedResources, setNewlySuggestedResources] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: evalItemsData } = await supabase.from('evaluation_items').select('id, title');
      setEvaluationItems(evalItemsData || []);

      const { data: resourcesData } = await supabase.from('resources').select('id, title');
      setAllResources(resourcesData || []);

      if (mode === 'edit' && question?.id) {
        const { data: mappingsData } = await supabase.from('question_evaluation_mappings').select('answer_value, recommendation_item_id').eq('question_id', question.id);
        const { data: linksData } = await supabase.from('question_resources').select('resource_id').eq('question_id', question.id);

        const mappingsByValue = (mappingsData || []).reduce((acc, mapping) => {
          if (!acc[mapping.answer_value]) acc[mapping.answer_value] = [];
          acc[mapping.answer_value].push(mapping.recommendation_item_id);
          return acc;
        }, {});

        const linkedResourceIds = (linksData || []).map(link => link.resource_id);

        setFormData(prev => ({
          ...prev,
          options: (prev.options || []).map(opt => ({ ...opt, recommendations: mappingsByValue[opt.value] || [] })),
          linked_resources: linkedResourceIds,
        }));
      }
      setLoading(false);
    };
    fetchData();
  }, [question, mode]);

  const handleChange = (e) => {
    const { name, value, type, checked, options } = e.target;
    if (type === 'select-multiple') {
      const selectedValues = Array.from(options).filter(o => o.selected).map(o => o.value);
      setFormData(prev => ({ ...prev, [name]: selectedValues }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (name === 'step_id' ? parseInt(value, 10) : value) }));
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => setFormData(prev => ({ ...prev, options: [...(prev.options || []), { label: '', value: '', recommendations: [] }] }));
  const removeOption = (index) => setFormData(prev => ({ ...prev, options: formData.options.filter((_, i) => i !== index) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = { ...formData, new_resources: newlySuggestedResources };
    if (!['radio', 'checkbox', 'select'].includes(finalData.type)) {
      finalData.options = [];
    }
    onSubmit(finalData);
  };

  const handleAddNewResource = (resourceData) => {
    setNewlySuggestedResources(prev => [...prev, resourceData]);
    setIsSuggestingResource(false);
    toast.success(`Added "${resourceData.title}" to the suggestion.`);
  };

  const handleRemoveNewResource = (index) => {
    setNewlySuggestedResources(prev => prev.filter((_, i) => i !== index));
  };

  const isOptionType = ['radio', 'checkbox', 'select'].includes(formData.type);
  const getTitle = () => mode === 'add' ? 'Suggest New Evaluation Question' : 'Suggest Edit for Evaluation Question';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {isSuggestingResource && (
        <NewResourceSubForm 
          onClose={() => setIsSuggestingResource(false)} 
          onSubmit={handleAddNewResource} 
        />
      )}
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{getTitle()}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700">Title</label><input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500" required /></div>
          <div><label className="block text-sm font-medium text-gray-700">Description (Optional)</label><textarea name="description" value={formData.description} onChange={handleChange} rows="2" className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700">Step</label><select name="step_id" value={formData.step_id} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900">{[1, 2, 3, 4].map(i => <option key={i} value={i}>{i}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700">Type</label><select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"><option value="text">Text</option><option value="radio">Radio</option><option value="checkbox">Checkbox</option><option value="select">Select</option></select></div>
          </div>
          <div className="flex items-center"><input type="checkbox" name="required" id="required" checked={formData.required} onChange={handleChange} className="h-4 w-4 text-brand-purple border-gray-300 rounded" /><label htmlFor="required" className="ml-2 block text-sm text-gray-900">Required</label></div>

          {isOptionType && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Options & Evaluation Items</h3>
              <div className="space-y-4">
                {(formData.options || []).map((option, index) => (
                  <div key={index} className="flex flex-col gap-2 p-3 bg-gray-50 rounded border">
                    <div className="flex items-center gap-2"><input type="text" placeholder="Label" value={option.label || ''} onChange={(e) => handleOptionChange(index, 'label', e.target.value)} className="w-full p-2 border border-gray-300 rounded text-gray-900 placeholder:text-gray-500" /><input type="text" placeholder="Value" value={option.value || ''} onChange={(e) => handleOptionChange(index, 'value', e.target.value)} className="w-full p-2 border border-gray-300 rounded text-gray-900 placeholder:text-gray-500" /><button type="button" onClick={() => removeOption(index)} className="p-2 text-red-600 hover:bg-red-100 rounded"><Trash2 size={18} /></button></div>
                    <div><label className="text-sm font-medium text-gray-600">Linked Evaluation Items</label><select multiple value={option.recommendations || []} onChange={(e) => { const selectedRecs = Array.from(e.target.selectedOptions, opt => opt.value); handleOptionChange(index, 'recommendations', selectedRecs); }} className="w-full p-2 border border-gray-300 rounded-lg bg-white h-24 text-gray-900" disabled={loading}>{evaluationItems.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addOption} className="mt-2 flex items-center text-brand-purple"><Plus size={16} className="mr-1" /> Add Option</button>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Linked Resources</label>
              <button type="button" onClick={() => setIsSuggestingResource(true)} className="text-sm text-brand-purple hover:text-brand-purple-dark font-medium p-1">
                + Suggest New Resource
              </button>
            </div>
            <select name="linked_resources" multiple value={formData.linked_resources || []} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg bg-white h-32 text-gray-900" disabled={loading}>
              {allResources.map(res => <option key={res.id} value={res.id}>{res.title}</option>)}
            </select>
            {newlySuggestedResources.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-600">New resources to be suggested:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {newlySuggestedResources.map((res, index) => (
                    <li key={index} className="text-sm text-gray-800 flex items-center justify-between">
                      <span>{res.title} ({res.type})</span>
                      <button type="button" onClick={() => handleRemoveNewResource(index)} className="text-red-500 hover:text-red-700">
                        <XCircle size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6"><button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-gray-800">Cancel</button><button type="submit" className="bg-brand-purple text-white px-4 py-2 rounded-lg hover:bg-brand-purple-dark">Continue</button></div>
        </form>
      </div>
    </div>
  );
};

export default QuestionForm;