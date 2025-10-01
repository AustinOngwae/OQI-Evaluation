import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiEdit3, FiSave, FiPlus, FiTrash2, FiEye, FiMessageCircle } = FiIcons;

const QuestionnaireEditor = ({ onSwitchToFiller }) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadQuestions();
    loadSuggestions();
  }, []);

  const loadQuestions = () => {
    // Load from localStorage or default questions
    const stored = localStorage.getItem('questionnaire_questions');
    if (stored) {
      setQuestions(JSON.parse(stored));
    } else {
      setQuestions(getDefaultQuestions());
    }
  };

  const loadSuggestions = () => {
    const stored = localStorage.getItem('questionnaire_suggestions');
    if (stored) {
      setSuggestions(JSON.parse(stored));
    }
  };

  const saveQuestions = (updatedQuestions) => {
    setQuestions(updatedQuestions);
    localStorage.setItem('questionnaire_questions', JSON.stringify(updatedQuestions));
  };

  const handleEditQuestion = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    setEditingQuestion({ ...question });
  };

  const handleSaveQuestion = () => {
    const updatedQuestions = questions.map(q => 
      q.id === editingQuestion.id ? editingQuestion : q
    );
    saveQuestions(updatedQuestions);
    setEditingQuestion(null);
  };

  const handleAddQuestion = (stepId) => {
    const newQuestion = {
      id: `q_${Date.now()}`,
      stepId,
      type: 'radio',
      title: 'New Question',
      description: 'Question description',
      required: false,
      options: []
    };
    setEditingQuestion(newQuestion);
  };

  const handleDeleteQuestion = (questionId) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = questions.filter(q => q.id !== questionId);
      saveQuestions(updatedQuestions);
    }
  };

  const applySuggestion = (suggestion) => {
    if (suggestion.type === 'edit') {
      const updatedQuestions = questions.map(q => 
        q.id === suggestion.questionId ? { ...q, ...suggestion.changes } : q
      );
      saveQuestions(updatedQuestions);
    } else if (suggestion.type === 'add') {
      const newQuestion = {
        id: `q_${Date.now()}`,
        ...suggestion.questionData
      };
      saveQuestions([...questions, newQuestion]);
    }
    
    // Mark suggestion as applied
    const updatedSuggestions = suggestions.map(s => 
      s.id === suggestion.id ? { ...s, status: 'applied' } : s
    );
    setSuggestions(updatedSuggestions);
    localStorage.setItem('questionnaire_suggestions', JSON.stringify(updatedSuggestions));
  };

  const getDefaultQuestions = () => {
    return [
      {
        id: 'planning_focus',
        stepId: 1,
        type: 'radio',
        title: 'What is the primary focus of your current planning effort?',
        description: 'Define the scope of your work and the local public health context.',
        required: true,
        options: [
          { value: 'new_development', label: 'New Development / Master Plan', description: 'Designing a new district or large-scale project.' },
          { value: 'retrofitting', label: 'Retrofitting / Urban Regeneration', description: 'Upgrading an existing neighborhood.' },
          { value: 'policy', label: 'City-Wide Policy & Zoning', description: 'Developing comprehensive plans or codes.' }
        ]
      },
      {
        id: 'transmission_level',
        stepId: 1,
        type: 'select',
        title: 'What is the current Aedes-borne disease situation?',
        required: true,
        options: [
          { value: 'epidemic', label: 'Epidemic Transmission (Regular, large-scale outbreaks)' },
          { value: 'seasonal', label: 'Regular Seasonal Transmission (Predictable annual increases)' },
          { value: 'sporadic', label: 'Sporadic Transmission (Occasional, isolated cases)' },
          { value: 'present_no_local', label: 'Aedes Present, No Local Transmission (Vector is present)' },
          { value: 'no_aedes', label: 'No Aedes present (Preventative planning)' }
        ]
      }
    ];
  };

  const QuestionEditor = ({ question, onSave, onCancel }) => (
    <div className="bg-white p-6 rounded-lg border-2 border-teal-200 shadow-lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Question Title</label>
          <input
            type="text"
            value={question.title}
            onChange={(e) => setEditingQuestion({ ...question, title: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={question.description || ''}
            onChange={(e) => setEditingQuestion({ ...question, description: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            rows="2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
          <select
            value={question.type}
            onChange={(e) => setEditingQuestion({ ...question, type: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="radio">Multiple Choice (Single)</option>
            <option value="checkbox">Multiple Choice (Multiple)</option>
            <option value="select">Dropdown</option>
            <option value="text">Text Input</option>
          </select>
        </div>

        {['radio', 'checkbox', 'select'].includes(question.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => {
                      const newOptions = [...question.options];
                      newOptions[index] = { ...option, label: e.target.value };
                      setEditingQuestion({ ...question, options: newOptions });
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                    placeholder="Option label"
                  />
                  <button
                    onClick={() => {
                      const newOptions = question.options.filter((_, i) => i !== index);
                      setEditingQuestion({ ...question, options: newOptions });
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <SafeIcon icon={FiTrash2} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newOptions = [...(question.options || []), { value: '', label: '', description: '' }];
                  setEditingQuestion({ ...question, options: newOptions });
                }}
                className="flex items-center text-teal-600 hover:text-teal-700"
              >
                <SafeIcon icon={FiPlus} className="mr-1" /> Add Option
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(e) => setEditingQuestion({ ...question, required: e.target.checked })}
            className="mr-2"
          />
          <label className="text-sm text-gray-700">Required field</label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onSave}
            className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
          >
            <SafeIcon icon={FiSave} className="mr-2" /> Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Questionnaire Editor</h1>
          <p className="text-gray-600 mt-2">Modify questions and review suggestions from the community</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <SafeIcon icon={FiMessageCircle} className="mr-2" />
            Suggestions ({suggestions.filter(s => s.status === 'pending').length})
          </button>
          <button
            onClick={onSwitchToFiller}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <SafeIcon icon={FiEye} className="mr-2" /> Preview Questionnaire
          </button>
        </div>
      </div>

      {showSuggestions && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Community Suggestions</h2>
          <div className="space-y-4">
            {suggestions.filter(s => s.status === 'pending').map(suggestion => (
              <div key={suggestion.id} className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{suggestion.title}</h3>
                    <p className="text-gray-600 mt-1">{suggestion.description}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Suggested by: {suggestion.author} • {new Date(suggestion.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => applySuggestion(suggestion)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Apply
                    </button>
                    <button className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400">
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {suggestions.filter(s => s.status === 'pending').length === 0 && (
              <p className="text-blue-600">No pending suggestions at the moment.</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {[1, 2, 3, 4].map(stepId => (
          <div key={stepId} className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Step {stepId}</h2>
              <button
                onClick={() => handleAddQuestion(stepId)}
                className="flex items-center text-teal-600 hover:text-teal-700"
              >
                <SafeIcon icon={FiPlus} className="mr-1" /> Add Question
              </button>
            </div>
            
            <div className="space-y-4">
              {questions.filter(q => q.stepId === stepId).map(question => (
                <div key={question.id}>
                  {editingQuestion?.id === question.id ? (
                    <QuestionEditor
                      question={editingQuestion}
                      onSave={handleSaveQuestion}
                      onCancel={() => setEditingQuestion(null)}
                    />
                  ) : (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{question.title}</h3>
                          {question.description && (
                            <p className="text-gray-600 text-sm mt-1">{question.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Type: {question.type} • {question.required ? 'Required' : 'Optional'}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditQuestion(question.id)}
                            className="p-2 text-teal-600 hover:bg-teal-50 rounded"
                          >
                            <SafeIcon icon={FiEdit3} />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <SafeIcon icon={FiTrash2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionnaireEditor;