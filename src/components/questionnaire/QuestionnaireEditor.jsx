import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import { Eye, Plus, Edit3, Trash2, Send } from 'lucide-react';
import QuestionForm from './QuestionForm';

// A component for the suggestion modal
const SuggestionModal = ({ user, context, onClose, onSubmitted }) => {
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    const toastId = toast.loading('Submitting suggestion...');
    try {
      const { error } = await supabase.from('question_suggestions').insert({
        author_id: user.id,
        author_name_context: user.first_name || user.email,
        question_id: context.question?.id,
        question_title_context: context.question?.title || 'New Question',
        suggestion_type: context.type,
        payload: context.payload,
        comment: comment,
      });
      if (error) throw error;
      toast.success('Suggestion submitted for review.', { id: toastId });
      onSubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting suggestion:', error.message);
      toast.error(`Submission failed: ${error.message}`, { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {context.type === 'add' && 'Suggest a New Question'}
          {context.type === 'edit' && 'Suggest an Edit'}
          {context.type === 'delete' && 'Suggest Deleting Question'}
        </h2>
        <p className="text-gray-600 mb-4">
          Your suggestion will be sent to an administrator for review. Please provide a brief justification.
        </p>
        {context.type === 'delete' && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4">
            <p className="font-semibold text-red-800">You are suggesting to delete:</p>
            <p className="text-red-700">"{context.question.title}"</p>
          </div>
        )}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          rows="3"
          placeholder="e.g., 'This question could be clearer...' or 'This option is missing...'"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!comment}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={16} className="mr-2" /> Submit Suggestion
          </button>
        </div>
      </div>
    </div>
  );
};

const QuestionnaireEditor = ({ user, onSwitchToFiller }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [suggestionContext, setSuggestionContext] = useState(null);
  const [formModalState, setFormModalState] = useState({ isOpen: false, mode: null, question: null });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('questions').select('*').order('step_id', { ascending: true });
      if (error) throw error;
      setQuestions(data);
    } catch (err) {
      console.error('Error loading questions:', err.message);
      setError('Failed to load questions.');
      toast.error('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    if (!isAdmin) {
      // Non-admin submits a suggestion
      const type = formModalState.mode;
      const question = formModalState.question;
      // Remove id from payload for 'add' suggestions
      if (type === 'add') {
        delete formData.id;
      }
      setSuggestionContext({ type, question, payload: formData });
      setFormModalState({ isOpen: false, mode: null, question: null });
    } else {
      // Admin performs direct action
      const { mode, question } = formModalState;
      const toastId = toast.loading(mode === 'add' ? 'Adding question...' : 'Updating question...');
      try {
        let error;
        if (mode === 'add') {
          // Remove temporary or existing ID before insert
          const { id, ...insertData } = formData;
          const { error: insertError } = await supabase.from('questions').insert(insertData);
          error = insertError;
        } else {
          const { error: updateError } = await supabase.from('questions').update(formData).eq('id', question.id);
          error = updateError;
        }
        if (error) throw error;
        toast.success(mode === 'add' ? 'Question added.' : 'Question updated.', { id: toastId });
        setFormModalState({ isOpen: false, mode: null, question: null });
        loadQuestions();
      } catch (err) {
        toast.error(`Action failed: ${err.message}`, { id: toastId });
      }
    }
  };

  // Handlers to open modals
  const openAddModal = (stepId) => {
    setFormModalState({ isOpen: true, mode: 'add', question: { step_id: stepId, type: 'text', options: [] } });
  };

  const openEditModal = (question) => {
    setFormModalState({ isOpen: true, mode: 'edit', question });
  };

  const openDeleteSuggestionModal = (question) => {
    setSuggestionContext({ type: 'delete', question, payload: { id: question.id } });
  };

  // Admin direct delete
  const handleDeleteQuestion = async (questionId) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to permanently delete this question?')) {
      const toastId = toast.loading('Deleting question...');
      try {
        const { error } = await supabase.from('questions').delete().eq('id', questionId);
        if (error) throw error;
        toast.success('Question deleted.', { id: toastId });
        loadQuestions();
      } catch (err) {
        toast.error(`Deletion failed: ${err.message}`, { id: toastId });
      }
    }
  };

  if (loading) return <div className="p-6 text-center">Loading editor...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {suggestionContext && (
        <SuggestionModal
          user={user}
          context={suggestionContext}
          onClose={() => setSuggestionContext(null)}
          onSubmitted={() => { /* Can add refresh logic here if needed */ }}
        />
      )}
      {formModalState.isOpen && (
        <QuestionForm
          question={formModalState.question}
          mode={formModalState.mode}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormModalState({ isOpen: false, mode: null, question: null })}
        />
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Questionnaire Editor</h1>
          <p className="text-gray-600 mt-2">
            {!isAdmin
              ? 'Review questions and suggest improvements for admin approval.'
              : 'Directly manage all questions in the system.'}
          </p>
        </div>
        <button onClick={onSwitchToFiller} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          <Eye size={18} className="mr-2" /> Preview Questionnaire
        </button>
      </div>

      <div className="space-y-8">
        {[1, 2, 3, 4].map(stepId => (
          <div key={stepId} className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Step {stepId}</h2>
              <button
                onClick={() => openAddModal(stepId)}
                className="flex items-center text-teal-600 hover:text-teal-700"
              >
                <Plus size={18} className="mr-1" /> {!isAdmin ? 'Suggest New Question' : 'Add Question'}
              </button>
            </div>
            
            <div className="space-y-4">
              {questions.filter(q => q.step_id === stepId).map(question => (
                <div key={question.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{question.title}</h3>
                      {question.description && <p className="text-gray-600 text-sm mt-1">{question.description}</p>}
                      <p className="text-xs text-gray-500 mt-2">Type: {question.type} • {question.required ? 'Required' : 'Optional'}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => openEditModal(question)}
                        className="p-2 text-teal-600 hover:bg-teal-50 rounded"
                        title={!isAdmin ? 'Suggest Edit' : 'Edit Question'}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => !isAdmin ? openDeleteSuggestionModal(question) : handleDeleteQuestion(question.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title={!isAdmin ? 'Suggest Deletion' : 'Delete Question'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {questions.filter(q => q.step_id === stepId).length === 0 && (
                <div className="text-center text-gray-500 py-4">No questions in this step.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionnaireEditor;